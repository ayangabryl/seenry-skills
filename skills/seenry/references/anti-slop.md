# Anti-slop check

Run this list against the rendered page (desktop 1440 and phone 390) before showing it and again before reporting. Each item is a pattern that marks an interface as generated. Fix every hit or state why it is deliberate.

## Layout

| Tell | Fix |
| --- | --- |
| Centered hero + centered paragraph + two buttons + gradient blob behind | Left-align, show the product, one visual idea |
| Three identical icon-title-text cards ("Fast", "Secure", "Scalable") | Different content per cell: a UI crop, a number, a list; or cut the section |
| Every section a centered heading over a 3-column grid | Vary archetypes: split, deep-dive, table, quote |
| Section edges that don't align with the header logo | One container token for all regions |
| Off-grid spacing (10, 15, 18, 22, 30px) or random `mt-[13px]` | Snap to the 4/8 scale; fix grouping instead |
| Equal spacing everywhere, so nothing groups | Within-group gap ≤ half the between-group gap |
| Content stretched to 1440+ with 20px text lines 150 characters long | Max widths: 1200 layout, 65ch text |
| Hero taller than the viewport with nothing but a headline | Hero ≤ 760px desktop; first proof visible above the fold |

## Type

| Tell | Fix |
| --- | --- |
| 700–800 weight hero, default tracking, 1.2 line height | 400–600, −0.02 to −0.05em, 1.0–1.1 |
| Gradient-filled headline text | Solid text-1; color the accent word at most |
| The fashionable default faces (Instrument Serif, Playfair, Fraunces, Space Grotesk, Clash Display) or untuned Inter/`system-ui` as the whole identity | A pairing from the concept with a written reason ([art direction](art-direction.md)) |
| Italic serif accent word inside a headline ("better *together*") | One face per headline; the display face carries it |
| More than 3 sizes or 3 weights inside one component | Remove one; use color or space for hierarchy |
| A display font picked for novelty with no link to the product | Display face from the concept; workhorse text face; mono only for data |
| Uppercase letter-spaced label (eyebrow) above a title | Remove it. The title says it; if context is needed, put it in the lead sentence |
| Numbered labels: "01 /", "(001)", "No. 03", "§2" | Remove. Numbers only where order is real (steps in a form), shown as plain figures |
| Heavy weights (700–900) or more than three weights on a page | 400 text, 500 labels and controls, 600 titles and key figures |
| Body text in light grey that fails contrast | text-2 minimum |
| Prices and numbers jumping width | `tabular-nums` |

## Color and surface

| Tell | Fix |
| --- | --- |
| The default palettes: cream + terracotta/orange, forest green + cream, plum + peach, black + one neon | Sample the palette from the concept's material and name its origin |
| Only neutrals and one accent, so the page is unrecognizable at thumbnail size | One bold field: a dark or saturated band or surface |
| Purple/indigo-to-pink gradients on buttons, text and backgrounds | One accent, solid; one expressive visual at most |
| Glassmorphism cards on a gradient mesh | Solid surfaces with a ring |
| Every card with `shadow-lg` and `rounded-2xl` | Ring or hairline; shadow only on floating layers |
| Divider lines everywhere: a rule under every header, between every row, around every card, under every tab bar | Space and tone: group by spacing, tint the selected or open row, nest panels one surface step apart; at most one faint ring per surface |
| Same radius on parent and inset child | `inner = outer − inset` |
| Mixed radius families (pill buttons, 4px inputs, 24px cards, 12px images) with no rule | One scale of ≤4 values + pill, applied by role |
| Colored left-border "accent" on cards and alerts | Tint or icon; no stripe |
| Neon glows and outer glows on dark UI | Inner hairline and surface steps |
| Accent color used for headings, icons and borders | Accent only on actions, selection, focus |

## Material and composition

