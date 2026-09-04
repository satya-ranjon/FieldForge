import type { ConsumeMessage } from 'amqplib';
import { RetryPolicy } from '../src/consumer/retry-policy';
import { HEADER_RETRY_COUNT, MAX_RETRY_COUNT } from '../src/constants';

describe('RetryPolicy', () => {
  describe('getRetryCount', () => {
    it('returns 0 when headers are missing or do not contain retry count', () => {
      const msg = {
        properties: {}
      } as ConsumeMessage;

      expect(RetryPolicy.getRetryCount(msg)).toBe(0);
    });

    it('returns header retry count when present', () => {
      const msg = {
        properties: {
          headers: {
            [HEADER_RETRY_COUNT]: 2
          }
        }
      } as unknown as ConsumeMessage;

      expect(RetryPolicy.getRetryCount(msg)).toBe(2);
    });

    it('reads retry count from x-death header if present', () => {
      const msg = {
        properties: {
          headers: {
            'x-death': [{ count: 3 }]
          }
        }
      } as unknown as ConsumeMessage;

      expect(RetryPolicy.getRetryCount(msg)).toBe(3);
    });
  });

  describe('canRetry', () => {
    it('permits retry when below MAX_RETRY_COUNT (3)', () => {
      expect(RetryPolicy.canRetry(0)).toBe(true);
      expect(RetryPolicy.canRetry(1)).toBe(true);
      expect(RetryPolicy.canRetry(2)).toBe(true);
    });

    it('denies retry when at or above MAX_RETRY_COUNT (3)', () => {
      expect(RetryPolicy.canRetry(MAX_RETRY_COUNT)).toBe(false);
      expect(RetryPolicy.canRetry(4)).toBe(false);
    });
  });

  describe('calculateDelayMs', () => {
    it('calculates exponential backoff delay correctly', () => {
      expect(RetryPolicy.calculateDelayMs(1)).toBe(1000); // 1s
      expect(RetryPolicy.calculateDelayMs(2)).toBe(2000); // 2s
      expect(RetryPolicy.calculateDelayMs(3)).toBe(4000); // 4s
    });

    it('caps maximum delay at 10 seconds', () => {
      expect(RetryPolicy.calculateDelayMs(10)).toBe(10000);
    });
  });
});
