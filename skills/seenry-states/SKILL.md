---
name: seenry-states
description: "Renders one real component in every state it can be in (loading, empty, error, one item, many, permissions, plans, feature flags) on a throwaway page inside the app, fed by product-shaped mock data, with a switcher to flip between states, then removes the page in one step. Use when designing or polishing a component's states, when asked to see all states, the empty or error state, or what a component looks like for another role or plan, or before reviewing a component that has only been seen with happy-path data."
license: Apache-2.0
metadata:
  author: Seenry
  version: "2.2.0"
---

# Seenry States

This skill puts one real component on a workbench where every state is one keypress away. It is not a review (`seenry-review`), a stress test with hostile data (`seenry-break`) or a way to explore alternatives (`seenry-canvas`).

## Operating posture

You are setting up a workbench for someone who will then work on the visuals. Most components are only ever seen in one state, with data that loads instantly and a user who may do everything. The other states ship unseen. Your job is to make each one reachable and hold it still, without changing the component.

## Words this skill uses

| Word | Means |
| --- | --- |
| state | One branch the component's code can actually reach, named the way the product names it |
| workbench | The throwaway page: the real component, its fixtures and the switcher, in one folder |
| fixture | Mock data for one state, shaped like the product's real data |
| seam | The place the component receives its data: props, a query cache, a provider, request mocks |
| switcher | The control that flips states; deliberately not styled like the product |

## Hard rules

1. **One component per run.** "The settings page" is several: list them and ask which.
2. **The real component, untouched.** Import it from the project. Never rebuild a lookalike, restyle it, or add a branch to it to show a state.
3. **A state the code cannot reach is not a state.** Where the design shows one the code lacks, list it as missing.
4. **Feed data at the seam, from the page.** Editing the component to accept fixtures needs the person's yes.
5. **Product-shaped data.** Real-looking names, amounts, timestamps and counts. Three rows of "Test item" make every state look fine.
6. **Hand over, then stop.** Changing how a state looks is the next request. Remove the workbench only on the person's word.

## Workflow

```
- [ ] 1. Scope one component
- [ ] 2. Find the states in the code
- [ ] 3. Build the workbench
- [ ] 4. Feed each state at the seam
- [ ] 5. Add the switcher
- [ ] 6. Load every state, then hand over
```

### 1. Scope one component

Restate it in one sentence: what it shows, where it renders in production, where its data comes from.

**Done when** the component and its production width are named.

### 2. Find the states in the code

Read the component and its data hooks for every branch:

| Kind | States to look for |
| --- | --- |
| Data | Loading, empty, error, one item, a typical set, enough to scroll or paginate, some requests done and others pending, stale data refetching |
| Account | Plan tier, role and permission checks, owner versus member |
| Feature | Flags, trials, limits reached, a locked or disabled feature |
| Input | Pristine, dirty, invalid, submitting, saved, failed |

Write the set down before building, one line each, in the product's words (`empty`, `enterprise`, `member-no-access`), grouped under headings by what changes (Data, Access, Plan). Say which kinds you found none of.

**Done when** every reachable branch has a named state and missing ones are listed.

### 3. Build the workbench

A scratch route inside the app (for example `/states/audit-log`) so the component inherits the app's layout, fonts, styles and providers. One folder holds the page, the fixtures and the switcher, so removal is one delete. Render one instance in a container as wide as the component is in production. Where the framework splits server from client code, make the page client code (`"use client"` in Next), or fixtures can vanish at the boundary and the page renders empty.

With no app (a design on the Seenry canvas), make each state its own screen file in the component's section instead; the canvas is then the workbench.

**Done when** the route renders the real component.

### 4. Feed each state at the seam

In order of preference: props, where the component takes data as props; then the app's own seam (a seeded query cache, a mock provider, the project's request mocks). Fixtures threaded through props five levels down test a path production never takes. Loading and pending states hold still until the switcher moves; never resolve them on a timer.

**Done when** every state has a fixture and none required editing the component.

### 5. Add the switcher

Build it from [the switcher spec](references/switcher.md): a grouped list beside the component that sets a `__state` search param, so every state is a link; arrow keys step through; `H` hides it for screenshots. It uses no project tokens, so it never becomes part of what is being judged.

**Done when** every state is reachable by click, by key and by URL.

### 6. Load every state, then hand over

Open the page and flip through all of them. Each shows its mock data: not the real data, not a blank region. A fixture that never appears is the common failure (live sync, a cache refetching over the seed, a server boundary dropping it): fix the plumbing, not the component. Without a browser, say so and hand over the address.

Hand over the address, the list of states, the keys, and the missing states. After any visual change, flip through every state again: a fix for one often breaks another.

**Done when** every state has been seen rendering, or the handover says what was not seen.

## Removing it

On the person's word: delete the folder and any seam they approved, then search the codebase for the route and fixture names and confirm the diff touches nothing else.

## Before you finish

| Mistake | Fix |
| --- | --- |
| The component edited to accept fixtures | Feed data from the page; ask before adding a seam |
| A lookalike rebuilt on the page | Import the real component |
| The page restyles or re-themes the component | The app's layout, fonts and tokens as they are |
| A branch added to show a state | Leave unreachable states out and list them |
| "Item 1", "Test user", three rows | Product-shaped data in real quantities |
| Loading resolves after a timeout | Hold it until the switcher moves |
| Handed over without loading each state | Load every one; blank or real data means broken plumbing |
| A switcher styled with the project's tokens | Keep it visibly outside the design system |
| One long row of tabs | A grouped list, or a select where it does not fit |
| Visuals changed unasked, or the page deleted in the same turn | Hand over and wait |

## When the person says

| They say | You do |
| --- | --- |
| "Show me every state of X" | Steps 1 to 6 |
| "What does it look like empty, or for a member?" | Steps 1 to 6, at least those states |
| "Now fix the empty state" | Make the change, then flip through every state |
| "Try the worst case" | `seenry-break` on the same workbench |
| "Done, remove it" | Removing it |

## Tone

Plain. List the states in the product's words, say which you could not reach and why.

## Files

| Need | Read |
| --- | --- |
| The switcher's behavior, markup and styles | [switcher](references/switcher.md) |
