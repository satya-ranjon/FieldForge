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

`billing-service` `releaseFunds()` (escrow module) transfers money with **no** verification that: the work order is `APPROVED`, the escrow is in `HELD` state, the amount matches, or the caller is authorized. It does not persist a state change, is not idempotent, and runs in no transaction.

**Impact:** double-release / release-without-approval / wrong-amount payouts — the most damaging class of bug for a marketplace holding client funds.
**Fix:** load escrow `FOR UPDATE` inside `db.transaction()`, assert `status === HELD` and a matching approved work order, write `RELEASED` + `released_at`, and dedupe on an idempotency key before emitting `billing.payout.disbursed`.

### C4 · 🏛️ Core money/state flows bypass the mandated transaction rule

**Status: partially resolved (2026-09-04).** Work-order state mutations (`create`,
`publish`, `transitionStatus`, `recordSignature`) now use Drizzle ORM transactions
with pessimistic row-level locks (`SELECT … FOR UPDATE`) via `db.transaction()`
in `apps/work-order-service`, fully backed by unit and concurrent race tests.
The remaining half — transactional escrow locking and release in `apps/billing-service` —
lands in Phase 4.

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

### H6 · 🐛 Mobile offline queue silently discards mutations

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

`RULE-EVENT-03` requires idempotent consumers (7-day dedupe), a dead-letter exchange, and max-3 exponential-backoff retries. None exist (consumers themselves are stubs — see H1). Event envelopes carry `eventId` (usable for dedupe) but nothing consumes it.
**Impact:** once wired, duplicate deliveries could double-assign/double-pay; poison messages would hot-loop.
**Fix:** implement a dedupe store keyed on `eventId`, a DLX, and retry/backoff policy.

### M7 · 🏛️ Correlation-id not propagated over AMQP

**Status: partially remediated — the field now exists; propagation lands in
Phase 3.** `EventEnvelope<T>` in `packages/contracts/src/events/envelope.ts` carries
`eventId`, `eventType`, `occurredAt`, `correlationId`, and `payload`, and the five
event interfaces were reshaped as payloads inside it. `createEvent()` requires a
correlationId at the call site rather than defaulting one. Actually publishing over
the broker and restoring the id into the Pino context on consume is Phase 3 of
`docs/DEVELOPMENT_PLAN.md`; today the publisher still logs.

`RULE-OBS`/`.cursorrules` require `x-correlation-id` across HTTP **and** AMQP. Event interfaces in `@fieldforge/contracts` carry no `correlationId` field, and the `CorrelationId` decorator only reads an HTTP header.
**Impact:** traces break at every service hop through the broker.
**Fix:** add `correlationId` to the event envelope, set it on publish, and restore it into the logger/context on consume.

### M8 · 🐛 SLA auto-approval missing and breach check is inverted

**Status: partially resolved (Phase 2, 2026-09-04).** In `apps/work-order-service`,
`SlaEscalationService` is now registered in `WorkOrderModule`, `checkSlaBreachRisk`
was corrected to return `true` whenever `timeRemainingMs <= 0` (properly flagging
already-breached work orders as well as imminent breach risks), `isBreached` was added,
and a 5-minute scheduled sweep (`@Cron(CronExpression.EVERY_5_MINUTES)`) sweeps and
logs breaches. The 72-hour auto-approval release lands in Phase 4 alongside escrow release.

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

ADRs/README specify MySQL 8.0, Redis 7.0, RabbitMQ 3.13; compose pulls `mysql:8.4`, `redis:7.4`, `rabbitmq:4.0`. RabbitMQ 4.x is a major jump from the ADR's 3.13.
**Impact:** behavior/config drift from what's documented and decided.
**Fix:** pin images to the ADR versions or supersede the ADRs deliberately.

### M11 · 🐛 `transitionStatusSchema` referenced but does not exist

**Status: resolved.** `transitionStatusSchema` is defined and exported from
`packages/contracts/src/validators/work-order.schema.ts`; it takes `nextStatus` from
the canon enum plus `latitude`/`longitude`, required together for the `ON_SITE`
arrival because the server — not the handset — decides whether the technician is
inside the geofence. `submitBidSchema.proposedAmount` is now `bidAmountMinor`,
matching the `bid_amount` column. The same pass dropped the caller-supplied
`buyerId`/`techId` fields from the request schemas: identity comes from the verified
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

**Status: partially remediated.** A minimal `prometheus.yml` now lets Prometheus
start, but application exporters, dashboards, and measured SLO tests remain absent.

`MetricsInterceptor` (`packages/common/src/apm/metrics.interceptor.ts`) `console.log`s timings with a "In production: push to Prometheus/OTEL" comment; no exporter is wired. `prometheus.yml` referenced by the observability compose **doesn't exist**, so Prometheus won't start.
**Fix:** add an OTEL/Prom exporter and the missing scrape config.

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

### L6 · 🏛️ Frontend deviates from RULE-FE-04

`web-buyer-portal` uses hardcoded Redux `initialState` and a mock token instead of RTK Query for server state; there's no router. IDs are generated with `Math.random()`.
**Fix:** introduce RTK Query for server data, a real auth slice, and collision-safe IDs (`crypto.randomUUID()`).

### L7 · 🐛 Mobile app missing location permissions wiring

`expo-location` is a dependency but permissions aren't requested and `app.json` lacks the iOS/Android location usage strings; `ActiveJobScreen` is never mounted by a navigator.
**Fix:** add permission prompts + usage descriptions and mount the screen.

### L8 · 🐛 SLO verification is theater; `bootstrap()` rejections unhandled

`scripts/simulate-dispatch-load.js` fabricates latency samples with `Math.random()` and reports them as SLO evidence. Separately, each service's `bootstrap()` promise is unhandled — a startup failure exits silently without a non-zero signal in some paths.
**Fix:** measure real requests (or label the script clearly as a mock) and add `.catch()` to `bootstrap()` with `process.exit(1)`.

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
