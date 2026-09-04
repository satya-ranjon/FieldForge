import type { ConsumeMessage } from 'amqplib';
import { HEADER_RETRY_COUNT, MAX_RETRY_COUNT } from '../constants';

export class RetryPolicy {
  /**
   * Reads the current retry count from message headers.
   */
  static getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers || {};
    const count = headers[HEADER_RETRY_COUNT];
    if (typeof count === 'number') {
      return count;
    }
    // Check RabbitMQ x-death header if message was dead-lettered through RabbitMQ
    const death = headers['x-death'];
    if (Array.isArray(death) && death.length > 0 && typeof death[0].count === 'number') {
      return death[0].count;
    }
    return 0;
  }

  /**
   * Checks if another retry attempt is permitted.
   */
  static canRetry(currentRetryCount: number): boolean {
    return currentRetryCount < MAX_RETRY_COUNT;
  }

  /**
   * Calculates exponential backoff in milliseconds:
   * Attempt 1 -> 1,000 ms (1s)
   * Attempt 2 -> 2,000 ms (2s)
   * Attempt 3 -> 4,000 ms (4s)
   */
  static calculateDelayMs(retryCount: number): number {
    const base = 1000;
    const exponent = Math.max(0, retryCount - 1);
    return Math.min(base * Math.pow(2, exponent), 10000);
  }
}
