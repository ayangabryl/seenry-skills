---
name: seenry
description: "Designs and builds a web page, site, dashboard or product screen from brief to checked build, held to real studied references. Use for any new design or redesign, 'make it look better', 'this looks generic or AI-made', 'make it like <site>' or 'at <designer>'s level', and when unsure which Seenry skill fits: it routes to the others. Not for native mobile (seenry-apps), a product film (seenry-video) or review only (seenry-review)."
license: Apache-2.0
metadata:
  author: Seenry
  version: "3.1.0"
---

# Seenry

Takes a design task from brief to built page at the level of real, studied references. One habit carries it: count the references at full size before composing, and let the checks say when the page is still below them.

Worked example: [Waterline](assets/examples/waterline/README.md). Copy its path and principles, not the page: the example with a new skin is blocked.

## Route

| The request | Do |
| --- | --- |
| A new page, site, screen or redesign | The seven steps below |
| A fix inside an existing app | [Existing project](references/existing-project.md) |
| "This looks generic or AI-made" | [Unslop](references/unslop.md), then steps 2 to 7 |
| "Make it like X" | [Named site](references/named-site.md), then steps 3 to 7 |
| "Design like @someone", "at this level" | [Level reference](references/level-reference.md), then steps 1 to 7 |
| "Show me options", "mock this up" | `seenry-canvas` alone |

## The seven steps

`<canvas>` is `../seenry-canvas/scripts/canvas.mjs`. In order; each step leaves the file the next reads.

| # | Do | Run | Leaves |
| --- | --- | --- | --- |
| 1 | **Brief.** Write who it is for, the one job of each screen, the content that exists, and what is fixed. Say if the company is fictional | (write it) | `.seenry/brief.md` |
| 2 | **Level bar.** Save three references the page will be held to: the person's work, else the library's best ([level bar](references/level-bar.md)) | Seenry MCP `get_level_bar`, or the searches that file lists | Three or more images in `.seenry/canvas/refs/` |
| 3 | **Teardown.** Open each crop at full size and replace every `__` with a count or a measurement | `node <canvas> verify` (it writes the crops and the template) | `.seenry/teardown.md`, no blanks |
| 4 | **Compose.** For each screen and every section down to the footer, take one principle with its number from each of two or three references, around the product's own idea. Choose how image and interface meet from what your own image allows; name the default you are avoiding | (write it, like the example's [compose.md](assets/examples/waterline/compose.md)) | `.seenry/compose.md` |
| 5 | **Design on the canvas.** Set `tokens.css` with `seenry-identity`, make the images, and build two or three options as screens on one grid, any product view marked `data-seenry-product` ([execution bar](references/execution-bar.md)) | `node <canvas> verify` until 0 errors, then `node <canvas> open` for the person's pick | Approved screens on the canvas |
| 6 | **Build.** Pick the [stack](references/stack.md) (the project's, else the best fit; plain HTML is not the default), write the `Stack:` line in `DESIGN.md`, and build the approved screen in it with the same tokens. Write `MOTION.md`: a row per moving thing with the change it explains, and one signature moment (`seenry-motion`) | (the project's build) | The page, `MOTION.md` |
| 7 | **Check.** Fix what it blocks, top first, and quote its score line | `node scripts/check.mjs <page> --brief .seenry/brief.md --mode quick` | The score in your report |

What the two commands do, so you never run these by hand: `verify` writes the teardown template, counts a product view (needs 12 kinds of UI, 2 of visualisation), checks the grid, hues and headline, and puts each option beside a reference for a blind judge (a reskin of a reference or of the example, or a visibly less finished screen, is blocked). `check.mjs` repeats that on the built page, checks charts, images and `MOTION.md`, and asks a blind critic for the score. Every message names the number measured and the number needed: change that, run again.

Nobody to review: instead of `open`, run `node <canvas> round "<choice and why>" --unattended "<why>"` and report every screen as not approved by a person.

Images: the person's own first. Otherwise `node scripts/image.mjs --batch jobs.json`, each job written like the example's [image-job.json](assets/examples/waterline/image-job.json). A rejected image leaves `regenerate.json` in the same format.

## Rules

1. **Count before composing.** No option is built from memory of a reference; compose from the teardown's numbers.
2. **References give principles; the product gives the design.** Layout, palette and image subject never all come from one reference, unless the person asked to replicate it.
3. **Real material at real size, held to the footer.** A product is a whole app with real data telling one story and charts in the page's one hue; a studio, shop or portfolio shows the work itself, large. Image and layout meet in depth. Every section has one moment of its own, on one grid; a different width or a movement states its reason.
4. **Proof is real.** No invented customers, quotes, logos or figures. The exception is a brief that says the company is fictional: then invented proof is expected, is never labelled on the page, and is listed under "Assumed".
5. **Everything works.** A control or shortcut hint with nothing behind it is wired up or removed.
6. **Report what the checks said.** Quote the gate's score line; never give your own.

## Which skill, and what comes next

Recommend one, and name the next.

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
Held to:   the three references and where they came from (the person, the library, the bundled bar)
Composed:  each screen and section, the principle and number from each reference, and the idea
Measured:  the teardown's counts beside the page's own
Approved:  the screens the person approved, or "not approved by a person" for an unattended run
Checked:   verify's result and the gate's score line, quoted
Not checked: what you could not check
Assumed:   every fact you supplied that the person should replace
```

## Read only when the step needs it

| Need | Read |
| --- | --- |
| What each kind of screen must hold | [screens](references/screens.md) |
| Type, colour and imagery for tokens | [look](references/look.md) |
| Image rules and composing images into the layout | [imagery](references/imagery.md), [image composition](references/image-composition.md) |
| Seenry MCP recipes | [research](references/research.md) |
| Measured values from leading sites | [benchmarks](references/benchmarks.md) |
| Where components come from, stack choices | [building](references/building.md), [stack](references/stack.md) |
| Replicas, surfaces in an existing app | [replication](references/replication.md), [surfaces](references/surfaces.md) |
| A design sheet, only when asked | [sheet](references/sheet.md) |
