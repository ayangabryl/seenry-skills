#!/usr/bin/env node
/** The Seenry canvas: a local design canvas. Every screen is a live HTML frame; folders are sections (flows).
 *  The person pans, zooms, approves screens, picks between options and pins comments; the agent reads them back.
 *
 *  node canvas.mjs init   [dir]            create the canvas folder with wire.css and a starter tokens.css
 *  node canvas.mjs open   [dir] [--port n] [--no-browser]   start the canvas, open it in the browser, print its address
 *  node canvas.mjs serve  [dir] [--port n] run it in the foreground
 *  node canvas.mjs wait   [dir] [--timeout seconds]   block until the person presses "Send to agent", then print it
 *  node canvas.mjs feedback [dir] [--wait seconds]   print what the person approved, picked and commented
 *  node canvas.mjs list   [dir]            print the sections and frames as the canvas sees them
 *  node canvas.mjs check  [dir]            list values typed into screens instead of taken from tokens.css
 *  node canvas.mjs status <section> <in-progress|review|ready> [dir]   label a section, as Figma teams do
 *  node canvas.mjs resolve <section> [--pick id] [dir]   keep the picked option, archive the rest with the reason
 *  node canvas.mjs archive <frame> --reason "…" [dir]    move a screen to the archive
 *  node canvas.mjs log "what changed and why" [dir]       add a line to the change log on the cover
 *  node canvas.mjs handoff [dir]           write HANDOFF.md: screens, flows, specs, tokens, open questions
 *  node canvas.mjs round "what changed" [dir]   after applying feedback: resolve picks, log it, set every section's status
 *  node canvas.mjs round "what changed" --unattended "why nobody can review" [dir]   record a run with no person: nothing is approved
 *  node canvas.mjs init [dir] --library <path>   link a shared design system (another canvas folder) instead of local tokens
 *  node canvas.mjs plan <file>… [--dir dir]   name the screens you are about to draw: each shows as a placeholder until its file exists
 *  node canvas.mjs say "what you are doing" [--frame id] [dir]   one line on the canvas's live activity feed, for the person watching
 *
 *  The agent's eyes (Playwright): screens are ids or section names; none means every screen. --dir picks the canvas.
 *  node canvas.mjs render  [screens] [--device phone|tablet|desktop|all] [--mode light|dark|both] [--scale 2]   PNGs to look at
 *  node canvas.mjs tree    [screens]     the layout: boxes, text, the variable behind each style, specs, links
 *  node canvas.mjs verify  [screens]     overflow, clipped text, contrast in both modes, small text and targets, names,
 *                                        broken links, detached values, components drawn differently across screens; for
 *                                        options, the teardown, a pair render beside a reference, and the execution bar
 *                                        (product view inventory, hue families, headline lines and size)
 *  node canvas.mjs verify --quick        the rule-based checks only, in seconds: use it while iterating, never before showing
 *  node canvas.mjs diff    [screens]     what visibly changed since the last render
 *  node canvas.mjs compare <screen> <url>   the built screen against its design: pixels, missing text, style differences
 *  --json on list, feedback, render, tree, verify, diff and compare prints machine-readable output.
 *  node canvas.mjs static [dir]            write canvas.html, which opens from disk with no server
 *  node canvas.mjs shot   [dir] [--playwright path]  write canvas.png, for sessions with no browser to show
 *  node canvas.mjs stop   [dir]
 *
 *  dir defaults to .seenry/canvas. Layout on disk:
 *    01-onboarding/01-welcome.phone.html   a folder is a section, a file is a frame, numbers set the order
 *    02-home.options/a.html, b.html        a folder ending .options holds alternatives: the person picks one
 *    refs/*.png                            reference screenshots, shown as their own section
 *    components.css                        the shared components every screen links; "@component" lines generate their sheet
 *  A file ending .phone.html, .tablet.html or .laptop.html renders at that device size; anything else is desktop.
 *  A frame's name is its <title>; <meta name="seenry-note" content="..."> is the line shown under it.
 *  <meta name="seenry-fidelity" content="sketch"> marks a one-screen sketch: the first screen only, extended after the pick.
 *  A link from one screen to another (<a href="02-next.phone.html">) is a prototype connection: the canvas draws it
 *  and Present mode follows it, like a Figma prototype.
 *  Plain Node, no packages, bound to 127.0.0.1. */
import {createServer} from 'node:http';
import {existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, openSync, readSync, closeSync, renameSync} from 'node:fs';
import {resolve, join, extname, basename, dirname, sep, relative} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'open';
const flag = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };
const SWITCHES = new Set(['--no-browser', '--browser', '--json', '--no-judge', '--quick']);
// Arguments after the command that are not a --flag or a flag's value.
const positional = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--') && !SWITCHES.has(all[i - 1])));
const ARGS = {status: 2, resolve: 1, archive: 1, log: 1, round: 1, say: 1}[command] || 0;
// Commands that take screens as arguments find the canvas with --dir; the others also take it as the next argument.
const FRAME_COMMANDS = new Set(['render', 'tree', 'verify', 'diff', 'compare', 'pair', 'plan']);
const dir = resolve(flag('dir') || (FRAME_COMMANDS.has(command) ? '' : positional[ARGS]) || '.seenry/canvas');
const pidFile = join(dir, '.canvas.json');
const waitFile = join(dir, '.waiting.json');
const IMAGES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);
const DEVICES = {desktop: [1440, 900], laptop: [1280, 800], tablet: [834, 1112], phone: [390, 844]};
const TYPES = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8'};

// A work folder inside .seenry ignores itself, so `git add .` never commits it.
function markWorkDir(path) {
  const parts = path.split(sep), i = parts.lastIndexOf('.seenry');
  if (i < 0) return;
  const root = parts.slice(0, i + 1).join(sep) || sep;
  mkdirSync(root, {recursive: true});
  if (!existsSync(join(root, '.gitignore'))) writeFileSync(join(root, '.gitignore'), '*\n');
}

