# Motion recipes

Ready-to-build motion for the components every product has. Start from the recipe, keep the values, adapt names to the project. Modern CSS covers most of these without a library; a fallback is given where browser support is still uneven.

Tokens used throughout:

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);       /* entrances, exits, UI response */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* things moving across the screen */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* sheets and drawers */
  /* Springs as CSS easing (computed from a damped oscillator, 29 samples) */
  --spring-snappy: linear(0, 0.038, 0.124, 0.231, 0.341, 0.447, 0.542, 0.626, 0.697, 0.756, 0.805, 0.845, 0.878, 0.904, 0.925, 0.941, 0.954, 0.964, 0.972, 0.979, 0.983, 0.987, 0.99, 0.992, 0.994, 0.996, 0.997, 0.997, 1); /* critically damped, use at 400ms */
  --spring-bounce: linear(0, 0.046, 0.154, 0.292, 0.436, 0.572, 0.691, 0.789, 0.868, 0.927, 0.969, 0.997, 1.015, 1.024, 1.028, 1.028, 1.026, 1.022, 1.018, 1.014, 1.01, 1.007, 1.005, 1.003, 1.001, 1, 1, 1, 1); /* damping 0.75, ~3% overshoot, use at 500ms */
}
```

## Press feedback

Every pressable element. Instant confirmation that the interface heard the input.

```css
.btn { transition: scale 120ms var(--ease-out), background-color 150ms ease; }
.btn:active { scale: 0.97; }
```

`scale` scales children too, which is what makes it feel physical. Keep it between 0.96 and 0.98; lower looks cartoonish. Skip it on large cards and list rows (use a background step instead).

## Menu, dropdown, popover (native popover)

Scales out of its trigger. `allow-discrete` lets the exit play before `display: none` applies.

```css
.menu[popover] {
  transform-origin: top left;                         /* the trigger's side */
  transition: opacity 150ms var(--ease-out), scale 150ms var(--ease-out),
              display 150ms allow-discrete, overlay 150ms allow-discrete;
}
.menu[popover]:not(:popover-open) { opacity: 0; scale: 0.96; }
@starting-style { .menu[popover]:popover-open { opacity: 0; scale: 0.96; } }
```

With CSS anchor positioning (`position-anchor` + `position-area: bottom span-right`), set `transform-origin` to match the area. With Floating UI, Base UI or Radix, use the origin variable the library provides (`var(--transform-origin)`, `var(--radix-popper-transform-origin)`). Browsers without `overlay` transitions close instantly, which is acceptable.

## Tooltip

Same as the popover, faster (120ms), scale from 0.97. First tooltip waits 400–600ms to open; while one is open, neighbours open with no delay and no animation (Base UI and Radix `Tooltip.Provider` implement this group behavior). Never animate tooltips on keyboard focus with a delay: show immediately.

## Dialog (native `<dialog>`)

The one surface that scales from center.

```css
dialog {
  transition: opacity 200ms var(--ease-out), scale 200ms var(--ease-out),
              display 200ms allow-discrete, overlay 200ms allow-discrete;
}
dialog:not([open]) { opacity: 0; scale: 0.97; }
@starting-style { dialog[open] { opacity: 0; scale: 0.97; } }

dialog::backdrop { background: rgb(0 0 0 / 0.4);
  transition: opacity 200ms ease, display 200ms allow-discrete, overlay 200ms allow-discrete; }
dialog:not([open])::backdrop { opacity: 0; }
@starting-style { dialog[open]::backdrop { opacity: 0; } }
```

`showModal()` gives focus trapping, Escape and the top layer for free.

## Sheet and drawer

```css
.sheet { translate: 0 0; transition: translate 400ms var(--ease-drawer); }
.sheet[data-state="closed"] { translate: 0 100%; }   /* percent of its own height */
```

Use Vaul (React) for drag-to-dismiss with snap points; otherwise see **Drag to dismiss** below.

## Toast

Enter from and exit toward the same edge; transitions, not keyframes, so a rapid second toast retargets instead of restarting.

```css
.toast { transition: translate 400ms var(--ease-out), opacity 400ms ease; }
@starting-style { .toast { translate: 0 100%; opacity: 0; } }
.toast[data-leaving] { translate: 0 100%; opacity: 0; }
```

Use Sonner in React. Stack at most 3; the 4th pushes the oldest out.

## Accordion and disclosure

Animate to intrinsic height with no measuring:

```css
:root { interpolate-size: allow-keywords; }           /* Chrome 129+; others snap, which is fine */
details::details-content { block-size: 0; overflow: clip;
  transition: block-size 200ms var(--ease-out), content-visibility 200ms allow-discrete; }
details[open]::details-content { block-size: auto; }
```

Fallback that works everywhere: a grid track.

```css
.panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 200ms var(--ease-out); }
.panel > .inner { overflow: hidden; }
.open > .panel { grid-template-rows: 1fr; }
```

Keep it under 250ms: height animation costs layout every frame.

## Staggered entrance

Only for occasional, first-time content (onboarding, a results page), never for lists people scroll daily.

```css
.item { animation: rise 300ms var(--ease-out) both; animation-delay: calc(min(var(--i), 8) * 40ms); }
@keyframes rise { from { opacity: 0; translate: 0 8px; } }
```

Set `--i` inline (`style="--i: 3"`) or use `sibling-index()` where supported. Cap the total at ~300ms; content must be usable while the stagger plays.

## Tab indicator

The cleanest version uses the View Transitions API; the browser morphs the indicator between tabs with no measuring:

```css
.tab[aria-selected="true"]::after { content: ""; position: absolute; inset: auto 0 -1px; height: 2px;
  background: currentColor; view-transition-name: tab-indicator; }
