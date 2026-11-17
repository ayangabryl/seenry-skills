# Place photographic

## Identity

A real place in its own light: one photograph of the room or the plate fills the first screen, and hours, address and booking stay within reach. One ink on one ground, and a display face with the place's character.

## Type

- Display: 64–124px at 1440, line-height 0.8–1.1: Poiret One at 400 for a grand house, Bowlby One for a loud bar; fallbacks Georgia, Impact.
- Section names 28–70px; body 12–16px Urbanist, fallback system-ui.

## Colour roles

- Ink: one hue taken from the place for all type, rules and buttons.
- Ground: one field; a section may swap ink and ground.
- Images: true colour in one warm light, shadows pulled toward the ink.

## Imagery

The owner's photographs come first; these are stand-ins, listed under "Assumed".

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "3:2",
  "subject": "<the room at its best hour> from the doorway, one table or bed lit, nobody posing",
  "concept": "<what an evening here feels like before you sit down>",
  "palette": {"shadows": "<deep hex>", "highlights": "<ground hex>", "accent": "<ink hex>"},
  "grade": "full-color", "grade_reason": "food and rooms keep their true colour",
  "light": "the room's own lamps", "light_reason": "guests will see it this way",
  "texture": "film grain", "texture_reason": "it suits lamplight",
  "placement": {"slot": "full-bleed hero", "field": "left third, in shadow, for the name", "mode": "bleed"},
  "prop": "one lit object", "exclude": "text, faces toward the lens"},
 {"out": ".seenry/canvas/img/<direction>-plate.png", "extends": "hero",
  "subject": "<one dish, drink or detail> on its plate, from above, hard daylight",
  "placement": {"slot": "beside section lettering, crossing its edge", "field": "none; it overlaps the type", "mode": "cutout"}}]
```

## How image and interface meet

The name sits on the photograph's shadowed third; the booking control (two date tiles, guests, one action) on the other side. Or a line drawing of the table lies behind a heavy headline.

## Below the hero

- **Unequal photo rail**: rooms as photographs of different widths (600, 290, 290) under display names.
- **Hours table**: service times typeset by meal, a booking link under each column.
- **Typeset menu**: printed cards, radius 24, one filled in the ink, one outlined, under a 180px word.
- **Owners' note**: one upright photograph beside a letter signed by hand.
- **Round offers**: packages as circle-masked photographs under their names.
- **Sister venues**: two lockups on an ink field.
- **Closing triptych**: three photographs edge to edge above the address.

## Phone

The photograph stays full height with the name; booking collapses to one action under it. The hours table stacks by meal; menu cards run full width.

## Never

- Stock food photographs.
- A map as the hero.
- Booking reachable only from the menu.
- The menu as a download only.
- Three values cards.
- Mixed photo filters.

## Seen in

Sommerro `02d97f2bf3f44657a5771dd3906b3a02`; Sqirl `46133854179444cfb45a4037210b34a7`; Surella `81a7ee645024463a9a01b26efaccf065`.
