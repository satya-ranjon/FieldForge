# 01 — Product Capability Map

> **FieldForge Real-Time Enterprise Field Service Marketplace & Microservices Platform**  
> Living UX Specification & Capability Baseline • Target Domain: On-Demand Field Engineering & SLA-Driven Maintenance

---

## 1. Executive Product Definition

FieldForge is a high-concurrency, two-sided enterprise marketplace and workforce orchestration platform. It programmatically pairs **Enterprise Service Buyers** (managed service providers, telecom operators, multi-site retail infrastructure managers, cloud datacenter operators) with **Certified Freelance Field Technicians** (network engineers, low-voltage cabling specialists, POS installers, fiber splicers) for on-site hardware dispatch, SLA-backed emergency repairs, and scheduled rollouts.

### Core Value Proposition

- **For Enterprise Buyers**: Rapid (< 15 min match, < 4 hr arrival) deployment of verified, credentialed technical talent with guaranteed escrow security, live GPS visibility, and cryptographic proof of work.
- **For Field Technicians**: High-yield, local commercial technical work with transparent guaranteed payouts locked in escrow before departure, frictionless mobile check-in, offline-capable field logging, and rapid payout disbursement upon job completion.
- **For Platform Operators**: SLA-driven autonomous orchestration with automated dispute mediation, tamper-evident audit trails, and financial reconciliation.

---

## 2. Actor Model & Role Capabilities

```
+-------------------------------------------------------------------------------+
|                                FIELD FORGE USERS                              |
+-------------------------------------------------------------------------------+
         |                                                 |
         v                                                 v
+------------------+                             +--------------------+
|  SERVICE BUYERS  |                             | FIELD TECHNICIANS  |
| (Web Command UI) |                             | (Mobile Native App)|
+------------------+                             +--------------------+
         |                                                 |
         +------------------------+------------------------+
                                  |
                                  v
                   +-----------------------------+
                   |   DISPATCHERS & ADMINS      |
                   |   (Operations & Audit UI)   |
                   +-----------------------------+
```

### 2.1 Service Buyer (`BUYER`)

- **Profile Data Model**: `buyer_profiles` (`company_name`, `billing_address`, `escrow_balance`, Stripe customer token) `[Backend Constraint]`.
- **Primary Capabilities**:
  - Author and draft detailed Scopes of Work (SOW) specifying site address, GPS coordinates, arrival window, category, and budget `[Backend Constraint]`.
  - Fund and lock financial escrow accounts (`escrow_accounts`) per work order `[Backend Constraint]`.
  - Broadcast work orders to regional contractor queues via RabbitMQ topic exchange `[Backend Constraint]`.
  - View real-time proximity radar of nearby certified contractors via Redis `GEOSEARCH` `[Backend Constraint]`.
  - Evaluate contractor proposals/bids, inspect verified credential badges, and accept bids (triggering atomic sibling rejection) `[Backend Constraint]`.
  - Execute automated 1-click intelligent dispatch (`/dispatch/auto-route`) within a 5-mile radius `[Backend Constraint]`.
  - Monitor technician transit status (`EN_ROUTE`) and geofenced physical arrival (`ON_SITE`) in real time `[Backend Constraint]`.
  - Review cryptographically signed proof-of-work deliverables (before/after photos, serials, manager signatures) `[Backend Constraint]`.
  - Authorize escrow release or allow 72-hour SLA auto-approval window to disburse funds `[Business Rule]`.
  - Raise formal quality/SLA breach disputes freezing escrow release `[Business Rule]`.
  - Download immutable, tamper-evident PDF/A buyer invoices with content hashes `[Backend Constraint]`.

### 2.2 Field Technician (`TECHNICIAN`)

