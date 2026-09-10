# Choose color by its job

Decide palette direction during planning, then test it on the actual layout. “Premium,” a fashionable hex value and a pleasing row of swatches do not specify a usable color system. The following decision process is Seenry's synthesis; source-backed requirements are identified below. None of the example palettes is a default for every brief.

## 1. Decide what color must accomplish

Record the audience, existing identity, content/artwork, ambient use, appearance preference and most important action. Separate **brand expression**, **interaction**, **information categories** and **status**. The same hue can serve several roles only when context keeps the meanings clear. Do not claim that a hue universally creates trust, luxury or creativity; cultural and task context matter.

First decide whether this is a brand decision at all. A component normally inherits its host's colors. For an isolated utility with no supplied identity, start by testing a readable neutral control system; add a chromatic role only when it serves a stated purpose. A photograph's dominant hue does not automatically become the settings palette. Changing the selected image should not unexpectedly rebrand its controls. An artwork-responsive media player or expressive identity can deliberately connect those colors, but must preserve state meaning and contrast.

Keep explanations observable: “the action is the only large chromatic control” is inspectable; “this tint reduces eye strain” requires relevant evidence and cannot be inferred from a hex code. A **counterexample** must name a situation where the proposed palette itself would be a poor choice, not praise it by listing problems it avoids. Honor explicit white/gray neutrality; do not quietly replace it with parchment or another favored aesthetic.

Freeze explicit brief constraints before generating options. The directions table is a menu of possibilities, not an instruction to select one option from every category. If the brief requires achromatic white/gray, both alternatives must remain inside that requirement. Differentiate surface contrast or action emphasis within it. For the local color lab, pass `--achromatic-roles canvas surface text muted controlBorder action onAction actionHover focus selected onSelected` when that matches the actual brief. Semantic error colors may remain separate unless the user also prohibits them. This check comes from the brief, not the model's own description of its palette. Repeated RGB channels are a strict achromatic check, not a universal definition of a visually quiet neutral.

Sketch the largest color areas before choosing accents: canvas, imagery, surfaces, text and controls. Estimate coverage qualitatively or from the rendered area. A tiny accent swatch and a full-screen field of that color have different effects. There is no required 60/30/10 split. Compare alternatives using identical content and layout so the suspected color effect can actually be assessed.

## 2. Choose a direction with a reason

| Direction | Useful when | Decisions that make it work | Common failure / contrasting use |
| --- | --- | --- | --- |
| Light neutral / white and gray | Reading, comparing, image-led work or a quiet utility where content should lead. | Choose the canvas/surface relationship, strong text, readable secondary text and one clear action hierarchy. Pure gray and white are valid; warmth is optional. Separate groups with space before borders. | Nearly invisible labels and nested gray cards can be both inaccessible and monotonous. A brand-led launch may deserve a stronger color field. |
| Dark neutral | User preference, low-light use or media whose surrounding surface should recede. | Design its own role values. Preserve text hierarchy, distinguish overlays from the base, inspect imagery and use sufficient chroma for small important marks. | Inverting light hex values, tinting every surface navy or using neon for every state does not establish hierarchy. Dark mode is not automatically the right brand expression. |
| Restrained brand color | A coherent identity or action emphasis with mostly neutral information. | Place brand color deliberately in actions, a section or artwork; keep unrelated status and support surfaces quieter. Compare a neutral alternative to a large tinted panel. | One accent applied to headings, pills, outlines, shadows and all buttons creates competing signals. A brand color need not tint the entire product. |
| Dominant brand field | An expressive identity whose large color area is part of the message. | Pick foregrounds for that exact field, decide where relief/contrast occurs across the page, and let type/space carry hierarchy. | A colored hero repeated in every section exhausts emphasis; a dense control surface may need a calmer working region. |
| Rich color / multiple categories | Discovery, creative tools, distinctive artwork or information that benefits from categorization. | Assign each hue a role; coordinate lightness/chroma and coverage; preserve a common text/control system. Check adjacent categories with labels or shapes and test color-vision alternatives. | A rainbow of unrelated component containers can obscure grouping. A serious or complex task can still use color, but each competing emphasis must earn its place. |

