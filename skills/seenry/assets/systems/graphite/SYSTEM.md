# Graphite

## Character

Lean, dark-first product UI: three greys of surface, one typeface, a handful of sizes, executed exactly. Color appears only where it carries meaning, in status marks and in the logos of connected apps.

**Use it for:** AI agent consoles, developer tools, internal ops and marketing software, admin surfaces people keep open all day.
**Not for:** consumer or editorial pages, brands that need a signature color, playful or illustrated products, dense financial terminals.

## Values at a glance

| | |
| --- | --- |
| Font | Inter 400 and 500 (Google Fonts). `--font-mono` is the system mono stack for IDs, model names and payloads |
| Type | title 20/28 medium · heading 16/24 medium · label 14/20 medium · body 14/20 regular · small 13/18 regular · micro 12/16 medium · stat 24/32 medium |
| Surfaces, dark | page `#1A1A1A`, card `#212121`, selected `#292929`, hover `#252525`, border white 5% |
| Surfaces, light | page `#F7F7F7`, card `#FFFFFF`, selected `#F0F0F0`, hover `#F5F5F5`, border black 8% |
| Text | `#EEEEEE` names, `#A3A3A3` secondary, `#949494` tertiary (light: `#171717`, `#5E5E5E`, `#6B6B6B`); all at least 4.5:1 on every surface |
| Radius | 6 controls, 10 cards, 12 dialogs |
| Card | 14 padding, 20 gap, 1px border, no shadow |
| Heights | control 32 (28 small, 36 large), nav item 30, row 44, topbar 48; every control is 44 on phones |
| Accent | none. The primary button is the text color filled (`#EEEEEE` on dark, `#171717` on light). It means "the one action of this view", never brand |

## Rules

1. **MUST** keep color to status marks, chart failure series and integration logos.
   *Because* graphite reads as calm only while every hue means something.
   ```html
   <span class="ui-status" data-status="bad">Failing</span>
   <!-- wrong --> <span class="ui-badge" style="background:var(--info)">New</span>
   ```

2. **NEVER** use more than one filled primary button per view; everything else is the default grey or ghost.
   *Because* a white button on graphite is loud; two of them cancel out.
   ```html
   <button class="ui-button">Last 14 days</button><button class="ui-button" data-variant="primary">New agent</button>
   <!-- wrong --> <button class="ui-button" data-variant="primary">Export</button><button class="ui-button" data-variant="primary">New agent</button>
   ```

3. **MUST** write names at `--type-label` in `--text` and supporting text at `--type-small` in `--text-3`, one line each.
   *Because* the two-line name and meta pattern is the whole rhythm of the system.
   ```html
   <span><span>Approve 38 enriched leads</span><span class="ui-list-meta">Lead enrichment · 12m ago</span></span>
   <!-- wrong --> <span><b style="font-weight:700">APPROVE LEADS</b></span>
   ```

4. **NEVER** set weights above 500, uppercase labels, eyebrows or numbered sections.
   *Because* hierarchy comes from size and grey, not shouting.
   ```html
   <span class="ui-nav-label">Agents</span>
   <!-- wrong --> <span class="ui-nav-label" style="text-transform:uppercase;letter-spacing:.1em">01 / AGENTS</span>
   ```

5. **MUST** separate with 1px borders and surface steps, never with shadows on in-page cards.
   *Because* shadows on dark surfaces turn to mud; `--shadow-float` is only for menus, dialogs and toasts.
   ```html
   <section class="ui-card">…</section>
   <!-- wrong --> <section class="ui-card" style="box-shadow:0 8px 24px #0008">…</section>
   ```

6. **MUST** show state as a word with a 6px mark (`ui-status`), never a filled pill or color alone.
   *Because* the mark carries the hue and the word carries the meaning, for every reader.
   ```html
   <span class="ui-status" data-status="warn">Needs review</span>
   <!-- wrong --> <span class="dot-orange"></span>
   ```

7. **SHOULD** put integration logos in a 24px `ui-logo-tile` or bare at 16px; they are the brand color in the room.
   *Because* recognisable logos make an ops screen scannable without adding an accent.
   ```html
   <span class="ui-logo-tile"><span class="ui-logo" data-brand="hubspot"></span></span>
   <!-- wrong --> <span class="ui-avatar" style="background:#FF7A59">H</span>
   ```

8. **MUST** use Lucide at 16px with stroke 1.5 in `--text-3`, rising to `--text` on hover or selection.
   *Because* thin, quiet icons sit level with 14px text instead of competing with it.
   ```html
   <a class="ui-nav-item" href="#"><i data-lucide="activity"></i>Runs</a>
   <!-- wrong --> <a class="ui-nav-item" href="#"><i data-lucide="activity" style="width:22px;color:var(--ok)"></i>Runs</a>
   ```

