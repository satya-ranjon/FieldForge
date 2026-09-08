# FieldForge Development Plan

> Companion to [`SRS.md`](./SRS.md) (what to build), [`ISSUES.md`](./ISSUES.md) (what is broken), and
> [`.agent/context/project_status.md`](../.agent/context/project_status.md) (what exists today).
> This document is the **sequencing** layer: the order in which the gaps get closed, and what
> counts as done for each step.

## Context

FieldForge is an **early scaffold with a mature specification**. `docs/SRS.md`,
`.agent/context/api_contracts.md`, and `README.md` describe a production field-service
marketplace; the code implements type definitions, a Drizzle schema, one migration, a rich mock
buyer UI, and `console.log` stubs.

Verified state of the tree **as of 2026-08-31, before Phase 0 began** — this is the baseline the
phases below are sequenced against, not a description of the current code. Phases 0, 1, and 2
have since landed, so several items here are now false (there are domain controllers, a real trust
boundary, database-backed work-order lifecycle, server-side geofencing, and 306 unit/integration tests).
For what exists today, read [`.agent/context/project_status.md`](../.agent/context/project_status.md);
for what is still broken, read [`ISSUES.md`](./ISSUES.md), whose counts supersede the tally at the
end of this section:

- **No domain HTTP controllers exist anywhere.** The only controller in the repo is the shared
  `HealthController` (`packages/common/src/health/health.controller.ts`). Every endpoint in
  `api_contracts.md` returns 404.
- **No service opens a database connection.** `createDbClient` (`packages/database/src/index.ts`)
  is never called; work-order and escrow "state" is a returned object literal.
- **No trust boundary.** `JwtAuthGuard.canActivate()` returns `true` on every path
  (`apps/api-gateway/src/guards/jwt-auth.guard.ts`), is not registered as `APP_GUARD`, and no
  `RolesGuard` exists. `AuthModule` is empty (`apps/auth-service/src/auth.module.ts`).
- **No proxying.** `gatewayConfig.services` (`apps/api-gateway/src/config/gateway.config.ts`) is
  declared but unused.
- **The event pipeline is inert.** `WorkOrderEventPublisher` only logs; consumers have handler
  methods with no `@EventPattern` or queue binding; nothing binds to `fieldforge.events.topic`.
- **No tests.** Every service runs `jest --passWithNoTests`, so CI is green by construction. Only
  Playwright specs exist, and they run against mock UI state.

`docs/ISSUES.md` catalogues this as 4 Critical / 9 High / 12 Medium / 8 Low.

**Intended outcome:** the documented flow — buyer publishes a work order → dispatch matches
technicians → technician bids → buyer accepts → escrow holds funds → geofenced check-in →
deliverables → approval → payout — actually runs end to end against the local Docker stack
(MySQL 8.4, Redis 8.0, RabbitMQ 4.1), persisted, transactional, event-driven, and covered by tests
that would fail if it broke. The README becomes true rather than aspirational.

## Decisions locked for this plan

| Decision               | Choice                                                                                                                                | Rationale                                                                                                                                                    |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target end state       | Working **local** E2E system via `docker compose` + `pnpm dev`                                                                        | Highest credibility per unit of effort                                                                                                                       |
| Kubernetes / Terraform | Remain a documented scaffold (H8, L4 stay open)                                                                                       | Out of scope; explicitly listed as open below                                                                                                                |
| External providers     | **Ports + in-repo fake adapters** (ledger payments, log-only SMS/push, local-disk media)                                              | Keeps CI hermetic and credential-free; real SDKs slot in behind the same port later                                                                          |
| Mobile app             | In scope, **after** the backend (Phase 6)                                                                                             | Depends on real endpoints existing                                                                                                                           |
| FSM canon              | **SRS wins** per `AGENTS.md` source-of-truth order: add `PAID`; `SETTLED`/`BIDDING`/`OPEN`/`IN_PROGRESS` are removed from docs and UI | `docs/SRS.md` FR-WO-002 is rank 2; README/UI are rank 7. Bids are a table (`work_order_bids`), not a work-order state                                        |
| Money representation   | Integer **minor units** in DTOs and events (`*AmountMinor`); DB stays `DECIMAL`                                                       | Resolves M5; the naming change must land before Phase 5 UI work                                                                                              |
| Identity source        | Always the **verified token**, never the request body                                                                                 | `createWorkOrderSchema.buyerId`, `submitBidSchema.technicianId`, and `PreAuthEscrowDto.buyerId` are currently caller-supplied — a privilege-escalation shape |

Per `RULE-GIT-06`: each phase is one or more `feature/*` branches off `develop`, with
`pnpm check && pnpm build` passing before every PR. At each phase close, update
`.agent/context/project_status.md` and mark the resolved IDs in `docs/ISSUES.md`.

---

## Phase 0 — Canon, contracts, and a real test harness

**Size: S · No runtime dependencies — unblocks every later phase.** Resolves M1, M3, M4, M5, M7,
M11, H7.

Nothing downstream is safe to build until there is one FSM definition, one money type, and a test
command that can actually fail.

- **FSM canon.** Add `PAID` to `WorkOrderStatus` (`packages/contracts/src/enums/index.ts`) and to
  the `work_orders.status` enum. Extend `validTransitions` in
  `apps/work-order-service/src/modules/fsm/work-order-fsm.service.ts` with `APPROVED → PAID` and
  `PAID → []`. Strip the `BIDDING`/`SETTLED`/`OPEN`/`IN_PROGRESS` branches from
  `packages/ui/src/components/StatusBadge.tsx` and reconcile `.agent/context/domain_entities.md`.
- **Money.** Add `packages/contracts/src/money.ts` (`toMinor`/`fromMinor`/format helpers). Rename
  `budgetAmount` → `budgetAmountMinor`, `amount` → `amountMinor`, `maxBudget` → `maxBudgetMinor`,
  `payoutAmount` → `payoutAmountMinor` across `packages/contracts/src/dto/*` and `events/*`, typed
  as integers. DB columns stay `DECIMAL`; convert at the repository edge.
- **Event envelope.** Add `EventEnvelope<T>` to contracts — `eventId`, `eventType`, `occurredAt`,
  `correlationId`, `payload` — and reshape the five existing event interfaces as payloads inside
  it. This is the M7 fix, and Phase 3 depends on the field existing.
- **Missing validators.** Add `transitionStatusSchema` (referenced by `api_contracts.md` but never
  defined) to `packages/contracts/src/validators/work-order.schema.ts`; it takes `nextStatus` plus
  optional `latitude`/`longitude` for the on-site transition. Rename
  `submitBidSchema.proposedAmount` → `bidAmountMinor` to match the `bid_amount` column. Drop
  `buyerId`/`technicianId` from request schemas — those come from the token.
- **Migration `0001_canon_and_constraints.sql`:** add `PAID` to the status enum; `UNIQUE` on
  `escrow_accounts.work_order_id` (M3); replace `idx_wo_status` + `idx_wo_schedule` with composite
  `idx_wo_status_sched (status, scheduled_start_time)` per `RULE-DB-02` (M4).
- **Test harness.** New `packages/jest-config` with a `ts-jest` base preset. Per-service
  `jest.config.ts` extending it. Remove `--passWithNoTests` from all eight `package.json` test
  scripts and seed each service with at least one real unit test. Start coverage thresholds low and
  raise them per phase toward the SRS §5 target of 90% on business rules.

**Exit criteria:** `pnpm check` is green _and_ deleting an FSM transition makes it red. One
`WorkOrderStatus`, one money type, one event envelope across the repo.

**Verify:** `pnpm check && pnpm build`; `pnpm db:migrate && pnpm db:seed` against `pnpm docker:up`.

---

## Phase 1 — Identity and a real trust boundary

**Size: L · Depends on Phase 0.** Resolves C2, H3, H2, M12, L2.

- **Shared Drizzle module.** Add `packages/common/src/database/drizzle.module.ts` — a NestJS
  `DynamicModule` providing a `DRIZZLE` injection token built from `DATABASE_URL` via the existing
  `createDbClient` (`packages/database/src/index.ts`). Every service consumes this; no service gets
  its own pool factory.
- **auth-service.** `AuthController` (`POST /auth/register`, `/auth/login`, `/auth/refresh`),
  `UsersController` (`GET /users/me`), `AuthService` using `bcrypt` for hashing and `@nestjs/jwt`
  for HS256 access tokens (short TTL) plus rotating refresh tokens. Migration `0002_auth.sql` adds
  `refresh_tokens` (hashed token, user, expiry, revoked) and `technician_certifications`
  (FR-AUTH-003) to back the existing `CertificationsService`. Mount `HealthController` — it is
  currently absent from `auth.module.ts`.
- **Gateway guards.** Rewrite `JwtAuthGuard` to verify the token and populate `request.user`. Add
  `@Public()` to `packages/common/src/decorators/` and register the guard as `APP_GUARD`. Add
  `RolesGuard` to `packages/common` reading `ROLES_KEY` from the existing `roles.decorator.ts` —
  the `@Roles()` decorator currently decorates nothing.
