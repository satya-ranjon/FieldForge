# FieldForge Implementation Status

**Last reviewed:** 2026-09-04  
**Phase:** Phase 2 complete — persistent, transactional work-order lifecycle. Next: Phase 3
(event backbone). Roadmap: `docs/DEVELOPMENT_PLAN.md`.

## What exists

- A pnpm/Turborepo monorepo with NestJS service shells, a Next.js App Router buyer
  portal (migrated off Vite; still served on port 5173), an Expo technician app, and
  shared contracts, database, common, and UI packages.
- Drizzle schemas and migrations for users, work orders, status history, bids,
  deliverables, escrow, refresh tokens, and technician certifications (`0000`, `0001`, `0002_auth.sql`, `0003_wo_history.sql`).
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
  and `x-correlation-id` downstream headers. The proxy **deletes any inbound `x-ff-user-*`
  header before asserting its own**, because `express-http-proxy` copies inbound headers by
  default and a public route leaves `req.user` undefined — without the strip, a client-supplied
  identity header passed straight through.
- **Identity comes from the token, never from a header.** `GET /users/me` and `apps/work-order-service`
  controllers verify the bearer token and read `payload.sub`; `x-ff-user-id` is consulted only to detect
  disagreement, and a mismatch is rejected. Downstream services must not treat `x-ff-user-*` as authoritative:
  every service listens on `0.0.0.0` with no NetworkPolicy or mTLS, so those headers are
  attacker-settable on a direct call. See **C5** in `docs/ISSUES.md`.
- **Persistent, transactional work-order lifecycle.** `apps/work-order-service` implements
  `POST /work-orders`, `GET /work-orders` (filtered on composite index), `GET /work-orders/:id`,
  `GET /work-orders/:id/history`, `POST /work-orders/:id/publish`, `POST /work-orders/:id/transition`,
  and `PATCH /work-orders/:id/status`. All mutations execute in `db.transaction()` with `SELECT … FOR UPDATE`
  row-level locking. Transitions validate the persisted row against `WorkOrderFsmService.validateTransition`,
  enforce ownership and role boundaries, write state updates, and log an audit entry in
  `work_order_status_history`.
- **Server-enforced geofence.** `packages/common/src/geo/haversine.ts` implements canonical
  Haversine distance calculation. The `EN_ROUTE → ON_SITE` transition requires `latitude`/`longitude`
  and enforces the 200m radius threshold against stored coordinates (SRS FR-MOB-001). Mobile app check is UX-only.
- **Deliverables & Media Storage.** `MediaStoragePort` with `LocalDiskMediaStorageAdapter` generates
  presigned upload URLs (`POST /work-orders/:id/deliverables/presigned-url`). Digital signatures
  (`POST /work-orders/:id/signature` & `/deliverables/signature`) hash only stable contents (omitting timestamps,
  resolving L5), storing `signed_at` in a separate column in `work_order_deliverables`.
- **SLA escalation & sweep.** `SlaEscalationService` registered with `@nestjs/schedule` 5-minute cron
  sweep; `checkSlaBreachRisk` correctly flags expired/breached work orders (`timeRemainingMs <= 0`) as well as
  orders approaching breach.
- **One shared JWT signing key, with no fallback.** `requireJwtSecret()`
  (`packages/common/src/config/jwt-secret.ts`) is the single resolution path for signer and verifier.
- **One work-order FSM.** `WorkOrderStatus` ends at `PAID` per SRS FR-WO-002;
  `validTransitions` in `work-order-fsm.service.ts` is the single definition, verified across all 100 status pairs.
- **One money representation.** Wire amounts are integer minor units named `*Minor`.
- **One event envelope.** `EventEnvelope<T>` carries `eventId`, `eventType`, `occurredAt`, `correlationId`, `payload`.
- **A test harness that can fail.** 324 automated unit and integration tests across 7 workspaces;
  no `--passWithNoTests` anywhere.

## What is not yet implemented

- Escrow transactions in `apps/billing-service` (Phase 4).
- A working RabbitMQ publish/consume pipeline with idempotency, retries, and DLQ (Phase 3).
  The envelope exists; publisher currently logs events at transaction boundaries.
- Durable mobile offline sync queue (Phase 6).
- Real billing provider integration, payout reconciliation, or immutable invoice generation (Phase 4).
- Production observability exporters, dashboards, and evidence-backed SLO tests (Phase 7).
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
