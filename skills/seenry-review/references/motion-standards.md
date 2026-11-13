# Motion standards

The bar for a motion review. Default to flagging; approval is earned. A transition that runs but feels slow, comes from the wrong place, fires too often or drops frames is a regression, not a pass. Exact values come from `seenry-motion` ([build sequence](../../seenry-motion/SKILL.md#the-build-sequence), [gate](../../seenry-motion/references/gate.md), [performance](../../seenry-motion/references/performance.md)); copy them, never approximate.

## Contents

- Ten standards
- Flag on sight
- Fix order
- Report
- Verdict

## Ten standards

Every animation in scope is measured against all ten. A miss is a finding.

1. **It has a purpose**: feedback, orientation, state, continuity, explanation, or delight in a rare moment. "Looks nice" on a frequent element blocks.
2. **It fits its frequency.** Keyboard and 100+ a day: none. Tens a day: reduced. Occasional: standard. Rare: may delight.
3. **The easing responds.** Entrances and exits use `--ease-out` or a strong custom curve; `ease-in` on UI blocks; built-in curves on deliberate motion are weak.
4. **UI stays under 300ms**, within the per-element budgets, or the review says why not.
5. **It is physically right.** Popovers, menus and tooltips scale from their trigger; dialogs from the center (correct, never report it). Never from `scale(0)`; start at 0.9–0.97 with opacity.
6. **It can be interrupted.** Toasts, toggles, drags and anything re-triggered use transitions or springs that retarget, never keyframes that restart.
7. **It stays on the compositor.** `transform` and `opacity`; layout properties, `box-shadow`, Motion shorthands before 14.2 on a busy page, and a parent custom property driving child transforms are performance findings.
8. **It respects people.** A reduced-motion branch that keeps opacity and drops travel; hover motion gated to `(hover: hover) and (pointer: fine)`.
9. **Timing is asymmetric where it should be.** A press, hold or destructive confirm is slow and deliberate; the system's response snaps. Symmetric timing there is a finding.
10. **It belongs to the product.** A bouncy component in a crisp dashboard, or a crossfade that double-exposes where 2px of blur would bridge it, is a finding. When unsure, deleting the motion is often the strongest fix.

## Flag on sight

- `transition: all`
- `scale(0)`, or a pure fade where the element should come from somewhere
- `ease-in` on any UI; a default curve on a deliberate animation
- Motion on a shortcut, a command-menu toggle or a 100+ a day action
- UI duration over 300ms with no stated reason
- `transform-origin: center` on a trigger-anchored popover, menu or tooltip
- Keyframes on toasts, toggles or anything added rapidly
- Animated `width`, `height`, `margin`, `padding`, `top`, `left`
- Shared-layout animations or pre-14.2 Motion shorthands during navigation or loading
- A parent custom property driving child transforms
- No reduced-motion handling on movement; ungated `:hover` motion
- Symmetric timing on a press-and-release or hold
- A group entering all at once where a 30–80ms stagger belongs, or a stagger on a frequent surface

## Fix order

Propose the earliest move that works:

1. Delete it (frequent, keyboard-triggered, or no purpose).
2. Reduce it: shorter, smaller, fewer properties.
3. Fix the easing.
4. Fix the origin and physics.
5. Make it interruptible.
6. Move it to the compositor.
7. Make the timing asymmetric.
8. Polish: blur to mask a crossfade, a stagger, `@starting-style`, a spring where it should feel alive.
9. Accessibility and cohesion: reduced motion, hover gating, the product's personality.

## Report

One table, one row per issue, never a list of befores and afters:

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 200ms var(--ease-out)` | `all` animates layout properties nobody meant to move |
| `transform: scale(0)` | `scale: 0.95; opacity: 0` | Nothing appears from nothing |
| `ease-in` on the dropdown | `--ease-out` | A slow start delays the moment people watch |
| Popover from `center` | `transform-origin: var(--transform-origin)` | It should grow from its trigger |

Every row cites `file:line`. Then the remaining notes grouped by impact, highest first, omitting empty groups: feel-breaking regressions; motion to remove or reduce; performance; interruption and timing; origin, physics and cohesion; accessibility. Also list missed opportunities (a jarring jump, a press with no feedback) and rejected candidates (what should stay instant, and why).

When feel cannot be judged from code (a crossfade, a spring's bounce), say so and name what to watch at 10% speed, frame by frame, or on a phone the next day with fresh eyes.

## Verdict

- **Block**: any feel-breaking regression, motion on a keyboard or frequent action, `scale(0)` or `ease-in` on UI, or a layout animation with an easy compositor fix.
- **Approve**: none of those, nothing obvious to delete, durations and easing in bounds, interruption handled where needed, reduced motion respected.
