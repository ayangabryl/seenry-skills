# Sonner in practice

Picking the right `toast()` call, styling it, and fixing the common problems.

| You want | Call |
| --- | --- |
| A message | `toast('Saved')`, with `{ description }` for a second line |
| A typed icon | `toast.success()`, `.error()`, `.info()`, `.warning()` |
| Loading you manage yourself | `toast.loading('Uploading…')`, then update it by `id` |
| Loading tied to a promise | `toast.promise(promise, { loading, success, error })`; success and error may be functions of the result |
| An action | `{ action: { label, onClick } }`; it closes the toast unless `onClick` calls `event.preventDefault()`; `cancel` is the secondary button |
| Your JSX in Sonner's shell | `toast(<Jsx />)` |
| Your JSX with no Sonner styles | `toast.custom((t) => <Jsx id={t} />)`: keeps positioning, stacking and swipe |

Styling, climbing only as far as needed: defaults (`richColors` for colored success and error, `invert`); `toastOptions={{ style }}` or `style` per toast; `toastOptions={{ classNames: { toast, title, description, actionButton, cancelButton, closeButton } }}`, which need `!important` because Sonner's injected styles win; headless `toast.custom()` wrapped in your own `toast()` function, the right end state for a design system. Icons: the Toaster's `icons`, per toast `icon`, `null` removes. `theme` defaults to `'light'` and ignores the OS: pass `theme="system"` or `<Toaster theme={resolvedTheme} />`.

| Symptom | Cause and fix |
| --- | --- |
| Never appears | No `<Toaster />` mounted, or it unmounted; mount one at the root. `toast()` is client-only: call it on the client with a server action's result |
| Appears twice | Two Toasters (layout and page), or fired in an effect under StrictMode; fire from the event handler or pass a stable `id` |
| Classes have no effect | Default styles win: `!important`, `unstyled`, or headless |
| Completely unstyled (Astro, view transitions) | Import `sonner/dist/styles.css` in a layout |
| Unstyled in Shadow DOM | Copy the style tag containing `[data-sonner-toaster]` into the shadow root |
| Behind a modal or clipped | An ancestor with `transform`, `filter` or `overflow`; move `<Toaster />` to the document root |
| Dark mode ignored | `theme="system"` or the resolved theme |
| Success and error are grey | Add `richColors` |
| Never closes | `duration: Infinity`, `dismissible: false`, or a promise that never settles |
| Swipe goes the wrong way | Directions follow `position`; set `swipeDirections` |
| Shows in every toaster | Give each Toaster an `id` and pass `toasterId` |
| Too close to the edge on phones | `offset` (32px default) and `mobileOffset` (16px under 600px) |
