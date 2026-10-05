# Seenry Transitions 3

38 interface transitions informed by recorded product behavior. One stylesheet, one classic script, no dependencies, no build step, no network requests. Open [gallery.html](gallery.html) straight from disk.

```html
<link rel="stylesheet" href="seenry-transitions.css">
<script src="seenry-transitions.js" defer></script>
```

The script starts on `DOMContentLoaded` and picks up elements added later. After inserting markup yourself you can call `SeenryTransitions.init(root)`; calling it again is safe.

## What makes these premium

Every transition follows the same rules. The gallery and the motion judge check them.

- **Exact origin.** A surface grows from the thing that caused it. A menu's `transform-origin` is its trigger's centre on the facing edge. The button-to-menu morph unclips from the button's own rectangle. A dialog stays centered in the viewport and scales with an origin toward its trigger, a sheet rises from its screen edge, and an expanded card opens from the card.
- **Attached content.** Text rides its container and is never scaled by it. Size changes use a clip (`clip-path: inset()`) or a painted shell that scales behind the text, and followers move by FLIP.
- **Choreography.** The container explains location and the content explains state. Overlap motion where the content stays readable; delay incoming detail only enough to keep its title and artwork from colliding. Outgoing content clears before its space collapses. Check interruption rather than treating one delay as a universal recipe.
- **Character.** Things the hand moves, or that retarget often, run on springs: indicators, sheets and switches. The compact Dialog uses the 220ms ease-out recipe below. A visible settle appears only where the material earns it (a like, a switch thumb). Exact values, text and data never overshoot.
- **Exit asymmetry.** Exits are shorter, travel less and accelerate out (curve X). Spatial returns such as a card collapsing back into its slot keep their geometry.
- **Interruptible.** Every animation starts from the currently rendered value. A second input 70ms into a change reverses it from where it is, with no flash and no restart.
- **Compositor only.** Only transform, opacity, clip-path, small filters and SVG strokes animate. Layout commits once.
- **Every input path.** Pointer, touch and keyboard all work. Hover is never the only way in: tooltips also open on keyboard focus and on a 450ms long-press, and the toast stack fans out on hover, focus or tap. Targets are at least 44px on coarse pointers.
- **Reduced motion.** Travel, scale, blur, loops and particles are removed. Where helpful, a change fades in 100ms or less. State, focus and announcements stay the same.

## Motion tokens

Curves and clocks come from `production-motion.md`: E `cubic-bezier(.16,1,.3,1)`, M `(.4,0,.2,1)`, F `(.2,0,.2,1)`, X `(.4,0,1,1)`. Durations are `--st-feedback` 80, `--st-quick` 120, `--st-control` 160, `--st-relocate` 180, `--st-surface` 240 and `--st-spatial` 280ms. Delay tokens stay at 0, 40, 60 and 80ms. The overlapping handoffs specified in BRIEF also use 25, 30, 35, 45 and 50ms.

**Added in v2: springs.** Springs use the `spring(response, bounce)` parameters designers know from SwiftUI. They are baked into CSS `linear()` easing, so an ordinary CSS transition gets spring character and still retargets natively. The JS simulates the same springs for WAAPI.

| Token | spring(response, bounce) | Settles (0.4%) | Overshoot | Used for |
| --- | --- | --- | --- | --- |
| `--st-spring-snappy` | .26s, .04 | 300ms | none | menus, popovers, tooltip glide, segmented pill, digits, glyphs, chevrons |
| `--st-spring-smooth` | .36s, 0 | 445ms | none | sheets, drawers, shared elements, FLIP reflow, accordion, page slide |
| `--st-spring-gentle` | .34s, .08 | 348ms | none | toast stack |
| `--st-spring-bouncy` | .34s, .42 | 521ms | 10% | like heart, badge pop, state-icon change |
| `--st-spring-thumb` | .28s, .28 | 349ms | 3.6% | switch thumb |
| lead / trail (JS) | .16s / .23s, 0 | 212 / 294ms | none | the tab underline's two edges |

Why the values changed from the timed spec, measured on the springs: the study proposed E curves of 180 to 280ms. A spring's settle time includes a long, near-invisible tail. `snappy` reaches 73% of its travel at 100ms and 90% at about 150ms, which is the perceived speed of the 180ms E curve. Retargeting starts at the current rendered position; these sampled springs do not claim physical velocity preservation. The judge reports the full settle time, which is why durations of 300 to 445ms show up next to the spec's 180 to 280ms. The press compression (80ms) and all exits (80 to 220ms) keep their timed E, F and X curves, because an exit should never spring back.

