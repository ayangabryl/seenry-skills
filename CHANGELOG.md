# Changelog

## 2.2.0

- **New: seenry-implement.** Builds a finished design so it matches: reads a Figma file (through the Figma MCP), an image or approved canvas screens at the source, maps every value to the project's tokens and components, builds only what the design shows, compares side by side, and reports each element as Matches, Rounded or Deviates, with Unwired, Missing states and Conflicts.
- **New: seenry-states.** One real component in every state its code can reach, on a throwaway route fed at the data boundary with product-shaped fixtures, flipped by a switcher that sits outside the design system (`__state` in the URL, arrow keys, `H` to hide), removed in one delete.
- **seenry-craft:** a layout reference for interfaces that are resized, translated and mirrored (logical properties, what does not mirror, room for longer strings, container queries, scroll padding, pseudo-localisation), a "written to be translated" section in writing, and four new rows in the finishing table.
- Removed two reference files nothing linked to.

### Found by the first Sonnet benchmark

- **Unattended runs keep every step.** With nobody to approve choices, agents skipped the references, the identity step and the options and designed directly. The router now has a "Running with nobody to answer" section: the agent decides and records why, shrinks steps when short of budget, never drops them, and resumes an interrupted run where it stopped.
- **Display tracking has a limit.** Both judges marked down a headline tracked until its words nearly touched. `seenry-identity` now caps tracking by kind of face, and `canvas.mjs verify` reports `tracking` when the space between words falls under 0.18em or tracking passes −0.05em.
- **An empty search is a narrow query.** The research recipe gains a six-step fallback order for the lexical library search.

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
