import { RabbitMQConnectionManager } from '../src/connection/rabbitmq-connection.manager';
import { RedisIdempotencyClient } from '../src/connection/redis-idempotency.client';
import { EventPublisher } from '../src/publisher/event-publisher';
import { IdempotentConsumer } from '../src/consumer/idempotent-consumer';
import { resolveMessagingOptions } from '../src/config/messaging.config';
import { EventType, createEvent, type EventEnvelope } from '@fieldforge/contracts';

jest.setTimeout(20000);

describe('Messaging Integration (RabbitMQ + Redis)', () => {
  let connectionManager: RabbitMQConnectionManager;
  let redisClient: RedisIdempotencyClient;
  let publisher: EventPublisher;
  let consumer: IdempotentConsumer;

  const testQueue = `fieldforge.test.queue.${Date.now()}`;
  const testRoutingKey = 'work_order.lifecycle.published';

  beforeAll(async () => {
    const options = resolveMessagingOptions({ serviceName: 'integration-test' });
    connectionManager = new RabbitMQConnectionManager(options);
    redisClient = new RedisIdempotencyClient(options);
    publisher = new EventPublisher(connectionManager, options);
    consumer = new IdempotentConsumer(connectionManager, redisClient, options);

    await connectionManager.ensureConnected();
  });

  afterAll(async () => {
    try {
      const channel = await connectionManager.getConsumeChannel();
      await channel.deleteQueue(testQueue);
      await channel.deleteQueue(`${testQueue}.dlq`);
    } catch {
      // Ignored
    }
    await consumer.onApplicationShutdown();
    await connectionManager.onApplicationShutdown();
    await redisClient.onApplicationShutdown();
  });

  it('publishes and consumes an event end-to-end over RabbitMQ with Redis deduplication', async () => {
    const testEvent = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      {
        workOrderId: 'wo-integration-1',
        buyerId: 'buyer-1',
        title: 'Integration Test POS Swap',
        maxBudgetMinor: 50000,
        latitude: 37.77,
        longitude: -122.41
      },
      'correlation-int-123'
    );

    let receivedEnvelope: EventEnvelope<unknown> | null = null;
    let invocations = 0;

    let resolveReceived: () => void;
    const receivedPromise = new Promise<void>((resolve) => {
      resolveReceived = resolve;
    });

    // 1. Subscribe and await queue assertion & topic exchange binding
    await consumer.subscribe(testQueue, [testRoutingKey], async (envelope) => {
      receivedEnvelope = envelope;
      invocations++;
      resolveReceived();
    });

    // 2. Publish event
    await publisher.publish(testEvent);

    // 3. Wait for delivery
    await Promise.race([
      receivedPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout waiting for message')), 8000)
      )
    ]);

    if (!receivedEnvelope) {
      throw new Error('Message was not received');
    }
    const env = receivedEnvelope as EventEnvelope<{ title: string }>;
    expect(env.eventId).toBe(testEvent.eventId);
    expect(env.payload.title).toBe('Integration Test POS Swap');
    expect(invocations).toBe(1);

    // 4. Verify Redis has marked it completed
    const isCompleted = await redisClient.isProcessed(testEvent.eventId);
    expect(isCompleted).toBe(true);

    // 5. Test Idempotency: Re-publish identical event
    await publisher.publish(testEvent);

    // Allow broker to deliver
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Handler invocation count should still be 1 because Redis suppressed the duplicate
    expect(invocations).toBe(1);
  });
});
