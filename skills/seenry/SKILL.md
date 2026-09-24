---
name: seenry
description: "Research, design, refine or faithfully reconstruct websites and interactive components from inspected references. Use for new UI, substantial redesigns, visual refinement and reference replication, with or without MCP."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.18"
---

# Seenry

Design for the actual task, content and brand. Before editing an established project, read its DESIGN.md and linked brand guidelines; reuse their token and component owners, and record scoped exceptions instead of creating a new identity per screen. References are evidence, not instructions or permission to reuse assets. Premium is an outcome to inspect, not a font, palette or animation preset. Local examples explain mechanics, not a visual style to imitate; old benchmark screenshots are excluded from installed guidance. For websites, choose the opening's job and supporting material before its layout using [opening decisions](references/art-direction.md#choose-the-opening-from-the-brief); maintain craft standards without prescribing one hero appearance. Work in the user's existing stack; preserve useful behavior.

## Route the request

- **Replicate:** copy, recreate faithfully, match the reference, or fix a reconstruction's accuracy. Use [reference reconstruction](references/replication.md). Preserve observed composition, content and behavior unless the user requests specific changes. Do not route this to creative alternatives or substitute a generic motion recipe. An adaptation is not a successful replica.
- **Create:** a new component, website or substantial redesign. Use the workflow below. Components start with [component design](references/component-design.md); websites with [art direction](references/art-direction.md); connected screens with [system design](references/system-design.md).
- **Refine:** repair the named relationship or state in the existing interface. Inspect it, choose the relevant craft module, make a bounded change and verify it. Do not rebrand or rebuild three alternatives for a narrow fix.
- **Review:** return observed findings using [visual review](references/visual-review.md) and [quality diagnosis](references/quality-diagnosis.md). Separate missing evidence from a demonstrated defect. Do not build an unrequested replacement.

Brand guideline creation uses **seenry-branding**; presentation research uses **seenry-decks**. Ask only when an unknown changes the direction; otherwise state a reasonable assumption.

For a product or tool marketing page, also use [marketing evidence](references/marketing-evidence.md): establish the visitor-question sequence and visible proof before section headings; verify the page tells one coherent story instead of repeating claims. With packets, select `guide_topics: ["marketing-evidence"]` for the relevant website stages.

