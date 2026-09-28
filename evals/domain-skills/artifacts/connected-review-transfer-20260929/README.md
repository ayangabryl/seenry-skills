# Connected review transfer — 2026-09-29

The current published Seenry entrypoint at commit `b5aaac1` was forward-tested on two fictional web briefs. Spoke Works used the skill; Relay used the skill and a separate no-local-skill baseline with the same supplied scheduling facts. Each executor worked in an isolated temporary directory. This case preserves the relevant source, 390px renders, and model-review summaries. The [bicycle](bicycle-trial.md), [Relay Seenry](relay-seenry-trial.md), and [Relay baseline](relay-baseline-trial.md) trial reports record browser behavior and guidance actually read.

## Spoke Works: reading the guide was not enough

The fresh builder read both Seenry Typography and anti-default guidance before styling. Its first complete [phone page](captures/bicycle-first-390.png) avoided the previous contrasting serif/italic treatment, but opened with a large generic promise and repeated setup copy. The selected details in its [review state](captures/bicycle-first-review-390.png) sat below that introduction.

The builder's full-page review found contrast and selection-cue defects and eventually returned `Keep` after those repairs. It did not run the separate first-screen gate. A fresh first-screen review of the untouched source and connected states returned **typography Revise, whole-screen Keep**: the repeated pitch delayed review and confirmation details by more than 550px, and some demo copy was too small. The [final page](captures/bicycle-final-390.png) kept much of that composition. A dedicated writing review of the final page returned **Revise** for service descriptions that restated their names and a lower section that repeated the service area and demo explanation. The broad critic had missed that lower-section issue in the builder's accepted pass; a later independent broad review also returned Revise, showing verdict variance.

See [first source](source/bicycle-first/), [final source](source/bicycle-final/), and the `bicycle-*` and `writing-bicycle.json` summaries in [gate-summaries](gate-summaries/). The trial's pointer and keyboard checks passed at 1440, 390 and 320px without page errors or horizontal overflow. Functional success did not settle the visual decision.

## Relay: task hierarchy improved, filler remained

The no-skill baseline's [first phone page](captures/relay-baseline-first-390.png) led with an editorial serif/italic promise and a decorative clock; its sample comparison began much lower, with small labels. Its [final page](captures/relay-baseline-final-390.png) retained that direction. The Seenry version's [final phone page](captures/relay-seenry-final-390.png) placed named availability and the first candidate near the opening. Its first-screen typography critic found 10px participant labels; after a repair, both focused critics returned `Keep`, as did the original full-page critic. The browser trial covered all three candidates and the local result at 1440, 390 and 320px without horizontal overflow.

The Seenry version still ended with a slogan that only restated the comparison. The new writing critic returned **Revise** for that section. Removing it in a separate [probe](captures/relay-trimmed-390.png) eliminated the repetition finding; the critic then found an ambiguous “Use this time” action. After making that action explicitly local and enlarging the demo note, the writing critic returned **Keep**. The whole-screen critic still returned Revise for separate concerns about local-time context and an initially redundant “Compare again” action. The trimmed probe is diagnostic, not a finished replacement or a clean overall verdict.

See [Seenry first source](source/relay-seenry-first/), [Seenry final source](source/relay-seenry-final/), [baseline source](source/relay-baseline-final/), [trimmed probe source](source/relay-trimmed-probe/), and the `relay-*` and `writing-relay*` summaries in [gate-summaries](gate-summaries/).

## Supported change and limits

This evidence supports two narrow workflow changes: require the **first-screen gate as well as the full-page gate** on an expanded page, and add a focused writing critic to the latter so a repeated section cannot pass only because the task itself works. The writing probe flagged redundant lower sections on both briefs, then cleared a version that removed the filler and clarified the action.

The conditions were not a controlled preference study. The Relay executors used different construction sequences, token usage and elapsed cost were unavailable, no user judged the pages, and a model `Keep` is not acceptance. The bicycle brief was already a development case, so its outcome does not prove transfer. No reference-level quality claim is made: the bicycle MCP search returned only a footer without inspectable page pixels, and the Relay executor used no external visual reference.
