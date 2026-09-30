---
name: seenry
description: "Design and build web interfaces at design-studio quality, not AI-template quality. Use for any new page, landing page, dashboard, app shell, pricing, settings, form or single component, for redesigns and visual polish, and for matching a reference. Sets the bar with real big-company screens from Seenry MCP, builds clean and premium on a proven product and motion floor, and does not finish until a strict slop check passes and a blind critic scores the page at big-company level."
license: MIT
metadata:
  author: Seenry
  version: "4.0.0"
---

# Seenry

The standard is simple: **clean, premium, no AI slop, at the level of the best big-company product design and the best independent studios** (Stripe, Linear, Apple, Attio, Figma, ARKET, kargul.studio). Everything below serves that. Read this whole file before building; the rules that decide quality are here, not in the guides.

Work in the project's existing stack. If the project has tokens, components or a `DESIGN.md`, read them first and extend them.

## Taste

Taste is trained, not invented: it comes from looking hard at the best work and asking why it feels right. Seenry gives you the library for that; use it every time.
- **Unseen details compound.** Nobody notices a 1px hairline, a concentric corner, tabular figures or a 140ms hover on its own. Together they are the difference between "tidy" and "expensive". Do all of them.
- **Remove before you add.** Every element must help someone read, choose or act. When a page feels plain, the fix is almost always better material, scale or spacing, not more decoration.
- **One idea per view, carried all the way.** One dominant element, one owned detail, one signature motion moment. Everything else is quiet so those can speak.
- **Real over representational.** Real product UI, real photography, real data and specific copy beat any illustration of them.
- **Motion is part of the design, not a finish.** A page that does not respond feels unfinished however good the stills look.

## The flow

1. **Brief (2 minutes).** Audience, the one job of the surface, the real content, what is fixed. One sentence of intent.
2. **Research pack from Seenry MCP.** Run `node scripts/research.mjs --type <landing|product|dashboard|studio|pricing|app> --terms "<2-3 short category words>" --sites "<leaders' domains>"` (needs `SEENRY_PRO_KEY`). It pulls 50–60 varied references across the library: human-rated picks, the category's own sites and sections, named leaders, random samples beyond the famous names, recorded motion walkthroughs with their videos, motion design clips, app screens for app surfaces, and measured design evidence. Read `.seenry/research/pack.md`, look at `contact.png`, open your shortlist at full size, then:
   - copy the 3 strongest first screens into `.seenry/refs/` (they are the bar for the critic);
   - pick 2 motion references and study their videos (below);
   - write in `DESIGN.md` why each was chosen, what you take and what you leave, which brands you discovered, and five lines on why the bar looks premium.
   If the script cannot run but the Seenry MCP tools are connected, do the same by hand with `discover_references`, `search_curated_references`, `search_references`, `search_sections`, `get_page_motion` and `search_designs` ([research](references/research.md)). Without MCP, use the live sites.
3. **Direction in five lines.** Neutral temperature and one action color; type from the table below; radius family; imagery; the one owned detail and the one signature motion moment. Pick the obvious premium answer before a clever one. For a new or changed identity, also follow `seenry-branding` ([its skill](../seenry-branding/SKILL.md)) and its project guidelines.
4. **Motion spec.** Read [seenry-motion](../seenry-motion/SKILL.md) now. Download the 2 motion videos from the pack (they expire), pull frames around their most-movement window with `python3 ../seenry-motion/scripts/video_frames.py`, and write `.seenry/motion.md`: for each moving thing, the trigger, what moves, duration, easing or spring, stagger, interruption and reduced-motion behavior, and which reference it came from. Include the signature moment and every in-place change (numbers, filters, add-to-bag).
5. **Material.** Photography and imagery via [seenry-assets](../seenry-assets/SKILL.md), art-directed and passed through `photo_check.mjs` (see Imagery). Illustration and ambient visuals per Craft below.
6. **Build on the floor.** App screens start from [the product kit](assets/kits/product.css); every page loads [motion.css](assets/kits/motion.css) and [motion.js](assets/kits/motion.js) and implements `.seenry/motion.md`; components come from the core kit and the page gets its signature moment (both below). Set font, neutrals and accent from step 3.
7. **Check until it passes.** Run `node scripts/check.mjs <file or url> --brief <brief file>`. It verifies the research pack, references, motion spec and `DESIGN.md` exist, blocks slop, readability, radius and motionless changes, sends photographs through the photo check, then asks a blind critic, a fresh model that sees only the screenshots, the brief and your reference screens, to score the page, and runs the motion judge, which clicks every control, films the transitions, measures durations, easing, animated properties, layout shift and reduced motion, and scores purpose, timing, spatial logic, smoothness and consistency. Apply every design and motion fix it prints and run it again until `PASS` (critic 9+ and motion 8+ with no motion violations). The final result must be a checked version: if you edit after the last round, check.mjs runs one more verification round. On `LAST ROUND`, make the one root-level change it asks for; on `STOP` or `STOPPED`, ship the best-scoring round. Never finish on your own opinion of the page: in testing, self-review rated 9 what blind review rated 6–7.
8. **Review and deliver.** For a second opinion on states and accessibility use [seenry-review](../seenry-review/SKILL.md). Write the "Brand guidelines" section of `DESIGN.md` and give the report below. The design sheet is optional and comes last ([sheet](references/sheet.md)).

