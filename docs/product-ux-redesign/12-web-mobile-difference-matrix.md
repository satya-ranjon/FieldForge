# 12 — Web vs. Mobile Interaction Difference Matrix

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Form-Factor Divergence, Hardware Capabilities & Contextual Ergonomics

---

## 1. Ergonomic Divergence Philosophy

FieldForge rejects the lazy paradigm of "shrinking the desktop UI to mobile" or "expanding the mobile UI to desktop." Desktop and Mobile serve fundamentally different user roles, hardware constraints, and physical environments:

- **Web Portal (Desktop / Tablet)**: Designed for **Enterprise Dispatchers & Managers** working at a desk with keyboards, high-resolution multi-monitors (1080p to 4K), and mice/trackpads. Prioritizes information density, multi-ticket scanning, side-by-side comparison, and keyboard acceleration.
- **Mobile App (iOS / Android)**: Designed for **Field Technicians** operating in transit, in vehicle docks, or in commercial job sites. Prioritizes thumb-reach ergonomics, native sensor integration (GPS, camera, haptics), high-contrast outdoor visibility, and rock-solid offline durability.

---

## 2. Comprehensive Capability Difference Matrix

| System Capability            | Web UX (Desktop / Tablet)                                                                               | Mobile UX (Native iOS / Android)                                                                                    | Technical / Contextual Reason                                                                                  |
| :--------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| **Primary Navigation**       | Fixed collapsible sidebar + Global header with Command Bar (`Cmd+K`) and Escrow Balance Chip.           | 4-item bottom navigation bar anchored strictly within the thumb zone. Subordinated during active gigs.              | Desktop users have ample horizontal real estate; mobile users require single-handed thumb accessibility.       |
| **Work Order Discovery**     | Multi-column Kanban or dense telemetry table with 10+ sortable data columns.                            | High-contrast vertical card feed with large green payout chips and swipe-to-save gestures.                          | Dispatchers need to audit 50+ tickets concurrently; technicians need to scan 3–5 nearby jobs at a stoplight.   |
| **Geospatial Radar**         | Full-canvas interactive circular radar scope with range sliders (5–50mi) and blip inspectors.           | Compact circular radar widget integrated directly into the active gig check-in screen.                              | Desktop is used for regional capacity planning; mobile is used for tactical on-site distance verification.     |
| **Geofenced Check-In**       | Read-only visual indicator showing technician distance and check-in timestamp.                          | Native GPS location streaming with live Haversine distance countdown and interactive check-in button.               | Geofenced check-in is physically executed by the mobile device at the site ($\le 200\text{ m}$ rule).          |
| **Deliverable Capture**      | Drag-and-drop file upload zone (for manual buyer document attachment).                                  | Native camera capture with auto-focus, flashlight toggle, and automatic resolution downsampling ($< 15\text{MB}$).  | Technicians capture evidence physically on site using handheld smartphone optics.                              |
| **Deliverable Inspection**   | Side-by-side before/after comparison lightbox with zoom and serial number 1-click clipboard copy.       | Vertical photo preview thumbnails with retry triggers for failed uploads.                                           | Enterprise buyers require high-resolution verification before releasing thousands of dollars in escrow.        |
| **Signature Capture**        | Displays verified SVG vector image with cryptographic SHA-256 digest hash and timestamp.                | Full-screen landscape modal signature pad with finger/stylus drawing, clear button, and live vector path rendering. | The customer or store manager physically signs the technician's mobile glass on site.                          |
| **Offline Resilience**       | Non-blocking reconnect toast if WebSocket/AMQP disconnects; auto-reconnects in background.              | Persistent SQLite/MMKV mutation queue, durable image storage in app sandbox, and background NetInfo sync engine.    | Web browsers operate in stable office Wi-Fi; mobile technicians operate in shielded basements and datacenters. |
| **Financial Ledgers**        | Double-entry tabular ledger with date filtering, export to CSV, and streaming PDF/A invoice generation. | Mobile summary cards showing Available Balance, Pending Escrow, and recent credit/debit payout line items.          | Corporate buyers conduct multi-line accounting audits; technicians check if their earnings cleared.            |
| **Work Order Authoring**     | 4-step guided SOW Studio with preset blueprint blueprints, geocoding map, and escrow calculator.        | Simplified emergency draft creation (or restricted to web only for enterprise accounts).                            | Authoring complex multi-site SOWs is an office dispatch task requiring extensive scope documentation.          |
| **Shortcuts & Acceleration** | Full keyboard shortcut suite (`Cmd+K`, `N` for new ticket, `J`/`K` navigation, `Esc` dismiss).          | Haptic vibrations on check-in unlock, swipe actions, and pull-to-refresh.                                           | Desktop leverages tactile keyboards for speed; mobile leverages tactile haptic motors for confidence.          |
