# Spoke Works trial evidence

## Scope and files read

Isolated workspace: `/private/tmp/seenry-bicycle-fresh-after-route-20260929`. No Seenry skill repository files or production systems were edited.

Instruction and guidance files opened during this trial:

- `/Users/ayangabryl/Documents/Dev/AGENT.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/SKILL.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/product-craft.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/anti-defaults.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/fact-action-integrity.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/layout-verification.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/delivery-checks.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/without-mcp.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/evaluation.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/mcp-discovery.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry-typography/SKILL.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry-review/SKILL.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/scripts/browser_evidence.mjs`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/scripts/direction_study_gate.py` (opening section and CLI execution)
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/scripts/independent_review_gate.py` (CLI help and execution)

The initial batched guidance read was truncated in the tool output; later delivery and review files were read in full. The source scripts were used as tooling and not edited.

Seenry MCP calls: `get_library_guide`, `discover_references({q:"bicycle"})`, `search_references({q:"repair"})`, `get_design_reference` and `get_reference_asset` for Bike Time footer ID `82caaba46f4dd3d8b33fa8cbd01143bd`. The footer import was the only bicycle match. The asset call returned metadata and a URL, without inline pixels. No uninspected reference was claimed as visual evidence or copied into the site.

## Design and first complete snapshot

`DESIGN.md` records the brief, fact ledger, task, allowed fiction, geometry owners, two study directions and choice. Study A placed service and sample time choices early; study B put a large graphic before them. Both use the supplied service and time facts. The first study review returned **Revise** for character encoding and action grouping in A, and delayed task access in B; `evidence/direction-gate/summary.json` retains that verdict and input hashes. Corrected study captures `evidence/*-v2.png` passed the second direction gate with **Keep** in `evidence/direction-gate-v2/summary.json`. The rejected B study remains in `studies/b.html` and its corrected captures.

Before any critique of the complete page, `index.html`, `styles.css` and `app.js` were copied unchanged into `first-complete/`. Full-page and opening captures at 1440, 390 and 320 pixels are in the same folder, with `SHA256.txt` for those original files. The final source at the workspace root contains subsequent repairs. The complete page was served locally over HTTP at `http://127.0.0.1:8765/` for all captures and interaction checks.

## Browser interaction evidence

`verify.cjs` drove Chrome through the page at 1440, 390 and 320 pixels. `evidence/interaction-report.json` contains per-viewport results and text from the review and confirmation states. At each width: the review button starts disabled; choosing a service and time enables it; review shows the selected service, price and date/time; Edit retains the selections; keyboard Space changes service and slot; the confirmation displays the changed selection and says nothing was booked; Reset clears inputs and disables review. There were no page errors or document-width overflows. The 320px run used reduced motion. Captures of default, selected, review and confirmation states are in `evidence/final-captures/`. `evidence/final-captures/phone390-confirmation-same-selection.png` additionally shows direct continuity for flat repair at Thursday 10:30. `evidence/phone390-service-focus.png` shows the visible radio focus ring; the browser measured a 3px solid outline on the focused service row.

The first full-page independent review returned **Revise**: the orange buttons measured below 4.5:1 and selected time lacked a non-color cue (`evidence/full-review-first/summary.json`). The source was repaired with a darker orange and a persistent checkmark. The next review captured a transient CSS transition frame, making selected time appear low contrast (`evidence/full-review-final/summary.json`). The transition was removed and settled state recaptured. The final full-page review returned **Keep** in `evidence/full-review-final-v2/summary.json`.

Delivery scripts: `semantic_names.py index.html` found no generic named-element issues. `token_contrast.py index.html styles.css` flagged nested-surface approximations; direct opaque-pair checks showed primary white text on orange 5.293:1, muted summary label on paper 6.166:1, strip paragraph on dark green 8.796:1, and strip hours label on dark green 7.349:1. The displayed date weekdays were separately checked against the 2026 calendar.

## Limitations

This is a static local demo with no appointment endpoint. The page itself labels the flow and confirmation as a demo, and no network booking request is sent. Browser checks used desktop Chrome viewport emulation; no physical device or screen-reader session was run. The reference search did not yield inspectable bicycle-page pixels, so the visual direction is an authored hypothesis, not a reference match. Independent review is separate from user acceptance.
