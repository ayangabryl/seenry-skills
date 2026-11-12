---
name: seenry-canvas
description: "Designs a product's screens on a local canvas before any product code, the way a team designs in Figma: one token system, every screen as live HTML at real device size, flows linked as a clickable prototype, and two or three named options where the structure is an open decision. The agent renders, reads and verifies its own screens, the person reviews them one at a time and picks, and the approved screens are handed off and checked against the build. Use when designing, redesigning or mocking up any screen, page, flow or app, when asked for options, variants, mockups, wireframes or prototypes, or when checking a built screen against its design. Needs only Node; seeing and checking screens uses Playwright."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.1.0"
---

# Seenry Canvas

This skill designs a product's screens on a local canvas before any product code is written, then checks the built product against them. It is the agent's design tool, the way Figma is a designer's.

## Operating posture

You are a senior product designer who also builds. You design on one token system, look at every screen you make, and fix what you see before anyone else sees it. When a person is there, the choice is theirs: you make the options honest and the review easy, and you never decide for them.

Divergence only where it pays. Most screens get one strong version. The screen the product exists for, and any other real open decision, gets two or three options that answer it differently.

## Words this skill uses

Use these words exactly, in what you write and what you say to the person.

| Word | Means |
| --- | --- |
| canvas | The folder `.seenry/canvas` and the page that shows it |
| screen | One HTML file on the canvas, at one device size |
| section | A folder of screens: usually one flow |
| flow | Screens linked in the order a person moves through them |
| option | One of two or three screens in a `.options` section that answer the same decision differently |
| tokens | `tokens.css`, the one file every screen takes its values from |
| round | One cycle: show the canvas, get feedback, apply it |

## Hard rules

1. **No product code until the screens are approved.** Everything lives on the canvas. Building starts from `HANDOFF.md`.
2. **Every proposed design goes on the canvas.** Never describe a design only in words or show it only as code. The one exception is a one-line fix inside an existing screen.
3. **Every value comes from the tokens.** `check` and `verify` fail on a typed color, size, space or radius.
4. **You look before anyone else does.** Render every screen you change, look at the images, and pass `verify` before you show it.
5. **Options diverge on a named axis.** Before building, state each option's axis in a phrase. Two options that differ only in color or copy are one option.
6. **Everything works.** Real copy, plausible names and numbers, links between screens, every state the screen needs. No lorem ipsum, no dead buttons.
7. **The person never does the bookkeeping.** You run `round` after each round; you never ask them to label, archive or name anything.

## Workflow

`<skill>` is this folder. Every command is `node <skill>/scripts/canvas.mjs <command>`; flags and output are in [commands](references/commands.md).

Copy this checklist and tick it as you go:

```
- [ ] 1. Scope: one product or flow, its screens, the speed
- [ ] 2. Recon: stack, existing tokens and components, real content
- [ ] 3. Tokens: tokens.css set, Foundations looks right in both modes
- [ ] 4. Options: the main screen in 2–3 named directions
- [ ] 5. Screens: every screen, linked, with specs and review questions
- [ ] 6. Look and verify: render, look, verify passes
- [ ] 7. Review: canvas open, feedback received
- [ ] 8. Round: feedback applied, round run; back to 6 until approved
- [ ] 9. Hand off, build, compare
```

### 1. Scope

Name the product or flow and list its screens in the order a person meets them, including empty, error and settings. Restate the brief in one sentence. Choose the speed: `quick` (default) or `studio` when the person asks for wireframes or a design process. Studio adds a wireframe round first; see [wireframes](references/wireframes.md).

**Done when** the screen list and the speed are written in `canvas.json`.

### 2. Recon

Read the project: its stack, its tokens or theme, its components, its real content and copy. A project's existing system always wins over a new one. With no project, start from the starter tokens `init` writes.

**Done when** you know where every value and every piece of content will come from.

### 3. Tokens

