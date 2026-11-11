# Libraries: don't hand-roll what the platform or a primitive already solves

A hand-built `<div>` dropdown without focus management, typeahead, collision handling and dismissal rules is a defect, however good it looks. Use the project's existing component library first. If there is none, reach for these, style them with the system, and spend the saved time on design.

Check the project's framework and existing dependencies before adding anything; one library per job.

## Platform first

| Need | Native |
| --- | --- |
| Modal | `<dialog>` + `showModal()` (focus trap, Escape, top layer) |
| Non-modal floating panel, menu, tooltip-like surface | `popover` attribute (+ CSS anchor positioning where supported) |
| Disclosure, FAQ | `<details>` / `<summary>` |
| Date, color, range, file inputs | Native inputs, styled; replace only when the design genuinely needs more |
| Page and shared-element transitions | View Transitions API |

## Headless primitives (accessibility and behavior, your styling)

| Stack | Library |
| --- | --- |
| React | Base UI, Radix Primitives, React Aria Components |
| Vue | Reka UI (Radix Vue), Headless UI |
| Svelte | Bits UI, Melt UI |
| Any framework | Ark UI (Zag.js state machines) |
| Positioning only | Floating UI |

Pre-styled on top of those: shadcn/ui (copy-in components on Radix or Base UI). Restyle them to the project's system; the defaults are recognizable.

## Specific jobs

| Job | Library |
| --- | --- |
| Toasts | Sonner (see below) |
| One-time codes, verification inputs | input-otp |
| Tuning panels and live controls | Leva, or DialKit |
| Drawers and bottom sheets with drag | Vaul |
| Command menu | cmdk |
| Animation, gestures, layout transitions (React/JS) | Motion |
| Animated numbers | NumberFlow |
| Animated text | Torph |
| 3D globes | Cobe |
| Social images from HTML and CSS | Satori |
| Syntax highlighting | Shiki |
| Tables and data grids | TanStack Table (headless), AG Grid for heavy grids |
| Virtualized lists | TanStack Virtual, or Virtuoso for long lists and tables |
| Drag and drop | dnd kit |
| State shared across components | Zustand |
| Conditional classes | clsx; cva when a component has real variants (size, intent, state) |
| Theme switching with no flash on load | next-themes |
| Charts | Recharts or visx (React), Observable Plot, ECharts for heavy dashboards; Liveline for real-time charts that scroll with time |
| Rich text | Tiptap, Lexical |
| Forms and validation | React Hook Form or TanStack Form + Zod/Valibot |
| Carousels | Embla Carousel, or CSS scroll-snap |
| Icons | Lucide, Phosphor, Tabler (via `seenry-assets`) |
| Dates | date-fns or Temporal (with polyfill) |
| React Native motion and gestures | Reanimated, Gesture Handler |

## Mismatches to catch

- A modal built from a positioned `div`: use `<dialog>` or a dialog primitive.
- A select rebuilt without typeahead and keyboard support: use the primitive's Select or the native element.
- A second animation library next to an existing one.
- A component library's default look shipped unchanged: map its tokens to the project system.
- A heavy chart library for one sparkline: an inline SVG path is enough.
- Toasts built by hand or with a modal library: Sonner.
- A number animated by re-rendering its text: NumberFlow.
- 1,000+ rows rendered directly: virtualize before inventing pagination.
- A web of `useState` and props for state many components share: Zustand.
- Class strings built from nested ternaries: clsx, or cva when they are variants.
- Motion installed for a hover or a fade: a CSS transition.

## Sonner in practice

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
