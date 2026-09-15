# 02 — User Behavioral Personas & Jobs To Be Done (JTBD)

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Behavioral Persona Architecture & Value-Driven Task Taxonomy

---

## 1. Behavioral Product Personas

FieldForge is a multi-sided commercial ecosystem. Personas are strictly defined by operational behavior, financial accountability, and physical context—never superficial marketing demographics.

---

### Persona A: The Enterprise Field Operations Manager ("The Urgent Dispatcher")

- **Role Identifier**: `BUYER`
- **Organizational Context**: Works at a Managed Service Provider (MSP), nationwide telecommunications operator, or retail IT support company managing 50–500 retail sites or regional branches.
- **Mental State & Environment**: High stress, multi-monitor operations desk, running parallel browser tabs, tracking urgent ticket SLAs under customer penalty clauses (e.g. $500/hr SLA breach penalty).
- **Core Goal**: Dispatch a competent, verified technician to a remote site immediately (< 2 hrs) to restore broken infrastructure with zero guesswork or manual phone tag.
- **Motivation**: Maintain client SLA compliance, prevent network downtime, eliminate fraudulent billing, and obtain undeniable proof of work for executive audits.
- **Pain Points with Legacy / Current Systems**:
  - Unresponsive contractors or fake credentials.
  - "Ghosting" where a contractor accepts a job but fails to arrive on time.
  - Disputed invoices without photographic or serial number proof.
  - Slow, bureaucratic ticket creation processes with 15 mandatory screens.
- **Expected Technical Knowledge**: High familiarity with IT networking hardware (switches, APs, POS terminals, fiber terminators), enterprise ticketing systems (ServiceNow, Jira), and operational metrics. Low patience for slow or playful UI.
- **Most Frequent Actions**:
  1. Checking active ticket lifecycle progression (`EN_ROUTE`, `ON_SITE`).
  2. Inspecting technician bids and selecting the optimal contractor.
  3. Reviewing uploaded photo deliverables and client signatures.
- **Highest-Value Action**: 1-click publishing and auto-routing an emergency ticket with locked escrow funds.
- **Activation Event**: First published work order receives a qualified, verified bid within 15 minutes.
- **Abandonment Triggers**:
  - Inability to quickly see if technicians actually exist nearby before entering a credit card.
  - Complex, tedious SOW creation requiring redundant manual data entry.
  - Unclear or hidden platform fee structures.

---

### Persona B: The Certified Independent Field Engineer ("The Tactical Contractor")

- **Role Identifier**: `TECHNICIAN`
- **Organizational Context**: 1099 independent contractor, licensed low-voltage electrician, or certified Cisco/CompTIA technician operating a service truck across a 30–60 mile metro radius.
- **Mental State & Environment**: Mobile-only, inside a service vehicle, wearing work gloves, dealing with glare, intermittent LTE/5G reception, or subterranean datacenter vaults with zero signal.
- **Core Goal**: Maximize billable hours, find high-rate commercial gigs nearby, check in effortlessly, submit deliverables rapidly, and receive prompt, guaranteed payouts.
- **Motivation**: Predictable cash flow, transparent pay without net-60 corporate delays, autonomy over schedule, and protection against bad-faith non-payment.
- **Pain Points with Legacy / Current Systems**:
  - Delayed payment cycles (net-30 or net-60 days).
  - Driving to a site only to have the client cancel with zero travel compensation.
  - Mobile apps that crash, lose photo uploads in low-signal areas, or drain battery life with unoptimized GPS polling.
  - Ambiguous scopes of work that lead to unpaid scope creep.
- **Expected Technical Knowledge**: Deep domain expertise in physical cabling, server racking, optical power meters, and diagnostic testing. High mobile fluency, but needs quick, thumb-friendly interactions with high contrast.
- **Most Frequent Actions**:
  1. Scanning the local gig radar / available work order feed.
  2. Submitting rate proposals with estimated arrival times.
  3. Executing geofenced check-in and uploading before/after photos.
- **Highest-Value Action**: Completing the deliverable checklist, obtaining the client's on-screen signature, and triggering the escrow release cycle.
- **Activation Event**: Submitting a bid on a nearby gig, having it accepted by a buyer, and seeing the funds pre-authorized in escrow.
- **Abandonment Triggers**:
  - Requiring extensive tax and bank account setup before letting them even view available jobs and payout rates in their area.
  - App freezes or upload loss when moving in and out of offline server basements.
  - Client payment disputes that freeze earnings indefinitely without clear platform arbitration.

