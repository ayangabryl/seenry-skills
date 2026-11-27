#!/usr/bin/env node
/**
 * Seenry canvas sync: mirror a local canvas to your Seenry account and bring online feedback back.
 *
 *  node sync.mjs link   [--server url] [--name "Studio iMac"]   link this machine (prints a code to approve in the browser, then waits)
 *  node sync.mjs link --code <setup code>   link at once with the one-time code a setup prompt copied from Seenry carries
 *  node sync.mjs link --start           print the link and code and return at once (for agents: show them, then run --finish)
 *  node sync.mjs link --finish [--wait 90]   complete a link begun with --start; exits 4 while it is still waiting for approval
 *  node sync.mjs library [--agent <id>]  add the Seenry reference library (MCP) to every agent on this computer (or one)
 *  node sync.mjs taste                   print the person's taste file from their Seenry account (seenry's start.mjs prints it too)
 *  node sync.mjs push   [dir]            push the canvas once (only files whose content changed are uploaded)
 *  node sync.mjs watch  [dir]            push on every change and pull feedback as it arrives, until stopped
 *  node sync.mjs pull   [dir]            write feedback sent online into the canvas, exactly as Send to agent does
 *  node sync.mjs status [dir]            show the link, this canvas online and feedback waiting to be pulled
 *  node sync.mjs unlink                  forget this machine here and on the server
 *
 * watch asks for feedback no more often than the server's pollSeconds (10 s by default) and stops on a plan limit (402).
 * The canvas folder defaults to .seenry/canvas. The token and the library key live in your config folder (mode 0600),
 * never in the project, and are never printed. A Seenry Pro account's approval also creates the library key. The local canvas never depends on the server: when it is unreachable, sync waits and tries again.
 * Plain Node 18+, no packages.
 */
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, chmodSync, rmSync, realpathSync, openSync, readSync, closeSync, copyFileSync} from 'node:fs';
import {join, resolve, extname, basename, dirname, relative, sep, delimiter, isAbsolute} from 'node:path';
import {homedir, hostname} from 'node:os';
import {spawnSync} from 'node:child_process';

const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'status';
const flag = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback; };
const positional = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--') && !['--json', '--once', '--start', '--finish', '--no-library'].includes(all[i - 1])));
const json = argv.includes('--json');
const dir = resolve(flag('dir') || positional[0] || '.seenry/canvas');

const DEVICES = {desktop: [1440, 900], laptop: [1280, 800], tablet: [834, 1112], phone: [390, 844]};
const ALLOWED = new Set(['html', 'css', 'js', 'mjs', 'json', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'woff2', 'woff', 'ttf', 'otf', 'mp4', 'webm', 'txt']);
const SKIP_DIRS = new Set(['refs', 'archive', 'node_modules', 'library']);
const LIMITS = {html: 2 * 1024 * 1024, file: 8 * 1024 * 1024};

// ── Config: one file in the user's config folder, readable only by them ────────────────────────────────────────
const configDir = () => process.env.SEENRY_CONFIG_DIR || join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'seenry');
const configFile = () => join(configDir(), 'canvas-sync.json');
function readConfig() {
  try {
    const path = configFile();
    if ((statSync(path).mode & 0o077) !== 0) chmodSync(path, 0o600);
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch { return null; }
}
// A link begun with --start (its device code), and the library key a Pro approval hands over. Same folder, same mode.
const pendingFile = () => join(configDir(), 'canvas-link-pending.json');
const libraryKeyFile = () => join(configDir(), 'canvas-library-key');
function writePrivate(path, text) {
  const folder = configDir();
  const project = resolve(dir, '..', '..');
  if (isInside(folder, dir) || (real(project) !== real(homedir()) && isInside(folder, project))) throw new Error(`Refusing to keep the token inside a project (${folder}). Set SEENRY_CONFIG_DIR to a folder in your home directory.`);
  mkdirSync(folder, {recursive: true, mode: 0o700});
  writeFileSync(path, text, {mode: 0o600});
  chmodSync(path, 0o600);
}
const writeConfig = config => writePrivate(configFile(), JSON.stringify(config, null, 2) + '\n');
// Compared through real paths, so a symlinked temp or home folder cannot hide that one is inside the other.
function real(path) { let p = resolve(path), rest = ''; while (!existsSync(p) && p !== dirname(p)) { rest = join(basename(p), rest); p = dirname(p); } return join(realpathSync(p), rest); }
function isInside(child, parent) { const rel = relative(real(parent), real(child)); return rel === '' || (!rel.startsWith('..') && !rel.startsWith(sep) && !/^[a-z]:/i.test(rel)); }

function agentName() {
  const e = process.env, bundle = e.__CFBundleIdentifier || '';
  if (e.T3CODE_THREAD_ID || e.CLAUDE_CODE_ENTRYPOINT === 't3-code' || /t3code/i.test(bundle)) return 'T3 Code';
  if (e.CLAUDECODE || e.CLAUDE_CODE_ENTRYPOINT) return 'Claude Code';
  if (e.CODEX_HOME || e.CODEX_SANDBOX || /com\.openai\.codex/i.test(bundle)) return 'Codex';
  if (e.CURSOR_TRACE_ID) return 'Cursor';
  return '';
}

// The server's plan sets how often a machine may ask for feedback (pollSeconds); the watch never asks faster.
let serverPoll = 0;
const LIMITED = new Set([402, 429]);
async function api(config, path, {method = 'GET', body, raw} = {}) {
  const headers = {authorization: `Bearer ${config.token}`};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (raw) headers['content-type'] = 'application/octet-stream';
  const response = await fetch(config.server + path, {method, headers, body: raw || (body !== undefined ? JSON.stringify(body) : undefined)});
  const data = await response.json().catch(() => null);
  if (Number(data?.pollSeconds) > 0) serverPoll = Number(data.pollSeconds);
  if (!response.ok) {
    const error = new Error(data?.detail || data?.message || data?.error || `Seenry answered ${response.status}`);
    error.status = response.status; error.retryAfter = Number(response.headers.get('retry-after')) || 0;
    throw error;
  }
  return data;
}
function requireConfig() {
  const config = readConfig();
  if (!config?.token) { console.error('This machine is not linked. Run: node sync.mjs link'); process.exit(2); }
  return config;
}

// ── Reading the canvas folder the way canvas.mjs does ─────────────────────────────────────────────────────────
const sha = data => createHash('sha256').update(data).digest('hex');
const pretty = name => name.replace(/^\d+[-_. ]*/, '').replace(/[-_]+/g, ' ').replace(/^\w/, c => c.toUpperCase()) || name;
const unescape = text => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const mtime = path => { try { return Math.round(statSync(path).mtimeMs); } catch { return 0; } };
const sorted = list => list.sort((a, b) => a.localeCompare(b, 'en', {numeric: true}));
const readJson = (path, fallback) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } };

function head(path) {
  let text = '';
  try { const fd = openSync(path, 'r'), buffer = Buffer.alloc(4096); text = buffer.toString('utf8', 0, readSync(fd, buffer, 0, 4096, 0)); closeSync(fd); } catch {}
  const title = text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const meta = {};
  for (const m of text.matchAll(/<meta\b[^>]*>/gi)) {
    const name = m[0].match(/name\s*=\s*["']seenry-([\w-]+)["']/i)?.[1], content = m[0].match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (name && content) meta[name.toLowerCase()] = unescape(content[1] ?? content[2] ?? '');
  }
  return {title: title ? unescape(title) : '', meta};
}
function idFor(folder, file) {
  const stem = file.replace(/\.html$/i, '');
  const device = Object.keys(DEVICES).find(d => stem.toLowerCase().endsWith('.' + d));
  const clean = device ? stem.slice(0, stem.lastIndexOf('.')) : stem;
  return (folder ? folder.replace(/\.options$/i, '') + '/' : '') + clean;
}
function frameFrom(folder, file) {
  const rel = folder ? `${folder}/${file}` : file, stem = file.replace(/\.html$/i, '');
  const device = Object.keys(DEVICES).find(d => stem.toLowerCase().endsWith('.' + d)) || 'desktop';
  const clean = device === 'desktop' && !stem.toLowerCase().endsWith('.desktop') ? stem : stem.slice(0, stem.lastIndexOf('.'));
  const {title, meta} = head(join(dir, rel));
  return {id: idFor(folder, file), path: rel, name: title || pretty(clean), device, rev: mtime(join(dir, rel)),
    meta: {note: meta.note || '', caption: meta.caption || '', axis: meta.axis || '', wins: meta.wins || '', cost: meta.cost || '', risk: /^(safe|bold)$/i.test(meta.risk || '') ? meta.risk.toLowerCase() : '', ask: (meta.ask || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 4), sketch: /^sketch$/i.test(meta.fidelity || '')}};
}

function readCanvas() {
  const manifest = readJson(join(dir, 'canvas.json'), {});
  const entries = readdirSync(dir, {withFileTypes: true}).filter(e => !e.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: true}));
  const sections = [];
  const loose = entries.filter(e => e.isFile() && /\.html$/i.test(e.name) && e.name !== 'canvas.html' && !e.name.startsWith('_')).map(e => frameFrom('', e.name));
  if (loose.length) sections.push({id: 'screens', name: 'Screens', choose: false, frames: loose});
  for (const e of entries) {
    if (!e.isDirectory() || SKIP_DIRS.has(e.name) || e.name === 'assets' || e.name === 'fonts') continue;
    const frames = sorted(readdirSync(join(dir, e.name)).filter(f => /\.html$/i.test(f))).map(f => frameFrom(e.name, f));
    if (!frames.length) continue;
    const id = e.name.replace(/\.options$/i, ''), study = id === '00-identity';
    sections.push({id, name: study ? 'Identity studies' : pretty(id), choose: /\.options$/i.test(e.name) || study, frames});
  }
  for (const s of sections) {
    const extra = manifest.sections?.[s.id] || {};
    if (extra.name) s.name = String(extra.name);
    s.status = ['in-progress', 'review', 'ready'].includes(extra.status) ? extra.status : '';
    s.note = String(extra.note || (s.choose ? 'Options: pick one' : ''));
    const count = {}; for (const f of s.frames) count[f.id] = (count[f.id] || 0) + 1;
    for (const f of s.frames) if (count[f.id] > 1 && f.device !== 'desktop') f.id += '.' + f.device;
  }
  return {manifest, sections};
}

function agentWaiting() {
  try { const info = JSON.parse(readFileSync(join(dir, '.waiting.json'), 'utf8')); process.kill(info.pid, 0); return true; } catch { return false; }
}
function recentActivity() {
  try { return readFileSync(join(dir, '.activity.jsonl'), 'utf8').trim().split('\n').slice(-20).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; }
}

