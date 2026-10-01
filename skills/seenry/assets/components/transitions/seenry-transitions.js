/* Seenry Transitions 2. Original implementation, MIT. Classic script; no dependencies.
   Every animation starts from the currently rendered value, so a second input reverses a change mid-flight. */
(function () {
 'use strict';
 const doc = document, mq = matchMedia('(prefers-reduced-motion: reduce)'), reduced = () => mq.matches;
 const q = (el, s) => el.querySelector(s), qa = (el, s) => [...el.querySelectorAll(s)];
 const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
 const CURVES = {E: 'cubic-bezier(.16,1,.3,1)', M: 'cubic-bezier(.4,0,.2,1)', F: 'cubic-bezier(.2,0,.2,1)', X: 'cubic-bezier(.4,0,1,1)'};
 const MS = {instant: 0, feedback: 80, quick: 120, control: 160, relocate: 180, surface: 240, spatial: 280, fast: 120, base: 160, slow: 240, page: 280};
 // spring(response seconds, bounce), the parameterisation designers know from SwiftUI. lead/trail drive a two-edge indicator.
 const SPRINGS = {snappy: [.26, .04], smooth: [.36, 0], gentle: [.34, .08], bouncy: [.34, .42], thumb: [.28, .28], lead: [.16, 0], trail: [.23, 0]};
 const tracks = {};
 function track(name) {
  if (tracks[name]) return tracks[name];
  const [r, b] = SPRINGS[name] || SPRINGS.smooth, k = (2 * Math.PI / r) ** 2, c = 4 * Math.PI * (1 - b) / r;
  let x = 0, v = 0, last = 0; const pts = [0];
  for (let i = 1; i < 1500; i++) {
   for (let s = 0; s < 4; s++) { const a = k * (1 - x) - c * v; v += a / 4000; x += v / 4000; }
   pts.push(x); if (Math.abs(1 - x) > .004 || Math.abs(v) > .08) last = i;
  }
  const t = pts.slice(0, last + 1); t[t.length - 1] = 1;
  return (tracks[name] = t);
 }
 const at = (t, ms) => t[Math.min(t.length - 1, Math.max(0, Math.round(ms)))];
 const easings = {};
 function spring(name) {
  if (easings[name]) return easings[name];
  const t = track(name), n = t.length - 1, step = Math.max(1, Math.round(n / 40)), pts = [];
  for (let i = 0; i < n; i += step) pts.push(+t[i].toFixed(4));
  pts.push(1);
  return (easings[name] = {easing: `linear(${pts.join(', ')})`, duration: n});
 }

 /* play(el, frames, options): one running animation per element and channel. With current (default) the first
    keyframe is replaced by the rendered value, so a new call retargets instead of restarting. Returns a promise that
    resolves true when it finished, false when something newer replaced it. */
 const channels = new WeakMap();
 function play(el, frames, o = {}) {
  if (!el || !el.animate) return Promise.resolve(true);
  const key = (o.channel || 'main') + (o.pseudo || '');
  let map = channels.get(el); if (!map) channels.set(el, map = new Map());
  const prev = map.get(key);
  // A single keyframe is a target: start it from the rendered value.
  if ((prev && o.current !== false) || frames.length === 1) {
   const cs = getComputedStyle(el, o.pseudo || null), first = {};
   for (const p of Object.keys(frames[frames.length - 1])) if (p !== 'offset' && p !== 'easing' && p !== 'composite') first[p] = cs[p];
   // clip-path 'none' does not interpolate; start from the equivalent full inset instead.
   if (first.clipPath === 'none') { const r = /round ([\d.]+px)/.exec(String(frames[frames.length - 1].clipPath)); first.clipPath = `inset(0px 0px 0px 0px${r ? ' round ' + r[1] : ''})`; }
   frames = frames.length === 1 ? [first, frames[0]] : [first, ...frames.slice(1)];
  }
  prev?.cancel();
  let duration, easing;
  if (o.spring) ({duration, easing} = spring(o.spring));
  else { duration = typeof o.ms === 'number' ? o.ms : MS[o.ms || 'control']; easing = CURVES[o.curve || 'E'] || o.curve; }
  let delay = o.delay || 0;
  if (reduced()) {
   if (!o.fade) { map.delete(key); return Promise.resolve(true); }
   frames = frames.map(f => ('opacity' in f ? {opacity: f.opacity} : {})).filter(f => 'opacity' in f);
   if (frames.length < 2) { map.delete(key); return Promise.resolve(true); }
   duration = Math.min(duration, 100); easing = 'linear'; delay = 0;
  }
  const a = el.animate(frames, {duration, easing, delay, fill: o.fill || 'backwards', pseudoElement: o.pseudo});
  map.set(key, a);
  return a.finished.then(() => { if (map.get(key) === a) map.delete(key); return true; }, () => false);
 }
 function stop(el, channel = 'main') { const map = channels.get(el), a = map?.get(channel); if (a) { a.cancel(); map.delete(channel); } }
 function stopAll(el) { const map = channels.get(el); if (map) { for (const a of map.values()) a.cancel(); map.clear(); } }
 const fadeIn = (el, o = {}) => play(el, [{opacity: 0}, {opacity: 1}], {ms: 'quick', curve: 'F', channel: 'o', fade: true, ...o});

 // FLIP: measure (rendered positions, including running transforms), mutate, then animate from the old place.
 function flip(els, mutate, o = {}) {
  els = els.filter(e => e && e.isConnected);
  const first = new Map(els.map(e => [e, e.getBoundingClientRect()]));
  els.forEach(e => stop(e, 'flip'));
  mutate && mutate();
  const jobs = [];
  for (const e of els) {
   if (!e.isConnected) continue;
   const f = first.get(e), l = e.getBoundingClientRect();
   const dx = f.left + f.width / 2 - (l.left + l.width / 2), dy = f.top + f.height / 2 - (l.top + l.height / 2);
   const sx = o.scale && l.width ? f.width / l.width : 1, sy = o.scale && l.height ? f.height / l.height : 1;
   if (Math.abs(dx) < .5 && Math.abs(dy) < .5 && Math.abs(sx - 1) < .005 && Math.abs(sy - 1) < .005) continue;
   jobs.push(play(e, [{transform: `translate(${dx}px, ${dy}px)${o.scale ? ` scale(${sx}, ${sy})` : ''}`}, {transform: 'none'}], {spring: o.spring || 'smooth', channel: 'flip', current: false, delay: o.delay || 0}));
  }
  return Promise.all(jobs);
 }
 const positioned = el => { if (getComputedStyle(el).position === 'static') el.style.position = 'relative'; return el; };
 // A non-interactive copy of an element at its rendered place, for content that leaves while layout has moved on.
 function ghost(el, host = el.parentElement) {
  positioned(host);
  const r = el.getBoundingClientRect(), h = host.getBoundingClientRect(), g = el.cloneNode(true);
  for (const n of [g, ...qa(g, '[id],[data-st]')]) { n.removeAttribute('id'); if (n.dataset.st) { n.dataset.stGhostOf = n.dataset.st; n.removeAttribute('data-st'); } }
  g.classList.add('st-ghost-layer'); g.setAttribute('aria-hidden', 'true'); g.inert = true; g.dataset.stGhost = '';
  Object.assign(g.style, {position: 'absolute', left: r.left - h.left - host.clientLeft + host.scrollLeft + 'px', top: r.top - h.top - host.clientTop + host.scrollTop + 'px', width: r.width + 'px', height: r.height + 'px', margin: '0', boxSizing: 'border-box', pointerEvents: 'none', transform: 'none', clipPath: getComputedStyle(el).clipPath});
  host.append(g);
  return g;
 }
 const followers = el => { const out = []; for (let n = el.nextElementSibling; n; n = n.nextElementSibling) if (!n.dataset.stGhost) out.push(n); return out; };
 function announce(text) { let live = doc.getElementById('st-live'); if (!live) { live = doc.createElement('div'); live.id = 'st-live'; live.className = 'st-sr'; live.setAttribute('aria-live', 'polite'); doc.body.append(live); } live.textContent = ''; setTimeout(() => { live.textContent = text; }, 30); }

 /* ---------- Numbers: digits roll by place value; unchanged places keep identity and slide when width changes. ---------- */
 const states = new WeakMap();
 function number(el, value, o = {}) {
  value = Number(value); if (!el || !Number.isFinite(value)) return;
  let fmtOpts = o.format; if (!fmtOpts && el.dataset.stFormat) try { fmtOpts = JSON.parse(el.dataset.stFormat); } catch {}
  const fmt = new Intl.NumberFormat(o.locale || el.dataset.stLocale || doc.documentElement.lang || 'en', fmtOpts || {});
  let s = states.get(el);
  if (!s || s.type !== 'number') {
   el.replaceChildren(); const sr = doc.createElement('span'), vis = doc.createElement('span');
   sr.className = 'st-sr'; vis.className = 'st-digits'; vis.setAttribute('aria-hidden', 'true'); el.append(sr, vis); el.classList.add('st-number');
   s = {type: 'number', sr, vis, cells: new Map(), value: null, text: '', last: 0}; states.set(el, s);
  }
  const text = fmt.format(value); if (text === s.text) return;
  const now = performance.now(), frequent = o.frequent === true || el.hasAttribute('data-st-frequent') || (s.text && now - s.last < 500);
  const animated = !!s.text && !reduced(); s.last = now;
  const dir = s.value === null || value === s.value ? 1 : value > s.value ? 1 : -1;
  const parts = fmt.formatToParts(value), entries = [];
  let place = [...parts.filter(p => p.type === 'integer').map(p => p.value).join('')].length, frac = 0, other = 0;
  for (const p of parts) for (const ch of p.value) {
   const digit = /\p{Nd}/u.test(ch);
   const key = digit ? (p.type === 'fraction' ? 'f' + frac++ : 'i' + --place) : p.type === 'group' ? 'g' + place : p.type + other++;
   entries.push({ch, digit, key});
  }
  const firstX = new Map(); if (animated) for (const [k, c] of s.cells) firstX.set(k, c.getBoundingClientRect().left);
  // Neighbours in the same line (a unit, a suffix) slide with the width change instead of jumping.
  const near = animated ? [el, el.parentElement].flatMap(n => n && n.parentElement ? followers(n) : []).filter(n => n.getBoundingClientRect().height < 80) : [];
  const nearX = new Map(near.map(n => [n, n.getBoundingClientRect().left]));
  const keep = new Set(entries.map(e => e.key));
  for (const [k, cell] of s.cells) if (!keep.has(k)) {
   if (animated) { positioned(el); const g = ghost(cell, el); play(g, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: `translateY(${-dir * 30}%) scale(.7)`}], {ms: 'quick', curve: 'X', fill: 'forwards'}).then(() => g.remove()); }
   cell.remove(); s.cells.delete(k);
  }
  const cells = [], changed = [];
  for (const e of entries) {
   let cell = s.cells.get(e.key), isNew = false;
   if (!cell) { cell = doc.createElement('span'); cell.className = 'st-cell'; s.cells.set(e.key, cell); isNew = true; }
   const ink = q(cell, '.st-ink:not(.st-ink-out)');
   if (!ink || ink.textContent !== e.ch) changed.push({cell, ch: e.ch, digit: e.digit, isNew, old: ink});
   cells.push(cell);
  }
  s.vis.replaceChildren(...cells);
  let order = 0;
  for (const c of changed) {
   const inkEl = doc.createElement('span'); inkEl.className = 'st-ink'; inkEl.textContent = c.ch;
   qa(c.cell, '.st-ink-out').forEach(x => { stopAll(x); x.remove(); });
   if (!animated) { c.old?.remove(); c.cell.append(inkEl); continue; }
   const delay = frequent ? 0 : Math.min(order++ * 12, 36);
   const enter = frequent ? 0 : 45; // the old digit is mostly gone before the new one is legible
   c.cell.classList.add('st-rolling');
   const travel = frequent ? 45 : 100;
   if (c.old) {
    c.old.classList.add('st-ink-out');
    play(c.old, [{transform: 'none', opacity: 1, filter: 'blur(0px)'}, {transform: `translateY(${-dir * travel}%)`, opacity: 0, filter: frequent ? 'blur(0px)' : 'blur(2px)'}], {ms: 70, curve: 'X', delay, fill: 'both'}).then(ok => { if (ok) c.old.remove(); });
   }
   c.cell.append(inkEl);
   const from = c.isNew && !c.old ? {transform: `translateY(${dir * 40}%) scale(.8)`, opacity: 0, filter: 'blur(2px)'} : {transform: `translateY(${dir * travel}%)`, opacity: 0, filter: frequent ? 'blur(0px)' : 'blur(2px)'};
   play(inkEl, [from, {transform: 'none', opacity: 1, filter: 'blur(0px)'}], {spring: 'lead', delay: delay + enter}).then(() => { if (!qa(c.cell, '.st-ink-out').length) c.cell.classList.remove('st-rolling'); });
  }
  if (animated) for (const [k, x] of firstX) { const cell = s.cells.get(k); if (!cell) continue; const dx = x - cell.getBoundingClientRect().left; if (Math.abs(dx) > .5) play(cell, [{transform: `translateX(${dx}px)`}, {transform: 'none'}], {spring: 'snappy', channel: 'flip', current: false}); }
  for (const [n, x] of nearX) { const dx = x - n.getBoundingClientRect().left; if (Math.abs(dx) > .5) play(n, [{transform: `translateX(${dx}px)`}, {transform: 'none'}], {spring: 'snappy', channel: 'flip', current: false}); }
  s.sr.textContent = text; s.text = text; s.value = value;
  el.dispatchEvent(new CustomEvent('st:number', {bubbles: true, detail: {value, text}}));
 }
 function pop(el) { return play(el, [{transform: 'scale(.82)'}, {transform: 'none'}], {spring: 'bouncy', channel: 'pop', current: false}); }

 /* ---------- Text: old glyphs lift away, new glyphs rise into focus, in one fixed slot. ---------- */
 function letters(text, cls) { const span = doc.createElement('span'); span.className = cls; span.setAttribute('aria-hidden', 'true'); for (const ch of text) { const l = doc.createElement('span'); l.className = 'st-letter'; l.textContent = ch; span.append(l); } return span; }
 function swapText(el, text, o = {}) {
  text = String(text);
  if (!el.dataset.stLabel) el.dataset.stLabel = el.textContent.trim();
  if (el.dataset.stLabel === text && !o.force) return Promise.resolve();
  const previous = el.dataset.stLabel; el.dataset.stLabel = text;
  const thinking = el.dataset.st === 'thinking';
  const run = () => {
   positioned(el);
   qa(el, '.st-text-exit').forEach(x => x.remove());
   let current = q(el, '.st-text-value');
   if (!current) { el.replaceChildren(); current = letters(previous, 'st-text-value'); el.append(current); }
   let sr = q(el, ':scope > .st-sr'); if (!sr) { sr = doc.createElement('span'); sr.className = 'st-sr'; }
   sr.textContent = text;
   current.className = 'st-text-exit';
   const centered = el.dataset.stAlign ? el.dataset.stAlign === 'center' : getComputedStyle(el).textAlign === 'center';
   Object.assign(current.style, {position: 'absolute', top: '0', left: centered ? '50%' : '0', translate: centered ? '-50% 0' : ''});
   const next = letters(text, 'st-text-value');
   el.append(next, sr);
   const out = [...current.children], inn = [...next.children];
   const outs = out.map((l, i) => play(l, [{opacity: 1, transform: 'none', filter: 'blur(0px)'}, thinking ? {opacity: 0} : {opacity: 0, transform: 'translateY(-35%)', filter: 'blur(3px)'}], {ms: thinking ? 'feedback' : 65, curve: thinking ? 'F' : 'X', delay: Math.min(i * 5, 20), fill: 'forwards', fade: true}));
   Promise.all(outs).then(() => { if (current.isConnected && current.className === 'st-text-exit') current.remove(); });
   if (reduced()) { current.remove(); return Promise.all(inn.map(l => fadeIn(l))); }
   return Promise.all(inn.map((l, i) => thinking
    ? play(l, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', delay: 40 + Math.min(i * 10, 60)})
    : Promise.all([
     play(l, [{transform: 'translateY(45%)', filter: 'blur(3px)'}, {transform: 'none', filter: 'blur(0px)'}], {spring: 'snappy', delay: 25 + Math.min(i * 10, 40), current: false}),
     play(l, [{opacity: 0}, {opacity: 1}], {ms: 90, curve: 'F', channel: 'o', delay: 25 + Math.min(i * 10, 40), current: false})])));
  };
  const fit = o.fit || el.closest('[data-st-fit]');
  if (fit && !reduced()) { let p; resize(fit, () => { p = run(); }); return p; }
  return run();
 }

 /* ---------- Resize: layout commits once; a painted shell scales from the old box, text never stretches. ---------- */
 const resizing = new WeakMap();
 function resize(el, update) {
  const prev = resizing.get(el);
  const first = prev ? prev.shell.getBoundingClientRect() : el.getBoundingClientRect();
  prev?.cleanup();
  const followerEls = followers(el);
  const beforeKids = new Set(el.children);
  let last;
  flip(followerEls, () => { update(); last = el.getBoundingClientRect(); }, {spring: 'smooth'});
  if (reduced() || !first.width || !last.width || (Math.abs(first.width - last.width) < .5 && Math.abs(first.height - last.height) < .5)) return Promise.resolve();
  const cs = getComputedStyle(el), shell = doc.createElement('span');
  shell.className = 'st-resize-shell'; shell.setAttribute('aria-hidden', 'true');
  Object.assign(shell.style, {position: 'absolute', left: -parseFloat(cs.borderLeftWidth) + 'px', top: -parseFloat(cs.borderTopWidth) + 'px', width: last.width + 'px', height: last.height + 'px', background: cs.backgroundColor, backgroundImage: cs.backgroundImage, border: cs.border, borderRadius: cs.borderRadius, boxShadow: cs.boxShadow, transformOrigin: '0 0', pointerEvents: 'none', zIndex: '-1', boxSizing: 'border-box'});
  const saved = {position: el.style.position, isolation: el.style.isolation, background: el.style.background, boxShadow: el.style.boxShadow, borderColor: el.style.borderColor};
  Object.assign(el.style, {position: cs.position === 'static' ? 'relative' : el.style.position, isolation: 'isolate', background: 'transparent', boxShadow: 'none', borderColor: 'transparent'});
  el.prepend(shell);
  const state = {shell, cleanup() { stopAll(shell); shell.remove(); Object.assign(el.style, saved); if (resizing.get(el) === state) resizing.delete(el); }};
  resizing.set(el, state);
  [...el.children].filter(c => c !== shell && (!beforeKids.has(c) || c.getBoundingClientRect().top >= first.top + first.height - 1)).forEach(c => fadeIn(c, {delay: 60, ms: 'control'}));
  return play(shell, [{transform: `scale(${first.width / last.width}, ${first.height / last.height})`}, {transform: 'none'}], {spring: 'smooth', current: false}).then(ok => { if (ok && resizing.get(el) === state) state.cleanup(); });
 }

 /* ---------- Layers ---------- */
 const layers = new WeakMap(), active = new Set();
 const POP = ['menu', 'plus-menu', 'popover', 'tooltip'];
 const layerState = el => { let s = layers.get(el); if (!s) layers.set(el, s = {open: false, version: 0}); return s; };
 const isOpen = el => { const s = layers.get(el); if (s) return s.open; if (el.tagName === 'DIALOG') return el.open; if (el.hasAttribute('popover')) return el.matches(':popover-open'); return el.dataset.stOpen === 'true'; };
 const scrimOf = el => (el.dataset.stScrim && doc.getElementById(el.dataset.stScrim)) || (el.previousElementSibling?.matches('[data-st-scrim]') ? el.previousElementSibling : null);
 const recedeOf = el => el.dataset.stRecede ? doc.querySelector(el.dataset.stRecede) : null;
 function place(el, trigger) {
  const kind = el.dataset.st, t = trigger.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, gap = kind === 'tooltip' ? 8 : 6;
  let [side, align] = (el.dataset.stPlacement || (kind === 'tooltip' ? 'top' : 'bottom-start')).split('-');
  if (side === 'bottom' && t.bottom + gap + h > innerHeight - 8 && t.top - gap - h > 8) side = 'top';
  else if (side === 'top' && t.top - gap - h < 8 && t.bottom + gap + h < innerHeight - 8) side = 'bottom';
  const morph = kind === 'plus-menu' || el.hasAttribute('data-st-morph');
  let x = align === 'start' ? t.left : align === 'end' ? t.right - w : t.left + t.width / 2 - w / 2;
  let y = side === 'bottom' ? t.bottom + gap : t.top - gap - h;
  if (morph) { x = align === 'end' ? t.right - w : t.left; y = side === 'bottom' ? t.top : t.bottom - h; }
  x = clamp(x, 8, Math.max(8, innerWidth - w - 8)); y = clamp(y, 8, Math.max(8, innerHeight - h - 8));
  el.style.left = x + 'px'; el.style.top = y + 'px';
  el.style.transformOrigin = `${clamp(t.left + t.width / 2 - x, 0, w)}px ${side === 'bottom' ? 0 : h}px`;
  el.dataset.stSide = side;
 }
 function triggerInset(el, trigger) {
  const t = trigger.getBoundingClientRect(), r = el.getBoundingClientRect(), rad = parseFloat(getComputedStyle(trigger).borderTopLeftRadius) || 8;
  return `inset(${t.top - r.top}px ${r.right - t.right}px ${r.bottom - t.bottom}px ${t.left - r.left}px round ${rad}px)`;
 }
 function focusFirst(el) { const f = q(el, '[autofocus],[data-st-palette-input],[role="menuitem"]:not([disabled]),[role="option"],button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'); f?.focus({preventScroll: true}); }

 function open(el, trigger, o = {}) {
  if (!el) return;
  const s = layerState(el), kind = el.dataset.st;
  if (trigger) s.trigger = trigger; else if (!s.trigger && doc.activeElement !== doc.body) s.trigger = doc.activeElement;
  el._stTrigger = s.trigger;
  const wasOpen = s.open, wasClosing = s.closing; if (wasOpen && !wasClosing) return;
  s.open = true; s.closing = false; const v = ++s.version;
  el.inert = false; el.dataset.stManaged = ''; el.dataset.stOpen = 'true'; el.hidden = false;
  s.trigger?.setAttribute('aria-expanded', 'true');
  if (el.tagName === 'DIALOG') { if (!el.open) el.showModal(); }
  else if (el.hasAttribute('popover')) { if (!el.matches(':popover-open')) el.showPopover(); }
  if (POP.includes(kind) && kind !== 'tooltip') { for (const other of [...active]) if (other !== el && !other.contains(el) && POP.includes(other.dataset.st)) close(other, {silent: true}); }
  if (POP.includes(kind) && s.trigger) { place(el, s.trigger); active.add(el); }
  else if (!POP.includes(kind)) active.add(el);
  const t = s.trigger && s.trigger.getBoundingClientRect(), r = el.getBoundingClientRect();
  const scrim = scrimOf(el), recede = recedeOf(el);
  if (scrim) { scrim.dataset.stOpen = 'true'; play(scrim, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', fade: true}); }
  if (recede) play(recede, [{transform: 'none', borderRadius: '0px', opacity: 1}, {transform: 'scale(.94) translateY(6px)', borderRadius: '14px', opacity: .7}], {spring: 'smooth', fill: 'forwards', channel: 'recede'});
  const morph = (kind === 'plus-menu' || el.hasAttribute('data-st-morph')) && s.trigger && (el.hasAttribute('popover') || el.tagName === 'DIALOG');
  if (morph && el.tagName === 'DIALOG') {
   // A dialog that morphs opens over its trigger: its first row lands where the trigger was.
   const tr = s.trigger.getBoundingClientRect(), w = el.offsetWidth, first = el.querySelector('[data-st-morph-anchor]') || el.firstElementChild, fh = first ? first.offsetHeight : tr.height;
   Object.assign(el.style, {position: 'fixed', margin: '0', inset: 'auto', left: clamp(tr.left + tr.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px', top: clamp(tr.top + tr.height / 2 - fh / 2, 8, innerHeight - el.offsetHeight - 8) + 'px'});
   if (!wasClosing) play(el, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', pseudo: '::backdrop', fade: true});
  }
  const mr = el.getBoundingClientRect();
  if (morph) {
   el.classList.add('st-morphing');
   // The surface lives in a body that is clipped; the layer itself only draws a drop shadow, which follows the clip.
   if (!s.body) { s.body = doc.createElement('div'); s.body.className = 'st-morph-body'; s.body.append(...el.childNodes); el.append(s.body); el.dataset.stMorphReady = ''; }
   if (!s.label) { s.label = doc.createElement('span'); s.label.className = 'st-morph-label'; s.label.setAttribute('aria-hidden', 'true'); s.body.append(s.label); }
   s.label.innerHTML = s.trigger.innerHTML; const tcs = getComputedStyle(s.trigger);
   // The label layer is a painted copy of the trigger, so the first frame is the button itself.
   Object.assign(s.label.style, {position: 'absolute', zIndex: '3', left: t.left - mr.left + 'px', top: t.top - mr.top + 'px', width: t.width + 'px', height: t.height + 'px', display: 'flex', alignItems: 'center', justifyContent: tcs.justifyContent, padding: tcs.padding, boxSizing: 'border-box', gap: tcs.gap, color: tcs.color, font: tcs.font, letterSpacing: tcs.letterSpacing, pointerEvents: 'none', borderRadius: tcs.borderRadius, background: tcs.backgroundColor, boxShadow: tcs.boxShadow});
   s.trigger.style.visibility = 'hidden';
   const content = [...s.body.children].filter(c => c !== s.label);
   play(s.body, [{clipPath: triggerInset(el, s.trigger)}, {clipPath: 'inset(0px 0px 0px 0px round 14px)'}], {spring: 'snappy', channel: 'clip'}).then(ok => { if (ok && s.version === v) el.classList.remove('st-morphing'); });
   play(s.label, [{opacity: 1}, {opacity: 0}], {ms: 70, curve: 'F', fill: 'forwards', fade: true});
   content.forEach((c, i) => i === 0 && el.tagName === 'DIALOG' ? null : play(c, [{opacity: 0, transform: 'translateY(-4px)'}, {opacity: 1, transform: 'none'}], {spring: 'snappy', delay: el.tagName === 'DIALOG' ? 40 : 30, fade: true}));
  } else if (kind === 'tooltip') {
   if (!o.glideFrom) {
    play(el, [{opacity: 0}, {opacity: 1}], {ms: 90, curve: 'F', channel: 'o', fade: true});
    const dy = el.dataset.stSide === 'bottom' ? -4 : 4;
    play(el, [{transform: `translateY(${dy}px) scale(.98)`}, {transform: 'none'}], {ms: 160, curve: 'E', channel: 't'});
   } else {
    // One bubble: it travels from the previous anchor and reshapes from the previous width; only the words crossfade.
    const g = o.glideFrom, dx = g.left + g.width / 2 - (r.left + r.width / 2), dy = g.top - r.top, side = Math.max(0, (r.width - g.width) / 2);
    play(el, [{transform: `translate(${dx}px, ${dy}px)`}, {transform: 'none'}], {spring: 'snappy', channel: 't', current: false});
    play(el, [{clipPath: `inset(0px ${side}px 0px ${side}px round 8px)`}, {clipPath: 'inset(0px 0px 0px 0px round 8px)'}], {spring: 'snappy', channel: 'clip', current: false});
    stop(el, 'o');
    const label = q(el, '.st-tip-label'); if (label) play(label, [{opacity: .3}, {opacity: 1}], {ms: 100, curve: 'F', current: false, fade: true});
   }
  } else if (POP.includes(kind)) {
   // The shell lands first from the trigger point; rows arrive 35ms later while it is still settling.
   const dy = el.dataset.stSide === 'top' ? 4 : -4;
   play(el, [{opacity: 0}, {opacity: 1}], {ms: 90, curve: 'F', channel: 'o', fade: true});
   play(el, [{transform: `translateY(${dy}px) scale(.96)`}, {transform: 'none'}], {spring: 'snappy', channel: 't'});
   if (!wasClosing) [...el.children].forEach((c, i) => play(c, [{opacity: 0}, {opacity: 1}], {ms: 110, curve: 'F', delay: 20 + Math.min(i * 10, 40), channel: 'o', fade: true}));
  } else if (kind === 'sheet') {
   play(el, [{transform: 'translateY(100%)'}, {transform: 'none'}], {spring: 'smooth', channel: 't'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', pseudo: '::backdrop', fade: true});
  } else if (kind === 'drawer') {
   const side = el.dataset.stSide === 'left' ? -1 : 1;
   play(el, [{transform: `translateX(${side * 100}%)`}, {transform: 'none'}], {spring: 'smooth', channel: 't'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', pseudo: '::backdrop', fade: true});
  } else if (kind === 'panel') {
   play(el, [{opacity: 0}, {opacity: 1}], {ms: 'quick', curve: 'F', channel: 'o', fade: true});
   play(el, [{transform: 'translateY(-6px) scale(.98)'}, {transform: 'none'}], {spring: 'snappy', channel: 't'});
  } else if (el.tagName === 'DIALOG' || kind === 'modal' || kind === 'palette') {
   if (kind !== 'palette' && t && !wasClosing) el.style.transformOrigin = `${clamp(t.left + t.width / 2 - r.left, 0, r.width)}px ${clamp(t.top + t.height / 2 - r.top, 0, r.height)}px`;
   if (kind === 'palette') el.style.transformOrigin = '50% 0';
   play(el, [{opacity: 0}, {opacity: 1}], {ms: 'quick', curve: 'F', channel: 'o', fade: true});
   play(el, [{transform: kind === 'palette' ? 'translateY(-8px) scale(.98)' : 'translateY(4px) scale(.97)'}, {transform: 'none'}], kind === 'palette' ? {spring: 'snappy', channel: 't'} : {ms: 220, curve: 'E', channel: 't'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', pseudo: '::backdrop', fade: true});
  }
  if (!wasOpen && o.focus !== false && kind !== 'tooltip') {
   if (kind === 'menu' || kind === 'plus-menu') { if (o.keyboard) focusFirst(el); else el.focus?.({preventScroll: true}); }
   else if (el.tagName !== 'DIALOG' || kind === 'palette') focusFirst(el);
  }
  el.dispatchEvent(new CustomEvent('st:open', {bubbles: true}));
 }

 function close(el, o = {}) {
  if (!el) return;
  const s = layerState(el), kind = el.dataset.st;
  if (!s.open && !isOpen(el)) return;
  if (!s.open && s.closing) return;
  s.open = false; s.closing = true; const v = ++s.version;
  s.trigger?.setAttribute('aria-expanded', 'false');
  const hadFocus = el.contains(doc.activeElement);
  el.inert = true;
  const refocus = (hadFocus || kind === 'palette') && !o.silent && s.trigger?.isConnected;
  if (refocus && el.tagName !== 'DIALOG') s.trigger.focus({preventScroll: true});
  const scrim = scrimOf(el), recede = recedeOf(el);
  if (scrim) { scrim.dataset.stOpen = 'false'; play(scrim, [{opacity: 1}, {opacity: 0}], {ms: 'quick', curve: 'F', fade: true}); }
  if (recede) play(recede, [{transform: 'none', borderRadius: '0px', opacity: 1}], {spring: 'smooth', channel: 'recede'}).then(ok => { if (ok) stop(recede, 'recede'); });
  let done;
  const morph = s.label && s.trigger && el.classList !== undefined && (kind === 'plus-menu' || el.hasAttribute('data-st-morph'));
  if (morph) {
   el.classList.add('st-morphing');
   [...s.body.children].filter(c => c !== s.label).forEach(c => play(c, [{opacity: 0}], {ms: 'feedback', curve: 'F', fill: 'forwards', fade: true}));
   play(s.label, [{opacity: 1}], {ms: 'quick', curve: 'F', delay: 50, fill: 'forwards', fade: true});
   done = play(s.body, [{clipPath: triggerInset(el, s.trigger)}], {spring: 'snappy', channel: 'clip', fill: 'forwards'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}], {ms: 'control', curve: 'F', pseudo: '::backdrop', fill: 'forwards', fade: true});
  } else if (kind === 'tooltip') {
   done = o.instant ? Promise.resolve(true) : play(el, [{opacity: 0}], {ms: 'feedback', curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else if (POP.includes(kind)) {
   const dy = el.dataset.stSide === 'top' ? 2 : -2;
   [...el.children].forEach(c => stop(c, 'o'));
   play(el, [{transform: `translateY(${dy}px) scale(.97)`}], {ms: 110, curve: 'X', channel: 't', fill: 'forwards'});
   done = play(el, [{opacity: 0}], {ms: 110, curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else if (kind === 'sheet' || kind === 'drawer') {
   const to = kind === 'sheet' ? 'translateY(100%)' : `translateX(${el.dataset.stSide === 'left' ? -100 : 100}%)`;
   done = play(el, [{transform: to}], {ms: o.velocity ? 180 : 220, curve: o.velocity ? 'cubic-bezier(.2,.6,.4,1)' : CURVES.X, channel: 't', fill: 'forwards'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}], {ms: 'quick', curve: 'F', pseudo: '::backdrop', fill: 'forwards', fade: true});
   if (reduced()) done = play(el, [{opacity: 1}, {opacity: 0}], {ms: 'quick', curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else if (kind === 'panel') {
   play(el, [{transform: 'translateY(-4px) scale(.98)'}], {ms: 'quick', curve: 'X', channel: 't', fill: 'forwards'});
   done = play(el, [{opacity: 0}], {ms: 'quick', curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else {
   play(el, [{transform: kind === 'palette' ? 'translateY(-4px) scale(.98)' : 'scale(.97)'}], {ms: 140, curve: 'X', channel: 't', fill: 'forwards'});
   done = play(el, [{opacity: 0}], {ms: 140, curve: 'F', channel: 'o', fill: 'forwards', fade: true});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}], {ms: 140, curve: 'F', pseudo: '::backdrop', fill: 'forwards', fade: true});
  }
  const finish = () => {
   if (s.version !== v || s.open) return;
   s.closing = false;
   if (el.tagName === 'DIALOG' && el.open) { el.close(); if (refocus) s.trigger.focus({preventScroll: true}); }
   else if (el.hasAttribute('popover') && el.matches(':popover-open')) el.hidePopover();
   el.dataset.stOpen = 'false'; active.delete(el);
   if (s.trigger) s.trigger.style.visibility = '';
   stopAll(el); if (s.label) stopAll(s.label); if (s.body) { stopAll(s.body); [...s.body.children].forEach(stopAll); } [...el.children].forEach(stopAll); el.classList.remove('st-morphing');
   el.dispatchEvent(new CustomEvent('st:close', {bubbles: true}));
  };
  (done || Promise.resolve(true)).then(finish);
  if (reduced() && !done) finish();
 }
 const toggle = (el, trigger, o) => (isOpen(el) && !layerState(el).closing ? close(el, o) : open(el, trigger, o));

 /* ---------- Sheet drag: follows the finger, dismisses on distance or velocity, springs back otherwise. ---------- */
 function sheetDrag(el) {
  let d = null;
  el.addEventListener('pointerdown', e => {
   if (!e.isPrimary || e.button > 0 || e.target.closest('button,a,input,textarea,select,[data-st-no-drag]')) return;
   d = {id: e.pointerId, y0: e.clientY, y: 0, h: el.offsetHeight, claimed: false, samples: [[e.timeStamp, 0]]};
  });
  el.addEventListener('pointermove', e => {
   if (!d || d.id !== e.pointerId) return;
   let dy = e.clientY - d.y0;
   if (!d.claimed) { if (Math.abs(dy) < 4) return; d.claimed = true; el.setPointerCapture(e.pointerId); const m = new DOMMatrixReadOnly(getComputedStyle(el).transform); d.base = m.m42; d.y0 = e.clientY - d.base; dy = d.base; stop(el, 't'); }
   d.y = dy < 0 ? dy * .2 : dy;
   el.style.transform = `translateY(${d.y}px)`;
   const scrim = scrimOf(el); if (scrim) scrim.style.opacity = String(clamp(1 - d.y / d.h, 0, 1));
   d.samples.push([e.timeStamp, d.y]); if (d.samples.length > 6) d.samples.shift();
  });
  const end = e => {
   if (!d || d.id !== e.pointerId) return;
   const drag = d; d = null; if (!drag.claimed) return;
   const [t0, y0] = drag.samples[0], v = (drag.y - y0) / Math.max(1, e.timeStamp - t0);
   const from = el.style.transform; el.style.transform = '';
   const scrim = scrimOf(el); if (scrim) scrim.style.opacity = '';
   if (e.type !== 'pointercancel' && (drag.y > drag.h * .3 || v > .5)) {
    play(el, [{transform: from}, {transform: from}], {ms: 1, channel: 't', fill: 'forwards', current: false});
    close(el, {velocity: v});
   } else play(el, [{transform: from}, {transform: 'none'}], {spring: 'smooth', channel: 't', current: false});
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
 }

 /* ---------- Tabs and segmented control: one indicator; the leading edge lands first on tabs. ---------- */
 function parseInset(v) { const m = /inset\(([^)]*)\)/.exec(v || ''); if (!m) return null; const n = m[1].split(/round/)[0].trim().split(/\s+/).map(parseFloat); return [n[0], n[1] ?? n[0], n[2] ?? n[0], n[3] ?? n[1] ?? n[0]]; }
 function tabParts(root) {
  const list = root.matches('[role="tablist"]') ? root : q(root, '[role="tablist"]');
  let ind = q(list, ':scope > .st-tab-indicator');
  if (!ind) { ind = doc.createElement('span'); ind.className = 'st-tab-indicator'; ind.setAttribute('aria-hidden', 'true'); list.prepend(ind); }
  let ink = null;
  if (root.dataset.st === 'segmented') {
   ink = q(list, ':scope > .st-tab-ink');
   if (!ink) { ink = doc.createElement('span'); ink.className = 'st-tab-ink'; ink.setAttribute('aria-hidden', 'true'); list.append(ink); }
  }
  return {list, ind, ink, tabs: qa(list, '[role="tab"]')};
 }
 function layoutInk(parts) {
  if (!parts.ink) return;
  const lr = parts.list.getBoundingClientRect(), ir = parts.ink.getBoundingClientRect();
  parts.ink.replaceChildren(...parts.tabs.map(t => { const r = t.getBoundingClientRect(), s = doc.createElement('span'); s.textContent = t.textContent.trim(); const f = getComputedStyle(t); Object.assign(s.style, {position: 'absolute', left: r.left - ir.left + 'px', top: r.top - ir.top + 'px', width: r.width + 'px', height: r.height + 'px', font: f.font, letterSpacing: f.letterSpacing}); return s; }));
  void lr;
 }
 function indicate(root, tab, animate, keyboard) {
  const parts = tabParts(root), {list, ind, ink} = parts;
  const W = list.clientWidth, L = tab.offsetLeft, R = W - (tab.offsetLeft + tab.offsetWidth);
  const rad = root.dataset.st === 'segmented' ? 8 : 2;
  const target = `inset(0px ${R}px 0px ${L}px round ${rad}px)`;
  const inkTarget = ink ? (() => { const off = ink.offsetLeft; return `inset(0px ${R - (W - off - ink.clientWidth)}px 0px ${L - off}px round ${rad}px)`; })() : null;
  const cur = parseInset(getComputedStyle(ind).clipPath);
  ind.style.clipPath = target; if (ink) ink.style.clipPath = inkTarget;
  if (!animate || !cur || reduced()) { stop(ind, 'clip'); if (ink) stop(ink, 'clip'); return; }
  const [, cr, , cl] = cur; if (Math.abs(cl - L) < .5 && Math.abs(cr - R) < .5) return;
  const stretch = root.dataset.st === 'tabs' && !keyboard;
  const right = L > cl, lt = track(stretch ? (right ? 'trail' : 'lead') : 'snappy'), rt = track(stretch ? (right ? 'lead' : 'trail') : 'snappy');
  const dur = Math.max(lt.length, rt.length) - 1, N = 36, off = ink ? ink.offsetLeft : 0, iw = ink ? ink.clientWidth : 0;
  const frames = [], inkFrames = [];
  for (let i = 0; i <= N; i++) {
   const ms = dur * i / N, l = cl + (L - cl) * at(lt, ms), r = cr + (R - cr) * at(rt, ms);
   frames.push({clipPath: `inset(0px ${r}px 0px ${l}px round ${rad}px)`});
   if (ink) inkFrames.push({clipPath: `inset(0px ${r - (W - off - iw)}px 0px ${l - off}px round ${rad}px)`});
  }
  play(ind, frames, {ms: dur, curve: 'linear', channel: 'clip', current: false});
  if (ink) play(ink, inkFrames, {ms: dur, curve: 'linear', channel: 'clip', current: false});
 }
 function tabSelect(root, tab, keyboard = false) {
  const {tabs} = tabParts(root);
  if (!tab) return;
  const prev = tabs.find(t => t.getAttribute('aria-selected') === 'true');
  const dir = prev ? Math.sign(tabs.indexOf(tab) - tabs.indexOf(prev)) : 0;
  const prevPanel = prev && prev !== tab && !keyboard && !reduced() ? doc.getElementById(prev.getAttribute('aria-controls')) : null;
  if (prevPanel && !prevPanel.hidden && prevPanel.parentElement) { const g = ghost(prevPanel, prevPanel.parentElement); play(g, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: `translateX(${-dir * 6}px)`}], {ms: 80, curve: 'X', fill: 'forwards'}).then(() => g.remove()); }
  tabs.forEach(t => {
   const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
   const panel = doc.getElementById(t.getAttribute('aria-controls'));
   if (panel) { const was = panel.hidden; panel.hidden = !on; if (on && was && prev && prev !== tab) { play(panel, [{transform: `translateX(${dir * 6}px)`}, {transform: 'none'}], {spring: 'snappy', channel: 't', current: false}); play(panel, [{opacity: 0}, {opacity: 1}], {ms: 'quick', curve: 'F', channel: 'o', delay: 30, fade: true, current: false}); } }
  });
  indicate(root, tab, !!prev && prev !== tab, keyboard);
  if (prev !== tab) root.dispatchEvent(new CustomEvent('st:tab-change', {bubbles: true, detail: {tab}}));
 }

 /* ---------- Accordion: content is revealed by a clip that tracks the rows sliding below it. ---------- */
 function accordion(d, want) {
  const opening = want ?? !d.open;
  if (opening === d.open && !d._stGhost) return;
  const body = q(d, '.st-details-body') || d.lastElementChild, host = d.parentElement;
  const g0 = d._stGhost; let startClip = null;
  if (g0) { startClip = getComputedStyle(g0).clipPath; stopAll(g0); g0.remove(); d._stGhost = null; }
  const after = followers(d);
  if (reduced()) { d.open = opening; if (body) body.inert = !opening; return; }
  if (opening) {
   if (startClip) after.forEach(f => stop(f, 'flip'));
   flip(after, () => { d.open = true; }, {spring: 'smooth'});
   if (body) {
    body.inert = false;
    play(body, [{clipPath: startClip && startClip !== 'none' ? startClip : 'inset(0px 0px 100% 0px)'}, {clipPath: 'inset(0px 0px 0% 0px)'}], {spring: 'smooth', channel: 'clip', current: false});
    play(body, [{transform: 'translateY(-4px)'}, {transform: 'none'}], {spring: 'smooth', channel: 't'});
    play(body, [{opacity: 0}, {opacity: 1}], {ms: 'quick', curve: 'F', channel: 'o', delay: 20, fade: true});
   }
  } else {
   let g = null;
   if (body && host) { const cur = getComputedStyle(body).clipPath; g = ghost(body, host); d._stGhost = g; g.style.clipPath = cur === 'none' ? 'inset(0px 0px 0% 0px)' : cur; g.style.opacity = getComputedStyle(body).opacity; }
   flip(after, () => { d.open = false; if (body) { stopAll(body); body.inert = true; } }, {spring: 'smooth'});
   if (g) {
    play(g, [{clipPath: 'inset(0px 0px 100% 0px)'}], {spring: 'smooth', fill: 'forwards'}).then(ok => { if (ok && d._stGhost === g) { g.remove(); d._stGhost = null; } });
    play(g, [{opacity: 0}], {ms: 'quick', curve: 'F', channel: 'o', fill: 'forwards'});
   }
  }
  d.dispatchEvent(new CustomEvent('st:accordion', {bubbles: true, detail: {open: opening}}));
 }

 /* ---------- Button states: loading, success, error in one reserved footprint. ---------- */
 const SVG = {
  spinner: '<svg class="st-spinner" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/></svg>',
  check: '<svg class="st-state-check" viewBox="0 0 16 16" aria-hidden="true"><path class="st-check-path" d="M3.5 8.5l3 3 6-7"/></svg>',
  x: '<svg class="st-state-x" viewBox="0 0 16 16" aria-hidden="true"><path class="st-x-path" d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>'
 };
 function buildButton(el) {
  if (q(el, '.st-button-content')) return;
  const labels = (el.dataset.stLabels || el.textContent.trim()).split('|').map(x => x.trim()).filter(Boolean);
  const idle = el.textContent.trim() || labels[0];
  el.innerHTML = `<span class="st-button-content"><span class="st-state-icon" aria-hidden="true">${SVG.spinner}${SVG.check}${SVG.x}</span><span class="st-button-sizer"><span data-st="text">${idle.replace(/</g, '&lt;')}</span>${labels.map(l => `<span aria-hidden="true">${l.replace(/</g, '&lt;')}</span>`).join('')}</span></span>`;
  // Reserve the widest state: icon plus the longest label, measured once.
  const icon = q(el, '.st-state-icon'); icon.style.display = 'inline-grid'; const w = el.getBoundingClientRect().width; icon.style.display = '';
  el.style.minWidth = Math.ceil(w) + 'px';
  el.dataset.stState = el.dataset.stState || 'idle';
 }
 function state(el, next, label) {
  if (!el) return;
  if (el.dataset.st === 'button') buildButton(el);
  const prev = el.dataset.stState || 'idle'; if (prev === next && label === undefined) return;
  const content = q(el, '.st-button-content'), icon = q(el, '.st-state-icon'), text = q(el, '[data-st="text"]');
  const x0 = content?.getBoundingClientRect().left;
  el.dataset.stState = next;
  el.setAttribute('aria-busy', String(next === 'loading'));
  if (label !== undefined && text) swapText(text, label);
  if (content && !reduced()) {
   const dx = x0 - content.getBoundingClientRect().left;
   if (Math.abs(dx) > .5) play(content, [{transform: `translateX(${dx}px)`}, {transform: 'none'}], {spring: 'snappy', channel: 'flip', current: false});
  }
  if (icon && next !== 'idle' && (prev === 'idle' || prev === undefined)) play(icon, [{opacity: 0, transform: 'scale(.4)', filter: 'blur(2px)'}, {opacity: 1, transform: 'none', filter: 'blur(0px)'}], {spring: 'snappy', fade: true});
  else if (icon && next !== 'idle') play(icon, [{transform: 'scale(.7)'}, {transform: 'none'}], {spring: 'bouncy', current: false});
  if (next === 'error') shake(el);
  if (next === 'success' || next === 'error') announce(label || text?.dataset.stLabel || next);
  el.dispatchEvent(new CustomEvent('st:state', {bubbles: true, detail: {state: next}}));
 }
 function success(el) {
  if (!el) return Promise.resolve();
  if (el.dataset.st === 'button') { state(el, 'success'); return Promise.resolve(); }
  el.dataset.stDone = 'true';
  const svg = q(el, 'svg') || el;
  return play(svg, [{transform: 'scale(.6)', opacity: 0}, {transform: 'none', opacity: 1}], {spring: 'bouncy', fade: true});
 }

 /* ---------- Form error: the field frame shakes with a decaying spring; the message drops into reserved space. ---------- */
 const SHAKE = (() => { const f = []; for (let i = 0; i <= 20; i++) { const t = i / 20; f.push({transform: `translateX(${(-6 * Math.exp(-4.5 * t) * Math.sin(t * Math.PI * 2 * 2.2)).toFixed(2)}px)`}); } f[20] = {transform: 'none'}; return f; })();
 function shake(el, message) {
  if (!el) return Promise.resolve();
  const input = el.matches('input,textarea,select') ? el : q(el, 'input,textarea,select');
  if (el.dataset.st === 'error' || el.hasAttribute('data-st-error') || el.dataset.st !== 'button') el.dataset.stError = 'true';
  input?.setAttribute('aria-invalid', 'true');
  const msg = q(el, '.st-error'); if (msg) { if (message) (q(msg, '[data-st-error-text]') || msg).textContent = message; msg.hidden = false; if (input && msg.id) input.setAttribute('aria-describedby', msg.id); }
  const frame = el.dataset.st === 'button' ? el : q(el, '[data-st-field-frame]') || q(el, '.st-field') || input || el;
  return play(frame, SHAKE, {ms: 320, curve: 'linear', channel: 'shake', current: false});
 }
 function clearError(el) { if (!el) return; delete el.dataset.stError; const input = el.matches('input,textarea,select') ? el : q(el, 'input,textarea,select'); input?.removeAttribute('aria-invalid'); }

 /* ---------- Like: the heart springs, a small ring and six sparks leave from its centre; the count rolls. ---------- */
 function buildLike(el) {
  const heart = q(el, '.st-heart') || q(el, 'svg')?.parentElement; if (!heart || q(heart, '.st-burst')) return;
  const burst = doc.createElement('span'); burst.className = 'st-burst'; burst.setAttribute('aria-hidden', 'true');
  burst.innerHTML = '<b></b>' + '<i></i>'.repeat(6); heart.append(burst);
 }
 function like(el, on) {
  on = on ?? el.getAttribute('aria-pressed') !== 'true';
  el.setAttribute('aria-pressed', String(on));
  const n = q(el, '[data-st="number"]'); if (n) number(n, (states.get(n)?.value ?? Number(n.dataset.value || n.textContent)) + (on ? 1 : -1));
  const svg = q(el, '.st-heart svg') || q(el, 'svg');
  if (on) {
   play(svg, [{transform: 'scale(.55)'}, {transform: 'none'}], {spring: 'bouncy', current: false});
   const burst = q(el, '.st-burst');
   if (burst && !reduced()) {
    play(q(burst, 'b'), [{opacity: .8, transform: 'scale(.3)'}, {opacity: 0, transform: 'scale(1.35)'}], {ms: 380, curve: 'E', current: false});
    qa(burst, 'i').forEach((dot, i) => { const a = i * 60 + 30; play(dot, [{opacity: 1, transform: `rotate(${a}deg) translateY(-6px) scale(1)`}, {opacity: 0, transform: `rotate(${a}deg) translateY(-17px) scale(.2)`}], {ms: 420, curve: 'E', delay: 50, current: false}); });
   }
  } else play(svg, [{transform: 'scale(.86)'}, {transform: 'none'}], {spring: 'snappy', current: false});
  el.dispatchEvent(new CustomEvent('st:like-change', {bubbles: true, detail: {liked: on, value: n ? states.get(n)?.value : undefined}}));
 }

 /* ---------- Copy: the glyph swaps in place and the label confirms; it reverts on its own. ---------- */
 function copy(el, text) {
  const value = text ?? el.dataset.stCopy ?? (el.dataset.stCopyFrom ? doc.querySelector(el.dataset.stCopyFrom)?.textContent : '');
  try { navigator.clipboard?.writeText(value).catch(() => {}); } catch {}
  icon(el, true);
  const label = q(el, '[data-st="text"]'); if (label) { if (!el.dataset.stIdle) el.dataset.stIdle = label.dataset.stLabel || label.textContent.trim(); swapText(label, el.dataset.stCopied || 'Copied'); }
  announce(el.dataset.stCopied || 'Copied');
  clearTimeout(el._stCopy);
  el._stCopy = setTimeout(() => { icon(el, false); if (label) swapText(label, el.dataset.stIdle); }, 1600);
 }
 function icon(el, on) { el.dataset.stOn = String(on); const swap = el.matches('[data-st="icon"],.st-swap') ? el : q(el, '.st-swap,[data-st="icon"]'); if (swap && swap !== el) swap.dataset.stOn = String(on); }

 /* ---------- Lists: add, remove and reorder with FLIP; a removed row fades before its neighbours close the gap. ---------- */
 const rows = container => [...container.children].filter(c => !c.dataset.stGhost && !c.hidden);
 const list = {
  add(container, node, index = 0) {
   const kids = rows(container), ref = kids[index] || null;
   flip(kids, () => container.insertBefore(node, ref), {spring: 'smooth'});
   play(node, [{transform: 'translateY(-6px) scale(.98)'}, {transform: 'none'}], {spring: 'smooth', channel: 't', current: false});
   play(node, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', channel: 'o', delay: 60, fade: true, current: false});
   return node;
  },
  remove(item) {
   const container = item.parentElement; if (!container) return Promise.resolve();
   const kids = rows(container).filter(k => k !== item), idx = rows(container).indexOf(item);
   const focus = item.contains(doc.activeElement);
   const g = reduced() ? null : ghost(item, container);
   flip(kids, () => item.remove(), {spring: 'smooth', delay: 40});
   if (focus) { const n = kids[idx] || kids[idx - 1]; (q(n || container, 'button,a[href],input,[tabindex]') || n)?.focus?.({preventScroll: true}); }
   return g ? play(g, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'scale(.97)'}], {ms: 'quick', curve: 'X', fill: 'forwards'}).then(() => g.remove()) : Promise.resolve();
  },
  reorder(container, order) {
   const kids = rows(container), sorted = typeof order === 'function' ? [...kids].sort(order) : order;
   return flip(kids, () => sorted.forEach(n => container.append(n)), {spring: 'smooth'});
  }
 };

 /* ---------- Skeleton, reveal, shimmer ---------- */
 function skeleton(el, ready) { el.setAttribute('aria-busy', String(!ready)); const real = q(el, '.st-real'); if (real) real.inert = !ready; }
 function reveal(el) { return Promise.all([...el.children].map((x, i) => Promise.all([play(x, [{transform: 'translateY(8px)', filter: 'blur(4px)'}, {transform: 'none', filter: 'blur(0px)'}], {spring: 'smooth', delay: Math.min(i * 20, 60), current: false}), play(x, [{opacity: 0}, {opacity: 1}], {ms: 'surface', curve: 'F', channel: 'o', delay: Math.min(i * 20, 60), current: false, fade: true})]))); }
 function shimmer(el) {
  let shine = q(el, '.st-shine');
  if (!shine) { shine = doc.createElement('span'); shine.className = 'st-shine'; shine.setAttribute('aria-hidden', 'true'); shine.textContent = el.textContent; el.append(shine); }
  return play(shine, [{clipPath: 'polygon(-30% 0,-10% 0,-10% 100%,-30% 100%)'}, {clipPath: 'polygon(110% 0,130% 0,130% 100%,110% 100%)'}], {ms: 'spatial', curve: 'M', current: false});
 }

 /* ---------- Streaming text: words sharpen into place as they arrive, batched per frame. ---------- */
 const streams = new WeakMap();
 function stream(el, chunk, {reset = false, done = false} = {}) {
  let s = streams.get(el); if (!s) streams.set(el, s = {buffer: '', frame: 0});
  if (reset) { cancelAnimationFrame(s.frame); s.frame = 0; s.buffer = ''; el.replaceChildren(); }
  s.buffer += chunk || '';
  el.setAttribute('aria-busy', String(!done));
  const flush = () => {
   s.frame = 0; if (!el.isConnected || !s.buffer) { s.buffer = ''; return; }
   const words = s.buffer.match(/\S+\s*|\s+/g) || []; s.buffer = '';
   words.forEach((w, i) => { const span = doc.createElement('span'); span.className = 'st-word'; span.textContent = w; el.append(span); play(span, [{opacity: 0, filter: 'blur(4px)'}, {opacity: 1, filter: 'blur(0px)'}], {ms: 260, curve: 'F', delay: Math.min(i * 16, 80), fade: true, current: false}); });
  };
  if (done) { cancelAnimationFrame(s.frame); flush(); el.dispatchEvent(new CustomEvent('st:stream-end', {bubbles: true})); }
  else if (!s.frame) s.frame = requestAnimationFrame(flush);
 }

 /* ---------- Toast stack: newest in front, older cards tuck behind; hover, focus or tap fans them out. ---------- */
 const regions = new WeakMap();
 function regionState(region) {
  let s = regions.get(region); if (s) return s;
  s = {expanded: false, toasts: []}; regions.set(region, s);
  region.setAttribute('aria-live', 'polite');
  const set = v => { if (s.expanded === v) return; s.expanded = v; layoutToasts(region); s.toasts.forEach(t => v ? t.pause() : t.resume()); };
  if (matchMedia('(hover: hover)').matches) { region.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') set(true); }); region.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') set(false); }); }
  region.addEventListener('focusin', () => set(true)); region.addEventListener('focusout', e => { if (!region.contains(e.relatedTarget)) set(false); });
  region.addEventListener('click', e => { if (!e.target.closest('button') && e.pointerType !== 'mouse') set(!s.expanded); });
  s.set = set; return s;
 }
 function layoutToasts(region) {
  const s = regionState(region), list = s.toasts.filter(t => !t.leaving);
  const front = list[0]?.el.offsetHeight || 0; let offset = 0;
  list.forEach((t, i) => {
   const h = t.el.offsetHeight; let y, sc = 1, op = 1;
   if (s.expanded) { y = -offset; offset += h + 8; }
   else { sc = 1 - i * .05; y = Math.min(0, h * sc - front) - i * 10; op = i < 3 ? 1 : 0; }
   t.el.style.transform = `translateY(${y}px) scale(${sc})`; t.el.style.opacity = String(op); t.el.style.zIndex = String(50 - i);
   t.el.toggleAttribute('data-st-hidden-content', !s.expanded && i > 0);
   t.el.inert = !s.expanded && i > 0; t.el.setAttribute('aria-hidden', String(!s.expanded && i > 0));
  });
 }
 function toast(region, message, o = {}) {
  const s = regionState(region);
  const el = doc.createElement(region.tagName === 'OL' || region.tagName === 'UL' ? 'li' : 'div');
  el.className = 'st-toast'; el.setAttribute('role', 'status');
  const body = doc.createElement('div'); body.className = 'st-toast-body';
  const title = doc.createElement('strong'); title.textContent = message; body.append(title);
  if (o.description) { const d = doc.createElement('small'); d.textContent = o.description; body.append(d); }
  el.append(body);
  if (o.action) { const a = doc.createElement('button'); a.type = 'button'; a.className = 'st-button'; a.textContent = o.action.label || o.action; a.addEventListener('click', () => { o.action.onClick?.(); dismiss(); }); el.append(a); }
  const x = doc.createElement('button'); x.type = 'button'; x.className = 'st-button st-ghost st-toast-close'; x.setAttribute('aria-label', 'Dismiss notification');
  x.innerHTML = '<svg class="st-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>'; x.addEventListener('click', () => dismiss()); el.append(x);
  const t = {el, leaving: false, remaining: o.duration ?? 4000, timer: 0, started: 0,
   pause() { clearTimeout(t.timer); if (t.started) t.remaining -= performance.now() - t.started; t.started = 0; },
   resume() { if (t.leaving || t.remaining === Infinity || s.expanded) return; t.started = performance.now(); t.timer = setTimeout(dismiss, Math.max(600, t.remaining)); }};
  function dismiss(dir = 0) {
   if (t.leaving) return; t.leaving = true; clearTimeout(t.timer);
   if (el.contains(doc.activeElement)) (region._stTrigger || s.toasts.find(x => !x.leaving)?.el.querySelector('button'))?.focus?.({preventScroll: true});
   el.dataset.stLeaving = ''; el.inert = true;
   const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
   el.style.transform = dir ? `translate(${m.m41 + dir * (el.offsetWidth + 24)}px, ${m.m42}px)` : `translateY(${m.m42 + 14}px) scale(${m.a * .97})`;
   el.style.opacity = '0';
   s.toasts = s.toasts.filter(x => x !== t); layoutToasts(region);
   setTimeout(() => el.remove(), reduced() ? 120 : 220);
  }
  let drag = null;
  el.addEventListener('pointerdown', e => { if (e.target.closest('button') || !e.isPrimary) return; drag = {id: e.pointerId, x0: e.clientX, dx: 0, claimed: false, base: getComputedStyle(el).transform, samples: [[e.timeStamp, 0]]}; });
  el.addEventListener('pointermove', e => {
   if (!drag || drag.id !== e.pointerId) return;
   const dx = e.clientX - drag.x0;
   if (!drag.claimed) { if (Math.abs(dx) < 5) return; drag.claimed = true; el.setPointerCapture(e.pointerId); el.dataset.stDragging = ''; }
   drag.dx = dx; el.style.transform = `translateX(${dx}px) ${drag.base === 'none' ? '' : drag.base}`; el.style.opacity = String(clamp(1 - Math.abs(dx) / (el.offsetWidth * 1.2), 0, 1));
   drag.samples.push([e.timeStamp, dx]); if (drag.samples.length > 6) drag.samples.shift();
  });
  const release = e => {
   if (!drag || drag.id !== e.pointerId) return; const d = drag; drag = null; delete el.dataset.stDragging; if (!d.claimed) return;
   const [t0, x0] = d.samples[0], v = (d.dx - x0) / Math.max(1, e.timeStamp - t0);
   if (e.type !== 'pointercancel' && (Math.abs(d.dx) > 70 || Math.abs(v) > .45)) dismiss(Math.sign(d.dx || v)); else layoutToasts(region);
  };
  el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
  el.style.transform = 'translateY(calc(100% + 16px)) scale(.97)'; el.style.opacity = '0'; el.style.transition = 'none';
  region.append(el); s.toasts.unshift(t);
  void el.offsetHeight; el.style.transition = '';
  layoutToasts(region);
  s.toasts.slice(4).forEach(old => { old.remaining = 0; old.leaving = true; clearTimeout(old.timer); old.el.remove(); });
  s.toasts = s.toasts.filter(x => x.el.isConnected);
  t.resume();
  return {element: el, dismiss};
 }

 /* ---------- Expand: a card opens into its detail; the surface unclips from the card, shared parts travel. ---------- */
 function sharedPairs(source, detail) {
  return qa(detail, '[data-st-shared]').map(d => [q(source, `[data-st-shared="${d.dataset.stShared}"]`), d]).filter(([s]) => s);
 }
 function sharedFrom(src, dst) {
  const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
  // Text travels by translation only and re-renders at its own size, so glyphs are never scaled.
  if (dst.hasAttribute('data-st-shared-text')) return {origin: '0 0', text: true, transform: `translate(${a.left - b.left}px, ${a.top + a.height / 2 - b.top - b.height / 2}px)`};
  return {origin: '50% 50%', transform: `translate(${a.left + a.width / 2 - b.left - b.width / 2}px, ${a.top + a.height / 2 - b.top - b.height / 2}px) scale(${a.width / b.width}, ${a.height / b.height})`};
 }
 function expand(source, detail) {
  if (!source || !detail) return;
  const s = layerState(detail); const wasClosing = s.closing; s.source = source; s.open = true; s.closing = false; const v = ++s.version;
  detail.dataset.stOpen = 'true'; detail.hidden = false; detail.inert = false; active.add(detail);
  if (detail.tagName === 'DIALOG' && !detail.open) detail.showModal();
  s.trigger = source; source.setAttribute('aria-expanded', 'true');
  const surface = q(detail, '.st-expand-surface') || detail, scrim = q(detail, '[data-st-scrim]');
  const pairs = sharedPairs(source, detail), radius = getComputedStyle(source).borderRadius || '12px';
  const sr = source.getBoundingClientRect(), dr = surface.getBoundingClientRect();
  const from = `inset(${sr.top - dr.top}px ${dr.right - sr.right}px ${dr.bottom - sr.bottom}px ${sr.left - dr.left}px round ${parseFloat(radius)}px)`;
  const endR = parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 16;
  source.style.visibility = 'hidden';
  if (scrim) { scrim.dataset.stOpen = 'true'; play(scrim, [{opacity: 0}, {opacity: 1}], {ms: 'surface', curve: 'F', fade: true}); }
  play(surface, [{clipPath: from}, {clipPath: `inset(0px 0px 0px 0px round ${endR}px)`}], {spring: 'smooth', channel: 'clip', current: wasClosing});
  if (reduced()) play(surface, [{opacity: 0}, {opacity: 1}], {ms: 'quick', fade: true, channel: 'o'});
  for (const [a, b] of pairs) { const f = sharedFrom(a, b); b.style.transformOrigin = f.origin; play(b, [{transform: f.transform}, {transform: 'none'}], {spring: 'smooth', channel: 'shared', current: wasClosing}); if (f.text) play(b, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', delay: 60, channel: 'o', current: wasClosing, fade: true}); }
  qa(surface, '[data-st-expand-content]').forEach(c => { play(c, [{opacity: 0}, {opacity: 1}], {ms: 'quick', curve: 'F', delay: 60, channel: 'o', fade: true}); play(c, [{transform: 'translateY(4px)'}, {transform: 'none'}], {spring: 'smooth', delay: 50, channel: 't'}); });
  (q(detail, '[data-st-close]') || focusFirst(detail))?.focus?.({preventScroll: true});
  void v;
 }
 function collapse(detail) {
  const s = layerState(detail); if (!s.open || !s.source) return;
  s.open = false; s.closing = true; const v = ++s.version, source = s.source;
  source.setAttribute('aria-expanded', 'false');
  const surface = q(detail, '.st-expand-surface') || detail, scrim = q(detail, '[data-st-scrim]');
  if (detail.contains(doc.activeElement)) source.focus({preventScroll: true});
  detail.inert = true;
  const sr = source.getBoundingClientRect(), dr = surface.getBoundingClientRect(), rad = parseFloat(getComputedStyle(source).borderRadius) || 12;
  if (scrim) { scrim.dataset.stOpen = 'false'; play(scrim, [{opacity: 0}], {ms: 'control', curve: 'F', fade: true, fill: 'forwards'}); }
  qa(surface, '[data-st-expand-content]').forEach(c => play(c, [{opacity: 0}], {ms: 'feedback', curve: 'F', channel: 'o', fill: 'forwards', fade: true}));
  for (const [a, b] of sharedPairs(source, detail)) { const f = sharedFrom(a, b); b.style.transformOrigin = f.origin; play(b, [{transform: f.transform}], {spring: 'smooth', channel: 'shared', fill: 'forwards'}); if (f.text) play(b, [{opacity: 0}], {ms: 'feedback', curve: 'F', channel: 'o', fill: 'forwards', fade: true}); }
  const done = play(surface, [{clipPath: `inset(${sr.top - dr.top}px ${dr.right - sr.right}px ${dr.bottom - sr.bottom}px ${sr.left - dr.left}px round ${rad}px)`}], {spring: 'smooth', channel: 'clip', fill: 'forwards'});
  const finish = () => { if (s.version !== v || s.open) return; s.closing = false; source.style.visibility = ''; qa(source, '[data-st-shared]').forEach(n => { if (q(detail, `[data-st-shared="${n.dataset.stShared}"][data-st-shared-text]`)) fadeIn(n, {ms: 'quick'}); }); detail.dataset.stOpen = 'false'; active.delete(detail); if (detail.tagName === 'DIALOG' && detail.open) detail.close(); stopAll(surface); qa(detail, '*').forEach(stopAll); if (scrim) stopAll(scrim); };
  if (reduced()) { play(surface, [{opacity: 0}], {ms: 'quick', fade: true, channel: 'o', fill: 'forwards'}).then(finish); return; }
  done.then(finish);
 }

 /* ---------- Page: View Transitions with a slide in the navigation direction and shared elements; WAAPI fallback. ---------- */
 let pageVT = null, pageVersion = 0;
 async function page(direction, update, el = doc.documentElement, o = {}) {
  const dir = direction === 'back' ? -1 : 1, v = ++pageVersion, root = doc.documentElement;
  if (reduced()) { await update(); return; }
  const scope = el && el !== root ? el : null;
  if (doc.startViewTransition && !o.fallback) {
   try { pageVT?.skipTransition(); } catch {}
   root.style.setProperty('--st-dir', dir);
   const keys = new Set(o.shared || []);
   const name = () => qa(scope || doc, '[data-st-shared]').forEach(n => { if (keys.has(n.dataset.stShared)) { n.style.viewTransitionName = 'st-shared-' + n.dataset.stShared.replace(/[^\w-]/g, '_'); n.style.viewTransitionClass = 'st-shared'; } });
   const unname = () => qa(doc, '[data-st-shared]').forEach(n => { n.style.viewTransitionName = ''; n.style.viewTransitionClass = ''; });
   if (scope) { root.classList.add('st-vt'); scope.style.viewTransitionName = 'st-page'; }
   name();
   const vt = doc.startViewTransition(async () => { unname(); await update(); name(); });
   pageVT = vt;
   vt.finished.finally(() => { if (pageVT === vt) { pageVT = null; root.classList.remove('st-vt'); if (scope) scope.style.viewTransitionName = ''; unname(); } });
   return vt.updateCallbackDone;
  }
  await update(); if (v !== pageVersion) return;
  const target = scope || doc.body;
  play(target, [{transform: `translateX(${dir * 24}px)`}, {transform: 'none'}], {spring: 'smooth', channel: 't'});
  return play(target, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', channel: 'o', fade: true});
 }

 /* ---------- Command palette: filter with FLIP, one highlight travels between results. ---------- */
 function palette(el) {
  const input = q(el, '[data-st-palette-input]') || q(el, 'input'), box = q(el, '[role="listbox"]'); if (!input || !box) return;
  positioned(box);
  let hl = q(box, '.st-palette-highlight'); if (!hl) { hl = doc.createElement('span'); hl.className = 'st-palette-highlight'; hl.setAttribute('aria-hidden', 'true'); box.prepend(hl); }
  const opts = () => qa(box, '[role="option"]').filter(o => !o.hidden);
  let activeOpt = null;
  const setActive = (opt, instant) => {
   activeOpt = opt; qa(box, '[role="option"]').forEach(o => o.setAttribute('aria-selected', String(o === opt)));
   if (!opt) { hl.style.opacity = '0'; input.removeAttribute('aria-activedescendant'); return; }
   if (!opt.id) opt.id = 'st-opt-' + Math.random().toString(36).slice(2, 8);
   input.setAttribute('aria-activedescendant', opt.id);
   const y = opt.offsetTop, h = opt.offsetHeight;
   hl.style.height = h + 'px'; hl.style.transition = instant || hl.style.opacity === '0' ? 'none' : ''; hl.style.transform = `translateY(${y}px)`; hl.style.opacity = '1';
   void hl.offsetHeight; hl.style.transition = '';
   opt.scrollIntoView?.({block: 'nearest'});
  };
  input.addEventListener('input', () => {
   const term = input.value.trim().toLowerCase(), all = qa(box, '[role="option"]');
   const visible = all.filter(o => !o.hidden), leaving = visible.filter(o => !o.textContent.toLowerCase().includes(term));
   const ghosts = reduced() ? [] : leaving.map(o => ghost(o, box));
   flip(visible.filter(o => !leaving.includes(o)), () => { all.forEach(o => { const was = o.hidden; o.hidden = !o.textContent.toLowerCase().includes(term); if (was && !o.hidden) fadeIn(o, {ms: 'control'}); }); }, {spring: 'snappy'});
   ghosts.forEach(g => play(g, [{opacity: 1}, {opacity: 0}], {ms: 'feedback', curve: 'F', fill: 'forwards'}).then(() => g.remove()));
   const empty = q(el, '[data-st-palette-empty]'); if (empty) empty.hidden = opts().length > 0;
   setActive(opts()[0] || null);
  });
  input.addEventListener('keydown', e => {
   const list = opts(); let i = list.indexOf(activeOpt);
   if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length; setActive(list[i]); }
   else if (e.key === 'Enter' && activeOpt) { e.preventDefault(); activeOpt.click(); }
  });
  box.addEventListener('pointermove', e => { const o = e.target.closest('[role="option"]'); if (o && o !== activeOpt) setActive(o); });
  box.addEventListener('click', e => { const o = e.target.closest('[role="option"]'); if (!o) return; el.dispatchEvent(new CustomEvent('st:palette-select', {bubbles: true, detail: {option: o, value: o.dataset.value || o.textContent.trim()}})); close(el); });
  el.addEventListener('st:open', () => { if (input.value) { input.value = ''; input.dispatchEvent(new Event('input')); } setActive(opts()[0] || null, true); requestAnimationFrame(() => input.focus()); });
  setActive(opts()[0] || null, true);
 }

 /* ---------- Tooltips: dwell once, then the bubble glides between neighbours. Focus and long-press work too. ---------- */
 let tipTimer = 0, tipOpen = null, tipWarm = 0;
 const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
 function showTip(trigger, immediate) {
  const tip = doc.getElementById(trigger.dataset.stTip); if (!tip) return;
  clearTimeout(tipTimer);
  const go = () => {
   let glide = null;
   if (tipOpen && tipOpen !== tip && isOpen(tipOpen) && !layerState(tipOpen).closing) { glide = tipOpen.getBoundingClientRect(); close(tipOpen, {instant: true}); }
   else if (tipOpen && tipOpen !== tip) close(tipOpen, {instant: true});
   tipOpen = tip; open(tip, trigger, {glideFrom: glide, focus: false});
  };
  if (immediate || performance.now() < tipWarm || (tipOpen && isOpen(tipOpen))) go(); else tipTimer = setTimeout(go, 400);
 }
 function hideTip(delay = 0) {
  clearTimeout(tipTimer);
  const hide = () => { if (tipOpen) { close(tipOpen); tipWarm = performance.now() + 300; tipOpen = null; } };
  if (delay) tipTimer = setTimeout(hide, delay); else hide();
 }
 function bindTip(trigger) {
  const tip = doc.getElementById(trigger.dataset.stTip); if (!tip) return;
  tip.setAttribute('role', 'tooltip'); trigger.setAttribute('aria-describedby', tip.id);
  if (!q(tip, '.st-tip-label')) { const label = doc.createElement('span'); label.className = 'st-tip-label'; label.append(...tip.childNodes); tip.append(label); }
  if (tip.hasAttribute('popover')) tip.popover = 'manual';
  trigger.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && finePointer.matches) showTip(trigger, false); });
  trigger.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hideTip(80); });
  trigger.addEventListener('focus', () => { if (trigger.matches(':focus-visible')) showTip(trigger, true); });
  trigger.addEventListener('blur', () => hideTip());
  let press = 0;
  trigger.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { hideTip(); return; } press = setTimeout(() => { showTip(trigger, true); setTimeout(() => hideTip(), 1500); }, 450); });
  ['pointerup', 'pointercancel', 'pointermove'].forEach(t => trigger.addEventListener(t, e => { if (t !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(press); }));
 }

 /* ---------- Init ---------- */
 const initialized = new WeakSet();
 function init(root = doc) {
  const nodes = [...(root.matches?.('[data-st]') ? [root] : []), ...qa(root, '[data-st]')].filter(el => !el.closest('[data-st-ghost]'));
  for (const el of nodes) {
   if (initialized.has(el)) continue; initialized.add(el);
   const kind = el.dataset.st;
   if (el.hasAttribute('popover') && POP.includes(kind)) el.popover = 'manual';
   if (el.tagName === 'DIALOG') {
    el.addEventListener('cancel', e => { e.preventDefault(); close(el); });
    el.addEventListener('click', e => { if (e.target !== el || el.hasAttribute('data-st-static')) return; const r = el.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(el); });
   }
   if (kind === 'number' || kind === 'badge') number(el, el.dataset.value ?? el.textContent.trim().replace(/[^\d.-]/g, ''));
   if (kind === 'panel' || kind === 'sheet' || kind === 'drawer') { if (el.tagName !== 'DIALOG' && el.dataset.stOpen !== 'true') el.inert = true; }
   if (kind === 'sheet') sheetDrag(el);
   if (kind === 'skeleton') skeleton(el, el.getAttribute('aria-busy') === 'false');
   if (kind === 'button') buildButton(el);
   if (kind === 'like') { buildLike(el); el.addEventListener('click', () => like(el)); }
   if (kind === 'copy') el.addEventListener('click', () => copy(el));
   if (kind === 'palette') palette(el);
   if (kind === 'reveal' || kind === 'shimmer') observer.observe(el);
   if (kind === 'text' || kind === 'thinking') { if (!el.dataset.stLabel) el.dataset.stLabel = el.textContent.trim(); }
   if (kind === 'accordion') {
    const summary = q(el, 'summary'), body = q(el, '.st-details-body');
    if (body && !el.open) body.inert = true;
    summary?.addEventListener('click', e => { e.preventDefault(); accordion(el); });
   }
   if (kind === 'menu' || kind === 'plus-menu') {
    el.setAttribute('tabindex', '-1');
    el.addEventListener('keydown', e => {
     const items = qa(el, '[role="menuitem"]:not([disabled]),button:not([disabled]):not(.st-origin-close),a[href]'); let i = items.indexOf(doc.activeElement);
     if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); i = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : i < 0 ? (e.key === 'ArrowDown' ? 0 : items.length - 1) : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items[i]?.focus(); }
     if (e.key === 'Tab') close(el);
    });
    el.addEventListener('click', e => { if (e.target.closest('[role="menuitem"]') && !e.target.closest('[data-st-keep-open]')) close(el); });
   }
   if (kind === 'tabs' || kind === 'segmented') {
    const parts = tabParts(el);
    parts.tabs.forEach(t => {
     t.addEventListener('click', () => tabSelect(el, t));
     t.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const i = parts.tabs.indexOf(t), n = parts.tabs[e.key === 'Home' ? 0 : e.key === 'End' ? parts.tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + parts.tabs.length) % parts.tabs.length];
      tabSelect(el, n, true); n.focus();
     });
    });
    const sync = () => { if (!el.isConnected) return ro.disconnect(); layoutInk(parts); const sel = parts.tabs.find(t => t.getAttribute('aria-selected') === 'true') || parts.tabs[0]; if (sel) indicate(el, sel, false); };
    const ro = new ResizeObserver(sync); ro.observe(parts.list);
    tabSelect(el, parts.tabs.find(t => t.getAttribute('aria-selected') === 'true') || parts.tabs[0], true); layoutInk(parts);
    doc.fonts?.ready.then(sync);
   }
   if (kind === 'avatars') {
    const lift = index => [...el.children].forEach((x, i) => { const dist = Math.abs(index - i); x.style.setProperty('--st-lift', index < 0 ? '0px' : `${-Math.max(0, 6 - dist * 2)}px`); x.style.setProperty('--st-z', i === index ? '5' : '0'); });
    [...el.children].forEach((x, i) => { x.addEventListener('pointerenter', () => { if (finePointer.matches) lift(i); }); x.addEventListener('focus', () => lift(i)); });
    el.addEventListener('pointerleave', () => lift(-1)); el.addEventListener('focusout', () => lift(-1));
   }
   if (kind === 'clear') {
    const input = q(el, 'input'), button = q(el, 'button'); const sync = () => { button.disabled = !input.value; }; sync(); input.addEventListener('input', sync);
    button.addEventListener('click', () => { const g = doc.createElement('span'); g.textContent = input.value; g.setAttribute('aria-hidden', 'true'); const cs = getComputedStyle(input); Object.assign(g.style, {position: 'absolute', left: cs.paddingLeft, top: '50%', translate: '0 -50%', font: cs.font, color: cs.color, pointerEvents: 'none', whiteSpace: 'nowrap'}); el.append(g); input.value = ''; input.dispatchEvent(new Event('input', {bubbles: true})); input.focus(); play(g, [{opacity: 1, transform: 'none', filter: 'blur(0px)'}, {opacity: 0, transform: 'translateX(-6px)', filter: 'blur(3px)'}], {ms: 'quick', curve: 'X', fill: 'forwards'}).then(() => g.remove()); });
   }
  }
  qa(root, '[data-st-tip]').forEach(t => { if (!initialized.has(t)) { initialized.add(t); bindTip(t); } });
 }
 const observer = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => { if (!isIntersecting) return; if (target.dataset.st === 'reveal') { reveal(target); observer.unobserve(target); } if (target.dataset.st === 'shimmer' && !target.dataset.stPlayed) { target.dataset.stPlayed = 'true'; shimmer(target); } }));

 // Delegated triggers, outside press and Escape for managed layers.
 doc.addEventListener('click', e => {
  const trigger = e.target.closest('[data-st-target],[popovertarget]');
  if (trigger && !trigger.disabled) {
   const el = doc.getElementById(trigger.dataset.stTarget || trigger.getAttribute('popovertarget'));
   if (el && el.dataset.st) { e.preventDefault(); if (el.dataset.st === 'expand') { isOpen(el) && !layerState(el).closing ? collapse(el) : expand(trigger, el); } else toggle(el, trigger, {keyboard: e.detail === 0}); return; }
  }
  const dismiss = e.target.closest('[data-st-close]');
  if (dismiss) { const layer = dismiss.closest('[data-st="expand"]'); if (layer) collapse(layer); else close(dismiss.closest('dialog,[popover],[data-st="panel"],[data-st="sheet"],[data-st="drawer"],[data-st="modal"]')); return; }
  const scrim = e.target.closest('[data-st-scrim]');
  if (scrim) { const layer = [...active].reverse().find(l => scrimOf(l) === scrim || l.contains(scrim)); if (layer) layer.dataset.st === 'expand' ? collapse(layer) : close(layer); }
 });
 doc.addEventListener('pointerdown', e => {
  if (e.target.closest?.('[data-st-keep]')) return;
  for (const el of [...active]) {
   if (!POP.includes(el.dataset.st) || el.dataset.st === 'tooltip') continue;
   const s = layers.get(el); if (el.contains(e.target) || s?.trigger?.contains(e.target)) continue;
   close(el, {silent: !e.target.closest('input,textarea,select,button,a')});
  }
 }, true);
 doc.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (tipOpen) { hideTip(); }
  const top = [...active].reverse().find(el => el.tagName !== 'DIALOG' && el.dataset.st !== 'tooltip' && isOpen(el) && !layerState(el).closing);
  if (top) { e.preventDefault(); top.dataset.st === 'expand' ? collapse(top) : close(top); }
 });
 let frame = 0;
 const reposition = () => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; for (const el of active) { const s = layers.get(el); if (POP.includes(el.dataset.st) && s?.trigger && el.matches(':popover-open')) place(el, s.trigger); } }); };
 addEventListener('resize', reposition); addEventListener('scroll', reposition, {capture: true, passive: true});
 mq.addEventListener('change', () => { if (mq.matches) doc.getAnimations().forEach(a => { try { a.finish(); } catch { a.cancel(); } }); });

 const mutation = new MutationObserver(records => {
  for (const r of records) {
   if (r.type === 'attributes' && ['number', 'badge'].includes(r.target.dataset.st)) { number(r.target, r.target.dataset.value); if (r.target.dataset.st === 'badge') pop(r.target); }
   for (const n of r.addedNodes) if (n.nodeType === 1 && !n.dataset.stGhost) init(n);
   for (const n of r.removedNodes) if (n.nodeType === 1 && !n.isConnected) { for (const l of [...active]) if (n === l || n.contains(l)) active.delete(l); }
  }
 });
 const start = () => { init(); mutation.observe(doc.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-value']}); };
 if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, {once: true}); else start();

 window.SeenryTransitions = {
  // v1 API (unchanged names)
  number, swapText, shake, success, page, resize, pop, open, close, icon, skeleton, reveal, shimmer, stream, toast, init, tab: tabSelect,
  // v2 additions
  toggle, state, clearError, copy, like, list, expand, collapse, accordion, flip, play, spring, tooltip: {show: t => showTip(t, true), hide: () => hideTip()}
 };
})();