---

### Persona C: The Compliance & Dispute Auditor ("The Platform Arbitrator")

- **Role Identifier**: `DISPATCHER` / `ADMIN`
- **Organizational Context**: Internal FieldForge operational staff responsible for platform trust, contractor credential verification, and SLA adherence.
- **Mental State & Environment**: High-throughput queue management, detail-oriented risk mitigation, compliance auditing.
- **Core Goal**: Verify technician credentials rapidly, resolve payment disputes fairly with immutable proof, and maintain marketplace liquidity.
- **Most Frequent Actions**:
  1. Reviewing pending technician certificates (Cisco CCNA, OSHA 10) against issuing authority records.
  2. Arbitrating disputed work orders by reviewing the immutable audit history, S3 photos, and geofence logs.
  3. Releasing funds to technician or refunding escrow to buyer.
- **Highest-Value Action**: Mediating a dispute to a conclusive, contractually documented settlement within < 4 business hours.
- **Activation Event**: Rapid resolution of contractor onboarding backlogs without friction.

---

## 2. Jobs To Be Done (JTBD) Framework

Every feature, button, and navigation node in FieldForge must directly satisfy one of the following ranked JTBDs.

```
+-------------------------------------------------------------------------------+
|                        JOBS TO BE DONE RANKING & IMPACT                       |
+-------------------------------------------------------------------------------+
  CRITICAL (P0)  -> Primary Navigation, Immediate CTAs, Zero-Friction Entry
  HIGH (P1)      -> Secondary Navigation, 1-Click Flyouts, Prominent Widgets
  MEDIUM (P2)    -> In-Page Tabs, Detailed Tables, Progressive Disclosure
  LOW (P3)       -> Utility Menus, Account Sub-Settings, Archival Exports
```

### 2.1 Enterprise Buyer JTBDs

| Rank         | Identifier    | Situation                                                                                         | Motivation / Action                                                                                             | Desired Outcome                                                                           | IA / UX Impact                                                                              |
| :----------- | :------------ | :------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Critical** | `JTBD-BUY-01` | When a remote retail location experiences critical hardware failure (e.g. POS or router offline), | I want to specify the location, problem, and budget, and broadcast the ticket immediately,                      | So an accredited technician is assigned and en route within 60 minutes without phone tag. | Primary CTA on Command Header ("Create Work Order"); 1-click templates for common failures. |
| **Critical** | `JTBD-BUY-02` | When multiple technicians bid on my emergency ticket,                                             | I want to compare their distance, rating, badges, and proposed rate side-by-side,                               | So I can assign the most qualified and closest engineer with 1 click.                     | High-density Bids Evaluation Matrix integrated directly into the Ticket Command Drawer.     |
| **Critical** | `JTBD-BUY-03` | When a technician is en route and on site,                                                        | I want real-time telemetry showing travel status, geofenced arrival, and SLA countdowns,                        | So I can report exact recovery status to executive stakeholders without calling the tech. | Live Pulse FSM Stepper, Map Radar Scope, and Flashing SLA Breaching Counters.               |
| **High**     | `JTBD-BUY-04` | When a technician marks a job completed,                                                          | I want to inspect high-resolution before/after photos, verified hardware serials, and store manager signatures, | So I can verify contract fulfillment before authorizing the release of escrow funds.      | Side-by-side Evidence Gallery with Zoom, EXIF timestamp verification, and SHA-256 badge.    |
| **High**     | `JTBD-BUY-05` | When an emergency ticket requires immediate dispatch without waiting for bids,                    | I want to trigger an automated rule-based match to the nearest top-rated technician within 5 miles,             | So the assignment is instant and travel begins immediately.                               | 1-Click "Auto-Dispatch" toggle on work order authoring and radar views.                     |
| **Medium**   | `JTBD-BUY-06` | When monthly corporate accounting reconciliation occurs,                                          | I want to download immutable PDF/A invoices matching escrow transactions with content hashes,                   | So corporate accounts payable has zero audit discrepancies.                               | Escrow Ledger tab with instant PDF stream and SHA-256 verification indicator.               |
| **Low**      | `JTBD-BUY-07` | When configuring corporate procurement policies,                                                  | I want to set default arrival windows, certified badge requirements, and billing addresses,                     | So my team doesn't re-enter standard organizational data on every ticket.                 | Buyer Settings -> SOW Preset Defaults.                                                      |

