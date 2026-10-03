# 📡 OpenAPI & REST Endpoint Catalogue

> **Living Specification** • Base URL: `http://localhost:8000/api/v1`

---

## 1. Authentication & Vetting Service (`auth-service`)

> **Domain Modules (ADR 008)**: Encapsulated into `IamModule` (`/auth/*`), `ProfilesModule` (`/users/*`), and `ContractorVettingModule` (`/technicians/*`). Low-level IAM security logic is decoupled from marketplace profiles and vetting operations via dependency inversion.

| Method  | Endpoint                                 | Description                                          | Auth / RBAC                                    | Payload Schema                        |
| :------ | :--------------------------------------- | :--------------------------------------------------- | :--------------------------------------------- | :------------------------------------ |
| `POST`  | `/auth/register`                         | Register new Buyer or Technician account             | Public                                         | `registerUserSchema`                  |
| `POST`  | `/auth/login`                            | Authenticate credentials & return JWT tokens         | Public                                         | `loginSchema`                         |
| `POST`  | `/auth/refresh`                          | Issue fresh access token from refresh token          | Public                                         | `{ refreshToken: string }`            |
| `POST`  | `/auth/phone/send-otp`                   | Request 6-digit phone verification OTP               | Public                                         | `sendPhoneOtpSchema`                  |
| `POST`  | `/auth/phone/verify-otp`                 | Verify phone number with 6-digit OTP                 | Public                                         | `verifyPhoneOtpSchema`                |
| `GET`   | `/users/me`                              | Retrieve authenticated user profile                  | Bearer JWT                                     | None                                  |
| `GET`   | `/users/:id/profile`                     | Fetch aggregated user, buyer, and technician profile | Bearer JWT / Internal                          | None                                  |
| `GET`   | `/technicians/:id/badges`                | Fetch technician certifications & vetting badges     | Bearer JWT                                     | None                                  |
| `POST`  | `/technicians/batch`                     | Batch lookup of verified technician summary profiles | Internal Service (`dispatch-matching-service`) | `batchTechniciansSchema` (1..100 IDs) |
| `POST`  | `/technicians/certifications`            | Submit new technician certification for review       | `TECHNICIAN`, `ADMIN`                          | `createCertificationSchema`           |
| `PATCH` | `/technicians/certifications/:id/verify` | Verify or reject technician certification            | `ADMIN`, `DISPATCHER`                          | `verifyCertificationSchema`           |
| `GET`   | `/technicians/certifications/pending`    | List pending certifications awaiting review          | `ADMIN`, `DISPATCHER`                          | None                                  |

> **"Bearer JWT" means the token, not the header.** `/users/me` resolves the
> caller from the verified token's `sub` claim. The `x-ff-user-id`, `x-ff-user-role`,
> and `x-ff-profile-id` headers the gateway injects are asserted downstream after
> token verification (`RULE-AUTH-03`, ADR 006). Downstream domain services use the
> token `profileId` claim (or the gateway-asserted `x-ff-profile-id` header) to identify
> buyer and technician aggregates directly without cross-service SQL queries into
> foreign user tables. Direct callers cannot bypass the token requirement. The gateway
> strips any inbound `x-ff-*` before asserting its own.
>
> New endpoints in this catalogue inherit that rule — verify the token, use
> `payload.sub` or `payload.profileId`. `docs/ISSUES.md` **C5** and **FF-ARCH-02**
> record the bounded context and identity invariants.

---

## 2. Work Order Lifecycle Service (`work-order-service`)

