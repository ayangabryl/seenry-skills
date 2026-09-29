# Seenry UI · core

Dependency-free HTML, CSS, and a classic JavaScript file. Open [gallery.html](gallery.html) directly from disk to see the light and dark themes and every component. Copy `seenry-ui.css` and `seenry-ui.js` into a project:

```html
<link rel="stylesheet" href="seenry-ui.css">
<script src="seenry-ui.js" defer></script>
```

Components use the Seenry product token names in `:root`. Override those custom properties for your brand; `[data-theme="dark"]` forces dark mode, `[data-theme="light"]` forces light mode, and an unset theme follows the system preference. The script initializes once on DOM ready. Call `SeenryUI.init(container)` after adding new component markup. It also exposes `SeenryUI.toast`, `number`, `swap`, and `pop` (also available as `SeenryMotion`). No build step is needed.

For React, load the CSS globally and the classic script once in the document shell. Initialize after mount:

```jsx
import { useEffect, useRef } from 'react';
function Example() {
  const root = useRef(null);
  useEffect(() => { window.SeenryUI?.init(root.current); }, []);
  return <div ref={root}>{/* component JSX from below */}</div>;
}
```

Use unique IDs when several instances appear on a page. React owns application state; the kit handles presentation and keyboard behavior. Listen for `seenry:change`, `seenry:select`, and `seenry:results` where applicable. All touch targets grow to at least 44px on narrow screens. Motion is short, interruptible, and removed for reduced-motion users.

## Button

Use for an action. Choose one primary action per group; secondary, ghost, and danger express decreasing emphasis or destructive intent. `data-size="sm|lg"` gives 32/44px (36px default); `data-icon` makes a square icon button. Add `disabled` and `aria-busy="true" data-loading` during work. Icon-only buttons need an accessible name.

```html
<button class="ui-button" data-variant="primary">Save changes</button>
<button class="ui-button" data-icon aria-label="Add item">＋</button>
<button class="ui-button" data-loading aria-busy="true" disabled>Saving</button>
```

Keyboard: native Enter/Space activation; Tab focus. React:

```jsx
<button className="ui-button" data-variant="primary" disabled={saving} aria-busy={saving} data-loading={saving || undefined} onClick={save}>{saving ? 'Saving' : 'Save changes'}</button>
```

## Input and textarea

Use a visible label. Attach help or error with `aria-describedby`; set `aria-invalid="true"` and `data-invalid` on the field wrapper for errors. Prefix and suffix are visual adornments inside `.ui-control`; include units in the accessible label when needed. Native disabled and readonly work.

```html
<label class="ui-field" data-invalid>
  <span class="ui-label">Email address</span>
  <input class="ui-input" type="email" aria-invalid="true" aria-describedby="email-error">
  <span class="ui-error" id="email-error">Enter a valid email address.</span>
</label>
<label class="ui-field"><span class="ui-label">Description</span><textarea class="ui-textarea"></textarea></label>
```

Keyboard: native text editing and Tab focus. React:

```jsx
<label className="ui-field" data-invalid={error || undefined}><span className="ui-label">Email address</span><input className="ui-input" type="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'email-error' : undefined}/>{error && <span className="ui-error" id="email-error">{error}</span>}</label>
```

## Select

Use the native select when the choice list is short. Its browser popup keeps platform keyboard and touch behavior. The supplied arrow is decorative.

```html
<label class="ui-field"><span class="ui-label">Region</span><select class="ui-select"><option>United States</option><option>Singapore</option></select></label>
```

Keyboard: native arrows, character search, Enter/Space, and Escape. React:

```jsx
<label className="ui-field"><span className="ui-label">Region</span><select className="ui-select" value={region} onChange={e => setRegion(e.target.value)}><option value="us">United States</option><option value="sg">Singapore</option></select></label>
```

## Checkbox

Use for an independent yes/no choice or a set where several values can be selected. Help text can sit within the label.

```html
<label class="ui-choice"><input type="checkbox" checked><span>Send updates <small>Monthly summary by email.</small></span></label>
```

Keyboard: Space toggles; Tab moves between boxes. React:

```jsx
<label className="ui-choice"><input type="checkbox" checked={updates} onChange={e => setUpdates(e.target.checked)}/><span>Send updates</span></label>
```

