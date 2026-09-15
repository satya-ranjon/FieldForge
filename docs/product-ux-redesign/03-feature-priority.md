# 03 — Feature Prioritization & User Flow Hierarchy

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Operational Feature Taxonomy & Priority-Weighted Flow Architecture

---

## 1. Feature Classification Framework

In high-concurrency marketplace operations, flat navigation structures where every feature is treated equally cause severe cognitive overload and fatal delays. Features are strictly stratified into five operational tiers based on frequency of use, direct contribution to time-to-value, and risk profile.

```
+-------------------------------------------------------------------------------+
|                       OPERATIONAL FEATURE HIERARCHY                           |
+-------------------------------------------------------------------------------+
  [PRIMARY]        -> The core engine; why users open the app. Always 1-click visible.
  [SECONDARY]      -> Telemetry, bid evaluation, radius filtering, deliverable review.
  [UTILITY]        -> Settings, profile, phone OTP, notification preferences.
  [ADMINISTRATIVE] -> Accreditation vetting, dispute arbitration, health metrics.
  [RARE]           -> Irreversible cancellations, 1099 tax exports, ledger audits.
```

---

## 2. Exhaustive Feature Matrix & Prioritization Rationale

### 2.1 Primary Features (Tier 1 — Core Value Engine)

These features represent the fundamental reason the marketplace exists. They must be permanently accessible, load instantly, and require zero unnecessary navigational hops.

| Feature Identifier | Feature Name                               | Primary Actor | Description & Backend Binding                                                                                                                                                              | UX Placement & Interaction Standard                                                                                                 |
| :----------------- | :----------------------------------------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `FEAT-PRI-01`      | **Live Work Order Command Board**          | `BUYER`       | Real-time Kanban / list tracking tickets across FSM states (`DRAFT` through `PAID`). Backed by `GET /work-orders`.                                                                         | Root default view for authenticated buyers. Multi-column or dense list with live status beacons and urgent SLA countdowns.          |
| `FEAT-PRI-02`      | **Guided SOW Authoring & Escrow Pre-Auth** | `BUYER`       | Rapid authoring of work order title, category, address, geocodes, schedule, and budget, paired with 1-click escrow lock. Backed by `POST /work-orders` and `POST /billing/escrow/preauth`. | Prominent primary CTA ("New Work Order") opening a high-density, 4-step stepper or slide-over drawer with instant template presets. |
| `FEAT-PRI-03`      | **Nearby Available Gigs Feed & Radar**     | `TECHNICIAN`  | Location-indexed feed of nearby open tickets with transparent payout amounts, distance, and category. Backed by `GET /work-orders` and Redis spatial coordinates.                          | Default root landing for technicians. High-contrast cards with large green payout figures and distance badges.                      |
| `FEAT-PRI-04`      | **Geofenced Check-In Engine**              | `TECHNICIAN`  | GPS-validated transition from `EN_ROUTE` to `ON_SITE` enforcing $\le 200\text{ m}$ proximity. Backed by `POST /work-orders/:id/transition` with client coordinates.                        | Prominent visual radar scope on active gig screen with real-time distance countdown and green check-in trigger when within radius.  |
| `FEAT-PRI-05`      | **Proof-of-Work Execution Suite**          | `TECHNICIAN`  | Itemized task checklist, pre/post S3 photo capture, serial number logging, and cryptographic SVG client signature. Backed by `/deliverables/presigned-url` and `/signature`.               | Unified vertical stepper on active job screen with offline-safe status indicators for each evidence asset.                          |

_Rationale for Tier 1_: If any of these five features fail or are buried under menus, the marketplace stops functioning. Time-to-value directly depends on the speed of these five operations.

---

### 2.2 Secondary Features (Tier 2 — Tactical Optimization & Telemetry)

Features that support, accelerate, or verify the primary workflows. They should be accessible via contextual drawers, slide-outs, or secondary tabs.

