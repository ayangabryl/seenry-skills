import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve('skills/seenry-motion');
const skill = readFileSync(resolve(root, 'SKILL.md'), 'utf8');
const refs = readdirSync(resolve(root, 'references')).filter((f) => f.endsWith('.md'));
const ref = (name) => readFileSync(resolve(root, 'references', name), 'utf8');

test('SKILL.md decides whether to move first, then gives the values, the steps, the output and the stop gate', () => {
  const order = ['## Hand-off', '## 1. Should it move at all?', '## 2. Exact values', '## 3. Build steps', '## 4. Output: `MOTION.md`', '## 5. Stop gate'].map((h) => skill.indexOf(h));
  assert.ok(order.every((i) => i > 0), 'a section is missing');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections are out of order');
  assert.ok(skill.indexOf('--ease-out: cubic-bezier(0.16, 1, 0.3, 1)') < skill.indexOf('## 3. Build steps'), 'the curves belong with the values');
  const words = skill.split(/\s+/).filter(Boolean).length;
  assert.ok(words <= 1560, `${words} words; the body is read once and its top is what survives`);
  for (const row of ['Press', 'Tooltip', 'Menu, dropdown, popover', 'Dialog', 'Sheet, drawer', 'Toast', 'Tab indicator', 'Accordion', 'Number', 'Staggered group']) assert.ok(skill.includes(`| ${row} |`), `no value row for ${row}`);
  assert.match(skill, /node scripts\/motion_score\.mjs/);
  assert.match(skill, /\| Moves \| Trigger \| What moves \| Duration \| Easing \| Explains \| Reduced motion \|/);
});

test('the skill and the starter tokens name the same curves', () => {
  const tokens = readFileSync(resolve('skills/seenry/assets/tokens.css'), 'utf8');
  for (const curve of ['--ease-out: cubic-bezier(0.16, 1, 0.3, 1)', '--ease-move: cubic-bezier(0.4, 0, 0.2, 1)']) {
    assert.ok(tokens.includes(curve), `tokens.css: ${curve}`);
    assert.ok(skill.includes(curve), `SKILL.md: ${curve}`);
    assert.ok(ref('recipes.md').includes(curve), `recipes.md: ${curve}`);
  }
});

test('at most twelve references, each one level deep with a stated trigger and a contents list past 100 lines', () => {
  assert.ok(refs.length <= 12, `${refs.length} reference files`);
  assert.deepEqual(readdirSync(resolve(root, 'references')).filter((f) => !f.endsWith('.md')), [], 'no folders under references');
  for (const name of refs) {
    const text = ref(name);
    assert.match(text.split('\n').slice(0, 4).join('\n'), /^\*\*Read when:\*\* /m, `${name} does not say when to read it`);
    if (text.split('\n').length > 100) assert.match(text, /^## Contents$/m, `${name} is long and has no contents list`);
    assert.ok(skill.includes(`(references/${name})`) || skill.includes(`(references/${name}#`), `${name} is not linked from SKILL.md`);
  }
});

test('the common set of transitions each has a recipe', () => {
  const surfaces = ref('recipes.md'), state = ref('recipes-state.md');
  for (const h of ['Press feedback', 'Menu, dropdown, popover', 'Tooltip', 'Dialog', 'Sheet and drawer', 'Toast', 'Tabs with a sliding indicator', 'Accordion', 'Page and shared-element transition']) assert.match(surfaces, new RegExp(`^## ${h}$`, 'm'), h);
  for (const h of ['Number change', 'Icon swap', 'Checkbox, toggle, success check', 'Skeleton to content', 'List add, remove, reorder', 'Error shake', 'AI thinking and streaming text', 'Staggered group', 'Scroll reveal']) assert.match(state, new RegExp(`^## ${h}$`, 'm'), h);
  for (const lib of ['Base UI', 'Sonner', 'Vaul', 'NumberFlow', 'Motion']) assert.ok((surfaces + state).includes(lib), `${lib} is not named where it does the job better`);
  assert.match(surfaces, /prefers-reduced-motion: reduce/);
  assert.match(surfaces, /data-input="keyboard"/);
});

test('every bundled asset is reached from a reference, and nothing links to a removed one', () => {
  const all = refs.map(ref).join('\n') + skill;
  for (const entry of readdirSync(resolve(root, 'assets'))) {
    if (/\.test\.mjs$|-demo\.html$|^number-flow$/.test(entry)) continue;
    assert.ok(all.includes(`assets/${entry}`), `assets/${entry} is not referenced by any guide`);
  }
  for (const m of all.matchAll(/\]\((\.\.\/assets\/[^)#]+)/g)) assert.ok(existsSync(resolve(root, 'references', m[1])), `missing ${m[1]}`);
});
