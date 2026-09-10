# Motion as a state relationship

Write a short score: initial state → input → feedback → transition → settled state → interruption/return. Keep a stationary anchor and define what changes identity. Explain why movement helps this particular task. A blanket hover lift, border flash or floating icon often competes with the content rather than clarifying it.

Use one owner per animated property. DOM layout, a transform timeline and a shader may cooperate through separate wrappers or a shared progress value. Do not let CSS transitions, a spring and GSAP write the same transform. Build a capability slice before committing a central idea to WebGL, complex morphing or 3D. Test a genuine static/reduced-motion fallback, not a blank scene.

For buttons, keep hit area and label/icon anchors stable. Press feedback can be immediate; completion must follow the real operation. A morphing copy/check icon should retarget during repeated input and clear when the value changes. Filled transport glyphs may read better than thin outlines at small size. Use actual icon data. Crossfading two icons is a swap, not path morphing; name the implementation accurately.

For changing containers, measure the before/after geometry or use an appropriate layout animation. Avoid jumps from `display:none`, auto-height transitions assumed to work everywhere, or stretching live text with a scale transform. Move a wrapper while keeping text readable. Retarget from the current visual state on interruption, and clean up stale animations after unmount.

For numbers, preserve decimal/unit anchors and use tabular numerals when comparison needs them. A Number Flow-style transition needs a stable accessible value and a reduced-motion update; it is not necessary for every timer tick. Test digit-count changes, negative values, separators and rapid updates. Do not make the colon or unit drift merely because digits animate.

Inspect normal-speed playback, not just endpoints. Exercise ten quick inputs, reversal halfway, pointer leave, keyboard activation, resize, mount/destroy/remount and live reduced-motion changes. Check that delayed async results cannot win over newer input. Pause decorative continuous motion where appropriate; hidden/offscreen scenes should not waste frames. Render the final state from actual application state after cancellation or failure.

Gooey/morph effects belong to a meaningful organic merge or separation. Keep filters off text and focus indicators, constrain their bounds and test touch/GPU cost. A large blurred halo is not automatically premium. Lottie, SVG, CSS and Canvas should be selected against the needed behavior and available model/runtime capability, not fashion.
