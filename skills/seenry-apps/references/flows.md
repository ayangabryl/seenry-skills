# Flows: onboarding, permissions, paywall and navigation

A flow is judged by the order of what it asks for and what it gives back, and by what back does at every step. A screenshot shows neither; walk it.

## Onboarding

Every step must earn its place by giving the user something or collecting something the product visibly uses. A step that does neither is cut.

1. **Promise with the product in it.** The first screen shows the product's signature view working (the energy curve, the plan, the streak), not an illustration of it. One line of value, one primary action, sign in as a quiet secondary action.
2. **Questions that change the payoff.** One question per screen, with progress at the top and skip visible. Choices are large full-width rows with a clear selected state; multi-select says so. Prefer a picker or slider with a sensible default to a text field; ask for a name only if the product uses it on a later screen.
3. **Teach while asking.** Between questions, a short screen that explains the model behind the product using the user's answers so far ("7 hours a night against a need of 8h 10m is a growing debt"). These are what make long personalized flows feel short.
4. **Build moment.** A brief, honest progress screen that lists what is being computed from the answers. It earns its seconds only if the next screen is visibly personal.
5. **Payoff built from the answers.** The signature view again, now with the user's numbers, and one sentence of what to do with it. This is the screen the whole flow exists for; give it the most care.
6. **Permissions at the moment they pay off,** each behind a pre-prompt that says what the user gets, with a soft way out ("Not now") that leaves the flow working. Never ask for the system permission cold.
7. **Then the paywall,** if there is one, after the payoff and never before value.

Length follows the studied flows and the product: a personalized product (sleep, fitness, nutrition, learning, finance) earns 8–15 screens when every answer visibly changes the payoff; a tool with nothing to personalize gets 1–3 screens or none.

## Paywall

- What the user gets, shown with the product's own screens or the payoff they just saw, not a feature grid of icons.
- Plans as large rows, the recommended plan preselected, price per period in full, trial terms in plain text directly under the CTA ("7 days free, then $59.99/year. Cancel anytime.").
- One CTA, close or "continue with free" visible from the start, restore purchase and terms links.
- No fake countdowns, fake discounts or hidden prices.

## Navigation grammar

Answer for every screen: what it is, whether the user must be able to come back, and what back (chevron, edge swipe, Android back) does from it. Put the answers in a navigation map in `decisions.md`.

| The screen is | Presentation | SwiftUI | Compose | React Native (Expo Router) | Web prototype |
| --- | --- | --- | --- | --- | --- |
| Deeper in the same task | push | `NavigationStack` push | `navController.navigate` | `router.push` | history entry, slide in from the trailing edge |
| A self-contained task with steps | modal with its own stack, Cancel/Done | `.sheet`/`.fullScreenCover` holding a stack | full-screen dialog destination | `presentation: 'modal'` | full-height layer with its own step state |
| A short interruption (picker, filter) | sheet with detents, drag to dismiss | `.presentationDetents` | `ModalBottomSheet` | `presentation: 'formSheet'` | bottom sheet with a grabber |
| Something past which the old state is gone | replace | reset the path | `popUpTo(inclusive = true)` | `router.replace` | replace state, no history entry |

- **One-way doors leave the stack.** Finished onboarding (skip included), sign-in, a purchase, a completed session: land with a replace, so back can never re-enter the old state.
- **Keep the user's place.** Sign-in demanded by one action completes that action where it was tapped; a paywall opened from a feature dismisses back onto the feature, unlocked.
- **Back is blocked only** while an irreversible request is in flight (with visible progress) and when a modal holds unsaved work (ask first). Anything else that traps back is a defect.
- **Tabs are peers.** No slide between tabs; each keeps its own stack; tapping the active tab returns it to its root.
- In onboarding, back returns to the previous question with the answer kept.

## Motion frequency gate

Decide motion by how often the user meets it:

| Met | Motion |
| --- | --- |
| 100+ times a day (tab switch, scroll, back, keyboard) | the platform's own, nothing added |
| tens of times (press, select a row, toggle) | under 150ms, barely visible: press scale 0.97 on buttons and cards, highlight on rows |
| occasionally (sheet, modal, step change, toast) | standard: 200–300ms strong ease-out, or a spring when a finger drove it |
| rarely (the payoff, a first success) | the one place for a designed moment, still under a second, and skippable |

Name each animation's purpose in one word (feedback, continuity, state change, explanation, delight) or remove it. Numbers the user is reading never move for style; a value that changes animates per digit in the direction of change.
