# Pointer tilt

An original pointer response for a product object with a material face. Use `createPointerTilt(host, { plane, glare, maxDegrees })` with the host as the stable interaction region and `plane` as a decorative child. Import the module and use the accompanying CSS as a starting point. Keep actual links and buttons on the non-transforming host layer; the demonstration's card label is part of its decorative face and does not act as a control.

The controller normalizes pointer coordinates, caps rotation at 16 degrees, resets on leave/cancel/blur, and turns off for coarse pointers and live reduced-motion changes. `destroy()` removes every listener and resets the pose. It does not implement a drag interaction or imply a real payment card. Inspect glare brightness, readable contrast, edge clipping and the angle at the actual footprint. If the effect makes the object harder to read, reduce or remove it.

Run `node tests/pointer-tilt.browser.mjs --playwright /absolute/path/to/playwright/index.mjs` to check pointer response, rest, reduced motion, narrow layout and cleanup. The [demo](demo.html) is an independent material study, not a measured recreation of a third-party design.
