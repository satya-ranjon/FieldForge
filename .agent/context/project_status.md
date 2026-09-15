# FieldForge Implementation Status

**Last reviewed:** 2026-09-15  
**Phase:** Phase 45 complete — Secure Technician Batch Endpoint (Resolves ISSUE-007). Roadmap: `docs/DEVELOPMENT_PLAN.md`.

## What exists

- A pnpm/Turborepo monorepo with NestJS service shells, a Next.js App Router buyer
  portal (migrated off Vite; still served on port 5173), an Expo technician app, and
  shared contracts, database, common, messaging, and UI packages.
- Drizzle schemas and migrations for users, work orders, status history, bids,
  deliverables, escrow, refresh tokens, technician certifications, idempotency keys,
  invoices, payout ledger, and outbox tables (`0000`, `0001`, `0002_auth.sql`, `0003_wo_history.sql`, `0004_long_marvel_boy.sql`, `0005_chubby_iron_lad.sql`, `0006_green_wild_pack.sql`, `0007_blue_malice.sql`).
- Local Docker Compose definitions for MySQL, Redis, RabbitMQ, Jaeger,
  Prometheus, and Grafana.
- Architecture rules, eleven accepted ADRs (including ADR 005, ADR 006, ADR 007, ADR 008, ADR 009, ADR 010 `010_headless_notification_worker_boundary.md`, and ADR 011 `011_transactional_outbox_pattern.md`), and CI/build scaffolding.
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
  Centralized in `@fieldforge/common` via `verifyGatewayUser()` and `GatewayAuthGuard` (FF-CODE-01 / Phase 22).
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
  Houses work order cancellation transition executor `executeCancelledTransition()` publishing canonical `work_order.lifecycle.cancelled`.
  Sole mutator of `work_orders`, `work_order_bids`, and `work_order_status_history`. Sole emitter of
  `work_order.lifecycle.assigned`, `work_order.lifecycle.approved`, and `work_order.lifecycle.paid` (`tech.bidding.accepted` retired in Phase 18).
  Assignment business logic across `BidsService.acceptBid`, `WorkOrdersService.transition`, and `WorkOrdersService.assignTechnicianFromBid` is unified into `executeWorkOrderAssignment()` and `resolveAgreedRateMinor()` (`work-order-assignment.ts`, FF-CODE-02 / Phase 23). Transition engine decoupled into modular transition guards and execution strategies (`work-order-transition.ts`, FF-CODE-03 / Phase 24), satisfying SRP and OCP.
- **Pure Geospatial Matching Engine (`apps/dispatch-matching-service`).**
  - Redis `GEOADD` and `GEOSEARCH` on `tech:locations` with Haversine exact distance filtering. Pure Redis live geospatial source with zero relational database dependency (`@fieldforge/database` and `DrizzleModule` fully decoupled; zero direct SQL access to auth-owned tables).
  - Multi-parameter contractor scoring algorithm: 40% distance, 30% rating, 15% completed jobs, 15% verified certifications.
  - Two-tier distributed caching in `TechnicianDirectoryService` (Redis distributed cache with 300s TTL + in-memory LRU fallback) with partial batch hit optimization: fetches strictly uncached technician IDs over HTTP from `auth-service`, with zero HTTP calls on full cache hits. Unresolved or suspended directory records fail safe to unavailable (`isAvailable = false`), preventing unverified contractors from being auto-routed.
  - Endpoints: `POST /dispatch/technicians/location`, `GET /dispatch/technicians/nearby`, and `POST /dispatch/auto-route`.
- **Escrow & Money Safety (`apps/billing-service`).**
  - Fully resolves **C3**; `releaseFunds()` executes inside a locked `db.transaction()` with `FOR UPDATE` on `escrow_accounts`. Asserts `status === 'HELD'`, verifies buyer caller authority, transitions escrow to `RELEASED`, dispatches payout via `PaymentProviderPort` (`LedgerPaymentProvider`), logs double-entry `payout_ledger` credit, and emits `billing.payout.disbursed` (ADR 005). Consumes `work_order.lifecycle.approved` via `BillingConsumer`. Completely decoupled from `work_orders` table mutations (ADR 009).
  - Fully resolves **ISSUE-001**: `refundEscrow()` executes inside a locked `db.transaction()` with `FOR UPDATE` on `escrow_accounts`. Consumes `work_order.lifecycle.cancelled` via `BillingConsumer`. Transitions HELD escrow to `REFUNDED` and dispatches refund to the buyer via `PaymentProviderPort.refundEscrow()`. Handles nonexistent escrow (e.g. cancelled in DRAFT) and already REFUNDED escrow as idempotent no-ops, and safely protects already RELEASED funds with warnings. Backed by `idempotency_keys` table.
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
- **Event Backbone (`packages/messaging`).** AMQP messaging module with publisher confirms, broker-native dead-letter retry delay queues (`<queue>.retry`) with per-message TTL, state-aware Redis idempotency locking (`markRetrying`, atomic Lua lock re-acquisition), 7-day atomic Redis `SETNX` deduplication, bounded 3-retry backoff, DLQ routing, and cross-service producers/consumers.
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
- **A test harness that can fail.** 811 automated unit/integration tests across 15 packages/apps (+ 48 Playwright E2E tests = 859 total verified tests).
- **Secure Technician Batch Endpoint (Phase 45, Resolves ISSUE-007).**
  - Secured `POST /technicians/batch` in `apps/auth-service` as an internal-only endpoint via `InternalServiceGuard(['dispatch-matching-service'])`, requiring valid `x-fieldforge-service-name` and `x-fieldforge-internal-secret` headers.
  - Removed `'/api/v1/technicians/batch'` and `'/technicians/batch'` from `PUBLIC_PREFIXES` in API Gateway `jwt-auth.guard.ts`. Requests through gateway require authentication, and edge proxy strips client-supplied internal service headers (`GATEWAY_STRIPPED_HEADERS`).
  - Bounded `batchTechniciansSchema` in `@fieldforge/contracts` to `ids: z.array(z.string().min(1).max(64)).min(1).max(100)` preventing payload exhaustion / DoS attacks.
  - Implemented bounded batch chunking loop ($\le 100$ IDs per request) in `TechnicianDirectoryService` (`apps/dispatch-matching-service`), passing canonical internal service credentials and propagating `x-correlation-id`.
  - Maintained zero direct SQL access from dispatch, two-tier Redis/LRU caching, minimal summary response exposure, and bounded 2-query batch lookups in auth. Zero database migrations (`RULE-DB-02`).
  - Added automated unit tests across contracts, gateway, auth-service, and dispatch-matching-service.
