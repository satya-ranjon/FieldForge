# Marketing hero detailed reference review

final result: passed

## Target and state

Primary target: the user's latest inline **1536 × 1024** design attachment in the
“actual design / small element fix / verify design” request. It has no local file
path exposed to this task. Earlier source for supplementary comparison:
`apps/web-buyer-portal/public/marketing/hero-reference-details.png` (988 × 659).
The latest image supersedes the earlier narrow, undersized implementation.

Route: `http://localhost:5173/marketing`, initial public landing state, menu closed.
Primary implementation screenshot:
`apps/web-buyer-portal/test-results/marketing-hero-marketing-hero-remains-complete-at-1536px-chromium/hero-1536.png`.
It is 1536 × 1024 pixels, CSS viewport 1536 × 1024, device scale factor 1.
No density normalization is needed for this test capture.

The in-app browser was also inspected; it retained the user's 90% browser zoom
(`devicePixelRatio` 0.9), so its scaled screenshot is not the pixel-measurement
artifact. The temporary viewport override is reset before handoff. No browser
console errors were observed during the inspection.

## Comparison history

- **P1: Undersized desktop composition.** The prior mixed rem/viewport formula
  placed the copy too far inward at the supplied width. Discrete rem sizes now
  reproduce the 94px left margin, larger display heading, and reference card grid.
- **P2: Simplified small imagery.** Replaced the generic profile symbol with a
  photographic avatar, line-only service icons with detailed independent camera,
  terminal, and monitor images, and plain crossing map lines with a separate map.
  Small service/profile assets are optimized by Next.js.
- **P2: Styling details.** Corrected green “Join” text, underline length/shape,
  lighter status labels, active-job row dividers, dark card color, customer-pill
  widths, supporting-copy spacing, and background route decoration.
- **P2: Photo framing.** Reframed a separate transparent cutout against the
  reference's cap, tablet, and van placement, keeping the CSS-colored canvas.
- **P2: Initial intermediate 1440px rail clipping.** The largest rem step started
  too early; moving it to 1500px restores full rail visibility at 1440 × 960.

Post-fix captures were reviewed at 1536px and across desktop/mobile widths. A
supplementary full-view comparison opened the original 988px source and rendered
988px implementation in the same tool output. The latest 1536px image was used
for measured positions and detailed inspection of heading, tracking card, job
cards, CTA, trust row, and metrics. Full-size screenshots make these regions
readable; the implementation values below are also asserted in browser tests.

## Required fidelity surfaces

- **Typography:** Heavy four-line display text; corrected size, tracking and line
  height; lighter small status labels; strong CTA and card titles. Body wrapping
  and label hierarchy follow the reference. Font antialiasing is browser-dependent.
- **Spacing/layout:** At 1536px: heading x94/y203, CTA y691, tracking x664/y175,
  security x1165/y226, POS x621/y409, signage x1206/y417, active jobs x643/y635,
  verified x1238/y718, metrics x635/y865. Browser assertions allow <5px drift.
  The hero and navbar align; the photo remains bounded on ultrawide displays.
- **Colors/tokens:** CSS mint canvas, lime accents, green emphasized heading,
  dark translucent-looking cards, green Scheduled/Assigned and red Urgent preview
  badges. Shared operational status styling remains unchanged.
- **Images:** Independent transparent photo, service illustrations, profile,
  underline, route motif, and map replace screenshot crops. Photo enlargement is
  bounded; small image variants are optimized. Existing native brand/metric
  vectors remain sharp. Asset prompts/provenance are in
  `apps/web-buyer-portal/public/marketing/hero-assets.md`.
- **Copy/content:** All supplied hero copy, names, locations, metrics, and existing
  CTA destinations remain intact. Tracking and platform numbers are illustrative.

## Validation

Ten Chromium E2E scenarios: eight widths (320, 390, 768, 988, 1440, 1536, 2020,
2560), existing secondary CTA navigation, and modeled page-zoom geometry at
80%, 100%, 125%, 200%, and 400%. Tests assert loaded independent assets, no
screenshot sprites, bounded image sizing, in-bounds card titles, aligned navbar,
mobile menu behavior, 44px primary mobile CTA, and measured reference positions.
Zoom is modeled through inverse CSS viewport width and density; this does not
claim automated control of the browser's native zoom menu.

`pnpm check` covers formatting, lint, types, and the existing 898 tests, with
unchanged suites replayed from their verified cache results. Full production build
and infrastructure configuration validation are run for this delivery. Screenshots
are review evidence, not a pixel-snapshot comparison assertion.

## Remaining P3 differences and scope

- Generated photo extraction and miniature illustrations are close recreations,
  not literal reference pixels; portrait details, map streets, and icon geometry
  differ slightly. Customer wordmarks use existing native treatments.
- The background remains a CSS color per the user's prior request, with a separate
  subtle route motif; reference texture and raster shading are not identical.
- Photographs can soften at extreme zoom/high density. The UI is independent of
  photograph resolution. Small optical/antialiasing differences remain.
- Browser regression execution is Chromium only. Existing lower-page mobile
  overflow in `CommandCenterPreview` is separately recorded in `docs/ISSUES.md`.