## Radio group

Use for one choice among mutually exclusive options. Keep a shared `name`, and put the prompt in a `legend`.

```html
<fieldset class="ui-radio-group"><legend>Visibility</legend><label class="ui-choice"><input type="radio" name="visibility" value="private" checked><span>Private</span></label><label class="ui-choice"><input type="radio" name="visibility" value="team"><span>Team</span></label></fieldset>
```

Keyboard: Tab enters the group; arrows change selection; Space selects. React:

```jsx
<fieldset className="ui-radio-group"><legend>Visibility</legend>{['private','team'].map(v => <label className="ui-choice" key={v}><input type="radio" name="visibility" value={v} checked={visibility === v} onChange={() => setVisibility(v)}/><span>{v}</span></label>)}</fieldset>
```

## Switch

Use for a setting that takes effect immediately. The native checkbox owns its state; `role="switch"` tells assistive technology how to announce it.

```html
<label class="ui-switch"><input type="checkbox" role="switch" checked><span>Email notifications</span></label>
```

Keyboard: Space toggles; Tab focuses. React:

```jsx
<label className="ui-switch"><input type="checkbox" role="switch" checked={enabled} onChange={e => setEnabled(e.target.checked)}/><span>Email notifications</span></label>
```

## Segmented control

Use for a small, mutually exclusive view setting. Give the group an accessible name; one button starts with `aria-pressed="true"`. A `seenry:change` event carries the selected value.

```html
<div class="ui-segmented" aria-label="View density"><button aria-pressed="true" data-value="comfortable">Comfortable</button><button aria-pressed="false" data-value="compact">Compact</button></div>
```

Keyboard: Tab focuses buttons; arrows move and select; Enter/Space selects. React:

```jsx
<div className="ui-segmented" aria-label="View density">{['comfortable','compact'].map(v => <button type="button" key={v} data-value={v} aria-pressed={density === v} onClick={() => setDensity(v)}>{v}</button>)}</div>
```

If state also changes outside the control, update `aria-pressed` from React and call `SeenryUI.init` after a remount. For custom DOM events, use `ref.current.addEventListener('seenry:change', handler)` in an effect; React does not bind `onSeenryChange` consistently across versions.

## Tabs

Use for panels at the same level. Give each tab an ID and `aria-controls` pointing to its panel; each panel points back with `aria-labelledby`. The indicator moves from the previous tab. The script applies roving Tab focus.

```html
<div class="ui-tabs" role="tablist" aria-label="Project sections"><button role="tab" id="overview-tab" aria-selected="true" aria-controls="overview-panel">Overview</button><button role="tab" id="activity-tab" aria-selected="false" aria-controls="activity-panel">Activity</button></div>
<div class="ui-tab-panel" role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">Overview content</div>
<div class="ui-tab-panel" role="tabpanel" id="activity-panel" aria-labelledby="activity-tab" hidden>Activity content</div>
```

Keyboard: Left/Right arrows, Home, End; focus and selection move together. React:

```jsx
<><div ref={tabListRef} className="ui-tabs" role="tablist" aria-label="Project sections">{tabs.map(t => <button key={t.id} role="tab" id={`${t.id}-tab`} aria-selected={active === t.id} aria-controls={`${t.id}-panel`} onClick={() => setActive(t.id)}>{t.label}</button>)}</div>{tabs.map(t => <div key={t.id} className="ui-tab-panel" role="tabpanel" id={`${t.id}-panel`} aria-labelledby={`${t.id}-tab`} hidden={active !== t.id}>{t.content}</div>)}</>
```

In React, keep arrow-key selection in sync with state by listening for the tab list’s `seenry:change` event:

```jsx
const tabListRef = useRef(null);
useEffect(() => {
  const node = tabListRef.current;
  const onChange = e => setActive(e.detail.value.replace(/-tab$/, ''));
  node.addEventListener('seenry:change', onChange);
  return () => node.removeEventListener('seenry:change', onChange);
}, []);
```

Avoid rendering the same panel from two independent state sources.

## Menu / dropdown

Use for a short list of actions. The native Popover API handles light dismissal. `data-menu-trigger` points to a `popover="auto"` element with `role="menu"`. Menu item checkboxes use `aria-checked`. Listen for `seenry:select`.

