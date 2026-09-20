# FieldForge Marketing Asset Plan

## Assets

| Asset                                                                       | Represents                            | Source                                                                                     | Intended Use           | Dimensions / Crop                                               | Notes                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web-buyer-portal/public/marketing/fieldforge-technician-van-hero.png` | Right-side hero technician/van scene  | User-supplied raster asset from `codex-clipboard-819f6146-b521-466c-9d50-fcb9de9025d7.png` | Hero visual photo only | 1536 x 1024, rendered through the measured right-side hero mask | Contains no floating UI cards or statistics. Includes the FieldForge-branded cap, shirt, van, and green background form requested for the hero right side. |
| Logo mark                                                                   | Brand app icon                        | JSX/Tailwind                                                                               | Header                 | 56 x 56 CSS px                                                  | Lime rounded square with white FieldForge-style mark.                                                                                                      |
| Navigation/action icons                                                     | Search, arrows, play, checks          | `lucide-react` plus JSX                                                                    | Header, buttons, cards | 16-32 CSS px                                                    | Uses the existing app icon library.                                                                                                                        |
| Floating work-order cards                                                   | Dispatch/status UI                    | JSX/Tailwind                                                                               | Hero visual overlays   | 280-452 CSS px wide                                             | Text remains editable and accessible.                                                                                                                      |
| Decorative background field lines                                           | Subtle operational motion/field motif | Inline SVG                                                                                 | Hero background        | Full hero                                                       | Pale green strokes behind content.                                                                                                                         |
| Curved handwritten arrow                                                    | Annotation near hero visual           | Inline SVG + text                                                                          | Hero visual overlay    | 76 x 86 CSS px arrow                                            | Text is editable; uses a cursive fallback stack.                                                                                                           |
| Trust logo pills                                                            | Customer trust bar                    | JSX/Tailwind text approximations                                                           | Lower-left hero        | 108 x 48 CSS px each                                            | No external brand assets were available in the repo.                                                                                                       |

## Hero Asset Specification

`fieldforge-technician-van-hero.png`

Requirements:

- realistic professional field service technician;
- black polo shirt and black cap;
- rugged tablet in hand;
- white service van behind the subject on the right;
- outdoor commercial campus with trees and natural daylight;
- wide hero crop with calm negative space for overlay cards;
- no floating UI cards;
- no dashboard overlays;
- no readable interface text outside of photographic FieldForge-style brand marks;
- no labels or statistics baked into the image.

## Assumptions

- The screenshot is a desktop reference only; tablet and mobile behavior are inferred.
- The exact brand/customer logo art was not present in the repository, so the hero reconstructs these as text pills.
- The active hero photo now comes from the user-supplied image attachment. Interface overlays remain controlled by React components.
