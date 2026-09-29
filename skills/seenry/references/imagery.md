# Imagery, icons and fonts

Material decides whether a page feels real. Generated gradients and stock illustrations are the fastest route to "AI template".

## Choose the material first

Before styling, decide what the main visual is:

1. **The product itself** (best for software): a real, cropped UI with plausible data. Build it as HTML/CSS in the page, not as a blurry screenshot, so it stays sharp and responsive.
2. **The subject** (for physical products, places, food, people): real photography supplied by the user, or licensed stock chosen for a specific composition, color temperature and crop.
3. **Type-led** (for tools, docs, editorial): no hero image; the headline, a precise grid and one detail carry the identity.
4. **A crafted brand visual** (Raycast's diagonal light, Resend's rendered cube, Vercel's triangle): one abstract object with material and light, used in one place. Only when there is a way to produce it at quality (supplied asset, 3D render, carefully built CSS/SVG/canvas).

If none of these can be produced at quality, choose type-led. A weak illustration is worse than none.

## Rules

- No stock "people pointing at laptops", no isometric 3D blobs, no generic abstract gradient meshes behind every section.
- Use one visual language across the page: same crop style, same corner radius, same frame, same lighting.
- Product UI mockups use the real design system, real copy and consistent data (names, dates, amounts that add up).
- Logos in proof strips: monochrome (text-2 or text-3), equal optical size, official SVGs only. Never recreate a logo by hand.
- Record source, license and author for every external asset in `DESIGN.md`. Unsplash/Pexels images need the photographer credited in the record even when attribution is optional.

## Icons

- One family: Lucide, Phosphor, Heroicons, Radix Icons, SF Symbols (Apple platforms) or the brand's own. One stroke weight.
- Brand marks from official press kits or Simple Icons (check the trademark terms).
- Don't use emoji as UI icons.

## Fonts

- Prefer the brand font. Otherwise use fonts with clear licenses: Google Fonts (OFL), Fontshare (ITF free license), or system stacks.
- Self-host with `@font-face` and `font-display: swap`; subset to the scripts needed; ship WOFF2.
- Record family, weights, source and license in `DESIGN.md`.

## Seenry MCP for material research

`search_designs` with `family: "branding"` for identity systems, `family: "sections"` for imported component and section designs, `family: "motion"` for creator motion references; `get_reference_asset` returns the image. Use them to decide the *kind* of material and its treatment, then produce original material for this brand. Never copy a reference's image, illustration or logo into the build.
