# Optical alignment

Geometric alignment makes edges mathematically equal. Optical alignment makes them *look* equal, because the eye judges mass, not boxes. Do geometric alignment first ([alignment](alignment.md)), then apply these corrections. They apply to every project, framework and component, not only the examples here.

Every correction below is small (0.5–4px at UI sizes). If you need more, the geometry is wrong, not the optics.

## Centering

**Icon-only buttons.** Center the icon's *ink*, not its SVG box. Icon sets pad glyphs unevenly inside their viewBox, so a centered `<svg>` can still sit off center.

**Asymmetric shapes** (play triangles, arrows, chevrons, send icons, speech bubbles) look off center when their bounding box is centered, because their mass leans one way. Center them on the midpoint between the ink box center and the ink centroid:

| Shape | Typical nudge at 16–24px |
| --- | --- |
| Play triangle ▶ in a circle | 1–2px toward the point (right) |
| Chevron › or ‹ | 0.5–1px away from the point |
| Arrow → | 0.5px toward the tail |
| Send / paper plane | 1px down-left |

Many icon sets pre-compensate (Lucide's play is drawn right of center in its viewBox). Measure; don't nudge blindly.

**Text in buttons, pills, badges and inputs** is centered on its cap height, not its line box. Lowercase-only labels read best centered between x-height and baseline; mixed case uses cap height. Use `text-box: trim-both cap alphabetic` on the label, then equal `padding-block`. Without it, fonts with tall ascenders sit visibly low.

**Icons beside text** are centered on the text's cap-height center, not the line box and not the x-height (except with all-lowercase labels). A 16px icon beside 14px text usually needs `translate: 0 -0.5px` to `-1px` when aligned with `align-items: center`.

## Size

**Shapes of equal box size do not look equal.** At the same height:

| Shape | Scale up by |
| --- | --- |
| Circle vs square | 5–10% |
| Triangle vs square | 10–15% |
| Thin-stroke icon vs filled icon | stroke icon 1 step larger, or filled icon 1 step smaller |

A row of icons (square app tile, round avatar, triangular warning) must be balanced by eye after sizing to the grid.

**Round letters overshoot.** Fonts already make O, C, S slightly taller than H. Do the same for UI shapes: a round badge beside a square one gets 1–2px more diameter.

## Edges

**Headline side bearing.** Glyphs have built-in space on their left. At 32px and above it becomes visible: a large headline starts right of the body text below it. Pull it back with `margin-inline-start: -0.02em` to `-0.06em` (measure the actual glyph; H, B, E, D need more than V, W, A, T).

**Hanging punctuation.** Pull opening quotes, bullets and list markers outside the text edge so the letters align: `hanging-punctuation: first` (Safari) or a negative `text-indent` equal to the mark's width.

**Numbers.** In tables and stat tiles, align numbers right with `tabular-nums` so digits line up. A leading "1" in proportional figures looks indented; tabular figures fix it.

**Icon-leading buttons.** An icon's padding makes its side look emptier, so the ink insets should be unequal: icon side 2–4px smaller than the text side (e.g. `padding: 0 16px 0 12px`). Trailing icons mirror this.

## Weight and color

**Dark on light looks bigger than light on dark.** White text on a dark button reads heavier; drop one weight step (600 → 500) or 0.5px size for inverse text. The same icon on a dark fill often needs to be 1px smaller.

**Thin elements need contrast to align.** A 1px hairline and a filled block with the same edge look misaligned because the eye reads the block's edge as further out. Inset hairlines 0.5–1px or align to the block's visual edge.

## Rounded containers

**Content inside pills and rounded cards** needs more horizontal than vertical padding (about 1.5–2x for pills) because the curve eats into the usable width. A 40px-tall pill button takes 16–20px side padding, not 12.

**Concentric radii are optical, not just geometric.** When the inset is tiny (2–4px), `inner = outer − inset` can look too sharp; round up by 1–2px.

## Measure it

Run the audit on any rendered page (dev server URL, deployed page or local file):

```sh
node scripts/audit_page.mjs http://localhost:3000 --widths 1440,390 --shots .seenry/audit
```

It needs Playwright (`npm i -D playwright && npx playwright install chromium`, or pass `--playwright /path/to/playwright/index.mjs`). The optical part ([optical_audit.mjs](../scripts/optical_audit.mjs)) rasterizes every icon to measure its ink and reports:

- `iconOnly`: icon buttons whose ink is not optically centered, with the `translate` to apply.
- `iconText`: icons whose ink center misses the adjacent label's cap-height center.
- `controlText`: labels not centered on their cap height, and unbalanced horizontal ink insets (with the expected icon-side difference).
- `sideBearing`: large headlines whose first glyph starts right of the text below, with the `em` pull-back.

On Linear, Stripe, Vercel and Apple Music the audit reports 0–5 candidates each, mostly single pixels; on a page that ignored these rules it reports the real errors. Findings are candidates: confirm each on a 2x screenshot, fix in the component or token (not per instance), and rerun.
