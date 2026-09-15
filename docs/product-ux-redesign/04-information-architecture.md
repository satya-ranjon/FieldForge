# 04 — Information Architecture (IA) Specification

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Structural Hierarchy, Contextual Navigation & Mental Model Alignment

---

## 1. Structural Information Hierarchy Tree

The Information Architecture is organized strictly around user operational context rather than internal microservice boundaries. The model cleanly bifurcates authenticated experiences based on user role (`BUYER` web command center vs. `TECHNICIAN` mobile-first cockpit vs. `ADMIN` oversight), while providing an open, high-value public discovery layer.

```
FIELDFORGE ROOT
├── 1.0 Public Experience (Pre-Authentication)
│   ├── 1.1 Command Landing & Value Engine
│   │   ├── 1.1.1 Interactive Live Marketplace Radar Preview (Simulated Telemetry)
│   │   ├── 1.1.2 Instant SOW Estimator & Escrow Calculator
│   │   ├── 1.1.3 Verified Accreditation Standards (OSHA, Cisco, CompTIA)
│   │   └── 1.1.4 Transparent Escrow Security Model (+8% Fee Structure)
│   ├── 1.2 Enterprise Solutions & Coverage Map
│   └── 1.3 Contractor Network & Earning Calculator
│
├── 2.0 Authentication & Identity Gate
│   ├── 2.1 Contextual Modal Login / Register (Role-Selector: Enterprise Buyer vs. Certified Technician)
│   ├── 2.2 Phone OTP Verification Gate (6-digit SMS verification)
│   └── 2.3 Password Recovery & Session Refresh Mutex
│
├── 3.0 Enterprise Buyer Experience (Web Command Center)
│   ├── 3.1 Live Operations Hub (Root / Default Landing)
│   │   ├── 3.1.1 Active Dispatch Board (Kanban / Dense List: Draft -> Paid)
│   │   ├── 3.1.2 SLA Countdown & Escalation Radar (<4h urgent alert banner)
│   │   └── 3.1.3 Work Order Detail Drawer / Slide-Over
│   │       ├── SOW Scope & Hardware Manifest
│   │       ├── Live FSM Stepper & GPS Radar Check-In Status
│   │       ├── Deliverables Evidence Gallery (Photos, Serials, Signatures)
│   │       ├── Bids Matrix & 1-Click Assignment
│   │       └── Audit History Log
│   ├── 3.2 SOW Creation Studio (Primary Global CTA)
│   │   ├── 3.2.1 Template Presets (POS Emergency, Fiber Splicing, Meraki AP)
│   │   ├── 3.2.2 Location & Geocoding Picker (Address + Coordinates)
│   │   ├── 3.2.3 SLA Windows, Category & Skill Badges Selection
│   │   └── 3.2.4 Budgeting, Transparent Fees & Escrow Pre-Auth Lock
│   ├── 3.3 Contractor Radar & Directory
│   │   ├── 3.3.1 Redis Geospatial Radar Scope (5, 10, 25, 50 mi radius)
│   │   ├── 3.3.2 Contractor Profiles (Ratings, Badges, Completed Jobs)
│   │   └── 3.3.3 Direct Dispatch Dispatcher
│   ├── 3.4 Escrow Vault & Financial Ledgers
│   │   ├── 3.4.1 Active Escrow Vault Balance & Pre-Auth Holds
│   │   ├── 3.4.2 72h Auto-Approval Countdown Ledger
│   │   └── 3.4.3 Immutable Invoices & PDF/A Downloads (Content Hash Verification)
│   └── 3.5 Organization Settings & SOW Defaults
│
├── 4.0 Field Technician Experience (Mobile-First Tactical Cockpit)
│   ├── 4.1 Nearby Gigs Feed (Root / Default Landing)
│   │   ├── 4.1.1 Proximity List / Map Toggle
│   │   ├── 4.1.2 Category, Payout & Distance Filters
│   │   └── 4.1.3 Gig Preview Sheet (Scope, Address, Escrow Status, Pay)
│   ├── 4.2 Active Gig Workspace (Modal Takeover when Job is Assigned)
│   │   ├── 4.2.1 Travel Phase: Address Navigation & Start Travel Action
│   │   ├── 4.2.2 Geofence Check-In Radar: Live distance countdown (<=200m unlock)
│   │   ├── 4.2.3 Execution Phase: Task Checklist, Serial Number Input
│   │   ├── 4.2.4 Proof of Work: Before/After S3 Camera Capture
│   │   ├── 4.2.5 Sign-Off: Client On-Screen SVG Signature Capture
│   │   └── 4.2.6 Offline Mutation Queue Banner & Status Indicator
│   ├── 4.3 My Gigs & Schedule
│   │   ├── 4.3.1 Active & En-Route Gigs
│   │   ├── 4.3.2 Submitted Proposals / Bids Status
│   │   └── 4.3.3 Historical Completed Gigs Archive
│   ├── 4.4 Earnings & Payout Ledger
│   │   ├── 4.4.1 Available Payout Balance
│   │   ├── 4.4.2 Double-Entry Ledger (Credit/Debit line items)
│   │   └── 4.4.3 Year-to-Date 1099 Tax Summary
│   └── 4.5 Technician Profile & Credentials
│       ├── 4.5.1 Hourly Rate & Service Radius Settings
│       ├── 4.5.2 Accreditation Badges Upload (Cisco, CompTIA, OSHA)
│       └── 4.5.3 Background Check Verification Status
│
└── 5.0 Platform Administration & Governance (Operations Oversight)
    ├── 5.1 Dispute Resolution Console (FSM Arbitrations & Refund/Release Triggers)
    ├── 5.2 Contractor Accreditation Vetting Queue (Manual Certification Approval)
    └── 5.3 System Observability & Telemetry (SLIs/SLOs, Queue Fanout, Healthz/Readyz)
```

