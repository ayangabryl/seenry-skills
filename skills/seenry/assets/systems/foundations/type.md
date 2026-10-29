# Type

## The rule

- **One family, or one deliberate pair** (a display face for titles and big numbers plus a text face). Each family must have the weights and optical quality for its job; a display face is judged at its largest size, a text face at 13–15px.
- **6–8 steps** on a clear ratio, each with its own line height: tight for display (1.05–1.15), open for text (1.4–1.55).
- **Tracking by size:** −0.02 to −0.04em at display sizes, none at text sizes, slightly positive for small labels in caps only if the system uses caps at all (most should not).
- **Measure:** 45–75 characters for reading text.
- **Weights:** two or three per family; hierarchy from size and color before weight; nothing at 700+ in product UI unless the face is designed for it.
- **Figures:** tabular in tables, stats and anything that updates; proportional in prose.
- **Premium faces.** Prefer families with real craft and optical sizes: Inter (with `opsz` or Display), Geist, IBM Plex, Source Serif 4, Newsreader, Instrument Sans and Serif, Manrope, Figtree, General Sans and Satoshi (free from Fontshare), JetBrains Mono. Avoid novelty grotesks at body sizes; quirky faces belong only in display and only when the brand earns it.

## Why

Bringhurst's measure and leading; Apple's San Francisco optical sizes; the leaders Seenry measured render 5 to 11 font sizes per page. Readability research consistently finds 50–75 characters per line comfortable for sustained reading.

## Check

`system_check.mjs` counts rendered font sizes per page (at most 8 in product UI), flags reading text wider than 80 characters, and flags weights of 700 and above outside display.
