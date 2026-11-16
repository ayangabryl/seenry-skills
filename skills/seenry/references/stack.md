# Stack: framework and libraries

Decide the stack before building, in this order. Do not ask the user; pick, and write one line in `DESIGN.md`: `Stack: <framework> + <libraries>, because <reason from the brief>`.

1. **The user named it.** Use it.
2. **The project has one** (`package.json`, lockfile, config). Use it, and the libraries already installed for each job. If it uses a competitor of a pick below, keep the competitor and say so once.
3. **Empty project.** Pick the framework from the first table, then only the libraries the page needs from the second. Plain HTML is a choice for the cases listed, never the default.

The canvas design is always HTML. This file is about step 8, the build.

## Framework for an empty project

| What is being built | Pick | Why |
| --- | --- | --- |
| Landing page, marketing site, portfolio, blog, docs | Astro, with React islands only where something is interactive | Ships HTML, no JavaScript unless a component needs it; content collections; fastest pages |
| Marketing plus a signed-in product, SaaS, storefront, anything with accounts or server data | Next.js (App Router) with Tailwind | One codebase for public pages and the app; server rendering for search |
| Dashboard or tool behind a login, no public pages | Vite + React with TanStack Router | No server to run; fastest dev loop |
| Shopify storefront | Hydrogen | Built on the Shopify data layer |
| The team writes Vue, Svelte or Angular (the user said so) | Nuxt, SvelteKit, Angular | Their language beats our preference. Never pick Angular unprompted |
| Native mobile app | Expo, per [seenry-apps](../../seenry-apps/SKILL.md) | Platform behavior people expect |
| One throwaway page, an email, an embed, or the user asked for no build step | Semantic HTML and modern CSS | Nothing to install |

## Libraries

One library per job, picked and checked with `seenry-libraries` (its [catalog](../../seenry-libraries/references/catalog.md) has the pick for primitives, toasts, drawers, command menus, animated numbers, drag and drop, virtual lists and the rest). Hover, fade and press states are plain CSS; a library is for what CSS cannot do. The table below is the short version by design target.

## By design target


| Design target | Reach for | Why | Avoid |
| --- | --- | --- | --- |
| A page with no build step (see above) | Semantic HTML, modern CSS (container queries, `:has`, `clamp`, View Transitions, scroll-driven animations) and Seenry's [tokens](../assets/tokens.css) | No build step, fastest load, nothing to fight | A framework only for one page |
| An app UI in React or Next.js | shadcn/ui on Radix or Base UI primitives, Tailwind CSS, Lucide icons | Accessible behavior for menus, dialogs and selects, owned code you can restyle to the system | Kitchen-sink kits whose look you then have to undo |
| Vue or Nuxt | shadcn-vue on Reka UI, Tailwind CSS | Same model as above | Mixing two component libraries |
| Svelte | shadcn-svelte on Bits UI, Tailwind CSS | Same model as above | |
| Component and page motion in React | Motion (motion.dev, formerly Framer Motion) | Layout animation, exit animation, springs, gestures | Animating layout with JavaScript when CSS transitions do it |
| Timelines, scroll storytelling, SVG drawing | GSAP with ScrollTrigger (free, plugins included) | Precise sequencing and scroll control | Stacking GSAP and Motion on the same elements |
| Smooth scrolling | Lenis, only on long editorial pages | Consistent inertia across browsers | Using it on app screens or forms |
| Interactive vector animation made by a designer | Rive | Small files, state machines, runtime control | Video for things that should react |
| Designer-made playback animation | dotLottie | Compact, exact playback of an After Effects piece | Lottie for interface feedback that CSS can do |
| Bento and feature illustrations | [hairline](https://github.com/lucasmarkes/hairline) isometric line figures, or hand-written SVG in the same language | One drawn system that explains each feature and answers the pointer | Stock 3D, blobs and mixed illustration styles |
| 3D product or scene | Three.js with React Three Fiber and drei; Spline for a designer-made scene | Real-time 3D with control over cost | 3D where a photograph or diagram explains better |
| Simple charts in a product | Recharts | Fast, readable defaults you restyle to tokens | Default chart colors |
| Custom or dense data visualization | visx or D3 | Full control over marks, scales and interaction | A heavy chart library for one sparkline |
| Data tables | TanStack Table | Sorting, filtering and virtualization without imposed styling | Building table logic by hand |
| Forms and validation | React Hook Form with Zod | Fast forms, one schema for client and server | Validating only on submit |
| Icons | One set: Lucide, Phosphor or Tabler, at one size and stroke | Consistency | Mixing sets, typed symbols or emoji as icons |
| Fonts | Self-hosted variable fonts (Fontsource or the foundry's files) | Speed, no layout shift, full weight range | Loading five weights you do not use |
| Native mobile screens | SwiftUI, Jetpack Compose or Expo, per [seenry-apps](../../seenry-apps/SKILL.md) | Platform behavior people expect | Web views posing as native |

## Rules

- Match the target, not a trend. A one-page launch does not need a component library; a dense dashboard does need real table and chart tools.
- Restyle every library to the page's tokens: type, color roles, radius, spacing and motion. A page that looks like a library's demo is unfinished.
- Check each new dependency's license and size before adding it, and record it with the reason in `DESIGN.md`.
- Respect reduced motion in every animation library (Motion's `useReducedMotion`, GSAP's `matchMedia`, CSS `prefers-reduced-motion`).
- Keep 3D, canvas and ambient motion under about 10% CPU, pause offscreen and provide a still fallback.
