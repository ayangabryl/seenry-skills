# Fieldwork baseline

- Model: GPT-5.6 Sol
- Skill use: none
- Deliverable: standalone `index.html` with inline CSS, JavaScript and original SVG artwork; no external dependencies

## Exact brief

> Build a polished responsive website for Fieldwork, a fictional independent architecture studio in Lisbon. Audience: homeowners considering a renovation. Content: studio name Fieldwork; headline 'Homes shaped around everyday life.'; services residential renovation, interiors, feasibility studies; projects Courtyard House (Lisbon, 2024), Hill Apartment (Porto, 2025), Garden Room (Cascais, 2025); process Listen, Design, Build; contact hello@fieldwork.example. Main action 'Discuss a project' should open an accessible local inquiry form with name, email, project description, validation, cancel/Escape and a clearly marked demo success (no message sent). Include project filtering between All, Houses and Interiors. No fabricated awards, testimonials, stats or real client claims. Use original CSS/SVG architectural illustrations, not external photos. Include purposeful transitions, reduced-motion support and keyboard accessibility.

## Steps

1. Created a responsive editorial layout tailored to a small residential architecture practice.
2. Drew an original architectural panorama and three project illustrations as inline SVG.
3. Added accessible project filters and an inquiry dialog with native focus handling, Escape support, validation and an explicit demo-only success state.
4. Added responsive layouts, hover/focus states, restrained transitions and a reduced-motion override.

## Tests

- Checked the HTML structure and required content with automated local assertions.
- Opened the isolated page directly at `http://127.0.0.1:8873/demos/sol-comparison/baseline/index.html` and inspected desktop and 390 × 844 responsive layouts.
- Exercised project filters and the inquiry form, including invalid submission, valid demo submission, cancel and Escape.
- Confirmed that the page contains no remote assets or runtime dependencies.

## Limitations

- This is a static demonstration. The inquiry form intentionally does not transmit or retain data.
- Project imagery is conceptual SVG artwork for the fictional studio, rather than documentary photography.
- Under the current development server, the trailing-slash path falls through to the host app; the explicit `index.html` URL serves this isolated baseline correctly.
