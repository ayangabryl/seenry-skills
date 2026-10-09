# Seenry Skills site

Audience: developers and designers who use coding agents. Job: in under a minute, see what installing Seenry changes about an agent's output, believe it, and copy the install command.

## October 2026 redesign

The previous page gave each skill a tabbed playground of authored demos under a lettering toy. Visitors could not tell what the agent does. The page is now a skill page in the convention set by emilkowal.ski/skill and jakub.kr/skills (inspected 2026-10-09): a narrow document, the install command first, one section per skill named like the command, and a demo of what that skill changes. Seenry's difference is that every demo is real agent output or a real artifact from a run, not an authored mini component.

Sequence (simplified 2026-10-09 at the owner's request: no benchmark, no gallery, no process tour; just the skill and what it changes):

1. Intro: "/skills", one sentence on what the skills make the agent do, the install command with copy, GitHub and Seenry MCP.
2. /seenry: the same one-line prompt built by Claude Sonnet 5.5 without a skill and with Seenry (skill only, no MCP): bakery, photographer, habit tracker. Both full desktop pages sit side by side (stacked on phones); hovering a page scrolls through it and leaving returns it to the top (tap on touch screens). Open live opens either page running, in a viewer whose clip grows out of the frame.
3. /seenry-motion: a cart line whose total uses the skill's number transition, Before / With seenry-motion.
4. /more-skills: seenry-review, seenry-assets, seenry-branding, seenry-apps, seenry-decks, seenry-video, each with what it outputs.
5. /faq.

Sources: `~/Developer/seenry-bench-vibe` runs built with `runcc.sh` (Claude Sonnet 5.5, `--plugin-dir` per condition): `plain-s1` (an empty plugin, so no skill; built 2026-10-09 for this page) against `seenry32-s1` (Seenry only, no MCP key) for `h3-a-bakery`, `a-photographer` and `a-habit`. Captures are exported to `public/work/` as WebP; the six pages are copied to `public/live/<slug>/` by `bundle_live.py` with only the files they reference, a `noindex` meta and a note that appears only when a page is opened outside the viewer. Nothing else in them is changed.

### References (Seenry MCP, research_design_brief, 2026-10-09)

- Cursor home (09f04a7e0a7c4bb1951aa6b8cbaa42e8). Proves that each section can be carried by one real product artifact at near real scale with a quiet text column. Adapted: one artifact per section, a heading that runs into a quieter second sentence. Rejected: painted backdrops and warm paper canvas.
- RunInfra benchmarks (f4dad528f32341519823fece8e76a2c3). Informed the earlier benchmark chart; no longer used since the page dropped the benchmark.
- Measured across the survey: section headlines 40 to 48px, body 18 to 20px, control radius at most 10 or a full pill. Unverified: how either reference behaves on hover or at phone width beyond the captures.

### Exploration

Earlier versions led with a blind benchmark, a gallery of ten live sites and a tour of the build loop. Blind picks favoured the actual-size comparison (8 against 7 and 6), and the owner asked for the page to be as direct as Emil Kowalski's and Jakub Krehel's skill pages, so the comparison is now the whole demo for the core skill.

## Brand guidelines

- **Idea:** a skill page that shows each skill by what it changes, in the documentation form developers expect from skills.
- **Type:** Open Runde (OFL, self-hosted). 400 for reading, 500 for emphasis and labels, 600 for the page and section names; 700 only in the wordmark. Page name 28px, section names 18px with a grey slash and a hairline, leads 18px at 1.65, notes 16px; nothing readable under 15px. Prompts, commands and skill names in the system monospace.
- **Palette:** equal-channel neutrals only. Canvas `#fafafa`, panel `#f2f2f2`, surface `#ffffff`, text `#1c1c1c` / `#4d4d4d` / `#6b6b6b`, slash `#9a9a9a`, hairline 8% black. Colour comes only from the agents' output.
- **Layout:** a 720px reading column; the motion demo breaks out to 1040px and the actual-size comparison to 1280px. 128px between sections.
- **Radius:** demo cards 22px holding 16px stages at a 6px inset; captures 10 to 12px; install card 18px with 14px rows; toggles full pills; viewer 20px. Cards carry a 7% ring; only the viewer has a shadow.
- **Controls:** one pill toggle for every before/after and device switch; underline tabs only for choosing a comparison.
- **Motion:** indicators travel 180ms on the enter curve; a new comparison or site wipes in with clip-path from the side of the chosen control (420ms and 480ms), and a site wipes only once it has loaded; the viewer's clip grows out of the rectangle that opened it and shrinks back into it from wherever it is (340ms in, 220ms out), never scaling its content, and mounts the site after the flight over a still capture; copy label 70ms out, 100 to 140ms in; the counter rolls changed digits in 420ms. No image crossfades. Reduced motion removes all of it. Full table in `.seenry/motion.md`.
- **Owned detail:** the prompt, lowercase and unedited after a grey caret, above every piece of output.
- **Rules:** a demo is real output or a real run artifact, never an authored mock; every number carries its method nearby; no eyebrows, numbered steps or dots before text; a skill without real output gets a sentence, not a fake demo.

The /motion library page is unchanged and still uses `reading-site.css`, which the home page also loads for its base styles.
