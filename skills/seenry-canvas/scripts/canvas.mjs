#!/usr/bin/env node
/** The Seenry canvas: a local design canvas. Every screen is a live HTML frame; folders are sections (flows).
 *  The person pans, zooms, approves screens, picks between options and pins comments; the agent reads them back.
 *
 *  node canvas.mjs init   [dir]            create the canvas folder with wire.css and a starter tokens.css
 *  node canvas.mjs open   [dir] [--port n] [--no-browser|--browser]   start the canvas on a per-project port; inside an agent app,
 *                                        print the exact call for its own pane instead of opening a tab
 *  node canvas.mjs serve  [dir] [--port n] run it in the foreground
 *  node canvas.mjs wait   [dir] [--timeout seconds]   block until the person presses Send, then print it; returns within
 *                                        100 s with a resume line unless --timeout is given
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
 *  node canvas.mjs plan <file>… [--parts "Nav,Hero"] [--dir dir]   name the screens (and their parts) you are about to draw
 *  node canvas.mjs say "what you are doing" [--frame id] [dir]   one line on the canvas's live activity feed, for the person watching
 *
 *  The agent's eyes (Playwright): screens are ids or section names; none means every screen. --dir picks the canvas.
 *  node canvas.mjs render  [screens] [--device phone|tablet|desktop|all] [--mode light|dark|both] [--scale 2]   PNGs to look at
 *  node canvas.mjs tree    [screens]     the layout: boxes, text, the variable behind each style, specs, links
 *  node canvas.mjs verify  [screens]     overflow, clipped text, contrast in both modes, small text and targets, names,
 *                                        broken links, detached values, components drawn differently across screens; for
 *                                        sketches, an idea line and a real image in the hero; for the picked page, the
 *                                        image or its motif returning below the hero; for options, the execution bar
 *                                        (product view inventory, hue families, headline lines and size)
 *  node canvas.mjs verify --studio       also the written teardown and a blind judge on each option beside its
 *                                        references; --judge runs the judge alone, for a run nobody can review
 *  node canvas.mjs diff    [screens]     what visibly changed since the last render
 *  node canvas.mjs compare <screen> <url>   the built screen against its design: pixels, missing text, style differences
 *  --json on list, feedback, render, tree, verify, diff and compare prints machine-readable output.
 *  node canvas.mjs static [dir]            write canvas.html, which opens from disk with no server
 *  node canvas.mjs shot   [dir] [--playwright path]  write canvas.png, for sessions with no browser to show
 *  node canvas.mjs link   [dir]            link this machine to Seenry (sync.mjs link), then sync the canvas in the background
 *  node canvas.mjs sync   [push|pull|status|unlink] [dir]   pass through to sync.mjs; with none, start the background watch
 *  node canvas.mjs stop   [dir]            stop the canvas and its sync
 *
 *  dir defaults to .seenry/canvas. Layout on disk:
 *    01-onboarding/01-welcome.phone.html   a folder is a section, a file is a frame, numbers set the order
 *    02-home.options/a.html, b.html        a folder ending .options holds alternatives: the person picks one
 *    refs/*.png                            reference screenshots, shown as their own section
 *    components.css                        the shared components every screen links; "@component" lines generate their sheet
 *  A file ending .phone.html, .tablet.html or .laptop.html renders at that device size; anything else is desktop.
 *  A frame's name is its <title>; <meta name="seenry-caption" content="..."> is the short line shown under it (else
 *  the axis up to its first colon or comma); <meta name="seenry-note" content="..."> is read when it is selected.
 *  <meta name="seenry-fidelity" content="sketch"> marks a one-screen sketch: the first screen only, extended after the pick.
 *  <meta name="seenry-idea" content="…"> is the one idea that carries the page, and how image and interface meet.
 *  A link from one screen to another (<a href="02-next.phone.html">) is a prototype connection: the canvas draws it
 *  and Present mode follows it, like a Figma prototype.
 *  Plain Node, no packages, bound to 127.0.0.1. */
import {createServer} from 'node:http';
import {existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, openSync, readSync, closeSync, renameSync, realpathSync} from 'node:fs';
import {resolve, join, extname, basename, dirname, sep, relative} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {createRequire} from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'open';
const flag = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };
const SWITCHES = new Set(['--no-browser', '--browser', '--json', '--no-judge', '--quick', '--studio', '--judge']);
// Arguments after the command that are not a --flag or a flag's value.
const positional = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--') && !SWITCHES.has(all[i - 1])));
const ARGS = {status: 2, resolve: 1, archive: 1, log: 1, round: 1, say: 1, sync: 1}[command] || 0;
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

/** Where the agent runs, and the exact way to show a local page in that app's own pane. A plain terminal gets a browser tab. */
function host() {
  const e = process.env, bundle = e.__CFBundleIdentifier || '', term = e.TERM_PROGRAM || '';
  if (e.CLAUDE_CODE_REMOTE === 'true' || e.CONDUCTOR_IS_LOCAL === '0') return {id: 'cloud', name: 'a cloud session'};
  if (e.T3CODE_THREAD_ID || e.CLAUDE_CODE_ENTRYPOINT === 't3-code' || /t3code/i.test(bundle))
    return {id: 't3', name: 'T3 Code', tell: (url, port) => `Call preview_open with target {"kind": "environment-port", "port": ${port}} (or url ${url}) to show it in T3 Code's preview pane.`};
  if (e.CODEX_THREAD_ID || /com\.openai\.codex/i.test(bundle))
    return {id: 'codex', name: 'the Codex app', tell: url => `Use @Browser to open ${url} in the Codex app's browser.`};
  if (/^claude-desktop/.test(e.CLAUDE_CODE_ENTRYPOINT || '') || /com\.anthropic\.claude/i.test(bundle))
    return {id: 'claude', name: 'the Claude app', tell: url => `Open ${url} in the Browser pane (preview_start, or start "Seenry canvas" from .claude/launch.json).`};
  if (e.CURSOR_AGENT || /cursor/i.test(bundle))
    return {id: 'cursor', name: 'Cursor', tell: url => `Call browser_navigate with url ${url} to show it in Cursor's browser (Cursor asks the person to approve it).`};
  if (e.ANTIGRAVITY_AGENT || /antigravity/i.test(bundle + term))
    return {id: 'antigravity', name: 'Antigravity', tell: url => `Open ${url} with Antigravity's browser preview tool.`};
  if (Object.keys(e).some(k => k.startsWith('DEVIN_')) || /devin/i.test(bundle))
    return {id: 'devin', name: 'Devin', tell: url => `Open ${url} with Devin's preview tool.`};
  if (term === 'vscode' && !e.CLAUDECODE)
    return {id: 'vscode', name: 'VS Code', tell: url => `Call openBrowserPage with url ${url} to show it in VS Code's browser.`};
  return null;
}

/** One port per project, so the address the person has open stays the same across restarts. */
function stablePort() {
  let h = 2166136261;
  for (const c of dir) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return 4600 + h % 900;
}

/** The Claude app's Browser pane starts servers from .claude/launch.json: keep a canvas entry there on this port. */
function writeLaunch(port) {
  const root = basename(dirname(dir)) === '.seenry' ? dirname(dirname(dir)) : process.cwd(), path = join(root, '.claude', 'launch.json');
  let json = {version: '0.0.1', configurations: []};
  try { json = JSON.parse(readFileSync(path, 'utf8')); } catch {}
  const entry = {name: 'Seenry canvas', runtimeExecutable: process.execPath, runtimeArgs: [fileURLToPath(import.meta.url), 'serve', dir, '--port', String(port)], port};
  json.configurations = [...(Array.isArray(json.configurations) ? json.configurations.filter(c => c && c.name !== entry.name) : []), entry];
  try { mkdirSync(dirname(path), {recursive: true}); writeFileSync(path, JSON.stringify(json, null, 2) + '\n'); return path; } catch { return ''; }
}

// ---------- Online sync: sync.mjs keeps the link token in the config folder and a watch record in the canvas ----------
const syncScript = join(here, 'sync.mjs');
const syncFile = () => join(dir, '.sync.json');
function syncConfig() {
  const folder = process.env.SEENRY_CONFIG_DIR || join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'seenry');
  try { const c = JSON.parse(readFileSync(join(folder, 'canvas-sync.json'), 'utf8')); return c && c.token ? c : null; } catch { return null; }
}
function syncWatching() {
  try { const info = JSON.parse(readFileSync(syncFile(), 'utf8')); process.kill(info.pid, 0); return info; } catch { return null; }
}
/** What the page may know: never the token. */
function syncInfo() {
  const config = syncConfig(), watching = config ? syncWatching() : null;
  return {available: existsSync(syncScript), linked: !!config, watching: !!watching, server: config ? String(config.server || '') : '', account: config?.account?.email || '', url: watching?.url || ''};
}
/** Starts sync.mjs watch in the background when this machine is linked and nothing watches this canvas yet. */
function startSync() {
  if (!existsSync(syncScript) || !syncConfig()) return null;
  const was = syncWatching(); if (was) return was;
  mkdirSync(dir, {recursive: true});
  const log = openSync(join(dir, '.sync.log'), 'a');
  const child = spawn(process.execPath, [syncScript, 'watch', dir], {detached: true, stdio: ['ignore', log, log]});
  child.unref();
  writeFileSync(syncFile(), JSON.stringify({pid: child.pid, started: new Date().toISOString()}));
  return {pid: child.pid, started: true};
}
function stopSync() {
  const info = syncWatching(); if (info) { try { process.kill(info.pid); } catch {} }
  rmSync(syncFile(), {force: true});
  return !!info;
}
/** The canvas's address on Seenry, through the API sync.mjs uses; pushes once when the canvas is not online yet. */
async function onlineUrl() {
  const config = syncConfig(); if (!config) return null;
  const key = createHash('sha256').update('seenry-canvas:' + realpathSync(dir)).digest('hex');
  const find = async () => {
    const response = await fetch(String(config.server).replace(/\/+$/, '') + '/api/canvas/sync/status', {headers: {authorization: `Bearer ${config.token}`}, signal: AbortSignal.timeout(8000)});
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || `Seenry answered ${response.status}`);
    return (data.canvases || []).find(c => c.localKey === key)?.url || '';
  };
  let url = await find();
  if (!url && existsSync(syncScript)) {
    const pushed = spawnSync(process.execPath, [syncScript, 'push', dir], {encoding: 'utf8', timeout: 60000});
    if (pushed.status !== 0) throw new Error((pushed.stderr || pushed.stdout || 'The push failed').trim().split('\n').at(-1));
    url = await find();
  }
  return url;
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
  try { const info = JSON.parse(readFileSync(waitFile, 'utf8')); if (info.until > Date.now()) return true; process.kill(info.pid, 0); return true; } catch { return false; }
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

/** The line under a frame: seenry-caption, else the axis up to its first colon or comma, both cut to about 48 characters. */
function captionOf(meta = {}, note = '') {
  const fit = text => { text = String(text || '').replace(/\s+/g, ' ').trim(); if (text.length <= 48) return text; const cut = text.slice(0, 48); return cut.slice(0, cut.lastIndexOf(' ') > 24 ? cut.lastIndexOf(' ') : 47).replace(/[\s,;:.\u2014-]+$/, '') + '…'; };
  if (meta.caption) return fit(meta.caption);
  if (meta.axis) return fit(meta.axis.split(/\s*[:,;\u2014]\s*|\s+-\s+/)[0]);
  return fit(note);
}

