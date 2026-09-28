# Spoke Works — first forward trial

## Brief and truth ledger

- Audience: people in Portland's inner east side considering a neighborhood bicycle repair.
- Object and decision: compare three services and prices, then choose one of four supplied sample times.
- Supplied facts: flat repair $24; brake adjustment $38; standard tune $95; Tuesday–Saturday 09:00–18:00; Thu 1 Oct 2026 at 10:30 or 15:00 and Fri 2 Oct 2026 at 09:30 or 14:00; service area is Portland's inner east side.
- Allowed fiction: the Spoke Works identity and original bicycle illustration. No street address, phone number, testimonials, availability beyond the four supplied demo slots, or booking backend was invented.
- Actual action: browser-only selection → review dialog → clearly labeled demo confirmation. The page does not store or transmit an appointment.
- Existing brand rules: none supplied.
- Rejected visible treatment: a full calendar or map before the user sees the service choice; the brief provides only four slots and a broad service area.

## Exact local files read

- `/Users/ayangabryl/Documents/Dev/AGENT.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/SKILL.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/product-craft.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/interaction-components.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/fact-action-integrity.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/mcp-discovery.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/mcp-output-evidence.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/references/layout-verification.md`
- `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/scripts/browser_evidence.mjs` (browser adapter inspection only)

No earlier Seenry evaluations or other trial folders were read.

## Seenry MCP evidence

The live `get_library_guide` reported Seenry server 2.6.0 and skill package 2.1.0. Searches for bicycle repair and repair website captures returned no matches; a booking screen shortlist led to two inspected images:

1. `26594809c45b884800d053b60ea51281`, asset index 47, “Schedule Service” in FIXD OBD2 Scanner. The inspected image has a very large map between the vehicle label and the repair-shop choice. A location-permission error replaces the recommended shops. This is a useful negative example for a brief with a known service area and no real location lookup. No interaction or mobile behavior was inferred from the still.
2. `0146015cc21d7bf10112fdead3f80e02`, asset index 50, “Calendar Booking” in LooxUP. The inspected image puts a month grid above a separated “Add entry” action. This is a useful negative example here: four specified times can be shown together without a month-navigation step. No action outcome was inferred from the still.

The black Seenry pill at the top of each inspected capture is catalog provenance, not a visual feature of those products. No source assets or copy were used in the prototype.

## Direction studies

- Study A: service-first, quiet green repair ledger. Prices and choices precede the compact two-day schedule on a phone. Captures: `studies/a-1440.png`, `studies/a-390.png`.
- Study B: schedule-first, clay/orange display treatment. It brings times forward, but requires the visitor to pass the schedule before learning which repair is selected. Captures: `studies/b-1440.png`, `studies/b-390.png`.
- Chosen: A, because price/service comparison is the first meaningful choice and the four times remain visible as the next step.
- Direction study gate was not run. This trial was requested to stop after the first complete render and functional checks, before external critique or review-led repair. The direction therefore lacks independent gate clearance.

## Page structure and visual decisions

| Visitor question | Required content | Visual role | Next action | Evidence |
| --- | --- | --- | --- | --- |
| Is this for my area? | Portland inner east side | Hero kicker and location section | See repairs | Authored from brief |
| What can I get fixed and for how much? | Three service names/prices | Numbered price ledger | Choose in demo | Study A |
| When can I try a request? | Four exact sample slots | Two grouped day rows | Review | Brief, plus calendar-reference rejection |
| What did I choose? | Service, price, date/time | Persistent summary and modal review | Show demo confirmation | Authored task flow |
| Did I book? | Explicitly no | Distinct demo confirmation disclosure | Start another sample | Fact/action integrity |

Layout owners: `--max: 1440px`, `--gutter: clamp(20px, 5vw, 72px)`; every primary section and footer uses `.shell`. The landing sections use a two-column grid until tablet width, then stack. The selection card has one border owner; form and summary meet without duplicate gutters. Corners are square throughout the main page; the radio indicator and numbered step are circular by function. The artwork is an original inline SVG, not a sourced image.

## First complete result and checks

Source: `index.html`, `style.css`, `script.js`.

First full-page captures: `captures/first-1440.png`, `captures/first-390.png`, `captures/first-320.png`. Connected state captures: `captures/first-review-390.png`, `captures/first-confirmation-390.png`. The screenshots were rendered over HTTP from `http://127.0.0.1:8788/`.

`captures/interaction-results.json` records browser checks at 1440, 390, and 320 pixels. At each width, the review action starts disabled; selecting brake adjustment and Fri 2 Oct 14:00 updates the summary to the correct $38 price; review repeats the same details; Edit closes the dialog; the demo confirmation states no appointment was made; Start another sample resets the form. No page errors occurred and document width equaled viewport width at all three sizes. A keyboard path selected flat repair and Thu 1 Oct 10:30, opened review with Enter, and dismissed it with Escape. Reduced motion was enabled at 320px.

## Environment and limits

Node was available; Playwright was installed only in this temporary trial directory. The shell had no `chromium` or `playwright` executable on PATH, so automation launched the installed Google Chrome binary at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` via Playwright. The local HTTP server ran on port 8788. The checks were Chromium automation, not a screen reader or physical touch-device run. The Seenry independent review and typography critics were intentionally not called at this stopping point. No production booking endpoint exists, and the demo does not make a real appointment.
