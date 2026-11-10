---
name: seenry
description: "Designs and builds web products the way a studio does: a brief from real material, the default look named and avoided, structure taken from real references, every screen designed and approved on the Seenry canvas, then a build checked against the design. Use for any design or UI task: a new app, site, landing page, dashboard or pricing page, a redesign, a screen that looks generic or AI-made, a page made like a named site, or a change to screens in an existing app. Routes to seenry-canvas (design on the canvas), seenry-craft (exact values), seenry-motion, seenry-review, seenry-assets, seenry-apps and seenry-video."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.0.0"
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
| reference | A real product's screen that does the same job well, used for structure only |

## Which skill does what

Load a skill when the task reaches its area, not before.

| The task needs | Skill |
| --- | --- |
| Designing screens, options, review and handoff | `seenry-canvas` |
| Exact values: type, spacing, radius, shadow, color roles, states | `seenry-craft` |
| Anything that moves | `seenry-motion` |
| A review of a screen, a diff or one component | `seenry-review` |
| Photos, icons, fonts, generated images | `seenry-assets` |
| Native mobile screens | `seenry-apps` |
| A product film | `seenry-video` |

## Hard rules

1. **Never invent proof.** No made-up testimonials, customers, logos, statistics, awards or press quotes. A missing fact nobody can supply gets a plain plausible value, listed under "Assumed".
2. **Never ship the default.** Each part of it is fine where it is the best answer; the screen as a whole may not be it.
3. **References give structure, never surface.** Take what leads, the order, the density and how proof is shown. Never their colors, words, images or brand.
4. **One thing leads each screen.** Equal weight everywhere reads as a template, and neighboring sections of a page differ in composition.
5. **Material is real or absent.** Real product, photographs and data, or a type-led section. Never a gradient or drawing standing in for an image.
6. **Every affordance works.** A shortcut hint, badge or button with nothing behind it is wired up or removed.

## Workflow

```
- [ ] 1. Route
- [ ] 2. Brief from real material
- [ ] 3. Name the default
- [ ] 4. References for each open decision
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

### 3. Name the default

Write five lines in the brief under "Default": the first screen, the headline pattern, the section order, the palette and the type any model would produce for this brief. Today that is usually a headline left with boxed media right, a two-sentence headline, a filled and an outlined button, three feature cards, a quote band, pricing, FAQ and a closing band, on off-white with one accent, in one grotesk.

**Done when** the default is written, so every option can say how it differs.

### 4. References for each open decision

For the screen the product exists for, and any other real open decision, find two or three real screens that do that job well, at least one from outside the category. Save them to `.seenry/canvas/refs/`. With Seenry MCP follow [research](references/research.md), six calls or fewer; without it use the person's links or `node scripts/bar.mjs --sites <domain>,<domain>`. Each option will be anchored to a different reference. Screens with an obvious answer need no reference.

**Done when** each open decision has its references saved, with one line each on the structure you will take.

### 5. Design on the canvas

Follow `seenry-canvas`, steps 1 to 8. Build the tokens from [look](references/look.md) when the project has none, and use `seenry-craft` for every value.

**Done when** every screen in scope is approved on the canvas.

### 6. Build from the handoff

Run `canvas.mjs handoff` and build from `HANDOFF.md` in the project's stack, moving `tokens.css` and the fonts in unchanged and following every spec. Use `seenry-motion` before anything moves, `seenry-assets` for material, and [kits](references/building.md) when the project has no component library.

**Done when** every approved screen exists in the product.

### 7. Check the build against the design

Run `canvas.mjs compare <screen> <url>` for each built screen and look at its images, then use every control and see every state from the brief. Show the person the built screens on the canvas beside the approved ones.

**Done when** `compare` reports no unexplained differences and every state works.

## When the person says

| They say | You do |
| --- | --- |
| "Build me an app / a site / a page" | Steps 1 to 7 |
| "Make it look less generic" | Unslop, then steps 3 to 7 |
| "Make it like Linear" | Named site, then steps 4 to 7 |
| "Just fix this" | Existing project |
| "Ship it" | Step 7 first; never ship an unchecked build |

## Tone

Plain and short. Lead the report with what the person approved, then what you checked.

```
Approved:  the screens and options approved, and what changed after the person's comments
Anchors:   each reference and the structure taken from it
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
| Libraries and stack choices | [libraries](references/libraries.md), [stack](references/stack.md) |
| A design sheet, only when asked | [sheet](references/sheet.md) |
| Where the rules come from | [sources](references/sources.md) |
