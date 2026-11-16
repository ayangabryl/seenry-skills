# Recipes: feedback, content and lists

**Read when:** animating a number, an icon swap, a checkbox, toggle or success check, a skeleton handing over to content, a list that adds, removes or reorders, an error shake, AI thinking and streaming text, a staggered group, a scroll reveal, or a hold-to-confirm. Surfaces and navigation are in [recipes](recipes.md), which also holds the setup block (tokens, keyboard, reduced motion) these recipes assume.

## Contents

- Number change
- Icon swap
- Checkbox, toggle, success check
- Skeleton to content
- List add, remove, reorder
- Error shake
- AI thinking and streaming text
- Staggered group
- Scroll reveal
- Hold to confirm
- Small techniques

## Number change

Use when seeing the change helps someone follow the result of their action (a price after a plan switch, a quantity, a total). Not for clocks, live tickers or table cells: update those instantly. Always `font-variant-numeric: tabular-nums`.

With a framework: NumberFlow through `seenry-libraries` (`@number-flow/react`, `@number-flow/vue`, `@number-flow/svelte`).

```jsx
<NumberFlow value={price} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
  transformTiming={{ duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
  opacityTiming={{ duration: 160, easing: 'ease-out' }} />
```

It reads `prefers-reduced-motion` itself and keeps one accessible value.

No build step: only the characters that changed move. The currency sign and unchanged digits stay still.

```html
<span class="num"><span class="num-text" aria-live="polite">$19</span><span class="num-digits" aria-hidden="true">$19</span></span>
```

```css
.num { position: relative; display: inline-block; font-variant-numeric: tabular-nums; }
.num-text { position: absolute; opacity: 0; pointer-events: none; }      /* read aloud; .num-digits is what is drawn */
.num-digits > span { display: inline-block; }
```

```js
function setNumber(num, text, rose = true) {
  const label = num.querySelector('.num-text'), digits = num.querySelector('.num-digits'), before = label.textContent;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.input === 'keyboard';
  label.textContent = text;                                              // the real value is there at once
  digits.replaceChildren(...[...text].map((ch, i) => {                   // replacing drops running animations: the latest value wins
    const span = document.createElement('span'); span.textContent = ch;
    const changed = /\d/.test(ch) && before[before.length - text.length + i] !== ch;   // digits only, compared from the right so units line up
    if (changed && !still) span.animate([{ opacity: 0, translate: `0 ${rose ? 60 : -60}%` }, { opacity: 1, translate: '0 0' }],
      { duration: 160, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    return span;
  }));
}
```

For digits that roll through the values between, copy [number-transition.mjs](../assets/number-transition.mjs) with its `number-flow/` folder (`createNumberTransition({ slot, value, format, duration: 400 })`, then `.update(next)`).

- Never fade the whole value out and in: the eye loses the number. Only what changed moves.
- A rising value enters from below, a falling one from above.
- Values arriving faster than 160ms apart: show the latest, never spool through the ones between.
- Put `aria-live="polite"` on the container, not on each digit. Signs and separators do not roll.

## Icon swap

Use for two icons in one slot: copy to check, play to pause, menu to close. The button box never changes size.

```css
.swap { display: inline-grid; }
.swap > * { grid-area: 1 / 1; transition: opacity 120ms var(--ease-fade) 40ms, scale 120ms var(--ease-out) 40ms; }
.swap > [data-hidden] { opacity: 0; scale: 0.9; transition-duration: 80ms; transition-delay: 0ms; }
```

- The old icon leaves in 80ms, the new one arrives in 120ms after a 40ms beat: they overlap, never queue.
- Add `filter: blur(2px)` to the hidden state when the two shapes fight mid-swap.
- The accessible name changes at once (`aria-label`, `aria-pressed`).
- React: Motion `AnimatePresence mode="popLayout" initial={false}` with the same values.

## Checkbox, toggle, success check

