# Production motion: measured from real products

Prepared 30 September 2026. **The replacement kit needs distinct clocks for feedback, surfaces, layout continuity and celebration.** A 120 ms icon, a 280 ms sheet and a 1 s particle removal solve different problems. Layer relationships matter as much as duration: preserve content attached to a moving surface; reveal new content while its container finishes; remove outgoing content before collapsing its space.

This is a frame-based research deliverable, not a component implementation. All downloaded media, extracted frames, evidence and scripts are local to this folder.

## Evidence and how to read the numbers

48 clips were downloaded immediately with `curl -A "Mozilla/5.0"`. The research began with Seenry `get_library_guide`, then `search_curated_references(family="motion", min_rating=4)` (zero results), specific `search_designs` queries, and `search_references(motion=true)` for preferred brands. `get_design_video` supplied imported clips; `get_page_motion` supplied website recordings. Search evidence, source registry, all ten-frame measurements, machine-readable samples, physical feature tracks.

**P** = imported recording attributed to a named product; **W** = recorded website; **D** = creator/library demonstration, not verified shipped behavior. A named product in a clip is not proof of its current implementation. The brief's target of 3–5 excellent *production* examples per family was not fully met: toast examples are library/creator demonstrations; several other families have mixed evidence. Each family below has 3–5 relevant references or explicitly limited comparisons. No missing production evidence is disguised as one.

Durations are **estimates of first visible movement → visual settle**, excluding pointer dwell and network wait. Unless stated otherwise allow ± one native frame at each endpoint (typically 17–42 ms; consult the manifest), and ±50 ms for a camera recording. A 60 fps extraction repeats lower-rate source frames; it is not a 60 fps measurement of the original interface. Only extracted stills/contact sequences were reviewed; normal-speed playback and controlled interruption testing were unavailable. “No visible stagger” means less than the observable cadence, not proof of zero delay.

Each reference links to source metadata and a 10-frame strip through the registry; each table links directly to the measured strip. The measurement ledger provides ten actual timestamps and numeric endpoint-appearance samples per window. Those image projections are **not recovered CSS opacity**. Physical distances, scale and curve character below are visual estimates, relative to an element’s own height `H`, width `W`, row pitch `R`, or glyph height `G`; they avoid mistaking encoded pixels for CSS pixels. Exact cubic coefficients, spring constants and hidden layers cannot be identified from these recordings. Where translation, camera movement, particles or clipping prevent a defensible property curve, that limitation is stated rather than inventing one. Thus full physical 8–12-point curves for every reference remain an evidence gap; the actual sample images are retained for further tracking.

**Observed interruption:** none of these passive captures establishes repeated open/close retargeting. Dragging is visible in the reorder clip, but it does not establish spring velocity preservation. “Unknown” applies to every reference unless explicitly qualified. All interruption behavior in the production specs is a proposed requirement.

## 1. Menu / dropdown

| Reference | Measured entry and shape | Layers, exit, interpretation |
|---|---|---|
| Queue P · frames | ~0.250–0.600 s, **350 ms**. Surface grows from title origin; slight final-size overshoot, visually about **2–4%**, then ~100 ms settling tail. Exact scale curve obscured by alpha/blur. | Rows travel with surface; no readable item stagger. No backdrop. Selection changes content before menu completes closing. Exit ~1.500–1.650, **150 ms**, much shorter. |
| Craft P · frames | ~0.217–0.500, **283 ms**. Options rise about **1–1.5 row pitches**, pass final position slightly (~0.1R), settle. | Backdrop and options overlap; three options arrive together. Exit ~3.450–3.600, **150 ms**, options descend/fade while underlying view becomes legible. |
| Linear W · frames | ~4.850–5.033, **183 ms**; primarily surface/text appearance. Translation below reliable crop precision; no demonstrated overshoot. | Panel and text appear together under navigation; no separate row cascade. Recorded activation 4.662 precedes motion: do not count that input/capture lag as easing duration. Exit unknown; recorder reported JS errors. |
| Supabase menu P · frames | ~0.467–0.633, **166 ms**, mainly opacity with very small vertical movement (<0.1H). | Entire menu appears together. Exit ~6.650–6.817, **167 ms**, fade to table. Entry/exit roughly symmetric here. |
| Vercel W · frames | Whole menu becomes visible between ~4.633 and 4.683: **≤50 ms captured interval**, no recoverable easing. | Hero dims while menu appears. No evidence for a 300 ms spring. Useful restraint comparison; exit unknown. |

**Production specification — frequent desktop menu.** Curves E/F/X/M are fully defined in the system below. Durations/delays in ms; these are recommendations, not claimed source CSS.

| Layer | Property: from → to | Duration / curve / delay | Exit |
|---|---|---|---|
| Panel | translateY(-4px) scale(.98) → 0 / 1; origin nearest trigger edge | 180 / E / 0 | y -2px, scale .985, 100 / X / 0 |
| Panel | opacity 0 → 1 | 120 / F / 0 | 1 → 0, 100 / F / 0 |
| Rows and labels | attached to panel; opacity 1 → 1 | 0 / no stagger | attached; disappear with panel |
| Optional page scrim | opacity 0 → .12 | 120 / F / 0 | .12 → 0, 100 / F / 0 |

