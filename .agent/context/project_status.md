# FieldForge Implementation Status

**Last reviewed:** 2026-09-01  
**Phase:** early scaffold / foundation hardening

## What exists

- A pnpm/Turborepo monorepo with NestJS service shells, a Vite buyer portal, an
  Expo technician app, and shared contracts, database, common, and UI packages.
- Initial Drizzle schemas and migrations for users, work orders, bids,
  deliverables, and escrow.
- Local Docker Compose definitions for MySQL, Redis, RabbitMQ, Jaeger,
  Prometheus, and Grafana.
- Architecture rules, three accepted ADRs, and CI/build scaffolding.

## What is not yet implemented

- Production authentication, JWT verification, or RBAC enforcement.
- API gateway proxying to downstream services.
- Database-backed work-order lifecycle and escrow transactions.
- A working RabbitMQ publish/consume pipeline with idempotency, retries, and DLQ.
- Server-enforced geofencing, durable mobile offline sync, or media storage.
- Real billing provider integration, payout reconciliation, or immutable invoice
  generation.
- Production observability exporters, dashboards, and evidence-backed SLO tests.
- Meaningful automated coverage for the SRS business rules.
- A deployable production Kubernetes platform.

The detailed defect inventory is maintained in `docs/ISSUES.md`. Do not infer
feature completion from types, dependencies, UI mock data, or console-log stubs.

## Known specification drift

- SRS v1.0.0 sets the geofence tolerance to 200 metres; existing code and older
  documents use 100 metres.
- SRS v1.0.0 requires 99.9% availability; older SLO text uses 99.95%.
- Work-order terminal-state terminology differs between the SRS (`PAID`),
  diagrams (`SETTLED`), and the current enum (ending at `APPROVED`).
- Runtime image versions differ from the older version-specific ADR wording.

These are intentionally recorded rather than silently resolved during the
foundation pass. Future feature work must resolve each affected contract before
shipping behavior.
