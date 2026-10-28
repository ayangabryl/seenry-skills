# ledger

## Character

Light, dense and exact: white and cool-grey surfaces split by hairlines, tabular figures wherever money appears, and one deep ink-blue that means "act here" or "this is selected". It reads like a well-kept book of accounts, calm enough to scan 200 rows and precise enough to trust every cent.

**Use it for** invoicing, accounts receivable and payable, spend management, treasury, payroll, reconciliation, procurement and back-office operations tools.
**Not for** consumer apps, marketing pages, creative tools, anything playful or editorial, or screens with little data.

Open [gallery.html](gallery.html) for every component in every state, light and dark. The [blocks](blocks/dashboard.html) are seven screens of one product, Fenwick, used by Harbor & Pine Supply.

## Values at a glance

| | |
| --- | --- |
| Fonts | IBM Plex Sans 400/500/600 for everything; IBM Plex Mono 400 for IDs (`INV-2026-0418`, `PO-77120`). Amounts stay in Plex Sans with `tabular-nums`. |
| Type | title 600 22/28 · stat 500 24/32 · heading 600 14/20 · body 400 14/20 · label 500 13/18 · small 400 12/16 · mono 400 13/18 |
| Surfaces | `--bg` cool grey page, `--surface` white panels, `--surface-2` sidebar and table heads, `--line` hairline between everything. Dark: near-black blue-greys with the same structure. |
| Radius | 4px tags, kbd and bars · 6px controls, cards, tables · 8px menus, dialogs, the sign-in frame |
| Density | 36px rows, 32px header rows, 32px controls (28px small), 44px on phones |
| Accent | ink blue `#1b3a75` (dark `#3b62b7`): the one primary button, the selected nav item, row, tab, chip and step, checked controls, the slider fill, text links, and nav counts that mean "needs you" (totals get no count). Never a chart series. |
| Semantics | red only for overdue, failed, destructive or over a limit; green only for paid and settled; amber for disputed, at risk or near a limit; slate for informational states such as promise to pay |

## Rules

1. **MUST** set every money column and figure with `tabular-nums`, right-aligned, two decimals.
   *Because* columns of cents only compare when digits line up.
   Correct: `<td class="num">$12,604.80</td>` · Wrong: `<td>$12,604.8</td>`

2. **MUST** keep one filled primary per view; on list-detail the selection panel owns it.
   *Because* ink blue is the only signal for "the next thing to do".
   Correct: `<button class="ui-button" data-variant="primary">Send reminder</button>` beside `<button class="ui-button">Record payment</button>` · Wrong: two `data-variant="primary"` buttons in the header and the panel.

3. **NEVER** use the accent for decoration, charts, links in body copy or headings.
   *Because* it stops meaning "selected" the moment it appears anywhere else.
   Correct: `.ui-nav-item[aria-current=page]` in ink blue · Wrong: an ink-blue section title.

4. **MUST** pair every status color with a word and a mark (`ui-status` draws the dot), and mark only exceptions: in an overdue table the default row says "30 days late" in grey, not a red tag.
   *Because* red and green alone fail color-blind readers and printouts.
   Correct: `<span class="ui-status" data-status="warn">Disputed</span>` · Wrong: a red amount with no label, or a red "Overdue" tag on every row of an overdue list.

5. **NEVER** use red for anything but overdue, failed, destructive or over-limit, or green for anything but paid and settled.
   *Because* in finance these colors carry money meaning; a green "Active" badge reads as "paid".
   Correct: `data-status="info"` for "Promise to pay" · Wrong: `data-status="ok"` for "Sent".

6. **MUST** set IDs in Plex Mono with `.ui-id`; never set amounts in mono.
   *Because* IDs are copied and compared character by character; amounts are read as numbers.
   Correct: `<a class="ui-id">INV-2026-0418</a>` · Wrong: `<span class="ui-id">$48,250.00</span>`

7. **MUST** separate with hairlines, not shadows or fills; shadows are for floating layers only.
   *Because* density depends on quiet structure.
   Correct: `.ui-card` with its `--line` border · Wrong: a card with `--shadow-float` at rest.

8. **SHOULD** keep rows at `--row-h` (36px) and labels at `--type-label`; grow to 44px only under 600px.
   *Because* operators scan many rows; desktop space goes to data, phones get touch targets.
   Correct: `.ui-table td` at 36px · Wrong: 56px "airy" rows on a ledger.