Retarget from rendered transform/alpha on reversal; cancel old completion callbacks. Hover row changes need no spring. Keyboard focus and hit testing become valid immediately, independent of the appearance tail.

## 2. Modal / dialog

| Reference | Measured numbers | Layer relationship and limitations |
|---|---|---|
| Luma P · frames | Internal Add Question → Text state ~1.533–1.800, **267 ms**. Container height grows roughly **20%**; title changes location as header forms. | Backdrop remains unchanged. Outgoing/incoming content overlap while bounds resize; no item stagger. Entrance absent. Close ~16.733–16.883, **150 ms**; whole surface shrinks slightly/fades, backdrop clears concurrently. |
| Boost concept D · frames | ~0.100–0.367, **267 ms**, bottom-origin modal travels roughly its own height. Small overshoot ~**2–4% H**, final ~100 ms settle. | Scrim begins with panel; panel text/buttons remain rigidly attached. X styling does not make this a shipped X reference. Exit unknown. |
| Framer CMS lightbox demo D · frames | Thumbnail → large overlay between 3.650 and 3.683, **≤33 ms observed**. Scale endpoints roughly **2×**, but no intermediate path recoverable. | Backdrop, image and controls are present together on next frame. Cannot infer shared-element interpolation. Exit unknown. |

Supabase’s dialog clip shows an already-open dialog and a looping icon. It is retained as rejected entrance evidence, not counted as a measured modal animation.

| Layer | Property: from → to | Duration / curve / delay | Exit |
|---|---|---|---|
| Backdrop | opacity 0 → .32 | 160 / F / 0 | .32 → 0, 140 / F / 0 |
| Dialog | y 12px, scale .97 → 0, 1; origin center | 240 / E / 0 | y 6px, scale .98, 140 / X / 0 |
| Dialog | opacity 0 → 1 | 120 / F / 0 | 1 → 0, 120 / F / 0 |
| Initial content | attached, opacity 1 → 1 | 0 / no cascade | attached |
| Internal state bounds | old measured width/height → new bounds | 240 / M / 0 | reverse/retarget from current bounds |
| Internal old/new content | old alpha 1→0; new 0→1 | old 80 / F / 0; new 140 / F / 60 | same relationship reversed |

Keep focus trap and semantics tied to dialog state, not its final frame. On close during entry, reverse current values. On immediate reopen, reuse the same layer and current alpha instead of unmount/remount flash.

## 3. Sheet / panel

| Reference | Measured numbers | Layers and exit |
|---|---|---|
| Are.na P · frames | ~0.367–0.700, **333 ms**. Sheet rises approximately **1H**; most travel before 0.600, final ~100 ms is a decelerating tail. No clear overshoot. | Background blur begins before full panel arrival; media/text attached, no row stagger. Horizontal card navigation later is a separate gesture. Exit unmeasured. |
| Cash App behind scenes P · frames | ~2.683–2.933, **250 ms ±50**. Bottom sheet travels about **1H**; near destination by 2.850. | Camera/hand prevents reliable pixel curve. Scrim slightly leads panel; content attached. Exit ~3.733–3.817, **~84 ms ±50**, fast downwards removal; camera cut/occlusion makes this low confidence. |
| Untitled player P · frames | ~1.417–1.700, **283 ms**. Mini-player grows into large player; art diameter increases approximately **4–5×** and changes center with bounds. | Art, surface and transport controls share geometry; backdrop blur overlaps. Return ~4.850–5.083, **233 ms**; art stays identifiable as it shrinks to mini-player. |

| Layer | Property: from → to | Duration / curve / delay | Exit |
|---|---|---|---|
| Scrim | opacity 0 → .28 | 160 / F / 0 | 140 / F / 0 to 0 |
| Sheet with content | y 100% → 0 | 280 / E / 0 | 0 → 100%, 180 / X / 0 |
| Handle / initial text | attached at alpha 1 | 0 | attached |
| Optional shared artwork | source rect → destination rect, radius old→new | 280 / M / 0 | reverse rects, 240 / M / 0 |
| Newly exposed controls | alpha 0 → 1 | 120 / F / 80 | alpha 1→0, 80 / F / 0 |

During drag, sheet follows finger 1:1; settle from released position/velocity. Suggested gesture spring: mass 1, stiffness 500, damping 42 (tune to viewport travel; unlike timed default it has no fixed duration). Reverse to current target without resetting to screen bottom.

## 4. Toast

All three examples here are **D**. They support mechanisms, not a claim about three shipped product teams.

| Reference | Measured numbers | Layers and exit |
|---|---|---|
| Benji Taylor stack · frames | Incoming card ~0.717–0.950, **233 ms**; roughly **1H** travel. Existing cards translate, rotate a few degrees and reduce apparent width roughly **10%**. | New card and old-stack rearrangement overlap; text remains attached. Blur makes exact alpha/scale fit unreliable. No clear isolated exit. |
| Base UI toast demo · frames | ~0.917–1.183, **267 ms**, top-edge entry about **1H**, front-loaded then settling. | Surface/text/action travel together; no text delay. Later demonstrations include gesture dismissal, but exit duration not isolated here. |
| HeroUI toast demo · frames | ~0.450–0.700, **250 ms**, bottom entry about **1H**. | Shadow and content belong to card. Stack forms behind active card. The inspected 5.1–6.0 window shows hover/stack response, **not completed dismissal**; exit unknown. |

