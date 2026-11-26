---
name: seenry
description: "Designs and builds a web page, site, dashboard or product screen from brief to checked build, held to real studied references. Use for any new design or redesign, 'make it look better', 'this looks generic or AI-made', 'make it like <site>' or 'at <designer>'s level', and when unsure which Seenry skill fits: it routes to the others. Not for native mobile (seenry-apps), a product film (seenry-video) or review only (seenry-review)."
license: Apache-2.0
metadata:
  author: Seenry
  version: "3.6.0"
---

# Seenry

Takes a design task from brief to built page. The person is the judge: the idea and the image reach them first, as hero-only sketches that are cheap to reject, and only their pick is built. First sketches are on the canvas within 5 minutes; no step loops more than twice.

Worked example: [Waterline](assets/examples/waterline/README.md). Copy its path and principles, never the page.

**First call, every task:** `node scripts/start.mjs "<the brief in a few words>"` (or `.seenry/brief.md`). It prints the two or three [style briefs](references/styles/index.json) that fit, the [bans](references/bans.md) and the steps below. On a computer linked to the person's Seenry account it also prints their taste (what they chose, what they never want, the sites and images they love): the project and the brief come first, and their taste settles what those leave open. `--style <slug>` prints one brief whole: a visual identity (type, colour roles, imagery, how image and interface meet, section moves), never a page order. One direction may take a style; the others answer the brief their own way.

## Route

| The request | Do |
| --- | --- |
| A new page, site, screen or redesign | The nine steps below |
| A fix inside an existing app | [Existing project](references/existing-project.md) |
| "This looks generic or AI-made" | [Unslop](references/unslop.md), then steps 2 to 9 |
| "Make it like X" | [Named site](references/named-site.md), then steps 3 to 9 |
| "Design like @someone", "at this level" | [Level reference](references/level-reference.md), then steps 1 to 9 |

## The nine steps

`<canvas>` is `node ../seenry-canvas/scripts/canvas.mjs`, `<image>` is `node scripts/image.mjs`. In order.