---

## 2. Navigation Architecture Breakdown

### 2.1 Desktop Navigation (Enterprise Buyer Command Center)

```
+----------------------------------------------------------------------------------------------------+
|  [LOGO] FieldForge  |  [Live Status: AMQP/Redis 12ms]  |  [Escrow: $14,250]  |  [Search]  [+ NEW WO]  |
+----------------------------------------------------------------------------------------------------+
|  SIDEBAR           |  MAIN COMMAND WORKSPACE                                                       |
|  ----------------- |  ---------------------------------------------------------------------------  |
|  [⚡ Operations]   |  Header: Active Operations (12 active, 2 critical SLA)                       |
|  [📍 Tech Radar]   |  ---------------------------------------------------------------------------  |
|  [💳 Escrow Vault] |  [Filter: All Statuses v] [Search tickets...] [Sort: Urgent SLA v]           |
|  [📋 Templates]    |  ---------------------------------------------------------------------------  |
|                    |  WO-101 | Fiber Repair  | 1.2mi | EN_ROUTE  | $350 | SLA: 01:24:10 [Inspect] |
|  ----------------- |  WO-102 | POS Swap      | 3.8mi | PUBLISHED | $180 | 4 Bids Ready  [Review]  |
|  [⚙️ Settings]     |  WO-103 | Switch Config | 0.4mi | ON_SITE   | $220 | Executing     [Inspect] |
|  [👤 Org Profile]  |                                                                               |
+----------------------------------------------------------------------------------------------------+
```

1. **Header Command Bar (Global)**:
   - **Logo & Operational Pulse**: Real-time websocket/AMQP heartbeat badge (`ONLINE (12ms)`) reassuring buyers of live socket connectivity `[UX Recommendation]`.
   - **Escrow Liquidity Vault Chip**: Total pre-authorized and locked escrow capital visible at all times `[UX Recommendation]`.
   - **Global Action Primary CTA**: Prominent Electric Blue `[+ New Work Order]` button accessible from every screen.
   - **Global Omnibox Search (`Cmd+K`)**: Rapid keyboard-first navigation jumping straight to ticket IDs (`WO-101`), contractor names, or site addresses.
2. **Left Navigation Sidebar (Workspace Level)**:
   - **Operations**: The primary workspace. Defaults to active ticket boards with zero sub-clicks.
   - **Tech Radar**: Dedicated geospatial radius visualization for territory planning and contractor density inspection.
   - **Escrow Vault**: Financial ledger, 72h auto-approval monitoring, and PDF invoice generation.
   - **Templates**: Organizational standard SOW configurations.
