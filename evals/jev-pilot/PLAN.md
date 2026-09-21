# Seenry + Jev pilot

Status: prepared; no live Jev result or new website quality claim yet.

## Question

Does optional Jev selection help choose useful information architecture within a Seenry-authored set of alternatives? This pilot does not establish aesthetic superiority, general performance or parity with MCP references.

## First case

Use the same Seenry marketing brief, facts and evidence for both routes. The existing `examples/seenry-site` is a teaching artifact, not a newly generated Jev result. Its current page remains untouched.

Baseline selection recorded before live evaluation: proof_first + working_site. This is the host agent's contextual choice, not a human preference label. Jev receives the three alternative reading orders plus an abstention and an independent evidence choice; it does not receive the baseline answer.

The first live run checks response validity and whether the selection is useful enough to render. Follow with a reordered-choice control and an out-of-scope brief that should permit abstention. A matching choice alone proves neither better design nor better taste.

## Rendered comparison, after live decisions

Retain three low-fidelity alternatives with identical product facts before building a finished candidate. Hold copy, assets, viewport and implementation time constant between baseline and Jev-assisted routes. Reuse legitimate local fonts/assets with their existing provenance. If both choose the same direction, report that rather than manufacture a difference.

Inspect the full hero and its bottom boundary, every body section and footer at 1440, 390 and 320 CSS pixels. Compare individual sections at readable scale; a tall thumbnail only establishes macro rhythm. Exercise the principal action, navigation, an interactive example, keyboard and reduced motion. Keep missing observations unverified. Only a user review can supply human preference labels.

## Limits and spend

At most 12 calls across this pilot, no automatic retries, no generation loops. The runner reserves 65,536 input tokens per attempt at the documented $0.042/million rate: $0.002752512 per call, at most $0.033030144. This is a conservative estimate under the pinned model's published limits, not an account-side billing limit. It records actual returned token usage separately. No paid API call occurs during dry-run or unit tests.

Sources: https://docs.typesafe.ai/models.md and https://docs.typesafe.ai/api.md, checked 2026-09-22. json-render's Jev experiment informs the separation of prepared candidates, typed decisions and code-owned rendering; this pilot does not install or use its experimental composer.
