# Running order — first implementation

## Brief lock

- Audience: a small event producer arranging a three-part public talk.
- Object and decision: reorder three fixed agenda items, then read the resulting start times.
- Supplied facts: event starts 18:00; Doors and welcome is 10 minutes, Field notes is 25 minutes, Audience questions is 15 minutes. The complete programme ends 18:50 in any order.
- Local fiction: this is a sample draft in one browser tab. There is no save, server, collaboration, speaker assignment, or venue claim.
- Action outcomes: pointer/touch drag and keyboard arrows change order; times derive from that order; reset restores the supplied order; a visible message confirms each committed move.
- Existing brand: none. The component uses a quiet paper-and-ink production-desk treatment. Avoid the source reference's palette, content, imagery, and card grid.

## Interaction contract

| Part | Decision |
| --- | --- |
| Trigger/state owner | Pointer or touch drag on a grip, or arrow/Home/End keys on a focused grip. One `order` array is the committed state. |
| Anchor/change | The schedule frame stays put. The held row follows the pointer; a marked slot tracks the prospective insertion position; surrounding rows translate to make room. |
| Immediate feedback | The lifted row, slot, and prospective time labels update during drag. A committed move updates order and times in the same event and displays a local confirmation. |
| Interruption | Reversing drag retargets the slot. Pointer cancellation, window blur, Escape, or resize restores the original order. A later keyboard move reads the latest committed state. |
| Lifecycle | Pointer listeners attach only for the active gesture and are removed on completion/cancellation. No perpetual animation or remote request. |
| Reduced motion | Same drag target and order logic; incidental transitions and release animation are removed. |

## Reference evidence

Seenry motion reference `f97afc7b44ced5530ba27d573fc7318f` (Design Spells, “Cards have inertia when dragging them around in Bento”) was inspected as a 12.637-second clip. Captured frames near 0.5, 2.5, 5.5, 8.5, and 11.5 seconds show a card lifted over a vacant area, a pale vacant slot, neighboring tiles in new positions, and the dragged tile returning to the grid. A middle frame shows slight angle and shadow on a lifted small tile; another shows a wide tile held across other slots. The sampled frames do not establish exact physics, input accessibility, cancellation, or touch behavior. This trial proposes those behaviors for an agenda list and does not recreate the source layout.

## Files read

- `brief.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry-motion/SKILL.md`
- `/Users/ayangabryl/.codex/skills/seenry/SKILL.md`
- `/Users/ayangabryl/.codex/skills/seenry-motion/references/motion-contract.md`
- `/Users/ayangabryl/.codex/skills/seenry-motion/references/implementation-decisions.md`
- `/Users/ayangabryl/.codex/skills/seenry/references/interaction-components.md`
- `/Users/ayangabryl/.codex/skills/seenry/references/component-design.md`
- `/Users/ayangabryl/.codex/skills/seenry-motion/references/research-route.md`

## Visual structure

The schedule is one bounded work surface with a stable left time column, a strong title column, fixed durations, and a grip column. Thin rules and the vertical time rail make sequence legible without mimicking cards. Wide and phone layouts keep the same reading order. The preview assumes a standalone component at up to 920 px wide.
