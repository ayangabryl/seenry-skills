---
name: seenry-motion
description: "Research or implement web interactions using Seenry recordings, creator references, and source studies. Use for hover, drag and gesture controls, scrolling, transitions, and component animation; distinguish observed motion from static screenshots."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.39"
---

# Design movement around a real change

Start with the user's task and the existing product. Keep its working behavior, content, brand and runtime. Motion should explain an action, relationship or change of state. MCP, paid accounts and another design skill are not required.

**For a whole page or product screen:** apply the sibling [Seenry design workflow](../seenry/SKILL.md) before code: establish the facts and visual system, choose a direction, finish one real slice, then review wide and narrow renders. Motion craft does not replace typography, layout, copy or contrast. A focused component added to an existing page can stay here.

## Define the interaction

Use [the motion contract](references/motion-contract.md) to name the trigger, real state owner, stationary anchor, feedback, settled result and interruption. Choose one owner for each animated property. Keep controls and authoritative values stable through loading, success, error and recovery. For a faithful recreation, read [motion reconstruction](references/replication.md), preserve observed geometry and timing, and label unmeasured behavior as proposed. An adapted animation is not a replica.

Before implementing a named effect from a live library or component, check [existing implementation routing](references/existing-implementations.md). Use its maintained package or CLI when the license, stack and behavior fit; do not hand-draw a weaker stand-in to avoid checking. For original work choose the smallest capable mechanism. CSS, SVG or Web Animations are enough for many transitions; use an existing Lottie, GSAP, Anime.js, Motion or Three.js runtime only for a demonstrated need and verify its installed API. Read [implementation decisions](references/implementation-decisions.md) for easing, interruption, hover gating and reduced motion. For deeper mechanics use [motion craft](references/motion-craft.md) and [interaction anatomy](references/interaction-anatomy.md).

| Requested change | Focused route |
| --- | --- |
| Action menu or short status label | Original [action menu](assets/action-menu/README.md), [status switch](assets/status-switch/README.md) and [product transitions](references/product-transitions.md). If the menu is asked to animate open and closed, preserve its surface through the closing phase; conditional unmount on close skips that phase. For a status transition, move the text in a reserved slot; a plain text replacement or dot-color change alone is incomplete. The application owns the real action. |
| In-flow disclosure or changing geometry | Original [expanding card](assets/expanding-card/README.md), [geometry helper](references/adapters.md) and [surface patterns](references/patterns/surfaces.md). Preserve focus and retarget from current geometry. |
| Focused modal task | Original [modal surface](assets/modal-surface/README.md) and [surface patterns](references/patterns/surfaces.md). Use a native dialog for top-layer and focus behavior; allow the exit to finish before closing, and make reversal cancel the pending close. |
| Changing number or icon | [Number transitions](references/number-transitions.md) and [adapters](references/adapters.md). For a small integer count, prefer the original count-pop helper over rebuilding digit semantics. Keep one real accessible value; do not hide every digit and put `aria-label` on a plain `<strong>`. A digit transition needs per-place motion; keep units anchored. |
| Live voice input or output | Original [voice presence](assets/voice-presence/README.md) accepts application-owned state and a normalized audio level. Keep controls and announcements in the DOM; a generated demo signal is not microphone activity. |
| Loading or process presence | Original [signal field](assets/signal-field/README.md), [boundary trace](assets/boundary-trace/README.md) and [loading patterns](references/patterns/loading.md). Animation time is not progress. |
| Decoded image or expressive material | Original [image reveal](assets/image-reveal/README.md), [reflective solid and rim surfaces](assets/reflective-surface/README.md), [pointer tilt](assets/pointer-tilt/README.md), [surface effects](references/surface-effects.md) and [expressive effects](references/expressive-effects.md). Keep useful content while a replacement loads; use reflection and tilt only where the material has a purpose. |
| Toast or banner stack | [Feedback patterns](references/patterns/feedback.md) and original [notification reducer](assets/notification-state.mjs). Remove overflow from active state before its exit; test the fourth event in a three-item stack. |
| Occasional completed milestone | Original [confirmation burst](assets/confirmation-burst/README.md). Record success in application state first, then play the finite decoration; the settled result must remain visible after it clears. |
| Selected tabs or ordered page change | Original [selection surface](assets/selection-surface-demo.html) for a shared highlight and [directional stage](assets/directional-stage/README.md) for related views; the application owns selection, panels, route and history. Use [navigation patterns](references/patterns/navigation.md) for other structures. |
| Scroll or a coordinated system | [Scroll choreography](references/scroll-choreography.md), [worked scores](references/worked-scores.md), [system choreography](references/system-choreography.md) and the [motion index](references/patterns.md). |

Select only the guide and helper needed for this change. The bundled original assets are reusable starting points, not automatic substitutes for a named source component or proof of fidelity to it. Keep licenses with any copied third-party runtime; the original Seenry assets use the repository's MIT license.

## Research the observed behavior

When matching a supplied reference, inspect playback at normal speed and useful intermediate frames, not only endpoints. [Motion research](references/research-route.md) explains recordings, Seenry MCP, creator studies and source limits; load it only when research is needed. A static image cannot establish timing, interruption or keyboard behavior. Without playback, implement a proposed treatment and test it locally.

**Recorded phase check:** Match source checkpoints to the running browser animation. State jumps verify endpoints, not timing. See [motion reconstruction](references/replication.md).

## Finish the interface and transition

Account for every requested transition: trigger, moving element and property, settled state, and reduced-motion result. Test normal speed, rapid input, reversal, keyboard/touch, resize, live reduced motion, unmount and failure where applicable. Inspect actual intermediate geometry; a reserved slot or immediate update does not fulfill a requested number animation. Report unavailable checks rather than inferring a pass.

**Whole-page text check:** inspect text contrast on actual wide and narrow renders. If the page uses opaque CSS colors, run the sibling offline audit on the delivered files: `python3 <seenry-skill-dir>/scripts/token_contrast.py index.html [styles.css ...]`, replacing the placeholder with the real path. Repair failed small-text pairs and rerun. The source audit approximates page backgrounds; transparent, image and nested surfaces still need rendered review. Do not report contrast as checked when this step was skipped.

Use **seenry-assets** for sourced media and **seenry** for overall interface direction. Neither a working helper nor a capability lab proves the quality of the finished product.
