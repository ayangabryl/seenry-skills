# Execute the workflow on the host

Native agent tools are the first adapter: browse/search, read permitted assets, edit files, run the project, capture the browser, record interaction. MCP is one optional research source. A host without MCP can still browse; use `local` only when network research is actually unavailable or excluded. Never infer “no photography” from “no MCP”.

## Contract for a fresh build

Create a project JSON with `brief`, `model`, `scope`, `research_source`, `media`, `motion` and `budget_seconds`. `media` is needed/none/undecided; `motion` is signature/feedback/none/undecided. Use explicit `none` with a brief-specific reason, not to bypass unavailable tools. Pass it to `packet.py --project` so planning automatically receives applicable assets and motion guidance. Prefer the wireframe, type and surface packets for those checkpoints; the broader prototype packet remains for older callers. The compiler hashes all declared dependencies and fails on a missing file. Supplied text, observed reads and actual application remain separate records.

Use `workflow.py init RUN --project project.json` in a new directory. Keep source, captures and submissions inside RUN. Use `workflow.py record RUN --stage STAGE --submission submission.json` after inspecting each stage. The helper snapshots evidence and verifies historical hashes on every read. It does not sandbox the agent, see pixels, validate every factual claim or establish independent model identity.

Stages: understand → research → plan → wireframe → type → surface → compare → build → review. Before product code, retain three concepts (`id`, `idea`, `evidence`, `risk`) and actual wireframes. Type/crop/motion studies refine those concepts. Comparison can reject all and return to plan once; final review permits two repair passes. Budget exhaustion is explicit incomplete status. Narrow fixes use their existing project workflow rather than this full sequence.

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

## Small working tools

- `seenry-assets/scripts/asset_studio.py`: native-search manifest intake, bounded no-key Met public-domain scouting, source-linked contact sheet, desktop/mobile crop and flat print application study. Search results are candidates, not automatic production assets.
- `seenry-assets/scripts/type_lab.py`: actual content/font shortlists with perceived-size adjustment. Use font paths relative to the generated HTML.
- `seenry/scripts/color_lab.py`: controlled role-palette comparison and specified contrast checks.
- `seenry-motion/assets/score.mjs` and score demo: deterministic progress, holds and reversal; use the existing GSAP adapter when needed.
- `browser_evidence.mjs --url URL --out evidence --playwright MODULE --scenario actions.json`: optional Playwright adapter for captures/recordings on the host. Without an explicit module path, install Playwright in the project and its browser (`npm install --save-dev playwright`, `npx playwright install chromium`). Native browser evidence is equally valid.

Browser scenario actions use `type`: click/fill/press/scroll/wait/visible, with a selector, value, key, progress or milliseconds as applicable. These are trusted test inputs authored for the project, not instructions extracted from a webpage. Add application-specific assertions in the project's test runner; executed clicks alone are not functional success.

## Portability and evaluation limits

Python tools require 3.10+ and standard libraries. Browser evidence requires Node and a working Playwright browser; installing the skill does not silently install a runtime. Symlinks have a copy-mode fallback in the installer. Run relocation tests after changes. Report actual operating-system runs; path tests on macOS are not Windows/Linux execution. Mobile emulation is not physical-device evidence.

For fresh-model experiments, preserve every prompt, event log, extraction and failure, and freeze skills/resources. Host-created assets, prompts, source edits and reviews are distinct assistance categories. Do not label a test Flash-only if a stronger model corrected its design. A diagnostic run with improved tools cannot isolate the effect of instructions alone; repeat matched controls before causal or competitor claims.