- **Pure Redis Live Location Architecture & Dispatch Database Decoupling (Phase 44, Resolves ISSUE-004A & ISSUE-004B).**
  - Completely decoupled `apps/dispatch-matching-service` from relational database access, removing `@fieldforge/database`, `drizzle-orm`, and `DrizzleModule.forRoot()`.
  - Canonicalized Redis `tech:locations` as the sole operational store for technician live coordinates (`GEOADD`, `GEOSEARCH`), eliminating cross-service MySQL writes (`UPDATE technician_profiles SET current_latitude, current_longitude`) and direct SQL join fallbacks against auth-owned tables (`technician_profiles`, `users`, `technician_certifications`).
  - Formally resolved the original dual-write concurrency hazard (`ISSUE-004B`) by eliminating the second write altogether.
  - Hardened caller identity in `POST /dispatch/technicians/location`: requires a verified `profileId` on the authenticated user context (injected by gateway or decoded from JWT), returning `ForbiddenException` if absent and rejecting missing coordinate inputs with `BadRequestException`.
  - Pure batch directory hydration: `GeoSearchService.findNearbyTechnicians()` resolves contractor metadata strictly through `TechnicianDirectoryService.getTechniciansBatch()` (HTTP `POST /technicians/batch` with two-tier Redis/in-memory cache).
  - Candidate eligibility safety: unresolved directory records fail safe with `isAvailable = false`, `rating = 0`, and `certifications = []`, preventing unverified or suspended technicians from qualifying for automated routing.
  - Zero schema migrations (`RULE-DB-02`): dormant columns on auth-owned `technician_profiles` are untouched in this phase for future schema deprecation.
  - Added architectural boundary test suite (`test/architecture-boundary.spec.ts`) scanning all dispatch source files to ensure zero database imports, Drizzle modules, or references to auth-owned tables.
- **Real Amazon S3 Deliverable Upload Mobile Client Integration (Phase 43, Resolves ISSUE-003A Mobile Client).**
  - Connected the React Native technician mobile app (`apps/mobile-tech-app`) to canonical Amazon S3 deliverable storage, completely eradicating fake `media.fieldforge.dev` URLs.
  - Mobile deliverable uploads use direct client-to-S3 presigned PUT with actual file bytes (`Blob`) via `DeliverableUploadService`.
  - Direct S3 PUT preserves `Content-Type` and strictly strips all FieldForge authentication headers (`Authorization`, `x-ff-*`), cookies, and AWS credentials.
  - Offline jobs store local file references (`localUri`, `filename`, `mimeType`, `sizeBytes`), never persisting time-limited (900s) presigned URLs.
  - On network reconnection, requests fresh presigned URLs before PUTting bytes to S3.
  - Deliverables become authoritative only after backend confirmation (`POST /work-orders/:id/deliverables`) completes `HeadObject` verification.
  - Confirmation retry strategy: retains `objectKey` if confirmation drops after successful S3 PUT, allowing retry to confirm directly without re-uploading bytes.
  - Durable local storage management (`FileSystem.documentDirectory`) saves queued offline photos to persistent app storage, preventing cache purging before reconnection.
  - Added 13 unit tests in `apps/mobile-tech-app/test/deliverableUpload.service.spec.ts` and updated `activeJob.spec.ts`.
