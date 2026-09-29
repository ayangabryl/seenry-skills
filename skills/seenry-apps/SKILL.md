---
name: seenry-apps
description: "Design and build native-feeling mobile app screens and flows (SwiftUI, UIKit, React Native, Expo, Flutter) that match top App Store apps. Use for onboarding, tab and stack navigation, lists, forms, settings, paywalls, players, sheets and empty or error states. Uses a strict platform grid, per-component type limits and research from real app screens via Seenry MCP."
license: MIT
metadata:
  author: Seenry
  version: "3.0.0"
---

# Seenry Apps

Mobile quality is mostly platform fidelity plus the same discipline as the web system: a strict grid, components built in layers, few type sizes, one accent, and every state designed. Work in the project's existing stack and components.

## Workflow

1. **Map the flow**: entry → decision → action → result → recovery. Mark where back, cancel, undo and retry exist, and which screens are pushed, presented as sheets, or replace the stack (onboarding and auth end with a replace; there is no back into them).
2. **Study real apps.** With Seenry MCP: `search_app_screens` `{q: "paywall" | "settings" | "onboarding" | "now playing" | "checkout" | "empty state"}` for patterns across apps, `get_app_flow` for an ordered journey, `search_designs` `{family: "apps", q: "<app name>"}` for a named app. Inspect 3–5 screens; write down measured relationships (spacing, type sizes, control placement), not looks. App screens carry a small watermark; ignore it.
3. **Spec each component** with the [four-layer construction](../seenry/references/components.md): grid → safe space → structure → type and states.
4. **Build the connected states** with real data: loading, empty, error, permission denied, offline, success, and the keyboard-open layout.
5. **Deliver the Seenry sheet** at the end, as in `seenry` ([the sheet](../seenry/references/sheet.md)): simulator screenshots per state, the apps studied and discovered, decisions, anatomy of the signature screen and guidelines. Use `sheet.py`; capture anatomy from simulator screenshots annotated by hand in the spec when `anatomy.mjs` (web only) does not apply.
6. **Verify on a simulator or device**: screenshot every state, exercise gestures, back and swipe-to-dismiss, Dynamic Type at the largest accessibility size, dark mode and VoiceOver/TalkBack labels.

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

Use Dynamic Type text styles (iOS) and `sp` with font scale (Android) instead of fixed sizes. Use system semantic colors (`label`, `secondaryLabel`, `systemBackground`, `secondarySystemGroupedBackground`) or the project's tokens mapped to them, so dark mode and increased contrast work.

## Screen rules

- **One primary action per screen**, placed where the thumb is: a bottom-pinned full-width button above the home indicator, or the trailing nav bar item for "Save/Done".
- **Per component: ≤3 text styles.** A player card uses Headline, Subhead and Caption; nothing else.
- **Concentric corners** on nested shapes (`inner = outer − inset`), and continuous corner curves (`.continuous` / squircle) on iOS.
- **Content first.** Lists, media and records get the screen; summaries and headers stay compact. Large titles collapse on scroll.
- **Native controls** before custom: pickers, toggles, segmented controls, menus, share sheets, date pickers. A custom control must match their feedback (haptics, press states) and accessibility.
- **Safe areas and keyboard.** Nothing under the notch, Dynamic Island, home indicator or keyboard. Primary buttons ride above the keyboard.
- **Onboarding**: 3 screens maximum before value, each with one idea, skip always visible, permissions asked in context when needed rather than up front.
- **Paywall**: show what the product does (real screens or features), the plan choice with the recommended plan preselected, the price per period with trial terms in plain text directly under the CTA, restore purchase and terms links.
- **Settings**: grouped inset lists, sections of 2–6 rows, icon tiles 28–29 with radius 6–7 in one style, values trailing in secondaryLabel, destructive actions last and separate.
- **Empty and error states** inside the region, with one action that resolves them.

## Alignment

The same keyline, ink-level and optical rules apply natively ([alignment](../seenry/references/alignment.md), [optical](../seenry/references/optical.md)): align SF Symbols by their glyph (use `.imageScale` and baseline alignment with text, `alignmentGuide` for cap-height alignment), use `firstTextBaseline` alignment for icon + label rows, and check play/chevron glyph centering in circular buttons at 3x screenshots.

## Motion

Navigation motion comes from the platform (push, sheet, zoom). Custom motion: springs (`response 0.35–0.5, dampingFraction 0.8–0.9`), interruptible, 150–300ms feel, with haptic feedback on commit (selection, success, warning). Respect Reduce Motion. For web-based apps, use `seenry-motion`.

## Anti-slop for apps

| Tell | Fix |
| --- | --- |
| Web-style centered hero screens inside an app | Content-first native layout |
| Custom tab bar with glows, gradients or floating blobs | System tab bar or a quiet custom one with native metrics |
| Every row in its own colored gradient card | Grouped inset list |
| 12px body text, fixed font sizes | Dynamic Type styles, 17pt body |
| Paywall hiding price or trial terms | Price per period and terms under the CTA |
| Purple gradient onboarding with stock 3D illustrations | Show the product doing its job |
| Buttons 36pt tall at the screen bottom edge | 50pt, inset 16, above the home indicator |

## Review

Screenshot the flow in order on device or simulator (light and dark, largest text size) and review with `seenry-review` or a fresh agent. The optional [flow gate](scripts/independent_flow_gate.py) sends ordered captures to fresh visual and flow reviewers when Codex CLI is installed. Static captures do not prove gestures, VoiceOver or calculations; exercise those on the device.
