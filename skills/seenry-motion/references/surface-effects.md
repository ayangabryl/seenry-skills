# Reusable surface effects

Use effects as a rendering layer, not as a replacement component library. Start with the existing button, disclosure, selection, card or image and retain its semantics, state and actions. Shared color, corner and depth tokens come from DESIGN.md. Effects do not establish a brand by themselves.

## Choose from the actual change

| Change | Mechanism | Applicable contexts | Avoid when |
| --- | --- | --- | --- |
| One mass separates or rejoins | Merge (`morph`) | Action fan, button→panel, joined controls | Surfaces must retain different colors; content is cramped |
| A surface follows a value/selection | Trail (`move`) | Range thumb, selected pill, dragged object | Exact visual position is essential during manipulation |
| A moving object flexes | Bend (`bend`) | Card, pill, compact toolbar | Content becomes difficult to read or positional precision matters |
| Two images meet | Blend (`melt`) | Paired artwork, image transition | More than two bodies; imagery cannot be distorted |
| A view resolves into focus | Blur | Label, detail, incoming image | Continuous blur affects readability or frame budget |

These are choices, not a checklist to apply everywhere. Use plain opacity/translation or no animation when that better supports the task. A close/return transition is part of the same contract; do not design only opening.

## Working implementation

Use the original [FluidSurface.jsx](../assets/fluid/FluidSurface.jsx) renderer with React; no third-party fluid package. Read its [supported API and limits](../assets/fluid/README.md). It uses SVG silhouette filtering and unfiltered interactive DOM. It is a new implementation, not a renamed wrapper or copied engine.

The application owns state, conditional content, hit testing, tab order, Escape, outside interaction and focus restoration. The renderer switches to static DOM under live reduced motion. Test those semantics in every context. The supported options are shared fill/blur/contrast and item geometry/timing; do not pass another engine's advanced physics options and assume they work.

One shared silhouette has **one fill**. Keep the trigger and revealed panel on the same semantic surface token for a continuous merge. Text/icons are a separate sharp foreground. A different-color button and panel can still have good motion, but use separate surfaces and an opacity/geometry handoff; do not promise a seamless single-color mass across incompatible fills. Theme changes must update both layers together.

Keep a group large enough for full travel, overshoot and shadow. Do not filter the page or interactive text. Engine items can use display-contents wrappers: position the actual element explicitly instead of depending on one assumed wrapper depth. Avoid clipping intermediate necks and overshoot. Check the filter bounds at the smallest screen size.

## Measured action fan recipe

Action fan study; provenance is retained in the research evidence record. These numbers describe that action fan, not all its effects. They are reference configuration, not proof that the new renderer matches its physics.

- Four 40×40px circles. Trigger stays in place.
- Final action offsets from trigger: (-54,-34), (0,-64), (+54,-34) CSS px.
- Public code specifies 550ms `cubic-bezier(0.34,1.56,0.64,1)` and 40ms stagger. These are source-disclosed values, not a curve fitted from frames.
- Public controls: blur 6px, contrast 18, waviness 0. Timing captures have nonuniform cadence, including gaps in the opening. Do not claim frame-perfect measured equivalence from those captures.
- Keep closed actions mounted for surface merging, but remove their tab stops and pointer actions. The trigger owns the topmost hit area. On Escape or selection return focus to it.
- Only the fan geometry/source configuration is matched here. Shape-panel, trail, bend, blend and blur examples are adaptations. They require their own comparison if a user requests exact replication.

## Validate reuse

Check at least two applicable contexts before calling an effect reusable. Inspect shape mid-transition and at rest; exercise open→close→open before settlement; confirm no stale close removes reopened content. Check keyboard and touch, a 390px layout, two fill themes, resize, image failure, reduced motion and unmount. Verify supported browsers directly; dependency claims are not your test results. Blend uses only two images, with usable static images under reduced motion.

Copy prompts must contain the chosen family, context, exact dependency/adapter, parameters, shared-fill restriction, semantics, reduced-motion fallback and verification criteria. Do not call a showcase adaptation a replica.

## Consistent exploration and handoff

Group a motion library by effect family, then by applicable context. Keep a representative playground on the main skill page and move the long recipe catalog to a dedicated route. Do not duplicate the same effect catalog and number demo on both surfaces. Every group has a direct URL; prompts must describe the selected effect/context and its actual settings, not inherit the default fan recipe.

