# Review what a visitor sees

Use a fresh authorized review context where available. Supply the actual brief, known facts, anonymous rendered alternatives and interaction evidence. Withhold the author's narrative, internal typography rationale and condition labels until the decision is recorded. Reviewers must not invent tests or infer motion timing from stills.

First inspect the ordinary opening viewport and a narrow viewport. Then inspect the full sequence and relevant states. A compressed full-page image is useful for rhythm but can conceal weak imagery, small type, unnecessary borders and text-heavy openings.

Give the next action as **visible observation → consequence for this task → suspected cause → smallest useful change → recheck**. Start with the most consequential unresolved decision. Wrong product facts need a content correction; a weak organizing idea needs layout/material alternatives; a contour defect needs a local geometry correction. Do not spend another complete generation on an issue a focused edit can resolve. For missing evidence, observe the existing source before changing it. “Make it more premium” is not an actionable repair instruction.

Before deciding content is missing, inspect actual scroll traversal and the relevant tab, expansion or dialog states. A full-page screenshot does not trigger those states. Keep the initial view, subsequent views and their action sequence separately; the initial experience still matters. Compare every candidate with evidence appropriate to its proposed interaction. An unexercised dynamic candidate needs observation, not a speculative redesign into a static layout. A demonstrated inaccessible or persistently empty state remains a defect.

For a completed build, also reopen the selected surface renders at equivalent widths. Name which leading material, scale, grouping and interaction relationships survived expansion. A final page may change appropriately as content is added; assess whether the new hierarchy serves the brief rather than accepting a larger page automatically. Record visual drift separately from implementation correctness. A private author style rationale cannot substitute for this comparison.

Evaluate five criteria independently:

| Criterion | Observable questions |
| --- | --- |
| `subject` | Can a visitor tell what this offers? Is the visible content about the actual business or the agent's production process? Is scope truthful? |
| `opening` | Is there a dominant, specific idea with visible supporting substance? Does the intro bury the useful work? |
| `hierarchy` | Is the reading order clear at actual size? Do type, whitespace and copy density balance across the sequence and narrow layout? |
| `material` | Does the artwork have enough detail and scale? Are surfaces, corners, borders, icon weights and control proportions resolved as a family of related objects? |
| `interaction` | Do actual demonstrations support the intended experience? Are repeated input, keyboard, feedback and reduced motion verified where relevant? |

For each, record `pass`, `revise`, `fail` or `unverified`, cite an actual artifact and describe the observable reason. These are reviewer judgments, not instrument measurements. “Swiss dossier,” “premium,” “intentional” and “clean grid” are not evidence. An author can invent a rationale for almost any default.

For an explicitly creative or expressive request, keep craft and the organizing idea distinct. Under `opening`, name the visible composition, treatment of real material or useful interaction that contributes a particular character to this task. Clear alignment and an identifiable photograph support usability and subject fit; they do not by themselves establish that the requested creative idea is resolved. The creator's theme name cannot supply what the artifact lacks.

Check that distinction while alternatives are still inexpensive. For creative briefs, set `concept_review: true` in the recorded project and construction review manifest. Wireframe/type reviews then assess `concept` separately from content, hierarchy and geometry: what visible relationship between the subject, objects and actions makes this direction worth developing? An ordinary utility brief can retain the three construction checks. Unfinished material and motion are expected at this stage; do not require unfamiliar controls or final polish to pass. Final review still uses the five criteria above, including `opening`.

This can be quiet. A carefully resolved object/control relationship can contribute more than another effect. Do not demand unfamiliar controls, decorative metaphors, extra capabilities or an animation engine. Deliberate familiarity may fully satisfy a precise utility or established product system. When the requested idea remains weak, record `opening: revise` and the observable shortfall. If its defining transition has not been shown, mark it unverified and request that evidence. A new accent or softer outline alone does not resolve an absent idea.

This distinction is a review aid, not a validated automatic taste score. In one development calibration it flagged an ordinary preview/form composition for a creative brief while retaining its opening for a utility brief; other hierarchy and evidence concerns remained. Broader preferences and false alarms still need calibration.

