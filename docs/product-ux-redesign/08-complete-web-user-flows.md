# 08 — Complete Web User Flows & Web Architecture

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> High-Density Command Operations, Complete Decision Trees & Resilient Exception Paths

---

## 1. Web Architecture & Interaction Principles

The FieldForge Web Application is an **Enterprise Command Center** tailored for high-throughput operations desks (1080p to 4K multi-monitor workstations). It relies on:

1. **Zero-Latency State Feedback**: Live AMQP/Redis socket telemetry with micro-pulse status indicators.
2. **Context-Preserving Drawers**: Right-anchored slide-out drawers (480px to 640px) that allow deep ticket inspection without losing list position, scroll coordinates, or multi-criteria filter state.
3. **High Tabular Density**: JetBrains Mono monospace figures (`font-feature-settings: 'tnum' on`) for financial sums, SLA countdown timers, geocodes, and correlation IDs.
4. **Keyboard-First Shortcuts**: `Cmd+K` global search, `N` for new work order, `Escape` to dismiss drawers, `J`/`K` for list navigation.

---

## 2. Complete Web User Flow Maps

---

### Flow 1: Work Order Authoring, Escrow Pre-Auth & Broadcast (P0)

```
[ENTRY]
  Dispatcher clicks "+ New Work Order" (or presses 'N' anywhere on web)
        ↓
[SCREEN / STATE: SOW Studio Drawer]
  State: Step 1 (Scope & Presets)
        ↓
[USER ACTION]
  Selects "POS Emergency Swap" template (or enters custom title/category)
  Types SOW description: "Verifone terminal unresponsive; swap with spare in back room."
  Clicks "Next: Location & Schedule"
        ↓
[SYSTEM RESPONSE]
  Validates required fields via Zod client validator (`createWorkOrderSchema`).
  Advances to Step 2.
        ↓
[USER ACTION]
  Enters address: "1420 Main St, Dallas, TX 75201"
  Selects arrival window: "Emergency (< 2 Hours)"
        ↓
[SYSTEM RESPONSE]
  Geocoding engine resolves coordinates: `32.7767° N, -96.7970° W`.
  Renders micro-map pin with 200m geofence ring.
  Queries Redis `GEOSEARCH` in background: "14 certified technicians available within 10 miles."
        ↓
[USER ACTION]
  Clicks "Next: Budget & Escrow"
  Selects "Fixed Budget": Inputs `$250.00`
        ↓
[SYSTEM RESPONSE: Transparent Escrow Breakdown]
  Contractor Payout: $250.00
  FieldForge Platform Fee (8%): $20.00
  Total Pre-Authorization Hold: $270.00
  Pre-authorized via Default Corporate Amex (ending in 4092).
        ↓
[DECISION 1: Authentication Check]
  ├── Path A: User is Authenticated BUYER
  │     ↓
  │   [USER ACTION] Clicks "Fund Escrow & Broadcast"
  │     ↓
  │   [API SEQUENCE]
  │     1. POST /work-orders -> creates DRAFT [201 Created]
  │     2. POST /billing/escrow/preauth -> locks $270.00 in escrow_accounts [201 Created]
  │     3. POST /work-orders/:id/publish -> transitions to PUBLISHED [200 OK]
  │     4. RabbitMQ emits `work_order.lifecycle.published` to regional technician queue
  │     ↓
  │   [SUCCESS]
  │     Drawer closes. Operations Board highlights new ticket with cyan radar pulse.
  │     Toast: "Ticket WO-109 Broadcasted to 14 technicians."
  │     Next Best Action: "View Live Radar or Auto-Dispatch."
  │
  └── Path B: User is Unauthenticated Visitor
        ↓
      [SYSTEM RESPONSE]
        SOW draft saved to localStorage.
        Auth Modal opens: "Create account to lock escrow and broadcast."
        User completes auth -> System auto-executes Path A sequence.

[ERROR PATHS & RECOVERY FOR FLOW 1]
  - Geocoding Failure: "Unable to locate address coordinates. Please select pin on map manually."
  - Payment Pre-Auth Decline: "Corporate Amex declined (insufficient funds). [Update Card] or [Use Backup ACH]."
    Ticket remains in DRAFT state; escrow is not locked; nothing is broadcasted.
  - Concurrency Lock Conflict: Toast: "Network timeout while holding escrow. Re-submitting with idempotency key."
```

