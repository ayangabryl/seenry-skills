# Canvas commands

Every command is `node <skill>/scripts/canvas.mjs <command>`. The canvas folder defaults to `.seenry/canvas`; pass another with `--dir <path>`. Add `--json` to `list`, `feedback`, `render`, `tree`, `verify`, `diff`, `pair` and `compare` for output you can parse.

## Contents

- Make and open
- Look and check (needs Playwright)
- Review
- Keep the file
- Hand off and compare
- When there is no browser

## Make and open

| Command | Does |
| --- | --- |
| `init` | Creates the folder with `tokens.css`, `wire.css` and `refs/`; ignores itself in git |
| `init --library <path>` | Links a shared design system (another canvas folder) instead of local tokens |
| `open` | Starts the canvas in the background, opens the browser, prints the address |
| `list` | Prints sections, screens, sizes and links as the canvas sees them |
| `stop` | Stops the canvas |

The script is plain Node with no packages and serves only to `127.0.0.1`. Without the skill installed, download it once from `https://seenry.design/skills/seenry-canvas/scripts/canvas.mjs` into `.seenry/` and run it from there.

## Look and check

These need Playwright in the project, or `--playwright <path to playwright/index.mjs>`. Screens are ids or section names; none means every screen.

| Command | Does |
| --- | --- |
| `render [screens] [--mode light\|dark\|both] [--device phone\|tablet\|desktop\|all] [--scale 2]` | Full-page PNGs in `.seenry/canvas/.renders/` |
| `tree [screens]` | Each element's box, text, link and spec, and the variable behind each style; `!` marks a typed value |
| `verify [screens]` | Exits 1 on sideways overflow, clipped text, contrast under 4.5:1 (3:1 for large text) in either mode, text under 12px, unnamed controls, broken links or typed values; warns on small tap targets, missing alt text and a component drawn differently across screens |
| `diff [screens]` | The share of pixels changed since the last render, with a diff image |
| `check` | Typed values per screen, without a browser. Errors from the `mockup` stage on |

## Review

| Command | Does |
| --- | --- |
| `wait [--timeout seconds]` | Blocks until the person presses Send to agent, then prints the feedback. Run it in the background |
| `feedback` | Prints the last feedback without waiting; exits 3 when it is older than your latest change |

Feedback lists picks, "More like this" requests, approved screens, screens that need changes, each comment with the element it is pinned to, answers to the review questions, and screens with no answer. It is also saved to `FEEDBACK.md`.

## Keep the file

| Command | Does |
| --- | --- |
| `round "what changed"` | Resolves every picked option, logs the line on the cover, sets each section's status. Run after every round |
| `status <section> <in-progress\|review\|ready>` | Sets one section's status |
| `resolve <section> [--pick <screen>]` | Keeps the picked option, repoints links to it, archives the others with the reason |
| `archive <screen> --reason "…"` | Moves one screen to `archive/` |
| `log "…"` | Adds one line to the change log |

## Hand off and compare

| Command | Does |
| --- | --- |
| `handoff` | Writes `HANDOFF.md`: every screen with file, size, links and review state, every spec, tokens, fonts, components, open questions, what was decided against, the change log |
| `pair <screen> <reference> [--height px\|full] [--mode]` | The screen beside a reference image in `refs/` (or a url) at the same width and crop, in `.renders/pair/`, to check a traced structure by eye |
| `compare <screen> <url> [--device] [--mode]` | The built screen beside its design: share of pixels that differ, text missing from the build, differences in size, weight, color, fill, radius and padding, and three images. Exits 1 on any difference |

## When there is no browser

| Situation | Command |
| --- | --- |
| The person cannot open a local address (a cloud session) | `shot` writes `canvas.png` of the whole canvas; show it and take feedback in chat |
| No server can run | `static` writes `canvas.html`, which opens from disk and copies feedback as text |
