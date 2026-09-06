# 📡 OpenAPI & REST Endpoint Catalogue

> **Living Specification** • Base URL: `http://localhost:8000/api/v1`

---

## 1. Authentication & Vetting Service (`auth-service`)

| Method | Endpoint                  | Description                                      | Auth / RBAC | Payload Schema             |
| :----- | :------------------------ | :----------------------------------------------- | :---------- | :------------------------- |
| `POST` | `/auth/register`          | Register new Buyer or Technician account         | Public      | `registerUserSchema`       |
| `POST` | `/auth/login`             | Authenticate credentials & return JWT tokens     | Public      | `loginSchema`              |
| `POST` | `/auth/refresh`           | Issue fresh access token from refresh token      | Public      | `{ refreshToken: string }` |
| `GET`  | `/users/me`               | Retrieve authenticated user profile              | Bearer JWT  | None                       |
| `GET`  | `/technicians/:id/badges` | Fetch technician certifications & vetting badges | Bearer JWT  | None                       |

> **"Bearer JWT" means the token, not the header.** `/users/me` resolves the
> caller from the verified token's `sub` claim. The `x-ff-user-id` /
> `x-ff-user-role` headers the gateway injects are **not** an accepted identity
> source: the gateway sets them only after verifying a token, but every service
> listens on `0.0.0.0` with no NetworkPolicy or mTLS, so a direct caller can set
> them too. `/users/me` reads `x-ff-user-id` solely to detect disagreement with
> the token and returns 401 on a mismatch. The gateway, for its part, strips any
> inbound `x-ff-user-*` before asserting its own.
>
> New endpoints in this catalogue inherit that rule — verify the token, use
> `payload.sub`. `docs/ISSUES.md` **C5** records what happened when `/users/me`
> did it the other way around.

---

## 2. Work Order Lifecycle Service (`work-order-service`)

| Method  | Endpoint                                      | Description                                           | Auth / RBAC           | Payload Schema               |
| :------ | :-------------------------------------------- | :---------------------------------------------------- | :-------------------- | :--------------------------- |
| `POST`  | `/work-orders`                                | Create a new work order draft                         | `BUYER`               | `createWorkOrderSchema`      |
| `GET`   | `/work-orders`                                | List & filter work orders (by status, date, location) | Authenticated         | `listWorkOrdersQuerySchema`  |
| `GET`   | `/work-orders/:id`                            | Fetch complete work order details                     | Authenticated         | None                         |
| `GET`   | `/work-orders/:id/history`                    | Fetch immutable state transition audit history        | Authenticated         | None                         |
| `POST`  | `/work-orders/:id/publish`                    | Transition draft work order to `PUBLISHED`            | `BUYER`               | None                         |
| `POST`  | `/work-orders/:id/transition`                 | Execute validated FSM state transition                | `BUYER`, `TECHNICIAN` | `transitionStatusSchema`     |
| `PATCH` | `/work-orders/:id/status`                     | Alias to execute validated FSM state transition       | `BUYER`, `TECHNICIAN` | `transitionStatusSchema`     |
| `POST`  | `/work-orders/:id/deliverables/presigned-url` | Generate pre-signed upload URL for media storage      | `TECHNICIAN`          | `generatePresignedUrlSchema` |
| `POST`  | `/work-orders/:id/deliverables/signature`     | Submit cryptographic digital signature artifact       | `TECHNICIAN`          | `recordSignatureSchema`      |
| `POST`  | `/work-orders/:id/signature`                  | Alias to submit digital signature artifact            | `TECHNICIAN`          | `recordSignatureSchema`      |
| `GET`   | `/work-orders/:id/deliverables`               | Fetch deliverables for work order                     | Authenticated         | None                         |

---

## 3. Dispatch & Geospatial Matching Service (`dispatch-matching-service`)

| Method | Endpoint                         | Description                                             | Auth / RBAC           | Payload Schema                   |
| :----- | :------------------------------- | :------------------------------------------------------ | :-------------------- | :------------------------------- |
| `POST` | `/dispatch/technicians/location` | Update live contractor geospatial coordinates           | `TECHNICIAN`          | `updateTechnicianLocationSchema` |
| `GET`  | `/dispatch/technicians/nearby`   | Redis `GEOSEARCH` matching with composite score rank    | `BUYER`, `DISPATCHER` | `nearbyTechniciansQuerySchema`   |
| `POST` | `/dispatch/bids`                 | Submit technician bid with rate & counter-note          | `TECHNICIAN`          | `submitBidSchema`                |
| `POST` | `/dispatch/bids/:id/accept`      | Accept technician bid, reject siblings, assign job      | `BUYER`               | None                             |
| `POST` | `/dispatch/auto-route`           | Trigger automated rule-based ticket dispatch ($\le 5$m) | `BUYER`, `DISPATCHER` | `autoRouteSchema`                |

