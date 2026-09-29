# Seenry signature components

Eight small, dependency-free components for a single crafted moment on a page. Copy `seenry-signature.css` and `seenry-signature.js` into a project, then load them with ordinary tags. Both files work from `file://` and in a build pipeline.

```html
<link rel="stylesheet" href="seenry-signature.css">
<script src="seenry-signature.js" defer></script>
```

The CSS defines the Seenry product roles (`--font`, surfaces, text levels, `--accent`, status colors, radii and motion values). Override those roles on `:root` and `[data-theme="dark"]` to match a project. A page with no explicit `data-theme` follows `prefers-color-scheme`. All components have a readable static state for reduced motion. `window.SeenrySignature.init(container)` initializes newly added markup; the initial document is initialized automatically.

For React, render the same HTML structure and call `SeenrySignature.init(ref.current)` once after mount. The snippets below show the per-component structure; include the CSS and script once at app level. Use a stable `key` and mount each instance once: reinitializing an existing instance would duplicate observers.

## Choosing the signature moment

| Page and content | Best fit |
| --- | --- |
| Software landing page with a real feature interaction | Product demo player |
| Service page explaining five related disciplines | Line illustration draw-in |
| First screen or closing section with spacious copy | Ambient field |
| Product story with three to five sequential changes | Scroll story |
| A verified figure or genuinely changing operational value | Number or live value |
| Named customers or partners with permission to show their marks | Logo marquee |
| Two directly comparable versions of the same artifact | Compare slider |
| Portfolio or editorial case-study index with real preview media | Case-study card |

Use one per view. Build an original moment when the content has a unique mechanism that these cannot explain, such as a specialized editor, map, or physical product. Avoid adding any component solely to fill space.

## Product demo player

**Use for:** A short, repeatable explanation of an actual product interaction. Keep the authored controls usable. The timeline is a sequence of hidden elements with `data-at` in milliseconds, `data-action`, `data-target`, and optional `data-value`. Supported actions: `move`, `click`, `type`, `open`, `close`, `value`. Targets use `data-demo-target="name"`. A click is visual feedback; attach the real application behavior to the button itself. The gallery has a complete example.

```html
<div class="s-demo">
  <div class="s-demo__bar"><span>Forecast</span><button class="s-button" type="button" data-demo-toggle>Play demo</button></div>
  <div class="s-demo__ui">
    <label for="seats">Seats</label><input id="seats" data-demo-target="seats" value="24">
    <button class="s-button s-button--primary" type="button" data-demo-target="calculate">Calculate</button>
    <strong data-demo-target="total">$288</strong>
    <div data-demo-target="panel" data-demo-panel inert>Team plan details</div>
  </div>
  <svg class="s-demo__cursor" viewBox="0 0 18 21" aria-hidden="true"><path d="M2 1v16l4.5-4 3.4 6 2.3-1.2-3.3-5.9 6-.3z"/></svg>
  <span class="s-demo__click" aria-hidden="true"></span>
  <span hidden data-demo-step data-at="500" data-action="move" data-target="seats"></span>
  <span hidden data-demo-step data-at="1200" data-action="type" data-target="seats" data-value="42"></span>
  <span hidden data-demo-step data-at="2000" data-action="value" data-target="total" data-value="$504"></span>
  <span hidden data-demo-step data-at="2500" data-action="open" data-target="panel"></span>
</div>
```

**Options:** Any number of steps; timing is relative to the start of each loop. The demo pauses offscreen and on hover, and stops when a user interacts. The replay button resumes it. For a loading state, set `aria-busy="true"` on the authored UI and show a plain loading label. For an error, retain a visible message in the authored UI. Longer content wraps in the panel.

**Keyboard:** Tab reaches the replay control and all authored controls. Space or Enter activates native buttons. Focusing or operating the UI takes over. Reduced motion settles the scripted content as a static example and disables replay.

**React:**

```jsx
function Demo() {
  const ref = React.useRef(null);
  React.useEffect(() => window.SeenrySignature.init(ref.current), []);
  return <div ref={ref} className="s-demo">{/* paste the HTML structure above as JSX; use htmlFor and onClick for real actions */}</div>;
}
```

## Line illustration draw-in

**Use for:** A service or system whose structure is easier to understand as a diagram. The five complete 30° isometric SVG examples in `gallery.html` cover branding, product design, engineering, landing pages, and design systems. Every path is a 1.25px stroke. Use the same geometry for a whole set.

```html
<figure class="s-draw">
  <svg viewBox="0 0 160 112" role="img" aria-label="Brand mark construction on an isometric plane">
    <path d="M20 61 80 26l60 35-60 35zM20 61v13l60 35V96m60-35v13l-60 35"/>
    <path data-accent d="m59 62 21-12 21 12-21 12z"/>
  </svg>
  <figcaption>Branding</figcaption>
</figure>
```

