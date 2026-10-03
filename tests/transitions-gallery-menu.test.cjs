// Source/state and deterministic DOM integration only. No browser or pixel claims.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const directory = path.join(__dirname, '../skills/seenry/assets/components/transitions');
const demo = require(path.join(directory, 'gallery-menu.js'));
const html = fs.readFileSync(path.join(directory, 'gallery.html'), 'utf8');
const gallery = fs.readFileSync(path.join(directory, 'gallery.js'), 'utf8');
const start = html.indexOf('<article class="card" data-key="menu"');
const markup = html.slice(start, html.indexOf('</article>', start) + 10);
const runtime = path.resolve(process.env.SEENRY_MENU_RUNTIME || path.join(directory, 'seenry-transitions.js'));
const update = demo.update;

test('initial fixture contains two independent rows and no false count', () => {
 const a = demo.initialState(), b = demo.initialState(); a.files[0].name = 'changed';
 assert.equal(b.files[0].name, 'Q3 roadmap'); assert.equal(b.files.length, 2);
 assert.equal(b.copies, 0); assert.equal(b.deleted.length, 0);
 assert.equal((markup.match(/data-menu-trigger /g) || []).length, 2);
 assert(!markup.includes('4 files')); assert(!markup.includes('<kbd>'));
 assert(!markup.includes('Move to')); assert(!markup.includes('>Share'));
});
test('validation rejects empty, control characters and 61 code points', () => {
 for (const name of ['', '   ', 'file\nname', 'a\u0000b', 'x'.repeat(61), '🙂'.repeat(61)]) assert(demo.nameError(name));
 for (const name of ['A', '東京計画', '🙂'.repeat(60), '<script>alert(1)</script>', ' Hiring plan ']) assert.equal(demo.nameError(name), '');
 const initial = demo.initialState(); assert.equal(update(initial, {type: 'rename', id: 'hiring', name: ' '}), initial);
});
test('rename commits a trimmed name without changing identity or the other row', () => {
 const initial = demo.initialState(), next = update(initial, {type: 'rename', id: 'hiring', name: '  Hiring 2027  '});
 assert.equal(next.files[1].id, 'hiring'); assert.equal(next.files[1].name, 'Hiring 2027');
 assert.equal(next.files[0], initial.files[0]); assert.equal(initial.files[1].name, 'Hiring plan');
});
test('two-copy budget is deterministic and cannot be replenished by deleting', () => {
 let state = demo.initialState();
 state = update(state, {type: 'duplicate', id: 'roadmap'});
 state = update(state, {type: 'duplicate', id: 'roadmap'});
 assert.equal(state.files.length, 4); assert.equal(new Set(state.files.map(file => file.id)).size, 4);
 assert.deepEqual(state.files.slice(1, 3).map(file => file.name), ['Q3 roadmap copy 2', 'Q3 roadmap copy']);
 state = update(state, {type: 'delete', id: 'copy-1'});
 const blocked = update(state, {type: 'duplicate', id: 'hiring'});
 assert.equal(blocked.files, state.files); assert.equal(blocked.copies, 2); assert.match(blocked.message, /Reset/);
});
test('long Unicode names retain a complete copy suffix inside the name limit', () => {
 let state = update(demo.initialState(), {type: 'rename', id: 'roadmap', name: '🙂'.repeat(60)});
 state = update(state, {type: 'duplicate', id: 'roadmap'});
 assert.equal([...state.files[1].name].length, 60); assert(state.files[1].name.endsWith(' copy'));
});
test('all created files can be deleted and undone in original order without a timer', () => {
 let state = update(demo.initialState(), {type: 'duplicate', id: 'hiring'});
 state = update(state, {type: 'rename', id: 'copy-1', name: 'Local plan'});
 const expected = state.files;
 for (const file of expected) state = update(state, {type: 'delete', id: file.id});
 assert.equal(state.files.length, 0); assert.equal(state.deleted.length, 3);
 while (state.deleted.length) state = update(state, {type: 'undo'});
 assert.deepEqual(state.files, expected); assert.equal(state.copies, 1);
});
test('stale row actions and repeated Undo cannot mutate the wrong file', () => {
 const state = update(demo.initialState(), {type: 'delete', id: 'roadmap'});
 for (const type of ['rename', 'delete', 'duplicate']) assert.equal(update(state, {type, id: 'roadmap', name: 'Stale'}), state);
 const restored = update(state, {type: 'undo'}); assert.equal(update(restored, {type: 'undo'}), restored);
});
test('Reset restores names, IDs, order, copy budget and deleted stack', () => {
 let state = update(demo.initialState(), {type: 'duplicate', id: 'roadmap'});
 state = update(state, {type: 'rename', id: 'hiring', name: 'Changed'});
 state = update(state, {type: 'delete', id: 'roadmap'});
 const reset = update(state, {type: 'reset'}), initial = demo.initialState();
 assert.deepEqual({...reset, message: ''}, initial); assert.match(reset.message, /Two original/);
});

