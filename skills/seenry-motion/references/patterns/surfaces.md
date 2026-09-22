# Surfaces that change shape or reveal content

Use for anchored menus, expanding cards, accordions, dialogs, side panels and fluid action groups. For a replica, the [measured score](../replication.md) overrides proposed timings and shape choices.

**Choose the boundary first.** An accordion changes document flow. A popover is anchored outside it. A dialog changes interaction scope. A card-to-panel morph preserves one visual object across states. These are different mechanisms even if each reveals text.

For a disclosure, keep one intrinsic content wrapper; use [geometry helpers](../adapters.md) to measure its height and retarget while content resizes. Keep the controlling row stationary. Move focus out before making closing descendants inert. Reopening must cancel the old completion.

For an anchored menu, compute its placement from the trigger and available viewport space. Position first, animate second. Keep text at its final size while a separate shell changes bounds, clipping or opacity. Use the attachment edge as origin only when that relationship is observed. Opening focus and Escape must work during animation. Do not animate a portaled menu in one coordinate system using measurements from another.

A fluid menu needs a continuous silhouette during separation and reunion. Prove that silhouette using a shell path, mask or filtered overlapping shapes. Keep labels and focus outside the filter. Record the neck, separation time, overshoot and settled gap. A blurred rectangular panel and a simultaneous button scale do not reproduce a liquid join. The closed trigger can remain stationary while a second mass emerges from it, if the source shows that.

Dialogs need an inert background, focus containment, initial focus and return focus. Side panels need an explicit modal or nonmodal policy. Neither should scale the underlying page as decoration unless the source demonstrates that relationship. For a card resize, measure both rectangles and map a shell; independently crossfade/reposition text to avoid distorted glyphs.

**Counterexample:** converting a compact dropdown into a full-screen spring modal because both contain actions.

**Check:** endpoints, attachment coordinate and at least two intermediate bounds; immediate reversal; opening near an edge; focus before settlement; live reduced motion; no stale exit callback. A settled endpoint passing does not prove the trajectory matches.

Working geometry source: [disclosure helper](../../assets/geometry-transition.mjs). It handles height, not fluid silhouettes, dialog semantics or arbitrary rectangle morphs. Implement those layers explicitly rather than claiming the helper supplies them.