---

## 4. Billing, Escrow & Invoicing Service (`billing-service`)

| Method | Endpoint                           | Description                                  | Auth / RBAC           | Payload Schema        |
| :----- | :--------------------------------- | :------------------------------------------- | :-------------------- | :-------------------- |
| `POST` | `/billing/escrow/preauth`          | Pre-authorize and hold funds in escrow       | `BUYER`               | `preAuthEscrowSchema` |
| `POST` | `/billing/escrow/release`          | Transactional release of escrow funds (C3)   | `BUYER`, `ADMIN`      | `releaseEscrowSchema` |
| `GET`  | `/billing/escrow/:workOrderId`     | Retrieve escrow hold status & details        | Authenticated         | None                  |
| `GET`  | `/billing/invoices/:id`            | Retrieve immutable invoice with content hash | Authenticated         | None                  |
| `GET`  | `/billing/invoices/:id/pdf`        | Stream immutable PDF/A invoice document      | Authenticated         | None                  |
| `GET`  | `/billing/technicians/:id/payouts` | Retrieve 1099 earnings and settlement ledger | `TECHNICIAN`, `ADMIN` | None                  |

---

## 5. AMQP Event Backbone & Message Topology (`@fieldforge/messaging`)

> **Exchanges**:
>
> - Topic Exchange: `fieldforge.events.topic` (durable, persistent delivery)
> - Dead-Letter Exchange (DLX): `fieldforge.events.dlx` (direct, durable)
> - Dead-Letter Queue (DLQ): `fieldforge.events.dlq` (bound to DLX)

| Routing Key                      | Event Type                       | Publisher                   | Consumer Queue                         | Consumer Service            | Payload Contract              |
| :------------------------------- | :------------------------------- | :-------------------------- | :------------------------------------- | :-------------------------- | :---------------------------- |
| `work_order.lifecycle.published` | `work_order.lifecycle.published` | `work-order-service`        | `fieldforge.dispatch.work-orders`      | `dispatch-matching-service` | `WorkOrderPublishedPayload`   |
| `work_order.lifecycle.published` | `work_order.lifecycle.published` | `work-order-service`        | `fieldforge.notifications.work-orders` | `notification-service`      | `WorkOrderPublishedPayload`   |
| `work_order.lifecycle.assigned`  | `work_order.lifecycle.assigned`  | `work-order-service`        | `fieldforge.notifications.work-orders` | `notification-service`      | `WorkOrderAssignedPayload`    |
| `work_order.lifecycle.assigned`  | `work_order.lifecycle.assigned`  | `work-order-service`        | `fieldforge.billing.work-orders`       | `billing-service`           | `WorkOrderAssignedPayload`    |
| `work_order.lifecycle.approved`  | `work_order.lifecycle.approved`  | `work-order-service`        | `fieldforge.billing.work-orders`       | `billing-service`           | `WorkOrderApprovedPayload`    |
| `work_order.lifecycle.paid`      | `work_order.lifecycle.paid`      | `work-order-service`        | `fieldforge.notifications.work-orders` | `notification-service`      | `WorkOrderPaidPayload`        |
| `tech.bidding.submitted`         | `tech.bidding.submitted`         | `dispatch-matching-service` | `fieldforge.notifications.work-orders` | `notification-service`      | `TechBiddingSubmittedPayload` |
| `billing.escrow.funded`          | `billing.escrow.funded`          | `billing-service`           | `fieldforge.work-orders.billing`       | `work-order-service`        | `EscrowFundedPayload`         |
| `billing.payout.disbursed`       | `billing.payout.disbursed`       | `billing-service`           | `fieldforge.work-orders.billing`       | `work-order-service`        | `PayoutDisbursedPayload`      |

> **Header & Trace Propagation Invariant (`RULE-EVENT-03`, `RULE-OBS`)**:
> Every published message envelope includes:
>
> - `x-correlation-id`: Request correlation ID propagated from HTTP caller or prior event.
> - `x-event-id`: Unique UUID v4 identifying the event instance for 7-day Redis deduplication (`ff:idemp:<eventId>`).
> - `x-event-type`: Strict event type matching contract enum.
> - `x-retry-count`: Current retry invocation counter (0 for initial publish, max 3).
> - Delivery mode: Persistent (`deliveryMode = 2`).

---

## 6. Enterprise Buyer Portal RTK Query Client Bindings (`apps/web-buyer-portal`)

> **Client Architecture** • Next.js 16 App Router (`port 5173`) • Reverse proxy `/api/:path*` to `http://localhost:8000/api/:path*` • RTK Query Service Slice (`api.ts`).

