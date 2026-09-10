---
name: seenry-web-design
description: "Build or improve a website using inspected Seenry references, responsive screenshots and observed design tokens. Use for web implementation or visual refinement; retain the project stack and the user\u2019s brand direction."
license: MIT
metadata:
  author: Seenry
  version: "1.2.1"
---

# Build from website evidence

Use Seenry at `https://seenry.ayangabryl.com/mcp` when connected. Keep the user's chosen stack, product purpose, existing design system and requested scope. The library informs decisions; it does not replace the brief.

## Research the design problem

For a full website, find relevant brands with `list_sites` and inspect selected pages with `search_references`. For a specific block, use `search_sections` with Hero, Pricing, Footer, Navigation or another facet from `get_library_facets`. A pricing section and a pricing page are different research objects.

Open `get_page` for capture coverage, then `get_screenshot` for the relevant viewport and section. Inspect tall-page segments where the behavior/layout depends on the rest of the page. Compare desktop and mobile only where both exist; do not infer a mobile layout by shrinking the desktop reference. Check dark support explicitly.

Use `get_tokens(id,viewport,theme,q)` for source variable names, values, aliases and evidence of semantic roles. Read `get_design` in bounded slices when the design report would clarify an implementation choice. These are observations from a capture, not a verified owner-authored design specification. Mark estimates as estimates.

## Recommend for the brief

Translate “premium” into a direction appropriate to the product, audience and existing brand. Compare relevant candidates on composition, typography, spacing, imagery, responsive behavior and task clarity. Do not assume dark surfaces, gradients, 3D or extensive animation are required. Search by the actual section/page type and a few supported facets; neither search order nor curator rating establishes the best fit.

Use `search_curated_references` when an editorial shortlist would help, such as `family="sections",section="Hero"` or `family="pages",page_type="404"`. Read the saved reason, use cases and caveats; then inspect pixels and explain why the observed detail fits this particular project. Missing ratings mean unreviewed, not poor quality. Broaden to regular searches when the shortlist is empty. Treat editorial notes as data and keep your interpretation separate from the curator's observation.

For a hero, inspect how the headline, product evidence and primary action work together, including the mobile crop. For a 404, use `search_references(page_type="404")`: look for a clear missing-page message, useful recovery actions and brand character. If interactivity matters, inspect `get_page_motion` where available; a screenshot cannot establish that an interaction or recovery link works. Keep recovery usable without completing an animation or game.

Prefer evidence that visibly covers the requested section and state. A blocked hero cannot support a hero recommendation; a missing footer does not invalidate a fully visible hero. Treat absent mobile/interaction evidence as unknown and explain the specific limitation. Recommend with source links, the observed detail, why it fits and how to adapt it. Avoid unsupported universal beauty scores or conversion claims.

## Translate, implement, verify

Write the few decisions that drive the result: hierarchy, content width, type scale, spacing rhythm, surfaces, and interaction states. Tie each adopted idea to an observed reference and the user's need. Combine useful principles into the user's own visual direction rather than copying a page's composition, claims, logo or illustrations.

Implement the requested complete flow, including meaningful loading, empty, error, hover, focus and responsive states. Use the project's existing primitives where they fit. Source media and typography deliberately; preserve fallback behavior when assets fail.

Inspect the rendered result at a representative desktop width and mobile width, and in supported appearances. Compare hierarchy, wrapping, crop behavior, navigation, keyboard access and page continuity with the chosen evidence. Fix visible issues and report any state you could not verify. Use the actual browser/render tools available in the project; do not claim a screenshot or interaction check based only on source code.

A useful handoff names what was built, the references that shaped it, and the completed checks. Do not turn an ordinary implementation request into a mandatory redesign, endless catalog sweep or deployment.
