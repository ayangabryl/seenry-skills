# App shell

## Identity

A working screen, not a page about one: the brief carries `Surface: app`. The work (a table, a list, a record) starts inside the first screen under a thin summary, and every region has its states. Conventional; novelty goes into what leads.

## Type

- Page title 20–24px at weight 600; region titles 15–16px; body and tables 13–14px; summary figures 24–28px. Inter or Geist; fallback system-ui.
- Tabular figures in columns; Geist Mono for identifiers.

## Colour roles

- Surfaces: three neutral steps on one hue angle.
- Accent: one hue, for the current item, the primary action and selected data.
- Status: word and icon; colour only for failed and overdue.
- Corners: panels 10–12px, controls 6–8px; 1px rules between regions.
- Images: monochrome.

## Imagery

No picture leads; the two images stand where data is absent.

```json
[{"out": ".seenry/canvas/img/<direction>-ground.jpg", "ratio": "3:4",
  "subject": "<the material the product's users handle> as a quiet out-of-focus surface",
  "concept": "<the idea line: the desk before the work arrives>",
  "palette": {"shadows": "<ink hex>", "highlights": "<canvas hex>", "accent": "<accent hex>"},
  "grade": "monochrome", "light": "soft window light from the left", "light_reason": "an all-day tool lives in daylight",
  "texture": "none", "texture_reason": "the interface beside it is flat",
  "placement": {"slot": "the side panel of sign-in and first run", "field": "upper half, for one line of type", "mode": "tile"},
  "prop": "one edge in the accent", "exclude": "people, text, screens, devices"},
 {"out": ".seenry/canvas/img/<direction>-object.png", "extends": "hero",
  "subject": "one small <object from that material>, alone",
  "placement": {"slot": "an empty region, above its one line and action", "field": "none", "mode": "cutout"}}]
```

## How image and interface meet

An image never sits behind data: it holds the place where data is missing and leaves when rows arrive. One live object (a map of the data) may own a region.

## Below the hero

- **Work table**: identifying column first, status as words, a bulk bar on selection, a count.
- **Region rail**: each region opens with a title on a rule, its freshness at the right.
- **Split pane**: list left, record right with its activity.
- **Cohort grid**: a table of cells shaded in one hue.
- **Live object**: one large live visual beside stacked figures.
- **Command line**: search with a shortcut hint and suggested intents.
- **Empty region**: object, one line, one action, at final size.

## Phone

The sidebar becomes a tab bar or sheet. Rows take two lines, the amount at the right; summary figures stack two by two; the split pane becomes push navigation.

## Never

- A hero or marketing type sizes.
- Four equal KPI cards with delta arrows on top.
- A card around every region.
- An accent bar on the selected row.
- A rainbow of status pills.

## Seen in

Shopify live view `15eedecfb733f2f5e6e24713bd91dc3b`; Stripe revenue dashboard `05f6db257f99dddfc33c530fd85f607c`; Midday `4758c441259e4b2d86e7d49174c766bf`.
