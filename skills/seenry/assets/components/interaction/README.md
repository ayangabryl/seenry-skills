# Seenry interaction components

Thirty-two dependency-free HTML/CSS/JavaScript components. Open [gallery.html](gallery.html) from disk to see light and dark demos. The kit uses the Seenry product tokens and works without a build step.

## Install

```html
<link rel="stylesheet" href="seenry-interaction.css">
<script src="seenry-interaction.js" defer></script>
```

Copy a component’s HTML below. The script initializes each `[data-demo]` when the document loads. For HTML inserted later, call `SeenryInteraction.init(container)`; the call is idempotent. Override the CSS custom properties on `:root` or a `[data-theme="dark"]` container. Listen for `seenry:*` events where described.

The gallery uses illustrative data. Connect actions, verification, uploads, saves, service history, and audio to application data before shipping them as real operations.

The morphing action button can be driven by a real promise. Prevent the gallery simulation and set each state:

```js
document.querySelector('[data-demo="morph"]').addEventListener('seenry:action', async event => {
  event.preventDefault();
  const { setState } = event.detail;
  setState('loading', 'Publishing…');
  try {
    await publishChanges();
    setState('success', 'Published ✓');
  } catch {
    setState('error', 'Try again');
  }
});
```

The file dropzone emits a cancelable `seenry:file` event with `event.detail.file` and `event.detail.update(percent, error)`. Prevent the demo preparation timer when wiring an upload. Use unique IDs, radio group names, and labels when rendering multiple instances.

The gallery’s **Inspect component states** control previews default, hover, pressed, focus, disabled, loading, error, empty, and long-content presentations side by side. Loading and error previews apply where the state makes sense for the component; use the live demo in default mode to test actual behavior.

## Production motion

The 32 component APIs and events are unchanged. Motion uses CSS properties `--motion-E`, `--motion-M`, `--motion-F`, `--motion-X`; durations `--motion-instant` (0), `--motion-feedback` (80), `--motion-quick` (120), `--motion-control` (160), `--motion-relocate` (180), `--motion-surface` (240), and `--motion-spatial` (280 ms). Delays are `--delay-none`, `--delay-short`, `--delay-content`, and `--delay-controls` (0/40/60/80 ms). Existing `--t-fast`, `--t-base`, `--t-layer`, `--ease-out`, and `--ease-in-out` remain aliases.

The status island and search reserve their expanded footprint and reveal by clipping. Toasts enter with surface 240/E, with their text attached. Hold-to-delete shows proportional progress even during a brief press and drains in 120 ms after cancellation; the linear clock alone determines commitment. Reselecting the current status does nothing. Labels and numbers keep stable slots; only changed digits move. Reduced motion removes travel, blur, and reveal delays while retaining state and hold duration.

Overlay exits remain mounted briefly but become inert immediately. Reopening continues from the rendered position; obsolete completion callbacks cannot hide the reopened layer. Async action, promise, and autosave callbacks are scoped to the request that created them. Undo time pauses while the notice is hovered, focused, or the document is hidden.

Every gallery demo has a `data-replay` button beside its h3 title. Replay exercises the real control: the hold demo shows a brief cancelled press; hold the control itself to commit. Replaying a completed slide resets it. Forms, scrubbing, and frequently repeated selection stay immediate by design.

## Components

### Slide to confirm

**When to use:** Irreversible actions that need a deliberate gesture.

**Options:** Change the track label and confirmation handler; 88% is the completion threshold.

**Keyboard:** Drag to the end; Home/End or arrows adjust the value, Enter or Space confirms at the end.

**HTML**

```html
<div data-demo="slide">
  <div class="demo-stage">
    <div class="si-slide" tabindex="0" role="slider" aria-label="Slide to archive project" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <span class="si-slide-fill"></span>
      <span class="si-slide-label">
        Slide to archive project
      </span>
      <span class="si-slide-thumb" aria-hidden="true">
        →
      </span>
    </div>
  </div>
</div>
```

**React**

```jsx
function SlideToConfirm() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="slide">
      <div className="demo-stage">
        <div className="si-slide" tabIndex="0" role="slider" aria-label="Slide to archive project" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <span className="si-slide-fill"></span>
          <span className="si-slide-label">
            Slide to archive project
          </span>
          <span className="si-slide-thumb" aria-hidden="true">
            →
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Hold to delete

**When to use:** Destructive actions that deserve a brief pause.

**Options:** Change the label; set data-duration in milliseconds. Listen for seenry:delete.

**Keyboard:** Hold Space or Enter for 1.1 seconds; release early to cancel.

**HTML**

```html
<div data-demo="hold">
  <div class="demo-stage">
    <button type="button" class="si-hold" data-duration="1100">
      <span class="si-hold-fill"></span>
      <span class="si-hold-icon" aria-hidden="true">
        ×
      </span>
      <span class="si-hold-label">
        Hold to delete
      </span>
    </button>
  </div>
</div>
```

**React**

```jsx
function HoldToDelete() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="hold">
      <div className="demo-stage">
        <button type="button" className="si-hold" data-duration="1100">
          <span className="si-hold-fill"></span>
          <span className="si-hold-icon" aria-hidden="true">
            ×
          </span>
          <span className="si-hold-label">
            Hold to delete
          </span>
        </button>
      </div>
    </div>
  );
}
```

### Status island

**When to use:** A compact live task indicator with more detail on demand.

**Options:** Replace short and long status text and progress.

**Keyboard:** Enter or Space toggles the expanded detail.

**HTML**

```html
<div data-demo="island">
  <div class="demo-stage island-stage">
    <button type="button" class="si-island" aria-expanded="false">
      <span class="si-live-dot" data-seenry-dot="live"></span>
      <span class="si-island-short">
        Uploading
      </span>
      <span class="si-island-long">
        Uploading design-assets.zip
        <b>
          68%
        </b>
      </span>
      <span aria-hidden="true">
        ⌄
      </span>
    </button>
  </div>