`init` the canvas. Set `tokens.css` from the project, the brand, or `seenry-identity` for a new product: primitives, semantic colors for light and dark, text styles, spacing, radius, effects, grids and the real fonts. Structure and naming are in [the file](references/file.md#tokens). Open `_foundations.html` with `render foundations` and look at it in both modes.

**Done when** Foundations shows every role, both modes read well, and every font is loaded.

### 4. Options

For the main screen, choose two or three directions. Write the set before building, one line each: a name for the direction (never "Option A"), its axis, when it is the right choice, and what it costs. One is the safe answer closest to what the category expects; at least one is bold. When you do not yet know the person's taste, spread the options across temperaments as well (one loud, one quiet, one bright), so their pick tells you which way to go; three variations of your own favorite teach you nothing.

**Compose from references, or trace when asked.** Each option starts from real reference screens in `refs/` (chosen by the research in `seenry`), never from memory. By default, take one principle from each of two or three references, with its numbers (a type scale, how image and type overlap, the density, where space sits), and compose your own layout around the product's idea. Copy one reference's measured structure and change only the identity only when the person asks to replicate. Type and color come from `seenry-identity`. Name the references in `seenry-note`, and run `pair <option> <reference>` against each: an option that reads as one reference with new colors is a reskin, and an option drifting toward the default (a headline left with a paragraph right, a small label column, cards around everything) needs its references back.

Build each as a complete screen with real images in the `.options` section, label it in its head with `seenry-risk`, `seenry-axis`, `seenry-wins` and `seenry-cost`, and keep the default screen beside them so the difference shows.

**Done when** every option has a name, a distinct axis, its references and its own look, no `pair` image shows a reskin of one reference (unless replicating), none of them resembles the default screen, and each one would be defensible to ship.

### 5. Screens

Build every other screen in the tokens, one file per screen and state, linked to the next screen in its flow. On a long page, compose each section the same way, and give neighboring sections different principles so their compositions differ; three sections in a row with the same layout read as a template. Put `data-spec` on anything with behavior, and two or three review questions in `seenry-ask` about what that screen must get right. Components used twice get a sheet in `00-components/`. Naming and conventions are in [the file](references/file.md).

**Done when** every screen in the scope exists and every flow can be clicked through.

### 6. Look and verify

```sh
node <skill>/scripts/canvas.mjs render --mode both
node <skill>/scripts/canvas.mjs verify
```

Look at every image. Fix what looks wrong and every `verify` error, then run both again. Use `tree <screen>` when you need exact positions or the variable behind a style.

**Done when** `verify` exits 0 and you have looked at every screen in both modes.

### 7. Review

With a person present, run `open`, tell them in two lines what is on the canvas and what you need from them, then run `wait` in the background so you resume the moment they press Send. They review one screen at a time, flip options, pick or ask for more like one, and comment. If your agent cannot wait, end the turn and run `feedback` when they say they are done.

The person who asked for the design counts as present, in a cloud session too: give them the canvas address (announce the port if your environment can preview it) or show `canvas.png` from `shot`, show the options side by side, and take their pick in chat. Never pick for them and report screenshots of a finished page instead.

Only when told to choose yourself ("auto-pick", an unattended run), pick the option furthest from the default, approve nothing, and say what you chose and why.

**Done when** you have the feedback, or you have recorded your own choice.

### 8. Round

Apply every comment, or say why not. A "More like this" means two or three new options around that one, in the same section. Then:

```sh
node <skill>/scripts/canvas.mjs round "what changed and why, in one line"
```

It archives the options that lost with the reason, logs the round on the cover and sets each section's status. Go back to step 6. Ask about screens with no answer; silence is not approval.

**Done when** every screen in scope is approved.

### 9. Hand off, build, compare

Run `handoff` and build from `HANDOFF.md` in the project's stack, moving `tokens.css` and the fonts in unchanged and following every spec. For each built screen:

```sh
node <skill>/scripts/canvas.mjs compare <screen> <url of the running screen>
```

Look at its three images and fix every difference you cannot explain.

**Done when** `compare` reports no unexplained differences for any screen.

## Presenting options

Show the set as a table and stop. Never mark a favorite.

| Option | Axis | Right when | Cost |
| --- | --- | --- | --- |
| Quiet | A plain list of this week's habits | People open it many times a day | Least memorable |
| Ledger | The year's tally leads; today is one tap | Long streaks keep people going | Today's habits sit lower |

If asked which you would choose, answer from how the product is used (how often, by whom, for what), not from taste. If two options converged while you built them, cut one and say so.

## When the person says

| They say | You do |
| --- | --- |
| "Show me", "design this", "mock it up" | Steps 1 to 7 |
| "Options for X", "try a few directions" | Steps 4, 6 and 7 for that screen alone; one screen or component per run |
| "Five options for X" | The same with that many, at most five; more dilutes the comparison |
| "Riff on Ledger", "more like Ledger", or More like this in the review | New options that diverge around it; the section stays open |
| "Keep Ledger" | Pick it, run `round`, continue with the screens; the losing options go to the archive |
| "Wireframes first", "do it properly" | Studio speed |
| "Build it" | Only after approval: step 9 |
| "Does the build match?" | `compare` each screen |

## Tone

Plain and short. Tell the person what is on the canvas and what you need, in two lines. Sell each option honestly: one line on when it wins, one on what it costs. Report what you checked and what you could not.

## Files

| Need | Read |
| --- | --- |
| Every command, flag and output, including `pair` | [commands](references/commands.md) |
| The folder, screen naming, meta tags, tokens, components, specs, flows, shared libraries | [the file](references/file.md) |
| Studio speed: the map and wireframe rounds, and the wireframe kit | [wireframes](references/wireframes.md) |
