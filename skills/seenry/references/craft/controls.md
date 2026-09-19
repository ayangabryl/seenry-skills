# Controls: emphasis follows the action

Use for unclear actions, heavy containment, unstable button states or inconsistent icons. Keep the existing control system unless redesign is requested.

## Execute

Classify the action: primary commitment, ordinary alternative, disclosure or familiar media operation. Choose label, fill and boundary to explain that role. A filled button may clarify commitment; an unboxed icon may suit a familiar secondary action. Neither is inherently more refined. Preserve visible labels for unfamiliar or consequential operations.

Use an established icon library or actual brand asset. Inspect optical weight and filled versus outline variants in context; neither variant is universally correct. Keep the interaction target large enough without necessarily enlarging the visible glyph. Give icon-only controls an accessible name and visible keyboard focus. Check asymmetric shapes optically before applying arbitrary nudges.

Keep related label and icon together. Reserve the necessary state footprint so loading or confirmation does not move neighboring controls. Static text, programmatic state and focus should remain truthful while any icon animates. Disable only when the operation truly cannot be repeated; provide a recovery path for failure.

For nested uniform rounded surfaces, use outer radius minus inset as a geometric starting point. Independent buttons need not inherit that equation. Borders can explain structure, shadows elevation; either can become redundant if grouping already does the work.

## Working example

[Control study](../../assets/craft/controls.html) saves a local bookmark with stable button geometry and a reversible state. It uses explicit text, making the example independent of any network icon library.

## Counterexample

An unboxed unlabeled unfamiliar action may look quiet but become undiscoverable. Giving every secondary action a strong filled container competes with the real decision.

## Verify

Exercise hover, keyboard focus, press, repeated activation, saved state and undo. Confirm focus stays on the trigger and success is announced once. Check longest labels and narrow fit. For production icons, verify actual assets, optical weight and hit geometry rather than substituting decorative Unicode symbols.
