---
name: seenry-assets
description: "Source and integrate images, fonts, provider marks, icons, illustration and video with provenance and responsive fallbacks. Use when a design needs actual brand assets or deliberately composed visual material."
license: MIT
metadata:
  author: Seenry
  version: "2.0.1-dev.1"
---

# Make assets serve the subject

MCP is optional. With no network, work from supplied licensed assets and installed font/icon packages. Keep manifests and inspect local crops normally. Use a clear text action when a nonessential icon is unavailable; never fabricate a real provider mark. External source links below are optional acquisition routes, not runtime dependencies.

Define the asset's job before searching: what it helps a visitor understand, its role in the composition, focal point, light/material, crop and whether it is factual evidence or illustration. A visually elaborate shape that could advertise anything is weak evidence of art direction. No image may be the right choice.

Load [material production](references/material-production.md) while planning an image-led or unresolved concept. It provides actual candidate search, crop/contact-sheet tooling, temporary-image and mockup stages, and replacement criteria. The `scripts/type_lab.py` tool renders font shortlists with real copy and perceived-size adjustment. Use these studies before locking the direction; a blank HTML box cannot pass material review.

## Resolve real identity first

For a named AI provider, company or product, obtain the genuine mark from the owner or a verified permitted collection. Verify the variant on the actual surface. Do not replace a provider mark with a sparkle, letter, emoji or hand-drawn approximation. Use established control icons such as Lucide or Phosphor; check licensing, optical weight, filled/outline variants and legibility at the rendered size. Custom SVG illustration is separate from conventional control iconography.

For actual products, work, teams or customer evidence use supplied or authorized material. Generated concepts must not masquerade as real client work or endorsements. For atmosphere or metaphor, source or generate a subject-specific visual. A reference library's public screenshot is not permission to ship the depicted asset.

## Source, shortlist, inspect

Seenry references can establish composition and art direction. Asset acquisition still needs an exact item page, author, usable variant and rights evidence. Use available native search/image tools or provider APIs. Avoid an indiscriminate scraper and do not bypass access controls. A CDN URL or search thumbnail alone is insufficient provenance. Check selected items' current licensing, attribution, modification and redistribution conditions before shipping. Free acquisition is not unrestricted rights.

Public starting points include [Unsplash](https://unsplash.com/license) and [Pexels](https://www.pexels.com/license/) for photography, [Poly Haven](https://polyhaven.com/license) for HDRIs/materials/models and [Google Fonts](https://fonts.google.com/knowledge/using_type/using_fonts_with_a_license) for font licensing guidance. These are discovery routes, not blanket approval of an asset. Keep exact source and license records. Do not require a prompt subscription or image generator when suitable sourced media or original code illustration works.

When generating, use the host's available tool and its instructions. Do not invent Imagen, credentials, free tiers or capabilities. In a benchmark where generation is excluded, preserve that condition. For ASCII image/video/GIF conversion use the published **asciify-engine** package and read its installed skill when available. Do not hand-roll conversion by default. Inspect text readability, cell aspect, luminance mapping, device-pixel behavior and reduced-motion fallback.

## Typography and moving media

Render shortlisted fonts with actual headings, labels, long text, numerals and punctuation at comparable perceived size. Verify supported languages, weights, features and fallback metrics. [Inter](https://rsms.me/inter/), [Nunito](https://github.com/google/fonts/tree/main/ofl/nunito) and [Open Runde](https://github.com/lauridskern/open-runde) have different character and supplied files; do not assume interchangeable coverage or italics. A font name does not establish premium execution.

Use SVG for purposeful vector illustration, Lottie for appropriate authored sequences, video for footage and 3D for spatial interaction when a proof demonstrates acceptable quality. Inspect Lottie bounds, assets, loop endpoints and actual player compatibility. A poster cannot establish timing. Use **seenry-motion** for recording study, motion direction and implementation. Heavy media needs intrinsic dimensions, a coherent poster/fallback and input that remains usable while loading.

Put candidates in the real layout. Compare desktop/mobile crops, copy contrast, focal visibility, collection coherence and neighboring sections. Reject an attractive image if it fails its job. Keep required attribution with the shipped work. Record each selected item's source, author, license/permission evidence, intended use, modifications, local file, bytes and fallback in the existing manifest or `asset-manifest.json`. Keep analysis-only reference media out of production. A manifest is provenance evidence, not automatic legal or visual certification.

## Read the interface, not the distribution bundle

Use [material review](references/material-review.md) to check the selected material in the actual interface without repeating the acquisition workflow.

For a bundled font or icon runtime, use its version/license manifest and the documented API or small authored adapter. Do not print a minified library, font binary, source map or entire generated icon catalog into the model context. A short line-based read can still dump hundreds of kilobytes from a one-line bundle. Look up only the required icon names or inspect the rendered result; reading the entire vendor file does not establish correct use. Keep reference research and source-code inspection tied to the current decision.
