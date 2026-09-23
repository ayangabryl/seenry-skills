# Form recovery and distinct outputs

The complaint was valid: bundled form guidance was not visible in the showcase, and variants mostly changed the presentation of identical content.

## Applied changes

- SignupExperience implements empty/invalid/editing/pending/failure/retry/local completion. Visible labels, input descriptions, first-invalid focus, password reveal, duplicate-submission guard, preserved input, explicit simulation disclosure, no network/storage. Small field motion respects reduced motion. This is a local frontend example, not authentication.
- Core Fieldwork remains the introduction-led design.
- Skill stack is now a project catalog with saved ideas and an inquiry prefill; choices survive filtering. Native inquiry cancellation keeps unfinished input.
- MCP is an editorial masthead and photographic spread, with individual design-intent dialogs. Previously inspected Arc Projects and Goa Architecture screenshots support image emphasis and typography scale. These static captures provide no motion evidence. Stock photography remains credited mood imagery, and projects remain fictional illustrations.

## Self-review

Vite build passes. Skill validation passes. Browser checked empty signup errors, first-invalid focus, correction, simulated failure, preserved values visible in screenshot, retry to local completion; project saving and inquiry prefill; project detail disclosure; signup at 390px. Gray/white shell and shallow dark primary retained. This pass does not establish real signup security, delivery, production backend behavior, or objective superiority of MCP over skills alone.
