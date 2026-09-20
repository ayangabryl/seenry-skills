# Controls: emphasis follows the action

Use for unclear actions, heavy containment, unstable button states or inconsistent icons. Keep the existing control system unless redesign is requested.

## Execute

Classify the action: primary commitment, ordinary alternative, disclosure or familiar media operation. Choose label, fill and boundary to explain that role. A filled button may clarify commitment; an unboxed icon may suit a familiar secondary action. Neither is inherently more refined. Preserve visible labels for unfamiliar or consequential operations.

Use an established icon library or actual brand asset. Inspect optical weight and filled versus outline variants in context; neither variant is universally correct. Keep the interaction target large enough without necessarily enlarging the visible glyph. Give icon-only controls an accessible name and visible keyboard focus. Check asymmetric shapes optically before applying arbitrary nudges.

Keep related label and icon together. Reserve the necessary state footprint so loading or confirmation does not move neighboring controls. Static text, programmatic state and focus should remain truthful while any icon animates. Disable only when the operation truly cannot be repeated; provide a recovery path for failure.

For nested uniform rounded surfaces, use outer radius minus total inset (including intervening border and padding) as a geometric starting point, clamped at zero. Inspect actual corner gaps; arbitrary unequal corner radii need an explicit shape concept. Independent buttons need not inherit that equation. Borders can explain structure, shadows elevation; either can become redundant if grouping already does the work.

## Prevent action-row failures

Give every control icon explicit inline and block dimensions plus `flex: none`; a `viewBox` does not constrain its rendered size. Around 1em–1.25em is a useful starting glyph size beside text, separate from the hit target. Apply this to every state asset, not just the initial arrow.

Let the label keep its readable width. Keep a short commitment label on one line when it fits; if an action row cannot accommodate it, stack the actions or give the primary action the row. Do not fix overflow by clipping meaningful copy, shrinking the font or allowing a two-word action to become a tall narrow column. Check actual confirmation and error labels, not only the first button.

For routine confirmation, show the changed object and consequence together, then the next useful action. A success heading, success badge, completed stepper, status field and confirmation card often repeat one fact. Retain each only if it helps the person understand a different part of the result.

## Working example

[Control study](../../assets/craft/controls.html) saves a local bookmark with stable button geometry and a reversible state. It uses explicit text, making the example independent of any network icon library.

## Counterexample

An unboxed unlabeled unfamiliar action may look quiet but become undiscoverable. Giving every secondary action a strong filled container competes with the real decision.

## Verify

Exercise hover, keyboard focus, press, repeated activation, saved state and undo. Confirm focus stays on the trigger and success is announced once. For assistive-only announcements, verify the hiding CSS actually works without removing the live region from the accessibility tree; a class name alone does not implement it. Check longest labels and narrow fit. For production icons, verify actual assets, optical weight and hit geometry rather than substituting decorative Unicode symbols.

With Playwright available, call `require("<skill-root>/scripts/control_geometry.cjs").inspect(page)` after entering each consequential state. It records computed type and flags multiline action text or oversized glyphs for review. It does not decide aesthetic quality; intentional large icon-only controls may be flagged.

For compact media controls or unstable disclosure, use the scoped [media and containment study](../studies/media-controls-and-containment.md). It distinguishes familiar track/volume icons from ambiguous symbols and checks the trigger rectangle through expansion.