// Reuse the checked-in full-runtime model, adding only DOM operations needed by
// the real gallery markup. Events include capture and bubble phases so the actual
// generic menu-item listener runs before the host's action handoff.
function fixture() {
 const source = fs.readFileSync(path.join(__dirname, 'transitions-library-focus-escape.test.cjs'), 'utf8');
 const scope = {require, __dirname, process: {argv: ['node', 'fixture', runtime]}, console};
 vm.runInNewContext(source.slice(0, source.indexOf('async function test(')) + '\nthis.createFixture = fixture;', scope);
 const f = scope.createFixture(false), E = f.E;
 const originalMatches = E.prototype.matches;
 E.prototype.matches = function (selector) {
  return selector.split(',').some(part => {
   part = part.trim();
   if (part.includes(' ')) { const parts = part.split(/\s+/), last = parts.pop(); return this.matches(last) && !!this.parentElement?.closest(parts.join(' ')); }
   if (part.startsWith('#')) return this.id === part.slice(1);
   if (part === '[disabled]') return !!this.disabled;
   return originalMatches.call(this, part);
  });
 };
 Object.defineProperties(E.prototype, {
  ownerDocument: {get() { return f.doc; }},
  id: {get() { return this.attrs.id || ''; }, set(value) { this.attrs.id = value; }},
  textContent: {get() { return (this._text || '') + this.children.map(child => child.textContent).join(''); }, set(value) { this._text = String(value); this.children = []; }}
 });
 E.prototype.insertBefore = function (node, before) {
  if (node === before) return;
  if (node.parentElement) node.parentElement.children = node.parentElement.children.filter(child => child !== node);
  const index = before ? this.children.indexOf(before) : this.children.length;
  this.children.splice(index, 0, node); node.parentElement = this; node.isConnected = true;
 };
 E.prototype.select = function () { this.selectionStart = 0; this.selectionEnd = this.value.length; };
 E.prototype.addEventListener = function (type, fn, options) { (this.handlers[type] ||= []).push({fn, capture: options === true || !!options?.capture}); };
 E.prototype.dispatchEvent = function (event) {
  event.target ||= this;
  const route = []; for (let node = this; node; node = node.parentElement) route.push(node);
  if (!route.includes(f.doc)) route.push(f.doc);
  const invoke = (node, capture) => { event.currentTarget = node; for (const listener of node.handlers[event.type] || []) {
   const entry = typeof listener === 'function' ? {fn: listener, capture: false} : listener;
   if (entry.capture === capture) entry.fn(event);
  }};
  for (const node of route.slice().reverse()) { invoke(node, true); if (event.propagationStopped) return !event.defaultPrevented; }
  invoke(this, false);
  if (event.bubbles) for (const node of route.slice(1)) { if (event.propagationStopped) break; invoke(node, false); }
  return !event.defaultPrevented;
 };
 const container = new E(), stack = [container];
 for (const token of markup.match(/<[^>]+>|[^<]+/g)) {
  if (token.startsWith('</')) { stack.pop(); continue; }
  if (token.startsWith('<')) {
   const match = /^<([\w-]+)/.exec(token); if (!match) continue;
   const node = new E(match[1]);
   for (const attr of token.slice(match[0].length).matchAll(/([\w-]+)(?:="([^"]*)")?/g)) {
    node.setAttribute(attr[1], attr[2] ?? '');
    if (attr[1] === 'class') node.className = attr[2];
    if (attr[1] === 'hidden') node.hidden = true;
   }
   stack.at(-1).append(node);
   if (!/\/>$/.test(token) && !['input', 'hr', 'br'].includes(match[1])) stack.push(node);
  } else stack.at(-1)._text = (stack.at(-1)._text || '') + token;
 }
 const card = container.firstElementChild; f.host.append(card);
 f.doc.getElementById = id => f.doc.documentElement.querySelector(`#${id}`);
 const stage = card.querySelector('[data-menu-demo]'), menu = stage.querySelector('#menu-1');
 // Real runtime listener installed before the host, as at DOMContentLoaded.
 f.S.init(menu);
 const controller = demo.mount(stage, f.S), find = selector => stage.querySelector(selector);
 const click = (element, detail = 1, isTrusted = false) => { const event = new f.Event('click', {bubbles: true, detail, isTrusted}); element.dispatchEvent(event); return event; };
 const key = (element, name) => f.key(element, name);
 const submit = value => { const input = find('[data-menu-name]'); input.value = value; find('[data-menu-form]').dispatchEvent(new f.Event('submit', {bubbles: true})); };
 const action = (name, id = 'roadmap', detail = 1) => { click(find(`#${id === 'roadmap' ? 'menu-trigger' : `menu-trigger-${id}`}`), detail); click(find(`[data-menu-action="${name}"]`), detail); };
 return {...f, stage, menu, controller, find, click, key, submit, action};
}

