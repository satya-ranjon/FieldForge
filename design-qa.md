# Design QA

Source reference: `/var/folders/n5/f8mxb1kd5w36t_z4cng9fhwm0000gn/T/codex-clipboard-9996935c-ee0a-48f5-878e-c4c8b8adf63d.png`

Prototype URL: `http://localhost:5173/marketing`

Viewport checked: 1440 x 1020 desktop, deviceScaleFactor 1, browser zoom 100%.

## Result

final result: passed

## Notes

- Generated `tmp/reference.png`, `tmp/current.png`, `tmp/overlay.png`, and `tmp/diff.png` for the required 1440 x 1020 comparison loop.
- Pass 1 corrected macro geometry: 90px page frame, heading x/y, image bounds, and first-viewport hero height.
- Pass 2 corrected typography rhythm, card scale, card coordinates, CTA sizing, stats rail placement, and trust logo sizing.
- Pass 3 corrected logo scale, generated photo crop, and trust row vertical position.
- The right-side hero photograph now uses the user-supplied image `codex-clipboard-819f6146-b521-466c-9d50-fcb9de9025d7.png` copied into the app asset path. HTML overlays remain separate React/Tailwind components.
