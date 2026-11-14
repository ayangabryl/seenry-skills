---
name: seenry-craft
description: "Exact values for interface polish: type scale and line height, spacing and grouping, concentric radius, shadows and borders, color roles and contrast, icons, hit areas, press and focus states, and the states every component needs. Use while building or polishing any screen or component, when something looks slightly off, cheap or unfinished, or to check a build against measured values before it ships."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.2.0"
---

# Seenry Craft

This skill holds the values that make an interface look finished. It applies to any screen in any style, once the structure is right.

## Project tokens first, these values second

Where the project has tokens, a component library or a density, use them and match them. A deliberate, consistent project choice is not a fault. The same detail done two ways in one project is.

Values written as one number are exact: `0.97` is not `0.95`. Values written as a range are starting points to judge by eye. Never add a new typeface, color or radius to hit a number here.

## Few sizes, few weights

A screen uses five to nine type sizes and two or three weights. Each size is paired with its line height and weight, so a role is one decision.

| Role | Size | Line height | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Display (marketing) | 48–96px | 1.0–1.1 | 400–600 | -0.02 to -0.04em |
| Heading | 24–40px | 1.15–1.3 | 500–600 | -0.01 to -0.02em |
| Body, long-form | 16–18px | 1.5–1.6 | 400 | 0 |
| Product UI: inputs, menus, rows | 14–15px | 1.4–1.5 | 400–500 | 0 |
| Caption, meta | 13px, never under 12px | 1.4 | 400–500 | 0 |

- Line height is unitless. Text that can wrap to three lines gets 1.4 or more.
- Weight 700 and above is for rare emphasis, never for a whole heading system. Weights under 400 start at 28px.
- Long-form text is capped at 60–75 characters a line.
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs.
- `font-variant-numeric: tabular-nums` on prices, timers, counters and number columns.
- An input's text is 16px on phones, or iOS zooms the page.
- Font smoothing is set once on the root.

## Group with space before lines

- Every space is a multiple of 4px, from one scale.
- The gap between groups is at least twice the gap inside one: 8px inside means 16px or more between.
- Separate with space first, a surface tone second, a line last. One separation method per level: never a border, a shadow and a tint on the same card.
- When you do draw a line, it has one job (separate rows, start a section, or bound an object you can act on), runs in one direction per group, is exactly as wide as what it rules, and never meets another line to form a box. Side-by-side columns get a short rule on top of each, not dividers between them. See [lines](references/lines.md).
- Everything sits on a small set of shared edges. Two edges 1–6px apart are a mistake, not a choice.
- One primary action per view. More than three secondary actions go behind a menu.

## Outer radius equals inner radius plus padding

A card of radius 16 with 8px padding holds a child of radius 8. The same radius on a parent and its inset child looks swollen. Past 24px of padding, treat them as separate surfaces.

- A control's radius is at most a quarter of its height, or a full pill. 40px tall takes 8–10px.
- A button beside an input shares its radius and height.
- An edge that touches its container is square on that side.

## Shadows for elevation, borders for structure

- A surface that floats (menu, dialog, toast) gets a layered, transparent shadow. A surface in the flow gets none, or one 1px ring.
- Borders stay on inputs, table cells, dividers and selected states.
- A content image gets a 1px inset outline: `oklch(0 0 0 / 0.1)` on light, `oklch(1 0 0 / 0.1)` on dark. Never a tinted or accent outline.
- Keep `border: 1px solid transparent` under a shadow ring, so forced-colors mode still draws an edge.

## Color is roles, not swatches

- Components use role tokens (`--color-text-secondary`, `--color-bg-surface`), never a raw value or a hue name.
- Neutrals share one hue. Three text levels, two or three surface steps, one rule color.
- One accent, used only for the primary action, selection and focus. One color carries one meaning across the product.
- Exactly one filled action per view. The color goes on the background, not the label.
- Body text measures 4.5:1 on the surface it renders on; large text and control edges 3:1. Measure it; never estimate.
- Dark mode is its own palette: canvas lightness 0.14–0.17 in OKLCH and never `#000`, surfaces step up by 0.03–0.04, accent chroma lowered.
- Color is never the only carrier of a state. Pair it with an icon or a label.

## Icons match the text beside them

One icon set per product. Stroke is 1.5px beside weight 400 and 2px beside 500–600. Icons use `currentColor` and take every state from CSS. Outline is the default and filled marks the active state. An icon-only button has an accessible name.

## Controls respond on press

