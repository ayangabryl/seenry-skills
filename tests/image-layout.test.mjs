import test from 'node:test';
import assert from 'node:assert/strict';
import {judgeImageLayout} from '../skills/seenry/scripts/image_layout.mjs';

const sec = {x: 0, y: 1000, w: 1440, h: 800};
const image = extra => ({el: 'img.photo', section: 'section.story', x: 520, y: 1200, w: 400, h: 300, sec, others: [], positioned: false, treated: false, radius: 8, cutout: false, ...extra});

test('a small boxed image alone in an empty band is a floating image', () => {
  const {floatingImage, premium} = judgeImageLayout([image()]);
  assert.equal(floatingImage.length, 1);
  assert.match(floatingImage[0], /empty space on both sides/);
  assert.deepEqual(premium, []);
});

test('a mid-size boxed image with empty margins is a premium note, not a blocker', () => {
  const {floatingImage, premium} = judgeImageLayout([image({x: 300, w: 760, h: 400})]);
  assert.deepEqual(floatingImage, []);
  assert.equal(premium.length, 1);
});

test('an image with text or a card beside it in its band passes', () => {
  const beside = {x: 980, y: 1250, w: 380, h: 120};
  const {floatingImage, premium} = judgeImageLayout([image({x: 80, others: [beside]})]);
  assert.deepEqual(floatingImage, []);
  assert.deepEqual(premium, []);
});

test('an image with UI or type laid over it passes', () => {
  const card = {x: 700, y: 1400, w: 300, h: 160};
  assert.deepEqual(judgeImageLayout([image({others: [card]})]).floatingImage, []);
});

test('a large image owning its section passes', () => {
  assert.deepEqual(judgeImageLayout([image({x: 0, y: 1000, w: 1440, h: 700})]).floatingImage, []);
});

test('blended, masked or cut-out images are composed by definition', () => {
  assert.deepEqual(judgeImageLayout([image({treated: true}), image({cutout: true})]).floatingImage, []);
});

test('three or more corner radii across framed images is a premium note', () => {
  const tile = r => image({x: 80, w: 400, radius: r, others: [{x: 600, y: 1250, w: 300, h: 100}]});
  const {premium} = judgeImageLayout([tile(0), tile(8), tile(20)]);
  assert.ok(premium.some(p => /3 corner radii/.test(p)));
});
