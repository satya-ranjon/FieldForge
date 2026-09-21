# FieldForge Landing Page — Reference Analysis

Source Reference: `design-files/marketing-page-desgn/1442.png`

## 1. Global Viewport & Layout Geometry

- **Reference Image Dimensions**: 4938px × 32768px (native high-resolution 3.4244x export)
- **Target Browser Viewport**: 1442px width × ~9569px height (1x scale)
- **Page Container Max Width**: `1360px` to `1380px` (centered with `mx-auto`)
- **Horizontal Page Padding**: `px-6 sm:px-8 lg:px-12` (approx 36px–48px gutter)
- **Base Canvas Background**: `#FAFCF8` (subtle off-white with warm light-mint hue)
- **Secondary Canvas Fill**: `#F2F7F0` / `#EAF3E7` (soft mint background panels)
- **Dark Surface Background**: `#0A1612` / `#0D1C17` / `#06120E` (tactical command center & footer)

---

## 2. Color Palette & Design Tokens

### Primary & Accent Colors

- **Brand Green Accent (Buttons/Pills/Highlights)**: `#A3E635` / `#9BEB4A` / `#A8F22D`
- **Brand Green Text**: `#22C55E` / `#16A34A` / `#2E7D32`
- **Brand Green Muted Background**: `#EAF7E2` / `#E2F4D8` / `#F0FDF4`
- **Brand Green Border**: `#D2ECC4` / `#BBF7D0`
- **Dark Action Fill**: `#0F1A15` / `#12211B` / `#162821`
- **Deep Navy/Black Text**: `#09130F` / `#0F172A` / `#111827`
- **Muted Body Text**: `#4B5563` / `#64748B` / `#6B7280`
- **Card Surface (White)**: `#FFFFFF`
- **Card Border**: `#E5E7EB` / `#E2E8F0` / `#E3EDE0`

### Status Pill Colors

- **Urgent / Red**: Text `#DC2626`, Background `#FEE2E2`, Border `#FECACA`
- **Scheduled / Blue**: Text `#2563EB`, Background `#DBEAFE`, Border `#BFDBFE`
- **In Progress / Blue**: Text `#0284C7`, Background `#E0F2FE`, Border `#BAE6FD`
- **Assigned / Green**: Text `#16A34A`, Background `#DCFCE7`, Border `#BBF7D0`
- **On Site / Active Green**: Text `#15803D`, Background `#EAF7E2`, Border `#D2ECC4`
- **On Hold / Amber**: Text `#D97706`, Background `#FEF3C7`, Border `#FDE68A`

---

## 3. Typography Hierarchy

- **Font Family**: Inter, Plus Jakarta Sans, system-ui sans-serif
- **Handwritten / Script Accent**: Caveat / Kalam / cursive handwriting ("Real-time visibility. Better results.", "Field work. Built better.", "Real work. Real progress.")
- **Hero Title**: `text-5xl sm:text-6xl lg:text-[64px] font-black tracking-tight leading-[1.08]` (Black weight, tightly kerned)
- **Section Titles**: `text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.15]`
- **Section Subtitles**: `text-base sm:text-lg text-[#4B5563] leading-relaxed font-normal`
- **Card Titles**: `text-sm sm:text-base font-bold text-[#09130F]`
- **Pills / Tags**: `text-[11px] font-bold tracking-wider uppercase`
- **Button Text**: `text-sm font-bold tracking-tight`
- **Numbers / Metrics**: `font-extrabold text-2xl lg:text-3xl tracking-tight font-sans`

---

## 4. Visual Element Classification & Breakdown

