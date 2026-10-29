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
| Heights | control 32 (28 small, 36 large), nav item 30, row 40, topbar 48; every control is 44 on phones |
| Controls | checkbox, radio and switch outlines use `--control-line` (`#6E6E6E` dark, `#8F8F8F` light) so the boundary meets 3:1; everything structural stays on the 5% hairline |
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
    <header class="ui-topbar"><button class="ui-button" data-variant="ghost" data-icon data-nav-toggle aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation"><i data-lucide="menu"></i></button><nav aria-label="Breadcrumb">…</nav><div class="ui-topbar-actions">…</div></header>
    <main class="ui-main">  <!-- data-wide for list-detail, data-narrow for settings and onboarding -->
      <div class="ui-page-header">…</div>
      …
    </main>
  </div>
</div>
```

- The sidebar sits on the page color with a hairline right border; the selected nav item is the `#292929` surface. Nav groups have a small sentence-case label.
- Under 768px the sidebar becomes a drawer. `seenry-ui.js` toggles `data-nav-open` on `.ui-shell` from the `[data-nav-toggle]` button, closes it on an outside click or Escape and returns focus; graphite styles the open drawer and its scrim. Blocks carry no nav script.
- Under 600px the breadcrumb keeps its last two items, every control grows to 44px and fields to 16px text.
- A top-level page (the dashboard) puts its title in the bar instead of a breadcrumb: `<div class="ui-topbar-title"><h1>Overview</h1><span>6 agents · 9 integrations</span></div>`, with the date range and the one primary action at the right. Deeper pages keep the breadcrumb and a `ui-page-header`.
- Content is a grid with 20px gaps: `ui-stat-strip` (three unboxed stats on hairline rules, so the chart, queue and table are the only boxes; label and value rows on phones), `ui-grid` with `data-cols="2-1" | "2" | "3" | "split"`, `ui-section`, and `ui-stack` for vertical groups.
- Sign-in has no shell: `<main class="ui-auth">` holds one 360px column on the page color.
- Extra classes this system adds: `ui-main`, `ui-quick`, `ui-workspace-mark`, `ui-topbar-actions`, `ui-card-head`, `ui-grid`, `ui-stack`, `ui-logo`, `ui-logo-tile`, `ui-addon`, `ui-output`, `ui-detail-body`, `ui-mono`, `ui-muted`, `ui-chips`, `ui-usage`, `ui-option`, `ui-auth-providers`, `ui-auth-divider`, `ui-auth-legal`, `ui-auth-foot`, `ui-plan`, `ui-plan-price`, `ui-setup`, `ui-setup-question`, `ui-setup-foot`, `ui-dd-num`, `ui-dd-total`, `ui-visually-hidden`, `ui-topbar-title`; attributes `data-hide-phone` (drop a column or control under 600px) and `data-phone-first` (lead the stacked grid on phones, for the queue a person acts on).

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

## Component index

Open [gallery.html](gallery.html) for every component below in each state, dark and light. The [blocks](blocks/dashboard.html) are whole screens for one product, Halyard, an agent console for revenue and marketing ops: [dashboard](blocks/dashboard.html), [list-detail](blocks/list-detail.html), [detail](blocks/detail.html), [settings](blocks/settings.html), [billing](blocks/billing.html), [onboarding](blocks/onboarding.html), [sign-in](blocks/sign-in.html).

**Actions**

| Class | Use | Markup |
| --- | --- | --- |
| `ui-button` | an action; `data-variant="primary"` once per view, `ghost`, `danger`; `data-size="sm\|lg"`; `data-icon`; `data-loading` | `<button class="ui-button" data-variant="primary">New agent</button>` |
| `ui-chip` | a filter or choice toggle, pressed fills one grey step; group in `ui-chips` | `<button class="ui-chip" aria-pressed="true">Approvals <small>4</small></button>` |
| `ui-kbd` | a real keyboard shortcut | `<span class="ui-kbd">⌘K</span>` |

**Inputs**