</div>
```

**React**

```jsx
function StatusIsland() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="island">
      <div className="demo-stage island-stage">
        <button type="button" className="si-island" aria-expanded="false">
          <span className="si-live-dot" data-seenry-dot="live"></span>
          <span className="si-island-short">
            Uploading
          </span>
          <span className="si-island-long">
            Uploading design-assets.zip
            <b>
              68%
            </b>
          </span>
          <span aria-hidden="true">
            ⌄
          </span>
        </button>
      </div>
    </div>
  );
}
```

### Morphing action button

**When to use:** One action whose label carries loading and resolution.

**Options:** Change idle label and wire the action result; demo uses a 900 ms simulated operation.

**Keyboard:** Enter or Space starts the action; focus stays on the button.

**HTML**

```html
<div data-demo="morph">
  <div class="demo-stage">
    <button type="button" class="si-morph si-primary">
      <span class="si-morph-text">
        Publish changes
      </span>
    </button>
    <button type="button" class="si-text-button si-morph-error">
      Try error state
    </button>
  </div>
</div>
```

**React**

```jsx
function MorphingActionButton() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="morph">
      <div className="demo-stage">
        <button type="button" className="si-morph si-primary">
          <span className="si-morph-text">
            Publish changes
          </span>
        </button>
        <button type="button" className="si-text-button si-morph-error">
          Try error state
        </button>
      </div>
    </div>
  );
}
```

### Overflow tabs

**When to use:** A navigation set that must remain usable when narrow.

**Options:** Edit tab buttons and panel text; ResizeObserver moves excess tabs into More.

**Keyboard:** Left and Right Arrow cycle tabs; Enter/Space opens More and its menu.

**HTML**

```html
<div data-demo="tabs">
  <div class="demo-stage">
    <div class="si-tabs" data-tabs="">
      <div class="si-tabs-list" role="tablist" aria-label="Workspace sections">
        <button type="button" role="tab" aria-selected="true">
          Overview
        </button>
        <button type="button" role="tab" aria-selected="false">
          Activity
        </button>
        <button type="button" role="tab" aria-selected="false">
          Files
        </button>
        <button type="button" role="tab" aria-selected="false">
          Members
        </button>
        <button type="button" role="tab" aria-selected="false">
          Settings
        </button>
      </div>
      <div class="si-more-wrap">
        <button type="button" class="si-more" aria-haspopup="menu" aria-expanded="false">
          More
          <span aria-hidden="true">
            ⌄
          </span>
        </button>
        <div class="si-menu si-more-menu" role="menu" hidden=""></div>
      </div>
    </div>
    <div class="si-tab-panel" role="tabpanel">
      Overview content
    </div>
  </div>
</div>
```

**React**

```jsx
function OverflowTabs() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="tabs">
      <div className="demo-stage">
        <div className="si-tabs" data-tabs>
          <div className="si-tabs-list" role="tablist" aria-label="Workspace sections">
            <button type="button" role="tab" aria-selected="true">
              Overview
            </button>
            <button type="button" role="tab" aria-selected="false">
              Activity
            </button>
            <button type="button" role="tab" aria-selected="false">
              Files
            </button>
            <button type="button" role="tab" aria-selected="false">
              Members
            </button>
            <button type="button" role="tab" aria-selected="false">
              Settings
            </button>
          </div>
          <div className="si-more-wrap">
            <button type="button" className="si-more" aria-haspopup="menu" aria-expanded="false">
              More
              <span aria-hidden="true">
                ⌄
              </span>
            </button>
            <div className="si-menu si-more-menu" role="menu" hidden></div>
          </div>
        </div>
        <div className="si-tab-panel" role="tabpanel">
          Overview content
        </div>
      </div>
    </div>
  );
}
```

### Expanding search

**When to use:** A compact toolbar search that opens only when used.

**Options:** Change placeholder and aria-label; query handling belongs to the host app.

**Keyboard:** Enter opens; Escape clears and collapses; empty blur collapses.

**HTML**

```html
<div data-demo="search">
  <div class="demo-stage">
    <div class="si-search">
      <button type="button" aria-label="Open search">
        ⌕
      </button>
      <input type="search" aria-label="Search projects" placeholder="Search projects" tabindex="-1">
    </div>
  </div>
</div>
```

**React**

```jsx
function ExpandingSearch() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="search">
      <div className="demo-stage">
        <div className="si-search">
          <button type="button" aria-label="Open search">
            ⌕
          </button>
          <input type="search" aria-label="Search projects" placeholder="Search projects" tabIndex="-1" />
        </div>
      </div>
    </div>
  );
}
```

### Hover card

**When to use:** Brief preview for a person or link.

**Options:** Replace name, metadata, and preview copy.

**Keyboard:** Focus or click opens; Escape closes.

**HTML**

```html
<div data-demo="hover">
  <div class="demo-stage">
    <div class="si-hover-wrap">
      <button type="button" class="si-link-button" aria-describedby="hover-help">
        Maya Chen
      </button>
      <div class="si-hover-card" role="tooltip">
        <div class="si-avatar">
          MC
        </div>
        <strong>
          Maya Chen
        </strong>
        <span>
          Product design · San Francisco
        </span>
        <p>
          Working on the next release of the workspace.
        </p>
      </div>
    </div>
    <span class="si-visually-hidden" id="hover-help">
      Focus or hover to preview profile
    </span>
  </div>
</div>
```

**React**

```jsx
function HoverCard() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="hover">
      <div className="demo-stage">
        <div className="si-hover-wrap">
          <button type="button" className="si-link-button" aria-describedby="hover-help">
            Maya Chen
          </button>
          <div className="si-hover-card" role="tooltip">
            <div className="si-avatar">
              MC
            </div>
            <strong>
              Maya Chen
            </strong>
            <span>
              Product design · San Francisco
            </span>
            <p>
              Working on the next release of the workspace.
            </p>
          </div>
        </div>
        <span className="si-visually-hidden" id="hover-help">
          Focus or hover to preview profile
        </span>
      </div>
    </div>
  );
}
```

### Context menu

**When to use:** Secondary actions for a row or object.

**Options:** Edit menu actions and handle seenry:select.

**Keyboard:** Context Menu or Shift+F10 opens; arrows move; Right opens submenu, Left closes it; Escape closes.

**HTML**

```html
<div data-demo="context">
  <div class="demo-stage">
    <button type="button" class="si-context-target">
      Right-click or long-press this item
      <span aria-hidden="true">
        ⋯
      </span>
    </button>
    <div class="si-menu si-context-menu" role="menu" hidden="">
      <button type="button" role="menuitem">
        Open details
      </button>
      <button type="button" role="menuitem">
        Duplicate
      </button>
      <button type="button" role="menuitem" class="si-sub-trigger" aria-haspopup="menu" aria-expanded="false">
        Move to
        <span aria-hidden="true">
          ›
        </span>
      </button>
      <div class="si-submenu si-menu" role="menu" hidden="">
        <button type="button" role="menuitem">
          Projects
        </button>
        <button type="button" role="menuitem">
          Archive
        </button>
      </div>
      <button type="button" role="menuitem">
        Delete
      </button>
    </div>
  </div>
