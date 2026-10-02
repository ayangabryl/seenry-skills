# CONTINUE: Seenry Transitions, road to 9/10 everywhere

Handoff for the next agent (Codex or Claude). Read this first. The target, the owner's notes, what is done, what is
not, and how to test it.

## The target

- **9/10 in every category for every component.** The owner rates the current catalog about 6.5/10. It is not yet
  as consistent as transitions.dev. The goal is to **beat transitions.dev** in consistency, behaviour and feel, not to
  match it.
- Benchmarks: **transitions.dev** (Jakub Antalik) and the big product companies (Apple, Linear, Vercel, Family,
  Stripe, Arc).
- Every transition must be deliberately designed for its scenario: the right origin, the right continuity, the right
  close behaviour, and visible premium blur where it helps.
- The **Seenry skill** must teach agents this too. Any project built with it should check its transitions against
  this bar and know *why* each transition works.

## Files

- Kit: `skills/seenry/assets/components/transitions/seenry-transitions.js` and `seenry-transitions.css`.
- Catalog: `skills/seenry/assets/components/transitions/gallery.html`, which holds the demos plus the page CSS, a
  "v5" layer appended near `</style>`, and inline demo JS. There is also `gallery.js`.
- Skills: `skills/seenry/SKILL.md`, `skills/seenry-motion/SKILL.md` ("Reaching 9"),
  `skills/seenry/scripts/motion_judge.mjs` and `check.mjs`.
- Tests: `tests/transitions-library*.{test.cjs,browser.mjs}` and `tests/fixtures/transitions/`.

## Research findings (Seenry MCP, transitions.dev videos)

These come from the frames of Jakub Antalik's published clips: the transitions.dev intro, the 7 transitions for AI
interfaces, the success-check tip and the state-transition tip.

- **Card system.** Off-white page, white card (radius ~24, 10px padding, a barely visible ring), and a grey stage
  (radius ~16). Every demo is **one element, centred**, with plenty of air. There are no busy product mock-ups and no
  grey skeleton placeholder bars.