// The wireframe kit and the starter tokens live in this file, so the script works on its own when downloaded.
const KIT = {'wire.css': String.raw`/* Seenry wireframe kit. Structure and real copy only: no brand color, no chosen typeface, no images.
   Link it from a wireframe with <link rel="stylesheet" href="wire.css"> and use plain HTML plus these few classes. */
:root { --wf-ink: #1c1c1c; --wf-ink-2: #6b6b6b; --wf-line: #cfcfcf; --wf-fill: #ececec; --wf-bg: #fafafa; --wf-gutter: clamp(20px, 5vw, 72px); }
* { box-sizing: border-box; }
html { font: 16px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--wf-ink); background: var(--wf-bg); -webkit-font-smoothing: antialiased; }
body { margin: 0; }
h1, h2, h3, p, ul, ol, figure { margin: 0; }
h1 { font-size: clamp(2rem, 5vw, 3.75rem); line-height: 1.05; letter-spacing: -.02em; font-weight: 600; text-wrap: balance; }
h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); line-height: 1.15; letter-spacing: -.015em; font-weight: 600; text-wrap: balance; }
h3 { font-size: 1.125rem; line-height: 1.3; font-weight: 600; }
p { max-width: 65ch; text-wrap: pretty; }
a { color: inherit; }
ul, ol { padding: 0; list-style: none; }

/* Page regions */
.wf-wrap { max-width: 1200px; margin-inline: auto; padding-inline: var(--wf-gutter); }
.wf-section { padding-block: clamp(48px, 8vw, 112px); }
.wf-section + .wf-section { border-top: 1px dashed var(--wf-line); }
.wf-nav { display: flex; gap: 24px; align-items: center; justify-content: space-between; padding-block: 16px; }
.wf-nav ul { display: flex; gap: 24px; }

/* Layout */
.wf-stack { display: grid; gap: var(--gap, 16px); align-content: start; }
.wf-row { display: flex; flex-wrap: wrap; gap: var(--gap, 16px); align-items: center; }
.wf-cols { display: grid; gap: var(--gap, 32px); grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr)); align-items: start; }
.wf-split { display: grid; gap: var(--gap, 48px); grid-template-columns: minmax(0, var(--a, 1fr)) minmax(0, var(--b, 1fr)); align-items: center; }
.wf-center { text-align: center; justify-items: center; }
.wf-bleed { width: 100%; }
@media (max-width: 720px) { .wf-cols, .wf-split { grid-template-columns: minmax(0, 1fr); } .wf-nav ul { display: none; } }

/* Blocks. Write what the block is inside it: "Photo: the oven at 4 am", "Product: week view". */
.wf-img, .wf-ui { display: grid; place-items: center; max-width: 100%; aspect-ratio: var(--ratio, 16 / 10); padding: 16px; text-align: center; font-size: 1rem; color: var(--wf-ink-2); border-radius: 8px; }
.wf-img { background: repeating-linear-gradient(135deg, var(--wf-fill) 0 10px, #e2e2e2 10px 20px); }
.wf-ui { background: #fff; border: 1.5px solid var(--wf-line); }
.wf-box { padding: 20px; border: 1.5px solid var(--wf-line); border-radius: 8px; background: #fff; }
.wf-fill { background: var(--wf-fill); }
.wf-dark { background: var(--wf-ink); color: #fff; --wf-ink-2: #b5b5b5; --wf-line: #555; }
.wf-btn { display: inline-flex; align-items: center; width: fit-content; min-height: 44px; padding: 0 18px; border-radius: 8px; background: var(--wf-ink); color: #fff; font-weight: 500; text-decoration: none; }
.wf-btn.quiet { background: none; color: inherit; box-shadow: inset 0 0 0 1.5px currentColor; }
.wf-dark .wf-btn { background: #fff; color: var(--wf-ink); }
.wf-muted { color: var(--wf-ink-2); }
.wf-small { font-size: .875rem; }
.wf-big { font-size: clamp(3rem, 10vw, 8rem); line-height: .95; letter-spacing: -.03em; font-weight: 600; }
.wf-rule > * + * { border-top: 1px solid var(--wf-line); padding-top: 16px; margin-top: 16px; }

/* A note to the reviewer, never part of the design. */
.wf-note { font-size: .75rem; color: #8a4b00; background: #fff3d6; border-radius: 6px; padding: 4px 8px; width: fit-content; }
`, 'tokens.css': String.raw`/* Seenry tokens: the design system every screen links, organized like a design team's Figma variables.
   Change values, keep the names and tiers. This file moves into the product unchanged.

   1. Fonts         @font-face for the real files in fonts/ (self-hosted WOFF2), or a Google Fonts <link> in each screen
   2. Primitives    raw values with no meaning: the gray and accent ramps, the size and space scales
   3. Semantic      what components use, by role, with a light and a dark mode
   4. Text styles   one class per role: family, size, line height, weight and tracking together
   5. Effects       elevation shadows, focus ring
   6. Layout grids  columns, gutter and margin per breakpoint
   7. Motion        easing and durations
   Components use only tiers 3 to 7. A primitive used directly in a screen is a detached value. */

/* 1. Fonts. Example: @font-face { font-family: "Inter"; src: url("fonts/Inter-Variable.woff2") format("woff2"); font-weight: 100 900; font-display: swap; } */

:root {
  /* 2. Primitives */
  --font-family-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-family-mono: ui-monospace, "SF Mono", Menlo, monospace;

  --gray-0: oklch(1 0 0);
  --gray-50: oklch(0.985 0.002 90);
  --gray-100: oklch(0.965 0.003 90);
  --gray-200: oklch(0.92 0.003 90);
  --gray-300: oklch(0.86 0.004 90);
  --gray-500: oklch(0.52 0.005 90);
  --gray-600: oklch(0.45 0.005 90);
  --gray-800: oklch(0.28 0.005 90);
  --gray-900: oklch(0.22 0.005 90);
  --gray-950: oklch(0.16 0.004 90);
  --accent-500: oklch(0.55 0.16 255);
  --accent-600: oklch(0.48 0.16 255);
  --accent-400: oklch(0.66 0.14 255);
  --green-600: oklch(0.55 0.13 150);
  --amber-500: oklch(0.72 0.14 70);
  --red-600: oklch(0.55 0.19 27);

  --size-12: 0.75rem; --size-13: 0.8125rem; --size-14: 0.875rem; --size-16: 1rem; --size-18: 1.125rem;
  --size-20: 1.25rem; --size-24: 1.5rem; --size-32: 2rem; --size-40: 2.5rem; --size-56: 3.5rem; --size-72: 4.5rem;

  /* 3. Semantic: spacing, radius, type */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-12: 48px; --space-16: 64px; --space-24: 96px;
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-full: 999px;
  --font-body: var(--font-family-sans); --font-display: var(--font-family-sans); --font-code: var(--font-family-mono);
  --weight-regular: 400; --weight-medium: 500; --weight-strong: 600;

  /* 3. Semantic: color, light mode */
  --color-bg: var(--gray-50);
  --color-bg-surface: var(--gray-0);
  --color-bg-sunken: var(--gray-100);
  --color-text: var(--gray-900);
  --color-text-secondary: var(--gray-600);
  --color-text-tertiary: var(--gray-500);
  --color-border: var(--gray-200);
  --color-border-strong: var(--gray-300);
  --color-accent: var(--accent-600);
  --color-accent-hover: var(--accent-500);
  --color-on-accent: var(--gray-0);
  --color-focus: var(--accent-500);
  --color-positive: var(--green-600);
  --color-warning: var(--amber-500);
  --color-negative: var(--red-600);

  /* 5. Effects */
  --shadow-raised: 0 1px 2px oklch(0 0 0 / 0.06), 0 1px 1px oklch(0 0 0 / 0.04);
  --shadow-overlay: 0 12px 32px oklch(0 0 0 / 0.12), 0 2px 6px oklch(0 0 0 / 0.08);
  --ring-focus: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-focus);

  /* 6. Layout grids: mobile first */
  --grid-columns: 4; --grid-gutter: 16px; --grid-margin: 16px; --grid-max: 100%;

  /* 7. Motion */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --duration-press: 120ms; --duration-short: 180ms; --duration-medium: 240ms;
}
@media (min-width: 768px) { :root { --grid-columns: 8; --grid-gutter: 24px; --grid-margin: 32px; } }
@media (min-width: 1200px) { :root { --grid-columns: 12; --grid-gutter: 24px; --grid-margin: 48px; --grid-max: 1280px; } }

/* 3. Semantic: color, dark mode. Its own palette, never the light one inverted. */
:root[data-theme="dark"] {
  --color-bg: var(--gray-950);
  --color-bg-surface: oklch(0.2 0.004 90);
  --color-bg-sunken: oklch(0.13 0.004 90);
  --color-text: oklch(0.96 0.003 90);
  --color-text-secondary: oklch(0.74 0.004 90);
  --color-text-tertiary: oklch(0.6 0.004 90);
  --color-border: oklch(1 0 0 / 0.1);
  --color-border-strong: oklch(1 0 0 / 0.18);
  --color-accent: var(--accent-400);
  --color-accent-hover: oklch(0.74 0.12 255);
  --color-on-accent: var(--gray-950);
  --shadow-raised: 0 0 0 1px oklch(1 0 0 / 0.06);
  --shadow-overlay: 0 0 0 1px oklch(1 0 0 / 0.08), 0 16px 40px oklch(0 0 0 / 0.5);
}

/* 4. Text styles */
.text-display { font-family: var(--font-display); font-size: var(--size-56); line-height: 1.05; font-weight: var(--weight-strong); letter-spacing: -0.025em; }
.text-title { font-family: var(--font-display); font-size: var(--size-32); line-height: 1.15; font-weight: var(--weight-strong); letter-spacing: -0.015em; }
.text-heading { font-family: var(--font-body); font-size: var(--size-20); line-height: 1.3; font-weight: var(--weight-strong); letter-spacing: -0.01em; }
.text-body { font-family: var(--font-body); font-size: var(--size-16); line-height: 1.55; font-weight: var(--weight-regular); }
.text-ui { font-family: var(--font-body); font-size: var(--size-14); line-height: 1.45; font-weight: var(--weight-medium); }
.text-caption { font-family: var(--font-body); font-size: var(--size-13); line-height: 1.4; font-weight: var(--weight-regular); }
.text-code { font-family: var(--font-code); font-size: var(--size-13); line-height: 1.5; font-weight: var(--weight-regular); }
`};
const FOUNDATIONS = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Foundations</title>
<meta name="seenry-note" content="Variables, text styles, fonts, effects and grids, read live from tokens.css">
<link rel="stylesheet" href="tokens.css">
<style>
  body { margin: 0; background: var(--color-bg, #fafafa); color: var(--color-text, #1c1c1c); font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
  main { padding: 48px 56px 80px; display: grid; gap: 56px; }
  header { display: flex; gap: 16px; align-items: end; justify-content: space-between; flex-wrap: wrap; }
  h1 { margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -0.015em; }
  h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
  h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--color-text-secondary, #666); }
  p { margin: 0; }
  .muted { color: var(--color-text-secondary, #666); }
  .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 12px; }
  .modes { display: inline-flex; padding: 2px; border-radius: 9px; background: color-mix(in oklab, currentColor 10%, transparent); }
  .modes button { border: 0; background: none; color: inherit; font: inherit; font-weight: 500; padding: 6px 12px; border-radius: 7px; cursor: pointer; }
  .modes button[aria-pressed="true"] { background: var(--color-bg-surface, #fff); box-shadow: 0 1px 2px rgb(0 0 0 / .15); }
  .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .swatch { display: grid; grid-template-columns: 40px 1fr; gap: 10px; align-items: center; }
  .chip { width: 40px; height: 40px; border-radius: 8px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / .25); }
  .row { display: grid; grid-template-columns: 200px 1fr; gap: 24px; align-items: baseline; padding: 14px 0; border-top: 1px solid var(--color-border, #e5e5e5); }
  .scale { display: grid; gap: 8px; }
  .bar { height: 12px; background: var(--color-accent, #3060d0); border-radius: 3px; }
  .radii, .shadows { display: flex; flex-wrap: wrap; gap: 24px; }
  .radius { width: 88px; height: 88px; background: var(--color-bg-sunken, #eee); box-shadow: inset 0 0 0 1px var(--color-border-strong, #ccc); }
  .shadow { width: 160px; height: 96px; border-radius: 12px; background: var(--color-bg-surface, #fff); }
  .item { display: grid; gap: 6px; }
  .grid-demo { position: relative; height: 120px; border-radius: 8px; background: var(--color-bg-sunken, #eee); overflow: hidden; }
  .grid-demo > div { position: absolute; inset: 0; display: grid; }
  .grid-demo span { background: color-mix(in oklab, var(--color-negative, #d33) 18%, transparent); }
  .bad { color: var(--color-negative, #c22); font-weight: 600; }
  .empty { color: var(--color-text-tertiary, #888); }
</style>
</head>
<body>
<main>
  <header>
    <div><h1>Foundations</h1><p class="muted">Read live from tokens.css. Change a value there and every screen and this page update.</p></div>
    <div class="modes" role="group" aria-label="Mode"><button type="button" data-mode="light" aria-pressed="true">Light</button><button type="button" data-mode="dark" aria-pressed="false">Dark</button></div>
  </header>
  <section><h2>Color · semantic</h2><p class="muted" style="margin:-8px 0 16px">What components use. Value shown for the current mode.</p><div class="swatches" id="semantic"></div></section>
  <section><h2>Color · primitives</h2><p class="muted" style="margin:-8px 0 16px">Raw ramps. Never used directly in a screen.</p><div class="swatches" id="primitives"></div></section>
  <section><h2>Text styles</h2><div id="type"></div></section>
  <section><h2>Fonts</h2><div id="fonts"></div></section>
  <section><h2>Spacing</h2><div class="scale" id="space"></div></section>
  <section><h2>Radius</h2><div class="radii" id="radius"></div></section>
  <section><h2>Effects</h2><div class="shadows" id="effects"></div></section>
  <section><h2>Layout grids</h2><div id="grids"></div></section>
  <section><h2>Motion</h2><div id="motion"></div></section>
</main>
<script>
const $ = id => document.getElementById(id);
const el = (tag, props, ...kids) => { const n = Object.assign(document.createElement(tag), props || {}); n.append(...kids.filter(k => k != null && k !== '')); return n; };
function walk(rules, out) {
  for (const rule of rules) {
    if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules, out); continue; }
    if (!rule.style) continue;
    for (const name of rule.style) if (name.startsWith('--')) out.vars.add(name);
    if (rule.selectorText) for (const s of rule.selectorText.split(',')) { const m = s.trim().match(/^\.(text-[\w-]+)$/); if (m) out.text.add(m[1]); }
  }
}
function collect() {
  const out = {vars: new Set(), text: new Set()};
  for (const sheet of document.styleSheets) { if (!sheet.href || !/tokens\.css/.test(sheet.href)) continue; try { walk(sheet.cssRules, out); } catch (e) {} }
  return {vars: [...out.vars], text: [...out.text]};
}
const value = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const isColor = v => v && CSS.supports('color', v) && !/^\d/.test(v);
const sw = name => el('div', {className: 'swatch'}, el('div', {className: 'chip', style: 'background:var(' + name + ')'}), el('div', {}, el('div', {className: 'mono', textContent: name}), el('div', {className: 'mono muted', textContent: value(name)})));
function render() {
  const {vars, text} = collect();
  const by = re => vars.filter(n => re.test(n));
  const colors = vars.filter(n => isColor(value(n)));
  const semantic = colors.filter(n => n.startsWith('--color-')), primitives = colors.filter(n => !n.startsWith('--color-'));
  $('semantic').replaceChildren(...(semantic.length ? semantic.map(sw) : [el('p', {className: 'empty', textContent: 'No --color-* roles defined.'})]));
  $('primitives').replaceChildren(...primitives.map(sw));
  $('type').replaceChildren(...(text.length ? text : []).map(cls => {
    const probe = el('p', {className: cls, textContent: 'Count weeks, not days. 0123456789'});
    const row = el('div', {className: 'row'}, el('div', {}, el('div', {className: 'mono', textContent: '.' + cls}), el('div', {className: 'mono muted'})), probe);
    requestAnimationFrame(() => { const c = getComputedStyle(probe); row.querySelector('.muted').textContent = c.fontSize + ' / ' + c.lineHeight + ' · ' + c.fontWeight + ' · ' + c.letterSpacing + ' · ' + c.fontFamily.split(',')[0]; });
    return row;
  }));
  if (!text.length) $('type').append(el('p', {className: 'empty', textContent: 'No .text-* styles defined.'}));
  const families = by(/^--font-/).filter(n => !/weight|size/.test(n));
  $('fonts').replaceChildren(...families.map(n => {
    const first = value(n).split(',')[0].trim().replace(/^["']|["']$/g, '');
    const generic = /^(ui-|system-ui|-apple-system|sans-serif|serif|monospace)/.test(first);
    const loaded = generic || document.fonts.check('16px "' + first + '"');
    return el('div', {className: 'row'}, el('div', {}, el('div', {className: 'mono', textContent: n}), el('div', {className: loaded ? 'mono muted' : 'mono bad', textContent: generic ? 'system font' : loaded ? first + ' · loaded' : first + ' · not loaded'})),
      el('p', {style: 'font-family:var(' + n + ');font-size:28px', textContent: 'Aa Bb Cc 0123456789'}));
  }));
  const px = n => { const p = el('div', {style: 'width:var(' + n + ')'}); document.body.append(p); const w = p.getBoundingClientRect().width; p.remove(); return w; };
  $('space').replaceChildren(...by(/^--space-/).map(n => el('div', {className: 'row', style: 'padding:6px 0'}, el('div', {className: 'mono', textContent: n + '  ' + value(n)}), el('div', {className: 'bar', style: 'width:var(' + n + ')'}))));
  $('radius').replaceChildren(...by(/^--radius-/).map(n => el('div', {className: 'item'}, el('div', {className: 'radius', style: 'border-radius:min(var(' + n + '),44px)'}), el('div', {className: 'mono', textContent: n}), el('div', {className: 'mono muted', textContent: value(n)}))));
  $('effects').replaceChildren(...by(/^--(shadow|ring|elevation)-/).map(n => el('div', {className: 'item'}, el('div', {className: 'shadow', style: 'box-shadow:var(' + n + ')'}), el('div', {className: 'mono', textContent: n}))));
  const cols = Number(value('--grid-columns')) || 0;
  $('grids').replaceChildren(cols ? el('div', {}, el('p', {className: 'mono muted', style: 'margin-bottom:8px', textContent: 'At this width (' + innerWidth + 'px): ' + cols + ' columns · gutter ' + value('--grid-gutter') + ' · margin ' + value('--grid-margin') + ' · max ' + (value('--grid-max') || 'none')}),
    el('div', {className: 'grid-demo'}, el('div', {style: 'grid-template-columns:repeat(' + cols + ',1fr);gap:var(--grid-gutter);padding:0 var(--grid-margin)'}, ...Array.from({length: cols}, () => el('span'))))) : el('p', {className: 'empty', textContent: 'No --grid-columns defined.'}));
  $('motion').replaceChildren(...by(/^--(ease|duration)-/).map(n => el('div', {className: 'row', style: 'padding:6px 0'}, el('div', {className: 'mono', textContent: n}), el('div', {className: 'mono muted', textContent: value(n)}))));
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.mode === 'dark') document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
  document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b)); render();
}));
new MutationObserver(render).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
document.fonts.ready.then(render); render();
</script>
</body>
</html>
`;

function init() {
  mkdirSync(join(dir, 'refs'), {recursive: true});
  markWorkDir(dir);
  const lib = flag('library');
  if (lib) {
    const target = resolve(lib);
    if (!existsSync(join(target, 'tokens.css'))) { console.error(`No tokens.css in ${target}. Make the library with "canvas.mjs init <folder>" first.`); process.exit(2); }
    const manifest = readManifest(); manifest.library = relative(dir, target) || '.'; writeManifest(manifest);
  }
  for (const [name, text] of Object.entries(KIT)) if (!existsSync(join(dir, name)) && !(lib && name === 'tokens.css')) writeFileSync(join(dir, name), text);
  const manifest = readManifest();
  if (!manifest.error && !manifest.started) { manifest.started = new Date().toISOString(); writeManifest(manifest); }
  writeFoundations();
}

/** The live activity feed: what the agent is doing, one JSON line each, shown on the canvas as it happens. Never fails a command. */
const activityFile = () => join(dir, '.activity.jsonl');
function activity(kind, text, frame = '') {
  try {
    if (!existsSync(dir)) return;
    const line = JSON.stringify({at: new Date().toISOString(), kind, text: String(text).slice(0, 300), frame: String(frame || '')}) + '\n';
    writeFileSync(activityFile(), line, {flag: 'a'});
    if (statSync(activityFile()).size > 200000) writeFileSync(activityFile(), readActivity(400).map(e => JSON.stringify(e)).join('\n') + '\n');
  } catch {}
}
function readActivity(n = 40) {
  try { return readFileSync(activityFile(), 'utf8').trim().split('\n').slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; }
}

/** The app the agent runs in, when it has a pane that can show a local page beside the chat. */
function hostApp() {
  const e = process.env, bundle = e.__CFBundleIdentifier || '';
  if (e.T3CODE_THREAD_ID || e.CLAUDE_CODE_ENTRYPOINT === 't3-code' || /t3code/i.test(bundle)) return 'T3 Code';
  if (/^claude-desktop/.test(e.CLAUDE_CODE_ENTRYPOINT || '') || /com\.anthropic\.claude/i.test(bundle)) return 'the Claude app';
  if (/com\.openai\.codex/i.test(bundle)) return 'the Codex app';
  return '';
}

/** Shared components: components.css names each one in a comment, "@component Name | <markup> | <markup>". */
function readComponents(root = dir) {
  let css = '';
  try { css = readFileSync(join(root, 'components.css'), 'utf8'); } catch { return []; }
  const out = [];
  for (const m of css.matchAll(/\/\*\s*@component\s+([^|*]+?)\s*\|([\s\S]*?)\*\//g)) {
    const examples = m[2].split(/\s\|\s/).map(x => x.trim()).filter(Boolean);
    const classes = [...new Set(examples.flatMap(x => [...x.matchAll(/\bclass\s*=\s*["']([^"']+)["']/g)].flatMap(c => c[1].trim().split(/\s+/))))];
    out.push({name: m[1].trim(), examples, classes});
  }
  return out;
}

/** The class names components.css defines, so a screen that redefines one can be caught. */
function componentClasses(root = dir) {
  let css = '';
  try { css = readFileSync(join(root, 'components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); } catch { return new Set(); }
  const out = new Set();
  for (const m of css.matchAll(/(^|[},])\s*([^{}@]+)\{/g)) for (const c of m[2].matchAll(/\.([a-zA-Z_][\w-]*)/g)) out.add(c[1]);
  return out;
}

/** The Components sheet is generated from components.css, like Foundations from tokens.css: never edited by hand. */
function writeComponents() {
  if (!existsSync(dir)) return;
  const path = join(dir, '_components.html');
  if (!existsSync(join(dir, 'components.css'))) return;
  const list = readComponents(), esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const tokens = libraryDir(readManifest()) && !existsSync(join(dir, 'tokens.css')) ? 'library/tokens.css' : 'tokens.css';
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Components</title>
<link rel="stylesheet" href="${tokens}">${existsSync(join(dir, 'fonts.css')) ? '\n<link rel="stylesheet" href="fonts.css">' : ''}
<link rel="stylesheet" href="components.css">
<style>
.seenry-sheet { margin: 0; padding: 64px 72px; background: var(--color-bg, #fff); color: var(--color-text, #111); }
.seenry-sheet-head { font: 600 40px/1.1 ui-sans-serif, system-ui, sans-serif; margin: 0 0 8px; letter-spacing: -0.02em; }
.seenry-sheet-lede, .seenry-sheet-meta { font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; color: var(--color-text-secondary, #666); margin: 0; }
.seenry-sheet-row { display: grid; grid-template-columns: 240px 1fr; gap: 32px; align-items: start; padding: 28px 0; border-top: 1px solid var(--color-border, rgb(0 0 0 / .12)); }
.seenry-sheet-row:first-of-type { margin-top: 40px; }
.seenry-sheet-name { font: 600 16px/1.3 ui-sans-serif, system-ui, sans-serif; margin: 0 0 4px; }
.seenry-sheet-meta { font: 12px/1.5 ui-monospace, "SF Mono", Menlo, monospace; overflow-wrap: anywhere; }
.seenry-sheet-examples { display: flex; flex-wrap: wrap; gap: 20px 24px; align-items: center; }
</style>
</head>
<body class="seenry-sheet">
<h1 class="seenry-sheet-head">Components</h1>
<p class="seenry-sheet-lede">${list.length ? `${list.length} shared component${list.length === 1 ? '' : 's'}, drawn live from components.css. Change the file, never a copy in a screen.` : 'components.css has no "@component" lines yet. Add one comment line above each component: /* @component Button | &lt;button class="btn"&gt;Save&lt;/button&gt; */'}</p>
${list.map(c => `<section class="seenry-sheet-row"><div><h2 class="seenry-sheet-name">${esc(c.name)}</h2><p class="seenry-sheet-meta">${c.classes.map(x => '.' + esc(x)).join(' ')}</p></div><div class="seenry-sheet-examples">${c.examples.join('\n')}</div></section>`).join('\n')}
</body>
</html>
`;
  try { if (!existsSync(path) || readFileSync(path, 'utf8') !== html) writeFileSync(path, html); } catch {}
}

/** The Foundations page is generated: it reads tokens.css live, so it is rewritten on every start, never edited. */
function writeFoundations() {
  if (!existsSync(dir)) return;
  const library = libraryDir(readManifest());
  for (const root of [dir, library].filter(Boolean)) {
    if (!existsSync(join(root, 'tokens.css'))) continue;
    const path = join(root, '_foundations.html');
    try { if (!existsSync(path) || readFileSync(path, 'utf8') !== FOUNDATIONS) writeFileSync(path, FOUNDATIONS); } catch {}
  }
  writeComponents();
}

function waiting() {
  try { const info = JSON.parse(readFileSync(waitFile, 'utf8')); process.kill(info.pid, 0); return true; } catch { return false; }
}

const mtime = path => { try { return Math.round(statSync(path).mtimeMs); } catch { return 0; } };
const pretty = name => name.replace(/^\d+[-_. ]*/, '').replace(/[-_]+/g, ' ').replace(/^\w/, c => c.toUpperCase()) || name;
const inside = path => { const full = resolve(dir, path); return full === dir || full.startsWith(dir + sep) ? full : null; };
const unescape = text => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const STATUSES = {'in-progress': 'In progress', review: 'Ready for review', ready: 'Ready for dev'};

/** The shared design system this canvas links to, if canvas.json names one: another canvas folder. */
function libraryDir(manifest) {
  if (!manifest.library) return null;
  const lib = resolve(dir, String(manifest.library));
  return existsSync(join(lib, 'tokens.css')) ? lib : null;
}

function libraryName(library) {
  try { const title = JSON.parse(readFileSync(join(library, 'canvas.json'), 'utf8')).title; if (title) return String(title); } catch {}
  return basename(resolve(library, '..', '..'));
}

function readManifest() {
  const path = join(dir, 'canvas.json');
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch (error) { return {error: `canvas.json is not valid JSON: ${error.message}`}; }
}
function writeManifest(manifest) { const {error, ...clean} = manifest; writeFileSync(join(dir, 'canvas.json'), JSON.stringify(clean, null, 2) + '\n'); }

function head(path) {
  let text = '';
  try { const fd = openSync(path, 'r'), buffer = Buffer.alloc(4096); text = buffer.toString('utf8', 0, readSync(fd, buffer, 0, 4096, 0)); closeSync(fd); } catch {}
  const title = text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const meta = {};
  for (const m of text.matchAll(/<meta\b[^>]*>/gi)) {
    const name = m[0].match(/name\s*=\s*["']seenry-([\w-]+)["']/i)?.[1], content = m[0].match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (name && content) meta[name.toLowerCase()] = unescape(content[1] ?? content[2] ?? '');
  }
  return {title: title ? unescape(title) : '', note: meta.note || '', meta};
}

/** Screens this screen links to, as frame ids: its prototype connections. */
function linksOf(folder, file, root = dir) {
  let text = '';
  try { text = readFileSync(join(root, folder, file), 'utf8').slice(0, 400000); } catch { return []; }
  if (root !== dir) return [];
  const out = new Set();
  for (const m of text.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#?]+\.html)(?:[#?][^"']*)?["']/gi)) {
    if (/^[a-z]+:/i.test(m[1]) || m[1].startsWith('/')) continue;
    const target = resolve(dir, folder, m[1]);
    if (!target.startsWith(dir + sep)) continue;
    const rel = target.slice(dir.length + 1).split(sep);
    if (rel.length > 2) continue;
    const [f, name] = rel.length === 2 ? rel : ['', rel[0]];
    out.add(idFor(f, name));
  }
  return [...out];
}

function idFor(folder, file) {
  const stem = file.replace(/\.html$/i, '');
  const device = Object.keys(DEVICES).find(d => stem.toLowerCase().endsWith('.' + d));
  const clean = device ? stem.slice(0, stem.lastIndexOf('.')) : stem;
  return (folder ? folder.replace(/\.options$/i, '') + '/' : '') + clean;
}

function frameFrom(folder, file, root = dir, prefix = '') {
  const rel = folder ? `${folder}/${file}` : file;
  const stem = file.replace(/\.html$/i, '');
  const device = Object.keys(DEVICES).find(d => stem.toLowerCase().endsWith('.' + d)) || 'desktop';
  const clean = device === 'desktop' && !stem.toLowerCase().endsWith('.desktop') ? stem : stem.slice(0, stem.lastIndexOf('.'));
  const {title, note, meta} = head(join(root, rel));
  const [w, h] = DEVICES[device];
  return {id: prefix + idFor(folder, file), kind: 'page', src: prefix + rel, name: title || pretty(clean), note, device, w, h, rev: mtime(join(root, rel)), links: linksOf(folder, file, root), specs: specsIn(join(root, rel)).length,
    axis: meta.axis || '', wins: meta.wins || '', cost: meta.cost || '', risk: /^(safe|bold)$/i.test(meta.risk || '') ? meta.risk.toLowerCase() : '', ask: (meta.ask || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 4), sketch: /^sketch$/i.test(meta.fidelity || '')};
}

/** Handoff annotations: elements a screen marks with data-spec="…". */
function specsIn(path) {
  let html = '';
  try { html = readFileSync(path, 'utf8'); } catch { return []; }
  const out = [];
  for (const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*?)\bdata-spec\s*=\s*(?:"([^"]*)"|'([^']*)')([^>]*)>([^<]{0,80})/gi)) {
    const attrs = m[2] + m[5], id = attrs.match(/\bid\s*=\s*["']([^"']+)/i)?.[1], cls = attrs.match(/\bclass\s*=\s*["']([^"']+)/i)?.[1];
    out.push({element: m[1].toLowerCase() + (id ? '#' + id : cls ? '.' + cls.trim().split(/\s+/)[0] : ''), text: unescape(m[6].trim()).slice(0, 60), spec: unescape(m[3] ?? m[4] ?? '')});
  }
  return out;
}

/** Approvals that last across rounds: an approval stays until its screen changes. */
function readReview() { try { return JSON.parse(readFileSync(join(dir, 'review.json'), 'utf8')); } catch { return {frames: {}}; } }

/** The canvas content, read from the folder every time: sections, frames, and the last feedback. */
function readState({pending = false} = {}) {
  writeComponents();
  const manifest = readManifest(), manifestPath = join(dir, 'canvas.json'), library = libraryDir(manifest);
  const entries = existsSync(dir) ? readdirSync(dir, {withFileTypes: true}).filter(e => !e.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: true})) : [];
  const htmlIn = folder => readdirSync(join(dir, folder)).filter(f => /\.html$/i.test(f)).sort((a, b) => a.localeCompare(b, 'en', {numeric: true}));
  const sections = [{id: 'cover', name: 'Cover', system: true, cover: true, frames: [{id: 'cover', kind: 'cover', src: '', name: 'Cover', note: 'What this file is, its sections and their status', device: 'desktop', w: 1440, h: 900, rev: 0, links: []}]}];
  if (library) {
    const libEntries = readdirSync(library, {withFileTypes: true}).filter(e => !e.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: true}));
    if (existsSync(join(library, '_foundations.html'))) sections.push({id: 'library/foundations', name: 'Library · Foundations', system: true, library: true, frames: [{id: 'library/foundations', kind: 'page', src: 'library/_foundations.html', name: 'Foundations', note: 'The shared design system, read live from the library tokens.css', device: 'desktop', w: 1440, h: 900, rev: mtime(join(library, 'tokens.css')), links: []}]});
    for (const e of libEntries) {
      if (!e.isDirectory() || !/components/i.test(e.name)) continue;
      const frames = readdirSync(join(library, e.name)).filter(f => /\.html$/i.test(f)).sort((a, b) => a.localeCompare(b, 'en', {numeric: true})).map(f => frameFrom(e.name, f, library, 'library/'));
      if (frames.length) sections.push({id: 'library/' + e.name, name: 'Library · ' + pretty(e.name), system: true, library: true, frames});
    }
  }
  const loose = entries.filter(e => e.isFile() && /\.html$/i.test(e.name) && e.name !== 'canvas.html' && !e.name.startsWith('_')).map(e => frameFrom('', e.name));
  if (existsSync(join(dir, '_foundations.html')) && existsSync(join(dir, 'tokens.css'))) {
    sections.push({id: 'foundations', name: 'Foundations', choose: false, system: true, frames: [{id: 'foundations', kind: 'page', src: '_foundations.html', name: 'Foundations', note: 'Variables, text styles, fonts, effects and grids, read live from tokens.css', device: 'desktop', w: 1440, h: 900, rev: mtime(join(dir, 'tokens.css')), links: []}]});
  }
  if (existsSync(join(dir, '_components.html')) && existsSync(join(dir, 'components.css'))) {
    sections.push({id: 'components', name: 'Components', choose: false, system: true, frames: [{id: 'components', kind: 'page', src: '_components.html', name: 'Components', note: 'Every shared component, drawn live from components.css', device: 'desktop', w: 1440, h: 900, rev: mtime(join(dir, 'components.css')), links: []}]});
  }
  if (loose.length) sections.push({id: 'screens', name: 'Screens', choose: false, frames: loose});
  for (const entry of entries) {
    if (!entry.isDirectory() || ['refs', 'assets', 'fonts', 'node_modules', 'archive', 'library'].includes(entry.name)) continue;
    const frames = htmlIn(entry.name).map(f => frameFrom(entry.name, f));
    if (!frames.length) continue;
    const choose = /\.options$/i.test(entry.name), id = entry.name.replace(/\.options$/i, '');
    // 00-identity holds type specimens and color studies: candidates set by hand, not screens on the token system.
    const study = id === '00-identity';
    sections.push({id, name: study ? 'Identity studies' : pretty(id), choose: choose || study, study, frames});
  }
  // Screens the agent has named but not written yet: the page shows each as a placeholder, so the person sees the work arrive.
  if (pending) for (const rel of (Array.isArray(manifest.planned) ? manifest.planned : []).map(String)) {
    const parts = rel.split('/');
    if (parts.length > 2 || !/\.html$/i.test(rel) || !inside(rel) || existsSync(join(dir, rel))) continue;
    const [folder, name] = parts.length === 2 ? parts : ['', parts[0]];
    const stem = name.replace(/\.html$/i, ''), device = Object.keys(DEVICES).find(d => stem.toLowerCase().endsWith('.' + d)) || 'desktop';
    const [w, h] = DEVICES[device], choose = /\.options$/i.test(folder), id = folder ? folder.replace(/\.options$/i, '') : 'screens';
    let section = sections.find(x => x.id === id);
    if (!section) sections.push(section = {id, name: folder ? pretty(id) : 'Screens', choose, frames: []});
    section.frames.push({id: idFor(folder, name), kind: 'pending', src: '', name: pretty(stem.replace(new RegExp('\\.' + device + '$', 'i'), '')), note: 'Being drawn', device, w, h, rev: 0, links: [], ask: []});
  }
  const refDir = join(dir, 'refs');
  if (existsSync(refDir)) {
    const refs = readdirSync(refDir).filter(f => IMAGES.has(extname(f).toLowerCase())).sort().map(f => ({id: 'refs/' + f, kind: 'image', src: 'refs/' + f, name: pretty(f.replace(/\.[^.]+$/, '')), note: '', device: 'image', w: 720, h: 450, rev: mtime(join(refDir, f))}));
    if (refs.length) sections.push({id: 'refs', name: 'References', choose: false, reference: true, frames: refs});
  }
  const archiveDir = join(dir, 'archive');
  if (existsSync(archiveDir)) {
    const frames = [];
    for (const e of readdirSync(archiveDir, {withFileTypes: true}).filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: true})))
      for (const f of readdirSync(join(archiveDir, e.name)).filter(f => /\.html$/i.test(f)).sort()) {
        const frame = frameFrom('archive/' + e.name, f);
        frame.id = 'archive/' + idFor(e.name, f); frame.links = [];
        frame.note = String(manifest.archive?.[frame.id]?.reason || frame.note || '');
        frames.push(frame);
      }
    if (frames.length) sections.push({id: 'archive', name: 'Archive', system: true, archived: true, frames});
  }
  for (const section of sections) {
    const extra = manifest.sections?.[section.id] || {};
    if (extra.name) section.name = String(extra.name);
    section.note = String(extra.note || (section.choose ? 'Options: pick one' : section.archived ? 'Options that lost, with the reason' : ''));
    section.status = STATUSES[extra.status] ? extra.status : '';
  }
  // A screen drawn for several devices shares one name; its non-desktop files get the device in their id.
  for (const s of sections) {
    const count = {}; for (const f of s.frames) count[f.id] = (count[f.id] || 0) + 1;
    for (const f of s.frames) if (count[f.id] > 1 && f.device !== 'desktop') f.id += '.' + f.device;
  }
  const ids = new Set(sections.flatMap(s => s.frames.map(f => f.id)));
  for (const f of sections.flatMap(s => s.frames)) f.links = (f.links || []).filter(id => ids.has(id) && id !== f.id);
  const design = sections.filter(s => !s.system && !s.reference && s.frames.some(f => f.kind !== 'pending'));
  const flows = (Array.isArray(manifest.flows) && manifest.flows.length ? manifest.flows : design.map(s => ({name: s.name, start: s.frames.find(f => f.kind !== 'pending').id})))
    .filter(f => f && ids.has(f.start)).map(f => ({name: String(f.name || f.start), start: String(f.start)}));
  const review = readReview(), approvals = {};
  for (const f of design.flatMap(s => s.frames)) { const r = review.frames?.[f.id]; if (r && r.at >= f.rev) approvals[f.id] = r.status; }
  let feedback = null;
  const feedbackPath = join(dir, 'feedback.json');
  if (existsSync(feedbackPath)) { try { feedback = JSON.parse(readFileSync(feedbackPath, 'utf8')); } catch {} }
  const state = {title: String(manifest.title || basename(resolve(dir, '..', '..')) || 'Seenry canvas'), stage: String(manifest.stage || ''), question: String(manifest.question || ''),
    description: String(manifest.description || ''), owner: String(manifest.owner || ''), speed: manifest.speed === 'studio' ? 'studio' : 'quick', library: library ? libraryName(library) : '',
    log: (Array.isArray(manifest.log) ? manifest.log : []).slice(-8).reverse(), statuses: STATUSES,
    error: manifest.error || (manifest.library && !library ? `The library "${manifest.library}" has no tokens.css.` : null), sections, flows, approvals, feedback, agentWaiting: waiting(),
    timing: {started: manifest.started || '', firstOption: manifest.firstOption || ''}, activity: pending ? readActivity(30) : []};
  state.rev = [mtime(manifestPath), mtime(join(dir, 'review.json')), mtime(activityFile()), state.agentWaiting, ...sections.flatMap(s => [s.id, ...s.frames.map(f => f.id + f.kind + f.rev)])].join('|');
  return state;
}

const PAGE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Seenry canvas</title>
<style>
@font-face { font-family: "Open Runde"; src: url("/_seenry/fonts/runde-Regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Open Runde"; src: url("/_seenry/fonts/runde-Medium.woff2") format("woff2"); font-weight: 500; font-display: swap; }
@font-face { font-family: "Open Runde"; src: url("/_seenry/fonts/runde-Semibold.woff2") format("woff2"); font-weight: 600 700; font-display: swap; }
/* Seenry's own materials (seenry-web sx.css): white paper, #f4f4f3 wells, #171717 ink, hairlines, Open Runde. Colour comes only from the screens. */
:root { color-scheme: light dark; --paper: #ffffff; --surface: #f4f4f3; --bg: #f4f4f3; --dots: rgb(0 0 0 / .08); --panel: #ffffff; --panel-2: #f4f4f3; --ink: #171717; --on-ink: #ffffff; --heading: #242424; --text: #383838; --ink-2: #6d6d6d; --ink-3: #707070; --line: rgb(0 0 0 / .07); --line-strong: rgb(0 0 0 / .14); --fill: rgb(0 0 0 / .045); --fill-2: rgb(0 0 0 / .08); --sel: #171717; --agent: #171717; --ok: #1a7f4b; --warn: #944509; --section: rgb(255 255 255 / .62); --section-line: rgb(0 0 0 / .06);
  --float: 0 0 0 1px rgb(0 0 0 / .06), 0 16px 40px rgb(0 0 0 / .1); --out: cubic-bezier(0.23, 1, 0.32, 1);
  --font: "Open Runde", ui-rounded, "SF Pro Rounded", system-ui, -apple-system, sans-serif;
  --top: 60px; --left: 248px; --right: 304px; --rail: 320px;
  font: 14px/1.45 var(--font); }
@media (prefers-color-scheme: dark) { :root { --paper: #0c0c0c; --surface: #181818; --bg: #111111; --dots: rgb(255 255 255 / .06); --panel: #0c0c0c; --panel-2: #1f1f1f; --ink: #f2f2f0; --on-ink: #111111; --heading: #f2f2f0; --text: #d6d6d4; --ink-2: #9a9a98; --ink-3: #8a8a88; --line: rgb(255 255 255 / .08); --line-strong: rgb(255 255 255 / .16); --fill: rgb(255 255 255 / .06); --fill-2: rgb(255 255 255 / .11); --sel: #f2f2f0; --agent: #f2f2f0; --ok: #4cc27e; --warn: #f0a046; --section: rgb(255 255 255 / .03); --section-line: rgb(255 255 255 / .07); --float: 0 0 0 1px rgb(255 255 255 / .08), 0 16px 40px rgb(0 0 0 / .5); } }
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; overflow: hidden; background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }
button, textarea, select { font: inherit; color: inherit; }
#topbar { position: fixed; inset: 0 0 auto 0; height: var(--top); z-index: 3; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 16px; padding: 0 16px 0 18px; background: var(--paper); box-shadow: 0 1px 0 var(--line); }
.tb-left, .tb-right, .tb-mid { display: flex; align-items: center; gap: 4px; min-width: 0; }
.tb-left { gap: 12px; }
.tb-right { justify-content: end; }
.who { display: grid; min-width: 0; line-height: 1.25; }
#title { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: var(--heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status { display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 100%; border: 0; background: none; padding: 0; color: var(--ink-2); font-size: 13px; cursor: pointer; text-align: start; }
.status span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status:hover, .status[aria-pressed="true"] { color: var(--ink); }
.tb-mid { padding: 3px; border-radius: 999px; background: var(--surface); }
.tb-mid button { border: 0; background: none; height: 32px; padding: 0 16px; border-radius: 999px; cursor: pointer; color: var(--ink-2); font-weight: 500; }
.tb-mid button[aria-selected="true"] { background: var(--paper); color: var(--ink); box-shadow: 0 0 0 1px var(--line), 0 1px 3px rgb(0 0 0 / .06); }
.tb { border: 0; background: none; height: 36px; padding: 0 14px; border-radius: 999px; cursor: pointer; color: var(--ink-2); font-weight: 500; white-space: nowrap; transition: background-color 160ms var(--out), color 160ms var(--out); }
.tb:hover { background: var(--surface); color: var(--ink); }
.tb[aria-pressed="true"] { background: var(--surface); color: var(--ink); }
.tb.primary { background: var(--ink); color: var(--on-ink); margin-left: 4px; }
.tb.primary:hover { background: var(--ink); color: var(--on-ink); opacity: .88; }
.sx-mark { flex: none; display: block; width: 32px; height: 32px; }
.sx-mark svg, .sx-eyes { display: block; width: 100%; height: 100%; overflow: visible; }
.seen-tile { fill: var(--ink); }
.seen-eye { fill: var(--paper); transform-box: fill-box; transform-origin: center; }
.seen-look { transition: transform 280ms var(--out); }
.is-blink .seen-eye { animation: seen-blink 180ms var(--out); }
@keyframes seen-blink { 50% { transform: scaleY(0.12); } }
.live-dot { width: 7px; height: 7px; border-radius: 99px; background: var(--ink-3); flex: none; opacity: .5; }
[data-active="true"] > .live-dot, [data-active="true"] .live-head .live-dot { background: var(--ok); opacity: 1; box-shadow: 0 0 0 3px color-mix(in oklab, var(--ok) 22%, transparent); }
.sep { width: 1px; height: 20px; background: var(--line); margin: 0 6px; }
#left { position: fixed; top: var(--top); left: 0; bottom: 0; width: var(--left); z-index: 2; background: var(--panel); box-shadow: 1px 0 0 var(--line); display: flex; flex-direction: column; }
.pane-head { padding: 12px 14px 6px; font-weight: 600; display: flex; justify-content: space-between; color: var(--ink); }
.pane-head span { color: var(--ink-3); font-weight: 400; font-variant-numeric: tabular-nums; }
#viewport { position: fixed; inset: var(--top) var(--right) 0 var(--left); overflow: hidden; cursor: default; touch-action: none; user-select: none; -webkit-user-select: none; background-color: var(--bg); background-image: radial-gradient(var(--dots) 1px, transparent 1px); background-size: 20px 20px; }
#viewport.panning { cursor: grabbing; }
#viewport[data-tool="comment"] .shield { cursor: crosshair; }
#world { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
.section { position: absolute; border-radius: calc(10px * var(--inv)); background: var(--section); box-shadow: inset 0 0 0 calc(1px * var(--inv)) var(--section-line); }
.section[data-choose="true"] { background: color-mix(in oklab, var(--sel) 6%, transparent); box-shadow: inset 0 0 0 calc(1px * var(--inv)) color-mix(in oklab, var(--sel) 28%, transparent); }
.section[data-system="true"] { background: transparent; box-shadow: inset 0 0 0 calc(1px * var(--inv)) var(--section-line); }
.section-title { position: absolute; left: calc(18px * var(--inv)); top: calc(16px * var(--inv)); display: flex; align-items: center; gap: calc(8px * var(--inv)); white-space: nowrap; font-size: calc(14px * var(--inv)); line-height: 1.3; }
.section-title b { font-weight: 600; }
.section-title small { color: var(--ink-2); font-size: 1em; font-weight: 400; }
.frame { position: absolute; }
.frame-label { position: absolute; left: 0; bottom: 100%; padding-bottom: calc(6px * var(--inv)); display: flex; align-items: center; gap: calc(6px * var(--inv)); font-size: calc(11px * var(--inv)); line-height: 1.4; color: var(--ink-3); white-space: nowrap; max-width: 100%; overflow: hidden; cursor: pointer; font-variant-numeric: tabular-nums; }
.frame-label b { font-weight: 500; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; }
.frame[data-selected="true"] .frame-label b { color: var(--sel); }
.frame[data-status="approved"] .frame-label b { color: var(--ok); }
.frame[data-status="change"] .frame-label b { color: var(--warn); }
.chip { font-style: normal; font-size: .9em; font-weight: 600; line-height: 1; padding: .3em .55em; border-radius: .45em; background: var(--fill-2); color: var(--ink-2); }
.chip[data-tone="pick"] { background: var(--ink); color: var(--on-ink); }
.chip[data-tone="bold"] { background: color-mix(in oklab, var(--warn) 20%, transparent); color: var(--warn); }
.frame-body { position: absolute; inset: 0; background: #fff; overflow: hidden; box-shadow: 0 0 0 calc(1px * var(--inv)) var(--line), 0 calc(4px * var(--inv)) calc(18px * var(--inv)) rgb(0 0 0 / .06); }
.frame[data-device="phone"] .frame-body { border-radius: 28px; }
.frame[data-selected="true"] .frame-body { box-shadow: 0 0 0 calc(2px * var(--inv)) var(--sel); }
.frame[data-picked="true"] .frame-body { box-shadow: 0 0 0 calc(3px * var(--inv)) var(--ok); }
.frame iframe, .frame img { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
.frame img { object-fit: cover; object-position: top; }
.frame .shield { position: absolute; inset: 0; }
.frame[data-live="true"] .shield { display: none; }
.frame[data-kind="pending"] .frame-body { background: var(--panel-2); box-shadow: inset 0 0 0 calc(1.5px * var(--inv)) var(--ink-3); border: 0; }
.pending { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 12px; color: var(--ink-2); font-size: max(28px, calc(13px * var(--inv))); background: linear-gradient(100deg, transparent 30%, var(--fill) 50%, transparent 70%) 0 0 / 300% 100%; animation: shimmer 1.6s linear infinite; }
.pending small { font-size: .6em; color: var(--ink-3); }
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
@media (prefers-reduced-motion: reduce) { .pending { animation: none; } }
.pin { position: absolute; translate: -50% -50%; min-width: calc(22px * var(--inv)); height: calc(22px * var(--inv)); border-radius: 99px 99px 99px 0; background: var(--warn); color: #fff; font-size: calc(12px * var(--inv)); font-weight: 600; display: grid; place-items: center; pointer-events: none; box-shadow: 0 0 0 calc(2px * var(--inv)) #fff; }
#panel { position: fixed; top: var(--top); right: 0; bottom: 0; width: var(--right); z-index: 2; background: var(--panel); box-shadow: -1px 0 0 var(--line); display: flex; flex-direction: column; }
.scroll { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
#left .scroll { padding: 0 6px 12px; }
.outline h2 { display: flex; align-items: center; gap: 6px; margin: 14px 8px 4px; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: .04em; }
.outline h2 .badge, .outline h2 .chip { text-transform: none; letter-spacing: 0; }
.outline button { display: flex; gap: 8px; align-items: center; width: 100%; height: 28px; text-align: start; border: 0; background: none; padding: 0 8px; border-radius: 6px; cursor: pointer; }
.outline button:hover { background: var(--fill); }
.outline button[aria-current="true"] { background: color-mix(in oklab, var(--sel) 14%, transparent); }
.outline .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.outline .meta { color: var(--ink-3); font-size: 11px; }
.outline button[data-kind="pending"] .name { color: var(--ink-3); font-style: italic; }
.dot { width: 7px; height: 7px; border-radius: 99px; background: var(--fill-2); flex: none; }
.dot[data-status="approved"] { background: var(--ok); } .dot[data-status="change"] { background: var(--warn); }
.inspector { padding: 14px 16px 16px; display: grid; gap: 12px; align-content: start; }
.inspector h3 { margin: 0; font-size: 14px; font-weight: 600; }
.inspector p { margin: 0; color: var(--ink-2); }
.eyebrow { font-size: 11px; font-weight: 600; color: var(--ink-3) !important; text-transform: uppercase; letter-spacing: .04em; }
.decision { display: grid; gap: 6px; padding-top: 12px; border-top: 1px solid var(--line); }
.choice { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; align-items: center; padding: 8px 10px; border-radius: 8px; background: var(--fill); cursor: pointer; border: 0; text-align: start; width: 100%; }
.choice:hover { background: var(--fill-2); }
.choice[aria-pressed="true"] { background: color-mix(in oklab, var(--ok) 16%, transparent); box-shadow: inset 0 0 0 1.5px var(--ok); }
.choice b { font-weight: 600; } .choice span { grid-column: 1; color: var(--ink-2); font-size: 11px; } .choice em { grid-row: 1 / 3; grid-column: 2; font-style: normal; font-weight: 600; color: var(--ink-2); }
.choice[aria-pressed="true"] em { color: var(--ok); }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
.btn { border: 0; border-radius: 999px; height: 32px; padding: 0 14px; background: var(--fill); cursor: pointer; font-weight: 500; text-decoration: none; color: var(--ink); display: inline-flex; align-items: center; }
.btn:hover { background: var(--fill-2); }
.btn:active { scale: .97; }
.btn[aria-pressed="true"] { background: var(--ink); color: var(--panel); }
.btn.primary { background: var(--ink); color: var(--on-ink); }
.notes { display: grid; gap: 6px; }
.note { display: flex; gap: 8px; align-items: start; background: var(--fill); border-radius: 8px; padding: 6px 8px; }
.note span { flex: 1; overflow-wrap: anywhere; }
.note b { color: var(--warn); }
.note button { border: 0; background: none; cursor: pointer; color: var(--ink-2); padding: 0 4px; }
textarea { width: 100%; min-height: 52px; max-height: 160px; resize: vertical; font-size: 13px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel-2); }
#status { color: var(--ink-2); min-height: 1.4em; }
#links { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
#links path { fill: none; stroke: var(--sel); stroke-width: calc(2px * var(--inv)); opacity: .55; }
#links circle { fill: var(--sel); }
#links[hidden] { display: none; }
.agent { margin: 0; padding: 8px 16px; background: color-mix(in oklab, var(--ok) 14%, transparent); color: var(--ink); border-bottom: 1px solid var(--line); }
.agent[hidden] { display: none; }
#present { position: fixed; inset: 0; z-index: 10; background: #0f0f0e; color: #f1efea; display: grid; grid-template-rows: auto 1fr; }
#present[hidden] { display: none; }
#present .bar { display: flex; gap: 8px; align-items: center; padding: 10px 14px; }
#present .bar strong { font-weight: 600; } #present .bar span { color: #a39e95; }
#present .bar .btn { background: rgb(255 255 255 / .1); color: #f1efea; }
#present .stage { position: relative; overflow: hidden; display: grid; place-items: center; }
#present iframe { border: 0; background: #fff; transform-origin: 50% 50%; box-shadow: 0 0 0 1px rgb(255 255 255 / .1), 0 24px 60px rgb(0 0 0 / .5); }
#present[data-device="phone"] iframe { border-radius: 32px; }
.cover { position: absolute; inset: 0; padding: 96px 112px; display: grid; align-content: start; gap: 28px; background: var(--panel); color: var(--ink); font-size: 22px; line-height: 1.4; }
.cover h1 { margin: 0; font-size: 88px; line-height: 1; letter-spacing: -0.03em; font-weight: 600; }
.cover p { margin: 0; color: var(--ink-2); max-width: 30em; }
.cover .meta { font-size: 18px; }
.cover-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 40px; margin-top: 12px; }
.cover-row { display: flex; gap: 14px; align-items: baseline; padding: 12px 0; border-top: 1px solid var(--line); }
.cover-row b { font-weight: 600; flex: 1; } .cover-row span { font-size: 17px; color: var(--ink-2); }
.cover h2 { margin: 20px 0 0; font-size: 20px; font-weight: 600; }
.cover li { font-size: 18px; color: var(--ink-2); }
.badge { display: inline-block; font-size: 11px; font-weight: 600; line-height: 1; padding: 4px 6px; border-radius: 5px; background: var(--fill); color: var(--ink-2); vertical-align: middle; white-space: nowrap; }
.badge[data-status="in-progress"] { background: color-mix(in oklab, var(--warn) 18%, transparent); color: var(--warn); }
.badge[data-status="review"] { background: color-mix(in oklab, var(--sel) 16%, transparent); color: var(--sel); }
.badge[data-status="ready"] { background: color-mix(in oklab, var(--ok) 18%, transparent); color: var(--ok); }
.cover .badge { font-size: 15px; padding: 5px 9px; }
.section-title .badge, .section-title .chip { font-size: .8em; padding: .35em .55em; border-radius: .4em; }
.frame[data-archived="true"] .frame-body { opacity: .55; }
.outline h2[data-dim="true"] { opacity: .6; }
#p-flow { font: inherit; color: #f1efea; background: rgb(255 255 255 / .1); border: 0; border-radius: 8px; padding: 6px 8px; }
#review { position: fixed; inset: 0; z-index: 11; background: var(--surface); color: var(--ink); display: grid; grid-template-columns: 1fr 380px; }
#review[hidden] { display: none; }
#review .stage { position: relative; overflow: hidden; display: grid; place-items: center; }
#review .stage iframe { border: 0; background: #fff; transform-origin: 50% 50%; border-radius: 14px; box-shadow: var(--float); }
#review[data-device="phone"] .stage iframe { border-radius: 32px; }
#review aside { background: var(--paper); box-shadow: -1px 0 0 var(--line); padding: 24px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; overscroll-behavior: contain; }
#review h2 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: var(--heading); }
#review .muted { color: var(--ink-2); margin: 0; }
#review .btn { height: 36px; padding: 0 14px; border-radius: 999px; background: var(--surface); color: var(--ink); }
#review .btn[aria-pressed="true"], #review .btn.primary { background: var(--ink); color: var(--on-ink); }
#review textarea { color: var(--ink); border-color: var(--line-strong); background: var(--paper); }
#review .q { display: grid; gap: 8px; padding: 12px 0; border-top: 1px solid var(--line); }
#review .pill { position: absolute; bottom: 24px; left: 50%; translate: -50% 0; display: flex; gap: 2px; padding: 4px; border-radius: 999px; background: var(--paper); box-shadow: var(--float); }
#review .pill[hidden] { display: none; }
#review .pill button { border: 0; background: none; color: var(--ink-2); font: inherit; font-size: 13px; font-weight: 500; height: 32px; padding: 0 14px; border-radius: 999px; cursor: pointer; }
#review .pill button[data-active] { background: var(--ink); color: var(--on-ink); }
#review .risk { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 999px; background: var(--surface); }
#review .risk[data-risk="bold"] { background: color-mix(in oklab, var(--warn) 18%, transparent); color: var(--warn); }
#review .grow { flex: 1; }
@media (max-width: 760px) { #review { grid-template-columns: 1fr; grid-template-rows: 55vh 1fr; } }
.specs { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 12px; }
.specs dt { color: var(--ink-2); } .specs dd { margin: 0; overflow-wrap: anywhere; }
.specs code { font: 11px ui-monospace, "SF Mono", Menlo, monospace; }
.specs .tok { color: var(--sel); } .specs .raw { color: var(--warn); }
#zoom { position: fixed; left: calc(var(--left) + 12px); bottom: 12px; z-index: 2; display: flex; gap: 2px; padding: 3px; border-radius: 9px; background: var(--panel); box-shadow: 0 0 0 1px var(--line), 0 4px 14px rgb(0 0 0 / .08); }
#zoom button { border: 0; background: none; border-radius: 6px; height: 26px; padding: 0 9px; cursor: pointer; font-variant-numeric: tabular-nums; color: var(--ink-2); }
#zoom button:hover { background: var(--fill); color: var(--ink); }
#zoom-level { min-width: 48px; }
#hint { position: fixed; left: calc((var(--left) + 100vw - var(--right)) / 2); top: calc(var(--top) + 12px); translate: -50% 0; z-index: 2; padding: 6px 12px; border-radius: 8px; background: var(--ink); color: var(--panel); font-weight: 500; }
#hint[hidden] { display: none; }
.error { margin: 0; padding: 8px 16px; background: color-mix(in oklab, var(--warn) 18%, transparent); }
dialog { border: 0; border-radius: 12px; padding: 16px; width: min(420px, calc(100vw - 32px)); background: var(--panel); color: var(--ink); box-shadow: 0 16px 48px rgb(0 0 0 / .3); }
dialog::backdrop { background: rgb(0 0 0 / .35); }
dialog h3 { margin: 0 0 4px; font-size: 14px; } dialog p { margin: 0 0 10px; color: var(--ink-2); overflow-wrap: anywhere; }
dialog .row { justify-content: end; margin-top: 10px; }
:focus-visible { outline: 2px solid var(--sel); outline-offset: 2px; }
.blank { position: absolute; inset: 0; background: #fff; }
.idle { position: absolute; left: 40px; top: 32px; display: flex; align-items: center; gap: 7px; transform: scale(var(--inv, 1)); transform-origin: 0 0; font-size: 13px; font-weight: 600; }
.c-thumb .idle { transform: none; left: 20px; top: 18px; }
.idle svg { width: 26px; height: 26px; flex: none; }
.idle .seen-tile { fill: #171717; stroke: #fff; stroke-width: 5; paint-order: stroke; } .idle .seen-eye { fill: #fff; }
.idle .seen-look { animation: glance 3.2s var(--out) infinite; }
.idle span { background: #171717; color: #fff; padding: 7px 11px; border-radius: 999px; white-space: nowrap; box-shadow: 0 8px 24px rgb(0 0 0 / .18); }
.c-card[data-kind="pending"] .c-thumb { background: #fff; }
@media (prefers-reduced-motion: reduce) { .idle .seen-look { animation: none; } }
.agent-tag { display: none; position: absolute; right: 0; bottom: 100%; margin-bottom: calc(6px * var(--inv)); align-items: center; gap: calc(6px * var(--inv)); padding: calc(4px * var(--inv)) calc(10px * var(--inv)) calc(4px * var(--inv)) calc(4px * var(--inv)); border-radius: 999px; background: var(--ink); color: var(--on-ink); font-size: calc(12px * var(--inv)); font-weight: 600; white-space: nowrap; max-width: 70%; overflow: hidden; text-overflow: ellipsis; box-shadow: var(--float); }
.agent-tag svg { width: calc(18px * var(--inv)); height: calc(18px * var(--inv)); flex: none; }
.agent-tag .seen-tile { fill: var(--on-ink); } .agent-tag .seen-eye { fill: var(--ink); }
.frame[data-agent="true"] .agent-tag { display: flex; }
.frame[data-agent="true"] .frame-body { box-shadow: 0 0 0 calc(2px * var(--inv)) var(--ink); }
#live, #c-feed { padding: 16px 20px 20px; display: grid; gap: 2px; align-content: start; }
#live { border-top: 1px solid var(--line); }
.live-head { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.live-head b { font-weight: 600; color: var(--heading); }
.live-head .meta { margin-left: auto; color: var(--ink-3); font-size: 12px; }
.live-item { display: grid; grid-template-columns: 34px 1fr; gap: 8px; text-align: start; border: 0; background: none; padding: 6px 8px; margin: 0 -8px; border-radius: 8px; color: var(--text); cursor: pointer; font-size: 13px; line-height: 1.4; }
.live-item:disabled { cursor: default; color: var(--ink-2); }
.live-item:not(:disabled):hover { background: var(--surface); }
.live-item .meta { color: var(--ink-3); font-variant-numeric: tabular-nums; font-size: 12px; padding-top: 1px; }
.live-empty { margin: 0; color: var(--ink-2); font-size: 13px; }
/* The board: the options pinned up side by side, the reasoning under each, one choice. */
#compact { position: fixed; inset: var(--top) 0 0 0; display: none; background: var(--paper); grid-template-columns: minmax(0, 1fr) var(--rail); grid-template-areas: "list rail"; }
body[data-compact="true"] #compact { display: grid; }
body[data-compact="true"] :is(#viewport, #left, #panel, #zoom, #hint) { display: none !important; }
#c-live { grid-area: live; display: none; gap: 8px; align-items: center; padding: 10px 16px; background: var(--paper); box-shadow: 0 1px 0 var(--line); color: var(--ink-2); font-size: 13px; min-width: 0; }
#c-live span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#c-list { grid-area: list; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 44px clamp(16px, 4vw, 64px) 72px; display: grid; gap: 56px; align-content: start; }
#c-rail { grid-area: rail; min-height: 0; display: flex; flex-direction: column; box-shadow: -1px 0 0 var(--line); background: var(--paper); }
#c-feed { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
.b-intro { display: grid; gap: 10px; max-width: 760px; }
.b-intro h2 { margin: 0; font-size: clamp(28px, 3.2vw, 40px); line-height: 1.08; font-weight: 600; letter-spacing: -0.035em; color: var(--heading); text-wrap: balance; }
.b-intro p { margin: 0; font-size: 16px; line-height: 1.5; color: var(--ink-2); text-wrap: pretty; max-width: 62ch; }
.b-empty { display: grid; justify-items: start; gap: 18px; padding-top: 8vh; }
.b-empty .sx-mark { width: 56px; height: 56px; }
.b-section { display: grid; gap: 20px; }
.b-head { display: flex; gap: 10px; align-items: center; }
.b-head h3 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: var(--heading); }
.b-row { display: grid; gap: clamp(20px, 2.4vw, 32px); grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr)); align-items: start; }
.b-grid { display: grid; gap: 28px 24px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); align-items: start; }
.c-card { position: relative; display: grid; gap: 14px; min-width: 0; }
.c-thumb { position: relative; overflow: hidden; border-radius: 14px; background: var(--surface); cursor: zoom-in; transition: translate 240ms var(--out), box-shadow 240ms var(--out); }
.c-thumb::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px var(--line); pointer-events: none; transition: box-shadow 200ms var(--out); }
@media (hover: hover) and (pointer: fine) { .c-thumb:hover { translate: 0 -3px; box-shadow: var(--float); } }
.c-thumb iframe { position: absolute; top: 0; border: 0; transform-origin: 0 0; pointer-events: none; background: #fff; }
.c-card[data-picked="true"] .c-thumb::after { box-shadow: inset 0 0 0 2px var(--ink); }
.c-card[data-agent="true"] .c-thumb::after { box-shadow: inset 0 0 0 2px var(--ink); }
.c-chosen { position: absolute; z-index: 1; left: 12px; top: 12px; display: none; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border-radius: 999px; background: var(--ink); color: var(--on-ink); font-size: 13px; font-weight: 600; }
.c-card[data-picked="true"] .c-chosen { display: inline-flex; }
.c-card[data-kind="pending"] .c-thumb { aspect-ratio: 16 / 10; cursor: default; }
.c-card[data-kind="pending"] .pending { background: none; animation: none; font-size: 14px; gap: 14px; }
.c-card[data-kind="pending"] .pending .sx-mark { width: 40px; height: 40px; }
.c-card[data-kind="pending"] .seen-look { animation: glance 3.2s var(--out) infinite; }
@keyframes glance { 0%, 18% { transform: translate(-3px, 0); } 40%, 62% { transform: translate(3px, 1px); } 84%, 100% { transform: translate(-3px, 0); } }
.c-body { display: grid; gap: 6px; padding: 0 2px; }
.c-title { display: flex; gap: 8px; align-items: center; min-width: 0; }
.c-title b { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; color: var(--heading); }
.c-body p { margin: 0; color: var(--text); font-size: 14px; line-height: 1.5; }
.c-why { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; margin: 4px 0 0; font-size: 13px; line-height: 1.45; }
.c-why dt { color: var(--ink-3); } .c-why dd { margin: 0; color: var(--ink-2); }
.c-body .row { margin-top: 8px; gap: 8px; }
.c-body .btn { height: 36px; padding: 0 16px; border-radius: 999px; background: var(--surface); }
.c-body .btn.primary { background: var(--ink); color: var(--on-ink); }
.c-body .btn[aria-pressed="true"] { background: var(--ink); color: var(--on-ink); }
.c-body .btn.quiet { background: none; color: var(--ink-2); padding: 0 8px; }
.c-body .btn.quiet:hover { color: var(--ink); background: none; text-decoration: underline; text-underline-offset: 3px; }
.b-grid .c-why, .b-grid .c-body p:not(:first-of-type) { display: none; }
.c-card .seen-mark-dot { display: none; }
#composer { border-top: 1px solid var(--line); padding: 14px 20px calc(16px + env(safe-area-inset-bottom)); display: grid; gap: 10px; background: var(--paper); }
#composer textarea { min-height: 64px; border-radius: 12px; background: var(--surface); border-color: transparent; font-size: 14px; padding: 10px 12px; }
#composer textarea:focus { background: var(--paper); border-color: var(--line-strong); outline: none; box-shadow: 0 0 0 3px var(--fill); }
#send { height: 40px; padding: 0 18px; border-radius: 999px; background: var(--ink); color: var(--on-ink); font-weight: 600; }
#status { font-size: 13px; }
@media (max-width: 820px) {
  #compact { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto; grid-template-areas: "live" "list" "rail"; }
  #c-live { display: flex; }
  #c-feed { display: none; }
  #c-rail { box-shadow: 0 -1px 0 var(--line); }
  #c-list { padding: 24px 16px 32px; gap: 40px; }
  .b-row { grid-template-columns: minmax(0, 1fr); }
  .status { display: none; }
}
@media (prefers-reduced-motion: reduce) { .c-card[data-kind="pending"] .seen-look { animation: none; } .c-thumb { transition: none; } }
@media (max-width: 1100px) { :root { --left: 0px; } #left { display: none; } }
@media (max-width: 760px) { :root { --right: 0px; } #topbar { grid-template-columns: minmax(0, 1fr) auto auto; gap: 8px; padding: 0 12px; } .tb-right .tb:not(.primary) { display: none; } .tb-mid button { padding: 0 12px; } #viewport { inset: var(--top) 0 46vh 0; } #zoom { bottom: calc(46vh + 12px); } #panel { inset: auto 0 0 0; width: auto; height: 46vh; box-shadow: 0 -1px 0 var(--line); } }
</style>
</head>
<body>
<header id="topbar">
  <div class="tb-left"><span class="sx-mark" id="mark" aria-hidden="true"><svg viewBox="0 0 64 64"><rect class="seen-tile" width="64" height="64" rx="18"/><g class="seen-look"><rect class="seen-eye" x="18.5" y="22" width="10" height="20" rx="5"/><rect class="seen-eye" x="35.5" y="22" width="10" height="20" rx="5"/></g></svg></span>
    <div class="who"><h1 id="title"></h1><button type="button" class="status" id="agent-presence" aria-pressed="false" title="Follow Seenry as it works (A)"><span class="live-dot"></span><span id="presence-text">Seenry is idle</span></button></div></div>
  <div class="tb-mid" role="tablist" aria-label="View">
    <button type="button" role="tab" id="view-map" aria-selected="true" title="Every screen on one canvas, built live (M)">Canvas</button>
    <button type="button" role="tab" id="view-board" aria-selected="false" title="The options as a list of cards, for a side pane (B)">List</button>
  </div>
  <div class="tb-right">
    <button type="button" class="tb" id="mode" title="Show every screen in light or dark mode (D)">Light</button>
    <button type="button" class="tb" id="play" title="Play the screens full size, following their links (P)">Present</button>
    <button type="button" class="tb primary" id="start-review" title="Go through the screens one at a time (R)">Review</button>
  </div>
</header>
<nav id="left" aria-label="Screens"><div class="pane-head">Screens <span id="count"></span></div><div class="scroll"><div class="outline" id="outline"></div></div></nav>
<div id="viewport"><div id="world"></div></div>
<div id="hint" hidden></div>
<main id="compact" aria-label="Board"><div id="c-live" aria-live="polite"><span class="live-dot"></span><span id="c-live-text"></span></div><div id="c-list"></div><aside id="c-rail" aria-label="Seenry and your notes"><section id="c-feed" aria-live="polite"></section></aside></main>
<div id="zoom" role="group" aria-label="Map controls">
  <button type="button" id="tool-move" aria-pressed="true" title="Select and pan (V)">Move</button>
  <button type="button" id="tool-comment" aria-pressed="false" title="Click a screen, then the element to comment on (C)">Comment</button>
  <button type="button" id="tool-inspect" aria-pressed="false" title="Click a screen, then an element to see its values and variables (I)">Inspect</button>
  <span class="sep"></span>
  <button type="button" id="flows" title="Show prototype connections (F)" aria-pressed="true">Flows</button>
  <button type="button" id="grid" title="Show layout grids (G)" aria-pressed="false">Grid</button>
  <button type="button" id="specs-toggle" title="Show handoff specs (S)" aria-pressed="false">Specs</button>
  <span class="sep"></span>
  <button type="button" id="zoom-out" aria-label="Zoom out">−</button>
  <button type="button" id="zoom-level" title="Zoom to 100%">100%</button>
  <button type="button" id="zoom-in" aria-label="Zoom in">+</button>
  <button type="button" id="zoom-decision" title="Show what needs your decision (2)">Decision</button>
  <button type="button" id="zoom-fit" title="Fit everything (1)">Fit all</button>
</div>
<div id="review" hidden>
  <div class="stage" id="r-stage"><iframe id="r-frame" title="Screen under review"></iframe><div class="pill" id="r-pill" hidden></div></div>
  <aside id="r-panel"></aside>
</div>
<div id="present" hidden>
  <div class="bar"><strong id="p-name"></strong><span id="p-where"></span><span style="flex:1"></span>
    <select id="p-flow" aria-label="Flow"></select>
    <button type="button" class="btn" id="p-prev" aria-label="Previous screen">←</button>
    <button type="button" class="btn" id="p-next" aria-label="Next screen">→</button>
    <button type="button" class="btn" id="p-restart">Restart</button>
    <button type="button" class="btn" id="p-close">Close (Esc)</button></div>
  <div class="stage" id="p-stage"><iframe id="p-frame" title="Prototype"></iframe></div>
</div>
<aside id="panel" aria-label="Details">
  <p class="agent" id="agent" hidden>Your agent is waiting. “Send to agent” goes straight to it.</p>
  <p class="error" id="error" hidden></p>
  <div class="scroll"><section class="inspector" id="inspector"></section><section id="live" aria-live="polite" aria-label="What the agent is doing"></section></div>
  <footer id="composer">
    <textarea id="general" placeholder="Anything else the agent should know" aria-label="General notes"></textarea>
    <div class="row" style="align-items:center;justify-content:space-between"><span id="status" role="status"></span><button type="button" class="btn primary" id="send">Send to agent</button></div>
  </footer>
</aside>
<dialog id="note-dialog"><form method="dialog">
  <h3>Comment</h3><p id="note-target"></p>
  <textarea id="note-text" aria-label="Comment" required></textarea>
  <div class="row"><button class="btn" value="cancel" formnovalidate>Cancel</button><button class="btn primary" value="ok">Add comment</button></div>
</form></dialog>
<script>
const EMBEDDED = /*STATE*/null;
const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children.filter(c => c !== '' && c != null)); return node; };
const GAP = 120, ROW_GAP = 420, MAX_H = 7000;
let tool = 'move', following = true, lastAt = '', compact = false, forceCanvas = false;
const cards = {}, heads = {};
let state = null, view = {x: 0, y: 0, z: 1}, selected = null, live = null, commenting = false, pending = null, fitted = false, showLinks = true, playing = null, inspecting = false, inspected = null, showGrid = false, dark = false, showSpecs = false, flow = null;
const touched = new Set(), riffs = [];
let reviewing = null;
const DEFAULT_ASK = ['Is anything missing on this screen?', 'Is it clear what to do first?', 'Does anything look wrong or out of place?'];
const status = {}, picks = {}, notes = [], heights = {}, nodes = {};

const frames = () => state.sections.flatMap(s => s.frames.map(f => ({...f, section: s})));
const find = id => frames().find(f => f.id === id);
const height = f => heights[f.id] || f.h;

// Decisions first, then the screens, the references, the system pages and the archive: the canvas opens on what needs the person.
const rank = s => s.archived ? 4 : s.choose && !s.study ? 0 : !s.system && !s.reference ? 1 : s.reference ? 2 : 3;
const placed = () => state.sections.map((s, i) => [s, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);
const pickChip = s => isOpen(s) ? chip('Pick one', 'pick') : picks[s.id] ? chip('Picked') : s.frames.some(f => f.kind === 'pending') ? chip('Being drawn') : '';
const isOpen = s => s.choose && !s.study && !s.archived && !picks[s.id] && s.frames.some(f => f.kind === 'page');

function layout() {
  // Titles and labels keep a readable screen size, so the space they need grows as the canvas zooms out.
  const pad = Math.max(48, 20 / view.z), head = Math.max(80, 76 / view.z), gap = Math.max(GAP, 36 / view.z);
  let y = 0; const boxes = {};
  for (const section of placed()) {
    let x = pad, row = 0;
    for (const f of section.frames) { boxes[f.id] = {x, y: y + head, w: f.w, h: height(f)}; x += f.w + gap; row = Math.max(row, height(f)); }
    section.box = {x: 0, y, w: Math.max(x - gap + pad, 600), h: head + row + pad};
    y += section.box.h + Math.max(ROW_GAP / 2, 90 / view.z);
  }
  return boxes;
}

function apply() {
  $('world').style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.z + ')';
  $('world').style.setProperty('--inv', 1 / view.z);
  $('zoom-level').textContent = Math.round(view.z * 100) + '%';
}
function zoomAt(cx, cy, z) {
  z = Math.min(2, Math.max(0.03, z));
  view.x = cx - (cx - view.x) * (z / view.z); view.y = cy - (cy - view.y) * (z / view.z); view.z = z; apply();
  if (state) place();
}
function fitBox(box, pad = 56, top = false) {
  const vp = $('viewport').getBoundingClientRect();
  const z = Math.min(1, (vp.width - pad * 2) / box.w, (vp.height - pad * 2) / box.h);
  view.z = Math.max(0.03, z); view.x = (vp.width - box.w * view.z) / 2 - box.x * view.z; view.y = (top ? pad / 2 : Math.max(pad, (vp.height - box.h * view.z) / 2)) - box.y * view.z; apply();
}
// The layout depends on the zoom, so fitting repeats until it settles, then places everything.
function fitSections(pick, cap) {
  for (let pass = 0; pass < 4; pass++) {
    layout(); const list = pick().filter(s => s.box); if (!list.length) return false;
    const x = Math.min(...list.map(s => s.box.x)), y = Math.min(...list.map(s => s.box.y));
    const w = Math.max(...list.map(s => s.box.x + s.box.w)) - x, h = Math.max(...list.map(s => s.box.y + s.box.h)) - y;
    fitBox({x, y, w, h: cap ? Math.min(h, Math.max(w * 0.6, 900)) : h}, 56, !!cap);
  }
  if (state) place();
  return true;
}
function fitAll() { fitSections(() => state.sections); }
// Opens on the options waiting for a pick, side by side and top-aligned; with none open, on the first screens.
function fitDecision() {
  const open = state.sections.filter(isOpen), design = state.sections.filter(s => !s.system && !s.reference && !s.archived);
  if (!fitSections(() => open.length ? [open[0]] : design.slice(0, 1), true)) fitAll();
}
function focusFrame(id) {
  for (let pass = 0; pass < 2; pass++) { const box = layout()[id]; if (box) fitBox({x: box.x, y: box.y - 40, w: box.w, h: Math.min(box.h, box.w * 1.1) + 40}, 48); }
  if (state) place();
}

function describe(node) {
  const text = (node.innerText || node.getAttribute('alt') || node.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 70);
  const path = [];
  for (let n = node; n && n.nodeType === 1 && n.tagName !== 'BODY' && n.tagName !== 'HTML' && path.length < 4; n = n.parentElement) {
    if (n.id) { path.unshift('#' + n.id); break; }
    const same = [...n.parentElement.children].filter(c => c.tagName === n.tagName);
    path.unshift(n.tagName.toLowerCase() + (same.length > 1 ? ':nth-of-type(' + (same.indexOf(n) + 1) + ')' : ''));
  }
  return {selector: path.join(' > '), target: text ? '“' + text + '”' : node.tagName.toLowerCase()};
}

function applyView(doc) {
  if (!doc || !doc.documentElement) return;
  if (dark) doc.documentElement.dataset.theme = 'dark'; else if (doc.documentElement.dataset.theme === 'dark') delete doc.documentElement.dataset.theme;
  doc.querySelectorAll('.seenry-spec-pin').forEach(n => n.remove());
  if (showSpecs && doc.body) [...doc.querySelectorAll('[data-spec]')].forEach((node, i) => {
    const r = node.getBoundingClientRect(), win = doc.defaultView, pin = doc.createElement('div');
    pin.className = 'seenry-spec-pin'; pin.textContent = String(i + 1); pin.title = node.getAttribute('data-spec');
    pin.style.cssText = 'position:absolute;z-index:2147483647;pointer-events:none;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#7c3aed;color:#fff;font:600 12px/20px ui-sans-serif,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff;left:' + (r.right + win.scrollX - 10) + 'px;top:' + (r.top + win.scrollY - 10) + 'px';
    doc.body.append(pin);
  });
  let grid = doc.getElementById('seenry-grid');
  if (!showGrid) { if (grid) grid.remove(); return; }
  if (!doc.body) return;
  if (!grid) {
    grid = doc.createElement('div'); grid.id = 'seenry-grid'; grid.setAttribute('aria-hidden', 'true');
    grid.style.cssText = 'position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:2147483647;box-sizing:border-box;display:grid;grid-template-columns:repeat(var(--grid-columns,12),minmax(0,1fr));column-gap:var(--grid-gutter,24px);padding-inline:max(var(--grid-margin,24px),calc((100% - var(--grid-max,100%)) / 2))';
    doc.body.append(grid);
  }
  const cols = Number(doc.defaultView.getComputedStyle(doc.documentElement).getPropertyValue('--grid-columns')) || 12;
  if (grid.childElementCount !== cols) grid.replaceChildren(...Array.from({length: cols}, () => { const s = doc.createElement('span'); s.style.background = 'rgb(255 60 60 / .09)'; return s; }));
  grid.style.height = doc.documentElement.scrollHeight + 'px';
}
function eachDoc(fn) { document.querySelectorAll('#world iframe, #p-frame, #c-list iframe').forEach(i => { try { fn(i.contentDocument); } catch {} }); }

/** The rules that apply in a screen, flattened through @media, @supports and @layer, in source order. */
function rules(doc) {
  if (doc.__seenryRules) return doc.__seenryRules;
  const out = [], win = doc.defaultView;
  const walk = list => { for (const r of list) {
    if (r.selectorText && r.style) out.push(r);
    else if (r.media && r.cssRules) { if (win.matchMedia(r.media.mediaText).matches) walk(r.cssRules); }
    else if (r.cssRules) walk(r.cssRules);
  } };
  for (const sheet of doc.styleSheets) { try { walk(sheet.cssRules); } catch {} }
  return (doc.__seenryRules = out);
}
const specificity = sel => (sel.match(/#[\w-]+/g) || []).length * 100 + (sel.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length * 10 + (sel.replace(/[#.][\w-]+|\[[^\]]+\]|::?[\w-]+(\([^)]*\))?/g, ' ').match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;

/** What the author wrote for a property on this element, as devtools shows it: inline style, then the most specific rule. */
function declared(node, longhand, shorthand, inherit) {
  for (let n = node; n && n.nodeType === 1; n = inherit ? n.parentElement : null) {
    const inline = n.style && (n.style.getPropertyValue(longhand) || (shorthand && n.style.getPropertyValue(shorthand)));
    if (inline) return inline;
    let best = null, score = -1;
    for (const r of rules(n.ownerDocument)) {
      const v = r.style.getPropertyValue(longhand) || (shorthand && r.style.getPropertyValue(shorthand));
      if (!v) continue;
      for (const part of r.selectorText.split(',')) {
        let hit = false; try { hit = n.matches(part.trim()); } catch {}
        if (!hit) continue;
        const s = specificity(part); if (s >= score) { score = s; best = v; }
      }
    }
    if (best) return best;
    if (!inherit) return null;
  }
  return null;
}
const varsIn = v => [...String(v).matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);

function inspect(node, f) {
  const win = node.ownerDocument.defaultView, c = win.getComputedStyle(node), rows = [];
  const quiet = v => /^(0px|0px 0px|0px 0px 0px 0px|normal|none|auto|rgba\(0, 0, 0, 0\)|transparent)$/.test(v);
  const row = (label, value, longhand, shorthand, inherit) => {
    if (value == null || value === '') return;
    const d = declared(node, longhand, shorthand, inherit), names = d ? varsIn(d) : [];
    const keyword = d && /^(inherit|initial|unset|currentcolor|transparent|none|auto|0|normal)$/i.test(d.trim());
    rows.push({label, value, token: names.length ? [...new Set(names)].join(' ') : keyword ? d.trim() : null, raw: !!d && !names.length && !keyword && !quiet(value)});
  };
  const r = node.getBoundingClientRect();
  rows.push({label: 'Size', value: Math.round(r.width) + ' × ' + Math.round(r.height)});
  let style = null; for (let n = node; n && n.classList && !style; n = n.parentElement) style = [...n.classList].find(x => x.startsWith('text-'));
  if (style) rows.push({label: 'Text style', value: '.' + style, token: '.' + style});
  const spec = node.closest('[data-spec]');
  if (spec) rows.unshift({label: 'Spec', value: spec.getAttribute('data-spec')});
  const pad = ['top', 'right', 'bottom', 'left'].map(s => c.getPropertyValue('padding-' + s));
  if (!pad.every(v => v === '0px')) row('Padding', pad.join(' ').replace(/^(\S+) (\S+) \1 \2$/, '$1 $2').replace(/^(\S+) \1$/, '$1'), 'padding-top', 'padding');
  if (/flex|grid/.test(c.display) && !quiet(c.rowGap)) row('Gap', c.rowGap, 'row-gap', 'gap');
  row('Font', c.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, ''), 'font-family', 'font', true);
  row('Font size', c.fontSize, 'font-size', 'font', true);
  row('Line height', c.lineHeight, 'line-height', 'font', true);
  row('Weight', c.fontWeight, 'font-weight', 'font', true);
  if (!quiet(c.letterSpacing)) row('Tracking', c.letterSpacing, 'letter-spacing', null, true);
  row('Color', c.color, 'color', null, true);
  if (!quiet(c.backgroundColor)) row('Fill', c.backgroundColor, 'background-color', 'background');
  if (c.borderTopStyle !== 'none' && !quiet(c.borderTopWidth)) row('Border', c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor, 'border-top-color', 'border');
  if (!quiet(c.borderTopLeftRadius)) row('Radius', c.borderTopLeftRadius, 'border-top-left-radius', 'border-radius');
  if (!quiet(c.boxShadow)) row('Shadow', c.boxShadow.length > 60 ? c.boxShadow.slice(0, 57) + '…' : c.boxShadow, 'box-shadow');
  const text = (node.innerText || node.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  inspected = {frame: f.id, name: node.tagName.toLowerCase() + (typeof node.className === 'string' && node.className.trim() ? '.' + node.className.trim().split(/\s+/).join('.') : ''), text, rows};
  render();
}

function arm(iframe, f) {
  let doc; try { doc = iframe.contentDocument; } catch { return; }
  if (!doc || !doc.documentElement) return;
  const measure = () => {
    const h = Math.min(MAX_H, Math.max(f.h, doc.documentElement.scrollHeight));
    if (Math.abs((heights[f.id] || f.h) - h) > 2) { heights[f.id] = h; place(); }
  };
  measure(); setTimeout(measure, 400); setTimeout(measure, 1500);
  applyView(doc); setTimeout(() => applyView(doc), 600);
  let last = null;
  const mark = node => { if (last) last.style.outline = last.dataset.seenryOutline || ''; last = node; if (node) { node.dataset.seenryOutline = node.style.outline; node.style.outline = '2px solid #e8590c'; } };
  doc.addEventListener('mouseover', e => { if ((commenting || inspecting) && live === f.id) mark(e.target); }, true);
  doc.addEventListener('mouseout', () => mark(null), true);
  doc.addEventListener('click', e => {
    if (inspecting && live === f.id) { e.preventDefault(); e.stopPropagation(); mark(null); inspect(e.target, f); return; }
    if (!(commenting && live === f.id)) return;
    e.preventDefault(); e.stopPropagation(); mark(null);
    const r = e.target.getBoundingClientRect(), win = doc.defaultView;
    ask({frame: f.id, ...describe(e.target), x: (r.left + r.width / 2 + win.scrollX) / f.w, y: (r.top + Math.min(r.height / 2, 40) + win.scrollY) / height(f)});
  }, true);
  doc.addEventListener('keydown', e => { if (e.key === 'Escape') { tool = 'move'; live = null; commenting = false; inspecting = false; render(); } });
}
function ask(note) { pending = note; $('note-target').textContent = find(note.frame).name + ' · ' + note.target; $('note-text').value = ''; $('note-dialog').showModal(); }

function build() {
  const world = $('world'); world.replaceChildren();
  for (const k in nodes) delete nodes[k];
  for (const section of state.sections) {
    section.node = el('div', {className: 'section'});
    section.node.dataset.choose = !!(section.choose && !section.archived); section.node.dataset.system = !!(section.system || section.reference);
    world.append(section.node);
    for (const f of section.frames) {
      const body = el('div', {className: 'frame-body'});
      if (f.kind === 'cover') body.append(el('div', {className: 'cover'}));
      else if (f.kind === 'pending') body.append(el('div', {className: 'blank'}, idleCursor(f)));
      else if (f.kind === 'image') {
        const img = el('img', {src: f.src + '?v=' + f.rev, alt: f.name, draggable: false});
        img.addEventListener('load', () => { const h = Math.min(MAX_H, Math.round(f.w * img.naturalHeight / img.naturalWidth)); if (h && h !== heights[f.id]) { heights[f.id] = h; place(); } });
        body.append(img);
      } else {
        const iframe = el('iframe', {src: f.src + '?v=' + f.rev, title: f.name, loading: 'lazy'});
        iframe.addEventListener('load', () => { arm(iframe, f); frameLoaded(iframe, f); });
        body.append(iframe);
      }
      const shield = el('div', {className: 'shield'});
      const label = el('div', {className: 'frame-label'});
      const node = el('div', {className: 'frame'}, label, body, shield, el('div', {className: 'agent-tag'}));
      node.dataset.id = f.id; node.dataset.device = f.device; node.dataset.kind = f.kind;
      label.addEventListener('click', e => { e.stopPropagation(); select(f.id); });
      shield.addEventListener('dblclick', () => { select(f.id); if (f.kind === 'page') { live = f.id; render(); } });
      nodes[f.id] = node; world.append(node);
    }
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'links'; world.append(svg);
  if (compact) buildCompact();
  place();
}

function place() {
  const boxes = layout();
  for (const section of state.sections) {
    Object.assign(section.node.style, {left: section.box.x + 'px', top: section.box.y + 'px', width: section.box.w + 'px', height: section.box.h + 'px'});
    const choose = section.choose && !section.archived;
    section.node.replaceChildren(el('div', {className: 'section-title'}, el('b', {textContent: section.name}), choose ? pickChip(section) : '', section.status ? badge(section.status) : '', section.note && !choose ? el('small', {textContent: section.note}) : ''));
  }
  for (const f of frames()) {
    const node = nodes[f.id], box = boxes[f.id]; if (!node) continue;
    Object.assign(node.style, {left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px'});
    node.dataset.status = status[f.id] || ''; node.dataset.selected = selected === f.id; node.dataset.live = live === f.id;
    node.dataset.picked = f.section.choose && picks[f.section.id] === f.id;
    node.dataset.archived = !!f.section.archived;
    const mark = status[f.id] === 'approved' ? ' ✓' : status[f.id] === 'change' ? ' •' : '';
    node.firstChild.replaceChildren(el('b', {textContent: f.name + mark}), f.sketch ? chip('Sketch') : '', f.risk === 'bold' ? chip('Bold', 'bold') : '', document.createTextNode(f.kind === 'page' ? f.w + ' × ' + f.h : f.kind === 'pending' ? 'being drawn' : ''));
    node.querySelectorAll('.pin').forEach(p => p.remove());
    notes.forEach((n, i) => { if (n.frame === f.id && n.x != null) node.append(el('div', {className: 'pin', textContent: String(i + 1), style: 'left:' + n.x * 100 + '%;top:' + n.y * 100 + '%'})); });
  }
  drawLinks(boxes);
  if (!fitted && !compact && Object.keys(boxes).length) { fitted = true; fitDecision(); }
}

function drawLinks(boxes) {
  const svg = $('links'); if (!svg) return;
  svg.hidden = !showLinks; svg.replaceChildren();
  const ns = 'http://www.w3.org/2000/svg', mid = (f, b) => b.y + Math.min(b.h, f.h) / 2;
  let maxX = 0, maxY = 0;
  for (const f of frames()) for (const to of f.links || []) {
    const a = boxes[f.id], b = boxes[to], g = find(to); if (!a || !b || !g) continue;
    const sx = a.x + a.w, sy = mid(f, a), tx = b.x, ty = mid(g, b), bend = Math.max(80, Math.abs(tx - sx) / 2);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M' + sx + ' ' + sy + ' C' + (sx + bend) + ' ' + sy + ' ' + (tx - bend) + ' ' + ty + ' ' + tx + ' ' + ty);
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', tx); dot.setAttribute('cy', ty); dot.setAttribute('r', 6 / view.z);
    svg.append(path, dot); maxX = Math.max(maxX, sx, tx); maxY = Math.max(maxY, sy, ty);
  }
  svg.setAttribute('width', maxX + 400); svg.setAttribute('height', maxY + 400);
}

// Present: play the screens at real size, following their links like a Figma prototype.
const order = () => frames().filter(f => f.kind === 'page' && !f.section.system);
function flowFor(id) {
  const f = find(id), same = f && state.flows.find(x => find(x.start)?.section === f.section);
  return state.flows.find(x => x.start === id) || same || state.flows[0] || null;
}
function present(id) {
  const list = order(); if (!list.length) return;
  flow = flowFor(id);
  playing = list.some(f => f.id === id) ? id : flow ? flow.start : list[0].id;
  $('p-flow').replaceChildren(...state.flows.map(x => el('option', {value: x.start, textContent: x.name, selected: !!flow && x.start === flow.start})));
  $('p-flow').hidden = !state.flows.length;
  $('present').hidden = false; showPlaying(true);
}
$('p-flow').addEventListener('change', () => { flow = state.flows.find(x => x.start === $('p-flow').value); playing = flow.start; showPlaying(true); });
function showPlaying(load) {
  const list = order(), i = list.findIndex(f => f.id === playing), f = list[i]; if (!f) return;
  $('present').dataset.device = f.device;
  $('p-name').textContent = f.name; $('p-where').textContent = f.section.name + ' · ' + (i + 1) + ' of ' + list.length + ' · ' + f.w + ' × ' + f.h;
  const frame = $('p-frame'); frame.style.width = f.w + 'px'; frame.style.height = f.h + 'px';
  const r = $('p-stage').getBoundingClientRect(); frame.style.transform = 'scale(' + Math.min(1, (r.width - 48) / f.w, (r.height - 48) / f.h) + ')';
  if (load) frame.src = f.src + '?v=' + f.rev;
}
$('specs-toggle').addEventListener('click', () => { showSpecs = !showSpecs; $('specs-toggle').setAttribute('aria-pressed', showSpecs); eachDoc(applyView); render(); });
$('grid').addEventListener('click', () => { showGrid = !showGrid; $('grid').setAttribute('aria-pressed', showGrid); eachDoc(applyView); });
$('mode').addEventListener('click', () => { dark = !dark; $('mode').textContent = dark ? 'Dark' : 'Light'; eachDoc(applyView); });
function step(n) { const list = order(), i = list.findIndex(f => f.id === playing); playing = list[(i + n + list.length) % list.length].id; showPlaying(true); }
$('p-frame').addEventListener('load', () => {
  let path; try { path = decodeURIComponent($('p-frame').contentWindow.location.pathname).replace(/^\//, ''); } catch { return; }
  const hit = order().find(f => f.src === path); if (hit && hit.id !== playing) { playing = hit.id; showPlaying(false); }
  try { applyView($('p-frame').contentDocument); } catch {}
  try { $('p-frame').contentDocument.addEventListener('keydown', e => { if (e.target.closest('input, textarea, select, [contenteditable]')) return; if (e.key === 'Escape') closePresent(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); }); } catch {}
});
function closePresent() { $('present').hidden = true; $('p-frame').src = 'about:blank'; if (playing) { select(playing); focusFrame(playing); } playing = null; }
$('p-prev').addEventListener('click', () => step(-1)); $('p-next').addEventListener('click', () => step(1));
$('p-close').addEventListener('click', closePresent);
$('p-restart').addEventListener('click', () => { playing = flow ? flow.start : find(playing).section.frames[0].id; showPlaying(true); });
addEventListener('resize', () => { if (playing) showPlaying(false); });
$('play').addEventListener('click', () => present(selected));
$('flows').addEventListener('click', () => { showLinks = !showLinks; $('flows').setAttribute('aria-pressed', showLinks); place(); });

function select(id) {
  selected = id; const f = id && find(id);
  if (tool !== 'move' && f && f.kind === 'page' && location.protocol !== 'file:') { live = id; commenting = tool === 'comment'; inspecting = tool === 'inspect'; }
  else if (live !== id) { live = null; commenting = false; inspecting = false; }
  if (inspected && inspected.frame !== id) inspected = null; render();
}
function setTool(t) {
  tool = t; const f = selected && find(selected);
  if (t === 'move' || !f || f.kind !== 'page') { live = null; commenting = false; inspecting = false; }
  else { live = f.id; commenting = t === 'comment'; inspecting = t === 'inspect'; }
  render();
}
for (const t of ['move', 'comment', 'inspect']) $('tool-' + t).addEventListener('click', () => setTool(t));

// Guided review: one screen at a time, full size, plain questions; options flip with a picker like a prototype.
function reviewItems() {
  const items = [];
  for (const s of state.sections.filter(s => !s.system && !s.reference)) {
    const ready = s.frames.filter(f => f.kind === 'page');
    if (s.choose) { if (ready.length) items.push({section: s, frames: ready}); }
    else for (const f of ready) if (state.approvals[f.id] !== 'approved' || touched.has(f.id)) items.push({section: s, frames: [f]});
  }
  return items;
}
function startReview() { const items = reviewItems(); reviewing = {items, i: 0, option: 0, answers: {}}; $('review').hidden = false; showReview(true); }
// Leaving the review always lands on the whole project canvas, with what was just decided visible on it.
function closeReview() { $('review').hidden = true; $('r-frame').src = 'about:blank'; reviewing = null; selected = null; live = null; render(); fitAll(); }
function fitReview(f) {
  const frame = $('r-frame'); frame.style.width = f.w + 'px'; frame.style.height = f.h + 'px';
  const r = $('r-stage').getBoundingClientRect(); frame.style.transform = 'scale(' + Math.min(1, (r.width - 48) / f.w, (r.height - 96) / f.h) + ')';
  $('review').dataset.device = f.device;
}
function showReview(load) {
  const R = reviewing, panel = $('r-panel');
  if (!R.items.length || R.i >= R.items.length) {
    $('r-pill').hidden = true; $('r-frame').src = 'about:blank';
    const done = frames().filter(f => touched.has(f.id)).length + Object.values(picks).filter(Boolean).length;
    panel.replaceChildren(el('h2', {textContent: R.items.length ? 'That is every screen' : 'Nothing left to review'}),
      Object.assign(el('button', {type: 'button', className: 'btn', textContent: 'See the whole canvas'}), {onclick: closeReview}),
      el('p', {className: 'muted', textContent: done ? 'Send your answers to the agent, or go back to change any of them.' : 'Every screen is already approved.'}),
      el('span', {className: 'grow'}),
      el('div', {className: 'row'}, R.items.length ? Object.assign(el('button', {type: 'button', className: 'btn', textContent: 'Back'}), {onclick: () => { R.i = R.items.length - 1; showReview(true); }}) : '',
        Object.assign(el('button', {type: 'button', className: 'btn primary', textContent: 'Send to agent'}), {onclick: () => { closeReview(); $('send').click(); }})));
    return;
  }
  const item = R.items[R.i], s = item.section, f = item.frames[s.choose ? R.option : 0];
  fitReview(f); if (load) $('r-frame').src = f.src + '?v=' + f.rev;
  const pill = $('r-pill'); pill.hidden = !s.choose;
  if (s.choose) pill.replaceChildren(...item.frames.map((o, j) => { const b = el('button', {type: 'button', textContent: (j + 1) + '  ' + o.name}); b.toggleAttribute('data-active', j === R.option); b.onclick = () => { R.option = j; showReview(true); }; return b; }));
  const nav = el('div', {className: 'row'},
    Object.assign(el('button', {type: 'button', className: 'btn', textContent: '← Back', disabled: R.i === 0}), {onclick: () => { R.i--; R.option = 0; showReview(true); }}),
    el('span', {className: 'grow'}),
    Object.assign(el('button', {type: 'button', className: 'btn', textContent: 'Close'}), {onclick: closeReview}));
  const head = [el('p', {className: 'muted', textContent: s.name + ' · ' + (R.i + 1) + ' of ' + R.items.length}), el('h2', {textContent: s.choose ? 'Pick one' : f.name})];
  if (s.choose) {
    const isPick = picks[s.id] === f.id, isRiff = riffs.some(r => r.frame === f.id);
    panel.replaceChildren(...head,
      el('p', {className: 'muted', textContent: 'Flip with the numbers below or keys 1 to ' + item.frames.length + '. Each one is a different direction.'}),
      el('div', {className: 'q'}, el('div', {className: 'row', style: 'align-items:center'}, el('strong', {textContent: f.name}), f.risk ? (() => { const b = el('span', {className: 'risk', textContent: f.risk === 'bold' ? 'Bold' : 'Safe'}); b.dataset.risk = f.risk; return b; })() : ''),
        f.axis ? el('p', {className: 'muted', textContent: f.axis}) : '', f.wins ? el('p', {textContent: 'Right when: ' + f.wins}) : '', f.cost ? el('p', {className: 'muted', textContent: 'Costs: ' + f.cost}) : '', !f.axis && f.note ? el('p', {className: 'muted', textContent: f.note}) : ''),
      el('div', {className: 'row'},
        Object.assign(el('button', {type: 'button', className: 'btn' + (isPick ? ' primary' : ''), textContent: isPick ? 'Picked' : 'Pick this'}), {onclick: () => { picks[s.id] = f.id; for (let k = riffs.length - 1; k >= 0; k--) if (riffs[k].section === s.id) riffs.splice(k, 1); R.i++; R.option = 0; showReview(true); }}),
        Object.assign(el('button', {type: 'button', className: 'btn', textContent: isRiff ? 'Asked for more like this' : 'More like this'}), {onclick: () => { if (!isRiff) riffs.push({section: s.id, frame: f.id}); picks[s.id] = null; R.i++; R.option = 0; showReview(true); }})),
      el('span', {className: 'grow'}), nav);
    return;
  }
  const asks = f.ask.length ? f.ask : DEFAULT_ASK, answers = R.answers[f.id] = R.answers[f.id] || {};
  const questions = asks.map(q => {
    const a = answers[q] = answers[q] || {choice: '', text: ''};
    const choose = c => () => { a.choice = a.choice === c ? '' : c; showReview(false); };
    const box = el('textarea', {placeholder: 'What should change? (optional)', value: a.text}); box.style.minHeight = '40px'; box.oninput = () => { a.text = box.value; };
    return el('div', {className: 'q'}, el('span', {textContent: q}), el('div', {className: 'row'},
      Object.assign(el('button', {type: 'button', className: 'btn', textContent: 'Yes'}), {onclick: choose('Yes')}), Object.assign(el('button', {type: 'button', className: 'btn', textContent: 'No'}), {onclick: choose('No')})), a.choice ? box : '');
  });
  questions.forEach((q, k) => { const a = answers[asks[k]]; q.querySelectorAll('.row .btn').forEach(b => b.setAttribute('aria-pressed', b.textContent === a.choice)); });
  const commit = verdict => () => {
    for (const q of asks) { const a = answers[q]; if (!a.choice && !a.text) continue; const k = notes.findIndex(n => n.frame === f.id && n.target === 'Q: ' + q); const note = {frame: f.id, selector: '', target: 'Q: ' + q, text: [a.choice, a.text].filter(Boolean).join(' · ')}; if (k >= 0) notes[k] = note; else notes.push(note); }
    status[f.id] = verdict; touched.add(f.id); R.i++; showReview(true);
  };
  panel.replaceChildren(...head, f.note ? el('p', {className: 'muted', textContent: f.note}) : '', ...questions,
    el('div', {className: 'row'}, Object.assign(el('button', {type: 'button', className: 'btn primary', textContent: 'Approve'}), {onclick: commit('approved')}), Object.assign(el('button', {type: 'button', className: 'btn', textContent: 'Needs changes'}), {onclick: commit('change')}),
      Object.assign(el('button', {type: 'button', className: 'btn', textContent: 'Skip'}), {onclick: () => { R.i++; showReview(true); }})),
    el('span', {className: 'grow'}), nav);
}
$('start-review').addEventListener('click', startReview);
addEventListener('resize', () => { if (reviewing && reviewing.i < reviewing.items.length) { const it = reviewing.items[reviewing.i]; fitReview(it.frames[it.section.choose ? reviewing.option : 0]); } });

function chip(text, tone) { const c = el('i', {className: 'chip', textContent: text}); if (tone) c.dataset.tone = tone; return c; }
function badge(s) { const b = el('span', {className: 'badge', textContent: state.statuses[s] || s}); b.dataset.status = s; return b; }
function renderCover() {
  const box = document.querySelector('.frame[data-id="cover"] .cover'); if (!box) return;
  const design = state.sections.filter(s => !s.system && !s.reference), all = design.flatMap(s => s.frames.filter(f => f.kind === 'page'));
  const approved = all.filter(f => status[f.id] === 'approved').length;
  const updated = Math.max(0, ...frames().map(f => f.rev || 0));
  box.replaceChildren(
    el('p', {className: 'meta', textContent: [state.stage && state.stage[0].toUpperCase() + state.stage.slice(1), state.owner, updated ? 'Updated ' + new Date(updated).toLocaleDateString() : ''].filter(Boolean).join(' · ')}),
    el('h1', {textContent: state.title}),
    state.description ? el('p', {textContent: state.description}) : '',
    el('p', {className: 'meta', textContent: all.length + ' screens in ' + design.length + ' sections · ' + approved + ' approved' + (state.library ? ' · Design system: ' + state.library : '')}),
    el('div', {className: 'cover-grid'}, ...design.map(s => {
      const n = s.frames.filter(f => status[f.id] === 'approved').length;
      return el('div', {className: 'cover-row'}, el('b', {textContent: s.name}), s.status ? badge(s.status) : '', el('span', {textContent: s.choose ? 'Options' : n + ' of ' + s.frames.length + ' approved'}));
    })),
    state.log.length ? el('h2', {textContent: 'Recent changes'}) : '',
    state.log.length ? el('ul', {}, ...state.log.slice(0, 5).map(l => el('li', {textContent: String(l.at).slice(0, 10) + ' · ' + l.text}))) : '');
}

function render() {
  $('title').textContent = state.title; document.title = state.title + ' · Seenry canvas';
  for (const t of ['move', 'comment', 'inspect']) $('tool-' + t).setAttribute('aria-pressed', tool === t);
  $('viewport').dataset.tool = tool;
  $('count').textContent = String(frames().filter(f => f.kind === 'page' && !f.section.system && !f.section.reference && !f.section.archived).length);
  $('error').hidden = !state.error; $('error').textContent = state.error || '';
  $('agent').hidden = !state.agentWaiting;
  const outline = $('outline'); outline.replaceChildren();
  if (!state.sections.length) outline.append(el('p', {textContent: 'No screens yet. The agent adds .html files to this folder.', style: 'margin:12px 8px;color:var(--ink-2)'}));
  for (const section of placed()) {
    const head = el('h2', {}, document.createTextNode(section.name), section.choose && !section.archived ? pickChip(section) : '', section.status ? badge(section.status) : '');
    head.dataset.dim = !!(section.archived || section.library); outline.append(head);
    for (const f of section.frames) {
      const dot = el('span', {className: 'dot'}); dot.dataset.status = status[f.id] || '';
      const count = notes.filter(n => n.frame === f.id).length;
      const button = el('button', {type: 'button'}, dot, el('span', {className: 'name', textContent: f.name}), section.choose && picks[section.id] === f.id ? el('span', {className: 'meta', textContent: 'Picked'}) : '', count ? el('span', {className: 'meta', textContent: count + ' note' + (count === 1 ? '' : 's')}) : el('span', {className: 'meta', textContent: f.kind === 'pending' ? 'drawing' : f.sketch ? 'sketch' : f.device === 'desktop' || f.device === 'image' ? '' : f.device}));
      button.dataset.kind = f.kind;
      button.setAttribute('aria-current', selected === f.id);
      button.addEventListener('click', () => { select(f.id); focusFrame(f.id); });
      outline.append(button);
    }
  }
  const inspector = $('inspector'), f = selected && find(selected);
  if (!f) {
    const open = state.sections.filter(s => s.choose && !s.study && !s.archived && s.frames.some(x => x.kind === 'page'));
    inspector.replaceChildren(el('h3', {textContent: open.length ? 'Your decision' : 'Review'}),
      el('p', {textContent: state.question || (open.length ? 'Pick one option in each set. The rest of the work waits on it.' : 'Approve screens, pin comments, then send.')}),
      ...open.map(s => el('div', {className: 'decision'}, el('p', {className: 'eyebrow', textContent: s.name}), ...s.frames.filter(x => x.kind === 'page').map(o => {
        const b = el('button', {type: 'button', className: 'choice'}, el('b', {textContent: o.name}), el('em', {textContent: picks[s.id] === o.id ? 'Picked' : 'Pick'}), o.axis || o.note ? el('span', {textContent: o.axis || o.note}) : '');
        b.setAttribute('aria-pressed', picks[s.id] === o.id);
        b.addEventListener('click', () => { picks[s.id] = picks[s.id] === o.id ? null : o.id; render(); });
        b.addEventListener('mouseenter', () => { nodes[o.id]?.setAttribute('data-selected', 'true'); });
        b.addEventListener('mouseleave', () => { nodes[o.id]?.setAttribute('data-selected', 'false'); });
        return b;
      }))),
      el('div', {className: 'row'}, Object.assign(el('button', {type: 'button', className: 'btn', textContent: 'Review one at a time'}), {onclick: startReview})),
      state.timing && state.timing.firstOption ? el('p', {className: 'eyebrow', textContent: 'First option ' + since(state.timing.started, state.timing.firstOption) + ' after start'}) : '');
  } else if (f.kind === 'pending') {
    inspector.replaceChildren(el('h3', {textContent: f.name}), el('p', {textContent: 'The agent is drawing this screen. It appears here the moment its file is written.'}));
  } else {
    const toggle = (text, on, fn) => { const b = el('button', {type: 'button', className: 'btn', textContent: text}); b.setAttribute('aria-pressed', on); b.addEventListener('click', fn); return b; };
    const set = value => () => { status[f.id] = status[f.id] === value ? '' : value; touched.add(f.id); render(); };
    const actions = el('div', {className: 'row'});
    if (!f.section.reference && !f.section.system) {
      if (f.section.choose) actions.append(toggle(picks[f.section.id] === f.id ? 'Picked' : 'Pick this', picks[f.section.id] === f.id, () => { picks[f.section.id] = picks[f.section.id] === f.id ? null : f.id; render(); }));
      actions.append(toggle('Approve', status[f.id] === 'approved', set('approved')), toggle('Needs changes', status[f.id] === 'change', set('change')));
    }
    const tools = el('div', {className: 'row'});
    const whole = el('button', {type: 'button', className: 'btn', textContent: 'Add note'});
    whole.addEventListener('click', () => ask({frame: f.id, selector: '', target: 'whole screen'}));
    tools.append(whole);
    if (f.kind === 'page' && location.protocol !== 'file:') tools.append(toggle(commenting && live === f.id ? 'Click an element…' : 'Pin a comment', commenting && live === f.id, () => setTool(commenting && live === f.id ? 'move' : 'comment')));
    if (f.kind === 'page' && location.protocol !== 'file:') tools.append(toggle(inspecting && live === f.id ? 'Click an element…' : 'Inspect', inspecting && live === f.id, () => setTool(inspecting && live === f.id ? 'move' : 'inspect')));
    if (f.kind === 'page') { const play = el('button', {type: 'button', className: 'btn', textContent: '▶ Present'}); play.addEventListener('click', () => present(f.id)); tools.append(play); }
    if (f.kind === 'page') tools.append(toggle('Use it', live === f.id && !commenting, () => { live = live === f.id && !commenting ? null : f.id; commenting = false; render(); }));
    tools.append(el('a', {className: 'btn', href: f.src, target: '_blank', rel: 'noopener', textContent: 'Open'}));
    const list = el('div', {className: 'notes'});
    notes.forEach((n, i) => { if (n.frame !== f.id) return; const x = el('button', {type: 'button', textContent: '✕'}); x.setAttribute('aria-label', 'Remove comment'); x.addEventListener('click', () => { notes.splice(i, 1); render(); }); list.append(el('div', {className: 'note'}, el('b', {textContent: String(i + 1)}), el('span', {textContent: n.target + ': ' + n.text}), x)); });
    let specs = '';
    if (inspected && inspected.frame === f.id) {
      const raw = inspected.rows.filter(r => r.raw).length;
      specs = el('div', {className: 'notes'}, el('p', {textContent: inspected.name + (inspected.text ? ' · “' + inspected.text + '”' : '')}),
        el('dl', {className: 'specs'}, ...inspected.rows.flatMap(r => [el('dt', {textContent: r.label}), el('dd', {}, el('code', {textContent: r.value}), r.token ? el('code', {className: 'tok', textContent: '  ' + r.token}) : r.raw ? el('code', {className: 'raw', textContent: '  not a variable'}) : '')])),
        el('p', {className: raw ? '' : '', style: 'color:' + (raw ? 'var(--warn)' : 'var(--ok)'), textContent: raw ? raw + ' value' + (raw === 1 ? '' : 's') + ' not from tokens.css' : 'Every value comes from tokens.css'}));
    }
    let handoffSpecs = '';
    try {
      const doc = nodes[f.id]?.querySelector('iframe')?.contentDocument, items = doc ? [...doc.querySelectorAll('[data-spec]')] : [];
      if (items.length) handoffSpecs = el('div', {className: 'notes'}, el('p', {style: 'font-weight:600', textContent: 'Specs for developers'}), ...items.map((n, i) => el('div', {className: 'note'}, el('b', {style: 'color:#7c3aed', textContent: String(i + 1)}), el('span', {textContent: ((n.innerText || n.getAttribute('aria-label') || n.tagName.toLowerCase()).trim().replace(/\s+/g, ' ').slice(0, 40)) + ': ' + n.getAttribute('data-spec')}))));
    } catch {}
    const label = f.section.choose && (f.axis || f.wins || f.cost || f.risk) ? el('div', {className: 'notes'}, el('p', {}, el('strong', {textContent: f.risk === 'bold' ? 'Bold · ' : f.risk === 'safe' ? 'Safe · ' : ''}), document.createTextNode(f.axis || '')), f.wins ? el('p', {textContent: 'Right when: ' + f.wins}) : '', f.cost ? el('p', {textContent: 'Costs: ' + f.cost}) : '') : '';
    inspector.replaceChildren(el('h3', {textContent: f.name}), f.note ? el('p', {textContent: f.note}) : '', label, actions, tools, specs, handoffSpecs, list);
  }
  renderCover(); updateCompact(); renderLive();
  $('hint').hidden = !live && tool === 'move';
  $('hint').textContent = inspecting ? 'Click any element to inspect its values and variables. Esc to stop.' : commenting ? 'Click the element to comment on. Esc to stop.' : live ? 'Using this screen. Click outside it or press Esc to go back to the canvas.' : tool === 'comment' ? 'Click a screen to comment on it. Esc to stop.' : 'Click a screen to inspect it. Esc to stop.';
  place();
}

const ago = at => { const s = Math.max(0, (Date.now() - Date.parse(at)) / 1000); return s < 45 ? 'now' : s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd'; };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const EYES = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="seen-tile" width="64" height="64" rx="18"/><g class="seen-look"><rect class="seen-eye" x="18.5" y="22" width="10" height="20" rx="5"/><rect class="seen-eye" x="35.5" y="22" width="10" height="20" rx="5"/></g></svg>';
const markNode = cls => { const m = el('span', {className: 'sx-mark' + (cls ? ' ' + cls : '')}); m.innerHTML = EYES; return m; };
function agentNow() {
  const list = state.activity || [], last = list.at(-1), fresh = e => Date.now() - Date.parse(e.at) < 60000;
  const on = [...list].reverse().find(e => e.frame && find(e.frame) && fresh(e));
  return {last, active: !!last && Date.now() - Date.parse(last.at) < 90000, frame: on ? on.frame : null, text: on ? on.text : ''};
}
function blink(node) { if (!node || REDUCED.matches) return; node.classList.remove('is-blink'); void node.getBoundingClientRect(); node.classList.add('is-blink'); setTimeout(() => node.classList.remove('is-blink'), 220); }
(function idleBlink() { setTimeout(() => { if (!document.hidden) blink($('mark')); idleBlink(); }, 4000 + Math.random() * 5000); })();
// The mark in the header looks toward the screen Seenry is working on.
function gaze() {
  const a = state ? agentNow() : {}, target = a.frame && (compact ? cards[a.frame] && cards[a.frame].card : nodes[a.frame]), look = $('mark').querySelector('.seen-look');
  if (!target || REDUCED.matches) { look.style.transform = ''; return; }
  const m = $('mark').getBoundingClientRect(), r = target.getBoundingClientRect(), dx = r.left + r.width / 2 - (m.left + m.width / 2), dy = r.top + Math.min(r.height, 300) / 2 - (m.top + m.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 420) * 3.2;
  look.style.transform = 'translate(' + (dx / d * k).toFixed(2) + 'px,' + (dy / d * k).toFixed(2) + 'px)';
}
function feed(root) {
  const a = agentNow(), items = (state.activity || []).slice(-10).reverse();
  root.dataset.active = a.active;
  root.replaceChildren(el('div', {className: 'live-head'}, el('span', {className: 'live-dot'}), el('b', {textContent: 'Seenry, live'}), el('span', {className: 'meta', textContent: a.active ? 'working now' : items.length ? 'last step ' + ago(items[0].at) + (ago(items[0].at) === 'now' ? '' : ' ago') : ''})),
    ...(items.length ? items.map(e => { const b = el('button', {type: 'button', className: 'live-item', disabled: !(e.frame && find(e.frame))}, el('span', {className: 'meta', textContent: ago(e.at)}), el('span', {textContent: e.text})); b.onclick = () => show(e.frame); return b; })
      : [el('p', {className: 'live-empty', textContent: 'What Seenry draws, checks and fixes shows here as it happens.'})]));
}
function renderLive() {
  if (!state) return;
  const a = agentNow(), name = a.frame && find(a.frame) ? find(a.frame).name : '';
  $('presence-text').textContent = (state.agentWaiting ? 'Seenry is waiting for you' : a.active ? (name ? 'Seenry is working on ' + name : 'Seenry is working') : a.last ? 'Seenry · last step ' + ago(a.last.at) + (ago(a.last.at) === 'now' ? '' : ' ago') : 'Seenry is ready') + (following ? ' · following' : '');
  $('agent-presence').dataset.active = a.active || !!state.agentWaiting; $('agent-presence').setAttribute('aria-pressed', following);
  feed($('live')); feed($('c-feed'));
  $('c-live').dataset.active = a.active;
  $('c-live-text').textContent = a.last ? (a.active ? '' : ago(a.last.at) + ' · ') + a.last.text : 'What Seenry draws, checks and fixes shows here as it happens.';
  for (const [id, node] of Object.entries(nodes)) { const on = a.frame === id, tag = node.querySelector('.agent-tag'); node.dataset.agent = on; if (on) { tag.innerHTML = EYES; tag.append(document.createTextNode('Seenry · ' + a.text)); } else tag.replaceChildren(); }
  for (const [id, c] of Object.entries(cards)) c.card.dataset.agent = a.frame === id;
  if (a.last && a.last.at !== lastAt) { const fresh = lastAt !== ''; lastAt = a.last.at; if (fresh) blink($('mark')); if (following && fresh && a.frame) show(a.frame, true); }
  gaze();
}
function show(id, follow) { if (!id || !find(id)) return; if (follow && !compact) { if (!replaying.has(id)) focusFrame(id); return; } if (compact) { const c = cards[id]; if (c) c.card.scrollIntoView({block: 'center', behavior: REDUCED.matches ? 'auto' : 'smooth'}); } else { select(id); focusFrame(id); } }
$('agent-presence').addEventListener('click', () => { following = !following; if (following) show(agentNow().frame); renderLive(); });
setInterval(renderLive, 15000);

// Seenry's cursor. A screen is written to disk whole, so when one lands or changes the canvas compares it with what was
// there and plays the change back: the eyes travel to each new or changed component in reading order, it lands, and its
// text types in. With reduced motion the changed parts are outlined instead.
const SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'TEMPLATE', 'NOSCRIPT', 'BR', 'HEAD', 'SOURCE', 'TRACK']);
const snaps = new WeakMap(), born = new Set(), parked = new Map(), replaying = new Set();
// Follow keeps the component being built in view: the frame's width fits the canvas and the view glides to the cursor.
let glideFrame = 0;
function glide(tx, ty, tz) {
  cancelAnimationFrame(glideFrame);
  const from = {x: view.x, y: view.y, z: view.z}, t0 = performance.now(), d = REDUCED.matches ? 0 : 560;
  const tick = now => { const p = d ? Math.min(1, (now - t0) / d) : 1, e = 1 - Math.pow(1 - p, 3); view.x = from.x + (tx - from.x) * e; view.y = from.y + (ty - from.y) * e; view.z = from.z + (tz - from.z) * e; apply(); if (p < 1) glideFrame = requestAnimationFrame(tick); else place(); };
  glideFrame = requestAnimationFrame(tick);
}
function followUnit(fr, f, r) {
  if (!following || compact || !fr.closest('#world')) return;
  const vp = $('viewport').getBoundingClientRect(), z = Math.min(1, (vp.width - 120) / f.w), box = layout()[f.id];
  if (!box) return;
  const sy = vp.height * 0.4 - (box.y + r.top + r.height / 2) * z, sx = vp.width / 2 - (box.x + box.w / 2) * z;
  if (Math.abs(sx - view.x) < 24 && Math.abs(sy - view.y) < 24 && Math.abs(z - view.z) < 0.01) return;
  glide(sx, sy, z);
}
const ownText = n => { let t = ''; for (const c of n.childNodes) if (c.nodeType === 3) t += c.nodeValue; return t.trim().replace(/\s+/g, ' '); };
const sigOf = n => n.tagName + '|' + (n.getAttribute('class') || '') + '|' + ownText(n).slice(0, 240) + '|' + (n.getAttribute('src') || n.getAttribute('href') || '') + '|' + (n.getAttribute('style') || '');
function unitsOf(doc) {
  const win = doc.defaultView, out = [];
  for (const n of doc.body.querySelectorAll('*')) {
    if (SKIP.has(n.tagName) || (n.id || '').startsWith('seenry-') || n.closest('[id^="seenry-"]')) continue;
    const svg = n.closest('svg'); if (svg && svg !== n) continue;
    if (n.parentElement && n.parentElement.closest('button, select, picture, a[class*="btn"], a[class*="button"]')) continue;
    const r = n.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const c = win.getComputedStyle(n); if (c.visibility === 'hidden' || c.display === 'contents') continue;
    const media = /^(IMG|svg|SVG|VIDEO|CANVAS|INPUT|BUTTON|TEXTAREA|SELECT|PICTURE|IFRAME)$/.test(n.tagName);
    const boxed = (c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent') || c.backgroundImage !== 'none' || (parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none') || c.boxShadow !== 'none';
    if (media || ownText(n) || boxed) out.push(n);
  }
  if (out.length > 90) { const area = n => { const r = n.getBoundingClientRect(); return r.width * r.height; }; const keep = new Set(out.filter(n => ownText(n)).slice(0, 70)); for (const n of out.slice().sort((a, b) => area(b) - area(a))) { if (keep.size >= 90) break; keep.add(n); } return out.filter(n => keep.has(n)); }
  return out;
}
function frameLoaded(fr, f, reveal = () => {}) {
  let doc; try { doc = fr.contentDocument; } catch (e) { reveal(); return; }
  if (!doc || !doc.body) { reveal(); return; }
  const go = () => {
    // Parts are matched by what they are, not where they sit, so a part inserted above others leaves those alone.
    const prev = snaps.get(fr), all = unitsOf(doc), next = new Map();
    for (const n of all) { const k = sigOf(n); next.set(k, (next.get(k) || 0) + 1); }
    snaps.set(fr, next);
    if (!(compact ? fr.closest('#c-list') : fr.closest('#world'))) { reveal(); return; }
    let list = null;
    if (prev) { const left = new Map(prev), changed = all.filter(n => { const k = sigOf(n), c = left.get(k) || 0; if (c) { left.set(k, c - 1); return false; } return true; }); if (changed.length) list = changed; }
    else if (born.has(f.id)) list = all;
    born.delete(f.id);
    if (list && list.length) replay(fr, f, list, !prev);
    reveal();
  };
  (doc.fonts ? doc.fonts.ready : Promise.resolve()).then(() => setTimeout(go, 80));
}
function swap(fr, f) {
  if (!fr) return;
  const src = f.src + '?v=' + f.rev;
  if (fr.tagName !== 'IFRAME') { fr.src = src; return; }
  for (const x of fr.parentElement.querySelectorAll('iframe[data-next]')) x.remove();
  const next = fr.cloneNode(false);
  next.removeAttribute('loading'); next.dataset.next = ''; next.src = src;
  Object.assign(next.style, {position: 'absolute', top: '0', visibility: 'hidden'});
  if (!fr.style.left) next.style.left = '0';
  next.addEventListener('load', () => {
    if (!next.isConnected) return;
    snaps.set(next, snaps.get(fr));
    try { applyView(next.contentDocument); } catch (e) {}
    if (next.closest('#world')) arm(next, f);
    frameLoaded(next, f, () => { next.style.visibility = ''; delete next.dataset.next; fr.remove(); });
  });
  fr.after(next);
}
function idleCursor(f) {
  const c = el('div', {className: 'idle'}); c.innerHTML = EYES;
  c.append(el('span', {textContent: 'Seenry · starting ' + f.name}));
  return c;
}
function replay(fr, f, units, fresh) {
  const doc = fr.contentDocument, win = doc.defaultView, token = {};
  doc.__seenry = token;
  const recent = (state.activity || []).filter(e => e.frame === f.id && Date.now() - Date.parse(e.at) < 60000 && e.kind !== 'edit').at(-1);
  const base = recent ? recent.text : (fresh ? 'Building ' : 'Changing ') + f.name;
  const partOf = n => { const p = n.closest('[data-seenry-part]'); return p ? p.getAttribute('data-seenry-part') : ''; };
  const label = 'Seenry · ' + (partOf(units[0]) || base);
  replaying.add(f.id);
  const m = (fr.style.transform || '').match(/scale\(([\d.]+)\)/), k = fr.closest('#world') ? view.z : m ? Number(m[1]) : 1, inv = Math.min(8, 1 / Math.max(0.05, k));
  doc.getElementById('seenry-cursor')?.remove(); doc.getElementById('seenry-replay')?.remove();
  const css = doc.createElement('style'); css.id = 'seenry-replay';
  css.textContent = '[data-seenry-wait]{opacity:0!important}[data-seenry-in]{animation:seenry-in 280ms cubic-bezier(.23,1,.32,1) both}@keyframes seenry-in{from{opacity:0;translate:0 8px}to{opacity:1;translate:0 0}}[data-seenry-typing]::after{content:"";display:inline-block;width:.08em;min-width:2px;height:1em;margin-left:2px;vertical-align:-.12em;background:currentColor;animation:seenry-caret .9s steps(1) infinite}@keyframes seenry-caret{50%{opacity:0}}[data-seenry-mark]{outline:2px solid #171717!important;outline-offset:4px!important;border-radius:4px}#seenry-cursor{position:absolute;left:0;top:0;z-index:2147483647;pointer-events:none;transform-origin:0 0;transition:transform 420ms cubic-bezier(.23,1,.32,1),opacity 300ms;display:flex;align-items:center;gap:7px;font:600 13px/1 "Open Runde",ui-rounded,system-ui,sans-serif}#seenry-cursor svg{width:26px;height:26px;flex:none;filter:drop-shadow(0 2px 6px rgb(0 0 0 / .25))}#seenry-cursor .t{fill:#171717;stroke:#fff;stroke-width:5;paint-order:stroke}#seenry-cursor.flip{flex-direction:row-reverse}#seenry-cursor .e{fill:#fff;transform-box:fill-box;transform-origin:center}#seenry-cursor g{transition:transform 260ms cubic-bezier(.23,1,.32,1)}#seenry-cursor.blink .e{animation:seenry-blink 180ms}@keyframes seenry-blink{50%{transform:scaleY(.12)}}#seenry-cursor.quiet span{opacity:0}#seenry-cursor span{transition:opacity .3s;background:#171717;color:#fff;padding:7px 11px;border-radius:999px;white-space:nowrap;max-width:320px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 0 0 1px rgb(255 255 255 / .12),0 8px 24px rgb(0 0 0 / .18)}';
  doc.head.append(css);
  const cur = doc.createElement('div'); cur.id = 'seenry-cursor'; cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<svg viewBox="0 0 64 64"><rect class="t" width="64" height="64" rx="18"/><g><rect class="e" x="18.5" y="22" width="10" height="20" rx="5"/><rect class="e" x="35.5" y="22" width="10" height="20" rx="5"/></g></svg><span></span>';
  cur.lastChild.textContent = label; doc.body.append(cur);
  let [x, y] = parked.get(f.id) || [24, 24];
  // The cursor sits on the element's top edge, eyes at its corner, so the label never covers what is being written; near the right edge the label flips to the left of the eyes.
  const at = (nx, ny, d) => {
    const dx = nx - x, dy = ny - y, len = Math.hypot(dx, dy) || 1, w = cur.offsetWidth * inv, flip = nx + w > win.innerWidth - 8;
    cur.classList.toggle('flip', flip);
    cur.firstChild.lastChild.style.transform = 'translate(' + (dx / len * 3.5).toFixed(1) + 'px,' + (dy / len * 3.5).toFixed(1) + 'px)';
    cur.style.transitionDuration = d + 'ms, 300ms'; x = nx; y = ny;
    cur.style.transform = 'translate(' + Math.max(4, flip ? x - w + 26 * inv : x) + 'px,' + y + 'px) scale(' + inv + ')';
  };
  // The eyes sit in the margin left of the line being written; with no margin, on the part's top edge.
  const pos = n => { const r = n.getBoundingClientRect(), side = r.left - 34 * inv; return side >= 4 ? [side + win.scrollX, r.top + win.scrollY + Math.min(r.height / 2, 14) - 13 * inv] : [r.left + win.scrollX, Math.max(4, r.top + win.scrollY - 32 * inv)]; };
  let shown = '', quiet = 0;
  const say = text => { cur.lastChild.textContent = text; if (text === shown) return; shown = text; cur.classList.remove('quiet'); clearTimeout(quiet); quiet = setTimeout(() => cur.classList.add('quiet'), 1500); };
  const follow = n => { const r = n.getBoundingClientRect(); if (r.top < 0 || r.bottom > win.innerHeight) win.scrollTo({top: Math.max(0, r.top + win.scrollY - win.innerHeight * 0.3), behavior: REDUCED.matches ? 'auto' : 'smooth'}); };
  at(x, y, 0);
  const done = () => setTimeout(() => {
    if (doc.__seenry !== token) return;
    replaying.delete(f.id);
    cur.style.opacity = '0';
    if (win.scrollY && fr.closest('#c-list')) win.scrollTo({top: 0, behavior: REDUCED.matches ? 'auto' : 'smooth'});
    setTimeout(() => { if (doc.__seenry !== token) return; cur.remove(); css.remove(); for (const n of doc.querySelectorAll('[data-seenry-in],[data-seenry-mark],[data-seenry-wait]')) { n.removeAttribute('data-seenry-in'); n.removeAttribute('data-seenry-mark'); n.removeAttribute('data-seenry-wait'); } }, 420);
  }, REDUCED.matches ? 2400 : 6000);
  if (REDUCED.matches) { units.forEach(n => n.setAttribute('data-seenry-mark', '')); follow(units[0]); at(...pos(units[0]), 0); done(); return; }
  units.forEach(n => n.setAttribute('data-seenry-wait', ''));
  const step = Math.max(70, Math.min(360, 5200 / units.length)), travel = Math.min(420, Math.max(120, step * 0.7));
  let i = 0;
  const type = n => {
    const kids = [...n.childNodes], text = n.textContent, c = win.getComputedStyle(n);
    if (kids.some(k => k.nodeType === 1) || !text.trim() || text.length > 420 || /^inline$/.test(c.display)) return 0;
    const ms = units.length > 40 ? step * 0.8 : Math.min(1100, Math.max(160, text.length * 16)), r = n.getBoundingClientRect(), keepH = n.style.minHeight;
    n.style.minHeight = r.height + 'px'; n.textContent = ''; n.setAttribute('data-seenry-typing', '');
    const t0 = performance.now();
    const tick = now => { if (doc.__seenry !== token) { n.textContent = text; return; } const p = Math.min(1, (now - t0) / ms); n.textContent = text.slice(0, Math.ceil(text.length * p)); if (p < 1) win.requestAnimationFrame(tick); else { n.removeAttribute('data-seenry-typing'); n.style.minHeight = keepH; } };
    win.requestAnimationFrame(tick);
    return ms;
  };
  const next = () => {
    if (doc.__seenry !== token) return;
    if (i >= units.length) return done();
    const n = units[i++], part = partOf(n);
    say('Seenry · ' + (part || base));
    follow(n); at(...pos(n), travel); parked.set(f.id, [x, y]); followUnit(fr, f, n.getBoundingClientRect());
    if (i % 7 === 1) { cur.classList.remove('blink'); void cur.offsetWidth; cur.classList.add('blink'); }
    setTimeout(() => {
      if (doc.__seenry !== token) return;
      n.removeAttribute('data-seenry-wait'); n.setAttribute('data-seenry-in', '');
      const typed = type(n);
      setTimeout(next, Math.max(step, typed + 60));
    }, travel * 0.8);
  };
  setTimeout(next, 200);
}

// The board is the default: what needs the person, pinned up at a readable size. The Map is the whole file on one canvas.
const prefView = () => { try { return localStorage.getItem('seenry-canvas-view'); } catch (e) { return null; } };
const wantsCompact = () => { const v = new URLSearchParams(location.search).get('view'); if (v === 'canvas' || v === 'map') return false; if (v === 'board' || v === 'compact') return true; return matchMedia('(max-width: 820px)').matches || (!forceCanvas && prefView() === 'board'); };
function setCompact(on) {
  compact = on; document.body.dataset.compact = on;
  $(on ? 'c-rail' : 'panel').append($('composer'));
  $('view-board').setAttribute('aria-selected', on); $('view-map').setAttribute('aria-selected', !on);
  if (on) buildCompact(); else { fitted = false; place(); }
  render();
}
const choose = map => { forceCanvas = map; try { localStorage.setItem('seenry-canvas-view', map ? 'map' : 'board'); } catch (e) {} setCompact(!map); };
$('view-board').addEventListener('click', () => choose(false));
$('view-map').addEventListener('click', () => choose(true));
matchMedia('(max-width: 820px)').addEventListener('change', () => setCompact(wantsCompact()));
function intro(open, sections) {
  const pending = frames().filter(f => f.kind === 'pending' && !f.section.system).length, wait = pending ? ' Seenry is still drawing ' + pending + (pending === 1 ? ' screen.' : ' screens.') : '';
  if (!sections.length) return el('header', {className: 'b-intro b-empty'}, markNode(), el('h2', {textContent: 'Seenry hasn’t drawn anything yet'}), el('p', {textContent: 'Screens appear here the moment they are written, and you can watch each one come together.'}));
  if (open.length === 1) { const n = open[0].frames.filter(f => f.kind === 'page').length; return el('header', {className: 'b-intro'}, el('h2', {textContent: state.question || 'Choose a direction for ' + open[0].name}), el('p', {textContent: 'Seenry drew ' + n + ' directions. Choose one, or ask for more like the one closest to what you want.' + wait})); }
  if (open.length) return el('header', {className: 'b-intro'}, el('h2', {textContent: state.question || open.length + ' choices are waiting for you'}), el('p', {textContent: 'Choose one option in each set. Everything else waits on these.' + wait}));
  const drawing = sections.find(s => s.choose && !s.study && !picks[s.id] && s.frames.some(f => f.kind === 'pending'));
  if (drawing) return el('header', {className: 'b-intro'}, el('h2', {textContent: 'Seenry is drawing directions for ' + drawing.name}), el('p', {textContent: 'Each one appears here as it lands, built up component by component. Watch it, or come back when they are ready.'}));
  return el('header', {className: 'b-intro'}, el('h2', {textContent: state.question || 'Review the screens'}), el('p', {textContent: 'Approve what is ready and leave a note on what is not. Send it to Seenry when you are done.' + wait}));
}
function card(f, s, big) {
  const thumb = el('div', {className: 'c-thumb'}, el('span', {className: 'c-chosen', textContent: '✓ Chosen'}));
  thumb.dataset.w = f.w; thumb.dataset.h = f.h;
  if (f.kind === 'page') {
    const fr = el('iframe', {src: f.src + '?v=' + f.rev, title: f.name, loading: 'lazy', tabIndex: -1});
    Object.assign(fr.style, {width: f.w + 'px', height: f.h + 'px'});
    fr.addEventListener('load', () => { try { applyView(fr.contentDocument); } catch (e) {} frameLoaded(fr, f); });
    thumb.append(fr); thumb.addEventListener('click', () => present(f.id)); thumb.title = 'Open ' + f.name + ' full size';
    thumb.tabIndex = 0; thumb.setAttribute('role', 'button'); thumb.setAttribute('aria-label', 'Open ' + f.name + ' full size');
    thumb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); present(f.id); } });
  } else thumb.append(el('div', {className: 'blank'}, idleCursor(f)));
  const actions = el('div', {className: 'row'});
  const why = big && (f.wins || f.cost) ? el('dl', {className: 'c-why'}, ...(f.wins ? [el('dt', {textContent: 'Right when'}), el('dd', {textContent: f.wins})] : []), ...(f.cost ? [el('dt', {textContent: 'Costs'}), el('dd', {textContent: f.cost})] : [])) : '';
  const node = el('article', {className: 'c-card'}, thumb, el('div', {className: 'c-body'},
    el('div', {className: 'c-title'}, el('b', {textContent: f.name}), f.sketch ? chip('Sketch') : '', f.risk === 'bold' ? chip('Bold', 'bold') : ''),
    f.kind === 'page' && (f.axis || f.note) ? el('p', {textContent: f.axis || f.note}) : '', why, actions));
  node.dataset.kind = f.kind;
  cards[f.id] = {card: node, actions, f, s};
  return node;
}
function buildCompact() {
  const root = $('c-list'); root.replaceChildren();
  for (const k in cards) delete cards[k]; for (const k in heads) delete heads[k];
  const sections = placed().filter(s => !s.system && !s.reference && !s.archived), open = sections.filter(isOpen);
  root.append(intro(open, sections));
  const decisions = sections.filter(s => s.choose && !s.study), rest = sections.filter(s => !decisions.includes(s));
  for (const s of decisions) {
    const row = el('div', {className: 'b-row'}); row.style.setProperty('--n', Math.min(3, Math.max(1, s.frames.length)));
    for (const f of s.frames) row.append(card(f, s, true));
    root.append(el('section', {className: 'b-section'}, heads[s.id] = el('div', {className: 'b-head'}), row));
  }
  for (const s of rest) {
    const grid = el('div', {className: 'b-grid'});
    for (const f of s.frames) grid.append(card(f, s, false));
    root.append(el('section', {className: 'b-section'}, heads[s.id] = el('div', {className: 'b-head'}), grid));
  }
  requestAnimationFrame(scaleCompact); updateCompact(); renderLive();
}
// Each card shows the screen's first viewport at the card's width; a phone screen keeps its shape, centred.
function scaleCompact() {
  for (const {card} of Object.values(cards)) {
    const t = card.firstChild, w = +t.dataset.w, h = +t.dataset.h, cw = t.clientWidth, fr = t.querySelector('iframe');
    if (!fr || !cw) continue;
    const k = Math.min(1, cw / w, w < 600 ? 520 / h : 1);
    fr.style.transform = 'scale(' + k + ')'; fr.style.left = Math.round((cw - w * k) / 2) + 'px'; t.style.height = Math.round(h * k) + 'px';
  }
}
new ResizeObserver(() => { if (compact) scaleCompact(); }).observe($('compact'));
function updateCompact() {
  if (!compact) return;
  for (const s of state.sections) if (heads[s.id]) heads[s.id].replaceChildren(el('h3', {textContent: s.name}), s.choose ? pickChip(s) : '');
  for (const {card, actions, f, s} of Object.values(cards)) {
    card.dataset.picked = !!(s.choose && picks[s.id] === f.id);
    actions.replaceChildren(); if (f.kind !== 'page') continue;
    const b = (text, on, fn, cls) => { const x = el('button', {type: 'button', className: 'btn' + (cls ? ' ' + cls : ''), textContent: text}); x.setAttribute('aria-pressed', on); x.onclick = fn; return x; };
    if (s.choose) {
      const picked = picks[s.id] === f.id, riffed = riffs.some(r => r.frame === f.id);
      actions.append(b(picked ? 'Chosen' : 'Choose this', picked, () => { picks[s.id] = picked ? null : f.id; render(); }, picked ? '' : 'primary'),
        b(riffed ? 'Asked for more' : 'More like this', riffed, () => { const i = riffs.findIndex(r => r.frame === f.id); if (i >= 0) riffs.splice(i, 1); else riffs.push({section: s.id, frame: f.id}); render(); }));
    } else {
      const set = v => () => { status[f.id] = status[f.id] === v ? '' : v; touched.add(f.id); render(); };
      actions.append(b(status[f.id] === 'approved' ? 'Approved' : 'Approve', status[f.id] === 'approved', set('approved')), b('Needs changes', status[f.id] === 'change', set('change')));
    }
    const count = notes.filter(n => n.frame === f.id).length;
    actions.append(b(count ? count + (count === 1 ? ' note' : ' notes') : 'Add a note', false, () => ask({frame: f.id, selector: '', target: 'whole screen'}), 'quiet'));
  }
}
function since(a, b) { const ms = Date.parse(b) - Date.parse(a); return !(ms >= 0) ? '' : ms < 90000 ? Math.max(1, Math.round(ms / 1000)) + ' s' : Math.round(ms / 60000) + ' min'; }
function summary() {
  const lines = [];
  for (const s of state.sections) if (s.choose) lines.push(s.name + ': ' + (picks[s.id] ? 'picked ' + picks[s.id] : riffs.some(r => r.section === s.id) ? 'more like ' + riffs.filter(r => r.section === s.id).map(r => r.frame).join(', ') : 'no pick'));
  const of = v => frames().filter(f => status[f.id] === v).map(f => f.id);
  if (of('approved').length) lines.push('Approved: ' + of('approved').join(', '));
  if (of('change').length) lines.push('Needs changes: ' + of('change').join(', '));
  notes.forEach((n, i) => lines.push((i + 1) + '. ' + n.frame + ' ' + n.target + (n.selector ? ' [' + n.selector + ']' : '') + ': ' + n.text));
  if ($('general').value.trim()) lines.push('General: ' + $('general').value.trim());
  return lines.join('\n');
}

// Pan, zoom and select on the canvas.
const viewport = $('viewport'); let drag = null;
viewport.addEventListener('pointerdown', e => {
  if (e.button > 1) return;
  const frame = e.target.closest('.frame');
  if (live && (!frame || frame.dataset.id !== live)) { live = null; commenting = false; render(); }
  drag = {x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, id: frame ? frame.dataset.id : null, moved: false};
  viewport.setPointerCapture(e.pointerId);
});
viewport.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 4) return;
  if (!drag.moved && following) { following = false; renderLive(); }
  drag.moved = true; viewport.classList.add('panning'); view.x = drag.vx + dx; view.y = drag.vy + dy; apply();
});
const release = () => { if (!drag) return; viewport.classList.remove('panning'); if (!drag.moved) { if (drag.id) select(drag.id); else { selected = null; render(); } } drag = null; };
viewport.addEventListener('pointerup', release); viewport.addEventListener('pointercancel', release);
viewport.addEventListener('wheel', e => {
  if (live) return;
  if (following) { following = false; renderLive(); }
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, view.z * Math.exp(-e.deltaY * 0.01));
  else { view.x -= e.deltaX; view.y -= e.deltaY; apply(); }
}, {passive: false});
const centre = () => { const r = viewport.getBoundingClientRect(); return [r.width / 2, r.height / 2]; };
$('zoom-in').addEventListener('click', () => zoomAt(...centre(), view.z * 1.25));
$('zoom-out').addEventListener('click', () => zoomAt(...centre(), view.z / 1.25));
$('zoom-level').addEventListener('click', () => zoomAt(...centre(), 1));
$('zoom-fit').addEventListener('click', fitAll);
$('zoom-decision').addEventListener('click', fitDecision);
addEventListener('keydown', e => {
  if (e.target.closest('textarea, input, dialog')) return;
  if (reviewing) {
    if (e.key === 'Escape') closeReview();
    const it = reviewing.items[reviewing.i], n = parseInt(e.key, 10);
    if (it && it.section.choose && n >= 1 && n <= it.frames.length) { reviewing.option = n - 1; showReview(true); }
    else if (it && it.section.choose && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { reviewing.option = (reviewing.option + (e.key === 'ArrowRight' ? 1 : it.frames.length - 1)) % it.frames.length; showReview(true); }
    return;
  }
  if (playing) { if (e.key === 'Escape') closePresent(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); return; }
  if (e.key === 'Escape') { tool = 'move'; live = null; commenting = false; inspecting = false; render(); }
  else if (e.key === 'v' || e.key === 'V') setTool('move');
  else if (e.key === 'c' || e.key === 'C') setTool('comment');
  else if (e.key === '2') fitDecision();
  else if (e.key === 'a' || e.key === 'A') $('agent-presence').click();
  else if (e.key === 'l' || e.key === 'L') choose(compact);
  else if (e.key === 'b' || e.key === 'B') choose(false);
  else if (e.key === 'm' || e.key === 'M') choose(true);
  else if (e.key === 'p' || e.key === 'P') present(selected);
  else if (e.key === 'f' || e.key === 'F') $('flows').click();
  else if (e.key === 'g' || e.key === 'G') $('grid').click();
  else if (e.key === 's' || e.key === 'S') $('specs-toggle').click();
  else if (e.key === 'r' || e.key === 'R') startReview();
  else if (e.key === 'd' || e.key === 'D') $('mode').click();
  else if (e.key === 'i' || e.key === 'I') setTool(tool === 'inspect' ? 'move' : 'inspect');
  else if (e.key === '1') fitAll();
  else if (e.key === '+' || e.key === '=') zoomAt(...centre(), view.z * 1.25);
  else if (e.key === '-') zoomAt(...centre(), view.z / 1.25);
  else if (e.key === 'Enter' && selected) focusFrame(selected);
});
$('note-dialog').addEventListener('close', () => {
  const text = $('note-text').value.trim();
  if ($('note-dialog').returnValue === 'ok' && text && pending) { notes.push({...pending, text}); if (!status[pending.frame] && !find(pending.frame)?.section.system) { status[pending.frame] = 'change'; touched.add(pending.frame); } commenting = false; live = null; }
  pending = null; render();
});
$('send').addEventListener('click', async () => {
  const feedback = {stage: state.stage, picks, riff: riffs.slice(), frames: frames().filter(f => status[f.id] && touched.has(f.id)).map(f => ({id: f.id, status: status[f.id]})), notes: notes.map(({x, y, ...n}) => n), general: $('general').value.trim()};
  if (!feedback.frames.length && !feedback.notes.length && !feedback.general && !feedback.riff.length && !Object.values(picks).some(Boolean)) { $('status').textContent = 'Approve, pick or comment first.'; return; }
  touched.clear();
  let saved = false;
  if (location.protocol !== 'file:') { try { saved = (await fetch('feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(feedback)})).ok; } catch {} }
  try { await navigator.clipboard.writeText(summary()); } catch {}
  $('status').textContent = !saved ? 'Copied. Paste it to your agent.' : state.agentWaiting ? 'Sent. Your agent has it.' : 'Saved. Tell your agent you are done.';
  selected = null; render(); fitAll();
});

function syncApprovals() {
  for (const f of frames()) { if (touched.has(f.id)) continue; if (state.approvals[f.id]) status[f.id] = state.approvals[f.id]; else delete status[f.id]; }
}

async function load() {
  if (EMBEDDED) { state = EMBEDDED; build(); syncApprovals(); setCompact(wantsCompact()); return; }
  try {
    const next = await (await fetch('state', {cache: 'no-store'})).json();
    if (!state || next.rev !== state.rev) {
      const first = !state, shape = s => s.sections.map(x => x.id + ':' + x.frames.map(f => f.id + '/' + f.kind).join(',')).join('|');
      const same = !first && shape(next) === shape(state), before = state;
      state = next;
      if (before) { const had = new Set(before.sections.flatMap(x => x.frames).filter(f => f.kind === 'page').map(f => f.id)); for (const f of frames()) if (f.kind === 'page' && !had.has(f.id)) born.add(f.id); }
      if (same) { for (const f of frames()) { const old = before.sections.flatMap(s => s.frames).find(o => o.id === f.id); const media = nodes[f.id]?.querySelector('iframe, img'); if (old && old.rev !== f.rev) { swap(media, f); swap(cards[f.id]?.card.querySelector('iframe'), f); } } for (const s of state.sections) s.node = before.sections.find(o => o.id === s.id).node; }
      else { if (selected && !find(selected)) selected = null; build(); }
      syncApprovals(); if (first) setCompact(wantsCompact()); else render();
    }
  } catch {}
  setTimeout(load, 1500);
}
apply(); load();
</script>
</body>
</html>
`;

const page = embedded => PAGE.replace('/*STATE*/null', embedded ? JSON.stringify(embedded).replace(/</g, '\\u003c') : 'null');

const seen = new Map(), seenParts = new Map(); let seenReady = false;
const partsIn = path => { try { return [...readFileSync(path, 'utf8').matchAll(/\bdata-seenry-part\s*=\s*["']([^"']{1,80})["']/g)].map(m => unescape(m[1])); } catch { return []; } };
function serve(port, attempts = 20) {
  if (!existsSync(dir)) init();
  writeFoundations();
  const server = createServer((req, res) => {
    const send = (code, body, type = 'text/plain; charset=utf-8') => { res.writeHead(code, {'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}); res.end(body); };
    const host = String(req.headers.host || '');
    // Only this machine's browser talks to the canvas: refuse other hosts and cross-site writes.
    if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)) return send(403, 'Forbidden');
    let path;
    try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return send(400, 'Bad request'); }
    if (req.method === 'POST' && path === '/feedback') {
      const origin = req.headers.origin;
      if (origin && origin !== `http://${host}`) return send(403, 'Forbidden');
      let body = '';
      req.on('data', chunk => { body += chunk; if (body.length > 131072) req.destroy(); });
      req.on('end', () => {
        try {
          const d = JSON.parse(body), text = (v, n) => String(v ?? '').slice(0, n);
          const clean = {stage: text(d.stage, 80),
            picks: Object.fromEntries(Object.entries(d.picks || {}).filter(([, v]) => v).slice(0, 60).map(([k, v]) => [text(k, 120), text(v, 200)])),
            frames: (Array.isArray(d.frames) ? d.frames : []).slice(0, 400).map(f => ({id: text(f.id, 200), status: f.status === 'approved' ? 'approved' : 'change'})),
            notes: (Array.isArray(d.notes) ? d.notes : []).slice(0, 200).map(n => ({frame: text(n.frame, 200), target: text(n.target, 160), selector: text(n.selector, 240), text: text(n.text, 2000)})),
            riff: (Array.isArray(d.riff) ? d.riff : []).slice(0, 20).map(r => ({section: text(r.section, 120), frame: text(r.frame, 200)})),
            general: text(d.general, 4000), at: new Date().toISOString()};
          writeFileSync(join(dir, 'feedback.json'), JSON.stringify(clean, null, 2) + '\n');
          writeFileSync(join(dir, 'FEEDBACK.md'), '# Canvas feedback\n\n' + feedbackLines(clean).join('\n') + '\n');
          const review = readReview(), now = Date.now();
          review.frames = review.frames || {};
          for (const f of clean.frames) review.frames[f.id] = {status: f.status, at: now};
          writeFileSync(join(dir, 'review.json'), JSON.stringify(review, null, 2) + '\n');
          mkdirSync(join(dir, '.history'), {recursive: true});
          writeFileSync(join(dir, '.history', clean.at.replace(/[:.]/g, '-') + '.json'), JSON.stringify(clean, null, 2) + '\n');
          send(200, '{"ok":true}', TYPES['.json']);
        } catch { send(400, 'Bad request'); }
      });
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed');
    if (path.startsWith('/_seenry/fonts/')) {
      const name = basename(path), font = join(here, '..', '..', 'seenry', 'assets', 'sheet', name);
      return /^runde-(Regular|Medium|Semibold)\.woff2$/.test(name) && existsSync(font) ? send(200, readFileSync(font), TYPES['.woff2']) : send(404, 'Not found');
    }
    if (path === '/') return send(200, page(null), TYPES['.html']);
    if (path === '/state') {
      writeComponents();
      const state = readState({pending: true});
      let edited = false;
      for (const f of state.sections.filter(x => !x.system && !x.reference && !x.archived).flatMap(x => x.frames)) {
        if (f.kind !== 'page') continue;
        const was = seen.get(f.id);
        if (was !== f.rev) {
          const parts = partsIn(join(dir, f.src)), before = seenParts.get(f.id) || [], added = parts.filter(p => !before.includes(p));
          if (seenReady) { edited = true; activity('edit', added.length ? `Added ${added.join(', ')} to ${f.name}` : `${was === undefined ? 'Started' : 'Changed'} ${f.name}`, f.id); }
          seenParts.set(f.id, parts);
        }
        seen.set(f.id, f.rev);
      }
      seenReady = true;
      if (edited) state.activity = readActivity(30);
      return send(200, JSON.stringify(state), TYPES['.json']);
    }
    const manifest = readManifest(), library = libraryDir(manifest);
    let file = inside('.' + path);
    if (path.startsWith('/library/')) {
      if (!library) return send(404, 'Not found');
      const full = resolve(library, '.' + path.slice('/library'.length));
      file = full.startsWith(library + sep) ? full : null;
      if (file && file.slice(library.length).split(sep).some(part => part.startsWith('.'))) file = null;
    } else if (file && file.slice(dir.length).split(sep).some(part => part.startsWith('.'))) file = null;
    if (!file || !existsSync(file) || !statSync(file).isFile()) return send(404, 'Not found');
    send(200, readFileSync(file), TYPES[extname(file).toLowerCase()] || 'application/octet-stream');
  });
  server.on('error', error => {
    if (error.code === 'EADDRINUSE' && attempts > 0) return serve(port + 1, attempts - 1);
    console.error(`The canvas could not start: ${error.message}`); process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    writeFileSync(pidFile, JSON.stringify({pid: process.pid, port}));
    console.log(`Seenry canvas: http://127.0.0.1:${port}/`);
  });
  const close = () => { try { rmSync(pidFile, {force: true}); } catch {} process.exit(0); };
  process.on('SIGINT', close); process.on('SIGTERM', close);
}

function running() {
  try { const info = JSON.parse(readFileSync(pidFile, 'utf8')); process.kill(info.pid, 0); return info; } catch { return null; }
}

function printList(state) {
  for (const s of state.sections) {
    console.log(`${s.name}${s.choose ? ' (options: pick one)' : ''}`);
    for (const f of s.frames) console.log(`  ${f.id}  ${f.kind === 'page' ? `${f.device} ${f.w}×${f.h}` : f.kind}  "${f.name}"${f.links?.length ? `  → ${f.links.join(', ')}` : ''}`);
  }
  if (!state.sections.length) console.log('No screens yet.');
}

function feedbackLines(feedback) {
  const lines = [];
  for (const [section, id] of Object.entries(feedback.picks || {})) lines.push(`Picked in ${section}: ${id}`);
  for (const r of feedback.riff || []) lines.push(`More like this in ${r.section}: ${r.frame}. Make a new round of options around it; do not resolve the section yet.`);
  const of = v => (feedback.frames || []).filter(f => f.status === v).map(f => f.id);
  if (of('approved').length) lines.push(`Approved: ${of('approved').join(', ')}`);
  if (of('change').length) lines.push(`Needs changes: ${of('change').join(', ')}`);
  (feedback.notes || []).forEach((n, i) => lines.push(`${i + 1}. ${n.frame} ${n.target}${n.selector ? ` [${n.selector}]` : ''}: ${n.text}`));
  if (feedback.general) lines.push(`General: ${feedback.general}`);
  const state = readState(), touched = new Set([...(feedback.frames || []).map(f => f.id), ...(feedback.notes || []).map(n => n.frame)]);
  const silent = state.sections.filter(s => !s.reference && !s.choose && !s.system).flatMap(s => s.frames).filter(f => !touched.has(f.id)).map(f => f.id);
  if (silent.length) lines.push(`No answer on: ${silent.join(', ')}`);
  return lines;
}

function printFeedback(feedback) { for (const line of feedbackLines(feedback)) console.log(line); }

/** Open the address in the person's browser when this machine has one. Never fails the command. */
function launch(url) {
  if (!argv.includes('--browser') && (argv.includes('--no-browser') || process.env.CI || process.env.SEENRY_NO_BROWSER)) return false;
  if (process.platform === 'linux' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) return false;
  if (process.env.SSH_CONNECTION && process.platform !== 'darwin') return false;
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { const child = spawn(cmd, args, {detached: true, stdio: 'ignore'}); child.on('error', () => {}); child.unref(); return true; } catch { return false; }
}

/** Values a screen types in instead of taking from tokens.css: the canvas's detached styles. Static, no browser. */
function check() {
  const state = readState(), stage = state.stage || 'wireframe', strict = ['mockup', 'prototype', 'build'].includes(stage);
  const kit = new Set(['tokens.css', 'wire.css', 'fonts.css']), shared = componentClasses();
  const PROPS = /^(color|background|background-color|border|border-[a-z-]*color|border-color|outline-color|fill|stroke|font-family|font|font-size|font-weight|line-height|letter-spacing|padding|padding-[a-z-]+|margin|margin-[a-z-]+|gap|row-gap|column-gap|border-radius|border-[a-z-]*radius|box-shadow)$/;
  const literal = (prop, full) => {
    const value = full.replace(/var\((?:[^()]|\([^()]*\))*\)/g, ' ').replace(/\b(calc|min|max|clamp)\(/g, '(').trim();
    if (!value || /^[\s(),*/+-]*$/.test(value) || /^(inherit|initial|unset|currentcolor|transparent|none|auto|0|normal)$/i.test(value)) return false;
    if (/color|background|fill|stroke|border|outline/.test(prop) && /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch|color)\(/i.test(value)) return true;
    if (/^(font-family|font)$/.test(prop)) return /[a-z]/i.test(value);
    if (prop === 'font-weight') return /\d/.test(value);
    if (prop === 'box-shadow') return /\d/.test(value);
    if (/radius|padding|margin|gap|font-size|letter-spacing/.test(prop)) return /\d*\.?\d+(px|rem|em)\b/.test(value) && !/^-?0(px|rem|em)?$/.test(value);
    return false;
  };
  const scan = css => {
    const found = [];
    for (const decl of css.replace(/\/\*[\s\S]*?\*\//g, '').split(/[;{}]/)) {
      const m = decl.match(/^\s*([a-z-]+)\s*:\s*([^]*?)\s*(!important)?\s*$/i);
      if (!m || m[1].startsWith('--') || !PROPS.test(m[1].toLowerCase())) continue;
      if (literal(m[1].toLowerCase(), m[2])) found.push(m[1] + ': ' + m[2].replace(/\s+/g, ' ').slice(0, 60));
    }
    return found;
  };
  let problems = 0;
  const report = [];
  for (const section of state.sections.filter(s => !s.reference && !s.system && !s.study)) for (const f of section.frames) {
    const html = readFileSync(join(dir, f.src), 'utf8'), issues = [];
    let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n') + ';' + [...html.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi), ...html.matchAll(/\sstyle\s*=\s*'([^']*)'/gi)].map(m => m[1]).join(';');
    for (const m of html.matchAll(/<link\b[^>]*rel=["']?stylesheet[^>]*>/gi)) {
      const href = m[0].match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
      if (!href || /^[a-z]+:|^\//i.test(href) || kit.has(basename(href))) continue;
      const file = resolve(dir, dirname(f.src), href);
      if (file.startsWith(dir + sep) && existsSync(file)) css += ';' + readFileSync(file, 'utf8');
    }
    const detached = scan(css);
    if (detached.length) issues.push(`${detached.length} detached value${detached.length === 1 ? '' : 's'}: ${[...new Set(detached)].slice(0, 6).join(' · ')}${detached.length > 6 ? ' …' : ''}`);
    if (!/<title[^>]*>[^<]+</i.test(html)) issues.push('no <title>, so the frame has no name');
    if (shared.size && !section.choose) {
      const own = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
      const redone = [...new Set([...own.matchAll(/(^|[},])\s*([^{}@]+)\{/g)].flatMap(m => [...m[2].matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(c => c[1])).filter(c => shared.has(c)))];
      if (redone.length) issues.push(`redefines shared component${redone.length === 1 ? '' : 's'} ${redone.map(c => '.' + c).join(' ')} from components.css: change components.css instead, or give the variant its own class there`);
      if (!/href\s*=\s*["'][^"']*components\.css/i.test(html)) issues.push('does not link components.css, so it cannot use the shared components');
    }
    if (strict && !/href\s*=\s*["'][^"']*tokens\.css/i.test(html)) issues.push('does not link tokens.css');
    if (issues.length) { problems += strict ? issues.filter(i => !/shared component|components\.css/.test(i)).length : issues.filter(i => !/detached|shared component|components\.css/.test(i)).length; report.push(`${f.id}\n  ${issues.join('\n  ')}`); }
  }
  console.log(report.length ? report.join('\n') : 'Every screen takes its values from tokens.css.');
  if (report.length && !strict) console.log(`Stage "${stage}": detached values are allowed in wireframes and become errors from "mockup".`);
  return problems ? 1 : 0;
}

/** The folder and file a frame id lives in. */
function locate(state, id) {
  for (const s of state.sections) for (const f of s.frames) if (f.id === id && !s.system && !s.reference) return {section: s, frame: f, path: join(dir, f.src)};
  return null;
}

function archiveFrame(state, id, reason) {
  const hit = locate(state, id);
  if (!hit) { console.error(`No screen "${id}". Run "canvas.mjs list" for the ids.`); process.exit(2); }
  const folder = dirname(hit.frame.src).replace(/\.options$/i, ''), dest = join(dir, 'archive', folder === '.' ? 'screens' : folder);
  mkdirSync(dest, {recursive: true});
  renameSync(hit.path, join(dest, basename(hit.path)));
  // The archived file sits one folder deeper; a <base> keeps its tokens, fonts and images resolving as before.
  const moved = join(dest, basename(hit.path)), from = dirname(hit.frame.src), html = readFileSync(moved, 'utf8');
  if (!/<base\b/i.test(html)) {
    const tag = `<base href="../../${from === '.' ? '' : from + '/'}">`;
    writeFileSync(moved, /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + tag) : /^\s*<!doctype[^>]*>/i.test(html) ? html.replace(/^\s*<!doctype[^>]*>/i, m => m + tag) : tag + html);
  }
  const manifest = readManifest(), key = 'archive/' + idFor(folder === '.' ? 'screens' : folder, basename(hit.path));
  manifest.archive = {...manifest.archive, [key]: {reason: String(reason || 'Archived'), from: hit.frame.src, at: new Date().toISOString()}};
  writeManifest(manifest);
  return key;
}

function resolveOptions(state, sectionId) {
  const section = state.sections.find(s => s.id === sectionId && s.choose);
  if (!section) { console.error(`"${sectionId}" is not an options section. Options live in a folder ending .options.`); process.exit(2); }
  const pick = flag('pick') || state.feedback?.picks?.[sectionId];
  if (!pick || !section.frames.some(f => f.id === pick)) { console.error(`No pick for "${sectionId}" yet. Wait for the person's feedback, or pass --pick <id>.`); process.exit(3); }
  const notes = id => (state.feedback?.notes || []).filter(n => n.frame === id).map(n => n.text).join('; ');
  const picked = section.frames.find(f => f.id === pick);
  // Links to a losing option now lead to the picked one, so the prototype keeps working.
  const swaps = section.frames.filter(f => f.id !== pick).map(f => [basename(f.src), basename(picked.src)]);
  for (const s of state.sections) for (const f of s.frames) {
    if (s.system || s.reference || section.frames.includes(f)) continue;
    const file = join(dir, f.src), html = readFileSync(file, 'utf8');
    let next = html; for (const [lose, win] of swaps) next = next.split(dirname(picked.src) + '/' + lose).join(dirname(picked.src) + '/' + win);
    if (next !== html) writeFileSync(file, next);
  }
  // Ids can shift as files leave (a phone screen loses its suffix once its desktop twin is archived), so find each by its file.
  for (const f of section.frames) if (f.id !== pick) {
    const now = readState(), live = now.sections.flatMap(x => x.frames).find(x => x.src === f.src);
    if (live) console.log(`Archived ${archiveFrame(now, live.id, `Not picked: ${picked.name} was chosen${notes(f.id) ? `. Notes: ${notes(f.id)}` : ''}`)}`);
  }
  const from = dirname(picked.src), to = from.replace(/\.options$/i, '');
  if (from !== to) {
    if (existsSync(join(dir, to))) { for (const f of readdirSync(join(dir, from))) renameSync(join(dir, from, f), join(dir, to, f)); rmSync(join(dir, from), {recursive: true, force: true}); }
    else renameSync(join(dir, from), join(dir, to));
    for (const s of readState().sections) for (const f of s.frames) {
      if (s.system && !s.archived) continue;
      const file = join(dir, f.src), html = readFileSync(file, 'utf8'), next = html.split(from + '/').join(to + '/');
      if (next !== html) writeFileSync(file, next);
    }
  }
  console.log(`Kept ${pick} in ${to}/.`);
}

/** After applying the person's feedback: resolve picks, log the round and set each section's status, in one step. */
function round(text, unattended) {
  let state = readState();
  const riffed = new Set((state.feedback?.riff || []).map(r => r.section));
  for (const s of state.sections.filter(s => s.choose && !riffed.has(s.id) && state.feedback?.picks?.[s.id])) { resolveOptions(state, s.id); state = readState(); }
  const manifest = readManifest();
  if (text) manifest.log = [...(Array.isArray(manifest.log) ? manifest.log : []), {at: new Date().toISOString(), text}];
  // A run with nobody to review is recorded, never approved: the build gate accepts the record and reports it as unapproved.
  if (unattended) { manifest.unattended = {at: new Date().toISOString(), reason: String(unattended).slice(0, 400)}; manifest.log = [...(Array.isArray(manifest.log) ? manifest.log : []), {at: manifest.unattended.at, text: 'Unattended: ' + manifest.unattended.reason}]; }
  manifest.sections = {...manifest.sections};
  if (Array.isArray(manifest.planned)) manifest.planned = manifest.planned.filter(p => !existsSync(join(dir, String(p))));
  const lines = [];
  for (const s of state.sections.filter(s => !s.system && !s.reference)) {
    const approved = s.frames.filter(f => state.approvals[f.id] === 'approved').length;
    const sketches = s.choose ? 0 : s.frames.filter(f => f.sketch).length;
    const status = !s.choose && !sketches && approved === s.frames.length ? 'ready' : sketches ? 'in-progress' : 'review';
    manifest.sections[s.id] = {...manifest.sections[s.id], status};
    lines.push(`${s.id}: ${STATUSES[status]}${s.choose ? ' (options still open)' : sketches ? ` (${sketches} picked sketch${sketches === 1 ? '' : 'es'} to extend to the full page: then remove its seenry-fidelity meta)` : ` (${approved} of ${s.frames.length} approved)`}`);
  }
  writeManifest(manifest);
  activity('round', text ? `Round done: ${text}` : 'Round done');
  console.log(lines.join('\n') + (text ? '\nLogged.' : '') + (unattended ? '\nUnattended run recorded. No screen is approved: say which option you chose and why, and list every screen as not approved by a person.' : ''));
}

function handoff() {
  const state = readState(), manifest = readManifest(), library = libraryDir(manifest), lines = [];
  const design = state.sections.filter(s => !s.system && !s.reference);
  lines.push(`# ${state.title}: handoff`, '', `Stage: ${state.stage || 'not set'} · generated ${new Date().toISOString().slice(0, 10)}`, '');
  if (state.description) lines.push(state.description, '');
  lines.push('## Design system', '', `- Tokens: ${library ? relative(process.cwd(), join(library, 'tokens.css')) + ' (shared library)' : relative(process.cwd(), join(dir, 'tokens.css'))}. Move it into the product unchanged; components use only its semantic variables.`);
  const fonts = [library, dir].filter(Boolean).map(r => join(r, 'fonts')).filter(existsSync).flatMap(f => readdirSync(f).map(n => relative(process.cwd(), join(f, n))));
  lines.push(`- Fonts: ${fonts.length ? fonts.join(', ') : 'none self-hosted; check the <link> in each screen'}`);
  const shared = readComponents(), sheets = state.sections.filter(s => /components/i.test(s.id) && s.id !== 'components').flatMap(s => s.frames.map(f => `${f.name} (${f.src})`));
  if (shared.length) lines.push(`- Components: ${relative(process.cwd(), join(dir, 'components.css'))}. One source for every screen: build each of these once in the product and reuse it.`, ...shared.map(c => `  - ${c.name}: ${c.classes.map(x => '`.' + x + '`').join(' ') || 'no classes'}`));
  if (sheets.length || !shared.length) lines.push(`- ${shared.length ? 'Component sheets' : 'Components'}: ${sheets.length ? sheets.join(', ') : 'none on the canvas'}`);
  lines.push('');
  if (state.flows.length) lines.push('## Flows', '', ...state.flows.map(f => `- ${f.name}: starts at ${f.start}`), '');
  lines.push('## Screens', '');
  for (const s of design) {
    lines.push(`### ${s.name}${s.status ? ` · ${STATUSES[s.status]}` : ''}`, '', '| Screen | File | Size | Goes to | Review |', '| --- | --- | --- | --- | --- |');
    for (const f of s.frames) lines.push(`| ${f.name} | ${relative(process.cwd(), join(dir, f.src))} | ${f.device} ${f.w}×${f.h} | ${f.links.join(', ') || '—'} | ${state.approvals[f.id] === 'approved' ? 'Approved' : state.approvals[f.id] === 'change' ? 'Needs changes' : 'Not reviewed'} |`);
    const specs = s.frames.flatMap(f => specsIn(join(dir, f.src)).map(x => `- ${f.name} · \`${x.element}\`${x.text ? ` “${x.text}”` : ''}: ${x.spec}`));
    lines.push('', ...(specs.length ? ['Specs:', '', ...specs] : ['No specs annotated.']), '');
  }
  const open = design.flatMap(s => s.frames).filter(f => state.approvals[f.id] !== 'approved').map(f => f.id);
  lines.push('## Open', '', open.length ? `Not approved yet: ${open.join(', ')}` : 'Every screen is approved.', '');
  const archive = Object.entries(manifest.archive || {});
  if (archive.length) lines.push('## Decided against', '', ...archive.map(([id, a]) => `- ${id}: ${a.reason}`), '');
  if (state.log.length) lines.push('## Change log', '', ...[...state.log].reverse().map(l => `- ${String(l.at).slice(0, 10)}: ${l.text}`), '');
  const took = firstOptionTime(manifest);
  if (took) lines.push('## Speed', '', `First option shown ${took} after the canvas was started.`, '');
  writeFileSync(join(dir, 'HANDOFF.md'), lines.join('\n'));
  activity('handoff', 'Wrote the handoff for the build');
  console.log(`Wrote ${join(dir, 'HANDOFF.md')}`);
}

const span = ms => ms < 90000 ? `${Math.max(1, Math.round(ms / 1000))} s` : `${Math.round(ms / 60000)} min`;
function firstOptionTime(manifest) {
  const a = Date.parse(manifest.started || ''), b = Date.parse(manifest.firstOption || '');
  return a && b && b >= a ? span(b - a) : '';
}
/** Called when the canvas is shown to the person: the first time options are on it, the time since the start is kept. */
function markShown() {
  const manifest = readManifest();
  if (manifest.error || manifest.firstOption || !manifest.started) return '';
  if (!readState().sections.some(s => s.choose && !s.study && s.frames.length)) return '';
  manifest.firstOption = new Date().toISOString(); writeManifest(manifest);
  return firstOptionTime(manifest);
}

/** The running canvas server, started in the background when there is none. */
async function startServer() {
  if (!existsSync(dir)) init();
  let info = running();
  if (!info) {
    const log = openSync(join(dir, '.canvas.log'), 'a');
    spawn(process.execPath, [fileURLToPath(import.meta.url), 'serve', dir, '--port', String(port)], {detached: true, stdio: ['ignore', log, log]}).unref();
    for (let i = 0; i < 40 && !(info = running()); i++) await new Promise(r => setTimeout(r, 100));
    if (info) info.started = true;
  }
  return info;
}

// ---------- The agent's eyes: render, tree, verify, diff and compare, in a real browser ----------

/** Runs inside a screen. Returns its layout tree with bound variables, and the issues a reviewer would catch. Self-contained. */
function analyzeFrame(opts) {
  const phone = opts.width < 600, out = {title: document.title, width: innerWidth, height: document.documentElement.scrollHeight, nodes: [], issues: []};
  const issue = (severity, kind, selector, message) => out.issues.push({severity, kind, selector, message});
  const rules = [];
  const walk = list => { for (const r of list) { if (r.selectorText && r.style) rules.push(r); else if (r.media && r.cssRules) { if (matchMedia(r.media.mediaText).matches) walk(r.cssRules); } else if (r.cssRules) walk(r.cssRules); } };
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch {} }
  const specificity = sel => (sel.match(/#[\w-]+/g) || []).length * 100 + (sel.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length * 10 + (sel.replace(/[#.][\w-]+|\[[^\]]+\]|::?[\w-]+(\([^)]*\))?/g, ' ').match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;
  const declared = (node, longhand, shorthand, inherit) => {
    for (let n = node; n && n.nodeType === 1; n = inherit ? n.parentElement : null) {
      const inline = n.style && (n.style.getPropertyValue(longhand) || (shorthand && n.style.getPropertyValue(shorthand)));
      if (inline) return inline;
      let best = null, score = -1;
      for (const r of rules) {
        const v = r.style.getPropertyValue(longhand) || (shorthand && r.style.getPropertyValue(shorthand)); if (!v) continue;
        for (const part of r.selectorText.split(',')) { let hit = false; try { hit = n.matches(part.trim()); } catch {} if (hit) { const s = specificity(part); if (s >= score) { score = s; best = v; } } }
      }
      if (best) return best;
      if (!inherit) return null;
    }
    return null;
  };
  const bound = (node, longhand, shorthand, inherit) => {
    const d = declared(node, longhand, shorthand, inherit); if (!d) return null;
    const vars = [...d.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);
    if (vars.length) return [...new Set(vars)].join(' ');
    return /^(inherit|initial|unset|currentcolor|transparent|none|auto|0|normal)$/i.test(d.trim()) ? null : '!' + d.trim();
  };
  const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently: true});
  const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const backdrop = node => {
    for (let n = node; n && n.nodeType === 1; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.backgroundImage && c.backgroundImage !== 'none') return null;
      const bg = rgba(c.backgroundColor); if (bg[3] > 0.5) return bg;
    }
    return rgba(getComputedStyle(document.documentElement).backgroundColor)[3] > 0.5 ? rgba(getComputedStyle(document.documentElement).backgroundColor) : [255, 255, 255, 1];
  };
  const visible = n => { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden' || Number(c.opacity) === 0) return false; const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const path = n => {
    const parts = [];
    for (let e = n; e && e.nodeType === 1 && e.tagName !== 'HTML' && parts.length < 4; e = e.parentElement) {
      if (e.id) { parts.unshift('#' + e.id); break; }
      const cls = typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).filter(c => !c.startsWith('seenry-'))[0] : '';
      const same = e.parentElement ? [...e.parentElement.children].filter(c => c.tagName === e.tagName) : [];
      parts.unshift(e.tagName.toLowerCase() + cls + (same.length > 1 && !cls ? ':nth-of-type(' + (same.indexOf(e) + 1) + ')' : ''));
      if (e.tagName === 'BODY') break;
    }
    return parts.join(' > ');
  };
  const ownText = n => [...n.childNodes].filter(c => c.nodeType === 3).map(c => c.textContent).join(' ').trim().replace(/\s+/g, ' ');
  const interactive = n => n.matches('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [onclick]');
  const quiet = v => /^(0px|normal|none|auto|rgba\(0, 0, 0, 0\)|transparent)$/.test(v);
  if (document.documentElement.scrollWidth > innerWidth + 1) {
    const wide = [...document.body.querySelectorAll('*')].filter(visible).filter(n => n.getBoundingClientRect().right > innerWidth + 1).slice(-1)[0];
    issue('error', 'overflow', wide ? path(wide) : 'body', `The page scrolls sideways by ${document.documentElement.scrollWidth - innerWidth}px`);
  }
  if (!document.title.trim()) issue('warn', 'title', 'head', 'No <title>, so the frame has no name');
  const body = document.body.getBoundingClientRect(), all = [...document.body.querySelectorAll('*')];
  for (const n of all) {
    if (n.closest('#seenry-grid, .seenry-spec-pin') || ['SCRIPT', 'STYLE', 'LINK', 'META', 'BR'].includes(n.tagName) || !visible(n)) continue;
    const c = getComputedStyle(n), r = n.getBoundingClientRect(), text = ownText(n), sel = path(n);
    const size = parseFloat(c.fontSize), weight = Number(c.fontWeight) || 400;
    if (text) {
      if (size < 12) issue('error', 'text-size', sel, `Text at ${c.fontSize}, under the 12px floor`);
      const bg = backdrop(n);
      if (bg) {
        const fg = rgba(c.color), mixed = [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])), cr = ratio(mixed, bg), large = size >= 24 || (size >= 18.66 && weight >= 600);
        if (cr < (large ? 3 : 4.5)) issue('error', 'contrast', sel, `Contrast ${cr.toFixed(2)}:1 for “${text.slice(0, 30)}”, needs ${large ? 3 : 4.5}:1`);
      }
      if (/hidden|clip/.test(c.overflowX + c.overflowY) && c.textOverflow !== 'ellipsis' && (n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1)) issue('warn', 'clipped', sel, `Text is cut off: “${text.slice(0, 30)}”`);
    }
    if (interactive(n)) {
      const min = phone ? 44 : 24;
      if (Math.min(r.width, r.height) < min - 0.5) issue('warn', 'target', sel, `Tap target ${Math.round(r.width)}×${Math.round(r.height)}, under ${min}×${min}`);
      const labelled = (n.labels && [...n.labels].some(l => l.textContent.trim())) || (n.getAttribute('aria-labelledby') || '').split(/\s+/).some(id => id && document.getElementById(id)?.textContent.trim());
      if (!(labelled || n.innerText || n.getAttribute('aria-label') || n.getAttribute('title') || n.getAttribute('alt') || n.getAttribute('placeholder') || n.querySelector('img[alt], svg title'))) issue('error', 'name', sel, 'A control with no accessible name');
    }
    if (n.tagName === 'IMG' && !n.hasAttribute('alt')) issue('warn', 'alt', sel, 'An image with no alt text');
    const paint = !quiet(c.backgroundColor) || (c.borderTopStyle !== 'none' && !quiet(c.borderTopWidth)) || !quiet(c.boxShadow);
    if (!(text || interactive(n) || paint || n.tagName === 'IMG' || n.hasAttribute('data-spec')) || out.nodes.length >= 400) continue;
    let depth = 0; for (let p = n.parentElement; p && p !== document.body; p = p.parentElement) depth++;
    const styles = {};
    const put = (key, value, longhand, shorthand, inherit) => { if (value == null || quiet(value)) return; styles[key] = {value, token: bound(n, longhand, shorthand, inherit)}; };
    let textStyle = null; for (let p = n; p && p.classList && !textStyle; p = p.parentElement) textStyle = [...p.classList].find(x => x.startsWith('text-'));
    if (text) {
      if (textStyle) styles['text-style'] = {value: '.' + textStyle, token: '.' + textStyle};
      put('font-size', c.fontSize, 'font-size', 'font', true); put('font-weight', c.fontWeight, 'font-weight', 'font', true);
      put('font-family', c.fontFamily.split(',')[0].replace(/["']/g, '').trim(), 'font-family', 'font', true); put('color', c.color, 'color', null, true);
    }
    put('background', c.backgroundColor, 'background-color', 'background');
    const pad = ['top', 'right', 'bottom', 'left'].map(s => c.getPropertyValue('padding-' + s));
    if (!pad.every(v => v === '0px')) put('padding', pad.join(' ').replace(/^(\S+) (\S+) \1 \2$/, '$1 $2').replace(/^(\S+) \1$/, '$1'), 'padding-top', 'padding');
    if (/flex|grid/.test(c.display)) put('gap', c.rowGap, 'row-gap', 'gap');
    put('radius', c.borderTopLeftRadius, 'border-top-left-radius', 'border-radius');
    if (c.borderTopStyle !== 'none' && !quiet(c.borderTopWidth)) put('border', c.borderTopWidth + ' ' + c.borderTopColor, 'border-top-color', 'border');
    put('shadow', c.boxShadow, 'box-shadow');
    const cls = typeof n.className === 'string' ? n.className.trim().split(/\s+/).filter(x => x && !x.startsWith('text-') && !x.startsWith('seenry-')) : [];
    out.nodes.push({selector: sel, tag: n.tagName.toLowerCase(), id: n.id || '', classes: cls, depth, text: text.slice(0, 80),
      box: [Math.round(r.left - body.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)], styles, spec: n.getAttribute('data-spec') || '', href: n.getAttribute('href') || ''});
  }
  // Lines: a rule is as wide as what it rules, runs in one direction per group, and never boxes text.
  const px = v => parseFloat(v) || 0, clear = col => rgba(col)[3] < 0.05;
  for (const n of all) {
    if (!visible(n) || ['TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'HR', 'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(n.tagName)) continue;
    const c = getComputedStyle(n), r = n.getBoundingClientRect();
    const t = px(c.borderTopWidth), b = px(c.borderBottomWidth), l = px(c.borderLeftWidth), rt = px(c.borderRightWidth);
    if ((t || b) && !l && !rt && clear(c.backgroundColor) && r.width < innerWidth - 1 && Math.max(px(c.paddingLeft), px(c.paddingRight)) >= 8)
      issue('warn', 'line', path(n), `The rule on this element runs ${Math.round(Math.max(px(c.paddingLeft), px(c.paddingRight)))}px past its content; put it on the inner element so it ends at the content edge, or make it full-bleed`);
    const kids = [...n.children].filter(visible);
    if (kids.length < 2) continue;
    const ks = kids.map(k => ({k, c: getComputedStyle(k), r: k.getBoundingClientRect()}));
    const sideBySide = ks.every((x, i) => !i || x.r.left >= ks[i - 1].r.right - 1);
    const ruled = ks.filter(x => { const v = px(x.c.borderLeftWidth) || px(x.c.borderRightWidth), full = px(x.c.borderLeftWidth) && px(x.c.borderRightWidth) && px(x.c.borderTopWidth) && px(x.c.borderBottomWidth); return v && !full; });
    if (!sideBySide || ruled.length < 2) continue;
    if (t || b || ks.some(x => px(x.c.borderTopWidth) || px(x.c.borderBottomWidth)))
      issue('warn', 'line', path(n), 'Lines run in both directions here and box the content; keep one direction (a short rule on top of each column, no dividers between)');
    const starts = ks.map(x => x.r.left + px(x.c.borderLeftWidth) + px(x.c.paddingLeft)), steps = starts.slice(1).map((v, i) => v - starts[i]);
    if (Math.max(...steps) - Math.min(...steps) > 4)
      issue('warn', 'line', path(n), `Columns divided by lines start at uneven steps (${steps.map(v => Math.round(v)).join(', ')}px); drop the dividers and use a gap, or give every column the same inset`);
  }
  return out;
}

/** Compares two PNGs (base64) in the page, returns the share of changed pixels and a diff image. */
async function diffImages({a, b}) {
  const load = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = 'data:image/png;base64,' + src; });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
  const pixels = img => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h); };
  const pa = pixels(ia), pb = pixels(ib), out = document.createElement('canvas'); out.width = w; out.height = h;
  const ox = out.getContext('2d'), od = ox.createImageData(w, h);
  let changed = 0;
  for (let i = 0; i < pa.data.length; i += 4) {
    const d = Math.abs(pa.data[i] - pb.data[i]) + Math.abs(pa.data[i + 1] - pb.data[i + 1]) + Math.abs(pa.data[i + 2] - pb.data[i + 2]);
    const g = (pa.data[i] + pa.data[i + 1] + pa.data[i + 2]) / 3;
    if (d > 48) { changed++; od.data[i] = 235; od.data[i + 1] = 40; od.data[i + 2] = 40; } else { od.data[i] = od.data[i + 1] = od.data[i + 2] = 255 - (255 - g) * 0.25; }
    od.data[i + 3] = 255;
  }
  ox.putImageData(od, 0, 0);
  return {changed, total: w * h, sizes: [ia.width, ia.height, ib.width, ib.height], png: out.toDataURL('image/png').split(',')[1]};
}

const json = argv.includes('--json');
const safe = id => id.replace(/[^\w.-]+/g, '__');

/** The design frames a command works on: named ids or section prefixes, else every screen. */
function pickFrames(state, names) {
  const design = state.sections.filter(s => !s.system && !s.reference).flatMap(s => s.frames);
  if (!names.length) return design;
  const all = state.sections.flatMap(s => s.frames).filter(f => f.kind === 'page');
  const hits = all.filter(f => names.some(n => f.id === n || f.id.startsWith(n.replace(/\/?$/, '/'))));
  const missing = names.filter(n => !all.some(f => f.id === n || f.id.startsWith(n.replace(/\/?$/, '/'))));
  if (missing.length) { console.error(`No screen or section "${missing.join('", "')}". Run "canvas.mjs list" for the ids.`); process.exit(2); }
  return hits;
}

async function withBrowser(fn) {
  const playwright = await loadPlaywright();
  if (!playwright) { console.error('This command needs Playwright: npm i -D playwright && npx playwright install chromium, or pass --playwright <path to playwright/index.mjs>.'); process.exit(2); }
  const chromium = playwright.chromium || playwright.default?.chromium;
  const info = await startServer();
  if (!info) { console.error('The canvas did not start; see .canvas.log.'); process.exit(1); }
  const browser = await chromium.launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
  try { return await fn(browser, `http://127.0.0.1:${info.port}/`); }
  finally { await browser.close(); if (info.started) { try { process.kill(info.pid); } catch {} rmSync(pidFile, {force: true}); } }
}

async function openPage(browser, url, width, height, mode, scale = 1) {
  const context = await browser.newContext({viewport: {width, height}, deviceScaleFactor: scale});
  const page = await context.newPage();
  await page.goto(url, {waitUntil: 'load'});
  if (mode === 'dark') await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  // Judge the settled screen: an entrance caught mid-flight reads as faded text and fails contrast for no reason.
  await page.evaluate(() => { for (const a of document.getAnimations()) { const t = a.effect?.getComputedTiming?.(); if (t && Number.isFinite(t.endTime)) { try { a.finish(); } catch {} } } });
  return {context, page};
}

const modesFor = () => { const m = flag('mode', 'light'); return m === 'both' ? ['light', 'dark'] : [m]; };
const devicesFor = f => { const d = flag('device'); if (!d || f.device === 'image') return [[f.device, f.w, f.h]]; return (d === 'all' ? ['phone', 'tablet', 'desktop'] : d.split(',')).filter(x => DEVICES[x]).map(x => [x, ...DEVICES[x]]); };

async function render(names) {
  const state = readState(), frames = pickFrames(state, names), out = resolve(flag('out', join(dir, '.renders'))), scale = Number(flag('scale', 1)), shots = [];
  for (const f of frames.slice(0, 6)) activity('look', `Looking at ${f.name}`, f.id);
  mkdirSync(out, {recursive: true});
  await withBrowser(async (browser, base) => {
    for (const f of frames) for (const mode of modesFor()) for (const [device, w, h] of devicesFor(f)) {
      const {context, page} = await openPage(browser, base + f.src.split('/').map(encodeURIComponent).join('/'), w, h, mode, scale);
      const file = join(out, `${safe(f.id)}.${device}.${mode}.png`);
      const snap = join(dir, '.history', 'snapshots', `${safe(f.id)}.${device}.${mode}.png`);
      await page.screenshot({path: file, fullPage: true});
      mkdirSync(dirname(snap), {recursive: true});
      if (existsSync(snap)) renameSync(snap, snap.replace(/\.png$/, '.prev.png'));
      writeFileSync(snap, readFileSync(file));
      shots.push({frame: f.id, device, mode, file});
      await context.close();
    }
  });
  if (json) console.log(JSON.stringify(shots, null, 2)); else for (const s of shots) console.log(`${s.frame}  ${s.device} ${s.mode}  ${s.file}`);
}

function formatTree(f, data) {
  const lines = [`${f.name}  ${data.width}×${data.height}  (${f.id})`];
  for (const n of data.nodes) {
    const style = Object.entries(n.styles).map(([k, s]) => s.token ? (s.token.startsWith('!') ? `${k} ${s.value}!` : `${k} ${s.token}`) : null).filter(Boolean).join(' · ');
    const label = n.tag + (n.id ? '#' + n.id : n.classes[0] ? '.' + n.classes[0] : '');
    lines.push(`${'  '.repeat(Math.min(n.depth, 8))}${label}${n.text ? ` “${n.text.slice(0, 40)}”` : ''}  ${n.box[0]},${n.box[1]} ${n.box[2]}×${n.box[3]}${style ? '  ' + style : ''}${n.href ? '  → ' + n.href : ''}${n.spec ? '  spec: ' + n.spec : ''}`);
  }
  lines.push('  (“!” marks a value typed in instead of taken from a variable)');
  return lines.join('\n');
}

async function tree(names) {
  const state = readState(), frames = pickFrames(state, names), results = [];
  await withBrowser(async (browser, base) => {
    for (const f of frames) {
      const [[device, w, h]] = devicesFor(f), mode = modesFor()[0];
      const {context, page} = await openPage(browser, base + f.src.split('/').map(encodeURIComponent).join('/'), w, h, mode);
      const data = await page.evaluate(analyzeFrame, {width: w});
      results.push({frame: f.id, name: f.name, device, mode, width: data.width, height: data.height, nodes: data.nodes});
      if (!json) console.log(formatTree(f, data) + '\n');
      await context.close();
    }
  });
  if (json) console.log(JSON.stringify(results, null, 2));
}

/** The execution bar lives in the seenry skill beside this one; a canvas.mjs downloaded alone runs without it. */
async function seenryScript(name) {
  const file = join(here, '..', '..', 'seenry', 'scripts', name);
  if (!existsSync(file)) return null;
  try { return await import(pathToFileURL(file).href); } catch { return null; }
}
const executionBar = () => seenryScript('execution_bar.mjs');
const pairLog = () => join(dir, '.renders', 'pair', 'pair.json');
const readPairs = () => { try { return JSON.parse(readFileSync(pairLog(), 'utf8')).entries || []; } catch { return []; } };

async function verify(names) {
  const state = readState(), frames = pickFrames(state, names), issues = [], byClass = {};
  activity('check', `Checking ${frames.length === 1 ? frames[0].name : frames.length + ' screens'}${argv.includes('--quick') ? ' (quick)' : ''}`, frames.length === 1 ? frames[0].id : '');
  const known = new Set(state.sections.flatMap(s => s.frames.map(f => f.src)));
  const find = id => { for (const s of state.sections) for (const f of s.frames) if (f.id === id) return {section: s, frame: f}; return null; };
  await withBrowser(async (browser, base) => {
    for (const f of frames) {
      const [[device, w, h]] = devicesFor(f);
      for (const mode of ['light', 'dark']) {
        const {context, page} = await openPage(browser, base + f.src.split('/').map(encodeURIComponent).join('/'), w, h, mode);
        const data = await page.evaluate(analyzeFrame, {width: w});
        for (const i of data.issues) if (mode === 'light' || i.kind === 'contrast') issues.push({frame: f.id, mode, ...i});
        if (mode === 'light') {
          for (const n of data.nodes) {
            if (n.href && !/^([a-z]+:|#|\/)/i.test(n.href) && /\.html(?:[#?].*)?$/i.test(n.href)) {
              const target = resolve(dir, dirname(f.src), n.href.replace(/[#?].*$/, ''));
              if (!existsSync(target)) issues.push({frame: f.id, mode, severity: 'error', kind: 'link', selector: n.selector, message: `Links to ${n.href}, which does not exist`});
              else if (!known.has(relative(dir, target).split(sep).join('/'))) issues.push({frame: f.id, mode, severity: 'warn', kind: 'link', selector: n.selector, message: `Links to ${n.href}, which is not on the canvas (archived?)`});
            }
            // Options are meant to differ from each other, so they never count as drift.
            const key = n.classes[0]; if (!key || find(f.id)?.section.choose) continue;
            const look = ['font-size', 'font-weight', 'color', 'background', 'padding', 'radius'].map(k => n.styles[k]?.value || '-').join(' | ');
            const group = key + ' @' + device;
            ((byClass[group] = byClass[group] || {})[look] = byClass[group][look] || new Set()).add(f.id);
          }
        }
        await context.close();
      }
    }
  });
  // Options are where a design is first shown, so the study behind them is checked here: a teardown with measurements,
  // each option put beside a reference, and the execution bar on desktop screens. Showing options composed from memory
  // was the top failure in testing. A wireframe stage (set in canvas.json) is exempt: it has no look to study yet.
  const optionFrames = frames.filter(f => find(f.id)?.section.choose);
  if (optionFrames.length && !['map', 'wireframe'].includes(state.stage)) {
    const seenry = resolve(dir, '..'), tearFile = join(seenry, 'teardown.md');
    const bar = await executionBar();
    // With no teardown yet, verify writes one: full-size crops of up to three references and a section each to fill in.
    let tear = existsSync(tearFile) ? readFileSync(tearFile, 'utf8') : '', started = 0;
    if (!tear.trim()) {
      const td = await seenryScript('teardown.mjs'), images = d => existsSync(d) ? readdirSync(d).filter(n => /\.(png|jpe?g|webp|avif)$/i.test(n)).sort().map(n => join(d, n)) : [];
      const inputs = [...images(join(seenry, 'level')), ...images(join(dir, 'refs'))].slice(0, 3);
      if (td && inputs.length) { await withBrowser(async browser => { started = (await td.prepareTeardown({dir: seenry, inputs, browser})).length; }); tear = readFileSync(tearFile, 'utf8'); }
    }
    const problems = bar ? bar.teardownProblems(tear) : !tear.trim() ? ['it does not exist'] : tear.length < 900 ? ['it is too short to hold measurements per reference'] : [];
    if (problems.length) issues.push({frame: find(optionFrames[0].id).section.id, mode: 'light', severity: 'error', kind: 'teardown', selector: relative(process.cwd(), tearFile), message: started
      ? `Fill in ${relative(process.cwd(), tearFile)}: it was just written with ${started} reference sections, and their full-size crops are in ${relative(process.cwd(), join(dir, 'refs', 'crops'))}. Open each crop and replace every __ with a count or a measurement.`
      : `Finish ${relative(process.cwd(), tearFile)} before any option is shown: ${problems.join('; ')}.${existsSync(join(dir, 'refs')) && readdirSync(join(dir, 'refs')).some(n => /\.(png|jpe?g|webp|avif)$/i.test(n)) || existsSync(join(seenry, 'level')) ? '' : ` Save two or more reference screens to ${relative(process.cwd(), join(dir, 'refs'))} first; verify then writes the crops and the sections to fill in.`}`});
    const hasRefs = [join(dir, 'refs'), join(seenry, 'level')].some(d => existsSync(d) && readdirSync(d).some(f => /\.(png|jpe?g|webp|avif)$/i.test(f)));
    // Each option is put beside its references here, so nobody has to remember to: the ones compose.md names, else
    // the first level image and the first reference. A pair is redone only when the screen changed after it.
    const refFiles = d => existsSync(d) ? readdirSync(d).filter(n => /\.(png|jpe?g|webp|avif)$/i.test(n)).sort().map(n => join(d, n)) : [];
    const composeText = existsSync(join(seenry, 'compose.md')) ? readFileSync(join(seenry, 'compose.md'), 'utf8').toLowerCase() : '';
    const allRefs = [...refFiles(join(seenry, 'level')), ...refFiles(join(dir, 'refs'))];
    const asWord = s => new RegExp(`(^|[^a-z0-9-])${s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9-])`);
    const namedRefs = allRefs.filter(p => asWord(basename(p)).test(composeText) || (basename(p, extname(p)).length >= 4 && asWord(basename(p, extname(p))).test(composeText)));
    const pairWith = (namedRefs.length ? namedRefs : [refFiles(join(seenry, 'level'))[0], refFiles(join(dir, 'refs'))[0]].filter(Boolean)).slice(0, 2);
    const quick = argv.includes('--quick');
    if (hasRefs && !argv.includes('--no-judge') && !quick) for (const f of optionFrames) {
      const src = join(dir, f.src), changed = existsSync(src) ? statSync(src).mtimeMs : 0;
      for (const ref of pairWith) {
        const had = readPairs().find(e => e.frame === f.id && e.reference === basename(ref));
        if (had && had.verdict && !had.verdict.skipped && Date.parse(had.at || 0) >= changed) continue;
        const r = await pairCore(f, ref);
        if (r.error) issues.push({frame: f.id, mode: 'light', severity: 'warn', kind: 'pair', selector: basename(ref), message: r.error});
      }
    }
    // The skill's worked example is a path to copy, not a page: a blind run copied it move for move. Each desktop option
    // is put beside the example's screenshot too, unless the brief is the example's own product.
    const exampleShot = join(here, '..', '..', 'seenry', 'assets', 'examples', 'waterline', 'waterline-example.jpg');
    const briefText = [join(seenry, 'brief.md'), join(seenry, 'BRIEF.md')].filter(existsSync).map(p => readFileSync(p, 'utf8')).join('\n');
    if (existsSync(exampleShot) && !argv.includes('--no-judge') && !quick && !/ledgerline/i.test(briefText)) for (const f of optionFrames) {
      const [[, w]] = devicesFor(f); if (w < 1200) continue;
      const src = join(dir, f.src), changed = existsSync(src) ? statSync(src).mtimeMs : 0;
      const had = readPairs().find(e => e.frame === f.id && e.reference === basename(exampleShot));
      if (had && had.verdict && !had.verdict.skipped && Date.parse(had.at || 0) >= changed) continue;
      const r = await pairCore(f, exampleShot, {example: true});
      if (r.error) issues.push({frame: f.id, mode: 'light', severity: 'warn', kind: 'pair', selector: basename(exampleShot), message: r.error});
    }
    // A pair render is only evidence once someone other than the builder has judged it: a yes to "reskin" or
    // "less finished" blocks the option until it is fixed and paired again.
    const judge = await seenryScript('judge_pair.mjs'), pairs = readPairs().filter(e => optionFrames.some(f => f.id === e.frame));
    for (const e of quick ? [] : pairs) {
      const src = join(dir, find(e.frame)?.frame.src || ''), stale = existsSync(src) && statSync(src).mtimeMs > Date.parse(e.at || 0);
      if (judge?.blocked(e.verdict)) issues.push({frame: e.frame, mode: 'light', severity: 'error', kind: 'pair-verdict', selector: e.reference, message: judge.pairBlocks([e])[0] + (stale ? ' The screen changed since: pair it again for a new verdict.' : '')});
      else if (!e.verdict || e.verdict.skipped) issues.push({frame: e.frame, mode: 'light', severity: 'warn', kind: 'pair-verdict', selector: e.reference, message: `Paired with ${e.reference} but not judged (${e.verdict?.skipped || 'no verdict'}): the pair image is yours to look at, the verdict is not yours to give. Run pair again where a model CLI is available.`});
      else if (stale) issues.push({frame: e.frame, mode: 'light', severity: 'warn', kind: 'pair-verdict', selector: e.reference, message: `Changed since it was paired with ${e.reference}: pair it again.`});
    }
    if (bar) {
      const level = existsSync(join(seenry, 'level.md')) ? readFileSync(join(seenry, 'level.md'), 'utf8') : '';
      const allow = ((level.match(/^Allow:\s*(.+)$/mi) || [])[1] || '').split(',').map(s => s.trim()).filter(Boolean);
      await withBrowser(async (browser, base) => {
        for (const f of optionFrames) {
          const [[, w, h]] = devicesFor(f); if (w < 1200) continue;
          const {context, page} = await openPage(browser, base + f.src.split('/').map(encodeURIComponent).join('/'), w, h, 'light');
          const result = bar.judgeExecution(await page.evaluate(bar.collectExecution), {allow});
          for (const m of result.thinProduct) issues.push({frame: f.id, mode: 'light', severity: 'error', kind: 'product', selector: '[data-seenry-product]', message: m});
          for (const m of result.template || []) issues.push({frame: f.id, mode: 'light', severity: 'error', kind: 'template', selector: 'img', message: m});
          for (const m of result.offGrid || []) issues.push({frame: f.id, mode: 'light', severity: 'error', kind: 'grid', selector: 'section', message: m});
          for (const m of result.notes) issues.push({frame: f.id, mode: 'light', severity: 'warn', kind: /headline/.test(m) ? 'headline' : /moments/.test(m) ? 'section' : 'hue', selector: /headline/.test(m) ? 'h1' : 'body', message: m});
          await context.close();
        }
      });
    }
  }
  const seen = new Set();
  for (const i of [...issues]) { const k = i.frame + i.selector + i.message; if (seen.has(k)) issues.splice(issues.indexOf(i), 1); else seen.add(k); }
  // Drift is one screen drawing a component one way and another screen drawing it another way, at the same device size.
  // A class used several ways inside one screen is context, and phone against desktop is responsive design: neither is drift.
  for (const [group, looks] of Object.entries(byClass)) {
    const [cls] = group.split(' @'), variants = Object.entries(looks);
    const apart = variants.some(([, a], i) => variants.some(([, b], j) => j > i && [...a].every(x => !b.has(x))));
    if (variants.length > 1 && apart && variants.length <= 4)
      issues.push({frame: '*', mode: 'light', severity: 'warn', kind: 'drift', selector: '.' + cls, message: `.${cls} renders ${variants.length} ways on different screens: ${variants.map(([look, fr]) => `${look} (${[...fr].join(', ')})`).join('; ')}`});
  }
  const staticIssues = [];
  { const log = console.log; console.log = line => staticIssues.push(String(line)); try { check(); } finally { console.log = log; } }
  const wanted = new Set(frames.map(f => f.id)), blocks = [];
  for (const line of staticIssues.join('\n').split('\n')) { if (!line.startsWith(' ')) blocks.push([line]); else if (blocks.length) blocks[blocks.length - 1].push(line); }
  const detached = blocks.filter(b => wanted.has(b[0]) && b.slice(1).some(l => /detached|does not link/.test(l))).map(b => b.join('\n')).join('\n');
  const errors = issues.filter(i => i.severity === 'error').length;
  activity('check', errors ? `Found ${errors} problem${errors === 1 ? '' : 's'} to fix${issues.length - errors ? `, ${issues.length - errors} to look at` : ''}` : `Checks pass${issues.length ? `, ${issues.length} warning${issues.length === 1 ? '' : 's'}` : ''}`, frames.length === 1 ? frames[0].id : '');
  if (json) console.log(JSON.stringify({errors, warnings: issues.length - errors, quick: argv.includes('--quick'), issues, detached}, null, 2));
  else {
    for (const i of issues) console.log(`${i.severity === 'error' ? 'ERROR' : 'warn '}  ${i.frame}${i.mode === 'dark' ? ' (dark)' : ''}  ${i.selector}\n       ${i.message}`);
    if (detached) console.log(detached);
    console.log(issues.length ? `\n${errors} error${errors === 1 ? '' : 's'}, ${issues.length - errors} warning${issues.length - errors === 1 ? '' : 's'} in ${frames.length} screen${frames.length === 1 ? '' : 's'}.` : `All ${frames.length} screens pass.`);
    if (argv.includes('--quick')) console.log('Quick: rules only. The pairs and the judge did not run, so run verify without --quick before you show anything.');
  }
  return errors ? 1 : 0;
}

async function diffFrames(names) {
  const state = readState(), frames = pickFrames(state, names), results = [], out = join(dir, '.renders');
  mkdirSync(out, {recursive: true});
  await withBrowser(async (browser, base) => {
    const blank = await (await browser.newContext()).newPage();
    for (const f of frames) for (const mode of modesFor()) for (const [device, w, h] of devicesFor(f)) {
      const snap = join(dir, '.history', 'snapshots', `${safe(f.id)}.${device}.${mode}.png`);
      const {context, page} = await openPage(browser, base + f.src.split('/').map(encodeURIComponent).join('/'), w, h, mode);
      const now = await page.screenshot({fullPage: true}); await context.close();
      mkdirSync(dirname(snap), {recursive: true});
      if (!existsSync(snap)) { writeFileSync(snap, now); results.push({frame: f.id, device, mode, baseline: true}); continue; }
      const d = await blank.evaluate(diffImages, {a: readFileSync(snap).toString('base64'), b: now.toString('base64')});
      const file = join(out, `${safe(f.id)}.${device}.${mode}.diff.png`);
      writeFileSync(file, Buffer.from(d.png, 'base64'));
      renameSync(snap, snap.replace(/\.png$/, '.prev.png')); writeFileSync(snap, now);
      results.push({frame: f.id, device, mode, changed: +(100 * d.changed / d.total).toFixed(2), size: d.sizes[0] === d.sizes[2] && d.sizes[1] === d.sizes[3] ? 'same' : `${d.sizes[0]}×${d.sizes[1]} → ${d.sizes[2]}×${d.sizes[3]}`, file});
    }
  });
  if (json) console.log(JSON.stringify(results, null, 2));
  else for (const r of results) console.log(r.baseline ? `${r.frame}  ${r.device} ${r.mode}  no earlier render; this one is the baseline` : `${r.frame}  ${r.device} ${r.mode}  ${r.changed}% of pixels changed${r.size === 'same' ? '' : `, size ${r.size}`}  ${r.file}`);
}

async function compare(frameId, url) {
  if (!frameId || !/^https?:\/\//.test(url || '')) { console.error('Usage: canvas.mjs compare <frame> <http url of the built screen> [--device phone|desktop] [--mode light|dark]'); process.exit(2); }
  const state = readState(), [f] = pickFrames(state, [frameId]), [[device, w, h]] = devicesFor(f), mode = modesFor()[0];
  activity('compare', `Comparing the build of ${f.name} with its design`, f.id);
  const out = join(dir, '.renders', 'compare'); mkdirSync(out, {recursive: true});
  const result = await withBrowser(async (browser, base) => {
    const shoot = async target => { const {context, page} = await openPage(browser, target, w, h, mode); const png = await page.screenshot({fullPage: true}); const data = await page.evaluate(analyzeFrame, {width: w}); await context.close(); return {png, data}; };
    const design = await shoot(base + f.src.split('/').map(encodeURIComponent).join('/')), build = await shoot(url);
    const blank = await (await browser.newContext()).newPage();
    const d = await blank.evaluate(diffImages, {a: design.png.toString('base64'), b: build.png.toString('base64')});
    const stem = join(out, `${safe(f.id)}.${device}.${mode}`);
    writeFileSync(stem + '.design.png', design.png); writeFileSync(stem + '.build.png', build.png); writeFileSync(stem + '.diff.png', Buffer.from(d.png, 'base64'));
    // The same text can appear several times (a nav link and a button); pair the k-th design occurrence with the k-th built one.
    const norm = t => t.toLowerCase().replace(/\s+/g, ' ').trim(), built = new Map(), seen = new Map();
    for (const n of build.data.nodes.filter(n => n.text)) { const k = norm(n.text); if (!built.has(k)) built.set(k, []); built.get(k).push(n); }
    const missing = [], different = [];
    for (const n of design.data.nodes.filter(n => n.text)) {
      const k = norm(n.text), i = seen.get(k) || 0; seen.set(k, i + 1);
      const b = built.get(k)?.[i]; if (!b) { missing.push(n.text); continue; }
      for (const k of ['font-size', 'font-weight', 'color', 'background', 'radius', 'padding']) {
        const x = n.styles[k]?.value || '', y = b.styles[k]?.value || '';
        if (x !== y) different.push(`“${n.text.slice(0, 30)}” ${k}: design ${x || 'none'}, build ${y || 'none'}`);
      }
      if (Math.abs(n.box[2] - b.box[2]) > 4 || Math.abs(n.box[3] - b.box[3]) > 4) different.push(`“${n.text.slice(0, 30)}” size: design ${n.box[2]}×${n.box[3]}, build ${b.box[2]}×${b.box[3]}`);
    }
    return {frame: f.id, url, device, mode, changed: +(100 * d.changed / d.total).toFixed(2), designSize: `${d.sizes[0]}×${d.sizes[1]}`, buildSize: `${d.sizes[2]}×${d.sizes[3]}`, missing, different, files: {design: stem + '.design.png', build: stem + '.build.png', diff: stem + '.diff.png'}};
  });
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${result.frame} vs ${result.url}  (${device} ${mode})\n${result.changed}% of pixels differ · design ${result.designSize}, build ${result.buildSize}`);
    if (result.missing.length) console.log(`Text in the design but not in the build:\n  ${result.missing.slice(0, 20).join('\n  ')}`);
    if (result.different.length) console.log(`Differences:\n  ${result.different.slice(0, 30).join('\n  ')}`);
    if (!result.missing.length && !result.different.length) console.log('Every text element matches the design in type, color, spacing and size.');
    console.log(`Images: ${result.files.design}\n        ${result.files.build}\n        ${result.files.diff}`);
  }
  return result.missing.length || result.different.length ? 1 : 0;
}

// The traced screen beside the reference it traces, at the same width and crop, so structure can be compared by eye.
/** Renders one screen beside one reference, asks the judge, and records the verdict. Returns {error} when the reference cannot be read. */
async function pairCore(f, ref, {mode = 'light', tall: wanted, example = false} = {}) {
  const [[device, w, h]] = devicesFor(f);
  const tall = wanted || (example ? 'full' : String(h)), full = tall === 'full';
  let refData = null;
  if (!/^https?:\/\//.test(ref)) {
    const file = [resolve(dir, ref), resolve(dir, 'refs', ref), resolve(ref)].find(p => existsSync(p));
    if (!file) return {error: `No reference "${ref}" in ${dir}, ${join(dir, 'refs')} or the working directory.`};
    const type = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif'}[extname(file).toLowerCase()];
    if (!type) return {error: 'The reference must be a png, jpg, webp, gif or avif image, or an http url.'};
    refData = `data:${type};base64,${readFileSync(file).toString('base64')}`;
  }
  const out = join(dir, '.renders', 'pair'); mkdirSync(out, {recursive: true});
  const file = join(out, `${safe(f.id)}.${device}.${mode}.png`);
  activity('judge', `Comparing ${f.name} with ${example ? 'the worked example' : basename(ref.replace(/[?#].*$/, ''))}`, f.id);
  await withBrowser(async (browser, base) => {
    const shoot = async target => { const {context, page} = await openPage(browser, target, w, h, mode); const png = await page.screenshot({fullPage: true}); await context.close(); return `data:image/png;base64,${png.toString('base64')}`; };
    const mine = await shoot(base + f.src.split('/').map(encodeURIComponent).join('/'));
    const theirs = refData || await shoot(ref);
    const H = full ? null : Number(tall), gap = 24, label = 36;
    const page = await (await browser.newContext({viewport: {width: w * 2 + gap * 3, height: (H || h) + label + gap * 2}})).newPage();
    const cell = src => `<figure><figcaption></figcaption><div class="crop"><img src="${src}"></div></figure>`;
    await page.setContent(`<!doctype html><style>body{margin:0;padding:${gap}px;display:flex;gap:${gap}px;background:#e7e5e0;font:600 15px system-ui}figure{margin:0;width:${w}px}figcaption{height:${label}px}figure:first-child figcaption::before{content:"Yours"}figure:last-child figcaption::before{content:"Reference"}.crop{width:${w}px;${H ? `height:${H}px;` : ''}overflow:hidden;background:#fff}img{display:block;width:${w}px}</style>${cell(mine)}${cell(theirs)}`);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
    await page.screenshot({path: file, fullPage: true});
  });
  // One image per reference is kept as well, so pairing against a second reference does not erase the first.
  const refName = basename(ref.replace(/[?#].*$/, '')) || ref, kept = join(out, `${safe(f.id)}.${device}.${mode}.${safe(refName)}.png`);
  writeFileSync(kept, readFileSync(file));
  const judge = argv.includes('--no-judge') ? null : await seenryScript('judge_pair.mjs');
  const verdict = judge ? judge.judgePair({image: kept, screen: `${f.name || f.id}, a new ${device} screen`, reference: refName, example}) : {skipped: argv.includes('--no-judge') ? '--no-judge' : 'the seenry skill is not installed beside seenry-canvas'};
  const entries = [...readPairs().filter(e => !(e.frame === f.id && e.reference === refName && e.device === device)), {frame: f.id, src: f.src, reference: refName, device, mode, file: relative(dir, kept), at: new Date().toISOString(), verdict}];
  writeFileSync(pairLog(), JSON.stringify({entries}, null, 2));
  if (!verdict.skipped) activity('judge', verdict.reskin || verdict.less_finished ? `Judge: ${f.name} is ${[verdict.reskin && 'a reskin', verdict.less_finished && 'less finished'].filter(Boolean).join(' and ')}; reworking it` : `Judge: ${f.name} holds up beside ${refName}`, f.id);
  const blocks = judge?.blocked(verdict) ? judge.pairBlocks([{frame: f.id, reference: refName, verdict}]) : [];
  return {frame: f.id, reference: ref, refName, device, mode, file, kept, verdict, blocks, full, tall};
}

async function pair(frameId, ref) {
  if (!frameId || !ref) { console.error('Usage: canvas.mjs pair <screen> <reference image in refs/, or an http url> [--height <px>|full] [--mode light|dark] [--no-judge]'); process.exit(2); }
  const [f] = pickFrames(readState(), [frameId]);
  const r = await pairCore(f, ref, {mode: modesFor()[0], tall: flag('height')});
  if (r.error) { console.error(r.error); process.exit(2); }
  const {device, mode, file, kept, verdict, blocks, full, tall} = r;
  if (json) console.log(JSON.stringify({frame: f.id, reference: ref, device, mode, file, kept, verdict, blocked: blocks.length > 0}, null, 2));
  else {
    console.log(`${f.id} beside ${ref}  (${device} ${mode}, ${full ? 'full height' : `top ${tall}px`})\n${file}\nLook at both: grid, proportions, type scale, how much of the screen images fill, density. Fix what drifted back toward the default.`);
    if (verdict.skipped) console.log(`Not judged: ${verdict.skipped}. verify will warn until a judge has seen it.`);
    else console.log(`Judge (${verdict.by || 'stub'}): reskin ${verdict.reskin ? 'YES' : 'no'}${verdict.reskin_why ? ` (${verdict.reskin_why})` : ''}; less finished ${verdict.less_finished ? 'YES' : 'no'}${verdict.gaps?.length ? '\n  ' + verdict.gaps.join('\n  ') : ''}${verdict.keep ? `\nKeep: ${verdict.keep}` : ''}`);
    for (const b of blocks) console.log(`BLOCKED  ${b}`);
  }
  if (blocks.length) process.exitCode = 1;
}

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), here]) {
    try { return await import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  return null;
}

const port = Number(flag('port', 4600));
if (command === 'init') {
  init(); console.log(`Canvas folder ready: ${dir}`);
} else if (command === 'serve') {
  serve(port);
} else if (command === 'open') {
  const info = await startServer();
  if (!info) { console.error(`The canvas did not start. See ${join(dir, '.canvas.log')}, or run "node canvas.mjs static" for a file that opens from disk.`); process.exit(1); }
  const state = readState(), design = state.sections.filter(s => !s.reference && !s.system), count = design.reduce((n, s) => n + s.frames.length, 0);
  const url = `http://127.0.0.1:${info.port}/`, app = argv.includes('--browser') ? '' : hostApp(), opened = app ? false : launch(url);
  console.log(`Seenry canvas: ${url}  (${count} screen${count === 1 ? '' : 's'} in ${design.length} section${design.length === 1 ? '' : 's'})${opened ? ', opened in the browser' : ''}`);
  if (app) console.log(`Running inside ${app}: open ${url} in its preview pane so the person stays in the app (it fits a side pane). Pass --browser for a separate tab.`);
  else if (!opened) console.log('No browser here. Give the person the address, or run "canvas.mjs shot" and show canvas.png.');
  activity('open', 'Opened the canvas for you');
  const took = markShown(); if (took) console.log(`First option shown ${took} after the canvas was started.`);
  if (state.error) console.log(state.error);
} else if (command === 'list') {
  const state = readState();
  if (json) console.log(JSON.stringify({title: state.title, stage: state.stage, library: state.library, flows: state.flows, sections: state.sections.map(s => ({id: s.id, name: s.name, status: s.status, options: !!s.choose, system: !!s.system, frames: s.frames.map(f => ({id: f.id, name: f.name, file: f.src, device: f.device, size: [f.w, f.h], links: f.links, specs: f.specs || 0, review: state.approvals[f.id] || null}))}))}, null, 2));
  else printList(state);
} else if (command === 'render') {
  await render(positional);
} else if (command === 'tree') {
  await tree(positional);
} else if (command === 'verify') {
  process.exitCode = await verify(positional);
} else if (command === 'diff') {
  await diffFrames(positional);
} else if (command === 'compare') {
  process.exitCode = await compare(positional[0], positional[1]);
} else if (command === 'pair') {
  await pair(positional[0], positional[1]);
} else if (command === 'check') {
  process.exit(check());
} else if (command === 'status') {
  const [section, status] = positional;
  const state = readState();
  if (!STATUSES[status] || !state.sections.some(s => s.id === section && !s.system)) { console.error(`Usage: canvas.mjs status <section> <${Object.keys(STATUSES).join('|')}>. Sections: ${state.sections.filter(s => !s.system && !s.reference).map(s => s.id).join(', ')}`); process.exit(2); }
  const manifest = readManifest(); manifest.sections = {...manifest.sections, [section]: {...manifest.sections?.[section], status}}; writeManifest(manifest);
  console.log(`${section}: ${STATUSES[status]}`);
} else if (command === 'archive') {
  console.log(`Archived ${archiveFrame(readState(), positional[0], flag('reason'))}`);
} else if (command === 'resolve') {
  resolveOptions(readState(), positional[0]);
} else if (command === 'log') {
  if (!positional[0]) { console.error('Usage: canvas.mjs log "what changed and why"'); process.exit(2); }
  const manifest = readManifest(); manifest.log = [...(Array.isArray(manifest.log) ? manifest.log : []), {at: new Date().toISOString(), text: positional[0]}]; writeManifest(manifest);
  console.log('Logged.');
} else if (command === 'handoff') {
  handoff();
} else if (command === 'plan') {
  if (!positional.length) { console.error('Usage: canvas.mjs plan <file>… [--dir dir], e.g. plan 02-home.options/quiet.html 02-home.options/ledger.html'); process.exit(2); }
  const bad = positional.filter(p => p.split('/').length > 2 || !/\.html$/i.test(p) || !inside(p));
  if (bad.length) { console.error(`Not a screen path inside the canvas: ${bad.join(', ')}. Use <section>/<file>.html.`); process.exit(2); }
  if (!existsSync(dir)) init();
  const manifest = readManifest();
  if (!manifest.started) manifest.started = new Date().toISOString();
  manifest.planned = [...new Set([...(Array.isArray(manifest.planned) ? manifest.planned : []), ...positional])].filter(p => !existsSync(join(dir, String(p))));
  writeManifest(manifest);
  activity('plan', `Planning ${positional.length} screen${positional.length === 1 ? '' : 's'}: ${positional.map(p => pretty(basename(p).replace(/(\.(phone|tablet|laptop|desktop))?\.html$/i, ''))).join(', ')}`);
  console.log(manifest.planned.length ? `Planned: ${manifest.planned.join(', ')}. Each shows as a placeholder on the canvas until its file is written.` : 'Every planned screen already exists.');
} else if (command === 'say') {
  if (!positional[0]) { console.error('Usage: canvas.mjs say "what you are doing, in one line" [--frame <screen>]'); process.exit(2); }
  activity('say', positional[0], flag('frame', ''));
  console.log('Shown on the canvas.');
} else if (command === 'round') {
  round(positional[0], flag('unattended'));
} else if (command === 'stop') {
  const info = running();
  if (info) { try { process.kill(info.pid); } catch {} }
  rmSync(pidFile, {force: true});
  console.log(info ? 'Canvas stopped.' : 'No canvas was running.');
} else if (command === 'feedback' || command === 'wait') {
  const path = join(dir, 'feedback.json');
  const newest = () => { const s = readState(); return Math.max(mtime(join(dir, 'canvas.json')), ...s.sections.flatMap(x => x.frames.map(f => f.rev)), 0); };
  const fresh = () => existsSync(path) && mtime(path) >= newest();
  const seconds = command === 'wait' ? Number(flag('timeout', 1800)) : Number(flag('wait', 0));
  const deadline = Date.now() + seconds * 1000;
  if (command === 'wait') {
    if (!running()) console.log('The canvas is not running; start it with "canvas.mjs open".');
    writeFileSync(waitFile, JSON.stringify({pid: process.pid}));
    const clear = () => { try { if (JSON.parse(readFileSync(waitFile, 'utf8')).pid === process.pid) rmSync(waitFile, {force: true}); } catch {} };
    process.on('exit', clear); process.on('SIGINT', () => process.exit(130)); process.on('SIGTERM', () => process.exit(143));
    console.log(`Waiting for the person to press "Send to agent" (up to ${Math.round(seconds / 60)} min)…`);
  }
  while (!fresh() && Date.now() < deadline) await new Promise(r => setTimeout(r, 1000));
  if (!fresh()) { console.log(command === 'wait' ? 'No feedback yet. Run "canvas.mjs wait" again, or "canvas.mjs feedback" once the person says they sent it.' : existsSync(path) ? 'No feedback yet on the current screens (feedback.json is older than the latest change).' : 'No feedback yet.'); process.exit(3); }
  const feedback = JSON.parse(readFileSync(path, 'utf8'));
  if (json) console.log(JSON.stringify(feedback, null, 2)); else printFeedback(feedback);
} else if (command === 'static') {
  if (!existsSync(dir)) init();
  writeFoundations();
  markShown();
  writeFileSync(join(dir, 'canvas.html'), page(readState()));
  console.log(`Wrote ${join(dir, 'canvas.html')}. It opens from disk; feedback is copied as text to paste to the agent.`);
} else if (command === 'shot') {
  const playwright = await loadPlaywright();
  if (!playwright) { console.error('Playwright not found. Install it in the project or pass --playwright <path to playwright/index.mjs>.'); process.exit(2); }
  const chromium = playwright.chromium || playwright.default?.chromium;
  const info = await startServer();
  if (!info) { console.error('The canvas did not start; see .canvas.log.'); process.exit(1); }
  const browser = await chromium.launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
  const tab = await browser.newPage({viewport: {width: Number(flag('width', 2000)), height: Number(flag('height', 1300))}, deviceScaleFactor: 1});
  const all = flag('view', 'decision') === 'all';
  await tab.goto(`http://127.0.0.1:${info.port}/?view=${all ? 'map' : 'board'}`);
  await tab.waitForTimeout(2500);
  if (all) { await tab.addStyleTag({content: '#panel,#zoom,#hint,#topbar,#left{display:none!important} #viewport{inset:0!important}'}); await tab.evaluate(() => document.getElementById('zoom-fit').click()); }
  else await tab.addStyleTag({content: '#topbar,#c-rail,#c-live{display:none!important} #compact{inset:0!important;grid-template-columns:1fr!important;grid-template-areas:"list"!important}'});
  await tab.waitForTimeout(300);
  await tab.screenshot({path: join(dir, 'canvas.png')});
  await browser.close();
  if (info.started) { try { process.kill(info.pid); } catch {} rmSync(pidFile, {force: true}); }
  markShown();
  console.log(`Wrote ${join(dir, 'canvas.png')}`);
} else {
  console.error('Usage: node canvas.mjs init|plan|say|open|wait|feedback|list|check|render|tree|verify|diff|compare|pair|round|status|resolve|archive|log|handoff|static|shot|serve|stop'); process.exit(2);
}