9. **MUST** write labels in sentence case without eyebrows, uppercase or numbering.
   *Because* the data is the hierarchy; decoration competes with it.
   Correct: `<p class="ui-nav-label">Receivables</p>` · Wrong: `RECEIVABLES` or `01 / Receivables`.

10. **MUST** show exact amounts in stats with cents dimmed (`.ui-cents`).
    *Because* finance users need the exact figure, and dimming cents keeps the dollars legible.
    Correct: `<dd>$312,940<span class="ui-cents">.18</span></dd>` · Wrong: `<dd>$313K</dd>`

11. **SHOULD** make destructive buttons outlined red text; fill red only inside the confirming dialog (`data-fill`).
    *Because* a settings page of red slabs reads as alarm, not control.
    Correct: `<button class="ui-button" data-variant="danger">Void drafts</button>` · Wrong: three filled red buttons.

12. **MUST** write the number beside every bar: usage as "1,284 of 1,500", progress as "412 of 1,036".
    *Because* a bar alone says "most", and finance work needs "how many".
    Correct: `<div class="ui-measure"><span>Invoices sent</span><span class="ui-measure-value">1,284 <span>of 1,500</span></span><meter class="ui-meter" …></div>` · Wrong: a bare `<meter>`.

13. **NEVER** type a size or color outside `tokens.css`.
    *Because* the system swaps by changing two stylesheet links.
    Correct: `padding:var(--space-3)` · Wrong: `padding:12px`

## Page shell

```html
<div class="ui-shell">
  <aside class="ui-sidebar" id="sidebar">
    <div class="ui-sidebar-head"><button class="ui-workspace"><span class="ui-org-mark">HP</span><span>Harbor &amp; Pine Supply</span><i class="ti ti-selector"></i></button></div>
    <nav class="ui-nav"><div class="ui-nav-group"><p class="ui-nav-label">Receivables</p><a class="ui-nav-item" aria-current="page"><i class="ti ti-file-invoice"></i><span>Invoices</span><span class="ui-nav-count">137</span></a></div></nav>
    <div class="ui-sidebar-foot"><span class="ui-avatar">DW</span><span class="ui-person"><strong>Dana Whitfield</strong><span>Controller</span></span></div>
  </aside>
  <div class="ui-main">
    <header class="ui-topbar">
      <button class="ui-button ui-nav-toggle" data-variant="ghost" data-icon data-nav-toggle aria-controls="sidebar" aria-label="Open navigation"><i class="ti ti-menu-2"></i></button>
      <nav aria-label="Breadcrumb"><ol class="ui-breadcrumb">…</ol></nav>
      <div class="ui-topbar-actions"><button class="ui-search" data-dialog-open="command">…</button></div>
    </header>
    <main class="ui-page">
      <div class="ui-page-header"><div><h1 class="ui-page-title">Overview</h1><p class="ui-page-sub">…</p></div><div class="ui-page-actions">…</div></div>
      …
    </main>
  </div>
</div>
```

- Sidebar on `--surface-2`, top bar on `--surface`, page on `--bg`; content max 1280px.
- Under 768px the sidebar is a drawer. `seenry-ui.js` toggles `data-nav-open` on `.ui-shell` from the `[data-nav-toggle]` button and handles outside click, Escape and focus; the system draws the drawer and a scrim. Blocks carry no nav script.
- **List-detail**: `.ui-split` > `.ui-split-list` + `aside.ui-detail` (420px); under 1200px the detail stacks below.
- **Record** (detail.html): `.ui-record-title` (amount h1 + status), an `.ui-alert` when something needs a decision, a facts card with `.ui-data-list[data-layout=columns]`, then `.ui-columns[data-split="2-1"]`: lines and payments left, customer and `.ui-timeline` right.
- **Settings**: `.ui-settings` > `.ui-settings-group` (280px description column, bordered `.ui-settings-rows`), `.ui-danger` last, then `.ui-settings-foot` with the single primary.
- **Billing**: `.ui-plan` card with `.ui-plan-price` and `.ui-plan-foot`, `.ui-pay-method`, `.ui-usage` grid of `.ui-measure` meters, a receipts table.
- **Onboarding**: `form.ui-setup` > `.ui-steps`, `.ui-setup-body` (question in `.ui-setup-question` with `.ui-option` cards, context in `.ui-setup-aside`), `.ui-setup-foot`; the empty product (`.ui-empty`) below.
- **Sign-in**: `main.ui-auth-page` > `.ui-auth` > `.ui-auth-head`, `.ui-tabs` (sign in, create account), `.ui-auth-providers`, `.ui-auth-divider`, `.ui-alert[data-status=bad]`, form, `.ui-auth-legal`; `.ui-auth-foot` below the frame.
- Add `.ui-hide-sm` to table columns that can drop on phones (keep customer, status, amount).

