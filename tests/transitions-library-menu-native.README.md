# Bounded Menu native contract

This is a prepared acceptance harness, not executed native evidence. The delivered example manifest is deliberately unfrozen. It has no final asset/harness hashes or frozen bundle digest; its reconstruction base is explicitly identified. No local Chromium, software install, workflow change, Site access, publication, visual score, or acceptance is performed here.

The main contract has exactly 32 profiles, partitioned into eight shards of four. A separate controlled callback case exercises the runtime's real native `beforetoggle(open)` ordering. It is never counted as trusted-input or ordinary-motion evidence. The union command requires all eight main shards and this separately labeled case.

## Source and runtime prerequisite

Use the later frozen composition supplied by the coordinator, not these authors' individual working stages or PR65's old discovery pins. Copy these harness files to the composed checkout's `tests/` directory. The unchanged existing `transitions-library-menu-discovery-helpers.mjs` supplies bounded finalization, clipping, identity, flat-color modeling and hashing helpers.

Prepare a reviewed immutable manifest before publication using the shape in `transitions-library-menu-native.pins.example.json`: set `frozen: true`, the exact `reconstructionBaseCommit`, exact SHA256 values for every declared asset and imported harness source, and the canonical `bundleSHA256`. The reconstruction base (currently PR65 `7c5fc8fd175f5de224406f793ea5c842b52a8c0d`) describes the source used to reconstruct this work; it is not the new product commit. The eight fixture assets include the five HTML/JS/CSS files and `assets/morning.jpg`, `assets/lake.jpg`, `assets/forest.jpg`. All eight are served unchanged by an exact-path loopback allowlist. Only the fixture origin is permitted in the browser; external requests, 4xx/5xx responses, request failures, and console errors fail collection. Native runs verify the manifest before importing Playwright and again after browser closure. The actual CI checkout HEAD is recorded separately. There is no self-referential requirement to embed the commit that contains the manifest. `bundleSHA256` is SHA256 of compact JSON containing schema, reconstruction base, and alphabetically keyed asset/harness hashes, exactly as `sourceBundleSHA256` defines. Frozen verification rejects missing or changed base/hash/bundle identity and never generates or re-pins it in CI.

Only existing CI-installed `playwright@1.63.0` is accepted. No alternate browser path, installation, automatic manifest generation, or source re-pin is performed by this script. The script refuses native launch unless both `CI=true` and `GITHUB_ACTIONS=true`. Do not spoof that guard locally. Native execution still requires the coordinator's existing authorized CI route; this patch does not edit or authorize a workflow.

## Browser-free verification now

```sh
node --check tests/transitions-library-menu-native.browser.mjs
node --check tests/transitions-library-menu-native-observer.mjs
node --check tests/transitions-library-menu-native-contract.mjs
node --test tests/transitions-library-menu-native.test.mjs
node tests/transitions-library-menu-native.browser.mjs --verify-only
```

The unfrozen example allows plan/manifest-shape verification only. Output explicitly says source acceptance and native execution are unverified/not run. With `--pins <final-manifest> --gallery <composed-gallery>`, verify-only also verifies actual source and harness hashes, still without importing or launching a browser.

## Later authorized invocation

Run each main shard independently, in a fresh output directory, using the existing runner's installed module. Each shard has a 165-second collection limit and 190-second hard exit, so the surrounding CI step must allow at least four minutes and always upload the whole directory on failure. A case is capped at 60 seconds, input actions at three seconds, native finite settlement at 2.2 seconds. A failure stops dependent actions for that case; other independent profiles continue within the shard's budget. There is no unbounded all-profiles mode.

```sh
node tests/transitions-library-menu-native.browser.mjs \
  --playwright "$GITHUB_WORKSPACE/node_modules/playwright/index.mjs" \
  --gallery skills/seenry/assets/components/transitions/gallery.html \
  --pins tests/transitions-library-menu-native.pins.json \
  --shard 0 --out "$RUNNER_TEMP/menu-native-0"
```

