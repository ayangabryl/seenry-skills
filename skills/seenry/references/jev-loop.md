# Bounded Jev-assisted design loops

Use when the user requests repeated Jev-assisted iteration. This is optional maintenance or project tooling. Read [Jev decisions](jev-decisions.md) for the live adapter and budget; [learning loop](learning-loop.md) governs promotion. More calls do not establish better visual judgment.

## Separate the two loops

**Project loop:** brief → inspected references → alternative structures → Jev selection → implementation → browser evidence → targeted repair → human review.

**Skill loop:** freeze current skill → propose one scoped change → render fresh tasks with both versions → independent comparison → retain or reject the change. Keep a counterexample where the proposed guidance should not apply. The author correcting a test output makes it assisted development, not independent evidence.

The coding agent creates alternatives and inspects pixels. Jev selects among explicitly described options and routes evidence gaps. Code handles hashes, limits, observable numerical checks and mapped actions. A person judges preference and acceptance. Neither a hash nor a supplied pass label establishes that inspection occurred.

## Freeze what a run means

Record the brief, user task, existing feedback, content/assets, reference source and inspection scope, criteria, skill version, implementation model, and resource budget before results. Preserve source and captures for each revision. Use the same content, tools and budget for a comparison. Do not silently change the criteria to favor a later candidate.

For reference-based quality, record relationships rather than a copied skin: dominant object, text hierarchy, content density, spacing rhythm, asset treatment, meaningful state transitions. Match the task and viewport. Inspect the entire hero boundary, readable body regions, footer and relevant behavior. A long thumbnail supplies page rhythm, not small typography evidence. Static screenshots do not establish motion quality.

## Spend calls on consequential decisions

A useful run can include these requests; skip controls that cannot affect this experiment:

1. **Diagnose:** provide actual observations with source, viewport/state, visible symptom and visitor consequence. Ask Jev to prioritize concrete interventions. Record the agent's baseline hypothesis before the call.
2. **Select a repair:** offer a few meaningfully different, feasible alternatives on the same content, including no-fit. Carry the previous selection and fresh evidence into this dependent request. Explain tradeoffs neutrally; do not disguise a preferred answer as the only sensible option.
3. **Check sensitivity:** reorder candidates for an important uncertain choice once. If the decision changes, compare the alternatives or obtain missing evidence; do not run votes until the preferred answer wins. Agreement is stability in this test, not correctness.
4. **Implement and inspect:** apply one bounded change. Test affected desktop/narrow states, keyboard use, real navigation, failure/recovery and any changed motion. Preserve observations that disagree with the hypothesis.
5. **Test boundaries:** batch independent fresh scenarios and counterexamples in one call, with expected routes recorded beforehand. Test no-fit and missing evidence. Text controls evaluate routing only; they do not replace rendered transfer tasks.
6. **Choose disposition:** give Jev the actual after-state and remaining gaps. Code still routes missing inspection to observation and supported defects to repair. Retain a candidate provisionally or revert; human acceptance stays separate.

Independent questions sharing state belong in one request; they cannot read each other's answers. A later dependent request must include the needed result explicitly. Never average unrelated aesthetic scores to hide a serious defect. Confidence is not a stop condition or a quality percentage.

## Checkpoint helper

Run the live request with `scripts/jev_decision.py`. After inspection, `scripts/jev_checkpoint.py` verifies request/result identity, artifact hashes and supplied check dispositions:

```sh
python3 scripts/jev_checkpoint.py /path/to/run/checkpoint.json \
  --request /path/to/run/request.json \
  --result /path/to/run/live-result.json \
  --output /path/to/run/gate.json
```

The checkpoint contains `repairs_used` (0–2), `resets_used` (0–1), `artifacts` with relative `path` and SHA-256, and distinct required `checks`. A check has `id`, `status` (`pass`, `fail`, `uncertain`, `uninspected`), observable `reason`, and an artifact `evidence` path for inspected states. All artifacts must exist beneath the checkpoint directory. Record all required checks before the run; dropping a failing check changes the evaluation.

Disposition order: supported failure → repair or stop at the repair limit; uncertainty/missing inspection → inspect or compare; abstention → agent review; otherwise → ready for human review. It never returns human acceptance or reference parity. It validates host-recorded evidence, not pixels, truthful attestations or actual execution history. Keep history with the repository's design-loop recorder when available.

Stop after the original time/call budget, two repair passes or one direction reset. Stop earlier when the affected checks pass and further changes lack evidence. Preserve unresolved gaps. Do not reset the pilot ledger; extending a paid experiment requires a deliberate budget/model/pricing review. No autonomous retry, publishing, broad reskinning or self-editing of shared skills follows from a Jev choice.

## What earns a shared default

A routing fixture passing is useful but insufficient. Render fresh, materially different briefs with frozen and candidate skills under equal conditions. Compare anonymous outputs, including hero-to-footer and meaningful interaction states, against task-relevant inspected references. Keep reviewer identity, preference, acceptance, regressions and cost separate. Reject both outputs when appropriate. Only promote a scoped rule after supported transfer and independent human review; otherwise keep it as a candidate study.

The first six-request development run is recorded in the source repository at `evals/jev-loop-run`. It repairs access to one inactive website preview and checks textual counterexamples. It does not establish consistent aesthetic parity with Seenry MCP references.

## Evidence from the larger experiment

Apply known truthfulness and functional requirements before semantic preference selection. Define observe, compare and no-fit as distinct outcomes for the current stage; preserve disagreements instead of converting repeated votes into approval.
