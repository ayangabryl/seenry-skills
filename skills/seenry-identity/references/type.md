# Type catalog

Typefaces worth reaching for, by job, with where they come from and their license. Every open and Fontshare entry was checked with `identity.mjs info`; check again before shipping, because licenses change. Fetch any of them with `node scripts/identity.mjs fetch "<family>"`.

## Contents

- How to choose
- UI text: the workhorses
- Identity sans
- Serifs
- Display and character
- Monospace
- Premium foundries
- Pairing
- Tuning
- Overused, and when they are still right
- Licenses

## How to choose

A product usually needs two voices: a **UI face** people read for hours (forms, tables, buttons, body) and an **identity face** people remember (the name, headlines, numbers that matter). They can be the same family, used at two different sizes and weights, or two families that differ in one way only.

Pick the identity face from the idea in one line, not from the category. "A Lisbon studio that designs signs for the city" points to a face drawn for signage or public lettering; "a calm sleep app" to soft, open forms with quiet numerals. Write three adjectives the face must carry, then set the real headline in four candidates on the canvas. The one that makes the real line sound like this product wins, not the one that looks most designed.

## UI text: the workhorses

Open source (OFL), all with variable weights unless noted.

| Family | Character | Italic | Use for |
| --- | --- | --- | --- |
| **Inter** | Neutral, very legible, huge language support, `opsz` axis (Inter Display at large sizes) | Yes | The default UI face for tools and dashboards. Tune it (below); untuned Inter at default tracking is the generic AI look |
| **Inter Tight** | Inter spaced for display | Yes | Headlines in an Inter product |
| **Geist** | Swiss-leaning grotesk, slightly geometric, crisp at small sizes; 9 weights | Yes, since 1.5 | Developer tools, technical products, a sharper alternative to Inter |
| **Geist Mono** | Its monospace | Yes | Code, figures in tables, technical labels |
| **Open Runde** | Inter with rounded terminals, an open SF Pro Rounded; 400–700 | No | Friendly consumer, health, kids, social; pairs with the round radius family |
| **Nunito** | Fully rounded, soft, warm | Yes | Playful and young products; weaker for dense data |
| **Figtree** | Clean geometric, friendly, compact | Yes | Commerce, marketplaces, onboarding |
| **Instrument Sans** | Neo-grotesk with a little warmth, width axis | Yes | Product sites that want precision without coldness |
| **Hanken Grotesk** | Plain, honest grotesk | Yes | Calm products, long reading |
| **Schibsted Grotesk** | News grotesk, sturdy, slightly condensed feel | Yes | Media, news, editorial products |
| **Host Grotesk**, **Funnel Sans** | Contemporary grotesks with character in the details | Yes | Product sites that should not look like Inter |
| **Onest** | Calm, wide-ish, Cyrillic-strong | No | Multilingual products |
| **IBM Plex Sans** | Engineered, slightly mechanical, a full superfamily | Yes | Enterprise, finance, technical documentation |
| **Public Sans** | Neutral, government-grade | Yes | Civic and public services |
| **Atkinson Hyperlegible Next** | Letters designed to never be confused | Yes | Accessibility-first products, low vision |
| **Manrope**, **DM Sans**, **Plus Jakarta Sans** | Geometric-modern | Most | Common in templates; use only tuned and with an identity face |

Fontshare (ITF Free Font License: free for commercial use, not open source; never redistribute the files):

| Family | Character | Italic | Use for |
| --- | --- | --- | --- |
| **Switzer** | Clean neo-grotesk, 9 weights | Yes | A free stand-in for premium Swiss grotesks |
| **Satoshi** | Modernist geometric, crisp | Yes | Product and portfolio sites; very common now, so tune it |
| **General Sans** | Neo-grotesk with geometric touches | Yes | Studios, startups |
| **Supreme** | Grotesk with sharp, distinct details | Yes | Fashion, culture |
| **Author** | Humanist, slightly literary | Yes | Writing, publishing, notes apps |
| **Plein** | Soft grotesk | Yes | Lifestyle, wellness |

