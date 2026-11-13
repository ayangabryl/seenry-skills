# Mobile web

A layout that looks right in desktop Chrome's device mode can still feel broken on a phone. These are the fixes for how touch browsers actually behave. Test on a real device (Safari Web Inspector or Chrome remote debugging against the dev server's LAN address) before calling phone work done.

| Symptom on a phone | Cause | Fix |
| --- | --- | --- |
| Hover style stays stuck after a tap | Touch emulates hover | Wrap hover styles in `@media (hover: hover) and (pointer: fine)`; give touch its own `:active` feedback |
| Gray or blue flash on tap | Default tap highlight | `-webkit-tap-highlight-color: transparent` on interactive elements, plus a real `:active` state |
| Full-height section too tall or jumps as the toolbar hides | `100vh` includes browser chrome | `min-height: 100svh` for stable layouts, `100dvh` when it should follow the toolbar |
| Page zooms when an input is focused | Input text under 16px on iOS | Inputs at `font-size: 16px` (or larger) on small screens |
| Taps feel delayed | Double-tap-to-zoom detection | `touch-action: manipulation` on controls; keep `width=device-width` in the viewport meta |
| Pull-to-refresh or page scroll hijacks an inner scroller or sheet | Scroll chaining | `overscroll-behavior: contain` on the inner scroller or sheet |
| Content hidden behind the notch or home indicator | No safe-area handling | `viewport-fit=cover` in the viewport meta, then `padding: env(safe-area-inset-*)` on fixed bars and edge content |
| Long-press selects button text or opens a callout | Default text selection | `user-select: none` and `-webkit-touch-callout: none` on buttons and draggable handles only (never on content) |
| Horizontal carousel scrolls the page vertically, or vice versa | Missing touch-action | `touch-action: pan-x` on horizontal scrollers, `pan-y` on vertical, and `scroll-snap-type: x mandatory` with `scroll-snap-align` on items |
| Browser bar color clashes with the page | No theme color | `<meta name="theme-color" content="…" media="(prefers-color-scheme: light)">` and a dark variant |
| Sticky header covers the focused input or anchor target | Scroll position ignores the header | `scroll-padding-top: var(--header-h)` on `html` |
| Keyboard covers the primary button | Layout ignores the virtual keyboard | Keep the action in normal flow, or use `interactive-widget=resizes-content` in the viewport meta and position against `dvh` |
| Scrollbars or elastic bounce show inside fixed UI | Body scroll behind an overlay | Lock scroll with `overflow: hidden` on `html` while a modal or sheet is open (the dialog primitive usually handles it) |

Baseline viewport meta for new projects:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Never set `maximum-scale=1` or `user-scalable=no`; they block zoom for people who need it.

## Rules behind the fixes

- **Capability, not device.** Gate by `(hover: hover)`, `(pointer: fine)`, `env()` and `dvh`; never by user-agent or screen width. iPads with trackpads and touch laptops have both inputs, so write for both at once. A `useIsTouchDevice()` hook to hide hover is the wrong tool; the media query is right. Tailwind v4's `hover:` already compiles to `@media (hover: hover)`; in v3 set `future.hoverOnlyWhenSupported`.
- **Each fix where its reason applies.** `user-select: none` on a button is right and on body text is a defect: people copy addresses, errors and order numbers.
- **Feedback on press.** Style `:active` (scale 0.97, 100–160ms, the project's ease-out) and listen to `pointerdown`, not `click`, when JavaScript must respond; a change on release reads as lag even at 0ms.
- **`svh` for heroes, `dvh` for app shells.** `dvh` follows the toolbar, which suits an app shell and causes shifts mid-scroll on marketing content; `svh` never overflows. `lvh` is the old `vh`, almost never wanted.
- **Overscroll:** `none` on `html, body` in an app (drop it for a scrolling document where pull-to-refresh is welcome); `contain` on inner scrollers so their own bounce stays and the page behind does not move. Never a `touchmove` listener with `preventDefault()`: it blocks scrolling and costs frames.
- **`touch-action` names what the browser keeps.** `pan-y` on a horizontal carousel, `pan-x` on a vertical sheet handle, `none` only on a surface that owns every axis, or people cannot scroll past it. Prefer native `scroll-snap-type: x mandatory` and `scroll-snap-align: start` over a hand-rolled carousel.
- **Safe areas** need `viewport-fit=cover`, or every `env(safe-area-inset-*)` is `0px`. Give a fallback in calculations: `calc(1rem + env(safe-area-inset-bottom, 0px))`. Fixed headers, tab bars, toasts and sheets need it.
- **Theme color** matches the top of the page (the header, not the brand color), one per scheme, with `<meta name="color-scheme" content="light dark">`. In Next.js use the `viewport` export (`themeColor: [{ media, color }]`); update the tag from JavaScript when the theme switches by class. Installed PWAs also use `apple-mobile-web-app-status-bar-style` and the manifest's `theme_color` and `background_color`.

## Inputs and the keyboard

Inputs at 16px or more (`@media (pointer: coarse)` if desktop needs smaller). Set the keyboard: `inputmode="numeric"` for codes, `inputmode="decimal"` for amounts, `type="email"` and `type="tel"` for those fields, `autocapitalize="none"` and `autocorrect="off"` on usernames and codes, `enterkeyhint="send"`, `"search"` or `"done"` so the return key says what it does.

## Baseline for a mobile-facing app

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a">
```

```css
html {
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
  overscroll-behavior: none;
}
input, textarea, select { font-size: 16px; }
button, a, [role="button"] {
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}
@media (hover: hover) and (pointer: fine) {
  /* every :hover rule */
}
```

`interactive-widget=resizes-content` makes Android Chrome's keyboard shrink the layout viewport, so `100dvh` and bottom-pinned inputs react as on iOS.

## Test on hardware

Device emulation reproduces none of these: sticky hover, the tap flash, the toolbar's effect on `vh`, input zoom, the click delay, overscroll, safe areas, the keyboard. Run the dev server on `0.0.0.0`, open it by the computer's LAN address, inspect with Safari's Develop menu or `chrome://inspect`. Use a phone a few years old, with the keyboard open, once in landscape, and as an installed PWA if that is a target. The iOS Simulator is better than emulation and still misses touch feel. Report which fixes you verified from code and which need a phone.

## Never ship

| Never | Instead |
| --- | --- |
| `user-scalable=no`, `maximum-scale=1` | 16px inputs |
| Ungated `:hover` | `(hover: hover) and (pointer: fine)` |
| `100vh` for an app shell or bottom-pinned UI | `100dvh` |
| `100dvh` on a marketing hero | `100svh` |
| Press feedback on `click` only | `:active`, `pointerdown` |
| `touchmove` with `preventDefault()` | `overscroll-behavior` |
| `user-select: none` on `body` | Only on controls |
| `touch-action: none` on something people scroll past | `pan-x` or `pan-y` |
| `env(safe-area-inset-*)` without `viewport-fit=cover` | The meta tag |
| One `theme-color` for both schemes | One per scheme |
| User-agent sniffing for touch | `(hover)` and `(pointer)` queries |
| "Fixed" from device emulation | A real phone |
