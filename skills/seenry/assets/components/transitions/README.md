# Seenry Transitions 2

24 interface transitions taken from real product surfaces. One stylesheet, one classic script, no dependencies, no build step, no network requests. Open [gallery.html](gallery.html) straight from disk.

```html
<link rel="stylesheet" href="seenry-transitions.css">
<script src="seenry-transitions.js" defer></script>
```

The script starts on `DOMContentLoaded` and picks up elements added later. After inserting markup yourself you can call `SeenryTransitions.init(root)`; calling it again is safe.

## What makes these premium

Every transition follows the same rules. The gallery and the motion judge check them.

- **Exact origin.** A surface grows from the thing that caused it. A menu's `transform-origin` is its trigger's centre on the facing edge. The button-to-menu morph unclips from the button's own rectangle. A dialog scales toward the button that opened it, a sheet rises from its screen edge, and an expanded card opens from the card.
- **Attached content.** Text rides its container and is never scaled by it. Size changes use a clip (`clip-path: inset()`) or a painted shell that scales behind the text, and followers move by FLIP.
- **Choreography.** The container says where, the content says what. New content starts 40 to 90ms into the container's motion, so the two overlap and nothing waits in series. Outgoing content clears before its space collapses.
- **Character.** Things the hand moves, or that retarget often, run on springs: indicators, sheets, switches, dialogs. A visible settle appears only where the material earns it (a like, a switch thumb). Exact values, text and data never overshoot.
- **Exit asymmetry.** Exits are shorter, travel less and accelerate out (curve X). Spatial returns such as a card collapsing back into its slot keep their geometry.
- **Interruptible.** Every animation starts from the currently rendered value. A second input 70ms into a change reverses it from where it is, with no flash and no restart.
- **Compositor only.** Only transform, opacity, clip-path, small filters and SVG strokes animate. Layout commits once.
- **Every input path.** Pointer, touch and keyboard all work. Hover is never the only way in: tooltips also open on keyboard focus and on a 450ms long-press, and the toast stack fans out on hover, focus or tap. Targets are at least 44px on coarse pointers.
- **Reduced motion.** Travel, scale, blur, loops and particles are removed. Where helpful, a change fades in 100ms or less. State, focus and announcements stay the same.

## Motion tokens

Curves and clocks come from `production-motion.md`: E `cubic-bezier(.16,1,.3,1)`, M `(.4,0,.2,1)`, F `(.2,0,.2,1)`, X `(.4,0,1,1)`. Durations are `--st-feedback` 80, `--st-quick` 120, `--st-control` 160, `--st-relocate` 180, `--st-surface` 240 and `--st-spatial` 280ms. Delays are 0, 40, 60 or 80ms, and pick by distance × size × frequency.

**Added in v2: springs.** Springs use the `spring(response, bounce)` parameters designers know from SwiftUI. They are baked into CSS `linear()` easing, so an ordinary CSS transition gets spring character and still retargets natively. The JS simulates the same springs for WAAPI.

| Token | spring(response, bounce) | Settles (0.4%) | Overshoot | Used for |
| --- | --- | --- | --- | --- |
| `--st-spring-snappy` | .26s, .04 | 300ms | none | menus, popovers, tooltip glide, segmented pill, digits, glyphs, chevrons |
| `--st-spring-smooth` | .36s, 0 | 445ms | none | sheets, drawers, shared elements, FLIP reflow, accordion, page slide |
| `--st-spring-gentle` | .34s, .08 | 348ms | none | dialog, toast stack |
| `--st-spring-bouncy` | .34s, .42 | 521ms | 10% | like heart, badge pop, state-icon change |
| `--st-spring-thumb` | .28s, .28 | 349ms | 3.6% | switch thumb |
| lead / trail (JS) | .19s / .34s, 0 | 280 / 445ms | none | the tab underline's two edges |

Why the values changed from the timed spec, measured on the springs: the study proposed E curves of 180 to 280ms. A spring's settle time includes a long, near-invisible tail. `snappy` reaches 73% of its travel at 100ms and 90% at about 150ms, which is the perceived speed of the 180ms E curve. It also keeps velocity when it is retargeted, so a reversal curves instead of snapping. The judge reports the full settle time, which is why durations of 300 to 445ms show up next to the spec's 180 to 280ms. The press compression (80ms) and all exits (80 to 220ms) keep their timed E, F and X curves, because an exit should never spring back.

## The catalog

