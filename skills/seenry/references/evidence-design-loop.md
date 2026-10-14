# Evidence that changes the design

Use for new surfaces and substantial redesigns. Keep this inside the existing brief, idea and reference notes; do not create a parallel paperwork workflow for a small edit. Research and critique are useful only when they change a visible decision.

## Follow the user's unfinished job

Describe one real task as **entry → decision → action → result → recovery**. Name the information the person needs at each point, what remains in memory, and how they return or correct a mistake. A marketing page has a flow too: understand the promise, inspect proof, decide whether the offer fits, take the next step. Do not invent product capabilities to make a demo impressive.

Find the most expensive uncertainty in that path: an unclear consequence, missing context, repeated entry, an irreversible action or a weak promise. Make a design hypothesis: “If we keep X visible while the person does Y, they can judge Z without returning to the previous screen.” Test that relationship in a small working slice before extending the page. Originality should remove a real burden; surprising navigation or novel gestures are costs unless their benefit is demonstrated.

## Research the decision, not a look

Ask a focused question about that uncertainty. Inspect a relevant reference's pixels and, only when behavior matters, the available sequence or recording. Record:

- **Observed:** the exact source, frame/state and visible relationship. Measured values retain their source and viewport. An estimated gap is not a CSS token.
- **Inferred:** why that relationship might help this task; alternatives remain possible.
- **Proposed:** what this product will do differently, and the smallest interaction that could disprove its usefulness.
- **Unknown:** missing states, unavailable motion, untested keyboard behavior or unsupported outcomes.

A screenshot proves appearance in that state, not persistence, navigation or a complete flow. A negative library search means the bounded query found nothing; it does not mean the pattern has never existed. Adapt a mechanism across domains only after identifying its useful relationship, not its decorative shape.

## Keep evidence attached to its decision

Save inspected images locally and write `.seenry/refs/manifest.json` alongside `kept.md`. It selects the actual images for the board and critic, so generic live-site captures cannot silently replace MCP evidence. Use `version: 1` and an `entries` array. Each entry has `id`, `path` (relative to the manifest), `role` (`craft` or `mechanism`), `source`, `observation`, `application`, and `limitations`. Optional `state` identifies the captured viewport and interaction state. The default selection retains up to three entries, reserving a place for each role present; explicit `--refs` keeps its supplied order and overrides the manifest.

```json
{
  "version": 1,
  "entries": [
    {
      "id": "R1",
      "path": "reference.png",
      "role": "craft",
      "source": "Public reference URL or stable Seenry asset ID",
      "observation": "At the captured desktop width, the primary value dominates the supporting rows.",
      "application": "Make the decision-critical value easy to compare; retain our own identity.",
      "limitations": "Only this still state was inspected; behavior is unknown."
    }
  ]
}
```

Use `craft` for comparable finish/hierarchy and `mechanism` for a relationship borrowed to solve the task. Include both when both informed the design; a mechanism crop is not a whole-page craft benchmark. When one image serves both, choose its primary review role and describe the secondary use in `application`; do not duplicate the image to fill slots. Put the strongest relevant entries first and keep the set small. Record stable IDs/public URLs, never credentials or expiring signed URLs. The review writes `reference-evidence.json` with the selected files and hashes. Run the existing `check.mjs <file-or-url> --brief BRIEF.md --mode quick` from the project to use this default manifest, or pass `--manifest <path>`. Check the selected record when diagnosing a review: omitted evidence was not judged. A lightweight manual exercise may retain a clearly labeled author record instead, but must not present it as an automated or independent judgment. Legacy folders still work but are explicitly identified as fallback evidence.

## Choose by demonstrated consequence

Render alternatives that change what the person understands or does, not merely accent, type or placement. Keep a reasonably strong familiar control for comparison: preserve the same capabilities and recovery shortcuts, and do not add unnecessary steps just to make the proposal win. For each alternative, demonstrate the same task with the same content and ask: what became clearer, what effort disappeared, and what new confusion appeared? A silent walk-through should reveal the idea without the designer's explanation.

When the pick calls every option a template (or all overall scores are 6 or lower), do not automatically expand its least weak winner. Revisit the uncertainty, change the mechanism and make one bounded additional sketch. Compare it to the best original before committing. In quick mode this replaces polishing time, not an unlimited new loop. If neither demonstrates a benefit, use the clearest familiar version and report originality as unresolved. In polish/showcase mode use the existing direction budget; no infinite score chasing.

## Resolve critique against observed states

For each consequential finding, record the viewport/state, visible evidence, the user problem, the proposed change and its acceptance check. Distinguish a defect, a design hypothesis and a taste preference. Preserve good work when changing one decision.

If reviewers disagree, reproduce the same state before acting. “Move the editor above the list” and “show all choices before editing” can describe different tasks. Choose using the task's information dependency and test that choice; do not alternate blindly between instructions. A one-point model-score change is not proof of improvement. Keep the prior capture, and compare the same content/state after the repair. Do not claim hidden controls fail or behaviors work based on still images.

## Verify the flow, then judge the finish

Exercise the working slice from entry through result and recovery, with keyboard, narrow layout and reduced motion when relevant. Verify the real consequence: selected context stays correct, edits survive intended navigation, cancellation is safe, errors explain a recovery, and no fake success is shown. For a claim that context stays visible, inspect the actual viewport after focus or scrolling, not just DOM presence or a full-page capture. Check with the on-screen keyboard when available; otherwise retain that limit. Only claim what was actually exercised.

Then verify the frozen design against the brief and explicitly selected references within the selected mode’s existing budget. For a benchmark or a claim of improvement, use a fresh independent comparison separate from the critic that generated repairs; ordinary quick-mode delivery does not add another judge. Report functional results, visible strengths/gaps, evidence coverage and unresolved hypotheses separately. A clean automated gate is not proof of exceptional taste. For claims of improvement, use unseen briefs, comparable budgets and repeated independent comparisons; one attractive example does not establish general superiority.
