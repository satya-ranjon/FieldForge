# 📝 ADR 011: Transactional Outbox Pattern for Microservice Event Publication

| Status       | Date           | Decision Maker         |
| :----------- | :------------- | :--------------------- |
| **ACCEPTED** | September 2026 | Satya Ranjan Debsharma |

---

## 1. Context

In the microservices architecture of FieldForge, domain events published to RabbitMQ drive critical distributed workflows across bounded contexts:

- `work-order-service` emits `work_order.lifecycle.published`, `work_order.lifecycle.assigned`, `work_order.lifecycle.approved`, `work_order.lifecycle.paid`, `work_order.lifecycle.cancelled`, `tech.bidding.submitted`, and `tech.bidding.accepted`.
- `billing-service` emits `billing.escrow.funded` and `billing.payout.disbursed`.

Previously, domain event publication occurred via direct network calls to RabbitMQ either immediately before database transaction commit, within the database transaction callback, or immediately after commit. This created two critical dual-write failure modes (`ISSUE-005`):

1. **Ghost Events (Network publish succeeds, DB transaction rolls back):**
   When publishing occurred inside or before `db.transaction()` commit, any unexpected database constraint failure, serialization failure, or connection drop resulted in a rolled-back transaction. However, the message had already been published to RabbitMQ, causing downstream consumers (such as `dispatch-matching-service` or `notification-service`) to act on state changes that never committed in MySQL.

2. **Lost Events (DB transaction commits, Network publish fails):**
   When publishing occurred after `db.transaction()` commit, if the application pod crashed, the network disconnected, or RabbitMQ experienced transient unavailability, the domain state was committed to MySQL but the event was permanently lost. Downstream consumers would never receive the notification, stranding the workflow.

---

## 2. Decision

We adopt the **Transactional Outbox Pattern** across all publishing microservices in FieldForge, starting with `work-order-service` and `billing-service`.

```mermaid
flowchart TD
    classDef clientStyle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef dbStyle fill:#f1f5f9,stroke:#475569,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef relayStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef brokerStyle fill:#fffbeb,stroke:#b45309,stroke-width:2px,color:#0f172a,font-weight:600;

    subgraph Service[" Domain Service (ACID Boundary) "]
        Handler["Business Handler<br/>(e.g., publish, transition, lockFunds)"]:::clientStyle
        Tx["MySQL Transaction (db.transaction)"]:::dbStyle
        DomainTable[("Domain Tables<br/>(work_orders, escrow_accounts)")]:::dbStyle
        OutboxTable[("Outbox Table<br/>(*_outbox_events)")]:::dbStyle
    end

    subgraph Dispatch[" Asynchronous Outbox Relay "]
        Relay["Outbox Relay (Background Poller + Event-Loop Trigger)<br/>• 30s Leases & CAS Claim Tokens<br/>• Monotonic Per-Aggregate FIFO<br/>• Bounded Concurrency (5) & 10s Timeout"]:::relayStyle
    end

    subgraph Bus[" Message Bus "]
        RabbitMQ{{"📬 RabbitMQ Topic Exchange<br/>fieldforge.events.topic"}}:::brokerStyle
    end

    Handler -->|1. Begin| Tx
    Tx -->|2. Mutate state| DomainTable
    Tx -->|3. insertOutboxEvent| OutboxTable
    Tx -->|4. COMMIT| DomainTable
    Tx -->|4. COMMIT| OutboxTable
    Handler -.->|5. Post-Commit Coalesced trigger()| Relay
    Relay -->|6. Claim batch (CAS)| OutboxTable
    Relay -->|7. Publish| RabbitMQ
    Relay -->|8. Mark PUBLISHED (CAS token fenced)| OutboxTable
```

### Key Architectural Invariants

1. **Service-Owned Outbox Schemas (`RULE-ARCH-01` & `RULE-DB-02`):**
   - Each service owns its dedicated outbox table: `work_order_outbox_events` in `work-order-service` and `billing_outbox_events` in `billing-service`.
   - Never query or write to another service's outbox table.
   - Primary key is `id BIGINT AUTO_INCREMENT` ensuring monotonic per-aggregate FIFO ordering.
   - Unique constraint on `event_id VARCHAR(36)` enforces deduplication.
   - Fully generated and managed via Drizzle migrations (`0007_blue_malice.sql`).

2. **Atomic In-Transaction Insertion:**
   - Domain logic writes events into the outbox within the existing `tx: DrizzleTransaction` via `insertOutboxEvent(tx, table, params)`.
   - Zero RabbitMQ network publishing occurs inside the database transaction.

3. **Lease-Based Crash Recovery & CAS Fencing:**
   - Outbox rows are claimed with a 30-second lease (`lease_expires_at = NOW() + 30s`) and a unique UUID `claim_token`.
   - State updates (`PUBLISHED` or `FAILED`) assert matching `claim_token`. If a worker times out and another worker reclaims the event, the stale worker cannot overwrite the newer worker's state.
   - Crashed pods are automatically recovered when their lease expires.

4. **Monotonic Per-Aggregate FIFO Ordering:**
   - Before claiming or publishing an event for an `aggregateId`, the relay asserts no earlier events (`id < current.id`) for that aggregate are in `PENDING` or `PROCESSING` status.

5. **Bounded Concurrency & Timeout Safety:**
   - Relays claim small batches (`LIMIT 5`) and publish concurrently with `Promise.allSettled`.
   - Each RabbitMQ publication is bounded by a 10-second timeout with guaranteed timer handle cancellation.
   - Events failing repeatedly are marked `FAILED` after exceeding `maxRetries` (5).

6. **Single-Flight Trigger Coalescing:**
   - In addition to a periodic 5-second polling interval, post-commit hooks invoke `relay.trigger()`.
   - Invocations are coalesced via event loop microtasks into single-flight sweeps to avoid queue overload.

7. **Negative Path Isolation (`PAYOUT_FAILED`):**
   - Transient operational errors and payment failure telemetry (`PAYOUT_FAILED`) remain outside the transactional outbox and are managed via direct broker dead-letter queues.

---

## 3. Consequences

### Positive

- **Guaranteed At-Least-Once Delivery:** Eliminates lost events and ghost events caused by dual-write race conditions.
- **Strict Bounded Context Isolation:** Each service maintains its own outbox table and relay runner without cross-database coupling.
- **High Concurrency Safety:** Multi-replica deployments can safely process outbox tables concurrently without race conditions due to CAS token fencing and lease expirations.

### Negative / Trade-Offs

- **Eventual Consistency:** Downstream consumers receive events asynchronously post-commit (typically < 10ms via event-loop trigger, up to 5s on polling fallback).
- **Storage Growth & Bounded Retention (`ISSUE-015`):** Outbox tables are transient delivery stores, not canonical business audit stores. Domain history is preserved immutably in `work_order_status_history` and `payout_ledger`. Under ISSUE-015, `OutboxRetentionWorker` runs bounded hourly sweeps purging only `PUBLISHED` events older than `OUTBOX_PUBLISHED_RETENTION_DAYS` (default 30 days). Predecessor causal barriers (`DEAD`, `FAILED`, `PROCESSING`, `PENDING`) are never automatically deleted.
