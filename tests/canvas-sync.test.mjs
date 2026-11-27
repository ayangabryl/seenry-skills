// Canvas sync client against a local stand-in for the Seenry API: linking, pushing only changed files,
// pulling online feedback into the exact files `wait` and `feedback` read, and staying offline-safe. No browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, statSync, readdirSync, chmodSync} from 'node:fs';
import {join, resolve, delimiter} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';

const sync = resolve('skills/seenry-canvas/scripts/sync.mjs');
const canvas = resolve('skills/seenry-canvas/scripts/canvas.mjs');
const sha = data => createHash('sha256').update(data).digest('hex');
const page = (title, extra = '') => `<!doctype html><meta charset="utf-8"><title>${title}</title>${extra}<link rel="stylesheet" href="../tokens.css"><img src="../img/a.png"><p>${title}</p>`;

function run(script, args, {cwd, env = {}} = {}) {
  return new Promise(done => {
    const child = spawn(process.execPath, [script, ...args], {cwd, env: {...process.env, ...env}});
    let out = '', err = '';
    child.stdout.on('data', c => { out += c; }); child.stderr.on('data', c => { err += c; });
    child.on('close', status => done({status, out, err}));
  });
}

function project() {
  const root = mkdtempSync(join(tmpdir(), 'seenry-sync-'));
  const dir = join(root, '.seenry', 'canvas');
  mkdirSync(join(dir, '01-home.options'), {recursive: true}); mkdirSync(join(dir, '02-flow')); mkdirSync(join(dir, 'img')); mkdirSync(join(dir, 'refs')); mkdirSync(join(dir, '.renders'));
  writeFileSync(join(dir, 'canvas.json'), JSON.stringify({title: 'Kept', question: 'Pick a home'}));
  writeFileSync(join(dir, 'tokens.css'), ':root{--ink:#111}');
  writeFileSync(join(dir, 'img', 'a.png'), 'png');
  writeFileSync(join(dir, 'refs', 'private-reference.png'), 'reference stays local');
  writeFileSync(join(dir, '01-home.options', 'a-quiet.html'), page('Home · Quiet', '<meta name="seenry-axis" content="Calm">'));
  writeFileSync(join(dir, '01-home.options', 'b-ledger.phone.html'), page('Home · Ledger'));
  writeFileSync(join(dir, '02-flow', '01-start.html'), page('Start'));
  writeFileSync(join(dir, '.renders', '01-home__a-quiet.desktop.light.png'), 'rendered preview');
  const config = mkdtempSync(join(tmpdir(), 'seenry-sync-config-'));
  return {root, dir, config};
}

