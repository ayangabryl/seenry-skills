import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rankBlockers, shortBlockers, SHORT_LIMIT} from '../skills/seenry/scripts/blockers.mjs';

const items = [
  {rank: 4, text: 'motion scan: transition-all on .card'},
  {rank: 3, text: '1440px: a section off the page grid ×1'},
  {rank: 0, text: 'brief: write .seenry/brief.md'},
  {rank: 2, text: 'photographs: 2 images not passed', fix: 'Run: node photo_check.mjs a.png'},
  {rank: 1, text: '1440px: the idea stops at the hero ×1'},
  {rank: 0, text: 'approval: no option is picked'},
  {rank: 4, text: 'motion: no :active press state'},
  {text: 'state: an empty list has no empty state'},
];

test('blockers rank by what decides the page, and ties keep their order', () => {
  assert.deepEqual(rankBlockers(items).map(i => i.text.split(':')[0]), ['brief', 'approval', '1440px', 'photographs', '1440px', 'state', 'motion scan', 'motion']);
  assert.equal(rankBlockers([{text: ' '}, {rank: 1, text: 'kept'}]).length, 1, 'an empty line is no blocker');
});

test('the short check prints at most five, with their fixes, and says where the rest are', () => {
  const lines = shortBlockers(items, {total: 12, full: 'review/blockers.txt'});
  const numbered = lines.filter(l => /^ {2}\d+\. /.test(l));
  assert.equal(numbered.length, SHORT_LIMIT);
  assert.match(lines[0], /12 blocker\(s\); the first 5, most important first/);
  assert.match(numbered[0], /1\. brief:/);
  assert.ok(lines.includes('     Run: node photo_check.mjs a.png'), 'a fix line follows its blocker');
  assert.match(lines.at(-1), /review\/blockers\.txt.*--all/);
  assert.ok(lines.length <= SHORT_LIMIT * 2 + 2);
});

test('a short list prints whole, and no blockers print nothing', () => {
  const lines = shortBlockers(items.slice(0, 2), {total: 2});
  assert.deepEqual(lines, ['\n■ 2 blocker(s), most important first:', '  1. 1440px: a section off the page grid ×1', '  2. motion scan: transition-all on .card']);
  assert.deepEqual(shortBlockers([], {total: 0}), []);
});
