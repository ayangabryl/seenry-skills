# Northline — fresh Seenry consumer trial

Build a one-page, original, working product-marketing prototype for **Northline**, a fictional planning tool for small-boat skippers deciding whether and when to leave a harbor. The product is a forecast decision surface, not a travel magazine. Use plain HTML/CSS/JS unless the task truly needs a framework. Serve it locally and capture rendered evidence.

## Visitor and decision
A skipper with a short morning window wants to compare three harbors and decide if the sample conditions make a trip worth considering. The first viewport must expose useful forecast material and the way to compare it. Do not lead with a long brand manifesto.

## Supplied sample data
All values are illustrative, not live forecasts. Label the sample clearly. Local time, Tuesday 29 September.

- North Pier: best window 06:00–09:30; wind 8–11 kn NW; swell 0.6 m; high tide 08:42; return by 10:15; status: Favorable.
- Outer Point: best window 07:15–09:00; wind 12–16 kn W; swell 1.1 m; high tide 08:36; return by 09:45; status: Caution.
- South Reach: best window 06:30–10:30; wind 6–9 kn N; swell 0.4 m; high tide 08:55; return by 11:15; status: Favorable.

A real forecast includes uncertainty and should not imply a trip is safe. Include one concise caveat near the data: “Illustrative conditions. Check an official forecast and local advice before departure.” Do not fabricate a live feed, customer logos, testimonials, pricing, or reliability claims.

## Functional scope
- Harbor switch changes the visible window, wind, swell, tide, return time, and status. It must work with pointer and keyboard and tolerate rapid reversal.
- “Open sample forecast” scrolls or opens a real same-page detailed view, not a dead button.
- The forecast display can include an original time/tide/wind diagram if it helps the decision. Its labels and values must remain legible at 390 and 320 px.
- Respect reduced motion. No motion may hide or delay authoritative values.

## Design bar
Precise marine instrument with a human, calm tone. Give the forecast the visual authority. Avoid the generic editorial opening: small category eyebrow over a giant soft-serif headline, italic accent phrase, atmospheric blue gradient blobs, and cards that only decorate. Use a distinctive but functional type relationship, clear alignment owners, real density, and purposeful feedback. The output should feel designed as a product by a strong design-engineering team.

Study actual Seenry visual evidence as research. Two inspected candidates are Better Stack enterprise page `010273f5e0214f7fb2d9b46cf92afa14` (product proof beside its proposition, captured without warnings) and Weather OS `1a8e0311d2ac480dac7f8644f5d237e3` (controls over a responsive scene, but the pinned composition requires review). These are not design templates; identify what is relevant and what is unsuitable. You may find a better second reference using Seenry MCP. If media is unavailable, state the limitation.

## Trial checkpoints
Read the current Seenry core at `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/SKILL.md`, choose one primary track, and open specialist guidance only as needed. Record ROUTE.md and DESIGN.md. Name the decisive visual decision and make two genuinely different, rendered early studies at 1440 and 390 px. Preserve both and choose a direction. Build the first complete page and capture 1440 and 390 full-page images as `first-wide.png` and `first-narrow.png`. **Stop at that first-complete-render checkpoint before repairing it**, and report how to run the page. This pause is for evaluating first-pass prevention, not a design handoff. Do not give the first render a self-declared passing grade.
