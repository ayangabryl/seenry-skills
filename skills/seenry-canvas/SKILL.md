---
name: seenry-canvas
description: "Designs screens as live HTML on a local canvas before any product code, for the person to review and approve. Use when asked for a mockup, options, variants, wireframes or a prototype, when designing or redesigning a screen or flow, or to compare a built screen with its approved design. Not for the whole brief-to-build path (seenry) or choosing fonts and colors (seenry-identity). Needs Node; rendering uses Playwright."
license: Apache-2.0
metadata:
  author: Seenry
  version: "3.0.0"
---

# Seenry Canvas

This skill designs a product's screens on a local canvas before any product code is written, then checks the built product against them. It is the agent's design tool, the way Figma is a designer's.

## Hand-off

| Reads | Leaves | Next |
| --- | --- | --- |
| `.seenry/brief.md`, `tokens.css`, and `.seenry/compose.md` when `seenry` is driving | Approved screens on the canvas and `HANDOFF.md` | Build the approved screen (`seenry` step 6), then `canvas.mjs compare` |

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
| sketch | An option drawn as its first screen only, one viewport tall, marked `seenry-fidelity` `sketch`; only the picked one is extended to a full page |
| tokens | `tokens.css`, the one file every screen takes its values from |
| components | `components.css`, the one file every screen takes its shared controls from; the canvas draws its Components sheet |
| round | One cycle: show the canvas, get feedback, apply it |

## Hard rules

1. **No product code until the screens are approved.** Everything lives on the canvas. Building starts from `HANDOFF.md`.
2. **Every proposed design goes on the canvas.** Never describe a design only in words or show it only as code. The one exception is a one-line fix inside an existing screen.
3. **Every value comes from the tokens, every repeated control from `components.css`.** `check` and `verify` fail on a typed color, size, space or radius, and `check` flags a screen that redefines a shared component.
4. **You look before anyone else does.** Render every screen you change, look at the images, and pass `verify` before you show it.
5. **Options come from a teardown, never from memory.** Before the first option, every reference is opened at full size and counted in `.seenry/teardown.md`. Showing options composed without it is the top failure seen in testing, and `verify` blocks it.
6. **Options diverge on a named axis.** Before building, state each option's axis in a phrase. Two options that differ only in color or copy are one option.
7. **Everything works.** Real copy, plausible names and numbers, links between screens, every state the screen needs. No lorem ipsum, no dead buttons.
8. **Build on the canvas, live.** Write a screen's shell first, then add one part per save, so the person watches it come together. Never write a finished screen in one go, except a one-line fix.
9. **The person never does the bookkeeping.** You run `round` after each round; you never ask them to label, archive or name anything.

## Workflow

`<skill>` is this folder. Every command is `node <skill>/scripts/canvas.mjs <command>`; flags and output are in [commands](references/commands.md).

Copy this checklist and tick it as you go:

