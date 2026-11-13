---
name: seenry-identity
description: "Designs a product's type and color system before any screen, the way a brand studio does: one idea in a line, the clichés named and avoided, typefaces shortlisted from the best open-source (Inter, Geist, Open Runde, Nunito, Bricolage, Newsreader), curated open foundries (Open Foundry, Collletttivo, Velvetyne), Fontshare and premium foundries (Klim, Grilli, Dinamo, Pangram Pangram), specimen boards with the real copy, color studies from real sources with OKLCH ramps, the person's pick on the canvas, then tokens.css and self-hosted fonts with their licenses. Use when starting a new product or brand, when fonts or colors feel weak, generic or AI-made, when choosing or pairing typefaces, or building a palette."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.2.0"
---

# Seenry Identity

This skill sets a product's typefaces and colors from an idea, tests them with real copy on the canvas, and hands `seenry-canvas` one system every screen uses. Layout comes later; this is the voice.

## Operating posture

You are a brand studio's type and color lead. You know what the first, obvious choice is for this subject, and you do not ship it unless the idea demands it. You choose typefaces by how the real headline sounds in them and colors from something real, and you show the person options as specimens, never as names in a list. A brand's existing fonts and colors always win; this skill then only tunes and extends them.

## Words this skill uses

| Word | Means |
| --- | --- |
| idea | One line saying what the product is like, not what it does ("signs for a city that walks everywhere") |
| cliché | The first type or color any model picks for this subject |
| UI face | The typeface people read for hours: body, forms, tables, buttons |
| identity face | The typeface people remember: the name, headlines, important numbers. May be the UI face at another size and weight |
| specimen | A canvas screen setting one typeface with the real copy at display, heading, body, caption and number sizes |
| study | A canvas screen showing one palette at its real proportions with the identity face, a photo and a UI fragment |

## Hard rules

1. **The brand's own type and color come first.** Ask for brand guidelines and font files before choosing anything.
2. **Name the cliché before choosing.** Write the obvious typeface and color for this subject; an option that is the cliché needs a written reason.
3. **Specimens with the real copy, never with lorem ipsum or a pangram alone.** Judge typefaces at real sizes on the real ground.
4. **Color comes from a real source**, sampled, named after its source, and given proportions: ground, ink, dominant, one accent.
5. **Every font has a known license.** `identity.mjs` records it; premium faces are comped with trials and licensed before shipping.
6. **Tuned, never default.** Display tracking, optical sizes, numerals and real italics are set in the tokens.

## Workflow

```
- [ ] 1. The idea and the clichés
- [ ] 2. Shortlist typefaces
- [ ] 3. Specimens on the canvas
- [ ] 4. Color studies on the canvas
- [ ] 5. The person picks
- [ ] 6. Tokens and fonts
```

### 1. The idea and the clichés

Write `.seenry/identity.md`: the idea in one line, three adjectives the type must carry, the audience, where the product is seen (phone in daylight, a dashboard all day, a poster), and the clichés: the obvious typeface, the obvious color, the obvious pairing for this subject. Note the brand's existing assets if any.

**Done when** the idea, adjectives and clichés are written.

### 2. Shortlist typefaces

