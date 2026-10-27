# Unslop or redesign an existing screen

"Unslop this", "make it not look AI-made", "redesign this dashboard", "make this look professional": the person wants the screen to stop looking generated. Today's models no longer produce the old tells, so what remains is the default look itself: the house palette, the skeleton every model produces for this kind of screen, every block at equal weight, generic copy. A cleanup that clears the board and keeps that look has failed.

Small edits to a real app (a bug, a new empty state, one control) stay on the [existing project](existing-project.md) route.

## What stays, what changes

| Stays exactly | Changes completely |
| --- | --- |
| Every feature, action, field, filter and data point | Composition: what leads, what supports, how sections differ |
| Information architecture and navigation | Type voice, color, surfaces, spacing rhythm |
| Behavior and data model | Copy tone, labels, how numbers and states are shown |
| The project's stack and file layout | Motion, from the motion tokens |

Every affordance on the screen must work. A shortcut hint with nothing behind it (⌘K with no command menu), a badge that means nothing, an "AI" label on a plain list, a button with no handler: wire it up or remove it, and say which in the report.

## The steps

1. **Inventory what exists.** List every feature, action, state and piece of data on the screen. This list is the contract: all of it must still be there at the end.
2. **Name what reads as AI-made.** Look at the screen as a designer would for one second and write down what gives it away. These are the targets, beyond any blocker the board reports.
3. **Research deep.** Survey the category, keep the two or three references that pass on the pixels, and walk every screen of them ([flow, step 3](flow.md#3-research)). Measure them.
4. **Find this product's idea.** What does this product do that no other does, and how can the screen show it? Usually one signature element: a chart, a summary or a list designed around the product's own job, not a generic card. Write `idea.md` and `identity.md` as in the [flow](flow.md), with `Surface: app` at the top of `BRIEF.md`.
5. **Rebuild the presentation** on a token file, keeping the inventory. Break the default skeleton where the content calls for it: one element leads, the rest support it.
6. **Run the full gate.** `node scripts/check.mjs <page> --brief BRIEF.md --mode polish` (showcase when asked). The critic scores `looks_ai`: whether a designer could tell at a glance that AI made it. A screen that still reads as AI-made does not pass, however clean it is.
7. **Check the inventory again.** Every item from step 1 works.

## Gate markers tell the truth

`data-seenry-*` attributes describe the page; they are never added to make a check pass. Do not restructure markup to slip past a check (a `<header>` turned into a `<div>`). If a check does not fit the screen, leave it failing and say why in the report; with `Surface: app` in the brief, landing-page checks are skipped on their own.

## Report

What changed and why it no longer reads as AI-made, the inventory confirmed item by item, any affordance wired or removed, the critic's scores including `looks_ai`, and what the owner should decide.
