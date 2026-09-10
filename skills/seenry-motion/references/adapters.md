# Optional adapters

Copy only the helper used and its relative dependencies. Keep project runtime versions explicit. These are presentation helpers, not design templates or a required stack.

- `assets/icon-swap.mjs`: inspect its exported API before wiring a state-driven icon swap. This is not path morphing.
- `assets/morph-icon.mjs`: `createMorphIcon({slot, initial, size:18})` takes an empty slot and real Lucide IconNode data; `to(icon)` retargets, `set(icon)` settles, `destroy()` cleans up. Copy the `assets/morphicons/` directory alongside it. The pinned Morphicons 1.7.1 runtime is unmodified and MIT-licensed; retain its LICENSE and manifest. Keep the button's name and real state in the application. The adapter sets reducedMotion to user explicitly.
- `assets/lottie-toggle.mjs`: read its API and tests before adoption. Inject the actual player and inspect the chosen frame ranges; a different asset may have different bounds.
- `assets/scroll-scene.mjs`: read [scroll choreography](scroll-choreography.md). Inject GSAP and ScrollTrigger from the project. The helper owns only its scene; cleanup must not affect other scenes.

Inspect these small sources before use. Verify input interruption, failure and live reduced motion in the actual product. Bundled adapters do not establish the quality of a new animation. Review current engine documentation when changing versions; do not assume every runtime can morph arbitrary paths.
