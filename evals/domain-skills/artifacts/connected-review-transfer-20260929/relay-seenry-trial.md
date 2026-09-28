# Relay forward test — 2026-09-29

## Scope and isolation
Built a fictional responsive team-scheduling landing page in `/private/tmp/seenry-scheduler-transfer-20260929`. The Seenry skill repository was read-only during this trial; `git status --short` was empty at its `b5aaac14d1b2178d09c0c56fedc6b02b5ed653af` commit. No production system, calendar, invitation service, or external destination was modified. Tool usage and model token cost were not reported by the host, so they remain unknown.

## Exact guidance accessed
The current entrypoint was `/Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry/SKILL.md` (SHA-256 `e30749ade9c992014be62de3645001996ae3f377fe1aad3eece4c339f40c9e60`). Also accessed:

| Guidance | SHA-256 |
|---|---|
| `references/product-craft.md` | `551994ebee9c1e66eb8b62327f524f3ce71f6fef7e4345f65b50d934ef114a47` |
| `references/interaction-components.md` | `77b5fd1fc1818c33ce359f751af231ab9aeffad0301b4a89d0f61292228819f6` |
| `references/anti-defaults.md` | `93be8d68866f77ceba9db64de7de915b96396c0474ab934ee189c88188534b6f` |
| `references/fact-action-integrity.md` | `dcfa66fc61fe453c0856599ee38857ef40681b4059056e0d4d036eb593643abf` |
| `references/layout-verification.md` | `4f21f121ac5f1e9cd4b90e719ada9d1ff48d4ded4f97113121a8fb71756f65e5` |
| `references/delivery-checks.md` | `d2d2d7dea65e4cd546d5e42316b419aecd4cfc5e695a4138e9647882d2ba4932` |
| `references/evaluation.md` | `1999769ebf2ca0f9dec76cea50205426e6b7311b49ac57193380af1c4cfb3d99` |
| `references/reference-transfer.md` | `0dbff865c1bf3cbd2f2cf1573e60f1170d9a6ac7276586fec11f56b3f9d50e58` |
| `../seenry-typography/SKILL.md` | `27fb13c4ad22239d99221cd1f0d150480ce8c969fcc36a33daeb67388ba3a5b0` |

The first multi-file guidance output was truncated by the tool; full contents of every listed reference were not independently visible in this trial. The Seenry entrypoint, Typography skill, fact/action integrity, delivery checks, and evaluation were visible in full. Gate scripts were inspected and executed. No Seenry MCP or external visual reference was used; the supplied scheduling facts were sufficient for the deciding region.

## Stage history and verdicts
1. Locked factual and action constraints in `DESIGN.md`. Times remain UTC because no calendar date was supplied for reliable local-time conversion.
2. Built complete first implementation A (`evidence/first-complete/source/`) and captured `evidence/first-complete/captures/{wide,390,320}.png` before inspecting or repairing it. It used a shared comparison matrix and a local result action.
3. Built Study B (`study-b.html`, `study-b.css`) with candidate-by-candidate summaries; captured both studies at wide and 390 px. `evidence/direction-gate/summary.json`: **Keep**, selecting B. A 320 px inspection showed A hid participant names, so its narrow comparison was rejected.
4. Expanded B into the final page and captured default, selected, and confirmed states at wide, 390, and 320 px.
5. `evidence/first-screen-gate/summary.json`: typography **Revise** because phone participant location and status text was about 10 px; whole-screen **Keep**. Repaired phone labels to 12 px and retained names, cities, zones, and status text at 320 px.
6. `evidence/first-screen-gate-repaired/summary.json`: typography **Keep**, whole-screen **Keep**. `evidence/full-page-gate/summary.json`: whole-screen **Keep**.

These are model review verdicts on supplied captures, not user acceptance.

## Interaction and source checks
`evidence/interaction.json` records Playwright/Chrome checks at 1440, 390, and 320 px. At each width, Tuesday and Wednesday reported the two unavailable people and left confirmation disabled; Thursday reported all four available and enabled confirmation; confirmation reported a choice on this page only and no invitations sent. Enter on a focused candidate selected it, and changing from the confirmed Thursday state to Tuesday and back to Thursday reenabled the valid action. Document overflow was false at all three widths. Reduced-motion CSS resolved scroll behavior to `auto`.

`semantic_names.py` found no generic-element ARIA-name issues. `token_contrast.py` found one remaining approximation warning for the result kicker, which sits on a dark result surface; the actual opaque pair passed at 7.725:1 (`evidence/contrast.json` and pair check output in this report). The other reported direct pairs passed after repair. Browser captures were inspected at wide and 320 px; complete default, selected, and confirmed captures are in `evidence/`.

Action inventory: header “Compare times,” result “Compare again,” closing “Review the candidates,” and logo link navigate to in-page anchors; each “Select” button changes local state; “Use this time” records a Thursday choice only on the current page. No fake external action is offered.

## Final source and limits
Final editable files are `index.html`, `styles.css`, and `app.js`, frozen as a duplicate in `evidence/final-source/`; hashes are in `evidence/final-source-sha256.txt`. Run locally with `python3 -m http.server 8767` in this directory. Chrome rendering was tested; Safari/Firefox, assistive-technology speech output, touch hardware, and 200% text zoom were not exercised. The sample has no date, so local wall-clock times are intentionally omitted. The demo has no persistence or calendar integration.
