# Author a scroll choreography

Start with a story and spatial plan, then author the timeline. A page of unrelated scroll reveals is not a coordinated scene. Our workflow and adapter are original Seenry resources; transitions-dev is not required. GSAP can provide the runtime without supplying the design decisions.

## Score the scene before implementation

Record `progress interval | reader learns | leading object | support | stationary anchor | handoff`. Use a normalized 0–1 score so timing relationships survive a change in scroll distance. Include readable holds and the reverse path. Example structure, not mandatory timings:

| Progress | Purpose | Choreography |
| --- | --- | --- |
| 0–0.18 | Establish what is being examined | A focal object settles; title and navigation stay still. |
| 0.18–0.45 | Reveal a meaningful relationship | One object separates or changes framing; its annotation arrives after space exists. |
| 0.45–0.65 | Allow reading/comparison | Hold the object and text; secondary motion yields. |
| 0.65–0.88 | Resolve the relationship | Parts assemble or a detail transfers into the next composition. |
| 0.88–1 | Return to the document | Leave a readable endpoint and release the pin without a jump. |

Adjust intervals to actual content; do not manufacture five beats for a one-step idea. Give each beat a visual leader. Overlap support motion only when origin, identity and reading order remain clear. A product demonstration might separate layers; a studio might shift a miniature scene's framing. The concept must come from the subject.

## One playhead, explicit ownership

Use a timeline with labels or explicit positions. Each track targets a distinct property/element wrapper. Shared progress may drive DOM, an illustration or a shader uniform; it must not start independent wall-clock animations on each update. Express states so any progress can be rendered without earlier callbacks having run. Avoid irreversible side effects, delayed content fetches and business state mutations in scrub callbacks.

Use linear mapping for the overall scroll relationship; child easing can shape a local movement. Start with direct `scrub:true`. Numeric catch-up adds a temporal lag: test fast reverse scroll before deciding it improves the experience. A reading hold is an interval in the timeline, not a timeout or scroll lock. Snapping is optional and must not fight touch, keyboard or anchor navigation.

Pin a stable wrapper and animate its descendants. Determine travel from available geometry with functions and refresh after genuine layout changes. Do not hardcode a horizontal rail's overflow from a desktop screenshot. Keep ordinary document navigation; a smooth-scroll library is not required.

## Bundled implementation

`assets/scroll-scene.mjs` exports `createScrollScene({gsap,ScrollTrigger,root,stage,build,distance,scrub,query,observe,onError})`. Inject the project's runtime. `build(timeline,{select,root,stage})` adds the scene's tracks; `distance` is a positive pixel count or measurement function. `status` reports current mode/progress/start/end; `refresh()` schedules measurement, and `destroy()` reverts only this scene. Responsive and live reduced-motion changes clean up its pin and styles. Initialization failure returns to normal document content.

The normal CSS must be readable without enhancement. Put positioned/overlapping scene styles under `[data-scroll-enhanced="true"]`; keep controls out of hidden decorative layers. Use separate readable text sections in the fallback. Do not duplicate interactive controls in animation snapshots. Avoid `aria-live` narration for every scroll tick. If hiding a focusable region, remove it from interaction as well as from paint.

## Required working evidence

Capture start, the key transition midpoint, each reading hold and release. Scroll to those positions through actual document input; seeking the timeline alone does not prove scroll wiring. Compare the same progress reached forward and backward, including a rapid direction change. Exercise mid-scroll reload, deep anchors beyond the pin, window resize, short-height windows, live reduced motion, missing runtime and mount/destroy/remount. Check two independent scenes: removing one must leave the other intact. Inspect fonts/images loading late and accumulated pin spacing.

Use numeric progress/geometry traces for deterministic checks and normal-speed playback for perceptual review. A model claiming “smooth” after seeing only endpoints remains unverified. Record browsers actually tested; responsive browser emulation is not physical-device evidence.

Primary API references checked 2026-09-08: [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context()/), [matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/). The Seenry supplies choreography and lifecycle structure; these API references supply engine semantics.
