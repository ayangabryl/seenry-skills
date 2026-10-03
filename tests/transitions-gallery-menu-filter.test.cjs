// Causal filter interruption checks with the actual gallery/controller/runtime.
// Deterministic DOM/WAAPI only; not native rendering or browser acceptance.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const galleryPath = path.resolve(process.env.SEENRY_MENU_FILTER_SOURCE || path.join(__dirname, '../skills/seenry/assets/components/transitions/gallery.js'));
const gallery = fs.readFileSync(galleryPath, 'utf8');
const filterSource = gallery.slice(gallery.indexOf(' async function filter('), gallery.indexOf(' const setHash ='));
const keyStart = gallery.indexOf(" document.addEventListener('keydown', e => {");
const shortcutSource = gallery.slice(keyStart, gallery.indexOf(' function showDetail(', keyStart));
assert(filterSource.includes('c.hidden = !wanted.includes(c)'));
assert(shortcutSource.includes("e.key === '/'"));
const modelPath = path.join(__dirname, 'transitions-gallery-menu.test.cjs');
const model = {require: id => id === 'node:test' ? {test() {}} : require(id), __dirname, process, console};
vm.runInNewContext(fs.readFileSync(modelPath, 'utf8') + '\nthis.makeFixture = fixture;', model, {filename: modelPath});

function prepare() {
 const f = model.makeFixture(), card = f.stage.parentElement;
 const search = new f.E('input'), other = new f.E('article'), caption = new f.E(), title = new f.E('h3'), description = new f.E('p'), empty = new f.E();
 search.id = 'library-search'; search.value = '';
 other.className = 'card'; other.dataset.category = 'Surfaces'; other.dataset.key = 'dialog';
 caption.className = 'caption'; title.textContent = 'Dialog'; description.textContent = 'A focused confirmation';
 caption.append(title, description); other.append(caption); f.host.append(other); f.doc.body.append(search, empty);
 let suspendCalls = 0;
 const beforeHide = [];
 const snapshot = () => ({cardHidden: card.hidden, nativeOpen: !!f.menu.popoverOpen, managedOpen: f.menu.dataset.stOpen, inert: f.menu.inert, expanded: f.find('#menu-trigger').getAttribute('aria-expanded'), focus: f.doc.activeElement, state: f.controller.getState()});
 const S = {...f.S, flip(...args) { beforeHide.push(snapshot()); return f.S.flip(...args); }};
 const scope = {cards: [card, other], search, S, document: f.doc, $: () => empty, reduce: () => false, menuDemo: {suspend() { ++suspendCalls; f.controller.suspend(); }}};
 vm.runInNewContext('let category="All",filterVersion=0;\n' + filterSource + '\n' + shortcutSource + '\nthis.runFilter=filter;this.setCategory=value=>category=value;', scope, {filename: galleryPath});
 const openThenSearch = () => {
  f.key(f.find('#menu-trigger'), 'ArrowDown');
  assert.equal(f.doc.activeElement, f.find('[data-menu-action="rename"]'));
  const slash = f.key(f.doc.activeElement, '/');
  assert(slash.defaultPrevented); assert.equal(f.doc.activeElement, search);
 };
 const finish = async pending => { await f.settle(); await pending; };
 return {...f, card, search, other, beforeHide, snapshot, openThenSearch, finish, runFilter: scope.runFilter, setCategory: scope.setCategory, suspendCount: () => suspendCalls};
}
function assertRetired(f, record = f.snapshot()) {
 assert.equal(record.nativeOpen, false, 'Native popover must retire before its host is hidden');
 assert.equal(record.managedOpen, 'false'); assert.equal(record.inert, true); assert.equal(record.expanded, 'false');
 assert.equal(record.focus, f.search, 'Filtering must preserve the newer Search focus owner');
}

