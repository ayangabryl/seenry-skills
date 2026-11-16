import test from 'node:test';
import assert from 'node:assert/strict';
import {judgeCharts} from '../skills/seenry/scripts/chart_check.mjs';

const curve = (x0, y0, w) => Array.from({length: 60}, (_, i) => [x0 + i * w / 59, y0 + 40 + Math.round(30 * Math.sin(i / 6) + i)]);
const chart = extra => ({el: 'svg.curve', kind: 'svg', x: 0, y: 0, w: 600, h: 240, bars: [], texts: [], series: [{points: curve(40, 0, 560), stroked: true, el: 'path'}], ...extra});
const yTicks = ['100%', '75%', '50%', '25%', '0%'].map((text, i) => ({text, x: 4, y: 10 + i * 50, w: 30, h: 14}));

test('a line chart with no value axis is a bare chart', () => {
  const {bareChart} = judgeCharts([chart({texts: [{text: '90%', x: 150, y: 10, w: 28, h: 14}, {text: 'Reno · mi 0', x: 40, y: 250, w: 70, h: 14}]})]);
  assert.equal(bareChart.length, 1);
});

test('a line chart with aligned value ticks passes', () => {
  const {bareChart, chartCollision} = judgeCharts([chart({texts: yTicks})]);
  assert.deepEqual(bareChart, []);
  assert.deepEqual(chartCollision, []);
});

test('a label sitting on the line, and two overlapping labels, are collisions', () => {
  const p = curve(40, 0, 560)[30];
  const {chartCollision} = judgeCharts([chart({texts: [...yTicks, {text: '31%', x: p[0] - 5, y: p[1] - 5, w: 24, h: 14}, {text: 'Now', x: 300, y: 200, w: 40, h: 14}, {text: '90%', x: 320, y: 205, w: 30, h: 14}]})]);
  assert.ok(chartCollision.some(c => c.includes('"31%" sits on the line')));
  assert.ok(chartCollision.some(c => c.includes('"Now" overlaps "90%"')));
});

test('orthogonal decorative traces are not charts', () => {
  const trace = [[0, 50], [70, 50], [70, 200], [200, 200]].flatMap(([x, y], i, a) => i ? Array.from({length: 20}, (_, k) => [a[i - 1][0] + (x - a[i - 1][0]) * k / 19, a[i - 1][1] + (y - a[i - 1][1]) * k / 19]) : []);
  assert.deepEqual(judgeCharts([chart({series: [{points: trace, stroked: true, el: 'path'}]})]).bareChart, []);
});

test('bars on one baseline need ticks on an axis; a marked canvas with none is bare', () => {
  const bars = [0, 1, 2, 3].map(i => ({x: 60 + i * 80, y: 100 - i * 10, w: 40, h: 100 + i * 10}));
  assert.equal(judgeCharts([chart({series: [], bars})]).bareChart.length, 1);
  const xTicks = ['Q1', 'Q2', 'Q3', 'Q4'].map((text, i) => ({text, x: 60 + i * 80, y: 210, w: 20, h: 14}));
  assert.deepEqual(judgeCharts([chart({series: [], bars, texts: xTicks})]).bareChart, []);
  assert.equal(judgeCharts([{el: 'canvas', kind: 'canvas', x: 0, y: 0, w: 400, h: 200, series: [], bars: [], marked: true, texts: []}]).bareChart.length, 1);
});
