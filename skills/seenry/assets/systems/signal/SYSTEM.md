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
| Surfaces (dark, default) | bg `#0b0e12` → surface `#11151a` → surface-2 `#171c22`; hairlines `#232a32` / `#38424d` |
| Surfaces (light) | bg `#f5f6f8` → surface `#fff` → surface-2 `#f0f2f5`; hairlines `#dfe3e8` / `#c3cad3` |
| Radius | 2px on everything; 4px only on dialogs |
| Density | 32px rows and controls, 48px top bar, 232px sidebar, 24px gutter (16px on phone) |
| Accent | cobalt `#2f62ff` (light `#1f4fe0`): the primary action, live state, the focused chart series, the current nav item and selection rule. Nothing else. |
| Status | ok green, warn amber, bad red, idle grey; always a 6px square mark plus a word |

Default theme is dark. `data-theme="light"` or a light OS preference switches it.

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
   .ui-panel{border:var(--hair) solid var(--line)}
   .ui-panel{box-shadow:0 4px 12px rgba(0,0,0,.3)}
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
11. **SHOULD** write labels in sentence case, never uppercase tracked eyebrows. *Because* mono already marks a label; uppercase on top reads as a template.
    ```html
    <span class="ui-nav-label">Configuration</span>
    <span class="ui-nav-label">CONFIGURATION</span>
    ```

## Page shell

```html
<div class="ui-shell">
  <aside class="ui-sidebar" id="sidebar">
    <div class="ui-sidebar-head">workspace switcher</div>
    <nav class="ui-nav"><span class="ui-nav-label">project</span><a class="ui-nav-item" aria-current="page"><i class="ri-…-line"></i>Overview<span class="ui-nav-count">7</span></a></nav>
    <div class="ui-sidebar-foot">account</div>
  </aside>
  <div class="ui-main">
    <header class="ui-topbar"><button class="ui-button ui-menu-button" aria-controls="sidebar" aria-expanded="false">…</button><nav><ol class="ui-breadcrumb">…</ol></nav><div class="ui-topbar-actions">search · bell</div></header>
    <main class="ui-content">
      <div class="ui-page-header"><div><h1 class="ui-page-title"/><p class="ui-page-sub"/></div><div class="ui-page-actions"/></div>
      …sections, panels (.ui-panel / .ui-panel-head / .ui-panel-body), tables
    </main>
  </div>
</div>
```

- The breadcrumb names the environment (`workspace / project / environment`); the h1 names the page.
- Layout helpers: `.signal-split` (chart 2fr beside a 1fr list), `.signal-pane` (list beside a 440px `ui-detail`), `.signal-narrow` (880px column for settings).
- Under 768px the sidebar hides behind the menu button (toggle `aria-expanded`; CSS does the rest), the breadcrumb keeps only its last item, grids stack and page actions fill the width.

## Icons

Remix Icon, line style only, 16px, from `https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css` (Apache-2.0). Write `<i class="ri-server-line"></i>`; never mix `-fill`. Icons sit 8px before their label on one center line and take the row's text color: `--text-3` at rest, `--text` when current, the status color on status rows (`<i data-tone="warn">`). Icon-only buttons carry `aria-label`.

## Charts

Inline SVG with `viewBox="0 0 720 100" preserveAspectRatio="none"`; strokes use `vector-effect:non-scaling-stroke`, labels are HTML so they never stretch. Structure: `.ui-chart` › `.ui-chart-legend` › `.ui-chart-plot` (y labels · svg · end tags) › `.ui-chart-axis`.

- **Latency or rate over time:** lines. p95 is the focused series (`.s1`, accent, 2px); p50 and others are grey (`.s2`, `.s3`, 1.5px). Gridlines at round values, units on the top y label, end tags with the last value.
- **Counts per interval (errors, jobs):** bars, one per bucket, grey (`.bar`); buckets over the alert threshold use `.bar.hot` with a dashed `.threshold` line labelled in the tag column.
- **Shared time axis:** stack latency above errors in one panel; both use the same x scale. Deploys are a dashed `.marker` with the short SHA.
- **Composition (status codes, regions):** stacked bars over time with `--chart-1…5`. No pies, donuts, gauges, area gradients or 3D.

## What it never does

- Glow, gradients, glass, neon green on black, scanlines, blinking cursors, ASCII art or `> prompt` copy: terminal cosplay.
- More than one blue thing competing: accent links, accent icons, accent badges.
- Rounded cards, pill badges, soft shadows under panels.
- Uppercase tracked eyebrows, numbered sections, decorative icons on stats.
- Made-up precision (`99.99999%`) or placeholder data; use real-shaped IDs, SHAs, regions and UTC times.
- Sparklines in every cell. One chart that answers the question beats twelve that decorate.
