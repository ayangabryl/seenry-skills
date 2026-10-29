# Focus

## The rule

**Keyboard focus is always visible, never shown for a mouse click, and drawn as a ring that follows the control's shape.**

- `:focus-visible` only. A mouse click never leaves a ring on a button; a keyboard user always sees one.
- The ring is at least 2px thick around the whole perimeter, with a 2px offset from the control (or inset 2px on controls flush to a container edge so it is never clipped).
- It contrasts at least 3:1 against the colors around it, in both themes.
- Its corners follow the control: `outline` follows `border-radius` in current browsers; a `box-shadow` ring uses the control's radius plus the offset.
- Nothing covers the focused control: sticky headers, toasts and drawers leave it in view (scroll-margin on focusable targets under a sticky header).
- Inside a composite widget (tabs, segmented control, menu, grid) only the active item is in the tab order and arrow keys move between items (roving tabindex).
- The ring appears without delay; at most it fades in over `--dur-state`. It never animates its position.

## Why

- **WCAG 2.2:** 2.4.7 Focus Visible (AA), 2.4.11 Focus Not Obscured (AA), 2.4.13 Focus Appearance (AAA: at least the area of a 2px perimeter with 3:1 change of contrast). Meeting the AAA appearance rule costs nothing and reads as care.
- **Apple and Material** both draw focus as a ring that follows the control's shape, separate from hover and pressed states, so focus is never confused with selection.
- Showing rings on mouse click is the most common reason teams remove focus styles altogether; `:focus-visible` removes that pressure.

## In CSS

```css
:where(button, a, input, select, textarea, [tabindex]):focus { outline: none; }
:where(button, a, input, select, textarea, [tabindex]):focus-visible {
  outline: var(--focus-width, 2px) solid var(--focus-color);
  outline-offset: var(--focus-offset, 2px);
}
.flush:focus-visible { outline-offset: calc(var(--focus-width) * -1); }
```

`--focus-color` is a token with its own value per theme, chosen to hold 3:1 against both the page and the control.

## Check

`system_check.mjs` presses Tab through the first controls of every page at 1440 in both themes and fails when a focused control shows no outline or ring of at least 2px, when the ring's contrast against the page is under 3:1, or when the ring's corner radius does not match the control's radius plus offset within 2px. It also clicks the first button with the mouse and fails when a ring appears.
