---
name: seenry-motion
description: "Builds and fixes interface animation, and decides when nothing should move: press feedback, menus, dialogs, sheets, toasts, tabs, page transitions, scroll effects, gestures, number changes and groups that move together. Use when adding, choreographing or debugging animation, fixing dropped frames, or naming an effect from a loose description. Writes MOTION.md with a reason per animation and scores the result with a script. Not for removing motion (seenry-subtract) or auditing a whole app (seenry-audit)."
license: Apache-2.0
metadata:
  author: Seenry
  version: "3.6.0"
---

# Seenry Motion

Motion explains a change: where something came from, that the input was heard, what state this is. Everything else stays still.

## Hand-off

| Reads | Leaves | Next |
| --- | --- | --- |
| The built screen and, if there is one, `HANDOFF.md` | The motion in code, `MOTION.md`, a passing `motion_score.mjs` run | `seenry-review` (motion review) |

## 1. Should it move at all?

| How often a person triggers it | Decision |
| --- | --- |
| Keyboard shortcut, command menu, typing, anything 100+ times a day | No motion. Stop here. |
| Tens of times a day (hover, list navigation, tab switching) | 120ms tint or the indicator only, or nothing |
| Occasionally (menu, dialog, sheet, toast, accordion) | The values below |
| Rarely or once (onboarding, success, a marketing page) | Room for one signature moment |

Then name what the motion explains in one word: **feedback, origin, state, continuity**. If no word fits, it does not move. Data a person is reading never moves for style. When the answer is no, say so in one line and ship the instant change.

## 2. Exact values

Reuse the project's tokens when they hold these numbers; never invent a curve.

| Element | Enter | Exit | Curve | Starts from |
| --- | --- | --- | --- | --- |
| Press | 80ms | 120ms | out | `scale: 0.97` |
| Hover tint, colour | 120ms | 120ms | fade | colour only, never position |
| Tooltip | 120ms after 400ms dwell | 80ms | out | `opacity: 0; scale: 0.97`, trigger side |
| Menu, dropdown, popover | 180ms | 100ms | out | `opacity: 0; scale: 0.96; translate: 0 -4px`, trigger corner |
| Dialog | 240ms | 140ms | out | `opacity: 0; scale: 0.96`, centre |
| Sheet, drawer | 280ms | 180ms | out | `translate: 0 100%`, its own edge |
| Toast | 240ms | 140ms | out | `opacity: 0; translate: 0 16px` |
| Tab indicator | 180ms | n/a | move | `clip-path` to the new tab |
| Tab or view content | 120ms | 0ms | fade | `opacity: 0`, no travel |
| Accordion | 240ms | 180ms | move | height 0 |
| Icon swap, checkbox, toggle | 120–160ms | 80ms | out | `opacity: 0; scale: 0.9` |
| Number | 160ms (400ms rolling digits) | n/a | out | 60% of a glyph, `tabular-nums` |
| List insert, reorder | 180ms | 80ms | move | `opacity: 0; translate: 0 4px` |
| Page, shared element | 280ms | 240ms | move | the source rectangle |
| Staggered group | 300ms each | together | out | delays 0, 40, 70, 90ms; `translate: 0 8px` |
| Scroll reveal, hero | 600ms | n/a | out | `translate: 0 16px`, once |

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* out: enter, exit, press */
--ease-move: cubic-bezier(0.4, 0, 0.2, 1);   /* move: travel or resize, both ends on screen */
--ease-fade: cubic-bezier(0.2, 0, 0.2, 1);   /* fade: opacity and colour alone */
```

- **Spring** only for something dragged and released: Motion `{ type: "spring", stiffness: 500, damping: 42 }`, or `--spring-snappy` at 400ms in CSS. `linear` only for progress, loops and scroll-linked motion.
- **Exit is faster than enter**, about 60%, and never staggered.
- **Properties:** `translate`, `scale`, `rotate`, `opacity`, `clip-path`, `filter` (blur 4px at most). Never `width`, `height`, `top`, `left`, `margin`, `padding` (accordion height is the exception). Never `transition: all`, `ease-in`, or an entrance from `scale(0)`.
- **Origin:** anchored surfaces grow from the trigger; dialogs from the centre; sheets and toasts from their edge and back out the same way.
- **Product UI stays at or under 300ms.** Longer needs a reason written in `MOTION.md`.

## 3. Build steps

1. **Gate it** with section 1. Write the frequency and the one-word reason.
2. **Find the recipe.** Surfaces and navigation: [recipes](references/recipes.md). Feedback, numbers, lists, loading, AI text, stagger, scroll: [recipes-state](references/recipes-state.md). Start from the recipe and keep its values.
3. **Pick the tool.** A project with a framework takes the maintained library through `seenry-libraries` (Base UI transitions, Sonner, Vaul, NumberFlow, Motion); each recipe names it and its settings. A page with no build step uses the recipe's CSS. Never add a second animation library.
4. **Several things moving on one event?** Read [choreography](references/choreography.md) and write the timeline first. One entrance per container; content attached to a panel does not animate separately.
5. **Make it interruptible.** Transitions or springs for anything triggered twice; keyframes only for one-shot entrances, the error shake and loops. State changes at once; the latest input wins.
6. **Keyboard and reduced motion ship with it.** Paste the setup block from [recipes](references/recipes.md#setup-tokens-keyboard-reduced-motion): key presses resolve in 0ms, `prefers-reduced-motion` keeps a 100ms fade and drops travel. Hover motion sits inside `@media (hover: hover) and (pointer: fine)`. One infinite loop at most, and it stops when the work stops.
7. **Write `MOTION.md`, then run the stop gate.**

## 4. Output: `MOTION.md`

One file beside the page: a row per moving thing and one line naming the signature moment (the movement that carries the idea; "none" for a small component).

```markdown
Signature moment: the menu grows out of the Account button.