</div>
```

**React**

```jsx
function ContextMenu() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="context">
      <div className="demo-stage">
        <button type="button" className="si-context-target">
          Right-click or long-press this item
          <span aria-hidden="true">
            ⋯
          </span>
        </button>
        <div className="si-menu si-context-menu" role="menu" hidden>
          <button type="button" role="menuitem">
            Open details
          </button>
          <button type="button" role="menuitem">
            Duplicate
          </button>
          <button type="button" role="menuitem" className="si-sub-trigger" aria-haspopup="menu" aria-expanded="false">
            Move to
            <span aria-hidden="true">
              ›
            </span>
          </button>
          <div className="si-submenu si-menu" role="menu" hidden>
            <button type="button" role="menuitem">
              Projects
            </button>
            <button type="button" role="menuitem">
              Archive
            </button>
          </div>
          <button type="button" role="menuitem">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Combobox

**When to use:** Select from a short searchable list.

**Options:** Set data-options as a pipe-separated list on .si-combo.

**Keyboard:** Type to filter; Up/Down moves highlight; Enter selects; Escape closes.

**HTML**

```html
<div data-demo="combo">
  <div class="demo-stage">
    <div class="si-combo" data-options="Maya Chen|Avery Morgan|Noah Williams|Olivia Park|Elias Rivera|Sofia Patel">
      <label for="combo-input">
        Assignee
      </label>
      <input id="combo-input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="combo-list" placeholder="Choose a teammate" autocomplete="off">
      <div class="si-combo-list si-menu" id="combo-list" role="listbox" hidden=""></div>
    </div>
  </div>
</div>
```

**React**

```jsx
function Combobox() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="combo">
      <div className="demo-stage">
        <div className="si-combo" data-options="Maya Chen|Avery Morgan|Noah Williams|Olivia Park|Elias Rivera|Sofia Patel">
          <label htmlFor="combo-input">
            Assignee
          </label>
          <input id="combo-input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="combo-list" placeholder="Choose a teammate" autoComplete="off" />
          <div className="si-combo-list si-menu" id="combo-list" role="listbox" hidden></div>
        </div>
      </div>
    </div>
  );
}
```

### One-time code

**When to use:** Short numeric verification codes.

**Options:** Change digit count in HTML; data-code is for the gallery demo. Without it, listen for seenry:complete and validate in your app.

**Keyboard:** Type advances, Backspace retreats, arrows move, paste fills remaining cells.

**HTML**

```html
<div data-demo="otp">
  <div class="demo-stage">
    <div class="si-otp" data-code="123456" role="group" aria-label="Six digit verification code">
      <input inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Digit 1">
      <input inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Digit 2">
      <input inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Digit 3">
      <input inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Digit 4">
      <input inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Digit 5">
      <input inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Digit 6">
    </div>
    <span class="si-otp-message" role="status">
      Enter the six-digit code
    </span>
  </div>
</div>
```

**React**

```jsx
function OneTimeCode() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="otp">
      <div className="demo-stage">
        <div className="si-otp" data-code="123456" role="group" aria-label="Six digit verification code">
          <input inputMode="numeric" pattern="[0-9]*" maxLength="1" aria-label="Digit 1" />
          <input inputMode="numeric" pattern="[0-9]*" maxLength="1" aria-label="Digit 2" />
          <input inputMode="numeric" pattern="[0-9]*" maxLength="1" aria-label="Digit 3" />
          <input inputMode="numeric" pattern="[0-9]*" maxLength="1" aria-label="Digit 4" />
          <input inputMode="numeric" pattern="[0-9]*" maxLength="1" aria-label="Digit 5" />
          <input inputMode="numeric" pattern="[0-9]*" maxLength="1" aria-label="Digit 6" />
        </div>
        <span className="si-otp-message" role="status">
          Enter the six-digit code
        </span>
      </div>
    </div>
  );
}
```

### Password field

**When to use:** Password creation with visibility and strength guidance.

**Options:** Change the strength rules to match server policy.

**Keyboard:** Tab to reveal; Enter/Space toggles password visibility.

**HTML**

```html
<div data-demo="password">
  <div class="demo-stage">
    <div class="si-password">
      <label>
        Password
        <input type="password" placeholder="Create a password" autocomplete="new-password">
      </label>
      <button type="button" aria-label="Show password">
        Show
      </button>
      <div class="si-strength">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <small>
        Use 8+ characters, a number and a symbol.
      </small>
    </div>
  </div>
</div>
```

**React**

```jsx
function PasswordField() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="password">
      <div className="demo-stage">
        <div className="si-password">
          <label>
            Password
            <input type="password" placeholder="Create a password" autoComplete="new-password" />
          </label>
          <button type="button" aria-label="Show password">
            Show
          </button>
          <div className="si-strength">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <small>
            Use 8+ characters, a number and a symbol.
          </small>
        </div>
      </div>
    </div>
  );
}
```

### Copy button

**When to use:** Copy a token or link with in-place confirmation.

**Options:** Set data-copy on the button.

**Keyboard:** Enter/Space copies; feedback restores after 2.2 seconds.

**HTML**

