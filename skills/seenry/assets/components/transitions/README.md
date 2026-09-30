# Seenry Transitions

28 original transitions. Plain HTML, one CSS file, one classic JavaScript file. No packages, network requests, build step, or external fonts. Open [gallery.html](gallery.html) directly from disk.

## Install

```html
<link rel="stylesheet" href="seenry-transitions.css">
<script src="seenry-transitions.js" defer></script>
```

The runtime initializes on DOMContentLoaded and observes later additions. Call `SeenryTransitions.init(root)` when attaching declarative content yourself; repeated calls are safe. Namespaced classes and data attributes avoid collisions. All colors, typography, radii and timings use custom properties; override the Seenry product tokens in your project. Explicit `[data-theme="light"]` and `[data-theme="dark"]` work on nested containers. Without an explicit root theme, system color preference applies.

## When to use

| Transition | Tokens (ms / curve) | When and why |
| --- | --- | --- |
| Card resize | surface 240 / M; feedback 80 / F | Measured shell and neighbours keep spatial continuity. |
| Number pop-in | control 160 / E; feedback 80 / X; delay 40 | Changed digits roll in value direction with 4px blur; repeated values must stay current. |
| Notification badge | control 160 / E | A small local settle acknowledges a count. |
| Text states swap | control 160 / E; feedback 80 / F; glyph offsets 20, capped 60 | A stable label slot reveals changed words. |
| Menu dropdown | relocate 180 / M; quick 120 / M exit | The shell grows from its trigger; actions appear together without label filters. |
| Modal open and close | surface 240 / E; quick 120 / X | Content travels attached to the centered dialog. |
| Inline panel reveal | spatial 280 / M; surface 240 / M return; quick 120 / F | The trigger becomes a larger surface, then returns. |
| Page side by side | spatial 280 / M | Related content enters in the navigation direction. |
| Icon swap | feedback 80 / F; quick 120 / E; delay 40 | Crossfade incompatible icons within one fixed target. |
| Success check | control 160 / E | Immediate success semantics precede the local stroke resolve. |
| Avatar group | control 160 / E | A short local lift identifies the focused member. |
| Error shake | relocate 180 / E | Only the field frame shakes by 3px; the label, message and action stay still. |
| Accordion | surface 240 / M; quick 120 / F | Measured disclosure bounds preserve readable text. |
| Banner stacking | relocate 180 / M | Existing notices move together to readable slots. |
| Checkbox | quick 120 / E | A frequent selection needs a short stroke. |
| Input clear | quick 120 / X | The old input clears immediately; its decorative copy exits. |
| Learn more arrow | quick 120 / E | A four-pixel cue follows hover or focus. |
| Like button | control 160 / E | State and count commit before local feedback settles. |
| Plus menu morph | relocate 180 / M; quick 120 / E, F | The action button becomes its menu; the close stays under the pointer. |
| Text shimmer | spatial 280 / E | One bounded text-size highlight; no perpetual ornament. |
| Skeleton reveal | quick 120 / F; relocate 180 / F | Placeholder and ready content crossfade in reserved geometry. |
| Tabs sliding | relocate 180 / M; quick 120 / F; delay 40 | The shared indicator relocates; keyboard selection is instant. |
| Toast | relocate 180 / E; quick 120 / X | A notice enters 8px with attached text and exits promptly. |
| Toggle | control 160 / E | A small thumb travels within a stable hit area. |
| Tooltip | quick 120 / E; feedback 80 / X | A two-pixel arrival follows 400ms hover dwell; focus is immediate. |
| Streaming text | feedback 80 / F | Available chunks batch per frame, without translation or artificial delay. |
| Thinking states | feedback 80 / F; quick 120 / F; delay 40 | Honest application status changes in a fixed slot, without dots. |
| Texts reveal | surface 240 / E; offsets 20, capped 60 | A rare introduction keeps content readable throughout. |

Curves: E `cubic-bezier(.16,1,.3,1)` resolves arrivals; M `cubic-bezier(.4,0,.2,1)` preserves visible movement; F `cubic-bezier(.2,0,.2,1)` fades; X `cubic-bezier(.4,0,1,1)` clears outgoing content. Durations are `--st-instant:0ms`, `--st-feedback:80ms`, `--st-quick:120ms`, `--st-control:160ms`, `--st-relocate:180ms`, `--st-surface:240ms`, `--st-spatial:280ms`. Delay tokens are 0/40/60/80ms. Choose by distance × size × frequency; keyboard navigation is instant.

Numbers use the changed-digit, direction and 4px blur formula from seenry SKILL.md (Motion) at the study's frequent-readout clock (160ms in, 80ms out, 40ms overlap). They have no cascade at live-update frequency. Rapid updates within one second use a 4px fade/move with no blur or entrance delay; mark known steppers with `data-st-frequent` (or `{frequent: true}`) for this treatment from the first update. Back navigation uses surface 240 / M. `data-st="sheet"` with a native dialog uses the panel's button-origin geometry without adding a gallery family.

## API and styling contract

Required APIs: `number(el, value, options?)`, `swapText(el, text)`, `shake(el)`, `success(el)`, `page(direction, update, element?)`, `resize(el, update)`. Additional helpers: `open`, `close`, `icon`, `pop`, `reveal`, `shimmer`, `skeleton`, `stream`, `toast`, `tab`, `init`.

Legacy timing aliases remain available: `fast → quick`, `base → control`, `slow → surface`, `page → spatial`; curve aliases resolve to E/M. New implementations use the named family tokens above. Geometry and color custom properties remain compatible.

