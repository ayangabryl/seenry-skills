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
| `plan <file>… [--parts "Nav:72,Hero:560,Pricing"]` | Names the screens you are about to draw. Each shows on the canvas as a placeholder until its file is written; `round` drops the ones that exist. With `--parts`, each part not yet written (by `data-seenry-part`) holds a shimmering block where it will land, at the height after its colon (else a guess from its name), first on the placeholder and then inside the screen at the `<!-- next -->` marker. Each save is patched into the open screen: the new part replaces its block, what is below slides, and Seenry's cursor moves on to the next block. A save that changes the `<head>` reloads the screen out of sight instead |
| `say "…" [--frame <screen>]` | One line on the canvas's live feed, shown on that screen with an Agent tag. Use it for intent, about once per screen; the other commands post their own lines |
| `open [--browser] [--port n]` | Starts the canvas in the background on `127.0.0.1` at a port fixed per project, opens the browser on the options waiting for a pick, prints the address. Inside an agent app it opens no tab and prints the exact call for that app's pane (table below); `--browser` opens a tab anyway. In a cloud session it starts no server and writes `canvas.html` to publish. Prints the time since `init` or `plan` to the first sketch shown, to the person's pick and to the finished build, and keeps them in `canvas.json` (`firstOption`, `picked`, `built`, and `timing` in seconds) |
| `list` | Prints sections, screens, sizes and links as the canvas sees them |
| `problems [screens] [--json]` | The layout problems in the last save, at the screen's width and at 390: sideways overflow, text cut off by its box, a part or text collapsed to nothing, an image that did not load, text drawn over text. Short, so run it after each part. The open canvas checks every save itself, outlines each problem on the screen and labels the frame; this reads its result, or renders the screen headless when the canvas has not checked that save. Exits 1 on any |
| `link` / `sync [push\|pull\|status\|unlink]` | Passed through to `sync.mjs` (below). `link`, or `sync` alone, then starts `sync.mjs watch` in the background; `open` starts it too whenever this machine is linked, so syncing needs no extra step |
| `stop` | Stops the canvas and its sync |

| App (detected by) | `open` prints |
| --- | --- |
| T3 Code (`T3CODE_THREAD_ID`) | Call `preview_open` with target `{"kind": "environment-port", "port": n, "path": "/?embed=1"}` |
| Claude app, Code tab (`CLAUDE_CODE_ENTRYPOINT=claude-desktop…`) | Open it in the Browser pane; also writes a `Seenry canvas` entry on the same port in `.claude/launch.json`. The Claude Code CLI gets a tab |
| Codex app (`CODEX_THREAD_ID`) | Use `@Browser` to open the address. When the sandbox (`CODEX_SANDBOX`) refuses the bind, it says to rerun with escalated permissions |
| Cursor (`CURSOR_AGENT`) | Call `browser_navigate` (Cursor asks the person to approve) |
| VS Code (`TERM_PROGRAM=vscode`) | Call `openBrowserPage` |
| Antigravity, Devin | Use the app's preview tool |
| Cloud (`CLAUDE_CODE_REMOTE=true`, `CONDUCTOR_IS_LOCAL=0`) | No server; publish `canvas.html` |

In an app's pane (an Electron webview, a frame, or `?embed=1`) the canvas follows the app's light or dark setting, screens included until the person presses D, drops its own title row, starts with the screen list closed and switches to one screen at a time below 960px. `?theme=light` or `?theme=dark` fixes the theme. Tested in T3 Code's preview pane; the Claude app and Codex app panes are detected the same way but untested.

Saves reach the page as they land: the server watches the folder and pushes an event (`/events`); the page polls every 1.5 s only when that stream is down.

The script is plain Node with no packages and serves only to `127.0.0.1`. Without the skill installed, download it once from `https://seenry.design/skills/seenry-canvas/scripts/canvas.mjs` into `.seenry/` and run it from there.

## Look and check

These need Playwright in the project, or `--playwright <path to playwright/index.mjs>`. Screens are ids or section names; none means every screen.

