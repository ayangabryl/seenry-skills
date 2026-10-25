---
name: seenry-apps
description: "Design and build native-feeling mobile app screens and flows (SwiftUI, UIKit, React Native, Expo, Flutter, mobile web prototypes) that match top App Store apps. Use for onboarding, tab and stack navigation, lists, forms, settings, paywalls, players, sheets and empty or error states. Researches whole journeys in real apps via Seenry MCP (the flow from the app it is based on, the look from the app it should look like), then enforces navigation doors, a mechanical slop pre-flight and a beat-the-reference gate."
license: Apache-2.0
metadata:
  author: Seenry
  version: "0.1.0"
---

# Seenry Apps

Mobile quality is mostly platform fidelity plus the same discipline as the web system: a strict grid, components built in layers, few type sizes, one accent, and every state designed. Work in the project's existing stack and components.

**References over priors.** The palette, materials, type and layout come from the screens you studied, never from what you would reach for unprompted. When a screen looks like "a dark screen with one yellow accent and bold headlines", it came from priors, not research.

**References inform, taste decides.** Research shows what people expect and how leaders solved the screen; it does not design the screen. The design comes from one idea, chosen on purpose, and carried into the small, ordinary parts of the interface, the way a designer thinks: "if every place you keep is a matchbook, then progress is five matches and each answered step strikes one." Rules in this skill catch tells; they never outrank a choice that clearly fits the idea, written down with its reason in `.seenry/look.md`.

**Carry the idea into the ordinary parts.** After choosing the idea, go through the plain components every screen has and ask what each becomes in this product's world. Pick the three or four where the answer is simple, obvious once seen and still usable, and build those; leave the rest native. Write them in `.seenry/idea.md` as "component → what it becomes → why it reads instantly":
- **Progress:** steps as the product's own unit (matches struck, pins dropped on a map, stamps in a passport, cups filling), never a generic bar when the idea offers a unit.
- **Selection:** a chosen option changes like the object would (stamped, pocketed, pinned, lit), not only a checkmark.
- **Buttons and replies:** labels in the user's voice that answer the screen ("same here.", "that's me"), one consistent voice.
- **Counts and totals:** the tally is the collection itself (three matchbooks, not "3 selected").
- **Loading and waiting:** the wait shows the thing being made (matchbooks being printed), never a spinner when something is being built from the answers.
- **Empty and payoff states:** the empty state is the object with nothing in it yet; the payoff is the user's answers made into the object.
Each one must stay instantly legible: if a person has to learn what the metaphor means, use the native control instead. Two to four of these, done simply, are what make a screen feel designed; ten of them make it a gimmick.

**Scope is what was asked.** "A welcome screen" is one screen (with its entrance motion and states), not an onboarding flow; "the onboarding" is the flow. Build the asked scope to the highest standard rather than a larger scope to an average one.

**Finished means the gate has seen it.** A new screen or flow is done only after steps 2, 3, 5 and 10 have all run: the research floor below, a look sourced from real screens, the three-direction blind pick (`pick.mjs`) and `check.mjs` on the simulator screenshots as the last call, with its score line quoted in the reply. A one-line request ("a simple onboarding screen") gets the same steps in quick mode, never a shortcut; a run that skips them is unfinished however clean the build looks. Plain models already build tidy, competent screens, so the steps that make the result specific are the whole point of this skill.

## Workflow

