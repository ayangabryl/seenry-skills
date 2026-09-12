# Diagnose generic or unfinished design

Use on real renders and interaction evidence. This is not an AI-authorship detector. A serif, blue surface, pill, divider, uppercase label or shared component cannot by itself establish poor design. A polished familiar interface can be the correct outcome.

| Suspected weakness | Inspect | Controlled comparison |
| --- | --- | --- |
| Interchangeable identity | Does the image, composition or behavior express this offering? | Swap only brand/name between unrelated briefs; document what loses meaning. |
| Empty proof | Is “work” a diagram of implementation rather than convincing work or product evidence? | Replace one pseudo-project with a relevant, truthfully labeled image/mockup. |
| Wireframe residue | Did diagnostic borders, placeholder blocks or process labels survive into the finished surface without a useful role? | Keep the geometry and behavior; remove those study marks before comparing surface treatments. |
| Decorative bureaucracy | Does an ordinal, slash, pill or dot help someone locate, choose or understand a state? | Remove just that decoration; retain content and layout. |
| Redundant state emphasis | Are current item, activity and focus distinct, or do several treatments repeatedly announce the same fact? | Remove one redundant channel; verify that the relevant state remains understandable and keyboard focus remains visible. |
| Repeated hierarchy | Does every section have the same visual weight and opening pattern? | Change one section into direct evidence; compare the whole page. |
| Incoherent material | Are image crops/light, type weight, corner relationships and icon families fighting? | Normalize the suspected relationship, leaving the concept intact. |
| Performative motion | Does movement explain a change or delay/control reading for no benefit? | Play normal-speed static and animated paths; compare time to the same task. |
| Broken state truth | Does success precede an actual result; do input/anchors shift or disappear? | Exercise interruption, failure, keyboard and recovery. A screenshot is insufficient. |
| Unclear language | Can a visitor explain what is offered and what the CTA does? | Use literal action/result copy with identical typography. |

For each finding retain: exact artifact/viewport/state; observable symptom; consequence; confidence; alternative explanation; smallest useful comparison. Review the opening at ordinary size, then whole-page pacing, then selected details. Do not judge a 300px-tall full-page thumbnail as if it proves readable typography.

The browser adapter records visible uppercase labels, shadowed surfaces, repeated grids and text roles as review signals. It does not mark them as failures. Connect a signal to the task and inspect a controlled alternative before changing a design.

Separate critical behavior failures from visual judgments. The existing review gate checks evidence consistency; it cannot tell whether a reviewer actually looked or whether a design is beautiful. A fresh reviewer receives brief, anonymous renders and behavioral evidence, without the author's persuasive style rationale. Label self-review when a separate reviewer is unavailable. Rejection of every candidate is allowed.

Observed listening-queue regression: a review suggested a muted paused pill and either a selection bar or tinted row. The author retained the pill and combined both row treatments; the user rejected the result despite passing functional checks. In this case, compare removing the redundant playback badge and simplifying current-track emphasis. Also check information truth: a list including the current track is not entirely “upcoming.” This example does not ban status badges or useful selection feedback in other contexts. The proposed subtraction still needs a rendered comparison; it is not a validated replacement design.

## Cross-project convergence

Observed image-export regression: both Luna exporters passed functional checks and received model visual passes, but the user rejected both. Their feedback named redundant “LOCAL IMAGE EXPORT / TOOL” eyebrows, overemphasized ordinary field labels, unrelated green format and orange download accents, excess enclosure/vertical space, and absent state-change feedback. Use the **export-feedback** rendered lesson to inspect this actual case. Remove redundant emphasis without hiding format, dimensions or success/failure information. Colorful content, technical PNG/JPEG abbreviations, necessary region boundaries and visible focus remain valid. Cleanliness alone did not meet this user's creativity bar; the replacement's visual idea still requires review.

Keep a compact record for recent unrelated projects: opening composition, evidence medium, type roles, palette roles, section rhythm and signature interaction. Compare those dimensions with the new result. Repeated cream background alone is not a failure; repeated opening + visual medium + section order + subject-independent interaction warrants inspection. Avoid globally banning an otherwise useful system. Use `scripts/quality_cases.py compare` for a transparent descriptor-overlap flag; it does not inspect pixels or infer authorship.

Read `evidence_status`, `comparable` and `missing` alongside the flag. Missing or partial descriptors are an evidence gap, not proof of originality. Derive descriptors from the actual outputs; differently worded descriptions of the same composition can evade simple overlap. Investigate a flagged pattern in context rather than rejecting useful shared controls.

## Calibrate rather than invent accuracy

Store cases with a brief, owned/permitted screenshots, viewport/state, a contextual issue hypothesis, its comparison and **human labels only after review**. Include positive controls: purposeful uppercase airport codes, monochrome utilities, genuinely editorial work, colorful discovery, conventional forms, and sharp-edged identity systems. Include the user's rejected cases as scoped failures, not labels for every occurrence of their colors.

Freeze a development set and a held-out set by project, not by near-identical screenshots. Human reviewers should label useful/needs-revision, reasons and disagreement. Evaluate false alarms on acceptable conventional work and missed defects on attractive but broken work. Report unlabeled cases and sample size. `quality_cases.py summary` reports coverage and agreement only where labels exist; no manufactured taste score or unearned “95% anti-slop” claim.

[Tuch and colleagues](https://research.google/pubs/the-role-of-visual-complexity-and-prototypicality-regarding-first-impression-of-websites-working-towards-understanding-aesthetic-judgments/) studied effects on first impressions, not a universal minimalism rule. [Shin and colleagues](https://arxiv.org/html/2603.13036v1) discuss homogenization in web vibe coding; this motivates investigating convergence, not claiming a validated detector.

Use the [rendered decision lessons](visual-lessons.md) for a concrete comparison. Their source and captures are bundled; they are authored hypotheses with countercases, not a scored taste dataset.
