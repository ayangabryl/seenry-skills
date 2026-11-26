---
name: seenry-canvas
description: "Designs screens as live HTML on a local canvas before any product code, for the person to review and approve. Use when asked for a mockup, options, variants, wireframes or a prototype, when designing or redesigning a screen or flow, or to compare a built screen with its approved design. Not for the whole brief-to-build path (seenry) or choosing fonts and colors (seenry-identity). Needs Node; rendering uses Playwright."
license: Apache-2.0
metadata:
  author: Seenry
  version: "3.6.1"
---

# Seenry Canvas

This skill designs a product's screens on a local canvas before any product code is written, then checks the built product against them. It is the agent's design tool, the way Figma is a designer's.

## Hand-off

| Reads | Leaves | Next |
| --- | --- | --- |
| `.seenry/brief.md`, `tokens.css`, the references in `refs/` | Approved screens on the canvas and `HANDOFF.md` | Build the approved screen (`seenry` step 8), then `canvas.mjs compare` |

## Operating posture

You are a senior product designer who also builds. You design on one token system and look at every screen you make. The person is the judge: you get honest options in front of them fast, within 5 minutes of starting, and you never decide for them.

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
| sketch | An option drawn as its first screen only, one viewport tall, marked `seenry-fidelity` `sketch`, with its idea in `seenry-idea` and a real image in its hero; only the picked one is extended to a full page |
| tokens | `tokens.css`, the one file every screen takes its values from |
| components | `components.css`, the one file every screen takes its shared controls from; the canvas draws its Components sheet |
| round | One cycle: show the canvas, get feedback, apply it |

## Hard rules

1. **No product code until the screens are approved.** Everything lives on the canvas. Building starts from `HANDOFF.md`.
2. **Every proposed design goes on the canvas.** Never describe a design only in words or show it only as code. The one exception is a one-line fix inside an existing screen.
3. **Every value comes from the tokens, every repeated control from `components.css`.** `check` and `verify` fail on a typed color, size, space or radius, and `check` flags a screen that redefines a shared component.
4. **You look before anyone else does.** Render every screen you change, look at the image, and pass `verify` before you show it. Two rounds at most; then show it and name what is left.
5. **A sketch is an idea and an image.** Each carries one line, `seenry-idea`: the idea that will hold the whole page, and how its hero image and the interface meet. Its hero holds a generated or own image, never a flat block or a gradient. `verify` blocks a sketch without either.
6. **Options diverge on a named axis.** Before building, state each option's axis in a phrase. Two options that differ only in color or copy are one option.
7. **Everything works.** Real copy, plausible names and numbers, links between screens, every state the screen needs. No lorem ipsum, no dead buttons.
8. **Build the full page on the canvas, live.** A sketch is one write. A full page is its shell first, then one part per save, so the person watches it come together.
9. **The person never does the bookkeeping.** You run `round` after each round; you never ask them to label, archive or name anything.
10. **Patch, never regenerate.** Fix a screen with a targeted edit to the part that is wrong. Never rewrite a whole file that already has parts: it throws away what was approved and hides what changed. The canvas feed says "Rewrote" when one save changes every part of a screen.

## Workflow

`<skill>` is this folder. Every command is `node <skill>/scripts/canvas.mjs <command>`; flags and output are in [commands](references/commands.md).

Copy this checklist and tick it as you go:

```
- [ ] 1. Scope: one product or flow, its screens, the speed
- [ ] 2. Recon: stack, existing tokens and components, real content
- [ ] 3. Tokens: tokens.css set, Foundations looks right in both modes
- [ ] 4. Sketches: an idea line and a hero image each, the main screen in 2–3 named one-screen sketches, on the canvas within 5 minutes
- [ ] 5. Look and verify: at most two rounds
- [ ] 6. Review: canvas open, the pick received
- [ ] 7. Screens: the pick extended to the full page, then every other screen, linked, with specs
- [ ] 8. Round: feedback applied, round run; back to 5 until approved
- [ ] 9. Hand off, build, compare
```

### 1. Scope

Name the product or flow and list its screens in the order a person meets them, including empty, error and settings. Restate the brief in one sentence. Choose the speed: `quick` (default) or `studio` when the person asks for wireframes or a design process. Studio adds a wireframe round first ([wireframes](references/wireframes.md)), and `verify --studio` adds a written teardown of each reference and a blind judge on each option.

