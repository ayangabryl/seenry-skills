# Fluid surfaces adapter

Install the pinned MIT runtime in your React project:

```sh
npm install liquid-gooey@0.2.2
```

Copy `FluidSurface.jsx` and `LICENSE.upstream` into your project. Preserve the license. This is a Seenry integration adapter for Jakub Antalik's engine, not a renamed claim of authorship.

```jsx
import { FluidSurface, FluidItem } from './FluidSurface';

<FluidSurface fill="var(--surface)" blur={6} contrast={18}>
  <FluidItem x={open ? -54 : 0} y={open ? -34 : 0}
    transition={{ duration: 550, ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
    <button aria-label="Add a file" tabIndex={open ? 0 : -1}
      aria-hidden={!open} onClick={addFile}>…</button>
  </FluidItem>
</FluidSurface>
```

This is a fragment, not a full accessible menu. The application supplies positioning, a stationary trigger, action handlers, closed pointer-event gating, Escape and focus return. Keep the whole travel area within the group. Surface color and content contrast use the project's existing tokens. Engine options pass through unchanged; the adapter provides live reduced-motion static rendering.

Families: `morph` merges/reshapes, `move` trails motion, `bend` flexes the moving body, `melt` blends exactly two images. See the installed version's README for supported options. CSS opacity/blur is appropriate when no surface joining is needed.

The live examples are in `site/src/FluidLab.jsx`. Nine contexts use this adapter or CSS blur. All are local demonstrations; connect actions to real application state before shipping. No backend operation is implied.