```html
<button class="ui-button" data-menu-trigger="actions">Actions</button>
<div id="actions" class="ui-menu" role="menu" popover="auto"><button role="menuitem" data-value="rename">Rename</button><button role="menuitemcheckbox" aria-checked="false" data-value="pin">Pin</button></div>
```

Keyboard: trigger Enter/Space or Up/Down opens; items use Up/Down, Home/End, letter typeahead, Enter/Space; Escape returns to trigger. React:

```jsx
<><button className="ui-button" data-menu-trigger="actions">Actions</button><div id="actions" className="ui-menu" role="menu" popover="auto"><button role="menuitem" onClick={rename}>Rename</button></div></>
```

## Tooltip

Use only for supporting information, never the sole label of a control. The trigger references a native manual popover with `role="tooltip"`.

```html
<button class="ui-button" data-tooltip="tip">Retention</button><div id="tip" class="ui-tooltip" role="tooltip" popover="manual">Kept for 30 days.</div>
```

Keyboard: focus reveals after a short delay; blur or Escape hides. React:

```jsx
<><button className="ui-button" data-tooltip="retention-tip">Retention</button><div id="retention-tip" className="ui-tooltip" role="tooltip" popover="manual">Kept for 30 days.</div></>
```

## Dialog

Use for a focused task that must be completed or dismissed. Native `showModal()` supplies focus containment and Escape. `data-dialog-open` and `data-dialog-close` wire the example without application code. Title the dialog with `aria-labelledby`.

```html
<button class="ui-button" data-dialog-open="invite">Invite</button>
<dialog class="ui-dialog" id="invite" aria-labelledby="invite-title"><div class="ui-dialog__head"><h2 id="invite-title">Invite a teammate</h2></div><div class="ui-dialog__body">Send an invitation by email.</div><div class="ui-dialog__foot"><button class="ui-button" data-dialog-close>Cancel</button></div></dialog>
```

Keyboard: Tab cycles within the modal; Escape closes; focus returns to the opener. React:

```jsx
<><button className="ui-button" onClick={() => dialogRef.current.showModal()}>Invite</button><dialog ref={dialogRef} className="ui-dialog" aria-labelledby="invite-title"><div className="ui-dialog__head"><h2 id="invite-title">Invite a teammate</h2></div><div className="ui-dialog__foot"><button className="ui-button" onClick={() => dialogRef.current.close()}>Cancel</button></div></dialog></>
```

## Sheet

Use for a related task that benefits from more vertical room. It is a native dialog presented from the side on desktop and from the bottom on phone. The content and close affordance are application-owned.

```html
<button class="ui-button" data-dialog-open="details">Details</button><dialog class="ui-sheet" id="details" aria-labelledby="details-title"><div class="ui-sheet__content"><h2 id="details-title">Project details</h2><button class="ui-button" data-dialog-close>Close</button></div></dialog>
```

Keyboard: native dialog Tab containment and Escape. Touch drag to dismiss is intentionally optional and is not enabled by the core script. React:

```jsx
<><button className="ui-button" onClick={() => sheetRef.current.showModal()}>Details</button><dialog ref={sheetRef} className="ui-sheet" aria-label="Project details"><div className="ui-sheet__content"><button onClick={() => sheetRef.current.close()}>Close</button></div></dialog></>
```

## Toast

Use for a brief result after an action. `SeenryUI.toast(message, {description, duration})` stacks up to three, pauses its timer on hover/focus, and exposes a dismiss button. A persistent error should live near the problem instead.

```html
<button class="ui-button" data-toast-message="Changes saved" data-toast-description="Your workspace is up to date.">Save</button>
```

Keyboard: Tab reaches dismiss; Enter/Space dismisses. React:

```jsx
<button className="ui-button" onClick={() => window.SeenryUI.toast('Changes saved', { description: 'Your workspace is up to date.' })}>Save</button>
```

## Accordion

Use for optional details within a page. Native `details`/`summary` gives keyboard and screen reader behavior; supported browsers animate the content height.

```html
<details class="ui-accordion"><summary>Who can see this?</summary><div class="ui-accordion__body">Only invited people.</div></details>
```

Keyboard: Tab to summary; Enter/Space toggles. React:

