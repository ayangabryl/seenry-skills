# Screens

What each kind of screen must hold, how it is ordered, and the states it needs. Use it in the brief to write the inventory and again before the check.

## Write the inventory before any layout

List what the best products put on this kind of screen: the data each item shows, the actions on one item, the actions on the whole screen, and the states. A tidy screen missing one of them is unfinished. Removing decoration never removes content, an affordance or a recognition aid.

| Screen | Must hold | Order |
| --- | --- | --- |
| Landing | What it is in one line, the product or subject shown at real size, one action, proof from real customers or real numbers, the answer to the first objection, price or how to start | Whatever answers the visitor's next question. Remove any section that answers none |
| Pricing | Plans with the price as the largest type, what each includes, the billing switch, the recommended plan marked once, questions about billing | Plans, comparison, questions, action |
| Dashboard or tool | Zero to three summary figures, then the work (table or list) inside the first screen, search, filter, sort, the create action | Summary strip, then the work. No hero and no marketing type sizes |
| Table or list | Columns people scan by, status including the edge ones (pending, failed, overdue), row actions, bulk actions, pagination or count | Identifying column first, actions last |
| Detail (record, product) | Name, the key fact or price, the primary action, secondary facts, history or related items | Media or identity leading, summary beside it, details below |
| Settings | Sections, each with a title and a line of help, rows of label and control, a separate destructive zone | Most used first, destructive last. Save per group or autosave |
| Form | Labels above fields, help where a mistake is likely, inline errors with a fix, one primary action | The order people think in, never the database's |
| Sign in | Providers, fields, recovery, the legal line | One column 360 to 400px wide |
| Docs or article | Navigation, a reading column of 60 to 75 characters, a page outline | Three regions from 1280px, one on a phone |
| Empty, error, 404 | What happened in one line, the one next action, the shell kept so people can leave | Title, help, action |

## One thing leads

Decide what a person sees first on the screen, then second, then third, and build the sizes from that. If three things compete, nothing leads.

- A landing section has one anchor: the product working, one photograph or one statement, at 40 to 60 percent of the content width or the full width.
- A product screen leads with the work, not with a header band or summary cards.
- Proof on a page renders at real size. Show fewer rows or a crop; never a shrunken screenshot.

## The page shell is one decision

| Part | Phone (390) | Desktop (1440) |
| --- | --- | --- |
| Content width | Full, minus the gutters | 1200 to 1280, or 1080 for text-led pages |
| Gutter | 16 to 24 | 32 to 48 |
| Header height | 48 to 56 | 56 to 64 |
| Between sections, marketing | 64 | 96 to 160 |
| Between sections, product | 24 to 32 | 32 to 48 |
| App sidebar | A sheet or tabs | 224 to 260 |

The logo, the section content and the footer start on the same edge. A background may run full width; content does not, except media meant to.

## States to build and to look at

Every component: default, hover, focus by keyboard, pressed, disabled, loading in its final footprint, empty, error with a way to recover, selected or current.

Every screen: no items, one item, many items, text twice as long, a five-digit number, a missing image, 320px wide.

States that only show in use, each seen broken on a shipped page:

| State | It is right when |
| --- | --- |
| A tooltip on the first and last mark of a chart | It stays inside its container and points at its anchor |
| A select | It matches the fields' height, radius and chevron, not the browser's |
| A dialog opened with the mouse | Focus is on the dialog, with rings only for keyboard focus |
| A long table, scrolled | One rule under the pinned header, and the panel keeps its radius |
| A sorted column | Only that column shows an arrow, and the arrow swaps without spinning |
| Two cards in one row | They end on the same line |
| A hovered row in a rounded panel | The fill follows the panel's inner radius |
| A pinned toolbar on a phone | Only search and filters stay pinned, on an opaque ground |
