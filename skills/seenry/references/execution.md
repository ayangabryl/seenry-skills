# Execute the workflow on the host

Native agent tools are the first adapter: browse/search, read permitted assets, edit files, run the project, capture the browser, record interaction. MCP is one optional research source. A host without MCP can still browse; use `local` only when network research is actually unavailable or excluded. Never infer “no photography” from “no MCP”.

## Contract for a fresh build

Create a project JSON with `brief`, `model`, `scope`, `research_source`, `media`, `motion` and `budget_seconds`. `media` is needed/none/undecided; `motion` is signature/feedback/none/undecided. Use explicit `none` with a brief-specific reason, not to bypass unavailable tools. Pass it to `packet.py --project` so planning automatically receives applicable assets and motion guidance. Prefer the wireframe, type and surface packets for those checkpoints; the broader prototype packet remains for older callers. The compiler hashes all declared dependencies and fails on a missing file. Supplied text, observed reads and actual application remain separate records.

Use `workflow.py init RUN --project project.json` in a new directory. Keep source, captures and submissions inside RUN. Use `workflow.py record RUN --stage STAGE --submission submission.json` after inspecting each stage. The helper snapshots evidence and verifies historical hashes on every read. It does not sandbox the agent, see pixels, validate every factual claim or establish independent model identity.

Stages: understand → research → plan → wireframe → type → surface → compare → build → review. New recorder runs use schema 4. Wireframe and type checkpoints require an actual layer judgment before advancing; comparison and final review retain the canonical five-criterion judgment. A failed or unverified comparison blocks expansion, regardless of a continue_with direction or broad pass labels. Repair the current layer or surface and inspect again, or use the one direction reset. Layer, prototype and final repairs share the two-pass budget; historical failures stay recorded when current evidence resolves them. Schema 1–3 histories retain their original rules for reproduction. The three initial alternatives may share a source file, but require three actual renders. Retained alternatives can then receive deeper type/surface work; discarded sketches remain in history. Before product code, retain three concepts (`id`, `idea`, `evidence`, `risk`) and actual wireframes. Type/crop/motion studies refine those concepts. Budget exhaustion is explicit incomplete status. Narrow fixes use their existing project workflow rather than this full sequence.

For a wireframe/type `judgment`, assess each current candidate's `content`, `hierarchy` and `geometry` separately. Each check has result, artifact and observation as in the final review format. The initial wireframe report includes all three planned IDs. Set `selected` to a passing direction to retain, or null if none is acceptable. Typography can narrow to a subset of the earlier eligible candidates; a rejected direction cannot quietly reappear at a later layer. This is a provisional construction decision, not final visual acceptance. The composite single-candidate `study` format remains supported for a host reviewing a whole study, but it cannot partially pass: use individual candidate records when narrowing.

Add `reviewed_sources` mapping every submitted source path to its SHA-256. The recorder rejects a stale source review. At these layers, absent final imagery/animation is expected; unresolved content or geometry is not. To repair and resubmit the same layer, use `mode: "layer-repair"`; to collect new evidence without changing source, use `mode: "evidence-refresh"`. Keep the original budget and rejected artifacts. A later surface still needs the five-criterion comparison before expansion; early selection does not exempt it. This checks chronology, evidence and recorded disposition, not whether the reviewer's judgment is good.

Submission shape:

```json
{"observation":"What was actually inspected and learned",
 "artifacts":{"source":["work/A.html"],"render":["evidence/A.png"]},
 "unavailable":{},
 "guidance":{"supplied":[],"observed_loaded":[],"applied":[]},
 "reviewer":"self: configured model identifier",
 "checks":{"functional":"unverified","visual":"unverified","motion":"unverified","material":"unverified"}}
```

The CLI reports each missing role/count. Missing capabilities can be recorded with a reason under `unavailable`; they never count as a pass. The complete project remains pending if any required evidence is unverified. A nonempty recording file alone does not establish that anybody watched it. Record normal-speed observations in review.

