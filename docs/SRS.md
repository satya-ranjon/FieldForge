# Software Requirements Specification (SRS)

## FieldForge — Real-Time Enterprise Field Service Marketplace & Microservices Platform

**Document version:** 1.0.0  
**Target domain:** On-demand gig economy and field service management  
**Primary author:** Satya Ranjan Debsharma  
**Date:** August 2026

## 1. Purpose and scope

FieldForge is an enterprise-grade, multi-tenant SaaS marketplace and workforce
management platform. It connects enterprise service buyers and managed service
providers with certified freelance technicians for on-site hardware, networking,
telecommunications, and equipment maintenance.

The intended system comprises:

- A React and Redux Toolkit enterprise web portal for work-order creation,
  bidding, dispatch, monitoring, and escrow approval.
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
  `TECHNICIAN`, `DISPATCHER`, and `ADMIN` role claims.
- **FR-AUTH-003 — Technician vetting and badges:** Track compliance badges such
  as Background Checked, OSHA 10, Cisco CCNA, and CompTIA A+.

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
  `x-correlation-id` across all services.
- **FR-OBS-002 — Metrics:** Export Prometheus metrics for at least:
  - API availability: non-5xx requests divided by all requests, at least 99.9%.
  - API latency: p95 below 200 milliseconds.
  - Dispatch queue latency: publication to technician notification no more than
    1.5 seconds.
- **FR-OBS-003 — Probes:** Expose `/healthz` and `/readyz`; readiness validates
  database pools, Redis, and RabbitMQ channels.

## 4. Non-functional requirements

### Performance and scalability

- **NFR-PERF-001:** p95 read queries complete below 100 milliseconds and p95
  writes below 200 milliseconds.
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
  prohibited.

## 5. Verification requirements

- Unit tests in Jest cover at least 90% of business rules, validators, and state
  transitions.
- Integration tests use Supertest with containerized MySQL and RabbitMQ.
- Playwright validates the buyer creation, bid, acceptance, and completion path.
- k6 validates 1,000 concurrent active work-order dispatches within the latency
  targets.

## 6. Requirement interpretation notes

This checked-in document normalizes the attached SRS into portable Markdown. It
does not claim that the requirements are implemented. Where existing code or an
older design document conflicts with this SRS, follow the source-of-truth order
in `AGENTS.md` and record the resolution before changing a public contract.