| # | Do | Run | Leaves |
| --- | --- | --- | --- |
| 1 | **Brief.** A few lines: who it is for, the page's one job, the content that exists, what is fixed, whether the company is fictional | `<canvas> init` (starts the clock) | `.seenry/brief.md` |
| 2 | **References.** Three: the person's, else the library's best ([level bar](references/level-bar.md)). Open each at full size and look; write nothing | Seenry MCP `get_level_bar` | Three images in `.seenry/canvas/refs/` |
| 3 | **Ideas.** For two or three directions, one line each: the idea that will carry the whole page, and how the hero image and the interface meet | (write them) | Each sketch's `seenry-idea` line |
| 4 | **Images.** One art-directed hero image per direction, in one batch, generating in the background while you write step 5. The person's own images come first | `<image> --template`, then `<image> --batch .seenry/canvas/img/jobs.json --background` | `.seenry/canvas/img/<direction>.jpg` |
| 5 | **Sketches.** Set `tokens.css` (one hue, real fonts). Draw each direction as its first screen only: one viewport, real copy, its image in place, a product view marked `data-seenry-product` | `<image> --wait`, then `<canvas> verify` | `02-home.options/<direction>.html` |
| 6 | **Pick.** Show the sketches and wait. Never mark a favourite | `<canvas> open`, `<canvas> wait` (again while it says Still waiting), then `<canvas> round "<the pick and their note>"` | The picked sketch |
| 7 | **Extend.** Only the pick becomes the full page, on the canvas: every section to the footer, the hero image returning below in new crops, one grid. Remove its `seenry-fidelity` line | `<canvas> verify` | The full page |
| 8 | **Build.** Pick the [stack](references/stack.md) (never plain HTML by default), write the `Stack:` line in `DESIGN.md`, and move the page into it with the same tokens and images. Write `MOTION.md` (`seenry-motion`) | (the project's build) | The page, `MOTION.md` |
| 9 | **Check.** Once, at the end. It prints the five blockers that matter most, ranked (`--all` for every check). Fix them, run it once more, report | `node scripts/check.mjs <page> --brief .seenry/brief.md` | Its result line |

A sketch's head:

```html
<meta name="seenry-fidelity" content="sketch">
<meta name="seenry-idea" content="Heat you can see leaving: a thermal photograph of one street, the meter reading printed over its coldest house">
```

`verify` blocks a sketch with no `seenry-idea` line or no generated or own image in its hero (a flat block or a CSS gradient is not one), and a full page whose hero image never returns below the hero (mark another carrier of the idea `data-seenry-motif`). Both commands block overflow, clipped text, low contrast, typed values and a product view under 12 kinds of UI; `check.mjs` adds the phone layout. No model scores the page. Each message gives the command that fixes it.

Nobody to review: `<canvas> verify --judge` asks a blind judge; choose the option furthest from the default and record it with `<canvas> round "<choice and why>" --unattended "<why>"`. `check.mjs` then runs a blind critic.

The full process, only when asked for: `--studio` on both commands adds a written teardown, the pair judge and critic rounds ([execution bar](references/execution-bar.md)).

## Rules

1. **One idea, hero to footer.** The image, and how it meets the interface, come back in lower sections.
2. **References give principles; the product gives the design.** Layout, palette and image subject never all come from one reference, unless the person asked to replicate it.
3. **Real material at real size.** A product is a whole app with real data and charts in the page's one hue; a studio, shop or portfolio shows the work itself, large. Image and layout meet in depth.
4. **Proof is real.** No invented customers, quotes, logos or figures, unless the brief says the company is fictional: then invented proof is expected, never labelled on the page, and listed under "Assumed".
5. **Everything works.** A control or shortcut hint with nothing behind it is wired up or removed.
6. **Twice, then show.** After two rounds on a step, show it and name what is left. Quote the checks; never give your own score.
7. **Patch, never regenerate.** Fix a screen or page with a targeted edit to the part that is wrong, never by writing the whole file again: a rewrite loses what was approved and hides what changed.
8. **Never the [bans](references/bans.md).** The habits that make a page read as generated, in one list.

## Which skill, and what comes next

| The person says | Skill | Leaves | Then |
| --- | --- | --- | --- |
| "Pick fonts", "a palette", a new brand | `seenry-identity` | `tokens.css` | `seenry-canvas` |
| "Mock it up", "show options" | `seenry-canvas` | Approved screens, `HANDOFF.md` | Build |
| It needs a photo, icons, fonts | `seenry-assets` | Files, provenance | `seenry-canvas` |
| "Which library or framework?" | `seenry-libraries` | `Stack:` line | Build |
| "Looks slightly off", exact values | `seenry-craft` | The fix | `seenry-break` |
| "Animate this", transitions | `seenry-motion` | `MOTION.md` | `seenry-review` |
| "Review", "critique" one screen or diff | `seenry-review` | Ranked findings | Fix, `seenry-break` |
| "Break it", edge cases | `seenry-break` | Break report | Fix, `seenry-review` |
| "Too much", "tone it down" | `seenry-subtract` | What was removed | `seenry-review` |
| "Audit" or "polish" the whole app | `seenry-audit` | `plans/` | Run the plans |
| A native mobile app; a product film | `seenry-apps`; `seenry-video` | | |

## Report

```
Held to:   the three references and where they came from
Idea:      the picked idea line, and where it returns down the page
Picked:    the person's pick and note, or "not approved by a person"
Time:      first sketch, pick and finished build, as the canvas printed them
Checked:   the result lines of verify and check.mjs, quoted
Not checked: what you could not check
Assumed:   every fact you supplied that the person should replace
```

## Read only when the step needs it

| Need | Read |
| --- | --- |
| A style's identity, in full | `node scripts/start.mjs --style <slug>`, or [the shelf](references/styles/index.json) |
| What each kind of screen must hold | [screens](references/screens.md) |
| Type, colour and imagery for tokens | [look](references/look.md) |
| Image rules and composing images into the layout | [imagery](references/imagery.md), [image composition](references/image-composition.md) |
| Seenry MCP recipes | [research](references/research.md) |
| Measured values from leading sites | [benchmarks](references/benchmarks.md) |
| Where components come from, stack choices | [building](references/building.md), [stack](references/stack.md) |
| Replicas, surfaces in an existing app | [replication](references/replication.md), [surfaces](references/surfaces.md) |
| A design sheet, only when asked | [sheet](references/sheet.md) |
