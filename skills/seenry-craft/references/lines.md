# Lines

How to use rules, dividers and borders. A line is the strongest separator there is, so it is the last one to reach for and the easiest to misuse. Generated interfaces tend to draw a line wherever two things meet; designed ones draw few, and each one has a job.

## Contents

- A line has one of three jobs
- Rules
- Columns without boxes
- Weight and contrast
- Where lines go wrong
- Check it

## A line has one of three jobs

| Job | Looks like | Example |
| --- | --- | --- |
| Separate siblings in a list | A hairline between rows, as wide as the content | A table, a settings list, an index of projects |
| Mark where something starts | One rule above a section or a column, with its label under it | A section head, a column in a price list |
| Bound an object you can act on | A full border, all four sides | An input, a card you can click, a selected option |

A line with none of these jobs is decoration: remove it. Space already separates; a line on top of enough space says the same thing twice.

## Rules

1. **Space first, then a tone, then a line.** Add a line only where space alone leaves the grouping unclear.
2. **One direction per group.** Rows get horizontal rules or columns get vertical ones, never both. Lines in both directions draw boxes, and boxes around text read as a spreadsheet. A real data table with many rows is the exception, and it still drops the vertical lines.
3. **Lines do not meet.** Two lines that touch close a shape. Leave ends open: a rule stops at the content edge, and a column's rule stops at its gutter.
4. **A line is as wide as what it rules.** It starts where the text starts and ends where the content ends. A rule that runs past the text into the page margin, or stops short of it, puts a second, wrong edge on the page. Full-bleed lines (edge to edge of the screen) are the one other honest width.
5. **Text on both sides of a line sits at the same distance from it.** In columns divided by vertical lines, every column needs the same inset, the first one included, or the columns start at uneven steps. This is the usual reason to drop vertical dividers: the first column cannot be inset and aligned to the page edge at once.
6. **One line per boundary.** Never a rule above a heading and another below it; never a border where a neighbor already has one. Count them: n items need at most n − 1 separators.
7. **No line beside emptiness.** A divider next to an empty or nearly empty area divides nothing.
8. **Few weights.** A hairline for rows, at most one stronger rule for the start of a major section. Never three thicknesses on one screen.

## Columns without boxes

Side-by-side blocks (prices, features, stats, footer columns) are where boxes sneak in. Use column rules: each column carries its own short rule on top, the gutter between columns stays empty, and nothing is drawn between or below them.

```css
.columns { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-8); }
.columns > * { border-top: 1px solid var(--color-border); padding-top: var(--space-4); }
```

Every column's text starts exactly under the start of its own rule, the rules line up as one interrupted line, and no shape is closed. The same pattern works for one row of facts under a heading.

For rows, the mirror image: a hairline above each row, the list's last rule optional, no vertical lines; align the columns inside the rows with a shared grid instead.

## Weight and contrast

- 1px, in a color well below the text: about 10–15% of the text color over the background (`--color-border`). A divider as dark as the text competes with it.
- A stronger rule (2px, or the text color) only for the one structural start per screen that needs it, or when the design's idea is the rule itself (a sign, a ticket, a form to print).
- On dark backgrounds, lines go lighter than the surface (white at 10–14%), never darker.
- Dotted leaders belong in directories and menus, where the eye must travel from a name to a value; nowhere else.

## Where lines go wrong

| Wrong | Fix |
| --- | --- |
| Horizontal and vertical lines around every block: a grid of cells | Column rules, or rows; one direction |
| First column flush left, the others inset after a divider | Drop the vertical dividers; use a gap |
| A rule above the section label and another under it | One, above; the label sits under it |
| A header's bottom border running past the content into the margin | Put the border on the inner element, or go full-bleed |
| A divider between two things already 64px apart | Remove it |
| A line under every heading | Space and size already mark a heading |
| A bordered card inside a bordered section inside a bordered page | One level gets a border; the others use space or tone |
| A long vertical line beside a short column | Remove it |
| Dividers darker than secondary text | `--color-border` |
| A 1px line that turns blurry or doubles | Borders collapsing: one side only (`border-top`), never top and bottom on siblings |

## Check it

- Squint: you should see groups, not a grid.
- Count the lines on the screen and name the job of each. Any you cannot name, remove.
- Follow each line to both ends: it lands on a content edge or the screen edge.
- `canvas.mjs verify` warns when a rule runs past its content, when a group has lines in both directions, and when ruled columns start at uneven steps.
