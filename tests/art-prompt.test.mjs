import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {validateJob, composePrompt, stockTells, rawWarnings} from '../skills/seenry/scripts/art_prompt.mjs';

const image = fileURLToPath(new URL('../skills/seenry/scripts/image.mjs', import.meta.url));
const good = {
  out: 'counsel.png',
  subject: 'A woman general counsel in her 40s reading one sheet of contract paper held close',
  concept: 'the moment a lawyer finds the one clause that matters',
  palette: {shadows: '#2B1314', highlights: '#E6E0D5', accent: '#6B1F24'},
  grade: 'desaturated-one-accent',
  light: 'one hard window light from the left',
  light_reason: 'legal work happens alone by a window',
  texture: 'heavy 35mm grain',
  texture_reason: 'it matches the paper texture of the page',
  placement: {slot: 'testimonial portrait', field: 'the left two-thirds', mode: 'tile'},
  prop: 'a small wax seal on the paper',
};
const run = (jobs, ...flags) => {
  const dir = mkdtempSync(join(tmpdir(), 'art-prompt-'));
  writeFileSync(join(dir, 'jobs.json'), JSON.stringify(jobs));
  return spawnSync(process.execPath, [image, '--batch', join(dir, 'jobs.json'), '--dry', ...flags], {cwd: dir, encoding: 'utf8', env: {...process.env, SEENRY_DIR: join(dir, '.seenry')}});
};

test('a fully art-directed job validates and composes every decision into the prompt', () => {
  assert.deepEqual(validateJob(good), []);
  const p = composePrompt(good);
  for (const part of ['#2B1314', '#E6E0D5', '#6B1F24', 'wax seal', 'Concept:', '(legal work', 'grain', 'left two-thirds', 'framed tile']) assert.ok(p.includes(part), part);
});

test('missing fields are each named', () => {
  const errors = validateJob({subject: 'a lawyer', out: 'x.png'});
  for (const k of ['concept', 'palette.shadows', 'palette.accent', 'grade', 'light_reason', 'texture', 'placement.field', 'placement.mode', 'prop']) assert.ok(errors.some(e => e.startsWith(k)), k);
});

test('bad hex, unknown grade, unknown mode and a concept that repeats the subject are refused', () => {
  const errors = validateJob({...good, palette: {...good.palette, accent: 'red'}, grade: 'moody', placement: {...good.placement, mode: 'float'}, concept: good.subject});
  assert.ok(errors.some(e => e.startsWith('palette.accent')));
  assert.ok(errors.some(e => e.startsWith('grade:')));
  assert.ok(errors.some(e => e.startsWith('placement.mode')));
  assert.ok(errors.some(e => e.startsWith('concept: repeats')));
});

test('full colour needs a reason; a palette string is accepted', () => {
  assert.ok(validateJob({...good, grade: 'full-color'}).some(e => e.startsWith('grade_reason')));
  assert.deepEqual(validateJob({...good, palette: '#2b1314, #e6e0d5, #6b1f24'}), []);
});

test('stock briefs are caught', () => {
  assert.ok(stockTells('female general counsel in a charcoal blazer, bright modern office, holding a contract, smiling').length >= 2);
  assert.ok(validateJob({...good, subject: 'business people smiling in a modern office'}).some(e => e.includes('stock brief')));
  assert.ok(rawWarnings('a man smiling').some(w => w.includes('no art direction')));
});

test('image.mjs refuses a free-text prompt unless --raw, and prints the composed prompt with --dry', () => {
  const stock = [{out: 'b.png', prompt: 'female general counsel in a charcoal blazer, bright modern office, holding a contract, smiling'}];
  const refused = run(stock);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /not art direction/);
  const raw = run(stock, '--raw');
  assert.equal(raw.status, 0);
  assert.match(raw.stderr, /stock tell: smiling/);
  const ok = run([good]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /#6B1F24/);
  const missing = run([{out: 'c.png', subject: 'a truck'}]);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /concept: missing/);
});
