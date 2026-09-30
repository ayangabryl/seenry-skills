# Changelog

## 4.5.4

- Composition guidance rewritten around scale ("fewer, larger, fuller"): every brand-page section gets an anchor at 40-60% of the content width or full width (the product working at real scale, one strong photograph, a large figure, a readable diagram), section headings 40-56px with a 20-22px lead, hero display 64-96px, five to seven full sections, and "replace, never just remove". Builds had been getting sparser round by round because every rule and the critic's own advice only removed material.
- The critic no longer prefers removing over adding: when it removes material it names what stronger material replaces it, and it flags sections that are small or sparse for a 1440 canvas.

## 4.5.3

- The critic sees the whole page: `review_board.mjs` cuts long desktop and phone pages into side-by-side columns instead of clipping them at about 5200px, which had made critics report missing footers and sections.
- Every critic round saves the page's HTML, CSS and JS in `review/round-N/`, and STOP names the best round to restore, so a worse last round is never what ships.

## 4.5.2

- A steadier critic: `critic.mjs` scores the page in three independent runs and reports the median (fixes come from the median run), because one run moved about a point and changed its advice between rounds. It also sees the first screen at full 1440 size and judges text size there, not from the half-scale board.
- The motion judge's interruption test now films the reversal mid-flight and tells the judge that a toggle correctly ends in its first-click state, so a correct close-and-reopen is no longer scored as a failure.
- People photography at most once per page; other visual slots show the product working at real scale, the object or place, or type.
- `image.mjs` generates variants one at a time and warns on identical files.

## 4.5.1

- A calibrated critic bar: `research.mjs` now saves `research/bar/`, home-page first screens of design leaders (Stripe, Linear, Airbnb, Raycast and others), and `check.mjs` and `pick.mjs` score against it instead of the builder's own picks, which were often section crops or mid-animation frames. On this bar Stripe's own home page scores 7-8 and a no-skill page 3; the pass target stays 9.
- Explore, then pick blind: a new flow step builds three first screens from three different ideas and `scripts/pick.mjs` has a fresh model rank them at desktop and phone against the bar; `check.mjs` requires it.
- Only critic rounds count toward the round budget; board-only rounds are free, and re-running an unchanged page with open blockers is refused.
- New rules from what the critic kept citing: one focal element on the first screen, proof text (sources, dates, names, diagram labels) at 15px or larger and never faint, no repeated examples or claims, "many" never drawn as a cloud of tiny chips, no production notes in the page body. `review_board.mjs` blocks chip clouds and body production notes. Design-thinking examples no longer carry one site's visuals.
- Imagery: photograph the idea rather than a person using the product, best of three via `image.mjs --variants 3`, phone hero rules, proof shown at real scale; result reveals as one unit and locked submits in the motion rules.
- Transitions, interaction and statement kits polished to motion judge 8/10 with zero violations.

## 4.5.0

- Production motion, measured: `seenry-motion/references/production-motion.md` comes from a frame-by-frame study of 48 real product and website clips from the Seenry library across 15 transition families: per-family specs, a token system with several clocks (curves E, M, F, X; 0/80/120/160/180/240/280ms chosen by distance × size × frequency), choreography rules, an interruption contract and what separates senior from junior motion.
- Seenry Transitions (`assets/components/transitions`): 28 clean-room transitions rebuilt to that study (menus and sheets growing from their trigger with the close control where the trigger was, digit-level number changes with blur as focus, attached modal content, AI thinking and streaming states without dots), applied by `data-st` or a small JS API. Motion judge 8/10, zero violations, reduced motion 10/10.
- Interaction kit (`assets/components/interaction`): 32 clean-room components (slide to confirm, hold to delete, status island, morphing button, combobox, one-time code, reorderable list, date range, dual range slider, waveform player, stacked drawer, pricing toggle and more) on the same tokens. Motion judge 7/10, zero violations.
- Statement with inline objects (`assets/components/statement`): a large editorial statement with the brand's proof set inline and one morphing action button, words inking in with scroll and readable at every position. Motion judge 8/10.
- `SKILL.md` applies transitions on Seenry's own initiative by situation (every modal, menu, tab set, changing value, async action, form error, list change, loading state and navigation) and routes richer components to the interaction kit.

## 4.4.3

