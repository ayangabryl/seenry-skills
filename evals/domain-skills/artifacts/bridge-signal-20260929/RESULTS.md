# First-pass result

Built the Bridge Signal prototype from Study B. The first screen shows the sample open status, 17:30 predicted restriction, 35 km/h threshold, crossing advice, and a link to the full forecast. Three local sample controls are implemented in `app.js` to change the displayed condition, wind, next time, advice, and pressed state. The forecast table contains the supplied five forecast values plus the supplied 16:20 sample.

## Captures preserved

- `study-a-wide.png` and `study-a-narrow.png`: Study A at 1440 and 390 CSS px.
- `study-b-wide.png` and `study-b-narrow.png`: Study B at 1440 and 390 CSS px.
- `first-wide.png`: first complete page at 1440 CSS px, 1440 × 1903 PNG.
- `first-narrow.png`: first complete page at 390 CSS px, 390 × 1955 PNG.

Chrome's study screenshot API omitted the scrollbar from the bitmap, so study PNG pixel widths are 1425 and 375; the browser viewport overrides were 1440 and 390 CSS px. The complete page hides that scrollbar and its PNG widths match the requested CSS widths. The page was served from `http://127.0.0.1:8766/` over localhost for capture.

## Checks and limits

- `node --check app.js` passed.
- Seenry `semantic_names.py` found no generic-element ARIA-name issue.
- `token_contrast.py` could not infer the page background from the CSS. Direct opaque-pair checks passed for body, muted copy, red time, alert badge, and the light rail. The original study rail's white-on-red pair measured 4.472:1; the complete page used a darker red before capture.
- The Seenry direction gate returned `Unverified` because Codex CLI could not initialize its app-server client in this sandbox. The error is recorded in `direction-review/review/codex.log`. No independent direction approval is claimed.
- Playwright browser launch through the shell failed: Chrome and Chromium aborted with a macOS permission error; WebKit also aborted. Captures succeeded through the connected Chrome browser tool. The failed local `capture.mjs` attempt is retained as trial evidence.
- The complete captures show a visible narrow-screen copy defect: hiding the line break in “Next predicted restriction” joins “predicted” and “restriction” without a space. The page was not repaired after the first complete captures. The sample-condition interaction was implemented but not exercised after capture, in keeping with the stop point.

No page source was changed after `first-wide.png` and `first-narrow.png` were saved.
