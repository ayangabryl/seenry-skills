# The look

How to choose type, color and imagery once the structure is picked. Skip it when the project already has a brand or tokens: use those.

## Start from what the person has

A logo, a product, a photograph, a shopfront or a color they already use decides more than any preference here. Ask for it. Take the palette and the type voice from that material and from the references they picked on the board.

## Two treatments, one screen

Write the token file first. Then build the picked structure's first screen twice, in two treatments that differ in a way a person sees at once: light or dark ground, quiet or loud, grotesk or serif headline, photograph-led or type-led. Show both with `seenry-canvas` at stage `look`. Never show two treatments that differ only in accent hue.

## Type is chosen from evidence

Measured at 1440 wide in October 2026:

| Site | Family | Headline size / weight / tracking | Body |
| --- | --- | --- | --- |
| Linear | Inter Variable | 64 / 510 / -2.2% | 15 |
| Attio | Inter Display + Inter | 64 / 600 / -2% | 18 |
| Notion | Inter (custom) | 96 / 600 / -4.8% | 14 |
| Vercel | Geist | 64 / 400 / -6% | 24 |
| Stripe | Söhne | 48 / 300 / -2% | — |
| Ramp | Lausanne | 64 / 400 / 0 | 14 |
| Mercury | Arcadia | 49 / 480 / 0 | 16 |
| Monarch | Copernicus (serif) + Oracle | 48 / 350 / -6.7% | 16 |

The pattern is one family for headline and body, a headline of 48 to 72px at weight 300 to 600, and tight tracking at display size. A serif headline appears where the brand is editorial or calm, set light and tight.

- Measure the references the person picked: `node scripts/type_probe.mjs <url> <url>`.
- Default to one family. Add a second only for a distinct voice, such as an editorial serif headline or a mono for real data.
- A face tuned well beats a more unusual face left at its defaults. Inter at weight 700 and default tracking reads as a template; Inter Display at 56px, weight 500 and -2.5% does not.
- Use a free face and never claim a licensed one. Fonts and sources are in `seenry-assets`.

| Voice | Free faces |
| --- | --- |
| Refined grotesk | Inter and Inter Display, Geist, Switzer, General Sans, Satoshi, Instrument Sans |
| Warm grotesk | Figtree, Hanken Grotesk, Albert Sans, Manrope |
| Calm serif headline over a grotesk body | Newsreader, Source Serif 4, Libre Caslon Display, Literata |
| Mono for data | Geist Mono, JetBrains Mono, IBM Plex Mono |

## Color has an origin

Take the hue from something true about the product: its material, its place, its logo, its photographs. Name that origin in the report. A palette with no origin is the default palette.

- Build it with `python3 scripts/palette.py "<hex>"`, which makes the ramps in OKLCH and measures every pair.
- Neutrals share one hue and carry most of the page. Roles and contrast values are in `seenry-craft`.
- A committed color is used at full strength on one field or one element. A page of pale tinted panels reads as cheap.
- Dark is its own palette, never the light one inverted.

## Imagery is one decision for the whole page

Choose once: the real product on a stage, photographs in one light and one style, or type alone. Then hold it on every section.

- Software shows its real interface with specific data, at real size.
- A place, food, a person or an object is shown in photographs. Ask for the owner's own. Generated or stock stand-ins are listed under "Assumed" in the report.
- At most one photograph of people per page unless they are the owner's real photographs.
- Text on an image sits on a calm area or a scrim taken from the image's own dark tone, and measures 4.5:1 across the whole image.
- With no image that is good enough, go type-led. See [imagery](imagery.md) and `seenry-assets`.
