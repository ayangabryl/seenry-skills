# The level bar

Three references the page is held to. With none, the agent's own default becomes the bar, and the page comes out at the default's level.

## The example

[Waterline](../assets/examples/waterline/README.md) was held to three: a workflow tool whose app sinks into painted grass, an integration platform with a glass dashboard over a photograph, and a hero with a painted mountain under a flat sky. Each gave one principle with a number.

## Where the three come from

| The person | Do |
| --- | --- |
| Showed work ("design like this", posts, a site) | Their work is the bar: save it to `.seenry/level/` and follow [level reference](level-reference.md) |
| Showed nothing | Pull three from the Seenry library, below |
| Showed nothing, and the Seenry MCP is unreachable (an error, a rejected key) | Capture three leaders' live pages yourself: `node scripts/render_page.mjs <url> .seenry/canvas/refs/<name>.png --full`. Never stop for want of references; say in the report where they came from |
| Showed nothing, and the library has fewer than three that pass | Keep the library's best two or three anyway for composition, and hold the finish to the [execution bar](execution-bar.md). Never save the Waterline example as a reference: a page composed from it alone is blocked as its reskin. Say so in the report |

## Pulling from the library

1. `get_level_bar` when the Seenry MCP lists that tool: pass the section (`Hero`) and two industry words. It returns rated references first, one per brand.
2. Otherwise `search_curated_references` for rated picks, then `search_sections` with `element: "Hero"` and one industry word, and `list_sites` with a leader's name.
3. Open each candidate at full size with its `inspect` or `get_screenshot` call. A thumbnail hides what decides the level.
4. Keep three that pass all four:

| Check | Passes when |
| --- | --- |
| First read | One thing leads the screen |
| Material | A real product view or an art-directed image at real size |
| Finish | Logos are marks, controls are designed, type is tuned |
| Fit | It does this page's job for a similar audience |

5. Save the three to `.seenry/canvas/refs/` and name them in `.seenry/brief.md` under "Level bar", with where each came from.

## Queries that work

| Do | Because |
| --- | --- |
| One word per query: `fintech`, not `fintech dashboard` | Every word must match; two words often return nothing |
| Set `family` on `search_reference_assets` | Without it a web query returns app screens |
| Search by industry and element, never by composition | `illustration` finds illustration vendors; `landscape` finds a settings screen |
| Read zero results as "shorten the query" | Missing tags are not missing designs |
| Treat a result marked `relaxed` as a loose match | It matched any word, not every word |

## Saying what the bar is

Report one line: "Held to: <three names>, from <the person | the library | the bundled bar>." When the library was thin, add how many candidates were opened and how many passed, and ask the person for one or two references to raise it.