| Class | Use | Markup |
| --- | --- | --- |
| `ui-field`, `ui-label`, `ui-help`, `ui-error` | label above, help or error below; `data-invalid` on the field | `<label class="ui-field"><span class="ui-label">Name</span><input class="ui-input"></label>` |
| `ui-input`, `ui-textarea` | text entry, 32px, 16px text on phones | `<input class="ui-input" value="Northbeam">` |
| `ui-control`, `ui-affix`, `ui-addon` | an input with a prefix, suffix or joined text | `<span class="ui-control"><span class="ui-affix">$</span><input class="ui-input"></span>` |
| `ui-select` | a short fixed list, native popup | `<select class="ui-select"><option>claude-sonnet-4-5</option></select>` |
| `ui-combobox` | suggestions that still accept free text | `<span class="ui-combobox"><input class="ui-input" list="ch"></span><datalist id="ch">…</datalist>` |
| `ui-choice`, `ui-radio-group` | checkbox or radio with a label and optional `<small>` help | `<label class="ui-choice"><input type="checkbox"><span>Retry failed runs</span></label>` |
| `ui-switch` | a setting that applies at once | `<label class="ui-switch"><input type="checkbox" role="switch"><span>Weekly digest</span></label>` |
| `ui-slider` | a bounded amount; set `--pct` to the filled share | `<span class="ui-slider"><input type="range" value="2" max="5" style="--pct:40%"><output>2</output></span>` |
| `ui-segmented` | two to four views of the same content | `<div class="ui-segmented"><button aria-pressed="true">Review</button>…</div>` |
| `ui-option` | a selectable card for one-question steps | `<label class="ui-option"><span class="ui-logo-tile">…</span><span><span>HubSpot</span><small>Contacts</small></span><input type="checkbox"></label>` |

**Navigation**

| Class | Use | Markup |
| --- | --- | --- |
| `ui-shell`, `ui-sidebar`, `ui-sidebar-head`, `ui-sidebar-foot` | the app frame and its side column | see Page shell |
| `ui-nav`, `ui-nav-label`, `ui-nav-item`, `ui-nav-count` | sidebar groups; `aria-current="page"` on the current item | `<a class="ui-nav-item" aria-current="page"><i data-lucide="house"></i>Overview</a>` |
| `ui-topbar`, `ui-topbar-actions` | the 48px bar: menu button, breadcrumb, actions | `<header class="ui-topbar">…</header>` |
| `ui-breadcrumb` | where the page sits | `<ol class="ui-breadcrumb"><li><a>Agents</a></li><li aria-current="page">Lead enrichment</li></ol>` |
| `ui-tabs`, `ui-tab-panel` | panels at the same level | `<div class="ui-tabs" role="tablist"><button role="tab" aria-selected="true">General</button></div>` |
| `ui-pagination` | pages under a table | `<nav class="ui-pagination"><button aria-current="page">1</button></nav>` |
| `ui-steps`, `ui-step` | a numbered stepper; earlier steps show a check | `<ol class="ui-steps"><li class="ui-step" aria-current="step"><span>Connect apps</span></li></ol>` |
| `ui-command` | the ⌘K command menu | `<dialog class="ui-command">…</dialog>` |

**Feedback**

| Class | Use | Markup |
| --- | --- | --- |
| `ui-status` | a state word with a 6px mark, `data-status="ok\|warn\|bad\|info\|idle"` | `<span class="ui-status" data-status="bad">Failing</span>` |
| `ui-badge` | an outlined category | `<span class="ui-badge">Monthly</span>` |
| `ui-alert` | one sentence about the page with an optional action, `data-status` | `<div class="ui-alert" data-status="warn"><i data-lucide="circle-pause"></i><div><strong>…</strong><p>…</p></div></div>` |
| `ui-progress` | work under way; no `value` for indeterminate | `<progress class="ui-progress" max="2000" value="1240"></progress>` |
| `ui-meter` | usage against a limit, neutral until `low`/`high` | `<meter class="ui-meter" max="10" low="8" high="9.5" optimum="0" value="8.6"></meter>` |
| `ui-usage` | a label and number above a progress or meter | `<div class="ui-usage"><span>Runs</span><span>18,204 of 25,000</span><meter class="ui-meter" …></meter></div>` |
| `ui-skeleton` | the shape of loading content | `<span class="ui-skeleton" style="width:60%"></span>` |
| `ui-toast-stack`, `ui-toast` | a result that leaves on its own | `<button class="ui-button" data-toast-message="Settings saved">Save</button>` |
| `ui-empty` | nothing here yet, why, one next step | `<div class="ui-card ui-empty"><h3>No API keys yet</h3><p>…</p><button class="ui-button">Create key</button></div>` |

