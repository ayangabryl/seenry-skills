# Replicate an observed transition

**Read when:** the person points at a recording, a live site or a named effect and wants that motion, not a recipe.

Replication follows what was observed. The recipes and timing tokens fill gaps; they never retime a reference.

## Contents

- [1. Get the evidence](#1-get-the-evidence)
- [2. Extract frames](#2-extract-frames)
- [3. Measure](#3-measure)
- [4. Pick the mechanism](#4-pick-the-mechanism)
- [5. Check for a maintained library](#5-check-for-a-maintained-library)
- [6. Build](#6-build)
- [7. Compare side by side](#7-compare-side-by-side)
- [What to report](#what-to-report)

## 1. Get the evidence

Use a recording the person supplied, your own capture, or a clip from their authorized source. A poster frame cannot establish timing, easing, keyboard behavior or interruption; without playback, label every timing as proposed.

With Seenry MCP connected (it is optional):

| Looking for | Tools |
| --- | --- |
| A website's recorded journey | `search_references(motion=true, site=...)`, then `get_page_motion(id, viewport)` |
| Creator motion studies | `get_design_taxonomy`, `search_designs(family="motion", ...)`, then `get_design_video` |
| Clips inside a collection | `get_design_reference`, `get_reference_asset` |
| Editorial picks | `search_curated_references` with the `motion` or `walkthroughs` family |

Read the recording's coverage, duration, cadence and warnings before trusting it. Keep the public source page or Seenry ID with the file. A signed playback URL is temporary access, not provenance: never store tokens or query strings.

Watch at normal speed first. Name the trigger, the stationary anchor, the moving subject, the overlap and the settled result.

## 2. Extract frames

The [video helper](../scripts/video_frames.py) needs Python's standard library and a local `ffmpeg` and `ffprobe`. It downloads nothing and calls no model. Run it from the `seenry-motion` directory, or use its absolute path.

```sh
python3 scripts/video_frames.py inspect /path/to/reference.mp4 --source seenry:reference-id
python3 scripts/video_frames.py extract /path/to/reference.mp4 --out /path/to/study --times 0 0.12 0.28 0.55 0.9 --source https://example.com/project
python3 scripts/video_frames.py extract /path/to/reference.mp4 --out /path/to/detail --every-frame --start 0.2 --end 0.5 --max-frames 24
```

- `inspect` prints stream metadata and the file's SHA-256.
- `extract` writes PNGs, `manifest.json` and `contact-sheet.html` into a new directory and refuses to overwrite one.
- Limits: 24 images by default (`--max-frames` up to 96), `--times` spanning at most 30 seconds, `--every-frame` intervals of at most 5 seconds, PNG width 640 by default (`--width` 160 to 1280), input up to 1 GiB, local MP4/MOV, WebM/MKV, AVI or GIF only.
- Times are seconds from the stream's start. Each request takes the first decoded frame at or after it; the manifest records both the request and the real frame time.
- The manifest always says `playback_reviewed: false`. Record your own playback review separately.

Sample the **last unchanged**, **first changing**, **midpoint** and **first settled** frames of each transition. Use every-frame mode only for a short interval where a skip or collision is in question. Repeated frames mean the encoded frame rate overstates the real cadence.

## 3. Measure

Duration is **first visible movement to visual settle**, per layer, excluding pointer dwell and network wait. Allow one source frame of error at each end.

Measure in the source's own coordinates: host, trigger, resting shell and radius; then displacement, bounds, opacity and content at start, quarter, midpoint, three-quarter and settle. Record one row per track:

| Track | Record |
| --- | --- |
| Trigger | Input frame, hit area, whether it moves |
| Surface | Position, width and height, radius, shadow, clipping, overshoot |
| Contents | First visible frame, opacity, offsets, stagger, baseline |
| Neighbours | Fixed, moved, compressed or overlapped |
| Return | Close trigger, path and settle, measured separately from opening |
| Hover | Entry, hold, exit and re-entry, or "unobserved" |

Keep measurements and estimates in separate columns. A fitted curve is an approximation; do not claim spring constants from a compressed clip or invent frames between captured ones. Keep three statuses apart: guidance available, implementation exercised, reference matched. One never upgrades another.

## 4. Pick the mechanism

Follow the **same boundary** through the clip, then choose:

| Observed | Build |
| --- | --- |
| One surface continuously changes shape | Animate that surface; no second trigger underneath unless the clip shows one |
| A rounded rectangle changes width and height but glyphs keep their size | A shell with geometry and radius control, plus a separately positioned content layer |
| A highlight travels between targets | One persistent layer moved between measured targets, not a background per row |
| A label dissolves into another | Outgoing and incoming layers, one semantic current value |
| Digits roll through places | Per-place tracks with the unit anchored; NumberFlow or [number-transition.mjs](../assets/number-transition.mjs) |
| Digits pop in as replacements | Clipped place-value slots with a short capped stagger |
| A value follows a drag | Direct update, no queue behind the pointer |
| A soft liquid join | SVG filtering or masking on a shared silhouette; prove the silhouette at native size first |
| Movement tied to scrolling | Progress-driven, with the source's holds; never synthesize scroll hijacking from a video |

A panel appearing near a trigger is not automatically a button-to-panel morph. Hover is its own transition: preserve the observed colour, shape or position response and do not add a default lift.

## 5. Check for a maintained library

For a named effect, a published package may already implement it. Read the project's `package.json`, then pick through `seenry-libraries` ([catalog](../../seenry-libraries/references/catalog.md)) and run its check script for licence and last release. Install into the target project only, use the documented API and record the version. Never vendor a package into the skill or present its code as Seenry's.

Defaults rarely equal the reference's configuration: fix the configuration and the surrounding layout first, and write a local adapter only where the API cannot express the behavior. If the package does not fit (other framework, licence, missing configuration), say why and reconstruct from the measurements. A working import is functional evidence, not visual parity.

## 6. Build

1. Use plain CSS or Web Animations when they reproduce the score; add a spring or rendering library only when the observed behavior needs it.
2. One owner per animated property.
3. Reversal starts from the current visual state, never a hardcoded first frame; a stale close timer must not hide a reopened surface.
4. Behaviors the clip never shows (a second input before settle, resize, reduced motion, keyboard) still have to work. Build them from the recipes and label them as proposed, not observed.

## 7. Compare side by side

1. Same viewport, same content, same state.
2. Align the settled geometry and the input frame first.
3. Compare at the same trigger-relative times as step 2's samples, after fonts and assets load. Capture the live animation; a debug jump to an end state checks endpoints only.
4. Compare shape, anchor, content and neighbours at each checkpoint, then watch both at normal speed.
5. Recheck after the last timing edit.

A simple transition reproduced accurately is more faithful than an elaborate one that differs. Do not score fidelity by counting effects.

## What to report

Source or Seenry ID and file hash, viewport and capture method, the interval reviewed, the real frame timestamps, what was observed, what was inferred, whether playback was reviewed, and each unresolved mismatch by track with a time uncertainty at least as large as the source's cadence.
