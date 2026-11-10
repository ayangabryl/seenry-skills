// The Seenry canvas: folder layout, live server, feedback round trip and the server's safety checks. No browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, utimesSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn, spawnSync} from 'node:child_process';
import {request} from 'node:http';

const script = resolve('skills/seenry-canvas/scripts/canvas.mjs');
const run = (...args) => spawnSync(process.execPath, [script, ...args], {encoding: 'utf8'});
const page = (title, note = '') => `<!doctype html><meta charset="utf-8"><title>${title}</title><meta name="seenry-note" content="${note}"><link rel="stylesheet" href="../wire.css"><p>${title}</p>`;

function project() {
  const root = mkdtempSync(join(tmpdir(), 'seenry-canvas-'));
  const dir = join(root, '.seenry', 'canvas');
  assert.equal(run('init', dir).status, 0);
  mkdirSync(join(dir, '01-onboarding')); mkdirSync(join(dir, '02-home.options'));
  writeFileSync(join(dir, '01-onboarding', '01-welcome.phone.html'), page('Welcome', 'One promise') + '<a href="02-first-habit.phone.html">Start</a><a href="../02-home.options/b.html#top">Skip</a><a href="https://example.com/x.html">Out</a><a href="../../../outside.html">Up</a>');
  writeFileSync(join(dir, '01-onboarding', '02-first-habit.phone.html'), page('First habit'));
  writeFileSync(join(dir, '02-home.options', 'a.phone.html'), page('A &amp; list'));
  writeFileSync(join(dir, '02-home.options', 'b.html'), page('B'));
  writeFileSync(join(dir, 'secret.txt'), 'inside the folder');
  writeFileSync(join(root, 'outside.txt'), 'outside the folder');
  return {root, dir};
}

function call(port, path, {method = 'GET', headers = {}, body} = {}) {
  return new Promise((done, fail) => {
    const req = request({host: '127.0.0.1', port, path, method, headers}, res => {
      let data = ''; res.on('data', c => { data += c; }); res.on('end', () => done({status: res.statusCode, body: data}));
    });
    req.on('error', fail); if (body) req.write(body); req.end();
  });
}

test('init makes a self-ignoring work folder with the kits', () => {
  const {root, dir} = project();
  assert.equal(readFileSync(join(root, '.seenry', '.gitignore'), 'utf8'), '*\n');
  assert.ok(existsSync(join(dir, 'wire.css')) && existsSync(join(dir, 'tokens.css')) && existsSync(join(dir, 'refs')));
});

test('list reads sections, options, devices and titles from the folder', () => {
  const {dir} = project();
  const out = run('list', dir).stdout;
  assert.match(out, /Onboarding\n  01-onboarding\/01-welcome  phone 390×844  "Welcome"/);
  assert.match(out, /Home \(options: pick one\)/);
  assert.match(out, /02-home\/a  phone 390×844  "A & list"/);
  assert.match(out, /02-home\/b  desktop 1440×900/);
});

