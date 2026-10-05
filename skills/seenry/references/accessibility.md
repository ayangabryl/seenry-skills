# Accessibility

Build it in; do not audit it in afterward. Native elements solve most of it for free, so every rule here starts with "use the platform".

## Native elements first

| Need | Use | Not |
| --- | --- | --- |
| Action | `<button type="button">` | `<div onclick>`, `<a href="#">` |
| Navigation | `<a href>` | a button that calls `router.push` |
| Modal | `<dialog>` + `showModal()` | a positioned `div` with a manual focus trap |
| Disclosure | `<details>` / `<summary>` | a clickable `div` |
| Choice from a list | `<select>`, radio group, or a headless Select/Combobox primitive | a custom list without keyboard support |
| Toggle that applies immediately | `<button aria-pressed>` or `role="switch"` | a checkbox styled as a switch that needs a submit |

The first rule of ARIA: don't add a role or attribute a native element already provides. `aria-*` changes what assistive technology hears, never what the element does.

## Names

- Every control has an accessible name: visible text, `aria-label` for icon-only buttons, `<label for>` for inputs, `aria-labelledby` for dialogs and regions.
- Visible label text must be contained in the accessible name, so voice control ("click Save") works.
- Images: `alt` describes the information the image carries in context; decorative images `alt=""`; functional images (a logo link) are named by destination ("Acme home"); complex charts get a text summary nearby.
- Inline SVG icons inside a labeled button get `aria-hidden="true"`; standalone meaningful SVGs get `role="img"` and a `<title>` or `aria-label`.
- Visually hidden text uses a `.sr-only` class (clip rect / `clip-path: inset(50%)`, 1px, `overflow: hidden`, `white-space: nowrap`), never `display: none`, which hides it from everyone.

## Structure

- One `h1`, headings in order without skipping levels, landmarks (`header`, `nav`, `main`, `aside`, `footer`) and a skip link to `main` on content-heavy pages.
- Lists are `ul`/`ol`; tables with real headers use `<th scope>`; layout never uses tables.
- `lang` on `<html>`; page `<title>` changes with the route.

## Keyboard and focus

- Everything operable by pointer is operable by keyboard, in visual order. No positive `tabindex`; `tabindex="0"` only on custom widgets, `-1` for programmatic focus targets.
- Composite widgets (tabs, menus, listboxes, toolbars, radio groups, grids) are one Tab stop with arrow keys inside (roving `tabindex`), following the ARIA Authoring Practices pattern for that widget. Home/End jump to ends; typeahead in long lists.
- `:focus-visible` ring on every control: 2px, 3:1 against its background, offset 2px, following the radius, never removed without a replacement. Not hidden under sticky headers (`scroll-padding-top`).
- Dialogs and sheets: move focus in on open (first field or the dialog itself), trap it, close on Escape, return focus to the trigger on close.
- Single-page apps: on route change, move focus to the new page's `h1` (with `tabindex="-1"`) or announce the new title.
- Never trap focus by accident (custom scroll containers, iframes) and never move focus on hover or on input.

## Forms

- Labels above fields, always visible; placeholder is an example, never the label.
- Right `type` and `inputmode` (`email`, `tel`, `url`, `numeric`) and `autocomplete` tokens (`email`, `name`, `street-address`, `one-time-code`, `new-password`, `current-password`) so password managers and keyboards help.
- Errors: text next to the field, linked with `aria-describedby`, field marked `aria-invalid="true"`; on submit, focus the first invalid field or an error summary that links to each field. Don't clear what the user typed.
- Required fields marked in text ("Required" or an explained asterisk), not color alone.
- Don't block paste, don't disable autofill, don't time out a form without warning and a way to extend.
- Disabled: prefer an enabled button that explains what's missing on click. When disabling, `aria-disabled="true"` keeps it focusable and discoverable; the `disabled` attribute removes it from the tab order.

## Announcing changes

| Change | Announce with |
| --- | --- |
| Toast, "Saved", async result | a polite live region (`role="status"`) that exists before the message is inserted |
| Error that blocks progress | `role="alert"` (assertive), used sparingly |
| Content loaded into a region | `aria-busy="true"` while loading, then focus or a status message |
| Expanded/collapsed, selected, pressed | `aria-expanded`, `aria-selected`, `aria-pressed` on the control |

Never `aria-hidden="true"` on anything focusable or on an ancestor of focused content.

## Color, size and zoom

- Text contrast 4.5:1 (3:1 for ≥ 24px or 19px bold); control boundaries, focus rings and meaningful icons 3:1. APCA targets in [color](color.md).
- Never convey state by color alone: add an icon, text, weight or pattern.
- Targets at least 24×24 CSS px with spacing (WCAG 2.2), 44×44 on touch; extend small hit areas with padding or a `::before` inset rather than larger visuals.
- Works at 200% zoom and 320px width without horizontal scroll (tables and code scroll inside their own container), with text sized in `rem`.
- Survives increased text spacing (line height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph spacing 2em) without clipping: no fixed heights on text containers.
- Respects `prefers-contrast: more` and `forced-colors: active` (system colors, visible borders instead of background-only boundaries).

## Motion and media

- `prefers-reduced-motion: reduce`: remove movement, parallax, zoom and loops; keep short opacity changes.
- Anything moving, blinking or auto-updating for more than 5 seconds has pause/stop; nothing flashes more than 3 times a second.
- Video has captions; audio-only content has a transcript; no autoplay with sound.

## Consistency (WCAG 2.2)

- Help, contact and search appear in the same place on every page.
- Don't ask for information already provided in the same flow.
- Authentication never requires solving a puzzle or transcribing a code without allowing paste, a password manager or an alternative.
- Focused elements are never fully hidden by sticky headers, cookie bars or chat widgets.

## Verify

Keyboard-only pass through the main task; a screen reader pass (VoiceOver with Safari, NVDA with Firefox or Chrome) on the key flow; axe or Lighthouse for automated checks (they catch roughly a third of issues); 200% zoom and 320px width. Report what you could not run.