/** Every file a screen may load: html, css, images, fonts. Hidden files, refs, archive and the canvas's own records stay local. */
function collectFiles() {
  const files = [], skipped = [];
  const walk = (folder, depth) => {
    for (const e of readdirSync(join(dir, folder), {withFileTypes: true})) {
      if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
      const rel = folder ? `${folder}/${e.name}` : e.name;
      if (e.isDirectory()) { if (depth < 5 && !(depth === 0 && SKIP_DIRS.has(e.name))) walk(rel, depth + 1); continue; }
      if (!e.isFile()) continue;
      const ext = extname(e.name).slice(1).toLowerCase();
      if (!ALLOWED.has(ext) || (depth === 0 && (ext === 'json' || e.name === 'canvas.html'))) continue;
      const size = statSync(join(dir, rel)).size;
      if (size > (ext === 'html' ? LIMITS.html : LIMITS.file)) { skipped.push(rel); continue; }
      files.push({path: rel, size});
    }
  };
  walk('', 0);
  return {files, skipped};
}

function snapshot() {
  const {manifest, sections} = readCanvas();
  const {files, skipped} = collectFiles();
  const local = new Map();
  for (const f of files) { const data = readFileSync(join(dir, f.path)); f.hash = sha(data); local.set(f.hash, join(dir, f.path)); }
  const known = new Set(files.map(f => f.path));
  const screens = sections.flatMap(s => s.frames.filter(f => known.has(f.path)).map(f => {
    const png = join(dir, '.renders', `${f.id.replace(/[^\w.-]+/g, '__')}.${f.device}.light.png`);
    let preview = null;
    if (existsSync(png) && mtime(png) >= f.rev && statSync(png).size <= LIMITS.file) { const data = readFileSync(png); preview = {hash: sha(data), size: data.length}; local.set(preview.hash, png); }
    return {id: f.id, section: s.id, path: f.path, name: f.name, device: f.device, meta: f.meta, png: preview};
  }));
  const title = String(manifest.title || basename(resolve(dir, '..', '..')) || 'Seenry canvas');
  const state = {question: String(manifest.question || ''), stage: String(manifest.stage || ''), description: String(manifest.description || ''), waiting: agentWaiting(),
    sections: sections.map(({id, name, choose, status, note}) => ({id, name, choose, status, note})), activity: recentActivity()};
  return {payload: {localKey: localKey(), title, state, files: files.map(({path, hash, size}) => ({path, hash, size})), screens}, local, skipped, sections};
}
const localKey = () => sha('seenry-canvas:' + realpathSync(dir));

// ── Push ──────────────────────────────────────────────────────────────────────────────────────────────────────
async function push(config, {quiet = false} = {}) {
  const {payload, local, skipped} = snapshot();
  let result = await api(config, '/api/canvas/sync/push', {method: 'POST', body: payload});
  if (result.status === 'upload') {
    const queue = [...result.missing];
    let uploaded = 0, bytes = 0;
    const worker = async () => {
      while (queue.length) {
        const hash = queue.shift(), path = local.get(hash);
        if (!path) throw new Error(`The server asked for a file this canvas does not have (${hash.slice(0, 12)}).`);
        const data = readFileSync(path);
        if (sha(data) !== hash) throw new Error(`${path} changed while uploading; push again.`);
        await api(config, '/api/canvas/sync/blobs/' + hash, {method: 'PUT', raw: data});
        uploaded++; bytes += data.length;
      }
    };
    await Promise.all(Array.from({length: Math.min(4, queue.length)}, worker));
    result = await api(config, '/api/canvas/sync/push', {method: 'POST', body: payload});
    if (result.status !== 'synced') throw new Error('Files changed during the upload; push again.');
    result.uploaded = uploaded; result.uploadedBytes = bytes;
  }
  if (skipped.length && !quiet) console.log(`Skipped (over the size limit): ${skipped.join(', ')}`);
  if (!quiet) console.log(`Pushed ${payload.title}: ${result.screens} screen${result.screens === 1 ? '' : 's'}${result.uploaded ? `, uploaded ${result.uploaded} file${result.uploaded === 1 ? '' : 's'} (${Math.round(result.uploadedBytes / 1024)} KB)` : ', nothing new to upload'}.\n${result.url}`);
  return result;
}