- **Gateway proxy.** Forward `/api/v1/{auth,users,work-orders,dispatch,billing}` to the URLs
  already in `gateway.config.ts`. Propagate the `x-correlation-id` set by
  `correlation-id.middleware.ts`, and inject verified `x-ff-user-id` / `x-ff-user-role` headers,
  **deleting any inbound copy of those headers first** — `express-http-proxy` forwards inbound
  headers by default, and on a public route there is no verified identity to overwrite a spoofed
  one with.
  Downstream services may read those headers for logging and correlation, but **must not treat
  them as proof of identity**: every service listens on `0.0.0.0` with no NetworkPolicy or mTLS,
  so any caller that can reach the port can also set the header. A service that needs identity
  verifies the bearer token itself and uses `payload.sub`; the header is at most a cross-check
  whose disagreement is grounds for a 401. Trusting it instead of the token is what produced
  **C5** — treat that entry as the worked example before adding a downstream reader.
  **Document explicitly** that gateway-enforced RBAC is an edge control valid for local
  development, and that service-to-service authentication is an open hardening item.
- **Rate limiting + CORS.** `@nestjs/throttler` with a Redis store at the edge. Replace
  reflect-any-origin CORS with an allowlist derived from `WEB_PORT` (M12).
- **Logging.** Replace `console.*` in gateway and auth with `createLogger()`
  (`packages/common/src/logger/index.ts`), configured to redact `authorization`, password fields,
  phone numbers, and emails (L2 plus the PII half of M12).

**Exit criteria:** an unauthenticated call to any non-public route returns 401; register → login →
`GET /users/me` works through port 8000; a `BUYER` token is rejected from a `TECHNICIAN`-only route;
and — added after C5 — a call sent **directly** to `auth-service` carrying only `x-ff-user-id` and no
bearer token returns 401 rather than that user's profile. The first three criteria all passed while
the fourth was failing, which is the reason it is now written down: they test the happy path through
the boundary, not the paths around it.

**Verify:** supertest integration suite in `apps/auth-service` against Dockerised MySQL, plus a
manual `curl` sequence through the gateway. Unit-level regression guards for the C5 class of bug
live in `apps/auth-service/test/users.controller.spec.ts` and
`apps/api-gateway/test/proxy.controller.spec.ts`; the key-handling guards are in
`apps/api-gateway/test/jwt-secret.spec.ts`.

---

## Phase 2 — Persistent, transactional work-order lifecycle

**Status: Completed (2026-09-04).** Resolves C4, H4, H5, M8 (partial), L5. Implements FR-WO-001/002/003,
FR-MOB-001/002/003.

- **Controllers + repository.** `WorkOrdersController` implements create (`POST /work-orders`), list (`GET /work-orders` with composite index filters `status` and `scheduledStartTime`), fetch (`GET /work-orders/:id`), history (`GET /work-orders/:id/history`), publish (`POST /work-orders/:id/publish`), transition (`POST /work-orders/:id/transition` & `PATCH /work-orders/:id/status`), deliverables presigned URL (`POST /work-orders/:id/deliverables/presigned-url`), signature (`POST /work-orders/:id/signature` & `/deliverables/signature`), and deliverables list (`GET /work-orders/:id/deliverables`). Drizzle ORM replaces in-memory stubs.
- **Real FSM enforcement.** All status transitions execute inside `db.transaction()` with `SELECT … FOR UPDATE` row locks. The actual persisted status is strictly validated against `WorkOrderFsmService.validateTransition`, caller identity is checked for ownership (buyer) or assignment (technician), changes are persisted, and state changes are recorded in `work_order_status_history` table (migration `0003_wo_history.sql`).
- **Server-side geofence (H5).** Haversine implementation relocated to `packages/common/src/geo/haversine.ts`. `EN_ROUTE → ON_SITE` transition enforces coordinates against stored location with 200m tolerance per SRS FR-MOB-001 (199m accepted, 201m rejected). Mobile client check is UX-only.
- **Deliverables & Media Storage.** Defined `MediaStoragePort` interface and token with `LocalDiskMediaStorageAdapter`. Stable SHA-256 digest hashing implemented without `Date.now()` (resolving L5); `signed_at`, `client_name`, and `signature_hash` are stored in dedicated columns in `work_order_deliverables`.
- **SLA Escalation.** Registered `SlaEscalationService` in `WorkOrderModule`, fixed `checkSlaBreachRisk` predicate to flag already-breached work orders (`timeRemainingMs <= 0`), added `isBreached` helper, and added `@Cron(CronExpression.EVERY_5_MINUTES)` sweep. (72-hour auto-approval lands in Phase 4 with the billing money path).

**Verification:**

- 167 tests in `apps/work-order-service` passing across 6 suites:
  - FSM transition matrix and concurrency row-lock simulation (`work-orders.service.spec.ts`)
  - Server-side geofence boundaries at 0m, 199m, 201m (`haversine.spec.ts`, `work-orders.service.spec.ts`)
  - Deterministic signature hashing and storage adapter (`deliverables.service.spec.ts`)
  - SLA breach check for future and past expired deadlines (`sla-escalation.service.spec.ts`)
  - Controller authentication, C5 spoofing protection, and transition aliases (`work-orders.controller.spec.ts`)
  - Complete 100-pair status transition matrix (`work-order-fsm.service.spec.ts`)
- Full monorepo passing: 324 tests across all packages/services.

---

## Phase 3 — Event backbone

**Status: Completed (2026-09-05).** Resolves H1, M6, and completes M7. Implements FR-DISP-004, FR-OBS-001, NFR-REL-002.

- **New `packages/messaging`.** Reusable NestJS dynamic module (`MessagingModule.forRoot(...)`) adhering to `RULE-EVENT-03`:
  - Central topic exchange: `fieldforge.events.topic` (durable).
  - Dead-letter exchange and default queue: `fieldforge.events.dlx` and `fieldforge.events.dlq`.
  - Publisher (`EventPublisher`) utilizing publisher-confirms (`ConfirmChannel`), persistent delivery mode, mandatory headers (`x-correlation-id`, `x-event-id`, `x-event-type`, `x-retry-count`), and JSON payload serialization.
  - Idempotent consumer wrapper (`IdempotentConsumer`) providing atomic deduplication via Redis `SETNX` on `eventId` with 7-day TTL (`ff:idemp:<eventId>`), status progression (`in_flight` → `completed` or `failed`), bounded retries (max 3 retries with exponential backoff: 1s, 2s, 4s, capped at 10s), and automatic dead-lettering to DLX on fatal errors or exhausted retries.
  - Correlation ID restoration: consumer context extracts `correlationId` from headers/envelope and initializes a scoped child Pino logger for seamless distributed tracing.
- **Wired producers.** In `apps/work-order-service`, replaced mock logger with confirmed AMQP publishes in `WorkOrderEventPublisher` at database transaction boundaries for `published`, `assigned`, `approved`, and `paid` lifecycle events.
- **Wired consumers.**
  - `apps/dispatch-matching-service`: `WorkOrderCreatedConsumer` bound to queue `fieldforge.dispatch.work-orders` subscribing to `work_order.lifecycle.published`.
  - `apps/notification-service`: `NotificationConsumer` bound to queue `fieldforge.notifications.work-orders` subscribing to `work_order.lifecycle.published` (SMS dispatch alert) and `work_order.lifecycle.assigned` (Push notification).
  - `apps/billing-service`: `BillingConsumer` bound to queue `fieldforge.billing.work-orders` subscribing to `work_order.lifecycle.assigned` (lock escrow) and `work_order.lifecycle.approved` (release escrow).
- **Contracts updated.** Added `WORK_ORDER_PAID`, `TECH_BIDDING_SUBMITTED`, DLX/DLQ constants, and typed event factories in `@fieldforge/contracts`.

**Verification:**

- 359 tests passing across all packages and services (zero `--passWithNoTests`):
  - 17 tests in `packages/messaging` (5 suites) covering retry policy, Redis idempotency atomic lifecycle, event publisher headers and NACK handling, idempotent consumer deduplication and DLQ routing, and end-to-end integration over live RabbitMQ/Redis.
  - 172 tests in `apps/work-order-service` (7 suites) including publisher integration.
  - 9 tests in `apps/dispatch-matching-service` (2 suites) including consumer bootstrap and event handling.
  - 13 tests in `apps/notification-service` (1 suite) including AMQP event consumers.
  - 8 tests in `apps/billing-service` (2 suites) including billing consumer escrow integration.
  - 69 tests in `@fieldforge/contracts` (3 suites).
- 18/18 tasks passed clean type checking without Turborepo cache (`pnpm validate:clean-typecheck`).
- `pnpm check` and `pnpm build` pass with 0 warnings and 0 errors.

---

## Phase 4 — Dispatch, bidding, and money (Completed)

**Size: L · Depends on Phase 3.** Resolves C3 and the remainder of M8. Implements
FR-DISP-001/002/003/004, FR-BILL-001/002/003, NFR-REL-003.

This phase eliminates the single most critical open defect in the repository (C3) and establishes
end-to-end transactional money safety and intelligent contractor matching.

- **Real geospatial matching.** Implemented in `apps/dispatch-matching-service/src/modules/geo-search/geo-search.service.ts`
  using Redis `GEOADD` and `GEOSEARCH` with 10-mile fallback, Haversine exact distance calculation,
  and multi-parameter scoring function (40% distance, 30% rating, 15% completed jobs, 15% verified certifications).
  Exposed `POST /dispatch/technicians/location` and `GET /dispatch/technicians/nearby`.
