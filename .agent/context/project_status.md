# FieldForge Implementation Status

**Last reviewed:** 2026-09-08  
**Phase:** Phase 15 complete — Multi-Tier Caching & Correlation Tracking for Technician Directory Geo-Search (FF-ARCH-08 / Service Audit Issue A). Roadmap: `docs/DEVELOPMENT_PLAN.md`.

## What exists

- A pnpm/Turborepo monorepo with NestJS service shells, a Next.js App Router buyer
  portal (migrated off Vite; still served on port 5173), an Expo technician app, and
  shared contracts, database, common, messaging, and UI packages.
- Drizzle schemas and migrations for users, work orders, status history, bids,
  deliverables, escrow, refresh tokens, technician certifications, idempotency keys,
  invoices, and payout ledger (`0000`, `0001`, `0002_auth.sql`, `0003_wo_history.sql`, `0004_long_marvel_boy.sql`, `0005_chubby_iron_lad.sql`).
- Local Docker Compose definitions for MySQL, Redis, RabbitMQ, Jaeger,
  Prometheus, and Grafana.
- Architecture rules, ten accepted ADRs (including ADR 005, ADR 006, ADR 007, ADR 008, ADR 009, and ADR 010 `010_headless_notification_worker_boundary.md`), and CI/build scaffolding.
- **Shared Drizzle module.** `packages/common/src/database/drizzle.module.ts` provides
  the centralized `DRIZZLE` injection token using `createDbClient` and loads local `.env`.
