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