## Component index

Seenry-ui markup is in [the core README](../../components/ui/README.md); ledger restyles all of it. `data-state="hover|focus"` draws a state statically for docs and tests.

| Class | What it is in ledger | Markup |
| --- | --- | --- |
| `ui-button` | 32px; primary ink, secondary outlined, ghost, danger outlined red, `data-fill` red only in a confirm dialog | `<button class="ui-button" data-variant="primary">Send reminder</button>` |
| `ui-field`, `ui-input`, `ui-textarea` | label above, 6px radius, ink focus ring, red border and message on error | `<label class="ui-field"><span class="ui-label">PO number</span><input class="ui-input"></label>` |
| `ui-control`, `ui-affix` | leading icon or unit inside a field | `<span class="ui-control"><span class="ui-affix">$</span><input class="ui-input"></span>` |
| `ui-select` | native select | `<select class="ui-select"><option>Net 30</option></select>` |
| `ui-combobox` | input with datalist and a selector mark | `<span class="ui-combobox"><input class="ui-input" list="customers"></span><datalist id="customers">…</datalist>` |
| `ui-choice`, `ui-radio-group` | 16px checkbox and radio, ink when checked | `<label class="ui-choice"><input type="checkbox"><span>Attach PDF</span></label>` |
| `ui-switch` | 32×18 switch for immediate settings | `<label class="ui-switch"><input type="checkbox" role="switch"><span>ACH debit</span></label>` |
| `ui-slider` | range with written value and ink fill (`--fill`) | `<label class="ui-slider"><span class="ui-label">Tolerance</span><output>$2.50</output><input type="range"></label>` |
| `ui-segmented` | view switch; selected is a raised white segment | `<div class="ui-segmented" aria-label="Range"><button aria-pressed="true">12M</button>…</div>` |
| `ui-tabs` | 2px ink rule under the selected tab | `<div class="ui-tabs" role="tablist"><button role="tab" aria-selected="true">Invoices</button></div>` |
| `ui-chip` | dashed when unset, solid ink with its value when set | `<button class="ui-chip" aria-pressed="true">Status <b>Overdue</b></button>` |
| `ui-filter-bar`, `ui-filter-count` | search, chips, then rows and money on the right | `<div class="ui-filter-bar">…<span class="ui-filter-count">41 invoices · $312,940.18</span></div>` |
| `ui-shell`, `ui-sidebar(-head/-foot)`, `ui-nav(-label/-item/-count)`, `ui-topbar` | app frame | see Page shell |
| `ui-page-header`, `ui-page-title`, `ui-page-sub`, `ui-page-actions` | the one h1 and its actions | `<div class="ui-page-header"><div><h1 class="ui-page-title">Invoices</h1></div></div>` |
| `ui-section`, `ui-section-head` | titled group; heading with a small inline count | `<div class="ui-section-head"><div><h2>Overdue</h2><p>41 invoices</p></div></div>` |
| `ui-breadcrumb` | slash-separated, current page last | `<ol class="ui-breadcrumb"><li><a>Invoices</a></li><li aria-current="page">INV-2026-0418</li></ol>` |
| `ui-pagination` | in the table foot | `<nav class="ui-pagination"><button aria-current="page">1</button></nav>` |
| `ui-steps`, `ui-step` | rule over each step: pale ink done, ink current | `<ol class="ui-steps"><li class="ui-step" aria-current="step">Getting paid</li></ol>` |
| `ui-command`, `ui-kbd`, `ui-search` | Cmd K menu and its trigger | `<button class="ui-search" data-dialog-open="command">…<span class="ui-kbd">⌘K</span></button>` |
| `ui-alert` | tinted banner: icon, one sentence, `<small>` detail, one action | `<div class="ui-alert" data-status="warn"><i class="ti ti-alert-triangle"></i><p>…</p></div>` |
| `ui-status`, `ui-badge` | status is a colored dot plus a plain word (no pill); badge is a 4px grey tag for categories | `<span class="ui-status" data-status="bad">30 days late</span>` |
| `ui-progress`, `ui-meter`, `ui-measure` | 6px bars; meter amber near a limit, red past it; number beside | `<div class="ui-measure"><span>Seats</span><span class="ui-measure-value">9 <span>of 10</span></span><meter class="ui-meter" …></div>` |
| `ui-toast` | bottom right, after an action | `SeenryUI.toast('Reminder sent',{description:'…'})` |
| `ui-skeleton` | grey bars in the shape of the rows | `<span class="ui-skeleton" style="width:40%"></span>` |
| `ui-menu`, `ui-tooltip` | 8px floating layers with the only shadows; dark tooltip | `<div class="ui-menu" role="menu" popover="auto">…</div>` |
| `ui-dialog`, `ui-sheet` | confirm one act; sheet for a side task | `<dialog class="ui-dialog">…</dialog>` |
| `ui-table`, `ui-table-wrap`, `ui-table-foot` | 36px rows, `.num` right, selected row ink edge, `tfoot` totals | `<table class="ui-table" data-ui-table>…</table>` |
| `ui-stat-strip`, `ui-stat`, `ui-cents` | up to three exact figures | `<dl class="ui-stat"><dt>Overdue</dt><dd>$312,940<span class="ui-cents">.18</span></dd></dl>` |
| `ui-chart`, `ui-chart-stack`, `ui-chart-plot`, `ui-chart-axis`, `ui-chart-legend` | aging stack and monthly bars in inline SVG | see Charts |
| `ui-list`, `ui-list-item`, `ui-list-icon`, `ui-list-meta`, `ui-list-value`, `ui-list-action` | queue rows: bare icon, what and why, amount, one small button written as the reply (Retry, Match, Approve) | `<li class="ui-list-item">…<span class="ui-list-value">$18,420.00</span><a class="ui-button" data-size="sm">Retry</a></li>` |
| `ui-data-list` | `<dl>` rows, or `data-layout="columns"` for record facts | `<dl class="ui-data-list"><div><dt>Terms</dt><dd>Net 30</dd></div></dl>` |
| `ui-detail`, `ui-detail-head`, `ui-detail-row`, `ui-detail-kicker` | selection panel | `<aside class="ui-detail"><div class="ui-detail-head">…</div></aside>` |
| `ui-timeline`, `ui-timeline-item` | who, what, when, joined by a hairline; `data-tone` tints the icon | `<li class="ui-timeline-item"><i class="ti ti-mail"></i><span>Reminder sent<small>…</small></span><time>Oct 21</time></li>` |
| `ui-code` | inline mono chip, or a block with `[data-copy]` | `<div class="ui-code"><pre><code>…</code></pre><button class="ui-button" data-size="sm" data-copy>Copy</button></div>` |
| `ui-empty` | icon, what is missing, why, one action; `data-size="sm"` in cards | `<div class="ui-empty"><h3>No invoices yet</h3><p>…</p></div>` |
| `ui-card`, `ui-avatar`, `ui-accordion` | hairline card, initials avatar, details/summary | `<article class="ui-card"><h3>…</h3></article>` |
| `ui-settings-group`, `ui-settings-row`, `ui-danger` | settings layout | `<div class="ui-settings-row" data-control="switch">…</div>` |
| `ui-auth` and its parts | centered sign-in frame | see sign-in.html |
| `ui-id`, `ui-amount`, `ui-muted`, `ui-bad-text` | helpers | `<span class="ui-id">PO-77120</span>` |