test('accepted filter-away retires Menu before the actual hide and preserves Search Escape', async () => {
 const f = prepare(); f.openThenSearch(); f.search.value = 'Dialog';
 const pending = f.runFilter();
 assert(!f.card.hidden); assert.equal(f.suspendCount(), 0, 'Pending fade is not yet an accepted hide');
 await f.finish(pending);
 assert.equal(f.suspendCount(), 1); assert.equal(f.beforeHide.length, 1);
 assert.equal(f.beforeHide[0].cardHidden, false); assertRetired(f, f.beforeHide[0]);
 assert(f.card.hidden); assert(!f.other.hidden); assertRetired(f);
 assert.equal(f.key(f.search, 'Escape').defaultPrevented, false, 'A retired Menu cannot consume Search Escape');
});
test('instant filter-away uses the same retirement boundary without waiting on a fade', async () => {
 const f = prepare(); f.openThenSearch(); f.search.value = 'Dialog';
 const pending = f.runFilter(false);
 assert(f.card.hidden); assert.equal(f.suspendCount(), 1); assertRetired(f, f.beforeHide[0]);
 await pending; assertRetired(f);
});
test('filter-keep retains Menu ownership without resetting or stealing Search focus', async () => {
 const f = prepare(); f.openThenSearch(); const state = f.controller.getState(); f.search.value = 'Menu';
 await f.finish(f.runFilter());
 assert(!f.card.hidden); assert.equal(f.suspendCount(), 0);
 assert.equal(f.menu.popoverOpen, true); assert.equal(f.menu.dataset.stOpen, 'true'); assert.equal(f.menu.inert, false);
 assert.equal(f.find('#menu-trigger').getAttribute('aria-expanded'), 'true');
 assert.equal(f.doc.activeElement, f.search); assert.deepEqual(f.controller.getState(), state);
});
test('filter-away and return preserve committed rename, copies, recovery, budget and row identity', async () => {
 const f = prepare(), original = f.find('#menu-trigger');
 f.action('rename'); f.submit('Roadmap revised'); f.action('duplicate'); f.action('delete', 'hiring');
 const state = f.controller.getState(); f.openThenSearch(); f.search.value = 'Dialog';
 await f.finish(f.runFilter()); assertRetired(f); assert.deepEqual(f.controller.getState(), state);
 f.search.value = ''; await f.finish(f.runFilter());
 assert(!f.card.hidden); assert.equal(f.find('#menu-trigger'), original); assert.equal(f.doc.activeElement, f.search);
 assert.deepEqual(f.controller.getState(), state); assert.equal(f.find('[data-menu-recovery]').hidden, false);
 f.click(f.find('[data-menu-undo]'));
 assert.equal(f.controller.getState().files.find(file => file.id === 'hiring').name, 'Hiring plan');
 assert.equal(f.controller.getState().files.find(file => file.id === 'roadmap').name, 'Roadmap revised');
 assert.equal(f.controller.getState().copies, 1);
});
test('a superseded filter-away does not suspend a Menu retained by the latest filter', async () => {
 const f = prepare(); f.openThenSearch(); f.search.value = 'Dialog';
 const stale = f.runFilter(); assert.equal(f.suspendCount(), 0);
 f.search.value = 'Menu'; const latest = f.runFilter(false); await latest; await f.finish(stale);
 assert.equal(f.suspendCount(), 0); assert(!f.card.hidden); assert.equal(f.beforeHide.length, 1, 'Only the latest filter may commit');
 assert.equal(f.menu.popoverOpen, true); assert.equal(f.menu.dataset.stOpen, 'true'); assert.equal(f.menu.inert, false);
 assert.equal(f.doc.activeElement, f.search);
});
test('hiding the source card does not suspend a stage currently relocated into detail', async () => {
 const f = prepare(), detail = new f.E('dialog');
 detail.id = 'library-detail'; f.doc.body.append(detail); f.controller.suspend(); detail.append(f.stage);
 assert.equal(f.card.querySelector('[data-menu-demo]'), null);
 f.key(f.find('#menu-trigger'), 'ArrowDown'); const focusedItem = f.doc.activeElement;
 f.search.value = 'Dialog'; await f.finish(f.runFilter());
 assert(f.card.hidden); assert.equal(f.suspendCount(), 0); assert.equal(f.stage.parentElement, detail);
 assert.equal(f.menu.popoverOpen, true); assert.equal(f.menu.dataset.stOpen, 'true'); assert.equal(f.menu.inert, false);
 assert.equal(f.doc.activeElement, focusedItem, 'Unrelated source-card filtering cannot take the detail focus owner');
});
test('category filtering uses the same owned-stage retirement without clearing fixture state', async () => {
 const f = prepare(); f.action('rename'); f.submit('Category result'); const state = f.controller.getState();
 f.openThenSearch(); f.setCategory('Feedback'); await f.finish(f.runFilter());
 assert(f.card.hidden); assert.equal(f.suspendCount(), 1); assertRetired(f); assert.deepEqual(f.controller.getState(), state);
});