```
- [ ] 1. Scope: one product or flow, its screens, the speed
- [ ] 2. Recon: stack, existing tokens and components, real content
- [ ] 3. Tokens: tokens.css set, Foundations looks right in both modes
- [ ] 4. Teardown, then sketches: the references counted, the main screen in 2–3 named one-screen sketches, shown as they land
- [ ] 5. Screens: every screen, linked, with specs and review questions
- [ ] 6. Look and verify: verify --quick while working, full verify once, at most two rounds
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

First the teardown. Run `verify`: with references in `refs/` and no teardown yet, it writes full-size crops to `refs/crops/` and a section per reference in `.seenry/teardown.md`. Open each crop and replace every `__` with a count or a measurement. The worked example is [Waterline](../seenry/assets/examples/waterline/README.md); the bar is [the execution bar](../seenry/references/execution-bar.md). A wireframe round (`"stage": "wireframe"` in `canvas.json`) is exempt.

For the main screen, choose two or three directions. Write the set before building, one line each: a name for the direction (never "Option A"), its axis, when it is the right choice, and what it costs. One is the safe answer closest to what the category expects; at least one is bold. When you do not yet know the person's taste, spread the options across temperaments as well (one loud, one quiet, one bright), so their pick tells you which way to go; three variations of your own favorite teach you nothing.

**Compose from references, or trace when asked.** Each option starts from real reference screens in `refs/` (chosen by the research in `seenry`), never from memory. By default, take one principle from each of two or three references, with its numbers (a type scale, how image and type overlap, the density, where space sits), and compose your own layout around the product's idea. Copy one reference's measured structure and change only the identity only when the person asks to replicate. Type and color come from `seenry-identity`. Name the references in `seenry-note` and in `.seenry/compose.md`. `verify` puts each option beside those references and asks a blind judge two questions: is it a reskin of that one reference, and is it visibly less finished? A yes blocks the option, with the gaps named; fix them and run `verify` again.

**Sketch first, extend the winner.** Before writing any option, name the files with `plan` (`plan 02-home.options/quiet.html 02-home.options/ledger.html`), then `open` the canvas: each shows as a placeholder and fills in the moment its file is written, so the person watches the options arrive instead of waiting for all of them. Before each option, say what you are drawing and why in one line with `say "Drawing Ledger: the year's tally leads" --frame 02-home/ledger`; the person sees it on the canvas, on that screen. `render`, `verify`, `pair`, `round` and `handoff` post their own lines, so `say` is for intent only, about one line per screen. Build each option as a sketch: its first screen only, one viewport tall, finished (real copy, real images, the real type and color), with `<meta name="seenry-fidelity" content="sketch">`. A sketch is the decision, not a wireframe; it must be good enough to pick from. Label it in its head with `seenry-risk`, `seenry-axis`, `seenry-wins` and `seenry-cost`, and keep the default screen beside them so the difference shows. After the pick, extend only the winner to the full page and remove its `seenry-fidelity` tag; `round` keeps the section in progress until you do. Draw a full page for every option only when the person asks for it.

Mark each option's product view `data-seenry-product`. A product shown on a page is a whole app with a dozen kinds of UI and two or more kinds of visualisation, in one hue, under a two-line headline; `verify` counts it.

**Done when** `verify` exits 0: the teardown has no blanks, no option is judged a reskin or less finished than its reference, and each product view meets the count. Every option has a name, a distinct axis and its own look, and none resembles the default. `open` prints how long the first option took; report it.

### 5. Screens

**Build each screen live, one part per save.** First write its shell: the `<head>` with `tokens.css`, `components.css`, the fonts and the page's styles, and an empty `<body>` holding only a `<!-- next -->` marker. The empty frame appears on the canvas at once. Then add the parts in reading order, one edit each, inserting before the marker: the navigation, the headline, the lede, the product view, each section, the footer. Give each part's root element `data-seenry-part="Plan cards"`. Every save shows on the canvas as it lands: Seenry's cursor goes to the new part, the part builds up, its text types in, and the feed reads "Added Plan cards to Pricing". Follow keeps the part in view until the person moves the canvas. The content costs the same tokens it would in one write; each extra save costs about one tool call. Change a part with an edit to that part alone, never by rewriting the file.

Build every other screen in the tokens, one file per screen and state, linked to the next screen in its flow. On a long page, compose each section the same way, and give neighboring sections different principles so their compositions differ; three sections in a row with the same layout read as a template. Put `data-spec` on anything with behavior, and two or three review questions in `seenry-ask` about what that screen must get right. A control used on two screens (a button, a field, a tag, a card) goes in `components.css` with one comment line, `/* @component Button | <button class="btn">Save</button> | <button class="btn btn-quiet">Cancel</button> */`, and every screen links that file; the canvas draws the Components sheet from those lines, so there is no sheet to keep by hand. Naming and conventions are in [the file](references/file.md).

**Done when** every screen in the scope exists and every flow can be clicked through.

### 6. Look and verify

```sh
node <skill>/scripts/canvas.mjs render <screen> --mode both
node <skill>/scripts/canvas.mjs verify <screen> --quick
node <skill>/scripts/canvas.mjs verify
```

While you work, use `verify --quick`: the rule checks only, in seconds. Run the full `verify` once per version of a screen before you show it; it pairs each option with its references and asks the judge, and reuses a verdict until the screen changes. Look at every image and fix what looks wrong. Use `tree <screen>` when you need exact positions or the variable behind a style.

Stop after two rounds of render, look and fix. If something still fails, show the screens and name what is left in one line; the person's eye is worth more than a third round of yours.

**Done when** the full `verify` exits 0 (or two rounds are spent and what is left is named) and you have looked at every screen in both modes.

### 7. Review

With a person present, run `open` (the canvas opens on the options waiting for a pick, side by side). Inside an agent app it opens no tab and prints the exact call that shows the canvas in that app's own pane; make it, so the person never leaves the app. In a cloud session it writes `canvas.html` to publish instead. Below 820px wide the canvas shows one option at a time. Tell them in two lines what is on the canvas and what you need from them, then run `wait`: it returns when they press Send, or within 100 s with a line to run it again. They pick, ask for more like one, or click an element and say what to change. If your agent cannot wait, end the turn and run `feedback` when they say they are done.

The person who asked for the design counts as present, in a cloud session too: give them the canvas address (announce the port if your environment can preview it) or show `canvas.png` from `shot`, show the options side by side, and take their pick in chat. Never pick for them and report screenshots of a finished page instead.

With nobody to review (told to choose yourself, "auto-pick", a headless or unattended run), take the unattended path, never a silent one: pick the option furthest from the default, approve nothing, and record it with `canvas.mjs round "<what you chose and why>" --unattended "<why nobody can review>"`. The record lets the build gate run and marks every screen as not approved by a person; say so in the report.

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
| Every command, flag and output | [commands](references/commands.md) |
| The folder, screen naming, meta tags, tokens, components, specs, flows, shared libraries | [the file](references/file.md) |
| Studio speed: the map and wireframe rounds, and the wireframe kit | [wireframes](references/wireframes.md) |
