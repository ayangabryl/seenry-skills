---
name: seenry-canvas
description: "Figma for AI agents: a local design canvas the agent designs on, sees, measures and verifies before writing product code. Screens are live HTML frames at real device size, grouped into flows, on one tiered token system. The agent renders PNGs to look at, reads each screen's layout tree with the variable behind every style, verifies overflow, contrast in both modes, tap targets, links and token use, diffs rounds, and compares the built product against the approved design. A person can open the same canvas to present, approve, pick options and comment. Use whenever an agent designs, proposes or mocks up screens, starts a product or flow, redesigns a screen, or checks a build against its design. Needs only Node; the seeing commands use Playwright."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.0.0"
---

# Seenry Canvas

This skill is the agent's design tool, the way Figma is a designer's. You design every screen here as live HTML on one token system, then look at it, measure it and verify it before any product code exists. When the product is built, you check the build against the approved design here too.

A person can open the same canvas to review. When one is there, they decide; when nobody is, the canvas still holds you to the same checks.

## The loop

1. **Design.** Write screens into the canvas folder on `tokens.css`, linked to each other.
2. **Look.** `render` the screens and look at the PNGs, at every device they ship on and in both modes. Never judge a screen you have not seen.
3. **Read.** `tree` gives each screen's layout as text: every element's box, text, link and spec, and the variable behind each style, with `!` on anything typed in. Use it to check alignment, spacing and hierarchy without guessing from pixels.
4. **Verify.** `verify` fails on sideways overflow, clipped text, contrast under 4.5:1 (3:1 for large text) in light and dark, text under 12px, controls with no name, links to screens that do not exist, and detached values. It warns on small tap targets, missing alt text and a component drawn differently across screens. Fix every error before anyone sees the screen.
5. **Review.** When a person is there, `open` the canvas and `wait` for their feedback. Otherwise pick the option furthest from the default, approve nothing, and say what you chose.
6. **Change.** After each round, `diff` shows what visibly changed, so you confirm the change you meant is the only one.
7. **Hand off and build.** `handoff` writes `HANDOFF.md`; build from it.
8. **Compare.** `compare <screen> <url>` puts the built screen beside its design: the share of pixels that differ, text that is missing, and every difference in size, weight, color, fill, radius and padding, with the three images to look at. The build is done when compare reports no differences you cannot explain.

Every command takes `--json` for output you can parse.

## Always show the design

Whenever you design, propose or mock up a screen, it goes on the canvas first, and a person who is present gets the canvas opened for them. Never describe a proposed design only in words, and never show it only as code. A one-line fix inside an existing screen is the only exception.

When a person is there, they decide. Never approve your own screens, and never ask a second model to choose.

## The canvas is a folder

`<skill>` is this folder. The canvas lives in `.seenry/canvas`, which ignores itself in git.

```
.seenry/canvas/
  canvas.json                     title, description, owner, stage, section status, flows, change log, archive reasons
  tokens.css                      the design system: variables, modes, text styles, effects, grids
  fonts/                          the real font files, self-hosted WOFF2
  wire.css                        the wireframe kit
  _foundations.html               generated from tokens.css on every start; never edit
  00-components/                  one sheet per component: every variant and state
    button.html
  01-onboarding/                  a folder is a section: one flow
    01-welcome.phone.html         a file is a screen; numbers set the order
    02-first-habit.phone.html
  02-home.options/                a folder ending .options holds alternatives
    a-week-list.phone.html        the person picks one
    b-tally-first.phone.html
  03-settings/
    01-account.html               no device suffix: desktop, 1440 × 900
  refs/                           reference screenshots, shown as their own section
  archive/                        options that lost, each with the reason; never deleted
  HANDOFF.md, FEEDBACK.md         written by the canvas for developers and for you
```

The canvas adds a generated **Cover** first: the title, description, owner, stage, every section with its status and how many screens are approved, the design system in use, and the recent changes. Fill `title`, `description` and `owner` in `canvas.json` so it reads like the front page of a team's file.

| File ends in | Frame size |
| --- | --- |
| `.phone.html` | 390 × 844 |
| `.tablet.html` | 834 × 1112 |
| `.laptop.html` | 1280 × 800 |
| `.html` | 1440 × 900 |

