# Craft details

The details that separate a shipped product from a generated one. Apply after the system, spacing and type are right; these do not rescue a weak structure.

## Optical alignment

Geometric alignment comes first and is covered in [alignment](alignment.md): keylines, cap-height and baseline alignment, glyph-level icon alignment and equal optical inset. The full set of optical corrections with numbers, and how to measure them on any page, is in [optical](optical.md). A summary:

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

- One family, one stroke convention, sized 16/20/24 (or `1em`–`1.25em` inline so icon and text scale together). Mixing Lucide with Heroicons with emoji is a tell.
- **Match stroke to the adjacent text weight** (24px grid): 1.5px beside regular (400) text, 2px beside medium and semibold (500–600), 2.5px beside bold or as a standalone emphasis. A hairline icon next to a bold label looks broken.
- **Outline by default, filled for the active state** (current tab, toggled bookmark, liked). Never mix the two variants arbitrarily.
- **One SVG, recolored by state:** `currentColor` for fill or stroke, color and opacity from CSS for hover, selected and disabled. Strip hard-coded fills when importing.
- Icons support labels; they rarely replace them. Icon-only buttons get an `aria-label` and a tooltip.
- Directional icons (back, forward, send, reply, progress chevrons) mirror in RTL with `:dir(rtl) .icon-directional { scale: -1 1; }`; clocks, media play buttons and checkmarks do not.
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

- **Image outline:** every image, avatar and thumbnail gets `outline: 1px solid oklch(0 0 0 / 0.1); outline-offset: -1px;` in light mode and `oklch(1 0 0 / 0.1)` in dark. Pure black or white at low alpha only; a tinted gray reads as dirt on the edge. `outline` never changes layout and follows the radius.

- Consistent aspect ratios per context (16:10 for product shots, 1:1 avatars, 4:3 or 3:2 for photos).
- Product screenshots at 2x, cropped to the relevant region, framed with the same radius and ring as cards. Never a tilted screenshot with a heavy shadow floating on a gradient.
- `object-fit: cover` with a deliberate `object-position`.
- Always set `width` and `height` (or `aspect-ratio`) to avoid layout shift.

## Transitions hygiene

- Name the properties (`transition-property: scale, opacity, background-color`); never `transition: all`.
- High-frequency feedback (hover, focus, toggles) is instant or ≤150ms on color and opacity only.
- **Theme switch:** disable all transitions for the frame the theme flips, or every color animates at once and the page smears (recipe in `seenry-motion`).
- **First render:** no entrance animations on initial page load; they are for changes the user causes.
- `will-change` only on an element that stutters on its first frame, and remove it after.
- Every animated state change also leaves a static cue (color, icon or label) for reduced motion.

## Small things that read as quality

- `::selection` in accent-soft.
- Scrollbars subdued on dark UIs (`scrollbar-color`).
- `font-variant-numeric: tabular-nums` wherever numbers change.
- Consistent sentence case for all labels and buttons.
- Keyboard shortcuts rendered as `kbd` chips (12/500 mono, surface-2, radius 4, 20 tall).
- Favicons, page titles and Open Graph images set.
- No layout shift after fonts load: match fallback metrics with `size-adjust` or `font-size-adjust`.
