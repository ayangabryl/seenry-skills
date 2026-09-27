# Modal surface

An original Seenry transition for a native `<dialog>`. Copy `modal-surface.mjs` and `modal-surface.css` into a web project. Use it when a decision or focused task must temporarily interrupt the current page. The browser supplies the top layer, focus containment and modal semantics; the controller handles entrance, exit, reversal, Escape, backdrop dismissal and focus return.

```html
<link rel="stylesheet" href="./modal-surface.css">
<button id="open-details" type="button">View details</button>
<dialog class="seenry-modal-surface" id="details" aria-labelledby="details-title">
  <button type="button" data-modal-close aria-label="Close details">Close</button>
  <h2 id="details-title">Details</h2>
  <p>Useful content or a real task belongs here.</p>
</dialog>
<script type="module">
  import { createModalSurface } from './modal-surface.mjs';
  const surface = createModalSurface(document.querySelector('#open-details'), document.querySelector('#details'));
  // On unmount: surface.destroy()
</script>
```

The application owns form submission, validation, navigation and content. Give the dialog an accessible name, use real controls, and avoid opening it for passive information that fits in the page. Theme `--modal-surface`, `--modal-ink`, `--modal-radius` and `--modal-duration` to the host product. Test keyboard focus, rapid open and close, page scroll, narrow width, and a live change to reduced motion. The [demo](demo.html) shows one art direction; the [browser test](../../../../tests/modal-surface.browser.mjs) covers the state contract. This is a general mechanism, not a recreation of another product.
