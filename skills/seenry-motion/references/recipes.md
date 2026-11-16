# Recipes: surfaces and navigation

**Read when:** building the motion of a menu, dropdown, popover, tooltip, dialog, sheet, drawer, toast, tabs, accordion or a page or shared-element transition. Feedback, numbers, lists and loading states are in [recipes-state](recipes-state.md).

Every value comes from the table at the top of `SKILL.md`. Each recipe is plain CSS that runs with no build step; where a maintained library does the job better, the recipe names it and its settings, and you pick it through `seenry-libraries` ([catalog](../../seenry-libraries/references/catalog.md)).

## Contents

- Setup: tokens, keyboard, reduced motion
- Interruption rules for every recipe
- Press feedback
- Menu, dropdown, popover
- Tooltip
- Dialog
- Sheet and drawer
- Toast
- Tabs with a sliding indicator
- Accordion
- Page and shared-element transition

## Setup: tokens, keyboard, reduced motion

Paste once per project. Reuse the project's own tokens when it has them.

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);    /* enter, exit, press */
  --ease-move: cubic-bezier(0.4, 0, 0.2, 1);    /* travel and resize with both ends on screen */
  --ease-fade: cubic-bezier(0.2, 0, 0.2, 1);    /* opacity and colour on their own */
  --spring-snappy: linear(0, 0.038, 0.124, 0.231, 0.341, 0.447, 0.542, 0.626, 0.697, 0.756, 0.805, 0.845, 0.878, 0.904, 0.925, 0.941, 0.954, 0.964, 0.972, 0.979, 0.983, 0.987, 0.99, 0.992, 0.994, 0.996, 0.997, 0.997, 1); /* no overshoot, use at 400ms */
  --spring-bounce: linear(0, 0.046, 0.154, 0.292, 0.436, 0.572, 0.691, 0.789, 0.868, 0.927, 0.969, 0.997, 1.015, 1.024, 1.028, 1.028, 1.026, 1.022, 1.018, 1.014, 1.01, 1.007, 1.005, 1.003, 1.001, 1, 1, 1, 1); /* 3% overshoot, use at 500ms, drag release only */
}

/* A key press gets the result at once: transitions end in zero time while the keyboard is the input. */
:root[data-input="keyboard"] *,
:root[data-input="keyboard"] *::before,
:root[data-input="keyboard"] *::after { transition-duration: 0s !important; transition-delay: 0s !important; }