```jsx
<details className="ui-accordion"><summary>Who can see this?</summary><div className="ui-accordion__body">Only invited people.</div></details>
```

## Badge and status

Use a badge for a short category and a status for a state. Status always includes words; its dot is supplementary. Tones: `ok`, `warn`, `bad`, `info`. Neutral is the default.

```html
<span class="ui-badge">Draft</span><span class="ui-status" data-tone="ok">Active</span>
```

Keyboard: none; these are noninteractive text. React:

```jsx
<><span className="ui-badge">Draft</span><span className="ui-status" data-tone={state === 'active' ? 'ok' : 'warn'}>{state}</span></>
```

## Avatar and avatar group

Use a photo when available and initials as a real fallback. Name each standalone avatar. A group should have one collective accessible name and hide its inner initials from assistive technology.

```html
<span class="ui-avatar" aria-label="Alex Morgan">AM</span>
<span class="ui-avatar-group" aria-label="Alex Morgan and Jamie Chen"><span class="ui-avatar" aria-hidden="true">AM</span><span class="ui-avatar" aria-hidden="true">JC</span></span>
```

Options: `data-size="lg"`; place `<img alt="">` inside when the adjacent name or `aria-label` already supplies the identity. Keyboard: none. React:

```jsx
<span className="ui-avatar" aria-label={person.name}>{person.photo ? <img src={person.photo} alt=""/> : person.initials}</span>
```

## Card

Use a static card for grouped content and an anchor card when the entire surface navigates. Do not nest buttons inside a link card.

```html
<article class="ui-card"><h3>Workspace review</h3><p>Review current work.</p></article>
<a class="ui-card" data-link href="/activity"><h3>View activity</h3><p>See recent changes.</p></a>
```

Keyboard: link card uses native Tab and Enter; static card has no focus. React:

```jsx
<a className="ui-card" data-link href={`/projects/${project.id}`}><h3>{project.name}</h3><p>{project.summary}</p></a>
```

## Table

Use for comparable records. Wrap a native table in `.ui-table-wrap`, mark sortable headers with `data-sort`, and set `data-ui-table` on the table. Numeric columns use `.num` on both header and cells. Cell `data-sort` can provide a machine-readable value. `data-table-search`, `data-table-filter`, and `data-table-pages` point to the table ID; row `data-filter` supplies the filter key. `data-page-size` controls pagination. Sorting, filtering, and page changes emit `seenry:results` and use a view transition when available. The script owns the initial rows; after replacing rows from React, remount the table or own the sort/filter logic in React.

```html
<input class="ui-input" type="search" aria-label="Search invoices" data-table-search="invoices">
<div class="ui-table-wrap"><table class="ui-table" data-ui-table data-page-size="10" id="invoices"><thead><tr><th scope="col" data-sort>Client</th><th scope="col" data-sort class="num">Amount</th></tr></thead><tbody><tr><td>Acme Studio</td><td class="num" data-sort="2400">$2,400.00</td></tr></tbody></table></div>
<nav class="ui-pagination" aria-label="Invoice pages" data-table-pages="invoices"></nav>
```

Keyboard: Tab to header buttons; Enter/Space sorts; search and filter use native keys; pagination buttons use Tab and Enter/Space. React:

```jsx
<div className="ui-table-wrap"><table className="ui-table"><thead><tr><th scope="col"><button onClick={() => setSort('client')}>Client</button></th><th scope="col" className="num" aria-sort={sort === 'amount' ? direction : 'none'}><button onClick={() => setSort('amount')}>Amount</button></th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.client}</td><td className="num">{formatMoney(row.amount)}</td></tr>)}</tbody></table></div>
```

## Pagination

Use when a data set has clear pages. The table hook above generates buttons with `aria-current="page"`; manual pagination can use the same class.

```html
<nav class="ui-pagination" aria-label="Pages"><button disabled aria-label="Previous page">‹</button><button aria-current="page">1</button><button>2</button><button aria-label="Next page">›</button></nav>
```

Keyboard: Tab and Enter/Space on native buttons. React:

```jsx
<nav className="ui-pagination" aria-label="Pages">{pages.map(n => <button key={n} aria-current={n === page ? 'page' : undefined} onClick={() => setPage(n)}>{n}</button>)}</nav>
```

## Empty state

