# Verify the motion

**Read when:** the animation is written and you are about to say it is done, or a model judge scored it below 9.

Run only the checks the change touches. A hover adjustment does not need a checkout audit.

## Checklist

Copy this into the reply and tick what you actually did.

```
- [ ] Wrote the expected settled result first (visible surface, value, focus, recovery)
- [ ] motion_score.mjs: 0 findings, or each one answered
- [ ] Normal speed
- [ ] 10% speed in DevTools Animations: no jump, no empty frame
- [ ] Rapid repeat at 50, 100 and 150ms: latest input wins, nothing queues
- [ ] Reversal mid-flight: continues from the current value
- [ ] Keyboard path: focus moves at once, Escape closes, no animation on shortcuts
- [ ] Reduced motion: same result and feedback, no travel
- [ ] A phone: touch, no hover motion, narrow width
- [ ] CPU throttled 4x: still completes, no dropped state
```

## The deterministic gate

```sh
node scripts/motion_score.mjs <page or dir>
node scripts/motion_score.mjs <page or dir> --json report.json
node scripts/motion_score.mjs page.html --browser --playwright /path/to/playwright/index.mjs
```

Run it from the `seenry-motion` directory. It reads source or a built page and prints one line per finding with the **measured** value and the **allowed** value, so the fix is a number. `--browser` loads the page and reads computed styles. Fix every finding or state why it stands; do not report done with unanswered findings.

## What the script cannot see

**Interruption.** Reopen while an exit runs, then alternate inputs. Logical state and its ARIA change when the input is accepted; only the paint may lag. Finish an old animation or request after a newer one: it must not hide the reopened surface, replace newer content or announce stale success.

**Moving layers.** Follow the cover, title and any temporary copy through a shared-element move. Look for text outside its shell, double paint, a scaled glyph, or a jump on retarget. A paint copy must never be focusable, counted or announced.

**Fit.** Check the narrow width with real labels and the loading, error and success states. Zero page overflow can still hide a clipped label.

**Focus.** Test nested Close and Escape separately: a child closing must not close its parent. Restore focus only to a visible target, and never steal it from a newer action.

**Timing claims.** Schedule rapid inputs independently of screenshots; awaiting an image between clicks turns 50ms into something much slower. A 25fps recording samples every 40ms and cannot certify a 50ms reversal.

## The model judge (optional)

When the sibling `seenry` skill and model access are available:

```sh
node ../seenry/scripts/motion_judge.mjs <url | file.html> [--out dir] [--labels "Menu,Tabs"] [--selector css] [--prev last/motion.json] [--runs 3] [--slow 4] [--max 8] [--playwright path]
```

Resolve the path from this skill's installed directory, not the caller's working directory. It films each interaction and scores it. The floor is 9 in every criterion and every interaction row, with no violations; a high overall never averages away a weak row. An unavailable judge or a missing recording is **unverified, never a pass**. Say which it was.

### From 7 to 9

7 is correct but generic, 8 is clearly premium, 9 is distinctive.

1. **One component at a time.** Use `--labels "<Row>"` until that row scores 9; keep the best version of each. Revert a change that lowers a row.
2. **Apply every fix.** Small repeats (hover, press, close-control feedback) hold a criterion at 7. `--prev` lists what did not rise.
3. **A problem that returns is structural.** Retiming cannot fix paths that cross. Shared elements keep their relative arrangement between states.
4. **No empty frames.** From 30 to 320ms the changed region shows real content. A shell carries its content as it grows.
5. **One crafted idea per component.** What persists travels; what is new is born from its cause. A fade plus a 4px shift scores 7.
6. **Match dismissal to the flow.** Menus close on selection, outside click and Escape and need no close button. A surface that replaces a region puts Close at its top right.
7. **Two runs, not one.** A single run moves a point on unchanged code. Accept a 9 only when two separate runs reach it.

## Report

State each separately: script result, live input checks, pixels inspected, timing measured, judge verdict or "unavailable", and what remains unknown. Record viewport, theme, input method and motion preference with each result. Keep first failures; a high score never clears a failed criterion.