/** The protocol the Seenry worker speaks, kept in memory. */
async function fakeSeenry({feedback = [], pollSeconds = 0, limit = 0, pro = false, pollErrors = 0, never = false} = {}) {
  const state = {blobs: new Map(), pushes: [], uploads: [], acked: [], polls: 0, unlinked: false, feedback, feedbackChecks: 0, starts: [], redeems: []};
  const libraryKey = 'seenry_pro_' + 'k'.repeat(43), setupCode = 'seenry_setup_' + 's'.repeat(43);
  const token = 'seenry_canvas_' + 'x'.repeat(43);
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks), send = (status, data) => { res.writeHead(status, {'content-type': 'application/json'}); res.end(JSON.stringify(pollSeconds && status === 200 ? {...data, pollSeconds} : data)); };
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/canvas/link/start') state.starts.push({body: JSON.parse(body), authorization: req.headers.authorization || ''});
    if (url.pathname === '/api/canvas/link/start') return send(200, {deviceCode: 'd'.repeat(43), userCode: 'BCDF-GHJK', verificationUrl: 'http://seenry.test/canvases/link?code=BCDF-GHJK', expiresIn: 30, interval: 0});
    if (url.pathname === '/api/canvas/link/redeem') { const sent = JSON.parse(body); state.redeems.push({body: sent, authorization: req.headers.authorization || ''}); if (sent.code !== setupCode || state.redeems.length > 1) return send(410, {detail: 'This setup code was already used or has expired. Run link --start to link with a code you approve in the browser.'}); return send(200, {status: 'approved', token, machine: {id: 'm1', name: sent.name}, account: {email: 'me@example.com'}, ...(pro ? {library: {url: 'http://mcp.seenry.test/pro', key: libraryKey}} : {})}); }
    if (url.pathname === '/api/canvas/link/poll' && ++state.polls <= pollErrors) return send(500, {detail: 'The library is temporarily unavailable.'});
    if (url.pathname === '/api/canvas/link/poll') return never || state.polls - pollErrors < 2 ? send(200, {status: 'pending'}) : send(200, {status: 'approved', token, machine: {id: 'm1', name: 'Test Mac'}, account: {email: 'me@example.com'}, ...(pro && state.starts.at(-1)?.body.library ? {library: {url: 'http://mcp.seenry.test/pro', key: libraryKey}} : {})});
    if (req.headers.authorization !== 'Bearer ' + token || state.unlinked) return send(401, {detail: 'Link this machine first'});
    if (limit && url.pathname === '/api/canvas/sync/push') return send(limit, {detail: 'Free accounts sync one canvas. Upgrade to sync more.'});
    if (url.pathname === '/api/canvas/sync/push') {
      const data = JSON.parse(body); state.pushes.push(data);
      const missing = [...new Set([...data.files.map(f => f.hash), ...data.screens.filter(s => s.png).map(s => s.png.hash)])].filter(h => !state.blobs.has(h));
      return missing.length ? send(200, {status: 'upload', missing}) : send(200, {status: 'synced', canvasId: 'c1', url: 'http://seenry.test/canvases/c1', screens: data.screens.length});
    }
    if (url.pathname.startsWith('/api/canvas/sync/blobs/')) {
      const hash = url.pathname.split('/').pop();
      if (sha(body) !== hash) return send(400, {detail: 'hash mismatch'});
      state.blobs.set(hash, body); state.uploads.push(hash); return send(200, {hash, stored: true});
    }
    if (url.pathname === '/api/canvas/sync/feedback') state.feedbackChecks++;
    if (url.pathname === '/api/canvas/sync/feedback') return send(200, {canvasId: 'c1', events: state.feedback.filter(e => !state.acked.includes(e.id))});
    if (url.pathname === '/api/canvas/sync/feedback/ack') { state.acked.push(...JSON.parse(body).ids); return send(200, {acked: 1}); }
    if (url.pathname === '/api/canvas/sync/status') return send(200, {machine: {id: 'm1', name: 'Test Mac'}, account: {email: 'me@example.com'}, canvases: [...new Set(state.pushes.map(p => p.localKey))].map(localKey => ({id: 'c1', title: 'Kept', localKey, screens: 3, pending: 0, pushedAt: Date.now(), url: 'http://seenry.test/canvases/c1'}))});
    if (url.pathname === '/api/account/taste.md') { res.writeHead(200, {'content-type': 'text/markdown'}); return res.end('# Taste\n\n## What they chose\n\n- Light pages\n'); }
    if (url.pathname === '/api/canvas/sync/unlink') { state.unlinked = true; return send(200, {unlinked: true}); }
    send(404, {detail: 'nope'});
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return {state, libraryKey, setupCode, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r))};
}

async function linked(seenry, p) {
  const env = {SEENRY_CONFIG_DIR: p.config};
  const result = await run(sync, ['link', '--server', seenry.url, '--name', 'Test Mac', '--interval', '0.05'], {cwd: p.root, env});
  assert.equal(result.status, 0, result.err);
  return env;
}

