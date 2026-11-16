# Building components

**Read when:** a page needs a component (a button, a menu, a dialog, a toast) or a transition, and you are choosing where it comes from.

Seenry bundles no component code. Components come from a maintained library or from the project's own `components.css`, never from a copy that nobody updates.

1. **Framework or package manager present:** pick a maintained library through `seenry-libraries` (Base UI or Radix for components; Sonner, Vaul, NumberFlow and Motion for the rest), style it to the tokens, and keep whatever the project already has. Never ship two component systems.
2. **No build step** (plain HTML, a static site, a canvas screen): write the component once in the project's `components.css` on the tokens, with its `@component` line, and link that file from every page. Use the platform first: `<dialog>`, `popover`, `<details>`, `:has()`, native form controls.
3. **Anything that moves:** decide whether it should, and with what values, in `seenry-motion` first. Its recipes are plain CSS and need no kit.

| File | What it gives | Read |
| --- | --- | --- |
| Starter tokens | One file of type, space, radius, color and motion tokens | [tokens.css](../assets/tokens.css) |
| Layout grid overlay | Columns and keylines drawn over the page in development | [layout guides](../assets/layout-guides/README.md) |

A component no library has gets a short brief before code: its states, its inputs by pointer, touch and keyboard, and what happens when an action is interrupted. The template is in [interaction craft](../../seenry-motion/references/interaction-craft.md).
