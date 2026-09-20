# Learn from a round without overfitting

Use when a user requests iteration, a result is rejected, or maintainers revise the skill. This changes explicit instructions and examples, not model weights. A round may produce useful evidence without producing a better design.

## Repair this product

1. Preserve the first output and the user's exact judgment. Separate preference, acceptance and task correctness. “B is better” is a preference, not proof that B is ready or that its palette caused the preference.
2. Identify the smallest consequential gap from actual pixels or behavior. Name the artifact, viewport/state, visible symptom, user consequence and competing explanation. If evidence is missing, inspect it before changing code.
3. Choose one uncertain decision to compare. Keep content and behavior fixed; change only the suspected cause. For an interaction, retain before/input/transition/settled/reversal evidence. Review at normal speed before slow playback.
4. Retain the better result only after comparison; otherwise restore the prior version. Keep the existing direction-reset and repair limits. Do not append a new style prohibition to explain a loss.

## Improve the reusable skill

Product fixes are not automatically shared lessons. Use a compact case record:

- Brief and scope; model/configuration; skill version; resources actually loaded.
- Exact feedback and source artifacts; missing evidence or execution limits.
- Hypothesis; proposed instruction/example change; where it applies and a counterexample.
- Before/after result; function check; human preference/acceptance; time and reported usage.
- Status: observed / candidate / supported-in-scope / reverted. No invented quality score.

Choose the intervention by failure type: an unread guide needs better routing; an ambiguous instruction needs a concrete example; a repeated implementation error may need a tested helper; a poor visual selection needs a comparison; an unfinished run needs execution/budget diagnosis. Adding prose does not solve all five.

Test one candidate change against the frozen current skill, with the same model, brief, tools and assets. Keep a no-skill baseline when measuring whether the skill earns its cost. Use fresh contexts. A stronger model may author the skill, but must not correct a weaker model's test output unless the run is labeled assisted.

Before making a general default, test on a different brief and one counterexample where the proposed rule should not apply. These are small transfer checks, not a full benchmark after every edit. If results are mixed, keep the lesson scoped or revert it. Previously seen briefs are development evidence, not held-out proof. Repeated attempts on one favorite brief cannot establish general improvement.

## Give less capable executors a concrete task

Supply only the relevant decision guide, real content/assets, current implementation and one applicable case. Specify the relationships to preserve, the exact change to try, and the observable completion check. Resolve dependencies before handing off. Choose exact motion values for this interaction and verify them; do not demand that the executor rediscover a whole motion system or load all references.

Do not remove creative choice by giving every project the same layout, palette or font. Bound implementation complexity by what can be demonstrated locally, while exploring composition and content treatment. Stop research when the unresolved decision is supported. Reserve execution time for a finished slice and inspection; don't spend the entire budget proving that a process was followed.

Shared skill updates are deliberate maintenance, not automatic self-editing after every user interaction. Store project lessons locally; promote only supported, applicable lessons. Keep rejected hypotheses and a rollback path.

## Optional maintainer replay

The repository development tool `scripts/design_loop.py` records immutable artifact hashes, fixed criteria and parent-linked attempts, then compares action-order policies within a budget. See the repository document `docs/DESIGN-LOOP.md`; these development tools are not required or assumed present in a standalone skill installation. Replay is limited to already evaluated branches. Keep human acceptance separate from model review. No accepted record means no demonstrated replay success. Skill promotion still requires fresh-brief and counterexample evidence; ordinary project use does not run recursive experiments.
