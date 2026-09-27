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

`createReflectiveSurface(host, { active, palette })` returns `mode`, `setActive(boolean)`, `setPalette('silver' | 'bronze' | 'graphite')` and `destroy()`. Modes are `running`, `paused`, `static`, `idle` and `fallback`. The WebGL layer follows the host size and pointer, pauses when offscreen or the document is hidden, and holds a still frame for reduced motion. If WebGL2 is unavailable or context creation fails, the native control works over the CSS material. The code needs no animation package.

Use this for a product object whose material supports its identity. Avoid repeating it through a list or running it behind ordinary paragraphs. The CSS assumes a direct child `<button>`; adapt that selector for another semantic control. The [demo](demo.html) is a local visual study with a real local toggle, not a simulated backend action. Check the chosen palette, text contrast, GPU cost and actual interaction at the final component size. It is not a measured reproduction of another product.
