# Focus and keyboard continuity

Use when custom focus looks layered, is hard to find, or disappears after an interaction. This original recipe can be used offline. It is a starting treatment for light surfaces, not a conformance certificate or a universal brand token.

## One indicator, immediate and stable

```css
.control:focus-visible {
  outline: 2px solid var(--focus, #465368);
  outline-offset: 2px;
}
.field:focus {
  border-color: transparent;
  outline: 2px solid var(--focus, #465368);
  outline-offset: 0;
  box-shadow: none;
}
@media (forced-colors: active) {
  .control:focus-visible, .field:focus {
    outline: 2px solid Highlight;
    outline-offset: 2px;
    box-shadow: none;
  }
}
```

Scope these classes to controls whose existing styles you have inspected. Remove competing author focus rules when integrating the recipe. Keep a real label and caret in text fields. An input may show focus after a mouse click because the browser expects typing. That is correct. Buttons generally need the stronger indicator during keyboard interaction, not after every pointer press. Retain a native fallback if the selector is unsupported.

The ring must be visible against its actual surroundings, including selected, error and dark surfaces. An error also needs an associated message and `aria-invalid`; it should not add another glow. Do not transition the focus outline or make a small opacity change the only keyboard cue. In a menu, show a distinct focused item, separate from its selected checkmark.

## Preserve ownership

Enter or Space opens a menu and moves focus to a usable item. Escape closes it and returns focus to the owning trigger. Return focus before making a region inert or hiding it. Keep the input focused after a validation error; successful input can remain ready for the next entry. A disappearing control needs a purposeful destination, not `blur()` or focus on the page body.

## Exercise

For a control inside a disclosure, compare the ring's painted extent with every clipping ancestor. A popup also needs unobstructed hit targets after it opens. Sample `elementFromPoint` inside each option before using an automation click, which may otherwise scroll a hidden container and conceal the defect. Allow measured clipping during collapse; do not leave the open state clipped.

Tab and Shift+Tab through every control. Enter, Space and Escape must retain visible focus. Inspect input focus before and after errors, open-menu focus, forced colors and narrow clipping. Compare element rectangles before and after focus. Verify no layout movement and no clipped ring. Test live reduced motion separately; focus remains immediate in both modes.

Standards: [WCAG Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) is AA; [Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) is AAA and adds area and same-pixel contrast requirements. A 2px perimeter and 3:1 change contrast are a useful stronger target, not an automatic result of using this CSS. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible) explains browser heuristics; [APG](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) explains menu-button keyboard behavior.
