# Libraries and frameworks by design target

Use what the project already uses first. A new library has to earn its weight: it should do something the page needs that the platform or the existing stack cannot do as well. Never add two libraries for the same job.

## Choosing by what the page needs

| Design target | Reach for | Why | Avoid |
| --- | --- | --- | --- |
| A plain marketing page or prototype | Semantic HTML, modern CSS (container queries, `:has`, `clamp`, View Transitions, scroll-driven animations) and Seenry's [tokens](../assets/tokens.css) | No build step, fastest load, nothing to fight | A framework only for one page |
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