## Icons

Tabler outline via `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css">`, written `<i class="ti ti-receipt" aria-hidden="true"></i>`.

- 18px (`--icon`) in navigation and icon buttons; 16px (`--icon-sm`) inside text buttons, menus, list icons, alerts, steps and inputs.
- Outline only, never filled. Icons take `--text-3` (or the accent when their row is selected) so the label stays the stronger element.
- Icon then label with an 8–10px gap; icon-only buttons carry `aria-label`. One icon per row, never decorative.
- Useful names: `file-invoice`, `receipt`, `receipt-refund`, `cash`, `credit-card`, `credit-card-off`, `arrows-left-right`, `calendar-due`, `building-store`, `checklist`, `chart-bar`, `file-export`, `send`, `ban`, `alert-triangle`, `alert-circle`.

## Charts

Conventional finance forms only, drawn as inline SVG inside `.ui-chart`, colored with `data-series="1…5"` (maps to `--chart-1…5`).

- **Receivables aging**: one horizontal stacked bar (`.ui-chart-stack`, 20px) in bucket order Current, 1–30, 31–60, 61–90, 90+, followed by `.ui-chart-legend` as a table: swatch, bucket and count, amount, share. Current through 61–90 step through four greys (`--chart-1…4`) and only 90+ is red (`--chart-5`), so the one colored segment is the money that needs action. Pair it with the 90+ invoices as a selectable mini ledger (`.ui-mini-ledger`) whose button acts on the selection.
- **Invoiced vs collected per month**: equal-width paired bars on `.ui-chart-plot[data-size=lg]` (`data-series="invoiced"` grey, `"collected"` near-black ink), a `.ui-chart-axis[data-axis=y]` with three intervals, month labels on `[data-axis=x]`; the month in progress is drawn outlined with `data-partial` and labelled "to date". Single-series monthly bars use `data-series="past"` and `"current"`.
- **Usage against a limit**: `.ui-meter` in a `.ui-measure`, never a gauge or ring.
- Others when needed: a single line for balance over time, grouped bars for budget vs actual, a table before any pie. Every chart has an `aria-label` that states the numbers.