1. **Name the jobs.** Write `research/brief.md`: what the product is based on (the flow), what it should look like (the look), and what job the signature screen does (the edge). "Based on X, designed like Y" means X gives the flow and Y gives the look; one named app gives both; none means choosing the look on purpose. Follow [research](references/research.md).
2. **Study real apps, whole journeys.** With Seenry MCP, find apps by name (`search_app_flows {q: "<app>"}`) and walk complete flows in order (`get_app_flow`, paging to the end). At least three complete flows for any flow you build (the based-on app plus best-in-class leaders, for onboarding Headspace, Duolingo, Calm or Noom), at least 8 screens of the look app across 2–3 flows, 10+ screens of each other screen type, and one `borrow_references` pass for the edge. Stop at saturation, when new screens stop changing the spec. App screens carry a small watermark; ignore it.
   **A named app sets the direction; the wording sets how closely.**
   - *Replicate* ("similar to", "like X", "replicate", "same as", "a copy of"): the named app's screen is the look. Keep its composition, ground and material, effect, type class and element count, and apply the measured fidelity steps below. "In your theme" changes the product, name, objects, photos and copy, at most the accent.
   - *Inspired* ("inspired by", "borrow from", "take the idea of"): borrow the core, not the surface. Before designing, write `research/core.md` from the reference's screens and recording: three to five principles that make it work, each as "what it does → why it works" (for Corner's welcome: the brand name is a physical object you could hold; the world is built from the product's own nouns as real objects; real people's moments carry the promise; deadpan one-line statements answered by a reply-style button; a calm open stage so the objects read). Then list the surface signatures you will not take (Corner: the chrome balloon wordmark, the sky photo, its exact lines). Build every principle in your own material, palette, type, objects and words. The palette and type come from the idea and its mood (an after-hours places app can be warm and dark, an object can set the color), not from avoiding whatever the category uses. The test: a stranger would not call it a reskin, and someone who knows the reference senses the lineage. Run the fidelity measurements only on what you deliberately kept (layout rhythm, element count), never to match its look.
   - In both modes the copy is your own. Never reuse the reference's lines ("sound good?" / "sounds good." belong to Corner); write the same kind of line in this product's voice.
   - In both modes the reference's signature is never dropped for lack of assets; and the category-default and look-app rules that follow apply only when no app is named.
   **The research floor, in every mode:** walk at least three flows to their last screen (page `get_app_flow` until `next` is empty; one to four screens is a peek, not a flow); open at least five leaders of this product's own category at full size (a sleep app opens Calm, Rise, Sleep Cycle, Oura, Pillow; search by category with `search_reference_assets {family: "apps"}` when you do not know them); pick one look app on purpose and open eight or more of its screens; and open the `borrow_references` results you ask for, at full size, then name what you took from them. Write each screen you opened, with its id, in `research/screens.md`. Searching and listing do not count as studying.
