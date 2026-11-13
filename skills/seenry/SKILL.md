---
name: seenry
description: "Designs and builds web products the way a studio does: a brief from real material, the agent's own default built and avoided, ten or more real reference screens from the Seenry library, each option composed from several references' principles (or traced from one when asked to replicate), type and color chosen as a system from an idea, every screen approved on the Seenry canvas, then a build checked against the design. Use for any design or UI task: a new app, site, landing page, dashboard or pricing page, a redesign, a screen that looks generic or AI-made, a page made like a named site, or a change to screens in an existing app. Routes to seenry-identity, seenry-canvas, seenry-craft, seenry-motion, seenry-review, seenry-break, seenry-subtract, seenry-audit, seenry-libraries, seenry-assets, seenry-apps and seenry-video."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.2.0"
---

# Seenry

This skill takes a design task from brief to built product. It decides what to design and what to avoid, hands the design to the canvas for the person to approve, then builds once and checks the build against the approved screens.

## Operating posture

You are a design studio's lead: you start from what is true about the product, you know what the generic answer looks like and you do not ship it, and you take structure from the best real work rather than from memory. The person's brief, brand and references outrank every default here. Firm everywhere: proof is never invented, every proposed design is shown on the canvas, and you report only what you checked.

Work in the project's stack. Read its tokens, components and `DESIGN.md` first, and extend them.

## Words this skill uses

The canvas words (canvas, screen, section, flow, option, tokens, round) mean what [seenry-canvas](../seenry-canvas/SKILL.md) defines. Two more:

| Word | Means |
| --- | --- |
| the default | What any model would build for this brief with no thought: the look to avoid |
| reference | A real product's screen that does the same job well |
| compose | Take principles from two or three references (scale, overlap of image and type, density, where space sits) and build your own layout around the product's idea |
| trace | Copy one reference's structure at measured values, then change only the identity. Only when the person asks to replicate |

## Which skill does what

Load a skill when the task reaches its area, not before.

| The task needs | Skill |
| --- | --- |
| Type and color: the idea, typefaces, palette, specimens | `seenry-identity` |
| Designing screens, options, review and handoff | `seenry-canvas` |
| Exact values: type, spacing, radius, shadow, color roles, states | `seenry-craft` |
| Anything that moves | `seenry-motion` |
| A review of a screen, a diff or one component | `seenry-review` |
| Which library to use before building a component by hand | `seenry-libraries` |
| Photos, icons, fonts, generated images | `seenry-assets` |
| Worst-case data: long names, empty lists, huge counts | `seenry-break` |
| Every state of one component: loading, empty, error, roles, plans | `seenry-states` |
| Building a finished design (Figma, image, approved canvas) so it matches | `seenry-implement` |
| Taking away what does not earn its place | `seenry-subtract` |
| A whole app surveyed into plans another agent can run | `seenry-audit` |
| Native mobile screens | `seenry-apps` |
| A product film | `seenry-video` |

## Hard rules

1. **Never invent proof.** No made-up testimonials, customers, logos, statistics, awards or press quotes. A missing fact nobody can supply gets a plain plausible value, listed under "Assumed".
2. **Never ship the default.** Each part of it is fine where it is the best answer; the screen as a whole may not be it.
3. **References give principles; the product gives the design.** Take from several references what makes each work (scale, how image and type meet, density, where space sits, how proof is shown), with the numbers, and compose your own layout around the idea. Copy one reference's layout only when the person asks to replicate. Never their words, logos, images or brand.
4. **One thing leads each screen.** Equal weight everywhere reads as a template, and neighboring sections of a page differ in composition.
5. **Material is real or absent.** Real product, photographs and data, or a type-led section. Never a gradient or drawing standing in for an image.
6. **Every affordance works.** A shortcut hint, badge or button with nothing behind it is wired up or removed.

## Workflow