No remaining actionable P0/P1/P2 finding was identified in this final hero review.

## Platform assurance strip review — 2026-09-28

Source: the user's second attachment,
`/var/folders/n5/f8mxb1kd5w36t_z4cng9fhwm0000gn/T/codex-clipboard-e9f817d0-9edb-488a-b793-246d9c550e0d.png`
(2172 × 724). The comparison uses its central assurance band; the large empty
outer margins are not copied into the existing page.

The prior dotted workflow card is replaced with the reference's five two-line
assurances, lime/teal/lime/teal/lime circles, subtle vertical separators, pale
background, and paired orbital decorations. Text and icons remain native;
asset provenance is in `public/marketing/trust-strip-assets.md`. At 2172px the
rendered band is approximately 256px tall, with 80px circles and 25px labels. Below 1280px it
becomes two columns, and below 640px it becomes one column with horizontal dividers.

Visual inspection covered the reference, 2172px desktop, 1440px desktop, 1280px
desktop, and 390px mobile captures. A divider/text collision in the first 1280px
iteration was corrected with proportional circle/type sizing and an explicit
clearance assertion. The live in-app browser also shows the replacement section.
No actionable P0/P1/P2 issue remains within this section. Minor P3 differences
remain in the standard Lucide icon geometry and generated orbital curves; the
reference's subtle raster texture is represented by a solid CSS surface.

All 15 focused Chromium scenarios pass: five assurance layouts and ten existing
hero regressions. New assertions cover exact labels, the old card's removal,
visible in-bounds headings, desktop alignment, divider clearance, responsive
stacking, loaded accents, and alternating colors. These are layout assertions,
not pixel-diff assertions. Screenshots are saved under the matching test names in
`apps/web-buyer-portal/test-results/`, including `trust-strip-2172.png`,
`trust-strip-1440.png`, `trust-strip-1280.png`, `trust-strip-768.png`, and
`trust-strip-390.png`. Other page sections and their previously logged mobile
limitations are outside this replacement's scope.

Final gates passed: `pnpm check` (formatting, lint, type checking, and 898 existing
tests replayed from verified caches), `pnpm build --cache=local:r`,
`pnpm infra:config`, and `git diff --check`. The five new assurance scenarios and
ten hero scenarios were executed fresh in Chromium.

### Tailwind implementation follow-up

The assurance section now expresses its layout, dividers, responsive sizing,
colors, and orbital accents entirely through Tailwind utilities. The custom CSS
module is removed. The user's intervening transparent-background adjustment is
preserved. The existing five responsive scenarios are reused for verification.

Follow-up parity review: an isolated browser comparison reconstructed the CSS
module as it stood immediately before conversion (including its disabled section
background). The Tailwind and original-CSS versions produced identical section
PNG buffers at 390, 768, 1280, 1440, 2172, and 2560px in Chromium. Element bounds,
fonts, line heights, colors, opacity, and letter spacing also matched. All six
temporary comparison scenarios passed; no further appearance changes were made.

### Hero and compact-navbar Tailwind conversion

The existing hero and compact header were captured before conversion at 320, 390,
768, 988, 1440, 1536, 2020, and 2560px. Tailwind utility groups replaced the module
without changing JSX content, assets, or routes. Eight isolated comparison
scenarios confirmed identical PNG buffers for both the complete hero and header.
Measured bounds, font metrics, colors, spacing, and visibility matched as well;
nonvisual shadow-layer serialization and zero-width border serialization differ.
The comparison artifacts are saved in `/tmp/fieldforge-hero-before/`.

The only raw-CSS exception is the existing `@font-face` declaration, moved to the
global stylesheet because no Tailwind utility registers font files. The existing
hero browser suite now also asserts heading weight, accent color, urgent-badge
background, and CTA background at the reference desktop width.

Final conversion verification passed: 15 focused Chromium scenarios (hero,
trust strip, navigation, and zoom), `pnpm check`, `pnpm build --cache=local:r`,
`pnpm infra:config`, and `git diff --check`. Unchanged backend suites were replayed
from verified caches. The current browser preview was inspected after conversion.

### Trust-strip content alignment correction

The latest annotated reference (`codex-clipboard-12c124ee-2021-45c3-bb16-e54adcf26d0d.png`)
identifies mismatched horizontal alignment below the hero. The prior independent
82% viewport row is replaced by the hero's centered 86.4-unit content frame.
Desktop icon and label sizes now use the same rem scale, avoiding enlargement
beyond the content frame on wide screens. Dividers are centered between columns
and orbital accents follow the content container. Existing copy, palette,
background choice, and mobile/tablet stacking are retained. Styling uses Tailwind.

Seven responsive cases (390, 768, 1280, 1440, 1612, 2172, 2560px) assert row/frame
alignment, first-icon and last-label edges, divider clearance, label visibility,
asset loading, colors, and reflow. Desktop and mobile screenshots were inspected.

Laptop follow-up: the five-item row now starts at 1024px, retaining the shared
hero alignment and a minimum 14px label size. All nine responsive cases pass,
including 1023px (stacked) and 1024px (one row). The 1024px capture was inspected
for clipping, divider clearance, and readable labels.
