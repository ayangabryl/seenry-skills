# Data dense

## Identity

The numbers are the picture. Every chart is a designed object in the page's one hue (sticks with a mirrored row, stacked blocks, a tick scale, a dot swarm), and each states one finding in words.

## Type

- Headline: two lines, 54–64px at 1440, weight 400–500, line-height 1.0–1.1, tracking −2%. Geist or Inter Display; fallback system-ui.
- Figures 40–56px, the unit at half opacity; labels 12–14px; tabular figures in columns.

## Colour roles

- One hue in five steps carries every mark.
- Highlight: one colour, for the selected or current mark only.
- Time: past dim, now lit, forecast hatched.
- Series differ by form and step, never by a rainbow.
- Images: monochrome in the hue.

## Imagery

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "16:9",
  "subject": "<the thing being measured> seen from far above at dusk as a field of small lights",
  "concept": "<the idea line: the pattern the product reads in this field>",
  "palette": {"shadows": "<ground hex>", "highlights": "<ink hex>", "accent": "<hue hex>"},
  "grade": "monochrome", "light": "last light on the horizon", "light_reason": "low light keeps marks readable",
  "texture": "fine grain", "texture_reason": "it matches the hairline charts",
  "placement": {"slot": "behind the dashboard, full-bleed", "field": "upper 40%, calm, for the headline", "mode": "bleed"},
  "prop": "the brightest cluster of lights", "exclude": "text, people, charts, a second hue"},
 {"out": ".seenry/canvas/img/<direction>-near.jpg", "extends": "hero",
  "subject": "the same field close, <a few of its lights> out of focus",
  "placement": {"slot": "the ground under the closing figure", "field": "the centre, dark, for one number", "mode": "bleed"}}]
```

## How image and interface meet

The dashboard is translucent across its metric cards, solid by the main chart, and fades into the ground over 120px. Each metric card holds a different mini form; one tooltip is open.

## Below the hero

- **One chart, one finding**: full width, the breach filled, the finding written beside its mark.
- **Small multiples**: six to twelve tiny charts on one scale, ruled, one lit.
- **Ledger with sticks**: table rows with inline sticks, one row opened.
- **Dumbbell rows**: before and after as two marks joined per row.
- **Fanned panels**: three overlapping panels joined to the action by thin lines.
- **Method note**: source, date and how each figure is computed, ruled and small.

## Phone

Headline 34–38px. Charts are redrawn for 390 with fewer marks, never scaled. Multiples go two across; the tooltip becomes a readout line under the chart.

## Never

- Default bars, or a bare line with no axis.
- Teal, red and green together.
- A pie or donut with more than two parts.
- A KPI, a delta arrow and a sparkline as the hero.
- A figure with no unit or date.

## Seen in

Trend dashboard on a dusk landscape and Sendoq panels (owner's reference set, L1, L4); Linear `51936621b48340b3af54ddd41d9496c7`.
