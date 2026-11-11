# Choosing type

How to choose a typeface on evidence: what experts and product teams actually do, what research supports, and the checks to run on every candidate. The catalog of faces is in [type](type.md).

## Contents

- What the best teams do
- What research supports, and what is folklore
- Choose by job, text first
- Read the brief the way a foundry would
- Quality checks on the specimen
- Pressure test
- Decide and record
- Sources

## What the best teams do

| Practice | Who | What it means here |
| --- | --- | --- |
| Never choose by look alone | Tim Brown, *Flexible Typesetting* | Picking by how a font "feels" yields faces that cannot do their jobs. Check first: enough weights and styles, suited to the medium, comfortable for the kind of reading |
| Body text first | Brown; Truong | Choose the face for the longest reading first, then the faces for headings and UI that complement it |
| Start from the requirement, not the font | Airbnb Cereal | Airbnb wrote its needs (character, function, scale; one face from small UI to billboards; many scripts) and searched existing fonts before commissioning one. Write the requirements before opening a catalog |
| Design for the hardest size | Inter (begun at Figma to beat Roboto at small sizes); Geist (begun as a monospace for code) | Judge a UI face at 12–14px in a dense screen, not in a headline. A tall x-height and open apertures are what hold up there |
| Axes buy range | GitHub Mona Sans (weight, width, slant, optical size) | A variable family with width and optical size covers product, web and print in one voice. Prefer it when one family must do everything |
| A companion face for accent | GitHub Hubot Sans beside Mona Sans | The second face has one job (headers, pull quotes, technical accents) and differs in one way |
| Quality costs something | Matthew Butterick, *Practical Typography* | Professional fonts are the fastest upgrade; default system fonts and random free fonts are the usual downgrade. With no budget, choose free faces by the checks below, not by availability |
| Test in the real product | Airbnb tested Cereal in real designs for 18 months; Dalton Maag hinted the main weight per platform | A specimen decides the shortlist; the real screens decide the winner |

## What research supports, and what is folklore

| Claim | Status |
| --- | --- |
| "Serif reads better in print, sans on screens" | Not supported. A 2022 meta-analysis found no consistent legibility difference between the categories, on paper or screen. Differences between individual typefaces are larger than between categories |
| Individual typefaces differ in legibility at a glance | Supported (studies of glance reading in *Ergonomics*). Test your candidates; do not argue from category |
| Compare faces at the same point size | Misleading. Point size is not letter size; match x-heights when comparing, or one face simply looks bigger |
| A larger x-height helps at small sizes | Practitioner consensus with a cost: too tall, and ascenders and descenders stop distinguishing letters |
| Heavier strokes help low vision | Some support: regular-weight sans faces are thin for low-vision reading; a medium or bolder weight helps. Offer it where the audience needs it |
| Loosen tracking on small text, tighten on large | Practitioner consensus, not a controlled finding. Apply it and check by eye |

So: never justify a choice by "serifs are more readable" or the reverse. Justify it by what the specimen and the pressure test showed.

## Choose by job, text first

Write the jobs before the names, in this order:

1. **Reading job.** What is the longest thing people read here: a table for hours, an article, three words on a button? That sets the text face.
2. **Hardest size.** The smallest size on the densest screen (12–13px labels, table cells). The UI face must pass there.
3. **Voice job.** Where the product speaks in its own voice: the name, headlines, big numbers. That sets the identity face; it may be the text face at another weight, width or optical size.
4. **Coverage.** Languages and scripts, tabular and lining figures, a real italic, the weights the system needs (usually 400, 500 or 600, 700), a mono if code or aligned data appears.
5. **Medium and budget.** Screens only or also print; self-hosted web, app embedding; free only or a license budget.

Cut any candidate that fails 4 or 5 before looking at how it feels. `identity.mjs info` answers weights, italics and license in one line.

## Read the brief the way a foundry would

Turn adjectives into drawn features, so "friendly" or "precise" becomes something you can see and compare:

| The brief says | Look for |
| --- | --- |
| Friendly, soft, human | Rounded terminals, open apertures, single-storey a and g, generous spacing |
| Precise, technical | Even stroke weight, squared or angular terminals, tight apertures, tabular figures by default |
| Trustworthy, established | Moderate contrast, conventional proportions, a real italic, nothing quirky in a, g, R, Q |
| Elegant, premium | High stroke contrast at display sizes, narrow joins, optical sizes |
| Loud, confident | Heavy weights, wide or condensed extremes, tight tracking that still holds |
| Warm, crafted | Old-style or calligraphic stress, irregular details, soft serifs |
| Neutral, invisible | Neo-grotesk proportions, low contrast, large x-height |

Then pick four candidates that deliver the features in different ways, not four of the same kind.

## Quality checks on the specimen

`identity.mjs specimen` prints a quality block under each face. Look at it at real size and note a pass or fail for each line in `identity.md`.

| Check | What to look at | Fails when |
| --- | --- | --- |
| Confusables | `Il1 O0 rn m cl d 5S 8B` | Capital I, lowercase l and 1 look alike in a product with codes, emails or IDs; `rn` reads as `m` |
| Kerning pairs | `AV To Ty We LT r. f) "A` | Visible holes or collisions at 56px and above |
| Even rhythm | The word `minimum` and `Hamburgefonstiv` | Letters clump or drift; the word has dark and light patches |
| Small size | The 12px and 14px rows | Counters fill in, letters touch, weight looks thin or blotchy |
| Figures | The tabular column of numbers | Digits do not align in the column; no tabular figures available |
| Diacritics and symbols | `ÀÉÎÕÜ çãõ ß € @ & →` | Missing glyphs (a fallback font appears), marks that collide with the letter |
| Italic | The italic row | No italic, or a mechanically slanted one |
| Weights | The weight row | Fewer than the system needs; a jump between neighbors that is too small or too large |
| x-height match | Candidates side by side at the same x-height, not the same px | One face only "won" because it was drawn larger |

A display-only face is excused from the small-size and figures checks; it never sets text.

## Pressure test

A specimen shows a face at rest. Before deciding, put the two finalists into one real screen (the densest one) and one real headline, then:

- Narrow the frame from desktop to phone width and watch the headline break; a face that needs three lines where the other needs two costs space on every screen.
- Swap in the longest real strings (names, prices with thousands, a German or Portuguese label).
- Check both modes: light text on dark looks heavier; drop a weight step or loosen tracking if it clots.
- Read it at arm's length on a phone, not only zoomed on a monitor.

## Decide and record

Choose the candidate that passed the checks and makes the real headline sound like this product. In `.seenry/identity.md` write, for each chosen face: the job it does, the features that fit the brief, the checks it passed, what it costs (license fee, no italic, weak below 14px), and its license from `fonts.json`. A choice with no recorded reason is a default.

## Sources

- Tim Brown, *Flexible Typesetting* (A Book Apart, 2018).
- Matthew Butterick, *Practical Typography* (practicaltypography.com), "Font recommendations" and "System fonts".
- Airbnb Design, "Working Type" (airbnb.design/working-type); AIGA Eye on Design on Airbnb Cereal.
- GitHub, "Introducing Mona Sans and Hubot Sans" (github.blog, 2022).
- Vercel, Geist (vercel.com/font); Basement Studio, "The Birth of Geist".
- Rasmus Andersson, Inter (github.com/rsms/inter).
- "Measuring the Performance of Typefaces for Users", Smashing Magazine, 2022, and the serif and sans-serif legibility meta-analysis it reports; glance-legibility studies in *Ergonomics* (2020).
