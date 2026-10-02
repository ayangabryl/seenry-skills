# Bounded native Dialog PNG diagnostic

Status: v2 prepared and helper-tested, **not native-executed**. This stage changes only new diagnostic/test files. Product files, existing harnesses, workflows and remote state are unchanged. The publisher owns the reviewed workflow addition. This is an evidence collector, never a performance-9 or visual-quality gate.

## Source and execution contract

Product baseline: `53c56304749ecb84eea8d6a9b18d146cf25d6ed7` (PR65). Four exact SHA-256 pins are executable in `tests/dialog-lossless-core.mjs`: HTML `39551a45…`, gallery JS `c18397f5…`, runtime `b7124d8c…`, CSS `f406e5bc…`. Any drift fails before launch. The running checkout commit is independently recorded, because adding the harness creates a different commit. Results also retain all three harness hashes, Playwright package hash/version, Chromium/CDP version, the full gallery-tree file/hash inventory and copies of the four product files and three harness files.

Only the existing authorized GitHub Actions CI may invoke the browser script. Both `GITHUB_ACTIONS=true` and `CI=true` are required before import/launch. This guard identifies the intended execution route; it is not an authorization grant. Use existing official Playwright **1.63.0** and its already installed Chromium. No packages, browsers, permissions or credentials are installed by this harness. No public/cloud CUA browser, HTTP server, forwarding or local browser is used. The page is the native `file:` gallery, with HTTP(S) requests aborted as in the existing video harness.

## Proposed publisher-only steps

Run the helper/source contracts with no browser:

```sh
node --check tests/dialog-lossless-core.mjs
node --check tests/dialog-lossless-progress.mjs
node --check tests/transitions-library-dialog-lossless.browser.mjs
node --test tests/dialog-lossless-contract.test.mjs
```

Add two separate native steps after the existing pinned browser installation, each with `timeout-minutes: 2`:

```sh
node tests/transitions-library-dialog-lossless.browser.mjs \
  --playwright "$GITHUB_WORKSPACE/node_modules/playwright/index.mjs" \
  --width 320 --out "$RUNNER_TEMP/seenry-dialog-lossless-320"
node tests/transitions-library-dialog-lossless.browser.mjs \
  --playwright "$GITHUB_WORKSPACE/node_modules/playwright/index.mjs" \
  --width 1440 --out "$RUNNER_TEMP/seenry-dialog-lossless-1440"
```

The commands above are separate proposed steps, not one combined two-minute step. Publisher can use a small two-width diagnostic job instead. Each invocation covers only light/no-preference at DPR1 and 780px height. Preserve the corresponding output even on failure, in separate artifacts such as `dialog-lossless-320-${runner.os}` and `dialog-lossless-1440-${runner.os}`. `upload-artifact@v4` with `compression-level: 0`, existing 7-day retention, and `if: always()` avoids wasting CPU recompressing PNGs. Neither a native result nor a workflow step has been produced by this stage.

## Routes and instrumentation

Each width runs the same script in three fresh contexts: baseline-before, PNG capture, baseline-after. Each script includes:

1. Trusted Playwright pointer entry, settled read, and the real autofocus Cancel button
2. A trusted pointer entry followed by explicitly labeled API close after requested70ms, reopen after another requested70ms, settled read and API exit
3. Another trusted pointer entry with a **separate** unpaused progress-gated API close/reopen, followed by an explicitly labeled final API cleanup/exit

Native event observations positively require trusted pointer click/detail and the actual trigger/Cancel identity. Search, blur toggle and scroll setup use normal controls. There are no CSS/style replacements, animation pauses, currentTime writes, synthetic DOM event dispatches, manual animation finishes or page-content replacement. API calls are never presented as trusted user inputs. Snapshots read only small Dialog state, real animation inventories/keyframes and computed styles; no per-frame DOM walk is performed. These reads and instrumentation can still perturb rendering.

The70ms diagnostic executes its requested actions even if the observed window is missed. Coverage is blocked unless **both** the actual entry and exit job are owned surface transforms, running, nonpending, finite, strictly positive in currentTime and computed progress, and strictly before endTime/completion. A pending/time0 job, stale/missing owner, backdrop-only/descendant job, late callback or absent observation cannot count. An independently blocked observation does not become covered merely because PNG recording or final cleanup completed.

The reusable helper is `atNaturalOwnedTransformProgress(surface, ownedJobs, action, {label, expected, snapshot, maxWaitMs, maxFrames})` in `tests/dialog-lossless-progress.mjs`. It is self-contained and can be installed in a test namespace with `.toString()` through `page.evaluate`. Pass **actual Animation object references captured after the production action**, a synchronous action callback, and a read-only snapshot callback. Defaults are500ms/40 RAFs, capped to1000ms/120 RAFs. It snapshots a qualifying window, rechecks the actual owned jobs after that potentially expensive read, and acts synchronously in the same RAF only if the window still qualifies. It records before/after snapshots, jobs and actual browser elapsed times. Otherwise it resolves blocked/acted:false. This changes action timing and is a separate, explicitly instrumented route, not a proof that an arbitrary70ms input was covered.

## Native protocol and clocks

The [official Page protocol](https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/pdl/domains/Page.pdl) supports PNG, per-frame events and ACKs. `everyNthFrame:1` asks for each eligible emitted frame; it is not an FPS request or guaranteed60fps. Only common parameters are sent, without recent optional controls. Metadata timestamp is optional frame-swap time; newer schemas also expose a monotonic field. Every supplied metadata field is retained unchanged.

