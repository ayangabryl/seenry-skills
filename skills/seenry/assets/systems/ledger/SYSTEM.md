# ledger

## Character

Light, dense and exact: white and cool-grey surfaces split by hairlines, tabular figures wherever money appears, and one deep ink-blue that means "act here" or "this is selected". It reads like a well-kept book of accounts, calm enough to scan 200 rows and precise enough to trust every cent.

**Use it for** invoicing, accounts receivable and payable, spend management, treasury, payroll, reconciliation, procurement and back-office operations tools.
**Not for** consumer apps, marketing pages, creative tools, anything playful or editorial, or screens with little data.

## Values at a glance

| | |
| --- | --- |
| Fonts | IBM Plex Sans 400/500/600 for everything; IBM Plex Mono 400 for IDs (`INV-2026-0418`, `PO-77120`, number formats). Amounts stay in Plex Sans with `tabular-nums`. |
| Type | title 600 22/28 · heading 600 14/20 · body 400 14/20 · label 500 13/18 · small 400 12/16 · stat 500 24/32 · mono 400 13/18 |
| Surfaces | `--bg` cool grey page, `--surface` white panels, `--surface-2` sidebar and table heads, `--line` hairline between everything. Dark: near-black blue-greys with the same structure. |
| Radius | 4px tags and kbd, 6px controls, cards, tables, 8px menus and dialogs |
| Density | 36px table and detail rows, 32px header rows, 32px controls (28px small), 44px on phones |
| Accent | ink blue `#1b3a75` (dark `#3b62b7`): the one primary button, the selected nav item, the selected row, the active tab, checked controls. Nothing else. |
| Semantics | red only for overdue, failed, destructive; green only for paid, settled; amber for disputed or at-risk; slate for informational states such as promise to pay |

## Rules

1. **MUST** set every money column and figure with `tabular-nums`, right-aligned, two decimals.
   *Because* columns of cents only compare when digits line up.
   Correct: `<td class="num">$12,604.80</td>` · Wrong: `<td>$12,604.8</td>`

2. **MUST** keep one filled primary per view; the selection panel owns it on list-detail.
   *Because* ink blue is the only signal for "the next thing to do".
   Correct: `<button class="ui-button" data-variant="primary">Send reminder</button>` beside `<button class="ui-button">Record payment</button>` · Wrong: two `data-variant="primary"` buttons in the header and the panel.

3. **NEVER** use the accent for decoration, charts, links in body copy or headings.
   *Because* it stops meaning "selected" the moment it appears anywhere else.
   Correct: `.ui-nav-item[aria-current=page]` in ink blue · Wrong: an ink-blue section title.

4. **MUST** pair every status color with a word and a mark (`ui-status` draws the dot).
   *Because* red/green alone fails color-blind readers and printouts.
   Correct: `<span class="ui-status" data-status="bad">30 days late</span>` · Wrong: a red amount with no label.

5. **NEVER** use red for anything but overdue, failed or destructive, or green for anything but paid and settled.
   *Because* in finance these colors carry money meaning; a green "Active" badge reads as "paid".
   Correct: `data-status="info"` for "Promise to pay" · Wrong: `data-status="ok"` for "Sent".

6. **MUST** set IDs in Plex Mono with `.ui-id`; never set amounts in mono.
   *Because* IDs are copied and compared character by character; amounts are read as numbers.
   Correct: `<a class="ui-id">INV-2026-0418</a>` · Wrong: `<span class="ui-id">$48,250.00</span>`

7. **MUST** separate with hairlines, not shadows or fills; shadows are for floating layers only.
   *Because* density depends on quiet structure.
   Correct: `.ui-card` with `--line` border · Wrong: a card with `--shadow-float` at rest.

8. **SHOULD** keep rows at `--row-h` (36px) and labels at `--type-label`; grow to 44px only under 600px.
   *Because* operators scan many rows; desktop space goes to data, phones get touch targets.
   Correct: `.ui-table td` at 36px · Wrong: 56px "airy" rows on a ledger.

9. **MUST** write labels in sentence case without eyebrows, uppercase or numbering.
   *Because* the data is the hierarchy; decoration competes with it.
   Correct: `<p class="ui-nav-label">Receivables</p>` · Wrong: `RECEIVABLES` or `01 / Receivables`.

10. **MUST** show cents in stats in `--text-3` (`.ui-cents`) and keep the full amount.
    *Because* finance users need the exact figure, and dimming cents keeps the dollars legible.
    Correct: `<dd>$312,940<span class="ui-cents">.18</span></dd>` · Wrong: `<dd>$313K</dd>` in a stat.