---

### Flow 2: Live Dispatch Radar, Bid Comparison & Assignment (P0)

```
[ENTRY]
  Buyer observes WO-109 in Operations Board (`PUBLISHED` status).
  Badge indicates: "3 Bids Received".
        ↓
[USER ACTION]
  Clicks "Review Bids (3)" on ticket row.
        ↓
[SCREEN / STATE: Bids Evaluation Matrix Drawer]
  API: `GET /work-orders/wo-109/bids`
  State: Populated with 3 contractor proposal cards:
    Card A: Tech David L. | $250.00 (Fixed) | ETA: 35 min | 4.9 ★ (84 jobs) | [Cisco CCNA] [OSHA 10]
    Card B: Tech Sarah M. | $280.00 (+$30)  | ETA: 20 min | 5.0 ★ (142 jobs)| [OSHA 10] | Counter: "Can be on site in 20m with spare cable"
    Card C: Tech Alex R.  | $220.00 (-$30)  | ETA: 90 min | 4.6 ★ (19 jobs) | [Background Checked]
        ↓
[USER ACTION: Evaluates Candidates]
  Hovering on Card B highlights Sarah's location on the radar scope (1.8 miles away).
        ↓
[DECISION 2: Acceptance Mode]
  ├── Path A: Accept Custom Bid (Sarah M. - Fast Arrival)
  │     ↓
  │   [USER ACTION] Clicks "Accept Bid ($280.00)"
  │     ↓
  │   [SYSTEM RESPONSE: Confirmation Dialog]
  │     "Accept Sarah M. for $280.00? (Escrow hold will adjust from $250 to $280 + fee. Sibling bids will be rejected)."
  │     Buyer confirms.
  │     ↓
  │   [API CALL: POST /work-orders/wo-109/bids/bid-2/accept]
  │     Backend executes transactional MySQL lock:
  │     - Marks bid-2 as ACCEPTED
  │     - Marks sibling bids as REJECTED
  │     - Sets assigned_technician_id = tech-sarah
  │     - Transitions work order status PUBLISHED -> ASSIGNED
  │     - Outbox emits `work_order.lifecycle.assigned`
  │     ↓
  │   [SUCCESS]
  │     Drawer updates to "Assigned to Sarah M. - Waiting for Departure".
  │     Push notification sent to Sarah's mobile app.
  │     Next Best Action: "Monitor Transit Telemetry."
  │
  └── Path B: Use 1-Click Auto-Dispatch (Emergency Speed)
        ↓
      [USER ACTION] Clicks "Auto-Dispatch Nearest Available (<= 5mi)"
        ↓
      [API CALL: POST /dispatch/auto-route]
        Matches highest-ranked technician within 5 miles immediately.
        Ticket transitions to ASSIGNED.
```

---

### Flow 3: Real-Time Operational Monitoring & Geofence Verification (P0)

```
[ENTRY]
  Buyer monitoring active board. Ticket WO-109 status changes via AMQP socket.
        ↓
[STATE 1: EN_ROUTE]
  Ticket card flashes amber pulse: "EN_ROUTE (Departed 14:02)".
  Radar shows technician moving toward Dallas site.
  ETA countdown displays: "Estimated arrival: 18 mins (SLA buffer: +42m)".
        ↓
[STATE 2: GEOFENCE CHECK-IN (ON_SITE)]
  Technician physically arrives at 1420 Main St (within 200m).
  Technician triggers check-in on mobile app.
  Backend verifies Haversine distance = 78 meters (< 200m).
  Status transitions `EN_ROUTE -> ON_SITE`.
  Ticket card turns Blue: "ON_SITE (Checked in 14:21)".
  SLA Timer freezes transit clock and starts on-site resolution counter.
        ↓
[DECISION 3: SLA Escalation Alert]
  ├── Path A: Normal Execution (< 2 hours)
  │     Technician proceeds with hardware replacement.
  │
  └── Path B: Approaching SLA Breach (> 90 mins on site)
        ↓
      [SYSTEM RESPONSE]
        Card header pulses Red with alert banner:
        "⚠️ SLA Warning: WO-109 is within 30 minutes of contractual resolution deadline."
        Action button surfaces: "[Call Tech]" / "[Notify Client Contact]".
```

---

