# Voice presence

An original Seenry voice aperture: paired folds open with a real audio level, with fine ribs that remain legible in a **48 × 48 px** leading control. No equalizer, autonomous breathing loop, canvas, external assets or dependencies. Original code and geometry authored with GPT-6 Astra for Seenry; covered by the repository's MIT license.

Copy `voice-presence.mjs` and `voice-presence.css`. The application owns audio, state, buttons, errors and announcements. This renderer neither requests microphone permission nor records, plays or recognizes speech. Use it for input monitoring or output playback only when your application actually owns that operation.

```html
<link rel="stylesheet" href="./voice-presence.css">
<div style="display:flex;align-items:center;gap:12px;background:#19221f;color:#f6f0e6;padding:12px">
  <span id="voice-mark" aria-hidden="true" style="display:block;width:48px;height:48px;flex:none"></span>
  <p id="voice-status" role="status">Voice idle</p>
  <button id="stop-voice" type="button" disabled>Stop voice</button>
</div>
```

```js
import { createVoicePresence } from './voice-presence.mjs';
const mark = createVoicePresence(document.querySelector('#voice-mark'));
const status = document.querySelector('#voice-status');
const stop = document.querySelector('#stop-voice');
const labels = { idle: 'Voice idle', listening: 'Listening', speaking: 'Speaking', error: 'Voice unavailable' };

// Call from YOUR audio session's state subscription, after real confirmation.
function onSessionState(state) {
  mark.update({ state, level: 0 });
  status.textContent = labels[state]; // Announce state changes, never every sample.
  stop.disabled = state !== 'listening' && state !== 'speaking';
}
function onAudioLevel(normalizedLevel) {
  mark.update({ level: normalizedLevel }); // Already normalized by your audio pipeline.
}
// Bind the native button to your session's actual stop action.
// On unmount: unsubscribe these callbacks, stop your owned audio resources,
// remove your button listener, and call mark.destroy().
```

`createVoicePresence(element, options?)` returns:

| API | Behavior |
| --- | --- |
| `update({ state?, level?, static? })` | Partial update. State is `idle` (default), `listening`, `speaking` or `error`. Unknown states throw before mutation. |
| `level` option | Number 0–1 (default 0); finite numbers clamp, nonnumbers/NaN/infinity become zero. Idle and error discard level. On return to activity, supply a fresh sample. |
| `static` option | Default false. True or live OS reduced motion fixes active geometry; supplied level changes fill brightness immediately. |
| `state`, `isAnimating` | Read-only current state and whether a settling frame is scheduled. No audio inference. |
| `destroy()` | Idempotent: cancels frames, disconnects the intersection observer, removes media/visibility listeners and only its own SVG. Later updates are ignored. |

The response uses a short attack and softer release, retargets from the displayed level, and stops scheduling frames once settled. Idle/error settle immediately. Hidden documents and offscreen hosts snap to the latest supplied value without frame work; re-entry does not replay a backlog. `viewBox` handles resizing without a size observer. If IntersectionObserver is unavailable, visibility and reduced-motion handling still work. Mount one controller per host and destroy it before replacing it.

Use a 40–56 px host and stable native hit targets. CSS variables `--vp-ink`, `--vp-highlight`, `--vp-idle`, `--vp-speaking`, `--vp-speaking-highlight`, and `--vp-error` let the application tune ink for its surface; bundled defaults suit a dark background. SVG is decorative and noninteractive. Status text distinguishes states without relying on color. Without JavaScript/SVG, the DOM status and application controls remain the fallback; this demo starts with disabled controls and an honest idle message. There is no optional microphone adapter to clean up in this asset; a consuming audio session must release its own tracks and AudioContext.

[Open the demo](demo.html) over HTTP (for example `python3 -m http.server 8000` from the repository root). Start/stop a clearly labeled generated envelope, select a simulated application state, or supply a level manually. None of these controls enables a microphone. “Keep the folds still” previews the static presentation. At narrow widths the action moves below the unchanged 48 px mark and status.

Browser verification, from the repository root:

```sh
node tests/voice-presence.browser.mjs --playwright /absolute/path/to/playwright/index.mjs --output /private/tmp/seenry-voice-presence-captures
```

Set `SEENRY_CHROME_PATH` if the package has no bundled browser. The test exercises raster changes, zero/idle, live reduced motion, keyboard controls, 320 px layout, invalid input, simulated errors, offscreen behavior, no-JavaScript fallback and teardown. Screenshots are local evidence, not shipped reference assets or claims of equivalence to another product.
