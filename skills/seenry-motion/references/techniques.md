# Techniques

Small, specific techniques that make components feel finished. Each is a starting point; values follow the build sequence in `SKILL.md`.

## Contents

- Perceived speed
- Instant tooltips after the first
- Scale takes its children with it
- 3D depth in CSS
- Clip-path techniques
- Drag hygiene
- Springs on decorative pointer effects
- Web Animations for programmatic motion

## Perceived speed

How fast an interface feels is partly animation. A fast-spinning spinner makes the same wait feel shorter; a 180ms select feels more responsive than a 400ms one; `--ease-out` at 200ms feels faster than `ease-in` at 200ms because movement starts at once; and tooltips that open instantly after the first make a whole toolbar feel quicker.

## Instant tooltips after the first

The first tooltip waits a moment so a passing pointer does not trigger it. Once one is open, its neighbors open with no delay and no animation.

```css
.tooltip {
  transition: transform 125ms var(--ease-out), opacity 125ms var(--ease-out);
  transform-origin: var(--transform-origin);
}
.tooltip[data-starting-style],
.tooltip[data-ending-style] { opacity: 0; transform: scale(0.97); }
.tooltip[data-instant] { transition-duration: 0ms; }
```

Base UI and Radix expose the instant state (`data-instant`, a shared delay group); with your own tooltip, keep a short "recently open" window (about 300ms) during which the next one skips its delay and transition.

## Scale takes its children with it

Unlike `width` and `height`, `scale` also scales text and icons inside. On a pressed button that is the point: the whole control reads as one physical thing.

## 3D depth in CSS

`rotateX()` and `rotateY()` with `transform-style: preserve-3d` on the parent and `perspective` give real depth (card flips, coins, orbits) with no JavaScript:

```css
.stage { transform-style: preserve-3d; perspective: 800px; }
@keyframes orbit {
  from { transform: translate(-50%, -50%) rotateY(0deg) translateZ(72px) rotateY(360deg); }
  to   { transform: translate(-50%, -50%) rotateY(360deg) translateZ(72px) rotateY(0deg); }
}
```

## Clip-path techniques

`clip-path: inset(top right bottom left)` reveals part of an element, runs on the compositor in current browsers, and needs no extra wrappers.

- **Tabs with exact color changes.** Duplicate the tab list, style the copy as active (its background and text color), stack it over the original, and clip the copy to the active tab's box. On change, animate the clip to the new tab. The color change lands exactly with the indicator, which separate color transitions never do.
- **Image reveal on scroll.** Start at `inset(0 0 100% 0)` and animate to `inset(0 0 0 0)` once it enters the viewport (`IntersectionObserver`, or Motion's `useInView` with `{ once: true, margin: "-100px" }`). Marketing pages only, and once.
- **Before and after slider.** Overlay two images and clip the top one with `inset(0 50% 0 0)`; drag changes the right inset. No extra DOM.
- **Hold to confirm.** An overlay at `inset(0 100% 0 0)` fills `linear` while held and snaps back with `--ease-out` on release.

## Drag hygiene

- **Capture the pointer** on `pointerdown` (`setPointerCapture`) so the drag continues outside the element.
- **Ignore extra fingers.** Once a drag starts, ignore new presses until it ends; switching fingers mid-drag otherwise makes the element jump.

```js
function onPointerDown(e) {
  if (isDragging) return;
  isDragging = true;
  el.setPointerCapture(e.pointerId);
}
```

## Springs on decorative pointer effects

An effect tied directly to the pointer (a card tilting toward the cursor) feels artificial because it has no motion of its own. Feed the value through a spring:

```jsx
const rotation = useSpring(mouseX * 0.1, { stiffness: 100, damping: 10 });
```

Only where the effect is decoration, on a marketing surface. On a functional view people read, no effect at all is better.

## Web Animations for programmatic motion

`element.animate()` gives JavaScript control with CSS performance: off the main thread for compositor properties, cancellable, no library.

```js
el.animate(
  [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
);
```

Release finished animations (commit the end style, then `cancel()`), so `fill: 'forwards'` does not override later state changes.
