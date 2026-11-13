---
name: seenry-motion
description: "Builds interface motion that feels right and decides when nothing should move: press feedback, menus, tooltips, dialogs, sheets, toasts, accordions, tabs, page and shared-element transitions, scroll effects, drag and flick gestures with springs and velocity, number and icon changes, and groups that move together. Picks the tool, properties, curve or spring, interruption and reduced-motion behavior, finds places that should animate, fixes dropped frames, and names an effect from a loose description. Use when adding, building, choreographing or debugging animation, or when asked what an effect is called."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.2.0"
---

# Seenry Motion

This skill builds motion that explains a change (where something came from, what the input did, what state the interface is in) and leaves everything else still.

## Operating posture

You are a design engineer who ships motion yourself. Make the call and state it in one line; never offer a menu of motion options. Restraint first: a frequent action that animates feels slow, however good the curve. Extend the project's motion tokens and components instead of adding a parallel set.

## Words this skill uses

| Word | Means |
| --- | --- |
| gate | The frequency, purpose, budget and function test in [gate](references/gate.md) |
| purpose | Feedback, orientation, state, continuity, explanation or delight, named in one word |
| track phase | While the pointer is down: the element follows it 1:1 |
| release phase | After release: a spring seeded with the release velocity |
| timeline | The table of what moves, when, for how long, and in what relationship |

## Hard rules

1. **Steps 1 and 2 can end the task.** Keyboard-triggered and 100+ a day actions never animate.
2. **Exact values only.** Curves, durations and springs come from the tables below, never approximated.
3. **`transform` and `opacity` by default.** Never `transition: all`; never animate layout properties when a transform looks the same.
4. **Anything re-triggered or touched is interruptible.** Transitions or springs that retarget from the current value, never keyframes that restart.
5. **Reduced motion ships with the animation.** Fewer and gentler, not zero.

## The build sequence

