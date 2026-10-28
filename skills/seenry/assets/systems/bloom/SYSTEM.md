# bloom

## Character

Friendly, rounded product UI where five category hues do the talking in small doses (chips, avatars, calendar marks) and one confident violet-blue carries the primary action. It reads warm and approachable without losing the restraint of a serious tool.

**Use it for:** team scheduling and calendars, course and cohort platforms, community and membership tools, creator dashboards, education admin.
**Not for:** finance, infrastructure, security or legal products; dense data terminals; editorial or luxury brands.

## Values at a glance

| | |
| --- | --- |
| Font | Plus Jakarta Sans 400/500/600/700 (Google Fonts). No mono. |
| Type | title 700 26/32 · subtitle 700 20/28 · heading 600 16/24 · body 400 15/22 · label 500 14/20 · small 400 13/18 · stat 700 30/36 |
| Surfaces | page `--bg` warm neutral #f7f6f4, cards `--surface` white with a hairline and a near-invisible shadow; dark: #131315 page, #1b1b1e cards |
| Radius | 10 (nav items, small buttons) · 12 (buttons, inputs, menus) · 16 (cards, dialogs) · pill for segmented controls, chips, badges, switches |
| Heights | control 36 (44 on phones) · row 52 · topbar 60 · sidebar 252 |
| Accent | `--accent` #5543d9 (dark #6a5ae8): the one primary action, focus, selected state, switches, progress. Never a category. |
| Categories | `--cat-1..5` tomato, amber, green, sky, pink. Each has ink (`--cat-n`, text 4.5:1 on its tint), tint (`--cat-n-bg`) and mark (`--cat-n-mark`). |
| Charts | `--chart-1` violet for the measured series, `--chart-muted` for partial or projected, `--chart-2..5` the category marks |

System extras beyond the contract: `ui-mark` (dot, `data-shape="edge"` bar, `data-shape="square"` swatch, `data-cat`), `ui-chip` (pill filter toggle with `aria-pressed`), `ui-progress` and `ui-meter` (native `<progress>` with its number), `ui-content` (page container), `ui-topbar-actions`, `ui-search`, and `data-cat="1..5"` on `ui-badge` and `ui-avatar`.

## Rules

1. **MUST** give each category hue one meaning per product (here: a course) and use it everywhere that thing appears.
   *Because* color only helps scanning when it is a stable key.
   ```html
   <span class="ui-mark" data-cat="4"></span>Product Design Foundations   <!-- same hue in nav, list, table -->
   ```
   ```html
   <span class="ui-badge" data-cat="4">Foundations</span> ... <span class="ui-badge" data-cat="2">Foundations</span>
   ```

2. **NEVER** fill a large surface with a category hue; hues live in chips, avatars, dots and 3px edges.
   *Because* full-bleed color turns friendly into childish and fights the primary action.
   ```html
   <span class="ui-mark" data-shape="edge" data-cat="1"></span>
   ```
   ```html
   <section class="ui-section" style="background:var(--cat-1-mark)">
   ```

3. **MUST** keep exactly one filled primary button per view; everything else is secondary, ghost or danger outline.
   *Because* the violet is the only loud color the eye should find first.
   ```html
   <button class="ui-button">Invite learners</button><button class="ui-button" data-variant="primary">Schedule session</button>
   ```
   ```html
   <button class="ui-button" data-variant="primary">Invite</button><button class="ui-button" data-variant="primary">Schedule</button>
   ```

4. **MUST** write status as a word with a mark (`ui-status data-status`); category is a tinted chip (`ui-badge data-cat`).
   *Because* status and category are different questions and must never look alike.
   ```html
   <span class="ui-status" data-status="warn">Needs attention</span>
   ```
   ```html
   <span class="ui-badge" data-cat="2">Needs attention</span>
   ```

5. **MUST** use pills only for segmented controls, chips, badges, switches and pagination; buttons and inputs stay at 12px.
   *Because* the contrast between soft-rect controls and pill selectors is what makes the system read as designed.
   ```html
   <div class="ui-segmented" aria-label="When">...</div>
   ```
   ```html
   <button class="ui-button" style="border-radius:var(--r-pill)">Save</button>
   ```

6. **NEVER** type a size or color in a block or `system.css`; use tokens, and `em` for media queries (48em phone, 64em stacked layouts).
   *Because* the same markup must switch systems by swapping two stylesheets.
   ```css
   .dash-grid{gap:var(--space-5)}
   ```
   ```css
   .dash-grid{gap:20px;color:#5543d9}
   ```

