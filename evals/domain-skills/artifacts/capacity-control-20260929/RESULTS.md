# Isolated Seenry Motion capacity trial — first complete result

The first complete prototype is served at `http://127.0.0.1:8770/`. The source is `index.html`, `styles.css`, and `script.js`, with a frozen copy in `first-complete/source/`. No review-led repair was made after the first complete render.

## Preserved renders

| Browser viewport | Capture | Initial state |
| --- | --- | --- |
| 1440 × 900 CSS px | `first-complete/renders/wide.jpg` | 16 seats, 0 open, 0 waitlisted people could fit |
| 390 × 844 CSS px | `first-complete/renders/390.jpg` | Same initial state; entire card visible |
| 320 × 780 CSS px | `first-complete/renders/320.jpg` | Same initial state; full-page capture includes content below the fold |

The browser's full-page capture excludes the 15 px scrollbar at the 320 px viewport, so that image is 305 px wide. The tested viewport was 320 CSS px.

## Functional checks on the localhost page

- Pointer drag at 320 px moved the native slider from 16 to 28. The displayed values became 28 capacity, 12 seats open, and 8 of 8 waitlisted people who could fit.
- Keyboard Left, Right, Home and End changed the range by whole seats and kept the displayed count, accessible value text, and seat marks synchronized after rapid reversal. At 17, the preview showed 1 open seat and 1 waitlisted person who could fit.
- At 24, the preview showed 8 open seats, 8 of 8 waitlisted people who could fit, 8 potential waitlist marks and no beyond-waitlist marks. At 28, it showed 12 open seats, 8 of 8 who could fit, 8 potential marks and 4 beyond-waitlist marks.
- Reset returned the slider and all derived values to 16 / 0 / 0 and disabled itself. Focus returned to the slider.
- No horizontal overflow was measured at 320 or 390 CSS px. The browser reported no console errors during these checks.

## Check limits

- Browser security policy rejected the raw device-emulation request, stating that permission for raw CDP on this localhost page was declined. Synthesized touch and live reduced-motion switching could not be checked. The control uses a native range input, and its presentation updates immediately without queued animation, but those two runtime checks remain unverified.
- The requested boundary was observed: no review-led visual, contrast, or motion repair followed the first complete captures and functional checks.