Repeat with shard IDs 1 through 7, each with its own output directory. Run the separately identified controlled callback profile once:

```sh
node tests/transitions-library-menu-native.browser.mjs \
  --playwright "$GITHUB_WORKSPACE/node_modules/playwright/index.mjs" \
  --gallery skills/seenry/assets/components/transitions/gallery.html \
  --pins tests/transitions-library-menu-native.pins.json \
  --callback-only --out "$RUNNER_TEMP/menu-native-callback"
```

After obtaining all uploaded directories in one trusted artifact workspace, verify their exact union and media bytes without a browser:

```sh
node tests/transitions-library-menu-native.browser.mjs \
  --merge menu-native-0/index.json,menu-native-1/index.json,menu-native-2/index.json,menu-native-3/index.json,menu-native-4/index.json,menu-native-5/index.json,menu-native-6/index.json,menu-native-7/index.json \
  --callback menu-native-callback/index.json \
  --out menu-native-union.json
```

Missing, duplicate, empty, extra, wrong-shard or mutated profiles, missing required action IDs, failed/incomplete native evidence, source disagreement, absent callback evidence, absent raw media, changed media hashes or unknown media-probe errors return nonzero. Exact missing-ffprobe metadata is reported separately as described below; it cannot waive any functional, trace, first-rAF or capture requirement. The callback output cannot replace a main profile. Prior failures are preserved after clean cleanup.

## Exact matrix

| Shard | Width | Theme | Required main profile suites |
|---|---:|---|---|
| 0 | 320 | light | pointer, keyboard, reduced, detail |
| 1 | 320 | dark | pointer, keyboard, reduced, detail |
| 2 | 390 | light | pointer, keyboard, reduced, detail |
| 3 | 390 | dark | pointer, keyboard, reduced, detail |
| 4 | 1100 | light | pointer, keyboard, reduced, detail |
| 5 | 1100 | dark | pointer, keyboard, reduced, detail |
| 6 | 1440 | light | pointer, keyboard, reduced, detail |
| 7 | 1440 | dark | pointer, keyboard, reduced, detail |

All contexts use height 780, DPR 1, desktop fine pointer and native browser reduced-motion emulation. The detail cases at 320 and 1100 use native reduction; 390 and 1440 use no preference. `matchMedia` and actual viewport/theme are verified and recorded.

| Suite | Actions | Native evidence required |
|---|---:|---|
| pointer | 30 | Both original row trigger points; settled precise end placement/6px gap and viewport clamp; Blur off/on; positive nonpending entry interrupted by close; positive nonpending exit interrupted by reopen; keyboard takeover; Escape during entry; repeat on the other row; committed Rename, slash-to-Search, filter-keep, accepted filter-away, unconsumed Search Escape, visible restore and Reset |
| keyboard | 54 desktop / 55 phone | Real Tab/Enter/Space; instant accepted/first-rAF semantics for every open; Rename/Save and value/label update; Cancel preservation; blank and 61-character errors; valid unbroken 60-character name/row fit; both original triggers; two duplicates; disabled budget feedback and skipped keyboard action; all four rows deleted with deterministic next/previous/Reset focus; six-second empty recovery observation; all four Undos restoring exact row order/name/identity; retained copy budget; Reset; repeated copy and canceled rename after reset |
| reduced | 55 desktop / 56 phone | The same full flow, with Blur on, native reduce and pointer Menu opens focused on the Menu surface; additional keyboard Space opening; immediate visibility/no movement for each open |
| detail | 18 | Real detail-title entry and moved stage; a trusted slash attempt confirms the native modal blocks background Search focus while retaining child Menu/stage ownership; child Escape preserves modal parent and returns row focus; nested Rename Escape preserves parent and committed names; Duplicate/Delete/Undo inside detail; another child Escape; independent parent Escape with trusted native cancel/close lifecycle, gallery stage/hash restoration, detail-title focus and retained rows; Reset |
| controlled callback | 2 | Separate 390/light profile: initial state and actual `beforetoggle(open)` callback calling production `close({instant:true,silent:true})`; synchronous post-`open()` state and actual first rAF must be native-hidden, managed-closed, inert, all triggers collapsed, with no surviving Menu animation owners |

