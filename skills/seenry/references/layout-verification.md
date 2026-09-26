# Layout verification with development rulers

For UI implementation, keep a development-only alignment overlay available from the first component through whole-page review. Enable it during geometry checks; hide it for optical review. Do not ship rulers to visitors. For a framework with build modes, gate both the overlay import and render on development mode; confirm the production output excludes it. A static prototype can use a local-only debug flag removed from exported output.

## Establish the owners
Before styling, record the content maximum, responsive gutters, grid columns/gaps, spacing scale and radius roles in DESIGN.md. Reuse existing brand tokens. Primary sections share content edges; narrower reading columns, nested radii and deliberate full-bleed art need explicit roles, not arbitrary per-section numbers. A transparent section does not need rounded corners; its filled media surface does. Nested corners normally follow outer radius minus padding, clamped to zero. Buttons, media and panels need not share one radius.

## Instrument and inspect
Provide a toggleable overlay (for example Alt+G) with outer content guides, responsive columns, spacing ticks, and measured bounds. Make the overlay pointer-transparent except its toggle. When inspecting a component show width/height, padding, gap and radius from computed style; inspect its inner content edge as well as its border box. Scope observers to development and clean them up on unmount.

Measure header content, each primary section and footer content at an ordinary desktop width, a wide desktop and a narrow viewport. Compare intended common left/right edges within 1 CSS pixel; treat intentional exceptions as named roles. Repeat after opening menus, switching tabs or expanding content. Check no horizontal overflow. For nested components measure alignment of labels, icons, controls and media rather than only their outer container.

Then turn guides off. Inspect optical centering of icons and glyphs, perceived rather than mathematical spacing, baseline alignment, multi-line wrapping and corner nesting. Record any optical offset locally with its reason; do not move an entire grid to compensate for a single icon. Screenshot and inspect both guided geometry and clean output before calling alignment verified.

## Completion gate
Record viewport sizes, measured shared edges, radius roles, overflow result and any intentional exception. A ruler screenshot alone is not proof of visual quality. Fix unexplained deviations at their shared token/component owner, then recheck representative components and the full page. Do not add a second cascade of per-section values to conceal the first.

## Visible-surface gate
Do not conclude alignment or corner consistency from section bounds or an ancestor's computed radius alone. Identify the first painted descendant (image, iframe, white card, canvas) and measure its visible edge against adjacent toolbar, caption and action edges. Inspect padding, transparent gutters, child backgrounds and clipping at every intervening wrapper. A rounded transparent ancestor with an inset square child can still look square. Check actual screenshot corners at readable scale in every relevant tab/viewport state. A deliberately centered device preview is a documented exception to edge alignment, not an exception to its surface-radius rule. Report which painted surfaces were inspected; uninspected states remain unverified.

## Included source
Use the bundled [layout-guide source and integration contract](../assets/layout-guides/README.md) rather than describing an overlay without implementing it. Adapt selectors and tokens to the host. This source is React; other frameworks retain the same measurements, toggle and cleanup contract. The geometry and optical completion gates above remain required.

## Checker and spacing inspection

Use the optional development-only checker overlay to compare padding and gaps against the project's spacing unit. The supplied template uses 8px as an example; adapt it to actual tokens rather than imposing 8px on every brand. Alt+C toggles checks; Alt+G toggles guides. Ignore typing fields. Keep the overlay pointer-transparent and exclude it from production.

Inspect shared left/right edges, image aspect ratios, caption baselines, selected controls and locked variants together. The hover label reports computed padding and gap; an inner dashed edge reveals the content box. Check desktop and mobile, long labels, populated and loading states. Optical adjustments are allowed when recorded; a checker is a diagnostic aid, not proof of good composition.
