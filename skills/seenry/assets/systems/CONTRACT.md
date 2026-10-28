# System contract

Every system in this folder restyles the same markup. A screen built with one system switches to another by changing two stylesheet links, so the choice of system is a design decision, never a rewrite.

## Files

```
systems/<name>/
  SYSTEM.md        character, when to use it, rules, page shell, icon set, charts
  tokens.css       the system's values, light and dark
  system.css       restyles every component below; loaded after seenry-ui.css
  blocks/
    dashboard.html     overview with stats, one chart, a queue or list, a table
    list-detail.html   a filterable list with the selection open beside it
    settings.html      grouped settings with fields, switches, selects and a danger zone
  preview.png      dashboard.html at 1440 x 900, light or the system's default theme
```

Each block loads, in order: the Google Fonts link the system names, `../../../components/ui/seenry-ui.css`, `../tokens.css`, `../system.css`, the icon set from the pinned CDN URL in [icons](../icons/README.md), and `../../../components/ui/seenry-ui.js`. Blocks open from disk with no build step.

## Tokens

`tokens.css` sets every variable `seenry-ui.css` reads, in `:root` for the default theme and in `[data-theme=dark]` / `[data-theme=light]` for the other, plus the dark preference query when the default is light (or the light one when the default is dark):

`--font --bg --surface --surface-2 --hover --line --line-strong --text --text-2 --text-3 --accent --accent-hover --accent-subtle --on-accent --focus --ok --ok-bg --warn --warn-bg --bad --bad-bg --info --info-bg --r-sm --r-md --r-lg --t-fast --t-base --t-layer --ease-out --ease-in-out --shadow-float`

and the system's own scale, with these names so the gate and other skills can read any system:

- Type: `--type-title --type-heading --type-body --type-label --type-small --type-stat` as `font` shorthands (weight size/leading family), at most seven steps in all. `--font-mono` when the system uses one.
- Space: `--space-1` to `--space-8` on the 4px scale (4, 8, 12, 16, 20, 24, 32, 48 or the system's own subset).
- Shell: `--sidebar-w --topbar-h --row-h --control-h --content-max --gutter`.
- Charts: `--chart-1` to `--chart-5`, `--chart-grid`, `--chart-axis`.

No value is typed in `system.css` or a block; every size, color, radius and duration comes from a token.

## Components

`system.css` styles all of the seenry-ui classes (`ui-button ui-field ui-select ui-choice ui-switch ui-segmented ui-tabs ui-menu ui-tooltip ui-dialog ui-sheet ui-toast-stack ui-accordion ui-badge ui-avatar ui-card ui-table-wrap ui-pagination ui-empty ui-stat-strip ui-breadcrumb ui-kbd ui-skeleton ui-command`, with the markup and data attributes in [the seenry-ui README](../components/ui/README.md)) and adds these app classes, which every system must provide:

| Class | What it is |
| --- | --- |
| `ui-shell` | grid of sidebar and main, full height; collapses to a top bar with a menu button under 768px |
| `ui-sidebar`, `ui-sidebar-head`, `ui-sidebar-foot` | the side navigation column, its workspace switcher row and its bottom row |
| `ui-nav`, `ui-nav-label`, `ui-nav-item` (`aria-current="page"` for the active one), `ui-nav-count` | navigation groups, their label, items with an icon and an optional count |
| `ui-topbar` | the bar above the page: breadcrumb left, search and actions right |
| `ui-page-header`, `ui-page-title`, `ui-page-sub`, `ui-page-actions` | the one h1 of the page, its supporting line and its actions |
| `ui-section`, `ui-section-head` | a titled group on the page |
| `ui-list`, `ui-list-item`, `ui-list-meta` | a list of rows with an icon or avatar, a name, meta text and a trailing value or action |
| `ui-filter-bar` | search, filter chips or segmented control, and a count, above a table or list |
| `ui-status` with `data-status="ok|warn|bad|info|idle"` | a status word with a small mark, never color alone |
| `ui-chart`, `ui-chart-legend`, `ui-chart-axis` | a chart frame drawn with inline SVG using the chart tokens; the block draws the marks |
| `ui-detail`, `ui-detail-head`, `ui-detail-row` | the selection panel of list-detail: title, key facts as label and value rows |
| `ui-settings-group`, `ui-settings-row` | a settings group and a row of label, help text and control |
| `ui-danger` | the separated zone for destructive actions |

## SYSTEM.md

In this order, plain and short:

1. **Character** in two sentences, and **use it for** / **not for** (kinds of products and moods).
2. **Values at a glance**: fonts, the type steps with sizes, the surfaces, radius, row and control height, the accent and what it means.
3. **Rules**, eight to twelve, each written `MUST` / `NEVER` / `SHOULD`, a one-line *Because*, then a correct and a wrong snippet.
4. **Page shell**: how a screen is framed with the classes above.
5. **Icons**: the set from [icons](../icons/README.md), its style (stroke width, size, fill), and how icons sit beside text.
6. **Charts**: which chart forms the system draws and how (bars, lines, stacked bar), always the conventional form for the job.
7. **What it never does**: the slop this system is most at risk of.

## Quality

- Every block renders at 1440 and 390 with no horizontal scroll, every text at 4.5:1 (3:1 for 18px and up), every control at least 24px with 44px touch targets on phones.
- Data is believable and specific to a product the system fits; no lorem ipsum, no "Acme".
- Charts are the conventional form for their job and read correctly at a glance.
- At most one filled primary action per view.
- The six systems must look clearly different from each other at a glance: type, surface, radius, density, accent and icon set all differ.
