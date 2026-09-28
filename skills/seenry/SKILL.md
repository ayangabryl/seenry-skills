---
name: seenry
description: "Create, implement, refine, review or faithfully reproduce web interfaces and interactive components. Use for new websites or product UI, visual polish, motion-rich components and reference matches; references and MCP are optional."
license: MIT
metadata:
  author: Seenry
  version: "2.1.0"
---

# Seenry

Design for the actual task, content and brand. Preserve the user's stack, useful behavior and explicit visual preferences. In an existing product, read DESIGN.md and linked brand rules first; reuse their tokens and component owners. References are evidence for decisions, not permission to copy assets. Local examples teach mechanics, not a default style.

## Route once

- **Create:** choose one primary track for the deciding region: [product craft](references/product-craft.md) for working tools and catalogs, [art direction](references/art-direction.md) for marketing and expressive pages, [system design](references/system-design.md) for connected app flows, or [component design](references/component-design.md) for one component. Use [interactive component construction](references/interaction-components.md) when its state or gesture is the main decision. Read another track only for a rendered problem it can solve.
- **Replicate:** use [reference reconstruction](references/replication.md); inspect source assets, styles and maintained packages before recreating an effect. Match observed content, geometry and behavior. A screenshot does not establish a link target: run [link target inspection](scripts/link_targets.py), and use truthful preview actions when destinations are unknown. For local text-heavy screenshots on macOS, use [text comparison](scripts/text_compare.swift) on named labels. An adaptation is not a replica.
- **Refine:** inspect the named defect and state, repair that surface, then verify it. Keep the established identity unless change is requested.
- **Review:** use [Seenry Review](../seenry-review/SKILL.md) for a whole screen or flow, or [Seenry Change Review](../seenry-change-review/SKILL.md) for a diff. Separate missing evidence from a proven defect.

For requested Seenry MCP research, use [MCP discovery](references/mcp-discovery.md) and live schemas. Otherwise use [local and web research](references/without-mcp.md). Inspect pixels or recordings; captions and ratings cannot establish craft or timing. Use [MCP output evidence](references/mcp-output-evidence.md) when comparing results.

## First-slice contract for original work

1. **Lock the brief.** In DESIGN.md record the audience, object, decision, supplied facts, allowed fiction, actual action outcomes, existing brand rules, and the user's rejected treatments. Write each rejection as a visible treatment to avoid. Cross-check consequential facts such as times, quantities, availability and status; use [fact and action integrity](references/fact-action-integrity.md) where claims or controls matter.
2. **Identify the decisive region.** Name what the visitor must see, compare or change and the state that proves the task works. On a product page, show working material and the consequence of a choice; on marketing, show the subject and credible proof. Research one or two relevant artifacts and name the transferable relationship. When a reference is a quality target, use [reference transfer](references/reference-transfer.md) at delivery scale.
3. **Render two materially different studies.** Use the same facts and real material. Change the subject, preview, reading order or interaction relationship that decides the page; moving only its surrounding container is insufficient. Capture each at wide and intended phone widths. Keep the rejected study and its visible reason. For a type-led opening, read [Seenry Typography](../seenry-typography/SKILL.md) and [anti-default decisions](references/anti-defaults.md) before choosing. Compare the *whole* type silhouette: a category label, oversized soft-serif promise and accented phrase may remain a generic editorial preset even after changing its font. A familiar sans-serif promise stack can likewise delay the first useful item on a phone. Keep a treatment only when the supplied identity or task gives it a visible advantage.
4. **Run the direction gate.** When Codex CLI is available, give [the direction study gate](scripts/direction_study_gate.py) the brief, named decision and four captures. `Revise`, `Reset` and `Unverified` block expansion. Repair and rerender the studies. If the gate is unavailable, record that the direction lacks independent review; do not call it cleared. A passing study still needs a complete rendered slice.
5. **Finish one slice in its real context.** Implement actual content, hierarchy, type, color, controls and relevant motion together. Name the page gutter, content grid and nested alignment owners; use [development rulers](references/layout-verification.md) to measure them, then turn the overlay off for optical review. Serve the prototype over HTTP. Capture wide, phone and decision states. Inspect movement at normal speed where timing matters. Use [seenry-motion](../seenry-motion/SKILL.md) for choreography and [seenry-assets](../seenry-assets/SKILL.md) for sourced material. Expand only after the slice works and looks intentional.
6. **Exercise and repair.** Test the main action and recovery with pointer and keyboard. Inspect narrow reflow, visible copy, focus, contrast, overflow after interaction, rapid reversal and reduced motion where relevant. Compare every chart, rail and status label with the meaning of its source values; a predicted threshold is not a confirmed operational state. Check that selected and expanded states describe the region visible at each width; use [Seenry Accessibility](../seenry-accessibility/SKILL.md) for responsive control relationships. Use [browser evidence](scripts/browser_evidence.mjs) if the browser tool is unavailable. A source check or self-review does not establish visual acceptance.

Use [the independent review gate](scripts/independent_review_gate.py) on the finished slice when Codex CLI and sibling critics are installed. Supply complete option or connected-state captures with `--state` when the default view conceals the decision. Both typography and whole-task critics must say Keep; otherwise repair and recapture. Use its `full-page` scope on the expanded page. When the gate cannot run, use the same questions in available fresh contexts and disclose the limit. Passing review is not user acceptance. Follow [delivery checks](references/delivery-checks.md) for the actual output.

## Open craft guidance for the decision at hand

| Decision | Read |
| --- | --- |
| Grouping, density and reflow | [Layout](references/craft/layout.md) |
| Font, type hierarchy and wrapping | [Typography](references/craft/typography.md) |
| Palette roles and contrast | [Color](references/craft/color.md) |
| Actions, icons, corners and states | [Controls](references/craft/controls.md) |
| Timing, anchoring and reversal | [Motion](references/craft/motion.md) |
| Imagery and page rhythm | [Art direction](references/craft/art-direction.md) |

For a combined repair, use [interface implementation](references/interface-implementation.md). Direct specialist requests have their own entrypoints: [typography](../seenry-typography/SKILL.md), [color](../seenry-color/SKILL.md), [layout](../seenry-layout/SKILL.md), [accessibility](../seenry-accessibility/SKILL.md), [writing](../seenry-writing/SKILL.md), [polish](../seenry-polish/SKILL.md), [variants](../seenry-variants/SKILL.md) and [stress](../seenry-stress/SKILL.md). Load only the guidance the task needs.

For a rejected result, carry the treatment, affected state and completion check through [the learning loop](references/learning-loop.md). Keep first-pass and repaired evidence separate using [evaluation](references/evaluation.md). Do not turn review notes into visitor-facing copy.
