# Directional stage

An original Seenry presentation helper for a small set of related views. Copy the module and CSS into a web project. The host application owns the selected view, URL, back behavior and data. Use this when forward and back represent a meaningful order; use ordinary navigation when the views are unrelated.

```html
<link rel="stylesheet" href="./directional-stage.css">
<div class="seenry-directional-stage" id="stage">
  <section data-view="overview"><h2 tabindex="-1" data-view-focus>Overview</h2>…</section>
  <section data-view="detail"><h2 tabindex="-1" data-view-focus>Detail</h2>…</section>
</div>
<script type="module">
  import { createDirectionalStage } from './directional-stage.mjs';
  const stage = createDirectionalStage(document.querySelector('#stage'), { initial: 'overview' });
  // After the application updates its route: stage.show('detail');
  // On unmount: stage.destroy();
</script>
```

Direct children with unique `data-view` values form the ordered sequence. `show(id)` moves toward the requested index and retargets the CSS transition from its current position on rapid changes. The incoming view becomes the only focusable, exposed view immediately; a heading marked `data-view-focus` receives focus without scrolling. Use `{moveFocus:false}` when the application has already placed focus. `current`, `refresh()` and `destroy()` are available. The stage observes view height changes and animates its own height. Reduced motion makes view changes immediate, including when the preference changes while the page is open.

The [demo](demo.html) wires a real `history.pushState` and `popstate` to illustrate ownership. The [browser check](../../../../tests/directional-stage.browser.mjs) exercises back navigation, focus, rapid reversal, reduced motion and narrow width. The helper does not fetch content, intercept links or invent route semantics.
