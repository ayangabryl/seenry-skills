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

### Current scope clarification (2026-10-03)

- Review the **UI/UX flow of every component**, including its purpose, entry, meaningful actions and visible outcomes,
  discoverability, appropriate return/dismissal, focus restoration, relevant empty/error/disabled states, repeated or
  interrupted use, and mobile layout. Motion is one part of the review.
- **Dismissal is specific to the flow.** The confirmation Dialog already has Cancel and Escape; it should not gain a
  redundant X or Close button. Navigation can use Back. The source-point Close requirement applies to the directly
  expanding Card/toggle flow, not every dialog. This clarifies the earlier close-button note below.
- An enabled demo action needs a meaningful local outcome or a clear explanation of its limited scope. Keep demo
  wiring findings separate from a reusable component API whose application actions are host-owned. Do not connect
  destructive examples to real user data merely to demonstrate a result.
- The target remains **9 in every applicable criterion**, with source-specific evidence and independent review.
  Missing coverage is unverified; global CI and motion scores alone do not establish complete UI/UX quality.

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
17. **Card expand: the hover state is wrong.**
    - The hover pill has **no inner padding**: the cover art sits flush against the pill's left, top and bottom
      edges.
    - The hover **lifts** the row (`translateY(-1px)`). That contradicts the system: hover never moves things. Hover
      is a tint or ring change only. Press may scale to `.97–.98`.
    - Fix: give the row a real inner inset (pill padding of 6–8px around cover and text, with concentric radius
      equal to the cover radius plus the inset). Remove every hover `translate` in the catalog (search for `hover` +
      `translateY`).
    - Review the expand motion again after the hover fix. The owner says card expand "seems bad".
18. **Every component must be reviewed** for bugs and improvements using the protocol below. Nothing is "done"
    until it passes every line.