// ── Pull: write feedback exactly as the local canvas's Send to agent does ───────────────────────────────────────
function mergeFeedback(events) {
  const merged = {stage: '', picks: {}, frames: [], notes: [], riff: [], general: ''};
  const generals = [];
  for (const e of events) {
    const p = e.payload || {};
    if (p.stage) merged.stage = p.stage;
    Object.assign(merged.picks, p.picks || {});
    for (const f of p.frames || []) { merged.frames = merged.frames.filter(x => x.id !== f.id); merged.frames.push(f); }
    merged.notes.push(...(p.notes || []));
    merged.riff.push(...(p.riff || []));
    if (p.general) generals.push(p.general);
  }
  merged.general = generals.join('\n\n');
  return merged;
}
// The three fixed ways to answer More like this; canvas.mjs holds the same three for feedback sent from the local canvas.
const RIFF_MODES = [
  'Same style, new layout: keep its tokens, type, image and idea line; recompose the first screen (what leads, where the image sits, the grid).',
  'New style, same content: keep every word, number and the product view; change the type, colour, image treatment and surfaces.',
  'Break its rule: name one rule this option obeys that nobody asked for (everything centred, the image always behind the text, one column), then make the version that breaks it on purpose.',
];
function feedbackLines(feedback, sections) {
  const lines = [];
  for (const [section, id] of Object.entries(feedback.picks || {})) lines.push(`Picked in ${section}: ${id}`);
  for (const r of feedback.riff || []) lines.push(`More like this in ${r.section}: ${r.frame}. Make three new options around it, one per mode, each named by its mode in seenry-axis; do not resolve the section yet. ${RIFF_MODES.map((m, i) => `(${i + 1}) ${m}`).join(' ')}`);
  const of = v => (feedback.frames || []).filter(f => f.status === v).map(f => f.id);
  if (of('approved').length) lines.push(`Approved: ${of('approved').join(', ')}`);
  if (of('change').length) lines.push(`Needs changes: ${of('change').join(', ')}`);
  (feedback.notes || []).forEach((n, i) => lines.push(`${i + 1}. ${n.frame} ${n.target}${n.selector ? ` [${n.selector}]` : ''}: ${n.text}`));
  if (feedback.general) lines.push(`General: ${feedback.general}`);
  const touched = new Set([...(feedback.frames || []).map(f => f.id), ...(feedback.notes || []).map(n => n.frame)]);
  const silent = sections.filter(s => !s.choose).flatMap(s => s.frames).filter(f => !touched.has(f.id)).map(f => f.id);
  if (silent.length) lines.push(`No answer on: ${silent.join(', ')}`);
  return lines;
}
function writeFeedback(events) {
  const text = (v, n) => String(v ?? '').slice(0, n), m = mergeFeedback(events);
  // The same cleaning the local server applies, so a later `wait` or `feedback` reads it identically.
  const clean = {stage: text(m.stage, 80),
    picks: Object.fromEntries(Object.entries(m.picks).filter(([, v]) => v).slice(0, 60).map(([k, v]) => [text(k, 120), text(v, 200)])),
    frames: m.frames.slice(0, 400).map(f => ({id: text(f.id, 200), status: f.status === 'approved' ? 'approved' : 'change'})),
    notes: m.notes.slice(0, 200).map(n => ({frame: text(n.frame, 200), target: text(n.target, 160), selector: text(n.selector, 240), text: text(n.text, 2000)})),
    riff: m.riff.slice(0, 20).map(r => ({section: text(r.section, 120), frame: text(r.frame, 200)})),
    general: text(m.general, 4000), at: new Date().toISOString()};
  writeFileSync(join(dir, 'feedback.json'), JSON.stringify(clean, null, 2) + '\n');
  writeFileSync(join(dir, 'FEEDBACK.md'), '# Canvas feedback\n\n' + feedbackLines(clean, readCanvas().sections).join('\n') + '\n');
  const review = readJson(join(dir, 'review.json'), {frames: {}}), now = Date.now();
  review.frames = review.frames || {};
  for (const f of clean.frames) review.frames[f.id] = {status: f.status, at: now};
  writeFileSync(join(dir, 'review.json'), JSON.stringify(review, null, 2) + '\n');
  mkdirSync(join(dir, '.history'), {recursive: true});
  writeFileSync(join(dir, '.history', clean.at.replace(/[:.]/g, '-') + '.json'), JSON.stringify(clean, null, 2) + '\n');
  return clean;
}
async function pull(config, {quiet = false} = {}) {
  let data;
  try { data = await api(config, '/api/canvas/sync/feedback?localKey=' + localKey()); }
  catch (error) { if (error.status === 404) { if (!quiet) console.log('This canvas is not online yet. Run: node sync.mjs push'); return null; } throw error; }
  if (!data.events.length) { if (!quiet) console.log('No feedback waiting online.'); return null; }
  const clean = writeFeedback(data.events);
  await api(config, '/api/canvas/sync/feedback/ack', {method: 'POST', body: {localKey: localKey(), ids: data.events.map(e => e.id)}});
  const who = [...new Set(data.events.map(e => e.source === 'owner' ? 'you' : e.author || 'a guest'))].join(', ');
  console.log(`Pulled ${data.events.length} feedback ${data.events.length === 1 ? 'event' : 'events'} from ${who} into ${join(dir, 'feedback.json')}.`);
  if (!quiet) for (const line of feedbackLines(clean, readCanvas().sections)) console.log(line);
  return clean;
}

// ── Commands ──────────────────────────────────────────────────────────────────────────────────────────────────
const wait = ms => new Promise(r => setTimeout(r, ms));
const serverUrl = () => String(flag('server', process.env.SEENRY_SERVER || readConfig()?.server || 'https://seenry.design')).replace(/\/+$/, '');

/** Asks Seenry for a link code. A computer that is already linked sends its token, so the new link takes its place. */
async function beginLink(server) {
  const old = readConfig();
  const name = flag('name', hostname().replace(/\.local$/, '')), agent = flag('agent', agentName());
  const headers = {'content-type': 'application/json', ...(old?.token && old.server === server ? {authorization: `Bearer ${old.token}`} : {})};
  const start = await fetch(server + '/api/canvas/link/start', {method: 'POST', headers, body: JSON.stringify({name, agent, ...(argv.includes('--no-library') ? {} : {library: true})})});
  const begun = await start.json().catch(() => null);
  if (!start.ok) throw new Error(begun?.detail || `Seenry answered ${start.status}`);
  return {server, name, deviceCode: begun.deviceCode, userCode: begun.userCode, verificationUrl: begun.verificationUrl, expiresAt: Date.now() + begun.expiresIn * 1000, interval: Number(flag('interval', begun.interval)) || 3};
}

/**
 * Asks whether the code was approved until `until`. A dropped connection or a server error is not an answer:
 * the approval may take ten minutes, so it asks again. Returns false when `until` passes first.
 */
async function awaitApproval(pending, until) {
  while (Date.now() < until) {
    await wait(pending.interval * 1000);
    let response, data = null;
    try {
      response = await fetch(pending.server + '/api/canvas/link/poll', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({deviceCode: pending.deviceCode})});
      data = await response.json().catch(() => null);
    } catch { continue; }
    if (response.ok && data?.status === 'pending') continue;
    if (response.status >= 500 || response.status === 429) continue;
    if (!response.ok) { rmSync(pendingFile(), {force: true}); throw new Error(data?.detail || `Seenry answered ${response.status}`); }
    saveLink(pending.server, data);
    return true;
  }
  return false;
}