- **Real Amazon S3 Deliverable Upload Flow Backend Implementation (Phase 42, Resolves ISSUE-003A Backend).**
  - Canonicalized Amazon S3 as the sole production storage engine for work order deliverable photos and documentation using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
  - Implemented fail-fast startup configuration checks in `S3MediaStorageAdapter` requiring `AWS_REGION` and `S3_DELIVERABLES_BUCKET`.
  - Fixed premature database write bug: generating presigned upload URLs creates strictly zero database rows.
  - Implemented secure two-phase upload flow: `POST /work-orders/:id/deliverables/presigned-url` returns presigned PUT URL and server-controlled object key (`work-orders/{id}/deliverables/{type}/{uuid}.{ext}`), followed by `POST /work-orders/:id/deliverables` confirming upload with S3 `HeadObject` verification (validating existence, `ContentType`, and `ContentLength`) before persisting database record.
  - Implemented authorized presigned download GET URL endpoint: `GET /work-orders/:id/deliverables/:deliverableId/download-url` with caller role checks (owning buyer, assigned technician, or admin) returning 900s time-limited URLs without making S3 buckets public.
  - Configured AWS S3 bucket public access blocks and CORS policies in Terraform (`infra/terraform/main.tf`).
  - Added unit test coverage in `packages/contracts/test/validators.spec.ts`, `apps/work-order-service/test/s3-media-storage.adapter.spec.ts`, `apps/work-order-service/test/deliverables.service.spec.ts`, and `apps/work-order-service/test/work-orders.controller.spec.ts`.
- **Premature PAYOUT_FAILED Emission & Financial Consistency Remediation (Phase 41, Resolves ISSUE-011).**
  - Eliminated critical financial consistency bug where transient payout failures during `BillingConsumer.handleWorkOrderApproved()` prematurely published `PAYOUT_FAILED`, causing `work-order-service` to execute a destructive compensating rollback `APPROVED → COMPLETED`. Subsequent successful retries disbursed funds and set escrow `RELEASED`, but `settlePaid()` failed because `COMPLETED → PAID` was rejected, stranding work orders in `COMPLETED`.
  - Removed `PAYOUT_FAILED` event creation and publication from `BillingConsumer.handleWorkOrderApproved()`. Structured failure context is logged and errors are re-thrown to engage RabbitMQ's broker-native delay retry queues (`<queue>.retry`) and DLQ (`fieldforge.billing.work-orders.dlq` on `fieldforge.dlx`) with zero status corruption.
  - Removed compensating rollback handler `handlePayoutFailed()` from `WorkOrdersService` and unhooked `EventType.PAYOUT_FAILED` subscription from `WorkOrderEventsConsumer`.
  - Hardened `WorkOrderFsmService` by removing `WorkOrderStatus.COMPLETED` from `validTransitions[WorkOrderStatus.APPROVED]`, enforcing strict terminal progression `APPROVED → PAID`. Customer approval cannot be reversed by payout infrastructure failures.
  - Formally annotated `EventType.PAYOUT_FAILED`, `PayoutFailedPayload`, and `PayoutFailedEvent` in `@fieldforge/contracts` as `@deprecated` with zero runtime producer or consumer.
  - Added regression test suites across `billing.consumer.spec.ts`, `work-order-fsm.service.spec.ts`, `work-order-events.consumer.spec.ts`, and `work-orders.service.spec.ts`. Verified 750 unit/integration tests and 48 E2E tests pass cleanly (798 total).
- **Frontend Escrow Release Route Mismatch Alignment (Phase 40, Resolves ISSUE-010).**
  - Eliminated HTTP 404 Not Found errors on buyer manual escrow release requests caused by route mismatch (`POST /billing/escrow/:workOrderId/release` sent by UI vs `POST /billing/escrow/release` with `ReleaseEscrowDto` expected by `BillingController`).
  - Exported `EscrowReleaseResultDto` in `@fieldforge/contracts` and realigned RTK Query `releaseEscrow` mutation in `apps/web-buyer-portal/src/store/services/api.ts` with pure query builder `buildReleaseEscrowRequest`.
  - Removed redundant `releaseEscrowApi` call from `LiveDispatchBoard.tsx` `handleApprove()`, preventing race conditions and 409 Conflict errors against the backend's canonical asynchronous event pipeline (`WORK_ORDER_APPROVED` → `BillingConsumer` → `releaseFunds(SYSTEM)`).
  - Added unit test coverage in `packages/contracts/test/validators.spec.ts` for `releaseEscrowSchema`, in `apps/billing-service/test/billing.controller.spec.ts` for `releaseEscrow`, and in `apps/web-buyer-portal/e2e/transition.spec.ts` for `buildReleaseEscrowRequest`. Total verified tests increased to 750 unit/integration + 48 E2E = 798 total.
- **Transactional Outbox Pattern for Microservice Event Publication (Phase 37, Resolves ISSUE-005).**
  - Eliminated non-transactional dual-write hazards across `work-order-service` and `billing-service` where domain database commits and RabbitMQ message publishes could diverge (ghost events on DB rollback, lost events on network/broker failure post-commit).
  - Provisioned service-owned outbox tables `work_order_outbox_events` and `billing_outbox_events` with auto-increment IDs for strict monotonic per-aggregate FIFO ordering, UUID event deduplication, and crash-recovery leases (`0007_blue_malice.sql`).
  - Implemented shared outbox engine in `@fieldforge/common`:
    - `insertOutboxEvent(tx, table, params)` ensuring domain events are inserted within the same ACID transaction as state changes.
    - `OutboxRelay` abstract base class with CAS claim token fencing (`claim_token` on published/failed marks), 30s lease-based crash recovery, monotonic per-aggregate FIFO ordering blockers, batch claiming (`LIMIT 5`), bounded concurrent publishing (`Promise.allSettled`, limit 5), 10s timeout handle cleanup, poison dead-lettering (`FAILED`), and single-flight post-commit trigger coalescing.
  - Refactored `work-orders.service.ts`, `bids.service.ts`, and `escrow.service.ts` to replace direct in-transaction network publishes with outbox row insertions and post-commit relay triggers.
  - Added unit test suites across `outbox-relay.spec.ts` (7 tests), `work-order-outbox.spec.ts` (6 tests), and `billing-outbox.spec.ts` (2 tests).
