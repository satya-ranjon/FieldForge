import type { EventEnvelope } from '@fieldforge/contracts';
import type { workOrderOutboxEvents, billingOutboxEvents } from '@fieldforge/database';

export type OutboxTable = typeof workOrderOutboxEvents | typeof billingOutboxEvents;

export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'DEAD';

export interface OutboxRecordParams<TPayload = unknown> {
  event: EventEnvelope<TPayload>;
  aggregateType: string;
  aggregateId: string;
}

export interface EventPublisherPort {
  publish(event: EventEnvelope<unknown>): Promise<void>;
}

export interface OutboxRelayConfig {
  serviceName: string;
  batchSize?: number;
  leaseDurationMs?: number;
  publishTimeoutMs?: number;
  pollIntervalMs?: number;
}
