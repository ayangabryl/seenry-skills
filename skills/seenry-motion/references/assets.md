# Runnable assets

The bundled, tested starting points, by the change you are asked for. Select only the guide and helper this change needs.

| Requested change | Focused route |
| --- | --- |
| Action menu or short status label | Original [action menu](../assets/action-menu/README.md), [status switch](../assets/status-switch/README.md) and [product transitions](product-transitions.md). If the menu is asked to animate open and closed, preserve its surface through the closing phase; conditional unmount on close skips that phase. For a status transition, move the text in a reserved slot; a plain text replacement or dot-color change alone is incomplete. The application owns the real action. |
| In-flow disclosure or changing geometry | Original [expanding card](../assets/expanding-card/README.md), [geometry helper](adapters.md) and [surface patterns](patterns/surfaces.md). Preserve focus and retarget from current geometry. |
| Focused modal task | Original [modal surface](../assets/modal-surface/README.md) and [surface patterns](patterns/surfaces.md). Use a native dialog for top-layer and focus behavior; allow the exit to finish before closing, and make reversal cancel the pending close. |
| Changing number or icon | [Number transitions](number-transitions.md) and [adapters](adapters.md). For a small integer count, prefer the original count-pop helper over rebuilding digit semantics. Keep one real accessible value; do not hide every digit and put `aria-label` on a plain `<strong>`. A digit transition needs per-place motion; keep units anchored. |
| Live voice input or output | Original [voice presence](../assets/voice-presence/README.md) accepts application-owned state and a normalized audio level. Keep controls and announcements in the DOM; a generated demo signal is not microphone activity. |
| Loading or process presence | Original [signal field](../assets/signal-field/README.md), [boundary trace](../assets/boundary-trace/README.md) and [loading patterns](patterns/loading.md). Animation time is not progress. |
| Decoded image or expressive material | Original [image reveal](../assets/image-reveal/README.md), [reflective solid and rim surfaces](../assets/reflective-surface/README.md), [pointer tilt](../assets/pointer-tilt/README.md), [surface effects](surface-effects.md) and [expressive effects](expressive-effects.md). Keep useful content while a replacement loads; use reflection and tilt only where the material has a purpose. |
| Drag, flick, swipe, sheets, carousels, springs with velocity, translucent chrome | [Fluid interaction](fluid.md) |
| Designing any new interactive component (brief, state graph, motion score, input contract, checklist) | [Interaction craft](interaction-craft.md) |
| Toast or banner stack | [Feedback patterns](patterns/feedback.md) and original [notification reducer](../assets/notification-state.mjs). Remove overflow from active state before its exit; test the fourth event in a three-item stack. |
| Occasional completed milestone | Original [confirmation burst](../assets/confirmation-burst/README.md). Record success in application state first, then play the finite decoration; the settled result must remain visible after it clears. |
| Selected tabs or ordered page change | Original [selection surface](../assets/selection-surface-demo.html) for a shared highlight and [directional stage](../assets/directional-stage/README.md) for related views; the application owns selection, panels, route and history. Use [navigation patterns](patterns/navigation.md) for other structures. |
| Scroll or a coordinated system | [Scroll choreography](scroll-choreography.md), [worked scores](worked-scores.md), [system choreography](system-choreography.md) and the [motion index](patterns.md). |

Select only the guide and helper needed for this change. The bundled original assets are reusable starting points, not automatic substitutes for a named source component or proof of fidelity to it. Keep licenses with any copied third-party runtime; the original Seenry assets use the repository's Apache-2.0 license.