Animation retargets from the current frame and never queues stale outcomes. Animated values are transform, opacity, clip-path and SVG stroke. Versioned completion callbacks preserve native layer exits and cancel stale cleanup. Size changes use a painted-shell FLIP: the layout commits immediately, the shell and sibling displacement animate, and text is never stretched. No width/height animation, large-surface blur, permanent will-change or perpetual animation loop.

Reduced motion is live: switching the system preference settles running kit animations, removes travel and loops, and preserves semantic state. Cleanup cancels animations when elements are removed. No animation completion is needed to commit application state.

### React ownership

Load the classic script once before mounting these snippets; import the CSS normally or link it. Examples use `useRef`, `useEffect`, `useState`, `useId` from React as needed. The page example also imports `flushSync` from `react-dom`. These are integration examples, not runtime dependencies. They are compatible with client-rendered React; for server rendering, provide static initial content and enhance after hydration.

Give imperative helpers a dedicated DOM slot with no React-managed children. React owns data and async work; the helper owns that slot's visual children. Do not make `data-value` a controlled prop while also calling `number()` with a different value. Uncontrolled native elements retain their normal semantics. Abort requests and unsubscribe application listeners on unmount. The examples' application functions (saveChanges, saveLike, searchProjects, openMember, etc.) must be supplied by the host.

## Card resize

**When to use:** A little more room, without stretching the words. Purpose: continuity.

```html
<section id="example-resize">
<div data-st="resize" class="st-surface"><div class="st-row"><span>Project details</span></div><p class="st-muted">Website refresh</p><button class="st-button">Show details</button><div class="st-extra" hidden><p>Design review is ready. Two updates are waiting for your feedback.</p></div></div>
</section>
```

```js
const root = document.getElementById('example-resize');
const card = root.querySelector('[data-st=resize]');
root.querySelector('button').onclick = () => SeenryTransitions.resize(card, () => {
  const content = card.querySelector('.st-extra'); content.hidden = !content.hidden;
});
```

**Options:** Call resize(el, synchronousUpdate). It returns a settled Promise. Include sibling elements in the same parent for FLIP displacement. Keep the trigger before the changing body so it stays anchored. Keep dynamic content in child elements; growth clips new content to the expanding boundary. Async work must finish before calling update.

**Keyboard:** Enter or Space on the disclosure button. Focus stays on that button.

**Performance:** FLIP transforms a separate painted shell; child text is never scaled. Two layout reads per update. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function ResizingCard() {
  const card = useRef(null), content = useRef(null);
  return <div ref={card} data-st="resize" className="st-surface">
    <p>Project details</p><div ref={content} hidden>Ready for review.</div>
    <button className="st-button" onClick={() => SeenryTransitions.resize(card.current,
      () => { content.current.hidden = !content.current.hidden; })}>Toggle details</button>
  </div>;
}
```
## Number pop-in

**When to use:** Only the digits that change take a step. Purpose: feedback.

```html
<section id="example-number">
<div class="st-stat"><span class="st-muted">Monthly subscribers</span><strong data-st="number" data-value="1284">1,284</strong><button class="st-button">Add subscriber</button></div>
</section>
```

```js
const root = document.getElementById('example-number');
root.querySelector('button').onclick = () => {
  const el = root.querySelector('[data-st=number]');
  el.dataset.value = String(Number(el.dataset.value) + 1);
};
```

**Options:** data-value initializes or updates the count. number(el, value, {locale, format, frequent}) uses Intl.NumberFormat options. Set `frequent: true` or `data-st-frequent` on stepper readouts to use a 4px fade/move without blur from the first press. Updates less than one second apart automatically use this treatment and cancel any in-flight digit blur. Values must be finite. --st-reserve reserves the widest expected formatted value; default 7ch. Only changed places animate, no stagger for frequent updates. Set locale and direction appropriately for international data.

**Keyboard:** Display only. Trigger updates from a native control; choose live-region policy in the application.

**Performance:** Only changed places animate; tabular cells and a reserved width keep units stable. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function AnimatedNumber({value}) {
  const ref = useRef(null);
  useEffect(() => { SeenryTransitions.number(ref.current, value); }, [value]);
  return <span ref={ref} data-st="number" />;
}
```
## Notification badge

**When to use:** A small arrival, anchored to its corner. Purpose: feedback.

```html
<section id="example-badge">
<button class="st-button">Inbox <span data-st="badge" data-value="3">3</span></button>
</section>
```

```js
const root = document.getElementById('example-badge');
root.querySelector('button').onclick = () => {
  const badge = root.querySelector('[data-st=badge]');
  badge.dataset.value = String(Number(badge.dataset.value) + 1);
  SeenryTransitions.pop(badge);
};
```

**Options:** data-value and number() update the count; pop(el) plays the corner-origin settle. --st-reserve defaults to 2ch in badges. Zero stays visible; hide the whole owning badge only if the product calls for it.

**Keyboard:** The owning Inbox button supports Enter and Space. The count is real accessible text.

