# Implement the interface as one system

Use for a polish pass or when layout, type and wording drift between screens. Apply the relevant section to the existing brand and component owners; a small correction is not a rebrand. These are built-in implementation decisions, not a requirement to load another skill collection.

## Layout that survives real content

- Define the reading order before the grid. Keep label, value and related action together in the DOM as well as on screen. Use logical inline/block properties when the relationship follows language direction.
- Let space establish groups before adding borders. If group boundaries remain ambiguous, compare a larger inter-group gap with a quiet surface. Keep separators when they materially improve dense scanning.
- A control needs a recognizable affordance: shape, border, underline, or a consistent action zone. Styling a button like adjacent static copy can erase its purpose.
- Show that hidden content exists through a disclosure control, pagination or a partial next item. Do not rely on a visitor discovering an invisible gesture.
- Collapse at the point content stops fitting. Prefer component container queries for reusable panels. Use `min-width: 0` on flexible children and wrapping for text; reserve fixed geometry for intentionally bounded media and transition stages.
- Test long actual labels, an empty state, dense data, 200% zoom and supported RTL content. Keep critical actions reachable rather than clipped at the bottom of a scroll pane. Use safe-area insets for edge-attached mobile controls.

## Type that remains readable

Use semantic roles backed by the project's loaded fonts and sizes. Prefer `font-weight`, `font-optical-sizing` and `font-variant-numeric` to raw OpenType tags when the property expresses the intent. Confirm that requested weights/styles exist; disabling font synthesis without providing the real face can silently erase emphasis.

Use unitless line height. Start body passages near 1.5 and tune using the typeface and measure; a compact display title is a different role. Inspect headings with `text-wrap: balance` and short descriptions with `text-wrap: pretty` where supported. Keep a fallback that reads normally. Do not apply balancing to every paragraph.

For changing values use tabular numerals and reserve the necessary unit/separator position. For long identifiers use safe wrapping or intentional truncation with a reachable full value. Keep useful content selectable; restrict `user-select: none` to gestures where accidental selection interferes. Check language, mixed-direction values and `<bdi>` where needed.

Test mobile fields at 16px text or the project's verified equivalent to avoid unwanted input zoom. Do not shrink an entire field with a transform just to mimic a desktop size. Preserve visible labels, not placeholder-only fields.

## Wording that describes the real state

Use the canonical brand vocabulary across the trigger, dialog, progress and completion. If the action is Archive, do not call the completion “moved to storage” unless that distinction is real. Match tone to consequences: concise for routine work, explicit for errors, data loss and security.

Name the action in consequential buttons: Delete project / Cancel is clearer than Yes / No. Label settings by what their enabled state does. Describe link destinations sufficiently to distinguish repeated links. Use complete localized messages and pluralization, not concatenated sentence fragments.

Errors name the failed operation and an actionable recovery without blaming the person. Preserve their input. Empty states distinguish first use, an empty search and unavailable data; each gets the appropriate next action. Persistent instructions must not disappear when the empty state gains its first item.

## Finish the control, not just its outline

Check optical centering at actual size, particularly asymmetric icons. Correct the icon's drawing or inner alignment without moving its hit area. For concentric nested surfaces, begin near outer radius minus inset, then inspect unequal padding and border thickness. Use shared depth tokens instead of stacking unrelated inset shadows on every control.

Keep focus visible, labels truthful and targets distinct. Use native semantics or the project's accessible primitives for menus, dialogs and comboboxes. Animation never substitutes for focus management or keyboard behavior.

## Review output

For each supported defect, identify the location, user consequence, shared owner and correction. Verify the changed relationship at ordinary/narrow widths and its relevant states. Report untested behavior as untested. A source-only pass cannot certify wrapping, optical alignment or motion quality.
