import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync, spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {matchStyles, bans, steps, loadIndex, projectMode} from '../skills/seenry/scripts/start.mjs';

const script = resolve('skills/seenry/scripts/start.mjs');
// An empty config folder, so a developer's own Seenry link never leaks their taste into these runs.
const unlinked = mkdtempSync(join(tmpdir(), 'seenry-start-config-'));
const run = (args, cwd = process.cwd(), env = {}) => spawnSync(process.execPath, [script, ...args], {encoding: 'utf8', cwd, env: {...process.env, SEENRY_CONFIG_DIR: unlinked, ...env}});

test('a brief finds the styles whose keywords it uses, best first, at most three', () => {
  assert.equal(matchStyles('A landing page for a developer CLI and API, dark')[0].slug, 'dark-technical');
  assert.equal(matchStyles('Booking for a small restaurant and cafe')[0].slug, 'place-photographic');
  assert.equal(matchStyles('Pricing plans for our product')[0].slug, 'pricing-page');
  assert.equal(matchStyles('An online shop selling eyewear')[0].slug, 'commerce-product');
  assert.deepEqual(matchStyles('xyzzy plugh'), []);
  for (const brief of ['saas dashboard analytics with charts and metrics for a startup landing', 'ai agent']) assert.ok(matchStyles(brief).length <= 3);
});

test('every style on the shelf can be found from its own keywords', () => {
  for (const s of loadIndex()) assert.equal(matchStyles(s.keywords.join(' '))[0].slug, s.slug);
});

test('the bans and steps come from their files, one line each', () => {
  const b = bans(), md = readFileSync('skills/seenry/references/bans.md', 'utf8');
  assert.equal(b.length, md.split('\n').filter(l => l.startsWith('- ')).length);
  assert.ok(b.includes('Boxing every element in a card'));
  assert.ok(b.every(l => !l.includes('\n') && l.length < 140));
  const s = steps();
  assert.equal(s.length, 9);
  assert.match(s[0], /^1\. Brief: `<canvas> init`/);
  assert.match(s[8], /^9\. Check: .*check\.mjs/);
  assert.match(s[6], /^7\. Extend: `<canvas> verify` \(canvas only\)/);
  assert.match(s[7], /^8\. Build: `<canvas> compare <sketch> <url>`/);
});

test('the mode says where the pick is built: in the project\'s framework, or on the canvas for an empty folder', () => {
  const empty = mkdtempSync(join(tmpdir(), 'seenry-mode-'));
  mkdirSync(join(empty, '.seenry'));
  assert.deepEqual(projectMode(empty), {project: false, framework: '', evidence: ''});
  const out = run(['pricing page for a saas product'], empty).stdout;
  assert.match(out, /Mode: empty folder: full page on canvas\./);
  assert.match(out, /Skip the canvas when the person says "just build it", "no options", "skip the canvas", "straight in code", or their project instructions say so/);
  assert.match(out, /MOTION\.md and check\.mjs still run/);

  const next = mkdtempSync(join(tmpdir(), 'seenry-mode-'));
  writeFileSync(join(next, 'package.json'), JSON.stringify({dependencies: {next: '15.0.0', react: '19.0.0'}}));
  assert.equal(projectMode(next).framework, 'Next.js', 'the meta-framework, not the library under it');
  const built = run(['pricing page for a saas product'], next);
  assert.match(built.stdout, /Mode: project found \(package\.json\): build the pick in Next\.js\. Step 7 writes the full page straight in its code, not on the canvas/);
  assert.ok(built.stdout.split('\n').length <= 50, `${built.stdout.split('\n').length} lines`);
  assert.equal(JSON.parse(run(['--json', 'pricing'], next).stdout).mode.framework, 'Next.js');
  assert.doesNotMatch(run(['pricing', '--no-steps'], next).stdout, /Mode:/);

  const setup = mkdtempSync(join(tmpdir(), 'seenry-mode-'));
  writeFileSync(join(setup, 'package.json'), JSON.stringify({devDependencies: {playwright: '1.50.0'}}));
  assert.equal(projectMode(setup).project, false, 'the Playwright the setup installs is not an app');
  writeFileSync(join(setup, 'package.json'), JSON.stringify({scripts: {dev: 'node server.js'}, devDependencies: {playwright: '1.50.0'}}));
  assert.equal(projectMode(setup).project, true);

  const rails = mkdtempSync(join(tmpdir(), 'seenry-mode-'));
  writeFileSync(join(rails, 'Gemfile'), "gem 'rails', '~> 8.0'\n");
  assert.equal(projectMode(rails).framework, 'Rails');
  const vite = mkdtempSync(join(tmpdir(), 'seenry-mode-'));
  writeFileSync(join(vite, 'package.json'), JSON.stringify({devDependencies: {vite: '6.0.0'}}));
  assert.equal(projectMode(vite).framework, 'Vite');
  const site = mkdtempSync(join(tmpdir(), 'seenry-mode-'));
  writeFileSync(join(site, 'index.html'), '<!doctype html>');
  assert.equal(projectMode(site).project, true);
});

