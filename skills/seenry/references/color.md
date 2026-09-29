# Color

In strong interfaces, neutrals do almost all the work and one accent does the rest. Color is assigned by role, never by component.

## Roles

| Role | Count | Rule |
| --- | --- | --- |
| Background | 1 | Page canvas. Slightly off-white (L 0.98–0.99) or near-black (L 0.13–0.17), never pure #000 for large dark areas. |
| Surface | 2 | Surface-1 for cards/inputs, surface-2 for wells, hovers, table headers. Each step ≈ 3–5% lightness. |
| Text | 3 | text-1 (primary, ≥ 12:1 on bg ideally), text-2 (secondary, ≥ 4.5:1), text-3 (tertiary/meta, ≥ 4.5:1 for text, 3:1 only for non-text). |
| Border | 2 | Alpha on the text hue: 6–8% for dividers, 12–16% for input borders. |
| Accent | 1 (+hover, +soft) | Primary actions, selection, focus, links, progress. Nothing decorative. |
| Status | 3–4 | positive, warning, negative, (info). Only for status and destructive actions. |

Tint all neutrals slightly with the accent or brand hue (chroma 0.002–0.01 in OKLCH) so greys feel of a piece. Pure grey next to a saturated accent looks cheap.

## Building a palette

1. Choose the accent from the brand, in OKLCH. Keep chroma realistic (0.12–0.2); ultra-saturated accents vibrate on white.
2. Derive hover (±0.05 L), soft (accent at 10–14% alpha) and the dark-mode accent (raise L to 0.65–0.75, lower chroma slightly).
3. Build neutrals from the same hue at tiny chroma: bg, surface-1, surface-2, border-1, border-2, text-3, text-2, text-1.
4. Status colors at matched lightness so none shouts louder than the others.
5. Check every text pair. Use [token contrast](../scripts/token_contrast.py) on the CSS or [contrast check](../scripts/contrast_check.py) on explicit pairs.

## Dark mode

- Not an inversion. Surfaces get lighter as they rise (bg 0.16 → surface 0.20 → raised 0.24). Shadows barely register; use inner hairlines at 6–10% white.
- Reduce accent chroma and raise its lightness; saturated colors glow on dark.
- Text-1 is off-white (L 0.94–0.97), not #fff, to avoid halation. Text-2 around L 0.72.
- Test images and illustrations on dark; add a subtle ring around images that blend into the background.

## Area and restraint

- Accent covers under 5% of a product screen and under 10% of a marketing page (excluding hero media).
- A page has one expressive color moment at most (a hero visual, a brand gradient in one place). Everything else is neutral.
- Colored backgrounds for whole sections: use at most one, and derive it from the palette (surface-inverse or accent at very low chroma).

## Charts and data

- Categorical: 4–6 hues at equal lightness; the first series uses the accent.
- Sequential: one hue from light to dark. Diverging: two hues around a neutral midpoint.
- Grid lines at border-1, axis labels 12px text-3, values tabular.

## Common failures

| Failure | Fix |
| --- | --- |
| Purple-to-blue gradient on hero text, buttons and backgrounds | Solid text; one accent; gradients only in one deliberate visual |
| Accent used for icons, headings, borders and links at once | Accent only on actions, selection and focus |
| text-3 grey body copy failing 4.5:1 | text-2 or darker |
| Pure #000 dark background with #fff text | L 0.16 bg, L 0.96 text |
| Status green used as the brand accent | separate the roles |
| Different greys in every component | route every grey through the 8 neutral tokens |