/* Reduced motion: keep a 100ms fade, drop travel and scale. Add each moving class to this list. */
@media (prefers-reduced-motion: reduce) {
  .menu, .tooltip, dialog, .toast, .tabs-indicator, .tabpanel {
    transition-property: opacity, display, overlay !important; transition-duration: 100ms !important;
  }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
```

```js
const root = document.documentElement;
addEventListener('keydown', () => { root.dataset.input = 'keyboard'; }, true);
addEventListener('pointerdown', () => { root.dataset.input = 'pointer'; }, true);
```

React with Motion: `<MotionConfig reducedMotion="user" transition={keyboard ? { duration: 0 } : undefined}>` around the app, where `keyboard` mirrors the same two listeners.

## Interruption rules for every recipe

1. Use transitions or springs for anything a person can trigger twice. They retarget from the value on screen. Keyframes restart from zero; keep them for one-shot entrances, the error shake and loops.
2. Publish the new state at once (`aria-expanded`, `aria-selected`, the text, the route). The animation follows the state and never gates it.
3. The latest input wins. Never queue: open, close, open within 100ms must not flash at opacity 0, duplicate a layer or leave a hidden focus trap.
4. Focus and hit-testing are valid from the first frame, before the motion settles.
5. Clear timers and listeners with the element. A finished or cancelled animation must not write a stale state.

## Press feedback

Use on every button. Not on table rows, inputs or large cards (step the background instead).

```css
.btn { transition: scale 120ms var(--ease-out), background-color 120ms var(--ease-fade); }
.btn:active { scale: 0.97; transition-duration: 80ms; }
@media (hover: hover) and (pointer: fine) { .btn:hover { background-color: var(--btn-hover, #e9e9e7); } }
```

Hover changes tint only, never position or size. Reduced motion: keep it, the scale is 3% and under 100ms.

## Menu, dropdown, popover

Use for a surface that opens from a trigger. Not for a command menu opened by a shortcut (no motion), and not for more than about 12 items (use a dialog or a page).

With a framework: Base UI `Menu`, `Popover` or `Select` through `seenry-libraries`. It supplies focus, typeahead, collision handling and `--transform-origin`:

```css
.Popup { transform-origin: var(--transform-origin);
  transition: opacity 180ms var(--ease-out), scale 180ms var(--ease-out); }
.Popup[data-starting-style], .Popup[data-ending-style] { opacity: 0; scale: 0.96; }
.Popup[data-ending-style] { transition-duration: 100ms; }
```

Radix uses `var(--radix-dropdown-menu-content-transform-origin)` and `data-state="open|closed"` with the same values.

No build step: the native popover. The browser gives the top layer, Escape and click-outside.

```html
<button popovertarget="account-menu" style="anchor-name: --account">Account</button>
<div id="account-menu" class="menu" popover role="menu" style="position-anchor: --account">…</div>
```

```css
.menu[popover] {
  inset: auto; margin: 4px 0 0; position-area: bottom span-right;
  transform-origin: top left;                              /* the corner that touches the trigger */
  transition: opacity 180ms var(--ease-out), scale 180ms var(--ease-out), translate 180ms var(--ease-out),
              display 180ms allow-discrete, overlay 180ms allow-discrete;
}
.menu[popover]:not(:popover-open) { opacity: 0; scale: 0.96; translate: 0 -4px; transition-duration: 100ms; }
@starting-style { .menu[popover]:popover-open { opacity: 0; scale: 0.96; translate: 0 -4px; } }
```

- Rows are attached to the panel: no item stagger, no separate fade.
- A menu built without `popover` or a library owes what they give for free: Escape closes it from wherever focus is (listen on `document`, not on the menu), a press outside closes it, focus returns to the trigger, and arrow keys move between rows.
- Open 180ms, close 100ms. The closed-state rule carries the exit duration.
- A menu that opens upward uses `transform-origin: bottom left` and `translate: 0 4px`.
- Interruption: a second click mid-open reverses from the current scale; nothing to clean up.
- Reduced motion: the setup block leaves a 100ms fade.

## Tooltip

Use for a label on an icon control. Not for anything with a button in it (that is a popover).

```css
.tooltip { transform-origin: var(--transform-origin, bottom center);
  transition: opacity 120ms var(--ease-fade), scale 120ms var(--ease-out); }
.tooltip[data-starting-style], .tooltip[data-ending-style], .tooltip:not([data-open]) { opacity: 0; scale: 0.97; }
.tooltip[data-ending-style], .tooltip:not([data-open]) { transition-duration: 80ms; }
.tooltip[data-instant] { transition-duration: 0s; }
```

- Dwell 400ms before the first one opens on hover; 0ms on keyboard focus.
- While one is open, a neighbour opens with no dwell and no animation (`data-instant`; Base UI and Radix `Tooltip.Provider` do this).
- Exit 80ms, no travel.

## Dialog

Use when a decision must interrupt the page. The one surface that scales from its centre.

```css
dialog {
  transition: opacity 240ms var(--ease-out), scale 240ms var(--ease-out),
              display 240ms allow-discrete, overlay 240ms allow-discrete;
}
dialog:not([open]) { opacity: 0; scale: 0.96; transition-duration: 140ms; }
@starting-style { dialog[open] { opacity: 0; scale: 0.96; } }

dialog::backdrop { background: rgb(0 0 0 / 0.32);
  transition: opacity 160ms var(--ease-fade), display 240ms allow-discrete, overlay 240ms allow-discrete; }
dialog:not([open])::backdrop { opacity: 0; }
@starting-style { dialog[open]::backdrop { opacity: 0; } }
```

- `showModal()` gives the focus trap, Escape and the top layer. With a framework use Base UI `Dialog` and the same values on `[data-starting-style]` and `[data-ending-style]`.
- The content is attached: it does not fade or stagger after the panel.
- A change of view inside an open dialog resizes the same panel (240ms, `--ease-move`); the backdrop does not re-enter.
- Interruption: closing during entry reverses from the current values.

## Sheet and drawer

Use for a task that keeps the page as context, and on touch screens for anything a dialog would do.

With a framework: Vaul through `seenry-libraries`. Keep its own timing (500ms, `cubic-bezier(0.32, 0.72, 0, 1)`); it is matched to its drag physics. Without drag, build it:

```css
dialog.sheet { margin: auto 0 0; width: 100%; max-width: none; opacity: 1; scale: 1; translate: 0 0;
  transition: translate 280ms var(--ease-out), display 280ms allow-discrete, overlay 280ms allow-discrete; }
dialog.sheet:not([open]) { opacity: 1; scale: 1; translate: 0 100%; transition-duration: 180ms; }
@starting-style { dialog.sheet[open] { opacity: 1; scale: 1; translate: 0 100%; } }
```

- `100%` is the sheet's own height, so it works at any content size. A side drawer uses `translate: 100% 0`.
- It leaves through the edge it came from.
- Dragging is a gesture: 1:1 tracking, then a spring. Read [fluid](fluid.md) before writing it.
- Reduced motion: add `dialog.sheet` to the setup list and it fades in place.

## Toast

Use to confirm something the person just did. Not for errors that need an answer (inline message or dialog).

With a framework: Sonner through `seenry-libraries`, `<Toaster position="bottom-right" visibleToasts={3} />`, its own motion left alone. Notes are in [Sonner in practice](../../seenry-libraries/references/sonner.md).

No build step: one live region whose text is replaced.

```html
<div class="toast" role="status" aria-live="polite"></div>
```

```css
.toast { position: fixed; inset: auto 16px 16px auto; opacity: 0; translate: 0 16px; pointer-events: none;
  transition: opacity 140ms var(--ease-out), translate 140ms var(--ease-out); }
.toast[data-open] { opacity: 1; translate: 0 0; pointer-events: auto; transition-duration: 240ms; }
```

```js
const el = document.querySelector('.toast'); let timer;
function toast(message, ms = 4000) {
  el.textContent = message; el.dataset.open = '';
  clearTimeout(timer); timer = setTimeout(() => delete el.dataset.open, ms);
}
el.addEventListener('pointerenter', () => clearTimeout(timer));
el.addEventListener('pointerleave', () => { timer = setTimeout(() => delete el.dataset.open, 2000); });
```

- Enter 240ms from 16px below, exit 140ms the same way.
- Interruption: a second toast while the first is open swaps the text and restarts the timer; the transition retargets, so nothing flashes.
- The text and its action ride the card; never animate an Undo label in after its button.

## Tabs with a sliding indicator

Use for 2 to 6 sibling views. The selected state changes at once; the indicator follows.

```html
<div class="tabs" role="tablist">
  <span class="tabs-indicator" aria-hidden="true"></span>
  <button class="tab" role="tab" aria-selected="true" aria-controls="p1">Overview</button>
  <button class="tab" role="tab" aria-selected="false" aria-controls="p2" tabindex="-1">Activity</button>
</div>
<div class="tabpanel" role="tabpanel" id="p1">…</div>
<div class="tabpanel" role="tabpanel" id="p2" hidden>…</div>
```

```css
.tabs { position: relative; isolation: isolate; display: inline-flex; }
.tabs-indicator { position: absolute; inset: 0; z-index: -1; background: var(--tab-active, #ecece9);
  clip-path: inset(0 var(--right, 100%) 0 var(--left, 0px) round 8px);
  transition: clip-path 180ms var(--ease-move); }
.tab { transition: color 120ms var(--ease-fade); }
.tabpanel { transition: opacity 120ms var(--ease-fade); }
@starting-style { .tabpanel { opacity: 0; } }
```

```js
const tabs = document.querySelector('.tabs'), indicator = tabs.querySelector('.tabs-indicator');
const all = [...tabs.querySelectorAll('[role=tab]')];
function place(tab, animate = true) {
  if (!animate) indicator.style.transition = 'none';
  indicator.style.setProperty('--left', tab.offsetLeft + 'px');
  indicator.style.setProperty('--right', tabs.clientWidth - tab.offsetLeft - tab.offsetWidth + 'px');
  if (!animate) { indicator.offsetWidth; indicator.style.transition = ''; }
}
function select(tab) {
  for (const t of all) {
    t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = t !== tab;
  }
  place(tab);
}
all.forEach((t, i) => {
  t.addEventListener('click', () => select(t));
  t.addEventListener('keydown', (e) => {
    const next = e.key === 'ArrowRight' ? all[(i + 1) % all.length] : e.key === 'ArrowLeft' ? all[(i - 1 + all.length) % all.length] : null;
    if (next) { next.focus(); select(next); }
  });
});
place(all.find((t) => t.getAttribute('aria-selected') === 'true'), false);
new ResizeObserver(() => place(all.find((t) => t.getAttribute('aria-selected') === 'true'), false)).observe(tabs);
```

- The indicator animates `clip-path` only: no `width` or `left`, so no layout. An underline uses `inset(calc(100% - 2px) var(--right) 0 var(--left))`.
- First paint and resize place it with no transition.
- Content: the old panel leaves at once, the new one fades in over 120ms. No slide, no height animation.
- Interruption: three fast clicks land on the last tab; the clip retargets from where it is.
- Keyboard: arrow keys move selection instantly (setup block).
- React: Base UI `Tabs.Indicator` with `clip-path: inset(0 var(--active-tab-right) 0 var(--active-tab-left) round 8px)`, or Motion `layoutId="tab-indicator"` with `transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}`.

## Accordion

Use for optional detail under a heading. Height is the one layout property worth animating, so keep it short.

```css
:root { interpolate-size: allow-keywords; }
details::details-content { block-size: 0; overflow: clip;
  transition: block-size 240ms var(--ease-move), content-visibility 240ms allow-discrete; }
details[open]::details-content { block-size: auto; }
details:not([open])::details-content { transition-duration: 180ms; }
details > summary .chevron { transition: rotate 180ms var(--ease-move); }
details[open] > summary .chevron { rotate: 180deg; }
```

Browsers without `interpolate-size` open instantly, which is fine. For a custom disclosure, a grid track works everywhere:

```css
.panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 240ms var(--ease-move); }
.panel > .inner { overflow: hidden; min-height: 0; }
.panel[data-open] { grid-template-rows: 1fr; }
```

- Open 240ms, close 180ms. Never `max-height` with a guessed number: it makes the duration depend on the content.
- Interruption: a second click reverses from the current height.
- Padding goes on `.inner`, not on the track, or the panel never fully closes.
- Reduced motion: `details::details-content, .panel { transition: none; }`.

## Page and shared-element transition

Use when the next view has a visible relationship to this one (a card that becomes the page, a step that follows a step). Unrelated routes change instantly or with a 120ms crossfade.

```js
const go = (update) => document.startViewTransition ? document.startViewTransition(update) : update();
go(() => router.navigate(url));
```

```css
.card-cover { view-transition-name: var(--vt, none); }   /* unique per item, set inline: --vt: cover-42 */
::view-transition-group(*) { animation-duration: 280ms; animation-timing-function: var(--ease-move); }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 120ms; }
```

- Multi-page sites with no script: `@view-transition { navigation: auto; }` in both pages.
- Frameworks: use the router's own support (Astro `<ClientRouter />`, SvelteKit `onNavigate`, React Router `viewTransition`), or Motion `layoutId` for one shared element.
- Forward enters from the right, back from the left; the shell and navigation stay still.
- The route and focus change at once. A new navigation cancels the running transition.
- Reduced motion: the setup block removes the animation; the new page simply appears.
