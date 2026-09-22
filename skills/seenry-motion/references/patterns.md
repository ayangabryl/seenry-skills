# Select a motion mechanism

This is original Seenry implementation guidance, not the transitions.dev snippet collection. Select the current mechanism after inspecting the reference. A guide supplies decisions and checks; it does not prove that every named variant is implemented or visually matched. If the project already has licensed snippets, inspect the relevant local snippet and its terms instead of assuming it is bundled here.

For faithful reproduction first read [motion reconstruction](replication.md). Source geometry and trajectory override starting recipes. For ordinary product work use [local transitions](product-transitions.md). For scroll use [scroll choreography](scroll-choreography.md).

Set `motion_patterns` in the project packet to one or more applicable identifiers below. The packet includes the selected family and required helper/runtime dependencies, not the whole index. `motion: "none"` conflicts with a pattern selection. The index is intentionally grouped by mechanism so related variants share one explanation.

| Mechanism family | Packet identifiers | Guidance |
| --- | --- | --- |
| Surfaces | `anchored-menu`, `surface-morph`, `fluid-menu`, `disclosure`, `dialog`, `side-panel` | [Surfaces](patterns/surfaces.md) |
| Navigation | `selection-indicator`, `page-transition`, `tooltip`, `directional-hint` | [Navigation](patterns/navigation.md) |
| Text and values | `label-swap`, `icon-morph`, `number-change`, `text-reveal`, `streaming-text` | [Text and values](patterns/content.md) |
| Feedback | `status-feedback`, `notification-stack`, `checked-control` | [Feedback](patterns/feedback.md) |
| Loading | `loading-reveal`, `process-loop` | [Loading](patterns/loading.md) |
| Expressive effects | `pointer-response`, `drag-physics`, `image-transition`, `particles`, `material-effect` | [Expressive effects](patterns/expressive.md) |

Example: `{"scope":"component","intent":"replicate","media":"none","motion":"signature","motion_patterns":["fluid-menu"],"research_source":"local"}`. Run the ordinary packet helper with that project JSON. Only request a helper when its mechanism fits: the disclosure helper cannot generate a liquid silhouette.

Keep one owner for each animated property. Audit actual input, interruption, current-state reversal, keyboard/focus, resize and live reduced motion. Compare the observed transition at the source dimensions, including its intermediate frames. Counting effects, importing a library or passing functional tests does not establish reference fidelity.
