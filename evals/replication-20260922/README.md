# Liquid popover replication study

This local study repairs the intent mismatch in the earlier public `motion-studies`
example. That example was a white collection-card adaptation. This study instead
preserves Kopp's dark two-trigger composition, labels, relative placement and liquid
separation/reunion. It does not replace the public site or its credited adaptation.

## Source and inspection

Seenry MCP `get_design_video` returned reference
`24ebbdf6910e69ca125cfae5350b4d01`, attributed to Kopp (`handlekoppxo`).
Source page: https://seenry.design/design/24ebbdf6910e69ca125cfae5350b4d01

Media: https://cdn.seenry.design/designs/24ebbdf6910e69ca125cfae5350b4d01/video.mp4

SHA-256: `541a03098fc827ea1b6088cdcf9e00ee230790566b0bcdbc6d603d1a0a56be1e`.
Encoded dimensions 1154×720; duration 10.1333s; encoded cadence 60fps.
Encoded cadence is not proof of capture smoothness.

The actual recording was played. Short opening/closing intervals were decoded,
and source-coordinate bounds and flat colors were inspected. `source-measurements.json`
contains a threshold-based diagnostic, **not** a reliable universal section or shape
detector: text/compression artifacts can extend its closing bounding box. Native
frames, not those bounds alone, informed the close fit.

Source footage/frames and browser screenshots stay local, excluded from installed
skills and git. Preserve attribution; these are reference media, not redistributable
production assets. Icons in the reconstruction are Lucide React 0.468.0 with its ISC
license retained under `demo/icons/LICENSE`. Arial is a disclosed substitute; the
reference font family has not been established.

## Implementation and evidence

- `project.json` selects the new replicate route and `fluid-menu` mechanism.
- `supplied.json` records actual resource hashes and size separately from observations.
- The author read the replication guides and surface guidance. No creative alternative
  layout or substitute collection content was introduced in this build.
- `demo/` is an original HTML/CSS/SVG implementation fitted to source observations.
  Surface geometry and clipping animate separately from text and controls. The
  final action panel is (309,67,271,264), Share panel (623,430,267,190), in source
  pixel coordinates. Flat background #0c0d0b and fill #191817 come from sampled pixels.
- Opening was compared at 0.700, 0.733, 0.783, 0.817, 0.833, 0.883, 0.900 and 0.950s.
  A separate close fit replaced a generic reverse after frame comparison showed it
  was wrong. Event timing and trajectory parameters remain estimates.
- Author-assisted build and browser verification do not establish an unassisted
  model success rate. A fresh independent brief/model transfer test is still needed
  before claiming generalized replication accuracy.

## Checks and result

Package: 227 Python tests, 3 selected existing JS helper tests, package/link/runtime
validation pass. New tests cover replicate routing, all 25 motion selectors,
relocation and runtime closure, missing resources, conflicting selection and
fail-closed ledger behavior.

Browser: reference-size endpoint review, synchronized playback, opening phase
comparison, 10 rapid toggles, immediate keyboard opening/focus, ArrowDown selection,
Escape return, reduced-motion endpoint, and 320px/390px frame layouts. A 320px Share
menu remains within the viewport with no horizontal overflow. This is Chromium
emulation, not physical-device or Safari verification. New keyboard/reduced-motion
behavior was not demonstrated by the reference.

The ledger intentionally reports **unverified**, despite matching recorded endpoint
measurements. The original font/icons are unknown, a complete temporal tolerance
has not been established, and continuous silhouette/blur are fitted approximations.
Do not publish this as a pixel-perfect result or as proof that all motion patterns
are bundled. The six local motion guides cover mechanisms; they are not 32 copied
or independently verified transitions.dev snippets.

## Run locally

Serve this folder with `python3 -m http.server 8870 --bind 127.0.0.1` and open
http://127.0.0.1:8870/. `demo/` works independently without source media. The review
page needs the original video at `source/popover.mp4` and local frame extracts:
`frames` at 0, .3, .6, 1, 1.5, 2.5, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5,
9, 9.5, 10; `opening` at .7, .7333, .7667, .8, .8333, .8667, .9, .95. Use the
bundled `skills/seenry-motion/scripts/video_frames.py extract` with `--width 1154`.
`closing` uses 3.1, 3.15, 3.2, 3.25, 3.3 and 3.35 seconds. The manifest records actual decoded timestamps, which can be later than requested.

Run the ledger checker from the repository root:
`python skills/seenry/scripts/replication_gate.py evals/replication-20260922/ledger.json`.
It exits 1 while unknowns remain. Missing local screenshots are evidence gaps, not
an invitation to mark measurements passed without capturing the build again.
