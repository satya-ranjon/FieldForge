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

### Lifecycle reference layout review (2026-09-29)

Source: `codex-clipboard-68fa4c13-5b68-40fb-8c51-d626401e84e3.png`.
Scope: the lifecycle section at the top of the reference.

The source and rendered 1024px and 390px captures were inspected together; the
1536px capture was also reviewed. The shared hero content frame is retained, so
comparison normalizes the lifecycle region rather than the entire screenshot.
The former full-width row is replaced by the reference composition: introduction
on the left, summaries above seven compact cards on the right, stacked numbers
and icons, inter-card arrows, and a soft lime Dispatch card with a bottom marker.
Native text, Tailwind colors, and vector icons stay sharp when enlarged.

Six Chromium cases cover 320, 390, 768, 1024, 1536, and 2172px, asserting stage
order, highlight, summary alignment, desktop row placement, mobile reflow, and
viewport containment. Captures are under the buyer portal `test-results/`
marketing-lifecycle directories. No new interactive controls or raster assets
are introduced. Minor icon geometry differs because existing Lucide icons are
used. No outstanding P0–P2 findings; final result: passed.

Verification: six focused Chromium cases, `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check` passed.
Unchanged backend tests used verified local caches; the browser preview emitted
no console errors during this review.

### Real-work reference follow-up (2026-09-29)

Target: `codex-clipboard-468c76db-5491-4ead-9430-8acb34c7a61f.png`.
The reference and existing `real-work-technician.png` asset were inspected.
Implementation removes the white nested wrapper, moves the heading and benefits
into a narrow desktop column, fills the remainder with existing artwork, replaces
clipped job text with a native sample card, and reduces the lifecycle gap.
Tailwind handles all layout changes. Six responsive cases were authored for
320–2172px, including the 1024px desktop breakpoint, but have not been executed.

Browser security policy rejected the request to access the local marketing
preview. No alternate browser route was attempted. The rendered comparison and
responsive verification are outstanding; final result: blocked.

Nonvisual verification passed: `pnpm check`, `pnpm build --cache=local:r`,
`pnpm infra:config`, and `git diff --check`. Backend suites used verified local
caches. Visual verification remains blocked as described above.

### Marketplace reference follow-up (2026-09-29)

Source: `codex-clipboard-ace7fbce-aa49-435f-a603-bbb1d956c7dc.png`.
The target places a three-line heading and compact benefits on the left, Marcus
in the center of a pale map panel, Priya on the left, Daniel above Alex on the
right, and the navigation strip beneath all cards. The implementation follows
these proportions with Tailwind and native card content. Existing portraits are
reused; `marketplace-map.png` is a generated 1536×1024 decorative background
which was inspected locally. Directory links replace previously inert controls.

Six browser cases were authored for 320–2172px. They assert card containment,
relative positioning, image loading, and directory links. They remain unrun: the
earlier local-preview browser security rejection remains in force. No alternate
browser access was attempted. Rendered visual comparison remains outstanding;
final result: blocked.

