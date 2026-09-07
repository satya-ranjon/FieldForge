# FieldForge Implementation Status

**Last reviewed:** 2026-09-07  
**Phase:** Phase 10 complete — Bounded Context Data Isolation & Directory-Based Profile Lookup (Resolves Finding 2, ADR 006). Roadmap: `docs/DEVELOPMENT_PLAN.md`.

## What exists

- A pnpm/Turborepo monorepo with NestJS service shells, a Next.js App Router buyer
  portal (migrated off Vite; still served on port 5173), an Expo technician app, and
  shared contracts, database, common, messaging, and UI packages.
- Drizzle schemas and migrations for users, work orders, status history, bids,
  deliverables, escrow, refresh tokens, technician certifications, idempotency keys,
  invoices, and payout ledger (`0000`, `0001`, `0002_auth.sql`, `0003_wo_history.sql`, `0004_long_marvel_boy.sql`, `0005_chubby_iron_lad.sql`).
- Local Docker Compose definitions for MySQL, Redis, RabbitMQ, Jaeger,
  Prometheus, and Grafana.
- Architecture rules, four accepted ADRs + ADR 005 and ADR 006 (`006_bounded_context_data_isolation.md`), and CI/build scaffolding.
- **Shared Drizzle module.** `packages/common/src/database/drizzle.module.ts` provides
  the centralized `DRIZZLE` injection token using `createDbClient` and loads local `.env`.
- **Identity & Auth service.** `apps/auth-service` implements `POST /auth/register`,
  `POST /auth/login`, `POST /auth/refresh` (with rotating tokens in `refresh_tokens`),
  `POST /auth/phone/send-otp`, `POST /auth/phone/verify-otp` (in-memory rate-limited phone OTP verification),
  `GET /users/me`, and technician certifications & vetting:
  `GET /technicians/:id/badges` (resolves user or profile ID, C5 protected),
  `POST /technicians/certifications` (submits new credential),
  `PATCH /technicians/certifications/:id/verify` (admin/dispatcher verification with expiry),
  and `GET /technicians/certifications/pending`.
- **Real trust boundary at API Gateway.** `apps/api-gateway` enforces `JwtAuthGuard`,
  `RolesGuard` (RBAC), `ThrottlerGuard` rate limiting, strict CORS allowlist, PII redaction
  in structured Pino logging, and reverse-proxying with injected `x-ff-user-id`, `x-ff-user-role`,
  and `x-correlation-id` downstream headers. Routes `/api/v1/auth/phone` are permitted publicly,
  and `technicians` endpoints route directly to `auth-service`.
- **Identity comes from the token, never from a header.** `GET /users/me`, `apps/work-order-service`,
  `apps/dispatch-matching-service`, and `apps/billing-service` controllers verify the bearer token
  and read `payload.sub`; `x-ff-user-id` is checked for tampering and mismatch is rejected (C5).
- **Persistent, transactional work-order lifecycle (`apps/work-order-service`).** Implements
  `POST /work-orders`, `GET /work-orders` (filtered on composite index), `GET /work-orders/:id`,
  `GET /work-orders/:id/history`, `POST /work-orders/:id/publish`, `POST /work-orders/:id/transition`,
  and `PATCH /work-orders/:id/status`. All mutations execute in `db.transaction()` with `SELECT … FOR UPDATE`
  row-level locking. Sole mutator of the `work_orders` and `work_order_status_history` tables.
  `WorkOrderEventsConsumer` listens to `fieldforge.work-orders.lifecycle-events` to transactionally settle
  orders to `PAID` upon `PAYOUT_DISBURSED` and assign technicians upon `TECH_BID_ACCEPTED`. Sole emitter of
  `work_order.lifecycle.assigned` and `work_order.lifecycle.paid`.
- **Geospatial Matching & Bidding (`apps/dispatch-matching-service`).**
  - Redis `GEOADD` and `GEOSEARCH` on `tech:locations` with Haversine exact distance filtering.
  - Multi-parameter contractor scoring algorithm: 40% distance, 30% rating, 15% completed jobs, 15% verified certifications.
  - Transactional bid submission (`POST /dispatch/bids`) and atomic bid acceptance (`POST /dispatch/bids/:id/accept`) locking `work_order_bids` rows `FOR UPDATE`, marking selected bid `ACCEPTED`, rejecting siblings, and publishing `tech.bidding.accepted` (ADR 005).
  - Auto-routing engine (`POST /dispatch/auto-route`) discovering and assigning top-scoring contractor within search radius (FR-DISP-003) publishing `tech.bidding.accepted`.