- **Transactional bidding & Auto-routing.** Implemented in `apps/dispatch-matching-service/src/modules/bids/bids.service.ts`:
  - `POST /dispatch/bids`: validated via `submitBidSchema`, checks for active work orders and duplicate pending bids, persists `work_order_bids`, and emits `tech_bidding.submitted`.
  - `POST /dispatch/bids/:id/accept`: concurrency-safe single transaction locking work order and bid rows `FOR UPDATE`, verifies buyer ownership, transitions bid to `ACCEPTED`, updates sibling bids to `REJECTED`, assigns technician, transitions work order to `ASSIGNED`, records status history, and emits `work_order.lifecycle.assigned`.
  - `POST /dispatch/auto-route`: implements FR-DISP-003, locking work order, discovering top-scoring contractor within radius, and atomically assigning with event publication.
- **Escrow, correctly (C3 resolved).** Completely rewritten in `apps/billing-service/src/modules/escrow/escrow.service.ts`:
  - `lockFunds()`: transactional `HELD` insert enforcing 1:1 work order to escrow constraint, calling payment provider, and publishing `billing.escrow.funded`.
  - `releaseFunds()`: executed inside a single `db.transaction()` with row-level locks (`FOR UPDATE`) on `escrow_accounts` and `work_orders`. Asserts `escrow.status === 'HELD'`, asserts work order is in `APPROVED` status, checks caller authorization (buyer owner or admin), updates escrow to `RELEASED`, updates work order to `PAID`, records status history, records double-entry payout ledger credit, generates immutable invoice, enforces idempotency, and publishes `billing.payout.disbursed`.
- **Payment provider abstraction.** Defined `PaymentProviderPort` and implemented `LedgerPaymentProvider` for deterministic, offline-capable double-entry ledger bookkeeping.
- **Idempotency keys table.** Added `idempotency_keys` table via migration `0004_long_marvel_boy.sql` and enforced across escrow releases and bids.
- **Auto-approval + Immutable Invoices.**
  - `SlaAutoApprovalService`: scheduled cron worker (`@Cron(CronExpression.EVERY_5_MINUTES)`) auto-approving `COMPLETED` work orders $\ge 72$ hours past and triggering escrow release (FR-BILL-002).
  - `InvoicesService`: generates immutable invoice records with deterministic SHA-256 content hashes (`computeContentHash`) and exports cryptographically verified PDF receipts using `pdfkit` (FR-BILL-003).
  - Technician earnings and payout ledger endpoints (`GET /billing/technicians/:id/payouts`, `GET /billing/invoices/:id`, `GET /billing/invoices/:id/pdf`).

**Verification:**

- 376 tests passing across all packages and services (zero `--passWithNoTests`):
  - 19 tests in `apps/billing-service` (4 suites) covering transactional escrow lock/release, C3 authority and state guards, duplicate lock prevention, idempotency cache replay, immutable invoice hashing and PDF generation, and 72-hour SLA auto-approval.
  - 16 tests in `apps/dispatch-matching-service` (3 suites) covering Redis geospatial search, multi-factor contractor scoring, transactional bid submission, atomic bid acceptance with sibling rejection, and auto-routing.
  - 17 tests in `packages/messaging` (5 suites).
  - 172 tests in `apps/work-order-service` (7 suites).
  - 13 tests in `apps/notification-service` (1 suite).
  - 69 tests in `@fieldforge/contracts` (3 suites).
- 18/18 tasks passed clean type checking without Turborepo cache (`pnpm validate:clean-typecheck`).
- Pre-push verification gate passed: `pnpm format:check`, `pnpm lint` (0 errors, 0 warnings with `--max-warnings=0`), `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm check`.

---

## Phase 5 — Buyer portal on the real API (Completed)

**Size: M · Depends on Phase 4.** Resolves L6. Implements the SRS §5 Playwright coverage.

- **RTK Query with Mutex Reauth.** Added unified API slice in `apps/web-buyer-portal/src/store/services/api.ts`
  pointed at `http://localhost:8000/api/v1` via Next.js rewrites. Implemented `baseQueryWithReauth` with
  `SimpleMutex` for thread-safe access token rotation against `POST /api/v1/auth/refresh` upon receiving 401.
  Configured granular cache tags (`WorkOrder`, `WorkOrderDeliverables`, `WorkOrderHistory`, `Technician`,
  `Bid`, `Escrow`, `Invoice`) for automatic panel revalidation on state mutations.
- **Stripped hardcoded slice states & Re-homed fixtures.** Stripped hundreds of lines of static domain state
  from `workOrderSlice.ts`, `dispatchSlice.ts`, and `billingSlice.ts`. Re-homed fixtures cleanly under
  `apps/web-buyer-portal/src/mocks/fixtures/` (`workOrders.fixture.ts`, `technicians.fixture.ts`,
  `bids.fixture.ts`, `transactions.fixture.ts`).
- **Collision-safe IDs.** Replaced all legacy `Math.random()` pseudo-identifiers with `crypto.randomUUID()`.
- **Next.js App Router Route Segments.** Promoted all five command center tabs from local `useState` tabs to
  dedicated addressable URL route segments under `apps/web-buyer-portal/src/app/`:
  - `/operations`: Live dispatch kanban board, real-time SLA monitors, transition actions.
  - `/create-wo`: Multi-step SOW builder with escrow pre-authorization and template presets.
  - `/technicians`: Contractor matching radar with vetted contractor ranking and bid acceptance.
  - `/billing`: Escrow vault manager, transactional payout releases, and ledger records.
  - `/audit`: Security telemetry, immutable SHA-256 hash logs, and compliance audit trail.
- **Wired UI Components.** Refactored `SowBuilder.tsx`, `LiveDispatchBoard.tsx`, `TechnicianMatchingRadar.tsx`,
  `EscrowManager.tsx`, `TelemetryBar.tsx`, and `Header.tsx` to read from RTK Query hooks with graceful
  fixture fallbacks. Created reusable `BuyerPortalShell.tsx` wrapper preserving navigation and sync state.
- **Extended Playwright Test Suite.** Authored `apps/web-buyer-portal/e2e/lifecycle.spec.ts` validating the
  complete SRS §5 end-to-end lifecycle path: `create → publish → accept bid → approve → payout`.

**Verification:**

- 376 automated Jest unit/integration tests passing across 13 suites.
- 28 Playwright E2E tests discovered and validated across 5 spec files (smoke, navigation, sow-builder,
  auth-persistence, lifecycle) with zero errors.
- 18/18 tasks passed clean type checking without Turborepo cache (`pnpm validate:clean-typecheck`).
- Next.js 16 App Router production build succeeded (`pnpm build`) with all 5 static route segments.
- `pnpm format:check`, `pnpm lint` (0 errors, 0 warnings with `--max-warnings=0`), and `pnpm check` pass cleanly.

---

## Phase 6 — Technician mobile app (Completed)

**Size: M · Depends on Phase 4.** Resolves H6, L7. Implements FR-MOB-001/002/003/004.

- **Fixed the data-loss bug (H6).** Completely rewrote `apps/mobile-tech-app/src/services/offlineSync.service.ts` backed by `OfflineStorageAdapter` (`storage.adapter.ts`). Queue state is atomically persisted to storage on `enqueue()` and reloaded on startup. `flushQueue()` processes mutations in strict FIFO sequence with idempotency keys (`x-idempotency-key: mob-offline-<uuid>`), incrementing `retryCount` with exponential backoff on failure, and clearing an item from persistent storage only upon confirmed server success (HTTP 2xx or replay).
- **Permissions and navigation (L7).** Configured `app.json` with mandatory iOS `infoPlist` usage descriptions (`NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) and Android permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`). Added `PermissionsService` wrapping `expo-location`. Created `AppNavigator` mounting `JobListScreen` and `ActiveJobScreen` inside `App.tsx` wrapped in Redux `<Provider>`.
- **Standardized geofenced check-in (FR-MOB-001).** Re-exported canonical Haversine calculation and 200m tolerance (`GEOFENCE_TOLERANCE_METERS = 200`, `calculateDistanceMeters`, `isWithinGeofence`) in `@fieldforge/contracts/src/geo.ts`. Updated `GpsRadar.tsx` from `<100m` to `<200m`. Transition to `ON_SITE` sends live GPS coordinates to the server or enqueues offline mutation.
- **Proof of work deliverables & signatures (FR-MOB-002, FR-MOB-003).** Added interactive task verification checklists, serial number capture, timestamped before/after photo attachments with presigned URL upload flow, and on-screen client signature capture with verifiable cryptographic SHA-256 hash artifact.
- **Dedicated Jest Test Harness.** Configured `apps/mobile-tech-app/jest.config.cjs` with React Native and Expo Location mocks. Implemented 4 comprehensive unit test suites covering offline sync persistence, FIFO replay, retry backoff, zero data loss in airplane mode, 200m geofence verification, permissions handling, and active gig state progression.

**Verification:**

