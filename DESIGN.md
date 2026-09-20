---
name: FieldForge Design System
version: 3.1.0
description: 'An enterprise-grade, high-concurrency marketplace design specification for autonomous field service dispatch and escrow settlement. Derived from the approved FieldForge brand identity and reference designs: a clean off-white canvas (#FBFCF8) for marketing, a dedicated operational dashboard background (#F7F9F5) with clean white cards (#FFFFFF) and dark sidebar (#081A15), disciplined lime green accents (#A8F22D), controlled soft shadows, restrained border radii (8-16px), and crisp tabular figures for high-density telemetry, SLA timers, and financial ledgers.'

colors:
  # Primary Brand Accent (Lime Green)
  brand-green: '#A8F22D'
  brand-green-hover: '#94DC20'
  brand-green-active: '#82C719'
  brand-green-soft: '#EAFAD5'
  brand-green-subtle: '#F3FBEA'
  brand-green-faint: '#F8FCF4'

  # Dark Brand (Sidebar, Dark Buttons, Dark Banners)
  brand-dark: '#081A15'
  brand-dark-2: '#0D211B'
  brand-dark-hover: '#153028'

  # Text & Ink
  text-primary: '#0B1114'
  text-heading: '#090E11'
  text-secondary: '#59636E'
  text-muted: '#7D8791'
  text-faint: '#A1A8AF'

  # Surfaces & Canvas
  surface-page: '#FBFCF8'
  surface-white: '#FFFFFF'
  surface-soft: '#F7F9F5'
  surface-green: '#F0F8E7'
  surface-green-strong: '#E7F5D7'
  surface-dark: '#081A15'
  surface-dark-secondary: '#10241D'

  # Borders
  border-default: '#E3E8E1'
  border-soft: '#EBEFE9'
  border-strong: '#D5DDD2'

  # Semantic Statuses
  status-success: '#22B947'
  status-success-soft: '#E9F8EC'
  status-warning: '#F5A623'
  status-warning-soft: '#FFF5DF'
  status-danger: '#F04444'
  status-danger-soft: '#FDEAEA'
  status-info: '#2693F2'
  status-info-soft: '#EAF4FE'
  status-neutral: '#78838D'
  status-neutral-soft: '#F0F2F3'

typography:
  fontFamily:
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    mono: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace'

radius:
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
  pill: '999px'

shadows:
  xs: '0 1px 2px rgba(10, 20, 15, 0.04)'
  sm: '0 3px 10px rgba(10, 20, 15, 0.05)'
  card: '0 8px 24px rgba(10, 20, 15, 0.06)'
  floating: '0 14px 40px rgba(10, 20, 15, 0.10)'
---

# FieldForge Design Specification (v3.1.0)

FieldForge is an enterprise field service marketplace and autonomous dispatch platform connecting businesses with certified technicians. The visual language is clean, minimal, premium, operational, confident, trustworthy, and product-first.

---

## 1. Global Color System & Rules

### Core Surfaces & Borders

| Token | Value | Purpose |
| :--- | :--- | :--- |
| `surface-page` | `#FBFCF8` | Marketing website canvas and page background |
| `surface-soft` | `#F7F9F5` | Dashboard background (light gray-green) |
| `surface-white` | `#FFFFFF` | Main cards, tables, topbar, modal dialogs |
| `surface-green` | `#F0F8E7` | Soft green container card / highlighted alert |
| `surface-green-strong` | `#E7F5D7` | Active green badge container |
| `surface-dark` | `#081A15` | Primary dashboard sidebar, dark operational cards |
| `surface-dark-secondary` | `#10241D` | Secondary dark elevation |
| `border-default` | `#E3E8E1` | Default card and panel structural border |
| `border-soft` | `#EBEFE9` | Table row dividers and inner separators |
| `border-strong` | `#D5DDD2` | Form input and active container boundaries |

### Primary Brand & Accents

