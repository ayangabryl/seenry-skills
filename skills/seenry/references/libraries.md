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
| Toasts | Sonner |
| Drawers and bottom sheets with drag | Vaul |
| Command menu | cmdk |
| Animation, gestures, layout transitions (React/JS) | Motion |
| Animated numbers | NumberFlow |
| Tables and data grids | TanStack Table (headless), AG Grid for heavy grids |
| Virtualized lists | TanStack Virtual |
| Charts | Recharts or visx (React), Observable Plot, ECharts for heavy dashboards |
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
