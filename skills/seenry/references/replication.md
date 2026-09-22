# Reconstruct the reference, not a related idea

Use for faithful recreation or a complaint that a reconstruction differs from its source. The source is the visual specification. Better usability or a preferred style does not authorize a different composition. Keep a separate list of user-requested changes. If the task asks for original content or a new brand, preserve the named relationships and label those changes as adaptation.

## Lock the target before implementation

Record a short source contract in DESIGN.md: exact media/URL or local file, version/hash when available, crop/section, viewport, media dimensions, pixel density if known, observed states and requested exceptions. A screenshot's physical pixels are not automatically CSS pixels. Keep the same coordinate system throughout measurement and review; do not independently resize each comparison to make it look similar.

Inspect the real source. A title, caption, extracted CSS, poster or MCP rating cannot establish the pixels or behavior. Use the original page for inspectable behavior, a recording for observed motion, and supplied mobile media for responsive structure. Missing mobile evidence means the narrow layout is proposed. Do not infer a carousel, looping entrance or hidden modal from a still.

## Build a measured specification

For the decisive region record:

- **Geometry:** shell and content bounds, padding, gaps, alignment, anchor coordinates, clipping, overlap, corner radii and border widths. Identify which dimensions change between states.
- **Type:** actual wording, line breaks, family if verifiable, weight, size, line height, letter spacing, text block width and baseline. Keep visible labels intact. A similar font at the same size can have different widths; check the rendered specimen.
- **Material:** sampled flat colors, border/opacity, shadows only where observed, icon silhouette/stroke and asset crop. Keep unknowns marked. Generated art is an approximation, not the original asset. It cannot certify an exact match; use permitted originals when available and disclose substitutions.
- **Behavior:** triggering action, closed/open/selected/error states, hit areas, focus and return path. A recording establishes only the interactions it shows. Implement necessary unseen accessibility and recovery behavior, label it as proposed, and do not change the observed layout to accommodate it silently.

Do not replace an observed dark compact menu with a white illustrated collection, rounded rectangles with pills, or a morphing surface with an unrelated fade simply because both perform the same action. Source-specific details are requirements for this task, not new global design defaults.

## Reconstruct motion as a score

Read [motion reconstruction](../../seenry-motion/references/replication.md) when movement defines the reference. Play at normal speed, then sample the uncertain interval. Record the input time, first response, intermediate shape/position, content appearance, overshoot if observed and settled state. Measure opening and closing independently. Separate the surface's deformation from the text/icons so a shell morph does not accidentally stretch glyphs.

Match the observed track with the smallest mechanism that can reproduce it. A generic recipe is a starting implementation, not replacement evidence. The same duration with a different trajectory, origin, delay, blur or overlap is a different transition. Name estimated values and uncertainty; do not call a guessed easing curve measured.

## Build and compare

1. Build one static closed/open pair at the reference dimensions. Compare typography and geometry before animation. Do not generate three new layouts.
2. Implement the defining transition using measured landmarks. Keep business state and hit testing separate from its presentation.
3. Put source and reconstruction beside each other at equal readable scale. Compare endpoint crops and matching phase frames. Use an overlay/difference view when it helps localize a discrepancy. Cursor, compression, antialiasing and missing fonts can affect image differences; raw pixel error is not a fidelity percentage.
4. List concrete mismatches by severity: wrong composition or behavior, wrong trajectory, proportion/type/spacing, then finishing differences. Repair the largest discrepancy first and replay both entry and exit. Preserve comparison evidence before and after the repair.
5. Exercise interruption, repeated input, keyboard, narrow layout and reduced motion. These checks establish usable behavior; they do not establish visual matching.

For a precise task, use a compact measurement ledger with target and actual values and a tolerance justified by source resolution. Include at least a shell measurement, a type/spacing measurement and motion checkpoints when applicable. The optional `scripts/replication_gate.py` checks a JSON ledger for unresolved measurements and evidence gaps; it does not inspect images or grant approval.

## Report the scope of fidelity

Use `matched within recorded tolerances`, `needs revision` or `unverified` for each observed state/transition. Keep the overall result unresolved if an essential state, source artifact, font/asset substitution or defining transition remains unresolved. Do not convert test success, a clean screenshot or an author's confidence into “pixel perfect,” exact timing or user acceptance. Show remaining differences with the actual comparison. Preserve inaccessible evidence as a limitation instead of inventing it.

Packet handoff: set `intent: "replicate"`, reference IDs/paths, required states and explicit exceptions. Add `motion_patterns` only for the mechanism needed now; broad motion catalogs should not displace the measured specification.

Ledger format: `schema: 1`, `required_states`, optional `motion_states`, `artifacts`, `measurements`, and `unresolved`. Each artifact has `role` (`source`/`output`), a ledger-relative `path` and `sha256`. Each measurement names its `state`, `kind` (`geometry`/`type-spacing`/`motion`), finite `target`, `actual`, nonnegative `tolerance`, measurement `basis`, `source_artifact` and `output_artifact`. Use consistent units. Every required state needs geometry and type/spacing evidence; motion states also need temporal evidence. Run `python scripts/replication_gate.py path/to/ledger.json`. Exit 1 means unresolved/mismatched evidence; exit 2 means invalid input.