```
- [ ] 1. Route
- [ ] 2. Brief from real material
- [ ] 3. Build the default
- [ ] 4. Ten or more references, studied and measured
- [ ] 4b. A composition for every option and section
- [ ] 4c. Real material
- [ ] 4d. Type and color (seenry-identity)
- [ ] 5. Design on the canvas (seenry-canvas)
- [ ] 6. Build from the handoff
- [ ] 7. Check the build against the design
```

### 1. Route

| The request | Route |
| --- | --- |
| A fix or small change inside an existing app | [Existing project](references/existing-project.md): no canvas unless you propose a visible change |
| A new product, site, page, screen or redesign | Steps 2 to 7 |
| "This looks generic", "make it not look AI-made" | [Unslop](references/unslop.md), then steps 3 to 7 |
| "Like X", "inspired by X" | [Named site](references/named-site.md), then steps 4 to 7 |
| "Show me options", "mock this up" | `seenry-canvas` alone |

**Done when** you know which steps apply.

### 2. Brief from real material

Write `.seenry/brief.md`: who it is for, the one job of each screen, the content that exists, what is fixed. List what each screen must hold from [screens](references/screens.md). Ask once for what is missing: real copy, prices, screenshots, photographs, the logo.

**Done when** every screen's job and content are written, and every gap is either asked or listed as assumed.

### 3. Build the default

You cannot avoid a default you only describe, because you do not know your own. Spend ten minutes building the page you would make for this brief with no references and no skill, put it on the canvas as `00-default/default.html`, and render it. Then write five lines under "Default" in the brief from what you see: the first screen, the headline pattern, the section order, the palette and the type.

What current models produce with no thought, so expect to see it: warm off-white paper, a serif headline over Inter, small grey labels in a left column beside every section, a lettered or numbered list, one clever one-line title per section, one accent color, cards with rounded corners, and type-only sections because no image was at hand. The older default (a headline left with boxed media right, three feature cards, a quote band, a dark closing band) still appears too.

**Done when** the default is on the canvas and named, so every option can show how it differs.

### 4. Ten or more references, studied and measured

