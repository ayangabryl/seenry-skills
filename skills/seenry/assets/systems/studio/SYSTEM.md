# studio

## Character

Black and white with a neutral grey ramp, big confident titles over small precise UI text, and the work itself (thumbnails, frames, waveforms) as the loudest thing on screen. One vivid red-orange marks what is selected and the one action that matters.

**Use it for:** creative tools, media and asset libraries, video and design review, audio and music dashboards, portfolios that behave like apps. Moods: confident, editorial, crafted.

**Not for:** finance, admin and operations (use ledger), health or care products, playful consumer apps, anything where color must carry many categories.

## Values at a glance

| | |
| --- | --- |
| Fonts | Bricolage Grotesque 500 for titles, headings and stats (tight tracking, -0.035em on titles); Instrument Sans 400/500 for all UI text; system mono for timecodes and durations |
| Type steps | title 30–44px fluid / heading 18px / stat 24–32px fluid / body 14px / label 13px 500 / small 12px / mono 12px |
| Surfaces | light: page and surface `#fff`, surface-2 `#f5f5f5`, lines `#e6e6e6` / `#d1d1d1`, text `#0a0a0a`. dark: page `#000`, surface `#0e0e0e`, lines `#262626` / `#3d3d3d`, text `#fafafa` |
| Media | real frames from `assets/frames/` (CC0 samples in blocks); `--tile-1` to `--tile-4` and `--tile-ink` for loading and empty art |
| Radius | 8px for controls, cards, tiles; 6px for chips, badges and menu items; 4px for checkboxes, inline code and sidebar project frames; 12px for dialogs, sheets and the sign-in media panel |
| Heights | control 32px (28px small and chips, 44px touch and auth fields), row 44px, table row 56px, topbar 56px, sidebar 240px, step mark 24px |
| Accent | red-orange `#d6380a` (dark `#ff5b29` with black text). It means "selected", "the primary action" or "overdue, needs you" (timeline comment markers count as selectable points). Nothing else. |

## Rules

1. **MUST use the accent only for selection and the single primary action.** *Because* a high-contrast screen has nowhere to hide a second loud color; the accent has to mean one thing.
   ```html
   <!-- correct -->  <button class="ui-button" data-variant="primary">Approve</button>
   <!-- wrong -->    <h2 style="color:var(--accent)">Recent uploads</h2>
   ```
2. **MUST show media as thumbnails with a real aspect ratio**, 16:9 for video, 1, 4:5 for stills, a waveform for audio. *Because* in a creative tool the work is the content; a filename alone hides it.
   ```html
   <!-- correct --> <span class="ui-thumb"><svg aria-hidden="true"><use href="#art-cup"/></svg><span class="ui-thumb-time">0:30</span></span>
   <!-- wrong -->   <span class="ui-badge">MOV</span> Halden_Spring_30s_v4.mov
   ```
3. **MUST show real frames, never filler.** Blocks use CC0 sample stills in `assets/frames/` (provenance in `assets/frames/manifest.json`) as stand-ins for the customer's own media; the grey `#art-*` ramp is only for loading and empty states. *Because* in a review tool the footage is the content; clip-art glyphs and gradients read as broken images.
   ```html
   <!-- correct --> <span class="ui-thumb"><img src="../assets/frames/halden-pour.jpg" alt=""><span class="ui-thumb-time">0:30</span></span>
   <!-- wrong -->   <div style="background:linear-gradient(135deg,#f0f,#0ff)"></div>
   ```
4. **MUST set the page title in the display face and everything else small.** One `ui-page-title` per page; headings are 18px. *Because* the contrast in scale is the system's voice; three medium sizes flatten it.
   ```html
   <!-- correct --> <h1 class="ui-page-title">Overview</h1>
   <!-- wrong -->   <h1 class="ui-page-title">Overview</h1><h2 class="ui-page-title">Recent uploads</h2>
   ```