- **State clock.** Hover, focus and border changes run at `180ms cubic-bezier(.25,0,.06,1)`.
- **Entrances.** 250–450ms on `cubic-bezier(.3,1,0,1)` (very front-loaded).
- **Success check (Jakub's spec).**
  - Path draw: 250ms on `(.3,1,0,1)`.
  - Opacity 0→1: 450ms on `(.3,1,0,1)`.
  - Rotate −20°→0°: 450ms on `(.2,0,0,1)`.
  - Y 0→4px over 200ms, then 4→0 over 300ms.
  - Blur "40→0" (Figma units) over 300ms.
- **Streaming text.** Words resolve through a soft cross-blur, and each word starts light grey and blurred. The old
  text clears at once.
- **Reasoning stream.** Text scrolls up two lines at a time inside a white panel, with fade masks at top and bottom.
- **Thinking states.** The status line shimmers, then swaps to the next step.
- **Image generation placeholder.** Dot noise wakes up, then resolves into the image.
- **Matrix dot loader.** A 16-dot matrix pulses in four patterns.
- **Reorder (reference).** A tight sidebar list with ~20–36px rows and a hover pill (radius 6–8). Actions appear on
  hover. The dragged row keeps its pill while its neighbours slide out of the way.

## Done in this session (pushed to `main`, still in progress)

- **Kit timing.** About 50% slower overall: `MS` scale, longer springs, and new curves `O` = `(.3,1,0,1)` and
  `S` = `(.25,0,.06,1)`. The CSS spring tokens were regenerated to match.
- **Controls.** An outer ring instead of an inset hairline (`--ring-control`), one state clock (`--st-state`), and a
  `.97` press.
- **Blur option** (`data-st-blur`): default 8px, on elements up to 160000px². Blur now runs on its **own longer clock**
  (≥300ms, standard ease), so it is visible instead of vanishing with the opacity.
- **Success check:** a disc that changes from neutral to done, with the tick following Jakub's spec. Fixed the stray
  dot that showed at rest.
- **Spinner to check (status mark):** idle glyph, spinning arc, then the arc closes into the tick, or a cross with a
  shake on error.
- **Button states:** the button keeps its own colour through every state, the tick motion is reused, loading lasts
  1.1s, and Replay demonstrates both success and failure.
- **Reorder:** rebuilt as a project list with a hover pill and a grip shown on hover. One row lifts while the others
  slide. Kit fix: the travelling row is now chosen from `offsetTop`, not rects that FLIP has already inverted.
- **Tabs:** the old panel blurs out before the new one blurs in, so there is no doubled text, plus a hover pill. This
  is still not good enough; see below.
- **Menu:** opens and closes as one piece, so there is no empty shell or stray shadow. Separators became space.
- **Morph menu:** a close pill is pinned where the trigger was, its "+" rotates into "×", and the menu folds back into
  the button. The owner says this is still wrong; see below.
- **Card resize:** a disclosure card anchored at the top, with a chevron, staggered rows and a close that clears its
  rows first. The owner says it is still height-only; see below.
- **Accordion:** separate cards on a spring shell; a `<details>` stays open until its collapse lands; the chevron
  follows the intended state.
- **Dialog:** compact and centred, with the page dimming and blurring behind it.
- **Command palette:** its close now uses a front-loaded collapse.
- **Page transition:** "‹ Inbox" back control with a shared title, and new content waits for the shared parts to
  land.
- **Drawer and Tooltip:** real content instead of placeholder bars.
- **Thinking states** (was Shimmer text): a gradient sweep through the label itself, steps changing with a blur, and a
  finished, unshimmered final state. Fixed the kit rule that had switched the thinking shimmer off.
- **Judge and skill (pushed earlier as 4.7.3):**
  - The judge crops only to layers the click opened, and hovers the component, not Replay.
  - Undefined `--focus` token fixed.
  - The judge's `--prev` lists what is still open since the last round.
  - "Reaching 9" rules in seenry-motion.

## Owner's notes, verbatim intent (all still open unless marked done)

1. **Premium blur everywhere it fits**, for example Number has no blur. Audit every component for where a blur
   focus-pull belongs, and make it visibly premium, not a 2px afterthought.
2. **Button to menu (morph) does not make sense.** Study the **seenry.design header menu**. Morph *into white* at
   that quality: the button becomes the white menu surface.
3. **Close-button rule.** The AI should know the best UX is continuity: put the close control **in the same place
   as the open button**, so the same spot opens and closes. It does **not** need to be the same colour. Add this to
   the skill as a rule.
4. **Dialog/modal preview** should open properly, **full screen**, for a better demo.
5. **Menu dropdown** is not placed accurately relative to the action that opened it. Fix the anchoring so the menu
   comes from the trigger.
6. **Tabs:** fix or redesign; switching still feels bad. This also applies to the **catalog's own tabs** (the
   category filter and System/Light/Dark).
7. **Blue focus ring appears when clicking demos with a mouse.** It must only show for keyboard (`:focus-visible`
   handling and `data-st-input-mode`). Check `.card:focus-visible` and the demo stages.
8. **Skeleton to content is not premium.** Redesign it, for example image-generation-style resolve, or matched shapes
   that become content.
9. **Review every component** for a higher-quality transition in its scenario. Each component needs a written **"Why
   this works"** note in the catalog (detail drawer and/or caption).
10. **The Seenry skill** must make agents apply this in users' projects: which transition fits which situation, and
    why. Put the research and the checklist into the skill references, and have `check.mjs` / review flag
    transitions below the bar.
11. **Avatar group is not good UX.** It focuses on wherever the pointer hovers, it is abrupt, and it is not smooth.
    Redesign the interaction and motion.
12. **Success check and Spinner to check are still not premium.** The solid tinted disc reads basic. Rethink the
    look: no flat solid fill; consider ring plus tick or glyph-only with blur.
13. **Card resize only resizes height.** It is not transitions.dev quality. Width and height, content reflow and a
    shared-element feel are needed.
14. **Consistency** across all components (radii, shadows, line weights, hover, close behaviour, timing) must **beat
    transitions.dev**.
15. Earlier notes still standing:
    - No divider lines.
    - Stripe/Linear-level premium.
    - No eyebrow labels and no 01/ numbering.
    - Motion judge target is 9.
    - Things should not be "so fast" (use the timing scale above).
    - Hover states, line weights, border radius and drop shadows must be consistent.
    - The avatar and copy demos were called bad.
    - AI must reach 9; it is currently 7 on the judge.
16. **Shimmer must be premium** (done partly: Thinking states). Verify it with the owner.

