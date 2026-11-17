# Editorial type

## Identity

Type is the image: a masthead or statement set so large it becomes the composition, on a visible column grid, with photographs as quiet plates beneath. It reads like a printed issue.

## Type

- Masthead or statement: 96–170px at 1440, weight 400, line-height 0.95–1.1, tracking −3 to −4%. Switzer or Hanken Grotesk; fallback Helvetica Neue.
- Standfirst 48–52px; story titles 20–36px; reading text 18–20px Newsreader, fallback Georgia; labels 12–13px in square brackets.

## Colour roles

- Ground: paper white or near-black. Ink: the opposite.
- Accent: one hue, for links only.
- Rules: 1px hairlines marking six columns.
- Images: desaturated toward the ink, the accent the only saturation.

## Imagery

The lead story's plate and its details; stand-ins, listed under "Assumed".

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "2:1",
  "subject": "<the lead story's subject> small in a wide frame, seen from behind, horizon in the upper half",
  "concept": "<what the issue is about, as one observed moment>",
  "palette": {"shadows": "<ink hex>", "highlights": "<ground hex>", "accent": "<accent hex>"},
  "grade": "desaturated-one-accent", "light": "flat overcast daylight", "light_reason": "a plate must not compete with the masthead",
  "texture": "fine film grain", "texture_reason": "it reads as print",
  "placement": {"slot": "full-bleed band under the masthead", "field": "lower-left corner, calm, for a small story title", "mode": "bleed"},
  "prop": "one object in the accent", "exclude": "text, logos, posed faces"},
 {"out": ".seenry/canvas/img/<direction>-plate.jpg", "extends": "hero",
  "subject": "a detail of the same story: <an object, a hand, a path> filling the frame",
  "placement": {"slot": "index row plates", "field": "none; the title sits beside it", "mode": "tile"}}]
```

## How image and interface meet

The masthead spans the full width above a full-bleed plate 730px tall; the story title sits small on the plate's calm corner. Or one small image is tucked behind a single word of a three-line statement.

## Below the hero

- **Indented standfirst**: one paragraph at 48–52px, first line indented behind a bracketed label, numbered inline links.
- **Giant section word**: one word at 150–170px on a hairline, opening the index.
- **Index rows**: title small and pinned in the left third, plate across the right two thirds, excerpt in two columns beneath.
- **Unequal rail**: a sideways strip of stories whose plates differ in width.
- **Cover shelf**: issues as covers at true proportion.
- **Ink caption block**: the lead plate with its headline on a solid ink block joined beneath.

## Phone

Masthead fills the width at 56–72px. Index rows stack, title above plate; the grid drops to two columns; standfirst 28–32px.

## Never

- Three equal story cards in a row.
- A category pill on every story.
- Centred reading text.
- Tinted panels or gradients.
- Image corners over 4px.
- An italic accent word in the headline.

## Seen in

Vaste `8df696a2fb214a1f8fac890531a6451c`; Dazed `682921ca413141b7aba35c052ff8b1c3`; Vela Capitals `9a0bb78ef45d53265d327e5b1eac20ff`.