| Tell | Fix |
| --- | --- |
| Stock music and product clichés: sunset-circle cover art, a vinyl sliding from a sleeve, a kraft bag with a colored band, tilted UI with sticker badges | Material from the concept: photographed places and objects, the real product UI |
| "01 / 02 / 03" step rows, "Most popular" middle tier, accent CTA band before the footer | Use each only when the content needs it; vary section archetypes |
| Gradient or flat color block standing in for a photo, cover or avatar | Real image via `seenry-assets` (sourced or generated), or remove the slot |
| Elements that align to nothing (a centered control row under a left-aligned block) | Anchor each element to a keyline |
| Title beside an image aligned by its line box, so the capitals sit below the image top | `text-box: trim-both cap alphabetic`; cap top = image top ([alignment](alignment.md)) |
| Edges 2–6px apart (icon glyph vs text edge, bar vs image edge) | Exact, or at least 8px apart |
| Unequal accidental padding (12/16/20/12 to the ink) | Equal optical inset on all sides |
| Play triangle, arrow or chevron centered by its box | Center on ink box + centroid midpoint ([optical](optical.md)) |
| Label sitting low in a pill or button | `text-box: trim-both cap alphabetic`, equal padding-block |
| Large headline starting right of the body text below | Pull back the side bearing (−0.02 to −0.06em) |
| Card nested in a tinted panel with the same radius, or overflowing it | Concentric radii and inset, or drop the panel |
| Everything the same size and weight | One dominant element, clear subordinates |
| No fine detail anywhere | One detail layer: metadata, tabular figures, live values |
| The first layout shipped without alternatives | Explore 3 compositions in the frame and critique ([exploration](exploration.md)) |

## Content

| Tell | Fix |
| --- | --- |
| "Unlock", "Supercharge", "Elevate", "Seamless", "Revolutionize" | Concrete mechanism and result |
| Lorem ipsum, John Doe, Acme Inc, $99.99, 10,000+ happy customers | Domain-plausible, varied, internally consistent data |
| Fake testimonials with stock avatars | Real quotes, or no testimonial section |
| Emoji as icons or bullet points | One icon family |
| Dashboard hero with meaningless charts | Real product view with plausible data |
| Tilted floating screenshot with heavy shadow | Straight, cropped UI with the card's ring and radius |
| Stats row "99.9% uptime · 10x faster · 24/7 support" without source | One real, attributable number or none |

## Components

| Tell | Fix |
| --- | --- |
| Two or more filled primary buttons side by side | One primary; the other secondary or text |
| Hover effects that lift cards (`translateY(-2px)` and up) or scale them, especially with a growing drop shadow | One-step surface or border change; press feedback (`scale(.97)`) belongs on `:active` |
| Icons at different sizes and stroke weights | 16/20/24, one stroke |
| Missing focus, empty, error and loading states | Render all states (see [components](components.md)) |
| Modal for everything | Inline edit, popover or page by consequence |
| Toggle, checkbox and radio used interchangeably | Toggle = immediate, checkbox = submit later, radio = one of many |

## Phone

| Tell | Fix |
| --- | --- |
| Desktop layout squeezed: 4 columns at 390px, 10px text | Reflow to 1–2 columns; 16px body |
| Headline breaking into one word per line | Smaller display size (55–65% of desktop), `text-wrap: balance` |
| Horizontal scroll from a wide element | Contain the element; check at 320px |
| Tap targets under 44px, buttons touching edges | 44px targets; 16–24px gutters |
| Hamburger menu hiding the only CTA | Keep the primary CTA visible in the header |
| Horizontally scrolling nav tabs clipped at the edge | Bottom tab bar, menu or fewer items |
| Sticky action bar covering content in the full-page render | Keep the action in flow; show a sticky copy only after it scrolls away |
| Tall cards for each row in a phone list | Compact rows with the key figure on the right |

## Measure it

Run [the system audit](../scripts/system_audit.mjs) in the page (Playwright or the browser console) to count distinct font sizes, weights, families, radii, shadows and colors, list off-grid paddings, gaps and margins, and flag nested radius violations. Numbers do not replace looking, but they catch drift you stop seeing after the third iteration.

## The blocked list in full

