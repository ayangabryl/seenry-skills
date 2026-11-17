# Fintech trust

## Identity

Money shown calmly: a real ledger at working size, exact figures, one still picture of the customer's world. Trust comes from precision (cents, dates, footnotes) and restraint, never from shields and padlocks.

## Type

- Headline: two lines, 48–52px at 1440, weight 300–500, line-height 1.1–1.15, tracking −1 to −2%. Switzer or Geist; fallback system-ui.
- Body 16px. Amounts in tabular figures, cents at 60% size; ledger rows 14–15px.

## Colour roles

- Ground: white or a pale cool neutral; one deep ink band holds the product.
- Action: one hue, on buttons and the selected row only.
- Money: gain and loss by sign and weight.
- Controls: corners 1–4px.
- Images: desaturated toward the cool neutral, one accent kept.

## Imagery

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "3:2",
  "subject": "<one working object of the customer's business> alone in a wide still landscape at dawn, mist in the valley",
  "concept": "<the idea line: where this money is calm>",
  "palette": {"shadows": "<ink hex>", "highlights": "<ground hex>", "accent": "<action hex>"},
  "grade": "desaturated-one-accent", "light": "low dawn sun through mist", "light_reason": "soft light hides nothing",
  "texture": "fine film grain", "texture_reason": "photograph, not render",
  "placement": {"slot": "the full-bleed hero", "field": "upper third, open sky, for the headline", "mode": "bleed"},
  "prop": "one small accent detail on the object", "exclude": "people, text, coins, cards, charts"},
 {"out": ".seenry/canvas/img/<direction>-field.jpg", "extends": "hero",
  "subject": "the same mist as an abstract instrument: <two translucent discs or a wire globe> in soft light",
  "placement": {"slot": "the ground of two diagram tiles", "field": "the centre, for a drawn flow", "mode": "tile"}}]
```

## How image and interface meet

The product stands in the picture's foreground at real size; below, the ledger runs off the right edge of a deep band, unframed.

## Below the hero

- **Ledger and selector**: the accounts table bleeding off the edge beside ruled rows, the active one open.
- **Operator portrait**: one wide photograph of a real customer, the quote set inside it.
- **Money flow**: an account chip with lines branching to rule rows, or amounts on arcs across a dotted globe.
- **Unequal product tiles**: two thirds and a third, then full width; a different real surface in each.
- **Lit figure rail**: four figures between two hairlines on the deep band, one lit, three dim.
- **Disclosures as type**: superscripts in the copy resolve to a ruled small-print block.

## Phone

Headline 28–34px. The ledger shows four full-width rows, amounts right-aligned, never scaled. Tiles stack; the portrait crops to the face, quote below.

## Never

- Red and green together.
- Shields, padlocks or tick badges as proof.
- A credit card floating at an angle.
- Invented yields, volumes or customer logos.
- Neon gradients.
- Controls with corners over 8px.

## Seen in

Mercury `959fef28230b4a05a8112ae66730c9ea`; Stripe `edbb225b221e486abb324e54280b4933`; Metronome `c0cea2d1e4944eb78a1f1b857df57182`.
