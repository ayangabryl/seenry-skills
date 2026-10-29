# Paper

## Character

Paper is a warm, calm UI for products people use about their own lives. White cards sit on a warm off-white page, a serif sets titles and big numbers, and a clean sans handles everything you click.

**Use it for:** personal finance and budgeting, health and sleep, habits, journaling, reading and learning, household and family tools. It suits a slow, reflective mood where the screen is opened once or twice a day.

**Not for:** dense operator tools, trading, developer consoles, incident dashboards, or anything with more than about eight columns of data. Those need a tighter system.

## Values at a glance

| | |
| --- | --- |
| Fonts | Newsreader 400 (display: page titles, stats, the detail figure, dialog and empty-state titles), Inter 400/500/600 (UI). Code uses the system mono stack `--font-mono`; no web mono is loaded. |
| Type | figure 44/48 serif · title 34/42 serif · stat 30/36 serif · heading 16/24 Inter 600 · body 15/22 · label 14/20 Inter 500 · small 13/18. Seven steps, no more. |
| Surfaces | page `--bg` warm off-white, cards `--surface` white, quiet fills `--surface-2`, faint warm `--line` |
| Dark | warm charcoal (`#1b1916` page, `#24211d` cards), never blue-black; the green lightens to `#93c4a8` |
| Radius | 8 controls · 10 menus, segmented, alerts, code · 14 cards, lists, tables, detail, auth · pill for chips, badges, bars |
| Heights | row 44, control 40 (32 small, 44 on phones), list row 60, table row 52, topbar 64, sidebar 248, content max 1160 |
| Accent | deep green `--accent`. It means "do this" and "you are here": the one primary button, the current nav icon, the selected row or chip, the current step, progress. Data is drawn in warm ink (`--chart-1`), never in the accent |
| Status | `--ok --warn --bad --info` as text and marks; the `-bg` tints only behind alerts and badges |

Fonts load from one Google Fonts link:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap">
```

## Rules

1. **MUST** set serif only on the page title, stat values, the detail figure and dialog or empty-state titles. *Because* the serif is the voice of the product; on labels and buttons it turns into decoration.
   - Correct: `<h1 class="ui-page-title">October</h1>`
   - Wrong: `<button class="ui-button" style="font-family:var(--font-display)">Save</button>`

2. **NEVER** set the serif in italic, bold or uppercase. *Because* the calm comes from one light, upright weight.
   - Correct: `<dd>$4,716</dd>` inside `.ui-stat`
   - Wrong: `<h1 class="ui-page-title"><em>Your</em> October</h1>`

3. **MUST** keep at most one filled primary button per view. *Because* the green fill is the only loud thing on the page; two of them cancel out.
   - Correct: `<button class="ui-button">Turn on autopay</button><button class="ui-button" data-variant="primary">Mark as paid</button>`
   - Wrong: a primary "Update card" in an alert and another primary in the page header.

4. **MUST** write labels in sentence case with no eyebrow above titles. *Because* an editorial page reads like prose, not a control panel.
   - Correct: `<span class="ui-nav-label">Household</span>`
   - Wrong: `<span class="ui-nav-label" style="text-transform:uppercase">HOUSEHOLD</span>`

5. **MUST** put grouped content in a white card with the faint line and no shadow. *Because* paper on paper separates by tone, not by depth; shadows belong to floating layers only.
   - Correct: `<section class="ui-card">…</section>`
   - Wrong: `<section class="ui-card" style="box-shadow:var(--shadow-float)">…</section>`

6. **MUST** pair every status color with a word. *Because* color alone fails color-blind readers and reads as decoration.
   - Correct: `<span class="ui-status" data-status="warn">Pay manually</span>`
   - Wrong: `<span class="dot-amber"></span>`

7. **MUST** sign money: `−$142.38` for spending, `+$3,412.50` in `--ok` for income, tabular numerals right-aligned. *Because* the sign, not the color, carries the direction.
   - Correct: `<td class="num amount-in">+$3,412.50</td>`
   - Wrong: `<td style="color:green">3412.5</td>`

8. **MUST** show spending against a limit as a `ui-meter` with the number and the limit in words, and mark a close or broken limit with `data-status`. *Because* "$36 over $350" is the sentence people need; the bar only confirms it.
   - Correct: `<div class="ui-meter" data-status="bad"><span>Dining out</span><span>$386 <small>$36 over $350</small></span><meter max="350" value="350"></meter></div>`
   - Wrong: a bare red bar with "110%" beside it.

9. **SHOULD** say the useful sentence in `ui-page-sub` rather than repeating the title. *Because* consumer products earn trust by telling people what changed.
   - Correct: `$1,284 left to spend with 4 days to go.`
   - Wrong: `Welcome to your dashboard.`

10. **NEVER** type a size, color or duration in `system.css` or a block; use a token from `tokens.css`. *Because* a screen switches systems by swapping two stylesheets.
    - Correct: `gap:var(--space-6)`
    - Wrong: `gap:24px`

11. **SHOULD** keep rows generous: 40px controls and nav, 60px list rows, 52px table rows, 44px data-list rows. *Because* these screens are read, not scanned.
    - Correct: `<ul class="ui-list">` rows as given
    - Wrong: overriding `.ui-table td` to 32px to fit more rows.

12. **NEVER** use gradients, glass, emoji, numbered sections or decorative illustration. *Because* they fight the quiet surface and date the product.
    - Correct: a flat `--accent-subtle` fill on the selected row
    - Wrong: `background:linear-gradient(…)` on a stat card

## Page shell

```html
<div class="ui-shell">
  <aside class="ui-sidebar" id="sidebar">
    <div class="ui-sidebar-head">monogram, household name, plan</div>
    <nav class="ui-nav"><a class="ui-nav-item" aria-current="page">…</a></nav>
    <nav class="ui-nav"><span class="ui-nav-label">Household</span>…</nav>
    <div class="ui-sidebar-foot">avatar, name, role, sign out</div>
  </aside>
  <main>
    <header class="ui-topbar">
      <button class="ui-button" data-variant="ghost" data-icon data-nav-toggle aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation"><i class="ph ph-list" aria-hidden="true"></i></button>
      <nav aria-label="Breadcrumb"><ol class="ui-breadcrumb">…</ol></nav>
      search field, icon actions
    </header>
    <div class="ui-page-header">ui-page-title, ui-page-sub, ui-page-actions</div>
    ui-stat-strip, ui-card, ui-section, ui-table-wrap …
  </main>
