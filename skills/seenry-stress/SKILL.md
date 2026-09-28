---
name: seenry-stress
description: "Render and stress-test one existing UI component across realistic content, states, input and container sizes. Use to find clipping, unclear states, accessibility or responsive failures before release."
license: MIT
metadata:
  author: Seenry
---

# Seenry Stress

Scope one component and its actual host. Read its props, data shape, states and supported inputs. Derive scenarios from what can really vary: long and empty text, zero or large values, missing media, loading, error, selected, disabled, narrow container, zoom, keyboard and reduced motion. Do not generate an exhaustive Cartesian product or invent states the component cannot reach.

Before rendering, write down the selected scenarios and why each applies. Build a temporary inspection surface or use the project's story/test harness. Keep the original component and styles; a rewritten mock cannot reveal its real weaknesses. Render scenarios side by side at their intended footprint, plus one narrow host where relevant. Exercise interactive cases rather than displaying impossible static combinations.

Inspect the resulting pixels and behavior. Name what visibly breaks: text collision, clipped content, ambiguous icon, lost focus, detached feedback, hidden action, bad recovery or layout shift. Distinguish a verified break from a hypothetical risk. For accessibility concerns, perform the relevant keyboard or screen-reader check before claiming the user path fails. Capture evidence and report the smallest fix and retest scenario.

This is a diagnostic tool. It does not choose a new creative direction or prove a component fits the entire product. Use [Seenry Review](../seenry-review/SKILL.md) when the issue concerns overall hierarchy or art direction.
