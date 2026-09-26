# Seenry skills

Seenry helps an agent research, design, build and review websites and interactive components. The skills work with supplied references, ordinary browsing or the optional Seenry MCP connection, in the project's existing stack.

| Skill | Purpose |
| --- | --- |
| [seenry](skills/seenry/SKILL.md) | Interface direction, construction, faithful reconstruction and visual review |
| [seenry-motion](skills/seenry-motion/SKILL.md) | Interaction research, transition design and motion verification |
| [seenry-assets](skills/seenry-assets/SKILL.md) | Images, fonts, icons, video and asset provenance |
| [seenry-branding](skills/seenry-branding/SKILL.md) | Identity research and project brand guidelines |
| [seenry-decks](skills/seenry-decks/SKILL.md) | Presentation research and slide narratives |

## Install

```sh
npx skills add ayangabryl/seenry-skills
```

Or clone this repository and install all five skills locally:

```sh
python3 scripts/install.py --apply
```

The local installer previews changes by default. Use `--replace --apply` to archive and replace an existing Seenry installation; its printed manifest can be used with `--rollback`. It does not change MCP configuration. You can also copy individual folders from `skills/` into your agent's skills directory.

## Work with Seenry

For a new interface, start with the user's task and real content. Inspect only the references that inform the current decision, try structural directions as working slices, finish one direction in the product, then inspect its rendered states and interactions. Keep decisions and remaining uncertainty in the project's DESIGN.md. [The workflow map](ARCHITECTURE.md) explains when to use the focused guides.

For a supplied interface to match, use [reference reconstruction](skills/seenry/references/replication.md). Measure the source's composition and behavior, implement it in the existing product, and compare the result at equivalent sizes and states. Treat unobserved motion as a proposal. A related effect is not proof of a faithful match.

For a narrow fix, inspect the affected state, read the relevant craft guide, change the smallest useful surface and verify it in the running interface. Motion guidance covers state ownership, anchors, interruption, keyboard/touch behavior and reduced motion. [Interaction anatomy](skills/seenry-motion/references/interaction-anatomy.md) and [expressive effects](skills/seenry-motion/references/expressive-effects.md) explain mechanisms without prescribing a package or visual style. The motion skill also includes an original, [runnable action menu](skills/seenry-motion/assets/action-menu/README.md); other mechanism guides describe what to build rather than promising a drop-in component.

An optional read-only Seenry MCP endpoint is available at `https://mcp.seenry.design`; [.mcp.json](.mcp.json) is an example configuration. The skills also provide an [offline research route](skills/seenry/references/without-mcp.md). Installing skills does not configure an MCP client.

## Verify and contribute

Run package and skill checks before publishing an edit:

```sh
python3 scripts/validate.py
python3 -m unittest discover -s tests
```

The checks cover resources and behavior of included tools. They do not certify the visual quality of an output; inspect the actual page, responsive states and interactions. The repository includes a [portable website example](examples/seenry-site/README.md) and development evidence under `evals/`.

Seenry is MIT licensed. A small number of adapted guides and bundled runtime helpers retain their authors' notices in [skill licenses](skills/seenry/licenses/NOTICE.md) and their asset directories. External references remain research sources; use their code and media only under their own terms.
