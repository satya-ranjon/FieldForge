# 09 — Complete Mobile User Flows & Mobile Architecture

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Native Ergonomics, Offline-First Field Workflows & Geofenced Execution

---

## 1. Mobile Ergonomics & Tactical Field Architecture

Field technicians use FieldForge under harsh physical conditions: bright sunlight, wearing gloves, in vehicle docks, or in subterranean datacenters with zero network connectivity. The mobile UX adheres to strict tactical standards:

1. **Thumb-Reach Driven**: All primary triggers, check-in buttons, and camera shutters live in the bottom 35% of the screen (the Natural Thumb Zone).
2. **Offline-First Zero-Data-Loss**: Any mutation (status change, serial number, checklist tick, photo capture, signature) is written immediately to a persistent SQLite/MMKV queue before any network request is attempted.
3. **High Contrast Outdoor Palette**: Ultra-dark canvas (`#090d16`) with high-contrast emerald green for guaranteed earnings, cyan for GPS telemetry, and large touch targets (minimum 48x48 CSS px).
4. **Haptic & Audio Confirmation**: Distinct tactile haptic feedback on successful geofence check-in, photo upload confirmation, and signature lock.

---

## 2. Complete Mobile User Flow Maps

---

### Flow 1: Nearby Gig Discovery, Radial Filtering & Proposal Submission (P0)

```
[ENTRY]
  Technician opens FieldForge Mobile App in service truck.
        ↓
[SCREEN: Nearby Gigs Feed (Tab 1)]
  App pulls current GPS coordinates (e.g. 32.7801° N, -96.8002° W).
  Streams location to Redis spatial index via `POST /dispatch/technicians/location`.
  Queries nearby open orders (`status: PUBLISHED`).
        ↓
[STATE: Populated Gig Cards]
  Card 1: Emergency POS Swap | 1.4 miles away | $250.00 Guaranteed Escrow | Urgent (< 2h)
  Card 2: Meraki AP Rollout  | 3.8 miles away | $320.00 Guaranteed Escrow | Scheduled 09:00 AM
        ↓
[USER ACTION: Radial Filter]
  Technician drags radius chip slider from 10mi to 5mi.
  Feed re-filters instantly using local client distance cache.
  Taps on "Emergency POS Swap" card.
        ↓
[SCREEN: Gig SOW Preview Sheet (Half-Height Bottom Sheet)]
  Displays: Store Name, General Cross Streets, Scope Description, Tools Required.
  Shows Escrow Lock Badge: "🛡️ $250.00 Pre-Authorized in Escrow".
  Displays Required Badges: "✓ OSHA 10 (You Qualify)".
        ↓
[USER ACTION]
  Taps "Submit Proposal / Bid".
        ↓
[SCREEN: Bid Adjustment Sheet]
  Proposed Payout: Stepper defaults to SOW budget (`$250.00`). Tech can tap `+$20` or `-$10`.
  Estimated Arrival Time: Slider set to "30 minutes".
  Counter Note (Optional): "In area with spare Verifone cables."
  Taps "Confirm Proposal".
        ↓
[DECISION 1: Network Connectivity Check]
  ├── Path A: Online (Standard)
  │     ↓
  │   [API CALL: POST /work-orders/:id/bids]
  │     Headers include Bearer JWT and `idempotency-key`.
  │     Backend persists bid in `work_order_bids`.
  │     Emits `tech.bidding.submitted` to buyer.
  │     ↓
  │   [SUCCESS]
  │     Haptic success tap. Card updates to "Proposal Submitted (Pending Buyer Review)".
  │     Next Best Action: "Keep app open or browse other gigs."
  │
  └── Path B: Offline (Subterranean Garage)
        ↓
      [SYSTEM RESPONSE]
        Mutation enqueued in durable offline storage (`syncServiceInstance.enqueue('SUBMIT_BID')`).
        Toast: "Proposal saved offline. Will auto-dispatch when network reconnects."
```

---

### Flow 2: Transit Acknowledgment & Geofenced Check-In (P0)

