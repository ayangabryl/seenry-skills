# Components

A component is built in four layers on the system grid, and specced before it is styled. The spec card is short, but it forces every decision that otherwise defaults to AI filler.

## The four layers

```
1. GRID          base unit, outer radius, inset
2. SAFE SPACE    padding box → named content areas → gaps
3. STRUCTURE     hierarchy placed into areas: title, body, caption, media, controls
4. TYPE + STATE  real sizes/weights (≤3 each), color roles, every state
```

**Layer 1: grid.** Start from the outer radius, then pick the inset. `inset >= radius / 2` keeps content clear of the curve; `inset == radius` gives a clean rectangular safe area. Common pairs: r24/i24 (feature cards, players), r16/i16 (standard cards), r12/i12 or r10/i12 (menus, popovers), r10/i4 (segmented and inline groups). Nested media follows `inner = outer − inset`.

**Layer 2: safe space and areas.** Draw the padding box. Inside it, name areas and give each one a fixed or flexible size: `media 96×96`, `text stack (flex)`, `controls row (auto)`, `meta (auto)`. Set gaps between areas on the scale, obeying the 2x rule: related items (title→subtitle) 4–8, areas (text→controls) 16–24.

**Layer 3: structure.** Choose one alignment edge (almost always the leading edge of the text stack) and align everything that is not deliberately centered to it. Decide what grows, what truncates (with `min-width: 0` and ellipsis or line clamp), and what wraps. Controls sit on a shared baseline or center line.

**Layer 4: type and states.** Assign type from the page scale, max 3 sizes and 3 weights inside the component. Most great components use 2 weights (400 + 500/600). Then render every state that can occur.

## Spec card

```
Component: <name>                     Used in: <pages>
Grid:   4px base · radius <r> · inset <i> · min/max width
Areas:  [area wxh] [area flex] ...
Gaps:   a→b <n> · b→c <n> ...
Type:   <size>/<weight> role · ... (≤3 sizes, ≤3 weights)
Color:  surface, text roles, accent usage
States: default · hover · active · focus-visible · disabled · loading · empty · error · selected · overflow
Ref:    <Seenry or site reference studied, and what was taken from it>
```

## Component anatomies

Measured defaults below match what leading product sites ship (see [benchmarks](benchmarks.md)). Use the project's density mode to choose between rows.

### Button

| Size | Height | Padding-x | Text | Radius (soft / pill) | Icon |
| --- | --- | --- | --- | --- | --- |
| sm | 28 | 10–12 | 13/500 | 8 / full | 14–16 |
| md | 36 | 14–16 | 14/500 | 10 / full | 16 |
| lg | 44–48 | 20–24 | 15–16/500 | 12 / full | 18–20 |

- Hierarchy: primary = filled accent or filled text-1 (inverted); secondary = surface fill + 1px border or ring; tertiary/ghost = text only with hover fill. One primary per region.
- Icon-leading padding: reduce padding on the icon side by 2–4px so the visual weight balances.
- Pressed: `transform: scale(0.97)` 100–160ms ease-out. Hover: background shift of one step, not a glow.
- Loading keeps width (spinner replaces the label in a reserved slot) and disables repeat submits.
- Never gradient fills, never a drop shadow bigger than level 2, never all-caps with wide tracking for product buttons.

### Input, select, textarea

- Height 36 (default) or 40–44 (comfortable); padding-x 12; radius md; 1px border-2; 14–16px text (16px on phone to stop iOS zoom).
- Label above, 13–14/500, 6–8px gap to the field. Help text below 12–13/400 text-2, 6px gap. Error replaces help text, in negative color, with an icon; the border turns negative.
- Focus: border accent + 3px focus ring (`0 0 0 3px var(--focus)`); no layout shift.
- Field group gap 16–20; section gap 32. Pair short fields (first/last name) side by side only on desktop.
- Placeholders are examples, never labels.

### Card

- Radius lg (16) with inset 16–24, or xl (24) with inset 24. Surface-1 on bg with a ring; no shadow unless it moves.
- Structure: optional media (full-bleed top with concentric top radius, or inset with `r − inset`), then text stack: eyebrow 12–13/500 text-3 (optional), title 16–20/600, body 14–15/400 text-2, then a meta/controls row pinned to the bottom (`margin-top: auto` in a flex column so rows of cards align).
- Clickable card: whole card is the hit target, hover lifts surface by one step or moves the ring to border-2; do not scale the card.
- Cards in a grid share the same height per row and the same internal area order.

### List row

- Height 32 (compact), 40–44 (default), 56–72 (with avatar and two lines). Padding-x 12–16.
- Areas: leading (icon 16–20 or avatar 24–40) · text stack (title 14/500, meta 13/400 text-2) · trailing (value, badge, chevron, or actions revealed on hover).
- Leading gap 12. Title and meta 2–4 apart. Separators inset to the text edge, not full width, or no separators with 2–4px row gaps and hover fills.
- Numbers right-aligned with `font-variant-numeric: tabular-nums`.

### Navigation bar (web)

