---
name: FieldForge Design System
version: 2.0.0
description: 'An enterprise-grade, high-concurrency marketplace design specification for autonomous field service dispatch and escrow settlement. Built on an ultra-dark command-center canvas (#090d16), slate card surfaces (#0f172a) with subtle hairline borders, vibrant electric blue (#2563eb) and cyan radar accents (#06b6d4), and crisp monospace tabular figures (JetBrains Mono) for high-density telemetry, SLA timers, and financial ledgers.'

colors:
  primary: '#2563eb'
  on-primary: '#ffffff'
  primary-hover: '#1d4ed8'
  primary-focus: '#3b82f6'
  primary-glow: 'rgba(37, 99, 235, 0.35)'
  secondary: '#0f172a'
  accent: '#06b6d4'
  accent-hover: '#0891b2'
  accent-glow: 'rgba(6, 182, 212, 0.35)'
  canvas: '#090d16'
  canvas-subtle: '#0b1120'
  surface-card: '#0f172a'
  surface-card-hover: '#1e293b'
  surface-elevated: '#1e293b'
  surface-glass: 'rgba(15, 23, 42, 0.80)'
  hairline: '#1e293b'
  hairline-subtle: '#334155'
  hairline-strong: '#475569'
  hairline-highlight: 'rgba(255, 255, 255, 0.08)'
  ink: '#f8fafc'
  ink-secondary: '#94a3b8'
  ink-muted: '#64748b'
  ink-tertiary: '#475569'
  semantic-success: '#10b981'
  semantic-success-bg: '#052e16'
  semantic-success-border: '#166534'
  semantic-warning: '#f59e0b'
  semantic-warning-bg: '#451a03'
  semantic-warning-border: '#92400e'
  semantic-danger: '#ef4444'
  semantic-danger-bg: '#450a0a'
  semantic-danger-border: '#991b1b'
  semantic-info: '#0ea5e9'
  semantic-info-bg: '#082f49'
  semantic-info-border: '#075985'

typography:
  fontFamily:
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    mono: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace'
  display-xl:
    fontSize: '3rem' # 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: '-0.03em'
  display-lg:
    fontSize: '2.25rem' # 36px
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: '-0.025em'
  headline:
    fontSize: '1.5rem' # 24px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: '-0.02em'
  card-title:
    fontSize: '1rem' # 16px
    fontWeight: '600'
    lineHeight: '1.35'
    letterSpacing: '-0.015em'
  body:
    fontSize: '0.875rem' # 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '-0.005em'
  body-sm:
    fontSize: '0.75rem' # 12px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: '0em'
  caption:
    fontSize: '0.6875rem' # 11px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: '0.01em'
  mono-metric:
    fontFamily: 'JetBrains Mono, monospace'
    fontSize: '1.75rem' # 28px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: '-0.02em'
    fontFeature: "'tnum' on, 'zero' on"
  mono-badge:
    fontFamily: 'JetBrains Mono, monospace'
    fontSize: '0.6875rem' # 11px
    fontWeight: '600'
    letterSpacing: '0.02em'

rounded:
  sm: '0.25rem' # 4px
  md: '0.375rem' # 6px
  lg: '0.5rem' # 8px
  xl: '0.75rem' # 12px
  2xl: '1rem' # 16px
  full: '9999px'

spacing:
  xs: '0.25rem' # 4px
  sm: '0.5rem' # 8px
  md: '1rem' # 16px
  lg: '1.5rem' # 24px
  xl: '2rem' # 32px
  2xl: '3rem' # 48px

shadows:
  card: '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2)'
  elevated: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)'
  glow-blue: '0 0 20px -3px rgba(37, 99, 235, 0.45)'
  glow-cyan: '0 0 20px -3px rgba(6, 182, 212, 0.45)'
  glow-emerald: '0 0 20px -3px rgba(16, 185, 129, 0.45)'
  glow-amber: '0 0 20px -3px rgba(245, 158, 11, 0.45)'

components:
  card:
    background: '{colors.surface-card}'
    border: '{colors.hairline}'
    rounded: '{rounded.xl}'
    topHighlight: '{colors.hairline-highlight}'
  button-primary:
    background: '{colors.primary}'
    color: '{colors.on-primary}'
    hover: '{colors.primary-hover}'
    shadow: '{shadows.glow-blue}'
    rounded: '{rounded.lg}'
  status-pill:
    rounded: '{rounded.full}'
    fontFamily: '{typography.fontFamily.mono}'
    padding: '2px 8px'
---

