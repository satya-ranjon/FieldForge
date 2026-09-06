# Software Requirements Specification (SRS)

## FieldForge — Real-Time Enterprise Field Service Marketplace & Microservices Platform

**Document version:** 1.1.0  
**Target domain:** On-demand gig economy and field service management  
**Primary author:** Satya Ranjan Debsharma  
**Date:** August 2026 · last amended 2026-09-03

### Revision history

| Version | Date       | Change                                                                                                                                                                                                               |
| :------ | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-08    | Initial normalization of the attached SRS into Markdown.                                                                                                                                                             |
| 1.1.0   | 2026-09-03 | Tightened FR-AUTH-002, added FR-AUTH-004, NFR-SEC-004, and a negative-path verification requirement. Raised by the trust-boundary audit recorded as **C1** and **C5** in [`ISSUES.md`](./ISSUES.md) — see §6 note 2. |

## 1. Purpose and scope

FieldForge is an enterprise-grade, multi-tenant SaaS marketplace and workforce
management platform. It connects enterprise service buyers and managed service
providers with certified freelance technicians for on-site hardware, networking,
telecommunications, and equipment maintenance.

The intended system comprises:

- A Next.js (App Router) enterprise web portal, using React and Redux Toolkit, for
  work-order creation, bidding, dispatch, monitoring, and escrow approval.
- A React Native technician app for nearby-gig discovery, bidding, navigation,
  geofenced execution, proof-of-work capture, and earnings.
- Decoupled Node.js, NestJS, and TypeScript REST microservices for identity, work
  orders, matching, billing, media, notifications, and edge routing.
- MySQL for ACID transactions and relational integrity, with Redis for
  geospatial indexes, caching, locks, and rate limits.
- RabbitMQ for asynchronous dispatch, notifications, and status propagation.
- Structured JSON logging, Prometheus metrics, OpenTelemetry tracing, and SLI/SLO
  monitoring.

## 2. Users

### Service buyer

Creates and funds work orders, evaluates technician qualifications and bids,
monitors arrival and execution, reviews proof of work, and releases escrow.

### Field technician

Discovers and filters nearby work, bids or accepts direct dispatches, checks in
and out using GPS, records deliverables and parts, captures signatures, and
tracks earnings.

### Platform administrator or support dispatcher

Oversees platform health and error budgets, audits disputes, and manages
technician accreditation verification.

## 3. Functional requirements

### 3.1 Authentication and identity

- **FR-AUTH-001 — Registration and profiles:** Provide distinct buyer and
  technician onboarding with credential validation, phone OTP verification, and
  tax/banking details.
- **FR-AUTH-002 — RBAC and security:** Issue stateless JWTs with `BUYER`,
  `TECHNICIAN`, `DISPATCHER`, and `ADMIN` role claims. A service that needs the
  caller's identity or role **must** derive it by verifying the token signature
  and reading the claims. Transport metadata that merely _describes_ an identity
  — a proxy-injected header, a request-body field, a query parameter — is not an
  accepted source, because anything a client can reach it can also set.
- **FR-AUTH-003 — Technician vetting and badges:** Track compliance badges such
  as Background Checked, OSHA 10, Cisco CCNA, and CompTIA A+.
- **FR-AUTH-004 — Trust boundary and identity propagation:** The API Gateway
  authenticates at the edge and may forward the identity it verified to
  downstream services for logging and correlation. That forwarding is a
  convenience, not a guarantee:
  - The gateway **must** remove any inbound copy of a header it asserts, before
    asserting it. A header that arrives from a client must never be forwarded as
    though the gateway had verified it.
  - A downstream service **must not** treat such a header as proof of identity.
    Where it holds the key to verify the token, it verifies the token. Where a
    forwarded header is present alongside a token, disagreement between the two
    is a rejected request, not a value to be reconciled.
  - Restricting network reachability between services (NetworkPolicy, service
    mesh mTLS) is required for production but **must not** be a precondition for
    the above. A correct service is safe when reached directly.

### 3.2 Work-order lifecycle

- **FR-WO-001 — Creation:** Buyers can draft and publish work orders containing
  title, category, address, coordinates, arrival window, certifications,
  emergency priority, and fixed or hourly pay.
- **FR-WO-002 — State machine:** Validate the primary progression
  `DRAFT → PUBLISHED → ASSIGNED → EN_ROUTE → ON_SITE → COMPLETED → APPROVED → PAID`,
  with exceptional `CANCELLED` and `DISPUTED` states.
- **FR-WO-003 — SLA and schedule constraints:** Flag arrival deadlines and
  unassigned SLA timeouts before they breach.

### 3.3 Bidding and intelligent dispatch

- **FR-DISP-001 — Geospatial matching:** Use Redis `GEOSEARCH` or MySQL spatial
  queries to find eligible, certified technicians within a configurable radius.
- **FR-DISP-002 — Bidding:** Technicians can submit proposed rates and
  availability.
- **FR-DISP-003 — Direct routing:** Buyers can auto-assign urgent tickets to
  top-rated technicians within five miles.
- **FR-DISP-004 — Event notifications:** Publish `work_order.assigned` and
  `work_order.published` events through RabbitMQ topic exchanges for immediate
  notifications.

### 3.4 Mobile execution and proof of work

- **FR-MOB-001 — Geofenced check-in:** Verify the mobile coordinates are within
  200 metres of the work site before allowing the on-site transition.
- **FR-MOB-002 — Deliverables:** Support configurable checklists, timestamped
  before/after photos, and serial-number capture.
- **FR-MOB-003 — Signature:** Capture an on-screen client signature with a
  verifiable cryptographic hash.
