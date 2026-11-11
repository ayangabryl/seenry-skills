# Seenry skills

Agent skills that make an AI work like a design studio. The agent designs every screen first on a local canvas, the person reviews and picks, and only then is the product built, with exact craft values and real references from the optional Seenry MCP.

| Skill | Use it for |
| --- | --- |
| [seenry](skills/seenry/SKILL.md) | Start here for any design task. The flow from brief to built product, and which skill to load when |
| [seenry-identity](skills/seenry-identity/SKILL.md) | Type and color before any screen: the idea, the clichés named, typefaces from the best open-source (Inter, Geist, Open Runde, Nunito, Bricolage, Newsreader), Fontshare and premium foundries, specimens and color studies with the real copy, fonts fetched with their licenses |
| [seenry-canvas](skills/seenry-canvas/SKILL.md) | Figma for AI agents: the agent designs screens on a local canvas, renders and reads them, verifies contrast, overflow, targets, links and token use, and compares the build with the approved design. A person can review on the same canvas |
| [seenry-craft](skills/seenry-craft/SKILL.md) | Exact values for type, spacing, radius, shadows, color roles, icons, hit areas and component states |
| [seenry-motion](skills/seenry-motion/SKILL.md) | Whether something should move, then how: curves, springs, gestures with velocity, choreography, frame performance, the names of effects, with runnable assets |
| [seenry-review](skills/seenry-review/SKILL.md) | Auditing a screen, reviewing a UI diff, a strict motion review with a Block or Approve verdict |
| [seenry-break](skills/seenry-break/SKILL.md) | Breaking a component with realistic worst-case data behind a Demo / Worst case toggle, and the fix for each break |
| [seenry-subtract](skills/seenry-subtract/SKILL.md) | Removing motion and decoration that do not earn their place; only deletes or reduces |
| [seenry-audit](skills/seenry-audit/SKILL.md) | Surveying a whole app into ranked findings and self-contained plans another agent or a cheaper model can execute |
| [seenry-assets](skills/seenry-assets/SKILL.md) | License-clear photos, icons and fonts, generated images when an image model is available, provenance for every file |
| [seenry-apps](skills/seenry-apps/SKILL.md) | Native-feeling mobile screens and flows, Expo and Reanimated motion, modern Swift |
| [seenry-video](skills/seenry-video/SKILL.md) | Product films as code, from studied references to a mastered MP4 |

## How it works

1. **Brief from real material.** Real copy, prices, screenshots and photographs. Proof is never invented; anything assumed is listed for the owner.
2. **Build the default, then leave it.** The agent builds the page any model would make for this brief and puts it on the canvas, so every option can show how it differs.
3. **Compose from real references.** Ten or more real screens from the Seenry library, judged on a contact sheet. Each option, and each section of a long page, takes one principle from each of two or three references, with the numbers, and builds its own layout around the product's idea; copying one reference's structure happens only when the person asks to replicate. `canvas.mjs pair` puts a screen beside each reference to catch a reskin. Words, logos and images are never taken.
4. **Type and color from an idea.** `seenry-identity` names the clichés, sets specimens of open-source, Fontshare and premium typefaces with the real copy, builds color studies from real sources, and writes the pick into `tokens.css` with each font's license.
5. **Design every screen on the canvas.** `node skills/seenry-canvas/scripts/canvas.mjs open` serves a pan-and-zoom canvas on `127.0.0.1`. Each flow is a section, each screen a live HTML frame at phone, tablet or desktop size, and options sit side by side. The person approves screens, picks options and pins comments on elements; the agent reads them with `canvas.mjs feedback`.
6. **Pick the look, then design every screen in it.** One `tokens.css` that every screen links, so a change updates them all, and the same file moves into the product.
7. **Build once and check once.** Craft values from `seenry-craft`, motion from `seenry-motion`, worst-case data from `seenry-break`, then a rendered audit at 1440 and 390 and a side-by-side with the approved screens. No scoring loop and no second model.
8. **Take away, then plan.** `seenry-subtract` removes what does not earn its place; `seenry-audit` turns a whole app into plans a cheaper model can run.

The canvas is organized the way design teams organize a Figma file: a generated cover with each section's status, Foundations read live from a tiered `tokens.css` (primitives, semantic variables with light and dark modes, text styles, effects, grids, fonts), component sheets with every variant and state, flows that play as a prototype, Dev Mode inspection that names each element's variables, handoff specs, an archive of decisions with their reasons, a change log, and `HANDOFF.md` for whoever builds it. A design system can be its own canvas that many products link to.

