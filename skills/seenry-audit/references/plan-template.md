# Plan template

Every plan follows this structure. The executor may be a smaller model with no context and no taste, so the plan holds everything, exactly. Never refer to "the audit above" or "the easing we discussed".

````markdown
# NNN — <Short imperative title>

- **Status**: TODO
- **Commit**: <git rev-parse --short HEAD when written>
- **Severity**: HIGH | MEDIUM | LOW
- **Category**: <audit category>
- **Scope**: <n files, rough size>

## Problem

What is wrong, where, and why it matters to how the product feels or works.
Cite every location as `path/to/file.tsx:123` with the current code verbatim:

```css
/* src/components/dropdown.css:14, current */
.dropdown { transition: all 400ms ease-in; }
```

## Target

The exact end state, every value spelled out (curves, durations, springs,
colors, sizes, media queries). Never "a nicer easing":

```css
/* target */
.dropdown {
  transition: transform 200ms var(--ease-out), opacity 200ms var(--ease-out);
  transform-origin: var(--transform-origin);
}
```

## Repo conventions to follow

How this codebase already does it, with one exemplar to imitate:

- Easing tokens live in `src/styles/tokens.css`; add new curves there, e.g. `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
- <exemplar file:line that already does this right>

## Steps

1. <One concrete edit per step: the file, what changes, the resulting code.>
2. …

## Boundaries

- Do NOT touch <files or components out of scope>.
- Do NOT change markup or structure; only the properties named above, unless a step says otherwise.
- Do NOT add dependencies.
- If the code no longer matches the excerpts (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: <exact commands: typecheck, lint, build, tests> and the expected result.
- **Feel check**: run the UI, trigger <interaction>, and confirm:
  - <an observable check, e.g. "the dropdown grows from its trigger, not its center">
  - <e.g. "clicking the toggle repeatedly never restarts the animation from zero">
  - In DevTools Animations at 10% speed, <detail>.
  - With `prefers-reduced-motion` emulated, movement is gone and opacity feedback remains.
- **Done when**: <criteria a machine or an eye can check>.
````

## Notes for the plan author

- One plan per finding. Findings that share every file and the same fix (one token swap across components) may share a plan.
- Pull every value from [categories](categories.md) or the files it links; never from memory.
- The feel check is required. Motion can be mechanically right and still feel wrong; give the executor, or whoever reviews the executor's diff, concrete things to watch.
- After writing plans, update `plans/README.md`: a table of plans (number, title, severity, status), the order to run them, and dependencies between them.
