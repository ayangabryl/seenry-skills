# Color from an idea

How studios arrive at a palette: from one idea about the product, through real material, to a system of roles that works in light and dark. Exact contrast, ramp and dark-mode values are in [seenry-craft's color reference](../../seenry-craft/references/color.md); this file is about choosing.

## Contents

- Leave the first color
- Where color comes from
- The shape of a palette
- Studies on the canvas
- From palette to tokens
- Checks
- Weak palettes and their fixes

## Leave the first color

The first color that comes to mind for a subject is everyone's first color: tram yellow for Lisbon, green for money, navy and amber for sleep, purple gradients for AI. Write it down as the cliché, then use it only if the idea demands it and you can say what makes your version of it yours (a specific yellow, from a specific object, used in a specific way).

## Where color comes from

Studios take color from something real, then adjust it:

| Source | Example |
| --- | --- |
| The product's own material | The tile, the paper stock, the metal, the food, the screen the product shows |
| A place, at a specific time | Not "Lisbon" but the limestone at 7pm, the green of shutters in Alfama, the blue-black of the river at night |
| An artifact of the field | Old signage enamel, a printing ink, a uniform, a ticket, a manual's cover |
| An era or movement | Swiss posters (one saturated color and black), 1970s transit maps, Risograph inks |
| A photograph you will actually use | Sample the key image's shadows, highlights and one accent, then build around it |

Collect five to eight real images from the chosen source onto the canvas and sample them. Name each color after where it came from ("shutter green", "ticket buff"), not after its hue.

## The shape of a palette

A designed palette is not five equal swatches. It has proportions:

| Role | Share of the screen | Notes |
| --- | --- | --- |
| Ground | 60–80% | The page color. Rarely pure white: tint it toward the idea (paper, stone, a pale version of the dominant) |
| Ink | Text and lines | Rarely pure black: a deep color from the palette (a blue-black, a brown-black) |
| Dominant | One large field per screen or one recurring block | Carries the identity; may be the ground itself |
| Accent | Under 5% | One color, used for one job (the action, the live thing, the price) and nowhere else |
| Support | As needed | A neutral ramp derived from ground and ink, for borders, muted text, surfaces |

One surprise is allowed: a color that should not work with the rest and does, used once (an orange tag on a blue-black site). More than one is noise.

## Studies on the canvas

Before any page:

1. Three palettes from three different sources, each as a study screen in `00-identity/`: the swatches at their real proportions, the identity face set in ink on ground, the dominant as a large field with the headline, the accent on the one action, a real photograph beside them, and a dense UI fragment (a list, a form, a price table).
2. Each palette also in dark mode, designed as its own palette, not inverted.
3. Put them beside the default from the brief. A study that resembles the default is replaced.

## From palette to tokens

The chosen palette becomes `tokens.css` tiers: primitives in OKLCH (a ramp for the dominant and the neutral, single values for accent and support), then semantic roles (`--color-bg`, `--color-text`, `--color-text-secondary`, `--color-accent`, `--color-on-accent`, `--color-surface`, `--color-border`, states), then the dark set under `:root[data-theme="dark"]`. Use [seenry-craft color](../../seenry-craft/references/color.md) for ramp steps and contrast.

## Checks

- Text and controls meet contrast (4.5:1 body, 3:1 large text and UI) on the surfaces they actually sit on, in both modes: `canvas.mjs verify`.
- The accent appears for one job only; search the screens for it.
- Photographs sit in the color world (graded or chosen to match); a photo with its own loud palette needs a neutral frame.
- Squint test: blurred, each screen still shows one dominant, one ink, one accent.
- Strip test: every screen in a row at thumbnail size reads as one product.

## Weak palettes and their fixes

| Weak | Fix |
| --- | --- |
| The subject's cliché color, used flat | A specific version from a real source, in a specific role |
| Warm off-white, near-black, one accent | Tint ground and ink toward the idea; let a dominant take real area |
| Five colors at equal weight | Proportions: ground, ink, dominant, one accent |
| Gradient as identity | A flat field from a real source |
| Accent on everything (links, icons, tags, buttons) | One job; the rest in ink |
| Pure black on pure white | Tinted ink and ground |
| Dark mode as inversion | A designed dark palette, often with a different dominant treatment |
| Each reference contributed one color | One source, one system |