test('link stores the token in the config folder with 0600 and never in the project', async () => {
  const seenry = await fakeSeenry(), p = project();
  try {
    const env = await linked(seenry, p);
    const file = join(p.config, 'canvas-sync.json');
    if (process.platform !== 'win32') assert.equal(statSync(file).mode & 0o777, 0o600, 'Windows has no POSIX modes; the file sits in the user profile');
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).token.startsWith('seenry_canvas_'), true);
    const walk = d => readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [readFileSync(join(d, e.name), 'utf8')]);
    assert.ok(!walk(p.root).some(text => text.includes('seenry_canvas_')));
    const inside = await run(sync, ['link', '--server', seenry.url, '--interval', '0.05'], {cwd: p.root, env: {SEENRY_CONFIG_DIR: join(p.root, 'config')}});
    assert.notEqual(inside.status, 0, 'refuses a config folder inside the project');
    assert.equal((await run(sync, ['status'], {cwd: p.root, env})).status, 0);
  } finally { await seenry.close(); }
});

test('push sends the screens canvas.mjs sees and uploads only files the server lacks', async () => {
  const seenry = await fakeSeenry(), p = project();
  try {
    const env = await linked(seenry, p);
    const first = await run(sync, ['push'], {cwd: p.root, env});
    assert.equal(first.status, 0, first.err);
    const sent = seenry.state.pushes.at(-1);
    const listed = JSON.parse((await run(canvas, ['list', '--json'], {cwd: p.root})).out);
    const ids = listed.sections.filter(s => !s.system).flatMap(s => s.frames.map(f => f.id)).filter(id => !id.startsWith('refs/'));
    assert.deepEqual(sent.screens.map(s => s.id).sort(), ids.sort(), 'same screen ids as the local canvas');
    assert.deepEqual(sent.state.sections.find(s => s.id === '01-home'), {id: '01-home', name: 'Home', choose: true, status: '', note: 'Options: pick one'});
    assert.equal(sent.screens.find(s => s.id === '01-home/b-ledger').device, 'phone');
    assert.equal(sent.screens.find(s => s.id === '01-home/a-quiet').meta.axis, 'Calm');
    assert.ok(sent.screens.find(s => s.id === '01-home/a-quiet').png, 'a fresh render goes up as the preview');
    assert.ok(!sent.files.some(f => /^(refs\/|canvas\.json|\.)/.test(f.path)), 'references, records and hidden files stay local');
    assert.equal(seenry.state.uploads.length, sent.files.length + 1);
    assert.equal(sent.title, 'Kept');
    const before = seenry.state.uploads.length;
    assert.equal((await run(sync, ['push'], {cwd: p.root, env})).status, 0);
    assert.equal(seenry.state.uploads.length, before, 'nothing changed, nothing uploaded');
    writeFileSync(join(p.dir, '02-flow', '01-start.html'), page('Start, revised'));
    assert.equal((await run(sync, ['push'], {cwd: p.root, env})).status, 0);
    assert.equal(seenry.state.uploads.length, before + 1, 'one changed file, one upload');
  } finally { await seenry.close(); }
});

