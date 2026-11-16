# Level eval

Does the skill, alone, produce a page at the level bar, for the models people actually run?

```
node evals/level/run.mjs --dry                                   # print what would run
node evals/level/run.mjs --level <folder of level images>         # five briefs, on claude:sonnet and codex
node evals/level/run.mjs --models claude:sonnet --briefs fleet-dispatch
```

| Part | What |
| --- | --- |
| [briefs.json](briefs.json) | Five fixed briefs in different categories. Two come with a level reference (`--level`); three have none, so the skill must pull its own bar |
| [run.mjs](run.mjs) | One fresh agent per brief and model, told only to follow `skills/seenry/SKILL.md` unattended; then a blind judge scores the finished page |
| Pass | A model passes when 4 of 5 briefs reach execution 8 and impact 8, the page is not below the reference, and `DESIGN.md` holds a `Stack:` line. The framework each run picked is in the results |
| Results | `results/results.json`: per run the page, the gate's last line and scores read from `.seenry/review`, whether the gate ran, how many images were made, the judge's scores and gaps, the time; per model the count. Each run's transcript is kept beside its page: read it for skipped steps |
| Invalid | A run whose gate never ran is `invalid`, not a fail: nothing enforced the skill, so it says nothing about the skill |
| Environment | The runner passes its Playwright to the agent as `SEENRY_PLAYWRIGHT`. Codex runs with its sandbox off (`--dangerously-bypass-approvals-and-sandbox`), because the default sandbox blocks the gate's browser and the network that image generation and the Seenry MCP need. Run it only in a folder made for the eval |

Run it after every change to the skill. A change that does not move this does not ship. The level images are the person's own references and are not bundled.
