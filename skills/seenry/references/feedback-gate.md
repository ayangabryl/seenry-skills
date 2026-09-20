# Do not repeat a known rejection

Use after explicit visual or interaction feedback. This is a project regression gate, not a universal aesthetic blacklist.

Before repair, retain the rejected artifact. In DESIGN.md record each finding with its source, affected state, required change and check. Supply this compact record to a fresh executor; a link to an unread conversation is insufficient. Separate three statuses: mechanically checked, visually reviewed, user accepted. None implies the others.

Examples from a compact player: selection must retain row/title positions and focus; compact mode must remove its hidden content's padding; the user rejected this project's grid texture, uppercase metadata and decorative track ordinals. Those style constraints belong to this player. A data table can need rules and ordinals; artwork can justify color or shadow. Do not remove functional timestamps, meaningful selected state or visible keyboard focus.

## Exercise the exact failure

Keep the same viewport and content for before/after evidence. Test the primary, selected, hover, compact and restored states; also interrupt/reverse the changed transition. For stable targets, measure x, y, width and height. Reserve marker space; maintain DOM identity when a focused repeated item changes state. Put collapsible padding inside the clipping region, then measure its closed height. Intentional expansion may move following content; only the declared anchor must stay fixed.

With a Playwright-compatible host, `scripts/decision_check.cjs` accepts:

```js
{kind: 'state-change', selector: '.track', probes: ['.track-title'],
 action: {type: 'click', selector: '.track:nth-child(2)'},
 preserveNodes: true, focusOnAction: true, waitMs: 350}
{kind: 'state-change', selector: '#collapse',
 action: {type: 'click', selector: '#collapse'},
 boundsAfter: [{selector: '#details', maxHeight: 0.5}]}
```

Adapt selectors and expected states to the project. Missing selectors, replacement nodes and hidden required observations must not silently pass. Where practical, prove the check fails on the preserved defect before trusting a pass on the repair. Inspect rendered copy, textures, boundaries and visual balance separately; computed checks cannot judge composition.

## Handoff gate

Every explicit finding needs evidence or an unresolved status. A functional pass cannot waive a rejected treatment. If a repair intentionally reopens a user decision, present that alternative clearly rather than silently restoring it. Preserve the original benchmark; label direct host corrections assisted. Do not claim a skill-level improvement from one corrected artifact. General promotion still requires a fresh brief and a counterexample.
