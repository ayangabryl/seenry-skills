# Resolve the component's visual hierarchy

Use before expanding a new component and after a visual rejection.

## Separate information from presentation habits

Inventory the rendered heading, explanatory copy, metadata, choices, current state and commit action. For each extra label, dot, badge, divider, border or filled panel, name the distinct fact or relationship it communicates. Check whether nearby text, placement or a control already communicates it. Duplicate emphasis must demonstrate a benefit in a comparison, not merely have a possible justification.

A service name is not a brand system. Do not derive an entire palette or theme from a noun (a dental clinic becoming green, or a finance product becoming blue) without supplied identity or tested visual evidence. A heading should name this task; a promotional promise above a routine operation needs a reason to be there.

## Render a controlled finish comparison

Keep a copy of the current direction. Make one subtraction variant with identical facts, choices and behavior. Remove only unsupported emphasis: duplicate headings, decorative status marks, irrelevant mottos, unexplained image treatments or competing enclosures. Preserve focus, meaningful selection, unavailable states and recovery. In that comparison keep the palette and layout fixed; don't claim to know which change helped if everything changed.

Inspect at the intended product footprint. Record component width, heading size and first action position. Test an oversized routine interface inside a compact host before accepting it. Supporting context should not dominate the choices unless comparison is the task. Compare how easily people can locate the object, choice and action; either variant can fail. Resolve palette separately on identical geometry and actual color areas. For an unbranded utility, an achromatic control variant is informative, not mandatory styling.

## Finish every consequential state

Before accepting a representative slice, render its primary action in the review state and its settled result. For an unresolved finding, select [typography](craft/typography.md), [controls](craft/controls.md) or [motion](craft/motion.md); load only the guide needed for that decision. Check ordinary-case labels, computed type roles, explicit icon dimensions, action-row fit, stationary choice feedback and necessary boundaries. The initial screen cannot stand in for the confirmation screen. Capture each at the intended desktop footprint and a narrow width.

Treat the component as a family of real content states. Alongside seeded content, render one user-created item, one missing optional field or asset, and the longest credible label. A person with a name and email has two distinct facts; an email-only person needs one identity line, not the same address twice. Preserve alignment without inventing a name or meaningless subtitle. Apply this distinction to files without titles and products without images too.

Plan each mutation as **unchanged / changed / entering / leaving**. Unchanged names, avatars and triggers retain their nodes and positions. Changed values update in place; only entering items get entrance motion. Choose a stable anchor for any necessary expansion. Compare the whole family at the same footprint, including an open control, focus/error treatment, undo and the settled result. Read-only facts must remain visibly different from actions. Typography, insets, icon weight and surface emphasis should form one system across these states, not independent polish patches.

## Evidence required

Retain before/after captures at the same viewport/state and a short decision tied to visible differences. Exercise the changed control's transition, including reversal and focus. Missing captures mean unverified finish. “Calm,” “premium,” “editorial,” and “clean” are intentions, not observations.

Subtraction cannot establish professional quality. Repeated rejection of composition calls for a [structural reset](quality-diagnosis.md#reopen-a-rejected-composition), not more surface edits. For an orderly but unfinished form, use the [component-family study](studies/component-family.md#when-clean-still-looks-unfinished). Resolve object, choice and action relationships before adding effects; geometry checks cannot choose a good composition.

## Verify the chosen decisions, not the rationale

Carry a small project `design-checks.json` into implementation. Define selectors for the task title, supporting text, action labels and repeated groups, with the actual type limits selected from the specimen. With a browser host, `scripts/decision_check.cjs` checks `type`, `fit` and `stationary-hover` rules. A `fit` rule checks text fragments against their group and against each other; page overflow alone cannot catch collisions. `singleLine` is appropriate for short action labels, not descriptions. Hidden matches are unobserved until that state is exercised.

Example project rule: `{ "kind": "type", "selector": ".task-title", "maxSize": 26, "maxWeight": 600, "maxTrackingEm": 0.02, "case": "sentence" }`. These values describe one compact utility decision, not every Seenry design. A matched contract does not prove that the decisions were good. Keep the human visual gate.

If implementation contradicts the selected specimen, repair it or explicitly reopen that decision with a rendered alternative. Do not silently describe a 52px bold title as compact typography. If required construction captures are missing, report workflow incomplete; written alternatives are not rendered prototypes.

For selection/disclosure regressions, the [feedback gate](feedback-gate.md) documents `state-change` checks for geometry, node identity, focus and closed height.

For content-dependent defects, `contained-media` checks `img` and `svg` against a declared frame; `distinct-text` compares declared fields within each item. Example: `{ "kind": "distinct-text", "selector": ".identity", "fields": [".name", ".email"] }`. A missing optional field is allowed. Use these only where duplication or overflow has no intended role. Run after adding real content; a check over seeded rows cannot cover a missing-asset fallback. Record visual acceptance separately from these mechanical checks.
