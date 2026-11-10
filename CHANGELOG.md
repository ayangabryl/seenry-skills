# Changelog

## 2.0.0

Seenry 2 designs before it builds, with the person at the decision points instead of a scoring loop.

- **New: seenry-canvas.** A local design canvas served by one dependency-free Node script. Each flow is a section and each screen a live HTML frame at phone, tablet, laptop or desktop size; `.options` folders hold alternatives. The person pans, zooms, approves screens, picks options and pins comments on elements; `canvas.mjs feedback` returns them to the agent, and feedback goes stale once a screen changes. A screenshot and a single-file mode cover sessions with no local browser. Ships a wireframe kit and a shared token file.
- **Quick by default, guided review, honest options.** Two speeds: `quick` (finished mockups from the first round) and `studio` (all six stages). `round` does the bookkeeping after each round of feedback. A guided review shows one screen at a time at full size with plain questions the agent writes per screen (`seenry-ask`), and options one at a time with a picker, their direction, risk, when they win and what they cost, plus "More like this" for a new round around one. Adapted from Emil Kowalski's prototype skill.
- **Figma for AI agents.** The canvas is the agent's design tool: `render` writes PNGs per screen, device and mode; `tree` prints the layout with each element's box, text, links, specs and the variable behind every style; `verify` fails on sideways overflow, clipped text, contrast in light and dark, small text, unnamed controls, broken links and detached values, and warns on small targets and components drawn differently across screens; `diff` shows what changed since the last render; `compare` checks a built screen against its design with pixel and style differences. All take `--json`.
- **The canvas works like a design team's Figma file.** A generated cover; section status (in progress, ready for review, ready for dev); Foundations read live from a tiered `tokens.css` with light and dark modes, text styles, effects, grids and self-hosted fonts; component sheets; named prototype flows with Present mode; Dev Mode inspection showing each element's bound variables; `data-spec` handoff annotations; approvals that last until a screen changes; `resolve` and `archive` to keep decisions with their reasons; a change log; `check` for detached values; `handoff` for `HANDOFF.md`; and shared design-system libraries that many products link to.
- **New: seenry-craft.** Exact values for type, spacing, radius, surfaces, color roles, icons, hit areas and states, with a grep-style finishing table. The type, color, system, alignment, optical, craft, components, accessibility, mobile web and writing references moved here from `seenry`.
- **seenry, rewritten.** About 8 KB instead of 18 KB, and about a fifth of the reading for a new page. Brief from real material, name the default and leave it, anchor each option to a different real reference, design every screen on the canvas, pick the look, build once, check once. Proof is never invented.
- **seenry-motion:** a fluid interaction guide (response on press, velocity handoff, interruptible springs, materials, reduced motion), adapted from Emil Kowalski's MIT-licensed Apple design skill.
- **seenry-apps:** flows are designed on the canvas and the person picks the signature screen.
- **Breaking:** the new-page flow no longer runs `check.mjs`, `pick.mjs` or the blind critic, and the identity, flow, anti-slop, standard, premium, art direction, design thinking, new-site, exploration, pages and recommendation references are removed. The scripts remain for existing projects that call them.
- **Breaking:** removed the seenry-branding and seenry-decks skills. Decks and brand materials are no longer part of the Seenry library, and the tool guide follows the Seenry MCP 0.2.0 contract, which drops the branding and decks families.

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
