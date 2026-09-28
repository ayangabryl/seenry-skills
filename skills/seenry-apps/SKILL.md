---
name: seenry-apps
description: "Design, implement or refine connected mobile app screens and flows in the project's existing stack. Use for onboarding, navigation, forms, paywalls, settings and stateful app UI; Seenry app references are optional."
license: MIT
metadata:
  author: Seenry
---

# Seenry Apps

Begin with the user task, target platform, current navigation, actual product data and supported states. Preserve the project's platform and component conventions. A collected app screenshot is evidence of one visible state; inspect an ordered flow or working app before inferring transitions or back behavior.

## Design the flow

Map entry → decision → action → result → recovery. Mark where the user can go back, cancel, retry or change a choice. Decide which surfaces are destinations, sheets or temporary overlays according to their consequence and platform. Keep the main action, selected value and progress understandable when the keyboard opens or content grows.

Inspect a small set of relevant Seenry app screens or supplied references when available. Record the observed subject material, information order, control grouping and platform chrome separately from your interpretation. If the library lacks the target platform or behavior, consult current official platform guidance and mark the reference gap. An attractive onboarding illustration may not help a dense settings screen. Adapt relationships, not source branding, provider marks, image assets or unsupported outcomes.

Build the decisive connected states with real labels and plausible data boundaries. Design loading, empty, error, permission denial and completion for the actions that actually exist. Make controls reachable by touch and assistive input, preserve safe areas and text expansion, and verify narrow devices. Use motion to communicate navigation or state change; keep a static equivalent and test interruption and reduced motion.

Review actual simulator or device output when available. Otherwise inspect rendered captures at target dimensions and mark physical-device, screen-reader and platform behavior unverified. Check the whole flow, not only a polished first screen. For a full Seenry installation, [system design](../seenry/references/system-design.md), [app research](../seenry/references/app-research.md), [accessibility](../seenry-accessibility/SKILL.md), [writing](../seenry-writing/SKILL.md) and [motion](../seenry-motion/SKILL.md) provide focused support.
