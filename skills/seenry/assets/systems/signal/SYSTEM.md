# signal

## Character

Sharp, dense and quiet: a near-black blue-grey console where data carries the screen and one cobalt accent marks what is live, focused or the next action. It reads like infrastructure built by people who run it at 3am.

**Use it for** deploy platforms, observability and log consoles, data pipelines, queues and schedulers, security and access tooling, developer CLIs with a web surface.
**Not for** consumer apps, marketing pages, editorial reading, finance back offices that want warmth, anything that needs illustration or brand color.

## Values at a glance

| | |
| --- | --- |
| Fonts | Geist for prose and controls; Geist Mono (`--font-mono`) for IDs, SHAs, timestamps, metrics, units and labels |
| Type | title 600 20/28 · heading 600 14/20 · body 400 14/20 · data mono 400 13/20 · label mono 500 12/16 · small 400 12/16 · stat mono 500 24/32 |
| Surfaces (dark, default) | bg `#0b0e12` → surface `#11151a` → surface-2 `#171c22`; hover `#1d232a`, selected `#1a2436`; hairlines `#232a32` / `#38424d` |
| Surfaces (light) | bg `#f5f6f8` → surface `#fff` → surface-2 `#f0f2f5`; hover `#e9ecf0`, selected `#e3e9f6`; hairlines `#dfe3e8` / `#c3cad3` |
| Radius | 2px on everything; 4px only on dialogs |
| Density | 32px rows and controls, 48px top bar, 232px sidebar, 24px gutter (16px on phone) |
| Accent | cobalt `#2f62ff` (light `#1f4fe0`): the primary action, live and in-progress state (deploying, progress bars), the focused chart series, focus rings, pressed chips and checked controls. Nothing else; the current nav item and selected rows use the neutral `--selected` tint. |
| Status | ok green, warn amber, bad red, idle grey; always a 6px square mark plus a word |

Default theme is dark. Without an attribute a light OS preference switches it; the blocks pin `<html data-theme="dark">` because the product ships dark, and `data-theme="light"` forces light.

## Rules

1. **MUST** set identifiers, timestamps, metrics and units in mono. *Because* operators scan and compare these; fixed-width digits align and IDs read as copyable.
   ```html
   <td class="mono">9c2e71b</td><td class="num">142 ms</td>     <!-- right -->
   <td>9c2e71b</td><td>142ms</td>                              <!-- wrong -->
   ```
2. **MUST** keep the accent for one primary action per view, live state and the focused series. *Because* in a console the accent means "act here" or "this is moving"; spent on decoration it stops meaning anything.
   ```html
   <button class="ui-button" data-variant="primary">Deploy</button><button class="ui-button">Logs</button>
   <button class="ui-button" data-variant="primary">Deploy</button><button class="ui-button" data-variant="primary">Logs</button>
   ```
3. **MUST** write status as a mark plus a word with `ui-status` and `data-status`. *Because* color alone fails color-blind operators and grayscale screenshots in incident docs.
   ```html
   <span class="ui-status" data-status="warn">Degraded</span>
   <span class="dot-amber"></span>
   ```
4. **MUST** use `data-live` only on something that is changing now (building, deploying, streaming). *Because* the pulse is the one motion on the screen and should mean "in progress".
   ```html
   <span class="ui-status" data-status="info" data-live>Building</span>
   <span class="ui-status" data-status="ok" data-live>Healthy</span>
   ```
5. **NEVER** round corners past `--r-sm`, or use pills. *Because* the square edge is the system; one 12px card makes it look like a different product.
   ```css
   .panel{border-radius:var(--r-sm)}
   .panel{border-radius:12px}
   ```
6. **MUST** separate with hairlines, not shadows or tints. Shadows are only for floating layers (`--shadow-float`). *Because* dense screens need structure that costs no space and no contrast.
   ```css
   .ui-card{border:var(--hair) solid var(--line)}
   .ui-card{box-shadow:0 4px 12px rgba(0,0,0,.3)}
   ```
7. **SHOULD** keep rows at `--row-h` (32px) on desktop; the system raises them to 44px under 768px. *Because* operators compare many rows at once, while fingers need room.
   ```css
   .ui-table td{height:var(--row-h)}
   .ui-table td{height:56px}
   ```
8. **MUST** label lines at their end with series and last value, and units on the axis. *Because* a legend far from the data makes people match colors; an end label answers "what is it now".
   ```html
   <span data-series="1" style="top:58%">p95 <b>168</b></span>
   <p>Blue = p95, grey = p50 (see legend)</p>
   ```
