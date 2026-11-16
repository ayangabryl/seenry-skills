# Scroll scenes and expressive effects

**Read when:** the work is a marketing page scene, a product's one signature moment, or an AI-interface state (thinking, voice, image generation) that needs more than a recipe.

## Contents

- [When this applies](#when-this-applies)
- [Write the contract first](#write-the-contract-first)
- [The scene score](#the-scene-score)
- [Scroll rules](#scroll-rules)
- [Bundled effects](#bundled-effects)
- [Honesty rules](#honesty-rules)
- [Check the scene or effect](#check-the-scene-or-effect)

## When this applies

| Applies | Does not apply |
| --- | --- |
| A marketing or portfolio page whose story unfolds on scroll | Menus, dialogs, tabs, toasts, lists and forms people use daily: use the recipes |
| The one signature moment named in `MOTION.md` | A second or third "signature" on the same page |
| A real process, voice session or image result in an AI interface | A decorative loop with no operation behind it |
| A product object whose material is part of its identity | Every button, card or row in a list |

Build the plain, usable state first, then add the effect as a layer over it.

## Write the contract first

One line per scene or effect, before code: the trigger and who owns the state; what stays still and what changes; how input is acknowledged without waiting for decoration; what a repeat, reversal or newer result shows; who starts, pauses and destroys it; and the reduced-motion state that carries the same information.

## The scene score

A scroll scene is one table on a normalized 0 to 1 progress, so the relationships survive a change in scroll distance. Give each beat one leader. Include the holds; a reading hold is an interval in the score, never a timeout or a scroll lock.

| Progress | Leader | Support | Stays still | Reader learns |
| --- | --- | --- | --- | --- |
| 0–0.18 | Close crop holds | Name and service readable | Title, navigation | What is being examined |
| 0.18–0.55 | Sheet edges reveal | Caption stays anchored | Text | Scale and application |
| 0.55–0.72 | Hold | One factual caption | Everything | What the project is |
| 0.72–1 | Next section rises | Pin releases without a jump | Document flow | There is more of the same family |

Do not invent five beats for a one-step idea. If ordinary scrolling already conveys it, do not pin.

`../assets/score.mjs` turns the table into numbers with no engine. Each track is a list of `[progress, value]` pairs that starts at 0, ends at 1 and strictly increases; two equal values in a row are a hold. Input is clamped to 0–1, and the same progress returns the same values whether it was reached forward or backward.

```js
import { createScore } from './score.mjs';

const score = createScore({
  scale: [[0, 1.55], [0.18, 1.55], [0.55, 1], [1, 1]],   // hold, reveal, hold
  next:  [[0, 0], [0.72, 0], [1, 1]],
});
const scene = document.querySelector('.scene');
const still = matchMedia('(prefers-reduced-motion: reduce), (max-width: 600px)');
let frame = 0;
function render() {
  frame = 0;
  const travel = Math.max(1, scene.offsetHeight - innerHeight);
  const p = still.matches ? 1 : Math.max(0, Math.min(1, -scene.getBoundingClientRect().top / travel));
  for (const [name, value] of Object.entries(score(p))) scene.style.setProperty('--' + name, value);
}
const update = () => { if (!frame) frame = requestAnimationFrame(render); };
addEventListener('scroll', update, { passive: true });
addEventListener('resize', update);
still.addEventListener('change', update);
render();
```

`../assets/score-demo.html` runs this relationship end to end. With CSS alone, the same score is a keyframe animation on `animation-timeline: view()` or `scroll()` with `animation-timing-function: linear`.

Time-based page scenes (an entrance that plays once, not scrubbed) use 600ms for a reveal, 900ms for an image unmask or headline lines, and 1200ms for the first-screen entrance, all on `--ease-out`.

## Scroll rules

1. **One playhead.** Every track reads the same progress value. Never start wall-clock animations from a scroll callback.
2. **One owner per property.** A track targets one property on one wrapper. Two systems writing `transform` on the same element fight.
3. **Any progress renders alone.** The state at 0.4 must not depend on callbacks that ran at 0.2. No fetches, no business state changes while scrubbing.
4. **Linear overall, eased locally.** The scroll-to-progress mapping is `linear`. Shape a local movement inside its interval, not the whole scene.
5. **Native scrolling.** No smooth-scroll library, no scroll hijack. Snapping is optional and must not fight touch, keyboard or anchor links.
6. **Pin a stable wrapper, animate its descendants.** Measure travel from real geometry and re-measure after fonts, images and resize.
7. **Readable without enhancement.** The normal CSS is a plain document; scene styles sit under an attribute the script sets. Text never transforms with artwork.

## Bundled effects

Bundled effects are the fallback for a page with no build step. With a framework, pick the maintained package through `seenry-libraries` ([catalog](../../seenry-libraries/references/catalog.md)) and run its check script first. All seven packages below were verified on npm as MIT with a React 18+ peer.

| Effect | Shows | Use only when | With a build step | No build step: copy | Reduced motion |
| --- | --- | --- | --- | --- | --- |
| Boundary light | One surface is working right now | A real operation is running on that surface; one trace per view | `border-beam` | [boundary-trace](../assets/boundary-trace/README.md): `createBoundaryTrace(host, {color, cycle})`, `setActive(bool)` | Steady outline |
| Process presence | A process is idle, working, done or failed | The app has those states and shows them in DOM text too | `thinking-orbs` | [signal-field](../assets/signal-field/README.md): `createSignalField(canvas)`, `update('idle' \| 'working' \| 'success' \| 'error')` | Drawing stops; state stays in text |
| Voice activity | Live input or output level | The app owns a real audio session and passes a normalized level | `voice-glow` | [voice-presence](../assets/voice-presence/README.md): `createVoicePresence(el)`, `update({state, level})` | Geometry fixed; ink varies |
| Reflective material | An object whose material is its identity | One important control or mark, never a list | `metal-fx` | [reflective-surface](../assets/reflective-surface/README.md): `createReflectiveSurface(host, {palette, appearance})`, `setActive(bool)` | Still frame; CSS fallback without WebGL2 |
| Image reveal | A new image has decoded | The resource exists; the previous image stays until then | `img-fx` (needs `three`) | [image-reveal](../assets/image-reveal/README.md): `createImageReveal(img)`, `await show(url, alt)` | Commits the image at once |
| Liquid continuity | Nearby actions belong to one control | The parts share one fill colour; React project | `liquid-gooey` | [fluid](../assets/fluid/README.md): `FluidSurface`, `FluidItem` (React, no extra package) | Ordinary DOM, no filter |
| Pointer tilt | A product object has a physical face | Fine pointer, decorative plane, real controls on the flat host | none in the catalog | [pointer-tilt](../assets/pointer-tilt/README.md): `createPointerTilt(host, {plane, glare, maxDegrees})` | Off; also off for coarse pointers |
| Milestone burst | A rare, confirmed completion | Success is already recorded and shown in text | none in the catalog | [confirmation-burst](../assets/confirmation-burst/README.md): `createConfirmationBurst(target, {colors, count})`, `play()` | Suppressed |
| Status text | A short status changed | The label comes from real operation state | none needed | [status-switch](../assets/status-switch/README.md): `createStatusSwitch(el, {reserve})`, `update(text)` | Text settles at once |

Animated bot avatars have no bundled equivalent: use `bot-avatars` in a React project, or a static mark elsewhere.

Every controller returns `destroy()`; call it on unmount. The table lists the entry point, so read the README for the full API. With an npm package, compare two rendered frames under reduced motion, because some presets leave that handling to the app.

For a liquid merge, the trigger and the revealed surface share **one fill**; different-coloured surfaces need separate layers and an opacity handoff. Keep text and hit targets outside the filtered layer, and make collapsed actions inert, not just transparent.

## Honesty rules

1. **State lives in the app.** The effect presents state it is given. It never decides success, owns a timer that implies completion, or changes data.
2. **No claimed progress.** A travelling rim, orb or shimmer is not a percentage. Animation time is never shown as work done.
3. **Success after the record.** Play a confirmation only after the application has recorded it, and keep the settled result visible when the decoration clears. A failure replaces pending feedback at once.
4. **One infinite loop at most, and it stops when the work stops.** It also stops when cancelled, offscreen, the tab is hidden, or reduced motion is on.
5. **Real resources only.** Reveal an image that has decoded. Keep the previous useful content while the next loads; error and timeout are their own states with a retry.
6. **Decoration is invisible to assistive technology.** Status is DOM text; canvases and SVG layers are `aria-hidden` and ignore pointer input.
7. **A missing engine leaves a working interface.** No WebGL or a failed asset falls back to the plain state.

## Check the scene or effect

- Reach the same progress forward and backward, including a fast reversal: the picture is identical.
- Scroll with real input to each hold and the release, reload mid-scene, follow an anchor past the pin, resize.
- Toggle reduced motion while it is active; mount, destroy and remount.
- Compare the page with and without the effect at the intended size. If it only prolongs reading, remove it.
