# Study an actual transition

Use a supplied local recording, your own capture, or a reference clip obtained through the user's authorized source workflow. Seenry MCP can find journeys and creator clips with their source, viewport, coverage and recording warnings; it is optional. Keep the public source page or Seenry ID with the downloaded file. A signed playback URL is temporary access, not suitable provenance: do not put tokens, credentials or query strings in study artifacts. The helper below never downloads anything and does not bypass a provider's access or media-display rules.

Start with normal-speed playback. Identify the trigger, stationary anchor, moving subject, overlap, handoff and settled result. Then inspect a few intermediate frames around the part you need to understand. Use every decoded frame only for a short interval where a skip, collision or continuity question remains. Review normal playback again after inspecting the frames; a pleasing contact sheet cannot prove the transition feels coherent. Mark what you directly observed and keep easing, timing curves and implementation details inferred unless the source exposes them.

## Local inspection and frame evidence

The [video helper](../scripts/video_frames.py) uses Python's standard library plus locally installed `ffmpeg` and `ffprobe`. It does not install dependencies or call a model. Run from the installed `seenry-motion` directory; elsewhere use its absolute script path.

```sh
python3 scripts/video_frames.py inspect /path/to/reference.mp4 --source seenry:reference-id
python3 scripts/video_frames.py extract /path/to/reference.mp4 --out /path/to/study --times 0 0.12 0.28 0.55 0.9 --source https://example.com/project
python3 scripts/video_frames.py extract /path/to/reference.mp4 --out /path/to/detail --every-frame --start 0.2 --end 0.5 --max-frames 24
```

`inspect` reports selected stream metadata and the source SHA-256 without dumping container tags. `extract` creates PNGs, `manifest.json` and `contact-sheet.html` in a new directory; it refuses to overwrite a previous study. There is no automatic all-video extraction. The default bound is 24 images, explicitly adjustable to 96. Selected timestamps must span at most 30 seconds; every-frame intervals at most five seconds. Processing times out after 30 seconds per media command, and local input size is capped at 1 GiB. Use a shorter source clip if these bounds are insufficient. MP4/MOV, WebM/MKV, AVI and GIF containers are allowed; remote protocols and playlist formats are excluded.

Times are seconds relative to the video stream's declared start. Selection uses the first decoded frame at or after each requested time, so requests may share a frame; the manifest preserves both the requests and the actual frame PTS with its time base. It searches at most two seconds beyond the final request and fails if that cannot satisfy a request. Every-frame mode includes the start and excludes the end, preserves variable frame timing, and fails rather than silently truncating an interval that exceeds the frame budget. PNGs have a default maximum width of 640 pixels (`--width 160` through `1280`); inspect an original-resolution frame separately when a fine detail requires it.

Open the HTML contact sheet to view the samples with actual timestamps. Its local file chooser verifies the chosen original's SHA-256 in the browser, then enables native video playback and frame-to-time navigation. No file is uploaded or copied into the study. This hashes the file in browser memory, so prefer short clips; if local-file browser restrictions, codec support or GIF playback prevent it, use an existing player for normal-speed review. A browser seek need not land on the exact decoded frame: the PNG and manifest are the frame evidence. The helper always records `playback_reviewed: false`; record your actual playback review separately.

## Describe what the evidence can establish

Report source/ID and hash, viewport and known capture method, reviewed interval, actual timestamps, observed behavior and the design decision it informs. Include playback reviewed/unavailable and the unresolved limits. Encoded frame rate and frame count do not prove capture rate. Repeated frames, compressed differences and skipped captured states can survive a smooth-looking video; distinct PNG hashes describe only these scaled decoded samples. An unknown capture cadence stays unknown. A partial journey cannot establish unseen states, keyboard behavior or recovery after interruption. If frames are unavailable, reason from the supplied clip or behavior guides and label timing proposals before testing locally.