- Design thinking before patterns: `references/design-thinking.md` and a new flow step have the agent write the product's claim, proof, moment and material, generate at least five ideas with different designer moves, score them on truth, clarity, distinctiveness, restraint and buildability, and carry the chosen idea through hero, signature moment, imagery, copy and one detail. Kits are how to build an idea, never the idea. `check.mjs` requires `.seenry/idea.md`, the blind critic scores the idea, and the report opens with it.
- Motion rules from measured production work: the trigger becomes the surface (the close control lands where the trigger was; content follows the container 100–150ms later, 30–40ms per item) and blur as focus only at text and icon size, with the digit-level number change.

## 4.4.2

- Editorial serifs used well, studied from America.gov: a type row for civic, public-service, cultural and premium consumer pages (a neutral grotesk for all UI and headings, an editorial serif for one or two display moments at weight 400, tracking −0.04 to −0.06em, roman only) and the line between a well-used serif and serif slop.
- "The claim made visible" as the first signature choice when a page makes one big claim, with a pause control for loops over 5 seconds.
- One photographic look per page: the same style words in every image prompt so every photo reads as one shoot.

## 4.4.1

- Colored dots in front of text ("● Active") are slop: `SKILL.md` bans them, both kits drop them, and `review_board.mjs` blocks any small round dot before text unless marked `data-seenry-dot="live|presence|unread"`, where a dot is the whole message. Status in data views stays a quiet tinted pill with the word only; outside data views, pills and chips need a real reason.
- Adds `motion_judge.mjs`: it plays every control, films each transition and a rapid double click, measures running animations (properties, durations, easing), layout shift, long frames and a reduced-motion run, blocks hard violations (animated layout properties, UI motion over 600ms, layout shift, motion under reduced motion) and asks a fresh model to score purpose, timing, spatial logic, smoothness, consistency and reduced motion. `check.mjs` runs it every round and passes only at critic 9+ and motion 8+.
- `check.mjs` fingerprints the page each round and runs a verification round if the page changed after the last checked round, so results always describe a checked version.
- `motion.js` number rolls shorten from 520ms to 240ms, which the motion judge flagged as slow beside 140ms selection feedback.

## 4.4.0

- Real photography from any host: `scripts/image.mjs` generates photographs through the Codex CLI's image model (single or batched, three at a time), so Claude Code and other hosts without an image tool still get art-directed photos. `SKILL.md` and `seenry-assets` put it right after supplied photos and the host's own image tool; the no-photo fallback now applies only when every image route fails. Prompts name the subject's real state (roasted beans, worn products, plated food).
- `seenry-motion/references/interaction-craft.md`: the method behind high-quality interactive components (job and one idea, state graph, fixed geometry, motion score with reasons, interruption rule, input contract, reduced motion, runtime budget), timing ranges with reasons, a pattern catalogue, a twelve-field component brief with eight worked examples, a review checklist and what to leave out of serious products. `SKILL.md` requires the brief for any interactive component the kits do not have.
- Benchmark (Sonnet 5.5 builds and judge, premium standard): with generated photography Seenry scored 7.5 on landing (from 7.0) and 7.0 on product, first in all four passes, against 6.0 and 5.0 for the best competitor.

## 4.3.3

- `review_board.mjs` reads colors by painting them to a canvas, so `oklch()`, `lab()` and `color()` values get correct contrast and default-color checks (builds were converting tokens to hex to get past false contrast failures).
- `research.mjs` drops error and 404 pages, reads app screens from the `screens` field (they were silently missing), and gives dashboards their own plan: app screens for dashboard, table, invoice, billing, list and filter, plus imported dashboard, table and admin designs.
- `critic.mjs` no longer recommends text below the skill's minimum sizes.
- Benchmark round 3 (Sonnet 5.5, premium judge): Seenry first in all six passes again, 7.0 on all three briefs, no-slop 7.0–8.0 against 3.0–5.5 for the competitors. Across three rounds Seenry ranked first in 17 of 18 passes.

## 4.3.2

- Larger type floors, because every Sonnet judge pass still called Seenry's secondary text small and faint at review scale: paragraphs 16px, readable text 15px, short labels 14px at 1440, enforced by `review_board.mjs`; app screens 28/34 titles, 16/24 body, 15/22 cells; brand surfaces 18px body and 16px captions. The product kit and both component kits move to the new scale.
- Benchmark (Sonnet 5.5 builds and judge, premium standard, big-company references): Seenry 4.3.1 ranked first in all six passes, 7.0 on landing, dashboard and product against 5.0–6.0 for the best competitor, with no-slop scores of 6.5–7.5 against 3.0–5.5.

