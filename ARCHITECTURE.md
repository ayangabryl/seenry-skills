# Seenry architecture

## Design on a canvas, then build

Generated interfaces converge on whatever the current model does by default. A list of banned tells moves the agent to the next default, and a model critic scoring its own family's work rewards the same default. Studios avoid this by deciding structure early, with a person, on cheap artefacts.

So Seenry 2 puts a person at the decision points instead of a scoring loop. Every screen of a new product is designed first as live HTML on a local canvas (`seenry-canvas`), reviewed flow by flow, with options only where the structure is a real decision. Each option composes principles from several real references, with their numbers, around the product's own idea; copying one reference's structure is reserved for replication. A reference turned into a vague description drifts back to the model's average, and one copied whole is a reskin. The look is picked once, as a token file every screen links. The build happens once and is checked once against the approved screens.

## Skills

- `seenry` owns the flow and the routing. It is short and names the one file each step needs.
- `seenry-identity` owns type and color: the idea, specimens, color studies, and fonts fetched with their licenses by `identity.mjs`.
- `seenry-canvas` owns the canvas: a folder of HTML screens served by one dependency-free Node script, and the person's feedback.
- `seenry-craft` owns exact values: type, spacing, radius, surfaces, color roles, icons, states. Adapted in part from Jakub Krehel's and Emil Kowalski's MIT-licensed skills.
- `seenry-motion` owns behavior over time and ships runnable, tested motion assets, including fluid gesture guidance adapted from Emil Kowalski's Apple design skill.
- `seenry-review` owns judgment of existing screens and diffs, including a strict motion standard.
- `seenry-break` owns worst-case data: the catalog, the toggle and the report of what broke.
- `seenry-subtract` owns removal: motion and decoration that cannot defend themselves. It never adds.
- `seenry-audit` owns whole-app surveys and the self-contained plans that let a cheaper model execute the fixes.

Each of these does one job per run, the way Emil Kowalski's skills do, so the agent's attention goes to that job instead of a long pipeline.
- `seenry-assets` owns material and provenance.
- `seenry-apps` owns native mobile screens and flows, designed on the same canvas.
- `seenry-video` directs and renders product films as code.

## Keeping tokens down

Each rule has one home. `seenry` links to a reference only at the step that needs it, and a new product needs the flow, the canvas, the craft values and at most two references per open decision. Wireframes are short HTML in a shared kit, so early rounds cost little.

## Evidence

Seenry MCP is optional. When connected, the agent finds real screens for each open decision and measures their type and spacing. Without it, the person's links, live captures with `bar.mjs`, and the bundled benchmarks. A screenshot proves one state at one width; motion and interaction need a recording or a live check.