- **Internal Service Authentication & Lookup Remediation (Phase 38, Resolves ISSUE-002).**
  - Eliminated 401 Unauthorized errors during manual escrow release where `billing-service` called user-guarded endpoints on `work-order-service`.
  - Introduced `WorkOrderBillingContextDto` (`@fieldforge/contracts`) containing only minimal fields (`id`, `buyerId`, `assignedTechnicianId`, `status`) to preserve bounded context privacy (`RULE-ARCH-01`).
  - Implemented reusable `InternalServiceGuard` in `@fieldforge/common` enforcing constant-time comparison of `x-fieldforge-internal-secret` (`crypto.timingSafeEqual` with length validation) and service-name authorization via `x-fieldforge-service-name` (401 on invalid/missing secret; 403 on unauthorized service name).
  - Mounted dedicated `InternalWorkOrdersController` on `work-order-service` (`GET /internal/work-orders/:id/billing-context`).
  - Refactored `WorkOrderDirectoryService` in `billing-service` to call internal endpoint and provide semantic error handling (404 -> null; 401/403 -> `InternalServerErrorException`; 5xx/network -> `ServiceUnavailableException`).
  - Decoupled `WorkOrderDirectoryService.getWorkOrder()` and caller profile checks from `db.transaction()` in `EscrowService.releaseFunds()` and `refundEscrow()`, eliminating holding InnoDB row locks (`SELECT ... FOR UPDATE`) during inter-service network HTTP calls.
  - Enforced API Gateway anti-spoofing stripping internal credentials and explicitly blocking external routing to `/internal/*`.
  - Removed unsafe 60-second in-memory response cache in `WorkOrderDirectoryService`, guaranteeing zero stale remote caching of mutable fields (`status`, `assignedTechnicianId`) for financial authorization.
- **Frontend Work Order Transition Payload Contract Alignment (Phase 39, Resolves ISSUE-009).**
  - Eliminated HTTP 400 Bad Request errors on buyer portal lifecycle transitions caused by payload mismatch (`{ status, notes }` sent by UI vs `{ nextStatus, reason }` expected by `WorkOrdersController` and `transitionStatusSchema`).
  - Realigned `transitionWorkOrder` mutation in `apps/web-buyer-portal/src/store/services/api.ts` with canonical `TransitionWorkOrderDto` from `@fieldforge/contracts` and exported pure query builder `buildTransitionWorkOrderRequest`.
  - Updated `handleApprove` and `handleRaiseDispute` in `LiveDispatchBoard.tsx` to dispatch canonical payloads (`{ nextStatus: WorkOrderStatus.APPROVED }` and `{ nextStatus: WorkOrderStatus.DISPUTED, reason }`).
  - Added unit regression tests in `packages/contracts/test/validators.spec.ts` proving schema rejection of legacy `{ status, notes }` and acceptance of canonical `{ nextStatus, reason }`.
  - Added Playwright tests in `apps/web-buyer-portal/e2e/transition.spec.ts` verifying API query generation and UI action interception. Total verified tests increased to 743 unit/integration + 36 E2E = 779 total.
- **Payment Provider Capture & Payout Idempotency (Phase 36, Resolves FINDING-PAY-001 & FINDING-PAY-002).**
  - Eliminated external double-charge and double-payout vulnerabilities when external payment provider calls succeed but MySQL transactions fail to commit or roll back.
  - Extended `PaymentProviderPort.captureEscrow()` and `PaymentProviderPort.disbursePayout()` with mandatory `idempotencyKey: string;`.
  - Implemented provider-level idempotency caching with parameter mismatch validation (`ConflictException`) in `LedgerPaymentProvider`.
  - Wired deterministic operation keys end-to-end:
    - Escrow preauthorization capture: `escrow-capture:${idempotencyKey || workOrderId}` via `BillingController.preAuthEscrow()` & `EscrowService.lockFunds()`.
    - Technician payout disbursement: `escrow-payout:${keySuffix || workOrderId}` via `BillingConsumer` & `EscrowService.releaseFunds()`.
    - Buyer remainder refund: `escrow-remainder-refund:${keySuffix || workOrderId}` via `EscrowService.releaseFunds()`.
    - Work order cancellation refund: `escrow-refund:${eventId || workOrderId}` via `BillingConsumer` & `EscrowService.refundEscrow()`.
  - Added unit test coverage across `ledger-payment.provider.spec.ts`, `escrow.service.spec.ts`, and `billing.controller.spec.ts`.
  - Total unit tests in `billing-service` increased to 71 (+15 tests across Phase 36, 686 total across the monorepo).
  - Zero database migrations (`RULE-DB-02`).