**Data display**

| Class | Use | Markup |
| --- | --- | --- |
| `ui-card`, `ui-card-head` | a grouped surface; `data-flush` for edge-to-edge lists; `data-link` for a whole-card link | `<section class="ui-card"><div class="ui-card-head"><h2>Runs per day</h2></div>…</section>` |
| `ui-stat-strip`, `ui-stat` | at most three figures with their comparison, unboxed on hairline rules | `<dl class="ui-stat"><dt>Runs</dt><dd>18,204</dd><small>12.4% vs previous 14 days</small></dl>` |
| `ui-list`, `ui-list-item`, `ui-list-meta` | rows of name and one line of meta | `<a class="ui-list-item"><span class="ui-logo-tile">…</span><span><span>Name</span><span class="ui-list-meta">Meta</span></span></a>` |
| `ui-filter-bar` | search, chips or segmented, and a count above a list | `<div class="ui-filter-bar"><label class="ui-control">…</label><span class="ui-list-meta">4 agents</span></div>` |
| `ui-table-wrap`, `ui-table` | comparable records; `.num` right aligns | `<div class="ui-table-wrap"><table class="ui-table" data-ui-table>…</table></div>` |
| `ui-data-list` | label and value pairs of one record | `<dl class="ui-data-list"><div><dt>Model</dt><dd>claude-sonnet-4-5</dd></div></dl>` |
| `ui-detail`, `ui-detail-head`, `ui-detail-row`, `ui-detail-body` | the selection panel in list-detail | `<article class="ui-detail"><div class="ui-detail-head">…</div><div class="ui-detail-row"><span>Run</span><span>…</span></div></article>` |
| `ui-timeline`, `ui-timeline-item` | who did what, when; an empty first span is a status dot | `<li class="ui-timeline-item" data-status="ok"><span></span><div><span>Run succeeded</span><small>…</small></div><time>4h ago</time></li>` |
| `ui-code`, `ui-output`, `ui-mono` | inline code, a captioned block with `data-copy`, a bare output block, mono text | `<figure class="ui-code"><figcaption>curl<button data-copy …></button></figcaption><pre><code>…</code></pre></figure>` |
| `ui-avatar`, `ui-avatar-group` | initials on the raised grey | `<span class="ui-avatar" aria-label="Maya Ruiz">MR</span>` |
| `ui-logo`, `ui-logo-tile` | an app logo, bare at 16 or in a 24 tile | `<span class="ui-logo-tile"><span class="ui-logo" data-brand="hubspot"></span></span>` |
| `ui-chart`, `ui-chart-legend`, `ui-chart-axis` | a chart frame; the block draws SVG marks with `.grid .tick .s1 .s2` | `<div class="ui-chart" id="runs-chart"></div>` |
| `ui-accordion` | optional detail | `<details class="ui-accordion"><summary>…</summary><div class="ui-accordion__body">…</div></details>` |

**Overlays and page patterns**

| Class | Use | Markup |
| --- | --- | --- |
| `ui-menu`, `ui-tooltip` | a short action list; supporting text, never the only label | `<div class="ui-menu" role="menu" popover="auto">…</div>` |
| `ui-dialog`, `ui-sheet` | one decision; a related task from the side | `<dialog class="ui-dialog"><div class="ui-dialog__head">…</div></dialog>` |
| `ui-page-header`, `ui-page-title`, `ui-page-sub`, `ui-page-actions` | the one h1, its line and its actions | `<div class="ui-page-header"><div><h1 class="ui-page-title">Billing</h1></div></div>` |
| `ui-section`, `ui-section-head` | a titled group on the page | `<section class="ui-section"><div class="ui-section-head"><h2>Invoices</h2></div>…</section>` |
| `ui-settings-group`, `ui-settings-row`, `ui-danger` | label and help left, control right; destructive actions apart | `<div class="ui-settings-row"><label>…</label><div>…</div></div>` |
| `ui-auth` | the sign-in column: mark, title, providers, divider, fields, legal | `<main class="ui-auth"><section><header>…</header>…</section></main>` |

## Anti-slop checks for graphite

Graphite fails quietly: the screen still looks "clean" while it drifts into a template. Before calling a screen done:

