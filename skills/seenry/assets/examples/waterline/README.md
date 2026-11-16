# Waterline: one idea from hero to footer

Copy the path and the principles, never the page.

## 1. The references ([teardown.md](teardown.md))

Three references, counted at full size (written down only with `--studio`):

```
- UI elements: 19 kinds in the product view: side navigation, search with a ⌘F hint, breadcrumb, …
- Visualisation types: 5 kinds: a half gauge, candle sticks, a tick scale, a step chart, mirrored sticks
- Image and UI interlock: painted grass sits in front of the app, covering 45% of the product view
```

## 2. The composition ([compose.md](compose.md))

One principle and number per reference, around the product's idea (cash under the waterline, so the forecast sinks into the wave):

| From | Principle | Here |
| --- | --- | --- |
| reference-a | The image in front of the lower 45% of the app | The sea is drawn behind and in front of the app |
| reference-b | 4 metric cards, each with a different mini visual | A sparkline, a tick scale, week blocks, a stacked bar |
| reference-c | A flat sky, a 2-line light headline at 62px | Cobalt sky, 68px, weight 300 |

## 3. The page ([screen.html](screen.html), [tokens.css](tokens.css), [screenshot](waterline-example.jpg))

Every section has one moment of its own:

| Section | Its one principle |
| --- | --- |
| Hero | The app sinks into the image: 20 kinds of UI, 4 kinds of visualisation, one hue |
| Moves (3 tiles) | The image at the bottom of each tile in a different crop, a different mini UI in each |
| Figures | 4 numbers, the unit in the hue |
| Sources | 5 input cards flow into 1 coloured output card that holds the image |
| Proof | A quote on the deep field with 1 measured before and after |
| Pricing | 1 table, 1 highlighted column, no cards |
| Closing | The hero image returns whole; the footer sits inside it |

One grid: every block runs from 128 to 1312 at 1440; only the images bleed. One movement carries the idea, the app rising out of the water ([MOTION.md](MOTION.md)); the headline and body text are in place at first paint.

## Your page takes the principles, not the arrangement

| Principle | Choose your own form |
| --- | --- |
| Image and interface meet in depth | The image in front (here), the interface translucent at its top and melting into the page, cards fanned with connectors, or the subject cut out in front of the headline. Pick what your image allows |
| The product is a whole app | Your product's own views and data, never this sidebar and these four cards |
| The image returns below | As a ground (behind the section, bled or masked) in a new crop each time, in your own order. A texture (sea, grass, sky) can return in several tiles; a photographed object cannot, so give those tiles their own images or product moments |

## The layered image

One image drawn twice, the top copy masked along a real edge:

```css
.hero { position: relative; overflow: hidden; }
.sea { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center bottom; }
.app { position: relative; z-index: 2; }
.sea.front { z-index: 3; mask: url("data:image/svg+xml,…a path along the wave's top edge, blurred 7px…") center / 100% 100% no-repeat; }
```

Both copies share size and position, so no seam shows. Keep every number above the mask. `sea.jpg` came from [image-job.json](image-job.json). The screen passes the board with 0 blockers.