A frame grows to the full height of its page. Its name is the page's `<title>`, and `<meta name="seenry-note" content="…">` is the line the person reads when they select it.

```sh
node <skill>/scripts/canvas.mjs init       # the folder, wire.css and tokens.css
node <skill>/scripts/canvas.mjs open       # starts it, opens the browser, prints the address
node <skill>/scripts/canvas.mjs wait       # blocks until the person presses "Send to agent", prints the feedback
node <skill>/scripts/canvas.mjs list       # sections, frames and prototype links as the canvas sees them
node <skill>/scripts/canvas.mjs check      # values typed into screens instead of taken from tokens.css
node <skill>/scripts/canvas.mjs feedback   # the last feedback, without waiting
node <skill>/scripts/canvas.mjs status 01-onboarding review   # in-progress, review or ready (for dev)
node <skill>/scripts/canvas.mjs resolve 02-home                # keep the picked option, archive the rest with why
node <skill>/scripts/canvas.mjs archive 03-home/old --reason "…"
node <skill>/scripts/canvas.mjs log "Shorter welcome headline, per review"
node <skill>/scripts/canvas.mjs handoff    # HANDOFF.md: screens, flows, specs, tokens, fonts, open questions
node <skill>/scripts/canvas.mjs stop
```

The seeing commands need Playwright, found in the project or passed with `--playwright <path to playwright/index.mjs>`. Screens are ids or section names; none means every screen. `--dir` points at a canvas folder other than `.seenry/canvas`.

```sh
node <skill>/scripts/canvas.mjs render 01-onboarding --mode both       # PNGs in .seenry/canvas/.renders/
node <skill>/scripts/canvas.mjs render 03-home --device all --scale 2  # phone, tablet and desktop
node <skill>/scripts/canvas.mjs tree 01-onboarding/01-welcome          # boxes, text and the variable behind each style
node <skill>/scripts/canvas.mjs verify                                 # exits 1 on any error
node <skill>/scripts/canvas.mjs diff 01-onboarding                     # pixels changed since the last render, with a diff image
node <skill>/scripts/canvas.mjs compare 03-home http://localhost:5173/ # the build against its design
```

There is nothing to install and no account: the script is plain Node and serves only to `127.0.0.1`. The canvas reloads a frame when its file changes, so keep it open across rounds. Without the skill installed (for example when only the Seenry MCP is connected), download the script once from `https://seenry.design/skills/seenry-canvas/scripts/canvas.mjs` into `.seenry/` and run it from there.

## The workflow, the way a design team runs it

| Stage in `canvas.json` | What is on the canvas | The person decides |
| --- | --- | --- |
| `map` | One wireframe frame per screen, titles only, in flow order | Are these the right screens and flows? |
| `wireframe` | Every screen in the wireframe kit with real copy; options only on open decisions | Structure and flow |
| `look` | Foundations and two or three key screens in two visual treatments, built on `tokens.css` | The look and the system |
| `mockup` | The component sheets, then every screen in the picked look, each linking `../tokens.css` | Each component and screen, at full fidelity |
| `prototype` | The same screens linked to each other, so Present plays the flow | Does the flow work in use? |
| `build` | The running product's screens beside the approved mockups | Sign-off before release |

A small project can merge stages: a single screen goes straight from `wireframe` to `mockup`. Never skip the person's review between stages.

## Build it like a design team's Figma file

Large product teams keep their files in the same shape: foundations first, then components, then flows, with every value bound to a variable. The canvas works the same way.

**Variables, in tiers.** `tokens.css` holds primitives (raw ramps and scales such as `--gray-600`, `--size-16`), then semantic variables by role (`--color-text-secondary`, `--space-4`, `--radius-md`), which are the only ones screens use. A screen that uses a primitive or types a raw value has a detached value. Name semantic variables by role, never by hue: `--color-accent`, not `--color-blue`.

**Modes.** Light is the default; dark is a second set of semantic values under `:root[data-theme="dark"]`, designed as its own palette. The canvas's mode switch (`D`) flips every screen at once, which shows any screen with detached colors immediately.

**Styles.** Text styles are `.text-*` classes that set family, size, line height, weight and tracking together, one per role. Effects are `--shadow-*` and `--ring-*` variables. Layout grids are `--grid-columns`, `--grid-gutter`, `--grid-margin` and `--grid-max` per breakpoint, shown on every screen with the grid toggle (`G`).