- More than one white button on screen. Count `data-variant="primary"`; the rest are grey or ghost.
- A purple, blue or gradient "AI" accent, a glow behind the logo, or a colored card. The only hues are status marks, the failure series and app logos.
- Status as a filled colored pill, or a colored dot with no word. Use `ui-status` or a timeline dot with a sentence.
- Eyebrows, uppercase labels, `01 /` numbering or 600+ weights to make sections feel designed. Size and grey only.
- Shadows on cards to separate them. Hairline and surface step; shadows only on menus, dialogs and toasts.
- A fourth or fifth grey invented for one panel, or a border heavier than 1px.
- KPI cards with sparklines, donuts or gauges. Three stats with a comparison line, then one conventional chart.
- Icons in tinted circles, icons larger than 16px, or filled icons mixed with Lucide outlines.
- Generic data: "Acme", "John Doe", round numbers, "Lorem". Write the product's real objects: runs, agents, models, spend, IDs in mono.
- Two-line names, wrapped meta or centered body text in lists and tables. One line of name, one of meta, left aligned.
- A hero banner, welcome illustration or marketing headline inside the app. The first screen is the work.

## Coverage gaps

Not every component exists. Compose from these parts and tokens, never invent a value, and say what you built:

| Need | Compose from |
| --- | --- |
| Date picker | native `<input type="date" class="ui-input">`; presets as `ui-chip`s above it |
| Date range for a dashboard | `ui-button` with a calendar icon opening a `ui-menu` of ranges (Last 7, 14, 30 days, custom) |
| Multi-select with tags | `ui-combobox` plus a `ui-chips` row of `ui-chip aria-pressed="true"` with an x icon |
| File upload | a `ui-card ui-empty` with a dashed `--line-strong` border, an upload icon and a ghost button; progress with `ui-usage` |
| Kanban or board | `ui-grid data-cols="3"` of `ui-card data-flush` columns holding `ui-list` items; no drag handles unless it really drags |
| Inline edit | `ui-detail-row` whose value swaps to `ui-input` with ghost Cancel and default Save |
| Notifications panel | a `ui-sheet` holding a `ui-timeline` |
| Charts beyond bars and lines | a table first. If a part-of-whole split matters, one stacked horizontal bar in `--chart-1`/`--chart-3` with the failure part in `--chart-2` |
| Rich text editor | `ui-textarea` with a `ui-segmented` toolbar above it; no floating toolbars |
| Pricing or plan picker | `ui-option` cards with `type="radio"`, price at `--type-stat`, one primary to confirm |
| Avatar with presence | `ui-avatar` beside a `ui-status` word; never a colored dot on the avatar alone |
| Banner across the whole app | `ui-alert` at the top of `ui-main`, not a colored bar above the top bar |

## Install

**Plain CSS.** Copy `components/ui/seenry-ui.css`, `components/ui/seenry-ui.js`, and this folder's `tokens.css` and `system.css`. Load Inter, then the stylesheets in that order, then Lucide and the script:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap">
<link rel="stylesheet" href="seenry-ui.css">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="system.css">
<script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>
<script src="seenry-ui.js" defer></script>
<script>addEventListener('DOMContentLoaded', () => lucide.createIcons());</script>
```

Dark is the default. `data-theme="light"` on `<html>` forces light; with no attribute the page follows the light preference.

**Tailwind v4 or shadcn/ui.** Copy `tokens.css` and `theme.tailwind.css` (generated by `node scripts/system_theme.mjs assets/systems/graphite`; regenerate after editing tokens):

```css
@import "tailwindcss";
@import "./theme.tailwind.css";
```

Utilities then take graphite's values: `bg-background` (page), `bg-card` (surface), `bg-secondary` (selected grey), `border-border` (5% hairline), `text-foreground`, `text-muted-foreground`, `bg-primary text-primary-foreground` (the one white button), `text-destructive`, `rounded-sm|md|lg` (6, 8, 10), `font-sans` (Inter), `font-mono`. shadcn components read the same variables, so a stock `<Button>` comes out graphite. Keep the rules above: set shadcn's `Badge` to the outline variant, drop `shadow-*` on cards, and use `size-4 stroke-[1.5]` on Lucide icons. Add `.ui-*` classes alongside utilities when a component exists here, rather than rebuilding it.