5. **MUST write labels in sentence case.** *Because* uppercase tracked labels are an eyebrow and add noise above already precise text.
   ```html
   <!-- correct --> <p class="ui-nav-label">Active projects</p>
   <!-- wrong -->   <p class="ui-nav-label" style="text-transform:uppercase">ACTIVE PROJECTS</p>
   ```
6. **MUST put durations, timecodes and counts in tabular figures**; timecodes and durations in mono. *Because* editors scan them in columns and on frames.
   ```html
   <!-- correct --> <span class="ui-timecode">0:11</span>
   <!-- wrong -->   <b>0:11</b>
   ```
7. **MUST pair every status with a word and a shaped mark** (`ui-status data-status`): hollow for idle, half for in review, dashed for changes requested, filled for approved, all in the grey ramp; only `bad` (overdue) takes the accent, because it is the one row that needs you. *Because* color alone fails for color-blind reviewers, and a rainbow of states would compete with the work.
   ```html
   <!-- correct --> <span class="ui-status" data-status="warn">Changes requested</span>
   <!-- wrong -->   <span style="color:var(--warn)">●</span>
   ```
8. **SHOULD invert tooltips and toasts** (text color as background). *Because* that is how creative tools float small messages over busy canvases.
   ```html
   <!-- correct --> <div class="ui-tooltip" role="tooltip" popover="manual">Download original</div>
   <!-- wrong -->   <div class="ui-card">Download original</div>
   ```
9. **NEVER add shadows to resting surfaces.** Cards and tables use a 1px line; only floating layers get `--shadow-float`. *Because* depth is saved for things that sit above the page.
   ```html
   <!-- correct --> <section class="ui-card">…</section>
   <!-- wrong -->   <section class="ui-card" style="box-shadow:0 8px 24px #0002">…</section>
   ```
10. **MUST keep every value in tokens.css.** `system.css` and blocks use `var(--…)` only; media-query breakpoints are the one exception. *Because* the same markup must switch systems by swapping two links.
    ```css
    /* correct */ .ui-tile{gap:var(--space-2)}
    /* wrong */   .ui-tile{gap:8px}
    ```

11. **MUST give every project and asset its own frame.** Sidebar projects carry a 24px key-frame tile (`ui-thumb data-ratio="square"` inside `ui-nav-item`), never a shared grey dot. *Because* editors find work by picture before name; identical marks make the list a wall of text.
    ```html
    <!-- correct --> <a class="ui-nav-item" href="#"><span class="ui-thumb" data-ratio="square" data-tone="3" aria-hidden="true"><svg><use href="#art-stage"/></svg></span><span>Low Tide video</span></a>
    <!-- wrong -->   <a class="ui-nav-item" href="#"><span class="dot"></span><span>Low Tide video</span></a>
    ```
12. **MUST show measured usage with `<meter>` and work in flight with `<progress>`,** the number beside the bar. *Because* the native elements carry the value to assistive tech, and a bar without its number makes people guess.
    ```html
    <!-- correct --> <div class="ui-measure"><div class="ui-measure-head"><label for="s">Storage</label><span>1.82 of 3 TB</span></div><meter class="ui-meter" id="s" min="0" max="3" low="2.4" high="2.85" optimum="0" value="1.82"></meter></div>
    <!-- wrong -->   <div class="bar"><span style="width:61%"></span></div>
    ```

## Page shell

```html
<div class="ui-shell">
  <aside class="ui-sidebar" id="sidebar">ui-sidebar-head · ui-nav (ui-nav-label, ui-nav-item, ui-nav-count) · ui-sidebar-foot</aside>
  <div class="ui-scrim" aria-hidden="true"></div>
  <div class="ui-main">
    <header class="ui-topbar">menu button (ui-nav-toggle) · breadcrumb · ui-search · icon buttons</header>
    <main class="ui-page">
      <header class="ui-page-header"><div><h1 class="ui-page-title"/><p class="ui-page-sub"/></div><div class="ui-page-actions"/></header>
      ui-stat-strip · ui-section (ui-section-head + ui-tiles / ui-list / ui-table-wrap) · ui-split · ui-chart · ui-list-detail · ui-settings
    </main>
  </div>
</div>
```

