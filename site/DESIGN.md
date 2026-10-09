# Seenry Skills site

Audience: developers and designers who use coding agents. Job: in under a minute, see what installing Seenry changes about an agent's output, believe it, and copy the install command.

## October 2026 redesign (v5)

Customers called the previous version a copy of jakub.kr/skills: a narrow column, "/name" headings with hairlines, a small title over an install box, a before/after card. v5 takes its identity from Seenry itself (seenry.design: a large centred Open Runde headline, white canvas, a charcoal pill) and makes the visitor's own kind of sentence the headline.

Sequence:

1. Hero: the prompt as the display headline ("make a website for my neighborhood bakery", lowercase, with a caret), the line "Teach your coding agent good design." and how the comparison was made, the install command as one pill with a charcoal Copy button, then both pages it produced, side by side at 1280px: no skill and with Seenry (skill only, no MCP), Claude Sonnet 5.5. Choosing another prompt retypes the headline and wipes both pages in; hovering a page scrolls it to its footer; Open live opens either page running.
2. Motion with a reason: heading and explanation on the left, the seenry-motion cart line on the right.
3. Eight skills, one install: heading on the left, every skill with what it does on the right.
4. Questions: one column under its heading.
5. Same prompt. Better design.: the install pill again, centred.

Sources: `~/Developer/seenry-bench-vibe` runs built with `runcc.sh` (Claude Sonnet 5.5, `--plugin-dir` per condition): `plain-s1` (an empty plugin, so no skill) against `seenry32-s1` (Seenry only, no MCP key) for `h3-a-bakery`, `a-photographer` and `a-habit`. Full-page captures were retaken from the hosted pages with every image loaded and exported to `public/work/` as WebP; the six pages are copied to `public/live/<slug>/` by `bundle_live.py` with only the files they reference, a `noindex` meta and a note that appears only when a page is opened outside the viewer.

### References (Seenry MCP, research_design_brief, 2026-10-09)

- Cursor home (09f04a7e0a7c4bb1951aa6b8cbaa42e8). Proves that each section can be carried by one real product artifact at near real scale with a quiet text column. Adapted: one artifact per section, a heading that runs into a quieter second sentence. Rejected: painted backdrops and warm paper canvas.
- RunInfra benchmarks (f4dad528f32341519823fece8e76a2c3). Informed the earlier benchmark chart; no longer used since the page dropped the benchmark.
- Measured across the survey: section headlines 40 to 48px, body 18 to 20px, control radius at most 10 or a full pill. Unverified: how either reference behaves on hover or at phone width beyond the captures.

### Exploration

v5: five ideas in `.seenry/idea.md`; three first screens ranked blind with `pick.mjs`: the prompt as the headline 8, one frame with a No skill / Seenry switch 7, a split frame with a drag handle 6. Earlier versions (a benchmark-led page, a live gallery, the skill-doc form) are in the git history.

## Brand guidelines

- **Idea:** the visitor's own sentence, and what the agent built from it with and without Seenry.
- **Type:** Open Runde (OFL, self-hosted). 400 for reading, 500 for labels, controls, the headline and section headings; 700 only in the wordmark. Headline 66px at -0.05em (36px on phones), section headings 40px at -0.04em, subhead 19px, body 16 to 18px; nothing readable under 15px. Commands and skill names in the system monospace; the headline prompt stays in Open Runde.
- **Palette:** equal-channel neutrals only, as on seenry.design. Canvas `#ffffff`, panel `#f3f3f3`, action `#242424`, text `#171717` / `#555555` / `#6b6b6b`, hairline 8% black. Colour comes only from the agents' output.
- **Layout:** a centred hero; the comparison at 1280px; later sections at 1200px as a 5:7 split, heading left and content right. 168px between sections.
- **Radius:** install command and buttons full pills; comparison frames 20px; demo panel 24px holding a 16px cart line; viewer 20px.
- **Controls:** one pill toggle for every before/after and device switch; underline tabs only for choosing a comparison.
- **Motion:** indicators travel 180ms on the enter curve; a new comparison or site wipes in with clip-path from the side of the chosen control (420ms and 480ms), and a site wipes only once it has loaded; the viewer's clip grows out of the rectangle that opened it and shrinks back into it from wherever it is (340ms in, 220ms out), never scaling its content, and mounts the site after the flight over a still capture; copy label 70ms out, 100 to 140ms in; the counter rolls changed digits in 420ms. No image crossfades. Reduced motion removes all of it. Full table in `.seenry/motion.md`.
- **Owned detail:** the prompt as the headline, lowercase and unedited, with a caret; it retypes when you choose another.
- **Rules:** a demo is real output or a real run artifact, never an authored mock; every number carries its method nearby; no eyebrows, numbered steps or dots before text; a skill without real output gets a sentence, not a fake demo.

The /motion library page is unchanged and still uses `reading-site.css`, which the home page also loads for its base styles.
