# Motion: specify a change people can follow

Use when a state jumps, continuity is lost, feedback feels delayed, or a narrative needs movement. Inspect the existing motion language before adding a library.

## Execute

Write a self-contained motion contract: trigger; starting and ending states; stationary anchor; changing properties; exact implementation timing; interruption and reversal; reduced-motion behavior; and a visible non-motion cue. The executor should not need an earlier conversation to reconstruct these choices.

Choose timing by distance, frequency and consequence. Test at normal speed first. Frequent input needs immediate feedback; a rare explanatory sequence can take longer when it remains skippable. Example durations are starting values, not universal laws. Transition only properties that need to change. Prefer simple CSS for simple state interpolation; prove more complex machinery on the decisive slice before depending on it.

Choose a concrete local implementation before inventing another one: `motion_helpers: ["geometry"]` supplies interruptible disclosure, `"icon-swap"` supplies anchored two-state glyphs, and `"number"` supplies changing numeric values. The focused packet includes selected source and runtime dependencies. Copy those files with licenses, then exercise them in the product. For menus and contextual controls use the [product transition recipes](../../../seenry-motion/references/product-transitions.md). Effects do not repair detached controls or unclear copy.

Maintain position and focus through expansion. Repeated activation should retarget from the current visual state rather than queue stale animations. If an effect needs layout measurement, read before writing and handle resize or changing content. Reduced motion must retain all information and usable controls.

Keep the DOM identity of unchanged rows and triggers. Update a changed value in place; replacing an entire list can replay every entrance animation and lose focus even when the settled screenshot matches. Animate only genuinely entering content. Test a second change while the first transition is running. A menu can fade while its trigger, surrounding names and reading baseline remain stationary.

Measure in the real host. A vertically centered preview recenters the whole card when its height grows, even if internal anchors are correct. For an expanding utility, keep a stable top/trigger anchor in the host; do not conceal movement by measuring only relative coordinates. Centering can suit a fixed-size object.

## Keep utility controls steady

For repeated choices such as time slots, start with a stationary hover treatment: background, foreground or boundary change. A lift and growing shadow imply elevation; use them only when that physical relationship serves the object. Do not apply a global translate-on-hover recipe to every button or card. Gate pointer hover with `(hover: hover) and (pointer: fine)`.

A practical starting study is 120–160ms feedback on the exact changing properties and roughly 160–240ms for an occasional panel transition. Compare against an immediate change; choose by observed continuity and frequency, not by the adjective “premium.” Preserve the clicked target and reading anchor. Keyboard focus must remain explicit without waiting for animation.

Inspect selection → review → cancel and selection → confirm at normal speed. Capture the intermediate change as well as its endpoint. A smooth entry with a jumping exit or a newly oversized success state is unfinished. Reduced-motion behavior must preserve the final information and focus recovery.

## Working example

[Motion study](../../assets/craft/motion.html) expands an appointment detail region from a stable header. Its CSS grid transition can reverse mid-flight; the collapsed region becomes inert. The explicit reduced-motion switch and operating-system preference remove interpolation. A visible label and expanded state remain.

## Counterexample

A cinematic entrance may support a rare launch story but obstruct a scheduling tool used repeatedly. Morphing an icon without showing the changed state afterward removes useful evidence.

## Verify

Observe normal playback, rapid reversal, keyboard activation, dynamic text, narrow width and reduced motion. Use slow playback or frame inspection only to diagnose a defect already observed. Check that collapse does not strand focus in hidden content. Record what was actually exercised; source review alone cannot establish smoothness or frame performance.

For disclosure, measure the trigger and chosen shell anchor before, during and after expansion. Added compact metadata must not move the trigger to a different grid column. A smooth height transition can still conceal an abrupt control jump; avoid changing padding at the same time without a clear reason. See the measured [media disclosure case](../studies/media-controls-and-containment.md).
