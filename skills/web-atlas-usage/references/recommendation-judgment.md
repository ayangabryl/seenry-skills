# Recommend a design direction

Use this playbook for subjective selection (“premium,” “best,” “beautiful”) or a request for an original interaction. MCP tools retrieve published evidence. The connected agent interprets the brief, inspects candidates and makes the recommendation; the server does not run an aesthetic-ranking or visual-similarity model.

## Interpret quality in context

Use the product, audience, desired feeling, existing brand, platform and input methods in the conversation. If details are absent, state a useful working assumption and proceed. Ask only when the missing detail would materially change the direction. “Premium” might mean precise product communication, expressive art direction or playful responsiveness; it is not a universal visual style.

## Retrieve useful candidates

Search the structural need first. Do not pass the entire brief or the word “premium” as a substitute for selection. Discover real facet values rather than inventing tags.

| Request | Starting evidence | What to compare after inspection |
| --- | --- | --- |
| Premium hero | `search_sections(element="Hero")`; follow each item's detail tool | Headline hierarchy, product/media evidence, action clarity, composition, mobile crop and loading behavior where visible |
| Premium 404 | `search_references(page_type="404")`; screenshot, then recording where available | A clear error message, useful recovery, brand character and any optional interaction |
| Interactive hero or 404 | Relevant page/section plus `get_page_motion`; motion-filtered page search can help | Actual trigger, transition, settled state, input response and whether content/recovery remains available |
| A new component interaction | `get_design_taxonomy`, then `search_designs(family="motion",component=...)` and actual video | State continuity, feedback, interruption, content fit and transferable motion principles |

Use a small, varied shortlist. Prefer different design approaches over many near-identical templates or only famous brands. Sparse tags are a reason to broaden a query, not evidence that useful interactions are absent. Expand only if a material design question remains unanswered. Curator ratings can order discovery but should not override a better fit observed in another candidate. A recording filter can find captured motion; its absence does not prove a site is static.

## Inspect before choosing

Open the actual relevant image segments or video, using the client's available media tools. Read capture warnings and dates. A loader, obstructing modal or truncated clip cannot establish the hidden design. An incomplete footer need not invalidate a fully visible hero. Scope each conclusion to the region and state actually inspected. A static 404 can inform composition without establishing an interaction or functional recovery link.

Compare candidates on the aspects that matter to this brief:

- **Fit:** audience, content, brand, platform and the user's intended action.
- **Craft:** hierarchy, type, spacing, composition, imagery and state consistency visible in the evidence.
- **Behavior:** clarity, continuity, responsiveness and recovery; mark keyboard, touch, interruption and reduced-motion behavior unknown when not demonstrated.
- **Feasibility:** likely implementation and performance tradeoffs in the user's project. Verify these in a prototype rather than claiming a source video proves performance.
- **Evidence:** relevant coverage, capture freshness and the difference between observed pixels, declared tokens and inferred roles.

Recommend a direction with specific reasons and tradeoffs. Do not invent numerical beauty/confidence scores, conversion uplift or universal rankings. Missing evidence is unknown, not a quality failure. If no credible reference fits, say what is missing and offer a clearly labeled proposed direction instead of presenting a weak match as the best design.

## Create something new

When novelty is requested, abstract useful principles from inspected references rather than copying their exact composition or choreography. For example, a proposed 404 could combine pointer-responsive illustration with a persistent recovery action; whether it suits the user's brand still needs judgment. This example is a concept, not a claim about an item in the library.

Consider distinct concepts when the brief warrants exploration, select one against the brief, and separate **observed** behavior from **proposed** behavior. Specify the initial state, trigger, transition, outcome and interruption. For implementation requests, build and inspect a focused prototype, including the relevant input methods, rapid retriggering, resizing and reduced motion. Keep hero actions and 404 recovery usable throughout. Do not claim global originality or completed testing without evidence.

## Return an actionable recommendation

Keep the answer proportional to the request: name the chosen direction, link the reference and original source, identify the observed detail or clip interval, explain why it fits, and say how to adapt it. Include the most relevant limitation and an alternative only when it helps a decision. Avoid dumping a long search list. Continue the build if that is what the user asked for.
