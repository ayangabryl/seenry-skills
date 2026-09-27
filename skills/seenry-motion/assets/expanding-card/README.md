# Expanding card

An original, in-flow card disclosure. Copy `expanding-card.mjs`, `expanding-card.css`, and its dependency `../geometry-transition.mjs` into a project, preserving their relative paths. It expands the card's real height; live text is never scaled. Replace the demo content and override the CSS variables with project tokens.

```html
<link rel="stylesheet" href="./expanding-card.css">
<section class="seenry-expanding-card">
  <button id="details-trigger" type="button">Details <span class="seenry-expanding-card__chevron" aria-hidden="true">⌄</span></button>
  <div id="details-panel"><div class="seenry-expanding-card__content">
    <p>Content the application actually owns.</p>
    <a href="/details">Read details</a>
  </div></div>
</section>
<script type="module">
  import { createExpandingCard } from './expanding-card.mjs';
  const card = createExpandingCard(document.querySelector('#details-trigger'), document.querySelector('#details-panel'));
  // On unmount: card.destroy()
</script>
```

The controller owns `aria-expanded`, `aria-controls`, geometry, closed-content inertness, focus return on collapse, Escape from inside, quick reversal, live content resize and reduced motion. It does not fetch data or grant access; the application owns content and permissions. Do not use this for a modal, a navigation menu, or an accordion that needs single-open group state without an application-level coordinator.

Check the [demo](demo.html) in its host at narrow and wide sizes. The [browser test](../../../../tests/expanding-card.browser.mjs) covers keyboard, quick reversal, live resize, reduced motion and cleanup. This is a general mechanism, not a measured recreation of another product.
