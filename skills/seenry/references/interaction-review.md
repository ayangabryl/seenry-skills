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

## Evidence before a completion claim

- Main task and values are correct; recovery retains valid work.
- Relevant desktop/narrow views have legible wrapping, crops and grouping.
- Keyboard focus is visible and follows the task; touch targets remain reachable.
- Motion is inspected at normal speed, including repeated input, interruption and reduced motion.
- Test zoom/reflow and [text-spacing overrides](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing). Those values are tolerance tests, not mandatory default typography.
- Essential media, fonts and ordinary actions remain usable during loading/failure.

Separate deterministic assertions, visual observations, heuristic interpretation and user acceptance. Name unsupported environments and incomplete checks. Rendering a screenshot is not production-readiness evidence.
