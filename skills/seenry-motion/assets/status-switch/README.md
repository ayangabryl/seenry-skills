# Status switch

An original Seenry text transition for a **short, real product status**. Copy `status-switch.mjs` and `status-switch.css`. The application decides when a request actually starts, succeeds or fails; this asset only presents the current text. Keep long messages in normal document flow.

```html
<link rel="stylesheet" href="./status-switch.css">
<span id="request-status">Ready</span>
<script type="module">
  import { createStatusSwitch } from './status-switch.mjs';
  const status = createStatusSwitch(document.querySelector('#request-status'), {
    reserve: ['Ready', 'Saving…', 'Saved', 'Could not save'],
  });
  // Call these from actual operation state, never a decorative timer.
  status.update('Saving…');
  // On completion: status.update('Saved') or status.update('Could not save')
  // On unmount: status.destroy()
</script>
```

`reserve` gives known labels one stable width. An unlisted label is added to the measurement layer and may widen the host. The current text changes immediately in a polite live region; visual copies are hidden from assistive technology. Repeated updates retarget the transition and keep at most one outgoing copy. A live reduced-motion preference settles the current text. Use a nearby stable control for focus; this component does not own the operation or its focus recovery. [Demo](demo.html) and [browser checks](../../../../tests/status-switch.browser.mjs) are included.
