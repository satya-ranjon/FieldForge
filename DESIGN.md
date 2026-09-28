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

| Token                    | Value     | Purpose                                           |
| :----------------------- | :-------- | :------------------------------------------------ |
| `surface-page`           | `#FBFCF8` | Marketing website canvas and page background      |
| `surface-soft`           | `#F7F9F5` | Dashboard background (light gray-green)           |
| `surface-white`          | `#FFFFFF` | Main cards, tables, topbar, modal dialogs         |
| `surface-green`          | `#F0F8E7` | Soft green container card / highlighted alert     |
| `surface-green-strong`   | `#E7F5D7` | Active green badge container                      |
| `surface-dark`           | `#081A15` | Primary dashboard sidebar, dark operational cards |
| `surface-dark-secondary` | `#10241D` | Secondary dark elevation                          |
| `border-default`         | `#E3E8E1` | Default card and panel structural border          |
| `border-soft`            | `#EBEFE9` | Table row dividers and inner separators           |
| `border-strong`          | `#D5DDD2` | Form input and active container boundaries        |

### Primary Brand & Accents

| Token                | Value     | Usage Rules                                                               |
| :------------------- | :-------- | :------------------------------------------------------------------------ |
| `brand-green`        | `#A8F22D` | Primary action buttons, active navigation, key highlights, selected state |
| `brand-green-hover`  | `#94DC20` | Primary action button hover                                               |
| `brand-green-active` | `#82C719` | Primary action button active / pressed                                    |
| `brand-green-soft`   | `#EAFAD5` | Soft green icon background containers (32–40px)                           |
| `brand-dark`         | `#081A15` | Dark primary buttons, sidebar, dark footer, dark CTA banner               |
| `text-primary`       | `#0B1114` | Primary body text and table rows                                          |
| `text-heading`       | `#090E11` | Bold headers and major titles                                             |
| `text-secondary`     | `#59636E` | Subtitles, table headers, metadata                                        |
| `text-muted`         | `#7D8791` | Secondary indicators, placeholders                                        |

> **IMPORTANT ACCENT RULE**: Lime green (`#A8F22D`) is an ACCENT. Most of the interface remains crisp white, off-white, charcoal, and subtle pale green.

### Status System

| Status                                              | Foreground | Background | Semantic Meaning                         |
| :-------------------------------------------------- | :--------- | :--------- | :--------------------------------------- |
| **Success / Completed / Approved / On Site / Paid** | `#22B947`  | `#E9F8EC`  | Verified, approved, on-site, or paid     |
| **Warning / Pending / En Route / Held**             | `#F5A623`  | `#FFF5DF`  | In transit, awaiting bid, or escrow held |
| **Danger / Cancelled / Disputed / Expired**         | `#F04444`  | `#FDEAEA`  | Dispute flagged, cancelled, SLA breach   |
| **Info / Published / Assigned / In Progress**       | `#2693F2`  | `#EAF4FE`  | Active broadcast, scheduled, or progress |
| **Neutral / Draft / Closed**                        | `#78838D`  | `#F0F2F3`  | Inactive draft or closed                 |

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

## Marketing hero reference adaptation — 2026-09-28

The latest user-supplied 1536 × 1024 design is the desktop target; the earlier
988 × 659 reference is retained for comparison at the smaller breakpoint. The
canvas uses `surface-marketing` as a CSS background color. No full-page screenshot,
background inpainting, screenshot sprites, or baked-in UI cards are rendered.

Independent components render service cards, tracking, verification, highlights,
and the trust row. The technician cutout, tracking avatar, map, service illustrations,
underline, and faint route decoration are separate high-resolution assets. Small
service images and the avatar use Next.js image optimization. Text, badges, controls,
brand glyph, and metric icons remain HTML/SVG. The body is Arial/Helvetica; the
self-hosted Roboto Black display face uses a 5.05em size and 0.91 line height.

The composition uses rem-based steps: 0.625rem by default, 0.8125rem from 75rem,
and 0.975rem from 93.75rem. This replaces continuous viewport scaling so zoom
changes element size within each layout, and reflows at the responsive breakpoints.
The centered frame is 86.4 composition units wide. At 1536px, copy starts at 94px,
tracking at 664/175, and the metrics rail at 635/865. Below 56.25rem, copy and artwork
stack and metrics use two columns. The photo is capped at 998.4 CSS pixels at the
default root font size, below its 1254px source. It may soften at extreme zoom or
high device density; generated photo details are not pixel-identical to the source.

Asset provenance and prompts are recorded in `public/marketing/hero-assets.md`.

Scoped marketing tokens:

| Token                      | Value     | Purpose                            |
| :------------------------- | :-------- | :--------------------------------- |
| `surface-marketing`        | `#F5FBF5` | Mint canvas                        |
| `marketing-heading-accent` | `#5A9D2F` | Large green headline               |
| `marketing-lime`           | `#8BEB32` | CTA and tracking accents           |
| `marketing-check`          | `#50D22A` | Benefit and verification checks    |
| `marketing-glass`          | `#1B3033` | Translucent preview cards          |
| `marketing-map`            | `#293E3F` | Tracking map surface               |
| `marketing-status-soft`    | `#EAFBDD` | Green preview status background    |
| `marketing-status-green`   | `#477D2D` | Readable Scheduled/Assigned labels |
| `marketing-status-red`     | `#C92C2C` | Readable Urgent label              |

The current request explicitly prioritizes the reference's green Scheduled/Assigned
and red Urgent preview badges. These are local style overrides on `StatusBadge`;
operational badge defaults and public state semantics are unchanged.

## Marketing platform assurance strip — 2026-09-28

The user-selected trust-strip reference replaces the How It Works card beneath
the hero. Five native labels and Lucide icons sit on a full-width off-white band,
with alternating lime/teal circles, vertical dividers, and separate faint orbital
decorations. The desktop row becomes two columns below 1024px and one below 640px.
Text and icons remain independent of raster resolution. Scoped tokens are
`surface-trust` (#F7F8F2), `trust-lime` (#D3F59B), `trust-lime-ink` (#3F620E),
`trust-teal` (#AFE4DF), and `trust-teal-ink` (#145456). This explicit reference
overrides the previous dotted workflow-card styling only in this section.

The assurance strip uses Tailwind utilities exclusively, including responsive
breakpoints, pseudo-element dividers, typography, and decorative positioning.
Its section background inherits the page canvas, preserving the user's latest
background adjustment. No component CSS module is required.

Styling conversions must preserve the existing appearance. Prefer Tailwind only
when it reproduces the current design; retain custom CSS where necessary for
visual parity. Do not combine this conversion with layout or asset changes.

The hero, preview cards, trust wordmarks, and compact navbar now use shared
Tailwind utility groups in `MarketingHero.styles.ts`. Existing em/rem dimensions,
responsive breakpoints, colors, shadows, and image assets are preserved. The only
required raw CSS is the self-hosted `@font-face` registration in `globals.css`;
Tailwind utilities cannot register a font resource.

The latest annotated trust-strip review supersedes its independent 82% desktop
width. At desktop widths, its row now uses the hero's centered 86.4-unit frame
and shared rem-scale breakpoints. The first icon and final label align with the
frame edges. Icon/type sizing follows that scale; orbital accents are positioned
relative to the row. Tablet and mobile stacking remains unchanged.

The single-row assurance layout starts at the 1024px laptop breakpoint, with
a 14px minimum label size. Below 1024px it uses two columns, then one below 640px.