**Performance:** One local scale animation and changed digit transforms; no layout loop. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Badge({count}) {
  const ref = useRef(null);
  useEffect(() => { SeenryTransitions.number(ref.current, count); SeenryTransitions.pop(ref.current); }, [count]);
  return <span ref={ref} data-st="badge" />;
}
```
## Text states swap

**When to use:** The label changes. The button stays put. Purpose: state.

```html
<section id="example-text">
<button class="st-button st-primary"><span data-st="text" style="--st-reserve:14ch">Save changes</span></button>
</section>
```

```js
const root = document.getElementById('example-text');
root.querySelector('button').onclick = async () => {
  const button = root.querySelector('button'); button.disabled = true;
  const label = root.querySelector('[data-st=text]');
  SeenryTransitions.swapText(label, 'Saving…');
  try { await saveChanges(); SeenryTransitions.swapText(label, 'Saved'); }
  catch { SeenryTransitions.swapText(label, 'Try again'); }
  finally { button.disabled = false; }
}; // saveChanges is your application function.
```

**Options:** swapText(el, text) publishes the new accessible text immediately and fades the old decorative layer out. --st-reserve reserves labels (set it to the widest known label). The slot never shrinks below its widest observed size.

**Keyboard:** The owning button supports Enter and Space; its focus and hit area are preserved.

**Performance:** A reserved inline grid keeps the control stable; only the incoming label moves. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function SaveLabel({label}) {
  const ref = useRef(null);
  useEffect(() => { SeenryTransitions.swapText(ref.current, label); }, [label]);
  return <span ref={ref} data-st="text" style={{'--st-reserve':'14ch'}} />;
}
```
## Menu dropdown

**When to use:** A surface that remembers where it came from. Purpose: orientation.

```html
<section id="example-menu">
<button class="st-button" data-st-target="menu-menu-example" aria-expanded="false">Project actions <svg class="st-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></button><div id="menu-menu-example" data-st="menu" popover><button class="st-button">Duplicate project</button><button class="st-button">Copy project link</button><button class="st-button" disabled>Archive project</button></div>
</section>
```

**Options:** Use popover and data-st-target="unique-id" on a native button. No custom role="menu" is required: these are ordinary buttons/links in a popover. data-st-close dismisses. Position is clamped to the viewport and origin is measured from the trigger. Open layers follow resize and scroll, with layout work limited to one animation frame.

**Keyboard:** Enter/Space opens. Tab traverses native actions. Up/Down, Home/End move among actions. Escape and outside click close the native popover.

**Performance:** Native popover semantics are retained; a measured painted shell preserves button origin. Position updates on scroll and resize. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Actions() {
  const id = useId();
  return <><button className="st-button" data-st-target={id} aria-expanded="false">Actions</button>
    <div id={id} data-st="menu" popover="auto">
      <button className="st-button" onClick={duplicateProject} data-st-close>Duplicate project</button>
    </div></>;
} // duplicateProject is application-owned.
```
## Modal open and close

**When to use:** A focused task, with a quiet entrance. Purpose: orientation.

```html
<section id="example-modal">
<button class="st-button" data-st-target="modal-modal-example" aria-expanded="false">Open dialog</button><dialog id="modal-modal-example" data-st="modal" aria-labelledby="title-modal-example"><h3 id="title-modal-example">Share this project</h3><p>Anyone with the link can view the latest design review.</p><form method="dialog"><button class="st-button st-primary">Done</button></form></dialog>
</section>
```

**Options:** Use dialog data-st="modal", a unique accessible title, and data-st-target. open(dialog, trigger) / close(dialog) are also available. CSS uses @starting-style and discrete overlay/display transitions; older engines keep native semantics with an instant close.

**Keyboard:** Enter/Space opens. Tab stays in the native modal. Escape or a method="dialog" form closes it. Focus returns to its opener.

**Performance:** Native dialog handles modality. Small scale and opacity; backdrop has no blur. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function ShareDialog() {
  const ref = useRef(null), title = useId();
  return <><button className="st-button" onClick={e => SeenryTransitions.open(ref.current, e.currentTarget)}>Share</button>
    <dialog ref={ref} data-st="modal" aria-labelledby={title}>
      <h2 id={title}>Share project</h2><form method="dialog"><button className="st-button">Done</button></form>
    </dialog></>;
}
```
## Panel reveal

**When to use:** Bring the details into view from the edge. Purpose: orientation.

```html
<section id="example-panel">
<div class="st-full"><button class="st-button" data-st-target="panel-panel-example" aria-expanded="false">Toggle details</button><div id="panel-panel-example" data-st="panel" class="st-surface" data-st-open="false"><div class="st-row"><span>Activity</span><button class="st-button" data-st-close aria-label="Close details">×</button></div><p class="st-muted">Maya added a design review.</p></div></div>
</section>
```

**Options:** Use data-st-open="true|false". open(el, trigger) and close(el) synchronize inertness. A data-st-target button toggles automatically. This inline pattern reserves its space, preventing content from being covered.

**Keyboard:** Enter/Space toggles. Closed content is inert. For a modal side panel, use a dialog instead; this inline panel does not trap focus.