- **Profile Data Model**: `technician_profiles` (`first_name`, `last_name`, `hourly_rate`, `current_latitude`, `current_longitude`, `rating_average`, `jobs_completed`) `[Backend Constraint]`.
- **Primary Capabilities**:
  - Stream live GPS coordinates to Redis spatial index (`/dispatch/technicians/location`) `[Backend Constraint]`.
  - Discover nearby available work orders filtered by radial distance, category, and budget `[Backend Constraint]`.
  - Submit competitive bids with custom proposed payout amounts, counter-notes, and estimated arrival times `[Backend Constraint]`.
  - Accept direct dispatches and auto-route ticket assignments `[Backend Constraint]`.
  - Acknowledge travel departure (`ASSIGNED -> EN_ROUTE`) `[Backend Constraint]`.
  - Perform geofenced check-in (`EN_ROUTE -> ON_SITE`) requiring client physical presence within 200m of work order coordinates `[Business Rule]`.
  - Execute itemized task checklists with 100% completion requirement `[Business Rule]`.
  - Capture pre-work (`PHOTO_BEFORE`) and post-work (`PHOTO_AFTER`) photos with AWS S3 pre-signed upload URLs and server-side HeadObject verification `[Backend Constraint]`.
  - Record client hardware serial numbers `[Backend Constraint]`.
  - Capture client on-screen digital signatures generating SHA-256 audit digest hashes `[Backend Constraint]`.
  - Queue mutations and media uploads in a local offline queue during network disconnection (airplane mode / subterranean server rooms) `[Backend Constraint]`.
  - Track earnings, settlement status, and itemized 1099 payout ledgers (`CREDIT`/`DEBIT`) `[Backend Constraint]`.
  - Submit industry accreditation certifications for admin verification `[Backend Constraint]`.

### 2.3 Dispatcher & Support Administrator (`DISPATCHER` / `ADMIN`)

- **Primary Capabilities**:
  - Inspect system-wide operational health, queue latencies, and service SLIs/SLOs `[Backend Constraint]`.
  - Review pending technician accreditation submissions (Cisco CCNA, CompTIA A+, OSHA 10, Background Check) and verify/reject credentials `[Backend Constraint]`.
  - Audit disputed tickets (`DISPUTED`), inspect deliverable evidence and geofence logs, and arbitrate between buyer refund (`CANCELLED`) or technician disbursement (`APPROVED -> PAID`) `[Business Rule]`.
  - Trigger manual emergency dispatch overrides or cancellations `[Backend Constraint]`.

---

## 3. Work Order Finite State Machine (FSM)

The authoritative backend lifecycle is governed by `WorkOrderFsmService` and persisted with `SELECT ... FOR UPDATE` row locks in MySQL `[Backend Constraint]`. Bidding is not a status; bids are child entities in `work_order_bids` collected while a ticket is `PUBLISHED`.

```
                    +---------------+
                    |     DRAFT     |
                    +---------------+
                        |       |
      [Publish & Escrow]|       |[Cancel Draft]
                        v       v
                    +---------------+       [Cancel Ticket]
                    |   PUBLISHED   |----------------------------+
                    +---------------+                            |
                        |                                        |
     [Accept Bid / Auto]|                                        |
                        v                                        |
                    +---------------+       [Cancel Before Dep.] |
                    |   ASSIGNED    |----------------------------+
                    +---------------+                            |
                        |       |                                |
         [Start Transit]|       |[Dispute Breach]                |
                        v       |                                |
                    +---------------+                            |
                    |   EN_ROUTE    |                            |
                    +---------------+                            |
                        |       |                                |
      [Geofence <=200m] |       |[Dispute SLA]                   |
                        v       |                                |
                    +---------------+                            |
                    |    ON_SITE    |                            |
                    +---------------+                            |
                        |       |                                |
       [Deliverables In]|       |[Dispute Work]                  |
                        v       |                                |
                    +---------------+                            |
                    |   COMPLETED   |                            |
                    +---------------+                            |
                        |       |                                |
      [Approve / 72h]   |       |[Dispute Reject]                |
                        v       |                                |
                    +---------------+                            |
                    |   APPROVED    |                            |
                    +---------------+                            |
                        |                                        |
      [Release Escrow]  |                                        |
                        v                                        v
                    +---------------+                    +---------------+
                    |     PAID      |                    |   CANCELLED   |
                    |  (Terminal)   |                    |  (Terminal)   |
                    +---------------+                    +---------------+
                        ^                                        ^
                        |                                        |
            [Arbitrate Tech]                        [Arbitrate Buyer]
                        |                                        |
                        +-----------+---------------+------------+
                                    |   DISPUTED    |
                                    +---------------+
```

### FSM Transition Invariants & Guardrails

