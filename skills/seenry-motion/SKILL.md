---
name: seenry-motion
description: "Research or implement web interactions using Seenry website recordings and creator motion references. Use for entrances, hover states, scrolling, transitions and component animation; distinguish observed motion from static screenshots."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.3"
---

# Design movement around a meaningful change

Motion should help people follow an action, relationship or change of state. Start from the task and the existing interface; retain the project's working behavior and runtime. MCP, paid accounts and another design skill are not required.

## Define the interaction

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

## Choose the smallest capable mechanism

Use CSS, SVG or Web Animations when sufficient. Existing Lottie, GSAP, Anime.js, Motion or Three.js can serve a demonstrated need; verify the installed API. Give each animated property one owner. Prototype a complex central effect and its usable fallback before building around it.

Read [expressive effects](references/expressive-effects.md) only for a selected liquid, material, process, boundary or image treatment. Read [adapter usage](references/adapters.md) when adopting the bundled geometry, icon, number, Lottie or scroll helpers. Libraries own presentation; the application owns truth and recovery. Preserve source licenses for copied runtime assets.

## Exercise the meaningful transition

Test initial and settled states, rapid input, reversal, keyboard/touch, resize and live reduced motion. Inspect normal-speed playback and relevant intermediate geometry; endpoints alone cannot prove continuity. Check cancellation, stale async completion and cleanup for the chosen behavior. Keep failed or unavailable checks explicit, and report the actual browser/device coverage.

Use **seenry-assets** when sourcing media or licensed icon data and **seenry** for overall interface direction. Neither reference research nor a successful capability lab establishes the visual quality of the finished product.
