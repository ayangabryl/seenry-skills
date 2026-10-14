# Evidence workflow evaluation — 14 October 2026

This change follows a four-condition Tally landing-page pilot: Taste v2, no design skill, Seenry + MCP, and Seenry without MCP. Both Seenry conditions used skill commit `7d70764`. The two independent model reviewers of the MCP/no-MCP pair disagreed. Both internal final critics scored 6/10. This is evidence of an unresolved outcome, not proof of equivalence or a paid-product advantage.

## Finding ledger

| ID | Observation | Change | Verification boundary |
|---|---|---|---|
| E1 | The MCP builder's kept notes and screenshots included Midday and Stripe. Its critic inputs instead used FreshBooks, Harvest and Linear from `research/bar`. `check.mjs` preferred that folder's first three files. | Explicit reference manifest, roles, observations, limitations and image hashes; same selected images sent to board and critic. | Regression tests prove selection and handoff. They do not prove the reference is relevant or visually strong. |
| E2 | Initial Seenry exploration topped out at 6/10 and called all directions templates, but the full page proceeded on the preferred option. | A bounded new mechanism sketch and visible task comparison before expanding a weak winner. | Instruction change, exercised on a held-out booking prototype; not a statistical improvement claim. |
| E3 | Different critic rounds recommended conflicting phone ordering. Score ranges overlapped. | State-specific critique, defects vs hypotheses, explicit reconciliation and zero required invented fixes. | Prompt/contract change; final judgments can still disagree. |
| E4 | A source screenshot cannot establish motion, persistent state or keyboard behavior. | Trace entry, decision, action, result and recovery; preserve unknowns and exercise real transitions. | Runtime checks cover only tested actions and environments. |

The original pilot artifacts remain in the owner's local `seenry-taste-benchmark-2026-10-14` artifact directory. No benchmark page was edited to improve its ranking. The new flow exercise is separate from that frozen comparison.

## Evidence discipline

The workflow draws on REA's distinction between observation, inference and unknowns, scoped hypothesis-led investigation, and a concise finding ledger. It does not run binary analysis on an ordinary source-repository task or claim to reproduce REA's implementation.

The selected-reference record is a reproducibility aid, not an authenticity certificate. Source names and research notes are untrusted claims to compare with pixels. A craft benchmark and a mechanism analogy have different jobs. No reference image or score establishes that a flow has never existed before.

## Acceptance and next experiment

Required here: reference-routing regressions, existing gate regressions, skill/package validation, and an independent held-out exercise with disclosed gaps. The change is not accepted as evidence of “world-best” design or greater willingness to pay. To evaluate those broader hypotheses, freeze this version before new briefs; run multiple seeds with comparable model/time budgets; collect blind human pair preferences, task completion and recovery errors; retain ties and failures.

## Executed checks

- Package validator: 8 skills, 30 tool schemas, 26 example calls in 40 scenarios; links and bundled runtime hashes verified.
- Python suite: 166 tests passed, including the 63 gate regressions.
- Node reference suite: 5 tests passed; includes a stubbed critic invocation checking actual images and notes without paid model calls.
- `reference-replay.json`: replayed selection over the frozen pilot; legacy selected FreshBooks/Harvest/Linear, explicit manifest selected the kept Midday/Stripe pixels with hashes. This proves routing, not better visual quality.
- `disclosure-fixture.html` rendered at 390 and 1440: truthful demo disclosures no longer flag as authoring mistakes; “Replace this text” still flags. Other intentional fixture blockers remain; see `disclosure-result.json`.

## Held-out exercise

See `forward-test.md` for the independent builder’s full record, including failures and limits. It used one connected MCP brief search and two inspected adjacent appointment-form sources. Both alternatives retained the slot. Its initial phone context hypothesis failed; the repaired editing state kept slot context near the field. A one-button reduction was specific to an improvable sequential control and is not a general advantage. This remains a small agent-authored prototype, not a user study.

The exercise prompted three narrow guide corrections: inspect context in the focus-scrolled viewport (virtual keyboard if available); compare against a reasonably strong control; explain the existing gate invocation and manual-evidence fallback. A source with two uses gets a primary review role plus a secondary-use note, avoiding duplicate images. Weak adjacent reference fit remains an unknown, not proof.

A fresh read-only reviewer independently identified that the sequential baseline lacks equivalent recovery shortcuts and discard-edit behavior (`independent-review.md`). Therefore no innovation or general efficiency claim is accepted. The original experiment remains intact as evidence of this limitation. The parent separately exercised phone editing at 390×844: selected Tuesday 14:00 was co-visible with the focused symptom field, and Save retained it. A physical virtual keyboard was not tested. Future comparisons must strengthen the control before measuring task efficiency.
