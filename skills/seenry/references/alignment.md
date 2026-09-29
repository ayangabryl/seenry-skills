# Alignment

Alignment is what makes a layout feel designed. People can't name a 3px error, but they feel it, and generated UI is full of them because CSS boxes are not what the eye sees. A text box includes half-leading above the capitals; an icon's SVG box includes padding around the drawn glyph; a 40px button's hit area is wider than its circle. Aligning boxes produces visible misalignment. Studios align **ink**: the letters, the drawn glyph, the image edge.

## The rules

1. **Build on keylines.** Before styling, name the vertical keylines (outer inset, media edge, text column start, right inset) and horizontal ones (media top, media bottom, baseline rows). Every element snaps to one. Write them in the spec card.
2. **Align text by its cap height and baseline, not its line box.** A title beside an image starts where its capitals start, level with the image's top edge. Use `text-box: trim-both cap alphabetic` (Chrome 133+, Safari 18.2+) so the box equals cap-top to baseline, with a measured negative margin fallback in `@supports not`. The same trim makes padding measured to text honest: 16px under the last line means 16px under the baseline.
3. **Align icons by their drawn glyph, not their button.** A 40px button with a 20px icon puts the glyph 10px in from its box, plus the icon set's own inner padding (Lucide draws inside ~2px of its 24 viewBox). Pull the row back with a negative margin so the glyph's ink sits on the keyline, keeping the full hit area.
4. **Equal optical inset.** Padding is measured from the component edge to the nearest ink on each side. For a card, those four numbers are equal (or deliberately different, e.g. a heavier bottom), never accidental like 12/16/20/12.
5. **Exact or clearly different.** Two edges are either the same (within 1px) or differ by at least 8px. An offset of 2–6px always reads as a mistake. This is the near-miss rule.
6. **Anchor media relationships.** Beside an image: first line's cap top = image top, last element's bottom = image bottom (or the stack centered on it). Below an image: the next element starts at the image's left edge. Spanning elements (progress bars, dividers) run from the leftmost keyline to the rightmost.
7. **Concentric everything.** Media radius = card radius − inset. Inner buttons in a pill input: button radius = input radius − inset.
8. **Proportion before alignment.** Media in a compact row component is ~22–30% of the component width, and its height sets the row: the text stack and controls fit exactly inside it. Media taking a third or more of a card makes the text column feel squeezed.
9. **Optical corrections are deliberate and measured.** Triangles (play) sit 1–2px right of center in a circle; round shapes overshoot squares by ~5% to look the same size; large headlines pull left by their side bearing. Apply these after geometric alignment, never instead of it.
10. **The pixel grid underneath.** Sizes, gaps and insets are multiples of 4, so keylines land on whole pixels at 1x, 2x and 3x. Fractional positions (from `%` widths or `em` margins) blur edges; round them.

## Worked example: player card

```
Keylines   V1 = card left + 16 (cover left, scrubber start, time start)
           V2 = cover right + 16 (title, artist, previous glyph)
           V3 = card right − 16 (scrubber end, remaining time end)
           H1 = cover top = title cap top
           H2 = cover bottom = play circle bottom
           H3 = card bottom − 16 = times baseline
Proportion cover 96 of 400 (24%); card r28, inset 16, cover r12
```

The first version aligned the title's line box to the cover, which left the capitals 12px low; the scrubber started 4px right of the cover; insets were 12/16/20/12 and the cover took 34% of the width. The audit reported all of it; the rebuilt card measures 0/0/0 on the anchors and 16/16/16/16 on the insets. See [assets/examples/player-card.html](../assets/examples/player-card.html).

## Measure it

Mark each component root with `data-component` and run the [system audit](../scripts/system_audit.mjs). For every component it reports:

- `alignment.insets`: optical inset from the component edge to the nearest ink on each side.
- `alignment.anchors`: for each image, the cap-top offset of the first item beside it, the bottom offset of the last item, and the left offset of what sits below it. Target 0.
- `alignment.nearMisses`: pairs of edges 1–6px apart (text measured at cap top and baseline, SVG glyphs at their drawn shapes, media and filled shapes at their boxes). Target none.

Then look: overlay the keylines (the [grid overlay](../assets/layout-guides/README.md), or 1px fixed-position lines at the measured positions) and screenshot at 2x or 3x. Numbers find the errors; the overlay proves the fix to a human.

## Then correct optically

Geometric alignment is the first pass. Shapes the eye misjudges (triangles, circles, chevrons, large glyph side bearings, icon-side padding) need the corrections in [optical](optical.md).

## Sources

Material Design's keylines and 4dp baseline grid, Apple's layout margins and readable content guides, Figma's vertical trim (cap height to baseline) and the CSS Inline Layout Module's `text-box` properties all encode the same idea: align what is drawn, not the box around it.
