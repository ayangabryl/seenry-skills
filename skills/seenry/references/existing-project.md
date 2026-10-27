# Changes inside an existing project

The owner wants a pull request they can merge, not a rebrand. A change that looks great but does not look like their app has failed. So has a timid cleanup.

Use this route when the request adds or changes something in an app with its own screens and styles ("fix the settings page", "add a pricing page", "make this modal nicer"). When the request is to unslop or redesign a screen ("unslop this", "make it not look AI-made"), the app's current look is the problem: use [unslop](unslop.md) instead.

## 1. Read the app before writing anything

- Find its styling method (Tailwind, CSS modules, plain CSS with tokens, styled-components), its component library (shadcn, Radix, its own) and its tokens.
- Render two or three neighbouring screens. The new work must look like the same team made it: same type, colors, radius, spacing, density and components.
- Bring Seenry's craft inside that system. Never import Seenry's kits, fonts or palette over it.
- Where the app's values have drifted (a 9px padding beside its 8 and 16), the screens you touch snap to its scale. The app gets more consistent, never a second system. See [one token system](system.md#one-token-system-everywhere).

## 2. Keep the behavior

Every action, field, setting and piece of information architecture keeps working the way it did.

- No new save models, no persistence the app did not have, no tabs that are really anchors.
- Actions keep their names: "Upgrade" stays "Upgrade". Product and plan names stay exactly as the owner wrote them.

## 3. Fix the presentation all the way

The bar: the changed screen becomes the best-looking screen in their app.

- **The app's own controls replace raw ones.** Its inputs, selects and buttons; switches for on/off preferences.
- **Groups share one anatomy.** The same container and label layout the app uses elsewhere.
- **Destructive actions sit in a calm, separate zone,** with a normal-case outlined or destructive button. "DELETE WORKSPACE" becomes "Delete workspace".
- **Unclear settings get one line of helper text.**
- **Checkboxes and radios are styled in the brand:** rounded, filled with the accent when selected, check drawn. Never the browser default.
- **Focus rings appear for keyboard focus only** (`:focus-visible`), never on a control the moment a dialog opens.
- **Add the sections that kind of surface normally has, and nothing decorative beyond them.**

Copy is presentation too:

- Cut long paragraphs to one or two sentences.
- First-use actions say what they do: "Create your first project", not "New project".
- Where someone must decide, fold the guidance into the sentence already there instead of adding a line.

## 4. Dialogs and onboarding

- **An onboarding dialog opens with a centered welcome:** the brand's mark or one small illustration on the dialog surface or a very light tint, a friendly title, one sentence. Never a heavy saturated band.
- **The backdrop dims the page clearly,** about 40 to 50% of the ink color at every width, so nothing behind competes.
- **Choices are tiles** with a small icon from the app's set and a clear selected state (tint plus check). Multi-select questions get real multi-select controls; numbers get a stepper.
- **On phone, a short question and its stepper share one row.**
- **The footer pairs the primary action with the secondary one as a real button,** not a faint link.
- **Dialogs keep a visible close button.**

Rules for specific screens (profile, collections, settings lists, empty states, pricing) are in [surfaces](surfaces.md). Read the part for the screen you are changing.

## 5. Write in the project's idiom

- Tailwind and shadcn projects get utilities and the existing components, never a block of page rules in the global stylesheet.
- Plain-CSS projects get styles beside the component, using the existing tokens.
- Never a new hard-coded hex value.

## 6. Research only when the screen changes shape

| Change | Research |
| --- | --- |
| A new surface (pricing, onboarding, an empty state) or "this whole screen looks bad" | One `research_design_brief` (family `websites` or `apps`, an `asset_query` naming the screen, two or three structural queries), then one `compare_measurements` on the references you keep |
| A bug, one control, one state | None |

Take the parts leaders put on that screen and their measured spacing and type, in the project's own components. No idea generation, identity boards, signature component or critic loop unless the owner asks for a redesign.

## 7. Motion by default, from tokens

Unless the owner says no motion, every state change you touch transitions on the motion tokens:

| Change | Token |
| --- | --- |
| Hover and press | `--dur-1` |
| Toggles, tabs with a sliding indicator, segmented controls | `--dur-2` |
| Dialogs, sheets, menus, toasts, list changes | `--dur-3`, enter on `--ease-out`, leave faster |
| Loading | Skeletons that cross-fade to content |
| Numbers | Change in place |

Use the app's motion library if it has one. Keep a reduced-motion version. Interface motion only: no scroll scenes in an app.

## 8. Verify the way a reviewer would

1. Build. Render the changed screen at 1440 and 390, check every state you touched, and render one untouched screen to confirm nothing else moved.
2. Run `node scripts/existing_check.mjs <url> --project .` (about a minute). It runs the review board, the token lint on changed files, the motion scan and a product-design review at 100% and on phone.
3. Clear the blockers your change introduced. In a project with a token scale, clear every typed value in the files you changed; in a legacy stylesheet, use the values it already has and do not convert unless asked.
4. Apply the review's fixes once, most visible first. Its usual notes: meta text 13px or more at 4.5:1, one control height, a clear save model, no dead space on phone.
5. Run it once more and stop.

## 9. Leave the repo clean

- Screenshots and notes go outside the project, for example `$TMPDIR/seenry-<project>/`.
- No `DESIGN.md` unless the project has one or the owner asks.
- The diff contains only the product change.

Report in three or four sentences: what changed, what stayed the same on purpose, and anything the owner should decide.