</div>
```

Direct children of `main` center at `--content-max` and sit 32px apart. Under 768px the sidebar becomes a drawer: seenry-ui.js toggles `data-nav-open` on `.ui-shell` from the `[data-nav-toggle]` button and closes it on Escape or an outside click; Paper slides it in over a scrim. Blocks carry no navigation script.

- **List-detail**: a grid of `ui-list` and `ui-detail` (`--detail-w` 400px), stacked under 1024px. Day headings are a `ui-list-meta` placed directly in the list.
- **Detail**: page header with a `ui-status` beside the title and the actions; a 7:4 grid with the figure and chart, then a `ui-timeline`, on the left, and `ui-data-list` facts on the right.
- **Settings and billing**: `ui-settings-group`, title and help on the left third, a white panel of `ui-settings-row`s on the right; the last group is `ui-danger`. Billing leads with a `ui-stat-strip`, then `ui-meter` usage, payment method and invoices.
- **Onboarding**: no sidebar. A 640px column with `ui-steps`, one question as the page title, the answer in a card, and the empty state the product opens to below it.
- **Sign-in**: `ui-auth` centered on the page with tabs for sign in and create account, providers, a `role="separator"` divider, fields and the legal line in its footer.

The two helpers Paper used to add are folded into the contract: the day heading is `ui-list-meta` inside `ui-list`, and category bars are `ui-meter` rows. Paper keeps two small extensions: `[data-axis=x]` labels positioned with `--x` (`data-align="center"` for bars), and `.ui-chart .bar` with `data-estimate`.

## Icons

Phosphor, regular weight, 18px, inheriting `currentColor`.

```html
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
<i class="ph ph-receipt" aria-hidden="true"></i>
```

Icons sit 12px before nav text and 8px before button text, in `--text-3` at rest and `--accent` on the current nav item. In lists an icon sits in a 32px `--surface-2` tile with 8px radius; in alerts it takes the status color. Never use the fill, duotone or bold weights, and never an icon without a text label unless the button has `aria-label`.

## Charts

- **Spending against a budget**: a list of `ui-meter` rows, over or close to budget first and fixed bills last: name left, amount right with "of $budget" in `--text-3`, an 8px bar under both. `data-status="warn"` near the limit ("$88 left of $900"), `data-status="bad"` over it ("$36 over $350"). `data-pace style="--pace:87%"` draws a tick where today falls in the month; give one row `data-pace="Today"` to label it once.
- **Trend over time**: one line in `ui-chart`, `--chart-1`, 2px, non-scaling stroke, an optional `--surface-2` area under it, a dot and the value at the end, and at most one annotation. Gridlines in `--chart-grid` at round values, y labels on the right, month labels below (`data-minor` labels hide on phones). The card head carries the plain label: what it is, the change, from and to.
- **Amount per period**: vertical bars in `ui-chart` (`.bar`), one color; an estimate or forecast is the same bar in `--surface-2` with a dashed outline (`data-estimate`), named in the legend.
- **Parts of a whole**: a single stacked bar with a `ui-chart-legend data-form="bar"`, five slices at most, never a donut.

Give every chart `role="img"` and an `aria-label` that states the finding.

## Component index

Every class below is shown in every state in [gallery.html](gallery.html).

| Class | What it is | Markup |
| --- | --- | --- |
| `ui-button` | action; `data-variant` primary, ghost, danger; `data-size` sm, lg; `data-icon`; `data-loading` | `<button class="ui-button" data-variant="primary">Mark as paid</button>` |
| `ui-field`, `ui-label`, `ui-help`, `ui-error` | labelled field with help or error | `<label class="ui-field"><span class="ui-label">Email</span><input class="ui-input"></label>` |
| `ui-input`, `ui-textarea`, `ui-control`, `ui-affix` | text entry, with a prefix or suffix | `<span class="ui-control"><span class="ui-affix">$</span><input class="ui-input"></span>` |
| `ui-select` | native select with Paper's warm chevron | `<select class="ui-select"><option>The 1st</option></select>` |
| `ui-combobox` | native `input list` styled as the field | `<label class="ui-field ui-combobox"><span class="ui-label">Bank</span><input list="banks"></label>` |
| `ui-slider` | range with its value | `<label class="ui-slider"><span>Alert over</span><output>$250</output><input type="range" style="--fill:21%"></label>` |
| `ui-choice`, `ui-radio-group` | checkbox or radio with optional help | `<label class="ui-choice"><input type="checkbox"><span>Include pending</span></label>` |
| `ui-switch` | setting that applies now | `<label class="ui-switch"><input type="checkbox" role="switch"><span>Bill reminders</span></label>` |
| `ui-segmented` | view switch | `<div class="ui-segmented" aria-label="Range"><button aria-pressed="true">1Y</button>…</div>` |
| `ui-tabs`, `ui-tab-panel` | panels at one level | `<div class="ui-tabs" role="tablist"><button role="tab" aria-selected="true">Overview</button></div>` |
| `ui-chip` | filter or choice chip | `<button class="ui-chip" aria-pressed="true">To review <small>5</small></button>` |
| `ui-menu` | action menu (popover) | `<div class="ui-menu" role="menu" popover="auto"><button role="menuitem">Edit bill</button></div>` |
| `ui-tooltip` | supporting text (popover) | `<div class="ui-tooltip" role="tooltip" popover="manual">…</div>` |
| `ui-dialog` | modal task | `<dialog class="ui-dialog"><div class="ui-dialog__head"><h2>Remove Daniel?</h2></div>…</dialog>` |
| `ui-sheet` | side task, bottom on phones | `<dialog class="ui-sheet"><div class="ui-sheet__content">…</div></dialog>` |
| `ui-toast-stack`, `ui-toast` | result of an action | `<button data-toast-message="Marked as paid">…</button>` |
| `ui-command` | global search, Cmd K | `<dialog class="ui-command"><input type="search">…</dialog>` |
| `ui-accordion` | optional detail | `<details class="ui-accordion"><summary>…</summary><div class="ui-accordion__body">…</div></details>` |
| `ui-alert` | one-sentence banner; `data-status` | `<div class="ui-alert" data-status="warn"><i class="ph ph-warning"></i><p>…</p></div>` |
| `ui-status` | state word with a mark; `data-status` ok, warn, bad, info, idle | `<span class="ui-status" data-status="ok">Autopay</span>` |
| `ui-badge` | short category; `data-tone` | `<span class="ui-badge">Owner</span>` |
| `ui-progress` | work under way | `<div class="ui-progress"><span>Importing</span><span>62%</span><progress max="100" value="62"></progress></div>` |
| `ui-meter` | usage against a limit; `data-pace` adds a today tick | `<div class="ui-meter"><span>Transport</span><span>$344 <small>of $400</small></span><meter max="400" value="344"></meter></div>` |
| `ui-skeleton` | loading shape | `<span class="ui-skeleton" style="width:40%"></span>` |
| `ui-empty` | nothing here yet, with one action | `<div class="ui-empty"><h3>No bills yet</h3><p>…</p><button class="ui-button">Add a bill</button></div>` |
| `ui-avatar`, `ui-avatar-group` | person, initials fallback | `<span class="ui-avatar" aria-label="Maya Alvarez">MA</span>` |
| `ui-card` | grouped content; `data-link` for a link card | `<section class="ui-card">…</section>` |
| `ui-stat-strip`, `ui-stat` | up to three serif figures | `<div class="ui-stat-strip"><dl class="ui-stat"><dt>Spent</dt><dd>$4,716</dd><small>of $6,000</small></dl></div>` |
| `ui-table-wrap`, `ui-table`, `ui-pagination` | comparable records | `<div class="ui-table-wrap"><table class="ui-table" data-ui-table>…</table></div>` |
| `ui-list`, `ui-list-item`, `ui-list-meta` | rows with icon, name, meta and value | `<ul class="ui-list"><li class="ui-list-meta">Today</li><li><a class="ui-list-item">…</a></li></ul>` |
| `ui-data-list` | label and value pairs | `<dl class="ui-data-list"><div><dt>Due</dt><dd>The 3rd</dd></div></dl>` |
| `ui-detail`, `ui-detail-head`, `ui-detail-row` | selection panel with a figure | `<aside class="ui-detail"><div class="ui-detail-head"><h2>Whole Foods</h2><data>$142.38</data></div>…</aside>` |
| `ui-timeline`, `ui-timeline-item` | who did what, when; `data-status` on the mark | `<ol class="ui-timeline"><li class="ui-timeline-item"><p><strong>Maya</strong> paid $117.16</p><time>Oct 3</time></li></ol>` |
| `ui-chart`, `ui-chart-axis`, `ui-chart-legend` | SVG chart frame | `<div class="ui-chart" role="img" aria-label="…"><svg>…</svg><div class="ui-chart-axis" data-axis="y">…</div></div>` |
| `ui-code` | inline code, or a block with `data-copy` | `<figure class="ui-code"><pre><code>…</code></pre><button class="ui-button" data-size="sm" data-copy>Copy</button></figure>` |
| `ui-kbd` | a real shortcut | `<span class="ui-kbd">⌘ K</span>` |
| `ui-breadcrumb` | place in the hierarchy | `<ol class="ui-breadcrumb"><li><a>Bills</a></li><li aria-current="page">PG&amp;E</li></ol>` |
| `ui-steps`, `ui-step` | stepper; earlier steps show done | `<ol class="ui-steps"><li class="ui-step"><span>Household</span></li><li class="ui-step" aria-current="step"><span>Bank</span></li></ol>` |
| `ui-shell`, `ui-sidebar(-head, -foot)`, `ui-nav`, `ui-nav-label`, `ui-nav-item`, `ui-nav-count`, `ui-topbar` | app frame | see Page shell |
| `ui-page-header`, `ui-page-title`, `ui-page-sub`, `ui-page-actions` | the one h1 and its actions | `<div class="ui-page-header"><div><h1 class="ui-page-title">Billing</h1>…</div></div>` |
| `ui-section`, `ui-section-head` | titled group with a link | `<div class="ui-section-head"><h2>Invoices</h2><a>Download all</a></div>` |
| `ui-filter-bar` | search, chips or segmented, count | `<div class="ui-filter-bar"><div class="ui-control">…</div><output data-count>11 of 64</output></div>` |
| `ui-settings-group`, `ui-settings-row`, `ui-danger` | settings with a danger zone | `<section class="ui-settings-group ui-danger"><header>…</header><div><div class="ui-settings-row">…</div></div></section>` |
| `ui-auth` | sign-in frame | `<section class="ui-auth"><header>…<h1>Welcome back</h1></header>…<footer><p>Terms…</p></footer></section>` |

Floating layers can be drawn in place for docs and previews: a `ui-menu` or `ui-tooltip` without `popover`, or `<dialog open>` for `ui-dialog`, `ui-sheet` and `ui-command`.

## What it never does

The slop this system is most at risk of, and what to do instead:

- Italic serif accents, serif buttons or labels, or a serif in more than one weight. Serif stays on titles and figures, upright 400.
- Uppercase or letter-spaced labels, eyebrows over titles, `01 /` section numbers. Sentence case, and the title says it.
- Gradients, glass blur, glows, colored card backgrounds, drop shadows on cards. White cards on the warm page, a hairline, nothing else.
- Emoji, mascots, decorative illustration or confetti for small wins. A calm toast is enough.
- A blue-black dark theme or a pure `#000` background. Warm charcoal only.
- Donuts, gauges, sparkline-only stats, 3D charts, or a percent with no amount. Meters, bars and one line, with the dollar figure in words.
- Two green buttons in one view, or green used for decoration. Green means act or you are here.
- Colored left rails on cards or rows, pill-shaped everything, or a status dot with no word.
- Generic copy: "Welcome back, user", "Lorem ipsum", "Acme". Write the real sentence about the household's money.
- Tight 32px tables to fit more. Paper reads; it does not scan.

