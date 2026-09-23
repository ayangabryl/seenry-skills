# Panel, search focus and image contact

Inspected the public Melt preview at https://libraries.dev/gooey.html on September 24, 2026. Dragged one visible 84px image into the other. Observed a softened combined image silhouette; the old Seenry noisy contact rectangle retained separate hard boundaries and did not reproduce this mechanism. The new renderer applies color blur and alpha threshold to the combined clipped images, based on their edge gap. Its numeric transfer curve is an authored approximation, not a source shader measurement.

Panel: replaced a jumping content box and delayed SVG backdrop with a single CSS width/height shell. Contents remain mounted, clipped, inert while closed and fade within the shell. Escape and focus return checked in Chromium.

Search: verified pointer activation yields `data-keyboard=false` and outline `none`; Tab moves to Close with `data-keyboard=true` and outline `solid`. No console errors in checked interaction. Build and skill validator pass. Exact image shader parity and other browser engines remain unverified.