## 4.3.1

- From the first Sonnet 5.5 benchmark (Seenry first on all three briefs, 7.0 / 7.0 / 6.5 against 5.5 for the best competitor): an imagery fallback when no image model is available (typographic covers, large product UI or one line system instead of weak stock photos; gradient blobs never), a ban on framework default accents with a `review_board.mjs` detector, readable table data (text-1 or text-2, never text-3), and sticky phone bars that hide while their options are on screen.
- The product kit and both component kits default to an ink accent instead of a generic blue, so an unset accent reads as deliberate.

## 4.3.0

- Research pack: `research.mjs` calls Seenry MCP directly and assembles 50–60 varied references per brief (human-rated picks, category sites and sections, named leaders, random samples beyond the alphabetical top, recorded motion walkthroughs with video, motion clips, app screens, measured design) into `.seenry/research/pack.md` with a contact sheet; one brand appears at most twice.
- `SKILL.md` adds a Taste section, the core motion rules (frequency, easing, origin, interruption, stagger, scroll scrubbing), a motion spec step built from studied recordings, an OKLCH color system with premium palette families and a separate dark palette, a Craft section for line illustration and ambient canvas, and routes explicitly to `seenry-motion`, `seenry-assets`, `seenry-branding` and `seenry-review`.
- Adds a core component kit (`assets/components/ui`: 28 token-driven, accessible components with a light and dark gallery) and a signature component kit (`assets/components/signature`: product demo player, line draw-in, ambient field, scroll story, live numbers, logo marquee, compare slider, case-study card). Every page gets one signature moment on Seenry's own initiative.
- `check.mjs` blocks until the research pack, at least two references, a motion spec, `DESIGN.md` brand guidelines and a marked signature component exist.

## 4.2.1

- `check.mjs` stops treating photographs as a hard blocker after three photo checks and keeps the strongest versions, and stops any loop after eight rounds. In the 4.2 benchmark the photo gate locked the critic out for nine rounds on landing and product pages, doubling build time.
- Benchmark (premium judge, one build each): Seenry first in all six passes; dashboard 8.0 (best competitor 7.0), product 7.5 (6.0), landing 6.5 (5.0).

## 4.2.0

- Photography: `SKILL.md` directs imagery like Apple, Aesop and ARKET (one soft motivated light, quiet natural surface, matched hero, detail and context set, no text in generated images, no clichés), with premium recipes in `seenry-assets`. Adds `photo_check.mjs`, a blind art director that scores each image for its slot against the reference screens and writes a better prompt for anything under 8; `check.mjs` blocks pages whose local photographs have not passed it.
- Type: a curated table of free faces by surface (Inter with optical sizing, Geist, Inter Display, Inter Tight or Hanken Grotesk, `system-ui`, a reading serif for long-form only) with the tuning each needs, and a list of template defaults to avoid.
- Radius: a family chosen from the brand, radius by role and size, at most 25% of a control's height or a full pill, matching neighbours, concentric nesting and square edges where content is flush; `review_board.mjs` blocks in-between control radii and mixed control radii.
- `critic.mjs` and `photo_check.mjs` share `model_cli.mjs` to run a fresh Codex or Claude process.
- Benchmark (premium judge, one build each): product 8.0 against 7.0 for the best competitor, landing 7.0 against 6.0, Seenry first in every pass.

## 4.1.0

- Adds `assets/kits/motion.js`, a dependency-free classic script that works from disk: `SeenryMotion.number` rolls prices, totals and counts digit by digit with an accessible exact value, `swap` cross-fades filter, sort and tab changes with View Transitions, `pop` and `toast` give add-to-bag and save feedback. `SKILL.md` requires them for every in-place change.
- `review_board.mjs` clicks the page's controls and blocks state changes that happen with no motion, blocks desktop text under 14px (paragraphs under 15px, short labels under 13px) and text contrast under 4.5:1.
- The product kit moves to 15px body and 14px cells and meta.
- `check.mjs` stops the loop itself: after two rounds without improvement it asks for one root-level change, then stops and refuses further rounds.

## 4.0.0