Distinguish **missing evidence** from an **observed defect**. If completion feedback has not been exercised or motion has not been watched, request that observation before prescribing new code. Record `issue_type: missing-evidence` on the unresolved criterion. Use `issue_type: observed-defect` when the evidence demonstrates a problem. A model's inability to view a recording does not prove the transition is broken; it leaves that review pending. Do not consume repair passes inventing changes to satisfy an observation gap.

A candidate with unresolved `revise`, `fail` or `unverified` criteria cannot be labeled ready. You can name a direction to continue repairing, but keep `selected` null until an acceptable candidate exists. Do not average weak visual work away with strong correctness. If every option fails subject/opening, use the direction reset rather than applying cosmetic edits to the same structure. At the repair ceiling, preserve the result as needs-revision; do not silently redefine success.

Use subtraction comparisons for disputed decoration: remove the numbered eyebrow, repeated outline or redundant paragraph while keeping the rest fixed. Inspect whether information or useful affordance was lost. This establishes a scoped regression, not a ban on all numbers, boxes, colors or fonts.

When prior feedback names repeated labels, competing color or excessive enclosure, first transcribe the relevant visible elements and give each its actual information/interaction job. Compare those observations with the scoped feedback before judging the whole. Do not excuse an observed recurrence with a general claim that the hierarchy is clear. An optional browser-side `scripts/visual_inventory.mjs` captures text/style/geometry and boundary observations; supply it beside screenshots, never as an automatic quality score. At intermediate checkpoints, unimplemented later behavior is expected, but unresolved content and typography defects belong to the current checkpoint.

Before prescribing a quieter badge, dot, bar or container, identify the information it conveys and whether another element already communicates it. Review **remove, retain, then redesign** in that order; removal is a comparison, not an automatic verdict. Separate current item, playback/activity state and keyboard focus. Preserve necessary state feedback, accessible names and focus visibility. Redundant encoding can be useful when it prevents reliance on color alone.

Inspect every supplied candidate and viewport before recording the blocking issues. Include all observed manifestations of the same cause in one repair pass; do not discover a visible desktop manifestation only after prescribing its mobile fix. Distinct verified functional defects can be fixed together. For an ambiguous visual cause, use one controlled change at a time to learn its effect. If proposing alternatives, mark them as mutually exclusive; “bar or tint” must not become bar plus tint plus stronger type. Compare the repaired states at ordinary and narrow sizes before accepting them. A softer border or lower opacity does not demonstrate that the original hierarchy problem was resolved.

For an executable disposition check, use `scripts/review_gate.py REPORT.json --root RUN_DIRECTORY`. It checks that cited artifacts exist and that the selected candidate actually passed the recorded criteria. It does not inspect pixels, validate the truth of judgments or confer user acceptance. The JSON shape is:

```json
{"candidates":[{"id":"A","checks":{"subject":{"result":"pass","artifact":"evidence/A.png","observation":"Describe visible evidence."},"opening":{},"hierarchy":{},"material":{},"interaction":{}},"blocking_issues":[]}],"selected":null}
```

Fill every check with the same three fields. The reviewer may reject all alternatives. Compare the repaired result against the same brief and criteria; never claim human approval until it is actually given.

Each `artifact` value names one actual file. Use observations to mention supplementary evidence; do not join filenames with punctuation. `review_request.py` prepares the same evidence roles and five criteria for every candidate. Preserve malformed responses and use a separately recorded format-only retry when necessary; never silently change result values during normalization.

When reviewer reliability is uncertain, use the [visual lesson and probe workflow](visual-lessons.md). Test order consistency and whether its rendered repair preserves useful information. Reviewer fluency is not evidence of accurate selection.

When inspecting controls, separate the accessible action label from the visible mark. `visual_inventory.mjs` records selected text-symbol glyphs and visible SVG/image counts inside controls. Use those observations to catch provisional icon substitutes that survived construction. Mathematical or textual symbols can be correct; this is not an automatic rejection rule. An SVG count alone does not establish library provenance, optical quality or a working transition.


A fresh context does not inherit prior feedback. Carry relevant scoped observations and their captures through the review packet, using `calibration_topics` when a built-in case applies. Ask whether the same issue is observable in the current artifact; do not assume it is. Keep source feedback, authored teaching hypotheses and current judgments labeled separately. A calibration case is neither a target composition nor a universal rule. For a construction review set the explicit phase; for a finished artifact retain all five criteria and actual interaction evidence.
