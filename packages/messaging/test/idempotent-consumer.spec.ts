import { IdempotentConsumer } from '../src/consumer/idempotent-consumer';
import { RabbitMQConnectionManager } from '../src/connection/rabbitmq-connection.manager';
import { RedisIdempotencyClient } from '../src/connection/redis-idempotency.client';
import { EVENT_DEAD_LETTER_EXCHANGE, HEADER_RETRY_COUNT, MAX_RETRY_COUNT } from '../src/constants';
import type { ConsumeMessage } from 'amqplib';
import { EventType, createEvent } from '@fieldforge/contracts';
import type { MessagingOptions } from '../src/config/messaging.config';

interface MockConsumeChannel {
  consume: jest.Mock;
  ack: jest.Mock;
  cancel: jest.Mock;
}

interface MockPublishChannel {
  publish: jest.Mock;
  sendToQueue: jest.Mock;
}

describe('IdempotentConsumer', () => {
  let consumer: IdempotentConsumer;
  let mockConnectionManager: jest.Mocked<RabbitMQConnectionManager>;
  let mockRedisClient: jest.Mocked<RedisIdempotencyClient>;
  let mockConsumeChannel: MockConsumeChannel;
  let mockPublishChannel: MockPublishChannel;
  let registeredConsumeCallback: (msg: ConsumeMessage | null) => Promise<void>;

  const mockOptions: MessagingOptions = {
    rabbitUrl: 'amqp://mock',
    redisHost: '127.0.0.1',
    redisPort: 6379,
    exchange: 'fieldforge.events.topic',
    dlxExchange: EVENT_DEAD_LETTER_EXCHANGE,
    serviceName: 'test-service'
  };

  beforeEach(() => {
    mockConsumeChannel = {
      consume: jest.fn((queue, callback) => {
        registeredConsumeCallback = callback;
        return Promise.resolve({ consumerTag: 'mock-consumer-tag' });
      }),
      ack: jest.fn(),
      cancel: jest.fn()
    };

    mockPublishChannel = {
      publish: jest.fn(),
      sendToQueue: jest.fn((queue, content, options, callback) => {
        if (typeof callback === 'function') {
          callback(null);
        }
        return true;
      })
    };

    mockConnectionManager = {
      getConsumeChannel: jest.fn().mockResolvedValue(mockConsumeChannel),
      getPublishChannel: jest.fn().mockResolvedValue(mockPublishChannel),
      assertQueueAndBind: jest.fn().mockResolvedValue(undefined),
      ensureConnected: jest.fn(),
      onApplicationShutdown: jest.fn()
    } as unknown as jest.Mocked<RabbitMQConnectionManager>;

    mockRedisClient = {
      tryAcquire: jest.fn().mockResolvedValue(true),
      markRetrying: jest.fn().mockResolvedValue(undefined),
      markCompleted: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      isProcessed: jest.fn().mockResolvedValue(false),
      onApplicationShutdown: jest.fn()
    } as unknown as jest.Mocked<RedisIdempotencyClient>;

    consumer = new IdempotentConsumer(mockConnectionManager, mockRedisClient, mockOptions);
  });

  it('subscribes and executes handler on first delivery, completing successfully', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    await consumer.subscribe('test.queue', ['work_order.lifecycle.published'], handler);

    expect(mockConnectionManager.assertQueueAndBind).toHaveBeenCalledWith('test.queue', [
      'work_order.lifecycle.published'
    ]);

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      { workOrderId: 'wo-1', title: 'Task' },
      'corr-123'
    );

    const msg = {
      content: Buffer.from(JSON.stringify(event)),
      properties: { headers: {} }
    } as unknown as ConsumeMessage;

    await registeredConsumeCallback(msg);

    expect(mockRedisClient.tryAcquire).toHaveBeenCalledWith(event.eventId, 0);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: event.eventId }),
      expect.anything()
    );
    expect(mockRedisClient.markCompleted).toHaveBeenCalledWith(event.eventId);
    expect(mockConsumeChannel.ack).toHaveBeenCalledWith(msg);
  });

  it('detects duplicate message and ACKs without calling the handler (no-op)', async () => {
    mockRedisClient.tryAcquire.mockResolvedValue(false); // Duplicate!

    const handler = jest.fn().mockResolvedValue(undefined);
    await consumer.subscribe('test.queue', ['work_order.lifecycle.published'], handler);

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      { workOrderId: 'wo-1', title: 'Task' },
      'corr-123'
    );

    const msg = {
      content: Buffer.from(JSON.stringify(event)),
      properties: { headers: {} }
    } as unknown as ConsumeMessage;

    await registeredConsumeCallback(msg);

    expect(mockRedisClient.tryAcquire).toHaveBeenCalledWith(event.eventId, 0);
    expect(handler).not.toHaveBeenCalled();
    expect(mockRedisClient.markCompleted).not.toHaveBeenCalled();
    expect(mockConsumeChannel.ack).toHaveBeenCalledWith(msg); // ACKed duplicate to drop it safely
  });

  it('routes directly to DLQ when JSON is unparseable', async () => {
    const handler = jest.fn();
    await consumer.subscribe('test.queue', ['work_order.lifecycle.published'], handler);

    const msg = {
      content: Buffer.from('invalid-json{{{'),
      properties: { headers: {} }
    } as unknown as ConsumeMessage;

    await registeredConsumeCallback(msg);

    expect(handler).not.toHaveBeenCalled();
    expect(mockPublishChannel.publish).toHaveBeenCalledWith(
      EVENT_DEAD_LETTER_EXCHANGE,
      'test.queue.dlq',
      msg.content,
      expect.objectContaining({
        persistent: true,
        headers: expect.objectContaining({
          'x-death-reason': 'json_parse_error'
        })
      })
    );
    expect(mockConsumeChannel.ack).toHaveBeenCalledWith(msg);
  });

  it('schedules broker-native retry to <queue>.retry with per-message TTL and marks retrying in Redis upon transient failure', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Transient network timeout'));
    await consumer.subscribe('test.queue', ['work_order.lifecycle.published'], handler);

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      { workOrderId: 'wo-1', title: 'Task' },
      'corr-retry-123'
    );

    const msg = {
      content: Buffer.from(JSON.stringify(event)),
      properties: { headers: {} }
    } as unknown as ConsumeMessage;

    await registeredConsumeCallback(msg);

    // 1. Must NOT use in-memory setTimeout; must publish directly to broker retry queue
    expect(mockPublishChannel.sendToQueue).toHaveBeenCalledWith(
      'test.queue.retry',
      msg.content,
      expect.objectContaining({
        persistent: true,
        expiration: '1000',
        headers: expect.objectContaining({
          [HEADER_RETRY_COUNT]: 1,
          'x-correlation-id': 'corr-retry-123',
          'x-event-id': event.eventId
        })
      }),
      expect.any(Function)
    );

    // 2. Must mark event as retrying in Redis to block premature duplicate delivery
    expect(mockRedisClient.markRetrying).toHaveBeenCalledWith(event.eventId, 1);

    // 3. Must ACK original message only AFTER retry is durably enqueued in RabbitMQ
    expect(mockConsumeChannel.ack).toHaveBeenCalledWith(msg);
  });

  it('allows retried message (retryCount > 0) to re-acquire processing lock and complete successfully', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    await consumer.subscribe('test.queue', ['work_order.lifecycle.published'], handler);

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      { workOrderId: 'wo-1', title: 'Task' },
      'corr-retry-456'
    );

    const msg = {
      content: Buffer.from(JSON.stringify(event)),
      properties: {
        headers: {
          [HEADER_RETRY_COUNT]: 1 // Redelivered after first retry
        }
      }
    } as unknown as ConsumeMessage;

    await registeredConsumeCallback(msg);

    // Idempotency check with retryCount = 1
    expect(mockRedisClient.tryAcquire).toHaveBeenCalledWith(event.eventId, 1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockRedisClient.markCompleted).toHaveBeenCalledWith(event.eventId);
    expect(mockConsumeChannel.ack).toHaveBeenCalledWith(msg);
  });

  it('routes to DLQ when enqueueing to retry queue fails', async () => {
    mockPublishChannel.sendToQueue = jest.fn((queue, content, options, callback) => {
      if (typeof callback === 'function') {
        callback(new Error('Broker channel buffer error'));
      }
      return false;
    });

    const handler = jest.fn().mockRejectedValue(new Error('Database hiccup'));
    await consumer.subscribe('test.queue', ['work_order.lifecycle.published'], handler);

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      { workOrderId: 'wo-1', title: 'Task' },
      'corr-fail'
    );

    const msg = {
      content: Buffer.from(JSON.stringify(event)),
      properties: { headers: {} }
    } as unknown as ConsumeMessage;

    await registeredConsumeCallback(msg);

    expect(mockPublishChannel.publish).toHaveBeenCalledWith(
      EVENT_DEAD_LETTER_EXCHANGE,
      'test.queue.dlq',
      msg.content,
      expect.objectContaining({
        persistent: true,
        headers: expect.objectContaining({
          'x-death-reason': 'retry_enqueue_failed'
        })
      })
    );
    expect(mockConsumeChannel.ack).toHaveBeenCalledWith(msg);
  });

  it('routes to DLQ and marks failed in Redis when retries are exhausted', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Persistent database failure'));
    await consumer.subscribe('test.queue', ['work_order.lifecycle.published'], handler);

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      { workOrderId: 'wo-1', title: 'Task' },
      'corr-123'
    );

    const msg = {
      content: Buffer.from(JSON.stringify(event)),
      properties: {
        headers: {
          [HEADER_RETRY_COUNT]: MAX_RETRY_COUNT // Retry count 3 -> exhausted!
        }
      }
    } as unknown as ConsumeMessage;

    await registeredConsumeCallback(msg);

    expect(mockRedisClient.markFailed).toHaveBeenCalledWith(event.eventId, 'max_retries_exceeded');
    expect(mockPublishChannel.publish).toHaveBeenCalledWith(
      EVENT_DEAD_LETTER_EXCHANGE,
      'test.queue.dlq',
      msg.content,
      expect.objectContaining({
        persistent: true,
        headers: expect.objectContaining({
          'x-death-reason': 'Persistent database failure'
        })
      })
    );
    expect(mockConsumeChannel.ack).toHaveBeenCalledWith(msg);
  });
});