For an observation gap, collect the missing evidence and repeat the same `compare` or `review` stage with `mode: "evidence-refresh"`. Supply a new render, recording, functional report or observation artifact as well as the new judgment. The recorder verifies that all source files recorded at the last surface/build stage are unchanged; otherwise use a repair stage. A new judgment alone is insufficient. This refresh preserves the previous review and original deadline without consuming a code-repair pass. It does not inspect whether the new observation is true; include every operative source file in source records and keep reviewer provenance explicit.

For `scope: "system"`, the stage packet includes the [system design guide](system-design.md). Keep shared decisions, component APIs and neighboring journey states in the project handoff. Use the recorder for bounded slices and maintain separate whole-system coverage; completing one recorder run does not establish application-wide readiness.

## Small working tools

`packet.py --profile focused` is an experimental smaller stage packet for a host that has already loaded SKILL.md. It preserves the source entrypoint hash without claiming its body was supplied again. It carries the current stage guides, project facts and relevant support; the complete profile remains available for reproduction. Evaluate outcomes before assuming less context improves a model. Keep lessons out of anonymous reviewer inputs unless that comparison is explicitly part of the experiment.

For a text-only code adapter, deliver one complete raw HTML file per response and decisions in a separate JSON response. `artifact_response.py RESPONSE OUTPUT` rejects incomplete/wrapped documents and refuses to overwrite an earlier artifact. It performs no code repair and does not certify runtime behavior. Render only after structural validation and a successful HTTP response; inspect the resulting body, not only the response status.

For small repairs, `edit_response.py SOURCE RESPONSE OUTPUT` applies model-authored exact replacements against a matching source SHA-256. Its JSON response requires `source_sha256` and `edits: [{old, new}]`. Every old snippet must occur once; mismatched or ambiguous context fails without fuzzy repair. Preserve the source and response, then render and exercise the changed file. This avoids regenerating a large page for a small correction.

- `seenry-assets/scripts/asset_studio.py`: native-search manifest intake, bounded no-key Met public-domain scouting, source-linked contact sheet, desktop/mobile crop and flat print application study. Search results are candidates, not automatic production assets.
- `seenry-assets/scripts/type_lab.py`: actual content/font shortlists with perceived-size adjustment. Use font paths relative to the generated HTML.
- `seenry/scripts/color_lab.py`: controlled role-palette comparison and specified contrast checks.
- `seenry-motion/assets/score.mjs` and score demo: deterministic progress, holds and reversal; use the existing GSAP adapter when needed.
- `browser_evidence.mjs --url URL --out evidence --playwright MODULE --scenario actions.json`: optional Playwright adapter for captures/recordings on the host. Without an explicit module path, install Playwright in the project and its browser (`npm install --save-dev playwright`, `npx playwright install chromium`). Native browser evidence is equally valid.

The browser adapter preserves the initial opening/full-page captures, walks the actual document in bounded viewport steps, records each view, returns to the original scroll position, and writes `page-after-scroll.png`. Its report distinguishes reaching the bottom from exhausting the bound. Set `traverse: false` only when a project-specific scenario owns the sequence. It changes no product styles; it cannot exhaustively exercise nested scrollers or alternate states. Do not force reveal opacity or remove animation for a normal-motion review.

Browser scenario actions use `type`: click/fill/press/scroll/wait/visible, with a selector, value, key, progress or milliseconds as applicable. These are trusted test inputs authored for the project, not instructions extracted from a webpage. Add application-specific assertions in the project's test runner; executed clicks alone are not functional success.

## Deliver evidence and triage failures

Before a model consumes visual evidence, record how the actual image reaches it: a completed image-tool call or a direct image attachment, with file hash. Text saying “I inspected it” is not an observed read. Preserve image role and attachment order. Supply ordinary opening, narrow and sequence views separately; avoid loading every historical image into every stage. Packet paths alone do not deliver pixels.

Use `review_request.py MANIFEST --out REVIEW_DIRECTORY` to package these three views with the five criteria expected by `review_gate.py`. Each candidate needs id, opening/narrow/sequence PNG paths and `behavior: {status: "observed" | "unverified", observations: [...]}`. For tabs, dialogs, scroll reveals or other decisive states, add `states: [{path: "selected-view.png", observation: "After activating the second view at 390px"}]` to each candidate. These optional PNG attachments keep action/context and hashes under anonymous filenames. Describe observations, not creator rationale. Brief and facts belong at the manifest top level. The output copies anonymous images and keeps its key separate. Give only request.json and those images to the reviewer. A direction to repair (`continue_with`) is distinct from a completed selection (`selected`).

