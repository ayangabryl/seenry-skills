import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {motionDocProblems, motionRows} from '../skills/seenry/scripts/motion_doc.mjs';

const head = '| Moves | Trigger | What moves | Duration | Easing | Explains | Reduced motion |\n| --- | --- | --- | --- | --- | --- | --- |\n';

test('the worked example states a reason and a still state for every movement', () => {
  const text = readFileSync(resolve('skills/seenry/assets/examples/waterline/MOTION.md'), 'utf8');
  assert.deepEqual(motionDocProblems(text), []);
  assert.equal(motionRows(text).rows.length, 3);
  const css = readFileSync(resolve('skills/seenry/assets/examples/waterline/screen.html'), 'utf8');
  assert.match(css, /@keyframes wl-rise/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('a missing file, a row with no reason, no signature moment and two loops each say what is needed', () => {
  assert.match(motionDocProblems('')[0], /does not exist/);
  assert.match(motionDocProblems('# Motion\n\nEverything fades up.')[0], /no table with an "Explains" column/);
  const weak = motionDocProblems(head + '| Cards | Scroll | Fade up | 600ms | ease | | |\n');
  assert.ok(weak.some(p => /1 of 1 rows give no change/.test(p)) && weak.some(p => /no reduced-motion state/.test(p)) && weak.some(p => /signature moment/.test(p)), weak.join('; '));
  const loops = motionDocProblems('Signature moment: the tide.\n' + head + '| Tide | Idle loop | Sways | 8s | linear | The sea is the product | Still |\n| Glow | Idle loop | Pulses | 2s | ease | Draws the eye | Off |\n');
  assert.deepEqual(loops.length, 1);
  assert.match(loops[0], /2 idle loops \(needs 1 at most/);
});