# FieldForge Design Specification (v2.0.0)

FieldForge is an enterprise-grade, high-concurrency marketplace connecting enterprise buyers with certified field technicians. The visual language blends high-density operational telemetry with clarity, speed, tactical awareness, and cryptographic escrow transparency.

The system synthesizes design paradigms inspired by **Linear** (high-density command center, hairline card borders, top-edge gradient highlights), **Uber** (geospatial radar scope, geofence radius tracking, dynamic ETA chips), and **Stripe** (transparent escrow vault calculations, itemized statement modals, tabular financial numerics).

---

## 1. Design Philosophy

- **High-Density Telemetry**: Dispatchers and enterprise buyers require instant visibility over concurrent work orders, live GPS coordinates, technician bid matrices, SLA countdowns, and locked escrow milestones without visual noise.
- **Dark-First Command Center**: The Web Buyer Portal operates on an ultra-dark canvas (`#090d16`) with high-contrast surfaces (`#0f172a`), minimizing eye fatigue in 24/7 mission-critical operations centers.
- **Glanceable Status Architecture**: Every work order, bid, and technician has a deterministic color-coded status badge and micro-pulse beacon indicating active GPS sync, geofence check-ins, or escrow state transitions.
- **Tabular Precision**: Financial minor units (cents), SLA countdowns, correlation trace IDs, and geo-coordinates are strictly formatted with `JetBrains Mono` and tabular numbers (`tnum`) for alignment and rapid scanning.

---

## 2. Color System & Usage Rules

### Core Surfaces & Borders

| Token                | Value                    | Purpose                                                |
| :------------------- | :----------------------- | :----------------------------------------------------- |
| `canvas`             | `#090d16`                | Root command-center background                         |
| `surface-card`       | `#0f172a`                | Primary card and panel surface (90% opacity with blur) |
| `surface-hover`      | `#1e293b`                | Interactive hover elevation state                      |
| `hairline`           | `#1e293b`                | Clean structural boundary borders                      |
| `hairline-highlight` | `rgba(255,255,255,0.08)` | Subtle top-edge gradient shimmer on cards and modals   |

### Brand & Accents

| Token           | Value                  | Meaning                                                     |
| :-------------- | :--------------------- | :---------------------------------------------------------- |
| `primary`       | `#2563eb`              | Primary CTAs, active tab selections, primary metrics        |
| `primary-hover` | `#1d4ed8`              | Tactile interactive state                                   |
| `accent`        | `#06b6d4`              | Radar sweeps, geofence rings, GPS beacons, live telemetries |
| `accent-glow`   | `rgba(6,182,212,0.35)` | Radar scan line and perimeter glow                          |

### Deterministic Semantic Statuses

Statuses reflect server-owned FSM vocabularies (`WorkOrderStatus`, `EscrowStatus`, `BidStatus`, and SLA priorities):

| Status                   | Background   | Text      | Border       | Live Pulse | Meaning                                     |
| :----------------------- | :----------- | :-------- | :----------- | :--------: | :------------------------------------------ |
| **DRAFT / PENDING**      | `#1e293b`/80 | `#cbd5e1` | `#334155`    |     No     | Draft order or awaiting technician proposal |
| **PUBLISHED**            | `#082f49`/70 | `#38bdf8` | `#0284c7`/80 |  **Yes**   | Broadcasted on Redis GeoStream queue        |
| **ASSIGNED / HELD**      | `#451a03`/70 | `#fcd34d` | `#b45309`/80 |     No     | Technician assigned / escrow funds held     |
| **EN_ROUTE**             | `#083344`/70 | `#67e8f9` | `#0891b2`/80 |  **Yes**   | Technician en route to site location        |
| **ON_SITE**              | `#172554`/70 | `#93c5fd` | `#2563eb`/80 |  **Yes**   | Technician checked in within geofence       |
| **COMPLETED / APPROVED** | `#052e16`/70 | `#4ade80` | `#16a34a`/80 |     No     | Proof of work submitted / escrow released   |
| **DISPUTED / CANCELLED** | `#450a0a`/80 | `#f87171` | `#dc2626`/80 |     No     | Milestone dispute flagged or order halted   |
| **CRITICAL_SLA**         | `#450a0a`/90 | `#fca5a5` | `#dc2626`/90 |  **Yes**   | Priority response required (< 4 hours)      |

---

## 3. Typography & Hierarchy

