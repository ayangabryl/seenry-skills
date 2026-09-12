# From an idea to a score

Read while planning expressive work. Motion establishes continuity and explains change. Choose the task first, then CSS/SVG, Web Animations, GSAP, Lottie or WebGL. The number of engines is not a quality measure. Use one owner per property and native scrolling unless a demonstrated need justifies more.

These are **original proposed exercises**, not reconstructions of an agency's implementation. Their timings are starting hypotheses to inspect, not scientifically optimal constants.

## Print studio: from a mark to its application

Reader question: can this identity work beyond a logo? Keep one printed sheet and its left alignment anchored. The artwork moves from full-bleed crop to full sheet; supporting applications appear only after the sheet is readable. Text never transforms with the artwork.

| Progress | Leading action | Quiet/supporting action | Reader learns |
| --- | --- | --- | --- |
| 0–.18 | Hold the close crop | Name and service remain readable | Character of the work |
| .18–.55 | Reveal sheet edges continuously | Caption stays anchored | Scale and application |
| .55–.72 | Hold the full sheet | One factual caption | What the project is |
| .72–1 | Transition toward the next application | Normal document flow resumes | A coherent family exists |

First test direct scrub with no catch-up delay. Reverse should show exactly the same visual at the same progress. On small/short viewports and reduced motion use a normal image sequence. No mandatory pin is needed if ordinary scrolling conveys the idea. Never pin blank waiting time to mimic a movie.

`assets/score.mjs` supplies deterministic numeric tracks with explicit holds; `assets/score-demo.html` demonstrates this proposed relationship without an external engine. It is an engineering proof, not portfolio-ready artwork. GSAP's existing `scroll-scene.mjs` remains available for richer compositions. The score and fallback are independent of the engine.

## Comparison control: continuity without delay

Reader task: compare two views. Keep the frame, heading and control location fixed. Change only the compared layer. Pointer drag and keyboard arrows alter the same value; interruption begins at the displayed value. Do not animate a drag behind the pointer. Once released, a small snap may clarify a discrete choice. The accessible value updates with the logical state; announce a completed change rather than every animation frame.

## Expandable card: preserve the user's place

Reader task: inspect detail, then return. Measure the real expanded layout, retain the triggering title as the anchor, and animate geometry only where it preserves understanding. Hide intermediate overflow without clipping focus. Repeated activation reverses from current geometry. Reduced motion commits the final state immediately. Test 1→10→100 and long labels if content changes width. A number animation must preserve decimal and unit anchors; a rolling library cannot fix a shifting layout.

For a copy button, success follows the clipboard promise. An icon may morph within a fixed box using the bundled Morphicons adapter; failure exposes recovery. A shape morph does not need an additional pill, glow or floating animation. For play/pause, inspect a filled library variant at its final size as well as the outline alternative; an uncontained icon may use invisible hit padding and visible keyboard focus.

## Review at actual speed

Record a first entry, purposeful slow traversal, fast reversal, repeated activation and reduced-motion path. Watch at normal playback speed. Inspect pauses as carefully as movement. Compare with the static equivalent: does movement clarify origin, causality or relationship? If it only prolongs reading, simplify it. Capture duration/FPS and emulation limits separately from source performance.

[Apple motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion) motivates clear, controllable feedback. [Carbon](https://carbondesignsystem.com/elements/motion/overview/) distinguishes routine task motion from expressive moments; its brand-specific easing rules are not universal prohibitions. [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) provides mechanics, not a narrative.

## Choose local effect mechanisms only after the score

For a boundary light, truthful process presence, liquid grouping, reflective material or image reveal, consult [the expressive-effects reference](expressive-effects.md). Declare selected package names in `motion_libraries` so later stage packets receive its fit, interruption and fallback guidance. These effects do not supply a page narrative or make a generic composition distinctive by themselves.