```
[ENTRY]
  Buyer accepts bid. Push notification alerts technician:
  "🎉 Bid Accepted on WO-109! Tap to start travel."
        ↓
[USER ACTION]
  Technician taps notification -> App opens directly to Active Gig Screen (`Takeover Mode`).
  Bottom navigation is locked to prevent accidental exit.
        ↓
[SCREEN: Step 1 - Start Transit]
  Displays: Exact Destination Address ("1420 Main St, Dallas, TX").
  Action Button: "[Navigate via Google Maps / Apple Maps]" (External deep link).
  Primary CTA: `[Start Travel (En Route)]`.
        ↓
[USER ACTION]
  Taps "Start Travel (En Route)".
        ↓
[SYSTEM RESPONSE]
  Updates local job state to `EN_ROUTE`.
  Dispatches `POST /work-orders/:id/transition` (`nextStatus: EN_ROUTE`).
  Work order lifecycle publishes `work_order.lifecycle.en_route`.
  Screen transitions to **Geofence Radar View**.
        ↓
[SCREEN: Step 2 - Geofenced Check-In Radar]
  Visual Circular Radar Widget:
  - Center pin: Work Site (1420 Main St).
  - Blue ring: 200-meter Geofence Perimeter.
  - Moving ping dot: Technician live GPS coordinates.
  - Telemetry Counter: "Distance: 840m (Out of Range)".
  - Button State: `[Move Within 200m of Site]` (Disabled, Slate Grey).
        ↓
[PHYSICAL ACTION: Technician Drives to Site]
  Technician parks at the store. Live GPS updates.
  Telemetry Counter drops: `140m` -> Enters blue ring!
        ↓
[SYSTEM RESPONSE: Geofence Verification Handshake]
  Radar turns Electric Blue and Emerald Green.
  Haptic double-buzz.
  Button unlocks: `[Geofence Check-In (On Site)]` (Pulsing Emerald Green).
        ↓
[USER ACTION]
  Taps "Geofence Check-In (On Site)".
        ↓
[DECISION 2: Verification Path]
  ├── Path A: Online
  │     ↓
  │   [API CALL: POST /work-orders/:id/transition]
  │     Payload: `{ nextStatus: 'ON_SITE', latitude: 32.7766, longitude: -96.7972 }`
  │     Server executes Haversine formula (docs/SRS.md FR-MOB-001).
  │     Calculates distance = 68m (< 200m). Transition allowed!
  │     ↓
  │   [SUCCESS]
  │     Active Gig transitions to "ON_SITE".
  │     Screen reveals Step 3: Deliverables & Proof of Work.
  │
  └── Path B: Client within 200m, but Cellular Dropped (Server Basement)
        ↓
      [OFFLINE GEOFENCE CHECK-IN (FR-MOB-004)]
        Client-side canonical Haversine verifies distance = 68m (< 200m).
        Mutation saved to durable SQLite queue with cryptographically signed timestamp and GPS payload.
        Local state updates to "ON_SITE (Offline Verified)".
        Deliverables view unlocks immediately. Zero blocking!
```

---

### Flow 3: On-Site Execution, Deliverables Capture & Cryptographic Sign-Off (P0)

