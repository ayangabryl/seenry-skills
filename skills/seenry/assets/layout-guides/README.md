# Development layout guides

Reusable React source, with no package dependency beyond React. Copy both files into the project. Mark shared content containers `data-layout-region`; pass a `selectors` string for an existing app. Set `--layout-content` and `--layout-gutter` to the project tokens, and adjust column/gap breakpoints to the actual grid. Do not silently use the example dimensions as a new brand system.

```jsx
const Guides = import.meta.env.DEV
  ? React.lazy(() => import('./DevLayoutGrid.jsx'))
  : null;
// In the application root:
{Guides && <React.Suspense fallback={null}><Guides /></React.Suspense>}
```

Alt+G toggles guides, pointer inspection shows bounds/radius, resize and scroll refresh content edges. Source is supplied for adaptation: Vue/Svelte use their mount/unmount lifecycle for the same DOM measurements and observer cleanup; server-rendered apps initialize only on the client. Native implementations need native layout measurements and an equivalent development overlay, not DOM APIs. This is not a universal language runtime.

Required acceptance: compare shared content edges at desktop, wide and narrow widths, open disclosures and repeat, then hide guides for optical review. Inspect painted descendants and corner clipping, not only wrapper bounds. Confirm production bundles exclude the component. Keyboard shortcuts must not prevent ordinary typing; the toggle is pointer accessible.
