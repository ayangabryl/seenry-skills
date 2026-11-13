# Library catalog

Maintained libraries for UI jobs, so nothing is hand-built that a good library already solves. Every package was checked on npm (name, license, recent release) with `scripts/check.mjs`; check again before installing, because projects change owners, licenses and names. "By" names the maker, which is a fact; who else uses a library is not claimed here.

One library per job, the project's existing one first.

## Contents

- Platform first
- Primitives and component systems
- Overlays, feedback and input
- Motion and animation
- Numbers, text and icons
- Lists, tables and drag
- Charts and data
- Editors and canvases
- Media, images and maps
- Forms, state and styling
- AI interfaces
- React Native
- Other frameworks
- Mismatches to catch
- Flags

## Platform first

| Need | Native |
| --- | --- |
| Modal | `<dialog>` with `showModal()`: focus trap, Escape, top layer |
| Menu, non-modal panel, tooltip-like surface | `popover` attribute, with CSS anchor positioning where supported |
| Disclosure, FAQ | `<details>` and `<summary>` |
| Date, color, range, file | Native inputs, styled; replace only when the design needs more |
| Page and shared-element transitions | View Transitions API |
| Carousel | CSS scroll-snap |
| Balanced headlines | `text-wrap: balance` |
| Enter and exit animation | `@starting-style` and `transition-behavior: allow-discrete` |

## Primitives and component systems

Behavior and accessibility solved; your styling.

| Package | By | Use it for |
| --- | --- | --- |
| `@base-ui/react` | Base UI (the Radix, Floating UI and MUI authors) | Unstyled dialogs, menus, popovers, selects, tooltips, with `data-starting-style` hooks and `--transform-origin` for origin-aware motion. The first choice for a new React system |
| `radix-ui` | WorkOS | The same job; the most widely installed primitives, under shadcn/ui |
| `react-aria-components` | Adobe | The strictest accessibility and internationalization, including date pickers and calendars |
| `@ark-ui/react`, `@zag-js/react` | Chakra | State-machine components that also run in Vue, Solid and Svelte |
| `@headlessui/react` | Tailwind Labs | A small set of primitives for Tailwind projects |
| `@floating-ui/react` | Floating UI | Positioning only: custom tooltips, popovers, menus |
| shadcn/ui (copy-in, not a package) | shadcn | Pre-styled components on Radix or Base UI. Restyle them to the project's tokens; the defaults are recognizable |

## Overlays, feedback and input

| Package | By | Use it for |
| --- | --- | --- |
| `sonner` | Emil Kowalski | Toasts. See [Sonner in practice](sonner.md) |
| `vaul` | Emil Kowalski | Drawers and bottom sheets that drag with velocity |
| `cmdk` | Paco Coursey | Command menus (⌘K) |
| `input-otp` | Guilherme Rodz | One-time code inputs |
| `react-day-picker` | gpbl | Calendars and date range pickers |
| `react-colorful` | Vlad Shilov | A tiny color picker |
| `frimousse` | Liveblocks | An unstyled emoji picker |
| `react-dropzone`, `@uppy/core` | community; Transloadit | File drop zones; full upload flows with progress and resume |
| `react-hotkeys-hook`, `tinykeys` | community | Keyboard shortcuts |
| `driver.js` | Kamran Ahmed | Product tours and highlights |
| `react-resizable-panels` | Brian Vaughn | Resizable split panes, like an IDE |
| `react-textarea-autosize`, `react-number-format` | community | Growing textareas; formatted number and currency inputs |
| `qrcode.react` | community | QR codes |

## Motion and animation

| Package | By | Use it for |
| --- | --- | --- |
| `motion` | Motion (formerly Framer Motion) | Springs, layout and shared-layout animation, exit animation, gestures, scroll. Also runs without React |
| `gsap` | GSAP (Webflow) | Timelines, scroll-driven scenes, SVG morphing, text splitting. Free under its own "no charge" license, not MIT: read it |
| `lenis` | darkroom.engineering | Smooth scrolling for marketing sites. Never in product UI |
| `@formkit/auto-animate` | FormKit | One-line add, remove and reorder animation for simple lists |
| `@rive-app/react-canvas` | Rive | Interactive, state-driven vector animation designed in Rive |
| `@lottiefiles/dotlottie-react` | LottieFiles | Playing Lottie and dotLottie files: illustration and celebration, never UI state |
| `@react-spring/web` | Poimandres | An alternative spring library; do not add beside Motion |
| `@use-gesture/react` | Poimandres | Raw drag, pinch and wheel gestures when Motion's are not enough |
| `canvas-confetti` | community | A rare celebration |
| `three`, `@react-three/fiber`, `@react-three/drei` | three.js; Poimandres | 3D scenes |
| `ogl` | community | Small WebGL effects without three.js |
| `cobe` | Shu Ding | A light 3D globe |
| `leva`, `dialkit` | Poimandres; Josh Puckett | Live control panels for tuning values while designing |