9. **NEVER** give a stat, heading or section an icon. Icons go on navigation, actions and status rows. *Because* icons on headings are decoration and slow the scan.
   ```html
   <dt>p95 latency</dt>
   <dt><i class="ri-timer-line"></i> p95 latency</dt>
   ```
10. **MUST** type every size, color and duration as a token. *Because* a second system swaps by link; typed values break the swap.
    ```css
    padding:var(--space-3) var(--space-4)
    padding:12px 16px
    ```
12. **NEVER** mark the current nav item, a selected row or a pressed option with a side rail. Use the `--selected` surface tint. *Because* a coloured left bar is the most generated-looking detail in admin UI; the tint reads as state without drawing a line.
    ```css
    .ui-nav-item[aria-current=page]{background:var(--selected)}
    .ui-nav-item[aria-current=page]{box-shadow:inset 2px 0 0 var(--accent)}
    ```
11. **SHOULD** write labels in sentence case, never uppercase tracked eyebrows. *Because* mono already marks a label; uppercase on top reads as a template.
    ```html
    <span class="ui-nav-label">Configuration</span>
    <span class="ui-nav-label">CONFIGURATION</span>
    ```

## Page shell

```html
<div class="ui-shell">
  <aside class="ui-sidebar" id="sidebar">
    <div class="ui-sidebar-head">mark · workspace · switcher</div>
    <nav class="ui-nav"><span class="ui-nav-label">payments-core</span><a class="ui-nav-item" aria-current="page"><i class="ri-…-line"></i>Overview<span class="ui-nav-count">7</span></a></nav>
    <div class="ui-sidebar-foot">account</div>
  </aside>
  <div>
    <header class="ui-topbar">
      <button class="ui-button" data-variant="ghost" data-icon data-nav-toggle aria-controls="sidebar" aria-label="Open navigation"><i class="ri-menu-line"></i></button>
      <nav aria-label="Breadcrumb"><ol class="ui-breadcrumb">…</ol></nav>
      <div class="ui-topbar-actions"><button class="ui-topbar-search">…</button> bell</div>
    </header>
    <main>
      <div class="ui-page-header"><div><h1 class="ui-page-title"></h1><p class="ui-page-sub"></p></div><div class="ui-page-actions"></div></div>
      <section class="ui-card"><div class="ui-section-head"><h2>Latency and errors</h2>…</div> body </section>
      <section class="ui-section"><div class="ui-section-head">…</div><div class="ui-table-wrap">…</div></section>
    </main>
  </div>
</div>
```

- The column beside the sidebar is any element; `main` inside the shell gets the gutter, the 24px rhythm and `--content-max`. No wrapper classes.
- A **panel** is a `ui-card` whose first child is a `ui-section-head`: the head sits flush with a hairline under it, every other child is inset 16px, and a `ui-list`, `ui-table-wrap`, `ui-timeline`, `ui-tabs` or `<footer>` runs edge to edge.
- The breadcrumb names the environment (`workspace / project / environment`); the h1 names the page.
- Under 768px the sidebar becomes a drawer: seenry-ui.js toggles `data-nav-open` on `.ui-shell` from the `[data-nav-toggle]` button, closes it on outside click and Escape, and returns focus. Only the last breadcrumb shows, grids stack, page actions fill the width, rows and controls grow to 44px.

### Layout helpers (signal only)

Four grids the contract has no class for. They carry no colour or type, so another system can drop them for its own.

| Class | Layout |
| --- | --- |
| `signal-split` | 2fr beside 1fr (chart beside a queue, usage beside plan) |
| `signal-pane` | list beside a 440px `ui-detail` (list-detail) |
| `signal-detail` | main column beside a 440px facts column (one record on its own page); each child is a 16px stack |
| `signal-narrow` | an 880px column (settings, onboarding) |
| `signal-stack` | a 16px vertical stack; 20px inside a card |
| `signal-options` | a radio group drawn as bordered rows, the checked row tinted (onboarding questions) |
| `signal-providers` | the stacked SSO buttons in `ui-auth` |

App-level parts that are not contract classes but every block uses: `ui-topbar-actions`, `ui-topbar-search`, `ui-filter-count`, `ui-detail-row` children of `ui-data-list`, and the chart parts `ui-chart-plot`, `ui-chart-y`, `ui-chart-tags`, `ui-chart-title`, `ui-chart-note`.

## Icons

Remix Icon, line style only, 16px, from `https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css` (Apache-2.0). Write `<i class="ri-server-line"></i>`; never mix `-fill`. Icons sit 8px before their label on one center line and take the row's text color: `--text-3` at rest, `--text` when current, the status color on status rows (`<i data-tone="warn">`). Icon-only buttons carry `aria-label`.

