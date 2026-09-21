# Media controls and stable disclosure

Use for compact players, nested surfaces and expanding regions. Choose symbols according to the command: previous track, next track and skip ten seconds are different operations. Use a consistent icon family, accessible names and keyboard focus. A small glyph can sit in a larger hit area. Keep volume keyboard-operable, and restore the prior level when unmuting.

Assign the disclosure trigger an explicit layout anchor. Expanding content should not move its trigger into a different column. Measure the trigger and shell at the start, midpoint and settled state; reverse before completion. Smooth height interpolation cannot repair a sudden grid reassignment. Following content can move during legitimate expansion; reserving an empty fixed-height box everywhere is not the answer.

For uniform concentric insets, start with inner radius = max(0, outer radius − inset), including border thickness in the inset. Then inspect the actual corner gaps. Uneven insets, circular artwork and independently placed buttons need optical judgment. This is a geometry relationship, not a universal radius recipe.

Separate visual roles before adding surface effects. Artwork can carry identity while transport controls remain quiet. Compare filled and outline media glyphs at their actual size; do not assume either is always superior. Selected track, playing state and keyboard focus each need understandable evidence without repeated labels or competing decorations.

Countercase: a dense mixing desk may need stronger region boundaries and persistent state labels. Preserve necessary information when simplifying a small player. Check long titles, narrow widths, muted state, unavailable media, rapid input and reduced motion.
