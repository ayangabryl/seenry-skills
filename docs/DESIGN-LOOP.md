# Evidence-driven design loops

This is an optional maintainer tool, not a dependency for ordinary Seenry use. It adapts the replay idea in [Dream-RSI](https://arxiv.org/abs/2609.14858): retain evaluated branches, compare exploration order on that history, and spend new generation budget only where evidence is missing. It does not reproduce that paper's experiments, train model weights, predict unseen renders, or prove aesthetic improvement.

## Product loop

Freeze a brief, model/configuration, criteria and time ceiling before the first attempt. Preserve source, prompt/resource hashes, renders, transitions, functional results, cost and user feedback. Use existing stage adapters for generation and browser evidence; this recorder does not silently invoke a model or spend tokens. Start with one diagnosis, one controlled alternative and an independent review context given the brief and anonymous rendered evidence, without the author's rationale. Review may reject both. Permit at most two repair passes and one direction reset within the original budget. Stop with pending/incomplete status when evidence or time is exhausted.

Model critique and human acceptance are different fields. Functional correctness cannot override rejection. A retained alternative remains provisional until the human gate passes. Never infer human acceptance from relative preference.

```sh
python scripts/design_loop.py init --out history.json --criteria criteria.json --brief 'Reschedule an appointment'
python scripts/design_loop.py record --history history.json --node node.json
python scripts/design_loop.py replay --history history.json --policies policies.json --budget 1200
```

A node is a recorded attempt, with an earlier parent or null. `action` is the proposed intervention recorded before its result, not a retrospective success label. Cost includes generation and review time consistently. Store measured usage and model details as extra fields. Artifact paths are resolved and hashed during recording. Append a child revision rather than replacing an existing source. A criteria change starts a new experiment.

```json
{"id":"finish-1","parent":"initial","action":"object-hierarchy","cost_seconds":180,"functional":"passed","acceptance":"pending","reviewer":"model","artifacts":["candidate.html","review.json"],"hypothesis":"Integrate ordinary context with the changing object","model":"gpt-5.6-luna"}
```

Policies specify only action priority and stopping behavior. They cannot sort candidates by unknown outcomes. Parents must have been visited, and costs must fit the replay budget. Chronological ordering is the baseline.

```json
[{"name":"chronological","priority":[],"stop_on_acceptance":true},{"name":"structure-first","priority":["object-hierarchy","typography","motion"],"stop_on_acceptance":true}]
```

Replay is a traversal of recorded branches. It cannot substitute a different prompt/model and pretend the stored output would be identical. Historical repairs with host feedback must remain labeled assisted/development evidence. Missing rejected branches bias the available history. With no accepted output, no replay policy has demonstrated success. Do not choose a winner just because it stops sooner.

## Skill-development loop

Keep the production skill frozen. Propose a scoped guidance or routing change based on recorded failures. Screen exploration priorities against history; confirm any promising strategy with real generation on a new brief. Keep a counterexample where the lesson should not apply. Compare to the frozen version with equal budgets and tools. Preserve rejected candidates and promote only after functional, human-acceptance, preference and regression gates pass.

```sh
python scripts/design_loop.py promotion-check --evidence transfer.json
```

Required booleans: `fresh_brief`, `counterexample_checked`, `critical_checks_passed`, `human_accepted`, `preferred_over_frozen`, `no_critical_regression`. This reports eligibility for maintainer review; it never edits skills or publishes. These are host-supplied attestations, not a security boundary or independent evidence verification. Link their underlying artifacts in the record.

## Evaluation stays independent

Freeze task completion, geometry/accessibility tolerances and the visual review questions. Judge object hierarchy, composition, typography, material fit and state continuity against task-relevant references. Avoid a style-count score: no-uppercase/no-border/neutral-only rewards bland compliance. Keep preference, acceptance and reviewer identity explicit. Recalibrating a rubric invalidates comparisons scored under the previous one.

Only the recorder, replay and promotion gate are implemented here. Automatic search-policy synthesis and validated cross-brief improvement remain unproven. Users install the compact skill; maintainers pay for development experiments.
