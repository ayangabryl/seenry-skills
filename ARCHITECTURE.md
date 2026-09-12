# Seenry architecture

Seenry turns a brief into design decisions and working evidence. The host supplies code, rendering and available research tools. MCP is an optional source of reference evidence. No layer certifies aesthetic quality automatically.

## Ordinary design work

```mermaid
flowchart TD
  U[User request and existing product] --> S{Scope}
  S -->|Research| R[Inspect relevant evidence and answer]
  S -->|Narrow fix| F[Inspect affected state and correct its cause]
  S -->|New design or substantial redesign| B[Brief and compact DESIGN.md]
  B --> E[Available references and actual material]
  E --> P[Three layout or interaction ideas]
  P --> W[Small working wireframes]
  W --> C[Inspect and retain one direction]
  C --> T[Real typography, color, assets and decisive transition]
  T --> Q{Does the finished slice work?}
  Q -->|Observed defect| D[One targeted comparison or repair]
  D --> T
  Q -->|Missing evidence| O[Exercise or capture the existing result]
  O --> Q
  Q -->|Current slice clears review| I[Complete requested states and screens]
  I --> V[Visual and interaction review]
  F --> V
  V --> H[User review with unresolved work stated]
  G[Relevant decision guides] -.-> P
  G -.-> T
  M[Optional MCP or public/local evidence] -.-> E
```

Planning precedes product code. Three small working alternatives establish actual layout differences; only the retained direction receives deeper finish. Type, palette, boundaries and motion are decided on real content before expanding the design. Palette comparisons keep composition fixed. Narrow fixes do not restart the sequence.

The ordinary record is DESIGN.md plus source and relevant captures. Do not require model metadata, benchmark manifests or a sequence of separate agent runs for every design task. A complete project still needs usable states and rendered review. Use one direction reset and up to two repair passes before reporting unresolved work.

## Responsibilities and progressive reading

| Layer | Owns |
| --- | --- |
| `seenry` | Scope, product truth, layout exploration, shared decisions and review |
| `seenry-assets` | Actual fonts, marks, icons and material, crops and usage rights |
| `seenry-motion` | Behavior, anchors, feedback, interruption, choreography and lifecycle |
| `seenry-branding` / `seenry-decks` | Identity research / ordered presentation research |
| Host | Available tools, permissions, running code and inspecting output |
| Optional recorder | Evidence chronology and hashes, never an aesthetic verdict |

Read the entrypoint, then only the guide that answers the current unresolved decision. Keep advanced API references and examples available without inserting them into every task. Required runtime source, relative dependencies and licenses remain complete whenever a helper is selected. A compact packet must not omit an actual implementation dependency.

Keep research notes and provider accounting outside the default skill payload. The [context-efficiency study](docs/context-efficiency.md) documents actual skill loading, cache limits, full-handoff measurements and the accepted-output cost criterion. Runtime guides stay focused on making the interface.

## Optional model handoff and experiment path

Load [execution](skills/seenry/references/execution.md) when a restricted host, explicit recorder or requested benchmark needs it. New packet/handoff CLI calls default to the focused profile. Existing Python `compile_packet` callers retain the complete-profile default; explicit `--profile complete` is available. Frozen past run records and the v2.0.0 release preserve previous evidence.

Research routing is resolved once: explicit argument → project research_source → auto. Explicit local-only requests stay local. Missing MCP does not silently disable ordinary browsing. Review receives a short motion/material contract when those needs are present. Anonymous review uses `review_request.py` so creator positioning does not enter the critique.

Focused packets preserve project decisions and source hashes, and load teaching examples only for an explicit unresolved topic. They expose their resource count, word count and UTF-8 byte count; those measurements exclude project/source/image payloads and are not token or speed claims. Selected runtime files are hashed and staged separately. No content is truncated to meet a size target.

## Diagnose before spending another generation

First identify the failure layer: wrong scope or facts; weak layout/idea; unresolved type/color/material; broken behavior; or missing observation. Record what is visible, why it affects the task, the proposed cause and the smallest useful correction. Collect missing evidence with source unchanged. Do not fix a weak idea by repeatedly changing borders or adding an effect.

Validate structure cheaply before generating more designs: scope routing, source precedence, bounded generic guidance, helper/dependency completeness, relocation and full review criteria. Then use one fresh representative task for the changed behavior. A broad blinded benchmark is for an actual performance claim or a new generalization question, not every documentation edit. Skill engineering does not retrain model weights. Faster delivery and passing structural checks do not establish better taste; human outcome evidence remains mixed.

### Local structural check, 2.0.1-dev.1

For the same `scope: component`, `media: none`, `motion: feedback`, `research_source: local` surface packet, v2.0.0 supplied 10,426 resource-body words with its old complete CLI default, or 7,186 with its optional focused profile. The revised focused default supplies 1,948. This counts resource text only; it does not measure token cost, generation time or visual quality. Explicit topic studies and selected implementation dependencies can legitimately increase the packet.

137 Python tests and the package validator pass locally on macOS, including real review-request routing, missing-dependency failures, source hashes and relocated resources. An independent planning-only desk-booking task preserved the host identity, proposed three structural alternatives and marked all implementation/visual checks pending. It also revealed an unnecessary full color-guide read; offline guidance now makes that read conditional. No new broad model benchmark or cross-platform runtime verification was performed for this revision.