**Fonts.** Use the real typeface from the first mockup, never a system stand-in. Put WOFF2 files in `fonts/` with `@font-face` at the top of `tokens.css`, or a Google Fonts `<link>` in each screen. Foundations marks any font that did not load. The same files move into the product.

**Foundations section.** The canvas generates it from `tokens.css`: every variable in both modes, each text style as a specimen, fonts, spacing, radius, effects, grids and motion. It updates live, so the person reviews the system before the screens.

**Components.** Each component gets one sheet in `00-components/`, showing every variant across every state: default, hover, focus, pressed, disabled, loading, error. Screens reuse the same classes, so a component changes in one place. Name each cell the way Figma names variants: `Button / Primary / Hover`.

**Auto layout.** Lay out with flex or grid and `gap`, sized from the spacing variables, never with absolute positions or spacer elements. A frame then reflows the way the built product will.

**Frames and names.** One file per screen and state, numbered in flow order: `03-home.phone.html`, `03-home-empty.phone.html`, `03-home-error.phone.html`. A screen that ships on several devices gets a frame for each: `03-home.phone.html` and `03-home.html`. Titles read the same way: "Home · Empty".

**Dev Mode.** Select a screen, press `I` or Inspect, and click any element. The canvas shows its size, padding, gap, font, text style, colors, radius and shadow, each with the variable it is bound to, and flags anything that is not a variable. Developers build from this, as they would from Figma's Dev Mode.

**Before showing mockups, run `check`.** It lists every detached value per screen. From the `mockup` stage, detached values and screens that do not link `tokens.css` are errors.

## Keep the file in order, round after round

**Status on every section.** Label each section the way design teams do: `in-progress` while you work, `review` when you show it, `ready` once every screen in it is approved. The labels show on the cover, the outline and the canvas.

**Approvals last.** An approval stays until that screen's file changes, so each round only asks about what changed. The cover counts approved screens per section.

**Decisions are archived, not deleted.** After the person picks an option, run `resolve <section>`. It keeps the picked screen, renames the folder from `.options`, repoints every link to it, and moves the others to `archive/` with the reason and the person's notes. Anything else you drop goes through `archive --reason`. The archive is the record of why the product looks the way it does.

**Log every round.** After applying feedback, add one `log` line for what changed and why. The cover shows the latest lines, and the handoff lists them all.

**Named flows.** By default each section is a flow that starts at its first screen. For flows that cross sections, list them in `canvas.json`: `"flows": [{"name": "First run", "start": "01-onboarding/01-welcome"}]`. Present opens on the flow of the selected screen, and the person switches flows from its menu.

**Specs for developers, apart from feedback.** Comments are the person's notes to you. Specs are your notes to whoever builds it: put `data-spec="…"` on an element to say what it does, its rules and its edge cases. `data-spec="Tap: saves and opens Home. Disabled until a name is entered."` The person toggles them with `S`, Inspect shows them, and `handoff` lists them per screen.

**Hand off from the canvas.** When the sections you will build are `ready`, run `handoff` and build from `HANDOFF.md`: every screen with its file, size, links and review state, every spec, the token file, fonts and components, the open questions, and what was decided against.

**One design system for many products.** A design system can be its own canvas: tokens, fonts, Foundations and component sheets, with no screens. Point a product at it with `init --library <path to its .seenry/canvas>`. The product then has no `tokens.css` of its own; its screens link `../library/tokens.css`, and the library's Foundations and components show at the top of the product canvas, read-only. Change the library once and every product that links it updates.

## 1. Map the product before drawing it

Write the screen map in `canvas.json` or the brief first: every flow, and every screen in each flow, in the order a person meets them. A new product usually has onboarding, the main screen, one or two detail screens, settings, and the empty and error states. One line per screen: its job and what it shows.

Show the map to the person in chat if the product is large. A missing screen is cheaper to find here than after the wireframes.

## 2. Wireframe every screen

Each screen links `../wire.css` and uses plain HTML with its classes. No brand color, no chosen typeface and no images, so the person judges structure and flow alone.

