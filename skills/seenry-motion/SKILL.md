---
name: seenry-motion
description: "Research or implement web interactions using Seenry website recordings and creator motion references. Use for entrances, hover states, scrolling, transitions and component animation; distinguish observed motion from static screenshots."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.14"
---

# Design movement around a meaningful change

Motion should help people follow an action, relationship or change of state. Start from the task and the existing interface; retain the project's working behavior and runtime. MCP, paid accounts and another design skill are not required.

## Define the interaction

For a faithful recreation, use [motion reconstruction](references/replication.md) before selecting a recipe. Preserve observed geometry, trajectories, timing and content. An adapted animation must not be reported as a replica.

Read [the motion contract](references/motion-contract.md) when planning or changing an interaction. Record its trigger, real state owner, stationary anchor, feedback, settled result and interruption behavior. A simple button needs a few lines; an expressive scene may need a score. Make this decision before committing the layout to moving or overlapping content.

Choose the treatment by what changes:

- **Acknowledge an action:** preserve the control's hit area; show completion only after the operation succeeds.
- **Expand or navigate:** preserve the relationship to the triggering item and a clear return path.
- **Compare values or views:** anchor units, framing and controls; direct manipulation should follow input immediately.
- **Explain through scrolling:** give the scene a learning sequence, reading holds and a readable static equivalent.
- **Reveal or combine material:** use a visual effect only when the content or brand gives it a useful role.

For implementation details read [motion craft](references/motion-craft.md). For an expressive page read [worked scores](references/worked-scores.md); add [scroll choreography](references/scroll-choreography.md) when actual scroll progress drives the scene. These original exercises demonstrate mechanics, not a default visual template.

## Research only what the decision needs

Use supplied recordings or available public evidence when reconstructing or comparing a treatment. Follow [video study](references/video-study.md) for normal playback and bounded local frame/contact-sheet extraction with actual timestamps and provenance. A poster cannot establish timing, easing, keyboard behavior or interruption. Without playback, label timing as proposed and test it locally.

If Seenry MCP is connected, `search_references(motion=true,site=...)` and `get_page_motion(id,viewport)` find website journeys. For creator studies use `get_design_taxonomy`, `search_designs(family="motion",...)` and `get_design_video`; collections may expose clips through `get_design_reference` and `get_reference_asset`. `search_curated_references` supports `motion` and `walkthroughs` families. Read review reasons, then inspect the clip. Ratings do not prove suitability.

Check recording coverage, duration, cadence, observed unique frames and warnings. Do not confuse encoded frame rate with capture fidelity or a partial journey with a complete one. Distinguish observed behavior from inferred implementation. For research deliverables include source, clip interval, applicable behavior and limitations. An offline task can proceed using the bundled behavior guides.

Use [implementation decisions](references/implementation-decisions.md) to choose timing, properties, interruption, hover gating and reduced-motion behavior. The guidance is bundled; reference links are optional research.

For deeper recipes use the bundled [motion construction](../seenry/references/handbook/engineering/build-motion/GUIDE.md), [motion review](../seenry/references/handbook/engineering/motion-review/GUIDE.md) and [opportunity audit](../seenry/references/handbook/engineering/motion-opportunities/GUIDE.md) modules when Seenry core is installed. Follow their integration rules. The self-contained guidance below remains sufficient without that optional handbook.

For reusable merge, trail, bend, image-blend and blur treatments across controls, read [surface effects](references/surface-effects.md). It includes the licensed adapter, shared-fill constraint, measured fan geometry and explicit fidelity limits.

## Choose the smallest capable mechanism

Use CSS, SVG or Web Animations when sufficient. Existing Lottie, GSAP, Anime.js, Motion or Three.js can serve a demonstrated need; verify the installed API. Give each animated property one owner. Prototype a complex central effect and its usable fallback before building around it.

Read [expressive effects](references/expressive-effects.md) only for a selected liquid, material, process, boundary or image treatment. Read [adapter usage](references/adapters.md) when adopting the bundled geometry, icon, number, Lottie or scroll helpers. Libraries own presentation; the application owns truth and recovery. Preserve source licenses for copied runtime assets.

For everyday dropdowns, contextual settings and copy feedback, use the original [product transition recipes](references/product-transitions.md). Select their runtime helpers explicitly so focused handoffs include usable implementation, not just a motion intention.

For other transition families, select a pattern from the [motion index](references/patterns.md). Load its focused guide and required helpers, not every effect. These are original Seenry recipes. A project's separately licensed third-party snippets can be used within that project; they are not bundled or relabeled as Seenry's library.

For motion across multiple pages or shared controls, use [system choreography](references/system-choreography.md). Implement the shared behavior in the product, then verify representative contexts.

For named benchmarks, repeated-event components or rejected motion, use [interaction anatomy](references/interaction-anatomy.md). It distinguishes numeric mechanisms, bounds outgoing layers under rapid input, and separates available guidance from verified fidelity.

## Exercise the meaningful transition

Test initial and settled states, rapid input, reversal, keyboard/touch, resize and live reduced motion. Inspect normal-speed playback and relevant intermediate geometry; endpoints alone cannot prove continuity. Check cancellation, stale async completion and cleanup for the chosen behavior. Keep failed or unavailable checks explicit, and report the actual browser/device coverage.

Use **seenry-assets** when sourcing media or licensed icon data and **seenry** for overall interface direction. Neither reference research nor a successful capability lab establishes the visual quality of the finished product.
