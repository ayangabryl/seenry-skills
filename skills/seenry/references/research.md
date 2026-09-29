# Research real screens

The fastest way out of generic output is to look at how the best teams solved the same problem, and to copy their **measurements and relationships**, never their brand. Seenry MCP gives you captured pages from thousands of sites (Linear, Stripe, Vercel, Notion, Apple, Airbnb, GitHub, Figma, Raycast and many more), section crops, measured CSS evidence, recordings, iOS app screens and flows, branding systems and decks.

## Budget

Study 3–6 references per decision, not 30. Spend the time looking at pixels and extracting numbers. `get_credits` is free; check it at the start.

## Recipes

Use the exact tool names and arguments from the connected server; call `get_library_guide` once if unsure.

**A named company as a quality target**
1. `list_sites` `{q: "linear"}` → page ids (Home, Pricing, …).
2. `get_page` `{id}` → section names, themes, viewports.
3. `get_screenshot` `{id, section: "Hero"}` (or `segment: n` for tall pages; `viewport: "mobile"` for phone).
4. `get_design` `{id}` → measured typefaces and weights, per-element size/line-height/tracking, radii frequency, shadows, spacing tokens. Page through with `offset`.
5. `get_tokens` `{id, q: "radius"}` (or `"space"`, `"font"`, `"shadow"`) → declared CSS variables.

**A page type across companies**
`search_references` `{page_type: "Pricing"}` or `{page_type: "404"}`, optionally `site`. Then inspect 3 screenshots side by side.

**A section or component across companies**
`search_sections` `{element: "Pricing"}` (also Hero, Features, Testimonials, FAQ, Footer, Call to action, Navigation). Add `theme: "dark"` or `viewport: "mobile"` as needed. Results are lexical and alphabetical, not ranked by quality: skim for recognizable, well-crafted sources and check pixels.

**Human-rated picks**
`search_curated_references` `{min_rating: 4, family: "sections", q: "pricing"}` returns items with editorial ratings and notes.

**Mobile patterns**
`search_app_screens` `{q: "paywall"}` (also "settings", "onboarding", "now playing", "checkout", "empty state"). `get_app_flow` `{id}` for an ordered journey. App screens carry a small watermark; ignore it.

**Motion**
`search_references` `{motion: true, site: "..."}` then `get_page_motion`; creator clips via `search_designs` `{family: "motion"}` and `get_design_video`. A screenshot never proves timing.

**Identity, decks, imported components**
`search_designs` with `family: "branding" | "decks" | "sections"`, then `get_design_reference` and `get_reference_asset`.

**Guidance**
`get_design_research` `{topic: "layout" | "color" | "direction" | "motion" | "marketing" | "platform"}` returns sourced guidance and counterexamples.

## What to extract

For each reference, write a reference card in `DESIGN.md`:

```
Ref: linear.app Home (desktop + 390), captured 2026-09-22
Seen:    left-aligned 2-line headline, one-line lead, product UI as hero at ~1000px wide
Measured: h1 64/64 w510 −0.022em (phone 38/42); body 15–16/24; radii 4/6/8/12/9999; page padding-inline 24, block 64
Adopt:   light display weight + tight tracking; real issue view as hero proof; pill secondary buttons
Avoid:   their dark-only palette (our brand is light); Berkeley Mono licensing
```

Extract relationships you can transfer: type scale ratios, weight choices, how many sizes a card uses, gap ratios, radius family, how much of the first viewport is product, how CTAs are paired, how tiers are divided. Do not transfer logos, images, illustrations, copy, or a brand's signature color.

## Without MCP

- Use [benchmarks](benchmarks.md): measured values from 24 leading sites are already there.
- Ask the user for 2–3 sites they admire and inspect them in a browser: DevTools computed styles give the same measurements.
- Official systems are public references: Apple HIG, Material 3, GitHub Primer, Atlassian, Shopify Polaris, IBM Carbon, Radix Themes, Vercel Geist.

## Evidence discipline

- A screenshot shows one state at one width. Hover, focus, motion and responsive behavior need a recording or a live check.
- Captured CSS is observed evidence, not the company's specification.
- Search results are lexical and not quality-ranked; judge the pixels yourself.
- Media URLs expire; re-request instead of storing them. The CDN serves them to ordinary browser requests, so a script fetching a poster or video needs a browser `User-Agent`. Never embed reference media in the build.
