# Verify the changed interaction

Select the checks relevant to the change. A hover adjustment does not require auditing an unrelated checkout or rebuilding the page. Keep the existing stack, content, tokens and authorized scope. Use fixture actions for destructive or financial demos.

## State and interruption

- Write the expected settled result before testing: selected item, visible panel, saved value, focus destination and recovery path. A click handler firing is not evidence that the result is correct
- Reopen while an exit is running, then alternate inputs rapidly. The latest accepted input wins. Logical state and its public representation (ARIA, state attributes or framework state) change when input is accepted; a separate closing/presentation state may keep the exit painted
- Finish an old animation or async request after a newer one. It must not hide the reopened surface, replace newer content, overwrite a newer clipboard result, or announce stale success
- Check both the direct API and the real control that invokes it when they branch on different state. For example, a Replay button can read a stale attribute even when the underlying animation code supports reversal
- Keep paint copies out of semantic discovery. A cloned row or title must not become a new selectable option, be counted again, or receive an active-descendant reference. Test a second filter or reversal before the first copy retires, including an empty result
- Preserve immediate feedback, keyboard behavior and the same result under reduced motion. Optional blur, particles or other enhancement layers must not reintroduce effects after reduction has removed them

## Visible fit and moving layers

- Inspect the affected component at its supported narrow width with actual labels and relevant loading, error and success states. Check text against the button's interior, media against its card, and controls against the local clipping region. Zero document overflow can coexist with clipped labels, an off-surface action or an overlapping Replay control
- Let long content reflow or give it an appropriate scroll region. Do not conceal a required action or truncate an essential label merely to pass an overflow check. If a category strip scrolls, keep the selected category visible and do not let an overflow cue cover the final option
- For a changed text-heavy or narrow layout, test user spacing overrides without cancelling them: line-height 1.5, paragraph-after 2em, letter-spacing .12em and word-spacing .16em. Let content and its action lane grow or scroll; reserve real space for Close and submit controls. Paint copies must retain the measured wrapping and spacing, not silently force a single line
- A rendered snapshot of a scrolling view needs the current nested scroll positions and stable styling after IDs are removed. Check a return transition after reading the bottom, not only the initial top position
- For shared-element motion, follow the visible cover, title and temporary traveler/ghost through the transition. A fixed detail rectangle cannot prove that those layers move smoothly. Look for partial-word occlusion, text outside the moving shell, scaling, double paint and discontinuities on retarget
- Inspect intermediate text departure, not only settled states. During collapse, avoid cutting through still-dark glyphs; coordinate their departure with the shrinking boundary. During modal fades, preserve enough foreground backing and contrast that background text does not merge with it. Choose choreography for the actual content rather than copying a fixed delay
- Before routing destination-sized shared text from a smaller source, check the measured text envelope against both painted endpoints at the current content width and user spacing. A mathematically impossible fit needs a different composition or an explicit fallback; a route guard must not silently turn a promised visible shared-title flight into hidden text
- When changing a control or theme, inspect its enabled unchecked, checked and focused cues against the actual adjacent colors. [Essential non-text cues](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) need at least 3:1 without rounding; account for alpha backgrounds and verify that the measured boundary, thumb or checkmark is actually visible. Do not fail a decorative border when another sufficient cue identifies the control, or treat text contrast as evidence that every control state passes
- Keep copy consistent with material. A photograph of mountains does not support a specific city caption without provenance. Functional demonstrations still need accurate, readable content

## Nested surfaces and focus

- Give a pointer gesture one owner. Dragging an inner sheet must not let a containing sheet capture the pointer or dismiss itself
- Scrollable details need a usable scroll path. A dedicated drag handle can separate dismissal from reading code or interacting with an embedded preview; avoid making the whole scrollable document a dismiss gesture
- Test nested Close and Escape independently. A bubbled child-close event must not tear down the parent, restore focus behind an open modal, or change an unrelated URL state
- Restore focus only after the return target is visible and connected, and do not steal it from a newer user action. A non-modal preview does not automatically receive the native Escape/cancel behavior of a modal dialog; test the actual route and keep a child Escape from dismissing its parent too
- A persistent search field remains a usable opener while results are collapsed. Make the results inactive rather than disabling the whole visible field, and keep expanded state and active-descendant references consistent with the logical state
- Traverse the changed flow with the keyboard and verify sensible focus restoration. Distinguish a browser/document focus boundary from a concrete focus escape to an actionable background control; preserve the observation rather than silently dropping the failed assertion
- On a fresh default load, confirm that initialization does not move the document unexpectedly. Highlighting an option inside a closed palette should scroll its own list, not the page. Respect an intentional deep link instead of always forcing scroll to zero

## Evidence that can support the claim

Record the source revision or relevant file hashes, viewport, theme, input method and motion preference with each result. Preserve first failures and use unique filenames for different states and iterations. Do not overwrite a reduced-motion image with a normal-motion capture.

For a timing claim, retain actual input timestamps and observe the moving properties. Schedule rapid inputs independently of screenshots: awaiting an image between clicks can turn a requested 50ms interval into a much slower test. A 25fps recording has 40ms samples and cannot precisely certify a 50ms reversal. Supplement it with timestamped animation-frame measurements when useful, without pretending those measurements prove every painted pixel or production frame rate.

Record normal-speed video without concurrent element screenshots for presentation review. Screenshots may scroll elements into view or disturb capture. If a tall full-page image looks inconsistent around sticky chrome or the footer, reproduce the area in an ordinary viewport before changing the app.

Report separately: code checks, live state/input checks, inspected pixels, measured motion, independent judgment and remaining unknowns. A high overall score cannot clear a known failed criterion, missing evidence or an older source version. Do not average away a minimum criterion set by the user.

## Regression hooks

In a full Seenry repository checkout, `tests/transitions-library-logic.test.cjs` exercises state, async, gesture and reduced-motion contracts with local stubs; `tests/transitions-library-rendered-findings.test.cjs` preserves specific corrections discovered from pixels; `tests/transitions-library-title-motion.test.cjs` checks shared-title geometry; and `tests/transitions-library.browser.mjs` checks live default-state layout. These are repository-only hooks and are not part of a standalone skill installation. Use the host project's relevant tests when the checkout is absent. These support their stated invariants; none replaces a fresh browser capture of the changed output. Add a focused regression when a failure is reproducible, and retain a browser follow-up for anything a stub or source assertion cannot establish.
