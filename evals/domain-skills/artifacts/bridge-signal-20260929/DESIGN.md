# Bridge Signal — design decision

## Brief lock

- **Audience:** people about to walk across a river footbridge during temporary wind restrictions.
- **Object:** the current sample bridge status and short wind forecast.
- **Decision:** cross while open, or plan around a predicted restriction.
- **Supplied facts:** sample time 16:20; open now; wind 24 km/h; restriction threshold 35 km/h; 17:00 29, 17:30 36, 18:00 38, 18:30 32, 19:00 25 km/h.
- **Allowed fiction:** Bridge Signal identity, crossing advice derived from the sample and an illustrative display of the supplied data. No geographic location, live feed, update cadence, or official authority is implied.
- **Actions:** “See full forecast” scrolls to the data table; sample-condition controls change the status, wind figure, advice, and selected forecast focus locally.
- **Existing brand:** none.
- **Avoid:** category eyebrow + oversized soft-serif promise + accented phrase + atmospheric explanation; also avoid a long sans-serif promise stack before the decision.

## Decisive region and reference

The first screen must show **OPEN NOW**, **17:30 predicted restriction**, and **cross before 17:30 if your walk can finish by then**. The threshold and forecast should explain that advice. The critical state change is selecting a later sample condition and seeing the status/advice update.

Seenry Weather OS reference (page `1a8e0311d2ac480dac7f8644f5d237e3`, desktop screenshot segment 0, inspected at pixels): two direct weather controls sit in the center of a sky scene, with values anchored at their ends. Its transferable relationship is an immediate, manipulable condition and nearby numeric feedback. Its broad atmospheric canvas is unsuitable for an urgent crossing decision. Our original design uses direct sample controls beside explicit bridge outcomes, with no borrowed assets.

## Two studies

- **A — control desk:** dark status field and a compact vertical forecast. Reading order starts with the status and recommendation; the five values justify it at the side or below. Strong status contrast, but the table of bars may feel like a generic operations dashboard.
- **B — crossing window:** a horizontal time rail centers the impending restriction. The current open state sits directly above a crossing instruction. The forecast below expands the rail into exact values. Stronger relationship between “open now” and “restriction ahead,” but the rail must remain legible on a phone.

Both use the same sample facts. The chosen direction and rendered comparison will be recorded after capture.

### Rendered comparison and selection

Study A made “OPEN NOW” very prominent, but at both widths it pushed the forecast into a second block and made the first useful comparison feel like a separate dashboard. Study B put open/restricted intervals directly between the current state and the advice; at phone width, the predicted 17:30 change and the action remain in the opening view. **Select B** for the complete page. The rail will use time-proportional segments and its exact values will be listed below.

The Codex CLI direction gate returned `Unverified`, because its reviewer could not initialize an app-server client in this sandbox (`Operation not permitted`; see `direction-review/review/codex.log`). This direction lacks independent gate approval. The selection is based on direct inspection of the four captures, and the trial proceeds to preserve the requested first complete page.

## Layout ownership

Study/page outer gutter: `clamp(20px, 4vw, 64px)`; content maximum: 1320px. Study A uses a two-column status/forecast grid that stacks at phone width. Study B uses the same outer content edge, with a single time-rail owner and a separate recommendation band. Filled surfaces use either 0px or 16px radii according to role; buttons use a small 6px radius. Typography is a compact system sans stack with tabular numerals for time and wind values.