A hover or a fade needs none of these: use a CSS transition (`seenry-motion`).

## Numbers, text and icons

| Package | By | Use it for |
| --- | --- | --- |
| `@number-flow/react` | Maxwell Barvian | Numbers that animate digit by digit: prices, counters, stats. Framework builds exist for Vue and Svelte |
| `torph` | Lochie Axon | Text that morphs between strings |
| `shiki` | Shiki | Syntax highlighting with real editor themes |
| `react-markdown`, `streamdown` | unified; Vercel | Rendering Markdown; rendering it while it streams from a model |
| `satori` | Vercel | Social images from HTML and CSS |
| `lucide-react`, `@phosphor-icons/react`, `@tabler/icons-react` | their projects | Icon sets; one set per product |

## Lists, tables and drag

| Package | By | Use it for |
| --- | --- | --- |
| `@tanstack/react-table` | TanStack | Headless tables: sorting, filtering, grouping, pinning |
| `@tanstack/react-virtual`, `react-virtuoso` | TanStack; Petyo Ivanov | Virtualizing long lists; Virtuoso handles variable heights, grouping and chat-style lists with less work |
| `ag-grid-react` | AG Grid | Heavy spreadsheet-like grids |
| `@glideapps/glide-data-grid` | Glide | Canvas grid for millions of rows |
| `@dnd-kit/react` (new), `@dnd-kit/core` (classic) | Claudéric Demers | Accessible drag and drop: sortable lists, boards |
| `@atlaskit/pragmatic-drag-and-drop` | Atlassian | Fast, framework-agnostic drag and drop built on the native API |
| `embla-carousel-react`, `swiper` | community | Carousels when scroll-snap is not enough |
| `masonic` | community | Virtualized masonry grids |

## Charts and data

| Package | By | Use it for |
| --- | --- | --- |
| `recharts` | Recharts | General charts in React dashboards |
| `@visx/visx` | Airbnb | Low-level chart building blocks for custom visuals |
| `@observablehq/plot` | Observable | Concise exploratory charts |
| `echarts` | Apache | Heavy dashboards, many series, canvas rendering |
| `lightweight-charts` | TradingView | Financial candlesticks and time series |
| `uplot` | Leon Sorokin | Very fast time series |
| `liveline` | Benji Taylor | Real-time charts that scroll with time |
| `@tremor/react` | Tremor | Pre-built dashboard blocks; last npm release was early 2025, check before adopting |

One sparkline needs no library: an inline SVG path is enough. Apply `seenry-craft`'s color rules to any chart.

## Editors and canvases

| Package | By | Use it for |
| --- | --- | --- |
| `@tiptap/react` | Tiptap | Rich text editors (on ProseMirror) |
| `lexical` | Meta | Rich text with a small core |
| `@blocknote/react` | BlockNote | Notion-style block editor out of the box (MPL-2.0) |
| `codemirror`, `monaco-editor` | Marijn Haverbeke; Microsoft | Code editors: light and embeddable; the VS Code editor |
| `@xyflow/react` | xyflow (React Flow) | Node graphs, workflow builders |
| `tldraw` | tldraw | Infinite canvas and whiteboard. Its own license: commercial use needs a key |

## Media, images and maps

| Package | By | Use it for |
| --- | --- | --- |
| `media-chrome`, `@mux/mux-player-react` | Mux | Custom video and audio player controls; a complete player |
| `vidstack` | Vidstack | An accessible, themeable player |
| `wavesurfer.js` | katspaugh | Audio waveforms |
| `yet-another-react-lightbox`, `photoswipe` | community | Image lightboxes and galleries |
| `react-medium-image-zoom` | Robert Pearce | Click-to-zoom images |
| `maplibre-gl`, `deck.gl` | MapLibre; OpenJS (vis.gl) | Vector maps; large data layers on maps |
| `@react-pdf/renderer`, `@react-email/components` | Diego Muracciole; Resend | PDFs and emails from React components |

