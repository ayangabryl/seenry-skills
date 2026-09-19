# Motion: specify a change people can follow

Use when a state jumps, continuity is lost, feedback feels delayed, or a narrative needs movement. Inspect the existing motion language before adding a library.

## Execute

Write a self-contained motion contract: trigger; starting and ending states; stationary anchor; changing properties; exact implementation timing; interruption and reversal; reduced-motion behavior; and a visible non-motion cue. The executor should not need an earlier conversation to reconstruct these choices.

Choose timing by distance, frequency and consequence. Test at normal speed first. Frequent input needs immediate feedback; a rare explanatory sequence can take longer when it remains skippable. Example durations are starting values, not universal laws. Transition only properties that need to change. Prefer simple CSS for simple state interpolation; prove more complex machinery on the decisive slice before depending on it.

Maintain position and focus through expansion. Repeated activation should retarget from the current visual state rather than queue stale animations. If an effect needs layout measurement, read before writing and handle resize or changing content. Reduced motion must retain all information and usable controls.

## Working example

[Motion study](../../assets/craft/motion.html) expands an appointment detail region from a stable header. Its CSS grid transition can reverse mid-flight; the collapsed region becomes inert. The explicit reduced-motion switch and operating-system preference remove interpolation. A visible label and expanded state remain.

## Counterexample

A cinematic entrance may support a rare launch story but obstruct a scheduling tool used repeatedly. Morphing an icon without showing the changed state afterward removes useful evidence.

## Verify

Observe normal playback, rapid reversal, keyboard activation, dynamic text, narrow width and reduced motion. Use slow playback or frame inspection only to diagnose a defect already observed. Check that collapse does not strand focus in hidden content. Record what was actually exercised; source review alone cannot establish smoothness or frame performance.
