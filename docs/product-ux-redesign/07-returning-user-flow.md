# 07 — Returning User Experience & Contextual Mission Control

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Context Restoration, State-Aware Routing & Anti-Dashboard Architecture

---

## 1. The "Anti-Dashboard" Philosophy

A generic, static "Dashboard" loaded with vanity charts (e.g. "Total jobs completed this year: 48", "Welcome back Satya!") is an operational failure for an enterprise dispatch system. When a dispatcher or technician opens FieldForge, they are not looking to passively admire analytics—they are returning to:

1. Check the progress of a live emergency.
2. Resolve an impending SLA breach.
3. Review pending deliverables on a completed job.
4. Continue an active on-site service gig.

**Core Invariant**: The default post-login screen must be an **Actionable Contextual Mission Control**, dynamically prioritized by real-time ticket urgency and unfinished user tasks.

---

## 2. Returning User Flow Taxonomy

```
+-------------------------------------------------------------------------------+
|                       RETURNING USER CONTEXT MATRIX                           |
+-------------------------------------------------------------------------------+
  STATE / SCENARIO             DEFAULT LANDING BEHAVIOR
  ─────────────────────────────────────────────────────────────────────────────
  Active Tickets in Progress   -> Filtered Live Dispatch Board (Urgent SLAs Top)
  Unfinished Draft SOW         -> "Resume Draft" Slide-Out Banner / Modal
  Arriving via Deep Link       -> Direct Ticket Drawer Takeover with Back-to-Board
  Expired Session / Auth 401   -> Transparent Token Refresh Mutex (No Page Wipe)
  Account Action Required      -> Targeted Alert Banner (e.g. Escrow Deposit Needed)
  Returning after Inactivity   -> 30-Day Operational Snapshot + Quick Action Bar
```

---

### 2.1 Scenario 1: Recently Active Buyer (Active Gigs in Flight)

- **Mental State**: High urgency; wants instant status on currently dispatched contractors.
- **Default Destination**: **Live Operations Command Board**.
- **UX Behavior**:
  - Automatically filters to `EN_ROUTE` and `ON_SITE` tickets at the top.
  - Urgency chips pulse amber or red if a ticket is within 45 minutes of its scheduled SLA window.
  - Selecting any ticket immediately opens the **Work Order Command Drawer** showing the technician's live GPS radar distance and real-time status.

---

### 2.2 Scenario 2: Buyer with Unfinished Work (Abandoned SOW Draft)

- **Context**: Buyer began authoring a complex fiber optic rollout ticket yesterday, added site coordinates, but had to leave a meeting before publishing.
- **UX Behavior**:
  - The SOW draft is persisted in local client storage and linked to the buyer's profile.
  - Upon landing on the Operations Board, a discrete top banner surfaces:
    _“📝 You have an unpublished SOW draft for 'Fiber Switch Replacement - Site #402'. [Resume Authoring ->] or [Discard].”_
  - Clicking **"Resume Authoring"** restores all form fields, selected badge requirements, and calculated budgets with zero data loss.

---

### 2.3 Scenario 3: Arriving via Notification / Deep Link

- **Context**: Buyer receives an SMS or push notification: _"Technician Marcus V. submitted completion deliverables for WO-104. Review photos and approve escrow."_
- **URL Structure**: `https://app.fieldforge.com/operations?ticketId=wo-104&view=deliverables`
- **UX Behavior**:
  - User authenticates (or session restores).
  - The base view loads the **Live Operations Board** in the background (preventing the jarring sensation of an isolated blank page).
  - The **Work Order Command Drawer** immediately slides out over the board, pre-navigated to the **Deliverables Inspection Gallery**.
  - The buyer can zoom the photos, inspect the client signature, and click **"Approve & Release Escrow"** in under 15 seconds.
  - Closing the drawer leaves the user smoothly anchored on their operational board.

---

### 2.4 Scenario 4: Expired Session Recovery (401 Intercept)