The controlled profile calls production APIs only for this explicitly scoped callback contract. Native `showPopover`/`hidePopover` are neither replaced nor stubbed. The inherited `beforetoggle(close) → open()` mismatch is outside acceptance and remains unverified. It is not silently treated as fixed by the new callback case.

## Evidence contract

- All ordinary UI actions use Playwright mouse/keyboard or native locator controls. No synthetic event dispatch, controller mutation, `getState()` verdict, animation pause, seeking, or playback-rate override is used. Native outcome assertions read real row names/counts, accessible trigger labels, editor values/errors, status, budget/Undo, focus and original-point hit ownership.
- A cheap capture listener is installed before production code. It saves the original trusted event time, native event timestamp, action ID, event ID and target owner. The accepted listener is installed on the stage after production mount because the host correctly stops trigger clicks there; document bubbling would miss them. It observes the exact post-handler click state.
- Each instant opening links that accepted click to its own first scheduled observer rAF. The actual first callback is retained even when late or wrong; a later good sample cannot replace it. Both accepted and first-rAF snapshots require the same full visible/open/native semantics, original trigger ownership, exact three-action set, whole measured glyph containment, enabled-item opacity/flat-color contrast, no surviving movement/blur, and correct focus. Keyboard item focus additionally requires a strong measured cue. Disabled items remain visibly present and may use disabled paint.
- Accepted observer start/completion and first callback/snapshot completion all must finish within 50ms of the original captured click. Clock loss, missing event/action identity, wrong focus, opacity/blur, missing sample, or late completion leaves coverage unverified and fails the native gate. Event time is never replaced by snapshot completion; rAF timestamp and callback arrival remain distinct.
- These are pre-paint DOM/style/geometry assertions. Color modeling is explicitly flat-background only; unsupported effects fail coverage. They do not prove native-pixel readability, focus contrast under arbitrary composition, a particular painted frame, or design quality.
- Ordinary pointer transitions are observed separately from instant flows. Interruption requires a Menu surface transform that is running, nonpending, has positive current time and progress strictly between 0 and 1 in the actual trusted input capture. A time-zero job, descendant/pseudo animation, pending job or late endpoint cannot qualify. The observer never freezes animation to meet the test.
- The detail parent Escape is sent only after a closed child and a still-native-open modal parent are observed. Its result also needs real parent native lifecycle evidence. A blocked child flow prevents the dependent key from accidentally closing the parent.
- Persistence means the recovery remained visible for the recorded six-second empty-state interval and through subsequent Undo actions. That bounded observation does not prove indefinite future behavior.

## Capture cost, artifacts and finalization

Each case is written incrementally to its own `case.json`; action stubs are durable before traversal/arming/input. Each action stores at most 100 input events and 24 accepted observations. rAF collection stops after 40 callbacks or 750ms and saves only the actual first, first positive progress, and selected later samples. The in-browser event buffer remains capped at 800. Full contiguous batches are durably saved and then acknowledged at stable boundaries; the final bounded tail is saved during recovery. The batch count is bounded by the declared action groups plus setup. Hitting any cap still fails evidence rather than dropping data silently. Errors and request inventory are capped and overflow also fails.

Every case has an unpaused native-speed WebM and selected unpaused diagnostic PNGs. Screenshots may add measurement cost; they retain their actual browser before/after snapshot interval plus host request/completion clocks. No screenshot is labeled a zero-time or exact first frame. WebM packet PTS from existing `ffprobe` remain media-relative. There is no guessed alignment to browser or host clocks, and no full-frame completeness claim. An exact `spawnSync ffprobe`/`ENOENT`/`path: ffprobe` failure leaves the finalized raw bytes/hash retained and produces the named `FFPROBE_NOT_FOUND` metadata diagnostic. It supplies no PTS and does not itself establish functional acceptance. Unknown probe failures remain failures.

