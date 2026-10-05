# Motion implementation decisions

Use before building or refining a transition. Reuse the project's motion tokens and primitives. These recipes are conditional starting points; measured replication and user intent take precedence.

## Decide whether movement earns its time

Name the job: acknowledge input, connect two states, preserve spatial orientation, explain a mechanism, or mark an occasional completion. Frequency changes the budget. Repeated navigation and keyboard workflows need especially short or immediate feedback. A one-time explanation can take longer. Keyboard activation is not itself a ban on motion; it must retain equivalent behavior and never wait for animation to accept input.

## Choose the mechanism

| Change | Starting mechanism | Check |
| --- | --- | --- |
| Hover, press, color | Named CSS transitions | Fine-pointer hover only; touch/focus have their own affordance |
| Programmatic finite transition | Web Animations | Cancel or retarget from current presentation; clean up on unmount |
| Layout identity, presence, gesture | Existing spring/layout runtime | One owner per property; preserve focus and authoritative state |
| Expand readable content | Measured height or grid-track reveal | Text does not stretch; final size matches content |
| Word/value replacement | Bounded outgoing/incoming layers | No stale stack under rapid input; accessible value remains current |

Prefer transform and opacity when they express the change. They are generally cheaper than layout properties, but do not promise GPU acceleration without checking the actual runtime/browser path. Use height when real layout must expand; use blur sparingly on small changing layers and remove it at rest. Avoid `transition: all` and full-screen filters for local feedback.

## Timing starting points

For an unconfigured interface, compare press feedback around 100–160ms, small tooltips/popovers 125–200ms, dropdowns 150–250ms and larger dialog/drawer movement 200–400ms. Distance, frequency, content and the measured reference decide the final value. Reuse existing tokens before adding these.

A responsive entry can start with `cubic-bezier(.23, 1, .32, 1)`; a deliberate drawer can start with `cubic-bezier(.32, .72, 0, 1)`. Ease-in can make direct input feel delayed, so test an immediate ease-out alternative. Springs suit direct manipulation and retargeting; bounce belongs only where the brand and task support it. Do not impose one curve or spring on every component.

Anchor a popover's transform origin to its trigger. A centered dialog can use a centered origin. Small surfaces normally need only a slight scale change, rather than collapsing readable content to zero. A short 30–80ms stagger can show order; long lists need a capped total delay rather than multiplying it indefinitely.

## Interruption and exit

State updates immediately; presentation follows it. A second activation reverses or retargets the current transition rather than queueing another complete performance. Bound outgoing layers, clear timers, invalidate stale async completion and clean up listeners. Do not signal operation success before it occurs.

The exit should preserve the relationship established on entry. It may be faster when the user is dismissing something, but must not teleport to an unrelated edge. Gesture-driven motion should preserve velocity where the runtime supports it. Fixed keyframes are appropriate for a deliberate replay; repeated toggles need current-state continuity.

## Input and reduced motion

Gate decorative hover movement with `(hover: hover) and (pointer: fine)`. Never make information or actions hover-only. Keep the hit target stable while the inner artwork moves. Reduced motion removes nonessential spatial displacement, blur, parallax and decorative loops; use an immediate update or a brief opacity change when helpful. Respond if the preference changes while the page is open.

## Review the transition, not just endpoints

Test rapid reversal, repeated input, exit during entry, resize and long content. Inspect at normal speed for responsiveness and slowed playback for clipping, layer buildup, changing origins and mismatched property timing. Use device testing for gestures where available. Distinguish functional correctness from visual acceptance and state what was not observed.
