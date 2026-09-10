# Seenry architecture

Seenry owns the design process. The optional read-only MCP supplies additional evidence. Bundled guides and local studies keep the process available without it. The host supplies browsing, implementation, rendering and available model capabilities. Project records preserve decisions and measured results. None of these layers automatically certifies visual quality.

```mermaid
flowchart TD
  U[User brief and existing project] --> S[seenry: scope and product truth]
  S --> R[Select an available evidence route]
  S --> SYS[System scope: journeys and shared decision record]
  SYS --> SL[Representative connected slices]
  SL --> P
  SYS --> COVER[Track planned, built, exercised and reviewed coverage]
  M[Optional Seenry MCP: inspected references and reviews] --> R
  L[Local studies, supplied files or public sources] --> R
  R --> E[Separate observation, curator reason and inference]
  E --> P[DESIGN.md: information jobs, three relationships, material and sequence]
  P --> W[Working wireframes]
  W --> WG{Assess each candidate: content, hierarchy and geometry}
  WG -->|No acceptable direction; repair| W
  WG -->|One direction reset| P
  WG -->|Preserve rejected alternatives| ARCH[Archived source, renders and reasons]
  WG -->|Retain a passing direction provisionally| T[Actual typography and content on retained source]
  T --> TG{Inspect actual labels, proportions and boundaries}
  TG -->|Repair within shared budget| T
  TG -->|Current layer cleared| V[Controlled surfaces, assets and interaction proofs]
  CL[Local color lab: same content, different role palettes] --> V
  VL[Small local decision lessons] --> V
  V --> C{Five-criterion rendered comparison}
  C -->|Missing observation| OBS[Collect evidence with source unchanged]
  OBS --> C
  C -->|One direction reset| P
  C -->|Unresolved; repair within shared budget| V
  C -->|All criteria cleared| B[Build complete sequence and states]
  KEEP[Selected opening and narrow renders] --> B
  B --> Q[Compare final with selected slice; exercise and review]
  Q -->|Missing observation| OBS2[Observe the existing result]
  OBS2 --> Q
  Q -->|Up to two repair passes| B
  Q --> F[Ready for user review or explicit incomplete status]
  A[seenry-assets: scout, contact sheet, crops, type study] --> P
  A --> T
  A --> V
  O[seenry-motion: learning sequence, score, stable anchors] --> P
  O --> V
  O --> Q
  H[Host: browser, code and media tools] --> W
  H --> Q
  R --> REC[Host recorder: artifact snapshots and resource hashes]
  W --> REC
  C --> REC
  Q --> REC
  REC --> F
```

For a narrow fix, enter at the affected decision and verification; research-only requests stop at the requested comparison. Planning does not add an approval pause. For a missing visual capability, visual review stays pending. Actual authoring artifacts, not a final grid overlay, establish wireframe history.

| Package entrypoint | Owns | Does not own |
| --- | --- | --- |
| `seenry` | Brief, reference research, alternatives, layout/type/color, sequence, HCI and review | Invented editorial reasoning, blanket beauty scores |
| `seenry-motion` | Recorded evidence, microinteractions, morphs, scroll scores and lifecycle | Business state, payment/copy success, media rights |
| `seenry-assets` | Source/rights records, fonts, icons, marks, media and crops | Copying reference imagery as a default |
| `seenry-branding` | Identity and guideline research | Unrequested rebranding |
| `seenry-decks` | Ordered slide research and narrative | Invented claims or hidden slides |

No proprietary TALENT.md discovery is required. `SKILL.md` explicitly routes to focused references. Optional stage packets resolve selected files and sibling support with content hashes; native tool reads remain available. Installing files does not force an agent to execute stages. Records and external evidence are how adherence is assessed.

## Migration boundary

Design Judgment's four entrypoints and the old Web Atlas entrypoints (including the interim seenry-usage/seenry-web-design names) retire from local discovery. Their full local contents are archived, not copied wholesale into this public package. Selected original guidance and small motion adapters are maintained here. The old coordinator, asset tools, study archives and benchmark histories remain available in the local migration archive or original source checkout. See [migration](MIGRATION.md).

The MCP endpoint and tool names remain compatible. MCP-bundled skill resources are deployed separately by the server repository; installing this package does not update those server-side documents. Local Seenry 2 instructions are the active package for a migrated client. Updating the server bundle should retain legacy resource IDs as compatibility resources and test new entrypoint retrieval before deployment.

A renamed package, successful installation and a passing schema test are not evidence of improved model taste. Use the frozen, matched [evaluation protocol](skills/seenry/references/evaluation.md) before announcing an improvement or competitor win.

## Execution and diagnosis

The [execution contract](skills/seenry/references/execution.md) connects project needs to stage packets and host tools. Media and motion can be unresolved at discovery; that uncertainty loads their planning guidance instead of silently excluding them. Research, actual image crops and choreography now feed concept selection. `workflow.py` preserves snapshots and checks order, media evidence types, missing capabilities and bounded revisions. It does not lock an arbitrary agent into the workflow or authenticate screenshots.