### Addressable Route Segments

| Route Segment  | View Component             | Capabilities                                                      |
| :------------- | :------------------------- | :---------------------------------------------------------------- |
| `/operations`  | `LiveDispatchBoard`        | Active work order kanban, SLA escalation monitors, FSM actions    |
| `/create-wo`   | `SowBuilder`               | SOW wizard, template presets, budget & escrow pre-authorization   |
| `/technicians` | `TechnicianMatchingRadar`  | Geospatial contractor radar, verified scoring, bid acceptance     |
| `/billing`     | `EscrowManager`            | Escrow vault holds, transactional payout disbursement, ledger     |
| `/audit`       | `AuditTrail` / Status Pane | SHA-256 deliverable verification, FSM history logs, tamper alerts |

### Client RTK Query Endpoints & Cache Tags

| RTK Query Hook                     | Method | Path                            | Cache Tag Provided / Invalidated                  |
| :--------------------------------- | :----- | :------------------------------ | :------------------------------------------------ |
| `useGetWorkOrdersQuery`            | `GET`  | `/work-orders`                  | Provides: `{ type: 'WorkOrder', id: 'LIST' }`     |
| `useGetWorkOrderByIdQuery`         | `GET`  | `/work-orders/:id`              | Provides: `{ type: 'WorkOrder', id }`             |
| `useGetWorkOrderHistoryQuery`      | `GET`  | `/work-orders/:id/history`      | Provides: `{ type: 'WorkOrderHistory', id }`      |
| `useGetWorkOrderDeliverablesQuery` | `GET`  | `/work-orders/:id/deliverables` | Provides: `{ type: 'WorkOrderDeliverables', id }` |
| `useCreateWorkOrderMutation`       | `POST` | `/work-orders`                  | Invalidates: `['WorkOrder']`                      |
| `usePublishWorkOrderMutation`      | `POST` | `/work-orders/:id/publish`      | Invalidates: `['WorkOrder']`                      |
| `useTransitionWorkOrderMutation`   | `POST` | `/work-orders/:id/transition`   | Invalidates: `['WorkOrder', 'WorkOrderHistory']`  |
| `useGetNearbyTechniciansQuery`     | `GET`  | `/dispatch/technicians/nearby`  | Provides: `{ type: 'Technician', id: 'LIST' }`    |
| `useAcceptBidMutation`             | `POST` | `/dispatch/bids/:id/accept`     | Invalidates: `['Bid', 'WorkOrder', 'Technician']` |
| `useAutoRouteMutation`             | `POST` | `/dispatch/auto-route`          | Invalidates: `['WorkOrder', 'Technician']`        |
| `usePreAuthEscrowMutation`         | `POST` | `/billing/escrow/preauth`       | Invalidates: `['Escrow']`                         |
| `useReleaseEscrowMutation`         | `POST` | `/billing/escrow/release`       | Invalidates: `['Escrow', 'WorkOrder', 'Invoice']` |
| `useGetEscrowStatusQuery`          | `GET`  | `/billing/escrow/:workOrderId`  | Provides: `{ type: 'Escrow', id: workOrderId }`   |
| `useGetInvoiceQuery`               | `GET`  | `/billing/invoices/:id`         | Provides: `{ type: 'Invoice', id }`               |

> **401 Token Refresh Mutex Guard**: `baseQueryWithReauth` protects concurrent client requests using a `SimpleMutex`.
> When any query receives a `401 Unauthorized`, subsequent calls wait on the mutex lock while a single refresh
> request runs against `POST /api/v1/auth/refresh`. On success, new tokens are dispatched to `authSlice` and
> buffered requests retry seamlessly; on failure, credentials are cleared to trigger re-authentication.

---

## 7. Observability, Health & Telemetry Probes (Shared `HealthController`)

| Method | Endpoint   | Description                                                                                    | Auth / RBAC | Response Schema / Format                                        |
| :----- | :--------- | :--------------------------------------------------------------------------------------------- | :---------- | :-------------------------------------------------------------- |
| `GET`  | `/healthz` | Kubernetes liveness probe asserting application process responsiveness                         | Public      | `{ status: 'UP', timestamp: string }`                           |
| `GET`  | `/readyz`  | Honest readiness probe validating active MySQL pool (`SELECT 1`), Redis, and RabbitMQ channels | Public      | `{ status: 'READY', checks: { ... }, uptimeSeconds, memoryMb }` |
| `GET`  | `/metrics` | Prometheus metrics exposition scraped by Prometheus (`infra/docker/prometheus.yml`)            | Public      | `text/plain; version=0.0.4; charset=utf-8`                      |
