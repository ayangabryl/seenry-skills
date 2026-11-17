// The Seenry canvas: folder layout, live server, feedback round trip and the server's safety checks. No browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, utimesSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn, spawnSync} from 'node:child_process';
import {request} from 'node:http';

const script = resolve('skills/seenry-canvas/scripts/canvas.mjs');
// A machine linked to Seenry must not start a real sync from these tests.
process.env.SEENRY_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'seenry-no-link-'));
const run = (...args) => spawnSync(process.execPath, [script, ...args], {encoding: 'utf8'});
const page = (title, note = '') => `<!doctype html><meta charset="utf-8"><title>${title}</title><meta name="seenry-note" content="${note}"><link rel="stylesheet" href="../wire.css"><p>${title}</p>`;

/** Resolves when the canvas server is listening; fails with its output when it exits first. */
function started(server) {
  return new Promise((done, fail) => {
    let err = '';
    server.stderr?.on('data', d => { err += d; });
    server.stdout.on('data', d => { if (String(d).includes('Seenry canvas')) done(); });
    server.on('exit', code => fail(new Error(`The canvas server exited (${code}) before listening: ${err.trim()}`)));
  });
}

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
  await started(server);
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
  await started(server);
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

test('identity studies are candidates set by hand, so check skips them and list shows them first', () => {
  const {dir} = project();
  writeFileSync(join(dir, 'canvas.json'), JSON.stringify({stage: 'mockup'}));
  mkdirSync(join(dir, '00-identity'));
  writeFileSync(join(dir, '00-identity', '01-geist.html'), '<!doctype html><title>Type · Geist</title><style>h1{font:700 160px/0.9 "Geist";color:#141210}</style><h1>Real headline</h1>');
  const out = run('check', dir);
  assert.doesNotMatch(out.stdout, /00-identity/);
  const list = JSON.parse(run('list', '--json', '--dir', dir).stdout);
  const study = list.sections.find(s => s.id === '00-identity');
  assert.equal(study.name, 'Identity studies');
  assert.equal(study.options, true);
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
  assert.match(readFileSync(join(dir, 'archive', '02-home', 'a.phone.html'), 'utf8'), /^<!doctype html><base href="\.\.\/\.\.\/02-home(\.options)?\/">/, 'an archived screen keeps resolving its tokens');
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
  await started(server);
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
  await started(server);
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

test('a frame caption is the short seenry-caption, else the first clause of the axis, never the whole axis', () => {
  const {dir} = project();
  writeFileSync(join(dir, '02-home.options', 'a.phone.html'), page('Quiet') + '<meta name="seenry-axis" content="One cobalt field: a painted sea sets the floor, the forecast rises out of it">');
  writeFileSync(join(dir, '02-home.options', 'b.html'), page('B') + '<meta name="seenry-caption" content="Black page, one band of dusk light"><meta name="seenry-axis" content="Black page and one band of dusk light: the dip is the only colour">');
  mkdirSync(join(dir, '03-long.options'));
  writeFileSync(join(dir, '03-long.options', 'a.html'), page('Long') + '<meta name="seenry-axis" content="Ink on cream like a printed ledger with an engraved ship that sails over the whole forecast">');
  const frames = JSON.parse(run('list', dir, '--json').stdout).sections.flatMap(s => s.frames), cap = id => frames.find(f => f.id === id).caption;
  assert.equal(cap('02-home/a'), 'One cobalt field');
  assert.equal(cap('02-home/b'), 'Black page, one band of dusk light');
  assert.ok(cap('03-long/a').length <= 49 && cap('03-long/a').endsWith('…'), cap('03-long/a'));
  assert.equal(cap('01-onboarding/01-welcome'), 'One promise', 'without an axis, the note');
  assert.match(readFileSync(resolve('skills/seenry-canvas/references/file.md'), 'utf8'), /seenry-caption/);
});

test('resolve archives every losing option, including one drawn for desktop and phone', () => {
  const {dir} = project();
  writeFileSync(join(dir, '02-home.options', 'c.html'), page('C'));
  writeFileSync(join(dir, '02-home.options', 'c.phone.html'), page('C'));
  const out = run('resolve', '02-home', '--pick', '02-home/b', '--dir', dir);
  assert.equal(out.status, 0, out.stderr + out.stdout);
  assert.deepEqual(readdirSync(join(dir, '02-home')), ['b.html']);
  assert.deepEqual(readdirSync(join(dir, 'archive', '02-home')).sort(), ['a.phone.html', 'c.html', 'c.phone.html']);
});

test('a screen drawn for phone and desktop keeps both, with distinct ids', () => {
  const {dir} = project();
  mkdirSync(join(dir, '03-home'));
  writeFileSync(join(dir, '03-home', 'home.html'), page('Home'));
  writeFileSync(join(dir, '03-home', 'home.phone.html'), page('Home · Phone'));
  const out = run('list', dir).stdout;
  assert.match(out, /03-home\/home  desktop 1440×900  "Home"/);
  assert.match(out, /03-home\/home\.phone  phone 390×844  "Home · Phone"/);
});

test('an unattended round is recorded and approves nothing', () => {
  const {dir} = project();
  const out = run('round', 'Chose option B: furthest from the default', '--unattended', 'headless run, nobody to review', dir);
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /Unattended run recorded\. No screen is approved/);
  const manifest = JSON.parse(readFileSync(join(dir, 'canvas.json'), 'utf8'));
  assert.equal(manifest.unattended.reason, 'headless run, nobody to review');
  assert.ok(manifest.log.some(l => l.text === 'Unattended: headless run, nobody to review'));
  assert.ok(!existsSync(join(dir, 'review.json')), 'nothing is marked approved');
});

test('plan shows named screens as placeholders until their files exist, and round clears them', async t => {
  const {dir} = project();
  const out = run('plan', '03-pricing.options/quiet.html', '03-pricing.options/loud.phone.html', '--dir', dir);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(run('plan', '../escape.html', '--dir', dir).status, 2, 'a path outside the canvas is refused');
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const pricing = JSON.parse((await call(actual, '/state')).body).sections.find(s => s.id === '03-pricing');
  assert.deepEqual(pricing.frames.map(f => [f.id, f.kind, f.device]), [['03-pricing/quiet', 'pending', 'desktop'], ['03-pricing/loud', 'pending', 'phone']]);
  assert.ok(pricing.choose);
  assert.ok(!JSON.parse(run('list', dir, '--json').stdout).sections.some(s => s.id === '03-pricing'), 'list, check and handoff see only real screens');

  mkdirSync(join(dir, '03-pricing.options'));
  writeFileSync(join(dir, '03-pricing.options', 'quiet.html'), page('Quiet'));
  const after = JSON.parse((await call(actual, '/state')).body).sections.find(s => s.id === '03-pricing');
  assert.deepEqual(after.frames.map(f => f.kind), ['page', 'pending']);
  run('round', 'first pass', dir);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'canvas.json'), 'utf8')).planned, ['03-pricing.options/loud.phone.html']);
});

