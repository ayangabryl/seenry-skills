# Typography

Type carries most of the perceived quality of an interface. The measured pattern across leading product sites is restraint: one family, few sizes, 2–3 weights, tight display tracking and medium display weights.

## Rules

1. **One sans family does everything.** Big product apps almost never use a display serif: Linear, Vercel, Stripe, Raycast, Airbnb, Spotify, Apple, GitHub, Figma, Supabase and Shopify are all one sans. The optional second family is a **mono** for code, data and small technical labels. A serif is a brand decision (publishing, luxury, wine, law, a literary product), never a default for "premium" or "calm".
2. **Per component: ≤3 sizes, ≤3 weights.** Per page: ≤6 sizes. If you need a fourth size inside a component, you need color (text-2, text-3) or space instead.
3. **Display is tight and medium, not heavy.** Headlines at 500–600 weight (400 is fine for large, clean grotesques like Geist), tracking −0.02 to −0.04em, line height 1.0–1.15. 700+ only for rounded or friendly faces built for it (Nunito, Open Runde, SF Rounded) or a brand that owns a heavy voice.
4. **Body is 16px, 1.5 line height,** 60–75 characters per line. Product UI is 13–15px with 20px leading.
5. **Hierarchy through one variable at a time.** Size OR weight OR color. A 13/500 text-2 label above a 28/600 text-1 value is enough.

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
| 800-weight gradient-filled hero | 500–600 weight, solid text-1, tight tracking |
| Serif display headline (Instrument Serif, Playfair, Fraunces) on a product page | The product's sans at 500–600, tight tracking; serif only for editorial brands |
| Italic serif accent word inside a sans headline | Remove; emphasize with color or weight of the same family |
| Five weights on one page | 400 + 500 (+ 600 for titles) |
| Labels in all-caps with wide tracking everywhere | Sentence case 13/500 text-2; reserve overlines for one role |
| Body text at text-3 grey | text-2 minimum for anything people read |
| Same size for card title and body, differentiated only by bold | step the title up one size or keep size and change color of the body |
| Centered multi-line paragraphs | left-align anything over two lines |
| Default 1.2 line height on 16px body | 1.5 |
| Headline widows on phone | `text-wrap: balance`, shorter copy |