::view-transition-group(tab-indicator) { animation-duration: 250ms; animation-timing-function: var(--ease-out); }
```

```js
const select = tab => document.startViewTransition ? document.startViewTransition(() => activate(tab)) : activate(tab);
```

For a filled pill where the label color must flip in sync, duplicate the tab list in the active style and animate `clip-path: inset()` of the copy to the active tab's box.

## Page and shared-element transitions

Same document (SPA routes, list → detail):

```js
document.startViewTransition(() => router.navigate(url));   // wrap the DOM update
```

```css
.card-thumb { view-transition-name: var(--vt-name); }       /* unique per item, e.g. --vt-name: cover-42 */
.detail-cover { view-transition-name: cover-42; }
::view-transition-group(*) { animation-duration: 300ms; animation-timing-function: var(--ease-in-out); }
```

Multi-page sites (no JS): `@view-transition { navigation: auto; }` in both pages' CSS. Unsupported browsers navigate normally. Respect reduced motion by setting `animation: none` on `::view-transition-group(*)` inside `@media (prefers-reduced-motion: reduce)`.

## Scroll reveal

Marketing surfaces only. Scroll-driven, no JavaScript:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: reveal linear both; animation-timeline: view(); animation-range: entry 10% cover 30%; }
    @keyframes reveal { from { opacity: 0; translate: 0 24px; } }
  }
}
```

Scroll-driven animations reverse when scrolling back. For a play-once reveal, use `IntersectionObserver` (`threshold: 0.2`, unobserve after the first hit) and a class transition.

## Contextual icon swap

Copy → check, play → pause, menu → close. Keep both icons in the DOM, stacked; cross-fade with scale and a little blur so it reads as one icon changing.

```css
.swap { display: grid; } .swap > * { grid-area: 1 / 1; transition: opacity 180ms var(--ease-out), scale 180ms var(--ease-out), filter 180ms var(--ease-out); }
.swap > [data-hidden] { opacity: 0; scale: 0.5; filter: blur(2px); }
```

The state must also be conveyed without motion (label, `aria-pressed`, tooltip text change).

## Number changes

Counters, prices, timers: `font-variant-numeric: tabular-nums` always. For animated digits use NumberFlow or the bundled [number transition](../assets/number-transition.mjs); keep one live, accessible value (`aria-live="polite"` on the container, not per digit).

## Hold to confirm

For destructive actions. Slow deliberate fill on press, fast snap back on release.

```css
.hold .fill { clip-path: inset(0 100% 0 0); transition: clip-path 200ms var(--ease-out); }
.hold:active .fill { clip-path: inset(0 0 0 0); transition: clip-path 1.5s linear; }   /* progress is linear */
```

Fire the action on `animationend`/timer completion, not on press start; keyboard users hold Space/Enter the same way.

## Drag to dismiss (sheets, cards, toasts)

```js
el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); start = {y: e.clientY, t: performance.now()}; });
el.addEventListener('pointermove', e => {
  if (!start) return;
  const dy = e.clientY - start.y;
  const d = dy < 0 ? rubberBand(dy, el.offsetHeight) : dy;       // resist dragging the wrong way
  el.style.translate = `0 ${d}px`;                                // set on the element, not a parent variable
});
el.addEventListener('pointerup', e => {
  const dy = e.clientY - start.y, v = dy / (performance.now() - start.t);   // px per ms
  const projected = dy + project(v * 1000);                       // where the flick is going
  (projected > el.offsetHeight * 0.5 || v > 0.5) ? dismiss() : settle();
  start = null;
});
const rubberBand = (x, d, c = 0.55) => -(1 - 1 / (Math.abs(x) * c / d + 1)) * d;
const project = (velocityPxPerS, rate = 0.998) => (velocityPxPerS / 1000) * rate / (1 - rate);
```

- **Projection** (from Apple's fluid interface work): decide by where the gesture is going, not where the finger stopped. A fast short flick dismisses.
- **Rubber band** past a boundary instead of a hard wall.
- **Settle** with `--spring-bounce` (500ms) or a Motion spring `{type: "spring", duration: 0.5, bounce: 0.2}` so an interrupted drag keeps its velocity.
- Ignore extra pointers while dragging; add `touch-action: none` to the handle only.

## Masking a stubborn crossfade

When two overlapping states read as two objects no matter the timing, add `filter: blur(2px)` to both during the swap (≤ 4px for small elements; heavy blur is expensive in Safari).

## Theme switch without smearing

A light/dark flip transitions every color at once. Suppress it:

```js
const css = document.createElement('style');
css.textContent = '*,*::before,*::after{transition:none!important}';
document.head.appendChild(css); applyTheme(next); getComputedStyle(document.body).opacity; // force reflow
requestAnimationFrame(() => css.remove());
```

## No animation on first render

Entrance animations belong to user-caused changes, not the initial page paint: `initial={false}` on Motion's `AnimatePresence`; in CSS, only attach enter transitions after the first frame (`requestAnimationFrame(() => root.classList.add('motion-ready'))` and scope `@starting-style` rules under `.motion-ready`).

## Performance and cleanup

- Animate `transform`/`translate`/`scale`/`rotate`, `opacity`, `clip-path` and `filter`; never `width`, `height`, `top`, `left`, `margin` (accordion height is the tolerated exception).
- Name properties: never `transition: all`.
- `will-change` only on elements that stutter on the first frame, removed after; never globally.
- In Motion, prefer `transform` strings or independent `translate`/`scale` values that run on the compositor; profile before trusting shorthands under load.
- Cancel timers, observers and pointer captures on unmount.
