# Fieldwork skill-assisted run

## Run identity

- Model: GPT-5.6 Sol
- Skill used: `/Users/ayangabryl/.codex/skills/seenry/SKILL.md`
- Intent: create
- Output: standalone `index.html` with embedded CSS and JavaScript; no runtime dependencies
- Local font inputs: `/fonts/OpenRunde-Regular.woff2` and `/fonts/OpenRunde-Semibold.woff2`

## Exact brief

> Build a polished responsive website for Fieldwork, a fictional independent architecture studio in Lisbon. Audience: homeowners considering a renovation. Content: studio name Fieldwork; headline 'Homes shaped around everyday life.'; services residential renovation, interiors, feasibility studies; projects Courtyard House (Lisbon, 2024), Hill Apartment (Porto, 2025), Garden Room (Cascais, 2025); process Listen, Design, Build; contact hello@fieldwork.example. Main action 'Discuss a project' should open an accessible local inquiry form with name, email, project description, validation, cancel/Escape and a clearly marked demo success (no message sent). Include project filtering between All, Houses and Interiors. No fabricated awards, testimonials, stats or real client claims. Use original CSS/SVG architectural illustrations, not external photos. Include purposeful transitions, reduced-motion support and keyboard accessibility.

## Design process and evidence

1. Recorded audience, task, supplied truth, constraints, states and the opening's job in `DESIGN.md` before product implementation.
2. Inspected the public home page of [common ground](https://www.common-ground.studio/) on 2026-09-23 at approximately 1265×744. The observed transferable relationship was a quiet identity and generous field giving architectural material visual priority, followed by staggered image scale. The adaptation uses original plan/section SVGs, fired-clay action color and compact domestic annotations. Source assets and exact composition were not reused.
3. Built three structural hypotheses with identical facts in `evidence/wireframes.html`: Inhabited plan, Renovation ledger and Day through the house. Selected Inhabited plan because it places the supplied promise before project proof, supports the required filter naturally and avoids inventing a client lifestyle story.
4. Finished the opening first with real copy and the largest original SVG, then carried its canvas, ink, clay, sage, rule, typography and annotation relationships through projects, services, process, contact and inquiry states.
5. Added a complete interaction plan: fixed filter triggers with restrained enter/exit feedback; native modal containment; inline validation; Cancel and Escape; focus return; explicit demo success; and reduced-motion equivalents.
6. Performed the final visual and behavioral review at the required direct URL without inspecting the comparison baseline or main-showcase source.

## Tests performed

- Direct URL: `http://127.0.0.1:8873/demos/sol-comparison/with-skill/index.html` returned HTTP 200 and byte-matched the authored file.
- Desktop visual inspection at the default in-app Chromium viewport after local fonts and entrance transitions settled.
- Mobile visual inspection with a 390×844 viewport override; the document reported a 375px client width with no horizontal overflow (`scrollWidth === clientWidth`). The opening and project section were inspected separately.
- Project filter: selecting Interiors produced one visible project, Hill Apartment, updated the pressed state and announced “1 project shown.”
- Form validation: an empty submission produced three field-specific messages and focused the first invalid field.
- Demo success: valid name, email and a description longer than 12 characters produced “Demo complete” and explicitly stated that no message was sent and no details were saved.
- Dialog recovery: Escape closed the dialog after partial input and returned focus to the “Discuss a project” trigger. Cancel uses the same close path.
- Reduced motion: browser emulation matched `prefers-reduced-motion: reduce`; heading and drawing animation durations computed to `0.001ms`, and document scrolling computed to `auto`.
- Font check: `document.fonts.status` returned `loaded`, `document.fonts.check('16px "Open Runde"')` returned true, and body computed to Open Runde.
- Console check: no warning or error was attributed to the localhost document. Earlier warnings retained by the reused tab were from the separate public Squarespace reference.

## Limitations

- The project artwork is original conceptual SVG illustration, not documentary photography or evidence of built client work.
- Review used the in-app Chromium browser at desktop and emulated mobile sizes. Physical devices, Safari/Firefox, a screen reader and assistive-technology speech output were not tested.
- The inquiry is deliberately local and does not persist or transmit data.
- The public reference review covered its opening and a later image sequence, not every page or interaction.
- This independent run makes no claim of superiority over any baseline.
