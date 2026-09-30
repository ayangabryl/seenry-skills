# Research notes

The Seenry MCP was searched with `search_sections`, `search_designs`, `search_curated_references`, and `get_page_motion`. I inspected the pixels of the references below. These are visual references for density, hierarchy, contrast, and layer placement. Most niche controls in this brief did not have exact interaction captures in the library (`slide to confirm`, `hold to delete`, `combobox`, `one-time code`, `dropzone`, `range slider`, and `context menu` returned no exact imported section result). Their behavior follows the brief, native semantics, and local keyboard/pointer testing. I did not inspect or copy component library source.

| Key | Seenry reference | Observed quality used |
| --- | --- | --- |
| A | [Tines solutions menu](https://seenry.design/design/2bb8f80cd7dfcf27459b0d43e250db26) | A single anchored surface, obvious grouping, thin dividers. Kept the layer; left out the illustration and bright brand field. |
| B | [Flamingo Estate navigation drawer](https://seenry.design/design/af07169ef32d6749521db7e14e3668cc) | Stable backdrop, clear close affordance, row rhythm. Used the structure for stacked drawers; left out the editorial typography. |
| C | [Whalesync data sync dashboard](https://seenry.design/design/2d9aa2f7ae038d6b1f90e6c505294379) | Specific row status, compact search, readable history, small status dots. Used the hierarchy for feedback and data components; avoided bright borders. |
| D | [reMarkable input form](https://seenry.design/design/2b7605b4bc24c958c41608177490965a) | Input and action share a height and the label stays explicit. Used the field relationship; omitted the marketing copy and dark page field. |
| E | [V7 transparent pricing](https://seenry.design/design/b0ed329c25426985611704589b24852d) | Strong price emphasis and separated choice areas. Used the price hierarchy; left out the orange field and illustrations. |
| F | [Tines pricing](https://seenry.design/design/2c9401268508f7ade511306d5ad493eb) | Cards make plan distinctions legible. Used the selection clarity; left out the purple field. |
| G | [Notion Calendar](https://seenry.design/design/49926871f6b6ff61ac2717879754ecea) | Dense dates remain structured and scanning is fast. Used two-month alignment, not its marketing treatment. |
| H | [Radical Face audio](https://seenry.design/design/1433691cf1271302464786e38c18bc01) | A media control belongs with its title and exact time context. Used restraint around the waveform; left out record imagery. |
| I | [Tabs cashflow](https://seenry.design/design/d4cc50c7d15c95e1ba686a67fe296c7d) | Plain navigation and one dominant action. Used for a quiet tab bar and button hierarchy. |

The [Stripe home recording](https://seenry.design/page/edbb225b221e486abb324e54280b4933) was inspected through `get_page_motion` for capture coverage and cadence. Its metadata confirms a recorded page walkthrough, but does not prove timing for these 32 components. Motion timings below are a proposed treatment from the Seenry motion guide and were checked locally.

| Component | References inspected | What transferred |
| --- | --- | --- |
| Slide to confirm | C, D | Consequence copy sits next to a clear action; track remains a simple field. |
| Hold to delete | C, D | Status stays in place; a filled surface communicates progress. |
| Status island | C, I | A small status dot and one short label carry the collapsed state. |
| Morphing action button | D, I | One primary action surface carries all outcomes. |
| Overflow tabs | I, C, A | Simple selected underline and a More layer anchored to the tab row. |
| Expanding search | C, D | Search remains a single quiet field. |
| Hover card | A, B | Preview is a floating layer tied to its anchor. |
| Context menu | A, B | Compact rows, distinct hierarchy, contained submenu. |
| Combobox | D, C | Explicit label and thin field border; results appear directly below. |
| One-time code | D, C | Equal control geometry, clear text error. |
| Password field | D, C | Field and guidance stay together; strength remains quiet. |
| Copy button | C, D | In-place status replaces the original action label. |
| Share button | A, D | Fallback is a short anchored menu. |
| Tag input | D, C | Labels look like removable data, not decoration. |
| Inline edit | C, D | Editing happens at the same reading position. |
| Reorderable list | C, B | Row boundaries and the handle clarify what can move. |
| File dropzone | D, C | File progress is per row and errors use words. |
| Date range picker | G, C | Month columns share a seven-day grid and quiet range fill. |
| Range slider | E, C | Values stay readable beside controls. |
| Number stepper | D, E | Input and buttons form one compact control. |
| Undo toast | C, A | Reversal stays inside the action feedback. |
| Promise toast | C, I | One status surface changes in place. |
| Reading progress | H, C | Thin progress indicator stays out of content. |
| Waveform player | H, C | Waveform and exact time share one line. |
| Uptime bar | C, G | Dense daily data with detail available on focus. |
| Sparkline | C, E | Compact trend plus an exact reading on hover. |
| Stacked drawer | B, A | Backdrop, clear close, and a visibly related second layer. |
| Image hotspots | G, B | Points are sparse and annotations stay within the media. |
| Pricing toggle | E, F | Price is dominant; the choice remains adjacent. |
| Radio cards | F, E | Selected card uses a decisive border. |
| Status picker | C, A | Presets form a compact anchored menu with a dot. |
| Autosave status | C, D | Status and time live directly below the edited field. |
