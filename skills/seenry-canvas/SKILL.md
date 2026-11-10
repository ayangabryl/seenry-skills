---
name: seenry-canvas
description: "A local design canvas for designing many screens before building them: every screen is a live HTML frame at real device size, grouped into flows, with options side by side. The person pans and zooms, approves screens, picks between options and pins comments on elements; the agent reads the feedback and revises. Use when starting a new product or flow, when the person wants to see screens, wireframes, mockups or options before code, or when another Seenry skill reaches a design review. Works with any coding agent; needs only Node."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.0.0"
---

# Seenry Canvas

This skill gives the agent a design canvas on the person's machine, like a Figma page made of live HTML. The whole product is designed here, screen by screen and flow by flow, and approved before any product code is written.

The person decides. The agent never approves its own screens, and never asks a second model to choose.

## The canvas is a folder

`<skill>` is this folder. The canvas lives in `.seenry/canvas`, which ignores itself in git.

```
.seenry/canvas/
  canvas.json                     title, stage, the question for the person
  tokens.css                      one token file every screen links
  wire.css                        the wireframe kit
  01-onboarding/                  a folder is a section: one flow
    01-welcome.phone.html         a file is a screen; numbers set the order
    02-first-habit.phone.html
  02-home.options/                a folder ending .options holds alternatives
    a-week-list.phone.html        the person picks one
    b-tally-first.phone.html
  03-settings/
    01-account.html               no device suffix: desktop, 1440 × 900
  refs/                           reference screenshots, shown as their own section
```

| File ends in | Frame size |
| --- | --- |
| `.phone.html` | 390 × 844 |
| `.tablet.html` | 834 × 1112 |
| `.laptop.html` | 1280 × 800 |
| `.html` | 1440 × 900 |

A frame grows to the full height of its page. Its name is the page's `<title>`, and `<meta name="seenry-note" content="…">` is the line the person reads when they select it.

```sh
node <skill>/scripts/canvas.mjs init       # the folder, wire.css and tokens.css
node <skill>/scripts/canvas.mjs open       # starts it in the background, prints the address
node <skill>/scripts/canvas.mjs list       # the sections and frames as the canvas sees them
node <skill>/scripts/canvas.mjs feedback   # what the person approved, picked and commented
node <skill>/scripts/canvas.mjs stop
```

The canvas reloads a frame when its file changes, so keep it open across rounds.

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
- Links between screens are real: `<a href="02-first-habit.phone.html">` lets the person click through a flow with "Use it".
- Keep a screen under about 80 lines.

## 3. Options only where the answer is open

Most screens get one version. Put two or three versions in a `.options` folder only where the structure is a real decision, usually the main screen and the first screen of a landing page.

Options differ in structure: what leads, the order, the density. A different color, radius or font is the same option. Say the difference in each option's note.

## 4. Show it and stop

Run `open`, give the person the address, name the sections and the decisions you need from them, then end the turn. Write no product code while a review is open.

On the canvas the person can drag to pan, pinch or ctrl-scroll to zoom, press `1` to fit everything, select a screen, approve it or mark it for changes, pick an option, pin a comment on any element, and double-click a screen to use it. "Send to agent" saves `feedback.json`.

When they come back, run `feedback`. It prints each pick, the approved screens, the screens that need changes, each comment with the element it is pinned to, and the screens with no answer. Apply every comment or say why not. Ask about screens with no answer rather than treating silence as approval.

| Situation | Do |
| --- | --- |
| The person cannot open a local address (a cloud or remote session) | `canvas.mjs shot` writes `canvas.png`; show it and take the feedback in chat |
| No server can run | `canvas.mjs static` writes `canvas.html`, which opens from disk and copies feedback as text |
| Nobody is there to review (an unattended run) | Pick the option furthest from the default, approve nothing, and say what you chose and why |

## 5. Rounds, then the look, then the build

After the agent changes any screen, feedback from before the change is treated as stale, so an old approval is never read as a new one.

| Stage in `canvas.json` | The frames are |
| --- | --- |
| `wireframe` | Every screen in the kit, until the flows are approved |
| `look` | Two or three key screens in two treatments, built on `tokens.css`, in a `.options` folder |
| `design` | Every screen in the picked look. Each one links `../tokens.css`, so a token change updates them all |
| `build` | The running product's screens beside the approved designs: `<iframe src="http://localhost:…">` inside a frame, or a screenshot in `refs/` |

The token file the person approved at `design` moves into the product unchanged.

## Before you finish

| Check | Fix |
| --- | --- |
| A screen in the map with no frame | Add it, or remove it from the map and say why |
| Options that differ only in color, type or radius | Change the structure of one, or drop it |
| "Lorem", "Heading", "Image" or "Feature 1" on a screen | The real words |
| Product code written before the screens were approved | Stop and wait for feedback |
| A screen with no answer treated as approved | Ask about it |
| The canvas still running at the end of the task | `canvas.mjs stop` |
