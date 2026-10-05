# The Seenry sheet

Every design task ends with a sheet: one self-contained HTML page that explains why the design is what it is, what was researched, how each component is built, and the rules for keeping future work consistent. It is styled like seenry.design (Open Runde, neutral surfaces, 24px panels) so anyone who opens it knows it came from Seenry, and it travels with the project as its living design guideline, in the spirit of published brand guidelines such as Spotify's design documentation.

Nobody asks for it; it is part of done. Keep the record at `.seenry/sheet.json` (or next to the project's `DESIGN.md`) and render it at the end:

```sh
python3 scripts/anatomy.mjs <url|file> --selector "<component>" --out .seenry/shots/<name>   # per signature component
python3 scripts/sheet.py .seenry/sheet.json --palette "<brand hex>"                        # writes .seenry/sheet.html
```

Then open it for the user and give the path. Update the record whenever a decision changes and re-render; the sheet and `DESIGN.md` never disagree.

A finished example: [assets/examples/sheet/pricing.sheet.html](../assets/examples/sheet/pricing.sheet.html) from [its record](../assets/examples/sheet/pricing.sheet.json).

## What goes in it

Fill it in as you work, not from memory at the end. Only `project` and `pointOfView` are required; empty sections are omitted, never padded.

| Field | Content |
| --- | --- |
| `project`, `date`, `stack` | Name, ISO date, framework |
| `pointOfView` | One sentence: what this design is trying to be, for whom |
| `brief` | The job, constraints and platforms, in one or two sentences |
| `brand` | `{concept, voice, imagery, signature, rejected[{name, why}]}`: the art direction ([art direction](art-direction.md)) and the two directions it beat |
| `result.images[]` | `{src, caption, viewport: "phone"?}`: final screenshots at desktop and phone width |
| `decisions[]` | `{topic, choice, why, evidence}`: every consequential choice (structure, emphasis, type, color, motion) with the reason and where the evidence came from |
| `research.mcp`, `research.method` | Whether Seenry MCP was used and which tools |
| `research.references[]` | `{name, url, role, via, seen, measured, adopt, avoid, image}`; `role` is `leader` (chosen up front), `discovered` (surfaced by the open search) or `inspiration` (outside the category) |
| `research.patterns` | `{tableStakes[], edge[], opening[]}`: what everyone does, what only the best do, the gap this design takes |
| `exploration.axes[]`, `exploration.variants[]` | Axes varied; `{name, image, verdict: "chosen"|"rejected", why}` per variant |
| `color` | `{why, source, swatches[], contrast[]}`; `--palette HEX` fills swatches and measured contrast from `palette.py` |
| `type` | `{family, source, why, css, cssUrl, scale[{role, size, weight, tracking, sample}]}` |
| `anatomy[]` | `{component, image, spec{Grid, Areas, Gaps, Keylines, Type, Color, States}}`; image from `anatomy.mjs` |
| `guidelines[]` | `{area, rule, do, dont, doImage, dontImage}`: rules for future work, each with a do and a don't |
| `verification` | `{checks[{name, result, pass}], notVerified[]}` from the page audit, contrast, interactions and devices |

## Writing it well

- **Why before what.** Each decision names the alternative it beat and the evidence (a reference, a measurement, an audit result).
- **Research is honest.** Say whether MCP was available. List companies that were actually inspected at real pixels, what was measured, and what was deliberately not taken.
- **Discovered companies matter.** The open search nearly always turns up a product you did not know; record it as `discovered` even when you adopted nothing from it.
- **Guidelines are testable.** "Only the recommended plan gets the filled button" can be checked; "keep it clean" cannot. Write 4–8, covering layout, color, type, imagery or icons, content and motion where they apply.
- **Reference images.** In a private sheet, thumbnails of inspected references are useful research records. Strip third-party screenshots before publishing a sheet or committing it to a public repository; keep the links and notes.