| Method  | Endpoint                                                    | Description                                                                     | Auth / RBAC           | Payload Schema               |
| :------ | :---------------------------------------------------------- | :------------------------------------------------------------------------------ | :-------------------- | :--------------------------- |
| `POST`  | `/work-orders`                                              | Create a new work order draft                                                   | `BUYER`               | `createWorkOrderSchema`      |
| `GET`   | `/work-orders`                                              | List & filter work orders (by status, date, location)                           | Authenticated         | `listWorkOrdersQuerySchema`  |
| `GET`   | `/work-orders/:id`                                          | Fetch complete work order details                                               | Authenticated         | None                         |
| `GET`   | `/work-orders/:id/history`                                  | Fetch immutable state transition audit history                                  | Authenticated         | None                         |
| `POST`  | `/work-orders/:id/publish`                                  | Transition draft work order to `PUBLISHED`                                      | `BUYER`               | None                         |
| `POST`  | `/work-orders/:id/transition`                               | Execute validated FSM state transition (manual `PAID` blocked; event-driven)    | `BUYER`, `TECHNICIAN` | `transitionStatusSchema`     |
| `PATCH` | `/work-orders/:id/status`                                   | Alias to execute validated FSM transition (manual `PAID` blocked; event-driven) | `BUYER`, `TECHNICIAN` | `transitionStatusSchema`     |
| `POST`  | `/work-orders/:id/deliverables/presigned-url`               | Generate pre-signed upload PUT URL for media storage                            | `TECHNICIAN`, `ADMIN` | `generatePresignedUrlSchema` |
| `POST`  | `/work-orders/:id/deliverables`                             | Confirm deliverable upload with HeadObject verification & persist record        | `TECHNICIAN`, `ADMIN` | `confirmDeliverableSchema`   |
| `GET`   | `/work-orders/:id/deliverables/:deliverableId/download-url` | Generate pre-signed download GET URL for authorized callers (900s)              | Authenticated (Owner) | None                         |
| `POST`  | `/work-orders/:id/deliverables/signature`                   | Submit cryptographic digital signature artifact                                 | `TECHNICIAN`, `ADMIN` | `recordSignatureSchema`      |
| `POST`  | `/work-orders/:id/signature`                                | Alias to submit digital signature artifact                                      | `TECHNICIAN`, `ADMIN` | `recordSignatureSchema`      |
| `GET`   | `/work-orders/:id/deliverables`                             | Fetch deliverables for work order                                               | Authenticated (Owner) | None                         |
| `POST`  | `/work-orders/:id/bids`                                     | Submit contractor bid for work order                                            | `TECHNICIAN`          | `submitBidSchema`            |
| `GET`   | `/work-orders/:id/bids`                                     | List all bids submitted for work order                                          | Authenticated         | None                         |
| `POST`  | `/work-orders/:id/bids/:bidId/accept`                       | Atomic bid accept, reject siblings, assign job (FSM)                            | `BUYER`               | None                         |
| `POST`  | `/work-orders/bids`                                         | Legacy route alias to submit bid                                                | `TECHNICIAN`          | `submitBidSchema`            |
| `GET`   | `/work-orders/bids/:id`                                     | Legacy route alias to fetch bid by ID                                           | Authenticated         | None                         |
| `POST`  | `/work-orders/bids/:id/accept`                              | Legacy route alias to accept bid                                                | `BUYER`               | None                         |
| `GET`   | `/internal/work-orders/:id/billing-context`                 | Narrow billing context projection (id, buyerId, assignedTechnicianId, status)   | Internal Service Auth | None                         |

> **Internal Service Authentication (ISSUE-002, ADR 006, RULE-ARCH-01):**
> Endpoints under `/internal/*` are inaccessible via `api-gateway` (the gateway strips inbound `x-fieldforge-*` headers and drops `/internal/*` route matches).
> Cross-service HTTP queries (e.g. `billing-service` → `work-order-service`) use `InternalServiceGuard` asserting `x-fieldforge-service-name` and `x-fieldforge-internal-secret` in constant time (`safeCompareSecrets`). The returned payload is strictly narrow (`WorkOrderBillingContextDto`), preventing leakage of contractor addresses, descriptions, or financial budgets.

---

## 3. Dispatch & Geospatial Matching Service (`dispatch-matching-service`)

| Method | Endpoint                         | Description                                             | Auth / RBAC           | Payload Schema                   |
| :----- | :------------------------------- | :------------------------------------------------------ | :-------------------- | :------------------------------- |
| `POST` | `/dispatch/technicians/location` | Update live contractor geospatial coordinates           | `TECHNICIAN`          | `updateTechnicianLocationSchema` |
| `GET`  | `/dispatch/technicians/nearby`   | Redis `GEOSEARCH` matching with composite score rank    | `BUYER`, `DISPATCHER` | `nearbyTechniciansQuerySchema`   |
| `POST` | `/dispatch/auto-route`           | Trigger automated rule-based ticket dispatch ($\le 5$m) | `BUYER`, `DISPATCHER` | `autoRouteSchema`                |

> _Note: Legacy `/dispatch/bids` requests are transparently rewritten and proxied to `/work-orders/bids` by `api-gateway`._

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

