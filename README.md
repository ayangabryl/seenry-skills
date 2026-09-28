# Seenry skills

Seenry helps an agent research, design, build and review websites and interactive components. The skills work with supplied references, ordinary browsing or the optional Seenry MCP connection, in the project's existing stack.

| Skill | Purpose |
| --- | --- |
| [seenry](skills/seenry/SKILL.md) | Interface direction, construction, faithful reconstruction and visual review |
| [seenry-motion](skills/seenry-motion/SKILL.md) | Interaction research, transition design and motion verification |
| [seenry-assets](skills/seenry-assets/SKILL.md) | Images, fonts, icons, video and asset provenance |
| [seenry-branding](skills/seenry-branding/SKILL.md) | Identity research and project brand guidelines |
| [seenry-decks](skills/seenry-decks/SKILL.md) | Presentation research and slide narratives |
| [seenry-apps](skills/seenry-apps/SKILL.md) | Connected mobile app screens and flows |
| [seenry-typography](skills/seenry-typography/SKILL.md) | Font voice, type composition and rendered hierarchy |
| [seenry-color](skills/seenry-color/SKILL.md) | Palette roles, area and measured contrast |
| [seenry-layout](skills/seenry-layout/SKILL.md) | Grouping, responsive order and density |
| [seenry-accessibility](skills/seenry-accessibility/SKILL.md) | Keyboard, semantics, zoom and recovery audits |
| [seenry-writing](skills/seenry-writing/SKILL.md) | Product voice, marketing argument and state copy |
| [seenry-polish](skills/seenry-polish/SKILL.md) | Controls, icons, borders and surface detail |
| [seenry-review](skills/seenry-review/SKILL.md) | Independent review of a rendered screen or flow |
| [seenry-change-review](skills/seenry-change-review/SKILL.md) | Review UI impact of a branch, commit or pull request |
| [seenry-explain](skills/seenry-explain/SKILL.md) | Explain observed design and interaction mechanics |
| [seenry-stress](skills/seenry-stress/SKILL.md) | Render one component in its reachable edge states |
| [seenry-variants](skills/seenry-variants/SKILL.md) | Compare distinct solutions to one design decision |

## Install

```sh
npx skills add ayangabryl/seenry-skills
```

Or clone this repository and install the complete skill set locally:

```sh
python3 scripts/install.py --apply
```

The local installer previews changes by default. Use `--replace --apply` to archive and replace an existing Seenry installation; its printed manifest can be used with `--rollback`. It does not change MCP configuration. Each specialist skill contains its core instructions; links to deeper Seenry guides work when the full package is installed.

## Work with Seenry

For a new interface, start with the user's task and real content. Inspect only the references that inform the current decision, try structural directions as working slices, finish one direction in the product, then inspect its rendered states and interactions. Keep decisions and remaining uncertainty in the project's DESIGN.md. [The workflow map](ARCHITECTURE.md) explains when to use the focused guides.

For a supplied interface to match, use [reference reconstruction](skills/seenry/references/replication.md). Measure the source's composition and behavior, implement it in the existing product, and compare the result at equivalent sizes and states. Treat unobserved motion as a proposal. A related effect is not proof of a faithful match.

For a narrow fix, inspect the affected state, read the relevant craft guide, change the smallest useful surface and verify it in the running interface. Motion guidance covers state ownership, anchors, interruption, keyboard/touch behavior and reduced motion. [Interaction anatomy](skills/seenry-motion/references/interaction-anatomy.md) and [expressive effects](skills/seenry-motion/references/expressive-effects.md) explain mechanisms without prescribing a package or visual style. Runnable motion assets include an [action menu](skills/seenry-motion/assets/action-menu/README.md), [selection surface](skills/seenry-motion/assets/selection-surface-demo.html), [status switch](skills/seenry-motion/assets/status-switch/README.md), [expanding card](skills/seenry-motion/assets/expanding-card/README.md), [modal surface](skills/seenry-motion/assets/modal-surface/README.md), [boundary trace](skills/seenry-motion/assets/boundary-trace/README.md), [signal field](skills/seenry-motion/assets/signal-field/README.md), [image reveal](skills/seenry-motion/assets/image-reveal/README.md) and [reflective surface](skills/seenry-motion/assets/reflective-surface/README.md). Other mechanism guides describe what to build rather than promising a drop-in component.

An optional read-only Seenry MCP endpoint is available at `https://mcp.seenry.design`; [.mcp.json](.mcp.json) is an example configuration. The skills also provide an [offline research route](skills/seenry/references/without-mcp.md). Installing skills does not configure an MCP client.

## Verify and contribute

Run package and skill checks before publishing an edit:

```sh
python3 scripts/validate.py
python3 -m unittest discover -s tests
```

The checks cover resources and behavior of included tools. They do not certify the visual quality of an output; inspect the actual page, responsive states and interactions. [Domain skill evaluation](evals/domain-skills/README.md) separates routing, first render, repair and independent judgment. The repository includes a [portable website example](examples/seenry-site/README.md) and development evidence under `evals/`.

For an original website with a high craft bar, [the optional Codex CLI review gate](skills/seenry/scripts/independent_review_gate.py) runs a focused typography review and a whole-screen review in separate fresh contexts. Give it a brief, desktop and mobile captures, and an output directory; it exits with a blocking result until both reviews return Keep. It requires a local `codex` executable and the full Seenry installation. The saved JSON reports and input hashes make the disposition inspectable; the gate does not replace a human design decision.

```sh
python3 skills/seenry/scripts/independent_review_gate.py --brief BRIEF.md --desktop desktop.png --mobile mobile.png --out review-1
```

Seenry is MIT licensed. A small number of adapted guides and bundled runtime helpers retain their authors' notices in [skill licenses](skills/seenry/licenses/NOTICE.md) and their asset directories. External references remain research sources; use their code and media only under their own terms.