- **UI Sans (`Inter`)**: Set for body copy, buttons, labels, and headings with snug negative tracking (`-0.02em` on headings).
- **Telemetry Mono (`JetBrains Mono`)**: Mandatory for ticket IDs (`wo-101`), correlation IDs (`c-982103-f92a`), geographic coordinates, SLA timers, and currency amounts.
- **Tabular Figures (`font-feature-settings: 'tnum' on, 'zero' on`)**: Applied globally to all monospace elements to ensure numbers don't jump during real-time telemetry updates.

---

## 4. Component Patterns (`@fieldforge/ui`)

### Cards (`Card`)

- Container: `bg-[#0f172a]/90 border border-slate-800/80 rounded-xl backdrop-blur-sm shadow-sm`.
- Linear Top Highlight: `before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent`.
- Variants: `default`, `elevated` (deeper shadow), `glass` (translucent backdrop), `highlight` (blue accent border).

### Buttons (`Button`)

- Tactile Micro-Interaction: `active:scale-[0.98] transition-all duration-150`.
- Focus Ring: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d16]`.
- Variants: `primary`, `secondary`, `danger`, `outline`, `ghost`, `success`.

### Status Badges (`StatusBadge`)

- Strict pill geometry: `rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold border`.
- Deterministic ping dot: Pulsing animated dot (`animate-ping`) for real-time states (`PUBLISHED`, `EN_ROUTE`, `ON_SITE`, `CRITICAL_SLA`).

### Inputs & Forms (`Input`, `Textarea`, `Select`)

- Surface: `bg-[#090d16]/80 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 shadow-inner`.
- Focus State: `focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all`.

### Dialogs & Sheets (`Modal`)

- Backdrop: `bg-black/80 backdrop-blur-md flex items-center justify-center`.
- Container: Hairline top border shimmer with animated scale-in (`zoom-in-95 fade-in duration-150`).

---

## 5. Domain Views & Tactical Layouts

### Header Command Bar

- Enterprise branding with glowing Zap badge and `ENTERPRISE` tier chip.
- Live AMQP and Redis GeoStream heartbeat badge with latency readout (`ONLINE (12ms)`).
- Escrow Vault balance summary chip.
- Segmented navigation tab bar with smooth active pill states and numeric count badges.

### Telemetry KPI Bar

- 4-card operational grid: Active Orders (with on-site counter), Tech Radar (with ready count), SLA Adherence (99.8% SLO target), and Escrow Locked Vault.
- Micro-progress tracks providing instant visual feedback.

### Live Dispatch & FSM Command Board

- Search and multi-criteria filters (status, priority).
- Master list with active selection border and urgency-flashing SLA countdowns.
- 4-step FSM lifecycle progression stepper.
- **Tactical Geofence Radar Widget**: Visual circular radar showing target site pin, 200m geofence tolerance ring, technician ping dot, and verified distance.
- Deliverables evidence inspection gallery (photos, checklists, store manager signatures).

### SOW Studio Wizard

- One-click template blueprint cards (POS Emergency, Fiber Optic, Meraki APs).
- 4-step guided workflow (Scope -> Location & Geofence -> SLA & Escrow -> Deliverables).
- Real-time live dispatch preview card with Stripe-style transparent escrow calculator (+8% platform fee breakdown).

### Geospatial Radar & Bids Matrix

- **Circular Radar Scope**: Rotating sweep beam (`animate-radar-sweep`), distance rings, and plotted technician blips.
- Dynamic coverage perimeter slider (5mi, 10mi, 25mi, 50mi).
- Incoming bids matrix with counter-notes, pricing, and 1-click assignment.
- Vetted technician directory with star ratings, badges, and emergency direct dispatch.

### Escrow Vault Ledger & Invoicing

- Summary cards for locked funds, lifetime settled payouts, and pre-authorized payment instruments.
- Ledger table with 72h auto-release countdown and action triggers.
- **Enterprise Escrow Statement Modal**: Itemized statement with company header, buyer info, routing instrument, financial totals, and cryptographic SHA-256 audit proof.

---

## 6. Accessibility (A11y) & Usability Standards

1. **Contrast Ratio**: All text and interactive states achieve WCAG AA standard (≥ 4.5:1 for normal text, ≥ 3:1 for large text).
2. **Keyboard Navigation**: Strict `focus-visible:ring-2` with high-contrast ring offsets. Modal windows trap focus and support `Escape` key dismissal.
3. **Touch Targets**: Minimum 44x44 CSS pixels for mobile touch points.
4. **Motion Safety**: Subtle micro-interactions respect user intent with clean CSS transitions and zero disorienting screen flashes.
