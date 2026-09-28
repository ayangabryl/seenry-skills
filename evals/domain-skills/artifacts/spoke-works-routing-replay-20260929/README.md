# Spoke Works routing replay

This is a fixed-brief forward test of the Seenry entrypoint at commit `11fbe90` (the version published after the first bicycle trial). The independent builder read that entrypoint and made two studies before a complete landing page with a service, demo time, review, and demo confirmation flow. It inspected Seenry MCP app and web references. The brief supplied no type or brand rules.

## What the first pass proved

- The first phone page showed a priced service in the opening viewport, improving the task hierarchy over the prior trial.
- The first complete source still introduced a large sans headline with an accented italic serif phrase and small editorial labels during expansion. The builder's listed guidance did **not** include the typography specialist. The conditional routing in the entrypoint did not prevent this treatment.
- The direction study reviewer chose the service-led study. Its `Keep` was limited to those four study captures; it did not approve the later hero treatment or connected states.
- The first-screen typography reviewer returned `Revise`. Pointer and keyboard behavior worked, but functional success did not establish visual quality.

The untouched first-complete source is in [`first/`](first/) and its phone, review, and confirmation captures are in [`captures/`](captures/). This result is a prevention failure for that skill version. The later repaired page must not be described as an untouched first pass.

## Bounded repair evidence

The builder made two repair passes. The first removed the italic editorial opening but left repeated introductions and an oversized area statement. The second brought the service choices forward and reduced the lower section, but the focused typography reviewer still returned `Revise` because the review and confirmation states stacked repeated titles and demo disclaimers before the selected facts. The full-page reviewer returned `Keep` on pass 2, demonstrating why the state-specific gate matters.

The parent continued with two focused state repairs. Pass 3 put the chosen service, time, and price first in review. The typography gate still returned `Revise` for a faint disabled action and a confirmation heading that did not govern the result. Pass 4 fixed disabled-action contrast, gave the demo result a clear heading, and removed the persistent hero while review or confirmation is visible. The independent first-screen gate then returned `Keep` from both typography and whole-screen critics. The repaired source is in [`repaired/`](repaired/); `final-*.png` captures show the resulting page and states. The interaction JSON records pointer checks at 1440, 390, and 320 pixels plus a keyboard check at 390 pixels.

The gate summaries preserve the exact verdicts. The first-pass failure supports a narrow entrypoint change: original work without established type rules should load typography and anti-default guidance before styling either study, and expansion should be compared with the chosen study if it introduces a new dominant type treatment. This change has not yet passed a fresh blind forward test. A `Keep` from model critics is evidence for this rendering, not proof that every future page will be strong.