Under 768px the sidebar becomes a drawer: the `[data-nav-toggle]` button in the top bar opens it, seenry-ui.js sets `data-nav-open` on `.ui-shell`, and system.css slides the sidebar in and shows `.ui-scrim`. Outside click, Escape and focus return are handled by the script; blocks carry no nav script. The breadcrumb keeps only the current page, search collapses to an icon, tiles go to two columns, steps show only the current label, and every control, chip, switch row and text link grows to 44px.

Screens without the shell: `ui-auth-page` (sign-in: `ui-auth-side` with the `ui-auth` frame, `ui-auth-media` with a frame of real work, hidden under 1024px) and `ui-onboard-page` (first run: `ui-onboard-bar`, `ui-onboard` with `ui-steps` and a `ui-question` on the left, a live `ui-onboard-preview` of the empty project on the right).

Blocks: [dashboard](blocks/dashboard.html), [list-detail](blocks/list-detail.html), [detail](blocks/detail.html), [settings](blocks/settings.html), [billing](blocks/billing.html), [onboarding](blocks/onboarding.html), [sign-in](blocks/sign-in.html). Every component in every state, both themes: [gallery](gallery.html).

## Icons

Heroicons 2.2.0 (MIT), outline 24 and mini solid 16, inlined as an SVG sprite at the top of each block, path data copied from `https://unpkg.com/heroicons@2.2.0/24/outline/<name>.svg` and `…/16/solid/<name>.svg`. Outline at 20px (`.ui-icon`, 1.5 stroke) in navigation and icon buttons; mini solid at 16px (`.ui-icon[data-size=sm]`) inside buttons, search and small controls. Icons take the row's text color (`--text-3` at rest in navigation, `--text` when current), sit on the label's center line with an 8–10px gap, and never decorate a heading or a stat. Icon-only buttons carry `aria-label`.

## Charts

Bars for counts per day (plays, views, uploads), a single line for a continuous rate, a stacked bar only when parts sum to a whole. Bars are `--chart-1` (black in light, white in dark) on `--chart-grid` lines with a stronger baseline, the y axis at round numbers, x labels at weekly ticks, a plain heading ("Plays per day") with the range underneath and the total on the right. Hover may use `--chart-3`. A second series uses `--chart-4` grey with a legend. Draw marks as inline SVG in a `viewBox` with `preserveAspectRatio="none"` and keep text in HTML (`ui-chart-y`, `ui-chart-axis`) so labels never stretch; give the SVG `role="img"` and a sentence `aria-label` with the peak.

## What it never does

- Accent on headings, links, icons, chart bars or decoration; a second accent color.
- Gradients, glass, glows, blurred blobs, stock imagery, emoji.
- Eyebrows, uppercase tracked labels, numbered section markers.
- Pill-shaped everything; studio is 8px.
- Thumbnails without an aspect ratio, or a media library shown as a plain table.
- Two filled primary buttons in one view; Upload and Approve never both filled.
- A grey dot or generic folder icon standing in for a project in navigation.
- Tinted cards for every alert; only warn and bad tint their background, info and ok stay on the surface with a colored icon.

## Component index

Markup is the minimum; see [gallery.html](gallery.html) for every state and the seenry-ui [README](../../components/ui/README.md) for behavior.

