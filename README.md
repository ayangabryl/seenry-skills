# Seenry skills

Agent skills for building interfaces that look like they came from a top product team. Seenry gives the agent a strict, small design system, a layered way to construct every component, one shared shell for every page, and measured evidence from real company screens through the optional Seenry MCP.

| Skill | Use it for |
| --- | --- |
| [seenry](skills/seenry/SKILL.md) | Building any web page or component: system, layout, type, color, craft, copy, accessibility, imagery, reference matching |
| [seenry-review](skills/seenry-review/SKILL.md) | Auditing a screen, reviewing a UI diff, stress-testing one component, explaining how something is built |
| [seenry-motion](skills/seenry-motion/SKILL.md) | Transitions, gestures, scroll and component animation, with runnable assets |
| [seenry-apps](skills/seenry-apps/SKILL.md) | Native-feeling mobile screens and flows |
| [seenry-branding](skills/seenry-branding/SKILL.md) | Identity research and project brand guidelines |
| [seenry-decks](skills/seenry-decks/SKILL.md) | Presentation research and slide narratives |

## What makes it different

- **A system before styling.** 4px grid, one spacing scale, one radius family with concentric nesting (`inner = outer − inset`), one sans plus one accent family, one accent color, rings instead of heavy shadows. Starter [tokens.css](skills/seenry/assets/tokens.css) and a [DESIGN.md template](skills/seenry/assets/DESIGN.template.md) keep page 12 consistent with page 1.
- **Components built in layers.** Grid → safe space and content areas → structure → type and states, recorded as a short spec card. Max three sizes and three weights per component. [Anatomies](skills/seenry/references/components.md) with measured defaults for buttons, inputs, cards, rows, menus, dialogs, tables, pricing tiers and more.
- **Page shells and section archetypes** so every page shares gutters, widths, rhythm and heading patterns. [Pages](skills/seenry/references/pages.md).
- **Measured, not imagined.** [Benchmarks](skills/seenry/references/benchmarks.md) from 24 leading sites (Linear, Stripe, Vercel, Notion, Figma, Raycast, Resend, GitHub and more): hero sizes, weights, tracking, radii, elevation. With Seenry MCP the agent re-measures any site and studies real sections, pages, app screens and recordings. [Research recipes](skills/seenry/references/research.md).
- **An anti-slop pass** with fixes for every common AI tell, and a [system audit](skills/seenry/scripts/system_audit.mjs) that counts the sizes, weights, radii and colors a page actually renders and flags off-grid spacing and non-concentric corners.

## Install

```sh
npx skills add ayangabryl/seenry-skills
```

Or clone and install locally (previews by default):

```sh
python3 scripts/install.py --apply
```

Upgrading from 2.x: run with `--replace --apply`. The eleven specialist skills merged in 3.0 (typography, color, layout, polish, writing, accessibility, variants, stress, explain, change-review, assets) are archived, and the printed manifest works with `--rollback`.

## Seenry MCP

The read-only Seenry MCP at `https://mcp.seenry.design` serves captured websites and sections, measured CSS evidence, recordings, iOS app screens and flows, branding systems and decks. It needs a Seenry Pro key sent as `Authorization: Bearer <key>`. [.mcp.json](.mcp.json) is an example configuration. Without MCP the skills fall back to the bundled benchmarks and ordinary browsing.

## Verify and contribute

```sh
python3 scripts/validate.py
python3 -m unittest discover -s tests
node tests/system-audit.browser.mjs --playwright /path/to/node_modules/playwright/index.mjs
```

The checks cover package structure and the included tools. They do not certify visual quality: render the page at 1440 and 390, run the system audit, and look.

Seenry is MIT licensed. Adapted guidance retains its authors' notices in [skill licenses](skills/seenry/licenses/NOTICE.md). External references remain research sources; use their code and media only under their own terms.
