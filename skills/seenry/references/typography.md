# Typography

Type carries most of the perceived quality of an interface and is the quickest tell of a generated page. Two things together: a **voice** that comes from the art direction ([art direction](art-direction.md)), and **restraint** in how it is used: few sizes, 2–3 weights, tuned tracking.

## Rules

1. **A voice, then a workhorse.** Brand surfaces (landing, product, marketing) pair a display face with character, chosen from the concept, with a text face for reading; one superfamily with width or optical-size axes also works. Product UI stays quiet (one text face at 13–15px, mono for data) and carries the brand in its wordmark, titles, big figures and status marks. Untuned Inter or `system-ui` as the only face on a brand surface reads as a template. A serif is right when the concept is editorial, archival or craft; it is never a shortcut to "premium", and never an italic accent word inside a sans headline.
2. **Per component: ≤3 sizes, ≤3 weights.** Per page: ≤7 sizes. If you need a fourth size inside a component, you need color (text-2, text-3) or space instead.
3. **Display is tight and medium, not heavy.** Headlines at 500–600 weight (400 is fine for large, clean grotesques like Geist), tracking −0.02 to −0.04em, line height 1.0–1.15. 700+ only for rounded or friendly faces built for it (Nunito, Open Runde, SF Rounded) or a brand that owns a heavy voice.
4. **Body is 16px, 1.5 line height,** 60–75 characters per line. Product UI is 13–15px with 20px leading.
5. **Weights are fixed by role.** 400 for reading text and table cells, 500 for labels, nav, buttons and column headers, 600 for page and section titles and the key figure. Display type may drop to 400–500 at large sizes. Never 700+ in product UI; never more than three weights on a page; never bold to fix hierarchy that size, color or space should fix.
6. **Hierarchy through one variable at a time.** Size OR weight OR color. A 13/500 text-2 label above a 28/600 text-1 value is enough.

## Font choice

Use the brand font if one exists. Otherwise pick by product type. All of these are free unless marked.

| Product type | First choice | Alternatives | Pair with |
| --- | --- | --- | --- |
| Pro tool, dev tool, SaaS | Inter (Display cut for ≥ 24px) | Geist, Söhne (paid), Manrope | Geist Mono, JetBrains Mono |
| Apple-platform app or Apple-feel web | SF Pro via `system-ui` / `-apple-system` | Inter | SF Mono via `ui-monospace` |
| Friendly consumer, social, health, kids, games | Open Runde | Nunito, SF Pro Rounded (`ui-rounded`), Figtree | none |
| Fintech, banking, trust | Inter | Söhne (paid), IBM Plex Sans, Geist | IBM Plex Mono |
| Marketplace, travel, commerce | Inter | DM Sans, Plus Jakarta Sans, Figtree | none |
| Creative, portfolio, agency | Geist | Satoshi, General Sans, Neue Montreal (paid) | Geist Mono |
| Editorial, publishing, luxury (only these) | a sans for UI | + a text serif: Newsreader, Source Serif 4 | — |

Rounded faces (Open Runde, Nunito, SF Rounded) pair with the round radius family (16–32 + pill). Neutral grotesques (Inter, Geist, SF Pro) fit soft or sharp families.

Tune whatever you choose: Inter needs `font-feature-settings: "cv11", "ss01", "ss03"` and tightened display tracking to look deliberate; untuned Inter at default tracking is the generic look, not Inter itself.

Load only the weights you use (usually 400, 500, 600). Use variable fonts where available; `font-display: swap`; preload the one file used above the fold. Open Runde and Inter ship as OFL files you can self-host; SF Pro must come from the system stack on the web, never a downloaded file.

## Scale

A practical scale (px, size/line-height):

| Role | Size / leading | Weight | Tracking |
| --- | --- | --- | --- |
| Display (hero) | 48–72 / 1.0–1.05 | 500–600 | −0.025 to −0.04em |
| H1 (page) | 40–48 / 1.1 | 500–600 | −0.025em |
| H2 (section) | 28–36 / 1.15 | 500–600 | −0.02em |
| H3 (group) | 20–24 / 1.3 | 500–600 | −0.01em |
| Title (card, dialog) | 16–18 / 1.4 | 500–600 | −0.01em |
| Lead | 18–20 / 1.5 | 400 | −0.005em |
| Body | 16 / 1.5 | 400 | 0 |
| UI | 14 / 20 | 400–500 | 0 |
| Small UI | 13 / 20 | 400–500 | 0 |
| Caption, label | 12 / 16 | 500 | 0 to +0.01em |

Phone display is about 55–65% of desktop: 64 → 38–40, 96 → 44–56. Use `clamp()` so display scales with the viewport between the two measured points.

Tracking scales inversely with size. Large text needs negative tracking; text below 13px may need +0.01em. Never track body text negatively below 16px.

## Numbers

- `font-variant-numeric: tabular-nums` on anything that updates, aligns in columns or sits next to other numbers (prices in tiers, times, tables, counters).
- Use real minus signs (−), en dashes for ranges (9–5), and non-breaking spaces between numbers and units.
- Currency and units are smaller or lighter than the figure in stat tiles.

