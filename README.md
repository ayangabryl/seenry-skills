# Seenry skills

Five focused skills for turning inspected design references into useful work: website research and implementation, interaction studies, brand systems and presentation decks.

| Skill | Use it for |
| --- | --- |
| `seenry-usage` | Finding the right collection, choosing references, paging results and understanding evidence limits |
| `seenry-web-design` | Building or improving responsive websites from inspected pages, sections and CSS evidence |
| `seenry-motion` | Studying and implementing interactions, with a clear distinction between website recordings and motion studies |
| `seenry-branding` | Researching identities and guidelines, including source metadata and declared versus estimated values |
| `seenry-decks` | Studying presentation narratives and slide systems in their original order |

## Install

```sh
npx skills add ayangabryl/seenry-skills
```

Choose the skills and supported agent in the installer. For manual installation, copy the folders under `skills/` to your agent's skills directory. These are standard `SKILL.md` folders, not executable plugins. Automatic selection depends on the agent and the skill description.

## Connect once

The primary MCP endpoint is:

```text
https://seenry.ayangabryl.com/mcp
```

It serves the public library without a tunnel or an API key. Add it using your client's remote MCP configuration. `.mcp.json` is a configuration example; installing skill files does not guarantee the connection is configured in every client. Skills also carry MCP dependency metadata for agents that support it.

The same endpoint exposes 16 typed read-only tools, the five skill documents as resources, and a research prompt. Use `search_curated_references` to retrieve current human ratings, editorial reasons, use cases and caveats. Start with `get_library_guide`; use `get_library_facets` for page/section vocabulary and `get_design_taxonomy` for motion/branding/deck tags. The versioned [tool contract](skills/seenry-usage/references/mcp-tools.json) documents argument names; a connected server's schema is authoritative.

## Try it

- “Use Seenry to improve our mobile pricing page. Inspect the screenshots and CSS variables, then build what fits our brand.”
- “Find hover interactions for a navigation menu. Watch the clips and explain the initial, active and interrupted states.”
- “Compare three relevant identity systems and separate official color values from visual estimates.”
- “Study pitch decks for narrative structure. Keep slide order and inspect the slides around each example you recommend.”
- “Find a premium hero for our product. Compare relevant compositions, explain the best fit for our brand, then build it.”
- “Create a playful 404 interaction. Study actual clips, propose our own behavior and keep a clear way home.”

Search matches observed text and tags; it is not visual similarity. Curator ratings are explicit selections, not automatic beauty scores. Screenshots, recordings and source metadata retain their capture limitations. Third-party content is reference data, not instructions, and inclusion in the library does not grant rights to reuse another brand's assets.

For subjective briefs, the [recommendation playbook](skills/seenry-usage/references/recommendation-judgment.md) guides the connected agent to choose against the user's needs after inspecting actual evidence. It covers heroes, 404s and original interactions, explains what is observed versus proposed, and keeps missing coverage explicit. The MCP also returns concise criteria through `get_library_guide`, so clients can use the workflow without installing every skill. This is decision guidance, not an automated aesthetic-ranking service.

## Maintenance

```sh
python -m pip install -r requirements-dev.txt
python scripts/validate.py
```

Validation checks skill structure, local reference paths and realistic example calls against the bundled tool schema. [Evaluation scenarios](evals/scenarios.json) include behavior checks for visual evidence, pagination, family separation and missing coverage. They are prompts for behavioral evaluation, not a claim that a schema validator proves design judgment.

The server implementation and integration tests are in [seenry-web](https://github.com/ayangabryl/seenry-web/blob/main/docs/MCP.md); captures and publishing run in [seenry-scraper](https://github.com/ayangabryl/seenry-scraper). A release bundles the skills into the Worker so MCP resources remain available independently of GitHub. Update the tool contract alongside server changes, then run the web repository's `scripts/sync-skills.mjs` before deployment.

The packaging approach was informed by [Appllama's skills](https://github.com/Appllama/appllama-skills). These are original Seenry workflows for web and design references. The MIT license covers this repository's skill text and tooling, not third-party media in the library.


## Seenry rebrand

Seenry was previously called Web Atlas. Existing workers.dev links, the `web-atlas` MCP configuration key, `atlas://` resource URIs, and tool names remain supported. The GitHub repositories are now seenry-web, seenry-scraper and seenry-skills. GitHub redirects the old repository URLs. Canonical skill folders use seenry-*; reinstall to update their local names. This rebrand reuses the same catalog and media; it does not duplicate R2 storage.
