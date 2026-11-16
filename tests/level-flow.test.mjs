// What a page needs is enforced by scripts, not prose: the idea line and the image on the default path, the teardown
// template and the pair verdict under --studio, the worked example, and the short spine a weaker model can follow.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, mkdtempSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {cropBoxes, section, slug, unfilled, checkTeardown} from '../skills/seenry/scripts/teardown.mjs';
import {teardownProblems} from '../skills/seenry/scripts/execution_bar.mjs';
import {judgePair, blocked, pairBlocks, pairPrompt} from '../skills/seenry/scripts/judge_pair.mjs';
import {stockTells, composePrompt, validateJob} from '../skills/seenry/scripts/art_prompt.mjs';
import {judgeCharts} from '../skills/seenry/scripts/chart_check.mjs';

const example = resolve('skills/seenry/assets/examples/waterline');

test('crop boxes: a product view inside the first screen, a second section only on a taller page', () => {
  const tall = cropBoxes(3000, 4000);
  assert.deepEqual(tall.whole, {x: 0, y: 0, width: 3000, height: 4000});
  assert.ok(tall.product.y < 2070 && tall.product.y + tall.product.height <= 4000);
  assert.equal(tall.second.y, 2070);
  assert.equal(cropBoxes(3276, 2048).second, undefined);
  assert.deepEqual(cropBoxes(1000, 1000, {product: [0.1, 0.2, 0.5, 0.5]}).product, {x: 100, y: 200, width: 500, height: 500});
  assert.equal(slug('/a/b/Hero Shot 2.JPG'), 'hero-shot-2');
});

test('the template blocks until every blank is a count, and says so in one line', () => {
  const text = '# Teardown\n\n' + section('ref-one', {whole: 'crops/ref-one.whole.png'}) + '\n' + section('ref-two');
  assert.ok(unfilled(text) > 30);
  const problems = teardownProblems(text);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^\d+ blanks \(__\) still to replace .* \(needs 0\)$/);
  assert.deepEqual(checkTeardown(text, {crops: {missing: []}}), problems);
});

test('the worked example passes the checks it teaches', () => {
  assert.deepEqual(teardownProblems(readFileSync(join(example, 'teardown.md'), 'utf8')), []);
  for (const job of JSON.parse(readFileSync(join(example, 'image-job.json'), 'utf8'))) assert.deepEqual(validateJob(job), []);
  const html = readFileSync(join(example, 'screen.html'), 'utf8');
  assert.match(html, /data-seenry-product/);
  assert.match(html, /class="sea front"/);
  for (const f of ['README.md', 'compose.md', 'tokens.css']) assert.ok(existsSync(join(example, f)), f);
  assert.ok(readFileSync(join(example, 'README.md'), 'utf8').split(/\s+/).length < 620);
});

test('the pair judge: a stub answers, off skips, and a yes is a one-line block with the gaps', () => {
  const env = {...process.env};
  try {
    process.env.SEENRY_PAIR_STUB = JSON.stringify({reskin: true, reskin_why: 'same grass, same blue'});
    const v = judgePair({image: 'x.png'});
    assert.equal(v.reskin, true); assert.equal(v.less_finished, false); assert.ok(blocked(v));
    delete process.env.SEENRY_PAIR_STUB; process.env.SEENRY_PAIR_JUDGE = 'off';
    const off = judgePair({image: 'x.png'});
    assert.match(off.skipped, /off/); assert.ok(!blocked(off));
  } finally { process.env = env; }
  const lines = pairBlocks([
    {frame: 'home/a', reference: 'ref.png', verdict: {reskin: false, less_finished: true, gaps: ['product UI: 14 kinds, yours has 1']}},
    {frame: 'home/b', reference: 'ref.png', verdict: {reskin: false, less_finished: false, gaps: []}},
    {frame: 'home/c', reference: 'ref.png', verdict: {skipped: 'no model'}},
  ]);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^home\/a: visibly less finished than ref\.png: product UI: 14 kinds, yours has 1\. Fix it, then run verify again\.$/);
  assert.match(pairPrompt({}), /reskin/);
});

test('a negated stock word is direction, not a tell, and the composed prompt reads as sentences', () => {
  assert.deepEqual(stockTells('a lawyer reading, no corporate smile, not looking at the camera'), []);
  assert.deepEqual(stockTells('a smiling lawyer'), ['smiling']);
  const p = composePrompt({subject: 'A hand', concept: 'the clause that matters most', palette: {shadows: '#111111', highlights: '#eeeeee', accent: '#aa0000'}, grade: 'duotone', light: 'window light', light_reason: 'because it admits one source', texture: 'none', texture_reason: 'the page is clean', placement: {slot: 'the hero', field: 'none', mode: 'cutout'}, prop: 'a seal'});
  assert.ok(!/because because|because admits|keep none/i.test(p), p);
  assert.match(p, /Light: window light \(it admits one source\)\./);
  assert.ok(!/Empty field/.test(p));
});

