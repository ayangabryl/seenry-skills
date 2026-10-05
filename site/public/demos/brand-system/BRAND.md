# Seenry example brand rules

Version 1 · 2026-09-23 · Scope: the interactive Library and Saved examples on the skill site. This codifies their implemented system, not every screen on seenry.design.

## Identity and language

Use Open Runde from the site's local font files. The wordmark is text in this example, not a new official logo asset. Describe the action directly: Save, Unsave, View saved, Browse library. Use the same reference names and state across screens. No new marketing claim or library total is implied by the demo data.

## Shared implementation

The source of truth is `site/src/project-demos.css`, scoped to `.p-brand-surface`. Roles are `--brand-canvas`, `--brand-surface`, `--brand-ink`, `--brand-muted`, `--brand-action`, and `--brand-radius`. Values live in CSS; do not create a parallel palette in page components. White content sits on a gray host; charcoal identifies text and the main action. Color in thumbnail content does not become a UI accent.

`BrandButton` and `ReferenceRow` in `site/src/ProjectDemos.jsx` are reused by Library and Saved. New example screens must use those components and the same search treatment. Buttons have pill corners and shallow depth; content frames use the shared 24px radius. Save actions remain quieter than the navigation action. Do not restyle a primary action independently or place a raised action inside a second raised wrapper.

Titles, body text and supporting labels use their shared CSS roles. Layout changes at the narrow breakpoint; it does not shrink all type uniformly. Keep the title, search and list aligned. A visible search focus ring belongs to the whole field, not a second rectangle inside the input.

## Interaction

The host owns saved IDs and the query. Saving changes the same reference in either view. Search filters visible records locally. An empty result explains how to recover. Buttons expose pressed state; icon-only controls name their action. Keyboard focus must remain visible.

View transitions use a short opacity/position change and respect the site's reduced-motion setting. Hover and pressed feedback use shared CSS; reduced motion removes displacement. Do not add independent entrance animations to every row.

## Assets and maintenance

Photography: Joel Filipe / Unsplash, https://unsplash.com/photos/white-modern-cement-building-under-blue-sky-RFDP7_80v5A . Other thumbnails are original schematic studies. These are example records, not an API-backed library.

Change shared tokens/components first, then check both views, populated/empty results, saving, keyboard focus and narrow reflow. Record scoped exceptions in DESIGN.md. This guide describes implemented rules; visual acceptance by the user remains pending.
