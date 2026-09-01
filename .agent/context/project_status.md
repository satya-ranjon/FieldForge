# FieldForge Implementation Status

**Last reviewed:** 2026-09-01  
**Phase:** Phase 0 complete — canon, contracts, and test harness. Next: Phase 1
(identity and a real trust boundary). Roadmap: `docs/DEVELOPMENT_PLAN.md`.

## What exists

- A pnpm/Turborepo monorepo with NestJS service shells, a Vite buyer portal, an
  Expo technician app, and shared contracts, database, common, and UI packages.
- Initial Drizzle schemas and migrations for users, work orders, bids,
  deliverables, and escrow.
- Local Docker Compose definitions for MySQL, Redis, RabbitMQ, Jaeger,
  Prometheus, and Grafana.
- Architecture rules, three accepted ADRs, and CI/build scaffolding.
- **One work-order FSM.** `WorkOrderStatus` ends at `PAID` per SRS FR-WO-002;
  `validTransitions` in `work-order-fsm.service.ts` is the single definition, and
  `test/work-order-fsm.service.spec.ts` asserts all 100 ordered status pairs, so
  both a removed and an added transition break the build.
- **One money representation.** Wire amounts are integer minor units named
  `*Minor`; `packages/contracts/src/money.ts` owns the conversions and guards.
  DB columns stay `DECIMAL(10,2)` and convert at the repository edge.
- **One event envelope.** `EventEnvelope<T>` carries `eventId`, `eventType`,
  `occurredAt`, `correlationId`, and `payload`; `createEvent()` requires the
  correlation id at the call site.
- **A test harness that can fail.** `packages/jest-config` plus a
  `jest.config.cjs` in each of the seven workspaces with a `test` script; 225
  unit tests; no `--passWithNoTests` anywhere. Run tests on Node 24 (see
  `.nvmrc`) — the scripts pass `--experimental-vm-modules` because NestJS 12
  ships ESM only while the services compile to CommonJS.

## What is not yet implemented

- Production authentication, JWT verification, or RBAC enforcement.
- API gateway proxying to downstream services.
- Database-backed work-order lifecycle and escrow transactions. No service opens
  a connection yet; `createDbClient` has no callers.
- A working RabbitMQ publish/consume pipeline with idempotency, retries, and DLQ.
  The envelope exists; the publisher still logs instead of publishing.
- Server-enforced geofencing, durable mobile offline sync, or media storage.
- Real billing provider integration, payout reconciliation, or immutable invoice
  generation.
- Production observability exporters, dashboards, and evidence-backed SLO tests.
- Coverage thresholds. Suites are real but `coverageThreshold` is unset; it rises
  per phase toward the SRS §5 target of 90% on business rules.
- A deployable production Kubernetes platform.

The detailed defect inventory is maintained in `docs/ISSUES.md`. Do not infer
feature completion from types, dependencies, UI mock data, or console-log stubs.

## Known specification drift

- SRS v1.0.0 sets the geofence tolerance to 200 metres; existing code and older
  documents use 100 metres. Phase 2 moves the check server-side at 200 m.
- SRS v1.0.0 requires 99.9% availability; older SLO text uses 99.95%.
- Runtime image versions differ from the older version-specific ADR wording;
  Phase 7 supersedes ADRs 001–003 rather than leaving the drift recorded.

Terminal-state terminology is no longer drift: the SRS won, `PAID` is the terminal
state, and `SETTLED`/`BIDDING`/`OPEN`/`IN_PROGRESS` are gone from the docs and UI.

The remaining items are intentionally recorded rather than silently resolved.
Future feature work must resolve each affected contract before shipping behavior.
