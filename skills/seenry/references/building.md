# Building the page

Components, transitions, the signature moment, illustration and alignment.

## Components come from the kit, never hand-rolled

- Copy [the core kit](../assets/components/ui/README.md) (`seenry-ui.css` and `seenry-ui.js`) into the project, set its tokens from the direction, and restyle only through tokens. It covers buttons, fields, select, checkbox, radio, switch, segmented control, tabs, menu, tooltip, dialog, sheet, toast, accordion, badge, avatars, cards, a sortable table, pagination, empty state, breadcrumb, skeleton and command menu. Its `gallery.html` shows every state in light and dark.
- React, Vue and Svelte projects use the README's snippets or the project's own library (Radix, Base UI, shadcn), styled to the same tokens. Never ship two component systems.
- **A component the kits lack** (hold to confirm, a status island, a reorderable list, a scrubber, anything with states and motion) gets a brief before code: fill in the template from [interaction craft](../../seenry-motion/references/interaction-craft.md), save it as `.seenry/components/<name>.md`, build to it, then review with that guide's checklist.

## Transitions are chosen by the interaction

Apply the frequency, keyboard and reduced-motion decisions from `seenry-motion` first. An instant state needs no decorative movement.

[Seenry Transitions](../assets/components/transitions/README.md) (`seenry-transitions.css` and `.js`) is optional on a plain page: apply by attribute (`data-st="modal"`, `data-st="number"`) or its small JS API.

- Its curves were measured frame by frame from real products ([production motion](../../seenry-motion/references/production-motion.md)): E enter `cubic-bezier(.16,1,.3,1)`, M move `(.4,0,.2,1)`, F fade `(.2,0,.2,1)`, X leave `(.4,0,1,1)`. When you use the kit, its curves are the project's set; see [easing tokens](standard.md).
- Durations 0, 80, 120, 160, 180, 240 or 280ms, chosen by distance, size and frequency, never one everywhere.
- Anything the hand moves or that retargets often (indicators, sheets, switches, dialogs) runs on the kit's springs (`--st-spring-snappy`, `-smooth`, `-gentle`, `-bouncy`, `-thumb`), so it reverses from wherever it is. Exact values and text never overshoot.

| Situation | Transition |
| --- | --- |
| Menus and popovers | Grow from the trigger; dismiss on selection, outside click and Escape |
| Confirmation dialog | Keeps its safe Cancel and Escape; no X added only because it is a dialog |
| Expanding card | Cover and title travel; the return control can stay at the source point |
| Bottom sheet | Follows the finger; dismisses on distance or flick |
| Search button | Opens into its command palette |
| Tabs and segmented controls | One shared indicator relocates; keyboard selection is instant |
| A value change worth animating | Only changed digits move, in the value's direction, with stable alignment |
| Content swap (tab panels, filters, before and after) | Keep the accepted state and any outgoing paint needed to finish or reverse; inactive content is never focusable; guard stale completion; no blank frames or double paint |
| Async action | The control morphs in one reserved footprint: label, spinner, drawn check. Copy rolls to "Copied" and back |
| Form error | A bounded 3px shake on the field plus a persistent message |
| List change | Surviving rows relocate, removed rows fade before collapsing, latest state wins |
| Loading | Skeletons in reserved geometry that cross-fade to content; AI thinking states from the kit, never dots |
| Page navigation | Side by side in the direction of travel, or a View Transition |

Richer components (slide to confirm, hold to delete, combobox, date range, waveform player) come from [the interaction kit](../assets/components/interaction/README.md). The judge's checklist is in [seenry-motion](../../seenry-motion/SKILL.md).

## One signature moment per new page

Every new page or redesign gets one crafted component that makes the product's behavior or the brand's idea visible. Edits inside an existing app do not. Choosing it is part of the design, so do not ask whether to add it.

- **It comes from the chosen idea, not a menu.** When the page makes one big claim, the strongest move is often the claim made visible, in the product's own unit, at a readable size.
- **"Many" is three to five readable instances and the one result they become,** never a cloud of chips, logos or dots.
- **Starting points:** [the statement component](../assets/components/statement/README.md) (a large editorial statement with proof inline) or [the signature kit](../assets/components/signature/README.md): product demo player, line draw-in, ambient field, scroll story, live numbers, logo marquee, compare slider, case-study hover. Adapt content, color and timing from `motion.md` so no two pages look alike, or build an original.
- **Placement:** where it explains most, usually the first screen or the product section.
- **Contract:** `data-seenry-signature="<name>"` on its root (`check.mjs` looks for it), a complete still state, never blocking reading, a pause control for loops longer than 5 seconds.
- **An idle loop may show the product doing its one job,** step by step in the real order: at most one per page, a 4 to 6 second period, paused on hover, off for reduced motion. Never reuse a loop from another page or a reference.

## Illustration, only when it can be drawn well

Use a drawn language only when the identity calls for it and you can draw it at an illustrator's standard. Otherwise photography, product and type carry the page.

- **One system, not assets.** Monoline isometric or orthographic drawings (1 to 1.5px strokes in text-2, one accent at most), or precise product diagrams from real UI parts. Hand-written SVG on the 8px grid, consistent angles (30° isometric) and stroke weights. Never mix flat icons, 3D clay and line art.
- **Explain, do not decorate.** Each drawing shows the thing beside it: the structure, the flow, the data's shape. Blobs, gradients and "tech" swirls are slop.
- **Draw in, do not fly in.** Reveal by stroke (`stroke-dashoffset`) or a mask sweep in 600 to 900ms, once.
- **People:** real photographs, or one consistent illustrated style for the whole set. Never mixed.

### Ambient canvas

A slow field, grid or line animation behind a first screen or closing section may carry the brand's movement. Start from seenry-motion's [signal field](../../seenry-motion/assets/signal-field/README.md), [boundary trace](../../seenry-motion/assets/boundary-trace/README.md) or [image reveal](../../seenry-motion/assets/image-reveal/README.md). Under 10% CPU, paused offscreen with `IntersectionObserver`, stopped for reduced motion, never text on moving pixels.

### Feature cards

One drawing per card, all in one hairline isometric language. When a figure of [hairline](https://github.com/lucasmarkes/hairline) (MIT, `npm i @lucasmarkes/hairline`) fits, use it:

| Feature | Figure |
| --- | --- |
| An app in layers | `exploded`, `phone` |
| Developer tools | `terminal`, `branches` |
| Data | `plot`, `phosphor` |
| Infrastructure | `cabinet`, `router`, `patch` |
| Security | `vault`, `padlock` |
| Scale | `elevator` |
| A stack of items | `riffle` |
| Literal objects | `keyboard`, `laptop`, `drawer` |

Theme it with `--hairline-plate` (the card's background), `--hairline-hi`, `--hairline-edge`, `--hairline-mid`, `--hairline-lo`. One figure per card, read-out outside the drawing. When none fits, draw your own in the same language: rounded solids as a silhouette plus one dim inner crease, the stroke as the only highlight, a composed uneven rest pose, no words or icons inside, spring motion that sleeps offscreen.

## Grid and alignment

- 4px base, 8px layout values, spacing `4 8 12 16 24 32 48 64 96 128`.
- Align ink, not boxes: a title's cap height meets the media's top edge; icons sit on the text keyline. Edges are exact or at least 8px apart ([alignment](alignment.md), [optical](optical.md)).
- Components have at most three sizes and three weights ([components](components.md)); pages share one shell ([pages](pages.md)).