Use the bundled [FluidSearch.jsx](../assets/fluid/FluidSearch.jsx) and its CSS for focus-driven search. A stationary 52px wrapper contains a pill and a 52px circle. On focus the pill shrinks by 64px and the circle separates to a 12px final gap over 460ms cubic-bezier(.22,1,.36,1). Filter only their shared-color silhouettes; keep content sharp. Close/Escape clears and returns focus to the wrapper as both silhouettes merge. Outside blur preserves a nonempty query. Closed close controls must be untabbable and noninteractive. Rapid reversal starts from current CSS geometry; live reduced motion removes transitions and filtering. No package installation is needed beyond the project's React runtime.

For blurred numbers, reserve digit columns with tabular numerals. Animate only changed glyphs, with a single semantic current value; blank leading slots instead of showing unwanted zeros. Test carry and borrow (99↔100) and rapid retargeting. Blur is temporary during change, never the resting state. Keep numbers and their units readable and stationary once settled.


## Number cross-blur correction

The number pop-in treatment uses simultaneous incoming/outgoing glyphs, 8px travel, 2px blur, 500ms cubic-bezier(.34,1.45,.64,1), and 70ms stagger at the inspected desktop viewport. This replaces the former 70% travel / 160ms wait-mode example. Keep two reusable layers per column, cancel old animations on a new value, and use the more visible of incoming/outgoing glyphs as the next outgoing start. On an interruption within 640ms, remove the stagger and resolve over 300ms; skip unchanged digits. Under reduced motion switch to the latest value immediately. Keep original research attribution in the evidence record; do not claim independent invention of the reference behavior.

## Retargeting quality gate

- Merge: if the DOM already animates position, the silhouette tracks it directly. A second position smoother separates the icon from its surface. Hide closed action glyphs while leaving silhouettes available to merge.
- Trail: update the authoritative target immediately. Stretch only the trailing boundary toward a damped previous position, cap horizontal stretch at 70% of width, and let it relax after stopping. Do not lag the entire thumb behind the pointer or use a rigid trailing dot.
- Bend: use target velocity in both axes, filter its deformation and relax to zero after input stops. Keep text and pointer targets unwarped.
- Keyboard focus outlines appear for keyboard interaction, not simply because a pointer drag focused the range.
- Record intermediate silhouettes and rapid reversals. A matching final frame does not establish matching movement.

## Panel, search and image continuity

A resizing panel uses one shell with explicit open/closed width and height. Keep children mounted through exit, inert when closed, and clipped to the shell. Never jump the content layout while a separate background lags behind it. Reverse the current geometry when toggled mid-transition.

Search focus has two distinct treatments: pointer focus activates the split silhouette without an extra ring; keyboard Tab adds a visible focus indicator. Do not depend on input `:focus-visible` alone to distinguish pointer entry because text inputs may match it after clicking.

For image joining, blend the image colors and their shared alpha boundary, not a noisy rectangle drawn above an overlap. In the bundled renderer a 22px proximity range grows a contact mask over shared color and displacement layers. Outer faces and separated images remain sharp. The precise transfer function is an authored approximation, not a measured source shader.

### Contact-local image blending
The bundled `assets/fluid/ImageBlend.jsx` paints three separate layers: a shared alpha-threshold silhouette, displaced colors under a soft contact mask, and crisp image faces outside that mask. `FluidSurface` measures the rendered item rectangles; proximity ramps with smoothstep across a 22px gap. It supports the first pair of images; subsequent images are not blended. Keep pair sizes similar, preserve alt text, and use the unfiltered DOM with reduced motion. The demo reverses its 650ms transform from the current position.

Research (24 September 2026): inspected the public `liquid-gooey` package README and `packages/liquid-gooey/src/imageMelt.tsx` at https://github.com/Jakubantalik/Libraries.dev. The source separates molten color, seam marbling and crisp faces. The earlier Seenry implementation blurred the entire source pair, which lost detail and did not model the seam. The new renderer is an original, smaller SVG implementation of contact-local blending, not a dependency install or a claim of pixel-equivalent reconstruction. Reference has additional geometry/tuning and easing; our demo remains a bounded two-image adaptation. Keep this research provenance out of consumer copy prompts.