## The catalog

| Transition | Markup or API | Motion |
| --- | --- | --- |
| Menu | `[data-st-target]` → `[data-st="menu"][popover]` | scale .96→1 and y ∓4 from the trigger point, snappy; opacity 120 F; rows attached; exit 110ms X to .97 |
| Button to menu | `[data-st="plus-menu"]` or `data-st-morph` | clip-path from the button's rect with its radius, snappy; a painted copy of the button fades over it; items +50ms; closes back into the rect |
| Dialog | `dialog[data-st="modal"]` | native viewport modal, compact surface; pointer y4/scale .97→1 over 220 E; opaque decision shell and safe focus readable immediately; pointer backdrop 100 F; opaque pointer exit finishes its 120ms transform + 140ms backdrop jobs; keyboard and reduced opening/dismissal put both layers in their final state immediately, without travel or blur under reduction |
| Command palette | `dialog[data-st="palette"]` with `[data-st-palette-input]` and `[role=listbox]` | y −8, scale .98 from the top edge; results reflow by FLIP; one highlight travels (snappy); arrows, Enter, Escape |
| Bottom sheet | `[data-st="sheet"]` (dialog or in-container), `data-st-recede` | y 100%→0 smooth; the page behind scales to .94 and rounds; drag follows the finger 1:1 and dismisses past 30% or on a flick over 0.5px/ms |
| Drawer | `[data-st="drawer"]`, `data-st-side="left"` | x 100%→0 smooth, content fixed to it; scrim; exit 220 X |
| Tooltip | `[data-st-tip="id"]` → `[data-st="tooltip"]` | 400ms dwell once, then the bubble glides between neighbours; focus opens at once; long-press on touch; exit 80 F |
| Card expand | `SeenryTransitions.expand(card, detail)`, `[data-st="expand"]`, `[data-st-shared]` | pointer input unclips the surface from the card, with shared artwork/title/count and attached readable content; Close is immediately usable; keyboard open/close is instant; reduced motion removes travel and blur; the gallery labels its three shown tracks as a preview; constrained custom layouts may use an endpoint title fade |
| Tabs | `[data-st="tabs"]` | one underline follows selection across the full scrollable strip; panels stay mounted with inactive panels inert; pointer input uses a short retargetable crossfade and 4px travel; keyboard/reduced updates are immediate; selection is revealed locally after input or resize |
| Segmented control | `[data-st="segmented"]` | pill on snappy; the selected label is a clipped copy, so its colour changes exactly under the pill |
| Page transition | `SeenryTransitions.page(dir, update, scope, {shared})` | one shared layer travels by FLIP over 220 E; unrelated content out 65ms, detail body +50ms; names and held styles are released |
| Accordion | `details[data-st="accordion"]` | layout commits at once; the answer is revealed by a clip that tracks the rows below as they FLIP down; closing clips a copy up |
| Button states | `button[data-st="button"][data-st-labels="A\|B"]`, `state(el, 'loading'\|'success'\|'error'\|'idle', label)` | footprint reserved for the widest state; icon springs in; label recentres by FLIP; check and cross draw; error shakes |
| Copy | `[data-st="copy"][data-st-copy]` with `.st-swap` and an optional `[data-st="text"]` label | the glyph becomes a check (scale .25, blur 4, snappy); a visible label rolls to Copied while the button resizes to fit; reverts after 1.6s |
| Like | `button[data-st="like"]` | heart .55→1 bouncy, a ring and six sparks (420ms E); the count rolls; unliking is quiet |
| Switch | `label.st-toggle > input[role=switch]` | thumb stretches toward its destination while pressed; travel on thumb spring; track 160 F |
| Checkbox | `label.st-check`, optional `.st-strike` | fill 120 F, tick draws 160 E, strike-through draws +40ms |
| Form error | `[data-st="error"]`, `shake(el, message)`, `clearError(el)` | the field frame shakes on a sampled decaying spring (6px, 2 cycles, 320ms; the message follows at 25ms with a 2px rise and 120ms clip); the message is revealed by clip in reserved space |
| Toast stack | `toast(region, message, {description, action, duration})` | rises from the stack edge (gentle); older toasts tuck to scale 1 − .05n; fans out on hover, focus or tap; swipe with velocity; pauses while expanded |
| Number | `[data-st="number"]`, `number(el, value, opts)` | only changed places roll, in the direction of the change; unchanged digits slide when the width changes; neighbours follow; 12ms offsets capped at 36 (none for steppers); digits use the .16s spring |
| Text change | `[data-st="text"]`, `swapText(el, text)`, `data-st-fit` | whole label handoff: outgoing 65 X / −3px, incoming 100 F at +30ms / 3px; optional `{letters:true}` keeps the original glyph effect |
| List | `list.add(container, node, i)`, `list.remove(item)`, `list.reorder(container, fn)` | FLIP on smooth; a removed row fades first, then neighbours close the gap 40ms later; identity is kept through a sort; no stagger |
| Skeleton to content | `[data-st="skeleton"][aria-busy]`, `skeleton(el, ready)` | reserved geometry; mask 120 F; content 180 F; media blur 8→0 and scale 1.03→1 |
| AI thinking and streaming | `[data-st="thinking"]`, `[data-st="stream"]`, `stream(el, chunk, {reset, done})` | honest status swaps with opacity only; status visible from input time; previous answer out 65 F; words arrive with opacity only, batched per frame, no fake delay |
| Card resize | `resize(el, update)` | painted shell changes bounds on smooth; text never scales; newly shown content +50ms |
| Notification badge | `[data-st="badge"]`, `badge(el, count)` | attached corner pop .5→1 bouncy; digits roll by direction; clear 120 X |
| Icon swap | `button[data-st="icon-morph"]` with one `path[data-st-off][data-st-on]` (matching point counts); `[data-st="icon-swap"]` for unrelated icons | the outline itself morphs on the snappy spring (play becomes pause); unrelated icons cross in a fixed box |
| Success check | `[data-st="success"]`, `success(el)` | circle 160 E, check +160ms, circle settle 160; success announced immediately |
| Avatar group | `[data-st="avatars"]`; extra people as `[data-st-avatar-extra][hidden]`, a `[data-st-avatar-more]` chip | hover or focus lifts the person 4px and scales 1.06, neighbours follow with a .45 falloff, one name label glides above; leaving settles back on a bouncy spring; the chip slides the others out from under it and tucks them back |
| Input clear | `[data-st="clear"]` | text x −8 / blur 2 / fade 120 X; focus and caret stay; button scales out afterward |
| Link arrow | `a[data-st="learn"]` with `svg.st-arrow` (`.st-arrow-line`, `.st-arrow-head`) | at rest a chevron; on hover or focus its shaft draws in behind it while the head steps forward; underline draws from the left |
| Text reveal (extra) | `[data-st="reveal"]`, `reveal(el)` | each line is uncovered left to right in reading order, 260ms, next line +60ms; a second call while running lets it finish |
| Shimmer text (extra) | `[data-st="shimmer"][data-st-working]` | a soft masked highlight sweeps through the words while working; when work ends the label settles to full ink |
| Popover panel | `[data-st="popover-panel"][popover]` | clip from trigger side snappy, content +50ms, closes to trigger edge |
| Spinner to check | `[data-st="progress"]`, `progress(el, state)` | loading ring narrows into drawn check/cross in one box; state immediate |
| Image open | `[data-st="image-open"]`, `image(el)`, `closeImage(el)` | image shared FLIP smooth, backdrop fades, returns to slot; touch drag dismiss/cancel |
| Reorder | `[data-st="reorder"]`, `[data-st-row]`, `[data-st-handle]` | drag lift 1.02, smooth neighbor FLIP, spring drop; Space/arrows/Escape with announcements |
| Tilt card (extra) | `[data-st="tilt"]`, `tilt(el, x, y)` | leans up to 3deg toward a fine pointer with a 2px lift, the photo shifts the other way, a light follows the pointer; snappy return |

