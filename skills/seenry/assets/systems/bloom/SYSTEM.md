# bloom

## Character

Friendly, rounded product UI where five category hues do the talking in small doses (chips, avatars, dots) and one confident violet-blue carries the primary action. It reads warm and approachable without losing the restraint of a serious tool.

**Use it for:** team scheduling and calendars, course and cohort platforms, community and membership tools, creator dashboards, education admin.
**Not for:** finance, infrastructure, security or legal products; dense data terminals; editorial or luxury brands.

## Values at a glance

| | |
| --- | --- |
| Font | Plus Jakarta Sans 400/500/600/700 (Google Fonts). Code uses the system mono stack (`--font-mono`); no web mono is loaded. |
| Type | title 600 26/32 · subtitle 600 20/28 · heading 600 16/24 · body 400 15/22 · label 500 14/20 · small 400 13/18 · stat 600 30/36 |
| Surfaces | page `--bg` warm neutral #f7f6f4, cards `--surface` white with a hairline and a near-invisible shadow, insets `--surface-2`; dark: #131315 page, #1b1b1e cards |
| Radius | 10 (nav items, small buttons) · 12 (buttons, inputs, menus, alerts, code) · 16 (cards, dialogs, auth frame) · pill for chips, badges, segmented controls, switches, pagination, bars |
| Heights | control 36 (44 on phones) · small 32 · large 44 · row 52 · topbar 60 · sidebar 252 |
| Accent | `--accent` #5543d9 (dark #6a5ae8): the one primary action, focus, selected state, switches, progress, the current step. Never a category. |
| Categories | `--cat-1..5` tomato, amber, green, sky, pink. Each has ink (`--cat-n`, text 4.5:1 on its tint), tint (`--cat-n-bg`) and mark (`--cat-n-mark`). |
| Status | `--ok --warn --bad --info` as text, `-bg` tints for alerts, `--warn-fill --bad-fill` for meter bars near a limit |
| Charts | `--chart-muted` for past periods (`data-series="past"`), `--chart-1` violet only for the current one, `--chart-grid` for slots still to come (`data-series="empty"`), `--chart-2..5` the category marks |

One system extra beyond the contract: `ui-mark`, the category dot (`data-cat="1..5"`, `accent`, `muted`; `data-shape="square"` for legends). `data-cat` also tints `ui-badge` and `ui-avatar`.

## Rules

1. **MUST** give each category hue one meaning per product (here: a course) and use it everywhere that thing appears.
   *Because* color only helps scanning when it is a stable key.
   ```html
   <span class="ui-mark" data-cat="4"></span>Product Design Foundations   <!-- same hue in nav, list, table -->
   ```
   ```html
   <span class="ui-badge" data-cat="4">Foundations</span> ... <span class="ui-badge" data-cat="2">Foundations</span>
   ```

2. **NEVER** fill a large surface or draw a rail with a category hue; hues live in 8px dots, chips and avatars.
   *Because* full-bleed color turns friendly into childish, and colored left rails read as generated.
   ```html
   <span class="ui-list-meta"><span class="ui-mark" data-cat="1"></span>Interaction &amp; Motion · Studio 2</span>
   ```
   ```html
   <li class="ui-list-item" style="border-left:3px solid var(--cat-1-mark)">
   ```

3. **MUST** keep exactly one filled primary button per view; everything else is secondary, ghost or danger outline.
   *Because* the violet is the only loud color the eye should find first.
   ```html
   <button class="ui-button">Invite learners</button><button class="ui-button" data-variant="primary">Schedule session</button>
   ```
   ```html
   <button class="ui-button" data-variant="primary">Invite</button><button class="ui-button" data-variant="primary">Schedule</button>
   ```

4. **MUST** write status as a word in ink with a colored mark (`ui-status data-status`); category is a tinted chip or a dot (`data-cat`).
   *Because* status and category are different questions, and coloring only the mark keeps a red status from colliding with the tomato course.
   ```html
   <span class="ui-status" data-status="warn">Needs attention</span>
   ```
   ```html
   <span class="ui-badge" data-cat="2">Needs attention</span>
   ```

5. **MUST** use pills only for chips, badges, segmented controls, switches, pagination and bars; buttons and inputs stay at 12px.
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

