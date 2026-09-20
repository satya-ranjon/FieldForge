# FieldForge — Issues & Findings Report

> Companion to [`ARCHITECTURE.md`](./ARCHITECTURE.md). Generated from a full read of the repository plus five focused subsystem audits.
> Scope: correctness bugs, architecture/rule violations, spec/doc drift, and security.

> **Foundation update — 2026-09-01:** The current tree now removes and ignores
> the live-named Kubernetes secret manifest, requires local Compose credentials,
> adds real formatting/lint/type gates, fixes local port collisions, supplies the
> missing Prometheus config, and replaces the broken deployment workflow with a
> Kustomize scaffold check. Findings below retain their original IDs; resolved or
> partially remediated items are marked in place.

> **Phase 0 update — 2026-09-01:** Phase 0 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> established one FSM canon, one money representation, one event envelope, and a
> test harness that can fail. Closed: **M1, M3, M4, M5, M11**, and the empty-suite
> half of **H7**. Advanced: **M7** (envelope field exists; AMQP propagation is
> Phase 3). Everything else below is untouched and still open — in particular the
> four Critical findings, which Phases 1–4 address.
> A parallel setup audit on the same date contributed **M13, M14, L9, L10, L11**
> and the measured Dockerfile numbers under L3; each was re-verified against the
> tree before being recorded here.

> **Trust-boundary audit — 2026-09-03:** A re-read of the Phase 1 auth code found
> two ways to defeat the boundary that C2 and H2 were recorded as having
> established. Both are now closed: the hardcoded signing-key fallback that made
> the committed default the key actually in use (folded into **C1**), and
> `/users/me` preferring an unauthenticated header over the token, together with
> the gateway forwarding that header unfiltered (new **C5**). The finding matters
> because C2 and H2 read as "resolved" while the boundary they describe was
> bypassable; their entries below now carry the correction.

> **Phase 2 update — 2026-09-04:** Phase 2 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered a persistent, transactional work-order lifecycle in `apps/work-order-service`.
> Closed: **H4** (work-order FSM reads and validates actual state in DB with `SELECT … FOR UPDATE` row locks),
> **H5** (Haversine moved to `packages/common/src/geo/haversine.ts`, 200m tolerance strictly enforced server-side),
> and **L5** (deliverable signature hashes only stable content, timestamp in own column).
> Advanced: **C4** (work-order lifecycle transactions and row locking implemented; escrow transactions land in Phase 4)
> and **M8** (`SlaEscalationService.checkSlaBreachRisk` inverted check fixed for already-breached orders,
> `@nestjs/schedule` sweep registered; 72-h auto-approval lands in Phase 4). Total verified tests: 306.

> **Phase 3 update — 2026-09-05:** Phase 3 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered the production event backbone across RabbitMQ and Redis in `packages/messaging`.
> Closed: **H1** (entire event pipeline is now wired with confirmed topic publishes and consumers across work-order, dispatch, notification, and billing services),
> **M6** (7-day atomic Redis deduplication via `SETNX`, dead-letter exchange/queue `fieldforge.events.dlx`, and bounded 3-retry exponential backoff),
> and **M7** (`x-correlation-id` and envelope metadata fully propagated over AMQP message headers and restored into consumer Pino log contexts). Total verified tests: 359.

> **Phase 4 update — 2026-09-05:** Phase 4 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Dispatch, Bidding, and Money safety in `apps/dispatch-matching-service` and `apps/billing-service`.
> Closed: **C3** (escrow release rewritten as a concurrency-safe single transaction locking escrow and work order `FOR UPDATE`, enforcing state, caller authority, idempotency, and emitting `billing.payout.disbursed`),
> **C4** (completed: all money and state transitions in both work-order and billing services use Drizzle `db.transaction()` with pessimistic `FOR UPDATE` row locks),
> and **M8** (completed: 72-hour buyer review SLA auto-approval worker implemented in `SlaAutoApprovalService` with automated escrow release). Total verified tests: 376.

> **Section 13 Quality Audit Fixes — 2026-09-05:** Branch `fix/bugs-and-issues` resolved all 9 defects identified in Section 13 (Bugs & Issues):
>
> - **FF-BUG-01**: Mobile offline sync durable mutation queue with idempotency keys, dispatcher, and retry mechanism (`apps/mobile-tech-app`).
> - **FF-BUG-02**: Production Kubernetes manifests with Service resources, `/healthz` & `/readyz` probes, CPU/memory limits, securityContext, and notification-service (`infra/k8s`).
> - **FF-BUG-03**: Web buyer portal RTK Query API client configured with `x-correlation-id` and Bearer token auth injection (`apps/web-buyer-portal`).
> - **FF-BUG-04**: Database migration `0005_chubby_iron_lad.sql` adding `UNIQUE` constraint `uq_invoice_work_order` on `invoices.work_order_id` (`packages/database`).
> - **FF-BUG-05**: Dynamic `/readyz` readiness probes reporting process memory/uptime and Prometheus scrape configurations for ports 8000–8005 (`packages/common`, `infra/docker`).
> - **FF-BUG-06**: Billing SLA auto-approval recovery resetting work orders to `COMPLETED` when escrow release fails (`apps/billing-service`).
> - **FF-BUG-07**: Replacement of unstructured `console.log`/`warn` with structured Pino loggers (`apps/billing-service`, `apps/dispatch-matching-service`).
> - **FF-BUG-08**: Declared `react: ">=18.0.0"` peer dependency in `@fieldforge/ui` (`packages/ui`).
> - **FF-BUG-09**: Graceful Redis disconnection on module destruction, eliminating Jest open handle warnings in `@fieldforge/messaging` integration tests.
> - **FF-BUG-10**: GitHub Actions CI workflow backing service provisioning (Redis & RabbitMQ) for integration tests (`.github/workflows/ci-pipeline.yml`).

> **Phase 8 update — 2026-09-07:** Phase 8 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Technician Compliance, Vetting Badges & Onboarding Verification.
> Resolved unmounted catalog endpoint `GET /technicians/:id/badges` from `.agent/context/api_contracts.md`,
> implemented phone OTP onboarding verification (FR-AUTH-001) in `apps/auth-service`, and added
> verified compliance badge tracking (FR-AUTH-003) across contracts, seeds, controllers, buyer portal,
> and mobile technician app. Total verified tests: 430 unit/integration + 28 E2E = 458 tests.

> **Phase 9 update — 2026-09-07:** Phase 9 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Work Order Aggregate Boundary Reconciliation & Event-Driven Settlement (Resolves **FF-ARCH-01 / Finding 1**).
> Decoupled `billing-service` and `dispatch-matching-service` from directly mutating `work_orders` and `work_order_status_history`.
> Introduced `tech.bidding.accepted` event and unified lifecycle transitions within `apps/work-order-service`
> via `WorkOrderEventsConsumer` and `WorkOrderFsmService`. Documented under ADR 005.
> Total verified tests: 435 unit/integration + 28 E2E = 463 tests.

> **Phase 10 update — 2026-09-07:** Phase 10 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Bounded Context Data Isolation & Token-Enriched Profile Identity (Resolves **FF-ARCH-02 / Finding 2**).
> Eliminated cross-service database table joins and direct identity table lookups across `work-order-service`,
> `dispatch-matching-service`, and `billing-service`. Introduced `profileId` into `AuthJwtPayload` and gateway header
> assertions (`x-ff-profile-id`), removed synthetic buyer profile auto-creation (`Default Buyer Co`) in `work-orders.service.ts`,
> and established inter-service directory lookup `POST /technicians/batch` with `TechnicianDirectoryService`. Documented under ADR 006.

> **Phase 11 update — 2026-09-07:** Phase 11 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Marketplace Bidding Relocation & Work Order Aggregate Cohesion (Resolves **FF-ARCH-03 / Finding 3**).
> Relocated commercial contractor bidding domain (`work_order_bids`, counter-notes, pricing negotiation, buyer acceptance)
> from `apps/dispatch-matching-service` into `apps/work-order-service`. Established atomic single-transaction bid acceptance
> executing winning bid selection, sibling bid rejection, and FSM transition (`PUBLISHED → ASSIGNED`) with status history
> and domain events. Purified `apps/dispatch-matching-service` to strictly provide geospatial matching (Redis `GEOSEARCH`),
> live GPS coordinates, and routing recommendation. Configured API Gateway path rewriting for 100% backward compatibility.
> Documented under ADR 007. Total verified tests: 451 unit/integration + 28 E2E = 479 tests.

> **Phase 12 update — 2026-09-07:** Phase 12 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered IAM, Domain Profiles, and Contractor Vetting Separation (Resolves **FF-ARCH-04 / Finding 4**).
> Restructured `apps/auth-service` into three encapsulated NestJS domain modules (`IamModule`, `ProfilesModule`,
> `ContractorVettingModule`). Inverted dependencies so `AuthService` delegates profile provisioning and profile ID
> resolution to `ProfilesService` via optional DI rather than executing direct SQL queries on profile tables.
> Grouped database schema exports in `@fieldforge/database` into `iamSchema`, `profileSchema`, and `vettingSchema`.
> Preserved the 6-microservice platform topology with zero database schema migrations (`RULE-DB-02`).
> Documented under ADR 008. Total verified tests: 470 unit/integration + 28 E2E = 498 tests.

> **Phase 13 update — 2026-09-07:** Phase 13 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Event-Driven Order Settlement Choreography and SLA Review Relocation (Resolves **FF-ARCH-05 / Finding 5**).
> Relocated `SlaAutoApprovalService` (72-hour buyer review timeout SLA) from `apps/billing-service` to `apps/work-order-service`,
> eliminating direct cross-service SQL mutations and table rollback queries on `work_orders`. Auto-approval now executes
> via `WorkOrdersService.transition()` with `role = 'SYSTEM'`, recording audit history and emitting canonical
> `work_order.lifecycle.approved` events to trigger billing escrow release. Strictly rejected manual transitions to `PAID` via
> `POST /work-orders/:id/transition`, ensuring `PAID` is exclusively reached via `settlePaid()` upon consuming `billing.payout.disbursed`.
> Subscribed `NotificationConsumer` in `apps/notification-service` to `work_order.lifecycle.paid` (`EventType.WORK_ORDER_PAID`),
> dispatching push and SMS payout receipts to technicians upon completion. Zero schema migrations (`RULE-DB-02`).
> Documented under ADR 009. Total verified tests: 474 unit/integration + 28 E2E = 502 tests.

> **Phase 14 update — 2026-09-07:** Phase 14 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Headless Notification Worker Boundary & Gateway Route Decoupling (Resolves **FF-ARCH-06 / Finding 6**).
> Decoupled `apps/notification-service` from edge proxy routing by removing `notifications` from `gatewayConfig.services`
> and `ProxyController` in `apps/api-gateway`. External calls to `/api/v1/notifications/*` now fail fast with 404 at the edge
> without opening unnecessary network connections to upstream services. Retained internal `HealthController` (`/healthz`, `/readyz`)
> and Prometheus metrics scraping (`/metrics`) on port 8005 for Kubernetes and APM observability.
> Documented under ADR 010. Total verified tests: 476 unit/integration + 28 E2E = 504 tests.

> **Phase 15 update — 2026-09-08:** Phase 15 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Multi-Tier Caching & Correlation Tracking for Technician Directory Geo-Search (Resolves **FF-ARCH-08 / Service Audit Issue A**).
> Implemented two-tier caching (Redis with 300s TTL + in-memory fallback) in `TechnicianDirectoryService` (`apps/dispatch-matching-service`),
> optimized partial batch cache hits to fetch strictly uncached technician IDs over HTTP `POST /technicians/batch`,
> corrected the fallback auth-service URL from port 3001 to 8001, propagated `x-correlation-id` across geo-search/auto-routing calls,
> and added 12 unit tests. Total verified tests: 488 unit/integration + 28 E2E = 516 tests.

> **Phase 16 update — 2026-09-08:** Phase 16 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered No-Op AMQP Consumer Subscription Elimination in `billing-service` (Resolves **FF-ARCH-09 / Service Audit Issue B**).
> Refined `BillingConsumer` (`apps/billing-service`) to strictly subscribe to `[EventType.WORK_ORDER_APPROVED]` on
> `fieldforge.billing.work-orders`, eliminating no-op consumption of `WORK_ORDER_ASSIGNED`, redundant AMQP queue traffic,
> and unnecessary Redis 7-day `SETNX` idempotency locking. Updated `docs/MESSAGE_FLOW.md` routing tables and diagrams.
> Total verified tests: 488 unit/integration + 28 E2E = 516 tests.

> **Phase 17 update — 2026-09-08:** Phase 17 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Order Settlement Asynchronous Cycle & Failure Compensation (Resolves **FF-ARCH-10 / Service Audit Issue A**).
> Defined `EventType.PAYOUT_FAILED` (`billing.payout.failed`) and `PayoutFailedPayload` in `@fieldforge/contracts`.
> Updated `BillingConsumer` (`apps/billing-service`) to emit `PAYOUT_FAILED` with error reason and correlation context
> upon escrow release failure. Updated `WorkOrderFsmService` (`apps/work-order-service`) to allow compensating rollback
> `APPROVED → COMPLETED`. Implemented `handlePayoutFailed()` in `WorkOrdersService` to roll back to `COMPLETED` and record
> failure reason in `work_order_status_history`. Passed `disbursedAmountMinor` into `settlePaid()` for accurate notification
> payloads. Subscribed `WorkOrderEventsConsumer` to `[EventType.PAYOUT_DISBURSED, EventType.PAYOUT_FAILED]`.
> Total verified tests: 493 unit/integration + 28 E2E = 521 tests.

> **Phase 18 update — 2026-09-08:** Phase 18 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Elimination of Dormant Intra-Service Circular Loop Event in `work-order-service` (Resolves **FF-ARCH-11 / Service Audit Issue B**).
> Removed the orphaned `tech.bidding.accepted` (`EventType.TECH_BID_ACCEPTED`) AMQP publication from `BidsService.acceptBid()`,
> leaving canonical `work_order.lifecycle.assigned` as the sole domain event emitted upon contractor bid acceptance.
> Deprecated `publishTechBidAccepted()` in `WorkOrderEventPublisher`, updated unit test assertions, and retired the routing key.
> Total verified tests: 493 unit/integration + 28 E2E = 521 tests.

> **Phase 19 update — 2026-09-08:** Phase 19 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Elimination of Message Loss Vulnerability & Premature ACK in `IdempotentConsumer` (Resolves **FF-ARCH-12 / Service Audit Item 7**).
> Replaced in-memory Node.js `setTimeout` with broker-native RabbitMQ dead-letter retry queues (`<queue>.retry`)
> using per-message TTL (`expiration`) and dead-letter routing to the default exchange (`''`).
> Upgraded `RedisIdempotencyClient` with atomic state-aware transitions (`markRetrying` and Lua-evaluated `tryAcquire(eventId, retryCount)`),
> eliminating premature ACKs, in-memory process volatility, and parallel duplicate delivery race conditions.
> Total verified tests: 497 unit/integration + 28 E2E = 525 tests.

> **Phase 20 update — 2026-09-08:** Phase 20 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Reconciliation of Payout Amount Disconnect Between Billing and Work Orders (Resolves **FF-ARCH-13 / Service Audit Issue A**).
> Reconciled contract asymmetry by adding `buyerId?: string` to `PayoutDisbursedPayload`.
> Updated `WorkOrdersService.transition()` to query `workOrderBids` for `ACCEPTED` contractor bids and set `payoutAmountMinor`
> in `WORK_ORDER_APPROVED` and `agreedRateMinor` in `WORK_ORDER_ASSIGNED` to the actual agreed bid rate rather than defaulting
> to the budget ceiling. Updated `settlePaid()` to query accepted bids when `disbursedAmountMinor` is omitted.
> Upgraded `EscrowService.releaseFunds()` (`apps/billing-service`) to accept and honor `amountMinor`, validate limits,
> disburse the exact agreed amount to the technician, and automatically refund the unused escrow remainder to the buyer via
> `paymentProvider.refundEscrow()`. Total verified tests: 501 unit/integration + 28 E2E = 529 tests.

> **Phase 21 update — 2026-09-08:** Phase 21 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Repository-Wide Standardization of Technician Identifiers to `technicianId` (Resolves **FF-ARCH-14 / Service Audit Issue B**).
> Standardized all domain event contracts (`WorkOrderAssignedPayload`, `WorkOrderApprovedPayload`, `WorkOrderPaidPayload`,
> `TechBiddingSubmittedPayload`, `TechBidAcceptedPayload`, `PayoutDisbursedPayload`, `PayoutFailedPayload`), DTOs (`NearbyTechnicianDto`),
> services (`auth`, `billing`, `dispatch`, `notifications`, `work-order`), and frontend slices (`dispatchSlice`, `workOrderSlice`)
> strictly on `technicianId: string`, eliminating the informal `techId` abbreviation across the entire repository.
> Completely eliminated legacy fallback overhead. Total verified tests: 501 unit/integration + 28 E2E = 529 tests.

> **Phase 22 update — 2026-09-09:** Phase 22 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Gateway User Authentication & Trust Boundary Deduplication (Resolves **FF-CODE-01 / Code Quality Issue 1**).
> Centralized gateway Bearer token authentication and C5 trust-boundary verification into `packages/common/src/auth/gateway-auth.ts`,
> eliminating ~180 lines of duplicate authentication boilerplate across 6 backend microservice controllers.
> Total verified tests: 514 unit/integration + 28 E2E = 542 tests.

> **Phase 23 update — 2026-09-09:** Phase 23 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Work Order Assignment Business Logic Consolidation (Resolves **FF-CODE-02 / Code Quality Issue 2**).
> Centralized triplicate work order assignment and agreed rate resolution logic into `executeWorkOrderAssignment()`
> in `apps/work-order-service`, unifying `BidsService.acceptBid()`, `WorkOrdersService.transition()`, and `WorkOrdersService.assignTechnicianFromBid()`.
> Total verified tests: 520 unit/integration + 28 E2E = 548 tests.

> **Phase 24 update — 2026-09-09:** Phase 24 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Work Order Transition Engine Modularization & Strategy Decoupling (Resolves **FF-CODE-03 / Code Quality Issue 3**).
> Decomposed the ~260-line monolithic `transition()` method in `apps/work-order-service` into modular transition guards
> and execution strategies (`work-order-transition.ts`), satisfying SRP and OCP while eliminating duplicated profile identity queries.
> Total verified tests: 544 unit/integration + 28 E2E = 572 tests.

> **Phase 25 update — 2026-09-09:** Phase 25 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Cross-Context Database Decoupling & Inter-Service Directory Resolution (Resolves **FF-CODE-04 / Code Quality Issue 4**).
> Eliminated direct foreign schema imports (`usersSchema.buyerProfiles`, `usersSchema.technicianProfiles`, and `workOrdersSchema.workOrders`)
> from `apps/billing-service` and `apps/work-order-service`, enforcing bounded context isolation (`RULE-ARCH-01`, ADR 006).
> Implemented `GET /users/:id/profile` in `auth-service`, added `@Injectable()` `ProfileDirectoryService` in `@fieldforge/common` with
> token-embedded `callerProfileId` fast-path and TTL caching, added `WorkOrderDirectoryService` in `billing-service` with TTL caching,
> and decoupled automated escrow payout release to consume canonical `buyerId` and `technicianId` event payloads.
> Zero database migrations (`RULE-DB-02`). Total verified tests: 556 unit/integration + 28 E2E = 584 tests.

> **Phase 26 update — 2026-09-09:** Phase 26 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Identifier Semantics Harmonization Across Schemas (technicianId vs userId) (Resolves **FF-CODE-05 / Code Quality Issue 5**).
> Aligned `technician_certifications.technician_id` foreign key with `technicianProfiles.id` via migration `0006_green_wild_pack.sql`,
> updated database seeds, harmonized vetting controller and service badge lookup methods, and ensured Redis spatial indexing
> in `dispatch-matching-service` strictly targets `technicianProfiles.id`. Total verified tests: 562 unit/integration + 28 E2E = 590 tests.

> **Phase 27 update — 2026-09-09:** Phase 27 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Standardized Request Body Validation Across Microservices (Resolves **FF-CODE-06 / Code Quality Issue 6**).
> Implemented `@Injectable()` `ZodValidationPipe` in `@fieldforge/common`, hardened `GlobalHttpExceptionFilter` to intercept `ZodError`
> and map to HTTP 400 Bad Request instead of HTTP 500, refactored controllers across all microservices to use declarative pipe validation,
> and harmonized `autoRouteSchema`. Total verified tests: 598 unit/integration + 28 E2E = 626 tests.

> **Phase 28 update — 2026-09-09:** Phase 28 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Decouple Low-Level PDF Drawing from Billing Domain Service (Resolves **FF-CODE-07 / Code Quality Issue 7**).
> Created `InvoicePdfRendererPort` and `PdfKitInvoicePdfRenderer` adapter in `apps/billing-service` using the Hexagonal Architecture pattern,
> removing imperative PDFKit coordinate drawing and fonts from `InvoicesService` while preserving document structure and SHA-256 digital
> signature verification. Zero database migrations (`RULE-DB-02`). Total verified tests: 603 unit/integration + 28 E2E = 631 tests.

> **Phase 29 update — 2026-09-09:** Phase 29 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Decouple Dispatch Candidate Scoring from Redis Spatial Search Service (Resolves **FF-CODE-08 / Code Quality Issue 8**).
> Extracted multi-parameter contractor scoring algorithm and ranking logic into `@Injectable() CandidateScoringService`
> implementing `CandidateScorerPort` (`CANDIDATE_SCORER`), removing hardcoded scoring math and weighting constants from
> `GeoSearchService` while preserving 100% backward-compatible default fallback. Zero database migrations (`RULE-DB-02`).
> Total verified tests: 628 unit/integration + 28 E2E = 656 tests.

> **Phase 30 update — 2026-09-09:** Phase 30 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Canonical Drizzle Transaction Typing Across Microservices (Resolves **FF-CODE-09 / Code Quality Issue 9**).
> Centralized canonical Drizzle transaction types in `@fieldforge/database` and `@fieldforge/common`, eliminating untyped
> `tx: unknown` parameters across services and test doubles. Zero database migrations (`RULE-DB-02`).
> Total verified tests: 628 unit/integration + 28 E2E = 656 tests.

