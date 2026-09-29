# Generating images

Generate only when the host actually has an image model: an image-generation MCP tool, a built-in image tool, or an API key the [assets tool](../scripts/assets.py) can use (`OPENAI_API_KEY`, `GEMINI_API_KEY`). Never claim a capability you do not have; fall back to sourced images or a type-led design.

## Write an art-directed prompt

Generic prompts produce generic images. Specify every one of these:

```
Subject:     what, doing what, from which distance
Composition: aspect ratio, where the subject sits, negative space for text (e.g. "left third empty")
Light:       direction, softness, time of day, color temperature
Material:    surfaces, texture, grain, finish
Palette:     2–3 named colors taken from the design tokens
Style:       photographic (lens, film stock) or rendered (studio 3D, matte clay, glass) or illustrated (line weight, fill)
Exclusions:  no text, no logos, no watermark, no extra hands, no borders
```

## Premium product and brand photography

The bar is Apple, Aesop and ARKET. Plan a matched set with one light and one surface, then check every image with the seenry `photo_check.mjs` before it goes into a layout (regenerate anything under 8 with the prompt it writes).

**Product hero (commerce)**
`Studio photograph of one <product, material, size> standing upright, true geometry, crisp edges and believable seams, blank label (no text), on a <limestone / linen / pale oak> surface against a seamless <warm-grey / off-white> backdrop, one large diffused light from upper camera-left with gentle fill and a soft grounding shadow, 85mm at product height, 4:5 vertical, product centered and filling about 78% of the frame height, warm-neutral grade with accurate <brand color>, no props, no scattered <ingredients>, no steam, no vignette, no HDR glow.`

**Detail close-up (same set)**
`Macro photograph of <texture: the foil gusset, whole beans in a ceramic dish, the linen weave>, same surface and light as the hero, 100mm macro, shallow depth of field, 1:1, calm negative space, no text.`

**In-use or context shot (same palette)**
`Editorial photograph of <the product in use: a pour-over on a kitchen counter, the shirt worn walking>, soft morning window light from the left, 50mm, 3:2, subject in the right third, muted palette matching <tokens>, no faces toward camera, no text, no logos.`

## Recipes

**Hero photograph (landing page)**
`Editorial photograph of <subject> in <setting>, 3:2, subject in the right third with calm negative space on the left for a headline, soft window light from the left, late afternoon, warm neutral palette with <accent> accents, shallow depth of field, 50mm, subtle film grain, no text, no logos.`

**Abstract brand visual (one per site)**
`A single sculptural object made of <material> on a seamless <color> background, studio lighting with one soft key light and a rim light, 16:9, object centered slightly low, crisp reflections, minimal, no text.`

**3D-style app icon set (PNG, transparent)**
Generate every icon in one session with an identical style suffix so the set matches:
`<object>, isometric 3/4 view, soft matte clay material, rounded edges, pastel <palette>, single soft top-left light, subtle contact shadow, centered with 15% padding, transparent background, 1024x1024, no text.`
Use `--background transparent` with OpenAI. Check that stroke weight, perspective and lighting match across the set; regenerate outliers.

**Album cover, poster or card art**
`Square cover art for "<title>" by <artist>: <mood> portrait/landscape, <palette>, grainy analog photograph, strong central subject readable at 48px, no text.` Add the title as live text in the UI, never baked into the image.

**Texture or background**
`Seamless tileable texture of <material>, even lighting, low contrast, <color>, 2048x2048, no objects.`

## Consistency across a set

- Keep one style suffix (lighting, material, palette, lens) and change only the subject.
- Generate 3–4 options per asset, pick with the contact sheet (`assets.py sheet`), and regenerate the ones that break the set.
- Keep the prompt, model and date in the manifest.

## Post-process

- Crop to the exact aspect and focal point used in the layout; test at the smallest display size.
- Remove backgrounds with the host tool if available, or generate with a transparent background.
- Export 1x and 2x WebP (photos) or PNG (transparency), under ~300 KB for heroes.
- Inspect at 100% for artifacts: fingers, text-like squiggles, warped edges, repeated patterns.

## Rules

- No real people's likenesses, real brands, logos or trademarks, and no images presented as real customers, events or products.
- Label AI-generated imagery where the context implies documentary truth (news, testimonials, case studies).
- Check the provider's terms for commercial use and record them in the manifest.