```html
<div data-demo="copy">
  <div class="demo-stage">
    <code class="si-code">
      sk_live_8f…2ad9
    </code>
    <button type="button" class="si-copy" data-copy="sk_live_8f6d2ad9">
      <span aria-hidden="true">
        ▢
      </span>
      <span>
        Copy key
      </span>
    </button>
  </div>
</div>
```

**React**

```jsx
function CopyButton() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="copy">
      <div className="demo-stage">
        <code className="si-code">
          sk_live_8f…2ad9
        </code>
        <button type="button" className="si-copy" data-copy="sk_live_8f6d2ad9">
          <span aria-hidden="true">
            ▢
          </span>
          <span>
            Copy key
          </span>
        </button>
      </div>
    </div>
  );
}
```

### Share button

**When to use:** Share content through native share or a fallback menu.

**Options:** Set data-title and data-url on .si-share-wrap.

**Keyboard:** Enter/Space opens native share or the fallback menu; Escape closes fallback.

**HTML**

```html
<div data-demo="share">
  <div class="demo-stage">
    <div class="si-share-wrap">
      <button type="button" class="si-share">
        Share project
        <span aria-hidden="true">
          ↗
        </span>
      </button>
      <div class="si-menu si-share-menu" role="menu" hidden="">
        <button type="button" role="menuitem">
          Copy link
        </button>
        <button type="button" role="menuitem">
          Email link
        </button>
      </div>
    </div>
  </div>
</div>
```

**React**

```jsx
function ShareButton() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="share">
      <div className="demo-stage">
        <div className="si-share-wrap">
          <button type="button" className="si-share">
            Share project
            <span aria-hidden="true">
              ↗
            </span>
          </button>
          <div className="si-menu si-share-menu" role="menu" hidden>
            <button type="button" role="menuitem">
              Copy link
            </button>
            <button type="button" role="menuitem">
              Email link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Tag input

**When to use:** A compact list of freely entered labels.

**Options:** Edit datalist suggestions; listen for seenry:add and seenry:remove.

**Keyboard:** Enter or comma adds; Backspace on empty input removes last; remove buttons are tabbable.

**HTML**

```html
<div data-demo="tags">
  <div class="demo-stage">
    <div class="si-tags">
      <div class="si-tag-list">
        <span class="si-tag">
          Design
          <button type="button" aria-label="Remove Design">
            ×
          </button>
        </span>
      </div>
      <input type="text" aria-label="Add a tag" placeholder="Add a tag" list="tag-suggestions">
    </div>
    <datalist id="tag-suggestions">
      <option value="Research">
        <option value="Review">
          <option value="Priority"></option>
        </option>
      </option>
    </datalist>
  </div>
</div>
```

**React**

```jsx
function TagInput() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="tags">
      <div className="demo-stage">
        <div className="si-tags">
          <div className="si-tag-list">
            <span className="si-tag">
              Design
              <button type="button" aria-label="Remove Design">
                ×
              </button>
            </span>
          </div>
          <input type="text" aria-label="Add a tag" placeholder="Add a tag" list="tag-suggestions" />
        </div>
        <datalist id="tag-suggestions">
          <option value="Research">
            <option value="Review">
              <option value="Priority"></option>
            </option>
          </option>
        </datalist>
      </div>
    </div>
  );
}
```

### Inline edit

**When to use:** Small values that should be edited in place.

**Options:** Change the initial text and listen for seenry:save.

**Keyboard:** Enter opens or saves; Escape cancels; blur saves.

**HTML**

```html
<div data-demo="edit">
  <div class="demo-stage">
    <div class="si-inline">
      <button type="button" class="si-inline-display" aria-label="Edit project name">
        Atlas workspace
        <span aria-hidden="true">
          ✎
        </span>
      </button>
      <input type="text" aria-label="Project name" hidden="">
      <span class="si-inline-status" role="status"></span>
    </div>
  </div>
</div>
```

**React**

```jsx
function InlineEdit() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="edit">
      <div className="demo-stage">
        <div className="si-inline">
          <button type="button" className="si-inline-display" aria-label="Edit project name">
            Atlas workspace
            <span aria-hidden="true">
              ✎
            </span>
          </button>
          <input type="text" aria-label="Project name" hidden />
          <span className="si-inline-status" role="status"></span>
        </div>
      </div>
    </div>
  );
}
```

### Reorderable list

**When to use:** Short ordered lists that support direct manipulation.

**Options:** Edit list items; listen for seenry:reorder to persist order.

**Keyboard:** Alt+Up/Down moves the focused handle; drag and drop also works.

**HTML**

```html
<div data-demo="reorder">
  <div class="demo-stage">
    <ol class="si-reorder">
      <li draggable="true">
        <button type="button" class="si-drag-handle" aria-label="Move Discovery">
          ⠿
        </button>
        <span>
          Discovery
        </span>
      </li>
      <li draggable="true">
        <button type="button" class="si-drag-handle" aria-label="Move Design review">
          ⠿
        </button>
        <span>
          Design review
        </span>
      </li>
      <li draggable="true">
        <button type="button" class="si-drag-handle" aria-label="Move Handoff">
          ⠿
        </button>
        <span>
          Handoff
        </span>
      </li>
    </ol>
    <span class="si-visually-hidden si-reorder-live" aria-live="polite"></span>
  </div>
</div>
```

**React**

```jsx
function ReorderableList() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="reorder">
      <div className="demo-stage">
        <ol className="si-reorder">
          <li draggable="true">
            <button type="button" className="si-drag-handle" aria-label="Move Discovery">
              ⠿
            </button>
            <span>
              Discovery
            </span>
          </li>
          <li draggable="true">
            <button type="button" className="si-drag-handle" aria-label="Move Design review">
              ⠿
            </button>
            <span>
              Design review
            </span>
          </li>
          <li draggable="true">
            <button type="button" className="si-drag-handle" aria-label="Move Handoff">
              ⠿
            </button>
            <span>
              Handoff
            </span>
          </li>
        </ol>
        <span className="si-visually-hidden si-reorder-live" aria-live="polite"></span>
      </div>
    </div>
  );
}
```

### File dropzone

**When to use:** Collect files through browsing or drag and drop.

**Options:** The gallery simulates preparation progress. Handle seenry:file and call event.preventDefault() to take over; event.detail.update(percent, error) updates each row. Max size is 5 MB.

**Keyboard:** Tab to the file input and press Enter/Space to browse; remove buttons are tabbable.

**HTML**

```html
<div data-demo="drop">
  <div class="demo-stage">
    <div class="si-drop">
      <input type="file" multiple="" aria-label="Choose files">
      <strong>
        Drop files here
      </strong>
      <span>
        or browse from your device · up to 5 MB
      </span>
    </div>
    <ul class="si-file-list"></ul>
  </div>
