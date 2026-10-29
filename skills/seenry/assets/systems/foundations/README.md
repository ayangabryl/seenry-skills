# Foundations

The research every system's values come from. Each page states the rule, why it holds (human perception, accessibility standards or measured leaders), the numbers, and how `scripts/system_check.mjs` checks it. A system may choose its own values inside these rules; it may not break them.

| Foundation | The rule in one line | Checked |
| --- | --- | --- |
| [Radius](radius.md) | Nested corners are concentric: inner radius = outer radius − the gap between them | Rendered: every rounded child inside a rounded parent |
| [Focus](focus.md) | A visible, high-contrast ring for keyboard focus only, at least 2px, following the control's shape | Rendered: tab through each page |
| [Dividers](dividers.md) | A rule either runs edge to edge of its container or stops exactly at the content inset; never in between | Rendered: every hairline inside a padded container |
| [Depth and material](depth.md) | Depth is rare: one raised object per view, hairlines and tone for everything else | Rendered: count of raised controls per view |
| [Targets](targets.md) | 24px minimum, 44px on touch; spacing counts toward the target | Rendered at 390 |
| [Type](type.md) | One family or a deliberate pair, 6–8 steps, 45–75 characters per line, tracking by size | Static and rendered |
| [Color](color.md) | Contrast by role (4.5:1 text, 3:1 large text and UI parts), color carries one meaning | Rendered |
| [Motion](motion.md) | Duration by distance and frequency, ease-out for entering, on the animation clock | Static and filmed |

## Sources

- W3C, *Web Content Accessibility Guidelines 2.2* (2023): 1.4.3, 1.4.11, 2.4.7, 2.4.11, 2.4.13, 2.5.8.
- Apple, *Human Interface Guidelines*: layout, materials, buttons, accessibility (44pt targets), typography.
- Google, *Material Design 3*: shape scale, elevation, state layers, motion duration and easing.
- Fitts, P. M. (1954), "The information capacity of the human motor system in controlling the amplitude of movement", *Journal of Experimental Psychology* 47(6).
- Wertheimer and the Gestalt principles of proximity, similarity, continuity and common region; Palmer, S. E. (1992), "Common region: a new principle of perceptual grouping", *Cognitive Psychology* 24.
- Nielsen Norman Group: visual hierarchy, proximity, flat design and signifiers (2017–2024 articles).
- Emil Kowalski, *animations.dev* and his MIT skills; design.how's MIT systems (Glaze, Lime, Quartz, Sodium), measured in source.
- Bringhurst, R., *The Elements of Typographic Style*: measure and leading.
