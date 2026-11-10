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