</div>
```

**React**

```jsx
function FileDropzone() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="drop">
      <div className="demo-stage">
        <div className="si-drop">
          <input type="file" multiple aria-label="Choose files" />
          <strong>
            Drop files here
          </strong>
          <span>
            or browse from your device · up to 5 MB
          </span>
        </div>
        <ul className="si-file-list"></ul>
      </div>
    </div>
  );
}
```

### Date range picker

**When to use:** A two-month range selector with quick presets.

**Options:** Edit preset lengths via data-preset; listen for seenry:change.

**Keyboard:** Arrows move by day or week; PageUp/PageDown change month; Enter selects.

**HTML**

```html
<div data-demo="date">
  <div class="demo-stage">
    <div class="si-date">
      <div class="si-date-top">
        <button type="button" data-date-nav="-1" aria-label="Previous month">
          ‹
        </button>
        <strong class="si-date-label"></strong>
        <button type="button" data-date-nav="1" aria-label="Next month">
          ›
        </button>
      </div>
      <div class="si-date-months"></div>
      <div class="si-date-presets">
        <button type="button" data-preset="7">
          Last 7 days
        </button>
        <button type="button" data-preset="30">
          Last 30 days
        </button>
        <span class="si-date-output" role="status">
          Choose dates
        </span>
      </div>
    </div>
  </div>
</div>
```

**React**

```jsx
function DateRangePicker() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="date">
      <div className="demo-stage">
        <div className="si-date">
          <div className="si-date-top">
            <button type="button" data-date-nav="-1" aria-label="Previous month">
              ‹
            </button>
            <strong className="si-date-label"></strong>
            <button type="button" data-date-nav="1" aria-label="Next month">
              ›
            </button>
          </div>
          <div className="si-date-months"></div>
          <div className="si-date-presets">
            <button type="button" data-preset="7">
              Last 7 days
            </button>
            <button type="button" data-preset="30">
              Last 30 days
            </button>
            <span className="si-date-output" role="status">
              Choose dates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Range slider

**When to use:** Single and bounded numeric ranges.

**Options:** Change min, max, step and initial values on native range inputs.

**Keyboard:** Native range keys work: arrows, PageUp/Down, Home/End.

**HTML**

```html
<div data-demo="range">
  <div class="demo-stage">
    <div class="si-range-block">
      <label>
        Volume
        <output>
          42%
        </output>
      </label>
      <input type="range" min="0" max="100" step="1" value="42">
      <div class="si-range-marks">
        <span>
          0
        </span>
        <span>
          50
        </span>
        <span>
          100
        </span>
      </div>
    </div>
    <div class="si-dual">
      <label>
        Budget range
        <output>
          $20–$80
        </output>
      </label>
      <div class="si-dual-track">
        <span></span>
        <input type="range" aria-label="Minimum budget" min="0" max="100" value="20">
        <input type="range" aria-label="Maximum budget" min="0" max="100" value="80">
      </div>
    </div>
  </div>
</div>
```

**React**

```jsx
function RangeSlider() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="range">
      <div className="demo-stage">
        <div className="si-range-block">
          <label>
            Volume
            <output>
              42%
            </output>
          </label>
          <input type="range" min="0" max="100" step="1" defaultValue="42" />
          <div className="si-range-marks">
            <span>
              0
            </span>
            <span>
              50
            </span>
            <span>
              100
            </span>
          </div>
        </div>
        <div className="si-dual">
          <label>
            Budget range
            <output>
              $20–$80
            </output>
          </label>
          <div className="si-dual-track">
            <span></span>
            <input type="range" aria-label="Minimum budget" min="0" max="100" defaultValue="20" />
            <input type="range" aria-label="Maximum budget" min="0" max="100" defaultValue="80" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Number stepper

**When to use:** Small bounded integer quantities.

**Options:** Set data-min, data-max and data-value on .si-stepper.

**Keyboard:** Enter/Space changes once; pointer hold repeats after 450 ms.

**HTML**

```html
<div data-demo="stepper">
  <div class="demo-stage">
    <div class="si-stepper" data-min="1" data-max="20" data-value="3">
      <button type="button" data-step="-1" aria-label="Decrease seats">
        −
      </button>
      <output aria-live="polite">
        03
      </output>
      <button type="button" data-step="1" aria-label="Increase seats">
        +
      </button>
    </div>
    <span class="si-muted">
      Seats, from 1 to 20
    </span>
  </div>
</div>
```

**React**

```jsx
function NumberStepper() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="stepper">
      <div className="demo-stage">
        <div className="si-stepper" data-min="1" data-max="20" data-value="3">
          <button type="button" data-step="-1" aria-label="Decrease seats">
            −
          </button>
          <output aria-live="polite">
            03
          </output>
          <button type="button" data-step="1" aria-label="Increase seats">
            +
          </button>
        </div>
        <span className="si-muted">
          Seats, from 1 to 20
        </span>
      </div>
    </div>
  );
}
```

### Undo toast

**When to use:** Reversible actions with a short decision window.

**Options:** Change action copy and timeout; listen for seenry:archive and seenry:undo.

**Keyboard:** Undo button is reachable by Tab and activates with Enter/Space.

**HTML**

```html
<div data-demo="undo">
  <div class="demo-stage">
    <button type="button" class="si-undo-trigger">
      Archive message
    </button>
    <div class="si-undo-toast" role="status" hidden="">
      <span>
        Message archived
      </span>
      <button type="button">
        Undo
      </button>
      <span class="si-toast-timer"></span>
    </div>
  </div>
