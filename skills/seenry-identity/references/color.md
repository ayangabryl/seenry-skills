# Color from an idea

How a well-designed palette is made: from one idea, through real material, to a lightness structure, ramps with a job per step, and roles that work in light and dark. Contrast and dark-mode values are also in [seenry-craft's color reference](../../seenry-craft/references/color.md).

## Contents

- What the best teams do
- Leave the first color
- Where color comes from
- Lightness before hue
- The shape of a palette
- Ramps with a job per step
- Studies on the canvas
- From palette to tokens
- Checks
- Weak palettes and their fixes
- Sources

## What the best teams do

| Practice | Who | What it means here |
| --- | --- | --- |
| Color is relative | Josef Albers, *Interaction of Color* | A color changes with its neighbors. Never judge a swatch alone; judge it on its ground, beside its ink, at its real size |
| Build in a perceptual space | Stripe rebuilt its palette in CIELAB; Evil Martians and Tailwind v4 moved to OKLCH | Equal steps in lightness look equal, so contrast stays consistent across hues. Write colors as `oklch()` |
| Few inputs, generated system | Linear generates every theme from a base color, an accent and a contrast value, in LCH | Decide a handful of colors; generate the steps between them instead of picking forty swatches |
| A job per step | Radix Colors: 12 steps per hue | Steps 1–2 backgrounds, 3–5 component fills, 6–8 borders, 9–10 solid fills, 11–12 text |
| Roles are tones of one seed | Material 3 tonal palettes (HCT) | A role is a lightness of a palette; a tone gap of 50 gives at least 4.5:1 contrast, 40 gives at least 3:1 |
| Tinted greys, more shades than you think | Refactoring UI | Greys lean toward the brand hue; 8–12 shades per hue; raise saturation near the light and dark ends so tints do not look washed out |
| Scarcity makes an accent | the 60-30-10 habit | The accent is rare, so it pulls the eye; used everywhere, it stops working |

## Leave the first color

The first color that comes to mind for a subject is everyone's first color: tram yellow for Lisbon, green for money, navy and amber for sleep, purple gradients for AI, blue at hue 250 for anything "trustworthy". Write it down as the cliché. Use it only if the idea demands it and you can say what makes your version yours: a specific yellow, from a specific object, in a specific role.

## Where color comes from

| Source | Example |
| --- | --- |
| The product's own material | The tile, paper stock, metal, food, or the screen the product shows |
| A place at a specific time | Not "Lisbon" but limestone at 7pm, the green of Alfama shutters, the river at night |
| An artifact of the field | Old enamel signs, a printing ink, a uniform, a ticket, a manual's cover |
| An era or movement | Swiss posters (one saturated color and black), 1970s transit maps, Risograph inks |
| The photograph you will actually use | Sample its shadows, highlights and one accent, then build around it |

Collect five to eight real images from the chosen source into `refs/` and sample them. Name each color after where it came from ("shutter green", "ticket buff"), never after its hue.

## Lightness before hue

Good palettes are good in grayscale first. Decide the value structure, then the hues:

1. Set the ground, ink and dominant as three clearly different lightness values (in OKLCH, about 0.15–0.25 apart at minimum; text on ground at least 0.5 apart).
2. Look at the study in grayscale (`filter: grayscale(1)` in DevTools, or squint). If the headline, the dominant field and the accent all collapse to one grey, the palette has no structure; change lightness, not hue.
3. Only then tune hue and chroma.

## The shape of a palette

A designed palette is not five equal swatches. It has proportions:

| Role | Share of the screen | Notes |
| --- | --- | --- |
| Ground | 60–80% | The page color; rarely pure white. Tint it toward the idea (paper, stone, a pale version of the dominant) |
| Ink | Text and lines | Rarely pure black; a deep color from the palette (blue-black, brown-black) |
| Dominant | One large field per screen, or one recurring block | Carries the identity; may be the ground itself |
| Accent | Under 5% | One color for one job (the action, the live thing, the price) and nowhere else |
| Neutrals | As needed | A ramp tinted toward the ground and ink, for borders, muted text and surfaces |

One surprise is allowed: a color that should not work with the rest and does, used once. More than one is noise.

## Ramps with a job per step

Generate each hue's scale instead of picking shades by eye:

```sh
node scripts/identity.mjs ramp --name shutter --color "#2f5a4c"
node scripts/identity.mjs ramp --name stone --color "#2f5a4c" --neutral
```

`ramp` prints twelve OKLCH steps for light and dark with the job of each step, the contrast of steps 11 and 12 on step 1, and which text color reads on the solid step. `--neutral` keeps the hue but drops the chroma, for tinted greys. Keep the exact source color as its own token if a logo needs it; step 9 may move a little so it works as a fill.

| Steps | Job |
| --- | --- |
| 1–2 | App and subtle backgrounds |
| 3–5 | Component background, hover, pressed or selected |
| 6–8 | Subtle border, component border, strong border and focus ring |
| 9–10 | Solid fill (the brand color) and its hover |
| 11–12 | Low-contrast and high-contrast text |

## Studies on the canvas

Before any page:

1. Three palettes from three different sources, each as a study with `identity.mjs study`: the swatches at their real proportions, the identity face set in ink on ground, the dominant as a large field with the headline, the accent on the one action, a real photograph, and a dense UI fragment (a price list, a button, secondary text).
2. Each with a designed dark set (`--dark-ground`, `--dark-ink`, `--dark-dominant`, `--dark-accent`), not an inversion.
3. Beside the default from the brief. A study that resembles the default is replaced.

## From palette to tokens

The chosen palette becomes `tokens.css`: the `ramp` output as primitives, then semantic roles (`--color-bg` = step 1 of the ground ramp, `--color-text` = step 12 of ink, `--color-text-secondary` = step 11, `--color-border` = step 6, `--color-accent` = accent step 9, `--color-on-accent` from `ramp`'s advice, `--color-surface`, states), then the dark set under `:root[data-theme="dark"]` from the dark half of each ramp.

## Checks

- `canvas.mjs verify 00-identity`: text and controls meet 4.5:1 (3:1 for large text and UI) in both modes.
- The grayscale test above passes.
- The accent appears for one job only.
- Photographs sit in the color world (graded or chosen to match); a photo with its own loud palette gets a neutral frame.
- Strip test: every screen in a row at thumbnail size reads as one product.

## Weak palettes and their fixes

| Weak | Fix |
| --- | --- |
| The subject's cliché color, used flat | A specific version from a real source, in a specific role |
| Warm off-white, near-black, one accent | Tint ground and ink toward the idea; give a dominant real area |
| Five colors at equal weight | Proportions: ground, ink, dominant, one accent |
| All colors at the same lightness | Fix the value structure first |
| Shades picked by eye, uneven steps | `ramp` in OKLCH |
| Greys that are pure grey | Neutral ramp tinted toward the brand hue |
| Gradient as identity | A flat field from a real source |
| Accent on everything | One job; the rest in ink |
| Pure black on pure white | Tinted ink and ground |
| Dark mode as inversion | A designed dark set |
| Each reference contributed one color | One source, one system |

## Sources

- Josef Albers, *Interaction of Color* (Yale, 1963); Fritz Horstman, *Interacting with Color* (Yale, 2024).
- Stripe, "Designing accessible color systems" (stripe.com/blog/accessible-color-systems).
- Linear, "How we redesigned the Linear UI" (linear.app/blog/how-we-redesigned-the-linear-ui).
- Radix Colors, "Understanding the scale" (radix-ui.com/colors/docs/palette-composition/understanding-the-scale).
- Material Design 3 color roles and material-color-utilities.
- Evil Martians, "OKLCH in CSS: why we moved from RGB and HSL" (evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl).
- Adam Wathan and Steve Schoger, *Refactoring UI*, "Building your color palette".
