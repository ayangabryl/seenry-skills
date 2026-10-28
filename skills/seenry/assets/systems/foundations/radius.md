# Radius

## The rule

**Nested corners are concentric.** When a rounded element sits inside another, both curves share one center, so the inner radius equals the outer radius minus the gap between their edges:

```
inner radius = outer radius − inset        (never below 0; at small results use 0 or the system's smallest step)
```

A card with a 12px radius and 4px padding holds a 8px-radius image; a segmented control with a 10px radius and 3px padding holds a 7px thumb; a 999px pill holds a pill. When the inner radius equals the outer one, the gap at the corner looks wider than along the sides, which reads as a mistake even to people who cannot name it.

## Why

- **Perception.** The eye judges the band between two curves by its narrowest point. Equal radii make the corner band visibly thicker than the straight edges; concentric radii keep it constant, which Gestalt continuity reads as one designed object.
- **Practice.** Apple's hardware and HIG continuous corners, Material 3's shape scale and every leading product measured for Seenry (Linear, Stripe, Vercel, Raycast) nest radii this way.

## The scale

- Three radii plus full (pill), each tied to a size class: small controls and chips (4–8px), cards and panels (10–16px), sheets and dialogs (16–24px). Larger containers get larger radii.
- A control's radius is either at most 25% of its height or a full pill. Between 26% and 49% the shape looks undecided (neither rounded rectangle nor pill).
- Flush elements (a table inside a card with no padding) inherit the card's radius on the touching corners only, via `overflow: clip` on the card, never by rounding the table separately.
- Focus rings follow the element's radius plus the ring offset (see [focus](focus.md)).

## In CSS

```css
.card { --r: var(--r-lg); --pad: var(--space-1); border-radius: var(--r); padding: var(--pad); }
.card > .media { border-radius: max(0px, calc(var(--r) - var(--pad))); }
.ui-segmented { border-radius: var(--r-md); padding: var(--seg-inset); }
.ui-segmented-thumb { border-radius: max(0px, calc(var(--r-md) - var(--seg-inset))); }
```

## Check

`system_check.mjs` walks every rendered element with a border radius whose nearest rounded ancestor has a radius, measures the actual inset between their edges, and fails when `|inner − (outer − inset)| > 2px` and the inner radius is not 0. It also fails control radii between 26% and 49% of the height.