test('the command prints matches, bans and steps, short', () => {
  const r = run(['A landing page for a developer CLI and API, dark']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Styles that fit/);
  assert.match(r.stdout, /dark-technical/);
  assert.match(r.stdout, /Never \(references\/bans\.md\)/);
  assert.match(r.stdout, /Steps \(SKILL\.md\)/);
  assert.ok(r.stdout.split('\n').length <= 50, `${r.stdout.split('\n').length} lines`);
  assert.doesNotMatch(r.stdout, /## Identity/, 'without --style no brief is printed whole');
});

test('--style prints that brief whole; an unknown style names the shelf', () => {
  const r = run(['--style', 'pricing-page', '--no-steps']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^# Pricing page/);
  assert.match(r.stdout, /## Below the hero/);
  assert.doesNotMatch(r.stdout, /Steps \(SKILL\.md\)/);
  const bad = run(['--style', 'nope']);
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /pricing-page/);
});

test('with no words it reads .seenry/brief.md, and says so when there is none', () => {
  const dir = mkdtempSync(join(tmpdir(), 'seenry-start-'));
  assert.match(run([], dir).stdout, /No brief yet/);
  mkdirSync(join(dir, '.seenry'));
  writeFileSync(join(dir, '.seenry', 'brief.md'), 'A studio portfolio for an architecture practice.');
  assert.match(run([], dir).stdout, /studio-portfolio/);
  const json = JSON.parse(run(['--json', 'restaurant booking'], dir).stdout);
  assert.equal(json.matches[0].slug, 'place-photographic');
  assert.equal(json.steps.length, 9);
});

test('on a linked computer the first call prints the person\'s taste, and never waits on a server that is away', async () => {
  const file = '# Taste\n\n## What they chose\n\n- Light pages\n- Big headlines\n\n## Never\n\n- Carousels that move on their own\n\n## Sites and images they love\n\n- Linear: <https://linear.app/>\n';
  let asked = '';
  const server = createServer((req, res) => { asked = `${req.url} ${req.headers.authorization}`; res.writeHead(200, {'content-type': 'text/markdown'}); res.end(file); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const config = mkdtempSync(join(tmpdir(), 'seenry-start-linked-')), token = 'seenry_canvas_' + 'x'.repeat(43);
  const link = url => writeFileSync(join(config, 'canvas-sync.json'), JSON.stringify({server: url, token}));
  // The server lives in this process, so the script runs without blocking it.
  const start = args => new Promise(done => { const child = spawn(process.execPath, [script, ...args], {env: {...process.env, SEENRY_CONFIG_DIR: config}}); let out = ''; child.stdout.on('data', c => { out += c; }); child.on('close', status => done({status, out})); });
  try {
    link(`http://127.0.0.1:${server.address().port}`);
    const linked = await start(['pricing page for a saas product']);
    assert.equal(linked.status, 0);
    assert.equal(asked, `/api/account/taste.md Bearer ${token}`);
    assert.match(linked.out, /Their taste, from their Seenry account[\s\S]*Light pages[\s\S]*Carousels that move on their own[\s\S]*linear\.app/);
    assert.ok(linked.out.indexOf('Their taste') > linked.out.indexOf('Never (references/bans.md)'), 'after the bans, before the steps');
    assert.ok(!linked.out.includes(token));
    assert.equal(JSON.parse((await start(['pricing page', '--json'])).out).taste, file.trim());
    assert.ok(!(await start(['pricing page', '--no-taste'])).out.includes('Their taste'));
  } finally { await new Promise(r => server.close(r)); }
  link('http://127.0.0.1:9');
  const away = await start(['pricing page for a saas product']);
  assert.equal(away.status, 0);
  assert.ok(!away.out.includes('Their taste'));
  assert.match(away.out, /Never \(references\/bans\.md\)/);
});
