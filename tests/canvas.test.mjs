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
  writeFileSync(join(dir, '01-onboarding', '01-welcome.phone.html'), page('Welcome', 'One promise'));
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
  assert.deepEqual(state.sections.map(s => [s.id, s.choose, s.frames.length]), [['01-onboarding', false, 2], ['02-home', true, 2]]);
  assert.equal(state.sections[0].frames[0].note, 'One promise');
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
