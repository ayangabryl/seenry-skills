# Continuity between destinations

Use for selected tabs, tooltips, directional hints and page/panel swaps. Choose what retains identity through the change.

**Shared selection.** Render one decorative highlight behind stable semantic buttons. Measure its old and new target bounds inside the same relative container. Animate translation and width, not the text. Retarget from its current rendered bounds on rapid input. Re-measure after fonts load and on resize. Keyboard roving focus and activation policy belong to the tab control; the decorative highlight is aria-hidden. Do not clone a new highlight under every tab and call a fade a shared slide.

**Page change.** Keep a stationary navigation landmark. Outgoing and incoming views can overlap in one clipped stage, but only the current view may be interactive. A horizontal movement must agree with the relationship or history being communicated. Reset or preserve scroll deliberately. Native back, browser history, deep links and reduced-motion instant navigation still work. Avoid animating an entire long page through hundreds of pixels merely to imply polish.

**Tooltip.** Keep it associated with its trigger and accessible on keyboard focus. Hover intent can prevent accidental flashes. Escape dismisses it; information needed to complete the task must not live only in a tooltip. Exit should not create an invisible pointer barrier. Delay and offset are separate from the entrance duration.

**Directional link hint.** Keep the label and click target stationary while a decorative arrow translates inside a reserved slot. Hover exit reverses from the current frame. An arrow that changes text width causes avoidable layout movement.

**Counterexample:** tab text slides with its active background, making each selection appear to relayout the navigation.

**Check:** rapid left/right switching; unequal labels; font-loading width change; target near the viewport edge; back/forward; touch without hover. Compare anchor, direction and phase, not only the destination.

Use ordinary CSS transforms for a fixed slot. For measured shell changes, see [surface guidance](surfaces.md). For scroll-linked navigation read [scroll choreography](../scroll-choreography.md); elapsed-time transitions cannot substitute for scroll progress.

For a bundled moving selection or anchored shell implementation, read [system choreography](../system-choreography.md). Preserve host keyboard and state ownership.