- Rewrites `seenry` around one standard: clean, premium, no AI slop, at big-company level. The rules that decide quality (never-ship list, color, type and weights by role, radius and elevation, desktop scale, layout, imagery, copy, motion, phone) now live in `SKILL.md`, because agents were not opening the reference files that held them.
- New flow: brief, set the bar with three big-company screens from Seenry MCP saved to `.seenry/refs/`, a five-line direction, build on the product and motion kits, then `check.mjs` until it passes. The design sheet becomes optional and comes last.
- Adds `check.mjs`, the finishing gate: `review_board.mjs` blocks on slop and craft problems, then `critic.mjs` scores the page against the reference screens and prints PASS or the fixes to apply.
- Adds `critic.mjs`, a blind critic run in a fresh Codex or Claude process that sees only the screenshots, the brief and the references, scored on premium, clean and no-slop. It finds a working CLI even when a broken install shadows it on PATH. In testing, self-review rated 9 what blind review rated 6-7.
- Adds `review_board.mjs`: the page at review scale beside the references, with detectors for tiny text, uppercase labels and eyebrows, numbered labels, heavy or too many weights, italic accent words, fonts that fail to load, spaced-out tabular punctuation, clipped phone rows, fixed bars over content and missing motion.
- Adds `assets/kits/product.css` (app-screen floor from Stripe, Linear, Attio, Mercury, Ramp and Vercel) and `assets/kits/motion.css` (functional motion floor with reduced-motion handling).
- Adds `references/premium.md` (why leading teams choose their colors, radii, weights and density, with sources) and `references/art-direction.md`; bans uppercase eyebrows and numbered section labels across the references; the sheet gains a Brand section.
- Renames the MCP server from web-atlas to `seenry` and reads the key from `SEENRY_PRO_KEY`.
- Benchmark (premium judge with big-company references, Codex gpt-6-sol): Seenry ranked first in all six passes across landing, dashboard and product (7.0 / 7.5 / 7.5 against 5.0 / 6.5 / 6.5 for the best competitor), with no-slop scores of 9-9.5 against 2-6.

## 3.0.0