- **Escrow & Money Safety (`apps/billing-service`).**
  - Fully resolves **C3**; `releaseFunds()` executes inside a locked `db.transaction()` with `FOR UPDATE` on `escrow_accounts`. Asserts `status === 'HELD'`, verifies buyer caller authority, transitions escrow to `RELEASED`, dispatches payout via `PaymentProviderPort` (`LedgerPaymentProvider`), logs double-entry `payout_ledger` credit, and emits `billing.payout.disbursed` (ADR 005).
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
- **A test harness that can fail.** 442 automated unit/integration tests across 15 packages/apps
  plus 28 Playwright E2E tests (470 total verified tests); zero `--passWithNoTests` anywhere.
- **Bounded Context Data Isolation & Profile Propagation (Phase 10, Resolves Finding 2, ADR 006).**
  - Eliminated synthetic profile generation (`Default Buyer Co` removed from `work-orders.service.ts`; un-onboarded buyers receive clean `NotFoundException`).
  - Added `profileId` claim to JWT payload in `auth-service` upon registration, login, and token refresh.
  - Propagated `x-ff-profile-id` header downstream from `api-gateway` in asserted gateway headers.
  - Replaced cross-service SQL joins across `technicianProfiles`, `users`, and `technicianCertifications` in `dispatch-matching-service` with `TechnicianDirectoryService` calling `POST /technicians/batch` on `auth-service`.
  - Added caller `profileId` fast-path across `work-order-service`, `dispatch-matching-service`, and `billing-service` to eliminate foreign user table lookups and preserve bounded context independence.
- **Work Order Aggregate Boundary Reconciliation & Event-Driven Settlement (Phase 9, Resolves Finding 1, ADR 005).**
  - Added shared contracts (`TechnicianBadgeDto`, `CreateCertificationDto`, `VerifyCertificationDto`, `SendPhoneOtpDto`, `VerifyPhoneOtpDto`) and Zod schemas in `@fieldforge/contracts`.
  - Created `CertificationsController` in `apps/auth-service` with `GET /technicians/:id/badges`, `POST /technicians/certifications`, `PATCH /technicians/certifications/:id/verify`, and `GET /technicians/certifications/pending`.
  - Implemented rate-limited in-memory `PhoneOtpService` in `apps/auth-service` with `POST /auth/phone/send-otp` and `POST /auth/phone/verify-otp` (FR-AUTH-001).
  - Routed `technicians` reverse proxying to `auth-service` in `apps/api-gateway` and whitelisted phone OTP endpoints as public.
  - Enhanced Enterprise Buyer Portal (`TechnicianMatchingRadar.tsx`) with real-time verified badge chips (`ShieldCheck`, `CheckCircle2`) and RTK Query hooks.
  - Enhanced Mobile Technician App (`JobListScreen.tsx`) with compliance badge indicator.
  - Seeded verified industry certifications (`Cisco CCNA`, `OSHA 10`, `CompTIA A+`, `Fiber Optic Certified`, `Background Checked`) for seed technicians in `@fieldforge/database`.
- **Production Observability & Measured SLO Evidence (Phase 7).**
  - Production `MetricsRegistry` and `MetricsInterceptor` in `@fieldforge/common` powered by `prom-client`.
  - Emits `http_requests_total`, `http_request_duration_seconds` (read and write SLI buckets), `dispatch_fanout_latency_seconds`, and `billing_reconciliation_failures_total`.
  - Honest `/readyz` probes validating active MySQL pools (`SELECT 1`), Redis, and RabbitMQ dependencies, returning 503 on dependency degradation.
  - Native Prometheus scraping across all 6 microservices (8000–8005) on `/metrics` with SLI recording rules in `infra/docker/rules.yml`.
  - Auto-provisioned Grafana datasource and dashboard (`infra/docker/grafana/dashboards/fieldforge-slos.json`) on port 3009 visualising the 5 core platform SLIs.
  - Real k6 load testing harness (`scripts/k6/dispatch-load.js`, `scripts/run-load-test.sh`) driving 1,000 concurrent iterations against the live API Gateway stack.
  - Reconciled ADRs via ADR 004 superseding ADRs 001–003 for MySQL 8.4 LTS, Redis 8.0, and RabbitMQ 4.1.
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

- Coverage thresholds. Suites are real but `coverageThreshold` is unset; it rises
  per phase toward the SRS §5 target of 90% on business rules.
- A deployable production Kubernetes platform.

The detailed defect inventory is maintained in `docs/ISSUES.md`. Do not infer
feature completion from types, dependencies, UI mock data, or console-log stubs.

## Known specification drift

- Geofence tolerance is now standardized to 200 metres server-side and client-side per SRS FR-MOB-001.
- SRS v1.0.0 requires 99.9% availability; older SLO text uses 99.95%.
- Runtime image versions are now unified via ADR 004 (MySQL 8.4 LTS, Redis 8.0, RabbitMQ 4.1).

Terminal-state terminology is no longer drift: the SRS won, `PAID` is the terminal
state, and `SETTLED`/`BIDDING`/`OPEN`/`IN_PROGRESS` are gone from the docs and UI.

The remaining items are intentionally recorded rather than silently resolved.
Future feature work must resolve each affected contract before shipping behavior.
