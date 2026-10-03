# Menu native discovery checkpoint v3

Test-only capture preparation. No native run, product change, workflow change, Site creation, publication, score or acceptance is performed by this patch.

## Exact candidate and scope

The four assets are frozen in `transitions-library-menu-discovery.pins.json`. This is PR65 source `53c5630…`, with runtime `b7124d8c…` and gallery HTML `39551a45…`. The reviewed rebase from runtime `4105cbdd…` changes only Card semantic-visibility code: the complete runtime prefix before Card `titleBox` and suffix from `palette` are byte-identical, and HTML/CSS/gallery JS are unchanged. This identity check does not grant Menu clearance. At execution the harness verifies all four product assets and each executable harness source before importing Playwright, and rechecks at the end.

Only these discovery cases run, each in a fresh native browser context at height 780 and DPR 1:

- D1: 390, light, native no-preference, gallery. Blur off/on; trusted mouse open; unchanged original-point close only if that point still hits the trigger; safe Escape if covered. Real Tab traversal to Enter/Space opening and Escape return
- D2: 320, dark, native reduce, gallery. Blur on; trusted keyboard open; End to Delete; Escape. Record real scroll clip and full last-row geometry, native keyframes and preference
- D3: 390, light, native no-preference, relocated detail. Open the real Menu title; settle parent; Tab to child trigger, Enter, child Escape, then separate parent Escape. Preserve stage owner, hash and focus at both boundaries

A first primary finding is written to the case and printed immediately. A failed product predicate does not throw away the trace. Unsafe dependent actions are withheld, and independent discovery cases continue. There is no broad matrix or automated quality verdict.

## Safe checks now

From the checkout receiving this patch:

```sh
node --check tests/transitions-library-menu-discovery.browser.mjs
node --check tests/transitions-library-menu-discovery-helpers.mjs
node --test tests/transitions-library-menu-discovery.test.mjs
node tests/transitions-library-menu-discovery.browser.mjs --verify-only --gallery skills/seenry/assets/components/transitions/gallery.html
```

`--verify-only` exits before browser import/launch. Ordinary native invocation outside GitHub Actions CI is rejected. Do not override that guard, install a new runtime, or try local Chromium to evade the known socket restriction.

## Later authorized native invocation

Use the existing CI-installed `playwright@1.63.0`, unchanged, after coordinator review. No install or CI edit is included. Publisher/CI owner can insert the following single invocation into the authorized existing route, followed by its normal always-upload artifact step:

```yaml
- name: Record bounded Menu discovery
  timeout-minutes: 2
  run: node tests/transitions-library-menu-discovery.browser.mjs --playwright "${{ github.workspace }}/node_modules/playwright/index.mjs" --gallery skills/seenry/assets/components/transitions/gallery.html --out "${{ runner.temp }}/seenry-menu-discovery"
```

The native process stops collection at 105 seconds, then retrieves the bounded live browser trace, closes its context and finalizes its video. A last-resort hard exit at 115 seconds preserves the incomplete index if cleanup still hangs. Individual native settlement waits are bounded at 2.8 seconds and inspect live finite animations, then two native rAFs, instead of pretending a fixed delay proves completion. Retained finished fill and unknown iterations remain explicit. Import, input, settlement, trace, PNG, first-frame-window and media failures aggregate to case/index status `incomplete`; product observations remain separate. A watchdog result is incomplete, never passed. Action and PNG stubs are persisted before dispatch/capture, and finalization steps are persisted before and after each attempt. Upload the entire output directory even on blocked execution. Preserve the exact source and harness hashes from the index with the media.

## Evidence and limits

