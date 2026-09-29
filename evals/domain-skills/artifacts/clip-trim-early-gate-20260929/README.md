# Early object-legibility gate replay

The problem fixture is an original video-trim component. Its two phone studies show numeric trim state and a visible filmstrip, but the footage in the strip compresses to indistinguishable bands. The original direction gate returned `Keep`; a later first-screen review returned `Revise` for that material. The repaired component is outside this fixture.

The `problem-*` captures, brief and decision are frozen. `problem-before.json` is the original direction verdict. `problem-after.json` is a fresh reviewer with the generalized delivered-phone-size object-legibility question added to the gate prompt. It returned `Revise` for the filmstrip. No capture or brief changed between these reviews; input hashes in the JSON agree.

The `control-*` captures are a separately repaired letterpress schedule identity comparison. The same prompt change preserved its `Keep` verdict (`control-before.json`, `control-after.json`), with unchanged input hashes. This is one detection replay and one non-regression control, not proof of general model reliability. Reviewer logs and the complete runnable prototypes remain local to the development trial and are not part of the published skill package.
