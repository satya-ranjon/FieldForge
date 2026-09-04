import { EventPublisher } from '../src/publisher/event-publisher';
import { RabbitMQConnectionManager } from '../src/connection/rabbitmq-connection.manager';
import {
  EVENT_EXCHANGE,
  HEADER_CORRELATION_ID,
  HEADER_EVENT_ID,
  HEADER_EVENT_TYPE,
  HEADER_RETRY_COUNT
} from '../src/constants';
import { EventType, createEvent } from '@fieldforge/contracts';
import type { MessagingOptions } from '../src/config/messaging.config';

interface MockPublishChannel {
  publish: jest.Mock;
  once: jest.Mock;
}

describe('EventPublisher', () => {
  let publisher: EventPublisher;
  let mockConnectionManager: jest.Mocked<RabbitMQConnectionManager>;
  let mockPublishChannel: MockPublishChannel;

  const mockOptions: MessagingOptions = {
    rabbitUrl: 'amqp://mock',
    redisHost: '127.0.0.1',
    redisPort: 6379,
    exchange: EVENT_EXCHANGE,
    dlxExchange: 'fieldforge.events.dlx',
    serviceName: 'test-service'
  };

  beforeEach(() => {
    mockPublishChannel = {
      publish: jest.fn((exchange, routingKey, content, options, callback) => {
        if (callback) {
          callback(null);
        }
        return true;
      }),
      once: jest.fn()
    };

    mockConnectionManager = {
      getPublishChannel: jest.fn().mockResolvedValue(mockPublishChannel),
      getConsumeChannel: jest.fn(),
      ensureConnected: jest.fn(),
      assertQueueAndBind: jest.fn(),
      onApplicationShutdown: jest.fn()
    } as unknown as jest.Mocked<RabbitMQConnectionManager>;

    publisher = new EventPublisher(mockConnectionManager, mockOptions);
  });

  it('publishes event to the central topic exchange with correct headers and persistence', async () => {
    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      {
        workOrderId: 'wo-123',
        buyerId: 'buyer-456',
        title: 'POS terminal repair',
        maxBudgetMinor: 25000,
        latitude: 37.7749,
        longitude: -122.4194
      },
      'correlation-abc-789'
    );

    await publisher.publish(event);

    expect(mockConnectionManager.getPublishChannel).toHaveBeenCalled();
    expect(mockPublishChannel.publish).toHaveBeenCalledWith(
      EVENT_EXCHANGE,
      EventType.WORK_ORDER_PUBLISHED,
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        correlationId: 'correlation-abc-789',
        headers: expect.objectContaining({
          [HEADER_CORRELATION_ID]: 'correlation-abc-789',
          [HEADER_EVENT_ID]: event.eventId,
          [HEADER_EVENT_TYPE]: EventType.WORK_ORDER_PUBLISHED,
          [HEADER_RETRY_COUNT]: 0
        })
      }),
      expect.any(Function)
    );

    // Verify payload serialization
    const bufferArg = mockPublishChannel.publish.mock.calls[0][2] as Buffer;
    const parsed = JSON.parse(bufferArg.toString('utf8'));
    expect(parsed.eventId).toBe(event.eventId);
    expect(parsed.payload.title).toBe('POS terminal repair');
  });

  it('rejects if broker NACKs the published message', async () => {
    mockPublishChannel.publish = jest.fn((exchange, routingKey, content, options, callback) => {
      callback(new Error('Broker disk full'));
      return false;
    });

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      {
        workOrderId: 'wo-123',
        buyerId: 'buyer-456',
        title: 'POS terminal repair',
        maxBudgetMinor: 25000,
        latitude: 37.7749,
        longitude: -122.4194
      },
      'correlation-abc-789'
    );

    await expect(publisher.publish(event)).rejects.toThrow('Broker NACK');
  });
});
