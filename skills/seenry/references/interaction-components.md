# Build an interaction-led component

Use when the component's appeal or utility depends on how it responds: a draggable control, spatial collection, morphing action, animated value, scroll instrument, or canvas effect. Keep the user's requested interaction and host constraints. A lab demo may be playful; a production component still needs a truthful task, usable states and a restrained place in its product.

## Identify the response worth building

Inspect the supplied reference in motion when possible. Record the trigger, object, input path, immediate response, release or commit, settled result and reset. A still image cannot establish drag resistance, timing, interruption or keyboard behavior. Separate observed behavior from an inferred implementation. For an original component, choose one clear response that belongs to its object; an effect name or animation library is not a concept.

For a close component recreation or a high-craft interaction benchmark, use [the interaction study and local component code](../../seenry-motion/references/interaction-reference.md) for concrete mechanisms and rights, then inspect the supplied live reference. Decide whether the request is a recreation of that component or an original component held to its craft standard. The study is an entry point, not a substitute for comparing the actual output.

Choose the closest family, then prototype its decisive moment in the actual host size. Families can overlap; load only the mechanics that matter.

| Family | Resolve before styling | Failure to exercise |
| --- | --- | --- |
| Press, hold and commit | Press feedback, commit threshold, cancel/release and confirmed result | Early release, pointer leaving, key repeat, async failure |
| Drag, dial, slider and scrub | Coordinate mapping, bounds, resistance, snap points and value source | Capture loss, resize during drag, touch scroll conflict, keyboard step |
| Sort, swipe and spatial canvas | Item identity, hit testing, insertion/drop rule, persistence and return | Fast reversal, edge drop, pan/zoom, keyboard move and focus recovery |
| Menus, popovers and morphing surfaces | Trigger anchor, placement, open/close and focus ownership | Escape, outside press, viewport edge, rapid reopen |
| Animated numbers, charts and progress | Data truth, value formatting, stable unit/baseline and update cadence | Carry/borrow, rapid changes, stale or fake progress |
| Text, scroll and media reveals | Reading order, progress owner, content availability and replay | Reverse scroll, reflow, paused/offscreen state |
| Continuous or particle effects | Semantic fallback, resource budget, start/stop and cleanup | Multiple instances, reduced motion, hidden tab, unmount |
| Live audio, media and time | Permission or data source, honest status, latency and fallback | Denied permission, missing device, inactive tab, stale reading |

For each candidate, compare the same input and result at its real footprint. A static mockup can test geometry; it cannot select between a stiff drag and a responsive one. Build the smallest runnable behavior slice before investing in the outer presentation. When the user requests a close recreation, follow [replication](replication.md) and preserve observed behavior instead of substituting an original effect.

## Make the interaction dependable

- Give application state one owner. Derive visual state from the current input and latest committed value. A drag should track the pointer immediately; its decorative response may spring on release. Do not let an animation completion callback invent a successful operation or overwrite a newer input.
- For pointer gestures, map coordinates from the current element bounds, capture the active pointer when needed, and handle `pointerup`, `pointercancel`, lost capture and unmount. Declare the axis and `touch-action` intentionally so touch scrolling and the gesture do not fight. Recompute bounds on resize. Use a threshold only when it conveys a real commit decision.
- Keep semantic actions and their hit areas stable while the visual layer bends, tilts, stretches or emits particles. Offer an equivalent keyboard and touch route to the same result. For custom range, sort or menu controls, implement the appropriate role, value, focus and announcements; prefer a native control if it can express the interaction. Hover can preview, but cannot be the only route.
- Choose one animation owner per property. Use CSS for simple states; SVG for shaped paths and gauges; a spring or layout runtime for interruptible geometry; Canvas/WebGL for numerous pixels or a specific material response. The runtime is an implementation choice, not evidence of quality. Keep text and focus indicators outside blur, distortion and shader layers.
- Bound ongoing work. Pause loops when hidden or offscreen where relevant, respect live reduced-motion changes, cancel timers and frames on unmount, and keep the latest state visible if enhancement fails. Consider the cost of several instances in a list, not only one hero demo.
- For device or live-data effects, request access only from an explicit user action, show denied/unavailable states, release streams and subscriptions when finished, and distinguish a simulated demo from a real signal. Animated status must follow the source it claims to represent.

## Finish the component, not just the effect

Set the component in the intended product or a quiet neutral host with its actual width. Judge the object silhouette, control affordance, typography, icon geometry, contrast and surrounding whitespace at normal scale. If the interaction is the subject, avoid adding a title, slogan, accent gradient or card shell merely to make the preview look designed. If a material metaphor is used, its deformation should agree with the gesture and return to a crisp settled state. Related components may share tokens without sharing the same box, spring or decorative treatment.

Compare the first frame, an active intermediate frame and the settled or cancelled frame. Watch at normal speed, then inspect frames only to locate a visible defect. Test rapid repeated input, reversal mid-transition, pointer leave, keyboard, touch, narrow width, long content, live reduced motion and cleanup as applicable to the family. For a named visual benchmark, compare both rendered frames and behavior with the inspected reference at similar size; report which aspects were actually observed. Passing endpoint assertions and an attractive screenshot do not establish interaction quality.

For substantial choreography, continue with [seenry-motion's motion contract](../../seenry-motion/references/motion-contract.md) and [interaction anatomy](../../seenry-motion/references/interaction-anatomy.md). These are optional focused guides; the contract above is enough for a small component.