- 397 automated unit/integration tests passing across 17 suites in monorepo (zero `--passWithNoTests`):
  - 21 tests in `apps/mobile-tech-app` (4 suites) covering offline queue persistence across instances, FIFO replay ordering, duplicate suppression with idempotency keys, exponential backoff, complete airplane mode check-in → photo → signature → reconnect flush, 200m geofence boundaries (0m, 199m, 201m), and permissions.
  - 19 tests in `apps/billing-service` (4 suites).
  - 16 tests in `apps/dispatch-matching-service` (3 suites).
  - 17 tests in `packages/messaging` (5 suites).
  - 172 tests in `apps/work-order-service` (7 suites).
  - 13 tests in `apps/notification-service` (1 suite).
  - 69 tests in `@fieldforge/contracts` (3 suites).
- 28 Playwright E2E tests discovered and validated across 5 spec files (`pnpm test:e2e`).
- 18/18 tasks passed clean type checking without Turborepo cache (`pnpm validate:clean-typecheck`).
- `pnpm format:check`, `pnpm lint` (0 errors, 0 warnings with `--max-warnings=0`), `pnpm build`, and `pnpm check` pass cleanly.

---

## Phase 7 — Observability and measured SLO evidence (Completed)

**Status: Completed (2026-09-06).** Resolves L1, L8, M10. Implements FR-OBS-001/002/003,
NFR-PERF-001.

- **Real metrics.** Replaced console stub in `packages/common/src/apm/metrics.interceptor.ts` with centralized `MetricsRegistry` (`prom-client`). Emits `http_requests_total` (non-5xx availability counter), `http_request_duration_seconds` (read and write latency histograms with SLI buckets), `dispatch_fanout_latency_seconds` (measured from `work_order.lifecycle.published` event timestamp to notification dispatch), and `billing_reconciliation_failures_total`.
- **Honest probes.** `/readyz` probe in `HealthController` now validates injected database pool (`SELECT 1`), Redis, and RabbitMQ dependencies. Returns HTTP 200 with `{ status: 'READY', checks: { database: 'UP', ... } }` or HTTP 503 `status: 'NOT_READY'` on dependency failure (FR-OBS-003). Exposed standard Prometheus metrics on `GET /metrics`.
- **Dashboards & Recording Rules.** Added SLI recording rules in `infra/docker/rules.yml` evaluating the 5 platform SLIs. Configured Prometheus to scrape `/metrics` across all 6 microservices (8000–8005). Auto-provisioned Grafana Prometheus datasource (`infra/docker/grafana/provisioning/datasources/datasource.yml`) and comprehensive SLO dashboard (`infra/docker/grafana/dashboards/fieldforge-slos.json`) on port 3009.
- **Stop the theater (L8).** Deleted synthetic `scripts/simulate-dispatch-load.js`. Authored `scripts/k6/dispatch-load.js` driving 1,000 concurrent iterations against the live API Gateway stack with strict SLO threshold assertions (p95 read < 100ms, p95 write < 200ms, non-5xx availability ≥ 99.9%). Added `scripts/run-load-test.sh` supporting native and Dockerized k6 execution. Enforced `.catch(err => { logger.fatal({ err }, ...); process.exit(1); })` across all `main.ts` entrypoints.
- **Reconciled ADRs (M10).** Adopted ADR 004 (`004_upgrade_infrastructure_versions.md`) ratifying MySQL 8.4 LTS, Redis 8.0, and RabbitMQ 4.1; marked ADRs 001–003 as superseded.

**Verification:**

- Dedicated test suite in `@fieldforge/common` (11 tests in 2 suites) covering `MetricsRegistry`, `MetricsInterceptor` path normalization and latency recording, Prometheus text format output, and honest `/readyz` dependency checks.
- 408 automated unit/integration tests passing across 19 suites in monorepo (zero `--passWithNoTests`).
- 28 Playwright E2E tests discovered and validated across 5 spec files (`pnpm test:e2e`).
- 18/18 tasks passed clean type checking without Turborepo cache (`pnpm validate:clean-typecheck`).
- `infra:config` verified valid compose configuration with mounted rules and Grafana provisioning.
- `pnpm format:check`, `pnpm lint` (0 errors, 0 warnings with `--max-warnings=0`), `pnpm build`, and `pnpm check` pass cleanly.

---

## Phase 8 — Technician Compliance, Vetting Badges & Onboarding Verification (Completed)

**Status: Completed (2026-09-07).** Implements FR-AUTH-001 (phone OTP onboarding verification) and FR-AUTH-003 (technician vetting badges and certifications). Resolves unmounted endpoint `GET /technicians/:id/badges` from `.agent/context/api_contracts.md`.

- **Shared Contracts & Validation (`@fieldforge/contracts`).** Added DTOs and Zod validation schemas for technician badges (`TechnicianBadgeDto`), certification submission (`CreateCertificationDto`, `createCertificationSchema`), certification verification (`VerifyCertificationDto`, `verifyCertificationSchema`), and phone OTP verification (`SendPhoneOtpDto`, `sendPhoneOtpSchema`, `VerifyPhoneOtpDto`, `verifyPhoneOtpSchema`, `PhoneOtpResponseDto`). Added 5 comprehensive validation unit tests in `validators.spec.ts`.
- **Database Seed Enhancements (`@fieldforge/database`).** Seeded active verified certifications (`Cisco CCNA`, `OSHA 10`, `CompTIA A+`, `Fiber Optic Certified`, `Background Checked`) for technicians Alex Rivas and Jordan Lee across `technician_certifications`.
- **Technician Certifications & Vetting Endpoints (`apps/auth-service`).**
  - Created `CertificationsController` and expanded `CertificationsService`.
  - Exposed `GET /technicians/:id/badges` allowing retrieval of verified compliance badges for any technician (resolving either by `users.id` or `technician_profiles.id`), enforcing Bearer auth and C5 identity mismatch protection.
  - Exposed `POST /technicians/certifications` for technicians to submit new certifications (strictly deriving technician profile identity from verified token `payload.sub`).
  - Exposed `PATCH /technicians/certifications/:id/verify` restricted to `ADMIN` and `DISPATCHER` roles for vetting and verifying submitted certifications with expiration dates.
  - Exposed `GET /technicians/certifications/pending` restricted to `ADMIN` and `DISPATCHER` roles for administrative compliance auditing.
- **Phone OTP Verification Service (`apps/auth-service`).**
  - Implemented `PhoneOtpService` with secure 6-digit cryptographic OTP generation, 5-minute expiry TTL, maximum 3-attempt lock, and 10-minute rate limiting window.
  - Exposed `POST /auth/phone/send-otp` and `POST /auth/phone/verify-otp` in `AuthController`.
- **API Gateway Routing & Public Whitelist (`apps/api-gateway`).**
  - Added `/api/v1/auth/phone` to `PUBLIC_PREFIXES` in `JwtAuthGuard` to allow unauthenticated phone OTP verification during registration.
  - Configured reverse proxying for `technicians` and `technicians/{*path}` forwarding to `auth-service` with `x-correlation-id` and downstream user identity injection.
- **Frontend Portal & Mobile Tech App Integration.**
  - **Buyer Portal (`apps/web-buyer-portal`):** Added `TechnicianBadges` RTK Query API slice tag and `useGetTechnicianBadgesQuery` / `useVerifyCertificationMutation` hooks. Enhanced `TechnicianMatchingRadar.tsx` with dynamic `ShieldCheck` and `CheckCircle2` badges displaying verified technician credentials directly on dispatch cards.
  - **Mobile Tech App (`apps/mobile-tech-app`):** Added verified compliance badge chips display (`🛡️ Verified Compliance Badges`) on `JobListScreen.tsx` highlighting the technician's active credentials.

**Verification:**

- 430 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 44 tests in `apps/auth-service` (4 suites) covering certification submission, verification RBAC, badge queries, phone OTP generation, attempt limits, expiry, rate-limiting, and registration/login flows.
  - 43 tests in `apps/api-gateway` (4 suites) covering proxy routing, public endpoints, JWT validation, and RBAC guards.
  - 74 tests in `@fieldforge/contracts` (3 suites) covering all DTO schemas, money, and geo utilities.
  - 21 tests in `apps/mobile-tech-app` (4 suites).
  - 172 tests in `apps/work-order-service` (7 suites).
  - 19 tests in `apps/billing-service` (4 suites).
  - 16 tests in `apps/dispatch-matching-service` (3 suites).
  - 17 tests in `packages/messaging` (5 suites).
  - 13 tests in `apps/notification-service` (1 suite).
  - 11 tests in `@fieldforge/common` (2 suites).
- 28 Playwright E2E tests validated across 5 spec files (`pnpm test:e2e`).
- 18/18 tasks passed clean type checking without Turborepo cache (`pnpm validate:clean-typecheck`).
- `pnpm format:check`, `pnpm lint` (0 errors, 0 warnings with `--max-warnings=0`), `pnpm build`, and `pnpm check` pass cleanly.

---

## Phase 9 — Architecture Boundary Remediation: Work Order Aggregate Reconciliation

**Status: Completed (2026-09-07).** Resolves **Finding 1 (Direct Cross-Service Mutation of the Work Order Aggregate Bypassing FSM)** and aligns services with `AGENTS.md` bounded context rules and ADR 005 (`.agent/memory/ADRs/005_work_order_aggregate_boundary_reconciliation.md`).

- **Shared Contracts & Events (`@fieldforge/contracts`).**
  - Added `EventType.TECH_BID_ACCEPTED = 'tech.bidding.accepted'`.
  - Added `TechBidAcceptedPayload` and `TechBidAcceptedEvent` contract interfaces.