- `index.json` lists every case before execution, exact four-asset and harness hashes, browser/OS/Playwright identity, timestamps, errors and unverified scope
- Each case has its own `case.json`, native unpaused `native-speed.webm`, and a few diagnostic full-viewport PNGs. JSON is bounded by actions, event caps and selected rAF samples. The index does not duplicate case traces
- Video has no concurrent screenshots, animation pause, speed override or style mutation. All input is Playwright mouse/keyboard or native locator UI interaction. No production open/close API or synthetic dispatch is used
- Native document input is logged cheaply in capture phase; post-JavaScript snapshots use document bubbling listeners installed after production delegation. They explicitly may precede native default behavior. Native dialog cancel/close lifecycle and subsequent rAF observations are recorded separately; none is labeled settled by itself. Parent Escape additionally waits for a trusted native cancel/close lifecycle event and a native-closed/nonmodal dialog before its finite-settlement check can complete. Focus and scroll events are recorded separately
- Geometry uses the original opening point across the pointer open/close cycle. Pointer proof requires both trusted pointerdown and click to normalize to the trigger; a trusted click on Delete is rejected. Keyboard entry requires a trusted trigger key and trigger-generated click followed by the actual first item receiving focus. It records trigger/menu/stage/offset-parent/Replay rectangles, right and facing-edge gaps, transform origin, side, and the actual `elementsFromPoint` stack
- First focused-item opacity, filter, transform, glyph rectangles, focus-visible/cue styles and the full ancestor paint chain are captured at accepted keyboard activation and the earliest available rAFs. Contrast is an explicitly labeled flat-background model. Blur, blend, images and unsupported colors are unverified. Model contrast is never native pixel proof or a pass
- PNGs run in a fresh separate context after video, with before/after browser state and host request/completion clocks. The first-available PNG is deliberately labeled diagnostic. Its requested first-paint window is 0–50ms after accepted trusted keyboard click; either bracket outside that window is blocked, not a product finding. An in-window bracket still does not prove the exact first painted frame
- Browser performance timestamps, host monotonic/UTC timestamps and ffprobe packet PTS remain distinct. No guessed subtraction maps a video's first frame to input. If ffprobe is unavailable, packet metadata is blocked while the raw video is retained. Review the actual native video and PNG pixels before asserting transient readability or visible focus contrast
- Native reduction is verified with `matchMedia`; exposed nonidentity keyframes and >100ms opacity tracks are observations for review. Reduced paint readability cannot be inferred from opacity duration alone
- D2 End records the actual focused Delete row and scrolling. The Menu client clip is transformed into the same native coordinate system as its bounding rectangle, then intersected with viewport and all clipping ancestors. Rotated/perspective/masked geometry is blocked, not approximated into a fit result. Document overflow alone is never a containment oracle. The helper rejects partially clipped rows
- D3 child Escape requires a native-open modal parent that is nonhidden, noninert and visibly displayed, with hash/stage ownership preserved and child focus return. The same conditions are rechecked immediately before the independent second parent Escape. Failed child ownership, collection or focus prevents that dependent action

The checkpoint does not cover touch input, full width/theme/route matrix, interruption, Tab departure, spacing overrides, actual browser zoom, native AT, standalone copied popover or a score. Discovery data is not acceptance.

## Pin changes

A later reviewed Card-only candidate must not silently bypass the manifest. Coordinator must verify Menu markup, shared styles, gallery event wiring, runtime helpers, placement/open/close, and delegated input against this exact baseline. If a Menu dependency changes, this is a new candidate, not a rebase. For an approved rebase, issue a new immutable manifest/patch and rerun source checks. Never substitute stale Site assets or carry over native findings as a changed-source pass.

## v2 causal regression coverage

All original 14 checks remain, with stronger valid ownership fixtures where necessary. Thirteen additional checks exercise the actual helpers called by the harness: complete/incomplete aggregation; persistent action stubs; failed arm/input/capture/settlement/trace paths; stale action identity; bounded idempotent finalization; trusted Delete versus trigger; unrelated keyboard clicks/focus; hidden/inert native parent and second-Escape gating; scaled/ancestor-intersected clipping; strict scalar/token/matrix parsing (11 and 111 are never identity scale); and native-default/lifecycle phase labeling. There are 27 passing local tests, without launching a browser.

## v3 capture-clock correction only

Capture-phase trusted events receive an event ID and timestamp before geometry/style snapshots. The exact same event object links post-JavaScript and lifecycle observations to that original boundary. Observer entry, snapshot start/completion, native event timestamp, rAF callback arrival and rAF timestamp are retained separately. Snapshot completion is never substituted for input time.

First-paint and PNG timing resolve the original capture event ID. Missing/mismatched provenance is blocked. The first-rAF arrival and its snapshot completion must both remain in the intended observation window; these still are pre-paint measurements, not native pixel proof. Native cancel/close and later lifecycle snapshots retain the original event time while recording their own measurement clocks.

All 27 v2 tests remain. Four additional causal checks exercise the exact listener functions installed by the browser harness. In particular, a trusted click at 100ms, a snapshot from 100–180ms, and first rAF at 196ms yields 96ms and `blocked`, never the erroneous 16ms result. Total: 31 passing source/helper tests. The strict owner, collection-status, geometry, native-lifecycle and graceful-finalization fixes remain unchanged.
