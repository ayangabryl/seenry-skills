# Interaction craft: the method behind memorable controls

Use this whenever you build an interactive component that is not already in the Seenry kits, or when a component feels flat. The method is portable to any stack: decide what the person is trying to do, give the change a visible cause, keep the interface stable while it happens, and make every input path reach the same result. Complete the component brief (section 4) before writing code, and review the result with the checklist (section 5).

The numbers below are well-tested starting points, not a universal token sheet.

## 1. The method

### 1. Write the job as a verb and choose one signature idea

Describe what a person gains from the control before describing how it looks. Examples of jobs are *confirm deletion*, *choose a range*, *find a result*, or *read a changed value*. Then state one memorable behavior that makes that job easier to perceive. A control with three competing tricks has no clear subject. The strongest components can be summarized in one sentence because every moving part supports the same act.

Ask how often the person will do it. A command opened dozens of times a day needs almost no entrance. A first successful upload can afford a brief finish. A rare, object-like moment can spend longer showing how its mechanism works. Frequency is the first reason to remove motion.

### 2. Name the cause, and use a metaphor only when it explains the change

Write a physical or spatial account of the interaction: a tab indicator reaches toward its destination and draws its tail after it; a tag forms around the words just typed; a notice emerges from the action that produced it. This tells the designer where motion begins, which edge leads, what remains attached, and where it should stop. If a metaphor does not answer those questions, it is decoration and should be dropped.

For an object, specify believable constraints before drawing details: hinge or pivot, material thickness, where light comes from, what is held by the hand, which surface covers another, friction or resistance, and where the shadow falls. For ordinary controls, borrow only the useful part of the metaphor. A button needs a sense of contact, not a simulated machine.

### 3. Draw the state graph before the timeline

List visible and functional states, then name every allowed transition. A typical task might have ready, pressed, working, completed, failed, and reset states. A drag adds armed, dragging, released, and cancelled. Include what happens when the value changes from outside the control, when a second action arrives before the first has finished, and when a pending request resolves after the control has gone away.

Separate durable state from presentation. Selection, deletion, progress, and whether a request succeeded are facts. Scale, blur, and a flying icon are temporary illustrations of those facts. The state should become correct at the appropriate action boundary; decoration must never be the only record of success. This makes interruption and reduced motion possible without changing the meaning.

Decide which phases can reverse or retarget. Hover, selection, resizing, dragging, and a panel opening must respond from their current visible position. A short impact, an ink stroke, or a finite celebration can play once if nothing depends on waiting for it. A discarded card can finish its exit as a separate visual while the next card becomes usable immediately.

### 4. Lock the geometry that the hand and eye depend on

Mark the point that must stay put: the pressed button, a list header, the caret, a selected tab, or the text being edited. Reserve the largest label or message when a swap would otherwise resize the control. Stack alternative labels in the same footprint. Put a popover's origin at its trigger. Let new in-flow content open below the element that caused it. If a card changes height, decide which edge is fixed before animating it.

Make the static endpoints work at phone width before adding transitions. Specify minimum hit areas, clipping, wrapping, and safe margins so shadows, thrown pieces, and tooltips cannot enlarge the page. Text should move with its container or change position without being squashed by the container's scale. If actual content must push its neighbours, animate that one small layout dimension; do not fake it with a transform that overlaps the neighbours.

### 5. Write a motion score with reasons

For each transition, specify its trigger, initial position, destination, property, duration, curve or spring, and the point at which the next event begins. State why that amount of travel needs that amount of time. Good interaction work treats a color change, a panel crossing the screen, a number counting, and a piece of paper falling as different kinds of motion.

Coordinate phases rather than starting everything together. A reveal can open space first, then bring text into focus. A progress ring must visibly finish before a check replaces it. Old words should leave before the incoming words become legible. A drawn line can reach a destination just before that destination lights up. This sequencing makes a group of effects read as one action.

### 6. Choose the motion mechanism from the interruption contract

Use a directly reversible transition for changes that may be triggered again mid-flight. Use a velocity-carrying spring for a dragged, flicked, or repeatedly redirected object. Keep it strongly damped when the destination is an exact value or slot. Use a keyframed run for a loop, a single impact, or a finite gesture that does not need to reverse. A clock or genuine progress fill is linear because equal time should look equal. If an animation owns completion, its clock and the action timer must be the same clock.

