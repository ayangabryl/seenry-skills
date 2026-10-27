# What a one-line brief must include

A one-line brief ("landing page for my habit tracker", "I'm a wedding photographer, need a portfolio site") asks for a complete site the person could publish today, not a restrained sketch. They are waiting for it.

Run the flow in quick mode unless they ask for more. Expect about 20 to 30 minutes, most of it images and the gate. Quality comes from research, the idea and the rules, not from review loops: in testing, first builds already reached leader level and long loops added 0 to 1 point.

## The quick-mode floor

Never go below it. Plain models now build competent pages alone, so a page built from thin research looks like theirs.

| Part | Minimum |
| --- | --- |
| Research | One `research_design_brief` survey of the category; one search for the most important body section (`search_sections`, or pricing, schedule, menu or work); one `borrow_references` call outside the category |
| References | At least three opened at full size with `get_reference_context` or `get_screenshot`, one of them a category leader pulled by name, each with a decision card in `.seenry/refs/kept.md` |
| Identity | Three identity boards and a `pick.mjs` run. The pick is what gives the page its identity, so it is never skipped |
| Imagery | One background batch right after the pick, as many images as the page uses well: generated pictures, plus custom artwork drawn for this brand as SVG or PNG (a mark, a device, an illustration system). Keep every image the in-place photo check scores 6 or more. When the generator is rate limited, finish with what you have |
| Gate | `check.mjs --mode quick`: board blockers, one critic round, one round of its fixes. A second run re-checks the board only. The critic sees scroll frames, paired with the named site when there is one |

Preview on the dev server while you work and run the production build once at the end. When `check.mjs` lists blockers, fix all of them before running it again, not one per round.

Polish and showcase modes do all of step 3 instead: at least three category leaders by name (capture missing ones with `bar.mjs`), at least three leaders of the composition class (for software: Linear, Brex, Midday, Retool, Intercom, Metronome), and their full pages, not only heroes.

## What the page must hold

### It has what that kind of site always has

| Site | Contents |
| --- | --- |
| App landing page | What it is and who it is for in the first line; the product large and real; three to five features, each shown rather than listed; proof; pricing when paid or when the nav mentions it; a closing call to action; footer |
| Portfolio | The person's name and strongest work first; galleries or case studies; an about section with a portrait; process or packages; kind words from clients; an inquiry form |
| Dashboard | Believable populated data, working filters, every figure readable |

Every navigation link leads to something that exists on the page or in the build.

### The claim is specific and leads

- The headline names this product's concrete promise: a noun, fact or mechanism only it can claim. Set it as type, not as a giant numeral.
- Test it: put the nearest competitor's name in the headline. If it still reads true, the claim is not specific yet.
- The most ownable idea is the first screen, not a strip further down.

### Each section has one dominant thing

- One element at large scale (the product doing one thing, a photograph, one number, one quote) and clearly smaller support.
- Never three or four equal cards unless the content is a true set of equals. Feature one.
- Consecutive sections change composition: split, full-bleed image, product moment, dense data, single quote, schedule.

### Proof proves the headline

Every feature visual shows the claim beside it working, not a generic dashboard or a mood photo.

### Show the product, do not repeat it

- One large product moment in the hero and at most two more, each showing something different.
- The same list or calendar in several sections reads as padding.
- A landing page has no working forms beyond sign-up or the waitlist. A try-it demo is a visual.

### Product visuals are designed screens in real devices

- Never draw a phone or laptop from divs, and never put a table inside one.
- Design the app screen as its own page, render it with `scripts/mockup_screen.mjs`, frame it with [device mockups](../assets/mockup/README.md).
- Compose it with imagery: a tile row with the device across it, a device in a photograph, an angled pair, UI cards over a painted field.

### A decided identity, loud or quiet

Pick the register from the brand's voice, or from a reference the person shows.

| Register | For | Looks like |
| --- | --- | --- |
| Loud | Brands that sell energy or character | One saturated or deep brand color at full strength in one or two large fields, near-black ink, neutral surfaces, at least one dark or fully colored section |
| Quiet premium | Calm brands, finance, wellness, software that sells trust (Stripe, Linear) | Warm off-white and ink, no brand-color fields, photography or the product as the only color, a modest headline (the one place a grey second line is allowed), generous space, pricing, FAQ and footer made as carefully as the hero |

- The accent and type come from this product's idea. Never the default SaaS indigo, violet or blue, or cream with terracotta and italic serif accents.
- Type comes from what the leaders use, measured from the kept references ([type](art-direction.md#4-type-chosen-like-the-leaders-choose-it)): usually one refined neo-grotesk, tuned tight.
- One memorable move: the identity's device and type voice, carried from hero to footer at real scale. Everything else stays quiet so it is remembered.

### Restraint is not sparseness

Calm comes from hierarchy and spacing, never from leaving content out. A section that is mostly empty tint, or a small mockup in a large field, is unfinished.

### Consumer products need warmth

Habit, health, food, money, family and hobby apps sell on feeling as much as features. Give the page one emotional anchor at real size: the life moment the product serves, a full-bleed brand-color band, the product in a hand. Vary section grounds instead of separating everything with hairlines.

### Imagery first, even without a generator

1. Check the image route before building: `image.mjs` with one test prompt, or seenry-assets `generate` with an API key.
2. When none works, say so in the report and art-direct one museum set instead. Never a type-only page:
   `python3 ../../seenry-assets/scripts/assets.py art-set --style <family> --subject "<two or three words>" --count 8 --out img`
3. One family per page, from the brand's voice:

| Family | Fits |
| --- | --- |
| `impressionist` | Calm, warm, human: finance, wellness, hospitality, consumer apps |
| `dutch` | Food, craft, objects, interiors |
| `japanese` | Precise and graphic: software, tools, travel |
| `drawings` | Quiet, editorial, architectural |
| `american` | Open landscape and light |
| `photographs` | Black-and-white documentary |

Crop the works tight as color fields behind real product cards, one per tile, never as a framed museum picture. Credit them in the footer. House style: the owner preferred this to every generated set.

### Type on imagery stays readable over the whole image

Text on a photograph or painting sits on its calmest area, or on a scrim strong enough that the brightest part behind it holds 3:1 for large text and 4.5:1 for small. Light weights need a calmer field. The board measures this.

### Write it as the owner's real site

- Their voice, believable names, prices, hours and copy.
- Stock imagery stands in for their work, so it carries no visible creator credit on the page; credits go in the footer or a credits page. The page never names another person as its author.
- Never a note that content is sample or placeholder; `check.mjs` blocks it. Tell the owner what to swap in the report and in `DESIGN.md`.

### Landing-page type is larger than app type

Body 18, supporting copy 16, nothing a visitor reads under 15 at 1440, including labels inside mockups. All floors: [the standard](standard.md#size-floors).

### A named site is the identity

Follow [named site](named-site.md) even when the request is one line.