test('pull writes online feedback where wait reads it, once', async () => {
  const event = {id: 'e1', source: 'owner', author: '', at: new Date().toISOString(), payload: {stage: 'mockup', picks: {'01-home': '01-home/a-quiet'}, frames: [{id: '02-flow/01-start', status: 'approved'}], notes: [{frame: '01-home/a-quiet', target: 'the hero', selector: '', text: 'Bigger number'}], riff: [], general: 'Ship it'}};
  const guest = {id: 'e2', source: 'share', author: 'Maya', at: new Date().toISOString(), payload: {stage: 'mockup', picks: {}, frames: [], notes: [{frame: '01-home/b-ledger', target: 'comment from Maya', selector: '', text: 'Love it'}], riff: [], general: ''}};
  const seenry = await fakeSeenry({feedback: [event, guest]}), p = project();
  try {
    const env = await linked(seenry, p);
    assert.equal((await run(sync, ['push'], {cwd: p.root, env})).status, 0);
    const waiting = run(canvas, ['wait', '--timeout', '20'], {cwd: p.root});
    await new Promise(r => setTimeout(r, 1200));
    const pulled = await run(sync, ['pull'], {cwd: p.root, env});
    assert.equal(pulled.status, 0, pulled.err);
    const waited = await waiting;
    assert.equal(waited.status, 0, waited.out + waited.err);
    assert.match(waited.out, /Picked in 01-home: 01-home\/a-quiet/);
    assert.match(waited.out, /Approved: 02-flow\/01-start/);
    assert.match(waited.out, /1\. 01-home\/a-quiet the hero: Bigger number/);
    assert.match(waited.out, /2\. 01-home\/b-ledger comment from Maya: Love it/);
    assert.match(waited.out, /General: Ship it/);
    const saved = JSON.parse(readFileSync(join(p.dir, 'feedback.json'), 'utf8'));
    assert.deepEqual(Object.keys(saved), ['stage', 'picks', 'frames', 'notes', 'riff', 'general', 'at']);
    assert.equal(JSON.parse(readFileSync(join(p.dir, 'review.json'), 'utf8')).frames['02-flow/01-start'].status, 'approved');
    assert.match(readFileSync(join(p.dir, 'FEEDBACK.md'), 'utf8'), /^# Canvas feedback\n\nPicked in 01-home/);
    assert.equal(readdirSync(join(p.dir, '.history')).filter(f => f.endsWith('.json')).length, 1);
    assert.deepEqual(seenry.state.acked, ['e1', 'e2']);
    const again = await run(sync, ['pull'], {cwd: p.root, env});
    assert.match(again.out, /No feedback waiting online/);
    const feedback = await run(canvas, ['feedback'], {cwd: p.root});
    assert.equal(feedback.status, 0);
  } finally { await seenry.close(); }
});

test('offline: push and pull fail cleanly and never touch the canvas; unlink forgets the token', async () => {
  const seenry = await fakeSeenry(), p = project();
  const env = await linked(seenry, p);
  await seenry.close();
  const before = readdirSync(p.dir).sort();
  const pushed = await run(sync, ['push'], {cwd: p.root, env});
  assert.equal(pushed.status, 1);
  assert.ok(pushed.err.trim().length > 0);
  assert.equal((await run(sync, ['pull'], {cwd: p.root, env})).status, 1);
  assert.deepEqual(readdirSync(p.dir).sort(), before);
  assert.ok(!existsSync(join(p.dir, 'feedback.json')));
  const unlinked = await run(sync, ['unlink'], {cwd: p.root, env});
  assert.equal(unlinked.status, 0);
  assert.ok(!existsSync(join(p.config, 'canvas-sync.json')));
  assert.equal((await run(sync, ['push'], {cwd: p.root, env})).status, 2, 'push asks to link first');
});

test('open starts the watch on a linked machine, Share returns the Seenry link, and stop ends both', async () => {
  const seenry = await fakeSeenry(), p = project();
  const port = String(5800 + Math.floor(Math.random() * 90)), clean = {CI: '', T3CODE_THREAD_ID: 'x', CODEX_THREAD_ID: '', CLAUDE_CODE_REMOTE: '', CONDUCTOR_IS_LOCAL: ''};
  try {
    const unlinked = {SEENRY_CONFIG_DIR: mkdtempSync(join(tmpdir(), 'seenry-sync-none-')), ...clean};
    let opened = await run(canvas, ['open', p.dir, '--port', port], {cwd: p.root, env: unlinked});
    assert.equal(opened.status, 0, opened.err);
    assert.doesNotMatch(opened.out, /sync\.mjs watch/);
    const at = Number(opened.out.match(/127\.0\.0\.1:(\d+)/)[1]);
    const share = async () => (await fetch(`http://127.0.0.1:${at}/share`, {method: 'POST'})).json();
    const state = async () => (await (await fetch(`http://127.0.0.1:${at}/state`)).json()).sync;
    assert.deepEqual(await share(), {linked: false, available: true});
    assert.equal((await state()).linked, false);
    await run(canvas, ['stop', p.dir], {cwd: p.root, env: unlinked});

    const env = {...await linked(seenry, p), ...clean};
    opened = await run(canvas, ['open', p.dir, '--port', port], {cwd: p.root, env});
    assert.equal(opened.status, 0, opened.err);
    assert.match(opened.out, /started sync\.mjs watch/);
    const record = JSON.parse(readFileSync(join(p.dir, '.sync.json'), 'utf8'));
    process.kill(record.pid, 0);
    for (let i = 0; i < 60 && !seenry.state.pushes.length; i++) await new Promise(r => setTimeout(r, 100));
    assert.ok(seenry.state.pushes.length, 'the watch pushed without an extra step');
    const now = await state();
    assert.deepEqual([now.linked, now.watching, 'token' in now], [true, true, false], 'the page learns the link, never the token');
    assert.deepEqual(await share(), {linked: true, url: 'http://seenry.test/canvases/c1'});
    const again = await run(canvas, ['open', p.dir, '--port', port], {cwd: p.root, env});
    assert.match(again.out, /Syncing to Seenry/);
    const stopped = await run(canvas, ['stop', p.dir], {cwd: p.root, env});
    assert.match(stopped.out, /Stopped syncing to Seenry/);
    const alive = () => { try { process.kill(record.pid, 0); return true; } catch { return false; } };
    for (let i = 0; i < 40 && alive(); i++) await new Promise(r => setTimeout(r, 50));
    assert.equal(alive(), false, 'the watch stopped with the canvas');
    assert.ok(!existsSync(join(p.dir, '.sync.json')));
  } finally { await run(canvas, ['stop', p.dir], {cwd: p.root}); await seenry.close(); }
});

test('watch never asks for feedback faster than the plan allows, and stops on a plan limit with its message', async () => {
  const slow = await fakeSeenry({pollSeconds: 2}), p = project();
  try {
    const env = await linked(slow, p);
    const child = spawn(process.execPath, [sync, 'watch', '--pull-every', '100', '--debounce', '0'], {cwd: p.root, env: {...process.env, ...env}});
    await new Promise(r => setTimeout(r, 3500));
    child.kill();
    assert.ok(slow.state.pushes.length >= 1);
    assert.ok(slow.state.feedbackChecks >= 1 && slow.state.feedbackChecks <= 2, `${slow.state.feedbackChecks} checks in 3.5 s with pollSeconds 2`);
  } finally { await slow.close(); }
  const limited = await fakeSeenry({limit: 402}), q = project();
  try {
    const env = await linked(limited, q);
    const pushed = await run(sync, ['push'], {cwd: q.root, env});
    assert.equal(pushed.status, 3);
    assert.match(pushed.err, /Free accounts sync one canvas/);
    const started = Date.now(), watched = await run(sync, ['watch', '--debounce', '0'], {cwd: q.root, env});
    assert.equal(watched.status, 3, 'the watch stops instead of retrying');
    assert.ok(Date.now() - started < 5000);
    assert.match(watched.err, /Sync stopped: Free accounts sync one canvas/);
    assert.ok(!existsSync(join(q.dir, '.sync.json')), 'the canvas no longer says Synced to Seenry');
  } finally { await limited.close(); }
});

const allText = d => readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? allText(join(d, e.name)) : [readFileSync(join(d, e.name), 'utf8')]);

