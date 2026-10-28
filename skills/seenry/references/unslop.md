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
4. **Pick the reference to build on.** Of the kept references, choose the one whose screen does the closest job best. Its execution is the base: layout skeleton, component set, density, action system (one primary style, one quiet style), how it uses color for state, its alignment grid. Write in `kept.md` which reference this is and the five or six execution decisions you take from it, measured.
5. **Find this product's idea, then draw it at the reference's finish.** One signature element designed around the product's own job (a chart, a summary, a list), not a new layout. It is the only place you leave the reference's execution, and it must be drawn as carefully as the reference draws its best component: real marks at readable size, a full axis, labels that never float over data. A clever idea drawn roughly reads as junior work, which is worse than a familiar layout done well. Write `idea.md` and `identity.md` as in the [flow](flow.md), with `Surface: app` at the top of `BRIEF.md`.
6. **Rebuild the presentation** on a token file, keeping the inventory. Before the gate, check the screen against the junior tells: more than one primary and one quiet action style, one color carrying several meanings, blocks that share no edge or baseline, size-mixing inside one line, density that changes between sections, rules doing the work of spacing.
7. **Run the full gate.** `node scripts/check.mjs <page> --brief BRIEF.md --mode polish` (showcase when asked). The critic scores `looks_ai`, whether a designer could tell at a glance that AI made it, and `seniority`, whether a senior designer at the reference's company would ship it as it is. Either one caps the score: a screen that reads as AI-made or as junior work does not pass, however clean or clever it is. Fix `junior_tells` before anything else.
8. **Check the inventory again.** Every item from step 1 works.

## Gate markers tell the truth

`data-seenry-*` attributes describe the page; they are never added to make a check pass. Do not restructure markup to slip past a check (a `<header>` turned into a `<div>`). If a check does not fit the screen, leave it failing and say why in the report; with `Surface: app` in the brief, landing-page checks are skipped on their own.

## Report

What changed and why it no longer reads as AI-made, the inventory confirmed item by item, any affordance wired or removed, the critic's scores including `looks_ai` and `seniority`, and what the owner should decide.