| Layer | Property: from → to | Duration / curve / delay | Exit |
|---|---|---|---|
| Toast | y 16px, alpha 0 → 0,1 | y 240 / E / 0; alpha 120 / F / 0 | y 8px, alpha 0, 140 / X / 0 |
| Text/actions | attached | 0 / no stagger | attached |
| Older stack items | current y/scale → slot y / max(.94,1−.03×depth) | 180 / M / 0 | restack 180 / M / 0 |
| Height reservation | old total → new total | 180 / M / 0 | collapse after outgoing alpha reaches 0 |

Recommended entrance displacement is shorter than the demos’ full offscreen travel. Cap visible stack at three. Pause dismissal while hovered/focused. User dismiss overrides entrance; new toasts do not restart existing timers. Never animate an actionable Undo label in after its button.

## 5. Tabs / segmented indicators

| Reference | Measured numbers | Interpretation |
|---|---|---|
| Airbnb footer tabs W · frames | Popular → Arts & Culture swaps in **≤42 ms source interval**, near 4.617. No measurable traveling indicator. | Content and selected state switch together; no item cascade. This is evidence that instant can be appropriate. Exit = next selection, same captured step; repeated reversal untested. |
| Family tab button P · frames | Contextual FAB color changes ~0.733; icon evolves ~0.767–0.900 (**133 ms**). Circle center and size stay fixed. | Tab selection drives contextual action. Not a sliding-pill reference. Label/content settle not isolated. |
| Telegram tabs P · frames | Selected color by ~0.567; handset/radio arcs animate through ~0.900: **~333 ms ornament** after immediate selected state. | Label stays still; icon footprint roughly constant, internal arcs draw in. No per-tab stagger. Later selections exist, not controlled reversal. |
| Marcel underline study D · frames | ~0.317–0.800, **483 ms**, underline grows **0→1W** from center; visibly slow tail. | Hover underline, not a between-tab translation. Text brightens alongside. Useful long-duration counterexample for frequent switching. |

| Layer | Property: from → to | Duration / curve / delay | Exit / next selection |
|---|---|---|---|
| Selected text/icon state | old color → selected color | 0 or 120 / F / 0 | same |
| Indicator | current x,width → selected tab x,width | 180 / M / 0 | retarget current geometry, 180 / M |
| Content | old alpha 1→0; new 0→1 | old 60 / F / 0; new 120 / F / 40 | retarget newest selection |
| Optional decorative icon | old path → new path within fixed box | 160 / E / 0 | 120 / E / 0 |

Do not delay the selected state until the indicator arrives. Rapid keyboard navigation should update content instantly or shorten to 80 ms; never queue each intermediate tab.

## 6. Number / text changes

| Reference | Measured numbers | Layers and limits |
|---|---|---|
| Family number entry P · frames | 12→123 ~1.417–1.517, **100 ms**; 123→1,234 ~1.683–1.800, **117 ms**. New digit rises about **1G**; existing run shifts horizontally to remain centered. | Comma hops and currency shifts with total width. This is digit insertion/recentering, **not** a full odometer. Each key triggers its own brief motion. No recoverable spring constant. |
| Queue heading P · frames | Queue→Faves ~1.533–1.833, **300 ms**. Individual glyphs roll/blur over roughly **1G**, apparent per-letter offset ~**33 ms**. | List switches around 1.450, menu closes ~1.500–1.650, heading finishes later. The word is not one faded bitmap. Reverse label change unmeasured. |
| Andrew analytics study D · frames | Placeholder→182 ~0.767–1.083, **316 ms**. Digits emerge vertically ~**1G**; adjacent digit onset roughly **100 ms** apart. | Container and caption remain stable. This is an expressive initial metric reveal, not a recommended every-tick update. No measured exit. |

| Layer | Property: from → to | Duration / curve / delay | Exit |
|---|---|---|---|
| Digit slot | previous width → next measured width | 160 / M / 0 | same on decrement |
| Incoming changed digit | y 60%, alpha 0 → 0,1 | y 160 / E / 0; alpha 100 / F / 0 | — |
| Outgoing changed digit | y 0, alpha 1 → −60%,0 | 100 / X / 0 | removed on finish |
| Unchanged digits/separators | fixed glyph; relocate only if layout requires | 160 / M / 0; no opacity change | same |

Use tabular numerals for readouts and stable units; use natural centering only when intentional, as Family does. For high-rate data, coalesce to latest value; never spool through all intermediate values. Sign and decimal separators should not roll like digits. Text swaps may use 20 ms glyph offsets capped at 60 ms total; no stagger for typing or live financial values.

## 7. Icon swaps / morphing buttons

| Reference | Measured numbers | Layers and shape |
|---|---|---|
| Telegram camera/mic P · frames | ~0.750–0.883, **133 ms**. Stroke geometry changes within same footprint; apparent displacement **<0.1 icon width**. | No moving button container. Tooltip overlaps icon transition; no wait-for-morph sequence. Later toggles show reversibility of state, not mid-flight continuity. |
| Family contextual FAB P · frames | **~167 ms** including color and morph; icon rotation/cross-morph follows fill by ~33 ms. | Circle center/diameter constant (~1.00 scale); no bounce of hit target. Exit is opposite context, not disappearance. |
| Things checkbox/ring P · frames | Ring begins ~0.917, finishes ~1.050 (**133 ms**); checkbox fill ~1.017–1.167 (**150 ms**). | Ring appears to lead checkbox by ~100 ms in this capture. Ring grows by roughly one third circumference; row text remains still. Actual implementation/state order cannot be inferred. |

