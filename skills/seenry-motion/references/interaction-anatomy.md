# Inspect the anatomy of a transition

Use for a named motion benchmark, a rejected implementation, or a central interactive demonstration. Select the applicable mechanism from [patterns](patterns.md). Do not substitute a generic spring for an observed trajectory.

Record a compact score: initiating input; fixed anchor; changing silhouette; content timing; peak displacement; settled geometry; reversal. Inspect normal speed and one intermediate state. A bounding-box change can be smooth while the text visibly stretches or the control drifts. Measure these separately. Keep source timing marked unknown until playback establishes it.

## Values: distinguish three different effects

- **Roll:** persistent decimal places rotate through digit tracks. Keep ones/tens identity across 99→100; the unit does not ride on the digits. Use the packaged number renderer, not keyed whole-number entrances.
- **Pop-in:** a replacement appears through individually clipped place-value slots with a short, bounded stagger. This is not a reel. Reverse direction intentionally when appropriate; limit total stagger so a long value does not become a waiting sequence.
- **Direct update:** a dragged value follows input immediately. An ornamental queue must not lag behind the actual value.

Choose the type after inspecting the requested reference. Engine choice is not fidelity evidence. In React, create an imperative renderer once, update on value changes and destroy on unmount. Preserve a usable initial text node and reserve width in the real font. Test carry, borrow, signs, precision, rapid reversal and the unit's screen coordinates. See [number transitions](number-transitions.md).

## Repeated events: bound both state and presentation

A three-item data limit does not limit outgoing presence-animation nodes. Rapid additions can retain many departing items. Use absolute layers inside a reserved stage for overlay stacks; keep the trigger in a separate fixed region. Choose a bounded exit policy: one replaceable departing layer, or cancel the oldest exit when a documented budget is reached. Do not let outgoing items take part in normal-flow layout. Persistent IDs must never be recycled after dismissing all messages.

On overflow, remove the oldest item from the active collection synchronously and then start its visual exit. A capacity `while` loop whose `dismiss` waits for `animationend` to shrink that same collection never terminates on the fourth addition. The [notification state reducer](../assets/notification-state.mjs) separates active and leaving items; if using local DOM state, maintain the same invariant and cancel a superseded exit. Probe the fourth addition before considering a three-item stack complete.

Animate remaining items from their current positions. Update accessible status once per real event; hide decorative exit copies. If a dismissed item owns focus, return focus to a stable appropriate control. Keep actual long-message content readable; fixed-height teaching examples are not a general toast sizing policy.

Replay 20 additions, alternating add/remove and removing a middle item. Compare the trigger and stage coordinates relative to the document, not viewport coordinates after auto-scroll. Check both peak and settled node counts. A screenshot after everything settles cannot reveal a rapid-input failure.

## Hover: name the product purpose

A demo called “hover” says nothing about what it enables. Prefer collection preview, action discovery, tooltip explanation or image inspection. Keep the hit area stationary while the visual moves; specify what happens between adjacent targets, on pointer leave and on focus transfer. Touch needs an explicit way to reveal and choose. Decorative lift alone is not proof of useful interaction. In a fan, each card keeps its identity and selection, and the reading order must remain usable when overlapping.

## Evidence gate

Maintain three separate statuses: guidance available; implementation exercised; inspected reference match. Do not upgrade one based on another. A useful original adaptation can pass its own task without being a replica. An unavailable third-party implementation is a research gap, not permission to claim that it is bundled.

## Reusable primitives

[Notification state](../assets/notification-state.mjs) exports `createNotificationState(limit)` and pure `notificationEvent(state,event)`. Events are `add` (with content), `dismiss` (id), `exit-finished` (id) and `clear`. It bounds live items and one replaceable exit; stale exit completion cannot remove a newer layer. IDs remain monotonic after clearing. It does not run timers, claim network success or impose presentation. Render each active item by its ID and the departing item in a separate absolute layer. Keep content, announcement, focus recovery and measured variable heights in the application.

[Interaction framing](../assets/fit-interaction.mjs) fits a set of source-space rectangles into an actual host. Supply all reachable menu/panel bounds, including intended shadow/focus padding. It returns scale and translation; apply them to a single source coordinate plane. Recompute on host resize. The math establishes containment, not legibility: if resulting controls are too small, enlarge the stage, use a responsive implementation or offer a full-size view. Test both opposite opening directions, not just the first state.
