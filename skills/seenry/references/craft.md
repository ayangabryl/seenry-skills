# Craft details

The details that separate a shipped product from a generated one. Apply after the system, spacing and type are right; these do not rescue a weak structure.

## Optical alignment

Geometric alignment comes first and is covered in [alignment](alignment.md): keylines, cap-height and baseline alignment, glyph-level icon alignment and equal optical inset. The corrections below are applied on top.

- **Icons next to text** align to the text's cap height center, not the line box. With 14px text and a 16px icon, nudge the icon 0–1px as needed; check at 2x zoom.
- **Play / triangle icons** sit 1–2px right of geometric center inside circles.
- **Round shapes look smaller** than squares of the same size: a circular avatar next to a square logo tile needs ~5–8% more size to match optically.
- **Text in pill buttons** looks low; lift 0.5px if the font's metrics sit low (check visually).
- **Large headlines** start slightly right of the text edge because of side bearings; pull back with `margin-inline-start: -0.04em` at 64px+ so they align with body text below.
- **Numbers and punctuation** hang: quotation marks in pull quotes outside the text edge.

## Hit areas

- Minimum 24×24 CSS px (WCAG 2.2), target 44×44 on touch. Small visual controls extend their hit area with padding or a `::before` inset of −8px, not with larger visuals.
- Adjacent targets: at least 8px apart, or merged into a single larger control.
- The whole row or card is clickable when it navigates; nested buttons inside it stop propagation and remain reachable by keyboard.

## Icons

- One icon family, one stroke weight (1.5px at 16–20px or 2px at 24px), one corner style, sized 16/20/24 only. Mixing Lucide with Heroicons with emoji is a tell.
- Icons support labels; they rarely replace them. Icon-only buttons get an `aria-label` and a tooltip.
- Icon color follows text color (`currentColor`), usually text-2, text-1 on hover/active.
- No decorative icon in front of every heading and every bullet.

## Borders, dividers, surfaces

- Prefer space to lines. When lines are needed, 1px at border-1, inset to the content edge in lists.
- Do not draw both a border and a shadow and a background change on the same card; choose one separation method per level.
- Nested containers: each level either changes surface or has a border, not both, and not the same as its parent.
- Hairline on translucent headers only after the page has scrolled.

## Focus and states

- Every interactive element has `:focus-visible` with a 2px ring in the focus color, offset 2px, following the element's radius. Never `outline: none` without a replacement.
- Hover changes one property by one step (background, border or text color). Hover must not move layout.
- Active/pressed: `scale(0.97)` on buttons, a darker step on rows. 100–160ms.
- Disabled: 40–50% opacity plus `cursor: not-allowed` and an explanation nearby when the reason is not obvious. Prefer keeping the action enabled and explaining on submit.
- Selected: surface or tint change plus a non-color indicator (check, weight, indicator bar).
- Loading: skeletons match final geometry; spinners only inside the control that triggered the work; never block the whole page for a partial update.

## Motion in components

- Enter/exit: opacity + 4–8px translate or scale 0.96→1, 150–220ms `cubic-bezier(0.23, 1, 0.32, 1)`. Exits faster than entrances.
- Popovers scale from their trigger (`transform-origin` at the trigger side); modals from center.
- Things used hundreds of times a day (command menus, keyboard actions) do not animate.
- Respect `prefers-reduced-motion`: keep opacity, remove movement.
- For anything larger, use `seenry-motion`.

## Images and media

- Consistent aspect ratios per context (16:10 for product shots, 1:1 avatars, 4:3 or 3:2 for photos).
- Product screenshots at 2x, cropped to the relevant region, framed with the same radius and ring as cards. Never a tilted screenshot with a heavy shadow floating on a gradient.
- `object-fit: cover` with a deliberate `object-position`.
- Always set `width` and `height` (or `aspect-ratio`) to avoid layout shift.

## Small things that read as quality

- `::selection` in accent-soft.
- Scrollbars subdued on dark UIs (`scrollbar-color`).
- `font-variant-numeric: tabular-nums` wherever numbers change.
- Consistent sentence case for all labels and buttons.
- Keyboard shortcuts rendered as `kbd` chips (12/500 mono, surface-2, radius 4, 20 tall).
- Favicons, page titles and Open Graph images set.
- No layout shift after fonts load: match fallback metrics with `size-adjust` or `font-size-adjust`.
