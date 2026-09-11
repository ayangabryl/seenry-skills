# Finish the experience, not just the render

Use for a complete interface. Select checks by actual scope; a static hero has no upload-recovery requirement. Record failures and unavailable checks separately.

**Content and state:** all navigation reaches a useful destination; every CTA has a truthful result; incorrect and empty values are handled; input survives recoverable failure; repeated actions do not duplicate effects. An email link is often a better prototype action than an elaborate fake inquiry system. Do not require visitor-facing JSON, downloads or implementation explanations unless they help the task.

**Responsive and accessible:** inspect the whole layout at wide, narrow and reflow widths. Check real keyboard order, visible focus, Escape/return focus for overlays, meaningful labels and errors. Test text-spacing overrides and zoom. Do not mark assistive-technology use or physical devices as tested from viewport emulation. Record those as pending when absent. Use authentic long content, unbroken names, numerals and supported scripts for the actual audience.

**Retained direction:** compare actual type and important relationships with the selected study using [design continuity](design-continuity.md). Keep intended revisions and accidental drift distinct. A computed font declaration alone does not prove font loading.

**Geometry:** compare alignment anchors before/after overlays, overflow, value changes and font load. Reserve scrollbar space only where classic scrollbars can cause a measured shift. Prefer `scrollbar-gutter: stable` on the actual scrolling element when appropriate; do not paint decorative rails, force `both-edges` globally or double-compensate body padding. Overlay scrollbars and nonoverflowing pages need no artificial gap. Inspect mobile navigation with its real CTA labels and localized text.

**Media:** verify every selected asset loads, has correct aspect and alt treatment, fits both desktop and mobile crops, and has a usable fallback. Use `picture` for a different crop and `srcset` for resolution alternatives. Set intrinsic dimensions; avoid lazy-loading the likely opening/LCP image. Check transferred bytes and slower network behavior. A remote preview board is not a deployment-ready asset manifest. Respect API hotlinking requirements where applicable.

**Motion:** verify normal-speed entrance, forward/reverse scroll, reload at a deep position, interruption, ten rapid inputs and reduced motion. One owner per animated property. A low frame rate recording is not proof that the source website stutters. Watch the generated recording as well as reading metrics. Native scrolling must remain useful if enhancement fails.

**Performance:** inspect loading, long tasks and layout shifts on the built artifact. Field Core Web Vitals use LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile; local lab snapshots do not certify field performance. Avoid adding three motion engines for the same ownership role. Pay for expressive effects with measured value and usable fallbacks.

The optional `scripts/browser_evidence.mjs` captures local pages and scripted interactions through Playwright. It records geometry, resource failures and motion; it does not evaluate aesthetic quality, screen-reader output or real-device performance. Native browser tools remain equally valid.

Sources: [W3C text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing), [responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images), [Core Web Vitals](https://web.dev/articles/vitals), [Shneiderman's rules](https://www.cs.umd.edu/users/ben/goldenrules.html). Apply the principles to the actual task rather than treating compliance as complete design quality.
