# Mobile app landing

## Identity

The phone is the hero object with real screens: one device near life size, cropped by its panel, in a hand or on one colour field. The brand colour comes from the app's own interface.

## Type

- Headline: two or three lines, 48–64px at 1440; a grotesk at 700–800 (Hanken Grotesk, Manrope), line-height 1.0–1.2. Fallback system-ui.
- Body 16–18px; in-screen text at the app's true 11–17px. Pill controls.

## Colour roles

- Field: the app's signature colour, on panels with 20–28px radius.
- Deep: one dark neutral for panels and buttons.
- Ground: white or paper.
- Screens keep the app's real colours.
- Photographs: graded so the field colour is the only saturated thing.

## Imagery

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "2:1",
  "subject": "a hand holding a phone at chest height in <the place this app is used: a market stall, a platform, a kitchen>, the blank screen facing the lens, shallow focus",
  "concept": "<the idea line>: the app in the middle of life",
  "palette": {"shadows": "<deep hex>", "highlights": "<ground hex>", "accent": "<field hex>"},
  "grade": "desaturated-one-accent", "light": "late daylight from one side", "light_reason": "the app is used mid-errand",
  "texture": "light 35mm grain", "texture_reason": "it keeps the photograph honest",
  "placement": {"slot": "full hero panel, 1240 by 650", "field": "left 45%: dark and calm for the headline", "mode": "bleed"},
  "prop": "one object in the field colour", "exclude": "faces to camera, text, logos, a second phone"},
 {"out": ".seenry/canvas/img/<direction>-detail.jpg", "extends": "hero",
  "subject": "<the same place> in close detail without the phone: hands, objects, the field colour once",
  "placement": {"slot": "square photo tiles between screen tiles", "field": "none", "mode": "tile"}}]
```

## How image and interface meet

The real screen is set into the photographed phone, or the device stands 230–380px wide in a field panel, cut by its bottom edge. Callouts overlap the device edge by a third and hold real values.

## Below the hero

- **Photo, screen, photo**: a row alternating photograph tiles and single-screen tiles, running off the right edge.
- **Cropped device panel**: text left, the phone right in a field panel, cut at the bottom.
- **Statement between four tiles**: a centred heading with field and deep tiles at its corners, each a screen fragment.
- **Screen strip**: five consecutive screens of one task, edge to edge.
- **Seals panel**: real awards or ratings on a deep panel beside the one action.
- **Closing code**: store buttons and a scannable code as one object.

## Phone

Headline 34–40px. The device comes first at 70% width, cropped; rows scroll sideways; the code becomes the store button.

## Never

- A phone floating at an angle with a shadow.
- Placeholder text or empty charts in screens.
- Laptop mockups.
- A gradient behind the device.
- A device smaller than the headline block.

## Seen in

Monzo `2620ec951e824d52a0724048a968c687`; Voy `4a4ae73ba43c9b84da4bf63767c683b9`; Headspace `f9d69d09ce1f434cacfda8007ae6de32`.