| Class | What it is | Markup |
| --- | --- | --- |
| `ui-button` | Action; `data-variant="primary|ghost|danger"`, `data-size="sm|lg"`, `data-icon`, `data-loading` | `<button class="ui-button" data-variant="primary">Approve v4</button>` |
| `ui-field`, `ui-label`, `ui-help`, `ui-error` | Labelled field with help or error (`data-invalid`) | `<label class="ui-field"><span class="ui-label">Client</span><input class="ui-input"></label>` |
| `ui-input`, `ui-textarea`, `ui-select` | Text, long text, native select | `<select class="ui-select"><option>23.976 fps</option></select>` |
| `ui-control`, `ui-affix` | Input with a leading icon or unit | `<span class="ui-control"><span class="ui-affix">…</span><input class="ui-input"></span>` |
| `ui-combobox` | `<input list>` with a datalist, chevron drawn by the system | `<label class="ui-field ui-combobox"><span class="ui-label">Reviewer</span><input class="ui-input" list="p"><datalist id="p">…</datalist></label>` |
| `ui-choice`, `ui-radio-group` | Checkbox or radio with its label | `<label class="ui-choice"><input type="checkbox"><span>Burn in timecode</span></label>` |
| `ui-switch` | Setting that applies at once | `<label class="ui-switch"><input type="checkbox" role="switch"><span>Guest comments</span></label>` |
| `ui-slider` | Range with its value in mono; set `--fill` on input | `<label class="ui-slider"><span class="ui-label">Quality</span><input type="range"><output>62%</output></label>` |
| `ui-segmented` | Small exclusive view switch | `<div class="ui-segmented" aria-label="View"><button aria-pressed="true">Grid</button>…</div>` |
| `ui-chip`, `ui-chips` | Filter chip, `aria-pressed` for selected | `<button class="ui-chip" aria-pressed="true">Video <small>14</small></button>` |
| `ui-tabs`, `ui-tab-panel` | Panels at one level | `<div class="ui-tabs" role="tablist"><button role="tab" aria-selected="true">Comments</button></div>` |
| `ui-steps`, `ui-step` | Stepper; `data-done`, `aria-current="step"`, `data-orientation="vertical"` | `<ol class="ui-steps"><li class="ui-step" data-done><span>Workspace</span></li>…</ol>` |
| `ui-breadcrumb` | Place in the hierarchy | `<ol class="ui-breadcrumb"><li><a href="#">Northlight</a></li><li aria-current="page">Billing</li></ol>` |
| `ui-pagination` | Pages of a table | `<nav class="ui-pagination"><button aria-current="page">1</button></nav>` |
| `ui-kbd` | A real shortcut | `<span class="ui-kbd">⌘K</span>` |
| `ui-menu` | Action menu (popover) | `<div class="ui-menu" role="menu" popover="auto"><button role="menuitem">Rename</button></div>` |
| `ui-tooltip` | Inverted supporting text | `<div class="ui-tooltip" role="tooltip" popover="manual">Kept 30 days</div>` |
| `ui-dialog`, `ui-sheet`, `ui-command` | Modal, side sheet, ⌘K menu (native dialog) | `<dialog class="ui-dialog"><div class="ui-dialog__head"><h2>Delete?</h2></div>…</dialog>` |
| `ui-toast-stack` | Inverted toasts from `SeenryUI.toast()` | `<button data-toast-message="Link copied">Copy</button>` |
| `ui-accordion` | Optional detail | `<details class="ui-accordion"><summary>Who can see this?</summary>…</details>` |
| `ui-alert` | Inline banner, `data-status`; icon, one sentence, one action | `<div class="ui-alert" data-status="warn"><svg…/><p>Card expires in December.</p><button class="ui-button">Update card</button></div>` |
| `ui-status` | State word with a mark, `data-status="ok|warn|bad|info|idle"` | `<span class="ui-status" data-status="ok">Approved</span>` |
| `ui-badge` | Category or format; `data-tone="accent"` only for new | `<span class="ui-badge">ProRes 422 HQ</span>` |
| `ui-progress` | `<progress>` for work, indeterminate pulses | `<progress class="ui-progress" max="100" value="62"></progress>` |
| `ui-meter`, `ui-measure` | `<meter>` for usage against a limit, with label and number row | `<meter class="ui-meter" min="0" max="15" low="12" high="14.5" optimum="0" value="14"></meter>` |
| `ui-skeleton` | Loading shape, pulses | `<span class="ui-skeleton"></span>` |
| `ui-empty`, `ui-dropzone` | Nothing here yet, with one action; dashed drop target | `<div class="ui-dropzone"><h3>No footage yet</h3><button class="ui-button">Choose files</button></div>` |
| `ui-avatar`, `ui-avatar-group` | Initials or photo | `<span class="ui-avatar" aria-label="Maya Okafor">MO</span>` |
| `ui-card` | Group on the page; `data-link` for a whole-card link | `<article class="ui-card"><h3>Halden spring spot</h3></article>` |
| `ui-stat-strip`, `ui-stat` | Up to three figures | `<div class="ui-stat-strip"><dl class="ui-stat"><dt>Open comments</dt><dd>146</dd></dl></div>` |
| `ui-table-wrap`, `ui-table` | Comparable records, `data-sort`, `.num`, `data-wide` cells drop on phones | `<div class="ui-table-wrap"><table class="ui-table" data-ui-table>…</table></div>` |
| `ui-list`, `ui-list-item`, `ui-list-meta` | Rows with thumb or avatar; `data-selectable` + `aria-selected` | `<ul class="ui-list"><li class="ui-list-item"><span class="ui-thumb">…</span><div><strong>v4</strong><span class="ui-list-meta">0:30</span></div></li></ul>` |
| `ui-data-list` | `<dl>` of facts; `data-inline` for columns | `<dl class="ui-data-list"><div><dt>Codec</dt><dd>ProRes 422 HQ</dd></div></dl>` |
| `ui-timeline`, `ui-timeline-item`, `ui-timeline-mark` | Activity: who, what, when; `data-status` tints the mark | `<ol class="ui-timeline"><li class="ui-timeline-item"><span class="ui-timeline-mark">…</span><div><p><strong>Ines</strong> requested changes</p></div><time>40m</time></li></ol>` |
| `ui-code`, `ui-code-head` | Inline code, or a block with `[data-copy]` | `<div class="ui-code"><pre><code>…</code></pre><button class="ui-button" data-icon data-copy aria-label="Copy">…</button></div>` |
| `ui-chart`, `ui-chart-head`, `ui-chart-plot`, `ui-chart-y`, `ui-chart-axis`, `ui-chart-legend` | Bar or line chart in inline SVG, labels in HTML | see [dashboard](blocks/dashboard.html) |
| `ui-filter-bar`, `ui-filter-count` | Search, chips or segmented, count | `<div class="ui-filter-bar">…<small class="ui-filter-count">14 of 24</small></div>` |
| `ui-thumb` (+ `-time`, `-tag`, `data-tone`, `data-ratio`) | The work: 16:9, square or 4:5 frame | `<span class="ui-thumb" data-tone="2"><svg><use href="#art-cup"/></svg><span class="ui-thumb-time">0:30</span></span>` |
| `ui-tiles`, `ui-tile` | Media grid | `<div class="ui-tiles"><a class="ui-tile" href="#"><span class="ui-thumb">…</span><span class="ui-tile-text"><strong>…</strong></span></a></div>` |
| `ui-player`, `ui-scrub`, `ui-player-bar`, `ui-comment`, `ui-timecode` | Review player with comment markers, timecoded comments | see [detail](blocks/detail.html) |
| `ui-shell`, `ui-sidebar(-head, -foot)`, `ui-nav(-label, -item, -count)`, `ui-topbar`, `ui-search`, `ui-main`, `ui-scrim` | App frame | see Page shell |
| `ui-page-header`, `ui-page-title`, `ui-page-sub`, `ui-page-actions`, `ui-title-row` | The one h1, status beside it, actions | `<header class="ui-page-header"><div><h1 class="ui-page-title">Billing</h1></div></header>` |
| `ui-section`, `ui-section-head`, `ui-split`, `ui-list-detail`, `ui-asset`, `ui-asset-side` | Page layouts | `<section class="ui-section"><div class="ui-section-head"><h2>Invoices</h2></div>…</section>` |
| `ui-detail`, `ui-detail-head`, `ui-detail-row` | Selection panel in list-detail | `<div class="ui-detail-row"><dt>Codec</dt><dd>ProRes</dd></div>` |
| `ui-settings`, `ui-settings-group`, `ui-settings-rows`, `ui-settings-row`, `ui-danger` | Grouped settings and the destructive zone | `<div class="ui-settings-row"><div><strong>Watermark</strong></div><label class="ui-switch">…</label></div>` |
| `ui-plan`, `ui-plan-price`, `ui-usage`, `ui-pay`, `ui-pay-mark` | Billing: plan, usage grid, card on file | see [billing](blocks/billing.html) |
| `ui-auth-page`, `ui-auth`, `ui-auth-mark`, `ui-auth-providers`, `ui-auth-divider`, `ui-auth-row`, `ui-auth-legal`, `ui-auth-media` | Sign-in frame | see [sign-in](blocks/sign-in.html) |
| `ui-onboard-page`, `ui-onboard`, `ui-question`, `ui-option-grid`, `ui-option`, `ui-onboard-preview` | First run | see [onboarding](blocks/onboarding.html) |

