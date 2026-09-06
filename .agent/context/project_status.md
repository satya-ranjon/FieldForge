# FieldForge Implementation Status

**Last reviewed:** 2026-09-06  
**Phase:** Phase 6 complete — Technician mobile app. Next: Phase 7
(observability and measured SLO evidence). Roadmap: `docs/DEVELOPMENT_PLAN.md`.

## What exists

- A pnpm/Turborepo monorepo with NestJS service shells, a Next.js App Router buyer
  portal (migrated off Vite; still served on port 5173), an Expo technician app, and
  shared contracts, database, common, messaging, and UI packages.
- Drizzle schemas and migrations for users, work orders, status history, bids,
  deliverables, escrow, refresh tokens, technician certifications, idempotency keys,
  invoices, and payout ledger (`0000`, `0001`, `0002_auth.sql`, `0003_wo_history.sql`, `0004_long_marvel_boy.sql`, `0005_chubby_iron_lad.sql`).
- Local Docker Compose definitions for MySQL, Redis, RabbitMQ, Jaeger,
  Prometheus, and Grafana.
- Architecture rules, three accepted ADRs, and CI/build scaffolding.
- **Shared Drizzle module.** `packages/common/src/database/drizzle.module.ts` provides
  the centralized `DRIZZLE` injection token using `createDbClient` and loads local `.env`.
- **Identity & Auth service.** `apps/auth-service` implements `POST /auth/register`,
  `POST /auth/login`, `POST /auth/refresh` (with rotating tokens in `refresh_tokens`),
  `GET /users/me`, and database-backed technician certifications (`technician_certifications`).
- **Real trust boundary at API Gateway.** `apps/api-gateway` enforces `JwtAuthGuard`,
  `RolesGuard` (RBAC), `ThrottlerGuard` rate limiting, strict CORS allowlist, PII redaction
  in structured Pino logging, and reverse-proxying with injected `x-ff-user-id`, `x-ff-user-role`,
  and `x-correlation-id` downstream headers.
- **Identity comes from the token, never from a header.** `GET /users/me`, `apps/work-order-service`,
  `apps/dispatch-matching-service`, and `apps/billing-service` controllers verify the bearer token
  and read `payload.sub`; `x-ff-user-id` is checked for tampering and mismatch is rejected (C5).
- **Persistent, transactional work-order lifecycle.** `apps/work-order-service` implements
  `POST /work-orders`, `GET /work-orders` (filtered on composite index), `GET /work-orders/:id`,
  `GET /work-orders/:id/history`, `POST /work-orders/:id/publish`, `POST /work-orders/:id/transition`,
  and `PATCH /work-orders/:id/status`. All mutations execute in `db.transaction()` with `SELECT … FOR UPDATE`
  row-level locking.
- **Geospatial Matching & Bidding (`apps/dispatch-matching-service`).**
  - Redis `GEOADD` and `GEOSEARCH` on `tech:locations` with Haversine exact distance filtering.
  - Multi-parameter contractor scoring algorithm: 40% distance, 30% rating, 15% completed jobs, 15% verified certifications.
  - Transactional bid submission (`POST /dispatch/bids`) and atomic bid acceptance (`POST /dispatch/bids/:id/accept`) locking work order and bid rows `FOR UPDATE`, marking selected bid `ACCEPTED`, rejecting siblings, assigning technician, and publishing `work_order.lifecycle.assigned`.
  - Auto-routing engine (`POST /dispatch/auto-route`) discovering and assigning top-scoring contractor within search radius (FR-DISP-003).
- **Escrow & Money Safety (`apps/billing-service`).**
  - Fully resolves **C3**; `releaseFunds()` executes inside a locked `db.transaction()` with `FOR UPDATE` on `escrow_accounts` and `work_orders`. Asserts `status === 'HELD'` and work order is `APPROVED`, verifies buyer caller authority, transitions escrow to `RELEASED` and work order to `PAID`, dispatches payout via `PaymentProviderPort` (`LedgerPaymentProvider`), and logs double-entry `payout_ledger` credit.
  - Enforces request deduplication and replay via `idempotency_keys` table.
  - Scheduled SLA review worker (`SlaAutoApprovalService`) auto-approving `COMPLETED` orders exceeding 72 hours and releasing escrow (FR-BILL-002).
  - Deterministic SHA-256 content-hashed invoice generation (`InvoicesService`) and cryptographically verified PDF invoice generation via `pdfkit` (FR-BILL-003).
  - Technician earnings ledger query (`GET /billing/technicians/:id/payouts`).
