---
name: seenry-canvas
description: "The Seenry canvas: a local, Figma-style design canvas for wireframes, mockups and clickable prototypes before any product code. Every screen is a live HTML frame at real device size, grouped into flows, with options side by side and prototype links between screens. The person pans, zooms, presents the prototype, approves screens, picks options and pins comments; the agent receives the feedback directly. Use whenever an agent designs, proposes or mocks up screens, starts a new product or flow, or redesigns a screen. Works with any coding agent and needs only Node, with nothing to install or sign in to."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.0.0"
---

# Seenry Canvas

This skill gives the agent a design canvas on the person's machine, like a Figma file made of live HTML. The whole product is designed here, from wireframe to clickable prototype, and approved before any product code is written.

## Always show the canvas

Whenever you design, propose or mock up a screen, it goes on the canvas and you open the canvas for the person. That covers a new product, a new flow, a redesign, a proposed visual change and a set of options. Never describe a proposed design only in words, and never show it only as code. A one-line fix inside an existing screen is the only exception.

The person decides. Never approve your own screens, and never ask a second model to choose.

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
node <skill>/scripts/canvas.mjs open       # starts it, opens the browser, prints the address
node <skill>/scripts/canvas.mjs wait       # blocks until the person presses "Send to agent", prints the feedback
node <skill>/scripts/canvas.mjs list       # sections, frames and prototype links as the canvas sees them
node <skill>/scripts/canvas.mjs feedback   # the last feedback, without waiting
node <skill>/scripts/canvas.mjs stop
```

There is nothing to install and no account: the script is plain Node and serves only to `127.0.0.1`. The canvas reloads a frame when its file changes, so keep it open across rounds. Without the skill installed (for example when only the Seenry MCP is connected), download the script once from `https://seenry.design/skills/seenry-canvas/scripts/canvas.mjs` into `.seenry/` and run it from there.

## The workflow, the way a design team runs it

| Stage in `canvas.json` | What is on the canvas | The person decides |
| --- | --- | --- |
| `map` | One wireframe frame per screen, titles only, in flow order | Are these the right screens and flows? |
| `wireframe` | Every screen in the wireframe kit with real copy; options only on open decisions | Structure and flow |
| `look` | Two or three key screens in two visual treatments, built on `tokens.css` | The look |
| `mockup` | Every screen in the picked look, each linking `../tokens.css` | Each screen, at full fidelity |
| `prototype` | The same screens linked to each other, so Present plays the flow | Does the flow work in use? |
| `build` | The running product's screens beside the approved mockups | Sign-off before release |

A small project can merge stages: a single screen goes straight from `wireframe` to `mockup`. Never skip the person's review between stages.

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

On the canvas the person can drag to pan, pinch or ctrl-scroll to zoom, press `1` to fit everything, press `P` to present the prototype at real size and click through it, select a screen, approve it or mark it for changes, pick an option, pin a comment on any element, and double-click a screen to use it in place.

The feedback lists each pick, the approved screens, the screens that need changes, each comment with the element it is pinned to, and the screens with no answer. It is also saved as `FEEDBACK.md` in the canvas folder. Apply every comment or say why not. Ask about screens with no answer rather than treating silence as approval.

| Situation | Do |
| --- | --- |
| The person cannot open a local address (a cloud or remote session) | Use the host's own preview if it has one; otherwise `canvas.mjs shot` writes `canvas.png`; show it and take the feedback in chat |
| No server can run | `canvas.mjs static` writes `canvas.html`, which opens from disk and copies feedback as text |
| Nobody is there to review (an unattended run) | Pick the option furthest from the default, approve nothing, and say what you chose and why |

## 5. Rounds

After you change any screen, feedback from before the change is treated as stale, so an old approval is never read as a new one. Move `stage` forward only when the person has approved the current one. The token file approved at `mockup` moves into the product unchanged.

## Before you finish

| Check | Fix |
| --- | --- |
| A screen in the map with no frame | Add it, or remove it from the map and say why |
| Options that differ only in color, type or radius | Change the structure of one, or drop it |
| "Lorem", "Heading", "Image" or "Feature 1" on a screen | The real words |
| A design proposed in chat or code without the canvas | Put it on the canvas and open it |
| Product code written before the screens were approved | Stop and wait for feedback |
| Screens in a flow with no links between them | Link them, so Present plays the flow |
| A screen with no answer treated as approved | Ask about it |
| The canvas still running at the end of the task | `canvas.mjs stop` |
