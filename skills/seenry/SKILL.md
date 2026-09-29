---
name: seenry
description: "Design and build web interfaces at design-studio quality, not AI-template quality. Use for any new page, landing page, dashboard, app shell, pricing, settings, form or single component, for redesigns and visual polish, and for matching a reference. Sets the bar with real big-company screens from Seenry MCP, builds clean and premium on a proven product and motion floor, and does not finish until a strict slop check passes and a blind critic scores the page at big-company level."
license: MIT
metadata:
  author: Seenry
  version: "4.0.0"
---

# Seenry

The standard is simple: **clean, premium, no AI slop, at the level of the best big-company product design** (Stripe, Linear, Apple, Attio, Figma, ARKET). Everything below serves that. Read this whole file before building; the rules that decide quality are here, not in the guides.

Work in the project's existing stack. If the project has tokens, components or a `DESIGN.md`, read them first and extend them.

## The flow

1. **Brief (2 minutes).** Audience, the one job of the surface, the real content, what is fixed. One sentence of intent ("a calm ledger that makes what is owed obvious").
2. **Set the bar with real screens.** With Seenry MCP (see [research](references/research.md)), find 3 big-company pages that do this job at the highest level, in this category when the library has them (billing → Stripe, Mercury; CRM → Attio; commerce → Apple, ARKET, Aesop; product marketing → Linear, Figma, Arc). Download each desktop first screen to `.seenry/refs/` (`curl -A "Mozilla/5.0" -o .seenry/refs/<name>.png "<url>"`) and look at them. Write five lines on why they look premium: palette, type and weights, radius and elevation, density, what they leave out. Without MCP, do the same from the live sites.
3. **Decide the direction in five lines.** Neutral temperature and one action color; one type family (plus a display face only for a brand surface, with a reason); radius family; the imagery (real photograph or the real product UI, never clip-art); the one detail this brand owns. Pick the obvious premium answer before a clever one.
4. **Build on the floor.** App screens start from [the product kit](assets/kits/product.css); every page includes [the motion floor](assets/kits/motion.css). Set font, neutrals and accent from step 3. Real content and real imagery via `seenry-assets`.
5. **Check until it passes.** Run `node scripts/check.mjs <file or url> --brief <brief file>` (add `--refs` if your references are not in `.seenry/refs/`). It fails on any slop blocker, then asks a blind critic, a fresh model that sees only the screenshots, the brief and the reference screens, to score the page against them. Apply every fix it prints, then run it again. Repeat until it prints `PASS` (critic 9+ with zero blockers) or six rounds have run; then ship the best round. Never finish on your own opinion of the page: in testing, self-review rated 9 what blind review rated 6–7.
6. **Deliver.** Write `DESIGN.md` with a "Brand guidelines" section and give the report below. The design sheet is optional and comes last: `python3 scripts/sheet.py .seenry/sheet.json` ([sheet](references/sheet.md)).

For a small fix in an established system: repair on-system, then run `check.mjs` once.

## The standard

Leading teams look premium for one root reason: they ranked the job, then removed everything that does not serve it. Calm is the visible result. The reasons behind each rule are in [premium](references/premium.md).

**Never ship these (check.mjs blocks most of them):**
- Uppercase letter-spaced labels anywhere, especially eyebrows above titles. Use sentence case; the title says it.
- Numbered labels: "01 /", "(001)", "No. 03", "Step 01". Numbers only where order is real, as plain figures.
- Weights of 700 or more in UI, or more than three weights on a page.
- Italic serif accent words in headlines; trendy default faces used for flavor (Instrument Serif, Fraunces, Playfair, Space Grotesk, Clash Display).
- The default AI palettes: cream + terracotta or orange, plum + peach, navy + lime, forest green + cream as a costume, purple gradients.
- Clip-art imagery: sunset circles, vinyl records, flat SVG product stand-ins, tilted floating cards with sticker badges, gradient blobs, glows.
- Colored KPI hero cards with rings or stripes, an icon in every card, a card per row, saturated pill badges down a column.
- Generic slogans ("X is better together", "Built for the way you Y"), fake stats, lorem.
- Text people must read under 13px, or in a light grey that fails contrast.

