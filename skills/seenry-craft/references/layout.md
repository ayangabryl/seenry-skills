# Layout that survives

A layout is finished when it holds after three things it was not drawn for: a narrower container, a longer language and a mirrored direction. Spacing values and the grid live in [system](system.md); lines in [lines](lines.md); phone browser quirks in [mobile web](mobile-web.md).

## Contents

- Leading and trailing, not left and right
- What does not mirror
- Room for translated text
- The component adapts to its container
- Sticky chrome and scroll rows
- Order
- Check it
- Patterns to search for

## Leading and trailing, not left and right

Anything that depends on reading direction is written as start and end, so one `dir="rtl"` on the root mirrors the whole interface.

| Physical | Logical | Tailwind |
| --- | --- | --- |
| `margin-left`, `margin-right` | `margin-inline-start`, `margin-inline-end` | `ms-*`, `me-*` |
| `padding-left`, `padding-right` | `padding-inline-start`, `padding-inline-end` | `ps-*`, `pe-*` |
| `left`, `right` | `inset-inline-start`, `inset-inline-end` | `start-*`, `end-*` |
| `text-align: left` | `text-align: start` | `text-start` |
| `border-left` | `border-inline-start` | `border-s` |
| `border-top-left-radius` | `border-start-start-radius` | `rounded-ss-*` |
| `width`, `height` on text boxes | `inline-size`, `block-size` (optional; they matter for vertical scripts) | |

Flex rows and grid columns already follow the inline direction and mirror on their own. Physical values inside them do not.

## What does not mirror

| Thing | Rule |
| --- | --- |
| `translateX`, `background-position: left`, a gradient angle | No logical form: add a `[dir="rtl"]` override |
| Safe-area insets | Physical on purpose. Pair `left` with `safe-area-inset-left` and override the side under `[dir="rtl"]`; never mix an inset with a logical property |
| Icons that point (back, next, a chevron, a send arrow, a reply) | Flip in right-to-left |
| Icons that depict (a clock, a check, a play triangle, a logo, a slash through) | Never flip |
| Sequences that mean progress (steps, stars, a progress bar, a slider) | Fill from the leading edge, which is the right in right-to-left |
| Digits, phone numbers, code, a chart's time axis | Stay left to right; wrap mixed-direction user text in `<bdi>` or `dir="auto"` |

## Room for translated text

Translated strings grow, and short ones grow the most: a one-word English label can double in German or Finnish, while a paragraph grows about a third. The riskiest thing on the screen is a one-word button.

- Text boxes get `max-width` and `min-height`, never a fixed width or height. A fixed height also clips at 200% zoom.
- A row of buttons or tabs is allowed to wrap, or collapses into a menu; it never relies on the English widths adding up.
- A label sits above its field. A label beside its field needs a column sized for the longest translation.
- No text inside images. No sentence built in the layout from separate pieces (see [writing](writing.md#written-to-be-translated)).
- Truncate only what can be seen in full elsewhere. Never truncate a button label, a price or an error.
- Line height that fits Latin can clip Thai, Arabic, Devanagari and stacked Vietnamese accents: no `overflow: hidden` on a single-line text box whose line height is under 1.3.

## The component adapts to its container

A card does not know how wide the page is, only how wide its slot is. Reusable components respond to their container; only page-level structure responds to the viewport.

```css
.card-slot { container-type: inline-size; }
@container (width < 400px) {
  .card { grid-template-columns: 1fr; }
}
```

- A query styles the container's descendants, never the container itself, so the container is a wrapper around the thing that changes.
- `container-type: inline-size` stops the box taking its width from its content. On a flex item, an inline-block or an absolutely positioned box with no width, it collapses to zero: give it a definite width.
- Breakpoints come from the content. Keep the wide arrangement until it stops fitting, then collapse; do not copy device widths.
- Test the smallest and the largest supported size first. The middle follows.

## Sticky chrome and scroll rows

- With a sticky header, set `scroll-padding-block-start` on the scroller to the header's height, so anchor targets and focused fields never land beneath it.
- A horizontally scrolling row that ends exactly at the container edge looks complete and nobody scrolls it. Size items so the next one peeks, pad the row with `padding-inline`, and match it with `scroll-padding-inline` so snapped items land on the content edge.
- A box that must cap its height pairs `max-height` with `overflow-y: auto`.

## Order

DOM order is reading order, focus order and the order a screen reader speaks. Rearranging with `order`, `flex-direction: row-reverse` or grid placement changes only what sighted pointer users get. Put the markup in the order it should be read and let the layout follow.

## Check it

1. **Narrow and wide:** the smallest and largest supported widths, then drag between them looking for the width where something overlaps.
2. **Long language:** pseudo-localise without a translator. Replace each string with an accented copy about 40% longer, wrapped in brackets (`[Šéttîñgš ~~~~]`). Clipped brackets show truncation; plain English shows a string that never went through translation.
3. **Mirrored:** set `dir="rtl"` on the root. Everything that should mirror does, nothing that should not (digits, logos, clocks) moves, and no spacing is left on the wrong side.
4. **Zoomed:** 200% browser zoom and the largest system text size. Nothing clips, nothing needs two-direction scrolling.

## Patterns to search for

| Pattern | Fix |
| --- | --- |
| `margin-left`, `padding-right`, `left:`, `text-align: left`, `ml-`, `pr-`, `text-left` on direction-dependent layout | The logical form |
| `@media (max-width` inside a reusable component | `@container` on its wrapper |
| `container-type` on a shrink-to-fit box | A definite width |
| `width:` or `height:` in pixels on a box that holds a label | `max-width`, `min-height` |
| `translateX` or `background-position: left` on mirrored UI | A `[dir="rtl"]` override |
| A logical property combined with `safe-area-inset-left` or `-right` | Physical side plus an override |
| A sticky header with no `scroll-padding-block-start` | Set it to the header height |
| `order:`, `row-reverse` changing meaning-bearing order | Reorder the markup |
