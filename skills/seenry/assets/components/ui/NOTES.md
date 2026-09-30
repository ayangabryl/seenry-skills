# Reference notes

Research used the Seenry MCP before implementation: `search_sections`, `search_designs`, `search_curated_references`, `get_design_reference`, `get_reference_asset`, and `get_page_motion`. The images below were opened at full size. The downloaded reference files live in `.seenry/refs/`. Imported static images establish visual decisions only; keyboard behavior and timing were specified from native browser semantics and the Seenry motion rules.

| Key | Seenry reference | What was visible | What the kit takes, and why |
| --- | --- | --- | --- |
| V | [Vercel Geist cards and components](https://seenry.design/section/07db4688a7af810a565eac5364091e6c) | Hairline dividers, restrained cards, small controls, neutral text levels. | Compact 6–12px radius family, quiet borders, and no resting shadows. This makes components compose without visual noise. |
| R | [reMarkable input form](https://seenry.design/design/2b7605b4bc24c958c41608177490965a) | An explicit field label, adjacent action, and supporting consent copy. | Labels stay visible above inputs; help/error text occupies its own line. The action keeps the same height as its neighbor. |
| U | [Understory accordion](https://seenry.design/design/1e131c47e55640ec475eb1eee8a383db) | Strong question, readable open answer, and a clear plus/minus affordance. | The summary remains a full-row target; expanded content has enough line height. The kit uses native `details`. |
| T | [Tenor knowledge accordion](https://seenry.design/design/36e0ab58566070a077d04465e2359d7e) | Tighter stacked disclosures with subtle separators and one open answer. | Divider rhythm and restrained disclosure icon. It supports dense product settings. |
| M | [Tines solutions menu](https://seenry.design/design/2bb8f80cd7dfcf27459b0d43e250db26) | A menu attached to its trigger, clear groupings, and row separation. | Floating layers point back to their trigger and use grouped, scan-friendly rows. The compact action menu is a smaller adaptation. |
| A | [Attio captured page](https://seenry.design/page/f73e4f74639e472a8eb81c1757d74891) | Product navigation and a recorded browser motion journey. | Neutral hierarchy and a single clear accent. The recording metadata confirms state changes; it does not establish exact durations. |
| H | [Mercury security page](https://seenry.design/page/04a312264dc14cd4bdfdb89a53729226) | A captured navigation interaction, including a Products disclosure. | Menus and sheets get an origin and a settled resting state. Motion timing follows the Seenry motion floor because the metadata alone cannot establish a reusable duration. |

The searches also returned many marketing sections that did not contain the requested product control. Those were excluded from component anatomy decisions. The matrix below records the 2–3 references considered for each component and the specific decision carried into the kit. Where a reference does not expose a control’s keyboard or state behavior, the native HTML element is the source of behavior.

| Component | References examined | Decision |
| --- | --- | --- |
| Button | V, R, T | V’s restrained small controls and R/T’s clear primary action led to one accent fill, compact secondary borders, and three heights. |
| Input | R, V, A | R’s persistent label and helper line plus V/A’s neutral treatment led to a label-first field with explicit error text. |
| Textarea | R, V, A | The same field anatomy was extended vertically; native resizing is retained for long content. |
| Select | R, V, M | R shows the value beside a field action; V keeps controls compact; M distinguishes a popup from its trigger. Native select remains the accessible choice. |
| Checkbox | V, R, A | The neutral control language carries over; native checked, disabled, and focus states are visibly distinct. Static references did not establish checkbox behavior. |
| Radio group | V, R, A | Field label rhythm plus native grouping guided a legend and stacked descriptions. Static references did not establish arrow behavior. |
| Switch | V, R, A | The selected accent is reserved for the track. Native checkbox semantics and a separate label avoid ambiguous icon-only settings. |
| Segmented control | V, A, M | V’s compact component strip and A/M’s obvious current context led to a solid selected thumb and quiet neighbors. |
| Tabs | V, A, M | Neutral navigation text with one decisive active line; the indicator moves from the prior tab while panels update immediately. |
| Menu / dropdown | M, H, A | M’s grouping and H/A’s trigger relationship led to a small anchored popover with row hover and typeahead. |
| Tooltip | V, M, H | A low-elevation layer attached to its trigger; the content stays short and supplemental. No static image was treated as timing evidence. |
| Dialog | V, R, H | V’s radius hierarchy, R’s focused form, and H’s layer origin led to a centered native modal with distinct title/body/actions. |
| Sheet | V, M, H | The same layer hierarchy extends to an edge-attached surface; phone uses a bottom edge to preserve usable width. |
| Toast | V, R, A | Brief action results use the shared floating surface, not a saturated banner; title and description remain readable. |
| Accordion | U, T, V | U’s full-row question and T’s divider rhythm led to native `details` with an explicit open icon state. |
| Badge / status | V, A, H | Neutral categorization stays quiet; status is a word on a low-intensity tint, with strong color only for exceptions and no leading dot. |
| Avatar / group | V, A, T | Small identity markers follow the same radius and border system; initials are a deliberate fallback, not a decorative placeholder. |
| Card | V, T, R | V’s hairlines and low elevation define the resting card; link cards change border/background on hover. |
| Table | V, A, H | Neutral hierarchy and row separators make values scannable; headers remain sticky and numeric data aligns right. |
| Pagination | V, A, H | Small adjacent controls stay within the same radius family; the current page has a visible border and label. |
| Empty state | V, R, T | Text and one action carry the state; extra illustration was removed because it did not explain the next step. |
| Stat strip | V, A, H | A divided line of figures uses type hierarchy rather than colored KPI cards; changing figures roll in place. |
| Breadcrumb | V, M, A | Navigation remains text-first with quiet separators and a distinct current item. |
| Kbd | V, M, H | The key cap is compact and neutral, so it can sit alongside an action without competing with it. |
| Skeleton | V, A, H | Loading shapes match real content geometry and keep a low-contrast surface; motion stops for reduced-motion users. |
| Command menu | V, M, A | A compact search layer with clearly separated results; keyboard navigation is instant because this action can occur many times a day. |

## Motion decisions

- Hover/press: feedback, 120–160ms, color/opacity or scale .98. The control keeps a static focus and selected state.
- Tabs and segmented controls: state and continuity, 160ms indicator/selection. Panels change without waiting.
- Menu, tooltip, dialog, sheet: orientation, origin at trigger or relevant edge, 200ms layers and 320ms sheet. Escape and repeated input remain responsive.
- Toast: feedback, 200ms enter/exit; timer pauses on hover/focus; stack stays at three.
- Table sorting/filtering: continuity, native View Transitions when available. Keyboard selection and command results do not animate.
- Number: state, 420ms per digit for an in-place figure; reduced motion shows the final value immediately.

All movement is removed under `prefers-reduced-motion: reduce`. No screenshot is used as evidence of exact animation timing.
