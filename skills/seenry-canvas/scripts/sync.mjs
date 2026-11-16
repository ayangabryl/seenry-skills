#!/usr/bin/env node
/**
 * Seenry canvas sync: mirror a local canvas to your Seenry account and bring online feedback back.
 *
 *  node sync.mjs link   [--server url] [--name "Studio iMac"]   link this machine (prints a code to approve in the browser)
 *  node sync.mjs push   [dir]            push the canvas once (only files whose content changed are uploaded)
 *  node sync.mjs watch  [dir]            push on every change and pull feedback as it arrives, until stopped
 *  node sync.mjs pull   [dir]            write feedback sent online into the canvas, exactly as Send to agent does
 *  node sync.mjs status [dir]            show the link, this canvas online and feedback waiting to be pulled
 *  node sync.mjs unlink                  forget this machine here and on the server
 *
 * watch asks for feedback no more often than the server's pollSeconds (10 s by default) and stops on a plan limit (402).
 * The canvas folder defaults to .seenry/canvas. The token lives in your config folder (mode 0600), never in the
 * project. The local canvas never depends on the server: when it is unreachable, sync waits and tries again.
 * Plain Node 18+, no packages.
 */
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, chmodSync, rmSync, realpathSync, openSync, readSync, closeSync} from 'node:fs';
import {join, resolve, extname, basename, dirname, relative, sep} from 'node:path';
import {homedir, hostname} from 'node:os';

const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'status';
const flag = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback; };
const positional = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--') && !['--json', '--once'].includes(all[i - 1])));
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
function writeConfig(config) {
  const folder = configDir();
  const project = resolve(dir, '..', '..');
  if (isInside(folder, dir) || (real(project) !== real(homedir()) && isInside(folder, project))) throw new Error(`Refusing to keep the token inside a project (${folder}). Set SEENRY_CONFIG_DIR to a folder in your home directory.`);
  mkdirSync(folder, {recursive: true, mode: 0o700});
  writeFileSync(configFile(), JSON.stringify(config, null, 2) + '\n', {mode: 0o600});
  chmodSync(configFile(), 0o600);
}
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
function feedbackLines(feedback, sections) {
  const lines = [];
  for (const [section, id] of Object.entries(feedback.picks || {})) lines.push(`Picked in ${section}: ${id}`);
  for (const r of feedback.riff || []) lines.push(`More like this in ${r.section}: ${r.frame}. Make a new round of options around it; do not resolve the section yet.`);
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
async function link() {
  const server = String(flag('server', process.env.SEENRY_SERVER || readConfig()?.server || 'https://seenry.design')).replace(/\/+$/, '');
  const name = flag('name', hostname().replace(/\.local$/, '')), agent = flag('agent', agentName());
  const start = await fetch(server + '/api/canvas/link/start', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({name, agent})});
  const begun = await start.json().catch(() => null);
  if (!start.ok) throw new Error(begun?.detail || `Seenry answered ${start.status}`);
  console.log(`To link ${name}, open\n  ${begun.verificationUrl}\nand confirm the code ${begun.userCode}. Waiting…`);
  const deadline = Date.now() + begun.expiresIn * 1000;
  while (Date.now() < deadline) {
    await wait((Number(flag('interval', begun.interval)) || 3) * 1000);
    const response = await fetch(server + '/api/canvas/link/poll', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({deviceCode: begun.deviceCode})});
    const data = await response.json().catch(() => null);
    if (response.ok && data?.status === 'pending') continue;
    if (!response.ok) throw new Error(data?.detail || `Seenry answered ${response.status}`);
    writeConfig({server, token: data.token, machine: data.machine, account: data.account, linkedAt: new Date().toISOString()});
    console.log(`Linked ${data.machine.name} to ${data.account.email}. The token is in ${configFile()} (readable only by you).`);
    return;
  }
  throw new Error('The code expired before it was approved. Run link again.');
}

async function status() {
  const config = readConfig();
  if (!config?.token) { console.log('Not linked. Run: node sync.mjs link'); return; }
  const data = await api(config, '/api/canvas/sync/status');
  const key = existsSync(dir) ? localKey() : null, here = data.canvases.find(c => c.localKey === key);
  if (json) { console.log(JSON.stringify({...data, server: config.server, canvas: here || null}, null, 2)); return; }
  console.log(`Linked as ${data.machine.name} to ${data.account.email} on ${config.server}`);
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
  else if (command === 'push') { needsCanvas(); await push(requireConfig()); }
  else if (command === 'pull') { needsCanvas(); await pull(requireConfig()); }
  else if (command === 'watch') { needsCanvas(); await watch(requireConfig()); }
  else if (command === 'status') await status();
  else if (command === 'unlink') {
    const config = readConfig();
    if (config?.token) { try { await api(config, '/api/canvas/sync/unlink', {method: 'POST', body: {}}); } catch (error) { if (error.status !== 401) console.error(`Could not reach Seenry (${error.message}); forgetting the token here anyway. Unlink it on the Canvases page.`); } }
    rmSync(configFile(), {force: true});
    console.log(config?.token ? 'Unlinked this machine.' : 'This machine was not linked.');
  } else { console.error('Usage: node sync.mjs link|push|watch|pull|status|unlink [dir]'); process.exit(2); }
} catch (error) {
  console.error(error.message || String(error));
  process.exit(LIMITED.has(error.status) ? 3 : 1);
}
