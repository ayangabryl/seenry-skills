---
name: seenry-explain
description: "Explain how an observed web or app interface, interaction or animation works and why its design serves the task. Use for source studies and implementation breakdowns before building a distinct adaptation."
license: MIT
metadata:
  author: Seenry
  version: "2.1.0"
---

# Seenry Explain

Start from the supplied artifact or a bounded reference search. Inspect actual pixels; inspect video or live interaction when timing and state changes matter. A screenshot proves one visible state, not hover, scroll, responsiveness or code. Source CSS or repository code can establish implementation details only when actually available. Label inferred mechanics as inference.

Explain in three layers:

1. **Observed:** content, reading order, geometry, material, type roles, state changes and action path, with viewport or clip position.
2. **Reasoned:** how those choices may clarify the audience's task, express the identity or manage attention. Separate a plausible design rationale from a measured user or conversion result.
3. **Transferable:** the relationship or mechanism that could serve the user's brief, the material it requires, and what should change to avoid an unrelated imitation.

For animation, identify state owner, trigger, anchor, timing relationship, interruption, reversal and static equivalent only where the recording supports them. For app screens, inspect the flow order before explaining navigation; a screen collection is not proof of every possible path. For typography or color, distinguish observed appearance from exact font or token evidence.

Offer a small implementation sketch only when requested. Prefer the project's stack and a maintained source implementation when one is available. Do not trace a static image into elaborate code when an authorized package or source already provides the mechanism. In a full Seenry installation, [reference transfer](../seenry/references/reference-transfer.md) and [motion research](../seenry-motion/SKILL.md) deepen this route.