test('words in a row beside a chart are not chart labels colliding', () => {
  const line = Array.from({length: 40}, (_, i) => [100 + i * 10, 300 - i * 3]);
  const chart = {el: 'svg', kind: 'svg', x: 100, y: 100, w: 400, h: 240, bars: [], series: [{points: line, stroked: true, el: 'path'}],
    texts: [{text: '$3M', x: 60, y: 110, w: 24, h: 12}, {text: '$2M', x: 60, y: 200, w: 24, h: 12}, {text: '$1M', x: 60, y: 290, w: 24, h: 12},
      {text: 'Forecast', html: true, inside: false, x: 120, y: 360, w: 60, h: 14}, {text: 'Forecast', html: true, inside: false, x: 150, y: 366, w: 60, h: 14}]};
  assert.deepEqual(judgeCharts([chart]).chartCollision, []);
  chart.texts.push({text: '90%', x: 300, y: 100, w: 30, h: 12}, {text: '70%', x: 310, y: 104, w: 30, h: 12});
  assert.equal(judgeCharts([chart]).chartCollision.length, 1);
});

test('the spine is short enough to follow: nine steps, the idea and the image before any page, under 1,300 words', () => {
  const skill = readFileSync(resolve('skills/seenry/SKILL.md'), 'utf8'), canvas = readFileSync(resolve('skills/seenry-canvas/SKILL.md'), 'utf8');
  // Both are shorter than in 3.1.0 (1,297 and 2,905 words): the fast path replaced text, it was not added beside it.
  assert.ok(skill.split(/\s+/).length < 1297, `${skill.split(/\s+/).length} words`);
  assert.ok(canvas.split(/\s+/).length < 2905, `${canvas.split(/\s+/).length} words`);
  const steps = [...skill.matchAll(/^\| (\d) \| \*\*([A-Z][a-z]+)\.\*\*/gm)].map(m => `${m[1]} ${m[2]}`);
  assert.deepEqual(steps, ['1 Brief', '2 References', '3 Ideas', '4 Images', '5 Sketches', '6 Pick', '7 Extend', '8 Build', '9 Check']);
  assert.match(skill, /First sketches are on the canvas within 5 minutes; no step loops more than twice/);
  // The model judges and the written teardown are off the default path, in both skills.
  for (const text of [skill, canvas]) {
    assert.doesNotMatch(text, /verify --quick|--mode quick/);
    assert.ok((text.match(/teardown/g) || []).length <= 1, 'the teardown is named once, under --studio');
    assert.match(text, /seenry-idea/); assert.match(text, /--background/);
  }
  assert.match(skill, /check\.mjs <page> --brief \.seenry\/brief\.md` \|/);
  for (const ref of ['references/level-bar.md', 'references/execution-bar.md', 'references/level-reference.md']) {
    const words = readFileSync(resolve('skills/seenry', ref), 'utf8').split(/\s+/).length;
    assert.ok(words < 650, `${ref}: ${words} words`);
  }
});

test('the level eval prints one run per brief and model, on a Sonnet-class model and Codex by default', () => {
  const out = mkdtempSync(join(tmpdir(), 'seenry-eval-'));
  const r = spawnSync(process.execPath, [resolve('evals/level/run.mjs'), '--dry', '--out', out], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  assert.equal((r.stdout.match(/^claude:sonnet  /gm) || []).length, 5);
  assert.equal((r.stdout.match(/^codex  /gm) || []).length, 5);
  assert.match(readFileSync(join(out, 'codex', 'fleet-dispatch', '.seenry', 'brief.md'), 'utf8'), /Northbound/);
});

test('the worked example covers a whole page and is itself guarded against being copied', async () => {
  const html = readFileSync(join(example, 'screen.html'), 'utf8');
  for (const part of ['class="tiles"', 'class="pipe"', 'class="proof"', 'class="tide"', 'class="close"']) assert.ok(html.includes(part), part);
  assert.ok(existsSync(join(example, 'waterline-example.jpg')));
  const {judgePair, pairBlocks, blocked} = await import('../skills/seenry/scripts/judge_pair.mjs');
  process.env.SEENRY_EXAMPLE_STUB = '{"reskin":true,"reskin_why":"the same hero and section order"}';
  const verdict = judgePair({image: 'x', example: true});
  delete process.env.SEENRY_EXAMPLE_STUB;
  assert.ok(blocked(verdict) && verdict.example);
  assert.match(pairBlocks([{frame: '01-home/a', reference: 'waterline-example.jpg', verdict}])[0], /worked example with a new skin.*own hero arrangement/);
});

test('the eval reads the gate from its own record and marks a run with no gate invalid', () => {
  const out = mkdtempSync(join(tmpdir(), 'seenry-eval-'));
  const r = spawnSync(process.execPath, [resolve('evals/level/run.mjs'), '--dry', '--out', out, '--models', 'codex', '--briefs', 'clinic-scheduling'], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /--dangerously-bypass-approvals-and-sandbox/);
  const src = readFileSync(resolve('evals/level/run.mjs'), 'utf8');
  assert.match(src, /row\.invalid = !row\.gateRan/);
  assert.match(src, /row\.pass = !row\.invalid && !!row\.stack/);
  assert.doesNotMatch(src, /workspace-write'/);
});
