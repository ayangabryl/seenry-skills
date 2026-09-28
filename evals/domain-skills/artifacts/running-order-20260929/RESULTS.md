# Running order trial — first implementation and self checks

## Delivered

- Runnable static source: `index.html`, `styles.css`, `script.js`. From this directory run `python3 -m http.server 8768 --bind 127.0.0.1`, then open `http://127.0.0.1:8768/`.
- Design and interaction record: `DESIGN.md`.
- Frozen first complete source: `first-pass/source/`. The working source includes only corrections found in my own checks; no independent review or review-led repair was run.
- Reference playback evidence: `reference.mp4` and `reference_frames/` (frame samples and contact sheet). These are reference evidence, not captures of the component.

## Checks run

| Check | Result |
| --- | --- |
| `node --check script.js` | Passed. |
| `node checks/functional.mjs` | Passed initial times, keyboard move and focus, reset, pointer and touch reorder, rapid reversal, cancellation, resize cancellation, and reduced-motion order in a browserless DOM harness. |
| HTML structural parse | Passed unique IDs and required hooks for agenda, reset, status, instructions, and three grips. |
| Opaque color-pair contrast check | Passed six checked small-text pairs after darkening muted labels. Lowest checked ratio: 4.555:1. |
| Local HTTP serve and browser capture | Unavailable. Sandbox denied binding `127.0.0.1:8768` (`PermissionError: Operation not permitted`); the browser blocked direct `file:` access. |

## Required captures and limits

The requested wide and phone default captures, intermediate drag capture, and reordered settled capture could not be made in this sandbox. `first-pass/captures/` is intentionally empty; no synthetic image is presented as an observed browser state. The user has been asked to start a local HTTP server in the trial directory so these captures and live interaction checks can be completed. Until then, visual layout, actual browser drag timing, touch hardware behavior, live reduced-motion switching, and rendered contrast remain unverified. The browserless harness checks logic, not pixels or pointer dispatch in a browser.

## Scope boundary

Stopped after the first implementation and my own functional checks. No independent critique, review gate, or review-led repair was run.
