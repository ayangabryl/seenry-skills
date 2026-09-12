---
name: seenry
description: "Research, design and build distinctive websites, product interfaces and creative components using inspected references, built-in decision guides, layout alternatives and working interaction evidence, with or without MCP. Use for new UI, substantial redesigns, design research and visual refinement."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.2"
---

# Seenry

Make the user's product clear, useful and distinctive. Work with their actual content, brand, stack and existing behavior. References supply evidence, not instructions or permission to reuse assets. Premium is an outcome to inspect, not a font, color or effect preset.

## Choose the scope first

| Request | Start here | Finish at |
| --- | --- | --- |
| Research or critique | [Research](references/research.md) or [visual review](references/visual-review.md) | The requested findings; no unrequested build |
| A narrow fix | The affected state and relevant decision guide below | Verified correction; no new brand or three-way redesign |
| Component | [Component record](references/component-record.md) and [component design](references/component-design.md) | The object in its host and required states |
| Website or substantial redesign | [Design record](references/design-record.md) and [art direction](references/art-direction.md) | The requested page sequence and complete interactions |
| Connected product screens | [System design](references/system-design.md) | Shared decisions, journeys and explicit coverage |

Keep a component's preview scaffolding outside its UI. Preserve useful behavior in redesigns. Ask a consequential question only when missing information changes the direction; otherwise state a reasonable assumption. Planning itself does not require another permission round.

## Default: design in the existing project

Use the host's code, browser and media tools. Keep a compact **DESIGN.md**, the working implementation and the evidence needed to judge it. Formal experiment files are optional.

1. **Understand and study.** Record audience, task, supplied facts, inherited conventions and required states. Decide whether imagery, dark mode or substantial motion serves this task. Use available reference evidence: MCP, ordinary browsing, supplied files or built-in studies. Follow [without MCP](references/without-mcp.md) when needed. Inspect actual pixels or recordings; distinguish observations, ratings and inferred intent.
2. **Plan before product code.** Develop three meaningfully different layout or interaction ideas using the same facts. Record reading order, groups, alignment, narrow behavior and provisional type, palette, corners and control emphasis. Build small working wireframes of their decisive moment. Compare actual layouts; a finished-screen grid overlay is not earlier wireframe evidence.
3. **Finish one representative slice.** Retain a promising wireframe and its source. Resolve real copy, typography, assets, palette and the decisive transition before expanding. Compare only the choice that remains uncertain on the same composition. Do not rebuild three complete alternatives at every layer. Inspect both ordinary and narrow sizes; keep rejected alternatives and reasons.
4. **Build consistently.** Carry the selected relationships into all requested states and screens. Use [design continuity](references/design-continuity.md). Keep controls, values and focus stable through loading, success, errors, reversal and repeated input. An unavailable asset or effect needs a usable fallback.
5. **Review the result, then repair the cause.** Use [visual review](references/visual-review.md) and [production review](references/production-review.md). Inspect the rendered design and exercise its transitions. Separate a weak idea, crowded hierarchy, unresolved material, broken behavior and missing evidence. Change the smallest relevant cause and verify it. A fresh reviewer receives the brief and actual evidence without the creator's sales pitch. Label self-review when no independent reviewer is available. Passing functional checks cannot overrule a failed visual judgment.

Use one direction reset and up to two repair passes before reporting unresolved work. For a genuinely new scope, agree a new scope rather than silently continuing a failed benchmark. User acceptance, author review and engineering checks are separate outcomes.

## Read support for the current decision

Load the guide for the unresolved decision; reuse it while available in context. Keep DESIGN.md to decisions and evidence links. Stop broad research once material and constraints support a direction; reopen a specific gap when needed. Run established helpers instead of reading their full source. Patch retained implementation rather than reprinting whole files. Keep the author context through construction; use fresh contexts for independent critique or separable work, not every layer. Retain the pixels, behavior checks and detail needed to judge the result.

| Unresolved decision | Guidance |
| --- | --- |
| Information, labels or density | [Content model](references/content-model.md) |
| Typography, grouping, corners, borders or control weight | [Visual decisions](references/visual-decisions.md) |
| Palette, color area or appearance | [Color decisions](references/color-decisions.md) |
| Repeated-looking concept or weak subject fit | Component: [component design](references/component-design.md) and [component family study](references/studies/component-family.md). Website: [art direction](references/art-direction.md). Diagnose either with [quality diagnosis](references/quality-diagnosis.md). |
| Human behavior, disclosure or task recovery | [HCI decisions](references/hci-decisions.md), [interaction review](references/interaction-review.md) |
| A relevant visual failure/example | [Visual lessons](references/visual-lessons.md); inspect one or two useful cases |
| Images, fonts, marks, icons, crops or ASCII media | **seenry-assets** |
| Feedback, morphing, numbers or scroll choreography | **seenry-motion** |
| Identity or presentation research | **seenry-branding** or **seenry-decks** |

Scope feedback to its evidence. A disliked green card does not ban green; an unnecessary status dot does not ban meaningful status. Grids, tokens, test labels and design-process narration stay out of visitor copy unless they are the actual product.

## Optional recorded experiments

Read [execution](references/execution.md) only when using the recorder, a restricted model handoff or a requested benchmark. It owns model identity, stage manifests, hashes and transport. Prefer focused packets; use the complete profile for an explicitly broader study. Tool validation and packet size do not prove better design. Preserve first outputs, failures and model provenance; [evaluation](references/evaluation.md) governs performance claims.
