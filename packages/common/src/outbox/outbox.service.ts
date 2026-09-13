import type { DbOrTx } from '../database/drizzle.module';
import type { OutboxTable, OutboxRecordParams } from './outbox.types';

/**
 * Inserts a domain event into the service-owned outbox table within an active transaction.
 *
 * Enforces:
 * 1. Event envelope completeness (eventId and eventType present).
 * 2. Status initialized to 'PENDING'.
 * 3. Immutable eventId and correlationId preserved.
 */
export async function insertOutboxEvent(
  tx: DbOrTx,
  table: OutboxTable,
  params: OutboxRecordParams
): Promise<void> {
  const { event, aggregateType, aggregateId } = params;
  if (!event || !event.eventId || !event.eventType) {
    throw new Error('Cannot record outbox event: missing eventId or eventType in EventEnvelope');
  }

  const now = new Date();
  await tx.insert(table).values({
    eventId: event.eventId,
    eventType: event.eventType,
    aggregateType,
    aggregateId,
    correlationId: event.correlationId || 'unknown',
    payload: event,
    status: 'PENDING',
    attemptCount: 0,
    nextAttemptAt: now,
    createdAt: now,
    updatedAt: now
  });
}