| Transition | Markup or API | Motion |
| --- | --- | --- |
| Menu | `[data-st-target]` → `[data-st="menu"][popover]` | scale .96→1 and y ∓4 from the trigger point, snappy; opacity 120 F; rows attached; exit 110ms X to .97 |
| Button to menu | `[data-st="plus-menu"]` or `data-st-morph` | clip-path from the button's rect with its radius, snappy; a painted copy of the button fades over it; items +50ms; closes back into the rect |
| Dialog | `dialog[data-st="modal"]` | origin toward the trigger, scale .95→1 gentle; backdrop 160 F; exit 140 X |
| Command palette | `dialog[data-st="palette"]` with `[data-st-palette-input]` and `[role=listbox]` | y −8, scale .98 from the top edge; results reflow by FLIP; one highlight travels (snappy); arrows, Enter, Escape |
| Bottom sheet | `[data-st="sheet"]` (dialog or in-container), `data-st-recede` | y 100%→0 smooth; the page behind scales to .94 and rounds; drag follows the finger 1:1 and dismisses past 30% or on a flick over 0.5px/ms |
| Drawer | `[data-st="drawer"]`, `data-st-side="left"` | x 100%→0 smooth, content fixed to it; scrim; exit 220 X |
| Tooltip | `[data-st-tip="id"]` → `[data-st="tooltip"]` | 400ms dwell once, then the bubble glides between neighbours; focus opens at once; long-press on touch; exit 80 F |
| Card expand | `SeenryTransitions.expand(card, detail)`, `[data-st="expand"]`, `[data-st-shared]` | surface unclips from the card's rect; cover and title travel (smooth); detail content +90ms; collapse returns to the card |
| Tabs | `[data-st="tabs"]` | the underline's leading edge lands first (.19s) and the tail follows (.34s); panel slides ±14px in the direction of travel; arrow keys move without the stretch |
| Segmented control | `[data-st="segmented"]` | pill on snappy; the selected label is a clipped copy, so its colour changes exactly under the pill |
| Page transition | `SeenryTransitions.page(dir, update, scope, {shared})` | View Transitions: old page 140ms X out, new page x ±48 smooth in, shared elements morph; WAAPI slide fallback |
| Accordion | `details[data-st="accordion"]` | layout commits at once; the answer is revealed by a clip that tracks the rows below as they FLIP down; closing clips a copy up |
| Button states | `button[data-st="button"][data-st-labels="A\|B"]`, `state(el, 'loading'\|'success'\|'error'\|'idle', label)` | footprint reserved for the widest state; icon springs in; label recentres by FLIP; check and cross draw; error shakes |
| Copy | `[data-st="copy"][data-st-copy]` | glyph swap at scale .5 and blur 3 in a fixed box; the label rolls to Copied; reverts after 1.6s |
| Like | `button[data-st="like"]` | heart .55→1 bouncy, a ring and six sparks (420ms E); the count rolls; unliking is quiet |
| Switch | `label.st-toggle > input[role=switch]` | thumb stretches toward its destination while pressed; travel on thumb spring; track 160 F |
| Checkbox | `label.st-check`, optional `.st-strike` | fill 120 F, tick draws 160 E, strike-through draws +40ms |
| Form error | `[data-st="error"]`, `shake(el, message)`, `clearError(el)` | the field frame shakes on a sampled decaying spring (6px, 2 cycles, 320ms; the message follows at 60ms); the message is revealed by clip in reserved space |
| Toast stack | `toast(region, message, {description, action, duration})` | rises from the stack edge (gentle); older toasts tuck to scale 1 − .05n; fans out on hover, focus or tap; swipe with velocity; pauses while expanded |
| Number | `[data-st="number"]`, `number(el, value, opts)` | only changed places roll, in the direction of the change; unchanged digits slide when the width changes; neighbours follow; 12ms offsets capped at 36 (none for steppers); digits use the .16s spring |
| Text change | `[data-st="text"]`, `swapText(el, text)`, `data-st-fit` | old glyphs lift and blur out (120 X), new glyphs rise into focus (snappy, 12ms offsets capped at 48); a fitted container resizes as a painted shell |
| List | `list.add(container, node, i)`, `list.remove(item)`, `list.reorder(container, fn)` | FLIP on smooth; a removed row fades first, then neighbours close the gap 40ms later; identity is kept through a sort; no stagger |
| Skeleton to content | `[data-st="skeleton"][aria-busy]`, `skeleton(el, ready)` | reserved geometry; mask 120 F; content 180 F; media blur 8→0 and scale 1.03→1 |
| AI thinking and streaming | `[data-st="thinking"]`, `[data-st="stream"]`, `stream(el, chunk, {reset, done})` | honest status swaps with a sheen; words sharpen from blur 4 as they arrive, batched per frame, no fake delay |

## JS API

```js
SeenryTransitions.open(el, trigger?)   .close(el)   .toggle(el, trigger?)
SeenryTransitions.number(el, value, {locale, format, frequent})
SeenryTransitions.swapText(el, text, {fit})
SeenryTransitions.state(button, 'idle'|'loading'|'success'|'error', label?)
SeenryTransitions.shake(el, message?)   .clearError(el)   .success(el)
SeenryTransitions.copy(el, text?)   .like(el, on?)   .icon(el, on)   .pop(el)
SeenryTransitions.tab(root, tab, keyboard?)   .accordion(details, open?)
SeenryTransitions.resize(el, update)   .flip(elements, mutate, {spring})
SeenryTransitions.list.add(container, node, index) / .remove(item) / .reorder(container, compareOrNodes)
SeenryTransitions.expand(source, detail)   .collapse(detail)
SeenryTransitions.page('forward'|'back', update, scopeEl?, {shared: [keys]})
SeenryTransitions.toast(region, message, {description, action: {label, onClick}, duration})
SeenryTransitions.skeleton(el, ready)   .stream(el, chunk, {reset, done})
SeenryTransitions.reveal(el)   .shimmer(el)   .init(root)
SeenryTransitions.play(el, keyframes, {spring|ms, curve, delay, channel, fill})   .spring(name)
SeenryTransitions.tooltip.show(trigger) / .hide()
```