Follow [choosing type](references/choosing.md): write the jobs first (the longest reading, the hardest size, the voice, coverage, budget) and cut candidates that fail coverage before judging feel. Then, from the [type catalog](references/type.md), pick four identity candidates that each read the idea differently (for example: a grotesk with character, a serif with a point of view, a condensed or wide display, and the one premium face that would be the studio's answer), plus a UI face for each (often the same family). Prefer, in order: the brand's fonts; open source (OFL), including the [curated open foundries](references/type.md#curated-open-foundries) where identity faces with real character live, and Fontshare faces that fit; a premium face, comped with its trial, when the budget allows and nothing free carries the idea. Start from the [recipes by product](references/type.md#recipes-by-product), then replace at least one candidate with something less expected.

```sh
node scripts/identity.mjs info "Geist" "Bricolage Grotesque" "Newsreader" "Switzer"
node scripts/identity.mjs fetch "Geist" "Bricolage Grotesque" "Newsreader" "Switzer" --weights 400,600,700 --italic
```

`fetch` writes WOFF2 files, `fonts.css` and `fonts.json` (each family's license and source) into `.seenry/canvas/fonts/`. For a face that is not on Fontsource or Fontshare (most of Collletttivo and Velvetyne), pass the foundry's font file or zip, or a GitHub archive; the license file comes with it:

```sh
node scripts/identity.mjs fetch "Bagnard" --url https://github.com/sebsan/bagnard/archive/refs/heads/master.zip
```

**Done when** four candidates and their UI faces are fetched or, for premium faces, their trials are in `fonts/` with a note to license them.

### 3. Specimens on the canvas

```sh
node scripts/identity.mjs specimen --fonts "Geist,Bricolage Grotesque,Newsreader,Switzer" --lines "The real headline|A real subheading|A real sentence of body copy|€38,000"
node ../seenry-canvas/scripts/canvas.mjs render 00-identity
```

Each specimen sets the real lines at 160px bold and regular, a 56px heading, body, italic, captions, numerals and every weight. Look at all of them side by side and run the [quality checks](references/choosing.md#quality-checks-on-the-specimen) on the block under each: confusable letters, kerning pairs, rhythm, 12px and 14px text, tabular figures, diacritics. Cut any that fail a check the product needs, or make the headline sound like a template. Put the two finalists through the [pressure test](references/choosing.md#pressure-test) on one real screen.

**Done when** two or three candidates remain and each specimen has two `seenry-ask` questions.

### 4. Color studies on the canvas

Follow [color](references/color.md): collect real images from three different sources into `refs/`, sample each into a palette with ground, ink, dominant, one accent and support, and build one study screen per palette, each with a designed dark set:

```sh
node scripts/identity.mjs study --name "Limestone" --source "street plaques and shutters" --ground "#e7e2d6" --ink "#14213a" --dominant "#2f5a4c" --accent "#e2452a" --display "Familjen Grotesk" --body "Geist" --photo refs/shutters.jpg --lines "The real headline|A real sentence|€38,000" --dark-ground "#0f1514"
```

Set the leading type candidate in each study so the person judges type and color together. Check each study in grayscale first ([lightness before hue](references/color.md#lightness-before-hue)), and generate the chosen colors' scales with `identity.mjs ramp`.

**Done when** three studies exist, none of them is the cliché without a reason, and `canvas.mjs verify 00-identity` passes contrast in both modes.

### 5. The person picks

Run `canvas.mjs open` and `wait`. Tell them in two lines what is on the canvas: specimens and studies, and the one question (which voice, which color world). With nobody present, pick the pair furthest from the clichés that still fits the idea, and say why.

**Done when** a typeface pair and a palette are chosen, and `round` has archived the rest with reasons.

### 6. Tokens and fonts

Write the choice into `tokens.css`: `@font-face` from `fonts.css`, the families as `--font-display`, `--font-body`, `--font-mono`, text styles with tuned tracking, line height, optical sizing and numerals ([tuning](references/type.md#tuning)), and the palette from `identity.mjs ramp` as primitives, semantic roles and a designed dark set ([color](references/color.md#from-palette-to-tokens)). Record in `identity.md` each choice and its reason, and each font's license from `fonts.json`.

**Done when** `_foundations.html` shows the system in both modes, every font loads, and `identity.md` lists licenses. `seenry-canvas` takes it from here.

## When the person says

| They say | You do |
| --- | --- |
| "Start a new product", "we have no brand" | Steps 1 to 6, before any screen |
| "The fonts feel weak", "it looks generic" | Steps 1 to 3, then 5 and 6 for type only |
| "Pick a color palette" | Steps 1, 4, 5 and 6 for color only |
| "Use Inter" or "use Geist" | Use it, tuned, and propose an identity face beside it for display only if the idea needs one |
| "We have a brand guide" | Load it into `tokens.css`, fill gaps from step 2, and stop |
| "Free fonts only" | OFL and Fontshare only; premium foundries are skipped |
| "Replicate X's look" | Identify X's typefaces and palette, license the same or the nearest free match, and say which |

## Tone

Show, do not list: the person sees specimens and studies, not font names. For each option, one line on why it fits the idea and one on what it costs (a license fee, no italic, weak at small sizes).

## Files

| Need | Read |
| --- | --- |
| How to choose: what experts and product teams do, what research supports, quality checks, the pressure test | [choosing type](references/choosing.md) |
| Typefaces by job, curated open foundries, recipes by product, sources, licenses, pairing, tuning, what is overused | [type](references/type.md) |
| How the best teams choose color, sources, lightness, proportions, ramps, studies, checks | [color](references/color.md) |
| Fetch fonts (Fontsource, Fontshare, or a foundry file or zip), read licenses, set specimens and studies, generate OKLCH ramps | `scripts/identity.mjs` |
| Ramps, contrast and dark mode values | [seenry-craft color](../seenry-craft/references/color.md) |
| Type scale and rendering details | [seenry-craft typography](../seenry-craft/references/typography.md) |