Give one system ownership of each animated property. Two systems changing the same transform create a visible fight. A position animation and a decorative shake can live on separate nested layers. Use direct style or drawing updates for continuous input; update application state only when semantic state changes.

### 7. Design pointer, touch, keyboard, and assistive paths together

Specify what a mouse can preview, what a finger can tap or drag, and what happens when there is no hover. Set a small movement threshold so an unsteady click is still a click. During a drag, keep the grabbed offset, use only the initiating pointer, preserve release velocity, and define Escape or cancellation. Allow native scrolling until the person has clearly committed to a gesture. Mouse-only affordances need a visible or keyboard-accessible route to the same action.

Choose the correct semantic control and keyboard model before building visuals: a real input behind code slots, a real slider behind a custom thumb, roving focus for a group, or focus trapping and return for a modal. Make the focus destination explicit when content replaces a button or a row is removed. A shortcut for an occasional action should use the same visible transition as a click; rapid arrow navigation or scrubbing should stay immediate enough to track the keys or hand.

### 8. Specify the reduced-motion version and the static evidence

Remove travel, parallax, blur, repeated movement, and object physics when motion is reduced. Preserve the state change with a short opacity change or an immediate swap. Keep a label, icon, position, shape, or accessible status that communicates the result without animation. For live work, a calmer visible activity cue can remain if freezing it would falsely suggest that work stopped.

### 9. Make the demonstration and verify the middle frames

Give the control believable content and show more than its resting screenshot. Strong demonstrations enact a small human story: approach, act, observe, recover. The preview should use the real state transitions but avoid global side effects. When idle, its timers and frame loops should stop. On a full page, the component should remain useful without that scripted show.

Inspect light and dark themes, a phone around 375px, a narrower 320px case, keyboard and touch behavior, reduced motion, and intermediate frames. Repeat or reverse actions before they settle. Check whether any target, caption, or neighbour shifts; whether content is clipped; whether focus moves sensibly; whether the browser reports errors; and whether the page grows wider. A polished endpoint can conceal an awkward 100ms in the middle.

## 2. Motion and interaction principles

### Timing is proportional to the reason for movement

| Kind of change | Starting values | Why it takes that long |
| --- | --- | --- |
| Press acknowledgement | About 100 to 160ms; ordinary controls often compress to roughly 96% scale, large cards closer to 98% | The hand should get an immediate answer without shifting the target much. A dragged control may use stretch or lift instead of another press scale. |
| Small tooltip or hint | Commonly 125 to 200ms in, 75 to 150ms out | A first deliberate pause earns a hint; closing and moving between neighbouring targets should feel quicker. A fast scan may switch with no entrance. |
| Menu, popover, dialog | Menus around 150 to 200ms in and 100ms out; a small dialog about 200ms in and 150ms out | The surface should be traceable to its trigger or the viewport, then stop occupying attention promptly. |
| In-place shape or layout change | Frequently 250 to 350ms, with little or no bounce | The eye can follow the new bounds while text remains readable. A width that overshoots looks mismeasured. |
| Two-edge indicator | A leading edge can land in 180 to 200ms while its tail catches up around 340 to 360ms | The leading edge confirms the new selection early; the lag supplies the elastic character. Rapid arrow input shortens the move to about 150ms. |
| Data value or chart sweep | Often 300 to 600ms; a gauge uses about 600ms and a one-time sparkline draw about 700ms | The reader needs time to perceive magnitude or a line's shape. The animated number or bar must never pass an untrue value. Direct scrubbing is much faster or immediate. |
| Drag release | Commonly 200 to 500ms, depending on distance and release speed | The object should continue with the hand, then settle in a believable slot. Long travel needs more time than a local toggle. |
| Full-height sheet | One example opens in 500ms and closes in 300ms | It crosses a large part of the frame; closing is a dismissal and should leave faster. |
| Rare payoff or explanation | About 320 to 800ms for a finite sequence; examples include a 450ms send flight, a 500ms bell ring, and an 800ms wrapping sequence | The sequence is the message and does not block the next useful action. The individual beats are usually much shorter than the whole. |
| Press-and-hold decision | A destructive hold fills for 2,000ms and clears in 200ms if released early | Waiting is the commitment mechanism; cancelling should answer immediately. |