test('markup has native named Rename, explicit Save/Cancel, and an untimed recovery path', () => {
 const f = fixture();
 assert.equal(f.menu.getAttribute('popover'), 'manual'); assert(!f.menu.hasAttribute('data-st-contained'));
 const editor = f.find('[data-menu-editor]'); assert.equal(editor.tagName, 'DIALOG');
 assert.equal(editor.getAttribute('aria-labelledby'), 'menu-rename-title');
 assert.equal(f.find('[data-menu-name]').getAttribute('aria-describedby'), 'menu-name-help menu-name-error');
 assert.equal(f.find('[data-menu-cancel]').getAttribute('type'), 'button');
 assert.equal(editor.querySelector('[type="submit"]').textContent, 'Save');
 assert.equal(editor.querySelectorAll('[data-st-close]').length, 0);
 assert(gallery.includes("if (card.dataset.key === 'menu') menuDemo.suspend();"));
 assert(gallery.includes("if (detailCard?.dataset.key === 'menu') menuDemo.suspend();"));
});
test('both row triggers target their real row and maintain unique controls', () => {
 const f = fixture(); f.action('rename', 'hiring');
 assert.equal(f.find('[data-menu-name]').value, 'Hiring plan'); assert.equal(f.menu.getAttribute('aria-label'), 'Hiring plan actions');
 f.submit('Hiring 2027'); assert.equal(f.controller.getState().files[1].name, 'Hiring 2027');
 assert.equal(f.doc.activeElement, f.find('#menu-trigger-hiring'));
 assert.equal(f.find('#menu-trigger-hiring').getAttribute('aria-label'), 'More actions for Hiring 2027');
});
test('generic click starts an exit, then the actual host handoff retires it before Rename opens', async () => {
 const f = fixture(), editor = f.find('[data-menu-editor]');
 let atShow; const show = editor.showModal.bind(editor);
 editor.showModal = () => { atShow = {popover: f.menu.popoverOpen, state: f.menu.dataset.stOpen, inert: f.menu.inert}; show(); };
 f.action('rename');
 assert.deepEqual(atShow, {popover: false, state: 'false', inert: true});
 assert.equal(f.doc.activeElement, f.find('[data-menu-name]'));
 await f.settle(); assert(editor.open); assert.equal(f.doc.activeElement, f.find('[data-menu-name]'));
});
test('invalid Save preserves the name and leaves a recoverable named error', () => {
 const f = fixture(); f.action('rename'); f.submit('   ');
 assert(f.find('[data-menu-editor]').open); assert.equal(f.controller.getState().files[0].name, 'Q3 roadmap');
 assert.equal(f.find('[data-menu-name]').getAttribute('aria-invalid'), 'true');
 assert.equal(f.find('[data-menu-error]').textContent, 'Enter a file name.');
 f.submit('Roadmap revised'); assert(!f.find('[data-menu-editor]').open);
 assert.equal(f.controller.getState().files[0].name, 'Roadmap revised');
 assert.equal(f.find('[data-menu-error]').hidden, true);
});
test('Cancel, Escape and external close preserve committed names and restore row focus', () => {
 const f = fixture();
 for (const method of ['cancel', 'escape', 'close']) {
  f.action('rename', 'hiring'); f.find('[data-menu-name]').value = 'Uncommitted';
  if (method === 'cancel') f.click(f.find('[data-menu-cancel]'));
  if (method === 'escape') {
   const key = f.key(f.find('[data-menu-name]'), 'Escape'); assert(key.propagationStopped);
   f.find('[data-menu-editor]').dispatchEvent(new f.Event('cancel'));
  }
  if (method === 'close') { f.find('[data-menu-editor]').close(); f.find('[data-menu-editor]').dispatchEvent(new f.Event('close')); }
  assert.equal(f.controller.getState().files[1].name, 'Hiring plan');
  assert.equal(f.doc.activeElement, f.find('#menu-trigger-hiring'));
 }
});
test('a queued prior native close cannot cancel a newly opened Rename', () => {
 const f = fixture(); f.action('rename'); f.click(f.find('[data-menu-cancel]')); f.action('rename', 'hiring');
 const editor = f.find('[data-menu-editor]'); editor.dispatchEvent(new f.Event('close'));
 assert(editor.open); assert.equal(f.find('[data-menu-name]').value, 'Hiring plan');
 f.submit('Newest'); assert.equal(f.controller.getState().files[1].name, 'Newest');
});
test('repeated stale clicks and repeated submit cannot duplicate accepted actions', () => {
 const f = fixture(); f.action('duplicate'); f.click(f.find('[data-menu-action="duplicate"]'));
 assert.equal(f.controller.getState().copies, 1);
 f.action('rename'); f.submit('Accepted'); f.submit('Stale');
 assert.equal(f.controller.getState().files[0].name, 'Accepted');
});
test('surviving row identity, duplicate disabled state, Delete focus and Undo are stable', () => {
 const f = fixture(), roadmap = f.find('#menu-trigger'), hiring = f.find('#menu-trigger-hiring');
 f.action('duplicate'); f.action('duplicate');
 assert.equal(f.find('#menu-trigger'), roadmap); assert.equal(f.find('#menu-trigger-hiring'), hiring);
 assert.equal(f.find('[data-menu-action="duplicate"]').disabled, true); assert.equal(f.find('[data-menu-limit]').hidden, false);
 f.action('delete'); assert.equal(f.doc.activeElement, f.find('#menu-trigger-copy-2'));
 assert.equal(f.find('[data-menu-recovery]').hidden, false);
 f.click(f.find('[data-menu-undo]')); assert.equal(f.find('#menu-trigger'), roadmap); assert.equal(f.doc.activeElement, roadmap);
 assert.equal(f.find('[data-menu-count]').textContent, '4 files');
});
test('empty state keeps Reset and Undo reachable; Open menu does not use a detached row', () => {
 const f = fixture(); f.action('delete'); f.action('delete', 'hiring');
 assert.equal(f.find('[data-menu-empty]').hidden, false); assert.equal(f.find('[data-menu-count]').textContent, '0 files');
 assert.equal(f.doc.activeElement, f.find('[data-menu-reset]'));
 f.controller.replay(); assert.match(f.find('[data-menu-status]').textContent, /No sample files/);
 f.click(f.find('[data-menu-undo]')); assert.equal(f.find('[data-menu-count]').textContent, '1 file');
 assert.equal(f.doc.activeElement, f.find('#menu-trigger-hiring'));
});
test('Reset clears drafts, validation, deletions and copy budget as well as visible rows', () => {
 const f = fixture(); f.action('duplicate'); f.action('delete', 'hiring'); f.action('rename'); f.submit('');
 f.click(f.find('[data-menu-reset]'));
 assert.deepEqual({...f.controller.getState(), message: ''}, demo.initialState());
 assert(!f.find('[data-menu-editor]').open); assert.equal(f.find('[data-menu-name]').value, '');
 assert(f.find('[data-menu-error]').hidden); assert(f.find('[data-menu-recovery]').hidden);
 assert.equal(f.find('[data-menu-action="duplicate"]').disabled, false);
 assert.equal(f.doc.activeElement, f.find('[data-menu-reset]'));
});
test('reparenting the same stage cancels pending input but retains committed outcomes', () => {
 const f = fixture(); f.action('rename'); f.submit('Moved result'); f.action('rename'); f.find('[data-menu-name]').value = 'Draft';
 const destination = new f.E(); f.doc.body.append(destination); f.controller.suspend(); destination.append(f.stage);
 assert(!f.find('[data-menu-editor]').open); assert.equal(f.find('[data-menu-name]').value, '');
 assert.equal(f.controller.getState().files[0].name, 'Moved result');
 f.action('duplicate'); assert.equal(f.controller.getState().files[1].name, 'Moved result copy');
});
test('arrow keys open from either trigger and skip disabled Duplicate', () => {
 const f = fixture(); f.action('duplicate'); f.action('duplicate');
 f.key(f.find('#menu-trigger-hiring'), 'ArrowDown'); assert.equal(f.doc.activeElement, f.find('[data-menu-action="rename"]'));
 f.key(f.find('#menu-trigger-hiring'), 'ArrowUp'); assert.equal(f.doc.activeElement, f.find('[data-menu-action="delete"]'));
 assert.equal(f.menu.getAttribute('aria-label'), 'Hiring plan actions');
});
test('names render as text, never as executable markup', () => {
 const f = fixture(); f.action('rename'); f.submit('<img src=x onerror=alert(1)>');
 assert.equal(f.find('[data-menu-file-name]').textContent, '<img src=x onerror=alert(1)>');
 assert.equal(f.find('[data-menu-file-name]').children.length, 0);
});
for (const history of ['pointer', 'keyboard']) {
 test(`untrusted click inherits ${history} runtime input history, ignoring its detail value`, () => {
  const f = fixture(); f.doc.dispatchEvent(new f.Event(history === 'keyboard' ? 'keydown' : 'pointerdown', {key: 'k'}));
  f.click(f.find('#menu-trigger'), history === 'pointer' ? 0 : 1, false);
  assert.equal(f.animations.some(animation => animation.node === f.menu), history === 'pointer');
 });
 test(`Replay inherits ${history} runtime input history despite opposite gallery dataset`, () => {
  const f = fixture(); f.doc.dispatchEvent(new f.Event(history === 'keyboard' ? 'keydown' : 'pointerdown', {key: 'k'}));
  f.doc.documentElement.dataset.stInputMode = history === 'pointer' ? 'keyboard' : 'pointer';
  f.controller.replay();
  assert.equal(f.animations.some(animation => animation.node === f.menu), history === 'pointer');
 });
 test(`modeled trusted ${history} click uses its own modality over opposite prior history`, () => {
  const f = fixture(); f.doc.dispatchEvent(new f.Event(history === 'pointer' ? 'keydown' : 'pointerdown', {key: 'k'}));
  f.click(f.find('#menu-trigger'), history === 'keyboard' ? 0 : 1, true);
  assert.equal(f.animations.some(animation => animation.node === f.menu), history === 'pointer');
 });
}