</div>
```

**React**

```jsx
function UndoToast() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="undo">
      <div className="demo-stage">
        <button type="button" className="si-undo-trigger">
          Archive message
        </button>
        <div className="si-undo-toast" role="status" hidden>
          <span>
            Message archived
          </span>
          <button type="button">
            Undo
          </button>
          <span className="si-toast-timer"></span>
        </div>
      </div>
    </div>
  );
}
```

### Promise toast

**When to use:** One operation with loading and settled states.

**Options:** Handle the cancelable seenry:promise event, preventDefault(), then call event.detail.setState(loading|success|error|hidden, message) from your operation.

**Keyboard:** Trigger button activates with Enter/Space; status is announced.

**HTML**

```html
<div data-demo="promise">
  <div class="demo-stage">
    <button type="button" class="si-promise-trigger">
      Sync workspace
    </button>
    <div class="si-promise-toast" role="status" hidden="">
      <span class="si-live-dot" data-seenry-dot="live"></span>
      <span>
        Syncing workspace…
      </span>
    </div>
  </div>
</div>
```

**React**

```jsx
function PromiseToast() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="promise">
      <div className="demo-stage">
        <button type="button" className="si-promise-trigger">
          Sync workspace
        </button>
        <div className="si-promise-toast" role="status" hidden>
          <span className="si-live-dot" data-seenry-dot="live"></span>
          <span>
            Syncing workspace…
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Reading progress and back to top

**When to use:** Long pages where position matters.

**Options:** Place the progress bar and back-to-top button at document level.

**Keyboard:** Back-to-top button appears after scrolling and activates with Enter/Space.

**HTML**

```html
<div data-demo="reading">
  <div class="demo-stage">
    <div class="si-reading-sample">
      <span class="si-reading-sample-bar"></span>
      <span>
        Continue scrolling this gallery
      </span>
      <span aria-hidden="true">
        ↑
      </span>
    </div>
  </div>
</div>
```

**React**

```jsx
function ReadingProgressBackToTop() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="reading">
      <div className="demo-stage">
        <div className="si-reading-sample">
          <span className="si-reading-sample-bar"></span>
          <span>
            Continue scrolling this gallery
          </span>
          <span aria-hidden="true">
            ↑
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Waveform player

**When to use:** Short audio previews with direct seeking.

**Options:** Set data-src on .si-player to a real audio URL and optional data-peaks as comma-separated bar heights. Without a source, the gallery generates a quiet tone.

**Keyboard:** Space/Enter plays; focused waveform uses arrows or Home/End to seek.

**HTML**

```html
<div data-demo="wave">
  <div class="demo-stage">
    <div class="si-player" data-duration="38">
      <button type="button" class="si-play" aria-label="Play preview">
        ▶
      </button>
      <div class="si-wave" role="slider" tabindex="0" aria-label="Audio position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
      <span class="si-player-time">
        0:00 / 0:38
      </span>
    </div>
  </div>
</div>
```

**React**

```jsx
function WaveformPlayer() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="wave">
      <div className="demo-stage">
        <div className="si-player" data-duration="38">
          <button type="button" className="si-play" aria-label="Play preview">
            ▶
          </button>
          <div className="si-wave" role="slider" tabIndex="0" aria-label="Audio position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
          <span className="si-player-time">
            0:00 / 0:38
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Uptime bar

**When to use:** Dense daily service history.

**Options:** Set data-incidents on .si-uptime to comma-separated zero-based days in the 90-day window. Each generated bar has a date and status label.

**Keyboard:** Tab through daily bars to hear date and status.

**HTML**

```html
<div data-demo="uptime">
  <div class="demo-stage">
    <div class="si-uptime" data-incidents="18,49,77">
      <div class="si-uptime-head">
        <strong>
          API availability
        </strong>
        <span>
          99.98% uptime
        </span>
      </div>
      <div class="si-uptime-bars" role="group" aria-label="Uptime over the last 90 days"></div>
      <div class="si-uptime-foot">
        <span>
          90 days ago
        </span>
        <span>
          Today
        </span>
      </div>
    </div>
  </div>
</div>
```

**React**

```jsx
function UptimeBar() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="uptime">
      <div className="demo-stage">
        <div className="si-uptime" data-incidents="18,49,77">
          <div className="si-uptime-head">
            <strong>
              API availability
            </strong>
            <span>
              99.98% uptime
            </span>
          </div>
          <div className="si-uptime-bars" role="group" aria-label="Uptime over the last 90 days"></div>
          <div className="si-uptime-foot">
            <span>
              90 days ago
            </span>
            <span>
              Today
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Sparkline

**When to use:** A trend when exact hover values matter.

**Options:** Set data-values on .si-spark to comma-separated real values; the line and crosshair are generated from them.

**Keyboard:** Focus chart, then use Left/Right Arrow to inspect points.

**HTML**

```html
<div data-demo="spark">
  <div class="demo-stage">
    <div class="si-spark" data-values="520,640,590,780,720,860,810,980,930,1100,1284">
      <div>
        <span>
          Weekly signups
        </span>
        <strong>
          1,284
        </strong>
      </div>
      <svg viewbox="0 0 240 88" role="img" aria-label="Weekly signups trend">
        <path class="si-spark-path" d="M0 70 L24 60 L48 65 L72 42 L96 48 L120 34 L144 40 L168 22 L192 29 L216 14 L240 19"></path>
        <line class="si-spark-cross" x1="0" x2="0" y1="0" y2="88"></line>
        <circle class="si-spark-dot" cx="0" cy="70" r="4"></circle>
      </svg>
      <span class="si-spark-value" role="status">
        Hover to inspect
      </span>
    </div>
  </div>
</div>
```

**React**

```jsx
function Sparkline() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="spark">
      <div className="demo-stage">
        <div className="si-spark" data-values="520,640,590,780,720,860,810,980,930,1100,1284">
          <div>
            <span>
              Weekly signups
            </span>
            <strong>
              1,284
            </strong>
          </div>
          <svg viewBox="0 0 240 88" role="img" aria-label="Weekly signups trend">
            <path className="si-spark-path" d="M0 70 L24 60 L48 65 L72 42 L96 48 L120 34 L144 40 L168 22 L192 29 L216 14 L240 19"></path>
            <line className="si-spark-cross" x1="0" x2="0" y1="0" y2="88"></line>
            <circle className="si-spark-dot" cx="0" cy="70" r="4"></circle>
          </svg>
          <span className="si-spark-value" role="status">
            Hover to inspect
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Stacked drawer

