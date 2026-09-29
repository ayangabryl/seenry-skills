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
| Display serif headline (Instrument Serif, Playfair, Fraunces) on a product or SaaS page | The product sans at 500–600, tight tracking; serif only for editorial or luxury brands |
| More than 3 sizes or 3 weights inside one component | Remove one; use color or space for hierarchy |
| Two families for headings and body, or a random display font | One sans for everything; mono only for code and data |
| Uppercase letter-spaced labels on every section | Sentence case; overline for one role at most |
| Body text in light grey that fails contrast | text-2 minimum |
| Prices and numbers jumping width | `tabular-nums` |

## Color and surface

| Tell | Fix |
| --- | --- |
| Purple/indigo-to-pink gradients on buttons, text and backgrounds | One accent, solid; one expressive visual at most |
| Glassmorphism cards on a gradient mesh | Solid surfaces with a ring |
| Every card with `shadow-lg` and `rounded-2xl` | Ring or hairline; shadow only on floating layers |
| Same radius on parent and inset child | `inner = outer − inset` |
| Mixed radius families (pill buttons, 4px inputs, 24px cards, 12px images) with no rule | One scale of ≤4 values + pill, applied by role |
| Colored left-border "accent" on cards and alerts | Tint or icon; no stripe |
| Neon glows and outer glows on dark UI | Inner hairline and surface steps |
| Accent color used for headings, icons and borders | Accent only on actions, selection, focus |

## Material and composition

| Tell | Fix |
| --- | --- |
| Gradient or flat color block standing in for a photo, cover or avatar | Real image via `seenry-assets` (sourced or generated), or remove the slot |
| Elements that align to nothing (a centered control row under a left-aligned block) | Anchor each element to a keyline |
| Title beside an image aligned by its line box, so the capitals sit below the image top | `text-box: trim-both cap alphabetic`; cap top = image top ([alignment](alignment.md)) |
| Edges 2–6px apart (icon glyph vs text edge, bar vs image edge) | Exact, or at least 8px apart |
| Unequal accidental padding (12/16/20/12 to the ink) | Equal optical inset on all sides |
| Card nested in a tinted panel with the same radius, or overflowing it | Concentric radii and inset, or drop the panel |
| Everything the same size and weight | One dominant element, clear subordinates |
| No fine detail anywhere | One detail layer: metadata, mono labels, live values |
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
| Hover effects that scale cards up and add shadows | One-step surface/border change |
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

## Measure it

Run [the system audit](../scripts/system_audit.mjs) in the page (Playwright or the browser console) to count distinct font sizes, weights, families, radii, shadows and colors, list off-grid paddings, gaps and margins, and flag nested radius violations. Numbers do not replace looking, but they catch drift you stop seeing after the third iteration.