7. **MUST** give people initials avatars tinted with a category hue, and name standalone avatars with `aria-label`.
   *Because* colored initials make a team feel present without stock photos.
   ```html
   <span class="ui-avatar" data-cat="3" aria-label="Daniel Reyes">DR</span>
   ```
   ```html
   <img src="avatar-placeholder.png">
   ```

8. **SHOULD** pair every completion figure with its number: `ui-meter` holds the bar and the percent.
   *Because* a bar alone cannot be read precisely.
   ```html
   <span class="ui-meter"><progress class="ui-progress" max="100" value="74" aria-label="Completion">74%</progress><b>74%</b></span>
   ```
   ```html
   <progress class="ui-progress" max="100" value="74"></progress>
   ```

9. **MUST** write labels in sentence case with no eyebrows, uppercase, numbering or emoji.
   *Because* the warmth comes from color and type, not from decoration.
   ```html
   <span class="ui-nav-label">Courses</span>
   ```
   ```html
   <span class="ui-nav-label">01 / COURSES ✨</span>
   ```

10. **NEVER** use gradients, glass, blur or glow; depth is a hairline plus `--shadow-card`, floating layers use `--shadow-float`.
    *Because* soft flat surfaces keep the many hues calm.
    ```css
    .ui-card{box-shadow:var(--shadow-card)}
    ```
    ```css
    .ui-card{background:linear-gradient(...);backdrop-filter:blur(12px)}
    ```

## Page shell

```html
<div class="ui-shell">
  <aside class="ui-sidebar">
    <button class="ui-sidebar-head">workspace avatar, name, caret</button>
    <nav class="ui-nav"> ui-nav-item (icon + label + ui-nav-count), aria-current="page" on the active one </nav>
    <nav class="ui-nav"><span class="ui-nav-label">Courses</span> ui-nav-item with a ui-mark </nav>
    <div class="ui-sidebar-foot">user avatar, name, role, sign out</div>
  </aside>
  <main>
    <header class="ui-topbar">[data-nav-toggle] menu button, breadcrumb, .ui-topbar-actions (ui-search opening the command dialog, bell)</header>
    <div class="ui-content">
      <div class="ui-page-header"> ui-page-title, ui-page-sub, ui-page-actions </div>
      ui-stat-strip, ui-section cards (ui-section-head + list, chart or table), ui-detail, ui-settings-group, ui-danger
    </div>
  </main>
</div>
```

The sidebar sits on the page color with a hairline; the active item lifts onto a white thumb. Content cards are white on the warm page. Under 48em the sidebar becomes an off-canvas panel: the block toggles `data-nav-open` on `.ui-shell` from the `[data-nav-toggle]` button (a short inline script closes it on Escape and outside click), the search collapses to an icon, stats stack, settings rows stack, and every control grows to 44px. Tables scroll inside their card.

## Icons

Phosphor 2.1.1, loaded with the pinned `<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>` from [icons](../../icons/README.md). **Duotone** for navigation, stat labels, detail-row labels and command items (things and places); **bold** for actions inside buttons and small utility glyphs (plus, search, caret, copy). 18px (`--icon`), 16px in small buttons and badges. Icons inherit text color; nav and label icons use `--text-3`, the active nav icon uses `--accent`. An icon sits before its label with an 8–12px gap; icon-only buttons carry `aria-label`.

## Charts

- **Activity over time:** vertical bars, one per week, in `--chart-1`; the current partial week in `--chart-muted` with a legend entry. Square bars, three gridlines in `--chart-grid`, a baseline in `--line-strong`, y labels in `ui-chart-axis[data-axis=y]` placed with `--p` (percent from top), x labels in `ui-chart-axis[data-axis=x]` (every other label hides on phones). The SVG uses `preserveAspectRatio="none"` with `vector-effect="non-scaling-stroke"` gridlines; every rect has a `<title>` and the figure an `aria-label` summary.
- **Completion:** `ui-meter` (progress bar plus percent) in the accent, never a donut.
- **Share across categories:** a single stacked horizontal bar using `--chart-2..5`, labelled with values.
- Lines for continuous trends only; no area fills, no 3D, no pies.

## What it never does

- Rainbow UI: every card, header or button in a different hue, or hues used as backgrounds.
- Cartoon cues: emoji, mascots, confetti, bouncing motion, oversized radii on everything.
- Duplicating meaning: a category dot inside a category-tinted chip, or a status that is only a color.
- Gradient or glass hero cards, glowing primary buttons, decorative blobs.
- Uppercase micro-labels, eyebrows above titles, numbered sections.
- Lorem ipsum, "Acme", fake round numbers that do not add up (the dashboard's 62% is the learner-weighted mean of the course rows).