8. **MUST** pair every bar with its number: `<progress>` for work done, `<meter>` with `low high optimum` for usage against a limit.
   *Because* a bar alone cannot be read precisely, and only a meter can turn amber near the limit.
   ```html
   <span class="ui-meter"><meter min="0" max="200" low="160" high="190" optimum="80" value="184">184 of 200</meter><b>184 <small>/ 200</small></b></span>
   ```
   ```html
   <progress class="ui-progress" max="200" value="184"></progress>
   ```

9. **MUST** write labels in sentence case with no eyebrows, uppercase, numbering or emoji.
   *Because* the warmth comes from color and type, not from decoration.
   ```html
   <span class="ui-nav-label">Courses</span>
   ```
   ```html
   <span class="ui-nav-label">01 / COURSES</span>
   ```

10. **NEVER** use gradients, glass, blur or glow; depth is a hairline plus `--shadow-card`, floating layers use `--shadow-float`.
    *Because* soft flat surfaces keep the many hues calm.
    ```css
    .ui-card{box-shadow:var(--shadow-card)}
    ```
    ```css
    .ui-card{background:linear-gradient(...);backdrop-filter:blur(12px)}
    ```

11. **SHOULD** put an alert next to the thing it is about, with one sentence and at most one secondary action.
    *Because* a banner that explains the problem and offers the fix saves a trip; a stack of banners is noise.
    ```html
    <div class="ui-alert" data-status="warn"><i class="ph-duotone ph-hourglass-medium"></i><p><strong>3 learners are on the waitlist.</strong> The main hall seats 60.</p><button class="ui-button" data-size="sm">Move to main hall</button></div>
    ```
    ```html
    <div class="ui-alert" data-status="warn"><p>Warning!</p><button class="ui-button" data-variant="primary">Fix now</button></div>
    ```

12. **SHOULD** ask one question per onboarding step and open the product on an empty state that names what will appear there.
    *Because* first-run screens are where a friendly system earns trust; a form wall loses it.
    ```html
    <div class="ui-empty"><h3>No sessions yet</h3><p>Once your first course has a session, this week's schedule shows up here.</p></div>
    ```
    ```html
    <div class="ui-empty"><h3>Nothing here</h3></div>
    ```

## Page shell

```html
<div class="ui-shell">
  <aside class="ui-sidebar" id="sidebar">
    <button class="ui-sidebar-head">workspace avatar, name, caret</button>
    <nav class="ui-nav"> ui-nav-item (icon + label + ui-nav-count), aria-current="page" on the active one </nav>
    <nav class="ui-nav"><span class="ui-nav-label">Courses</span> ui-nav-item with a ui-mark </nav>
    <div class="ui-sidebar-foot">user avatar, name, role, sign out</div>
  </aside>
  <main>
    <header class="ui-topbar">
      <button class="ui-button" data-variant="ghost" data-icon data-nav-toggle aria-controls="sidebar" aria-label="Open navigation">…</button>
      <nav aria-label="Breadcrumb"><ol class="ui-breadcrumb">…</ol></nav>
      <button class="ui-button" data-dialog-open="cmd"><i…></i><span>Search</span><span class="ui-kbd">⌘ K</span></button>
      <button class="ui-button" data-variant="ghost" data-icon aria-label="Notifications">…</button>
    </header>
    <div>
      <div class="ui-page-header"> ui-page-title, ui-page-sub, ui-page-actions </div>
      ui-alert, ui-stat-strip, ui-section cards (ui-section-head + list, chart or table), ui-settings-group, ui-danger
    </div>
  </main>
</div>
```

The first element after the topbar is the page container: centered, `--content-max` wide, `--gutter` sides; no wrapper class is needed. The breadcrumb takes the free width, so buttons after it sit right; a topbar button holding a `ui-kbd` becomes the search field. The sidebar sits on the page color with a hairline; the active item lifts onto a white thumb. Under 48em the sidebar becomes a drawer opened by the `[data-nav-toggle]` button (seenry-ui.js sets `data-nav-open` on `.ui-shell`, closes on Escape and outside click; blocks carry no script), the search collapses to an icon, stats and settings rows stack, and every control grows to 44px. Tables scroll inside their card. Sign-in pages skip the shell and use `ui-auth`.

## Icons

