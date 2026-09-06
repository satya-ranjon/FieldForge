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

| Decision               | Choice                                                                                                                                | Rationale                                                                                                                                              |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target end state       | Working **local** E2E system via `docker compose` + `pnpm dev`                                                                        | Highest credibility per unit of effort                                                                                                                 |
| Kubernetes / Terraform | Remain a documented scaffold (H8, L4 stay open)                                                                                       | Out of scope; explicitly listed as open below                                                                                                          |
| External providers     | **Ports + in-repo fake adapters** (ledger payments, log-only SMS/push, local-disk media)                                              | Keeps CI hermetic and credential-free; real SDKs slot in behind the same port later                                                                    |
| Mobile app             | In scope, **after** the backend (Phase 6)                                                                                             | Depends on real endpoints existing                                                                                                                     |
| FSM canon              | **SRS wins** per `AGENTS.md` source-of-truth order: add `PAID`; `SETTLED`/`BIDDING`/`OPEN`/`IN_PROGRESS` are removed from docs and UI | `docs/SRS.md` FR-WO-002 is rank 2; README/UI are rank 7. Bids are a table (`work_order_bids`), not a work-order state                                  |
| Money representation   | Integer **minor units** in DTOs and events (`*AmountMinor`); DB stays `DECIMAL`                                                       | Resolves M5; the naming change must land before Phase 5 UI work                                                                                        |
| Identity source        | Always the **verified token**, never the request body                                                                                 | `createWorkOrderSchema.buyerId`, `submitBidSchema.techId`, and `PreAuthEscrowDto.buyerId` are currently caller-supplied — a privilege-escalation shape |

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
  `buyerId`/`techId` from request schemas — those come from the token.
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

## Phase 7 — Observability and measured SLO evidence

**Size: M · Depends on Phase 4.** Resolves L1, L8, M10. Implements FR-OBS-001/002/003,
NFR-PERF-001.

- **Real metrics.** `MetricsInterceptor` (`packages/common/src/apm/metrics.interceptor.ts`)
  currently `console.log`s timings under a "In production: push to Prometheus/OTEL" comment.
  Replace it with an OTEL SDK plus Prometheus exporter emitting `http_request_duration_seconds`
  (histogram), a non-5xx availability counter, and `dispatch_queue_latency_seconds` measured from
  publish to notification send.
- **Honest probes.** `/readyz` returns a static `READY`. Make it actually check the MySQL pool,
  Redis, and the RabbitMQ channel (FR-OBS-003).
- **Dashboards.** Scrape targets in `infra/docker/prometheus.yml`, plus Grafana dashboards and
  recording rules for the five SLIs in `.agent/context/sli_slo_definitions.md`.
- **Stop the theater (L8).** `scripts/simulate-dispatch-load.js` fabricates latency samples with
  `Math.random()` and reports them as SLO evidence. Delete it in favour of
  `scripts/k6/dispatch-load.js` driving 1,000 concurrent dispatches against the real stack
  (SRS §5). Separately, add `.catch(err => { logger.fatal(err); process.exit(1); })` to every
  service's unhandled `bootstrap()`.
- **Reconcile ADRs (M10).** Compose runs MySQL 8.4 / Redis 8.0 / RabbitMQ 4.1; ADRs 001–003 say
  8.0 / 7.0 / 3.13. Supersede the ADRs deliberately rather than leaving the drift recorded.

**Exit criteria:** p95 latency and availability numbers come from measured traffic, and the README's
SLO table cites the k6 run rather than an aspiration.

**Verify:** `pnpm docker:up`, run k6, then read the numbers off Grafana at `localhost:3009` and
traces at `localhost:16686`.

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
