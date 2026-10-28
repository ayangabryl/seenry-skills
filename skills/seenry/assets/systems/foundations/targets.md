# Targets

## The rule

- Every interactive target is at least **24 × 24px** (WCAG 2.2 2.5.8 AA), or has 24px of clear space around a smaller one.
- On touch layouts (390px and below, or `pointer: coarse`) primary and frequent targets are at least **44 × 44px** (Apple HIG) and 48dp where the system follows Material.
- A small visual control (a 16px checkbox, a 20px switch) may draw small, but its hit area (the label or a pseudo-element) reaches the minimum.
- Adjacent targets have at least 8px between their hit areas on touch.

## Why

Fitts's law: movement time grows with distance over target size, so small targets cost time and errors, more so on touch where the finger hides the target. WCAG 2.5.8 sets the floor; Apple's 44pt and Material's 48dp are the measured comfortable size for a fingertip.

## Check

`system_check.mjs` renders every page at 390 and fails visible controls whose own box or enclosing label is under 24px, and flags primary actions under 44px tall.
