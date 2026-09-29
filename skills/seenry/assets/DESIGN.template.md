# DESIGN.md

Read this before changing any UI in this project. Update it when a decision changes.

## Product

- Audience:
- The one job of the main surface:
- Voice (three words):
- Fixed constraints (brand, stack, copy, legal):

## References studied

```
Ref: <site + page/section + viewport>, captured <date>
Seen:
Measured:
Adopt:
Avoid:
```

## Tokens

- Grid: 4px base, layout multiples of 8
- Spacing scale: 4 8 12 16 24 32 48 64 96 128
- Radius family: <sharp | soft | round>, values: <sm md lg xl> + 9999
- Families: <sans> (+ <accent serif or mono>), weights loaded: <400 500 600>
- Type scale: <display / h1 / h2 / h3 / title / body / ui / caption>
- Color roles: bg, surface-1, surface-2, text-1..3, border-1..2, accent (+hover, soft), positive, warning, negative
- Elevation: ring, raised, float, scrim
- Density: <comfortable | default | compact> per surface

Source of truth: `<path to tokens file>`

## Page shell

- Content width: <1200>, text column: <720>
- Gutter: <16 / 24 / 32 / 48 by breakpoint>
- Grid: <12 cols, 24 gap> / phone <4 cols, 16 gap>
- Header height: <64 / 56>
- Section rhythm: <128 / 96 / 64>
- Section heading pattern: <eyebrow → title → lead, left-aligned, max 640>

## Components

One spec card per component:

```
Component:
Grid:   radius · inset
Areas:
Gaps:
Type:   (≤3 sizes, ≤3 weights)
Color:
States:
Ref:
```

## Glossary

| Term | Use | Never |
| --- | --- | --- |

## Assets

| Asset | Source | License | Notes |
| --- | --- | --- | --- |

## Decisions and rejected directions

- <date> Chose … over … because …
