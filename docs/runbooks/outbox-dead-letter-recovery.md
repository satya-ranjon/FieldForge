# Outbox DEAD Event Observability, Diagnosis & Safe Operator Recovery Runbook

## 1. Overview & Architectural Invariants

FieldForge uses the **Transactional Outbox Pattern** to achieve reliable asynchronous event delivery across microservice boundaries (Work Orders, Dispatch, Billing, Notifications).

### Core Architectural Invariants

1. **At-Least-Once Broker Delivery + Idempotent Consumers**:
   The outbox relay guarantees that every committed aggregate event is published to RabbitMQ at least once. Downstream consumers employ persistent idempotency tables (`processed_events`) with unique message fingerprints to deduplicate redeliveries safely.
2. **Strict Per-Aggregate Causal Ordering (FIFO)**:
   Events belonging to the same aggregate (`aggregateType` + `aggregateId`) must be processed in strict monotonic causal order.
   The claiming query enforces this via a `NOT EXISTS` causal blocker:
   ```sql
   NOT EXISTS (
     SELECT 1 FROM outbox_table AS prior
     WHERE prior.aggregate_type = outbox_table.aggregate_type
       AND prior.aggregate_id = outbox_table.aggregate_id
       AND prior.id < outbox_table.id
       AND prior.status IN ('PENDING', 'PROCESSING', 'FAILED', 'DEAD')
   )
   ```
3. **Intentional Fail-Stop Causal Blocking on DEAD**:
   A `DEAD` status indicates a **structural poison event** (e.g., malformed JSON envelope, missing mandatory event identifiers, or unparseable payload).
   Because downstream domain consistency depends on causal sequence (for example, `WORK_ORDER_APPROVED` must never be published if `WORK_ORDER_ASSIGNED` failed), **a `DEAD` event intentionally halts subsequent events for that specific aggregate only**.
   All other aggregates continue publishing concurrently with zero contention.

---

## 2. Alert Triage: `FieldForgeOutboxDeadEventDetected`

### Alert Details

- **Alert Name**: `FieldForgeOutboxDeadEventDetected`
- **Metric**: `increase(fieldforge_outbox_dead_events_total[5m]) > 0`
- **Severity**: `warning`
- **Labels**:
  - `service`: The originating microservice (e.g., `work-order-service`, `billing-service`).
  - `outbox`: The underlying database table (e.g., `work_order_outbox_events`, `billing_outbox_events`).
  - `reason`: The failure categorization (e.g., `structural_poison`).

### Immediate Impact

1. The affected aggregate is blocked from emitting further events until the poison event is triaged and replayed.
2. Other aggregates continue normal outbox relay processing.
3. No data loss has occurred; the poison row remains safely stored in the MySQL database.

---

## 3. Diagnostic & Inspection Procedure

### Step 1: List DEAD Events

Connect to the environment and execute the outbox administrative CLI to inspect blocked events:

```bash
# For work order outbox events
pnpm outbox:admin list work-order

# For billing outbox events
pnpm outbox:admin list billing

# Or using the shell wrapper directly:
./scripts/outbox-admin.sh list work-order --limit 20
```

Sample output:

```text
⚠️ Found 1 DEAD outbox event(s):

  Row ID:         42
  Event ID:       7b949c71-7009-467f-94d7-ea8d7d42cf72
  Event Type:     work_order.lifecycle.assigned
  Aggregate:      WORK_ORDER #wo-88401
  Attempts:       1
  Created At:     2026-09-16T10:15:30.000Z
  Updated At:     2026-09-16T10:15:31.000Z
  Last Error:     Poison event: SyntaxError: Malformed event envelope payload
  ────────────────────────────────────────────────────────────
```

### Step 2: Inspect Event Details & Error Diagnostics

Inspect the full event metadata and payload diagnostic:

```bash
pnpm outbox:admin inspect work-order 42
```

This displays:

- Aggregate ID and Correlation ID for distributed tracing.
- Number of attempts and timestamp of failure.
- Exact error message recorded on the poison transition.
- JSON diagnostic of the payload.

### Step 3: Determine Root Cause

1. **Malformed JSON / Syntax Error**:
   If `lastError` references `SyntaxError` or missing fields (`eventId`, `eventType`), check recent microservice deployments that produce events to that table.
2. **Schema Drift / Incompatible DTO**:
   Check if a new contract schema was deployed without backward-compatible serialization.
3. **Transient Data Corruption**:
   Verify if an edge gateway or upstream client submitted non-standard UTF-8 characters or truncated inputs.

---

## 4. Remediation & Safe Replay Procedure

### Step 1: Fix the Root Cause

Before replaying a dead event, the underlying bug or configuration issue **must** be resolved:

- Deploy the hotfix or rollback to the offending microservice if serialization/validation logic was broken.
- Verify the service pod is healthy and passes health checks (`/health/live`, `/health/ready`).

### Step 2: Safely Replay the Dead Event

Once the service is healthy, execute atomic replay:

```bash
pnpm outbox:admin replay work-order 42
```

Expected output:

```text
🔄 Attempting atomic replay for DEAD event #42 in work-order...
✅ [SUCCESS] Event #42 successfully transitioned from DEAD to PENDING.
   - Attempt count reset to 0
   - Next attempt scheduled immediately
   - Causal blocker unblocked for downstream events on the same aggregate.
   - The relay engine will claim and process it on the next poll cycle or trigger.
```

### Invariants Enforced During Replay

- **Precondition Check**: Replay is strictly rejected if the row status is not `DEAD` (e.g. already `PROCESSING`, `PENDING`, or `PUBLISHED`).
- **Atomic Compare-And-Set (CAS)**: Replay executes an atomic update guarded by `id = ? AND status = 'DEAD'`.
- **Preserved Immutability**: `eventId`, `eventType`, `aggregateType`, `aggregateId`, and `payload` are **never altered**.
- **Self-Healing Safety**: If the payload is still malformed, the relay will catch the syntax error, re-transition to `DEAD`, re-increment the metric, and halt the stream safely rather than corrupting downstream state.

---

## 5. Strict Operational Guardrails

> [!CAUTION]
> **NEVER Bypassing Causal Ordering**:
> Do NOT alter the SQL query to remove `'DEAD'` from `prior.status IN ('PENDING', 'PROCESSING', 'FAILED', 'DEAD')`. Bypassing a dead predecessor causes out-of-order execution downstream (e.g. paying out an unassigned order), leading to financial discrepancy and data inconsistency.

> [!CAUTION]
> **NEVER Fake Publication Status**:
> Do NOT execute manual SQL `UPDATE outbox SET status = 'PUBLISHED'`. An event that was never delivered to RabbitMQ must not be marked `PUBLISHED`. Marking an un-emitted event as `PUBLISHED` tricks the system into thinking downstream consumers processed it when they never did.

> [!CAUTION]
> **NEVER Edit Payloads via CLI**:
> Direct payload editing (`--payload`) is strictly forbidden by the CLI. Changing payloads breaks cryptographic hashes, idempotency keys, and auditability. Fix the consuming or publishing code instead.
