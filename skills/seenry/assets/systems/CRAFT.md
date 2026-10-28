# Craft standard

The contract makes a system complete; this file makes it premium. A system passes only when its controls feel made, not merely styled, and every state change moves with intent. Measured against the best published agent design systems, the gap is always the same: flat color swaps, one duration for everything, and components that do not move.

## Material budget: one made object per view

Premium is restraint first. The best product UIs (Linear, Vercel, Stripe, Emil Kowalski's own work) are flat hairline surfaces where depth is rare and therefore meaningful. A screen full of raised, glossy, 3D buttons reads as a template, not as craft. So each system spends depth on exactly one thing per view, the primary action, and everything else is flat and precise. See [depth and material](foundations/depth.md).

| Control | Treatment |
| --- | --- |
| Primary (one per view) | The system's named material, kept subtle: a body that is at most a gentle 2–4% tonal gradient, a 0.5–1px inner top highlight at low alpha, a hairline edge or a soft contact shadow under 2px blur radius at rest. Hover fades in a slightly lighter body on `::before` over `--dur-state`. Press scales to `--scale-press` (0.97–0.99) in `--dur-press` (50–80ms); release over `--dur-release` (160–220ms). No glow halos, no thick bevels, no visible gloss bands on light themes. |
| Secondary | Flat surface with a 1px frame; the frame and fill shift a step on hover; the same press scale. No gradient, no highlight. |
| Ghost, icon, menu items, tabs, chips | Flat; a tint on hover and pressed. |
| Pending | Label and spinner stacked in one grid cell; the label fades, the arc spins, width never changes. |
| Disabled | Flat field and faint text; material removed; never opacity alone on the primary. |

The test: cover the primary and the screen should look like a well-set document, all hairlines and type. If anything else looks raised, it is over-designed.

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

Sequence motion on the animation clock, not on timers: delays live in CSS (`transition-delay`), and one step hands off to the next on `transitionend` or an animation's `finished` promise, never `setTimeout`. Timers drift from the animation clock under slow motion, reduced frame rates and the motion judge, so handoffs fire out of order. Keep a finite animation running through any wait so the state never looks settled early.

## Foundations

Every value traces to [the foundations](foundations/README.md): radius, focus, dividers, depth, targets, type, color and motion, each with its research and a check. They outrank taste.

## Typography and detail

- Optical sizes: tighter tracking on display sizes (−0.02 to −0.04em), none on body.
- Tabular figures in tables and stats; cents or units in a quieter color only where the system says so.
- Icons sit on the text's center line at the system's one stroke weight.
- Radii are concentric: an inner radius equals the outer radius minus the padding.
- Shadows are layered and soft (a contact shadow plus an ambient one), only on things that float.

`node scripts/system_check.mjs` checks the tokens, the button layers, the press and hover transitions, the overlay entrances and the reduced-motion branch.
