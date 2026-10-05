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

## Build it as ramps, then roles

A color system is a few 11-step ramps (50–950) plus semantic tokens that point at them. Generate it, don't eyeball it:

```sh
python3 scripts/palette.py "#5b5bd6" --status --out tokens.css
```

[palette.py](../scripts/palette.py) builds the accent and a hue-tinted neutral ramp in OKLCH (and positive, warning and negative with `--status`), picks semantic roles for light and dark, and measures every text and control pair with both WCAG 2 and APCA. It exits non-zero if any pair fails. What it enforces, and what to keep if you build a ramp another way:

- **Even perceived lightness,** denser at the light end so 50 and 100 still read as two surfaces. HSL lightness is not perceptual; OKLCH `L` is.
- **Constant hue** end to end, **chroma peaking mid-ramp** and falling toward both ends; neither end reaches pure white or black.
- **The brand keeps its step.** A light brand (yellow, lime) stays the fill with dark text on it rather than being darkened into mustard; a mid brand that fails with white text moves its *fill* one step darker and keeps the original for decoration. `--pin` keeps the exact hex.
- **Neutrals get a darker end** than hues (dark-mode backgrounds live at 900–950) and a trace of the accent hue; a gray brand gets true grays.
- **Status ramps match the accent step for step** in lightness, so a red button and a blue button carry the same weight.

## Two tiers of tokens

Primitives are named by hue and step (`--accent-500`, `--neutral-200`) and never used in components. Semantic tokens are named by role and are the only thing components reference. Dark mode, high contrast and white-label themes repoint the semantic tier and touch nothing else.

| Group | Roles |
| --- | --- |
| Surfaces | `bg`, `bg-surface`, `bg-sunken`, `bg-hover`, raised surface, scrim |
| Text | `text`, `text-secondary`, `text-tertiary`, `text-disabled`, `on-accent` |
| Borders | `border` (decorative), `border-control` (identifies an input, needs 3:1), `separator`, `focus` |
| Accent | `accent-subtle`, `accent-border`, `accent-solid`, `accent-solid-hover`, `accent-text` |
| Status | per status shipped: subtle, border, solid, text |

Name with one grammar (`--color-{role}-{variant}-{state}`) and one word per concept (`text` not `fg`, `bg` not `background`, `accent` for the brand so `primary` can mean "most prominent"). Never borrow a token for its value: a separator used as text color breaks the day borders get lighter.

## Contrast: measure the rendered pair

Measure the foreground against the surface it actually sits on (a card, an image, a tint), in both themes.

| Content | WCAG 2 (compliance) | APCA Lc (perception, preferred for design) |
| --- | --- | --- |
| Body text | 4.5:1 | 75+ (90 preferred) |
| Labels, UI text, headings | 4.5:1 (3:1 at ≥ 24px or 19px bold) | 60+ |
| Large display text ≥ 36px | 3:1 | 45+ |
| Control boundaries, focus rings, meaningful icons | 3:1 | 30+ |

APCA is signed (light-on-dark is negative); compare the absolute value. `python3 scripts/palette.py --check FG BG` prints both. Fix a failing pair by changing lightness, not hue.

## Modern CSS color

- Author in `oklch()`; it is perceptual and supported everywhere current. Keep the project's notation if it already has one.
- Wide gamut: declare the sRGB value, then override inside `@media (color-gamut: p3)` with a more saturated `oklch()` or `color(display-p3 …)`.
- `color-mix(in oklab, var(--accent) 12%, transparent)` for tints and hover states instead of new tokens per opacity.
- Relative color syntax, `oklch(from var(--accent) calc(l - 0.05) c h)`, for a hover step derived from the base.
- Gradients: `linear-gradient(in oklab, …)` for even brightness; `in oklch` to sweep through hues without going gray; the sRGB default muddies the middle.
- `light-dark(#fff, #111)` with `color-scheme: light dark` for simple two-theme values. Choose one switching mechanism (media query, class or `data-theme`) and use it everywhere.
- Support `prefers-contrast: more` (strengthen borders and secondary text) and `forced-colors: active` (use system colors; don't rely on backgrounds or shadows for boundaries).

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
| Different greys in every component | route every grey through the neutral semantic tokens |
| Primitive like `--blue-500` used in a component | point a semantic token at it |
| Ramp built by varying HSL lightness | regenerate with `palette.py` (OKLCH) |
| Light brand darkened until white text passes | keep the brand fill, use dark text on it |
| Two theme mechanisms (media query for some tokens, class for others) | one mechanism throughout |
