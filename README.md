# Seenry skills

Agent skills that make an AI work like a design studio. Seenry fixes a strict frame (pixel grid, columns, padding, safe space, type set), explores several compositions inside it, critiques them side by side and refines one with real material, using measured evidence from real company screens through the optional Seenry MCP.

| Skill | Use it for |
| --- | --- |
| [seenry](skills/seenry/SKILL.md) | Building any web page or component: system, layout, type, color, craft, copy, accessibility, imagery, reference matching |
| [seenry-assets](skills/seenry-assets/SKILL.md) | License-clear photos, icons and fonts from the web, generated images when an image model is available, provenance for every file |
| [seenry-review](skills/seenry-review/SKILL.md) | Auditing a screen, reviewing a UI diff, stress-testing one component, explaining how something is built |
| [seenry-motion](skills/seenry-motion/SKILL.md) | Transitions, gestures, scroll and component animation, with runnable assets |
| [seenry-apps](skills/seenry-apps/SKILL.md) | Native-feeling mobile screens and flows |
| [seenry-branding](skills/seenry-branding/SKILL.md) | Identity research and project brand guidelines |
| [seenry-decks](skills/seenry-decks/SKILL.md) | Presentation research and slide narratives |
| [seenry-video](skills/seenry-video/SKILL.md) | Product films as code: launch videos and explainers studied from real references, rendered frame by frame, with designed sound and sourced claims |

## What makes it different

- **A system before styling.** 4px grid, one spacing scale, one radius family with concentric nesting (`inner = outer − inset`), one sans family (plus mono for data), one accent color, rings instead of heavy shadows. Starter [tokens.css](skills/seenry/assets/tokens.css) and a [DESIGN.md template](skills/seenry/assets/DESIGN.template.md) keep page 12 consistent with page 1.
- **Studio process.** Brief → research → frame → material → explore 3 compositions → critique → refine → verify. [Structured exploration](skills/seenry/references/exploration.md) varies arrangement, scale, anchors and density inside the frame, never the frame itself.
- **Real material.** `seenry-assets` sources CC0 and public-domain photos (Openverse), permissive icon sets (Lucide, Phosphor, Tabler via Iconify) and open fonts, or generates art-directed images through OpenAI or Gemini, and writes a license manifest.
- **Components built in layers.** Grid → safe space and content areas → structure → type and states, recorded as a short spec card. Max three sizes and three weights per component. [Anatomies](skills/seenry/references/components.md) with measured defaults for buttons, inputs, cards, rows, menus, dialogs, tables, pricing tiers and more.
- **Page shells and section archetypes** so every page shares gutters, widths, rhythm and heading patterns. [Pages](skills/seenry/references/pages.md).
- **Measured, not imagined.** [Benchmarks](skills/seenry/references/benchmarks.md) from 18 leading sites (Linear, Stripe, Vercel, Notion, Figma, Raycast, Resend, GitHub and more): hero sizes, weights, tracking, radii, elevation. With Seenry MCP the agent reads available captured measurements and studies real sections, pages, app screens and recordings. [Research recipes](skills/seenry/references/research.md).
- **A design sheet for every task.** The skill researches on its own (named category leaders plus an open search that surfaces companies you did not know), decides, builds, and ends with a Seenry sheet: why each decision was made, which companies informed it, the variants explored, measured color and type, component anatomy with keylines drawn on, guidelines for future work, and what was verified. See the [pricing example sheet](skills/seenry/assets/examples/sheet/pricing.sheet.html).
- **Worked examples.** A [player card](skills/seenry/assets/examples/player-card.html), a [pricing section](skills/seenry/assets/examples/pricing.html) and a [settings panel](skills/seenry/assets/examples/settings.html), each built with the process, audited clean at 1440 and 390, and annotated with its frame and keylines.
- **Tested motion recipes.** `seenry-motion` decides whether something should animate at all, then gives exact curves, durations and springs, and modern-CSS recipes (native dialog and popover exits, `interpolate-size` accordions, View Transitions, scroll-driven reveals, `linear()` springs) that the test suite runs in Chromium.
- **A measured color system from one hex.** `palette.py` builds OKLCH ramps and two-tier tokens for light and dark and checks every pair against WCAG and APCA.
- **Alignment you can measure on any project.** `node skills/seenry/scripts/audit_page.mjs <url> --widths 1440,390` checks ink-level alignment (cap heights, baselines, drawn glyphs, media edges) and optical alignment (asymmetric icons, label centering, side bearing) and prints the CSS nudge for each finding.
- **An anti-slop pass** with fixes for every common AI tell, and a [system audit](skills/seenry/scripts/system_audit.mjs) that counts the sizes, weights, radii and colors a page actually renders and flags off-grid spacing and non-concentric corners.

## Measured results

A blind benchmark on October 7, 2026 compared Seenry with Seenry MCP against two public design skills ([Emil Kowalski](https://github.com/emilkowalski/skills), [Jakub Krehel](https://github.com/jakubkrehel/skills)) and no skill. Each condition ran Codex (Sol 6.1) on the same prompts a typical user writes: 10 edits inside two existing apps and 8 new sites from a one-line request. Seven of the 18 tasks were held out: the skill was never tuned on them. Claude Opus judged screenshots blind, with labels shuffled per packet, 80 judgments per condition on a 10-point scale.

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

The read-only Seenry MCP at `https://mcp.seenry.design` serves captured websites and sections, measured CSS evidence, recordings, iOS app screens and flows, branding systems and decks. It needs a Seenry Pro key sent as `Authorization: Bearer <key>`; the server does not offer OAuth sign-in. [.mcp.json](.mcp.json) reads the key from the `SEENRY_PRO_KEY` environment variable. Without MCP the skills fall back to the bundled benchmarks and ordinary browsing.

All eight skills use the Seenry MCP 0.1.0 tool contract and prefer connected MCP tools. Scripted research uses the same endpoint and an existing `SEENRY_PRO_KEY`: run `node skills/seenry/scripts/research.mjs --brief BRIEF.md --family websites --terms "<focused query>"` from this repository, or the installed skill's absolute script path. The script makes at most three tool calls (planned maximum 11 credits), saves the source context and images it used, and stops on service, auth or quota errors. Without a key it writes an explicitly unresearched handoff for connected tools or permitted web research.

## Verify and contribute

```sh
python3 scripts/validate.py
python3 -m unittest discover -s tests
node tests/system-audit.browser.mjs --playwright /path/to/node_modules/playwright/index.mjs
```

The checks cover package structure and the included tools. They do not certify visual quality: render the page at 1440 and 390, run the system audit, and look.

Seenry is licensed under the [Apache License 2.0](LICENSE); see [NOTICE](NOTICE). Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md), including the Conventional Commits format. Adapted guidance retains its authors' notices in [skill licenses](skills/seenry/licenses/NOTICE.md). External references remain research sources; use their code and media only under their own terms.
