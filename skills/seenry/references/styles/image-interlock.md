# Image interlock

## Identity

One painted or photographed landscape owns the hero and the product lives inside it: a flat colour field above for the headline, terrain below rising in front of the app. Calm, one hue; the picture is the brand.

## Type

- Headline: two lines, 54–68px at 1440, weight 300–400, line-height 1.0–1.1, tracking −2%. Newsreader (calm) or Geist (technical); fallbacks Georgia, system-ui.
- Body 16–18px Geist or Inter; product UI 12–14px.

## Colour roles

- Field: the image's flat sky colour at full strength, the brand hue.
- Ground below the hero: white or near-black, never a tint.
- Charts, states, buttons: field hue and white, one highlight.
- Images: duotone into field and highlight.

## Imagery

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "3:2",
  "subject": "<the product's place or material> as a wide gouache landscape, flat planes, terrain filling the lower 45%, rising at both edges",
  "concept": "<the idea line: what the product's number is read against>",
  "palette": {"shadows": "<ink hex>", "highlights": "<ground hex>", "accent": "<field hex>"},
  "grade": "duotone", "light": "hard low sun from one side", "light_reason": "edges must read behind an interface",
  "texture": "dry-brush grain", "texture_reason": "paint, not stock photography",
  "placement": {"slot": "full-bleed hero, bottom-anchored", "field": "top 55%: flat empty sky for the headline", "mode": "bleed"},
  "prop": "the sky itself", "exclude": "people, text, clouds, a second hue"},
 {"out": ".seenry/canvas/img/<direction>-close.jpg", "extends": "hero",
  "subject": "the same terrain close and low, <its grass, rock or water> crossing on a diagonal",
  "placement": {"slot": "the bottom third of section tiles", "field": "upper two thirds, flat, for a mini interface", "mode": "tile"}}]
```

## How image and interface meet

The image is drawn twice; the top copy, masked along the terrain's edge, covers the lower 40–45% of the app, which spans 62–68% of the page. Logo marks sit on the image.

## Below the hero

- **Unequal tiles**: narrow, wide, full-width, 20–24px apart; terrain along each bottom in a new crop, a different mini interface in each.
- **Drawn connector**: source icon tiles joined by one line through a large mark tile.
- **Figures on the ground**: three or four numbers at 56px, units at half opacity, no cards.
- **Split statement**: heading left, paragraph right, then one full-width product moment melting into the image.
- **One measured quote**: a single before-and-after figure on the deep field.
- **Closing**: the terrain in a new crop, the action on its calm field.

## Phone

Headline 34–40px. The app is cropped to its top-left, terrain across its lower third, never scaled down. Tiles stack and keep their crops.

## Never

- A panel placed on a picture.
- A second saturated hue.
- One crop in two tiles.
- A headline over the terrain.
- A dark overlay to rescue contrast.
- Corners over 6px.
- People, or a sky gradient.

## Seen in

Qredible, Mist (owner's reference set, L2, L5); Midday `4758c441259e4b2d86e7d49174c766bf`.