**When to use:** A related detail task one layer deeper than the first.

**Options:** Replace drawer content and connect the open buttons to your task.

**Keyboard:** Escape pops one layer; Tab stays within the active drawer.

**HTML**

```html
<div data-demo="drawer">
  <div class="demo-stage">
    <button type="button" class="si-drawer-open">
      Open details
    </button>
    <div class="si-drawer-host">
      <div class="si-drawer-backdrop" hidden=""></div>
      <div class="si-drawer" role="dialog" aria-modal="true" aria-label="Project details" hidden="">
        <div class="si-drawer-header">
          <strong>
            Project details
          </strong>
          <button type="button" class="si-drawer-close" aria-label="Close drawer">
            ×
          </button>
        </div>
        <p>
          Atlas workspace · Updated today
        </p>
        <button type="button" class="si-drawer-next">
          Open activity
        </button>
      </div>
      <div class="si-drawer si-drawer-second" role="dialog" aria-modal="true" aria-label="Project activity" hidden="">
        <div class="si-drawer-header">
          <strong>
            Activity
          </strong>
          <button type="button" class="si-drawer-close" aria-label="Close drawer">
            ×
          </button>
        </div>
        <p>
          Design review completed 2 hours ago.
        </p>
      </div>
    </div>
  </div>
</div>
```

**React**

```jsx
function StackedDrawer() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="drawer">
      <div className="demo-stage">
        <button type="button" className="si-drawer-open">
          Open details
        </button>
        <div className="si-drawer-host">
          <div className="si-drawer-backdrop" hidden></div>
          <div className="si-drawer" role="dialog" aria-modal="true" aria-label="Project details" hidden>
            <div className="si-drawer-header">
              <strong>
                Project details
              </strong>
              <button type="button" className="si-drawer-close" aria-label="Close drawer">
                ×
              </button>
            </div>
            <p>
              Atlas workspace · Updated today
            </p>
            <button type="button" className="si-drawer-next">
              Open activity
            </button>
          </div>
          <div className="si-drawer si-drawer-second" role="dialog" aria-modal="true" aria-label="Project activity" hidden>
            <div className="si-drawer-header">
              <strong>
                Activity
              </strong>
              <button type="button" className="si-drawer-close" aria-label="Close drawer">
                ×
              </button>
            </div>
            <p>
              Design review completed 2 hours ago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Image hotspots

**When to use:** Short annotations pinned to image points.

**Options:** Replace SVG/image and hotspot positions and card text.

**Keyboard:** Tab to a point, Enter/Space opens it, Escape closes its card.

**HTML**

```html
<div data-demo="hotspots">
  <div class="demo-stage">
    <div class="si-hotspot-image">
      <svg viewbox="0 0 420 190" aria-hidden="true">
        <rect width="420" height="190" fill="#dce3e7">
          <rect x="0" y="136" width="420" height="54" fill="#c7d0d2">
            <rect x="72" y="54" width="276" height="103" rx="8" fill="#39434c">
              <rect x="81" y="62" width="258" height="84" fill="#f2f4f3">
                <rect x="97" y="76" width="94" height="9" rx="4" fill="#9aaab0">
                  <rect x="97" y="96" width="209" height="6" rx="3" fill="#cbd4d6">
                    <rect x="97" y="109" width="174" height="6" rx="3" fill="#cbd4d6">
                      <rect x="246" y="121" width="60" height="14" rx="5" fill="#315cce">
                        <path d="M176 157h68l16 14H160z" fill="#68737a"></path>
                      </rect>
                    </rect>
                  </rect>
                </rect>
              </rect>
            </rect>
          </rect>
        </rect>
      </svg>
      <button type="button" class="si-hotspot" style="left:28%;top:43%" aria-label="Display details" aria-expanded="false">
        1
      </button>
      <button type="button" class="si-hotspot" style="left:67%;top:62%" aria-label="Action details" aria-expanded="false">
        2
      </button>
      <div class="si-hotspot-card" hidden=""></div>
    </div>
  </div>
</div>
```

**React**

```jsx
function ImageHotspots() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="hotspots">
      <div className="demo-stage">
        <div className="si-hotspot-image">
          <svg viewBox="0 0 420 190" aria-hidden="true">
            <rect width="420" height="190" fill="#dce3e7">
              <rect x="0" y="136" width="420" height="54" fill="#c7d0d2">
                <rect x="72" y="54" width="276" height="103" rx="8" fill="#39434c">
                  <rect x="81" y="62" width="258" height="84" fill="#f2f4f3">
                    <rect x="97" y="76" width="94" height="9" rx="4" fill="#9aaab0">
                      <rect x="97" y="96" width="209" height="6" rx="3" fill="#cbd4d6">
                        <rect x="97" y="109" width="174" height="6" rx="3" fill="#cbd4d6">
                          <rect x="246" y="121" width="60" height="14" rx="5" fill="#315cce">
                            <path d="M176 157h68l16 14H160z" fill="#68737a"></path>
                          </rect>
                        </rect>
                      </rect>
                    </rect>
                  </rect>
                </rect>
              </rect>
            </rect>
          </svg>
          <button type="button" className="si-hotspot" style={{left:'28%',top:'43%'}} aria-label="Display details" aria-expanded="false">
            1
          </button>
          <button type="button" className="si-hotspot" style={{left:'67%',top:'62%'}} aria-label="Action details" aria-expanded="false">
            2
          </button>
          <div className="si-hotspot-card" hidden></div>
        </div>
      </div>
    </div>
  );
}
```

### Pricing toggle

**When to use:** Billing choices with a visible price update.

**Options:** Set data-monthly and data-yearly on .si-pricing; edit savings text.

**Keyboard:** Tab between choices; Enter/Space selects.

**HTML**

```html
<div data-demo="pricing">
  <div class="demo-stage">
    <div class="si-pricing" data-monthly="24" data-yearly="19">
      <div class="si-pricing-switch" role="group" aria-label="Billing frequency">
        <button type="button" aria-pressed="true">
          Monthly
        </button>
        <button type="button" aria-pressed="false">
          Yearly
          <span>
            Save 20%
          </span>
        </button>
      </div>
      <div class="si-price">
        <strong>
          $
          <span>
            24
          </span>
        </strong>
        <span>
          / seat / month
        </span>
      </div>
    </div>
  </div>