```css
.check-box { transition: background-color 120ms var(--ease-fade), border-color 120ms var(--ease-fade); }
.check-mark { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 160ms var(--ease-out) 60ms; }
:checked + .check-box .check-mark, .success .check-mark { stroke-dashoffset: 0; }
:not(:checked) + .check-box .check-mark { transition-duration: 80ms; transition-delay: 0ms; }

.switch-thumb { transition: translate 160ms var(--ease-out); }
[role="switch"][aria-checked="true"] .switch-thumb { translate: 18px 0; }
```

- Give the check path `pathLength="1"` so the dash values need no measuring.
- Cause then effect: the box fills (120ms), the check draws 60ms later (160ms). Unchecking is faster and has no delay.
- The thumb travels by `translate`, never `left` or `margin`.
- A state change never alters font weight or size on a label: the text reflows and the control shifts sideways. Change colour only.
- Success: the label says it worked first; the check draws after. A particle burst is for a rare milestone only ([confirmation-burst](../assets/confirmation-burst/README.md)), never for a routine save, and never delays the next action.
- With a framework: Base UI `Checkbox` and `Switch` set the state attributes; these transitions attach to them.

## Skeleton to content

Use when a load takes more than about 300ms. A cache hit shows content with no skeleton and no fade.

```css
.skeleton { background: var(--skeleton, #e9e9e7); animation: skeleton-pulse 1200ms var(--ease-fade) infinite alternate; }
@keyframes skeleton-pulse { from { opacity: 1; } to { opacity: 0.45; } }
.loaded { transition: opacity 180ms var(--ease-fade); }
@starting-style { .loaded { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }
```

- The skeleton holds the final box, so nothing shifts when content lands.
- Hand over on readiness, not on a timer: decode images first, then swap.
- One pulse, shared by every block (one loop on the page). It stops the moment the request ends, on success or error.
- No travel on arriving text. An image may clear from `filter: blur(4px)` over 180ms.

## List add, remove, reorder

With a framework: Motion through `seenry-libraries`.

```jsx
<AnimatePresence mode="popLayout" initial={false}>
  {items.map((item) => (
    <motion.li key={item.id} layout
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.08 } }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }} />
  ))}
</AnimatePresence>
```

Drag to reorder: `@dnd-kit/react` (`seenry-libraries`), not hand-rolled pointer maths.

No build step: wrap the change in a view transition; each row needs a stable name.

```css
.row { view-transition-name: var(--row); }               /* inline: style="--row: row-17" */
::view-transition-group(*) { animation-duration: 180ms; animation-timing-function: var(--ease-move); }
```

```js
const change = (update) => document.startViewTransition ? document.startViewTransition(update) : update();
change(() => list.insertBefore(row, list.firstChild));
```

- `popLayout` takes a leaving row out of the flow at once, so the others close the gap while it fades (80ms) instead of after it.
- Stable keys: a reorder must move the same element, not remove and recreate it.
- No stagger on sort, filter or bulk removal.
- Undo restores the same row from where it is on screen.

## Error shake

Use once, when a submitted value is rejected. The red border and the message carry the meaning; the shake only draws the eye.

```css
.field[aria-invalid="true"] { border-color: var(--danger, #c8372d); }
.field.shake { animation: field-shake 280ms var(--ease-out); }
@keyframes field-shake { 0% { translate: 0 0; } 25% { translate: -6px 0; } 50% { translate: 5px 0; } 75% { translate: -3px 0; } 100% { translate: 0 0; } }
@media (prefers-reduced-motion: reduce) { .field.shake { animation: none; } }
```

```js
field.classList.remove('shake'); field.offsetWidth; field.classList.add('shake');   // replays on a second failure
```

Keyframes are right here: a repeat should restart. Never shake while the person is still typing.

## AI thinking and streaming text

```css
.thinking { transition: opacity 120ms var(--ease-fade) 150ms; }              /* 150ms debounce: fast answers never show it */
@starting-style { .thinking { opacity: 0; } }
.thinking-mark { animation: thinking-pulse 1200ms var(--ease-fade) infinite alternate; }
@keyframes thinking-pulse { from { opacity: 0.45; } to { opacity: 1; } }
.status { transition: opacity 120ms var(--ease-fade) 40ms; }
@starting-style { .status { opacity: 0; } }
.chunk { animation: chunk-in 80ms var(--ease-fade) both; }
@keyframes chunk-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .thinking-mark, .chunk { animation: none; } }
```

