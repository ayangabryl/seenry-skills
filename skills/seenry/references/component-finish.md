# Resolve the component's visual hierarchy

Use before expanding a new component and after a visual rejection.

## Separate information from presentation habits

Inventory the rendered heading, explanatory copy, metadata, choices, current state and commit action. For each extra label, dot, badge, divider, border or filled panel, name the distinct fact or relationship it communicates. Check whether nearby text, placement or a control already communicates it. Duplicate emphasis must demonstrate a benefit in a comparison, not merely have a possible justification.

A service name is not a brand system. Do not derive an entire palette or theme from a noun (a dental clinic becoming green, or a finance product becoming blue) without supplied identity or tested visual evidence. A heading should name this task; a promotional promise above a routine operation needs a reason to be there.

## Render a controlled finish comparison

Keep a copy of the current direction. Make one subtraction variant with identical facts, choices and behavior. Remove only unsupported emphasis: duplicate headings, decorative status marks, irrelevant mottos, unexplained image treatments or competing enclosures. Preserve focus, meaningful selection, unavailable states and recovery. In that comparison keep the palette and layout fixed; don't claim to know which change helped if everything changed.

Inspect both at their intended product footprint, not a full-screen marketing showcase. Record the actual component width, heading size and first actionable control position. If a routine task needs a billboard heading, large brand masthead or an oversized summary card to look finished, test a compact host-sized composition before accepting it. The current value is supporting context unless comparing it is the primary task; do not make its filled area dominate the choices by habit. Record what becomes easier or harder to locate: the current object, the choice and the action. Pick one winner or reject both. When palette remains unresolved, make a separate same-composition comparison using its actual color areas. For an unbranded utility include an achromatic control treatment as a comparison, not a mandatory final style.

## Finish every consequential state

Before accepting a representative slice, render its primary action in the review state and its settled result. For an unresolved finding, select [typography](craft/typography.md), [controls](craft/controls.md) or [motion](craft/motion.md); load only the guide needed for that decision. Check ordinary-case labels, computed type roles, explicit icon dimensions, action-row fit, stationary choice feedback and necessary boundaries. The initial screen cannot stand in for the confirmation screen. Capture each at the intended desktop footprint and a narrow width.

## Evidence required

Retain before/after captures at the same viewport/state and a short decision tied to visible differences. Exercise the changed control's transition, including reversal and focus. Missing captures mean unverified finish. “Calm,” “premium,” “editorial,” and “clean” are intentions, not observations.

Subtraction alone cannot establish a strong concept or professional validation.

## Verify the chosen decisions, not the rationale

Carry a small project `design-checks.json` into implementation. Define selectors for the task title, supporting text, action labels and repeated groups, with the actual type limits selected from the specimen. With a browser host, `scripts/decision_check.cjs` checks `type`, `fit` and `stationary-hover` rules. A `fit` rule checks text fragments against their group and against each other; page overflow alone cannot catch collisions. `singleLine` is appropriate for short action labels, not descriptions. Hidden matches are unobserved until that state is exercised.

Example project rule: `{ "kind": "type", "selector": ".task-title", "maxSize": 26, "maxWeight": 600, "maxTrackingEm": 0.02, "case": "sentence" }`. These values describe one compact utility decision, not every Seenry design. A matched contract does not prove that the decisions were good. Keep the human visual gate.

If implementation contradicts the selected specimen, repair it or explicitly reopen that decision with a rendered alternative. Do not silently describe a 52px bold title as compact typography. If required construction captures are missing, report workflow incomplete; written alternatives are not rendered prototypes.
