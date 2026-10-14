import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {selectReferences, readManifest, readEvidence, evidenceDigest} from '../skills/seenry/scripts/reference_manifest.mjs';
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'seenry-refs-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  mkdirSync(join(dir, 'refs')); mkdirSync(join(dir, 'research', 'bar'), {recursive: true});
  const entries = ['a', 'b', 'c', 'd'].map((id, i) => {
    writeFileSync(join(dir, 'refs', `${id}.png`), id);
    return {id, path: `${id}.png`, role: i === 3 ? 'mechanism' : 'craft', source: `source ${id}`, observation: 'Visible expanded row', application: 'Transfer row hierarchy', limitations: 'Keyboard behavior unknown', state: 'expanded'};
  });
  const manifest = join(dir, 'refs', 'manifest.json');
  const save = (data = {version: 1, entries}) => writeFileSync(manifest, JSON.stringify(data));
  save(); return {dir, entries, manifest, save};
}
test('manifest priority retains both roles with three ordered selections and hashes', t => {
  const f = fixture(t), evidence = selectReferences({dir: f.dir});
  assert.deepEqual(evidence.entries.map(e => e.id), ['a', 'b', 'd']);
  assert.ok(evidence.entries.every(e => e.path.startsWith(f.dir) && /^[a-f0-9]{64}$/.test(e.sha256)));
  assert.equal(evidence.entries[2].state, 'expanded');
  const old = evidenceDigest(evidence); f.entries[0].observation = 'Changed note'; f.save();
  assert.notEqual(evidenceDigest(selectReferences({dir: f.dir})), old);
});
test('invalid manifests fail clearly, including unselected entries', t => {
  const f = fixture(t);
  for (const change of [
    data => data.version = 2,
    data => data.entries = [],
    data => data.entries[3].path = 'missing.png',
    data => data.entries[3].id = 'a',
    data => data.entries[3].path = './a.png',
    data => data.entries[3].role = 'inspiration',
    data => data.entries[3].limitations = '',
    data => data.entries[3].path = resolve(f.dir, 'refs/a.png'),
  ]) {
    const data = {version: 1, entries: structuredClone(f.entries)}; change(data); f.save(data);
    assert.throws(() => selectReferences({dir: f.dir}), /Reference evidence:/);
  }
  writeFileSync(f.manifest, '{'); assert.throws(() => readManifest(f.manifest), /cannot read manifest/);
  assert.throws(() => selectReferences({dir: f.dir, manifest: join(f.dir, 'absent.json')}), /cannot read manifest/);
  assert.throws(() => selectReferences({dir: f.dir, manifest: ''}), /requires a path/);
});
test('explicit refs override even a broken manifest and retain caller order', t => {
  const f = fixture(t); writeFileSync(f.manifest, '{');
  const paths = ['d','c','b','a'].map(id => join(f.dir, 'refs', `${id}.png`));
  assert.deepEqual(selectReferences({dir: f.dir, refs: paths.join(',')}).entries.map(e => e.path), paths);
  assert.throws(() => selectReferences({dir: f.dir, refs: join(f.dir, 'missing.png')}), /missing image/);
});
test('legacy selection warns and prefers sorted research bar images', t => {
  const f = fixture(t); rmSync(f.manifest); writeFileSync(join(f.dir, 'research/bar/z.png'), 'z');
  const warnings = []; const e = selectReferences({dir: f.dir, warn: x => warnings.push(x)});
  assert.equal(e.origin, 'legacy'); assert.equal(e.entries[0].path, join(f.dir, 'research', 'bar', 'z.png')); assert.match(warnings[0], /WARNING.*manifest/);
});
test('critic receives identical roles, notes, and selected paths without a paid model call', t => {
  const f = fixture(t), evidence = selectReferences({dir: f.dir});
  const evidencePath = join(f.dir, 'evidence.json'); writeFileSync(evidencePath, JSON.stringify(evidence));
  for (const name of ['critic.mjs', 'reference_manifest.mjs']) copyFileSync(new URL(`../skills/seenry/scripts/${name}`, import.meta.url), join(f.dir, name));
  writeFileSync(join(f.dir, 'model_cli.mjs'), `import {writeFileSync} from 'node:fs';
export const findCli=()=>({cli:'offline-stub'});
export function askModel(found, request) { writeFileSync(new URL('./request.json',import.meta.url),JSON.stringify(request)); return {scores:{overall:9},slop:[],fixes:[],verdict:'fixture only'}; }`);
  for (const name of ['board.png', 'first.png']) writeFileSync(join(f.dir, name), 'fixture');
  const out = join(f.dir, 'critic.json');
  const run = () => spawnSync(process.execPath, [join(f.dir, 'critic.mjs'), '--board', join(f.dir, 'board.png'), '--first', join(f.dir, 'first.png'), '--out', out, '--reference-evidence', evidencePath, '--refs', evidence.entries.map(e => e.path).join(','), '--runs', '1'], {encoding: 'utf8'});
  const result = run(); assert.equal(result.status, 0, result.stderr);
  const request = JSON.parse(readFileSync(join(f.dir, 'request.json')));
  assert.equal(request.schema.properties.fixes.minItems, 0);
  assert.match(request.prompt, /viewport and visible state/);
  assert.deepEqual(request.images.slice(2), evidence.entries.map(e => e.path));
  assert.match(request.prompt, /Mechanism references are scoped analogies/);
  assert.match(request.prompt, /screenshot alone cannot prove behavior/);
  assert.match(request.prompt, /Keyboard behavior unknown/);
  assert.deepEqual(JSON.parse(readFileSync(out)).referenceEvidence, evidence);
  writeFileSync(evidence.entries[0].path, 'changed pixels');
  assert.throws(() => readEvidence(evidencePath), /changed after selection/);
  assert.equal(run().status, 2);
});
