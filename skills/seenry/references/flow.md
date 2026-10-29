# The flow, step by step

The table in SKILL.md is the order. This file is the detail for each step. Changes inside an existing app follow [existing project](existing-project.md) instead.

## 1. Brief

Audience, the one job of the surface, the real content, what is fixed, and one sentence of intent. Two minutes. For an app screen (a dashboard, settings, a tool), start `BRIEF.md` with `Surface: app`, so the gate judges it as product UI rather than a landing page.

Then write the inventory: the eight to twelve things the best products put on this kind of screen.

| Cover | Examples |
| --- | --- |
| The data each item shows | Columns, facts, statuses including the edge ones: out of stock, pending, overdue, failed |
| Actions on each item | Edit, remove, change role, add to list |
| Actions on the whole screen | Create, invite, import, filter, search, sort |
| States | Empty, loading, error, one item, many items |

Build every item that needs no new backend, wiring actions to handlers the owner can connect. A screen that looks tidy but thinner than the leaders' version is unfinished. Slop rules remove decoration, never content, affordances or recognition aids.

## 2. Draft the idea before you look

Write the claim, its proof and five candidate ideas in `.seenry/idea.md` before the first research call. Ideas only: no palette, typeface or layout. Give the new folder a `.seenry/.gitignore` containing `*`.

Write queries from the product, the audience and the job, never from a look you already have in mind. For a habit tracker for people who quit streak apps: "habit tracker", "fitness app", "streak". The survey says what the category always does; it does not choose your color, type or composition.

## 3. Research

### Run it

- Prefer connected MCP tools: `get_library_guide`, then `research_design_brief` with the real brief, an explicit family and up to three focused queries. Inspect the returned pixels and read coverage, gaps and the decision rubric.
- Scripted: `node scripts/research.mjs --brief BRIEF.md --type <landing|product|dashboard|studio|pricing|app> --family <websites|sections|apps|motion> --terms "<up to three queries>"`. It uses `SEENRY_PRO_KEY` from the environment; never ask for a secret in chat. Three tool calls, at most 11 credits, saved to `.seenry/research/`.
- Authentication, quota or tool errors stop the run. Without a key the script writes a clearly unresearched handoff; use connected MCP or permitted web research, never an invented pack.

### Study the survey before choosing

The result carries a contact sheet of up to eight candidates. Look at every one and write two lists at the top of `.seenry/refs/kept.md`:

| List | What it holds | Rule |
| --- | --- | --- |
| Conventions | What most do that helps people use the page: navigation, message order, where the action sits, pricing anatomy | Meet them |
| Clichés | What most do for identity: the same hue family, hero arrangement, mockup angle, type voice | Share at most one |

- A weak survey (fewer than five in-category candidates, or ones you would not show the client) means a better query, not settling. Try the category's other names and nearest neighbours.
- Still thin? Run `scripts/bar.mjs` on two or three leaders' live sites and keep those as the craft bar.

### Name the category's best and pull them by name

- Write down at least three of the best brands in this exact category, not whatever matched the category word.
- Pull them with `list_sites {q}`, `search_designs {q}` or a named `research_design_brief` query.
- When a leader is missing, capture it: `node scripts/bar.mjs --type <landing|product> --sites <domain>,<domain>`. Bot checks are skipped, never bypassed.
- Record the composition class they share in `kept.md`:

| Class | For |
| --- | --- |
| The object owns the frame | Luxury goods, hardware, food, hospitality |
| A product moment at real scale | Software |
| Editorial or type-led | Media, studios, culture |
| A dense working surface | Data tools |

The hero is built in that class with its own idea. A software split (headline left, product boxed right) is never the composition for a physical or luxury product. The critic scores `category_fit` against exactly this.

### Study the middle, borrow from outside, keep a studio reference

- **The body section.** One more search for the page's most important body section (features, pricing, schedule, work, menu) with `search_sections`. Keep one or two; card how each makes one thing dominant and proves the claim.
- **Outside the category.** `borrow_references` with the job your idea must do and the category to leave out. Keep one. The ownable move comes from here and from the idea, never from the category survey.
- **Studio grade.** Save one studio site or a rebrand-film frame with its card, so the critic judges against studio work too.