- **Identity & Auth service (`apps/auth-service`).** Decoupled into three encapsulated domain modules:
  - `IamModule`: Low-level IAM security primitives (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` with rotating tokens in `refresh_tokens`, `POST /auth/phone/send-otp`, `POST /auth/phone/verify-otp`).
  - `ProfilesModule`: Domain profiles (`buyerProfiles`, `technicianProfiles`), self-profile lookup (`GET /users/me`), and profile provisioning port (`provisionProfile`, `resolveProfileId`, `getUserProfile`).
  - `ContractorVettingModule`: Contractor credentials, compliance badges, and directory querying (`GET /technicians/:id/badges`, `POST /technicians/certifications`, `PATCH /technicians/certifications/:id/verify`, `GET /technicians/certifications/pending`, `POST /technicians/batch`).
- **Real trust boundary at API Gateway.** `apps/api-gateway` enforces `JwtAuthGuard`,
  `RolesGuard` (RBAC), `ThrottlerGuard` rate limiting, strict CORS allowlist, PII redaction
  in structured Pino logging, and reverse-proxying with injected `x-ff-user-id`, `x-ff-user-role`,
  and `x-correlation-id` downstream headers. Fronts exclusively the 4 HTTP domain services (`auth`,
  `work-orders`, `dispatch`, `billing`). Routes `/api/v1/auth/phone` are permitted publicly,
  and `technicians` endpoints route directly to `auth-service`. Proxies `/dispatch/bids` transparently
  to `work-order-service` for zero-downtime backward compatibility. Unmapped routes (including `/api/v1/notifications`)
  fail fast with 404 at the edge (ADR 010).
- **Identity comes from the token, never from a header.** `GET /users/me`, `apps/work-order-service`,
  `apps/dispatch-matching-service`, and `apps/billing-service` controllers verify the bearer token
  and read `payload.sub`; `x-ff-user-id` is checked for tampering and mismatch is rejected (C5).
- **Persistent, transactional work-order lifecycle (`apps/work-order-service`).** Implements
  `POST /work-orders`, `GET /work-orders` (filtered on composite index), `GET /work-orders/:id`,
  `GET /work-orders/:id/history`, `POST /work-orders/:id/publish`, `POST /work-orders/:id/transition`,
  and `PATCH /work-orders/:id/status`. Strictly rejects manual API transitions to `PAID` via API;
  settlement to `PAID` is exclusively driven by `settlePaid()` upon consuming `billing.payout.disbursed`.
  Houses `SlaAutoApprovalService` running every 5 minutes to sweep `COMPLETED` work orders older than
  the 72-hour review SLA and trigger FSM `COMPLETED → APPROVED` transitions via `WorkOrdersService.transition()`
  with `role = 'SYSTEM'`, emitting canonical `work_order.lifecycle.approved` events.
  Houses commercial bidding (`POST /work-orders/:id/bids`, `GET /work-orders/:id/bids`, `POST /work-orders/:id/bids/:bidId/accept`).
  Atomic bid acceptance locks bids `FOR UPDATE`, marks winner `ACCEPTED`, rejects siblings, executes FSM `PUBLISHED → ASSIGNED`
  via `WorkOrderFsmService`, and records status history in `work_order_status_history` within one ACID transaction.
  Sole mutator of `work_orders`, `work_order_bids`, and `work_order_status_history`. Sole emitter of
  `work_order.lifecycle.assigned`, `work_order.lifecycle.approved`, `tech.bid.accepted`, and `work_order.lifecycle.paid`.
- **Pure Geospatial Matching Engine (`apps/dispatch-matching-service`).**
  - Redis `GEOADD` and `GEOSEARCH` on `tech:locations` with Haversine exact distance filtering.
  - Multi-parameter contractor scoring algorithm: 40% distance, 30% rating, 15% completed jobs, 15% verified certifications.
  - Two-tier distributed caching in `TechnicianDirectoryService` (Redis distributed cache with 300s TTL + in-memory LRU fallback) with partial batch hit optimization: fetches strictly uncached technician IDs over HTTP from `auth-service`, with zero HTTP calls on full cache hits.
  - Endpoints: `POST /dispatch/technicians/location`, `GET /dispatch/technicians/nearby`, and `POST /dispatch/auto-route`.
- **Escrow & Money Safety (`apps/billing-service`).**
  - Fully resolves **C3**; `releaseFunds()` executes inside a locked `db.transaction()` with `FOR UPDATE` on `escrow_accounts`. Asserts `status === 'HELD'`, verifies buyer caller authority, transitions escrow to `RELEASED`, dispatches payout via `PaymentProviderPort` (`LedgerPaymentProvider`), logs double-entry `payout_ledger` credit, and emits `billing.payout.disbursed` (ADR 005). Consumes `work_order.lifecycle.approved` via `BillingConsumer`. Completely decoupled from `work_orders` table mutations (ADR 009).
  - Enforces request deduplication and replay via `idempotency_keys` table.
  - Deterministic SHA-256 content-hashed invoice generation (`InvoicesService`) and cryptographically verified PDF invoice generation via `pdfkit` (FR-BILL-003).
  - Technician earnings ledger query (`GET /billing/technicians/:id/payouts`).
- **Notification Backbone (Headless Worker, ADR 010) (`apps/notification-service`).**
  - Decoupled from edge proxy routing in `apps/api-gateway`; operates strictly as an autonomous, headless background consumer daemon.
  - `NotificationConsumer` subscribes to `WORK_ORDER_PUBLISHED`, `WORK_ORDER_ASSIGNED`, and `WORK_ORDER_PAID`.
  - Dispatches FCM Push notifications and SMS receipts (`SmsNotificationChannel`) to technicians upon payout disbursement.
  - Exposes internal `HealthController` (`/healthz`, `/readyz`) and Prometheus metrics scraping (`/metrics`) on container port 8005 for Kubernetes and APM observability with zero public HTTP routing.
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
- **A test harness that can fail.** 488 automated unit/integration tests across 15 packages/apps (+ 28 Playwright E2E tests = 516 total verified tests).
- **Multi-Tier Caching & Correlation Tracking for Technician Directory Geo-Search (Phase 15, Resolves FF-ARCH-08 / Service Audit Issue A).**
  - Resolved un-cached synchronous HTTP fan-out in `apps/dispatch-matching-service`: `TechnicianDirectoryService` now utilizes Redis distributed caching with a 300s TTL and an in-memory fallback cache.
  - Partial cache hit optimization: checks cache first, queries `POST /technicians/batch` strictly for missing uncached IDs, populates both caches via Redis pipeline `SETEX`, and merges the results. Zero HTTP calls on 100% cache hit.
  - Corrected fallback `authServiceUrl` default from port `3001` to `8001` matching the microservices port allocation.
  - Trace context propagation: incoming `x-correlation-id` headers in `DispatchController` (`/dispatch/nearby`, `/dispatch/auto-route/recommend`) are passed through `GeoSearchService` to `TechnicianDirectoryService` HTTP calls.
  - Zero database migrations (`RULE-DB-02`).

- **Circular Event Loop Decoupling in work-order-service (FF-ARCH-07, Service Audit Issue A).**
  - Decoupled `WorkOrderEventsConsumer` from self-consumption of `tech.bidding.accepted`: subscription now exclusively listens for `billing.payout.disbursed`.
  - Preserved atomic, single-transaction bid acceptance (`POST /work-orders/:id/bids/:bidId/accept`) in `BidsService.acceptBid()` while eliminating redundant second-pass `SELECT ... FOR UPDATE` attempts on `work_orders` and duplicate `work_order.lifecycle.assigned` event broadcasts.
  - Zero database migrations (`RULE-DB-02`).
- **Headless Notification Worker Boundary & Gateway Route Decoupling (Phase 14, Resolves Finding 6, ADR 010).**
  - Removed `notifications` from `gatewayConfig.services` and `ProxyController` in `apps/api-gateway`, ensuring the edge gateway exclusively fronts the 4 domain services (`auth`, `work-orders`, `dispatch`, `billing`).
  - Unmapped calls targeting `/api/v1/notifications/*` fail fast at the edge with 404 without opening unnecessary upstream proxy sockets.
  - Formally annotated `NotificationModule` in `apps/notification-service` as an autonomous background consumer daemon, preserving internal `HealthController` (`/healthz`, `/readyz`) and Prometheus telemetry (`/metrics`) on port 8005.
- **Event-Driven Order Settlement Choreography and SLA Review Relocation (Phase 13, Resolves Finding 5, ADR 009).**
  - Relocated `SlaAutoApprovalService` from `apps/billing-service` to `apps/work-order-service`, eliminating cross-service SQL mutations and table rollback queries on `work_orders`. Auto-approval executes via `WorkOrdersService.transition()` with `role = 'SYSTEM'`, recording status history and emitting canonical `work_order.lifecycle.approved`.
  - Blocked manual transitions to `PAID` via API (`POST /work-orders/:id/transition`); settlement to `PAID` is exclusively driven by `settlePaid()` upon consuming `billing.payout.disbursed`.
  - Subscribed `NotificationConsumer` in `apps/notification-service` to `work_order.lifecycle.paid` (`EventType.WORK_ORDER_PAID`), dispatching push and SMS payout receipts to technicians upon completion.
- **IAM, Domain Profiles, and Contractor Vetting Separation (Phase 12, Resolves Finding 4, ADR 008).**
  - Restructured `apps/auth-service` into three distinct, encapsulated NestJS domain modules (`IamModule`, `ProfilesModule`, `ContractorVettingModule`).
  - Decoupled low-level IAM credentials, passwords, JWT signing/rotation, and phone OTP from marketplace domain profile management and contractor compliance certifications.
  - Inverted dependencies via `ProfilesService` port: `AuthService` delegates profile creation and profileId resolution to `ProfilesService` via optional DI, eliminating direct SQL queries on profile tables from the IAM service.
  - Exported domain-specific database schemas from `@fieldforge/database`: `iamSchema`, `profileSchema`, `vettingSchema`.
  - Zero database schema migrations (`RULE-DB-02`); preserved 6-microservice platform topology with zero microservice sprawl.
- **Marketplace Bidding Relocation & Work Order Aggregate Cohesion (Phase 11, Resolves Finding 3, ADR 007).**
  - Re-homed commercial bidding logic to `apps/work-order-service`, establishing `Bid` as a cohesive entity within the `WorkOrder` aggregate root.
  - Implemented atomic transactional bid acceptance (`POST /work-orders/:id/bids/:bidId/accept`) executing bid acceptance, sibling rejection, FSM transition (`PUBLISHED → ASSIGNED`), and audit history logging inside one ACID transaction.
  - Purified `apps/dispatch-matching-service` to strictly provide geospatial matching (Redis `GEOSEARCH`), live coordinates, and automated routing.
  - API Gateway path rewriting ensures seamless backwards compatibility for `/dispatch/bids` and legacy consumers.
- **Bounded Context Data Isolation & Profile Propagation (Phase 10, Resolves Finding 2, ADR 006).**
  - Eliminated synthetic profile generation (`Default Buyer Co` removed from `work-orders.service.ts`; un-onboarded buyers receive clean `NotFoundException`).
  - Added `profileId` claim to JWT payload in `auth-service` upon registration, login, and token refresh.
  - Propagated `x-ff-profile-id` header downstream from `api-gateway` in asserted gateway headers.
  - Replaced cross-service SQL joins across `technicianProfiles`, `users`, and `technicianCertifications` in `dispatch-matching-service` with `TechnicianDirectoryService` calling `POST /technicians/batch` on `auth-service`.
  - Added caller profileId fast-path across work-order-service, dispatch-matching-service, and billing-service to eliminate foreign user table lookups and preserve bounded context independence.
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