## Blur option

Add `data-st-blur` to `<html>` (or any container) and every fade inside it also pulls focus: elements fading in sharpen from a blur, elements fading out soften slightly. `data-st-blur="6"` sets the amount in pixels (default 4). Only elements up to about 200×200px blur, so surfaces never smear; reduced motion removes it. Toggle it from script with `SeenryTransitions.blur(true | false, root?, px?)`.

```html
<html data-st-blur>
```

## JS API

```js
SeenryTransitions.open(el, trigger?)   .close(el)   .toggle(el, trigger?)
SeenryTransitions.number(el, value, {locale, format, frequent})
SeenryTransitions.swapText(el, text, {fit, letters})
SeenryTransitions.state(button, 'idle'|'loading'|'success'|'error', label?)
SeenryTransitions.shake(el, message?)   .clearError(el)   .success(el)
SeenryTransitions.copy(el, text?)   .like(el, on?)   .icon(el, on)   .pop(el)
SeenryTransitions.tab(root, tab, keyboard?)   .accordion(details, open?)
SeenryTransitions.resize(el, update)   .flip(elements, mutate, {spring})
SeenryTransitions.list.add(container, node, index) / .remove(item) / .reorder(container, compareOrNodes)
SeenryTransitions.expand(source, detail, {keyboard: true})   .collapse(detail, {keyboard: true})
// Optional keyboard policy defaults to the last native input; delegated Enter/Escape pass it explicitly.
SeenryTransitions.page('forward'|'back', update, scopeEl?, {shared: [keys]})
SeenryTransitions.toast(region, message, {description, action: {label, onClick}, duration})
SeenryTransitions.skeleton(el, ready)   .stream(el, chunk, {reset, done})
SeenryTransitions.reveal(el)   .shimmer(el)   .init(root)
SeenryTransitions.badge(el, count)   .progress(el, 'loading'|'success'|'error')
SeenryTransitions.image(thumbnail)   .closeImage(thumbnail?)   .tilt(el, x, y)
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
  - Page view transitions now name the scope element `st-page` instead of animating `root`. The earlier root slide is available with `data-st-page-scope="root"` on `<html>`.
- **Legacy aliases kept**: `avatars` (hover or focus lift), `banners` (use `toasts`), `clear` (input clear), `learn` (arrow nudge), `shimmer`, `reveal`, `icon`, `success`, `badge`, `resize`. The catalog showcases these and extends their behavior. `icon-swap`, `popover-panel`, `progress`, `image-open`, `reorder` and `tilt` are new kinds.
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
- The palette uses `aria-activedescendant`. A persistent non-dialog preview keeps its search usable after Escape or selection while collapsed results are inert. Pointer click, Tab focus, editing, and ArrowDown/ArrowUp/Enter reopen results; production dialog palettes continue to use native `showModal`.
- Motion is never the only signal: every state also changes text, colour or shape.

## Verification

```sh
PLAYWRIGHT_BROWSERS_PATH=… node motion_judge.mjs gallery.html --selector "[data-replay]" --out out/motion --playwright …/playwright/index.mjs
node review_board.mjs gallery.html --out out/board --playwright …/playwright/index.mjs
```

`motion_judge.mjs` in this folder is v2 of the judge; its CLI flags are backward compatible. It films each interaction in slow motion (4x, with timers slowed too): hover, keyboard focus, rest, and hover inside the revealed layer; the change at 30 to 320ms; and an interruption strip. It then asks three independent model runs to score the result against a calibrated rubric (origin, attachment, choreography, character, exit, continuity, interruption, states, reduced motion) and reports the median. `--labels "Menu,Tabs"` films only those rows.

## Design of the library

Depth comes from surface tone and soft shadow, not divider lines. Each card holds a darker stage inset 10px with concentric corners (22px outside, 12px inside); the caption is a quiet title and line; Replay and copy are ghost controls until touched. The copy button shows a tooltip on hover and turns its glyph into a check on copy. A Blur switch in the header turns on the blur option for the whole library.

## Quality, measured

The motion judge (`motion_judge.mjs`, three blind model runs, median) scores this catalog **7/10** overall: origin 8, attachment 8, interruption 8, reduced motion 9. Scored in two halves of 19 rows, the first half has 12 rows at 8 and the second 7 rows at 8; no row has yet scored 9. Weakest rows (6): card expand, AI thinking and streaming, card resize, and the three expressive extras. Every transition was filmed in slow motion (normal, interrupted, close-then-reopen) and settles with no held animations and no console errors. Work continues row by row toward 9; a row only changes when its own score goes up.

## Clean-room note

The behaviour catalogue was studied at the level of what moves, from where and for how long, together with the Seenry motion study (`production-motion.md`) and the component-brief method (`interaction-craft.md`). No code, markup, text or visual design was taken from any transition library or website. All code, copy, icons and artwork here are original.

## Browse and copy

The gallery has 35 equal live stages in three columns (two on tablet, one on phone, where the categories become one picker), plus three expressive extras below them (shimmer, tilt, text reveal: decorative motion for brand moments, not state), category filters, search (`/`), and a System/Light/Dark switch. Filters use the kit's segmented indicator and list FLIP without stagger. `#f/feedback` restores a category; `#t/menu` opens a detail. Click a title or press Enter on a focused card to open a drawer (bottom sheet on phone). Escape returns focus. The original stage moves into the detail so its handlers and state stay intact. Card copy buttons copy preview HTML as a starting point; details include preview HTML, JS API and reduced-motion notes. The copied preview markup is not a standalone component: gallery-specific CSS classes, sample image assets and demo event handlers are not all included in the two kit files. Recreate those dependencies and wire your application actions, or write minimal markup using the documented API.

