# 📝 ADR 007: Marketplace Bidding Relocation & Work Order Aggregate Cohesion

| Status       | Date           | Decision Maker         |
| :----------- | :------------- | :--------------------- |
| **ACCEPTED** | September 2026 | Satya Ranjan Debsharma |

---

## 1. Context

In the initial microservice architecture, contractor bidding logic was implemented inside `apps/dispatch-matching-service`:

- `apps/dispatch-matching-service` directly managed `work_order_bids` records, bid submissions, counter-notes, and buyer bid acceptance.
- When a buyer accepted a bid, `dispatch-matching-service` attempted to mutate the work order status or trigger cross-service updates.

This violated Domain-Driven Design (DDD) bounded context boundaries and the Single Responsibility Principle (SRP):

1. **Misplaced Bounded Context**: A dispatch service's core capability is geospatial matching (spatial indexing, Redis `GEOSEARCH` on live technician coordinates, proximity radius filtering, and routing optimization). Commercial bidding, pricing negotiations, and contractor selection are commercial procurement concerns.
2. **Fractured Aggregate Invariants**: In DDD, a `Bid` is an entity bound to the `WorkOrder` Aggregate Root. Accepting a bid must atomically transition the work order from `PUBLISHED` to `ASSIGNED`, set `assignedTechnicianId`, record audit history in `work_order_status_history`, mark the winning bid `ACCEPTED`, and reject all sibling bids (`REJECTED`). Performing this across service boundaries introduced the risk of partial failures, race conditions, and orphaned assignments.
3. **Database Coupling**: Bidding operations required `dispatch-matching-service` to maintain a database client pointing to work order tables or make distributed orchestrations bypassing the work order finite state machine (FSM).

## 2. Decision

Relocate the commercial bidding domain into `apps/work-order-service` and purify `apps/dispatch-matching-service`:

1. **Bidding as First-Class Work Order Domain Feature**:
   - Move `BidsService` into `apps/work-order-service/src/modules/bids/`.
   - Mount canonical aggregate REST endpoints on `BidsController`:
     - `POST /work-orders/:id/bids` (submit bid)
     - `GET /work-orders/:id/bids` (list bids for work order)
     - `POST /work-orders/:id/bids/:bidId/accept` (accept winning bid)
   - Preserve backward-compatible route aliases: `POST /work-orders/bids`, `GET /work-orders/bids/:id`, `POST /work-orders/bids/:id/accept`.

2. **Atomic Single-Transaction Bid Acceptance**:
   - Execute bid acceptance inside a single ACID database transaction:
     1. Validate buyer ownership and work order status (`PUBLISHED`).
     2. Verify target bid exists and is `PENDING`.
     3. Update winning bid status to `ACCEPTED`.
     4. Update all other bids for the work order to `REJECTED`.
     5. Execute FSM transition `PUBLISHED → ASSIGNED` via `WorkOrderFsmService` (recording transition reason and caller identity).
     6. Persist status audit record in `work_order_status_history`.
     7. Publish `tech.bid.accepted` and `work_order.assigned` domain events to RabbitMQ.

3. **Purify Dispatch Matching Service**:
   - Remove all bidding services, modules, and tests from `apps/dispatch-matching-service`.
   - Refactor `DispatchController` to strictly expose geospatial dispatch endpoints:
     - `POST /dispatch/technicians/location` (record live GPS coordinates into Redis geospatial index)
     - `GET /dispatch/technicians/nearby` (query nearby active technicians via Redis `GEOSEARCH`)
     - `POST /dispatch/auto-route` (calculate technician travel time and recommend dispatch routes)

4. **Transparent API Gateway Forwarding**:
   - In `apps/api-gateway`, configure proxy path resolution to rewrite `/dispatch/bids` and `/bids` to `/work-orders/bids`.
   - Route all bidding traffic to `apps/work-order-service` without requiring immediate client-side route migrations.

5. **Shared Database Contracts**:
   - Re-export `bidsSchema as workOrderBidsSchema` and `bidsSchema as marketplaceSchema` from `packages/database` alongside `bidsSchema`.
   - Zero database schema migrations (`RULE-DB-02`), preserving existing table structures.

## 3. Consequences

- **Positive:**
  - **Aggregate Cohesion**: The `WorkOrder` aggregate root directly enforces business rules and invariant checks over its bids.
  - **ACID Transactional Safety**: Bid acceptance, sibling rejection, and work order assignment succeed or fail atomically, eliminating split-brain state.
  - **Clear Service Separation**: `dispatch-matching-service` is exclusively focused on geospatial calculations and live location tracking.
  - **Zero Breaking Changes**: Legacy API callers and portal clients continue to work seamlessly via API Gateway URL rewriting.
- **Negative:**
  - Gateway path rewriting logic must be maintained until all external consumers migrate to canonical `/work-orders/:id/bids` routes.
