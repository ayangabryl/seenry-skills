---
name: seenry
description: "Design and build web interfaces that look like they came from a top product team, not an AI template. Use for any new page, landing page, dashboard, app shell, pricing, settings, form or single component, for redesigns and visual polish, and for matching a reference. Enforces a layered grid and spacing system, per-component type limits, concentric radii, consistent page shells and research from real company screens via Seenry MCP."
license: MIT
metadata:
  author: Seenry
  version: "3.0.0"
---

# Seenry

Build interfaces the way strong product teams do: a small, strict system; components constructed in layers on that system; pages assembled from one shared shell; and every visual decision traceable to a real reference or a rule below. Constraints are what make an LLM consistent. Taste comes from studying real work, not from adjectives.

Work in the project's existing stack. If the project already has tokens, components or a `DESIGN.md`, read them first and extend them; never introduce a parallel system.

## The workflow

1. **Read.** Find the audience, the one job of the page or component, the real content, and existing tokens. Write down what is fixed (brand, stack, copy) and what is open.
2. **Study real screens.** With Seenry MCP connected, inspect 3–6 references from companies that solve the same job well, and extract *measurements*, not vibes. Follow [research](references/research.md). Without MCP, use [benchmarks](references/benchmarks.md), which already hold measured type, radius and spacing from 24 leading sites.
3. **Write the system, then the specs.** Before any styling, write or update `DESIGN.md` with the tokens from [the system](references/system.md), then one spec card per component you will build ([component construction](references/components.md)). This is the step that prevents slop.
4. **Build one slice for real.** Real copy, real data, all states. Desktop 1440 and phone 390 from the start.
5. **Verify on pixels.** Render, screenshot both widths, turn on the [grid overlay](assets/layout-guides/README.md), then run the [anti-slop check](references/anti-slop.md) and fix everything it catches before building the next slice. For an independent verdict, use `seenry-review`.

For a single component, steps 2–5 still apply but stay small: one or two references, one spec card, all states rendered.

## The system (non-negotiable defaults)

Use these unless the project already defines its own. Full detail and a starter `tokens.css` are in [the system](references/system.md).

**Grid.** 4px base unit; every size, gap and padding is a multiple of 4, and layout-level values are multiples of 8. Spacing scale: `4 8 12 16 24 32 48 64 96 128`. Nothing off-scale (no 10, 15, 18, 22, 30).

**Grouping.** The gap between groups must be at least 2x the gap inside a group (8 inside, 16+ between; 16 inside, 32+ between). Proximity does the grouping; lines and boxes are a last resort.

**Radius.** Pick one scale, max 4 values plus pill, e.g. `6 10 16 24` + `9999`. Nested corners are concentric: `outer radius = inner radius + inset`. A 24px card with 8px inset holds a 16px image; a 24px card with 24px inset holds content that is square or 0–4px. Never put the same radius on a parent and its inset child.

**Type.** One sans family for UI, plus at most one accent (serif for editorial voice, or mono for data/code). **Per component: at most 3 sizes and at most 3 weights.** Per page: at most 6 sizes. Display weights are usually 400–600, not 700–800; tighten display tracking (-0.02em to -0.05em) and line height (1.0–1.15). Body 16px, dense UI 13–14px. See [typography](references/typography.md).

**Color.** Neutrals do 90% of the work: background, 2 surface levels, 3 text levels, 2 border levels. One accent, used for the primary action, selection and focus only. Status colors only for status. Every text pair passes WCAG AA. See [color](references/color.md).

**Elevation.** Prefer a 1px hairline border or a low-alpha ring (`0 0 0 1px rgb(0 0 0 / .06)`) over drop shadows. When something truly floats (menus, dialogs, popovers), use a layered soft shadow. Never a large shadow on a static card.

**Action hierarchy.** One primary (filled) action per view region. Secondary is outlined or tinted; tertiary is text. Two CTAs maximum in a hero.

## Build components in layers

Every component is constructed on four stacked layers, in this order, and the spec card records each one before code:

1. **Grid.** The base unit, the component's outer radius and its inset (padding). Choose inset from the radius: `inset >= radius / 2`, and when inset equals radius the content sits in a clean safe area (the 24/24 rule).
2. **Safe space and content areas.** The padding box, then named content areas (media, text stack, controls, meta) and the gaps between them, all on-grid.
3. **Structure.** Place the hierarchy into those areas: title, body, caption, media placeholder, controls. Decide alignment edges (usually one shared left edge) and what grows vs. truncates.
4. **Type and states.** Assign the real sizes and weights (max 3 each), then design every state: default, hover, active, focus-visible, disabled, loading, empty, error, selected, and long-content overflow.