- **Work Order Cancellation Escrow Refund Path & Provider Idempotency (Phase 35, Resolves ISSUE-001 & FINDING-ISSUE-001-A).**
  - Eliminated trapped escrow funds in `HELD` status upon work order cancellation by introducing canonical `work_order.lifecycle.cancelled` (`EventType.WORK_ORDER_CANCELLED`) in `@fieldforge/contracts`.
  - Implemented `publishWorkOrderCancelled` in `WorkOrderEventPublisher` and registered `executeCancelledTransition` in `transitionExecutors[WorkOrderStatus.CANCELLED]`.
  - Subscribed `BillingConsumer` to `EventType.WORK_ORDER_CANCELLED`, routing events to `EscrowService.refundEscrow()`.
  - Implemented `EscrowService.refundEscrow()` with pessimistic row-level locking (`SELECT ... FOR UPDATE`), dual idempotency (Redis and DB `idempotency_keys`), idempotent no-ops for already refunded or absent escrow accounts, and release guards.
  - Resolved `FINDING-ISSUE-001-A` by enforcing mandatory `idempotencyKey: string` on `PaymentProviderPort.refundEscrow()`, implementing in-memory deduplication with parameter conflict verification in `LedgerPaymentProvider`, and propagating deterministic `escrow-refund:${event.eventId}` throughout the cancellation pipeline and `escrow-remainder-refund:${key}` in payout remainder refunding.
  - Added unit test coverage across `work-order-event.publisher.spec.ts`, `work-order-transition.spec.ts`, `work-orders.service.spec.ts`, `billing.consumer.spec.ts`, `escrow.service.spec.ts`, and `ledger-payment.provider.spec.ts`.
  - Total unit tests in `billing-service` increased to 56 (+20 tests across Phase 35, 671 total across the monorepo).
  - Zero database migrations (`RULE-DB-02`).
- **Centralize Lossless Currency Conversions Across Services (Phase 34, Resolves FF-CODE-13 / Code Quality Issue 13).**
  - Eliminated manual floating-point arithmetic (`(amountMinor / 100).toFixed(2)`, `Math.round(Number(row.amount) * 100)`) for minor currency conversions across `apps/billing-service`, `apps/work-order-service`, `apps/mobile-tech-app`, and `apps/notification-service`.
  - Standardized on lossless integer utilities from `@fieldforge/contracts`: `minorToDecimalString`, `decimalStringToMinor`, and `formatMinor`.
  - Added unit test coverage in `apps/billing-service/test/escrow.service.spec.ts` asserting exact parsing of decimal amounts into integer minor units and lossless credit/debit ledger aggregation.
  - Total unit tests in `billing-service` increased to 36 (+3 tests, 649 total across the monorepo).
  - Zero database migrations (`RULE-DB-02`).
- **Eliminate Defensive Duck-Typing and Fix Unit Test Mocks (Phase 33, Resolves FF-CODE-12 / Code Quality Issue 12).**
  - Removed defensive duck-typing checks (`query && typeof query.from === 'function'`) and silent error-suppression `try/catch` blocks from `ProfilesService` in `apps/auth-service`.
  - Upgraded unit test doubles in `apps/auth-service/test/profiles.service.spec.ts` with `createQueryChain()` and `createMockDb()`, providing mock query builders that natively adhere to Drizzle ORM's fluent builder interface (`.select().from().where().limit()`).
  - Added unit tests verifying real database runtime error propagation in `resolveProfileId` and `resolveUserIdByProfileId`.
  - Added unit tests for role-omitted fallback lookups in `resolveUserIdByProfileId` (technician hit, buyer fallback hit, neither found).
  - Total unit tests in `auth-service` increased to 82 (+5 tests, 646 total across the monorepo).
  - Zero database migrations (`RULE-DB-02`).
- **Remove In-Memory Mocks from Production Service Classes (Phase 32, Resolves FF-CODE-11 / Code Quality Issue 11).**
  - Removed `mockCertifications` fixture and all `if (this.db)` conditional branches from `CertificationsService` in `apps/auth-service`.
  - Required `@Inject(DRIZZLE) private readonly db: DrizzleClient` as a mandatory constructor dependency.
  - Installed `@nestjs/testing` and updated `apps/auth-service/test/certifications.service.spec.ts` to instantiate `CertificationsService` via `Test.createTestingModule()` with an in-memory repository mock simulating Drizzle operations.
  - Added unit test asserting `NotFoundException` on missing certification verification.
  - Zero database migrations (`RULE-DB-02`).
