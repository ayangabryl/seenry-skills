# Review what a visitor sees

Use a fresh authorized review context where available. Supply the actual brief, known facts, anonymous rendered alternatives and interaction evidence. Withhold the author's narrative, internal typography rationale and condition labels until the decision is recorded. Reviewers must not invent tests or infer motion timing from stills.

First inspect the ordinary opening viewport and a narrow viewport. Then inspect the full sequence and relevant states. A compressed full-page image is useful for rhythm but can conceal weak imagery, small type, unnecessary borders and text-heavy openings.

Evaluate five criteria independently:

| Criterion | Observable questions |
| --- | --- |
| `subject` | Can a visitor tell what this offers? Is the visible content about the actual business or the agent's production process? Is scope truthful? |
| `opening` | Is there a dominant, specific idea with visible supporting substance? Does the intro bury the useful work? |
| `hierarchy` | Is the reading order clear at actual size? Do type, whitespace and copy density balance across the sequence and narrow layout? |
| `material` | Does the artwork have enough detail and scale? Are surfaces, corners, borders, icon weights and control proportions resolved as a family of related objects? |
| `interaction` | Do actual demonstrations support the intended experience? Are repeated input, keyboard, feedback and reduced motion verified where relevant? |

For each, record `pass`, `revise`, `fail` or `unverified`, cite an actual artifact and describe the observable reason. These are reviewer judgments, not instrument measurements. “Swiss dossier,” “premium,” “intentional” and “clean grid” are not evidence. An author can invent a rationale for almost any default.

A candidate with unresolved `revise`, `fail` or `unverified` criteria cannot be labeled ready. You can name a direction to continue repairing, but keep `selected` null until an acceptable candidate exists. Do not average weak visual work away with strong correctness. If every option fails subject/opening, use the direction reset rather than applying cosmetic edits to the same structure. At the repair ceiling, preserve the result as needs-revision; do not silently redefine success.

Use subtraction comparisons for disputed decoration: remove the numbered eyebrow, repeated outline or redundant paragraph while keeping the rest fixed. Inspect whether information or useful affordance was lost. This establishes a scoped regression, not a ban on all numbers, boxes, colors or fonts.

For an executable disposition check, use `scripts/review_gate.py REPORT.json --root RUN_DIRECTORY`. It checks that cited artifacts exist and that the selected candidate actually passed the recorded criteria. It does not inspect pixels, validate the truth of judgments or confer user acceptance. The JSON shape is:

```json
{"candidates":[{"id":"A","checks":{"subject":{"result":"pass","artifact":"evidence/A.png","observation":"Describe visible evidence."},"opening":{},"hierarchy":{},"material":{},"interaction":{}},"blocking_issues":[]}],"selected":null}
```

Fill every check with the same three fields. The reviewer may reject all alternatives. Compare the repaired result against the same brief and criteria; never claim human approval until it is actually given.
