# Signal field

An original, dependency-free canvas treatment for a **real process state**. Copy `signal-field.mjs` into a web project. It is a decorative layer: keep the operation's text, progress and errors in ordinary DOM content. A status change only occurs when application state changes.

```html
<canvas id="process-field" width="160" height="160" aria-hidden="true"></canvas>
<p id="process-status" role="status">Ready</p>
<script type="module">
  import { createSignalField } from './signal-field.mjs';
  const field = createSignalField(document.querySelector('#process-field'));

  async function saveDraft() {
    field.update('working');
    document.querySelector('#process-status').textContent = 'Saving draft…';
    try {
      await persistDraft(); // Your application owns this operation.
      field.update('success');
      document.querySelector('#process-status').textContent = 'Draft saved';
    } catch {
      field.update('error');
      document.querySelector('#process-status').textContent = 'Could not save draft';
    }
  }
  // Call field.destroy() when the host is removed.
</script>
```

Size the canvas with CSS (for example `width: 10rem; aspect-ratio: 1`); pass `{color:'#276b55'}` or set its `color` property before creation. `update('idle' | 'working' | 'success' | 'error', {color})` changes the decorative state immediately. The controller observes resize, viewport intersection, page visibility and live reduced-motion preference. It stops drawing when offscreen or motion is reduced and resumes only for `working`. It does not infer progress, decide success or emit a status announcement. Keep one field per active process, and avoid using it as an unbounded page decoration.

The [demo](demo.html) exposes every state without fabricating an operation. The [browser check](../../../../tests/signal-field.browser.mjs) verifies lifecycle and motion behavior. Inspect the result at its actual host size; the example is a mechanism, not a fixed visual identity or proof of quality in another project.
