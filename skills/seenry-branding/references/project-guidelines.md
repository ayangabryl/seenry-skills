# Turn the selected identity into usable project rules

Use when creating or codifying brand guidelines or maintaining a substantial project. MCP is optional; supplied decisions, implementation and local assets suffice. Unresolved identity choices remain provisional.

## Establish one source of truth

Inspect existing brand docs, tokens, font/asset manifests and shared components. Preserve their naming and format. If no guideline exists, create `BRAND.md` linked from `DESIGN.md`; the [authoring outline](../assets/BRAND.example.md) is optional. Do not create a second token store or rebrand a working product while documenting it.

For a new identity, use the main art-direction workflow to test a direction before settling its rules. For codification, derive rules from supplied standards and actual uses; expose contradictions without inventing rationale. Distinguish inherited requirements, author-selected proposals, implementation and user acceptance. Record version/date and unresolved conflicts.

## Write decisions people and agents can apply

| Area | Useful project rule |
| --- | --- |
| Positioning and language | Who it serves, what is true, intended character; actual action, error and recovery wording examples. |
| Marks | Real asset paths, variants and applicable surfaces; declared clear space, minimum sizes and partner use when relevant. If unspecified, propose and test rules rather than claiming official measurements. |
| Color | Link actual semantic tokens; explain canvas, text, action and state roles, permitted pairings and supported appearances. Record tested foreground/background pairs. Separate identity artwork color from UI status. |
| Typography | Link selected font files/licensing; semantic roles, weights, sizes/line heights, measures and responsive behavior; required scripts, numerals and fallback. Examples do not prescribe the same fonts for every project. |
| Composition and controls | Grouping, alignment, density, spacing and corner relationships; link shared component usage contracts below. Let task and content determine the layout. |
| Material | Actual imagery, crop/focal rules, icon family/weight, illustration or graphic relationships; asset ownership and replacement status. |
| Motion | Link the relevant motion contract: trigger, anchor, transition/result, interruption and reduced-motion equivalent. Distinguish observed behavior from proposed timing. |

Omit inapplicable sections and design-term definitions. Existing tokens/components own values; the guide explains their roles and links to them. Check repeated values when their source changes. Do not invent CMYK/Pantone equivalents, font coverage, accessibility passes or licensing.

For consequential shared components, make the usage contract explicit in existing docs: semantic purpose; actual source path/export and relevant props; allowed variants and when to choose each; interaction states, keyboard/focus behavior and component-versus-host state ownership; responsive behavior and relevant motion/reduced-motion rules. Pair a valid use with a contextual misuse and any scoped exception. Link this contract rather than duplicating API documentation.

For example, if a project's primary button emphasizes a task's next step, name its actual API, task-group scope and pending/result owner. Using it to decorate an unrelated section would obscure that meaning. A dense row and an expressive hero can share its behavior. Peer actions in a comparison may justify an exception; do not turn one example into a universal button count or page template.

For a small codification, roughly 300–600 words is a useful starting size. Group missing decisions and verification limits once. DESIGN.md links the guide/version and records task-specific exceptions. Add detail for real variants and applications, not boilerplate chapters.

## Demonstrate, then maintain

Show implemented expressive and dense/utilitarian applications when the project contains both, including relevant appearances and decisive states. Necessary focus, boundaries and feedback remain visible; “clean” does not mean removing useful information.

When a visual guideline is requested, build an inspectable page using the existing stack, tokens, fonts and components. Separate navigation, explanation and specimens; give readers room to compare applications at ordinary and narrow widths. Booklet references inform documentation layout. Do not publish a development guide as customer-facing content by default.

Give later agents the guide path/version, relevant rule content, component APIs and selected captures. A restricted context needs the excerpt itself. Preserve unrelated rules during local changes. Record exceptions and scope; update shared sources and the guide together when a brand decision changes. Recheck affected representative uses with [design continuity](../../seenry/references/design-continuity.md), font loading, state contrast and interaction evidence. Report authored, implemented and verified coverage separately.

For reference-study examples, read [guideline observations](guideline-observations.md) only when comparing documentation or resolving a rule. No library connection is needed to apply the method.
