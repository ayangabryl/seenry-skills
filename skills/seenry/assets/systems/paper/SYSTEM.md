# Paper

## Character

Paper is a warm, calm UI for products people use about their own lives. White cards sit on a warm off-white page, a serif sets titles and big numbers, and a clean sans handles everything you click.

**Use it for:** personal finance and budgeting, health and sleep, habits, journaling, reading and learning, household and family tools. It suits a slow, reflective mood where the screen is opened once or twice a day.

**Not for:** dense operator tools, trading, developer consoles, incident dashboards, or anything with more than about eight columns of data. Those need a tighter system.

## Values at a glance

| | |
| --- | --- |
| Fonts | Newsreader 400 (display: page titles, stats, the selected figure), Inter 400/500/600 (UI) |
| Type | figure 44/48 serif · title 34/42 serif · stat 30/36 serif · heading 16/24 Inter 600 · body 15/22 · label 14/20 Inter 500 · small 13/18 |
| Surfaces | page `--bg` warm off-white, cards `--surface` white, quiet fills `--surface-2`, faint warm `--line` |
| Dark | warm charcoal (`#1b1916` page, `#24211d` cards), never blue-black |
| Radius | 8 controls · 10 menus and segmented · 14 cards, lists, tables, detail |
| Heights | row 44, control 40 (32 small), topbar 64, sidebar 248, content max 1160 |
| Accent | deep green `--accent`. It means "do this" and "you are here": the one primary button, the current nav icon, the selected list row, chart series 1 |

Fonts load from one Google Fonts link:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap">
```

## Rules

1. **MUST** set serif only on the page title, stat values, the detail figure and dialog titles. *Because* the serif is the voice of the product; on labels and buttons it turns into decoration.
   - Correct: `<h1 class="ui-page-title">October</h1>`
   - Wrong: `<button class="ui-button" style="font-family:var(--font-display)">Save</button>`

2. **NEVER** set the serif in italic, bold or uppercase. *Because* the calm comes from one light, upright weight.
   - Correct: `<dd>$4,716</dd>` inside `.ui-stat`
   - Wrong: `<h1 class="ui-page-title"><em>Your</em> October</h1>`

3. **MUST** keep at most one filled primary button per view. *Because* the green fill is the only loud thing on the page; two of them cancel out.
   - Correct: `<button class="ui-button">Export</button><button class="ui-button" data-variant="primary">Add transaction</button>`
   - Wrong: two `data-variant="primary"` buttons in the page header and the detail panel.

4. **MUST** write labels in sentence case with no eyebrow above titles. *Because* an editorial page reads like prose, not a control panel.
   - Correct: `<span class="ui-nav-label">Household</span>`
   - Wrong: `<span class="ui-nav-label" style="text-transform:uppercase">HOUSEHOLD</span>`

5. **MUST** put grouped content in a white card with the faint line and no shadow. *Because* paper on paper separates by tone, not by depth; shadows are for floating layers only.
   - Correct: `<section class="ui-card">…</section>`
   - Wrong: `<section class="ui-card" style="box-shadow:var(--shadow-float)">…</section>`

6. **MUST** pair every status color with a word. *Because* color alone fails color-blind readers and reads as decoration.
   - Correct: `<span class="ui-status" data-status="warn">Pay manually</span>`
   - Wrong: `<span class="dot-amber"></span>`

7. **MUST** sign money: `−$142.38` for spending, `+$3,412.50` in `--ok` for income, tabular numerals right-aligned. *Because* the sign, not the color, carries the direction.
   - Correct: `<td class="num amount-in">+$3,412.50</td>`
   - Wrong: `<td style="color:green">3412.5</td>`

8. **SHOULD** say the useful sentence in `ui-page-sub` rather than repeating the title. *Because* consumer products earn trust by telling people what changed.
   - Correct: `$1,284 left to spend with 4 days to go.`
   - Wrong: `Welcome to your dashboard.`

9. **NEVER** type a size, color or duration in `system.css` or a block; use a token from `tokens.css`. *Because* a screen switches systems by swapping two stylesheets.
   - Correct: `gap:var(--space-6)`
   - Wrong: `gap:24px`

10. **SHOULD** keep rows generous: 44px controls and nav, 60px list rows, 52px table rows. *Because* these screens are read, not scanned.
    - Correct: `<ul class="ui-list">` rows as given
    - Wrong: overriding `.ui-table td` to 32px to fit more rows.

11. **NEVER** use gradients, glass, emoji, numbered sections or decorative illustration. *Because* they fight the quiet surface and date the product.
    - Correct: a flat `--accent-subtle` fill on the selected row
    - Wrong: `background:linear-gradient(…)` on a stat card

## Page shell

```html
<div class="ui-shell" id="shell">
  <aside class="ui-sidebar" id="sidebar">
    <div class="ui-sidebar-head">monogram, household name, plan</div>
    <nav class="ui-nav"><a class="ui-nav-item" aria-current="page">…</a></nav>
    <nav class="ui-nav"><span class="ui-nav-label">Household</span>…</nav>
    <div class="ui-sidebar-foot">avatar, name, role, sign out</div>
  </aside>
  <main>
    <header class="ui-topbar">
      <button class="ui-button" data-variant="ghost" data-icon data-nav-toggle aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation">…</button>
      <nav aria-label="Breadcrumb"><ol class="ui-breadcrumb">…</ol></nav>
      search field, icon actions
    </header>
    <div class="ui-page-header">ui-page-title, ui-page-sub, ui-page-actions</div>
    ui-stat-strip, ui-card, ui-section, ui-table-wrap …
  </main>