## Anti-slop checks for studio

Before shipping a studio screen, check each; any yes is a fix.

- Is the accent on anything that is not selected and not the one primary action (a heading, a link, a chart bar at rest, an icon, a badge other than "New")?
- Is there more than one filled button visible?
- Does any media appear as a filename or an extension badge without a frame?
- Do sidebar projects, assets or versions share one identical mark?
- Is there a gradient, glow, glass, blurred blob, stock photo or emoji?
- Is any label uppercase and tracked, or a section numbered "01"?
- Is there a second large title, or a heading bigger than 18px below the page title?
- Is a timecode, duration, count or price in proportional figures?
- Does a status rely on color alone, or does an alert lack its icon and sentence?
- Does a resting card, table or tile carry a shadow?
- Is any value typed in a block or system.css instead of read from tokens.css?
- Is a usage bar a `div` instead of `<meter>`, or missing its number?

## Coverage gaps

Compared with the larger published systems (around 55 components, 7 blocks), studio does not yet ship:

- Date and time pickers (use a native `<input type="date">` styled as `ui-input`), a calendar, and a range picker.
- A rich-text editor and mentions in comments; the composer in [detail](blocks/detail.html) is a plain textarea.
- A file-upload list with per-file progress rows (compose from `ui-list` and `ui-progress`).
- Drag-to-reorder, a resizable split pane, and a compare (wipe or side-by-side) player.
- A popover with form content, a hover card, and a context menu on right click.
- Multi-series charts beyond bars and one line: area, stacked bars with a legend, and sparklines in tables.
- `[data-copy]` and the slider `--fill` are wired by a short inline script in the gallery; seenry-ui.js does not handle them yet.

## Install

**Plain CSS.** Copy `seenry-ui.css`, `seenry-ui.js`, `tokens.css` and `system.css`, then load in this order:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..600&family=Instrument+Sans:wght@400..600&display=swap">
<link rel="stylesheet" href="seenry-ui.css">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="system.css">
<script src="seenry-ui.js" defer></script>
```

Copy the icon sprite from any block (Heroicons outline 24 as `#i-*`, mini 16 as `#m-*`, placeholder art as `#art-*`). Light is the default; `data-theme="dark"` on `<html>` forces dark, and an unset theme follows the system.

**Tailwind v4 or shadcn/ui.** Copy `tokens.css` and [theme.tailwind.css](theme.tailwind.css) (generated by `scripts/system_theme.mjs`) and import after Tailwind:

```css
@import "tailwindcss";
@import "./theme.tailwind.css";
```

`bg-primary` is the red-orange accent, `bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `border-input` and `rounded-lg` map to studio's values, and shadcn components pick them up without renaming. Keep studio's rules: use `bg-primary` on one button per view, set titles with `font-(family-name:--font-display)` (the theme maps only sans and mono), and add `tabular-nums` to figures. After changing `tokens.css`, run `node scripts/system_theme.mjs assets/systems/studio`.