- Consolidates seventeen skills into seven: `seenry`, `seenry-review`, `seenry-assets`, `seenry-motion`, `seenry-apps`, `seenry-branding`, `seenry-decks`. Typography, color, layout, polish, writing and accessibility guidance become references of `seenry`; review, change review, stress and explain become modes of `seenry-review`.
- Reframes `seenry` as a studio process with structured exploration: a fixed frame, three compositions varied on real axes, written critique, refinement. Adds an exploration sheet and a worked player-card example.
- Rewrites `seenry-assets` around real material: `assets.py` sources CC0/public-domain photos from Openverse and permissively licensed icons through Iconify, generates images through OpenAI or Gemini when a key is present, and records a license manifest and contact sheet.
- Adds ink-level alignment: an alignment guide (keylines, cap-height and baseline alignment with `text-box` trim, glyph-level icon alignment, equal optical inset, the near-miss rule, media proportion) and per-component alignment measurement in `system_audit.mjs` (media anchors, near-miss edges, optical insets). The player-card example is rebuilt on keylines and measures zero offsets.
- Adds the Seenry sheet: `sheet.py` renders a self-contained design rationale and guideline page styled like seenry.design (research with leaders and discovered companies, decisions, variants, color with measured contrast, type, anatomy, do/don't guidelines, verification), and `anatomy.mjs` captures a component with its grid, safe area, cap-height text boxes and shared keylines drawn on. Research is now automatic: announce, shortlist leaders, discover, synthesize and decide without asking.
- Closes the gaps found in a comparison with other public design skills: a decisive motion build sequence, a never-ship table and tested modern-CSS recipes (`seenry-motion/references/recipes.md`); `palette.py` for OKLCH ramps, two-tier tokens and WCAG + APCA checks; typography rendering details; icon, image-outline and transition rules; an expanded accessibility guide; responsive and international layout rules; mobile-web fixes; library recommendations; review calibration (high-on-sight triggers, cheaper-fix ladder, finding cap, change classification, motion review); and pricing and settings worked examples.
- Adds optical alignment: a guide with measured corrections (asymmetric icon centering, cap-height label centering, icon-to-label centering, size compensation for circles and triangles, headline side bearing, icon-side padding) and `optical_audit.mjs`, which rasterizes icons to measure ink and suggests CSS nudges. `audit_page.mjs` runs the system and optical audits on any URL or HTML file at several widths; checked against Linear, Stripe, Vercel and Apple pages.
- Makes typography sans-first: one sans family chosen by product type (Inter, Geist, SF Pro, Open Runde, Nunito), mono for data, and display serifs treated as an AI tell outside editorial brands. The installer archives the retired skills on `--replace`.
- Replaces the checkpoint pipeline (first-slice gates, CLI review gates, packets, lessons) with a concrete system: 4px grid and spacing scale, concentric radius rule, one-sans-plus-accent type with at most three sizes and weights per component, color roles with one accent, ring-first elevation, starter `tokens.css` and a `DESIGN.md` template.
- Adds layered component construction (grid → safe space → structure → type and states) with spec cards and measured anatomies for common components, page shells and section archetypes for cross-page consistency, and an anti-slop list with fixes.
- Adds benchmarks measured through Seenry MCP from 24 leading product sites, and concrete MCP research recipes.
- Adds `system_audit.mjs`, which counts rendered font sizes, weights, families, radii, shadows and colors, lists off-grid spacing and flags non-concentric nested corners and components over the type limits.
- The 2.x pipeline is preserved at the `v2-archive` git tag.

## 2.0.1-dev.38

- Gives reference-led adaptations a primary route: compare the decisive rendered slice with actual source pixels before expanding the page, preserve the visual relationship with original subject material, and report surviving gaps rather than inferring parity from working controls.
- In a private Blue Hour Lab Luna trial against inspected Seenry desktop and mobile captures, the revised route improved image scale, framing, type overlap and mobile order over the dev.37 baseline in a blind image review. The reviewer judged both below the reference's material quality; this is a scoped improvement, not a broad quality or component-catalog claim.
- Refreshes the optional local MCP tool schema fallback to the current 2.6.0, 21-tool contract for distribution through Seenry's website.

## 2.0.1-dev.37

- Adds browser evidence for rendered text crossing another label or a separate painted element. These are review candidates tied to screenshots, not automatic design verdicts.
- A Luna page had no horizontal overflow but placed its mobile standby caption across a meter bar. The new probe found it at 390 and 320 pixels. A separate Luna refinement moved the meter, and host browser review found the collision gone with controls still working; Luna’s own browser was blocked by its CLI sandbox.

## 2.0.1-dev.36

- Adds an original reflective-surface controller with a WebGL2 material layer, CSS fallback, three palettes, a semantic-control demo, and browser checks for keyboard use, reduced motion, offscreen pause, context recovery and unavailable WebGL.
- Routes reflective material requests to the reusable asset. A separate Luna page adopted the helper, but host browser review found crowding at 320 px; the trial supports reuse, not whole-page quality or component-catalog parity.

## 2.0.1-dev.35

- Adds a fact-and-action integrity route for supplied facts, permitted examples, real CTA destinations, and missing booking or registration hookups. The page shows supported information while the handoff names unavailable integrations.
- Extends the offline text audit to inspect variable colors and simple HTML ancestor surfaces, exposing weak accent labels and captions that page-background checks missed. Its inferred surfaces still require review on complex CSS.
- Adds a narrow dependency-free HTML check for accessible names on generic `div` and `span` elements; browser accessibility review remains necessary.
- In isolated Luna trials, a revised event page used truthful details links, and a separate workshop page passed the offline checks plus host browser initial axe and width checks at 320 and 1440 pixels. These samples support the repairs, not a broad design-quality or library-parity claim.

## 2.0.1-dev.34

- Routes whole-page motion work through the core Seenry design and contrast workflow, while keeping focused component work in Seenry Motion.
- Shortens the motion entrypoint and moves detailed research instructions into a focused reference. Makes runnable asset selection, accessible count semantics, status motion and four-event toast checks easier to find.
- In isolated Luna trials, the shorter entrypoint led to core skill reading and a contrast repair on an image-led page. A revised batch transition trial passed browser checks for status, count, five sequential toasts, reduced motion, stable 9→10 geometry and initial axe checks. These trials establish task-specific behavior, not parity with a full component library.

## 2.0.1-dev.33

- Checks text against an opaque `html` canvas background when `body` has no fill, so the offline contrast audit catches muted labels in this common CSS layout.
- Lists the current runnable motion assets in the repository guide.

## 2.0.1-dev.32

- Adds an original, dependency-free decoded image reveal with an interruptible canvas treatment, real image fallback, error recovery, live reduced-motion behavior, a demo and browser checks.
- Routes image-led loading work to the asset without implying that decorative motion measures generation progress or creates image content.

## 2.0.1-dev.31

- Shortens the Seenry entrypoint by routing detailed design decisions to their focused references and placing rendered review and the offline text-contrast check in the main creation path.
- Keeps replication, creation, refinement and review separate while preserving optional MCP, marketing, brand, form, motion and learning routes.
- Checks variable text colors against resolvable same-rule fills in the offline audit, so action text on a local background is not misreported against the page canvas.

## 2.0.1-dev.30

- Adds an original, copyable expanding card with an in-flow geometry transition, keyboard and focus behavior, live content resize, rapid reversal, reduced-motion support, a demo and cross-platform browser checks.
- Makes the reusable card recipe explicit in motion routing. It is a general disclosure pattern, not a measured recreation of a named component.

## 2.0.1-dev.29

- Extends the offline text-contrast audit to direct hex text colors and root backgrounds, exposing weak small labels that token-only checks miss. The result remains a source heuristic; rendered backgrounds and large-type exceptions need review.
- Routes browser-unavailable design work to that audit before handoff instead of treating source inspection as a visual pass.

## 2.0.1-dev.28

- Adds an original, dependency-free boundary trace for one active rounded surface, with a runnable demo and browser checks for motion, resize, visibility pause, live reduced motion, keyboard use and cleanup. It is a decorative state signal, not measured progress or a replica of another effect.

## 2.0.1-dev.27

- Routes requested count motion to per-place number guidance and checks that every requested transition is actually implemented before handoff.
- Makes the notification overflow invariant explicit: remove an item from the active set before its exit animation; exercise the fourth event in a three-item stack.
- Clarifies valid naming and announcement ownership for toast regions. A fresh Luna build passed the focused browser sequence, including five events, 9→10 digit motion, reduced motion and initial axe checks; wider reliability remains unproven.

## 2.0.1-dev.26

- Adds an original, dependency-free digit pop for small counters, with a runnable demo and browser checks for 9→10, rapid updates, stable unit spacing, reduced motion and teardown.
- Distinguishes a digit transition from a whole-value text entrance in the number guidance. A focused Luna request produced per-digit motion; broader wording still selected a whole-value entrance, so automatic selection remains unproven.

## 2.0.1-dev.25

- Reports closed-panel and offscreen focus candidates in browser evidence, and clarifies that `aria-hidden` alone does not remove controls from the Tab order.
- Adds a limited offline contrast audit for root text tokens on the body background. A fresh Luna build ran it; independent browser review still found a nested-text contrast failure and mobile overflow.

## 2.0.1-dev.24

- Adds a small React adapter for the original signal field and verifies it in a built React app.
- Gives the field fixed receiver geometry with a traveling working emphasis, clearer state-preview copy and a less enclosed demo.
- Verifies that active frames change and reduced-motion frames stay still in browser checks.

## 2.0.1-dev.23

- Adds an original, dependency-free signal field for real process states, with a runnable demo and browser checks for offscreen pause, live reduced motion, keyboard use and cleanup.
- Makes narrow-page overflow reports identify the element extending past the viewport, based on a fresh Luna dashboard failure.

## 2.0.1-dev.22

- Tightens form recovery for multi-option groups with a compact markup example: keep the error visible beside the first invalid choice after focus moves at narrow widths.
- Checks that responsive stacking preserves prerequisite order and agrees with keyboard order.
- Adds an offline opaque-color pair check for cases where browser contrast scans are unavailable; rendered and composited colors still need inspection.

## 2.0.1-dev.21

- Adds an original status text transition with stable width for known labels, immediate accessible state, interruption handling, reduced-motion support, a demo and browser checks.

## 2.0.1-dev.20

- Adds an original, runnable action menu with keyboard behavior, interruptible presentation, reduced-motion handling, a demo and browser checks.
- Clarifies when the core skill applies to new web product UI without a supplied reference.
- Adds a narrow-screen occlusion check after a fresh Luna build exposed a sticky summary covering comparison choices; retains the failed render as diagnostic evidence.

## 2.0.1-dev.19

- Keeps five focused skills for interface design, motion, assets, branding and decks.
- Adds direct guidance for interaction anatomy and expressive effects, with state ownership, interruption and rendered verification.
- Keeps installable guidance focused on authored decisions and mechanisms. Retained adaptations and runtime helpers keep their license notices.
- Simplifies the local installer to fresh installation, replacement and rollback.

## 2.0.0

- Established a shared design workflow with focused research, working slices, implementation and visual review.
- Added optional MCP research, local resource packets and portable examples.
