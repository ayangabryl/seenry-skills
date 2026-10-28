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
| Media tiles | `--tile-1` to `--tile-4` and `--tile-ink`, a grey ramp for placeholder art |
| Radius | 8px for controls, cards, tiles; 6px for chips and small marks; 12px for dialogs |
| Heights | control 32px (28px small, 44px touch), row 44px, table row 56px, topbar 56px, sidebar 240px |
| Accent | red-orange `#d6380a` (dark `#ff5b29` with black text). It means "selected" or "the primary action" (timeline comment markers count as selectable points). Nothing else. |

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
3. **NEVER use stock photos or gradients as placeholders.** Use the grey tile ramp and simple flat shapes. *Because* fake imagery reads as a template and fights the real work once it arrives.
   ```html
   <!-- correct --> <span class="ui-thumb" data-tone="2">…</span>
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
7. **MUST pair status color with a word and a mark** (`ui-status data-status`). *Because* color alone fails for color-blind reviewers and in grayscale exports.
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

Under 768px the sidebar becomes an off-canvas panel opened by the `[data-nav-toggle]` button (the shell gets `data-nav-open`), the breadcrumb keeps only the current page, search collapses to an icon, tiles go to two columns, and every control grows to 44px. Extra classes this system adds: `ui-main`, `ui-scrim`, `ui-nav-toggle`, `ui-search`, `ui-topbar-actions`, `ui-split`, `ui-thumb` (+ `ui-thumb-time`, `ui-thumb-tag`, `data-tone`, `data-ratio`), `ui-tiles`, `ui-tile`, `ui-player`, `ui-scrub`, `ui-comment`, `ui-timecode`, `ui-list-detail`, `ui-detail-rows`, `ui-settings`, `ui-settings-rows`, `ui-meter`. Mark `data-wide` on table cells that drop under 600px.

## Icons

Heroicons 2.2.0 (MIT), inlined as an SVG sprite at the top of each block, path data copied from `https://unpkg.com/heroicons@2.2.0/24/outline/<name>.svg` and `…/16/solid/<name>.svg`. Outline at 20px (`.ui-icon`, 1.5 stroke) in navigation and icon buttons; mini solid at 16px (`.ui-icon[data-size=sm]`) inside buttons, search and small controls. Icons take the row's text color (`--text-3` at rest in navigation, `--text` when current), sit on the label's center line with an 8–10px gap, and never decorate a heading or a stat. Icon-only buttons carry `aria-label`.

## Charts

Bars for counts per day (plays, views, uploads), a single line for a continuous rate, a stacked bar only when parts sum to a whole. Bars are `--chart-1` (black in light, white in dark) on `--chart-grid` lines with a stronger baseline, the y axis at round numbers, x labels at weekly ticks, a plain heading ("Plays per day") with the range underneath and the total on the right. Hover may use `--chart-3`. A second series uses `--chart-4` grey with a legend. Draw marks as inline SVG in a `viewBox` with `preserveAspectRatio="none"` and keep text in HTML (`ui-chart-y`, `ui-chart-axis`) so labels never stretch; give the SVG `role="img"` and a sentence `aria-label` with the peak.

## What it never does

- Accent on headings, links, icons, chart bars or decoration; a second accent color.
- Gradients, glass, glows, blurred blobs, stock imagery, emoji.
- Eyebrows, uppercase tracked labels, numbered section markers.
- Pill-shaped everything; studio is 8px.
- Thumbnails without an aspect ratio, or a media library shown as a plain table.
- Two filled primary buttons in one view; Upload and Approve never both filled.
