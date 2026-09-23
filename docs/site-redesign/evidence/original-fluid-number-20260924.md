# Original renderer and corrected number behavior

## Inspected reference

https://transitions.dev/ public Number pop-in example. Clicked Animate in the browser and inspected the visible result. Read its public CSS and the live computed custom properties on `.p9-number` at the desktop viewport: 500ms, 8px, 2px blur, 70ms stagger, cubic-bezier(.34,1.45,.64,1). Source simultaneously overlays the outgoing number and the new number. These are source/runtime settings, not estimates from a recording. No Pro material used.

The former Seenry demo used 70% travel, 6px blur and exit-before-entry wait presence; that was a different mechanism. NumberBlur now has two fixed layers per column, simultaneous incoming/outgoing movement using the inspected configuration, and cancellation/retargeting on new input. The semantic value updates immediately. Direction reversal and bounded rapid input are authored handling; no claim is made that the reference uses the identical interruption algorithm.

## Original surface engine

Removed liquid-gooey from package.json and lockfile. Replaced the adapter with a separately authored React/SVG renderer: measured rectangles, alpha silhouette filtering, lagging movement, curved path bending and two-image contact displacement. No upstream runtime source copied. Common browser SVG filter primitives are used. Historical research/license records refer to the previous implementation; the active renderer no longer requires that library or its license file.

This implementation has different physics and image treatment. It is not described as a pixel-identical replacement or proven superior. Its supported API is deliberately narrower: no arbitrary upstream spring, content-blur or shadow-parser options.

## Checks

Production build and skill validation pass. Browser checks: opened fan geometry, Escape focus restoration, panel, blend, digit carry/rapid updates settling at 101, exactly two DOM glyph layers per digit, 390px layout with no horizontal overflow, and reduced-motion static SVG-free surfaces. No new browser console errors in the inspected run. Safari/Firefox and timing-perfect visual equivalence remain unverified.
