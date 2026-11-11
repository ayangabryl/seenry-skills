# Choreography

What to decide when two or more things move because of the same event: what moves at all, in what order, how much they overlap, and what stays still. A single element's curve and duration belong to the build sequence in `SKILL.md`.

Good choreography mostly cuts moving parts and runs the rest together. Sequence only when order means something. Done right it reads as one gesture; done wrong it reads as a queue the person waits through.

## Contents

- Rules
- 1. Cast the elements
- 2. Relate each pair
- 3. Sync to the moment that matters
- 4. Scale timing to the change
- 5. Direction and exits
- Interruption
- Idle invitations
- Reduced motion
- Tools
- The timeline

## Rules

1. **One entrance per container.** If the panel slides in, its content is already there. Never animate a parent's entrance and stagger its children.
2. **No stagger on frequent or keyboard-opened UI**: menu items, dropdown rows, command menus, tab content.
3. **No uniform stagger.** Equal delay, distance and duration for every item moves like a metronome. Vary by importance.
4. **Never block interaction.** Everything visible is clickable; a late item never holds back a button the person is reaching for.
5. **Survive interruption.** A sequence triggered mid-flight never replays out of order.

## 1. Cast the elements

List everything that moves on the event and give each a role before writing any timing.

| Role | What it is | Treatment |
| --- | --- | --- |
| Lead | The one thing to notice: the title, the new view, the item acted on | Moves first, travels furthest |
| Support | Follows the lead: subtitle, actions, the rest of a list | Shorter, smaller motion |
| Decoration | Badges, accents, dividers | Fades in place, or nothing |
| Static | Everything else, including containers whose content animates | Does not move |

Two elements that both want to lead are a hierarchy problem motion cannot fix; say so. Most groups shrink here: a side panel with eight items becomes one move.

## 2. Relate each pair

```
Same object or same moment?
├── Yes → TOGETHER: same start, same timing family.
└── No → Does the order mean something (reading order, cause and effect, one arriving before another)?
         ├── No → TOGETHER. Order without meaning is delay.
         └── Yes → Would both at once look broken (overlap, passing through, two dense views fighting)?
                   ├── Yes → SEQUENCE: the second starts as the first ends, or just before.
                   └── No → OVERLAP: a stagger.
```

**Carry:** when you cannot control a child's motion (shared layout, `layoutId`), move the parent and let the children ride along.

**Together:**
- An element that leaves stops taking space at once, so its siblings close the gap while it fades. Motion: `AnimatePresence mode="popLayout"`. Without a library: set the leaving element to `position: absolute` at its current place before animating it out.
- Swapping views in one container is a crossfade, `popLayout` again, not the default mode that plays them one after another.
- Sub-animations of one component share one timing family: a drawer that opens in 500ms and resizes in 200ms reads as two objects. Inner fades may be a little slower but stay in the same easing family. Set the family once with `MotionConfig` or one custom property.

**Overlap:**
- Product UI: 30–80ms between items, under about 300ms in total. Stagger the first handful of a long list; the rest arrive with the last. Item 20 never waits 20 delays.
- Marketing and first-run: 100–150ms steps on 0.5–0.6s entrances can read as a wave, because the motion is the message and it is seen once.
- Order follows importance, not DOM order. A title and its first line may share one beat.
- Vary treatment as well as delay: the lead travels most, support less, decoration only fades. Shrinking gaps, or an eased stagger, read as organic; equal gaps read mechanical.
- Direction follows reading or cause: top to bottom for content, outward from the point of interaction for what the person triggered.

**Sequence, only when overlap looks wrong:**
- Two dense states in a container that changes width and height: the old leaves before the new arrives (`mode="wait"`), or crossfade with a duplicate view.
- One element would visibly pass through another: show the front face only as the items land, timed with a delay.
- Drawing with cause and effect: the checkbox square draws, then the check. The second delay equals the first duration; both hold their end with `forwards` or `both`.

Overlap the handoff slightly; that turns a queue into one gesture.

## 3. Sync to the moment that matters

Each secondary motion hooks onto the lead's start, impact or settle, not onto a delay that looks about right.

- Sync to the cause: in hover-then-click, the background pulses with the click, not the hover.
- Accents land with the lead: lines or sparks finish as the main shape arrives, a short burst in the last ~20% (`times: [0.7, 0.9]`), the main line first and the rest ~40ms behind.
- A repeat skips the buildup: once hover is in place, a click plays at once, with the same internal proportions moved earlier.

## 4. Scale timing to the change

- Duration by distance: a container resizing between views takes `clamp(0.15s, Δheight / 500, 0.27s)`, so a tiny change does not flicker through a full fade.
- Bounce by size: small elements need more bounce to feel alive; a large view with the same bounce looks heavy and slow.
- With a few known states, hand-tune each transition rather than a formula you cannot fine-tune.

## 5. Direction and exits

- Forward moves content left (new content enters from the right); back moves it right. Next and Back sliding the same way contradicts the action. Sibling menus enter from the side of the trigger the person came from.
- Exits read state when they start: pass direction through `custom` on both `AnimatePresence` and the child.
- Exits are simultaneous, shorter and simpler; never stagger things out. An exit matches its entry: what slid in from the right leaves to the right.

## Interruption

- Re-trigger mid-sequence (hover out halfway, Next twice fast, switch menus while one opens): stop running animations before starting new ones; never stack them.
- An idle loop resumes only after every reset finishes (`await Promise.all(...)`).
- Gate an action on a finished buildup with a `useRef` flag, not state, so phases do not re-render.
- Fast view switching can leave two `AnimatePresence` children mounted; give each a stable, unique `key` and check it.

## Idle invitations

An idle animation that invites a tap waits about 2.5s before its first run, repeats rarely (`repeatDelay` about 6s), stops while the person interacts, and resumes only after the interaction's reset finishes.

## Reduced motion

Collapse the choreography, do not just shorten it: no delays, no movement, keep opacity, the group appears together. If the sequence is the explanation, step between its frames.

## Tools

The lightest that expresses the relationships:

- **CSS:** a `--index` custom property per item times a delay variable, on a keyframe with `animation-fill-mode: both` so late items do not flash their end state. One-shot entrances.
- **Motion, declarative:** variants with `delayChildren: stagger(0.05, { from: "center" })` on the parent; `stagger` takes `from` and `ease` for uneven delays. Groups that enter and exit with state.
- **Motion, imperative (`useAnimate`):** only when several elements coordinate across several events and you must await completion.

## The timeline

Write it before coding, then check it against the budget (product UI groups finish in about 300ms; no stagger on frequent surfaces).

| Element | Role | Starts | Duration | Motion | Relationship |
| --- | --- | --- | --- | --- | --- |
| Title | Lead | 0ms | 600ms | fade, 12px rise | — |
| Subtitle | Support | 80ms | 500ms | fade, 8px rise | Overlaps title |
| Actions | Support | 140ms | 500ms | fade, 6px rise | Overlaps subtitle |
| Badge | Decoration | 0ms | 400ms | fade | With title |
| Background | Static | — | — | — | — |

Then list two to five things you deliberately kept still, with the reason, and name the frame to scrub on a recording: a wave and a queue feel the same in your head and look different frame by frame. Imagine the fiftieth use of the day; if you would skip it, cut it.
