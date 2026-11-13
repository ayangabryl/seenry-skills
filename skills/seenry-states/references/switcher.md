# The state switcher

The control that flips states on a workbench. It sits beside the thing being judged, so build it as specified and do not redesign it.

## Outside the design system, on purpose

No project tokens, fonts or colors: one dark neutral surface and the system font. A switcher that looks native becomes part of what you are looking at. It does not follow the theme; dark reads as tooling over light and dark pages alike.

## Behavior

- States sit in a vertical list under their group headings, in the order they were written down. A row of tabs runs off the screen past about seven states; a grouped list stays scannable at thirty.
- It sets a `__state` search param and reads the active state from it, so the URL is the source of truth and every state is a link. The double underscore keeps it clear of params the app reads.
- Up and down (or left and right) arrow keys step through every state in list order, across groups. `H` hides and shows the switcher for screenshots.
- Key handling ignores events with a modifier key, events already `defaultPrevented`, and events from inputs, textareas, selects and editable elements.
- The active button carries `aria-pressed="true"` and scrolls into view. The list has a label; each group is a `role="group"` labelled by its heading.
- Switching is instant and keeps the scroll position.
- Where there is no room beside the component, the same groups appear as a `<select>` above it. Both are always rendered and a container query shows one, so the active state survives a resize.

## Markup

```html
<div class="sw-page">
  <nav class="sw" aria-label="States">
    <div role="group" aria-labelledby="sw-data">
      <span class="sw-h" id="sw-data">Data</span>
      <button type="button" data-state="loading" aria-pressed="false">Loading</button>
      <button type="button" data-state="empty" aria-pressed="true">Empty</button>
    </div>
  </nav>
  <label class="sw-select">State
    <select><optgroup label="Data"><option value="loading">Loading</option><option value="empty" selected>Empty</option></optgroup></select>
  </label>
  <main class="sw-stage"><!-- the real component, at its production width --></main>
</div>
```

## Styles

```css
.sw-page { container-type: inline-size; display: grid; grid-template-columns: 13rem minmax(0, 1fr); min-height: 100vh; }
.sw, .sw-select { all: unset; font: 13px/1.4 system-ui, sans-serif; color: #e8e8e6; background: #1b1b1a; }
.sw { display: block; padding: 12px; overflow-y: auto; max-height: 100vh; position: sticky; top: 0; }
.sw [role="group"] { display: grid; gap: 2px; margin-bottom: 16px; }
.sw-h { color: #9a9a96; padding: 4px 8px; }
.sw button { all: unset; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
.sw button[aria-pressed="true"] { background: #e8e8e6; color: #1b1b1a; font-weight: 600; }
.sw button:focus-visible { outline: 2px solid #e8e8e6; outline-offset: 1px; }
.sw-select { display: none; padding: 8px 12px; }
.sw-stage { padding: 32px; min-width: 0; }
@container (max-width: 48rem) {
  .sw-page { grid-template-columns: 1fr; }
  .sw { display: none; }
  .sw-select { display: flex; gap: 8px; align-items: center; }
}
.sw-hidden .sw, .sw-hidden .sw-select { display: none; }
```

## Script

```js
const params = new URLSearchParams(location.search);
const buttons = [...document.querySelectorAll('.sw button')];
const select = document.querySelector('.sw-select select');
const active = params.get('__state') || buttons[0].dataset.state;
const go = s => { params.set('__state', s); location.search = params.toString(); };
for (const b of buttons) {
  b.setAttribute('aria-pressed', String(b.dataset.state === active));
  b.addEventListener('click', () => go(b.dataset.state));
  if (b.dataset.state === active) b.scrollIntoView({ block: 'nearest' });
}
select.value = active;
select.addEventListener('change', () => go(select.value));
addEventListener('keydown', e => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;
  const i = buttons.findIndex(b => b.dataset.state === active);
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(buttons[(i + 1) % buttons.length].dataset.state);
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(buttons[(i - 1 + buttons.length) % buttons.length].dataset.state);
  else if (e.key.toLowerCase() === 'h') document.querySelector('.sw-page').classList.toggle('sw-hidden');
});
```

In a framework, read `__state` with the router and render the fixture for it; the markup, styles and keys stay the same.
