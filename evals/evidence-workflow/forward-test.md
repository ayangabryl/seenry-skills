# Bench held-out forward test — 2026-10-14

Working prototype: `index.html`, served at http://localhost:5197. Plain HTML/CSS/JS, no dependencies, requests, analytics, storage or backend. Server binds loopback only. Compare `?mode=note` with `?mode=steps`. This experiment does not alter production or the guide.

## Job and hypothesis

Entry: rider knows a sensation, not a repair. Decision: describe the sensation and choose an illustrative inspection slot. Action: review the note and what inspection means. Result: local demo completion, explicitly no booking made. Recovery: revise symptom, return to slots, discard a revision, or cancel draft with a reversible escape before clearing.

The expensive uncertainty is whether correcting the symptom changes the appointment context or commits to a repair. Hypothesis: keeping the selected inspection slot visible during correction lets the rider verify that context without returning to the slot selector. This is an adaptation of familiar inline editing, not a claim to have invented a novel interaction. No diagnosis, fixed price or repair completion time is promised.

## Evidence actually inspected

One connected Seenry research_design_brief call, queries “booking review” and “appointment”, two deep reads and two unique inspected sources. R1 amma Add Doctor Appointment, index 58; R2 Medisafe Appointment Name, index 46. Full details and stable source links are in `.seenry/refs/kept.md` and `manifest.json`; actual inline pixels saved locally. No other sources or benchmark results read.

Observed: R1 shows date/time and comments together. R2 shows one question and Next. Inferred: co-presence can support context checking; sequential questions may simplify initial entry. Proposed: a combined note with inline correction, against a sequential flow using identical words and slot choices. Unknown: all source behavior, keyboard, saving, conversion and design superiority. The booking-review search angle was weak; the selected references do not establish booking-review behavior.

## Smallest useful alternatives

A — familiar sequence: symptom → slots → review. Correcting from review returns to symptom, then slots, then review. State persists in memory.

B — editable inspection note: symptom and slots on initial form, then review. Correcting replaces the symptom text with an editor; selected slot and inspection scope remain available. Save returns directly to review; Discard restores prior symptom.

Both rendered and exercised with “Clicking when I pedal uphill.”, Tuesday 14:00, then “Clicking near the back wheel when I pedal uphill.”. Both retained the selected slot. From review, A used Edit → Choose a slot → Review (3 button activations excluding typing); B used Edit → Save (2). A’s edit screen did not display the chosen slot; B’s repaired edit screen did. These are observed properties of these implementations, not human performance measurements. A could be improved with direct return to review and context display; this is not a comparison against every familiar flow.

## Browser tests actually exercised

CUA in-app browser, default desktop screenshot 1265×712; phone viewport override 390×844, reset after testing. Initial attempt to open a visible subagent browser failed; hidden tab worked.

- Empty symptom → Review: inline recovery message; focus went to symptom.
- Symptom + Tuesday 14:00 → review: text and selected slot visible.
- Edit symptom → typed revision → Tab → Enter on Save: revised text and unchanged Tuesday 14:00 visible.
- Cancel from review → modal with Keep editing focused → Escape: modal closed; note and slot intact.
- Finish local demo: “DEMO COMPLETE · NOTHING SENT” and “No booking was made” visible.
- Result → Revise this note → Edit: prior note restored.
- Phone edit → unwanted revision → Discard: prior text restored; Tuesday 14:00 retained.
- Review → Back to slots: prior symptom value and checked Tuesday 14:00 retained.
- Familiar sequence: entered same symptom, tried Review without slot; recovery message and radio focus appeared. Selected Tuesday 14:00, reviewed, edited symptom, continued through slot screen. Tuesday 14:00 still checked; updated note correct on review.
- Cancel → Clear draft in familiar variant: empty symptom entry restored and focused. Slot-clearing implementation is direct; UI did not revisit slot page after clear to independently verify its unchecked state.
- Browser error log query returned no errors at final state.

