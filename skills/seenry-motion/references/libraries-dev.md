# Choose an effect by its job

Study date: 2026-09-11. This covers the five libraries in the public [libraries.dev catalog](https://libraries.dev/), not every preset, private Studio asset, native port or future release. The free npm packages are MIT licensed. They are optional rendering tools, not a design skill dependency, an image source or a substitute for choreography. No MCP or paid account is required to use this guide.

## Decide before installing

State the change a person needs to understand: where an action is, whether work is actually running, which controls belong together, what material a brand evokes, or which image has arrived. Choose a stable reference point, the trigger, an informative settled state, an interruption rule and a motion-free equivalent. Inspect that moment in the real layout. Remove the effect if it competes with the content or obscures the change.

Use one owning runtime per animated property. Do not let GSAP, React state, a spring and a CSS transition simultaneously write the same transform. Scroll can drive an explicitly supported parameter; a looping shader is not a scroll narrative. For page choreography use [worked scores](worked-scores.md) and [scroll choreography](scroll-choreography.md), with reading holds, reverse travel and a static sequence. None of these five packages provides the complete page score.

For staged runs, explicitly declare `motion_libraries`, for example `["liquid-gooey"]`, in the project JSON alongside `media` and `motion`. The packet compiler supplies this guide during research, planning, prototyping, building and review. This declares an option to investigate, not permission to assume it is installed or compatible. The installed version, license and API must be checked before importing it. Leave the field empty for ordinary CSS/SVG/WAAPI motion.

## Border Beam: direct attention along a boundary

Verified package surface: `border-beam@1.3.0`, React/React DOM >=18 peers. [Documentation](https://libraries.dev/beam), [source](https://github.com/Jakubantalik/border-beam).

`BorderBeam` wraps ordinary content. Its five size families are `sm`, `md`, `line`, `pulse-inner` and `pulse-outside`. Color families are `colorful`, `mono`, `ocean` and `sunset`. `active`, `strength`, `duration`, `staticColors`, `theme` and `borderRadius` expose the important controls. `active={false}` controls the effect, not the button's availability.

Fit: a single temporarily emphasized action, a focused tool surface, or a deliberate luminous brand material. A traveling line can point to a boundary without enlarging the content. Test the smallest visible strength in context. Inappropriate use: every pricing card, idle status, persistent unread alerts, or a glow added solely to make an ordinary layout look expensive. A neutral focus ring or brief opacity change may communicate the same thing better.

Keep keyboard focus independently visible. Check bloom clipping, nested radius alignment and contrast at both the brightest and darkest frames. Do not equate a moving border with measured progress. The package contains reduced-motion CSS and intersection handling; this does not certify the complete integration.

## Thinking Orbs: give a real process a recognizable presence

Verified package surface: `thinking-orbs@0.3.1`, React >=18 peer. [Documentation](https://libraries.dev/orbs), [source](https://github.com/Jakubantalik/thinking-orbs).

`ThinkingOrb` has nine named states: `working`, `searching`, `solving`, `listening`, `connecting`, `weaving`, `composing`, `breathing`, `shaping`. Use the actual `theme` property (`auto`, `light`, `dark`), plus `paused`, `speed` and the separately tuned sizes 20 or 64. Do not assume a `dark` boolean from an older example matches these installed types.

Fit: a conversational process indicator or expressive system identity where a visible change reinforces a truthful state. The names describe visuals, not capabilities. Do not imply that the system is searching, listening to a microphone or reasoning merely because an animation has that name. Provide readable status and errors outside the decorative canvas; mark it hidden from assistive technology when it duplicates that text.

Avoid an always-active ornament in a paused player, ordinary form, or quiet reading surface. A simple text update can be sufficient. Explicitly connect `paused` to user pause, reduced motion, document visibility and viewport visibility. The inspected distributed JS did not expose a `prefers-reduced-motion` hook; absence of that string alone is not a complete behavior audit. Test actual frames instead of relying on the catalog-wide accessibility claim.

## Liquid Gooey: preserve a relationship while shapes change

Verified package surface: `liquid-gooey@0.2.1`, React/React DOM >=18 peers. [Documentation](https://libraries.dev/gooey), [public monorepo](https://github.com/Jakubantalik/Libraries.dev).

`Liquid` owns merged fill, blur, contrast, shadow and filter bounds. `Liquid.Item` exposes `morph`, `move`, `melt` and `bend`, with `x`, `y`, `scale`, `transition` and per-effect tuning. `morph` connects or changes shapes; `move` adds trailing mass; `bend` deforms with velocity. `melt` combines image surfaces: its documented implementation is pairwise, so do not assume an arbitrary grid will blend correctly. Shape physics are not enabled merely by choosing `morph`; inspect `morph.shape` and its tuning.

Fit: revealing a closely related action group, a playful selection indicator, or a branded image transition whose physical continuity explains the relationship. Avoid moving precise input targets away from the pointer, merging unrelated actions, disguising destructive controls, or blurring labels. A connected silhouette must not merge the semantic buttons or enlarge their click targets into each other.

Keep text and focus crisp, and preserve hit areas separately from decorative geometry. A collapsed child must not remain tabbable or intercept the parent button. Test opening, closing, immediate reversal, keyboard activation and reduced motion while open. Check filter clipping and touch input. A static group or a short geometry transition is the fallback. The package includes a reduced-motion hook, but verify the selected effect and its nested controls, not just the hook's presence.

## Metal FX: express material, not generic importance

Verified package surface: `metal-fx@2.0.10`, React/React DOM >=18 peers. [Documentation](https://libraries.dev/metal), [source](https://github.com/Jakubantalik/metal-fx).

The current v2 API includes `MetalFx`, `MetalText`, `MetalBadge`, `useMetalBend` and `useMetalTextReflection`. The wrapper accepts `preset` (`chromatic`, `silver`, `gold`), `strength`, `paused`, `reflectionTargets`, `disableGlow`, `glowGain`, `innerShadow` and explicit radius. Text and badge components have their own props; do not pass wrapper props blindly. The vendor describes v2 as built on Paper Shaders; v1 examples can differ.

Fit: an instrument, hardware object, crafted identity or a deliberately reflective signature detail. Inappropriate use: every control, long body copy, a generic premium badge, or a reflection that lowers label contrast. Try the restrained reflection without glow first when the brief calls for quiet material. This is a comparison, not a universal prohibition on glow or color.

Pointer reflection is optional enhancement. Keyboard and touch users must retain the same action and readable state. Keep label contrast and focus outside the shader's responsibility. Test WebGL capability before enhancement, keep the plain child available, and test context loss rather than assuming initial support lasts. Pass pause policy explicitly; the inspected source's reduced-motion check around pointer effects does not prove every render loop is suspended. Large text, masks and bend variants require their own prototype and performance checks.

## Image FX: reveal an image that actually exists

Verified package surface: `img-fx@0.5.1`, React/React DOM >=18 and Three >=0.149 peers. [Documentation](https://libraries.dev/image), [source](https://github.com/Jakubantalik/img-fx).

`ImageGeneration` wraps children and supports `pixels-organic`, `pixels-mechanic`, `sweep-gradient`, `images`, `autoReveal`, `paused`, `strength`, theme and reveal timing. Despite the component name it performs no image generation. It requires image URLs or supplied content. Its automatic cycle callback is not a backend job event or download acknowledgment.

Fit: introducing newly available visual material, a generative-product demonstration clearly presented as a demonstration, or a deliberate image-led transition. Avoid fake progress, delaying access to an already available image, perpetual loading over content, and forcing people to wait for decorative completion. Keep a real image with meaningful alternative text and stable dimensions available when the shader cannot run. Preserve the previous useful image until the replacement loads; expose actual failure and retry independently.

Use automatic reveal only for a genuine demonstration or an explicitly desired sequence. For production state, check the version's supported controlled API instead of inventing a progress prop. If it cannot represent the actual lifecycle, choose a simpler opacity/mask reveal. Explicitly pause for reduced motion and invisibility. The inspected JS includes intersection and context-loss handling, but no direct reduced-motion query; validate the integration. Measure GPU cost with actual image sizes and visible instances, not the catalog's headline bundle claim.

## Evidence and acceptance

The package manifests and distributed types above were inspected at pinned versions. The [vendor accessibility page](https://libraries.dev/accessibility) makes catalog-wide claims; treat them as vendor statements until exercised. API availability, source inspection, local rendered behavior, cross-browser verification and human visual acceptance are distinct evidence levels.

The repository includes a runnable `examples/libraries-motion-lab/` with pinned packages and browser checks. Its capability study exercised a selected configuration of each library in Chromium with a software GPU. It is not proof of all presets, Safari/Firefox behavior, native mobile ports, hardware smoothness or design quality. Native React Native/SwiftUI offerings need their own build and device evidence; a 390px browser capture is mobile emulation.

For adoption, record the exact version, installed source/license, trigger, state ownership, interruption, pause/reduced-motion policy, fallback and a short real recording. Test: repeated input, reversal, offscreen return, resize, keyboard, touch, unmount and recovery. An effect that is attractive in isolation can still fail its content, layout or frame budget. Select it only after comparing the task with and without the treatment.
