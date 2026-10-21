# Quiet premium kit

A complete landing page in the quiet premium register, built to the standard of the references the owner chose
(StatementIQ and similar refined SaaS): warm off-white and ink, one refined grotesk set tight, color only from the
imagery and the product, calm well-made sections from hero to footer. Penny, a finance tracker, is the worked example;
replace every word, number and image.

Use it for app and software landing pages in the quiet register, and whenever the person shows a reference like this.
Assemble from these sections instead of inventing layouts; spend the effort on the content, the app screens and the
imagery.

| Section | What it is | Adapt |
| --- | --- | --- |
| Navigation | one pill bar: mark and name, four links, dark pill action | links to sections that exist |
| Hero | centered headline, second line in the secondary color, one sentence, email capture, a row of three image tiles with the real app screen in a device across the middle tile and one card lifted out | the product's promise; a real screen rendered with `scripts/mockup_screen.mjs` |
| Proof row | "works with" names in muted type | real integrations or press only |
| Feature tiles | three images, each carrying one real UI card, with a short title and line below | one feature per tile, each card shows that feature working |
| Split | a quiet copy panel with three measured stats beside an image carrying a comparison card | the change or result the product makes visible |
| Pricing | centered title, monthly or annual toggle, three soft cards, the popular one with a thin image band and the dark action | the real plans |
| FAQ | two-tone title left, accordion right | five real questions |
| Closing | a soft panel with headline and email capture beside a portrait or photograph | the same promise, shorter |
| Footer | mark, line, three link columns, legal line, a large faint mark | real links |

Rules that keep it at the reference level:
- Tokens in `styles.css` only (type scale 13–56, 4px spacing, three radii, motion tokens). Headlines weight 500 at
  -0.028em; body 15px; nothing a visitor reads under 13px.
- Imagery: paintings or photographs as color, never flat brand-color fields. Without an image generator use
  public-domain art (`seenry-assets` → `assets.py art "<subject> <medium>"`), cropped tight, frames removed.
- Cards on images are real product UI with real numbers, one idea each, white with a soft shadow.
- Motion: the hero tiles settle, the device rises and the lifted card arrives after it; sections rise once. Reduced
  motion shows everything at rest.
- Phone: the hero keeps only the device tile; lifted cards hide.