test('the server serves the canvas, guards the folder and saves feedback', async t => {
  const {root, dir} = project();
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await new Promise(done => server.stdout.on('data', d => { if (String(d).includes('Seenry canvas')) done(); }));
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;

  assert.equal((await call(actual, '/')).status, 200);
  const state = JSON.parse((await call(actual, '/state')).body);
  assert.deepEqual(state.sections.map(s => [s.id, s.choose, s.frames.length]), [['cover', undefined, 1], ['foundations', false, 1], ['01-onboarding', false, 2], ['02-home', true, 2]]);
  assert.equal(state.sections[2].frames[0].note, 'One promise');
  assert.equal((await call(actual, '/01-onboarding/01-welcome.phone.html')).status, 200);
  assert.equal((await call(actual, '/secret.txt')).status, 200);

  assert.equal((await call(actual, '/%2e%2e/%2e%2e/outside.txt')).status, 404);
  assert.equal((await call(actual, '/.canvas.json')).status, 404);
  assert.equal((await call(actual, '/', {headers: {host: 'evil.example'}})).status, 403);
  assert.equal((await call(actual, '/feedback', {method: 'POST', headers: {origin: 'http://evil.example', 'content-type': 'application/json'}, body: '{}'})).status, 403);
  assert.equal((await call(actual, '/feedback', {method: 'POST', body: 'not json'})).status, 400);

  const feedback = {stage: 'wireframe', picks: {'02-home': '02-home/b'}, frames: [{id: '01-onboarding/01-welcome', status: 'approved'}],
    notes: [{frame: '01-onboarding/02-first-habit', target: '“First habit”', selector: 'p', text: 'Ask for the target first'}], general: 'Calm'};
  assert.equal((await call(actual, '/feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(feedback)})).status, 200);

  const out = run('feedback', dir);
  assert.equal(out.status, 0);
  assert.match(out.stdout, /Picked in 02-home: 02-home\/b/);
  assert.match(out.stdout, /Approved: 01-onboarding\/01-welcome/);
  assert.match(out.stdout, /1\. 01-onboarding\/02-first-habit “First habit” \[p\]: Ask for the target first/);
  assert.match(out.stdout, /General: Calm/);
  assert.doesNotMatch(out.stdout, /No answer on/);

  // A screen changed after the feedback makes the feedback stale.
  const later = new Date(Date.now() + 5000);
  utimesSync(join(dir, '01-onboarding', '01-welcome.phone.html'), later, later);
  assert.equal(run('feedback', dir).status, 3);
});

test('static writes a canvas that opens from disk with the state inlined', () => {
  const {dir} = project();
  assert.equal(run('static', dir).status, 0);
  const html = readFileSync(join(dir, 'canvas.html'), 'utf8');
  assert.match(html, /const EMBEDDED = \{"title"/);
  assert.equal(html.match(/<\/script>/g).length, 1, 'inlined state never closes the script early');
});

test('links between screens become prototype connections', () => {
  const {dir} = project();
  const out = run('list', dir).stdout;
  assert.match(out, /"Welcome"  → 01-onboarding\/02-first-habit, 02-home\/b\n/);
});

test('wait returns the feedback the moment the person sends it', async t => {
  const {dir} = project();
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(5300 + Math.floor(Math.random() * 300))], {stdio: 'pipe'});
  t.after(() => server.kill());
  await new Promise(done => server.stdout.on('data', d => { if (String(d).includes('Seenry canvas')) done(); }));
  const port = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const waiter = spawn(process.execPath, [script, 'wait', dir, '--timeout', '20'], {stdio: 'pipe'});
  let out = ''; waiter.stdout.on('data', d => { out += d; });
  await new Promise(done => { const tick = () => existsSync(join(dir, '.waiting.json')) ? done() : setTimeout(tick, 50); tick(); });
  assert.equal(JSON.parse((await call(port, '/state')).body).agentWaiting, true);
  await call(port, '/feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({picks: {'02-home': '02-home/a'}})});
  const code = await new Promise(done => waiter.on('exit', done));
  assert.equal(code, 0);
  assert.match(out, /Picked in 02-home: 02-home\/a/);
  assert.match(readFileSync(join(dir, 'FEEDBACK.md'), 'utf8'), /Picked in 02-home: 02-home\/a/);
  assert.equal(existsSync(join(dir, '.waiting.json')), false);
});

test('Foundations is generated from tokens.css and listed first', () => {
  const {dir} = project();
  assert.ok(existsSync(join(dir, '_foundations.html')));
  assert.match(readFileSync(join(dir, 'tokens.css'), 'utf8'), /:root\[data-theme="dark"\]/);
  assert.match(run('list', dir).stdout, /^Cover\n  cover  cover  "Cover"\nFoundations\n  foundations  desktop/);
});

test('check flags values typed into screens instead of taken from tokens.css', () => {
  const {dir} = project();
  writeFileSync(join(dir, 'canvas.json'), JSON.stringify({stage: 'mockup'}));
  writeFileSync(join(dir, '01-onboarding', '01-welcome.phone.html'), '<!doctype html><title>Welcome</title><link rel="stylesheet" href="../tokens.css"><style>p{color:var(--color-text);padding:var(--space-4) 18px;--local:3px}</style><p style="background:#eef2ff;border-radius:var(--radius-md)">x</p>');
  writeFileSync(join(dir, '01-onboarding', '02-first-habit.phone.html'), '<!doctype html><title>First habit</title><link rel="stylesheet" href="../tokens.css"><style>p{color:var(--color-text);gap:var(--space-2)}</style><p>x</p>');
  const out = run('check', dir);
  assert.equal(out.status, 1);
  assert.match(out.stdout, /01-onboarding\/01-welcome\n  2 detached values: padding: var\(--space-4\) 18px · background: #eef2ff/);
  assert.doesNotMatch(out.stdout, /02-first-habit/);
  assert.match(out.stdout, /02-home\/a\n  does not link tokens.css/);
});

test('status, log and resolve keep the file organized', () => {
  const {dir} = project();
  writeFileSync(join(dir, '01-onboarding', '02-first-habit.phone.html'), page('First habit') + '<a href="../02-home.options/a.phone.html">Done</a>');
  assert.equal(run('status', '01-onboarding', 'review', dir).status, 0);
  assert.equal(run('status', '01-onboarding', 'shipped', dir).status, 2);
  assert.equal(run('log', 'Shorter welcome headline', dir).status, 0);
  assert.equal(run('resolve', '02-home', dir).status, 3, 'no pick yet');
  const out = run('resolve', '02-home', '--pick', '02-home/b', dir);
  assert.equal(out.status, 0, out.stderr);
  const manifest = JSON.parse(readFileSync(join(dir, 'canvas.json'), 'utf8'));
  assert.equal(manifest.sections['01-onboarding'].status, 'review');
  assert.equal(manifest.log[0].text, 'Shorter welcome headline');
  assert.match(manifest.archive['archive/02-home/a'].reason, /Not picked: B was chosen/);
  assert.ok(existsSync(join(dir, '02-home', 'b.html')) && existsSync(join(dir, 'archive', '02-home', 'a.phone.html')) && !existsSync(join(dir, '02-home.options')));
  assert.match(readFileSync(join(dir, '01-onboarding', '02-first-habit.phone.html'), 'utf8'), /href="\.\.\/02-home\/b\.html"/);
  const list = run('list', dir).stdout;
  assert.match(list, /Home\n  02-home\/b /);
  assert.match(list, /Archive\n  archive\/02-home\/a /);
});

test('handoff collects screens, flows, specs and decisions', () => {
  const {dir} = project();
  writeFileSync(join(dir, '01-onboarding', '01-welcome.phone.html'), page('Welcome') + '<button id="go" data-spec="Tap: opens the habit sheet">Start</button>');
  run('archive', '02-home/a', '--reason', 'Too busy', dir);
  assert.equal(run('handoff', dir).status, 0);
  const doc = readFileSync(join(dir, 'HANDOFF.md'), 'utf8');
  assert.match(doc, /## Flows\n\n- Onboarding: starts at 01-onboarding\/01-welcome/);
  assert.match(doc, /- Welcome · `button#go` “Start”: Tap: opens the habit sheet/);
  assert.match(doc, /- archive\/02-home\/a: Too busy/);
});

test('a shared library is served under library/ and listed read-only', async t => {
  const {root, dir} = project();
  const lib = join(root, 'system');
  assert.equal(run('init', lib).status, 0);
  mkdirSync(join(lib, '00-components')); writeFileSync(join(lib, '00-components', 'button.html'), page('Button'));
  const app = join(root, 'app');
  assert.equal(run('init', app, '--library', lib).status, 0);
  assert.equal(existsSync(join(app, 'tokens.css')), false, 'the library holds the tokens');
  const list = run('list', app).stdout;
  assert.match(list, /Library · Foundations\n  library\/foundations/);
  assert.match(list, /Library · Components\n  library\/00-components\/button/);
  const server = spawn(process.execPath, [script, 'serve', app, '--port', String(5700 + Math.floor(Math.random() * 200))], {stdio: 'pipe'});
  t.after(() => server.kill());
  await new Promise(done => server.stdout.on('data', d => { if (String(d).includes('Seenry canvas')) done(); }));
  const port = JSON.parse(readFileSync(join(app, '.canvas.json'), 'utf8')).port;
  assert.equal((await call(port, '/library/tokens.css')).status, 200);
  assert.equal((await call(port, '/library/%2e%2e/app/canvas.json')).status, 404);
  assert.equal((await call(port, '/library/.gitignore')).status, 404);
});

test('options carry their labels, and round resolves picks but keeps riffed sections open', async t => {
  const {dir} = project();
  writeFileSync(join(dir, '02-home.options', 'a.phone.html'), page('Quiet') + '<meta name="seenry-risk" content="safe"><meta name="seenry-axis" content="A plain list"><meta name="seenry-wins" content="Daily use"><meta name="seenry-cost" content="Forgettable"><meta name="seenry-ask" content="Is it calm?|Would you open it daily?">');
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(5900 + Math.floor(Math.random() * 90))], {stdio: 'pipe'});
  t.after(() => server.kill());
  await new Promise(done => server.stdout.on('data', d => { if (String(d).includes('Seenry canvas')) done(); }));
  const port = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const state = JSON.parse((await call(port, '/state')).body), quiet = state.sections.find(s => s.id === '02-home').frames.find(f => f.id === '02-home/a');
  assert.deepEqual([quiet.risk, quiet.axis, quiet.wins, quiet.cost, quiet.ask], ['safe', 'A plain list', 'Daily use', 'Forgettable', ['Is it calm?', 'Would you open it daily?']]);
  await call(port, '/feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({riff: [{section: '02-home', frame: '02-home/b'}], frames: [{id: '01-onboarding/01-welcome', status: 'approved'}, {id: '01-onboarding/02-first-habit', status: 'approved'}]})});
  assert.match(run('feedback', dir).stdout, /More like this in 02-home: 02-home\/b/);
  const out = run('round', 'Riffing on B', dir);
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /01-onboarding: Ready for dev \(2 of 2 approved\)/);
  assert.match(out.stdout, /02-home: Ready for review \(options still open\)/);
  assert.ok(existsSync(join(dir, '02-home.options')), 'a riffed section is not resolved');
});