The never-ship table in SKILL.md is the summary; this is the complete list with its exceptions. Size floors are in [the standard](standard.md#size-floors), not here.

Leading teams look premium for one root reason: they ranked the job, then removed everything that does not serve it. Calm is the visible result. The reasons behind each rule are in [premium](premium.md).

**Never ship these (check.mjs blocks most of them):**
- Eyebrows by reflex: a short small line above a title, in any case ("Good to know", "Your neighborhood yoga studio" over the h1). Cut it; the title says it, and card facts such as duration or level go under the title. Uppercase letter-spaced labels are slop anywhere.
- Numbered labels: "01 /", "(001)", "No. 03", "Step 01". Numbers only where order is real, as plain figures.
- The exception is a label or marker system that is the identity's own device, the way a studio uses one: one consistent marker or index that comes from this brand's idea on every section, in sentence case, set with the same care as the headlines. Mark its elements `data-seenry-device="<name>"`; review_board treats a small marker as a system and flags it when it appears fewer than three times. A graphic device (a diagram, step circles, a timeline) is the opposite: use it once or twice where it explains most, never in hero, middle and closing alike (review_board flags three or more sections). Uppercase letter-spaced labels stay out.
- Weights of 700 or more in UI, or more than three weights on a page.
- Italic serif accent words in headlines; trendy default faces used for flavor (Instrument Serif, Fraunces, Playfair, Space Grotesk, Clash Display).
- The default AI palettes: cream + terracotta or orange, plum + peach, navy + lime, forest green + cream as a costume, purple gradients.
- Clip-art imagery: sunset circles, vinyl records, flat SVG product stand-ins, tilted floating cards with sticker badges, gradient blobs, glows.
- Colored KPI hero cards with rings or stripes, a decorative icon tile in every card (icons that help people recognize an option or a section are fine), a card per row, saturated pill badges down a column.
- Generic slogans ("X is better together", "Built for the way you Y"), fake stats, lorem.
- Text people must read under 13px, or in a light grey that fails contrast.
- Template furniture: rows of example chips, four-up icon feature grids, logo walls of nine or more marks, outlined mini-cards repeated down a section. Show one clear example, three strong points, or the six marks people recognize.
- Framework default colors as the brand: Tailwind blue-600/indigo-500, violet-600, emerald-500, orange-500 on near-black. Derive the accent from the brand or its material and correct it in OKLCH (below).
- One-sided borders as decoration: an accent rail down the left edge of a card, quote or callout (`border-left: 3px solid`), or a selected tab, filter or link marked with `border-bottom` on an element with a corner radius, so the line bends at its ends. Separate cards by surface tone and spacing; draw a tab indicator as its own straight bar (check.mjs blocks both).
- Text symbols standing in for icons or a logo: an asterisk, sparkle, star or emoji as the brand mark, Unicode arrows (↗ → ←), check marks or bullets typed as characters inside buttons and links. An asterisk, sparkle, star, burst or flower is the default AI logo whether it is typed or drawn as SVG, and so are decorative ✳ ✦ ✧ scattered as ornaments; never use one. Logos are a wordmark set in the brand type, or a mark drawn from the product's own idea; icons come from one real icon set as SVG (Lucide, Phosphor or Tabler) at a consistent size and stroke (check.mjs blocks typed symbols).
- A short rule or dash in front of a label ("— A notebook that thinks with you", a 20px line before an eyebrow). The label stands alone, in sentence case, or is cut.
- Colored dots in front of text ("● Active", "● Paid", status pills with a leading dot). A dot is only right when it is the whole message: a live or recording indicator, online presence on an avatar, an unread marker in a list; mark those with `data-seenry-dot="live|presence|unread"` (check.mjs blocks any other dot before text).
- "Many" drawn as a cloud or wall of tiny chips, domains, logos or dots (it turns the claim into decoration), and production notes in the page body ("these marks are invented", "demo data", "placeholder"); a one-line disclosure in the footer is fine.
- Placeholder art: blurred gradient blobs, CSS gradients or code-drawn shapes standing in for album covers, product photos or avatars.
- **The second-generation tells.** Once the old tells are banned, generated pages converge on a new house look, and blind readers spot it at once. Never:
  - a two-tone headline whose second sentence is set in grey ("Pay for the studio. Not every chair." with the second line muted), more than once per page; a headline says one thing in one color;
  - the same section header everywhere: title on the left, a small muted note on the right, then a ruled list. Each section opens the way its content needs (a photograph, a number, a quote, straight into the product);
  - monospace as flavor: mono captions, timestamps, "2 of 4 left" meta lines and receipt text scattered as texture. Mono is for code and aligned figures in a real table;
  - a fabricated data widget in every section (tide curves, seat pips, sparklines, receipts, dot charts). One signature moment carries the idea; other sections use real material;
  - crude drawn diagrams and CSS illustrations: labelled boxes, sine waves, outlined pills standing for people;
  - testimonials from invented people with initials in a circle and a metadata line ("3 sessions · May 2026"); use a real photo, or the quote with a plain name;
  - small objects in large empty fields: a 300px photo floating in a 1440px band, a short list in the right third with nothing on the left. A section is filled by one large thing, not spaced out to look calm;
  - a page made only of type, rules and drawn shapes. Every new page carries real material at real size at least twice: the product's own interface on a stage (software), art-directed photography (places, food, people, objects) or video. Removing decoration must be replaced by stronger material, never by nothing. For software the material is the product: at least one large stage of its real interface (marked `data-seenry-product`); museum prints, borrowed artworks and stock photos never stand in for it;
  - one visual idea (step circles, a timeline, a chip row, a mini-diagram) repeated in hero, middle and closing. Use it once, where it explains most;
  - every page built from the same skeleton whatever the brand. If the tidepool surf school and the butcher would share a wireframe, the design was not thought for either.
