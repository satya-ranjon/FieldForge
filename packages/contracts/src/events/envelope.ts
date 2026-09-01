/**
 * Every FieldForge domain event travels inside this envelope.
 *
 * Separating envelope from payload gives the transport layer a fixed place to
 * find the fields it needs — `eventId` for the idempotency check, `eventType`
 * for the routing key, `correlationId` to stitch a request's logs together
 * across services — without knowing anything about the domain. See
 * `.agent/rules/06` (RULE-EVENT-03) and docs/SRS.md FR-OBS-002.
 */
export interface EventEnvelope<TPayload> {
  /**
   * Unique per publish attempt. Consumers deduplicate on this value, so a
   * retried publish of the same fact MUST reuse the original id.
   */
  eventId: string;

  /** Doubles as the topic routing key. */
  eventType: EventType;

  /** ISO 8601 UTC instant the fact became true, set by the producer. */
  occurredAt: string;

  /**
   * The `x-correlation-id` of the request that caused this event. Consumers
   * restore it into their logger context so one buyer action is traceable from
   * the gateway through every downstream service.
   */
  correlationId: string;

  payload: TPayload;
}

/**
 * Routing keys, in RULE-EVENT-03's `<domain>.<entity>.<action>` form.
 *
 * Each member has a corresponding payload interface; add them together so the
 * envelope type can never name an event nobody has defined.
 */
export enum EventType {
  WORK_ORDER_PUBLISHED = 'work_order.lifecycle.published',
  WORK_ORDER_ASSIGNED = 'work_order.lifecycle.assigned',
  WORK_ORDER_APPROVED = 'work_order.lifecycle.approved',
  ESCROW_FUNDED = 'billing.escrow.funded',
  PAYOUT_DISBURSED = 'billing.payout.disbursed'
}

/**
 * The single topic exchange every domain event is published to. Named here so
 * publishers, queue bindings, and tests cannot disagree about it.
 */
export const EVENT_EXCHANGE = 'fieldforge.events.topic';

/**
 * Wrap a payload in an envelope.
 *
 * `eventId` and `occurredAt` are generated here precisely so that no producer
 * invents its own scheme: consumers deduplicate on `eventId`, and a producer
 * that reused one — or that stamped local time instead of UTC — would break
 * that contract silently. `correlationId` is *not* generated: it belongs to the
 * inbound request, and a producer that cannot supply one has lost the trace.
 */
export function createEvent<TPayload>(
  eventType: EventType,
  payload: TPayload,
  correlationId: string
): EventEnvelope<TPayload> {
  return {
    eventId: globalThis.crypto.randomUUID(),
    eventType,
    occurredAt: new Date().toISOString(),
    correlationId,
    payload
  };
}
