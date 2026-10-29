# Color

## The rule

- **Contrast by role (WCAG 2.2 AA):** 4.5:1 for text under 18px (14px bold), 3:1 for large text, 3:1 for UI component boundaries and state indicators (1.4.11), in both themes.
- **One color, one meaning.** The accent marks the primary action and selection; red means failure or destruction and nothing else; green means success; amber means warning. Status always pairs color with a word or an icon (1.4.1, use of color).
- **Neutrals carry the screen.** A ramp of 8–12 neutral steps defined in a perceptual space (OKLCH) so steps look even; surfaces, lines and text come from it.
- **Dark themes are designed, not inverted:** lighter surfaces sit higher, saturated colors are desaturated a step, and text is off-white rather than pure white.

## Why

WCAG 2.2 sets the floors. Perceptually even ramps (OKLCH) prevent the muddy midtones of HSL ramps. A single meaning per color is what lets a scanning user find trouble fast (design.how's Quartz rule that warm colors mean only trouble is the same principle).

## Check

`system_check.mjs` measures text contrast on every page in both themes; the critic and SYSTEM.md review the meaning of each color.
