# FieldForge Landing Page — Asset Plan

Source Reference: `design-files/marketing-page-desgn/1442.png`

## 1. Asset Strategy & Principles

In accordance with the **Critical Image vs Code Rule**:

- **JSX + Tailwind CSS**: All layout structures, navigation bars, cards, headings, descriptions, buttons, tags, status pills, numbers, form controls, borders, shadows, and interactive widgets are built strictly in code.
- **SVG / CSS Decorative Assets**: Organic gradient backdrops, wavy connector lines, dashed arrows, status icons, step badges, and brand logos.
- **Raster / Photographic Assets**: Only realistic photographic scenes (technicians, server hardware, cabling, POS devices, security cameras, customer avatars, and tactical map backgrounds). No UI text is baked into these photographic assets.

---

## 2. Inventory of Photographic & Raster Assets

| Asset Name                   | Target File Path                               | Dimensions (1x) | Source / Extraction Method                           | Crop & Aspect Ratio                                                           | Transparency                       | Usage Location                                    |
| :--------------------------- | :--------------------------------------------- | :-------------- | :--------------------------------------------------- | :---------------------------------------------------------------------------- | :--------------------------------- | :------------------------------------------------ |
| `hero-technician.png`        | `/public/marketing/hero-technician.png`        | 660 × 640px     | Extracted at native 3.42x resolution from `1442.png` | Aspect ~1:1, rounded corners, shows technician holding tablet in front of van | False (has background environment) | Right side of Hero section                        |
| `real-work-bg.png`           | `/public/marketing/real-work-bg.png`           | 740 × 360px     | Extracted from `1442.png` section 3                  | Landscape ~2:1, technician in facility                                        | False                              | Background of "Real Work, All Industries" section |
| `service-networking.png`     | `/public/marketing/service-networking.png`     | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, enterprise switches with green cables                                   | False                              | Expertise grid: Networking card                   |
| `service-cabling.png`        | `/public/marketing/service-cabling.png`        | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, blue combed patch cables in tray                                        | False                              | Expertise grid: Structured Cabling card           |
| `service-pos.png`            | `/public/marketing/service-pos.png`            | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, touchscreen POS terminal with scanner                                   | False                              | Expertise grid: Point of Sale card                |
| `service-security.png`       | `/public/marketing/service-security.png`       | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, ceiling mounted dome and bullet cameras                                 | False                              | Expertise grid: Security & Surveillance card      |
| `service-hardware.png`       | `/public/marketing/service-hardware.png`       | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, laptop with internal circuit board repair                               | False                              | Expertise grid: Computer Hardware card            |
| `service-av.png`             | `/public/marketing/service-av.png`             | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, wall digital signage display                                            | False                              | Expertise grid: AV & Digital Signage card         |
| `service-enterprise-map.png` | `/public/marketing/service-enterprise-map.png` | 380 × 220px     | Extracted from `1442.png` section 9                  | 16:9, US map with New York, Chicago, Dallas pins                              | False                              | Expertise grid: Enterprise Locations card         |
| `map-smart-dispatch.png`     | `/public/marketing/map-smart-dispatch.png`     | 640 × 440px     | Extracted from `1442.png` section 4                  | ~1.45:1, dark satellite map of San Francisco                                  | False                              | Smart Dispatch section map                        |
| `map-field-operations.png`   | `/public/marketing/map-field-operations.png`   | 420 × 360px     | Extracted from `1442.png` section 5                  | ~1.15:1, light street map with technician routes                              | False                              | Field Operations live tracking panel              |
| `photo-server-rack.png`      | `/public/marketing/photo-server-rack.png`      | 180 × 120px     | Extracted from `1442.png` section 5                  | ~1.5:1, data center server rack with green LEDs                               | False                              | Field Operations site visit thumbnail             |
| `map-command-center.png`     | `/public/marketing/map-command-center.png`     | 620 × 400px     | Extracted from `1442.png` section 8                  | ~1.55:1, tactical dark map of NYC / Brooklyn                                  | False                              | Command Center preview map                        |
| `map-texas-command.png`      | `/public/marketing/map-texas-command.png`      | 440 × 360px     | Extracted from `1442.png` section 10                 | ~1.2:1, dark map of Texas with Austin, Houston, etc.                          | False                              | Dark bottom CTA banner tablet mockup              |
| `avatar-alex-morgan.png`     | `/public/marketing/avatars/alex-morgan.png`    | 120 × 120px     | Extracted from `1442.png`                            | 1:1 circular portrait                                                         | False                              | Hero tracking card, Smart dispatch candidate      |
| `avatar-marcus-lee.png`      | `/public/marketing/avatars/marcus-lee.png`     | 160 × 160px     | Extracted from `1442.png`                            | 1:1 circular portrait (smiling with cap)                                      | False                              | Technician marketplace, Compliance section        |
| `avatar-priya-shah.png`      | `/public/marketing/avatars/priya-shah.png`     | 120 × 120px     | Extracted from `1442.png`                            | 1:1 circular portrait                                                         | False                              | Technician marketplace, Field operations          |
| `avatar-daniel-carter.png`   | `/public/marketing/avatars/daniel-carter.png`  | 120 × 120px     | Extracted from `1442.png`                            | 1:1 circular portrait                                                         | False                              | Technician marketplace                            |
| `avatar-alex-rivera.png`     | `/public/marketing/avatars/alex-rivera.png`    | 120 × 120px     | Extracted from `1442.png`                            | 1:1 circular portrait                                                         | False                              | Technician marketplace                            |

---

## 3. Extraction & Optimization Pipeline

1. **Extraction Source**: The original uncompressed `design-files/marketing-page-desgn/1442.png` (4938 × 32768px).
2. **Tooling**: Node.js script using `sharp` to perform pixel-precise coordinate bounding box crops.
3. **Target Destination**: `apps/web-buyer-portal/public/marketing/` and `apps/web-buyer-portal/public/marketing/avatars/`.
4. **Resolution**: Stored at 2x retina density for crisp high-DPI display rendering.
