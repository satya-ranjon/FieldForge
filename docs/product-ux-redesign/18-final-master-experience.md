# 18 — Final Master Experience & Design System Direction

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> End-to-End Master Journeys, Interaction System Principles & Accessibility Foundations

---

## 1. The Master Experience Journeys

---

### 1.1 The Enterprise Buyer Master Journey

```
[1. PUBLIC DISCOVERY]
  Enterprise operations manager lands on FieldForge.
  Immediately sees the Interactive Radar Scope and enters their city or zip code.
  Sees 18 verified local engineers with badges (Cisco CCNA, OSHA 10) within 10 miles.
        ↓
[2. INTENT ACTIVATION]
  Clicks "Create Emergency Work Order".
  Selects "Retail POS System Failure" blueprint preset.
  Address auto-geocodes with a 200m geofence ring.
  Calculates budget: $250 contractor pay + 8% platform fee ($270 total hold).
        ↓
[3. CONTEXTUAL AUTH & SECURITY GATE]
  Clicks "Proceed to Publish & Match".
  Auth modal appears: Enters corporate email, company name, password.
  Inputs 6-digit SMS phone verification OTP (completed in 8 seconds).
        ↓
[4. ESCROW FUNDING & BROADCAST]
  Enters corporate payment card via secure Stripe Elements.
  $270.00 pre-authorized and locked into dedicated escrow account.
  Work order transitions to PUBLISHED!
  Dispatched via RabbitMQ topic exchange to nearby technicians.
        ↓
[5. BID EVALUATION & 1-CLICK ASSIGNMENT]
  Within 8 minutes, 3 proposals arrive.
  Buyer reviews the Bids Matrix Drawer: compares distance, rating, and badges.
  Clicks "Accept Bid" on a 5-star CCNA technician 2 miles away.
  Ticket transitions to ASSIGNED.
        ↓
[6. LIVE TELEMETRY TRACKING]
  Watches live updates on the Operations Board:
  - Tech marks EN_ROUTE (transit timer starts).
  - Tech physically arrives within 200m -> Geofence check-in verified -> Status: ON_SITE.
  - SLA timer monitors resolution deadline.
        ↓
[7. CRYPTOGRAPHIC PROOF & ESCROW RELEASE]
  Tech completes work.
  Buyer inspects Deliverables Lightbox:
  - Pre-work photo of damaged terminal (S3 verified).
  - Post-work photo of working terminal (S3 verified).
  - Scanned serial number: `SN-VERIFONE-8921-X`.
  - Client store manager digital signature + SHA-256 audit digest.
  Buyer clicks "Approve Work & Release Escrow".
  Funds immediately disburse to technician ledger; immutable PDF/A invoice generates.
        ↓
[8. REPEAT RETENTION]
  System prompts: "Save 'Retail POS' as an organizational template for your 84 branch locations?"
```

---

### 1.2 The Field Technician Master Journey

```
[1. ZERO-AUTH OPEN GIG RADAR]
  Technician launches mobile app in service truck.
  App opens directly to Nearby Gigs Feed without a login wall.
  Sees 3 open tickets within 15 miles with prominent green payout chips ($180, $250, $320).
        ↓
[2. PROPOSAL SUBMISSION & AUTH]
  Taps "$250 Emergency POS Swap" -> Reviews task checklist.
  Taps "Submit Proposal" -> Sets arrival ETA to "25 minutes".
  Auth bottom sheet appears: Enters phone number, name, and hourly rate.
  SMS OTP auto-fills; location permission granted.
  Proposal dispatched to buyer!
        ↓
[3. DISPATCH ASSIGNMENT & TRANSIT]
  Push alert: "🎉 Bid Accepted! Escrow locked. Tap to start travel."
  App transitions to Active Gig Takeover Mode.
  Taps "Start Travel (En Route)" -> Follows GPS turn-by-turn navigation.
        ↓
[4. GEOFENCED ARRIVAL CHECK-IN]
  Pulls into store parking lot.
  Geofence Radar Widget tracks distance: `140m` (enters blue 200m ring).
  Radar illuminates emerald green; haptic buzz.
  Taps "Geofence Check-In (On Site)". Physical presence verified!
        ↓
[5. OFFLINE-FIRST FIELD EXECUTION]
  Enters store server room (cellular drops to zero signal).
  Offline banner surfaces: "Offline Mode Active. Data saved locally."
  Taps task checklist items (100% complete).
  Snaps Before Photo (camera launches instantly, saves to durable storage).
  Replaces terminal; scans hardware serial number.
  Snaps After Photo.
        ↓
[6. CLIENT DIGITAL SIGNATURE]
  Presents device to store manager.
  Manager signs on glass in landscape mode; system calculates SHA-256 digest.
  Taps "Complete Work Order".
        ↓
[7. BACKGROUND RECONNECT & PAYOUT]
  Steps outside to parking lot; 5G reconnects.
  App background sync flushes 3 queued mutations, uploads photos to S3, and verifies check-in.
  Buyer approves work -> Payout ledger updates: "$250.00 Settled & Available for Payout."
```