The case finalizer recovers the active trace, closes the page, closes the context, then finalizes video, each bounded and recorded before and after. Original errors survive; page/console errors raised during page or context closure are included. After browser closure, every case is reconciled again so late errors cannot escape into a passed report. Timeout paths preserve an inventory of files and an incomplete index; they never rename an unfinished run into acceptance. Always upload the entire output directory, including failed/partial cases and raw recording remnants.

`native-contract-observed` means only that this declared functional/native evidence contract was observed. `visualVerdict` remains `unverified`, and no motion score is generated or inflated. Normal-speed/slow playback, actual pixel review, independent visual and motion judging, touch devices, browser zoom and native assistive technology remain separate work. The existing authorized ongoing Card/Dialog gates and reviewed old-diagnostic retirement scope are unchanged.

## V2 evidence-derived reconciliation

The frozen v1 candidate is preserved separately. Its peer review found that ordinary/callback action status labels could conceal absent input or callback traces, and that the callback merge branch omitted case/source/error checks. V2 moves the existing endpoint assertions into the shared contract and uses the same `assertStepEvidence` validator during collection and final reconciliation.

Every action now needs its actual before/after snapshot clocks, configured identity and input mode, native settlement snapshot where applicable, and the correct target-owned trusted event and post-production observation. Pointer evidence requires ordered down/up/click events; keyboard activation requires the actual key and generated click. Save needs the native form submit and its post-handler result. Editor and parent Escape lifecycle observations must link back to their own capture events. Interruption progress is rechecked at the actual click or key capture, rather than accepting a separate passed flag or pointerdown-only substitute.

The controlled profile observes both native beforetoggle events in order: closed→open, then open→closed retirement. Exactly one host instant-close call must occur between them. It retains the callback entry states, managed state immediately after host close, synchronous state after production `open()` returns, and its actual first rAF. The native events, action IDs, callback counts, clocks and retired ownership are validated again during reconciliation. Native methods remain unmodified; the inherited close→open callback limitation remains outside acceptance.

The final recovered inventory must contain no active trace, no dropped events, no retained Menu/editor/parent ownership, and a snapshot matching the final flow state. Every action event must also exist in the complete contiguous union of acknowledged batches and the final terminal tail. Missing batch or acknowledgement fields never default to a successful historical packet. The union validates the full frozen asset/harness identity and applies exact case ID, source and error-inventory checks to the separate callback report. Missing, synthetic, duplicated, reordered or incomplete evidence fails even if a record says `observed`.

The HTTP fixture answers only `/favicon.ico` with 204 as an optional browser request. Missing declared gallery dependencies still fail. Final product pins remain unresolved and no browser was launched to prepare V2.

## V3 nested measurement and media correction

The independent V2 correction review confirmed the original event/callback and identity fixes, then found three remaining ways to accept missing or mismatched evidence. V3 requires both accepted and first-rAF state snapshot clocks to fit inside their actual measured wrapper intervals. The existing 50ms bound therefore includes the nested state, while the callback-supplied rAF timestamp is required finite and retained independently; no invented ordering compares that frame timestamp with `performance.now()`.

Screenshot reconciliation now validates both real native snapshots, ordered browser brackets, and the separate finite host request/completion interval. An empty object is not a capture bracket. Video collection and reconciliation share one check requiring a nonempty packet list with finite PTS values; an `observed` label alone supplies no media timing. These changes preserve all original failure records and the distinction between browser, host and media clocks. V1 and V2 remain frozen separately.

## V4 Search scope and known media-metadata gap

Each pointer profile adds eleven required actions, without adding profiles or widening the eight-shard partition. The flow commits a distinct hiring-file name, opens its Menu, presses slash with trusted keyboard input, keeps the Menu through a matching filter, filters it away with trusted Search input, checks Search Escape, restores the visible card, and resets the preview. Slash focus is measured only at `post-production-document-keydown`: the earlier stage event boundary does not include the gallery's delegated Search focus handler.

