# Docs content

## Identity

A reading tool: navigation, a column of 60–75 characters and a page outline, with the first useful command on the first screen. Its character comes from one drawn hand in a single hue, never from decoration.

## Type

- Page title 30px at 1440, weight 400–500, line-height 1.2; section headings 22–24px. Newsreader for titles, fallback Georgia.
- Body 16px at 1.6 and navigation 14px in Inter or Geist, fallback system-ui; code 14px JetBrains Mono, fallback ui-monospace.

## Colour roles

- Ground: white or one deep neutral. Ink: body text at 7:1.
- Brand hue: links, the current navigation item and one highlighted diagram node.
- Code blocks: the darkest neutral, in both modes.
- Drawings: tints of the brand hue only.

## Imagery

Docs images are drawings: one cover scene, then single objects from it.

```json
[{"out": ".seenry/canvas/img/<direction>.png", "ratio": "1:1",
  "subject": "<the product's world as a small scene: houses, a machine, a map> drawn in ink line with watercolour wash",
  "concept": "<what the product does for the reader, as a place>",
  "palette": {"shadows": "<ink hex>", "highlights": "<ground hex>", "accent": "<brand hex>"},
  "grade": "duotone", "light": "flat, shadowless", "light_reason": "a drawing explains",
  "texture": "paper tooth", "texture_reason": "a hand made it",
  "placement": {"slot": "right of the quickstart, docs home", "field": "none; text never crosses it", "mode": "cutout"},
  "prop": "one figure in the brand hue", "exclude": "text, gradients, 3D render"},
 {"out": ".seenry/canvas/img/<direction>-spot.png", "extends": "hero",
  "subject": "one object from that scene alone: <a ladder, a balloon, a pin>",
  "placement": {"slot": "beside a section heading", "field": "none; it sits in the margin", "mode": "cutout"}}]
```

## How image and interface meet

The cover drawing sits right of the quickstart, never behind text. Diagrams share its hand, run the column's width (720–780px) and label with live text. Sidebar 300–320px; radii 6–10.

## Below the hero

- **Quickstart terminal**: the install command in a dark copyable block, the next action as a sentence.
- **Language chooser**: a tight three-by-three grid of small buttons.
- **Drawn diagram**: how it works as one illustration at column width, labels inside.
- **Link index**: one panel listing features as plain links in three columns.
- **Stack diagram**: three boxed layers joined by arrows, the product's layer outlined in the brand hue.
- **Edit line**: "Report an issue or edit this page" as one sentence ending the page.

## Phone

The sidebar becomes a sheet behind one Menu control, the outline a disclosure above the title. Code scrolls inside its block; drawings move below the quickstart.

## Never

- A marketing hero on the docs home.
- A centred reading column.
- A card around every link.
- Code with no copy control.
- Two link colours.
- Body text under 16px.

## Seen in

Fly.io docs `0badd2875ec549e192e91162a3282c13`; Redis docs `86a935db5e9f4cddbacd24f133fcdf77`.