| Token | Value | Usage Rules |
| :--- | :--- | :--- |
| `brand-green` | `#A8F22D` | Primary action buttons, active navigation, key highlights, selected state |
| `brand-green-hover` | `#94DC20` | Primary action button hover |
| `brand-green-active` | `#82C719` | Primary action button active / pressed |
| `brand-green-soft` | `#EAFAD5` | Soft green icon background containers (32–40px) |
| `brand-dark` | `#081A15` | Dark primary buttons, sidebar, dark footer, dark CTA banner |
| `text-primary` | `#0B1114` | Primary body text and table rows |
| `text-heading` | `#090E11` | Bold headers and major titles |
| `text-secondary` | `#59636E` | Subtitles, table headers, metadata |
| `text-muted` | `#7D8791` | Secondary indicators, placeholders |

> **IMPORTANT ACCENT RULE**: Lime green (`#A8F22D`) is an ACCENT. Most of the interface remains crisp white, off-white, charcoal, and subtle pale green.

### Status System

| Status | Foreground | Background | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **Success / Completed / Approved / On Site / Paid** | `#22B947` | `#E9F8EC` | Verified, approved, on-site, or paid |
| **Warning / Pending / En Route / Held** | `#F5A623` | `#FFF5DF` | In transit, awaiting bid, or escrow held |
| **Danger / Cancelled / Disputed / Expired** | `#F04444` | `#FDEAEA` | Dispute flagged, cancelled, SLA breach |
| **Info / Published / Assigned / In Progress** | `#2693F2` | `#EAF4FE` | Active broadcast, scheduled, or progress |
| **Neutral / Draft / Closed** | `#78838D` | `#F0F2F3` | Inactive draft or closed |

---

## 2. Component Design Standards

### Buttons
- **Primary Button**: Background `#A8F22D`, text `#08120D`, hover `#94DC20`, font-weight 600, radius 10–12px.
- **Dark Primary Button**: Background `#081A15`, text `#FFFFFF`, hover `#153028`, font-weight 600, radius 10–12px.
- **Secondary Button**: Background `#FFFFFF`, border `1px solid #DDE4DA`, text `#0B1114`, hover `#F8FAF7`.
- **Ghost Button**: Transparent, text `#59636E`, hover `#F0F8E7`.
- **Destructive Button**: Background `#F04444`, text `#FFFFFF`.
- **Heights**: Small 36px, Default 42px, Large 48px, Mobile 50–52px.

### Inputs & Forms
- Height: Desktop 42–44px, Large Form 46–48px, Mobile 48–52px.
- Radius: 10–12px. Background: `#FFFFFF`. Border: `1px solid #DDE4DA`.
- Focus: Border `#A8F22D`, focus ring `0 0 0 3px rgba(168,242,45,0.14)`.

### Cards
- **Base Card**: Background `#FFFFFF`, border `1px solid #E3E8E1`, radius 14–16px, padding 20–24px.
- **Metric Card**: Background `#FFFFFF`, border `1px solid #E3E8E1`, radius 14px, padding 16–20px, minimal/no shadow.
- **Soft Green Card**: Background `#F0F8E7`, border `#DFECD5`, radius 14–16px.
- **Dark Operational Card**: Background `#081A15`, text `#FFFFFF`, secondary text `rgba(255,255,255,0.64)`.

### Tables
- Header height: 42–46px, background `#F8FAF7`, text 12px weight 600 `#59636E`.
- Row height: 54–62px, background `#FFFFFF`, border-bottom `1px solid #EBEFE9`, hover `#FAFCF8`, selected `#F1F9E8`.
- Status pill: Height 24–28px, padding 6–10px, font-size 12px, radius 999px.

### Layout & Navigation
- **Marketing Navbar**: Height 68–72px, background `#FFFFFF` (or `#FBFCF8`), border `#EBEFE9`, logo 28–32px.
- **Dashboard Sidebar**: Width 232px, background `#081A15`, logo area 64–72px, item height 42–44px, active item background `rgba(168,242,45,0.10)`, text `#FFFFFF`, icon `#A8F22D`. Inactive text `rgba(255,255,255,0.72)`.
- **Dashboard Topbar**: Height 64–68px, background `#FFFFFF`, bottom border `#E7EBE5`, search input height 40–42px.
