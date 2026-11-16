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
| `plan <file>…` | Names the screens you are about to draw. Each shows on the canvas as a placeholder until its file is written; `round` drops the ones that exist |
| `say "…" [--frame <screen>]` | One line on the canvas's live feed, shown on that screen with an Agent tag. Use it for intent, about once per screen; the other commands post their own lines |
| `open [--browser]` | Starts the canvas in the background, opens the browser on the options waiting for a pick, prints the address. Inside T3 Code, the Claude app or the Codex app it opens no tab and prints the address to show in the app's preview pane; `--browser` opens a tab anyway. The first time options are on it, prints the time since `init` or `plan` and keeps it in `canvas.json` and `HANDOFF.md` |
| `list` | Prints sections, screens, sizes and links as the canvas sees them |
| `stop` | Stops the canvas |

The script is plain Node with no packages and serves only to `127.0.0.1`. Without the skill installed, download it once from `https://seenry.design/skills/seenry-canvas/scripts/canvas.mjs` into `.seenry/` and run it from there.

## Look and check

These need Playwright in the project, or `--playwright <path to playwright/index.mjs>`. Screens are ids or section names; none means every screen.

| Command | Does |
| --- | --- |
| `render [screens] [--mode light\|dark\|both] [--device phone\|tablet\|desktop\|all] [--scale 2]` | Full-page PNGs in `.seenry/canvas/.renders/` |
| `tree [screens]` | Each element's box, text, link and spec, and the variable behind each style; `!` marks a typed value |
| `verify [screens]` | Exits 1 on sideways overflow, clipped text, contrast under 4.5:1 (3:1 for large text) in either mode, text under 12px, unnamed controls, broken links or typed values; warns on small tap targets, missing alt text, a component drawn differently across screens, and lines used badly (a rule running past its content, lines in both directions boxing a group, ruled columns starting at uneven steps) |
| `verify --quick [screens]` | The rule checks only: no pair renders and no judge, in seconds. Use it while iterating; it says so in its output, and it never replaces a full `verify` before you show anything |
| `verify` on options | With references in `refs/` and no teardown, writes `.seenry/teardown.md` and full-size crops in `refs/crops/` to fill in. Puts each option beside up to two references (the ones `compose.md` names, else the first level image and the first reference) and records the judge's verdict in `.renders/pair/pair.json`; a pair is redone only when the screen changed. Also exits 1 when `.seenry/teardown.md` still has blanks or holds no measurements per reference, when the blind judge calls an option a reskin of a reference or visibly less finished than it, and when a desktop option's `data-seenry-product` view shows under 12 kinds of UI or under 2 kinds of visualisation. Warns on a second saturated hue family and on a headline over two lines or 80px (`Allow: multiHue, bigHead` in `.seenry/level.md`). A `wireframe` stage is exempt. The product, hue and headline checks need the `seenry` skill installed beside this one |
| `diff [screens]` | The share of pixels changed since the last render, with a diff image |
| `check` | Typed values per screen, without a browser. Errors from the `mockup` stage on. With a `components.css`, also warns on a screen that redefines one of its classes or does not link it |

## Review

| Command | Does |
| --- | --- |
| `wait [--timeout seconds]` | Blocks until the person presses Send to agent, then prints the feedback. Run it in the background |
| `feedback` | Prints the last feedback without waiting; exits 3 when it is older than your latest change |

Feedback lists picks, "More like this" requests, approved screens, screens that need changes, each comment with the element it is pinned to, answers to the review questions, and screens with no answer. It is also saved to `FEEDBACK.md`.

## Keep the file

| Command | Does |
| --- | --- |
| `round "what changed"` | Resolves every picked option, logs the line on the cover, sets each section's status. A section holding a picked sketch stays In progress until the sketch is extended. Run after every round |
| `round "what you chose and why" --unattended "why nobody can review"` | The same, for a run with no person: records the reason in `canvas.json`, approves nothing. `check.mjs` accepts the record and reports the screens as unapproved |
| `status <section> <in-progress\|review\|ready>` | Sets one section's status |
| `resolve <section> [--pick <screen>]` | Keeps the picked option, repoints links to it, archives the others with the reason |
| `archive <screen> --reason "…"` | Moves one screen to `archive/` |
| `log "…"` | Adds one line to the change log |

## Hand off and compare

| Command | Does |
| --- | --- |
| `handoff` | Writes `HANDOFF.md`: every screen with file, size, links and review state, every spec, tokens, fonts, each shared component and its classes, open questions, what was decided against, the change log, the time to the first option |
| `pair <screen> <reference> [--height px\|full] [--mode]` | The screen beside a reference image in `refs/` (or a url) at the same width and crop, in `.renders/pair/`, to check a traced structure by eye. `verify` runs it for options; run it by hand for a traced replica. `--no-judge` skips the verdict |
| `compare <screen> <url> [--device] [--mode]` | The built screen beside its design: share of pixels that differ, text missing from the build, differences in size, weight, color, fill, radius and padding, and three images. Exits 1 on any difference |

## When there is no browser

| Situation | Command |
| --- | --- |
| The person cannot open a local address (a cloud session) | `127.0.0.1` is your machine, not theirs: say so. If your environment can publish a folder as a private page, run `static` and publish `canvas.html` with the canvas files beside it; otherwise `shot` writes `canvas.png` of the options waiting for a pick (`--view all` for the whole file). Either way take feedback in chat |
| No server can run | `static` writes `canvas.html`, which opens from disk and copies feedback as text |

## Online, across machines

`scripts/sync.mjs` mirrors the canvas to the person's Seenry account, where they see every linked machine's canvases on the Canvases page, pick and comment, and share a view-and-comment link. The local canvas never depends on it.

| Command | Does |
| --- | --- |
| `node <skill>/scripts/sync.mjs link [--server url] [--name "Studio iMac"]` | Prints a code and a link; the person approves it while signed in. The token goes to `~/.config/seenry/canvas-sync.json` (mode 0600), never into the project |
| `sync.mjs push [dir]` / `watch [dir]` | Pushes screens, tokens, images and fresh renders; only files whose content changed are uploaded. `watch` pushes on every change and pulls feedback every 10 seconds |
| `sync.mjs pull [dir]` | Writes feedback sent online into `feedback.json`, `FEEDBACK.md` and `review.json`, exactly as Send to agent does, so a running or later `wait` gets it |
| `sync.mjs status` / `unlink` | Shows the link and this canvas online / forgets this machine |

References in `refs/`, the archive, hidden files and `canvas.json` stay on the machine. Screens are shown online in a sandbox with no access to the person's account.
