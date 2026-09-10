# Apply HCI to the actual decision

## Choose relevant evidence

Read during research/planning and when an observed usability problem needs explanation. HCI (human–computer interaction) and Apple's HIG (Human Interface Guidelines) inform behavior and evaluation; neither is a universal visual style. Use the target platform's current guidance for its controls, input methods and accessibility. Do not import an iOS measurement into web CSS without checking its units and context.

Maintain a small source map, not a claim to have read every HCI book:
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines): platform conventions; consult the specific [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) and [motion](https://developer.apple.com/design/human-interface-guidelines/motion) pages for the chosen interaction. Motion should communicate a relationship and adapt to accessibility preferences. Apple-like does not mean beige, glass, a font preset or an imitation of Apple's site.
- Don Norman, [The Design of Everyday Things](https://jnd.org/books/the-design-of-everyday-things-revised-and-expanded-edition/): conceptual models, discoverability, signifiers, mapping and feedback. Ask whether people can predict the action and interpret its result. The author page is an entrypoint; retrieve an authorized relevant excerpt before attributing a precise passage.
- Shneiderman et al., [Designing the User Interface / author's Eight Golden Rules](https://www.cs.umd.edu/users/ben/goldenrules.html): consistent behavior, closure, reversal, error prevention and user control. Apply these to complete paths, not only screens. The author explicitly requires adaptation to the domain.
- Rogers, Sharp and Preece, [Interaction Design: Beyond Human–Computer Interaction](https://www.wiley-vch.de/en/areas-interest/computing-computer-sciences/interaction-design-978-1-119-90109-9): use the publisher's contents to find requirements, conceptualization, prototyping and evaluation material appropriate to the question. A table of contents is not a full-book study.
- [Nielsen's heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): inspect status, real-world language, recovery and recognition. Heuristic evaluation finds plausible problems; it is not a usability study or an aesthetic score.

When live retrieval is unavailable, apply the concise principles with the limitation recorded. Do not invent book quotes, page numbers, usability findings or eye-tracking results. These source entrypoints were checked September 2026; recheck changing platform/API details when implementing.

## Turn a principle into a design decision

In the existing DESIGN.md, record only the consequential relationships: **person/task → likely difficulty → principle/source → concrete choice → observable check**. Usually two or three suffice; do not add a ritual checklist to every button.

Example: a visitor compares overlapping tools. Hiding one description at a time creates a memory burden. Keep the selected tool and Seenry's scope visible together; offer all-source access. Check whether each distinction is understandable without remembering another panel. An accordion saves height but is not automatically the best comparison mechanism.

Example: an exploratory 3D studio lets visitors open project objects. Preserve a visible project index and a return path to the same selection. The 3D scene adds spatial context; it must not be the only way to identify or open work. Verify keyboard access, interruption and context restoration.

Use proximity, alignment and common region to clarify relationships; do not stack outlines when space already groups the content. Keep frequently used targets stable and reachable. Reduce irrelevant simultaneous choices through meaningful grouping, not a mythical fixed item limit. Do not turn Fitts's law, Hick–Hyman law or “7±2” into universal pixel counts, maximum menu sizes or fabricated completion-time predictions.

## Evaluate behavior and expression separately

Exercise a first encounter, ordinary completion, a mistaken action and recovery. Check whether the person can discover the action, understand the resulting state, reverse it where appropriate and retain valid work. Include keyboard, touch, zoom/reflow, text-spacing and reduced motion. State whether evidence is an author inspection, automated assertion, fresh heuristic review or actual participant observation.

Then review art direction independently: specificity, composition, material, typography and expressive range. Familiar controls can be correct inside an original composition. A usable accordion/table is not intrinsically AI slop; using it by reflex can flatten a site whose purpose deserves a more revealing form. HCI supports the experience, but cannot certify originality or premium taste.


## Curated studies and transfer limits

These short studies separate source observations from this toolkit's application. Source documents were inspected on 2026-09-09; they are not full-book ingestion or participant research.

| Study | Observed guidance | Seenry application / check | Transfer limit |
| --- | --- | --- | --- |
| [Apple appearance](https://developer.apple.com/design/human-interface-guidelines/dark-mode) | Native appearance should respond to system choices; assets and foregrounds need inspection in each supported appearance. | Declare appearance policy before styling; exercise live preference changes and overlays. | A native-app recommendation is not an automatic requirement for a two-theme campaign website. |
| [Apple motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Feedback should be brief, understandable and cancelable; frequent interactions should avoid unnecessary motion. | Repeat the primary interaction ten times, reverse midway and compare a quieter version. | These principles do not prescribe a spring, easing curve or a duration for every control. |
| [Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | The document distinguishes platform contexts, including gaze interaction in visionOS. | Record target platform beside shape/target choices; keep web hit testing separate from the drawn silhouette. | Do not generalize visionOS capsule and gaze-spacing advice into a universal web style. |
| [Shneiderman](https://www.cs.umd.edu/users/ben/goldenrules.html) | Consistency, informative feedback, closure, reversal and control are domain-adapted principles. | A reversible selection commits promptly; dismissal restores context; successful completion reflects actual task state. | Consistency inside a product does not justify repeating one visual template across unrelated brands. |
| [Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/) | Recognition, relevant information and constructive recovery reduce avoidable usability problems. | Keep comparison facts visible together; retain valid input after an error; remove competing explanation. | Minimal information is not a prescription for monochrome or sparse typography. |
| [W3C interaction animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Nonessential interaction-triggered motion can be disabled; SC 2.3.3 is Level AAA. | Provide a stable equivalent that preserves the action and information. | Reducing motion does not permit removing the result or calling every fade essential. |

Use the study that changes the decision. For additional books, retrieve a relevant authorized chapter rather than collecting titles. Keep the source's platform, participants or evaluation conditions attached to any claimed finding. [Response-time research](https://www.nngroup.com/articles/response-times-3-important-limits/) concerns responsiveness, not a universal animation-duration token system.