9. **MUST** take every size, color, radius and duration from `tokens.css`.
   *Because* a block switches system by swapping two stylesheets.
   ```css
   .ui-card-head{gap:var(--space-3)}
   /* wrong */ .ui-card-head{gap:13px}
   ```

10. **SHOULD** set numbers in tabular figures and IDs or model names in `ui-mono`.
    *Because* columns of runs and spend must line up digit by digit.
    ```html
    <td class="num">$412.80</td> <span class="ui-mono">run_8F2KQ4</span>
    <!-- wrong --> <td style="text-align:left">$412.8</td>
    ```

## Page shell

```html
<div class="ui-shell">
  <aside class="ui-sidebar" id="sidebar">
    <button class="ui-sidebar-head"><span class="ui-workspace-mark">N</span><span>Northbeam</span><i data-lucide="chevrons-up-down"></i></button>
    <div class="ui-quick"><button class="ui-button"><i data-lucide="search"></i>Search<span class="ui-kbd">⌘K</span></button><button class="ui-button" data-icon aria-label="New run"><i data-lucide="square-pen"></i></button></div>
    <nav class="ui-nav"><a class="ui-nav-item" aria-current="page">…</a></nav>
    <nav class="ui-nav"><span class="ui-nav-label">Agents</span>…</nav>
    <div class="ui-sidebar-foot">…</div>
  </aside>
  <div>
    <header class="ui-topbar"><button data-nav-toggle class="ui-button" data-variant="ghost" data-icon>…</button><nav aria-label="Breadcrumb">…</nav><div class="ui-topbar-actions">…</div></header>
    <main class="ui-main">  <!-- data-wide for list-detail, data-narrow for settings -->
      <div class="ui-page-header">…</div>
      …
    </main>
  </div>
</div>
```

- The sidebar sits on the page color with a hairline right border; the selected nav item is the `#292929` surface. Nav groups have a small sentence-case label.
- Under 768px the sidebar becomes an overlay opened by the `[data-nav-toggle]` button; the block sets `data-nav-open` on `.ui-shell`.
- Content is a grid with 20px gaps: `ui-stat-strip` (three stat cards), `ui-grid` with `data-cols="2-1" | "2" | "3" | "split"`, `ui-section`, and `ui-stack` for vertical groups.
- Extra classes this system adds: `ui-main`, `ui-quick`, `ui-workspace-mark`, `ui-topbar-actions`, `ui-card-head`, `ui-grid`, `ui-stack`, `ui-logo`, `ui-logo-tile`, `ui-addon` (a joined text prefix such as `halyard.app/`), `ui-steps`, `ui-output`, `ui-detail-body`, `ui-mono`.

## Icons

Lucide 0.469.0 from `https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js`, written as `<i data-lucide="name"></i>` and replaced by `lucide.createIcons()`. Outline only, 16px, stroke 1.5 (`--icon-stroke`), round caps. An icon sits 6 to 8px before its label, vertically centred on the 20px line, in `--text-3`. Icon-only buttons are square at control height and carry `aria-label`. Brand marks come from Simple Icons via `ui-logo[data-brand]`, colored by `--brand-*` tokens (monochrome brands use the text color).

## Charts

- **Counts over time:** vertical bars, one per day, square-topped, at most 28px wide, on a zero baseline with 3 to 4 horizontal gridlines and plain tick labels (`0, 500, 1k`). Stack only a part-of-whole split such as succeeded and failed, with the failure series in `--chart-2` on top.
- **A rate or latency over time:** a single 1.5px line in `--chart-1`, no area fill, no dots except the hovered point.
- Series colors: `--chart-1` neutral, `--chart-2` failure red, then `--chart-3`/`--chart-4` greys. A legend of 6px squares sits in the card head; axes use `--chart-axis` at micro size.
- The block draws marks into `.ui-chart` with inline SVG sized to the container (see the dashboard), and gives the SVG an `aria-label` that states the reading.

## What it never does

- Gradients, glass, glow, colored card backgrounds, or a purple "AI" accent.
- Uppercase or letter-spaced labels, eyebrows above titles, `01 /` numbering, 600 to 700 weights.
- Filled color pills for status, emoji, or icons in colored circles.
- Shadows on in-page cards, more than three grey surface steps, borders heavier than 1px.
- Donuts, gauges or radial charts for something a bar answers; KPI cards with sparklines that no one reads.