- **Centralized Profile ID Resolution Across Services (Phase 31, Resolves FF-CODE-10 / Code Quality Issue 10).**
  - Enhanced `ProfileDirectoryService` in `@fieldforge/common` with `resolveProfileId()` (supporting caller token fast path, case-insensitive role dispatch, and fallback profile extraction) and `resolveProfileIdOrThrow()` (encapsulating repetitive null checks and exceptions).
  - Enhanced `ProfilesService` in `apps/auth-service` with case-insensitive `resolveProfileId()` and `resolveUserIdByProfileId()`, delegating fallback lookups in `CertificationsService` to it.
  - Standardized profile identity resolution in `BillingController.preAuthEscrow()`, `BillingController.getTechnicianPayouts()`, `EscrowService.releaseFunds()`, `WorkOrdersService.create()`, `WorkOrdersService.publish()`, `DeliverablesService`, `BidsService`, and `work-order-transition.ts`.
  - Injected `ProfileDirectoryService` into `GeoSearchService` in `apps/dispatch-matching-service`, eliminating ad-hoc fallback table querying against `technicianProfiles`.
  - Added unit test suites across `@fieldforge/common` (10 tests), `apps/auth-service` (3 tests), and `apps/work-order-service` (2 tests), bringing total verified tests to 640 unit + 28 E2E = 668 tests.
  - Zero database migrations (`RULE-DB-02`).
- **Canonical Drizzle Transaction Typing across Microservices (Phase 30, Resolves FF-CODE-09 / Code Quality Issue 9).**
  - Exported canonical `DatabaseSchema`, `DatabaseClient`, `DatabaseTransaction`, and `DbOrTx` from `packages/database/src/index.ts`.
  - Re-exported and aliased `DrizzleClient`, `DrizzleTransaction`, `DbOrTx`, and `DatabaseOrTransaction` from `packages/common/src/database/drizzle.module.ts` and `packages/common/src/index.ts`.
  - Refactored `InvoicesService.generateInvoiceWithTx(tx: DbOrTx | undefined, ...)` in `apps/billing-service` to use `const database = tx ?? this.db;`, removing unsafe `as DrizzleClient` cast.
  - Refactored `ProfilesService.provisionProfile(dbOrTx: DbOrTx | undefined, ...)` in `apps/auth-service` to use `const executor = dbOrTx ?? this.db;`, removing unsafe `as DrizzleClient` cast.
  - Refactored `work-order-assignment.ts` in `apps/work-order-service` to import canonical `DrizzleTransaction` and `DbOrTx` from `@fieldforge/common` and alias `export type AssignmentDbTx = DbOrTx;`.
  - Refactored `BidsService` (`apps/work-order-service`) and `GeoSearchService` (`apps/dispatch-matching-service`) to inject schema-aware `DrizzleClient` from `@fieldforge/common` rather than raw `MySql2Database<Record<string, unknown>>`.
  - Updated mock transaction implementations in `escrow.service.spec.ts`, `invoices.service.spec.ts`, `auth.service.spec.ts`, `profiles.service.spec.ts`, `work-orders.service.spec.ts`, and `bids.service.spec.ts` with strongly typed `DrizzleTransaction` and `DbOrTx`.
  - Zero database migrations (`RULE-DB-02`).

- **Decoupled Dispatch Candidate Scoring from Redis Spatial Search (Phase 29, Resolves FF-CODE-08 / Code Quality Issue 8).**
  - Created `CandidateScorerPort` (`apps/dispatch-matching-service/src/modules/scoring/candidate-scorer.interface.ts`) defining candidate scoring weights (`DEFAULT_CANDIDATE_SCORING_WEIGHTS`: 40% distance, 30% rating, 15% experience, 15% certifications) and `CANDIDATE_SCORER` injection symbol.
  - Implemented `@Injectable() CandidateScoringService` adapter implementing `CandidateScorerPort`, isolating proximity curve calculations, normalized 5-star ratings, capped job history, and certification match logic from low-level Redis calls.
  - Refactored `GeoSearchService` in `apps/dispatch-matching-service` to remove inline scoring math and delegate candidate ranking to injected `CandidateScorerPort` with default fallback to `CandidateScoringService`.
  - Registered and exported `CandidateScoringService` and `CANDIDATE_SCORER` in `DispatchModule`.
  - Added unit test suite `candidate-scoring.service.spec.ts` (24 tests) validating mathematical boundary conditions and custom weights, and updated `geo-search.service.spec.ts`.
  - Zero database migrations (`RULE-DB-02`).

- **Decoupled Invoice PDF Rendering from Billing Domain Service (Phase 28, Resolves FF-CODE-07 / Code Quality Issue 7).**
  - Created `InvoicePdfRendererPort` (`apps/billing-service/src/modules/invoices/invoice-pdf.renderer.port.ts`) defining the hexagonal secondary port and `INVOICE_PDF_RENDERER` injection symbol.
  - Implemented `PdfKitInvoicePdfRenderer` adapter implementing `InvoicePdfRendererPort`, isolating imperative PDFKit coordinate drawing, fonts, layout math, metadata headers, line items table, and SHA-256 digital signature/hash rendering into a dedicated rendering adapter.
  - Refactored `InvoicesService` in `apps/billing-service` to remove direct PDFKit dependencies and delegate `generateInvoicePdf(id)` to the injected `InvoicePdfRendererPort` with fallback to `PdfKitInvoicePdfRenderer`.
  - Registered `INVOICE_PDF_RENDERER` provider in `BillingModule`.
  - Added unit test suites `pdfkit-invoice-pdf.renderer.spec.ts` (5 tests) and updated `invoices.service.spec.ts`.
  - Zero database migrations (`RULE-DB-02`).

