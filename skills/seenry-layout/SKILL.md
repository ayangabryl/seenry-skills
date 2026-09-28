---
name: seenry-layout
description: "Design or repair interface structure, grouping, density and responsive reading order. Use when a page feels templated, misaligned, crowded, empty, or breaks across widths."
license: MIT
metadata:
  author: Seenry
---

# Seenry Layout

State the reader's task, the available content and the component's host or page viewport before drawing a grid. Preserve useful existing layout relationships in a refinement. A responsive version may reorder presentation, but it must not silently change the decision or hide its action.

## Choose relationships

Group things that are read or operated together: label with control, evidence with claim, choice with consequence. Establish a few alignment anchors and a deliberate reading sequence. Space can carry grouping; add a rule, fill or box only when it makes a relationship clearer. Inspect border endpoints, nested corners and repeated enclosures at ordinary size.

Give the page gutter and grid one owner, then inherit their content edges through header, main sections and footer. Measure those edges and each component's painted child with development rulers; a parent container can align while its inset image or control does not. Resolve unexplained differences at the shared token or component instead of adding per-section offsets. Turn the rulers off to judge optical balance and the subject itself. Use [layout verification](../seenry/references/layout-verification.md) for the measurements and a development-only overlay.

For new work, compare structural alternatives with identical facts: for example evidence first versus choice first, a comparison surface versus a guided sequence, or open composition versus a contained object. A palette or corner swap is not a structural alternative. Identify what each structure helps the visitor understand, and what it costs in scrolling or scanning.

## Exercise the layout

Inspect the actual wide and narrow renders, not a scaled design canvas. Check 320px width, long labels, 200% zoom, text spacing changes, expanded content, keyboard order and sticky or overlay occlusion. Use logical properties for direction-dependent placement where RTL is supported. A clipped label near an image or control is a defect even when the document has no horizontal overflow.

For data-heavy UI, judge density by the task: can people compare values, distinguish current selection and act without losing context? For a landing page, inspect the full rhythm, not only the hero. Each section should answer a new visitor question or add evidence; three equal cards are not a required endpoint.

Record the chosen structure, one rejected alternative and its visible weakness. A clean grid is not proof of a compelling concept. For a full Seenry installation, use [layout anatomy](../seenry/references/craft/layout-anatomy.md) for alignment diagnosis and [layout verification](../seenry/references/layout-verification.md) for rendered checks.
