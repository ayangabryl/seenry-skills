# Product craft for task-led interfaces

Use when creating or substantially redesigning a working product surface, including a searchable catalog or browse-and-download page. If a named reference is the craft target, pair with [reference transfer](reference-transfer.md). This is not a dark-theme preset or a mandate to make every product dense.

## Read the operating surface

A marketing page may contain an excellent product screenshot. Separate its promotional frame from the interface inside it. Inspect the product region at readable scale; do not transfer a marketing headline's size into an issue title. Record source viewport, crop and observed state. If only a static desktop image exists, describe mobile and interaction decisions as adaptations.

Find the user's current object, the action they are trying to complete, and the context needed for that decision. Identify the stable navigation, task surface and secondary context. Notice where the source spends contrast and space: selected navigation, title, actionable state, ordinary rows, metadata, dividers and empty space. Dark gray plus rounded corners does not transfer these relationships.

Build a small **role map** from the inspected pixels, not invented exact measurements:

| Role | Record and transfer |
| --- | --- |
| Navigation | Relative width, row rhythm, active-state emphasis, separation from the task |
| Main object | Title/body relationship, readable line length, first useful action, content alignment |
| Supporting context | Which properties stay visible, which become a panel, and their reading order |
| Repeated content | Shared baselines, row height, icon centers, label/value gaps, realistic long entries |
| State | How selection, progress, disabled, success and errors differ without competing for attention |

Use measured values when pixels support them; otherwise record ranges or proportions as estimates. Turn the chosen relationships into a few shared tokens and component owners. Do not independently restyle each screen.

## Resolve one real task, including its content

Build the task surface and its most consequential adjacent state together: a list and detail, an editor and inspector, or a form and recovery. Give it coherent subject-specific content and varied realistic lengths. If the user permits a fictional prototype, label illustrative metrics and local-only actions honestly; do not imply production evidence or an integration.

Prove the central object with **working material from this domain**, at the scale where the user actually decides. A newsroom needs a story, source trail, reporting record or review evidence; a release tool needs changes, dependencies or verification results. A plausible title, status, generic activity feed and checklist alone can still read like a reskinned tracker. Make the content's relationships specific enough that changing the product name would leave visible work to redo. Keep this material readable in the first useful desktop and narrow view before filling space with chrome. For a catalog, expose one real item and its deciding action early, then give every repeated row the metadata promised by the brief. Do not invent factual evidence for a real product; use supplied material or clearly marked illustrative content.

For comparison work, inspect each complete option as well as the shared preview. A split, crop or thumbnail can explain the difference but may hide the typography or detail needed to judge quality. Choose an opening preview that preserves the deciding evidence; if a split cuts through both subjects or headlines, change the preview or compositions rather than asking the visitor to infer the hidden work. When neither crop can show both defining compositions, put the complete options and choice first, then use the split as a detail comparison. Keep a readable full-size inspection route when phone thumbnails make supporting text too small. At narrow width, place that route and the choice near the compared material. Remove repeated introductions before shrinking the action into metadata.

Keep data consistent between states. Counts must agree with rows, a changed status must propagate to its list, and a successful action must have a visible result. A screenshot with decorative buttons is weak evidence that the skill can design a product.

Inspect repeated-row labels, quantities and live state at ordinary display size on both wide and narrow screens. A dense layout does not justify tiny, faint time, progress or category cues when those values drive the choice. Review the visible selected or playing state as well as the resting row.

Treat large headings, KPI cards, promotional copy and empty decorative panels as decisions to justify. They can be appropriate, but if they draw attention away from the current task, reduce or remove them. Match useful information density, not the total number of boxes. Quiet space can separate roles; it need not be filled.

## Calibrate and carry the system

Compare the finished task slice with the relevant source region at comparable reading scale. First inspect the silhouette and distribution of attention; then text roles, line lengths, surface contrast, baseline alignment, icon weight and repeated spacing. Separate a functional adaptation from an unresolved craft gap. Repair the largest concrete gap before spreading the system.

Carry the repaired system into the adjacent state and a narrow view. Reflow secondary context deliberately. Do not silently remove decision-critical status just to make a table fit. Keep visible and accessible names, focus return, field geometry, loading and recovery coherent. Motion should explain the actual state transition; it cannot certify quality missing from settled frames.

At narrow width, verify the selected object's full identifying label remains readable and the way back to the list/search is obvious. A horizontally scrollable queue or filter can be useful, but a cut-off label with no scroll cue is not a completed navigation pattern merely because the document has no horizontal overflow. Choose a deliberate list/detail switch, labeled queue control, wrapping filters or a visibly scrollable strip; capture its default state and one neighboring selection. Keep actions visibly named when compacting rows; an accessible name alone does not tell a sighted visitor what an icon means. Inspect text next to the viewport edge as well as the page scroll width.

A useful failure example: a release workspace shares a reference's dark palette, yet a giant metric card and sidebar slogan make it read like a sales demo. The repair is to restore emphasis to the task, turn the metric into supporting evidence, and remove the irrelevant slogan—not add more gradients or animation. Conversely, a product whose main task is metric monitoring may correctly make that same figure dominant.

## Finish the interaction surface, not only the routes

Before accepting product craft, use [component finish](component-finish.md) and [focus/keyboard continuity](focus-and-keyboard.md) on the delivered cascade. A control opening successfully does not establish a finished focus state. Inspect a representative row and a composed field at rest, pointer hover, keyboard focus, press, open and settled result; include exit/reentry. Capture the actual focused pixels. Separate selection from hover, and make keyboard focus immediate, visible and owned by one boundary. Keep its painted extent clear of adjacent rows and clipping ancestors without moving content or hiding the indicator.

For a list, compare heading/content starts, header/row columns, icon centers, right edges, and divider endpoints at the same viewport. Give structural boundaries and row separators distinct contrast roles; do not let each container invent a line color or inset. Use a shared layout owner for header and rows. Check the rendered small type at actual working size rather than judging a scaled screenshot. Exercise a value update while an unrelated field contains an unsent draft: unchanged nodes, draft text, focus and geometry must survive. Repair failures before calling the surface finished; a route check or source-level presence of `:focus-visible` is insufficient evidence.

Finish with the [fact and action ledger](fact-action-integrity.md): inspect every visible button's label, handler and settled result, including utility icons and related records. Make unsupported material static instead of adding a toast that merely announces the promised action. Keep measurement overlays and guide controls in development tooling; remove them from delivered product UI and final captures at every viewport.

## Scope confidence to demonstrated work

Keep the actual rendered artifact, inspected source ID, tested states and concrete repairs. Self-authored work is a trial, not an independent benchmark. A clean build establishes implementation health; screenshots and exercised states support craft claims. One successful tool screen supports confidence in that surface and system, not every brand, style or task. Broader claims need fresh briefs and different reference families, with the same comparison standard and failures retained.
