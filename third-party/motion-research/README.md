# Motion coverage research, 22 September 2026

Sources inspected: https://transitions.dev/, https://transitions.dev/skill.html,
https://transitions.dev/terms.html and the public repository
https://github.com/Jakubantalik/transitions.dev at commit
`e2d5551656e4d3274e075d1cbd9a95af50f53225`.

Terms distinguish the MIT developer tooling from the transitions library. Snippets may
be used in products; redistribution of the collection or a substantial competing
collection is prohibited. No upstream transition snippets, paid recipes, media or
skill files are included in Seenry. Public-source inspection informed a gap audit.
The guides and packet routing added here are independently authored. Existing bundled
third-party runtimes retain their own separate manifests and licenses.

This file is maintainer evidence and is not loaded in ordinary agent packets.

## Coverage boundary

The public skill's 32 named patterns were reviewed against these mechanism families.
This table reports **guidance coverage**, not 32 tested, drop-in implementations.

| Public pattern group | Seenry guidance | Executable support |
| --- | --- | --- |
| Card resize, dropdown, modal, panel, accordion | Surfaces | Existing disclosure helper for height only; other mechanisms require implementation |
| Side-by-side pages, sliding tabs, tooltip, learn-more hint | Navigation | Platform transforms and measured targets; no bundled universal router |
| Number entry/counter, text states, icon swap, plus morph, text reveal | Content | Existing icon, morph and number adapters with runtime licenses |
| Badge, check, error shake, toast, like, checkbox, toggle, banner stacking | Feedback | Icon swap for status; operation state/notification ownership remains project work |
| Skeleton, shimmer text, thinking states, matrix loader | Loading | CSS baseline, optional separately licensed existing engines |
| Reasoning/streaming text | Content | Real event stream required; no fabricated process content |
| Avatar hover, card tilt, input dissolve | Expressive effects | Implementation guidance; no claim of reproduced proprietary shaders |

Additional publicly displayed examples (gooey actions, confetti, card fans,
drag physics, organic shimmer, image opening, spinner/check, gradient and
image-generation materials) map to surfaces, feedback, loading and expressive
guidance. A Pro catalog entry establishes neither snippet access nor local runtime
coverage. Existing `expressive-effects.md` records independently licensed optional
engines; it is not a copy of this catalog.

The focused selector exposes 25 mechanism identifiers in six families. Replication
uses source measurements before recipes. An available guide or imported helper is
not proof that the resulting effect matches a reference. Test a requested pattern
in its actual host and record limitations.
