# Local product transition recipes

Use a recipe for a meaningful state change. These original patterns use Seenry's local helpers and platform CSS; they do not require another skill, MCP or a subscription.

| Change | Implementation | Anchor and recovery |
| --- | --- | --- |
| Contextual setting appears | Group it with the setting it qualifies. Use CSS for a simple inline fade or `createDisclosure` from `assets/geometry-transition.mjs` for measured height. | Keep its controlling choice stable. Close descendant menus before hiding; move focus before making descendants inert. |
| Menu opens | Place it beside the trigger and use an origin at the attaching edge. The [runnable action-menu asset](../assets/action-menu/README.md) includes a keyboard-aware controller, CSS and demo for a short list of actions. | Focus must move immediately, even during the entrance. Escape returns it. Keep DOM until the visual exit settles, while making closing content inert. Cancel stale close completion on reopening. |
| Copy succeeds | Set semantic success only after clipboard resolution. Keep label and hit area stable; `createIconSwap` changes between real library glyphs. | Latest request owns the reset timer. A failure reveals a selectable manual link. Never replace a failed operation with a success animation. |
| Item enters or leaves | Animate only that item, with a modest opacity transition. Use measured layout only if following the movement aids understanding. | Existing identities and focused controls keep their nodes. Undo restores the item and useful focus. |
| Value changes | Use `number-transition.mjs` when following numeric change is useful. Keep units stationary and an accessible current value. | Frequent manipulation responds directly; reduced motion settles immediately. |
| Short status text changes | Use the [status switch](../assets/status-switch/README.md) for a known set of compact labels. Reserve the longest label's width and update only from real application state. | The current value enters the live region immediately; quick updates replace stale visual copies and reduced motion settles at once. Keep long messages in normal document flow. |

Load [adapters](adapters.md) and copy only the selected runtime files. Helper integration is incomplete until interruption, reversal, live reduced motion, resize and keyboard behavior are exercised in the actual layout. Endpoints alone cannot show a mid-transition jump. For menus, shadows may separate a floating layer; they are not needed to animate every surrounding card.

Transitions should express relationships. A floating permission button below unrelated actions needs grouping before animation. Blur, lift, bounce and staggering are optional treatments; none is an automatic mark of quality. Do not animate the focus indicator or conceal information during a transition.

For expressive scrolling, use [scroll choreography](scroll-choreography.md). These utility recipes do not replace a page's narrative score.
