# Companion skills

Seenry works alone. A person may also install skills by other authors next to it; this file says which one leads each step when both are present, so two skills never fight over the same file.

Companions are installed from their authors' own repositories and are never copied into Seenry. This file names them and says when to reach for each; their instructions live in their own `SKILL.md`.

## The rule

1. **One skill leads each step.** Seenry runs the job: brief, references, canvas, picks, gates, `MOTION.md` and the final check. A companion is a specialist called inside a step for the one thing it is best at.
2. **Never two writers.** Two skills that both rewrite the same thing (the same CSS, the same copy, the same animation) never run on the same step. The second one reviews, or waits.
3. **Not installed means not used.** A companion counts as installed only when it appears in the agent's skill list. When it is missing, the Seenry skill in the Leads column covers the step on its own. Never stop, ask the person to install it, or name it in the report as missing.
4. **Seenry's gates still apply.** Whatever a companion writes goes through `canvas.mjs verify` and `check.mjs` like everything else, and its motion goes into `MOTION.md`.
5. **Inside a Seenry run, call companions by name.** A router that picks skills for the person (`ask-emil`) is never invoked during a Seenry run; this table is the router.

## Who leads

| Step | Leads | Companion | What the companion adds | Not installed |
| --- | --- | --- | --- | --- |
| Whether something moves, the reason, `MOTION.md`, the score | `seenry-motion` | none | Seenry alone decides and scores | always Seenry |
| One element's animation, built from nothing | `seenry-motion` | `animate` | Works the decisions for a single element in order and writes it; record its reason in `MOTION.md` | `seenry-motion` builds it |
| Several elements moving together | `seenry-motion` | `choreograph` | Order, overlap and what holds still across a group | `seenry-motion` choreography |
| Ready-made CSS transitions and a motion-token scale | `seenry-motion` | `transitions-dev` | Recipes and tokens; use only when the project adopts its tokens, never mixed with a second token scale | `seenry-motion` recipes and its value table |
| Tuning transitions already on transitions.dev tokens | `seenry-motion` | `transitions-polish` | Retunes timing and easing against that scale; only in a project that uses it | `seenry-motion` exact values |
| Drag, swipe, sheets, fling | `seenry-motion` | `gestures` | Finger tracking and interruption | `seenry-motion` gestures |
| Dropped frames, which property to animate | `seenry-motion` | `animation-performance` | Finds the cause of jank | `seenry-motion` performance |
| "What is this effect called?" | `seenry-motion` | `animation-vocabulary` | The exact name for a loosely described effect | `seenry-motion` naming |
| Spring physics, materials, depth | `seenry-motion` | `apple-design` | Apple-style fluid motion and material advice for the web | `seenry-motion` springs |
| Reviewing motion | `seenry-review` | `review-animations` | A second, independent reviewer after Seenry's own verdict; its findings are merged, not re-applied blindly | `seenry-review` motion review |
| Auditing motion across an app | `seenry-audit` | `improve-animations` | Motion plans folded into Seenry's `plans/` | `seenry-audit` |
| "What could animate here?" | `seenry-motion` | `find-animation-opportunities` | Hunt mode: proposes candidates; `seenry-motion` still decides and gates each | `seenry-motion` step 1 |
| Cutting motion only | `seenry-subtract` | `remove-animations` | Motion-only removal; for decoration and the whole interface, `seenry-subtract` alone | `seenry-subtract` |
| Type scale, spacing, radius, shadows, colour roles | `seenry-craft` | `better-ui`, `better-typography`, `better-colors`, `better-layout` | Specialist checks on surfaces and icons, text rendering, palettes and contrast, grouping and responsive structure; `seenry-craft` and the project's tokens keep the values | `seenry-craft` and its references |
| Choosing typefaces and colours | `seenry-identity` | `better-typography`, `better-colors` | Checks on the chosen pair and palette, never the choice | `seenry-identity` |
| Accessibility pass | `seenry-review` | `better-accessibility` | Keyboard, focus, ARIA and screen-reader depth inside the accessibility pass | the craft [accessibility checklist](../../seenry-craft/references/accessibility.md) |
| Interface copy: labels, errors, empty states | `seenry-craft` | `better-writing` | Writes and checks product copy in the product's voice; marketing headlines stay with `seenry` | the craft [writing](../../seenry-craft/references/writing.md) reference |
| Which library | `seenry-libraries` | `pick-ui-library` | A second curated source; `seenry-libraries` still checks license and last release | `seenry-libraries` |
| Visual effects (glow borders, AI thinking states, voice visualizers, liquid metal) | `seenry-libraries` | `libraries-dev` | The right use of the Libraries.dev packages; each still needs a reason in `MOTION.md` | `seenry-libraries` catalog |
| Sonner toasts | `seenry-libraries` | `ask-sonner` | Setup, the right call and fixes | [Sonner in practice](../../seenry-libraries/references/sonner.md) |
| Worst-case data | `seenry-break` | `break-ui` | Nothing extra: never run both | `seenry-break` |
| Options and variants | `seenry-canvas` | `prototype` | In-code variants behind a picker, only when the person asks for them in code | `seenry-canvas` options |
| Native mobile screens | `seenry-apps` | `write-swift` | Modern Swift and SwiftUI code quality | `seenry-apps` |
| Motion in an Expo app | `seenry-apps` | `animate-expo` | Reanimated and gesture decisions | [Expo motion](../../seenry-apps/references/expo-motion.md) |
| A web app on a phone | `seenry-craft` | `mobile-native` | Phone-browser fixes (tap, viewport, safe areas) | the craft [mobile web](../../seenry-craft/references/mobile-web.md) reference |
| Learning from corrections | `seenry` | `learn-taste` | Writes the project's rules, with reasons, into `DESIGN.md`, which Seenry reads; it never overwrites the `Stack:` line | Seenry's round notes |
| Design-engineering philosophy | `seenry` | `emil-design-eng` | Background reading when no narrower skill fits; never a step of its own | Seenry's references |
| Picking a skill | `seenry` | `ask-emil` | Never inside a Seenry run | this table |

## Taste and project rules

Three sources can disagree. The brief and the project come first. Then the person's taste file (printed by `start.mjs`): it wins on preferences, what they like and never want. Then `DESIGN.md`, including any rules `learn-taste` wrote: project facts and conventions. A companion's own defaults come last.

## Where they come from

| Author | Repository | Skills |
| --- | --- | --- |
| Emil Kowalski | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `animate`, `animate-expo`, `animation-performance`, `animation-vocabulary`, `apple-design`, `ask-emil`, `ask-sonner`, `break-ui`, `choreograph`, `emil-design-eng`, `find-animation-opportunities`, `gestures`, `improve-animations`, `learn-taste`, `mobile-native`, `pick-ui-library`, `prototype`, `remove-animations`, `review-animations`, `write-swift` |
| Jakub Antalik | [Jakubantalik/transitions.dev](https://github.com/Jakubantalik/transitions.dev) | `transitions-dev`, `transitions-polish` |
| Jakub Antalik | [Jakubantalik/Libraries.dev](https://github.com/Jakubantalik/Libraries.dev) | `libraries-dev` |
| Jakub Krehel | [jakubkrehel/skills](https://github.com/jakubkrehel/skills) | `better-typography`, `better-colors`, `better-layout`, `better-accessibility`, `better-writing`, `better-ui` |

Each repository has its own license; read it before using what a skill ships. transitions.dev's terms forbid repackaging its collection, which is one reason Seenry only points to it.