## What it never does

- Gradients, glass, glow, colored card backgrounds, decorative illustrations or emoji.
- Eyebrows, uppercase labels, letter-spaced captions, numbered sections or numbered stepper circles.
- Pills over 4px on status tags, or radii over 8px; a left color stripe on alerts or cards.
- Abbreviated money where the exact figure matters ("$1.3M outstanding" in a stat), proportional digits in a column, centered numbers.
- Accent-colored charts, links, headers or icons that are not selected; a second filled button "for balance".
- Invented chart grammars: radial aging gauges, donut KPI rings, sparkline confetti, a progress ring for usage.
- "Acme", lorem ipsum, round placeholder amounts like $10,000.00 everywhere.

### Anti-slop list for ledger screens

Hand back any screen that has:

1. A hero metric row of four or more stat cards with icons in tinted circles. Use one `.ui-stat-strip` of three.
2. Status shown as colored text or a dot with no word.
3. Green "Active", "Sent" or "Open" tags; those are `info` or `idle`.
4. Rounded 12–16px cards with drop shadows at rest.
5. Money in mono, money without cents in a table, or totals not in a `tfoot`.
6. A dashboard chart without a y scale, or bars colored by "brand" instead of meaning.
7. Empty states with a cartoon, or with two equal primary actions.
8. Settings rows where the label sits inside the switch on desktop.
9. Sign-in errors that say which field was wrong, or that clear the email the person typed.
10. Ink blue on anything that is neither an action nor a selection.

## Coverage gaps: compose, do not invent

Not every component exists. Compose from what does, with tokens only, and say what you built.

| Need | Compose from |
| --- | --- |
| Date range picker | two `ui-input type="date"` in a `ui-control` row, or a `ui-chip` that opens a `ui-menu` of presets (This month, Last 30 days, Quarter to date) |
| File upload / drop zone | a `ui-card` with a dashed `--line-strong` border, `ui-empty` content and a secondary button; list files as `ui-list-item` with a `ui-progress` |
| Bulk action bar | a `ui-filter-bar` that swaps to "12 selected · $48,920.00" plus secondary buttons; checkboxes in the first table column |
| Inline editable cell | a `ui-input` at `--control-h-sm` inside the `td`, same padding; Enter saves, Escape cancels |
| Key-value editor (metadata) | `ui-settings-row` pairs of two `ui-input`s with a ghost icon remove button |
| Approval chain | `ui-steps` for the stages, `ui-timeline` for who approved and when |
| Popover with form | a `ui-menu` container (`popover="auto"`) holding a `ui-field` and a small primary |
| Notification center | a `ui-sheet` with a `ui-list`; unread rows use `--selected` background |
| Statement or printable invoice | `ui-data-list[data-layout=columns]` header, `ui-table` lines with `tfoot` totals, no shell |
| Tree or chart of accounts | `ui-table` with the first cell indented by `--space-4` per level and a chevron icon button |

## Install

**Plain CSS.** Copy `components/ui/seenry-ui.css`, `seenry-ui.js`, and this folder's `tokens.css` and `system.css`. Load in this order:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="seenry-ui.css">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="system.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css">
<script src="seenry-ui.js" defer></script>
```

Light is the default; `data-theme="dark"` on `<html>` forces dark, and an unset theme follows the OS.

**Tailwind v4 or shadcn/ui.** Copy `tokens.css` and `theme.tailwind.css` next to your global CSS:

```css
@import "tailwindcss";
@import "./theme.tailwind.css";
```

Utilities then take ledger's values (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary text-primary-foreground`, `rounded-md`), and shadcn components pick up the same variables. Keep the rules above: add `tabular-nums` to money, `font-mono` only for IDs, and use `h-8` controls and `h-9` rows rather than shadcn defaults where density matters. After editing `tokens.css`, regenerate with `node scripts/system_theme.mjs assets/systems/ledger`.
