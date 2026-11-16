import test from 'node:test';
import assert from 'node:assert/strict';
import {judgeExecution, hueFamilies, teardownProblems, KINDS, INVENTORY_FLOOR} from '../skills/seenry/scripts/execution_bar.mjs';

const product = extra => ({el: 'div.app', w: 1100, h: 600, kinds: KINDS.slice(0, 14), vis: ['chart: curve', 'mini: ticks', 'mini: bars'], ...extra});
const page = extra => ({width: 1440, product: product(), chart: true, hues: [[264, 900000]], productHues: [[264, 40000]], head: {size: 68, weight: 300, lines: 2, text: 'Know your lowest week'}, ...extra});

test('a whole app in one hue with a two-line headline passes', () => {
  assert.deepEqual(judgeExecution(page()), {thinProduct: [], template: [], offGrid: [], notes: [], families: [{hue: 264, share: 1, name: 'blue'}]});
});

test('one chart in a box is a thin product view', () => {
  const {thinProduct} = judgeExecution(page({product: product({kinds: ['chart', 'value axis', 'legend', 'tabs or segmented control', 'tooltip or selected state', 'primary action'], vis: ['chart: bars']})}));
  assert.equal(thinProduct.length, 2);
  assert.match(thinProduct[0], new RegExp(`6 kinds of UI, needs ${INVENTORY_FLOOR}`));
  assert.match(thinProduct[1], /1 kind of visualisation/);
});

test('a second hue across the page is a note, and the level reference can allow it', () => {
  const data = page({hues: [[190, 700000], [8, 120000]], productHues: []});
  assert.match(judgeExecution(data).notes[0], /2 saturated hue families.*teal.*red.*\[multiHue\]/);
  assert.deepEqual(judgeExecution(data, {allow: ['multiHue']}).notes, []);
});

test('a status hue that is small on the page still counts inside the product view', () => {
  const data = page({hues: [[190, 990000], [8, 3000], [150, 2000]], productHues: [[190, 60000], [8, 3000]]});
  const {families, notes} = judgeExecution(data);
  assert.deepEqual(families.map(f => f.name), ['teal', 'red']);
  assert.match(notes[0], /red 5% of the product view/);
});

test('reds on both sides of zero degrees are one family', () => {
  assert.deepEqual(hueFamilies([[352, 100], [6, 100], [20, 50]]).map(f => f.name), ['red']);
});

test('a three-line or oversized headline is a note at desktop width only', () => {
  const big = {size: 104, weight: 400, lines: 3, text: 'Mind the waterline on your cash.'};
  assert.equal(judgeExecution(page({head: big})).notes.length, 2);
  assert.deepEqual(judgeExecution(page({head: big}), {allow: ['bigHead']}).notes, []);
  assert.deepEqual(judgeExecution(page({head: big, width: 390})).notes, []);
});

test('a chart with no marked product view asks for the mark', () => {
  assert.match(judgeExecution(page({product: null})).notes[0], /no product view is marked data-seenry-product/);
  assert.deepEqual(judgeExecution(page({product: null, chart: false})).notes, []);
});

const good = `# Teardown
## Qredible
- 22 UI elements in the app window, 2 visualisation types. Headline 64px, weight 300, 2 lines. 1 hue.
- Interlock: grass in front of the app over its lower 40%. Motif repeats in 3 tiles. 6 logos as marks. Pill tabs, 4 of them.
## Integration page
- 18 UI elements, 3 visualisation types, 4 metric cards. Headline 68px, weight 300, 2 lines. 1 hue on black.
- Interlock: translucent at the top, melts into the page over 120px. Motif: the logo tile repeats. 6 logos. Button 40px with a 28px icon tile.`;

test('a teardown with a measured section per reference passes', () => {
  assert.deepEqual(teardownProblems(good), []);
});

test('a missing, single-reference or adjective-only teardown fails', () => {
  assert.deepEqual(teardownProblems(''), ['it does not exist']);
  assert.match(teardownProblems(good.split('## Integration page')[0])[0], /1 reference section/);
  const vague = '# Teardown\n## A\n' + 'Clean, premium and confident with a strong hero and lovely type. '.repeat(4) + '\n## B\n' + 'Modern and calm with a pleasant dashboard and soft colours. '.repeat(4);
  const problems = teardownProblems(vague);
  assert.ok(problems.some(p => /fewer than five numbers/.test(p)), problems.join(' | '));
  assert.ok(problems.some(p => /not measured: .*UI element count/.test(p)), problems.join(' | '));
});

test('the same crop in three sibling tiles blocks, and a section of equal cards is a note', () => {
  const found = judgeExecution({width: 1440, product: null, chart: false, hues: [], productHues: [], head: null, page: {sameCrop: [{image: 'room.jpg', tiles: 3, where: 'div.tiles'}], plain: ['Priced by practitioner']}});
  assert.equal(found.template.length, 1);
  assert.match(found.template[0], /room\.jpg at the same crop in 3 tiles \(needs 1\)/);
  assert.ok(found.notes.some(n => /"Priced by practitioner".*0 moments \(needs 1\)/.test(n)), JSON.stringify(found.notes));
  assert.deepEqual(judgeExecution({width: 1440, product: null, hues: [], productHues: [], head: null}).template, []);
});

test('one grid: a wider block blocks, a centred or left-aligned one inside it does not, and a reason is accepted', () => {
  const block = (name, left, right, reason = '') => ({name, reason, edges: {left, right}});
  const page = grid => ({width: 1440, product: null, hues: [], productHues: [], head: null, page: {vw: 1440, grid}});
  const base = [block('Hero', 128, 1312), block('Proof', 128, 1312), block('Closing', 128, 1312)];
  const found = judgeExecution(page([...base, block('Moves', 80, 1360)])).offGrid;
  assert.deepEqual(found, ['Section "Moves" is 1280 wide (80 to 1360); the grid is 1184 (128 to 1312). Align it or add data-seenry-inset with the reason.']);
  assert.deepEqual(judgeExecution(page([...base, block('Quote', 320, 1120), block('Text', 128, 760), block('Wide', 80, 1360, 'the gallery runs wider than the text')])).offGrid, []);
  assert.equal(judgeExecution(page([...base, block('Odd', 200, 1000)])).offGrid.length, 1);
  assert.deepEqual(judgeExecution({...page([...base, block('Moves', 80, 1360)]), page: {vw: 390, grid: [...base, block('Moves', 0, 390)]}}).offGrid, []);
});
