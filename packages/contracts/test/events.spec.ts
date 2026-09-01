import { EVENT_EXCHANGE, EventType, createEvent } from '../src/events/envelope';
import { WorkOrderStatus } from '../src/enums';

describe('event envelope', () => {
  const CORRELATION_ID = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';

  it('stamps a unique eventId per publish attempt', () => {
    const a = createEvent(EventType.WORK_ORDER_PUBLISHED, { workOrderId: 'wo-1' }, CORRELATION_ID);
    const b = createEvent(EventType.WORK_ORDER_PUBLISHED, { workOrderId: 'wo-1' }, CORRELATION_ID);

    // Consumers deduplicate on eventId, so two publishes of the same fact must
    // be distinguishable; a shared id would make the second a silent no-op.
    expect(a.eventId).not.toBe(b.eventId);
    expect(a.eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('carries the caller correlationId through unchanged', () => {
    const event = createEvent(EventType.ESCROW_FUNDED, { escrowId: 'esc-1' }, CORRELATION_ID);
    expect(event.correlationId).toBe(CORRELATION_ID);
  });

  it('stamps occurredAt as an ISO 8601 UTC instant', () => {
    const event = createEvent(EventType.WORK_ORDER_APPROVED, {}, CORRELATION_ID);
    // Local time here would make cross-service ordering wrong by whole hours.
    expect(event.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(event.occurredAt).toISOString()).toBe(event.occurredAt);
  });

  it('does not copy or wrap the payload', () => {
    const payload = { workOrderId: 'wo-1', amountMinor: 45000 };
    expect(createEvent(EventType.ESCROW_FUNDED, payload, CORRELATION_ID).payload).toBe(payload);
  });
});

describe('routing keys', () => {
  // RULE-EVENT-03 requires <domain>.<entity>.<action>. The enum value IS the
  // routing key, so a malformed member silently produces an unbound queue.
  it.each(Object.entries(EventType))('%s is <domain>.<entity>.<action>', (_name, value) => {
    expect(value).toMatch(/^[a-z][a-z_]*\.[a-z][a-z_]*\.[a-z][a-z_]*$/);
  });

  it('has no duplicate routing keys', () => {
    const values = Object.values(EventType);
    expect(new Set(values).size).toBe(values.length);
  });

  it('publishes to one exchange', () => {
    expect(EVENT_EXCHANGE).toBe('fieldforge.events.topic');
  });
});

describe('work order status canon', () => {
  // docs/SRS.md FR-WO-002 verbatim. This list is the contract every service,
  // the `work_orders.status` column, and the UI badge agree on.
  const CANON = [
    'DRAFT',
    'PUBLISHED',
    'ASSIGNED',
    'EN_ROUTE',
    'ON_SITE',
    'COMPLETED',
    'APPROVED',
    'PAID',
    'CANCELLED',
    'DISPUTED'
  ];

  it('is exactly the SRS lifecycle', () => {
    expect(Object.values(WorkOrderStatus)).toEqual(CANON);
  });

  it.each(['OPEN', 'MATCHING', 'BIDDING', 'DISPATCHED', 'IN_PROGRESS', 'REVIEW', 'SETTLED'])(
    'does not resurrect the non-canon status %s',
    (removed) => {
      // Bidding is a table (`work_order_bids`), not a state: a work order stays
      // PUBLISHED while it collects bids. These names came from the README and
      // the UI badge and are lower-ranked than the SRS per AGENTS.md.
      expect(Object.values<string>(WorkOrderStatus)).not.toContain(removed);
    }
  );

  it('names every member after its own value', () => {
    for (const [name, value] of Object.entries(WorkOrderStatus)) {
      expect(value).toBe(name);
    }
  });
});
