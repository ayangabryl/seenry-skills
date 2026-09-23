# Design record

## Brief and product truth

Fieldwork is a fictional independent architecture studio in Lisbon. The audience is homeowners considering a renovation. The supplied proof is intentionally limited to three named projects, three services, a three-step process and a contact address. The site must not imply awards, endorsements, client outcomes or real built work.

The visitor needs to understand first that Fieldwork shapes renovations around ordinary domestic routines; feel that the studio is observant, warm and precise; then either inspect the work or begin an inquiry. The opening therefore pairs the headline with an original animated plan of a home whose rooms are named by daily activity. The projects immediately below are the visible evidence. The drawings are explicitly described as project studies, so the code illustration does not masquerade as photography.

Primary attention: the studio proposition and the project studies. Supporting information: services and process. Brand expression lives in drawn thresholds, warm mineral color and compact annotations. Stable interaction anchors are the top-right inquiry action, filter bar and modal close control.

Decision brief: discover and compare, then begin a local inquiry. Constraints: standalone HTML/CSS/JS, local Open Runde only, original CSS/SVG artwork, responsive, keyboard accessible, reduced-motion support.

## Reference evidence

Evidence route: public web plus local authored studies; Seenry MCP was not available or used.

Inspected `https://www.common-ground.studio/` on 2026-09-23 at approximately 1265×744. Observed relationship: a small, calm wordmark and sparse controls leave a generous white field around a large architectural image; later imagery uses staggered scale rather than equal cards. Why it works there: the portfolio material remains dominant and the page feels like a studio rather than a sales funnel. Relevance: renovation clients need to judge spatial thinking without promotional clutter. Adaptation: Fieldwork uses large original plan/section illustrations, offset project compositions and short domestic annotations. The source photography, type sizing and exact composition are not reused.

Limitation: only the public home page and a later image sequence were inspected. No external reference interaction was used as evidence. Original wireframes below are hypotheses, not craft references.

## Alternatives before implementation

### A — Inhabited plan (selected)

Opening reads headline → short promise/action → oversized plan drawing with activity labels. Projects become three varied architectural plates filtered in place. On narrow screens the text precedes the plan, and plates become a single column. Subject-specific operation: filtering between houses and interiors feels like leafing through a drawing set. Still elements: wordmark, inquiry action, room names. Cost: abstract drawings provide less material proof than photography. Failure mode: drawings can feel technical or empty if they lack believable domestic detail.

### B — Renovation ledger

Opening reads project index → studio proposition → selected project preview. A vertical list aligns place, year and typology like a project register. Narrow behavior becomes a simple stacked index. Subject-specific operation: selecting a row reveals a before/after plan pair. Cost: asks homeowners to interpret documentation before hearing the studio's promise. Failure mode: can feel institutional and emotionally distant.

### C — Day through the house

Opening follows morning → afternoon → evening through three spatial vignettes, with services attached to the relevant stage. Narrow behavior becomes a vertical story. Subject-specific operation: time-of-day selection changes the drawing light. Cost: slower access to the project index and inquiry. Failure mode: risks making a fictional lifestyle narrative look like a client claim.

Selection: A puts the supplied promise and real project names first, supports the required filter naturally, and can remain truthful with explicitly illustrative drawings. B is quieter but makes the work less approachable. C carries more atmosphere but invents a narrative the brief does not support.

Authored structural comparison: `evidence/wireframes.html`.

## Selected system

Relationship 1: generous parchment canvas + dark ink typography + one fired-clay action color. Relationship 2: large spatial plates + compact captions and rules. Relationship 3: exact editorial alignment + imperfect-looking hatched SVG material.

Typography: Open Runde Regular and Semibold from the supplied local URLs; large sentence-case display copy, readable body, restrained metadata. Color roles: warm canvas, off-white paper, near-black ink, muted grey secondary, clay commitment/action, pale sage selection and focus support. Selection is shown with text weight, underline/boundary and `aria-pressed`, not hue alone.

Motion contract: on load, copy and drawing elements settle upward with short staggered opacity/transform transitions. Filter trigger stays fixed; project plates fade and shift a few pixels during selection, then hidden items become inert. Modal fades while the panel moves from a short vertical offset; Escape/cancel closes it and restores focus to its trigger. Validation is immediate and static. Reduced motion removes transforms, stagger and smooth scrolling while retaining every final state and visible cue.

## Verification and disposition

Planned checks: desktop and mobile visual inspection; full-page rhythm; all three filters; modal open/cancel/Escape/focus return; required-field and email validation; success state truthfulness; keyboard order; reduced-motion emulation; console errors; local font requests.

Author review at the specified direct URL on 2026-09-23:

- Subject — pass / supported: desktop and mobile renders show the architecture-studio proposition, three supplied services, three supplied projects and inquiry path without unrelated process content.
- Opening — pass / supported: the headline and original courtyard plan are the dominant first-screen relationship; the project section is the next destination and the mobile order preserves that sequence.
- Hierarchy — pass / supported: desktop and 375px-wide browser inspection showed clear heading/body/action order with no horizontal overflow. The 375px render measured `scrollWidth === clientWidth`.
- Material — pass / supported: all three original SVG studies rendered at intended scale; Open Runde reported loaded and active; the palette and line language carry across opening, projects, process and modal.
- Interaction — pass / supported: Interiors filtered to one visible project with live status; empty submit surfaced three inline errors and focused Name; valid input reached the explicit no-message-sent state; Escape closed the dialog and returned focus to its trigger; reduced-motion emulation matched and reduced transition/animation duration to `0.001ms` with automatic scrolling.

Browser console inspection found no warning or error attributed to the localhost page. Stale warnings in the tab came from the separately inspected public Squarespace reference.

Status: ready-for-review. This is author self-review, not user acceptance or a claim of superiority over another implementation.