## Session 2026-10-04 (Claude, PR #65 branch `fix/voice-demo-response-test`)
- Every card has a `data-why` note shown as its own "Why this works" block in the detail view (#9 done). Notes were checked against each card's spec chips; keep them true when a component changes.
- Fixed: `#library-grid>.card{display:flex}` overrode `[hidden]`, so filtered cards stayed visible and focusable (broke the native keyboard Tab path). Now `:not([hidden])`.
- Fixed: `transition-duration: var(--st-state)` is invalid (the token carries an easing). Stage buttons/tabs/menu items and Card Close had 0ms state changes. Never put `--st-state` in a duration list; use 180ms.
- After any gallery/kit edit: `node /tmp/claude-501/pins.mjs <abs repo path>` (recomputes tests/transitions-library-menu-native.pins.json), then the full node test suite.
- Keyboard-driven changes are instant catalog-wide (`html[data-st-input-mode=keyboard]` zeroes stage/menu control transitions); the native Menu harness requires a full focus cue on the first frame.
- Switch off-track stays `--text-3` on purpose: a lighter iOS-style track fails WCAG 1.4.11 (3:1 non-text contrast).
- Hover colours on animated controls must be plain colours, not `color-mix()`: mid-transition Chrome reports oklab, which the dialog paint test cannot measure (Delete button hover is `#bb2929`).
- The page-transition message detail is an intentional keyboard-reachable scroll region; do not clamp it.
- Before pushing, run the CI browser tests locally (list in .github/workflows) — macOS has no `timeout`.
- Still open: #14 full consistency pass on the unreviewed rows below, AI demo to 9, final release (version bump + changelog) once PR #65 CI is green.

## Component review log (2026-10-04, branch `transitions-review`)
Each component filmed in slow motion (open, close, interrupt) and checked at 1440 and 390. "Bad design choice" means the
layout or interaction model was wrong, not just the timing. Keep this table current.

| Component | Verdict | Bad design choice found | Status |
|---|---|---|---|
| Button to menu | redesigned | A black Close pill on a menu (menus need no close: selection, outside click, Escape). The pill was pinned to stale trigger coordinates, so it overhung the panel, and the panel flipped upward like a popover | Fixed: no close control, panel's inner corner anchored on the button, never flips; phone shows the first group only so nothing clips |
| Card expand | redesigned | Close pinned to the clicked row's arrow, so on the third album it floated bottom-right; track rows shortened by a 52px lane; panel full-stage height with dead space; first track permanently highlighted | Fixed: Close top-right on the header, full-width rows, panel at least as tall as the album list it covers (no row peeking), no stray highlight. CI no longer runs the retired Close-anchor evidence |
| AI thinking and streaming | redesigned | The demo replaced the previous answer (dimmed, erased) — no real assistant erases history | Rebuilt as a thread: history leads (spring lead), reply trails (spring trail), card shell via kit resize (no layout height animation), answer streams into a reserved 2-line slot, sources light as cited, Stop reclaims the slot. Judge: 7 → 8, held at 8 for 15 rounds (exit/continuity trade 7↔8). Tried and rejected by the judge: word cross-blur, bubble scale-from-composer, fast cubic rise, bottom fade. Next idea: sources shared by consecutive turns (e.g. Docs) stay one element and FLIP to the new row instead of fading out and back |
| Page transition | fixed | Inbox showed a half-cut third row | Two whole rows; detail stays a scroll region |
| Copy to clipboard | fixed | The command being copied was truncated ("npm install seenry…") — you could not see what you copy | Header row holds the label and Copy; the command gets the full width and never truncates |
| List | fixed | Mid-sort the crossing rows were see-through (their paint inherited the 180ms state fade, 58% opaque) | Painted rows are opaque at once |
| Like | ok | — | Reviewed |
| Form error | fixed | On phones the button wrapped under the field, pushing the error away from the input it explains | Field and button stay on one row; the error sits right under the field |
| Switch | ok (deliberate) | Off track is darker than iOS on purpose: WCAG 1.4.11 3:1 | Keep |
| Input clear | fixed | The placeholder appeared while the cleared text was still leaving, so they overlapped | Placeholder waits for the exit, then fades in |
| Checkbox, Badge, Icon swap, Link, Popover, Image open, Tilt, Reveal | ok | — | Filmed in slow motion at 1440 and 390; no layout or interaction faults |

## Per-component status

| Component | Status |
|---|---|
| Menu | anchoring verified: right edges align, 6px below trigger at 1300 and 390 (#5 done). PR #65 native evidence: detail heading scroll-margin + caption hit fix pushed |
| Button to menu | one surface: clip from the trigger while its fill turns from the button colour to the surface and back on close (#2 done) |
| Dialog | native modal over the whole page with blurred backdrop (#4 done) |
| Command palette | close fixed; review |
| Bottom sheet | ok; review |
| Drawer | real rows; review |
| Tooltip | real text; ok |
| Card expand | judge 8–9 (prior session); **hover has no padding and lifts (#17); owner says it seems bad** |
| Tabs | labels now ease with the underline (root cause: an invalid transition-duration voided every stage state transition); catalog filter is the segmented control (#6 done, re-judge) |
| Segmented control | hover only; review |
| Page transition | back control + timing; **chevron still overlaps title briefly** |
| Accordion | spring shell done; review |
| Button states | done; check premium |
| Copy to clipboard | **not reviewed** (owner called copy bad earlier) |
| Like | not reviewed |
| Switch | not reviewed; the off track is a heavy dark grey |
| Form error | not reviewed |
| Toast stack | two toasts present at rest; not reviewed |
| Number | 3px directional motion blur, 100ms exit, frequent updates stay sharp (#1 done) |
| Text change | not reviewed |
| List | not reviewed |
| Skeleton to content | content-as-skeleton: crisp sweeping bars, media disc, blur only on resolve, 45ms reading-order stagger (#8 done) |
| AI thinking and streaming | judge 7; needs transitions.dev-style focused demos (streaming text, reasoning stream, thinking states) |
| Checkbox | not reviewed |
| Card resize | compact to detailed in width + height on one spring, toggle rides the edge, leaving rows fade inside the closing shell (#13 done) |
| Notification badge | not reviewed (Jakub tip: scale from the bottom-left origin, subtle bounce, animate position) |
| Icon swap | not reviewed |
| Success check | hairline ring closes green, tick lands, single halo; no disc (#12 done) |
| Avatar group | group spreads as one around the hovered face, name above it (#11 done) |
| Input clear | not reviewed |
| Link arrow | not reviewed |
| Popover panel | not reviewed |
| Spinner to check | ring-only, same halo on success/error (#12 done) |
| Image open | not reviewed |
| Reorder | rebuilt; review |
| Thinking states (shimmer) | rebuilt; verify |
| Tilt card / Text reveal | extras; review |

## Review protocol: run for EVERY component, one at a time

Copy this list into a scratch file per component and tick each line with evidence (film frames or a screenshot).

**Flow**
- [ ] Purpose and entry are clear without explaining the implementation.
- [ ] Each enabled meaningful action produces the expected visible local result; labels agree with outcomes.
- [ ] Back, Cancel, Done, Escape or dismissal match the scenario. Do not require a redundant Close/X on a dialog.
- [ ] Focus is usable after entry, cancellation, completion and return; background controls are reachable only when appropriate.
- [ ] Relevant empty, error, disabled and recovery paths work. Mark genuinely inapplicable states with a reason.
- [ ] Repeated and interrupted actions leave one coherent result, with no stale update or lost user input.
- [ ] The flow remains discoverable and usable on phone layouts, with spacing and genuine browser zoom checked where applicable.

**Rest state**
- [ ] One clear idea, centred, with real content: no placeholder bars or lorem.
- [ ] Inner padding: no content touches the edge of its own pill, card or button. Radii are concentric (outer =
  inner + inset).
- [ ] Uses the system surface (ring + soft shadow), radii (controls 10, surfaces 14, card 24, stage 16), type and
  colour tokens. No divider lines.

**States**
- [ ] Hover: tint or ring only, `180ms cubic-bezier(.25,0,.06,1)`. **No movement on hover.**
- [ ] Press: scale `.97–.98`, 100ms.
- [ ] Focus: a visible ring **only for keyboard** (`:focus-visible` / `data-st-input-mode`). No ring on mouse click.
- [ ] Disabled, selected and active states are distinct and calm.

**Motion**
- [ ] Origin: anchored surfaces explain their relationship to the trigger, edge or row; a centered confirmation Dialog may use its own centered origin and native backdrop.
- [ ] Continuity: what persists travels (shared element). Nothing doubles: old content clears before new content is
  legible in the same place.
- [ ] No empty frames: at 30–320ms the region always shows real content. No empty shell or stray shadow.
- [ ] Nothing snaps: containers that change size use a spring shell (`resize()`), and growing content is anchored at
  the top of its stage.
- [ ] Exit and dismissal suit the flow. A directly expanding Card preserves its source-point return control; a confirmation Dialog uses its safe Cancel and appropriate Escape path. Dismissal controls remain usable during entry and while the flow is active; an accepted exit may make outgoing controls inert while preserving appropriate interruption, cancellation ownership and focus return.
- [ ] Interrupt: a second input 70ms in reverses from the rendered value. No jump, flash or restart.
- [ ] Timing feels deliberate, not "so fast": entrances 250–450ms on `(.3,1,0,1)` or a spring; exits 120–220ms.
- [ ] Blur option on (`data-st-blur`): a visible premium focus-pull where it fits, and never on large surfaces.
- [ ] Reduced motion: no travel, scale, blur or loops; short opacity only; the state is still clear.

**Platforms**
- [ ] Light and dark both checked.
- [ ] 1440, 1100, 390 and 320px: no clipping or overlap, and touch targets ≥ 24px (44px on coarse pointers).
- [ ] No console errors and no held animations (`fill: forwards` left over).

**Proof and teaching**
- [ ] Filmed in slow motion: open, close and interrupt (`film.mjs`).
- [ ] Two independent reviews of the same current evidence reach 9+ in every applicable UI/UX and motion criterion. A motion-only result does not certify the complete flow; missing criteria or untested states remain unverified.
- [ ] A short **"Why this works"** note for the catalog: the scenario, why this motion fits it, and what to avoid.
- [ ] The rule behind it is captured in the skill (`skills/seenry-motion/SKILL.md` or references), so agents apply it
  in users' projects.

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
