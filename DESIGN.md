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

## Marketing lifecycle reference layout

The lifecycle introduction occupies the left column; two summary cards sit above
a seven-stage row on the right from 1024px. Use the shared marketing content
frame and Tailwind utilities. Below 1024px, the summaries and ordered stages
stack beneath the introduction. Dispatch uses `lifecycle-active` (#c6f879) and
`lifecycle-active-border` (#b4e76b), with a short bottom indicator. This is a
static illustration, not an interactive workflow.

Real-work reference follow-up: the pale-green section places its heading, copy,
and circular benefit icons in a narrow left column from 1024px. The existing
technician/industry illustration fills the remaining area without a nested
frame. A native sample-jobs card replaces the clipped jobs text in that asset.
On smaller screens the content, illustration, and readable job list stack.
Lifecycle and real-work are grouped to remove the oversized intervening gap.

### Technician marketplace reference follow-up

The marketplace uses the shared marketing frame with a narrow left introduction
and a pale map panel on the right. From 1024px, Marcus is the larger center card,
Priya sits to its left, and Daniel and Alex form the right column. The navigation
strip belongs at the bottom of the panel. Smaller layouts use flowing cards.
All copy, portraits, tags, badges, and links are native elements styled with
Tailwind; only the faint decorative map is a generated raster asset.

### Smart dispatch reference follow-up

Smart dispatch uses a full-width `surface-green` canvas and the shared marketing
content frame. Its soft white inset panel has a larger map on the left and a
compact candidate list on the right from 1024px. Four rounded feature pills form
a two-by-two grid directly under the candidate list. Mobile stacks map, list,
and pills. Use Tailwind utilities, native candidate text, existing map/portrait
assets, and the existing orbit image for faint background decoration.

### Field operations and secure payments reference follow-up

These adjacent sections share a pale marketing canvas. Field operations uses a
centered two-line heading, a light assignment phone, a live map/site card, an
unboxed capability list, and a completion phone with a notification above it.
A separate rounded benefits strip sits below. Payments places four compact
workflow tiles beside its introduction at desktop widths, with three horizontal
icon-and-copy cards below. Both use the shared marketing scale from 1024px and
flow into stacked layouts on smaller screens. All UI styling uses Tailwind.

### Compliance and trust reference follow-up

Use a compact pale-green frame with the profile card on the left and the heading
above three separate right-hand panels from 1024px. Verification, credentials,
and reliability panels use light backgrounds, small title-case headings, circular
icons, and thin row dividers. The profile uses a tall portrait, two-column pill
badges, and a full-width primary action. Place the trust row directly below with
no horizontal rule. Smaller layouts flow vertically. Tailwind controls styling.

### Command center reference follow-up

Use a pale mint canvas, centered compact summary cards, and a light dashboard
frame. A dark sidebar spans the workspace height; the title, time-range preview,
alert panel, and nearby-technician panel sit on white surfaces. Consolidate the
four benefits into one divided bar. Use shared marketing scaling from 1024px,
stack the map and panels below that width, and retain native text and Tailwind
utilities around the existing map asset.

### Audience and expertise reference follow-up (2026-09-29)

Audience and expertise share a pale-green canvas with a compact gap. From 1024px, two audience cards sit side by side, each with introductory copy on the left and a four-step list behind a vertical divider on the right. Expertise uses a single-line desktop heading followed by three wider service cards and four smaller cards. Use circular step numbers, soft icon circles, modest corner radii, and Tailwind utilities. Mobile layouts stack without fixed heights.

### Reliability and closing banner follow-up (2026-09-29)

Reliability and the closing CTA form a compact group separated by 20px. The reliability section uses a large two-line heading and four white cards with circular lime icons. The dark banner places a large three-line pitch beside an inset dashboard from 1024px. Use the generated forest background as a separate decorative image, native copy and controls, compact bordered telemetry panels, and bottom assurance badges. Smaller screens stack the banner columns. All layout styling uses Tailwind.

### Footer reference follow-up (2026-09-29)

The shared marketing footer uses a dark decorative backdrop, a brand column, four compact navigation/content columns, and a newsletter/app area from 1024px. Thin vertical rules separate the brand and newsletter areas; a full-width horizontal rule separates the copyright bar. Use circular social buttons, the existing brand mark, lime accents, and native email/language controls. Tablet and mobile columns wrap with 44px interaction targets. Tailwind controls all styling.

### Expertise image quality follow-up

Expertise cards use the seven high-resolution `service-*-v2.png` assets through
Next Image, with centered cropping. All seven category pills are native UI labels;
the top row no longer depends on labels baked into low-resolution thumbnails.
Preserve the existing grid, card heights, descriptions, and links.

### Field Operations image replacement (2026-09-29)

FieldOperationsSection uses three separately generated high-resolution assets for the technician map, server photo, and Priya portrait. Keep the map labels visible with contained fitting below 1024px and centered cover fitting on desktop. The Live badge remains native UI. The portrait requests a 96px source for the small circular display so it stays sharp on high-density screens.

### Real Work separated assets follow-up (2026-09-29)

Real Work must use one standalone technician photo, six individual service images in a two-column/three-row desktop grid, and native service labels. Keep Active Jobs as one native overlay, with no job text embedded behind it. The dispatch badge is native and sits above the tablet, between the technician and the service grid. Mobile stacks the photo, jobs, and service grid in normal flow. Tailwind controls layout and soft photo-edge masking; a separate decorative SVG restores the lime dispatch route with a gap around the technician.

### Command Center native demo map (2026-09-29)

The Command Center map is now a client-side SVG/HTML demo, replacing the flattened map PNG. Use existing dark/map/status tokens, native 44px controls and markers, a separate legend, technician popup, weather card, and directory link. Local zoom is bounded to four levels; arrow keys pan the focused map within its bounds. Reset restores the initial center and Alex selection. Geography, weather, counts, and technician details are illustrative; no external map tiles or location services are used.

### Dispatch demo maps and portraits (2026-09-29)

Smart Dispatch and the closing CTA now use native SVG/HTML demo maps, preserving their dark palettes and San Francisco/Texas compositions. Emergency cards, route curves, distances, location badges, active-job counts, and zoom/reset controls are separate elements. Map interaction stays local; sample geography is illustrative. Dispatch candidates reuse the generated Marcus v2, Daniel v2, and Priya field v3 portraits with optimized image sizing.

### Platform page reference redesign (2026-10-03)

The `/platform` route follows `design-files/marketing-page-desgn/image 62.png`: a connected-operations hero with separate laptop/phone UI, five capability cards, an ecosystem diagram, searchable sample work orders with three benefits, a pale closing CTA, and compact dark footer. It reuses marketing tokens, the local display font, brand mark, portraits, and existing routes. A light generated basemap is the only new raster; pins, cards, labels, device UI, and table content remain native. Desktop uses an 86.3% centered frame capped at 1440px; mobile stacks sections and scrolls only the table internally. This reference supersedes the old architecture-pillar presentation.

### Solutions page reference redesign (2026-10-03)

The Solutions page uses existing tokens, shared brand/typography primitives, six equal desktop solution cards, alternating pale/white feature bands, native laptop/map/phone cards, separate technician photographs, a compact industry row, and a light footer. Desktop composition begins at 1024px; smaller screens stack sections. Operational preview statuses reuse StatusBadge. No global tokens or other page layouts changed.

### Industries page reference redesign (2026-10-03)

Industries uses the image 60 reference: split hero with clipped photographic panels, an eight-card grid (four columns from 1024px, two from 640px), soft green icon tiles, pale CTA/customer row, and light footer. Shared Solutions chrome accepts an optional activePage; its default preserves Solutions appearance. Uses existing tokens, font, icons and brand assets.

### Resources page reference redesign (2026-10-03)

Resources follows image 59: split photo/search hero, six type filters, three featured cards, four latest cards, six topic tiles, pale newsletter band and dark six-column footer. Desktop grids start at 1024px; smaller screens stack. PlatformNavigation gains an optional activePage with its Platform default preserved. All UI uses existing tokens, brand, icons, fonts, visible focus states and native dialog focus management.

### Pricing page reference redesign (2026-10-03)

Pricing follows image 58 with a pale background, split hero with independent customer photograph and transparent dashed connector, four-step workflow, two overview cards, native editable fee example, four benefits, two-column FAQ, dark CTA and footer. Desktop composition starts at 1024px; smaller screens stack. Shared Solutions navigation accepts Pricing as an active route without changing its default. All content and controls are native UI; existing fonts/tokens/icons/portraits are reused.
