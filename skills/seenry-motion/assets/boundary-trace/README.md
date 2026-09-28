# Boundary trace

An original Seenry SVG rim for an existing surface. It travels only while the application says the surface is active; idle has no ornament, and reduced motion shows a steady outline. Copy `boundary-trace.mjs` and `boundary-trace.css` into a web project. It uses no animation package.

```html
<link rel="stylesheet" href="./boundary-trace.css">
<section id="review-card" style="border-radius: 18px">
  <h2>Reviewing your file</h2>
  <p id="review-status" role="status">Waiting to start</p>
</section>
<script type="module">
  import { createBoundaryTrace } from './boundary-trace.mjs';
  const trace = createBoundaryTrace(document.querySelector('#review-card'), {
    color: '#c15077', cycle: 2800,
  });
  async function reviewFile() {
    trace.setActive(true);
    document.querySelector('#review-status').textContent = 'Reviewing file…';
    try {
      await runActualReview(); // Your application owns this operation.
      document.querySelector('#review-status').textContent = 'Review complete';
    } catch {
      document.querySelector('#review-status').textContent = 'Review failed; try again';
    } finally {
      trace.setActive(false);
    }
  }
  // Call trace.destroy() when the surface is removed.
</script>
```

The controller returns `setActive(boolean)`, `mode` (`idle`, `running`, `paused`, `static`) and `destroy()`. It observes the host size, viewport presence, document visibility and live reduced-motion preference. The SVG is decorative, ignores pointer input and adds no accessible name; put real status in the DOM. Use at most one leading trace per view and keep a normal focus ring on interactive content.

The host needs a uniform rounded corner; this version measures its top-left radius and applies it to the whole rim. It changes a `position: static` host to relative while mounted and restores the inline value on destroy. `color`, cycle, segment length and stroke width are configurable. Pass `colors: ['#b35a45', '#c75387', '#667db3']` for an optional 2–4 stop rim; `colors` takes precedence over `color`. The moving segment samples that fixed gradient as it travels. `glow` (0–1, default 0.3) controls halo strength. Reduced motion defaults to a steady full outline; use `staticAppearance: 'segment'` when that outline would compete with a focus ring or another important border. Choose colors and glow for the product's identity and check them against the host surface at native size. The [demo](demo.html) is a local preview, not a simulated operation or a packaged React component. Do not claim fidelity to another product from this recipe.
