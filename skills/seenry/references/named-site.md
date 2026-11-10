# A named site in the request

"Design it like lue.studio", "like Linear", "based on X", "inspired by X", "replicate X": the person wants to see that site in the result, wearing their brand. A one-line prompt asks for the same result as a long, careful one, so do all of this without being told.

## The steps

1. **Pull the whole site.** In Seenry: `list_sites` with its domain, then every captured page top to bottom, every section, every recording (`get_page_motion`) and its DESIGN.md, with notes per page in `.seenry/refs/<site>.md`. If it is missing, capture the live site with `bar.mjs`.
2. **Measure before you design.** On the live page at 1440 and 390, measure the header in each state (over the hero and after scrolling: distance from the top, side padding, each control's position, size and gap), the hero type stack and scale, content widths and section order. Write the numbers into DESIGN.md and build to them. Eyeballed headers are the most common miss.
3. **Map its patterns.** Write `.seenry/refs/patterns.md`, starting with a line `Reference: https://<the site>`, then its five to seven recognizable patterns (layout moves, type treatment, image medium and color mood in every state, signature components, motion), each with how this brand wears it.
4. **Take its motion from the recordings.** Entrance order and timing, scroll choreography, the signature interaction, and the move between header states: a glide, never a jump.
5. **Check every state it has.** Each time of day, theme or variant at its extremes, hover, the scrolled header and phone, side by side with the site.

## How close

| Wording | Keep |
| --- | --- |
| "replicate", "clone", "like", "design it like", "based on" | Layout, type treatment, motion and interactions, as close as measured |
| "inspired by" | The family stays recognizable; the composition changes more |

Either way, never use its logo, name, copy, images or paid fonts. Use the brand's own name, copy and artwork in the site's image medium, and the nearest free fonts.

## What changes in the flow

- **The reference is the anchor for every option.** All options on the canvas stay inside its family; they differ in how this brand wears it.
- **Its words are not yours.** Write every line in the brand's own voice. Never reuse a run of five or more of the site's words.
- **Each state keeps the reference's light.** If the site's night stays luminous, yours does too.
- **Compare side by side before showing.** Put screenshots of the site in `.seenry/canvas/refs/` next to your screens, state by state, and list in the report every recognizable element you did not carry.