| Routing Key                      | Event Type                       | Publisher            | Consumer Queue                            | Consumer Service               | Payload Contract              |
| :------------------------------- | :------------------------------- | :------------------- | :---------------------------------------- | :----------------------------- | :---------------------------- |
| `work_order.lifecycle.published` | `work_order.lifecycle.published` | `work-order-service` | `fieldforge.dispatch.work-orders`         | `dispatch-matching-service`    | `WorkOrderPublishedPayload`   |
| `work_order.lifecycle.published` | `work_order.lifecycle.published` | `work-order-service` | `fieldforge.notifications.work-orders`    | `notification-service`         | `WorkOrderPublishedPayload`   |
| `work_order.lifecycle.assigned`  | `work_order.lifecycle.assigned`  | `work-order-service` | `fieldforge.notifications.work-orders`    | `notification-service`         | `WorkOrderAssignedPayload`    |
| `work_order.lifecycle.approved`  | `work_order.lifecycle.approved`  | `work-order-service` | `fieldforge.billing.work-orders`          | `billing-service`              | `WorkOrderApprovedPayload`    |
| `work_order.lifecycle.cancelled` | `work_order.lifecycle.cancelled` | `work-order-service` | `fieldforge.billing.work-orders`          | `billing-service`              | `WorkOrderCancelledPayload`   |
| `work_order.lifecycle.paid`      | `work_order.lifecycle.paid`      | `work-order-service` | `fieldforge.notifications.work-orders`    | `notification-service`         | `WorkOrderPaidPayload`        |
| `tech.bidding.submitted`         | `tech.bidding.submitted`         | `work-order-service` | `fieldforge.notifications.work-orders`    | `notification-service`         | `TechBiddingSubmittedPayload` |
| `tech.bidding.accepted`          | `tech.bidding.accepted`          | `work-order-service` | _(Deprecated / Retired)_                  | _(Eliminated; see FF-ARCH-11)_ | `TechBidAcceptedPayload`      |
| `billing.escrow.funded`          | `billing.escrow.funded`          | `billing-service`    | `fieldforge.work-orders.billing`          | `work-order-service`           | `EscrowFundedPayload`         |
| `billing.payout.disbursed`       | `billing.payout.disbursed`       | `billing-service`    | `fieldforge.work-orders.lifecycle-events` | `work-order-service`           | `PayoutDisbursedPayload`      |
| `billing.payout.failed`          | `billing.payout.failed`          | `billing-service`    | `fieldforge.work-orders.lifecycle-events` | `work-order-service`           | `PayoutFailedPayload`         |

> **Header & Trace Propagation Invariant (`RULE-EVENT-03`, `RULE-OBS`)**:
> Every published message envelope includes:
>
> - `x-correlation-id`: Request correlation ID propagated from HTTP caller or prior event.
> - `x-event-id`: Unique UUID v4 identifying the event instance for 7-day Redis deduplication (`ff:idemp:<eventId>`).
> - `x-event-type`: Strict event type matching contract enum.
> - `x-retry-count`: Current retry invocation counter (0 for initial publish, max 3).
> - Delivery mode: Persistent (`deliveryMode = 2`).
>
> **Payload Identifier Standard (`RULE-EVENT-03`, `FF-ARCH-14`)**:
> All domain event payloads and DTOs standardize strictly on `technicianId: string` across the entire FieldForge application (`WorkOrderAssignedPayload`, `WorkOrderApprovedPayload`, `WorkOrderPaidPayload`, `TechBiddingSubmittedPayload`, `TechBidAcceptedPayload`, `PayoutDisbursedPayload`, `PayoutFailedPayload`, `NearbyTechnicianDto`, `BidDetailsDto`, `PayoutLedgerItemDto`, `TechnicianEarningsDto`). The informal abbreviation `techId` has been completely eliminated across all contracts, services, frontend, and tests with zero backward compatibility fallbacks.

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
| `useAcceptBidMutation`             | `POST` | `/work-orders/bids/:id/accept`  | Invalidates: `['Bid', 'WorkOrder', 'Technician']` |
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

### Marketing presentation review — 2026-09-28

The `/marketing` hero refresh changes no HTTP endpoints, DTOs, validators, events,
or database schemas. Tracking, job statuses, and metrics in this public preview
are illustrative UI content. Reference-colored status badge overrides apply only
to this public illustration; operational status enums and defaults are unchanged.
The subsequent asset-separation, zoom, and detailed 1536px reference corrections
also change no contracts.
Existing links to `/create-wo`, `/resources`, and `/operations` are retained.