- One loop: the thinking mark. It stops the frame the first token arrives or the request fails; it never finishes its cycle first.
- Status labels ("Searching", "Reading 4 files") swap in place: replace the element so the new one fades in over 120ms. For reserved width and announcements copy [status-switch](../assets/status-switch/README.md).
- Streamed text: append per animation frame, fade each chunk 80ms with no travel, and commit the final text with no further animation. Never animate token by token and never hold ready text back for effect.
- Stop is available from the first frame and acts at once.
- Scroll follows the stream only while the reader is at the bottom.
- With a framework, richer indicators come from `seenry-libraries` (`thinking-orbs`, `border-beam`).

## Staggered group

Use for a group seen once: a first-run screen, an empty state, a results page, a marketing hero. Not for menus, tables, tab content or any list opened daily (those appear together).

```css
.rise { animation: rise 300ms var(--ease-out) both; animation-delay: var(--d, 0ms); }
@keyframes rise { from { opacity: 0; translate: 0 8px; } }
.rise:nth-child(2) { --d: 40ms; }
.rise:nth-child(3) { --d: 70ms; }
.rise:nth-child(n + 4) { --d: 90ms; }
@media (prefers-reduced-motion: reduce) { .rise { animation: none; } }
```

- The gaps shrink (40, 30, 20) and everything after the fourth arrives with it: 90ms of delay in total.
- Marketing hero: 600ms each with delays 0, 80, 140, 180ms; the lead travels 12px, support 8px, decoration fades in place.
- One entrance per container: if the panel animates in, its children do not.
- Everything is clickable while it plays. Motion: `delayChildren: stagger(0.04)` on the parent variant.

## Scroll reveal

Marketing pages only, once per element, never on product screens.

```css
@media (prefers-reduced-motion: no-preference) {
  .reveal { opacity: 0; translate: 0 16px; transition: opacity 600ms var(--ease-out), translate 600ms var(--ease-out); }
  .reveal[data-seen] { opacity: 1; translate: 0 0; }
}
```

```js
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.dataset.seen = ''; seen.unobserve(e.target); }
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach((el) => seen.observe(el));
```

Content above the fold never waits for scroll. A scene scrubbed by scroll position is in [expressive](expressive.md).

## Hold to confirm

For destructive actions where one click is too easy.

```css
.hold .fill { clip-path: inset(0 100% 0 0); transition: clip-path 160ms var(--ease-out); }
.hold:active .fill { clip-path: inset(0 0 0 0); transition: clip-path 1500ms linear; }
```

The fill is progress, so it is linear and exempt from the duration limits; the release snaps back in 160ms. Act when the timer completes, never on press. Space and Enter hold the same way.

## Small techniques

- **Blur a seam.** When two overlapping states read as two objects, add `filter: blur(2px)` to both during the swap. Stay at or under 4px.
- **Percent translate.** `translate: 0 100%` moves by the element's own size, so it survives content changes.
- **Reveal by clipping.** `clip-path: inset(0 0 100% 0)` to `inset(0)` reveals without moving layout; an image unmask runs 900ms with `--ease-move`.
- **Programmatic and cancellable.** `el.animate(keyframes, { duration, easing })` returns an object you can `cancel()` or `reverse()`; cancel the previous one before starting the next.
- **Theme switch.** Add a style tag with `*{transition:none!important}`, apply the theme, read `getComputedStyle(document.body).opacity`, remove the tag on the next frame. Colours must not smear.
- **First paint.** Entrances belong to changes the person causes. On load, `initial={false}` on `AnimatePresence`; in CSS, scope `@starting-style` under a class added after the first frame.
- **`will-change`.** Only on an element that stutters on its first frame, and removed afterwards.