- **Server-enforced geofence.** 200m radius threshold against stored coordinates (SRS FR-MOB-001).
- **Deliverables & Media Storage.** Presigned upload URLs and SHA-256 digital signatures on stable deliverables content.
- **Event Backbone (`packages/messaging`).** AMQP messaging module with publisher confirms, 7-day atomic Redis `SETNX` deduplication, bounded 3-retry backoff, DLQ routing, and cross-service producers/consumers.
- **Enterprise Buyer Portal on Real API (`apps/web-buyer-portal`).**
  - Unified RTK Query API slice (`apps/web-buyer-portal/src/store/services/api.ts`) with `baseQueryWithReauth` and `SimpleMutex` for automatic 401 JWT token refresh against `/api/v1/auth/refresh`.
  - Cache tag revalidation across `WorkOrder`, `WorkOrderDeliverables`, `WorkOrderHistory`, `Technician`, `Bid`, `Escrow`, `Invoice`.
  - Hardcoded fixture state cleanly stripped from Redux slices (`workOrderSlice.ts`, `dispatchSlice.ts`, `billingSlice.ts`) and re-homed to `apps/web-buyer-portal/src/mocks/fixtures/`.
  - 5 dedicated Next.js App Router route segments (`/operations`, `/create-wo`, `/technicians`, `/billing`, `/audit`) with reusable `BuyerPortalShell`.
  - Collision-safe UUIDs using `crypto.randomUUID()`.
  - Playwright E2E test suite extended with `lifecycle.spec.ts` covering the complete SRS §5 path: `create → publish → accept bid → approve → payout`.
- **Autonomous Technician Mobile App (`apps/mobile-tech-app`).**
  - Durable `OfflineSyncService` backed by `OfflineStorageAdapter` atomically persisting mutation queue across reboots (resolving H6).
  - Strict FIFO mutation replay with `x-idempotency-key: mob-offline-<uuid>` and exponential retry backoff.
  - Mandatory iOS/Android location, camera, and storage permissions strings and `PermissionsService` wrapper (resolving L7).
  - Geofenced on-site check-in enforcing standardized 200m tolerance via `@fieldforge/contracts` geo helpers (FR-MOB-001).
  - Proof of work deliverables: interactive task checklists, hardware serial number capture, timestamped before/after photo capture with presigned URLs, and on-screen client signature capture with SHA-256 cryptographic hash (FR-MOB-002, FR-MOB-003, FR-MOB-004).
  - `AppNavigator` mounting `JobListScreen` and `ActiveJobScreen` wrapped in Redux store.
- **A test harness that can fail.** 397 automated unit/integration tests across 17 suites
  plus 28 Playwright E2E tests (425 total verified tests); no `--passWithNoTests` anywhere.
- **Section 13 Quality Remediations (Branch `fix/bugs-and-issues`).**
  - Durable mobile offline sync mutation queue with persistent idempotency keys and retry handling (FF-BUG-01).
  - Production-ready Kubernetes manifests with Services, health/readiness probes, resource limits, and notification-service (FF-BUG-02).
  - RTK Query API client slice in web-buyer-portal with auto auth and correlation ID injection (FF-BUG-03).
  - Schema UNIQUE constraint `uq_invoice_work_order` preventing duplicate work order invoices (FF-BUG-04).
  - Dynamic `/readyz` system metrics (memory/uptime) and Prometheus scrape targets (FF-BUG-05).
  - SLA auto-approval rollback to `COMPLETED` on failed escrow release (FF-BUG-06).
  - Centralized structured Pino logging replacing all ad-hoc console logging (FF-BUG-07).
  - React peer dependency declared in `@fieldforge/ui` (FF-BUG-08).
  - Clean Redis client disconnection in messaging shutdown hooks (FF-BUG-09).

## What is not yet implemented

- Production observability dashboards, Alertmanager, and evidence-backed SLO tests (Phase 7).
- Coverage thresholds. Suites are real but `coverageThreshold` is unset; it rises
  per phase toward the SRS §5 target of 90% on business rules.
- A deployable production Kubernetes platform.

The detailed defect inventory is maintained in `docs/ISSUES.md`. Do not infer
feature completion from types, dependencies, UI mock data, or console-log stubs.

## Known specification drift

- Geofence tolerance is now standardized to 200 metres server-side and client-side per SRS FR-MOB-001.
- SRS v1.0.0 requires 99.9% availability; older SLO text uses 99.95%.
- Runtime image versions differ from the older version-specific ADR wording;
  Phase 7 supersedes ADRs 001–003 rather than leaving the drift recorded.

Terminal-state terminology is no longer drift: the SRS won, `PAID` is the terminal
state, and `SETTLED`/`BIDDING`/`OPEN`/`IN_PROGRESS` are gone from the docs and UI.

The remaining items are intentionally recorded rather than silently resolved.
Future feature work must resolve each affected contract before shipping behavior.
