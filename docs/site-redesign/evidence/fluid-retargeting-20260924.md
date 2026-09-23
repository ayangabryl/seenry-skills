# Fluid retargeting study — September 24, 2026

Research source: https://libraries.dev/gooey.html (public preview only). Attribution belongs here, not in copy prompts. No engine code or dependency was imported.

Captured public action opening/closing as 202 CDP JPEG frames with original timestamps. The source exposes 550ms fan position timing and 40ms stagger; the captured intermediate silhouette connects during separation and closes into the trigger. Inspected a six-frame contact sheet. Captured the revised Seenry closure as 36 timestamped screenshots over 3.002 seconds and slider reversal as 16 screenshots. Videos and original timestamp manifests are retained in the sibling `motion-study-20260924` research artifact directory. Playback exports cap idle frame gaps at 120ms; original timestamps remain authoritative. Screenshot cadence is variable, not a 60fps fidelity claim. Browser normal-speed interactions were exercised; independent exported-video playback was not reviewed.

Changes derived from the comparison and implementation review:

- Remove redundant position smoothing on action surfaces whose DOM already transitions.
- Keep leading slider edge at the authoritative target; extend the trailing edge instead of translating a rigid circle late.
- Derive bounded bend from both components of target velocity, with filtered recovery.
- Hide collapsed action glyphs without removing their merge surfaces.
- For interrupted numbers, preserve the currently more visible glyph, remove repeated stagger delays and skip unchanged columns.
- Restrict slider outline to keyboard focus visibility.

Chromium checks: action open/close; selection reversal; slider End/Home retained native values 100/0 (observed intermediate surface width 59.75px, resting width 40px); eight number increments settled at 56 with exactly two layers per column; bend settled to its destination; no console errors in inspected routes. Reference slider keyboard capture was inconclusive and is not used to claim parity. Bend response is authored from mechanics, not a fitted reference trajectory. Safari, Firefox and exact temporal parity remain unverified.
