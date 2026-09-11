# Motion as a state relationship

Write a short score: initial state → input → feedback → transition → settled state → interruption/return. Keep a stationary anchor and define what changes identity. Explain why movement helps this particular task. A blanket hover lift, border flash or floating icon often competes with the content rather than clarifying it.

Use one owner per animated property. DOM layout, a transform timeline and a shader may cooperate through separate wrappers or a shared progress value. Do not let CSS transitions, a spring and GSAP write the same transform. Build a capability slice before committing a central idea to WebGL, complex morphing or 3D. Test a genuine static/reduced-motion fallback, not a blank scene.

For buttons, keep hit area and label/icon anchors stable. Press feedback can be immediate; completion must follow the real operation. A morphing copy/check icon should retarget during repeated input and clear when the value changes. Filled transport glyphs may read better than thin outlines at small size. Use actual icon data. Crossfading two icons is a swap, not path morphing; name the implementation accurately.

For changing containers, measure the before/after geometry or use an appropriate layout animation. Avoid jumps from `display:none`, auto-height transitions assumed to work everywhere, or stretching live text with a scale transform. Move a wrapper while keeping text readable. Retarget from the current visual state on interruption, and clean up stale animations after unmount.

For a disclosure with one natural-height content wrapper, the local `assets/geometry-transition.mjs` helper implements measured, interruptible height changes and live reduced-motion handling. Read its API in [adapters](adapters.md) and its source before copying it. The component still owns focus, `aria-expanded`, selected state and recovery. This is an optional behavior primitive, not a visual design.

For numbers, preserve decimal/unit anchors and use tabular numerals when comparison needs them. A Number Flow-style transition needs a stable accessible value and a reduced-motion update; it is not necessary for every timer tick. Test digit-count changes, negative values, separators and rapid updates. Do not make the colon or unit drift merely because digits animate.

Inspect normal-speed playback, not just endpoints. Exercise ten quick inputs, reversal halfway, pointer leave, keyboard activation, resize, mount/destroy/remount and live reduced-motion changes. Check that delayed async results cannot win over newer input. Pause decorative continuous motion where appropriate; hidden/offscreen scenes should not waste frames. Render the final state from actual application state after cancellation or failure.

Measure the properties the treatment actually uses. Stable geometry can coexist with a background pulse; changed text alone does not prove a number transition. For a path morph, capture the intermediate `d`, not only the accessible name. Seenry's optional `scripts/transition_evidence.mjs` and browser scenario adapter can record these observations without changing product styles. Their finite samples supplement normal-speed review and never certify perceptual quality.

Where the chosen score requires a particular anchor or size to stay stable, declare that geometry promise and its tolerance before review. The same module's `checkTransitionContracts` checks observed travel; retain a failed check even when a model's general review says the interaction passed. A center anchor can be appropriate for a rotating icon while its bounding edges move. Do not turn this into a ban on deliberate resizing, press feedback or moving content.

Gooey/morph effects belong to a meaningful organic merge or separation. Keep filters off text and focus indicators, constrain their bounds and test touch/GPU cost. A large blurred halo is not automatically premium. Lottie, SVG, CSS and Canvas should be selected against the needed behavior and available model/runtime capability, not fashion.

## Local motion studies

These authored examples work without a reference server. They are hypotheses to prototype at normal speed, not fixed durations or evidence that a recording was inspected. Use the smallest capable runtime already present. A simple component should not acquire a scroll library merely to animate a button.

| Meaningful change | Small working treatment | What makes it fail | Verification |
| --- | --- | --- | --- |
| Save → saved → undo | Keep the label and hit area anchored; acknowledge the actual operation in an adjacent reserved status slot. Swap/morph genuine icon states only after success. | A decorative spinner delaying an instant operation; announcing success before persistence; a wide button to hide unstable labels. | Error preserves input; a newer action invalidates old completion; keyboard focus and button bounds remain stable. |
| Closed → expanded detail | Measure the new content, animate the wrapper's geometry and reveal content without stretching live type. | Auto-height jumps, content clipped at the final frame, stacking a second spring on the same property. | Reverse mid-flight, resize and open a much longer item. Final height equals content; reduced motion presents the correct state immediately. |
| Compare changing numbers | Anchor unit/separator, keep the accessible value truthful and animate only when the change is useful to perceive. | Rolling every timer tick, drifting decimal points or a stale spoken value. | 9→10, negative values, locale separators and rapid changes settle at the actual latest value. |
| Navigate a spatial collection | Preserve identity between overview and selected detail; use a shared position/size relationship when it helps orientation. | An expensive zoom with no accessible route back; movement that hides the next task. | Touch/keyboard reach the same item; back restores position and focus; cancellation clears presentation only. |
| Explain a mechanism by scrolling | Use a shared progress value with explicit reading holds; keep text and the object on independent layers. | Smooth-scrolling inertia fighting a pinned scene or mandatory scroll to reach the CTA. | Reverse, jump, resize and use reduced motion. Every important fact remains available in ordinary document flow. |

Tune duration against distance, information load and repetition, then compare a quieter version. A delayed hover response can feel less responsive even if its easing is fashionable. Use stable hit targets, immediate input acknowledgement and an interruptible transition. Keep hover optional on touch. [Apple motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion) connects movement to feedback and understanding; it does not prescribe animating every control. Follow [W3C animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) when reducing nonessential motion; this particular success criterion is AAA, not a claim that every web animation violates AA.

## Keep icon ownership stable

Icon libraries may replace their placeholder elements during initialization. Do not keep querying a removed `i` element or mutate a stale node to update Play/Pause. Put the icon in a stable slot; update that slot through the library's supported API or the bundled adapter, then inspect the rendered state. The button retains its event handler, accessible name and focus. Check first load before testing animation: a null-node exception can prevent every later interaction from being attached. A visually plausible screenshot can hide that failure.
