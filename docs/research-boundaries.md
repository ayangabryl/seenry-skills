# Research and implementation boundaries · 10 September 2026

This update makes reference retrieval optional, teaches context-specific color decisions and adds a local controlled comparison. Sources are linked in the color, HCI and motion guides. The guides are original summaries and applications, not copied books, design packs or redistributed reference screenshots.

## Competitor spot-check

This is an entrypoint/README inspection, not a performance ranking or exhaustive repository audit. Freeze these versions for any later matched experiment.

| Source / revision | Observed scope and relevant approach | Implication for evaluation |
| --- | --- | --- |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill/blob/ccbc15639c97057cbfcf32ecebc38ef716e4bb37/skills/taste-skill/SKILL.md) · `ccbc156` | Its primary entrypoint focuses on landing pages, portfolios and redesigns. It infers audience and context before choosing a direction, with configurable variance, motion and density. | Compare landing-page results within that scope. Contextual guidance itself is not unique to Seenry. |
| [Impeccable](https://github.com/pbakaus/impeccable/blob/67d018fe052853c104a96d441ce175dd5ec4c39d/skill/SKILL.src.md) · `67d018f` | It includes product/design context, command-specific playbooks, bounded browser review and a standalone launcher. Its entrypoint also provides a direct-context fallback when the launcher is unavailable. | Tooling, product truth and graceful fallback already exist in a competitor; demonstrate actual decision quality instead of claiming architectural novelty alone. |
| [Open Design](https://github.com/nexu-io/open-design/blob/712b0db974e87867c996366aa689bf4aed604f94/README.md) · `712b0db` | The repository describes a broader design application with multiple agent runtimes, previews and design-system workflows, including bring-your-own-provider options. | Distinguish an application/runtime comparison from a single skill comparison. Do not say it always requires a paid subscription. |

Seenry's intended advantage is the quality of selected outcomes: task-specific alternatives, coherent visual roles, complete behavior and useful observed repairs. This update adds concrete support for those decisions. It does not establish a win against these projects; use the matched evaluation protocol and retain failures.

## No-MCP evidence

Package tests remove the server contract and lookup guide from a relocated installation and compile every local stage with motion/assets support. A standard-library color tool runs without network access and outputs self-contained HTML. Browser verification should separately record offline mode, external requests, viewport and interaction checks.

A tool-free Flash palette trial tests a narrower question: can the supplied local guidance produce measurable role palettes while preserving the brief? It is not a website benchmark or evidence that skill instructions alone caused a performance improvement. Capture the prompt, configured model, tool trace, generated values, role-pair audit and rendered review separately. Ambient host context is a limitation unless independently isolated.

The initial trial exposed unsupported comfort claims and counterexamples that listed generic problems avoided. These are reasoning failures even when contrast passes. The guide now asks for observable explanations and a context where the proposed treatment itself fails. Preserve the original model answers; do not silently rewrite them into a successful result.

A follow-up explanation trial improved the counterexamples but introduced a blue action in an explicitly achromatic brief. It therefore failed brief compliance. The color lab now accepts host-specified achromatic roles and flags a colored action even when its text contrast passes. These constraints are derived from the user's brief before generation. They are not a universal ban on color or proof that a passing design is premium.
