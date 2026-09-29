# Benchmarks from leading product sites

Measured from Seenry MCP captures of each site's home page (desktop 1440, phone 390), September 2026. Values are observed rendered CSS, not the companies' specifications. Use them to calibrate: when your hero is 800 weight at 72px with no tracking, the table shows how far that is from what great teams ship.

## Display type

| Site | Families | Desktop hero | Phone hero | Radii (most used first) |
| --- | --- | --- | --- | --- |
| Linear | Inter Variable, Berkeley Mono | 64 / 1.00, w510, −0.022em | 38 / 1.10 | 9999, 8, 50%, 12, 4 |
| Stripe | Söhne (variable) | 48 / 1.15, w300, −0.020em | 34 / 1.03 | 4, 6, 5, 8 |
| Vercel | Geist, Geist Mono | 64 / 1.00, w400, −0.060em | 48 / 1.17 | 9999, 6, 8 |
| Notion | NotionInter, Lyon Text (serif) | 96 / 1.04, w600, −0.048em | 42 / 1.14, −0.036em | 8, 4, 12, 9999 |
| Figma | figmaSans, figmaMono | 56 / 1.00, w400, −0.022em | 36 / 1.00, −0.035em | 9999, 2, 24, 50% |
| Resend | Inter, Domaine (serif display) | 96 / 1.00, w400, −0.010em | 64 / 1.00 | 9999, 16, 6, 8 |
| GitHub | Mona Sans VF | 64 / 1.08, w425, −0.035em | 40 / 1.15 | — |
| Attio | Inter Display, Inter, Tiempos Text | 69 / 0.95, w600, −0.024em | 40 / 0.95 | 8, 9999, 12, 10, 6 |
| Superhuman | Super Sans VF | 64 / 0.96, w540 | 32 / 1.20, −0.028em | 8, 16, 12, 24, 999 |
| Raycast | Inter, Geist Mono | 64 / 1.10, w600 | 36 / 1.10 | 11, 8, 100%, 6, 12, 20 |
| Mercury | Arcadia Display, Arcadia | 49 / 1.10, w480 | 28 / 1.10 | 4, 12, 8, 40, 32 |
| Clerk | Geist, Inter | 64 / 1.12, w700, −0.025em | 32 / 1.12 | 9999, 6, 8, 12, 4 |
| Supabase | Inter, Manrope | 46 / 1.00, w500 | 34 / 1.11 | 8, 9999, 4, 6, 16 |
| Dropbox | Sharp Grotesk, Atlas Grotesk | 40 / 1.20, w500 | 32 / 1.20 | 12, 16, 100, 8, 20 |
| Anthropic | Anthropic Sans, Serif, Mono | 61 / 1.10, w700 | 40 / 1.10 | 8, 24, 16 |
| Loom | Charlie Display, Charlie Text | 63 / 1.03, w700 | 35 / 1.03 | 9999, 12, 8 |
| Apple | SF Pro Display, SF Pro Text | 34–40 / 1.1–1.47, w600, −0.011em | 34 | 980 (pill), 11, 8 |
| Airbnb | Airbnb Cereal VF | 28 / 1.43, w700 (search-led, no display hero) | 28 | 4, 8, 32, 50% |

## What the table says

- **Family count:** every site uses one primary sans. The second family, when present, is a mono (Linear, Vercel, Figma, Raycast) or, in four brands with an editorial voice (Notion, Resend, Attio, Anthropic), a serif used sparingly. In their product UIs the serif largely disappears; it is a marketing voice, not a UI default. None uses two sans families for different roles.
- **Hero weight:** 14 of 18 heroes are 300–600. The four at 700 (Loom, Anthropic, Clerk, Airbnb) build their voice around a heavy weight; three of them use a proprietary face. Default to 400–600.
- **Hero tracking:** negative almost everywhere, from −0.01em to −0.06em. Zero tracking on a 64px headline is a tell.
- **Hero line height:** 0.95–1.15. The browser default 1.2 is too loose for display.
- **Hero size:** desktop 46–96 (median about 64); phone 32–48, about 55–65% of desktop.
- **Body:** 16px on marketing, 14–15px in product UI and dense sections; Linear navigation and buttons are 13px.
- **Weights per page:** most pages render 2–3 weights (Linear 400/510, Stripe 300/400, Vercel 400/450/500, Notion 400/500/600).
- **Radius families:** two clear camps. Pill-plus-soft (9999 buttons with 8–16 cards: Linear, Vercel, Resend, Figma, Clerk, Loom) and sharp (4–8 everywhere: Stripe, Cursor, Supabase, Mercury). Each site keeps 3–5 radius values.
- **Elevation:** rings and hairlines dominate. Linear's most common shadow is `0 0 0 1px rgba(0,0,0,.2)`; Notion stacks 4–6 layers at 1–4% alpha each; Clerk and Resend use 1px rings in oklab/rgba at 5–8%.
- **Spacing tokens seen:** Linear page padding-inline 24, block 64, home inset 32 (8 on phone); Figma section block 80–120 with a 4/6/8/12/16/24/40/56/80/120 scale; Loom 8/16/24/32/40/48/56/80; Notion card padding 32, page inset 16/32/48.

## Composition patterns observed

- **Linear:** left-aligned two-line headline, single-line lead, a "New: …" link on the right, then a full working product view (sidebar, issue, agent panel) with dense 13px UI and specific data (issue IDs, names, relative times).
- **Stripe:** metric eyebrow with a live number, two-tone headline (dark clause + slate continuation) at weight 300, filled primary + outlined secondary with a provider mark, one expressive gradient ribbon confined to the right, logo strip at the fold.
- **Vercel:** extreme reduction: three columns (headline + pill CTAs / brand mark / three short lines), neutral canvas, pill buttons, black primary.
- **Notion:** centered headline with an inline pill highlighting one word, illustrated character row, a real product board with realistic tasks, logo wall.
- **Raycast:** floating translucent nav container, one dramatic brand visual (diagonal red light), centered short headline, a single platform-specific CTA with system requirements in mono below.
- **Resend:** serif display headline, one rendered 3D object on black, a pill eyebrow link, primary button + text link.
- **Pricing (Vercel, Linear):** tiers share one container divided by hairlines; plan name small, price large; "All Hobby features, plus:" inheritance; icons per feature; only the recommended tier's CTA is filled; CTAs aligned across columns.

## Re-measure

These numbers age. For current values, or for any other company, run the recipe in [research](research.md): `list_sites` → `get_design` → read the Typography, Shapes and Elevation sections.