**Performance:** Transform and opacity on a reserved inline panel; closed content is inert. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function DetailsPanel() {
  const id = useId();
  return <><button className="st-button" data-st-target={id} aria-expanded="false">Details</button>
    <aside id={id} data-st="panel" data-st-open="false" className="st-surface">Project activity</aside></>;
}
```
## Page side by side

**When to use:** Forward and back have a visible direction. Purpose: continuity.

```html
<section id="example-page">
<div class="st-full"><div data-st="page"><span class="st-muted">Workspace</span><h3>All projects</h3><p>Website refresh · In review</p></div><div class="st-actions"><button class="st-button">← Back</button><button class="st-button">Open project →</button></div></div>
</section>
```

```js
const root = document.getElementById('example-page');
const view = root.querySelector('[data-st=page]');
root.querySelectorAll('button').forEach((button, i) => {
  button.onclick = () => SeenryTransitions.page(i ? 'forward' : 'back', () => {
    view.querySelector('h3').textContent = i ? 'Website refresh' : 'All projects';
  }, view);
});
```

**Options:** page("forward"|"back", update, optionalElement). The update may be synchronous or return a Promise. Animation starts after it resolves, and newer navigation cancels an obsolete visual handoff. Pass an element to scope the transform and fade to one view. The application owns history, focus and scroll.

**Keyboard:** Use native links/buttons. The application owns browser history, document title, and focus after navigation.

**Performance:** The update commits immediately, followed by one local transform and fade; no browser snapshot animates layout properties. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function ProjectView() {
  const ref = useRef(null); const [detail, setDetail] = useState(false);
  return <><div ref={ref} data-st="page">{detail ? 'Website refresh' : 'All projects'}</div>
    <button className="st-button" onClick={() => SeenryTransitions.page(detail ? 'back' : 'forward',
      () => flushSync(() => setDetail(!detail)), ref.current)}>Navigate</button></>;
} // Import flushSync from react-dom so the snapshot captures the committed view.
```
## Icon swap

**When to use:** Two states share one small footprint. Purpose: state.

```html
<section id="example-icon">
<button class="st-button" aria-pressed="false" aria-label="Bookmark project"><span data-st="icon"><svg class="st-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg><svg class="st-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></span><span>Bookmark</span></button>
</section>
```

```js
const root = document.getElementById('example-icon');
root.querySelector('button').onclick = (event) => {
  const button = event.currentTarget, on = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(on));
  SeenryTransitions.icon(root.querySelector('[data-st=icon]'), on);
};
```

**Options:** icon(el, boolean) toggles data-st-on. Supply exactly two decorative children in one slot. The outer button owns the action label.

**Keyboard:** The owning button uses Enter/Space. Keep its accessible name or pressed state in sync; decorative icons are aria-hidden.

**Performance:** Two 24px layers crossfade and scale; no raster filter. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Bookmark() {
  const [on, setOn] = useState(false);
  return <button className="st-button" aria-pressed={on} onClick={() => setOn(!on)}>
    <span data-st="icon" data-st-on={String(on)} aria-hidden="true"><span>＋</span><span>✓</span></span> Bookmark
  </button>;
}
```
## Success check

**When to use:** A clear finish, drawn in one stroke. Purpose: feedback.

```html
<section id="example-success">
<div data-st="success" data-st-done="true"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="20" cy="20" r="17"/><path d="m12 20 5 5 11-11"/></svg><span>Changes saved</span></div>
</section>
```

```js
const root = document.getElementById('example-success');
// Call only after the operation succeeds.
SeenryTransitions.success(root.querySelector('[data-st=success]'));
```

**Options:** success(el) sets data-st-done="true" permanently. For an explicit replay, set false first and call success in a subsequent frame. Author the check path with a 24-unit dash length, as in the snippet.

**Keyboard:** Display only. Announce successful work from a role="status" container if the application has no existing announcement.

**Performance:** One SVG stroke and a small scale settle. Completion persists after playback. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Success({done}) {
  const ref = useRef(null);
  useEffect(() => { if (done) SeenryTransitions.success(ref.current); }, [done]);
  return <div ref={ref} data-st="success" role="status">
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="20" cy="20" r="17"/><path d="m12 20 5 5 11-11"/>
    </svg><span>{done ? 'Saved' : 'Ready to save'}</span></div>;
}
```
## Avatar group hover

**When to use:** A lift for the person, a little follow-through. Purpose: feedback.

```html
<section id="example-avatars">
<div data-st="avatars" aria-label="Project members"><button class="st-button" aria-label="Maya Chen">MC</button><button class="st-button" aria-label="Leo Park">LP</button><button class="st-button" aria-label="Ari Rivera">AR</button><button class="st-button" aria-label="Sam Lee">SL</button></div>
</section>
```

**Options:** Provide native buttons or links for real member actions. Hover and focus apply 6px lift with 2px neighbour falloff. Use real images with alt="" plus an accessible button name, or initials when a portrait is unavailable.

**Keyboard:** Tab focuses each member and applies the same lift as hover. Enter/Space activates the application’s member action.