## Forms, state and styling

| Package | By | Use it for |
| --- | --- | --- |
| `react-hook-form`, `@tanstack/react-form` | community; TanStack | Forms |
| `zod`, `valibot` | Colin McDonnell; Fabian Hiller | Schema validation; Valibot is smaller |
| `@tanstack/react-query` | TanStack | Server state, caching, optimistic updates |
| `zustand`, `jotai` | Poimandres | Shared client state: a store; atoms |
| `nuqs` | François Best | State in the URL (filters, tabs) with types |
| `clsx`, `class-variance-authority`, `tailwind-variants`, `tailwind-merge` | their authors | Conditional classes; typed variants; merging Tailwind classes |
| `next-themes` | Paco Coursey | Theme switching with no flash on load |
| `date-fns`, `@internationalized/date` | date-fns; Adobe | Dates; calendar-correct dates across locales |

## AI interfaces

| Package | By | Use it for |
| --- | --- | --- |
| `ai` | Vercel | Streaming chat and tool-call state in the UI |
| `@assistant-ui/react` | assistant-ui | Chat interface primitives: threads, composer, attachments |
| `streamdown` | Vercel | Markdown that renders correctly mid-stream |

## React Native

| Package | By | Use it for |
| --- | --- | --- |
| `react-native-reanimated`, `react-native-gesture-handler` | Software Mansion | Motion and gestures on the UI thread. See `seenry-apps`' [Expo motion](../../seenry-apps/references/expo-motion.md) |
| `expo-router` | Expo | Navigation, native tabs, sheets, menus |
| `@gorhom/bottom-sheet` | Mo Gorhom | Custom bottom sheets when a native form sheet is not enough |
| `@shopify/flash-list`, `@legendapp/list` | Shopify; Legend | Fast long lists |
| `@shopify/react-native-skia` | Shopify | Canvas drawing and large animated scenes |
| `react-native-keyboard-controller` | Kirill Zyusko | UI that follows the keyboard |
| `zeego` | Fernando Rojo | Native context and dropdown menus |
| `lottie-react-native` | Airbnb | Lottie illustrations |

## Other frameworks

| Stack | Primitives | Motion |
| --- | --- | --- |
| Vue | `reka-ui`, Headless UI, Ark UI | `motion-v`, Vue transitions |
| Svelte | `bits-ui`, Melt UI, Ark UI | Svelte transitions and springs, `motion` |
| Solid | Kobalte, Ark UI | `motion`, `solid-transition-group` |
| No framework | Native elements, Zag, Floating UI | CSS, Web Animations, `motion`, `gsap` |

Check a framework build before assuming one: NumberFlow, Embla, TanStack and Floating UI ship several.

## Mismatches to catch

- A modal built from a positioned `div`: `<dialog>` or a dialog primitive.
- A select rebuilt without typeahead and keyboard support: the primitive's Select, or the native element.
- A toast built by hand or with a modal library: Sonner.
- A number animated by re-rendering its text, or with a count-up on load: NumberFlow, and only when the value really changes.
- A bottom sheet with a hand-written drag: Vaul on the web, a native sheet or `@gorhom/bottom-sheet` in React Native.
- 1,000 or more rows rendered directly: virtualize.
- Drag and drop on raw pointer events with no keyboard path: dnd kit or Pragmatic drag and drop.
- A second animation library beside an existing one; Motion installed for a hover.
- A web of `useState` and props for shared state: Zustand, or the URL with nuqs.
- Class strings built from nested ternaries: clsx, or cva when they are variants.
- A heavy chart library for one sparkline; a smooth-scroll library inside an app.
- A component library's default look shipped unchanged: map its tokens to the project's.

## Flags

Checked when this catalog was written; `check.mjs` reports the current state.

| Package | Note |
| --- | --- |
| `gsap` | Free, under GSAP's own no-charge license rather than an open-source one |
| `tldraw` | Its own license; production use needs a license key |
| `@blocknote/react`, `satori` | MPL-2.0: changes to their files must be shared |
| `vaul`, `@dnd-kit/core`, `@use-gesture/react`, `photoswipe`, `@glideapps/glide-data-grid`, `@tremor/react` | Stable but with no recent npm release; confirm they work with the project's React version |
| `@base-ui-components/react` | The old package name; use `@base-ui/react` |