## Identity sans

| Family | Source | Character | Use for |
| --- | --- | --- | --- |
| **Bricolage Grotesque** | OFL | Quirky grotesk with optical size and width axes; ink traps at small sizes | Brands with a sense of humor; headlines that should feel made, not picked |
| **Funnel Display** | OFL | Display grotesk with distinctive curves | Tech brands that want a signature |
| **Familjen Grotesk** | OFL | Warm, slightly old-fashioned grotesk | Hospitality, food, local brands |
| **Syne** | OFL | Goes from normal to very wide in weight; made for an art center | Art, culture, events |
| **Unbounded** | OFL | Wide, round, futuristic | Web3, games, youth brands (use sparingly) |
| **Archivo** | OFL | Grotesk with a width axis from condensed to expanded | One family for a whole system: condensed for posters, normal for text |
| **Big Shoulders Display** | OFL | Condensed, drawn for Chicago signage | Civic, sports, signage-led identities |
| **Cabinet Grotesk** | Fontshare | Bold, characterful grotesk | Agencies, launches |
| **Clash Grotesk**, **Clash Display** | Fontshare | Tight, contrasted display grotesk | Very common in templates; avoid unless tuned and justified |
| **Panchang** | Fontshare | Extra-wide geometric | A wordmark or one huge line |
| **Chillax**, **Excon**, **Nippo** | Fontshare | Rounded, techno and blocky display voices | Specific moods; test hard |

## Serifs

| Family | Source | Character | Use for |
| --- | --- | --- | --- |
| **Newsreader** | OFL | Text serif with optical sizes, made for news reading | Editorial, long reading, a serif UI voice |
| **Source Serif 4** | OFL | Sturdy transitional serif with optical sizes | Documents, publishing |
| **Literata** | OFL | Designed for e-reading | Books, reading apps |
| **EB Garamond** | OFL | Classical old style | Literary, heritage |
| **Cormorant** | OFL | High-contrast Garamond display, fragile at small sizes | Luxury display only, never body |
| **Libre Caslon Text** | OFL | Classic English text serif | Law, institutions |
| **Crimson Pro**, **Spectral** | OFL | Book serifs | Reading |
| **Bodoni Moda** | OFL | Didone, sharp contrast, optical sizes | Fashion and beauty headlines |
| **Young Serif** | OFL | Heavy, soft old style | Warm food and craft brands |
| **Gloock** | OFL | Bold high-contrast display serif | One strong headline |
| **Erode**, **Zodiak**, **Gambetta**, **Sentient**, **Bespoke Serif**, **Boska**, **Rowan** | Fontshare | Contemporary serifs from text (Sentient, Gambetta) to sharp display (Zodiak, Boska) | Studios and culture brands wanting a serif that is not Garamond or Playfair |

## Display and character

| Family | Source | Character |
| --- | --- | --- |
| **Anton**, **Bebas Neue** | OFL | Condensed poster capitals; overused on posters, fine for a scoreboard |
| **Darker Grotesque** | OFL | Thin-to-black grotesk with odd proportions |
| **Tanker**, **Stardom**, **Melodrama** | Fontshare | Heavy poster, retro display, elegant condensed |
| **Gambarino** | Fontshare | Soft display serif |

## Monospace

| Family | Source | Use for |
| --- | --- | --- |
| **Geist Mono** | OFL | With Geist; technical UI |
| **JetBrains Mono** | OFL | Code-heavy products, tall x-height |
| **IBM Plex Mono** | OFL | With Plex; data and labels |
| **Commit Mono** | OFL | Neutral, calm code face |
| **Martian Mono** | OFL | Wide mono with character |
| **Fragment Mono** | OFL | Helvetica-like mono |
| **Space Mono** | OFL | Retro-technical; common |

Mono is for aligned figures and code. As background texture or decoration it reads as generated.

## Premium foundries

For a brand with a budget, licensed type is the biggest single step up: the drawing, spacing and kerning are a level above most free fonts, and nobody else's template uses them. Comp with the foundry's trial files on the canvas (trials allow presentation only), then buy desktop and web licenses before shipping. Web licenses are usually priced by monthly page views; app licenses separately.

