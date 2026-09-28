---
name: seenry-typography
description: "Design or repair typography in a web or app interface. Use for font selection, display type, hierarchy, wrapping, dense UI text, and type that feels generic despite being legible."
license: MIT
metadata:
  author: Seenry
---

# Seenry Typography

Work from the project's actual words, language support, brand and delivery size. Preserve established type rules unless the task includes changing them. For a narrow repair, inspect the affected screen before proposing a new type system.

## Find the type's job

Name what the reader must notice, understand and act on. List the visible roles: title, evidence, body, metadata, control, status and long-form reading as applicable. A new role needs a distinct information job; a decorative eyebrow that repeats the title is not a role. Record where text sits relative to the product, image or task evidence. On a phone, a beautiful stack of text can still delay the subject.

Inspect the rendered page at ordinary desktop and narrow sizes. Read its actual words. Note line breaks, optical size, width, weight, punctuation, tracking, paragraph measure, wrapping of long labels and fallback rendering. Contrast and semantic heading structure are separate checks; good type needs both, but passing them does not establish a strong direction.

## Choose and compare

For an original page whose type carries the opening, render two materially different arrangements with the same copy and images. Change the relationship of type to material, scale or reading order, not only the font name. Compare both at delivery size. Use a serif, italic, uppercase or wide tracking only when the resulting voice fits this subject and audience. Do not reach automatically for a small tracked eyebrow above a huge serif headline, an italic keyword and a rule. If removal loses no information or identity, remove it.

For an original comparison of how one set of facts supports different reading paths, inspect the [Pondline typography study](references/pondline-study.md). Borrow its decision method, not its surface treatment.

For product UI, prioritize scanning, value alignment and stable state changes. Test the longest realistic value and translated text where supported. Use tabular numerals when values change in place. Verify the downloaded faces actually provide requested weights, styles and glyphs; set CSS through `font-weight`, `font-optical-sizing` and `font-variant-numeric` where those express the intent. Prefer compressed web font formats when supplying web assets. Never claim a font is licensed from a screenshot alone.

## Finish

Inspect the chosen treatment at 100% and 200% zoom, narrow width and with fallbacks. Check that actions remain readable, text can expand and no title overwhelms its subject. Record the rejected alternative and the visible reason. For deeper implementation mechanics in a full Seenry installation, use [the type guide](../seenry/references/craft/typography.md).
