# FieldForge Landing Page — Asset Plan

Source Reference: `design-files/marketing-page-desgn/1442.png`

## 1. Asset Strategy & Principles

In accordance with the **Critical Image vs Code Rule**:

- **JSX + Tailwind CSS**: All layout structures, navigation bars, cards, headings, descriptions, buttons, tags, status pills, numbers, form controls, borders, shadows, and interactive widgets are built strictly in code.
- **SVG / CSS Decorative Assets**: Organic gradient backdrops, wavy connector lines, dashed arrows, status icons, step badges, and brand logos.
- **Raster / Photographic Assets**: Only realistic photographic scenes (technicians, server hardware, cabling, POS devices, security cameras, customer avatars, and tactical map backgrounds). No UI text is baked into these photographic assets.

---

## 2. Inventory of Photographic & Raster Assets

| Asset Name                        | Target File Path                                     | Dimensions (1x) | Source / Extraction Method                           | Crop & Aspect Ratio                                                           | Transparency                       | Usage Location                                    |
| :-------------------------------- | :--------------------------------------------------- | :-------------- | :--------------------------------------------------- | :---------------------------------------------------------------------------- | :--------------------------------- | :------------------------------------------------ |
| `hero-technician.png`             | `/public/marketing/hero-technician.png`              | 660 × 640px     | Extracted at native 3.42x resolution from `1442.png` | Aspect ~1:1, rounded corners, shows technician holding tablet in front of van | False (has background environment) | Right side of Hero section                        |
| `real-work-bg.png`                | `/public/marketing/real-work-bg.png`                 | 740 × 360px     | Extracted from `1442.png` section 3                  | Landscape ~2:1, technician in facility                                        | False                              | Background of "Real Work, All Industries" section |
| `service-networking.png`          | `/public/marketing/service-networking.png`           | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, enterprise switches with green cables                                   | False                              | Expertise grid: Networking card                   |
| `service-cabling.png`             | `/public/marketing/service-cabling.png`              | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, blue combed patch cables in tray                                        | False                              | Expertise grid: Structured Cabling card           |
| `service-pos.png`                 | `/public/marketing/service-pos.png`                  | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, touchscreen POS terminal with scanner                                   | False                              | Expertise grid: Point of Sale card                |
| `service-security.png`            | `/public/marketing/service-security.png`             | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, ceiling mounted dome and bullet cameras                                 | False                              | Expertise grid: Security & Surveillance card      |
| `service-hardware.png`            | `/public/marketing/service-hardware.png`             | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, laptop with internal circuit board repair                               | False                              | Expertise grid: Computer Hardware card            |
| `service-av.png`                  | `/public/marketing/service-av.png`                   | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, wall digital signage display                                            | False                              | Expertise grid: AV & Digital Signage card         |
| `service-enterprise-map.png`      | `/public/marketing/service-enterprise-map.png`       | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, US map with New York, Chicago, Dallas pins                              | False                              | Expertise grid: Enterprise Locations card         |
| `map-smart-dispatch.png`          | `/public/marketing/map-smart-dispatch.png`           | 640 × 440px     | Extracted from `1442.png` section 4                  | ~1.45:1, dark satellite map of San Francisco                                  | False                              | Smart Dispatch section map                        |
| `map-field-operations.png`        | `/public/marketing/map-field-operations.png`         | 420 × 360px     | Extracted from `1442.png` section 5                  | ~1.15:1, light street map with technician routes                              | False                              | Field Operations live tracking panel              |
| `photo-server-rack.png`           | `/public/marketing/photo-server-rack.png`            | 180 × 120px     | Extracted from `1442.png` section 5                  | ~1.5:1, data center server rack with green LEDs                               | False                              | Field Operations site visit thumbnail             |
| `map-command-center.png`          | `/public/marketing/map-command-center.png`           | 620 × 400px     | Extracted from `1442.png` section 8                  | ~1.55:1, tactical dark map of NYC / Brooklyn                                  | False                              | Command Center preview map                        |
| `map-texas-command.png`           | `/public/marketing/map-texas-command.png`            | 440 × 360px     | Extracted from `1442.png` section 10                 | ~1.2:1, dark map of Texas with Austin, Houston, etc.                          | False                              | Dark bottom CTA banner tablet mockup              |
| `avatar-alex-morgan.png`          | `/public/marketing/avatars/alex-morgan.png`          | 120 × 120px     | Extracted from `1442.png`                            | 1:1 circular portrait                                                         | False                              | Hero tracking card, Smart dispatch candidate      |
| `avatar-hero-tracking-avatar.png` | `/public/marketing/avatars/hero-tracking-avatar.png` | 160 × 160px     | Extracted from `1442.png`                            | 1:1 circular portrait (smiling with cap)                                      | False                              | Technician marketplace, Compliance section        |
| `avatar-priya-shah.png`           | `/public/marketing/avatars/priya-shah.png`           | 120 × 120px     | Extracted from `1442.png`                            | 1:1 circular portrait                                                         | False                              | Technician marketplace, Field operations          |
| `avatar-daniel-carter.png`        | `/public/marketing/avatars/daniel-carter.png`        | 120 × 120px     | Extracted from `1442.png`                            | 1:1 circular portrait                                                         | False                              | Technician marketplace                            |
| `avatar-alex-rivera.png`          | `/public/marketing/avatars/alex-rivera.png`          | 120 × 120px     | Extracted from `1442.png`                            | 1:1 circular portrait                                                         | False                              | Technician marketplace                            |

