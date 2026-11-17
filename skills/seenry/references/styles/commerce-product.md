# Commerce product

## Identity

The product is photographed as a character in a scene, in the brand's one ink, and price and buy are never more than a glance away. Loud object, plain shop.

## Type

- Section lines 44–72px at 1440, weight 400, line-height 1.2; hero line 40–44px. Courier Prime (typewriter) or Hanken Grotesk (plain); fallbacks Courier New, system-ui.
- Product names and prices 11–13px capitals; buttons 12–13px.

## Colour roles

- Ink: one brand hue at full strength for type, buttons and the product itself.
- Ground: cream or white; a dark field for the hero only.
- Images: desaturated except the brand ink.

## Imagery

The shop's packshots come first; these are stand-ins, listed under "Assumed".

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "3:2",
  "subject": "<the product> standing on <an object that says when it is used>, straight on, dark seamless ground",
  "concept": "<the moment of day this product is for>",
  "palette": {"shadows": "<dark hex>", "highlights": "<ground hex>", "accent": "<ink hex>"},
  "grade": "desaturated-one-accent", "light": "one hard key light", "light_reason": "packaging needs a crisp edge",
  "texture": "none", "texture_reason": "the label must stay legible",
  "placement": {"slot": "full-bleed hero", "field": "lower-left quarter, dark, for a line and one pill", "mode": "bleed"},
  "prop": "the product in the brand ink", "exclude": "faces, other brands, text"},
 {"out": ".seenry/canvas/img/<direction>-scene.jpg", "extends": "hero", "ratio": "2:3",
  "subject": "the product among <leaves, fabric or skin>, from above, close",
  "placement": {"slot": "tall category tiles", "field": "top-right corner, for the category name", "mode": "tile"}}]
```

## How image and interface meet

The product stands on its prop at a quarter of the frame height; the line sits in capitals on the photograph's dark corner, a pill beneath. Category names sit inside each tile's corner.

## Below the hero

- **Scene tile rail**: tall 2:3 tiles, about 410 by 620, radius 16, 12px apart, each a different still life; the rail runs off the right edge.
- **Packshot rail**: products alone on ground-coloured tiles, name and price centred beneath in 11px capitals.
- **Macro mosaic**: one product at double scale beside singles, ruled by hairlines.
- **Club split**: one half a duration selector, price and Add to cart; the other a full-bleed photograph of the range.
- **One-sentence sign-off**: newsletter as a sentence with one underlined field, under a dotted rule.
- **Giant wordmark**: the name filling the page width in the ink.

## Phone

Hero crops to product and prop, line 28–32px. Rails scroll sideways, one and a third tiles showing; packshots two-up, price under name.

## Never

- Stock lifestyle photographs.
- A second accent for sale.
- Discount ribbons on tiles.
- Packshots in white boxes with shadows.
- A row of benefit icons.
- Prices shown only on hover.

## Seen in

kit `42baaaab2e2143b682e97c8d98f61042`; Ace & Tate `6a903df1a6204135984201bf166a5eec`; Sqirl `46133854179444cfb45a4037210b34a7`.
