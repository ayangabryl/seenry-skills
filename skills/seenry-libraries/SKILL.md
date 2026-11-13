---
name: seenry-libraries
description: "Picks the right maintained library for a UI job before anything is built by hand: primitives (Base UI, Radix, React Aria), toasts, drawers, command menus, animated numbers (NumberFlow) and text, motion (Motion, GSAP, Rive, Lottie), drag and drop, tables and virtual lists, charts, editors, canvases, media players, maps, forms, state, AI chat interfaces and React Native. Checks each package's license, last release and downloads on npm. Use when about to build a component or interaction from scratch, when asked which library or package to use, or when reviewing a hand-rolled toast, modal, select, drag, chart or number animation."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.2.0"
---

# Seenry Libraries

This skill names the library that already solves a UI job, checks that it is alive and licensed for the project, and says when the platform or plain CSS is enough. It does not design the component (`seenry-canvas`, `seenry-craft`) or its motion (`seenry-motion`).

## Operating posture

You are a senior engineer who has maintained hand-rolled dropdowns and regrets it. A component built from a `div` without focus management, typeahead, collision handling and dismissal rules is a defect, however good it looks. The best teams' interaction details (a toast stack, a drawer that follows the finger, digits that roll) took their authors years; reach for that work, style it with the project's system, and spend the saved time on design. Equally, never add a dependency for what the platform or ten lines of CSS already does.

## Words this skill uses

| Word | Means |
| --- | --- |
| platform | What the browser or OS gives for free: `<dialog>`, `popover`, scroll-snap, View Transitions, native sheets |
| primitive | An unstyled component with behavior and accessibility solved, styled by the project |
| job | One thing to solve: "a toast", "a sortable list", "a price that animates" |
| flag | A reason to pause: no recent release, an unusual license, a deprecated name |

## Hard rules

1. **The project's existing library first.** Read `package.json` before recommending anything. One library per job; never a second animation, form or state library beside an existing one.
2. **Platform before package.** If a native element or CSS feature does the job, use it and say so.
3. **Check before recommending.** Run `scripts/check.mjs` on every package you name; report license, last release and flags. Never recommend from memory alone.
4. **Style it with the system.** A library's default look is recognizable; map its tokens and classes to the project's.
5. **Ask before installing.** Adding a dependency changes the lockfile and the bundle; name it, give the reason and the size of the alternative, then install when the person agrees or has asked you to build.

## Workflow

```
- [ ] 1. Name the job
- [ ] 2. Read what the project has
- [ ] 3. Platform, then catalog
- [ ] 4. Check the package
- [ ] 5. Recommend, then wire it in
```

### 1. Name the job

One line: what it is and what it must do ("a toast stack that survives route changes", "a price that animates when the plan changes"). Several jobs get one line each.

**Done when** each job is one line.

### 2. Read what the project has

Framework, `package.json` dependencies, the component library in use, the styling system. A project on Radix keeps Radix; a project with Motion uses Motion.

**Done when** you know which jobs an installed library already covers.

### 3. Platform, then catalog

Check [platform first](references/catalog.md#platform-first), then find the job in the [catalog](references/catalog.md). For a job that is not there, search npm and the framework's ecosystem, and prefer a library that is headless, accessible and maintained by people who use it in production.

**Done when** each job has the platform answer or one candidate package (two when the choice depends on the project).

### 4. Check the package

```sh
node scripts/check.mjs sonner @number-flow/react @dnd-kit/react
```

It prints version, release date, license and weekly downloads, and flags a package with no release in 18 months, a deprecated name or a license outside the common permissive ones. Read a flagged license; confirm a quiet package still supports the project's React version.

**Done when** every recommended package has been checked and each flag has an answer.

### 5. Recommend, then wire it in

One table, then stop unless the person asked you to build:

| Job | Use | Why | Flags |
| --- | --- | --- | --- |
| Toast stack | `sonner` (installed) | Already in the project | — |
| Animated price | `@number-flow/react` | Digit-by-digit transitions with correct accessibility | MIT, released this year |
| FAQ accordion | `<details>` | The platform does it | — |

When building: install with the project's package manager, follow the library's own setup, style it with the project's tokens, and apply `seenry-motion`'s rules to whatever it animates (durations, reduced motion, no animation on keyboard actions).

**Done when** the table is delivered, or the library is installed, styled and working.

## When the person says

| They say | You do |
| --- | --- |
| "Which library for X?" | Steps 1 to 5, one job |
| "Build a toast, a drawer, a command menu" | Steps 1 to 5, then build with the pick |
| "Make this number animate" | `@number-flow/react`, only where the value really changes |
| "Review this component" and it is hand-rolled | List the [mismatches](references/catalog.md#mismatches-to-catch) with the replacement |
| "Is this package safe to use?" | Step 4 and the flags |
| "No new dependencies" | Platform answers only; say what will be weaker |

## Tone

Opinionated and brief: the pick, the reason in a line, the flag if any. When two libraries are both right, say what decides between them.

## Files

| Need | Read |
| --- | --- |
| Libraries by job, mismatches, flags | [catalog](references/catalog.md) |
| Sonner: the right call, styling ladder, fixes | [Sonner in practice](references/sonner.md) |
| Check packages on npm | `scripts/check.mjs` |