| Layer | Property: from → to | Duration / curve / delay | Exit / reverse |
|---|---|---|---|
| Button hit target | fixed box | 0 | fixed |
| Compatible icon paths | path A → B, fixed viewBox | 160 / E / 0 | 120 / E / 0 |
| Incompatible icon old/new | alpha 1→0 / 0→1; scale .9↔1 | old 80 / F / 0; new 120 / E / 40 | reverse from current values |
| Button fill | old color → state color | 120 / F / 0 | 120 / F / 0 |

Use actual compatible paths for morphing; otherwise crossfade without pretending to interpolate arbitrary SVG commands. Cancel/rebase on each state change. Accessible name changes with state immediately.

## 8. Success / confirmation

| Reference | Measured numbers | Layers and exit |
|---|---|---|
| Things task completion P · frames | Ring **133 ms**, checkbox **150 ms**, total visible sequence about **250 ms**. Ring coverage advances ~⅓ turn without moving the ring. | Feedback stays local; row does not disappear. No celebration layer or stagger. Uncheck unmeasured. |
| Family waitlist P · frames | Burst first visible ~7.10; Added label by ~7.23. Most particles leave by ~8.17: **~1.1 s decoration**, separate from semantic acknowledgement. | Button loading precedes burst; headline/form stay put. Particles spread several button widths then fall. No single monotonic opacity/scale curve. No reverse; one-shot effect. |
| Strava save P · frames | Orange fill ~0.817→1.433 (**616 ms**); confirmation readable ~1.600: **~783 ms to message**. Decoration continues beyond that. | Origin is save region; fluid fill grows to whole viewport, then dark confirmation appears. This is a milestone transition, not a suitable default save-button delay. Full decorative settle not observed before clip end. |

| Layer | Property: from → to | Duration / curve / delay | Exit |
|---|---|---|---|
| Status label | old alpha 1→0; success 0→1 | 80 / F / 0; 120 / F / 40 | persistent until next state |
| Check path | stroke-dashoffset 1 → 0 | 160 / E / 0 | crossfade 80 / F on reset |
| Optional milestone accent | scale .85→1, alpha 0→1 | 240 / E / 0 | alpha 1→0, 140 / F after 600 ms hold |
| Optional particles | origin → bounded trajectories | ≤800 ms decorative envelope; explicit trajectories | fade final 140 ms; cancel immediately on navigation |

Semantic success must be available immediately upon success, independently of a flourish. No confetti for routine edits. A failed request replaces pending feedback immediately and cannot be overwritten by a stale success animation callback. Reduced motion removes particles entirely.

## 9. List add / remove / reorder

| Reference | Measured numbers | Layers and limits |
|---|---|---|
| Aarav project reorder D · frames | Drag starts ~1.133; dragged row reaches new zone ~1.267, drop ~1.500. Travel about **−3R**. Neighbors settle ~1.450; their shifts last about **267 ms**. | Dragged row follows input; siblings relocate under it. The 367 ms gesture is user time, not an easing duration. Mid-flight retargeting is not established. |
| Telegram message removal P · frames | Dissolve ~2.167–3.183, **~1,016 ms**. Neighbor relocation overlaps particle breakup; total visual debris lasts much longer than layout movement. | Message separates into particles; a single alpha curve is not meaningful. Neighbor message shifts about one removed-message slot, not staggered word-by-word. No undo shown. |
| Kian async creation D · frames | Label changes around 8.050–8.267, **~217 ms**. Checkmark follows much later, ~8.70–8.90 (**~200 ms**), a **~500 ms gap** after label completion. | The wider add window shows the entire color-picker list replaced by labels including Database between 8.000 and8.050 (**≤50 ms**). It does not animate one inserted row independently. State is available before the checkmark finishes. No undo shown. |

Family trash preview is deliberately excluded as list deletion evidence: the collectible shrinks into a bin in a **confirmation preview** and Cancel returns it. Looking like deletion is not proof of a committed removal.

| Layer | Property: from → to | Duration / curve / delay | Exit / reversal |
|---|---|---|---|
| Added row slot | height 0 → measured H | 180 / M / 0 | H→0, 180 / M / 60 |
| Added row content | alpha 0, y 4px → 1,0 | 120 / E / 60 | alpha 1→0, y 0→−4px, 80 / F / 0 |
| Existing rows | current rect → new rect (FLIP transform) | 180 / M / 0 | retarget latest rects |
| Dragged row | pointer delta, scale 1→1.02 on lift | pointer 1:1; scale 120 / E / 0 | scale→1, 120 / E; settle spring 500/42, mass 1 |

Removal content leads geometry collapse by 60 ms, then both overlap. No item stagger for sort/filter or bulk removal. Maintain identity by stable keys; on undo, restore the same item from its current visible state, not a new duplicate. Keep semantic order synchronized with committed order and provide keyboard movement.

## 10. Accordion / expanding card

