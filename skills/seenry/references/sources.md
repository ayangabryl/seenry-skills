# Where the rules come from

Every rule in Seenry comes from one of four places. Knowing which tells you how hard to hold it: a measured number is firm, an adapted practice is a proven default, and a lesson from testing is a guard against a failure seen before.

## Adapted practice

| Source | What Seenry takes | Where it lives |
| --- | --- | --- |
| Emil Kowalski, design engineer (Sonner, Vaul; product work at Vercel and Linear), MIT-licensed skills | The frequency gate (whether something should animate at all), ease-out curves and the ban on ease-in for interface motion, press feedback, popovers that grow from their trigger, interruption and reduced-motion decisions, and the habit of giving every rule a one-line reason | [seenry-motion](../../seenry-motion/SKILL.md), its [implementation decisions](../../seenry-motion/references/implementation-decisions.md), [craft](../../seenry-craft/references/craft.md), [starter tokens](../assets/tokens.css) |
| Emil Kowalski's `prototype` skill | Options as named directions, one per stated axis, each fully working, judged one at a time at full size with a picker; an honest line on when each wins and what it costs; never pre-picking; a new round around a direction the person liked | [seenry-canvas](../../seenry-canvas/SKILL.md) |
| Emil Kowalski's `break-ui` skill | Worst-case data behind a Demo / Worst case toggle, failure signatures with cause and fix, truncate-wrap-clamp per field, a catalog of realistic breaking values | [seenry-break](../../seenry-break/SKILL.md) |
| Emil Kowalski's `remove-animations` and `find-animation-opportunities` skills | Reversing the burden of proof on motion, the removal tree, reducing instead of removing, removal hazards and cleanup, the opportunity hunt with required rejections | [seenry-subtract](../../seenry-subtract/SKILL.md), [gate](../../seenry-motion/references/gate.md) |
| Emil Kowalski's `improve-animations` skill | Audit then plan: recon, categories, vetting at `file:line`, self-contained plans a smaller model can execute, `execute` and `reconcile` | [seenry-audit](../../seenry-audit/SKILL.md) |
| Emil Kowalski's `review-animations`, `choreograph`, `gestures`, `animation-performance`, `animation-vocabulary` and `emil-design-eng` skills | Ten review standards, flag-on-sight list, fix order and Block or Approve verdict; cast and relate for groups; track and release phases; the frame budget and property tiers; the motion glossary; component techniques | [motion standards](../../seenry-review/references/motion-standards.md), [choreography](../../seenry-motion/references/choreography.md), [fluid](../../seenry-motion/references/fluid.md), [performance](../../seenry-motion/references/performance.md), [vocabulary](../../seenry-motion/references/vocabulary.md), [techniques](../../seenry-motion/references/techniques.md) |
| Emil Kowalski's `animate-expo`, `mobile-native`, `write-swift`, `pick-ui-library` and `ask-sonner` skills | Motion on the UI thread in Expo, haptics, the mobile web baseline, modern Swift rules, the library list and Sonner's call choice, styling ladder and fixes | [Expo motion](../../seenry-apps/references/expo-motion.md), [mobile web](../../seenry-craft/references/mobile-web.md), [modern Swift](../../seenry-apps/references/swift.md), [libraries](libraries.md) |
| Jakub Krehel, design engineer, MIT-licensed skills | Concentric radii, hit areas, optical alignment and grouping; and the writing discipline of the core skill: headings that state the rule, one home per rule, a check you can grep for | [craft](../../seenry-craft/references/craft.md), [components](../../seenry-craft/references/components.md), [SKILL.md](../SKILL.md) |

Their license notices are kept in [licenses](../licenses/NOTICE.md) and [seenry-motion licenses](../../seenry-motion/licenses/NOTICE.md). Neither author endorses Seenry.

## Measured from leading products

| What | Measured from | Where it lives |
| --- | --- | --- |
| Type tiers: one neo-grotesk, headlines 48–72px at weight 300–600, tracking −2% to −6% | Linear, Attio, Notion, Brex, Raycast, Vercel, Stripe, Ramp, Framer, Mercury and Monarch, measured live at 1440 (October 2026) | [look](look.md#type-is-chosen-from-evidence) |
| Transition curves and durations by distance, size and frequency | Real products filmed frame by frame | [production motion](../../seenry-motion/references/production-motion.md), [transitions kit](../assets/components/transitions/README.md) |
| Spacing, body size, control height and radius for each new page | The references the agent keeps, through `compare_measurements` on the Seenry library | [research](research.md) |
| Section composition, header states and patterns for "design it like X" | The named site's captured pages and recordings in Seenry | [named site](named-site.md) |

## Learned from testing

| Lesson | What it changed in 2.0 |
| --- | --- |
| A list of banned tells sent the agent to the next default, and newer models produced Seenry's own look unprompted | The flow names the current default for each brief and every option must differ from it in structure |
| Twenty or more critic rounds moved a page about one point and cost most of the run's tokens; the builder and a model critic rated pages above what people did | The person picks on the canvas; one check pass, no scoring loop |
| Three options from the model's own taste were one option three times | Each option is anchored to a different real reference, one from outside the category |
| Pages invented tidy fake businesses, quotes and numbers that read as generated | Proof is never invented; assumed facts are listed for the owner |
| Building exactly on one reference held every run just below its source | References give structure only, never colors, words or images |
| Told to beat references with no category leader, an agent invented charts people found confusing | Convention before invention in [unslop](unslop.md) and [screens](screens.md) |
| The same rule lived in five files and was diluted by build time | One home per rule: craft values in `seenry-craft`, motion in `seenry-motion`, process here |