## Charts

Inline SVG with `viewBox="0 0 720 100" preserveAspectRatio="none"`; strokes use `vector-effect:non-scaling-stroke`, labels are HTML so they never stretch. Structure: `.ui-chart` › `.ui-chart-legend` › `.ui-chart-plot` (y labels · svg · end tags) › `.ui-chart-axis`.

- **Latency or rate over time:** lines. p95 is the focused series (`.s1`, accent, 2px); p50 and others are grey (`.s2`, `.s3`, 1.5px). Gridlines at round values, units on the top y label, end tags with the last value.
- **Counts per interval (errors, jobs):** bars, one per bucket, grey (`.bar`); buckets over the alert threshold use `.bar.hot` with a dashed `.threshold` line labelled in the tag column.
- **Shared time axis:** stack latency above errors in one panel; both use the same x scale. Deploys and rollbacks are a dashed `.marker` with the short SHA in `.ui-chart-note`.
- **Usage against a limit:** `ui-meter`, never a gauge. Grey under the warning line, amber over it, red over the limit.
- **Composition (status codes, regions):** stacked bars over time with `--chart-1…5`. No pies, donuts, gauges, area gradients or 3D.

## What it never does (anti-slop)

The slop signal is most at risk of, in the order it shows up:

- Terminal cosplay: glow, gradients, glass, neon green on black, scanlines, blinking cursors, ASCII art, `> prompt` copy.
- A coloured left rail on the current nav item, the selected row or an alert. State is a surface tint; alerts are a tinted surface with a coloured icon.
- More than one blue thing competing: accent links in body copy, accent icons, accent badges, a second filled button.
- Rounded cards, pill badges and status chips, soft shadows under panels, circular avatars.
- Uppercase tracked eyebrows, numbered sections (`01 /`), icons on stats and headings.
- A KPI row of four identical cards with a sparkline in each, or green and red arrow deltas under every figure. Three figures in one strip, each against its target, and one chart that answers the question.
- Shaded threshold regions. A threshold is a dashed line with its value; only the buckets that break it turn red.
- Made-up precision (`99.99999%`), round fake numbers (`1,000 users`), placeholder names (Acme, John Doe), lorem ipsum. Use real-shaped IDs, SHAs, regions and UTC times.
- Status as colour alone, or a status dot with no word.
- Gauges, donuts and pies for anything; a progress bar for usage (that is a meter).
- Hero-sized empty states with illustrations. An empty state is one icon, one line of what happened, one line of why, one action.

## Component index

Every class the system styles, with the smallest markup that renders it. `gallery.html` shows each one in its states.

