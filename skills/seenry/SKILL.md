---
name: seenry
description: "Create, implement, refine, review or faithfully reproduce web interfaces and interactive components. Use for new websites or product UI, visual polish, motion-rich components and reference matches; references and MCP are optional."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.35"
---

# Seenry

Design for the actual task, content and brand. Preserve the user's stack and useful behavior. In an existing product, read DESIGN.md and linked brand rules before editing; reuse their token and component owners. References are evidence for decisions, not permission to copy assets. Local examples teach mechanics, not a default visual style.

## Route the request

- **Replicate:** faithfully match a supplied interface. Read [reference reconstruction](references/replication.md); measure observed content, geometry and behavior. An adaptation is not a replica.
- **Create:** design a new component, page or connected screen. Components use [component design](references/component-design.md); interaction-led ones add [interactive component construction](references/interaction-components.md). Websites use [art direction](references/art-direction.md); connected screens use [system design](references/system-design.md).
- **Refine:** inspect the named defect and state, make a bounded repair, then verify it. Keep the existing identity unless change is requested.
- **Review:** report observed issues through [visual review](references/visual-review.md) and [quality diagnosis](references/quality-diagnosis.md). Separate missing evidence from a proven defect.

For requested Seenry MCP research, use [MCP discovery](references/mcp-discovery.md) and read live schemas. For research without MCP, use [local and web research](references/without-mcp.md). Inspect actual pixels or recordings; a caption or rating cannot establish craft quality. Use [MCP output evidence](references/mcp-output-evidence.md) when comparing retrieved references.

## Create, then finish

1. **Set the system.** Establish audience, task, facts, constraints, states and brand rules in the project's DESIGN.md or a compact [design record](references/design-record.md). Separate facts, allowed fiction and unknowns; map actions to real targets with [fact and action integrity](references/fact-action-integrity.md). Without a working booking path, link to details and report the missing hookup in the handoff, never visitor copy. For new work, define color roles, type, spacing, controls, imagery and motion; mark inferred choices provisional. Preserve the system on later screens. Use [seenry-branding](../seenry-branding/SKILL.md) for deeper identity work.
2. **Choose the direction.** Inspect a relevant visual artifact and state what relationship it informs. For new websites or rejected generic work, use [interface exploration](references/interface-exploration.md) and [anti-default decisions](references/anti-defaults.md) before code. Compare different structural or interaction ideas with the same facts. Build a small rendered slice of the decisive moment; if a reference standard is named, compare at readable scale while direction can still change.
3. **Build one finished slice.** Resolve real copy, imagery, hierarchy, color, layout and state transitions together. Use [component finish](references/component-finish.md) for components. Keep controls and authoritative values stable through loading, success, error and recovery. Use [seenry-motion](../seenry-motion/SKILL.md) for deeper choreography and [seenry-assets](../seenry-assets/SKILL.md) for sourced media. Carry relationships and shared geometry through the rest of the interface with [design continuity](references/design-continuity.md) and [layout verification](references/layout-verification.md).
4. **Exercise and repair.** Inspect the actual wide and narrow renders, full-page rhythm, text contrast, focus, sticky occlusion, and the requested transitions, including exit, rapid input and reduced motion. Match each prominent label to its `href`, handler and result; verify the meaning of displayed numbers against the brief. Use [production review](references/production-review.md) and [visual review](references/visual-review.md). Repair supported defects before handoff; if a named reference was supplied, compare the rendered result to it. Report checks that could not run rather than inferring a pass.

**Finish check for text:** When the new page uses opaque hex colors, run `python3 scripts/token_contrast.py <page.html> [styles.css ...]` from this skill directory, or use its absolute path from the project. Run it on the actual delivered files before handoff, especially when a browser is unavailable. Review every flagged visible text pair on its real surface, repair measurable small-text failures, and rerun. Check accent labels and muted copy on each light or nested surface even when a page-background approximation reports a pass. Resolve false positives individually; they do not clear other pairs. This source check cannot certify transparent, image or gradient surfaces; browser review must inspect those. For named opaque pairs use [the pair checker](scripts/contrast_check.py). Do not describe unrun checks as passed.

**HTML semantics check:** Run `python3 scripts/semantic_names.py <page.html>` on delivered HTML. A generic `div` or `span` cannot take an accessible name without an appropriate role; meaningful art needs image semantics, decorative art can be hidden. This narrow check does not replace a browser audit.

Keep construction diagrams out of visitor-facing UI. Process records cannot substitute for a finished, exercised interface. Use [evidence support](references/review-evidence.md) to distinguish inspection, comparison and repair; label self-review and report unresolved work.

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

## Specific situations

- Product or tool marketing pages: use [marketing evidence](references/marketing-evidence.md) for the visitor's question sequence and visible proof. For websites, choose the opening's job and supporting material with [opening decisions](references/art-direction.md#choose-the-opening-from-the-brief). Inspect a complete hero with [hero capture checks](references/research.md#verify-a-complete-hero).
- Interface wording or a new palette: use [copy decisions](references/copy-decisions.md) or [color combinations](references/color-combinations.md). Reuse the user's rejected treatments as constraints.
- Signup, authentication and submission: use [form recovery](references/form-recovery.md), including failure and retry states, keyboard recovery, field descriptions and truthful async announcements. Expressive artwork can acknowledge real activity without displacing controls.
- Requested Jev or an authorized TypeSafe integration: use [optional Jev decisions](references/jev-decisions.md) among prepared alternatives. It does not replace rendered design work.
- Rejected work: use [the learning loop](references/learning-loop.md) and [feedback gate](references/feedback-gate.md). Record experiments with [execution](references/execution.md) and [evaluation](references/evaluation.md); source hashes, observed reads and user acceptance are distinct evidence.