1. **`DRAFT -> PUBLISHED`**: Requires work order budget, site address, geo-coordinates, and pre-authorized escrow funding `[Business Rule]`.
2. **`PUBLISHED -> ASSIGNED`**: Occurs when buyer accepts a technician bid or auto-routing matches an eligible technician within 5 miles `[Backend Constraint]`.
3. **`ASSIGNED -> CANCELLED`**: Allowed only before technician marks departure. Full escrow refund to buyer `[Business Rule]`.
4. **`ASSIGNED -> EN_ROUTE`**: Triggered by technician in mobile app upon departing for the site `[Backend Constraint]`.
5. **`EN_ROUTE -> ON_SITE`**: Strictly gated by server-side Haversine calculation verifying mobile coordinates are $\le 200\text{ m}$ from the work site `[Backend Constraint]`.
6. **`ON_SITE -> COMPLETED`**: Requires 100% completed checklist, pre-work photo, post-work photo, and client digital signature `[Business Rule]`.
7. **`COMPLETED -> APPROVED`**: Triggered by buyer sign-off or automatic 72-hour cron escalation `[Business Rule]`.
8. **`APPROVED -> PAID`**: Triggered asynchronously upon verified AMQP confirmation of transactional escrow ledger disbursement `[Backend Constraint]`. Manual PATCH to `PAID` is rejected by backend `[Backend Constraint]`.
9. **`ON_SITE / COMPLETED -> DISPUTED`**: Once technician reaches site, ticket cannot be directly cancelled; dispute arbitration is required to protect technician transit time and expenses `[Business Rule]`.

---

## 4. Backend Service Architecture & Capability Inventory

### 4.1 Edge & Security Layer (`api-gateway` :8000)

- **Stateless Bearer JWT Authentication**: Enforces RFC 7518 compliance, validates signatures at edge, strips untrusted client-injected headers, asserts verified user claims `[Backend Constraint]`.
- **Distributed Rate Limiting**: Redis-backed `ThrottlerGuard` preventing endpoint abuse `[Backend Constraint]`.
- **Correlation Propagation**: Generates and asserts `x-correlation-id` across all downstream HTTP and AMQP boundaries `[Backend Constraint]`.

### 4.2 Identity & Contractor Vetting (`auth-service` :8001)

- **Credential Auth**: Email/password registration and login with bcrypt hashing `[Backend Constraint]`.
- **Token Lifecycle**: Short-lived access JWTs paired with cryptographically hashed rotating refresh tokens (`refresh_tokens`) `[Backend Constraint]`.
- **Phone Verification**: 6-digit SMS OTP generation and verification (`/auth/phone/send-otp`, `/auth/phone/verify-otp`) `[Backend Constraint]`.
- **Directory Lookup**: Inter-service profile resolution linking identity UUIDs to buyer/technician profile aggregates `[Backend Constraint]`.
- **Accreditation Vetting**: Tracking, submission, and admin approval for verified industry certifications (`technician_certifications`) `[Backend Constraint]`.

### 4.3 Work Order Lifecycle (`work-order-service` :8002)

- **Transactional SOW**: Multi-table transactional mutations using MySQL InnoDB `SELECT ... FOR UPDATE` `[Backend Constraint]`.
- **Geospatial Coordinates**: Stored latitude/longitude with composite `(status, scheduledStartTime)` indexing `[Backend Constraint]`.
- **Bids Management**: Technician bid submission with counter-notes; atomic bid acceptance with sibling rejection `[Backend Constraint]`.
- **S3 Deliverables Handshake**: Pre-signed PUT generation with mime-type and size enforcement (15MB cap); HeadObject verification upon upload confirmation; pre-signed download URLs with 900s expiration `[Backend Constraint]`.
- **Digital Signatures**: Client on-screen SVG storage with SHA-256 tamper-evident digest generation `[Backend Constraint]`.
- **Audit History**: Immutable transition audit log (`work_order_status_history`) recording timestamps, status changes, user IDs, and transition rationale `[Backend Constraint]`.
- **Transactional Outbox**: Guaranteed reliable RabbitMQ publishing via MySQL outbox poller `[Backend Constraint]`.

### 4.4 Geospatial Dispatch & Matching (`dispatch-matching-service` :8003)

