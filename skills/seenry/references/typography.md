# Typography

Type carries most of the perceived quality of an interface. The measured pattern across leading product sites is restraint: one family, few sizes, 2–3 weights, tight display tracking and light display weights.

## Rules

1. **Two families maximum.** One sans for everything functional. Optionally one accent: a serif for editorial voice (Notion uses Lyon, Anthropic uses its serif, Resend uses Domaine for display) or a mono for data, code and small labels (Linear uses Berkeley Mono, Vercel Geist Mono).
2. **Per component: ≤3 sizes, ≤3 weights.** Per page: ≤6 sizes. If you need a fourth size inside a component, you need color (text-2, text-3) or space instead.
3. **Display is light and tight.** Headlines at 400–600 weight, tracking −0.02 to −0.05em, line height 1.0–1.15. Weight 700+ only when the brand typeface is designed for it.
4. **Body is 16px, 1.5 line height,** 60–75 characters per line. Product UI is 13–14px with 20px leading.
5. **Hierarchy through contrast of one variable at a time.** Size OR weight OR color, rarely all three. A 13/500 text-2 label above a 28/500 text-1 value is enough.

## Font choice

Use the brand font if one exists. Otherwise pick for the product's voice, not the default.

| Voice | Sans (UI) | Accent | Notes |
| --- | --- | --- | --- |
| Precise tool | Inter (with `cv11`, `ss01`), Geist | Geist Mono, JetBrains Mono | Linear, Vercel |
| Warm product | Inter Display, Söhne, Figtree, Onest | a text serif (Newsreader, Source Serif 4) | Notion-like |
| Editorial, premium | Neue Montreal, Satoshi, General Sans | Instrument Serif, Fraunces (opsz), EB Garamond, Baskerville | Resend, Anthropic |
| Financial, trustworthy | Söhne, IBM Plex Sans, Inter | IBM Plex Mono | Stripe, Mercury |
| Friendly consumer | Figtree, Plus Jakarta Sans, Nunito Sans (sparingly) | none | round radius family |
| Native feel | system-ui (SF Pro on Apple) | ui-monospace | apps, utilities |

Avoid as defaults: Poppins/Montserrat for product UI, Playfair Display paired with anything, and any font chosen because it "looks modern". Inter is a fine default only when its features and tracking are tuned.

Load only the weights you use (usually 400, 500, 600). Use variable fonts where available; `font-display: swap`; preload the one file used above the fold.

## Scale

A practical scale (px, size/line-height):

| Role | Size / leading | Weight | Tracking |
| --- | --- | --- | --- |
| Display (hero) | 56–80 / 1.0–1.05 | 400–600 | −0.03 to −0.05em |
| H1 (page) | 40–48 / 1.1 | 500–600 | −0.025em |
| H2 (section) | 28–36 / 1.15 | 500–600 | −0.02em |
| H3 (group) | 20–24 / 1.3 | 500–600 | −0.01em |
| Title (card, dialog) | 16–18 / 1.4 | 500–600 | −0.01em |
| Lead | 18–20 / 1.5 | 400 | −0.005em |
| Body | 16 / 1.5 | 400 | 0 |
| UI | 14 / 20 | 400–500 | 0 |
| Small UI | 13 / 20 | 400–500 | 0 |
| Caption, label | 12 / 16 | 500 | 0 to +0.01em |
| Overline (use rarely) | 11–12 / 16 | 500–600 | +0.06em uppercase |

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

## Common failures

| Failure | Fix |
| --- | --- |
| 800-weight gradient-filled hero | 400–600 weight, solid text-1, tight tracking |
| Five weights on one page | 400 + 500 (+ 600 for titles) |
| Labels in all-caps with wide tracking everywhere | Sentence case 13/500 text-2; reserve overlines for one role |
| Body text at text-3 grey | text-2 minimum for anything people read |
| Same size for card title and body, differentiated only by bold | step the title up one size or keep size and change color of the body |
| Centered multi-line paragraphs | left-align anything over two lines |
| Default 1.2 line height on 16px body | 1.5 |
| Headline widows on phone | `text-wrap: balance`, shorter copy |
