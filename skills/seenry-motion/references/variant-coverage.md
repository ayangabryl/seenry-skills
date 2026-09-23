# Variant coverage and implementation decisions

Route specific requests here when the family name is too broad. These are original implementation decisions, not a redistribution of another library. All rows have guidance; only a project's actual exercised implementation establishes runtime support. Inspect a named reference to determine its trajectory and timing.

| Requested behavior | Mechanism and important distinction | Focused guide |
| --- | --- | --- |
| Resizing card, accordion | Measure outer geometry; clip content during resizing without scaling glyphs. | [Surfaces](patterns/surfaces.md) |
| Dropdown, dialog, side panel | Origin and focus return differ; a dialog needs modal semantics, a menu does not become a dialog. | [Surfaces](patterns/surfaces.md) |
| Trigger-to-menu morph, separated action fan | Shell interpolation and liquid bridges are separate effects. Match topology before easing. | [Surfaces](patterns/surfaces.md) |
| Forward/back navigation | Direction follows route depth; keep outgoing context until incoming content is usable. | [Navigation](patterns/navigation.md) |
| Sliding tab indicator | Measure the selected label bounds; one indicator retargets without remounting. | [Navigation](patterns/navigation.md) |
| Travelling tooltip | Delay first entry, retain continuity between adjacent targets, dismiss immediately on exit; focus works too. | [Navigation](patterns/navigation.md) |
| Directional link cue | Move the icon inside a stable link target; preserve text and underline position. | [Navigation](patterns/navigation.md) |
| Digit pop, spinning counter | Pop and rolling reels are different mechanisms. Carry/borrow and decimal-place identity matter. | [Interaction anatomy](interaction-anatomy.md) |
| Label replacement, icon replacement | One semantic value; separate decorative layers share a reserved slot. Morph only corresponding paths. | [Content](patterns/content.md) |
| Line entrance, dissolving input, streamed words | Preserve selectable/accessible text; exits do not erase authoritative input or fabricate arrived text. | [Content](patterns/content.md) |
| Status text, reasoning stream | Use actual product-provided state. Preserve user scroll position and stop loops on completion. | [Content](patterns/content.md) |
| Badge arrival, success mark, spinner/check | Anchor badge; draw check stroke after confirmed completion; spinner and check share a footprint. | [Feedback](patterns/feedback.md) |
| Error shake | Move the relevant field briefly, retain the error and user's text; no whole-page shaking. | [Feedback](patterns/feedback.md) |
| Toast, stacked banners | Bound visible and exiting layers; choose overlay versus document-flow deliberately. | [Interaction anatomy](interaction-anatomy.md) |
| Checkbox, switch, favorite burst | Checked state updates immediately. Bounce is decoration; rejection rolls the real state back. | [Feedback](patterns/feedback.md) |
| Skeleton/content | Reserve the final geometry; crossfade only after readiness; failure exits loading. | [Loading](patterns/loading.md) |
| Text shimmer, organic shimmer, dot matrix | Bound contrast and frame cost; pause offscreen; provide static status, not fictional progress. | [Loading](patterns/loading.md) |
| Generated-image placeholder | Reveal a decoded result; a placeholder is not an image-generation capability. | [Loading](patterns/loading.md) |
| Avatar neighbors, card fan | Stable identities and distance falloff; keyboard selection remains readable. | [Expressive](patterns/expressive.md) |
| Drag/drop physics | Direct pointer tracking, measured release velocity, cancellation and keyboard alternative. | [Expressive](patterns/expressive.md) |
| Pointer tilt, image expansion | Clamp tilt; preserve readable text plane and source/destination crop. | [Expressive](patterns/expressive.md) |
| Confetti, particle deletion | Finite event, bounded particles, deterministic cleanup; no effect authorizes actual deletion. | [Expressive](patterns/expressive.md) |
| Gradient text, rim glow | Maintain contrast throughout the cycle; isolate expensive material layers. | [Expressive](patterns/expressive.md) |

## Matching a named collection

Inventory its current visible examples, including any inaccessible variants. Map each to a row, but record separately whether source playback, intermediate frames, rapid input and reduced motion were inspected. Public demo access is not access to paid source code. Do not claim “all animations included” because all names fit a table. Build and verify the requested subset; carry remaining reference-match gaps into the handoff.
