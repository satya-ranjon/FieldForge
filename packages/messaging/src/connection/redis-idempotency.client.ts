import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { IDEMPOTENCY_TTL_SECONDS, MESSAGING_MODULE_OPTIONS } from '../constants';
import type { MessagingOptions } from '../config/messaging.config';

@Injectable()
export class RedisIdempotencyClient implements OnApplicationShutdown {
  private readonly client: Redis;

  constructor(@Inject(MESSAGING_MODULE_OPTIONS) options: MessagingOptions) {
    this.client = new Redis({
      host: options.redisHost,
      port: options.redisPort,
      password: options.redisPassword || undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 2000);
      }
    });

    this.client.on('error', (err) => {
      // Avoid unhandled rejection crashing the process if Redis fluctuates in local tests
      console.error(`[RedisIdempotencyClient] Redis error:`, err.message);
    });
  }

  get rawClient(): Redis {
    return this.client;
  }

  private getKey(eventId: string): string {
    return `fieldforge:idempotency:event:${eventId}`;
  }

  /**
   * Attempts to atomically acquire processing lock for this eventId.
   * If retryCount == 0 (fresh delivery):
   *   Acquires lock only if key does not exist (SET ... NX).
   *   Returns false if key exists (in-progress, retrying, completed, or failed).
   * If retryCount > 0 (broker-scheduled retry attempt):
   *   Acquires lock unless already marked completed.
   *   Atomically transitions state to 'in-progress' with 7-day TTL.
   */
  async tryAcquire(eventId: string, retryCount = 0): Promise<boolean> {
    const key = this.getKey(eventId);
    if (retryCount === 0) {
      const result = await this.client.set(key, 'in-progress', 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');
      return result === 'OK';
    }

    const script = `
      local current = redis.call('GET', KEYS[1])
      if current == 'completed' then
        return 0
      else
        redis.call('SET', KEYS[1], 'in-progress', 'EX', ARGV[1])
        return 1
      end
    `;
    const result = await this.client.eval(script, 1, key, String(IDEMPOTENCY_TTL_SECONDS));
    return result === 1;
  }

  /**
   * Marks the event as in retry state, recording the next retry count.
   * Retains the key in Redis to prevent parallel redelivery of fresh duplicates
   * while the message waits in the broker retry queue.
   */
  async markRetrying(eventId: string, retryCount: number): Promise<void> {
    const key = this.getKey(eventId);
    await this.client.set(key, `retrying:${retryCount}`, 'EX', IDEMPOTENCY_TTL_SECONDS);
  }

  /**
   * Marks the event as successfully processed with 7-day TTL.
   */
  async markCompleted(eventId: string): Promise<void> {
    const key = this.getKey(eventId);
    await this.client.set(key, 'completed', 'EX', IDEMPOTENCY_TTL_SECONDS);
  }

  /**
   * Marks the event as permanently failed / dead-lettered with 7-day TTL.
   */
  async markFailed(eventId: string, reason?: string): Promise<void> {
    const key = this.getKey(eventId);
    await this.client.set(key, reason || 'failed', 'EX', IDEMPOTENCY_TTL_SECONDS);
  }

  /**
   * Releases the processing lock so a bounded retry can re-acquire it.
   */
  async release(eventId: string): Promise<void> {
    const key = this.getKey(eventId);
    await this.client.del(key);
  }

  /**
   * Checks if an event is already in the deduplication cache.
   */
  async isProcessed(eventId: string): Promise<boolean> {
    const key = this.getKey(eventId);
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      this.client.disconnect();
    } catch {
      // Ignored
    }
  }
}
