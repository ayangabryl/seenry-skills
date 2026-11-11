# Motion in React Native and Expo

How to build motion in an Expo or React Native app so it holds 60–120fps on a three-year-old Android in a release build. The web rules in `seenry-motion` still apply; this file adds what changes on a phone.

## Contents

- What changes on a phone
- The order of decisions
- The cheapest tool that works
- Properties
- Springs and curves
- Keep it on the UI thread
- Press, not hover
- Haptics
- Reduced motion and text size
- Setup that silently breaks motion
- Recipes
- Never ship
- Report

## What changes on a phone

1. **No hover.** What the web shows on hover lives in press, position, or nowhere.
2. **Two runtimes.** React and app logic run on the React Native runtime; worklets run every frame on the UI runtime (Reanimated 4 with `react-native-worklets`). Motion that touches the RN runtime stutters as soon as the app does anything else.
3. **The finger is on the element.** Interruption and velocity handoff are the baseline, not polish.

## The order of decisions

Answer these in order. The first two can end the task with no code.

| How often a person sees it | Decision |
| --- | --- |
| 100+ times a day: tab switches, keyboard open and close, scrolling, settings toggles | No animation. The platform default or nothing |
| Tens of times a day: press feedback, row selection, list navigation | Barely visible: under 150ms, or nothing |
| Occasionally: sheets, modals, toasts, onboarding steps | A standard animation |
| Rarely or once: success, an empty-state illustration, a celebration | Room for delight |

Tabs are peers, so tab switches never slide: `animation: 'none'`. Then name the purpose in one word (feedback, spatial consistency, state, preventing a jarring change, explanation, or delight in the rare tier). No word, no animation.

## The cheapest tool that works

Stop at the first row that fits.

| Need | Tool |
| --- | --- |
| A state change with no gesture: press, toggle, color | Reanimated CSS transition (`transitionProperty` in the style) |
| A loop, several stages, or play on mount | Reanimated CSS animation (`animationName` keyframes) |
| Mount, unmount, or a list reflowing | Layout animations: `entering`, `exiting`, `itemLayoutAnimation` |
| Anything a finger moves, or anything driven by scroll | `useSharedValue` + `Gesture` + `useAnimatedStyle` |
| Screen to screen | The native stack's options in Expo Router; never rebuilt in JS |
| A bottom sheet that is a screen | `presentation: 'formSheet'` (a real UISheetPresentationController) |
| The tab bar | `NativeTabs` from `expo-router/unstable-native-tabs` |
| Context menu, press-and-hold preview (iOS) | `Link.Menu`, `Link.Preview` |
| A header collapsing into a large title (iOS) | `headerLargeTitleEnabled` on the native stack (`headerLargeTitle` is deprecated) |
| Pull to refresh | `RefreshControl`; hand-built only when it is the product's signature |
| UI that follows the keyboard | `react-native-keyboard-controller` with `KeyboardProvider` at the root |
| Illustration, celebration, empty state | Lottie (`lottie-react-native`), never for UI state |
| A very large scene or free drawing | `@shopify/react-native-skia` |

A shared value is for continuous or interruptible values. A two-state press is a CSS transition. Install every package with `npx expo install <package>` so versions match the SDK.

## Properties

- `transform` and `opacity` are free. `width`, `height`, `margin`, `padding`, `flex`, `top`, `left` and `gap` re-run layout for the node and its siblings every frame.
- Exception: an absolutely positioned element with no children (a tab pill, a progress fill) may animate `width`, which keeps its corner radius where `scaleX` would stretch it.
- Never start at `scale(0)`. Start at 0.9–0.97 with opacity 0.
- `transform` is an array and order matters: `[{ translateY }, { scale }]` moves, then scales. Keep translate first.
- Android shadows are `elevation`, which redraws every frame when animated. Fade a pre-shadowed layer instead.
- Never animate `BlurView` intensity; fade a static `BlurView`.
- `translateY('100%')` moves an element by its own height, whatever its content.

## Springs and curves

A finger was involved: a spring, because a spring keeps its velocity when interrupted. Otherwise a curve. Use the duration and damping-ratio form, not mass and stiffness:

| Interaction | Config |
| --- | --- |
| Settle with no overshoot | `{ duration: 400, dampingRatio: 1 }` |
| Snap back after a drag | `{ duration: 400, dampingRatio: 0.8, velocity }` |
| Sheet, drawer | `{ duration: 300, dampingRatio: 0.8, velocity }` |
| Must not cross an edge | add `overshootClamping: true` |

Overshoot only when the gesture carried momentum: right on a flicked card, wrong on a menu that faded in.

| Situation | Curve |
| --- | --- |
| Entering or leaving | `Easing.bezier(0.23, 1, 0.32, 1)` |
| Moving on screen | `Easing.bezier(0.77, 0, 0.175, 1)` |
| iOS-style sheet | `Easing.bezier(0.32, 0.72, 0, 1)` |
| Constant (progress, marquee) | linear |

Never `Easing.in(...)` on UI. Durations: press 100–150ms, toggle or chip 150–200ms, sheets a spring around 300ms, screen transitions the platform's own (iOS push is 350ms; match the platform for navigation, beat it everywhere else).

