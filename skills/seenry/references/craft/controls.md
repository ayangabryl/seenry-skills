# Controls: emphasis follows the action

Use for unclear actions, heavy containment, unstable states or inconsistent icons. Preserve the existing system unless redesign is requested.

## Execute

Classify the action: primary commitment, ordinary alternative, disclosure or familiar media operation. Choose label, fill and boundary to explain that role. A filled button may clarify commitment; an unboxed icon may suit a familiar secondary action. Neither is inherently more refined. Preserve visible labels for unfamiliar or consequential operations.

Use an established icon library or actual brand asset. Inspect optical weight and filled versus outline variants in context; neither variant is universally correct. Keep the interaction target large enough without necessarily enlarging the visible glyph. Give icon-only controls an accessible name and visible keyboard focus. Check asymmetric shapes optically before applying arbitrary nudges.

Keep related label and icon together. Reserve the necessary state footprint so loading or confirmation does not move neighboring controls. Static text, programmatic state and focus should remain truthful while any icon animates. Disable only when the operation truly cannot be repeated; provide a recovery path for failure.

For nested uniform rounded surfaces, use outer radius minus total inset (including intervening border and padding) as a geometric starting point, clamped at zero. Inspect actual corner gaps; arbitrary unequal corner radii need an explicit shape concept. Independent buttons need not inherit that equation. Borders can explain structure, shadows elevation; either can become redundant if grouping already does the work.

## Prevent action-row failures

Give every control icon explicit inline and block dimensions plus `flex: none`; a `viewBox` does not constrain its rendered size. Around 1em–1.25em is a useful starting glyph size beside text, separate from the hit target. Size the actual element: a rule for `svg` does not size an SVG loaded through `img`. Use a shared glyph class on both. Exercise the missing-avatar and missing-image fallback, not just seeded assets.

Let the label keep its readable width. Keep a short commitment label on one line when it fits; if an action row cannot accommodate it, stack the actions or give the primary action the row. Do not fix overflow by clipping meaningful copy, shrinking the font or allowing a two-word action to become a tall narrow column. Check actual confirmation and error labels, not only the first button.

For routine confirmation, show the changed object and consequence together, then the next useful action. A success heading, success badge, completed stepper, status field and confirmation card often repeat one fact. Retain each only if it helps the person understand a different part of the result.

Read-only facts should not borrow the full border, fill and padding of nearby editable controls unless that distinction remains clear. Model independent actions independently: copying a restricted resource's URL does not grant access. Changing access should not remove an otherwise valid copy action or move its trigger. Reserve secondary controls only where useful; purposeful expansion is preferable to a permanent empty slot.

For a short set of changing labels, compare their actual rendered widths and give that control a consistent footprint. An auto-sized permission label should not steal space from the adjacent identity column on each change. Do not reserve the width of arbitrary long descriptions; reflow those deliberately.

Keep a dependent setting next to the thing it modifies. A permission dropdown revealed alone below unrelated actions loses its context. Group through proximity, alignment and semantics first; a layout wrapper does not need a visible border or fill. Inspect every disclosure state: a group enclosing just one already outlined control may add no information. Add a shared boundary only when it distinguishes a useful compound operation. Reflow dependent controls together and preserve useful anchors without imposing a detached second row just to pass a geometry check.

Give each setting one visible name; its control expresses the value. Supporting text explains consequences or recovery. Keep a separate summary only when the editor is elsewhere or explicit review is needed. Preserve accessible labels and descriptions.

## Focus is a designed state

An animated disclosure can clip a descendant's focus ring or popup. Check the visible pixels and hit targets, not just DOM visibility: an offscreen menu may still report a nonzero rectangle. Give settled open content a deliberate overflow strategy, or render its popup outside the clipping ancestor. Keep collapsed content inert.

For composed inputs, assign focus to one perceived field boundary, not a second box around only its text area. Verify the final cascade after global focus rules; independent clear/close actions still need their own keyboard indicator.

Native focus is not a defect. Replace it only with a visible, coherent treatment. Use `:focus-visible` for buttons; text inputs may legitimately match it after a pointer click. Do not remove focus after typing or successful submission to hide its appearance. Avoid stacking an offset halo, error shadow and field border. Use one immediate indicator, preserve its footprint, and distinguish error text from focus. Do not animate focus visibility or rely on a barely changed background for menu keyboard focus. See [focus and keyboard continuity](../focus-and-keyboard.md) for the local recipe, forced-colors behavior and checks.

## Working example

[Control study](../../assets/craft/controls.html) saves a local bookmark with stable button geometry and a reversible state. It uses explicit text, making the example independent of any network icon library.

## Counterexample

An unboxed unlabeled unfamiliar action may look quiet but become undiscoverable. Giving every secondary action a strong filled container competes with the real decision.

## Verify

Exercise hover, keyboard focus, press, repeated activation, saved state and undo. Confirm focus stays on the trigger and success is announced once. For assistive-only announcements, verify the hiding CSS actually works without removing the live region from the accessibility tree; a class name alone does not implement it. Check longest labels and narrow fit. For production icons, verify actual assets, optical weight and hit geometry rather than substituting decorative Unicode symbols.

With Playwright available, call `require("<skill-root>/scripts/control_geometry.cjs").inspect(page)` after entering each consequential state. It records computed type and flags multiline action text or oversized glyphs for review. It does not decide aesthetic quality; intentional large icon-only controls may be flagged.

For compact media controls or unstable disclosure, use the scoped [media and containment study](../studies/media-controls-and-containment.md). It distinguishes familiar track/volume icons from ambiguous symbols and checks the trigger rectangle through expansion.

For a scaled or clipped interactive embed, frame the union of every reachable open state, not just its trigger or first menu. Menus can open in opposite directions. Measure transformed bounds against the host at desktop and mobile sizes, then open each branch with pointer and keyboard. Provide a full-size view when fitting the whole interaction makes its controls too small. A focus rule in guidance is not evidence that the final CSS cascade implements it; inspect the focused pixels in the delivered product.

For implementation across related controls and content, use [interface implementation](../interface-implementation.md).

## Optical alignment in implementation

Inspect the actual glyph at its final size, not just its SVG box. A play triangle may need a small inline shift toward its point; a lopsided icon/label pair may need asymmetric inner padding. Keep the button bounds and hit target fixed. Tune stroke to the adjacent type's optical weight while preserving the icon family's construction. Check the correction on light/dark surfaces, selected/disabled states and supported RTL direction. Do not mirror physical symbols or brand marks indiscriminately.

Use the optical correction only after inspecting the icon in the actual control and state; the local example above is a starting point, not a universal offset.