---

## 3. Extraction & Optimization Pipeline

1. **Extraction Source**: The original uncompressed `design-files/marketing-page-desgn/1442.png` (4938 × 32768px).
2. **Tooling**: Node.js script using `sharp` to perform pixel-precise coordinate bounding box crops.
3. **Target Destination**: `apps/web-buyer-portal/public/marketing/` and `apps/web-buyer-portal/public/marketing/avatars/`.
4. **Resolution**: Stored at 2x retina density for crisp high-DPI display rendering.

## Marketplace portrait replacements (2026-09-29)

Four distinct fictional portraits were generated with the built-in image tool:
`priya-shah-v2.png`, `marcus-lee-v2.png`, `daniel-carter-v2.png`, and
`alex-rivera-v2.png`, under `apps/web-buyer-portal/public/marketing/avatars/`.
Each source is 1254 × 1254px, with neutral lighting and no baked-in badge or
status dot. The marketplace uses Next.js Image optimization and its existing
circular crop; other consumers retain their original assets. Exact prompts are
recorded in [marketplace-avatar-prompts.md](marketplace-avatar-prompts.md).

### Reliability and closing banner follow-up (2026-09-29)

Added `public/marketing/cta-forest-background.png`, generated with the built-in image tool as a wide dark forest backdrop. Prompt is recorded in `docs/cta-background-prompt.md`. Reused the existing Texas operations map and generated Marcus portrait. Banner text and dashboard controls remain native UI.

### Footer reference follow-up (2026-09-29)

Added `public/marketing/footer-background.png` using the built-in image generation tool. The wide dark abstract backdrop is decorative; native footer content remains separate. Exact prompt is in `docs/footer-background-prompt.md`. Existing social and brand SVG artwork is reused.

### Generated expertise replacements (2026-09-29)

Replaced all seven marked expertise images with separate high-resolution assets:
`service-networking-v2.png`, `service-cabling-v2.png`, `service-pos-v2.png`,
`service-security-v2.png`, `service-hardware-v2.png`, `service-av-v2.png`, and
`service-enterprise-map-v2.png`, all in `public/marketing/`. The three wide images
are 2022 × 778; the remaining four are 1774 × 887. Generated with the built-in
image tool; exact prompts and saved paths are in `docs/expertise-image-prompts.md`.
The existing assets remain untouched. Category badges now render as native text
on every card, including the first row. The map's city labels and signage slogan
remain part of their images. No card layout, copy, or navigation changes.

### Field Operations image replacement (2026-09-29)

