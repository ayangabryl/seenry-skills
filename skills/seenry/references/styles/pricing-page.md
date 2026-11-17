# Pricing page

## Identity

A page that answers one question: what do I pay, and for what. The price is the largest type in each plan, the plans read as one object, and a single ledger settles every comparison.

## Type

- Headline: one line at 64–80px or two at 48–56px, weight 500–600, tracking −2%. Geist or Inter Display; fallback system-ui.
- Price 40–48px at weight 600, its period in 13px beside it; plan name 20–22px; inclusions 15–17px; ledger rows 56–64px tall.

## Colour roles

- Plans: neutral, in one container split by hairlines, or 16–20px apart with one tinted.
- Action: only the recommended plan's button is filled.
- Accent: the saving and the recommended mark, nothing else.
- Checks: small ink marks; exceptions are words.
- Images: monochrome with the accent.

## Imagery

A pricing page is type and table; the images are one object and its return.

```json
[{"out": ".seenry/canvas/img/<direction>-object.png", "ratio": "1:1",
  "subject": "<one object that stands for the product>, whole, centred, straight on",
  "concept": "<the idea line: the one thing every plan buys>",
  "palette": {"shadows": "<ink hex>", "highlights": "<ground hex>", "accent": "<accent hex>"},
  "grade": "desaturated-one-accent", "light": "one soft light from above", "light_reason": "a price needs nothing dramatic",
  "texture": "none", "texture_reason": "the table beside it is flat",
  "placement": {"slot": "behind the plan block", "field": "its centre, calm, for the price", "mode": "cutout"},
  "prop": "the object's lit rim", "exclude": "text, coins, people, price tags"},
 {"out": ".seenry/canvas/img/<direction>-rim.jpg", "extends": "hero",
  "subject": "the same object cropped to <its lower edge>, filling the width",
  "placement": {"slot": "the closing band", "field": "upper half, for the action", "mode": "bleed"}}]
```

## How image and interface meet

The object sits behind the plans with the price on its calm centre, or the product's real interface appears inside the add-on row.

## Below the hero

- **Comparison ledger**: one table in headed groups, plan names repeated per group, exceptions written out ("Limited", "Max 3").
- **Inheritance line**: each plan opens with "Everything in the plan before, plus".
- **Add-on shelf**: one extra sold as its own row, real content beside it.
- **Proof line**: customer marks in one colour under the plans.
- **Billing answers**: heading left; the three answers that decide a purchase, open, in ruled rows.
- **One-plan statement**: a single price at 96px inside the object, six inclusions in two columns.

## Phone

Plans stack, the recommended first, under the billing switch. The ledger shows one plan at a time behind a picker, never a table scrolling sideways. Price at least 36px.

## Never

- Three equal cards with the middle one scaled up.
- A "Most popular" ribbon.
- Invented strikethrough prices.
- Green ticks and red crosses.
- Buttons at different heights across plans.
- "Contact us" on every plan.

## Seen in

Mobbin pricing `ed7391db1f844735b1ef2131e3e1cb65`; Reflect `443f5e56caf74962be3bb79585ac5d20`; Attio `f73e4f74639e472a8eb81c1757d74891`.