**Performance:** Only four transforms, no pointermove loop. Native text initials are intentional fallbacks. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Members({members}) {
  return <div data-st="avatars">{members.map(member =>
    <button key={member.id} className="st-button" aria-label={member.name} onClick={() => openMember(member.id)}>
      {member.initials}</button>)}</div>;
}
```
## Error shake

**When to use:** Brief feedback, followed by a useful message. Purpose: feedback.

```html
<section id="example-error">
<div data-st="error" class="st-full"><label for="email-error-example">Work email</label><input class="st-input" id="email-error-example" type="email" value="maya@" aria-describedby="error-error-example"><div id="error-error-example" class="st-error" hidden>Enter a complete email address.</div><button class="st-button">Continue</button></div>
</section>
```

```js
const root = document.getElementById('example-error');
root.querySelector('button').onclick = () => {
  const input = root.querySelector('input');
  const invalid = !input.validity.valid || !input.value;
  root.querySelector('.st-error').hidden = !invalid;
  if (invalid) SeenryTransitions.shake(root.querySelector('[data-st=error]'));
  else { input.removeAttribute('aria-invalid'); delete root.querySelector('[data-st=error]').dataset.stError; }
};
```

**Options:** shake(el) sets data-st-error and aria-invalid on its input, then shakes only the input by 3px over 180ms. For a composite field, mark its frame with `data-st-field-frame`; labels, messages and actions stay outside that frame. Render the actual validation message separately. Clear both durable states when validation succeeds. It does not decide whether the input is valid.

**Keyboard:** Validation is application-owned. Focus the invalid input when appropriate, associate the error via aria-describedby, and set its aria-invalid state.

**Performance:** Three 4px cycles on one surface, then a static error. No movement under reduced motion. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function EmailField() {
  const ref = useRef(null), id = useId(); const [error, setError] = useState(false);
  return <div ref={ref} data-st="error"><label htmlFor={id}>Email</label>
    <input className="st-input" id={id} type="email" aria-invalid={error} aria-describedby={id+'-error'}/>
    <p id={id+'-error'} hidden={!error}>Enter a complete email address.</p>
    <button className="st-button" onClick={() => { const invalid = !ref.current.querySelector('input').validity.valid;
      setError(invalid); if(invalid) SeenryTransitions.shake(ref.current); }}>Continue</button></div>;
}
```
## Accordion

**When to use:** Make space for the answer, then reveal it. Purpose: continuity.

```html
<section id="example-accordion">
<details data-st="accordion" class="st-surface st-full"><summary>Who can access this project?</summary><div class="st-details-body">Your workspace members can view this project. Invite a guest to share access with someone outside your team.</div></details>
</section>
```

**Options:** Use native details/summary, optional open, and .st-details-body. JS handles pointer and keyboard summary activation through a cancellable shell FLIP. Without JS, native disclosure remains functional.

**Keyboard:** Native summary uses Enter/Space. Focus stays on the summary; open state remains native.

**Performance:** Native details with shell FLIP fallback and content fade; never interpolates text scale. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Disclosure() {
  return <details data-st="accordion" className="st-surface"><summary>Who has access?</summary>
    <div className="st-details-body">Your workspace members.</div></details>;
} // Leave open uncontrolled, or own disclosure state and call resize around a flushSync update.
```
## Banner stacking

**When to use:** Compact at rest. Room to read on focus. Purpose: continuity.

```html
<section id="example-banners">
<div data-st="banners" class="st-full"><div tabindex="0" style="--st-index:0">Your review is ready</div><div tabindex="0" style="--st-index:1">Two new comments</div><div tabindex="0" style="--st-index:2">All changes synced</div></div>
</section>
```

```js
const root = document.getElementById('example-banners');
// Optional touch disclosure button outside the notices:
// button.onclick = () => { stack.dataset.stOpen = stack.dataset.stOpen !== 'true'; };
```

**Options:** Each notice gets --st-index:0,1,2. Use at most three visible notices. Focus and fine-pointer hover expand; set data-st-open="true" for touch/replay. The example reserves enough room for three short notices; increase the block size or use a normal list for wrapped notices.

**Keyboard:** Tab into a notice expands the stack. Keep each notice’s useful action keyboard reachable. For touch, toggle data-st-open with a native button.

**Performance:** Three transform-only layers in reserved space. Focus expands the stack as hover does. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Notices({messages}) {
  const [expanded, setExpanded] = useState(false);
  return <><button className="st-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>Notices</button>
    <div data-st="banners" data-st-open={String(expanded)}>{messages.slice(0,3).map((message,i) =>
      <div key={message.id} tabIndex={0} style={{'--st-index':i}}>{message.text}</div>)}</div></>;
}
```
## Checkbox check

**When to use:** Fill, draw, done. Purpose: state.

```html
<section id="example-checkbox">
<label class="st-check" data-st="checkbox"><input type="checkbox"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m3 10 4 4 10-10"/></svg><span>Include activity</span></label>
</section>
```

**Options:** Native checked, disabled, required and indeterminate behavior remain available. Use the SVG check path from the snippet. Set indeterminate on the DOM input when needed; the mixed state uses a horizontal stroke.

**Keyboard:** Native input uses Space to toggle. Disabled inputs are skipped. The full label is the touch target.

**Performance:** Native checkbox state; a single short stroke animation. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function ActivityCheckbox() {
  return <label className="st-check" data-st="checkbox"><input type="checkbox" defaultChecked/>
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m3 10 4 4 10-10"/></svg><span>Include activity</span></label>;
}
```
## Input clear

**When to use:** The old query leaves with your click. Purpose: feedback.

```html
<section id="example-clear">
<div class="st-full"><label for="search-clear-example">Search projects</label><div data-st="clear"><input id="search-clear-example" class="st-input" type="text" value="Website refresh"><button class="st-button" aria-label="Clear search">×</button></div></div>
</section>
```

**Options:** Wrap one input and one clear button. The library disables clear for an empty value. Dispatch an input event after programmatic value changes to synchronize availability. Do not use on password/secret fields because the decorative copy is plain text.

**Keyboard:** Tab to the clear button and press Enter/Space. It clears immediately, emits a bubbling input event, and returns focus to the input.

**Performance:** One temporary text layer fades out; input value and input event update immediately. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Search() {
  const id = useId();
  return <><label htmlFor={id}>Search</label><div data-st="clear">
    <input className="st-input" id={id} defaultValue="Website" onInput={e => searchProjects(e.currentTarget.value)}/>
    <button className="st-button" aria-label="Clear search">×</button></div></>;
} // Uncontrolled input: the runtime clears it and emits input. For controlled inputs, own clearing in React.
```
## Learn more hover

