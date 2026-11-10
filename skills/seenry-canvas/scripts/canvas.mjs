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
 *  node canvas.mjs static [dir]            write canvas.html, which opens from disk with no server
 *  node canvas.mjs shot   [dir] [--playwright path]  write canvas.png, for sessions with no browser to show
 *  node canvas.mjs stop   [dir]
 *
 *  dir defaults to .seenry/canvas. Layout on disk:
 *    01-onboarding/01-welcome.phone.html   a folder is a section, a file is a frame, numbers set the order
 *    02-home.options/a.html, b.html        a folder ending .options holds alternatives: the person picks one
 *    refs/*.png                            reference screenshots, shown as their own section
 *  A file ending .phone.html, .tablet.html or .laptop.html renders at that device size; anything else is desktop.
 *  A frame's name is its <title>; <meta name="seenry-note" content="..."> is the line shown under it.
 *  A link from one screen to another (<a href="02-next.phone.html">) is a prototype connection: the canvas draws it
 *  and Present mode follows it, like a Figma prototype.
 *  Plain Node, no packages, bound to 127.0.0.1. */
import {createServer} from 'node:http';
import {existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, openSync, readSync, closeSync} from 'node:fs';
import {resolve, join, extname, basename, dirname, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'open';
const flag = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };
const positional = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--')));
const dir = resolve(positional[0] || '.seenry/canvas');
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
`, 'tokens.css': String.raw`/* One token file for every screen on the canvas. Each screen links it, so a change here changes them all,
   and the same file moves into the product when the screens are built. Replace the values; keep the roles. */
:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  --text-display: 3.5rem; --text-title: 1.75rem; --text-heading: 1.25rem; --text-body: 1rem; --text-ui: .875rem; --text-caption: .8125rem;
  --weight-regular: 400; --weight-medium: 500; --weight-strong: 600;

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px; --space-24: 96px;
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-full: 999px;

  --color-bg: oklch(0.985 0.002 90); --color-bg-surface: oklch(1 0 0); --color-bg-sunken: oklch(0.965 0.003 90);
  --color-text: oklch(0.22 0.005 90); --color-text-secondary: oklch(0.45 0.005 90); --color-text-tertiary: oklch(0.58 0.005 90);
  --color-rule: oklch(0.92 0.003 90);
  --color-accent: oklch(0.22 0.005 90); --color-on-accent: oklch(0.985 0.002 90);
  --color-positive: oklch(0.55 0.13 150); --color-warning: oklch(0.68 0.14 70); --color-negative: oklch(0.55 0.19 27);

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1); --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --duration-press: 120ms; --duration-short: 180ms; --duration-medium: 240ms;
}
`};

function init() {
  mkdirSync(join(dir, 'refs'), {recursive: true});
  markWorkDir(dir);
  for (const [name, text] of Object.entries(KIT)) if (!existsSync(join(dir, name))) writeFileSync(join(dir, name), text);
}

function waiting() {
  try { const info = JSON.parse(readFileSync(waitFile, 'utf8')); process.kill(info.pid, 0); return true; } catch { return false; }
}

const mtime = path => { try { return Math.round(statSync(path).mtimeMs); } catch { return 0; } };
const pretty = name => name.replace(/^\d+[-_. ]*/, '').replace(/[-_]+/g, ' ').replace(/^\w/, c => c.toUpperCase()) || name;
const inside = path => { const full = resolve(dir, path); return full === dir || full.startsWith(dir + sep) ? full : null; };
const unescape = text => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function head(path) {
  let text = '';
  try { const fd = openSync(path, 'r'), buffer = Buffer.alloc(4096); text = buffer.toString('utf8', 0, readSync(fd, buffer, 0, 4096, 0)); closeSync(fd); } catch {}
  const title = text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const meta = text.match(/<meta[^>]+name=["']seenry-note["'][^>]*>/i)?.[0];
  const note = meta?.match(/content=(?:"([^"]*)"|'([^']*)')/i);
  return {title: title ? unescape(title) : '', note: note ? unescape(note[1] ?? note[2] ?? '') : ''};
}

/** Screens this screen links to, as frame ids: its prototype connections. */
function linksOf(folder, file) {
  let text = '';
  try { text = readFileSync(join(dir, folder, file), 'utf8').slice(0, 400000); } catch { return []; }
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

function frameFrom(folder, file) {
  const rel = folder ? `${folder}/${file}` : file;
  const stem = file.replace(/\.html$/i, '');
  const device = Object.keys(DEVICES).find(d => stem.toLowerCase().endsWith('.' + d)) || 'desktop';
  const clean = device === 'desktop' && !stem.toLowerCase().endsWith('.desktop') ? stem : stem.slice(0, stem.lastIndexOf('.'));
  const {title, note} = head(join(dir, rel));
  const [w, h] = DEVICES[device];
  return {id: idFor(folder, file), kind: 'page', src: rel, name: title || pretty(clean), note, device, w, h, rev: mtime(join(dir, rel)), links: linksOf(folder, file)};
}

/** The canvas content, read from the folder every time: sections, frames, and the last feedback. */
function readState() {
  let manifest = {};
  const manifestPath = join(dir, 'canvas.json');
  if (existsSync(manifestPath)) {
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch (error) { manifest = {error: `canvas.json is not valid JSON: ${error.message}`}; }
  }
  const entries = existsSync(dir) ? readdirSync(dir, {withFileTypes: true}).filter(e => !e.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: true})) : [];
  const htmlIn = folder => readdirSync(join(dir, folder)).filter(f => /\.html$/i.test(f)).sort((a, b) => a.localeCompare(b, 'en', {numeric: true}));
  const sections = [];
  const loose = entries.filter(e => e.isFile() && /\.html$/i.test(e.name) && e.name !== 'canvas.html').map(e => frameFrom('', e.name));
  if (loose.length) sections.push({id: 'screens', name: 'Screens', choose: false, frames: loose});
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'refs' || entry.name === 'assets' || entry.name === 'node_modules') continue;
    const frames = htmlIn(entry.name).map(f => frameFrom(entry.name, f));
    if (!frames.length) continue;
    const choose = /\.options$/i.test(entry.name), id = entry.name.replace(/\.options$/i, '');
    sections.push({id, name: pretty(id), choose, frames});
  }
  const refDir = join(dir, 'refs');
  if (existsSync(refDir)) {
    const refs = readdirSync(refDir).filter(f => IMAGES.has(extname(f).toLowerCase())).sort().map(f => ({id: 'refs/' + f, kind: 'image', src: 'refs/' + f, name: pretty(f.replace(/\.[^.]+$/, '')), note: '', device: 'image', w: 720, h: 450, rev: mtime(join(refDir, f))}));
    if (refs.length) sections.push({id: 'refs', name: 'References', choose: false, reference: true, frames: refs});
  }
  for (const section of sections) {
    const extra = manifest.sections?.[section.id] || {};
    if (extra.name) section.name = String(extra.name);
    section.note = String(extra.note || (section.choose ? 'Options: pick one' : ''));
  }
  const ids = new Set(sections.flatMap(s => s.frames.map(f => f.id)));
  for (const f of sections.flatMap(s => s.frames)) f.links = (f.links || []).filter(id => ids.has(id) && id !== f.id);
  let feedback = null;
  const feedbackPath = join(dir, 'feedback.json');
  if (existsSync(feedbackPath)) { try { feedback = JSON.parse(readFileSync(feedbackPath, 'utf8')); } catch {} }
  const state = {title: String(manifest.title || basename(resolve(dir, '..', '..')) || 'Seenry canvas'), stage: String(manifest.stage || ''), question: String(manifest.question || ''),
    error: manifest.error || null, sections, feedback, agentWaiting: waiting()};
  state.rev = [mtime(manifestPath), state.agentWaiting, ...sections.flatMap(s => [s.id, ...s.frames.map(f => f.id + f.rev)])].join('|');
  return state;
}

const PAGE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Seenry canvas</title>
<style>
:root { color-scheme: light dark; --bg: #e9e8e5; --panel: #fbfaf8; --ink: #1b1a18; --ink-2: #66625b; --line: rgb(0 0 0 / .1); --fill: rgb(0 0 0 / .06); --sel: #2f6fed; --ok: #1f8a4c; --warn: #b4530a;
  font: 13px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
@media (prefers-color-scheme: dark) { :root { --bg: #121211; --panel: #1d1c1a; --ink: #f1efea; --ink-2: #a39e95; --line: rgb(255 255 255 / .12); --fill: rgb(255 255 255 / .08); --sel: #6b9bff; --ok: #4cc27e; --warn: #f0a35c; } }
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; overflow: hidden; background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }
button, textarea { font: inherit; color: inherit; }
#viewport { position: fixed; inset: 0 320px 0 0; overflow: hidden; cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; background-image: radial-gradient(var(--line) 1px, transparent 1px); background-size: 24px 24px; }
#viewport.panning { cursor: grabbing; }
#world { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
.section-title { position: absolute; white-space: nowrap; font-weight: 600; font-size: calc(18px * var(--inv)); line-height: 1.2; translate: 0 calc(-100% - 34px * var(--inv)); }
.section-title small { font-weight: 400; color: var(--ink-2); margin-left: .6em; }
.frame { position: absolute; }
.frame-label { position: absolute; left: 0; bottom: 100%; padding-bottom: calc(6px * var(--inv)); font-size: calc(12px * var(--inv)); line-height: 1.4; color: var(--ink-2); white-space: nowrap; max-width: calc(100% + 100px); overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.frame-label b { font-weight: 500; color: var(--ink); }
.frame[data-status="approved"] .frame-label b { color: var(--ok); }
.frame[data-status="change"] .frame-label b { color: var(--warn); }
.frame-body { position: absolute; inset: 0; background: #fff; overflow: hidden; box-shadow: 0 0 0 calc(1px * var(--inv)) var(--line), 0 calc(8px * var(--inv)) calc(30px * var(--inv)) rgb(0 0 0 / .08); }
.frame[data-device="phone"] .frame-body { border-radius: 28px; }
.frame[data-selected="true"] .frame-body { box-shadow: 0 0 0 calc(2px * var(--inv)) var(--sel); }
.frame[data-picked="true"] .frame-body { box-shadow: 0 0 0 calc(3px * var(--inv)) var(--ok); }
.frame iframe, .frame img { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
.frame img { object-fit: cover; object-position: top; }
.frame .shield { position: absolute; inset: 0; }
.frame[data-live="true"] .shield { display: none; }
.pin { position: absolute; translate: -50% -50%; min-width: calc(22px * var(--inv)); height: calc(22px * var(--inv)); border-radius: 99px; background: var(--warn); color: #fff; font-size: calc(12px * var(--inv)); font-weight: 600; display: grid; place-items: center; pointer-events: none; }
#panel { position: fixed; inset: 0 0 0 auto; width: 320px; background: var(--panel); box-shadow: -1px 0 0 var(--line); display: flex; flex-direction: column; }
#panel header { padding: 14px 16px 10px; }
#panel h1 { margin: 0; font-size: 15px; font-weight: 600; text-wrap: balance; }
#panel header p { margin: 4px 0 0; color: var(--ink-2); }
.scroll { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 0 8px 12px; }
.outline h2 { margin: 12px 8px 4px; font-size: 12px; font-weight: 600; color: var(--ink-2); }
.outline button { display: flex; gap: 8px; align-items: center; width: 100%; text-align: start; border: 0; background: none; padding: 6px 8px; border-radius: 7px; cursor: pointer; }
.outline button:hover { background: var(--fill); }
.outline button[aria-current="true"] { background: color-mix(in oklab, var(--sel) 16%, transparent); }
.outline .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dot { width: 8px; height: 8px; border-radius: 99px; background: var(--line); flex: none; }
.dot[data-status="approved"] { background: var(--ok); } .dot[data-status="change"] { background: var(--warn); }
.inspector { border-top: 1px solid var(--line); padding: 12px 16px; display: grid; gap: 10px; }
.inspector h3 { margin: 0; font-size: 14px; font-weight: 600; }
.inspector p { margin: 0; color: var(--ink-2); }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
.btn { border: 0; border-radius: 8px; padding: 6px 10px; background: var(--fill); cursor: pointer; font-weight: 500; text-decoration: none; color: var(--ink); }
.btn:active { scale: .97; }
.btn[aria-pressed="true"] { background: var(--ink); color: var(--panel); }
.btn.primary { background: var(--ink); color: var(--panel); }
.notes { display: grid; gap: 6px; }
.note { display: flex; gap: 8px; align-items: start; background: var(--fill); border-radius: 8px; padding: 6px 8px; }
.note span { flex: 1; overflow-wrap: anywhere; }
.note b { color: var(--warn); }
.note button { border: 0; background: none; cursor: pointer; color: var(--ink-2); padding: 0 4px; }
footer { border-top: 1px solid var(--line); padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); display: grid; gap: 8px; }
textarea { width: 100%; min-height: 56px; max-height: 160px; resize: vertical; font-size: 16px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: transparent; }
#status { color: var(--ink-2); min-height: 1.4em; }
#links { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
#links path { fill: none; stroke: var(--sel); stroke-width: calc(2px * var(--inv)); opacity: .6; }
#links circle { fill: var(--sel); }
#links[hidden] { display: none; }
.agent { margin: 8px 0 0; padding: 6px 10px; border-radius: 8px; background: color-mix(in oklab, var(--ok) 16%, transparent); color: var(--ink); }
.agent[hidden] { display: none; }
#present { position: fixed; inset: 0; z-index: 10; background: #0f0f0e; color: #f1efea; display: grid; grid-template-rows: auto 1fr; }
#present[hidden] { display: none; }
#present .bar { display: flex; gap: 8px; align-items: center; padding: 10px 14px; }
#present .bar strong { font-weight: 600; } #present .bar span { color: #a39e95; }
#present .bar .btn { background: rgb(255 255 255 / .1); color: #f1efea; }
#present .stage { position: relative; overflow: hidden; display: grid; place-items: center; }
#present iframe { border: 0; background: #fff; transform-origin: 50% 50%; box-shadow: 0 0 0 1px rgb(255 255 255 / .1), 0 24px 60px rgb(0 0 0 / .5); }
#present[data-device="phone"] iframe { border-radius: 32px; }
#zoom { position: fixed; left: 12px; bottom: 12px; display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--panel); box-shadow: 0 0 0 1px var(--line), 0 4px 14px rgb(0 0 0 / .1); }
#zoom button { border: 0; background: none; border-radius: 7px; padding: 5px 9px; cursor: pointer; font-variant-numeric: tabular-nums; }
#zoom button:hover { background: var(--fill); }
#hint { position: fixed; left: 12px; top: 12px; padding: 6px 10px; border-radius: 8px; background: var(--panel); box-shadow: 0 0 0 1px var(--line); color: var(--ink-2); }
#hint[hidden] { display: none; }
.error { margin: 0 16px 8px; padding: 8px 10px; border-radius: 8px; background: color-mix(in oklab, var(--warn) 18%, transparent); }
dialog { border: 0; border-radius: 12px; padding: 16px; width: min(420px, calc(100vw - 32px)); background: var(--panel); color: var(--ink); box-shadow: 0 16px 48px rgb(0 0 0 / .3); }
dialog::backdrop { background: rgb(0 0 0 / .35); }
dialog h3 { margin: 0 0 4px; font-size: 15px; } dialog p { margin: 0 0 10px; color: var(--ink-2); overflow-wrap: anywhere; }
dialog .row { justify-content: end; margin-top: 10px; }
:focus-visible { outline: 2px solid var(--sel); outline-offset: 2px; }
@media (max-width: 760px) { #viewport { inset: 0 0 46vh 0; } #panel { inset: auto 0 0 0; width: auto; height: 46vh; box-shadow: 0 -1px 0 var(--line); } }
</style>
</head>
<body>
<div id="viewport"><div id="world"></div></div>
<div id="hint" hidden></div>
<div id="zoom" role="group" aria-label="Zoom">
  <button type="button" id="zoom-out" aria-label="Zoom out">−</button>
  <button type="button" id="zoom-level" title="Zoom to 100%">100%</button>
  <button type="button" id="zoom-in" aria-label="Zoom in">+</button>
  <button type="button" id="zoom-fit" title="Fit everything (1)">Fit</button>
  <button type="button" id="flows" title="Show prototype connections (F)" aria-pressed="true">Flows</button>
  <button type="button" id="play" title="Present the prototype (P)">▶ Present</button>
</div>
<div id="present" hidden>
  <div class="bar"><strong id="p-name"></strong><span id="p-where"></span><span style="flex:1"></span>
    <button type="button" class="btn" id="p-prev" aria-label="Previous screen">←</button>
    <button type="button" class="btn" id="p-next" aria-label="Next screen">→</button>
    <button type="button" class="btn" id="p-restart">Restart</button>
    <button type="button" class="btn" id="p-close">Close (Esc)</button></div>
  <div class="stage" id="p-stage"><iframe id="p-frame" title="Prototype"></iframe></div>
</div>
<aside id="panel">
  <header><h1 id="title"></h1><p id="question"></p><p class="agent" id="agent" hidden>Your agent is waiting. “Send to agent” goes straight to it.</p></header>
  <p class="error" id="error" hidden></p>
  <div class="scroll"><nav class="outline" id="outline" aria-label="Screens"></nav></div>
  <section class="inspector" id="inspector" hidden></section>
  <footer>
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
let state = null, view = {x: 0, y: 0, z: 1}, selected = null, live = null, commenting = false, pending = null, fitted = false, showLinks = true, playing = null;
const status = {}, picks = {}, notes = [], heights = {}, nodes = {};

const frames = () => state.sections.flatMap(s => s.frames.map(f => ({...f, section: s})));
const find = id => frames().find(f => f.id === id);
const height = f => heights[f.id] || f.h;

function layout() {
  let y = 0; const boxes = {};
  for (const section of state.sections) {
    let x = 0, row = 0;
    section.box = {x: 0, y};
    for (const f of section.frames) { boxes[f.id] = {x, y, w: f.w, h: height(f)}; x += f.w + GAP; row = Math.max(row, height(f)); }
    section.box.w = x - GAP; section.box.h = row;
    y += row + ROW_GAP;
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
}
function fitBox(box, pad = 80) {
  const vp = $('viewport').getBoundingClientRect();
  const z = Math.min(1, (vp.width - pad * 2) / box.w, (vp.height - pad * 2) / box.h);
  view.z = Math.max(0.03, z); view.x = (vp.width - box.w * view.z) / 2 - box.x * view.z; view.y = Math.max(pad, (vp.height - box.h * view.z) / 2) - box.y * view.z; apply();
}
function fitAll() {
  const boxes = Object.values(layout()); if (!boxes.length) return;
  const w = Math.max(...boxes.map(b => b.x + b.w)), h = Math.max(...boxes.map(b => b.y + b.h));
  fitBox({x: 0, y: -60, w, h: h + 60});
}
function focusFrame(id) { const box = layout()[id]; if (box) fitBox({x: box.x, y: box.y - 40, w: box.w, h: Math.min(box.h, box.w * 1.1) + 40}, 60); }

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

function arm(iframe, f) {
  let doc; try { doc = iframe.contentDocument; } catch { return; }
  if (!doc || !doc.documentElement) return;
  const measure = () => {
    const h = Math.min(MAX_H, Math.max(f.h, doc.documentElement.scrollHeight));
    if (Math.abs((heights[f.id] || f.h) - h) > 2) { heights[f.id] = h; place(); }
  };
  measure(); setTimeout(measure, 400); setTimeout(measure, 1500);
  let last = null;
  const mark = node => { if (last) last.style.outline = last.dataset.seenryOutline || ''; last = node; if (node) { node.dataset.seenryOutline = node.style.outline; node.style.outline = '2px solid #e8590c'; } };
  doc.addEventListener('mouseover', e => { if (commenting && live === f.id) mark(e.target); }, true);
  doc.addEventListener('mouseout', () => mark(null), true);
  doc.addEventListener('click', e => {
    if (!(commenting && live === f.id)) return;
    e.preventDefault(); e.stopPropagation(); mark(null);
    const r = e.target.getBoundingClientRect(), win = doc.defaultView;
    ask({frame: f.id, ...describe(e.target), x: (r.left + r.width / 2 + win.scrollX) / f.w, y: (r.top + Math.min(r.height / 2, 40) + win.scrollY) / height(f)});
  }, true);
  doc.addEventListener('keydown', e => { if (e.key === 'Escape') { live = null; commenting = false; render(); } });
}
function ask(note) { pending = note; $('note-target').textContent = find(note.frame).name + ' · ' + note.target; $('note-text').value = ''; $('note-dialog').showModal(); }

function build() {
  const world = $('world'); world.replaceChildren();
  for (const k in nodes) delete nodes[k];
  world.append(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
  world.firstChild.id = 'links';
  for (const section of state.sections) {
    section.node = el('div', {className: 'section-title', textContent: section.name}, section.note ? el('small', {textContent: section.note}) : '');
    world.append(section.node);
    for (const f of section.frames) {
      const body = el('div', {className: 'frame-body'});
      if (f.kind === 'image') {
        const img = el('img', {src: f.src + '?v=' + f.rev, alt: f.name, draggable: false});
        img.addEventListener('load', () => { const h = Math.min(MAX_H, Math.round(f.w * img.naturalHeight / img.naturalWidth)); if (h && h !== heights[f.id]) { heights[f.id] = h; place(); } });
        body.append(img);
      } else {
        const iframe = el('iframe', {src: f.src + '?v=' + f.rev, title: f.name, loading: 'lazy'});
        iframe.addEventListener('load', () => arm(iframe, f));
        body.append(iframe);
      }
      const shield = el('div', {className: 'shield'});
      const label = el('div', {className: 'frame-label'});
      const node = el('div', {className: 'frame'}, label, body, shield);
      node.dataset.id = f.id; node.dataset.device = f.device;
      label.addEventListener('click', e => { e.stopPropagation(); select(f.id); });
      shield.addEventListener('dblclick', () => { select(f.id); if (f.kind === 'page') { live = f.id; render(); } });
      nodes[f.id] = node; world.append(node);
    }
  }
  place();
}

function place() {
  const boxes = layout();
  for (const section of state.sections) { section.node.style.left = section.box.x + 'px'; section.node.style.top = section.box.y + 'px'; }
  for (const f of frames()) {
    const node = nodes[f.id], box = boxes[f.id]; if (!node) continue;
    Object.assign(node.style, {left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px'});
    node.dataset.status = status[f.id] || ''; node.dataset.selected = selected === f.id; node.dataset.live = live === f.id;
    node.dataset.picked = f.section.choose && picks[f.section.id] === f.id;
    const mark = status[f.id] === 'approved' ? ' ✓' : status[f.id] === 'change' ? ' •' : '';
    node.firstChild.replaceChildren(el('b', {textContent: f.name + mark}), document.createTextNode(f.kind === 'page' ? '  ' + f.w + ' × ' + f.h : ''));
    node.querySelectorAll('.pin').forEach(p => p.remove());
    notes.forEach((n, i) => { if (n.frame === f.id && n.x != null) node.append(el('div', {className: 'pin', textContent: String(i + 1), style: 'left:' + n.x * 100 + '%;top:' + n.y * 100 + '%'})); });
  }
  drawLinks(boxes);
  if (!fitted && Object.keys(boxes).length) { fitted = true; fitAll(); }
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
const order = () => frames().filter(f => f.kind === 'page');
function present(id) {
  const list = order(); if (!list.length) return;
  playing = list.some(f => f.id === id) ? id : list[0].id;
  $('present').hidden = false; showPlaying(true);
}
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
  let path; try { path = decodeURIComponent($('p-frame').contentWindow.location.pathname).replace(/^\//, ''); } catch { return; }
  const hit = order().find(f => f.src === path); if (hit && hit.id !== playing) { playing = hit.id; showPlaying(false); }
  try { $('p-frame').contentDocument.addEventListener('keydown', e => { if (e.target.closest('input, textarea, select, [contenteditable]')) return; if (e.key === 'Escape') closePresent(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); }); } catch {}
});
function closePresent() { $('present').hidden = true; $('p-frame').src = 'about:blank'; if (playing) { select(playing); focusFrame(playing); } playing = null; }
$('p-prev').addEventListener('click', () => step(-1)); $('p-next').addEventListener('click', () => step(1));
$('p-close').addEventListener('click', closePresent);
$('p-restart').addEventListener('click', () => { const f = find(playing); playing = f.section.frames[0].id; showPlaying(true); });
addEventListener('resize', () => { if (playing) showPlaying(false); });
$('play').addEventListener('click', () => present(selected));
$('flows').addEventListener('click', () => { showLinks = !showLinks; $('flows').setAttribute('aria-pressed', showLinks); place(); });

function select(id) { selected = id; if (live !== id) { live = null; commenting = false; } render(); }

function render() {
  $('title').textContent = state.title + (state.stage ? ' · ' + state.stage : ''); document.title = state.title + ' · Seenry canvas';
  $('question').textContent = state.question || 'Approve screens, pick between options, pin comments, then send.';
  $('error').hidden = !state.error; $('error').textContent = state.error || '';
  $('agent').hidden = !state.agentWaiting;
  const outline = $('outline'); outline.replaceChildren();
  if (!state.sections.length) outline.append(el('p', {textContent: 'No screens yet. The agent adds .html files to this folder.', style: 'margin:12px 8px;color:var(--ink-2)'}));
  for (const section of state.sections) {
    outline.append(el('h2', {textContent: section.name + (section.choose ? ' · pick one' : '')}));
    for (const f of section.frames) {
      const dot = el('span', {className: 'dot'}); dot.dataset.status = status[f.id] || '';
      const count = notes.filter(n => n.frame === f.id).length;
      const button = el('button', {type: 'button'}, dot, el('span', {className: 'name', textContent: f.name}), section.choose && picks[section.id] === f.id ? el('span', {textContent: 'Picked'}) : '', count ? el('span', {textContent: String(count)}) : '');
      button.setAttribute('aria-current', selected === f.id);
      button.addEventListener('click', () => { select(f.id); focusFrame(f.id); });
      outline.append(button);
    }
  }
  const inspector = $('inspector'), f = selected && find(selected);
  inspector.hidden = !f;
  if (f) {
    const toggle = (text, on, fn) => { const b = el('button', {type: 'button', className: 'btn', textContent: text}); b.setAttribute('aria-pressed', on); b.addEventListener('click', fn); return b; };
    const set = value => () => { status[f.id] = status[f.id] === value ? '' : value; render(); };
    const actions = el('div', {className: 'row'});
    if (!f.section.reference) {
      if (f.section.choose) actions.append(toggle(picks[f.section.id] === f.id ? 'Picked' : 'Pick this', picks[f.section.id] === f.id, () => { picks[f.section.id] = picks[f.section.id] === f.id ? null : f.id; render(); }));
      actions.append(toggle('Approve', status[f.id] === 'approved', set('approved')), toggle('Needs changes', status[f.id] === 'change', set('change')));
    }
    const tools = el('div', {className: 'row'});
    const whole = el('button', {type: 'button', className: 'btn', textContent: 'Add note'});
    whole.addEventListener('click', () => ask({frame: f.id, selector: '', target: 'whole screen'}));
    tools.append(whole);
    if (f.kind === 'page' && location.protocol !== 'file:') tools.append(toggle(commenting && live === f.id ? 'Click an element…' : 'Pin a comment', commenting && live === f.id, () => { const on = !(commenting && live === f.id); commenting = on; live = on ? f.id : null; render(); }));
    if (f.kind === 'page') { const play = el('button', {type: 'button', className: 'btn', textContent: '▶ Present'}); play.addEventListener('click', () => present(f.id)); tools.append(play); }
    if (f.kind === 'page') tools.append(toggle('Use it', live === f.id && !commenting, () => { live = live === f.id && !commenting ? null : f.id; commenting = false; render(); }));
    tools.append(el('a', {className: 'btn', href: f.src, target: '_blank', rel: 'noopener', textContent: 'Open'}));
    const list = el('div', {className: 'notes'});
    notes.forEach((n, i) => { if (n.frame !== f.id) return; const x = el('button', {type: 'button', textContent: '✕'}); x.setAttribute('aria-label', 'Remove comment'); x.addEventListener('click', () => { notes.splice(i, 1); render(); }); list.append(el('div', {className: 'note'}, el('b', {textContent: String(i + 1)}), el('span', {textContent: n.target + ': ' + n.text}), x)); });
    inspector.replaceChildren(el('h3', {textContent: f.name}), f.note ? el('p', {textContent: f.note}) : '', actions, tools, list);
  }
  $('hint').hidden = !live; $('hint').textContent = commenting ? 'Click the element to comment on. Esc to stop.' : 'Using this screen. Click outside it or press Esc to go back to the canvas.';
  place();
}

function summary() {
  const lines = [];
  for (const s of state.sections) if (s.choose) lines.push(s.name + ': ' + (picks[s.id] ? 'picked ' + picks[s.id] : 'no pick'));
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
  drag.moved = true; viewport.classList.add('panning'); view.x = drag.vx + dx; view.y = drag.vy + dy; apply();
});
const release = () => { if (!drag) return; viewport.classList.remove('panning'); if (!drag.moved) { if (drag.id) select(drag.id); else { selected = null; render(); } } drag = null; };
viewport.addEventListener('pointerup', release); viewport.addEventListener('pointercancel', release);
viewport.addEventListener('wheel', e => {
  if (live) return;
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, view.z * Math.exp(-e.deltaY * 0.01));
  else { view.x -= e.deltaX; view.y -= e.deltaY; apply(); }
}, {passive: false});
const centre = () => { const r = viewport.getBoundingClientRect(); return [r.width / 2, r.height / 2]; };
$('zoom-in').addEventListener('click', () => zoomAt(...centre(), view.z * 1.25));
$('zoom-out').addEventListener('click', () => zoomAt(...centre(), view.z / 1.25));
$('zoom-level').addEventListener('click', () => zoomAt(...centre(), 1));
$('zoom-fit').addEventListener('click', fitAll);
addEventListener('keydown', e => {
  if (e.target.closest('textarea, input, dialog')) return;
  if (playing) { if (e.key === 'Escape') closePresent(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); return; }
  if (e.key === 'Escape') { live = null; commenting = false; render(); }
  else if (e.key === 'p' || e.key === 'P') present(selected);
  else if (e.key === 'f' || e.key === 'F') $('flows').click();
  else if (e.key === '1') fitAll();
  else if (e.key === '+' || e.key === '=') zoomAt(...centre(), view.z * 1.25);
  else if (e.key === '-') zoomAt(...centre(), view.z / 1.25);
  else if (e.key === 'Enter' && selected) focusFrame(selected);
});
$('note-dialog').addEventListener('close', () => {
  const text = $('note-text').value.trim();
  if ($('note-dialog').returnValue === 'ok' && text && pending) { notes.push({...pending, text}); if (!status[pending.frame]) status[pending.frame] = 'change'; commenting = false; live = null; }
  pending = null; render();
});
$('send').addEventListener('click', async () => {
  const feedback = {stage: state.stage, picks, frames: frames().filter(f => status[f.id]).map(f => ({id: f.id, status: status[f.id]})), notes: notes.map(({x, y, ...n}) => n), general: $('general').value.trim()};
  if (!feedback.frames.length && !feedback.notes.length && !feedback.general && !Object.values(picks).some(Boolean)) { $('status').textContent = 'Approve, pick or comment first.'; return; }
  let saved = false;
  if (location.protocol !== 'file:') { try { saved = (await fetch('feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(feedback)})).ok; } catch {} }
  try { await navigator.clipboard.writeText(summary()); } catch {}
  $('status').textContent = !saved ? 'Copied. Paste it to your agent.' : state.agentWaiting ? 'Sent. Your agent has it.' : 'Saved. Tell your agent you are done.';
});

async function load() {
  if (EMBEDDED) { state = EMBEDDED; build(); render(); return; }
  try {
    const next = await (await fetch('state', {cache: 'no-store'})).json();
    if (!state || next.rev !== state.rev) {
      const first = !state, shape = s => s.sections.map(x => x.id + ':' + x.frames.map(f => f.id).join(',')).join('|');
      const same = !first && shape(next) === shape(state), before = state;
      state = next;
      if (same) { for (const f of frames()) { const old = before.sections.flatMap(s => s.frames).find(o => o.id === f.id); const media = nodes[f.id]?.querySelector('iframe, img'); if (old && old.rev !== f.rev && media) media.src = f.src + '?v=' + f.rev; } for (const s of state.sections) s.node = before.sections.find(o => o.id === s.id).node; }
      else { if (selected && !find(selected)) selected = null; build(); }
      render();
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

function serve(port, attempts = 20) {
  if (!existsSync(dir)) init();
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
            general: text(d.general, 4000), at: new Date().toISOString()};
          writeFileSync(join(dir, 'feedback.json'), JSON.stringify(clean, null, 2) + '\n');
          writeFileSync(join(dir, 'FEEDBACK.md'), '# Canvas feedback\n\n' + feedbackLines(clean).join('\n') + '\n');
          send(200, '{"ok":true}', TYPES['.json']);
        } catch { send(400, 'Bad request'); }
      });
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed');
    if (path === '/') return send(200, page(null), TYPES['.html']);
    if (path === '/state') return send(200, JSON.stringify(readState()), TYPES['.json']);
    const file = inside('.' + path);
    if (!file || file.slice(dir.length).split(sep).some(part => part.startsWith('.')) || !existsSync(file) || !statSync(file).isFile()) return send(404, 'Not found');
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
    for (const f of s.frames) console.log(`  ${f.id}  ${f.kind === 'page' ? `${f.device} ${f.w}×${f.h}` : 'image'}  "${f.name}"${f.links?.length ? `  → ${f.links.join(', ')}` : ''}`);
  }
  if (!state.sections.length) console.log('No screens yet.');
}

function feedbackLines(feedback) {
  const lines = [];
  for (const [section, id] of Object.entries(feedback.picks || {})) lines.push(`Picked in ${section}: ${id}`);
  const of = v => (feedback.frames || []).filter(f => f.status === v).map(f => f.id);
  if (of('approved').length) lines.push(`Approved: ${of('approved').join(', ')}`);
  if (of('change').length) lines.push(`Needs changes: ${of('change').join(', ')}`);
  (feedback.notes || []).forEach((n, i) => lines.push(`${i + 1}. ${n.frame} ${n.target}${n.selector ? ` [${n.selector}]` : ''}: ${n.text}`));
  if (feedback.general) lines.push(`General: ${feedback.general}`);
  const state = readState(), touched = new Set([...(feedback.frames || []).map(f => f.id), ...(feedback.notes || []).map(n => n.frame)]);
  const silent = state.sections.filter(s => !s.reference && !s.choose).flatMap(s => s.frames).filter(f => !touched.has(f.id)).map(f => f.id);
  if (silent.length) lines.push(`No answer on: ${silent.join(', ')}`);
  return lines;
}

function printFeedback(feedback) { for (const line of feedbackLines(feedback)) console.log(line); }

/** Open the address in the person's browser when this machine has one. Never fails the command. */
function launch(url) {
  if (argv.includes('--no-browser') || process.env.CI || process.env.SEENRY_NO_BROWSER) return false;
  if (process.platform === 'linux' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) return false;
  if (process.env.SSH_CONNECTION && process.platform !== 'darwin') return false;
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { const child = spawn(cmd, args, {detached: true, stdio: 'ignore'}); child.on('error', () => {}); child.unref(); return true; } catch { return false; }
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
  if (!existsSync(dir)) init();
  let info = running();
  if (!info) {
    const log = openSync(join(dir, '.canvas.log'), 'a');
    spawn(process.execPath, [fileURLToPath(import.meta.url), 'serve', dir, '--port', String(port)], {detached: true, stdio: ['ignore', log, log]}).unref();
    for (let i = 0; i < 40 && !(info = running()); i++) await new Promise(r => setTimeout(r, 100));
  }
  if (!info) { console.error(`The canvas did not start. See ${join(dir, '.canvas.log')}, or run "node canvas.mjs static" for a file that opens from disk.`); process.exit(1); }
  const state = readState(), count = state.sections.filter(s => !s.reference).reduce((n, s) => n + s.frames.length, 0);
  const url = `http://127.0.0.1:${info.port}/`, opened = launch(url);
  console.log(`Seenry canvas: ${url}  (${count} screen${count === 1 ? '' : 's'} in ${state.sections.filter(s => !s.reference).length} section${state.sections.filter(s => !s.reference).length === 1 ? '' : 's'})${opened ? ', opened in the browser' : ''}`);
  if (!opened) console.log('No browser here. Give the person the address, or run "canvas.mjs shot" and show canvas.png.');
  if (state.error) console.log(state.error);
} else if (command === 'list') {
  printList(readState());
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
  printFeedback(JSON.parse(readFileSync(path, 'utf8')));
} else if (command === 'static') {
  if (!existsSync(dir)) init();
  writeFileSync(join(dir, 'canvas.html'), page(readState()));
  console.log(`Wrote ${join(dir, 'canvas.html')}. It opens from disk; feedback is copied as text to paste to the agent.`);
} else if (command === 'shot') {
  const playwright = await loadPlaywright();
  if (!playwright) { console.error('Playwright not found. Install it in the project or pass --playwright <path to playwright/index.mjs>.'); process.exit(2); }
  const chromium = playwright.chromium || playwright.default?.chromium;
  writeFileSync(join(dir, 'canvas.html'), page(readState()));
  const browser = await chromium.launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
  const tab = await browser.newPage({viewport: {width: Number(flag('width', 2000)), height: Number(flag('height', 1300))}, deviceScaleFactor: 1});
  await tab.goto(pathToFileURL(join(dir, 'canvas.html')).href);
  await tab.waitForTimeout(1500);
  await tab.addStyleTag({content: '#panel,#zoom,#hint{display:none!important} #viewport{inset:0!important}'});
  await tab.evaluate(() => document.getElementById('zoom-fit').click());
  await tab.waitForTimeout(300);
  await tab.screenshot({path: join(dir, 'canvas.png')});
  await browser.close();
  console.log(`Wrote ${join(dir, 'canvas.png')}`);
} else {
  console.error('Usage: node canvas.mjs init|open|wait|feedback|list|static|shot|serve|stop [dir]'); process.exit(2);
}
