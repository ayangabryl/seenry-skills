// The baseline eval reads the canvas's own clock and the image log, and a directed run is told a person will pick.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {readTimings, readImages} from '../evals/baseline/run.mjs';

const runner = resolve('evals/baseline/run.mjs');

test('the runner reads the times to the first sketch, the pick and the build, on the canvas clock and the run clock', () => {
  const work = mkdtempSync(join(tmpdir(), 'seenry-timing-'));
  assert.deepEqual(readTimings(work, '2026-01-01T00:00:00.000Z').sinceRunStart, {firstSketch: null, pick: null, built: null});
  mkdirSync(join(work, '.seenry', 'canvas', 'img'), {recursive: true});
  writeFileSync(join(work, '.seenry', 'canvas', 'canvas.json'), JSON.stringify({started: '2026-01-01T00:01:00.000Z', firstOption: '2026-01-01T00:05:30.000Z', picked: '2026-01-01T00:07:00.000Z', built: '2026-01-01T00:15:00.000Z'}));
  const t = readTimings(work, '2026-01-01T00:00:00.000Z');
  assert.deepEqual([t.firstSketchSeconds, t.pickSeconds, t.builtSeconds], [270, 360, 840]);
  assert.deepEqual(t.sinceRunStart, {firstSketch: 330, pick: 420, built: 900});
  assert.equal(t.unattended, false);
  writeFileSync(join(work, '.seenry', 'images.log'), '✓ .seenry/canvas/img/tide.jpg\n✗ .seenry/canvas/img/dusk.jpg: no image was produced.\n✓ .seenry/canvas/img/reef.jpg\n2/3 image(s) generated.\n');
  writeFileSync(join(work, '.seenry', 'canvas', 'img', 'tide.jpg'), 'x'); writeFileSync(join(work, '.seenry', 'canvas', 'img', 'jobs.json'), '[]');
  assert.deepEqual(readImages(work), {generated: 2, failed: 1, onCanvas: 1});
});

test('a directed run is told a person will pick on the canvas; without the flag the run stays unattended', () => {
  const runs = mkdtempSync(join(tmpdir(), 'seenry-runs-'));
  const dry = (...more) => spawnSync(process.execPath, [runner, '--dry', '--runs', runs, '--models', 'claude:sonnet', '--briefs', 'cash-forecast', '--conditions', 'B', ...more], {encoding: 'utf8'});
  const plain = dry();
  assert.equal(plain.status, 0, plain.stderr);
  assert.match(plain.stdout, /Use the seenry skill\. The brief is in BRIEF\.md\. Nobody can a…/);
  const directed = dry('--director', '--without-example');
  assert.match(directed.stdout, /Use the seenry skill\. The brief is in BRIEF\.md\. I am at the …/);
  // The run's copy of the skill holds no trace of the example it could copy.
  const skill = join(runs, 'claude-sonnet', 'cash-forecast', 'B', 'work', '.claude', 'skills', 'seenry');
  assert.ok(existsSync(join(skill, 'SKILL.md')) && !existsSync(join(skill, 'assets', 'examples', 'waterline')));
  for (const f of ['SKILL.md', 'references/level-bar.md', 'references/execution-bar.md']) assert.doesNotMatch(readFileSync(join(skill, f), 'utf8'), /waterline/i, f);
  assert.match(readFileSync(resolve('skills/seenry/SKILL.md'), 'utf8'), /Waterline/, 'the repo keeps its example');
});