## Keep it on the UI thread

- Never `setState` from a gesture or scroll handler. Shared value to `useAnimatedStyle`, and React never renders.
- Never call back to the RN runtime every frame. `scheduleOnRN(fn, ...args)` (it replaces the deprecated `runOnJS`) belongs in `onEnd`, or in a `useAnimatedReaction` that fires once at a threshold, never in `onUpdate`.
- Never read or write a shared value during render. Touch shared values only in worklets, handlers and effects.
- Use `.get()` and `.set()`, not `.value`: the React Compiler can see through them. `sv.set((v) => v + 1)` updates from the current value.
- A function called from a worklet starts with `'worklet'`, or it throws on device while working in the debugger.

## Press, not hover

- Feedback on press-in, commit on press-out.
- `scale: 0.97` over 100–150ms on every pressable, with `Pressable` and a CSS transition. Scale takes the label and icon with it, which reads as physical.
- Touch targets 44×44pt (iOS) or 48dp (Android). Grow the target with `hitSlop`, not the visual.
- `pressRetentionOffset` so a finger drifting a few points does not cancel the press.
- Android ripple only in a Material-styled app; elsewhere the same scale on both platforms.

## Haptics

| Moment | Call |
| --- | --- |
| A value passes a step: picker, slider detent, segmented control | `Haptics.selectionAsync()` |
| Something snaps home, a detent catches, a drag commits | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| A heavy thing lands, a destructive action fires | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Success or failure | `Haptics.notificationAsync(NotificationFeedbackType.Success)` or `.Error` |

Fire it in the same frame as the visual cause. One per action, never on scroll or on an entrance the person did not cause. Never the only feedback: many people turn haptics off and most Android hardware is weak. From a worklet: `scheduleOnRN(Haptics.selectionAsync)`.

## Reduced motion and text size

`useReducedMotion()` from Reanimated, or `reduceMotion: ReduceMotion.System` on each animation. Reduced means fewer and gentler: keep opacity and color changes that explain a state, drop translation, scale, parallax and overshoot; screen transitions become `animation: 'fade'`. Text scales with `allowFontScaling`, so never animate to a measured height; measure with `onLayout` or animate a transform.

## Setup that silently breaks motion

- Versions: `npx expo install react-native-reanimated react-native-worklets`. `babel-preset-expo` adds the worklets Babel plugin; only a bare project adds it by hand.
- `GestureHandlerRootView` must wrap the app, or gestures silently do nothing.
- Reanimated 4 needs the New Architecture.
- Expo Go and debug builds are not performance environments. Judge feel in a release build on the slowest supported phone.
- 120Hz on ProMotion iPhones needs `CADisableMinimumFrameDurationOnPhone: true` in the iOS `infoPlist` (recent SDKs set it; check). The frame budget is then 8ms.

## Recipes

| Recipe | Build |
| --- | --- |
| Press feedback | `Pressable`, scale 0.97, 120ms strong ease-out, back on release |
| Drag-to-dismiss sheet | `Gesture.Pan()` writes translateY 1:1; on end dismiss if distance > 40% of height or velocity > 500pt/s, else spring back with the release velocity; overlay opacity derived from translateY |
| Swipe to delete | `ReanimatedSwipeable`, or a pan with `activeOffsetX` so vertical scroll still wins; commit with Light impact |
| Collapsing header | Native large title first; a scroll-driven `useAnimatedStyle` only for a custom header, interpolated with `Extrapolation.CLAMP` |
| List entrance | Animate the list container once; never `entering` on rows of a virtualized list (FlatList, FlashList) |
| Keyboard-synced footer | `useReanimatedKeyboardAnimation` from keyboard-controller drives translateY |
| Tab indicator | An absolute pill whose translateX and width follow the active tab with a spring |
| Screen transitions | Native stack `animation: 'default'`; `'fade'` under reduced motion; `animationMatchesGesture: true` for back swipes |

## Never ship

| Never | Instead |
| --- | --- |
| `PanResponder` | `Gesture.Pan()` |
| `setState` in a gesture or scroll handler | A shared value and `useAnimatedStyle` |
| `runOnJS` | `scheduleOnRN` |
| `scheduleOnRN` every frame | `onEnd`, or `useAnimatedReaction` at a threshold |
| Core `Animated` for anything a finger touches | Reanimated |
| Animated height, width, margin, flex or top | transform and opacity |
| Animated `BlurView` intensity or `elevation` | Fade a static layer |
| `entering` on virtualized rows | Animate the container, or `itemLayoutAnimation` |
| A screen transition rebuilt in JS | The native stack |
| Sliding tabs | `animation: 'none'` |
| A distance-only dismiss | Distance or velocity |
| A hard stop at an edge | Rubber-band resistance |
| A haptic per frame, or haptics alone | One per commit, with a visual |
| Judging feel in Expo Go or the simulator | A release build on the slowest phone |

## Report

After writing the code, in a few lines: the frequency tier and purpose (and what you rejected), the tool, properties, spring or curve and thread, and what the person must try on a device: flick it, catch it mid-flight, reverse it, run it on the slowest Android.
