import { RedisIdempotencyClient } from '../src/connection/redis-idempotency.client';
import { resolveMessagingOptions } from '../src/config/messaging.config';

describe('RedisIdempotencyClient', () => {
  let client: RedisIdempotencyClient;
  const testEventId = `test-event-${Date.now()}-${Math.random()}`;

  beforeAll(() => {
    const options = resolveMessagingOptions();
    client = new RedisIdempotencyClient(options);
  });

  afterAll(async () => {
    await client.rawClient.del(`fieldforge:idempotency:event:${testEventId}`);
    await client.onApplicationShutdown();
  });

  it('acquires lock on first attempt and rejects duplicate delivery', async () => {
    const firstAcquire = await client.tryAcquire(testEventId);
    expect(firstAcquire).toBe(true);

    // Immediate second attempt with same eventId should fail
    const duplicateAcquire = await client.tryAcquire(testEventId);
    expect(duplicateAcquire).toBe(false);
  });

  it('marks event as completed preserving key existence', async () => {
    await client.markCompleted(testEventId);
    const exists = await client.isProcessed(testEventId);
    expect(exists).toBe(true);
  });

  it('releases lock allowing re-acquisition (used for retry backoff)', async () => {
    const retryEventId = `retry-event-${Date.now()}`;
    await client.tryAcquire(retryEventId);
    expect(await client.tryAcquire(retryEventId)).toBe(false);

    await client.release(retryEventId);

    const reacquired = await client.tryAcquire(retryEventId);
    expect(reacquired).toBe(true);

    await client.rawClient.del(`fieldforge:idempotency:event:${retryEventId}`);
  });
});
