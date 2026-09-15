# 11 — Screen-by-Screen UX Specifications

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> High-Fidelity Interaction Blueprints, Component Data Contracts & State Specifications

---

## 1. Screen Specification: Live Operations Command Board (`SCR-BUY-01`)

### 1.1 Metadata & Strategic Intent

- **User Role**: Enterprise Service Buyer (`BUYER`), Operations Dispatcher.
- **User Goal**: Instant, high-density visibility over all regional field tickets; rapid detection of SLA bottlenecks, arrival delays, and unassigned work orders.
- **Primary Outcome**: Zero unaddressed SLA breaches; immediate 1-click triage of pending tickets.

### 1.2 Information Hierarchy

1. **Urgent Telemetry Alert Bar**: High-contrast flashing banner if any ticket is within 45 minutes of SLA breach or unassigned for $>30$ minutes.
2. **KPI Pulse Track**: 4 compact monospace metrics: `Active Tickets (14)`, `On-Site Now (5)`, `SLA Compliance (99.4%)`, `Escrow Vault Locked ($18,400)`.
3. **Filter & Search Control Strip**: Search omnibox (`Cmd+K`), status segmented pill filter (`All`, `Bidding`, `En Route`, `On Site`, `Review`), category dropdown.
4. **Primary Ticket Matrix**: High-density table or Kanban grid with deterministic color-coded status badges, pulsing beacons, monospace distance, and live ETA countdowns.

### 1.3 Action & CTA Hierarchy

- **Primary Global Action**: `[+ New Work Order]` (Electric Blue, top right header).
- **Primary Row Action**: `[Inspect Ticket]` or `[Review Bids (N)]` (opens Right Slide-Over Drawer).
- **Secondary Row Action**: `[Quick Auto-Dispatch]` (triggers instant 5-mile rule match).

### 1.4 Content Sections & Required Data

- **Header**: Org Name, AMQP Heartbeat Badge (`ONLINE (12ms)`), Escrow Balance Chip.
- **Ticket Item Data Model**: `workOrders` (`id`, `title`, `category`, `status`, `scheduledStartTime`, `slaExpirationTime`, `budgetAmountMinor`, `addressLine`, `assignedTechnicianId`).

### 1.5 State Specifications

- **Loading State**: Shimmer skeleton cards mirroring exact table geometry; avoids layout shifts (`CLS = 0`).
- **Empty State**: Zero tickets found:
  - _Title_: "No Active Work Orders".
  - _Explanation_: "You have no field tickets currently in flight for this region."
  - _Action_: `[Create Emergency Work Order]` or `[Select Another Region]`.
- **Populated State**: Real-time rows with micro-pulsing status dots for active states (`PUBLISHED`, `EN_ROUTE`, `ON_SITE`).
- **Error State**: Banner: _"WebSocket telemetry disconnected. Reconnecting in 3s... [Manual Refresh]"_.
- **Disabled / Read-Only**: Disables action buttons during pending transactional mutations with inline spinners.

### 1.6 Navigation & Form-Factor Adaptations

- **Next Screen**: Clicking a ticket row slides open `SCR-BUY-03` (Work Order Command Drawer) without changing the background route.
- **Desktop**: Full 4-column responsive grid with keyboard shortcuts (`J`/`K` navigation).
- **Mobile**: Collapses to single-column card feed with pull-to-refresh.

---

## 2. Screen Specification: SOW Studio & Escrow Authoring (`SCR-BUY-02`)

### 2.1 Metadata & Strategic Intent

- **User Role**: Enterprise Service Buyer (`BUYER`).
- **User Goal**: Author and publish an emergency work order in $< 60$ seconds with guaranteed escrow funding.
- **Primary Outcome**: Ticket transitions from `DRAFT` to `PUBLISHED` with funds pre-authorized in escrow and broadcasted on Redis/RabbitMQ queues.

### 2.2 Information Hierarchy

1. **One-Click Blueprint Presets**: Top carousel of pre-configured templates (e.g. _Retail POS Swap_, _Fiber Optic Splice_, _Meraki AP Install_).
2. **Step 1: Scope & Title**: Title, category, and markdown task description.
3. **Step 2: Location & Schedule**: Site address, auto-geocoded coordinates, 200m geofence micro-map preview, and arrival SLA window.
4. **Step 3: Required Badges**: Checkbox chips for compliance requirements (`Cisco CCNA`, `OSHA 10`, `Background Checked`).
5. **Step 4: Budget & Escrow Calculator**: Transparent minor-unit breakdown: Contractor Budget + 8% Platform Fee = Total Pre-Auth Lock.

### 2.3 Action & CTA Hierarchy

- **Primary Action**: `[Fund Escrow & Broadcast Work Order]` (Electric Blue, bottom sticky bar).
- **Secondary Action**: `[Save as Unpublished Draft]` (Slate outline).
- **Dismiss Action**: `[Cancel / Close]` (warns if unsaved changes exist).

### 2.4 State Specifications

- **Loading State**: Inline spinner inside the geocoding input while address resolves.
- **Validation Error State**: Real-time inline field alerts (e.g. _"Address could not be geocoded"_, _"Budget must be at least $50.00"_).
- **Payment Failure State**: Inline card error: _"Corporate card pre-authorization failed. Please update payment instrument."_ Draft remains saved.

### 2.5 UX Decision: Transparent Escrow Calculator

