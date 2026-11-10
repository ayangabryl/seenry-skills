---
name: seenry
description: "Design and build web pages and products the way a studio does: every screen designed first on a local canvas the person reviews, structure before look, then code. Use for a new landing page, site, dashboard, pricing page or app screen, a redesign, a page made like a named site, a screen that looks generic or AI-made, and changes to screens in an existing app. Start here for any design or UI task; it routes to seenry-canvas (the design canvas: screens, flows, options), seenry-craft (exact polish values), seenry-motion, seenry-review, seenry-assets, seenry-apps and seenry-video."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.0.0"
---

# Seenry

This skill takes a design task from brief to built product. Every screen is designed on a canvas and approved by the person before product code, each open decision is anchored to a real reference, and the build happens once.

## What is firm and what is judgment

Firm: every design you propose is shown on the canvas, the person approves the screens, proof is never invented, and you report only what you checked. Everything else is judgment in service of the brief. A brief, a brand or a reference the person shows outranks any default here.

Work in the project's stack. Read its tokens, components and `DESIGN.md` first, and extend them.

## Which skill does what

Load a skill when the task reaches its area, not before.

| The task needs | Skill |
| --- | --- |
| Designing screens before code: wireframes, mockups, flows, options | `seenry-canvas` |
| Exact values: type, spacing, radius, shadow, color roles, states | `seenry-craft` |
| Anything that moves: transitions, gestures, springs, scroll | `seenry-motion` |
| A review of a screen, a diff or one component | `seenry-review` |
| Photos, icons, fonts, generated images | `seenry-assets` |
| Native mobile screens and flows | `seenry-apps` |
| A product film | `seenry-video` |

## Pick the route first

| The request | Route |
| --- | --- |
| A fix or small change inside an existing app | [Existing project](references/existing-project.md): no canvas, keep its system |
| A new product, site, page, screen or redesign | The flow below |
| "This looks generic", "unslop this", "make it not look AI-made" | [Unslop](references/unslop.md), then the flow from step 2 |
| "Like X", "inspired by X" | [Named site](references/named-site.md), then the flow from step 3 |
| "Show me the screens first", "wireframe this", "give me options" | `seenry-canvas` alone |

## The flow

### 1. Brief from real material

Write `.seenry/brief.md`: who it is for, the one job of the screen, the content that exists, what is fixed. Then list what the screen must hold, from [screens](references/screens.md).

Ask once for what is missing: real copy, prices, product screenshots, photographs, the logo. Never invent proof. That means no made-up testimonials, customer names, logos, statistics, awards or press quotes. Where a fact is missing and nobody can be asked, write a plain plausible value and list it under "Assumed" in the report.

### 2. Name the default, then leave it

Write five lines in the brief under "Default": the first screen, the headline pattern, the section order, the palette and the type that any model would produce for this brief with no thought.

Today that is usually a headline on the left with boxed media on the right, a headline of two short sentences, a filled and an outlined button, three feature cards, a quote band, pricing, FAQ and a closing band, on off-white with one accent, in one grotesk.

Each part is fine where it is the best answer. The page as a whole may not be the default. Every option you make differs from it in structure, and you say how.

### 3. Anchor each option to a real reference

For each open decision (usually the first screen and the main screen), find two or three real screens that do that job well. At least one comes from outside the category. Save their screenshots to `.seenry/canvas/refs/`.

- With Seenry MCP: follow [research](references/research.md). Six calls or fewer for a new page.
- Without it: the person's links, or `node scripts/bar.mjs --sites <domain>,<domain>` to capture live first screens.

Take structure from a reference: what leads, the order, the density, how proof is shown. Never its colors, words, images or brand. Each option is anchored to a different reference, which is what keeps three options from being one option three times. Screens with an obvious answer need no reference and no options.

### 4. Map and wireframe every screen, and the person reviews

