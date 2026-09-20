# Media controls, containment and stable disclosure

Scoped study after the Room Tone player comparison. Use for compact media components, nested surfaces and disclosure controls. This is observed evidence plus proposed repairs, not an accepted design recipe.

## Reference evidence inspected on 2026-09-20

- [Mobbin pricing](https://seenry.design/#/page/ed7391db1f844735b1ef2131e3e1cb65): inspected pricing screen. Neutral surfaces separate emphasis; small blue savings text has a specific role. Thin borders, pills and dividers remain. Transfer the hierarchy of emphasis, not its large marketing type scale.
- [Squarespace](https://seenry.design/#/page/6ec0a909d80c42968e3466b8992a5a79): inspected hero and visible template previews/statistics. Rich warm imagery carries identity while primary controls are simple high-contrast rectangles. Capture reports an entrance overlay and failed images; do not infer missing states. It contradicts a universal white/gray or rounded-button prescription.
- [Kurt Winter](https://seenry.design/#/page/069a6db4a83d453b898bbe790c19756d): inspected hero. A large serif composition and sparse navigation provide a deliberate focal hierarchy. WebGL/intro and lower-page capture warnings prevent claims about full motion. Its editorial scale is not appropriate for a small player.
- [iOS media controls](https://seenry.design/#/design/ed058e46051572baf487787fe550787d), Design Spells: inspected clip frames and playback samples. White filled pause and familiar skip glyphs occupy stable locations on a dark media plane; peripheral controls stay secondary. The creator describes skip-arrow rotation, but exact timing and interruption were not measured. Ten-second skip is not the same command as previous/next track.
- [Spotify chapters](https://seenry.design/#/design/7dc840e134dd51672ee7655ca49d8084), Design Spells: inspected compact and expanded/intermediate frames. The same chapter rows remain recognizable across expansion; green identifies the playing chapter. This is relational continuity, not evidence for coloring an entire player green. Exact easing, keyboard behavior and reversal remain unverified.

Website captures are September 9 snapshots, not a survey proving a year-wide trend. Five-star site ratings have no saved written rationale. No source artwork or runtime code is bundled.

## What failed in B

B combines green, cream and copper with a cast shadow, raised speaker, inner shadow, asymmetric shell corners and uppercase microcopy. The user found it below the references. No supplied identity justified this particular material system. Hypothesis: excessive competing surface treatment weakens clarity; compare a flatter treatment on identical geometry before promoting that explanation.

At a 390px viewport, the outer card top stayed at y=250, but the collapse trigger moved from x≈132 to x=281 and y=269 to y=262. Compact metadata changed grid placement while shell padding also changed. Smooth height interpolation did not preserve the action's location. This is an observed usability defect, separate from preference about palette.

## Implementation decisions to test

Use consistent library play/pause, previous/next-track and speaker/mute assets. Keep accessible action names, visible focus and sufficient targets; the glyph may be much smaller than its hit area. Filled media glyphs are a candidate for compact readability, not a universal icon rule. Volume must remain a keyboard-operable range; a speaker icon can identify it or toggle mute with volume restoration. Avoid ambiguous bare arrows.

Assign the disclosure trigger an explicit grid area. Keep its hit rectangle and the shell anchor stationary while the content region expands. Hide compact metadata without making unrelated controls change columns. Avoid animating padding and radius unless their movement is purposeful. Measure intermediate and settled rectangles, repeat rapidly, reverse mid-transition, and test live reduced motion. Intentional content expansion can move following content; a universal fixed-height blank container is not the solution.

For concentric uniform insets, start with Rinner=max(0, Router−d), where d includes the border and padding between the compared edges. Example: 24px outer radius, 1px border and 7px padding gives a 16px inner starting radius. This geometry does not apply automatically to independently positioned buttons, circular artwork or uneven insets. Inspect native-scale corner gaps and clipping. Avoid arbitrary per-corner variation without a visible shape concept.

Sources: [CSS corner shaping](https://www.w3.org/TR/css-backgrounds-3/#corner-shaping) defines border/content-edge radii; applying it to nested elements is a geometric design starting point, not a mandated UI style. [Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) supports choosing symbols, text or both according to the action and platform.

Retain B unchanged as benchmark evidence. A host repair must be labeled assisted; a fresh model transfer test is required before claiming the skill resolves these failures reliably.
