# Pages

Consistency across pages comes from one shell, a small set of section archetypes, and the rule that every page is assembled from them. Define the shell once, record it in `DESIGN.md`, and treat any per-page override as a bug.

## The page shell

| Token | Phone (390) | Desktop (1440) |
| --- | --- | --- |
| Content max width | 100% − 2×gutter | 1200 (1080 text-led) |
| Page gutter | 16–24 | 32–48 |
| Columns / gap | 4 / 16 | 12 / 24 |
| Header height | 48–56 | 56–64 |
| Section rhythm (marketing) | 64 | 96–128 |
| Section rhythm (product) | 24–32 | 32–48 |
| Heading → content gap | 24–32 | 32–48 |

- Header logo, section content and footer columns start on the same x. Check this with the grid overlay on every page.
- Section backgrounds may bleed full-width; content never does (except intentional full-bleed media).
- Use the same heading pattern for every section of a page: e.g. eyebrow 13/500 text-3 → title 32–40/500 → lead 17–18/400 text-2, max-width 640, left-aligned. Do not alternate centered and left-aligned headings between sections.

## Section archetypes

| Archetype | Job | Construction |
| --- | --- | --- |
| Hero | Say what it is and show it | Headline ≤ 10 words, one-sentence lead, 1–2 CTAs, then real product or subject visual. Left-aligned by default; center only when the visual is below. |
| Proof strip | Borrow trust | 5–8 monochrome logos at equal optical size (cap height ~20–24), text-3 opacity, one line label above ("Trusted by…"), or a single hard metric. |
| Feature (split) | Explain one capability | 5/7 or 6/6 split: short title + 2–3 lines + optional link on one side, real UI crop on the other. Alternate sides at most once, or keep the text side fixed. |
| Feature grid | Survey 3–6 capabilities | Bento or 3-column with **different** content per cell: a real UI crop, a number, a short list. Never six identical icon+title+text cards. |
| Deep-dive | Prove depth | Large product visual with 2–4 annotated callouts or a tabbed switcher that swaps the visual. |
| Comparison | Help choose | Table with a sticky header, tabular numbers, check/dash glyphs, the recommended column tinted. |
| Testimonial | Show real users | One large quote (20–24/400) with name, role, company and photo, or a masonry of 6–9 short ones. Real names only. |
| Pricing | Convert | See the pricing tier anatomy in [components](components.md). Toggle monthly/annual above, FAQ below. |
| FAQ | Remove objections | Two-column: title left (sticky), accordion right. 5–8 real questions. |
| CTA | Close | Repeat the hero promise in one line + the same primary CTA. Not a gradient banner. |
| Footer | Navigate | 4–5 link columns 13–14/400 text-2, legal row 12/400 text-3, same content edges as header. |

A landing page is usually: Hero → Proof → 2–3 Features (split or deep-dive) → Feature grid → Testimonial → Pricing or CTA → FAQ → Footer. Remove any section that does not answer a new visitor question.

## Page templates

### Landing / marketing
Shell as above, comfortable density. Hero within the first 640–760px on desktop so the first proof is visible above the fold on a laptop. Phone: headline 32–44px, CTA full-width or paired at 44–48 height, product visual cropped to its most legible part, not shrunk to illegibility.

### Pricing
Title + one-line promise, billing toggle, tiers (shared container, aligned CTAs), comparison table, FAQ, CTA. Prices are the largest type in the tier; plan names are small labels.

### App shell (dashboard, tool)
Sidebar 224–260 (compact) + main area with a 48–56 page header (title 15–17/600, breadcrumbs, actions right). Content padding 24–32. One primary action per page header. Tables and lists fill the width; cards only for heterogeneous summaries. No hero, no gradients, no marketing type sizes.

### Settings
Two-level: left nav of sections (or tabs on phone), content column max 720. Each group: title 15/600 + description 13–14/400 text-2, then rows of `label + help | control` with the control right-aligned on desktop and stacked on phone. Destructive zone last, visually separated. Save per group or autosave with a toast; never one save button at the very bottom of a long page.

### Auth (sign in / sign up)
Single centered column 360–400 wide, logo 24–32, title 20–24/600, provider buttons (full width, 44 tall, provider mark 18) then a divider ("or"), then fields and a primary button. Legal text 12/400 text-3 below. Background plain; an optional product visual on the right half at ≥1024px.

### Docs / article
Three regions at ≥1280: nav 240, reading column 680–720, on-this-page 200. Body 16–17/1.6–1.7, headings 28/24/20 with 48/32/24 above. Code blocks radius md, 13–14 mono, full column width.

### Detail (product, listing, record)
Media left (7 columns), summary right (5 columns, sticky): name 24–32/600, price or key fact, primary action, secondary facts as a definition list. Below: tabs or sections for details, specs, reviews.

### Empty, error, 404
Keep the shell (header, footer, navigation). One short title stating what happened, one line of help, a primary recovery action and a secondary link. No full-screen illustration that pushes recovery below the fold.

## Responsive and international

- **Breakpoints come from content,** not device presets: keep the wide layout until it actually stops fitting, and test the smallest (320) and largest (1920+) widths first.
- **Container queries** for components that live in different widths (a card in a sidebar vs a grid): `container-type: inline-size` on the parent, `@container (min-width: 480px)` on the component.
- **Content bleeds, controls stay inside:** backgrounds and media may run edge to edge; text and controls stay within the gutter and `env(safe-area-inset-*)`.
- **Hint at hidden content:** horizontal scrollers show 16–32px of the next item; collapsed sections have a visible disclosure control. Content with no cue does not exist.
- **Inset phone buttons:** full-width buttons sit inside the 16px gutter with their radius, not flush against the screen edge (unless they are platform chrome).
- **Logical properties** (`margin-inline-start`, `padding-block`, `inset-inline-end`, `text-align: start`) so the layout mirrors for right-to-left languages; physical left/right only for truly physical geometry.
- **Plan for growth:** translated strings run 30–100% longer (short labels grow the most). No fixed widths or heights on text containers; let rows wrap. Test with pseudo-localized text (e.g. `[!!! Šàvé çhàñĝéš !!!]`) and one real long language such as German.
- **Never park a critical action** where zoom, a small viewport or the keyboard clips it: keep it in flow or in stable, safe-area-aware chrome.
- **Mobile browsers** have their own traps (viewport units, tap highlight, input zoom, scroll chaining); see [mobile web](mobile-web.md).

## Consistency checklist

Run across every page before shipping:

- Same content max width, gutter and header height on every page.
- Same heading pattern and alignment for all sections.
- Same button sizes and radius for the same role everywhere.
- Same card inset and radius family everywhere.
- Section spacing uses the rhythm tokens only.
- Phone and desktop screenshots of each page reviewed with the grid overlay on and off.

## Research pages

With Seenry MCP: `search_references` with `page_type` (e.g. `Pricing`, `404`, `Home page`) and `site` for named companies; `get_page` lists section names; `get_screenshot` with `section` returns a crop; `get_design` returns measured type, radius and shadows. Study the same page type from 3 companies before designing yours. See [research](research.md).
