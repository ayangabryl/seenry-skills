---
name: seenry
description: "Design and build web interfaces at design-studio quality, not AI-template quality. Use for any new page, landing page, dashboard, app shell, pricing, settings, form or single component, for redesigns and visual polish, and for matching a reference. Works like a studio: fixes a strict frame (pixel grid, columns, padding, safe space, type set), explores several compositions inside it, critiques them side by side, and refines one with real material and research from real company screens via Seenry MCP."
license: MIT
metadata:
  author: Seenry
  version: "3.0.0"
---

# Seenry

Work like a design studio. Studios get consistent, high-end results from two things: a strict frame that every decision must fit, and the discipline to explore, critique and refine instead of shipping the first idea. The model is free to compose, but only inside the frame of pixel grid, column grid, padding, safe space, type set, radius family and palette. Taste comes from real references and real material, never from adjectives.

Work in the project's existing stack. If the project has tokens, components or a `DESIGN.md`, read them first and extend them; never introduce a parallel system.

## The studio process

1. **Brief.** Name the audience, the one job of the surface, the real content, and one sentence of point of view ("a calm, tool-like player that disappears behind the music"). Note what is fixed (brand, stack, copy).
2. **Research.** With Seenry MCP, study 3–6 real screens from companies that solve the same job well and write down measurements, not vibes ([research](references/research.md)). Without MCP, use [benchmarks](references/benchmarks.md) from 24 leading sites.
3. **Frame.** Write the system into `DESIGN.md`: tokens from [the system](references/system.md), the page shell from [pages](references/pages.md), and one spec card per component from [components](references/components.md). This is the frame every variant must fit.
4. **Material.** Get real images, icons and fonts before composing: supplied assets, license-clear sources, or generated images when an image model is available. Use `seenry-assets`. No placeholder gradients, no emoji icons.
5. **Explore.** For every hero, signature component or first screen, build 3 compositions that differ on 2–3 real axes (arrangement, media scale, anchor, density, detail layer) inside the same frame. Render them side by side at 1440 and 390 and critique in writing. Follow [structured exploration](references/exploration.md).
6. **Refine.** Put the chosen variant on keylines and align ink, not boxes ([alignment](references/alignment.md)), then do the [craft pass](references/craft.md): optical corrections, every state, longest content, dark mode.
7. **Verify on pixels.** Screenshot both widths, toggle the [grid overlay](assets/layout-guides/README.md), run the [system audit](scripts/system_audit.mjs) and the [anti-slop check](references/anti-slop.md). Fix everything before expanding to the next section. Use `seenry-review` for an independent verdict.

For a small fix in an established system, skip exploration: inspect, repair on-system, verify.

## The frame (defaults)

Use these unless the project already defines its own. Details and a starter `tokens.css` are in [the system](references/system.md).

**Pixel grid.** 4px base; layout values are multiples of 8. Spacing scale `4 8 12 16 24 32 48 64 96 128`. Nothing off-scale.

**Grouping.** The gap between groups is at least 2x the gap inside a group. Proximity groups; lines and boxes are a last resort.

**Radius.** One family, at most 4 values plus pill. Nested corners are concentric: `inner = outer − inset`. Card r28 with inset 12 holds media at r16. Never the same radius on a parent and its inset child.

**Type.** One sans family for everything; add a mono only for code, data and small technical labels. Pick by product type: Inter or Geist for tools and SaaS, SF Pro (`system-ui`) for Apple-feel, Open Runde or Nunito for friendly consumer apps. Display serifs are an AI tell on product surfaces; use one only for editorial or luxury brands. **Per component: ≤3 sizes, ≤3 weights. Per page: ≤6 sizes.** Display at 500–600 with −0.02 to −0.04em tracking and 1.0–1.15 line height. Body 16px; product UI 13–15px. See [typography](references/typography.md).

**Color.** Neutrals do 90% of the work: background, 2 surfaces, 3 text levels, 2 borders. One accent, ideally sampled from the brand or the hero material, used only for the primary action, selection, progress and focus. See [color](references/color.md).

**Elevation.** Rings and hairlines by default. Shadows only for things that float (menus, popovers, dialogs), layered and low-alpha.

**Actions.** One filled primary per region. Two CTAs maximum in a hero.

## Build components in layers

Every component is constructed in four layers on the frame, and specced before styling:

1. **Grid**: base unit, outer radius, inset.
2. **Safe space and areas**: padding box, named content areas (media, text stack, controls, meta) and on-grid gaps.
3. **Structure**: hierarchy placed into the areas on named keylines. **Align ink, not boxes**: a title's cap height (not its line box) meets the media's top edge, an icon's drawn glyph (not its button) sits on the text keyline, padding is measured to the letters. Edges are exact or at least 8px apart; 2–6px offsets are bugs. See [alignment](references/alignment.md).
4. **Type and states**: real sizes and weights (≤3 each), then every state.

