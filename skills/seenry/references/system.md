# The system

A design system for an LLM is a short list of allowed values. The fewer values, the more consistent every later component will be. Define these once in CSS custom properties (or the project's token format), write them into `DESIGN.md`, and use nothing else.

If the project already has tokens, map them onto these roles and keep the project's values. Only fill the gaps.

## Base grid

- **Base unit 4px.** Every dimension is a multiple of 4. Layout-level values (section padding, gutters, card insets, gaps between groups) are multiples of 8.
- Line heights snap to the 4px grid too: 16/24, 14/20, 13/20, 12/16, 18/28, 20/28, 24/32, 32/40, 48/52, 64/64.
- Icons are 16, 20 or 24. Avatars 20, 24, 32, 40, 48, 64. Controls 28, 32, 36, 40, 44, 48 tall.
- Allowed off-grid exceptions: 1px hairlines, 2px focus-ring offsets and 0.5px retina borders.

## Spacing scale

```
--space-1: 4px    tight icon-to-label, badge padding
--space-2: 8px    inside a group: label → input, title → subtitle
--space-3: 12px   control padding-x (small), list row gap
--space-4: 16px   control padding-x, card gap, phone gutter
--space-5: 24px   card inset, between groups, phone section gap
--space-6: 32px   between groups in roomy layouts, desktop gutter
--space-7: 48px   section inner spacing, desktop gutter (wide)
--space-8: 64px   phone section rhythm, product page padding-block
--space-9: 96px   desktop section rhythm
--space-10: 128px desktop section rhythm (spacious marketing)
```

Rules:

- **Proximity law.** Space between groups is at least 2x the space within a group. If a title-to-body gap is 8, the body-to-next-block gap is 16 or more.
- **One step per level of nesting.** Page gutter 32 → card inset 24 → row gap 16 → label gap 8. Each level down uses a smaller step.
- **Never** `10px`, `15px`, `18px`, `20px` as padding, or `mt-[13px]`-style magic numbers. If a value looks wrong on the scale, the grouping is wrong, not the scale.

## Radius

Pick a scale of at most 4 values plus pill:

| Token | Typical value | Used for |
| --- | --- | --- |
| `--radius-sm` | 6px | badges, checkboxes, small inputs in dense UI, inline code |
| `--radius-md` | 10px | buttons (non-pill), inputs, menu items, tooltips |
| `--radius-lg` | 16px | cards, popovers, menus, images inside large cards |
| `--radius-xl` | 24px | hero cards, dialogs, sheets, feature panels |
| `--radius-full` | 9999px | pills, avatars, toggles, pill buttons |

Choose the family deliberately: sharp (2–6px, Stripe, Cursor, Supabase feel engineered and financial), soft (8–16px, Notion, Linear, Raycast feel like tools), round (16–32px with pill buttons, Loom, Figma, consumer apps feel friendly). Do not mix families.

**Concentric corners.** When a rounded shape sits inside another with inset `p`:

```
inner radius = max(outer radius − p, 0)
```

- Card r24, inset 8 → image r16.
- Card r24, inset 16 → image r8.
- Card r24, inset 24 → content r0 (or a tiny 4 for images). This is the "24px radius + inset 24" construction: the inset equals the radius, so content sits in a clean rectangular safe area.
- Segmented control r10, inset 2 → thumb r8.
- Button inside an input (r10, inset 4) → button r6.

Wrong: a r16 card containing an r16 image with 12px padding. The corners visibly fight.

## Elevation and borders

Default to flat surfaces separated by value, hairlines and space.

| Level | Treatment | Used for |
| --- | --- | --- |
| 0 | background only | page |
| 1 | surface-1 fill, or 1px `--border` | cards, table containers, inputs |
| 2 | ring + small shadow: `0 0 0 1px rgb(0 0 0/.06), 0 1px 2px rgb(0 0 0/.06)` | buttons on a surface, raised tiles |
| 3 | ring + layered soft shadow: `0 0 0 1px rgb(0 0 0/.06), 0 4px 12px rgb(0 0 0/.06), 0 16px 32px rgb(0 0 0/.08)` | menus, popovers, dropdowns |
| 4 | level 3 + scrim `rgb(0 0 0/.4)` | dialogs, sheets |

Rules:

- Shadows are layered (2–4 layers), low alpha (0.02–0.10 each) and neutral or slightly tinted with the background hue. A single `0 10px 30px rgba(0,0,0,.25)` is a tell.
- In dark mode, elevation is expressed by a lighter surface and a light inner hairline (`inset 0 0 0 1px rgb(255 255 255/.06)`), not by darker shadows.
- Use a ring (`box-shadow: 0 0 0 1px`) instead of `border` when the edge must not change layout size.
- Borders are 1px. 2px only for focus or selected state.

## Layout grid

- **Content width:** 1200px for product marketing, 1080px for text-led pages, 680–720px for reading columns (65–75 characters).
- **Page gutter:** 16px below 480px, 24px to 768px, 32px to 1280px, 48px beyond.
- **Columns:** 12 columns, 24px gutter on desktop; 4 columns, 16px gutter on phone.
- **Header height:** 56–64px desktop, 48–56px phone.
- **Breakpoints come from content.** Start from phone 390 and desktop 1440, then find the width where the layout actually breaks.

Every region (header, each section, footer) aligns to the same content box. The single most common structural defect is a section whose inner edge drifts from the header's logo edge.

## Density modes

| Mode | Body | Row height | Control height | Used for |
| --- | --- | --- | --- | --- |
| Comfortable | 16px | 48–56px | 40–48px | marketing, onboarding, consumer |
| Default | 14px | 36–44px | 32–36px | product UI, settings |
| Compact | 13px | 28–32px | 28px | tables, lists, pro tools, sidebars |

Pick one mode per surface. Marketing and product pages can differ, but a product page never mixes modes within one panel.

## Starter tokens

Copy [assets/tokens.css](../assets/tokens.css) when the project has no tokens. It encodes everything above, light and dark, with semantic names. Rename values freely; keep the roles.

## DESIGN.md

Record the system in the project's `DESIGN.md` using [the template](../assets/DESIGN.template.md): tokens, the page shell, one spec card per component, references studied, and rejected directions. Later agents read this file before touching the UI. It is the mechanism that keeps page 12 consistent with page 1.