There is a useful asymmetry: arrivals explain, exits clear space. An outgoing label often uses 100 to 150ms while its successor takes 150 to 200ms. A good build sometimes delays the new label until its container is wide enough, or keeps the old one readable until the new state has something to show. A delay needs a causal reason; it should not merely make the animation feel elaborate.

### Curves, springs, and keyframes have distinct jobs

- A strong response curve such as `cubic-bezier(0.23, 1, 0.32, 1)` moves quickly at the start and spends the rest of its time settling. It suits a newly revealed surface, a short text entrance, and a press response.
- A symmetric travel curve such as `cubic-bezier(0.77, 0, 0.175, 1)` gives a deliberate passage between two distant positions. It suits a fold or a large spatial morph whose journey matters.
- The drawer curve `cubic-bezier(0.32, 0.72, 0, 1)` starts a large surface promptly and lets it arrive softly. A sheet or an object crossing much of the view needs this different rhythm.
- Linear timing belongs to elapsed time, continuous rotation, constant paper feed, and a hold-to-confirm fill. Easing a timer would make its visual clock disagree with real time. A falling object is one of the few justified uses of acceleration toward the end.
- A spring is valuable when a target can move again before arrival. It can inherit current position and speed, so the second action redirects the first motion. A precise slot or data value calls for critical or near-critical damping. For example, a row returning with stiffness 500 and damping near 45 settles without crossing its slot. Slight underdamping belongs to a rubber band, a tossed card, or another material whose bounce is the point.
- Keyframes work for periodic motion and uncontested finite events: a caret blink, a short impact, an ink stroke, or a celebration. A reversible menu or frequently retargeted highlight should not restart a canned sequence on every input.

### Feedback must explain what happened

The first response should be close to the input, usually at the pressed surface. Completion can then move to the outcome: a transferred file reaches 100% before the check appears, a selected item's identity travels into a field, or a final step fills before a completion view arrives. A control should not become blank between roles. Keep old and new content aligned so the viewer sees one thing changing rather than two unrelated things appearing.

Avoid ambiguous intermediate colors and numbers. Overlaying translucent success and danger hues can create a muddy third color; a wipe or distinct layers keeps the meaning clean. A value display should not bounce beyond the true number, and a filled bar should not trail a real progress event so far that it misreports the work. Status should have a readable word or shape in addition to color or movement.

For a cheap local action, acknowledge the press immediately. For asynchronous work, keep pending, completed, failed, and cancelled claims tied to the actual result. If a newer request supersedes an older one, the old result must not replace the new status. If a notice is about to disappear, pause its deadline while the person is reading or focusing it.

### Smoothness begins with stable geometry

Good components reserve a full label width, a fixed message row, a predictable calendar height, or the slot of a departing card. This prevents the thing a person is using from moving under the pointer. Text that changes during a morph is painted at its final size and revealed only when there is room; it is not stretched to match the container. Adjacent radii are chosen from real padding, so a nested surface looks manufactured rather than approximately rounded.

For continuous gestures, position, clip, opacity, SVG progress, or canvas drawing usually changes without a component rerender on every frame. Read layout when the gesture starts or once per frame at most, then write only the affected visual values. A long-running loop sleeps when settled, paused, hidden, or offscreen. Background time gaps are capped for simulations that would otherwise jump on return. Measurements account for any ancestor scale, and server-rendered coordinates are rounded where floating-point differences could cause hydration mismatch.

Interruption is a design test, not an edge case. Grab an element while it is returning, press the opposite tab while its indicator is moving, or start a new upload while an old completion is fading. The visual starts from its current frame; it does not teleport to a stored endpoint. Any outgoing layer that no longer represents an available action becomes inert at once, even if it is still fading.

### Input and accessibility are part of the same behavior

Fine-pointer hover may preview; touch needs a tap or direct drag. Good implementations use 3 to 6px of movement before treating a press as a drag, then samples roughly the final 80 to 100ms of motion to decide whether release was a flick. Card throws use thresholds around 400 to 500px/s, but the correct number depends on object size and travel. A grabbed handle keeps its exact offset from the finger; only the first active pointer controls it. Overscroll or overdrag offers limited resistance and stays within the page.