The agent sees its own work with `render` (PNGs at each device and mode), `tree` (the layout with the variable behind each style), `verify` (rendered checks that fail on real problems), `diff` (what changed since the last round) `pair` (a screen beside the reference it traces) and `compare` (the built product against its design, pixel and style differences). Every command can print JSON.

The canvas needs only Node: no packages, no account, no Figma. The seeing commands use Playwright. It works with Claude Code, Codex, Cursor or any agent that can run a command. In a cloud session it writes a screenshot of the canvas instead, or a single HTML file that opens from disk.

## Measured results

These results measured Seenry 0.1, before the canvas. A blind benchmark on October 7, 2026 compared Seenry with Seenry MCP against two public design skills ([Emil Kowalski](https://github.com/emilkowalski/skills), [Jakub Krehel](https://github.com/jakubkrehel/skills)) and no skill. Each condition ran Codex (Sol 6.1) on the same prompts a typical user writes: 10 edits inside two existing apps and 8 new sites from a one-line request. Seven of the 18 tasks were held out: the skill was never tuned on them. Claude Opus judged screenshots blind, with labels shuffled per packet, 80 judgments per condition on a 10-point scale.

| | Seenry + MCP | Emil | Jakub | No skill |
| --- | --- | --- | --- | --- |
| All 18 tasks | **7.99** | 6.84 | 6.53 | 6.61 |
| Edits, tuned tasks (7) | **7.69** | 7.19 | 6.78 | 6.69 |
| New sites, tuned tasks (4) | **8.25** | 5.88 | 6.62 | 6.56 |
| Held-out tasks (3 edits, 4 new sites) | **8.21** | 6.93 | 6.14 | 6.54 |

Against Emil's skill, Seenry won 59 judgments, tied 15 and lost 6, and led 15 of 18 tasks. It lost a recipe screen and an empty state and tied settings. It is slower: about 17 minutes per new site against 6 to 7, and 6 minutes per edit against 3 to 4, because it researches references, explores directions and runs its own review. After that run, the review loop was sped up (parallel critic and motion judge, verdict reuse on unchanged boards). A timing rerun at commit e650259 took 11 to 13 minutes per new site (4 sites that took 14 to 19 before) and 2 to 3 minutes for two edits, and blind Opus judges preferred the new sites in 5 of 8 pairings against the earlier runs (7.75 against 7.38). Measured at commit ed2a30f. One model family judged the final round, and scores describe these prompts, not every project.

## Install

```sh
npx skills add ayangabryl/seenry-skills
```

Or clone and install locally (previews by default):

```sh
python3 scripts/install.py --apply
```

Replacing an older Seenry install: run with `--replace --apply`. Retired skill folders are archived, and the printed manifest works with `--rollback`.

## Seenry MCP

The read-only Seenry MCP at `https://mcp.seenry.design` serves captured websites and sections, measured CSS evidence, recordings, and iOS app screens and flows. It needs a Seenry Pro key sent as `Authorization: Bearer <key>`; the server does not offer OAuth sign-in. [.mcp.json](.mcp.json) reads the key from the `SEENRY_PRO_KEY` environment variable. Without MCP the skills fall back to the bundled benchmarks and ordinary browsing.

Every skill uses the Seenry MCP tool contract and prefer connected MCP tools. Scripted research uses the same endpoint and an existing `SEENRY_PRO_KEY`: run `node skills/seenry/scripts/research.mjs --brief BRIEF.md --family websites --terms "<focused query>"` from this repository, or the installed skill's absolute script path. The script makes at most three tool calls (planned maximum 11 credits), saves the source context and images it used, and stops on service, auth or quota errors. Without a key it writes an explicitly unresearched handoff for connected tools or permitted web research.

## Verify and contribute

```sh
python3 scripts/validate.py
python3 -m unittest discover -s tests
node --test tests/canvas.test.mjs
node tests/system-audit.browser.mjs --playwright /path/to/node_modules/playwright/index.mjs
```

The checks cover package structure and the included tools. They do not certify visual quality: render the page at 1440 and 390, run the system audit, and look.

Seenry is licensed under the [Apache License 2.0](LICENSE); see [NOTICE](NOTICE). Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md), including the Conventional Commits format. Adapted guidance retains its authors' notices in [skill licenses](skills/seenry/licenses/NOTICE.md). External references remain research sources; use their code and media only under their own terms.
