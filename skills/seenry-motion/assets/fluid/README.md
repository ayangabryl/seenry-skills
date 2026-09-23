# Seenry fluid renderer

Original React + browser SVG implementation. No third-party fluid package is required. Copy `FluidSurface.jsx` into your React project under the repository's MIT license.

FluidSurface owns the visual silhouette; your existing DOM owns labels, events, focus and accessibility. It measures registered items, renders a shared alpha-threshold SVG surface and follows changing rectangles during transitions. It sleeps after settling, cleans up observers and animation frames on unmount, and switches to ordinary DOM when reduced motion is enabled.

```jsx
import { FluidSurface, FluidItem } from './FluidSurface';
<FluidSurface fill="var(--surface)" blur={6} contrast={18}>
  <FluidItem x={open ? -54 : 0} y={open ? -34 : 0}
    transition={{ duration: 550, ease: 'cubic-bezier(.34,1.56,.64,1)' }}>
    <button aria-label="Add file" tabIndex={open ? 0 : -1}>…</button>
  </FluidItem>
</FluidSurface>
```

The fragment needs a stationary trigger, closed pointer gating, action handlers, Escape and focus return. Position the group to contain the whole travel region. Use one shared fill for a connected mass. Keep backgrounds in the visual layer and text in the unfiltered foreground.

Supported effects: `merge` (default) tracks already-animated DOM geometry directly; `morph` smooths resizing geometry; `move` anchors the leading edge to the target and stretches a bounded trailing body; `bend` curves both axes using filtered target velocity and settles after stopping; `melt` combines clipped images through a shared alpha-threshold surface, increasing color blur as the edge gap closes. These are Seenry implementations, not drop-in reproductions of another library's physics. Engine-specific advanced options from earlier examples are not supported.

Supported presentation: fill, blur, contrast and x/y/scale with duration/ease/delay. A resize is followed geometrically; it does not currently reproduce the previous engine's content cross-blur or shadow parsing. Browser verification for this version covers Chromium. Safari and Firefox remain unverified.

## Focus search

Copy `FluidSearch.jsx`, `fluid-search.css` and `FluidSurface.jsx` into the project. Import FluidSearch and provide the controlled `value` and `onChange`. Focus separates the field and close circle; Close/Escape clears and merges them. The bundled implementation uses React and browser primitives, with no additional package installation.
