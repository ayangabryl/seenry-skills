# Product stage

## Identity

The whole working app is the hero, at real size, standing on a quiet lit field like an object on a plinth. Nothing illustrates the product: it is shown, with one believable morning of data.

## Type

- Headline: two lines, 52–72px at 1440, weight 400–510, line-height 1.0–1.1, tracking −2%. Inter Display or Geist; fallback system-ui.
- Section heads 48px, lede 24px, body 16px; product UI 13–14px; Geist Mono for identifiers.

## Colour roles

- Ground: near-black or white, one neutral ramp on a single hue angle.
- Stage: a lit neutral field under the app, never a brand tint.
- Accent: one hue, on state only.
- Images: monochrome, graded to the ground.

## Imagery

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "16:9",
  "subject": "<a surface from the product's world> as an empty studio sweep, a soft band of light across the lower third, dark above",
  "concept": "<the idea line: the bench this product's work is laid on>",
  "palette": {"shadows": "<ground hex>", "highlights": "<surface hex>", "accent": "<accent hex>"},
  "grade": "monochrome", "light": "one soft overhead strip", "light_reason": "plinth light shows the object only",
  "texture": "fine grain", "texture_reason": "it stops the gradient banding",
  "placement": {"slot": "the stage under the app, full-bleed", "field": "upper 60%, dark, for the headline", "mode": "bleed"},
  "prop": "a faint accent reflection", "exclude": "objects, people, text, devices"},
 {"out": ".seenry/canvas/img/<direction>-edge.jpg", "extends": "hero",
  "subject": "the same surface close, <its grain or weave> raking across the frame",
  "placement": {"slot": "the ground of one quote tile and the closing statement", "field": "all of it, calm enough for type", "mode": "tile"}}]
```

## How image and interface meet

The app spans 83–92% of the page and stands in the lit band; the section edge cuts it, or it fades into the ground over 120px. Real markup, never a screenshot.

## Below the hero

- **Panel pair**: two real panels overlapping, the rear one fading out, heading left, lede right.
- **Capability index**: a label left, six plain links with a plus sign in two ruled columns.
- **Hairline cells**: five cells divided by 1px rules inside page-wide rails; no boxes.
- **Customer tabs**: logo marks as tabs; the chosen one shows one measured figure and one photograph.
- **Scale curve**: four figures over one rising curve with a fine vertical hatch.
- **Unequal quotes**: one wide tile, one narrow in the accent.

## Phone

Headline 36–40px. One pane of the app at full size, never the window scaled down. Panel pairs become one panel; index and cells stack.

## Never

- The app at half width beside the headline.
- One chart in a box as the product.
- A tilted or perspective screenshot.
- Icon-in-a-rounded-square feature cards.
- A breadcrumb, a date toggle and a KPI with a delta as the hero.
- A second accent hue.

## Seen in

Linear `51936621b48340b3af54ddd41d9496c7`; Attio `f73e4f74639e472a8eb81c1757d74891`; Midday `4758c441259e4b2d86e7d49174c766bf`.