Keyboard models are explicit. Arrow keys move through a radio group, tabs, chart, or collection; Home and End go to bounds where appropriate; Space or Enter picks up, commits, or activates; Escape cancels or closes. Focus moves with a remounted item and returns to the opener after a dialog closes. A disabled-looking bound can remain focusable when dropping focus would strand a keyboard user. A visible focus ring must survive clipping and transforms. Live regions announce meaningful phase changes rather than every frame, digit, or automatic slide.

## 3. Pattern catalogue

These are reusable mechanisms, not a list of components to copy.

| Pattern | What makes it feel right | What breaks it |
| --- | --- | --- |
| Press, hold, and commit | The fill tracks the required hold exactly; release drains quickly; completion has a distinct, brief landing. | A partial hold still firing, or a slow cancellation that feels unresponsive. |
| Role morph in one place | The same target keeps its footprint while its icon, label, and color take on the next role in a clear order. | Replacing the button with a new one that shifts under the cursor or drops focus. |
| Surface unfolding from its source | A card, popover, or field visibly opens from the edge or point that summoned it; new text waits for room. | A surface appearing at an unrelated location, or text squeezed during the reshape. |
| Leading edge and following edge | A line or capsule reaches the new selection promptly, then gathers its trailing edge. Reversal bends the current shape. | Two edges restarting together after every quick selection. |
| Shared traveling bubble | One tooltip, selection ring, or highlight moves between related targets; the first reveal may wait, a scan does not. | Multiple bubbles blinking separately or a pointer highlight that lags behind the hand. |
| Digit wheel by place value | Only changed positions turn, direction agrees with the change, and columns keep stable widths. | The whole number sliding as one string, or 9 to 10 making the units spin backward through unrelated digits. |
| Stagger and settle | A short offset makes a group read as one wave, often in reading or spatial order; already-present items do not replay. | A long list making the last item wait, or every update retriggering the entrance. |
| Drag, resistance, and return | The object stays under the grabbed point, gives less near a limit, and carries the latest hand velocity into its landing. | A jump at drag start, unlimited page overflow, or a spring that restarts from rest on release. |
| Throw with independent exit | The discarded item follows the release direction while the next useful item is ready immediately. | Blocking new input until the thrown copy has finished moving. |
| Progress as a clock | The visible edge and the actual deadline or operation share timing; pause, resume, and completion stay synchronized. | Decorative progress that reaches the end before the work, or a timer that expires while being read. |
| Physical object with constrained parts | Pivot, cover, thickness, material, lighting, and contact all agree; small asymmetries suggest use without making the object sloppy. | Clip-art shading, impossible layering, or a bounce unrelated to the material. |
| Drawn ink or trace | A single route is revealed in stroke order, with pauses at turns and appropriate material texture; it plays at a meaningful moment. | Arrowheads appearing early, a stroke redrawing on every hover, or perfect mechanical repetition. |
| Letter or token continuity | Characters that persist keep identity and move to their next place; removed content departs sooner than new content settles. | Crossfading two whole words when the interesting change is which parts survived. |
| Quiet ambient presence | Motion is slow, irregular, and stoppable; an idle or offscreen instance consumes no frame loop. | A rhythmic decoration that demands attention or runs forever in every card. |

## 4. A component brief to complete before building

Give the following filled brief to an AI in any stack. Require it to answer every field before implementation. The brief is a design contract, not a library prescription.

