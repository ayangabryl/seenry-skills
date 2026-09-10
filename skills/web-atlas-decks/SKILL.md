---
name: web-atlas-decks
description: "Research presentation decks in Web Atlas, preserving slide order, narrative roles and source metadata. Use for pitch deck inspiration, presentation structure or slide design; brand identity guidelines use branding research."
license: MIT
metadata:
  author: Web Atlas
  version: "1.0.0"
---

# Study both the story and the slide

Use `https://web-atlas.ayangabryl.workers.dev/mcp` and `search_designs(family="decks")`. Presentation decks are separate from branding and guidelines, even when source tags overlap. Choose a relevant deck purpose before comparing layouts: a pitch, sales narrative and product introduction serve different audiences.

Call `get_design_reference(id)` for the ordered assets and original source information. Pass its `next` object to continue; do not treat the first batch as the whole deck. Use `get_reference_asset(id,index)` for actual slide pixels or the published PDF. Keep slide numbers, collection IDs and source URLs in notes. Check saved/total asset counts and partial-import warnings.

For narrative research, inspect the sequence around each slide you recommend. Describe the role it earns: context, problem, evidence, product explanation, differentiation, business case or next action. Do not infer hidden slides, business performance or the speaker's intended script from a cover image.

For visual research, compare information density, grid, typography hierarchy, image treatment, data presentation and transitions between slide types. Separate values explicitly written in the deck from estimates made from images. Source media does not expose website CSS variables.

Adapt the useful structure to the user's actual facts and audience. If building a deck, preserve supplied claims and identify missing facts instead of inventing metrics. Use the available presentation tooling and inspect the rendered pages in order for clipping, legibility and consistency. Return the requested artifact or a focused reference comparison, with attribution and completeness limitations.