## Wrapping and overflow

- `text-wrap: balance` on headings; `text-wrap: pretty` on paragraphs to avoid orphans.
- Set `max-width` in `ch` for reading text (`max-width: 65ch`).
- Truncate single-line UI labels with `min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` and expose the full text in a title or tooltip. Multi-line: `-webkit-line-clamp`.
- Avoid a one-word last line in headlines; rewrite the headline rather than inserting `<br>` that breaks on phone.
- Hanging punctuation for large pull quotes (`hanging-punctuation: first`, or a negative text-indent).

## OpenType and rendering

- Inter: `font-feature-settings: "cv11", "ss01", "ss03"` gives a single-storey a and cleaner shapes; `"tnum"` for figures.
- Use optical sizes (`font-optical-sizing: auto`) when the font has an `opsz` axis.
- `-webkit-font-smoothing: antialiased` on dark backgrounds and for light display weights on macOS.
- Real small caps (`font-variant-caps: all-small-caps`) for acronyms in body copy if the font supports them.

## Rendering details

- **Load the real faces.** Browsers fake missing bold and italic ("synthesis"), which looks smeared. Load every weight and style you use; `font-synthesis: none` only after checking nothing needs a synthesized form.
- **Properties over raw feature tags:** `font-weight: 550` not `font-variation-settings: "wght" 550`; `font-optical-sizing: auto`; `font-variant-numeric: tabular-nums`; keep `font-feature-settings` for stylistic sets (`"ss01"`, `"cv11"`).
- **Weight floor:** nothing lighter than 400 below 18px; weights under 300 are display-only above 28px.
- **Heading sizes descend with level;** a child heading never outweighs its parent. Pick the element for structure, size it with CSS.
- **Line height by role:** display 1.0–1.1, headings 1.1–1.25, body 1.5–1.6, and at least 1.4 on anything that wraps to three lines, even in a tight card.
- **Letter spacing by size:** negative above 24px, zero for body, +0.02–0.06em only for an acronym or a keyboard key; no uppercase labels above titles.
- **Underlines from the font:** `text-underline-position: from-font; text-decoration-thickness: from-font; text-underline-offset: 0.15em; text-decoration-skip-ink: auto`. A dotted underline signals a definition or abbreviation. Animate only the underline's color; for a moving underline draw a separate element.
- **Smart punctuation in rendered text:** curly quotes (“ ” ‘ ’), an en dash for ranges (9–5), an em dash for breaks, one ellipsis character (…), a real minus (−), `&nbsp;` between a number and its unit, `&shy;` where long words may break. Straight quotes stay in code.
- **Store natural case,** style with `text-transform`, so a redesign never rewrites copy.
- **Truncation keeps content reachable:** a tooltip, `title`, or expanded view for anything cut with an ellipsis or `line-clamp`.
- **Language and direction:** `lang` on the document (and on quoted passages in other languages) for correct hyphenation, quotes and screen-reader pronunciation; `dir` where direction changes; `<bdi>` around user-generated names and values in mixed-direction text; `hyphens: auto` only on long-form text with `lang` set.
- **Selection:** keep text selectable; `user-select: none` only on drag handles and gesture surfaces. Style `::selection` with the accent-subtle token.
- **Smoothing once, on the root:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale` in the global stylesheet, never per component.
- **Inputs at 16px on phones** to stop iOS zoom (see [mobile web](mobile-web.md)).
- **Units:** font sizes in `rem` so browser text-size settings work; `clamp()` for fluid display sizes with a `rem` floor.
- **Serve WOFF2,** subset to the scripts you need, `font-display: swap`, and match fallback metrics (`size-adjust`, `ascent-override`) so the swap does not shift layout.

## Common failures

| Failure | Fix |
| --- | --- |
| 800-weight gradient-filled hero | 500–600 weight, solid text-1, tight tracking |
| The fashionable default faces (Instrument Serif, Playfair, Fraunces, Space Grotesk, Clash Display, untuned Inter) | A pairing chosen from the concept, with the reason written down |
| Italic serif accent word inside a sans headline | Remove; let the display face carry the whole line |
| Supporting text at 11–12px and text-3 grey | ≥ 15px supporting copy, ≥ 13px metadata, text-2 contrast |
| Five weights on one page | 400 + 500 (+ 600 for titles) |
| Labels in all-caps with wide tracking, eyebrows above titles | Sentence case 13/500 text-2; no eyebrows |
| Body text at text-3 grey | text-2 minimum for anything people read |
| Same size for card title and body, differentiated only by bold | step the title up one size or keep size and change color of the body |
| Centered multi-line paragraphs | left-align anything over two lines |
| Default 1.2 line height on 16px body | 1.5 |
| Headline widows on phone | `text-wrap: balance`, shorter copy |
| Faux bold or italic (weight not loaded) | load the face, or drop the style |
| Light (300) weight on 14px UI text | 400+ below 18px |
| Straight quotes and three-dot ellipses in UI copy | “smart” quotes, …, – for ranges |
| Underline cutting through descenders | `text-decoration-skip-ink: auto` + `from-font` metrics |
| `user-select: none` across the app | only on drag and gesture surfaces |
