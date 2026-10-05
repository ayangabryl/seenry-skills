# Use an available implementation before drawing a lookalike

For a named effect, first inspect the project's current dependencies. Then check the publisher's current package documentation, version, license, peer dependencies and examples. Install only the needed package into the **target project**, use its documented API and record the version/configuration in the project. Keep third-party code and attribution distinct from Seenry's original assets. Do not vendor a package into this skill or relabel its code as Seenry's.

The following public npm packages were verified as MIT with React 18+ peer support on 2026-09-28; recheck current metadata and API before use. They are optional dependencies for a matching project, not bundled Seenry components or proof that every reference is matched.

| Requested material | Package to inspect |
| --- | --- |
| Traveling border light | `border-beam` |
| Working-state orb | `thinking-orbs` |
| Liquid merge | `liquid-gooey` |
| Reflective metal | `metal-fx` |
| Image resolution effect | `img-fx` (`three` peer dependency) |
| Voice-responsive glow | `voice-glow` |
| Animated agent avatar | `bot-avatars` |

For a named CSS transition from an available collection, inspect the public `transitions-dev` CLI with `npx transitions-dev list`, then use `npx transitions-dev add <exact-id>` in the target project if its terms and output fit. The free `menu-dropdown` command was checked on 2026-09-28: it wrote `transitions/menu-dropdown.md`, a recipe rather than a working installed component. Apply its CSS and state logic to the actual interface, then test the transition and interaction states. Do not copy its agent skill or premium recipes into Seenry. The CLI package was reported MIT on 2026-09-28; verify the terms of the selected transition at use time.

**Verified integration detail:** In `border-beam` 1.4.1, the rotating presets leave reduced-motion handling to the consuming app. For a `size="md"`, `"sm"` or `"line"` integration, update the `active` prop when `prefers-reduced-motion` changes, including while the page is open. In a React 18 browser trial, a live media-query listener plus `active={wanted && !reduce}` kept the card visually still in reduced motion; the package's documented pulse presets have their own reduced-motion handling. Recheck behavior when upgrading. Compare two rendered active frames and two reduced frames at the actual card size; seeing an animation name in computed CSS is weaker evidence than visible change or stillness.

Compare the installed result with the *specific* reference at the same viewport, content, state and motion phase. Defaults may differ from the reference's configuration. Fix the configuration and surrounding layout first; write a local adapter only where the source API cannot express required behavior. If installation is unsuitable (different framework, unavailable package, unsupported license or missing reference configuration), record the reason and use measured reconstruction. A working import is functional evidence, not visual parity.
