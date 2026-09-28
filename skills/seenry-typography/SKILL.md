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

For an original page whose type carries the opening, render two materially different arrangements with the same copy and images. Change the relationship of type to material, scale or reading order, not only the font name. Compare both at delivery size. Use a serif, italic, uppercase or wide tracking only when the resulting voice fits this subject and audience. If one candidate fixes an image or layout problem by using a familiar editorial type treatment, repair the other candidate or make a third; a weak alternative does not make the trope distinctive.

Judge the **combined signature**, not each text element in isolation. A tracked all-caps kicker with a short rule, a large headline with one contrasting italic serif phrase, and a small literary image caption form a recognizable editorial preset even when each piece can be given a plausible explanation. For an original site without established brand evidence for that treatment, mark the stack for revision. Remove or substantially recompose it and check whether the subject, task or identity loses anything specific. This is not a ban on serifs or italics; they can carry prose, records or an existing brand when their role is earned.

Do not treat a subject category as that evidence. “Calm plant studio,” “considered wellness brand,” or “premium architecture practice” can describe thousands of large soft-serif openings. A plain category label above a large serif headline with one colored phrase is still a familiar preset even without italics or a rule. For an undefined or fictional brand, compare it with a direction organized around the actual task or subject material; require a visible advantage beyond genre mood before retaining it. In review, describe the whole type silhouette and the decision it helps, rather than praising a familiar font as fitting the category.

For an original comparison of how one set of facts supports different reading paths, inspect the [Pondline typography study](references/pondline-study.md). Borrow its decision method, not its surface treatment.

For product UI, prioritize scanning, value alignment and stable state changes. Test the longest realistic value and translated text where supported. Use tabular numerals when values change in place. Verify the downloaded faces actually provide requested weights, styles and glyphs; set CSS through `font-weight`, `font-optical-sizing` and `font-variant-numeric` where those express the intent. Prefer compressed web font formats when supplying web assets. Never claim a font is licensed from a screenshot alone.

## Finish

Inspect the chosen treatment at 100% and 200% zoom, narrow width and with fallbacks. Check that actions remain readable, text can expand and no title overwhelms its subject. Inspect the next section too: removing a stock type treatment from the hero does not resolve it if the same treatment appears immediately below. Record the rejected alternative and the visible reason. For deeper implementation mechanics in a full Seenry installation, use [the type guide](../seenry/references/craft/typography.md).