3. **Write the spec before code.** `research/flows.md` charts each flow's spine (per step: asks, gives, presentation), `.seenry/look.md` holds the look app's palette, type, numerals and named signature components, `research/patterns.md` splits table stakes, edge and opening, and `research/decisions.md` lists each decision with the screen ids it came from, plus the navigation map. Every onboarding screen carries one of the look's signature components with this product's content.
   **Sources are evidence; the system is designed.** References tell you what to keep (a grainy dusk, a condensed serif, a reply button); they are not a parts list. Collecting one color from each reference and one face from another gives a collage that clashes, however well sourced. Design the look as one system and note in `.seenry/look.md` which reference informed each decision:
   - **Color:** one color world for the whole flow. Choose a ground family (it may change in lightness or warmth between screens, never switch worlds, such as a dusk gradient on two screens and cream paper on the rest), ink, one accent and at most one object color, related on purpose (analogous, or one complementary pair). Grade every photo and object into that world: a red book on a purple-orange gradient with rainbow spines is three palettes. Check it with `python3 ../seenry/scripts/palette.py` or by eye on the strip below.
   - **Type:** one family, or a pair that contrasts in one way only (serif with sans of similar width and x-height). Never pair a condensed face with an expanded one; extreme widths fight. Set a specimen with the real headlines, buttons and body on the real ground at real size before building, and keep the display voice consistent across every screen (the welcome and the questions speak in the same voice).
   - **The strip test:** before the gate, put every screen in one row at small size. If any screen looks like it belongs to a different app, or the palette reads as more than one world, fix the system, not the screen.

   **Leave the category's default (only when no app is named).** From the five category leaders, write down the palette and type most of them share (sleep: dark navy with warm amber or lavender; finance: green on white or black; fitness: black with neon). Your identity must not be that combination; keep the category's conventions for layout and flow, change the color world or the type voice.
   **Take the signature, not the defaults.** The look app's platform defaults (system blue, white grouped sheets, SF Pro, grey rows) are not its look; every app has them. Its look is the signature components and the attitude behind them. The product gets its own identity on top: an accent from its own idea (never iOS blue or indigo unless the brand owns it), a display or numeral treatment people will remember, and a color world that fits the subject (a sleep product lives at night). If the screens could be any app's onboarding with the logo swapped, it is slop, however faithful the research.
   **"Similar to X" means it should read as X's screen at a glance.** When the brief names an app for a screen or an effect ("a welcome screen with liquid glass like Wabi"), that app's screen fixes five things: the composition (what sits where, at what size), the ground (lightness and material), the effect and its beats, the type class and weight (a medium grotesk stays a medium grotesk, at the same size), and the number of things on screen. "In your theme" changes only the content (your product's objects instead of theirs), the accent color, the copy and the icon. Work it like a replication, not an inspiration:
   - Find the reference's recording (`search_app_screens {app_id, media_type: "video"}`) and its stills, pull frames at 6–10fps (`python3 ../seenry-motion/scripts/video_frames.py`, or ffmpeg) and keep the settled frame.
   - Measure, never estimate: `python3 scripts/measure_screen.py <settled frame>` prints the ground and every element's box in points. Write `research/fidelity.md` from it: a table of each element (hero object, headline lines, action, accents) with its measured size and position, the ground hex, the headline's point size and weight, the count of large elements and specks, and the beats with timestamps (what happens at 0.0s, 0.3s, 0.6s…).
   - Build to the table. Keep the hero object's size, the headline's position and size, the action's width and the amount of stuff on screen; when the reference shows three icons and a few specks, show three objects and a few specks, not a dozen.
   - Verify: screenshot your build at the reference's beats and run `python3 scripts/measure_screen.py <reference frame> <your screenshot>`. Every matched element sits within the tolerance (no `<- off`) and extra elements stay within a third of the reference's count; fix and re-measure until it does. Then put the frame strips side by side, same beats, and check the motion order and timing match.
   - Judge the effect up close, because a measured outline can match while the effect itself is missing. At the reference's two or three key beats, run `measure_screen.py <reference frame> <your frame> --closeup x,y,w,h` around the hero object and look at `closeup.png`. Write in `fidelity.md` what the reference's effect actually shows (for Wabi's orb: a clear glass with the surrounding content, people's photos and app icons, wrapped and stretched around the inside of the rim with cyan and yellow fringes; the bubbles that fly in carry real images) and check yours shows the same kind of thing: the same transparency, content of the same richness being displaced (your product's real objects, photos or UI, never plain colored dots), and the distortion visible in a still. A pearl, a frosted disc or a ring with a highlight is not liquid glass. Build launch arguments that freeze the animation at a time so each beat can be captured exactly.
   Flipping a light reference to dark, swapping its effect for a different one, changing its type class, covering its calm ground with texture or crowding it with extra elements fails the brief however well it is built.
   **Missing material is a production task, never a reason to change the design.** When the reference's identity rests on imagery (photo collage, 3D objects, a rendered wordmark), produce it: generate with `node ../seenry/scripts/image.mjs` (3 variants per asset, keep the best, one style family, transparent or matched backgrounds for cut-outs), source license-clear photos with `seenry-assets`, or build it in code (SceneKit or a Metal shader for a chrome or glass wordmark, SwiftUI shapes for stickers and pills). Writing "we have no photos" and replacing a collage with chips or dots fails the brief.
   **Objects must be objects.** When the idea is physical things (the brand as an object, a collection of things, a desk, a table, a shelf), they must read as real objects with weight, not colored rectangles with a label:
   - **Material:** render each object as a photoreal cut-out (`node ../seenry/scripts/image.mjs`, one style and one light for the whole set: "studio product shot, soft key light from top left, transparent or #<ground hex> background, no text"; then put the brand's own name and type on it in code so labels stay crisp) or model it in SceneKit/RealityKit with PBR materials and real lighting. Paper gets fibre and print texture, metal gets reflections, glass gets refraction.
   - **Construction:** draw the details that make it that object: a matchbook has a fold, a cover flap, a striker strip and matches inside; a ticket has a perforation and a stub; a cup has a lid, a sleeve and a rim. List them in `research/core.md` and check each one in the close-up.
   - **Depth:** compose in space, not on a grid: objects overlap, vary in scale and rotation, one sits closer (larger, sharper) and others recede; every object has a contact shadow plus a soft ambient shadow from one light direction; one or two can tilt toward the camera in perspective (`rotation3DEffect`). A tidy grid of equal tiles reads as a layout, never as a table of things.
   - **Every screen, not only the hero:** when the identity is objects, the question screens answer in objects too. Each option shows its object (a souvenir, a matchbook, a cover), choosing one physically changes it (it lifts, flips, gets stamped, slides into a pile), and a small collection of what you have chosen so far grows on screen as you go. Plain list rows on a dark ground between an object-rich welcome and payoff break the world.
   - **Motion with weight:** objects arrive the way they would physically (drop and settle on a spring with a little bounce and shadow catching up, slide and stop with friction), and a light device-motion parallax may shift near objects more than far ones. A uniform fade or drop-in is not physical.
4. **Map the flow and its doors** with [flows](references/flows.md): what each screen is (push, modal, sheet, replace), what back does from it, and the one-way doors (finished onboarding, sign-in, purchase) where back must not re-enter. Onboarding asks one thing per screen, teaches with the answers, and ends on a payoff built from them before any permission or paywall.
5. **Explore the signature screen, then pick blind.** When an app is named in replicate mode, all three directions stay inside its identity and differ in the idea, content and motion; in inspired mode, all three apply the principles from `research/core.md` and differ in material and idea. Otherwise build three directions of the screen the flow exists for (usually the payoff, with the welcome screen in the same direction) as separate files: one conventional control, two that each break a cliché, one built on the borrowed edge. They must differ in what the eye lands on first, not only in layout. Run `node ../seenry/scripts/pick.mjs a.html b.html c.html --brief <brief> --refs <look app screens>` and build the whole flow in the winner's direction.
6. **Spec each component** with the [four-layer construction](../seenry/references/components.md): grid → safe space → structure → type and states.
7. **Build the connected states** with real data: loading, empty, error, permission denied, offline, success, and the keyboard-open layout. Web prototypes start with `<!doctype html>`, `<meta charset="utf-8">` and a viewport meta.
8. **Pre-flight the counts, native source included:** `node scripts/app_preflight.mjs <source>` (SwiftUI, Compose and Flutter files too) warns on common default faces (Instrument Serif, Fraunces, Playfair, Space Grotesk, Clash Display; any of them is fine when it suits the identity and `.seenry/look.md` says why), counts tracked uppercase labels, numbered labels, italic accent words, monospace used as texture, dots before text, accent hue families, grey families, the radius scale, emoji in UI, gradients, type families, labels per intent, encoding and the document head. The screenshot gate cannot see these, so a failed count is a fix, not a judgment call; a deliberate exception from the look (Flighty's status colors) is written in `decisions.md`.
9. **Walk it on the simulator and record it.** Run the flow end to end on the iOS Simulator (or an Android emulator), web prototypes included: serve the folder, boot an installed iPhone (`xcrun simctl list devices available`, then `xcrun simctl boot <udid>`; one run per simulator), `xcrun simctl openurl booted http://127.0.0.1:<port>/`, screenshot each step with `xcrun simctl io booted screenshot NN-step.png`. A desktop browser at 390px does not show Safari's toolbars, safe areas, keyboard or real font rendering. Exercise every step, every back path (chevron, edge swipe, Android back), back after each one-way door, sheets dragged and cancelled mid-drag, the keyboard both ways, skip everything once. Record it (`xcrun simctl io booted recordVideo rec.mov`; Android `adb shell screenrecord /sdcard/rec.mp4`) and watch it twice, once at speed and once frame by frame, for wrong-theme flashes, layout jumps and dropped frames.
10. **Beat the reference, screen by screen.** Put each of your screens beside the best equivalent screen you studied. Any screen that reads worse goes back in the loop. Then run the gate: `node ../seenry/scripts/check.mjs --screens <screens in flow order> --video rec.mov --brief <brief>` and apply its fixes until PASS or STOP. In showcase mode, on STOP below the target, rebuild the signature screen and flow on a different direction from step 5 and run `check.mjs --new-direction` once before reporting. Use `--mode quick` by default (one critic round, fixes applied once), `--mode polish` when asked for production-ready work and `--mode showcase` only for a showcase. Report the score and level in the delivery: pass (9), leader level (8) or below leader level with the gaps. Without Seenry MCP, first run `node ../seenry/scripts/research.mjs --type app` so the critic has a bar. Write `.seenry/idea.md`, `.seenry/motion.md` and `DESIGN.md` as in `seenry`; the gate checks for them.
11. **Deliver the Seenry sheet** as in `seenry` ([the sheet](../seenry/references/sheet.md)): screenshots per state, the apps and flows studied with ids, the decisions and their sources, anatomy of the signature screen and guidelines. Use `sheet.py`; annotate simulator screenshots by hand where `anatomy.mjs` (web only) does not apply.

## Platform system

| | iOS | Android (Material 3) |
| --- | --- | --- |
| Grid | 4pt base, layout multiples of 8 | 4dp base, layout multiples of 8 |
| Screen margin | 16 (20 on large phones and inset grouped lists) | 16 (24 on larger) |
| Min touch target | 44×44 pt | 48×48 dp |
| Nav bar | 44 + large title 52 | Top app bar 64 |
| Tab bar | 49 + home indicator; 3–5 items; icon 24–28 + label 10/500 | Navigation bar 80; 3–5 items |
| List row | 44 min; 60–76 with subtitle or 40pt image | 56 one-line, 72 two-line |
| Grouped list | inset 16, radius 10–12, separators inset to text | cards or full-width with dividers |
| Buttons | 50 tall full-width primary, radius 12–14 or capsule | 40 filled/tonal, radius full |
| Sheets | detents medium/large, grabber, radius ~10 system | bottom sheet, drag handle 32×4 |
| Type | SF Pro: Large Title 34, Title 1 28, Title 2 22, Title 3 20, Headline 17/600, Body 17, Callout 16, Subhead 15, Footnote 13, Caption 12/11 | Roboto/Flex: Display 57/45/36, Headline 32/28/24, Title 22/16/14, Body 16/14/12, Label 14/12/11 |

Use Dynamic Type text styles (iOS) and `sp` with font scale (Android) instead of fixed sizes. Use the project's tokens, or the look studied in `.seenry/look.md`, mapped onto system semantic roles (`label`, `secondaryLabel`, `systemBackground`), so dark mode and increased contrast work; plain system colors only when there is neither. These metrics are the platform floor, not the style: a web prototype takes native sizes, targets and safe areas, not iOS default styling.

## Screen rules

- **One primary action per screen**, placed where the thumb is: a bottom-pinned full-width button above the home indicator, or the trailing nav bar item for "Save/Done".
- **Per component: ≤3 text styles.** A player card uses Headline, Subhead and Caption; nothing else.
- **Concentric corners** on nested shapes (`inner = outer − inset`), and continuous corner curves (`.continuous` / squircle) on iOS.
- **Content first.** Lists, media and records get the screen; summaries and headers stay compact. Large titles collapse on scroll.
- **Native controls** before custom: pickers, toggles, segmented controls, menus, share sheets, date pickers. A custom control must match their feedback (haptics, press states) and accessibility.
- **Safe areas and keyboard.** Nothing under the notch, Dynamic Island, home indicator or keyboard. Primary buttons ride above the keyboard.
- **Onboarding**: one idea per screen with visible progress and skip, the product's signature view in the first screen, choices as large rows, and permissions behind a pre-prompt at the moment they pay off. Length follows the studied flows: a personalized product earns 8–15 screens when every answer visibly changes the payoff; a tool with nothing to personalize gets 1–3. End on a payoff built from the answers before any paywall ([flows](references/flows.md)).
- **Paywall**: show what the product does (real screens or features), the plan choice with the recommended plan preselected, the price per period with trial terms in plain text directly under the CTA, restore purchase and terms links.
- **Settings**: grouped inset lists, sections of 2–6 rows, icon tiles 28–29 with radius 6–7 in one style, values trailing in secondaryLabel, destructive actions last and separate.
- **Empty and error states** inside the region, with one action that resolves them.

## Alignment

The same keyline, ink-level and optical rules apply natively ([alignment](../seenry/references/alignment.md), [optical](../seenry/references/optical.md)): align SF Symbols by their glyph (use `.imageScale` and baseline alignment with text, `alignmentGuide` for cap-height alignment), use `firstTextBaseline` alignment for icon + label rows, and check play/chevron glyph centering in circular buttons at 3x screenshots.

## Motion

Gate every animation by how often it is met ([flows](references/flows.md#motion-frequency-gate)): the platform's own for tabs, scroll, back and keyboard; under 150ms for presses; designed moments only where they are rare, like the onboarding payoff. Navigation motion comes from the platform (push, sheet, zoom). Custom motion: springs (`response 0.35–0.5, dampingFraction 0.8–0.9`), interruptible, 150–300ms feel, with haptic feedback on commit (selection, success, warning). Respect Reduce Motion. For web-based apps, use `seenry-motion` and the Seenry Transitions kit.

The same transitions the web kit provides, natively (apply them without being asked, by situation):

| Situation | SwiftUI | Jetpack Compose | React Native |
| --- | --- | --- | --- |
| Trigger becomes the surface (menu, card to detail) | `matchedGeometryEffect` or `.navigationTransition(.zoom(sourceID:in:))`; close lands where the trigger was | `SharedTransitionLayout` + `sharedBounds` | Reanimated shared element transitions |
| Sheet, dialog | `.sheet` with `.presentationDetents`; custom: `.spring(response: 0.4, dampingFraction: 0.86)` | `ModalBottomSheet`; `spring(dampingRatio = 0.86f, stiffness = 400f)` | `@gorhom/bottom-sheet`, spring damping 20-24 |
| Changing numbers | `.contentTransition(.numericText(value:))` inside `withAnimation` | `AnimatedContent` per digit, slide by direction | Reanimated per-digit `FadeIn/SlideIn` by direction |
| Tabs, segmented control | shared indicator via `matchedGeometryEffect` | animated indicator offset with `animateDpAsState` | Reanimated `withSpring` indicator translateX |
| List insert, remove, reorder | `.transition(.move(edge:).combined(with: .opacity))` on stable IDs | `Modifier.animateItem()` | `LinearTransition` / `FadeIn` layout animations |
| Button loading, success, error | `.symbolEffect` and `.contentTransition(.symbolEffect(.replace))`; `.sensoryFeedback` | `AnimatedContent` for the label; `HapticFeedback` | icon swap with scale 0.9→1 and opacity; `expo-haptics` |
| Toast, banner | from the top safe edge, spring in, 120ms ease-out out | `AnimatedVisibility(slideInVertically + fadeIn)` | Reanimated `SlideInUp` / `FadeOut` |

Exits are faster than entrances, only transform and opacity move in lists, and every custom animation has a Reduce Motion path (`@Environment(\.accessibilityReduceMotion)`, `Settings.Global.ANIMATOR_DURATION_SCALE`, `AccessibilityInfo.isReduceMotionEnabled`).

## Anti-slop for apps

| Tell | Fix |
| --- | --- |
| Web-style centered hero screens inside an app | Content-first native layout |
| Custom tab bar with glows, gradients or floating blobs | System tab bar or a quiet custom one with native metrics |
| Every row in its own colored gradient card | Grouped inset list |
| 12px body text, fixed font sizes | Dynamic Type styles, 17pt body |
| Paywall hiding price or trial terms | Price per period and terms under the CTA |
| Purple gradient onboarding with stock 3D illustrations | Show the product doing its job |
| A named look ("like Flighty") rendered as system blue on grouped lists | Signature components from `.seenry/look.md` and the product's own accent and color world |
| Every question the same white card with radio rows and a blue full-width button | Answers as the product's own objects (a time on the board, a pass filling in), a different input per kind of answer |
| Platform defaults copied from the reference and called its look | The reference's signature components and attitude; defaults are not identity |
| Web prototype without `<meta charset="utf-8">` and a viewport meta | Both in `<head>`; check punctuation renders and the layout fits 390pt |
| Buttons 36pt tall at the screen bottom edge | 50pt, inset 16, above the home indicator |
| Uppercase tracked labels and numbered labels ("FIELD NOTEBOOK · NO. 001") | Sentence case, no tracking, no numbers unless order is real |
| An italic or colored accent word in the headline | One voice per headline |
| Monospace notes, timestamps or code-like text as background texture | A calm ground; mono only for aligned figures |
| A line of text swapping while the old and new copies overlap (ghosted words under the current line) | Fade the old line out fully before the new one arrives, or slide both inside a clipped slot; capture a frame mid-swap with a freeze launch argument to prove no overlap |
| A palette collected from several references (one gradient, one paper, one accent, unrelated object colors) | One color world: ground family, ink, one accent, objects graded into it |
| A condensed face paired with an expanded one | One family, or a pair that differs in one way only |
| Physical objects drawn as flat colored cards in a grid | Photoreal or modelled objects with their real construction, overlapping in depth with one light and contact shadows |
| The category's shared palette (navy + amber sleep app, neon-on-black fitness app) | A color world sourced from the look app or a borrowed reference |
| The same hero visual on welcome, a question and the payoff | One appearance each; the payoff shows the user's answers in a new form |
| A named reference flipped to dark or its effect swapped for a different one | The reference's composition, material and effect, with this product's content |

## Done, per flow

- [ ] `research/screens.md` lists every screen opened: three flows walked to the end, five category leaders, 8+ look-app screens, the borrowed references
- [ ] Every line of `.seenry/look.md` names its source screen; the palette is not the category's shared default
- [ ] `pick.mjs` run on three directions; `check.mjs` was the last call and its score is in the reply
- [ ] Three or more complete flows and 8+ look-app screens studied; ids in `research/`; the pattern adopted for each screen named
- [ ] `.seenry/look.md` exists, its signature components appear in the build carrying this product's content, and the accent and color world are the product's own, not platform defaults
- [ ] Three directions of the signature screen built and picked blind with `pick.mjs`
- [ ] Navigation map written; back verified on every screen; one-way doors cannot be re-entered
- [ ] Onboarding ends on a payoff built from the answers; every permission has a pre-prompt and a soft way out; paywall terms in plain text under the CTA
- [ ] Loading, empty, error, permission-denied and long-content states designed, not defaulted
- [ ] `app_preflight.mjs` passes, or each exception is written in `decisions.md`
- [ ] Light and dark, largest Dynamic Type, safe areas and keyboard verified on screen
- [ ] The flow recording watched twice with no flash, jump or dropped frame
- [ ] When a reference app is named: `research/fidelity.md` measured with `measure_screen.py`, and the final compare against the reference frame shows no `<- off` element
- [ ] `app_preflight.mjs` passes on the native source (no tracked caps, numbering, italic accent, mono texture, cream + terracotta)
- [ ] Screens and recording captured on the iOS Simulator (or emulator), not a desktop browser
- [ ] Every screen holds up beside the best reference screen studied; `check.mjs` run in the requested mode, score and level reported

## Review

Screenshot the flow in order on device or simulator (light and dark, largest text size) and review with `seenry-review` or a fresh agent. The optional [flow gate](scripts/independent_flow_gate.py) sends ordered captures to fresh visual and flow reviewers when Codex CLI is installed. Static captures do not prove gestures, VoiceOver or calculations; exercise those on the device.
