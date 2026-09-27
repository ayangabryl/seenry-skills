# Reconstruct the reference, not a related idea

For faithful recreation, treat the source as the visual specification. Record requested exceptions separately. Changes for a new brand or original content are adaptations; do not call them matches.

## Lock the target before implementation

Record a source contract in DESIGN.md: current intent, media/URL and available hash, crop, viewport, physical dimensions, pixel density, observed states and exceptions. The latest request overrides older demo settings. Check example scope and labels against it. Physical pixels are not automatically CSS pixels; measure in one coordinate system.

Classify pixels as product UI, platform chrome or archive overlay. If a served image differs from an original, record both. Specify whether the target includes capture marks; never infer product branding or design intent from them. Measure at physical resolution and stated density, then revisit targets after an equal-scale source/output comparison.

Inspect the real source. A title, caption, extracted CSS, poster or MCP rating cannot establish the pixels or behavior. Use the original page for inspectable behavior, a recording for observed motion, and supplied mobile media for responsive structure. Missing mobile evidence means the narrow layout is proposed. Do not infer a carousel, looping entrance or hidden modal from a still.

## Build a measured specification

For the decisive region record:

- **Geometry:** shell and content bounds, padding, gaps, alignment, anchor coordinates, clipping, overlap, corner radii and border widths. Identify which dimensions change between states.
- **Type:** actual wording, line breaks, family if verifiable, weight, size, line height, letter spacing, text block width and baseline. Keep visible labels intact. A similar font at the same size can have different widths; check the rendered specimen.
- **Material:** sampled flat colors, border/opacity, shadows only where observed, icon silhouette/stroke and asset crop. Keep unknowns marked. Generated art is an approximation, not the original asset. It cannot certify an exact match; use permitted originals when available and disclose substitutions.
- **Behavior:** idle, hover, pressed, focus, closed/open/selected/error states, triggering action, hit areas and return path. A recording establishes only the interactions it shows. Implement necessary unseen accessibility and recovery behavior, label it as proposed, and do not change the observed layout to accommodate it silently. If a captured action depends on an unavailable service, preserve its observed idle appearance; a preview response may explain the limitation, but do not invent a connected, selected or successful state.

Preserve item count/order, content/assets, active geometry, moving surfaces and reveal sequence. Different behavior is adaptation, not a replica. Record requested departures. Source details are task requirements, not global defaults.

## Reconstruct motion as a score

Read [motion reconstruction](../../seenry-motion/references/replication.md) when movement defines the reference. Inventory every visible transition, including pointer movement within an open component. Add each to the required-state ledger; a matched opening does not cover row hover or content replacement. Record input, first response, intermediate geometry, content appearance and settlement. Measure opening and closing independently. Separate the surface's deformation from text/icons so a shell morph does not stretch glyphs.

Use the smallest mechanism matching the observed trajectory, origin, delay, blur and overlap. Mark estimated values; do not call guessed easing measured.

## Build and compare

1. Build one static closed/open pair at the reference dimensions. Compare typography and geometry before animation. Do not generate three new layouts.
2. Implement the defining transition using measured landmarks. Keep business state and hit testing separate from its presentation.
3. Put source and reconstruction beside each other at equal readable scale. Compare endpoint crops and matching phase frames. Use an overlay/difference view when it helps localize a discrepancy. Cursor, compression, antialiasing and missing fonts can affect image differences; raw pixel error is not a fidelity percentage.
   For flat-background labels, compare rendered [ink bounds](../scripts/ink_compare.mjs) at equal physical scale; set each region's `polarity` to `light` for bright text on a dark surface (the default is `dark`). Keep the crop inside a uniform surface so other bright or dark pixels do not enter the measurement. Element boxes can hide font mismatches.
4. List concrete mismatches by severity: wrong composition or behavior, wrong trajectory, proportion/type/spacing, then finishing differences. Repair the largest discrepancy first and replay both entry and exit. Preserve comparison evidence before and after the repair.
5. Exercise interruption, repeated input, keyboard, narrow layout and reduced motion. These checks establish usable behavior; they do not establish visual matching.

For precise work, record target/actual measurements and source-justified tolerances: shell, type/spacing and applicable motion checkpoints. `scripts/replication_gate.py` checks the JSON ledger for unresolved evidence; it cannot inspect images or grant approval.

## Report the scope of fidelity

Use `matched within recorded tolerances`, `needs revision` or `unverified` for each observed state/transition. Keep the overall result unresolved if an essential state, source artifact, font/asset substitution or defining transition remains unresolved. Do not convert test success, a clean screenshot or an author's confidence into “pixel perfect,” exact timing or user acceptance. Show remaining differences with the actual comparison. Preserve inaccessible evidence as a limitation instead of inventing it.

Packet handoff: set `intent: "replicate"`, reference IDs/paths, required states and explicit exceptions. Add `motion_patterns` only for the mechanism needed now; broad motion catalogs should not displace the measured specification.

Ledger format: `schema: 1`, `required_states`, optional `motion_states`, `artifacts`, `measurements`, and `unresolved`. Each artifact has `role` (`source`/`output`), a ledger-relative `path` and `sha256`. Each measurement names its `state`, `kind` (`geometry`/`type-spacing`/`motion`), finite `target`, `actual`, nonnegative `tolerance`, measurement `basis`, `source_artifact` and `output_artifact`. Use consistent units. Every required state needs geometry and type/spacing evidence; motion states also need temporal evidence. Run `python scripts/replication_gate.py path/to/ledger.json`. Exit 1 means unresolved/mismatched evidence; exit 2 means invalid input.