**When to use:** A gentle nudge toward the next step. Purpose: orientation.

```html
<section id="example-learn">
<a href="#usage" class="st-button" data-st="learn">Learn more <svg class="st-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></a>
</section>
```

**Options:** Use data-st="learn" on a native link with .st-icon. Destination belongs to the host. No JS is needed.

**Keyboard:** Native link: Tab focuses, Enter navigates. Never rely on hover as the sole link cue.

**Performance:** One 4px arrow translation, gated to fine pointer hover and keyboard focus. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function LearnMore() {
  return <a className="st-button" data-st="learn" href="/guide">Learn more
    <svg className="st-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></a>;
}
```
## Like button

**When to use:** A small acknowledgement, a real count. Purpose: feedback.

```html
<section id="example-like">
<button class="st-button" data-st="like" aria-pressed="false" aria-label="Like this project"><svg class="st-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span data-st="number" data-value="24">24</span></button>
</section>
```

```js
const root = document.getElementById('example-like');
root.querySelector('[data-st=like]').addEventListener('st:like-change', ({detail}) => {
  // Persist detail.liked; restore state on failure.
});
```

**Options:** Use aria-pressed="false|true" and one nested number. The library changes the visual count by one and emits st:like-change with {liked,value}. Persist server state in the application; on failure restore aria-pressed and number. Avoid optimistic changes for actions where they would be misleading.

**Keyboard:** Enter/Space toggles aria-pressed and the count. Disabled buttons do nothing.

**Performance:** A local heart scale and per-digit count update. No particles or continuous rendering. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Like({initialCount}) {
  const ref = useRef(null);
  useEffect(() => { const el=ref.current; const persist=e => saveLike(e.detail.liked);
    el.addEventListener('st:like-change',persist); return () => el.removeEventListener('st:like-change',persist); }, []);
  return <button ref={ref} className="st-button" data-st="like" aria-pressed="false" aria-label="Like project">
    <svg className="st-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3 12a5 5 0 0 1 9-6 5 5 0 0 1 9 6Z"/></svg>
    <span data-st="number" data-value={initialCount}/></button>;
} // Runtime owns the count DOM; saveLike belongs to the app.
```
## Plus menu morph

**When to use:** The opener becomes the way back. Purpose: orientation.

```html
<section id="example-plus-menu">
<button class="st-button" data-st-target="plus-plus-menu-example" aria-expanded="false" aria-label="Create new item"><svg class="st-icon st-plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> Create</button><div id="plus-plus-menu-example" data-st="plus-menu" popover><button class="st-button">New project</button><button class="st-button">New document</button></div>
</section>
```

**Options:** Same as menu, with a .st-plus SVG on the opener. aria-expanded drives its 45-degree rotation. The icon is decorative; the button needs a stable accessible label.

**Keyboard:** Same as menu. The plus rotates as aria-expanded changes, including light dismiss and Escape.

**Performance:** One rotated SVG plus native popover transitions; no path morphing cost. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function CreateMenu() {
  const id=useId();
  return <><button className="st-button" data-st-target={id} aria-expanded="false">
    <svg className="st-icon st-plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Create</button>
    <div data-st="plus-menu" id={id} popover="auto"><button className="st-button" data-st-close onClick={createProject}>New project</button></div></>;
}
```
## Shimmer text

**When to use:** One calm sweep while work is underway. Purpose: state.

```html
<section id="example-shimmer">
<span data-st="shimmer" role="status">Preparing your workspace…</span>
</section>
```

**Options:** The first visible appearance runs one 280ms clip sweep; shimmer(el) explicitly replays it. IntersectionObserver pauses offscreen animation. It is not an estimated progress indicator.

**Keyboard:** Noninteractive status; do not put it in the tab order. Use role="status" only when the text announces a meaningful change.

**Performance:** A clipped duplicate text layer sweeps once; pauses offscreen, never loops. Timing: 1.2s. Reduced motion retains the final state without travel.

**React:**

```jsx
function Preparing() {
  return <span data-st="shimmer" role="status">Preparing your workspace…</span>;
} // Keep this text static while mounted. Remount with a new key for a different loading task.
```
## Skeleton reveal

**When to use:** Real content settles into the space it owns. Purpose: continuity.

```html
<section id="example-skeleton">
<div data-st="skeleton" aria-busy="true" class="st-full"><div class="st-real"><h3>Website refresh</h3><p class="st-muted">Updated by Maya · Just now</p><span>Ready for review</span></div><div class="st-skeleton-mask" aria-hidden="true"><i></i><i></i><i></i></div></div>
</section>
```

```js
const root = document.getElementById('example-skeleton');
// After data is available and .st-real has been rendered:
SeenryTransitions.skeleton(root.querySelector('[data-st=skeleton]'), true);
```

**Options:** Use aria-busy="true" initially, .st-real for the actual layout, and .st-skeleton-mask aria-hidden="true" for the placeholder. skeleton(el, true) reveals; false resets. Reserve geometry with final content structure or explicit minimum block size.

**Keyboard:** Busy content is inert. Reveal it after actual data arrives. Expose a separate status if waiting needs an announcement.

**Performance:** Both layers share a grid cell so real content reserves geometry. Only opacity changes. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function ProjectSkeleton({ready, children}) {
  const ref=useRef(null);
  useEffect(() => { SeenryTransitions.skeleton(ref.current, ready); }, [ready]);
  return <div ref={ref} data-st="skeleton" aria-busy={!ready}><div className="st-real">{children}</div>
    <div className="st-skeleton-mask" aria-hidden="true"><i/><i/><i/></div></div>;
}
```
## Tabs sliding

