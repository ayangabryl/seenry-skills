# Research notes

Clean-room implementation: no website or library implementation code was opened. Seenry product/motion token files were read as required; this component is original.

The Seenry MCP research pack contains 53 references, its contact sheet and source metadata in `.seenry/research`. Direct research used `search_sections`, `search_curated_references`, `search_designs` (motion) and `get_page_motion`. Curated editorial search returned no matches; the broader pack supplied the alternatives.

- **Mercury, security page**, https://mercury.com/security — Seenry capture `04a312264dc14cd4bdfdb89a53729226`. Took calm horizontal composition, quiet metadata and circular security symbols. Left behind the large illustration, gradient and brand identity. Inspected the recording poster and retrieved the action evidence; not a source for exact animation timing.
- **Yousuf, editorial portfolio**, https://seenry.design/design/a7d7a36ebd149a8c6878a729989b0be3 — inspected the poster and decoded frames at 5, 8, 11, 14 seconds. Took the rhythm between serif text and compact objects, and generous surrounding space. Left behind the chrome mascot and asymmetric small text. Frames show the object persisting between text sections; our word-inking is a proposed treatment from the brief, not a claimed reconstruction.
- **Nori / Lazar Filipović**, https://seenry.design/design/30d17427ef6b3166abfaed103ee30f88 — inspected the poster and frames at 10, 15, 20, 25 seconds. Took strong type scale and contrast between pale and dark surfaces. Left behind saturated blue, large all-caps type, floating window framing and numeric section labels. Motion evidence establishes section progression, not precise CSS curves or interruptibility.

Discovered in the broader pack: André Cândido's editorial headline, Anuc Home's architectural spacing and Atoll's strong typographic hierarchy. None of their assets are used in the gallery.

## Requirements resolved

15–20% text opacity and 4.5:1 contrast cannot coexist on the same surface. The default `--statement-faint: .64` preserves readable starting ink. Integrators can lower it, but must recheck contrast. Buttons stay full opacity and size, so focus and touch target size do not depend on scroll position.

A focusable button cannot live inside an `aria-hidden` visual wrapper. Each word and decorative object is hidden individually, leaving the original real button accessible in its exact inline position. A sibling visually hidden paragraph contains the complete sentence once. Optional `data-object-label` adds meaningful object descriptions to that sentence. The MutationObserver keeps it synchronized after copy edits.

Three illustrative seals are fictional; they imply no real government affiliation. The waveform is a decorative music motif, not an audio meter or evidence of playback. The finance action intentionally fails once to demonstrate retry.

## Review interpretation

The optical audit's moving-arrow and spinner centroid suggestions describe intentional asymmetry during animation, not displaced resting controls. The gallery wordmark uses mixed-size inline text on one baseline; the apparent two-line warning is not a visible wrap. Screenshot inspection confirmed those cases.

The second motion review scores 8/10 with no hard violations. It suggests reusing pending finance work, which the implementation already does by ignoring pending activations. The finance demo's first failure is intentional, not a rapid-click race. The default navigation always retains the same explicit `data-next` target. Native scroll is retained rather than replacing it with custom easing or scroll hijacking.

An exploratory critic run without the brief scored 7 and suggested removing the required seals and fingerprint and shrinking mobile text below the brief's range. That run is retained as `critic-unbriefed.json`; the final review uses BRIEF.md and its required objects and sizes.

Three image generations and photo reviews were completed. Both album images pass at 8/10. The portrait remains 6/10 in the independent photo review (final composition 8/10); it is retained after the skill's three-attempt limit, without claiming a photo-check pass. The final variant has the clearest crop for the required small inline face.

Final visual refinements: shortened civic/music/finance copy to concrete service descriptions; simplified civic seal linework; increased navigation and metadata to 16px on desktop; deepened gallery secondary text; raised paired specimen starting ink; used a left-aligned finance composition; added a 120ms delayed spinner reveal so instantly resolved work proceeds directly to confirmation without a loading flash. The component and gallery code are formatted, and the gallery-only CSS/JS sections are marked for easy removal.

## Final gate

`check.mjs` stopped after six gate rounds: four rounds synchronizing its photo-review gate and two scored visual rounds (7 → 7). Final motion: 8/10 with zero hard violations. The skill explicitly says “on STOP or STOPPED, ship the best-scoring round”; the final version ties the best score and retains the latest readability improvements. No visual score of 9 or all-images photo pass is claimed. The last motion critic preferred removing the spinner delay requested by the preceding critic; both revisions scored 8. The current brief delay is retained under the stop rule.