| Reference | Measured numbers | Layer relationship |
|---|---|---|
| Spotify chapters P · frames | ~0.533–0.883, **350 ms**; rows first gain room, then container expands upward toward full height. | Existing chapter identities persist. Header fades as expanded view arrives. More rows become visible by clipping, not proven row stagger. Collapse ~1.867–2.267, **400 ms**: contrary to a universal “exit is faster” rule, this spatial return is similar/slower. |
| Craft expanded actions P · frames | More expansion ~0.917–1.133, **216 ms**. Existing actions move up approximately **3R**; most travel completes by 1.033, with a short decelerating tail. | Same overlay extends from three to six actions; new actions fade in while existing ones rise. More/Less stays near bottom. No clearly resolved row-by-row stagger; collapse not isolated. |
| AlignUI accordion D · frames | ~1.683–1.933, **250 ms** local expansion. Height grows about **one answer block**, nonlinearly with a slowing finish. | Text becomes visible early (~1.717) as clipping boundary expands. Global demo reframing after ~1.9 confounds exact pixel displacement. No defensible item stagger; collapse unmeasured. |

| Layer | Property: from → to | Duration / curve / delay | Collapse |
|---|---|---|---|
| Clipping wrapper | height 0 → measured content H | 240 / M / 0 | H→0, 180 / M / 0 |
| Answer content | alpha 0, y −4px → 1,0 | 140 / E / 40 | alpha→0, 80 / F / 0; no additional y travel |
| Chevron | rotation 0→180deg | 180 / M / 0 | 180→0, 180 / M / 0 |
| Following layout | current positions → expanded positions | same wrapper-driven layout | same collapse timeline |

Use actual height measurements, not arbitrary max-height values that distort duration by content length. Observe content resizing and retarget. Rapid expand/collapse starts at current height; never reset to 0 or full H. Focusable hidden content becomes inert at collapse intent, not after animation.

## 11. Page / view transition

| Reference | Measured numbers | Continuity |
|---|---|---|
| Untitled player P · frames | **283 ms entry / 233 ms return**, art diameter about **4–5×**. | Same player/art moves between compact and expanded representations. Newly exposed controls are subordinate to shared geometry; no whole-page fade. |
| Luma dialog views P · frames | **267 ms** bounds/content change; roughly **20%** height growth. | Dialog is a stable context; backdrop does not re-enter. Container and content transitions overlap. |
| Are.na detail sheet P · frames | **333 ms** entry from below, about **1H**. | Background remains context behind a moving detail surface. In-clip horizontal navigation suggests directionality but its individual easing was not isolated. |
| Family trash confirmation P · frames | Artwork collapses ~1.767–2.000 (**233 ms**) to roughly **15–20% width**, then drops into bin around 2.033. | A second beat follows shrink: “which object” then “what action.” This is a preview; do not claim data is already deleted. Return on Cancel is visible in survey, not numerically isolated. |

| Layer | Property: from → to | Duration / curve / delay | Back / exit |
|---|---|---|---|
| Shared element | source rect/radius → destination rect/radius | 280 / M / 0 | reverse rects, 240 / M / 0 |
| Old nonshared content | alpha 1→0 | 80 / F / 0 | 80 / F / 0 |
| New nonshared content | alpha 0→1, y 4px→0 | 160 / E / 80 | alpha→0, 80 / F / 0 |
| Page shell/navigation | fixed | 0 | fixed |

Use spatial motion only where there is a meaningful relationship. Unrelated route changes can be instant or 120 ms crossfade. Route state and focus must not wait for outgoing animation. Cancel obsolete transitions on new navigation, preserve scroll where appropriate, and never allow an old transition to restore stale content.

## 12. Skeleton → content

| Reference | Measured numbers | Layers and curve |
|---|---|---|
| Perplexity search P · frames | Source placeholders give way to Pro Search/status ~0.333–0.533, **~200 ms**. | Reserved source area precedes readable state; then staged search progresses. Image appearance samples mix text replacement and layout, not pure alpha. No item stagger confidently recovered. |
| Detail connector-loading study D · frames | Cropped Notion icon emerges ~0.733–0.983, **250 ms** (still slightly soft at end). Footprint stays about **1×**; blur drops as contrast rises. | Skeleton and icon occupy same box, surrounding list stable. Other icons resolve at different times; do not assume network arrival differences are intentional stagger. |
| JP generated-image placeholder D · frames | Label fades ~5.500–5.600; first tiles ~5.600, near-filled ~6.117, settled ~6.183: **~683 ms**. | Mosaic tiles reveal in different regions; caption/outer dimensions stay fixed. Exact blur radius/tile delays unrecoverable. Not a production provenance claim. |

The Flicker skeleton generator creates skeleton artwork inside a design tool. It does not demonstrate a runtime loading handoff and is rejected for this measurement.

| Layer | Property: from → to | Duration / curve / delay | Failure / replacement |
|---|---|---|---|
| Reserved layout | final content box | 0 | preserve box where practical |
| Skeleton | alpha 1→0 | 120 / F / 0 after content ready | stop shimmer immediately on error |
| Ready content | alpha 0→1 | 180 / F / 0 | 100 / F on replacement |
| Optional image blur | blur 4px→0 | 180 / E / 0 | none; omit for text |

