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

## Composed fields: focus belongs to the perceived control

Inspect the final cascade, including global `input:focus-visible` rules, after composing an icon, input and actions. A rule that works for a standalone input can produce a second rounded box inside a search surface. Style the perceived text field once. Keep an independent clear/close button outside that field, or give it its own visible keyboard indicator; highlighting the whole group must not hide which action is focused.

For a search dialog, a useful structure is a label wrapping the decorative search icon and input, with a sibling close button. Give that label the field surface and immediate focus boundary. The input remains transparent and inherits the typography. Suppress its outline only inside this component, after the replacement is in place:

```css
.search-field { display: flex; align-items: center; gap: .75rem;
  border-radius: .75rem; background: var(--field-surface, #f5f5f5); }
.search-field:focus-within { outline: 2px solid var(--focus, #777);
  outline-offset: 0; }
.search-field input { border: 0; background: transparent; }
.search-field input:focus-visible { outline: none; box-shadow: none; }
.search-close:focus-visible { outline: 2px solid var(--focus, #777);
  outline-offset: 2px; }
@media (forced-colors: active) {
  .search-field:focus-within, .search-close:focus-visible {
    outline-color: Highlight;
  }
}
```

An integrated dialog search can instead emphasize a reserved bottom border when focused, avoiding a field-shaped box inside an already contained dialog. Keep the border width present but transparent at rest so focus causes no movement; provide a system outline in forced colors. A bottom edge can satisfy visible focus at AA when clearly perceivable and contrasted, but does not automatically satisfy AAA focus-area requirements.

The exact radius, color and width are starting values. Check contrast on the actual surface. If a wrapper contains other focusable actions, target its input state with `:has(input:focus)` where supported and retain a visible fallback, rather than showing the same group highlight for every child. Do not solve a heavy focus treatment by removing keyboard focus or by making it almost invisible.

[Runnable compound-field study](../assets/craft/focus.html) compares a search dialog field with a standalone labeled field and a separate clear action. Verify pointer focus, dialog autofocus, Tab to clear/close, Shift+Tab back, Escape and focus restoration. Inspect at a narrow width and with existing global focus rules applied. This is a cascade and ownership check, not a ban on native outlines or rounded inputs.

## Preserve ownership

Enter or Space opens a menu and moves focus to a usable item. Escape closes it and returns focus to the owning trigger. Return focus before making a region inert or hiding it. Keep the input focused after a validation error; successful input can remain ready for the next entry. A disappearing control needs a purposeful destination, not `blur()` or focus on the page body.

## Exercise

For a control inside a disclosure, compare the ring's painted extent with every clipping ancestor. A popup also needs unobstructed hit targets after it opens. Sample `elementFromPoint` inside each option before using an automation click, which may otherwise scroll a hidden container and conceal the defect. Allow measured clipping during collapse; do not leave the open state clipped.

Tab and Shift+Tab through every control. Enter, Space and Escape must retain visible focus. Inspect input focus before and after errors, open-menu focus, forced colors and narrow clipping. Compare element rectangles before and after focus. Verify no layout movement and no clipped ring. Test live reduced motion separately; focus remains immediate in both modes.

Standards: [WCAG Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) is AA; [Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) is AAA and adds area and same-pixel contrast requirements. A 2px perimeter and 3:1 change contrast are a useful stronger target, not an automatic result of using this CSS. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible) explains browser heuristics; [APG](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) explains menu-button keyboard behavior.
