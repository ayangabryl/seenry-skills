# Motion performance

Making each frame finish in time. Not whether the motion looks right (the build sequence) or should exist (the gate), only whether it lands every frame.

## Contents

- Rules
- Symptoms
- The frame budget
- What you animate
- Where it runs
- React
- Two traps that look correct
- will-change
- Diagnose in this order
- Report

## Rules

1. `transform` and `opacity` by default; anything else needs a reason. Use the cheaper property whenever it looks the same.
2. Name the cause before changing code. "Added `will-change`, seems smoother" is not a diagnosis.
3. A fast laptop proves nothing. The bar is a mid-range phone; say what you verified from code and what needs a recording on a device.
4. Never `transition: all`.
5. Spend effort on which properties you animate, which you control, not on hardware acceleration, which the browser may refuse.

## Symptoms

| Seen | Fix |
| --- | --- |
| Stutters | Animate `transform` and `opacity`, not `width`, `height`, `top` or `margin` |
| Choppy shadow | `filter: drop-shadow()` instead of animating `box-shadow` |
| Jank only during navigation or loading | Move it to CSS or WAAPI, off the main thread |
| Motion `x`/`y` drops frames | `motion` 14.2+, or the full `transform` string |
| A hand-rolled animation drops frames in React | Write `ref.current.style`, not state |
| Drag gets slower as the list grows | Stop animating an inherited custom property; set `transform` on the element |
| Blur lags, especially in Safari | Keep animated `blur()` under 20px |
| Unexpected properties animate | Name the properties instead of `all` |
| A 1px shift at the start or end | `will-change: transform`, only once seen |

## The frame budget

16.7ms per frame at 60Hz; 8ms at 120Hz, which most phones and many laptops now run. Design for 8ms. One layout pass on a complex page can take over 100ms: a dozen dropped frames.

## What you animate

| Tier | Properties | Cost |
| --- | --- | --- |
| Composite only | `transform`, `opacity`; in current Chrome and Firefox also `filter`, `clip-path`, `background-color` | Cheapest; promoted to their own layer |
| Paint and composite | `box-shadow`, `border-radius`, `color` | A redraw every frame |
| Layout, paint, composite | `width`, `height`, `padding`, `margin`, `top`, `left`, `border-width` | Most expensive; one growing element moves its neighbors |

| Instead of | Animate |
| --- | --- |
| `width`, `height`, `padding` to grow | `scale` |
| `top`, `left`, `margin` to move | `translate` (percentages are the element's own size) |
| `display`, `visibility` | `opacity` |
| `box-shadow` | `filter: drop-shadow(...)` |

An absolutely positioned element with few children may animate `padding` without visible cost, but `scale` looks the same and cannot regress on a slower device. Layout properties also move the wrong things: animating a sidebar's `margin-left` re-lays the whole dashboard every frame; `translate` does not.

## Where it runs

| Driver | Thread |
| --- | --- |
| JS with `requestAnimationFrame` (GSAP, Motion layout animations) | Main thread, always |
| Web Animations API (`element.animate()`, Motion's `animate()` and `motion/react` components) | Can run off the main thread |
| CSS transitions and keyframes | Can run off the main thread |

Reliably accelerated: `transform` and `opacity`; gaining support: `filter`, `clip-path`, `background-color`. Watch motion that plays while the page is busy: page transitions, a tab indicator during navigation, anything during fetching or hydration. A shared-layout tab indicator that animates while the next page loads drops frames.

Motion hands `opacity`, `transform`, `clip-path` and `filter` to WAAPI. Its `x`, `y`, `scale` and `rotate` shorthands are accelerated on HTML elements from `motion` 14.2; before that use `animate={{ transform: "translateX(100px)" }}`. In every version these stay on the main thread: `layout`, `layoutId`, `onUpdate`, `transformTemplate`, inertia, and values driven every frame by `useTransform` or springs from JS.

Acceleration is progressive enhancement: browsers decline it silently (Chrome long skipped percentage transforms). That is no reason to drop `translateY(100%)`, which is right for elements of unknown size.

Working split: CSS for simple motion and anything that plays while the page is busy; Motion for springs, shared layout, exit animations and momentum gestures. JS animation is not banned; it only suffers when the page is busy during it.

## React

Animation libraries run outside React's render cycle. The trap is a hand-rolled animation calling `setState` every frame. Write the style directly:

```js
ref.current.style.transform = `translateY(${nextY}px)`;
```

Look for state updates in `requestAnimationFrame`, `pointermove`, `scroll` and drag handlers.

## Two traps that look correct

- **Inherited custom properties.** A drag written to `--swipe-amount` on a parent and read by `translateY()` recalculates style for every descendant; a drawer got slower past about 20 items. Write `transform` on the element itself. Suspect this whenever a transform animation slows as content grows.
- **Blur.** `filter: blur()` gets expensive fast, worst in Safari. Under 20px; 2–5px is enough to soften a crossfade.

## will-change

The browser may hand an animation to the GPU mid-flight, which can shift it a pixel at the start or end. `will-change: transform` promotes it up front. Add it only once you see the shift or measure dropped frames, only on the element that animates (never `*` or large containers): browsers already promote elements animating `transform` and `opacity`, and every layer costs GPU memory. It earns its place on an expensive paint, like a large blurred element; keep that layer small.

## Diagnose in this order

1. Which properties animate? Layout properties first, then `box-shadow` and `border-radius`. Expand `transition: all` and Motion shorthands into what they really animate.
2. Does the jank coincide with a busy page (navigation, fetching, hydration, a long task)? Move it to CSS or WAAPI.
3. Is React rendering every frame?
4. Does it worsen as content grows? An inherited custom property, or too many nodes moving.
5. A custom property animated at all, or Motion shorthands before 14.2?
6. Animated `blur()` over 20px?
7. Still shifting? Now `will-change: transform` on the animating element.

Confirm with a recording, not by feel: DevTools Performance for dropped frames and long tasks, the Animations panel at 10% speed. Profile on a real mid-range phone over remote debugging; desktop CPU throttling models a slow CPU, not a weak GPU or small memory.

## Report

List what animates first:

| Element | Driver | Properties | Plays during |
| --- | --- | --- | --- |

Then each finding, costliest first (layout before paint, busy thread before idle):

```
Tab indicator: nav/Tabs.tsx:42
Cause: shared-layout animation during route change (main thread)
Before: <motion.span layoutId="tab" />
After: CSS transition on translate and scale of one indicator
Verified: from code / needs a device recording
```

Stop there; apply fixes when asked.
