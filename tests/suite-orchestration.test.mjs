import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('skills');
const names = readdirSync(root).filter((n) => existsSync(resolve(root, n, 'SKILL.md')));
const read = (n) => readFileSync(resolve(root, n, 'SKILL.md'), 'utf8');
const description = (n) => read(n).match(/^description: "(.*)"$/m)?.[1] ?? '';

for (const name of names) {
  test(`${name}: description leads with the job, says when to use it and where it stops`, () => {
    const d = description(name);
    assert.ok(d.length <= 560, `${d.length} characters; hosts cut long descriptions`);
    assert.ok(d.split('. ')[0].length <= 260, 'first sentence carries the job and must survive truncation');
    assert.match(d, /Use (when|for|while)/);
    assert.match(d, /Not for /);
    for (const sibling of d.match(/seenry-[a-z]+/g) ?? []) assert.ok(names.includes(sibling), `${sibling} does not exist`);
  });
}

for (const name of names.filter((n) => n !== 'seenry')) {
  test(`${name}: states what it reads, what it leaves and which skill is next`, () => {
    const s = read(name);
    const block = s.match(/## Hand-off\n\n\| Reads \| Leaves \| Next \|\n\| --- \| --- \| --- \|\n\|(.+)\|\n/);
    assert.ok(block, 'missing the Hand-off table');
    assert.equal(block[1].split(' | ').length, 3);
    assert.ok(s.indexOf('## Hand-off') < 2500, 'the hand-off must sit near the top');
    for (const sibling of block[1].match(/`seenry-[a-z]+`/g) ?? []) assert.ok(names.includes(sibling.slice(1, -1)), `${sibling} does not exist`);
  });
}

test('the main skill routes to every sibling', () => {
  const router = read('seenry').split('## Which skill, and what comes next')[1]?.split('\n## ')[0] ?? '';
  for (const name of names.filter((n) => n !== 'seenry')) assert.ok(router.includes(`\`${name}\``), `${name} is not in the router`);
});