1. **Job and setting:** Who uses this, what action or information matters, and how often will it occur? What must be understandable at rest?
2. **One idea:** In one sentence, what visible mechanism explains the change? Name the origin, moving part, destination, and, if relevant, the physical material or constraint.
3. **State graph:** List each durable state and every transition, including cancel, failure, reset, rapid repeat, externally changed values, and removal while work is pending. State exactly when the real action commits.
4. **Geometry:** Give full-size dimensions, minimum hit area, fixed anchor, reserved label or content space, maximum growth, phone layout, and viewport-edge behavior. Name the text that must never be scaled or clipped.
5. **Motion score:** For each transition give property, distance, duration, curve or spring, entry and exit order, and a sentence explaining the timing. Identify what is linear, what may bounce, and what must never overshoot.
6. **Interruption rule:** Say which motions retarget from the current frame with velocity, which finite motions can play once, and what a second input does while each is running. State when leaving controls stop accepting input.
7. **Input contract:** Define mouse, touch, pen, keyboard, and assistive activation. Include drag threshold, pointer ownership, cancellation, focus placement and return, and what happens without hover.
8. **Accessible result:** Give role, name, state, instructions, focus ring, non-motion cues, and what a live region should announce. Avoid announcing continuously changing decoration.
9. **Reduced motion:** Describe the same state changes with movement, blur, parallax, and loops removed. Say what static cue remains.
10. **Runtime budget:** Say what updates per frame, how it avoids layout or application rerenders during continuous input, when loops sleep, and how timers, observers, and requests are cleaned up. Specify a stable first render if time, randomness, locale, or geometry is involved.
11. **Demo and checks:** Supply real sample content, a short path through every meaningful state, and checks for a phone, both themes, rapid repeats, mid-animation reversal, keyboard, touch, reduced motion, focus, and page overflow.
12. **Must not happen:** List the two or three failures that would make this particular component feel wrong, such as a moving target, a false value, a stranded focus, or a delayed next action.

### Eight filled briefs

**1. Hold to remove a saved draft.** Job: prevent an accidental destructive action used rarely. Idea: a narrow band advances from the pressed edge while the action label stays fixed. States: ready, holding, cancelled, removed, ready again; the draft is removed only when a continuous 2,000ms hold finishes. Geometry: at least a 44px hit height and room for the longer confirmation label, with the button's starting edge fixed. Motion: the band is linear while held, retreats in 200ms on release, and a restrained 250 to 320ms finish follows commitment because the result deserves one beat. Input: pointer hold or Space/Enter hold; leaving or cancelling before completion aborts. Reduced motion: keep the hold requirement and show a textual countdown without a traveling fill. Access: a real button with a completion announcement. Runtime and demo: stop the hold timer on release or removal, and demonstrate a cancelled attempt before a completed one. Must not happen: a short click deleting, or a label swap moving the button.

**2. Switch a reporting period.** Job: choose day, week, or month many times during analysis. Idea: one selected capsule reaches toward the new period and then pulls its tail in. States: three selections, with every new selection immediately superseding an unfinished move. Geometry: equal or measured option slots in a fixed row; labels remain crisp. Motion: the near edge lands in about 180ms, the far edge by about 350ms; a run of arrow keys uses about 150ms so navigation keeps up. Input: click or tap a choice; Left/Right and Home/End navigate the group. Reduced motion: the capsule changes position at once with a short color change. Access: one roving keyboard stop and a spoken selected state. Runtime and demo: measure the row on layout change, move the indicator without rerendering each frame, and show both quick clicks and arrow navigation. Must not happen: a momentary highlight on the wrong period or two conflicting current states.

**3. Adjust a bounded budget.** Job: choose an amount accurately, including on a phone. Idea: the thumb stays attached to the finger while the filled rail follows the amount. States: resting, dragging, released at a value, and blocked at either bound. Geometry: a 44px or larger touch lane around the small visible thumb; endpoints and current amount have stable places. Motion: dragging is direct, a track click glides around 200ms, and a keyboard step can use a short, strongly damped glide. The number never overshoots a value that was not chosen. Input: pointer capture after a 3 to 4px threshold, one pointer at a time, arrow keys plus larger steps with modifiers. Reduced motion: direct value changes. Access: a real slider or equivalent spoken range and value. Runtime and demo: keep gesture updates out of the main view render, and test a grab during a click glide plus both bounds on a phone. Must not happen: a finger grab snapping the thumb to its center, or a bounce showing an unchosen amount.