**When to use:** One indicator follows the selected view. Purpose: orientation.

```html
<section id="example-tabs">
<div data-st="tabs" class="st-full"><div role="tablist" aria-label="Project view"><button class="st-button" role="tab" id="tab-a-tabs-example" aria-controls="pane-a-tabs-example" aria-selected="true">Overview</button><button class="st-button" role="tab" id="tab-b-tabs-example" aria-controls="pane-b-tabs-example" aria-selected="false" tabindex="-1">Activity</button></div><div role="tabpanel" id="pane-a-tabs-example" aria-labelledby="tab-a-tabs-example" tabindex="0">Everything you need for the next review.</div><div role="tabpanel" id="pane-b-tabs-example" aria-labelledby="tab-b-tabs-example" tabindex="0" hidden>Maya updated the project a moment ago.</div></div>
</section>
```

**Options:** Provide unique tab and panel IDs, role=tablist/tab/tabpanel, aria-controls and aria-labelledby. Initialize one aria-selected=true. tab(root, tabElement, keyboard=false) selects programmatically. st:tab-change carries {tab}. A ResizeObserver maintains indicator geometry.

**Keyboard:** Left/Right arrows wrap and activate; Home/End select the bounds. Tab enters the selected tab, then its panel. Arrow-key selection has no travel delay.

**Performance:** One shared transform-based indicator; keyboard arrow navigation is instant. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function ProjectTabs() {
  const id=useId();
  return <div data-st="tabs"><div role="tablist" aria-label="Project view">
    <button className="st-button" role="tab" id={id+'-a'} aria-controls={id+'-pa'} aria-selected="true">Overview</button>
    <button className="st-button" role="tab" id={id+'-b'} aria-controls={id+'-pb'} aria-selected="false" tabIndex={-1}>Activity</button>
  </div><div role="tabpanel" id={id+'-pa'} aria-labelledby={id+'-a'} tabIndex={0}>Overview content</div>
  <div role="tabpanel" id={id+'-pb'} aria-labelledby={id+'-b'} tabIndex={0} hidden>Activity content</div></div>;
} // Runtime owns selection. For controlled tabs, own keyboard semantics in React and use a separate indicator.
```
## Toast

**When to use:** A notice arrives, then gets out of the way. Purpose: feedback.

```html
<section id="example-toast">
<div class="st-full"><button class="st-button">Save project</button><div data-st="toasts" aria-label="Notifications"></div></div>
</section>
```

```js
const root = document.getElementById('example-toast');
root.querySelector('button').onclick = (event) => {
  const region = root.querySelector('[data-st=toasts]');
  region._stTrigger = event.currentTarget;
  SeenryTransitions.toast(region, 'Project saved');
};
```

**Options:** toast(region, message) inserts safe text and returns {element,dismiss}. Use a data-st="toasts" region. Set region._stTrigger to the invoking button for focus restoration. Three active notices maximum; a fourth dismisses the oldest. Swipe threshold is 64px or a fast 16px flick. There is no automatic deadline, so messages remain readable.

**Keyboard:** The dismiss button is tabbable. Enter/Space dismisses. Focus returns to region._stTrigger when dismissal removes a focused control. Notices persist until dismissed.

**Performance:** At most three active notices. Pointer capture drives local transforms, with no idle timer. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function SaveNotice() {
  const ref=useRef(null);
  return <><button className="st-button" onClick={e => {ref.current._stTrigger=e.currentTarget;
    SeenryTransitions.toast(ref.current,'Project saved');}}>Show confirmation</button>
    <div ref={ref} data-st="toasts" aria-label="Notifications"/></>;
}
```
## Toggle

**When to use:** An immediate choice, with a little give. Purpose: state.

```html
<section id="example-toggle">
<label class="st-toggle" data-st="toggle"><input type="checkbox" role="switch"><span class="st-toggle-track"><span class="st-toggle-thumb"></span></span><span>Email updates</span></label>
</section>
```

**Options:** Use native checked and disabled properties. Listen to change for application state. No polling and no synthetic animation timer.

**Keyboard:** Native checkbox with role="switch". Space changes checked state. The full label is clickable.

**Performance:** Native switch input; one translated thumb with a small pressed stretch. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function EmailToggle() {
  const [enabled,setEnabled]=useState(false);
  return <label className="st-toggle" data-st="toggle"><input type="checkbox" role="switch" checked={enabled}
    onChange={e => setEnabled(e.currentTarget.checked)}/><span className="st-toggle-track"><span className="st-toggle-thumb"/></span>
    <span>Email updates</span></label>;
}
```
## Tooltip

**When to use:** A deliberate pause, then instant neighbours. Purpose: orientation.

```html
<section id="example-tooltip">
<div class="st-actions"><button class="st-button" data-st-tip="tip-tooltip-example">Hover or focus</button><button class="st-button" data-st-tip="tip2-tooltip-example" aria-label="More information">?</button></div><div data-st="tooltip" id="tip-tooltip-example" popover="manual" role="tooltip">Share with your team</div><div data-st="tooltip" id="tip2-tooltip-example" popover="manual" role="tooltip">Only workspace members</div>
</section>
```

**Options:** A button uses data-st-tip="id"; the matching data-st="tooltip" element uses popover="manual" and role="tooltip". First pointer show waits 400ms; neighbour transfers within 100ms are instant. Focus skips the delay. Hovering the tip keeps it open.

**Keyboard:** Focus shows immediately. Escape dismisses. Tooltip text supplements an accessible control label and contains no interactive controls.

**Performance:** 400ms first pointer delay; a shared warm window skips subsequent delays. Focus is immediate. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function ShareHint() {
  const id=useId();
  return <><button className="st-button" data-st-tip={id}>Share</button>
    <div data-st="tooltip" id={id} popover="manual" role="tooltip">Share with your workspace</div></>;
}
```
## Streaming text

