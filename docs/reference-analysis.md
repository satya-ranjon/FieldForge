# FieldForge Marketing Reference Analysis

Reference image: `codex-clipboard-9996935c-ee0a-48f5-878e-c4c8b8adf63d.png`

Screenshot size: 5760 x 4080 PNG. The design appears to represent a high-density desktop marketing viewport at roughly 3x capture scale, with a target CSS viewport near 1920 x 1360.

| Element                  | Implementation     | Approx Position                 | Approx Size             | Notes                                                                                         |
| ------------------------ | ------------------ | ------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| Page canvas              | JSX/Tailwind       | x=0, y=0                        | Full viewport           | Warm off-white `#fbfcf8`, with faint mint field-line SVG decoration.                          |
| Header                   | JSX/Tailwind       | x=360, y=80 at screenshot scale | h≈190                   | Wide max-width layout, no visible hard divider, large logo left, nav centered, actions right. |
| Logo mark                | JSX/Tailwind       | x≈360, y≈90                     | 168 x 168 screenshot px | Lime rounded square with white FieldForge-style mark and bold wordmark.                       |
| Navigation               | JSX/Tailwind       | x≈1320, y≈175                   | w≈1760                  | Platform, Solutions, Industries, Resources, Pricing with dark text.                           |
| Search action            | JSX/Tailwind icon  | x≈4100, y≈150                   | 80 x 80                 | Lucide search icon, heavy stroke, circular hit area.                                          |
| Login button             | JSX/Tailwind       | x≈4280, y≈80                    | 330 x 190               | Rounded white/off-white pill with subtle border.                                              |
| Join CTA                 | JSX/Tailwind       | x≈4660, y≈80                    | 720 x 190               | Dark rounded pill, green word and arrow.                                                      |
| Eyebrow pill             | JSX/Tailwind       | x≈360, y≈500                    | 1060 x 140              | White rounded badge with green dot and uppercase label.                                       |
| Hero title               | JSX/Tailwind       | x≈360, y≈760                    | w≈1610, h≈1030          | Four-line, very heavy Inter-style type; green highlighted second line with hand underline.    |
| Primary body copy        | JSX/Tailwind       | x≈360, y≈1910                   | w≈1840                  | Two paragraphs; first darker and heavier, second muted gray-blue.                             |
| CTA buttons              | JSX/Tailwind       | x≈360, y≈2570                   | h≈205                   | Lime primary and white video button with black play icon.                                     |
| Feature checks           | JSX/Tailwind       | x≈360, y≈2910                   | w≈1780                  | Three horizontal benefit chips with green circular check marks.                               |
| Trust logos              | JSX/Tailwind       | x≈360, y≈3360                   | w≈1810                  | Text-based pill logo approximations for Cisco, Walmart, CBRE, Siemens, Verizon.               |
| Hero photo scene         | Raster asset       | x≈2320, y≈520                   | w≈3400, h≈3170          | Technician and white van are a clean generated asset; UI overlays are not baked into image.   |
| Green background blob    | CSS shape          | x≈2280, y≈360                   | w≈2600, h≈2400          | Soft mint blob behind and around hero photo.                                                  |
| Live tracking card       | JSX/Tailwind       | x≈2480, y≈650                   | 1000 x 700              | Dark glass card with title, mini map grid, avatar, route line, car and pin markers.           |
| Service job cards        | JSX/Tailwind       | x≈2320-5320, y≈850-1940         | 890 x 380 each          | Three white floating cards with icon, title, status pill, location, arrow.                    |
| Active jobs card         | JSX/Tailwind       | x≈2400, y≈2370                  | 1340 x 500              | Dark stats card with four job state counts and vertical dividers.                             |
| Verified technician card | JSX/Tailwind       | x≈4620, y≈2730                  | 830 x 330               | White card with large green check and verification copy.                                      |
| Handwritten note         | JSX/Tailwind + SVG | x≈4860, y≈460                   | 660 x 280               | Cursive-style text and curved green arrow.                                                    |
| Stats rail               | JSX/Tailwind       | x≈2380, y≈3220                  | 3100 x 370              | White floating rail with four metrics, circular icons, and dividers.                          |

Typography assumption: the reference closely matches Inter or a similar geometric SaaS font. The app already declares Inter as the primary sans family, so the implementation uses the existing project font stack.

Primary colors sampled visually: page `#fbfcf8`, ink `#07121b`, brand lime `#86ef33`, muted text `#5a6874`, dark cards `#102126`, green highlight `#5aa12e`.
