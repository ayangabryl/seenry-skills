# Bundled kits

Use these when the project has no component library. A project with Radix, Base UI, shadcn or its own components keeps them, styled to its tokens. Never ship two component systems.

| Kit | What it gives | Read |
| --- | --- | --- |
| Core UI | Buttons, fields, select, checkbox, radio, switch, tabs, menu, tooltip, dialog, sheet, toast, accordion, badge, table | [ui](../assets/components/ui/README.md) |
| Transitions | Tested enter, move, fade and leave curves, springs, and attribute-driven transitions for menus, dialogs, tabs, numbers and lists | [transitions](../assets/components/transitions/README.md) |
| Interaction | Slide to confirm, hold to delete, combobox, date range, waveform player | [interaction](../assets/components/interaction/README.md) |
| Statement and signature | A large editorial statement with proof inline; a product demo player, compare slider, scroll story | [statement](../assets/components/statement/README.md), [signature](../assets/components/signature/README.md) |
| Starter tokens | One file of type, space, radius, color and motion tokens | [tokens.css](../assets/tokens.css) |
| Layout grid overlay | Columns and keylines drawn over the page in development | [layout guides](../assets/layout-guides/README.md) |

Copy a kit into the project and restyle it only through its tokens. Decide whether something should move with `seenry-motion` before reaching for the transitions kit.

A component no kit has gets a short brief before code: its states, its inputs by pointer, touch and keyboard, and what happens when an action is interrupted. The template is in [interaction craft](../../seenry-motion/references/interaction-craft.md).
