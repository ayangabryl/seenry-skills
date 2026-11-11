// The agent's eyes on the canvas: render, tree, verify, diff and compare in a real browser.
// Skips when Playwright is not installed; CI passes it with SEENRY_PLAYWRIGHT.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn, spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';

const script = resolve('skills/seenry-canvas/scripts/canvas.mjs');
let playwright = process.env.SEENRY_PLAYWRIGHT;
if (!playwright) { try { playwright = createRequire(join(process.cwd(), 'x.js')).resolve('playwright'); } catch {} }
const skip = playwright ? false : 'Playwright is not installed';
const run = (...args) => spawnSync(process.execPath, [script, ...args, ...(process.env.SEENRY_PLAYWRIGHT ? ['--playwright', process.env.SEENRY_PLAYWRIGHT] : [])], {encoding: 'utf8', timeout: 120000});

function project() {
  const root = mkdtempSync(join(tmpdir(), 'seenry-agent-')), dir = join(root, '.seenry', 'canvas');
  assert.equal(run('init', dir).status, 0);
  mkdirSync(join(dir, '01-flow'));
  const head = '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../tokens.css"><style>body{margin:0;background:var(--color-bg);color:var(--color-text);font-family:var(--font-body)}main{padding:var(--space-8)}</style>';
  writeFileSync(join(dir, '01-flow', '01-good.phone.html'), head + '<title>Good</title><main><label>Your name<input id="name"></label><h1 class="text-title" id="t">Count weeks</h1><a href="#" style="display:inline-flex;min-height:44px;min-width:44px;color:inherit">Start</a><a id="go" href="02-bad.phone.html" data-spec="Tap: next" style="display:inline-block;padding:var(--space-3) var(--space-5);background:var(--color-accent);color:var(--color-on-accent)">Start</a></main>');
  writeFileSync(join(dir, '01-flow', '02-bad.phone.html'), head + '<title>Bad</title><main><p id="faint" style="color:#ddd">Faint text</p><a id="dead" href="03-missing.phone.html">Next</a><div style="width:600px">wide</div></main>');
  return {root, dir};
}

test('render writes a PNG per screen, device and mode', {skip}, () => {
  const {dir} = project();
  const out = run('render', '01-flow/01-good', '--mode', 'both', '--json', '--dir', dir);
  assert.equal(out.status, 0, out.stderr);
  const shots = JSON.parse(out.stdout);
  assert.deepEqual(shots.map(s => s.mode), ['light', 'dark']);
  for (const s of shots) assert.ok(readFileSync(s.file).subarray(1, 4).toString() === 'PNG');
});

test('tree names the variable behind each style and flags typed values', {skip}, () => {
  const {dir} = project();
  const [good, bad] = JSON.parse(run('tree', '01-flow', '--json', '--dir', dir).stdout);
  const start = good.nodes.find(n => n.id === 'go');
  assert.equal(start.styles.background.token, '--color-accent');
  assert.equal(start.spec, 'Tap: next');
  assert.match(bad.nodes.find(n => n.id === 'faint').styles.color.token, /^!rgb\(221, 221, 221\)$/);
});

test('verify fails on contrast, overflow and broken links', {skip}, () => {
  const {dir} = project();
  const out = run('verify', '--json', '--dir', dir);
  assert.equal(out.status, 1);
  const kinds = JSON.parse(out.stdout).issues.filter(i => i.frame === '01-flow/02-bad').map(i => i.kind);
  for (const k of ['contrast', 'overflow', 'link']) assert.ok(kinds.includes(k), `expected a ${k} issue in ${kinds}`);
  assert.ok(!JSON.parse(out.stdout).issues.some(i => i.frame === '01-flow/01-good' && i.severity === 'error'));
});

test('diff reports what changed since the last render', {skip}, () => {
  const {dir} = project();
  assert.match(run('diff', '01-flow/01-good', '--dir', dir).stdout, /baseline/);
  const file = join(dir, '01-flow', '01-good.phone.html');
  writeFileSync(file, readFileSync(file, 'utf8').replace('Count weeks', 'Count every single week'));
  const [r] = JSON.parse(run('diff', '01-flow/01-good', '--json', '--dir', dir).stdout);
  assert.ok(r.changed > 0 && existsSync(r.file));
});

test('compare lists what the build gets wrong against the design', {skip}, async t => {
  const {root, dir} = project();
  const build = join(root, 'build'); mkdirSync(build);
  writeFileSync(join(build, 'tokens.css'), readFileSync(join(dir, 'tokens.css')));
  writeFileSync(join(build, 'index.html'), readFileSync(join(dir, '01-flow', '01-good.phone.html'), 'utf8').replace('../tokens.css', 'tokens.css').replace('class="text-title"', 'class="text-title" style="font-size:20px"'));
  const server = createServer((req, res) => { const f = join(build, req.url === '/' ? 'index.html' : req.url.slice(1)); res.end(existsSync(f) ? readFileSync(f) : ''); }).listen(0, '127.0.0.1');
  t.after(() => server.close());
  await new Promise(r => server.on('listening', r));
  const out = spawn(process.execPath, [script, 'compare', '01-flow/01-good', `http://127.0.0.1:${server.address().port}/`, '--json', '--dir', dir, ...(process.env.SEENRY_PLAYWRIGHT ? ['--playwright', process.env.SEENRY_PLAYWRIGHT] : [])]);
  let text = ''; out.stdout.on('data', d => { text += d; });
  const code = await new Promise(r => out.on('exit', r));
  assert.equal(code, 1);
  const result = JSON.parse(text);
  assert.ok(result.different.some(d => /font-size: design 32px, build 20px/.test(d)), result.different.join('\n'));
  assert.ok(existsSync(result.files.diff));
});

test('pair puts a screen beside its reference at the same width', {skip}, () => {
  const {dir} = project();
  const shot = run('render', '01-flow/01-good', '--json', '--dir', dir);
  assert.equal(shot.status, 0, shot.stderr);
  writeFileSync(join(dir, 'refs', 'ref.png'), readFileSync(JSON.parse(shot.stdout)[0].file));
  const out = run('pair', '01-flow/01-good', 'ref.png', '--json', '--dir', dir);
  assert.equal(out.status, 0, out.stderr);
  const result = JSON.parse(out.stdout), png = readFileSync(result.file);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.ok(png.readUInt32BE(16) > 2 * 390, 'two screens side by side');
  assert.notEqual(run('pair', '01-flow/01-good', 'missing.png', '--dir', dir).status, 0);
});
