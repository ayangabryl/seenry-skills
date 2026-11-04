# Sketch first

When a person is in the conversation, show them the design before you build it. A thirty-second choice between two or three sketches replaces hours of build-and-critic loops, and the person's eye catches what blind critics miss (a font that is not premium, a palette that reads as AI-made, too many raised buttons).

## When

- **Sketch:** a new page or screen, a redesign, an unslop, the choice of an app system or identity, and any change where two reasonable designers would differ.
- **Skip:** a bug, one control or one state, copy edits, and work inside an existing app's system where the answer is "match the neighbours".
- **Nobody to ask** (headless, scheduled or one-shot runs, or the person said "just build it"): skip the sketches and let `pick.mjs` choose blind, as the flow describes.

## What a sketch is

- **One decision per sketch.** Two or three options side by side for a single question (where things go, the main button, the type pairing, the dark theme), labelled A, B, C, with a short caption each. Never a menu of six.
- **Same content in every option,** so the only difference is the decision. Use the real copy and real data from the brief, not lorem ipsum.
- **One recommendation,** marked in its caption, with the reason in one line of your reply.
- **Low fidelity on purpose.** Real layout, real type sizes and real words; grey blocks for imagery; color only when color is the decision. A sketch takes a minute or two, not a build.
- **Phone-sized when the screen is mobile-first,** desktop otherwise. Show what the person will actually judge.

## How to show it

The sketch is a small HTML file per option (`.seenry/sketch/a.html`, `b.html`, `c.html`), so it works in every host. Show it the most direct way the host allows:

| Host | Show it |
| --- | --- |
| Has an inline visual or widget tool (Claude apps) | Render the options there, with one button per option that sends the choice back |
| Terminal agents (Codex CLI, Claude Code CLI, Cursor, Copilot) | Run `scripts/sketch.mjs` with `--open` (below): it opens a side-by-side board in the person's browser and writes `board.png`; give both paths in the reply |
| The person is away or on a phone | Send `board.png` with the host's file or image tool, or publish `board.html` where the host can share a page |
| No browser and no Playwright | Describe each option in one or two lines and ask; never block on the visual |

```
node scripts/sketch.mjs a.html b.html c.html --captions "Glazed key|Flat clay|Ink primary" --recommend B --open
```

Keep the explanation in your reply, not inside the sketch: the question, the options in one line each, and your recommendation. Ask the person to answer with the letter.

## Order of decisions

Ask the questions that change the most first, and stop when the rest follow from the answers:

1. **Structure:** what is on the screen and where (the inventory laid out).
2. **Identity:** the type voice, the color world, the material of the primary action.
3. **Signature:** the one crafted component and how it moves.

Three questions is usually enough. Record each answer in `.seenry/decisions.md` (question, options, choice, the person's words), and treat it as fixed: later steps never quietly reverse a choice the person made.

## Then build once

After the last answer, build the chosen direction in full and run the gate once in quick mode. The research, identity and motion steps still run, but they serve the chosen direction instead of exploring new ones.

When the person picked the identity, record it so the gate knows the exploration step is done:

```
node scripts/pick.mjs a.html b.html c.html --person B --why "flat clay, calmer than the glazed key"
```

`--person` writes `pick.json` from the person's choice without asking a model. The sketches can serve as the board files.