**4. Change one word in a headline.** Job: show a rare shift in an editorial message without making the sentence hard to read. Idea: letters shared by the old and new word keep their identity and move to their new places; only truly new letters arrive. States: resting word, changing word, interrupted change, and paused. Geometry: reserve room for the widest phrase so surrounding copy stays aligned; keep all glyphs at their final font size. Motion: surviving letters glide for about 440ms because they may cross most of the word; departing letters clear in about 200ms and arrivals take roughly 320ms with a short left-to-right offset. Input: a visible Next button works by tap, click, and keyboard; an automatic mode pauses on focus. Reduced motion: swap complete words with a brief opacity change. Access: expose the sentence once, without announcing every letter. Runtime and demo: measure only when the word changes, and show a rapid second choice during the first move. Must not happen: duplicate readable words or a heading that repeatedly changes width.

**5. Reorder a task list.** Job: move one task without losing track of its place. Idea: the grabbed row rises slightly while its neighbours make a clean slot for it. States: resting, held, moved, dropped, cancelled. Geometry: a dedicated handle with a comfortable target, fixed row height, and a list width that cannot expand during overdrag. Motion: a roughly 2% lift in about 250ms; neighbours move to new slots in about 300ms without bounce; the held row follows directly and settles using its release speed. Input: drag from the handle, or Space to pick up, arrows/Home/End to move, Space to drop, Escape to restore. Reduced motion: direct row movement and a strong held-state cue. Access: focus remains on the same task after reorder. Runtime and demo: update drag position directly, and show a pointer reorder, a keyboard reorder, and a cancelled move. Must not happen: a row briefly crossing the wrong slot, or the next drag waiting for the last row to settle.

**6. Offer undo after removing an item.** Job: let someone correct a deletion without hiding the consequence. Idea: the row closes its gap while a single nearby notice counts down the available recovery time. States: visible item, removed and undoable, restored, final removal. Motion: the row exits around 150ms while survivors close space over about 250ms; restoration begins after a roughly 50ms opening beat. A 4 to 6 second timer moves linearly and pauses during hover, focus, or a hidden tab. Input: button and the platform undo shortcut take the same path, except when a text field owns that shortcut. Reduced motion: row changes are immediate; the deadline remains visible as text. Access: focus goes to a surviving neighbour on removal and to the restored item when appropriate. Runtime and demo: use one pausable deadline for both notice and timer display, and show two quick removals followed by Undo. Must not happen: a second deletion silently expiring the first, or a notice fading to empty text.

**7. Show capacity used.** Job: let a reader compare current usage with a limit. Idea: an arc and its number advance together across marked intervals. States: loading or unknown, known value, updated value, and warning threshold. Geometry: tabular digits and an instrument of fixed size prevent readout shifts. Motion: one damped value change takes about 600ms so magnitude is readable, but it clamps to the actual value and never bounces past it. Threshold marks illuminate as the arc reaches them. Input: if the marks are inspectable, keyboard focus and touch expose the same details as hover. Reduced motion: jump to the new value with a brief opacity cue. Access: the numeric amount and warning word are readable without color. Runtime and demo: let one value drive the arc, number, and threshold marks, and show an update that crosses the warning boundary. Must not happen: a transient false value or a warning communicated only by hue.

**8. Print a pickup ticket.** Job: make a single completed transaction feel tangible, used only after a real submission. Idea: paper advances out of a narrow slot one line at a time, with the machine covering every line until it has passed the print head. States: ready, printing, printed, torn, and reprint. Geometry: reserve the paper's rise above the machine, show thickness and a believable cutter, and keep the action below stationary. Motion: feed runs at a constant physical-looking rate, around 360px per second; lines appear in a sequence that keeps a typical ticket under two seconds. A torn copy can finish leaving while Reprint is already available. Input: a real print/reprint button and an optional drag or tap to tear; keyboard activation uses the same sequence. Reduced motion: the ticket appears fully printed with a simple status change. Access: ticket contents are ordinary readable text. Runtime and demo: run the feed only while printing, and demonstrate print, tear, and immediate reprint. Must not happen: words showing through unprinted paper, or a lingering exit blocking a new ticket.

## 5. Quality review checklist

### Meaning and state

- [ ] One sentence explains the job and the visual idea; every animated part supports it.
- [ ] All states, cancellation paths, failures, rapid repeats, and external updates have defined outcomes.
- [ ] Status and completion are truthful; animated values stay within their old and new bounds, and progress follows the real operation.
- [ ] A second action redirects or replaces the first according to the state graph, with no stale async result taking over.
- [ ] A finite flourish never delays the next useful action unless waiting is the task itself.

