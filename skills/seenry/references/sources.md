# Where the rules come from

Every rule in Seenry comes from one of four places. Knowing which tells you how hard to hold it: a measured number is firm, an adapted practice is a proven default, and a lesson from testing is a guard against a failure seen before.

## Adapted practice

| Source | What Seenry takes | Where it lives |
| --- | --- | --- |
| Emil Kowalski, design engineer (Sonner, Vaul; product work at Vercel and Linear), MIT-licensed skills | The frequency gate (whether something should animate at all), ease-out curves and the ban on ease-in for interface motion, press feedback, popovers that grow from their trigger, interruption and reduced-motion decisions, and the habit of giving every rule a one-line reason | [seenry-motion](../../seenry-motion/SKILL.md), its [implementation decisions](../../seenry-motion/references/implementation-decisions.md), [craft](craft.md), [starter tokens](../assets/tokens.css) |
| Jakub Krehel, design engineer, MIT-licensed skills | Concentric radii, hit areas, optical alignment and grouping; and the writing discipline of the core skill: headings that state the rule, one home per rule, a check you can grep for | [craft](craft.md), [components](components.md), [SKILL.md](../SKILL.md) |

Their license notices are kept in [licenses](../licenses/NOTICE.md) and [seenry-motion licenses](../../seenry-motion/licenses/NOTICE.md). Neither author endorses Seenry.

## Measured from leading products

| What | Measured from | Where it lives |
| --- | --- | --- |
| Type tiers: one neo-grotesk, headlines 48–72px at weight 300–600, tracking −2% to −6% | Linear, Attio, Notion, Brex, Raycast, Vercel, Stripe, Ramp, Framer, Mercury and Monarch, measured live at 1440 (October 2026) | [art direction](art-direction.md#4-type-chosen-like-the-leaders-choose-it) |
| Transition curves and durations by distance, size and frequency | Real products filmed frame by frame | [production motion](../../seenry-motion/references/production-motion.md), [transitions kit](../assets/components/transitions/README.md) |
| Spacing, body size, control height and radius for each new page | The references the agent keeps, through `compare_measurements` on the Seenry library | [flow, step 3](flow.md#3-research) |
| Section composition, header states and patterns for "design it like X" | The named site's captured pages and recordings in Seenry | [named site](named-site.md) |

## Learned from testing

These came from builds that failed in review. Each guards against a failure seen more than once.

| Lesson | What it changed |
| --- | --- |
| The builder rated its own pages 9 where blind review rated them 6 to 7 | Finished means the gate has seen it; scores come from a blind critic |
| Pages passed as stills and broke while scrolling | The critic sees the page as frames down the scroll ([scroll_strip.mjs](../scripts/scroll_strip.mjs)) |
| Images that scored well as files sat badly on the page | Images are judged in place ([photo_check.mjs](../scripts/photo_check.mjs) `--page`) |
| Pages made like a named site drifted away from it and borrowed its words | Resemblance caps the score; shared wording is blocked ([named site](named-site.md)) |
| Banned tells were replaced by a new generated house look | The second-generation tells in [anti-slop](anti-slop.md#the-blocked-list-in-full) |
| Clean pages with no decided identity scored 6 | Identity before layout ([identity](identity.md)) |
| A standard Opus 5.5 dashboard had no listed tells and still read as AI-made; "unslop" only tidied it | The critic's `looks_ai` glance score and the [unslop](unslop.md) route |
| The full-gate unslop stopped reading as AI-made but read as junior work: four action styles, red for five meanings, a gimmick headline; 13 critic rounds moved it one point | The critic's `seniority` score and `junior_tells`; unslop builds on the best reference's execution; four critic rounds per direction |
| An agent added a gate attribute and turned a header into a div to pass a landing-page check on a dashboard | `Surface: app` skips landing-page checks; gate markers must tell the truth |

## The owner's preferences

Labelled as house style in [SKILL.md](../SKILL.md#house-style): the quiet kit for calm software, museum art over generated sets when the register is quiet, studio references beside category leaders. They are defaults, and a brief or a reference the person shows outranks them.