Phosphor 2.1.1, loaded with the pinned `<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>` from [icons](../../icons/README.md). **Duotone** for navigation, stat labels, data-list labels, alerts, empty states and command items (things and places); **bold** for actions inside buttons, timeline markers and small utility glyphs (plus, search, caret, copy). 18px (`--icon`), 16px in small buttons, chips and timeline markers, 20px in alerts. Icons inherit text color; nav and label icons use `--text-3`, the active nav icon uses `--accent`, alert icons take the status color. An icon sits before its label with an 8–12px gap; icon-only buttons carry `aria-label`.

## Charts

- **Activity over time:** vertical bars in the product's own unit (cohort weeks, not calendar dates), past weeks in `--chart-muted` (`data-series="past"`), the current week in violet `--chart-1`, weeks still to come as `data-series="empty"` slots, legend "Past weeks / Week 7, so far / Upcoming". Square bars, three gridlines in `--chart-grid`, a baseline in `--line-strong`, y labels in `ui-chart-axis[data-axis=y]` placed with `--p` (percent from top), x labels in `ui-chart-axis[data-axis=x]` (every other label hides on phones). The SVG uses `preserveAspectRatio="none"` with `vector-effect="non-scaling-stroke"` gridlines; every rect has a `<title>` and the figure an `aria-label` summary.
- **Completion and usage:** `ui-progress` or `ui-meter` with the number beside, never a donut. A per-course bar takes the course hue with `data-cat` on `ui-progress`; `data-shape="segments"` draws it as segments (`--segments`, default 12), used for the cohort's weeks under the Overview title.
- **Share across categories:** one stacked horizontal bar in the category marks, with a legend that carries the values.
- Lines for continuous trends only; no area fills, no 3D, no pies.

## What it never does

