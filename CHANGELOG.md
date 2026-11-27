# Changelog

## 3.8.0

### Setup

- **The reference library in every agent at once.** `canvas.mjs library` with no `--agent` finds the agents on the computer and adds the Seenry MCP server, with this computer's key, to each one it can configure safely, one line per agent: added, already set, left as it is, or could not, with the step to do by hand. Claude Code goes through `claude mcp add`. Codex (`~/.codex/config.toml`), Cursor (`~/.cursor/mcp.json`), Antigravity (`~/.gemini/config/mcp_config.json`), Gemini CLI (`~/.gemini/settings.json`), GitHub Copilot in VS Code and the CLI (`~/.copilot/mcp-config.json`) and Kimi Code (`~/.kimi/mcp.json`) get the server in their own user-level file, as their docs describe. It writes only home-level files and never a project's. Other servers are kept, a file is backed up before it changes (mode 0600), a new file is created with mode 0600, a file with comments or an unknown layout is left alone, a rotated key is swapped in place, and a second run changes nothing. The key is never printed. `--agent <id>` still sets up one agent.
- **`canvas.mjs update`.** One command from any agent, with no flags: it runs `npx skills update -g -y` (Seenry's skills and the companions already installed), prints each change from old to new version, and restarts a running canvas and its sync on the new code at the same address. Screens and feedback are left as they are. When the update fails, it says so and restarts nothing.
- **SETUP.md** connects the library with `library` alone and adds a one-paste update prompt. The installer, run without `-a`, already installs for every agent it detects.

## 3.7.0

### Companions

- **Seenry works beside other authors' skills.** Emil Kowalski's skills, Jakub Krehel's `better-*` skills, transitions.dev and Libraries.dev can be installed next to Seenry from their own repositories; the README gives the commands. [`references/companions.md`](skills/seenry/references/companions.md) names the skill that leads each step and what the companion adds: Seenry keeps the brief, canvas, references, `MOTION.md` and the checks, and a companion does the one job it is best at. One skill writes each thing; `break-ui` and `seenry-break` never both run, and `ask-emil` is never invoked inside a Seenry run. A companion that is not installed never blocks: the Seenry skill covers the step. Nothing from the companions is copied into this repository.
- **Pointers where the overlap is.** `seenry-motion`, `seenry-craft`, `seenry-libraries` and `seenry-review` each name their companions and say who leads.

### Practices

- **[`references/design-practices.md`](skills/seenry/references/design-practices.md).** What pages were sent back for, as checkable rules: one hue per page, no colour field behind pictures, text on photos that passes contrast, swaps that move only the content, blur only on the changing words, clean example work, one headline and one picture per screen, little text on marketing pages, real proof only, official marks on sign-in buttons, and checks at 1440, about 1057 and 390 and in dark mode.

### Canvas

- **The canvas shows the current round.** When a new round replaces options nobody picked, the agent archives the old ones with `archive <section>/<screen> --reason "…"`, so the person sees only the current round and the approved screens. Screens are named by what they are, never by round or version.
- **The canvas wears Seenry's Calm look.** Its own interface (board, toolbar, section and screen names, pick buttons, comments, status, archive) now uses one neutral ink, Inter at medium weight (OFL, shipped in `assets/fonts` and served by the canvas, so nothing loads from a font host), pill buttons, statuses as short words in pills and a 2 px ink ring on the picked screen, in light and dark. Archived screens fold behind one "Archived (n)" line at the foot of the board. The screens themselves render untouched.
- Canvas: arrows between screens come only from links in the content, not from a shared sidebar, header or tab bar, so the board no longer fills with lines.

## 3.6.1

### Taste

- **A ban the person switched off is allowed.** Their taste file lists it under Allowed, and the bans now say so. The skill also says how to use the file: Never adds to the bans, the named sites and references are opened before choosing a direction, and the report says what was taken from it.

### Canvas

- **`link --code <setup code>`.** A setup prompt copied inside Seenry carries a one-time code, so the agent links the computer at once with no approval in the browser. The code works once, for 15 minutes; used or expired, `link --start` still works.

## 3.6.0

### Taste

- **The agent reads the person's taste.** On a computer linked to their Seenry account, `start.mjs` (the first call of every task) prints their taste file: what they chose, what they never want, and the sites and images they love. The project and the brief still come first. `sync.mjs taste` prints it on its own; `--no-taste` leaves it out. Nothing waits on it: unlinked, switched off or offline, the task starts as before.

### Canvas

- **One approval links the computer and the reference library.** `link` now asks for the library too. When a Seenry Pro account approves it, this computer gets its own access key, kept in the config folder (mode 0600) and never printed. `library --agent claude-code` adds the MCP server to Claude Code itself; for other agents it says where the key is and what to add.
- **`link --start` and `link --finish`.** An agent can show the link and code at once instead of sitting on a command that waits ten minutes: `--start` prints them and returns, `--finish` completes the link (exit 4 while it is still waiting for approval).
- **`link` no longer gives up on a hiccup.** A dropped connection or a server error while it waits is retried until the code expires.
- **Linking again replaces the old link.** The computer sends its current token, so its canvases stay with it and nothing is duplicated online. `unlink` also forgets the library key.

## 3.5.0

### Canvas

- **The side pane is set in Marks.** It opens with Seenry's mark, the project and its section (a menu when there are several), the screens as tabs with their status (numbered keys for options), the current status, and a grid button. Below that, a widths row (1440, 834, 390 and the scale), the frame cut to the page's own height, and one action row whose main button becomes Send while notes wait. Switzer loads from Fontshare's own link and is never bundled; offline the canvas falls back to the system face. Graphite and paper white neutrals in both modes.
- **No prompt box.** In the pane and on the board, a click on a screen opens a one-line note pinned to what was clicked, numbered until sent. The board's bar keeps its tools, the device size, the count and Send.
- **All screens inside the pane.** The grid button opens every screen as a tile with its width and status; a tile opens it, and Back (or A) returns, so the pane never strands you on the whole board.
- **Working moves like T3 Code's.** The dashed ring turns and the word counts the time (Working 4s, 1m 20s, 1h 2m); reduced motion holds it still.
- **`problems` ignores hidden text.** Text inside a parent hidden at that width (a nav hidden on phones) is no longer reported as text with no room.

### Libraries

- **asciify-engine** for ASCII, dither and print treatments (halftone, stipple, engraving, crosshatch, woodblock, risograph) of a real image, video or GIF, with a new mismatch for faking them by hand.

## 3.4.0

### Canvas

- **Status the way T3 Code shows a thread.** Every screen shows one 12 px icon and one short word, chosen by priority: Working while Seenry builds it, Approval while it waits for your review or pick, Waiting (grey) once you sent it back and Seenry has not started, Done once approved. Frame labels, the screen list, the pane's tabs and the working pill all use one function, `seenryStatus`. The icons are T3 Code's (MIT), drawn from Lucide (ISC); credits are in `NOTICE`. Screens you sent back move from Needs you to a new Queued for Seenry group. The review data model is unchanged.

## 3.3.1

- **`start.mjs` runs through a symlinked install.** It compared the script path without resolving links, so the default symlink install printed nothing on the first call of every task.

## 3.3.0

### Style briefs

- **A shelf of sixteen style briefs.** `skills/seenry/references/styles/` holds sixteen visual identities (image interlock, product stage, dark technical, editorial type, clinic warm, place photographic and more), each with the same nine headings: identity, type, colour roles, imagery, how image and interface meet, below-the-hero moves, phone, never, seen in. Each is at most 480 words, names no section order and cites the Seenry library references it was drawn from. Its Imagery block holds two image jobs, a hero and a returning motif; `art_prompt.mjs` gains `extends` so the motif inherits the hero's palette, grade, light and texture, and refuses a job that still holds a `<…>` placeholder.
- **One first call.** `scripts/start.mjs "<brief>"` prints the two or three styles whose keywords the brief uses, the bans and the nine steps, and nothing else; `--style <slug>` prints one brief whole. Matching is keyword overlap, with no model call. `SKILL.md` makes it the first call of every task.
- **Bans in one list.** `references/bans.md` gathers the habits that make a page read as generated (a card around everything, the default section stack, eyebrow labels, glow blobs, icons in tinted circles, invented proof). `SKILL.md`, the loader, `unslop.md` and `imagery.md` point to it.

### Canvas

- **Patch, never regenerate.** `seenry` and `seenry-canvas` both say to fix a screen with an edit to the part that is wrong. The canvas feed now reads "Rewrote <screen>" when one save changes every part of a screen that already had two or more.
- **Three ways to answer More like this.** Feedback for a More like this request lists three fixed modes, one option each: same style with a new layout, a new style with the same content, and breaking one rule the option obeys that nobody asked for. `canvas.mjs` and `sync.mjs` send the same three.

### Final check

- **Five blockers, ranked.** `check.mjs` prints the five blockers that matter most (the missing study first, then the page's level, then visible craft, the rest of the board, motion details), each on one line with its fix, and keeps every section in `review/blockers.txt`. `--all` prints everything as before. `review_board.mjs` writes each blocker to `board.json` as a ranked item.

### Canvas live build

- **Built in place, not reloaded.** The canvas shows only what the agent has written: a planned screen is an empty page with Seenry's cursor waiting, and no part is drawn before it exists. Each save is patched into the open document: the new part fades in where it was written and Seenry's cursor moves to it. No white frame, no zoom change mid-build, no scroll jump; with reduced motion nothing moves. A save that changes the `<head>` still reloads, out of sight, keeping the scroll position. Recorded on a scripted shell plus five parts 2.5 s apart: a save reached the screen in about 60 ms (was 0.1 to 1.1 s), each part was fully shown in about 60 ms (was 0.5 to 5.5 s while the cursor typed it in), and the camera moved in 68 frames instead of 429.
- **Pushed, not polled.** The server watches the canvas folder and pushes an event on every save (`/events`); the page falls back to polling only when the stream is down.
- **Layout problems on every save.** The canvas checks each save at the screen's width and at 390 for sideways overflow, text cut off by its box, collapsed parts, images that did not load and overlapping text, outlines each problem on the screen and labels the frame. `canvas.mjs problems [screens]` prints the same short list for the agent (rendering headless when no canvas has checked that save) and exits 1 on any.
- **At home in an agent app's pane.** In an Electron webview, a frame or `?embed=1` the canvas follows the host's light or dark setting (screens too, until the person presses D), drops its own title row, starts with the screen list closed and shows one screen at a time below 960px. `?theme=` fixes a theme. `open` in T3 Code now opens `/?embed=1`. Tested in T3 Code's preview pane; the Claude app and Codex app panes are untested.

### Model-agnostic helpers

- **The host's CLI, the person's model.** `model_cli.mjs`, and every critic and judge that uses it (`critic.mjs`, `judge_pair.mjs`, `photo_check.mjs`, `pick.mjs`, `detail_critic.mjs`, `choreography.mjs`, `motion_*`, `film_critic.mjs`), runs on the agent app's own CLI (Claude Code inside Claude Code, Codex inside Codex) and passes no model, so the CLI uses the person's selected or default model. The built-in Codex model list and its hard-coded fallback ids are gone, and so is the fixed reasoning effort. `image.mjs` no longer probes models. `independent_flow_gate.py` carries the model from the person's Codex config. `SEENRY_MODEL` (or `SEENRY_CODEX_MODEL`, `SEENRY_CLAUDE_MODEL`) and `SEENRY_CRITIC_EFFORT` name one explicitly.

## 3.2.0

### Fast path

- **The person is the judge.** The default path is brief, three references looked at, one idea line per direction, a generated hero image per direction, hero-only sketches, the person's pick, then the full page, the build and one `check.mjs` run. First sketches are due on the canvas within 5 minutes and no step loops more than twice. Three eval rounds showed the written teardown, the pair judge and per-section loops added minutes without raising a page's level.
- **Scripts hold what was skipped.** `canvas.mjs verify` blocks a sketch with no `<meta name="seenry-idea">` line or no generated or own image in its hero (a flat block or a plain gradient is measured and refused), and a full page whose hero image or `data-seenry-motif` never returns below the hero; `check.mjs` blocks the same on the built page. Each message gives the command that fixes it.
- **No model judges by default.** The teardown, the pair judge, the photo check and the blind critic run only with `--studio`, or in an unattended run (`verify --judge`, a recorded `round --unattended`). `verify --quick` is now simply `verify`. A default `check.mjs` run ends `CHECKS PASS` with no score; a pick on the canvas counts as the go-ahead to build.
- **Three times, kept.** `open`, `round` and `handoff` print the time to the first sketch, to the pick and to the finished build, and `canvas.json` keeps them as `timing`. `image.mjs --template` prints a job to fill in and `--wait` returns within 100 s.
- **Eval.** `evals/baseline/run.mjs --director` runs with a person at the canvas (`direct.mjs watch`, `shots`, `pick`), records the timings and generated images, and `--without-example` removes the worked example from a run on its own job; `judge-cross.mjs` pairs a round against fixed comparators.

## 3.1.0

### Canvas online

- **Sync to a Seenry account.** `scripts/sync.mjs` links a machine with a code approved in the browser (token in `~/.config/seenry`, mode 0600, never in the project), pushes only changed files, and pulls feedback sent online into the same files `wait` reads, no more often than the account's plan allows (`pollSeconds`); a plan limit stops the watch with the server's message. `canvas.mjs open` starts `sync.mjs watch` by itself once the machine is linked; `canvas.mjs link` and `canvas.mjs sync …` pass through to it, and `stop` ends both.
- **Share means something.** Linked, Share copies the canvas's Seenry link and the panel says "Synced to Seenry"; unlinked, a popover says the address works only on this computer and how to link.
- **Workbench canvas.** The canvas is redesigned as a workbench: a screen list grouped by what needs the person, a composer that turns a click on any element into a chip, and the decision first. `open` detects T3 Code, the Claude app, Codex, Cursor, VS Code and cloud sessions and prints the exact call for the app's pane, and `wait` returns within 100 s with a line to resume.
- **A quieter canvas.** Approved sections leave the canvas while a decision is open and stay one click away in the list; sent comments are pinned, numbered, on the element they name; frame captions come from a short `seenry-caption`, or the axis up to its first colon or comma.
- **Always on.** `install.py --project <dir>` writes a short Seenry index between `seenry:start` and `seenry:end` markers into the project's `AGENTS.md`, and into a `CLAUDE.md` that does not import it, so agents load the skills without being told; `--instructions-only`, `--remove-instructions` and `--global-instructions` cover the rest. `evals/always-on` measures the difference.

### Kits removed

- **No bundled component code.** Removed the Core UI, Transitions, Interaction, Statement and Signature kits, the unreferenced `assets/kits/` and `quiet-kit/`, their 110 tests and fixtures, and the three CI jobs that ran only them. Components now come from a maintained library through `seenry-libraries`, or, with no build step, from the project's own `components.css`. `building.md` says so.

### Canvas

- **seenry-canvas 2.2.0: sketch first, extend the winner.** Options are drawn as one-screen sketches marked `seenry-fidelity` `sketch`; only the picked one is extended to a full page, and `round` keeps its section in progress until it is.
- **Shared components in one file.** `components.css` holds every control used on two screens, with one `@component` comment line each; the canvas generates the Components sheet from it live, `check` warns when a screen redefines one of its classes, and `handoff` lists each component with its classes.
- **The person watches the work arrive.** `plan <file>…` shows named screens as placeholders that fill in as each file is written.
- **Faster checks.** `verify --quick` runs the rule checks without pairing or judging; the full `verify` runs once per screen version, and the skill stops after two rounds of self-review.
- **Speed is a number.** `init` starts a clock, and the first time options are shown `open` prints the time and keeps it in `canvas.json` and `HANDOFF.md`.
- **Opens on the decision.** The canvas lays out open option sets first and opens on them, side by side; the cover, Foundations and Components move below.
- **seenry-canvas 3.0.0: watch the agent build, live.** The agent writes a screen's shell and then adds one part per save, each named with `data-seenry-part`. The canvas swaps each version in without a flash, and Seenry's cursor (the Seenry eyes, with the part's name) goes to the new part, builds it up and types its text; only what was added moves. Follow glides the canvas to the part being built until the person pans or zooms. The canvas is the default view again, in Seenry's own type, materials and mark; the List view remains for side panes. A planned screen is an empty frame with the cursor waiting at its corner, and the feed reads "Added Plan cards to Pricing".
- **Watch the agent work.** Commands post what the agent is doing to a live feed (`say` adds its intent), the screen it works on carries an Agent tag, the server notes each screen as it is written, and Follow (the Agent button, or A) moves the view to wherever the agent is.
- **Stays in the app.** Inside T3 Code, the Claude app or the Codex app, `open` prints the address for the app's preview pane instead of opening a tab, and below 820px the canvas becomes a list of option cards with Pick, More like this, Approve and Comment, so it fits a side pane (L switches views).
- **Redesigned canvas UI:** a toolbar with Move, Comment and Inspect tools, a layers list, a right panel that shows your decision when nothing is selected, and sections drawn as framed regions.

### Motion

- **seenry-motion 3.0.0, rebuilt around a decision, a table and a script.** `SKILL.md` opens with whether the thing should move at all, then one table of exact values per element (enter, exit, curve, starting state) taken from the measured production specifications, numbered build steps, the `MOTION.md` format and a stop gate. The curves are now the starter tokens' (`cubic-bezier(0.16, 1, 0.3, 1)`, `cubic-bezier(0.4, 0, 0.2, 1)`), so the skill, `tokens.css` and `motion_scan.mjs` agree.
- **Recipes for the common set** in two files: press, menu, tooltip, dialog, sheet, toast, tabs with a sliding indicator, accordion, page and shared element; number change, icon swap, checkbox, toggle and success check, skeleton to content, list add, remove and reorder, error shake, AI thinking and streaming text, staggered group, scroll reveal, hold to confirm. Each says when to use it and when not, gives CSS that runs with no build step, the library to take through `seenry-libraries` when there is a framework (Base UI, Sonner, Vaul, NumberFlow, Motion) with its settings, what happens on interruption, and the reduced-motion state.
- **`scripts/motion_score.mjs`** scores a built page or a source tree and prints the measured and the allowed value per finding: `ease-in`, a duration over the limit for the element type, `transition: all`, entrances from `scale(0)`, layout properties, hover motion outside `(hover: hover)`, more than one infinite loop, no reduced-motion branch, and with `--browser` any movement a key press starts. It runs the `MOTION.md` gate when the `seenry` skill is installed.
- **Choreography has a value per relationship:** attached, together, swap in place, newly exposed content, removal, two stagger sequences (0, 40, 70, 90ms and 0, 80, 140, 180ms), cause then effect, accent on a lead.
- **Cut:** 32 reference files and a `patterns/` folder became 12, each with a "Read when" line. Removed assets that duplicated a maintained library, the platform or each other: the action menu, modal surface, directional stage, expanding card and geometry transition, selection surface, count pop, icon swap, the vendored Morphicons runtime and its adapter, the Lottie toggle, notification state, anchored surface, fit interaction and scroll scene adapters.
- **Kits are a fallback.** `building.md` says the bundled component and transitions kits are for pages with no build step; with a framework the agent picks through `seenry-libraries`.

### Libraries

- Catalog: seven MIT React packages for AI-interface effects (`border-beam`, `thinking-orbs`, `voice-glow`, `liquid-gooey`, `bot-avatars`, `metal-fx`, `img-fx`), each checked on npm.

## 2.1.0

### Identity

- **New: seenry-identity.** Type and color before any screen, the way a brand studio works: one idea in a line, the clichés named, four typefaces that read the idea differently, specimens with the real copy at 160px down to captions, three color studies from real photographed sources with ground, ink, dominant and one accent at their real proportions, the person's pick, then `tokens.css`. A catalog of the best open-source (Inter, Inter Tight, Geist and Geist Mono with italics, Open Runde, Nunito, Figtree, Instrument Sans, Bricolage Grotesque, Newsreader, Source Serif 4 and more), Fontshare (Switzer, Satoshi, General Sans, Zodiak, Erode and more) and premium foundry faces (Klim, Grilli Type, Dinamo, Pangram Pangram, Commercial Type and others), each checked against its source, with pairing and tuning rules and what is overused.
- **`identity.mjs`**: `fetch` downloads WOFF2 files from Fontsource or Fontshare and writes `fonts.css` and `fonts.json` with each family's license and source; `info` reports license, weights and italics; `specimen` sets the real lines per typeface and says when a family has no italic; `study` builds a color study that picks readable text on each filled color and warns when an accent passes contrast with neither ink nor ground.
- **Compose by default, trace only to replicate.** Options take one principle from each of two or three references and build their own layout; copying one reference's structure with new colors is a reskin unless the person asked to replicate.
- **Curated open foundries:** Open Foundry, Collletttivo and Velvetyne faces with their kind, license and use, plus Use & Modify as a discovery source, and **recipes by product** with how to set each face at display, heading, body and UI sizes. `identity.mjs fetch --url` takes a foundry's font file, zip or GitHub archive, keeps its license file and writes the right `@font-face` format.
- **Color the way the best teams build it:** Albers' relativity, perceptual spaces (Stripe, OKLCH), generated themes from a few inputs (Linear), a job per step (Radix), tonal roles (Material 3), tinted greys (Refactoring UI), lightness before hue, and `identity.mjs ramp`, which turns one color into twelve OKLCH steps for light and dark with the contrast of its text steps.
- **Choosing type on evidence:** a sourced method (jobs before names, body text first, the hardest size, coverage before feel), what legibility research supports and what is folklore (no serif-versus-sans advantage; compare at matched x-height), brief adjectives translated into drawn features, and a quality block on every specimen: confusable letters, kerning pairs, rhythm, 12px and 14px text, tabular figures and diacritics, followed by a pressure test of the finalists on a real screen.
- The canvas shows `00-identity` as **Identity studies**, pickable like options and exempt from detached-value checks; contrast is still verified.

### Libraries

- **New: seenry-libraries.** Picks the maintained library for a UI job before anything is hand-built: platform first, then a catalog of about 115 packages by job, each with its maker and use, the mismatches to catch, and license and maintenance flags. `check.mjs` reads version, release date, license and weekly downloads from npm and flags stale, deprecated or unusually licensed packages. The Sonner guide moved here.

### Lines

- **seenry-craft:** a lines reference: a line has one of three jobs, one direction per group, never boxing text, exactly as wide as what it rules, column rules instead of dividers. `canvas.mjs verify` now warns on a rule running past its content, lines in both directions, and ruled columns starting at uneven steps.
- **seenry-canvas:** the person who asked always sees the canvas, in cloud sessions too; `resolve` handles options drawn for several devices.

### Found by testing a dense app screen

- A project list built in the picked tokens looked right with demo data and broke ten ways under `seenry-break`'s worst case (unescaped HTML, `undefined` in an avatar, a three-line badge, raw amounts and dates). The skill's fix table resolved all ten. Two gaps closed: break's table gains rows for out-of-range meters, bad dates and raw amounts, and craft's finishing table now catches raw numbers and dates, unescaped data, missing `min-width: 0`, capital or monospace labels, and bad lines in the first draft.
- The canvas judges settled screens: finite entrance animations are finished before a screenshot or a contrast check.

### Seenry 2.1 core

A test run showed that references alone did not stop generated-looking pages: the agent turned each reference into a description and rebuilt it from memory, and the model's average came back. Tracing the reference's measured structure did stop it. This release builds the flow around that, and covers every part of Emil Kowalski's skills in Seenry's own words.

- **Trace, then transform.** Each option, and each section of a long page, traces one real reference screen: its grid, proportions, type scale, image share and density are copied at measured values, and only the identity (content, type, color, imagery) changes. `.seenry/trace.md` records each trace. Neighboring sections take different references, so a page never repeats one composition.
- **New canvas command: `pair`.** A screen beside the reference it traces, at the same width and crop, to check by eye that the structure held.
- **Work first.** Products whose work is the point (agencies, studios, portfolios, shops) show it first; stand-ins are placeholders, listed as assumed, never shipped as the person's work.
- **New: seenry-break.** Realistic worst-case data behind a Demo / Worst case toggle, failure signatures with cause and fix, a choice per field between wrapping, truncating and clamping, and a catalog of breaking values.
- **New: seenry-subtract.** Only deletes or reduces: motion that fails the frequency and purpose gate, and the parts of a design that read as generated. Checks removal hazards and cleans up what deletions orphan.
- **New: seenry-audit.** Recon, an audit in ten categories, every finding confirmed at `file:line`, then self-contained plans in `plans/` that a cheaper model executes; `execute` and `reconcile`.
- **seenry-motion:** the add and remove gate, choreography (cast, relate, timeline), frame performance, a motion vocabulary, component techniques, and the gesture phases, thresholds and Motion drag props in `fluid`. SKILL.md fell from about 3,000 to 1,600 words; detail moved to references.
- **seenry-review:** ten motion standards, a flag-on-sight list, a fix order, a Before / After / Why table and a Block or Approve verdict.
- **seenry-apps:** React Native and Expo motion (Reanimated 4, worklets, `scheduleOnRN`, native stack, haptics) and modern Swift 6. SKILL.md fell from about 5,000 to 1,250 words; the look and platform detail moved to references unchanged.
- **seenry-craft and seenry:** the full mobile web baseline (input keyboards, theme color per scheme, testing on hardware), the library list, and a Sonner guide.
- Attribution for every adapted part is in `skills/seenry/references/sources.md` and each skill's `licenses/NOTICE.md`.

## 2.0.0

Seenry 2 designs before it builds, with the person at the decision points instead of a scoring loop.

- **New: seenry-canvas.** A local design canvas served by one dependency-free Node script. Each flow is a section and each screen a live HTML frame at phone, tablet, laptop or desktop size; `.options` folders hold alternatives. The person pans, zooms, approves screens, picks options and pins comments on elements; `canvas.mjs feedback` returns them to the agent, and feedback goes stale once a screen changes. A screenshot and a single-file mode cover sessions with no local browser. Ships a wireframe kit and a shared token file.
- **Skills written the way agents read them.** `seenry` and `seenry-canvas` follow one shape: a third-person description that says what the skill does and when to use it, an operating posture, a table of the exact words used, hard rules, numbered steps that each end on a "Done when", what to do for common requests, and tone. Detail moved into reference files one level deep (`commands`, `file`, `wireframes`), so the two skill files fell from 30 KB to 18 KB.
- **Quick by default, guided review, honest options.** Two speeds: `quick` (finished mockups from the first round) and `studio` (all six stages). `round` does the bookkeeping after each round of feedback. A guided review shows one screen at a time at full size with plain questions the agent writes per screen (`seenry-ask`), and options one at a time with a picker, their direction, risk, when they win and what they cost, plus "More like this" for a new round around one. Adapted from Emil Kowalski's prototype skill.
- **Figma for AI agents.** The canvas is the agent's design tool: `render` writes PNGs per screen, device and mode; `tree` prints the layout with each element's box, text, links, specs and the variable behind every style; `verify` fails on sideways overflow, clipped text, contrast in light and dark, small text, unnamed controls, broken links and detached values, and warns on small targets and components drawn differently across screens; `diff` shows what changed since the last render; `compare` checks a built screen against its design with pixel and style differences. All take `--json`.
- **The canvas works like a design team's Figma file.** A generated cover; section status (in progress, ready for review, ready for dev); Foundations read live from a tiered `tokens.css` with light and dark modes, text styles, effects, grids and self-hosted fonts; component sheets; named prototype flows with Present mode; Dev Mode inspection showing each element's bound variables; `data-spec` handoff annotations; approvals that last until a screen changes; `resolve` and `archive` to keep decisions with their reasons; a change log; `check` for detached values; `handoff` for `HANDOFF.md`; and shared design-system libraries that many products link to.
- **New: seenry-craft.** Exact values for type, spacing, radius, surfaces, color roles, icons, hit areas and states, with a grep-style finishing table. The type, color, system, alignment, optical, craft, components, accessibility, mobile web and writing references moved here from `seenry`.
- **seenry, rewritten.** About 8 KB instead of 18 KB, and about a fifth of the reading for a new page. Brief from real material, name the default and leave it, anchor each option to a different real reference, design every screen on the canvas, pick the look, build once, check once. Proof is never invented.
- **seenry-motion:** a fluid interaction guide (response on press, velocity handoff, interruptible springs, materials, reduced motion), adapted from Emil Kowalski's MIT-licensed Apple design skill.
- **seenry-apps:** flows are designed on the canvas and the person picks the signature screen.
- **Breaking:** the new-page flow no longer runs `check.mjs`, `pick.mjs` or the blind critic, and the identity, flow, anti-slop, standard, premium, art direction, design thinking, new-site, exploration, pages and recommendation references are removed. The scripts remain for existing projects that call them.
- **Breaking:** removed the seenry-branding and seenry-decks skills. Decks and brand materials are no longer part of the Seenry library, and the tool guide follows the Seenry MCP 0.2.0 contract, which drops the branding and decks families.

## 0.1.0

First public preview. Eight agent skills that design and build at studio quality, backed by measured evidence from the Seenry MCP 0.1.1 tool contract.

- **seenry:** web pages and components on a strict system: a brief, research in real captured screens, three explored first screens picked blind, a build on a proven product and motion floor, and a check that blocks common AI-template patterns, then a blind critic and a motion judge.
- **seenry-apps:** native-feeling mobile screens and flows, researched in real App Store screens.
- **seenry-assets:** license-clear photos, icons and fonts, or generated images, with provenance for every file.
- **seenry-review:** ranked, fixable findings for a screen, a UI diff or a single component, including accessibility.
- **seenry-motion:** decides whether something should animate, then the property, curve, duration, interruption and reduced-motion behavior, with tested modern-CSS recipes and runnable assets.
- **seenry-branding:** identity research and project brand guidelines.
- **seenry-decks:** presentation research with slide order and narrative roles.
- **seenry-video:** product films as code. It studies launch films in Seenry, writes the shot list on a bar grid, renders a seekable HTML film frame by frame, mixes designed sound to −14 LUFS in two passes, checks every on-screen claim against a sourced ledger, and runs a blind film critic that sees motion and scores against the reference films.

Licensed under the Apache License 2.0; see NOTICE.
