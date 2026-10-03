# Native evidence retention

## Current Menu flow trial and retained regressions

The Menu redesign uses a new current-source native contract: eight width/theme shards, each with pointer, keyboard, reduced-motion and relocated-detail flows, plus one separately labeled native callback case. The browser-free union job requires every declared profile, action and evidence file exactly once. Each native job checks an immutable asset/harness manifest before launching the existing Playwright 1.63.0 runtime and records its actual checkout commit separately. No hashes are generated or silently rebased in CI.

These jobs run once per pull-request workflow run on its exact head. Later pull-request events and explicit reruns produce separate run identities. Each native invocation has a four-minute step cap, a ten-minute job cap and a separate always-uploaded artifact. At most three matrix jobs execute in parallel. The union job has a five-minute bound and preserves its verdict when one is produced. Missing or failed shard outputs fail the union; upload or download completion is not acceptance.

The existing three-OS validation and Card acceptance jobs retain their profiles, predicates, durations and execution on push and pull requests. Their source provenance now includes the required gallery-menu.js dependency. Native functional success does not assign a design or motion score. Actual pixel/playback review, browser zoom, touch and assistive-technology limits remain explicit in the per-component review. The separately reproduced inherited rapid-Search-clear opacity race remains open; this trial does not certify that superseded-filter path.

## Completed source-pinned diagnostic batch

The component_discovery and dialog_lossless workflow executions were one-time captures against the earlier 53/7c product asset identities. They are retired from recurring execution when the Menu candidate changes those assets. Their scripts, helper contracts and historical pins remain unchanged. The Menu baseline had real trigger overlap/keyboard-paint findings and incomplete diagnostic capture metadata; those findings remain open until the current Menu contract and actual media establish the corresponding repair. The last corrected Dialog supplement collected six cases and left genuine browser zoom blocked in that CI route. The separate documented cloud-browser zoom observations remain limited to their inspected source and flows.

This retirement does not relabel old failed or blocked attempts as passing and does not remove the ongoing Card/Dialog regression gates. The new Menu contract replaces the discovery-only Menu execution with current-source flow, focus, geometry, paint, interruption, state and recovery requirements. Supplemental Dialog hover/zoom/performance and received-PNG cadence observations remain historical evidence and explicit quality limits; they are not automatically transferred to a changed source. A future change requiring those diagnostics must create a reviewed current-source capture with its own provenance.

The following records how the historical diagnostic artifacts were packaged. Its original frame bounds and retrieval rules remain applicable to those outputs.

The bounded component-discovery and Dialog PNG jobs ran on pull-request events beside the existing validation and Card jobs. They use the same pinned Playwright 1.63.0 runtime and repository fixtures. They do not deploy a Site, invoke a model, or assign a quality score. The existing three-OS validation and 15-minute Card job remain unchanged on both push and pull-request events; the narrow discovery batch is collected once.

Menu discovery has a two-minute native step, followed immediately by its own artifact. The targeted Dialog supplement has an independent three-minute step and artifact. A failed first collector does not suppress the second when the shared source contracts and browser installation succeeded. Findings, blocked capabilities, and collection failures must be read from each collector's report; successful collection is not product acceptance.

The PNG diagnostic uses a separate Ubuntu matrix for widths 320 and 1440. Each width gets its own two-minute native step. Its source/helper checks explicitly invoke `tests/dialog-lossless-contract.test.mjs`, which is outside the existing Transitions test glob. No additional full preference/width matrix is run. All new jobs have a ten-minute hard cap; individual step bounds and artifact retention cannot guarantee that every upload completes during a network outage or job cancellation.

After each PNG run, including a failed native run, `scripts/pack_native_evidence.py` reads that width's output without modifying it. It partitions the exact files into stored ZIP parts and writes `manifest.json`. Each part is at most 23 MiB including ZIP headers, leaving at least 1 MiB below the 24 MiB transport budget for the outer single-file GitHub artifact wrapper. Each part is uploaded separately with compression disabled and seven-day retention. The packer caps the inventory at 4,096 files, 128 MiB input and eight parts. An exceeded limit, missing/changed input, unsafe path, symlink, corrupt copy or archive, or write error remains a failed package. Existing source outputs remain intact.

The packer uses descriptor-relative traversal without following symlinks on supported Unix runners. Its actual workflow is Ubuntu-only. Unsupported Windows traversal fails closed; Windows unit discovery explicitly tests that behavior and skips the Unix-only traversal cases.

The small `dialog-lossless-WIDTH-index-ubuntu` artifact contains the partition manifest. Parts are named `dialog-lossless-WIDTH-part-000-ubuntu` through `part-007`; unused part uploads are omitted. To inspect the capture:

1. Read the manifest and its packaging status. Keep any failure reason and incomplete inventory explicit.
2. Retrieve every part listed by that manifest. Unwrap the GitHub artifact, then verify the stored part's size and SHA-256 before reading it.
3. Restore only the listed relative paths into an empty directory. Verify the complete path union, file lengths and SHA-256 values against the manifest. Keep the original inner ZIPs and received PNG bytes.
4. Read the restored native report and its separate lifecycle, recording, timing-coverage, and finalization outcomes. Packaging completeness proves byte retention only. It cannot turn a failed or blocked native capture into acceptance.

The native PNG recorder's own frame/byte/deadline caps and omission records are unchanged. Do not infer 60fps, complete display-frame coverage, exact browser/media-clock alignment, or low observation overhead from a complete package. A missing expected artifact means retrieval is incomplete even if the manifest says local packaging completed.

These discovery collectors have explicit source pins. Before a later product change, either review and rebase those identities after checking every relevant dependency, or retire the completed temporary execution steps while preserving their scripts and evidence. Never suppress a stale-pin failure or silently substitute another source.