| Class | Use |
| --- | --- |
| `wf-wrap`, `wf-section`, `wf-nav` | Page width, a section, the header |
| `wf-stack`, `wf-row`, `wf-cols` (`--cols`), `wf-split` (`--a`, `--b`) | Layout |
| `wf-img`, `wf-ui` (`--ratio`) | A photograph or a product view, with its subject written inside |
| `wf-btn`, `wf-btn quiet` | The main action, a secondary one |
| `wf-big`, `wf-muted`, `wf-small`, `wf-dark`, `wf-box`, `wf-rule` | Emphasis and grouping |
| `wf-note` | A note to the reviewer, never part of the design |

- Real copy, real labels, real numbers. Lorem ipsum hides the problems a wireframe exists to show.
- Inside each `wf-img` and `wf-ui`, say what it will be: "Photo: the oven at 4 am", not "Image".
- Links between screens are real: `<a href="02-first-habit.phone.html">`. The canvas draws each link as a flow arrow, and Present mode follows it, so the flow is a clickable prototype from the first wireframe.
- Keep a screen under about 80 lines.

## 3. Options only where the answer is open

Most screens get one version. Put two or three versions in a `.options` folder only where the structure is a real decision, usually the main screen and the first screen of a landing page.

Options differ in structure: what leads, the order, the density. A different color, radius or font is the same option. Say the difference in each option's note.

## 4. Show it, then wait for the person

1. Run `open`. It opens the canvas in the person's browser and prints the address.
2. Tell the person in one or two lines what is on the canvas and the decisions you need.
3. Run `wait`, in the background if your agent can run background commands, so you resume the moment the person presses "Send to agent". The canvas shows them that you are waiting. If your agent cannot wait, end the turn and run `feedback` when they say they are done.
4. Write no product code while a review is open.

On the canvas the person can drag to pan, pinch or ctrl-scroll to zoom, press `1` to fit everything, press `P` to present a flow at real size and click through it, select a screen, approve it or mark it for changes, pick an option, pin a comment on any element, and double-click a screen to use it in place. The keys are listed at the bottom of the panel, so nobody needs to have used Figma.

The feedback lists each pick, the approved screens, the screens that need changes, each comment with the element it is pinned to, and the screens with no answer. It is also saved as `FEEDBACK.md` in the canvas folder. Apply every comment or say why not. Ask about screens with no answer rather than treating silence as approval.

| Situation | Do |
| --- | --- |
| The person cannot open a local address (a cloud or remote session) | Use the host's own preview if it has one; otherwise `canvas.mjs shot` writes `canvas.png`; show it and take the feedback in chat |
| No server can run | `canvas.mjs static` writes `canvas.html`, which opens from disk and copies feedback as text |
| Nobody is there to review (an unattended run) | Pick the option furthest from the default, approve nothing, and say what you chose and why |

## 5. Rounds

After you change any screen, feedback from before the change is treated as stale and that screen's approval is cleared, so an old approval is never read as a new one. Each round: apply the feedback, `resolve` any picked options, `log` what changed, set each section's `status`, then show the canvas again. Move `stage` forward only when the person has approved the current one. The token file approved at `mockup` moves into the product unchanged.

## Before you finish

| Check | Fix |
| --- | --- |
| A screen in the map with no frame | Add it, or remove it from the map and say why |
| Options that differ only in color, type or radius | Change the structure of one, or drop it |
| "Lorem", "Heading", "Image" or "Feature 1" on a screen | The real words |
| A design proposed in chat or code without the canvas | Put it on the canvas and open it |
| Product code written before the screens were approved | Stop and wait for feedback |
| Screens in a flow with no links between them | Link them, so Present plays the flow |
| `check` lists detached values at the `mockup` stage or later | Bind them to variables, or add the missing variable to `tokens.css` |
| A font shown as not loaded on Foundations | Add the font files or the link |
| A component drawn differently on two screens | One component sheet; both screens use it |
| An options folder left after the person picked | `resolve` it |
| A round with no `log` line | Log what changed and why |
| A section shown for review without a status | `status <section> review` |
| Building without `HANDOFF.md` | Run `handoff` and build from it |
| A screen shown or approved without a `render` you looked at | Render it and look |
| `verify` reports errors | Fix them before showing the screen |
| A build called done without `compare` | Compare each built screen with its design |
| A screen with behavior but no `data-spec` | Add the spec |
| A screen with no answer treated as approved | Ask about it |
| The canvas still running at the end of the task | `canvas.mjs stop` |
