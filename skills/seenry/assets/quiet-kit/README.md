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
| Hero | centered headline, second line in the secondary color, one sentence, email capture, then one wide painting with the real app screen standing in it, two cards beside it and the product's own device along the bottom (Penny: the month's days with the 1st marked) | the product's promise; a real screen rendered with `scripts/mockup_screen.mjs`; the device fits inside its frame |
| Proof row | "works with" names in muted type | real integrations or press only |
| Feature bento | one large image tile and two stacked, each carrying one real UI card, with a short title and line below | one feature per tile, each card shows that feature working |
| Split | a quiet copy panel with three measured stats beside an image carrying a comparison card | the change or result the product makes visible |
| Pricing | the offer as a one-color title with a toggle, plans as calm rows beside it, the chosen one raised on white | the real plans |
| FAQ | a plain title left, accordion right | five real questions |
| Closing | a soft panel with headline and email capture beside a portrait or photograph | the same promise, shorter |
| Footer | mark, line, three link columns, legal line, a large faint mark | real links |

**Make it yours, never a copy.** The kit carries the reference's level (register, type, calm, craft), not its layout. For every new product change at least the hero composition and two other sections from the alternatives below, and give the hero one device from the product's own idea. A page a viewer could mistake for the reference is a failed page, however good it looks.
- Hero: one wide painting with the device in it (this kit) · a row of three tiles with the device across the middle · the headline left with the device and one card right · an angled pair of devices on a single image.
- Features: bento (this kit) · three tiles with one featured larger · alternating image and text rows · one long horizontal scroll of cards.
- Pricing: rows beside the title (this kit) · three cards with a toggle · one plan with a comparison line.
- Closing: image and panel (this kit, either side) · a full-width image band with the headline on it · a centered panel with the capture alone.

Rules that keep it at the reference level:
- Tokens in `styles.css` only (type scale 13–56, 4px spacing, three radii, motion tokens). Headlines weight 500 at
  -0.028em; body 15px; size floors as in [the standard](../../references/standard.md#size-floors). The hero is the only two-tone headline.
- Imagery: paintings or photographs as color, never flat brand-color fields. Without an image generator, art-direct
  one set: `assets.py art-set --style impressionist --subject "field garden water"` (Penny's set: Van Gogh, Sargent,
  Courbet, Corot), cropped tight, frames removed, one family per page.
- Cards on images are real product UI with real numbers, one idea each, white with a soft shadow.
- Motion: the hero tiles settle, the device rises and the lifted card arrives after it; sections rise once. Reduced
  motion shows everything at rest.
- Phone: the hero keeps only the device tile; lifted cards hide.