- **Standardized Declarative Request Body Validation & Error Hardening (Phase 27, Resolves FF-CODE-06 / Code Quality Issue 6).**
  - Implemented reusable `@Injectable()` `ZodValidationPipe` in `@fieldforge/common` (`pipes/zod-validation.pipe.ts`) implementing NestJS `PipeTransform` with automated schema parsing, typed DTO casting, and static `ZodValidationPipe.validate<T>()` programmatic helper.
  - Enhanced `GlobalHttpExceptionFilter` in `@fieldforge/common` to intercept `ZodError` exceptions and map them to HTTP 400 Bad Request with structured `{ message: 'Validation failed', errors: [...] }`, resolving the critical error boundary defect where unhandled schema parsing errors returned HTTP 500.
  - Harmonized `autoRouteSchema` and `AutoRouteDto` in `@fieldforge/contracts` to support optional coordinate overrides (`latitude`, `longitude`, `workOrderId`, `maxRadiusMiles`) with range validation.
  - Refactored controllers across `apps/auth-service` (5 IAM + 3 vetting endpoints), `apps/work-order-service` (8 routes), `apps/billing-service` (2 escrow endpoints), and `apps/dispatch-matching-service` (3 endpoints, including previously unvalidated `POST /dispatch/auto-route`) to use `@Body(new ZodValidationPipe(schema))` and `@Query(new ZodValidationPipe(schema))`.
  - Zero database migrations (`RULE-DB-02`).
- **Cross-Context Database Decoupling & Inter-Service Directory Resolution (Phase 25, Resolves FF-CODE-04 / Code Quality Issue 4).**
  - Purged all foreign schema imports (`usersSchema.buyerProfiles`, `usersSchema.technicianProfiles`, `workOrdersSchema.workOrders`) from `apps/billing-service` and `apps/work-order-service`, establishing complete Domain-Driven Design bounded context isolation (`RULE-ARCH-01`, ADR 006).
  - Implemented `GET /users/:id/profile` on `UsersController` in `auth-service` and `@Injectable()` `ProfileDirectoryService` in `@fieldforge/common` with token-embedded `callerProfileId` fast-path, local test mocks, and 300s TTL in-memory caching.
  - Implemented `WorkOrderDirectoryService` in `billing-service` with 60s TTL caching and local test mocks.
  - Decoupled automated escrow release in `BillingConsumer` to disburse funds using canonical `buyerId` and `technicianId` event payloads.
  - Zero database migrations (`RULE-DB-02`).
- **Work Order Transition Engine Modularization & Strategy Decoupling (Phase 24, Resolves FF-CODE-03 / Code Quality Issue 3).**
  - Decomposed the ~260-line monolithic `WorkOrdersService.transition()` into modular, single-responsibility transition guards (`guardAssignedTransition`, `guardTechnicianLifecycleTransition`, `guardOnSiteTransition`, `guardApprovedTransition`, `guardCancelledTransition`, `guardDisputedTransition`, `guardPaidTransition`) and execution strategies (`executeAssignedTransition`, `executeApprovedTransition`, `executeDefaultTransition`).
  - Extracted reusable profile resolution helpers (`resolveBuyerProfileId`, `resolveTechnicianProfileId`) utilizing caller-provided profile IDs when present to eliminate redundant database queries.
  - Satisfies Single Responsibility Principle (SRP) and Open/Closed Principle (OCP): new statuses and authorization policies can be added to registries without modifying core transaction orchestration.
  - Zero database migrations (`RULE-DB-02`).
- **Work Order Assignment Business Logic Consolidation (Phase 23, Resolves FF-CODE-02 / Code Quality Issue 2).**
  - Centralized triplicate work order assignment and agreed rate resolution logic into `executeWorkOrderAssignment()` and `resolveAgreedRateMinor()` (`work-order-assignment.ts`), unifying `BidsService.acceptBid()`, `WorkOrdersService.transition()`, and `WorkOrdersService.assignTechnicianFromBid()`.
  - Atomically updates work order status, sets `assignedTechnicianId`, logs transition history, and yields canonical `WORK_ORDER_ASSIGNED` event callbacks.
  - Zero database migrations (`RULE-DB-02`).
- **Gateway User Authentication & Trust Boundary Deduplication (Phase 22, Resolves FF-CODE-01 / Code Quality Issue 1).**
  - Centralized gateway Bearer token authentication and C5 trust-boundary anti-spoofing verification into `verifyGatewayUser()` and `GatewayAuthGuard` (`packages/common/src/auth/gateway-auth.ts`).
  - Eliminated ~180 lines of duplicated identity parsing and verification across 6 microservice controllers (`WorkOrdersController`, `BidsController`, `BillingController`, `DispatchController`, `UsersController`, `CertificationsController`).
  - Zero database migrations (`RULE-DB-02`).