| Class | What it is | Markup |
| --- | --- | --- |
| `ui-button` | action; `data-variant` primary, ghost, danger; `data-size` sm, lg; `data-icon` | `<button class="ui-button" data-variant="primary">Deploy</button>` |
| `ui-field`, `ui-label`, `ui-help`, `ui-error` | labelled field with help and error | `<label class="ui-field"><span class="ui-label">Name</span><input class="ui-input"></label>` |
| `ui-input`, `ui-textarea`, `ui-select` | text, long text, native select; add `mono` for identifiers | `<input class="ui-input mono" value="api-gateway">` |
| `ui-control`, `ui-affix` | input with a leading icon or a unit | `<span class="ui-control"><input class="ui-input"><span class="ui-affix">s</span></span>` |
| `ui-combobox` | native `<input list>` with a datalist | `<label class="ui-field ui-combobox"><span class="ui-label">Root</span><input class="ui-input" list="d"><datalist id="d">…</datalist></label>` |
| `ui-choice`, `ui-radio-group` | checkbox or radio with its label | `<label class="ui-choice"><input type="checkbox"><span>Failed</span></label>` |
| `ui-switch` | immediate on/off | `<label class="ui-switch"><input type="checkbox" role="switch"><span>Autoscale</span></label>` |
| `ui-slider` | range with its value; `--value` sets the fill | `<label class="ui-slider"><span class="ui-label">Max</span><input type="range" style="--value:50%"><output>8</output></label>` |
| `ui-segmented` | view setting, one of a few | `<div class="ui-segmented" aria-label="Range"><button aria-pressed="true">6h</button>…</div>` |
| `ui-chip` | filter chip, `aria-pressed`, optional count | `<button class="ui-chip" aria-pressed="true">Failed <span>3</span></button>` |
| `ui-tabs`, `ui-tab-panel` | panels at one level | `<div class="ui-tabs" role="tablist"><button role="tab" aria-selected="true">…</button></div>` |
| `ui-filter-bar`, `ui-filter-count` | search, filters and a count above a list | `<div class="ui-filter-bar">…<span class="ui-filter-count">8 of 214</span></div>` |
| `ui-breadcrumb` | where you are; last item is text | `<ol class="ui-breadcrumb"><li><a>ledgerline</a></li><li aria-current="page">production</li></ol>` |
| `ui-pagination` | pages of a table | `<nav class="ui-pagination"><button aria-current="page">1</button>…</nav>` |
| `ui-steps`, `ui-step` | stepper; `data-done`, `aria-current="step"` | `<ol class="ui-steps"><li class="ui-step" data-done>Connect</li><li class="ui-step" aria-current="step">Choose</li></ol>` |
| `ui-kbd` | a real shortcut | `<span class="ui-kbd">⌘K</span>` |
| `ui-menu` | popover menu | `<div class="ui-menu" role="menu" popover="auto"><button role="menuitem">Roll back</button></div>` |
| `ui-tooltip` | supporting text on hover or focus | `<div class="ui-tooltip" role="tooltip" popover="manual">Kept 14 days.</div>` |
| `ui-dialog` | modal task | `<dialog class="ui-dialog"><div class="ui-dialog__head"><h2>Delete?</h2></div>…</dialog>` |
| `ui-sheet` | side panel dialog | `<dialog class="ui-sheet"><div class="ui-sheet__content">…</div></dialog>` |
| `ui-toast-stack`, `ui-toast` | brief result, from `SeenryUI.toast()` | `<button data-toast-message="Saved">Save</button>` |
| `ui-command` | ⌘K command menu | `<dialog class="ui-command"><input type="search"><div class="ui-command__list">…</div></dialog>` |
| `ui-alert` | inline banner; `data-status` ok, warn, bad, info | `<div class="ui-alert" data-status="warn"><i class="ri-error-warning-line"></i><p>…</p><button class="ui-button" data-size="sm">Fix</button></div>` |
| `ui-status` | state as mark plus word; `data-live` pulses | `<span class="ui-status" data-status="warn">Degraded</span>` |
| `ui-badge` | short category; `data-tone` | `<span class="ui-badge" data-tone="warn">SEV-2</span>` |
| `ui-skeleton` | known shape loading | `<span class="ui-skeleton" style="width:60%"></span>` |
| `ui-empty` | nothing here yet | `<div class="ui-empty"><i class="ri-stack-line"></i><h3>No services yet</h3><p>…</p><button class="ui-button">…</button></div>` |
| `ui-meter`, `ui-progress` | label, number and a 4px bar: `<meter>` for usage, `<progress class="ui-progress">` for work | `<div class="ui-meter"><span>Bandwidth</span><span><b>3.1</b> / 5 TB</span><meter max="5" high="4.5" optimum="0" value="3.1"></meter></div>` |
| `ui-avatar`, `ui-avatar-group` | square initials or photo | `<span class="ui-avatar" aria-label="Mara Okafor">MO</span>` |
| `ui-card` | grouped content; a panel when it opens with `ui-section-head`; `data-link` for a link card | `<section class="ui-card"><div class="ui-section-head"><h2>Alerts</h2></div><ul class="ui-list">…</ul></section>` |
| `ui-stat-strip`, `ui-stat` | up to three figures; an optional `<meter>` under the number draws budget or capacity across the tile; the second line states the target, never a coloured arrow | `<dl class="ui-stat"><dt>p95</dt><dd>168<span>ms</span></dd><meter max="100" low="25" high="50" optimum="100" value="81"></meter><small>SLO 250 ms · 81% of budget left</small></dl>` |
| `ui-data-list` | label and value pairs | `<dl class="ui-data-list"><dt>Commit</dt><dd class="mono">9c2e71b</dd></dl>` |
| `ui-list`, `ui-list-item`, `ui-list-meta` | rows with icon, name, meta, trailing value; `aria-selected` | `<li class="ui-list-item"><i class="ri-git-commit-line"></i><div><strong>…</strong><span class="ui-list-meta">…</span></div><span>14:19</span></li>` |
| `ui-timeline`, `ui-timeline-item` | who, what, when | `<li class="ui-timeline-item"><i class="ri-arrow-go-back-line"></i><div><p><strong>Dani</strong> rolled back</p></div><time>13:35</time></li>` |
| `ui-code` | inline code, or a block with a header and copy button | `<div class="ui-code"><header><span>stderr</span><button data-copy>…</button></header><pre>…</pre></div>` |
| `ui-table-wrap`, `ui-table` | sortable records; `num` columns; `aria-selected` row; `data-optional` on a column's cells hides it under 768px | `<div class="ui-table-wrap"><table class="ui-table" data-ui-table>…</table></div>` |
| `ui-accordion` | optional detail | `<details class="ui-accordion"><summary>Why?</summary><div class="ui-accordion__body">…</div></details>` |
| `ui-chart`, `ui-chart-legend`, `ui-chart-axis` | chart frame; the block draws the marks | see Charts |
| `ui-shell`, `ui-sidebar`, `ui-sidebar-head`, `ui-sidebar-foot` | app frame and side column | see Page shell |
| `ui-nav`, `ui-nav-label`, `ui-nav-item`, `ui-nav-count` | navigation groups; `aria-current="page"` | `<a class="ui-nav-item" aria-current="page"><i class="ri-dashboard-3-line"></i>Overview</a>` |
| `ui-topbar` | breadcrumb left, search and actions right | see Page shell |
| `ui-page-header`, `ui-page-title`, `ui-page-sub`, `ui-page-actions` | the h1, its line, its actions | `<div class="ui-page-header"><div><h1 class="ui-page-title">Overview</h1></div></div>` |
| `ui-section`, `ui-section-head` | titled group on the page | `<section class="ui-section"><div class="ui-section-head"><h2>Services</h2></div>…</section>` |
| `ui-detail`, `ui-detail-head`, `ui-detail-row` | selection panel of list-detail | `<aside class="ui-detail"><div class="ui-detail-head"><h2>…</h2></div>…</aside>` |
| `ui-settings-group`, `ui-settings-row` | settings group, label and help beside the control | `<section class="ui-settings-group"><header><h2>Health checks</h2></header><div class="ui-settings-row"><div>…</div><div>…</div></div></section>` |
| `ui-danger` | destructive actions, apart | `<section class="ui-danger"><header><h2>Danger zone</h2></header>…</section>` |
| `ui-auth` | sign-in page frame | `<div class="ui-auth"><header>…</header><main><section>…</section></main><footer>…</footer></div>` |

