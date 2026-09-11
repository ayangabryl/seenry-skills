# Optional adapters

Copy only the helper used and its relative dependencies. Keep project runtime versions explicit. These are presentation helpers, not design templates or a required stack.

- `assets/icon-swap.mjs`: inspect its exported API before wiring a state-driven icon swap. This is not path morphing.
- `assets/morph-icon.mjs`: `createMorphIcon({slot, initial, size:18})` takes an empty slot and real Lucide IconNode data; `to(icon)` retargets, `set(icon)` settles, `destroy()` cleans up. Copy the `assets/morphicons/` directory alongside it. The pinned Morphicons 1.7.1 runtime is unmodified and MIT-licensed; retain its LICENSE and manifest. Keep the button's name and real state in the application. The adapter sets reducedMotion to user explicitly.
- `assets/number-transition.mjs`: read [number transitions](number-transitions.md) for actual NumberFlow digits, anchored units, accessible current values, supported formats and static fallbacks. Copy the adjacent `number-flow/` runtime and both licenses.
- `assets/lottie-toggle.mjs`: read its API and tests before adoption. Inject the actual player and inspect the chosen frame ranges; a different asset may have different bounds.
- `assets/scroll-scene.mjs`: read [scroll choreography](scroll-choreography.md). Inject GSAP and ScrollTrigger from the project. The helper owns only its scene; cleanup must not affect other scenes.

Inspect these small sources before use. Verify input interruption, failure and live reduced motion in the actual product. Bundled adapters do not establish the quality of a new animation. Review current engine documentation when changing versions; do not assume every runtime can morph arbitrary paths.

For a filled icon family, `createMorphIcon` also accepts `paint: "fill"` and its real `viewBox`, for example `"0 0 256 256"` for Phosphor. Supply actual library node data for both states in the same coordinate system and weight. Do not squeeze a 256-unit path into the default 24-unit viewport or draw approximations of library glyphs. The default remains stroked 24-unit Lucide data. The helper does not fetch or license an icon collection for the project. Test the initial state, intermediate morph and final glyph at the intended size; use a swap if the path transition is unreadable.

## Measured disclosure geometry

`assets/geometry-transition.mjs` exports `createDisclosure(panel, options)`. Supply a panel with one natural-height content wrapper; keep wrapper padding inside it. The controller measures the current visual height before cancellation, animates geometry without scaling live text, makes collapsed descendants inert and respects reduced motion. Use `controller.setOpen(next)` from the owning component. Keep the trigger's `aria-expanded` in that component, with `aria-controls` referencing the panel. Before collapsing from inside, move focus to the trigger. Call `destroy()` on unmount. This adapter owns presentation, not your product's selected state or input data.