## Coverage gaps

What Paper does not ship, and what to compose instead:

| Need | Compose |
| --- | --- |
| Date picker or calendar | a native `<input type="date" class="ui-input">`; a month view is a `ui-table` of days with `aria-current="date"` on today |
| File upload | a `ui-card` with a dashed `--line-strong` border, an icon tile, one sentence and a secondary `ui-button` wrapping `<input type="file">`; progress below as `ui-progress` |
| Multi-select with tags | `ui-combobox` for search plus a row of `ui-chip aria-pressed="true"` for what is chosen |
| Popover with a form | `[data-ui=popover]` (styled like `ui-menu`) holding `ui-field`s and one button |
| Notifications inbox | `ui-list` inside a `ui-sheet`; unread rows use `aria-current="true"` |
| Kanban or drag and drop | not a Paper job; use a tighter system |
| Rich text editor | a `ui-textarea` with a `ui-segmented` toolbar above it; bring an editor library for real formatting |
| Pricing or plan picker | `ui-radio-group` of `ui-card`s, each with a `ui-stat`-style serif price |
| Avatar with photo | `<span class="ui-avatar"><img src="…" alt=""></span>` |
| Inline edit | a `ui-detail-row` whose value is a `ui-select` or `ui-input` at `--control-h-sm` |