- **Live Location Index**: Redis geospatial index (`GEOADD`) updated by mobile technician pings with 15s TTL `[Backend Constraint]`.
- **Proximity Search**: Redis `GEOSEARCH` querying certified contractors within user-defined radial perimeters (5, 10, 25, 50 miles) `[Backend Constraint]`.
- **Composite Scoring**: Ranking algorithm evaluating proximity (miles), average rating (1-5 stars), completed job volume, and compliance badges `[Backend Constraint]`.
- **Auto-Route Matching**: Autonomous assignment of urgent tickets to highest-ranked available technician within 5 miles `[Backend Constraint]`.

### 4.5 Billing, Escrow & Invoicing (`billing-service` :8004)

- **Escrow Pre-Authorization**: Funding lock (`escrow_accounts`) linking 1:1 with work orders (`uq_escrow_work_order`) `[Backend Constraint]`.
- **Transactional Release**: Multi-table atomic transaction moving funds from escrow hold to technician payout ledger `[Backend Constraint]`.
- **Payout Ledger**: Double-entry ledger (`payout_ledger`) tracking `CREDIT` and `DEBIT` items per technician `[Backend Constraint]`.
- **Cancellation Refunds**: Idempotent release back to buyer customer balance upon ticket cancellation `[Backend Constraint]`.
- **PDF/A Invoicing**: Server-side binary PDF generation with immutable content hashes (`invoices`) `[Backend Constraint]`.

### 4.6 Asynchronous Communications (`notification-service` :8005 & `@fieldforge/messaging`)

- **Durable Event Bus**: Topic exchange `fieldforge.events.topic` handling `work_order.lifecycle.*`, `tech.bidding.*`, and `billing.*` `[Backend Constraint]`.
- **Reliability & Idempotency**: 7-day Redis deduplication keys (`ff:idemp:<eventId>`), DLX/DLQ trap, and exponential backoff retry (max 3) `[Backend Constraint]`.
- **Notification Fanout**: Push notifications (FCM/APNS), SMS alerts (Twilio), and email notifications (SES) dispatched on lifecycle events `[Backend Constraint]`.

---

## 5. Constraint & Boundary Classification

| Domain Element            | Constraint Type        | Source / Invariant                                                                              | UX Implication                                                                                                           |
| :------------------------ | :--------------------- | :---------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| **Identity & Auth**       | `[Backend Constraint]` | JWT `sub` and `profileId` claims are sole identity source; request body cannot supply user IDs. | Auth forms must strictly submit credentials; UX never asks user for internal IDs.                                        |
| **Money Representation**  | `[Backend Constraint]` | All APIs and contracts operate on integer minor units (cents).                                  | Frontend must format minor units cleanly to `$DD.CC` and parse input accurately.                                         |
| **Geofenced Check-In**    | `[Business Rule]`      | Strict Haversine distance $\le 200\text{ m}$ enforced on server for `ON_SITE` transition.       | Mobile app must provide real-time distance countdown, visual radius radar, and error guidance if user is $>200\text{m}$. |
| **Escrow Funding**        | `[Business Rule]`      | Work order cannot be published without pre-authorized escrow hold.                              | Work order creation must incorporate transparent budget calculator and payment authorization before publishing.          |
| **Cancellation Boundary** | `[Business Rule]`      | Cancellation allowed only up to `ASSIGNED`. Once `ON_SITE`, dispute resolution is mandatory.    | "Cancel Order" button must disappear or transform to "Raise Dispute" once technician is on site.                         |
| **Deliverable Integrity** | `[Business Rule]`      | 100% task checklist, before/after photos, and client signature required for `COMPLETED`.        | Mobile UI must enforce completion gates before enabling "Complete Work Order" button.                                    |
| **Auto-Approval Window**  | `[Business Rule]`      | 72 hours from completion to automatic escrow release if buyer does not act.                     | Buyer portal must display a clear, countdown timer showing pending auto-release.                                         |
| **Ticket Auto-Route**     | `[Backend Constraint]` | Rule-based direct routing limited to top-rated technicians within 5 miles.                      | Buyer UX should offer "Auto-Dispatch" as a high-speed option for urgent tickets with immediate feedback.                 |
| **Phone Verification**    | `[Business Rule]`      | Verified phone number required for active marketplace participation.                            | OTP verification must be integrated into onboarding without blocking initial exploration.                                |
