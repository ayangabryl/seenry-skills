// Executes the actual gallery close listener and Menu controller with the full
// runtime. Native focus scrolling is modeled from the HTML focus() contract;
// browser scroll anchoring, paint and hit ownership still require fresh capture.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const galleryPath = path.join(__dirname, '../skills/seenry/assets/components/transitions/gallery.js');
const source = fs.readFileSync(galleryPath, 'utf8');
const start = source.includes(' let detailReturnOwned =') ? source.indexOf(' let detailReturnOwned =') : source.indexOf(' function restoreStage()');
const restoreSource = source.slice(start, source.indexOf(' for (const card of cards) {', start));
const modelPath = path.join(__dirname, 'transitions-gallery-menu.test.cjs');
const model = {require: id => id === 'node:test' ? {test() {}} : require(id), __dirname, process, console};
vm.runInNewContext(fs.readFileSync(modelPath, 'utf8') + '\nthis.makeFixture = fixture;', model, {filename: modelPath});
function setup(top = 864.0625) {
 const f = model.makeFixture(), card = f.stage.parentElement, title = card.querySelector('.title-link');
 const detail = new f.E('dialog'), preview = new f.E(), close = new f.E('button'), other = new f.E('input');
 detail.id = 'library-detail'; detail.dataset.st = 'sheet'; close.dataset.stClose = ''; preview.id = 'detail-preview';
 detail.append(close, preview); f.doc.body.append(detail, other); preview.append(f.stage);
 title.rect = {left: 34, top: 449.0625, width: 37.234375, height: 44};
 const focusCalls = [], hash = [];
 const revealCalls = [];
 const focus = title.focus.bind(title); title.focus = options => {
  const wasFocused = f.doc.activeElement === title;
  focusCalls.push({options, restored: f.stage.parentElement === card, top: title.rect.top});
  focus(options);
  // Chromium does not scroll when focus() targets the element that already has
  // focus (CI run 37144824068: every detail profile left the refocused heading at
  // y=944 in a 780px viewport). Only a real focus change scrolls here.
  if (!wasFocused && f.doc.activeElement === title && !options?.preventScroll) title.rect.top = (820 - 44) / 2;
 };
 title.scrollIntoView = options => { revealCalls.push({options, restored: f.stage.parentElement === card}); title.rect.top = (820 - 44) / 2; };
 const prepend = card.prepend.bind(card); card.prepend = stage => { prepend(stage); title.rect.top = top; };
 const scope = {document: f.doc, detail, detailCard: card, stageHome: card, menuDemo: f.controller, category: 'All', $: () => preview, setHash: value => hash.push(value)};
 vm.runInNewContext(restoreSource, scope, {filename: galleryPath});
 title.focus({preventScroll: true}); f.S.init(detail); f.S.open(detail, title, {keyboard: true}); close.focus();
 focusCalls.length = 0;
 const finish = async () => { f.S.close(detail); await f.settle(); };
 return {...f, card, title, detail, preview, close, other, focusCalls, revealCalls, hash, scope, finish};
}
for (const top of [912.0625, 864.0625]) {
 test(`actual Menu detail close reveals the already-focused restored heading at ${top}px`, async () => {
  const f = setup(top); await f.finish();
  assert.equal(f.stage.parentElement, f.card); assert.equal(f.doc.activeElement, f.title);
  assert.equal(f.title.rect.top, 388); assert(f.title.rect.top + 44 <= 820);
  assert(f.revealCalls.some(call => call.restored) || f.focusCalls.some(call => call.restored && !call.options?.preventScroll), 'The heading must be revealed after the full stage is restored');
  assert.equal(f.scope.detailCard, null); assert.equal(f.scope.stageHome, null); assert.equal(f.hash.at(-1), '');
 });
}
test('a restored heading is revealed without forcing a focus ring', async () => {
 const f = setup(768.0625); await f.finish();
 assert.equal(f.doc.activeElement, f.title); assert.equal(f.title.rect.top, 388);
 assert(!f.focusCalls.some(call => call.restored && call.options?.focusVisible), 'Returned focus must not force a ring');
});
for (const removed of [false, true]) {
 test(`newer focus${removed ? ' then removal' : ''} during detail exit cannot be reclaimed`, async () => {
  const f = setup(); f.S.close(f.detail); f.other.focus(); if (removed) f.other.remove(); await f.settle();
  assert.equal(f.doc.activeElement, removed ? f.doc.body : f.other);
  assert.equal(f.stage.parentElement, f.card); assert(!f.focusCalls.some(call => call.restored)); assert(!f.revealCalls.length);
 });
}
test('newer focus during restoration is preserved even if it ends back on the title', async () => {
 const f = setup(), prepend = f.card.prepend;
 f.card.prepend = stage => { prepend(stage); f.other.focus(); f.title.focus({preventScroll: true}); };
 await f.finish();
 assert.equal(f.doc.activeElement, f.title); assert.equal(f.title.rect.top, 864.0625);
 assert(!f.focusCalls.some(call => call.restored && !call.options?.preventScroll)); assert(!f.revealCalls.length);
});
test('a stale parent close while the detail is reopened cannot restore its stage', () => {
 const f = setup(); assert(f.detail.open); f.detail.dispatchEvent(new f.Event('st:close', {bubbles: true}));
 assert.equal(f.stage.parentElement, f.preview); assert.equal(f.scope.detailCard, f.card); assert(f.detail.open);
});
test('nested child close does not restore the outer detail or change its hash', () => {
 const f = setup(); f.find('[data-menu-editor]').dispatchEvent(new f.Event('st:close', {bubbles: true}));
 assert.equal(f.stage.parentElement, f.preview); assert(f.detail.open); assert.equal(f.hash.length, 0);
});