**Options:** Any SVG with `path`, `line`, `polyline`, or `polygon` works. Call `SeenrySignature.drawSVG(svg, trigger)` when using an SVG without `.s-draw`. Lines are visible in static captures and print; first-view motion overlays the draw-in. `data-accent` marks one explanatory line.

**Keyboard:** This is a figure, not a control; the SVG has a text alternative. No keyboard action is needed.

**React:**

```jsx
function ServiceDrawing() {
  const ref = React.useRef(null);
  React.useEffect(() => window.SeenrySignature.drawSVG(ref.current.querySelector('svg'), ref.current), []);
  return <figure ref={ref} className="s-draw"><svg viewBox="0 0 160 112" role="img" aria-label="Brand construction"><path d="M20 61 80 26l60 35-60 35z" /></svg><figcaption>Branding</figcaption></figure>;
}
```

## Ambient field

**Use for:** A quiet section where a dot grid can reflect pointer and scroll movement without obscuring content. The canvas is decoration and must not carry information.

```html
<div class="s-ambient">
  <canvas aria-hidden="true"></canvas>
  <div class="s-ambient__content"><h2>A calmer way to see the signal.</h2></div>
</div>
```

**Options:** Size the wrapper with `min-height`; customize `--line-strong` and `--accent`. The canvas caps device pixel ratio at 2 and draws at about 24 frames per second while visible. It pauses offscreen and is static under reduced motion. Keep readable copy on its own `--surface` panel.

**Keyboard:** None; content remains ordinary document content.

**React:**

```jsx
function AmbientHero() {
  const ref = React.useRef(null);
  React.useEffect(() => window.SeenrySignature.init(ref.current), []);
  return <div ref={ref} className="s-ambient"><canvas aria-hidden="true"/><div className="s-ambient__content"><h2>A calmer way to see the signal.</h2></div></div>;
}
```

## Scroll story

**Use for:** Three to five distinct claims, each with a corresponding product state. The page scroll stays native. Keep the visuals the same dimensions to avoid layout jumps.

```html
<section class="s-story">
  <div class="s-story__steps">
    <div class="s-story__step"><h3>Start with the brief</h3><p>Requirements in one place.</p></div>
    <div class="s-story__step"><h3>See what changed</h3><p>Review rows with context.</p></div>
    <div class="s-story__step"><h3>Share the outcome</h3><p>The shipped version and its owner.</p></div>
  </div>
  <div class="s-story__stage" aria-label="Product preview">
    <div class="s-story__visual"><!-- real product state one --></div>
    <div class="s-story__visual"><!-- real product state two --></div>
    <div class="s-story__visual"><!-- real product state three --></div>
    <div class="s-story__progress" aria-hidden="true"></div>
  </div>
</section>
```

**Options:** Steps and visuals match by DOM order. Progress segments are generated. A missing visual remains an empty state; author the fallback message inside that visual. Long step text wraps naturally. On phone, the stage becomes a shorter sticky panel above the steps.

**Keyboard:** Ordinary page scrolling and links within steps work. No scroll trap or custom keys. Visuals are marked `aria-hidden` except the selected one; do not put essential actions solely in a visual.

**React:**

```jsx
function Story({steps}) {
  const ref = React.useRef(null);
  React.useEffect(() => window.SeenrySignature.init(ref.current), []);
  return <section ref={ref} className="s-story"><div className="s-story__steps">{steps.map(s => <div className="s-story__step" key={s.title}><h3>{s.title}</h3><p>{s.copy}</p></div>)}</div><div className="s-story__stage">{steps.map(s => <div className="s-story__visual" key={s.title}>{s.visual}</div>)}<div className="s-story__progress" aria-hidden="true"/></div></section>;
}
```

## Numbers and live values

**Use for:** Verified numeric evidence or a real metric that changes. The helper follows `SeenryMotion.number(el, value, Intl.NumberFormatOptions)` and keeps one accessible text value beside a presentation-only reel.

```html
<div class="s-value s-count" data-value="12480" data-format='{"maximumFractionDigits":0}'>
  <div class="s-value__label">Files reviewed this quarter</div>
  <strong class="s-value__number">12,480</strong>
</div>
<div class="s-value s-ticker" data-values="42,43,44" data-interval="3600">
  <div class="s-value__label">Open reviews</div>
  <strong class="s-value__number">42</strong>
</div>
```

**Options:** `data-value` for count-up; `data-values` is a comma-separated sample stream for a demo; `data-interval` is milliseconds, clamped to at least 1800; `data-format` is JSON accepted by `Intl.NumberFormat`. In production, feed actual data with `SeenryMotion.number(element, liveValue, format)` rather than a sample ticker. The ticker stops offscreen, on hover, and on focus. Reduced motion shows the first value.

**Keyboard:** Static numbers require no keyboard action. A live value should not steal focus. Announce operational changes separately when they require action; avoid a constantly speaking live region.

**React:**

