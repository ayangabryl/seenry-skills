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
3. **Research deep.** Survey the category, keep the two or three references that pass on the pixels, and walk every screen of them ([flow, step 3](flow.md#3-research)). Measure them. Include the category's own leaders (for invoicing: Xero, QuickBooks, FreshBooks, Stripe Invoicing), not only products with a craft you admire. When the library has no app screens for them, capture them live with `bar.mjs` or write down the convention you already know they use; "no leader shows this" is never a reason to invent the form yourself.
4. **Set the craft floor from the best reference.** Of the kept references, the one whose screen does the closest job best sets the floor: its controls, density, action system (one primary style, one quiet style), color for state and alignment grid. Matching it is the minimum, not the goal; a careful copy scores below its source.
5. **Combine the strengths no single reference has.** Take each part from the reference that does it best (the interface controls from one, how money and dense tables read from a finance leader, invoice rows and statuses from another), measured. Then make the decisions none of them needed to make for this product's job, such as how late money gets chased or what to do next. **Convention before invention:** every chart, control and status uses the form people in this category already know (receivables as aging buckets, cash flow as collected per period, a status as a word); the screen is new in what it helps people do and how well it is made, never in a chart grammar they have to learn. Name at least two places where the screen will be better than every reference, and why. Write `idea.md` and `identity.md` as in the [flow](flow.md), with `Surface: app` at the top of `BRIEF.md`. A named site in the request ("design it like X") is a different brief: use the [named site](named-site.md) route instead.
6. **Rebuild the presentation** on a token file, keeping the inventory, with every state change on the [motion table](existing-project.md#7-motion-by-default-from-tokens), tooltips and chart switches included. Before the gate, check the screen against the junior tells: more than one primary and one quiet action style, one color carrying several meanings, blocks that share no edge or baseline, size-mixing inside one line, density that changes between sections, rules doing the work of spacing.
7. **Record decisions as you make them.** Each choice goes in `.seenry/decisions.md` with its reason; the critic reads it and does not ask to reverse a recorded decision, so rounds stop undoing each other. The owner's choices go there too.
8. **Run the full gate.** `node scripts/check.mjs <page> --brief BRIEF.md --mode polish` (showcase when asked). The critic scores `looks_ai`, whether a designer could tell at a glance that AI made it, and `seniority`, whether a senior designer at the reference's company would ship it as it is. Either one caps the score: a screen that reads as AI-made or as junior work does not pass, however clean or clever it is. Fix `junior_tells` before anything else. It scores `clarity` too: what a first-time user would read each chart and control as in five seconds, against what it shows; anything in `unclear` is redesigned in the category's conventional form. The critic also lists `beats_reference`, the places the screen is better than every reference; an empty list means it is still a copy. Two critic rounds without a gain end the loop.
9. **Check the inventory again.** Every item from step 1 works.

## Gate markers tell the truth

`data-seenry-*` attributes describe the page; they are never added to make a check pass. Do not restructure markup to slip past a check (a `<header>` turned into a `<div>`). If a check does not fit the screen, leave it failing and say why in the report; with `Surface: app` in the brief, landing-page checks are skipped on their own.

## Report

What changed and why it no longer reads as AI-made, the inventory confirmed item by item, any affordance wired or removed, the critic's scores including `looks_ai`, `seniority` and `clarity`, where it beats the references, and what the owner should decide.
