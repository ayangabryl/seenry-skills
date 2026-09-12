# Design one product across many screens

Use for a product system, multi-screen application or substantial design-system work. A single component stays on the compact path; a campaign website uses its page narrative. Preserve the project's existing domain language, components and working behavior. Consistency does not mean giving every screen the same layout.

## Map the work before the shell

In the existing DESIGN.md, identify people/roles, objects, important tasks, entry points and actual outcomes. Map an ordinary journey and its return/recovery path before choosing a sidebar or dashboard. Include permissions, account boundaries, partial data and unsaved work when relevant. Unknown capabilities remain unknown.

List screen families and their jobs: browsing/comparison, focused editing, overview, detail, settings or a task-specific form. Derive navigation from those jobs. Dense comparable data may need a table; exploratory work may need a canvas; a consequential sequential task may benefit from a focused flow. A large application is not automatically a dashboard plus cards.

Compare three alternatives for the important unresolved journey or shell, not three entire applications. Use the same facts and task. Build and inspect actual wireframes before deciding. Resolve a representative finished slice with real type, data, needed material, controls, narrow behavior and its decisive transition. Check a second contrasting screen family to learn whether the system transfers. An attractive isolated card cannot validate an entire product.

## Keep a shared decision record

Keep one authoritative record and link it from each slice's DESIGN.md. Use the existing repository format; no proprietary file type is needed.

Identify existing brand guidelines, token/component sources and their current version before extending the system. Use **seenry-branding** to codify missing shared identity rules in the existing docs or a project `BRAND.md`; keep journey-specific decisions here. Supply relevant rule content to later contexts and record intentional exceptions instead of silently choosing a new identity per screen.

| Shared decision | A new screen inherits | Variation needs a reason |
| --- | --- | --- |
| Language and action meaning | Object names, verbs, status meanings and recovery conventions | Domain-specific content and useful labels |
| Layout/navigation | Repeated navigation order, anchors, shell behavior and focus return | Screen family, reading order and density |
| Type/spacing | Actual families/weights, semantic text roles, control dimensions and spacing relationships | Display text versus dense numbers; optical adjustments |
| Color/appearance | Semantic foreground/surface/action/status roles and verified state pairs | Data visualization or identity material, with non-color identification |
| Components | Existing API, variants, state ownership, keyboard behavior and stable targets | A documented variant when the existing one cannot serve the task |
| Motion | Trigger/result relationship, stable anchors, interruption and reduced-motion equivalent | Distance, content and journey-specific choreography |

Use semantic tokens and actual shared components where the stack supports them. Reuse a secondary-text role instead of guessing a new gray per screen. Do not add another action color merely because a section looks empty. Distinguish selection, focus, activity, error and availability without giving every state an ornamental badge. Supported appearances and density modes are explicit product decisions, not automatic features or simple color inversions.

## Build connected slices

Give a screen-building context the current task, relevant facts, shared record/version, actual component APIs and selected wide/narrow renders. Include the previous/next screen and transition that affect it. A token file alone loses behavior and hierarchy; the complete conversation wastes context.

Implement a complete path through a few connected states, then extend by screen family. Preserve selections, filters, input and context appropriately when navigating or switching accounts. Check loading, empty, partial, permission-denied, success and recoverable failure where those states can occur. A persistent “Ready” badge is not required to fill a state slot. Completion feedback must follow the real result.

Repeated navigation should retain its relative order unless the user changes it. This supports predictability without requiring identical page content. [W3C consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html). Status messages that do not receive focus need programmatic semantics so assistive technology can announce the change; a visual icon transition alone cannot supply this. [W3C status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

When a shared component changes, identify affected screens and inspect representative uses before applying it broadly. Check long labels, absent data, high/low values, narrow layouts, zoom, text spacing and keyboard paths where relevant. A local improvement may disturb an existing table, modal or navigation shell. Document intended exceptions instead of cloning components to escape their contract.

## Track coverage separately

Track planned, built, exercised and visually reviewed slices separately by screen family, required state, journey, component variant and supported appearance. Whole-system readiness needs coverage of the requested system; a passing slice only supports that slice. Use bounded per-slice budgets with explicit continuation records. Component/website benchmark ceilings do not certify an entire application in the same time.

No large-system generation benchmark has validated this guidance. Portable routing and shared-record handoff can be checked without a large generation run. Assess an actual implemented system when requested; do not infer its usability or aesthetic quality from those engineering checks.