test('link asks for the library, outlasts a server error while it waits, and keeps the key out of sight', async () => {
  const seenry = await fakeSeenry({pro: true, pollErrors: 2}), p = project();
  try {
    const env = {SEENRY_CONFIG_DIR: p.config};
    const first = await run(sync, ['link', '--server', seenry.url, '--name', 'Test Mac', '--interval', '0.05'], {cwd: p.root, env});
    assert.equal(first.status, 0, first.err);
    assert.equal(seenry.state.starts[0].body.library, true);
    assert.equal(seenry.state.starts[0].authorization, '', 'a first link has no machine to replace');
    const keyFile = join(p.config, 'canvas-library-key');
    assert.equal(readFileSync(keyFile, 'utf8').trim(), seenry.libraryKey);
    if (process.platform !== 'win32') assert.equal(statSync(keyFile).mode & 0o777, 0o600);
    assert.equal(JSON.parse(readFileSync(join(p.config, 'canvas-sync.json'), 'utf8')).library.url, 'http://mcp.seenry.test/pro');
    assert.ok(!(first.out + first.err).includes(seenry.libraryKey), 'the key is never printed');
    assert.ok(!allText(p.root).some(text => text.includes(seenry.libraryKey)), 'nor written into the project');
    assert.match(first.out, /reference library is ready/i);

    // Linking again from the same computer names the machine it replaces.
    seenry.state.polls = 0;
    const again = await run(sync, ['link', '--server', seenry.url, '--interval', '0.05', '--no-library'], {cwd: p.root, env});
    assert.equal(again.status, 0, again.err);
    assert.match(seenry.state.starts[1].authorization, /^Bearer seenry_canvas_/);
    assert.equal(seenry.state.starts[1].body.library, undefined);
    assert.ok(!existsSync(keyFile), 'a link without the library leaves no stale key behind');
  } finally { await seenry.close(); }
});

