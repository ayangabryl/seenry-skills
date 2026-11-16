# Where the rules come from

Every rule in Seenry comes from one of four places. Knowing which tells you how hard to hold it: a measured number is firm, an adapted practice is a proven default, and a lesson from testing is a guard against a failure seen before.

## Adapted practice

| Source | What Seenry takes | Where it lives |
| --- | --- | --- |
| Emil Kowalski, design engineer (Sonner, Vaul; product work at Vercel and Linear), MIT-licensed skills | The frequency gate (whether something should animate at all), ease-out curves and the ban on ease-in for interface motion, press feedback, popovers that grow from their trigger, interruption and reduced-motion decisions, and the habit of giving every rule a one-line reason | [seenry-motion](../../seenry-motion/SKILL.md), its [recipes](../../seenry-motion/references/recipes.md), [craft](../../seenry-craft/references/craft.md), [starter tokens](../assets/tokens.css) |
| Emil Kowalski's `prototype` skill | Options as named directions, one per stated axis, each fully working, judged one at a time at full size with a picker; an honest line on when each wins and what it costs; never pre-picking; a new round around a direction the person liked | [seenry-canvas](../../seenry-canvas/SKILL.md) |
| Emil Kowalski's `break-ui` skill | Worst-case data behind a Demo / Worst case toggle, failure signatures with cause and fix, truncate-wrap-clamp per field, a catalog of realistic breaking values | [seenry-break](../../seenry-break/SKILL.md) |
| Emil Kowalski's `remove-animations` and `find-animation-opportunities` skills | Reversing the burden of proof on motion, the removal tree, reducing instead of removing, removal hazards and cleanup, the opportunity hunt with required rejections | [seenry-subtract](../../seenry-subtract/SKILL.md), [gate](../../seenry-motion/references/gate.md) |
| Emil Kowalski's `improve-animations` skill | Audit then plan: recon, categories, vetting at `file:line`, self-contained plans a smaller model can execute, `execute` and `reconcile` | [seenry-audit](../../seenry-audit/SKILL.md) |
| Emil Kowalski's `review-animations`, `choreograph`, `gestures`, `animation-performance`, `animation-vocabulary` and `emil-design-eng` skills | Ten review standards, flag-on-sight list, fix order and Block or Approve verdict; cast and relate for groups; track and release phases; the frame budget and property tiers; the motion glossary; component techniques | [motion standards](../../seenry-review/references/motion-standards.md), [choreography](../../seenry-motion/references/choreography.md), [fluid](../../seenry-motion/references/fluid.md), [performance](../../seenry-motion/references/performance.md), [vocabulary](../../seenry-motion/references/vocabulary.md), [recipes-state](../../seenry-motion/references/recipes-state.md) |
| Emil Kowalski's `animate-expo`, `mobile-native`, `write-swift`, `pick-ui-library` and `ask-sonner` skills | Motion on the UI thread in Expo, haptics, the mobile web baseline, modern Swift rules, the library list and Sonner's call choice, styling ladder and fixes | [Expo motion](../../seenry-apps/references/expo-motion.md), [mobile web](../../seenry-craft/references/mobile-web.md), [modern Swift](../../seenry-apps/references/swift.md), [seenry-libraries](../../seenry-libraries/SKILL.md) |
| Jakub Krehel, design engineer, MIT-licensed skills | Concentric radii, hit areas, optical alignment and grouping; and the writing discipline of the core skill: headings that state the rule, one home per rule, a check you can grep for | [craft](../../seenry-craft/references/craft.md), [components](../../seenry-craft/references/components.md), [SKILL.md](../SKILL.md) |

Their license notices are kept in [licenses](../licenses/NOTICE.md) and [seenry-motion licenses](../../seenry-motion/licenses/NOTICE.md). Neither author endorses Seenry.

## Measured from leading products

| What | Measured from | Where it lives |
| --- | --- | --- |
| Type tiers: one neo-grotesk, headlines 48–72px at weight 300–600, tracking −2% to −6% | Linear, Attio, Notion, Brex, Raycast, Vercel, Stripe, Ramp, Framer, Mercury and Monarch, measured live at 1440 (October 2026) | [look](look.md#type-is-chosen-from-evidence) |
| Transition curves and durations by distance, size and frequency | Real products filmed frame by frame | [production motion](../../seenry-motion/references/production-motion.md), [recipes](../../seenry-motion/references/recipes.md) |
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
| Builds briefed only with bans scored 6 to 7 and read as timid beside the person's own level reference; rebuilt to the reference's measured moves, they matched it | [Level reference](level-reference.md): the reference's positive moves are floors, the critic scores `impact`, the hero image holds 8 |
| Generated images briefed as a subject in a setting ("counsel in a blazer, bright office, smiling") read as stock beside a designer who grades every image to the page palette and gives it a concept | `image.mjs` refuses undirected jobs; `photo_check` scores `palette_fit` ([imagery](imagery.md#art-direct-every-generated-image)) |
| A battery chart drawn as a bare sawtooth with no value axis, labels on the line, in an empty field, passed the gate | `review_board` blocks bare charts and chart label collisions; the critic holds product views to the floor in [screens](screens.md#product-views-and-charts-have-a-floor) |
| Well-graded generated images still read as stock when boxed in empty bands, and type over photos below the first screen was never measured | [Image composition](image-composition.md) techniques; `review_board` measures text over images on every screen and flags floating boxed images; `photo_check` scores `integration` in place |
| The same rule lived in five files and was diluted by build time | One home per rule: craft values in `seenry-craft`, motion in `seenry-motion`, process here |
| Three options built from good references, an art-directed image and one hue each were still called unresearched: they were composed from memory in ten minutes, and at full size the references showed a whole app, charts in their own form and the image in front of the UI where the options had one bar chart in a box | A teardown at full resolution is written before any option, `verify` and `check.mjs` block without it, the product view's inventory, hue families and headline are counted, each option is paired before it is shown, and the critic scores `execution` against the level reference ([execution bar](execution-bar.md)) |
| The gate asked for files the workflow never wrote (`idea.md`, `research/pack.md`, `motion.md`, three boards and a pick) and stopped headless runs at canvas approval | `check.mjs` reads the workflow's own files, and an unattended run is recorded with `round --unattended` and reported as unapproved |
| An audit of this session: every failure a script checked stopped recurring, and every failure covered only by prose came back; a run loaded about 7,100 words before designing and weaker models skipped the study | The page path is seven steps in `SKILL.md`, each with one command and one file; `verify` writes the teardown template and pairs each option with a blind judge, `check.mjs` prints the study first, and [Waterline](../assets/examples/waterline/README.md) is the worked example to copy |
| Library search returned nothing for two-word queries, composition words matched vendors and settings screens, and almost nothing was rated | The [level bar](level-bar.md) step uses the level-bar tool or one-word searches, keeps three that pass on the pixels, and falls back to the bundled bar when the library is thin |