```jsx
function LiveValue({value}) {
  const ref = React.useRef(null);
  React.useEffect(() => window.SeenryMotion.number(ref.current, value), [value]);
  return <div className="s-value"><span className="s-value__label">Open reviews</span><strong ref={ref} className="s-value__number">{value}</strong></div>;
}
```

## Logo marquee

**Use for:** A small set of real client or partner wordmarks. In this kit the gallery uses text wordmarks; replace them with licensed SVG marks and meaningful alt text for production. The cloned loop is `aria-hidden`.

```html
<div class="s-marquee" aria-label="Selected partners">
  <div class="s-marquee__track"><div class="s-marquee__group">
    <span>Northstar</span><span>Fieldwork</span><span>Monograph</span>
  </div></div>
</div>
```

**Options:** `--s-marquee-duration` is calculated from the content width so the speed stays calm. Keep at least four marks so the loop feels continuous. Empty content should be removed rather than animating a blank rail. Reduced motion shows one static group.

**Keyboard:** Focus within pauses the rail. Marks that link to partners remain standard links with native Tab and Enter behavior.

**React:**

```jsx
function Partners({names}) {
  const ref = React.useRef(null);
  React.useEffect(() => window.SeenrySignature.init(ref.current), []);
  return <div ref={ref} className="s-marquee" aria-label="Selected partners"><div className="s-marquee__track"><div className="s-marquee__group">{names.map(name => <span key={name}>{name}</span>)}</div></div></div>;
}
```

## Compare slider

**Use for:** Two aligned versions of one artifact. Both sides should represent the same crop or UI bounds, so the handle reveals a meaningful difference.

```html
<div class="s-compare">
  <div class="s-compare__before"><div class="s-compare__sample">Previous design</div></div>
  <div class="s-compare__after"><div class="s-compare__sample">New design</div></div>
  <span class="s-compare__line" aria-hidden="true"></span>
  <span class="s-compare__handle" aria-hidden="true">↔</span>
  <input class="s-compare__range" type="range" min="0" max="100" value="50" aria-label="Compare previous and new design">
  <span class="s-compare__label s-compare__label--before">Before</span>
  <span class="s-compare__label s-compare__label--after">After</span>
</div>
```

**Options:** Initial split comes from the range input `value`; `--s-position` is updated on input. Replace sample content with two same-size images or product UI blocks. Add `alt` text to each real image. An absent image needs a visible error message inside its side.

**Keyboard:** Tab focuses the native range. Arrow keys change it by 1, Page Up or Down by 10, Home and End reach the ends. The 44px visible handle tracks the focus ring.

**React:**

```jsx
function Compare() {
  const ref = React.useRef(null);
  React.useEffect(() => window.SeenrySignature.init(ref.current), []);
  return <div ref={ref} className="s-compare"><div className="s-compare__before">Before</div><div className="s-compare__after">After</div><span className="s-compare__line" aria-hidden="true"/><span className="s-compare__handle" aria-hidden="true">↔</span><input className="s-compare__range" type="range" min="0" max="100" defaultValue="50" aria-label="Compare before and after"/></div>;
}
```

## Case-study card

**Use for:** A portfolio entry where a short authored preview shows actual work. Use two or three frames. On touch and reduced motion, the first frame is the complete cover.

```html
<a class="s-case" href="/work/northstar" aria-label="Read the Northstar case study">
  <div class="s-case__media">
    <div class="s-case__frame"><div class="s-case__art">Workspace cover</div></div>
    <div class="s-case__frame"><div class="s-case__art">Review detail</div></div>
  </div>
  <div class="s-case__meta"><div><h3>Northstar workspace</h3><p>Product design · Workflow</p></div><span class="s-case__arrow" aria-hidden="true">↗</span></div>
</a>
```

**Options:** Frames cycle every 1100ms on fine-pointer hover or keyboard focus. For a real video, put a muted, inline `video` in the media slot and use the same hover/focus/pause rules in application code. If media fails, keep the project title and a static cover or error message visible. Long titles wrap in metadata.

**Keyboard:** Tab focuses the whole card; Enter follows the native link. Focus starts the preview, blur resets to the cover. Touch shows the static cover.

**React:**

```jsx
function CaseCard({href,title,frames}) {
  const ref = React.useRef(null);
  React.useEffect(() => window.SeenrySignature.init(ref.current), []);
  return <a ref={ref} className="s-case" href={href}><div className="s-case__media">{frames.map((frame,i) => <div className="s-case__frame" key={i}>{frame}</div>)}</div><div className="s-case__meta"><h3>{title}</h3><span className="s-case__arrow" aria-hidden="true">↗</span></div></a>;
}
```

## Quality checks

`gallery.html` shows light and dark side by side at desktop width and offers a per-example theme switch at 390px. `node ~/.codex/skills/seenry/scripts/review_board.mjs gallery.html --out .seenry/review` reports zero blockers. The separate blind visual critic ended at 5/10 and stopped after its final round; the gallery remains a functional specimen page rather than a finished editorial showcase. See `NOTES.md` for reference research and `DESIGN.md` for design rules and verification details.
