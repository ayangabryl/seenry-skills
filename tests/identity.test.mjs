// Seenry identity: specimen and color study screens, offline (fetch needs the network and is not tested here).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn, spawnSync} from 'node:child_process';

const script = resolve('skills/seenry-identity/scripts/identity.mjs');
const run = (cwd, ...args) => spawnSync(process.execPath, [script, ...args], {encoding: 'utf8', cwd});

function canvas() {
  const root = mkdtempSync(join(tmpdir(), 'seenry-identity-')), dir = join(root, '.seenry', 'canvas');
  mkdirSync(join(dir, 'fonts'), {recursive: true});
  writeFileSync(join(dir, 'fonts', 'fonts.json'), JSON.stringify([{family: 'Upright', files: [{file: 'Upright-400.woff2', weight: 400, style: 'normal'}, {file: 'Upright-700.woff2', weight: 700, style: 'normal'}]}]));
  return {root, dir};
}

test('specimen sets the real lines per font and says when a family has no italic', () => {
  const {root, dir} = canvas();
  const out = run(root, 'specimen', '--fonts', 'Upright,Other', '--lines', 'We design the signs|A sentence|€38,000');
  assert.equal(out.status, 0, out.stderr);
  const files = readdirSync(join(dir, '00-identity')).sort();
  assert.deepEqual(files, ['01-upright.html', '02-other.html']);
  const upright = readFileSync(join(dir, '00-identity', '01-upright.html'), 'utf8');
  assert.match(upright, /We design the signs/);
  assert.match(upright, /No italic in this family/);
  assert.doesNotMatch(upright, /Aa Medium/);
  assert.match(upright, /font-synthesis:none/);
  assert.match(readFileSync(join(dir, '00-identity', '02-other.html'), 'utf8'), /Aa Italic/);
});

test('study picks readable text on filled colors and warns about a weak accent', () => {
  const {root, dir} = canvas();
  const out = run(root, 'study', '--name', 'Poles', '--ground', '#c9c9c5', '--ink', '#161615', '--dominant', '#161615', '--accent', '#e8336b', '--display', 'Upright', '--lines', 'Headline|Sentence|€1', '--dark-ground', '#121212', '--dark-ink', '#d7d7d3', '--dark-dominant', '#2a2a28');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /reaches 4\.5:1 with neither ink nor ground/);
  const html = readFileSync(join(dir, '00-identity', 'c-poles.html'), 'utf8');
  assert.match(html, /--on-dominant:#c9c9c5/);
  assert.match(html, /:root\[data-theme="dark"\]\{[^}]*--on-dominant:#d7d7d3/);
  assert.notEqual(run(root, 'study', '--name', 'X').status, 0);
});

test('fetch --url takes a font zip from a foundry, keeps its license and writes the right @font-face format', async t => {
  const {root, dir} = canvas();
  const zip = join(root, 'font.zip');
  const made = spawnSync('python3', ['-c', `import zipfile;z=zipfile.ZipFile(${JSON.stringify(zip)},'w',zipfile.ZIP_DEFLATED);z.writestr('Demo-main/fonts/otf/Demo-Bold.otf',b'OTTO'+b'x'*64);z.writestr('Demo-main/fonts/otf/Demo-Regular.otf',b'OTTO'+b'y'*64);z.writestr('Demo-main/OFL.txt','SIL Open Font License, Version 1.1');z.close()`]);
  if (made.status !== 0) return t.skip('python3 is needed to build the test zip');
  const {createServer} = await import('node:http');
  const server = createServer((req, res) => { res.end(readFileSync(zip)); }).listen(0, '127.0.0.1');
  await new Promise(r => server.once('listening', r));
  t.after(() => server.close());
  const out = await new Promise(done => { const p = spawn(process.execPath, [script, 'fetch', 'Demo', '--url', `http://127.0.0.1:${server.address().port}/demo.zip`, '--out', join(dir, 'fonts')], {cwd: root}); let o = ''; p.stdout.on('data', d => o += d); p.on('close', code => done({code, o})); });
  assert.equal(out.code, 0, out.o);
  assert.match(out.o, /Demo {2}OFL-1\.1 {2}700 400|Demo {2}OFL-1\.1 {2}400 700/);
  const css = readFileSync(join(dir, 'fonts', 'fonts.css'), 'utf8');
  assert.match(css, /Demo-700\.otf"\) format\("opentype"\); font-weight: 700/);
  assert.match(readFileSync(join(dir, 'fonts', 'Demo-LICENSE.txt'), 'utf8'), /Open Font License/);
});

test('ramp prints twelve OKLCH steps with jobs for light and dark, and the text contrast', () => {
  const out = run(tmpdir(), 'ramp', '--name', 'shutter', '--color', '#2f5a4c');
  assert.equal(out.status, 0, out.stderr);
  assert.equal((out.stdout.match(/--shutter-\d+: oklch\(/g) || []).length, 24);
  assert.match(out.stdout, /--shutter-9: oklch\(0\.432 0\.054 170\.5\); \/\* #2f5a4c solid fill/);
  const [, t12] = out.stdout.match(/step 12 ([\d.]+):1/);
  assert.ok(Number(t12) >= 7, 'high-contrast text passes AAA on the background');
  assert.notEqual(run(tmpdir(), 'ramp', '--color', 'green').status, 0);
});