---

### 2.2 Field Technician JTBDs

| Rank         | Identifier     | Situation                                                                              | Motivation / Action                                                                                                   | Desired Outcome                                                                            | IA / UX Impact                                                                                               |
| :----------- | :------------- | :------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Critical** | `JTBD-TECH-01` | When I open the mobile app in my service vehicle,                                      | I want to see a clear list/map of high-paying gigs nearby with transparent payout amounts and distance,               | So I can choose profitable jobs along my transit route within 30 seconds.                  | Root mobile screen defaults to Nearby Gigs Feed with prominent Payout Badges and Mileage.                    |
| **Critical** | `JTBD-TECH-02` | When I find a job matching my skills and schedule,                                     | I want to submit a proposed rate and ETA or accept a direct dispatch immediately,                                     | So I secure the job before other contractors claim it.                                     | 1-Tap "Submit Bid" bottom sheet with quick-increment hourly/fixed rate steppers.                             |
| **Critical** | `JTBD-TECH-03` | When I arrive in the parking lot of the customer site,                                 | I want the app to verify my physical presence automatically and let me check in with 1 tap,                           | So my billable on-site time begins without dispute.                                        | GPS Radar Widget showing distance countdown and unlocking green "Check In (On Site)" when $\le 200\text{m}$. |
| **High**     | `JTBD-TECH-04` | When I am working inside a shielded server room or basement with zero cellular signal, | I want to check off tasks, photograph equipment, and record serial numbers without the app freezing or dropping data, | So all proof of work is safely stored locally and syncs automatically when I step outside. | Persistent Offline Queue banner ("3 offline mutations queued") with zero modal blocking.                     |
| **High**     | `JTBD-TECH-05` | When work is done and I present the device to the store manager,                       | I want a clean, responsive surface for them to sign their name,                                                       | So I capture an indisputable cryptographic sign-off.                                       | Full-screen signing modal with clear signer name input and clear/re-sign options.                            |
| **Medium**   | `JTBD-TECH-06` | When a job is approved or reaches the 72-hour window,                                  | I want to see the funds credited to my available payout ledger with zero hidden deductions,                           | So I know exactly when and how much I will be paid.                                        | Earnings & Payouts screen with clear breakdown of Gross, Fee, and Net Settlement.                            |
| **Low**      | `JTBD-TECH-07` | When I achieve a new technical certification (e.g. Cisco CCNA, OSHA 10),               | I want to upload a photo of my certificate and license ID,                                                            | So the platform awards me vetted badges that unlock higher-paying enterprise tickets.      | Profile -> Accreditation Badges -> Upload & Status tracking.                                                 |

---

### 2.3 Operations & Administrator JTBDs

| Rank         | Identifier    | Situation                                                       | Motivation / Action                                                                                                                      | Desired Outcome                                                                        | IA / UX Impact                                                                               |
| :----------- | :------------ | :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Critical** | `JTBD-ADM-01` | When a buyer disputes a completed work order,                   | I want to inspect the complete immutable state history, geofence check-in timestamp, uploaded deliverables, and signatures side-by-side, | So I can fairly arbitrate between releasing escrow to the tech or refunding the buyer. | Split-screen Dispute Arbitration Console with tamper-evident audit trail viewer.             |
| **High**     | `JTBD-ADM-02` | When a technician uploads a new certification document,         | I want to verify its authenticity and toggle their verified badge status,                                                                | So only vetted technicians are dispatched to secure client datacenters.                | Dedicated Contractor Vetting Queue with zoomable document viewer and 1-click Approve/Reject. |
| **Medium**   | `JTBD-ADM-03` | When system queue latencies or dispatch unassigned rates spike, | I want instant telemetry on RabbitMQ topic flows and Redis geo indexes,                                                                  | So operational bottlenecks are diagnosed before buyer SLAs breach.                     | Platform Telemetry & SLO Command Board.                                                      |
