# Platform, screens and motion

Native metrics, screen rules, alignment, the native transitions by situation, and the tells that make an app look generated.

## Contents

- Platform system
- Screen rules
- Alignment
- Motion
- Anti-slop for apps
- Done, per flow

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
- **Onboarding**: one idea per screen with visible progress and skip, the product's signature view in the first screen, choices as large rows, and permissions behind a pre-prompt at the moment they pay off. Length follows the studied flows: a personalized product earns 8–15 screens when every answer visibly changes the payoff; a tool with nothing to personalize gets 1–3. End on a payoff built from the answers before any paywall ([flows](flows.md)).
- **Paywall**: show what the product does (real screens or features), the plan choice with the recommended plan preselected, the price per period with trial terms in plain text directly under the CTA, restore purchase and terms links.
- **Settings**: grouped inset lists, sections of 2–6 rows, icon tiles 28–29 with radius 6–7 in one style, values trailing in secondaryLabel, destructive actions last and separate.
- **Empty and error states** inside the region, with one action that resolves them.

## Alignment

The same keyline, ink-level and optical rules apply natively ([alignment](../../seenry-craft/references/alignment.md), [optical](../../seenry-craft/references/optical.md)): align SF Symbols by their glyph (use `.imageScale` and baseline alignment with text, `alignmentGuide` for cap-height alignment), use `firstTextBaseline` alignment for icon + label rows, and check play/chevron glyph centering in circular buttons at 3x screenshots.

## Motion

Gate every animation by how often it is met ([flows](flows.md#motion-frequency-gate)): the platform's own for tabs, scroll, back and keyboard; under 150ms for presses; designed moments only where they are rare, like the onboarding payoff. Navigation motion comes from the platform (push, sheet, zoom). Custom motion: springs (`response 0.35–0.5, dampingFraction 0.8–0.9`), interruptible, 150–300ms feel, with haptic feedback on commit (selection, success, warning). Respect Reduce Motion. For web-based apps, use `seenry-motion` and the Seenry Transitions kit.

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
- [ ] Three or more complete flows and 8+ look-app screens studied; ids in `research/`; the pattern adopted for each screen named
- [ ] `.seenry/look.md` exists, its signature components appear in the build carrying this product's content, and the accent and color world are the product's own, not platform defaults
- [ ] Every screen of the flow on the canvas, three directions of the signature screen, and the person's pick and comments applied
- [ ] Navigation map written; back verified on every screen; one-way doors cannot be re-entered
- [ ] Onboarding ends on a payoff built from the answers; every permission has a pre-prompt and a soft way out; paywall terms in plain text under the CTA
- [ ] Loading, empty, error, permission-denied and long-content states designed, not defaulted
- [ ] `app_preflight.mjs` passes, or each exception is written in `decisions.md`
- [ ] Light and dark, largest Dynamic Type, safe areas and keyboard verified on screen
- [ ] The flow recording watched twice with no flash, jump or dropped frame
- [ ] When a reference app is named: `research/fidelity.md` measured with `measure_screen.py`, and the final compare against the reference frame shows no `<- off` element
- [ ] `app_preflight.mjs` passes on the native source (no tracked caps, numbering, italic accent, mono texture, cream + terracotta)
- [ ] Screens and recording captured on the iOS Simulator (or emulator), not a desktop browser
- [ ] Every built screen compared with its approved frame and the best reference screen studied

## Review

Screenshot the flow in order on device or simulator (light and dark, largest text size) and review with `seenry-review` or a fresh agent. The optional [flow gate](../scripts/independent_flow_gate.py) sends ordered captures to fresh visual and flow reviewers when Codex CLI is installed. Static captures do not prove gestures, VoiceOver or calculations; exercise those on the device.
