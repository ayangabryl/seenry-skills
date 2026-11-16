# The canvas file

How the canvas folder is laid out and what each part holds, organized the way design teams organize a Figma file: foundations, then components, then flows, with every value bound to a token.

## Contents

- The folder
- Screens and their names
- Meta tags a screen can carry
- Tokens
- Components
- Specs for developers
- Flows
- canvas.json
- A shared design system

## The folder

```
.seenry/canvas/
  canvas.json                 title, description, owner, speed, stage, sections, flows, log, archive reasons
  tokens.css                  the one design system every screen links
  components.css              the shared controls every screen links, one "@component" line each
  fonts/                      real font files, self-hosted WOFF2
  _foundations.html           generated from tokens.css on every start; never edit
  _components.html            generated from components.css whenever it changes; never edit
  01-onboarding/              a section: one flow
    01-welcome.phone.html     a screen; the number sets its order
    02-target.phone.html
  02-home.options/            options: the person picks one
    a-quiet.phone.html
    b-ledger.phone.html
  refs/                       reference screenshots
  archive/                    options that lost, with the reason; never deleted
```

The canvas opens on the options waiting for a pick. It lays out the open decisions first, then the other sections in order, the references, the cover (title, description, owner, each section's status and approvals, recent changes), Foundations and Components, and the archive.

## Screens and their names

| File ends in | Size |
| --- | --- |
| `.phone.html` | 390 × 844 |
| `.tablet.html` | 834 × 1112 |
| `.laptop.html` | 1280 × 800 |
| `.html` | 1440 × 900 |

A screen grows to the full height of its page. One file per screen and state, numbered in flow order: `03-home.phone.html`, `03-home-empty.phone.html`, `03-home-error.phone.html`. A screen that ships on several devices gets one file for each. Its name on the canvas is its `<title>`, written like "Home · Empty".

Screens in a section link `../tokens.css` (or `../library/tokens.css` with a shared design system). Lay out with flex or grid and `gap` from the spacing tokens, never with absolute positions or spacer elements, so a screen reflows the way the built product will.

## Meta tags a screen can carry

Put these in the screen's `<head>`.

| Tag | Holds |
| --- | --- |
| `<meta name="seenry-caption" content="…">` | The line under the frame on the canvas: five or six words, under 48 characters ("Ink on cream, one vermilion line"). Without it the canvas cuts the axis at its first colon or comma |
| `<meta name="seenry-note" content="…">` | One line the person reads when they select the screen |
| `<meta name="seenry-ask" content="Question one?\|Question two?">` | Two or three review questions about what this screen must get right, in the person's words |
| `<meta name="seenry-risk" content="safe">` or `bold` | For an option: whether it is the expected answer or the bold one |
| `<meta name="seenry-axis" content="…">` | For an option: the direction it explores, in a phrase; the full line shows in review, the caption on the canvas |
| `<meta name="seenry-wins" content="…">` | For an option: when it is the right choice |
| `<meta name="seenry-cost" content="…">` | For an option: what it gives up |
| `data-seenry-part="Plan cards"` on an element | The part's name, shown on Seenry's cursor and in the live feed as the part is added |
| `<meta name="seenry-fidelity" content="sketch">` | For an option: drawn as its first screen only. Remove it once the picked sketch is a full page |
| `<meta name="seenry-idea" content="…">` | The idea that carries the whole page, and how the hero image and the interface meet. `verify` blocks a sketch without it, and holds the full page to it |

## Tokens

`tokens.css` is organized like Figma variables, in tiers:

1. **Fonts.** `@font-face` for the files in `fonts/`, or a Google Fonts `<link>` in each screen. Use the real typeface from the first screen.
2. **Primitives.** Raw ramps and scales: `--gray-600`, `--accent-500`, `--size-16`. Screens never use these directly.
3. **Semantic tokens.** Named by role, never by hue: `--color-text-secondary`, `--color-accent`, `--space-4`, `--radius-md`, `--font-body`. These are what screens use.
4. **Dark mode.** A second set of semantic colors under `:root[data-theme="dark"]`, designed as its own palette.
5. **Text styles.** `.text-display`, `.text-title`, `.text-heading`, `.text-body`, `.text-ui`, `.text-caption`, `.text-code`: each sets family, size, line height, weight and tracking together.
6. **Effects.** `--shadow-raised`, `--shadow-overlay`, `--ring-focus`.
7. **Layout grids.** `--grid-columns`, `--grid-gutter`, `--grid-margin`, `--grid-max` per breakpoint.
8. **Motion.** `--ease-out`, `--ease-move`, `--ease-fade`, `--duration-*`.

A typed value or a primitive used in a screen is a detached value: `check` and `verify` report it. Foundations shows every token in both modes and marks any font that did not load.

## Components

A control used on two or more screens lives once, in `components.css`, and every screen links it after `tokens.css`. Above each component write one comment line naming it and giving its markup, one example per variant:

```css
/* @component Button | <button class="btn">Save</button> | <button class="btn btn-quiet">Cancel</button> | <button class="btn" disabled>Saving…</button> */
.btn { … }
```

The canvas draws the Components sheet from these lines, live, so it never drifts from the screens and costs one line per component. `check` warns when a screen redefines a class from `components.css` (change the file, or give the variant its own class there), and `verify` warns when one class renders differently on two screens. `handoff` lists each component with its classes so the build makes it once. A component that needs every state shown at once (hover, focus, pressed) can still get a hand-made sheet in `00-components/`.

## Specs for developers

Comments are the person's notes to you. Specs are your notes to whoever builds the screen: what an element does, its rules and its edge cases.

```html
<button data-spec="Tap: saves and opens Home. Disabled until a name is entered.">Save</button>
```

The person sees them with `S`, Inspect shows them, and `handoff` lists them per screen.

## Flows

Each section is a flow starting at its first screen. For flows across sections, list them in `canvas.json`:

```json
"flows": [{"name": "First run", "start": "01-onboarding/01-welcome"}]
```

Present opens on the flow of the selected screen and follows the links between screens.

## canvas.json

```json
{
  "title": "Kept",
  "description": "A habit tracker that counts weeks, not days.",
  "owner": "Ayan",
  "speed": "quick",
  "stage": "mockup",
  "question": "Pick a home screen and approve onboarding.",
  "flows": [{"name": "First run", "start": "01-onboarding/01-welcome"}]
}
```

`round`, `status`, `resolve`, `archive` and `log` write `sections`, `log` and `archive` for you; `init`, `plan` and `open` write `started`, `planned` and `firstOption`; the pick writes `picked`, the build gate `built`, and `timing` holds each in seconds from the start.

## A shared design system

A design system can be its own canvas: tokens, fonts and component sheets, with no screens. Link a product to it with `init --library <path to its .seenry/canvas>`. The product then has no `tokens.css` of its own; its screens link `../library/tokens.css`, and the library's Foundations and components show at the top of the product canvas, read-only.