### Flow 4: Deliverables Review, Cryptographic Verification & Escrow Release (P0)

```
[ENTRY]
  Technician completes work and submits deliverables from mobile.
  Buyer receives browser push notification & email:
  "WO-109 Completed by Sarah M. Deliverables ready for review."
        ↓
[USER ACTION]
  Buyer clicks notification -> Operations Board opens with WO-109 Drawer pre-expanded.
  Tab: "Deliverables & Proof of Work"
        ↓
[SCREEN / STATE: Evidence Gallery]
  API: `GET /work-orders/wo-109/deliverables`
  Displays 4 verified artifacts:
    1. Pre-Work Photo (`PHOTO_BEFORE`): Damaged POS terminal with cracked casing. S3 Verified.
    2. Post-Work Photo (`PHOTO_AFTER`): New terminal powered on showing diagnostic screen. S3 Verified.
    3. Hardware Serial Number: `SN-VERIFONE-8921-X` [Click to Copy].
    4. Client Sign-Off (`SIGNATURE`): Store manager signature image + SHA-256 Digest:
       `sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`
       Signed by: "Robert Henderson, Store Mgr" at 15:08.
        ↓
[DECISION 4: Approval vs. Dispute]
  ├── Path A: Buyer Approves Work (Happy Path)
  │     ↓
  │   [USER ACTION] Clicks "Approve Work & Release Escrow ($280.00)"
  │     ↓
  │   [CONFIRMATION MODAL]
  │     "Release $280.00 to Sarah M.? This action is irreversible. Funds will immediately credit the technician's payout ledger."
  │     Buyer confirms.
  │     ↓
  │   [API CALL: POST /billing/escrow/release]
  │     1. Transitions escrow status HELD -> RELEASED.
  │     2. Inserts CREDIT row into technician payout_ledger.
  │     3. Generates immutable PDF/A buyer invoice with content hash.
  │     4. Emits `billing.payout.disbursed`.
  │     5. Work order transitions COMPLETED -> APPROVED -> PAID.
  │     ↓
  │   [SUCCESS]
  │     Status badge turns Solid Green: "PAID".
  │     Link appears: "[Download PDF/A Invoice #INV-2026-089]".
  │     Next Best Action: "Archive Ticket" or "Rate Technician 5 Stars".
  │
  ├── Path B: Automatic 72-Hour Release Window (Passive Path)
  │     Buyer takes no action for 72 hours.
  │     SlaEscalationService cron sweeps order.
  │     Escrow releases automatically to technician. Buyer receives summary email.
  │
  └── Path C: Buyer Rejects Deliverables (Dispute Path)
        ↓
      [USER ACTION] Clicks "Reject Deliverables / Raise Dispute"
        ↓
      [SCREEN: Dispute Modal]
        Requires: Reason category ("Work incomplete", "Equipment not functional", "Fake photo") + Details.
        Submits: `POST /work-orders/wo-109/transition` (`nextStatus: DISPUTED`).
        Ticket freezes in `DISPUTED`. Escrow remains locked in `HELD`. Admin notified for arbitration.
```

---

## 3. Web Interaction Patterns & Responsive Layouts

### 3.1 Multi-Column Operations Board vs. Dense List Toggle

- **Kanban Board View**: Best for visual tracking across 4 primary columns: `PUBLISHED (Bidding)`, `ASSIGNED / EN_ROUTE`, `ON_SITE (Executing)`, and `COMPLETED (Review)`. Cards display high-contrast status tags, distance, technician name, and countdown timers.
- **Dense Telemetry Table View**: Best for enterprise dispatchers managing 50+ concurrent tickets. Columns include: ID, Category, Address, Status Beacon, Assigned Tech, Budget (Monospace), SLA Countdown, and Actions. Keyboard navigation (`J`/`K` to move up/down, `Enter` to open drawer).

### 3.2 Slide-Over Command Drawer Architecture

- Width: `600px` on 1080p, `720px` on 1440p/4K.
- Header: Ticket ID (`WO-109`), Category chip, and Current Status Badge with animated ping dot.
- Sticky Action Footer: Context-sensitive primary CTA (e.g. `[Fund & Publish]`, `[Accept Bid]`, or `[Release Escrow]`) always visible regardless of scroll depth.
- Keyboard: `Esc` closes drawer; `Ctrl+Enter` triggers primary action.