### Keep only references that are good, whatever their fame

Most library screens are records of what exists, not examples of great design, and the curated set is small. Before a reference is kept, it must earn its place on the pixels:

| Check | Keep when |
| --- | --- |
| Fit | It does the same job for a similar audience, or the job your idea must do |
| Hierarchy | One clear first read; support is visibly smaller |
| Type | Tuned: few sizes, deliberate weights and tracking, nothing default |
| Spacing | A visible rhythm; more space between groups than inside them |
| Material | Real product, photography or art at real size, not filler |
| Identity | Recognizable with the logo covered |

Use the signals the library has, then confirm on the pixels: curated picks (`search_curated_references`) when they cover the brief, the quality prior in `search_sections`, and the AI tags' "why it works". A famous name is not a reason; a weak screen from a famous site is still weak. Conventions may come from any screen, but the craft bar comes only from screens that pass this table.

### Walk every screen of the kept references

A sample of a site lies; its language lives in the whole journey. For each of the two or three references you keep:

1. `get_website_flow` (or `list_sites` then its pages) for every captured page.
2. Each page top to bottom: `get_page`, then `get_reference_context` or `get_screenshot` per section; `get_reference_sequence` for long pages captured in parts.
3. `get_page_motion` for its recording, when it has one.
4. Write `.seenry/refs/<site>.md` as you go: each page, its sections in order, what each does and how, measured type and spacing, motion. Signed media links expire within the hour; notes and ids last.

Then write the synthesis at the top of `kept.md`: what every kept reference does (conventions to meet), what only the best one does (the edge to reach), and what they all do badly (your opening). This costs roughly 75 to 90 credits per build and pays for itself in the middle of the page, where builds most often go generic.

### Write a decision card per kept reference

Save each screen at full size in `.seenry/refs/` (its `inspect` call). One card per file in `kept.md`:

1. The job that screen does.
2. The decision it makes: message order, how it proves the claim, density, rhythm, where the eye lands.
3. Its measured numbers: headline and body size, radius, control padding, brand color.
4. The craft lesson you will meet or beat.
5. The one thing you will not do because it is the category's cliché.

A studio studies to decide, not to trace. Category references set conventions and the craft bar; the outside reference feeds the idea. No section reproduces a single reference's arrangement, imagery treatment or device. The page passes when it reaches their craft class (reference fit 7 or more) and copies none.

### Measure, but never average identity

- `compare_measurements` on two to four kept references (5 credits), or `get_tokens` on one page.
- Use the numbers as floors and ceilings for reading and control craft only: body size and line height, control height and padding, radius proportion, section spacing.
- Display size, headline scale, palette and composition are never averaged. The identity sets them, and going past the measured headline range is expected when the idea calls for it.
- Without MCP, use [benchmarks](benchmarks.md). Mobile references do not establish desktop fit; use `websites` or `sections` for web surfaces.
- Flows, split-page captures, motion and PDF rules: [research](research.md).

## 4. Identity

Follow [design thinking](design-thinking.md) to finish the idea:

- Claim, proof, moment and material.
- At least five ideas from different designer moves: make the claim literal, let them do it now, proof inside the language, before and after, a physical truth, the detail that proves care, take something away, change the unit.
- Score each on truth, clarity, distinctiveness, restraint and buildability. Choose one and carry it through hero, signature, imagery, copy and one detail.

Then turn it into form with [identity](identity.md). The idea is the claim; the identity is how it looks. A claim set in a default layout is still a template.

## 5. Explore three identities, then pick blind

The boards are the exploration; there is no separate sketch round.

- Three boards from the three strongest ideas: `.seenry/explore/a.html`, `b.html`, `c.html`. About ten minutes for all three.
- Each has its own type voice, color world, device and image treatment, and fits one 1440×900 screen with two posters: the hero and the hardest ordinary section.
- They differ in what the visitor sees first (a working product moment, the claim made literal, one photograph, type alone), not only in arrangement.
- At most one follows category conventions as the safe control; one is built on the outside reference.
- None repeats an identity in `~/.config/seenry/history.json`.
- A quiet software product starts from the [quiet kit](../assets/quiet-kit/README.md); its boards differ in imagery, the app screen's idea and copy. House style: the owner's reference standard, chosen over bolder boards the blind pick favored.
- A reference the person shows for register or level (not "design it like X") sets register and level, never the layout one to one: change the hero and at least two sections, because an exact copy fails even when it looks good. A named site follows [named site](named-site.md) instead, where resemblance is the goal.