The fixture's existing `st:close` production event is observed after the runtime has completed native hide, while the gallery card is still visible. It is explicitly an untrusted custom production event, never presented as trusted input. Its snapshot must show native/managed closure and Search focus before the subsequent hidden-attribute mutation observer. Both are linked to the same action as the actual trusted Search input, with committed row names preserved. Matching filters and restored cards must remain visibly painted; opacity-zero is not accepted as visibility.

Each moved-detail profile also sends one trusted slash key while its child Menu is open. The native modal must retain child focus and stage/Menu ownership because background Search cannot receive focus. This does not claim that a programmatic background filter in a modal has been exercised. The inherited superseded-fade catalogue issue remains outside this declared acceptance scope; no clean result is inferred from its source-model ownership check. If a native result reaches invisible paint, the normal paint predicate fails and the original trace remains available as a distinct finding.

Functional and metadata results are explicit:

- `functionalStatus: observed` requires all declared native inputs, snapshots, first-rAF checks, ownership/outcome assertions, finalization, exact action/profile unions, frozen source identity and raw video/PNG artifacts
- `status: native-contract-observed` additionally means required native media packet metadata was observed
- `status: native-functional-observed` means the functional evidence passed while `mediaMetadata.status: unavailable` lists exact `FFPROBE_NOT_FOUND` diagnostics, with each raw file's bytes and digest retained
- `failed`/`incomplete` remain failures for unknown probe errors, absent/corrupt raw capture, missing traces/profiles/actions, first-rAF timing failures, page/console errors or failed finalization

The CI exit code gates actual functional/capture evidence. A verified missing-tool metadata diagnostic is nonfatal only after those requirements pass; union output keeps that gap visible and never upgrades it to observed PTS or visual/motion acceptance. Consumer-side probing of the unchanged raw artifact is separate later evidence. This harness does not install ffprobe or invent packet timing.

Screenshot intervals remain validated diagnostic capture brackets. Their request/completion clocks are not exact first-paint proof and have no invented short acquisition deadline. The actual accepted-click/first-rAF requirement remains independently strict at 50ms, including nested state clocks. No media-metadata gap can relax it.

The browser-free merge entry also retains input failures. Missing or malformed shard/callback index JSON writes an incomplete union record containing the original error, declared input paths, available file inventory and already parsed report identities, then exits nonzero. It does not fabricate missing cases. If the destination itself cannot be written, the original failure and write failure remain on stderr.

The same-run provenance is mandatory separately from source hashes. Every native case and index records the actual checkout HEAD plus the existing `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT`. All eight shards and the callback must come from that exact checkout/run/attempt. Missing or mixed identities fail both reconciliation and union checks; a packet from a previous attempt cannot silently fill a missing case. No new CI environment values are generated by the harness.

Phone typography is sampled only after selected actions have finished and their native finite motion has settled. It is not added to the accepted-click/first-rAF observer. At 320/390 the count, Reset, file notes, budget/status/deletion/Undo/empty labels, disclosure and visible copy-limit text must reach 15px; Rename label/input/buttons must reach 16px. Each sample retains real font size, paint chain, control/container and glyph bounds. Keyboard/reduced phone cases require coverage of every affected selector across their existing states. This is a settled source-guide/fit contract, not native raster or visual-score acceptance.

## V5 causal and visible-leaf corrections

The Search retirement chain is bounded to its own trusted input and selected settled snapshot: the production close capture must follow the input capture, then the completed close observation precedes the hidden-card observer, and the hidden snapshot completes before settlement and the terminal action snapshot. Every observation retains the same action identity. A synchronous close may legitimately happen before the input reaches document bubbling; that extra ordering is not required.