Only one first-view preview runs per stage; replays are user-triggered and finite. Shimmer previews call `shimmer(el)` for one 2.4-second sweep; applications may separately opt into the CSS loop with `data-st-working="true"` while genuine work is pending. The standalone progress ring rotates only in its loading state and stops in success/error states. Most gallery surfaces stay inside their stage. Dialog deliberately uses native `showModal()` with a viewport-wide backdrop and compact centered content, including when its stage moves into the library detail. Outside the gallery, menus use native popovers with viewport flipping/shifting, and dialogs use the same `showModal()` top-layer path. `data-st-contained` is a preview adapter, not needed on real-page markup. Application code supplies real async outcomes and content.

Every WAAPI completion releases its animation. Forward-held exit values are committed only while a close is in progress; cleanup restores the previous inline values. A replacement animation reads the current rendered value before retiring its predecessor. Settled gallery interactions leave `document.getAnimations().length === 0`.

### Copying examples

The gallery copies the HTML usage structure with inline SVGs and real-page popover/dialog markup. The component classes in `seenry-transitions.css` supply motion and basic controls. Classes such as `app`, `field-row`, and `media-card` are application layout examples styled in `gallery.html`; adapt those to your product. Use the JS API block to connect application-owned content changes. Images reference the local `assets` folder. Use unique IDs if placing multiple copies on one page.

