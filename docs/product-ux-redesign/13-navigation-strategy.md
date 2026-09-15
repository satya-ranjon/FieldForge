# 13 — Navigation Strategy & Responsive Architecture

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Dual-Platform Navigation Systems, Breakpoint Adaptations & Keyboard Ergonomics

---

## 1. Desktop Navigation Architecture (Enterprise Web Portal)

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

### 1.1 Structural Navigation Components

1. **Global Header Command Bar**:
   - **Operational Heartbeat**: Real-time WebSocket/AMQP latency indicator (`ONLINE (12ms)`) providing instant confidence in telemetry freshness.
   - **Escrow Liquidity Vault Chip**: Monospace summary of available and locked corporate escrow funds.
   - **Command Palette Trigger (`Cmd+K`)**: Global search querying tickets, technicians, and site locations.
   - **Global Primary CTA**: Prominent `[+ New Work Order]` button accessible across all views.
2. **Collapsible Left Workspace Sidebar**:
   - Icons with tooltips when collapsed (64px width); full labels when expanded (240px width).
   - Core tabs: **Operations** (root default), **Tech Radar**, **Escrow Vault**, **Templates**, **Settings**.
3. **Right Slide-Over Command Drawer**:
   - Width: 600px–720px.
   - Preserves background list state, scroll coordinates, and multi-criteria filters.
   - Dismissible with `Escape` or clicking the translucent backdrop.

### 1.2 Desktop Keyboard Acceleration Map

- `Cmd + K`: Open Global Omnibox Search.
- `N`: Open SOW Studio Drawer (New Work Order).
- `J` / `K`: Move selection down/up in the operations table.
- `Enter`: Open selected ticket drawer.
- `Esc`: Close drawer, modal, or lightbox.
- `Ctrl + Enter`: Trigger primary drawer action (e.g. "Approve Escrow", "Accept Bid").

---

## 2. Mobile Navigation Architecture (Technician Native App)

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
+-------------------------------------------------------------+
|  [BOTTOM TABS]                                              |
|  [ 📍 Nearby ]   [ ⚡ My Gigs ]   [ 💵 Earnings ]   [ 👤 Profile ] |
+-------------------------------------------------------------+
```

### 2.1 Structural Navigation Components

1. **Top Telemetry & Network Bar**:
   - GPS sync accuracy beacon and network mode pill (`🟢 Online` vs. `✈️ Airplane Mode`).
   - Persistent offline queue drawer indicating queued mutations.
2. **Thumb-Zone Bottom Navigation Bar**:
   - 4 primary tabs: **Nearby** (default feed), **My Gigs** (active & scheduled), **Earnings** (ledger), **Profile** (badges).
   - Fixed height (64px) with safe area inset padding; 48x48px touch targets.
3. **Active Gig Takeover Mode**:
   - When a job is in `ASSIGNED`, `EN_ROUTE`, or `ON_SITE`, the bottom tab bar is replaced by a persistent **Active Job Takeover Footer** displaying the current job status, distance countdown, and the next required action.
   - This eliminates navigation errors during active transit and field repair.

---

## 3. Responsive Breakpoint Strategy

Rather than merely shifting CSS breakpoints, FieldForge fundamentally adapts information hierarchy and container patterns across device screen widths:

```
+-------------------------------------------------------------------------------+
|                       RESPONSIVE ADAPTATION FRAMEWORK                         |
+-------------------------------------------------------------------------------+
  BREAKPOINT       WIDTH RANGE       LAYOUT PATTERN        CONTAINER STRATEGY
  ─────────────────────────────────────────────────────────────────────────────
  Small Mobile     < 375px           Single Column Card    Full-Screen Modals
  Large Mobile     375px - 767px     Tactical Thumb Feed   Bottom Sheets (Expandable)
  Tablet           768px - 1023px    2-Column Split View   Side-by-Side Panels
  Laptop           1024px - 1439px   Sidebar + Board       Slide-Over Drawers (600px)
  Desktop          1440px - 1919px   High-Density Kanban   Slide-Over Drawers (720px)
  Ultra-Wide       1920px+           Split Master-Detail   Persistent Right Inspector
```

### 3.1 Small Mobile (< 375px — iPhone SE, compact Android)

- Layout: Strictly single-column vertical stack.
- Font Scaling: Body text 14px, headers snug tracking; non-essential metadata chips hidden.
- Container: Bottom sheets expand to 100% full-screen takeovers to prevent clipped action buttons.

### 3.2 Large Mobile (375px – 767px — Standard smartphones)

- Layout: Vertical thumb-stream with 16px lateral padding.
- Container: Half-height bottom sheets with drag handles (`pan-y` gestures).

### 3.3 Tablet (768px – 1023px — iPads, service vehicle tablets)

- Layout: 2-column master-detail layout. Left column (350px) displays ticket list; right pane displays active radar or ticket details.
- Touch Targets: Maintained at $\ge 44\times 44\text{ px}$ for touch-screen vehicle mounts.

### 3.4 Laptop (1024px – 1439px — Standard enterprise laptops)

- Layout: Left collapsible icon sidebar (64px) + full Operations Command Board.
- Drawers: Slide-over drawer opens at 600px width with backdrop blur.

### 3.5 Desktop & Ultra-Wide (1440px to 1920px+)

- Layout: Full expanded sidebar (240px) + multi-column Kanban board or 12-column dense telemetry table.
- Ultra-wide Optimization: On 1920px+ monitors, the Work Order Command Drawer becomes a **Persistent Split-Screen Panel** (docked right, 720px wide). Clicking any ticket updates the inspector instantly without sliding animations, enabling ultra-fast ticket auditing.
