# Native evidence retention

The bounded component-discovery and Dialog PNG jobs run on pull-request events beside the existing validation and Card jobs. They use the same pinned Playwright 1.63.0 runtime and repository fixtures. They do not deploy a Site, invoke a model, or assign a quality score. The existing three-OS validation and 15-minute Card job remain unchanged on both push and pull-request events; the narrow discovery batch is collected once.

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
