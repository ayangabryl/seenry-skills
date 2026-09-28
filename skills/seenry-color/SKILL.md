---
name: seenry-color
description: "Create or repair an interface color system. Use for palette direction, semantic roles, contrast, state colors, dark mode, and a page whose colors feel arbitrary or generic."
license: MIT
metadata:
  author: Seenry
  version: "2.1.0"
---

# Seenry Color

Begin with the existing identity, actual imagery and task. Preserve supplied brand colors and token conventions. A palette is a relationship among occupied areas, text, actions and states; a row of swatches does not prove the page works.

## Assign roles

Identify canvas, raised surface, primary and secondary text, border, action, focus, selection, error, success and warning only where each appears. Give each token a job. Do not use a border token for text merely because it currently has the right value. Keep semantic tokens separate from underlying color values so a dark appearance can assign roles afresh.

Inspect the page's large color fields alongside image light and subject color. For a new identity, compare at least two plausible area distributions on the **same** composition and content. One may be quiet and one expressive; neither is inherently better. Test whether color makes the intended action or material clearer. Avoid deriving emotion or brand character from a hue alone.

## Verify on pixels

Measure the actual foreground and opaque background pair for body, secondary, control and state text. Include hover, selection, error and focus surfaces. Use the project's applicable accessibility standard; do not invent a ratio from a screenshot. For transparency, gradients, photos and nested surfaces, inspect the rendered combination or sample it in a browser. Check state meaning without relying on color alone, including forced-colors and dark appearances where supported.

Preserve exact supplied values when possible. If a brand accent fails as small text, give it another role instead of silently changing the mark. Generate only ramp steps with a real use; keep the project's existing notation. Use perceptual color tools for candidate ramps, then measure final rendered pairs rather than treating equal lightness values as equal contrast.

Record the chosen area distribution, measured pairs, rejected alternative and remaining uncertain surfaces. For a full Seenry installation, [color decisions](../seenry/references/color-decisions.md) and [the color guide](../seenry/references/craft/color.md) provide comparison tools; neither selects an aesthetic automatically.