Events: `st:open`, `st:close`, `st:tab-change`, `st:accordion`, `st:state`, `st:number`, `st:like-change`, `st:stream-end`, `st:palette-select`.

`play()` is the primitive everything else uses: one animation per element and channel, started from the rendered value. A single keyframe is treated as a target, so `play(el, [{opacity: 0}], {ms: 'quick'})` fades out from wherever the element is.

## Compatibility with v1

Every v1 `data-st` name, data attribute, token and JS function still works. Pages built on v1 keep working without edits.

- **JS API**: `number, swapText, shake, success, page, resize, pop, open, close, icon, skeleton, reveal, shimmer, stream, toast, init, tab` keep their names and argument order. `page(direction, update, el)` gains an optional fourth argument. `shake(el)` gains an optional message.
- **Attributes kept**: `data-st-target`, `data-st-close`, `data-st-tip`, `data-st-open`, `data-st-on`, `data-st-done`, `data-st-error`, `data-st-field-frame`, `data-st-frequent`, `data-st-managed`, `data-st-morph`, `data-st-leaving`, `data-st-page-scope`, `data-value`.
- **Kinds kept, with changed visuals**:
  - `panel` is now an inline reveal from its trigger's side (opacity, y −6, scale .98). The v1 button-to-panel morph moves to `plus-menu`/`data-st-morph`. For a side panel, use the new `drawer`.
  - `sheet` is now a real bottom sheet. It works as a `<dialog>` or inside any positioned container.
  - `menu` and `plus-menu` popovers are switched to `popover="manual"` at init, so the kit can animate the exit. The kit provides outside-press and Escape dismissal itself. `popovertarget` buttons are intercepted the same way as `data-st-target`.
  - Page view transitions now name the scope element `st-page` instead of animating `root`. v1's root slide is available with `data-st-page-scope="root"` on `<html>`.
- **Legacy kinds kept but no longer in the gallery**: `avatars` (hover or focus lift), `banners` (use `toasts`), `clear` (input clear), `learn` (arrow nudge), `shimmer`, `reveal`, `icon`, `success`, `badge`, `resize`. They are cut from the showcase because they are either decoration without a state change or a subset of a stronger transition. They remain supported.
- **Token aliases**: `--st-fast → --st-quick`, `--st-base → --st-control`, `--st-slow → --st-surface`, `--st-page → --st-spatial`, `--st-ease-out → E`, `--st-ease-in-out → M`, `--st-ease-drawer → E`. `--st-rise`, `--st-scale-in`, `--st-shadow`, `--st-reserve` and `--st-stream-lines` remain defined. Colour and radius tokens keep their names, with a new palette.
- **Removed**: none.

## Theming

Colours, radii, shadows and fonts are custom properties on `:root`. Dark mode follows the system unless `[data-theme="light"]` or `[data-theme="dark"]` is set, and either attribute also works on a nested container. Override the tokens in your own stylesheet.

## Accessibility

- Menus take arrow keys, Home and End. Tab and Escape close them and return focus to the trigger.
- Dialogs use native `showModal` focus trapping and return focus after the exit.
- Tabs and segmented controls use roving tabindex.
- Switches use `role=switch`.
- Button states set `aria-busy` and announce success or error through a polite live region.
- Numbers keep a screen-reader copy of the formatted value, and the rolling digits are `aria-hidden`.
- Toasts are `role=status` in a polite region, and collapsed toasts are inert.
- The palette uses `aria-activedescendant`.
- Motion is never the only signal: every state also changes text, colour or shape.

## Verification

```sh
PLAYWRIGHT_BROWSERS_PATH=… node motion_judge.mjs gallery.html --selector "[data-replay]" --out out/motion --playwright …/playwright/index.mjs
node review_board.mjs gallery.html --out out/board --playwright …/playwright/index.mjs
```

`motion_judge.mjs` in this folder is v2 of the judge; its CLI flags are backward compatible. It films each interaction in slow motion (4x, with timers slowed too): hover, keyboard focus, rest, and hover inside the revealed layer; the change at 30 to 320ms; and an interruption strip. It then asks three independent model runs to score the result against a calibrated rubric (origin, attachment, choreography, character, exit, continuity, interruption, states, reduced motion) and reports the median. `--labels "Menu,Tabs"` films only those rows.

## Clean-room note

The behaviour catalogue was studied at the level of what moves, from where and for how long, together with the Seenry motion study (`production-motion.md`) and the component-brief method (`interaction-craft.md`). No code, markup, text or visual design was taken from any transition library or website. All code, copy, icons and artwork here are original.
