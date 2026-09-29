---
name: seenry-review
description: "Review a web interface, a UI diff or a single component and return ranked, fixable findings. Use for design critique, UI audits, accessibility checks, reviewing a branch or PR for interface impact, stress-testing one component across states and sizes, or explaining how an observed interface or animation is built."
license: MIT
metadata:
  author: Seenry
  version: "3.0.0"
---

# Seenry Review

Judge what renders, not what the code intends. Every finding is visible, specific, ranked and comes with the smallest fix. Use the rules in the [Seenry system](../seenry/SKILL.md) as the standard: grid and spacing, per-component type limits, concentric radii, one accent, consistent page shell, and the [anti-slop list](../seenry/references/anti-slop.md).

If you built the surface yourself, say so and treat the verdict as self-review. A fresh agent context is better.

## Choose the mode

| The user asks | Mode |
| --- | --- |
| "Review / critique / audit this page, screen or site" | **Screen review** |
| "Review this branch / PR / commit / my changes" | **Change review**: run `git diff` against the base, list changed UI surfaces, render them before and after, review only those |
| "Stress test / break this component" | **Stress test** |
| "Is this accessible / WCAG" | **Screen review**, accessibility pass only, with [the checklist](../seenry/references/accessibility.md) |
| "How was this built / explain this interaction" | **Explain** |

## Screen review

1. **Render.** Open the page at 1440 and 390 (plus 320 for overflow). Screenshot each. Exercise the main action with pointer and keyboard.
2. **Measure.** Run [the system audit](../seenry/scripts/system_audit.mjs) at both widths. Record totals: font sizes, weights, families, radii, shadows, off-grid values, nested radius violations, components over limit, horizontal overflow. Toggle the [grid overlay](../seenry/assets/layout-guides/README.md) to check shared edges.
3. **Look in this order**, because earlier failures make later ones moot:
   - **Job and hierarchy.** Within 5 seconds, is it clear what this is, for whom, and what to do next? Is the primary action the most prominent control?
   - **Material and anchors.** Real images, icons and data, or placeholders? Does every element align to an edge or center line of another, or do some float? Is there one dominant element and one detail layer? Use the studio critique in [exploration](../seenry/references/exploration.md#4-critique-like-a-studio).
   - **Layout.** Shared content edges, section rhythm, grouping (2x rule), reading order, phone reflow.
   - **Type.** Family count, sizes and weights per component and page, display weight and tracking, line length, wrapping.
   - **Color and surface.** Accent area and roles, contrast, elevation choices, radius family and concentricity.
   - **Components and states.** Hover, focus, active, disabled, loading, empty, error, overflow.
   - **Content.** Specific or generic copy, realistic data, claims with proof.
   - **Accessibility.** Keyboard path, focus visibility, names, contrast, targets, zoom, reduced motion.
4. **Compare** against a reference when useful: with Seenry MCP, pull the same page type from 2–3 strong sites (`search_references` with `page_type`, or `list_sites` + `get_design`) and name the specific relationship that differs. See [benchmarks](../seenry/references/benchmarks.md).

## Report format

One table, ranked by severity, one row per root cause, every location listed:

| Sev | Where | Now | Change to | Why |
| --- | --- | --- | --- | --- |
| High | `Hero.tsx:14` | h1 72px / 800 / 0 tracking / 1.2 | 56px / 500 / −0.03em / 1.05 | Heavy default display reads as template; see benchmarks |
| High | pricing, 390px | tiers overflow, horizontal scroll | stack tiers, CTA full-width | content hidden at supported width |
| Med | `Card.tsx:8` | radius 16 with 12 inset, image radius 16 | image radius 4 | non-concentric corners |

- **High**: blocks the task or hides content/actions at a supported size, fails contrast or keyboard, or reads immediately as generated.
- **Med**: harms hierarchy, consistency or clarity.
- **Low**: polish.

Then: system audit totals at both widths, what was verified, what was not verified (motion, screen reader, device), and a one-line verdict: **Ship**, **Fix then ship** (Med only) or **Block** (any High). Do not rewrite the page unasked; offer to apply the fixes.

## Change review

Scope to the diff. For each changed component or page: render the affected states at both widths before and after (use `git stash` or a worktree for the before), run the system audit on both, and report regressions first (new sizes, weights, radii or colors that are not tokens; off-grid values; broken states), then improvements. Flag hard-coded values that bypass tokens by file and line.

## Stress test

Render the component alone on a scratch page and put every realistic variant on screen at once:

- Content: empty, 1 character, typical, 2x long, 5x long, unbroken string (URL, email), emoji and CJK, RTL if supported, missing image, 0 / 1 / 99+ / 1,000,000 counts, negative numbers.
- States: default, hover, focus-visible, active, disabled, loading, error, success, selected, expanded.
- Containers: 240, 320, 390, 768, 1200 wide; 200% zoom; increased text spacing.
- Input: mouse, keyboard only, touch emulation, rapid repeated clicks, reversal mid-transition.

Screenshot the grid of variants, run the system audit and [text collisions](../seenry/scripts/text_collisions.mjs), and report failures in the table format. Delete the scratch page afterwards unless asked to keep it.

## Explain

Describe what is observed, then how it is likely built, then why it works for the task. Separate observed from inferred. For a live site, read the DOM and computed styles; for motion, record or step through frames at normal speed (a screenshot never proves timing). With Seenry MCP, `get_page_motion` and `get_design` give recordings and measured styles. End with how to adapt the mechanism to the user's product without copying brand assets.
