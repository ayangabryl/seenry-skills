# Compare dominant color material spatially

For a reference whose visual weight comes from colored particles, ribbons, glow, illustration or another isolated color family on a quiet surface, compare **where** that material appears before tuning minor controls. Equal total color can still conceal the wrong silhouette, density gradient or empty space.

## Trace the source shape before choosing a generator

Record the image dimensions and at least six x/y anchors along each visible inner and outer contour of the dominant field. Include its left/right turning points, top/bottom extremes, where a curve crosses the center axis, and where density changes abruptly. Mark uncertain edges as estimates. A quick overlay of colored dots/lines on a copy of the source is useful: it exposes an anchor placed on a stray particle instead of the coherent envelope. For a two-branch ribbon, trace the upper and lower branches separately, including the whitespace between them. Do not infer a complete ellipse from a few points or from the word “orbit.”

Choose a representation capable of passing through the measured anchors: piecewise Bézier centerlines with variable width, sampled curve segments, layered paths, or an actual ellipse only when its fit is visibly adequate. Place particles inside that envelope and vary size, opacity and density by position/depth. Render one static frame and check the same anchor positions in the output before changing particle count or microtexture. If the output's center gap or boundary has the wrong shape, repair the path geometry first.

At equal physical dimensions, sample one representative source color and run:

```bash
python3 scripts/material_field_compare.py source.webp output.png --sample '#f46d52' --mask-dir comparison-masks > material-report.json
```

Use the skill directory or the script's absolute path. Pillow is required. Inspect both masks and both blurred density previews against the original images. The report gives total selected-color coverage and the grid cells with largest coverage differences. Use those cells to locate a discrepancy, then decide its cause by looking at the full source and output: silhouette, depth, layer order, empty space, particle size and color may matter more than total coverage. For several independent hues, run separate samples. `--region x,y,width,height` can isolate a material when similar colors appear elsewhere.

**Do not rank variants by a coverage or grid statistic.** An earlier reconstruction increased color coverage and reduced the grid difference while making the source's elliptical sweep look flatter and less faithful in an independent image-only review. Another attempt used a tilted ellipse, but it produced two nearly horizontal bands and again lost to the baseline. After each revision, compare equal-size source and output images at normal viewing scale. If a new render has better counts but worse perceived shape or depth, reject it. For a central material, have a reviewer compare anonymized before/after images against the source without seeing code, metrics or the builder's preference. Keep the reviewer result and unresolved visual gaps with the work. If the reviewer prefers the before render, restore the previous implementation and record the failure; do not describe the edited material as repaired.

Hue and saturation thresholds, antialiasing, color grading and overlapping text can change the mask. Adjust `--hue-tolerance` and `--min-saturation` only after looking at the mask. The grid and density previews are diagnostics, **not** fidelity percentages or pass thresholds. They cannot identify individual source assets, depth, blur, texture quality, motion or the designer's intent. If a reference contains complex photography with many hues, use direct visual/asset comparison instead.