Spec card format (put it in `DESIGN.md` or a comment above the component):

```
Component: Player card
Grid: 8px base · radius 24 · inset 24
Areas: [art 96x96 r16] [text stack] [controls row] [progress + times]
Gaps: art→text 16 · title→artist 4 · text→controls 16 · controls→progress 24
Type: 17/600 title · 15/400 artist · 12/500 tabular times   (3 sizes, 2 weights)
Color: surface-1, text-1/text-2, accent on progress fill only
States: playing/paused icon swap, scrubbing, buffering, disabled next
```

Component anatomies with measured defaults (buttons, inputs, cards, list rows, tabs, menus, dialogs, tables, toasts, nav, pricing tiers, and more) are in [components](references/components.md).

## Keep pages consistent

All pages share one **page shell**: max content width (e.g. 1200px, or 1080 for text-led), page gutter (24px phone, 32–48px desktop), a single 12-column grid with a 24px gutter, and a section rhythm (96–128px between marketing sections on desktop, 64 on phone; 32–48 inside product views). Header, sections and footer inherit the same content edges. Define these once as tokens and never override them per section.

Every section follows one of a few archetypes (hero, proof strip, feature, deep-dive, comparison, testimonial, pricing, FAQ, CTA, footer) with one alignment and one heading pattern reused throughout. Page templates for landing, pricing, dashboard/app shell, settings, auth, docs/article, detail and empty/error states are in [pages](references/pages.md).

## What separates great from generic

Observed across Linear, Stripe, Vercel, Notion, Raycast, Resend and others (see [benchmarks](references/benchmarks.md)):

- **Show the product, with plausible specific content.** Real names, IDs, timestamps, prices. The Linear hero is a working issue view, not an illustration of one.
- **Restraint in type.** One family, 2–3 weights on the whole page. Stripe's hero is 48px at weight 300; Vercel's is 64px at 400 with -0.06em tracking.
- **Hairlines, not boxes.** Pricing tiers share one container divided by 1px lines instead of three floating shadow cards.
- **One accent, used sparingly.** Only the primary action and state carry color.
- **Density where work happens.** Product surfaces use 13–14px text and 28–36px rows; marketing breathes.
- **Every section answers a new question.** No filler "Why choose us" grid of three icon cards.

The full list of AI tells and their fixes is in [anti-slop](references/anti-slop.md). Read it before the first render and again before you report.

## Guides

| Need | Read |
| --- | --- |
| Tokens, grid, spacing, radius, elevation, starter CSS | [system](references/system.md) |
| Constructing and speccing components, per-component anatomy | [components](references/components.md) |
| Page shells, section archetypes, page templates | [pages](references/pages.md) |
| Font choice, scale, tracking, numerals, wrapping | [typography](references/typography.md) |
| Palette roles, dark mode, contrast | [color](references/color.md) |
| Optical alignment, icons, hit areas, focus, states | [craft](references/craft.md) |
| Headlines, labels, errors, empty states | [writing](references/writing.md) |
| Keyboard, semantics, zoom, reduced motion | [accessibility](references/accessibility.md) |
| Images, illustration, icons, fonts, provenance | [imagery](references/imagery.md) |
| Seenry MCP recipes and offline research | [research](references/research.md) |
| Measured evidence from leading product sites | [benchmarks](references/benchmarks.md) |
| AI tells and their fixes | [anti-slop](references/anti-slop.md) |
| Faithfully reproducing a supplied design | [replication](references/replication.md) |

Use `seenry-motion` for transitions and interaction, `seenry-apps` for native mobile, `seenry-branding` for identity systems, `seenry-review` for audits, diffs and stress tests.

## Tools

- [Grid overlay](assets/layout-guides/README.md): development-only columns, gutter and baseline overlay. Toggle it on every screenshot pass.
- [Starter tokens](assets/tokens.css) and [DESIGN.md template](assets/DESIGN.template.md).
- [System audit](scripts/system_audit.mjs): counts distinct font sizes, weights, families, radii, shadows and colors; lists off-grid padding, gaps and margins; flags non-concentric nested corners and components over 3 sizes or weights. Run it on every screenshot pass.
- [Text collisions](scripts/text_collisions.mjs), [control geometry](scripts/control_geometry.cjs), [visual inventory](scripts/visual_inventory.mjs): measure clipped text, hit areas and the count of distinct sizes, weights, radii and colors on a rendered page.
- [Token contrast](scripts/token_contrast.py) and [contrast check](scripts/contrast_check.py): WCAG pairs from source or explicit colors.

## Report

When done, state: what was built, the references studied (with links), the tokens used, the widths and states rendered, what the anti-slop pass caught and fixed, and anything not verified. Do not claim quality you did not see in a screenshot.
