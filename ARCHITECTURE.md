# Seenry workflow map

The original five skills own deliverables: `seenry` builds web interfaces, `seenry-motion` handles behavior over time, `seenry-assets` handles media and provenance, `seenry-branding` records identity, and `seenry-decks` handles presentation research. `seenry-apps` handles connected mobile screens in the project's platform. Directly invokable craft skills own typography, color, layout, accessibility, writing and visual polish. They are useful for a narrow request without loading a full site-building workflow.

`seenry-review` judges a rendered screen or flow; `seenry-change-review` judges the impact of a named diff. `seenry-variants` produces candidates, `seenry-stress` tests one component's reachable states, and `seenry-explain` studies an observed source. These are different operations. The entrypoints are deliberately specific so an agent can select one rather than loading every domain skill by default.

For an original page, `seenry` still owns the full result. It must route the first type-led opening through `seenry-typography` and the first rendered slice through `seenry-review`, then resolve blocking findings before expanding. The review compares real wide and narrow pixels; a checklist, font name, source rating or self-authored rationale cannot certify quality. A dedicated skill makes a domain discoverable, but does not guarantee that a model applies it. Tests must inspect the model's actual reads and final artifact.

## Create

1. Establish the user task, actual content, constraints and existing project identity. Record decisions in DESIGN.md.
2. Inspect references that answer a specific open question. Separate observed pixels or behavior from an interpretation.
3. Compare small working structural directions with the same facts. Finish one promising slice with real type, media, content and behavior. Inspect its type composition and remove unearned labels or decoration.
4. Carry its relationships through the whole interface and its loading, error, recovery and narrow states.
5. Independently inspect the first rendered slice and later the complete result at ordinary and narrow sizes. Exercise normal-speed interactions. Repair supported defects and report remaining uncertainty.

## Replicate

Use the [replication guide](skills/seenry/references/replication.md). Lock the supplied reference and its known states, measure layout and interaction relationships, then compare the implementation against it at matching viewports. Preserve source-specific content and behavior. Record any unavailable source detail or proposed motion.

## Refine or review

A narrow request starts with the affected state and its current implementation. Invoke the relevant craft skill directly or read one [craft module](skills/seenry/SKILL.md#load-the-module-for-the-current-decision), change the smallest relationship that resolves the defect, and verify it. A review reports observed findings and missing evidence without building an unrequested replacement.

## Evidence and tooling

MCP can supply references, but it is optional. The [offline route](skills/seenry/references/without-mcp.md) supports supplied screenshots, browser inspection and local prototypes. Optional [packets](skills/seenry/scripts/packet.py) bundle selected guides and resource hashes for staged work. A hash proves what was supplied, not what was understood or the quality of the final interface. The package validator and tests check structure and helpers; rendered review remains part of the workflow. For a reference study, inspect actual media and record source, viewport, observed relationship, adaptation and limits. Do not bundle source screenshots or signed media URLs into the skill.
