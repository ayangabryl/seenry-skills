# Studio portfolio

## Identity

The work is the page: every project appears near full width on a ground taken from the project itself, hung unevenly like a show. The studio speaks once, in one large statement.

## Type

- Statement: 64–96px at 1440, weight 300–400 in a serif (Newsreader, fallback Georgia) or 700 at 64px in a grotesk (Switzer, fallback Helvetica Neue); line-height 1.0–1.2.
- Project names 20–22px; captions and tags 11–13px.

## Colour roles

- Ground: paper, or one mid-tone neutral.
- Ink: one hue for all studio type.
- Accent: one field, used once, in the hero.
- Project tiles: each takes its ground from its own work.
- Images: the work keeps its colours; only stand-ins are graded.

## Imagery

The studio's real work comes first; these are stand-ins, listed under "Assumed".

```json
[{"out": ".seenry/canvas/img/<direction>.png", "ratio": "4:5",
  "subject": "a hand holding <one project as an object: a phone, a poster, a package>, cropped at the wrist, close",
  "concept": "<the studio's claim, shown as work you can hold>",
  "palette": {"shadows": "<ink hex>", "highlights": "<ground hex>", "accent": "<accent hex>"},
  "grade": "desaturated-one-accent", "light": "hard daylight from above", "light_reason": "the object must read as real",
  "texture": "none", "texture_reason": "the work carries the texture",
  "placement": {"slot": "hero, in front of the wordmark", "field": "both sides, for the wordmark's first and last letters", "mode": "cutout"},
  "prop": "the object's own screen or print", "exclude": "faces, laptops, desks"},
 {"out": ".seenry/canvas/img/<direction>-flat.jpg", "extends": "hero",
  "subject": "the same object lying flat with <two related pieces>, seen from above",
  "placement": {"slot": "a project tile", "field": "lower edge, for the caption bar", "mode": "tile"}}]
```

## How image and interface meet

The wordmark is a fifth of the viewport tall and the cut-out object stands in front of its middle letters. Each project tile carries a caption bar inside its lower edge: name, discipline tag, arrow.

## Below the hero

- **Full-width project tiles**: 92% of the page, about 860px tall, radius 12, each on its own ground; the next tile slides over the last.
- **Offset pairs**: two works of different sizes hung at different heights, 11px captions beneath, a spine of glyph marks between.
- **Statement between work**: one paragraph at 64px in the ink, first line indented.
- **Client marks**: one row of logos in ink, 28–32px tall, unboxed.
- **Justified shout**: one sentence at 90px in the accent, word-spaced to fill the measure.

## Phone

Tiles go full-bleed at 4:5 with their caption bars. Pairs become one column, alternating sides at 70% width. Statement 30–34px.

## Never

- An equal thumbnail grid.
- Services as icon cards.
- Work under 60% of the page width.
- Laptop or phone mockups in grey.
- A tint laid over the work.
- Captions that appear only on hover.

## Seen in

Neither/Nor `66b411cd7e97409d9f58e4a8699bf4f1`; Létude `eacec346d0c040c7bed0ae232b8645eb`; Agency Habitat `41445f4f76ba41588d12a7b5fbc72c79` (measured).
