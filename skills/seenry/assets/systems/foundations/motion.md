# Motion

## The rule

- **Should it move at all:** actions done many times a minute (keyboard navigation, typing, command menu) are instant. Occasional changes (menus, dialogs, toasts) move. Rare moments may have character.
- **Duration by distance and size:** press feedback 50–80ms, small state changes 120–160ms, overlays 160–220ms, things that travel across a panel 200–280ms, entrances of large content 280–400ms. Exits are 20–35% faster than entrances.
- **Easing:** ease-out for things entering or responding, ease-in-out for things travelling between two places, linear only for progress. Never ease-in on interface motion.
- **Origin:** menus and popovers grow from their trigger; dialogs from the center; sheets from their edge.
- **Properties:** transform, opacity, clip-path and filter only. Never width, height, top, left or margin; height via `grid-template-rows` or `interpolate-size`.
- **Interruptible and on one clock:** transitions retarget from the current value; delays live in CSS; handoffs wait for `transitionend` or `finished`, never timers.
- **Reduced motion:** movement, scale and parallax removed; short opacity changes kept.

## Why

Material 3's duration and easing tokens, Apple's motion guidance, Emil Kowalski's frequency rule and timing tables, and Seenry's own motion judge findings (timers drift from the animation clock and break sequences under slow motion).

## Check

`system_check.mjs` checks the motion tokens, the reduced-motion branch and the absence of layout-property transitions; `motion_judge.mjs` films each component.
