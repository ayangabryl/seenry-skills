# Imagery, icons and fonts

This guide decides *what* material a design needs. Sourcing, downloading, generating and recording it is done with `seenry-assets` and its assets tool.

Material decides whether a page feels real. Generated gradients and stock illustrations are the fastest route to "AI template".

## Choose the material first

Before styling, decide what the main visual is:

1. **The product itself on a stage** (best for software): a real, cropped UI with plausible data, built as HTML/CSS so it stays sharp, set on a ground with light and material: a generated render or photograph behind or around it, an atmospheric gradient field, or a full brand-color field. The UI alone on the page background is not a finished hero.
2. **The subject** (for physical products, places, food, people): real photography supplied by the user, or licensed stock chosen for a specific composition, color temperature and crop.
3. **Type-led** (for tools, docs, editorial): no hero image; the headline, a precise grid and one detail carry the identity.
4. **A crafted brand visual** (Raycast's diagonal light, Resend's rendered cube, Vercel's triangle): one abstract object with material and light, used in one place. Only when there is a way to produce it at quality (supplied asset, 3D render, carefully built CSS/SVG/canvas).

For software, combine 1 and 4: the stage art is the crafted visual and the product is what stands on it. `scripts/image.mjs` produces renders and atmospheres at quality on any host, so "no way to produce it" is rarely true; generate three variants and keep the photo check's best. If none of these can be produced at quality, choose type-led. A weak illustration is worse than none, so the drawn layer stays simple: one stroke weight, one ink color, diagrams and marks drawn from the device, never clip art.

## Rules

- No stock "people pointing at laptops", no isometric 3D blobs, no generic abstract gradient meshes behind every section.
- Use one visual language across the page: same crop style, same corner radius, same frame, same lighting.
- Compose every image into the layout with a technique from [image composition](image-composition.md): type on a calm field, a cut-out in front of the type, product UI over the image, an edge blended into the ground. A boxed photo floating in an empty band reads as stock however good the photo is.
- The first-screen image carries the page and holds 8 or more in `scripts/photo_check.mjs --page` in place; regenerate it with the prompt it writes, up to three times. Other images keep their floor.
- Generate the hero for its composition. When the subject should overlap type, cards or the next section, generate it on a transparent background at the slot's ratio and compose it into the layout, rather than boxing a scene behind the content.
- Product UI mockups use the real design system, real copy and consistent data (names, dates, amounts that add up).
- Logos in proof strips: monochrome (text-2 or text-3), equal optical size, official SVGs only. Never recreate a logo by hand.
- Record source, license and author for every external asset in `DESIGN.md`. Unsplash/Pexels images need the photographer credited in the record even when attribution is optional.

## Art-direct every generated image

`scripts/image.mjs` refuses a job that only names a subject and a setting. Each job declares, before anything is generated:

| Field | Decides |
| --- | --- |
| `palette` | Shadow, highlight and the one accent as hex, from the page tokens |
| `grade` | `monochrome`, `duotone`, `desaturated-one-accent`, or `full-color` with a reason |
| `concept` | The idea the image carries, not the literal scene |
| `light`, `light_reason` | One light, and why it belongs to this brand |
| `texture`, `texture_reason` | Grain, halftone, torn paper, collage or none, and why |
| `placement` | `slot` on the page, the empty `field` kept for type or UI, `mode`: `cutout`, `tile` or `bleed` |
| `prop` | The brand colour or mark inside the frame |

`image.mjs` builds the prompt from these (`--dry` prints it). `--raw` still generates a free-text prompt as written, and reports its stock tells. `photo_check.mjs --palette "<shadows>,<highlights>,<accent>"` scores `palette_fit`, and an image cannot score more than two points above it.

Before, a stock brief:

> female general counsel in a charcoal blazer, bright modern office, holding a contract, smiling

After, art-directed:

> A woman general counsel in her 40s reading one sheet of contract paper held close, mid-thought, not looking at camera. Concept: the moment a lawyer finds the one clause that matters. Grade: desaturated, shadows #2B1314, highlights #E6E0D5; the only saturated colour is #6B1F24, carried by a small wax seal on the paper. Light: one hard window light from the left, deep falloff. Texture: heavy 35mm grain. Subject on the right third, the left two-thirds an empty dark wall for the headline.

What strong landing-page designers do with generated images, learned from studying a working designer's posted pages:

- **Graded to the page.** A fintech page in green puts a green jacket on green grass; an oxblood page uses a black-and-white portrait. The image belongs to the palette before any type is set.
- **Concept over scene.** A classical hand reaching out of clouds for "AI", statues for "intelligence", motion blur for "energy". A literal office scene is the first picture anyone would generate.
- **Texture that admits it is made.** Grain, halftone, torn paper and collage cut-outs read as art direction; a clean render reads as generated.
- **Composed for the layout.** An empty field where the headline sits, crops made for the tile they fill, product UI cards laid over the photograph.
- **The brand inside the frame.** A device carrying the logo mark, a prop in the accent colour.

## Icons

- One family: Lucide, Phosphor, Heroicons, Radix Icons, SF Symbols (Apple platforms) or the brand's own. One stroke weight.
- Brand marks from official press kits or Simple Icons (check the trademark terms).
- Don't use emoji as UI icons.

## Fonts

- Prefer the brand font. Otherwise use fonts with clear licenses: Google Fonts (OFL), Fontshare (ITF free license), or system stacks.
- Self-host with `@font-face` and `font-display: swap`; subset to the scripts needed; ship WOFF2.
- Record family, weights, source and license in `DESIGN.md`.

## Seenry MCP for material research

`search_designs` with `family: "sections"` for imported component and section designs, `family: "motion"` for creator motion references; `get_reference_asset` returns the image. Use them to decide the *kind* of material and its treatment, then produce original material for this brand. Never copy a reference's image, illustration or logo into the build.
