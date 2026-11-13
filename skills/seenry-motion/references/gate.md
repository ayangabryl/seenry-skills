# The motion gate

One test decides both directions: whether a still thing should start moving, and whether a moving thing should stop. `seenry-motion` uses it to find motion worth adding; `seenry-subtract` uses it to remove motion that cannot defend itself; `seenry-audit` uses it to rank findings.

## Contents

- Frequency
- Purpose
- Budget
- Function
- Finding motion to add
- Removing motion
- Reducing instead of removing
- Hazards before deleting
- Cleanup
- Report formats

## Frequency

| How often a person sees it | Verdict |
| --- | --- |
| 100+ times a day: shortcuts, command menu, core navigation, arrow-key movement | No motion, ever. Raycast opens instantly, and that is correct |
| Tens of times a day: hover, row selection, frequent toggles, list expansion | Nothing, or a barely visible version |
| Occasionally: menus, dialogs, sheets, toasts, settings | Standard motion |
| Rarely or once: onboarding, first success, empty states, celebration | The delight budget |

Anything a keyboard triggers is in the first row, whatever its count.

## Purpose

Name one, in one word, or it does not move:

| Purpose | Example |
| --- | --- |
| Feedback | Press scale, a hold-to-confirm fill |
| Orientation | A toast leaving the edge it came from; a panel growing from its trigger |
| State | A button morphing to its loading state, an accordion opening |
| Continuity | Content that would otherwise teleport, appear or vanish |
| Explanation | Showing how a feature works, on marketing and onboarding only |
| Delight | Only in the rare tier |

"It looks nice" is not a purpose.

## Budget

| Element | Duration |
| --- | --- |
| Press feedback | 100–160ms |
| Tooltip, small popover | 125–200ms |
| Menu, dropdown, select | 150–250ms |
| Dialog, drawer | 200–500ms |
| Marketing, explanation | Longer when the motion is the message |

Product UI stays under 300ms. A moment that only works slow and showy fails.

## Function

Data a person is reading or acting on (charts, tables, totals, dashboards) does not move for style. It may move to show a real change in value caused by the person, never on every mount or refresh. A cursor-following effect is fine on a marketing page and wrong on a banking chart.

## Finding motion to add

Hunt these seams, then put every candidate through the four questions above. Expect to reject most. Cap the list at five to seven for a whole app, fewer for one view, ordered by leverage.

| Seam | Suggest |
| --- | --- |
| A pressable with no `:active` state | `scale: 0.97`, `transition: scale 160ms var(--ease-out)` (0.95–0.98) |
| A destructive action with a plain click | Hold to confirm: a `clip-path: inset(0 100% 0 0)` overlay filling over 2s `linear` while held, snapping back in 200ms `--ease-out` on release |
| Content that swaps, appears or vanishes instantly | Enter from `scale: 0.95–0.97` and `opacity: 0` with `--ease-out`, via `@starting-style` |
| An accordion that snaps | Height (grid track or `interpolate-size`) with opacity |
| List items added or removed with no bridge, on a list that is not high-frequency | Transitions, not keyframes, so rapid changes retarget |
| A panel or menu with no tie to its trigger | Scale from `transform-origin` at the trigger (Base UI exposes `var(--transform-origin)`); dialogs stay centered |
| A toast or sheet leaving a different way than it came | The same edge both ways, with `translate: 0 100%` rather than pixel offsets |
| A grid that pops in all at once, seen occasionally | A 30–80ms stagger that never blocks clicks |
| A drag that snaps with no physics | A spring seeded with the release velocity, dismiss on distance or velocity (> ~0.11 px/ms), rubber-band at edges |
| A rare high-emotion moment rendered flat | Spend the delight budget here |

Useful searches: conditional renders with no transition (`{isOpen &&`, `display: none` toggles), click handlers on elements with no `:active` style, `details` markup, drag handlers, `.map(` over entering lists, empty and success components.

## Removing motion

The burden of proof is on the animation. Walk every one through this tree and record the branch that decided it.

