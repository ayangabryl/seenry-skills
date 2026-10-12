# Research: from real screens to a spec

Research ends in a spec you can check in a screenshot, with every decision traced to a screen you looked at. Looking at screens without a question is tourism; a mood board is not a spec.

## Name the jobs first

Before any search, write `research/brief.md`: the product, who opens it and why, and the references the brief names. Split them by job:

| Job | Comes from | Question it answers |
| --- | --- | --- |
| **Flow** | the app the product is based on ("based on X") and the category leaders | Which steps, in what order, what each one asks and gives back |
| **Look** | the app it should look like ("design it like Y"), or the project's brand | Palette, type, numerals, signature components, density, corners, motion feel |
| **Edge** | apps outside the category doing the same communicative job | The one idea nobody in the category has |

If the brief names only one app, it supplies both flow and look. If it names none, find the category leaders by app name (below) and choose the look on purpose; never let it default to system blue.

## Seenry tools for apps

| Need | Call |
| --- | --- |
| Find an app and its flows | `search_app_flows {q: "<app name>"}` returns every flow with its screen count. Search by name; a category word alone mostly matches whatever has that word in its name |
| Walk a flow in order | `get_app_flow {id, flow, limit: 10, offset}`. Page until the flow ends; a sampled journey lies |
| One screen type across apps | `search_app_screens {q: "paywall", diversify: true}`; `search_mode: "explore"` for broader candidates, `exact` for literal labels |
| Category plus UI ("finance onboarding") | `search_reference_assets {family: "apps", q}`; verify each hit on the pixels, since product context does not prove the UI |
| How a screen moves | `search_app_screens {q, media_type: "video"}` and the flow's video assets |
| One screen in depth | `get_reference_context {id, index, neighbors: 2}` for the screens around it |
| The edge | `borrow_references {job: "<what the screen must communicate>", exclude_category: "<category>", families: ["apps", "websites"]}` |

The watermark on app screens is provenance; ignore it and never reproduce it.

## Depth

- **Flow.** Walk the based-on app's complete flow, every screen, plus two or three best-in-class flows from leaders inside or outside the category (for onboarding: the category leader, then Headspace, Duolingo, Calm or Noom, by name). At least three complete flows.
- **Look.** At least 8 screens of the look app across 2–3 flows (welcome, the home or signature screen, a detail or setup screen). Open the most distinctive one with `get_reference_context`.
- **Screen type.** 10+ screens of each screen type you build that the flows did not already cover (paywall, permission pre-prompt, payoff).
- **Stop at saturation.** You are done when new screens stop changing the spec. Until then, keep going.

## Write it down as you go

```
research/
  brief.md        jobs, named apps, the question each pass answers
  flows.md        per flow: app, flow name, screen ids in order, one line per step (asks / gives / presentation)
  look.md         the look app's visual language (also saved as .seenry/look.md)
  patterns.md     table stakes (all winners do it), edge (only the best do it), opening (all do it badly)
  decisions.md    each decision with the screen ids it came from
```

Screen ids last; media links do not. Note the ids so any screen is one `get_reference_context` away.

### flows.md: chart the spine

For each studied flow, one row per step: the step's one job, what it **asks** (a tap, a fact, a permission, money), what it **gives** (a promise, a preview, a result built from the answers), and what it **is** (pushed screen, sheet, modal, overlay, replace). Put the flows side by side: where winners converge is a convention you break only on purpose; where they diverge is a real choice to make and justify.

### look.md: the visual language, specifically

- Background and surface colors (hex measured from the pixels), the single accent and what it marks
- Type: the family's feel (grotesk, condensed, rounded, serif), weights used, numeral style (tabular, monospaced, split-flap), the size of the hero number
- Signature components, by name: the two or three things that make the app recognizable at a glance (Flighty: split-flap times, departure-board rows, status pills, a live timeline). Each one becomes a component in your build carrying your product's content.
- Density, corner radii, separators vs cards, icon style
- How motion confirms state (flips, ticks, fills)

Mark which of these are the app's platform defaults (system blue, SF Pro, white grouped sheets) and which are its signature. Take the signature; the defaults are what every app has, and copying them produces a template. Translate, don't trace: the same grammar with your product's content and name. Copying a screen one to one is lazy and legally risky.

## Turn research into a spec

`decisions.md` is the spec. Each line is checkable in a screenshot and cites its source:

> Sleep need payoff: hero number 72pt condensed tabular, split-flap digits, amber accent only on the debt figure. From Flighty `b41a…` Mobile Screen 3 (delay time treatment) + RISE `9004…` Onboarding 28 (sleep need reveal).

A decision with no source is your own invention; mark it as such so the review can judge it.
