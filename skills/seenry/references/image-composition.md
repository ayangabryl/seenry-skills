# Image composition

A good image used badly reads as stock. Premium pages do not place photographs in boxes; they build the page around them, so the image cannot be lifted out without breaking the design. This file is how: the techniques, when each fits, how to build it, how to keep type readable, and how each one fails.

Generate the image for the technique you chose ([imagery](imagery.md#art-direct-every-generated-image)): the `placement` field of the job names the technique and where the calm field sits.

## Art direction for the whole page

| Rule | What it means | Fails when |
| --- | --- | --- |
| One grade | Every image shares one look: the same shadow and highlight colours from the page palette, one saturated accent, one grain. Write it once as tokens and a CSS treatment every image passes through | A blue-sky photo beside a sepia portrait beside a neon render |
| One image owns the frame | Each section with an image gives it most of the area: full bleed, a tile at 50%+ of the section, or a cut-out taller than the headline | A 30% photo floating in a band of empty ground |
| Crop language | Decide how images meet the frame (always tight, always cut by the edge, always a full figure) and keep it | Some images cropped tight, others shown whole with wide margins |
| Depth | Three layers at most: ground (photo or field), subject (cut-out or the image itself), surface (type and UI). Each layer has one job | Type, cards, badges and stickers stacked on one photo |
| Ground continuity | The page ground takes its colour from the image (sampled dominant or shadow colour), so the image's edge disappears into the section | A dark photo on a white ground with a hard rectangle edge, when a blend was intended |
| One frame | One corner radius for every framed image, from the token scale; full-bleed images have none | 0, 8, 14 and 24px radii on one page |
| Restraint | One effect per image: a blend, a mask, or a grade. Never glow, blur, duotone and grain stacked | Effects that announce themselves before the subject does |
| Real scale | A product, a person or an object is shown at a size where its detail reads at 1440 and on a phone | A beautiful image used as a 200px thumbnail |

## Techniques

Each technique names its readability rule. The review board measures text over images across the whole page: large text (24px+, or 18.66px bold) needs 3:1 and other text 4.5:1 against the busiest tenth of the pixels behind it.

### 1. Type on a calm field

- **What:** a full-bleed or large photograph composed with an empty area (sky, wall, floor, shadow) and the headline set in it.
- **Fits:** a hero, a closing band, a statement section. Brands with a real place, landscape or atmosphere.
- **Build:** generate with the calm field in a named place ("upper 55% clean sky"); `object-fit: cover` with `object-position` set so the field stays under the type at every width; check phone separately, where the crop changes.
- **Readable:** the field itself carries the contrast. A soft gradient scrim from the field's own colour (`linear-gradient(to bottom, color-mix(in oklab, var(--ground) 70%, transparent), transparent 60%)`) is allowed; a flat black overlay at 40% is not.
- **Fails:** text set over the subject or a busy area; a scrim so heavy the photo turns to mud; a crop on phone that moves the subject under the headline.
- **Seen in:** Legora's home hero (`legora.com`, captured with `bar.mjs`): one dusk skyline, the headline and one action small in the calm lower band. Aurora (`f4a084216a47464c979d8da6337978d2`): headline anchored bottom-left on a calm part of the cab photo.

### 2. Depth sandwich: cut-out in front of the type

- **What:** the subject on a transparent background, layered so part of it sits in front of the headline or the section edge, while the ground and type sit behind.
- **Fits:** an object or figure with a clear silhouette (a hand holding a document, a device, a vehicle, a sculpture). Strong first screens.
- **Build:** generate on a transparent background; `position: absolute` with an explicit `z-index` above the heading block and below the navigation; `filter: drop-shadow()` in the ground's shadow colour, never grey; let it cross the section boundary (`bottom: -40px` into the next section) so it reads as composed, not pasted.
- **Readable:** never cover more than a fifth of a headline's letters, and never the first word. Keep the headline readable with the cut-out removed.
- **Fails:** a halo or hard edge around the cut-out; the subject sitting on top of the lede or the buttons; a cut-out floating in the middle of nothing.
- **Seen in:** @uisabor's Synais shot (a hand and device rising from the bottom of the hero into the next section, UI cards to the side). Marked on the page with `data-seenry-cutout` so the board knows it is composed.

### 3. Product UI over an image tile

- **What:** real product UI (a card, a panel, a sheet) laid over a photograph or a graded field, overlapping its edge.
- **Fits:** software. The photo gives the world the product controls; the UI proves the claim.
- **Build:** the image at 100% of its tile with `object-fit: cover`; the UI card positioned to overlap one edge of the tile by 10% to 30% of its own size; the image graded so its colour belongs to the UI's palette; one radius family for tile and card.
- **Readable:** the card has its own solid or near-solid surface (`backdrop-filter` only over a calm area).
- **Fails:** UI floating over the subject's face; three or more cards on one image; a mockup that is a drawn chart in an empty field ([screens](screens.md#product-views-and-charts-have-a-floor)).
- **Seen in:** Harvey's home hero (`harvey.ai`, captured): the product at real size on a textured painted field. @uisabor's Cointrix and Synais shots: the dashboard sits on the landscape photo, overlapping its lower edge.

### 4. Edge blend into the ground

- **What:** the image's edge fades into the section ground, so the image and the page read as one surface.
- **Fits:** dark pages with photographic heroes; transitions from an image section into a solid one.
- **Build:** `mask-image: linear-gradient(to bottom, #000 60%, transparent)` on the image, with the section ground set to the image's sampled shadow colour; or a gradient overlay from `transparent` to `var(--ground)`. Sample the colour from the image (dominant colour of the bottom 10%), never guess.
- **Readable:** type that crosses the blend uses the ground's text colour and is measured like type on a calm field.
- **Fails:** a visible band where the blend colour does not match the ground; blending every image on the page.
- **Seen in:** @uisabor's Cointrix shot (the misty landscape dissolves into the black page under the product). Einride (`f04c1ef6c0ee4bc4b34c2b0e7cd45ddb`): the dark cab crop runs into the page with almost no type.

### 5. Graded images and duotone

- **What:** every image re-graded to the page palette, sometimes to two colours (shadow and highlight) with the accent left in.
- **Fits:** loud identities, campaigns, collections of mixed photography that need to read as one shoot.
- **Build:** grade at generation (the job's palette and grade fields) and normalise in CSS: `filter: grayscale(1) contrast(1.05)` with a `mix-blend-mode: multiply` colour layer for duotone, or `saturate(.8)` across the set. Keep the accent object in colour by generating it, not by masking.
- **Readable:** a graded image often loses midtone contrast; re-measure type over it.
- **Fails:** duotone on a portrait that turns skin grey and lifeless; different grades on neighbouring images.
- **Seen in:** @uisabor's sales-agent shot (a black-and-white portrait on an oxblood page) and his fintech shot (wardrobe and grass graded to the brand green).

### 6. Inline image chips

- **What:** small rounded image crops set inside a large statement line, at text height.
- **Fits:** one statement section per page, when the images name what the sentence says.
- **Build:** `display: inline-block; height: .9em; aspect-ratio: 3/2; vertical-align: -.1em; border-radius` from the token scale; two or three chips at most, overlapping with a ring in the ground colour.
- **Readable:** the line still reads as a sentence with the chips removed.
- **Fails:** chips in every heading; chips of unrelated images; chips so small they read as emoji.
- **Seen in:** @uisabor's Synais and sales-agent shots. Record it as an `Allow:` exception when a level reference uses it.

### 7. Collage and torn edges

- **What:** cut-out photographs or engravings layered on paper with torn or cut edges, halftone and grain.
- **Fits:** editorial, culture, legal and finance brands that want warmth or history; one feature tile or a statement, not the whole page.
- **Build:** generate the collage as one image with its texture (the job's texture field), or layer a transparent cut-out over a paper PNG with `mix-blend-mode: multiply`; torn edges come from the image, not CSS.
- **Readable:** type sits on the paper area, never on the halftone.
- **Fails:** collage beside clean product photography with no bridge; torn edges on every image.
- **Seen in:** @uisabor's statue posts (classical figures on a cobalt sky with a torn white paper edge) and his CRM shot (a classical hand reaching out of clouds as the hero).

### 8. Editorial crop off the frame

- **What:** the image cut by the viewport or section edge on purpose, so the subject continues beyond the page.
- **Fits:** physical products, vehicles, architecture; the first screen or a full-bleed break between sections.
- **Build:** full-bleed with `object-position` chosen per breakpoint; the crop tight enough that the subject reads as large, and one side open for type.
- **Fails:** a crop that cuts the subject at a joint (a wrist, a wheel) or loses what identifies it on phone.
- **Seen in:** Einride (`f04c1ef6c0ee4bc4b34c2b0e7cd45ddb`): the cab's corner fills the frame with the claim a screen later.

## Never

- A boxed photograph, under half its section, alone in a band of empty ground. The review board flags it (`floatingImage` when under a fifth of the section, a premium note up to 45%).
- Type on the busiest part of an image, or a flat dark overlay used to rescue it.
- A cut-out with a white halo, a hard clipping edge or a grey drop shadow.
- Several grades, crops or corner radii on one page.
- Stacked effects: glow, blur, duotone and grain on one image.

## How it is checked

- `review_board.mjs` measures text over images on every screen of the page, flags floating boxed images and mixed image radii.
- `photo_check.mjs --page` scores `integration` in place (overall is never more than two points above it) beside `palette_fit`.
- The critic caps imagery at 6 for a floating photo, mixed grades or radii, or type fighting a busy area.
- A level reference ([level reference](level-reference.md)) records which of these techniques the person's examples use; the build uses at least as many, of the same kinds.