```
[ENTRY]
  Technician is ON_SITE inside the retail store.
        ↓
[SCREEN: Step 3 - Deliverables Execution Stepper]
  Section A: Verification Checklist
  Section B: Hardware Serial Number
  Section C: Proof-of-Work Photos (Before & After)
  Section D: Client On-Screen Signature
        ↓
[USER ACTION 1: Task Checklist]
  Taps checkboxes:
  [x] Inspect existing cabling
  [x] Unbox and mount replacement terminal
  [x] Verify network link & gateway ping
        ↓
[USER ACTION 2: Hardware Serial Number]
  Types serial or taps camera barcode scanner: `SN-VRF-89210-X`.
  Taps "Save Serial". Confirmed with green checkmark.
        ↓
[USER ACTION 3: Photo Deliverables (AWS S3 Presigned Handshake)]
  Taps `[📷 Take Before Photo]`.
  Native Camera opens -> Snaps damaged terminal.
  Client verifies size (2.1MB < 15MB limit) and mime-type (`image/jpeg`).
        ↓
  [DECISION 3: Photo Upload Protocol]
  ├── Path A: Online
  │     1. POST /work-orders/:id/deliverables/presigned-url -> S3 PUT URL received.
  │     2. Binary PUT directly to AWS S3 bucket `fieldforge-deliverables-storage`.
  │     3. POST /work-orders/:id/deliverables (Confirm with S3 object key).
  │     4. Button updates to "✓ Before Photo (Uploaded)".
  │
  └── Path B: Offline (Basement)
        1. Image file written to durable app storage directory (`fs.documentDirectory`).
        2. Upload mutation queued in offline sync manager.
        3. Button updates to "⏳ Before Photo (Queued Locally)".
        Technician can immediately proceed with work!
        ↓
  Technician completes hardware repair.
  Taps `[📷 Take After Photo]` -> Snaps working terminal -> S3 uploaded or queued.
        ↓
[USER ACTION 4: Client On-Screen Signature (FR-MOB-003)]
  Technician approaches store manager: "Work is done. May I get your sign-off?"
  Taps `[✍️ Capture Client Signature]`.
  Screen rotates to Landscape Signature Pad.
  Inputs Signer Name: "Robert Henderson, Store Manager".
  Manager signs on glass with finger.
  App renders real-time vector path and computes SHA-256 digest of SVG coordinates.
  Taps "Confirm Signature".
  Signature artifact saved to S3 (or offline queue).
        ↓
[USER ACTION 5: Final Submission]
  All 4 sections show green checkmarks (100% completion rule).
  Bottom button illuminates: `[Complete Work Order]`.
  Technician taps "Complete Work Order".
        ↓
[API CALL: POST /work-orders/:id/transition]
  Transitions status `ON_SITE -> COMPLETED`.
  RabbitMQ emits `work_order.lifecycle.completed`.
  Escrow approval countdown initiates (buyer review or 72h auto-release).
        ↓
[SUCCESS SCREEN]
  "🎉 Work Order Completed!"
  "Guaranteed Escrow of $280.00 is locked in review. Payout will credit your ledger upon buyer sign-off or within 72 hours."
  Next Best Action: "Return to Nearby Gigs Feed."
```

---

### Flow 4: Background Reconnection & Offline Queue Flush (P1)

```
[ENTRY]
  Technician finished job in offline basement, steps outside to parking lot.
  Device regains 5G cellular connection.
        ↓
[SYSTEM AUTO-DETECTION: NetInfo Listener]
  SyncManager detects network status transition: `isOnline: true`.
  Inspects persistent queue: `3 pending mutations found`:
    1. Check-in mutation (ON_SITE with GPS coordinates).
    2. Before Photo (2.1 MB local JPEG).
    3. Client Signature (SVG + SHA-256 hash).
        ↓
[EXECUTION: Bounded FIFO Queue Replay]
  Top banner indicates: "⏳ Synchronizing 3 offline mutations..."
  Mutation 1: Replays `/transition` -> Server confirms geofence.
  Mutation 2: Requests S3 presigned URL -> Streams JPEG -> Confirms HeadObject.
  Mutation 3: Uploads SVG signature -> Backend verifies digest.
        ↓
[SUCCESS]
  Banner turns Solid Emerald Green: "✓ All local mutations synchronized successfully."
  Fades out after 4 seconds.
```

---

## 3. Mobile UI Component Patterns & Thumb-Zone Ergonomics

```
+-------------------------------------------------------------+
|  [TOP 15% - TELEMETRY & STATUS]                             |
|  Status beacons, offline indicators, back navigation        |
|  ---------------------------------------------------------  |
|  [MIDDLE 50% - TASK & EVIDENCE WORKSPACE]                   |
|  Scrollable SOW details, photo previews, checklist cards    |
|  ---------------------------------------------------------  |
|  [BOTTOM 35% - NATURAL THUMB ZONE]                          |
|  Primary action buttons, check-in radar, camera triggers    |
|  +-------------------------------------------------------+  |
|  |       [ 🟢 GEOFENCE CHECK-IN (ON SITE) ]              |  |
|  +-------------------------------------------------------+  |
|  | [Nearby]     [My Gigs (1)]    [Earnings]    [Profile] |  |
+-------------------------------------------------------------+
```

- **Bottom Navigation**: Persistent across browsing, suppressed only during active job execution takeover.
- **Half-Height Bottom Sheets**: Used for quick SOW previews and bid adjustment without unmounting the map.
- **Full-Screen Modals**: Reserved exclusively for landscape digital signature capture and high-resolution camera viewfinders.
