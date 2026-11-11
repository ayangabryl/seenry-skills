# Worst-case catalog

Realistic values that break UI, by the kind of value a component renders. Take the rows that apply to the fields you mapped. Use `example.com`, `example.org` or `.test` addresses so a fixture never points at a real inbox or site.

## Contents

- People and names
- Emails, URLs and identifiers
- Labels and copy from data
- Numbers and money
- Collections
- Time
- Images and media
- States
- Environment

## People and names

| Value | Breaks |
| --- | --- |
| `Aleksandra Wiśniewska-Kowalczyk` | Long, hyphenated, diacritics; wraps, and the hyphen is a break point |
| `Christopher Alexander Montgomery III` | Suffix; naive first-and-last initials give `CI` |
| `Konstantin Oberhauser-Wettstein` | Long compound; overflows one-line rows |
| `Maria Cristina dela Cruz-Villanueva` | Lowercase particle, hyphen, four words; initials and sorting |
| `María José de la Cruz y Fernández` | Several particles; initials `Md` or `MF`, sorting by "last name" |
| `João Gonçalves` | Tilde and cedilla; sorting and search without accent folding |
| `Jo` | Two letters; an empty-looking column, initial `J` |
| `J` | One letter; one-character initials, a tiny click target if the name is the link |
| `Ólafur Darri Ólafsson` | Accented capital first; case and sort logic, initials `ÓÓ` |
| `Đặng Thị Ngọc Hân` | Stacked Vietnamese marks; clipped by tight line height with `overflow: hidden` |
| `王秀英` | CJK, no spaces; first-and-last-word logic finds one word, and it breaks anywhere |
| `نور الهدى عبد الرحمن` | Right-to-left; punctuation and icons on the wrong side without `dir="auto"` |
| `Seán O'Brien-Ó Súilleabháin` | Apostrophe and accents; escaping, initials, search |
| `dana` | All lowercase; initials should still be capitals |
| `🦊 Fox` | Emoji first; `.charAt(0)` returns half a surrogate pair (`�`) |
| `👩🏽‍💻 Priya` | Joined emoji; `.length` is 7 or more, slicing splits it |
| `  Sam   Lee ` | Leading, trailing and doubled spaces; empty words, odd gaps |
| (missing) | No name, only an email; something must stand in |

## Emails, URLs and identifiers

These have no spaces, so the browser has nowhere to wrap them.

| Value | Breaks |
| --- | --- |
| `bartholomew.fitzgerald@northwind-industries-holdings.example.com` | Pushes every sibling off the row without `overflow-wrap: anywhere` |
| `a@b.co` | The shortest real address; a layout that assumed long ones looks empty |
| `first.last+billing-notifications@example.com` | Plus-addressing; validation rejecting `+`, truncation hiding the meaningful part |
| `ops@sub.department.region.example.co.uk` | Many subdomains and a two-part TLD; "domain" extraction |
| `https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved` | Overflow; end-truncation hides the part that differs |
| `9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f` | A UUID; monospace width, a middle-truncation case |
| `Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf` | End-truncation hides the version and extension |
| `IMG_20250914_183022_HDR_portrait_edited_edited.HEIC` | Unbreakable camera name, capital extension |
| `@a` and `@thisisaverylongusernamethatisallowed` | Handle extremes |

## Labels and copy from data

| Value | Breaks |
| --- | --- |
| `Senior Product Design Engineer, Platform Infrastructure` | Three lines in a secondary slot |
| `Invitation expired 12 days ago` | A long status badge wraps or squeezes the name |
| `Benachrichtigungseinstellungen` | One 30-character German word; unbreakable label |
| `Paramètres de confidentialité et de sécurité` | French for "Privacy & security"; translations run about 30% longer |
| Twelve tags on one item | A wall of tags; needs a `+8` overflow |
| One tag: `customer-feedback-from-enterprise-onboarding` | Wider than its container |
| `Untitled`, empty, or three spaces | A collapsed heading or zero-height row |
| `<script>alert(1)</script>`, `&amp;`, `**bold**` | Escaping; must show as literal text |
| A line break inside a one-line field | Doubles the row height, or is silently dropped |
| A 2,000-character pasted description | Clamping, "show more", textarea growth |

## Numbers and money

| Value | Breaks |
| --- | --- |
| `0` | "0 members", an empty bar, division by zero in a percentage |
| `1` | "1 members", "1 days ago" |
| `1284` | Needs a separator: `1,284` |
| `1000000` | Badge width; a compact `1M` where precision does not matter |
| `12345678.9` as money | `$12,345,678.90` overflows a totals column |
| `-42.5` | Minus sign, red logic, accounting parentheses |
| `0.1 + 0.2` | `0.30000000000000004` shown raw |
| `142%`, `-3%` | Bars and meters past their bounds |
| `null`, `undefined`, `NaN` | Shown literally |
| `1.284` in `de-DE`, `1,284` in `en-US` | Hard-coded separators wrong for half the world |
| `99` becoming `100` live | Width jumps and jitter without `tabular-nums` |

## Collections

| Value | Breaks |
| --- | --- |
| 0 items | The empty state, if one exists at all |
| 1 item | A grid that looks broken with one card; "1 of 1" |
| Exactly a page, and a page plus one | "Showing 40 of 40", an empty page 2 |
| 1,000+ items, unpaginated | Scroll speed, render time, memory; "Showing 40 of 1,284" |
| One item ten times the size of the rest | Rows stretching to the tallest |
| Items with identical names | Lists where the name is the only difference |

## Time

| Value | Breaks |
| --- | --- |
| Now | "0 seconds ago" instead of "just now" |
| 12 days, 11 months, 3 years ago | Relative-time thresholds; switch to a date after about a week |
| A future date | "in 3 days" versus "-3 days ago" |
| `1970-01-01` | A zero timestamp shown as a real date |
| `2025-12-31T23:30:00-08:00` | A different day in UTC and in the person's zone |
| `1,284 hours` | A duration that never rolls up to days |

Use `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat`, not hand-built strings.

## Images and media

| Value | Breaks |
| --- | --- |
| An avatar URL that 404s | A broken-image icon instead of initials |
| No avatar | The fallback itself: initials, color, the same size as a real avatar |
| A 4000×200 panorama as avatar or cover | Distortion without `object-fit: cover` |
| A 200×4000 tall image | The same, and a blown-out card height |
| A transparent dark logo in dark mode | Invisible |
| A slow image | Layout shift without dimensions or `aspect-ratio` |

## States

| Value | Breaks |
| --- | --- |
| Loading | Skeletons that do not match the final layout, spinners that shift content |
| An API error | No error state, or `TypeError: Cannot read properties of undefined` on screen |
| Partial data | Some optional fields filled and others not in one list; misaligned rows |
| Every status at once | `active`, `invited`, `expired`, `suspended` in one list; badge widths vary |
| No permission | Disabled actions; does the row keep its layout? |
| The current person in the list | "You" labels, actions that should not apply to yourself |

## Environment

Not data, but checked the same way: switch to the worst case, then change these.

| Condition | Breaks |
| --- | --- |
| A 320px container | Every overflow above at once |
| A 280px sidebar placement | Components designed full-width, reused narrow |
| 2560px wide | Lines too long, content stranded on one side |
| 200% zoom or large text | Fixed heights clipping growing text |
| Dark mode | Hard-coded colors, invisible borders and logos |
| `dir="rtl"` | Icons, chevrons, padding, the order of trailing actions |
| Touch | Hover-only actions (the ••• that appears on hover) unreachable |
