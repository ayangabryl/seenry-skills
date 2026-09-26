# Anchored action menu

An original Seenry implementation of a common product menu. Copy `action-menu.mjs` and `action-menu.css` into a web project. Use it for a short list of actions attached to one trigger. For ordinary navigation links, prefer a native link list rather than menu semantics.

```html
<link rel="stylesheet" href="./action-menu.css">
<div class="seenry-action-menu">
  <button id="actions" type="button">Actions</button>
  <div id="actions-panel" aria-label="Item actions" hidden>
    <button role="menuitem" type="button" value="rename">Rename</button>
    <button role="menuitem" type="button" value="duplicate">Duplicate</button>
  </div>
</div>
<script type="module">
  import { createActionMenu } from './action-menu.mjs';
  createActionMenu(document.querySelector('#actions'), document.querySelector('#actions-panel'), {
    onSelect(item) { console.log(item.value); },
  });
</script>
```

The controller owns open/closed presentation, `aria-expanded`, focus movement, outside dismissal, Escape, arrows, Home/End, and cleanup. The application owns whether an action succeeds, navigation, dialogs, disabled states, and any announcement of the outcome. Keep the menu in an anchored wrapper; for clipped hosts, position a portal layer and update its anchor on scroll and resize. Theme `--menu-surface`, `--menu-ink`, and `--menu-hover` to match the product.

Test the menu in its host: quick close/reopen, Tab away, pointer outside, keyboard activation, narrow width, and a live reduced-motion change. The [demo](demo.html) exercises the visible treatment; the [browser test](../../../../tests/action-menu.browser.mjs) covers state and keyboard behavior. This recipe is an original implementation of a general action-menu mechanism, not a measured trajectory from another product.