Fade skeleton and content concurrently. Decode images before handoff. Never run a fixed animation timer and show an empty final state when data is late. For instant cache hits, skip skeleton. No forced mosaic reveal in routine data interfaces; JP demonstrates reserved geometry, not a mandate for 683 ms loading decoration.

## 13. Hover / press on buttons and cards

| Reference | Measured numbers | Layers and exit |
|---|---|---|
| Campsite card P · frames | ~0.283–0.533, **250 ms**. Lift about **0.03–0.05H**, shadow strengthens; scale approximately **1.00**. | Surface, label and close control stay attached. Unhover ~1.317–1.550, **233 ms**: similar duration returning elevation. |
| Supabase row hover P · frames | Row highlight appears by ~1.367; tiny line in row icon extends through roughly1.57 (**~200 ms**, coarse). | Highlight is prompt; icon then illustrates insertion. Text stays fixed. Line displacement about one internal stroke spacing; no moving whole row. Hover exit not isolated. |
| Emil button study D · frames | Press around 2.367, smallest near2.433; recovery through~2.600. Scale about **.97–.98**, **~67 ms compression**, **~167 ms release**. | Label and background scale together; no opacity disappearance. Recording caption recommends150 ms, which is guidance, not a recovered CSS declaration. |

| Layer | Property: from → to | Duration / curve / delay | Release / unhover |
|---|---|---|---|
| Button | scale 1→.98; center origin | 80 / E / 0 | .98→1, 120 / E / 0 |
| Card | y 0→−2px | 160 / E / 0 | −2→0, 160 / E / 0 |
| Card shadow overlay | opacity 0→1 | 160 / F / 0 | 1→0, 160 / F / 0 |
| Label/hit target | label attached; layout hit area unchanged | 0 | unchanged |

Press begins on pointerdown, reverses on cancel/up; no queued bounce after rapid taps. Disable hover-only effects on coarse pointers. Keyboard activation gets visible feedback without shifting focus geometry. Do not scale input fields or dense table rows.

## 14. Tooltip

| Reference | Measured numbers | Layers and limits |
|---|---|---|
| Discord profile tooltip P · frames | Absent~0.650, present~0.683: **≤33 ms observed**. | Surface/label appear together; animated avatar decoration continues independently. No fitted tooltip easing possible; pointer dwell not established. |
| Telegram mode explanation P · frames | Begins~0.750; substantially visible~0.900; darker/final by~0.983: **~233 ms**. About **0.2H** vertical growth/movement plus alpha. | Bubble/tail/text move together, concurrently with 133 ms camera→mic morph. Icon settles before bubble. Timed dismissal not measured. |
| Akash chart tooltip D · frames | ~0.933–1.050, **117 ms** appearance. | Tooltip follows plot point. Whole-recording zoom confounds displacement and scale; alpha-like reveal identifiable, exact alpha not. No item stagger. Exit unknown. |

| Layer | Property: from → to | Duration / curve / delay | Exit |
|---|---|---|---|
| Tooltip + tail | alpha 0→1; y 2px→0 | alpha120 / F; y120 / E; **400 ms hover dwell**, 0 on focus | alpha1→0, 80 / F / 0; no travel |
| Text | attached at alpha1 | 0 / no stagger | attached |
| Position | current anchor → next anchor | instant placement; no slow pointer chase | cancel on anchor removal |

The 400 ms dwell is proposed product policy, not observed animation duration. Grouped adjacent tooltips may use a 100 ms grace window with immediate next entry. Escape dismisses; hover/focus preservation applies while pointer is over tooltip. A popover with buttons is not a tooltip: Gabriel’s action popup is excluded from tooltip counts.

## 15. AI thinking / streaming states

| Reference | Measured numbers | Layer relationship |
|---|---|---|
| Perplexity search→answer P · frames | Thinking section collapses ~8.283–8.467, **184 ms**; source/answer takes its place. Answer continues accumulating after the window. | Collapse and new content overlap. Text arrivals reflect content availability; do not fit them to one 300 ms “streaming” animation. Total request latency is not transition duration. |
| Jakub Thinking Orbs D · frames | Sampled **0–1.983 s**, continuously evolving dot field; no final settle and no established loop period. Orb footprint approximately constant, individual dots translate/appear. | Label is stationary, orb changes. No genuine model progress can be inferred from decorative states such as “Solving.” No exit shown. |
| Gabriel agent panel D · frames | Surface grows ~1.033–1.283 (**250 ms**); first row ~1.333, next~1.417, third~1.550; complete~1.633 (**600 ms total**). | **~100–120 ms stagger** plus initially empty panel: useful caution about artificial latency. Container leads; content waits too long for frequent use. Exit unknown. |
| Grok listening P · frames | Label/stop control switch between~0.733 and0.783 (**≤50 ms**), background continues evolving. | Adjacent input-state reference, **not thinking or answer streaming**. Fixed input bounds and prompt stop affordance are the transferable parts. |

| Layer | Property: from → to | Duration / curve / delay | Exit / completion |
|---|---|---|---|
| Pending indicator | alpha0→1 | 120 / F / 150 ms debounce | alpha1→0, 80 / F / 0 |
| Activity mark | opacity .45↔1 | 1,200 ms full cycle / F, alternate half-cycles | stop immediately; do not finish loop |
| Status label | old alpha1→0 / new0→1 | 80 / F / 0; 120 / F / 40 | stable final label |
| Thinking region | old measured height → collapsed/new height | 180 / M / 0 | retarget current height |
| Incoming answer chunk | alpha0→1, **no y translation** | 80 / F / 0 | commit final text without another animation |
| Stop control | hidden → available | 0 at request start | remove immediately when request ends |