## Install

**Plain CSS.** Load the fonts, then the core layer, Paper's tokens and Paper's styles, the icon set and the script:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap">
<link rel="stylesheet" href="components/ui/seenry-ui.css">
<link rel="stylesheet" href="systems/paper/tokens.css">
<link rel="stylesheet" href="systems/paper/system.css">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
<script src="components/ui/seenry-ui.js" defer></script>
```

`data-theme="dark"` or `"light"` on `<html>` forces a theme; with neither, Paper follows the device.

**Tailwind v4 and shadcn/ui.** `theme.tailwind.css` is generated from `tokens.css` by `node scripts/system_theme.mjs assets/systems/paper`; never edit it by hand. It maps Paper onto the names Tailwind utilities and shadcn components expect (`bg-background`, `bg-card`, `bg-primary`, `text-muted-foreground`, `border-input`, `ring`, `rounded-lg`, `font-sans`):

```css
@import "tailwindcss";
@import "./paper/theme.tailwind.css";
```

Then shadcn's `<Button>` is the green primary, `<Card>` is the white card on the warm page, and `dark:` follows `data-theme="dark"`. Keep the serif on titles and figures yourself (`font-[family-name:var(--font-display)]`), keep one primary per view, and use the seenry-ui classes above when you want Paper's exact rows, meters and lists rather than shadcn defaults.

## Known gaps in the shared layer

- `data-copy` on a `ui-code` block and live `--fill` and `<output>` updates on `ui-slider` are not handled by seenry-ui.js yet; gallery.html carries a small inline script for both.
