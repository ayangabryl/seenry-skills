# Development layout guides

Two adapters share `dev-layout-grid.css`: `DevLayoutGrid.jsx` for React and `DevLayoutGrid.mjs` for plain HTML or another DOM framework. Copy the stylesheet and the adapter that fits the project. Mark shared content containers `data-layout-region`; use `data-layout-name` for a legible guide label, or pass a `selectors` string for existing markup. Set `--layout-content` and `--layout-gutter` to the project tokens, and adjust column/gap breakpoints to the actual grid. Do not silently use the example dimensions as a new brand system.

For a plain HTML prototype, load the stylesheet and module only in local development. Keep them out of the shipped page. For example, in a local-only `dev.html` or development entrypoint:

```html
<link rel="stylesheet" href="./dev-layout-grid.css">
<script type="module">
  import {mountDevLayoutGrid} from './DevLayoutGrid.mjs';
  const unmountGuides = mountDevLayoutGrid({selectors: 'body, [data-layout-region]'});
  // Call unmountGuides() when this development view is disposed.
</script>
```

The plain adapter returns a cleanup function with `unmountGuides.refresh()` for an app that replaces region nodes. It observes resized regions. Alt+G and Alt+C toggle guides and 8px checks. The pointer inspector shows bounds, padding, gap and radius. It is an inspection aid; record actual edge measurements and inspect the clean render too.

For React, mount the JSX adapter in development mode:

```jsx
const Guides = import.meta.env.DEV
  ? React.lazy(() => import('./DevLayoutGrid.jsx'))
  : null;
// In the application root:
{Guides && <React.Suspense fallback={null}><Guides /></React.Suspense>}
```

Vue and Svelte can call the plain adapter in their mount lifecycle and its returned function on unmount. Server-rendered apps initialize only on the client. Native implementations need native layout measurements and an equivalent development overlay, not DOM APIs. This is not a universal language runtime.

Required acceptance: compare shared content edges at desktop, wide and narrow widths, open disclosures and repeat, then hide guides for optical review. Inspect painted descendants and corner clipping, not only wrapper bounds. Confirm production bundles exclude the component. Keyboard shortcuts must not prevent ordinary typing; the toggle is pointer accessible.
