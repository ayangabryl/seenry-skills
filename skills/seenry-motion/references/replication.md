# Reconstruct an observed transition

Replication matches an observed trajectory; creative motion proposes one. Choose explicitly. The standard recipes and semantic timing tokens are fallbacks for missing evidence, not authority to retime a supplied reference.

## Evidence and coordinates

Watch the actual clip at normal speed. Mark one opening and one closing interval and identify the trigger. Use [video study](video-study.md) for short, timestamped frame extraction. Keep source attribution, dimensions and actual decoded timestamps. Normal playback is still required after frame inspection. A video can duplicate frames; encoded FPS does not prove temporal resolution.

Measure in a fixed source coordinate system. Record host size, trigger position, shell rectangle and corner radius at rest; then displacement, bounds, opacity and content appearance at the start, roughly quarter/half/three-quarter progress and settlement. For a fast event, inspect the actual intermediate frames rather than assuming evenly spaced progress. Keep screen-space position and local geometry distinct: centered hosts can move the whole object during expansion.

A useful score has tracks:

| Track | What to record |
| --- | --- |
| Trigger | Input frame, hit area, stationary point or observed motion |
| Surface | Position, width/height, radius, outline/shadow, clipping and overshoot |
| Contents | First visible frame, opacity, individual offsets, stagger, clipping and baseline |
| Neighboring elements | Whether they remain fixed, move, compress or overlap |
| Return | Close trigger, trajectory and settlement, independently of opening |

Store measurements and estimates separately. A fitted curve is an approximation with residual error. Do not claim exact spring parameters from a compressed clip or interpolate missing captured frames as if they were observed.

## Hover is a separate transition

Inspect pointer entry, held hover, exit and reentry before settlement. Record the affected layer, delay, trajectory and return timing; distinguish hover from pressed, focus and persistent selected/open states. A pointer in a recording does not prove which event triggered a change. For a replica, preserve the observed color, shape, icon or position response instead of adding a default lift or bounce. If the clip never shows hover, mark it unobserved and label any necessary behavior as proposed. Keep hit areas stable, test movement from trigger to revealed content, and provide keyboard/touch access without requiring hover.

Follow the highlight boundary while the pointer crosses rows. A single traveling pill needs one persistent surface with measured position, size, radius and retargeting; independent row background switches do not reproduce it. Compare row-to-row travel and exit separately from menu opening. Do not mark hover unobserved merely because the opening was the only interval studied.

## Choose the mechanism from the evidence

- A panel appearing near a trigger is not necessarily a button-to-panel morph. Follow the **same boundary** through the clip. If it continuously changes shape, animate that surface or a shared background; do not leave a second trigger underneath unless observed.
- A rounded rectangle changing width/height needs geometry and radius control. Scaling the whole subtree also scales text and strokes; use a shell plus a separately positioned content layer when the source preserves glyph size.
- A shared highlight should move between measured targets instead of being recreated separately in each target. A dissolving label needs outgoing and incoming layers with one semantic current value.
- A carousel can rotate order, translate neighbors and replace content while changing size. Match those tracks separately; an expanding flex item alone is insufficient. Inspect departing text, full-card imagery, incoming masks and connected boundaries before choosing a mechanism.
- A soft fluid join may require SVG filtering, masking or multiple overlapping surfaces. First prove its silhouette and clipping at native size. Blur alone on a rectangular menu does not establish that effect. Render-filter bounds must include overshoot without bleeding onto unrelated text.
- Scroll-driven movement follows progress, not elapsed time. Preserve the source's holds and overlap. Never synthesize scroll hijacking from a video that merely depicts scrolling.

Use ordinary CSS or Web Animations when they reproduce the score. Adopt a spring or rendering library only when it supports the observed behavior. One owner per animated property. Maintain current visual state when reversing; do not restart from a hardcoded first frame or allow a stale close timer to hide a reopened panel.

## Compare temporal evidence

Compare at the same viewport and trigger-relative time, not arbitrary screenshots of both animations. First align their settled geometry and input frame. Inspect both at normal speed; then compare the shape, anchor, content and neighboring geometry at corresponding checkpoints. Record time uncertainty at least as large as the source's observed cadence. If only a poster is accessible, the motion result remains unverified.

Run a second input before settlement, alternate opening and closing, resize the host and change reduced-motion preference while active. Preserve final information, immediate keyboard focus and usable pointer targets. These unseen-source behaviors are implementation requirements, not claims about how the source behaves.

Do not score fidelity by counting effects or copying duration tokens. A simple accurately reproduced transition is more faithful than a more elaborate but different one. Report unresolved mismatches by track and state.