**Color.** Neutrals do the work, defined as roles: canvas, surface, selected, rule, three text levels. Pick the temperature once (cool for tools, warm for craft and hospitality) and keep every grey in it. One action color, used only for the primary action, selection and focus, so it is always findable. Status is a 6px dot plus words on a pale tint; strong color only for the exception that needs action. A brand surface may have one bold field (a dark band, a photograph); never a second accent.

**Type.** One workhorse sans for the product (Inter with `cv11 ss01`, Geist, SF via `system-ui`, or the brand's face), tuned: display tracking −0.02 to −0.03em, `text-wrap: balance`, real punctuation. Weights by role: 400 values and body, 500 labels, controls and row anchors, 600 titles and the key figure. App screens: 24/30 page title, 14/20 cells, 13/20 meta, 12/16 table headers in Title Case. Brand surfaces: display 56–80 at 500–600, lead 18–20, body 16–18, supporting copy at least 15. Money: sans, right-aligned, tabular in columns, consistent cents, real minus sign.

**Radius and elevation.** Radius says what a shape is: grids and tables square or 8–12 on the container, controls 6–8, floating layers 12, pills only for status and small toggles. Nested corners concentric. Resting content uses 1px hairlines; only menus, popovers, dialogs and sheets get a shadow.

**Scale on desktop.** Premium pages use the whole 1440 canvas with confidence; a phone layout enlarged onto a wide screen reads as a template. At 1440: content spans 1200–1280; the hero image or product media takes 55–60% of the width and most of the first screen's height; the page or product title is 40–56 on product and commerce pages (56–80 on marketing heroes); controls are 44–48 high with 15–16px labels; the primary action is visible in the first screen on desktop and within the first screen and a half on phone. Selected states are decisive: a 2px dark border or a solid fill, never a pale tint plus a hairline.

**Layout and density.** One dominant element per view. Content max 1200–1280, gutters 32 desktop and 16–20 phone, 8px spacing scale, gaps between groups at least twice the gaps inside. App screens: summary as 0–3 figures in one divided strip, then the work (table or list) within the first screen; rows 44–56. Brand surfaces: generous and consistent section rhythm (96–128 desktop), each section one idea with real material, left-aligned text.

**Imagery.** Real product UI with specific data, or photography that belongs to the subject (generate with the host's image model when available: describe the subject, light, lens and surface). One strong image beats five decorations. Never a gradient or SVG standing in for a photograph.

**Copy.** Plain, specific, short. Headlines say what it is or does for this audience; labels name the thing; empty states say what happened and the one next action.

**Motion.** Functional and quiet: 120–160ms color on hover, 0.98 press, 200ms enter for layers, a visible change on filter and tab switches, none on data people read, all respecting reduced motion ([motion floor](assets/kits/motion.css); `seenry-motion` for more).

**Phone.** Recompose, do not squeeze: bottom tab bar or menu (never a clipped scrolling tab row), compact two-line rows, 16px inputs, 44px targets, sticky bars that never cover content.

## Grid and alignment

4px base, 8px layout values, spacing `4 8 12 16 24 32 48 64 96 128`. Align ink, not boxes: a title's cap height meets the media's top edge, icons sit on the text keyline; edges are exact or at least 8px apart ([alignment](references/alignment.md), [optical](references/optical.md)). Components have at most 3 sizes and 3 weights ([components](references/components.md)); pages share one shell ([pages](references/pages.md)).

## Guides

| Need | Read |
| --- | --- |
| Why leading teams choose their colors, radii, weights and density; premium, clean, elegant rules | [premium](references/premium.md) |
| Concept, directions, type voice, palette origin, signature component, generated-page defaults | [art direction](references/art-direction.md) |
| Tokens, grid, spacing, radius, elevation, starter CSS | [system](references/system.md) |
| Exploring compositions inside a fixed frame, studio critique | [exploration](references/exploration.md) |
| Constructing and speccing components, anatomies | [components](references/components.md) |
| Page shells, section archetypes, page templates | [pages](references/pages.md) |
| Font choice by product type, scale, tracking, numerals | [typography](references/typography.md) |
| Palette roles, dark mode, contrast | [color](references/color.md) |
| Keylines, ink-level alignment, optical inset, proportion | [alignment](references/alignment.md) |
| Optical centering, size compensation, side bearing, icon nudges | [optical](references/optical.md) |
| Optical corrections, icons, hit areas, states | [craft](references/craft.md) |
| Headlines, labels, errors, empty states | [writing](references/writing.md) |
| Which library to use instead of hand-rolling a component | [libraries](references/libraries.md) |
| Phone browser quirks: viewport units, tap, zoom, safe areas | [mobile web](references/mobile-web.md) |
| Keyboard, semantics, zoom, reduced motion | [accessibility](references/accessibility.md) |
| Choosing material; sourcing and generating it | [imagery](references/imagery.md) and `seenry-assets` |
| Seenry MCP recipes and offline research | [research](references/research.md) |
| The design sheet: rationale, research, anatomy, guidelines | [sheet](references/sheet.md) |
| Measured evidence from leading product sites | [benchmarks](references/benchmarks.md) |
| AI tells and their fixes | [anti-slop](references/anti-slop.md) |
| Faithfully reproducing a supplied design | [replication](references/replication.md) |

Use `seenry-assets` for images, icons and fonts, `seenry-motion` for transitions and interaction, `seenry-apps` for native mobile, `seenry-branding` for identity systems, `seenry-review` for audits, diffs and stress tests.

## Tools

- [Check](scripts/check.mjs): the finishing gate. Runs the review board, blocks on slop, then the blind critic against the reference screens; prints PASS or the fixes to apply.
- [Blind critic](scripts/critic.mjs): a fresh Codex or Claude process scores the page against the references with the premium standard and returns ranked fixes.
- [Review board](scripts/review_board.mjs): the page at review scale beside the references, plus craft blockers the grid audit cannot see (legibility at scale, eyebrows, numbering, weights, font loading, figure spacing, phone clipping, fixed overlays, motion coverage). Run it every review round.
- [Product kit](assets/kits/product.css) and [motion floor](assets/kits/motion.css): the starting quality floor for app screens and interaction.
- [Page audit](scripts/audit_page.mjs): one command for any project (URL or HTML file) at several widths; runs the system and optical audits and prints fixable findings. Needs Playwright.
- [Optical audit](scripts/optical_audit.mjs): rasterizes icons to measure ink; reports off-center icon buttons (including asymmetric shapes), icons missing their label's cap-height center, labels not centered in controls, unbalanced icon-side padding and headline side bearing, each with a CSS nudge.
- [System audit](scripts/system_audit.mjs): counts rendered font sizes, weights, families, radii, shadows and colors; lists off-grid padding, gaps and margins; flags non-concentric corners, wrapped control labels and components over 3 sizes or weights; per component, measures ink-level alignment (cap tops, baselines, drawn glyphs, media edges): near-miss edges, media anchors and optical insets. Run it on every screenshot pass.
- [Design sheet](scripts/sheet.py) and [anatomy capture](scripts/anatomy.mjs): the end-of-task deliverable, styled like seenry.design.
- [Exploration sheet](assets/explore.html): renders variant files side by side at real widths for critique.
- [Grid overlay](assets/layout-guides/README.md): development-only columns, gutter and 8px checks.
- [Palette](scripts/palette.py): OKLCH ramps from one brand color, two-tier tokens for light and dark, and WCAG + APCA measurement of every pair; `--check FG BG` for one pair.
- [Starter tokens](assets/tokens.css) and [DESIGN.md template](assets/DESIGN.template.md).
- [Text collisions](scripts/text_collisions.mjs), [control geometry](scripts/control_geometry.cjs), [visual inventory](scripts/visual_inventory.mjs), [token contrast](scripts/token_contrast.py), [contrast check](scripts/contrast_check.py).

## Report

Lead with a **brand guidelines summary** the user can read without opening anything, then the paths:

```
Bar:       <the 3 reference screens and the five lines on why they look premium>
Direction: <intent in one sentence>
Type:      <family and weights by role; why>
Palette:   <name hex role> · … ; temperature and why
Radius:    <family by role>; elevation rule
Imagery:   <what the images are and how they were made>
Owned detail: <the one detail this brand owns>
Rules:     3–5 testable do/don't lines for future work
Critic:    <round-by-round blind scores from check.mjs, e.g. 6 → 7 → 8 → 9> and what moved it
Verified:  <widths, interactions, contrast>; not verified: <…>
```

Write the same guidelines into `DESIGN.md` under "Brand guidelines". State the critic's final score, never a self-score.