Follow `seenry-canvas`. Write the screen map: every flow and every screen in it, including empty, error and settings. Wireframe each screen with the real copy, one section per flow, linked to the next screen, with two or three options only on the open decisions from step 3. Open the canvas, then `canvas.mjs wait`. Build nothing until the feedback shows the flows approved and the options picked.

### 5. The look, then every screen designed

Skip the look options when the project already has a brand or tokens. Otherwise follow [look](references/look.md): set `tokens.css` on the canvas, then two or three key screens in two treatments, stage `look`. Once one is picked, bring every approved wireframe to the picked look, each linking the same `tokens.css`, stage `mockup`. Link the screens to each other so Present plays each flow, stage `prototype`, for one more review.

### 6. Build once

Run `canvas.mjs handoff` and build the approved screens from `HANDOFF.md` in the project's stack, moving the canvas's `tokens.css` and fonts in unchanged and following every spec.

- `seenry-craft` for every value.
- [Screens](references/screens.md) for the states and parts the screen must hold.
- `seenry-motion` before anything moves. Most things should not.
- `seenry-assets` for material. With no real image for a slot, compose without one. A drawn stand-in or a gradient in an image's place is worse than type alone.
- [Kits](references/building.md) when the project has no component library.

### 7. Check once, then show

1. Look at your own screenshots at 1440 and 390 wide. Compare each with its approved canvas screen.
2. Use every control, and see every state from step 1.
3. `node scripts/audit_page.mjs <url or file> --widths 1440,390` and fix what it lists.
4. Show the person the built screens on the canvas at stage `build`, beside the approved designs.

One pass. No scoring loop, no second model, no self-score. Fix what the person asks for next.

## Rules that hold on every route

1. **Show every proposal on the canvas.** A design, mockup, option or proposed change is put on the canvas and opened for the person, never only described or only coded.
2. **Screens before code, structure before finish.** No product code before the screens are approved, and no color, type or image decision before the structure is.
3. **One thing leads each view.** One dominant element per screen and per section. Equal weight everywhere reads as a template.
4. **Neighboring sections differ in composition.** The same heading, paragraph and cards three times is a skeleton.
5. **Material is real or absent.** Real product, real photographs, real data, or a type-led section. Never decoration standing in for content.
6. **Every affordance works.** A shortcut hint, badge or button with nothing behind it is wired up or removed.
7. **One token file.** Every size, space, radius, color and duration comes from it.
8. **Say what you did not verify.** A width not checked or a state not seen goes in the report as not verified.

## Keep the cost down

Read this file, then only the file a step names. A new product needs `seenry-canvas`, `seenry-craft` and at most two references per open decision. Wireframes are short HTML; spend effort on the decisions, not on polishing frames that may be rejected. Never read a file to be thorough, and never run a check twice on an unchanged page.

## Files

| Need | Read |
| --- | --- |
| What each kind of screen must hold, and its states | [screens](references/screens.md) |
| Type, color and imagery for the look step | [look](references/look.md) |
| A change inside an existing app | [existing project](references/existing-project.md), [surfaces](references/surfaces.md) |
| A screen that looks generic | [unslop](references/unslop.md) |
| "Like X" and replicas | [named site](references/named-site.md), [replication](references/replication.md) |
| Seenry MCP recipes | [research](references/research.md) |
| Measured values from leading sites | [benchmarks](references/benchmarks.md) |
| Bundled component and transition kits | [kits](references/building.md) |
| Imagery rules | [imagery](references/imagery.md) |
| Libraries and stack choices | [libraries](references/libraries.md), [stack](references/stack.md) |
| A design sheet, only when asked for one | [sheet](references/sheet.md) |
| Where the rules come from | [sources](references/sources.md) |

## Report

```
Approved:  the screens and flows approved, the options and look picked, and what changed after the person's comments
Anchors:   each reference and the structural idea taken from it
Not the default: how the page differs from the default named in the brief
Type and color: families, weights, the palette by role
Verified:  widths, states and controls checked; the audit result
Not verified: what you could not check
Assumed:   every fact you supplied that the person should replace
```
