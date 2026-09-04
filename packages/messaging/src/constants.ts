export const EVENT_EXCHANGE = 'fieldforge.events.topic';
export const EVENT_DEAD_LETTER_EXCHANGE = 'fieldforge.events.dlx';
export const DEFAULT_DEAD_LETTER_QUEUE = 'fieldforge.events.dlq';

export const MESSAGING_MODULE_OPTIONS = 'MESSAGING_MODULE_OPTIONS';
export const RABBITMQ_CONNECTION = 'RABBITMQ_CONNECTION';
export const REDIS_IDEMPOTENCY_CLIENT = 'REDIS_IDEMPOTENCY_CLIENT';

/**
 * 7-day TTL for idempotency deduplication cache per RULE-EVENT-03.
 */
export const IDEMPOTENCY_TTL_SECONDS = 7 * 24 * 60 * 60; // 604,800 seconds

/**
 * Maximum retries before dead-lettering per RULE-EVENT-03.
 */
export const MAX_RETRY_COUNT = 3;

/**
 * Header keys used in AMQP messages.
 */
export const HEADER_CORRELATION_ID = 'x-correlation-id';
export const HEADER_EVENT_ID = 'x-event-id';
export const HEADER_EVENT_TYPE = 'x-event-type';
export const HEADER_RETRY_COUNT = 'x-retry-count';
export const HEADER_ORIGINAL_QUEUE = 'x-original-queue';
