# Icon sets

One set per product, chosen with the system, at one size and one weight. Emoji, mixed sets and hand-drawn one-off SVGs are what make a screen read as assembled; a single well-made set reads as designed. Every set below is free for commercial use; record the one you use in `DESIGN.md` with its license.

| Set | Style | License | Pairs with | Load (pinned) |
| --- | --- | --- | --- | --- |
| [Lucide](https://lucide.dev) | Even 2px stroke (set 1.5 for dense UI), rounded joins, 24 grid | ISC | graphite; any calm product UI | `<script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>` then `<i data-lucide="search"></i>` and `lucide.createIcons()`; npm `lucide-react` |
| [Tabler](https://tabler.io/icons) | 1.5–2px stroke, slightly geometric, very large set | MIT | ledger; finance, admin, operations | `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css">` then `<i class="ti ti-receipt"></i>`; npm `@tabler/icons-react` |
| [Phosphor](https://phosphoricons.com) | Six weights from thin to fill, plus duotone | MIT | paper (regular), bloom (duotone or bold) | `<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>` then `<i class="ph ph-house"></i>` / `ph-duotone` / `ph-bold`; npm `@phosphor-icons/react` |
| [Remix Icon](https://remixicon.com) | Line and fill pairs, crisp at 16px | Apache-2.0 | signal; infrastructure, data, developer tools | `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css">` then `<i class="ri-server-line"></i>` |
| [Heroicons](https://heroicons.com) | Outline 24, solid 24 and 20, mini 16 | MIT | studio; Tailwind projects | Inline SVG from `https://unpkg.com/heroicons@2.2.0/24/outline/<name>.svg`; npm `@heroicons/react` |
| [Iconoir](https://iconoir.com) | 1.5px stroke, softer, slightly editorial | MIT | consumer and editorial products | `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iconoir@7.10.1/css/iconoir.css">` then `<i class="iconoir-home"></i>` |
| [Material Symbols](https://fonts.google.com/icons) | Variable font: fill, weight, grade, optical size | Apache-2.0 | Android-feeling products and Material 3 builds | Google Fonts `Material+Symbols+Rounded`, then `<span class="material-symbols-rounded">home</span>` |
| [SF Symbols](https://developer.apple.com/sf-symbols/) | Apple's system set, matched to San Francisco | Apple license: Apple platforms only | Native iOS and macOS apps (seenry-apps) | `Image(systemName:)` in SwiftUI. Never on the web or Android. |

## Rules

- **One set, one size, one weight per screen.** 16px beside 13–14px text, 18–20px beside 15–16px text; icon and label share a center line, with a 6–8px gap.
- **Icons help recognition, they never decorate.** Navigation, actions, file and object types, status. A heading or a stat does not need one.
- **Color comes from meaning.** Icons take the text color of their row; status icons take the status color; brand and integration logos keep their own colors, the only full-color marks on a calm screen.
- **Name icon-only buttons** with `aria-label`, and give them a tooltip on desktop.
- **Pick a different set from the last project** unless the system or the owner fixes it (`node scripts/history.mjs --list` shows what recent projects used).
- Brand logos (Google, Slack, Stripe) come from the brand's own press kit or [Simple Icons](https://simpleicons.org) (CC0, trademark rules still apply).
