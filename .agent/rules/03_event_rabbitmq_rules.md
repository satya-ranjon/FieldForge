# 📬 Asynchronous Messaging & RabbitMQ Directives

> **Rule ID:** `RULE-EVENT-03` • **Priority:** `CRITICAL`

---

### 1. Topic Exchange Standard

- All domain events must publish to the central Topic Exchange: `fieldforge.events.topic`.
- Routing Key Schema: `<domain>.<entity>.<action>` (e.g., `work_order.lifecycle.published`, `tech.bidding.submitted`, `billing.escrow.funded`).

### 2. Idempotent Consumption

- Consumers must maintain an idempotency table or Redis key cache with a 7-day TTL to prevent duplicate processing.

### 3. Dead Letter Queues (DLQ)

- Every worker queue must be bound to an `x-dead-letter-exchange` with exponential retry backoff (max 3 retries).

### 4. Transactional Outbox Pattern

- Domain events resulting from business database transactions MUST be persisted to a service-owned outbox table (`work_order_outbox_events`, `billing_outbox_events`) within the same database transaction (`insertOutboxEvent`).
- Direct RabbitMQ publishing inside or immediately following database transactions without an outbox row is prohibited to eliminate dual-write failure modes (ghost events on rollback, lost events on network failure).
- Outbox publication is handled asynchronously by a dedicated `OutboxRelay` with crash recovery leases, CAS claim tokens, bounded concurrency, and monotonic per-aggregate FIFO ordering.
