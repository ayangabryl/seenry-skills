# Art direction

A clean frame on its own produces a tidy page that looks like every other generated page. Studios win on **art direction**: an idea taken from the subject's own world, carried through type, color, material and one signature component. Do this before the frame, because the frame is built to serve the direction.

**Clean first.** The concept shows through color, type, material and one signature component, never through added ornament. Premium pages are quiet: few elements, generous and consistent space, soft hairlines, three weights, no decorative labels, stamps, numbering or texture layered on top. If a detail does not help someone read or act, remove it. A direction that needs clutter to be recognizable is the wrong direction.

## 1. Mine the subject's world

List 6–10 real artifacts, places and rituals from the product's category and audience. Choose things you can see and touch, not adjectives.

| Product | The subject's world (examples) |
| --- | --- |
| Group music listening | Tokyo listening bars (jazz kissa), hi-fi receivers and VU meters, radio station idents, gig posters, cassette J-cards, liner notes, setlists, club wristbands |
| Specialty coffee roaster | cupping forms, roast logs, green-coffee jute sacks and stencils, rubber-stamped bags, the roastery's street and tiles, farm lot cards, brew ratio cards |
| Invoicing for freelancers | carbon-copy invoice books, ledger paper, paid/overdue rubber stamps, bank remittance slips, envelope windows, a studio's letterhead |
| Developer tool | terminal output, man pages, schematics, lab notebooks, test reports |
| Health or care | appointment cards, pharmacy labels, clinic wayfinding |

Every generated page draws on the same generic SaaS world. The subject's world is the one thing a competitor's model does not start from.

## 2. Pitch three directions, then choose one

Write three one-paragraph directions that differ in **concept**, not layout. Each one names:

- **Concept**: one artifact from the list, used as the organizing metaphor ("the page is a listening-bar receiver: warm walnut, amber VU meters showing everyone in sync").
- **Type voice**: a display face and a text face that come from the concept, with the reason (see section 4).
- **Palette origin**: 3–5 colors sampled from the artifact with hex values, plus the one color used for actions.
- **Signature component**: a component only this brand would have (a VU-meter sync indicator, a cupping-form tasting panel, invoice rows that carry a rubber-stamp status).
- **Material**: what the imagery is (photography of what, generated or sourced) and what it is not.

Score each direction 1–5 on **fit** (true to the audience and brief), **distinctiveness** (the swap test below) and **buildability** (can be finished to a high standard in this task). Pick the highest total and record the two you rejected and why. The rejected directions go in the sheet and the report.

## 3. Distinctiveness tests

Run them on the chosen direction's first render at 1440 and 390:

- **Swap test.** Put a competitor's name on the page. If it still works, the page has no point of view yet.
- **Thumbnail test.** At 240px wide, the first screen must be recognizable by its shape and color alone.
- **Default test.** Count the defaults in the list below. More than one means the direction has fallen back to the template.

### The 2026 generated-page defaults

These are what every model reaches for. Use one only when the concept demands it, and write down why. Items marked never allowed have no exception.

- **Palettes:** cream `#F5F1E8`-ish paper with a terracotta or orange accent; forest green with cream; dark plum or aubergine with peach; near-black with one neon; indigo-to-violet gradients.
- **Type:** untuned Inter or `system-ui` as the whole identity; Instrument Serif, Fraunces, Playfair Display, DM Serif, Cormorant; a condensed display serif; **an italic serif accent word inside a headline** ("better *together*", "a lot of *feeling*"); Space Grotesk; Clash Display; Bricolage Grotesque.
- **Imagery:** a sunset circle over wavy hills as album or product art; a vinyl record sliding out of a sleeve; a kraft coffee bag with a colored band; floating tilted UI cards with sticker badges ("3 listening with you").
- **Structure:** (never allowed: an uppercase eyebrow above a title, numbered labels such as "01 /" or "(001)"); a three-step row; three equal icon cards; "Most popular" middle tier; a full-width accent CTA band before the footer; a quote section with a giant curly quote.
- **Copy:** "X is better together", "Built for the way you Y", "A little X. A lot of Y."

