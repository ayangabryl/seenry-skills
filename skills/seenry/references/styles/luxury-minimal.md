# Luxury minimal

## Identity

Large quiet photographs speak and the type whispers: one light serif line over a full-bleed still life, then long silences. Nothing is boxed; price and action are small and exact.

## Type

- Headline: two lines, 64–84px at 1440, weight 300, line-height 1.05–1.1. Cormorant Garamond or Newsreader; fallbacks Garamond, Georgia.
- Object names 18px serif; navigation, body and prices 13–14px Hanken Grotesk, fallback system-ui; labels 12px.

## Colour roles

- Ground: off-white or pale grey. Ink: near-black.
- Interface accent: none; the only saturated colour is the object's own, inside the photographs.
- Rules: 1px ink hairlines in place of gaps.
- Images: desaturated around that one colour, in one soft light.

## Imagery

The owner's photographs come first; these are stand-ins, listed under "Assumed".

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "1:1",
  "subject": "<the objects or the room> as an overhead still life, cropped so two pieces leave the frame, one material in sharp focus",
  "concept": "<what owning it feels like, told through materials>",
  "palette": {"shadows": "<ink hex>", "highlights": "<ground hex>", "accent": "<object hex>"},
  "grade": "desaturated-one-accent", "light": "soft window light from one side", "light_reason": "materials read by their shadows",
  "texture": "fine grain", "texture_reason": "it softens sharpness",
  "placement": {"slot": "full-bleed hero", "field": "upper centre, soft and out of focus, for two lines", "mode": "bleed"},
  "prop": "the object's own colour", "exclude": "text, faces, other brands"},
 {"out": ".seenry/canvas/img/<direction>-macro.jpg", "extends": "hero",
  "subject": "<one object> alone on a pale seamless ground, so close it leaves the frame",
  "placement": {"slot": "the large mosaic tile", "field": "lower-left corner, for a name", "mode": "tile"}}]
```

## How image and interface meet

The headline sits directly on the photograph's soft area, no panel or scrim. Photographs meet edge to edge; actions are white pills 44px tall inside each photograph's lower-left corner.

## Below the hero

- **Edge-to-edge diptych**: two photographs meeting without a gutter, one pill inside each.
- **Hairline mosaic**: tiles ruled by 1px lines, one macro tile two columns by two rows beside single objects; name in serif, material beneath.
- **Object row**: four pieces on the ground colour, name left and price right on one baseline.
- **Half and half**: a collection name and two lines centred on one half, a macro on the other.
- **Portrait triptych**: three full-height portraits wearing the piece, side by side.
- **Wordmark footer**: the name across the full page width on ink.

## Phone

Headline 36–44px. The diptych stacks; the mosaic becomes the macro tile, then two-up. Prices stay on the name's baseline.

## Never

- Sale stickers or coloured badges.
- Shadows under product tiles.
- Gold gradients or foil effects.
- Star ratings near the headline.
- Corners over 4px on photographs.
- Letter-spaced uppercase serif.

## Seen in

Fred Home `6ee06dfbde6a45b19d0de30d8369a99b`; Ace & Tate `6a903df1a6204135984201bf166a5eec`; 18GEMS `7b18585f188f48ae9512b7e0b3a2231d`.
