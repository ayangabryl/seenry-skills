---
name: seenry-apps
description: "Designs and builds native-feeling mobile app screens and flows (SwiftUI, UIKit, React Native, Expo, Flutter, mobile web prototypes) that hold up next to top App Store apps. Studies whole journeys in real apps with Seenry MCP, designs the flow on the Seenry canvas for the person to approve, then builds it with correct navigation, motion on the UI thread and a pre-flight check. Use for onboarding, tab and stack navigation, lists, forms, settings, paywalls, players, sheets, empty and error states, and for motion, gestures or Swift code in a mobile app."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.2.0"
---

# Seenry Apps

This skill designs a mobile flow from real apps, gets it approved on the canvas, and builds it so it feels native on a real phone.

## Operating posture

You are a senior mobile designer who also ships the code. Platform fidelity first, then one idea carried into the ordinary parts of the app. The person's named app, brand and content outrank every default here. Build the scope that was asked ("a welcome screen" is one screen, "the onboarding" is the flow) to the highest standard.

## Words this skill uses

| Word | Means |
| --- | --- |
| flow | Screens in the order a person meets them, with what back does from each |
| based-on app | The app whose flow you follow |
| look app | The app whose look you take; may be the same app |
| signature screen | The screen the flow exists for, usually the payoff or the welcome |
| one-way door | A step back must not re-enter: finished onboarding, sign-in, purchase |

The canvas words (canvas, screen, section, option, round) mean what `seenry-canvas` defines.

## Hard rules

1. **Real journeys, not single screens.** Walk at least three flows to their last screen, open five category leaders and eight or more screens of the look app before designing. Write every screen opened, with its id, in `research/screens.md`.
2. **Copy structure, never words.** A named app's screen fixes composition, ground, effect, type class and element count; your copy, objects and photos are your own.
3. **Every flow goes on the canvas first.** Each screen as a `.phone.html` frame, linked; the signature screen in three options; build only what the person approved.
4. **Platform before custom.** Native navigation, sheets, tab bars, menus and controls first; a custom control matches their feedback and accessibility.
5. **Motion off the main thread.** Gate it by how often it is seen; springs for anything a finger moves; never `setState` per frame.
6. **Checked on a phone.** Simulator or device screenshots and a recording, never a desktop browser at 390px.

## Workflow

```
- [ ] 1. Name the jobs
- [ ] 2. Study real apps
- [ ] 3. Write the spec and the look
- [ ] 4. Map the flow and its doors
- [ ] 5. Design on the canvas
- [ ] 6. Build every state
- [ ] 7. Pre-flight, walk, record
- [ ] 8. Compare with the approved screens
```

### 1. Name the jobs

Write `research/brief.md`: the based-on app (the flow), the look app (the look), and the job of the signature screen. "Based on X, designed like Y" means X gives the flow and Y the look. A named app with "like", "similar to" or "replicate" means replicate; "inspired by" or "borrow from" means take the principles. See [research](references/research.md).

**Done when** the brief names the flow source, the look source and the mode.

### 2. Study real apps

With Seenry MCP: `search_app_flows {q}` and `get_app_flow`, paged to the end; `search_reference_assets {family: "apps"}` for category leaders; one `borrow_references` pass. Stop when new screens stop changing the spec.

**Done when** `research/screens.md` lists three complete flows, five leaders, eight look-app screens and the borrowed references.

### 3. Write the spec and the look

`research/flows.md` (per step: what it asks, gives, how it is presented), `.seenry/look.md` (palette, type, numerals, signature components, each with its source screen), `research/decisions.md`. One color world, one type voice. In replicate mode, measure the reference with `scripts/measure_screen.py` into `research/fidelity.md`. The full rules, including inspired mode, objects and missing material, are in [look](references/look.md).

**Done when** every line of `look.md` names its source and the palette is not the category's shared default.

### 4. Map the flow and its doors

With [flows](references/flows.md): each screen as push, modal, sheet or replace; what back does; the one-way doors. Onboarding asks one thing per screen and ends on a payoff built from the answers, before any permission or paywall.

**Done when** the navigation map is written and every one-way door is marked.

### 5. Design on the canvas

Follow `seenry-canvas`: every screen as a `.phone.html` frame in flow order with real copy and links; the signature screen in a `.options` section in three directions; the look app's screens in `refs/`. Open the canvas and run `wait`.

**Done when** the person has picked and their comments are applied, or, with nobody present, you recorded your pick.

### 6. Build every state

Build in the project's stack with the [platform](references/platform.md) metrics and rules. Components in four layers ([components](../seenry-craft/references/components.md)). States: loading, empty, error, permission denied, offline, success, keyboard open, largest text. Motion with [Expo motion](references/expo-motion.md) for React Native, SwiftUI springs for iOS; Swift code by [modern Swift](references/swift.md).

**Done when** every approved screen and state exists in the app.

### 7. Pre-flight, walk, record

```sh
node scripts/app_preflight.mjs <source>
```

Fix every failed count, or write the exception in `decisions.md`. Then run the flow on the iOS Simulator or an Android emulator: every step, every back path, back after each one-way door, sheets dragged and cancelled, keyboard both ways. Record it and watch it twice, at speed and frame by frame.

**Done when** pre-flight passes and the recording shows no flash, jump or dropped frame.

### 8. Compare with the approved screens

Put each built screen beside its approved frame and the best reference screen studied. Any screen that reads worse goes back once.

**Done when** every screen is compared and the report says what could not be verified.

## When the person says

| They say | You do |
| --- | --- |
| "An onboarding like Headspace" | Replicate mode, steps 1 to 8 |
| "Inspired by Corner" | Inspired mode: principles in `research/core.md`, your own material |
| "Just the welcome screen" | One screen, its states and motion, steps 2 to 8 at that scope |
| "Animate this sheet" | [Expo motion](references/expo-motion.md) or SwiftUI springs, gated by frequency |
| "Fix this Swift" | [Modern Swift](references/swift.md) |
| "Does it match?" | Step 8 |

## Tone

Plain and short. Name the apps and screen ids you studied, what you took from each, and what a device must still confirm.

## Files

| Need | Read |
| --- | --- |
| Research recipes and the Seenry tools for apps | [research](references/research.md) |
| Taste, the idea, replicate and inspired modes, objects, material | [look](references/look.md) |
| Native metrics, screen rules, native transitions, app tells, the done list | [platform](references/platform.md) |
| Onboarding, paywall, navigation grammar, the motion frequency gate | [flows](references/flows.md) |
| React Native and Expo motion, haptics, gestures | [Expo motion](references/expo-motion.md) |
| Swift 6 code | [modern Swift](references/swift.md) |
| Measuring a reference frame against a build | `scripts/measure_screen.py` |
| Counting app tells in source | `scripts/app_preflight.mjs` |