### Motion and geometry

- [ ] The pressed target and active caret stay where the user expects while content changes.
- [ ] Entry has an identifiable origin; exit takes less attention and usually less time.
- [ ] Every duration and curve has a stated reason tied to distance, frequency, or material.
- [ ] Exact values and slots do not overshoot. Elasticity appears only where the metaphor earns it.
- [ ] Continuous input follows the hand; release uses recent velocity; grabbing mid-animation starts from the visible frame.
- [ ] Text never stretches or becomes readable through a clipped, half-sized surface.
- [ ] Alternating labels, errors, and overlays have reserved room; no sibling jumps unexpectedly.
- [ ] The component and its focus ring fit at 320 to 430px without horizontal page overflow.
- [ ] Color changes remain clear in both themes, including their intermediate frames.

### Input and accessibility

- [ ] Mouse, touch, keyboard, and assistive activation reach the same meaningful state.
- [ ] Touch has an independent path for every hover-only affordance and preserves normal page scrolling when appropriate.
- [ ] Hit areas are comfortable, often at least 40 to 44px, without making visible artwork oversized.
- [ ] Focus is visible, follows a replaced or moved item, and returns from a dialog to the right trigger.
- [ ] Roles, names, selected or pressed states, and live announcements describe facts rather than decorative frames.
- [ ] Reduced motion removes spatial travel and loops while retaining a clear static result.

### Runtime and verification

- [ ] A continuous gesture does not force an application rerender every frame; layout reads and writes are bounded.
- [ ] Timers, observers, pointers, animation frames, and pending requests are cancelled or made stale on exit.
- [ ] Ambient loops sleep at rest, offscreen, and in hidden tabs; resuming does not jump after a long gap.
- [ ] Initial rendering is stable across server and client when time, locale, randomness, or trigonometry is involved.
- [ ] Normal speed and intermediate frames have been viewed in both themes, on a phone, with rapid reversal, keyboard, touch, and reduced motion.
- [ ] The demo tells a believable short story and an idle preview consumes no unnecessary work.

## 6. What to leave out of a restrained product

A playground may celebrate a mechanism. A serious product earns trust through predictable placement, accurate state, and quick recovery. Keep the craft; spend less attention on the performance.

| Trait to use sparingly | Why it can read as a gimmick in routine work | More restrained treatment |
| --- | --- | --- |
| Full-screen confetti, shockwaves, vibration, or long recoil after a common click | The decoration competes with the task and repeats on every use. | A small local confirmation, used only for a genuinely rare milestone. |
| Magnetic cursor pull, strong card tilt, or a trailing lens around ordinary controls | The target appears evasive or the content becomes harder to read. | A stable target with a fast hover or press cue. |
| Typewriter text, scrambling, per-letter flips, and animated handwriting in working UI | They delay reading, obscure searchability, and make repeated updates tiring. | Reveal finished text immediately; use typography and a short opacity change if orientation needs help. |
| Simulated material physics for routine forms and navigation | The metaphor adds a second task, watching the object, to the first task, using the form. | Borrow one causal detail, such as a hinge origin or a small settle, and stop there. |
| Strong bounce on layout, selection, charts, or numbers | A temporary wrong position or value makes the interface look uncertain. | Damped motion that reaches the exact destination once. |
| Long multi-stage sequences for frequently used actions | Repetition turns delight into latency. | Keep the first response immediate and the total transition under roughly 300ms. |
| Ambient loops in every visible tile | Motion becomes visual noise and consumes resources without carrying new information. | Run only a meaningful live indicator, slow it down, and stop it when offscreen. |
| Fake progress or arbitrary waiting to make a demo feel alive | A person may infer that real work is happening or that the reported percentage is measured. | Use real operation state; for indeterminate work, say it is working without inventing a fraction. |
| Elaborate object textures or many accent colors in standard UI | The object can overpower the information hierarchy and look inconsistent beside real content. | Keep a coherent token palette; reserve raw material color for genuine content or a deliberate object. |

The criterion is whether movement makes the action easier to understand at the frequency it will actually be used. The quality that transfers is the discipline underneath the playful surface: one clear cause, honest state, stable geometry, and a quick path back to control.
