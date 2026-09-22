# Pointer, physical and material effects

Use selectively for avatar hover, card fan/tilt, image tilt/open, drag physics, dissolves, particles, fluid action groups and gradient materials. These effects do not establish fidelity or product quality by themselves.

**Pointer response.** Normalize pointer coordinates within the target bounds. Keep tilt on a decorative layer, not the hit target or text reading plane. Clamp rotation, preserve a stable shadow/material policy, and return from the current pose on leave. Neighboring avatar or card displacement needs a distance falloff and stable identities. Touch and keyboard retain all content without simulated hover.

**Drag physics.** Track pointer movement directly while dragging; apply momentum only on release, based on measured recent velocity. Capture the pointer, resolve drop targets, cancel cleanly, and provide keyboard alternatives. Respect bounds and settlement, including resize. Do not use a large easing lag while the object is held. A card fan hover and a sortable card stack are different interactions.

**Image opening.** Separate the image crop from its transforming shell. Measure start and destination rectangles, keep the focal crop intentional, and decode the destination asset before transition. Close back to the current source location if it moved. An image dissolving through particles needs a permitted image, a deterministic effect lifecycle and a static fallback; it does not authorize replacing the actual subject.

**Particles and dissolves.** Canvas/WebGL is optional. Emit a finite effect for a real event, bound its lifetime, pause work when not visible and clean up on unmount. Confetti should not obscure the action or intercept input. Input dissolve must preserve a separate truthful field value and recovery. Do not erase user data merely to imitate a visual.

**Fluid and gradient material.** For gooey separation follow [surface reconstruction](surfaces.md). For reflective/organic materials use [expressive integrations](../expressive-effects.md) after verifying an applicable engine. A gradient text or button treatment can use a clipped CSS background, but contrast and focus need checking through the full cycle. No moving gradient is required by default.

**Counterexample:** lifting every button and card on hover, or implementing a photographed liquid silhouette as a generic CSS scale.

**Check:** normal playback, reversal, pointer exit/reentry, no-hover device, reduced motion, unmount, GPU fallback and measured frame cost with the actual number of visible instances. Record unavailable effects explicitly; a guide is not a shipped implementation of every variant.