> **Phase 31 update — 2026-09-12:** Phase 31 of [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
> delivered Centralized Profile ID Resolution Across Services (Resolves **FF-CODE-10 / Code Quality Issue 10**).
> Unified ad-hoc profile resolution queries across `work-order-service`, `billing-service`, `auth-service`, and
> `dispatch-matching-service` into standardized `ProfileDirectoryService.resolveProfileId()` / `resolveProfileIdOrThrow()`
> in `@fieldforge/common` and `ProfilesService.resolveProfileId()` / `resolveUserIdByProfileId()` in `apps/auth-service`,
> eliminating repetitive boilerplate checks and direct cross-service table querying. Zero database migrations (`RULE-DB-02`).
> Total verified tests: 640 unit/integration + 28 E2E = 668 tests.

> **Remediation update — 2026-09-13:** Architecture Remediation Workflow
> delivered the Work Order Cancellation Escrow Refund Path (Resolves **ISSUE-001** and **FINDING-ISSUE-001-A**).
> Eliminated trapped escrow funds in `HELD` status upon work order cancellation.
> Implemented `EventType.WORK_ORDER_CANCELLED` and `WorkOrderCancelledPayload` in `@fieldforge/contracts`,
> emitted canonical cancellation events upon FSM transition in `work-order-service`, subscribed
> `BillingConsumer` in `apps/billing-service` to route cancellations, and implemented `EscrowService.refundEscrow()`
> with row-level locking (`SELECT ... FOR UPDATE`), multi-layer idempotency (Redis + DB `idempotency_keys`),
> safe no-ops for nonexistent or already-refunded escrows, protections against refunding released funds, and
> mandatory provider-level refund idempotency keys with parameter verification (`FINDING-ISSUE-001-A`).
> Zero database migrations (`RULE-DB-02`). Total verified tests: 671 unit/integration + 28 E2E = 699 tests.

> **Remediation update — 2026-09-13:** Financial Reliability Remediation
> delivered Provider-Level Financial Idempotency for Escrow Pre-Authorization and Technician Payout (Resolves **FINDING-PAY-001** and **FINDING-PAY-002**).
> Eliminated double-capture and double-disbursement risks in payment provider integration.
> Extended `PaymentProviderPort.captureEscrow` and `PaymentProviderPort.disbursePayout` with mandatory `idempotencyKey: string;`.
> Implemented provider-level idempotency caching with parameter mismatch validation throwing `ConflictException` in `LedgerPaymentProvider`.
> Added database-backed idempotency tracking (`ESCROW_CAPTURE`) to `EscrowService.lockFunds()`, extracted `idempotency-key` header in `BillingController.preAuthEscrow()`,
> and derived deterministic operation-scoped provider keys (`escrow-capture:`, `escrow-payout:`, `escrow-remainder-refund:`, `escrow-refund:`).
> Zero database migrations (`RULE-DB-02`). Total verified tests: 686 unit/integration + 28 E2E = 714 tests.

> **Remediation update — 2026-09-13:** Microservice Reliability Remediation
> delivered the Transactional Outbox Pattern across `work-order-service` and `billing-service` (Resolves **ISSUE-005**).
> Eliminated dual-write failure modes (ghost events published on DB rollback, lost events on network failure post-commit)
> across all core domain event publishers (`WORK_ORDER_PUBLISHED`, `WORK_ORDER_ASSIGNED`, `WORK_ORDER_APPROVED`,
> `WORK_ORDER_PAID`, `WORK_ORDER_CANCELLED`, `TECH_BIDDING_SUBMITTED`, `TECH_BID_ACCEPTED`, `ESCROW_FUNDED`, `PAYOUT_DISBURSED`).
> Introduced service-owned outbox tables `work_order_outbox_events` and `billing_outbox_events` (`0007_blue_malice.sql`)
> with auto-increment IDs for strict monotonic per-aggregate FIFO ordering, crash recovery via 30s leases, CAS claim token fencing,
> bounded concurrency (batch limit 5, publish concurrency 5, 10s timeout with handle cleanup), and poison event dead-lettering (`FAILED`).
> Integrated background polling + single-flight post-commit event loop triggers. Total verified tests: 706 unit/integration + 28 E2E = 734 tests.

> **Remediation update — 2026-09-13:** Microservice Internal Authentication Remediation
> resolved inter-service authentication failures between `billing-service` and `work-order-service` (Resolves **ISSUE-002**).
> Eliminated 401 Unauthorized errors during manual buyer escrow release by replacing public endpoint calls with authenticated
> internal requests. Introduced narrow `WorkOrderBillingContextDto` (`@fieldforge/contracts`), reusable `InternalServiceGuard`
> with constant-time secret comparison and service-name authorization (`@fieldforge/common`), mounted `InternalWorkOrdersController`
> (`GET /internal/work-orders/:id/billing-context`), refactored `WorkOrderDirectoryService` with accurate error semantics (404 -> null;
> 401/403 -> InternalServerErrorException; 5xx/network -> ServiceUnavailableException), and decoupled HTTP directory lookups from
> database transactions in `EscrowService` to prevent holding InnoDB row locks across network boundaries. Enforced API gateway
> anti-spoofing stripping internal credentials and blocking `/internal/*`. Total verified tests: 736 unit/integration + 28 E2E = 764 tests.

> **Remediation update — 2026-09-15:** Service Boundary Hardening
> secured the batch technician directory endpoint against unauthenticated external exposure (Resolves **ISSUE-007**).
> Protected `POST /technicians/batch` with `InternalServiceGuard(['dispatch-matching-service'])` asserting
> `x-fieldforge-service-name` and `x-fieldforge-internal-secret`. Removed `/api/v1/technicians/batch` from gateway
> `PUBLIC_PREFIXES`, bounded request batch schema to 1..100 IDs (`@fieldforge/contracts`), implemented batch chunking
> in `TechnicianDirectoryService` (`apps/dispatch-matching-service`), and preserved zero direct SQL fallback from dispatch.
> Zero database migrations (`RULE-DB-02`). Total verified tests: 811 unit/integration + 48 E2E = 859 tests.

> **Design System update — 2026-09-20:** Brand Visual System Redesign & Dual-Surface Architecture.
> Successfully aligned the entire platform (marketing site, enterprise command center, mobile tech app, and auth modal)
> with the approved design system specifications (`DESIGN.md v3.0.0`) and reference layouts (`1442.png` and `01 Refined navbar and product hero.png`).
> Established dual-surface styling: mint-tinted light canvas (`#f5fbf5`) for marketing trust and slate-forest dark canvas (`#0d1517` / `#142427`)
> for command center operations, unified with radiant spring-lime `#84e539` and high-contrast CTA button `#92ec3d` (`#0f1a1c` text).
> Rebuilt `@fieldforge/ui` component primitives, deployed Next.js App Router public marketing routes (`/marketing`, `/platform`, `/solutions`, `/industries`, `/resources`, `/pricing`),
> and configured Next.js `--webpack` production builds for robust static prerendering.
> Total verified tests: 872 unit/integration + 48 E2E = 920 tests.

---

## How to read this report

FieldForge is best understood as an **early scaffold with a very mature specification**. The `.agent/` guardrails, ADRs, README, and contracts describe a production-grade platform; the _code_ implements health checks, type definitions, a DB schema, and a scattering of `console.log` stubs. Most of the declared integration libraries (`ioredis`, `amqplib`, `@nestjs/jwt`, `bcrypt`, `twilio`, `firebase-admin`, `express-http-proxy`, `stripe`, `pdfkit`, `expo-location`) are **listed in `package.json` but never imported**.

Because of that, findings fall into four kinds — tagged on each item:

- **🐛 BUG** — implemented code that is wrong / will misbehave when run.
- **🏛️ ARCH** — violates a stated rule (`.cursorrules` / `.agent/rules`) or ADR.
- **📄 SPEC** — code contradicts the docs/specs, or the docs contradict each other.
- **🔒 SEC** — security exposure.

Severity reflects impact _if this project is taken toward the production system its docs describe_. A "not implemented" gap is only called out where the spec/PR-template claims it **is** done, or where it's load-bearing for a security guarantee.

**Severity counts:** Critical 5 · High 9 · Medium 14 · Low 13

---

## 🔴 Critical

### C1 · 🔒 Real secrets committed to the repository

**Status: partially remediated in the current tree.** The tracked live-secret
filename was removed, an ignored/example flow was added, and local services now
require authenticated credentials from `.env`. Repository history still contains
the old values, so rotation and history remediation remain external follow-up.

**Update 2026-09-03 — the signing key specifically is now closed at runtime.**
Removing the manifest was not enough on its own: both halves of the trust
boundary still carried `process.env.JWT_SECRET || 'super_secret_jwt_key_fieldforge_2026'`
in source, and `JWT_SECRET` is blank in `.env.example`. A default developer
therefore ran with the committed literal as the live signing key — the manifest
had been deleted, but the value it held was still the one in force, so C1's
impact statement held in full. Both services now resolve the key through
`requireJwtSecret()` (`packages/common/src/config/jwt-secret.ts`), which has no
fallback and refuses an absent, too-short (< 32 bytes, RFC 7518 §3.2), or
known-published value. A misconfigured service exits at startup instead of
silently adopting a public key. `scripts/setup-dev.sh` generates a unique local
key so the stricter check does not simply block new developers. The remaining
C1 work — rotating the MySQL/RabbitMQ/Grafana credentials and purging history —
is unchanged. The fallback-literal and fail-closed rules are now written into
**NFR-SEC-003** and **NFR-SEC-004** in `docs/SRS.md` 1.1.0; SRS 1.0.0 prohibited
"hardcoded credentials" without saying that a `||` fallback is one.

`infra/k8s/base/secrets.yaml` is tracked in git and contains live-looking secrets in plaintext:

- `JWT_SECRET: "super_secret_jwt_key_fieldforge"`
- MySQL root password, and the same secret material echoed in `configmap.yaml` / compose.

The Docker stack repeats the pattern: MySQL `root/fieldforge_secret`, RabbitMQ `guest/guest`, Grafana `admin/admin`, Redis with **no auth at all**.

**Impact:** anyone with repo access can forge JWTs for any user/role once auth is wired. A committed signing key cannot be "rotated" out of git history cheaply.
**Fix:** remove `secrets.yaml` from git (`git rm --cached`, add to `.gitignore`), rotate every value, move to a sealed-secrets / external-secrets / SSM flow, and inject via `envFrom` (see H8). Set a strong Redis password and non-guest RabbitMQ creds.

### C2 · 🔒/🐛 API Gateway performs no authentication

**Status: resolved (Phase 1).** `JwtAuthGuard` is registered globally as `APP_GUARD` on the API Gateway, verifying HS256 JWTs and populating `request.user` with authenticated identity (`userId`, `email`, `role`). Public endpoints (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, health probes, and routes annotated with `@Public()`) are explicitly permitted without a token, and `RolesGuard` is registered globally to enforce role-based access control against `@Roles()` decorators.

**Caveat 2026-09-03:** the guard is real, but until C1's key handling and C5 were
fixed it could be walked around rather than broken — by forging a token with the
committed default key, or by skipping the gateway entirely and setting the
identity header on a direct call. Verifying a signature only bounds access if
the key is secret and the verification is the only way in.

The gateway is the only intended trust boundary, but `JwtAuthGuard.canActivate()` unconditionally `return true`, the guard is **not registered** (no `APP_GUARD`), and `@nestjs/jwt`/`passport` are never used. There is also no `RolesGuard` anywhere in the repo, so the `@Roles()` decorator from `@fieldforge/common` decorates nothing.

**Impact:** every downstream route is effectively public; RBAC is cosmetic.
**Fix:** implement real JWT verification (shared secret/JWKS), register it as a global guard with a `@Public()` opt-out for health, and add a `RolesGuard` that reads `@Roles()` metadata.

### C3 · 🐛/🔒 Escrow release has no correctness or safety checks

**Status: resolved (Phase 4, 2026-09-05).** In `apps/billing-service`, `EscrowService.releaseFunds()`
was completely rewritten as a concurrency-safe single transaction via `db.transaction()` that:

1. Enforces idempotency via the `idempotency_keys` table (returns cached result on replay, rejects concurrent in-flight requests);
2. Locks the escrow row `WHERE work_order_id = ? FOR UPDATE` and asserts `status === 'HELD'`;
3. Locks the work order row `FOR UPDATE` and asserts `status === 'APPROVED'`;
4. Verifies caller authorization (only the buyer who owns the work order or an administrator may release escrow);
5. Updates escrow to `RELEASED` with timestamp;
6. Transitions work order to `PAID` and logs `work_order_status_history`;
7. Dispatches payout via `PaymentProviderPort` and logs credit into `payout_ledger`;
8. Generates an immutable content-hashed invoice via `InvoicesService` (FR-BILL-003);
9. Publishes confirmed `billing.payout.disbursed` topic event.
   Every unsafe release path (unapproved, already released, unauthorized caller, missing technician) is verified and rejected by automated tests in `test/escrow.service.spec.ts`.

`billing-service` `releaseFunds()` (escrow module) transfers money with **no** verification that: the work order is `APPROVED`, the escrow is in `HELD` state, the amount matches, or the caller is authorized. It does not persist a state change, is not idempotent, and runs in no transaction.

**Impact:** double-release / release-without-approval / wrong-amount payouts — the most damaging class of bug for a marketplace holding client funds.
**Fix:** load escrow `FOR UPDATE` inside `db.transaction()`, assert `status === HELD` and a matching approved work order, write `RELEASED` + `released_at`, and dedupe on an idempotency key before emitting `billing.payout.disbursed`.

### C4 · 🏛️ Core money/state flows bypass the mandated transaction rule

**Status: resolved (Phase 4, 2026-09-05).** All state and financial transitions across
both `apps/work-order-service` and `apps/billing-service` (and bidding acceptance in
`apps/dispatch-matching-service`) now execute within Drizzle ORM transactions with
pessimistic row-level locks (`SELECT … FOR UPDATE`) via `db.transaction()`, fully complying
with `RULE-DB-02` and backed by comprehensive race condition and unit test suites.

`RULE-DB-02` requires `db.transaction()` + `SELECT … FOR UPDATE` for any multi-table state change. Previously, no service opened a DB connection or a transaction at all — work-order publish/assign/approve and escrow lock/release mutated in-memory objects.

**Impact:** once persistence is added naively, concurrent assign/bid/release will race (lost updates, double-assignment, double-spend).
**Fix:** thread a Drizzle client through the services and wrap every lifecycle/escrow mutation in a transaction with row locks, per the rule.

### C5 · 🔒 `/users/me` trusted a client-settable header over the JWT

**Status: resolved (2026-09-03).** Found while re-reading the Phase 1 code that
closed C2.

`UsersController.getProfile()` read `x-ff-user-id` first and only fell back to
verifying the bearer token when that header was absent. The header is written by
the gateway after it verifies a token (H2), which makes it trustworthy _on that
path_ — but `auth-service` listens on `0.0.0.0` with no NetworkPolicy, mesh, or
mTLS in front of it, so it is not the only path. Anyone who could open a socket
to the service port could send `x-ff-user-id: <guessed uuid>` with no
`Authorization` header at all and read that user's profile.

Two things had to be true for that to work, and both were:

- **auth-service** preferred the header over the token, so no signature was ever
  checked on a header-only request.
- **api-gateway** never stripped the header. `express-http-proxy` copies inbound
  headers onto the proxied request by default, and `proxyReqOptDecorator` only
  _set_ `x-ff-user-*` when `req.user` existed. On a public route — where
  `JwtAuthGuard` permits anonymous access and leaves `req.user` undefined — a
  client-supplied `x-ff-user-id` was forwarded downstream untouched, so the
  gateway itself could be used to deliver the spoof.

**Impact:** unauthenticated read of any user profile by user-id guess; the C2
trust boundary was bypassable end-to-end while recorded as resolved.

**Fix (applied):** the token is now the only source of identity in
`getProfile()` — verify first, then use `payload.sub`. The gateway header is
still read, but only to detect disagreement: a mismatch means the request was
tampered with between gateway and service and is refused rather than resolved in
either direction. In the gateway, `proxyReqOptDecorator` now deletes every
`x-ff-user-*` header before re-asserting the verified values, so a spoofed
header cannot survive on a path where there is no verified identity to overwrite
it with. Regression coverage: `apps/auth-service/test/users.controller.spec.ts`
and `apps/api-gateway/test/proxy.controller.spec.ts`.

**Remaining:** the fix removes the service's dependence on network trust, but
does not establish network trust. Restricting who may reach `auth-service`
directly (NetworkPolicy or mesh mTLS) is still worth doing and is tracked under
H8's manifest work.

**Requirements:** the rule this violated is now stated explicitly as
**FR-AUTH-004** in `docs/SRS.md` 1.1.0, with the identity-source clause added to
**FR-AUTH-002**. At SRS 1.0.0 neither existed, which is why the implementation
passed review — see SRS §6 note 2.

---

## 🟠 High

### H1 · 🐛/🏛️ The entire event pipeline is inert

**Status: resolved (Phase 3, 2026-09-05).** Implemented `@fieldforge/messaging` with
real AMQP `amqplib` transport connecting to `fieldforge.events.topic` exchange and
dead-letter exchange `fieldforge.events.dlx`. Publishers in `work-order-service`
(`WorkOrderEventPublisher`) issue confirmed AMQP publishes at transaction boundaries
for `published`, `assigned`, `approved`, and `paid` lifecycle events with persistent
mode and mandatory correlation/event headers. Consumers are wired and bound with
idempotent deduplication in `apps/dispatch-matching-service` (`fieldforge.dispatch.work-orders`),
`apps/notification-service` (`fieldforge.notifications.work-orders`), and
`apps/billing-service` (`fieldforge.billing.work-orders`). Verified end-to-end against
live RabbitMQ and Redis test instances.

No service attaches a RabbitMQ transport (`amqplib`/`@nestjs/microservices` unused). Publishers (`work-order-service`) only `console.log`; consumers in dispatch/notification declare handler methods with **no `@EventPattern`/queue binding**; billing registers no consumer. Nothing is bound to `fieldforge.events.topic`, so no event is ever delivered.
**Impact:** publish→dispatch→bid→assign→approve→payout→notify never actually flows; the microservice choreography is non-functional.
**Fix:** stand up the topic exchange + per-service queues with bindings, real publish/consume, and wire the documented routing keys.

### H2 · 🐛 API Gateway does not proxy anything

**Status: resolved (Phase 1).** `ProxyController` on the API Gateway reverse-proxies incoming routes (`/api/v1/auth/*`, `/api/v1/users/*`, `/api/v1/work-orders/*`, `/api/v1/dispatch/*`, `/api/v1/billing/*`, `/api/v1/notifications/*`) to their respective downstream microservice URLs defined in `gateway.config.ts`. The proxy pipeline preserves and forwards `x-correlation-id`, and injects verified `x-ff-user-id` and `x-ff-user-role` headers into downstream requests.

**Correction 2026-09-03:** "injects verified headers" described only half of what
the proxy did. It set those headers when an identity was verified, but never
removed them when one was not, so on public routes an inbound `x-ff-user-id`
passed straight through — see **C5**. The decorator now strips before it
asserts.

Despite `express-http-proxy` in `package.json`, no proxy/forwarding is configured. The gateway exposes only its own health routes; documented paths like `/api/v1/work-orders` **404**.
**Impact:** clients cannot reach any service through the edge.
**Fix:** implement route→service forwarding (or NestJS microservice clients) with correlation-id + auth propagation.

### H3 · 🐛 auth-service is an empty shell

**Status: resolved (Phase 1).** `auth-service` implements registration (`POST /auth/register`) with `bcrypt` password hashing, login (`POST /auth/login`), refresh token rotation (`POST /auth/refresh`) backed by the `refresh_tokens` table via migration `0002_auth.sql`, profile fetching (`GET /users/me`), and database-backed technician certifications (`technician_certifications` table). It also mounts `HealthController` and `GlobalHttpExceptionFilter`.

`auth-service` has an empty module — no register/login/refresh, no `bcrypt`, no `@nestjs/jwt`, no DB access. It doesn't even mount the health controller.
**Impact:** there is no identity provider; nothing can issue the JWTs the gateway is supposed to verify. Blocks C2.
**Fix:** implement registration (bcrypt hash), login/refresh (signed JWT), and technician vetting against `users`/`*_profiles`.

### H4 · 🐛 Work-order FSM ignores real state and is hardcoded

**Status: resolved (Phase 2, 2026-09-04).** All transitions (`publish`, `transitionStatus`)
now load the actual persisted row within a transaction using `SELECT … FOR UPDATE`.
The actual state is checked via `WorkOrderFsmService.validateTransition`, caller identity
and permissions are verified (creator owns draft/published/cancelled/disputed/approved;
assigned technician owns en_route/on_site/completed), status updates are persisted, and
every transition is recorded in `work_order_status_history` (`0003_wo_history.sql`).
Invalid transitions and unauthorized callers fail with 400 / 403 / 404 regardless of
client claims.

### H5 · 🏛️/🔒 Geofence is never enforced server-side

**Status: resolved (Phase 2, 2026-09-04).** The canonical Haversine formula is implemented
in `packages/common/src/geo/haversine.ts` (`calculateDistanceMeters`, `isWithinGeofence`).
On the `EN_ROUTE → ON_SITE` transition, `latitude` and `longitude` are mandatory and validated
against the work order's stored coordinates on the server. Requests within 200m (SRS FR-MOB-001)
are permitted (199m verified accepted), while requests outside 200m are rejected with a 400
BadRequest (201m verified rejected). Mobile client check is retained for UX only.

### H6 · 🐛 Mobile offline queue silently discards mutations [RESOLVED]

**Status: resolved (2026-09-06, Phase 6).**

- Rebuilt `OfflineSyncService` (`apps/mobile-tech-app/src/services/offlineSync.service.ts`) backed by `OfflineStorageAdapter` (`storage.adapter.ts`).
- Mutated state is serialized and persisted locally on every `enqueue()` call.
- `flushQueue()` replays items in strict FIFO order, passes `x-idempotency-key: mob-offline-<uuid>`, and deletes an item from persistent storage only upon confirmed server success (HTTP 2xx or replay).
- Transient errors retain items in the queue with exponential backoff (1s, 2s, 4s, 8s, up to 30s) and incremented `retryCount`.
- Verified via unit test suite `test/offlineSync.service.spec.ts` including an end-to-end airplane mode lifecycle test.

`mobile-tech-app/services/offlineSync.service.ts` `flushQueue()` iterates the queued mutations but **drops them without sending** (no network call), then clears the queue. `RULE-MOB-05` requires durable offline-first cache + auto-flush on reconnect; the queue is also in-memory only.
**Impact:** field updates made offline (check-ins, photos, completion) are lost on reconnect — data loss in the core mobile workflow.
**Fix:** persist the queue (SQLite/MMKV) and actually replay each mutation to the API, clearing only on confirmed success.

### H7 · 📄 Automated test suites are empty

**Status: resolved for the empty-suite claim; the coverage threshold is not yet
enforced.** `packages/jest-config` supplies a shared `ts-jest` preset, all seven
workspaces with a `test` script have a `jest.config.cjs` and real specs (225
tests), and `--passWithNoTests` is gone everywhere — deleting an FSM transition
now turns `pnpm test` red. `coverageThreshold` is deliberately still unset; it is
raised per phase toward the SRS §5 90% target as the business rules those numbers
would measure are actually implemented.

Every service's `test` script is `jest --passWithNoTests` and there are **no test files**; `ci-pipeline.yml` therefore always goes green. The PR template asserts "≥90% coverage."
**Impact:** false quality signal; regressions land unchecked.
**Fix:** add real tests (start with escrow/FSM/geofence), drop `--passWithNoTests`, and enforce a coverage threshold — or correct the PR template.

The harness was not merely empty, it was non-functional: no workspace had a
`jest.config.*` or a `jest` key in `package.json` despite `ts-jest` being a
devDependency, so Jest fell back to `babel-jest` and any `.ts` spec failed on a
parse error before it could assert anything. `pnpm test` was green only because
zero spec files existed. Anyone who had added a test before Phase 0 would have hit
that wall.

### H8 · 🐛 Kubernetes manifests can't actually run the system

`infra/k8s/services/*` has 5 Deployments (no notification-service), all `image: …:latest`, with **no Service objects, no readiness/liveness probes, no resource limits, no securityContext, and no `envFrom`** — so the ConfigMap/Secret values never reach the pods. There are no MySQL/Redis/RabbitMQ workloads.
**Impact:** even with images, nothing is reachable or configured; the ingress targets Services that don't exist.
**Fix:** add Services, wire `envFrom` to the ConfigMap/Secret, add probes hitting `/healthz`/`/readyz`, set limits + non-root securityContext, add the notification Deployment and stateful backing services (or point at managed ones).

### H9 · Kubernetes deployment workflow was broken

**Status: resolved for the current scaffold.** The workflow now renders the root
Kustomize file and explicitly does not claim to deploy. Production cluster
authentication remains out of scope until the manifests in H8 are deployable.

`k8s-deploy.yml` runs `kubectl apply -k infra/k8s/base`, but there is **no `kustomization.yaml`** anywhere, and `base/` excludes the Deployments in `services/`. No cluster credentials are configured.
**Impact:** the deploy job fails immediately; even if it ran it would apply config/ingress but no workloads.
**Fix:** add `kustomization.yaml` files (base + services overlay), target the right path, and wire cluster auth.

---

## 🟡 Medium

### M1 · 📄 `SETTLED` / `BIDDING` states exist in docs & UI but not in the enum/DB

**Status: resolved.** `docs/SRS.md` FR-WO-002 won on the `AGENTS.md` source-of-truth
order: `PAID` was added to `WorkOrderStatus`, the Drizzle enum, and migration
`0001_canon_and_constraints.sql`, and `BIDDING`/`SETTLED`/`OPEN`/`IN_PROGRESS` were
deleted from `StatusBadge` and the docs. Bidding is `work_order_bids` rows, not a
work-order state. `apps/work-order-service/test/work-order-fsm.service.spec.ts`
asserts all 100 ordered status pairs, so a fourth definition cannot reappear
silently.

`WorkOrderStatus` (contracts) and the migration enum contain **neither** `BIDDING` nor `SETTLED`, yet: the README FSM shows `APPROVED → SETTLED`, `domain_entities.md` shows both `BIDDING` and `SETTLED`, and `@fieldforge/ui`'s `StatusBadge` renders `BIDDING`/`SETTLED`/`OPEN`/`IN_PROGRESS`. Three divergent FSM definitions exist (see ARCHITECTURE §7).
**Impact:** persisting a documented state would throw on the enum column; UI has dead/incorrect branches; contributors get contradictory specs.
**Fix:** pick one canonical FSM. Either add the states to the enum+migration+contracts or remove them from README/domain doc/UI.

### M2 · 🐛 Seed fails: bid primary key exceeds VARCHAR(36)

**Status: resolved.** All fixture identifiers are now deterministic UUID v4-form
strings that fit the `VARCHAR(36)` keys.

`packages/database/src/seeds/index.ts:102` uses `id: 'bid-0000000-0000-0000-0000-000000000001'` — **39 characters** into a `varchar(36)` PK. (`escrow-0000-0000-0000-000000000001` is 34, OK.)
**Impact:** `pnpm db:seed` errors (or silently truncates in non-strict mode, corrupting the key). Documented quickstart step fails.
**Fix:** use a real 36-char UUID v4 for the bid (and ideally all seed) PKs.

### M3 · 🏛️ Escrow ↔ work order 1:1 not enforced (no UNIQUE)

**Status: resolved.** `escrow_accounts.work_order_id` now carries
`uq_escrow_work_order` in both the Drizzle schema and migration
`0001_canon_and_constraints.sql`, so a second escrow row for one job is rejected by
the database rather than by application code. The double-release logic in
`releaseFunds()` itself is still open — see C3.

`escrow_accounts.work_order_id` is a plain FK in both the Drizzle schema (`billing.schema.ts`, no `.unique()`) and the migration.
**Impact:** multiple escrow rows per work order become possible → ambiguous "the escrow" lookups and double-hold/double-release risk.
**Fix:** add a UNIQUE constraint on `work_order_id` and a migration.

### M4 · 🏛️ Composite index rule violated

**Status: resolved.** Migration `0001_canon_and_constraints.sql` drops
`idx_wo_status` and `idx_wo_schedule` and creates
`idx_wo_status_sched (status, scheduled_start_time)`; the Drizzle table definition
matches.

`RULE-DB-02` mandates a composite `(status, scheduled_start_time)` index for the dispatch hot path. The migration creates **two single-column** indexes (`idx_wo_status`, `idx_wo_schedule`) instead.
**Impact:** the intended dispatch/SLA queries can't use an ideal index.
**Fix:** replace with `CREATE INDEX idx_wo_status_sched ON work_orders (status, scheduled_start_time)`.

### M5 · 🐛 Money represented as floating point in the app/event layer

**Status: resolved in the contract layer.** `packages/contracts/src/money.ts` holds
the conversions and the `assertMinorUnits` guard; every DTO, event payload, and Zod
schema now names its amounts `*Minor` and types them as non-negative integers.
DB columns stay `DECIMAL(10,2)` and convert at the repository edge via
`decimalStringToMinor`/`minorToDecimalString`, which parse the digits rather than
routing through a float. `packages/contracts/test/money.spec.ts` pins the round
trip on the values that break naive `* 100` arithmetic. The remaining float math
lives in `scripts/simulate-dispatch-load.js`, which L8 deletes outright.

DB columns are `DECIMAL`, but DTOs and event payloads type amounts as `number` (JS float), and the load simulator/stubs do float math.
**Impact:** rounding drift on financial amounts once real arithmetic runs.
**Fix:** carry money as integer minor units or decimal strings across DTOs/events; never use `number` for currency math.

### M6 · 🏛️ No idempotency, DLQ, or bounded retry on consumers

**Status: resolved (Phase 3, 2026-09-05).** In `packages/messaging`, `IdempotentConsumer`
implements the complete requirements of `RULE-EVENT-03`:

- **Idempotency Store**: Redis `SETNX` (`tryAcquire`, `markCompleted`, `markFailed`) with 7-day TTL (`ff:idemp:<eventId>`). Duplicate messages are immediately acknowledged without invoking the handler.
- **Dead-Letter Exchange**: Fatal errors (unparseable JSON) and messages that exceed retry limits are routed to `fieldforge.events.dlx` with persistent delivery and `x-death-reason` header.
- **Bounded Retry**: `RetryPolicy` executes exponential backoff (1s, 2s, 4s, capped at 10s) up to `MAX_RETRY_COUNT` (3 attempts), updating `x-retry-count` on the message.

`RULE-EVENT-03` requires idempotent consumers (7-day dedupe), a dead-letter exchange, and max-3 exponential-backoff retries. None exist (consumers themselves are stubs — see H1). Event envelopes carry `eventId` (usable for dedupe) but nothing consumes it.
**Impact:** once wired, duplicate deliveries could double-assign/double-pay; poison messages would hot-loop.
**Fix:** implement a dedupe store keyed on `eventId`, a DLX, and retry/backoff policy.

### M7 · 🏛️ Correlation-id not propagated over AMQP

**Status: resolved (Phase 3, 2026-09-05).** `EventPublisher` injects `x-correlation-id`
(along with `x-event-id`, `x-event-type`, and `x-retry-count`) into AMQP message headers
and envelope payload. `IdempotentConsumer` extracts `correlationId` from message properties
and envelope, initializing a child Pino logger (`createChildLogger({ correlationId })`)
passed directly into event consumer handlers, ensuring end-to-end distributed tracing
across all message hops.

`RULE-OBS`/`.cursorrules` require `x-correlation-id` across HTTP **and** AMQP. Event interfaces in `@fieldforge/contracts` carry no `correlationId` field, and the `CorrelationId` decorator only reads an HTTP header.
**Impact:** traces break at every service hop through the broker.
**Fix:** add `correlationId` to the event envelope, set it on publish, and restore it into the logger/context on consume.

### M8 · 🐛 SLA auto-approval missing and breach check is inverted

**Status: resolved (Phase 4, 2026-09-05).**

- In `apps/work-order-service`, `SlaEscalationService` is registered in `WorkOrderModule`, `checkSlaBreachRisk` was corrected to return `true` whenever `timeRemainingMs <= 0` (properly flagging already-breached work orders as well as imminent breach risks), and a 5-minute scheduled sweep (`@Cron(CronExpression.EVERY_5_MINUTES)`) logs breaches.
- In `apps/billing-service`, `SlaAutoApprovalService` implements the 72-hour buyer review timeout (FR-BILL-002) via `@Cron(CronExpression.EVERY_5_MINUTES)`. It identifies completed work orders exceeding 72 hours, transitions them to `APPROVED`, writes status history, and executes transactional escrow release to `PAID`. Fully verified in `test/sla-auto-approval.service.spec.ts`.

The 72-h auto-approval flow is absent (no scheduler; the SLA module isn't registered). `checkSlaBreachRisk()` returns `false` for orders already past `sla_expiration_time` (it flags only _upcoming_ risk, missing already-breached).
**Impact:** SLAs never auto-resolve; the breach metric under-reports exactly the cases that matter.
**Fix:** add a scheduled SLA sweep (auto-approve at +72 h) and fix the predicate to include already-breached orders.

### M9 · 📄 Port conflicts across the documented stack

**Status: resolved.** The buyer portal now uses `5173`, Grafana uses `3009`, and
local documentation matches.

Grafana publishes host `3009` (`docker-compose.observability.yml`) which no longer collides with any service. The buyer portal binds `5173` via `next dev --port 5173` / `next start --port 5173` (previously a Vite `strictPort` config; the port survived the Next.js migration unchanged). All application services now run on the `8000`–`8005` range.
**Impact:** you can't run the documented set together; quickstart is misleading.
**Fix:** move Grafana to e.g. `3009`, pin the portal to `5173`, and reconcile the README.

### M10 · 📄 Version drift between ADRs/README and actual images

**Status: resolved (2026-09-06, Phase 7).** Reconciled via ADR 004 (`004_upgrade_infrastructure_versions.md`), superseding ADRs 001, 002, and 003. The runtime stack baseline is codified as MySQL 8.4 LTS, Redis 8.0, and RabbitMQ 4.1 across `docker-compose.yml`, Kubernetes manifests, and README.

ADRs/README historically specified MySQL 8.0, Redis 7.0, RabbitMQ 3.13; compose pulls `mysql:8.4`, `redis:8.0-alpine`, `rabbitmq:4.1-management-alpine`.
**Impact:** behavior/config drift from what's documented and decided.
**Fix:** pin images to the ADR versions or supersede the ADRs deliberately.

### M11 · 🐛 `transitionStatusSchema` referenced but does not exist

**Status: resolved.** `transitionStatusSchema` is defined and exported from
`packages/contracts/src/validators/work-order.schema.ts`; it takes `nextStatus` from
the canon enum plus `latitude`/`longitude`, required together for the `ON_SITE`
arrival because the server — not the handset — decides whether the technician is
inside the geofence. `submitBidSchema.proposedAmount` is now `bidAmountMinor`,
matching the `bid_amount` column. The same pass dropped the caller-supplied
`buyerId`/`technicianId` fields from the request schemas: identity comes from the verified
token, and `packages/contracts/test/validators.spec.ts` asserts a client that sends
one is ignored rather than obeyed.

`.agent/context/api_contracts.md` documents a `transitionStatusSchema` validator; it isn't defined or exported from `@fieldforge/contracts` (`packages/contracts/src/index.ts` exports no such symbol). Relatedly, `submitBidSchema` uses `proposedAmount` while the DB column is `bid_amount`.
**Impact:** the status-transition endpoint has no request validation to import; bid field naming is inconsistent between validator and schema.
**Fix:** add the missing schema (or fix the doc) and align bid field names.

### M12 · 🔒 Wide-open CORS + PII in logs

**Status: partially remediated (Phase 1).** The API Gateway now enforces a strict CORS origin allowlist derived from `WEB_PORT` and `CLIENT_URL` rather than reflecting any origin. Gateway and auth services use structured Pino logging via `createLogger()` with redaction paths for `authorization`, `password`, `passwordHash`, `token`, `refreshToken`, `phoneNumber`, `phone_number`, and `email`. Downstream services adopt this in subsequent phases.

Services enable permissive CORS (reflect-any-origin) and log request bodies/headers that can include phone numbers/emails via `console.log`, not the Pino redaction path.
**Impact:** CSRF-adjacent exposure once auth exists; PII leakage into logs.
**Fix:** restrict CORS to known origins; route through Pino with redaction of PII/authorization headers.

### M13 · 🏛️ Three architecture rules have no lint enforcement

`packages/eslint-config/index.js` uses `tseslint.configs.recommended` with no
`parserOptions.projectService`, so there is **no type-aware linting at all** and the
rules that need type information cannot run. Measured 2026-09-01: enabling only
`no-floating-promises` and `no-misused-promises` surfaces 9 problems, 6 of which are
the unhandled `bootstrap()` calls already filed as L8 — meaning the linter would
have caught a known defect. Separately, three `.agent/rules` are entirely
unenforced: rule 01 §1 bounded contexts (no `no-restricted-imports`), rule 04 React
(no `eslint-plugin-react-hooks`), and rule 07 §4 "a11y non-negotiables" (no
`eslint-plugin-jsx-a11y`).
**Impact:** rules stated as non-negotiable are advisory in practice; a
cross-context import or a missing hook dependency lands green.
**Fix:** enable `projectService` on a type-aware block scoped to `src/**`, starting
with the two promise rules. Note that `apps/web-buyer-portal/e2e/*.spec.ts` and the
root `*.config.ts` files sit outside every tsconfig `include`, so a type-aware block
must exclude them or a tsconfig must claim them. The rule-01 boundary can be
enforced with core `no-restricted-imports` and needs no new dependency.

### M14 · 🏛️ `@fieldforge/ui` declares no React peer dependency, and mobile bypasses it

`packages/ui/package.json` lists React neither as a dependency nor as a peer
dependency, so nothing constrains which React a consumer supplies to components
that require one. Meanwhile `web-buyer-portal` is on React `^19.2.8` and
`mobile-tech-app` on `18.3.1` (pinned by React Native 0.76.7), and mobile does not
depend on `@fieldforge/ui` at all — contradicting rule 07 §2, which requires common
UI building blocks to live in `@fieldforge/ui` and be composed by both frontends.
**Impact:** the shared package cannot actually be shared. Any attempt to consume it
from mobile would pull a second React version into the graph, and today the two
frontends necessarily duplicate every primitive.
**Fix:** declare `react` as a peer dependency with a range that admits both majors,
and split the package into platform-neutral tokens/logic versus DOM components — or
record explicitly that `@fieldforge/ui` is web-only and amend rule 07 §2 to match.

---

## 🟢 Low

### L1 · 🏛️ Observability is stubbed

**Status: resolved (2026-09-06, Phase 7).**

- Replaced console-log stub with centralized `prom-client` `MetricsRegistry` and production `MetricsInterceptor` in `@fieldforge/common`.
- Exposed `/metrics` (Prometheus text format) and honest dependency-aware `/readyz` probes across microservices validating MySQL pools (`SELECT 1`), Redis, and RabbitMQ.
- Configured Prometheus scraping on `/metrics` (ports 8000–8005) and defined SLI recording rules (`infra/docker/rules.yml`).
- Provisioned Grafana datasources and custom dashboard (`infra/docker/grafana/dashboards/fieldforge-slos.json`) visualising the 5 SLIs in `.agent/context/sli_slo_definitions.md`.
- Implemented real k6 load testing harness (`scripts/k6/dispatch-load.js`) measuring 1,000 concurrent dispatches against the real API.

### L2 · 🏛️ Structured logging bypassed

**Status: partially remediated (Phase 1).** `api-gateway` and `auth-service` have eliminated `console.*` in favor of `createLogger()` with PII redaction and fatal startup error handlers. Downstream services will follow in Phases 2–4.

Across services, `console.log`/`console.error` are used instead of the provided Pino `createLogger()`, so logs aren't structured JSON and correlation-id isn't attached.
**Fix:** inject the Pino logger and drop `console.*`.

### L3 · 🔒 Dockerfiles run as root and are mostly single-stage

**Status: partially remediated.** A root `.dockerignore` now excludes secrets,
dependencies, caches, and repository metadata. Runtime images still need non-root
users and stronger multi-stage/pruned builds.

Service Dockerfiles use a single stage, run as root, and there's no `.dockerignore` (build context includes `node_modules`, `.git`).
**Fix:** multi-stage builds, non-root `USER`, add `.dockerignore`.

Measured 2026-09-01 across the seven tracked Dockerfiles: **0 of 7** declare a
`USER`, **0 of 7** declare a `HEALTHCHECK`, and only `web-buyer-portal` is
multi-stage. None use `turbo prune`, so each image build ships the whole monorepo
context.

### L4 · 🔒 Terraform lacks remote state and S3 public-access-block

No remote backend/state locking; the deliverables bucket has SSE+versioning but **no `aws_s3_bucket_public_access_block`**; `outputs.tf` exposes only `vpc_id`; no EKS/security groups.
**Fix:** add an S3+DynamoDB backend and a public-access-block resource.

### L5 · 🐛 Deliverable signature uses `Date.now()` inside the hash

**Status: resolved (Phase 2, 2026-09-04).** In `apps/work-order-service/src/modules/deliverables/deliverables.service.ts`,
`generateSignatureHash` now hashes only stable inputs (`workOrderId`, `clientName`, and canonical
`signatureData` bytes) via SHA-256 without injecting non-deterministic timestamps. The signing
timestamp is persisted explicitly in its own `signed_at` column in `work_order_deliverables`
(migration `0003_wo_history.sql`), ensuring signatures can be independently verified for integrity.

### L6 · 🏛️ Frontend deviates from RULE-FE-04 [RESOLVED]

`web-buyer-portal` formerly used hardcoded Redux `initialState` across all domain slices and a mock token instead of RTK Query for server state, lacked addressable route segments, and generated identifiers with `Math.random()`.
**Resolution:**

- Implemented unified RTK Query API slice in `apps/web-buyer-portal/src/store/services/api.ts` with `baseQueryWithReauth` using a `SimpleMutex` for automatic 401 JWT access token rotation against `/api/v1/auth/refresh`.
- Configured automated cache tag invalidation (`WorkOrder`, `WorkOrderDeliverables`, `WorkOrderHistory`, `Technician`, `Bid`, `Escrow`, `Invoice`).
- Stripped hundreds of lines of static domain data from `workOrderSlice.ts`, `dispatchSlice.ts`, and `billingSlice.ts`, re-homing test fixtures under `apps/web-buyer-portal/src/mocks/fixtures/`.
- Replaced all `Math.random()` ID invocations with `crypto.randomUUID()`.
- Promoted all 5 command center tabs to addressable Next.js App Router route segments (`/operations`, `/create-wo`, `/technicians`, `/billing`, `/audit`) with `BuyerPortalShell.tsx`.
- Extended Playwright test suite with `apps/web-buyer-portal/e2e/lifecycle.spec.ts` testing the complete SRS §5 lifecycle path (`create → publish → accept bid → approve → payout`).

### L7 · 🐛 Mobile app missing location permissions wiring [RESOLVED]

**Status: resolved (2026-09-06, Phase 6).**

- Configured `apps/mobile-tech-app/app.json` with mandatory iOS `infoPlist` usage descriptions (`NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) and Android permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`).
- Added `PermissionsService` (`src/services/permissions.service.ts`) for checking and requesting foreground location permissions via `expo-location`.
- Created `AppNavigator` mounting `JobListScreen` and `ActiveJobScreen` inside `App.tsx` wrapped in Redux `<Provider>`.
- Verified via unit test suite `test/permissions.service.spec.ts`.

`expo-location` is a dependency but permissions aren't requested and `app.json` lacks the iOS/Android location usage strings; `ActiveJobScreen` is never mounted by a navigator.
**Fix:** add permission prompts + usage descriptions and mount the screen.

### L8 · 🐛 SLO verification is theater; `bootstrap()` rejections unhandled

**Status: resolved (2026-09-06, Phase 7).**

- Deleted `scripts/simulate-dispatch-load.js` and replaced it with `scripts/k6/dispatch-load.js` driving 1,000 real concurrent dispatches across the API Gateway with measured latency/availability thresholds.
- Added `scripts/run-load-test.sh` for native or containerized execution.
- Added `.catch(err => { logger.fatal({ err }, 'Failed to start ...'); process.exit(1); })` to every service's `main.ts` `bootstrap()` call.

`scripts/simulate-dispatch-load.js` formerly fabricated latency samples with `Math.random()` and reported them as SLO evidence.
**Fix:** measure real requests with k6 and ensure `bootstrap()` rejections exit with code 1.

### L9 · 🐛 `.env.example` omits `PORT`, which every service reads [RESOLVED]

All six `apps/*/src/main.ts` read `process.env.PORT` with a distinct
service-specific fallback (8000–8005), but `.env.example` declares neither `PORT`
nor `CI`. Copying the example and exporting a single `PORT` — the obvious reading
of an undocumented variable — collapses all six services onto one port.
**Impact:** the documented setup path either leaves `PORT` unset (working only by
fallback) or, once someone sets it globally, produces `EADDRINUSE` on five of six
services.
**Resolution:** updated all microservices to bind to service-scoped environment variables (`AUTH_PORT`, `WORK_ORDER_PORT`, `DISPATCH_PORT`, `BILLING_PORT`, `NOTIFICATION_PORT`, `GATEWAY_PORT`) with their standard respective fallbacks (8001–8005, 8000).

### L10 · 🔒 `.npmrc` makes a destructive install silent

`.npmrc` sets `confirm-modules-purge=false`. When pnpm decides `node_modules` was
built by a different configuration it deletes the tree without prompting, and if
the registry is then unreachable there is no way back — the lockfile alone cannot
rebuild without network. This happened on 2026-09-01: an `--offline` install purged
the tree and hung, and recovery required an out-of-band install.
**Impact:** one routine command can leave the repository unbuildable, with no
confirmation step and nothing recoverable from git.
**Fix:** drop the setting so the purge prompt returns, or pair it with a
content-addressable store checked into the developer's environment (a
`.pnpm-store/` APFS clone is currently staged and gitignored) so an offline
rebuild is always possible.

### L11 · 🏛️ CI workflows have no concurrency, permissions, or cache

None of the three workflows in `.github/workflows/` declares `permissions:`
(so jobs inherit the repository default token scope), `concurrency:` (so
superseded pushes keep running), or `actions/cache` (so no Turborepo cache is
shared). `ci-pipeline.yml` duplicates checkout/pnpm/node/install across both jobs
and runs `pnpm build` twice.
**Impact:** over-scoped tokens, wasted runner minutes, and CI that is slower than
the task graph requires.
**Fix:** add least-privilege `permissions:`, a `concurrency` group keyed on the
ref, cache the pnpm store and `.turbo`, and let the second job `needs:` the first.
Setting `TURBO_TELEMETRY_DISABLED: 1` also stops a per-invocation call to
`telemetry.vercel.com`.

### L12 · 🐛 ~~Committed `next-env.d.ts` made `pnpm check` fail after `pnpm typecheck`~~ — FIXED 2026-09-03

`apps/web-buyer-portal/next-env.d.ts` was tracked in git. Next.js regenerates that
file on every `next dev`, `next build`, and `tsc` run using its own quote style, so
each `pnpm typecheck` rewrote it and left the working tree dirty — which then failed
the next `pnpm format:check`. The loop was reproducible and would have surfaced in CI
as an unexplained formatting failure on a branch that changed no frontend code.
**Impact:** running the repo's own verification commands in their documented order
broke the tree.
**Fix:** `git rm --cached` the file and add it to `.gitignore` and `.prettierignore`.
The Next.js docs state it "should be included in your `tsconfig.json` `include`
array, added to `.gitignore`, and not edited manually." `tsc --noEmit` still exits 0
with the file absent, because `tsconfig.json` lists it under `include` (a glob, which
skips missing entries) rather than `files` (which errors on them). Verified by running
`pnpm typecheck` followed immediately by `pnpm format:check` — both clean.

### L13 · 🐛 ~~Web buyer portal auto-authenticates as default demo user when localStorage is cleared~~ — FIXED 2026-09-03

`apps/web-buyer-portal/src/store/slices/authSlice.ts` had an inverted auth persistence
model: `initialState` defaulted to `isAuthenticated: true` with `defaultDemoUser`
(`Apex Retail Corp`), and `logout` relied on writing an ad-hoc `ff_logged_out = 'true'`
key to `localStorage`. When a user cleared `localStorage` and reloaded the page,
the `ff_logged_out` marker was gone, leaving Redux to mount in the hardcoded
authenticated state.
**Impact:** logged-out users clearing browser storage or browsing in fresh storage
sessions were unexpectedly re-authenticated as the demo buyer.
**Fix:** set default `initialState` to unauthenticated (`user: null`, `token: null`,
`isAuthenticated: false`). Rehydration now strictly checks for the presence of valid
`ff_access_token` and `ff_user` entries before asserting authentication. Automated with
a 24-test Playwright test suite (`apps/web-buyer-portal/e2e/auth-persistence.spec.ts`).

---

## Section 13 (Bugs & Issues) Resolutions

All 9 issues discovered during the Section 13 audit were remediated on branch `fix/bugs-and-issues`:

### FF-BUG-01 · 🐛 Mobile Tech App `flushQueue()` silently discarded mutations

- **Root Cause**: `apps/mobile-tech-app/src/services/offlineSync.service.ts` had a stub `flushQueue()` implementation that logged `[OfflineSync] Flushing queue...` and immediately reset the queue to `[]` without dispatching operations to backend APIs.
- **Fix**: Replaced the stub with a durable FIFO mutation queue adhering to SRS FR-MOB-005. Each queued operation receives a persistent idempotency key (`crypto.randomUUID()`), timestamp, retry counter, and mutation payload. `flushQueue()` dispatches each mutation sequentially through an injectable HTTP dispatcher, increments retry counts on network failures, and preserves un-dispatched items.

### FF-BUG-02 · 🏛️ Kubernetes manifests lacked Services, probes, and resource limits

- **Root Cause**: Manifests under `infra/k8s/services/` were missing `Service` resource definitions, liveness/readiness probes, resource requests/limits, non-root security contexts, and `notification-service.yaml`.
- **Fix**: Added `Service` definitions mapping container ports to cluster ports, configured `livenessProbe` (`/healthz`) and `readinessProbe` (`/readyz`) with `initialDelaySeconds`, `timeoutSeconds`, and `periodSeconds`. Enforced `requests`/`limits` on memory and CPU, added non-root `securityContext`, created `notification-service.yaml`, and updated `infra/k8s/kustomization.yaml`.

### FF-BUG-03 · 🏛️ Web Buyer Portal lacked RTK Query API client

- **Root Cause**: `apps/web-buyer-portal` relied exclusively on hardcoded mock client-side state in Redux slices without an RTK Query API client service.
- **Fix**: Implemented RTK Query slice in `apps/web-buyer-portal/src/store/services/api.ts` using `createApi` and `fetchBaseQuery`. Configured baseUrl `/api/v1`, dynamic `x-correlation-id` header injection, and `Authorization: Bearer <token>` extraction from `authSlice`. Wired the API reducer and middleware into `apps/web-buyer-portal/src/store/index.ts`.

### FF-BUG-04 · 🐛 Database schema missing UNIQUE constraint on `invoices.work_order_id`

- **Root Cause**: `packages/database/src/schemas/billing.schema.ts` lacked a unique constraint on `invoices.workOrderId`, permitting duplicate invoice creation for the same work order.
- **Fix**: Added `.unique('uq_invoice_work_order')` to `invoices.workOrderId`. Generated migration `0005_chubby_iron_lad.sql` via `pnpm run db:generate` and verified execution against MySQL 8.4 via `pnpm run db:migrate`.

### FF-BUG-05 · 🐛 Incomplete observability probes and Prometheus scrape configuration

- **Root Cause**: `/readyz` returned a static `{ status: 'ok' }` without system metrics, and `infra/docker/prometheus.yml` lacked scrape configs for backend services on ports 8000–8005.
- **Fix**: Enhanced `HealthController.getReadiness()` in `packages/common/src/health/health.controller.ts` to report dynamic `memoryMb` (`rss`, `heapUsed`, `heapTotal`) and `uptimeSeconds`. Added scrape configurations in `infra/docker/prometheus.yml` covering `api-gateway` (8000), `auth-service` (8001), `work-order-service` (8002), `dispatch-service` (8003), `billing-service` (8004), and `notification-service` (8005).

### FF-BUG-06 · 🐛 Billing SLA auto-approval worker left work orders in APPROVED if release failed

- **Root Cause**: In `apps/billing-service/src/modules/sla/sla-auto-approval.service.ts`, work orders were updated to `APPROVED` before `releaseFunds()`. If `releaseFunds()` failed or threw an exception, the work order remained in `APPROVED`, leaving it permanently stuck without escrow release.
- **Fix**: Wrapped the transition in a try/catch block. If `releaseFunds()` fails, the work order status is safely rolled back to `COMPLETED`, allowing subsequent scheduler sweeps or manual remediation to retry the release.

### FF-BUG-07 · 🏛️ Unstructured console logging bypassed Pino structured logger

- **Root Cause**: `apps/billing-service/src/modules/escrow/escrow.service.ts` and `apps/dispatch-matching-service/src/modules/geo-search/geo-search.service.ts` used `console.log` and `console.warn` instead of the centralized structured Pino logger.
- **Fix**: Replaced all console statements with `createLogger('billing-escrow')` and `createLogger('dispatch-geo-search')` from `@fieldforge/common`, preserving correlation IDs and JSON structure.

### FF-BUG-08 · 🐛 `@fieldforge/ui` missing React peer dependency

- **Root Cause**: `packages/ui/package.json` exported React components without declaring `react` in `peerDependencies`, causing potential multiple-React-instance issues in monorepo consumers.
- **Fix**: Added `"peerDependencies": { "react": ">=18.0.0" }` in `packages/ui/package.json`.

### FF-BUG-09 · 🐛 Redis client open handles in `@fieldforge/messaging` integration tests

- **Root Cause**: In `packages/messaging/src/connection/redis-idempotency.client.ts`, `onModuleDestroy()` called `this.client.quit()` which could hang or leave lingering event loop handles in Jest tests.
- **Fix**: Updated `onModuleDestroy()` to call `this.client.disconnect()`, terminating connections immediately and ensuring Jest integration suites exit with zero open handles.

### FF-BUG-10 · 🐛 GitHub Actions CI missing backing service provisioning for `@fieldforge/messaging` integration tests

- **Root Cause**: `.github/workflows/ci-pipeline.yml` executed `pnpm check` on standard Ubuntu GitHub runners without starting Redis or RabbitMQ instances, causing `@fieldforge/messaging` integration tests (`test/messaging.integration.spec.ts` and `test/redis-idempotency.spec.ts`) to fail with `ECONNREFUSED` on ports 6379 and 5672.
- **Fix**: Added step to copy `.env.example` to `.env` and start healthy Redis and RabbitMQ containers via `docker compose --env-file .env -f infra/docker/docker-compose.yml up -d redis rabbitmq --wait` prior to executing `pnpm check`.

### FF-ARCH-01 · 🏛️ Direct cross-service mutation of the Work Order Aggregate (Bypassing FSM)

- **Root Cause**: In `apps/billing-service` (`EscrowService.releaseFunds()`) and `apps/dispatch-matching-service` (`BidsService.acceptBid()`, `autoRoute()`), services directly mutated rows in `workOrdersSchema.workOrders` and `workOrdersSchema.workOrderStatusHistory`, bypassing `WorkOrderFsmService` state transitions, emitting duplicate `work_order.lifecycle.assigned` events, and violating service bounded context invariants (`AGENTS.md` and `RULE-FEAT-09`).
- **Fix**: Decoupled both services from foreign aggregate tables. Introduced `tech.bidding.accepted` (`TECH_BID_ACCEPTED`) event emitted by `dispatch-matching-service`. Added `WorkOrderEventsConsumer` in `apps/work-order-service` consuming `tech.bidding.accepted` and `billing.payout.disbursed`, driving transitions via `WorkOrderFsmService` with pessimistic locking (`SELECT … FOR UPDATE`), and making `work-order-service` the single canonical emitter for `work_order.lifecycle.assigned` and `work_order.lifecycle.paid` (ADR 005).

### FF-ARCH-02 · 🏛️ High Coupling and Database Sharing Across Services (Finding 2)

- **Root Cause**: Services shared database tables and performed cross-domain SQL joins: `apps/dispatch-matching-service` joined `technician_profiles`, `users`, and `technician_certifications`, while `apps/work-order-service` automatically inserted synthetic profiles (`Default Buyer Co`) when buyer profiles were missing, and queried foreign profile tables on every lifecycle check. `apps/billing-service` similarly queried identity profile tables directly.
- **Fix**: Decoupled data access via Token-Enriched Profile Identity and inter-service directory lookup. Enriched `AuthJwtPayload` and gateway asserted headers (`x-ff-profile-id`) with `profileId`. Removed synthetic profile auto-creation from `work-order-service` (requiring onboarding). Added `POST /technicians/batch` in `auth-service` and `TechnicianDirectoryService` in `dispatch-matching-service` to query technician metadata via REST. Added dual-path fallback across services to maintain full backwards compatibility (ADR 006).

### FF-ARCH-03 · 🏛️ Misplaced Responsibility: Marketplace Bidding Inside Dispatch Service (Finding 3)

- **Root Cause**: Commercial contractor bidding logic (`work_order_bids` queries, mutations, rate counters, buyer acceptance, sibling bid rejection) was misplaced in `apps/dispatch-matching-service`. A dispatch service's single responsibility is geospatial matching (spatial index, Redis `GEOSEARCH`, live technician GPS updates, proximity filtering). Housing bidding in dispatch violated DDD aggregate invariants: a `Bid` is an entity belonging to the `WorkOrder` aggregate root, and accepting a bid must atomically mutate both the bid and the work order lifecycle (`PUBLISHED → ASSIGNED`) within a single ACID transaction.
- **Fix**: Re-homed `BidsService` into `apps/work-order-service/src/modules/bids/` and added `BidsController` exposing canonical aggregate endpoints (`POST /work-orders/:id/bids`, `GET /work-orders/:id/bids`, `POST /work-orders/:id/bids/:bidId/accept`) alongside legacy aliases. Implemented atomic single-transaction bid acceptance locking rows `FOR UPDATE`, transitioning FSM state via `WorkOrderFsmService`, recording audit history in `work_order_status_history`, and publishing `tech.bid.accepted` and `work_order.assigned` domain events. Purified `apps/dispatch-matching-service` to strictly handle geospatial location updates, nearby technician searches, and automated routing. Configured API Gateway path rewriting (`/dispatch/bids` → `/work-orders/bids`) for seamless backward compatibility (ADR 007).

### FF-ARCH-04 · 🏛️ auth-service Conflating Authentication with Domain Profile & Vetting Operations (Finding 4)

- **Root Cause**: `apps/auth-service` conflated Identity & Access Management (IAM) security primitives (passwords, JWT signing, refresh token rotation, phone OTP) with domain profile management (`buyer_profiles`, `technician_profiles`) and contractor vetting/compliance operations (`technician_certifications`, badge verification, directory batch lookups). All components were crammed into an un-encapsulated flat `AuthModule`, with `AuthService` performing direct SQL queries and inserts on `buyerProfiles` and `technicianProfiles` during `register()`, `login()`, and `refresh()`. This violated the Single Responsibility Principle (SRP), expanded the security blast radius of auth, and tightly coupled IAM with marketplace domain entities.
- **Fix**: Restructured `apps/auth-service` into three distinct, encapsulated NestJS domain modules:
  1. `IamModule` (`src/modules/iam/`): Exclusively handles credentials, passwords, JWT signing/rotation, and phone OTP (`AuthController`, `AuthService`, `PhoneOtpService`).
  2. `ProfilesModule` (`src/modules/profiles/`): Manages buyer and technician domain profiles, self-profile lookup (`GET /users/me`), and profile provisioning port (`UsersController`, `ProfilesService`).
  3. `ContractorVettingModule` (`src/modules/vetting/`): Manages contractor compliance badges, certification lifecycle, and technician directory batch lookups (`CertificationsController`, `CertificationsService`).
     Decoupled `AuthService` by injecting `ProfilesService` to delegate profile creation and profile ID resolution, eliminating direct SQL queries on profile tables from the IAM service. Grouped schemas in `packages/database` into `iamSchema`, `profileSchema`, and `vettingSchema` with zero database migrations (`RULE-DB-02`) (ADR 008).

### FF-ARCH-05 · 🏛️ Broken Event Lifecycle for Order Settlement (PAID Status) (Finding 5)

- **Root Cause**: The order settlement lifecycle leading to `PAID` work order status suffered from cross-service SQL mutations, incomplete event choreography, and circumvention of state machine guarantees:
  1. `apps/billing-service` hosted `SlaAutoApprovalService`, which directly updated `workOrdersSchema.workOrders` and `workOrdersSchema.workOrderStatusHistory` using Drizzle ORM, violating bounded context data isolation and bypassing `WorkOrderFsmService`. If escrow release failed, it rolled back `work_orders` to `COMPLETED`. It never emitted canonical `work_order.lifecycle.approved` events.
  2. `WorkOrdersService.transitionStatus()` permitted users with `role === 'ADMIN'` to manually transition work orders to `PAID` via `POST /work-orders/:id/transition`, bypassing financial settlement entirely (no escrow release, no ledger transactions, no invoice).
  3. `apps/notification-service` (`NotificationConsumer`) never subscribed to `WORK_ORDER_PAID`, leaving technicians without payout receipts upon completion.
- **Fix**: Reconciled the event-driven order settlement choreography:
  1. Relocated `SlaAutoApprovalService` from `billing-service` to `apps/work-order-service/src/modules/sla/sla-auto-approval.service.ts`. The sweep now calls `WorkOrdersService.transition()` with `role = 'SYSTEM'`, recording status history and emitting canonical `work_order.lifecycle.approved`.
  2. Deleted `SlaAutoApprovalService` and its direct SQL mutations from `apps/billing-service`.
  3. Strictly blocked manual transitions to `PAID` via API: `WorkOrdersService.transition()` throws `ForbiddenException('Work order cannot be manually transitioned to PAID via API; settlement to PAID is exclusively event-driven upon payout disbursement (billing.payout.disbursed)')`. `settlePaid()` remains the sole canonical method to enter `PAID`, triggered exclusively by `WorkOrderEventsConsumer` upon receiving `PAYOUT_DISBURSED`.
  4. Subscribed `NotificationConsumer` to `EventType.WORK_ORDER_PAID` (`work_order.lifecycle.paid`), sending push and SMS receipts to technicians upon payout.
  5. Zero database migrations (`RULE-DB-02`) (ADR 009).

### FF-ARCH-06 · 🏛️ Architectural Over-Splitting / Exposure of notification-service (Finding 6)

- **Root Cause**: `apps/api-gateway` registered proxy routes for `/notifications` and `/notifications/{*path}` forwarding to port `8005`. However, `apps/notification-service` is an asynchronous event consumer that subscribes to RabbitMQ topics and invokes Twilio/Firebase APIs; it exposes zero business REST endpoints. Forwarding external requests to port `8005` opened unnecessary HTTP sockets only to receive unhandled 404s, created configuration clutter, and misidentified a background worker as a public API service.
- **Fix**: Decoupled `notification-service` from edge proxy routing:
  1. Removed `notifications` from `gatewayConfig.services` in `apps/api-gateway/src/config/gateway.config.ts`, ensuring the edge gateway strictly fronts the 4 domain services (`auth`, `workOrder`, `dispatch`, `billing`).
  2. Removed `notifications` proxy handler creation and route decorators from `ProxyController` in `apps/api-gateway/src/controllers/proxy.controller.ts`. Requests to `/api/v1/notifications/*` now fail fast at the edge with 404 (`No downstream service registered for path: ...`).
  3. Added boundary tests in `apps/api-gateway/test/gateway.spec.ts` and `apps/api-gateway/test/proxy.controller.spec.ts`.
  4. Formally documented `notification-service` as a headless background consumer daemon in `apps/notification-service/src/notification.module.ts`, preserving internal `HealthController` (`/healthz`, `/readyz`) and Prometheus metrics (`/metrics`) on container port 8005 for Kubernetes and APM observability.
  5. Zero database migrations (`RULE-DB-02`) (ADR 010).

### FF-ARCH-07 · 🏛️ Circular Event Loop & Redundant Consumer Assignment in work-order-service (Service Audit Issue A)

- **Root Cause**: When contractor bidding was relocated from `apps/dispatch-matching-service` to `apps/work-order-service` (ADR 007 / Finding 3), `BidsService.acceptBid()` implemented atomic in-transaction assignment (`PUBLISHED → ASSIGNED`), status history logging, and emitted both canonical `work_order.lifecycle.assigned` and `tech.bidding.accepted` (`EventType.TECH_BID_ACCEPTED`). However, `WorkOrderEventsConsumer` in `apps/work-order-service` retained its legacy subscription to `EventType.TECH_BID_ACCEPTED` on `fieldforge.work-orders.lifecycle-events`. When a bid was accepted, `work-order-service` published `tech.bidding.accepted` to RabbitMQ and then immediately consumed its own message, invoking `assignTechnicianFromBid()`. This triggered an unnecessary second pessimistic lock (`SELECT … FOR UPDATE`) and transaction attempt on `work_orders`, creating an intra-service circular message loop and risking redundant `WORK_ORDER_ASSIGNED` event emissions.
- **Fix**: Decoupled `work-order-service` from self-consumption of `tech.bidding.accepted`:
  1. Updated `WorkOrderEventsConsumer.onApplicationBootstrap()` in `apps/work-order-service/src/consumers/work-order-events.consumer.ts` to subscribe exclusively to `[EventType.PAYOUT_DISBURSED]`.
  2. Preserved `handleTechBidAccepted()` and `WorkOrdersService.assignTechnicianFromBid()` for programmatic or direct invocation without breaking unit test harnesses.
  3. Updated `apps/work-order-service/test/work-order-events.consumer.spec.ts` to assert that subscription routing keys strictly contain `[EventType.PAYOUT_DISBURSED]`.
  4. Updated `docs/MESSAGE_FLOW.md` routing table and queue definitions.
  5. Zero database migrations (`RULE-DB-02`).

### FF-ARCH-08 · 🏛️ Uncached Directory Lookups During Geo-Search (Service Audit Issue A)

- **Root Cause**: In `apps/dispatch-matching-service`, `GeoSearchService.findNearbyTechnicians()` hydrates contractor details (names, ratings, skills, verified badges) by calling `TechnicianDirectoryService.getTechniciansBatch(technicianIds)`. Previously, `TechnicianDirectoryService` executed an un-cached synchronous HTTP `POST /technicians/batch` call directly against `auth-service` on every geo-search and auto-routing query. Furthermore, the fallback URL was misconfigured with port `3001` (instead of standard auth-service port `8001`), and incoming `x-correlation-id` request headers were dropped rather than forwarded to the inter-service request. Under heavy dispatch querying, this caused severe HTTP fan-out, high latency, and vulnerability to network instability or auth-service saturation.
- **Fix**: Implemented multi-tier caching and correlation tracking:
  1. Implemented two-tier caching in `TechnicianDirectoryService`: Redis distributed cache (`tech:directory:<id>`) with a 300-second (5-minute) TTL and an in-memory fallback cache (`Map<string, MemoryCacheEntry>`) with proactive expiration.
  2. Implemented partial cache hit optimization: when a batch of technician IDs is requested, `getTechniciansBatch()` queries Redis (`MGET`) and the in-memory cache, isolates strictly uncached IDs to fetch over HTTP from `auth-service`, populates both Redis (`SETEX` pipeline) and in-memory caches, and merges the cached and freshly fetched records. When all technicians are cached, zero HTTP requests are dispatched.
  3. Corrected fallback `authServiceUrl` to `http://localhost:8001`, matching the platform service topology (`auth-service` on port 8001).
  4. Forwarded `x-correlation-id` from `DispatchController` (`/dispatch/nearby` and `/dispatch/auto-route/recommend`) through `GeoSearchService` to `TechnicianDirectoryService` HTTP requests.
  5. Registered and exported shared `redisProvider` (`REDIS_CLIENT`) in `DispatchModule` so both `GeoSearchService` and `TechnicianDirectoryService` share the existing Redis connection.
  6. Implemented cache invalidation (`invalidate(id)` and `clearMemoryCache()`).
  7. Added 12 unit tests in `apps/dispatch-matching-service/test/technician-directory.service.spec.ts` covering full cache miss, full cache hit, partial cache hit, `x-correlation-id` propagation, HTTP 500 / network error fallbacks, invalidation, and Redis failure in-memory fallback.
  8. Zero database migrations (`RULE-DB-02`).

### FF-ARCH-09 · 🏛️ No-Op Consumer Subscription on WORK_ORDER_ASSIGNED in billing-service (Service Audit Issue B)

- **Root Cause**: In `apps/billing-service`, `BillingConsumer` subscribed to `[EventType.WORK_ORDER_APPROVED, EventType.WORK_ORDER_ASSIGNED]` on queue `fieldforge.billing.work-orders`. When a work order was assigned, `BillingConsumer.handleWorkOrderAssigned()` was invoked solely to log an informational message with zero database writes, state changes, or financial operations. (Escrow funds are pre-authorized and held during order creation via `POST /billing/escrow/preauth`, and released upon `work_order.lifecycle.approved`). This no-op subscription forced RabbitMQ to replicate and dispatch every assignment event to `billing-service`, incurring AMQP deserialization, channel contention, and atomic 7-day Redis `SETNX` deduplication checks for no functional benefit.
- **Fix**: Decoupled `billing-service` from `work_order.lifecycle.assigned`:
  1. Updated `BillingConsumer.onApplicationBootstrap()` in `apps/billing-service/src/consumers/billing.consumer.ts` to strictly subscribe to `[EventType.WORK_ORDER_APPROVED]`.
  2. Annotated `handleWorkOrderAssigned()` with `@deprecated` clarifying that `billing-service` does not subscribe to this event and retaining it for programmatic backward compatibility.
  3. Updated `apps/billing-service/test/billing.consumer.spec.ts` asserting subscription strictly for `[EventType.WORK_ORDER_APPROVED]`.
  4. Updated `docs/MESSAGE_FLOW.md` routing table and Flow 2 sequence diagram.
  5. Zero database migrations (`RULE-DB-02`).

### FF-ARCH-10 · 🏛️ Order Settlement Asynchronous Cycle & Failure Compensation (Service Audit Issue A)

- **Root Cause**: The order settlement lifecycle forms an asynchronous saga loop across service boundaries: `work_order.lifecycle.approved` → `billing-service.releaseFunds()` → `billing.payout.disbursed` → `work-order-service.settlePaid()` → `work_order.lifecycle.paid`. If `billing-service` encountered an escrow release failure (banking gateway timeout, insufficient platform ledger funds, or database locking conflict), the message would dead-letter after 3 retries, but no failure event was published. Consequently, `work-order-service` was never notified of the failure, leaving the work order aggregate indefinitely stranded in `APPROVED` without any compensating state change or audit history. Furthermore, `settlePaid()` in `work-orders.service.ts` read `wo.budgetAmount` rather than using the actual disbursed `amountMinor` from the event payload, risking discrepancies in downstream notifications.
- **Fix**: Implemented complete event choreography and compensating rollback across `billing-service` and `work-order-service`:
  1. Added `EventType.PAYOUT_FAILED = 'billing.payout.failed'` to `EventType` enum and declared `PayoutFailedPayload` and `PayoutFailedEvent` in `@fieldforge/contracts`.
  2. Injected `EventPublisher` into `BillingConsumer` (`apps/billing-service`). Wrapped `releaseFunds()` in `try/catch`, publishing `PAYOUT_FAILED` with the failure reason and correlation context upon failure before re-throwing for DLQ handling.
  3. Updated `WorkOrderFsmService` (`apps/work-order-service`) to permit compensating rollback: `[WorkOrderStatus.APPROVED]: [WorkOrderStatus.PAID, WorkOrderStatus.COMPLETED]`.
  4. Updated `settlePaid()` in `WorkOrdersService` to accept `disbursedAmountMinor?: MinorUnits` and pass it directly to `payoutAmountMinor` in the `WORK_ORDER_PAID` event.
  5. Implemented `handlePayoutFailed()` in `WorkOrdersService`: safely and idempotently rolls back an `APPROVED` work order to `COMPLETED` and inserts a status history row with `reason: 'Payout disbursement failure: ' + reason` and `changedBy: 'billing-service'`.
  6. Updated `WorkOrderEventsConsumer` to subscribe `fieldforge.work-orders.lifecycle-events` to `[EventType.PAYOUT_DISBURSED, EventType.PAYOUT_FAILED]`, routing `PAYOUT_DISBURSED` with `amountMinor` and `PAYOUT_FAILED` to `handlePayoutFailed()`.
  7. Updated `docs/MESSAGE_FLOW.md` routing table and Flow 3 sequence diagram with the compensation branch.
  8. Added unit and integration tests across `billing-service` and `work-order-service`.
  9. Zero database migrations (`RULE-DB-02`).

### FF-ARCH-11 · 🏛️ Dormant / Orphaned Intra-Service Circular Loop (Service Audit Issue B)

- **Root Cause**: When contractor bidding was relocated from `apps/dispatch-matching-service` into `apps/work-order-service` (ADR 007 / Finding 3), commercial bid acceptance was unified into an atomic single-transaction workflow in `BidsService.acceptBid()`. In Phase 9 (ADR 005 / Finding 1), `work-order-service` had previously listened to `tech.bidding.accepted` to transition work orders to `ASSIGNED`. In FF-ARCH-07, `WorkOrderEventsConsumer` unsubscribed from `tech.bidding.accepted` to prevent self-consumption, redundant row locking, and an intra-service circular loop. However, `BidsService.acceptBid()` continued to publish `tech.bidding.accepted` to RabbitMQ alongside canonical `work_order.lifecycle.assigned`. Because zero consumers across the platform subscribe to `tech.bidding.accepted`, this publication was completely dormant and orphaned, wasting network I/O, CPU serialization, and publisher confirmation latency on every bid acceptance.
- **Fix**: Removed orphaned publication and consolidated lifecycle assignment events:
  1. Removed `publishTechBidAccepted(bidAcceptedEvent)` from `BidsService.acceptBid()` in `apps/work-order-service/src/modules/bids/bids.service.ts`.
  2. Maintained `publishWorkOrderAssigned(assignedEvent)` as the sole canonical domain event emitted upon bid acceptance.
  3. Annotated `publishTechBidAccepted()` with `@deprecated` in `apps/work-order-service/src/events/work-order-event.publisher.ts`.
  4. Updated unit test in `apps/work-order-service/test/bids.service.spec.ts` asserting that `publishWorkOrderAssigned` is called once and `publishTechBidAccepted` is not called.
  5. Updated `docs/MESSAGE_FLOW.md` and `.agent/context/api_contracts.md` marking `tech.bidding.accepted` as Deprecated / Retired.
  6. Zero database migrations (`RULE-DB-02`).

### FF-ARCH-12 · 🏛️ Message Loss Vulnerability & Premature ACK in IdempotentConsumer (Service Audit Item 7)

- **Root Cause**: In `packages/messaging/src/consumer/idempotent-consumer.ts:137-165`, consumer retry backoff was scheduled using Node.js in-memory `setTimeout(..., delayMs)` and the incoming message was acknowledged via `channel.ack(msg)` immediately on the consumer channel. This introduced three critical reliability vulnerabilities:
  1. **Premature Broker ACK**: The message was removed from RabbitMQ before the retry was enqueued or confirmed.
  2. **Process Volatility**: If the Node.js process crashed, restarted (e.g. during a rolling deploy), or ran out of memory during `delayMs` (1,000ms–4,000ms), the timer was destroyed with the event loop and the message was permanently lost.
  3. **Redis Lock Invalidation Race Condition**: `release(envelope.eventId)` deleted the Redis idempotency key up to 4 seconds before re-queueing, allowing parallel duplicate deliveries to acquire the lock while the retry timer was running.
- **Fix**: Replaced in-memory timers with broker-native RabbitMQ dead-letter retry queues and state-aware Redis idempotency:
  1. Updated `RabbitMQConnectionManager.assertQueueAndBind()` to declare a companion delay queue (`<queue>.retry`) for every worker queue with `x-dead-letter-exchange: ''` and `x-dead-letter-routing-key: queueName`.
  2. Updated `IdempotentConsumer.processMessage()` to publish retry messages durably to `<queue>.retry` with `persistent: true`, `expiration: String(delayMs)`, and `x-retry-count: nextRetry`. The original message is ACKed strictly after broker confirmation. If enqueueing fails, the message is routed to DLQ rather than dropped.
  3. Upgraded `RedisIdempotencyClient`:
     - Added `markRetrying(eventId, nextRetry)` setting Redis status to `'retrying:N'`, preventing fresh duplicate deliveries (`retryCount === 0`) from acquiring the lock while message waits in the broker queue.
     - Updated `tryAcquire(eventId, retryCount)` using an atomic Redis Lua script to allow legitimate broker retries (`retryCount > 0`) to re-acquire the lock into `'in-progress'` while blocking if already marked `'completed'`.
  4. Added unit and integration tests in `packages/messaging/test/idempotent-consumer.spec.ts` and `packages/messaging/test/redis-idempotency.spec.ts`.
  5. Updated `docs/MESSAGE_FLOW.md` with the broker-native delay queue topology and sequence diagrams.
  6. Zero database migrations (`RULE-DB-02`).

### FF-ARCH-13 · 🏛️ Payout Amount Disconnect Between Billing and Work Orders (Service Audit Issue A)

- **Root Cause**: When a work order was executed with an accepted contractor bid (e.g. $350.00 from a $500.00 max budget), multiple service disconnects occurred along the settlement and notification path:
  1. `WorkOrdersService.transition()` approved the work order and published `WORK_ORDER_APPROVED` with `payoutAmountMinor: toMinor(Number(wo.budgetAmount))` ($500.00), failing to check `workOrderBids` for the accepted bid.
  2. `BillingConsumer` passed `payoutAmountMinor` into `EscrowService.releaseFunds(workOrderId, technicianId, payoutAmountMinor, ...)`, but `EscrowService.releaseFunds()` omitted `legacyAmountMinor` from `params` and hardcoded disbursement to the full locked escrow amount `Math.round(Number(escrow.amountLocked) * 100)`.
  3. The unused escrow remainder ($150.00) remained unaccounted for and was never refunded to the buyer.
  4. `PayoutDisbursedPayload` lacked `buyerId`, creating a contract discrepancy with `WorkOrderPaidPayload`.
  5. Notifications sent by `NotificationConsumer` reported inaccurate payout amounts.
- **Fix**: Implemented complete financial reconciliation across contracts, work orders, and billing:
  1. Added `buyerId?: string` to `PayoutDisbursedPayload` in `packages/contracts/src/events/payment.events.ts`.
  2. Updated `WorkOrdersService.transition()` (`apps/work-order-service`) to query `workOrderBids` for an `ACCEPTED` bid, setting `payoutAmountMinor` in `WORK_ORDER_APPROVED` and `agreedRateMinor` in `WORK_ORDER_ASSIGNED` to the actual agreed rate if present.
  3. Updated `WorkOrdersService.settlePaid()` to query `workOrderBids` for the accepted rate if `disbursedAmountMinor` is omitted.
  4. Added `amountMinor?: MinorUnits` to `ReleaseEscrowParams` in `apps/billing-service/src/modules/escrow/escrow.service.ts`.
  5. Updated `EscrowService.releaseFunds()` to accept `amountMinor`, validate limits (`0 < amountMinor <= lockedMinor`), disburse the exact amount to the technician, and automatically execute `paymentProvider.refundEscrow()` for the unused remainder to the buyer.
  6. Added comprehensive unit tests in `apps/work-order-service/test/work-orders.service.spec.ts` and `apps/billing-service/test/escrow.service.spec.ts`.
  7. Updated `docs/MESSAGE_FLOW.md` sequence diagrams and `docs/DEVELOPMENT_PLAN.md`.
  8. Zero database migrations (`RULE-DB-02`).

### FF-ARCH-14 · 🏛️ Property Naming Inconsistency for Technician Identifiers (Service Audit Issue B)

- **Root Cause**: Technician identifiers were inconsistently named across the repository: Drizzle database schemas, SQL columns, `BidDetailsDto`, `PayoutLedgerItemDto`, and `TechnicianEarningsDto` used `technicianId`, while AMQP domain event payloads, `NearbyTechnicianDto`, and various service/frontend parameters used the shorthand `techId`. This caused unnecessary mapping friction and ambiguous naming contracts.
- **Fix**: Standardized technician identifier naming strictly on **`technicianId: string`** across the entire application with zero backward compatibility fallbacks:
  1. Updated all AMQP event contracts in `packages/contracts/src/events/` (`WorkOrderAssignedPayload`, `WorkOrderApprovedPayload`, `WorkOrderPaidPayload`, `TechBiddingSubmittedPayload`, `TechBidAcceptedPayload`, `PayoutDisbursedPayload`, `PayoutFailedPayload`) to define `technicianId: string`.
  2. Updated `NearbyTechnicianDto` in `packages/contracts/src/dto/dispatch.dto.ts` to define `technicianId: string`.
  3. Updated services (`apps/work-order-service`, `apps/billing-service`, `apps/dispatch-matching-service`, `apps/auth-service`, `apps/notification-service`) to strictly use `technicianId`.
  4. Updated web portal slices and components in `apps/web-buyer-portal` (`dispatchSlice`, `workOrderSlice`, `api.ts`, `TechnicianMatchingRadar.tsx`, fixtures).
  5. Updated all affected unit and contract tests across packages and services.
  6. Updated `.agent/context/api_contracts.md` and `.agent/context/project_status.md`.
  7. Zero database migrations (`RULE-DB-02`) — database schemas were already 100% aligned with `technicianId`.

### FF-CODE-01 · 🧹 authenticateUser Boilerplate Duplication Across Microservice Controllers (Code Quality Issue 1)

- **Root Cause**: Identity verification and C5 trust-boundary enforcement were copy-pasted across 6 backend microservice controllers (`WorkOrdersController`, `BidsController`, `BillingController`, `DispatchController`, `UsersController`, and `CertificationsController`), duplicating ~180 lines of identical Bearer token parsing, signature verification, and gateway header anti-spoofing logic (`x-ff-user-id` vs `token.sub`).
- **Fix**: Centralized gateway user authentication in `@fieldforge/common`:
  1. Created `packages/common/src/auth/gateway-auth.ts` defining `verifyGatewayUser()`, `AuthenticatedUser`, `JwtVerifier`, `GatewayAuthGuard`, and `@CurrentUser()` decorator.
  2. Added `@fieldforge/contracts` workspace dependency to `packages/common/package.json`.
  3. Replaced duplicate `authenticateUser` implementations across `WorkOrdersController`, `BidsController`, `BillingController`, and `DispatchController` with direct delegations to `verifyGatewayUser(this.jwtService, authHeader, gatewayUserId, gatewayProfileId)`.
  4. Refactored `UsersController.getProfile` and `CertificationsController` in `apps/auth-service` to use `verifyGatewayUser`.
  5. Added comprehensive test suites in `packages/common/test/gateway-auth.spec.ts` (9 tests) and `apps/billing-service/test/billing.controller.spec.ts` (4 tests).
  6. Zero database migrations (`RULE-DB-02`).

### FF-CODE-02 · 🧹 Triplicate Implementation of Work Order Assignment Business Logic (Code Quality Issue 2)

- **Root Cause**: Work order assignment to a technician (transitioning status to `ASSIGNED`, setting `assignedTechnicianId`, recording transition history in `workOrderStatusHistory`, and publishing `EventType.WORK_ORDER_ASSIGNED`) was copy-pasted across three separate methods in `apps/work-order-service`:
  1. `BidsService.acceptBid()` (lines 268–289 & 315–330)
  2. `WorkOrdersService.transition()` (lines 501–521 & 530–552)
  3. `WorkOrdersService.assignTechnicianFromBid()` (lines 785–803 & 820–823)
     This caused drift risk between direct manual transitions, bid acceptance, and event-driven assignments, duplicated SQL updates and event envelope construction, and resulted in inconsistent agreed rate lookups.
- **Fix**: Centralized work order assignment logic and agreed rate resolution in `apps/work-order-service`:
  1. Created `apps/work-order-service/src/modules/work-orders/work-order-assignment.ts` exporting `executeWorkOrderAssignment()` and `resolveAgreedRateMinor()`.
  2. Atomically updates `workOrders` and records transition history in `workOrderStatusHistory` within the caller's active Drizzle transaction `tx`.
  3. Returns `now`, the canonical `WORK_ORDER_ASSIGNED` event, and an atomic `publishEvent` callback so the caller can emit the event after transaction completion.
  4. Refactored `BidsService.acceptBid()` to delegate to `executeWorkOrderAssignment()` while preserving constructor signatures and test mocks.
  5. Refactored `WorkOrdersService.transition()` and `WorkOrdersService.assignTechnicianFromBid()` to delegate to `executeWorkOrderAssignment()` and `resolveAgreedRateMinor()`.
  6. Added public `executeAssignment(tx, params)` method to `WorkOrdersService`.
  7. Added unit test suite `apps/work-order-service/test/work-order-assignment.spec.ts` (6 tests).
  8. Zero database migrations (`RULE-DB-02`).

### FF-CODE-03 · 🧹 Monolithic transition Method Violating Single Responsibility & Open/Closed (Code Quality Issue 3)

- **Root Cause**: In `apps/work-order-service/src/modules/work-orders/work-orders.service.ts`, `WorkOrdersService.transition()` was a monolithic method spanning ~260 lines that conflated orchestration, transaction locking, status authorization checks, profile identity lookups, geofence validations, state mutations, and event envelope construction. Every target state was handled in a large procedural `if/else` block, violating the Single Responsibility Principle (SRP) and Open/Closed Principle (OCP). Adding a new status or lifecycle rule required modifying the core orchestration method. Furthermore, 5 separate branches repeatedly duplicated queries on `buyerProfiles` and `technicianProfiles`.
- **Fix**: Decoupled `transition()` into modular, single-responsibility guards and execution strategies:
  1. Created `apps/work-order-service/src/modules/work-orders/work-order-transition.ts` defining `TransitionContext`, `TransitionExecutionResult`, `TransitionGuard`, and `TransitionExecutionStrategy`.
  2. Implemented reusable cached profile identity resolution helpers: `resolveBuyerProfileId()` and `resolveTechnicianProfileId()`, utilizing caller-provided IDs when available to eliminate redundant DB lookups.
  3. Decomposed state authorization into modular transition guards:
     - `guardAssignedTransition`: validates technician existence, assignment target, and buyer/admin authorization.
     - `guardTechnicianLifecycleTransition`: enforces that only the assigned technician (or admin) can advance to `EN_ROUTE`, `ON_SITE`, or `COMPLETED`.
     - `guardOnSiteTransition`: validates geo-coordinates and strictly enforces Haversine 200m geofence tolerance.
     - `guardApprovedTransition`: enforces buyer/admin authorization and disallows technician self-approval.
     - `guardCancelledTransition`: enforces buyer/admin authorization for cancellation.
     - `guardDisputedTransition`: enforces buyer/admin authorization for disputes.
     - `guardPaidTransition`: strictly rejects manual transitions to `PAID` (enforcing settlement saga via AMQP).
  4. Decomposed state mutations and event factories into modular execution strategies:
     - `executeAssignedTransition`: delegates atomically to `executeWorkOrderAssignment()`.
     - `executeApprovedTransition`: atomically transitions to `APPROVED`, resolves accepted contractor bid rate or falls back to budget, and constructs canonical `WORK_ORDER_APPROVED` event.
     - `executeDefaultTransition`: handles standard transitions (`IN_PROGRESS`, `EN_ROUTE`, `ON_SITE`, `COMPLETED`, `CANCELLED`, `DISPUTED`), updates status, and constructs generic `WORK_ORDER_STATUS_UPDATED` event.
  5. Refactored `WorkOrdersService.transition()` into a concise (~35 lines) transaction orchestrator: acquires `SELECT ... FOR UPDATE` lock, validates FSM graph via `WorkOrderFsmService`, resolves caller profile identity, executes target guard, executes target strategy, commits transaction, and publishes domain event.
  6. Created unit test suite `apps/work-order-service/test/work-order-transition.spec.ts` (24 tests) verifying all transition guards and execution strategies in isolation.
  7. Zero database migrations (`RULE-DB-02`).

### FF-CODE-04 · 🧹 Direct Database Schema Cross-Querying Across Bounded Contexts (Code Quality Issue 4)

- **Root Cause**: `apps/billing-service` and `apps/work-order-service` violated Domain-Driven Design bounded context isolation (`RULE-ARCH-01`, ADR 006) by directly importing and executing SQL queries against foreign schema tables from `@fieldforge/database`:
  - `billing-service/src/modules/escrow/escrow.service.ts`: imported `usersSchema` and `workOrdersSchema`, queried and locked `workOrders` row `FOR UPDATE`, and queried `buyerProfiles`.
  - `billing-service/src/controllers/billing.controller.ts`: imported `usersSchema` and queried `buyerProfiles` and `technicianProfiles`.
  - `work-order-service/src/modules/work-orders/work-orders.service.ts`: imported `usersSchema` and queried `buyerProfiles`.
  - `work-order-service/src/modules/work-orders/work-order-transition.ts`: imported `usersSchema` and queried `buyerProfiles` and `technicianProfiles`.
  - `work-order-service/src/modules/bids/bids.service.ts`: imported `usersSchema` and queried `buyerProfiles` and `technicianProfiles`.
  - `work-order-service/src/modules/deliverables/deliverables.service.ts`: imported `usersSchema` and queried `buyerProfiles` and `technicianProfiles`.
    These cross-context queries coupled the services tightly to foreign database tables, prevented schema independence, and breached autonomous service boundaries.
- **Fix**: Decoupled both services using token-embedded fast-paths, inter-service directory REST services, and canonical event payloads:
  1. Updated `@fieldforge/contracts` (`dto/auth.dto.ts`) with `UserProfileResponseDto`, `BuyerProfileDto`, and `TechnicianProfileDto`.
  2. Exposed `GET /users/:id/profile` on `UsersController` in `apps/auth-service` to return aggregated user, buyer, and technician profiles over REST.
  3. Implemented `@Injectable()` `ProfileDirectoryService` in `@fieldforge/common` (`directory/profile-directory.service.ts`) with:
     - Zero-network fast-path using `callerProfileId` from verified JWT / asserted gateway header;
     - Local test mock store via `setLocalProfile()`;
     - 300-second TTL in-memory LRU cache;
     - Resilient REST fetch to `auth-service` `GET /users/:id/profile` with correlation ID propagation.
  4. Implemented `@Injectable()` `WorkOrderDirectoryService` in `apps/billing-service` (`modules/work-orders/work-order-directory.service.ts`) with 60-second TTL caching and `setLocalWorkOrder()` test store.
  5. Refactored `apps/billing-service`:
     - `EscrowService`: Removed `usersSchema` and `workOrdersSchema`. Injected `WorkOrderDirectoryService` and `ProfileDirectoryService`. Automated payouts now disburse directly via event payloads; manual/API calls resolve work order details via directory lookup.
     - `BillingController`: Replaced foreign schema queries in `preAuthEscrow` and `getTechnicianPayouts` with `ProfileDirectoryService`.
     - `BillingConsumer`: Passes `buyerId` from canonical `WORK_ORDER_APPROVED` payload directly to `releaseFunds()`.
  6. Refactored `apps/work-order-service`:
     - Injected `ProfileDirectoryService` into `WorkOrdersService`, `BidsService`, `DeliverablesService`, and `work-order-transition.ts`.
     - Purged all `usersSchema`, `buyerProfiles`, and `technicianProfiles` imports from all services.
  7. Registered `ProfileDirectoryService` and `WorkOrderDirectoryService` in NestJS dependency injection modules.
  8. Created unit test suite `packages/common/test/profile-directory.spec.ts` (31 tests) and added unit tests in `auth-service`, `billing-service`, and `work-order-service`.
  9. Zero database migrations (`RULE-DB-02`).

### FF-CODE-05 · 🆔 Inconsistent Identifier Semantics Across Schemas (technicianId vs userId) (Code Quality Issue 5)

- **Root Cause**: Inconsistent semantics between IAM account identifier (`userId`, referencing `users.id`) and marketplace profile identifier (`technicianId`, referencing `technician_profiles.id`):
  1. In `packages/database/src/schemas/users.schema.ts`, `technician_certifications.technician_id` was configured with a foreign key referencing `users.id`, whereas all other tables in the repository (`work_order_bids.technician_id`, `work_orders.assigned_technician_id`, `payout_ledger.technician_id`), Redis spatial indexes (`tech:locations`), and batch directory APIs (`getTechniciansBatch`) defined `technicianId` as referencing `technician_profiles.id`.
  2. Because of this foreign key misalignment, database seeds (`packages/database/src/seeds/index.ts`) inserted `tech1UserId` into `technician_certifications` instead of `tech1ProfileId`.
  3. In `apps/auth-service/src/modules/vetting/certifications.service.ts`, `getTechniciansBatch(ids: string[])` receives `technicianProfiles.id` values, selects from `technicianProfiles`, and then executed `WHERE technicianCertifications.technicianId IN (ids)` — which matched 0 rows because the table stored user IDs, resulting in empty badge arrays returned to dispatch matching.
  4. In `apps/auth-service/src/modules/vetting/certifications.controller.ts`, `addCertification()` passed `user.userId` rather than `user.profileId`.
  5. In `apps/dispatch-matching-service/src/modules/dispatch/dispatch.controller.ts`, `updateLocation()` passed `user.userId` to `GeoSearchService.updateTechnicianLocation()`, causing Redis to index `userId` and `UPDATE technician_profiles` to match 0 rows (`WHERE id = userId`).
- **Fix**: Harmonized identifier semantics across schemas, vetting services, location indexing, and migrations:
  1. Updated `packages/database/src/schemas/users.schema.ts` to point `technicianCertifications.technicianId` foreign key to `technicianProfiles.id` with cascade deletion and explicit 28-character constraint name `tech_certs_technician_id_fk` (respecting MySQL's 64-character identifier limit).
  2. Generated and applied migration `0006_green_wild_pack.sql` via `pnpm run db:generate` and `pnpm run db:migrate` per `RULE-DB-02`.
  3. Updated `packages/database/src/seeds/index.ts` so `seedTechnicianCertifications` links to `tech1ProfileId` and `tech2ProfileId`.
  4. Refactored `apps/auth-service/src/modules/vetting/certifications.controller.ts`:
     - Injected `@Optional() ProfilesService` and updated `addCertification()` to derive `technicianId` from `user.profileId` with fallback resolution via `resolveProfileId()`.
  5. Refactored `apps/auth-service/src/modules/vetting/certifications.service.ts`:
     - Updated `addCertification(technicianId, dto)` to accept and persist `technicianId` (profile ID).
     - Enhanced `getTechnicianBadges(technicianIdOrUserId)` with robust bidirectional fallback: checks direct `technician_id` match first, and if 0 rows, resolves profile ID from `userId` (preserving full backwards compatibility).
     - `getTechniciansBatch(ids: string[])` now directly and accurately matches certifications for contractor profile IDs.
  6. Refactored `apps/dispatch-matching-service/src/modules/dispatch/dispatch.controller.ts`:
     - `updateLocation()` now prefers `user.profileId` with fallback to `user.userId`.
  7. Refactored `apps/dispatch-matching-service/src/modules/geo-search/geo-search.service.ts`:
     - `updateTechnicianLocation()` updates `technicianProfiles` coordinates by `technicianId`, and includes fallback resolution to look up `technician_profiles` by `userId` if 0 rows were updated, guaranteeing that Redis `tech:locations` always indexes the profile ID.
  8. Updated and added automated tests in `auth-service` and `dispatch-matching-service`:
     - `certifications.controller.spec.ts`: verified `profileId` extraction from token and resolution via `ProfilesService`.
     - `certifications.service.spec.ts`: verified `getTechniciansBatch` populated badges and `getTechnicianBadges` dual-lookup fallback.
     - `dispatch.controller.spec.ts`: verified `profileId` derivation from token and gateway headers.

### FF-CODE-06 · 🧹 Ad-Hoc Request Body Validation Across Microservices (Code Quality Issue 6)

- **Root Cause**: Request body and query parameter validation was implemented inconsistently and in an ad-hoc fashion across backend microservices:
  1. `apps/auth-service` (`auth.controller.ts` and `certifications.controller.ts`): duplicated 8 instances of boilerplate `const parsed = schema.safeParse(body); if (!parsed.success) throw new BadRequestException(parsed.error.issues);`.
  2. `apps/work-order-service` (`work-orders.controller.ts`, `bids.controller.ts`) and `apps/billing-service` (`billing.controller.ts`): called `schema.parse(body)` directly inside handler methods.
  3. `apps/dispatch-matching-service` (`dispatch.controller.ts`): `autoRouteRecommend` had **no schema validation at all**, accepting an arbitrary untyped payload `{ latitude?: number; longitude?: number; ... }` and completely ignoring `autoRouteSchema`.
  4. **Critical Error Boundary Flaw**: `GlobalHttpExceptionFilter` in `packages/common/src/exceptions/http-exception.filter.ts` checked only `exception instanceof HttpException`. Whenever `schema.parse(body)` failed and threw a raw `ZodError`, because `ZodError` extends standard JavaScript `Error` rather than Nest's `HttpException`, the filter classified it as an unhandled internal error and returned **`500 INTERNAL_SERVER_ERROR`** instead of **`400 BAD_REQUEST`**, turning client input errors into false platform error spikes.
- **Fix**: Centralized declarative Zod validation via NestJS pipes and fixed the exception filter:
  1. Implemented `@Injectable()` `ZodValidationPipe` in `@fieldforge/common` (`pipes/zod-validation.pipe.ts`):
     - Automatically validates request payloads (`body`, `query`, `param`) against Zod schemas.
     - On validation failure, throws standard `BadRequestException({ message: 'Validation failed', errors: result.error.issues })`.
     - Provides static `ZodValidationPipe.validate<T>(schema, value): T` helper for merged parameter validations.
     - Exported from `@fieldforge/common` and added `zod` to `packages/common/package.json`.
  2. Enhanced `GlobalHttpExceptionFilter` in `packages/common/src/exceptions/http-exception.filter.ts`:
     - Detects `ZodError` (`exception instanceof ZodError || (exception as Error)?.name === 'ZodError'`).
     - Maps raw Zod errors to `HttpStatus.BAD_REQUEST` (400).
     - Formats the response payload consistently with `{ statusCode: 400, timestamp, path, correlationId, error: { message: 'Validation failed', errors: exception.issues } }`.
  3. Harmonized `autoRouteSchema` and `AutoRouteDto` in `@fieldforge/contracts` to support optional coordinate overrides (`latitude`, `longitude`, `workOrderId`, `maxRadiusMiles`) with proper bounds checking.
  4. Refactored microservice controllers to use `@Body(new ZodValidationPipe(schema))` and `@Query(new ZodValidationPipe(schema))`:
     - `auth.controller.ts`: all 5 endpoints (`register`, `login`, `refresh`, `sendPhoneOtp`, `verifyPhoneOtp`).
     - `certifications.controller.ts`: `addCertification`, `verifyCertification`, `getBatchTechnicians`.
     - `work-orders.controller.ts`: `create`, `list`, `transition`, `transitionPlural`, `updateStatus`, `getPresignedUploadUrl`, `recordSignature`, `recordDeliverableSignature`.
     - `bids.controller.ts`: `submitBidOnWorkOrder` uses `ZodValidationPipe.validate()`; `submitBidLegacy` uses `ZodValidationPipe`.
     - `billing.controller.ts`: `preAuthEscrow`, `releaseEscrow`.
     - `dispatch.controller.ts`: `updateLocation`, `findNearby`, and `autoRouteRecommend` (now strictly validated against `autoRouteSchema`).
  5. Added comprehensive automated test suites:
     - `packages/common/test/zod-validation.pipe.spec.ts` (6 tests).
     - `packages/common/test/http-exception.filter.spec.ts` (8 tests).
     - `apps/auth-service/test/auth.controller.spec.ts` (7 tests).
     - Updated `certifications.controller.spec.ts`, `dispatch.controller.spec.ts`, `work-orders.controller.spec.ts`, and `validators.spec.ts`.
  6. Zero database migrations (`RULE-DB-02`).

### FF-CODE-07 · 🧹 Low-Level PDF Drawing Embedded Inside Billing Domain Service (Code Quality Issue 7)

- **Root Cause**: In `apps/billing-service/src/modules/invoices/invoices.service.ts`, `InvoicesService.generateInvoicePdf(id)` directly instantiated `PDFDocument` from `pdfkit` and intermingled ~80 lines of procedural, imperative coordinate/canvas drawing instructions (`doc.fontSize().text()`, `doc.moveTo().lineTo().stroke()`, table rendering math, stream event listeners) directly alongside domain logic. This violated the Single Responsibility Principle (SRP) and Hexagonal Architecture / Clean Architecture boundaries (`RULE-ARCH-01`). Unit testing `InvoicesService` required either running the heavy imperative canvas renderer or complex mocking of PDFKit document streams, preventing swapping the PDF generation engine (e.g., HTML-to-PDF, Weasyprint, serverless rendering worker) without modifying domain services.
- **Fix**: Decoupled PDF generation using Ports & Adapters (Hexagonal Architecture):
  1. Declared secondary port `InvoicePdfRendererPort` and injection symbol `INVOICE_PDF_RENDERER` in `apps/billing-service/src/modules/invoices/invoice-pdf.renderer.port.ts` with contract `render(invoice: InvoiceWithRelations): Promise<Buffer>`.
  2. Implemented `PdfKitInvoicePdfRenderer` in `apps/billing-service/src/modules/invoices/pdfkit-invoice-pdf.renderer.ts` implementing `InvoicePdfRendererPort`. Isolates all imperative PDFKit drawing, fonts, header metadata (`/Producer`, `/Title`), line items table, and SHA-256 cryptographic content-hash audit footer into a dedicated adapter.
  3. Refactored `InvoicesService` in `apps/billing-service/src/modules/invoices/invoices.service.ts` to inject `@Optional() @Inject(INVOICE_PDF_RENDERER) private readonly pdfRenderer: InvoicePdfRendererPort` with fallback to `PdfKitInvoicePdfRenderer`. `generateInvoicePdf(id)` now loads the invoice and delegates directly to `this.pdfRenderer.render(invoice)`.
  4. Registered and exported `INVOICE_PDF_RENDERER` provider and `PdfKitInvoicePdfRenderer` in `BillingModule` (`apps/billing-service/src/billing.module.ts`).
  5. Added unit test suite `apps/billing-service/test/pdfkit-invoice-pdf.renderer.spec.ts` (5 tests) asserting PDF headers (`%PDF-`), trailers (`%%EOF`), metadata catalog, amount formatting, and error handling.
  6. Updated `apps/billing-service/test/invoices.service.spec.ts` verifying delegation to injected `InvoicePdfRendererPort`, fallback renderer, and `NotFoundException`.
  7. Zero database migrations (`RULE-DB-02`).

### FF-CODE-08 · 🧹 Dispatch Candidate Scoring Embedded in Redis Spatial Search Service (Code Quality Issue 8)

- **Root Cause**: In `apps/dispatch-matching-service/src/modules/geo-search/geo-search.service.ts`, `GeoSearchService` combined two fundamentally distinct architectural concerns:
  1. Low-level Redis geospatial indexing, connection lifecycle, and spatial radius querying (`GEOADD`, `GEOSEARCH`).
  2. Domain business logic for multi-factor candidate scoring (~45 lines of mathematical calculations evaluating proximity curves, 5-star ratings, job completion caps, and required certification matching) and candidate ranking.
     This violated the Single Responsibility Principle (SRP) and Open/Closed Principle (OCP). Hardcoding scoring weights (40% distance, 30% rating, 15% experience, 15% certifications) inside the geospatial retrieval loop prevented customizing scoring policies (e.g. prioritizing speed/proximity for emergency jobs vs qualifications for complex enterprise repairs). Furthermore, testing the scoring math required spinning up or mocking Redis and database/directory clients.
- **Fix**: Decoupled candidate scoring using Ports & Adapters:
  1. Declared `CandidateScoringWeights`, `CandidateScoringInput`, `CandidateScoreBreakdown`, `ScoredCandidate`, `CandidateScorerPort`, and injection token `CANDIDATE_SCORER` in `apps/dispatch-matching-service/src/modules/scoring/candidate-scorer.interface.ts`.
  2. Implemented `@Injectable() CandidateScoringService` implementing `CandidateScorerPort` in `apps/dispatch-matching-service/src/modules/scoring/candidate-scoring.service.ts`. Evaluates multi-parameter composite scores (distance, rating, experience, certifications) with configurable weight overrides, and ranks candidates descending by score with proximity tie-breaking.
  3. Refactored `GeoSearchService` in `apps/dispatch-matching-service/src/modules/geo-search/geo-search.service.ts` to inject `@Optional() @Inject(CANDIDATE_SCORER) private readonly scorer: CandidateScorerPort` with default fallback `new CandidateScoringService()`. Replaced inline scoring loop with `this.scorer.rankCandidates(candidateInputs)`.
  4. Registered and exported `CandidateScoringService` and `CANDIDATE_SCORER` in `DispatchModule` (`apps/dispatch-matching-service/src/dispatch.module.ts`).
  5. Added comprehensive unit test suite `apps/dispatch-matching-service/test/candidate-scoring.service.spec.ts` (24 tests) validating mathematical boundary conditions (distance clamping, rating normalization, experience scaling, certification match ratios, and custom weights).
  6. Updated `apps/dispatch-matching-service/test/geo-search.service.spec.ts` to verify delegation to injected `CandidateScorerPort` mock.
  7. Zero database migrations (`RULE-DB-02`).

### FF-CODE-09 · 🧹 Untyped Transaction Parameters (`tx: unknown`) (Code Quality Issue 9)

- **Root Cause**: Several cross-service domain methods and unit test doubles handled database transactions via untyped `tx: unknown` or `dbOrTx: unknown` parameters, bypassing TypeScript static safety and forcing runtime/compile-time escape hatches:
  1. `InvoicesService.generateInvoiceWithTx(tx: unknown, ...)` in `apps/billing-service/src/modules/invoices/invoices.service.ts` bypassed compiler type checking and used an unsafe type assertion `const database = (tx as DrizzleClient) || this.db;`.
  2. `ProfilesService.provisionProfile(dbOrTx: unknown, ...)` in `apps/auth-service/src/modules/profiles/profiles.service.ts` bypassed type checking and used `const executor = (dbOrTx as DrizzleClient) || this.db;`.
  3. `work-order-assignment.ts` in `apps/work-order-service` attempted to work around the missing exports by manually extracting `Parameters<Parameters<MySql2Database<Record<string, unknown>>['transaction']>[0]>[0]` without schema binding.
  4. `BidsService` and `GeoSearchService` typed the injected database client as `MySql2Database<Record<string, unknown>>` rather than the schema-bound `DrizzleClient`.
  5. Test doubles in `billing-service`, `auth-service`, and `work-order-service` relied on untyped `(tx: unknown)` callbacks for `db.transaction()` mocks.
- **Fix**: Centralized canonical Drizzle transaction types in `@fieldforge/database` and `@fieldforge/common`, and typed all transaction-aware services:
  1. Exported canonical `DatabaseSchema`, `DatabaseClient`, `DatabaseTransaction`, and `DbOrTx` from `packages/database/src/index.ts`.
  2. Exported `DrizzleClient`, `DrizzleTransaction`, `DbOrTx`, and `DatabaseOrTransaction` from `packages/common/src/database/drizzle.module.ts` and `packages/common/src/index.ts`.
  3. Refactored `InvoicesService.generateInvoiceWithTx(tx: DbOrTx | undefined, ...)` to use `const database = tx ?? this.db;`, eliminating the `(tx as DrizzleClient)` cast.
  4. Refactored `ProfilesService.provisionProfile(dbOrTx: DbOrTx | undefined, ...)` to use `const executor = dbOrTx ?? this.db;`, eliminating the `(dbOrTx as DrizzleClient)` cast.
  5. Refactored `work-order-assignment.ts` to import canonical `DrizzleTransaction` and `DbOrTx` from `@fieldforge/common` and alias `export type AssignmentDbTx = DbOrTx;`, preserving 100% backward compatibility.
  6. Refactored `BidsService` and `GeoSearchService` to inject `DrizzleClient` from `@fieldforge/common` instead of ad-hoc `MySql2Database<Record<string, unknown>>`.
  7. Updated transaction test mocks across `escrow.service.spec.ts`, `invoices.service.spec.ts`, `auth.service.spec.ts`, `profiles.service.spec.ts`, `work-orders.service.spec.ts`, and `bids.service.spec.ts` with strongly typed `DrizzleTransaction` and `DbOrTx`.
  8. Zero database migrations (`RULE-DB-02`).

### FF-CODE-10 · 🧹 Repeated Ad-Hoc Profile ID Resolution Across Services (Code Quality Issue 10)

- **Root Cause**: Resolving a user ID into an associated domain profile ID (`buyerProfiles` or `technicianProfiles`) was repeated across multiple controllers and domain services in `work-order-service`, `billing-service`, `auth-service`, and `dispatch-matching-service`. Service methods repeatedly executed ad-hoc lookups, null checks, and error throwing boilerplate (`if (!resolvedId) throw new NotFoundException(...)` / `ForbiddenException`), leading to widespread code duplication and DRY violations:
  1. `apps/work-order-service/src/modules/work-orders/work-orders.service.ts`: `create()` and `publish()` repeated buyer profile lookups and error validation.
  2. `apps/work-order-service/src/modules/deliverables/deliverables.service.ts`: `uploadDeliverable()`, `recordSignature()`, and `getDeliverables()` repeated technician and buyer profile lookups.
  3. `apps/work-order-service/src/modules/bids/bids.service.ts`: `submitBid()`, `acceptBid()`, and `listBidsForWorkOrder()` repeated manual profile lookups and null assertions.
  4. `apps/work-order-service/src/modules/work-orders/work-order-transition.ts`: maintained redundant local resolver functions with dummy transaction arguments.
  5. `apps/billing-service/src/controllers/billing.controller.ts`: `preAuthEscrow()` and `getTechnicianPayouts()` implemented ad-hoc resolution and error branching.
  6. `apps/billing-service/src/modules/escrow/escrow.service.ts`: `releaseFunds()` resolved buyer profile ID via dedicated methods rather than unified profile resolution.
  7. `apps/auth-service/src/modules/vetting/certifications.service.ts`: performed direct fallback queries against `technicianProfiles` rather than delegating to `ProfilesService`.
  8. `apps/dispatch-matching-service/src/modules/geo-search/geo-search.service.ts`: performed direct fallback queries against `technicianProfiles` rather than delegating to profile directory resolution.
- **Fix**: Centralized profile ID resolution into `@fieldforge/common` and `apps/auth-service`:
  1. Enhanced `ProfileDirectoryService` in `@fieldforge/common` with unified `resolveProfileId(userId, role, callerProfileId, correlationId)` and `resolveProfileIdOrThrow(userId, role, callerProfileId, correlationId, notFoundMessage)`.
  2. Enhanced `ProfilesService` in `apps/auth-service` with case-insensitive `resolveProfileId(userId, role)` and `resolveUserIdByProfileId(profileId, role)`.
  3. Refactored `apps/billing-service`: `BillingController.preAuthEscrow()` utilizes `resolveProfileIdOrThrow()`, and `BillingController.getTechnicianPayouts()` and `EscrowService.releaseFunds()` use `resolveProfileId()`.
  4. Refactored `apps/work-order-service`: `WorkOrdersService.create()` uses `resolveProfileIdOrThrow()`, and `WorkOrdersService.publish()`, `DeliverablesService`, and `BidsService` use `resolveProfileId()`.
  5. Refactored `work-order-transition.ts`: exported unified `resolveProfileId()` and delegated `resolveBuyerProfileId` and `resolveTechnicianProfileId` to it.
  6. Refactored `apps/auth-service`: `CertificationsService` delegates profile ID and user ID resolution to `ProfilesService`.
  7. Refactored `apps/dispatch-matching-service`: `GeoSearchService` injects `ProfileDirectoryService` for technician profile resolution fallback, registered in `DispatchModule`.
  8. Added unit test suites for `resolveProfileId` and `resolveProfileIdOrThrow` in `packages/common/test/profile-directory.spec.ts` (10 new tests), `apps/auth-service/test/profiles.service.spec.ts` (3 new tests), and `apps/work-order-service/test/work-order-transition.spec.ts` (2 new tests). Total unit tests increased to 640.
  9. Zero database migrations (`RULE-DB-02`).

### FF-CODE-11 · 🧹 In-Memory Mocks Embedded in Production Service Classes (Code Quality Issue 11)

- **Root Cause**: In `apps/auth-service/src/modules/vetting/certifications.service.ts`, hardcoded mock data fixtures (`private readonly mockCertifications: Record<string, TechnicianBadgeDto[]>`) and conditional `if (this.db) { ... } else return this.mockCertifications` logic were embedded directly inside the production service class. This antipattern treated the database dependency as optional in production code, introducing dead branch complexity and over-engineering. Unit tests historically instantiated the service with `new CertificationsService()` without passing a database client, bypassing the Drizzle repository layer.
- **Fix**: Purged embedded mock fixtures from production code and required mandatory database injection:
  1. Removed `mockCertifications` and all `if (this.db)` conditional branches from `CertificationsService` in `apps/auth-service/src/modules/vetting/certifications.service.ts`.
  2. Made `@Inject(DRIZZLE) private readonly db: DrizzleClient` a mandatory constructor dependency (removed optional fallback).
  3. Installed `@nestjs/testing` in `apps/auth-service` and updated `apps/auth-service/test/certifications.service.spec.ts` to instantiate `CertificationsService` via `Test.createTestingModule()` with a typed mock database client double providing deterministic repository simulation.
  4. Added test asserting `NotFoundException` when verifying non-existent certifications. Total unit tests in `auth-service` increased to 77 (+1 test, 641 total across the monorepo).
  5. Zero database migrations (`RULE-DB-02`).

### FF-CODE-12 · 🧹 Defensive Duck-Typing to Mask Incomplete Test Mocks (Code Quality Issue 12)

- **Root Cause**: In `apps/auth-service/src/modules/profiles/profiles.service.ts`, production domain methods `resolveProfileId` and `resolveUserIdByProfileId` employed defensive duck-typing checks (`if (query && typeof query.from === 'function')`) and empty `try { ... } catch { // Mock DB in unit tests without full table configurations }` blocks. This violated KISS principles and constituted a code smell: production business logic was defensively distorted and suppressed real runtime database errors solely to accommodate incomplete mock objects in unit tests. Real query failures (deadlocks, connection drops, transaction aborts) were silently swallowed and returned `undefined`, masquerading as "profile not found".
- **Fix**: Removed defensive checks and silent error suppression from production code, and upgraded unit test fixtures:
  1. Removed `if (query && typeof query.from === 'function')` and `try { ... } catch` blocks from `resolveProfileId` and `resolveUserIdByProfileId` in `apps/auth-service/src/modules/profiles/profiles.service.ts`. Queries now execute idiomatic, direct Drizzle query builder chains (`await this.db.select(...).from(...).where(...).limit(1)`).
  2. Upgraded unit test doubles in `apps/auth-service/test/profiles.service.spec.ts` with `createQueryChain()` and `createMockDb()`, providing mock query builders that natively adhere to Drizzle ORM's fluent builder interface (`.select().from().where().limit()`).
  3. Added unit tests verifying real database runtime error propagation in `resolveProfileId` and `resolveUserIdByProfileId`.
  4. Added unit tests for role-omitted fallback lookups in `resolveUserIdByProfileId` (technician hit, buyer fallback hit, neither found).
  5. Total unit tests in `auth-service` increased to 82 (+5 tests, 646 total across the monorepo).
  6. Zero database migrations (`RULE-DB-02`).

### FF-CODE-13 · 🧹 Manual Floating-Point Arithmetic for Minor Currency Conversions (Code Quality Issue 13)

- **Root Cause**: While `@fieldforge/contracts` provides strict, lossless integer conversion utilities (`minorToDecimalString`, `decimalStringToMinor`, and `formatMinor`), multiple services and applications performed manual, ad-hoc floating-point arithmetic for currency conversions:
  1. `apps/billing-service/src/modules/escrow/escrow.service.ts`: performed `(amountMinor / 100).toFixed(2)` for string decimals and `Math.round(Number(escrow.amountLocked) * 100)` / `Math.round(Number(row.amount) * 100)` for decimal conversions, risking IEEE 754 precision drift.
  2. `apps/billing-service/src/modules/invoices/invoices.service.ts`: performed `(params.amountMinor / 100).toFixed(2)` when creating invoices and `Math.round(Number(row.amount) * 100)` when reading invoice amounts.
  3. `apps/billing-service/src/modules/invoices/pdfkit-invoice-pdf.renderer.ts`: performed manual string interpolation `$${(invoice.amountMinor / 100).toFixed(2)}` instead of `formatMinor`.
  4. `apps/work-order-service/src/consumers/work-order-events.consumer.ts`: performed `$${(amountMinor / 100).toFixed(2)}` in payout logging.
  5. `apps/mobile-tech-app/src/screens/JobListScreen.tsx`: performed `(job.budgetAmountMinor / 100).toLocaleString('en-US', ...)` instead of centralized `formatMinor`.
  6. `apps/notification-service/test/notification.consumer.spec.ts`: used `(payoutMinor / 100).toFixed(2)` in test assertions.
- **Fix**: Replaced all manual floating-point arithmetic with canonical currency utilities from `@fieldforge/contracts`:
  1. Replaced all decimal string formatting with `minorToDecimalString(minor: MinorUnits): string`.
  2. Replaced all decimal string parsing with `decimalStringToMinor(str: string): MinorUnits` (lossless integer parsing without floating-point math).
  3. Replaced currency display formatting with `formatMinor(minor: MinorUnits): string`.
  4. Added comprehensive unit tests in `apps/billing-service/test/escrow.service.spec.ts` for `getEscrowByWorkOrder` (asserting exact minor conversion and 404 handling) and `getTechnicianEarnings` (asserting float-drift-free credit/debit ledger aggregation).
  5. Total unit tests in `billing-service` increased to 36 (+3 tests, 649 total across the monorepo).
  6. Zero database migrations (`RULE-DB-02`).

### ISSUE-009 · 🐛 Frontend Work Order Transition Payload Contract Mismatch

- **Status: resolved.**
- **Root Cause**: `apps/web-buyer-portal` used a legacy transition request payload `{ status, notes }` in the `transitionWorkOrder` mutation and `LiveDispatchBoard` (`handleApprove`, `handleRaiseDispute`), while the backend `WorkOrdersController` and `transitionStatusSchema` strictly expected `TransitionWorkOrderDto` (`{ nextStatus: WorkOrderStatus, reason?: string }`). When sent, `nextStatus` was `undefined`, triggering `ZodValidationPipe` validation failures (HTTP 400 Bad Request) on all web buyer transition actions.
- **Fix**: Realigned the web buyer portal with the canonical backend contract:
  1. Updated `apps/web-buyer-portal/src/store/services/api.ts` to import `TransitionWorkOrderDto` from `@fieldforge/contracts`, typed mutation arguments with `TransitionWorkOrderArgs`, and extracted `buildTransitionWorkOrderRequest` generating the canonical `{ url: '/work-orders/:id/transition', method: 'POST', body: { nextStatus, reason } }` structure.
  2. Updated `handleApprove` in `apps/web-buyer-portal/src/components/dispatch/LiveDispatchBoard.tsx` to send `{ id: wo.id, body: { nextStatus: WorkOrderStatus.APPROVED } }`.
  3. Updated `handleRaiseDispute` in `LiveDispatchBoard.tsx` to map `disputeReasonInput.trim()` to `reason: disputeReasonInput.trim()` and send `{ id: selectedOrder.id, body: { nextStatus: WorkOrderStatus.DISPUTED, reason } }`.
  4. Added contract schema regression tests in `packages/contracts/test/validators.spec.ts` proving canonical `{ nextStatus, reason }` parses and legacy `{ status, notes }` throws.
  5. Added Playwright E2E and API client verification tests in `apps/web-buyer-portal/e2e/transition.spec.ts` asserting exact outgoing payload shape and absence of `status` or `notes`.
  6. Zero database migrations (`RULE-DB-02`).

### ISSUE-010 · 🐛 Frontend Escrow Release Route Mismatch

- **Status: resolved.**
- **Root Cause**: In `apps/web-buyer-portal`, the RTK Query mutation `releaseEscrow` targeted `POST /billing/escrow/${workOrderId}/release` with no body, producing `POST /api/v1/billing/escrow/:workOrderId/release` at the edge gateway. However, `apps/billing-service` exposes `@Post('escrow/release')` on `@Controller('billing')`, expecting `POST /api/v1/billing/escrow/release` with `ReleaseEscrowDto` (`{ workOrderId: string, payoutAmountMinor?: number }`) in the HTTP request body. This route mismatch returned HTTP 404 Not Found on manual release requests. Furthermore, `LiveDispatchBoard.tsx` `handleApprove()` redundantly called `releaseEscrowApi` right after `transitionWorkOrderApi(APPROVED)`, racing against the backend's canonical asynchronous event pipeline (`work_order.lifecycle.approved` → `BillingConsumer` → `releaseFunds(SYSTEM)`) and creating risk of duplicate payouts or 409 Conflict race conditions.
- **Fix**: Realigned the buyer portal mutation and dispatch board:
  1. Exported `EscrowReleaseResultDto` in `@fieldforge/contracts` matching the backend release result shape.
  2. Updated `releaseEscrow` mutation in `apps/web-buyer-portal/src/store/services/api.ts` to consume canonical `ReleaseEscrowDto` and target `POST /billing/escrow/release`.
  3. Extracted pure query builder `buildReleaseEscrowRequest` guaranteeing url `/billing/escrow/release`, method `POST`, body `{ workOrderId }`, and omission of untrusted caller identity (`buyerId`, `userId`, `role`).
  4. Removed the redundant `releaseEscrowApi` invocation from `handleApprove()` in `LiveDispatchBoard.tsx`, letting the backend transactional outbox and `BillingConsumer` event choreography handle automated payout asynchronously.
  5. Updated `EscrowManager.tsx` manual release flow and Playwright E2E route mocks in `e2e/lifecycle.spec.ts` and `e2e/transition.spec.ts` to target `**/api/v1/billing/escrow/release`.
  6. Added automated unit tests in `packages/contracts/test/validators.spec.ts` for `releaseEscrowSchema`, in `apps/billing-service/test/billing.controller.spec.ts` for `releaseEscrow`, and in `apps/web-buyer-portal/e2e/transition.spec.ts` for `buildReleaseEscrowRequest`.
  7. Zero database migrations (`RULE-DB-02`).

### ISSUE-011 · 🐛 Premature PAYOUT_FAILED Emission & Payout Failure Consistency Remediation

- **Status: resolved.**
- **Root Cause**: In `BillingConsumer.handleWorkOrderApproved()`, on the very first transient error (attempt 0), the catch block constructed a `PAYOUT_FAILED` event and published it directly to RabbitMQ before re-throwing for broker retry. In `work-order-service`, `WorkOrderEventsConsumer` and `WorkOrdersService.handlePayoutFailed()` immediately rolled the work order back from `APPROVED` to `COMPLETED`. When RabbitMQ's broker-native retry delay queue expired (1s/2s/4s) and the retry succeeded, funds were disbursed to the technician and escrow was marked `RELEASED`, but `settlePaid()` failed with `BadRequestException` because `WorkOrderFsmService` does not allow transitioning `COMPLETED → PAID`. This resulted in technician payout completing while the work order remained stranded in `COMPLETED` forever. Furthermore, rolling back customer business approval on payment infrastructure failure violated domain invariants and corrupted buyer UX.
- **Fix**: Decoupled payout infrastructure failure from customer approval status:
  1. Removed `PAYOUT_FAILED` publication from `BillingConsumer.handleWorkOrderApproved()` in `apps/billing-service/src/consumers/billing.consumer.ts`. On failure, structured error context is logged and the exception is re-thrown for `IdempotentConsumer` bounded retries (attempts 1..3 via delay queue) and final DLQ parking (`fieldforge.billing.work-orders.dlq`).
  2. Removed `handlePayoutFailed()` from `WorkOrdersService` in `apps/work-order-service/src/modules/work-orders/work-orders.service.ts`. Work orders remain in `APPROVED` status on payout failures.
  3. Removed `EventType.PAYOUT_FAILED` subscription and consumer handler from `WorkOrderEventsConsumer` in `apps/work-order-service/src/consumers/work-order-events.consumer.ts`.
  4. Hardened `WorkOrderFsmService`: removed `COMPLETED` from `validTransitions[APPROVED]`, enforcing that `APPROVED` work orders can only transition forward to `PAID`.
  5. Annotated `EventType.PAYOUT_FAILED`, `PayoutFailedPayload`, and `PayoutFailedEvent` in `@fieldforge/contracts` as `@deprecated` with zero runtime producers/consumers.
  6. Updated unit and FSM tests across `billing-service` and `work-order-service` verifying zero failure event publication, approval immutability, and settlement idempotency.
  7. Updated `docs/MESSAGE_FLOW.md` and `README.md` to reflect broker retry/DLQ error semantics.
  8. Zero database migrations (`RULE-DB-02`).

### ISSUE-003A · 📦 Real Amazon S3 Deliverable Upload Flow (End-to-End Backend & Mobile Implementation)

- **Status: resolved.**
- **Root Cause**: FieldForge specified Amazon S3 as the canonical deliverable file storage system for photos and inspection documents. However, runtime storage previously used a mock `LocalDiskMediaStorageAdapter` serving fake localhost URLs, with no `@aws-sdk/client-s3` dependencies or genuine object store integration. Furthermore, `POST /work-orders/:id/deliverables/presigned-url` prematurely inserted a database row into `work_order_deliverables` before the client uploaded any bytes, leaving dangling records if the upload failed or aborted. On the mobile client, photo capture simulated fake `https://media.fieldforge.dev/...` URLs without uploading file bytes, and offline sync did not handle presigned URL expiration or S3 upload pipelines.
- **Fix**: Implemented the complete end-to-end Amazon S3 deliverable storage architecture across backend and mobile client:
  1. Installed `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` in `apps/work-order-service`.
  2. Implemented `S3MediaStorageAdapter` implementing `MediaStoragePort` as the canonical runtime provider. Fails fast at startup if `AWS_REGION` or `S3_DELIVERABLES_BUCKET` is missing in non-test runtime.
  3. Extended `MediaStoragePort` with `generatePresignedUploadUrl`, `generatePresignedDownloadUrl`, `headObject`, and `deleteObject`. Retained `LocalDiskMediaStorageAdapter` strictly as a test double.
  4. Updated `generatePresignedUploadUrl` to generate a presigned PUT URL with 15-minute expiration, server-controlled object key (`work-orders/{id}/deliverables/{type}/{uuid}.{ext}`), and strictly zero premature database row insertions.
  5. Implemented `confirmDeliverable` (`POST /work-orders/:id/deliverables`) with prefix security check, S3 `HeadObject` verification (checking existence, `ContentType`, and `ContentLength`), and idempotent database insertion storing canonical URI `s3://{bucket}/{objectKey}`.
  6. Implemented `generatePresignedDownloadUrl` (`GET /work-orders/:id/deliverables/:deliverableId/download-url`) with caller authorization (owning buyer, assigned technician, or admin), returning a presigned GET URL valid for 900s without making S3 buckets public.
  7. Updated contracts (`@fieldforge/contracts`) with `GeneratePresignedUrlDto`, `ConfirmDeliverableDto`, `PresignedUrlResponseDto`, `PresignedDownloadUrlResponseDto`, `ALLOWED_DELIVERABLE_MIME_TYPES`, and `MAX_DELIVERABLE_SIZE_BYTES` (15 MiB).
  8. Mobile deliverable uploads use direct client-to-S3 presigned PUT with actual file bytes (`Blob`) via `DeliverableUploadService` in `apps/mobile-tech-app`.
  9. Direct S3 PUT preserves `Content-Type` and strictly strips all FieldForge authentication headers (`Authorization`, `x-ff-*`), cookies, and AWS credentials.
  10. Offline jobs store local file references (`localUri`, `filename`, `mimeType`, `sizeBytes`) in durable persistent app storage (`FileSystem.documentDirectory`), NEVER persisting presigned URLs.
  11. On network reconnection, offline sync requests a fresh presigned URL before uploading to S3, preventing expired URL failures.
  12. Deliverables become authoritative only after backend confirmation (`POST /work-orders/:id/deliverables`) completes `HeadObject` verification.
  13. Confirmation retry strategy: retains `objectKey` if confirmation request network drops after successful S3 PUT, allowing retry to confirm directly without re-uploading bytes.
  14. Completely eradicated fake `media.fieldforge.dev` URLs from client source and test fixtures.
  15. Updated Terraform (`infra/terraform/main.tf` and `outputs.tf`) with `aws_s3_bucket_public_access_block` and `aws_s3_bucket_cors_configuration`.
  16. Added comprehensive test coverage: 13 unit tests in `apps/mobile-tech-app/test/deliverableUpload.service.spec.ts`, updated `activeJob.spec.ts`, `contracts/test/validators.spec.ts`, `s3-media-storage.adapter.spec.ts`, `deliverables.service.spec.ts`, and `work-orders.controller.spec.ts`.
  17. Zero database migrations (`RULE-DB-02` - reused existing `s3Url` column).

### ISSUE-004A · 🏛️ Remove Dispatch Direct Access to Auth-Owned Tables & Live GPS Location Ownership

- **Status: resolved.**
- **Root Cause**: `apps/dispatch-matching-service` violated DDD bounded context invariants by directly executing SQL queries and mutations against auth-owned tables in MySQL. On GPS location updates, `GeoSearchService.updateTechnicianLocation()` executed raw SQL `UPDATE technician_profiles` to set `current_latitude` and `current_longitude`. In `GeoSearchService.findNearbyTechnicians()`, it maintained fallback SQL joins querying `technician_profiles`, `users`, and `technician_certifications`. Furthermore, `DispatchModule` registered `DrizzleModule.forRoot()` and depended on `@fieldforge/database`, even though dispatch owns zero relational tables.
- **Fix**: Re-established clean domain boundaries and decoupled dispatch from relational storage:
  1. Established domain ownership matrix: `auth-service` owns identity, profiles, and vetting certifications in MySQL; `dispatch-matching-service` owns live GPS telemetry and spatial matching in Redis (`tech:locations`).
  2. Removed MySQL `UPDATE technician_profiles` from `GeoSearchService.updateTechnicianLocation()`. Live GPS updates write exclusively to Redis via `GEOADD tech:locations`.
  3. Tightened technician location identity in `DispatchController.updateLocation()`: requires a verified `profileId` from JWT/gateway header and rejects requests missing `profileId` with `ForbiddenException`. Removed all fallback queries (`SELECT id FROM technician_profiles WHERE user_id = ?`).
  4. Removed fallback SQL joins in `GeoSearchService.findNearbyTechnicians()`. Candidate enrichment is handled exclusively in a single batch via `TechnicianDirectoryService.getTechniciansBatch()` calling `auth-service`'s `POST /technicians/batch`.
  5. Enforced candidate eligibility safety: unverified or missing directory records are marked `isAvailable = false` and `certifications = []`, preventing unverified technicians from being auto-routed when directory data is unavailable.
  6. Removed `DrizzleModule.forRoot()` from `DispatchModule`.
  7. Removed `@fieldforge/database` and `drizzle-orm` dependencies from `apps/dispatch-matching-service/package.json`.
  8. Added an architecture boundary guard test (`architecture-boundary.spec.ts`) asserting zero foreign database imports or references in dispatch runtime code.
  9. Zero database migrations (`RULE-DB-02`).

### ISSUE-004B · 🏛️ GPS MySQL + Redis Dual-Write Consistency Defect

- **Status: resolved / obsolete due to Redis-only location architecture.**
- **Root Cause**: Previously, GPS updates attempted non-atomic dual writes to both MySQL (`technician_profiles`) and Redis (`tech:locations`), risking split-brain consistency on partial write failures.
- **Fix**: Fully resolved by the architectural transition to Redis-only live GPS ingestion in ISSUE-004A. Because `dispatch-matching-service` no longer writes to MySQL, the dual-write condition and its associated failure modes are completely eliminated. (Dormant `currentLatitude` and `currentLongitude` columns in `technician_profiles` remain in schema for now without active writers and will be dropped in a future schema cleanup phase).

### ISSUE-007 · 🔒 Secure Technician Batch Endpoint

- **Status: resolved.**
- **Severity**: Medium
- **Root Cause**: `POST /technicians/batch` was publicly reachable through the API Gateway, explicitly whitelisted in `PUBLIC_PREFIXES`, protected by no authentication guard in `auth-service`, callable by unauthenticated external clients, and accepted an unbounded `ids: string[]` payload. The endpoint is strictly an internal service-to-service dependency used solely by `dispatch-matching-service` for directory metadata hydration.
- **Fix**: Hardened service-to-service boundary, request validation, and gateway perimeter:
  1. Applied `@UseGuards(new InternalServiceGuard(['dispatch-matching-service']))` to `POST /technicians/batch` (`getBatchTechnicians`) in `apps/auth-service/src/modules/vetting/certifications.controller.ts`. Requests require valid `x-fieldforge-service-name` and `x-fieldforge-internal-secret` headers matching `INTERNAL_SERVICE_SECRET`.
  2. Removed `'/api/v1/technicians/batch'` and `'/technicians/batch'` from `PUBLIC_PREFIXES` in `apps/api-gateway/src/guards/jwt-auth.guard.ts`. External anonymous requests through the edge are rejected with HTTP 401 Unauthorized.
  3. API Gateway header anti-spoofing (`proxyReqOptDecorator` in `proxy.controller.ts`) strips `x-fieldforge-service-name` and `x-fieldforge-internal-secret` (`GATEWAY_STRIPPED_HEADERS`), preventing external attackers from spoofing internal service credentials.
  4. Bounded `batchTechniciansSchema` in `@fieldforge/contracts` to `ids: z.array(z.string().min(1).max(64)).min(1).max(100)`, preventing Denial-of-Service / resource exhaustion via oversized payloads.
  5. Implemented bounded batch chunking loop ($\le 100$ IDs per HTTP request) in `TechnicianDirectoryService` (`apps/dispatch-matching-service`), merging responses across chunks.
  6. Injected `INTERNAL_SERVICE_SECRET` into `TechnicianDirectoryService` and attached `x-fieldforge-service-name: dispatch-matching-service`, `x-fieldforge-internal-secret`, and propagated `x-correlation-id` to outbound HTTP calls.
  7. Retained minimal response exposure: returns strictly `id`, `name`, `phone`, `rating`, `completedJobs`, `certifications`, and `isAvailable`, with zero sensitive data (emails, hashes, bank details, tax IDs).
  8. Zero direct database access from dispatch: preserves DDD boundary with directory lookups flowing through auth REST API and cached in Redis / LRU.
  9. Added automated unit tests across `@fieldforge/contracts` (batch array limits), `apps/api-gateway` (public prefix removal), `apps/auth-service` (internal guard authorization), and `apps/dispatch-matching-service` (header transmission and chunking). Zero database migrations (`RULE-DB-02`).

### ISSUE-008 · 🏛️ Bounded In-Memory Caches & State Growth Remediation

- **Status: resolved.**
- **Severity**: Medium
- **Root Cause**: Long-lived in-memory `Map` instances in persistent Node.js services grew monotonically without bounding, eviction policies, or TTL expiration. Under sustained load or long-running worker deployments, unbounded Maps (`TechnicianDirectoryService.memoryCache`, `ProfileDirectoryService.memoryCache`, and `PhoneOtpService` maps) risked memory leaks and process-level Out-of-Memory (OOM) crashes.
- **Fix**: Implemented reusable bounded caching primitives and state-pruning safeguards across the repository:
  1. **Zero-Dependency `BoundedLruCache<K, V>`**: Implemented in `@fieldforge/common` (`packages/common/src/cache/bounded-lru-cache.ts`) using standard JavaScript `Map` insertion-order guarantees for $O(1)$ operations with true LRU eviction, configurable `maxEntries` (default 1,000) and `ttlMs` expiration (default 300s), active expired item eviction prior to LRU eviction, and introspection methods (`has`, `delete`, `clear`, `getRemainingTtl`, `evictExpired`).
  2. **`TechnicianDirectoryService` Migration**: In `apps/dispatch-matching-service`, replaced unbounded `Map<string, TechnicianSummaryDto>` with `BoundedLruCache` capped at 1,000 entries and 300s TTL. Retained multi-tier Redis MGET -> local LRU -> authenticated auth-service HTTP batch flow (`ISSUE-007`).
  3. **`ProfileDirectoryService` Migration**: In `packages/common`, replaced unbounded `Map<string, UserProfileResponseDto>` with `BoundedLruCache` capped at 1,000 entries and 300s TTL. Preserved HTTP lookup fallback and user profile hydration.
  4. **`PhoneOtpService` State Hardening**: In `apps/auth-service`, added active opportunistic pruning of expired OTP records and stale rate-limit timestamps (`RATE_LIMIT_WINDOW_MS = 10m`), completely deleting empty phone keys from `rateLimitStore`. Added fail-closed capacity limits (`DEFAULT_MAX_OTP_ENTRIES = 10,000`), rejecting new entries with HTTP 400 when full while strictly preventing the eviction of active rate-limit records (anti-brute-force invariant).
  5. **Map Auditing & Classification**: Audited remaining repository `Map` instances: `LedgerPaymentProvider` (`apps/billing-service`) is the active runtime payment provider (unconditionally bound in `billing.module.ts`, no environment guard). Its three idempotency Maps (`captureIdempotencyMap`, `payoutIdempotencyMap`, `refundIdempotencyMap`) are exempt from LRU remediation because arbitrary eviction of payment idempotency keys could allow replay attacks to be treated as new financial operations. The DB `idempotency_keys` table (already checked first in `EscrowService.lockFunds()`) is the durable, authoritative idempotency store; the provider Maps are a secondary in-memory guard only. Migrating the provider to rely exclusively on the DB layer and eliminating the Maps is tracked as follow-up technical debt. `LocalDiskMediaStorageAdapter` (`apps/work-order-service`) confirmed as test-only double (runtime canonical is `S3MediaStorageAdapter`).
  6. **Automated Unit Tests**: Added unit test suites verifying capacity limits, LRU eviction order, TTL expiry, rate limit non-eviction under capacity pressure, and state cleanup across `@fieldforge/common` (16 new cache tests, 98 passing), `apps/dispatch-matching-service` (68 passing), and `apps/auth-service` (93 passing). Zero database migrations (`RULE-DB-02`).

### ISSUE-006 · ⚙️ Multi-Pod SLA Auto-Approval Scheduler Redundant Execution & Race Handling

- **Status: resolved.**
- **Severity**: Low-Medium (Operational / Observability)
- **Root Cause**: Multi-replica deployments of `work-order-service` (`replicas: 3`) independently execute `@Cron(EVERY_5_MINUTES)` in `SlaAutoApprovalService`, selecting the same overdue `COMPLETED` work orders. Although existing database-level `SELECT ... FOR UPDATE` row locks, `WorkOrderFsmService.validateTransition()` checks, and transactional outbox event creation already prevent duplicate status mutations and duplicate billing release triggers, competing pods whose transitions were rejected by FSM state validation previously logged `ERROR` alerts, producing false positive failure noise during normal multi-pod operation.
- **Fix**: Implemented structured state verification and graceful concurrent race classification:
  1. **Structured State Re-read Verification**: Updated `SlaAutoApprovalService.runAutoApprovalSweep()` (`apps/work-order-service/src/modules/sla/sla-auto-approval.service.ts`) to intercept transition failures and re-read the work order aggregate using `WorkOrdersService.findById()`.
  2. **Clean Stale Candidate Demotion**: If the current status is no longer `COMPLETED` (e.g. transitioned to `APPROVED` by a competing pod, or progressed further to `PAID` via billing escrow release), the event is recognized as a benign scheduler race and logged at `DEBUG` with `workOrderId`, current status, and `correlationId`, without incrementing the local approved counter or logging errors.
  3. **Deleted Candidate Handling**: If the work order candidate no longer exists (`NotFoundException`), it is logged at `WARN` and skipped.
  4. **Strict Real Failure Retention**: If the work order is still in `COMPLETED` status, or the recheck encounters an unexpected database or network failure, `ERROR` logging with full stack trace is strictly preserved.
  5. **SlaEscalationService Assessment**: Verified `SlaEscalationService.sweepSlaBreaches()` as read-only telemetry and warning logging with zero database mutations or event emissions; classified as harmless redundant work requiring no distributed locking.
  6. **Automated Unit Tests**: Added comprehensive unit test suites in `apps/work-order-service/test/sla-auto-approval.service.spec.ts` validating concurrent race resolution to `APPROVED`, advance beyond `APPROVED` to `PAID`, retention of `ERROR` logging for real failures, graceful handling of deleted entities, DB failure resilience, and mixed batch execution. Zero database migrations (`RULE-DB-02`).

### ISSUE-012 · 🏛️ Multi-Replica Distributed Phone OTP & Rate-Limit Storage

- **Status: resolved.**
- **Severity**: Medium
- **Root Cause**: `apps/auth-service` stored phone OTP verification codes and request rate-limiting timestamps in process-local JavaScript `Map`s (`otpStore` and `rateLimitStore`). In multi-replica Kubernetes environments (`replicas: 2`) with non-sticky round-robin or least-conn routing from the API Gateway, successive requests for the same phone number landing on different pods failed verification with HTTP 400 (`No verification code requested for this phone number`). Furthermore, independent per-pod rate-limit stores allowed clients to bypass the 3-request-per-10-minute anti-flooding threshold ($N \times 3$ requests across $N$ replicas). Additionally, runtime code contained a predictable test shortcut (`cleanPhone.endsWith('0000') ? '123456' : ...`) active in production builds without environment gating.
- **Fix**: Replaced process-local state with distributed, atomic Redis-backed storage and eliminated backdoor shortcuts:
  1. **Distributed Shared Redis Architecture**: Integrated `ioredis` into `apps/auth-service`, registering `redisProvider` in `IamModule` connected to standard `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` with lazy connection and graceful shutdown (`OnApplicationShutdown`).
  2. **Zero Runtime Local Maps**: Completely removed `otpStore` and `rateLimitStore` `Map` instances, opportunistic pruning, capacity caps, and manual cleanup loops from `PhoneOtpService`. Process memory footprint is strictly $O(1)$ with zero runtime state.
  3. **Atomic Lua Sliding-Window Rate Limiting**: Implemented atomic server-side Lua script over Redis Sorted Sets (`auth:ratelimit:<phone>`) using `ZREMRANGEBYSCORE`, `ZCARD`, `ZADD`, and `EXPIRE 600`. Evaluates rate limit admission, evicts stale timestamps, records new attempts, and refreshes 10-minute key TTL atomically across all replicas without race conditions.
  4. **Atomic Lua OTP Verification & One-Time Consumption**: Implemented atomic server-side Lua script over `auth:otp:<phone>` (`EX 300` TTL). Atomically compares submitted code against stored JSON `{ code, attempts }`; increments `attempts` and preserves remaining millisecond TTL (`PTTL` / `SET ... PX <pttl>`) on non-terminal wrong attempts; permanently deletes key when attempts reach 3; and atomically deletes key on successful match, guaranteeing strict one-time-use even under concurrent cross-pod race conditions.
  5. **Predictable Test OTP Vulnerability Remediation**: Completely removed the hardcoded `endsWith('0000') ? '123456'` shortcut from runtime code. Introduced `defaultSecureOtpGenerator` using CSPRNG `crypto.randomInt(100000, 1000000).toString()` for all phone numbers, while enabling optional test generator injection via constructor/DI.
  6. **Fail-Closed on Infrastructure Outage**: Prohibited runtime local Map fallbacks. Any Redis connection error or timeout fails closed by throwing `ServiceUnavailableException` (HTTP 503) with a generic, safe error message, preventing split-brain regressions and rate-limit bypass.
  7. **Security & Privacy Observability**: Ensured OTP codes and Redis credentials are never logged; phone numbers are masked to trailing 4 digits in log outputs (`****${phone.slice(-4)}`).
  8. **Kubernetes Configuration Wiring**: Added Redis environment variable mappings (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`) to `infra/k8s/services/auth-service.yaml` referencing `fieldforge-global-config` and `fieldforge-secrets`, and added `REDIS_PASSWORD` placeholder to `infra/k8s/base/secrets.example.yaml`.
  9. **Automated Multi-Instance Tests**: Added comprehensive test suites in `apps/auth-service/test/phone-otp.service.spec.ts` validating single-pod flows, predictable OTP elimination, cross-pod verification, concurrent one-time-use atomicity, distributed rate-limit enforcement across pods, shared wrong-attempt counting, TTL expiration, fail-closed Redis error handling, and zero process-local Maps (100 passing tests in `auth-service`). Zero database migrations (`RULE-DB-02`).

### ISSUE-013 · 🏛️ LedgerPaymentProvider Process-Local Idempotency State & Durable Conflict Detection

- **Status: resolved.**
- **Severity**: Medium
- **Root Cause**: `LedgerPaymentProvider` (`apps/billing-service`) maintained three unbounded process-local in-memory `Map`s (`captureIdempotencyMap`, `payoutIdempotencyMap`, `refundIdempotencyMap`) for idempotency and conflict detection. In multi-replica Kubernetes environments (`replicas: 2`), this architecture had four critical flaws:
  1. **Unbounded Memory Leak**: Every capture, payout, and refund permanently retained full parameter payloads and response receipts in process memory without TTL, capacity limit, or eviction.
  2. **Zero Cross-Pod Visibility**: Pod B had no visibility into Pod A's in-memory state; a retry or conflicting reuse of an idempotency key on Pod B could not detect parameter conflicts registered on Pod A.
  3. **Process Volatility**: Pod crashes, node drains, or rolling restarts wiped all memory maps, destroying provider-level idempotency history.
  4. **Dual Source-of-Truth Divergence**: Recording state in-memory during open database transactions created divergence if database transactions subsequently rolled back (e.g. invoice generation or commit failures).
- **Fix**: Replaced process-local provider maps with stateless simulation and promoted idempotency & conflict detection to the durable database layer:
  1. **Stateless Ledger Simulation**: Completely removed `captureIdempotencyMap`, `payoutIdempotencyMap`, and `refundIdempotencyMap` (and their `Cached*Entry` interfaces) from `LedgerPaymentProvider`. The provider now deterministically simulates transaction execution without retaining any internal heap state ($O(1)$ memory footprint).
  2. **Preserved Provider Port Contract**: Retained `idempotencyKey: string` across all methods in `PaymentProviderPort` and `LedgerPaymentProvider` for forward-compatibility with future external gateways (e.g. Stripe, Adyen).
  3. **Authoritative Durable DB Idempotency**: Promoted `EscrowService` and the persistent MySQL `idempotency_keys` table to be the single, authoritative boundary for all request idempotency and parameter conflict detection.
  4. **Canonical Request Fingerprinting**: Created `apps/billing-service/src/modules/escrow/idempotency-fingerprint.ts` providing deterministic canonical serialization and SHA-256 hashing for material operation parameters:
     - `CAPTURE`: `workOrderId`, `buyerId`, `amountMinor`, `paymentMethodId`
     - `PAYOUT`: `workOrderId`, `technicianId`, `amountMinor`
     - `REFUND`: `workOrderId`, `buyerId`, `amountMinor`
       Volatile runtime attributes (timestamps, correlation IDs, UUIDs) are strictly excluded from fingerprints to guarantee stable retries.
  5. **Durable Conflicting Parameter Detection**: Stored `{ requestFingerprint, response }` envelopes in `idempotency_keys.response_payload` (with transparent unwrap fallback for backward compatibility with legacy rows). On request retries, `EscrowService` compares the canonical fingerprint: matching parameters return the cached response without invoking the payment provider, while conflicting parameters throw a durable `ConflictException` across pods and across restarts.
  6. **Pessimistic Locking & State Invariants Preserved**: Maintained strict `SELECT ... FOR UPDATE` row locking on `escrow_accounts`, ensuring state transitions (`HELD` -> `RELEASED` / `REFUNDED`), remainder refunds, and full cancellation refunds cannot be executed more than once even under concurrent race conditions.
  7. **Zero Database Schema Migrations**: Reused the existing MySQL JSON column (`idempotency_keys.response_payload`), requiring zero database schema changes or migrations (`RULE-DB-02`).
  8. **No Redis or LRU Cache Added**: Preserved architectural simplicity without introducing Redis or lossy LRU caches to `billing-service`.
  9. **Automated Verification Coverage**: Rewrote `apps/billing-service/test/ledger-payment.provider.spec.ts` for stateless simulation and memory verification (zero retained properties across 1,000 operations). Added comprehensive tests in `apps/billing-service/test/escrow.service.spec.ts` covering conflicting parameter detection (capture, payout, refund), restart safety (provider recreation with authoritative DB return), and multi-replica safety (two pods sharing database executing provider exactly once). 90 passed tests in `billing-service`.

### ISSUE-014 · 📡 DEAD Outbox Observability & Safe Operator Recovery

- **Status: resolved.**
- **Severity**: Medium
- **Root Cause**: In `BaseOutboxRelay` (`packages/common/src/outbox/outbox-relay.ts`), the transactional outbox engine correctly halts processing of subsequent events for the same aggregate (`aggregateType` + `aggregateId`) whenever an earlier event is in `DEAD` status:
  ```sql
  AND prior.status IN ('PENDING', 'PROCESSING', 'FAILED', 'DEAD')
  ```
  Step 21A investigation confirmed that causal blocking on `DEAD` is **intentional fail-stop causal ordering** to prevent downstream domain corruption (e.g., publishing `WORK_ORDER_APPROVED` or `PAYOUT_DISBURSED` when an earlier assignment or escrow funding event failed due to structural poison). However, it was **operationally incomplete**:
  1. Transitioning to `DEAD` produced zero APM metrics (`fieldforge_outbox_dead_events_total` did not exist in `MetricsRegistry`).
  2. Zero Prometheus alerts existed to notify on-call SREs when an aggregate stream was blocked.
  3. Zero operator inspection or safe atomic replay tooling existed.
  4. An unmonitored dead event permanently halted an aggregate stream without operator visibility or remediation path.
- **Fix**: Preserved intentional per-aggregate FIFO causal ordering while implementing complete observability, Prometheus alerting, and safe atomic operator replay tooling:
  1. **Preserved Strict Causal Ordering**: Kept `prior.status IN ('PENDING', 'PROCESSING', 'FAILED', 'DEAD')` unchanged in `BaseOutboxRelay`. Monotonic per-aggregate FIFO ordering is preserved without auto-skipping or fake `PUBLISHED` transitions. Distinct aggregates continue publishing concurrently.
  2. **Prometheus APM Counter**: Added `fieldforge_outbox_dead_events_total` counter in `MetricsRegistry` (`packages/common/src/apm/metrics.registry.ts`) with low-cardinality labels `['service', 'outbox', 'reason']`. Increments atomically exactly once upon successful transition to `DEAD` (guarded by Compare-And-Set `affectedRows > 0`). Stale worker CAS collisions and transient retries (`FAILED`) do not increment the counter.
  3. **Structured Poison Logging**: Emits structured error logs on poison event transition recording event ID, aggregate type/ID, attempt count, table name, and sanitized error summary.
  4. **Prometheus Alerting**: Added `FieldForgeOutboxDeadEventDetected` alert rule in `infra/docker/rules.yml` (`expr: increase(fieldforge_outbox_dead_events_total[5m]) > 0`, `severity: critical`) with runbook link.
  5. **BaseOutboxRelay Operator Methods**: Extended `BaseOutboxRelay` with `listDeadEvents(limit)` (excluding raw payloads for log safety) and `replayDeadEvent(id)` implementing atomic CAS resetting `status = 'PENDING'`, `attempt_count = 0`, `next_attempt_at = NOW()`, `last_error = 'REPLAY_QUEUED_BY_OPERATOR'`, triggering the relay immediately. Rejects non-DEAD or non-existent rows. Preserves immutable `eventId` and payload.
  6. **Operator Administrative CLI**: Built `scripts/outbox-admin.ts` and `scripts/outbox-admin.sh` (exposed via `pnpm outbox:admin`) supporting `list`, `inspect`, and `replay` across `work-order` and `billing` outbox tables. Added strict safety guardrail rejecting any `--payload` modification attempts.
  7. **Operator Runbook**: Authored `docs/runbooks/outbox-dead-letter-recovery.md` documenting alert triage, root cause diagnosis, remediation workflows, delivery semantics (at-least-once broker delivery + idempotent consumers), and operational invariants.
  8. **Automated Test Coverage**: Added comprehensive test cases in `packages/common/test/outbox-relay.spec.ts` covering poison detection, metric increments on transition, zero increments on transient failure, zero increments on CAS collision, `listDeadEvents` filtering, `replayDeadEvent` atomic reset, `NOT_FOUND` / `NOT_DEAD` status validation, self-healing loop for persistent poison, and causal blocker invariant verification (105 passing tests in `packages/common`).
  9. **Zero Database Migrations**: Reused existing database enum statuses (`'PENDING'`, `'PROCESSING'`, `'PUBLISHED'`, `'FAILED'`, `'DEAD'`) in accordance with `RULE-DB-02`.

### ISSUE-015 · 🗄️ Transactional Outbox Published-Event Retention

- **Status: resolved.**
- **Severity**: Medium
- **Root Cause**: In `work_order_outbox_events` and `billing_outbox_events`, events successfully published to RabbitMQ transitioned permanently to `status = 'PUBLISHED'` but were retained in MySQL indefinitely without retention bounds. The transactional outbox is a **transient delivery store** (ADR 011), not the canonical business audit log (which resides in `work_order_status_history` and `payout_ledger`). Retaining millions of historical published events causes continuous payload JSON disk bloat, dilutes InnoDB buffer pool efficiency, and increases backup snapshot windows.
- **Fix**: Implemented bounded, safe, scheduled retention purging of published outbox events in `@fieldforge/common`:
  1. **Strict Retention Invariants**: Only rows with `status = 'PUBLISHED'` and `published_at < cutoff` are eligible for cleanup. The worker NEVER deletes or modifies `PENDING`, `PROCESSING`, `FAILED`, or `DEAD` rows. `DEAD` causal barriers remain intact for operator triage under ISSUE-014.
  2. **Configurable Retention Horizon & Validation**: Added `parseRetentionDays()` reading `OUTBOX_PUBLISHED_RETENTION_DAYS` (default 30 days). Added strict positive integer validation rejecting 0, negative values, floats, and NaN.
  3. **Bounded Two-Stage Batch Purging**: Implemented `OutboxRetentionWorker.purgeBatch()` using a safe two-stage pattern (SELECT candidate IDs ordered by `id ASC` with `LIMIT batchSize`, then `DELETE WHERE id IN (...) AND status = 'PUBLISHED' AND published_at < cutoff`). Repeats safety predicates in the DELETE statement. Bounded to `OUTBOX_CLEANUP_BATCH_SIZE` (default 1,000) and capped at 5 batches per run.
  4. **Multi-Replica Safe**: Competing retention workers resolving the same candidate rows result safely in `affectedRows = 0` without lock escalation or exceptions.
  5. **Decoupled Lifecycle & Relay Isolation**: Retention workers execute independently on an hourly interval (`OUTBOX_CLEANUP_INTERVAL_MS`, default 3,600,000ms) with non-blocking startup sweep. Retention failures never crash the service or block the outbox relay publisher. Timer handles are cleanly unref'd and cleared in `onApplicationShutdown()`.
  6. **APM Metrics & Structured Logging**: Added Prometheus counters `fieldforge_outbox_cleanup_deleted_total` and `fieldforge_outbox_cleanup_failures_total` with low-cardinality labels `['service', 'outbox']`.
  7. **Service Integration**: Wired `WorkOrderOutboxRetentionService` in `apps/work-order-service` and `BillingOutboxRetentionService` in `apps/billing-service` under strict bounded context data ownership.
  8. **Zero Database Schema Migrations**: Existing columns (`status`, `published_at`, `id`) and composite indexes (`idx_wo_outbox_poller`, `idx_bill_outbox_poller`) natively support filtering published rows without schema migrations (`RULE-DB-02`).
  9. **Automated Verification**: Added 17 unit tests in `packages/common/test/outbox-retention.worker.spec.ts` covering retention deletion, recent event preservation, non-published row preservation (DEAD/PENDING/PROCESSING/FAILED), null timestamp safety, batch draining caps, multi-worker concurrency, failure catching, timer lifecycles, and configuration validation.

### ISSUE-016 · 🧩 NestJS Runtime Dependency Injection Startup Failures

- **Status: resolved.**
- **Severity**: High
- **Root Cause**: When bootstrapping `billing-service`, `work-order-service`, and `dispatch-matching-service` via `pnpm dev` or `nest start`, services crashed with `UnknownDependenciesException`:
  1. `ProfileDirectoryService` in `@fieldforge/common` had `constructor(maxEntries = PROFILE_DIRECTORY_CACHE_MAX_ENTRIES)`. Because `emitDecoratorMetadata` is enabled, TypeScript emitted `"design:paramtypes": [Number]`. Registered in `BillingModule` and `WorkOrderModule`, NestJS’s `InstanceLoader` sought a provider for `Number` at index `[0]` and crashed because none was registered and the parameter lacked `@Optional()`.
  2. `TechnicianDirectoryService` in `dispatch-matching-service` had undecorated parameters `internalSecret?: string` and `maxEntries = ...` at indices `[1]` and `[2]`, compiling to `[Object, String, Number]`. NestJS failed on index `[1]` looking for a provider for `String`. Additionally, a circular dependency existed between `geo-search.service.ts` and `technician-directory.service.ts` importing `REDIS_CLIENT`.
  3. `WorkOrderDirectoryService` in `billing-service` had undecorated parameter `internalSecret?: string` at index `[0]`, compiling to `[String]`, which would crash on `String` provider lookup.
     TypeScript's static type checker did not catch these because optional arguments (`arg?: string` or default values) are syntactically valid in TS, but NestJS DI operates entirely at runtime using `reflect-metadata`. Prior unit tests instantiated services directly (`new Service(...)`), bypassing the NestJS IoC container.
- **Fix**: Surgically applied NestJS DI conventions across all affected constructors and extracted circular constants:
  1. **ProfileDirectoryService**: Exported `PROFILE_DIRECTORY_MAX_ENTRIES = 'PROFILE_DIRECTORY_MAX_ENTRIES'` from `@fieldforge/common`. Decorated constructor parameter with `@Optional() @Inject(PROFILE_DIRECTORY_MAX_ENTRIES) maxEntries?: number` with a safe numeric fallback.
  2. **TechnicianDirectoryService**: Exported `TECHNICIAN_DIRECTORY_INTERNAL_SECRET` and `TECHNICIAN_DIRECTORY_MAX_ENTRIES`. Decorated constructor parameters with `@Optional() @Inject(...)`. Extracted `REDIS_CLIENT` and `TECH_LOCATIONS_KEY` into dedicated `geo-search.constants.ts` to break the circular dependency loop.
  3. **WorkOrderDirectoryService**: Exported `WORK_ORDER_DIRECTORY_INTERNAL_SECRET` in `billing-service`. Decorated parameter with `@Optional() @Inject(WORK_ORDER_DIRECTORY_INTERNAL_SECRET) internalSecret?: string`.
  4. **Module Bootstrap Integration Tests**: Created `module-bootstrap.spec.ts` in `apps/billing-service`, `apps/work-order-service`, and `apps/dispatch-matching-service` that initialize the NestJS IoC container and verify that all controllers and providers resolve cleanly without DI exceptions.

---

## Suggested remediation order

1. **Stop the bleeding (C1):** purge/rotate committed secrets, `.gitignore` them.
2. **Make the trust boundary real (C2, C5, H3):** implement auth-service, then gateway JWT + RolesGuard, and keep identity sourced from the token rather than from headers a client can set.
3. **Protect the money (C3, C4, M3):** transactional, idempotent, state-checked escrow with a UNIQUE constraint.
4. **Make the system actually run end-to-end (H1, H2, H4, H5):** proxy, event bus wiring, DB-backed FSM, server-side geofence.
5. **Stop data loss (H6).**
6. Add meaningful automated coverage (H7) and finish deployable Kubernetes manifests (H8).
7. Work down Medium/Low, resolving the FSM/enum canon (M1) early since it touches DB, contracts, and UI at once.

---

_Line references point at the code as read during this audit; a few stub locations are described by module rather than an exact line because the relevant logic is a placeholder. Cross-checked across five subsystem passes (contracts/DB, work-order/FSM, dispatch/billing/events, gateway/auth/common, frontends/infra/CI)._