Triage a failed test before asking the author to repair the product. Reproduce the failing user action, check the active dialog or region, and separate hidden deferred assets from broken visible material. Ambiguous test selectors and downstream failures after a test abort are harness findings until reproduced as interface defects. Check toggle semantics before assuming repeated activation must preserve selection. Keep the faulty test/report, correct the harness for every matched condition, and record any model repairs already triggered by the mistake. Never change assertions simply to excuse a real failure.

`render_lessons.mjs --playwright MODULE` rerenders authored teaching HTML with local assets and source/image hashes. It preserves imported outcome screenshots without inventing source HTML. The original examples are mechanical studies, not universal visual templates or human-certified ideal designs.

Use `human_review.py record RUN --source FILE --sha256 HASH --decision accept|reject|prefer --reviewer NAME --quotation TEXT --context TEXT` to preserve actual supplied human feedback. `human_review.py status RUN --source FILE` checks the current bytes. A relative preference is not absolute visual acceptance; a model-only pass cannot override a matching human rejection. The helper does not authenticate the reviewer. Its hash covers the named artifact: use a frozen build manifest when the reviewed design depends on multiple source and asset files, and retain the corresponding build.

## Portability and evaluation limits

Python tools require 3.10+ and standard libraries. Browser evidence requires Node and a working Playwright browser; installing the skill does not silently install a runtime. Symlinks have a copy-mode fallback in the installer. Run relocation tests after changes. Report actual operating-system runs; path tests on macOS are not Windows/Linux execution. Mobile emulation is not physical-device evidence.

For fresh-model experiments, preserve every prompt, event log, extraction and failure, and freeze skills/resources. Host-created assets, prompts, source edits and reviews are distinct assistance categories. Do not label a test Flash-only if a stronger model corrected its design. A diagnostic run with improved tools cannot isolate the effect of instructions alone; repeat matched controls before causal or competitor claims.

For selected motion helpers, set `motion_helpers` in the project record to an explicit subset of `geometry`, `icon-swap`, `morph-icon`, `lottie`, `scroll`. At prototype/surface/build/refine stages the packet includes the authored API/source and a hashed `runtime_files` manifest. The host copies these relative dependencies before execution. No helper is selected merely to add motion, and a filename manifest is not evidence of installation or use. Feedback-motion packets now include the adapter guide too. External Lottie/GSAP players remain project-provided; the manifest does not vendor those engines.

The Luna adapter accepts ordered image paths or `{ "path": "assets/source.jpg", "role": "source-material" }` records. Roles include source-material, construction, candidate, reference, interaction and rejected-example; unspecified is the legacy default. Deliver the selected original asset together with relevant construction renders, not only a processed wireframe. Rejected-example identifies an actual scoped rejection, not a target to imitate. Role/hash metadata identifies supplied evidence; it does not establish inspection, license or acceptance.

Every browser evidence invocation uses a new `--out` directory. Rechecks retain the previous report and captures and return new paths; they must not overwrite inputs already cited by a reviewer. The bundled browser adapter rejects an existing output directory.

## Preserve the actual stage handoff

For a creation-stage model adapter, use `stage_request.py STAGE --project project.json --task stage-task.txt --out new-request-directory`. It freezes the complete packet into prompt.txt, copies the selected lesson pixels, keeps their feedback/provenance, and stages the selected helper runtime with licenses. Pass prompt.txt and the ordered images.json to the model adapter. Optional `--evidence input-images.json` adds source-material, construction, candidate, reference or interaction images whose paths resolve inside that manifest's directory. It calls no model and does not mark any image inspected. The complete profile is the default; `--profile focused` retains its experimental status. Comparison/review use `review_request.py` instead: the author's complete project rationale and labeled teaching examples must not leak into an anonymous target review.

