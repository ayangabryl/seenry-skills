# Choreography

**Read when:** two or more things move because of the same event (a staggered list, a hero entrance, a view swap inside a container, a panel with content, a row leaving while its siblings close the gap, a multi-step flow).

It decides what moves at all, what leads, what follows, how much they overlap, and what stays still. A single element's curve and duration come from the table in `SKILL.md`; the curves named here (`--ease-out`, `--ease-move`, `--ease-fade`) are defined there.

Good choreography mostly cuts moving parts and runs the rest together. Sequence only when order means something. Done right it reads as one gesture; done wrong it reads as a queue the person waits through.

## Contents

- Rules
- The values
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

## The values

One default per relationship. Use these before tuning anything.

| Relationship | Start of the second | Durations | Example |
| --- | --- | --- | --- |
| Attached (content inside a panel that enters) | 0ms, no animation of its own | The panel's | Menu rows, dialog text, toast label |
| Together (one object, one moment) | 0ms | The same duration and curve | Sheet and its scrim; a row leaving and its siblings closing up |
| Swap in place (old content, new content) | New starts 40ms after old | Old out 80ms, new in 120ms | Icon swap, status label, tab content |
| Newly exposed content (not there before the surface opened) | 60ms after the surface starts | 120ms fade while the surface finishes | Controls revealed by an expanding card |
| Removal | Space starts closing 60ms after the content starts fading | Content out 80ms, collapse 180ms | Deleted row, dismissed banner |
| Stagger, product first-run | 0, 40, 70, 90ms; everything after the fourth at 90ms | 300ms each, 8px rise | Empty state, results page |
| Stagger, marketing hero | 0, 80, 140, 180ms | 600ms each; lead 12px, support 8px, decoration fade only | Headline, sub-line, actions, badge |
| Cause then effect | Second starts when the first is 60% done | Each its own | Box fills, then the check draws |
| Accent on a lead | Starts at 70% of the lead, ends with it | The last 20 to 30% | Sparks landing with a morphing icon |

Budgets: a product UI group is finished within 300ms of the input, a marketing entrance within 1,200ms. A scrim may lead its surface by nothing; it starts with it and runs 160ms. Frequent surfaces (menus, tabs, tables, command menus) get no stagger at all.

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
- Sub-animations of one component share one timing family: a sheet that opens in 280ms and then resizes in 120ms reads as two objects. Inner fades may be a little slower but stay in the same easing family. Set the family once with `MotionConfig` or one custom property.

**Overlap:**
- Product first-run groups: delays 0, 40, 70, 90ms on 300ms entrances. Stagger the first four; the rest arrive with the fourth. Item 20 never waits 20 delays.
- Marketing heroes: delays 0, 80, 140, 180ms on 600ms entrances read as a wave, because the motion is the message and it is seen once.
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

- Duration by distance: a container resizing between views takes `clamp(120ms, Δheight × 0.6ms, 240ms)` (a 100px change takes 120ms, 400px or more takes 240ms), so a tiny change does not crawl through a full transition.
- Bounce by size: small elements need more bounce to feel alive; a large view with the same bounce looks heavy and slow.
- With a few known states, hand-tune each transition rather than a formula you cannot fine-tune.

## 5. Direction and exits

- Forward moves content left (new content enters from the right); back moves it right. Next and Back sliding the same way contradicts the action. Sibling menus enter from the side of the trigger the person came from.
- Exits read state when they start: pass direction through `custom` on both `AnimatePresence` and the child.
- Exits are simultaneous, about 60% of the entrance, and simpler; never stagger things out. An exit matches its entry: what slid in from the right leaves to the right.

## Interruption

- Re-trigger mid-sequence (hover out halfway, Next twice fast, switch menus while one opens): stop running animations before starting new ones; never stack them. In CSS, clear every `animation-delay` on the group when it exits so nothing arrives late into a closing view.
- The latest state wins for tabs, sort order, counters and streamed text. Never play the steps in between.
- An idle loop resumes only after every reset finishes (`await Promise.all(...)`).
- Gate an action on a finished buildup with a `useRef` flag, not state, so phases do not re-render.
- Fast view switching can leave two `AnimatePresence` children mounted; give each a stable, unique `key` and check it.

## Idle invitations

An idle animation that invites a tap waits 2.5s before its first run, repeats every 6s (`repeatDelay: 6`), stops while the person interacts, and resumes only after the interaction's reset finishes. It is the page's one loop.

## Reduced motion

Collapse the choreography, do not just shorten it: no delays, no movement, keep opacity, the group appears together. If the sequence is the explanation, step between its frames.

## Tools

The lightest that expresses the relationships:

- **CSS:** a `--d` delay per item (`:nth-child(2) { --d: 40ms }`, then 70ms, then 90ms for the rest) on a keyframe with `animation-fill-mode: both` so late items do not flash their end state. One-shot entrances; the code is the staggered group in [recipes-state](recipes-state.md#staggered-group).
- **Motion, declarative:** variants with `delayChildren: stagger(0.04, { ease: "easeOut" })` on the parent, so the gaps shrink; `from: "center"` when the cause is in the middle. Groups that enter and exit with state.
- **Motion, imperative (`useAnimate`):** only when several elements coordinate across several events and you must await completion.

## The timeline

Write it before coding, then check it against the budget (product UI groups finish within 300ms; no stagger on frequent surfaces). Its rows go into `MOTION.md` unchanged in meaning: one per moving thing.

| Element | Role | Starts | Duration | Motion | Relationship |
| --- | --- | --- | --- | --- | --- |
| Title | Lead | 0ms | 600ms | fade, 12px rise | n/a |
| Subtitle | Support | 80ms | 600ms | fade, 8px rise | Overlaps title |
| Actions | Support | 140ms | 600ms | fade, 8px rise | Overlaps subtitle |
| Badge | Decoration | 0ms | 600ms | fade | With title |
| Background | Static | n/a | n/a | none | n/a |

Then list two to five things you deliberately kept still, with the reason, and name the frame to scrub on a recording: a wave and a queue feel the same in your head and look different frame by frame. Imagine the fiftieth use of the day; if you would skip it, cut it.
