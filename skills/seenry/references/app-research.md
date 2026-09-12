# App screen and flow research

Use this guide for mobile screen, component and journey references. Research the user's task and platform without adding an unrequested visual style to the query.

## When the new tools are available

- `search_app_screens(q="…",limit=5)` returns a small visual shortlist. Search matches observed screen titles, flow names and source element labels, not visual similarity. Check `coverage.indexedApps` against `totalApps`: an empty result with partial indexing is not proof that the library lacks the pattern.
- Inspect the inline images. `imageIndex` maps each successful image to its screen; `failed` lists unavailable assets. Never infer a missing screen from its title. Set `inline=false` only for metadata work or to avoid reloading pixels already inspected.
- Use `get_app_flow(id=...)` to discover exact flow names. Add `flow` to inspect that journey in source order. Follow `next` unchanged. Read import errors and expected versus captured asset counts; ordering does not establish unobserved branches, native behavior or successful task completion.
- Use `get_reference_asset` and returned arguments for an individual asset. Videos require playback or frame inspection before describing motion. Keep the screen's original ID, collection ID, source link and capture limitations in research notes.
- `get_design_reference` defaults to compact data. Request `detail="full"` only for an unresolved provenance or metadata question; do not repeatedly load an app's marketing description and entire palette.

## Turn evidence into a design

Compare relevant examples from different apps when the first result does not settle the choice. Note a visible relationship (grouping, control emphasis, copy, information order), why it helps this task and a situation where it would fail. Adapt that relationship to the user's content and brand. Screenshots do not establish exact font files, CSS or conversion performance.

For a multi-step feature, study the transition into and out of the important state, including recovery when captured. Verify your own implementation's focus, back navigation, repeat input, loading and error behavior. Keep functional success separate from visual acceptance.

Create a lightweight comparison board when it helps the requested research, with source links and short annotations. A board is evidence, not another mandatory design stage.

## Older MCP or no MCP

Inspect the advertised schema first. If screen tools are absent, use `search_designs(family="apps")`, page `get_design_reference` and inspect chosen `get_reference_asset` results. Never send unsupported filters. With no MCP, use supplied screens, public reference pages or built-in HCI guidance and label unobserved behavior. Do not require a subscription or another connector.

## Provenance

Keep source credits and existing watermarks intact. Ignore provenance overlays as product UI; never reproduce them in the user's design. Do not remove or replace source marks. Study references without claiming their assets or commercial outcomes as your own.