`asset_studio.py` accepts native-search manifests and supplies a bounded free Met Collection search plus real image crop/flat print studies. It deliberately separates temporary material from production approval. `type_lab.py` and `color_lab.py` compare actual content without inventing premium font or palette rankings. `score.mjs` provides deterministic choreography independent of an engine. The browser adapter creates measurable evidence; motion recordings still need normal-speed review.

The [quality diagnosis](skills/seenry/references/quality-diagnosis.md) targets contextual weaknesses and proposes controlled comparisons. Descriptor overlap flags cross-project convergence for inspection. Human-label coverage and held-out project splits make calibration auditable; they do not constitute a trained slop detector. The [casebook](skills/seenry/references/studies/casebook.md) labels inspected reference observations separately from original teaching exercises.

AGY can run with native host tools using `scripts/flash_trial.py`. If the model-side terminal is denied, preserve that run as blocked. `scripts/flash_stage.py` supports a separate host-rendered diagnostic without retrying the denied command: the model authors returned artifacts and the host runs rendering/tests. Record the different execution mode; it is not an autonomous-workflow pass.

## Visitor-facing quality gate

Planning records are backstage tools. The visitor sees the actual offering, visible work and useful actions. The content-and-finish guide resolves the opening, copy density, enclosure and control emphasis before expanding the grid. Comparison and review packets load a dedicated visual review. Five criteria remain separate; a functional pass cannot offset a failed opening or weak material. The local review_gate.py checks recorded disposition and evidence paths, not visual quality itself. User acceptance remains the final visual gate.

## Evidence and progression in the development candidate

New `workflow.py` runs use schema 4. Wireframe and type judgments assess content, hierarchy and geometry against the exact submitted source hashes. Initial wireframe review includes every planned candidate. A passing direction may advance without repairing discarded alternatives; their source, captures and failed checks remain in history. A rejected direction cannot bypass its earlier checkpoint by reappearing at typography or final comparison. Early narrowing is provisional, and the finished slice can still fail. A layer repair, surface repair and final fix share the two-repair ceiling; a direction reset is available once. The canonical five-criterion comparison still blocks expansion of an unresolved surface. Schema 1–3 histories keep their original rules. These checks establish consistency and progression, not accurate taste.

The [content model](skills/seenry/references/content-model.md) connects actual information to visible, disclosed, inherited or change-only placement. Material gets a task-specific job before its scale is chosen. `visual_inventory.mjs` gives the reviewer rendered labels, styles, geometry and boundary observations beside captures. These can expose a recurring defect that a fluent overall critique misses; there is no automatic slop score. An experimental text-only lesson mode records withheld images to test reference anchoring without silently dropping guidance.

`review_request.py` supplies distinct opening, narrow and full-sequence views, anonymous image filenames, an explicit behavior record and every criterion expected by `review_gate.py`. `reviewer_probe.py` tests order stability and can compare against separately collected human choices. Original mechanical lessons, observed user preferences and unseen evaluation cases have different evidence roles.

The optional focused packet reduces repeated entrypoint text, with the original hash retained. It remains experimental: the sprint produced both a human preference for a Seenry scheduler and a preference for a packing component without appended Seenry guidance. Smaller context and more detailed rules are hypotheses to test, not automatic quality upgrades.

The user rejected both Luna ceramic websites and both image exporters despite functional passes. Model visual judgments also passed these rejected artifacts; stricter evidence gates did not solve aesthetic calibration. The benchmark therefore does not establish consistent website quality. Human rejections stay attached to those exact artifacts and override model-only acceptance. Missing evidence and observed defects also take separate routes: unchanged-source evidence refreshes collect observations; repairs change the product. Neither route reclassifies a rejected result as accepted without a new review.

Code transport accepts complete raw documents or exact hashed patches. The explicit Luna fallback adapter records requested model, image inputs in their actual attachment order, source hashes, events, usage and timeouts. It does not relabel Luna as Flash. Test failures are triaged before they become author repair requests. Native host tools remain the preferred production route.

Review requests also emit an optional response schema. Hosts that support structured responses can constrain candidate IDs, artifact names and criteria at the transport boundary. The disposition check still decides whether the recorded selection is eligible; a correctly shaped but mistaken judgment remains possible. AGY adapters recognize the observed Antigravity sign-in failure and preserve it as blocked-authentication instead of consuming the whole generation ceiling. Private diagnostic logs are excluded from public benchmark evidence.

Selected feedback-motion helpers now enter restricted stage packets as actual authored API/source plus a pinned, hashed runtime manifest. Relative dependencies and licenses must be provisioned by the host; the manifest alone does not establish runtime availability. The exporter feedback lesson stores exact rejected screenshots, source hashes and scoped human reasons. A separate Astra-authored teaching candidate remains outside model-only benchmark outcomes and is not certified by package validation.

For larger systems, `system-design.md` carries shared language, navigation, tokens, components, state ownership and motion across bounded slices. Coverage of the requested screen families and journeys stays separate from slice completion. No large-system generation benchmark was run; routing/record preservation are engineering checks only.
