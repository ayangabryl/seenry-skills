# Clinic warm

## Identity

A care service seen through one hand-made image: an ink-and-wash drawing or a daylit photograph of touch. Warm paper, one deep hue from that image and a quiet serif read as a person's practice, not a platform.

## Type

- Headline: two lines, 56–60px at 1440, weight 300–500, line-height 1.0–1.1, tracking −2.5%. Fraunces 300 or Newsreader (serif), Figtree 500 (grotesk); fallbacks Georgia, system-ui.
- Body 15–16px Figtree or Inter. Controls 4–10px radius, or pills.

## Colour roles

- Ground: warm paper; tiles a step darker.
- Deep: one natural hue from the image (moss, clay, ink) for panels, buttons and footer.
- Ink: near-black of that hue.
- Product states: weights of the deep hue.
- Images: desaturated toward paper.

## Imagery

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "16:9",
  "subject": "<the act of care this service gives: two hands meeting, a fitting, a consultation> drawn in ink line with sepia watercolour wash, spanning the full width on bare paper",
  "concept": "<what changes for the patient>, shown as touch",
  "palette": {"shadows": "<ink hex>", "highlights": "<paper hex>", "accent": "<deep hex>"},
  "grade": "desaturated-one-accent", "light": "soft window daylight", "light_reason": "care happens in rooms, by day",
  "texture": "watercolour paper grain", "texture_reason": "a hand made it",
  "placement": {"slot": "full-width band under the headline", "field": "top 40%: bare paper for a centred headline", "mode": "bleed"},
  "prop": "one garment in the deep hue", "exclude": "text, faces to camera, stethoscopes, clinical blue"},
 {"out": ".seenry/canvas/img/<direction>-portrait.jpg", "extends": "hero",
  "subject": "one patient or carer from <a real use case>, three-quarter figure, the same ink and wash",
  "placement": {"slot": "tall 3:4 tiles in a use-case row", "field": "none", "mode": "tile"}}]
```

## How image and interface meet

The drawing passes behind the headline's lower edge and fades into the paper. Product moments sit in darker paper tiles, cropped by the tile edge, never floating.

## Below the hero

- **Statement paragraph**: one 28–32px paragraph across eight columns, its last clause in grey.
- **Alternating product moments**: a paper tile one side, three lines the other, sides swapping; each tile one real cropped screen (a check-in, a journey, an insight list).
- **Drawn use cases**: tall 3:4 drawn portraits in a row running off the right edge.
- **Service index**: treatments as a ruled list with duration and price.
- **Highlighted quote**: one 28px sentence, one phrase on a tinted ground.
- **Closing wordmark**: the name at 300px, the drawing rising from the footer.

## Phone

Headline 36–40px. The drawing crops to where the hands meet; tiles go full width, screen first; the use-case row scrolls sideways.

## Never

- Stock portraits of clinicians.
- Clinical blue or teal gradients.
- Heart, cross or pulse-line icons.
- Screenshots floating with shadows.
- Pastel panels in several hues.
- Icons in tinted circles.
- Three equal benefit cards.

## Seen in

Nudge `54e03f61fe1141b4924793fdf5f6fcd1`; Hawthorne Skin & Beauty `ee5b645143aa4c789ab9099e54b308d9`; Amigo `a041530afadf4742af5c0ce3fe306e4b`.
