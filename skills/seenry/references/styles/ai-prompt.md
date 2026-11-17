# AI prompt

## Identity

The hero is the prompt itself: one working input on an atmospheric ground under a single quiet headline. The ground is light, not illustration: aurora bands or a rising glow. Real outputs below are the proof.

## Type

- Headline: one or two lines, 38–68px at 1440, weight 400–500, line-height 1.05–1.2, tracking −2%. Geist or Inter Display; fallback system-ui.
- Prompt text 16–18px, chips 13–14px, body 14–15px.

## Colour roles

- Ground: near-black or near-white; the atmosphere carries the one hue.
- Input: opaque or frosted, radius 10–16px, one filled send button in the hue.
- Chips, tiles, logos: frosted steps of the ground.
- Images: duotone, matched to the ground.

## Imagery

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "3:2",
  "subject": "<the product's medium: sound, code, pages or signal> as vertical bands of light with soft falloff, brightest along a horizontal seam at 60% height",
  "concept": "<the idea line>: raw material before the agent shapes it",
  "palette": {"shadows": "<ground hex>", "highlights": "<glow hex>", "accent": "<hue hex>"},
  "grade": "duotone", "light": "emitted from inside the bands", "light_reason": "the model is the light source",
  "texture": "fine film grain", "texture_reason": "it stops the gradient banding",
  "placement": {"slot": "hero panel behind the prompt box", "field": "centre 45%: even and calm for the input", "mode": "bleed"},
  "prop": "the seam of light", "exclude": "text, robots, brains, sparkles, circuit lines"},
 {"out": ".seenry/canvas/img/<direction>-crop.jpg", "extends": "hero",
  "subject": "a close crop of the same bands, <one output's colour> entering at one edge",
  "placement": {"slot": "grounds of output tiles", "field": "centre: calm, for one control and a cursor", "mode": "tile"}}]
```

## How image and interface meet

The input spans 43–51% of the page in the atmosphere's calmest band and takes the light behind it. Chips hang under it; logo tiles are glass on the same glow.

## Below the hero

- **Output shelf**: four to six real results under the input, each captioned with its prompt.
- **Prompt on result**: the question as a chip laid over the dashboard, page or file it produced; one object.
- **Question wall**: faint example prompts, one raised to full contrast.
- **Source, chevron, result**: source card, prompt in a drawn chevron, result card.
- **Unequal starts**: ways to begin in a two-thirds/one-third grid that flips each row.
- **Tools in the field**: integration marks on the atmosphere, joined by hairlines.
- **Closing**: the input again, focused.

## Phone

Headline 30–36px. The input goes full width with two chips; the atmosphere crops to its seam; the shelf scrolls sideways.

## Never

- A purple-to-pink blob.
- Sparkle, robot or brain icons.
- A fake chat of three bubbles.
- A typewriter headline.
- A dead input: it types, or it goes.
- Outputs drawn as grey boxes.
- A second saturated hue in the interface.

## Seen in

Dune, goop (owner's reference set, L7, L8); Anima `a1a3ff906a5141d68abe2013d580d665`; Basedash `6ac97bdec3b14693b76669df0d6c6624`.