| Foundry | Faces to know | Character |
| --- | --- | --- |
| Klim Type Foundry | Söhne, Founders Grotesk, National 2, Untitled Sans and Serif, Tiempos, Signifier, Domaine | The reference for modern grotesks and editorial serifs |
| Grilli Type | GT America, GT Walsheim, GT Sectra, GT Super, GT Alpina, GT Flexa, GT Maru (rounded) | Swiss craft; GT Maru is the premium rounded choice |
| Dinamo | ABC Diatype, ABC Favorit, ABC Monument Grotesk, ABC Whyte, ABC Ginto | Contemporary grotesks used by many studios |
| Pangram Pangram | PP Neue Montreal, PP Editorial New, PP Mori, PP Neue Machina | Popular with studios; free personal trials, paid commercial |
| Commercial Type | Graphik, Lyon, Publico, Canela, Druk | Editorial and fashion |
| Colophon | Apercu, Value Serif | Friendly grotesk with personality |
| Sharp Type | Sharp Grotesk, Ogg | Expressive display |
| Lineto | Circular, Akkurat, Brown | Classic brand grotesks |
| Swiss Typefaces | Suisse Int'l | Swiss neo-grotesk |
| Monotype | Helvetica Now, Neue Haas Grotesk | The originals the free grotesks imitate |

Free near-matches for comping without a license: Switzer or Instrument Sans for Swiss grotesks, Newsreader for Tiempos-like text, Open Runde for GT Maru or SF Rounded, Bodoni Moda for Didones.

## Pairing

- **One family** in two voices (weight, size, width) beats two families that fight. Archivo, Bricolage and Inter Tight carry a whole system alone.
- **Two families differ in one way only.** A serif with a sans of similar x-height and width; a condensed display with a normal-width text face of the same era. Never condensed with expanded, never two geometric sans, never two serifs.
- **Mono only for figures and code.**
- Set both at real sizes on the real ground before deciding; pairs that look fine in a list often clash on the page.

## Tuning

Untuned free fonts are what makes a page look templated.

- **Display tracking:** tighten as size grows: about −0.01em at 32px, −0.02em at 48px, −0.03 to −0.04em at 96px and above. Line height 0.9–1.05 for display, 1.4–1.6 for body.
- **Optical sizes:** use the axis (`font-optical-sizing: auto`) or the Display cut at large sizes (Inter Display, Newsreader's display range).
- **Inter:** `font-feature-settings: "cv11", "ss01", "ss03"` (single-storey a, open digits, round quotes), plus `"tnum"` in tables.
- **Numbers:** `font-variant-numeric: tabular-nums` where numbers line up or change; lining figures in UI, old-style in long text if the face has them.
- **Weights:** two or three per family. The contrast between 400 and 600 does more than five weights.
- **Italic:** use the real italic, never a synthesized slant (`font-synthesis: none`). Check it exists (`identity.mjs info`); Open Runde, Manrope and Bricolage have none.

## Overused, and when they are still right

These are not bad typefaces. They are what models reach for, so on their own they read as generated: Inter untuned, Space Grotesk, Clash Display, Satoshi, Playfair Display, Fraunces, Instrument Serif in italics for one accent word, DM Sans, Manrope, Poppins. Use one when the brief clearly calls for it and it is tuned, and say why in `identity.md`. Never use one as the identity face just because it was at hand.

## Licenses

| License | Means |
| --- | --- |
| OFL-1.1 (SIL Open Font License) | Free for any use, including commercial and self-hosting; may be modified (renamed if the name is reserved); may not be sold on its own |
| ITF-FFL (Fontshare) | Free for personal and commercial use including web and apps; not open source; do not redistribute the font files |
| Commercial EULA | Licensed per use (desktop, web by page views, app, broadcast); trials only for presentation |

`identity.mjs fetch` records each family's license and source in `fonts/fonts.json`. Keep that file with the product.