</div>
```

**React**

```jsx
function PricingToggle() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="pricing">
      <div className="demo-stage">
        <div className="si-pricing" data-monthly="24" data-yearly="19">
          <div className="si-pricing-switch" role="group" aria-label="Billing frequency">
            <button type="button" aria-pressed="true">
              Monthly
            </button>
            <button type="button" aria-pressed="false">
              Yearly
              <span>
                Save 20%
              </span>
            </button>
          </div>
          <div className="si-price">
            <strong>
              $
              <span>
                24
              </span>
            </strong>
            <span>
              / seat / month
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Radio cards

**When to use:** Mutually exclusive choices that need explanation.

**Options:** Change native radio names, values and copy.

**Keyboard:** Native radio group arrows change selection.

**HTML**

```html
<div data-demo="radio">
  <div class="demo-stage">
    <div class="si-radio-cards" role="radiogroup" aria-label="Workspace plan">
      <label>
        <input type="radio" name="plan" value="starter" checked="">
        <span class="si-radio-indicator"></span>
        <strong>
          Starter
        </strong>
        <small>
          For small teams
        </small>
      </label>
      <label>
        <input type="radio" name="plan" value="team">
        <span class="si-radio-indicator"></span>
        <strong>
          Team
        </strong>
        <small>
          For growing work
        </small>
      </label>
    </div>
  </div>
</div>
```

**React**

```jsx
function RadioCards() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="radio">
      <div className="demo-stage">
        <div className="si-radio-cards" role="radiogroup" aria-label="Workspace plan">
          <label>
            <input type="radio" name="plan" defaultValue="starter" defaultChecked />
            <span className="si-radio-indicator"></span>
            <strong>
              Starter
            </strong>
            <small>
              For small teams
            </small>
          </label>
          <label>
            <input type="radio" name="plan" defaultValue="team" />
            <span className="si-radio-indicator"></span>
            <strong>
              Team
            </strong>
            <small>
              For growing work
            </small>
          </label>
        </div>
      </div>
    </div>
  );
}
```

### Status picker

**When to use:** Presence presets with an expiry time.

**Options:** Edit preset buttons and clear-after select; listen for seenry:change.

**Keyboard:** Enter opens; Up/Down moves menu items; Escape closes.

**HTML**

```html
<div data-demo="status">
  <div class="demo-stage">
    <div class="si-status-picker">
      <button type="button" class="si-status-trigger" aria-haspopup="menu" aria-expanded="false">
        <span class="si-presence-dot" data-seenry-dot="presence"></span>
        <span>
          Available
        </span>
        <span aria-hidden="true">
          ⌄
        </span>
      </button>
      <div class="si-menu si-status-menu" role="menu" hidden="">
        <button type="button" role="menuitem" data-status="Available">
          Available
        </button>
        <button type="button" role="menuitem" data-status="Focusing">
          Focusing
        </button>
        <button type="button" role="menuitem" data-status="Away">
          Away
        </button>
        <label>
          Clear after
          <select aria-label="Clear status after">
            <option value="3600">
              1 hour
            </option>
            <option value="14400">
              4 hours
            </option>
            <option value="86400">
              Today
            </option>
          </select>
        </label>
      </div>
    </div>
  </div>
</div>
```

**React**

```jsx
function StatusPicker() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="status">
      <div className="demo-stage">
        <div className="si-status-picker">
          <button type="button" className="si-status-trigger" aria-haspopup="menu" aria-expanded="false">
            <span className="si-presence-dot" data-seenry-dot="presence"></span>
            <span>
              Available
            </span>
            <span aria-hidden="true">
              ⌄
            </span>
          </button>
          <div className="si-menu si-status-menu" role="menu" hidden>
            <button type="button" role="menuitem" data-status="Available">
              Available
            </button>
            <button type="button" role="menuitem" data-status="Focusing">
              Focusing
            </button>
            <button type="button" role="menuitem" data-status="Away">
              Away
            </button>
            <label>
              Clear after
              <select aria-label="Clear status after">
                <option value="3600">
                  1 hour
                </option>
                <option value="14400">
                  4 hours
                </option>
                <option value="86400">
                  Today
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Autosave status and relative time

**When to use:** Editors that save shortly after changes.

**Options:** Handle the cancelable seenry:autosave event, preventDefault(), then call event.detail.setState(saved|error) from your persistence result.

**Keyboard:** Type normally; saving and relative time are announced in a status region.

**HTML**

```html
<div data-demo="autosave">
  <div class="demo-stage">
    <div class="si-autosave">
      <label>
        Document title
        <input type="text" value="Quarterly planning" aria-label="Document title">
      </label>
      <div class="si-autosave-status" role="status">
        <span class="si-presence-dot" data-seenry-dot="presence"></span>
        <span>
          Saved just now
        </span>
      </div>
    </div>
  </div>
</div>
```

**React**

```jsx
function AutosaveStatusRelativeTime() {
  const ref = React.useRef(null);
  React.useEffect(() => { window.SeenryInteraction.init(ref.current); }, []);
  return (
    <div ref={ref} data-demo="autosave">
      <div className="demo-stage">
        <div className="si-autosave">
          <label>
            Document title
            <input type="text" defaultValue="Quarterly planning" aria-label="Document title" />
          </label>
          <div className="si-autosave-status" role="status">
            <span className="si-presence-dot" data-seenry-dot="presence"></span>
            <span>
              Saved just now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Verify

Run `node ../../../scripts/review_board.mjs gallery.html` and `node ../../../scripts/motion_judge.mjs gallery.html --selector "[data-replay]" --max 40` (Playwright required). Both should report no blockers; the motion judge should score 8 or higher.
