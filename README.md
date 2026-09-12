# Seenry skills

This working revision is **2.0.1-dev.4**, adding project brand-guideline authorship and continuity to focused creative decisions. The published stable release remains 2.0.0.

A design workflow that connects reference research to actual layouts, visual decisions, complete interactions and rendered review. Seenry consolidates the former Design Judgment process and Web Atlas skills into one package.

| Skill | Use it for |
| --- | --- |
| `seenry` | Research, design direction, wireframes, typography/color, implementation and review |
| `seenry-motion` | Motion research, microinteractions, morphs, scroll choreography and verification |
| `seenry-assets` | Images, fonts, real provider marks, icons, video and asset provenance |
| `seenry-branding` | Identity research and project brand-guideline authorship/maintenance |
| `seenry-decks` | Presentation narratives and ordered slide studies |

## Install

Install the **2.0.0** release with the standard skills installer:

```sh
npx skills add ayangabryl/seenry-skills
```

For a shared local installation across agents, clone this repository and run:

```sh
python scripts/install.py --apply
```

For an existing Design Judgment or Web Atlas install, use the reversible [migration](MIGRATION.md). The standard installer does not perform that legacy migration.

Choose the desired skills and agent in that installer. It does not perform the custom legacy migration. Manual installation also works: copy the desired `skills/` folders to the client's skills directory. Install all five for the complete set. These are standard SKILL.md folders; no proprietary instruction format or paid prompt pack is needed.

## Optional reference connection

The complete design workflow and built-in guides work without MCP. Use ordinary browsing, supplied files or original local prototypes through the [offline research route](skills/seenry/references/without-mcp.md). No reference subscription, API key or paid prompt pack is required. Your agent/model and any optional external services retain their own requirements. MCP expands the evidence available; it does not unlock design rules.

The public read-only MCP endpoint is `https://mcp.seenry.design`. `.mcp.json` gives a client configuration example. The existing `web-atlas` connection key, tool names and legacy links remain compatible. Installing a skill does not configure every client's MCP connection.

Use the current native schemas; a versioned [tool contract](skills/seenry/references/mcp-tools.json) is bundled for reference. Search current human ratings with `search_curated_references`, inspect real pixels or recordings, and distinguish a missing editorial reason from the agent's own analysis. Ratings apply to their actual target; a hero rating does not certify mobile or motion quality.

## Work from a simple brief

“Use Seenry to create a creative website for a miniature-set photography studio.”

For a full build: understand → research → three concepts → working wireframes → real type → surfaces and interaction proofs → compare → complete sequence → exercise and refine. Narrow fixes stay narrow. [Architecture](ARCHITECTURE.md) explains responsibilities; the project [DESIGN.md guide](skills/seenry/references/design-record.md) preserves decisions and actual construction evidence.

The primary skill loads support for the current unresolved decision. Ordinary work uses a compact DESIGN.md, working source and relevant captures; model/recorder manifests belong to explicitly recorded experiments. New CLI handoffs default to focused guidance and inherit the project’s evidence route unless explicitly overridden. Optional stage packets are available through `skills/seenry/scripts/packet.py`, with hashes of supplied resources. Supplied guidance, observed reads and applied design choices are different evidence. Neither skill installation nor a reference rating guarantees visual acceptance.

## Plan with real material and motion

The [execution guide](skills/seenry/references/execution.md) documents project-aware routing, chronological evidence, host capabilities and incomplete states. [Art direction](skills/seenry/references/art-direction.md) connects the offering to alternative compositions and a whole-page narrative. The [casebook](skills/seenry/references/studies/casebook.md) separates inspected external observations from original teaching exercises; it is not a collection of copied website assets.

```sh
python skills/seenry-assets/scripts/asset_studio.py search-met botanical --limit 6 --out candidates.json
python skills/seenry-assets/scripts/asset_studio.py board candidates.json --out material-study.html
python skills/seenry-assets/scripts/type_lab.py skills/seenry-assets/assets/type.example.json --out type-study.html
```

Replace the typography example's source paths with installed project fonts, relative to the output HTML. Met search is a narrow public-domain art/object source, not a general stock-photo service. Native image search can populate the same manifest. No token, subscription or MCP is required. Candidate previews are temporary; inspect crops, rights and intended use before production. The motion score demo in `skills/seenry-motion/assets/score-demo.html` runs through a local HTTP server with no external animation library.

For anti-slop review, use [contextual diagnosis](skills/seenry/references/quality-diagnosis.md) and controlled alternatives. Color, serif type, sharp corners and familiar controls are not automatic failures. Human acceptance and calibrated false-positive testing remain required for quality claims.

## Compare color locally

Define actual copy and competing role palettes in JSON, then render the same component under each direction:

```sh
python skills/seenry/scripts/color_lab.py skills/seenry/assets/color-lab.example.json --out ./color-study
python skills/seenry/scripts/packet.py plan --research-source local
```

Open the generated `index.html` in a browser. It loads no network resources. `audit.json` checks the sample’s opaque sRGB role pairs; it does not score taste, cover arbitrary CSS colors or certify the full product. Read [color decisions](skills/seenry/references/color-decisions.md) for light neutral, dark, restrained and richer color systems.

## Validate and evaluate

```sh
python -m pip install -r requirements-dev.txt
python scripts/validate.py
python -m unittest discover -s tests -v
node --test skills/seenry-motion/assets/lottie-toggle.test.mjs skills/seenry-motion/assets/score.test.mjs
# Optional real browser verification, with a project Playwright installation:
node tests/geometry-transition.browser.mjs --playwright /path/to/playwright/index.mjs
```

The release includes local rendered decision lessons, focused stage packets, exact artifact revisions, and a comparison gate for unresolved prototypes. [Number transitions](skills/seenry-motion/references/number-transitions.md) now provide a pinned local NumberFlow adapter with anchored units and static fallbacks. [Design continuity](skills/seenry/references/design-continuity.md) compares selected typography and spatial relationships with the finished artifact. These are capability changes; they do not establish consistent visual superiority.

Validation checks skill structure, references and example calls. Installer tests cover archive/rollback, collisions, relocation and shared links. Behavioral [scenarios](evals/scenarios.json) describe what to inspect in actual model runs; schema validity does not mean those model evaluations passed. The [matched pilot](skills/seenry/references/evaluation.md) is still required for new performance claims.

The MIT license covers original skill text and tooling. Bundled Morphicons retains its license and provenance. Third-party library screenshots and footage are research evidence, not redistributed assets or automatically licensed production material. No private benchmark archive is bundled here.

MCP resource documents are deployed separately in the server repository. This package migration does not deploy the service or its resource bundle. Legacy tools and histories remain archived locally and in their original source checkout; see [migration](MIGRATION.md) for access and rollback.

Evaluation evidence is mixed; consistent visual superiority has not been established. Treat the workflow, rendered checks and human review as distinct safeguards. This release ships the implementation and tooling described in [the changelog](CHANGELOG.md), without a guarantee of premium output from every model.

For multi-screen applications, the [system design guide](skills/seenry/references/system-design.md) maps journeys, shared component/state decisions and representative screen families. The workflow scales through bounded connected slices; whole-system coverage remains explicit. Large-system output quality has not been benchmarked.

### Optional motion capability lab

The [expressive-motion guide](skills/seenry-motion/references/expressive-effects.md) covers five public effect families and when to avoid them. The [runnable lab](examples/libraries-motion-lab/README.md) uses pinned free packages, explicit pause/reduced-motion policy and browser checks. These runtimes are optional; installing Seenry does not add React, WebGL or MCP requirements.
