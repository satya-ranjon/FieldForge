---
name: FieldForge Design System
version: 1.0.0
description: Design tokens and UI/UX guidelines for the FieldForge Field Service Marketplace.
tokens:
  color:
    brand:
      primary: '#2563eb' # blue-600
      primary-hover: '#1d4ed8' # blue-700
      primary-focus: '#3b82f6' # blue-500
      secondary: '#0f172a' # slate-900
      accent: '#06b6d4' # cyan-500
    surface:
      dark:
        bg: '#090d16' # deep slate canvas
        card: '#0f172a' # slate-900
        card-hover: '#1e293b' # slate-800
        border: '#1e293b' # slate-800
        border-subtle: '#334155' # slate-700
      light:
        bg: '#f8fafc' # slate-50
        card: '#ffffff'
        card-hover: '#f1f5f9' # slate-100
        border: '#e2e8f0' # slate-200
        border-subtle: '#cbd5e1' # slate-300
    text:
      dark:
        primary: '#f8fafc' # slate-50
        secondary: '#94a3b8' # slate-400
        muted: '#64748b' # slate-500
      light:
        primary: '#0f172a' # slate-900
        secondary: '#475569' # slate-600
        muted: '#94a3b8' # slate-400
    semantic:
      success:
        bg: '#052e16'
        text: '#22c55e'
        border: '#15803d'
      warning:
        bg: '#451a03'
        text: '#f59e0b'
        border: '#b45309'
      error:
        bg: '#450a0a'
        text: '#ef4444'
        border: '#b91c1c'
      info:
        bg: '#082f49'
        text: '#0ea5e9'
        border: '#0369a1'
  typography:
    fontFamily:
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
      mono: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace'
    fontSize:
      xs: '0.75rem' # 12px
      sm: '0.875rem' # 14px
      base: '1rem' # 16px
      lg: '1.125rem' # 18px
      xl: '1.25rem' # 20px
      '2xl': '1.5rem' # 24px
      '3xl': '1.875rem' # 30px
    fontWeight:
      regular: '400'
      medium: '500'
      semibold: '600'
      bold: '700'
    lineHeight:
      tight: '1.25'
      normal: '1.5'
      relaxed: '1.75'
  spacing:
    '0': '0px'
    '1': '0.25rem' # 4px
    '2': '0.5rem' # 8px
    '3': '0.75rem' # 12px
    '4': '1rem' # 16px
    '5': '1.25rem' # 20px
    '6': '1.5rem' # 24px
    '8': '2rem' # 32px
    '10': '2.5rem' # 40px
    '12': '3rem' # 48px
    '16': '4rem' # 64px
  radius:
    none: '0px'
    sm: '0.25rem' # 4px
    md: '0.375rem' # 6px
    lg: '0.5rem' # 8px
    xl: '0.75rem' # 12px
    full: '9999px'
  shadows:
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    glow-blue: '0 0 15px rgba(37, 99, 235, 0.35)'
    glow-green: '0 0 15px rgba(34, 197, 94, 0.35)'
  breakpoints:
    sm: '640px'
    md: '768px'
    lg: '1024px'
    xl: '1280px'
    '2xl': '1536px'
---

# FieldForge Design Specification

FieldForge is an enterprise-grade, high-concurrency marketplace connecting enterprise buyers with certified field technicians. The visual language balances high-density operational telemetry with clarity, speed, and responsiveness.

---

## 1. Design Philosophy

- **High-Density Telemetry**: Dispatchers and buyers require rich information density (live GPS radar, technician bid matrices, SLA countdowns, escrow milestones) without cognitive overload.
- **Dark-First Command Center**: The Web Buyer Portal defaults to a high-contrast dark theme (`#090d16` canvas, `#0f172a` cards) that reduces eye fatigue for operations center operators.
- **Glanceable Status Architecture**: Every work order, bid, and technician has a deterministic color-coded status badge and pulse indicator (e.g., active GPS sync, escrow funded, deliverables pending review).
- **Tactile Mobile Field Experience**: The Mobile Tech App utilizes large touch targets (minimum 44x44px), high contrast under direct sunlight, and prominent offline-first sync indicators.

---

## 2. Color System & Usage Rules

### Brand & Primary Colors

- `primary` (`#2563eb`): Primary action buttons, active navigation indicators, key metrics.
- `primary-hover` (`#1d4ed8`): Interactive hover states for primary elements.
- `secondary` (`#0f172a`): Secondary controls, card backgrounds, elevated surfaces.
- `accent` (`#06b6d4`): Geofence boundary overlays, real-time dispatch routes, active tracking beacons.

### Semantic Status Colors

| Status                    | Background | Text      | Border    | Meaning                                         |
| :------------------------ | :--------- | :-------- | :-------- | :---------------------------------------------- |
| **DRAFT / PENDING**       | `#1e293b`  | `#94a3b8` | `#334155` | Work order draft or awaiting technician review  |
| **MATCHING / DISPATCHED** | `#082f49`  | `#38bdf8` | `#0284c7` | Geo-search radius active, technician dispatched |
| **IN_PROGRESS**           | `#172554`  | `#60a5fa` | `#2563eb` | Technician checked in on-site within geofence   |
| **REVIEW / COMPLETED**    | `#052e16`  | `#4ade80` | `#16a34a` | Deliverables submitted / work completed         |
| **DISPUTED / CANCELLED**  | `#450a0a`  | `#f87171` | `#dc2626` | Milestone dispute or canceled work order        |

---

## 3. Typography & Hierarchy

- **Headings (`h1`, `h2`, `h3`)**: Semi-bold to bold `Inter` with snug letter spacing (`-0.02em`).
- **Data & Tables**: Numerical values, timestamps, correlation IDs, and coordinates use `JetBrains Mono` or tabular figures for vertical alignment.
- **Body & Labels**: Clean, medium-weight `Inter` with strict adherence to 14px (`text-sm`) base for dense enterprise cards and 16px (`text-base`) for forms and reader views.

---

## 4. Component Patterns (`@fieldforge/ui`)

### Buttons

- **Primary**: `bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium`
- **Secondary**: `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg`
- **Danger**: `bg-red-600 hover:bg-red-700 text-white rounded-lg`
- **Outline**: `border border-blue-500 text-blue-400 hover:bg-blue-950/40 rounded-lg`

### Status Badges

- Strict pill geometry (`rounded-full px-2.5 py-0.5 text-xs font-semibold`).
- Optional live pulse dot for active states (`w-1.5 h-1.5 rounded-full animate-pulse`).

### Cards & Panels

- Surface: `bg-slate-900/90 border border-slate-800/80 rounded-xl backdrop-blur-md`
- Header: Clear separation with `border-b border-slate-800/60 pb-3`
- Spacing: Inner padding `p-4` or `p-6` on 4px grid.

---

## 5. Accessibility (A11y) & Usability Standard

1. **Contrast Ratio**: All text elements must achieve at least WCAG AA standard (4.5:1 for normal text, 3:1 for large text).
2. **Keyboard Navigation & Focus**: All interactive elements must have visible focus rings (`focus:ring-2 focus:ring-blue-500 focus:outline-none`).
3. **Touch Targets**: Mobile app and touch interfaces must maintain a minimum bounding box of 44x44 CSS pixels.
4. **Form Labels & Error States**: Explicit `aria-label`, `aria-describedby`, and high-contrast error messages next to failing inputs.