- A pressed button scales to `0.97` over 100–160ms with ease-out. A disabled one never scales.
- Hover styling sits inside `@media (hover: hover)`, or it sticks after a tap on touch.
- Every control has a visible `:focus-visible` ring with 3:1 contrast.
- A hit area is at least 44×44px on touch and 24×24px with a pointer. Grow it with padding or a pseudo-element, never by enlarging the visual.
- A scrollable dialog, drawer or menu sets `overscroll-behavior: contain`.
- `transition` names its properties. Never `transition: all`.
- Motion decisions, curves and durations belong to `seenry-motion`.

## Align by eye where geometry looks wrong

Geometric alignment first. Then: a button with an icon takes 2px less padding on the icon side, a play triangle sits 1–2px toward its point, an icon centers on the text's cap height and not its line box, and a 64px headline pulls back about `-0.04em` so its stem meets the body text edge.

## Every component has all its states

Default, hover, focus, pressed, disabled, loading, empty, error, one item and many items. A list built only for five tidy rows is unfinished. Text containers use `min-height` and `max-width`, never a fixed height, so longer words and translations fit. Truncated text has a way to the full value.

## Before you finish

Search what you changed. Fix each hit or defend it in one sentence.

| Pattern | Fix |
| --- | --- |
| `transition: all` or `transition-all` | Name the properties |
| `line-height` in `px` | A unitless value |
| Display `letter-spacing` tighter than −0.05em, or any negative tracking on a serif or condensed headline whose words nearly touch | −0.02em or less on those faces; keep the word space above 0.18em |
| A padded parent and child with the same radius | Add the padding to the outer radius |
| A hex or `rgb(` literal in a component where a token exists | The role token |
| `font-weight: 700` or more on a heading system | 500–600 |
| A timer, price or number column without `tabular-nums` | Add it |
| `:hover` outside `@media (hover: hover)` | Wrap it |
| `:active` scale with no `:disabled` exclusion | `:not(:disabled):active` |
| `<input>` under 16px with no phone override | 16px on phones |
| `height:` fixed on a box that holds text | `min-height` |
| `width: 100vw`, or `100vh` on a phone pane | `100%`, `100dvh` |
| More than nine font sizes or four radii on one screen | Collapse to the scale |
| A motion with no `prefers-reduced-motion` branch | Add the resting state |
| A raw number, amount or ISO date in the interface (`54000`, `2027-02-12`) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.PluralRules`; a word for zero and for missing ("Unpaid", "No date") |
| Data written into the page as HTML (`innerHTML` with a name or title) | Escape it, or set `textContent` |
| A flex or grid child holding text without `min-width: 0` | Add it, then choose wrap, clamp or truncate with the full value in `title` |
| Column or field labels in tracked capitals or monospace | Sentence case in the body face |
| Lines in both directions, or a rule wider than its content | [lines](references/lines.md) |
| `margin-left`, `pr-4`, `left:`, `text-align: left` on layout that should mirror | The logical form (`margin-inline-start`, `pe-4`, `inset-inline-start`, `start`); see [layout](references/layout.md) |
| `@media (max-width` inside a reusable component | `@container` on its wrapper |
| A sentence built around a variable, or `n === 1 ? "" : "s"` | One message with a plural argument; see [writing](references/writing.md#written-to-be-translated) |
| A sticky header with no `scroll-padding-block-start` | Set it to the header height |
| A list, table, card or profile only ever seen with tidy demo data | Run `seenry-break` |

`node ../seenry/scripts/audit_page.mjs <url or file> --widths 1440,390` counts the sizes, weights, radii and colors a page really renders and lists off-grid spacing, radius mismatches and near-miss edges. It needs Playwright in the project.

## Deeper files

Read one only when the task is in that area.

| Area | File |
| --- | --- |
| Type: scale, wrapping, fonts, numbers | [typography](references/typography.md) |
| Color: ramps, tokens, dark mode, contrast | [color](references/color.md) |
| Tokens, spacing scale, grid, density | [system](references/system.md) |
| Alignment and optical corrections | [alignment](references/alignment.md), [optical](references/optical.md) |
| Icons, hit areas, borders, small details | [craft](references/craft.md) |
| Rules, dividers and borders: when to draw one and how | [lines](references/lines.md) |
| Layout that survives resizing, translation and right-to-left | [layout](references/layout.md) |
| Component anatomies with measured defaults | [components](references/components.md) |
| Accessibility checks | [accessibility](references/accessibility.md) |
| Phone browser quirks | [mobile web](references/mobile-web.md) |
| Interface copy | [writing](references/writing.md) |

Parts of this skill adapt MIT-licensed work by Jakub Krehel and Emil Kowalski; see [the notice](licenses/NOTICE.md).