**Done when** the screen list and the speed are written in `canvas.json`.

### 2. Recon

Read the project: its stack, its tokens or theme, its components, its real content and copy. A project's existing system always wins over a new one. With no project, start from the starter tokens `init` writes.

**Done when** you know where every value and every piece of content will come from.

### 3. Tokens

`init` the canvas. Set `tokens.css` from the project, the brand, or `seenry-identity` for a new product: primitives, semantic colors for light and dark, text styles, spacing, radius, effects, grids and the real fonts. Structure and naming are in [the file](references/file.md#tokens). Open `_foundations.html` with `render foundations` and look at it in both modes.

**Done when** Foundations shows every role, both modes read well, and every font is loaded.

### 4. Sketches

Look at the references in `refs/` at full size (chosen by the research in `seenry`); write nothing about them. For the main screen, choose two or three directions and write one line for each: the idea that will carry the whole page, and how its hero image and the interface meet. One direction is the safe answer the category expects; at least one is bold. When you do not know the person's taste, spread them across temperaments (one loud, one quiet, one bright): three variations of your favourite teach you nothing. Two options that differ only in color or copy are one option.

Start each direction's hero image before you write any markup, so it generates while you draw: one job per direction in `img/jobs.json` (`node ../seenry/scripts/image.mjs --template` prints the fields), then `image.mjs --batch .seenry/canvas/img/jobs.json --background`. The person's own images come first.

Name the files with `plan` (`plan 02-home.options/quiet.html 02-home.options/ledger.html`): each shows as a placeholder and fills in when its file is written. Build each direction as a sketch: its first screen only, one viewport tall, with real copy, the real type and color, and its image in place. A sketch is the decision, not a wireframe. In its head:

```html
<meta name="seenry-fidelity" content="sketch">
<meta name="seenry-idea" content="The year's tally leads: a ledger page photographed from above, today's habit inked in on its last line">
<meta name="seenry-axis" content="Tally first">
<meta name="seenry-wins" content="Long streaks keep people going">
<meta name="seenry-cost" content="Today's habits sit lower">
```

Take one principle from each of two or three references (how image and type overlap, the density, where space sits) and compose your own layout around the product's idea; copy one reference's structure only when the person asks to replicate it. Mark a product view `data-seenry-product`: a product shown on a page is a whole app, a dozen kinds of UI and two kinds of visualisation in one hue, and `verify` counts it.

**Done when** every sketch holds its idea line and its image.

### 5. Look and verify

```sh
node <skill>/scripts/canvas.mjs render <screen> --mode both
node <skill>/scripts/canvas.mjs verify
```

`verify` is rule checks only, in seconds: overflow, clipped text, contrast, small text and tap targets, broken links, typed values; for a sketch, the idea line and the hero image; for the picked page, that the image or its motif (`data-seenry-motif`) returns below the hero. No model judges the screens: the person does. Each message names what is missing and the command that fixes it. Look at every render and fix what looks wrong; `tree <screen>` gives exact positions and the variable behind a style.

Stop after two rounds of render, look and fix. If something still fails, show the screens and name what is left in one line; the person's eye is worth more than a third round of yours.

**Done when** `verify` exits 0, or two rounds are spent and what is left is named.

### 6. Review

With a person present, run `open` (the canvas opens on the options waiting for a pick, side by side). Inside an agent app it opens no tab and prints the exact call that shows the canvas in that app's own pane; make it, so the person never leaves the app. In a cloud session it writes `canvas.html` to publish instead. `open` prints the time to the first sketch, to the pick and to the finished build, and keeps them in `canvas.json`. Tell the person in two lines what is on the canvas and what you need from them, then run `wait`: it returns when they press Send, or within 100 s with a line to run it again. They pick, ask for more like one, or click an element and say what to change. If your agent cannot wait, end the turn and run `feedback` when they say they are done. To share it beyond this computer, run `canvas.mjs link` once; `open` then keeps it synced to their Seenry account.

The person who asked for the design counts as present, in a cloud session too: give them the canvas address (announce the port if your environment can preview it) or show `canvas.png` from `shot`, show the options side by side, and take their pick in chat. Never pick for them and report screenshots of a finished page instead.

With nobody to review (told to choose yourself, "auto-pick", a headless or unattended run), take the unattended path, never a silent one: run `verify --judge` so a blind judge compares each option with its references, pick the option furthest from the default, approve nothing, and record it with `canvas.mjs round "<what you chose and why>" --unattended "<why nobody can review>"`. The record lets the build gate run and marks every screen as not approved by a person; say so in the report.

**Done when** you have the feedback, or you have recorded your own choice.

### 7. Screens

Run `round "<the pick and their note>"`, then extend the picked sketch to the full page and remove its `seenry-fidelity` line. The idea goes to the footer: the hero image comes back in lower sections in new crops, and `verify` blocks a full page where it never does.

**Build each full page live, one part per save.** Name its parts first: `plan 03-pricing/01-plans.html --parts "Nav,Hero,Plan cards,Footer"`. The canvas shows an empty page with Seenry's cursor waiting; it never draws a part before you write it. Then write its shell: the `<head>` with `tokens.css`, `components.css`, the fonts and every style the page will need, and an empty `<body>` holding only a `<!-- next -->` marker. Then add the parts in reading order, one edit each, inserting before the marker: the navigation, the headline, the lede, the product view, each section, the footer. Give each part's root element `data-seenry-part="Plan cards"`, the same name as in the plan. Each save lands in place within a fraction of a second: the part appears where you wrote it, Seenry's cursor moves to it, and the feed reads "Added Plan cards to Pricing". Keep styles in the shell: a save that changes the `<head>` reloads the screen instead of patching it. Change a part with an edit to that part alone, never by rewriting the file.

After each part, run `problems <screen>`: it lists sideways overflow, cut-off text, collapsed parts and overlapping text at the screen's width and at 390, from the canvas's own check of that save. Fix them in that part before the next one.

Build every other screen in the tokens, one file per screen and state, linked to the next screen in its flow. On a long page, compose each section the same way, and give neighboring sections different principles so their compositions differ; three sections in a row with the same layout read as a template. Put `data-spec` on anything with behavior, and two or three review questions in `seenry-ask` about what that screen must get right. A control used on two screens (a button, a field, a tag, a card) goes in `components.css` with one comment line, `/* @component Button | <button class="btn">Save</button> | <button class="btn btn-quiet">Cancel</button> */`, and every screen links that file; the canvas draws the Components sheet from those lines, so there is no sheet to keep by hand. Naming and conventions are in [the file](references/file.md).

**Done when** every screen in the scope exists and every flow can be clicked through.

### 8. Round

Apply every comment, or say why not, each as an edit to the part it names. A "More like this" means three new options around that one, in the same section, one per mode, each mode named in its `seenry-axis`:

| Mode | Keep | Change |
| --- | --- | --- |
| Same style, new layout | Tokens, type, image, idea line | The composition: what leads, where the image sits, the grid |
| New style, same content | Every word, number and the product view | Type, colour, image treatment, surfaces |
| Break its rule | Everything else | One rule the option obeys that nobody asked for (all centred, image always behind, one column), broken on purpose |

The canvas sends these three with the request: `feedbackLines` in `scripts/canvas.mjs` (and in `scripts/sync.mjs` for feedback sent online) prints them under each More like this. Then:

```sh
node <skill>/scripts/canvas.mjs round "what changed and why, in one line"
```

It archives the options that lost with the reason, logs the round on the cover and sets each section's status. Go back to step 5. Ask about screens with no answer; silence is not approval.

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
| "Show me", "design this", "mock it up" | Steps 1 to 6 |
| "Options for X", "try a few directions" | Steps 4 to 6 for that screen alone; one screen or component per run |
| "Five options for X" | The same with that many, at most five; more dilutes the comparison |
| "Riff on Ledger", "more like Ledger", or More like this in the review | Three options around it, one per mode (step 8); the section stays open |
| "Keep Ledger" | Pick it, run `round`, continue with the screens; the losing options go to the archive |
| "Wireframes first", "do it properly" | Studio speed |
| "Build it" | Only after approval: step 9 |
| "Does the build match?" | `compare` each screen |

## Tone

Plain and short. Tell the person what is on the canvas and what you need, in two lines. Sell each option honestly: one line on when it wins, one on what it costs. Report what you checked and what you could not.

## Files

| Need | Read |
| --- | --- |
| Every command, flag and output | [commands](references/commands.md) |
| The folder, screen naming, meta tags, tokens, components, specs, flows, shared libraries | [the file](references/file.md) |
| Studio speed: the map and wireframe rounds, and the wireframe kit | [wireframes](references/wireframes.md) |
