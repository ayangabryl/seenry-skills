# Seat capacity control — first complete design

## Interaction contract

| Decision | Choice |
| --- | --- |
| Trigger and state | Native range input accepts pointer drag, touch and keyboard input, with integer capacity from 16 to 28. Its value owns all derived presentation. The reset button sets it to 16. |
| Anchor and change | The card, labels and confirmed row stay fixed. The range thumb and fill move across the track. The large count, open seat count, waitlist estimate and additional seat marks change at each input value. |
| Immediate feedback | Every input event renders the authoritative value without an animation delay. One mark represents one additional seat. The first eight additional marks show seats that could fit waitlisted people; the final four show capacity beyond the current waitlist. |
| Interruption | Each event renders from the latest range value. Reversals replace the previous preview immediately, without queued animations or stale layers. |
| Lifecycle | Static page initialization creates the marks and binds input/change/reset handlers once. The native input owns dragging and keyboard behavior. |
| Reduced motion | The same immediate state update and visible information apply; no decorative displacement is required. |

## Content and visual choices

- Confirmed guests: 16. Waitlist: 8. Open seats are capacity minus 16; waitlisted people who could fit are the lesser of open seats and 8.
- The preview states that changing capacity does not admit anyone. "Could fit" is a hypothetical count.
- A compact settings card keeps the control in the first phone view. Native range semantics provide touch and keyboard operation; the stable numbers use tabular numerals.
- The component uses local HTML, CSS and JavaScript only. No external assets or libraries are needed.

## Files read

- `brief.md`
- `/private/tmp/seenry-example-composition-repair/skills/seenry-motion/SKILL.md`
- `/private/tmp/seenry-example-composition-repair/skills/seenry-motion/references/motion-contract.md`
- `/private/tmp/seenry-example-composition-repair/skills/seenry-motion/references/implementation-decisions.md`
- `/private/tmp/seenry-example-composition-repair/skills/seenry-motion/references/number-transitions.md`
- `/private/tmp/seenry-example-composition-repair/skills/seenry-motion/references/adapters.md`

## Source files

- `index.html`
- `styles.css`
- `script.js`
