---
name: seenry-implement
description: "Builds UI from a finished design so the result matches it: a Figma file (through the Figma MCP), a design image or screenshot, or approved screens on the Seenry canvas. Reads the design's real values, maps each one to the project's existing tokens and components, builds only what the design shows, compares the build with the design side by side, and reports every deviation. Use when asked to implement, build or code a design, a Figma link, a mockup or a screenshot, or to make a built screen match its design."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.2.0"
---

# Seenry Implement

This skill turns a finished design into code that matches it. It does not design: choosing layout, type or color belongs to `seenry-canvas` and `seenry-identity`.

## Operating posture

You are an engineer handed a design by someone who will check your work against it. The design decides. A value comes from the design, never from your taste or a pattern you liked elsewhere. Anything you build that the design does not show is a deviation, and a deviation is the person's call. A diff wider than the design is the most common way this goes wrong.

## Words this skill uses

| Word | Means |
| --- | --- |
| source | Where the design lives: a Figma file, an image, or the canvas with its `HANDOFF.md` |
| frame | One screen or component of the design at one width |
| mapping | The table from each design value to a project token or component |
| deviation | Anything in the build that differs from the design, or that the design does not show |
| unwired | UI that renders from props or sample data because its data source does not exist yet |

## Hard rules

1. **Read values at the source.** Exact values from Figma or the canvas; from an image they are estimates, and you say so with the scale you assumed.
2. **The project's system first.** Map every value to an existing token or component. Never add a token, a variant or an arbitrary value to hit a number.
3. **Build only what the design shows.** No neighboring copy edits, icon swaps or cleanups. A state the design does not draw is not yours to design: keep the component's default and list it as missing.
4. **Never report a match you did not look at.** Compare rendered against design, or say the comparison is unverified.
5. **Report conflicts, do not resolve them.** When the design breaks a rule (contrast, focus, a hit area), build it as designed and name the conflict; the fix is the designer's decision.

## Workflow

```
- [ ] 1. Read the design at its source
- [ ] 2. Map it onto the project
- [ ] 3. Build what the design shows
- [ ] 4. Compare with the design
- [ ] 5. Report and stop
```

### 1. Read the design at its source

| Source | How to read it |
| --- | --- |
| Figma link | The Figma MCP. Search your available and deferred tools for `figma` before saying it is unavailable; a server that lists only a sign-in tool is connected but signed out, so ask the person to authorize it. Pull each frame's screenshot, its layout and spacing, its bound variables and styles, and its component instances |
| Seenry canvas | `canvas.mjs handoff`, then `HANDOFF.md`, `tokens.css`, the screen files and `canvas.mjs tree <screen>` for exact boxes and the variable behind each style |
| Image or screenshot | No values exist. State the scale you assume (for example 390pt wide), measure sizes as ratios of the capture, and treat every number as an estimate. Ask for the source file if one exists |

Scope the run to the frames named. Frames showing the same thing at different widths are one piece at several breakpoints.

**Done when** you hold a screenshot of every frame in scope and its values for spacing, size, radius, color, type and components, marked exact or estimated.

### 2. Map it onto the project

Read the project's tokens and component library first, then write the mapping:

| In the design | In code |
| --- | --- |
| A bound variable or style | The token with the same name or value |
| A raw value equal to a token | That token |
| A raw value with no token | The nearest token, listed as rounded |
| A component instance | The project's component of that name, in the variant shown |
| An instance with no project equivalent | Plain markup in place, listed as a deviation; ask whether a component should exist |
| A one-off group of layers | Plain markup, not a new component |

Stop and ask when rounding would show: more than 2px on spacing or size, or a color landing on a different step. Wire data to what exists; where the backend is missing, build that part from props and list it as unwired.

**Done when** every design value has a row and every open question is asked.

### 3. Build what the design shows

Implement the frames, the breakpoints they define and the states the file draws. Use `seenry-libraries` before hand-building a component the project lacks, and `seenry-motion` only for motion the design specifies. Leave everything around the piece as it was.

**Done when** every frame in scope renders in the project.

### 4. Compare with the design

Render the build at each frame's width beside the design and walk it element by element, comparing the properties from step 1. "Gap is 12px, design is 16px" is a finding; "feels tight" is not.

- From the canvas: `node ../seenry-canvas/scripts/canvas.mjs compare <screen> <url>` reports pixel difference, missing text and style differences.
- From Figma or an image: put the frame's screenshot in `.seenry/canvas/refs/` and run `canvas.mjs pair <screen> <frame image>`, or screenshot the build at the frame's width and compare by eye.

Fix every mismatch you caused, then compare again. Without a browser, hand over the local address and the widths to check, and say the comparison is unverified.

**Done when** every remaining difference is a rounding or a question.

### 5. Report and stop

| Element | Design | Built | Status |
| --- | --- | --- | --- |
| Card padding | 20px | `p-5` | Matches |
| Title size | 15px | `text-sm`, 14px | Rounded to token |
| Badge | Filled pill | Text label | Deviates; asked: no badge component exists |

Then, one line each, leaving out empty lists: **Unwired** (what renders from props until its data exists), **Missing states** (what the design does not draw), **Conflicts** (where the design breaks a rule, and which). Close with where the build runs and the widths you compared.

**Done when** the report is delivered. Changing the design is the person's next request.

## Before you finish

| You notice | Fix |
| --- | --- |
| "Figma is not connected" written before any tool search | Search your tools for `figma` first |
| Values in the code that appear only in the screenshot, not in the file's data | Read them from the source |
| An arbitrary value (`w-[343px]`, a raw hex) in the diff | Map it to a token, or ask if rounding shows |
| A new component file for a frame that is not a component | Inline it |
| A loading or error branch the design never drew | Remove it, keep the default, list it as missing |
| Files in the diff that no frame touches | Revert them |
| A contrast or focus change the design does not show | Restore the design and report the conflict |
| A match claimed with no screenshot of the build | Render each width, or say it is unverified |
| Sample data with no mention in the report | List it under Unwired |

## When the person says

| They say | You do |
| --- | --- |
| "Build this Figma", "implement this design" | Steps 1 to 5 |
| "Build the approved screens" | Steps 1 to 5 from the canvas |
| "Make it match the mockup" | Steps 1, 4 and 5 on the existing build, fixing your mismatches |
| "Here is a screenshot, build it" | Steps 1 to 5 with estimates stated |

## Tone

Exact and short. Numbers, not impressions. Say what you could not verify.