## Per-component status

| Component | Status |
|---|---|
| Menu | one-piece open/close done; **anchoring to trigger (#5) open** |
| Button to menu | close pill in trigger spot done; **redesign to seenry.design header morph (#2)** |
| Dialog | compact + scrim done; **owner wants full-screen preview (#4)** |
| Command palette | close fixed; review |
| Bottom sheet | ok; review |
| Drawer | real rows; review |
| Tooltip | real text; ok |
| Card expand | judge 8–9 (prior session); review "why" |
| Tabs | panel blur swap + hover; **still bad (#6)** |
| Segmented control | hover only; review |
| Page transition | back control + timing; **chevron still overlaps title briefly** |
| Accordion | spring shell done; review |
| Button states | done; check premium |
| Copy to clipboard | **not reviewed** (owner called copy bad earlier) |
| Like | not reviewed |
| Switch | not reviewed; the off track is a heavy dark grey |
| Form error | not reviewed |
| Toast stack | **empty at rest after replay**; not reviewed |
| Number | **no blur (#1)**; not reviewed |
| Text change | not reviewed |
| List | not reviewed |
| Skeleton to content | **not premium (#8)** |
| AI thinking and streaming | judge 7; needs transitions.dev-style focused demos (streaming text, reasoning stream, thinking states) |
| Checkbox | not reviewed |
| Card resize | **height-only (#13)** |
| Notification badge | not reviewed (Jakub tip: scale from the bottom-left origin, subtle bounce, animate position) |
| Icon swap | not reviewed |
| Success check | **not premium (#12)** |
| Avatar group | **bad UX (#11)** |
| Input clear | not reviewed |
| Link arrow | not reviewed |
| Popover panel | not reviewed |
| Spinner to check | **not premium (#12)** |
| Image open | not reviewed |
| Reorder | rebuilt; review |
| Thinking states (shimmer) | rebuilt; verify |
| Tilt card / Text reveal | extras; review |

## How to test

1. Serve the catalog:
   `python3 -m http.server 8790 --directory skills/seenry/assets/components/transitions`, then open
   `/gallery.html`.
2. Film one component in slow motion with `film.mjs`. A copy is in the Claude scratchpad and is simple to recreate.
   - It runs Playwright, sets CDP `Animation.setPlaybackRate` to 1/4 with timers slowed to match, clicks
     `[data-replay=KEY]`, and screenshots the card at the given ms marks.
   - Env options: `MARKS=0,40,80,...` sets the marks, `BLUR=1` turns the blur option on, and `VW` sets the viewport
     width.
   - Check open, close and interrupt (a second click 70ms in).
3. Motion judge:
   `SEENRY_PLAYWRIGHT=<playwright index.mjs> SEENRY_CRITIC=codex node skills/seenry/scripts/motion_judge.mjs gallery.html --selector "[data-replay]" --labels "<Card label>" --prev <last motion.json>`.
   Run it **twice**; a 9 counts only if both runs reach it (a single run moves ±1).
4. Tests:
   - `node --test tests/*.test.cjs tests/*.test.mjs`
   - each `tests/transitions-library*.browser.mjs --playwright <path>`
5. The working Playwright on the owner's machine:
   `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs`.

### Known test state at handoff

- Browser tests: all 7 pass.
- Unit tests: 17 of 18 pass.
- `tests/transitions-library-rendered-findings.test.cjs` fails on
  `assert(calls.some(c=>c[0]==='shimmer'))`. The test expects the off-screen observer to call `S.shimmer`, but the
  card is now Thinking states and calls `window.galleryReplay?.shimmer?.()`. Update the test to the new contract.
- Several tests were updated for the new markup:
  - reflow: digest rows, the tooltip `.editor-text` and the morph close selector;
  - logic: the blur clock and the thinking sequence.

## Method that works (do not skip)

- **One component at a time.** Film it, fix it, film again, then judge it twice. Never patch the whole catalog
  blind.
- **Fix structure, not timing,** when a problem returns. Examples:
  - a container that snaps height → use a spring shell (`resize()`);
  - doubled text in a swap → clear the old content before the new arrives;
  - a centred stage that recentres → anchor at the top.
- **No empty frames.** **No placeholder content.** **No divider lines.**
- **Keep the best version.** Revert any change that makes a component worse.
