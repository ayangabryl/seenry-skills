# Confirmation burst

An original, finite canvas effect for a **confirmed** local or server state change. Copy `confirmation-burst.mjs` into a project and call `play()` only after the application records success. The helper never changes the button, data, route, or accessible status.

```js
import { createConfirmationBurst } from './confirmation-burst.mjs';
const burst = createConfirmationBurst(document.querySelector('#complete'), {
  colors: ['#d96943', '#e9b95f', '#6c9b86'], count: 28
});
// After your real completion succeeds:
burst.play();
// On unmount:
burst.destroy();
```

The canvas is fixed to the target while active, ignores pointer events and removes itself after at most 1.5 seconds. Repeated `play()` calls replace the prior burst. Reduced motion, a hidden page, or an offscreen target suppress it; a live reduced-motion change stops it. The application must still show completion in text and provide a recovery path if the action can fail. Use a quiet treatment for routine high-frequency actions; this effect belongs to an occasional milestone.

The [demo](demo.html) records a local milestone before playing around its progress marker and provides Reset. The [workbench](workbench.html) previews particle count, duration and three authored palettes, then exports the matching initializer. It is a focused tuning page for this effect, not a general effect editor. The [browser check](../../../../tests/confirmation-burst.browser.mjs) covers state ownership, rapid replay, keyboard input, reduced motion, visibility and cleanup. The demo's palette and composition are one authored example, not a default style or a visual match to an external effect.
