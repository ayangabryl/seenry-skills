# Fluid interaction

Interfaces that feel physical respond on the first touch, stay under the finger, carry the finger's speed into the animation and can be grabbed again mid-flight. Use this for anything a person drags, flicks, swipes or presses and holds: sheets, carousels, sliders, cards, reorderable lists, drawers.

Adapted from Emil Kowalski's MIT-licensed `apple-design` skill, which translates Apple's *Designing Fluid Interfaces* (WWDC 2018) to the web; see [licenses](../licenses/NOTICE.md).

## Respond on press, not on release

- Show the pressed state on `pointerdown`. Commit the action on `pointerup`.
- Remove every delay on the input path: debounces, timers, waits for a transition to end, the tap delay (`touch-action: manipulation`).
- During a drag the interface moves with the pointer every frame. Never animate only when the gesture ends.

## Stay under the finger

- `setPointerCapture` on `pointerdown`, so tracking continues outside the element.
- Keep the offset from where it was grabbed. Snapping the element's center to the pointer breaks the illusion at once.
- Keep the last few positions with timestamps; release velocity comes from them, not from the last event alone.
- Wait about 10px of movement before deciding a direction, then track 1:1. Recognize every plausible gesture from the first move and cancel the losers once intent is clear.
- Pay the double-tap delay only where a double tap exists.

## Every motion can be grabbed

- Never lock input during a transition. Grabbing a closing sheet makes it follow the finger, not finish closing first.
- A new animation starts from the value on screen, never from the old target.
- Anything a person can grab runs on a spring. CSS keyframes cannot be reversed smoothly; transitions retarget but drop velocity.
- Animate x and y on separate springs, so a diagonal flick does not desync.

## Hand the velocity to the spring

On release, pass the pointer's velocity as the spring's starting velocity, so there is no seam between dragging and animating. Motion takes px/s directly (`velocity`). APIs that want relative velocity take `velocity / (target − current)`.

| Spring | Bounce | Duration |
| --- | --- | --- |
| Default for interface motion | 0 | 0.3–0.4s |
| After a flick or throw | 0.15–0.2 | 0.4s |
| Sheet or drawer settle | 0.15–0.2 | 0.3–0.5s |

Bounce only when the gesture carried momentum. A menu that fades in never overshoots; a card that was flicked may.

Projection and rubber-banding, with code, are in [recipes](recipes.md): choose the snap point nearest to where the gesture is going, and resist progressively past an edge instead of stopping hard.

## Leave the way you came

- Enter and exit along one path. A panel in from the right leaves to the right.
- Anchor to the source: a menu or popover grows from its trigger (`transform-origin` on the trigger side).
- In-between frames point at the outcome: a module that expands grows toward the finger.

## Materials say what floats

- Floating chrome (toolbars, sheets, a pinned header) can be a translucent layer over the content: a semi-opaque background with `backdrop-filter: blur(20px) saturate(180%)`, and a solid fallback inside `@supports not (backdrop-filter: blur(1px))`.
- Never a light translucent surface on another one: legibility collapses.
- Text over translucency is higher contrast and slightly heavier than on a solid surface. Measure it over the busiest content that can scroll beneath.
- A modal task dims what is behind it; a side panel the person works beside does not.
- Where content meets floating chrome, a short fade mask reads better than a 1px rule, and only where they overlap.

## Sound and haptics fire with the frame

Feedback that combines senses fires on the causal event and on the same frame as the visual change. Use it only for meaningful moments: a commit, a snap into place, success, an error. Used everywhere, people learn to ignore it.

## Reduced motion keeps the feedback

Under `prefers-reduced-motion: reduce`, replace travel, scale and parallax with a short opacity change; keep press states and direct tracking, which are not vestibular. Under `prefers-reduced-transparency: reduce`, use the solid fallback for materials.

## Check it

- Grab every moving thing mid-animation and reverse it. Nothing jumps.
- Flick and drag slowly; both settle where the gesture was going.
- Record at 60fps or use the browser's animation panel at 10% speed. No frame shows the element away from the finger.