function frameFrom(folder, file, root = dir, prefix = '') {
  const rel = folder ? `${folder}/${file}` : file;
  const stem = file.replace(/\.html$/i, '');
  const device = Object.keys(DEVICES).find(d => stem.toLowerCase().endsWith('.' + d)) || 'desktop';
  const clean = device === 'desktop' && !stem.toLowerCase().endsWith('.desktop') ? stem : stem.slice(0, stem.lastIndexOf('.'));
  const {title, note, meta} = head(join(root, rel));
  const [w, h] = DEVICES[device];
  return {id: prefix + idFor(folder, file), kind: 'page', src: prefix + rel, name: title || pretty(clean), note, caption: captionOf(meta, note), device, w, h, rev: mtime(join(root, rel)), links: linksOf(folder, file, root), specs: specsIn(join(root, rel)).length,
    axis: meta.axis || '', wins: meta.wins || '', cost: meta.cost || '', risk: /^(safe|bold)$/i.test(meta.risk || '') ? meta.risk.toLowerCase() : '', ask: (meta.ask || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 4), sketch: /^sketch$/i.test(meta.fidelity || ''), idea: (meta.idea || '').trim()};
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
    section.frames.push({id: idFor(folder, name), kind: 'pending', src: '', rel, name: pretty(stem.replace(new RegExp('\\.' + device + '$', 'i'), '')), note: 'Being drawn', device, w, h, rev: 0, links: [], ask: []});
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
  // The parts a screen will have (plan --parts) and the parts it has: the canvas outlines the ones still to come.
  const planned = manifest.parts && typeof manifest.parts === 'object' ? manifest.parts : {};
  for (const s of sections) for (const f of s.frames) {
    if (f.kind !== 'page' && f.kind !== 'pending') continue;
    const rel = f.kind === 'pending' ? f.rel : f.src;
    f.plan = Array.isArray(planned[rel]) ? planned[rel].map(String).slice(0, 12) : [];
    f.parts = f.kind === 'page' && !s.library ? partsIn(join(dir, f.src)) : [];
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
    timing: {started: manifest.started || '', firstOption: manifest.firstOption || ''}, activity: pending ? readActivity(30) : [],
    refs: (sections.find(s => s.reference)?.frames || []).map(f => ({id: f.id, src: f.src, name: f.name})), rounds: Array.isArray(manifest.log) ? manifest.log.length : 0,
    sync: syncInfo()};
  state.rev = [mtime(manifestPath), mtime(join(dir, 'review.json')), mtime(feedbackPath), mtime(activityFile()), state.agentWaiting, state.sync.linked, state.sync.watching, ...sections.flatMap(s => [s.id, ...s.frames.map(f => f.id + f.kind + f.rev)])].join('|');
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
/* Seenry's materials: white paper, #f4f4f3 wells, #171717 ink, hairlines, Open Runde, two sizes. One blue for live work and
   selection, amber for what needs the person, green for approved. Every other colour on the canvas comes from the screens. */
:root { color-scheme: light dark;
  --canvas: #efefed; --paper: #ffffff; --surface: #f4f4f3; --surface-2: #ececea; --ink: #171717; --on-ink: #ffffff; --text: #383838; --muted: #6d6d6d; --faint: #949494;
  --line: rgb(0 0 0 / .07); --line-2: rgb(0 0 0 / .13); --blue: #2b63e8; --blue-soft: #e9effd; --amber: #c2710c; --green: #1f8a4c; --live: #2b63e8;
  --float: 0 0 0 1px rgb(0 0 0 / .06), 0 10px 30px rgb(0 0 0 / .08), 0 2px 6px rgb(0 0 0 / .04);
  --shade: rgb(0 0 0 / .05); --frame-line: rgb(0 0 0 / .07); --tile: #171717; --eye: #ffffff; --avatar: #d8d3c8;
  --heading: var(--ink); --ink-2: var(--muted); --ink-3: var(--faint); --ok: var(--green); --warn: var(--amber); --sel: var(--blue); --line-strong: var(--line-2); --fill: rgb(0 0 0 / .045); --fill-2: rgb(0 0 0 / .08);
  --out: cubic-bezier(0.23, 1, 0.32, 1); --font: "Open Runde", ui-rounded, "SF Pro Rounded", system-ui, -apple-system, sans-serif; --side: 280px;
  font: 400 15px/1.35 var(--font); }
/* Dark is its own palette (seenry-web sx.css): near-black field, surfaces step up in lightness instead of casting shadows. */
@media (prefers-color-scheme: dark) { :root {
  --canvas: #0c0c0c; --paper: #181818; --surface: #222221; --surface-2: #2b2b2a; --ink: #f2f2f0; --on-ink: #111111; --text: #d6d6d4; --muted: #9a9a98; --faint: #767674;
  --line: rgb(255 255 255 / .08); --line-2: rgb(255 255 255 / .16); --blue: #7aa2ff; --blue-soft: rgb(122 162 255 / .16); --amber: #f0a046; --green: #4cc27e;
  --float: 0 0 0 1px rgb(255 255 255 / .08), 0 16px 40px rgb(0 0 0 / .5); --shade: rgb(0 0 0 / .45); --frame-line: rgb(255 255 255 / .1); --tile: #f2f2f0; --eye: #111111; --avatar: #3a3833;
  --fill: rgb(255 255 255 / .06); --fill-2: rgb(255 255 255 / .11); } }
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; overflow: hidden; background: var(--canvas); color: var(--text); -webkit-font-smoothing: antialiased; }
button, textarea, select, input { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
svg.i { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.spin { color: var(--blue); animation: spin 1.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
.float { background: var(--paper); box-shadow: var(--float); }
.ib { display: grid; place-items: center; width: 32px; height: 32px; flex: none; padding: 0; border: 0; border-radius: 9px; background: none; color: var(--muted); transition: background-color 150ms var(--out), color 150ms var(--out); }
.ib:hover, .ib[aria-pressed="true"], .ib[aria-expanded="true"] { background: var(--surface); color: var(--ink); }
.pill { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 13px; border: 0; border-radius: 99px; background: none; color: var(--ink); font: 500 13px/1 var(--font); white-space: nowrap; transition: background-color 150ms var(--out), opacity 150ms var(--out); }
.pill:hover { background: var(--surface); }
.pill.ink { background: var(--ink); color: var(--on-ink); }
.pill.ink:hover { opacity: .86; }
.pill.soft { background: var(--surface); }
.pill.soft:hover { background: var(--surface-2); }
.pill.ghost { color: var(--muted); padding: 0 8px; }
.pill:active, .ib:active { scale: .97; }
.sep { width: 1px; height: 18px; flex: none; margin: 0 4px; background: var(--line-2); }
.dot { width: 7px; height: 7px; flex: none; border-radius: 50%; }
.avatar { display: grid; place-items: center; width: 26px; height: 26px; flex: none; border-radius: 50%; background: var(--avatar); color: var(--ink); font: 600 11px/1 var(--font); }
.mark { display: block; flex: none; }
.mark svg { display: block; width: 100%; height: 100%; overflow: visible; }
.seen-tile { fill: var(--tile); }
.seen-eye { fill: var(--eye); transform-box: fill-box; transform-origin: center; }
.seen-look { transition: transform 280ms var(--out); }
.is-blink .seen-eye { animation: seen-blink 180ms var(--out); }
@keyframes seen-blink { 50% { transform: scaleY(0.12); } }

/* The canvas fills the window; everything else floats over it. */
#viewport { position: fixed; inset: 0; overflow: hidden; touch-action: none; user-select: none; -webkit-user-select: none; background: var(--canvas); }
#viewport.panning { cursor: grabbing; }
#viewport:is([data-tool="comment"], [data-tool="inspect"]) { cursor: crosshair; }
#world { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
.ui { position: absolute; transform-origin: 0 0; white-space: nowrap; }
.set { display: flex; align-items: center; gap: 10px; transform: scale(var(--inv)) translateY(-100%); font: 600 15px/26px var(--font); color: var(--ink); }
.set > span { font-weight: 400; color: var(--muted); }
.held { display: flex; align-items: center; gap: 8px; margin-left: 14px; font-size: 13px; font-weight: 400; color: var(--muted); }
.held span { display: flex; }
.held button { display: block; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 7px; margin-left: -6px; background: var(--surface) center / cover; box-shadow: 0 0 0 2px var(--canvas); }
.held button:first-child { margin-left: 0; }
.frame { position: absolute; }
.set[hidden], .frame[hidden] { display: none; }
.lab { left: 0; top: 0; width: calc(var(--w) * var(--z) * 1px); padding-bottom: 8px; display: flex; align-items: baseline; gap: 8px; transform: scale(var(--inv)) translateY(-100%); font-size: 13px; color: var(--faint); cursor: pointer; font-variant-numeric: tabular-nums; }
.lab b { flex: none; font-weight: 500; color: var(--ink); }
.lab > span:not(.st) { overflow: hidden; text-overflow: ellipsis; }
.lab .st { margin-left: auto; display: flex; align-items: center; gap: 5px; color: var(--muted); }
.lab .st svg { width: 14px; height: 14px; }
.frame[data-selected="true"] .lab b { color: var(--blue); }
.frame[data-building="true"] .lab .st { color: var(--blue); }
.frame[data-status="approved"] .lab .st { color: var(--green); }
.frame[data-status="change"] .lab .st { color: var(--amber); }
.cap { left: 0; top: 100%; width: calc(var(--w) * var(--z) * 1px); padding-top: 10px; transform: scale(var(--inv)); overflow: hidden; text-overflow: ellipsis; font-size: 13px; color: var(--muted); }
.body { position: absolute; inset: 0; overflow: hidden; border-radius: calc(5px * var(--inv)); background: #fff; box-shadow: 0 0 0 calc(1px * var(--inv)) var(--frame-line), 0 calc(6px * var(--inv)) calc(20px * var(--inv)) var(--shade); }
.frame[data-device="phone"] .body { border-radius: 36px; }
.frame[data-building="true"] .body { box-shadow: 0 0 0 calc(1.5px * var(--inv)) var(--blue), 0 calc(6px * var(--inv)) calc(20px * var(--inv)) var(--shade); }
.frame[data-selected="true"] .body { box-shadow: 0 0 0 calc(2px * var(--inv)) var(--blue), 0 calc(6px * var(--inv)) calc(20px * var(--inv)) var(--shade); }
.frame[data-archived="true"] .body { opacity: .55; }
.body iframe, .body img { display: block; width: 100%; height: 100%; border: 0; background: #fff; }
.body img { object-fit: cover; object-position: top; }
.shield { position: absolute; inset: 0; }
.frame[data-live="true"] .shield, #viewport:is([data-tool="comment"], [data-tool="inspect"]) .frame[data-kind="page"] .shield { display: none; }
.marks { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: inherit; }
.hl { position: absolute; border-radius: 2px; box-shadow: 0 0 0 calc(1.5px * var(--inv)) var(--blue); }
.pin { position: absolute; width: 26px; height: 26px; border-radius: 50%; transform: scale(var(--inv)) translate(6px, -25%); transform-origin: 0 0; background: #171717; color: #fff; box-shadow: 0 0 0 2px #fff, 0 2px 8px rgb(0 0 0 / .3); font: 600 12px/26px var(--font); text-align: center; font-variant-numeric: tabular-nums; }
.pin.l { transform: scale(var(--inv)) translate(calc(-100% - 6px), -25%); }
.tag { position: absolute; left: calc(-1.5px * var(--inv)); top: 0; height: 20px; padding: 0 6px; border-radius: 4px 4px 4px 0; transform: scale(var(--inv)) translateY(-100%); transform-origin: 0 0; background: var(--blue); color: #fff; font: 500 11px/20px var(--font); white-space: nowrap; }
.blank { position: absolute; inset: 0; background: #fff; }
.todo { position: absolute; left: 0; right: 0; bottom: 0; height: calc(12% + var(--n) * 12%); pointer-events: none; background: linear-gradient(rgb(255 255 255 / 0), #fff 18%); }
.todo .ghosts { inset: 22% 6% 5%; gap: 8%; }
#stage .todo .ghosts { gap: 10px; }
.ghosts { position: absolute; inset: 12% 6% 4%; display: flex; flex-direction: column; gap: 3%; }
.ghosts div { flex: 1; display: grid; place-items: center; border: calc(1.5px * var(--inv)) dashed #c4c8d2; border-radius: calc(5px * var(--inv)); color: #8a91a0; font: 400 calc(13px * var(--inv)) / 1 var(--font); }
.cursor { position: absolute; z-index: 2; display: flex; align-items: flex-start; pointer-events: none; transform: scale(var(--inv)); transform-origin: 0 0; }
.cursor svg, #pick-cursor svg { width: 15px; height: 15px; flex: none; filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / .25)); }
.cursor span { height: 22px; margin: 11px 0 0 -2px; padding: 0 9px; border-radius: 3px 99px 99px 99px; background: var(--live); color: #fff; font: 500 12px/22px var(--font); white-space: nowrap; }
#pick { display: flex; align-items: center; gap: 2px; height: 44px; padding: 0 6px; border-radius: 99px; transform: scale(var(--inv)) translateX(-50%); background: var(--paper); box-shadow: var(--float); z-index: 2; }
#pick[hidden] { display: none; }
#pick .pill:not(.ink) { color: var(--ink); }
#links { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
#links path { fill: none; stroke: var(--blue); stroke-width: calc(2px * var(--inv)); opacity: .5; }
#links circle { fill: var(--blue); }
#links[hidden] { display: none; }
.cover { position: absolute; inset: 0; padding: 96px 112px; display: grid; align-content: start; gap: 28px; background: #fff; color: #171717; font-size: 22px; line-height: 1.4; }
.cover h1 { margin: 0; font-size: 88px; line-height: 1; letter-spacing: -0.03em; font-weight: 600; }
.cover p { margin: 0; color: #6d6d6d; max-width: 30em; }
.cover .meta { font-size: 18px; }
.cover-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 40px; margin-top: 12px; }
.cover-row { display: flex; gap: 14px; align-items: baseline; padding: 12px 0; border-top: 1px solid rgb(0 0 0 / .07); }
.cover-row b { font-weight: 600; flex: 1; } .cover-row span { font-size: 17px; color: #6d6d6d; }
.cover h2 { margin: 20px 0 0; font-size: 20px; font-weight: 600; }
.cover li { font-size: 18px; color: #6d6d6d; }

/* The screen list: a floating panel that folds into a pill. */
#side { position: fixed; left: 12px; top: 12px; bottom: 12px; width: 268px; z-index: 4; display: flex; flex-direction: column; padding: 0 8px; border-radius: 18px; }
#side[hidden], #side-pill[hidden] { display: none; }
.sb-head { height: 52px; flex: none; display: flex; align-items: center; gap: 10px; padding: 0 4px; }
.sb-head b { font-weight: 600; color: var(--ink); }
#project { flex: none; width: 100%; height: 40px; display: flex; align-items: center; gap: 10px; padding: 0 10px; border: 0; border-radius: 10px; background: var(--surface); text-align: start; }
#project b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--ink); }
#project small { margin-left: auto; font-size: 13px; color: var(--muted); white-space: nowrap; }
.ptile { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border-radius: 6px; background: var(--blue); color: #fff; font: 600 12px/1 var(--font); }
#filter { flex: none; height: 36px; margin-top: 6px; padding: 0 10px; border: 0; border-radius: 10px; background: var(--surface); font-size: 13px; outline: none; }
#filter[hidden] { display: none; }
#list { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; margin: 0 -8px; padding: 0 8px 8px; scrollbar-width: thin; }
.gl { display: flex; justify-content: space-between; padding: 16px 10px 6px; font-size: 13px; color: var(--muted); }
.gl span { color: var(--faint); font-variant-numeric: tabular-nums; }
.it { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 10px; border: 0; border-radius: 10px; background: none; text-align: start; transition: background-color 150ms var(--out); }
.it:hover, .it[aria-current="true"] { background: var(--surface); }
.it > span:first-child { min-width: 0; }
.it .t, .it .sub { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.it .t { font-weight: 500; color: var(--ink); }
.it .sub { font-size: 13px; color: var(--muted); }
.it .rt { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.it .follow { color: var(--ink); }
.it .follow[data-on="true"] { color: var(--blue); }
.it .need { color: var(--amber); }
.it .ok { color: var(--green); }
.sb-empty { margin: 16px 10px; font-size: 13px; color: var(--muted); }
.sb-error { margin: 8px 2px 0; padding: 8px 10px; border-radius: 10px; background: color-mix(in oklab, var(--amber) 14%, transparent); color: var(--ink); font-size: 13px; }
.foot { flex: none; margin: 0 -8px; padding: 0 8px; border-top: 1px solid var(--line); }
.foot .ln { width: 100%; height: 40px; display: flex; align-items: center; gap: 6px; padding: 0 10px; border: 0; border-radius: 10px; background: none; font-size: 13px; color: var(--ink); margin-top: 4px; }
.foot .ln:hover { background: var(--surface); }
.foot .ln svg { color: var(--faint); }
.sync { height: 48px; display: flex; align-items: center; gap: 6px; padding: 0 10px; font-size: 13px; color: var(--muted); }
.sync[data-off="true"] { color: var(--amber); }
#side-pill { position: fixed; left: 12px; top: 12px; z-index: 4; height: 44px; display: flex; align-items: center; gap: 10px; padding: 0 14px 0 6px; border-radius: 14px; max-width: calc(100vw - 260px); }
#side-pill b { font-weight: 500; color: var(--ink); white-space: nowrap; }
#side-pill .work { display: flex; align-items: center; gap: 6px; padding-left: 10px; margin-left: 2px; border-left: 1px solid var(--line-2); font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Presence, Present, Share; zoom; the composer. */
#top { position: fixed; right: 12px; top: 12px; z-index: 4; height: 44px; display: flex; align-items: center; gap: 8px; padding: 0 6px 0 10px; border-radius: 14px; }
.who { display: flex; align-items: center; gap: 4px; position: relative; }
#mark { width: 26px; height: 26px; padding: 0; border: 0; background: none; border-radius: 8px; }
#mark[data-active="true"] { box-shadow: 0 0 0 2px var(--paper), 0 0 0 3.5px var(--blue); }
#mark[data-waiting="true"] { box-shadow: 0 0 0 2px var(--paper), 0 0 0 3.5px var(--amber); }
#zoom { position: fixed; right: 12px; bottom: 24px; z-index: 4; height: 36px; display: flex; align-items: center; gap: 2px; padding: 0 6px; border-radius: 10px; font-size: 13px; color: var(--ink); font-variant-numeric: tabular-nums; }
#zoom .ib { width: 28px; height: 28px; font-size: 15px; }
#zoom-level { min-width: 44px; height: 28px; border: 0; background: none; border-radius: 7px; font-size: 13px; }
#zoom-level:hover { background: var(--surface); }
#zoom .pill { height: 28px; }
#composer { position: fixed; bottom: 24px; left: calc((var(--side) + 100vw) / 2); z-index: 5; width: min(620px, calc(100vw - var(--side) - 220px)); min-width: 420px; height: 104px; display: flex; flex-direction: column; justify-content: space-between; padding: 14px 14px 12px 18px; border-radius: 20px; translate: -50% 0; }
body[data-side="closed"] { --side: 0px; }
.txt { display: flex; align-items: flex-start; gap: 8px; min-height: 26px; min-width: 0; }
#chips { display: contents; }
.chip { display: inline-flex; align-items: center; gap: 6px; height: 26px; flex: none; padding: 0 4px 0 8px; border-radius: 7px; background: var(--blue-soft); color: var(--blue); font: 500 13px/1 var(--font); white-space: nowrap; }
.chip svg { width: 13px; height: 13px; }
.chip button { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; border: 0; border-radius: 5px; background: none; color: inherit; }
.chip button:hover { background: color-mix(in oklab, var(--blue) 14%, transparent); }
#general { flex: 1; min-width: 80px; height: 40px; padding: 3px 0 0; border: 0; background: none; resize: none; outline: none; color: var(--ink); font-size: 15px; line-height: 20px; }
#general::placeholder { color: var(--faint); }
.bar { display: flex; align-items: center; gap: 2px; }
.bar .tools { display: flex; align-items: center; gap: 2px; }
#device { color: var(--muted); }
#device:hover { color: var(--ink); }
#status { margin-left: auto; padding-left: 8px; font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#status[data-flash="true"] { color: var(--ink); }
#send { display: grid; place-items: center; width: 32px; height: 32px; flex: none; margin-left: 8px; padding: 0; border: 0; border-radius: 50%; background: var(--ink); color: var(--on-ink); transition: opacity 150ms var(--out); }
#send:disabled { background: var(--surface-2); color: var(--faint); cursor: default; }
#hint { position: fixed; left: calc((var(--side) + 100vw) / 2); top: 18px; translate: -50% 0; z-index: 6; height: 32px; display: flex; align-items: center; padding: 0 14px; border-radius: 99px; font-size: 13px; color: var(--ink); white-space: nowrap; }
#hint[hidden] { display: none; }
#inspector { position: fixed; right: 12px; top: 68px; z-index: 4; width: 300px; max-height: calc(100vh - 68px - 76px); overflow-y: auto; overscroll-behavior: contain; padding: 14px 16px 16px; border-radius: 16px; font-size: 13px; }
#inspector[hidden] { display: none; }
#inspector h3 { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 0 0 4px; font-size: 13px; font-weight: 600; color: var(--ink); }
#inspector p { margin: 0 0 10px; color: var(--muted); overflow-wrap: anywhere; }
.specs { display: grid; grid-template-columns: auto 1fr; gap: 5px 12px; margin: 0 0 10px; }
.specs dt { color: var(--muted); } .specs dd { margin: 0; overflow-wrap: anywhere; color: var(--ink); }
.specs code { font: 12px ui-monospace, "SF Mono", Menlo, monospace; }
.specs .tok { color: var(--blue); } .specs .raw { color: var(--amber); }
#share-pop { position: fixed; z-index: 20; right: 12px; top: 64px; width: 320px; padding: 14px 16px 12px; border-radius: 12px; font-size: 13px; line-height: 1.45; color: var(--text); }
#share-pop[hidden] { display: none; }
#share-pop b { display: block; margin-bottom: 4px; font-size: 14px; font-weight: 600; color: var(--ink); }
#share-pop p { margin: 0 0 10px; }
#share-pop code { display: block; margin: 0 0 10px; padding: 7px 9px; border-radius: 8px; background: var(--surface); color: var(--ink); font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
#share-pop .row { display: flex; justify-content: flex-end; gap: 4px; }
#menu, #history { position: fixed; z-index: 20; min-width: 236px; padding: 6px; border-radius: 12px; font-size: 13px; }
#menu[hidden], #history[hidden] { display: none; }
#menu button { width: 100%; height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 0; border-radius: 8px; background: none; color: var(--ink); text-align: start; }
#menu button:hover, #menu button:focus-visible { background: var(--surface); outline: none; }
#menu button .k { margin-left: auto; color: var(--faint); font-variant-numeric: tabular-nums; }
#menu button .c { width: 16px; display: grid; place-items: center; color: var(--blue); }
#menu hr { margin: 5px 4px; border: 0; border-top: 1px solid var(--line); }
#history { left: 292px; bottom: 12px; width: 340px; max-height: 60vh; overflow-y: auto; padding: 12px 14px; }
#history h4 { margin: 8px 0 6px; font-size: 13px; font-weight: 600; color: var(--ink); }
#history h4:first-child { margin-top: 0; }
#history li { display: grid; grid-template-columns: 38px 1fr; gap: 6px; padding: 5px 0; color: var(--text); list-style: none; }
#history ul { margin: 0; padding: 0; }
#history li span:first-child { color: var(--faint); font-variant-numeric: tabular-nums; }

/* Inside an agent app's side pane: no list of its own, one screen at a time, fitted to the width. */
#pane { position: fixed; inset: 0; display: none; flex-direction: column; background: var(--paper); }
body[data-narrow="true"] #pane { display: flex; }
body[data-narrow="true"] :is(#viewport, #side, #side-pill, #top, #zoom, #inspector) { display: none !important; }
#tabs { height: 52px; flex: none; display: flex; align-items: center; gap: 2px; padding: 0 16px; overflow-x: auto; scrollbar-width: none; }
#tabs .pill { height: 30px; }
#tabs .pill[aria-selected="true"] { background: var(--surface); color: var(--ink); }
#tabs .pill[aria-selected="false"] { color: var(--muted); }
#tabs select { height: 30px; max-width: 40%; margin-right: 6px; padding: 0 8px; border: 0; border-radius: 99px; background: var(--surface); font-size: 13px; font-weight: 500; color: var(--ink); }
#tabs .n { margin-left: auto; padding-left: 12px; font-size: 13px; color: var(--muted); white-space: nowrap; }
#stage { position: relative; flex: 1; min-height: 0; margin: 0 16px; }
#stage .body { inset: auto; left: 0; top: 0; border-radius: 6px; box-shadow: 0 0 0 2px var(--blue); }
#stage .body iframe { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
#stage .ghosts div { border-width: 1.5px; font-size: 13px; }
#stage .cursor { transform: none; }
#pane-act { flex: none; display: flex; align-items: center; gap: 6px; padding: 12px 16px 0; min-width: 0; }
#pane-act .why { margin-left: auto; min-width: 0; padding-left: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--muted); }
body[data-narrow="true"] #composer { position: static; flex: none; width: auto; min-width: 0; margin: 16px; translate: none; box-shadow: inset 0 0 0 1px var(--line-2); }
body[data-narrow="true"] #composer .tools { display: none; }
body[data-narrow="true"] #hint { left: 50%; top: 60px; }
.p-empty { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 12px; text-align: center; color: var(--muted); font-size: 13px; }

/* Present and the one-at-a-time review. */
#present { position: fixed; inset: 0; z-index: 30; display: grid; grid-template-rows: auto 1fr; background: #0f0f0e; color: #f1efea; }
#present[hidden], #review[hidden] { display: none; }
#present .bar { display: flex; gap: 8px; align-items: center; padding: 10px 14px; font-size: 13px; }
#present .bar strong { font-weight: 600; font-size: 15px; } #present .bar span { color: #a39e95; }
#present .pill { background: rgb(255 255 255 / .1); color: #f1efea; }
#present .stage, #review .stage { position: relative; overflow: hidden; display: grid; place-items: center; }
#present iframe { border: 0; background: #fff; transform-origin: 50% 50%; box-shadow: 0 0 0 1px rgb(255 255 255 / .1), 0 24px 60px rgb(0 0 0 / .5); }
#present[data-device="phone"] iframe { border-radius: 32px; }
#p-flow { height: 32px; padding: 0 10px; border: 0; border-radius: 99px; background: rgb(255 255 255 / .1); color: #f1efea; font-size: 13px; }
#review { position: fixed; inset: 0; z-index: 30; display: grid; grid-template-columns: 1fr 380px; background: var(--canvas); color: var(--ink); }
#review .stage iframe { border: 0; background: #fff; transform-origin: 50% 50%; border-radius: 6px; box-shadow: var(--float); }
#review[data-device="phone"] .stage iframe { border-radius: 32px; }
#review aside { display: flex; flex-direction: column; gap: 14px; padding: 24px; overflow-y: auto; overscroll-behavior: contain; background: var(--paper); box-shadow: -1px 0 0 var(--line); }
#review h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--ink); }
#review p { margin: 0; }
#review .muted { color: var(--muted); font-size: 13px; }
#review .row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
#review .pill { background: var(--surface); }
#review .pill[aria-pressed="true"], #review .pill.ink { background: var(--ink); color: var(--on-ink); }
#review textarea { width: 100%; min-height: 40px; padding: 8px 10px; border: 0; border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 13px; resize: vertical; }
#review .q { display: grid; gap: 8px; padding: 12px 0; border-top: 1px solid var(--line); font-size: 13px; }
#r-pill { position: absolute; bottom: 24px; left: 50%; translate: -50% 0; display: flex; gap: 2px; padding: 4px; border-radius: 99px; background: var(--paper); box-shadow: var(--float); }
#r-pill[hidden] { display: none; }
#r-pill button { height: 32px; padding: 0 14px; border: 0; border-radius: 99px; background: none; color: var(--muted); font: 500 13px/1 var(--font); }
#r-pill button[data-active] { background: var(--ink); color: var(--on-ink); }
#review .risk { font-size: 13px; font-weight: 500; padding: 3px 8px; border-radius: 99px; background: var(--surface); }
#review .risk[data-risk="bold"] { background: color-mix(in oklab, var(--amber) 18%, transparent); color: var(--amber); }
#review .grow { flex: 1; }
@media (max-width: 819px) { #review { grid-template-columns: 1fr; grid-template-rows: 55vh 1fr; } }
@media (max-width: 1100px) { #composer { min-width: 0; width: calc(100vw - var(--side) - 180px); } }
</style>
</head>
<body>
<div id="viewport" aria-label="Canvas"><div id="world"></div></div>
<aside id="side" class="float" aria-label="Screens">
  <div class="sb-head"><button type="button" class="ib" id="side-close" data-i="panel" aria-pressed="true" title="Hide the screen list (L)" aria-label="Hide the screen list"></button><span class="mark" id="side-mark" style="width:22px;height:22px"></span><b>Canvas</b><button type="button" class="ib" id="find" data-i="search" title="Find a screen" aria-label="Find a screen" style="margin-left:auto"></button></div>
  <button type="button" id="project" title="The cover: what this file is and where each part stands"><span class="ptile" id="ptile"></span><b id="title"></b><small id="stage-label"></small></button>
  <input id="filter" type="search" placeholder="Find a screen" aria-label="Find a screen" hidden>
  <p class="sb-error" id="error" hidden></p>
  <nav id="list"></nav>
  <div class="foot"><button type="button" class="ln" id="history-open" aria-expanded="false"><span>History</span><span id="rounds" style="margin-left:auto;color:var(--muted)"></span><span data-i="right"></span></button>
    <div class="sync" id="sync"><span data-i="cloud"></span><span id="sync-text">Synced</span><span class="avatar" id="me" style="margin-left:auto"></span></div></div>
</aside>
<button type="button" id="side-pill" class="float" hidden title="Show the screen list (L)"><span class="ib" data-i="panel"></span><span class="mark" id="pill-mark" style="width:24px;height:24px"></span><b id="pill-title"></b><span class="work" id="pill-work" hidden></span></button>
<div id="top" class="float"><span class="who"><span class="avatar" id="me-2"></span><button type="button" id="mark" title="Follow Seenry as it works (A)" aria-pressed="true"></button></span>
  <button type="button" class="ib" id="play" data-i="play" title="Present: play the screens full size, following their links (P)" aria-label="Present"></button>
  <button type="button" class="pill ink" id="share" data-i="share" aria-haspopup="dialog" aria-expanded="false" title="Share this canvas">Share</button></div>
<div id="zoom" class="float" role="group" aria-label="Zoom"><button type="button" class="ib" id="zoom-out" aria-label="Zoom out" title="Zoom out (−)">−</button><button type="button" id="zoom-level" title="Zoom to 100%">100%</button><button type="button" class="ib" id="zoom-in" aria-label="Zoom in" title="Zoom in (+)">+</button><span class="sep"></span><button type="button" class="pill ghost" id="zoom-fit" title="Fit everything (1). The decision: 2">Fit</button></div>
<main id="pane" aria-label="Canvas"><div id="tabs" role="tablist" aria-label="Screens"></div><div id="stage"></div><div id="pane-act"></div></main>
<div id="composer" class="float">
  <div class="txt"><span id="chips"></span><textarea id="general" rows="2" aria-label="Tell Seenry what to change" placeholder="Tell Seenry what to change"></textarea></div>
  <div class="bar"><span class="tools" role="group" aria-label="Tools">
      <button type="button" class="ib" id="tool-move" data-i="move" aria-pressed="true" title="Move: select a screen, then click any element to point Seenry at it (V)" aria-label="Move"></button>
      <button type="button" class="ib" id="tool-comment" data-i="comment" aria-pressed="false" title="Comment: click any element on any screen (C)" aria-label="Comment"></button>
      <button type="button" class="ib" id="tool-inspect" data-i="inspect" aria-pressed="false" title="Inspect: click an element to see its values and variables (I)" aria-label="Inspect"></button>
      <button type="button" class="ib" id="more" data-i="more" aria-haspopup="menu" aria-expanded="false" title="Review, present, flows, grid, specs, dark screens and more" aria-label="More"></button>
      <span class="sep"></span></span>
    <button type="button" class="pill ghost" id="device" aria-haspopup="menu" aria-expanded="false" title="Show every screen at one device size"></button>
    <span id="status" role="status"></span>
    <button type="button" id="send" data-i="up" title="Send your picks and notes to Seenry (Enter)" aria-label="Send to Seenry"></button></div>
</div>
<div id="hint" class="float" hidden></div>
<section id="inspector" class="float" aria-label="Inspect" hidden></section>
<div id="menu" class="float" role="menu" hidden></div>
<section id="history" class="float" aria-label="History" hidden></section>
<section id="share-pop" class="float" role="dialog" aria-label="Share" hidden></section>
<div id="review" hidden>
  <div class="stage" id="r-stage"><iframe id="r-frame" title="Screen under review"></iframe><div id="r-pill" hidden></div></div>
  <aside id="r-panel"></aside>
</div>
<div id="present" hidden>
  <div class="bar"><strong id="p-name"></strong><span id="p-where"></span><span style="flex:1"></span>
    <select id="p-flow" aria-label="Flow"></select>
    <button type="button" class="pill" id="p-prev" aria-label="Previous screen">←</button>
    <button type="button" class="pill" id="p-next" aria-label="Next screen">→</button>
    <button type="button" class="pill" id="p-restart">Restart</button>
    <button type="button" class="pill" id="p-close">Close (Esc)</button></div>
  <div class="stage" id="p-stage"><iframe id="p-frame" title="Prototype"></iframe></div>
</div>
<script>
const EMBEDDED = /*STATE*/null;
const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children.filter(c => c !== '' && c != null && c !== false)); return node; };
const attr = (node, name, value) => { node.setAttribute(name, value); return node; };
const DEVICES = {desktop: [1440, 900], laptop: [1280, 800], tablet: [834, 1112], phone: [390, 844]};
const DEVICE_NAMES = {desktop: 'Desktop', laptop: 'Laptop', tablet: 'Tablet', phone: 'Phone', image: 'Image'};
const GAP = 120, MAX_H = 7000, SIDE = 280, LIVE = '#2b63e8';
const ICONS = {
  panel: '<rect x="2.5" y="3" width="11" height="10" rx="2.2"/><path d="M6.5 3v10"/>',
  search: '<circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2 13.5 13.5"/>',
  right: '<path d="M6 4l4 4-4 4"/>', down: '<path d="M4 6l4 4 4-4"/>',
  move: '<path d="M3.2 2.6l9.6 3.9-4 1.6-1.6 4z"/>',
  comment: '<path d="M2.8 4.6a2 2 0 0 1 2-2h6.4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8.2L5 13v-2.4h-.2a2 2 0 0 1-2-2z"/>',
  inspect: '<path d="M2.5 5.5v-2a1 1 0 0 1 1-1h2M10.5 2.5h2a1 1 0 0 1 1 1v2M13.5 10.5v2a1 1 0 0 1-1 1h-2M5.5 13.5h-2a1 1 0 0 1-1-1v-2"/><circle cx="8" cy="8" r="1.6"/>',
  up: '<path d="M8 12.6V3.6M4.4 7.2 8 3.6l3.6 3.6"/>',
  monitor: '<rect x="2" y="3" width="12" height="8" rx="1.6"/><path d="M6 13.5h4M8 11v2.5"/>',
  phone: '<rect x="5" y="2" width="6" height="12" rx="1.6"/>',
  check: '<path d="M3.4 8.6l3 3 6.2-7"/>',
  share: '<path d="M8 10V2.6M5.2 5.2 8 2.4l2.8 2.8M3 9.2v2.6a1.6 1.6 0 0 0 1.6 1.6h6.8a1.6 1.6 0 0 0 1.6-1.6V9.2"/>',
  play: '<path d="M5.2 3.6v8.8l7.4-4.4z"/>',
  x: '<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>',
  spin: '<circle cx="8" cy="8" r="5.2" stroke-dasharray="2.2 2.6"/>',
  cloud: '<path d="M5 12.4h6.4a2.5 2.5 0 0 0 .4-4.96A4 4 0 0 0 4.1 8.2 2.2 2.2 0 0 0 5 12.4z"/>',
  more: '<path d="M3.6 8h.01M8 8h.01M12.4 8h.01" stroke-width="2.4"/>'
};
const icon = (name, cls) => { const s = document.createElement('span'); s.innerHTML = '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 16 16" aria-hidden="true">' + ICONS[name] + '</svg>'; return s.firstChild; };
const ARROW = '<svg viewBox="0 0 15 15" aria-hidden="true"><path d="M1.5 1.2l4 11.6 2-4.9 4.9-2z" fill="' + LIVE + '" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const EYES = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="seen-tile" width="64" height="64" rx="18"/><g class="seen-look"><rect class="seen-eye" x="18.5" y="22" width="10" height="20" rx="5"/><rect class="seen-eye" x="35.5" y="22" width="10" height="20" rx="5"/></g></svg>';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const store = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
document.querySelectorAll('[data-i]').forEach(n => n.prepend(icon(n.dataset.i)));
for (const id of ['mark', 'side-mark', 'pill-mark']) $(id).innerHTML = EYES;

let state = null, view = {x: 0, y: 0, z: 1}, selected = null, tool = 'move', following = true, lastAt = '', narrow = false, fitted = false;
let showLinks = true, showGrid = false, dark = false, showSpecs = false, fullHeight = false, device = null, sideOpen = store.get('seenry-canvas-side') !== 'closed';
let playing = null, flow = null, reviewing = null, inspected = null, paneId = null, paneKey = '', online = true, flashText = '', flashTimer = 0, filterText = '';
const status = {}, picks = {}, notes = [], heights = {}, nodes = {}, touched = new Set(), riffs = [], chips = [];
const DEFAULT_ASK = ['Is anything missing on this screen?', 'Is it clear what to do first?', 'Does anything look wrong or out of place?'];

const frames = () => state.sections.flatMap(s => s.frames.map(f => ({...f, section: s})));
const find = id => id ? frames().find(f => f.id === id) : null;
const short = f => f.section && f.section.choose ? f.name.split(' · ').pop() : f.name;
const isDesign = s => !s.system && !s.reference && !s.archived;
const pagesOf = s => s.frames.filter(f => f.kind === 'page');
const isOpen = s => s.choose && !s.study && !s.archived && !picks[s.id] && pagesOf(s).length > 0;
const live = () => location.protocol !== 'file:';
function size(f) { return device && (f.kind === 'page' || f.kind === 'pending') && isDesign(f.section) ? DEVICES[device] : [f.w, f.h]; }
function clip(f) { const [w, h] = size(f); return fullHeight ? MAX_H : Math.max(h, Math.round(w * 1.2)); }
function height(f) {
  const h = size(f)[1];
  if (f.kind === 'pending' || (f.kind === 'page' && missing(f).length && building(f))) return clip(f);
  if (f.kind === 'image' || f.kind === 'cover') return heights[f.id] || h;
  return Math.min(heights[f.id] || h, clip(f));
}
// Decisions first, then the screens, the references, the system pages and the archive: the canvas opens on what needs the person.
// A section whose every screen is approved leaves the canvas while something else waits; the screen list keeps it reachable.
let shownSection = null;
const settled = s => isDesign(s) && !s.choose && pagesOf(s).length > 0 && s.frames.every(f => f.kind === 'page' && state.approvals[f.id] === 'approved');
const tucked = s => s.id !== shownSection && settled(s) && state.sections.some(x => isDesign(x) && x.frames.length && !settled(x));
const rank = s => s.archived ? 4 : s.choose && !s.study ? 0 : !s.system && !s.reference ? 1 : s.reference ? 2 : 3;
const placed = () => state.sections.map((s, i) => [s, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);

// ---------- What Seenry is doing ----------
const ago = at => { const s = Math.max(0, (Date.now() - Date.parse(at)) / 1000); return s < 45 ? 'now' : s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd'; };
const clock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function agentNow() {
  const list = (state && state.activity) || [], last = list.at(-1), fresh = e => Date.now() - Date.parse(e.at) < 60000;
  const on = [...list].reverse().find(e => e.frame && find(e.frame) && fresh(e));
  return {last, active: !!last && Date.now() - Date.parse(last.at) < 90000, frame: on ? on.frame : null, text: on ? on.text : ''};
}
// A screen's timer runs from the first step of its current stretch of work.
function startOf(id) {
  const list = (state.activity || []).filter(e => e.frame === id);
  if (!list.length) return 0;
  let start = Date.parse(list.at(-1).at);
  for (let i = list.length - 2; i >= 0; i--) { const t = Date.parse(list[i].at); if (start - t > 600000) break; start = t; }
  return start;
}
const missing = f => (f.plan || []).filter(p => !(f.parts || []).includes(p));
function building(f) {
  if (!f || !f.section || !isDesign(f.section)) return false;
  if (f.kind === 'pending') return true;
  if (f.kind !== 'page') return false;
  const a = agentNow(), recent = (state.activity || []).some(e => e.frame === f.id && Date.now() - Date.parse(e.at) < 600000);
  return (missing(f).length > 0 && recent) || (a.active && a.frame === f.id) || replaying.has(f.id);
}
const working = () => frames().filter(building);

// ---------- Layout ----------
function layout() {
  const z = view.z, head = Math.max(96, 70 / z), gap = Math.max(GAP, 28 / z), tail = Math.max(80, 120 / z), between = Math.max(200, 56 / z);
  let y = 0; const boxes = {};
  for (const s of placed()) {
    if (tucked(s)) { s.box = null; continue; }
    let x = 0, row = 0;
    for (const raw of s.frames) { const f = {...raw, section: s}, w = size(f)[0], h = height(f); boxes[f.id] = {x, y: y + head, w, h}; x += w + gap; row = Math.max(row, h); }
    s.box = {x: 0, y, w: Math.max(x - gap, 600), h: head + row + tail, top: y + head};
    y += s.box.h + between;
  }
  return boxes;
}
function apply() {
  const w = $('world').style;
  w.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.z + ')';
  w.setProperty('--inv', 1 / view.z); w.setProperty('--z', view.z);
  $('zoom-level').textContent = Math.round(view.z * 100) + '%';
}
function zoomAt(cx, cy, z) {
  z = Math.min(2, Math.max(0.03, z));
  view.x = cx - (cx - view.x) * (z / view.z); view.y = cy - (cy - view.y) * (z / view.z); view.z = z; apply();
  if (state) place();
}
// The part of the window nothing floats over: right of the screen list, under the top bar, above the composer.
function safe() { return {l: sideOpen ? 12 + 268 + 8 : 8, t: 64, r: innerWidth - 8, b: innerHeight - 140}; }
function fitBox(box, top) {
  const s = safe(), pad = 36, w = s.r - s.l - pad * 2, h = s.b - s.t - pad;
  view.z = Math.max(0.03, Math.min(1, w / box.w, h / box.h));
  view.x = s.l + pad + (w - box.w * view.z) / 2 - box.x * view.z;
  view.y = (top ? s.t + pad : s.t + pad / 2 + (h - box.h * view.z) / 2) - box.y * view.z; apply();
}
// The layout depends on the zoom, so fitting repeats until it settles, then places everything.
function fitSections(pick, top) {
  for (let pass = 0; pass < 4; pass++) {
    layout(); const list = pick().filter(s => s.box); if (!list.length) return false;
    const x = Math.min(...list.map(s => s.box.x)), y = Math.min(...list.map(s => s.box.y));
    fitBox({x, y, w: Math.max(...list.map(s => s.box.x + s.box.w)) - x, h: Math.max(...list.map(s => s.box.y + s.box.h)) - y}, top);
  }
  if (state) place();
  return true;
}
function fitAll() { fitSections(() => state.sections); }
// Opens on the options waiting for a pick; with none open, on the first screens.
function fitDecision() {
  shownSection = null;
  const open = state.sections.filter(isOpen), design = placed().filter(isDesign);
  if (!fitSections(() => open.length ? [open[0]] : design.slice(0, 1), true)) fitAll();
}
function fitSection(id) { const s = state.sections.find(x => x.id === id); if (s) fitSections(() => [s], true); }
function focusFrame(id) {
  const f = find(id); if (f && tucked(f.section)) shownSection = f.section.id;
  for (let pass = 0; pass < 2; pass++) { const box = layout()[id]; if (box) fitBox({x: box.x, y: box.y - 60 / view.z, w: box.w, h: box.h + 140 / view.z}); }
  if (state) place();
}

// ---------- Screens ----------
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
    pin.style.cssText = 'position:absolute;z-index:2147483647;pointer-events:none;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:' + LIVE + ';color:#fff;font:600 12px/20px ui-sans-serif,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff;left:' + (r.right + win.scrollX - 10) + 'px;top:' + (r.top + win.scrollY - 10) + 'px';
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
function eachDoc(fn) { document.querySelectorAll('#world iframe, #p-frame, #stage iframe, #r-frame').forEach(i => { try { fn(i.contentDocument); } catch (e) {} }); }

/** The rules that apply in a screen, flattened through @media, @supports and @layer, in source order. */
function rules(doc) {
  if (doc.__seenryRules) return doc.__seenryRules;
  const out = [], win = doc.defaultView;
  const walk = list => { for (const r of list) {
    if (r.selectorText && r.style) out.push(r);
    else if (r.media && r.cssRules) { if (win.matchMedia(r.media.mediaText).matches) walk(r.cssRules); }
    else if (r.cssRules) walk(r.cssRules);
  } };
  for (const sheet of doc.styleSheets) { try { walk(sheet.cssRules); } catch (e) {} }
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
        let hit = false; try { hit = n.matches(part.trim()); } catch (e) {}
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
  selected = f.id; render();
}

// Pointing at an element adds it to the composer as a chip: "Tide · h1".
function addChip(node, f) {
  const d = describe(node), doc = node.ownerDocument, win = doc.defaultView, r = node.getBoundingClientRect();
  const part = node.closest('[data-seenry-part]'), tag = node.tagName.toLowerCase();
  const what = /^(div|span|section|article|main|p|li|ul|figure|svg|g|path)$/.test(tag) && part ? part.getAttribute('data-seenry-part') : tag;
  const i = chips.findIndex(c => c.frame === f.id && c.selector === d.selector);
  if (i >= 0) chips.splice(i, 1);
  else chips.push({frame: f.id, label: short(f) + ' · ' + what, tag: what, target: d.target, selector: d.selector, box: {x: r.left + win.scrollX, y: r.top + win.scrollY, w: r.width, h: r.height}});
  render(); $('general').focus();
}
function addScreen(f) {
  if (!chips.some(c => c.frame === f.id && !c.selector)) chips.push({frame: f.id, label: short(f), tag: '', target: 'whole screen', selector: ''});
  render(); $('general').focus();
}
function arm(iframe, f) {
  let doc; try { doc = iframe.contentDocument; } catch (e) { return; }
  if (!doc || !doc.documentElement) return;
  const measure = () => {
    const h = Math.min(MAX_H, Math.max(size(f)[1], doc.documentElement.scrollHeight));
    if (Math.abs((heights[f.id] || f.h) - h) > 2) { heights[f.id] = h; place(); }
  };
  if (iframe.closest('#world')) { measure(); setTimeout(measure, 400); setTimeout(measure, 1500); }
  applyView(doc); setTimeout(() => applyView(doc), 600);
  const pointing = () => narrow ? !!iframe.closest('#stage') : tool !== 'move' || (selected === f.id && iframe.closest('#world'));
  let last = null;
  const mark = node => { if (last) last.style.outline = last.dataset.seenryOutline || ''; last = node; if (node) { node.dataset.seenryOutline = node.style.outline; node.style.outline = '1.5px solid ' + LIVE; } };
  doc.addEventListener('mouseover', e => { if (pointing() && !(e.target.id || '').startsWith('seenry-')) mark(e.target); }, true);
  doc.addEventListener('mouseout', () => mark(null), true);
  doc.addEventListener('click', e => {
    if (!pointing() || !live()) return;
    e.preventDefault(); e.stopPropagation(); mark(null);
    if (tool === 'inspect' && !narrow) inspect(e.target, f); else addChip(e.target, f);
  }, true);
  doc.addEventListener('scroll', () => placeMarks(f), {passive: true});
  doc.addEventListener('keydown', e => { if (e.key === 'Escape') { setTool('move'); selected = null; render(); } });
}
// The parts a screen still lacks (plan --parts) show as dashed outlines over the bottom of the frame, under Seenry's cursor.
function todo(body, f) {
  if (!body) return;
  const want = f.kind === 'page' && building(f) ? (missing(f).length ? missing(f) : agentNow().frame === f.id ? ['Next part'] : []) : [];
  const key = want.join('|') + (replaying.has(f.id) ? '+' : '');
  if (body.__todo === key) return; body.__todo = key;
  body.querySelector('.todo')?.remove();
  if (!want.length) return;
  const c = cursorNode(); c.style.right = '18%'; c.style.top = '0';
  const box = el('div', {className: 'todo', style: '--n:' + Math.min(3, want.length)}, el('div', {className: 'ghosts'}, ...want.slice(0, 3).map(n => el('div', {textContent: n}))), replaying.has(f.id) ? '' : c);
  body.append(box);
}
function ghostAll() {
  for (const f of frames()) {
    todo(nodes[f.id] && nodes[f.id].querySelector('.body'), f);
    if (narrow && paneId === f.id) todo($('stage').querySelector('.body'), f);
  }
}

function cursorNode(text) { const c = el('div', {className: 'cursor'}); c.innerHTML = ARROW; c.append(el('span', {textContent: text || 'Seenry'})); return c; }
function blankFor(f) {
  const names = (f.plan && f.plan.length) ? f.plan : ['Being drawn'];
  const c = cursorNode(); c.style.left = '46%'; c.style.top = '34%';
  return el('div', {className: 'blank'}, el('div', {className: 'ghosts'}, ...names.map(n => el('div', {textContent: n}))), c);
}

function build() {
  const world = $('world'); world.replaceChildren();
  for (const k in nodes) delete nodes[k];
  for (const s of state.sections) {
    s.head = el('div', {className: 'ui set'}); world.append(s.head);
    for (const raw of s.frames) {
      const f = {...raw, section: s}, body = el('div', {className: 'body'});
      if (f.kind === 'cover') body.append(el('div', {className: 'cover'}));
      else if (f.kind === 'pending') body.append(blankFor(f));
      else if (f.kind === 'image') {
        const img = el('img', {src: f.src + '?v=' + f.rev, alt: f.name, draggable: false});
        img.addEventListener('load', () => { const h = Math.min(MAX_H, Math.round(f.w * img.naturalHeight / img.naturalWidth)); if (h && h !== heights[f.id]) { heights[f.id] = h; place(); } });
        body.append(img);
      } else {
        const iframe = el('iframe', {src: f.src + '?v=' + f.rev, title: f.name});
        if (!isDesign(s)) iframe.loading = 'lazy';
        iframe.addEventListener('load', () => { arm(iframe, f); frameLoaded(iframe, f); placeMarks(f); });
        body.append(iframe);
      }
      body.append(el('div', {className: 'marks'}));
      const lab = el('div', {className: 'ui lab'}), cap = el('div', {className: 'ui cap', textContent: f.kind === 'pending' ? '' : (f.caption || ''), title: f.kind === 'pending' ? '' : (f.axis || f.note || '')});
      const node = el('div', {className: 'frame'}, lab, body, el('div', {className: 'shield'}), cap);
      node.dataset.id = f.id; node.dataset.device = f.device; node.dataset.kind = f.kind;
      lab.addEventListener('click', e => { e.stopPropagation(); select(f.id); });
      nodes[f.id] = node; world.append(node);
    }
  }
  world.append(attr(el('div', {id: 'pick', className: 'ui', hidden: true}), 'role', 'toolbar'));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'links'; world.append(svg);
  for (const s of state.sections) fillHead(s);
  place();
}
function fillHead(s) {
  if (!s.head) return;
  const ready = pagesOf(s), coming = s.frames.filter(f => f.kind === 'pending' || (f.kind === 'page' && building({...f, section: s}))).length;
  let line = s.note || '';
  if (s.choose && !s.study && !s.archived) line = picks[s.id] ? 'Picked ' + short(find(picks[s.id]) || {name: ''}) : (ready.length ? 'Pick a direction · ' + (ready.length - coming) + ' ready' + (coming ? ', ' + coming + ' on the way' : '') : 'Seenry is drawing the directions');
  else if (isDesign(s)) { const ok = ready.filter(f => status[f.id] === 'approved').length; line = ready.length + (ready.length === 1 ? ' screen' : ' screens') + (ok ? ' · ' + ok + ' approved' : ''); }
  const refs = s.choose && !s.study && state.refs && state.refs.length ? el('span', {className: 'held'}, el('span', {}, ...state.refs.slice(0, 4).map(r => { const b = el('button', {type: 'button', title: r.name}); b.style.backgroundImage = 'url("' + encodeURI(r.src) + '")'; b.setAttribute('aria-label', 'Reference: ' + r.name); b.onclick = e => { e.stopPropagation(); select(r.id); focusFrame(r.id); }; return b; })), document.createTextNode('Held to ' + state.refs.length + (state.refs.length === 1 ? ' reference' : ' references'))) : '';
  const key = s.name + '|' + line + '|' + (refs ? state.refs.length : 0);
  if (s.head.__key === key) return; s.head.__key = key;
  s.head.replaceChildren(document.createTextNode(s.name), el('span', {textContent: line}), refs);
}
function labelFor(node, f) {
  const st = building(f) ? ['', 'Building'] : f.section.choose && picks[f.section.id] === f.id ? ['check', 'Picked'] : status[f.id] === 'approved' ? ['check', 'Approved'] : status[f.id] === 'change' ? ['', 'Needs changes'] : f.sketch ? ['', 'Sketch'] : f.kind === 'pending' ? ['', 'Being drawn'] : ['', ''];
  const [w, h] = size(f), dims = f.kind === 'image' ? '' : f.device === 'desktop' && !device ? String(w) : w + ' × ' + h;
  const key = short(f) + dims + st.join();
  const lab = node.querySelector('.lab'); if (lab.__key === key) return; lab.__key = key;
  lab.replaceChildren(el('b', {textContent: short(f)}), el('span', {textContent: dims}), st[1] ? el('span', {className: 'st'}, st[0] ? icon(st[0]) : '', document.createTextNode(st[1])) : '');
}
function placeMarks(f) {
  const node = nodes[f.id]; if (!node) return;
  const layer = node.querySelector('.marks'); if (!layer) return;
  let sy = 0; try { sy = node.querySelector('iframe').contentWindow.scrollY || 0; } catch (e) {}
  const marks = chips.filter(c => c.frame === f.id && c.box).map(c => el('div', {className: 'hl', style: 'left:' + c.box.x + 'px;top:' + (c.box.y - sy) + 'px;width:' + c.box.w + 'px;height:' + c.box.h + 'px'}, el('span', {className: 'tag', textContent: c.tag})));
  layer.replaceChildren(...marks, ...pinsFor(f, node, sy));
}
// Comments already sent on this version of a screen, numbered as the agent reads them, pinned to their element.
function pinsFor(f, node, sy) {
  const fb = state && state.feedback, sent = fb && Array.isArray(fb.notes) ? fb.notes : [];
  if (!sent.length || !(Date.parse(fb.at) >= (f.rev || 0))) return [];
  let doc = null; try { doc = node.querySelector('iframe').contentDocument; } catch (e) {}
  const [w] = size(f), out = [];
  sent.forEach((n, i) => {
    if (n.frame !== f.id || /^Q: /.test(n.target || '')) return;
    let x = 16, y = 16, left = false;
    if (n.selector) {
      let target = null; try { target = doc && doc.querySelector(n.selector); } catch (e) {}
      if (!target) return;
      // On the ink, not the box: a centred headline's box spans the page, its text does not.
      const range = doc.createRange(); range.selectNodeContents(target);
      const text = range.getBoundingClientRect(), r = text.width && text.height ? text : target.getBoundingClientRect(), win = doc.defaultView;
      left = r.right + win.scrollX > w * 0.85; x = left ? Math.max(0, r.left + win.scrollX) : r.right + win.scrollX; y = Math.max(16, r.top + win.scrollY);
    }
    out.push(el('div', {className: 'pin' + (left ? ' l' : ''), textContent: String(i + 1), title: n.text, style: 'left:' + x + 'px;top:' + (y - sy) + 'px'}));
  });
  return out;
}
function place() {
  if (!state || narrow) return;
  const boxes = layout(), z = view.z;
  for (const s of state.sections) if (s.head) { s.head.hidden = !s.box; if (s.box) Object.assign(s.head.style, {left: s.box.x + 'px', top: (s.box.top - 40 / z) + 'px'}); }
  for (const f of frames()) {
    const node = nodes[f.id], box = boxes[f.id]; if (!node) continue;
    node.hidden = !box; if (!box) continue;
    Object.assign(node.style, {left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px'}); node.style.setProperty('--w', box.w);
    node.dataset.selected = selected === f.id; node.dataset.live = selected === f.id && tool === 'move' && f.kind === 'page' && live();
    node.dataset.building = building(f); node.dataset.status = status[f.id] || ''; node.dataset.archived = !!f.section.archived;
    labelFor(node, f); placeMarks(f);
  }
  placePick(boxes); drawLinks(boxes); ghostAll();
  if (!fitted && Object.keys(boxes).length) { fitted = true; fitDecision(); }
}
// Under the selected screen: the decision it asks for.
function actionsFor(f, inPane) {
  const out = [];
  if (!f || f.kind !== 'page' || !isDesign(f.section)) return out;
  const b = (text, cls, fn, ic, pressed) => { const x = el('button', {type: 'button', className: 'pill ' + cls}, ic ? icon(ic) : '', document.createTextNode(text)); if (pressed != null) x.setAttribute('aria-pressed', pressed); x.onclick = e => { e.stopPropagation(); fn(); }; return x; };
  if (f.section.choose && !f.section.study) {
    const s = f.section, picked = picks[s.id] === f.id, riffed = riffs.some(r => r.frame === f.id);
    out.push(b(picked ? 'Picked ' + short(f) : 'Pick ' + short(f), 'ink', () => { picks[s.id] = picked ? null : f.id; if (!picked) for (let k = riffs.length - 1; k >= 0; k--) if (riffs[k].section === s.id) riffs.splice(k, 1); render(); }, 'check', picked));
    out.push(b(riffed ? 'Asked for more' : 'More like this', inPane ? 'soft' : '', () => { const i = riffs.findIndex(r => r.frame === f.id); if (i >= 0) riffs.splice(i, 1); else { riffs.push({section: s.id, frame: f.id}); picks[s.id] = null; } render(); }, '', riffed));
  } else {
    const set = v => () => { status[f.id] = status[f.id] === v ? '' : v; touched.add(f.id); render(); };
    out.push(b(status[f.id] === 'approved' ? 'Approved' : 'Approve', 'ink', set('approved'), 'check', status[f.id] === 'approved'));
    out.push(b('Needs changes', inPane ? 'soft' : '', set('change'), '', status[f.id] === 'change'));
  }
  if (!inPane) out.push(b('Comment', '', () => addScreen(f)));
  return out;
}
function placePick(boxes) {
  const pick = $('pick'); if (!pick) return;
  const f = find(selected), box = f && boxes[f.id], acts = box ? actionsFor(f) : [];
  pick.hidden = !acts.length; if (!acts.length) { pick.__key = ''; return; }
  Object.assign(pick.style, {left: (box.x + box.w / 2) + 'px', top: (box.y + box.h + 48 / view.z) + 'px'});
  const key = f.id + '|' + picks[f.section.id] + '|' + status[f.id] + '|' + riffs.map(r => r.frame).join();
  if (pick.__key !== key) { pick.__key = key; pick.replaceChildren(...acts); }
}
function drawLinks(boxes) {
  const svg = $('links'); if (!svg) return;
  svg.hidden = !showLinks; svg.replaceChildren();
  if (!showLinks) return;
  const ns = 'http://www.w3.org/2000/svg', mid = b => b.y + Math.min(b.h, 600);
  let maxX = 0, maxY = 0;
  for (const f of frames()) for (const to of f.links || []) {
    const a = boxes[f.id], b = boxes[to]; if (!a || !b) continue;
    const sx = a.x + a.w, sy = mid(a) / 1, tx = b.x, ty = mid(b), bend = Math.max(80, Math.abs(tx - sx) / 2);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M' + sx + ' ' + sy + ' C' + (sx + bend) + ' ' + sy + ' ' + (tx - bend) + ' ' + ty + ' ' + tx + ' ' + ty);
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', tx); dot.setAttribute('cy', ty); dot.setAttribute('r', 5 / view.z);
    svg.append(path, dot); maxX = Math.max(maxX, sx, tx); maxY = Math.max(maxY, sy, ty);
  }
  svg.setAttribute('width', maxX + 400); svg.setAttribute('height', maxY + 400);
}

// ---------- Present: play the screens at real size, following their links like a Figma prototype ----------
const order = () => frames().filter(f => f.kind === 'page' && !f.section.system);
function flowFor(id) {
  const f = find(id), same = f && state.flows.find(x => { const g = find(x.start); return g && g.section.id === f.section.id; });
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
function step(n) { const list = order(), i = list.findIndex(f => f.id === playing); playing = list[(i + n + list.length) % list.length].id; showPlaying(true); }
$('p-frame').addEventListener('load', () => {
  let path; try { path = decodeURIComponent($('p-frame').contentWindow.location.pathname).replace(/^\//, ''); } catch (e) { return; }
  const hit = order().find(f => f.src === path); if (hit && hit.id !== playing) { playing = hit.id; showPlaying(false); }
  try { applyView($('p-frame').contentDocument); } catch (e) {}
  try { $('p-frame').contentDocument.addEventListener('keydown', e => { if (e.target.closest('input, textarea, select, [contenteditable]')) return; if (e.key === 'Escape') closePresent(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); }); } catch (e) {}
});
function closePresent() { $('present').hidden = true; $('p-frame').src = 'about:blank'; if (playing && !narrow) { select(playing); focusFrame(playing); } playing = null; }
$('p-prev').addEventListener('click', () => step(-1)); $('p-next').addEventListener('click', () => step(1));
$('p-close').addEventListener('click', closePresent);
$('p-restart').addEventListener('click', () => { playing = flow ? flow.start : find(playing).section.frames[0].id; showPlaying(true); });
addEventListener('resize', () => { if (playing) showPlaying(false); });
$('play').addEventListener('click', () => present(selected));

// ---------- Selection and tools ----------
function select(id) {
  selected = id; if (inspected && inspected.frame !== id) inspected = null;
  if (narrow && id && find(id)) paneId = id;
  render();
}
function setTool(t) { tool = t; if (t !== 'inspect') inspected = null; render(); }
for (const t of ['move', 'comment', 'inspect']) $('tool-' + t).addEventListener('click', () => setTool(tool === t && t !== 'move' ? 'move' : t));

// ---------- Review one at a time: full size, plain questions; options flip like a prototype ----------
function reviewItems() {
  const items = [];
  for (const s of state.sections.filter(isDesign)) {
    const ready = pagesOf(s);
    if (s.choose) { if (ready.length) items.push({section: s, frames: ready.map(f => ({...f, section: s}))}); }
    else for (const f of ready) if (state.approvals[f.id] !== 'approved' || touched.has(f.id)) items.push({section: s, frames: [{...f, section: s}]});
  }
  return items;
}
function startReview() { const items = reviewItems(); reviewing = {items, i: 0, option: 0, answers: {}}; $('review').hidden = false; showReview(true); }
function closeReview() { $('review').hidden = true; $('r-frame').src = 'about:blank'; reviewing = null; selected = null; render(); if (!narrow) fitDecision(); }
function fitReview(f) {
  const frame = $('r-frame'); frame.style.width = f.w + 'px'; frame.style.height = f.h + 'px';
  const r = $('r-stage').getBoundingClientRect(); frame.style.transform = 'scale(' + Math.min(1, (r.width - 48) / f.w, (r.height - 96) / f.h) + ')';
  $('review').dataset.device = f.device;
}
const btn = (text, cls, fn, pressed) => { const b = el('button', {type: 'button', className: 'pill ' + (cls || ''), textContent: text}); if (pressed != null) b.setAttribute('aria-pressed', pressed); b.onclick = fn; return b; };
function showReview(load) {
  const R = reviewing, panel = $('r-panel');
  if (!R.items.length || R.i >= R.items.length) {
    $('r-pill').hidden = true; $('r-frame').src = 'about:blank';
    const done = touched.size + Object.values(picks).filter(Boolean).length;
    panel.replaceChildren(el('h2', {textContent: R.items.length ? 'That is every screen' : 'Nothing left to review'}),
      el('p', {className: 'muted', textContent: done ? 'Send your answers to Seenry, or go back to change any of them.' : 'Every screen is already approved.'}),
      el('span', {className: 'grow'}),
      el('div', {className: 'row'}, R.items.length ? btn('Back', '', () => { R.i = R.items.length - 1; showReview(true); }) : '', btn('See the whole canvas', '', closeReview), btn('Send to Seenry', 'ink', () => { closeReview(); send(); })));
    return;
  }
  const item = R.items[R.i], s = item.section, f = item.frames[s.choose ? R.option : 0];
  fitReview(f); if (load) $('r-frame').src = f.src + '?v=' + f.rev;
  const pill = $('r-pill'); pill.hidden = !s.choose;
  if (s.choose) pill.replaceChildren(...item.frames.map((o, j) => { const b = el('button', {type: 'button', textContent: (j + 1) + '  ' + short(o)}); b.toggleAttribute('data-active', j === R.option); b.onclick = () => { R.option = j; showReview(true); }; return b; }));
  const nav = el('div', {className: 'row'}, btn('← Back', '', () => { if (R.i > 0) { R.i--; R.option = 0; showReview(true); } }), el('span', {className: 'grow'}), btn('Close', '', closeReview));
  const head = [el('p', {className: 'muted', textContent: s.name + ' · ' + (R.i + 1) + ' of ' + R.items.length}), el('h2', {textContent: s.choose ? 'Pick one' : f.name})];
  if (s.choose) {
    const isPick = picks[s.id] === f.id, isRiff = riffs.some(r => r.frame === f.id);
    const risk = f.risk ? attr(el('span', {className: 'risk', textContent: f.risk === 'bold' ? 'Bold' : 'Safe'}), 'data-risk', f.risk) : '';
    panel.replaceChildren(...head,
      el('p', {className: 'muted', textContent: 'Flip with the tabs below or keys 1 to ' + item.frames.length + '. Each one is a different direction.'}),
      el('div', {className: 'q'}, el('div', {className: 'row'}, el('strong', {textContent: short(f)}), risk),
        f.axis ? el('p', {className: 'muted', textContent: f.axis}) : '', f.wins ? el('p', {textContent: 'Right when: ' + f.wins}) : '', f.cost ? el('p', {className: 'muted', textContent: 'Costs: ' + f.cost}) : '', !f.axis && f.note ? el('p', {className: 'muted', textContent: f.note}) : ''),
      el('div', {className: 'row'},
        btn(isPick ? 'Picked' : 'Pick this', 'ink', () => { picks[s.id] = f.id; for (let k = riffs.length - 1; k >= 0; k--) if (riffs[k].section === s.id) riffs.splice(k, 1); R.i++; R.option = 0; showReview(true); }),
        btn(isRiff ? 'Asked for more like this' : 'More like this', '', () => { if (!isRiff) riffs.push({section: s.id, frame: f.id}); picks[s.id] = null; R.i++; R.option = 0; showReview(true); })),
      el('span', {className: 'grow'}), nav);
    return;
  }
  const asks = f.ask && f.ask.length ? f.ask : DEFAULT_ASK, answers = R.answers[f.id] = R.answers[f.id] || {};
  const questions = asks.map(q => {
    const a = answers[q] = answers[q] || {choice: '', text: ''};
    const choose = c => () => { a.choice = a.choice === c ? '' : c; showReview(false); };
    const box = el('textarea', {placeholder: 'What should change? (optional)', value: a.text}); box.oninput = () => { a.text = box.value; };
    return el('div', {className: 'q'}, el('span', {textContent: q}), el('div', {className: 'row'}, btn('Yes', '', choose('Yes'), a.choice === 'Yes'), btn('No', '', choose('No'), a.choice === 'No')), a.choice ? box : '');
  });
  const commit = verdict => () => {
    for (const q of asks) { const a = answers[q]; if (!a.choice && !a.text) continue; const k = notes.findIndex(n => n.frame === f.id && n.target === 'Q: ' + q); const note = {frame: f.id, selector: '', target: 'Q: ' + q, text: [a.choice, a.text].filter(Boolean).join(' · ')}; if (k >= 0) notes[k] = note; else notes.push(note); }
    status[f.id] = verdict; touched.add(f.id); R.i++; showReview(true);
  };
  panel.replaceChildren(...head, f.note ? el('p', {className: 'muted', textContent: f.note}) : '', ...questions,
    el('div', {className: 'row'}, btn('Approve', 'ink', commit('approved')), btn('Needs changes', '', commit('change')), btn('Skip', '', () => { R.i++; showReview(true); })),
    el('span', {className: 'grow'}), nav);
}
addEventListener('resize', () => { if (reviewing && reviewing.i < reviewing.items.length) { const it = reviewing.items[reviewing.i]; fitReview(it.frames[it.section.choose ? reviewing.option : 0]); } });

function renderCover() {
  const box = document.querySelector('.frame[data-id="cover"] .cover'); if (!box) return;
  const design = state.sections.filter(s => !s.system && !s.reference), all = design.flatMap(s => pagesOf(s));
  const approved = all.filter(f => status[f.id] === 'approved').length, updated = Math.max(0, ...frames().map(f => f.rev || 0));
  box.replaceChildren(
    el('p', {className: 'meta', textContent: [state.stage && state.stage[0].toUpperCase() + state.stage.slice(1), state.owner, updated ? 'Updated ' + new Date(updated).toLocaleDateString() : ''].filter(Boolean).join(' · ')}),
    el('h1', {textContent: state.title}), state.description ? el('p', {textContent: state.description}) : '',
    el('p', {className: 'meta', textContent: all.length + ' screens in ' + design.length + ' sections · ' + approved + ' approved' + (state.library ? ' · Design system: ' + state.library : '')}),
    el('div', {className: 'cover-grid'}, ...design.map(s => { const n = s.frames.filter(f => status[f.id] === 'approved').length; return el('div', {className: 'cover-row'}, el('b', {textContent: s.name}), el('span', {textContent: s.choose ? 'Options' : n + ' of ' + s.frames.length + ' approved'})); })),
    state.log.length ? el('h2', {textContent: 'Recent changes'}) : '',
    state.log.length ? el('ul', {}, ...state.log.slice(0, 5).map(l => el('li', {textContent: String(l.at).slice(0, 10) + ' · ' + l.text}))) : '');
}

// ---------- The screen list ----------
const initials = name => (String(name || '').match(/\b\w/g) || ['Y']).slice(0, 2).join('').toUpperCase();
function row(title, sub, right, onclick, current, sectionId) {
  const b = el('button', {type: 'button', className: 'it'}, el('span', {}, el('span', {className: 't', textContent: title}), sub ? el('span', {className: 'sub'}, ...[].concat(sub)) : ''), el('span', {className: 'rt'}, ...[].concat(right || [])));
  b.setAttribute('aria-current', !!current); b.onclick = onclick; if (sectionId) b.dataset.section = sectionId;
  return b;
}
const sel = () => find(selected);
function renderSide() {
  if (!state) return;
  document.body.dataset.side = sideOpen ? 'open' : 'closed';
  $('side').hidden = !sideOpen; $('side-pill').hidden = sideOpen;
  $('title').textContent = state.title; $('pill-title').textContent = state.title; $('ptile').textContent = initials(state.title).slice(0, 1);
  $('stage-label').textContent = state.stage ? state.stage[0].toUpperCase() + state.stage.slice(1) : '';
  $('me').textContent = initials(state.owner || 'You'); $('me-2').textContent = $('me').textContent; $('me').title = $('me-2').title = state.owner || 'You';
  $('error').hidden = !state.error; $('error').textContent = state.error || '';
  $('rounds').textContent = state.rounds ? state.rounds + (state.rounds === 1 ? ' round' : ' rounds') : '';
  $('sync').dataset.off = !online;
  const seenry = !!(state.sync && state.sync.linked && state.sync.watching);
  $('sync-text').textContent = !live() ? 'Saved copy, opened from disk' : !online ? 'Reconnecting…' : seenry ? 'Synced to Seenry' : 'Synced with the folder';
  $('sync').title = seenry ? 'Every change is pushed to ' + (state.sync.account || 'your Seenry account') + '; feedback sent online comes back here' : 'Screens update the moment their files change';
  $('share').title = seenry ? 'Copy the Seenry link to this canvas' : 'Share this canvas';
  const q = filterText.toLowerCase(), hit = (...t) => !q || t.join(' ').toLowerCase().includes(q);
  const current = sel(), cur = s => current && current.section.id === s.id;
  const design = placed().filter(isDesign), needs = [], done = [], other = [];
  for (const s of design) {
    const ready = pagesOf(s), dev = ready[0] && ready[0].device !== 'desktop' ? ' · ' + ready[0].device : '';
    if (!ready.length) continue;
    if (isOpen(s)) needs.push(row(s.name, ready.length + ' direction' + (ready.length === 1 ? '' : 's') + (state.rounds ? ' · round ' + (state.rounds + 1) : ''), [el('span', {className: 'dot', style: 'background:var(--amber)'}), el('span', {className: 'need', textContent: 'Pick'})], () => go(s), cur(s), s.id));
    else {
      const left = ready.filter(f => status[f.id] !== 'approved' && !(s.choose && picks[s.id]));
      if (left.length && !s.choose) needs.push(row(s.name, plural(ready.length, 'screen', 'screens') + ' · ' + left.length + ' to review' + dev, [el('span', {className: 'dot', style: 'background:var(--amber)'}), el('span', {className: 'need', textContent: 'Review'})], () => go(s), cur(s), s.id));
      else (s.choose && picks[s.id] ? other : done).push(row(s.name, s.choose && picks[s.id] ? 'Picked ' + short(find(picks[s.id])) : ready.length + (ready.length === 1 ? ' screen' : ' screens') + dev, s.choose && picks[s.id] ? el('span', {className: 'm', textContent: 'Send'}) : icon('check', 'ok'), () => go(s), cur(s), s.id));
    }
  }
  const a = agentNow(), busy = working().map(f => {
    const part = (a.frame === f.id && a.text) || (missing(f)[0] ? 'Next: ' + missing(f)[0] : f.kind === 'pending' ? 'Being drawn' : 'Building');
    const follow = attr(el('span', {className: 'follow', textContent: 'Follow'}), 'data-on', following);
    follow.onclick = e => { e.stopPropagation(); following = true; show(f.id, true); renderSide(); };
    const t = el('span', {textContent: clock(Date.now() - (startOf(f.id) || Date.now()))}); t.dataset.since = startOf(f.id) || '';
    return row(f.section.name + ' · ' + short(f), [document.createTextNode(part + ' · '), follow], [icon('spin', 'spin'), t], () => { select(f.id); focusFrame(f.id); }, current && current.id === f.id);
  });
  const system = state.sections.filter(s => (s.system && !s.archived && !s.cover) || s.reference).map(s => row(s.id === 'foundations' ? 'Tokens' : s.name, s.id === 'foundations' ? 'Type, colour, space' : s.id === 'components' ? 'Shared controls, drawn from components.css' : s.reference ? s.frames.length + ' reference' + (s.frames.length === 1 ? '' : 's') : s.note, '', () => go(s), cur(s), s.id));
  const group = (name, items, count) => { const list = items.filter(b => hit(b.textContent)); return list.length ? [el('div', {className: 'gl'}, document.createTextNode(name), count ? el('span', {textContent: String(list.length)}) : ''), ...list] : []; };
  const all = [...group('Needs you', needs, true), ...group('Seenry is working', busy, true), ...group('Picked, not sent yet', other, true), ...group('Approved', done, true), ...group('System', system, false)];
  $('list').replaceChildren(...(all.length ? all : [el('p', {className: 'sb-empty', textContent: q ? 'No screen matches.' : 'Seenry hasn’t drawn anything yet. Screens appear here the moment they are written.'})]));
  const w = working()[0];
  $('pill-work').hidden = !w && !state.agentWaiting;
  $('pill-work').replaceChildren(...(w ? [icon('spin', 'spin'), document.createTextNode('Seenry is building ' + short(w))] : state.agentWaiting ? [el('span', {className: 'dot', style: 'background:var(--amber)'}), document.createTextNode('Seenry is waiting for you')] : []));
}
function go(s) { if (narrow) { const f = s.frames[0]; if (f) { paneId = f.id; render(); } return; } shownSection = s.id; selected = null; inspected = null; fitSection(s.id); render(); }
function toggleSide() { sideOpen = !sideOpen; store.set('seenry-canvas-side', sideOpen ? 'open' : 'closed'); render(); }
$('side-close').onclick = toggleSide; $('side-pill').onclick = toggleSide;
$('project').onclick = () => { selected = 'cover'; focusFrame('cover'); render(); };
$('find').onclick = () => { $('filter').hidden = !$('filter').hidden; if (!$('filter').hidden) $('filter').focus(); else { filterText = ''; $('filter').value = ''; renderSide(); } };
$('filter').oninput = () => { filterText = $('filter').value; renderSide(); };
$('filter').onkeydown = e => { if (e.key === 'Escape') $('find').click(); };
$('history-open').onclick = e => {
  e.stopPropagation(); const box = $('history'), open = box.hidden;
  closeMenus(); if (!open) return;
  const archive = state.sections.find(s => s.archived);
  box.replaceChildren(el('h4', {textContent: 'Rounds'}), state.log.length ? el('ul', {}, ...state.log.map(l => el('li', {}, el('span', {textContent: String(l.at).slice(5, 10)}), el('span', {textContent: l.text})))) : el('p', {className: 'm', textContent: 'No rounds yet. Seenry logs one each time it applies your feedback.'}),
    el('h4', {textContent: 'What Seenry did'}), el('ul', {}, ...(state.activity || []).slice(-12).reverse().map(a => el('li', {}, el('span', {textContent: ago(a.at)}), el('span', {textContent: a.text})))),
    archive ? btn('Show the archive (' + archive.frames.length + ')', 'soft', () => { closeMenus(); go(archive); }) : '');
  box.style.left = (sideOpen ? 292 : 12) + 'px'; box.hidden = false; $('history-open').setAttribute('aria-expanded', 'true');
};

// ---------- Presence, composer, inspector ----------
function renderTop() {
  const a = agentNow(), w = working()[0];
  const text = state.agentWaiting ? 'Seenry is waiting for you' : w ? 'Seenry is building ' + short(w) : a.active ? 'Seenry is working' : a.last ? 'Seenry · last step ' + ago(a.last.at) + (ago(a.last.at) === 'now' ? '' : ' ago') : 'Seenry is ready';
  $('mark').title = text + (following ? ' · following (A)' : ' · press A to follow');
  $('mark').setAttribute('aria-label', $('mark').title); $('mark').setAttribute('aria-pressed', following);
  $('mark').dataset.active = !!(w || a.active) && !state.agentWaiting; $('mark').dataset.waiting = !!state.agentWaiting;
}
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
function countText() {
  const p = Object.values(picks).filter(Boolean).length, r = riffs.length, ok = [...touched].filter(id => status[id] === 'approved').length, ch = [...touched].filter(id => status[id] === 'change').length;
  const n = notes.length + (chips.length || ($('general').value.trim() ? 1 : 0));
  return [p && plural(p, 'pick', 'picks'), r && r + ' more like', ok && ok + ' approved', ch && ch + ' to change', n && plural(n, 'note', 'notes')].filter(Boolean).join(' · ');
}
function flash(text) { flashText = text; clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashText = ''; renderComposer(); }, 4200); renderComposer(); }
function renderComposer() {
  $('chips').replaceChildren(...chips.map((c, i) => { const x = attr(el('button', {type: 'button'}, icon('x')), 'aria-label', 'Remove ' + c.label); x.onclick = () => { chips.splice(i, 1); render(); }; return el('span', {className: 'chip', title: c.target}, icon(c.selector ? 'inspect' : 'comment'), el('span', {textContent: c.label}), x); }));
  $('general').placeholder = chips.length ? 'What should change?' : state && state.agentWaiting ? 'Seenry is waiting. Tell it what to change' : 'Tell Seenry what to change';
  const t = flashText || countText();
  $('status').textContent = t; $('status').dataset.flash = !!flashText;
  $('send').disabled = !countText();
  const f = sel(), d = device || (f && f.kind === 'page' ? f.device : 'desktop');
  $('device').replaceChildren(icon(d === 'phone' || d === 'tablet' ? 'phone' : 'monitor'), document.createTextNode(device ? DEVICE_NAMES[d] : DEVICE_NAMES[d] || 'Desktop'), icon('down'));
  for (const t of ['move', 'comment', 'inspect']) $('tool-' + t).setAttribute('aria-pressed', tool === t);
}
$('general').addEventListener('input', renderComposer);
$('general').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } else if (e.key === 'Backspace' && !$('general').value && chips.length) { chips.pop(); render(); } });
$('send').addEventListener('click', () => send());
function renderInspector() {
  const box = $('inspector'), f = sel();
  const specs = []; if (showSpecs && f && f.kind === 'page') { try { const doc = nodes[f.id].querySelector('iframe').contentDocument; specs.push(...doc.querySelectorAll('[data-spec]')); } catch (e) {} }
  const mine = inspected && f && inspected.frame === f.id;
  box.hidden = narrow || (!mine && !specs.length && !(tool === 'inspect' && f));
  if (box.hidden) return;
  const close = attr(el('button', {type: 'button', className: 'ib'}, icon('x')), 'aria-label', 'Close'); close.onclick = () => { inspected = null; if (tool === 'inspect') setTool('move'); else if (showSpecs) toggleSpecs(); render(); };
  const parts = [el('h3', {}, el('span', {textContent: mine ? inspected.name : short(f)}), close)];
  if (mine) {
    const raw = inspected.rows.filter(r => r.raw).length;
    parts.push(inspected.text ? el('p', {textContent: '“' + inspected.text + '”'}) : '',
      el('dl', {className: 'specs'}, ...inspected.rows.flatMap(r => [el('dt', {textContent: r.label}), el('dd', {}, el('code', {textContent: r.value}), r.token ? el('code', {className: 'tok', textContent: '  ' + r.token}) : r.raw ? el('code', {className: 'raw', textContent: '  not a variable'}) : '')])),
      el('p', {style: 'color:' + (raw ? 'var(--amber)' : 'var(--green)'), textContent: raw ? raw + ' value' + (raw === 1 ? '' : 's') + ' not from tokens.css' : 'Every value comes from tokens.css'}));
  } else if (!specs.length) parts.push(el('p', {textContent: 'Click any element on a screen to see its values and the variable behind each.'}));
  if (specs.length) parts.push(el('h3', {textContent: 'Specs for developers'}), el('dl', {className: 'specs'}, ...specs.flatMap((n, i) => [el('dt', {textContent: String(i + 1)}), el('dd', {textContent: ((n.innerText || n.getAttribute('aria-label') || n.tagName.toLowerCase()).trim().replace(/\s+/g, ' ').slice(0, 40)) + ': ' + n.getAttribute('data-spec')})])));
  box.replaceChildren(...parts);
}
function renderHint() {
  const t = playing || reviewing ? '' : tool === 'comment' ? 'Click any element on a screen to point Seenry at it. Esc to stop.' : tool === 'inspect' ? 'Click any element to see its values and variables. Esc to stop.' : '';
  $('hint').hidden = !t; $('hint').textContent = t;
}

// ---------- Menus: More, the right-click menu and the device switcher ----------
function closeMenus() { $('menu').hidden = true; $('history').hidden = true; $('share-pop').hidden = true; for (const id of ['more', 'device', 'history-open', 'share']) $(id).setAttribute('aria-expanded', 'false'); }
function openMenu(items, x, y, from) {
  closeMenus();
  const menu = $('menu');
  menu.replaceChildren(...items.filter(Boolean).map(it => {
    if (it === 'sep') return el('hr');
    const b = attr(el('button', {type: 'button', disabled: !!it.disabled}, el('span', {className: 'c'}, it.on ? icon('check') : ''), el('span', {textContent: it.label}), it.key ? el('span', {className: 'k', textContent: it.key}) : ''), 'role', it.on == null ? 'menuitem' : 'menuitemcheckbox');
    if (it.on != null) b.setAttribute('aria-checked', !!it.on);
    b.onclick = () => { closeMenus(); it.run(); };
    return b;
  }));
  menu.hidden = false;
  const r = menu.getBoundingClientRect();
  menu.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
  menu.style.top = Math.max(8, Math.min(from ? y - r.height - 8 : y, innerHeight - r.height - 8)) + 'px';
  if (from) from.setAttribute('aria-expanded', 'true');
  menu.querySelector('button:not(:disabled)')?.focus();
}
function moreItems() {
  const f = sel(), page = f && f.kind === 'page';
  return [{label: 'Review one at a time', key: 'R', run: startReview}, {label: 'Present', key: 'P', run: () => present(selected)}, 'sep',
    {label: 'Follow Seenry', key: 'A', on: following, run: toggleFollow}, {label: 'Prototype links', key: 'F', on: showLinks, run: toggleLinks},
    {label: 'Layout grid', key: 'G', on: showGrid, run: toggleGrid}, {label: 'Specs', key: 'S', on: showSpecs, run: toggleSpecs},
    {label: 'Screens in dark mode', key: 'D', on: dark, run: toggleDark}, {label: 'Whole pages', key: 'H', on: fullHeight, run: toggleFull},
    {label: 'Screen list', key: 'L', on: sideOpen, run: toggleSide}, 'sep',
    {label: 'Show the decision', key: '2', run: fitDecision}, {label: 'Fit everything', key: '1', run: fitAll},
    page ? {label: 'Comment on ' + short(f), run: () => addScreen(f)} : null,
    page ? {label: 'Open ' + short(f) + ' in a new tab', run: () => open(f.src, '_blank', 'noopener')} : null];
}
$('more').addEventListener('click', e => { e.stopPropagation(); if ($('more').getAttribute('aria-expanded') === 'true') return closeMenus(); const r = $('more').getBoundingClientRect(); openMenu(moreItems(), r.left, r.top, $('more')); });
$('device').addEventListener('click', e => {
  e.stopPropagation(); if ($('device').getAttribute('aria-expanded') === 'true') return closeMenus();
  const r = $('device').getBoundingClientRect();
  openMenu([{label: 'As drawn', on: !device, run: () => setDevice(null)}, ...Object.keys(DEVICES).map(d => ({label: DEVICE_NAMES[d] + ' · ' + DEVICES[d][0], on: device === d, run: () => setDevice(d)}))], r.left, r.top, $('device'));
});
addEventListener('pointerdown', e => { if (!e.target.closest('#menu, #history, #more, #device, #history-open, #share-pop, #share')) closeMenus(); }, true);
function setDevice(d) { device = d; for (const k in heights) delete heights[k]; build(); if (narrow) { paneKey = ''; buildPane(); } else fitDecision(); render(); }
function toggleFollow() { following = !following; if (following) show(agentNow().frame || (working()[0] || {}).id, true); render(); }
function toggleLinks() { showLinks = !showLinks; place(); }
function toggleGrid() { showGrid = !showGrid; eachDoc(applyView); }
function toggleSpecs() { showSpecs = !showSpecs; eachDoc(applyView); render(); }
function toggleDark() { dark = !dark; eachDoc(applyView); flash(dark ? 'Screens in dark mode' : 'Screens in light mode'); }
function toggleFull() { fullHeight = !fullHeight; place(); }
$('mark').addEventListener('click', toggleFollow);
async function copy(text) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; } }
function sharePop(title, text, code, actions) {
  const box = $('share-pop');
  box.replaceChildren(el('b', {textContent: title}), el('p', {textContent: text}), code ? el('code', {textContent: code}) : '', el('div', {className: 'row'}, ...actions, btn('Done', 'ghost', () => { box.hidden = true; $('share').focus(); })));
  box.hidden = false; $('share').setAttribute('aria-expanded', 'true');
}
$('share').addEventListener('click', async e => {
  e.stopPropagation();
  if (!live()) return flash('This is a saved copy: send canvas.html with its folder');
  if (!$('share-pop').hidden) { closeMenus(); return; }
  closeMenus(); $('share').disabled = true;
  let r = null; try { r = await (await fetch('share', {method: 'POST'})).json(); } catch (err) {}
  $('share').disabled = false;
  if (r && r.linked && r.url) {
    const done = await copy(r.url);
    sharePop(done ? 'Seenry link copied' : 'Seenry link', 'It opens this canvas in your Seenry account, kept in sync with this folder. Invite people from there to view and comment.', r.url, [btn('Open', 'soft', () => window.open(r.url, '_blank', 'noopener'))]);
  } else if (r && r.linked) {
    sharePop('Seenry did not answer', (r.error || 'The canvas could not reach Seenry') + '. The local address still works on this computer; try again in a moment.', '', []);
  } else {
    sharePop('This link only works on this computer', 'Nobody else can open 127.0.0.1. Link this machine to your Seenry account, then press Share again. Ask your agent, or run this in the seenry-canvas skill:', 'node scripts/sync.mjs link', [btn('Copy local address', 'soft', async () => { flash(await copy(location.href) ? 'Address copied. It opens on this computer' : location.href); })]);
  }
});

// ---------- Live: who is doing what ----------
function blink(node) { if (!node || REDUCED.matches) return; node.classList.remove('is-blink'); void node.getBoundingClientRect(); node.classList.add('is-blink'); setTimeout(() => node.classList.remove('is-blink'), 220); }
(function idleBlink() { setTimeout(() => { if (!document.hidden) blink($('mark')); idleBlink(); }, 4000 + Math.random() * 5000); })();
// The mark looks toward the screen Seenry is working on.
function gaze() {
  const a = state ? agentNow() : {}, target = a.frame && nodes[a.frame], look = $('mark').querySelector('.seen-look');
  if (!look) return;
  if (!target || narrow || REDUCED.matches) { look.style.transform = ''; return; }
  const m = $('mark').getBoundingClientRect(), r = target.getBoundingClientRect(), dx = r.left + r.width / 2 - (m.left + m.width / 2), dy = r.top + Math.min(r.height, 300) / 2 - (m.top + m.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 420) * 3.2;
  look.style.transform = 'translate(' + (dx / d * k).toFixed(2) + 'px,' + (dy / d * k).toFixed(2) + 'px)';
}
function renderLive() {
  if (!state) return;
  renderSide(); renderTop(); ghostAll();
  const a = agentNow();
  if (a.last && a.last.at !== lastAt) { const fresh = lastAt !== ''; lastAt = a.last.at; if (fresh) blink($('mark')); if (following && fresh && a.frame) show(a.frame, true); }
  gaze();
}
function show(id, follow) {
  if (!id || !find(id)) return;
  if (narrow) { if (follow) { paneId = id; buildPane(); } return; }
  if (follow) { if (!replaying.has(id)) focusFrame(id); return; }
  select(id); focusFrame(id);
}
setInterval(() => { if (state) renderLive(); }, 15000);
setInterval(() => { document.querySelectorAll('[data-since]').forEach(n => { const t = Number(n.dataset.since); if (t) n.textContent = clock(Date.now() - t); }); }, 1000);

// Seenry's cursor. A screen is written to disk whole, so when one lands or changes the canvas compares it with what was
// there and plays the change back: the cursor travels to each new or changed component in reading order, it lands, and
// its text types in. With reduced motion the changed parts are outlined instead.
const SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'TEMPLATE', 'NOSCRIPT', 'BR', 'HEAD', 'SOURCE', 'TRACK']);
const snaps = new WeakMap(), born = new Set(), parked = new Map(), replaying = new Set();
let glideFrame = 0;
function glide(tx, ty, tz) {
  cancelAnimationFrame(glideFrame);
  const from = {x: view.x, y: view.y, z: view.z}, t0 = performance.now(), d = REDUCED.matches ? 0 : 560;
  const tick = now => { const p = d ? Math.min(1, (now - t0) / d) : 1, e = 1 - Math.pow(1 - p, 3); view.x = from.x + (tx - from.x) * e; view.y = from.y + (ty - from.y) * e; view.z = from.z + (tz - from.z) * e; apply(); if (p < 1) glideFrame = requestAnimationFrame(tick); else place(); };
  glideFrame = requestAnimationFrame(tick);
}
// Follow keeps the component being built in view: the frame's width fits the canvas and the view glides to the cursor.
function followUnit(fr, f, r) {
  if (!following || narrow || !fr.closest('#world')) return;
  const s = safe(), w = s.r - s.l, z = Math.min(1, (w - 120) / size(f)[0]), box = layout()[f.id];
  if (!box) return;
  const sy = s.t + (s.b - s.t) * 0.4 - (box.y + r.top + r.height / 2) * z, sx = s.l + w / 2 - (box.x + box.w / 2) * z;
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
    if (!(narrow ? fr.closest('#stage') : fr.closest('#world'))) { reveal(); return; }
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
    arm(next, f);
    frameLoaded(next, f, () => { next.style.visibility = ''; delete next.dataset.next; fr.remove(); });
  });
  fr.after(next);
}
function replay(fr, f, units, fresh) {
  const doc = fr.contentDocument, win = doc.defaultView, token = {};
  doc.__seenry = token;
  const partOf = n => { const p = n.closest('[data-seenry-part]'); return p ? p.getAttribute('data-seenry-part') : ''; };
  replaying.add(f.id); place();
  const m = (fr.style.transform || '').match(/scale\(([\d.]+)\)/), k = fr.closest('#world') ? view.z : m ? Number(m[1]) : 1, inv = Math.min(8, 1 / Math.max(0.05, k));
  doc.getElementById('seenry-cursor')?.remove(); doc.getElementById('seenry-replay')?.remove();
  const css = doc.createElement('style'); css.id = 'seenry-replay';
  css.textContent = '[data-seenry-wait]{opacity:0!important}[data-seenry-in]{animation:seenry-in 280ms cubic-bezier(.23,1,.32,1) both}@keyframes seenry-in{from{opacity:0;translate:0 8px}to{opacity:1;translate:0 0}}[data-seenry-typing]::after{content:"";display:inline-block;width:.08em;min-width:2px;height:1em;margin-left:2px;vertical-align:-.12em;background:' + LIVE + ';animation:seenry-caret .9s steps(1) infinite}@keyframes seenry-caret{50%{opacity:0}}[data-seenry-mark]{outline:2px solid ' + LIVE + '!important;outline-offset:4px!important;border-radius:4px}#seenry-cursor{position:absolute;left:0;top:0;z-index:2147483647;pointer-events:none;transform-origin:0 0;transition:transform 420ms cubic-bezier(.23,1,.32,1),opacity 300ms;display:flex;align-items:flex-start}#seenry-cursor svg{width:15px;height:15px;flex:none;filter:drop-shadow(0 1px 1.5px rgb(0 0 0 / .25))}#seenry-cursor span{height:22px;margin:11px 0 0 -2px;padding:0 9px;border-radius:3px 99px 99px 99px;background:' + LIVE + ';color:#fff;font:500 12px/22px "Open Runde",ui-rounded,system-ui,sans-serif;white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 0 0 1px rgb(255 255 255 / .6),0 4px 12px rgb(43 99 232 / .28)}#seenry-cursor.flip{flex-direction:row-reverse}#seenry-cursor.flip span{margin:11px -2px 0 0;border-radius:99px 3px 99px 99px}#seenry-cursor.flip svg{transform:scaleX(-1)}';
  doc.head.append(css);
  const cur = doc.createElement('div'); cur.id = 'seenry-cursor'; cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = ARROW + '<span>Seenry</span>'; doc.body.append(cur);
  let [x, y] = parked.get(f.id) || [24, 24];
  // The arrow's tip sits on the element's top-left corner; near the right edge the name flips to the left of the arrow.
  const at = (nx, ny, d) => {
    const w = cur.offsetWidth * inv, flip = nx + w > win.innerWidth - 8;
    cur.classList.toggle('flip', flip);
    cur.style.transitionDuration = d + 'ms, 300ms'; x = nx; y = ny;
    cur.style.transform = 'translate(' + Math.max(2, flip ? x - w + 15 * inv : x) + 'px,' + y + 'px) scale(' + inv + ')';
  };
  const pos = n => { const r = n.getBoundingClientRect(); return [Math.max(2, r.left + win.scrollX - 2 * inv), Math.max(2, r.top + win.scrollY - 2 * inv)]; };
  let quiet = 0;
  const say = text => { cur.lastChild.textContent = text; clearTimeout(quiet); quiet = setTimeout(() => { cur.lastChild.textContent = 'Seenry'; }, 1500); };
  const follow = n => { const r = n.getBoundingClientRect(); if (r.top < 0 || r.bottom > win.innerHeight) win.scrollTo({top: Math.max(0, r.top + win.scrollY - win.innerHeight * 0.3), behavior: REDUCED.matches ? 'auto' : 'smooth'}); };
  at(x, y, 0);
  const done = () => setTimeout(() => {
    if (doc.__seenry !== token) return;
    replaying.delete(f.id); renderLive(); place();
    cur.style.opacity = '0';
    setTimeout(() => { if (doc.__seenry !== token) return; cur.remove(); css.remove(); for (const n of doc.querySelectorAll('[data-seenry-in],[data-seenry-mark],[data-seenry-wait]')) { n.removeAttribute('data-seenry-in'); n.removeAttribute('data-seenry-mark'); n.removeAttribute('data-seenry-wait'); } }, 420);
  }, REDUCED.matches ? 2400 : 6000);
  if (REDUCED.matches) { units.forEach(n => n.setAttribute('data-seenry-mark', '')); follow(units[0]); at(...pos(units[0]), 0); done(); return; }
  units.forEach(n => n.setAttribute('data-seenry-wait', ''));
  const stepMs = Math.max(70, Math.min(360, 5200 / units.length)), travel = Math.min(420, Math.max(120, stepMs * 0.7));
  let i = 0;
  const type = n => {
    const kids = [...n.childNodes], text = n.textContent, c = win.getComputedStyle(n);
    if (kids.some(k => k.nodeType === 1) || !text.trim() || text.length > 420 || /^inline$/.test(c.display)) return 0;
    const ms = units.length > 40 ? stepMs * 0.8 : Math.min(1100, Math.max(160, text.length * 16)), r = n.getBoundingClientRect(), keepH = n.style.minHeight;
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
    if (part) say('Seenry · ' + part);
    follow(n); at(...pos(n), travel); parked.set(f.id, [x, y]); followUnit(fr, f, n.getBoundingClientRect());
    setTimeout(() => {
      if (doc.__seenry !== token) return;
      n.removeAttribute('data-seenry-wait'); n.setAttribute('data-seenry-in', '');
      const typed = type(n);
      setTimeout(next, Math.max(stepMs, typed + 60));
    }, travel * 0.8);
  };
  setTimeout(next, 200);
}

// ---------- Inside an agent app's side pane: tabs, one screen fitted to the width ----------
const wantsNarrow = () => { const v = new URLSearchParams(location.search).get('view'); return v === 'pane' || (v !== 'canvas' && matchMedia('(max-width: 819px)').matches); };
function setNarrow(on) {
  narrow = on; document.body.dataset.narrow = on;
  (on ? $('pane') : document.body).append($('composer'));
  if (on) { paneKey = ''; buildPane(); } else { $('stage').replaceChildren(); fitted = false; place(); }
  render();
}
matchMedia('(max-width: 819px)').addEventListener('change', () => setNarrow(wantsNarrow()));
function buildPane() {
  if (!state) return;
  const design = placed().filter(isDesign).filter(s => s.frames.length);
  let f = find(paneId);
  if (!f || !isDesign(f.section)) { const s = design.find(isOpen) || design[0]; f = s ? find(s.frames[0].id) : null; }
  paneId = f ? f.id : null;
  const tabs = $('tabs');
  if (!f) { tabs.replaceChildren(); $('pane-act').replaceChildren(); $('stage').replaceChildren(el('div', {className: 'p-empty'}, el('span', {className: 'mark', style: 'width:40px;height:40px', innerHTML: EYES}), el('span', {textContent: 'Seenry hasn’t drawn anything yet. Screens appear here the moment they are written.'}))); return; }
  const s = f.section, list = s.frames.map(x => ({...x, section: s})), i = list.findIndex(x => x.id === f.id);
  const pickSection = design.length > 1 ? el('select', {}, ...design.map(d => el('option', {value: d.id, textContent: d.name, selected: d.id === s.id}))) : '';
  if (pickSection) { pickSection.setAttribute('aria-label', 'Section'); pickSection.onchange = () => { const d = design.find(x => x.id === pickSection.value); paneId = d.frames[0].id; render(); }; }
  tabs.replaceChildren(pickSection, ...list.map(x => { const b = attr(attr(el('button', {type: 'button', className: 'pill'}, building(x) ? icon('spin', 'spin') : '', document.createTextNode(short(x))), 'role', 'tab'), 'aria-selected', x.id === f.id); b.onclick = () => { paneId = x.id; selected = x.id; render(); }; return b; }), el('span', {className: 'n', textContent: (i + 1) + ' of ' + list.length}));
  const key = f.id + '@' + f.rev + '@' + f.kind + '@' + device;
  if (paneKey !== key) {
    paneKey = key;
    const body = el('div', {className: 'body'});
    if (f.kind === 'page') { const fr = el('iframe', {src: f.src + '?v=' + f.rev, title: f.name}); fr.addEventListener('load', () => { arm(fr, f); frameLoaded(fr, f); }); body.append(fr); }
    else body.append(blankFor(f));
    $('stage').replaceChildren(body);
  }
  $('pane-act').replaceChildren(...actionsFor(f, true), el('span', {className: 'why', textContent: f.caption || '', title: f.axis || f.note || ''}));
  scalePane();
}
function scalePane() {
  const f = find(paneId), body = $('stage').querySelector('.body'); if (!f || !body) return;
  const W = $('stage').clientWidth, H = $('stage').clientHeight, [w] = size(f), k = Math.min(1, W / w);
  Object.assign(body.style, {width: Math.round(w * k) + 'px', height: H + 'px'});
  const fr = body.querySelector('iframe'); if (fr) Object.assign(fr.style, {width: w + 'px', height: Math.round(H / k) + 'px', transform: 'scale(' + k + ')'});
}
new ResizeObserver(() => { if (narrow) scalePane(); }).observe($('stage'));

// ---------- Send: picks, approvals, chips and text go to the agent's wait ----------
function summary(extra, general) {
  const lines = [];
  for (const s of state.sections) if (s.choose) lines.push(s.name + ': ' + (picks[s.id] ? 'picked ' + picks[s.id] : riffs.some(r => r.section === s.id) ? 'more like ' + riffs.filter(r => r.section === s.id).map(r => r.frame).join(', ') : 'no pick'));
  const of = v => frames().filter(f => status[f.id] === v).map(f => f.id);
  if (of('approved').length) lines.push('Approved: ' + of('approved').join(', '));
  if (of('change').length) lines.push('Needs changes: ' + of('change').join(', '));
  [...notes, ...extra].forEach((n, i) => lines.push((i + 1) + '. ' + n.frame + ' ' + n.target + (n.selector ? ' [' + n.selector + ']' : '') + ': ' + n.text));
  if (general) lines.push('General: ' + general);
  return lines.join('\n');
}
async function send() {
  const text = $('general').value.trim();
  if (chips.length && !text) { flash('Say what to change about ' + chips[0].label); $('general').focus(); return; }
  const drafted = chips.map(c => ({frame: c.frame, target: c.target, selector: c.selector, text})), general = chips.length ? '' : text;
  const feedback = {stage: state.stage, picks, riff: riffs.slice(), frames: frames().filter(f => status[f.id] && touched.has(f.id)).map(f => ({id: f.id, status: status[f.id]})), notes: [...notes, ...drafted].map(({x, y, ...n}) => n), general};
  if (!feedback.frames.length && !feedback.notes.length && !general && !feedback.riff.length && !Object.values(picks).some(Boolean)) { flash('Pick, approve or say what to change first'); return; }
  let saved = false;
  if (live()) { try { saved = (await fetch('feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(feedback)})).ok; } catch (e) {} }
  try { await navigator.clipboard.writeText(summary(drafted, general)); } catch (e) {}
  touched.clear(); notes.length = 0; chips.length = 0; riffs.length = 0; $('general').value = '';
  flash(!saved ? 'Copied. Paste it to your agent' : state.agentWaiting ? 'Sent. Seenry has it' : 'Saved. Tell your agent you are done');
  render();
}

// ---------- Pan, zoom and select on the canvas ----------
const viewport = $('viewport'); let drag = null;
viewport.addEventListener('pointerdown', e => {
  if (e.button > 1 || e.target.closest('#pick, .held')) return;
  const frame = e.target.closest('.frame');
  drag = {x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, id: frame ? frame.dataset.id : null, moved: false};
  viewport.setPointerCapture(e.pointerId);
});
viewport.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 4) return;
  if (!drag.moved && following) { following = false; renderTop(); }
  drag.moved = true; viewport.classList.add('panning'); view.x = drag.vx + dx; view.y = drag.vy + dy; apply();
});
const release = () => { if (!drag) return; viewport.classList.remove('panning'); if (!drag.moved) { if (drag.id) select(drag.id); else { selected = null; inspected = null; render(); } } drag = null; };
viewport.addEventListener('pointerup', release); viewport.addEventListener('pointercancel', release);
viewport.addEventListener('wheel', e => {
  if (following) { following = false; renderTop(); }
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, view.z * Math.exp(-e.deltaY * 0.01));
  else { view.x -= e.deltaX; view.y -= e.deltaY; apply(); }
}, {passive: false});
viewport.addEventListener('contextmenu', e => { e.preventDefault(); const frame = e.target.closest('.frame'); if (frame && frame.dataset.id !== selected) select(frame.dataset.id); openMenu(moreItems(), e.clientX, e.clientY); });
const centre = () => { const s = safe(); return [(s.l + s.r) / 2, (s.t + s.b) / 2]; };
$('zoom-in').addEventListener('click', () => zoomAt(...centre(), view.z * 1.25));
$('zoom-out').addEventListener('click', () => zoomAt(...centre(), view.z / 1.25));
$('zoom-level').addEventListener('click', () => zoomAt(...centre(), 1));
$('zoom-fit').addEventListener('click', fitAll);
addEventListener('keydown', e => {
  if (e.target.closest('textarea, input, select, dialog')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (!$('menu').hidden && e.key === 'Escape') { closeMenus(); return; }
  if (reviewing) {
    if (e.key === 'Escape') closeReview();
    const it = reviewing.items[reviewing.i], n = parseInt(e.key, 10);
    if (it && it.section.choose && n >= 1 && n <= it.frames.length) { reviewing.option = n - 1; showReview(true); }
    else if (it && it.section.choose && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { reviewing.option = (reviewing.option + (e.key === 'ArrowRight' ? 1 : it.frames.length - 1)) % it.frames.length; showReview(true); }
    return;
  }
  if (playing) { if (e.key === 'Escape') closePresent(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); return; }
  const k = e.key.toLowerCase();
  if (e.key === 'Escape') { tool = 'move'; selected = null; inspected = null; closeMenus(); render(); }
  else if (k === 'v') setTool('move');
  else if (k === 'c') setTool(tool === 'comment' ? 'move' : 'comment');
  else if (k === 'i') setTool(tool === 'inspect' ? 'move' : 'inspect');
  else if (k === 'a') toggleFollow();
  else if (k === 'l') toggleSide();
  else if (k === 'b' || e.key === '2') fitDecision();
  else if (k === 'm' || e.key === '1') fitAll();
  else if (k === 'p') present(selected);
  else if (k === 'f') toggleLinks();
  else if (k === 'g') toggleGrid();
  else if (k === 's') toggleSpecs();
  else if (k === 'r') startReview();
  else if (k === 'd') toggleDark();
  else if (k === 'h') toggleFull();
  else if (e.key === '+' || e.key === '=') zoomAt(...centre(), view.z * 1.25);
  else if (e.key === '-') zoomAt(...centre(), view.z / 1.25);
  else if (e.key === 'Enter' && selected) focusFrame(selected);
  else if (narrow && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const f = find(paneId); if (f) { const l = f.section.frames, i = l.findIndex(x => x.id === f.id); paneId = l[(i + (e.key === 'ArrowRight' ? 1 : l.length - 1)) % l.length].id; render(); } }
});

function render() {
  if (!state) return;
  document.title = state.title + ' · Seenry canvas';
  $('viewport').dataset.tool = tool;
  for (const s of state.sections) fillHead(s);
  renderComposer(); renderInspector(); renderCover(); renderHint();
  if (narrow) buildPane(); else place();
  renderLive();
}
function syncApprovals() {
  for (const f of frames()) { if (touched.has(f.id)) continue; if (state.approvals[f.id]) status[f.id] = state.approvals[f.id]; else delete status[f.id]; }
}
// For canvas.mjs shot: the canvas alone, fitted to the decision or to everything.
window.seenryShot = whole => { for (const id of ['side', 'side-pill', 'top', 'composer', 'zoom', 'hint', 'inspector']) $(id).style.display = 'none'; sideOpen = false; selected = null; place(); if (whole) fitAll(); else fitDecision(); };

async function load() {
  if (EMBEDDED) { state = EMBEDDED; build(); syncApprovals(); setNarrow(wantsNarrow()); return; }
  try {
    const next = await (await fetch('state', {cache: 'no-store'})).json();
    if (!online) { online = true; renderSide(); }
    if (!state || next.rev !== state.rev) {
      const first = !state, shape = s => s.sections.map(x => x.id + ':' + x.frames.map(f => f.id + '/' + f.kind).join(',')).join('|');
      const same = !first && shape(next) === shape(state), before = state;
      state = next;
      if (before) { const had = new Set(before.sections.flatMap(x => x.frames).filter(f => f.kind === 'page').map(f => f.id)); for (const f of frames()) if (f.kind === 'page' && !had.has(f.id)) born.add(f.id); }
      if (same) {
        for (const s of state.sections) { const o = before.sections.find(x => x.id === s.id); s.head = o.head; s.box = o.box; }
        for (const f of frames()) { const old = before.sections.flatMap(s => s.frames).find(o => o.id === f.id); if (old && old.rev !== f.rev) { swap(nodes[f.id]?.querySelector('iframe:not([data-next]), img'), f); if (narrow && paneId === f.id) { paneKey = f.id + '@' + f.rev + '@' + f.kind + '@' + device; swap($('stage').querySelector('iframe:not([data-next])'), f); } } }
      } else { if (selected && !find(selected)) selected = null; build(); if (narrow) paneKey = ''; }
      syncApprovals(); if (first) setNarrow(wantsNarrow()); else render();
    }
  } catch (e) { if (online) { online = false; if (state) renderSide(); } }
  setTimeout(load, 1500);
}
apply(); load();
</script>
</body>
</html>
`;

const page = embedded => PAGE.replace('/*STATE*/null', embedded ? JSON.stringify(embedded).replace(/</g, '\\u003c') : 'null');

const seen = new Map(), seenParts = new Map(), seenChunks = new Map(); let seenReady = false;
const partsIn = path => { try { return [...readFileSync(path, 'utf8').matchAll(/\bdata-seenry-part\s*=\s*["']([^"']{1,80})["']/g)].map(m => unescape(m[1])); } catch { return []; } };
/** Each part's source, from its marker to the next one: enough to tell a one-part edit from a regenerated file. */
function partChunks(html) {
  const marks = [...String(html).matchAll(/\bdata-seenry-part\s*=\s*["']([^"']{1,80})["']/g)], out = {};
  marks.forEach((m, i) => { out[unescape(m[1])] = html.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : undefined); });
  return out;
}
/** A save that changes every part of a screen that already had two or more is a rewrite, not a patch. */
function rewroteParts(before = {}, after = {}) {
  const kept = Object.keys(before).filter(k => k in after);
  return Object.keys(before).length >= 2 && kept.length >= 2 && kept.every(k => before[k] !== after[k]) ? kept.length : 0;
}
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
          if (Object.keys(clean.picks).length) { const m = readManifest(); if (stamp(m, 'picked', clean.at)) writeManifest(m); }
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
    if (req.method === 'POST' && path === '/share') {
      const origin = req.headers.origin;
      if (origin && origin !== `http://${host}`) return send(403, 'Forbidden');
      if (!syncConfig()) return send(200, JSON.stringify({linked: false, available: existsSync(syncScript)}), TYPES['.json']);
      onlineUrl().then(url => send(200, JSON.stringify({linked: true, url}), TYPES['.json']), error => send(502, JSON.stringify({linked: true, error: error.message}), TYPES['.json']));
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
          let chunks = {}; try { chunks = partChunks(readFileSync(join(dir, f.src), 'utf8')); } catch {}
          const rewrote = rewroteParts(seenChunks.get(f.id), chunks);
          if (seenReady) { edited = true; activity(rewrote ? 'warn' : 'edit', rewrote ? `Rewrote ${f.name}: ${rewrote} parts changed in one save. Patch the part that needs it instead` : added.length ? `Added ${added.join(', ')} to ${f.name}` : `${was === undefined ? 'Started' : 'Changed'} ${f.name}`, f.id); }
          seenParts.set(f.id, parts); seenChunks.set(f.id, chunks);
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
    // Windows reserves whole port ranges (Hyper-V, WinNAT) and answers EACCES inside them: step past the range.
    if (error.code === 'EACCES' && process.platform === 'win32' && attempts > 0) return serve(port + 101, attempts - 1);
    console.error(`The canvas could not start: ${error.message}${/EPERM|EACCES/.test(error.code || '') ? ' (binding 127.0.0.1 was refused: a sandbox blocks local servers)' : ''}`); process.exit(1);
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

// The three fixed ways to answer More like this; sync.mjs keeps the same three words for feedback sent online.
const RIFF_MODES = [
  'Same style, new layout: keep its tokens, type, image and idea line; recompose the first screen (what leads, where the image sits, the grid).',
  'New style, same content: keep every word, number and the product view; change the type, colour, image treatment and surfaces.',
  'Break its rule: name one rule this option obeys that nobody asked for (everything centred, the image always behind the text, one column), then make the version that breaks it on purpose.',
];
function feedbackLines(feedback) {
  const lines = [];
  for (const [section, id] of Object.entries(feedback.picks || {})) lines.push(`Picked in ${section}: ${id}`);
  for (const r of feedback.riff || []) lines.push(`More like this in ${r.section}: ${r.frame}. Make three new options around it, one per mode, each named by its mode in seenry-axis; do not resolve the section yet. ${RIFF_MODES.map((m, i) => `(${i + 1}) ${m}`).join(' ')}`);
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
  { const m = readManifest(); if (stamp(m, 'picked', state.feedback?.picks?.[sectionId] === pick ? state.feedback.at : undefined)) writeManifest(m); }
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
  if (unattended) stamp(manifest, 'picked');
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
  if (timingLine(manifest)) lines.push(timingLine(manifest));
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
  if (took) lines.push('## Speed', '', `First option shown ${took} after the canvas was started.`, ...(timingLine(manifest) ? [timingLine(manifest)] : []), '');
  writeFileSync(join(dir, 'HANDOFF.md'), lines.join('\n'));
  activity('handoff', 'Wrote the handoff for the build');
  console.log(`Wrote ${join(dir, 'HANDOFF.md')}`);
  if (timingLine(manifest)) console.log(timingLine(manifest));
}

const span = ms => ms < 90000 ? `${Math.max(1, Math.round(ms / 1000))} s` : `${Math.round(ms / 60000)} min`;
function firstOptionTime(manifest) {
  const a = Date.parse(manifest.started || ''), b = Date.parse(manifest.firstOption || '');
  return a && b && b >= a ? span(b - a) : '';
}
/** Seconds from the start (init or plan) to the first sketch shown, to the person's pick, and to the finished build
 *  (check.mjs stamps `built` when its gate passes). Kept in canvas.json as `timing`; null until each has happened. */
const FIRST_SKETCH_TARGET = 300;
function timingOf(manifest) {
  const start = Date.parse(manifest.started || ''), secs = key => { const t = Date.parse(manifest[key] || ''); return start && t && t >= start ? Math.round((t - start) / 1000) : null; };
  return {firstSketchSeconds: secs('firstOption'), pickSeconds: secs('picked'), builtSeconds: secs('built')};
}
function stamp(manifest, key, at = new Date().toISOString()) {
  if (manifest.error || !manifest.started || manifest[key]) return false;
  manifest[key] = at; manifest.timing = timingOf(manifest);
  return true;
}
function timingLine(manifest) {
  const t = timingOf(manifest), parts = [];
  if (t.firstSketchSeconds !== null) parts.push(`first sketch at ${span(t.firstSketchSeconds * 1000)}${t.firstSketchSeconds > FIRST_SKETCH_TARGET ? ' (target: within 5 min)' : ''}`);
  if (t.pickSeconds !== null) parts.push(`pick at ${span(t.pickSeconds * 1000)}`);
  if (t.builtSeconds !== null) parts.push(`build finished at ${span(t.builtSeconds * 1000)}`);
  return parts.length ? `Time since the canvas was started: ${parts.join(', ')}.` : '';
}
/** Called when the canvas is shown to the person: the first time options are on it, the time since the start is kept. */
function markShown() {
  const manifest = readManifest();
  if (manifest.error || manifest.firstOption || !manifest.started) return '';
  if (!readState().sections.some(s => s.choose && !s.study && s.frames.length)) return '';
  stamp(manifest, 'firstOption'); writeManifest(manifest);
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
  // The person is the judge. Model judges (the pair judge, the reskin check) and the written teardown run only when
  // asked for with --studio (or "speed": "studio" in canvas.json), or when nobody can review (--judge, or a recorded
  // unattended round). Three rounds of testing: they added minutes and never raised a page's level.
  const manifest = readManifest(), studio = argv.includes('--studio') || state.speed === 'studio';
  const judged = !argv.includes('--no-judge') && (studio || argv.includes('--judge') || !!manifest.unattended);
  activity('check', `Checking ${frames.length === 1 ? frames[0].name : frames.length + ' screens'}`, frames.length === 1 ? frames[0].id : '');
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
  const drawn = !['map', 'wireframe'].includes(state.stage);
  const bar = drawn ? await executionBar() : null;
  // What a weaker model skips unless a script holds it: the one idea in a line, a real image in the hero of every
  // sketch, and that image or its motif coming back below the hero once the pick is a full page.
  const sketches = drawn ? optionFrames.filter(f => f.sketch) : [], pages = drawn ? frames.filter(f => !f.sketch && f.idea && !find(f.id)?.section.choose) : [];
  for (const f of sketches) if (f.idea.split(/\s+/).filter(Boolean).length < 6) issues.push({frame: f.id, mode: 'light', severity: 'error', kind: 'idea', selector: 'meta[name=seenry-idea]', message: `${f.idea ? `Its idea line is ${f.idea.split(/\s+/).length} words (needs 6 or more)` : 'No idea line (needs 1)'}. Add to the <head> of ${f.src}: <meta name="seenry-idea" content="<the idea that carries the whole page>; <how the hero image and the interface meet>">`});
  if (bar?.collectHero && (sketches.length || pages.length)) {
    const seenry = resolve(dir, '..'), imageScript = relative(process.cwd(), join(here, '..', '..', 'seenry', 'scripts', 'image.mjs')), jobs = relative(process.cwd(), join(dir, 'img', 'jobs.json'));
    const pending = existsSync(join(seenry, 'images.pending'));
    const own = url => { try { const file = resolve(dir, '.' + decodeURIComponent(new URL(url).pathname)); return file.startsWith(dir + sep) && existsSync(file); } catch { return false; } };
    await withBrowser(async (browser, base) => {
      for (const f of [...sketches, ...pages]) {
        const [[, w, h]] = devicesFor(f); if (w < 1200) continue;
        const {context, page} = await openPage(browser, base + f.src.split('/').map(encodeURIComponent).join('/'), w, h, 'light');
        const hero = bar.judgeHero(await page.evaluate(bar.collectHero), {sketch: f.sketch, full: !f.sketch, own});
        await context.close();
        for (const m of hero.noImage) issues.push({frame: f.id, mode: 'light', severity: 'error', kind: 'hero-image', selector: 'img', message: `No generated or own image in the hero: ${m}. ${pending ? `Images are still generating. Run: node ${imageScript} --wait   then verify again.` : `Write one art-directed job for it in ${jobs} (fields: node ${imageScript} --template), run: node ${imageScript} --batch ${jobs} --background   then place the file in the hero as an <img> or a background and run verify again.`}`});
        for (const m of hero.noReturn) issues.push({frame: f.id, mode: 'light', severity: 'error', kind: 'idea-return', selector: 'section', message: `The idea stops at the hero: ${m}. Then run: node ${relative(process.cwd(), fileURLToPath(import.meta.url))} verify ${f.id}`});
        for (const m of hero.notes) issues.push({frame: f.id, mode: 'light', severity: 'warn', kind: 'idea-return', selector: 'section', message: m});
      }
    });
  }
  if (optionFrames.length && drawn) {
    const seenry = resolve(dir, '..'), tearFile = join(seenry, 'teardown.md');
    // With no teardown yet, verify writes one: full-size crops of up to three references and a section each to fill in.
    let tear = existsSync(tearFile) ? readFileSync(tearFile, 'utf8') : '', started = 0;
    if (studio && !tear.trim()) {
      const td = await seenryScript('teardown.mjs'), images = d => existsSync(d) ? readdirSync(d).filter(n => /\.(png|jpe?g|webp|avif)$/i.test(n)).sort().map(n => join(d, n)) : [];
      const inputs = [...images(join(seenry, 'level')), ...images(join(dir, 'refs'))].slice(0, 3);
      if (td && inputs.length) { await withBrowser(async browser => { started = (await td.prepareTeardown({dir: seenry, inputs, browser})).length; }); tear = readFileSync(tearFile, 'utf8'); }
    }
    const problems = !studio ? [] : bar ? bar.teardownProblems(tear) : !tear.trim() ? ['it does not exist'] : tear.length < 900 ? ['it is too short to hold measurements per reference'] : [];
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
    if (hasRefs && judged) for (const f of optionFrames) {
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
    if (existsSync(exampleShot) && judged && !/ledgerline/i.test(briefText)) for (const f of optionFrames) {
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
    for (const e of judged ? pairs : []) {
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
  if (json) console.log(JSON.stringify({errors, warnings: issues.length - errors, judged, issues, detached}, null, 2));
  else {
    for (const i of issues) console.log(`${i.severity === 'error' ? 'ERROR' : 'warn '}  ${i.frame}${i.mode === 'dark' ? ' (dark)' : ''}  ${i.selector}\n       ${i.message}`);
    if (detached) console.log(detached);
    console.log(issues.length ? `\n${errors} error${errors === 1 ? '' : 's'}, ${issues.length - errors} warning${issues.length - errors === 1 ? '' : 's'} in ${frames.length} screen${frames.length === 1 ? '' : 's'}.` : `All ${frames.length} screens pass.`);
    if (optionFrames.length && drawn) console.log(judged ? 'A blind judge compared each option with its references.' : `No model judged these options: the person does.${errors ? '' : ` Next: node ${relative(process.cwd(), fileURLToPath(import.meta.url))} open   then wait for their pick.`}`);
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

const port = Number(flag('port', 0)) || stablePort();
if (command === 'init') {
  init(); console.log(`Canvas folder ready: ${dir}`);
} else if (command === 'serve') {
  serve(port);
} else if (command === 'open') {
  const where = argv.includes('--browser') ? null : host();
  if (where?.id === 'cloud') {
    // 127.0.0.1 in a cloud session is the cloud machine, not the person's: write the file that opens anywhere instead.
    if (!existsSync(dir)) init();
    writeFoundations(); markShown();
    writeFileSync(join(dir, 'canvas.html'), page(readState()));
    console.log(`This is a cloud session: 127.0.0.1 here is not the person's machine, so no server was started.\nWrote ${join(dir, 'canvas.html')}. Publish it (with the canvas folder beside it) as a private page and give the person the link, or run "canvas.mjs shot" and show canvas.png. Take their pick in chat.`);
    activity('open', 'Wrote the canvas as a file for a cloud session');
    process.exit(0);
  }
  const info = await startServer();
  if (!info) {
    let log = ''; try { log = readFileSync(join(dir, '.canvas.log'), 'utf8').trim().split('\n').at(-1); } catch {}
    if (process.env.CODEX_SANDBOX || /sandbox|EPERM|EACCES/.test(log)) console.error(`The canvas could not bind 127.0.0.1:${port}: ${log || 'the sandbox refused it'}.\nThe Codex sandbox blocks local servers. Run this same command again with escalated permissions (sandbox_permissions "require_escalated", justification: "serve the design canvas on 127.0.0.1"), or run "canvas.mjs static" for a file that opens from disk.`);
    else console.error(`The canvas did not start. See ${join(dir, '.canvas.log')}, or run "node canvas.mjs static" for a file that opens from disk.`);
    process.exit(1);
  }
  const state = readState(), design = state.sections.filter(s => !s.reference && !s.system), count = design.reduce((n, s) => n + s.frames.length, 0);
  const url = `http://127.0.0.1:${info.port}/`, opened = where ? false : launch(url);
  console.log(`Seenry canvas: ${url}  (${count} screen${count === 1 ? '' : 's'} in ${design.length} section${design.length === 1 ? '' : 's'})${opened ? ', opened in the browser' : ''}`);
  if (where) {
    if (where.id === 'claude') { const file = writeLaunch(info.port); if (file) console.log(`Wrote the "Seenry canvas" entry in ${file} (port ${info.port}).`); }
    console.log(`Running inside ${where.name}. ${where.tell(url, info.port)} Do not open a separate tab; the canvas fits a side pane. Pass --browser for a tab anyway.`);
  } else if (!opened) console.log('No browser here. Give the person the address, or run "canvas.mjs shot" and show canvas.png.');
  const synced = startSync();
  if (synced) console.log(synced.started ? `This machine is linked to Seenry: started sync.mjs watch, so the canvas and its feedback stay in sync online (log: ${join(dir, '.sync.log')}).` : 'Syncing to Seenry (sync.mjs watch is running).');
  activity('open', 'Opened the canvas for you');
  const took = markShown(); if (took) console.log(`First option shown ${took} after the canvas was started.`);
  const times = timingLine(readManifest()); if (times) console.log(times);
  if (state.error) console.log(state.error);
} else if (command === 'list') {
  const state = readState();
  if (json) console.log(JSON.stringify({title: state.title, stage: state.stage, library: state.library, flows: state.flows, sections: state.sections.map(s => ({id: s.id, name: s.name, status: s.status, options: !!s.choose, system: !!s.system, frames: s.frames.map(f => ({id: f.id, name: f.name, file: f.src, device: f.device, size: [f.w, f.h], caption: f.caption || '', links: f.links, specs: f.specs || 0, review: state.approvals[f.id] || null}))}))}, null, 2));
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
  const parts = String(flag('parts', '')).split(/[,|]/).map(p => p.trim()).filter(Boolean);
  if (parts.length) manifest.parts = {...(manifest.parts && typeof manifest.parts === 'object' ? manifest.parts : {}), ...Object.fromEntries(positional.map(p => [p, parts]))};
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
  const synced = stopSync();
  console.log((info ? 'Canvas stopped.' : 'No canvas was running.') + (synced ? ' Stopped syncing to Seenry.' : ''));
} else if (command === 'link' || command === 'sync') {
  // Passed through to sync.mjs; after a link, or with no subcommand, the watch starts in the background.
  if (!existsSync(syncScript)) { console.error(`sync.mjs is not beside canvas.mjs (${here}). Install the seenry-canvas skill to sync online.`); process.exit(2); }
  const sub = command === 'link' ? 'link' : positional[0] || 'watch', rest = argv.slice(1).filter(a => a !== sub && a !== '--dir' && a !== flag('dir'));
  if (sub !== 'watch') {
    const forDir = sub === 'unlink' ? [] : ['--dir', dir];
    const run = spawnSync(process.execPath, [syncScript, sub, ...forDir, ...rest.filter(a => resolve(a) !== dir)], {stdio: 'inherit'});
    if (run.status !== 0 || sub !== 'link') process.exit(run.status ?? 1);
  }
  if (sub === 'unlink') process.exit(0);
  const synced = startSync();
  console.log(synced ? `Syncing ${dir} to Seenry in the background (log: ${join(dir, '.sync.log')}). "canvas.mjs stop" stops it.` : 'This machine is not linked to Seenry. Run: node canvas.mjs link');
} else if (command === 'feedback' || command === 'wait') {
  const path = join(dir, 'feedback.json'), deliveredFile = join(dir, '.delivered.json');
  const newest = () => { const s = readState(); return Math.max(mtime(join(dir, 'canvas.json')), ...s.sections.flatMap(x => x.frames.map(f => f.rev)), 0); };
  const sentAt = () => { try { return JSON.parse(readFileSync(path, 'utf8')).at || ''; } catch { return ''; } };
  const delivered = () => { try { return JSON.parse(readFileSync(deliveredFile, 'utf8')).at || ''; } catch { return ''; } };
  const fresh = () => existsSync(path) && mtime(path) >= newest() && (command !== 'wait' || sentAt() !== delivered());
  // Hosts cap a foreground command near two minutes, so wait returns before that unless --timeout asks for longer.
  const bounded = command === 'wait' && !argv.includes('--timeout');
  const seconds = command === 'wait' ? Number(flag('timeout', process.env.SEENRY_WAIT_WINDOW || 100)) : Number(flag('wait', 0));
  const deadline = Date.now() + seconds * 1000;
  let keep = false;
  if (command === 'wait') {
    if (!running()) console.log('The canvas is not running; start it with "canvas.mjs open".');
    writeFileSync(waitFile, JSON.stringify({pid: process.pid}));
    const clear = () => { if (keep) return; try { if (JSON.parse(readFileSync(waitFile, 'utf8')).pid === process.pid) rmSync(waitFile, {force: true}); } catch {} };
    process.on('exit', clear); process.on('SIGINT', () => process.exit(130)); process.on('SIGTERM', () => process.exit(143));
    console.log(`Waiting for the person to press Send on the canvas (up to ${seconds < 120 ? seconds + ' s' : Math.round(seconds / 60) + ' min'})…`);
  }
  while (!fresh() && Date.now() < deadline) await new Promise(r => setTimeout(r, 1000));
  if (!fresh()) {
    if (bounded) {
      // The canvas keeps saying Seenry is waiting between calls, so the person never sees it give up.
      keep = true; writeFileSync(waitFile, JSON.stringify({pid: null, until: Date.now() + 120000}));
      console.log(`Still waiting: nothing sent yet. Run the same command again to keep waiting: node ${relative(process.cwd(), fileURLToPath(import.meta.url)) || 'canvas.mjs'} wait ${relative(process.cwd(), dir) || '.'}`);
      process.exit(0);
    }
    console.log(command === 'wait' ? 'No feedback yet. Run "canvas.mjs wait" again, or "canvas.mjs feedback" once the person says they sent it.' : existsSync(path) ? 'No feedback yet on the current screens (feedback.json is older than the latest change).' : 'No feedback yet.'); process.exit(3);
  }
  const feedback = JSON.parse(readFileSync(path, 'utf8'));
  if (command === 'wait') { try { writeFileSync(deliveredFile, JSON.stringify({at: feedback.at || ''})); } catch {} }
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
  await tab.goto(`http://127.0.0.1:${info.port}/`);
  await tab.waitForTimeout(2500);
  await tab.evaluate(whole => window.seenryShot(whole), all);
  await tab.waitForTimeout(600);
  await tab.screenshot({path: join(dir, 'canvas.png')});
  await browser.close();
  if (info.started) { try { process.kill(info.pid); } catch {} rmSync(pidFile, {force: true}); }
  markShown();
  console.log(`Wrote ${join(dir, 'canvas.png')}`);
} else {
  console.error('Usage: node canvas.mjs init|plan|say|open|link|sync|wait|feedback|list|check|render|tree|verify|diff|compare|pair|round|status|resolve|archive|log|handoff|static|shot|serve|stop'); process.exit(2);
}
