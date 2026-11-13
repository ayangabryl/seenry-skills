# Motion vocabulary

Turns a loose description ("the bouncy thing when a popover opens") into the exact term, so the person can ask for it and you build the right thing. Answer with the term first, then one or two close alternates and how they differ:

```
**Origin-aware animation**: the element grows out of the control that opened it, not from its own center.
Close: **Scale in** if it grows from its center; **Shared element transition** if the control itself travels and becomes the panel.
```

Read for the sensation, not keywords. If nothing fits exactly, give the nearest term and say it is an approximation, or describe the effect with these words ("a stagger of scale-in entrances"). Do not invent terms.

## Entrances and exits

| Term | Means |
| --- | --- |
| Fade in / out | Opacity alone, nothing moves |
| Slide in | Enters by translating from an edge or a short distance |
| Scale in | Grows from slightly smaller (0.9–0.97) to full size with a fade |
| Pop in | A scale in that overshoots a little and settles |
| Reveal | Uncovered by a mask or `clip-path` rather than moved |
| Enter / exit | The animations that run as an element mounts and unmounts |

## Sequencing and timing

| Term | Means |
| --- | --- |
| Keyframes | Fixed waypoints an animation passes through |
| Interpolation, tween | The values computed between two states |
| Stagger | Several items start one after another with a small delay |
| Orchestration | Deciding order, overlap and stillness across moving parts |
| Delay | Time before an animation starts |
| Duration | How long it runs |
| Fill mode | Whether the start or end state holds outside the run (`forwards`, `both`) |
| Stepped animation | Jumps between frames with no in-between (`steps()`) |

## Movement and transforms

| Term | Means |
| --- | --- |
| Translate | Moves an element without affecting layout |
| Scale | Resizes it, children included |
| Rotate | Turns it around its origin |
| Skew | Slants it along an axis |
| 3D tilt, flip | Rotation in X or Y with perspective, like a card turning |
| Perspective | The depth that makes 3D rotation look 3D |
| Transform origin | The point a scale or rotation happens around |
| Origin-aware animation | Grows from the trigger that opened it, not its own center |

## Between states

| Term | Means |
| --- | --- |
| Crossfade | Old and new fade over each other in the same place |
| Continuity transition | Keeps something visible across a change so the eye can follow |
| Morph | One shape becomes another (a button into a panel) |
| Shared element transition | An element travels from its old place and becomes part of the new view |
| Layout animation | Elements glide to new positions when the layout changes (FLIP) |
| Accordion, collapse | A section opens and closes by animating height |
| Direction-aware transition | Content moves according to forward or back |

## Scroll

| Term | Means |
| --- | --- |
| Scroll reveal | Elements animate in as they enter the viewport |
| Scroll-driven animation | Progress tied directly to scroll position |
| Parallax | Layers move at different speeds while scrolling |
| Page transition | Animation between routes |
| View transition | The browser's View Transitions API snapshotting old and new states |

## Feedback and interaction

| Term | Means |
| --- | --- |
| Hover effect | A change while a fine pointer is over an element |
| Press, tap feedback | A small scale or tint the instant it is pressed |
| Hold to confirm | A fill that completes only if the press is held |
| Drag | The element follows the pointer 1:1 |
| Drag to reorder | Items move apart as a dragged item passes |
| Swipe to dismiss | A flick or long drag sends it away |
| Rubber-banding | Increasing resistance past an edge, then a spring back |
| Shake, wiggle | A short side-to-side motion signaling an error or invitation |
| Ripple | A circle spreading from the touch point (Material) |

## Easing

| Term | Means |
| --- | --- |
| Easing | How speed changes over the run |
| Ease-out | Fast start, gentle stop: entrances and responses |
| Ease-in | Slow start, fast end: rarely right in UI |
| Ease-in-out | Slow at both ends: movement across the screen |
| Linear | Constant speed: progress, marquees, time passing |
| Cubic-bezier | A custom curve from four numbers |
| Asymmetric easing | Different timing for the way in and the way out |

## Springs

| Term | Means |
| --- | --- |
| Spring | Motion from physics rather than a fixed duration |
| Stiffness, tension | How strongly it pulls toward the target |
| Damping | How quickly the oscillation dies out |
| Mass | How heavy it feels |
| Bounce | Overshoot past the target before settling |
| Perceptual duration | How long a spring feels, used instead of physics values |
| Momentum | Continuing in the direction of a flick after release |
| Velocity | Speed at release, handed to the spring |
| Interruptible animation | Can be caught and redirected mid-flight without a jump |

## Looping and ambient

| Term | Means |
| --- | --- |
| Marquee | Content scrolling continuously across |
| Loop | Repeats indefinitely |
| Alternate, yoyo | Plays forward then backward |
| Orbit | Moves around a center |
| Pulse | Gently grows and shrinks or fades in a rhythm |
| Float | Slow up-and-down drift |
| Idle animation | Plays after inactivity to invite interaction |

## Polish and effects

| Term | Means |
| --- | --- |
| Blur | Softens during a change to hide imperfect frames |
| Clip-path | Shows part of an element through a geometric shape |
| Mask | Shows part of an element through an image or gradient |
| Before/after slider | A divider dragged across two overlapping images |
| Line drawing | An SVG stroke drawing itself |
| Text morph | Text changing letter by letter into new text |
| Skeleton, shimmer | A placeholder shape, with a moving sheen, while content loads |
| Number ticker | Digits rolling to a new value |
| Tabular numbers | Equal-width digits so changing numbers do not jitter |
| Typewriter | Text appearing one character at a time |

## Performance

| Term | Means |
| --- | --- |
| Frame rate (FPS) | Frames drawn per second; 60 or 120 is smooth |
| Jank | Visible stutter from missed frames |
| Dropped frame | A frame not finished in its budget |
| Compositing | Combining layers on the GPU, the cheap step |
| will-change | A hint to promote an element to its own layer |
| Layout thrashing | Reading and writing layout repeatedly in one frame |

## Principles

| Term | Means |
| --- | --- |
| Purposeful animation | Every animation has a reason: feedback, orientation, state, continuity |
| Anticipation | A small move before the main one that signals it |
| Follow-through | Parts that keep moving briefly after the main motion stops |
| Squash and stretch | Deformation that conveys weight and elasticity |
| Perceived performance | Feeling fast through responsiveness, not raw speed |
| Frequency of use | The more often seen, the less it should animate |
| Spatial consistency | Things leave the way they came and keep their place in space |
| Hardware acceleration | Animation handled on the GPU, off the main thread |
| Reduced motion | The OS setting asking for less movement; keep fades, drop travel |

Close pairs to tell apart: clip-path or mask (shape or image); pop in or bounce (overshoot on entry, or any overshoot); shared element transition or layout animation (one element becomes part of a new view, or many elements reflow in place); crossfade or morph (two things overlap, or one shape becomes another).
