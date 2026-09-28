---
name: seenry
description: "Create, implement, refine, review or faithfully reproduce web interfaces and interactive components. Use for new websites or product UI, visual polish, motion-rich components and reference matches; references and MCP are optional."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.39"
---

# Seenry

Design for the actual task, content and brand. Preserve the user's stack and useful behavior. In an existing product, read DESIGN.md and linked brand rules before editing; reuse their token and component owners. References are evidence for decisions, not permission to copy assets. Local examples teach mechanics, not a default visual style. Start with this entrypoint and only the specialist needed for the current decision; a list of linked skills is not a reading assignment.

**Original website gate:** Before writing the first styled hero, read [Seenry Typography](../seenry-typography/SKILL.md) and [anti-default decisions](references/anti-defaults.md). Compare two opening compositions using the same real copy and material; at least one should avoid the familiar tracked-kicker/contrasting-italic/rule/caption stack. Choose by subject fit and the visible reading path, then render the first slice. On a browse, catalog or download page, prove the first real item and its action in the narrow opening; a claim about the collection cannot replace the collection. Give wide and narrow captures to a focused [Seenry Typography](../seenry-typography/SKILL.md) review and a [Seenry Review](../seenry-review/SKILL.md) of the complete task, using fresh review contexts when available. Ask both for a disposition. Repair a generic type direction or buried subject and recapture before expanding the page. If only self-review is possible, label the craft judgment provisional. This is a design checkpoint, not visitor-facing copy or proof of user acceptance.

When Codex CLI and the sibling review skills are installed, [the independent review gate](scripts/independent_review_gate.py) runs those two fresh reviews from a brief and wide/narrow screenshots. Add `--state name=image.png` for up to four connected or complete-material views when the default frame hides what must be judged; a split comparison alone cannot establish either complete option's craft. It returns a blocking result unless both say Keep. Inspect its findings, repair, recapture and run it again; a passing gate is still not user acceptance. Otherwise use the same two review questions in available fresh contexts.

## Route the request

- **Replicate:** faithfully match a supplied interface. Read [reference reconstruction](references/replication.md); check for usable source assets, styles and maintained implementation packages before tracing pixels or rebuilding an effect. Measure observed content, geometry and behavior in the final render. For local, text-heavy screenshots on macOS, use [text comparison](scripts/text_compare.swift) on named labels before claiming their typography matches. An adaptation is not a replica.
- **Screenshot-only link check:** visible link wording does not reveal its destination. For a replica without observed click behavior, run [link target inspection](scripts/link_targets.py) on the output HTML until it has no findings. Replace unknown links with styled buttons and truthful preview feedback; never leave invented `href` values behind click interception.
- **Create:** design a new component, page or connected screen. Components use [component design](references/component-design.md); interaction-led ones add [interactive component construction](references/interaction-components.md). Original websites use [art direction](references/art-direction.md) and the gate above; connected screens use [system design](references/system-design.md). Browsable catalogs and task-led product pages also use [product craft](references/product-craft.md) to keep the working material, metadata and actions visible.
- **Refine:** inspect the named defect and state, make a bounded repair, then verify it. Keep the existing identity unless change is requested.
- **Review:** use [Seenry Review](../seenry-review/SKILL.md) for a whole screen or flow, and [Seenry Change Review](../seenry-change-review/SKILL.md) for a named diff. Separate missing evidence from a proven defect.

For requested Seenry MCP research, use [MCP discovery](references/mcp-discovery.md) and read live schemas. For research without MCP, use [local and web research](references/without-mcp.md). Inspect actual pixels or recordings; a caption or rating cannot establish craft quality. Use [MCP output evidence](references/mcp-output-evidence.md) when comparing retrieved references.

## Create, then finish

1. **Lock the truth and task.** In a short DESIGN.md, record the person, object, decision, supplied facts, allowed fiction, unknowns, constraints and actual action outcomes. Cross-check facts against each other before rendering: times, participants, quantities, availability and status may contradict even within a supplied brief. Flag the conflict and use only supported claims. Follow [fact and action integrity](references/fact-action-integrity.md) for consequential claims and controls. Record existing brand and component owners; define new roles only when needed.
2. **Choose the decisive region.** Identify what the visitor must see, compare or change, and the state that proves the task works. For a product, show the working material, its competing choices and their consequences; for marketing, show the subject and credible proof. Inspect one or two relevant visual artifacts and name the transferable relationship, including observed motion if that is the task. A caption, rating or familiar brand is not visual evidence. When a reference is the quality target, use [reference transfer](references/reference-transfer.md) to compare its relevant region at delivery scale. Try a second structural idea when the first leaves a meaningful decision unresolved; do not fill a quota of prose concepts.
3. **Finish and render one slice.** Implement real content, hierarchy, type, color, control states and motion together in the actual surrounding layout. Capture wide and narrow views and the decisive before/change/settled/reverse states. Inspect at normal speed when movement matters; endpoints alone do not prove a transition. A legible type scale alone is not a distinctive direction. Keep authoritative values and controls stable through error and recovery. Use [seenry-motion](../seenry-motion/SKILL.md) for deeper choreography and [seenry-assets](../seenry-assets/SKILL.md) for sourced media. Expand to the remaining page or screens only after the slice works and looks intentional.
4. **Exercise and repair.** Test the main action and recovery with pointer and keyboard; inspect wide, narrow, full-page, focus, contrast, overflow after interaction, rapid reversal and reduced motion where relevant. Compare actual renders with the brief and named reference. Use [browser evidence](scripts/browser_evidence.mjs), [control inventory](scripts/control_inventory.mjs), [production review](references/production-review.md) and [visual review](references/visual-review.md) for the relevant failure, rather than reading all modules in advance. Repair supported defects and recapture. Treat source checks, self-review, fresh review and user acceptance as distinct evidence; report unrun checks.