Then:

1. `node scripts/pick.mjs .seenry/explore/a.html .seenry/explore/b.html .seenry/explore/c.html --brief <brief> --refs .seenry/refs/<a>,<b>`
2. Copy the winner to `.seenry/identity.html` and write `identity.md` from it, folding in what the pick says to take from the others.
3. Record it at once with `node scripts/history.mjs`, so builds running beside this one avoid it.

The winning board's hero poster becomes the first screen. Pick the obvious premium answer before a clever one.

## 6. Motion spec

Read [seenry-motion](../../seenry-motion/SKILL.md). When reference motion matters, play the selected recordings (signed links expire) and pull frames with `python3 ../seenry-motion/scripts/video_frames.py`.

Write `.seenry/motion.md`: for each moving thing, the trigger, what moves, duration, easing or spring, stagger, interruption, reduced motion and its source. Include the signature moment and every in-place change (numbers, filters, add-to-bag).

## 7. Material, in the background

- Start images right after the pick: write the jobs file from the identity's image treatment and run `node scripts/image.mjs --batch jobs.json --variants 3 --brand "<brand>" --background`. It returns at once.
- Build with the final file names. `check.mjs` waits for the images; `image.mjs --wait` waits by hand. A page that waits for its photographs wastes five to twelve minutes.
- Use as many images as the page uses well. Custom artwork made for this brand counts as much as generated pictures: draw marks, devices and illustration systems as SVG, or render them to PNG.
- Every image goes through `photo_check.mjs --page <the page>`, which judges it as it sits on the page: its crop, its edges and how it meets the ground and the type. A good image used badly fails; a modest one used well passes. Imagery rules: [the standard](standard.md) and [seenry-assets](../../seenry-assets/SKILL.md). Illustration: [building](building.md#craft-illustration-and-ambient-visuals).

## 8. Build

- New app screens may start from [the product kit](../assets/kits/product.css). Established products keep their component and motion system.
- Implement `motion.md` with that system, or with [motion.css](../assets/kits/motion.css) and [motion.js](../assets/kits/motion.js) on a plain page. Never load a second runtime only to satisfy this step.
- Components, transitions and the signature moment: [building](building.md).

## 9. Edit like a studio, then check

### Edit

Over-density is now the most common gap between Seenry and studio work.

- Cut the copy by about a third. Every section says one thing once, in one or two short blocks. A section that does not earn its place goes.
- The first screen carries one message: the headline, one supporting line, one action, about 45 words outside the navigation. Facts and secondary links move below.
- Captions are one short line, 18 words or fewer, only where they add what the image cannot say.
- Secondary text gets room: line height 1.5 or more, more space between groups than inside them.
- When in doubt, remove. The board flags crowded first screens, pages over about 700 words and long captions.

### Craft pass at 100%

Studios judge at full size; the critic sees half scale. Render each section at 1440 (`node scripts/review_board.mjs <url> --out $TMPDIR/seenry-craft`, then Playwright for the rest) and fix what only shows close:

- Optical alignment of type to images and rules.
- Consistent spacing steps between and inside sections.
- Headline breaks and rag.
- Crops that cut the subject.
- Controls that do not share one height and radius.

### Run the gate

`node scripts/check.mjs <file or url> --brief <brief> --mode quick`. It checks the artifacts, the board, photographs in place, the blind critic, the detail critic and the motion judge. The critic sees the page while scrolling as well as stills ([scroll_strip.mjs](../scripts/scroll_strip.mjs)): frames at even points down the page, so anything that only goes wrong mid-scroll counts. For a named site, each frame is paired with the reference at the same point of its page.

| Signal | Do |
| --- | --- |
| Blockers | Fix every one before running again |
| Critic and detail-critic fixes | Apply them, except any that shrink the identity's scale, mute its color field or remove its device |
| `PASS` | Critic 9 or more, every motion criterion and reviewed interaction 9 or more, no motion violations |
| `LAST ROUND` | Make the one root-level change it asks for |
| `STOP` in showcase mode | The concept is the problem. Build a different idea from `idea.md` (a different first thing the visitor sees, not a re-layout) and run `check.mjs --new-direction` once. Do not stop to ask: headless sessions cannot answer |

- An edit after the last round gets one more verification round.
- If the second direction also stops, return the better of the two as unresolved, with its failed criteria. A best-so-far result is not a pass.
- Scores are heuristic signals for captured interactions only; untested components stay unverified.
- Native apps use the same gate on simulator output: `node scripts/check.mjs --screens home.png,detail.png,sheet.png --video rec.mov --brief <brief>`, recorded with `xcrun simctl io booted recordVideo rec.mov` or `adb shell screenrecord`.

## 10. Record and deliver

- In `DESIGN.md`: the references kept and set aside, what each proves, what you adapt, which relationships remain unverified, and the "Brand guidelines" section. Credit kept references by name in the report.
- For a second opinion on states and accessibility, use [seenry-review](../../seenry-review/SKILL.md).
- The design sheet is optional and last ([sheet](sheet.md)).

## Tools

| Tool | Does |
| --- | --- |
| [check.mjs](../scripts/check.mjs) | The gate: artifacts, board, photo check, blind critic, detail critic, motion judge |
| [review_board.mjs](../scripts/review_board.mjs) | The page at review scale beside the references, plus about fifty named craft and slop blockers |
| [critic.mjs](../scripts/critic.mjs) | A fresh model scores the page blind against the references and returns ranked fixes |
| [motion_judge.mjs](../scripts/motion_judge.mjs) | Films controls and a rapid double input, measures properties, durations, easing, layout shift and reduced motion |
| [motion_scan.mjs](../scripts/motion_scan.mjs) | Checks every duration, easing and animated property in source against the tokens, in under a second |
| [pick.mjs](../scripts/pick.mjs) | Renders boards at desktop and phone and has a fresh model choose blind |
| [research.mjs](../scripts/research.mjs) | Bounded scripted research, at most 11 credits |
| [bar.mjs](../scripts/bar.mjs) | Captures leaders' live first screens when the library lacks them |
| [image.mjs](../scripts/image.mjs) | Image generation through the Codex CLI, single or batched, in the background |
| [photo_check.mjs](../scripts/photo_check.mjs) | A blind art director scores each image in place on the page (`--page`) and rewrites weak prompts |
| [copy_overlap.mjs](../scripts/copy_overlap.mjs) | Blocks any run of five or more words shared with the named site |
| [scroll_strip.mjs](../scripts/scroll_strip.mjs) | Films the page by wheel at even points, paired with the named site's frames when there is one |
| [screens.mjs](../scripts/screens.mjs), [motion_video.mjs](../scripts/motion_video.mjs) | The board and motion judge for native apps and filmed interactions |
| [audit_page.mjs](../scripts/audit_page.mjs), [system_audit.mjs](../scripts/system_audit.mjs), [optical_audit.mjs](../scripts/optical_audit.mjs) | System and optical audits: rendered sizes, off-grid spacing, ink alignment, off-center icons |
| [palette.py](../scripts/palette.py) | OKLCH ramps and light and dark tokens with WCAG and APCA measured |
| [sheet.py](../scripts/sheet.py), [anatomy.mjs](../scripts/anatomy.mjs) | The optional design sheet |
| [text_collisions.mjs](../scripts/text_collisions.mjs), [control_geometry.cjs](../scripts/control_geometry.cjs), [visual_inventory.mjs](../scripts/visual_inventory.mjs), [token_contrast.py](../scripts/token_contrast.py), [contrast_check.py](../scripts/contrast_check.py) | Focused checks |

Kits: [core components](../assets/components/ui/README.md), [transitions](../assets/components/transitions/README.md), [interaction](../assets/components/interaction/README.md), [signature](../assets/components/signature/README.md), [statement](../assets/components/statement/README.md), [product kit](../assets/kits/product.css), [motion floor](../assets/kits/motion.css), [exploration sheet](../assets/explore.html), [grid overlay](../assets/layout-guides/README.md), [starter tokens](../assets/tokens.css), [DESIGN.md template](../assets/DESIGN.template.md).