```
Component: Player card
Grid:   4px · radius 28 · optical inset 16 all sides · cover 96 (24%) r12 (28 − 16)
Areas:  [cover 96] [text stack + transport, flex] / [scrubber + times, full width]
Keylines: V1 cover left · V2 cover right + 16 · V3 right inset
Anchors: title cap top = cover top · play bottom = cover bottom · scrubber and times on V1–V3
Type:   15/600 title · 13/400 artist · 11/500 mono times   (3 sizes, 3 weights)
Color:  white card on warm neutral, ring border, accent sampled from the cover on progress only
States: playing/paused, scrubbing (thumb + time tooltip), buffering, no artwork, long title
```

The finished example lives in [assets/examples/player-card.html](assets/examples/player-card.html). Anatomies for buttons, inputs, cards, rows, menus, dialogs, tables, pricing tiers and more are in [components](references/components.md).

## Keep pages consistent

All pages share one **page shell**: content width, gutter, 12-column grid, header height and a section rhythm, defined once as tokens. Every section uses one of a small set of archetypes with one heading pattern. Templates for landing, pricing, app shell, settings, auth, docs, detail and error pages are in [pages](references/pages.md).

## What studio work has that templates don't

Observed across Linear, Stripe, Vercel, Notion, Raycast, Resend, Apple and others (see [benchmarks](references/benchmarks.md)):

- **Real material.** Real product UI with specific data, real photography, a real cover. Never a gradient standing in for an image.
- **One dominant element** per view and clear subordinates, never everything at the same size.
- **Anchored structure.** Edges line up across the whole component and page.
- **A detail layer.** One level of fine detail rewards a closer look: metadata lines, mono labels, live counts, precise times.
- **Restraint.** One sans family, 2–3 weights, one accent, hairlines instead of boxes.
- **Density where work happens.** 13–15px product UI and compact rows; marketing breathes.

The full list of AI tells and their fixes is in [anti-slop](references/anti-slop.md).

## Guides

| Need | Read |
| --- | --- |
| Tokens, grid, spacing, radius, elevation, starter CSS | [system](references/system.md) |
| Exploring compositions inside a fixed frame, studio critique | [exploration](references/exploration.md) |
| Constructing and speccing components, anatomies | [components](references/components.md) |
| Page shells, section archetypes, page templates | [pages](references/pages.md) |
| Font choice by product type, scale, tracking, numerals | [typography](references/typography.md) |
| Palette roles, dark mode, contrast | [color](references/color.md) |
| Keylines, ink-level alignment, optical inset, proportion | [alignment](references/alignment.md) |
| Optical corrections, icons, hit areas, states | [craft](references/craft.md) |
| Headlines, labels, errors, empty states | [writing](references/writing.md) |
| Keyboard, semantics, zoom, reduced motion | [accessibility](references/accessibility.md) |
| Choosing material; sourcing and generating it | [imagery](references/imagery.md) and `seenry-assets` |
| Seenry MCP recipes and offline research | [research](references/research.md) |
| Measured evidence from leading product sites | [benchmarks](references/benchmarks.md) |
| AI tells and their fixes | [anti-slop](references/anti-slop.md) |
| Faithfully reproducing a supplied design | [replication](references/replication.md) |

Use `seenry-assets` for images, icons and fonts, `seenry-motion` for transitions and interaction, `seenry-apps` for native mobile, `seenry-branding` for identity systems, `seenry-review` for audits, diffs and stress tests.

## Tools

- [System audit](scripts/system_audit.mjs): counts rendered font sizes, weights, families, radii, shadows and colors; lists off-grid padding, gaps and margins; flags non-concentric corners, wrapped control labels and components over 3 sizes or weights; per component, measures ink-level alignment (cap tops, baselines, drawn glyphs, media edges): near-miss edges, media anchors and optical insets. Run it on every screenshot pass.
- [Exploration sheet](assets/explore.html): renders variant files side by side at real widths for critique.
- [Grid overlay](assets/layout-guides/README.md): development-only columns, gutter and 8px checks.
- [Starter tokens](assets/tokens.css) and [DESIGN.md template](assets/DESIGN.template.md).
- [Text collisions](scripts/text_collisions.mjs), [control geometry](scripts/control_geometry.cjs), [visual inventory](scripts/visual_inventory.mjs), [token contrast](scripts/token_contrast.py), [contrast check](scripts/contrast_check.py).

## Report

State what was built, the references studied (with links), the frame, the variants explored and why one won, the material used and its licenses, the widths and states rendered, what the audit and anti-slop pass caught and fixed, and anything not verified. Do not claim quality you did not see in a screenshot.