</div>
```

Direct children of `main` center at `--content-max` and space themselves 32px apart. Under 768px the sidebar becomes a sheet: the block toggles `data-nav="open"` on `.ui-shell` from the `[data-nav-toggle]` button (a six-line script is in each block), Escape and the scrim close it. List-detail uses a two-column grid of `ui-list` and `ui-detail` (`--detail-w` 400px), stacked under 1024px. Settings uses `ui-settings-group`: title and help on the left third, a white panel of `ui-settings-row`s on the right; it stacks on phones.

Paper adds three helpers on top of the contract: `ui-list-heading` (a day or group heading inside `ui-list`), `ui-chart-bars` (horizontal bar list) and `[data-axis=x]` labels positioned with `--x`.

## Icons

Phosphor, regular weight, 18px, inheriting `currentColor`.

```html
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
<i class="ph ph-receipt" aria-hidden="true"></i>
```

Icons sit 12px before nav text and 8px before button text, in `--text-3` at rest and `--accent` on the current nav item. In lists an icon sits in a 32px `--surface-2` tile with 8px radius. Never use the fill, duotone or bold weights, and never an icon without a text label unless the button has `aria-label`.

## Charts

- **Category comparison**: horizontal bars in `ui-chart-bars`, sorted largest first, on one shared scale, 8px tall with a `--chart-track` behind. Name left, value right with "of $budget" in `--text-3`; a bar over its budget turns `--bad` and its text says "$36 over $350".
- **Trend over time**: one line in `ui-chart`, `--chart-1`, 2px, non-scaling stroke, no fill, no dots. Gridlines in `--chart-grid` at round values, y labels on the right, month labels below (`data-minor` labels hide on phones). The card head carries the plain label: what it is, the change, from and to.
- **Parts of a whole**: a single stacked bar with a legend, never a donut.

Give every chart `role="img"` and an `aria-label` that states the finding.

## What it never does

- Italic serif accents, serif buttons, or a serif in more than three weights.
- Uppercase or letter-spaced labels, eyebrows over titles, `01 /` section numbers.
- Gradients, glass blur, glows, colored card backgrounds, drop shadows on cards.
- Emoji, mascots, decorative illustration or confetti for small wins.
- A blue-black dark theme or a pure `#000` background.
- Donuts, gauges, sparkline-only stats or 3D charts.
- Two green buttons in one view.