Marketplace nonvisual verification: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check` passed.
Existing backend tests replayed from verified caches. Six new browser cases
remain unrun; the visual gate is still blocked.

### Marketplace avatar replacement (2026-09-29)

All four generated portraits were inspected together: distinct faces, consistent
lighting, square framing, no text or baked-in status dots. Each is 1254 × 1254px.
The marketplace references the new `*-v2.png` assets with Next.js Image sizing;
card layout and online indicators are unchanged. Asset inspection passed. The
existing browser security block prevents verification of the rendered page.

### Smart dispatch reference follow-up (2026-09-29)

Source: `codex-clipboard-d50e9e9d-44b9-4581-a751-41b1d5f91992.png`.
The reference has a pale-green canvas, compact header, larger left map, dark
candidate list on the right, and four rounded feature pills below that list.
The implementation follows these proportions using Tailwind and existing tokens.
The original map is retained with an aspect-ratio crop to remove its outer pale
edge; existing portraits are retained. The existing orbit asset supplies a faint
corner accent, so its exact curves differ from the reference.

Six responsive cases were authored for 320–2172px, covering candidate count, best
match emphasis, the two-by-two pill grid, map loading, desktop alignment, and
mobile stacking. The earlier browser security rejection remains in force; no
alternate browser access was attempted. Tests and rendered comparison remain
outstanding; final result: blocked.

Smart-dispatch nonvisual verification passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
Unchanged backend suites used verified local caches. The six new responsive
browser cases remain unrun; visual acceptance is pending.

### Operations and payments reference follow-up (2026-09-29)

Source: `codex-clipboard-36ec00e1-6a11-4848-ba31-7dc40c0c5ba9.png`.
The requested target contains two adjacent sections. Field operations has a
centered heading, a light assignment phone, a large live map/site card, an
unboxed capability column, a completion phone with a floating notification,
and a separate four-item benefits strip. Payments has a left introduction,
four steps on the right, and three horizontal benefit cards below.

Implemented with native HTML, Tailwind, library icons, and existing map/photo
assets. Mobile layouts stack; the shared marketing scale controls desktop
proportions from 1024px. The outer canvas is a solid pale background, preserving
the preference for CSS background colors rather than a flattened section image.

Six browser cases were authored for 320–2172px with assertions for phone/list
content, desktop column placement, bottom alignment, payment emphasis, and
containment. They remain unrun because the earlier browser security rejection
prevents local-preview access. Rendered comparison is outstanding;
final result: blocked.

Operations/payment nonvisual checks passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
Existing backend test suites used verified local caches; the six newly authored
responsive browser cases remain unrun under the security block.

### Compliance reference follow-up (2026-09-29)

Source: `codex-clipboard-4d7a9091-fdef-4e59-8a16-7045337f0800.png`.
The target uses a profile card on the left and a heading above three separate
right-hand panels. Implemented the tall portrait, compact badge grid, title-case
panel headings, verification timeline, dates aligned beside work history,
icon-led reliability rows, and compact bottom trust row with Tailwind.
The broken portrait path is repaired using the previously inspected generated
Marcus asset, which differs from the reference photo and was generated for the earlier
avatar request. Existing orbit artwork supplies the faint decorative corner.

Six responsive cases were authored for 320–2172px, checking the portrait, links,
content counts, column placement, panel alignment, and containment. Browser
access remains blocked by the earlier security rejection; no alternate browser
route was attempted. Rendered comparison is pending; final result: blocked.

Compliance nonvisual verification passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
The replacement portrait exists at its referenced path. Existing backend test
suites used verified caches; the six browser cases remain unrun.

### Command center reference follow-up (2026-09-29)

Source: `codex-clipboard-e52d52af-2609-4c1b-b127-d144d76f6462.png`.
Implemented the pale mint backdrop, upper-corner labels, narrow KPI row, circular
icons, light dashboard frame, full-height dark sidebar, white header, two white
right-hand panels, and unified benefits bar with Tailwind. The existing map and
generated portraits are reused; these portraits differ from the reference.
Native text and vector icons remain sharp when enlarged.

Six responsive cases cover 320–2172px, including containment, map loading, content
counts, sidebar visibility, desktop column placement, and the single-row benefits.
They remain unrun because browser access was rejected by security policy. No
alternate browser path was attempted. Rendered comparison remains pending;
final result: blocked.

Command center nonvisual verification passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
The existing backend suites used verified local caches. The six new responsive
browser cases remain unrun; visual fidelity has not been confirmed in a browser.

### Audience and expertise reference follow-up (2026-09-29)

Source: `codex-clipboard-5758f672-2772-411b-82dc-e3074b5d35c5.png`. Implemented the shared pale-green canvas, adjacent copy and numbered steps within each audience card, compact section spacing, wide desktop heading, three-plus-four service grid, photo proportions, circular arrows, and understated white card footers. Existing seven photos were inspected and reused; the first three contain baked category labels, preserved with left-aligned crops. Smaller screens stack the cards. Six cases cover content, existing link destinations, image loading, desktop arrangement, spacing, and containment at 320–2172px. Browser capture remains blocked by the previous security rejection, and no alternate route was attempted. Rendered comparison is pending; final result: blocked.

Audience/expertise nonvisual checks passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
Existing backend suites used verified local caches. The six newly authored
browser cases remain unrun; rendered fidelity has not been verified.

### Reliability and closing banner follow-up (2026-09-29)

Source: `codex-clipboard-9b0e44ab-0f50-4e27-9d60-79a5906e0579.png`. Implemented the large centered reliability heading, circular icon cards, compact section gap, separate dark forest background, large three-line CTA, inset right dashboard, assurance badges, and handwritten note. Existing Texas map and generated portrait are reused. The generated forest follows the reference mood but is not the identical photograph. Six responsive cases cover 320–2172px, including content, destinations, asset loading, containment, spacing, and desktop columns. Browser capture remains blocked by the previous security rejection; no alternate route was attempted. Rendered comparison remains pending; final result: blocked.

Reliability/CTA nonvisual verification passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
Existing backend suites used verified local caches. The generated forest image
was inspected and saved in the public marketing directory. Six new browser
cases remain unrun, and rendered fidelity has not been confirmed.

### Footer reference follow-up (2026-09-29)

Source: `codex-clipboard-ec4fde38-13b2-4151-ad8e-26467b6232e2.png`. Implemented the dark background, compact desktop brand/four-column/newsletter arrangement, vertical dividers, lime headings, round social buttons, email field, app badges, and slim copyright/status/language bar. Decorative background is separately generated and differs slightly from the reference curves. The copyright uses the current year. Six responsive cases cover 320–2172px and form feedback. Browser capture remains blocked by the existing security rejection; no alternate route was attempted. Rendered comparison remains pending; final result: blocked.

Footer nonvisual checks passed: `pnpm check`, `pnpm build --cache=local:r`,
`pnpm infra:config`, and `git diff --check`. Existing backend suites used verified
local caches. The generated background was inspected and saved to the project.
Six responsive browser cases remain unrun; visual fidelity and browser form
behavior have not been verified under the existing security block.

### Expertise image replacement follow-up (2026-09-29)

Source: `codex-clipboard-e4a131bd-9cf6-477f-8bef-13b3dddc40f3.png`.
Generated and inspected seven separate replacements corresponding to every red
rectangle. The photographs share neutral/sage lighting and equipment subjects;
the enterprise illustration retains the map and three city status cards. These
are newly generated images rather than identical copies of the originals.
Source dimensions are 2022 × 778 for the upper row and 1774 × 887 for the lower.
The card layout stays unchanged, and every category pill is native text.
Existing responsive cases now assert all seven replacement paths and labels.
Browser capture remains blocked by the previous security rejection; no alternate
route was attempted. Rendered comparison remains pending; final result: blocked.

Expertise asset nonvisual verification passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
All seven versioned files exist at the referenced paths and their dimensions
were confirmed. Existing backend suites used verified local caches; the updated
browser cases remain unrun under the security block.

### Field Operations image replacement (2026-09-29)

Source: `codex-clipboard-a98d21ad-0caa-4430-a8e3-9ebd8a7b17e2.png`. Generated and visually inspected a sharp light technician map preserving the three names/statuses and network issue, a clean server-rack photo without a baked badge, and a fictional technician portrait. The assets are new interpretations, not identical copies of the reference. Map and avatar are 1254px square; the server photo is 1681 × 936. Only FieldOperationsSection references these new versioned paths; existing assets remain untouched. Smaller viewports contain the map to avoid clipping names, while desktop retains cover fitting. Existing six responsive cases now check the three replacements and single Live label. Browser capture remains blocked by the previous security rejection; no alternate route was attempted. Rendered comparison remains pending; final result: blocked.

Field Operations asset nonvisual checks passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
All three source images were inspected and their saved dimensions confirmed.
Existing backend suites used verified local caches. Updated browser cases remain
unrun under the security block; rendered fidelity has not been verified.

### Real Work separated assets follow-up (2026-09-29)

Sources: `codex-clipboard-da7ffddf-da3d-4a12-b1e4-14dbcb5fbffe.png` and `codex-clipboard-80a2eee3-44f4-4057-885e-c5a5a4e5a97f.png`. Replaced the combined illustration with a separate technician photograph, six individually generated service photos, native captions, native dispatch badge, and the existing native Active Jobs panel. The desktop service grid remains two columns and three rows; mobile elements stack without bitmap cropping. The new photos are interpretations of the references, and the decorative route arc is omitted. Dispatch badge is positioned over clear office space rather than the technician. Updated six responsive cases to verify all seven images, label counts, and desktop geometry. Browser capture remains blocked by the existing security rejection; no alternate route was attempted. Rendered comparison remains pending; final result: blocked.

Real Work separation nonvisual checks passed: `pnpm check`,
`pnpm build --cache=local:r`, `pnpm infra:config`, and `git diff --check`.
The technician image was refined to face right, keeping the tablet clear of the
jobs panel, and all seven saved image dimensions were checked. Existing backend
suites used verified local caches. The updated six browser cases remain unrun;
rendered fidelity has not been confirmed under the existing security block.

### Real Work reference alignment correction (2026-09-29)

Updated against `codex-clipboard-6a6c422d-96b0-4b2e-8213-67e5f303000e.png`: new close-framed technician background, feathered edges, dispatch badge above the tablet, separate SVG route, compact job rows with larger text, and service grid spacing. Existing six responsive cases now assert badge clearance and the route. Generated photo inspected directly; it is an interpretation, not a pixel-identical reproduction. Browser comparison remains blocked by the prior security-policy rejection; no workaround attempted. Final visual acceptance remains pending.

Alignment correction checks: `pnpm check` passed (formatting, lint, type checking,
and 15 cached test tasks), `pnpm build --cache=local:r` passed (12 tasks, buyer
portal rebuilt), and `git diff --check` passed. The six updated browser cases
remain unrun under the existing browser-security restriction.

### Command Center native demo map (2026-09-29)

Reference: `codex-clipboard-3fa73fa4-9023-40af-a8af-2efa133cb61c.png`. Replaced the map image with vector streets/water/land and native markers, technician popup, legend, weather, zoom/reset controls, and directory link. Preserved the surrounding dashboard. Five model tests passed; six existing responsive cases now assert absence of map images, selection, zoom limits, keyboard pan, and reset. Browser security still prevents execution and rendered comparison; final visual acceptance is pending.

Demo-map validation: five focused Node model tests passed with fresh execution;
`pnpm check` passed (formatting, lint, types, and 15 cached test tasks);
`pnpm build --cache=local:r` passed (12 tasks, buyer portal rebuilt);
`git diff --check` passed. Browser scenarios remain unrun, as noted above.

### Dispatch demo maps and portraits (2026-09-29)

Sources: `codex-clipboard-2ec5579f-5acb-4cc8-af13-1edaf8bd38bb.png` and `codex-clipboard-5fc85001-f50a-4e30-9433-5ae5b05a2282.png`. Replaced marked maps with vector geography, native incident panels, markers, distance chips, and functional zoom/reset/selection. Reused sharper generated portraits. Updated twelve responsive browser cases, unrun under the existing browser security restriction. Final visual acceptance remains pending.

Dispatch-map verification and push gate: the five focused map-state tests passed
with fresh execution. The buyer-portal production build passed (12 build tasks,
11 cached). Pre-push steps 1–5 passed in order: `pnpm format`,
`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` (15 cached
test tasks). Step 6, `pnpm test:e2e`, was not run: the existing browser security
rejection forbids preview access and alternate browser execution. The gate
therefore stops here; clean-typecheck and the final build/check sequence were
not run as pre-push gates. No push is permitted or attempted.
