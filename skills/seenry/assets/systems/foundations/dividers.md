# Dividers

## The rule

**A divider either runs the full width of its container, touching its edges, or stops exactly at the content inset, aligned with the text above and below. Never anywhere in between.**

| Pattern | Where the rule ends | Use |
| --- | --- | --- |
| Full bleed | Touches the container's border on both sides (it meets the card edge with no gap) | Section breaks inside a card; table header and footer rules; between a card's header and body |
| Content inset | Starts and ends exactly at the content padding, in line with the text | Between rows of a list where rows share one leading edge (Apple's grouped lists, Emil's network list) |
| Leading inset | Starts at the text, after an icon or avatar, and runs to the container edge | Lists with leading media, so the media column reads as one group |

A rule that stops 6px short of a card edge, or overshoots the text by 4px, looks broken. One container uses one pattern for all its rows.

## Why

- **Gestalt continuity and common region:** a line that meets the container's edge joins the region; a line aligned to the text joins the content. A line that does neither belongs to nothing, and the eye reads it as an error.
- **Proximity first:** Nielsen Norman Group and Material both recommend space and tone before rules. Use a divider only where space alone cannot separate (dense rows, tables); in airy layouts remove it.
- **No doubles:** where a divider meets a container's border, they must not stack into a 2px line. The last row of a list has no bottom rule when the container already has a border.

## In CSS

```css
.ui-list { padding-inline: 0; }
.ui-list-item { padding-inline: var(--pad); }
/* content inset: the rule sits inside the row's padding */
.ui-list-item + .ui-list-item { box-shadow: inset 0 1px 0 var(--line); background-clip: padding-box; }
.ui-list.inset .ui-list-item + .ui-list-item::before { content: ""; position: absolute; top: 0; inset-inline: var(--pad); height: 1px; background: var(--line); }
/* full bleed inside a padded card: cancel the padding */
.card > hr { margin-inline: calc(var(--pad) * -1); }
```

Hairlines are 1px (or 0.5px on 2x displays when the system defines `--hairline`), in one line color per theme.

## Check

`system_check.mjs` finds every visible horizontal rule (an `hr`, or a border-top or border-bottom, or an inset 1px shadow) inside a container that has a border, background or radius, and measures the gap from each end of the rule to the container's border edge. It fails when a gap is neither about 0 (full bleed) nor equal to the container's content padding (inset) within 2px, and when sibling rules in one container use different patterns.