This was partial keyboard testing (Tab/Enter and Escape), not a full keyboard-only or screen-reader audit. Phone means browser viewport, not physical touch device or on-screen keyboard. No motion exists, so no animated reduced-motion branch was required or tested. No browser-history Back test, reload recovery, long-copy stress test, cross-browser check, network instrumentation or human usability session was performed. Reload clears draft by design and is disclosed. In-app Back was tested.

## Consequential critique and repair

Defect, phone 390×844 editing state: initial side panel moved above the editor, and selected slot was above the visible viewport after focus scrolled into the editor. Screenshot `phone-edit-before.png`. The actual hypothesis failed on phone despite DOM co-presence.

Repair: add a compact selected-slot context block directly before the edit field. Acceptance: focus editor at 390×844, inspect slot plus editor in same viewport. Reproduced same symptom and Tuesday 14:00. Screenshot `phone-edit-after.png` and live viewport inspection show the selected slot and textarea together. It duplicates the side panel on desktop; that is a visible density cost. Virtual keyboard could still hide context and remains untested.

Taste preference: restrained cream, green ink and serif title make a local workshop voice plausible. No evidence that this aesthetic helps bookings. Long introductory space and expectation text push phone input down; the prototype could be leaner. No premium taste claim or numeric score.

Frozen comparison: final flow preserves inspection-only wording, accessible native labels/radios, visible focus, explicit local completion and tested recovery. R1’s co-presence relationship is implemented; R2’s clear question hierarchy is present in the control. Reference coverage is narrow phone stills, not broad craft benchmarking. Author review generated the repair and checked final states; there was no separate fresh independent critic. This limitation is explicit rather than manufacturing independence.

## What this test says about the guide

Useful behavior induced: naming an information dependency made “slot stays visible” falsifiable; distinguishing pixels from behavior prevented claiming source retention; working alternatives revealed a concrete correction path difference; same-state phone inspection falsified the first implementation and led to a bounded repair.

Guide defects / friction observed:

1. “Keep visible” needs a sharper definition: present in the DOM, present elsewhere on the page, and co-visible at editing focus are different. The guide’s narrow-layout instruction exposed the problem only because I inspected the actual focus-scrolled viewport. Suggest an explicit same-viewport/keyboard-visible check for context hypotheses.
2. A fresh critic and reference-evidence hash record are specified but the lightweight guide gives no minimal invocation or budget. For a small standalone experiment, I created a hash record manually; no automated critic selected evidence. Distinguishing author critique from independent final comparison should be an explicit fallback.
3. Alternative effort can be biased. The guide asks for a familiar control, but does not require a reasonably strong one. Here the sequential control’s extra slot step is avoidable; therefore the observed action difference cannot support a broad mechanism recommendation.
4. The manifest requires a single craft/mechanism role, while one source can inform both. R2 is marked craft, but also informed the control’s sequencing hypothesis. A small array of roles or note convention would be clearer.
5. Bounded library search delivered adjacent forms, not the exact correction relationship. The guide correctly allows Unknown, but pressure to attach every decision to evidence risks dressing weak adjacent reference fit as support. The proposed mechanism remains a hypothesis, not a source-proven behavior.
6. No definition of how much originality is enough. This useful result is familiar inline editing, not an original mechanism in the broad sense. I did not add novelty merely to satisfy the wording.

Outcome: a narrow context-visibility benefit demonstrated in this prototype after repair, plus functional retention in both variants. No general design superiority, conversion claim, human ease-of-use conclusion or guide effectiveness claim follows from one agent-authored example.

## Artifacts

- `screenshots/note-edit-desktop.png` — initial desktop edit, slot co-visible.
- `screenshots/phone-edit-before.png` / `phone-edit-after.png` — same content phone repair comparison (full-page captures; live viewport was also inspected).
- `screenshots/result.png` — honest local result.
- `screenshots/steps-edit-phone.png` / `steps-review-phone.png` — familiar comparison states.
- `screenshots/final-entry-desktop.png` — frozen entry.
- `.seenry/refs/` — actual inspected source images, manifest and observations.
