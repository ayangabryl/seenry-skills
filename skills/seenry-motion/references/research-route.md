# Research motion evidence only when needed

Use supplied recordings or public evidence when reconstructing or comparing a treatment. Follow [video study](video-study.md) for normal playback and bounded local frame/contact-sheet extraction with timestamps and provenance. A poster cannot establish timing, easing, keyboard behavior or interruption. Without playback, label timing as proposed and test it locally.

If Seenry MCP is connected, `search_references(motion=true,site=...)` and `get_page_motion(id,viewport)` find website journeys. For creator studies use `get_design_taxonomy`, `search_designs(family="motion",...)` and `get_design_video`; collections may expose clips through `get_design_reference` and `get_reference_asset`. `search_curated_references` supports `motion` and `walkthroughs` families. Read review reasons, then inspect the clip. Ratings do not prove suitability.

Check recording coverage, duration, cadence, observed unique frames and warnings. Do not confuse encoded frame rate with capture fidelity or a partial journey with a complete one. Distinguish observed behavior from inferred implementation. For research deliverables include source, clip interval, applicable behavior and limitations. An offline task can proceed using the bundled behavior guides.
