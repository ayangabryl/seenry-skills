# Color: assign roles, then inspect area

Use when palette, contrast or competing emphasis is unresolved. Preserve the project's notation and semantic tokens. MCP is optional: the component, brief and local comparison are sufficient to test a color decision.

For palette authorship or a combination study, read [color combinations](../color-combinations.md). A hue slider alone does not demonstrate a system.

## Execute

Name canvas, surface, text, secondary text, action, focus and only the states actually used. Give each value a purpose instead of borrowing a separator token for text because it happens to match. Different visual roles may share a hue when context remains unambiguous. Do not invent a universal hue-to-emotion rule.

Sketch large occupied areas before picking tiny swatches. Compare two plausible treatments on the same composition with identical copy. Include a neutral treatment for an unbranded utility when appropriate; do not turn that comparison into a default neutral-only identity. Rich color can belong to artwork, categories or a large brand field without tinting every control.

Measure foreground against its actual rendered background, including supporting text on each surface. For opaque hex pairs when a browser scan is unavailable, use `python3 scripts/contrast_check.py --pair "Muted on paper" '#647267' '#F5F1E7' 4.5`; its nonzero exit flags a failure. Account for transparency, gradients and imagery; an opaque token-pair calculation does not validate a photograph overlay. Never invent ratios. Color remains insufficient as the sole indication of selection or failure.

## Working example

[Color study](../../assets/craft/color.html) changes semantic roles across three opaque palettes. It computes sRGB contrast for body copy, supporting copy and action text. These reported measurements cover those pairs only; they do not certify the page or select the best aesthetic.

## Counterexample

A large warm field may suit a tactile workshop identity but compete with color-critical product photography. A neutral palette can clarify comparison yet underexpress a festival brand. Neither saturation nor whiteness proves quality.

## Verify

Inspect occupied area, competing actions, focus, selection and error states at wide and narrow sizes. Verify supported light/dark appearances separately. Record measured pairs, a rejected alternative and its observed weakness. If color is the suspected failure, change color alone before blaming typography or banning a hue globally.

## Build and align palette roles

Start with semantic canvas, surface, text, muted text, border, action and status roles. Preserve exact supplied brand colors; if one fails as an action fill, choose another functional role rather than silently altering the mark. Generate ramps in a perceptual space, check gamut and measure actual foreground/background pairs. Equal OKLCH lightness or chroma values do not establish equal contrast across hues or backgrounds. Tune status colors alongside the accent at the same usage size and area. Dark mode needs its own role assignments and pair checks, not a reversed light ramp.

For broader palette decisions and measured pairs, use [color decisions](../color-decisions.md) and [color combinations](../color-combinations.md). Keep the selected roles in the project's own tokens.
