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
      sendToQueue: jest.fn()
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

    expect(mockRedisClient.tryAcquire).toHaveBeenCalledWith(event.eventId);
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

    expect(mockRedisClient.tryAcquire).toHaveBeenCalledWith(event.eventId);
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
        headers: expect.objectContaining({
          'x-death-reason': 'json_parse_error'
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
        headers: expect.objectContaining({
          'x-death-reason': 'Persistent database failure'
        })
      })
    );
    expect(mockConsumeChannel.ack).toHaveBeenCalledWith(msg);
  });
});