For a small fix in an established system: repair on-system, then run `check.mjs` once.

## The standard

Leading teams look premium for one root reason: they ranked the job, then removed everything that does not serve it. Calm is the visible result. The reasons behind each rule are in [premium](references/premium.md).

**Never ship these (check.mjs blocks most of them):**
- Uppercase letter-spaced labels anywhere, especially eyebrows above titles. Use sentence case; the title says it.
- Numbered labels: "01 /", "(001)", "No. 03", "Step 01". Numbers only where order is real, as plain figures.
- Weights of 700 or more in UI, or more than three weights on a page.
- Italic serif accent words in headlines; trendy default faces used for flavor (Instrument Serif, Fraunces, Playfair, Space Grotesk, Clash Display).
- The default AI palettes: cream + terracotta or orange, plum + peach, navy + lime, forest green + cream as a costume, purple gradients.
- Clip-art imagery: sunset circles, vinyl records, flat SVG product stand-ins, tilted floating cards with sticker badges, gradient blobs, glows.
- Colored KPI hero cards with rings or stripes, an icon in every card, a card per row, saturated pill badges down a column.
- Generic slogans ("X is better together", "Built for the way you Y"), fake stats, lorem.
- Text people must read under 13px, or in a light grey that fails contrast.
- Framework default colors as the brand: Tailwind blue-600/indigo-500, violet-600, emerald-500, orange-500 on near-black. Derive the accent from the brand or its material and correct it in OKLCH (below).
- Colored dots in front of text ("● Active", "● Paid", status pills with a leading dot). A dot is only right when it is the whole message: a live or recording indicator, online presence on an avatar, an unread marker in a list; mark those with `data-seenry-dot="live|presence|unread"` (check.mjs blocks any other dot before text).
- Placeholder art: blurred gradient blobs, CSS gradients or code-drawn shapes standing in for album covers, product photos or avatars.

