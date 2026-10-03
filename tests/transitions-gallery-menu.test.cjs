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
 assert.equal(blocked.files, state.files); assert.equal(blocked.copies, 2); assert.match(blocked.message, /Copy limit/);
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
   if (part === ':modal') return this.tagName === 'DIALOG' && this.open && this.modal;
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
 assert.equal(f.doc.activeElement, f.find('[data-menu-undo]'));
});

// Causal geometry replay through the complete runtime and gallery controller.
// Rectangles below come from PR65 10997a5 native case.json actions 38–41,
// menu-native-{0..3}-ubuntu/{320,390}-{light,dark}-keyboard. This deterministic
// scroll model proves the host response, not browser layout or native acceptance.
function focusViewport(f, width = 320) {
 const scrolls = [], view = {innerHeight: 780, getComputedStyle: node => ({position: 'static', overflowX: 'visible', overflowY: 'visible', ...node.style})};
 f.doc.defaultView = view; f.doc.documentElement.clientWidth = width;
 f.doc.querySelectorAll = selector => f.doc.documentElement.querySelectorAll(selector);
 const shift = (node, left, top) => {
  node.rect = {...node.rect, left: node.rect.left - left, top: node.rect.top - top};
  for (const child of node.children) shift(child, left, top);
 };
 const installScroll = (node, children) => { node.scrollBy = options => {
  scrolls.push({node, ...options});
  for (const child of children()) shift(child, options.left, options.top);
 }; };
 installScroll(view, () => [f.host]);
 const chrome = (name, top, height) => {
  const node = new f.E(); node.className = name; node.style.position = 'sticky'; node.style.top = `${top}px`;
  node.rect = {left: 0, top, width, height}; f.doc.body.append(node); return node;
 };
 chrome('top', 0, 65); const tools = chrome('library-tools', 64, 124);
 return {scrolls, view, tools, installScroll};
}
for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
 test(`${width} ${theme}: repeated Undo keeps its action point until the last restored file`, () => {
  const f = fixture(); f.action('duplicate'); f.action('rename', 'hiring'); f.submit('W'.repeat(60)); f.action('duplicate', 'hiring');
  const order = ['roadmap', 'copy-1', 'hiring', 'copy-2'];
  const triggers = new Map(order.map(id => [id, f.find(`#${id === 'roadmap' ? 'menu-trigger' : `menu-trigger-${id}`}`)]));
  for (const id of order) f.action('delete', id);
  const g = focusViewport(f, width); f.doc.documentElement.dataset.theme = theme;
  const tops = width === 320 ? [429.8125, -121.1875, -180.9375, -152.9375] : [456.9375, -49.0625, 265.0625, 265.0625];
  for (const [index, id] of order.slice().reverse().entries()) {
   const target = triggers.get(id), before = g.scrolls.length;
   target.rect = {left: width === 320 ? 226 : 292, top: tops[index], width: 44, height: 44};
   const undo = f.find('[data-menu-undo]'); undo.rect = {left: 50, top: 600, width: 160, height: 44};
   undo.focus(); f.click(undo, 0, true);
   assert.equal(f.doc.activeElement, index < 3 ? undo : target); assert.equal(f.controller.getState().files[0].id, id);
   const rect = f.doc.activeElement.getBoundingClientRect(); assert(rect.top >= 192 && rect.bottom <= 776);
   assert.equal(g.scrolls.length - before, index === 3 && tops[index] < 0 ? 1 : 0);
   assert(g.scrolls.every(scroll => scroll.behavior === 'instant'));
  }
 });
}
for (const [width, top] of [[320, -121.1875], [320, -180.9375], [320, -152.9375], [390, -49.0625]]) {
 test(`${width}: final Undo immediately reveals the native-observed row at ${top}px`, () => {
  const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
  const g = focusViewport(f, width); target.rect = {left: width === 320 ? 226 : 292, top, width: 44, height: 44};
  f.click(f.find('[data-menu-undo]'), 0, true);
  assert.equal(f.doc.activeElement, target); assert.equal(target.rect.top, 192);
  assert.equal(g.scrolls.length, 1); assert.equal(g.scrolls[0].behavior, 'instant');
 });
}
test('non-final Undo reveals the persistent recovery control if result reflow moved it offscreen', () => {
 const f = fixture(); f.action('delete'); f.action('delete', 'hiring');
 const g = focusViewport(f), undo = f.find('[data-menu-undo]'); undo.rect = {left: 50, top: 810, width: 160, height: 44};
 f.click(undo, 0, true);
 assert.equal(f.doc.activeElement, undo); assert.equal(undo.getBoundingClientRect().bottom, 776);
 assert.equal(g.scrolls.length, 1); assert.equal(g.scrolls[0].behavior, 'instant');
});
test('recovery follows Planning before the files and preserves the next complete name once', () => {
 const f = fixture(), name = 'W'.repeat(60); f.action('rename', 'hiring'); f.submit(name);
 assert.equal(f.find('[data-menu-status]').textContent, 'Renamed file.');
 assert.equal(f.find('#menu-trigger-hiring').getAttribute('aria-label'), `More actions for ${name}`);
 f.action('delete', 'hiring');
 const recovery = f.find('[data-menu-recovery]');
 assert.equal(recovery.parentElement, f.find('.menu-demo-app'));
 assert.equal(recovery.parentElement.children[0], f.find('.app-bar'));
 assert.equal(recovery.parentElement.children[1], recovery);
 assert.equal(recovery.parentElement.children[2], f.find('[data-menu-files]'));
 assert.equal(recovery.firstElementChild, f.find('[data-menu-undo]'));
 assert.equal(f.find('[data-menu-deleted]').textContent, `1 deleted. Next: “${name}”.`);
 assert.equal(f.find('[data-menu-undo]').getAttribute('aria-label'), `Undo delete of ${name}`);
 assert.equal(f.find('[data-menu-status]').textContent, 'Deleted file.');
 assert.equal(f.find('[data-menu-budget]').textContent, 'Copies: 0 of 2.');
 assert.equal(recovery.textContent.split(name).length - 1, 1);
 f.click(f.find('[data-menu-undo]'));
 assert.equal(f.find('#menu-trigger-hiring').closest('[data-menu-file]').querySelector('[data-menu-file-name]').textContent, name);
 assert.equal(f.find('[data-menu-status]').textContent, 'Restored file.');
 f.action('duplicate', 'hiring'); f.action('duplicate', 'hiring');
 assert.equal(f.find('[data-menu-status]').textContent, 'Created a copy. Copy limit reached.');
 assert.equal(f.find('[data-menu-budget]').textContent, 'Copies: 2 of 2.');
 assert.match(f.find('[data-menu-limit]').textContent, /Reset to duplicate again/);
 assert(markup.includes('<p>Rename, duplicate and undo a local delete.</p>'));
});
// Fixed header-anchor replay from ccbf131's 320-light-keyboard Delete snapshots.
// Row heights are observed; Undo bounds below are source-derived layout controls,
// not new browser measurements (scroll anchoring and actual paint remain native).
for (const [action, heights] of [['delete-roadmap', [72, 167.5, 167.5]], ['delete-copy-1', [167.5, 167.5]]]) {
 test(`${action}: recovery precedes surviving row height at the retained 320px header anchor`, () => {
  const f = fixture(); f.action('rename'); f.submit('Q4 roadmap'); f.action('duplicate');
  f.action('rename', 'hiring'); f.submit('W'.repeat(60)); f.action('duplicate', 'hiring'); f.action('delete');
  if (action === 'delete-copy-1') f.action('delete', 'copy-1');
  const recovery = f.find('[data-menu-recovery]'), list = f.find('[data-menu-files]'), app = f.find('.menu-demo-app');
  assert.equal(list.children.length, heights.length);
  assert(recovery.closest('.menu-demo-feedback'), 'Use the existing feedback padding, type and full-name wrapping');
  const css = html.split('<style>')[1].split('</style>')[0];
  const padding = Number(/\.menu-demo \.menu-demo-feedback\{padding:(\d+)px/.exec(css)[1]);
  const height = Number(/\.menu-demo \.menu-demo-recovery \.st-button\{min-height:(\d+)px/.exec(css)[1]);
  let top = 406.0625;
  for (const child of app.children.slice(1)) {
   if (child.hidden) continue;
   if (child === recovery || child.contains(recovery)) { top += padding; break; }
   if (child === list) top += heights.reduce((sum, value) => sum + value, 0);
  }
  assert.equal(top, 418.0625); assert.equal(height, 44); assert(top + height <= 780);
  const priorTop = 406.0625 + heights.reduce((sum, value) => sum + value, 0) + padding;
  assert(priorTop + height > 780, 'The original list-before-recovery order fails the immediate viewport envelope');
  assert.equal(f.doc.activeElement, f.find(action === 'delete-roadmap' ? '#menu-trigger-copy-1' : '#menu-trigger-hiring'));
 });
}
test('Undo reveals a viewport-visible trigger hidden behind sticky tools, with its focus ring', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f); target.rect = {left: 226, top: 140, width: 44, height: 44};
 f.click(f.find('[data-menu-undo]'), 0, true);
 assert.equal(f.doc.activeElement, target); assert.equal(target.getBoundingClientRect().top, 192);
 assert.deepEqual(g.scrolls.map(({left, top, behavior}) => ({left, top, behavior})), [{left: 0, top: -52, behavior: 'instant'}]);
});
test('Undo preserves already visible row position and focus even with CSS smooth scrolling', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f); f.doc.documentElement.style.scrollBehavior = 'smooth'; target.rect = {left: 226, top: 220, width: 44, height: 44};
 f.click(f.find('[data-menu-undo]'), 0, true);
 assert.equal(f.doc.activeElement, target); assert.equal(target.rect.top, 220); assert.equal(g.scrolls.length, 0);
});
test('Undo respects the visual viewport and ignores gallery tools that are not stuck', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f); g.view.visualViewport = {offsetLeft: 20, offsetTop: 80, width: 280, height: 400};
 g.tools.rect.top = 540; target.rect = {left: 280, top: 470, width: 44, height: 44};
 f.click(f.find('[data-menu-undo]'), 0, true);
 assert.equal(target.getBoundingClientRect().right, 296); assert.equal(target.getBoundingClientRect().bottom, 476);
 assert.equal(g.scrolls.length, 1);
});
test('Undo never scrolls a target rejected by focus or synchronously redirected by its host', () => {
 for (const unavailable of ['hidden', 'detached', 'redirect']) {
  const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
  const g = focusViewport(f), other = new f.E('input'); f.doc.body.append(other); other.focus();
  target.rect = {left: 226, top: -121.1875, width: 44, height: 44};
  if (unavailable === 'hidden') target.hidden = true;
  if (unavailable === 'detached') { const focus = target.focus.bind(target); target.focus = options => { target.remove(); focus(options); }; }
  if (unavailable === 'redirect') f.doc.addEventListener('focusin', event => { if (event.target === target) other.focus(); });
  f.click(f.find('[data-menu-undo]'), 0, true);
  assert.equal(f.doc.activeElement, other); assert.equal(g.scrolls.length, 0); assert.equal(f.controller.getState().files.length, 2);
 }
});
test('Undo reveals through a scroll ancestor before the gallery viewport', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f), scroller = new f.E(); f.host.append(scroller); scroller.append(f.stage);
 scroller.style.overflowY = 'auto'; scroller.rect = {left: 16, top: 250, width: 288, height: 240}; scroller.clientTop = 2; scroller.clientHeight = 236;
 g.installScroll(scroller, () => scroller.children); target.rect = {left: 226, top: 210, width: 44, height: 44};
 f.click(f.find('[data-menu-undo]'), 0, true);
 assert.equal(f.doc.activeElement, target); assert.equal(target.rect.top, 256); assert.equal(g.scrolls.length, 1); assert.equal(g.scrolls[0].node, scroller);
});
test('Undo in moved native detail scrolls only that modal and ignores background sticky tools', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f), detail = new f.E('dialog'); detail.id = 'library-detail'; f.doc.body.append(detail);
 detail.open = detail.modal = true; detail.style.overflowY = 'auto'; detail.rect = {left: 0, top: 60, width: 320, height: 720}; detail.clientHeight = 720;
 detail.append(f.stage); g.installScroll(detail, () => detail.children); target.rect = {left: 226, top: -49.0625, width: 44, height: 44};
 f.click(f.find('[data-menu-undo]'), 0, true);
 assert.equal(f.doc.activeElement, target); assert.equal(target.rect.top, 64);
 assert.equal(g.scrolls.length, 1); assert.equal(g.scrolls[0].node, detail); assert(detail.open);
});
test('a newer focus redirect during ancestor reveal prevents a later gallery scroll', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f), scroller = new f.E(), other = new f.E('input'); f.doc.body.append(other); f.host.append(scroller); scroller.append(f.stage);
 scroller.style.overflowY = 'auto'; scroller.rect = {left: 16, top: 10, width: 288, height: 240}; scroller.clientHeight = 240;
 g.installScroll(scroller, () => scroller.children); const scroll = scroller.scrollBy; scroller.scrollBy = options => { scroll(options); other.focus(); };
 target.rect = {left: 226, top: -121.1875, width: 44, height: 44}; f.click(f.find('[data-menu-undo]'), 0, true);
 assert.equal(f.doc.activeElement, other); assert.equal(g.scrolls.length, 1); assert.equal(g.scrolls[0].node, scroller);
});
for (const missing of ['modal selector', 'target geometry', 'computed style', 'window scroll', 'ancestor scroll', 'default view']) {
 test(`accepted Undo stays focus-only when ${missing} is unavailable`, () => {
  const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
  const g = focusViewport(f), native = []; target.rect = {left: 226, top: -121.1875, width: 44, height: 44};
  target.scrollIntoView = options => native.push(options);
  if (missing === 'modal selector') { const closest = target.closest.bind(target); target.closest = selector => { if (selector === ':modal') throw new SyntaxError('Unsupported selector'); return closest(selector); }; }
  if (missing === 'target geometry') target.getBoundingClientRect = undefined;
  if (missing === 'computed style') g.view.getComputedStyle = undefined;
  if (missing === 'window scroll') g.view.scrollBy = undefined;
  if (missing === 'ancestor scroll') { f.stage.style.overflowY = 'auto'; f.stage.rect = {left: 16, top: 200, width: 288, height: 400}; f.stage.scrollBy = undefined; }
  if (missing === 'default view') f.doc.defaultView = null;
  assert.doesNotThrow(() => f.click(f.find('[data-menu-undo]'), 0, true));
  assert.equal(f.controller.getState().files.length, 2); assert.equal(f.doc.activeElement, target);
  assert.equal(native.length, 0);
  assert.equal(g.scrolls.length, 0);
 });
}
test('unsupported geometry never calls an absent or rejecting native reveal API', () => {
 for (const rejected of [false, true]) {
  const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
  focusViewport(f); target.getBoundingClientRect = undefined;
  if (rejected) target.scrollIntoView = () => { throw new Error('Unsupported native reveal'); };
  assert.doesNotThrow(() => f.click(f.find('[data-menu-undo]'), 0, true));
  assert.equal(f.doc.activeElement, target); assert.equal(f.controller.getState().files.length, 2);
 }
});
test('empty and nonfinite target geometry never provoke a phantom manual or native scroll', () => {
 for (const rect of [{left: 0, top: 0, width: 0, height: 0}, {left: 226, top: NaN, width: 44, height: 44}]) {
  const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
  const g = focusViewport(f), native = []; target.rect = rect; target.scrollIntoView = options => native.push(options);
  f.click(f.find('[data-menu-undo]'), 0, true);
  assert.equal(f.doc.activeElement, target); assert.equal(g.scrolls.length, 0); assert.equal(native.length, 0);
 }
});
test('scaled ancestor geometry stays focus-only without unscaled manual clip/delta arithmetic', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f), clip = new f.E(), native = []; f.host.append(clip); clip.append(f.stage);
 clip.style.overflowY = 'auto'; clip.style.transform = 'matrix(0.5, 0, 0, 0.5, 0, 0)';
 clip.rect = {left: 16, top: 250, width: 144, height: 200}; clip.clientWidth = 288; clip.clientHeight = 400;
 g.installScroll(clip, () => clip.children); target.rect = {left: 100, top: 460, width: 22, height: 22};
 target.scrollIntoView = options => native.push(options);
 f.click(f.find('[data-menu-undo]'), 0, true);
 assert.equal(f.doc.activeElement, target); assert.equal(g.scrolls.length, 0); assert.equal(native.length, 0);
});
test('unsupported geometry fallback cannot reclaim newer host focus', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f), other = new f.E('input'), native = []; f.doc.body.append(other);
 target.scrollIntoView = options => native.push(options);
 target.getBoundingClientRect = () => { other.focus(); throw new Error('Geometry invalidated by host'); };
 assert.doesNotThrow(() => f.click(f.find('[data-menu-undo]'), 0, true));
 assert.equal(f.doc.activeElement, other); assert.equal(g.scrolls.length, 0); assert.equal(native.length, 0);
});
test('outer scale is rejected before an inner scroller can use mixed coordinate spaces', () => {
 for (const transformed of ['wrapper', 'body']) {
  const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
  const g = focusViewport(f), outer = new f.E(), inner = new f.E(), native = [];
  f.host.append(outer); outer.append(inner); inner.append(f.stage);
  (transformed === 'body' ? f.doc.body : outer).style.transform = 'matrix(0.5, 0, 0, 0.5, 0, 0)';
  inner.style.overflowY = 'auto'; inner.rect = {left: 16, top: 250, width: 144, height: 200}; inner.clientWidth = 288; inner.clientHeight = 400;
  inner.scrollBy = options => { g.scrolls.push({node: inner, ...options}); target.rect.top -= options.top * .5; };
  target.rect = {left: 100, top: 660, width: 22, height: 22}; target.scrollIntoView = options => native.push(options);
  f.click(f.find('[data-menu-undo]'), 0, true);
  assert.equal(f.doc.activeElement, target); assert.equal(target.rect.top, 660);
  assert.equal(g.scrolls.length, 0); assert.equal(native.length, 0);
 }
});
for (const failure of ['missing view', 'unsupported modal selector']) {
 test(`empty target is rejected before fallible ${failure} access`, () => {
  const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
  const g = focusViewport(f), native = []; let viewReads = 0, modalReads = 0;
  target.rect = {left: 0, top: 0, width: 0, height: 0}; target.scrollIntoView = options => native.push(options);
  Object.defineProperty(f.doc, 'defaultView', {get() { viewReads++; return failure === 'missing view' ? null : g.view; }});
  const closest = target.closest.bind(target); target.closest = selector => { if (selector === ':modal') { modalReads++; throw new SyntaxError('Unsupported selector'); } return closest(selector); };
  assert.doesNotThrow(() => f.click(f.find('[data-menu-undo]'), 0, true));
  assert.equal(f.controller.getState().files.length, 2); assert.equal(f.doc.activeElement, target);
  assert.equal(viewReads, 0); assert.equal(modalReads, 0); assert.equal(native.length, 0); assert.equal(g.scrolls.length, 0);
 });
}
test('uncertain modal geometry cannot invoke a native fallback that might scroll the background', () => {
 const f = fixture(), target = f.find('#menu-trigger-hiring'); f.action('delete', 'hiring');
 const g = focusViewport(f), dialog = new f.E('dialog'); dialog.id = 'library-detail'; dialog.open = dialog.modal = true;
 dialog.style.overflowY = 'auto'; dialog.style.transform = 'matrix(.5, 0, 0, .5, 0, 0)';
 dialog.rect = {left: 0, top: 60, width: 320, height: 720}; dialog.clientHeight = 1440;
 f.doc.body.append(dialog); dialog.append(f.stage); target.rect = {left: 100, top: 850, width: 22, height: 22};
 let backgroundScroll = 0; target.scrollIntoView = () => { backgroundScroll++; };
 f.click(f.find('[data-menu-undo]'), 0, true);
 assert.equal(f.doc.activeElement, target); assert(dialog.open); assert.equal(g.scrolls.length, 0); assert.equal(backgroundScroll, 0);
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
