# Seenry workflow map

The five skills have distinct jobs. `seenry` owns interface direction, construction and review. `seenry-motion` handles behavior that changes over time. `seenry-assets` handles media and provenance. `seenry-branding` records identity rules. `seenry-decks` handles presentation research. Load the skill and focused reference needed for the current decision, rather than every guide at once.

## Create

1. Establish the user task, actual content, constraints and existing project identity. Record decisions in DESIGN.md.
2. Inspect references that answer a specific open question. Separate observed pixels or behavior from an interpretation.
3. Compare small working structural directions with the same facts. Finish one promising slice with real type, media, content and behavior.
4. Carry its relationships through the whole interface and its loading, error, recovery and narrow states.
5. Inspect the rendered result and normal-speed interactions. Repair observed defects and report remaining uncertainty.

## Replicate

Use the [replication guide](skills/seenry/references/replication.md). Lock the supplied reference and its known states, measure layout and interaction relationships, then compare the implementation against it at matching viewports. Preserve source-specific content and behavior. Record any unavailable source detail or proposed motion.

## Refine or review

A narrow request starts with the affected state and its current implementation. Read one relevant [craft module](skills/seenry/SKILL.md#load-only-the-current-decision), change the smallest relationship that resolves the defect, and verify it. A review reports observed findings and missing evidence without building an unrequested replacement.

## Evidence and tooling

MCP can supply references, but it is optional. The [offline route](skills/seenry/references/without-mcp.md) supports supplied screenshots, browser inspection and local prototypes. Optional [packets](skills/seenry/scripts/packet.py) bundle selected guides and resource hashes for staged work. A hash proves what was supplied, not what was understood or the quality of the final interface. The package validator and tests check structure and helpers; rendered review remains part of the workflow.