- **Decision**: Display the exact contractor rate and the separate 8% platform fee openly before payment pre-authorization.
- **Reasoning**: Hidden marketplace markups destroy enterprise buyer trust. Transparent breakdown builds confidence and accelerates procurement approval.

---

## 3. Screen Specification: Work Order Command Drawer (`SCR-BUY-03`)

### 3.1 Metadata & Strategic Intent

- **User Role**: Enterprise Service Buyer (`BUYER`).
- **User Goal**: Deep inspection of ticket progression, bid evaluation, and cryptographic proof-of-work validation without leaving the dispatch board.
- **Primary Outcome**: Seamless bid acceptance or escrow release in a context-preserving container.

### 3.2 Information Hierarchy & Tabbed Layout

- **Drawer Header**: Monospace Ticket ID (`WO-109`), Category pill, and Deterministic Status Pill with animated live pulse.
- **Tab Bar**:
  - `Overview`: SOW details, hardware manifest, contact info.
  - `Live Radar`: Technician distance ring, GPS ping dot, and arrival ETA.
  - `Bids (N)`: Bids comparison matrix with 1-click acceptance.
  - `Deliverables`: Side-by-side photo gallery, serial numbers, and SHA-256 signature audit proof.
  - `History`: Immutable transition log with timestamps and correlation IDs.

### 3.3 Sticky Action Bar by Lifecycle State

- **When `PUBLISHED`**: `[Review Bids (3)]` or `[Auto-Dispatch Now]`.
- **When `ASSIGNED` or `EN_ROUTE`**: `[Track Live Transit]` (Opens map) | `[Cancel Work Order]` (Pre-departure only).
- **When `ON_SITE`**: `[View Real-Time Progress]` (Cancel button disabled; replaced with `[Raise SLA Dispute]`).
- **When `COMPLETED`**: `[Approve Work & Release Escrow ($280.00)]` (Primary) | `[Reject / Raise Dispute]` (Secondary).
- **When `PAID`**: `[Download PDF/A Invoice #INV-2026-089]` (Primary).

---

## 4. Screen Specification: Nearby Gigs Tactical Feed (`SCR-MOB-01`)

### 4.1 Metadata & Strategic Intent

- **User Role**: Field Technician (`TECHNICIAN`).
- **User Goal**: Discover profitable local jobs along their transit route within 30 seconds of opening the mobile app.
- **Primary Outcome**: Technician submits a bid or accepts a direct dispatch.

### 4.2 Information Hierarchy

1. **Top Telemetry Bar**: GPS Status (`GPS Synchronized`) + Network Badge (`🟢 Online` vs. `✈️ Airplane Mode`) + Pending Offline Mutation Counter.
2. **Radial Distance Slider Chip**: Quick-filter pills: `[5 mi]`, `[10 mi]`, `[25 mi]`, `[All]`.
3. **Gig Card List**: High-contrast cards featuring:
   - Category tag in bold cyan uppercase.
   - Large bold green payout figure (`$250.00 Guaranteed Escrow`).
   - Distance in bold white monospace (`1.4m away`).
   - Urgency chip (`Urgent: < 2h Arrival`).
   - Required certification chips (`✓ OSHA 10 Qualified`).

### 4.3 Action & CTA Hierarchy

- **Card Tap**: Opens `SCR-MOB-02` (Gig SOW Preview & Bidding Bottom Sheet).
- **Quick Action**: Swipe card right to "Save Gig" or left to "Dismiss".

---

## 5. Screen Specification: Active Gig Takeover Cockpit (`SCR-MOB-03`)

### 5.1 Metadata & Strategic Intent

- **User Role**: Field Technician (`TECHNICIAN`).
- **User Goal**: Execute physical arrival, proof-of-work capture, and client sign-off with zero distraction or accidental app exit.
- **Primary Outcome**: 100% complete deliverable package uploaded to S3 and order transitioned to `COMPLETED`.

### 5.2 Adaptive FSM Phase Containers

```
+-------------------------------------------------------------+
|  [PHASE 1: ASSIGNED]                                        |
|  - Address & Turn-by-Turn Navigation Trigger                |
|  - Primary Button: [Start Travel (En Route)]                |
+-------------------------------------------------------------+
|  [PHASE 2: EN ROUTE - GEOFENCE RADAR]                       |
|  - Visual Circular Radar Widget (200m Ring + Moving Ping)   |
|  - Distance Counter: "Distance: 140m"                       |
|  - Primary Button: [Geofence Check-In (On Site)]            |
|    (Unlocks only when distance <= 200m)                     |
+-------------------------------------------------------------+
|  [PHASE 3: ON SITE - DELIVERABLES & EVIDENCE]               |
|  - Section 1: Itemized Task Checklist (100% check rate)     |
|  - Section 2: Hardware Serial Number Input                  |
|  - Section 3: Before Photo & After Photo (S3 presigned PUT) |
|  - Section 4: Store Manager Signature Pad (SHA-256 Digest)  |
|  - Primary Button: [Complete Work Order]                    |
+-------------------------------------------------------------+
```

### 5.3 Offline Resilience Handshake

- If cellular network drops at any point during Phases 1, 2, or 3, a persistent amber banner indicates: _"Offline Mode Active. Check-ins, photos, and signatures are securely cached locally and will auto-sync on reconnect."_
- Zero modal blocking. All triggers remain interactive and operational.