| Feature Identifier | Feature Name                            | Primary Actor | Description & Backend Binding                                                                                                                                              | UX Placement & Interaction Standard                                                        |
| :----------------- | :-------------------------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `FEAT-SEC-01`      | **Geospatial Radar & Proximity Search** | `BUYER`       | Circular radar scope showing certified technicians within 5, 10, 25, or 50 miles. Backed by Redis `GET /dispatch/technicians/nearby`.                                      | Contextual view inside the dispatch board or SOW authoring tool.                           |
| `FEAT-SEC-02`      | **Bids Comparison Matrix**              | `BUYER`       | Comparative matrix of incoming technician proposals displaying proposed rate, ETA, rating, and badges. Backed by `GET /work-orders/:id/bids`.                              | Slide-over drawer on `PUBLISHED` tickets with 1-click "Accept Bid & Assign" action.        |
| `FEAT-SEC-03`      | **1-Click Auto-Dispatch**               | `BUYER`       | Automated matching engine assigning tickets $\le 5$ miles to top-rated contractors. Backed by `POST /dispatch/auto-route`.                                                 | Instant toggle during ticket creation or quick-action on urgent tickets.                   |
| `FEAT-SEC-04`      | **Deliverable Evidence Inspector**      | `BUYER`       | High-resolution image lightbox, serial number copy tool, and SHA-256 digital signature audit verification. Backed by `/deliverables` and `/deliverables/:id/download-url`. | Modal inspection pane with side-by-side before/after comparison before escrow release.     |
| `FEAT-SEC-05`      | **Rapid Proposal & Counter-Note Sheet** | `TECHNICIAN`  | Fast rate submission with incremental steppers (+$10, -$10) and arrival time estimates. Backed by `POST /work-orders/:id/bids`.                                            | Smooth bottom sheet on mobile triggered by tapping "Submit Bid" on any nearby gig card.    |
| `FEAT-SEC-06`      | **Offline Queue & Reconnection Banner** | `TECHNICIAN`  | Background sync manager queuing mutations during signal drop and auto-synchronizing upon reconnection. Backed by local SQLite / MMKV store.                                | Non-intrusive amber top banner indicating pending mutations with manual "Sync Now" button. |

---

### 2.3 Utility Features (Tier 3 — Configuration & Account Operations)

Features necessary for user identity, compliance, financial records, and operational preferences. These belong in secondary utility bars, dropdown menus, or account settings.

| Feature Identifier | Feature Name                                  | Primary Actor | Description & Backend Binding                                                                                                        | UX Placement                                                |
| :----------------- | :-------------------------------------------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| `FEAT-UTL-01`      | **Phone OTP Verification**                    | ALL           | 6-digit SMS code delivery and verification for fraud prevention. Backed by `POST /auth/phone/*`.                                     | Inline step during onboarding or profile security settings. |
| `FEAT-UTL-02`      | **Earnings Ledger & 1099 Summary**            | `TECHNICIAN`  | Itemized double-entry credit/debit transaction history and gross payout summaries. Backed by `GET /billing/technicians/:id/payouts`. | Dedicated "Earnings" tab in bottom navigation.              |
| `FEAT-UTL-03`      | **Corporate Invoicing & Statement Downloads** | `BUYER`       | Searchable archive of monthly PDF/A buyer invoices with cryptographic content hashes. Backed by `GET /billing/invoices/:id/pdf`.     | Secondary tab under Billing / Finance.                      |
| `FEAT-UTL-04`      | **Accreditation Badge Management**            | `TECHNICIAN`  | Document upload for Cisco CCNA, OSHA 10, CompTIA A+, and background checks. Backed by `POST /technicians/certifications`.            | Profile -> Compliance Badges.                               |
| `FEAT-UTL-05`      | **Profile & Rate Settings**                   | ALL           | Managing company billing address, technician standard hourly rates, and notifications. Backed by `GET/PATCH /users/me`.              | Profile / Settings drawer.                                  |

---

### 2.4 Administrative Features (Tier 4 — Governance & Platform Trust)

Operational capabilities reserved for platform dispatchers, compliance officers, and administrators. Kept completely segregated from buyer and technician primary views.

