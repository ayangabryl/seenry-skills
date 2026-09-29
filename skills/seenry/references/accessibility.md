# Accessibility

Build it in; do not audit it in afterward. These are the checks that fail most often in generated UI.

## Structure and names

- One `h1` per page; headings in order; landmarks: `header`, `nav`, `main`, `footer`.
- Native elements first: `button` for actions, `a href` for navigation, `input` with `label for`, `dialog` for modals, `details/summary` for simple disclosure.
- Every icon-only control has an accessible name. Decorative icons get `aria-hidden="true"`.
- Images have `alt` that says what matters in context; decorative images `alt=""`.
- Form errors are linked with `aria-describedby`; invalid fields have `aria-invalid="true"`.

## Keyboard

- Everything reachable and operable with Tab, Shift+Tab, Enter, Space, Escape and arrows where the pattern expects them (menus, tabs, radios, listboxes).
- Visible `:focus-visible` on every control, not obscured by sticky headers (`scroll-padding-top` = header height).
- Dialogs trap focus, restore it to the trigger on close and close on Escape.
- Skip link to `main` on content-heavy pages.

## Color and contrast

- Text 4.5:1 (3:1 for 24px+ or 19px bold). Non-text UI (borders of inputs, focus rings, icons that convey meaning) 3:1.
- Never convey state by color alone: add an icon, text, or weight.
- Check both themes.

## Size, zoom, spacing

- Targets 24×24 minimum, 44×44 on touch.
- Works at 200% zoom and at 320px width without horizontal scrolling (except tables and code, which scroll inside their own container).
- Survives increased text spacing (line height 1.5, letter spacing 0.12em, word spacing 0.16em) without clipping.
- Phone inputs are 16px to avoid auto-zoom.

## Motion and media

- `prefers-reduced-motion`: remove movement and parallax, keep opacity fades.
- No autoplaying video with sound; provide pause for anything moving longer than 5 seconds.
- Live updates (toasts, async results) announced through an `aria-live="polite"` region.

## Consistency (WCAG 2.2)

- Help, contact and search are in the same place on every page.
- Do not ask users to re-enter information they already provided in the same flow.
- Authentication does not require solving a puzzle or transcribing a code without allowing paste or a password manager.