### Fixed Card action lane

The gallery opts into a fixed dismissal point with `data-st-close-anchor` on its44px source action cue. The original Close uses fixed CSS anchor positioning to follow that cue through viewport/text reflow inside the expanding shell. The runtime checks its resolved center and unscaled layout footprint, while keeping press feedback inside the cue. A transformed ancestor can change eligibility. Its owned position-visibility:always keeps it painted when the source card becomes visibility:hidden. The runtime restores authored cue/control styles on dismissal. Backing transfer temporarily suppresses only its background, shadow and border transition clocks, then restores the authored declarations and priorities. For an explicitly marked source, unsupported CSS anchoring or a zero-sized, uncontained or unresolved cue selects an immediate readable open and close. That fallback does not claim a fixed action point. Unmarked sources retain generic shell attachment. Keep the same source/detail horizontal measure, reserve the action lane in every content row, and permit text wrapping before enabling this opt-in. The gallery keeps6px artwork inset, an8px action inset for the visible focus ring, and a52px trailing track reserve. Whole-row activation remains available; the cue describes the stationary action point, not every arbitrary click location.

Card open-state exposure and final hiding commit inherited visibility before focus moves. The runtime temporarily zeroes only the subtree’s eligible CSS visibility clock, retires its native visibility transitions, then restores exact authored declarations and priorities. Other transitions and explicit authored hidden content remain in force. Native dialog autofocus and host focus redirects retain the single focus handoff.

Group covered album triggers with `data-st-expand-sources` on a wrapper that does not contain the active detail. Card expansion keeps this group inert through opening and closing, preserves its layout for an authored CSS anchor, and restores its original inert state before the last owning detail returns focus. Multiple open details can share the wrapper; each releases only its own hold, including when removed from the document. This is local source ownership, not a page-wide modal trap.