[Network clock types](https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/pdl/domains/Network.pdl) define epoch seconds and arbitrary-origin monotonic seconds. [Current Chromium implementation](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/devtools/protocol/page_handler.cc) derives the wall timestamp from a native monotonic frame time and can suppress frames under backpressure before delivery. This upstream source is explanatory, not a claim that a future `main` implementation exactly matches the recorded binary. Chromium version/protocolVersion are recorded in each native artifact.

[Playwright CDPSession](https://playwright.dev/docs/api/class-cdpsession) exposes the native session send/event interface used here. The protocol is experimental; unsupported behavior is a raw diagnostic failure, never an emulated replacement.

Three clocks remain distinct:

- Browser: performance.now, performance.timeOrigin, RAF timestamps, long-task timing and action snapshots
- Native media: unchanged CDP timestamp and, if present, monotonicTimestamp
- Host: Node performance.now and Date.now at frame receipt, ACK request/response, file-write request/completion, synchronous-handler end and action RPC boundaries

No calibration has established cross-clock alignment. Do not subtract host receipt from native timestamp, map a frame to a particular browser snapshot by equal-looking numbers, or derive click-to-paint latency. Same-clock native intervals and same-clock browser action durations are legitimate. Frames use a monotonic local receive index; CDP sessionId is retained for ACKs and **is not assumed to uniquely number frames**.

## Bounds and completeness

Each profile has a65s soft deadline that closes Chromium and an80s emergency deadline, beneath the proposed120s step. Capture is limited to15s,600 delivered-image slots,96MiB decoded PNG bytes and8 pending archive operations. A cap, invalid frame, ACK failure or disk error requests native capture stop and makes recording incomplete. Over-limit images are explicitly counted as omitted with a reason; they never become silent drops. Error/visibility/overflow metadata is bounded, and overflow is recorded. Core file copies and JSON metadata are additional to the96MiB PNG cap.

The recorder ACKs before decode/hash/disk work, retaining timing for all those boundaries. It keeps delivered PNG bytes unchanged, verifies PNG signature/IHDR and exact full DPR1 dimensions, writes unique numbered PNGs and per-frame JSON sidecars, and aggregates `frames.json`. Metadata and PNG files already completed remain usable on a later failure. No JPEG/WebM conversion, interpolation, frame duplication, resizing or output60fps flag is involved.

After Stop responds, a bounded250ms grace accepts outstanding events, then the listener detaches and pending writes drain. The grace is **not proof that every upstream encoding event has arrived**. `allReceivedEventsStored` means only that this listener's observed events were preserved successfully, without caps/errors. `sourceFrameCompleteness` remains unverified even when that field is true. Zero/one frames cannot qualify as a successful recording. Missing/nonincreasing native timestamps suppress average-cadence claims; optional missing monotonic timestamps do not invent a clock. Cadence includes idle intervals and is neither display refresh rate nor missed-frame count.

Lifecycle facts, natural interruption coverage, received-frame storage, and visual review are separate result fields. A post-recording final PNG documents settled state only; it does not repair a missed transition. The script can report diagnostic-recorded with blocked natural coverage, prominently retaining the blocked result. Do not describe that as full motion acceptance.

## Observer-cost evidence and interpretation

All three contexts have the same lightweight RAF/long-task logger, action snapshots and scripted routes. The summary reports RAF interval distributions, callback lateness, logger callback cost, snapshot cost and supported long-task durations. The middle context adds the PNG stream. Compare raw distributions against both baselines; this short A-B-A sample is descriptive, not a causal benchmark, randomized experiment or uninstrumented baseline. Fresh-context warmup/order effects, shared CI contention, native capture/encoding and disk effects are unresolved. RAF is a scheduling observation, not a presented-frame counter. Long tasks omit shorter work and browser compositor/GPU time.

Direct host timing quantifies synchronous frame-handler work, ACK request lag/round trip and PNG-write latency. It does not measure all Chromium encoding costs, final JSON serialization or all async metadata overhead. Those limits prevent a low host-handler number from being called low total overhead. No performance threshold is promoted into a9 or “smooth” verdict. Review the PNG sequence and native timestamps independently before judging readability/spatial quality.

## Finalization and error policy (v2)

The case status is reconciled **after** frame archive completion, final-still capture and awaited context closure. The report status and process exit code are decided **after** awaited browser closure, source re-verification and a second reconciliation of every case. A page error arriving during either close operation therefore cannot leave a successful result. Browser/context close rejections, recording/final-still failures, incomplete observations and source drift fail the diagnostic. Any browser `console.error`, including resource errors, also fails; there is no hidden allow-list. Console warnings remain recorded observations and do not fail on their own.

The exact async finalizers used by the runner are exported from `dialog-lossless-core.mjs` and exercised with injected close callbacks. Controls cover late page/console errors, context/browser close rejection, a page error during browser close, post-close source drift, missing final still, successful cleanup, warnings and original-failure preservation. Original action errors, recording errors, raw frame summaries and partial observations are retained. If a later observation recovery read fails, its error is stored separately instead of overwriting existing observations.

The v2 local suite passes **56/56** tests (44 original tests plus12 finalizer/wiring controls). The unpaused progress helper and96MiB PNG budget are unchanged. Publisher-owned raw artifact splitting does not change capture fidelity or cap semantics.

## Verification and remaining work

The local executable contract suite uses fake CDP events and actual exported helpers; it never launches Chromium. It covers positive/negative window ownership and progress, post-snapshot staleness, PNG byte preservation, full metadata and clocks, ACK/disk/invalid-frame failures, explicit frame/byte/queue caps, no-frame rejection and local CI-guard refusal. Static/source checks protect the unchanged-source/no-time-control route. Syntax checks pass. These checks do not establish real native rendering, cadence, overhead or visual quality. The native job and independent review of its artifacts remain necessary.