Append chunks as available; batch DOM updates per frame rather than animating each token. Never delay ready output for a minimum theatrical “thinking” time. Stop cancels request and decorative motion immediately; freeze already delivered answer with honest stopped state. Keep scroll anchored only while the reader is at the end. Announce status milestones, not every token. Reduced motion retains static status and immediate text.

## Numeric curve cross-checks

The physical-track appendix supplies timestamps and reproducible threshold definitions for these **ten observed samples**. Ratios are image features, not fitted easing parameters. In particular, visible color coverage is not opacity, and changing icon footprint is not button scale.

| Feature | Ten sampled values | What it establishes |
|---|---|---|
| Button width / initial width | `1.000 .978 .978 .973 .973 .995 .998 1.000 1.000 1.000` | About **2.7% compression**, then return without detected width overshoot. Pointer pixels below the measurement band are excluded. |
| Tab underline width / final width | `0 .022 .057 .184 .376 .580 .746 .873 .921 1.000` | Slow initial growth, faster middle, decelerating finish over about 550 ms including brackets; not a uniform-speed wipe. |
| Family cyan button width / final width | `0 1 1 1 1 1 1 1 1.003 1` | Color appears at essentially full size; variation about 0.3% is threshold/raster noise, not evidence of a bounce. Zero means no cyan pixels before the state change. |
| Telegram tab blue glyph width / final width | `0 .902 .971 .988 .994 .936 .844 .867 .936 1` | Internal path footprint changes after color selection; this must not be misread as the whole button scaling. |
| Things blue occupied pixels / final count | `.411 .432 .463 .543 .970 1.010 1.016 1.009 1.001 1` | Ring and checkbox contribution overlap, then stabilize. A 1.6% color-area excursion does not establish spring overshoot. |
| Strava orange pixels / viewport crop area | `.064 .087 .105 .141 .236 .475 .626 .888 0 0` | An accelerating spatial fill followed by dark confirmation, not a long crossfade. Last zeros mean orange has been replaced. |
| Reordered blue icon center y / crop height | `.624 .505 .406 .312 .294 .299 .306 .305 .305 .305` | Input-driven upward travel then slight return. The apparent ~3% travel overshoot may be pointer path; it cannot establish a spring. |
| Loading icon dark pixels / final count | `0 0 0 0 0 0 .144 .342 .827 1` | Late sharp edges emerge while blur decreases; threshold crossing alone cannot identify an alpha curve. |

## The system: consistent relationships, different clocks

These are starting tokens for rebuilding the kit, **not averages fitted to the recordings**. Four curves cover the timed system. The gesture spring is a separate input-driven mechanism.

| Curve token | Exact definition | Use |
|---|---|---|
| E — enter / resolve | `cubic-bezier(.16, 1, .3, 1)` | Front-loaded arrival with a short settling tail; menu, sheet, icon, press release. No mathematical overshoot. |
| M — move / resize | `cubic-bezier(.4, 0, .2, 1)` | Both endpoints remain visible; tab indicator, bounds, shared element, list reflow. |
| F — fade / color | `cubic-bezier(.2, 0, .2, 1)` | Alpha, scrim and color; avoid a conspicuous opacity tail. |
| X — leave | `cubic-bezier(.4, 0, 1, 1)` | Small disappearing surfaces; short acceleration out. Not every spatial return. |

| Duration token | Value | Decision rule |
|---|---:|---|
| instant | 0 ms | Semantics, selected state, cached content, high-frequency navigation, stop/cancel |
| feedback | 80 ms | Press compression, outgoing label, tooltip dismissal, stream chunk |
| quick | 120 ms | Icon alpha, color, small appearance, skeleton fade |
| control | 160 ms | Glyph/path, card elevation, small state resolve |
| relocate | 180 ms | Indicator, list reflow, height removal, small sheet exit |
| surface | 240 ms | Dialog, accordion expansion, toast entry, larger shape return |
| spatial | 280 ms | Sheet travel and shared-element geometry |
| decorative envelope | ≤800 ms | Rare milestone ornament, never blocks interaction |

140 ms is the midpoint between quick/control for a slightly softer fade or modal exit. Delays are a small separate vocabulary: **0**, **40**, **60**, **80 ms**. A delay is not added automatically; initial menu/dialog content stays attached with zero separate delay. Explicit policy timers (tooltip dwell 400, AI debounce 150) are not animation durations.

Choose by **distance × size × frequency**, not component name alone. An eight-pixel tooltip should not use the same timing as a full-height sheet. A large surface can take280 ms because the distance conveys position; a repeated action should often be160 ms or instant even if a showcase version uses500 ms. Large text must stay readable during movement. For motion longer than 280 ms, identify the information it communicates or remove it.

### Choreography rules

