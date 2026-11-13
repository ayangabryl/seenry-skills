# Audit categories

What to look for in each category and the exact values to cite in findings and plans. Never approximate a value that appears here or in the files it links; copy it.

## Contents

1. Motion purpose and frequency
2. Easing and duration
3. Origin and physics
4. Interruption
5. Performance
6. Accessibility
7. Visual craft
8. Consistency and tokens
9. Generated-looking design
10. Missed opportunities

## 1. Motion purpose and frequency

Every animation answers "why does this move?": feedback, orientation, state, continuity, explanation, or delight in a rare moment.

| Frequency | Decision |
| --- | --- |
| 100+ a day: shortcuts, command menu toggle | No animation, ever |
| Tens a day: hover, list navigation | Remove or reduce hard |
| Occasional: dialogs, drawers, toasts | Standard animation |
| Rare: onboarding, success, celebration | May delight |

Look for motion on keyboard-triggered actions, command menus with open and close transitions, and decoration on rows and hovers hit constantly. The strongest fix is often to delete it. Full tree: [gate](../../seenry-motion/references/gate.md).

## 2. Easing and duration

Entering or leaving: ease-out. Moving on screen: ease-in-out. Hover and color: `ease`. Constant motion: linear. Default: ease-out. `ease-in` on UI is always a finding. Built-in curves are too weak for deliberate motion; plans add strong tokens that follow the repo's conventions:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

| Element | Duration |
| --- | --- |
| Press feedback | 100–160ms |
| Tooltip, small popover | 125–200ms |
| Dropdown, select | 150–250ms |
| Dialog, drawer | 200–500ms |
| Marketing, explanation | May be longer |

UI stays under 300ms. Look for `ease-in`, bare `ease` or `linear` on entrances, UI over 300ms, and a delay plus animation on every tooltip in a toolbar (after the first, they open instantly).

## 3. Origin and physics

- Never `scale(0)`; start at `scale(0.9–0.97)` with `opacity: 0`.
- Popovers, dropdowns and tooltips scale from their trigger (`transform-origin: var(--transform-origin)` in Base UI). Dialogs are exempt: `transform-origin: center` is correct there; never report it.
- Press feedback: `:active { scale: 0.97 }` with `transition: scale 160ms var(--ease-out)`, subtle (0.95–0.98).

Look for `scale(0)`, pure fades where the element should come from somewhere, center origins on anchored elements, and pressables with no press state.

## 4. Interruption

CSS transitions retarget from the current value; keyframes restart from zero. Anything triggered rapidly or reversible (toasts stacking, toggles, drags, expand and collapse) uses transitions or springs.

- Entry without JS: `@starting-style` (older fallback: a `data-mounted` attribute set after mount).
- Gestures use springs, which carry velocity: `{ type: "spring", duration: 0.5, bounce: 0.2 }`, bounce 0.1–0.3, visible bounce only after a drag or in playful moments.
- Deliberate phases (press, hold, destructive confirm) are slow; the response snaps. Symmetric timing there is a finding.

Look for keyframes on toasts and toggles, fixed-duration tweens on gestures, drags dismissing on distance only (dismiss when `Math.abs(distance) / elapsedMs > ~0.11` as well), and hard stops instead of rising resistance.

## 5. Performance

- Animate `transform` and `opacity` only; `width`, `height`, `margin`, `padding`, `top`, `left` lay out every frame.
- `transition: all` is always a finding.
- Motion's `x`, `y`, `scale` shorthands are accelerated only from `motion` 14.2; earlier, the full transform string. `layout` and `layoutId` stay on the main thread in every version.
- A custom property on a parent driving child transforms recalculates every child; set `transform` on the element.
- CSS and WAAPI survive a busy page better than `requestAnimationFrame`.
- Animated `filter: blur()` under 20px.

Look for the above, plus `setProperty('--x', …)` in drag handlers and rAF loops doing what CSS could. Full diagnosis: [performance](../../seenry-motion/references/performance.md).

## 6. Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .el { transition: opacity 0.2s ease; } /* keep opacity, drop movement */
}
@media (hover: hover) and (pointer: fine) {
  .el:hover { scale: 1.02; } /* touch fires false hovers */
}
```

Reduced motion is fewer and gentler, not zero. In React, `useReducedMotion()`. Beyond motion: names on every control, visible focus, keyboard paths, contrast measured on the rendered surface, targets at least 24px (44px on touch), content reachable at 320px and 200% zoom. Checklist: [accessibility](../../seenry-craft/references/accessibility.md).

## 7. Visual craft

Against [seenry-craft](../../seenry-craft/SKILL.md): few type sizes and weights, spacing on the scale, grouping by space before lines, concentric radii (outer = inner + padding), shadows for elevation and borders for structure, color as roles, icons matching their text, every state designed, numbers in `tabular-nums`. Look for off-scale values, near-duplicate sizes and colors, non-concentric corners, missing states.

## 8. Consistency and tokens

- Curves, durations, colors and spacing live as shared tokens. Five near-identical hand-typed values are a consolidation finding.
- Motion and decoration match the product's personality; one bouncy component in a crisp app is a finding.
- A group that enters all at once where a 30–80ms stagger belongs (on an occasional surface only; staggers never block interaction).
- A crossfade that double-exposes can be masked with `filter: blur(2px)` during the change.
- The same component drawn differently across screens (`canvas.mjs verify` reports drift).

## 9. Generated-looking design

Against the default named in [seenry](../../seenry/SKILL.md): the same composition in three or more consecutive sections, a clever one-line title on every section, labels in a side column, cards around everything, lettered lists where order means nothing, one accent on warm off-white with a serif over Inter, type-only sections where real material belongs, stock photos standing in for the product's own work, invented proof (testimonials, logos, statistics). Each is a finding only where it is the whole screen's pattern, not where one instance is the right answer.

## 10. Missed opportunities

Additive, reported separately and only from seams you actually saw:

- State changes that teleport where a short transition prevents a jarring jump.
- Panels that appear with no tie to their trigger.
- Rare, high-emotion moments rendered flat.
- Tools for these: `translateY(100%)` (the element's own height) and `clip-path: inset()` reveals, never hard-coded pixel offsets.