**Color.** Neutrals do the work, defined as roles: canvas, surface, selected, rule, three text levels. Pick the temperature once and keep every grey in it. One action color, used only for the primary action, selection and focus, so it is always findable. Status in data views (tables, lists, dashboards) is a quiet tinted pill with the word only (14/20 500, pale tint of its tone, no leading dot); the exception that needs action (Overdue, Failed) may be the one strong color. Outside data views, pills and chips need a real reason (a filter you can remove, a selected token, a live count); decorative pills, "New" chips and pill-shaped labels by reflex are slop. A brand surface may have one bold field (a dark band, a photograph); never a second accent.
- **Build it in OKLCH** with `python3 scripts/palette.py "<accent hex>"`: neutrals share one hue with chroma 0.002–0.012; steps are even in lightness (canvas 0.985, surface 1.0 or 0.97, rule 0.92, text 0.22/0.45/0.58 in light). The accent sits at lightness 0.50–0.62 and chroma 0.12–0.20; its hover is 0.04 darker; its subtle tint is lightness 0.96 at chroma 0.03.
- **Premium palettes that work:** cool graphite + one electric accent (Linear, Vercel: neutrals hue 250–270, accent indigo or blue); warm stone + deep ink accent (Aesop, ARKET: neutrals hue 60–80, accent near-black green, oxblood or navy); pure white + black + one saturated brand color used sparingly (Apple, Stripe). Sample the accent from the hero photograph or the product when there is one, then correct it to the lightness and chroma above.
- **Dark mode is its own palette,** not an inversion: canvas lightness 0.14–0.17 (never #000), surfaces step up by 0.03–0.04, text 0.96/0.72/0.58, borders at 8–12% white, accent raised 0.06–0.1 in lightness, shadows replaced by lighter surfaces.
- **Color on images and gradients:** text on a photograph gets a scrim from the image's own darkest tone, never a generic black overlay; gradients are allowed only as one soft light falloff in a single hue, never as a multi-color background.

**Type.** Use the brand's face if it has one. Otherwise pick from this list; these free faces are the closest to what the big companies use, and each needs its tuning to look expensive:

| Surface | Face (Google Fonts, self-host the WOFF2) | Tuning |
| --- | --- | --- |
| App screens, dashboards, SaaS | Inter (variable, with `opsz`) | `font-optical-sizing: auto`; `font-feature-settings: "cv11", "ss01"`; titles 600 at −0.015em; body 400 at 0 |
| Developer and technical products | Geist + Geist Mono | display 500–600 at −0.035em; mono only for code, IDs and keys |
| Consumer tech and product marketing | Inter Display (Inter with `opsz` 32) or Geist | display 56–80 at 500–600, −0.03em, line height 1.02–1.08 |
| Commerce, fashion, craft goods | Inter Tight for display with Inter for text, or Hanken Grotesk | product title 40–56 at 500, −0.02em; prices 500 tabular |
| Apple-feel web | `system-ui` (SF Pro) | display 600 at −0.02em; never download SF Pro |
| Editorial, long reading, hospitality | the sans above + Newsreader or Source Serif 4 for long-form text only | serif at 400 for reading, never as italic accents or display flavor |

Never reach for DM Sans, Plus Jakarta Sans, Space Grotesk, Poppins or Montserrat as defaults; they read as templates. One family per page plus a mono or reading serif only with a reason. Tune the chosen face: display tracking −0.02 to −0.03em, `text-wrap: balance`, real punctuation. Weights by role: 400 values and body, 500 labels, controls and row anchors, 600 titles and the key figure. Minimum sizes at 1440 (check.mjs blocks below them): paragraphs 16, any other readable text 15, short labels such as table headers and chips 14; pages are judged scaled down, so what reads as comfortable at 100% reads as faint in review; body text at least 4.5:1 contrast, never a pale grey. Table cells and row metadata use text-1 or text-2, never text-3; secondary grey is for labels, not for data people read. App screens: 28/34 page title, 16/24 body, 15/22 cells and row text, 14/20 meta and table headers in Title Case; the key figure 32–40 at 600. Brand surfaces: display 56–80 at 500–600, lead 20–22, body 18, supporting copy and captions 16, UI inside product mockups at least 14 at 1440. Money: sans, right-aligned, tabular in columns, consistent cents, real minus sign.

**Radius and elevation.** Radius says what a shape is and how big it is; getting it wrong is one of the fastest ways to look generated.
- **Pick the family once, from the brand:** sharp (0–4, editorial, fashion, technical: ARKET, Swiss print), product (6–12, tools and commerce: Stripe, Linear, Apple Store cards at 12–18), soft (16–24, friendly consumer). Every radius on the page comes from that family.
- **Radius by role and size:** small parts (tags, checkboxes, 28–32px buttons) 4–6; controls (36–48px buttons, inputs, selects) one shared value, 6–10; cards, panels and tables 12; large media, sheets and dialogs 16–20; full pill only for status chips, toggles, avatars and segmented-control thumbs.
- **Proportion:** a control's radius is at most 25% of its height (40px tall → 8–10) or exactly a full pill. Anything between 26% and 49% looks like a mistake (check.mjs flags it).
- **Neighbors match:** a button beside an input, and every control in a toolbar, share one radius and one height.
- **Concentric nesting:** inner = outer − inset (card 16 with 8 inset holds 8; card 12 with 16 inset holds square or 4 content). Never the same radius on a parent and its inset child.
- **Edges:** anything full-bleed or touching a container edge is square on that side; media flush in a card takes the card's radius only on the touching corners. Tables: container rounded, cells square. Product cut-outs and photographs of objects are not rounded beyond the family's media value.
- **Smoothness:** where supported, `corner-shape: squircle` inside `@supports (corner-shape: squircle)` on cards and media (raise the radius about 1.3× so the visual size matches); rings, focus outlines and shadows follow the same shape.
- **Elevation:** resting content uses 1px hairlines; only menus, popovers, dialogs and sheets get a shadow, and they use the large radius.

**Scale on desktop.** Premium pages use the whole 1440 canvas with confidence; a phone layout enlarged onto a wide screen reads as a template. At 1440: content spans 1200–1280; the hero image or product media takes 55–60% of the width and most of the first screen's height; the page or product title is 40–56 on product and commerce pages (56–80 on marketing heroes); controls are 44–48 high with 15–16px labels; the primary action is visible in the first screen on desktop and within the first screen and a half on phone. Selected states are decisive: a 2px dark border or a solid fill, never a pale tint plus a hairline.

**Layout and density.** One dominant element per view. Content max 1200–1280, gutters 32 desktop and 16–20 phone, 8px spacing scale, gaps between groups at least twice the gaps inside. App screens: summary as 0–3 figures in one divided strip, then the work (table or list) within the first screen; rows 44–56. Brand surfaces: generous and consistent section rhythm (96–128 desktop), each section one idea with real material, left-aligned text.

**Imagery.** Imagery is the most-cited gap between generated pages and big-company pages, so it is art-directed and checked, never accepted on the first try.
- Software: the real product UI with specific data is the image. Commerce and brands: photography of the real subject. Source it in this order: supplied brand photos; the host's own image tool; **`node scripts/image.mjs --prompt "<prompt>" --out assets/<name>.png`** (or `--batch jobs.json` for a set, three at a time), which generates through the Codex CLI's image model from any host, Claude included; `seenry-assets` with an API key; license-clear photos. Generate the whole set (hero, detail, context) in one batch with the same light and surface words so it matches.
- Name the real state of the subject: roasted beans are "medium-light roasted" (unroasted beans are green), a worn product shows wear, food is plated as served.
- Shoot like Apple, Aesop and ARKET: one subject, one large soft motivated light (upper left, diffused), a controlled soft shadow, a quiet seamless or natural surface (limestone, linen, pale wood, paper) in the page's neutral temperature, 85mm product height or 50mm for context shots, true geometry, a color grade that matches the palette. Plan the set, not one image: hero (subject fills 70–80% of the frame height, 4:5 or 1:1), a detail or texture close-up, and one in-use or context shot, all with the same light and surface.
- **Only when `image.mjs` and every other image route are unavailable, and sourced photos score under 7 on the photo check, do not use photos.** Compose without them: the real product UI at large scale, typographic covers (the title set in the brand face on one solid color field from the palette, like editorial album art or book covers), one monoline illustration system (Craft), or the product's own data. A weak or generic photo costs more than no photo; a gradient blob is never acceptable.
- Keep text out of generated images: leave labels blank or minimal and set brand names in HTML, because generated lettering garbles. No clichés: scattered beans, steam wisps, floating objects, sunset circles, gradient blobs, fairy-light bokeh.
- Run `node scripts/photo_check.mjs <images> --use "<slot, ratio, position>" --brand "<brand>" --refs .seenry/refs/<a>,<b>` before layout. Regenerate anything under 8 with the better prompt it writes; after three checks check.mjs accepts the strongest versions, so do not loop on imagery. Crop to the slot's exact ratio and export 2x WebP.

**Copy.** Plain, specific, short. Headlines say what it is or does for this audience; labels name the thing; empty states say what happened and the one next action.

**Motion.** The core rules, from `seenry-motion`:
- **Frequency decides.** Used 100+ times a day (keyboard, command menus, list arrows): no animation. Tens of times (hover, tabs, toggles): 120–160ms, color and opacity. Occasional (menus, dialogs, sheets, toasts): 180–240ms enter, faster exit. Rare (first load, success, onboarding): room for one expressive moment.
- **Easing:** ease-out for things entering or responding (`cubic-bezier(0.23, 1, 0.32, 1)`), ease-in-out for things moving on screen, never linear except for continuous loops; springs for anything dragged or interrupted.
- **From where, to where.** Layers grow from their trigger (`transform-origin` at the trigger), never from nothing: start at scale 0.96–0.98 with opacity 0, not scale 0. Exits reverse the entry.
- **Interruptible.** Use transitions, not keyframes, for anything that can fire twice; a second input reverses from the current value.
- **Stagger** 30–60ms per item, at most 5–6 items, then everything at once.
- **Only transform and opacity** in anything that runs often; no animating width, height, top or box-shadow on scroll.
- **Scroll scrubbing** (progress tied to scroll, not triggered once) is for explaining a sequence: a product assembling, steps of a flow, a before-to-after. Use `animation-timeline: view()` or `scroll()` with a JS fallback (the scroll story in the signature kit), scrub transform, clip-path and opacity only, keep parallax under 40px, pin at most one section per page, never hijack wheel speed or snap. Content is readable at every scroll position and in a full-page screenshot: scrubbed elements never start below 0.6 opacity or fully clipped.
- **The signature moment:** one crafted piece per page, taken from a studied reference (a hero reveal, a line illustration that draws in, a product UI that plays a real interaction, a canvas field behind the first screen). It runs once or ambiently, never blocks reading, and has a static reduced-motion state.

Every state change is visible and none is decorative. Copy [motion.css](assets/kits/motion.css) and [motion.js](assets/kits/motion.js) into the project's assets and load both (a classic script, so it works from disk). Then: every value that changes in place (price after a size change, totals, counts, filtered sums) uses `SeenryMotion.number(el, value, intlFormat)` so its digits roll; filtering, sorting, tab and view switches wrap the DOM update in `SeenryMotion.swap(() => render())`; add-to-bag and saves use `SeenryMotion.pop(badge)` plus `SeenryMotion.toast('Added to bag')`; hover 120–160ms, press 0.98, layers enter in 200ms. check.mjs clicks the page's controls and blocks any state change that happens with no motion. Reduced motion is respected throughout; `seenry-motion` has more recipes.

**Phone.** Recompose, do not squeeze: bottom tab bar or menu (never a clipped scrolling tab row), compact two-line rows, 16px inputs, 44px targets. A sticky buy or action bar appears only after the in-flow button has scrolled out of view, hides again while the options it depends on (size, grind, plan) are on screen, reserves its height at the page end, and shows the full price at 15px or larger.

## Components

Do not hand-roll common components. Copy [the core kit](assets/components/ui/README.md) (`seenry-ui.css` + `seenry-ui.js`: buttons, fields, select, checkbox, radio, switch, segmented control, tabs, menu, tooltip, dialog, sheet, toast, accordion, badge and status, avatars, cards, sortable and filterable table, pagination, empty state, stat strip, breadcrumb, kbd, skeleton, command menu) into the project, set its tokens from the direction, and restyle only through tokens. Open its `gallery.html` to see every state in light and dark. In React, Vue or Svelte projects, use the README's snippets or the project's own library (Radix, Base UI, shadcn) styled to the same tokens; never ship two component systems.

**Any interactive component the kits do not have** (hold to confirm, slide to confirm, a status island, a morphing button, a reorderable list, a scrubber, a gauge, anything with states and motion): before writing code, fill in the component brief from [interaction craft](../seenry-motion/references/interaction-craft.md) (job, one idea, state graph, geometry, motion score with reasons, interruption rule, input contract, accessible result, reduced motion, runtime budget, demo, must-not-happen) and save it as `.seenry/components/<name>.md`; build to it, then review the result with that guide's checklist.

## The signature moment (always, on Seenry's own initiative)

Every page Seenry designs gets one crafted, creative component that makes the product's behavior or the brand's idea visible. Do not ask whether to add it; choosing it is part of the design. Start from [the signature kit](assets/components/signature/README.md) and its "Choosing the signature moment" guide: product demo player (a cursor clicks and types inside the real UI), line illustration draw-in, ambient field, scroll story (a sticky visual that changes with each step, scrubbed by scroll), live numbers, logo marquee, compare slider, case-study card with hover preview. Adapt it to the brand (content, color, drawing, timing from `.seenry/motion.md`) so no two pages look alike, or build an original one when the brief has a better idea. One per page, placed where it explains the most (usually the first screen or the product section), with `data-seenry-signature="<name>"` on its root element (check.mjs looks for it); it has a complete still state and never blocks reading.

## Craft: illustration and ambient visuals

Independent studios (kargul.studio, Linear's illustrations, Stripe's diagrams) separate themselves with a drawn visual language. When the brief calls for it:
- **One system, not assets.** Pick one language and use it everywhere: monoline isometric or orthographic line drawings (1–1.5px strokes in text-2 on the surface color, one accent at most), or precise product diagrams built from real UI parts. Write it as SVG by hand or with code, on the 8px grid, with consistent angles (30° isometric) and stroke weights; never mix flat icons, 3D clay and line art.
- **Explain, do not decorate.** Each drawing shows the thing it sits beside: the service's structure, the product's flow, the data's shape. Abstract blobs, gradients and generic "tech" swirls are slop.
- **Ambient canvas.** A slow field, grid or line animation behind a first screen or a closing section may carry the brand's movement: start from `seenry-motion`'s [signal field](../seenry-motion/assets/signal-field/README.md), [boundary trace](../seenry-motion/assets/boundary-trace/README.md) and [image reveal](../seenry-motion/assets/image-reveal/README.md) and adapt; keep it under 10% CPU, pause offscreen with `IntersectionObserver`, stop for reduced motion, and never put text on moving pixels.
- **Draw-in, not fly-in.** Line illustrations reveal by stroke (`stroke-dashoffset`) or a mask sweep in 600–900ms when first visible, once.
- **Portraits and people:** real photographs, or one consistent illustrated style for the whole set (same line weight, same crop, same background); never mixed.

## Grid and alignment

4px base, 8px layout values, spacing `4 8 12 16 24 32 48 64 96 128`. Align ink, not boxes: a title's cap height meets the media's top edge, icons sit on the text keyline; edges are exact or at least 8px apart ([alignment](references/alignment.md), [optical](references/optical.md)). Components have at most 3 sizes and 3 weights ([components](references/components.md)); pages share one shell ([pages](references/pages.md)).

## Guides

| Need | Read |
| --- | --- |
| Why leading teams choose their colors, radii, weights and density; premium, clean, elegant rules | [premium](references/premium.md) |
| Concept, directions, type voice, palette origin, signature component, generated-page defaults | [art direction](references/art-direction.md) |
| Tokens, grid, spacing, radius, elevation, starter CSS | [system](references/system.md) |
| Exploring compositions inside a fixed frame, studio critique | [exploration](references/exploration.md) |
| Constructing and speccing components, anatomies | [components](references/components.md) |
| Page shells, section archetypes, page templates | [pages](references/pages.md) |
| Font choice by product type, scale, tracking, numerals | [typography](references/typography.md) |
| Palette roles, dark mode, contrast | [color](references/color.md) |
| Keylines, ink-level alignment, optical inset, proportion | [alignment](references/alignment.md) |
| Optical centering, size compensation, side bearing, icon nudges | [optical](references/optical.md) |
| Optical corrections, icons, hit areas, states | [craft](references/craft.md) |
| Headlines, labels, errors, empty states | [writing](references/writing.md) |
| Which library to use instead of hand-rolling a component | [libraries](references/libraries.md) |
| Phone browser quirks: viewport units, tap, zoom, safe areas | [mobile web](references/mobile-web.md) |
| Keyboard, semantics, zoom, reduced motion | [accessibility](references/accessibility.md) |
| Choosing material; sourcing and generating it | [imagery](references/imagery.md) and `seenry-assets` |
| Seenry MCP recipes and offline research | [research](references/research.md) |
| The design sheet: rationale, research, anatomy, guidelines | [sheet](references/sheet.md) |
| Measured evidence from leading product sites | [benchmarks](references/benchmarks.md) |
| AI tells and their fixes | [anti-slop](references/anti-slop.md) |
| Faithfully reproducing a supplied design | [replication](references/replication.md) |

Use `seenry-assets` for images, icons and fonts, `seenry-motion` for transitions and interaction, `seenry-apps` for native mobile, `seenry-branding` for identity systems, `seenry-review` for audits, diffs and stress tests.

## Tools

- [Core components](assets/components/ui/README.md) and [signature components](assets/components/signature/README.md): copyable, token-driven, accessible, light and dark, with galleries.
- [Research pack](scripts/research.mjs): pulls 50–60 varied references from Seenry MCP (rated picks, category sites and sections, leaders, random samples, motion recordings and clips, app screens, measured design) into `.seenry/research/` with a contact sheet.
- [Check](scripts/check.mjs): the finishing gate. Runs the review board, blocks on slop, then the blind critic against the reference screens; prints PASS or the fixes to apply.
- [Image generation](scripts/image.mjs): photographs through the Codex CLI's image model from any host; single or batched.
- [Motion judge](scripts/motion_judge.mjs): plays every control, films each transition and a rapid double click, measures animations (properties, durations, easing), layout shift, long frames and reduced motion, blocks hard violations and scores the motion blind.
- [Photo check](scripts/photo_check.mjs): a blind art director scores each image for its slot against the references and writes a better prompt for anything under 8.
- [Blind critic](scripts/critic.mjs): a fresh Codex or Claude process scores the page against the references with the premium standard and returns ranked fixes.
- [Review board](scripts/review_board.mjs): the page at review scale beside the references, plus craft blockers the grid audit cannot see (legibility at scale, eyebrows, numbering, weights, font loading, figure spacing, phone clipping, fixed overlays, motion coverage). Run it every review round.
- [Product kit](assets/kits/product.css) and [motion floor](assets/kits/motion.css): the starting quality floor for app screens and interaction.
- [Page audit](scripts/audit_page.mjs): one command for any project (URL or HTML file) at several widths; runs the system and optical audits and prints fixable findings. Needs Playwright.
- [Optical audit](scripts/optical_audit.mjs): rasterizes icons to measure ink; reports off-center icon buttons (including asymmetric shapes), icons missing their label's cap-height center, labels not centered in controls, unbalanced icon-side padding and headline side bearing, each with a CSS nudge.
- [System audit](scripts/system_audit.mjs): counts rendered font sizes, weights, families, radii, shadows and colors; lists off-grid padding, gaps and margins; flags non-concentric corners, wrapped control labels and components over 3 sizes or weights; per component, measures ink-level alignment (cap tops, baselines, drawn glyphs, media edges): near-miss edges, media anchors and optical insets. Run it on every screenshot pass.
- [Design sheet](scripts/sheet.py) and [anatomy capture](scripts/anatomy.mjs): the end-of-task deliverable, styled like seenry.design.
- [Exploration sheet](assets/explore.html): renders variant files side by side at real widths for critique.
- [Grid overlay](assets/layout-guides/README.md): development-only columns, gutter and 8px checks.
- [Palette](scripts/palette.py): OKLCH ramps from one brand color, two-tier tokens for light and dark, and WCAG + APCA measurement of every pair; `--check FG BG` for one pair.
- [Starter tokens](assets/tokens.css) and [DESIGN.md template](assets/DESIGN.template.md).
- [Text collisions](scripts/text_collisions.mjs), [control geometry](scripts/control_geometry.cjs), [visual inventory](scripts/visual_inventory.mjs), [token contrast](scripts/token_contrast.py), [contrast check](scripts/contrast_check.py).

## Report

Lead with a **brand guidelines summary** the user can read without opening anything, then the paths:

```
Bar:       <the 3 reference screens and the five lines on why they look premium>
Direction: <intent in one sentence>
Type:      <family and weights by role; why>
Palette:   <name hex role> · … ; temperature and why
Radius:    <family by role>; elevation rule
Imagery:   <what the images are and how they were made>
Owned detail: <the one detail this brand owns>
Rules:     3–5 testable do/don't lines for future work
Critic:    <round-by-round blind scores from check.mjs, e.g. 6 → 7 → 8 → 9> and what moved it
Motion:    <motion judge score, durations and curves used, the signature moment>
Verified:  <widths, interactions, contrast>; not verified: <…>
```

Write the same guidelines into `DESIGN.md` under "Brand guidelines". State the critic's final score, never a self-score.
