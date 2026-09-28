---
name: seenry-accessibility
description: "Design and audit accessible web interfaces. Use for keyboard, focus, names, state announcements, contrast, zoom, reduced motion and assistive-technology review."
license: MIT
metadata:
  author: Seenry
---

# Seenry Accessibility

Audit the actual task path and rendered states. Preserve a project's applicable accessibility standard; do not declare compliance from a lint pass or from a screenshot. Accessibility is part of design: information, state and recovery must remain understandable through different inputs and presentations.

## Follow the task twice

Complete the flow by keyboard alone: Tab order, visible focus, Enter and Space activation, Escape and focus return, disclosure, dialog, error recovery and any pointer-only gesture. Then inspect names, roles, values and state announcements using a screen reader when available. If that second walk cannot run, report it as unverified. Native buttons, links, inputs and disclosures usually give a stronger base than rebuilt div controls. Add ARIA only for behavior the native element does not express.

## Test the visual alternatives

Measure text and meaningful graphic contrast on their real surfaces. Inspect focus against adjacent colors, including imagery. At 320px, 200% zoom and enlarged text, check that content and actions remain reachable without two-dimensional scrolling except where the content genuinely requires it. Review forced-colors and reduced-motion behavior where supported. A reduced-motion state must preserve meaning, not merely remove animation. Information must not rely on color, location or motion alone.

Check loading, empty, error, success, disabled and open states. A success message needs a real successful operation. An error needs a route to recovery. Image alternatives describe meaningful content; decoration stays out of the accessibility tree. For app screens, preserve platform navigation and control conventions rather than importing web ARIA patterns.

List findings with the observed state, impact, exact element or screen and a retest. Distinguish tested behavior from inferred risk. For a full Seenry installation, use [focus and keyboard](../seenry/references/focus-and-keyboard.md), [form recovery](../seenry/references/form-recovery.md) and the narrow [semantic names checker](../seenry/scripts/semantic_names.py); no one helper proves accessibility.
