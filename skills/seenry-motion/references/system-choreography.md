# A shared motion language

Use this for consistency across an actual product. Start with representative navigation, a dense control, a disclosure and an expressive scene. Preserve existing semantics, loading and failure behavior. A polished isolated demo does not establish that the product uses its mechanics.

## Assign motion by relationship

- Selection: move one background between stable labels. Measure actual bounds after font loading, resizing and scrolling. Preserve selected state separately from hover and keyboard focus. Never move text or change button width when selection changes.
- Contextual settings: grow a surface from its stationary trigger. Animate shell geometry separately from text. Keep playback, seeking or the underlying task usable. A liquid connection can clarify origin; it is unnecessary on every dropdown.
- Feedback: reflect the actual operation. Swap the glyph within a stable hit area. Copy success follows clipboard completion; playback follows media events.
- Navigation: retain orientation and return context. Do not replay decorative entrances after each filter change or wait for an exit before honoring input.

Use shared component implementations and semantic timing roles. Feedback can begin around 130 ms, surfaces around 240–280 ms and exits around 150–180 ms as starting recipes, then judge actual distance and footage. Source measurements override recipes in recreation mode. Do not turn a timing table into evidence of visual fidelity.

## Runtime contracts

`selection-surface.mjs` exports `createSelectionSurface(root, {selectedLayer, hoverLayer, selector})`. Put two aria-hidden spans with classes `motion-rail-selected` and `motion-rail-hover` inside a `.motion-rail` container. Include `selection-surface.css`. The host updates `aria-selected`, `aria-pressed` or `aria-current="page"`, keyboard behavior and accessible names. The helper moves backgrounds only; `destroy()` removes observers and listeners. Use unscaled positioning roots. Set `data-tone` to soft, ink, paper or none, then style text contrast in the host.

`anchored-surface.mjs` exports `createAnchoredSurface(panel, trigger, {duration:280})`. Supply `svg[data-surface]` containing `path[data-bridge]` and `rect[data-shell]`, plus a separate `[data-content]` wrapper. Position the SVG absolutely at inset zero with overflow visible and the chosen fill; place content at its natural size. Position the panel above its trigger. Call `setOpen(boolean)`; call `destroy()` on unmount. The host owns pointer events, inert, aria-expanded, Escape, outside dismissal and focus return. Check that every ancestor permits the surface to fit; use a different placement or scrollable fallback for short media. This authored shell transition is an adaptation, not a measured reference trajectory.

## Verify the system

Observe normal-speed playback, rapid reversal and hover between adjacent items. Opening settings must not resize the media or shift siblings. Check keyboard focus, touch, a short viewport and live reduced motion. Reduced motion settles geometry immediately while preserving state and feedback. Keep failed observations in the review. Share the implementation across the actual product before reporting consistency.
