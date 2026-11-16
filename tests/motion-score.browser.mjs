// Keyboard probe of the motion score, in a real browser.
//   node tests/motion-score.browser.mjs --playwright /absolute/path/to/playwright/index.mjs
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const index = process.argv.indexOf('--playwright');
if (index < 0) throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const playwright = process.argv[index + 1], script = resolve('skills/seenry-motion/scripts/motion_score.mjs');
const run = (page) => {
  const out = join(mkdtempSync(join(tmpdir(), 'motion-score-')), 'score.json');
  const proc = spawnSync('node', [script, page, '--browser', '--playwright', playwright, '--json', out], {encoding: 'utf8'});
  return {status: proc.status, stdout: proc.stdout, result: JSON.parse(readFileSync(out, 'utf8'))};
};
const keyboard = (r) => r.result.findings.filter((f) => f.rule === 'keyboard');

const bad = run(resolve('tests/fixtures/motion-score/bad.html'));
assert.equal(bad.status, 1);
assert.equal(keyboard(bad).length, 1, bad.stdout);
assert.match(keyboard(bad)[0].measured, /^600ms \((opacity|transform)\)$/);
assert.equal(keyboard(bad)[0].allowed, '0ms after a key press');

const good = run(resolve('tests/fixtures/motion-score/good.html'));
assert.equal(good.status, 0, good.stdout);
assert.deepEqual(good.result.findings, []);

// Negative control: the same page without its keyboard rule must be caught, or the probe proves nothing.
const dir = mkdtempSync(join(tmpdir(), 'motion-score-ungated-'));
const ungated = readFileSync(resolve('tests/fixtures/motion-score/good.html'), 'utf8').replace(/:root\[data-input="keyboard"\][^{]*\{[^}]*\}/, '');
assert.ok(!ungated.includes('transition-duration: 0s !important'));
writeFileSync(join(dir, 'index.html'), ungated);
const caught = run(join(dir, 'index.html'));
assert.ok(keyboard(caught).length >= 1, caught.stdout);
assert.match(keyboard(caught)[0].measured, /^1[28]0ms/);
assert.equal(caught.status, 0, 'warnings alone do not fail the gate above the minimum score');

console.log(`Motion score keyboard probe: bad fixture flagged (${keyboard(bad)[0].selector}), good fixture clean, ungated copy flagged (${keyboard(caught).map((f) => f.selector).join('; ')}).`);
