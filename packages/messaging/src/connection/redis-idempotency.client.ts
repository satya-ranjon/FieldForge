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
   * Returns true if acquired (first time seeing this event).
   * Returns false if duplicate delivery detected.
   */
  async tryAcquire(eventId: string): Promise<boolean> {
    const key = this.getKey(eventId);
    const result = await this.client.set(key, 'in-progress', 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');
    return result === 'OK';
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
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