- **Decoupled Billing Service (`apps/billing-service`).**
  - Removed direct foreign SQL mutations on `workOrdersSchema.workOrders` and `workOrdersSchema.workOrderStatusHistory` in `EscrowService.releaseFunds()`.
  - Escrow release now strictly mutates `escrow_accounts` and `payout_ledger` before emitting `billing.payout.disbursed`.
- **Decoupled Dispatch Service (`apps/dispatch-matching-service`).**
  - Removed direct foreign SQL mutations on `workOrdersSchema.workOrders` and `workOrdersSchema.workOrderStatusHistory` in `BidsService.acceptBid()` and `autoRoute()`.
  - Replaced duplicate emissions of `work_order.lifecycle.assigned` with `tech.bidding.accepted`.
- **Single Aggregate Mutator & Lifecycle Consumer (`apps/work-order-service`).**
  - Added transactional methods `settlePaid()` (`APPROVED → PAID`) and `assignTechnicianFromBid()` (`PUBLISHED → ASSIGNED`) using `WorkOrderFsmService` validation and pessimistic row locking (`SELECT … FOR UPDATE`).
  - Implemented `WorkOrderEventsConsumer` listening on `fieldforge.work-orders.lifecycle-events` for `tech.bidding.accepted` and `billing.payout.disbursed`.
  - `work-order-service` is now the single canonical emitter for `work_order.lifecycle.assigned` and `work_order.lifecycle.paid`.

**Verification:**

- 435 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 177 tests in `apps/work-order-service` (8 suites) including `work-order-events.consumer.spec.ts`.
  - 19 tests in `apps/billing-service` (4 suites).
  - 16 tests in `apps/dispatch-matching-service` (3 suites).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 463 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 10 — Architecture Boundary Remediation: Bounded Context Data Isolation & Directory Lookup

**Status: Completed (2026-09-07).** Resolves **Finding 2 (High Coupling and Database Sharing Across Services)** and aligns services with `AGENTS.md` bounded context rules and ADR 006 (`.agent/memory/ADRs/006_bounded_context_data_isolation.md`).

- **Token-Enriched Profile Identity (`@fieldforge/contracts`, `apps/auth-service`, `apps/api-gateway`).**
  - Added `profileId?: string` to `AuthJwtPayload` and added `BatchTechniciansDto`, `batchTechniciansSchema`, and `TechnicianSummaryDto`.
  - `apps/auth-service` populates `profileId` on registration, login, and refresh.
  - `apps/api-gateway` extracts `profileId` into `request.user` and propagates downstream via `x-ff-profile-id`.
- **Strict Buyer Lifecycle & Decoupled Work Orders (`apps/work-order-service`).**
  - Eliminated synthetic profile insertion (`companyName: 'Default Buyer Co'`) in `WorkOrdersService.create()`; rejects missing profiles with `NotFoundException`.
  - Refactored `create()`, `publish()`, `transition()`, and `DeliverablesService` to use `callerProfileId` fast-path, bypassing foreign profile database queries.
- **Inter-Service Directory Lookup & Decoupled Dispatch (`apps/dispatch-matching-service`, `apps/auth-service`).**
  - `apps/auth-service` implements `POST /technicians/batch` (`getTechniciansBatch`) to serve bulk technician summaries.
  - Implemented `TechnicianDirectoryService` in `apps/dispatch-matching-service` and integrated it into `GeoSearchService.findNearbyTechnicians()`, replacing direct cross-context SQL joins against `technician_profiles`, `users`, and `technician_certifications`.
  - Refactored `BidsService.submitBid()`, `acceptBid()`, and `autoRoute()` to use `callerProfileId`.
- **Decoupled Billing Escrow (`apps/billing-service`).**
  - Added `callerProfileId` to `ReleaseEscrowParams` and prioritized it in `EscrowService.releaseFunds()` and `billing.controller.ts`, eliminating direct foreign buyer profile queries during escrow release and payout queries.
- **Backwards-Compatible Dual-Path Fallback.**
  - All services retain graceful read fallback when `callerProfileId` is omitted, ensuring zero test regressions or token compatibility breaks.

**Verification:**

- 442 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 179 tests in `apps/work-order-service` (8 suites).
  - 46 tests in `apps/auth-service` (5 suites).
  - 43 tests in `apps/api-gateway` (4 suites).
  - 20 tests in `apps/billing-service` (4 suites).
  - 17 tests in `apps/dispatch-matching-service` (3 suites).
  - 75 tests in `@fieldforge/contracts` (3 suites).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 470 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 11 — Architecture Boundary Remediation: Marketplace Bidding Relocation & Work Order Aggregate Cohesion

**Status: Completed (2026-09-07).** Resolves **Finding 3 (Misplaced Responsibility: Marketplace Bidding Inside Dispatch Service)** and aligns services with `AGENTS.md` bounded context rules and ADR 007 (`.agent/memory/ADRs/007_marketplace_bidding_work_order_cohesion.md`).

- **Bidding as First-Class Work Order Domain Feature (`apps/work-order-service`).**
  - Re-homed `BidsService` to `apps/work-order-service/src/modules/bids/`.
  - Introduced `BidsController` mounting canonical aggregate endpoints:
    - `POST /work-orders/:id/bids` (submit bid)
    - `GET /work-orders/:id/bids` (list bids for work order)
    - `POST /work-orders/:id/bids/:bidId/accept` (accept winning bid)
    - Legacy route aliases: `POST /work-orders/bids`, `GET /work-orders/bids/:id`, `POST /work-orders/bids/:id/accept`.
  - Exported `bidsSchema as workOrderBidsSchema` and `bidsSchema as marketplaceSchema` alongside `bidsSchema` from `@fieldforge/database`. Zero database migrations (`RULE-DB-02`).
- **Atomic Single-Transaction Bid Acceptance (`apps/work-order-service`).**
  - Wrapped bid acceptance, sibling bid rejection, work order FSM state transition (`PUBLISHED → ASSIGNED`), assignment audit history logging (`work_order_status_history`), and event publishing within a single ACID transaction (`db.transaction()`).
  - Emits `tech.bid.accepted` and `work_order.assigned` domain events to RabbitMQ topic exchange.
- **Purification of Dispatch Matching Engine (`apps/dispatch-matching-service`).**
  - Removed all bidding logic, services, modules, and tests from `apps/dispatch-matching-service`.
  - Refactored `DispatchController` to strictly handle geospatial operations:
    - `POST /dispatch/technicians/location` (record live GPS coordinates into Redis geospatial index)
    - `GET /dispatch/technicians/nearby` (query nearby active technicians via Redis `GEOSEARCH` with multi-parameter contractor scoring)
    - `POST /dispatch/auto-route` (calculate contractor travel time and recommend dispatch routes)
- **Transparent API Gateway Forwarding (`apps/api-gateway`).**
  - Configured `proxyReqPathResolver` in `apps/api-gateway` to rewrite `/dispatch/bids` and `/bids` to `/work-orders/bids`.
  - Forwarded legacy and portal bidding traffic directly to `work-order-service`, preserving 100% backward compatibility with zero downtime.
- **Buyer Portal & E2E Validation (`apps/web-buyer-portal`).**
  - Updated RTK Query API client `acceptBid` endpoint to target `/work-orders/bids/${bidId}/accept`.
  - Updated Playwright E2E route mocks to support `/work-orders/bids/*/accept`.

**Verification:**

- 451 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 194 tests in `apps/work-order-service` (10 suites, including `bids.service.spec.ts` and `bids.controller.spec.ts`).
  - 16 tests in `apps/dispatch-matching-service` (3 suites, including `dispatch.controller.spec.ts`).
  - 43 tests in `apps/api-gateway` (4 suites).
  - 46 tests in `apps/auth-service` (5 suites).
  - 20 tests in `apps/billing-service` (4 suites).
  - 75 tests in `@fieldforge/contracts` (3 suites).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 479 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 12 — Architecture Boundary Remediation: IAM, Domain Profiles, and Contractor Vetting Separation

**Status: Completed (2026-09-07).** Resolves **Finding 4 (auth-service Conflating Authentication with Domain Profile & Vetting Operations)** / `FF-ARCH-04` and aligns services with `AGENTS.md` bounded context rules and ADR 008 (`.agent/memory/ADRs/008_iam_profile_vetting_domain_separation.md`).

- **Domain-Decoupled Internal Architecture (`apps/auth-service`).**
  - Eliminated flat monolithic module layout and restructured `apps/auth-service` into three distinct, encapsulated NestJS domain modules:
    1. `IamModule` (`src/modules/iam/`): Handles low-level IAM credentials, passwords, JWT signing/rotation, and phone OTP verification (`AuthController`, `AuthService`, `PhoneOtpService`).
    2. `ProfilesModule` (`src/modules/profiles/`): Manages buyer and technician domain profiles, self-profile lookup (`GET /users/me`), and profile provisioning port (`UsersController`, `ProfilesService`).
    3. `ContractorVettingModule` (`src/modules/vetting/`): Manages contractor compliance badges, certification lifecycles, and technician directory queries (`CertificationsController`, `CertificationsService`).
