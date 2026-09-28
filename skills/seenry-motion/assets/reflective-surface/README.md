# Reflective surface

An original Seenry WebGL2 material layer for one important control. Copy `reflective-surface.mjs` and `reflective-surface.css` into a web project. The real action, label, focus and state remain in ordinary HTML; the canvas is decorative and the CSS supplies a static fallback.

```html
<link rel="stylesheet" href="./reflective-surface.css">
<div id="instrument" class="seenry-reflective">
  <button type="button" aria-pressed="false">Open instrument</button>
</div>
<script type="module">
  import { createReflectiveSurface } from './reflective-surface.mjs';
  const host = document.querySelector('#instrument');
  const surface = createReflectiveSurface(host, { palette: 'silver' });
  host.querySelector('button').addEventListener('click', event => {
    const next = event.currentTarget.getAttribute('aria-pressed') !== 'true';
    event.currentTarget.setAttribute('aria-pressed', String(next));
    surface.setActive(next);
    // Perform the real application action here.
  });
  // Call surface.destroy() before removing the host.
</script>
```

`createReflectiveSurface(host, { active, palette, appearance, reflectionTargets })` returns `mode`, `setActive(boolean)`, `setPalette('silver' | 'chromatic' | 'bronze' | 'graphite')` and `destroy()`. The default `solid` appearance is the broad material shown above. The original [rim study](rim-demo.html) uses `appearance: 'rim'`, `palette: 'chromatic'` and an optional `reflectionTargets: [neighbor]` array for a compact, dark-centered control with a linked highlight on nearby DOM. The target stays a real element with readable content; the helper adds only an aria-hidden canvas and restores its positioning on destroy. Keep target elements mounted while the effect is active.

Modes are `running`, `paused`, `static`, `idle` and `fallback`. The WebGL layer follows the host size and pointer, pauses when offscreen or the document is hidden, and holds a still frame for reduced motion. If WebGL2 is unavailable or context creation fails, the native control works over the CSS material and linked decoration is hidden. The code needs no animation package. A connected rim can help a compact action read as part of the same instrument; it is not a generic material treatment for every button.

Use this for a product object whose material supports its identity. Avoid repeating it through a list or running it behind ordinary paragraphs. The CSS assumes a direct child `<button>`; adapt that selector for another semantic control. The [solid demo](demo.html) and [rim demo](rim-demo.html) use real local toggles, not simulated backend actions. Check the chosen palette, text contrast, GPU cost and actual interaction at the final component size. The rim's pointer response is subtle at 40–50 px; if direction-changing highlights matter to the brief, inspect and tune that behavior separately. These original studies are not measured reproductions of another product.