test('components.css generates the Components sheet, and check catches a screen redefining one', () => {
  const {dir} = project();
  writeFileSync(join(dir, 'components.css'), '/* @component Button | <button class="btn">Save</button> | <button class="btn btn-quiet">Cancel</button> */\n.btn { padding: var(--space-3); }\n.btn-quiet { background: none; }\n');
  writeFileSync(join(dir, 'canvas.json'), JSON.stringify({stage: 'mockup'}));
  mkdirSync(join(dir, '03-settings'));
  writeFileSync(join(dir, '03-settings', 'a.html'), '<!doctype html><title>A</title><link rel="stylesheet" href="../tokens.css"><link rel="stylesheet" href="../components.css"><button class="btn">Save</button>');
  writeFileSync(join(dir, '03-settings', 'b.html'), '<!doctype html><title>B</title><link rel="stylesheet" href="../tokens.css"><style>.btn { padding: var(--space-4); }</style><button class="btn">Save</button>');
  const list = JSON.parse(run('list', dir, '--json').stdout);
  assert.ok(list.sections.some(s => s.id === 'components' && s.system), 'the sheet is a system section');
  const sheet = readFileSync(join(dir, '_components.html'), 'utf8');
  assert.match(sheet, /<h2 class="seenry-sheet-name">Button<\/h2>/);
  assert.match(sheet, /\.btn \.btn-quiet/);
  assert.match(sheet, /<button class="btn btn-quiet">Cancel<\/button>/);
  const check = run('check', dir);
  assert.match(check.stdout, /03-settings\/b\n[\s\S]*redefines shared component \.btn/);
  assert.match(check.stdout, /03-settings\/b\n[\s\S]*does not link components\.css/);
  assert.doesNotMatch(check.stdout, /03-settings\/a\n/);
  run('handoff', dir);
  assert.match(readFileSync(join(dir, 'HANDOFF.md'), 'utf8'), /- Button: `\.btn` `\.btn-quiet`/);
});