/** Writes the token (and the library key, when the approval made one). Neither is ever printed. */
function saveLink(server, data) {
  const key = data.library?.key;
  writeConfig({server, token: data.token, machine: data.machine, account: data.account, linkedAt: new Date().toISOString(), ...(data.library?.url ? {library: {url: data.library.url}} : {})});
  if (key) writePrivate(libraryKeyFile(), key + '\n'); else rmSync(libraryKeyFile(), {force: true});
  rmSync(pendingFile(), {force: true});
  console.log(`Linked ${data.machine.name} to ${data.account.email}. The token is in ${configFile()} (readable only by you).`);
  if (key) console.log('The reference library is ready for this computer. Add it to every agent on this computer with: node sync.mjs library');
  else if (data.library?.error) console.log(`The reference library was not connected: ${data.library.error}`);
}

/** Links with the one-time code from a setup prompt copied inside Seenry: no approval in the browser. */
async function redeem(server, code) {
  const old = readConfig();
  const name = flag('name', hostname().replace(/\.local$/, '')), agent = flag('agent', agentName());
  const headers = {'content-type': 'application/json', ...(old?.token && old.server === server ? {authorization: `Bearer ${old.token}`} : {})};
  const response = await fetch(server + '/api/canvas/link/redeem', {method: 'POST', headers, body: JSON.stringify({code, name, agent, ...(argv.includes('--no-library') ? {library: false} : {})})});
  const data = await response.json().catch(() => null);
  if (!response.ok) { const error = new Error(data?.detail || `Seenry answered ${response.status}`); error.status = response.status; throw error; }
  saveLink(server, data);
}

async function link() {
  const server = serverUrl();
  const code = flag('code');
  if (code) return redeem(server, code);
  if (argv.includes('--finish')) {
    const pending = readJson(pendingFile(), null);
    if (!pending?.deviceCode) { console.error('No link is waiting. Start one with: node sync.mjs link --start'); process.exit(2); }
    if (pending.expiresAt <= Date.now()) { rmSync(pendingFile(), {force: true}); throw new Error('The code expired before it was approved. Run link --start again.'); }
    if (await awaitApproval(pending, Math.min(pending.expiresAt, Date.now() + Number(flag('wait', 90)) * 1000))) return;
    console.log(`Not approved yet. Open\n  ${pending.verificationUrl}\nand confirm the code ${pending.userCode}, then run link --finish again.`);
    process.exit(4);
  }
  const pending = await beginLink(server);
  if (argv.includes('--start')) {
    writePrivate(pendingFile(), JSON.stringify(pending) + '\n');
    console.log(`To link ${pending.name}, open\n  ${pending.verificationUrl}\nand confirm the code ${pending.userCode}. Then run link --finish with the same script.`);
    return;
  }
  console.log(`To link ${pending.name}, open\n  ${pending.verificationUrl}\nand confirm the code ${pending.userCode}. Waiting…`);
  if (!await awaitApproval(pending, pending.expiresAt)) throw new Error('The code expired before it was approved. Run link again.');
}

/** The person's taste, as they set it on Seenry: what they chose, what they never want, what they love. */
async function taste() {
  const config = readConfig();
  if (!config?.token) { console.log('Taste: this computer is not linked to a Seenry account, so there is no taste to read. Run: node sync.mjs link'); return; }
  const response = await fetch(config.server + '/api/account/taste.md', {headers: {authorization: `Bearer ${config.token}`}});
  if (response.status === 204) { console.log('Taste: switched off in their Seenry account. Design from the project and the brief.'); return; }
  if (!response.ok) { const data = await response.json().catch(() => null), error = new Error(data?.detail || `Seenry answered ${response.status}`); error.status = response.status; throw error; }
  console.log((await response.text()).trim());
}

// ── The reference library in every agent on this computer ─────────────────────────────────────────────────────
// Each entry is the agent's own user-level config, from its docs. Only home-level files are written, never a project's.
const home = () => homedir();
const onPath = name => (process.env.PATH || '').split(delimiter).some(d => d && ['', '.cmd', '.exe'].some(ext => existsSync(join(d, name + ext))));
const codexHome = () => process.env.CODEX_HOME || join(home(), '.codex');
const copilotHome = () => process.env.COPILOT_HOME || join(home(), '.copilot');
const bearer = key => ({Authorization: `Bearer ${key}`});
const AGENTS = [
  {id: 'claude-code', name: 'Claude Code', aliases: ['claude'], found: () => onPath('claude') || existsSync(join(home(), '.claude')), add: addClaude,
    manual: (url, keyPath) => `run claude mcp add --transport http --scope user seenry ${url} --header "Authorization: Bearer $(cat ${keyPath})"`},
  {id: 'codex', name: 'Codex', found: () => existsSync(codexHome()), file: () => join(codexHome(), 'config.toml'), add: addCodex,
    manual: (url, keyPath) => `add [mcp_servers.seenry] with url = "${url}" and http_headers = { Authorization = "Bearer <the key in ${keyPath}>" } to ${join(codexHome(), 'config.toml')}`},
  {id: 'cursor', name: 'Cursor', found: () => existsSync(join(home(), '.cursor')), file: () => join(home(), '.cursor', 'mcp.json'), servers: 'mcpServers',
    entry: (url, key) => ({url, headers: bearer(key)})},
  {id: 'antigravity', name: 'Antigravity', found: () => ['antigravity', 'antigravity-cli', 'antigravity-ide', join('config', 'mcp_config.json')].some(d => existsSync(join(home(), '.gemini', d))),
    file: () => join(home(), '.gemini', 'config', 'mcp_config.json'), servers: 'mcpServers', entry: (url, key) => ({serverUrl: url, headers: bearer(key)})},
  {id: 'gemini-cli', name: 'Gemini CLI', aliases: ['gemini'], found: () => existsSync(join(home(), '.gemini', 'settings.json')) || onPath('gemini'),
    file: () => join(home(), '.gemini', 'settings.json'), servers: 'mcpServers', entry: (url, key) => ({httpUrl: url, headers: bearer(key)})},
  {id: 'github-copilot', name: 'GitHub Copilot (VS Code and CLI)', aliases: ['copilot', 'vscode'], found: () => existsSync(copilotHome()),
    file: () => join(copilotHome(), 'mcp-config.json'), servers: 'mcpServers', entry: (url, key) => ({type: 'http', url, headers: bearer(key), tools: ['*']})},
  {id: 'kimi-code-cli', name: 'Kimi Code', aliases: ['kimi', 'kimi-cli'], found: () => existsSync(join(home(), '.kimi')),
    file: () => join(home(), '.kimi', 'mcp.json'), servers: 'mcpServers', entry: (url, key) => ({url, transport: 'http', headers: bearer(key)})},
];
for (const a of AGENTS) if (!a.add) { a.add = addJson; a.manual = (url, keyPath) => `add "seenry": ${JSON.stringify(a.entry(url, `<the key in ${keyPath}>`))} under "${a.servers}" in ${a.file()}`; }

