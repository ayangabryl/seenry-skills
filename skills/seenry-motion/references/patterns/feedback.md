# Feedback tied to a real state

Use for notification badges, success checks, error shakes, toast/banners, toggles, checkboxes and like controls. Semantic state owns the animation, not the animation's completion callback.

**Success and error.** Commit success only after the operation succeeds. A check can draw its path or replace a spinner in a reserved slot; keep focus and label geometry stable. An error shake should affect the relevant control or message, not the whole page. Pair it with persistent readable explanation and recovery. Preserve input. In reduced motion, present the final error/success immediately.

**Toggle, checkbox, like.** Update the actual checked state on input. Animate the thumb or check inside a stable hit area. Use the element's native semantics. For a network-backed optimistic action, define rollback and visible failure. A heart burst must not imply a save that failed. Rapid toggles start from the current visual position and settle at the latest state.

**Badge.** Position count changes relative to a fixed anchor, preserving the adjacent label width. Distinguish unread count, status and decoration; do not animate an idle badge forever. Large numbers need truncation or a wider measured badge without collision.

**Toast and banner stacking.** Give every notification a persistent identity. Animate the entering/removing item and measured movement of neighbors, not a rebuilt list. Pause auto-dismiss while hovered/focused; actionable or important failure messages need enough time or persistence. A banner in document flow moves content deliberately; an overlay does not. Live regions announce new information once. A toast should not steal focus from the task.

**Counterexample:** beginning a success check on click before clipboard/network success, then hiding the error behind it.

**Check:** operation failure, two rapid operations, undo, same-message repeat, keyboard focus during dismissal, long localized text, removal while another item enters. Capture the full state sequence; a working click animation is not proof that the operation worked.

Working glyph transition: [icon swap](../../assets/icon-swap.mjs). Caller still owns state, labels, operation results and live announcements.