- **Repository-Wide Standardization of Technician Identifiers to `technicianId` (Phase 21, Resolves FF-ARCH-14 / Service Audit Issue B).**
  - Standardized all domain event contracts (`WorkOrderAssignedPayload`, `WorkOrderApprovedPayload`, `WorkOrderPaidPayload`, `TechBiddingSubmittedPayload`, `TechBidAcceptedPayload`, `PayoutDisbursedPayload`, `PayoutFailedPayload`) and DTOs (`NearbyTechnicianDto`, `BidDetailsDto`) strictly to define `technicianId: string`.
  - Completely eliminated the shorthand `techId` abbreviation and legacy fallback overhead across all services (`auth`, `billing`, `dispatch`, `notifications`, `work-order`), portal slices (`dispatchSlice`, `workOrderSlice`), and components.
  - Zero database migrations (`RULE-DB-02`) — database schemas already natively used `technicianId` (`technician_id`).

- **Payout Amount Reconciliation & Escrow Remainder Refund (Phase 20, Resolves FF-ARCH-13 / Service Audit Issue A).**
  - Resolved discrepancy where work order approvals disbursed maximum budgeted amount rather than the accepted contractor bid rate.
  - Updated `WorkOrdersService.transition()` and `settlePaid()` to query `workOrderBids` for `ACCEPTED` bids, using the agreed rate for `WORK_ORDER_APPROVED`, `WORK_ORDER_ASSIGNED`, and `WORK_ORDER_PAID`.
  - Updated `EscrowService.releaseFunds()` to accept `amountMinor` (validating `0 < amountMinor <= lockedMinor`), disburse the agreed rate to the technician via `paymentProvider.disbursePayout()`, and automatically refund the unused remainder (`lockedMinor - amountMinor`) to the buyer via `paymentProvider.refundEscrow()`.
  - Added `buyerId?: string` to `PayoutDisbursedPayload` in `@fieldforge/contracts` for contract symmetry with `WorkOrderPaidPayload`.
  - Zero database migrations (`RULE-DB-02`).

- **Elimination of Message Loss Vulnerability & Premature ACK in IdempotentConsumer (Phase 19, Resolves FF-ARCH-12 / Service Audit Item 7).**
  - Replaced Node.js in-memory `setTimeout` with broker-native RabbitMQ delay queues (`<queue>.retry`) using per-message TTL (`expiration`) and dead-letter routing to the default exchange (`''`).
  - Completely eliminated process volatility message loss during backoff: messages remain durably in RabbitMQ if worker pods restart or crash.
  - Delayed `channel.ack(msg)` on worker queue until the broker confirms receipt in the retry queue (zero premature ACKs).
  - Upgraded `RedisIdempotencyClient`: added `markRetrying(eventId, nextRetry)` to preserve lock during wait, and Lua script in `tryAcquire(eventId, retryCount)` allowing legitimate broker retries while blocking fresh duplicate deliveries and completed events.
  - Zero database migrations (`RULE-DB-02`).

- **Elimination of Dormant Intra-Service Circular Loop Event in work-order-service (Phase 18, Resolves FF-ARCH-11 / Service Audit Issue B).**
  - Removed orphaned `tech.bidding.accepted` (`EventType.TECH_BID_ACCEPTED`) AMQP publication from `BidsService.acceptBid()`.
  - Maintained canonical `work_order.lifecycle.assigned` as the sole domain event emitted upon contractor bid acceptance.
  - Deprecated `publishTechBidAccepted()` in `WorkOrderEventPublisher` and retired the routing key in contracts/docs.
  - Zero database migrations (`RULE-DB-02`).

- **Order Settlement Asynchronous Cycle & Failure Compensation (Phase 17, Resolves FF-ARCH-10 / Service Audit Issue A).**
  - Completed cross-service saga failure handling for escrow payout releases between `billing-service` and `work-order-service`.
  - Added `EventType.PAYOUT_FAILED = 'billing.payout.failed'` and `PayoutFailedPayload` to `@fieldforge/contracts`.
  - `BillingConsumer` (`apps/billing-service`) emits `PAYOUT_FAILED` with error context upon escrow disbursement failure before re-throwing for DLQ handling.
  - Allowed compensating transition `APPROVED → COMPLETED` in `WorkOrderFsmService` (`apps/work-order-service`).
  - `WorkOrdersService` updates `settlePaid()` with actual `disbursedAmountMinor` from event payload, and implements `handlePayoutFailed()` to idempotently roll back work order state to `COMPLETED` and record audit log in `work_order_status_history`.
  - `WorkOrderEventsConsumer` subscribes to both `PAYOUT_DISBURSED` and `PAYOUT_FAILED` on `fieldforge.work-orders.lifecycle-events`.
  - Zero database migrations (`RULE-DB-02`).

- **No-Op Consumer Subscription Elimination in billing-service (Phase 16, Resolves FF-ARCH-09 / Service Audit Issue B).**
  - Updated `BillingConsumer` in `apps/billing-service` to strictly subscribe to `[EventType.WORK_ORDER_APPROVED]` on queue `fieldforge.billing.work-orders`.
  - Eliminated redundant delivery and processing of `work_order.lifecycle.assigned` (`EventType.WORK_ORDER_ASSIGNED`) in `billing-service`.
  - Avoided unnecessary 7-day Redis `SETNX` idempotency locking and JSON deserialization on job assignments (escrow funds are pre-authorized at work order creation via `POST /billing/escrow/preauth`, and released upon `work_order.lifecycle.approved`).
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
