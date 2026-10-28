# Depth and material

## The rule

**Depth is rare and therefore meaningful: one raised object per view, the primary action. Surfaces separate by tone and hairlines; shadows belong only to things that float.**

| Layer | Treatment |
| --- | --- |
| Page and panels | Flat. Separate by a one-step tone change or a 1px hairline, not both stacked |
| Cards | Flat with a hairline, or a tone step; no shadow at rest |
| Controls | Flat with a frame or tint, except the one primary |
| Primary action | The system's material, subtle: a 2–4% tonal body, a thin inner highlight, a hairline edge or contact shadow under 2px blur |
| Floating layers (menus, popovers, dialogs, toasts) | A layered soft shadow: a 1px contact shadow plus one ambient shadow, both low alpha, because they really sit above the page |

## Why

- **Signifiers without noise.** Norman's signifiers: a raised element says "press me". When everything is raised, nothing is signified; the primary loses its pull and the screen looks like a template (NN/g on flat design and its fixes: keep a few clear signifiers, not decoration).
- **Leaders measured.** Linear, Vercel, Stripe and Emil Kowalski's interfaces are hairline and tone; design.how's Glaze spends glass only on what is pressed, Quartz spends its key material on the primary. Restraint is the shared trait.
- **Elevation means position.** Material 3 and Apple's materials use elevation for layers that actually float. Shadows on static cards contradict the layering.

## Check

`system_check.mjs` counts visible controls per view whose computed style has a gradient body or an outer shadow with blur above 2px, and fails when more than one appears outside floating layers. It also fails cards with an outer shadow at rest.
