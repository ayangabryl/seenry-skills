# Finish the experience, not just the render

Use for a complete interface. Select checks by actual scope; a static hero has no upload-recovery requirement. Record failures and unavailable checks separately.

**Content and state:** all navigation reaches a useful destination; every CTA has a truthful result; incorrect and empty values are handled; input survives recoverable failure; repeated actions do not duplicate effects. An email link is often a better prototype action than an elaborate fake inquiry system. Do not require visitor-facing JSON, downloads or implementation explanations unless they help the task.

**Responsive and accessible:** inspect wide, narrow and reflow renders; sticky/fixed occlusion; task dependencies, DOM order and keyboard order. Required choices precede dependent forms/actions. If resizing fails, mark narrow layout unverified. Check focus, Escape/return, labels, errors, text spacing and zoom. Closed drawers/dialogs must remove controls from Tab order (`hidden`, `inert` or a closed native `<dialog>`); `aria-hidden` alone does not. Browser evidence lists hidden and offscreen focus candidates; inspect them. Emulation cannot verify devices or screen readers. Test long content/scripts.

**Retained direction:** compare actual type and important relationships with the selected study using [design continuity](design-continuity.md). Keep intended revisions and accidental drift distinct. A computed font declaration alone does not prove font loading.

**Geometry:** compare anchors after overlays, value changes and font load. At 320px, compare `document.documentElement.scrollWidth` with `innerWidth`; if wider, find the culprit before suppressing overflow. Browser evidence lists likely culprits in `horizontalOverflow`. Add `scrollbar-gutter: stable` only to a scrolling element with measured classic-scrollbar shift. Inspect mobile navigation using real labels and localized text.

**Media:** verify every selected asset loads, has correct aspect and alt treatment, fits both desktop and mobile crops, and has a usable fallback. Use `picture` for a different crop and `srcset` for resolution alternatives. Set intrinsic dimensions; avoid lazy-loading the likely opening/LCP image. Check transferred bytes and slower network behavior. A remote preview board is not a deployment-ready asset manifest. Respect API hotlinking requirements where applicable.

**Motion:** cover actual selection, loading, disclosure, navigation and operation feedback. Inspect normal-speed entry and exit, forward/reverse scroll, deep-position reload, interruption, rapid repeated input and reduced motion. Explain deliberate immediate/static cases. One owner per animated property; native scrolling survives failed enhancement. Watch generated recordings: screenshots cannot establish motion, and low capture FPS cannot establish source stutter.

**Performance:** inspect loading, long tasks and layout shifts on the built artifact. Field Core Web Vitals use LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile; local lab snapshots do not certify field performance. Avoid adding three motion engines for the same ownership role. Pay for expressive effects with measured value and usable fallbacks.

The optional `scripts/browser_evidence.mjs` captures local pages and scripted interactions through Playwright. It records geometry, resource failures and motion; it does not evaluate aesthetic quality, screen-reader output or real-device performance. Native browser tools remain equally valid.

Sources: [W3C text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing), [responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images), [Core Web Vitals](https://web.dev/articles/vitals), [Shneiderman's rules](https://www.cs.umd.edu/users/ben/goldenrules.html). Apply the principles to the actual task rather than treating compliance as complete design quality.