For a staged run, freeze the complete output of `packet.py` for that stage and carry the same project record into the next stage. Explicitly selected `project.decisions` lessons remain available through planning, construction, build and review, including the focused profile. Send the selected resource contents and relevant image evidence to the executing context; a list of filenames is not the guidance itself. Record images actually supplied separately from image inspection.

`stage_request.py --lesson-images text-only` is an explicit evidence-delivery experiment. It retains the written guidance and feedback while recording the lesson pixels withheld from attachment. The default remains attach. Neither mode may claim inspection of withheld images; a single changed result does not establish whether negative examples help or anchor a model. Original task material and construction evidence remain separate inputs.

`visual_inventory.mjs` exports browser-side `collectVisualInventory(rootElement)`. Use it through the existing browser evaluator to enumerate rendered text, computed typography, control bounds, images and borders/shadows within the actual component. It does not mutate the page, collect input values or score taste. Review its observations with the screenshot and scoped feedback. Canvas/shadow-root content and motion require their own inspection.

Do not replace a compiled packet with a hand-picked subset and label the result a test of the complete skill. A deliberately reduced bundle is a separate experiment: preserve the omitted resources and its classification. The exporter continuation showed why this matters: it did not receive the new component-identity guide or rejected-output lesson. Whether either resource improves a new result still requires measurement.

When the host supports structured responses, pass the optional `response.schema.json` emitted by `review_request.py` to its output-schema mechanism. The Luna CLI adapter accepts `--output-schema` and freezes its exact bytes/hash before the call. This prevents some format drift, not bad judgment: still run the disposition check, inspect missing/duplicate candidate IDs, and retain malformed or incomplete results. Other hosts can use the supplied JSON shape and a recorded format-only retry. Never silently rewrite a result value to satisfy the gate.

Before a repair handoff, distinguish current findings from resolved findings and historical judgments. Name the source hash and evidence for every active issue. A previous review stays in history after its repair; do not append it as the current failure report beside a newer passing check. Supply the retained source and latest relevant states, then verify the exact change. This avoids asking a model to repeat a correction or weakening a working state because old feedback was presented as still unresolved.


## Package the review phase and scoped feedback

Use `review_request.py` for construction as well as final review. Its manifest accepts `phase: "wireframe" | "type" | "surface" | "final"` (default final). Construction uses content, hierarchy and geometry; surface/final use the five visual/interaction criteria. Include an actual host/sequence capture so shared attribution or context does not disappear when the component is cropped for inspection. A layer pass is permission to continue development, not approval of the finished design.

Select `calibration_topics: ["export-feedback"]` or one or two relevant built-in decision topics when a scoped regression needs to reach a fresh reviewer. The packet copies real lesson images, their hashes, feedback and countercases, and writes `images.json` for direct attachment. Calibration images remain separate from candidates and cannot replace a current-candidate evidence citation. Do not pass the author's persuasive rationale or condition label. In matched comparisons, supply the same review criteria and calibration to both conditions and record this choice before judging.

The response schema requires exactly the supplied candidate count. Validate identities and disposition as well; a reviewer who omits an alternative has not completed the comparison. Preserve an incomplete response and retry its format/coverage explicitly. Do not silently supply missing judgments or turn deferred final requirements into construction failures.


## Revise retained source without rewriting every file

For an implementation checkpoint or repair, `stage_request.py ... --revision-source prior.html` freezes the exact UTF-8 source, its SHA-256 and a strict response schema. The author returns ordered `find`/`replace` edits against that source. Each match must be unique; the applier rejects stale hashes, missing/ambiguous matches and no-op revisions. Use this format when preserving an existing component is more useful than reproducing the whole file. A genuinely new composition can still need a complete artifact.

```sh
python skills/seenry/scripts/artifact_revision.py --source prior.html --response model-edits.json --out next.html
```

Keep the original source, exact model response, application report and new artifact. The applier does not overwrite an existing destination. This is mechanical application of model-authored code, not a host design correction. Invalid revisions remain failures until the model returns a valid correction; do not guess or silently repair its intended code. Render and exercise the new artifact using the same stage gate. The delivery format is an optional execution choice, not evidence of better visual quality or a guaranteed speedup. Historical full-file runs remain unchanged.