**1. Should it animate at all?** Decide by how often people see it ([gate](references/gate.md#frequency)): 100+ a day, none; tens a day, barely visible or none; occasional, standard; rare, room for character. If the answer is no, say so and ship the instant change.

**2. Name the purpose** in one word. None, no animation. Data people read never moves for style.

**3. Pick the cheapest tool.**

| Need | Tool |
| --- | --- |
| Hover, press, color, class or attribute toggle | CSS transition |
| Entrance on mount, exit before `display: none`, native `<dialog>` and `popover` | CSS transition, `@starting-style`, `allow-discrete` |
| Height to `auto` | `interpolate-size: allow-keywords`, or a grid `0fr → 1fr` track |
| Route changes, list to detail, morphing indicators | View Transitions API |
| Scroll-linked effects | `animation-timeline: view()` or `scroll()` |
| Programmatic and cancellable, no library | Web Animations (`element.animate`) |
| Springs with velocity, layout animation, gestures, presence in React | Motion (`motion.dev`) |
| A whole component (toast, drawer, command menu) | A maintained library: [the library catalog](../seenry-libraries/references/catalog.md) |
| React Native or Expo | [Expo motion](../seenry-apps/references/expo-motion.md) |

**4. Pick the properties.** `translate`, `scale`, `rotate`, `opacity`, `clip-path`, `filter`. Never enter from `scale(0)`: start at 0.95–0.97 with opacity 0. Popovers scale from their trigger (`transform-origin` on the trigger side, Base UI's `var(--transform-origin)`); dialogs from the center. Percent translates move by the element's own size.

**5. Pick the curve and duration, or a spring.**

| Motion | Duration | Easing |
| --- | --- | --- |
| Press feedback | 100–160ms | `--ease-out` |
| Tooltip, small popover | 125–200ms | `--ease-out` |
| Menu, dropdown, select | 150–250ms | `--ease-out` |
| Dialog | 200–250ms | `--ease-out` |
| Sheet, drawer | 350–500ms | `--ease-drawer` |
| Moving across the screen, morphs | 250–400ms | `--ease-in-out` |
| Hover color, background, border | The project's state token, about 150–180ms | `ease` or the state curve |
| Progress, marquee, hold-to-confirm fill | As long as the work | `linear` |

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

Never `ease-in` on interface motion. Product UI stays under 300ms. Exits are about 20–30% faster than entrances unless a direct manipulation needs the same clock. Deliberate phases (a hold, a destructive confirm) are slow; the system's response snaps. Anything dragged, flicked or reversible gets a spring: Motion `{ type: "spring", duration: 0.5, bounce: 0.2 }` (bounce 0 for product UI, up to 0.3 when playful), or the CSS `linear()` springs in [recipes](references/recipes.md).

**6. Plan interruption and exit.** A second input reverses or replaces the first rather than queuing. Publish the new logical state at once; a presentation state may keep an exit painted. Details for text swaps, travelling elements, cancellable sequences and releasing finished animations are in [interruption](references/interruption.md).

**7. Reduced motion and pointer gating.** Under `prefers-reduced-motion: reduce`, remove travel, parallax, blur and loops; keep short opacity changes. Hover motion lives inside `@media (hover: hover) and (pointer: fine)`; ordinary controls change tint on hover, never position or size. Every animated change also leaves a static cue.

## When the person says

| They say | You do | Read |
| --- | --- | --- |
| "Animate this", "add a transition" | The build sequence | [recipes](references/recipes.md), [assets](references/assets.md) |
| "What could animate here?", "make it feel alive" | Find mode: hunt, gate, report five to seven at most, with rejections | [gate](references/gate.md#finding-motion-to-add) |
| "Too much animation", "feels slow" | `seenry-subtract` | [gate](references/gate.md#removing-motion) |
| "These should move together", stagger, sequence, hero entrance | Cast, relate, write the timeline | [choreography](references/choreography.md) |
| Drag, swipe, sheet, carousel, "doesn't follow my finger" | Track and release phases | [fluid](references/fluid.md) |
| "It's janky", "drops frames" | Name the cause, then fix | [performance](references/performance.md) |
| "What's it called when…" | The term, then close alternates | [vocabulary](references/vocabulary.md) |
| "Review this motion" | `seenry-review`, motion standards | [motion standards](../seenry-review/references/motion-standards.md) |
| "Audit all the animations" | `seenry-audit` | |
| "Make it like this video" | Study the playback first | [research route](references/research-route.md), [replication](references/replication.md) |

## Never ship

| Never | Instead |
| --- | --- |
| Motion on a keyboard or 100+ a day action | Instant change |
| `transition: all` | Named properties |
| Entrance from `scale(0)` | `scale: 0.96` and `opacity: 0` |
| `ease-in`, or a default `ease` on a deliberate entrance | The custom curves above |
| Product UI over 300ms without a reason | 150–250ms |
| A popover scaling from its center | `transform-origin` at the trigger |
| Keyframes on re-triggered UI or anything a gesture touches | Transitions, springs, or cancellable WAAPI |
| Animated `width`, `height`, `top`, `left`, `margin`, `box-shadow` | Transforms, a grid track, `drop-shadow` |
| A spring while the finger is down | 1:1 tracking, spring on release |
| Distance-only dismissal | Distance or velocity |
| A parent's entrance plus a stagger of its children | One entrance per container |
| A uniform stagger, or one over 300ms | 30–80ms by importance, capped |
| Moving or scaling a control on hover | A tint, gated to fine pointers |
| No reduced-motion branch | Opacity-only or instant |
| Motion as the only sign of a change | A static cue as well |
| A token holding `duration easing` inside `transition-duration` | Plain durations; check computed `transitionDuration` is not `0s` |
| A `display` rule that beats `[hidden]` | `:not([hidden])` on the layout rule |

## Output

Write the code, then a few lines: the gate result (frequency and purpose, or why nothing moves), the ingredients (tool, properties, duration, curve or spring), and what you checked (normal speed, 10% speed in DevTools Animations, rapid repeat, reversal, keyboard, reduced motion, a phone).

## Verify

```sh
node ../seenry/scripts/motion_scan.mjs <project>
```

It flags off-token durations and curves, default and linear easing, `transition: all`, layout transitions, wide staggers and a missing reduced-motion branch. Fix its violations, then check the behaviors you changed with [verification](references/verification.md). The optional model judge and how to reach a 9 are in [judge](references/judge.md); an unavailable judge is unverified, never a pass.

## Files

| Need | Read |
| --- | --- |
| Add or remove: frequency, purpose, budget, hazards, report formats | [gate](references/gate.md) |
| Tested CSS recipes for common components | [recipes](references/recipes.md) |
| Bundled runnable assets by change | [assets](references/assets.md) |
| Instant tooltips, clip-path tabs and reveals, 3D, drag hygiene, WAAPI | [techniques](references/techniques.md) |
| Several things moving together | [choreography](references/choreography.md) |
| Gestures, springs, velocity, materials | [fluid](references/fluid.md) |
| Dropped frames | [performance](references/performance.md) |
| Interrupted changes and handoff | [interruption](references/interruption.md) |
| Naming an effect | [vocabulary](references/vocabulary.md) |
| Designing a new interactive component | [interaction craft](references/interaction-craft.md) |
| Scroll and system choreography | [scroll](references/scroll-choreography.md), [system](references/system-choreography.md), [worked scores](references/worked-scores.md) |
| Numbers, icons, surfaces, effects | [numbers](references/number-transitions.md), [surface effects](references/surface-effects.md), [expressive effects](references/expressive-effects.md) |
| Matching a recording | [research route](references/research-route.md), [replication](references/replication.md), [video study](references/video-study.md) |
| Checking behavior | [verification](references/verification.md), [judge](references/judge.md) |
| Where the rules come from | [sources](../seenry/references/sources.md) |