**Finish check for text:** When the new page uses opaque hex colors, run `python3 scripts/token_contrast.py <page.html> [styles.css ...]` from this skill directory, or use its absolute path from the project. Run it on the actual delivered files before handoff, especially when a browser is unavailable. Review every flagged visible text pair on its real surface, repair measurable small-text failures, and rerun. Check accent labels and muted copy on each light or nested surface even when a page-background approximation reports a pass. Resolve false positives individually; they do not clear other pairs. This source check cannot certify transparent, image or gradient surfaces; browser review must inspect those. For named opaque pairs use [the pair checker](scripts/contrast_check.py). Do not describe unrun checks as passed.

**HTML semantics check:** Run `python3 scripts/semantic_names.py <page.html>` on delivered HTML. A generic `div` or `span` cannot take an accessible name without an appropriate role; meaningful art needs image semantics, decorative art can be hidden. This narrow check does not replace a browser audit.

**Reference text check:** On macOS, after the first equal-size source/output screenshot pair, run `swift <seenry-skill-dir>/scripts/text_compare.swift <source-image> <output-image>` for text-heavy replicas, replacing the placeholders with actual paths. Its automatic OCR inventory is diagnostic, never a pass: inspect unmatched lines and large x/y/width/height deltas, repair visible text, then use a named labels JSON with justified tolerances before claiming type geometry matches. On other systems, perform an equivalent text-aware comparison when available or report that text geometry remains unverified.

**Reference material check:** When a dominant shape is an isolated color family on a quiet surface, read [material field evidence](references/material-field-evidence.md) before editing the generator. Trace several measured inner and outer contour anchors from the source; choose geometry that can pass through them. A generic ellipse can flatten an irregular sweep. Compare source, output, masks and density previews at equal scale, then compare anonymized before/after renders without metrics. If the new render is not visibly closer, restore the prior version instead of reporting a repair. A close text match does not settle a visibly wrong material.

Keep construction diagrams out of visitor-facing UI. Process records cannot substitute for a finished, exercised interface. For a new site, resolve blocking first-slice review findings and review the complete result again. When the CLI gate is available, rerun it with `--scope full-page` and complete wide/narrow captures; this final review checks material below the fold that the opening gate cannot see. Repair supported findings and recapture. A builder's own rationale cannot clear a visible defect; use [evidence support](references/review-evidence.md) to distinguish inspection, comparison and repair, and report unresolved work.

## Load the module for the current decision

Read only the focused module needed now. A packet can select one, for example `scripts/packet.py refine --decision controls --research-source local --project project.json`; without a runner, read the module and its required links directly.

| Decision | Module |
| --- | --- |
| Grouping, density, reflow | [Layout](references/craft/layout.md) |
| Hierarchy, wrapping, fallback | [Typography](references/craft/typography.md) |
| Palette roles and contrast | [Color](references/craft/color.md) |
| Actions, icons, corners, states | [Controls](references/craft/controls.md) |
| Gesture or interaction-led component | [Interactive component construction](references/interaction-components.md) |
| Timing, anchoring, reversal | [Motion](references/craft/motion.md) |
| Imagery and page rhythm | [Art direction](references/craft/art-direction.md) |

For combined layout, type, controls and wording polish, use [interface implementation](references/interface-implementation.md). Keep existing conventions unless the task warrants a change; no universal font, palette or effect is required.

Direct specialist requests have their own entrypoints: [typography](../seenry-typography/SKILL.md), [color](../seenry-color/SKILL.md), [layout](../seenry-layout/SKILL.md), [accessibility](../seenry-accessibility/SKILL.md), [writing](../seenry-writing/SKILL.md) and [polish](../seenry-polish/SKILL.md). Load only the decisions the task needs. Use [variants](../seenry-variants/SKILL.md) for competing directions and [stress](../seenry-stress/SKILL.md) for one component's reachable states.

## Specific situations

- Working product UI, browsable catalogs and tools: use [product craft](references/product-craft.md) to establish task hierarchy, useful density and state relationships, then prove the system across a connected state and narrow view. When a craft target is named, compare its relevant product region rather than borrowing marketing framing.
- Product or tool marketing pages: use [marketing evidence](references/marketing-evidence.md) for the visitor's question sequence and visible proof. For websites, choose the opening's job and supporting material with [opening decisions](references/art-direction.md#choose-the-opening-from-the-brief). Inspect a complete hero with [hero capture checks](references/research.md#verify-a-complete-hero).
- Interface wording or a new palette: use [copy decisions](references/copy-decisions.md) or [color combinations](references/color-combinations.md). Reuse the user's rejected treatments as constraints.
- Signup, authentication and submission: use [form recovery](references/form-recovery.md), including failure and retry states, keyboard recovery, field descriptions and truthful async announcements. Expressive artwork can acknowledge real activity without displacing controls.
- Requested Jev or an authorized TypeSafe integration: use [optional Jev decisions](references/jev-decisions.md) among prepared alternatives. It does not replace rendered design work.
- Rejected work: use [the learning loop](references/learning-loop.md) and [feedback gate](references/feedback-gate.md). Record experiments with [execution](references/execution.md) and [evaluation](references/evaluation.md); source hashes, observed reads and user acceptance are distinct evidence.
