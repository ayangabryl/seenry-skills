---
name: web-atlas-web-design
description: "Build or improve a website using inspected Web Atlas references, responsive screenshots and observed design tokens. Use for web implementation or visual refinement; retain the project stack and the user\u2019s brand direction."
license: MIT
metadata:
  author: Web Atlas
  version: "1.0.0"
---

# Build from website evidence

Use Web Atlas at `https://web-atlas.ayangabryl.workers.dev/mcp` when connected. Keep the user's chosen stack, product purpose, existing design system and requested scope. The library informs decisions; it does not replace the brief.

## Research the design problem

For a full website, find relevant brands with `list_sites` and inspect selected pages with `search_references`. For a specific block, use `search_sections` with Hero, Pricing, Footer, Navigation or another facet from `get_library_facets`. A pricing section and a pricing page are different research objects.

Open `get_page` for capture coverage, then `get_screenshot` for the relevant viewport and section. Inspect tall-page segments where the behavior/layout depends on the rest of the page. Compare desktop and mobile only where both exist; do not infer a mobile layout by shrinking the desktop reference. Check dark support explicitly.

Use `get_tokens(id,viewport,theme,q)` for source variable names, values, aliases and evidence of semantic roles. Read `get_design` in bounded slices when the design report would clarify an implementation choice. These are observations from a capture, not a verified owner-authored design specification. Mark estimates as estimates.

## Translate, implement, verify

Write the few decisions that drive the result: hierarchy, content width, type scale, spacing rhythm, surfaces, and interaction states. Tie each adopted idea to an observed reference and the user's need. Combine useful principles into the user's own visual direction rather than copying a page's composition, claims, logo or illustrations.

Implement the requested complete flow, including meaningful loading, empty, error, hover, focus and responsive states. Use the project's existing primitives where they fit. Source media and typography deliberately; preserve fallback behavior when assets fail.

Inspect the rendered result at a representative desktop width and mobile width, and in supported appearances. Compare hierarchy, wrapping, crop behavior, navigation, keyboard access and page continuity with the chosen evidence. Fix visible issues and report any state you could not verify. Use the actual browser/render tools available in the project; do not claim a screenshot or interaction check based only on source code.

A useful handoff names what was built, the references that shaped it, and the completed checks. Do not turn an ordinary implementation request into a mandatory redesign, endless catalog sweep or deployment.