Apple-like restraint is a relationship between content, hierarchy and behavior, not an instruction to copy Apple or make every brief white. Compare quiet and expressive proposals when brand expression is an unresolved part of the brief. An open-ended utility request does not itself require a colorful alternative. Choose a direction because it supports the task and identity, not because the previous benchmark preferred it.

## 3. Define roles and their actual pairs

Use meaningful tokens: canvas, surface, primary/secondary text, action and its foreground, hover/pressed, selected and its foreground, focus, necessary control boundary, and meaningful error/success states. Provide the same roles for every supported appearance; they need not share hex values. Reusable components must work on the surface where they actually appear, including overlays. [Apple color](https://developer.apple.com/design/human-interface-guidelines/color) and [dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) support semantic appearance-aware choices. [Carbon](https://carbondesignsystem.com/elements/color/usage/) demonstrates pairing fields, borders and states with their layer context. These are examples of role systems, not a rule to tint every neutral.

Contrast belongs to **foreground + adjacent rendered background**, not to a color in isolation. Test ordinary text at 4.5:1 and qualifying large text at 3:1 under WCAG 2.2 AA; large means at least 18pt regular or 14pt bold, not an arbitrary heading tag. Do not round a failing ratio upward. [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

Test visual information needed to identify controls and states against adjacent colors at 3:1 where required. This does not mean every decorative separator or card edge must be a dark outline. A boundary is unnecessary when other visible information already identifies the control. [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

Bright yellow, mint or similarly luminous fills often need a dark foreground; white text is not a universal action style. [Radix's role-based scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) illustrates why background, border, solid-fill and text steps differ. Its scale guarantees must not be transferred to arbitrary color pairs or mistaken for full-page WCAG verification.

Check gradients, image backgrounds, transparency, hover, selected, error and focus states as rendered. Composite translucent layers before measurement; do not compare their uncomposited hex values. OKLCH can help explore lightness and chroma, but its L value is not a WCAG contrast score. Gamut mapping can change the final result. Use browser-resolved values and a suitable audited color library for formats a local checker cannot interpret.

Do not encode selection, availability or error solely through hue. Retain a visible label, shape or other redundant cue as well as programmatic state. An unexplained dot beside “Paused” usually repeats the label; a status dot in a dense monitored list may have a useful role. [W3C use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)

## 4. Inspect a controlled comparison

Use the project's own component renderer when available. Otherwise `scripts/color_lab.py INPUT.json --out DIRECTORY` creates an entirely local comparison page and contrast report. Start from [the example input](../assets/color-lab.example.json), replace its copy and palette hypotheses, and render it. The tool intentionally accepts opaque sRGB hex values only. It rejects unsupported values rather than guessing. Its comparison shell is a study surface, not a reusable finished design or proof of aesthetic quality.

The CLI retains artifacts and exits with code 2 if measured pairs or declared brief constraints fail. Repair or reject that option before selection. A passing ratio cannot override an explicit brand or appearance requirement. Warm/cool neutrals remain available when the brief permits them; do not enable strict achromatic checks by habit.

Inspect both narrow and wide views at actual size. Ask: What is noticed first? Can muted text still be read? Does a large surface compete with the action? Does artwork clash with controls? Can selected, focused and failed states be understood without hue? Does the palette retain character across hero, body, form and footer? A monochrome screenshot helps examine emphasis but is not a color-vision simulation.

For a suspected defect, change only that cause: remove the glow, neutralize a tinted surround, reduce repeated brand fills, or alter an unreadable foreground. Preserve both renders and the observation. Keep a treatment that works for the subject; do not promote a local rejection into a universal ban on blue, gradients, shadows, serif type, pills or rounded corners.

Record the chosen direction, role pairs, surface coverage, rejected alternative and reason in DESIGN.md **before** expanding the design. Functional contrast is a floor. Hierarchy, specificity, composition and user acceptance require their own review.
