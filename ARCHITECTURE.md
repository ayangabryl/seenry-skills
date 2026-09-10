# Seenry architecture

Seenry owns the design process. The optional read-only MCP supplies additional evidence. Bundled guides and local studies keep the process available without it. The host supplies browsing, implementation, rendering and available model capabilities. Project records preserve decisions and measured results. None of these layers automatically certifies visual quality.

```mermaid
flowchart TD
  U[User brief and existing project] --> S[seenry: scope and product truth]
  S --> R[Select an available evidence route]
  M[Optional Seenry MCP: inspected references and reviews] --> R
  L[Local studies, supplied files or public sources] --> R
  R --> E[Separate observation, curator reason and inference]
  E --> P[DESIGN.md: three concepts and provisional visual systems]
  P --> W[Working wireframes]
  W --> T[Actual typography and content]
  T --> V[Controlled surfaces, assets and interaction proofs]
  CL[Local color lab: same content, different role palettes] --> V
  V --> C{Rendered comparison}
  C -->|One direction reset| P
  C -->|Select| B[Build complete sequence and states]
  B --> Q[Functional, visual and motion review]
  Q -->|Up to two repair passes| B
  Q --> F[Ready for user review or explicit incomplete status]
  A[seenry-assets] --> T
  A --> V
  O[seenry-motion] --> V
  O --> Q
  H[Host: browser, code and media tools] --> W
  H --> Q
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

Design Judgment's four entrypoints and the old Web Atlas entrypoints (including the interim seenry-usage/seenry-web-design names) retire from local discovery. Their full local contents are archived, not copied wholesale into this public package. Selected original guidance and four small motion adapters are maintained here. The old coordinator, asset tools, study archives and benchmark histories remain available in the local migration archive or original source checkout. See [migration](MIGRATION.md).

The MCP endpoint and tool names remain compatible. MCP-bundled skill resources are deployed separately by the server repository; installing this package does not update those server-side documents. Local Seenry 2 instructions are the active package for a migrated client. Updating the server bundle should retain legacy resource IDs as compatibility resources and test new entrypoint retrieval before deployment.

A renamed package, successful installation and a passing schema test are not evidence of improved model taste. Use the frozen, matched [evaluation protocol](skills/seenry/references/evaluation.md) before announcing an improvement or competitor win.