3. **Contextual Action Panels (Page Level)**:
   - Clicking any work order opens a **Right-Side Slide-Over Command Drawer** rather than navigating away to a new full page. This preserves the dispatcher's mental state and position in the operations board.

---

### 2.2 Mobile Navigation (Field Technician Cockpit)

```
+-------------------------------------------------------------+
|  [Top Bar]  FieldForge  |  [GPS: Sync]  |  [🟢 Online / ✈️] |
+-------------------------------------------------------------+
|  [Offline Banner]  ⏳ 2 offline mutations queued  [Sync Now] |
+-------------------------------------------------------------+
|  MAIN TACTICAL FEED                                         |
|                                                             |
|  [Card] POS Terminal Emergency                              |
|  📍 Downtown Retail Mall (1.4 miles away)                   |
|  💰 $180.00 Guaranteed Escrow | ⏱️ Arrival: < 2 hrs          |
|  [Review Scope & Submit Bid]                                |
|                                                             |
|  [Card] Meraki AP Installation                              |
|  📍 Medical Center (3.1 miles away)                         |
|  💰 $240.00 Guaranteed Escrow | ⏱️ Tomorrow 9:00 AM         |
|  [Review Scope & Submit Bid]                                |
|                                                             |
+-------------------------------------------------------------+
|  [BOTTOM TABS]                                              |
|  [ 📍 Nearby ]   [ ⚡ My Gigs ]   [ 💵 Earnings ]   [ 👤 Profile ] |
+-------------------------------------------------------------+
```

1. **Top Telemetry & Sync Bar**:
   - Status indicators for GPS synchronization accuracy and network connectivity (`🟢 Online` vs. `✈️ Offline`).
   - Persistent offline sync drawer that surfaces during network drop with an explicit queue count (`3 queued`).
2. **Bottom Thumb-Zone Navigation (4 Fixed Tabs)**:
   - **Nearby (Tab 1 - Default)**: Feed and map of nearby open gigs available for bidding or auto-dispatch.
   - **My Gigs (Tab 2)**: Active gigs, en-route navigations, and submitted bids awaiting buyer review.
   - **Earnings (Tab 3)**: Settled escrow balances, 1099 ledger line items, and payout withdrawal tracking.
   - **Profile (Tab 4)**: Standard rates, service radius, and verified accreditation badges.
3. **Active Job Modal Takeover**:
   - When a technician has a job in `ASSIGNED`, `EN_ROUTE`, or `ON_SITE`, the bottom tabs are superseded by a persistent **Active Job Action Drawer** anchored to the bottom thumb zone, ensuring zero accidental navigation away from an ongoing gig.

---

## 3. Structural Hierarchy Placement Rationales

| Node / Section                     | Hierarchy Level            | Ergonomic & Behavioral Rationale                                                                                                                                              |
| :--------------------------------- | :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SOW Creation Studio**            | Global Action (Header)     | Creating work orders is the buyer's primary monetizable action. It must never be buried behind a sub-menu.                                                                    |
| **Active Dispatch Board**          | Top Level (Root Default)   | Dispatchers open the app to check on the status of ongoing work and resolve bottlenecks. Forcing a click through a "Home" dashboard is pure friction.                         |
| **Work Order Detail Drawer**       | Contextual Slide-Over      | Navigating to a full-page view loses filter state, scroll position, and ambient awareness of other active tickets. Slide-overs maintain high operational density.             |
| **Geofenced Check-In Radar**       | Contextual Screen Takeover | Check-in requires immediate physical awareness and GPS accuracy. It is placed front-and-center when ticket status reaches `EN_ROUTE`.                                         |
| **Proof-of-Work Deliverables**     | Linear Vertical Stepper    | Deliverables require 100% completion before job closing. A linear stepper prevents technicians from missing required before-photos or signatures before leaving the job site. |
| **Invoices & Ledgers**             | Secondary / Utility Tab    | Billing reconciliation happens at end-of-month or after hours; it should not compete for visual attention with real-time operational tickets.                                 |
| **Accreditation Badge Management** | Profile Sub-Level          | Certification uploads happen once every few months or years; placing it in the primary navigation would waste valuable ergonomic space.                                       |
