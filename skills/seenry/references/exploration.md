# Structured exploration

A studio never ships its first layout. It fixes the rules, explores several compositions inside them, critiques side by side, and refines one. This is structured randomization: the model is free to vary composition, but only within a frame of column grid, pixel grid, padding, safe space, type set, radius family and palette. The frame keeps every option on-system; the variation finds the one that is actually good.

## 1. Fix the frame

Write it down before generating anything. Nothing in the frame changes between variants.

```
Frame: player card
Pixel grid:  4px, layout values multiples of 8
Columns:     card = [media 136] [gap 20] [flex]; phone same, media 112
Safe space:  outer radius 28, inset 12 (media r16, concentric)
Type set:    15/600 title · 13/400 secondary · 11/500 mono meta  (3 sizes, 3 weights, 2 families)
Radius:      28 card · 16 media · pill controls
Palette:     warm neutrals + one accent sampled from the artwork
Material:    real cover image, Lucide/Phosphor icons at 20
```

## 2. Choose the axes to vary

Pick 2–3 axes that actually change the design, and assign a different value to each variant. Good axes:

| Axis | Values |
| --- | --- |
| Primary anchor | media-led · type-led · data-led · control-led |
| Media scale | thumbnail (≤ 64) · companion (≈ 1/3 width) · hero (full width) |
| Arrangement | horizontal split · vertical stack · overlay on media · chrome shell with inner card |
| Alignment | leading edge · centered axis · two-column tension |
| Density | airy (24–32 gaps) · standard (16) · dense (8–12 with hairlines) |
| Surface | flat on page · contained card · shell + inner card · full-bleed |
| Detail layer | none · metadata line · mono labels · live data (counts, times, status) |

Bad axes: color swap, corner radius, shadow, font swap. Those are frame decisions, not compositions. The bigger choice (concept, type voice, palette origin) is made one level up, by pitching three directions in [art direction](art-direction.md) before the frame is fixed.

## 3. Generate 3 variants

Build each as a separate file (`vA.html`, `vB.html`, `vC.html` or components behind a switch) with identical content and data. Render all at delivery size and at 390 wide, and place them side by side with the [exploration sheet](../assets/explore.html) or a stitched screenshot. Run the [system audit](../scripts/system_audit.mjs) on each: every variant must pass the frame (no off-grid values, ≤3 sizes per component, concentric radii) before it is judged on taste.

## 4. Critique like a studio

Score each variant against these questions, in writing, one line each:

1. **Read order:** what does the eye land on first, second, third? Is that the right order for the task?
2. **Anchors:** does every element sit on a keyline, measured at ink (title cap top to media top, control glyph to text edge, scrubber to media left edge)? List any element that floats or misses by 2–6px.
3. **Proportion:** is there one dominant element and clear subordinates, or does everything compete at the same size?
4. **Material:** is the imagery real, well cropped and doing work? Is the accent derived from it?
5. **Detail layer:** is there one level of fine detail (metadata, mono labels, live values) that rewards a closer look, without clutter?
6. **Fit:** would this sit naturally inside Linear, Apple Music, Spotify or Airbnb? If it looks like a template, say which part.

Pick one variant. Keep its strongest idea and steal at most one idea from the others. Record the choice and why in `DESIGN.md`.

## 5. Refine the chosen one

Fix everything the critique found, then do a detail pass with [craft](craft.md): optical alignment, icon sizes, hit areas, focus, hover, pressed, the longest title, a missing image, dark mode. Re-render and compare against the first version. If the refined version is not clearly better, you refined the wrong thing.

## When to explore

- Always for a hero, a signature component, a pricing section, or any first screen.
- For a system component (button, input) the frame already decides almost everything; explore only states.
- For a page, explore the hero and one representative section; the rest inherit the chosen direction through the frame.

## Worked example

The Seenry player card was explored on three axes (arrangement, media scale, detail layer): A horizontal split with companion art, B a chrome shell with mono header and thumbnail art, C a vertical stack with hero art. All three passed the audit. A won for matching the task (quick control while browsing). Its first refinement still had box-level errors: the title's capitals sat 12px below the cover top, the scrubber started 4px right of the cover and the insets were 12/16/20/12. Rebuilt on keylines with ink-level alignment ([alignment](alignment.md)), the cover shrank from 34% to 24% of the width and the audit measures zero offsets. The result is in [assets/examples/player-card.html](../assets/examples/player-card.html).