## Blocks

All seven are one product, an infrastructure platform (Outpost) used by the ledgerline payments team: `dashboard` (production overview), `list-detail` (deployments), `detail` (incident INC-2291 on its own page), `settings` (one service), `billing` (the workspace plan and usage), `onboarding` (first run of a new project, ending on the empty Services list) and `sign-in` (with the wrong-password state).

## Coverage gaps

What signal does not ship yet, so a build knows to design it rather than assume it exists:

- **Date and time range picker.** Blocks use a segmented 1h/6h/24h/7d; an absolute range picker with UTC entry is not drawn.
- **Log viewer.** `ui-code` shows a few lines; a virtualised, streaming, filterable log stream with level facets is not a component.
- **Copy and slider output behaviour.** `ui-code [data-copy]` and the `ui-slider` `<output>` are styled, but seenry-ui.js does not yet copy to the clipboard or keep the output and `--value` in sync with the thumb. Wire them in the app until the shared script does.
- **Tree and diff.** No file tree, no config diff view for a deploy.
- **Charts beyond lines, bars and stacked bars.** No heatmap (latency histogram) or flame graph.
- **Multi-select combobox and tag input.** `ui-combobox` is single value; multi-value filters use chips.
- **Notifications panel** behind the bell, and a **user menu** with workspace switching.

## Install

**Plain CSS.** Load, in this order, the fonts, the shared kit, then the system:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="components/ui/seenry-ui.css">
<link rel="stylesheet" href="systems/signal/tokens.css">
<link rel="stylesheet" href="systems/signal/system.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css">
<script src="components/ui/seenry-ui.js" defer></script>
```

Write the markup from the component index. Dark is the default; `<html data-theme="light">` forces light. Switching to another system means changing the two `systems/signal/` links.

**Tailwind v4 and shadcn/ui.** `theme.tailwind.css` maps signal's tokens onto the names Tailwind utilities and shadcn components read (`bg-background`, `bg-primary`, `text-muted-foreground`, `border-input`, `rounded-md`, `font-mono`):

```css
@import "tailwindcss";
@import "./signal/theme.tailwind.css";   /* imports tokens.css */
```

Then set the shadcn radius to signal's 2px (it already reads `--r-*`), use `font-mono` for IDs and numbers, and keep shadcn components at `h-8` for the 32px rows. Because signal is dark by default, write light overrides as `[data-theme=light]` rather than relying on Tailwind's `dark:` variant. Regenerate the file after editing tokens: `node scripts/system_theme.mjs assets/systems/signal`.