const tilde = path => { const h = home(), rel = relative(h, path); return rel && !rel.startsWith('..') && !isAbsolute(rel) ? join('~', rel) : path; };
/** A config file the library may write: in the home folder, never inside the project this runs in. */
function homeLevel(file) {
  const cwd = process.cwd();
  if (!isInside(file, home())) return `${tilde(file)} is outside your home folder`;
  if (real(cwd) !== real(home()) && isInside(file, cwd)) return `${tilde(file)} would be inside this project`;
  return '';
}
/** Copies the file before it changes (readable only by you: it may hold other keys), then writes it in place, so a linked dotfile stays linked. */
function rewrite(file, text) {
  let backup = '';
  if (existsSync(file)) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '');
    backup = `${file}.seenry-backup-${stamp}`;
    copyFileSync(file, backup); chmodSync(backup, 0o600);
    writeFileSync(file, text);
  } else {
    mkdirSync(dirname(file), {recursive: true, mode: 0o700});
    writeFileSync(file, text, {mode: 0o600});
  }
  if (process.platform !== 'win32' && (statSync(file).mode & 0o077) !== 0) chmodSync(file, 0o600);
  return backup;
}
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const usesVariable = text => /\$\{|\$[A-Z_]|\{env:/.test(text);

function addJson(agent, url, key) {
  const file = agent.file(), refused = homeLevel(file);
  if (refused) return {state: 'could not', why: refused};
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  let data = {};
  if (text.trim()) { try { data = JSON.parse(text); } catch { return {state: 'could not', why: `${tilde(file)} is not plain JSON (it may have comments), so it was left as it is`}; } }
  if (!plain(data) || (data[agent.servers] !== undefined && !plain(data[agent.servers]))) return {state: 'could not', why: `${tilde(file)} has a layout this script does not know, so it was left as it is`};
  const servers = data[agent.servers] || {}, existing = servers.seenry, wanted = agent.entry(url, key);
  if (existing !== undefined) {
    if (!plain(existing)) return {state: 'could not', why: `the "seenry" entry in ${tilde(file)} has a layout this script does not know`};
    const at = existing.url || existing.serverUrl || existing.httpUrl || '';
    if (at !== url) return {state: 'left', why: `${tilde(file)} already has a different MCP server named seenry (${at || 'no URL'}); remove it and run this again to replace it`};
    const auth = plain(existing.headers) ? Object.entries(existing.headers).find(([k]) => k.toLowerCase() === 'authorization')?.[1] : undefined;
    if (auth === `Bearer ${key}`) return {state: 'set', file};
    if (typeof auth === 'string' && usesVariable(auth)) return {state: 'set', file, note: 'it reads the key from an environment variable'};
    // Same server, new or missing key (a relink makes a new one): keep the entry's other settings, change the header.
    const headers = Object.fromEntries(Object.entries(plain(existing.headers) ? existing.headers : {}).filter(([k]) => k.toLowerCase() !== 'authorization'));
    servers.seenry = {...existing, headers: {...headers, ...wanted.headers}};
  } else servers.seenry = wanted;
  data[agent.servers] = servers;
  const indent = (text.match(/\n([ \t]+)"/) || [])[1] || '  ';
  const backup = rewrite(file, JSON.stringify(data, null, indent) + '\n');
  return {state: existing ? 'updated' : 'added', file, backup};
}

/** Codex keeps TOML and this script reads no packages, so it only appends a new table, or swaps the key in its own line. */
function addCodex(agent, url, key) {
  const file = agent.file(), refused = homeLevel(file);
  if (refused) return {state: 'could not', why: refused};
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '', lines = text.split('\n');
  const named = String.raw`\s*mcp_servers\s*\.\s*(?:seenry|"seenry"|'seenry')\s*`;
  const own = new RegExp(String.raw`^\s*\[${named}(?:\]|\.)`), table = /^\s*\[/;
  const elsewhere = [new RegExp(`^${named}[.=]`), /^\s*mcp_servers\s*=/, /^\s*\[\s*mcp_servers\s*\]/];
  if (lines.some(l => elsewhere.some(r => r.test(l)))) return {state: 'could not', why: `${tilde(file)} defines its MCP servers in a form this script does not edit, so it was left as it is`};
  const mine = []; let inside = false;
  lines.forEach((l, i) => { if (table.test(l)) inside = own.test(l); if (inside) mine.push(i); });
  if (!mine.length) {
    const block = `[mcp_servers.seenry]\nurl = ${JSON.stringify(url)}\nhttp_headers = { Authorization = ${JSON.stringify(`Bearer ${key}`)} }\n`;
    const backup = rewrite(file, text + (text && !text.endsWith('\n') ? '\n' : '') + (text.trim() ? '\n' : '') + block);
    return {state: 'added', file, backup};
  }
  const at = (mine.map(i => lines[i].match(/^\s*url\s*=\s*["']([^"']*)["']/)).find(Boolean) || [])[1] || '';
  if (at !== url) return {state: 'left', why: `${tilde(file)} already has a different MCP server named seenry (${at || 'no URL'}); remove it and run this again to replace it`};
  const authLines = mine.filter(i => /authorization/i.test(lines[i]));
  if (authLines.some(i => lines[i].includes(`Bearer ${key}"`) || lines[i].includes(`Bearer ${key}'`))) return {state: 'set', file};
  if (mine.some(i => /bearer_token_env_var|env_http_headers/.test(lines[i]))) return {state: 'set', file, note: 'it reads the key from an environment variable'};
  const swap = authLines.filter(i => /Bearer [^"']*["']/.test(lines[i]));
  if (swap.length !== 1) return {state: 'could not', why: `the seenry server in ${tilde(file)} has no Authorization header this script can update`};
  lines[swap[0]] = lines[swap[0]].replace(/Bearer [^"']*(["'])/, (_, q) => `Bearer ${key}${q}`);
  return {state: 'updated', file, backup: rewrite(file, lines.join('\n'))};
}

/** Claude Code has a command that takes the key directly, so it is run here and the key never reaches the chat. */
function addClaude(agent, url, key) {
  const claude = (...args) => spawnSync('claude', ['mcp', ...args], {encoding: 'utf8', stdio: 'pipe'});
  const existing = claude('get', 'seenry');
  if (existing.error) return {state: 'could not', why: 'the claude command was not found'};
  // `get` prints the stored header, so its output is read here and never shown.
  const said = String(existing.stdout);
  if (existing.status === 0 && !said.includes(url)) return {state: 'left', why: 'Claude Code already has a different MCP server named seenry; remove it and run this again to replace it'};
  if (existing.status === 0 && said.includes(`Bearer ${key}`)) return {state: 'set'};
  if (existing.status === 0) claude('remove', 'seenry', '-s', 'user');
  const added = claude('add', '--transport', 'http', '--scope', 'user', 'seenry', url, '--header', `Authorization: Bearer ${key}`);
  return added.status === 0 ? {state: existing.status === 0 ? 'updated' : 'added'} : {state: 'could not', why: 'claude mcp add did not succeed'};
}

/**
 * Adds the reference library to every agent installed on this computer, or to the one --agent names. The key is read
 * from the config folder and written only into each agent's own home-level config; it is never printed.
 */
function library() {
  const config = requireConfig(), keyPath = libraryKeyFile(), url = config.library?.url || 'https://mcp.seenry.design/pro';
  const key = existsSync(keyPath) ? readFileSync(keyPath, 'utf8').trim() : '';
  if (!key) { console.log('Reference library: no key on this computer. One is created when a Seenry Pro account approves the link, so with Pro, run link again; without it, skip this step.'); return; }
  const asked = String(flag('agent', 'all')).toLowerCase();
  const chosen = asked === 'all' ? null : AGENTS.find(a => a.id === asked || a.aliases?.includes(asked));
  const general = () => {
    console.log(`Add an MCP server named "seenry" at ${url} with the header "Authorization: Bearer <the key in ${keyPath}>" to the agent's user-level settings.`);
    console.log('Keep the key out of the chat and out of project files.');
  };
  if (asked !== 'all' && !chosen) {
    console.log(`Reference library: "${asked}" is not one this script can set up (${AGENTS.map(a => a.id).join(', ')}).`);
    general(); return;
  }
  const targets = chosen ? [chosen] : AGENTS.filter(a => a.found()), missing = chosen ? [] : AGENTS.filter(a => !targets.includes(a));
  console.log(`Reference library (MCP server "seenry", ${url}):`);
  if (!targets.length) { console.log('  No agent this script knows was found on this computer.'); general(); return; }
  for (const agent of targets) {
    let result;
    if (chosen && agent.id !== 'claude-code' && !agent.found()) result = {state: 'could not', why: 'it was not found on this computer'};
    else { try { result = agent.add(agent, url, key); } catch (error) { result = {state: 'could not', why: String(error.message || error).split(key).join('<key>')}; } }
    const where = preposition => result.file ? ` ${preposition} ${tilde(result.file)}` : agent.id === 'claude-code' ? ' for every project' : '';
    if (result.state === 'added' || result.state === 'updated') {
      console.log(`  ${agent.name}: ${result.state === 'added' ? 'added' : 'key updated'}${where(result.state === 'added' ? 'to' : 'in')}${result.backup ? ` (backup: ${tilde(result.backup)})` : ''}. Restart it to load the server.`);
    } else if (result.state === 'set') console.log(`  ${agent.name}: already set${where('in')}${result.note ? `; ${result.note}` : ''}.`);
    else if (result.state === 'left') console.log(`  ${agent.name}: left as it is: ${result.why}.`);
    else console.log(`  ${agent.name}: could not: ${result.why}. By hand: ${agent.manual(url, keyPath)}.`);
  }
  if (missing.length) console.log(`Not found on this computer: ${missing.map(a => a.name).join(', ')}. For any other agent, add the same server by hand.`);
  console.log(`The key stays in ${keyPath} (readable only by you) and was not printed.`);
}

async function status() {
  const config = readConfig();
  if (!config?.token) { console.log('Not linked. Run: node sync.mjs link'); return; }
  const data = await api(config, '/api/canvas/sync/status');
  const key = existsSync(dir) ? localKey() : null, here = data.canvases.find(c => c.localKey === key);
  if (json) { console.log(JSON.stringify({...data, server: config.server, canvas: here || null}, null, 2)); return; }
  console.log(`Linked as ${data.machine.name} to ${data.account.email} on ${config.server}`);
  console.log(existsSync(libraryKeyFile()) ? 'Reference library: this computer has a key (node sync.mjs library adds it to every agent on this computer).' : 'Reference library: no key on this computer.');
  if (here) console.log(`This canvas: ${here.title}, ${here.screens} screens, last pushed ${new Date(here.pushedAt).toLocaleString()}${here.pending ? `, ${here.pending} feedback waiting (run pull)` : ''}\n${here.url}`);
  else console.log(existsSync(dir) ? 'This canvas is not online yet. Run: node sync.mjs push' : `No canvas at ${dir}.`);
  if (data.canvases.length > (here ? 1 : 0)) console.log(`${data.canvases.length} canvas${data.canvases.length === 1 ? '' : 'es'} from this machine are online.`);
}

async function watch(config) {
  const signature = () => { try { const {files} = collectFiles(); return JSON.stringify([agentWaiting(), mtime(join(dir, 'canvas.json')), ...files.map(f => [f.path, f.size, mtime(join(dir, f.path))]), existsSync(join(dir, '.renders')) ? readdirSync(join(dir, '.renders')).length : 0]); } catch { return ''; } };
  let pushed = '', seen = signature(), changedAt = 0, nextPull = 0, backoff = 0, offline = false;
  const debounce = Number(flag('debounce', 1500)), asked = Number(flag('pull-every', 10000));
  const every = () => Math.max(asked, serverPoll * 1000 || 10000);
  // canvas.mjs reads this record to say "Synced to Seenry" and to stop the watch with the canvas.
  const record = join(dir, '.sync.json'), mark = url => { try { writeFileSync(record, JSON.stringify({pid: process.pid, server: config.server, url: url || ''})); } catch {} };
  const clear = () => { try { if (JSON.parse(readFileSync(record, 'utf8')).pid === process.pid) rmSync(record, {force: true}); } catch {} };
  mark(); process.on('exit', clear); process.on('SIGINT', () => process.exit(130)); process.on('SIGTERM', () => process.exit(143));
  console.log(`Watching ${dir}. Changes push to ${config.server}; online feedback is pulled into the canvas. Ctrl-C to stop.`);
  for (;;) {
    const now = Date.now();
    if (backoff > now) { await wait(500); continue; }
    try {
      const current = signature();
      if (current !== seen) { seen = current; changedAt = now; }
      if (current !== pushed && now - changedAt >= debounce) { const result = await push(config, {quiet: true}); pushed = current; if (result?.url) mark(result.url); console.log(`${new Date().toLocaleTimeString()} pushed`); }
      if (now >= nextPull) { nextPull = now + every(); await pull(config, {quiet: true}); }
      if (offline) { offline = false; console.log('Back online.'); }
    } catch (error) {
      if (error.status === 401) { console.error(error.message); process.exit(2); }
      // A plan limit is not a network blip: say what the server said, and do not hammer it.
      if (error.status === 402) { console.error(`Sync stopped: ${error.message}`); process.exit(3); }
      if (error.status === 429) {
        const seconds = Math.max(error.retryAfter, serverPoll, 60);
        console.error(`Sync paused for ${seconds} s: ${error.message}`);
        backoff = Date.now() + seconds * 1000; nextPull = Math.max(nextPull, backoff); offline = false; await wait(500); continue;
      }
      if (!offline) console.error(`Sync paused: ${error.message}. The local canvas keeps working; retrying.`);
      offline = true; backoff = Date.now() + 15000;
    }
    await wait(500);
  }
}

const needsCanvas = () => { if (!existsSync(join(dir))) { console.error(`No canvas at ${dir}. Pass the folder, e.g. node sync.mjs ${command} .seenry/canvas`); process.exit(2); } };
try {
  if (command === 'link') await link();
  else if (command === 'library') library();
  else if (command === 'taste') await taste();
  else if (command === 'push') { needsCanvas(); await push(requireConfig()); }
  else if (command === 'pull') { needsCanvas(); await pull(requireConfig()); }
  else if (command === 'watch') { needsCanvas(); await watch(requireConfig()); }
  else if (command === 'status') await status();
  else if (command === 'unlink') {
    const config = readConfig();
    if (config?.token) { try { await api(config, '/api/canvas/sync/unlink', {method: 'POST', body: {}}); } catch (error) { if (error.status !== 401) console.error(`Could not reach Seenry (${error.message}); forgetting the token here anyway. Unlink it on the Canvases page.`); } }
    rmSync(configFile(), {force: true}); rmSync(libraryKeyFile(), {force: true}); rmSync(pendingFile(), {force: true});
    console.log(config?.token ? 'Unlinked this machine.' : 'This machine was not linked.');
  } else { console.error('Usage: node sync.mjs link|library|taste|push|watch|pull|status|unlink [dir]'); process.exit(2); }
} catch (error) {
  console.error(error.message || String(error));
  process.exit(LIMITED.has(error.status) ? 3 : 1);
}