| Moves | Trigger | What moves | Duration | Easing | Explains | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- |
| Account menu | Click | opacity, scale 0.96 to 1 from top left | 180ms in, 100ms out | ease-out | Origin: it belongs to that button | 100ms fade |
| Menu rows | n/a | Nothing | 0ms | n/a | Attached to the panel | Same |
```

A row with no "Explains" is a movement to delete. Fill the last two columns in words (`Same`, `100ms fade`), never `none` or a dash. List what you kept still on purpose.

## 5. Stop gate

Do not report the work finished until every box is ticked.

```
- [ ] node scripts/motion_score.mjs <page or src dir>   → no errors, score 80 or more
- [ ] MOTION.md has a row per moving thing, each with a reason and a reduced-motion state
- [ ] Rapid repeat: trigger, reverse and re-trigger within 150ms; nothing flashes, stacks or sticks
- [ ] Keyboard: every control works by key with no transition after a key press; Escape closes from anywhere and focus returns to the trigger
- [ ] prefers-reduced-motion: no travel or scale, state still clear
- [ ] Played once at 10% speed (DevTools → Animations) and once on a phone
```

The script prints the measured and the allowed value per finding: `ease-in`, a duration over the limit for the element type, `transition: all`, `scale(0)`, layout properties, ungated hover motion, more than one infinite loop, no reduced-motion branch. `--browser --playwright <path>` also presses keys on the built page and reports movement they start. Fix the finding; never rename a class to dodge it. Anything you could not check is reported as unchecked, never as passed.

## When the person says

| They say | You do | Read |
| --- | --- | --- |
| "Animate this", "add a transition" | Sections 1 to 5 | [recipes](references/recipes.md), [recipes-state](references/recipes-state.md) |
| "What could animate here?", "make it feel alive" | Hunt, gate, report five to seven at most, with rejections | [gate](references/gate.md#finding-motion-to-add) |
| "Too much animation", "feels slow" | `seenry-subtract` | [gate](references/gate.md#removing-motion) |
| Stagger, sequence, hero entrance, "these should move together" | Cast, relate, write the timeline | [choreography](references/choreography.md) |
| Drag, swipe, sheet, carousel, "doesn't follow my finger" | Track 1:1, spring on release | [fluid](references/fluid.md) |
| "It's janky", "drops frames" | Name the cause, then fix | [performance](references/performance.md) |
| "What's it called when…" | The term, then close alternates | [vocabulary](references/vocabulary.md) |
| Scroll scene, AI or material effect, signature moment | Score the scene, pick the effect | [expressive](references/expressive.md) |
| "Make it like this video" | Study the playback first | [replication](references/replication.md) |
| "Review this motion", "audit the animations" | `seenry-review`, `seenry-audit` | [motion standards](../seenry-review/references/motion-standards.md) |

## More files

| Read when | File |
| --- | --- |
| Checking behaviour by hand, the model judge | [verification](references/verification.md) |
| Designing a control no library has | [interaction craft](references/interaction-craft.md) |
| Asked why a value is what it is (measured from shipped products) | [production motion](references/production-motion.md) |
| React Native or Expo | [Expo motion](../seenry-apps/references/expo-motion.md) |