- **FR-MOB-004 — Offline queue:** Persist photos and checklist updates locally
  using SQLite or AsyncStorage and synchronize after reconnection.

### 3.5 Billing, invoicing, and escrow

- **FR-BILL-001 — Pre-authorization:** Hold work-order funds when the order is
  assigned.
- **FR-BILL-002 — Release:** Release escrow to the technician after buyer sign-off
  or the 72-hour automatic approval window.
- **FR-BILL-003 — Invoices and audit:** Produce immutable PDF buyer invoices,
  itemized 1099 payout summaries, and complete audit logs.

### 3.6 Observability and reliability

- **FR-OBS-001 — Structured logging:** Emit structured Pino JSON with an
  `x-correlation-id` across all services. (Implemented via `packages/common/src/logger/` and correlation ID middleware).
- **FR-OBS-002 — Metrics:** Export Prometheus metrics (`GET /metrics`) for at least:
  - API availability: non-5xx requests divided by all requests, at least 99.9% (`http_requests_total`).
  - API latency: p95 below 200 milliseconds (`http_request_duration_seconds`).
  - Dispatch queue latency: publication to technician notification no more than
    1.5 seconds (`dispatch_fanout_latency_seconds`).
  - Financial ledger: 0 dropped transactions (`billing_reconciliation_failures_total`).
    (Implemented via `packages/common/src/apm/` and Grafana dashboards).
- **FR-OBS-003 — Probes:** Expose `/healthz` and `/readyz`; readiness validates
  database pools, Redis, and RabbitMQ channels. (Implemented in `HealthController` with dynamic dependency validation).

## 4. Non-functional requirements

### Performance and scalability

- **NFR-PERF-001:** p95 read queries complete below 100 milliseconds and p95
  writes below 200 milliseconds. (Validated via `scripts/k6/dispatch-load.js` driving 1,000 concurrent iterations).
- **NFR-PERF-002:** Node.js containers scale horizontally under Kubernetes HPA.
- **NFR-PERF-003:** Composite indexes prevent table scans on tables above 100,000
  rows.

### Reliability and availability

- **NFR-REL-001:** Core platform uptime is at least 99.9% per calendar month.
- **NFR-REL-002:** Notification or media failure cannot block work-order state
  transitions or payment records.
- **NFR-REL-003:** Payment-release and bid-submission endpoints enforce
  idempotency keys.

### Security and compliance

- **NFR-SEC-001:** Use TLS 1.3 in transit and AES-256 at rest for database and S3
  data.
- **NFR-SEC-002:** Use parameterized database access through Drizzle or Prisma.
- **NFR-SEC-003:** Inject secrets at runtime; hardcoded credentials are
  prohibited. This includes fallback values. A literal supplied only when an
  environment variable is absent (`process.env.X || 'default'`) is a hardcoded
  credential, and is the more dangerous form because the code reads as
  configurable while the committed value is the one in force.
- **NFR-SEC-004 — Fail closed on unusable key material:** A service that cannot
  obtain valid secret material **must** terminate at startup with a message
  naming the missing configuration. It must not start in a degraded or default
  state. For the shared JWT signing key specifically:
  - Signer and verifier resolve the key through a single shared code path, so
    they cannot diverge.
  - An absent or blank key is fatal.
  - A key shorter than 32 bytes is rejected (RFC 7518 §3.2 requires an HMAC key
    at least the size of the hash output).
  - A key whose value has appeared in this repository or its history is rejected
    permanently and at any length. Such a value is public in every clone and
    fork, so history rewriting does not restore it; refusing it is the only
    remedy.
  - Failure messages must not echo the secret value.

## 5. Verification requirements

- Unit tests in Jest cover at least 90% of business rules, validators, and state
  transitions.
- Integration tests use Supertest with containerized MySQL and RabbitMQ.
- Playwright validates the buyer creation, bid, acceptance, and completion path.
- k6 validates 1,000 concurrent active work-order dispatches within the latency
  targets.
- **Security requirements are verified by negative tests.** For every access
  control, at least one test asserts that the disallowed request is _refused_ —
  not merely that the allowed request succeeds. A suite that only walks the happy
  path through a boundary cannot detect a path around it: the FR-AUTH-004
  violation recorded as **C5** coexisted with a passing register → login →
  profile test, because that test went through the gateway and the bypass did
  not.
- **A control's test must fail when the control is removed.** Before a
  security-relevant guard is considered covered, temporarily revert the guard and
  confirm the suite goes red. A test that passes against both the fixed and the
  vulnerable implementation documents intent without enforcing it.

## 6. Requirement interpretation notes

1. This checked-in document normalizes the attached SRS into portable Markdown. It
   does not claim that the requirements are implemented. Where existing code or an
   older design document conflicts with this SRS, follow the source-of-truth order
   in `AGENTS.md` and record the resolution before changing a public contract.
2. **On the 1.1.0 amendments.** FR-AUTH-004, NFR-SEC-004, the FR-AUTH-002 identity
   clause, and the two verification bullets were added after an audit found two
   working bypasses of the Phase 1 trust boundary (`ISSUES.md` **C1**, **C5**).
   Neither implementation contradicted this SRS at version 1.0.0 — FR-AUTH-002
   required issuing role-claimed JWTs and said nothing about where a service
   should read identity _from_, and NFR-SEC-003 prohibited hardcoded credentials
   without addressing fallback literals or requiring a service to fail closed
   without a key. The requirements were satisfiable by insecure code, so they are
   now stated in terms of what must be refused rather than only what must be
   offered. Consistent with note 1, these clauses describe required behavior;
   `.agent/context/project_status.md` is where their implementation status is
   tracked.