| Feature Identifier | Feature Name                       | Primary Actor          | Description & Backend Binding                                                                                                                    | UX Placement                                    |
| :----------------- | :--------------------------------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------- |
| `FEAT-ADM-01`      | **Contractor Accreditation Queue** | `ADMIN` / `DISPATCHER` | Reviewing pending certification uploads and approving/rejecting badges. Backed by `PATCH /technicians/certifications/:id/verify`.                | Admin Operations -> Accreditation Queue.        |
| `FEAT-ADM-02`      | **Dispute Mediation Console**      | `ADMIN`                | Reviewing contested tickets (`DISPUTED`), inspecting deliverables, and arbitrating refunds vs. payouts. Backed by transactional FSM transitions. | Admin Operations -> Dispute Resolution Console. |
| `FEAT-ADM-03`      | **Service Health & SLO Dashboard** | `ADMIN`                | Monitoring Prometheus metrics, RabbitMQ queue latencies, and API error budgets. Backed by `/healthz`, `/readyz`, and `/metrics`.                 | Dedicated Admin Ops Telemetry portal.           |

---

### 2.5 Rare Features (Tier 5 — High-Impact Infrequent Actions)

Actions that carry significant financial, legal, or operational consequences. They must require explicit confirmation, clear risk warnings, and progressive disclosure to prevent catastrophic errors.

| Feature Identifier | Feature Name                                | Primary Actor          | Description & Backend Binding                                                                                                                       | UX Safeguards                                                                        |
| :----------------- | :------------------------------------------ | :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| `FEAT-RARE-01`     | **Pre-Departure Ticket Cancellation**       | `BUYER`                | Halting a work order in `DRAFT`, `PUBLISHED`, or `ASSIGNED` with full escrow refund. Backed by `POST /work-orders/:id/transition` (`-> CANCELLED`). | Requires reason input and 2-step confirmation warning of contractor schedule impact. |
| `FEAT-RARE-02`     | **Formal Quality / SLA Dispute Escalation** | `BUYER` / `TECHNICIAN` | Freezing escrow release and submitting an order for administrative arbitration. Backed by `POST /work-orders/:id/transition` (`-> DISPUTED`).       | Structured dispute modal requiring evidence rationale; disables direct cancellation. |
| `FEAT-RARE-03`     | **Manual Emergency Dispatch Override**      | `DISPATCHER`           | Forcing reassignment of an unassigned ticket approaching SLA breach. Backed by manual FSM re-assignment.                                            | Admin-only guarded action with mandatory audit justification field.                  |

---

## 3. User Flow Priority Hierarchy

This ranking dictates the design, prototyping, testing, and implementation sequence. P0 flows must be completely hardened before P1 flows are tackled.

```
+-------------------------------------------------------------------------------+
|                        FLOW IMPLEMENTATION SEQUENCING                         |
+-------------------------------------------------------------------------------+
  P0 — CRITICAL (Zero-Defect Core Funnels)
  ├── Flow 1: Buyer SOW Creation -> Escrow Pre-Auth -> Instant Publish
  ├── Flow 2: Technician Nearby Gig Discovery -> Bid Proposal Submission
  ├── Flow 3: Buyer Bid Evaluation -> 1-Click Assignment (or Auto-Dispatch)
  ├── Flow 4: Technician Transit -> Geofenced Check-In (<=200m)
  └── Flow 5: On-Site Execution -> Deliverables Capture -> Sign-Off -> Completion

  P1 — HIGH (Essential Operations & Settlement)
  ├── Flow 6: Buyer Deliverable Review -> Escrow Release -> PDF Invoice
  ├── Flow 7: Mobile Offline Logging -> Background Queue Reconnect Sync
  └── Flow 8: Contextual Registration & Progressive Phone OTP Verification

  P2 — SUPPORTING (Account, Compliance & Records)
  ├── Flow 9: Technician Accreditation Upload & Admin Verification
  ├── Flow 10: Technician Earnings & 1099 Ledger Inspection
  └── Flow 11: Buyer Multi-Ticket Filtering & SLA Breach Escalation Monitoring

  P3 — RARE / ADMINISTRATIVE (Exception Handling & Governance)
  ├── Flow 12: Work Order Dispute Raising -> Evidence Review -> Final Settlement
  └── Flow 13: Ticket Pre-Departure Cancellation & Escrow Balance Refund
```