test('link --start returns at once with the link and code, and --finish completes it', async () => {
  const seenry = await fakeSeenry(), waiting = await fakeSeenry({never: true}), p = project(), q = project();
  try {
    const env = {SEENRY_CONFIG_DIR: p.config};
    const begun = await run(sync, ['link', '--start', '--server', seenry.url, '--name', 'Test Mac', '--interval', '0.05'], {cwd: p.root, env});
    assert.equal(begun.status, 0, begun.err);
    assert.match(begun.out, /canvases\/link\?code=BCDF-GHJK[\s\S]*link --finish/);
    assert.equal(seenry.state.polls, 0, 'nothing waits for the approval');
    assert.ok(!existsSync(join(p.config, 'canvas-sync.json')));
    const pendingFile = join(p.config, 'canvas-link-pending.json');
    if (process.platform !== 'win32') assert.equal(statSync(pendingFile).mode & 0o777, 0o600);
    const done = await run(sync, ['link', '--finish'], {cwd: p.root, env});
    assert.equal(done.status, 0, done.err);
    assert.match(done.out, /Linked Test Mac to me@example\.com/);
    assert.ok(!existsSync(pendingFile));
    assert.equal((await run(sync, ['link', '--finish'], {cwd: p.root, env})).status, 2, 'nothing left to finish');

    // Not approved inside the wait: it says so, repeats the link, and can be run again.
    const slow = {SEENRY_CONFIG_DIR: q.config};
    assert.equal((await run(sync, ['link', '--start', '--server', waiting.url, '--interval', '0.05'], {cwd: q.root, env: slow})).status, 0);
    const still = await run(sync, ['link', '--finish', '--wait', '0.3'], {cwd: q.root, env: slow});
    assert.equal(still.status, 4);
    assert.match(still.out, /Not approved yet[\s\S]*BCDF-GHJK/);
    assert.ok(existsSync(join(q.config, 'canvas-link-pending.json')), 'the same code can still be approved');
  } finally { await seenry.close(); await waiting.close(); }
});

