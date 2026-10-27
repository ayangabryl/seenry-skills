# A named site in the request

"Design it like lue.studio", "like Linear", "based on X", "inspired by X", "replicate X": the person wants to see that site in the result, wearing their brand. A one-line prompt asks for the same result as a long, careful one, so do all of this without being told.

## The steps

1. **Pull the site.** In Seenry: `list_sites` with its domain, then its pages, recordings (`get_page_motion`) and DESIGN.md. If it is missing, capture the live site with `bar.mjs`. Look at every page you will mirror, not only the hero.
2. **Measure before you design.** On the live page at 1440 and 390, measure the header in each state (over the hero and after scrolling: distance from the top, side padding, each control's position, size and gap), the hero type stack and scale, content widths and section order. Write the numbers into DESIGN.md and build to them. Eyeballed headers are the most common miss.
3. **Map its patterns.** Write `.seenry/refs/patterns.md`, starting with a line `Reference: https://<the site>` so the gate can film it beside yours: its five to seven recognizable patterns (layout moves, type treatment, image medium and color mood in every state, signature components, motion), each with how this brand wears it.
4. **Take its motion from the recordings.** Entrance order and timing, scroll choreography, the signature interaction, and the move between header states: a glide, never a jump.
5. **Check every state it has.** Each time of day, theme or variant at its extremes, hover, the scrolled header and phone, side by side with the site. The gate does the scroll part for you: it films both pages at the same points and the critic compares each pair.

## How close

| Wording | Keep |
| --- | --- |
| "replicate", "clone", "like", "design it like", "based on" | Layout, type treatment, motion and interactions, as close as measured |
| "inspired by" | The family stays recognizable; the composition changes more |

Either way, never use its logo, name, copy, images or paid fonts. Use the brand's own name, copy and artwork in the site's image medium, and the nearest free fonts.

## Resemblance is the score

- **A named-site page passes at reference fit 8, and its overall score is capped at its reference fit.** Polish rounds therefore work on resemblance first: a page cannot score well by drifting toward a generic look.
- **The critic checks the site itself, not only your pattern map.** It lists every recognizable element of the reference the page lacks or carries worse (the hero object and how type and imagery layer, the color and light in each state, the header, the section moves, the signature components) and puts them first in its fixes.
- **Closeness is never marked down** for "like", "design it like", "based on" and "replicate". What keeps it from being a copy is the brand's own name, copy and artwork, and never reusing the site's words, logo or images.
- **Each state keeps the reference's light.** If the site's night stays luminous, yours does too; a state that turns darker or greyer than the reference's is a missing signature.

## What changes in the flow

- **The reference is the identity.** Skip the three identity boards and `pick.mjs`; `check.mjs` accepts `patterns.md` in their place. Still write `identity.md`: the brand's own idea lives in its name, copy, artwork and one signature detail.
- **Every judge reads the pattern map.** The critic, the detail critic, the motion critic and the photo check are all told which patterns, image medium and motion were asked for, so none of them marks the reference's own choices down.
- **Its words are not yours.** `check.mjs` compares the page's text with the named site and blocks any run of five or more shared words. Write every line in the brand's own voice.
- **Allowed patterns.** If the site itself uses something the board normally blocks, list those keys on one line in `patterns.md`: `Allow: numbered, italicAccent`. When the board blocks something the site does on purpose, it prints the key to add. Craft checks (clipped text, type on images, small or faint text, missing fonts, fixed overlays, phone hero) can never be allowed.
