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

  it('markRetrying blocks fresh duplicate delivery but allows retry re-acquisition', async () => {
    const retryingEventId = `retrying-event-${Date.now()}`;
    await client.tryAcquire(retryingEventId, 0);

    // Transition to retrying state for retry attempt 1
    await client.markRetrying(retryingEventId, 1);

    // A fresh duplicate delivery (retryCount = 0) must be rejected
    const freshDuplicate = await client.tryAcquire(retryingEventId, 0);
    expect(freshDuplicate).toBe(false);

    // The legitimate broker retry (retryCount = 1) must be allowed
    const retryAcquired = await client.tryAcquire(retryingEventId, 1);
    expect(retryAcquired).toBe(true);

    // After completion, further retries must be rejected
    await client.markCompleted(retryingEventId);
    const retryAfterComplete = await client.tryAcquire(retryingEventId, 2);
    expect(retryAfterComplete).toBe(false);

    await client.rawClient.del(`fieldforge:idempotency:event:${retryingEventId}`);
  });
});