Generated `map-field-operations-v2.png` (1254 × 1254), `photo-server-rack-v2.png` (1681 × 936), and `avatars/priya-shah-field-v3.png` (1254 × 1254) under `public/marketing/`. They replace the three marked images only in FieldOperationsSection. Existing assets and other consumers are preserved. Exact built-in image generation prompts are recorded in `docs/field-operations-image-prompts.md`. The server image has no baked Live badge; the existing native label remains.

### Real Work separated assets follow-up (2026-09-29)

The Real Work composite image is replaced by seven separately generated files in `public/marketing/`: `real-work-technician-v2.png`, `real-work-security-v2.png`, `real-work-networking-v2.png`, `real-work-pos-v2.png`, `real-work-cabling-v2.png`, `real-work-hardware-v2.png`, and `real-work-av-v2.png`. Exact prompts and paths are in `docs/real-work-image-prompts.md`. Built-in generation was used, and every image was inspected. Active Jobs, dispatch status, service captions, and the six-tile grid are native UI; the old composite remains on disk but is no longer used by RealWorkSection.

### Real Work reference alignment correction (2026-09-29)

`real-work-technician-v3.png` is the new 1774 × 887 background, generated from the latest target screenshot with all UI removed. It replaces only the technician background in RealWorkSection; six service photos remain separate. Original assets are retained. Exact generation prompt is in `docs/real-work-image-prompts.md`.

### Command Center native demo map (2026-09-29)

CommandCenterPreview no longer consumes `map-command-center.png`. Its map is rendered by CommandCenterDemoMap using SVG geography and native controls. The original image is retained on disk; no image generation was needed.

### Dispatch demo maps and portraits (2026-09-29)

SmartDispatchSection no longer renders `map-smart-dispatch.png`; DarkBottomCtaBanner no longer renders `map-texas-command.png`. Originals remain on disk. Dispatch candidate images now use `avatars/marcus-lee-v2.png`, `avatars/daniel-carter-v2.png`, and `avatars/priya-shah-field-v3.png`. No new image generation was needed.

### Platform page reference redesign (2026-10-03)

Platform uses one new asset, `public/marketing/platform-street-map.png` (1402 × 1122), generated using the built-in tool from image 62 as visual guidance. It contains streets/parks/water only; all pins, metrics, labels, cards and device UI remain native. Existing generated portraits, shared logo/social icon paths, and footer background are reused. Exact prompt is recorded in `docs/platform-image-prompts.md`.

### Solutions page reference redesign (2026-10-03)

Source: `design-files/marketing-page-desgn/image 61.png`. Added `solutions-technician-marketplace.png` and `solutions-technician-payment.png` under the buyer portal public/marketing directory, generated with the built-in image tool and inspected. Exact prompts: `docs/solutions-image-prompts.md`. Reused platform street-map texture, generated portraits, server-rack proof photo, and brand assets. All overlaid content is native React UI.

### Industries page reference redesign (2026-10-03)

Industries image 60 asset set: `industries-rooftop.png`, `industries-technician.png`, eight `industries-{retail,restaurant,hospitality,office,warehouse,healthcare,property,chains}.png` photos, and transparent `industries-cta-route.png`, all under buyer-portal public/marketing. Built-in image generation used; exact prompts and saved paths in `docs/industries-image-prompts.md`. All inspected; brand/portraits/icons reused.

### Resources page reference redesign (2026-10-03)

Resources uses six generated photos under public/marketing: `resources-{technician,retail,reporting,checklist,team,hvac}.png`. Hero technician is reused for guide cards. Source image 59; saved paths and exact built-in generation prompts are in `docs/resources-image-prompts.md`. Generated photos were inspected; UI content remains native. Two static CSV files provide actual template downloads.

### Pricing page reference redesign (2026-10-03)

Pricing uses `public/marketing/pricing-customer.png` (1122 × 1402) and `pricing-route.png` (1536 × 1024 RGBA), generated with the built-in image tool and inspected. The route is 98.88% fully transparent. Existing technician portraits and footer background are reused. Exact prompts and saved paths: `docs/pricing-image-prompts.md`.