The subsequent five-item platform assurance strip is also presentation-only.
It introduces no API calls, endpoints, schemas, or verification guarantees; its
assurance labels are marketing copy, not additional implementation evidence.

### Marketing lifecycle layout note (2026-09-29)

The compact lifecycle illustration is static presentation. Its seven stages and
summary values do not call APIs or modify DTOs, validators, events, or endpoints.

The real-work illustration now contains native sample-job markup. These fixed
examples do not fetch or mutate work orders; contracts and endpoints are unchanged.

Marketplace reference styling introduces no API changes. Sample-card entry links
use the existing `/technicians` page; sample ratings and availability are static.

The smart-dispatch marketing redesign uses existing static candidate/map data
and introduces no endpoints, requests, DTOs, events, or dispatch side effects.

The operations/payment marketing update adds no APIs or state transitions.
Preview links lead to existing `/`, `/technicians`, and `/audit` pages; they do
not submit notes, sign work orders, generate reports, or release funds.

The compliance layout change introduces no requests or verification endpoints.
Its existing sample profile now links to the `/technicians` directory; displayed
credentials, history, match percentages, and trust counts remain static.

### Command center presentation follow-up (2026-09-29)

The marketing Command Center layout changes no endpoints, DTOs, events, or
authorization contracts. Its summary values, map, and technician rows remain
illustrative data without new API calls.

### Audience and expertise reference follow-up (2026-09-29)

Audience/expertise layout changes introduce no endpoints, DTOs, event types, or authorization changes. Existing navigation destinations remain unchanged.

### Reliability and closing banner follow-up (2026-09-29)

Reliability/CTA presentation introduces no new API calls, endpoints, DTOs, or events. The assignment preview links to the existing technician directory; it creates no assignment mutation.

### Footer reference follow-up (2026-09-29)

Footer updates introduce no endpoints, DTOs, events, external subscription requests, or persistent data. Email input remains local to the form, and submit displays service-unavailability feedback without transmitting or logging the address.

### Real Work reference alignment correction (2026-09-29)

Real Work reference alignment changes only marketing presentation and a local image. No REST endpoints, DTOs, validators, events, or persistence changes.

### Command Center native demo map (2026-09-29)

Command Center map interactions run entirely in local component state. No new endpoints, DTOs, events, geolocation requests, or live tracking integrations. View All Technicians retains the `/technicians` route.

### Dispatch demo maps and portraits (2026-09-29)

San Francisco and Texas marketing demo maps reuse local bounded map state only. No service calls, external tile requests, geolocation, assignments, DTOs, events, or migrations change.

### Platform page reference redesign (2026-10-03)

Platform redesign adds no REST endpoints, DTOs, events, or persistence. Work-order search and status filtering operate on five local sample rows. Newsletter input is not transmitted or stored. Company/legal labels without implemented destinations remain noninteractive; existing CTA destinations are reused.

### Solutions page reference redesign (2026-10-03)

The `/solutions` redesign introduces no endpoints, DTOs, events, database changes, or service contracts. Search and dispatch selections use local sample data. Invite/View Job links navigate to existing routes. Sales/newsletter previews send no requests and do not simulate successful submission; Sign in/Get started reuse the existing authentication modal.

### Industries page reference redesign (2026-10-03)

Industries presentation adds no endpoints, DTOs, migrations, or events. Industry links navigate to existing Solutions anchors. Signup reuses AuthModal; sales/newsletter controls retain their explicit unavailable state. The page adds no service or industry eligibility guarantees.

### Resources page reference redesign (2026-10-03)

Resources uses static bundled content and files at `/resources/field-operations-reporting.csv` and `/resources/technician-onboarding-checklist.csv`. These are public static downloads, not new service endpoints. Search/filter/dialog state is local; newsletter sends no request. No DTO, event, database, migration or shared contract changes.

### Pricing page reference redesign (2026-10-03)

No endpoint, DTO, validator, event or payment contract changed. Pricing calculator uses a local 12% display constant and integer-cent arithmetic; its $1–$1,000,000 input bounds are UI preview limits only. Contact/newsletter controls explicitly report unavailable integrations. AuthModal initial role is a UI selection, not an authorization grant.

### Shared public navigation (2026-10-03)

Navbar/footer consolidation adds no endpoints, DTOs or events. Search navigates
to the existing `/technicians` frontend route; Log in reuses AuthModal and its
existing authentication contract. Authorization and registration roles are unchanged.
