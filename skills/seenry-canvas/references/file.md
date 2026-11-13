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
  fonts/                      real font files, self-hosted WOFF2
  _foundations.html           generated from tokens.css on every start; never edit
  00-components/              one sheet per component
    button.html
  01-onboarding/              a section: one flow
    01-welcome.phone.html     a screen; the number sets its order
    02-target.phone.html
  02-home.options/            options: the person picks one
    a-quiet.phone.html
    b-ledger.phone.html
  refs/                       reference screenshots
  archive/                    options that lost, with the reason; never deleted
```

The canvas shows a generated cover first (title, description, owner, each section's status and approvals, recent changes), then Foundations, the sections in order, references and the archive.

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
| `<meta name="seenry-note" content="…">` | One line the person reads when they select the screen |
| `<meta name="seenry-ask" content="Question one?\|Question two?">` | Two or three review questions about what this screen must get right, in the person's words |
| `<meta name="seenry-risk" content="safe">` or `bold` | For an option: whether it is the expected answer or the bold one |
| `<meta name="seenry-axis" content="…">` | For an option: the direction it explores, in a phrase |
| `<meta name="seenry-wins" content="…">` | For an option: when it is the right choice |
| `<meta name="seenry-cost" content="…">` | For an option: what it gives up |

## Tokens

`tokens.css` is organized like Figma variables, in tiers:

1. **Fonts.** `@font-face` for the files in `fonts/`, or a Google Fonts `<link>` in each screen. Use the real typeface from the first screen.
2. **Primitives.** Raw ramps and scales: `--gray-600`, `--accent-500`, `--size-16`. Screens never use these directly.
3. **Semantic tokens.** Named by role, never by hue: `--color-text-secondary`, `--color-accent`, `--space-4`, `--radius-md`, `--font-body`. These are what screens use.
4. **Dark mode.** A second set of semantic colors under `:root[data-theme="dark"]`, designed as its own palette.
5. **Text styles.** `.text-display`, `.text-title`, `.text-heading`, `.text-body`, `.text-ui`, `.text-caption`, `.text-code`: each sets family, size, line height, weight and tracking together.
6. **Effects.** `--shadow-raised`, `--shadow-overlay`, `--ring-focus`.
7. **Layout grids.** `--grid-columns`, `--grid-gutter`, `--grid-margin`, `--grid-max` per breakpoint.
8. **Motion.** `--ease-out`, `--ease-in-out`, `--duration-*`.

A typed value or a primitive used in a screen is a detached value: `check` and `verify` report it. Foundations shows every token in both modes and marks any font that did not load.

## Components

A component used on two or more screens gets one sheet in `00-components/` showing every variant in every state: default, hover, focus, pressed, disabled, loading, error. Label each cell like a Figma variant, `Button / Primary / Hover`. Screens reuse the same classes, so the component changes in one place; `verify` warns when one class renders differently on two screens.

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

`round`, `status`, `resolve`, `archive` and `log` write `sections`, `log` and `archive` for you.

## A shared design system

A design system can be its own canvas: tokens, fonts and component sheets, with no screens. Link a product to it with `init --library <path to its .seenry/canvas>`. The product then has no `tokens.css` of its own; its screens link `../library/tokens.css`, and the library's Foundations and components show at the top of the product canvas, read-only.
