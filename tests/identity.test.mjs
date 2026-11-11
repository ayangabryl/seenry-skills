// Seenry identity: specimen and color study screens, offline (fetch needs the network and is not tested here).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

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
