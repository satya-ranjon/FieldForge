# 📝 ADR 005: Work Order Aggregate Boundary Reconciliation & Event-Driven Settlement

| Status       | Date           | Decision Maker         |
| :----------- | :------------- | :--------------------- |
| **ACCEPTED** | September 2026 | Satya Ranjan Debsharma |

---

## 1. Context

In the initial microservice scaffold:

1. `apps/billing-service` (`EscrowService.releaseFunds()`) executed direct SQL mutations against `work_orders` and `work_order_status_history` to set status to `PAID`.
2. `apps/dispatch-matching-service` (`BidsService.acceptBid()` and `autoRoute()`) executed direct SQL mutations against `work_orders` and `work_order_status_history` to assign technician IDs and set status to `ASSIGNED`, as well as directly publishing `work_order.lifecycle.assigned` events.

This violated core bounded context boundaries (`AGENTS.md` and `RULE-FEAT-09`), bypassed the domain state machine (`WorkOrderFsmService`), and caused duplicate event emissions and fragmented aggregate ownership across services.

## 2. Decision

Establish `work-order-service` as the **sole owner and mutator** of the Work Order aggregate:

1. **New Event Contract**: Introduce `tech.bidding.accepted` (`EventType.TECH_BID_ACCEPTED`, `TechBidAcceptedEvent`, `TechBidAcceptedPayload`) in `@fieldforge/contracts`.
2. **Decouple Billing Service**: `apps/billing-service` mutates only `escrow_accounts` and `payout_ledger`, publishing `billing.payout.disbursed` (`PAYOUT_DISBURSED`).
3. **Decouple Dispatch Service**: `apps/dispatch-matching-service` mutates only `work_order_bids`, publishing `tech.bidding.accepted` (`TECH_BID_ACCEPTED`).
4. **Work Order Service Settlement Consumer**: `apps/work-order-service` consumes `tech.bidding.accepted` and `billing.payout.disbursed` on queue `fieldforge.work-orders.lifecycle-events`, driving transactional state transitions (`PUBLISHED → ASSIGNED` and `APPROVED → PAID`) through `WorkOrderFsmService` with pessimistic row locking (`SELECT … FOR UPDATE`), recording immutable audit history, and canonically publishing `work_order.lifecycle.assigned` and `work_order.lifecycle.paid`.

## 3. Consequences

- **Positive:**
  - Absolute enforcement of DDD bounded contexts: zero cross-service mutations of foreign tables.
  - 100% of work order lifecycle transitions are validated by `WorkOrderFsmService`.
  - Eliminates duplicate event publishing on `work_order.lifecycle.assigned`.
  - Canonical audit history tracking within the owning domain service.
- **Negative:**
  - Work order assignment and payment status updates are asynchronous via RabbitMQ (sub-millisecond locally, resilient with DLQ & 3 retries).