- **Context**: A buyer is typing a detailed scope of work description, or a technician is filling out a checklist on site. The 15-minute JWT access token expires in the background.
- **Legacy Failure**: App redirects to `/login`. The user loses all typed text and form state.
- **FieldForge UX Recovery**:
  1. The RTK Query / fetch layer intercepts the `401 Unauthorized` via `baseQueryWithReauth`.
  2. The client acquires a mutex lock and issues `POST /auth/refresh` with the HTTP-only refresh token.
  3. If refresh succeeds: New access token is saved in Redux, the failed API mutation retries transparently, and the user experiences zero interruption.
  4. If refresh fails (e.g. user logged out on another device or refresh token expired):
     - Form data is serialized into local backup storage.
     - An inline **Auth Recovery Modal** overlays the screen: _“Your session has expired. Enter your password to continue without losing your changes.”_
     - Re-authenticating closes the modal and immediately proceeds with the pending submit action.

---

### 2.5 Scenario 5: Returning Technician with an Assigned Active Gig

- **Context**: Technician was assigned to a ticket an hour ago, closed the app to drive, and arrives at the customer parking lot. Re-opens the app.
- **UX Behavior**:
  - The app **does NOT show the generic gig discovery feed**.
  - The app **immediately loads the Active Gig Screen (`Takeover Mode`)**.
  - The screen displays the GPS Check-In Radar Widget with real-time distance countdown (`Distance to site: 140m`).
  - The green **"Geofence Check-In (On Site)"** button is pulsing and enabled.
  - In 1 tap, the technician confirms physical arrival.

---

### 2.6 Scenario 6: User with Incomplete Onboarding

- **Context**: User registered but skipped phone OTP verification or did not attach a payment method.
- **UX Behavior**:
  - The user is allowed to view the board, search tickets, and draft SOWs.
  - An interactive, non-blocking **Action Required Pill** appears in the top navigation:
    _“⚠️ Phone verification required before publishing tickets. [Verify Now (30s)]”_
  - Clicking opens an inline OTP verification drawer without navigating away from the current workspace.

---

### 2.7 Scenario 7: Account Requiring Immediate Attention

- **Context**: A buyer's credit card pre-authorization failed, or a technician's Cisco CCNA certification has expired.
- **UX Behavior**:
  - Instead of blocking the entire application, a high-contrast **Action Banner** pins below the header:
    - For Buyer: _“💳 Payment Pre-Authorization Failed on WO-102. Escrow could not be funded. Update corporate payment method to broadcast ticket.”_
    - For Tech: _“🛡️ Cisco CCNA Expired. Your profile badge is paused. High-tier networking tickets are locked. [Upload Renewal Document].”_

---

## 3. UX Decision Documentation

### Decision: Deep-Link Slide-Over Drawer with Preserved Background Board

- **User Problem**: When users click a notification link to view a ticket, standard web apps load a dedicated full-page view (`/work-orders/123`). When the user finishes, clicking "Back" frequently exits the application or dumps them onto an unconfigured homepage, causing disorientation.
- **Reasoning**: Loading the Operations Board underneath the requested ticket's Slide-Over Drawer anchors the user in the broader product context. When they finish approving the ticket, closing the drawer leaves them right where they need to be to review other pending operational tasks.
- **Backend Compatibility**: Completely compatible. The client queries `GET /work-orders` for the board list and `GET /work-orders/:id` for the drawer payload concurrently.
- **Web Behavior**: Slide-over drawer over operations board with URL query param `?ticketId=wo-101`.
- **Mobile Behavior**: Stack navigation push onto `ActiveJobScreen` with explicit `← Work Orders` return button.
- **Alternative Considered**: Isolated full-page ticket detail view (`/work-orders/:id`).
- **Why Rejected**: Forces unnecessary page loads, destroys filter/sort memory, and makes multi-ticket auditing painful.
