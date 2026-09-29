# Seenry architecture

## Why 3.0 looks like this

Version 2 split design into seventeen skills and wrapped original work in a checkpoint pipeline (frozen briefs, paired direction studies, CLI review gates, hashed packets). The process was rigorous, but the output still read as generic because the agent was never given concrete values: it was told to compare, review and verify, not what a good button, card or page shell measures. Specialist skills were also rarely loaded when needed.

Version 3 inverts that. The main skill carries the system itself: allowed values, layered component construction, page shells, measured benchmarks and an explicit anti-slop list. Process becomes a studio loop: brief, research, frame, material, explore three compositions inside the frame, critique, refine, verify on pixels. The frame gives consistency; exploration gives quality. The 2.x pipeline remains in git history at the `v2-archive` tag.

## Skills

- `seenry` owns building web interfaces, pages and components. Everything the specialist skills used to cover (typography, color, layout, craft, writing, accessibility, imagery) is a reference file it loads on demand.
- `seenry-assets` owns material: sourcing license-clear images, icons and fonts, generating images when a model is available, and provenance.
- `seenry-review` owns judgment: screen reviews, diff reviews, stress tests and explanations, all reported in one ranked table against the same system.
- `seenry-motion` owns behavior over time and ships runnable, tested motion assets.
- `seenry-apps` owns native mobile screens and flows with platform metrics.
- `seenry-branding` and `seenry-decks` own identity and presentation research.

## Consistency mechanism

1. `tokens.css` (or the project's tokens) defines every allowed value.
2. `DESIGN.md` records tokens, the page shell, one spec card per component, references studied and rejected directions. Every later task reads it first.
3. The system audit measures what actually rendered, so drift is visible as numbers: extra font sizes, stray weights, off-grid spacing, non-concentric corners.

## Evidence

Seenry MCP is optional. When connected, the agent studies 3–6 references per decision and records measured relationships in a reference card. Without it, the bundled benchmarks carry measured values from 24 leading sites. A screenshot proves one state at one width; motion and interaction need a recording or a live check.