Phone sampling uses the active native modal and the visible viewport/ancestor scroll region. Leaves outside an active nested Rename, or wholly/partly outside the visible vertical scroll region, are excluded with a recorded reason. They are not mislabeled as font/fit failures merely because a scrollable parent has offscreen content. Eligible leaves still need their measured font floor, paint chain, container/visible-clip containment and full intrinsic glyph fit. Horizontal overflow remains a failure, and required selector coverage remains unchanged. An empty eligible sample remains unverified/failing. The sampler is separately callable for regression tests but still runs only after action finish; accepted/first-rAF capture is untouched.


## V5 first-native collector corrections

V5 preserves the failed V4 artifacts as historical evidence. New snapshots require both logical `menu.open` (agreeing expanded trigger and enabled semantics) and raw `menu.presentationOpen` (`data-st-open`). A pointer close publishes logical closed/inert/aria-collapsed immediately while its native outgoing presentation and owned transform remain alive. Interruption checks validate both axes; terminal closure still requires both to retire. Native accepted-click/first-rAF linkage and the 50ms completion ceiling are unchanged.

The collector-only `transitions-library-menu-native-collection.mjs` is a fifth pinned harness dependency. Event checkpoints retain the 800-entry browser cap. Each batch is durably saved before the exact prefix is acknowledged; final reconciliation requires contiguous unique IDs across setup, every action, and recovery. Write, acknowledgement, lost-batch, duplicate, gap, and overflow failures remain failures. Source pins are prepared only on the final reviewed product/collector composition.

Three finite rapid groups are declared explicitly: entry/open → entry/close → exit/reopen; takeover/open → keyboard/takeover; close-mid/open → close-mid/action. Every action stub is saved before its group's first dispatch. Full-run host writes, including error-log saves and event checkpoints, defer until the group ends or aborts. Partial actions and browser recovery inventory are retained on failure, then persisted immediately. No positive-progress predicate, 600ms progress deadline, case deadline, product duration, or animation clock is changed. A missed trusted-input progress window remains unverified.

Phone keyboard/reduced profiles add one separately labeled `empty-recovery-undo-visible` step after the unchanged six-second persistence observation and before the first Undo activation. It reaches Undo using real Tab traversal, settles, and captures typography only after the action ends. Undo must then appear in the original 15px/paint/glyph/visible-clip predicates. No programmatic scrolling is represented as native input, and required selector coverage remains exact.

The host persistence observation uses a monotonic remaining-duration loop to actually meet the same exact 6000ms lower bound when a timer wakes early. There is no timing tolerance or enlarged deadline; native browser and host clocks remain independent.

## Collector v2: visible focus through repeated Undo

The native Undo contract follows the observed deletion stack and recovery state: while further deleted files remain, Undo retains focus on the existing Undo button; the final Undo focuses and reveals the restored row trigger. The actual accepted focus and recovery signals must match that exact condition. The final restored trigger must already fit in the accepted snapshot's viewport; its old `trigger.hit` is not used as proof because that hit can refer to the original interaction point.

Every Undo now has a separate `settled-post-undo-focus` sample after `finish()` and finite settlement. It is read-only and never focuses or scrolls the page. It records the chosen target's actual paint, viewport and ancestor scroll clip, a hit at its freshly measured current center, and four bounded edge-midpoint probes that expose partial sticky-control occlusion. Both pointer and keyboard returns must show a fully painted, focused control within the visible region with actual current hit ownership. Verified keyboard activation additionally requires a strong opaque outline or inset focus ring wholly inside that region. Pointer activation follows native focus-visible heuristics and does not require a keyboard ring. The sample records and validates its linked trusted Undo click/key evidence and the resulting cue requirement.

Missing focus/paint/clip/hit/input evidence, offscreen targets, hidden or unsupported paint, wrong current-center coordinates, covered centers/edges, and missing/clipped keyboard cues fail. A generic high-contrast button background is not substituted for an observed focus ring. These samples do not enter the accepted-click/first-rAF timing observer, do not alter same-point Menu checks, and do not certify focus pixels between the bounded measured points. The original offscreen Undo rectangles are retained as a provenance-labeled regression fixture. Product fixes and final source pinning remain separate integration steps.
