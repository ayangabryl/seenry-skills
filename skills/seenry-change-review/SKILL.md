---
name: seenry-change-review
description: "Review the interface impact of a branch, pull request, commit or uncommitted UI change. Use when the user names a diff rather than asking for a general screen review."
license: MIT
metadata:
  author: Seenry
  version: "2.1.0"
---

# Seenry Change Review

Resolve the exact diff and its base before judging. Identify changed components, styles, copy, assets and states, then trace where they render. Include adjacent surfaces affected by shared tokens or components. Do not review the entire legacy product as though every old issue were introduced by this change.

Inspect before and after renders at relevant widths and states. For a motion change, observe normal-speed entry, exit, interruption and reduced motion. For a copy or visual change, read and inspect the final pixels. Run focused checks for behavior and accessibility that the change could alter. When a preview cannot run, distinguish source-level risk from a verified rendered defect.

Use [Seenry Review](../seenry-review/SKILL.md) to judge the affected surfaces. Keep domain ownership clear: typography, color, layout, accessibility, writing or control finish. Classify each finding as introduced, regression, pre-existing or unverified. One shared cause is one finding even when several screens show it. Report file and line where source evidence exists, the observed screen state, impact and a practical repair. A broken primary task or inaccessible action outranks cosmetic drift.

A review request is read-only unless the user also asks for a fix. If implementing findings, preserve the initial captures and rerun the checks after repair. A passing build or test suite cannot by itself prove the changed design is better.