| Command | Does |
| --- | --- |
| `render [screens] [--mode light\|dark\|both] [--device phone\|tablet\|desktop\|all] [--scale 2]` | Full-page PNGs in `.seenry/canvas/.renders/` |
| `tree [screens]` | Each element's box, text, link and spec, and the variable behind each style; `!` marks a typed value |
| `verify [screens]` | Rule checks only, in seconds; no model judges a screen. Exits 1 on sideways overflow, clipped text, contrast under 4.5:1 (3:1 for large text) in either mode, text under 12px, unnamed controls, broken links or typed values; warns on small tap targets, missing alt text, a component drawn differently across screens, and lines used badly (a rule running past its content, lines in both directions boxing a group, ruled columns starting at uneven steps) |
| `verify` on sketches | Also exits 1 when a sketch (an option marked `seenry-fidelity` `sketch`) has no `<meta name="seenry-idea">` line of six words or more, or when its hero holds no generated or own image: a png, jpg, webp or avif file in the canvas folder that covers a tenth of the first screen and is not a flat block or a plain gradient. The message gives the `image.mjs` command to run |
| `verify` on the picked page | Also exits 1 when a full page that carries `seenry-idea` never shows its hero image, or an element marked `data-seenry-motif`, below the first screen; warns when it returns only once |
| `verify` on options | Also exits 1 when a desktop option's `data-seenry-product` view shows under 12 kinds of UI or under 2 kinds of visualisation. Warns on a second saturated hue family and on a headline over two lines or 80px (`Allow: multiHue, bigHead` in `.seenry/level.md`). A `wireframe` stage is exempt. These checks need the `seenry` skill installed beside this one |
| `verify --studio` | The full process, when the person asks for it (or `"speed": "studio"` in `canvas.json`). With references in `refs/` and no teardown, writes `.seenry/teardown.md` and full-size crops in `refs/crops/` to fill in, and exits 1 while it has blanks. Puts each option beside up to two references and the worked example and records a blind judge's verdict in `.renders/pair/pair.json`; exits 1 when the judge calls an option a reskin or visibly less finished |
| `verify --judge` | The blind judge alone, for a run nobody can review. A recorded unattended round turns it on too; `--no-judge` turns it off |
| `diff [screens]` | The share of pixels changed since the last render, with a diff image |
| `check` | Typed values per screen, without a browser. Errors from the `mockup` stage on. With a `components.css`, also warns on a screen that redefines one of its classes or does not link it |

## Review

| Command | Does |
| --- | --- |
| `wait [--timeout seconds]` | Blocks until the person presses Send, then prints the feedback. Hosts cap a foreground command near two minutes, so without `--timeout` it returns within 100 s with `Still waiting` and the command to run again (exit 0); the canvas keeps showing Seenry is waiting in between. Feedback already handed over is not returned twice. With `--timeout` it exits 3 when time runs out |
| `feedback` | Prints the last feedback without waiting; exits 3 when it is older than your latest change |

Feedback lists picks, "More like this" requests (each with the three variation modes to answer it), approved screens, screens that need changes, each comment with the element it is pinned to, answers to the review questions, and screens with no answer. It is also saved to `FEEDBACK.md`.

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
| `handoff` | Writes `HANDOFF.md`: every screen with file, size, links and review state, every spec, tokens, fonts, each shared component and its classes, open questions, what was decided against, the change log, the times to the first sketch, the pick and the finished build |
| `pair <screen> <reference> [--height px\|full] [--mode]` | The screen beside a reference image in `refs/` (or a url) at the same width and crop, in `.renders/pair/`, to check a traced structure by eye. `verify --studio` runs it for options; run it by hand for a traced replica. `--no-judge` skips the verdict |
| `compare <screen> <url> [--device] [--mode]` | The built screen beside its design: share of pixels that differ, text missing from the build, differences in size, weight, color, fill, radius and padding, and three images. Exits 1 on any difference |

## When there is no browser

| Situation | Command |
| --- | --- |
| The person cannot open a local address (a cloud session) | `127.0.0.1` is your machine, not theirs: say so. If your environment can publish a folder as a private page, run `static` and publish `canvas.html` with the canvas files beside it; otherwise `shot` writes `canvas.png` of the options waiting for a pick (`--view all` for the whole file). Either way take feedback in chat |
| No server can run | `static` writes `canvas.html`, which opens from disk and copies feedback as text |

## Online, across machines

`scripts/sync.mjs` mirrors the canvas to the person's Seenry account, where they see every linked machine's canvases on the Canvases page, pick and comment, and share a view-and-comment link. The local canvas never depends on it. Once linked, `canvas.mjs open` runs the watch itself, the panel says "Synced to Seenry", and Share copies the canvas's Seenry link; unlinked, Share explains that the address works only on this computer and how to link.

| Command | Does |
| --- | --- |
| `node <skill>/scripts/sync.mjs link [--server url] [--name "Studio iMac"]` | Prints a code and a link; the person approves it while signed in. The token goes to `~/.config/seenry/canvas-sync.json` (mode 0600), never into the project |
| `sync.mjs push [dir]` / `watch [dir]` | Pushes screens, tokens, images and fresh renders; only files whose content changed are uploaded. `watch` pushes on every change and pulls feedback as often as the account's plan allows (the server's `pollSeconds`, 10 s by default); at a plan limit (402) it stops with the server's message, and when rate-limited (429) it waits as told |
| `sync.mjs pull [dir]` | Writes feedback sent online into `feedback.json`, `FEEDBACK.md` and `review.json`, exactly as Send to agent does, so a running or later `wait` gets it |
| `sync.mjs status` / `unlink` | Shows the link and this canvas online / forgets this machine |

References in `refs/`, the archive, hidden files and `canvas.json` stay on the machine. Screens are shown online in a sandbox with no access to the person's account.
