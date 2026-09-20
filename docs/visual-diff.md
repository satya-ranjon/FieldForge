# Visual Diff: Reference vs Current Implementation

Viewport: 1440 x 1020, deviceScaleFactor 1.

Reference image is the supplied 5760 x 4080 image interpreted at 25% scale for the required 1440 x 1020 acceptance viewport.

## Page Container

REFERENCE: Main content uses an approximately 90px left margin and 90px right margin. The hero fills the canvas but keeps structural content inside that measured frame.

CURRENT: Header logo and hero copy begin at x=0 because the desktop container uses `xl:px-0` while the viewport is narrower than the 1680px max width.

REQUIRED CHANGE: Use a measured 1260px desktop frame centered in the 1440px viewport, or fixed 90px side margins, instead of a 1680px desktop frame.

## Navbar

REFERENCE: Logo mark x≈90 y≈23, wordmark x≈145, nav links centered from x≈330 to x≈730, search x≈1020, login x≈1070, join CTA x≈1175.

CURRENT: Logo starts at x=0, nav links start at x≈324, search and CTA are near the reference but the whole header composition is unbalanced because the left edge is wrong.

REQUIRED CHANGE: Re-anchor header content to the same 90px outer margin and reduce right CTA width if needed to preserve the reference spacing.

## Hero Geometry

REFERENCE: Eyebrow x≈90 y≈125, heading x≈90 y≈190, photo/mask x≈575 y≈130, stats panel x≈585 y≈795.

CURRENT: Eyebrow x=0 y≈164, heading x=0 y≈252, photo x≈660 y≈176, stats panel y≈1086. The entire hero copy is too low and too far left; visual is too far right and too low for the 1440 viewport.

REQUIRED CHANGE: Move hero copy to x≈90 and up by about 60px. Move visual left to x≈575 and up by about 45px. Bring the stats panel into the 1020px viewport.

## Typography

REFERENCE: Heading wraps as four lines: `Field service` / `without the` / `field-service` / `chaos.` with heavy weight and tight line-height. The text block is roughly 430px wide.

CURRENT: Line breaks are correct, but title block is too wide and starts at the wrong x/y coordinate.

REQUIRED CHANGE: Set the left column to about 470px at desktop and use measured heading font sizing rather than the prior 620px column.

## Text Wrapping

REFERENCE: The first paragraph wraps into two lines and starts below the title around y≈475. Supporting paragraph is roughly 460px wide.

CURRENT: Paragraph starts too low and spans too wide because the column is 620px.

REQUIRED CHANGE: Reduce body copy width to about 470px and move with the heading.

## Spacing

REFERENCE: CTA row appears around y≈635, feature indicators around y≈715, trusted logos around y≈845.

CURRENT: CTA row appears around y≈884 in the 1440 capture and the trusted logos are pushed below the desired visual rhythm.

REQUIRED CHANGE: Compress vertical spacing to match the reference viewport, after moving macro geometry.

## Image Bounds

REFERENCE: Hero image/mask begins x≈575 y≈130, extends to the right edge, and bottom is around y≈925 with the stats rail overlaid near the bottom.

CURRENT: Image begins x≈660 y≈176, extends past the right edge, and bottom is below the viewport at y≈1186.

REQUIRED CHANGE: Position image container around x≈575, y≈130, width≈865, height≈790 at 1440.

## Image Crop

REFERENCE: Technician face sits around x≈940 y≈270, van occupies the right side, tablet sits lower right.

CURRENT: Technician is too far right in the 1440 capture; parts of the subject and cards push off the viewport.

REQUIRED CHANGE: Use a right-biased crop but reduce container width/height to match the reference mask and keep subject visible.

## Decorative Shapes

REFERENCE: Large soft green blob wraps behind the photo with a curved top and right green circle; pale field lines appear on the left.

CURRENT: Green blob exists but is too high/wide relative to the shifted visual; field lines are present but anchored to viewport rather than measured content.

REQUIRED CHANGE: Re-anchor decorative green shapes to the corrected visual container.

## Card Dimensions

REFERENCE: White job cards are about 220-230px wide by 94px high; dark live card about 250px x 170px; active jobs card about 340px x 125px.

CURRENT: White job cards are 320px x 126px; dark live card 340px x 236px; active jobs card 452px x 166px. Cards are too large for 1440 viewport.

REQUIRED CHANGE: Scale card dimensions down to the reference viewport and tune typography/icon sizes accordingly.

## Card Coordinates

REFERENCE: Live tracking x≈610 y≈160; security card x≈1075 y≈215; POS card x≈575 y≈380; digital card x≈1130 y≈390; active jobs x≈595 y≈600; verified card x≈1140 y≈680.

CURRENT: Live x≈710 y≈214; security x≈1082 y≈282; POS x≈660 y≈524; digital partly offscreen x≈1155 y≈534; active x≈722 y≈796; verified x≈1148 y≈924.

REQUIRED CHANGE: Reposition all cards relative to a corrected visual origin and scale them down.

## Buttons

REFERENCE: CTA buttons x≈90 y≈635, primary width≈170 height≈50, secondary width≈180 height≈50.

CURRENT: CTA row x≈0 y≈884, primary width≈237 height≈68, secondary width≈250 height≈68.

REQUIRED CHANGE: Move CTA row up with hero content and scale buttons to the reference.

## Badges

REFERENCE: Eyebrow badge width≈265 height≈36.

CURRENT: Eyebrow badge width≈354 height≈48.

REQUIRED CHANGE: Scale badge down and position x≈90 y≈125.

## Trust Logos

REFERENCE: Logos appear x≈90 y≈865, five small pills about 80-90px wide.

CURRENT: Logos are partly below the meaningful viewport after vertical drift.

REQUIRED CHANGE: Move trust block up and reduce logo pill sizes slightly.

## Statistics Panel

REFERENCE: Stats rail x≈585 y≈795, width≈790 height≈90.

CURRENT: Stats rail x≈674 y≈1086, width≈816 height≈122 and mostly below the 1020 viewport.

REQUIRED CHANGE: Move stats rail up to y≈795, reduce height to ≈90, and keep width inside the 1440 frame.

## Shadows

REFERENCE: Soft, subtle shadows under cards; dark cards have moderate depth.

CURRENT: Shadows are acceptable but appear heavier because cards are oversized.

REQUIRED CHANGE: Re-evaluate after scaling card geometry.

## Borders

REFERENCE: White cards use very light borders and 14-16px radii.

CURRENT: Borders are close; radii are somewhat too large on oversized cards.

REQUIRED CHANGE: Reduce radii with card scaling.

## Colors

REFERENCE: Canvas `#fbfcf8`, lime accent, dark cards, and muted text are close.

CURRENT: Colors are broadly close.

REQUIRED CHANGE: Prioritize geometry first; minor color tuning later only if needed.

## Missing Elements

REFERENCE: Van branding and handwritten note are visible; image mask has a distinctive curved left side.

CURRENT: Van/photo branding exists in generated asset; handwritten note exists; mask exists but dimensions are wrong.

REQUIRED CHANGE: Correct mask geometry and acknowledge photo cannot be pixel-identical without the original source asset.

## Incorrect Elements

REFERENCE: No lower marketing section appears inside 1440 x 1020.

CURRENT: Current capture shows only hero, but several hero elements continue below the viewport due excessive height.

REQUIRED CHANGE: Keep hero content within the first viewport while preserving bottom whitespace.