---

## 2. Interaction System & Design Foundations

FieldForge does not rely on arbitrary cosmetic styling. The interaction system is engineered for **tactical clarity, high information density, and low eye fatigue**.

```
+-------------------------------------------------------------------------------+
|                       INTERACTION DESIGN PRINCIPLES                           |
+-------------------------------------------------------------------------------+
  SURFACE PHILOSOPHY   -> Ultra-dark canvas (#090d16) with slate card planes (#0f172a)
  ACCENT HIERARCHY     -> Electric Blue (#2563eb) for Primary CTAs; Cyan for Telemetry
  NUMERIC PRECISION    -> JetBrains Mono monospace with tabular figures ('tnum' on)
  CONTAINER SEMANTICS  -> Hairline borders (#1e293b) + subtle top gradient highlights
  STATUS DETERMINISM   -> Color-coded badges paired with live animated ping dots
```

### 2.1 Spacing & Ergonomic Scale

- **Density Grid**: Based on a tight 4px / 8px grid (`sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`).
- **Touch Boundaries**: All mobile touch targets maintain a minimum dimension of $48\times 48\text{ CSS px}$. Desktop table rows maintain a comfortable 40px height for dense data scanning.

### 2.2 Action Priority Framework

1. **Primary Action**: Solid Electric Blue (`#2563eb`), white text, subtle blue glow (`0 0 20px -3px rgba(37, 99, 235, 0.45)`). Reserved for the single most important action per screen (e.g. _Publish Work Order_, _Accept Bid_, _Complete Job_).
2. **Secondary Action**: Slate Grey Surface (`#1e293b`), light grey text, hairline border. Used for non-destructive supporting actions (_Save Draft_, _View History_).
3. **Destructive / Dispute Action**: Crimson Red (`#ef4444`), dark red background tint (`#450a0a`), red border. Always requires explicit confirmation modal (_Cancel Work Order_, _Raise Dispute_).
4. **Ghost / Tertiary Action**: Transparent surface, subtle hover elevation. Used for dismiss triggers and breadcrumb links.

### 2.3 Status Indicators & Deterministic Ping Beacons

Every status chip combines text, background color, and a micro-ping animation:

- **`PUBLISHED`**: Sky Blue background (`#082f49`), pulsing dot (`animate-ping`). Indicates active broadcasting on Redis queues.
- **`EN_ROUTE`**: Cyan background (`#083344`), pulsing dot. Indicates active contractor transit.
- **`ON_SITE`**: Royal Blue background (`#172554`), pulsing dot. Indicates active on-site physical presence.
- **`COMPLETED` / `PAID`**: Emerald Green background (`#052e16`), solid dot. Indicates settled transaction.
- **`DISPUTED`**: Crimson Red background (`#450a0a`), flashing dot. Indicates frozen escrow.

---

## 3. Accessibility (A11y) & Usability Standards

FieldForge is built to comply strictly with **WCAG 2.1 Level AA** standards:

```
+-------------------------------------------------------------------------------+
|                       ACCESSIBILITY & INCLUSIVITY STANDARDS                   |
+-------------------------------------------------------------------------------+
  1. CONTRAST RATIO       -> >= 4.5:1 for normal text; >= 3.0:1 for large headers
  2. FOCUS MANAGEMENT     -> High-contrast focus rings (focus-visible:ring-2)
  3. FOCUS TRAPS          -> Slide-over drawers and modals trap Tab key focus
  4. SCREEN READERS       -> Semantic ARIA landmarks, status live-regions, alt tags
  5. MOTION SAFETY        -> Respects 'prefers-reduced-motion'; disables pulsing dots
  6. COLOR INDEPENDENCE   -> Statuses never rely solely on color; text + icons used
```

1. **Color Independence**: Every status badge includes both text and a deterministic icon or symbol, ensuring full comprehensibility for color-blind users.
2. **Focus Management**: When a Slide-Over Drawer opens, keyboard focus is immediately trapped within the drawer container; pressing `Escape` dismisses the drawer and returns focus cleanly to the originating table row.
3. **Screen Reader Live Regions**: Real-time telemetry updates (e.g. _"Technician arrived on site"_, _"New bid received"_) are announced using `aria-live="polite"` regions so assistive technology users stay informed of critical events without disruption.