test('library adds the server to Claude Code itself and says how to add it to an agent it cannot find', async () => {
  const seenry = await fakeSeenry({pro: true}), p = project();
  try {
    // A stand-in for the claude command that records what it was asked to do.
    const bin = mkdtempSync(join(tmpdir(), 'seenry-bin-')), log = join(bin, 'calls.txt');
    writeFileSync(join(bin, 'claude'), `#!/bin/sh\necho "$@" >> "${log}"\n[ "$2" = "get" ] && exit 1\nexit 0\n`); chmodSync(join(bin, 'claude'), 0o755);
    // A fake home folder: library writes agents' own config files, and must never reach the real ones.
    const home = mkdtempSync(join(tmpdir(), 'seenry-home-'));
    const env = {SEENRY_CONFIG_DIR: p.config, PATH: bin + delimiter + process.env.PATH, HOME: home, USERPROFILE: home, CODEX_HOME: '', COPILOT_HOME: ''};
    assert.equal((await run(sync, ['library', '--agent', 'claude-code'], {cwd: p.root, env})).status, 2, 'asks to link first');
    assert.equal((await run(sync, ['link', '--server', seenry.url, '--interval', '0.05'], {cwd: p.root, env})).status, 0);
    if (process.platform !== 'win32') {
      const added = await run(sync, ['library', '--agent', 'claude-code'], {cwd: p.root, env});
      assert.equal(added.status, 0, added.err);
      assert.match(added.out, /Claude Code: added for every project/);
      assert.ok(!(added.out + added.err).includes(seenry.libraryKey));
      assert.match(readFileSync(log, 'utf8'), new RegExp(`mcp add --transport http --scope user seenry http://mcp\\.seenry\\.test/pro --header Authorization: Bearer ${seenry.libraryKey}`));
    }
    const told = await run(sync, ['library', '--agent', 'codex'], {cwd: p.root, env});
    assert.equal(told.status, 0);
    assert.ok(told.out.includes(join(p.config, 'canvas-library-key')));
    assert.match(told.out, /Codex: could not: it was not found on this computer\. By hand: add \[mcp_servers\.seenry\] with url = "http:\/\/mcp\.seenry\.test\/pro"/);
    assert.ok(!told.out.includes(seenry.libraryKey), 'the key itself is never printed');

    const taste = await run(sync, ['taste'], {cwd: p.root, env});
    assert.equal(taste.status, 0, taste.err);
    assert.match(taste.out, /## What they chose\n\n- Light pages/);

    assert.equal((await run(sync, ['unlink'], {cwd: p.root, env})).status, 0);
    assert.ok(!existsSync(join(p.config, 'canvas-library-key')), 'unlink forgets the key here');
    assert.match((await run(sync, ['taste'], {cwd: p.root, env})).out, /not linked/);
  } finally { await seenry.close(); }
});

test('link --code links at once with the setup code from the prompt, and says what to do when it is spent', async () => {
  const seenry = await fakeSeenry({pro: true}), p = project(), q = project();
  try {
    const env = {SEENRY_CONFIG_DIR: p.config};
    const done = await run(sync, ['link', '--code', seenry.setupCode, '--server', seenry.url, '--name', 'Prompt Mac'], {cwd: p.root, env});
    assert.equal(done.status, 0, done.err);
    assert.match(done.out, /Linked Prompt Mac to me@example\.com/);
    assert.equal(seenry.state.polls, 0, 'nothing to approve, nothing to wait for');
    assert.deepEqual(seenry.state.redeems[0].body, {code: seenry.setupCode, name: 'Prompt Mac', agent: seenry.state.redeems[0].body.agent});
    assert.equal(readFileSync(join(p.config, 'canvas-library-key'), 'utf8').trim(), seenry.libraryKey);
    assert.ok(!(done.out + done.err).includes(seenry.libraryKey) && !(done.out + done.err).includes(seenry.setupCode), 'neither the key nor the code is printed');
    assert.ok(!allText(p.root).some(text => text.includes(seenry.setupCode)), 'the code is not written into the project');

    const spent = await run(sync, ['link', '--code', seenry.setupCode, '--server', seenry.url], {cwd: q.root, env: {SEENRY_CONFIG_DIR: q.config}});
    assert.equal(spent.status, 1);
    assert.match(spent.err, /already used or has expired[\s\S]*link --start/);
    assert.ok(!existsSync(join(q.config, 'canvas-sync.json')));
  } finally { await seenry.close(); }
});