## 4. Type with a voice

Type is the fastest route to distinctiveness and the most common sign of a template. Choose a pairing from the concept and write the reason in one sentence ("wide grotesque from hi-fi faceplate lettering; mono for the receiver's readouts").

- Two families is normal for brand surfaces: a **display face with character** and a **workhorse text face** (or one superfamily with a width or optical-size axis). Add a mono only for data.
- Product UI (dashboards, settings, tables) stays a quiet text face at 13–15px, but the brand still needs a voice: the wordmark, page title, big numbers or status stamps can carry the display face.
- A serif is fine when the concept is editorial, archival, literary or craft; it is not a shortcut to "premium". Never an italic accent word.
- Tune it: tracking by size, `text-wrap: balance`, tabular figures, real punctuation. Load real files (Google Fonts, Fontshare or self-hosted WOFF2); never let a missing font fall back silently.

Starting points by quality, not defaults (rotate; do not reuse last project's choice):

| Voice | Display candidates | Text candidates |
| --- | --- | --- |
| Engineered, hi-fi, technical | Archivo (expanded widths), Familjen Grotesk, Martian Grotesk, Unbounded (sparingly) | Archivo, Schibsted Grotesk, IBM Plex Sans; mono: Martian Mono, JetBrains Mono, Azeret Mono |
| Poster, club, loud | Big Shoulders Display, Anton, Tanker (Fontshare) | Hanken Grotesk, Work Sans |
| Craft, archival, printed | Young Serif, Gloock, Zodiak (Fontshare), Petrona | Literata, Source Serif 4, Instrument Sans |
| Ledger, finance, precise | Schibsted Grotesk, Geist, Switzer (Fontshare) | same family; mono: IBM Plex Mono, Geist Mono |
| Friendly, soft, social | Gabarito, Open Runde, Figtree | Figtree, Nunito Sans |

## 5. Color with an origin

- Sample the palette from the concept's material and name its origin in the design record ("walnut cabinet `#2B1D14`, VU amber `#F2A33A`, dial cream `#EFE6D2`").
- Commit to at least one **bold field**: a full-bleed band, a dark section or a saturated surface that makes the page recognizable at thumbnail size. Neutrals still do the text work.
- One action color. It can come from the concept, but it must pass 4.5:1 on its label and 3:1 against its surface.

## 6. Material is the proof

- Real photography beats illustration for physical products and places. Generate or source it with `seenry-assets`; describe the shot like a photographer (subject, light, lens, surface, props). No flat SVG stand-ins for photos.
- For software, the product UI is the hero, filled with specific, varied data. Give it a detail layer: relative times, avatars with real initials, progress, counts, states.
- Every image must belong to the concept. A generic sunset or record could be on any music page; a listening bar at night with a receiver glowing could only be on this one.

## 7. Density and legibility floors

Judges and users read the rendered page, often scaled down. Tiny, faint text reads as unfinished.

- Marketing body 16–18px; supporting copy ≥ 15px; metadata ≥ 13px at text-2 contrast. Phone supporting copy ≥ 15px.
- Product UI 14px for table cells and 13px for meta, never 11–12px for anything people need to read. Mono labels at 11–12px only when they are decoration.
- Fill sections: a section with one headline and three short lines in 600px of empty space looks sparse. Either give it content (a real UI crop, data, an image) or merge it.

## 8. Phone as its own composition

- Navigation must not clip. Horizontally scrolling tab rows that cut a label at the edge look broken; use a bottom tab bar, a menu or fewer items.
- A sticky bar (add to bag, primary action) must not cover content in a **full-page** screenshot: place it in the flow near the controls and add a sticky copy only after the in-flow one scrolls away, or reserve its height at the end of the page.
- Re-compose, not stack: phone lists are compact rows, not tall cards; the first phone screen still shows the concept.