**When to use:** Let each new phrase arrive softly. Purpose: continuity.

```html
<section id="example-stream">
<div data-st="stream" aria-live="polite" aria-busy="false" class="st-full">Your project is ready for review. The layout is consistent, and every change is saved.</div>
</section>
```

```js
const root = document.getElementById('example-stream');
const response = root.querySelector('[data-st=stream]');
SeenryTransitions.stream(response, '', {reset:true});
// Call this for each real chunk from your transport:
SeenryTransitions.stream(response, 'Your project is ready. ');
SeenryTransitions.stream(response, '', {done:true});
```

**Options:** stream(el, chunk, {reset=false, done=false}) appends safe text. reset clears previous output; done clears aria-busy and emits st:stream-end. Set --st-stream-lines to the expected reserved space. Arbitrarily long content grows naturally: no finite reserve can prevent all downstream movement. Do not use animation timers as a substitute for real tokens.

**Keyboard:** Reading content is not focusable. aria-busy batches polite announcements until done. Offer a native stop/retry control in the host application.

**Performance:** Append only the new chunk; finite opacity animation. Reserve expected lines and grow for longer answers. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Response({source}) {
  const ref=useRef(null);
  useEffect(() => {
    const controller=new AbortController(); SeenryTransitions.stream(ref.current,'',{reset:true});
    (async () => { try { for await(const chunk of source(controller.signal)) {
      if(controller.signal.aborted) return; SeenryTransitions.stream(ref.current,chunk);
    } SeenryTransitions.stream(ref.current,'',{done:true}); }
    catch { if(!controller.signal.aborted) SeenryTransitions.stream(ref.current,' Response interrupted.',{done:true}); } })();
    return () => controller.abort();
  },[source]);
  return <div ref={ref} data-st="stream" aria-live="polite" aria-busy="true"/>;
} // source is a stable async-iterable factory, owned by your transport.
```
## Thinking states

**When to use:** A useful account of what is happening. Purpose: state.

```html
<section id="example-thinking">
<div class="st-row"><span data-st="thinking" role="status" style="--st-reserve:12ch">Thinking…</span></div>
</section>
```

```js
const root = document.getElementById('example-thinking');
// Call when your application's actual phase changes:
SeenryTransitions.swapText(root.querySelector('[data-st=thinking]'), 'Searching…');
```

**Options:** swapText(el, "Thinking…"|"Searching…"|"Writing…") when the application actually reaches that phase. --st-reserve:12ch reserves common labels. There is no automatic phase cycling outside the gallery.

**Keyboard:** Use role="status" for meaningful phase updates. No keyboard interaction or timer is built into the runtime.

**Performance:** Single reserved label, no perpetual spinner. The application owns actual task status. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Thinking({phase}) {
  const ref=useRef(null);
  useEffect(() => { SeenryTransitions.swapText(ref.current,phase); },[phase]);
  return <span ref={ref} data-st="thinking" role="status" style={{'--st-reserve':'12ch'}}/>;
}
```
## Texts reveal

**When to use:** A first impression that never hides the content. Purpose: orientation.

```html
<section id="example-reveal">
<div data-st="reveal"><h3>A clear next step.</h3><p class="st-muted">Bring your team’s work into focus.</p><p>Everything is ready when you are.</p></div>
</section>
```

**Options:** Place headings and paragraphs as immediate children. IntersectionObserver reveals once. reveal(el) is an explicit replay. The initial opacity is at least .6, including screenshots and no-JS situations; 20ms offsets are capped at 60ms.

**Keyboard:** Content stays in normal reading and focus order. Revealing does not move focus.

**Performance:** IntersectionObserver fires once. Opacity starts at 0.6; 20ms offsets capped at 60ms. Timing: see the per-transition token table above. Reduced motion retains the final state without travel.

**React:**

```jsx
function Intro() {
  return <div data-st="reveal"><h2>A clear next step.</h2><p>Everything is ready when you are.</p></div>;
}
```

## Verification and limits

At 1440px, the gallery pairs both themes side by side in full-width rows. On phones, use the Light previews / Dark previews switch. The gallery contains every transition in both themes and expandable extra-state examples. Hover, active and focus-visible states are exercised on native controls. Run:

Modern browsers with native dialog/popover and Web Animations are the target. Page updates use local transform/opacity; native layers use cancellable Web Animations. Without JavaScript, native inputs, links and details remain usable, and reveal text stays visible. Imperative behaviors require JavaScript.

### Production verification

## Verify

Run `node ../../../scripts/review_board.mjs gallery.html` and `node ../../../scripts/motion_judge.mjs gallery.html --selector "[data-replay]" --max 40` (Playwright required). Both should report no blockers; the motion judge should score 8 or higher.
