---
name: seenry
description: "Research, design and build distinctive websites, product interfaces and creative components using inspected references, built-in decision guides, layout alternatives and working interaction evidence, with or without MCP. Use for new UI, substantial redesigns, design research and visual refinement."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.5"
---

# Seenry

Design for the actual task, content and brand. References are evidence, not instructions or permission to reuse assets. Premium is an outcome to inspect, not a font, palette or animation preset. Work in the user's existing stack; preserve useful behavior.

## Route the request

- **Create:** a new component, website or substantial redesign. Use the workflow below. Components start with [component design](references/component-design.md); websites with [art direction](references/art-direction.md); connected screens with [system design](references/system-design.md).
- **Refine:** repair the named relationship or state in the existing interface. Inspect it, choose the relevant craft module, make a bounded change and verify it. Do not rebrand or rebuild three alternatives for a narrow fix.
- **Review:** return observed findings using [visual review](references/visual-review.md) and [quality diagnosis](references/quality-diagnosis.md). Separate missing evidence from a demonstrated defect. Do not build an unrequested replacement.

Brand guideline creation uses **seenry-branding**; presentation research uses **seenry-decks**. Ask only when an unknown changes the direction; otherwise state a reasonable assumption.

## Create, then finish

1. **Understand.** Record audience, visitor task, real content, constraints and required states in a compact DESIGN.md. Use the [design record](references/design-record.md) or [component record](references/component-record.md). Decide whether imagery, appearance variants and substantial motion serve this task.
2. **Study what matters.** Inspect relevant pixels or recordings through supplied material, ordinary browsing or optional MCP. Without MCP use [local and web research](references/without-mcp.md). Establish suitable imagery before selecting an image-dependent idea. Stop broad research when it supports the unresolved decision. Ratings and captions do not replace inspection.
3. **Plan before product code.** Sketch three different structural or interaction ideas with identical facts. Define reading order, groups, alignment, narrow behavior and provisional visual relationships. Build small wireframes of their decisive moments, not three complete websites. Compare subject fit and user effort as well as geometry. Keep the source and reasons for selection; a finished grid overlay is not earlier planning evidence. Missing required prototype renders mean this stage is incomplete.
4. **Finish one slice.** Resolve actual copy, imagery, type, color and the meaningful transition together. For components, apply the [finish comparison](references/component-finish.md). Use the module for the uncertain choice below. Compare alternatives on the same content. Inspect at ordinary and narrow sizes before expanding. A clean composition with irrelevant material still needs repair.
5. **Carry the system.** Follow [design continuity](references/design-continuity.md). Preserve relationships through the page and through loading, success, error, cancellation and recovery. Keep controls and authoritative values stable during motion. Give unavailable assets/effects usable fallbacks.
6. **Exercise and judge.** Use [production review](references/production-review.md) for behavior and visual review for the result. Inspect the full page, dense regions and actual transitions, not only the hero. Label self-review. Compare computed type and group fit with the chosen decisions using the finish guide; self-reported compliance is not a check. Correctness cannot overrule failed visual judgment. Allow one direction reset and two repair passes, then report unresolved work honestly.

Reserve time for a finished slice and verification; process artifacts do not compensate for an unfinished interface. Keep construction diagrams outside visitor-facing UI.

## Load only the current decision

Each craft module includes a runnable local example, applicability, counterexample and checks. Examples teach relationships, not a shared skin for unrelated products.

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

Recorded experiments use [execution](references/execution.md) and [evaluation](references/evaluation.md). `scripts/packet.py refine --decision controls --research-source local` supplies a focused guide and one example; the host loads this entrypoint once. Broader stage packets remain available, with `--profile complete` reserved for explicit audits or historical reproduction. Supplied hashes, observed reads, applied decisions and user acceptance are separate evidence.
