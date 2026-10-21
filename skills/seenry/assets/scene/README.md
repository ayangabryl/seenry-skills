# Seenry scene

Scroll choreography for landing pages without a library: `scene.css` + `scene.js` (about 3 KB). A scene is a tall
section whose sticky stage holds while `--p` runs from 0 to 1; you write the choreography in CSS with `calc()`.
The resting CSS is the final state, so no-JS, reduced motion and the review's full-page still show the finished
composition at natural height. Restyle everything; these are mechanics, not a look.

```html
<link rel="stylesheet" href="scene.css"><script src="scene.js" defer></script>

<section data-scene style="--scene-length: 240vh" data-beats=".33,.66">
  <div data-scene-stage> … </div>
</section>
```

Variables inside a scene: `--p` (0..1 over the scene), `--a` (first 40%), `--b` (30–70%), `--c` (last 40%).
`data-beat` holds how many `data-beats` points have passed, for discrete swaps (`[data-beat="2"] .cap-3 {opacity:1}`).

## Recipes (pick the one that proves this brand's idea; build at most three per page)

**Whole to detail.** The stage holds one photograph; it moves from the building to the window, the plate to its edge.
`.stage img { scale: calc(1 + var(--a) * 1.4); transform-origin: 72% 38%; }` with captions swapping on beats.

**Layers separate.** A product, a document or a drawing comes apart into its layers and the annotation for each one
arrives once there is room: `.layer { translate: 0 calc(var(--b) * var(--dy)); }` with `--dy` per layer, labels at
`opacity: var(--c)`.

**A drawing builds and something travels through it.** `<svg data-draw>` strokes draw with `--p` (or set
`--draw: var(--a)` on it); a band of light, a route or a data point then moves along: `left: calc(var(--b) * 100%)`.

**A row travels sideways.** `<div data-track>` inside a stage scrolls horizontally with the scene (projects, the
day's timetable, a collection). Set `--scene-length` to about the row's width so the speed feels like scrolling.

**A number resolves.** `<span data-count="1892">` counts with the scene, or once on entering outside a scene.

## Entrance and reveals

`data-enter` reveals once when visible (rise and fade), `data-enter="unmask"` opens an image from the bottom with a
slight settle, `data-enter="line"` lifts a line inside a `.scene-line` mask. Stagger siblings with `style="--i: 1"`.
For the first screen: image `unmask` at `--i:0`, headline lines at `--i:1..3`, the rest at `--i:4`; the headline is
readable by 0.8s.

Keep text out of moving pixels, keep body copy at full opacity, and keep each scene to one idea.