- Rainbow UI: every card, header or button in a different hue, or hues used as backgrounds.
- Cartoon cues: emoji, mascots, confetti, bouncing motion, oversized radii on everything.
- Duplicating meaning: a category dot inside a category-tinted chip, or a status that is only a color.
- Gradient or glass hero cards, glowing primary buttons, decorative blobs.
- Uppercase micro-labels, eyebrows above titles, numbered sections.
- Lorem ipsum, "Acme", fake round numbers that do not add up (the dashboard's 62% is the learner-weighted mean of the course rows; billing's 200 seats are the plan's 175 plus the 25 bought in June).

## Component index

Open [gallery.html](gallery.html) for every state in both themes. Markup for the seenry-ui components is in [the seenry-ui README](../../components/ui/README.md).

| Class | What it is | Markup |
| --- | --- | --- |
| `ui-button` | action; `data-variant` primary, ghost, danger; `data-size` sm, lg; `data-icon`; `data-loading` | `<button class="ui-button" data-variant="primary">Schedule session</button>` |
| `ui-field` `ui-label` `ui-input` `ui-textarea` `ui-help` `ui-error` | labelled text entry; `data-invalid` on the field | `<label class="ui-field"><span class="ui-label">Name</span><input class="ui-input"></label>` |
| `ui-control` `ui-affix` | input with a leading icon or unit | `<span class="ui-control"><span class="ui-affix">…</span><input class="ui-input"></span>` |
| `ui-select` | native select | `<select class="ui-select">…</select>` |
| `ui-combobox` | input with a datalist and a caret | `<span class="ui-combobox"><input list="zones"></span><datalist id="zones">…</datalist>` |
| `ui-slider` | range with its value; seenry-ui.js sets `--fill` from the value | `<span class="ui-slider"><input type="range" style="--fill:67%"><output>12 weeks</output></span>` |
| `ui-choice` `ui-radio-group` | checkbox or radio with label and help | `<label class="ui-choice"><input type="checkbox"><span>Send reminders</span></label>` |
| `ui-switch` | immediate on/off setting | `<label class="ui-switch"><input type="checkbox" role="switch"><span>Waitlist</span></label>` |
| `ui-segmented` | switch a view | `<div class="ui-segmented" aria-label="When"><button aria-pressed="true">Upcoming</button>…</div>` |
| `ui-chip` | filter or choice; `aria-pressed`, optional `<small>` count | `<button class="ui-chip" aria-pressed="false"><span class="ui-mark" data-cat="4"></span>Foundations</button>` |
| `ui-tabs` `ui-tab-panel` | same-level panels | `<div class="ui-tabs" role="tablist"><button role="tab" aria-selected="true">…</button></div>` |
| `ui-breadcrumb` | place in the hierarchy | `<ol class="ui-breadcrumb"><li><a href="#">Sessions</a></li><li aria-current="page">…</li></ol>` |
| `ui-pagination` | page buttons | `<nav class="ui-pagination"><button aria-current="page">1</button>…</nav>` |
| `ui-steps` `ui-step` | stepper; earlier steps show a check | `<ol class="ui-steps"><li class="ui-step" aria-current="step"><span>First course</span></li></ol>` |
| `ui-menu` | action popover | `<div class="ui-menu" role="menu" popover="auto"><button role="menuitem">Duplicate</button></div>` |
| `ui-tooltip` | supporting hint | `<div class="ui-tooltip" role="tooltip" popover="manual">…</div>` |
| `ui-dialog` `ui-sheet` | modal task, side task | `<dialog class="ui-dialog"><div class="ui-dialog__head">…</div></dialog>` |
| `ui-command` | ⌘K command menu | `<dialog class="ui-command"><input type="search"><div class="ui-command__list">…</div></dialog>` |
| `ui-toast-stack` `ui-toast` | brief result | `<button data-toast-message="Link copied">Copy</button>` |
| `ui-accordion` | optional detail | `<details class="ui-accordion"><summary>…</summary><div class="ui-accordion__body">…</div></details>` |
| `ui-alert` | inline banner; `data-status` ok, warn, bad, info, idle | `<div class="ui-alert" data-status="warn"><i…></i><p>…</p><button class="ui-button" data-size="sm">…</button></div>` |
| `ui-status` | state word with a mark | `<span class="ui-status" data-status="ok">On track</span>` |
| `ui-badge` | category or tone chip | `<span class="ui-badge" data-cat="1">Interaction</span>` |
| `ui-progress` | work done with its number | `<span class="ui-progress"><progress max="100" value="74">74%</progress><b>74%</b></span>` |
| `ui-meter` | usage against a limit | `<span class="ui-meter"><meter max="50" low="40" high="47" optimum="20" value="38">…</meter><b>38 <small>/ 50 GB</small></b></span>` |
| `ui-skeleton` | loading shape | `<span class="ui-skeleton" style="width:60%"></span>` |
| `ui-empty` | empty surface with one next step | `<div class="ui-empty"><h3>No sessions yet</h3><p>…</p><button class="ui-button">…</button></div>` |
| `ui-avatar` `ui-avatar-group` | initials, tinted with `data-cat` | `<span class="ui-avatar" data-cat="3" aria-label="Daniel Reyes">DR</span>` |
| `ui-mark` | category dot (system extra) | `<span class="ui-mark" data-cat="4"></span>` |
| `ui-card` | grouped content or link | `<a class="ui-card" data-link href="#"><h3>…</h3><p>…</p></a>` |
| `ui-kbd` | shortcut key | `<span class="ui-kbd">⌘ K</span>` |
| `ui-code` | inline code, or a block with header and `data-copy` button | `<div class="ui-code"><header><span>Join link</span><button class="ui-button" data-copy>Copy</button></header><pre><code>…</code></pre></div>` |
| `ui-stat-strip` `ui-stat` | up to three figures | `<div class="ui-stat-strip"><dl class="ui-stat"><dt>…</dt><dd>184</dd><small>…</small></dl></div>` |
| `ui-table-wrap` `ui-table` | comparable records; `data-sort`, `.num` | `<div class="ui-table-wrap"><table class="ui-table" data-ui-table>…</table></div>` |
| `ui-list` `ui-list-item` `ui-list-meta` | rows with avatar or icon, name, meta, trailing value | `<a class="ui-list-item"><span class="ui-avatar">…</span><div><span>…</span><span class="ui-list-meta">…</span></div></a>` |
| `ui-data-list` | label and value pairs | `<dl class="ui-data-list"><dt>Host</dt><dd>Lena Fischer</dd></dl>` |
| `ui-timeline` `ui-timeline-item` | activity history; avatar or icon marker, `data-status` | `<ol class="ui-timeline"><li class="ui-timeline-item"><span class="ui-avatar">LF</span><div><p>…</p><time>…</time></div></li></ol>` |
| `ui-chart` `ui-chart-axis` `ui-chart-legend` | SVG chart frame | `<figure class="ui-chart" role="img" aria-label="…"><svg>…</svg></figure>` |
| `ui-filter-bar` | search, chips, count above a list | `<div class="ui-filter-bar"><label class="ui-control">…</label><button class="ui-chip">…</button><output>9</output></div>` |
| `ui-shell` `ui-sidebar` `ui-sidebar-head` `ui-sidebar-foot` | app frame | see Page shell |
| `ui-nav` `ui-nav-label` `ui-nav-item` `ui-nav-count` | side navigation | `<a class="ui-nav-item" aria-current="page"><i…></i><span>Overview</span></a>` |
| `ui-topbar` | breadcrumb, search, actions | see Page shell |
| `ui-page-header` `ui-page-title` `ui-page-sub` `ui-page-actions` | the page's h1 and actions | `<div class="ui-page-header"><div><h1 class="ui-page-title">…</h1></div><div class="ui-page-actions">…</div></div>` |
| `ui-section` `ui-section-head` | titled card | `<section class="ui-section"><div class="ui-section-head"><h2>…</h2></div>…</section>` |
| `ui-detail` `ui-detail-head` `ui-detail-row` | selection panel of list-detail | `<aside class="ui-detail"><div class="ui-detail-head"><h2>…</h2></div><div class="ui-detail-row">…</div></aside>` |
| `ui-settings-group` `ui-settings-row` `ui-danger` | grouped settings and the destructive zone | `<section class="ui-settings-group"><header><h2>…</h2></header><div class="ui-settings-row">…</div></section>` |
| `ui-auth` | centered sign-in frame | `<main class="ui-auth"><section><header>…<h1>…</h1></header>…</section></main>` |

## Anti-slop list for bloom

Things that make this system look generated; the critic and reviewers should reject them.

- Colored left rails on rows or cards; use a dot in the meta line.
- A hue per KPI card, or stat icons in tinted circles.
- Course colors that change between the nav, the list and the table.
- Two violet buttons on one screen, or a violet secondary.
- Rounded-full buttons and inputs; pills belong to selectors and bars only.
- Donuts for a single percentage; rainbow stacked bars with no values.
- Emoji or illustrations in empty states; the empty state names what will appear and offers one action.
- Generic copy: "Welcome back!", "Lorem ipsum", "John Doe", round numbers that do not reconcile across the page.
- Five decorative dots as a logo, sparkles, confetti on onboarding completion.
- Shadow stacks on resting cards; only floating layers get `--shadow-float`.

## Coverage gaps

Not provided; compose from tokens and existing classes and say what you built:

- Date and time pickers and a month calendar grid (use native `<input type="date">` and `ui-field` for now).
- File upload drop zone and file list (a `ui-list` with a `ui-progress` per file covers the list).
- Rich text editor and comment composer.
- Notification inbox panel and avatar status presence.
- Multi-select combobox with tokens (the combobox is single value).
- Toast variants with actions or status color; data tables with row selection and bulk actions.
- `ui-slider` needs `--v` kept in sync with the value and `ui-code`'s `data-copy` needs a copy handler; seenry-ui.js does neither yet, so a page must add them until it does.

## Install

**Plain CSS.** Copy `seenry-ui.css`, `seenry-ui.js`, `tokens.css` and `system.css`, then load in this order:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="seenry-ui.css">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="system.css">
<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>
<script src="seenry-ui.js" defer></script>
```

Light is the default; `data-theme="dark"` on `<html>` forces dark, and an unset theme follows the system preference.

**Tailwind v4 or shadcn/ui.** Copy `tokens.css` and `theme.tailwind.css` (generated from the tokens; regenerate with `node scripts/system_theme.mjs assets/systems/bloom`):

```css
@import "tailwindcss";
@import "./theme.tailwind.css";
```

Utilities then take bloom's values: `bg-background`, `bg-card`, `bg-primary text-primary-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`, `rounded-md` (12) and `rounded-lg` (16), `font-sans`, `bg-chart-1`, and the `dark:` variant follows `data-theme`. shadcn components read the same variables, so a `Button` is violet and a `Card` is white on the warm page. The category hues are not Tailwind colors; use them through the variables (`bg-[var(--cat-4-bg)] text-[var(--cat-4)]`) or keep `system.css` loaded for `ui-mark`, `ui-badge data-cat` and `ui-avatar data-cat`.
