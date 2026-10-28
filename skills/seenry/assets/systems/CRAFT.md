# Craft standard

The contract makes a system complete; this file makes it premium. A system passes only when its controls feel made, not merely styled, and every state change moves with intent. Measured against the best published agent design systems, the gap is always the same: flat color swaps, one duration for everything, and components that do not move.

## Buttons are objects

Each system designs its own primary material, named in SYSTEM.md (a lit key, a slab with an under-glow, a soft pill with a warm sheen), built from layers rather than one fill:

| Layer | What it does | How |
| --- | --- | --- |
| Body | The color and its depth | `background-color` plus a gradient: lighter at the top or a soft radial core, never a flat fill on the primary |
| Edge | Separates it from the surface | `box-shadow`: an inset top highlight (0.5–1px, white at low alpha) and a hairline rim or a contact shadow below |
| Sheen | Catches light | `::after` with a top-to-transparent gradient, inset from the sides, its opacity animated on press |
| Hover | Brightens without a jump | `::before` holding the hover body, faded in with opacity over `--dur-state`; never a background swap that snaps |
| Press | Feels pressed | `scale: var(--scale-press)` (0.97–0.99) in `--dur-press` (50–80ms) with `--ease-out`, the sheen dims and the core darkens; release returns over `--dur-release` (160–220ms) |
| Pending | Keeps its place | label and spinner stacked in one grid cell (`grid-area: 1/1`); the label fades, the arc spins, width never changes |
| Disabled | Clearly off | material layers removed, a flat field with faint text; no opacity-only dimming on the primary |

Secondary buttons are a framed surface whose frame color changes on hover; ghost buttons gain a tint. One primary per view, one icon size per button size, labels optically centered (check the cap height, not the box).

## Motion tokens

`tokens.css` defines, and every transition uses:

```
--dur-press: 50–80ms     --dur-release: 160–220ms   --dur-state: 120–160ms
--dur-overlay: 160–220ms --dur-slide: 200–280ms     --dur-enter: 280–400ms
--ease-out: a fast-out curve such as cubic-bezier(0.2, 0.8, 0.2, 1)
--ease-in-out: for things that travel     --scale-press: 0.97–0.99
```

All durations become 0ms and `--scale-press` becomes 1 under `prefers-reduced-motion: reduce`.

## Every state change moves

| Component | Motion |
| --- | --- |
| Tabs, segmented control | the indicator or thumb slides to the new item over `--dur-slide` (seenry-ui places it; style the travel) |
| Switch | the thumb travels and the track crossfades color over `--dur-state` |
| Checkbox, radio | the check draws (`stroke-dashoffset`) or scales in from 0.6 with opacity |
| Menu, popover, select list, tooltip | scale from 0.96 and fade in from the trigger's side (`transform-origin`), over `--dur-overlay`; exit faster; tooltips wait about 400ms before opening |
| Dialog | backdrop fades; panel scales from 0.97 and fades over `--dur-overlay`, using `@starting-style` and `allow-discrete` so it also animates out |
| Sheet | slides from its edge over `--dur-slide` |
| Toast | slides up and fades in; the stack shifts smoothly when one leaves |
| Accordion, collapsible | height via `grid-template-rows: 0fr → 1fr` over `--dur-state` |
| Focus ring | grows from 0 to its width over `--dur-state`, keyboard only |
| Rows, list items, cards that open something | a tint in `--dur-state`; no movement, no shadow pop |
| Skeleton | a slow shimmer, removed under reduced motion |
| Charts | bars grow and lines draw once on first view over `--dur-enter`, staggered by a few tens of ms; never on every hover |
| Numbers that change | use `SeenryUI.number` so digits roll in place |

Motion never moves layout, never delays an accepted state, and never animates on keyboard-driven repeat actions.

## Typography and detail

- Optical sizes: tighter tracking on display sizes (−0.02 to −0.04em), none on body.
- Tabular figures in tables and stats; cents or units in a quieter color only where the system says so.
- Icons sit on the text's center line at the system's one stroke weight.
- Radii are concentric: an inner radius equals the outer radius minus the padding.
- Shadows are layered and soft (a contact shadow plus an ambient one), only on things that float.

`node scripts/system_check.mjs` checks the tokens, the button layers, the press and hover transitions, the overlay entrances and the reduced-motion branch.
