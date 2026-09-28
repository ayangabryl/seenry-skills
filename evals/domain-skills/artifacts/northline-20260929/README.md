# Northline consumer trial — 29 September 2026

This fresh local brief asked a Seenry consumer to design a fictional skipper's forecast comparison page. The agent read the published 2.1.0 core and chose product craft as its primary track. It inspected two Seenry captures as relationships, then rendered two early structures: a selected-harbor instrument (A) and a three-harbor comparison ledger (B). The final prototype is original sample content and lives in `prototype/`; run that directory over HTTP to exercise it. No external imagery or code from the inspected sites is bundled.

## Chronology and independent dispositions

| Checkpoint | Result | Evidence and boundary |
| --- | --- | --- |
| Early studies | **Revise** | Four wide/narrow captures. B exposed all three choices but dropped the mobile return-time label and relied on color for selection. A hid competing windows. The review favored B after repair. |
| First complete page | **Revise** | `first-wide.png` and `first-narrow.png`. The agent restored “Return by” locally, but the final timeline tick clipped and selection still had no non-color cue. A separate 390/320 Playwright check measured document scroll widths of 403/337 px. |
| First repair | **Revise** | Selection text and the timeline boundary were fixed. A fresh 1440/390/320 full-page review then found that mobile rows still lacked a local “Best window” label and that the forecast counter/title compressed at 320 px. |
| Second repair | **Keep** | `final2-1440.png`, `final2-390.png`, `final2-320.png`, and `final2-outer-320.png`. Local labels, an intact counter and a deliberate small-screen status row resolved the pictured findings. The final source is parent-assisted after the first repair. |

The direction and full-page reviews were separate Codex CLI contexts, run outside the consumer's workspace sandbox and bound to image and brief hashes. The consumer's nested direction review returned Unverified because its CLI could not initialize inside that sandbox. The trial prompt explicitly requested a first-complete-render checkpoint, so the consumer continued to that checkpoint with provisional direction. A passing final static review is not first-pass prevention or broad design consistency.

## Browser evidence

External Playwright checks confirmed that harbor switching updates the selected name, window, wind, swell, tide, return time and status, that Enter activates a focused harbor, rapid reversal returns to the right state, and the CTA reaches the detail section. After the final repair, `document.documentElement.scrollWidth` equaled the CSS viewport at 1440, 390 and 320 px; the 12:00 label ended at the chart's right edge. Reduced-motion emulation set `scroll-behavior: auto`. These checks do not establish screen-reader behavior, 200% zoom, measured contrast, touch behavior or motion quality at normal speed.

The first browser exports were narrower than their requested CSS viewports because Chromium's full-page screenshot omitted scrollbar pixels. They remain unmodified first-pass evidence. The four `final2-*` images were captured through CDP with explicit pixel clips at their measured CSS widths, without padding or scaling; `final2-outer-320.png` shows the alternate selected state. `manifest.json` records hashes and actual pixel dimensions.