1. **Context and container establish where; content establishes what.** Scrim and surface usually start together; optional new content starts40–80 ms later while the surface is still finishing. Existing content attached to a panel never gets a separate lag. Are.na and Untitled preserve that attachment.
2. **Overlap, do not serialize.** A240 ms panel followed by a160 ms label creates400 ms of latency. Start the label at 60–80 ms when delayed entry is useful, finishing it before the surface’s tail. Menus need no label delay.
3. **Outgoing content leads structural removal.** Fade80 ms, begin collapse60 ms in. Preserve placeholders/geometry during skeleton handoff. Do not collapse a list row before the user can identify which row disappeared.
4. **State acknowledgement is earlier than ornament.** Telegram tab color precedes arc drawing; Family’s Added state precedes the last falling particle. Make confirmation readable without waiting for confetti.
5. **Stagger is optional and bounded.** Default0 for controls, menus, data rows and repeated tasks. Rare introductory groups may use 20 ms offsets, capped at 60 ms total. The agent demo’s100–120 ms per-row spacing is too much for a frequent tool panel.
6. **Exit follows purpose.** Small overlay exits100–140 ms; tooltip80 ms. Spatial returns retain geometry and can take240 ms. Spotify’s longer chapter collapse is evidence against blindly making every exit half the entry duration.
7. **Origin expresses causality.** Menu origin tracks trigger edge; sheet comes from its edge; shared art uses source/destination rects; button press scales at center. Floating a dialog from an unrelated corner is not choreography.
8. **Do not manufacture data latency.** Skeleton removal starts on readiness; streaming text appears on arrival; success is not delayed until a preset animation finishes. Animation can signal activity but must never imply a measured percentage that does not exist.

### Interruption contract

The videos do not verify these behaviors. They are acceptance criteria for the future implementation.

- One current target per property. A new action cancels/rebases the old animation at its **rendered value**, not its original keyframe. Preserve velocity for a physics-driven drag; for timed alpha/bounds transitions, continuous position is the minimum requirement.
- Open→close→open within100 ms should never flash at alpha0, jump to a start position, duplicate an overlay or leave an invisible focus trap. Cleanup belongs to the latest transition identity.
- For tab changes, list sort, counters and streaming updates, **latest state wins**. Do not queue obsolete intermediate animations. Keep stable item identities so reordering does not become removal/recreation.
- Pointer cancel is a release, not a successful action. Release press feedback and drop gesture ownership immediately. Touch scrolling must not trigger lingering hover.
- A drag uses1:1 input tracking. On release, use current position/velocity and a selected destination; clamp invalid destinations. Suggested mass1 / stiffness500 / damping42 is a starting spring, with tolerance thresholds set by rendered scale. Do not claim a spring has an exact240 ms duration.
- Close/stop/error state changes take effect immediately. Decoration can end early. Old success callbacks cannot overwrite newer error/cancel states.
- Backgrounded or unmounted views stop loops and timers. Re-enter at the current semantic state; do not replay stale celebrations.

### Reduced motion and operational checks

With reduced motion: remove translation, scale, path morphs, blur, particles, animated numbers and looping shimmer. Use instant state changes or a short **≤100 ms** opacity handoff when helpful; keep geometry changes immediate and understandable. Shared elements become stable destination content. Preserve labels, progress facts, focus management and stop/undo controls. Motion is never the only indication of selection, completion or error.

Before implementing the replacement kit, its review cases should include: rapid toggling at 50/100/150 ms; repeated tab-key selection; removal followed by undo during collapse; new counter values every50 ms; resize and font/content growth during an accordion; dragging then canceling; delayed/error/cached responses; a streaming answer while the user scrolls upward; reduced motion; and a lower-refresh device. Verify perceived timing at normal speed as well as frames. No such interactive behavior has been tested by this research-only deliverable.

## What separates senior motion from junior motion

| Weak default | Concrete frame evidence | Production decision |
|---|---|---|
| Every transition takes 300 ms | Telegram camera→mic is~133 ms, Are.na entry~333 ms, Family particle tail~1.1 s. | Use several clocks; keep rare decoration independent from task completion. |
| Fade everything equally | Untitled’s art changes size/position with the player. Family’s digits shift existing glyphs while inserting one new glyph. | Preserve identity and geometry; animate only changed information. |
| A spring because the screenshot looks playful | Vercel menu appears within one captured interval; no visible intermediate spring. | Do not infer CSS from labels or tags. Instant is a valid result. |
| Text floats independently from its surface | Are.na panel and its initial content travel together; toast text rides its card. | Initial content stays attached; delays apply only to newly exposed content. |
| Every row deserves a stagger | Agent panel is empty before rows arrive~100–120 ms apart; completion takes 600 ms. | Keep frequent panels unstaggered; cap rare stagger span at 60 ms. |
| Exit always mirrors entry | Queue~350/150 ms; Craft~283/150 ms. | Dismiss small surfaces promptly. |
| Exit always must be faster | Spotify expansion~350 ms, collapse~400 ms; Untitled return retains shared artwork. | Preserve spatial continuity when returning to a known place. |
| Delay success until the flourish finishes | Family Added appears while particles still fall. | Separate acknowledgement from ornament and never block a next action. |
| Loading is an aesthetic reveal timer | Perplexity’s answer continues after thinking-panel collapse; Detail keeps each icon’s footprint. | Tie handoff to actual readiness, reserve space, avoid fake progress. |
| Visual polish proves correct behavior | Family’s bin animation is a preview, not committed deletion. Passive captures do not test interruption. | Distinguish what was seen, what was inferred, and what must be implemented/tested. |