- Height 56–64. Logo left, primary links (13–14/500, text-2 → text-1 on hover/active) grouped, actions right: one secondary (text or ghost) + one primary small button.
- Sticky with a translucent bg (`color-mix(in oklch, var(--bg) 80%, transparent)` + `backdrop-filter: blur(12px)`) and a hairline that appears only after scroll.
- Max 5–7 top-level links. Phone: logo + one CTA + menu button; the menu is a full-height sheet with 48px rows.

### Sidebar (app shell)

- Width 224–260, compact density: items 28–32 tall, 13/500, icon 16, radius 6–8, padding-x 8. Section labels 11–12/500 text-3, 16–24 above.
- Active item: surface-2 fill + text-1. Not an accent bar plus accent text plus bold.
- Workspace switcher at top, search/command right under it, settings and account at bottom.

### Tabs and segmented control

- Tabs (navigation between views): 13–14/500, text-2 inactive, text-1 active with a 2px underline indicator the width of the label; 16–24 between tabs; baseline-aligned with the section title.
- Segmented (switching a value): container surface-2, radius md, inset 2–3; thumb surface-1 with a raised shadow, radius `md − inset`. Item height 28–32. The thumb slides between items (200ms ease-out).

### Menu, dropdown, popover

- Radius 12, inset 4–6; items 32 tall, radius `12 − inset`, padding-x 8–10, 13–14/400; shortcut hints right-aligned 12/400 text-3 mono or tabular.
- Level-3 elevation. Origin-aware entrance: scale 0.96→1 + opacity from the trigger side, 150ms ease-out; exit faster (100ms).
- Separators 1px border-1 with 4px vertical margin. Destructive items in negative color at the end.

### Dialog and sheet

- Width 400–560 (confirm/form), 720+ (content). Radius 16–24, inset 24. Title 17–20/600, body 14–15/400 text-2, actions row right-aligned (desktop) or stacked full-width (phone), 24 above.
- Destructive confirm: name the object and consequence in the title ("Delete 'Q3 plan'?"); the destructive button says the verb.
- Phone: use a bottom sheet with a grabber (36×4, radius full, 8 from top) and safe-area padding.

### Table

- Container with a ring, radius lg, overflow hidden. Header row 32–36, 12–13/500 text-2, bg surface-2 or transparent with a bottom hairline.
- Body rows 40–48, 13–14/400, hairline separators. Numbers right-aligned and tabular; dates in one format; status as a small dot + label, not a colored full-cell fill.
- First column is the identity (name, not an ID). Row actions appear on hover at the end. Sticky header on long tables.

### Badge, tag, status

- Height 20–22, padding-x 6–8, 12/500, radius sm or full. Soft tint background (accent-soft or status at 12% alpha) with a readable foreground, not saturated fills with white text.
- Status dot 6–8px with label. Never rely on color alone.

### Toast

- Bottom-center or bottom-right, width 320–380, radius 12, inset 12–16, level-3 elevation. Icon 16 + one line of text 14/500 + optional action (text button). Stack max 3; enter from and exit toward the same edge.

### Empty state

- Inside the region that is empty, not a full page. A small (48–64) monochrome icon or illustration in text-3, a title 15–16/600 that states what is missing, one line of body text-2 saying why it matters, and one primary action that fixes it.

### Stat / metric tile

- Label 13/500 text-2 on top, value 28–40/500 tabular with -0.02em tracking, delta 13/500 in status color with an arrow, optional sparkline 24–32 tall. Units smaller than the number.

### Pricing tier

- Prefer one shared container divided by 1px lines (Vercel, Linear) over separate floating cards.
- Order inside each tier: plan name 13–14/500, price 32–48/500 tabular with the period 13–14/400 text-2 beside it, one-line description, CTA, then "Everything in X, plus:" and 5–8 features with 16px check icons.
- CTAs aligned on the same horizontal line across tiers. Only the recommended tier's CTA is filled; mark it with a small badge, not a scaled-up card.

### Media player (the reference card)

- r24/i24 card. Areas: art 96–120 square (r12–16, or `24 − inset` when art is inset), text stack (title 17/600, artist 15/400 text-2), transport row (prev · play/pause 44 circle · next, icons 20), progress bar 4 tall full-width with elapsed and remaining times 12/500 tabular text-3 underneath.
- 3 sizes (17, 15, 12), 2 weights (600, 400). Accent only on progress fill and play button.

## States checklist

Render and screenshot these before calling a component done:

- default, hover, active/pressed, focus-visible (keyboard), disabled
- loading (skeleton matching final layout, or reserved-width spinner)
- empty, error (with recovery), success
- selected / checked / expanded / current
- overflow: 2x longer text, 1-character text, 5-digit numbers, missing image, RTL if supported
- narrow container (320px) and wide container

## Research a component

Before building anything non-trivial, look at how 3–4 strong products render the same component. With Seenry MCP: `search_sections` with `element` set to the section kind, `search_app_screens` for mobile patterns, or `get_design` / `get_tokens` on a named site to read real radii, type and shadows. Record in the spec card's `Ref` line what you measured and adopted. See [research](research.md).