11. **SHOULD** make destructive buttons outlined red text; fill red only inside the confirming dialog (`data-fill`).
    *Because* a settings page of red slabs reads as alarm, not control.
    Correct: `<button class="ui-button" data-variant="danger">Void drafts</button>` · Wrong: three filled red buttons.

12. **NEVER** type a size or color outside `tokens.css`.
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
    <header class="ui-topbar"><button class="ui-button ui-nav-toggle" data-icon data-nav-toggle>…</button><nav><ol class="ui-breadcrumb">…</ol></nav><div class="ui-topbar-actions"><button class="ui-search">…</button></div></header>
    <main class="ui-page">
      <div class="ui-page-header"><div><h1 class="ui-page-title">Overview</h1><p class="ui-page-sub">…</p></div><div class="ui-page-actions">…</div></div>
      <div class="ui-stat-strip">…</div>
      <div class="ui-columns">…cards with charts…</div>
      <div class="ui-columns" data-split="2-1"><section class="ui-section">table</section><section class="ui-section">ui-list</section></div>
    </main>
  </div>
</div>
```

- The sidebar sits on `--surface-2`; the topbar on `--surface`; the page on `--bg`. Content max is 1280px.
- List-detail replaces `ui-page` with `.ui-split` > `.ui-split-list` + `aside.ui-detail` (420px). Under 1200px the detail stacks below.
- Settings uses `.ui-settings` > `.ui-settings-group` (280px description column, rows in a bordered `.ui-settings-rows`), `.ui-danger` last, then `.ui-settings-foot` with the single primary.
- Under 768px the sidebar becomes an off-canvas drawer: the block toggles `data-nav="open"` on `.ui-shell` from the `data-nav-toggle` button. Add `.ui-hide-sm` to columns that can drop on phones (keep customer, status, amount).
- Helper classes: `.ui-id`, `.ui-amount`, `.ui-cents`, `.ui-muted`, `.ui-chip`, `.ui-filter-count`, `.ui-list-icon`, `.ui-list-body`, `.ui-list-value`, `.ui-table-foot`, `.ui-timeline`, `.ui-detail-rows`.

## Icons

Tabler outline via `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css">`, written `<i class="ti ti-receipt" aria-hidden="true"></i>`.

- 18px (`--icon`) in navigation and icon buttons; the 24px-drawn 2px stroke renders at 1.5px. 16px (`--icon-sm`) inside text buttons, menus, list icons and inputs.
- Outline only, never filled. Icons take `--text-3` (or the accent when their row is selected) so the label stays the stronger element.
- Icon then label with an 8–10px gap; icon-only buttons carry `aria-label`. One icon per row, never decorative.
- Useful names: `file-invoice`, `receipt`, `receipt-refund`, `cash`, `credit-card-off`, `arrows-left-right`, `calendar-due`, `building-store`, `checklist`, `chart-bar`, `file-export`, `send`, `ban`.

## Charts

Conventional finance forms only, drawn as inline SVG inside `.ui-chart`, colored with `data-series="1…5"` (maps to `--chart-1…5`).

- **Receivables aging**: one horizontal stacked bar (`.ui-chart-stack`, 20px) in bucket order Current, 1–30, 31–60, 61–90, 90+, followed by `.ui-chart-legend` as a table: swatch, bucket and invoice count, amount, share. The palette steps from ink-navy through pale blue to amber and red, so lateness reads as heat.
- **Cash collected per month**: vertical bars, 12 months, on `.ui-chart-plot` with a `.ui-chart-axis[data-axis=y]` scale ($0 to a round maximum, 4 gridlines) and month labels on `[data-axis=x]`. Past months use series 2, the current month series 1 and `data-current` on its label. A plain label above gives the total and the current month figure.
- Others when needed: a single line for balance over time, grouped bars for budget vs actual, a table before any pie. Every chart has an `aria-label` that states the numbers.

## What it never does

- Gradients, glass, glow, colored card backgrounds, decorative illustrations or emoji.
- Eyebrows, uppercase labels, letter-spaced captions, numbered sections.
- Rounded "friendly" pills over 4px on status tags, or radii over 8px.
- Abbreviated money where the exact figure matters ("$1.3M outstanding" in a stat), proportional digits in a column, centered numbers.
- Accent-colored charts, links, headers or icons that are not selected.
- Invented chart grammars: radial aging gauges, donut KPI rings, sparkline confetti.
- "Acme", lorem ipsum, round placeholder amounts like $10,000.00 everywhere.
