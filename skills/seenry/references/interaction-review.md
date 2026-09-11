# Review the complete interaction

Choose checks for the task and record what was exercised. Source inspection is not interaction evidence. Pointer recording does not verify touch or keyboard; browser mobile emulation is not physical-device testing.

## Stable layout and overlays

Keep layout stable when scrollbars appear or a modal locks the document, but select the **scroll owner** first. Do not apply `scrollbar-gutter: stable both-edges` to every nested container or short dialog. With classic scrollbars it reserves space even when no bar is drawn; overlay scrollbars behave differently.

For growing documents, a correctly painted root gutter can be appropriate. For an immersive canvas or backdrop where a permanent strip is distracting, use the stack's established modal scroll lock, or compensate only for the **measured** scrollbar width during locking. Measure before hiding overflow, include existing padding, restore styles and scroll position, and handle nested overlays without double compensation. Do not hardcode 15px or hide scrollbars globally. Test no-overflow, classic and overlay configurations where available; zero-width evidence does not prove the nonzero case. See [MDN scrollbar-gutter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-gutter).

Size dialogs around the task. Use one deliberate content inset and readable title; do not inherit hero display sizes or section margins. Group title, field labels, controls, help/error text and action. Allow focus indicators without doubling the field border. Constrain to the viewport, preserve scrolling for long content and consider the mobile keyboard. Capture initial focus, longest/error content, short-height and narrow states. Follow the [WAI modal pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) for focus containment, Escape and return to an appropriate opener.

## Navigation and buttons

Choose mobile hierarchy deliberately. A desktop logo + links + long CTA does not automatically fit one mobile row. For a simple content site, logo left and menu right with secondary actions inside navigation can work. Other products need a persistent primary action; compare the actual widths and priorities. Ordinary navigation uses links/buttons, not application menu roles by default. A modal panel needs modal semantics and focus handling; inline disclosure behaves differently.

Exercise menu → destination → dismissal. Opening a form from navigation must not accidentally leave two active modals or return focus to a removed item. Verify state labels, Escape, outside dismissal where supported, and returning to the document after viewport changes.

Check press, pending, success and failure. A success icon follows real completion, not a click or elapsed animation. Keep hit regions and value anchors stable. Repeated input should retarget or interrupt; old asynchronous results must not overwrite newer state. Preserve valid input and offer useful recovery. Test unavailable clipboard, download, network or assets when used.

## Before spending the finishing budget

Exercise each decisive control independently on the retained wireframe, using a known initial state and a concrete expected result. Check what changed and what must remain unchanged. A working people-count field says nothing about subtotal routing; a clickable export button says nothing about its output format. Preserve the action/result observations with the source hash and correct a failed state before typography/surface expansion. Use the optional [interaction probe](execution.md#exercise-the-decisive-controls-before-finishing) or the native project test runner. Final verification still covers edge cases, recovery and motion.

## Evidence before a completion claim

- Main task and values are correct; recovery retains valid work.
- Relevant desktop/narrow views have legible wrapping, crops and grouping.
- Keyboard focus is visible and follows the task; touch targets remain reachable.
- Motion is inspected at normal speed, including repeated input, interruption and reduced motion.
- Test zoom/reflow and [text-spacing overrides](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing). Those values are tolerance tests, not mandatory default typography.
- Essential media, fonts and ordinary actions remain usable during loading/failure.

Separate deterministic assertions, visual observations, heuristic interpretation and user acceptance. Name unsupported environments and incomplete checks. Rendering a screenshot is not production-readiness evidence.

Trace an important transition from the actual input to its settled result. Record what changes (geometry, icon path, color, opacity or text), what stays anchored, and what a second input does mid-flight. A CSS declaration does not prove it executes; an endpoint screenshot cannot establish the transition. Conversely, unchanged transforms do not prove absent motion when the treatment changes color. Use the browser adapter's transition sampler for selected properties, then inspect normal-speed playback. Treat a quiet functional state change as a design choice to evaluate against the task, not an automatic instruction to add animation.

When the selected motion contract makes a measurable promise, carry its observed check separately from the model's overall judgment. For example, a stable action target can still shrink when its success label becomes shorter even though an icon morph runs correctly. The optional [transition contract check](execution.md) reports such geometry changes against explicitly chosen properties/tolerances; it does not decide which movements are desirable. Resolve a demonstrated mismatch or revise the intended contract with a reason before calling that behavior complete.
## Verify the behavior promised by a control's role

A painted group of buttons with `role="radio"` still needs the radio group's keyboard behavior. In an ordinary group, arrow keys move selection/focus, Space selects, and Tab enters/leaves the group. Toolbar radio groups have different arrow behavior; use the appropriate [W3C pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/). Native radio inputs can retain that behavior under a custom visual treatment, or use the project's established headless control. Do not hide focusable native inputs with `display:none` and assume the behavior survives.

The fresh exporter looked like segmented choices but implemented only click handlers; its arrow-key checks failed at both widths. Check the chosen interaction with actual input, rather than inferring correctness from ARIA attributes, the presence of event handlers or a working mouse click.

Describe only the completion the application can observe. Dispatching a browser download establishes a handoff, not that the person saved the file to disk. “Download started” can acknowledge that result without an invented delay. Preserve settings and offer recovery when preparation fails; asynchronous changes must not overwrite a newer selection with stale state.