References are where the design comes from, so this step gets real time. Follow [research](references/research.md#ten-screens-for-a-new-design):

1. Search the Seenry library by its tags, not by guesses: read `get_design_taxonomy`, then search by element, style, category and curated picks, and walk the category's site collections. Add one search outside the category with `borrow_references`.
2. Download every candidate's poster and judge them on one contact sheet. Keep ten or more that pass on the pixels: one clear first read, tuned type, real material at real size, recognizable with the logo covered. Write why you rejected the rest.
3. Measure four of the kept pages with `compare_measurements`: headline size, weight and line height, body size, radius, button padding.
4. Save the kept screens to `.seenry/canvas/refs/`.

Without the library, use the person's links and `node scripts/bar.mjs --sites <domain>,…`, and still reach ten screens.

**Done when** ten or more references are on the canvas and four are measured.

### 4b. A composition for every option and section

Write `.seenry/compose.md`. For each option, and each section of a long page, name two or three references and the one principle taken from each, with its numbers (the headline at 155px with 0.8 line height from one, the image and wordmark overlapping from another, the price on the first screen from a third), then the product's own idea that ties them together. Neighboring sections take different principles, so a page never repeats one composition. Measure from the reference image scaled to the screen's width when `compare_measurements` has no numbers.

When the person asks to replicate ("like X", "replicate", "same as"), trace instead: one reference per option, its measured structure kept, only the identity changed.

Check each option with `canvas.mjs pair <screen> <reference>` against each of its references. Composing: if it reads as one reference with new colors, it is a reskin; change the layout. Tracing: if it drifted toward the default, move it back.

**Done when** every option and section has its references, principles and idea in `compose.md`.

### 4c. Real material

Every strong reference shows real images at large scale; a type-only page reads as generated. A product whose work is the point (an agency, studio, portfolio, shop or restaurant) shows that work first, large; ask for it before designing. Before building options, gather the material: the person's own photographs and work first, then license-clear photographs with `seenry-assets` (short concrete nouns on Openverse, The Met for art), each credited. Use stand-ins only where the person has none, mark them as placeholders on the canvas, list them under "Assumed", and never ship them as the person's own work. Never use an image that makes a false claim, such as another country's tiles on a Lisbon studio.

**Done when** each option has the images it needs, with their licenses recorded.

### 4d. Type and color

Run `seenry-identity`: the idea in one line, the clichés named, typefaces shortlisted from open-source, Fontshare and premium foundries, specimens and color studies with the real copy on the canvas, the person's pick, then `tokens.css` and the fonts with their licenses. Every option then uses this system, or an option-level variant of it that `seenry-identity` produced.

**Done when** `tokens.css` holds the chosen type and palette and `identity.md` lists each font's license.

### 5. Design on the canvas

Follow `seenry-canvas`, steps 1 to 8. Each option is built from its composition in the type and color system from `seenry-identity`; when the identity itself is still open, each option carries one of the shortlisted pairs and palettes, so the person chooses between looks, not three layouts of one palette. Put the default beside the options. Build the tokens from [look](references/look.md) when the project has none, and use `seenry-craft` for every value.

**Done when** every screen in scope is approved on the canvas.

### 6. Build from the handoff

Run `canvas.mjs handoff` and build from `HANDOFF.md` in the project's stack, moving `tokens.css` and the fonts in unchanged and following every spec. Use `seenry-libraries` before building any component by hand, `seenry-motion` before anything moves, `seenry-assets` for material, and [kits](references/building.md) when the project has no component library.

**Done when** every approved screen exists in the product. Before the next step, run `seenry-break` on every list, table, card and profile built against demo data.

### 7. Check the build against the design

Run `canvas.mjs compare <screen> <url>` for each built screen and look at its images, then use every control and see every state from the brief. Show the person the built screens on the canvas beside the approved ones.

**Done when** `compare` reports no unexplained differences and every state works.

## When the person says

| They say | You do |
| --- | --- |
| "Build me an app / a site / a page" | Steps 1 to 7 |
| "Make it look less generic" | Unslop, then steps 3 to 7 |
| "Make it like Linear" | Named site, then steps 4 to 7 |
| "Break it", "try the worst case" | `seenry-break` |
| "Show me every state", "what does it look like empty?" | `seenry-states` |
| "Build this Figma", "make it match the design" | `seenry-implement` |
| "Too much going on", "feels slow" | `seenry-subtract` |
| "Audit the whole app" | `seenry-audit` |
| "Just fix this" | Existing project |
| "Ship it" | Step 7 first; never ship an unchecked build |

## Tone

Plain and short. Lead the report with what the person approved, then what you checked.

```
Approved:  the screens and options approved, and what changed after the person's comments
Composed:  each option and section, its references, the principle from each, and the idea
Identity:  typefaces and their licenses, the palette and its source
Not the default: how the product differs from the default in the brief
Type and color: families and weights, the palette by role
Checked:   verify, compare, the states and controls used
Not checked: what you could not check
Assumed:   every fact you supplied that the person should replace
```

## Files

| Need | Read |
| --- | --- |
| What each kind of screen must hold, and its states | [screens](references/screens.md) |
| Type, color and imagery for the tokens | [look](references/look.md) |
| A change inside an existing app | [existing project](references/existing-project.md), [surfaces](references/surfaces.md) |
| A screen that looks generic | [unslop](references/unslop.md) |
| "Like X" and replicas | [named site](references/named-site.md), [replication](references/replication.md) |
| Seenry MCP recipes | [research](references/research.md) |
| Measured values from leading sites | [benchmarks](references/benchmarks.md) |
| Bundled component and transition kits | [kits](references/building.md) |
| Imagery rules | [imagery](references/imagery.md) |
| Libraries and stack choices | `seenry-libraries`, [stack](references/stack.md) |
| A design sheet, only when asked | [sheet](references/sheet.md) |
| Where the rules come from | [sources](references/sources.md) |