- **Dependency Inversion via Profiles Port.**
  - Decoupled `AuthService` from direct SQL queries/inserts on `buyerProfiles` and `technicianProfiles`.
  - Injected `ProfilesService` into `AuthService` via optional dependency injection to delegate profile creation (`provisionProfile`) during registration and profile ID resolution (`resolveProfileId`) during authentication token generation.
- **Domain-Specific Schema Groupings (`packages/database`).**
  - Grouped and exported `iamSchema` (`users`, `refreshTokens`), `profileSchema` (`buyerProfiles`, `technicianProfiles`), and `vettingSchema` (`technicianCertifications`) from `@fieldforge/database`.
  - Zero database schema migrations (`RULE-DB-02`), preserving existing table structures and indexes.
- **Zero Microservice Proliferation.**
  - Retained the platform's stable 6-microservice architecture (ports 8000–8005) while establishing modular boundaries that allow future extraction of contractor vetting into an independent microservice if needed.

**Verification:**

- 470 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 56 tests in `apps/auth-service` (6 suites, including new `profiles.service.spec.ts`).
  - 194 tests in `apps/work-order-service` (10 suites).
  - 16 tests in `apps/dispatch-matching-service` (3 suites).
  - 43 tests in `apps/api-gateway` (4 suites).
  - 20 tests in `apps/billing-service` (4 suites).
  - 13 tests in `apps/notification-service` (1 suite).
  - 17 tests in `@fieldforge/messaging` (5 suites).
  - 67 tests in `@fieldforge/contracts` (2 suites).
  - 87 tests in `@fieldforge/common` (3 suites).
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 13 — Architecture Boundary Remediation: Event-Driven Order Settlement Choreography and SLA Review Relocation

**Status: Completed (2026-09-07).** Resolves **Finding 5 (Broken Event Lifecycle for Order Settlement / PAID Status)** / `FF-ARCH-05` and aligns services with `AGENTS.md` bounded context rules and ADR 009 (`.agent/memory/ADRs/009_event_driven_settlement_choreography.md`).

- **Relocate SLA Auto-Approval to Work Order Service Aggregate Root (`apps/work-order-service`).**
  - Relocated `SlaAutoApprovalService` from `apps/billing-service` to `apps/work-order-service/src/modules/sla/sla-auto-approval.service.ts`.
  - Sweeps `COMPLETED` work orders older than the 72-hour buyer review timeout (SRS FR-WO-005, FR-BILL-002) and executes FSM transitions via `WorkOrdersService.transition()` with `role = 'SYSTEM'`.
  - Generates immutable `work_order_status_history` audit records and emits canonical `EventType.WORK_ORDER_APPROVED` (`work_order.lifecycle.approved`).
  - Completely eliminated cross-service SQL mutations and table rollback queries on `work_orders` from `billing-service`.
- **Enforce Event-Driven Settlement & Block Manual API Transitions to `PAID` (`apps/work-order-service`).**
  - In `WorkOrdersService.transition()`, strictly reject manual transitions where `dto.nextStatus === WorkOrderStatus.PAID` from any API caller with `ForbiddenException('Work order cannot be manually transitioned to PAID via API; settlement to PAID is exclusively event-driven upon payout disbursement (billing.payout.disbursed)')`.
  - `settlePaid()` remains the sole canonical method to transition a work order to `PAID`, invoked strictly by `WorkOrderEventsConsumer` upon receiving `PAYOUT_DISBURSED` from `billing-service`.
- **Clean up Billing Service Boundaries (`apps/billing-service`).**
  - Deleted misplaced `SlaAutoApprovalService` and its spec file from `apps/billing-service`.
  - Removed `SlaAutoApprovalService` and unused `ScheduleModule` from `BillingModule`.
- **Wire Settlement Notifications Choreography (`apps/notification-service`).**
  - Subscribed `NotificationConsumer` to `EventType.WORK_ORDER_PAID` (`work_order.lifecycle.paid`).
  - Implemented `handlePaidEvent()` to format payout minor units into currency strings (`formatMinor`), dispatch FCM Push notifications to the technician's device token, and send SMS receipts via `SmsNotificationChannel`.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - All event definitions, entity columns, and messaging topics existed in `@fieldforge/contracts` and `@fieldforge/database`, requiring zero DDL alterations.

**Verification:**

- 474 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 198 tests in `apps/work-order-service` (11 suites, including new `sla-auto-approval.service.spec.ts`).
  - 18 tests in `apps/billing-service` (3 suites).
  - 14 tests in `apps/notification-service` (1 suite).
  - 56 tests in `apps/auth-service` (6 suites).
  - 16 tests in `apps/dispatch-matching-service` (3 suites).
  - 43 tests in `apps/api-gateway` (4 suites).
  - 17 tests in `@fieldforge/messaging` (5 suites).
  - 67 tests in `@fieldforge/contracts` (2 suites).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 502 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 14 — Architecture Boundary Remediation: Decoupling and Demoting notification-service to Headless Background Consumer

**Status: Completed (2026-09-07).** Resolves **Finding 6 (Architectural Over-Splitting / Exposure of notification-service)** / `FF-ARCH-06` and aligns services with `AGENTS.md` bounded context rules and ADR 010 (`.agent/memory/ADRs/010_headless_notification_worker_boundary.md`).

- **Decouple Notification Service from Edge API Gateway (`apps/api-gateway`).**
  - Removed `notifications` from `gatewayConfig.services` (`apps/api-gateway/src/config/gateway.config.ts`), ensuring the edge gateway exclusively fronts the 4 true HTTP domain services (`auth`, `workOrder`, `dispatch`, `billing`).
  - Removed `notifications` proxy handler creation and route decorators (`/notifications`, `/notifications/{*path}`) from `ProxyController` (`apps/api-gateway/src/controllers/proxy.controller.ts`).
  - Unmapped requests targeting `/api/v1/notifications/*` now fail fast at the edge with `404 Not Found` (`No downstream service registered for path: ...`) without opening unnecessary network sockets to upstream services.
  - Updated gateway unit tests (`apps/api-gateway/test/gateway.spec.ts`, `apps/api-gateway/test/proxy.controller.spec.ts`) asserting that `notifications` is unmapped, exactly 4 services are routed, and unmapped routes receive 404.
- **Formalize Headless Worker Boundary in Notification Service (`apps/notification-service`).**
  - Annotated `NotificationModule` with architectural documentation cementing its role as a pure event-driven background consumer daemon subscribing to RabbitMQ topics (`fieldforge.notifications.work-orders`).
  - Retained `HealthController` (`/healthz`, `/readyz`) and Prometheus observability scraping (`/metrics`) on internal container port 8005 for Kubernetes pod lifecycle and telemetry monitoring without edge proxying.
- **Clarify Environment Configuration (`.env.example`).**
  - Replaced `NOTIFICATION_SERVICE_URL` with `NOTIFICATION_PORT=8005` in `.env.example` with comments clarifying it as an internal health/metrics port rather than a proxied service.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - Purely architectural and edge-routing change; zero database modifications required.

**Verification:**

- 476 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 44 tests in `apps/api-gateway` (6 suites, including new unmapped proxy boundary assertions).
  - 198 tests in `apps/work-order-service` (11 suites).
  - 18 tests in `apps/billing-service` (3 suites).
  - 14 tests in `apps/notification-service` (1 suite).
  - 56 tests in `apps/auth-service` (6 suites).
  - 16 tests in `apps/dispatch-matching-service` (3 suites).
  - 17 tests in `@fieldforge/messaging` (5 suites).
  - 67 tests in `@fieldforge/contracts` (2 suites).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 504 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 15 — Service Communication Remediation: Multi-Tier Caching & Correlation Tracking for Technician Directory Geo-Search

**Status: Completed (2026-09-08).** Resolves **Service Audit Issue A (Uncached Directory Lookups During Geo-Search)** / `FF-ARCH-08` and aligns with `AGENTS.md` and bounded context performance/observability rules.

- **Two-Tier Technician Directory Caching (`apps/dispatch-matching-service`).**
  - Integrated distributed Redis caching (`REDIS_CLIENT`) with 300-second (5-minute) TTL under key prefix `tech:directory:<id>`.
  - Implemented proactive in-memory LRU-style fallback cache (`Map<string, MemoryCacheEntry>`) with expiration checking to maintain high availability if Redis degrades.
  - Implemented partial batch hit optimization in `getTechniciansBatch()`: splits incoming ID list into cached and uncached entries via Redis `MGET` and in-memory fallback, issues HTTP `POST /technicians/batch` strictly for missing uncached IDs, populates both caches via Redis pipeline `SETEX`, and merges the results. When all requested technician profiles are cached, zero HTTP network calls are made.
  - Exposed `invalidate(id)` and `clearMemoryCache()` hooks for targeted cache eviction.
- **Platform Topology Port Alignment & Error Resilience.**
  - Corrected the fallback `authServiceUrl` default from port `3001` to `8001` matching the actual microservice platform topology (`auth-service` on port 8001).
  - Maintained safe fallback to empty records on 500 errors or network failures so geospatial searches degrade gracefully rather than throwing 500s.
- **Trace Context Propagation (`x-correlation-id`).**
  - Updated `DispatchController` (`GET /dispatch/technicians/nearby` and `POST /dispatch/auto-route/recommend`) to accept incoming `x-correlation-id` headers.
  - Forwarded correlation IDs through `GeoSearchService.findNearbyTechnicians()` down to `TechnicianDirectoryService.getTechniciansBatch()` HTTP requests, ensuring complete distributed trace context.
