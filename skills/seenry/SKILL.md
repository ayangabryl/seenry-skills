---
name: seenry
description: "Design and build web pages and product screens at studio quality, not AI-template quality. Use for a new landing page, site, dashboard, pricing or app shell, a redesign or visual polish, a page made like a named site, and changes to screens in an existing app. Designs the brand's identity first, researches real leaders and studio work in Seenry MCP, builds on a token system with purposeful motion, and does not finish until the check script's slop board and a blind critic have reviewed the page. Native app screens go to seenry-apps, motion alone to seenry-motion, review alone to seenry-review."
license: Apache-2.0
metadata:
  author: Seenry
  version: "0.1.0"
---

# Seenry

Seenry builds pages that look decided: clean, premium and specific to one brand, at the level of Stripe, Linear, Apple and the best independent studios. Generated pages fail in a predictable way. Nothing in them is wrong, and nothing in them was chosen. Every step below exists to make a choice visible, then to prove the page carries it.

How hard to press: the [never-ship table](#never-ship) and the gate are firm. Measured floors (sizes, contrast, spacing) are firm. Everything marked as house style is a default, and the brief or a reference the person shows outranks it.

Work in the project's stack. Read its tokens, components and `DESIGN.md` first, and extend them.

## Pick the route first

The route decides how much of this skill applies. A small fix with the full flow wastes an hour; a new site without it ships a template.

| The request | Route | Read |
| --- | --- | --- |
| A change inside an app that has its own screens and styles | Existing project: keep its system, fix presentation fully | [existing project](references/existing-project.md) |
| "Unslop this", "make it not look AI-made", "redesign this screen" | Unslop: keep every feature, rebuild the look from deep research, full gate | [unslop](references/unslop.md) |
| A new page, site or redesign | The flow below | this file, then the files each step names |
| One line ("landing page for my habit tracker") | The flow below in quick mode | [new-site holds](references/new-site.md) |
| "Like X", "based on X", "inspired by X", "replicate X" | The flow, with the named site as the identity | [named site](references/named-site.md) |
| Native app screens | Use `seenry-apps` | its skill |
| Motion only, review only, assets only | Use `seenry-motion`, `seenry-review`, `seenry-assets` | their skills |

## Finished means the gate has seen it

A page is done when `node scripts/check.mjs <file or url> --brief <brief> --mode quick` has run at desktop and phone, its blockers are cleared and the critic's fixes are applied. Self-review is not a substitute: in testing, the builder rated 9 what blind review rated 6 to 7.

- The last tool call before the final reply is `check.mjs`, and the reply quotes its score line.
- The critic judges the page while scrolling, not only stills, and images are judged in place. A page that breaks mid-scroll does not pass however good its stills are.
- Report the level the critic gave: pass (9), leader level (8), or below leader level (7 or less) with the remaining gaps. Never a self-score.
- Never end the turn while images, a build or the check still run. In headless sessions, ending the turn ends the work. Run `check.mjs` in the foreground with a long timeout; if your shell moves it to the background, block on `node scripts/check.mjs <file or url> --await`, which waits for the running gate and prints its result.
- Existing-project changes use `existing_check.mjs` instead; see their route.

## Modes

| Mode | When | What runs | Time |
| --- | --- | --- | --- |
| `quick` | Default, and every one-line brief | Board blockers, one critic round, one round of its fixes | About 20 to 30 minutes, most of it images and the gate |
| `polish` | The person asks for polish or production-ready | Up to four critic rounds, stops at leader level | About an hour |
| `showcase` | The person asks for a showcase, portfolio piece or the best possible | Full gate, a second direction if the first stops | An hour or more |

In quick mode a page below leader level is reported as below leader level, with the critic's top gaps.

## The flow

Each step leaves a file the gate checks for. Missing files are blockers, so the order is not optional. Step detail lives in [the flow](references/flow.md).

| Step | Do | Leaves |
| --- | --- | --- |
| 1. Brief | Audience, the one job of the surface, the real content, what is fixed | `BRIEF.md` |
| 2. Draft the idea | The claim, its proof and five candidate ideas, before any research. Ideas only, no palette or layout | `.seenry/idea.md` |
| 3. Research | Survey the category wide, keep only references that pass on the pixels, then walk every page and section of the two or three you keep; borrow one from outside the category; measure them | `.seenry/research/pack.md`, `.seenry/refs/` images and notes per site, `.seenry/refs/kept.md` |
| 4. Identity | Truth, visual idea, type voice, color world, one device, image treatment, voice line, motion score | `.seenry/identity.md` |
| 5. Explore and pick blind | Three identity boards from the three strongest ideas, then `pick.mjs` | `.seenry/explore/a,b,c.html`, `pick.json`, `.seenry/identity.html` |
| 6. Motion spec | Each moving thing: trigger, property, duration, easing, interruption, reduced motion, source | `.seenry/motion.md` |
| 7. Material | Start every image in one background batch right after the pick, then build while it runs. Use as many as the page uses well, including custom SVG or PNG artwork | images that passed `photo_check.mjs --page` in place |
| 8. Build | The board's hero poster becomes the first screen; every section applies the identity | the page, with one `data-seenry-signature` element |
| 9. Edit, then check | Cut copy by a third, craft pass at 100%, then `check.mjs` | review rounds in `.seenry/review/` |
| 10. Record | Brand guidelines and the references kept and set aside | `DESIGN.md` with a "Brand guidelines" section |

Identity is the step generated pages skip, and it is what separates a 6 from a 9. Read [identity](references/identity.md) before step 4.

Give `.seenry/` a `.gitignore` containing `*` when you create it yourself. The scripts do this for you; a work folder must never be committed.

## Hard rules

1. **Write the inventory before the layout.** List the eight to twelve things leaders put on this kind of screen, with data, actions and states. A clean screen missing one is unfinished.
2. **Remove decoration, never content.** Slop rules cut eyebrows and filler. They never cut affordances, recognition icons or sections a visitor looks for.
3. **One token file, every value from it.** Type steps, the 4px space scale, three radii plus full, motion tokens. Typed values are blocked by `token_lint.mjs`. Values live in [system](references/system.md) and [the standard](references/standard.md).
4. **Research decides conventions, never identity.** The survey says what the category always does. Color, type and composition come from the idea, or every brand in a category looks alike. Fame is not quality: a reference is kept because its pixels pass, never because of its name.
5. **Real material at real size, at least twice.** Product UI on a stage for software; art-directed photography or art for places, food, people and objects. Removing decoration without adding material leaves a page that is empty, not calm.
6. **One idea per view, one signature per page.** One dominant element per section; one crafted signature component, from the chosen idea, marked `data-seenry-signature`.
7. **The claim is specific and leads.** The headline names something only this product can say: a noun, fact or mechanism. A mood any competitor could print is not a claim.
8. **Consecutive sections change composition.** The same heading, paragraph and cards rhythm twice reads as a template.
9. **Motion explains a change or it does not run.** Interface motion stays under 300ms; page choreography has its own slower clock. Rules in `seenry-motion`.
10. **Slop is anything that reads as AI-made at a glance,** not only the listed tells. The critic scores it as `looks_ai`; a clean page in the familiar AI default does not pass. Junior execution fails the same way: the critic's `seniority` score asks whether a senior designer at the reference's company would ship the screen as it is. A screen people misread fails too: charts, controls and statuses take the form people in the category already know, and the critic's `clarity` score checks each one with a five-second reading.
11. **Every affordance works.** A shortcut hint, badge or button with nothing behind it is removed or wired up.
12. **Gate markers tell the truth.** `data-seenry-*` attributes describe the page; never add one, or restructure markup, to pass a check. An app screen gets `Surface: app` in `BRIEF.md`, and landing-page checks skip themselves.
13. **Copy is the owner's real site.** Believable names, prices and hours. Never a note on the page that content is sample or placeholder; tell the owner what to swap in the report.

## Never ship

The review board blocks most of these by name. Each row has its fix, because a ban without one sends the agent to the next cliché.

| Never | Instead | Why |
| --- | --- | --- |
| An eyebrow: a short small line above a title | Cut it; facts go under the title | The title already says it |
| Numbered labels ("01 /", "Step 01") | Plain figures only where order is real | Numbering fakes structure |
| Uppercase letter-spaced labels | Sentence case at readable size | The most common generated tell |
| Weight 700+ in UI, more than three weights | 400 to 600, two or three weights | Heavy weights flatten hierarchy |
| Italic serif accent words in headlines | One voice, one color per headline | Reads as a template flourish |
| A grey second line in a headline more than once per page | One two-tone headline at most | Repeated, it becomes the house look |
| Novelty faces for flavor (Instrument Serif, Fraunces, Playfair, Space Grotesk, Clash Display) | A face from the identity, tuned | Chosen for flavor, not for the brand |
| Cream with terracotta, plum with peach, navy with lime, purple gradients | Color from the brand's truth, built in OKLCH | Default AI palettes |
| Framework default colors as the brand (Tailwind blue-600, indigo-500, violet-600) | An accent from the brand or its material | Every template ships them |
| Gradient blobs, glows, sunset circles, flat SVG product stand-ins | Real product, photography or art | Clip-art reads as generated |
| Text symbols as icons or logos (✳ ✦ ↗ ★, a sparkle mark) | A wordmark; icons from one SVG set | The default AI logo |
| A dot before text ("● Active") | Dots only for live, presence or unread, marked `data-seenry-dot` | Decoration posing as status |
| A rule or dash before a label | The label alone | Ornament |
| One-sided border rails on cards; a bottom border on a rounded tab | Surface tone and spacing; a straight indicator bar | The bend at the ends shows |
| Mono as texture: timestamps, receipts, meta lines | Mono for code and aligned figures only | The second-generation tell |
| The same section header everywhere (title left, note right, ruled list) | Each section opens the way its content needs | A skeleton, not a design |
| A fabricated data widget in every section | One signature moment; real material elsewhere | Repetition reads as padding |
| Crude drawn diagrams, sine waves, outlined pills as people | Photography, the product or type | Worse than none |
| Invented testimonials with initials in circles | A real photo, or the quote with a plain name | Fake proof |
| A small object floating in a large empty band | One large thing fills a section | Sparse is not calm |
| Four-up icon grids, nine-plus logo walls, chip clouds | One clear example, three strong points, six known marks | Template furniture |
| Text people read under 13px, or grey that fails contrast | The size floors in [the standard](references/standard.md) | Unreadable at review scale |
| A shortcut hint, badge or label with nothing behind it (⌘K with no command menu) | Wire it up or remove it | It promises a feature that is not there |
| The familiar AI default: house palette, the standard skeleton for this screen, every block at equal weight | One element leads; identity from this product's idea | Reads as generated with zero tells |
| A clever idea drawn roughly: several action styles, one color for several meanings, blocks on no shared edge, size-mixing in one line | The best reference's execution, with one signature element drawn at its finish | Reads as a junior designer's work |
| Letters clipped by a mask (`overflow: hidden` on tight display lines) | `padding-block: 0.15em` with a matching negative margin | Slices the tail of g and y |
| Type on an image without a calm field or scrim | 3:1 for large, 4.5:1 for small text over the whole image | The board measures every pixel |

The full catalogue, with the tells by area, is [anti-slop](references/anti-slop.md).

## House style

These are the owner's tested preferences. Use them as defaults; a brief, a brand or a reference the person shows outranks them.

- **Quiet premium for calm software.** Warm off-white and ink, one refined neo-grotesk set tight, color only from imagery and the product. Start from the [quiet kit](assets/quiet-kit/README.md), then change the hero and at least two sections so the page is never a copy.
- **Museum art over generated sets** when no image route works or the register is quiet: `assets.py art-set`, one family per page, cropped tight behind real product cards.
- **Studio references beside category leaders.** The critic judges against kargul.studio, ARKET and rebrand films as well as the category.
- **Inter is fine; untuned Inter at 700 is the tell.** Tune tracking and weight like the leaders do.
- **An exact copy of a reference fails,** even when it looks good. Keep its level, change the composition.

## Before you finish

Grep the page for each pattern. Every hit is fixed or defended to a designer in one sentence.

| Look for | Fix |
| --- | --- |
| `font-weight: 7`, `800`, `900` | 500 to 600 |
| `text-transform: uppercase` with `letter-spacing` | Sentence case |
| `transition: all` | Name the properties |
| `px`, `ms` or `#hex` typed outside the token file | Use the token |
| `border-left:` on a card or quote | Surface tone |
| `●`, `✦`, `↗`, `→` inside text | SVG icon or nothing |
| "sample", "placeholder", "demo data", "lorem" in visible copy | Real copy; notes go in the report |
| `overflow: hidden` on a display line without block padding | Pad the mask |
| A second `data-seenry-signature` | Keep one |
| No `prefers-reduced-motion` branch | Add the resting state |
| A tooltip, select, dialog, pinned header or sort arrow not tried in use | Run the [in-use states](references/components.md#states-checklist) |

## Files

| Need | Read |
| --- | --- |
| Step detail for the flow | [flow](references/flow.md) |
| Identity method, boards, motion score | [identity](references/identity.md) |
| What a one-line brief must include | [new-site holds](references/new-site.md) |
| Changes inside an existing app | [existing project](references/existing-project.md), [surfaces](references/surfaces.md) |
| Unslop or redesign an existing screen | [unslop](references/unslop.md) |
| "Like X" and replicas | [named site](references/named-site.md), [replication](references/replication.md) |
| Floors: type, color, radius, scale, imagery, motion | [the standard](references/standard.md) |
| Components, transitions, signature, illustration | [building](references/building.md) |
| Tokens and grid | [system](references/system.md), [starter tokens](assets/tokens.css) |
| Why leaders look premium | [premium](references/premium.md) |
| Concept, type voice, palette origin | [art direction](references/art-direction.md), [design thinking](references/design-thinking.md) |
| Type, color, alignment, optical, craft | [typography](references/typography.md), [color](references/color.md), [alignment](references/alignment.md), [optical](references/optical.md), [craft](references/craft.md) |
| Copy | [writing](references/writing.md) |
| Seenry MCP recipes | [research](references/research.md) |
| Imagery | [imagery](references/imagery.md) and `seenry-assets` |
| Accessibility and phone quirks | [accessibility](references/accessibility.md), [mobile web](references/mobile-web.md) |
| Tells and fixes | [anti-slop](references/anti-slop.md) |
| Libraries and stack | [libraries](references/libraries.md), [stack](references/stack.md) |
| The optional design sheet | [sheet](references/sheet.md) |
| Where each rule comes from (Emil Kowalski, Jakub Krehel, measured leaders, testing) | [sources](references/sources.md) |

Scripts are in `scripts/`. The ones the flow uses: `research.mjs`, `bar.mjs`, `pick.mjs`, `history.mjs`, `image.mjs`, `photo_check.mjs`, `check.mjs` (runs `review_board.mjs`, `token_lint.mjs`, `motion_scan.mjs`, `critic.mjs`, `detail_critic.mjs`, `motion_judge.mjs`), `existing_check.mjs`, `token_convert.mjs`, `palette.py`, `mockup_screen.mjs`.

## Report

Lead with the brand guidelines, readable without opening a file:

```
Idea:      the chosen idea, the claim and proof it comes from, where it shows
Bar:       the references kept and what each taught
Type:      family and weights by role, and why
Palette:   name, hex and role for each color
Imagery:   what the images are and how they were made
Owned detail: the one detail this brand owns
Rules:     three to five testable do and don't lines
Critic:    the blind scores round by round, and what moved them
Motion:    the motion judge result and the signature moment
Verified:  widths, interactions, contrast; and what was not verified
```

Write the same guidelines into `DESIGN.md` under "Brand guidelines". State the critic's score, never a self-score.