| Element / Component                       | Implementation Strategy | Approx Position (1x)  | Dimensions (1x)      | Visual Characteristics & Notes                                                                                                              |
| :---------------------------------------- | :---------------------- | :-------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Top Navbar**                            | JSX + Tailwind          | y: 0 – 80px           | w: 100%, h: 80px     | Transparent/glass sticky bar, logo left, nav links center, Log in + "Join as Technician" CTA right                                          |
| **Hero Tag Badge**                        | JSX + Tailwind          | y: ~110px, x: ~48px   | w: ~260px, h: 32px   | White pill with green dot "• FIELD SERVICE OPERATIONS PLATFORM"                                                                             |
| **Hero Headline**                         | JSX + Tailwind          | y: ~155px, x: ~48px   | w: ~560px, 4 lines   | "Field service / without the (green + brush underline) / field-service / chaos."                                                            |
| **Hero Subtitle**                         | JSX + Tailwind          | y: ~370px, x: ~48px   | w: ~500px            | Two short paragraphs describing unified workflow                                                                                            |
| **Hero CTA Buttons**                      | JSX + Tailwind          | y: ~480px, x: ~48px   | w: ~380px, h: 48px   | Bright lime pill "Get Started ->" + White pill "Watch Demo" with play circle                                                                |
| **Hero Checkmarks**                       | JSX + Tailwind          | y: ~550px, x: ~48px   | w: ~520px            | 3 items with circular green checkmark icons                                                                                                 |
| **Social Proof Logos**                    | JSX + Tailwind + SVG    | y: ~630px, x: ~48px   | w: ~500px            | "Trusted by modern businesses" + 5 white rounded pill badges (Cisco, Walmart, CBRE, Siemens, Verizon)                                       |
| **Hero Technician Scene**                 | Photographic Asset      | y: ~120px, x: ~680px  | w: ~660px, h: ~640px | High-res photo of technician in black FieldForge polo + cap with tablet, service van background                                             |
| **Hero Organic Mint Blob**                | SVG / CSS Gradient      | behind hero photo     | w: ~700px, h: ~650px | Soft mint radial gradient `#E3F7D5` behind technician image                                                                                 |
| **Handwritten Hero Arrow**                | SVG + Handwriting Font  | y: ~85px, x: ~1200px  | w: ~160px            | "Real-time visibility. Better results." in green cursive with curved arrow                                                                  |
| **Floating Card 1 (Live Tracking)**       | JSX + Tailwind          | y: ~140px, x: ~620px  | w: ~240px, h: ~140px | Dark card `#13221C`, Alex M. avatar, route path with car marker and pin                                                                     |
| **Floating Card 2 (Security Camera)**     | JSX + Tailwind          | y: ~180px, x: ~1050px | w: ~220px, h: ~85px  | White card, Security Camera Install, Scheduled badge                                                                                        |
| **Floating Card 3 (POS Terminal)**        | JSX + Tailwind          | y: ~320px, x: ~580px  | w: ~220px, h: ~80px  | White card, POS Terminal Offline, Urgent badge                                                                                              |
| **Floating Card 4 (Digital Signage)**     | JSX + Tailwind          | y: ~320px, x: ~1080px | w: ~220px, h: ~80px  | White card, Digital Signage Repair, Assigned badge                                                                                          |
| **Floating Card 5 (Active Service Jobs)** | JSX + Tailwind          | y: ~510px, x: ~600px  | w: ~320px, h: ~100px | Dark card `#13221C`, 4 metrics (2 In Progress, 1 Scheduled, 1 On Hold, 4 This Week)                                                         |
| **Floating Card 6 (Verified Tech)**       | JSX + Tailwind          | y: ~580px, x: ~1100px | w: ~200px, h: ~70px  | White pill card with green shield checkmark                                                                                                 |
| **Right Edge Van Ribbon**                 | JSX + Tailwind          | y: ~320px, x: ~1380px | w: ~32px, h: ~200px  | Dark vertical pill with uppercase rotated text                                                                                              |
| **Bottom Hero Stats Bar**                 | JSX + Tailwind          | y: ~710px, x: ~48px   | w: 100%, h: ~90px    | White card with 4 columns: 10K+ Techs, 50K+ Monthly, 99.9% Uptime, 4.8/5 Rating                                                             |
| **5-Step How It Works Banner**            | JSX + Tailwind + SVG    | y: ~860px             | w: 100%, h: ~220px   | Mint card with organic wavy dashed line connecting 5 circular step nodes (01–05)                                                            |
| **Lifecycle Pipeline Section**            | JSX + Tailwind          | y: ~1140px            | w: 100%              | 2 metric cards top right (07 active stages, 1 operational thread), 7 horizontal stage cards (01 Create to 07 Pay, 03 Dispatch active green) |
| **Real Work, All Industries**             | JSX + Tailwind + Assets | y: ~1560px            | w: 100%              | Left copy + 3 value bullets, center floating Active Jobs list, right 6 photographic industry tiles                                          |
| **Technician Marketplace**                | JSX + Tailwind + Assets | y: ~2250px            | w: 100%              | Left copy + CTA, top filter bar (Location, Skill, Cert, etc.), center Marcus Lee featured card + 3 secondary tech cards                     |
| **Smart Dispatch Map**                    | JSX + Tailwind + Asset  | y: ~3050px            | w: 100%              | Tactical SF dark map with 4 blips and emergency alert, right candidate cards (Alex Morgan Best Match)                                       |
| **Field Operations / Proof**              | JSX + Tailwind + Assets | y: ~3850px            | w: 100%              | Mobile app mock left, central live map + site visit card, proof deliverable icons, completed job phone right                                |
| **Secure Payments**                       | JSX + Tailwind          | y: ~4700px            | w: 100%              | 4-step horizontal card flow (You Get Paid in green), 3 benefit cards below                                                                  |
| **Compliance & Trust**                    | JSX + Tailwind + Assets | y: ~5350px            | w: 100%              | Marcus Lee profile card left, compliance verification table middle, fit metrics right                                                       |
| **Command Center Preview**                | JSX + Tailwind + Asset  | y: ~6150px            | w: 100%              | 4 top KPI cards, large tablet dashboard showing live New York operations map, alerts, nearby technicians                                    |
| **Two-Sided Audience Section**            | JSX + Tailwind          | y: ~7050px            | w: 100%              | Two split white cards: "For Businesses" (4 steps + Get Started) vs "For Technicians" (4 steps + Join as Tech)                               |
| **Expertise Grid (7 Service Cards)**      | JSX + Tailwind + Assets | y: ~7600px            | w: 100%              | 3 cards row 1 (Networking, Cabling, POS) + 4 cards row 2 (Security, Hardware, AV, Enterprise Locations)                                     |
| **Enterprise Reliability**                | JSX + Tailwind          | y: ~8300px            | w: 100%              | 4 feature cards: Reliable Notifications, Operational Traceability, Consistent Financial Records, Platform Monitoring                        |
| **Dark Bottom Hero Banner**               | JSX + Tailwind + Asset  | y: ~8750px            | w: 100%              | Dark green container `#0B1A15`, left CTA copy & buttons, right Texas command center tablet mockup                                           |
| **Footer**                                | JSX + Tailwind          | y: ~9250px – 9569px   | w: 100%              | Dark theme footer `#06120E`, links, social icons, newsletter input with green button, app store buttons                                     |

---

## 5. Architectural & Implementation Invariants

1. **No Baked UI Text in Images**: All cards, badges, statistics, labels, headers, descriptions, and buttons are implemented purely in JSX and styled with Tailwind CSS.
2. **Containerized Positioning**: Floating badges and overlay cards in the Hero, Dispatch, and Operations sections are anchored to their relative section container using percentage or rem offsets.
3. **Exact Pixel Ratio**: Slices from `1442.png` are extracted at native high-resolution and downscaled cleanly via standard `<Image />` or CSS background properties to preserve crisp retina rendering.
4. **Responsive Strategy**: On wide viewports ($> 1280px$), the layout matches the exact 1442px desktop geometry. On mobile and tablet ($< 1024px$), layout wraps gracefully into stacked single-column sections without breaking card internal structures.