```
Triggered by the keyboard (shortcut, command menu, focus jump, arrow keys)?
└── Yes → DELETE.

Seen 100+ times a day (core navigation, tabs, list rows, in-app route changes)?
└── Yes → DELETE.

On data the person reads or acts on?
└── Yes → DELETE, unless it shows a real change the person caused.

Can you name its purpose?
├── No → Is it a rare, first-time moment?
│        ├── Yes → KEEP: the delight budget.
│        └── No → DELETE.
└── Yes → Seen tens of times a day?
          ├── Yes → REDUCE.
          └── No → Over budget (UI over 300ms, or a slide where a fade says the same)?
                   ├── Yes → REDUCE.
                   └── No → KEEP.
```

Marketing pages get more room: one hero entrance and real explanation can stay. A reveal on every section still fails; it holds content back from people who scroll fast, on every visit.

Deleting everything is also wrong. Motion that bridges a jarring change (a toast that would teleport in, a panel that needs to show where it came from) keeps its place.

Where it hides:

- **Keyboard and frequent:** a command menu, menu or dialog opened by a shortcut with an enter or exit animation; sliding or crossfading tabs and segmented controls; in-app route transitions; hover transforms on rows people sweep across.
- **Decoration:** fade-in-on-scroll everywhere (`whileInView`, IntersectionObserver reveal classes, AOS, `animate-fade-in`); hover scale or lift on secondary cards; infinite pulses, glows, gradient orbs, spinning icons that are not loading; staggers on lists loaded many times a day.
- **Data:** charts redrawing from zero on mount, numbers counting up on load, table rows animating in.
- **Over-building:** spinners and skeleton shimmer on work that finishes under 300ms (the flash reads as a glitch); `transition: all`.

Searches: `transition`, `animation`, `@keyframes`, `motion.`, `animate={`, `whileInView`, `whileHover`, `AnimatePresence`, `layout`, `stagger`, `infinite`, `animate-`, `IntersectionObserver`, `transition: all`.

## Reducing instead of removing

A smaller version of the same motion, never a different one:

| Today | Reduced |
| --- | --- |
| Hover with scale, lift or a growing shadow | Color or opacity only, 150ms or less, `ease` |
| Slide or scale entrance on a frequent surface | Opacity only, 150ms, `--ease-out` |
| UI animation over 300ms | 200–250ms, same curve |
| Stagger over 80ms per item or 300ms in total | 30ms per item, or the group fades as one |
| An infinite loop on a persistent element | Once, or the static end state |

If the reduced motion no longer carries its purpose, delete it.

## Hazards before deleting

Removal is not find-and-replace. Check each:

- **Hidden start states.** `opacity: 0` keyframes with `animation-fill-mode: forwards`, `initial={{ opacity: 0 }}`, reveal classes waiting for an observer. Delete the start state with the animation, or the element stays invisible.
- **Code waiting for the animation.** `onAnimationEnd`, `transitionend`, `onExitComplete`, `setTimeout` sized to a duration. Remove the wait too.
- **Exits that delay unmount.** Without its exit, an `AnimatePresence` child unmounts at once; move what ran in `onExitComplete` to where it closes.
- **Layout animation hiding a jump.** If removing `layout` or a FLIP reveals a jump, keep it and report the jump.
- **Focus moved in an animation callback** must move immediately.
- **Tests and selectors** that wait for animation classes or durations.

Never change easing or retune a spring while removing; list badly built motion that should stay for `seenry-audit`. Respect a comment or document that explains why an animation exists. Propose, never perform, removing a motion library.

## Cleanup

Delete what removals orphaned: unreferenced `@keyframes` and utilities, `motion.div` back to `div` where no motion props remain, empty `AnimatePresence` wrappers and unused variants, unused motion imports, unused animation entries in Tailwind config or tokens. Then search for every removed name to confirm nothing references it, and run the type checker and tests.

## Report formats

**Adding:** one table, then what you rejected.

| # | Location | Today | Purpose | Frequency | Motion, with exact values |
| --- | --- | --- | --- | --- | --- |

Rejected (two to five, required): location, what it was, the question that killed it. Then one paragraph: how much motion this interface needs and the single highest-leverage suggestion.

**Removing:** one table ordered by how often people meet it, then what you kept.

| # | Location | Was | Verdict | Deciding branch |
| --- | --- | --- | --- | --- |

Kept (two to five, required): location and the purpose that saved it; plus badly built motion that stays, for `seenry-audit`. Then the cleanup done, any library you propose dropping, and what must be felt on a real device.