- **Shared Redis Provider.**
  - Exported `redisProvider` (`REDIS_CLIENT`) in `DispatchModule` for shared use across `GeoSearchService` and `TechnicianDirectoryService`.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - Purely an inter-service communication, caching, and observability remediation; zero database migrations required.

**Verification:**

- 488 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 28 tests in `apps/dispatch-matching-service` (4 suites, including 12 new comprehensive unit tests in `technician-directory.service.spec.ts`).
  - 198 tests in `apps/work-order-service` (11 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 67 tests in `@fieldforge/contracts` (2 suites).
  - 56 tests in `apps/auth-service` (6 suites).
  - 44 tests in `apps/api-gateway` (6 suites).
  - 18 tests in `apps/billing-service` (3 suites).
  - 17 tests in `@fieldforge/messaging` (5 suites).
  - 14 tests in `apps/notification-service` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 516 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 16 — Service Communication Remediation: No-Op Consumer Subscription Elimination in billing-service

**Status: Completed (2026-09-08).** Resolves **Service Audit Issue B (No-Op Consumer Subscription on WORK_ORDER_ASSIGNED)** / `FF-ARCH-09` and aligns with `AGENTS.md` bounded context and event-driven architecture standards.

- **Refine `BillingConsumer` Subscription (`apps/billing-service`).**
  - Updated `BillingConsumer.onApplicationBootstrap()` to subscribe strictly to `[EventType.WORK_ORDER_APPROVED]` on queue `fieldforge.billing.work-orders`.
  - Eliminated redundant AMQP delivery and processing of `work_order.lifecycle.assigned` (`EventType.WORK_ORDER_ASSIGNED`) in `billing-service`.
  - Removed wasteful atomic 7-day Redis `SETNX` idempotency locking and JSON deserialization on work order assignment.
  - Retained `handleWorkOrderAssigned()` with `@deprecated` annotation for backwards compatibility.
- **Update Architecture Documentation & Tests.**
  - Updated `docs/MESSAGE_FLOW.md` routing table and Flow 2 sequence diagram to clarify that escrow was pre-authorized at creation time and that assignment notifications are handled solely by `notification-service`.
  - Updated `apps/billing-service/test/billing.consumer.spec.ts` asserting subscription strictly for `[EventType.WORK_ORDER_APPROVED]`.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - Purely an AMQP consumer topology refinement; zero database migrations required.

**Verification:**

- 488 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 18 tests in `apps/billing-service` (3 suites).
  - 28 tests in `apps/dispatch-matching-service` (4 suites).
  - 198 tests in `apps/work-order-service` (11 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 67 tests in `@fieldforge/contracts` (2 suites).
  - 56 tests in `apps/auth-service` (6 suites).
  - 44 tests in `apps/api-gateway` (6 suites).
  - 17 tests in `@fieldforge/messaging` (5 suites).
  - 14 tests in `apps/notification-service` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 516 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 17 — Service Communication Remediation: Order Settlement Asynchronous Cycle & Failure Compensation

**Status: Completed (2026-09-08).** Resolves **Service Audit Issue A (Order Settlement Asynchronous Cycle & Failure Compensation)** / `FF-ARCH-10` and aligns with `AGENTS.md` bounded context, saga choreography, and event-driven architecture standards.

- **Shared Contracts & Events (`@fieldforge/contracts`).**
  - Added `EventType.PAYOUT_FAILED = 'billing.payout.failed'` to `EventType` enum.
  - Added `PayoutFailedPayload` (`workOrderId`, `technicianId`, `amountMinor`, `reason`) and `PayoutFailedEvent` envelope definition.
- **Emit Failure Event on Escrow Release Failure (`apps/billing-service`).**
  - Injected `EventPublisher` into `BillingConsumer`.
  - Wrapped `releaseFunds()` in `BillingConsumer.handleWorkOrderApproved()` in a `try/catch` block.
  - On error (e.g. gateway timeout, frozen account, or unhandled release rejection), publishes `EventType.PAYOUT_FAILED` (`billing.payout.failed`) with correlation context before re-throwing for DLQ handling.
- **FSM Compensating Rollback & Payout Accuracy (`apps/work-order-service`).**
  - Updated `WorkOrderFsmService`: added `WorkOrderStatus.COMPLETED` to `validTransitions[WorkOrderStatus.APPROVED]` to permit domain-safe compensating rollback.
  - Updated `settlePaid()` in `WorkOrdersService` to accept `disbursedAmountMinor` from the event payload, ensuring actual settlement figures match downstream notifications.
  - Implemented `handlePayoutFailed()` in `WorkOrdersService`: safely and idempotently rolls back an `APPROVED` work order to `COMPLETED` and records failure in `work_order_status_history` with the failure reason and `changedBy: 'billing-service'`.
  - Subscribed `WorkOrderEventsConsumer` to `[EventType.PAYOUT_DISBURSED, EventType.PAYOUT_FAILED]` on `fieldforge.work-orders.lifecycle-events`.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - Implemented purely via event contracts, FSM transition matrix, and domain consumer logic with existing database schemas.

**Verification:**

- 493 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 20 tests in `apps/billing-service` (3 suites, +2 tests).
  - 203 tests in `apps/work-order-service` (11 suites, +5 tests).
  - 28 tests in `apps/dispatch-matching-service` (4 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 76 tests in `@fieldforge/contracts` (3 suites).
  - 56 tests in `apps/auth-service` (6 suites).
  - 44 tests in `apps/api-gateway` (6 suites).
  - 17 tests in `@fieldforge/messaging` (5 suites).
  - 14 tests in `apps/notification-service` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 521 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 18 — Service Communication Remediation: Elimination of Dormant Intra-Service Circular Loop Event

**Status: Completed (2026-09-08).** Resolves **Service Audit Issue B (Dormant / Orphaned Intra-Service Circular Loop)** / `FF-ARCH-11` and aligns with `AGENTS.md` event-driven architecture, publisher efficiency, and bounded context standards.

- **Eliminate Dormant Event Publication (`apps/work-order-service`).**
  - Removed `publishTechBidAccepted(bidAcceptedEvent)` publication from `BidsService.acceptBid()`.
  - Maintained canonical `publishWorkOrderAssigned(assignedEvent)` (`work_order.lifecycle.assigned`) as the sole assignment event published across the platform.
  - Marked `publishTechBidAccepted()` as `@deprecated` in `WorkOrderEventPublisher` (`apps/work-order-service/src/events/work-order-event.publisher.ts`).
  - Updated unit test assertions in `apps/work-order-service/test/bids.service.spec.ts` asserting that `publishWorkOrderAssigned` is called once and `publishTechBidAccepted` is not called.
- **Documentation & Routing Updates.**
  - Updated `docs/MESSAGE_FLOW.md` marking routing key `tech.bidding.accepted` as Deprecated / Retired.
  - Updated `.agent/context/api_contracts.md` marking `tech.bidding.accepted` as Deprecated / Retired.
  - Updated `docs/ISSUES.md` adding `FF-ARCH-11`.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - No database tables or schema definitions modified.

**Verification:**

- 493 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 203 tests in `apps/work-order-service` (11 suites).
  - 20 tests in `apps/billing-service` (3 suites).
  - 28 tests in `apps/dispatch-matching-service` (4 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 76 tests in `@fieldforge/contracts` (3 suites).
  - 56 tests in `apps/auth-service` (6 suites).
  - 44 tests in `apps/api-gateway` (6 suites).
  - 17 tests in `@fieldforge/messaging` (5 suites).
  - 14 tests in `apps/notification-service` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 521 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 19 — Messaging Infrastructure Remediation: Elimination of Message Loss & Premature ACKs

**Status: Completed (2026-09-08).** Resolves **Service Audit Item 7 (Retry Behavior & Message Loss Vulnerabilities)** / `FF-ARCH-12` and aligns with `RULE-EVENT-03` and resilient messaging standards.

- **Broker-Native Delay Queues (`packages/messaging`).**
  - Updated `RabbitMQConnectionManager.assertQueueAndBind()` to assert dedicated companion delay queues (`<queue>.retry`) for every worker queue, configured with `x-dead-letter-exchange: ''` and `x-dead-letter-routing-key: queueName`.
  - Added constants `RETRY_QUEUE_SUFFIX = '.retry'` and `DLQ_QUEUE_SUFFIX = '.dlq'` to `packages/messaging/src/constants.ts`.
- **Eliminate In-Memory Timers & Premature ACKs (`packages/messaging`).**
  - Removed `setTimeout` from `IdempotentConsumer.processMessage()`.
  - Retries are durably published directly to `<queue>.retry` with `persistent: true`, `expiration: String(delayMs)`, and updated `x-retry-count: nextRetry` headers.
  - The consumer awaits broker confirmation before proceeding, completely preventing process volatility message loss during backoff.
  - The original message on the worker queue is ACKed strictly after the retry is confirmed on the broker.
  - If publish to the retry queue fails, the message is routed to the DLQ rather than dropped.
- **State-Aware Redis Idempotency (`packages/messaging`).**
  - Updated `RedisIdempotencyClient.tryAcquire(eventId, retryCount = 0)`:
    - Fresh deliveries (`retryCount === 0`) acquire lock via `SET ... NX`, rejecting duplicates.
    - Retry attempts (`retryCount > 0`) execute an atomic Lua script to transition from `'retrying'` to `'in-progress'`, while blocking re-entry if already marked `'completed'`.
  - Added `markRetrying(eventId, nextRetry)` to maintain `'retrying:N'` state in Redis during broker backoff, eliminating race conditions where parallel duplicate deliveries could prematurely re-acquire the lock.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - Zero database tables or schemas modified.

**Verification:**

- 497 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 21 tests in `@fieldforge/messaging` (5 suites, +4 tests).
  - 203 tests in `apps/work-order-service` (11 suites).
  - 20 tests in `apps/billing-service` (3 suites).
  - 28 tests in `apps/dispatch-matching-service` (4 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 76 tests in `@fieldforge/contracts` (3 suites).
  - 56 tests in `apps/auth-service` (6 suites).
  - 44 tests in `apps/api-gateway` (6 suites).
  - 14 tests in `apps/notification-service` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 525 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 20 — Financial Reconciliation: Elimination of Payout Amount Disconnect Between Billing and Work Orders

**Status: Completed (2026-09-08).** Resolves **Service Audit Issue A (Payout Amount Disconnect Between Billing and Work Orders)** / `FF-ARCH-13`.

- **Event Contract Reconciliation (`@fieldforge/contracts`).**
  - Added `buyerId?: string` to `PayoutDisbursedPayload` in `packages/contracts/src/events/payment.events.ts`, resolving payload asymmetry with `WorkOrderPaidPayload`.
- **Agreed Bid Rate Querying in Work Order Lifecycle (`apps/work-order-service`).**
  - Updated `WorkOrdersService.transition()` to query `workOrderBids` for an `ACCEPTED` contractor bid on the work order:
    - Sets `payoutAmountMinor` in `WORK_ORDER_APPROVED` to the accepted bid rate (`toMinor(Number(acceptedBid.bidAmount))`) rather than hardcoding the maximum budget ceiling (`toMinor(Number(wo.budgetAmount))`).
    - Sets `agreedRateMinor` in `WORK_ORDER_ASSIGNED` to the accepted bid rate when assigned via commercial bid acceptance.
  - Updated `WorkOrdersService.settlePaid()` to query `workOrderBids` for the accepted bid rate when `disbursedAmountMinor` is omitted.
  - Extended test harness mock DB in `test/work-orders.service.spec.ts` with `InMemBid` map and `work_order_bids` query support.
- **Accurate Escrow Release & Unused Balance Refund (`apps/billing-service`).**
  - Added `amountMinor?: MinorUnits` to `ReleaseEscrowParams` interface in `EscrowService`.
  - Updated `EscrowService.releaseFunds()`:
    - Forwards `legacyAmountMinor` into `params.amountMinor` for backward compatibility with positional callers (`BillingConsumer`).
    - Validates `amountMinor`: enforces `amountMinor > 0` and `amountMinor <= escrow.amountLocked`. Throws `BadRequestException` if limits are violated.
    - Disburses the exact approved amount (`amountMinor`) to the technician via `paymentProvider.disbursePayout()`.
    - Automatically refunds any unused escrow remainder (`escrow.amountLocked - amountMinor`) back to the buyer via `paymentProvider.refundEscrow()`.
    - Records ledger entry and generates content-hashed invoice with `amountMinor`.
    - Emits `PAYOUT_DISBURSED` with `buyerId` and the exact disbursed `amountMinor`.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - Zero database tables or schema changes required.

**Verification:**

- 501 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 24 tests in `apps/billing-service` (3 suites, +4 tests).
  - 204 tests in `apps/work-order-service` (11 suites, +1 test).
  - 21 tests in `@fieldforge/messaging` (5 suites).
  - 28 tests in `apps/dispatch-matching-service` (4 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 76 tests in `@fieldforge/contracts` (3 suites).
  - 56 tests in `apps/auth-service` (6 suites).
  - 44 tests in `apps/api-gateway` (6 suites).
  - 14 tests in `apps/notification-service` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 529 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Phase 21 — Repository-Wide Standardization of Technician Identifiers to `technicianId`

**Status: Completed (2026-09-08).** Resolves **Service Audit Issue B (Property Naming Inconsistency for Technician Identifiers)** / `FF-ARCH-14`.

- **Event Contract & DTO Standardization (`@fieldforge/contracts`).**
  - Standardized all AMQP event contracts (`WorkOrderAssignedPayload`, `WorkOrderApprovedPayload`, `WorkOrderPaidPayload`, `TechBiddingSubmittedPayload`, `TechBidAcceptedPayload`, `PayoutDisbursedPayload`, `PayoutFailedPayload`) strictly to `technicianId: string`.
  - Standardized `NearbyTechnicianDto` to strictly define `technicianId: string` (aligning with `BidDetailsDto`, `PayoutLedgerItemDto`, `TechnicianEarningsDto`).
  - Completely eliminated the informal `techId` abbreviation and legacy fallback overhead.
- **Service & Consumer Handler Unification (`apps/*`).**
  - Updated `apps/work-order-service`: `WorkOrdersService.assignTechnicianFromBid()`, `transition()`, and `settlePaid()` to use `technicianId`. Updated `WorkOrderEventsConsumer.handleTechBidAccepted()` and `BidsService`.
  - Updated `apps/billing-service`: `BillingConsumer.handleWorkOrderApproved()`, `handleWorkOrderAssigned()`, and `EscrowService.releaseFunds()` to strictly use `technicianId`.
  - Updated `apps/dispatch-matching-service`: `GeoSearchService.updateTechnicianLocation()`, `findNearbyTechnicians()`, and `DispatchController.autoRouteRecommend()`.
  - Updated `apps/auth-service`: `CertificationsController` and `CertificationsService`.
  - Updated `apps/notification-service`: `NotificationConsumer.handleAssignedEvent()` and `handlePaidEvent()`.
- **Frontend Portal Unification (`apps/web-buyer-portal`).**
  - Updated `dispatchSlice`, `workOrderSlice`, `api.ts` RTK Query endpoints, `TechnicianMatchingRadar.tsx`, and fixtures to use `technicianId`.
- **Zero Database Schema Migrations (`RULE-DB-02`).**
  - Database schemas already consistently used `technicianId` (`technician_id`). Zero migrations required.

**Verification:**

- 501 automated unit/integration tests passing across 15 packages/apps in monorepo (zero `--passWithNoTests`):
  - 204 tests in `apps/work-order-service` (11 suites).
  - 24 tests in `apps/billing-service` (3 suites).
  - 21 tests in `@fieldforge/messaging` (5 suites).
  - 28 tests in `apps/dispatch-matching-service` (4 suites).
  - 104 tests in `apps/web-buyer-portal` (1 suite).
  - 87 tests in `@fieldforge/common` (3 suites).
  - 76 tests in `@fieldforge/contracts` (3 suites).
  - 56 tests in `apps/auth-service` (6 suites).
  - 44 tests in `apps/api-gateway` (6 suites).
  - 14 tests in `apps/notification-service` (1 suite).
- 28 Playwright E2E tests validated (`pnpm test:e2e`). Total verified tests: 529 tests.
- `pnpm check && pnpm build` pass cleanly.

---

## Explicitly out of scope

These stay open by decision, not oversight. Keep them listed in `docs/ISSUES.md` so no one reads
silence as completion.

- **C1 remainder** — git history still contains the old `JWT_SECRET` and MySQL root password.
  Rotation and history rewriting are external follow-up. The signing key is no longer _usable_
  from history: `requireJwtSecret()` refuses the published values outright, so a stale copy of
  `.env` fails startup rather than restoring the old boundary. The MySQL, RabbitMQ, and Grafana
  credentials are unchanged and still need rotating.
- **H8** — Kubernetes manifests have no Service objects, no `envFrom`, no probes, no resource
  limits, no `securityContext`, and no notification-service Deployment. They remain a render-only
  scaffold.
- **L3** — Dockerfiles remain single-stage and run as root.
- **L4** — Terraform has no remote backend and no S3 public-access-block.
- **Real provider SDKs** — Stripe, Twilio, FCM, SES, and S3 slot in behind the Phase 2/4 ports once
  credentials exist.
- **Service-to-service authentication** — no service authenticates its callers; reaching a service
  port directly still bypasses the edge. Since C5, no service _depends_ on the network being
  trusted — `/users/me` verifies the token itself — but nothing yet restricts who may open the
  socket. A NetworkPolicy or mesh mTLS is the real fix and rides along with H8's manifest work.

---

## Verification

Per-phase commands are listed above. The gates that apply to every phase:

```bash
pnpm install --frozen-lockfile && pnpm check && pnpm build
```

Full-stack verification from Phase 2 onward:

```bash
cp .env.example .env && pnpm docker:up && pnpm db:migrate && pnpm db:seed && pnpm dev
```

```bash
pnpm test:e2e
```

Task-graph or `turbo.json` changes must additionally pass the clean-typecheck validation required by
`.agent/skills/turborepo/SKILL.md`:

```bash
./.agent/skills/turborepo/scripts/validate-clean-typecheck.sh
```

The standing rule for this project, from `AGENTS.md`: a test command that finds no tests is not a
successful verification. Each phase closes only when a test exists that fails if that phase's
behavior regresses.