Use when a task surface has no content. Name what happened, give one short reason, and offer one next action.

```html
<div class="ui-empty"><h3>No saved views yet</h3><p>Save a filter to return to these invoices.</p><button class="ui-button" data-variant="primary">Create a view</button></div>
```

Keyboard: native action button. React:

```jsx
<div className="ui-empty"><h3>No saved views yet</h3><p>Save a filter to return to these invoices.</p><button className="ui-button" onClick={createView}>Create a view</button></div>
```

## Stat strip

Use for up to three related figures above the work they summarize. Wrap each label/value pair in `dl`; call `SeenryUI.number(element, value, IntlOptions)` when a figure changes.

```html
<div class="ui-stat-strip"><dl class="ui-stat"><dt>Revenue</dt><dd id="revenue">$18,420</dd><small>This month</small></dl></div>
<script>SeenryUI.number(document.getElementById('revenue'), 18642, {style:'currency',currency:'USD',maximumFractionDigits:0});</script>
```

Keyboard: none for the figures. React:

```jsx
<div className="ui-stat-strip"><dl className="ui-stat"><dt>Revenue</dt><dd ref={revenueRef}>$18,420</dd><small>This month</small></dl></div>
// In an effect after revenue changes: window.SeenryUI.number(revenueRef.current, revenue, {style:'currency',currency:'USD',maximumFractionDigits:0});
```

## Breadcrumb

Use to show the current place in a hierarchy. The last item is text with `aria-current="page"`; separators are CSS, so they are not read aloud.

```html
<nav aria-label="Breadcrumb"><ol class="ui-breadcrumb"><li><a href="/">Workspace</a></li><li aria-current="page">Projects</li></ol></nav>
```

Keyboard: native link Tab and Enter. React:

```jsx
<nav aria-label="Breadcrumb"><ol className="ui-breadcrumb">{crumbs.map((c, i) => <li key={c.href || c.label} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.href ? <a href={c.href}>{c.label}</a> : c.label}</li>)}</ol></nav>
```

## Kbd

Use only for a real shortcut. Write the key combination in readable text nearby when discoverability matters.

```html
<span class="ui-kbd">⌘ K</span>
```

Keyboard: none; it is descriptive text. React:

```jsx
<span className="ui-kbd">{shortcutLabel}</span>
```

## Skeleton

Use while a known shape loads. Match the final layout; mark the surrounding region `aria-busy="true"`. The shimmer stops under reduced motion.

```html
<div aria-busy="true" aria-label="Loading invoices"><span class="ui-skeleton" style="width:40%"></span><span class="ui-skeleton" style="width:85%"></span></div>
```

Keyboard: none. React:

```jsx
<div aria-busy={loading} aria-label="Invoices">{loading ? <span className="ui-skeleton" style={{width:'80%'}}/> : <InvoiceList rows={rows}/>}</div>
```

## Command menu

Use for global actions. It is a native dialog opened by Cmd/Ctrl+K; fuzzy matching preserves result order. The list responds immediately, with no list animation. `seenry:select` carries the chosen `data-value`.

```html
<dialog class="ui-command" aria-label="Command menu"><input type="search" aria-label="Search commands" placeholder="Search actions…"><div class="ui-command__list"><button data-value="new-project">New project</button><button data-value="open-invoices">Open invoices</button><p class="ui-command__empty" hidden>No matching commands.</p></div><div class="ui-command__footer">Use ↑ ↓ to move · Enter to select</div></dialog>
```

Keyboard: Cmd/Ctrl+K toggles, arrows move, Enter selects, Escape closes. React:

```jsx
<dialog className="ui-command" aria-label="Command menu" ref={commandRef}><input type="search" aria-label="Search commands" placeholder="Search actions…"/><div className="ui-command__list">{commands.map(c => <button key={c.id} data-value={c.id}>{c.label}</button>)}<p className="ui-command__empty" hidden>No matching commands.</p></div></dialog>
```

## Browser notes

The menu and tooltip use the Popover API; modern browsers support it. The dialog and sheet use native `<dialog>`. View Transitions and `interpolate-size` enhance changes when supported; their content and controls still work without either feature. All component files work from `file://`. The gallery itself clones its light examples into a dark column for parity, and offers a theme switch on phone; copy component markup from the source column without the gallery wrapper.