test('a picked sketch keeps its section in progress until it is extended to a full page', () => {
  const {dir} = project();
  mkdirSync(join(dir, '03-home'));
  writeFileSync(join(dir, '03-home', 'ledger.html'), '<!doctype html><meta charset="utf-8"><title>Ledger</title><meta name="seenry-fidelity" content="sketch"><p>Hero</p>');
  assert.match(run('round', 'picked Ledger', dir).stdout, /03-home: In progress \(1 picked sketch to extend/);
  writeFileSync(join(dir, '03-home', 'ledger.html'), '<!doctype html><meta charset="utf-8"><title>Ledger</title><p>Full page</p>');
  assert.match(run('round', 'extended Ledger', dir).stdout, /03-home: Ready for review/);
});

test('the time to the first option is kept when options are first shown', () => {
  const {dir} = project();
  const started = JSON.parse(readFileSync(join(dir, 'canvas.json'), 'utf8')).started;
  assert.ok(Date.parse(started), 'init starts the clock');
  assert.equal(run('static', dir).status, 0);
  const manifest = JSON.parse(readFileSync(join(dir, 'canvas.json'), 'utf8'));
  assert.ok(Date.parse(manifest.firstOption) >= Date.parse(started));
  run('handoff', dir);
  assert.match(readFileSync(join(dir, 'HANDOFF.md'), 'utf8'), /First option shown \d+ (s|min) after the canvas was started/);
});

test('the times to the first sketch, to the pick and to the finished build are kept in canvas.json and printed', async t => {
  const {dir} = project();
  const manifest = () => JSON.parse(readFileSync(join(dir, 'canvas.json'), 'utf8'));
  assert.equal(run('static', dir).status, 0);
  assert.equal(typeof manifest().timing.firstSketchSeconds, 'number');
  assert.equal(manifest().timing.pickSeconds, null);
  // The person's pick is stamped by the server when they press Send, before feedback.json is written.
  const port = 5300 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const sent = await call(port, '/feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({picks: {'02-home': '02-home/b'}, general: 'B: the image leads'})});
  assert.equal(sent.status, 200);
  assert.ok(Date.parse(manifest().picked) >= Date.parse(manifest().firstOption));
  assert.equal(typeof manifest().timing.pickSeconds, 'number');
  assert.match(run('wait', dir, '--timeout', '2').stdout, /Picked in 02-home: 02-home\/b/, 'stamping the pick does not make the feedback stale');
  const round = run('round', 'picked B', dir).stdout;
  assert.match(round, /Time since the canvas was started: first sketch at \d+ (s|min), pick at \d+ (s|min)\./);
  // check.mjs stamps `built` when its gate passes; handoff prints all three.
  writeFileSync(join(dir, 'canvas.json'), JSON.stringify({...manifest(), built: new Date().toISOString()}));
  assert.match(run('handoff', dir).stdout, /first sketch at \d+ (s|min), pick at \d+ (s|min), build finished at \d+ (s|min)\./);
  assert.match(readFileSync(join(dir, 'HANDOFF.md'), 'utf8'), /Time since the canvas was started: first sketch at/);
});

test('a first sketch later than five minutes is printed against the target', () => {
  const {dir} = project();
  const file = join(dir, 'canvas.json'), m = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(file, JSON.stringify({...m, started: new Date(Date.now() - 7 * 60000).toISOString()}));
  assert.equal(run('static', dir).status, 0);
  assert.match(run('handoff', dir).stdout, /first sketch at 7 min \(target: within 5 min\)/);
  // An agent's own choice in an unattended run counts as the pick.
  assert.match(run('round', 'chose B: furthest from the default', '--unattended', 'a headless run', dir).stdout, /pick at 7 min/);
});

test('the live feed shows what the agent says and does, and the server notices screens being written', async t => {
  const {dir} = project();
  assert.equal(run('say', 'Composing the home screen from two references', '--frame', '02-home/b', dir).status, 0);
  run('plan', '03-pricing.options/quiet.html', '--dir', dir);
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const first = JSON.parse((await call(actual, '/state')).body).activity;
  assert.deepEqual(first.map(e => [e.kind, e.frame]), [['say', '02-home/b'], ['plan', '']]);
  assert.match(first[1].text, /Planning 1 screen: Quiet/);
  assert.equal((await call(actual, '/.activity.jsonl')).status, 404, 'the feed is served only through /state');

  writeFileSync(join(dir, '01-onboarding', '02-first-habit.phone.html'), page('First habit, again'));
  utimesSync(join(dir, '01-onboarding', '02-first-habit.phone.html'), new Date(), new Date(Date.now() + 5000));
  const next = JSON.parse((await call(actual, '/state')).body).activity;
  assert.deepEqual(next.at(-1), {...next.at(-1), kind: 'edit', frame: '01-onboarding/02-first-habit', text: 'Changed First habit, again'});
});

test('open inside an agent app prints the exact call for its own pane instead of opening a tab', () => {
  const {dir} = project();
  const open = (env, ...args) => { const out = spawnSync(process.execPath, [script, 'open', dir, ...args], {encoding: 'utf8', env: {...process.env, CI: '', T3CODE_THREAD_ID: '', CODEX_THREAD_ID: '', CURSOR_AGENT: '', CLAUDE_CODE_ENTRYPOINT: '', CLAUDE_CODE_REMOTE: '', CONDUCTOR_IS_LOCAL: '', TERM_PROGRAM: '', __CFBundleIdentifier: '', ...env}}); spawnSync(process.execPath, [script, 'stop', dir]); return out; };
  let out = open({T3CODE_THREAD_ID: 'test-thread'});
  assert.equal(out.status, 0, out.stderr);
  const port = Number(out.stdout.match(/127\.0\.0\.1:(\d+)/)[1]);
  assert.match(out.stdout, new RegExp(`Running inside T3 Code\\. Call preview_open with target \\{"kind": "environment-port", "port": ${port}, "path": "/\\?embed=1"\\}`));
  assert.doesNotMatch(out.stdout, /opened in the browser/);
  assert.equal(Number(open({T3CODE_THREAD_ID: 'x'}).stdout.match(/127\.0\.0\.1:(\d+)/)[1]), port, 'the same project gets the same port');
  assert.match(open({CODEX_THREAD_ID: 'x'}).stdout, /Use @Browser to open http:\/\/127\.0\.0\.1:\d+\//);
  assert.match(open({CURSOR_AGENT: '1'}).stdout, /Call browser_navigate with url http/);
  out = open({CLAUDECODE: '1', CLAUDE_CODE_ENTRYPOINT: 'claude-desktop'});
  assert.match(out.stdout, /Browser pane/);
  const launch = JSON.parse(readFileSync(join(dir, '..', '..', '.claude', 'launch.json'), 'utf8'));
  assert.equal(launch.configurations.find(c => c.name === 'Seenry canvas').port, port);
  out = open({CLAUDE_CODE_REMOTE: 'true'});
  assert.match(out.stdout, /cloud session: 127\.0\.0\.1 here is not the person's machine/);
  assert.ok(existsSync(join(dir, 'canvas.html')));
});

test('wait returns within the window hosts allow, says how to resume, and keeps the canvas showing it waits', async t => {
  const {dir} = project();
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(5600 + Math.floor(Math.random() * 300))], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const port = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const out = spawnSync(process.execPath, [script, 'wait', dir], {encoding: 'utf8', env: {...process.env, SEENRY_WAIT_WINDOW: '1'}});
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /Still waiting: nothing sent yet\. Run the same command again to keep waiting: node .*canvas\.mjs wait /);
  assert.equal(JSON.parse((await call(port, '/state')).body).agentWaiting, true, 'between calls the canvas still says Seenry is waiting');
  await call(port, '/feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({general: 'Calmer'})});
  const again = spawnSync(process.execPath, [script, 'wait', dir], {encoding: 'utf8', env: {...process.env, SEENRY_WAIT_WINDOW: '5'}});
  assert.match(again.stdout, /General: Calmer/);
  const third = spawnSync(process.execPath, [script, 'wait', dir], {encoding: 'utf8', env: {...process.env, SEENRY_WAIT_WINDOW: '1'}});
  assert.match(third.stdout, /Still waiting/, 'feedback already handed over is not handed over twice');
});

test('plan --parts names the parts to come, and the state says which are built', async t => {
  const {dir} = project();
  assert.equal(run('plan', '03-pricing.options/quiet.html', '--parts', 'Hero, Plans,FAQ', '--dir', dir).status, 0);
  mkdirSync(join(dir, '03-pricing.options'));
  writeFileSync(join(dir, '03-pricing.options', 'quiet.html'), page('Quiet') + '<header data-seenry-part="Hero">Hi</header>');
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const state = JSON.parse((await call(actual, '/state')).body), quiet = state.sections.find(s => s.id === '03-pricing').frames[0];
  assert.deepEqual([quiet.plan, quiet.parts], [['Hero', 'Plans', 'FAQ'], ['Hero']]);
});

test('each save names the parts it added, so the feed reads like the build', async t => {
  const {dir} = project();
  const file = join(dir, '01-onboarding', '02-first-habit.phone.html');
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  await call(actual, '/state');
  const save = (html, at) => { writeFileSync(file, html); utimesSync(file, new Date(), new Date(at)); };
  save(page('First habit') + '<h1 data-seenry-part="Headline">Pick one habit</h1>', Date.now() + 5000);
  assert.equal(JSON.parse((await call(actual, '/state')).body).activity.at(-1).text, 'Added Headline to First habit');
  save(page('First habit') + '<h1 data-seenry-part="Headline">Pick one habit</h1><ul data-seenry-part="Habit list"><li>Walk</li></ul><button data-seenry-part="Start button">Start</button>', Date.now() + 10000);
  assert.equal(JSON.parse((await call(actual, '/state')).body).activity.at(-1).text, 'Added Habit list, Start button to First habit');
  save(page('First habit') + '<h1 data-seenry-part="Headline">Pick a habit</h1><ul data-seenry-part="Habit list"><li>Walk</li></ul><button data-seenry-part="Start button">Start</button>', Date.now() + 15000);
  assert.equal(JSON.parse((await call(actual, '/state')).body).activity.at(-1).text, 'Changed First habit');
});

test('plan --parts takes the part names; a height after a colon is accepted and ignored', async t => {
  const {dir} = project();
  assert.equal(run('plan', '03-pricing/01-plans.html', '--parts', 'Nav:72, Hero:560,Plans', '--dir', dir).status, 0);
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const f = JSON.parse((await call(actual, '/state')).body).sections.find(s => s.id === '03-pricing').frames[0];
  assert.deepEqual([f.kind, f.plan, f.planH], ['pending', ['Nav', 'Hero', 'Plans'], undefined]);
});

test('a save reaches the page as a pushed event, without waiting for a poll', async t => {
  const {dir} = project();
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const got = await new Promise((done, fail) => {
    const req = request({host: '127.0.0.1', port: actual, path: '/events'}, res => {
      assert.match(res.headers['content-type'], /text\/event-stream/);
      let data = '';
      res.on('data', c => { data += c; const m = data.match(/data: (.+)\n\n/); if (m) { req.destroy(); done({ms: Date.now() - at, event: JSON.parse(m[1])}); } });
    });
    req.on('error', e => { if (e.code !== 'ECONNRESET') fail(e); });
    req.end();
    let at = 0;
    setTimeout(() => { at = Date.now(); writeFileSync(join(dir, '01-onboarding', '02-first-habit.phone.html'), page('First habit, again')); }, 300);
    setTimeout(() => fail(new Error('no event within 3 s')), 3000);
  });
  assert.ok(got.event.files.includes('01-onboarding/02-first-habit.phone.html'), JSON.stringify(got.event));
  assert.ok(got.ms < 1000, `pushed after ${got.ms} ms`);
});

test('the canvas page script parses and carries the layout checks', async t => {
  const {dir} = project();
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const html = (await call(actual, '/')).body, code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  assert.doesNotThrow(() => new Function(code));
  assert.match(code, /function seenryProblems\(doc, limit\)/);
  assert.match(code, /new EventSource\('events'\)/);
  run('static', dir);
  assert.match(readFileSync(join(dir, 'canvas.html'), 'utf8'), /function seenryProblems/);
});

test('the open canvas reports layout problems, and problems prints them for the current save', async t => {
  const {dir} = project();
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const state = JSON.parse((await call(actual, '/state')).body), f = state.sections.find(s => s.id === '01-onboarding').frames[0];
  const post = (body, headers = {}) => call(actual, '/problems', {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify(body)});
  assert.equal((await post({frame: f.id, rev: f.rev, results: []}, {origin: 'http://evil.example'})).status, 403);
  assert.equal((await post({frame: f.id, rev: f.rev, results: [{width: 390, problems: [{kind: 'overflow', where: 'Hero › div.wide', selector: 'body > div', message: 'Wider than the screen: runs to 612px of 390'}]}]})).status, 200);
  const out = run('problems', f.id, '--dir', dir);
  assert.equal(out.status, 1, out.stderr);
  assert.match(out.stdout, /01-onboarding\/01-welcome  1 problem\n  390   Hero › div\.wide: Wider than the screen: runs to 612px of 390/);
  const listed = JSON.parse(run('problems', f.id, '--json', '--dir', dir).stdout);
  assert.equal(listed.count, 1); assert.equal(listed.screens[0].from, 'canvas');
});

test('a save that changes every part of a built screen is called a rewrite on the feed', async t => {
  const {dir} = project();
  const file = join(dir, '01-onboarding', '02-first-habit.phone.html');
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  await call(actual, '/state');
  const save = (html, at) => { writeFileSync(file, html); utimesSync(file, new Date(), new Date(at)); };
  const last = async () => JSON.parse((await call(actual, '/state')).body).activity.at(-1);
  save(page('First habit') + '<h1 data-seenry-part="Headline">Pick one habit</h1><ul data-seenry-part="Habit list"><li>Walk</li></ul><button data-seenry-part="Start button">Start</button>', Date.now() + 5000);
  assert.equal((await last()).kind, 'edit');
  save(page('First habit') + '<h1 data-seenry-part="Headline" class="big">Choose a habit</h1><ul data-seenry-part="Habit list"><li>Read</li></ul><button data-seenry-part="Start button">Begin</button>', Date.now() + 10000);
  const rewrite = await last();
  assert.equal(rewrite.kind, 'warn');
  assert.equal(rewrite.text, 'Rewrote First habit: 3 parts changed in one save. Patch the part that needs it instead');
  save(page('First habit') + '<h1 data-seenry-part="Headline" class="big">Choose one habit</h1><ul data-seenry-part="Habit list"><li>Read</li></ul><button data-seenry-part="Start button">Begin</button>', Date.now() + 15000);
  assert.deepEqual([(await last()).kind, (await last()).text], ['edit', 'Changed First habit']);
});

test('the local canvas and online sync answer More like this with the same three modes', () => {
  const modes = f => readFileSync(resolve('skills/seenry-canvas/scripts', f), 'utf8').match(/const RIFF_MODES = \[([\s\S]+?)\];/)[1];
  assert.equal(modes('canvas.mjs'), modes('sync.mjs'));
  assert.equal((modes('canvas.mjs').match(/^  '/gm) || []).length, 3);
});

test('every screen shows one status, the way T3 Code shows a thread: an icon and one word', async t => {
  const {dir} = project();
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(port)], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const actual = JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port;
  const html = (await call(actual, '/')).body, code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  const from = code.indexOf('const SEENRY_STATUS'), to = code.indexOf('\n}', code.indexOf('function seenryStatus(')) + 2;
  assert.ok(from >= 0 && to > from, 'the status module is in the page');
  const {SEENRY_STATUS, seenryStatus} = new Function(code.slice(from, to) + '; return {SEENRY_STATUS, seenryStatus};')();
  assert.deepEqual(Object.keys(SEENRY_STATUS), ['working', 'waiting', 'approval', 'input', 'failed', 'done']);
  assert.deepEqual(Object.values(SEENRY_STATUS).map(s => s.label), ['Working', 'Waiting', 'Approval', 'Input', 'Failed', 'Done']);
  const at = x => seenryStatus({building: false, page: true, option: false, open: false, sent: '', ...x});
  assert.equal(at({building: true}), 'working');
  assert.equal(at({building: true, sent: 'approved'}), 'working');
  assert.equal(at({}), 'approval');
  assert.equal(at({sent: 'approved'}), 'done');
  assert.equal(at({sent: 'change'}), 'waiting');
  assert.equal(at({page: false}), null);
  assert.equal(at({option: true, open: true}), 'approval');
  assert.equal(at({option: true, open: false}), null);
  assert.match(code, /function statusOf\(f\)/);
});
