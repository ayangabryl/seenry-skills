// Exact-runtime event/state regressions. The small DOM model is deterministic, not browser/pixel evidence.
// Run against either source: node tests/transitions-library-palette-input.test.cjs [runtime.js]
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const SOURCE = process.argv[2] || path.resolve(__dirname, '../skills/seenry/assets/components/transitions/seenry-transitions.js');
const source = fs.readFileSync(SOURCE, 'utf8');
let completed = false;
process.on('beforeExit', () => { if (!completed) { console.error('Palette regression harness did not complete'); process.exitCode = 1; } });
function fixture(reduce, {modal = false, persistent = !modal} = {}) {
 let active, scrollY = 0, frames = [], animations = [], selected = [], focusCalls = [], document;
 class E {
  constructor(tag = 'div') {
   this.tagName = tag.toUpperCase(); this.dataset = {}; this.style = {}; this.attrs = {}; this.handlers = {}; this.children = [];
   this.isConnected = true; this.hidden = false; this._inert = false; this.open = false; this.value = ''; this.textContent = '';
   this.offsetTop = this.offsetLeft = this.clientLeft = this.clientTop = this.scrollTop = this.scrollLeft = 0;
   this.offsetHeight = 40; this.offsetWidth = 228; this.clientHeight = 152;
   const classes = new Set(); this.classList = {add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x)};
  }
  set inert(value) { this._inert = value; if (value && this.contains(active)) active = document.body; }
  get inert() { return this._inert; }
  blocked() { return !!this.inert || !!this.hidden || !!this.parentElement?.blocked(); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  hasAttribute(k) { return k in this.attrs; }
  removeAttribute(k) { delete this.attrs[k]; }
  append(...nodes) { for (const n of nodes) { this.children.push(n); n.parentElement = this; } }
  prepend(node) { this.children.unshift(node); node.parentElement = this; }
  addEventListener(type, fn, opts) { (this.handlers[type] ??= []).push({fn, capture: opts === true || !!opts?.capture}); }
  matches(selector) {
   return selector.split(',').some(s => {
    s = s.trim();
    if (s === '[data-st]') return !!this.dataset.st;
    if (s === '[data-st-ghost]') return 'stGhost' in this.dataset;
    if (s === '[data-st-target]') return !!this.dataset.stTarget;
    if (s === '[data-st-palette-input]') return this.hasAttribute(s.slice(1, -1));
    if (s === '[role=listbox]' || s === '[role="listbox"]') return this.attrs.role === 'listbox';
    if (s === '[role="option"]') return this.attrs.role === 'option';
    if (s === '[data-st-palette-empty]') return this.hasAttribute('data-st-palette-empty');
    if (s === '.st-palette-search') return this.className === 'st-palette-search';
    if (s === '.st-palette-highlight') return this.className === 'st-palette-highlight';
    return this.tagName.toLowerCase() === s;
   });
  }
  closest(s) { for (let n = this; n; n = n.parentElement) if (n.matches(s)) return n; return null; }
  querySelectorAll(s) { return this.children.flatMap(n => [...(n.matches(s) ? [n] : []), ...n.querySelectorAll(s)]); }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  contains(n) { return this === n || this.children.some(c => c.contains(n)); }
  dispatchEvent(event) {
   event.target ??= this; event.preventDefault ??= function () { this.defaultPrevented = true; };
   const ancestors = []; for (let n = this.parentElement; n; n = n.parentElement) ancestors.unshift(n);
   for (const n of [...ancestors, this]) for (const {fn, capture} of n.handlers[event.type] || []) if (capture) fn(event);
   for (const {fn, capture} of this.handlers[event.type] || []) if (!capture) fn(event);
   if (event.bubbles) for (const n of ancestors.reverse()) for (const {fn, capture} of n.handlers[event.type] || []) if (!capture) fn(event);
  }
  focus(options) {
   focusCalls.push({node: this, options}); if (this.blocked() || active === this) return;
   active = this; if (!options?.preventScroll) scrollY = 800;
   this.dispatchEvent({type: 'focus', bubbles: false});
   this.dispatchEvent({type: 'focusin', bubbles: true}); // Native order: focus, then bubbling focusin.
  }
  blur() { if (active === this) active = document.body; } // Blur to BODY does not dispatch a new focusin.
  cloneNode(deep) { const clone = new E(this.tagName); clone.attrs = {...this.attrs}; clone.dataset = {...this.dataset}; clone.textContent = this.textContent; if (deep) clone.append(...this.children.map(n => n.cloneNode(true))); return clone; }
  remove() { this.isConnected = false; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(n => n !== this); }
  getBoundingClientRect() { return {left: 0, top: 0, right: 228, bottom: 40, width: 228, height: 40}; }
  show() { this.open = true; this.showCalls = (this.showCalls || 0) + 1; }
  showModal() { this.open = true; this.modalCalls = (this.modalCalls || 0) + 1; }
  close() { this.open = false; this.closeCalls = (this.closeCalls || 0) + 1; }
  click() { this.dispatchEvent({type: 'click', bubbles: true, detail: 0}); }
  animate(keyframes, options) {
   let resolve, reject, settled = false;
   const a = {node: this, keyframes, options, finished: new Promise((r, j) => { resolve = r; reject = j; }),
    finish() { if (!settled) { settled = true; resolve(); } }, cancel() { if (!settled) { settled = true; reject(new Error('cancelled')); } },
    commitStyles: () => Object.assign(this.style, keyframes.at(-1))};
   animations.push(a); return a;
  }
 }
 document = new E('document'); document.body = new E('body'); document.documentElement = new E('html');
 document.append(document.documentElement); document.documentElement.append(document.body); active = document.body;
 document.readyState = 'loading'; document.createElement = t => new E(t); 
 // Source needs only getElementById for the explicitly created fixture IDs.
 const ids = {}; document.getElementById = id => ids[id] || null;
 Object.defineProperty(document, 'activeElement', {get: () => active});
 const root = new E(modal ? 'dialog' : 'div'); root.dataset.st = 'palette'; root.id = 'palette'; ids[root.id] = root;
 if (persistent) root.setAttribute('data-st-persistent', ''); if (!modal) root.setAttribute('data-st-contained', '');
 const search = new E(), input = new E('input'), box = new E('ul'), empty = new E('p'), trigger = new E('button');
 search.className = 'st-palette-search'; search.offsetHeight = 46; input.setAttribute('data-st-palette-input', '');
 input.setAttribute('aria-expanded', 'true'); // Runtime must normalize even older/misleading markup.
 box.setAttribute('role', 'listbox'); empty.setAttribute('data-st-palette-empty', ''); empty.hidden = true;
 const options = ['Create project', 'Invite teammate', 'Open settings'].map((text, i) => {
  const o = new E('li'); o.textContent = text; o.dataset.value = ['project', 'invite', 'settings'][i]; o.setAttribute('role', 'option'); o.offsetTop = i * 40; o.offsetParent = box; box.append(o); return o;
 });
 trigger.dataset.stTarget = root.id; document.body.append(trigger, root); root.append(search, box, empty); search.append(input);
 const context = {document, window: {}, navigator: {}, matchMedia: query => ({matches: query.includes('reduced-motion') && reduce, addEventListener() {}}),
  IntersectionObserver: class {observe() {} unobserve() {}}, MutationObserver: class {observe() {}}, addEventListener() {},
  getComputedStyle: e => ({position: 'relative', clipPath: 'none', opacity: '1', transform: 'none', ...e.style}),
  requestAnimationFrame: f => { frames.push(f); return frames.length; }, cancelAnimationFrame() {},
  setTimeout() {}, clearTimeout() {}, innerWidth: 320, innerHeight: 1000,
  Event: class {constructor(type, options = {}) {this.type = type; Object.assign(this, options);}},
  CustomEvent: class {constructor(type, options = {}) {this.type = type; Object.assign(this, options);}}};
 vm.createContext(context); vm.runInContext(source, context, {filename: SOURCE}); const S = context.window.SeenryTransitions;
 root.addEventListener('st:palette-select', e => selected.push(e.detail.value)); S.init(root);
 const pointer = node => {
  if (node.blocked()) return false;
  node.dispatchEvent({type: 'pointerdown', bubbles: true, button: 0, isPrimary: true, pointerType: 'mouse'});
  if (node.tagName === 'INPUT' || node.tagName === 'BUTTON') node.focus({preventScroll: true});
  node.dispatchEvent({type: 'click', bubbles: true, detail: 1}); return true;
 };
 const key = value => { if (!active.blocked()) active.dispatchEvent({type: 'keydown', bubbles: true, key: value}); };
 const tabIntoInput = () => { key('Tab'); input.focus({preventScroll: true}); };
 const settle = async () => { for (let n = 0; n < 5; n++) { animations.forEach(a => a.finish()); await Promise.resolve(); await Promise.resolve(); const pending = frames; frames = []; pending.forEach(f => f()); } };
 return {S, root, input, box, empty, options, trigger, document, selected, pointer, key, tabIntoInput, settle,
  flushFrames() { const pending = frames; frames = []; pending.forEach(f => f()); },
  edit(value) { assert(!input.blocked(), 'visible search must accept edits'); input.value = value; input.dispatchEvent({type: 'input', bubbles: true}); },
  get active() {return active;}, get scrollY() {return scrollY;}, get focusCalls() {return focusCalls;}, get animations() {return animations;}};
}
const cases = [];
async function test(name, fn) { try { await fn(); cases.push({name, pass: true}); } catch (e) { cases.push({name, pass: false, error: e.message.slice(0, 600)}); } }
(async () => {
 for (const reduce of [false, true]) {
  const label = reduce ? 'reduced' : 'normal';
  await test(`${label}: initialization exposes a collapsed usable search without page focus/scroll`, () => {
   const f = fixture(reduce); assert.equal(f.input.getAttribute('aria-expanded'), 'false'); assert.equal(f.root.inert, false); assert.equal(f.box.inert, true);
   assert.equal(f.input.getAttribute('aria-activedescendant'), null); assert.equal(f.active, f.document.body); assert.equal(f.focusCalls.length, 0); assert.equal(f.scrollY, 0);
  });
  await test(`${label}: direct pointer focus/click opens initially collapsed results`, async () => {
   const f = fixture(reduce); assert(f.pointer(f.input)); await f.settle(); assert.equal(f.root.dataset.stOpen, 'true'); assert.equal(f.box.inert, false);
   assert.equal(f.input.getAttribute('aria-expanded'), 'true'); assert.equal(f.active, f.input); assert.equal(f.scrollY, 0);
  });
  await test(`${label}: Escape leaves search usable and results inaccessible, then pointer reopens`, async () => {
   const f = fixture(reduce); f.tabIntoInput(); await f.settle(); f.key('Escape');
   assert.equal(f.root.inert, false, 'search container must never become inert'); assert.equal(f.box.inert, true); assert.equal(f.empty.inert, true);
   assert.equal(f.input.getAttribute('aria-activedescendant'), null); await f.settle(); assert.equal(f.root.dataset.stOpen, 'false'); assert.equal(f.active, f.input);
   assert(f.pointer(f.input), 'native-like pointer model rejects inert targets'); await f.settle(); assert.equal(f.root.dataset.stOpen, 'true'); assert.equal(f.box.inert, false);
  });
  await test(`${label}: keyboard-only entry, Escape and ArrowDown reopen retain input focus`, async () => {
   const f = fixture(reduce); f.tabIntoInput(); await f.settle(); assert.equal(f.root.dataset.stOpen, 'true'); f.key('Escape'); await f.settle(); f.key('ArrowDown'); await f.settle();
   assert.equal(f.root.dataset.stOpen, 'true'); assert.equal(f.active, f.input); assert.equal(f.input.getAttribute('aria-activedescendant'), f.options[0].id);
   f.key('ArrowDown'); assert.equal(f.input.getAttribute('aria-activedescendant'), f.options[1].id); f.key('Enter'); await f.settle();
   assert.deepEqual(f.selected, ['invite']); assert.equal(f.root.dataset.stOpen, 'false'); assert.equal(f.active, f.input); assert.equal(f.box.inert, true);
  });
  await test(`${label}: editing after Escape reopens and preserves the new filter`, async () => {
   const f = fixture(reduce); f.tabIntoInput(); await f.settle(); f.key('Escape'); await f.settle(); f.edit('settings'); await f.settle();
   assert.equal(f.root.dataset.stOpen, 'true'); assert.equal(f.input.value, 'settings'); assert(f.options[0].hidden && f.options[1].hidden && !f.options[2].hidden);
   assert.equal(f.input.getAttribute('aria-activedescendant'), f.options[2].id);
  });
  await test(`${label}: pointer option selection closes once and the same search reopens`, async () => {
   const f = fixture(reduce); f.tabIntoInput(); await f.settle(); assert(f.pointer(f.options[2])); await f.settle(); assert.deepEqual(f.selected, ['settings']);
   assert.equal(f.root.dataset.stOpen, 'false'); assert.equal(f.active, f.input); assert(f.pointer(f.input)); await f.settle(); assert.equal(f.root.dataset.stOpen, 'true');
  });
  await test(`${label}: pointer reopening during exit defeats stale completion`, async () => {
   const f = fixture(reduce); f.tabIntoInput(); await f.settle(); f.key('Escape'); assert(f.pointer(f.input)); await f.settle();
   assert.equal(f.root.dataset.stOpen, 'true'); assert.equal(f.root.inert, false); assert.equal(f.box.inert, false); assert.equal(f.input.getAttribute('aria-expanded'), 'true');
  });
  await test(`${label}: delayed open focus cannot reopen after immediate Escape`, async () => {
   const f = fixture(reduce); f.tabIntoInput(); f.key('Escape'); const callsAfterClose = f.focusCalls.length; await f.settle(); assert.equal(f.focusCalls.length, callsAfterClose, 'stale open RAF must not attempt focus'); assert.equal(f.root.dataset.stOpen, 'false'); assert.equal(f.input.getAttribute('aria-expanded'), 'false');
   const before = f.focusCalls.length; f.flushFrames(); assert.equal(f.focusCalls.length, before); assert.equal(f.root.inert, false); assert.equal(f.box.inert, true);
  });
  await test(`${label}: external trigger restoration does not immediately reopen the search`, async () => {
   const f = fixture(reduce); assert(f.pointer(f.trigger)); await f.settle(); f.key('Escape'); await f.settle();
   assert.equal(f.active, f.trigger); assert.equal(f.root.dataset.stOpen, 'false'); f.tabIntoInput(); await f.settle(); assert.equal(f.root.dataset.stOpen, 'true');
  });
  for (const modal of [false, true]) {
   await test(`${label}/${modal ? 'native' : 'contained'}: empty filters ignore generated ghosts before and after their removal`, async () => {
   const f = fixture(reduce, {modal}); if (modal) f.pointer(f.trigger); else f.tabIntoInput(); await f.settle(); f.edit('zzzz-no-match');
   assert.equal(f.input.getAttribute('aria-activedescendant'), null); assert.equal(f.empty.hidden, false);
   f.key('ArrowDown'); f.key('Enter'); assert.equal(f.selected.length, 0); await f.settle();
   assert.equal(f.input.getAttribute('aria-activedescendant'), null); assert.equal(f.empty.hidden, false); assert.equal(f.root.dataset.stOpen, 'true');
   f.edit(''); await f.settle(); assert(f.options.every(o => !o.hidden)); assert.equal(f.input.getAttribute('aria-activedescendant'), f.options[0].id);
   assert.equal(f.options.filter(o => o.getAttribute('aria-selected') === 'true').length, 1);
  });
   for (const eventType of ['pointermove', 'click']) await test(`${label}/${modal ? 'native' : 'contained'}: closed semantics reject stale option ${eventType} during and after exit`, async () => {
    const f = fixture(reduce, {modal}); if (modal) f.pointer(f.trigger); else f.tabIntoInput(); await f.settle();
    if (modal) f.root.dispatchEvent({type: 'cancel'}); else f.key('Escape');
    const staleEvents = phase => {
     for (const option of f.options) {
      if (eventType === 'click') option.click(); else option.dispatchEvent({type: 'pointermove', bubbles: true});
      assert.equal(f.input.getAttribute('aria-activedescendant'), null, `${phase}: stale ${eventType} must not repopulate active descendant`);
      assert.equal(f.selected.length, 0, `${phase}: stale ${eventType} must not select`);
      assert.equal(f.input.getAttribute('aria-expanded'), 'false');
     }
    };
    staleEvents('closing'); await f.settle(); staleEvents('closed'); assert.equal(f.root.dataset.stOpen, 'false'); assert.equal(f.box.inert, true);
   });
   await test(`${label}/${modal ? 'native' : 'contained'}: rapid no-match/query changes do not clone paint copies`, async () => {
    const f = fixture(reduce, {modal}); if (modal) f.pointer(f.trigger); else f.tabIntoInput(); await f.settle();
    f.edit('zzzz-no-match'); const firstGhosts = f.box.querySelectorAll('[role="option"]').filter(o => o.closest('[data-st-ghost]'));
    f.edit('settings'); // No animation completion is allowed between these two actual input listeners.
    const all = f.box.querySelectorAll('[role="option"]'), authored = all.filter(o => !o.closest('[data-st-ghost]')), ghosts = all.filter(o => o.closest('[data-st-ghost]'));
    assert.equal(firstGhosts.length, reduce ? 0 : 3); assert.equal(ghosts.length, firstGhosts.length, 'second query must not clone previously generated options');
    assert.equal(authored.length, 3); assert(authored.every(o => f.options.includes(o))); assert.equal(authored.filter(o => !o.hidden).length, 1);
    assert.equal(f.empty.hidden, true); assert.equal(f.input.getAttribute('aria-activedescendant'), f.options[2].id);
    await f.settle(); assert.equal(f.box.querySelectorAll('[role="option"]').length, 3); assert.equal(f.input.getAttribute('aria-activedescendant'), f.options[2].id);
   });
   await test(`${label}/${modal ? 'native' : 'contained'}: interrupted filter reversal never selects generated or hidden options`, async () => {
   const f = fixture(reduce, {modal}); if (modal) f.pointer(f.trigger); else f.tabIntoInput(); await f.settle(); f.edit('settings'); f.edit('zzzz-no-match');
   const ghosts = f.box.querySelectorAll('[role="option"]').filter(o => o.closest('[data-st-ghost]'));
   assert.equal(f.input.getAttribute('aria-activedescendant'), null); assert.equal(f.empty.hidden, false);
   // Defensive event path: inert paint copies and hidden originals are never semantic results.
   for (const o of [...ghosts, ...f.options]) {
    o.dispatchEvent({type: 'pointermove', bubbles: true}); assert.equal(f.input.getAttribute('aria-activedescendant'), null);
    o.click(); assert.equal(f.selected.length, 0);
   }
   f.edit(''); await f.settle(); assert.equal(f.box.querySelectorAll('[role="option"]').length, 3);
   assert.equal(f.input.getAttribute('aria-activedescendant'), f.options[0].id); f.key('Enter'); await f.settle(); assert.deepEqual(f.selected, ['project']);
   assert.equal(f.root.dataset.stOpen, 'false'); assert(f.pointer(modal ? f.trigger : f.input)); await f.settle(); assert.equal(f.input.getAttribute('aria-activedescendant'), f.options[0].id);
  });
  }
  for (const modal of [false, true]) {
   const kind = modal ? 'native' : 'persistent';
   await test(`${label}/${kind}: open retains intended input focus with native focus/focusin order`, async () => {
    const f = fixture(reduce, {modal});
    if (modal) f.pointer(f.trigger); else f.tabIntoInput();
    assert.equal(f.active, f.input); f.flushFrames(); await f.settle();
    assert.equal(f.active, f.input); assert.equal(f.root.dataset.stOpen, 'true');
    if (modal) { assert.equal(f.root.modalCalls, 1); assert.equal(f.root.showCalls || 0, 0); }
   });
   await test(`${label}/${kind}: queued open cannot reclaim newer control focus`, () => {
    const f = fixture(reduce, {modal}); f.S.open(f.root, f.trigger);
    const other = modal ? f.trigger.cloneNode(false) : f.trigger; if (modal) f.root.append(other);
    other.focus({preventScroll: true}); const calls = f.focusCalls.length;
    f.flushFrames(); assert.equal(f.active, other, 'newer control focus must retain ownership');
    assert.equal(f.focusCalls.length, calls, 'stale RAF must not even attempt to focus input');
   });
   await test(`${label}/${kind}: newer focus round trip invalidates queued open`, () => {
    const f = fixture(reduce, {modal}); f.S.open(f.root, f.trigger);
    const other = modal ? f.trigger.cloneNode(false) : f.trigger; if (modal) f.root.append(other);
    other.focus({preventScroll: true}); f.input.focus({preventScroll: true}); const calls = f.focusCalls.length;
    f.flushFrames(); assert.equal(f.active, f.input); assert.equal(f.focusCalls.length, calls, 'newer intent supersedes old RAF even when it returns to the input');
   });
   await test(`${label}/${kind}: intentional blur to BODY invalidates queued open`, () => {
    const f = fixture(reduce, {modal}); f.S.open(f.root, f.trigger);
    f.input.blur(); const calls = f.focusCalls.length; f.flushFrames();
    assert.equal(f.active, f.document.body, 'explicit blur without focusin must not be undone'); assert.equal(f.focusCalls.length, calls);
   });
  }
  await test(`${label}: close/reopen supersedes old open RAF even with unchanged focus`, () => {
   const f = fixture(reduce); f.S.open(f.root, f.input); f.S.close(f.root); f.S.open(f.root, f.input);
   const calls = f.focusCalls.length; f.flushFrames();
   assert.equal(f.active, f.input); assert.equal(f.root.dataset.stOpen, 'true');
   assert.equal(f.focusCalls.length, calls + 1, 'only the latest open may perform its scheduled focus');
  });
  for (const persistent of [false, true]) await test(`${label}: native modal semantics stay native (persistent=${persistent})`, async () => {
   const f = fixture(reduce, {modal: true, persistent}); assert(f.pointer(f.trigger)); await f.settle(); assert.equal(f.root.modalCalls, 1); assert.equal(f.root.showCalls || 0, 0);
   assert.equal(f.root.open, true); f.root.dispatchEvent({type: 'cancel'}); assert.equal(f.root.inert, true); await f.settle();
   assert.equal(f.root.open, false); assert.equal(f.root.closeCalls, 1); assert.equal(f.active, f.trigger); assert.equal(f.trigger.getAttribute('aria-expanded'), 'false');
   assert(f.pointer(f.trigger)); await f.settle(); assert.equal(f.root.modalCalls, 2); assert.equal(f.root.inert, false); assert.equal(f.root.open, true);
  });
 }
 completed = true; console.log(JSON.stringify({source: SOURCE, cases, passed: cases.filter(c => c.pass).length, failed: cases.filter(c => !c.pass).length, limitation: 'Deterministic mocked DOM/event/animation contracts; trusted browser input and pixels require the paired browser runner.'}, null, 2));
 if (cases.some(c => !c.pass)) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