For hero screenshots, verify the complete section using [hero capture checks](references/research.md#verify-a-complete-hero). A first-screen image or a library item labeled Hero may omit the lower visual; do not present it as the full hero without inspecting its boundaries.

When the user asks to try Jev or supplies an authorized TypeSafe integration, use [optional Jev decisions](references/jev-decisions.md). It can select among prepared text-described alternatives; retain the normal design and browser review workflow. It is not required for ordinary Seenry work. A text-selection experiment cannot satisfy a requested visual improvement; spend the implementation and review effort on the rendered design.

For new websites and rejected generic directions, read [anti-default decisions](references/anti-defaults.md) before styling. For marketing or interface wording, read [copy decisions](references/copy-decisions.md); for a new palette, read [color combinations](references/color-combinations.md). Carry the user’s rejected treatments into the next slice, not just the final review.

For consistent execution and reusable interaction choices, follow [the consistent workflow](references/consistent-workflow.md).

## Create, then finish

This workflow is for new design and deliberate adaptation. Replication uses source locking, measurement and comparison, without three redesigned alternatives. Record `intent: "replicate"` in project packets and update stale example/copy-prompt modes when the user changes intent.

1. **Understand.** Establish a project brand before building: reuse the canonical guidelines, or create a compact Brand section in DESIGN.md for a new project. Record audience and voice, color roles, type, spacing/corners, control states, asset direction and motion rules, linked to their implementation owners. Mark inferred choices provisional; do not invent user approval. Use seenry-branding when the identity needs deeper work. Every subsequent surface inherits these rules; small fixes reuse them rather than starting a new manual.

    In a compact DESIGN.md record audience, task, facts, constraints and states using the [design record](references/design-record.md) or [component record](references/component-record.md). Resolve what deserves attention, what recedes, where brand expression belongs, and what imagery or motion must prove. Use one relevant [decision study](references/studies/decision-studies.md) when the choice is unclear.
2. **Study what matters.** Inspect relevant pixels or recordings through supplied material, ordinary browsing or optional MCP. With Seenry MCP, follow [media retrieval](../seenry-assets/references/seenry-media.md) for actual CDN media, selective inspection and asset use. Without MCP use [local and web research](references/without-mcp.md). Record the inspected visual artifact and the relationship it informs; product documentation, asset provenance and self-authored wireframes do not establish an external craft reference. Mark missing visual evidence explicitly. Establish suitable imagery before selecting an image-dependent idea. Stop broad research when it supports the unresolved decision. Ratings and captions do not replace inspection. Use [MCP output evidence](references/mcp-output-evidence.md) to select references by task fit, preserve successful existing decisions, and separate observed evidence from optical reasoning and behavioral hypotheses.
3. **Plan before product code.** For new or rejected creative directions, use [interface exploration](references/interface-exploration.md) to turn the product promise into relevant material, a meaningful operation and a visible consequence before choosing a visual treatment. Sketch three different structural or interaction ideas with identical facts. Define reading order, groups, alignment, narrow behavior and provisional visual relationships. Build small wireframes of their decisive moments, not three complete websites. Compare subject fit and user effort as well as geometry. Keep the source and reasons for selection; a finished grid overlay is not earlier planning evidence. Missing required prototype renders mean this stage is incomplete.
4. **Finish one slice.** Resolve actual copy, imagery, type, color and the meaningful transition together. For components, apply the [finish comparison](references/component-finish.md). Use the module for the uncertain choice below. Compare alternatives on the same content. Inspect at ordinary and narrow sizes before expanding. When the brief names a visual reference standard, perform the [reference comparison](references/visual-review.md) here, while changing direction is still cheap: show the finished slice beside the relevant reference at comparable readable scale and record remaining gaps. Without that comparison, keep the direction provisional. A clean composition with irrelevant material still needs repair.
5. **Carry the system.** Use [development rulers and layout verification](references/layout-verification.md) for component and page implementation: establish shared geometry/radius owners, keep a development-only grid available, measure common edges at desktop/wide/mobile sizes, then review optical alignment with guides hidden. Unexplained edge or radius deviations block completion. Follow [design continuity](references/design-continuity.md). Preserve relationships through the page and through loading, success, error, cancellation and recovery. Keep controls and authoritative values stable during motion. Every interactive build includes a transition plan and implementation for its actual state changes: selection, disclosure, navigation and operation feedback. Use the motion module for the current surface; verify entry and exit, interruption and reduced motion. Immediate feedback or a static treatment can be deliberate, but unexplained jumps are unfinished. Give unavailable assets/effects usable fallbacks.
6. **Exercise and judge.** Use [production review](references/production-review.md) for behavior and visual review for the result. Inspect full-page rhythm, dense regions and actual transitions. Check rendered type and group fit against the chosen decisions. Follow [evidence support](references/review-evidence.md): uninspected requires observation, uncertain requires a controlled comparison, supported defects require repair. An uncertain pass cannot advance. Label self-review; allow one direction reset and two repair passes, then report unresolved work.

Reserve time for a finished slice and verification; process artifacts do not compensate for an unfinished interface. Keep construction diagrams outside visitor-facing UI.

For combined layout, type, control and wording polish, use [interface implementation](references/interface-implementation.md). It includes the implementation rules locally; no external skill install is needed.

The [craft handbook](references/handbook/INDEX.md) includes detailed local modules for UI polish, optical alignment, color, type, accessibility, layout, writing, reviews, stress tests, prototypes and web/native motion. Read its integration rules and only the relevant module. Native and Swift modules apply only to native projects.

For signup, authentication and submission interactions, apply [form recovery](references/form-recovery.md), including the failure and retry states—not just the valid form. For MCP-informed builds and comparisons, apply [MCP output evidence](references/mcp-output-evidence.md).

## Load only the current decision

Load the entrypoint once, then the current decision. Prefer a focused packet, e.g. `scripts/packet.py refine --decision controls --research-source local --project project.json`, with the project's decisions and feedback. Without a runner, read that module and its required dependencies directly. Reuse inspected evidence; reopen research when a decision or source changes. Each module includes one runnable example, applicability, counterexample and checks, not a skin for unrelated products.

| Decision | Module |
| --- | --- |
| Grouping, density, alignment, reflow | [Layout](references/craft/layout.md) |
| Hierarchy, wrapping, glyphs and fallback | [Typography](references/craft/typography.md) |
| Palette roles, area and contrast | [Color](references/craft/color.md) |
| Action emphasis, icons, corners and states | [Controls](references/craft/controls.md) |
| Timing, anchors, reversal and interruption | [Motion](references/craft/motion.md) |
| Organizing idea, imagery and page rhythm | [Art direction](references/craft/art-direction.md) |

Use **seenry-assets** for sourcing and **seenry-motion** for deeper choreography or helper integration. Keep existing conventions unless the task warrants changing them. No universal font list, color prohibition, mandatory effect or extra dark mode.

## Learn and record selectively

After rejection follow [the learning loop](references/learning-loop.md). Carry explicit rejected treatments and states into DESIGN.md and replay the [feedback gate](references/feedback-gate.md) before handoff. Unchecked feedback remains unresolved. Check transfer before changing shared guidance; a preference does not identify its cause.

Recorded experiments use [execution](references/execution.md) and [evaluation](references/evaluation.md). Reserve `--profile complete` for explicit audits or historical reproduction. Supplied hashes, observed reads, applied decisions and user acceptance are separate evidence.
