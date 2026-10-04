/* Seenry Transitions 3. Original implementation, MIT. Classic script; no dependencies.
   Every animation starts from the currently rendered value, so a second input reverses a change mid-flight. */
(function () {
 'use strict';
 const doc = document, mq = matchMedia('(prefers-reduced-motion: reduce)'), reduced = () => mq.matches;
 const q = (el, s) => el.querySelector(s), qa = (el, s) => [...el.querySelectorAll(s)];
 const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
 const CURVES = {E: 'cubic-bezier(.16,1,.3,1)', O: 'cubic-bezier(.3,1,0,1)', S: 'cubic-bezier(.25,0,.06,1)', M: 'cubic-bezier(.4,0,.2,1)', F: 'cubic-bezier(.2,0,.2,1)', X: 'cubic-bezier(.4,0,1,1)'};
 const MS = {instant: 0, feedback: 120, quick: 180, control: 220, relocate: 260, surface: 320, spatial: 380, fast: 180, base: 220, slow: 320, page: 380};
 // spring(response seconds, bounce), the parameterisation designers know from SwiftUI. lead/trail drive a two-edge indicator.
 const SPRINGS = {expand: [0.36,0], snappy: [0.32,0.04], smooth: [0.42,0], gentle: [0.4,0.08], bouncy: [0.4,0.42], thumb: [0.32,0.28], lead: [0.2,0], trail: [0.28,0]};
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
 // Evaluate a cubic-bezier easing at progress x (Newton steps), for paths sampled into keyframes.
 function bez(x1, y1, x2, y2) { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, D = t => (3 * ax * t + 2 * bx) * t + cx; return x => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 6; i++) { const d = D(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - x) / d; } return Y(Math.min(1, Math.max(0, t))); }; }
 const easeE = bez(.16, 1, .3, 1);
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
 const channels = new WeakMap(), heldStyles = new WeakMap();
 // Filter is a single visual property: the latest blur companion owns it, together
 // with the channel that requested it. Unrelated channel stops leave it alone.
 const blurAnims = new WeakMap();
 function stopBlur(el, key) {
  const owned = blurAnims.get(el);
  if (!owned || (key !== undefined && owned.key !== key)) return;
  blurAnims.delete(el); owned.animation.cancel();
 }
 function play(el, frames, o = {}) {
  if (!el || !el.animate) return Promise.resolve(true);
  const key = (o.channel || 'main') + (o.pseudo || '');
  const previousBlur = !o.pseudo && blurAnims.get(el), renderedBlur = previousBlur ? getComputedStyle(el).filter : null;
  let map = channels.get(el); if (!map) channels.set(el, map = new Map());
  const prev = map.get(key);
  let held = heldStyles.get(el); if (!held) heldStyles.set(el, held = new Map());
  const committed = held.get(key);
  // A single keyframe is a target: start it from the rendered value.
  if (((prev || committed || (previousBlur && frames.some(f => 'filter' in f))) && o.current !== false) || frames.length === 1) {
   const cs = getComputedStyle(el, o.pseudo || null), first = {};
   for (const p of Object.keys(frames[frames.length - 1])) if (p !== 'offset' && p !== 'easing' && p !== 'composite') first[p] = cs[p];
   // clip-path 'none' does not interpolate; start from the equivalent full inset instead.
   if (first.clipPath === 'none') { const r = /round ([\d.]+px)/.exec(String(frames[frames.length - 1].clipPath)); first.clipPath = `inset(0px 0px 0px 0px${r ? ' round ' + r[1] : ''})`; }
   frames = frames.length === 1 ? [first, frames[0]] : [first, ...frames.slice(1)];
  }
  // Sample a superseded filter before retirement; pseudo-element filters own a separate target.
  if (!o.pseudo) { if (reduced() || frames.some(f => 'filter' in f)) stopBlur(el); else stopBlur(el, key); }
  prev?.cancel();
  if (committed) { for (const [prop, value] of Object.entries(committed)) el.style[prop] = value; held.delete(key); }
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
  // Blur option: inside [data-st-blur], a fade on a small element also pulls focus (blur to sharp on the way in, a
  // softer blur on the way out). Large surfaces never blur; reduced motion already returned above.
  const blurHost = !reduced() && !o.pseudo && o.blur !== false && el.closest?.('[data-st-blur]');
  // Deliberately animated filters (including another authored WAAPI/CSS effect) own
  // their property. An opacity fade must not freeze that moving value into a second blur.
  const ownsFilter = blurHost && ([...(el.getAnimations?.() || [])].some(a => a !== blurAnims.get(el)?.animation && !a.effect?.pseudoElement && a.effect?.target === el && a.effect.getKeyframes().some(f => 'filter' in f)) || [...held.values()].some(saved => 'filter' in saved));
  let blurIn = 0;
  if (blurHost && !ownsFilter && frames.length >= 2 && 'opacity' in frames[0] && 'opacity' in frames[frames.length - 1] && !frames.some(f => 'filter' in f)) {
   const r = el.getBoundingClientRect(), px = parseFloat(blurHost.dataset.stBlur) || 8;
   if (r.width * r.height > 0 && r.width * r.height <= 160000) {
    const a0 = +frames[0].opacity, a1 = +frames[frames.length - 1].opacity;
    // Blur runs on its own, longer and gentler clock than the fade: opacity arrives fast, and the focus resolves
    // visibly behind it. On the way out the element defocuses quickly as it leaves.
    blurIn = a1 > a0 ? 1 : a1 < a0 ? -1 : 0;
    if (blurIn) {
     stopBlur(el);
     const baseFilter = getComputedStyle(el).filter || 'none';
     const blurFilter = px => `${baseFilter === 'none' ? '' : baseFilter + ' '}blur(${px}px)`;
     // A reversal continues from the actual filter before cancelling its old companion.
     const firstFilter = renderedBlur || blurFilter(blurIn > 0 ? px : 0);
     const ba = el.animate([{filter: firstFilter}, {filter: blurFilter(blurIn > 0 ? 0 : px * .6)}],
      {duration: blurIn > 0 ? Math.max(300, duration * 1.4) : Math.max(120, duration), easing: blurIn > 0 ? 'cubic-bezier(.25,.1,.25,1)' : CURVES.X, delay, fill: blurIn > 0 ? 'backwards' : 'both'});
     const owned = {key, animation: ba}; blurAnims.set(el, owned);
     const release = () => { if (blurAnims.get(el) === owned) blurAnims.delete(el); ba.cancel(); };
     ba.finished.then(release, release);
    }
   }
  }
  const a = el.animate(frames, {duration, easing, delay, fill: o.fill==='forwards'?'both':o.fill||'backwards', pseudoElement: o.pseudo});
  map.set(key, a);
  return a.finished.then(() => {
   if (map.get(key) !== a) { a.cancel(); return false; }
   if (o.fill === 'forwards' && !o.pseudo) {
    const last = frames[frames.length - 1], saved = {};
    for (const prop of Object.keys(last)) if (!['offset','easing','composite'].includes(prop)) saved[prop] = el.style[prop];
    try { a.commitStyles(); } catch { for (const prop of Object.keys(saved)) el.style[prop] = last[prop]; }
    held.set(key, saved);
   }
   map.delete(key); a.cancel(); return true;
  }, () => { a.cancel(); return false; });
 }
 function stop(el, channel = 'main') {
  stopBlur(el, channel);
  const map = channels.get(el), a = map?.get(channel); if (a) { a.cancel(); map.delete(channel); }
  const held = heldStyles.get(el), saved = held?.get(channel);
  if (saved) { Object.assign(el.style, saved); held.delete(channel); }
 }
 function stopAll(el) {
  stopBlur(el);
  const map = channels.get(el); if (map) { for (const a of map.values()) a.cancel(); map.clear(); }
  const held = heldStyles.get(el); if (held) { for (const saved of held.values()) Object.assign(el.style, saved); held.clear(); }
 }
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
   const dx = o.axis === 'y' ? 0 : o.scale ? f.left+f.width/2-l.left-l.width/2 : f.left-l.left, dy = o.scale ? f.top+f.height/2-l.top-l.height/2 : f.top-l.top;
   const sx = o.scale && l.width ? f.width / l.width : 1, sy = o.scale && l.height ? f.height / l.height : 1;
   if (Math.abs(dx) < .5 && Math.abs(dy) < .5 && Math.abs(sx - 1) < .005 && Math.abs(sy - 1) < .005) continue;
   jobs.push(play(e, [{transform: `translate(${dx}px, ${dy}px)${o.scale ? ` scale(${sx}, ${sy})` : ''}`}, {transform: 'none'}], {...(o.ms ? {ms:o.ms,curve:o.curve||'E'} : {spring: o.spring || 'smooth'}), channel: 'flip', current: false, delay: o.delay || 0}));
  }
  return Promise.all(jobs);
 }
 // The first opaque background behind an element, for content that must cover what it passes over.
 function backdrop(el) { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba\(.*,\s*0\)$|transparent/.test(c)) return c; } return getComputedStyle(doc.body).backgroundColor; }
 const positioned = el => { if (getComputedStyle(el).position === 'static') el.style.position = 'relative'; return el; };
 // A non-interactive copy of an element at its rendered place, for content that leaves while layout has moved on.
 function ghost(el, host = el.parentElement) {
  positioned(host);
  const r = el.getBoundingClientRect(), h = host.getBoundingClientRect(), scroll = [el, ...qa(el, '*')].map(n => [n.scrollLeft, n.scrollTop]), g = el.cloneNode(true);
  for (const n of [g, ...qa(g, '[id],[data-st]')]) { n.removeAttribute('id'); if (n.dataset.st) { n.dataset.stGhostOf = n.dataset.st; n.removeAttribute('data-st'); } }
  g.classList.add('st-ghost-layer'); g.setAttribute('aria-hidden', 'true'); g.inert = true; g.dataset.stGhost = '';
  Object.assign(g.style, {position: 'absolute', left: r.left - h.left - host.clientLeft + host.scrollLeft + 'px', top: r.top - h.top - host.clientTop + host.scrollTop + 'px', width: r.width + 'px', height: r.height + 'px', margin: '0', boxSizing: 'border-box', pointerEvents: 'none', transform: 'none', clipPath: getComputedStyle(el).clipPath});
  // A copy elsewhere in the tree loses position-based styles (nth-child colours, parent selectors): keep its paint.
  const ecs = getComputedStyle(el);
  Object.assign(g.style, {backgroundColor: ecs.backgroundColor, backgroundImage: ecs.backgroundImage, color: ecs.color, borderColor: ecs.borderColor, borderRadius: ecs.borderRadius, font: ecs.font});
  host.append(g);
  // cloneNode copies markup, not the visible scroll position of a reading surface.
  [g, ...qa(g, '*')].forEach((n, i) => { const [x, y] = scroll[i] || []; if (Number.isFinite(x)) n.scrollLeft = x; if (Number.isFinite(y)) n.scrollTop = y; });
  // A positioned copy no longer collapses its first child's margin; shift it so every line sits where it was drawn.
  const a = el.firstElementChild, b = g.firstElementChild;
  if (a && b) { const d = a.getBoundingClientRect().top - b.getBoundingClientRect().top; if (Math.abs(d) > .5) { g.style.top = parseFloat(g.style.top) + d + 'px'; g.style.height = 'auto'; } }
  return g;
 }
 const followers = el => { const out = []; for (let n = el.nextElementSibling; n; n = n.nextElementSibling) if (!n.hasAttribute("data-st-ghost")) out.push(n); return out; };
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
   if (animated) { positioned(el); const g = ghost(cell, el); play(g, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: `translateY(${-dir * 20}%)`}], {ms: 80, curve: 'X', fill: 'forwards'}).then(() => g.remove()); }
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
   const enter = frequent ? 0 : 50; // the old digit is mostly gone before the new one is legible
   c.cell.classList.add('st-rolling');
   const travel = frequent ? 45 : 100;
   if (c.old) {
    c.old.classList.add('st-ink-out');
    play(c.old, [{transform: 'none', opacity: 1, filter: 'blur(0px)'}, {transform: `translateY(${-dir * travel}%)`, opacity: 0, filter: frequent ? 'blur(0px)' : 'blur(3px)'}], {ms: frequent ? 70 : 100, curve: 'X', delay, fill: 'both', blur: false}).then(ok => { if (ok) c.old.remove(); });
   }
   c.cell.append(inkEl);
   // The leaving digit carries the motion blur; the arriving one is exact: it rolls in sharp, clipped to its slot, on a
   // monotonic curve, because a price must read correctly the moment it lands.
   const from = {transform: `translateY(${dir * (frequent ? travel : 45)}%)`, opacity: 0};
   play(inkEl, [from, {transform: 'none', opacity: 1}], {ms: frequent ? 120 : 160, curve: 'cubic-bezier(.2,0,.2,1)', delay: delay + enter, blur: false}).then(() => { if (!qa(c.cell, '.st-ink-out').length) c.cell.classList.remove('st-rolling'); });
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
  const previous = o.__prev ?? el.dataset.stLabel; el.dataset.stLabel = text;
  const thinking = el.dataset.st === 'thinking';
  const fitTo = o.fit || el.closest('[data-st-fit]');
  if(!o.letters){
   if (fitTo && !reduced() && !o.__fitted) { let p; resize(fitTo, () => { p = swapText(el, text, {...o, force: true, __fitted: true, __prev: previous}); }, {spring: 'snappy'}); return p; }
   positioned(el); qa(el,'.st-text-exit').forEach(n=>{stopAll(n);n.remove();});
   const current=q(el,'.st-text-value') || letters(previous,'st-text-value'); if(!current.parentElement)el.replaceChildren(current);
   // The outgoing label stays exactly where it was drawn, wherever padding or alignment put it.
   const cr=current.getBoundingClientRect(), er=el.getBoundingClientRect(), currentWhiteSpace=getComputedStyle(current).whiteSpace;
   current.className='st-text-exit';Object.assign(current.style,{position:'absolute',left:cr.left-er.left-el.clientLeft+'px',top:cr.top-er.top-el.clientTop+'px',width:cr.width+'px',whiteSpace:currentWhiteSpace||'nowrap',margin:'0'});
   const next=letters(text,'st-text-value'),sr=doc.createElement('span');sr.className='st-sr';sr.textContent=text;qa(el,':scope>.st-sr').forEach(n=>n.remove());el.append(next,sr);
   // The old label clears before the new one is legible, so the two never read as one doubled word.
   // A status line changes in its own slot with a 2px lift: the old label clears before the new one starts, so two
   // labels are never drawn over each other.
   const movement=thinking?{transform:'translateY(-2px)',filter:'blur(3px)'}:{transform:'translateY(-3px)'};
   // A tight swap is an acknowledgement (Stopped, Answered): it lands sharp, without the soft focus pull.
   if (thinking && !o.tight && !reduced()) play(next,[{filter:'blur(2px)'},{filter:'blur(0px)'}],{ms:140,curve:'O',delay:20,channel:'f',current:false});
   play(current,[{opacity:0,...movement}],{ms:thinking?40:50,curve:'X',channel:'text',fill:'forwards',fade:true}).then(()=>current.remove());
   const lag = o.tight ? 0 : thinking ? 20 : 30;
   return Promise.all([play(next,[{opacity:0},{opacity:1}],{ms:thinking?80:100,delay:lag,curve:'F',channel:'o',current:false,fade:true}), play(next,[{transform:thinking?'translateY(2px)':'translateY(3px)'},{transform:'none'}],{ms:thinking?110:160,delay:lag,curve:'E',channel:'t',current:false})]);
  }
  const run = () => {
   positioned(el);
   // Letters roll inside their own line, like an odometer, instead of escaping the shape around them.
   el.style.clipPath = 'inset(-1px -6px)';
   qa(el, '.st-text-exit').forEach(x => x.remove());
   let current = q(el, '.st-text-value');
   if (!current) { el.replaceChildren(); current = letters(previous, 'st-text-value'); el.append(current); }
   let sr = q(el, ':scope > .st-sr'); if (!sr) { sr = doc.createElement('span'); sr.className = 'st-sr'; }
   sr.textContent = text;
   const cr = current.getBoundingClientRect(), er = el.getBoundingClientRect(), currentWhiteSpace = getComputedStyle(current).whiteSpace;
   current.className = 'st-text-exit';
   Object.assign(current.style, {position: 'absolute', left: cr.left - er.left - el.clientLeft + 'px', top: cr.top - er.top - el.clientTop + 'px', width: cr.width + 'px', whiteSpace: currentWhiteSpace || 'nowrap', margin: '0'});
   const next = letters(text, 'st-text-value');
   el.append(next, sr);
   const out = [...current.children], inn = [...next.children];
   // Letters stay sharp: they lift out and rise in by position and opacity, readable at every frame.
   const outs = out.map((l, i) => play(l, [{opacity: 1, transform: 'none'}, thinking ? {opacity: 0} : {opacity: 0, transform: 'translateY(-40%)'}], {ms: thinking ? 'feedback' : 70, curve: thinking ? 'F' : 'X', delay: Math.min(i * 6, 24), fill: 'forwards', fade: true}));
   Promise.all(outs).then(() => { if (current.isConnected && current.className === 'st-text-exit') current.remove(); });
   if (reduced()) { current.remove(); return Promise.all(inn.map(l => fadeIn(l))); }
   return Promise.all(inn.map((l, i) => thinking
    ? play(l, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', delay: 40 + Math.min(i * 10, 60)})
    : Promise.all([
     play(l, [{transform: 'translateY(50%)'}, {transform: 'none'}], {spring: 'snappy', delay: 40 + Math.min(i * 12, 60), current: false}),
     play(l, [{opacity: 0}, {opacity: 1}], {ms: 100, curve: 'F', channel: 'o', delay: 40 + Math.min(i * 12, 60), current: false})])));
  };
  const fit = o.fit || el.closest('[data-st-fit]');
  if (fit && !reduced()) { let p; resize(fit, () => { p = run(); }); return p; }
  return run();
 }

 /* ---------- Resize: layout commits once; a painted shell follows the size on one spring, text never stretches.
    The shell scales with its radius corrected every frame, the content is clipped by the same curve, outgoing content
    leaves as a copy, and an interruption starts from the rendered size. ---------- */
 const resizing = new WeakMap();
 function resize(el, update, o = {}) {
  const prev = resizing.get(el);
  const r0 = prev ? prev.shell.getBoundingClientRect() : el.getBoundingClientRect();
  const first = {left: r0.left, top: r0.top, width: r0.width, height: r0.height};
  prev?.cleanup();
  if (reduced()) { update(); return Promise.resolve(); }
  const elBefore = el.getBoundingClientRect();
  const kidsBefore = [...el.children].filter(c => !c.hasAttribute("data-st-ghost") && c.getBoundingClientRect().height > 0);
  const copies = kidsBefore.map(c => { const g = ghost(c, el); g.style.visibility = 'hidden'; return [c, g]; });
  flip([...followers(el), ...kidsBefore], () => update(), {spring: 'smooth'});
  const last = el.getBoundingClientRect();
  const leaving = [], entering = [...el.children].filter(c => !c.hasAttribute("data-st-ghost") && !kidsBefore.includes(c) && c.getBoundingClientRect().height > 0);
  // Copies are positioned inside the card; if the card itself moved (centred layouts), keep them where they were drawn.
  const mx = elBefore.left - last.left, my = elBefore.top - last.top;
  for (const [c, g] of copies) { if (c.isConnected && c.getBoundingClientRect().height > 0) g.remove(); else { g.style.left = parseFloat(g.style.left) + mx + 'px'; g.style.top = parseFloat(g.style.top) + my + 'px'; leaving.push(g); } }
  if (Math.abs(first.width - last.width) < .5 && Math.abs(first.height - last.height) < .5) { leaving.forEach(g => g.remove()); entering.forEach(c => fadeIn(c, {delay: 40})); return Promise.resolve(); }
  // The shell paints the colour the element is heading to, and eases there from the colour on screen now.
  const bgNow = getComputedStyle(el).backgroundColor, tr = el.style.transition; el.style.transition = 'none';
  const cs = getComputedStyle(el), bgEnd = cs.backgroundColor, rad = parseFloat(cs.borderTopLeftRadius) || 0, shell = doc.createElement('span');
  el.style.transition = tr;
  shell.className = 'st-resize-shell'; shell.setAttribute('aria-hidden', 'true');
  Object.assign(shell.style, {position: 'absolute', left: -parseFloat(cs.borderLeftWidth) + 'px', top: -parseFloat(cs.borderTopWidth) + 'px', width: last.width + 'px', height: last.height + 'px', background: bgEnd, backgroundImage: cs.backgroundImage, border: cs.border, boxShadow: cs.boxShadow, transformOrigin: '0 0', pointerEvents: 'none', zIndex: '-1', boxSizing: 'border-box'});
  const saved = {position: el.style.position, isolation: el.style.isolation, background: el.style.background, boxShadow: el.style.boxShadow, borderColor: el.style.borderColor, clipPath: el.style.clipPath};
  Object.assign(el.style, {position: cs.position === 'static' ? 'relative' : el.style.position, isolation: 'isolate', background: 'transparent', boxShadow: 'none', borderColor: 'transparent'});
  el.prepend(shell);
  if (bgNow !== bgEnd) play(shell, [{backgroundColor: bgNow}, {backgroundColor: bgEnd}], {ms: 160, curve: 'F', channel: 'bg', current: false});
  // One sampled spring drives shell size, its corrected radius and the content clip, so they never drift apart.
  const t = track(o.spring || 'smooth'), n = 40, shellFrames = [], clipFrames = [];
  const dx = first.left - last.left, dy = first.top - last.top;
  for (let i = 0; i <= n; i++) {
   const p = at(t, (t.length - 1) * i / n), lerp = (a, b) => a + (b - a) * p;
   const w = lerp(first.width, last.width), h = lerp(first.height, last.height), x = lerp(dx, 0), y = lerp(dy, 0);
   shellFrames.push({transform: `translate(${x}px, ${y}px) scale(${w / last.width}, ${h / last.height})`, borderRadius: `${rad * last.width / w}px / ${rad * last.height / h}px`});
   clipFrames.push({clipPath: `inset(${y}px ${last.width - x - w}px ${last.height - y - h}px ${x}px round ${rad}px)`});
  }
  const ms = t.length - 1, state = {shell, cleanup() { stopAll(shell); stop(el, 'resize-clip'); shell.remove(); leaving.forEach(g => { stopAll(g); g.remove(); }); Object.assign(el.style, saved); if (resizing.get(el) === state) resizing.delete(el); }};
  resizing.set(el, state);
  play(el, clipFrames, {ms, curve: 'linear', channel: 'resize-clip', current: false});
  // Leaving content is clipped by the closing shell and fades across the first half of it, so the shell never shrinks empty.
  leaving.forEach(g => { g.style.visibility = ''; play(g, [{opacity: 1, filter: 'blur(0px)'}, {opacity: 0, filter: 'blur(2px)'}], {ms: o.spring === 'snappy' ? 90 : Math.min(220, Math.max(120, ms * .45)), curve: 'F', fill: 'forwards', blur: false}); });
  // A fresh opening lets the room form first; a reversal mid-motion brings content straight back.
  const enterDelay = prev ? 0 : 60;
  entering.forEach(c => { play(c, [{opacity: 0}, {opacity: 1}], {ms: 140, curve: 'F', delay: enterDelay, channel: 'o', current: false, fade: true}); play(c, [{transform: 'translateY(4px)'}, {transform: 'none'}], {ms: 220, curve: 'E', delay: enterDelay, channel: 't', current: false}); });
  return play(shell, shellFrames, {ms, curve: 'linear', current: false}).then(ok => { if (ok && resizing.get(el) === state) state.cleanup(); });
 }

 /* ---------- Layers ---------- */
 const layers = new WeakMap(), active = new Set();
 const POP = ['menu', 'plus-menu', 'popover', 'popover-panel', 'tooltip'];
 const plainMenu = el => el.dataset.st === 'menu' && !el.hasAttribute('data-st-morph');
 // Ordinary menus own only these surface channels. Keep host-authored effects and
 // row styles intact when keyboard input takes over or an action opens another UI.
 function stopMenu(el) { stop(el, 'o'); stop(el, 't'); }
 const layerState = el => { let s = layers.get(el); if (!s) layers.set(el, s = {open: false, version: 0}); return s; };
 const isOpen = el => { const s = layers.get(el); if (s) return s.open; if (el.tagName === 'DIALOG') return el.open; if (el.hasAttribute('popover')) return el.matches(':popover-open'); return el.dataset.stOpen === 'true'; };
 const persistentPalette = el => el.dataset.st === 'palette' && el.tagName !== 'DIALOG' && el.hasAttribute('data-st-persistent');
 function paletteExpanded(el, expanded) {
  if (el.dataset.st !== 'palette') return;
  const input = q(el, '[data-st-palette-input]') || q(el, 'input');
  input?.setAttribute('aria-expanded', String(expanded));
  if (!expanded) input?.removeAttribute('aria-activedescendant');
  for (const result of qa(el, '[role="listbox"],[data-st-palette-empty]')) result.inert = !expanded;
 }
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
  // A morphing surface grows out of its trigger: its inner top corner (inside the 5px body padding) sits exactly on the
  // trigger, so the close control that replaces the trigger lands in the same spot. It never flips like a popover.
  if (morph) { const pad = 5; x = align === 'end' ? t.right - w + pad : t.left - pad; y = t.top - pad; }
  x = clamp(x, 8, Math.max(8, innerWidth - w - 8)); y = clamp(y, 8, Math.max(8, innerHeight - h - 8));
  if (el.hasAttribute('data-st-contained')) {
   const host = el.offsetParent.getBoundingClientRect();
   x = clamp(x, host.left + 8, Math.max(host.left + 8, host.right - w - 8));
   y = clamp(y, host.top + 8, Math.max(host.top + 8, host.bottom - h - (morph ? 8 : 52)));
   el.style.left = x - host.left + 'px'; el.style.top = y - host.top + 'px';
  } else { el.style.left = x + 'px'; el.style.top = y + 'px'; }
  el.style.transformOrigin = `${clamp(t.left + t.width / 2 - x, 0, w)}px ${side === 'bottom' ? 0 : h}px`;
  el.dataset.stSide = side;
 }
 function triggerInset(el, trigger) {
  const t = trigger.getBoundingClientRect(), r = el.getBoundingClientRect(), rad = parseFloat(getComputedStyle(trigger).borderTopLeftRadius) || 8;
  return `inset(${t.top - r.top}px ${r.right - t.right}px ${r.bottom - t.bottom}px ${t.left - r.left}px round ${rad}px)`;
 }
 let keyboardInput = false; doc.addEventListener('keydown', () => { keyboardInput = true; doc.documentElement.dataset.stInputMode='keyboard'; active.forEach(el=>{ delete el.dataset.stPointerFocus; if (plainMenu(el) && layerState(el).open) stopMenu(el); }); }, true); doc.addEventListener('pointerdown', () => { keyboardInput = false; doc.documentElement.dataset.stInputMode='pointer'; }, true);
 // Delayed exits may hide their trigger. Restore only after it is visible and only if no newer focus took ownership.
 let focusVersion = 0; doc.addEventListener('focusin', () => { ++focusVersion; }, true);
 function focusReturn(target) { const version = focusVersion; return () => { if (focusVersion === version && target?.isConnected) target.focus?.({preventScroll: true}); }; }
 function focusFirst(el, keyboard = keyboardInput) { const f = q(el, '[autofocus],[data-st-palette-input],[role="menuitem"]:not([disabled]),[role="option"],button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'); f?.focus({preventScroll: true, focusVisible: keyboard}); }

 function open(el, trigger, o = {}) {
  if (!el) return;
  const s = layerState(el), kind = el.dataset.st;
  const menu = plainMenu(el), menuKeyboard = o.keyboard ?? keyboardInput, menuInstant = menu && (o.instant || menuKeyboard || reduced());
  if (trigger) s.trigger = trigger; else if (!s.trigger && doc.activeElement !== doc.body) s.trigger = doc.activeElement;
  el._stTrigger = s.trigger;
  const wasOpen = s.open, wasClosing = s.closing; if (wasOpen && !wasClosing) { if (menuInstant) stopMenu(el); return; }
  s.open = true; s.closing = false; const v = ++s.version;
  el.inert = false; el.dataset.stManaged = ''; el.dataset.stOpen = 'true'; el.hidden = false;
  s.trigger?.setAttribute('aria-expanded', 'true');
  paletteExpanded(el, true);
  const openingFocus = focusVersion;
  if (menu) { active.add(el); el.scrollLeft = el.scrollTop = 0; if (menuInstant) stopMenu(el); }
  if (el.tagName === 'DIALOG') {
   // Autofocus may request an animated close before open resumes. Own that interval.
   if (kind === 'modal') active.add(el);
   if (!el.open) (el.hasAttribute('data-st-contained') ? el.show() : el.showModal());
  }
  else if (el.hasAttribute('popover')) { if (!el.matches(':popover-open')) el.showPopover(); }
  // Native autofocus can synchronously close or reopen the layer through host code.
  if (s.version !== v || !s.open || (el.tagName === 'DIALOG' && !el.open)) {
   // beforetoggle(open) runs before native visibility changes. A newer instant
   // close may already have finished there; retire only that stranded show.
   // Pending pointer exits keep their presentation. Native hide can call host
   // code again, so do not change managed state, focus or events after it returns.
   if (menu && !s.open && !s.closing && el.hasAttribute('popover') && el.matches(':popover-open')) el.hidePopover();
   return;
  }
  if (menu && el.hasAttribute('popover') && !el.matches(':popover-open')) { close(el, {instant: true, silent: true}); return; }
  if (POP.includes(kind) && kind !== 'tooltip') { for (const other of [...active]) if (other !== el && !other.contains(el) && POP.includes(other.dataset.st)) close(other, {silent: true}); }
  if (POP.includes(kind) && s.trigger) { place(el, s.trigger); active.add(el); }
  else if (!POP.includes(kind)) active.add(el);
  const t = s.trigger && s.trigger.getBoundingClientRect(), r = el.getBoundingClientRect();
  const scrim = scrimOf(el), recede = recedeOf(el);
  if (scrim) { scrim.dataset.stOpen = 'true'; play(scrim, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', fade: true}); }
  if (recede) play(recede, [{transform: 'none', clipPath:'inset(0px round 0px)', opacity: 1}, {transform: 'scale(.94) translateY(6px)', clipPath:'inset(0px round 14px)', opacity: .7}], {spring: 'smooth', fill: 'forwards', channel: 'recede'});
  const morph = (kind === 'plus-menu' || el.hasAttribute('data-st-morph')) && s.trigger && (el.hasAttribute('popover') || el.tagName === 'DIALOG' || el.hasAttribute('data-st-contained'));
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
   s.label.innerHTML = s.trigger.innerHTML; const tcs = getComputedStyle(s.trigger), endAligned = (el.dataset.stPlacement || '').endsWith('end');
   // Both the painted trigger copy and the close control are anchored to the panel's inner corner, never to stale
   // trigger coordinates, so they stay inside the panel even when it is clamped to its container.
   const corner = endAligned ? {right: '5px', left: 'auto', top: '5px'} : {left: '5px', right: 'auto', top: '5px'};
   // The label layer is a painted copy of the trigger, so the first frame is the button itself.
   Object.assign(s.label.style, {position: 'absolute', zIndex: '3', ...corner, width: t.width + 'px', height: t.height + 'px', display: 'flex', alignItems: 'center', justifyContent: tcs.justifyContent, padding: tcs.padding, boxSizing: 'border-box', gap: tcs.gap, color: tcs.color, font: tcs.font, letterSpacing: tcs.letterSpacing, pointerEvents: 'none', borderRadius: tcs.borderRadius, background: tcs.backgroundColor, boxShadow: tcs.boxShadow});
   s.trigger.style.visibility = 'hidden';
   // Open and close are one control in one place: a close pill shaped like the trigger sits exactly where the trigger
   // was, so the same spot that opened the menu closes it.
   const closer = q(s.body, '[data-st-morph-close]');
   if (closer) Object.assign(closer.style, {position: 'absolute', zIndex: '4', margin: '0', ...corner, height: t.height + 'px', minWidth: t.width + 'px'});
   const content = [...s.body.children].filter(c => c !== s.label && c !== closer);
   if (closer) play(closer, [{opacity: 0}, {opacity: 1}], {ms: 140, curve: 'O', delay: 30, channel: 'o', fade: true, blur: false});
   play(s.body, [{clipPath: triggerInset(el, s.trigger)}, {clipPath: 'inset(0px 0px 0px 0px round 14px)'}], {spring: 'snappy', channel: 'clip'}).then(ok => { if (ok && s.version === v) el.classList.remove('st-morphing'); });
   // The surface is the button: it unfolds in the button's own fill and turns to the surface colour as it grows, so
   // there is never a second shape crossfading over the first. Content arrives once the fill has mostly turned.
   // A white shell grows from the trigger while a painted copy of the dark button fades off it: two layers crossfading,
   // never one colour interpolated through grey.
   play(s.label, [{opacity: 1}, {opacity: 0}], {ms: 110, curve: 'F', fill: 'forwards', fade: true});
   content.forEach((c, i) => { if (i === 0 && el.tagName === 'DIALOG') return; play(c, [{opacity: 0}, {opacity: 1}], {ms: 100, curve: 'F', delay: 40, channel: 'o', fade: true, current: false}); play(c, [{transform: 'translateY(-3px)'}, {transform: 'none'}], {ms: 180, curve: 'cubic-bezier(.16,1,.3,1)', delay: 40, channel: 't', current: false}); });
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
  } else if (kind === 'popover-panel') {
   play(el, [{clipPath: 'inset(0 0 100% 0 round 14px)'}, {clipPath: 'inset(0 0 0% 0 round 14px)'}], {ms: 220, curve: 'E', channel: 'clip'});
   play(el, [{opacity: 0}, {opacity: 1}], {ms: 'quick', channel: 'o', fade: true});
   [...el.children].forEach((c, i) => { play(c, [{transform: 'translateY(-4px)'}, {transform: 'none'}], {ms: 200, curve: 'E', delay: wasClosing ? 0 : 25 + i * 15, channel: 'content-t'}); play(c, [{opacity: 0}, {opacity: 1}], {ms: 120, curve: 'F', delay: wasClosing ? 0 : 25 + i * 15, channel: 'content', fade: true}); });
  } else if (menuInstant) {
   stopMenu(el);
  } else if (POP.includes(kind)) {
   // One piece: the surface and its rows fade, lift and scale together from the trigger, so there is never an empty
   // frame or a shadow without content. Reopened mid-close, it continues from the rendered values.
   const dy = el.dataset.stSide === 'top' ? 4 : -4;
   if (!menu) [...el.children].forEach(c => { stop(c, 'o'); c.style.opacity = ''; });
   play(el, [{opacity: 0}, {opacity: 1}], {ms: 160, curve: 'O', channel: 'o', fade: true});
   play(el, [{transform: `translateY(${dy}px) scale(.96)`}, {transform: 'none'}], {spring: 'snappy', channel: 't'});
  } else if (kind === 'sheet') {
   play(el, [{transform: 'translateY(100%)'}, {transform: 'none'}], {spring: 'smooth', channel: 't'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', pseudo: '::backdrop', fade: true});
  } else if (kind === 'drawer') {
   const side = el.dataset.stSide === 'left' ? -1 : 1;
   play(el, [{transform: `translateX(${side * 100}%)`}, {transform: 'none'}], {spring: 'snappy', channel: 't'});
   // Its contents settle a beat after the panel, travelling a little further, so the drawer reads as layered.
   if (!wasClosing) [...el.children].forEach((c, i) => { play(c, [{transform: `translateX(${side * 18}px)`}, {transform: 'none'}], {ms: 220, curve: 'O', delay: 30 + Math.min(i * 15, 45), channel: 'drawer-t', current: false}); play(c, [{opacity: 0}, {opacity: 1}], {ms: 140, curve: 'F', delay: 30 + Math.min(i * 15, 45), channel: 'drawer-o', current: false, fade: true}); });
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}, {opacity: 1}], {ms: 'control', curve: 'F', pseudo: '::backdrop', fade: true});
  } else if (kind === 'panel') {
   play(el, [{opacity: 0}, {opacity: 1}], {ms: 'quick', curve: 'F', channel: 'o', fade: true});
   play(el, [{transform: 'translateY(-6px) scale(.98)'}, {transform: 'none'}], {spring: 'snappy', channel: 't'});
  } else if (kind === 'modal') {
   // A decision and its safe initial focus are readable from the first painted frame.
   // The backdrop establishes scope; do not fade or blur the focused content on entry.
   const instant = o.keyboard || keyboardInput || reduced();
   stop(el, 'o'); // The decision shell stays opaque through exit and reversal.
   if (instant) { stop(el, 't'); stop(el, 'main::backdrop'); }
   else {
    if (t && !wasClosing) el.style.transformOrigin = `${clamp(t.left + t.width / 2 - r.left, 0, r.width)}px ${clamp(t.top + t.height / 2 - r.top, 0, r.height)}px`;
    play(el, [{transform: 'translateY(4px) scale(.97)'}, {transform: 'none'}], {ms: 220, curve: 'E', channel: 't'});
   }
   if (!instant && el.tagName === 'DIALOG') play(el, [{opacity: 0}, {opacity: 1}], {ms: 100, curve: 'F', pseudo: '::backdrop', fade: true});
  } else if (el.tagName === 'DIALOG' || kind === 'palette') {
   if (kind !== 'palette' && t && !wasClosing) el.style.transformOrigin = `${clamp(t.left + t.width / 2 - r.left, 0, r.width)}px ${clamp(t.top + t.height / 2 - r.top, 0, r.height)}px`;
   if (kind === 'palette') {
    el.style.transformOrigin = '50% 0';
    play(el, [{clipPath: `inset(0px 0px calc(100% - ${q(el,'.st-palette-search')?.offsetHeight||52}px) 0px round 14px)`}, {clipPath:'inset(0px 0px 0px 0px round 14px)'}], {spring:'snappy', channel:'clip'});
    const resultBox = q(el, '[role=listbox]'); if (resultBox) play(resultBox,[{opacity:0},{opacity:1}],{ms:100,delay:40,curve:'F',channel:'o',fade:true});
   }
   if (kind !== 'palette') play(el, [{opacity: 0}, {opacity: 1}], {ms: 80, curve: 'F', channel: 'o', fade: true});
   if (!el.hasAttribute('data-st-persistent')) play(el, [{transform: kind === 'palette' ? 'translateY(-8px) scale(.98)' : 'translateY(4px) scale(.97)'}, {transform: 'none'}], kind === 'palette' ? {spring: 'snappy', channel: 't'} : {ms: 220, curve: 'E', channel: 't'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}, {opacity: 1}], {ms: 100, curve: 'F', pseudo: '::backdrop', fade: true});
   if (kind === 'modal') [...el.children].forEach(c => fadeIn(c,{ms:100,delay:c.matches('.row,.st-actions')?45:25}));
  }
  if ((menu ? menuKeyboard : o.keyboard) || (kind === 'modal' && keyboardInput)) delete el.dataset.stPointerFocus; else el.dataset.stPointerFocus = '';
  // Native popover autofocus may already have transferred focus, including a host
  // redirect. Do not acquire it again after that synchronous callback boundary.
  if (!wasOpen && o.focus !== false && kind !== 'tooltip' && (!menu || focusVersion === openingFocus)) {
   if (kind === 'menu' || kind === 'plus-menu') { if (menu ? menuKeyboard : o.keyboard) focusFirst(el, menu ? menuKeyboard : keyboardInput); else { el.dataset.stPointerFocus = ''; el.focus?.({preventScroll: true, focusVisible: false}); } }
   else if (el.tagName !== 'DIALOG' || kind === 'palette' || (kind === 'modal' && wasClosing)) focusFirst(el);
  }
  // Explicit focus on a reversal is another synchronous host callback boundary.
  if (s.version !== v || !s.open || (el.tagName === 'DIALOG' && !el.open)) return;
  if (menu && el.hasAttribute('popover') && !el.matches(':popover-open')) { close(el, {instant: true, silent: true}); return; }
  el.dispatchEvent(new CustomEvent('st:open', {bubbles: true}));
 }

 function close(el, o = {}) {
  if (!el) return;
  const s = layerState(el), kind = el.dataset.st;
  const menu = plainMenu(el), menuInstant = menu && (o.instant || (o.keyboard ?? keyboardInput) || reduced());
  // A gallery action can follow the generic menuitem listener in the same event.
  // Its instant handoff must retire an exit that has already been accepted.
  if (!s.open && !isOpen(el) && !(menuInstant && s.closing)) return;
  if (!s.open && s.closing && !menuInstant) return;
  s.open = false; s.closing = true; const v = ++s.version;
  s.trigger?.setAttribute('aria-expanded', 'false');
  const hadFocus = el.contains(doc.activeElement);
  const refocus = (hadFocus || kind === 'palette') && !o.silent ? focusReturn(s.trigger) : null;
  const morph = s.label && s.trigger && el.classList !== undefined && (kind === 'plus-menu' || el.hasAttribute('data-st-morph'));
  // A persistent search remains a reachable opener; only its collapsed results become inert.
  el.inert = !persistentPalette(el);
  paletteExpanded(el, false);
  if (refocus && !morph && el.tagName !== 'DIALOG') refocus();
  if (menu && (s.version !== v || s.open)) return;
  const scrim = scrimOf(el), recede = recedeOf(el);
  if (scrim) { scrim.dataset.stOpen = 'false'; play(scrim, [{opacity: 1}, {opacity: 0}], {ms: 'quick', curve: 'F', fade: true}); }
  // The page behind comes back in step with the sheet's 220ms exit, not on a longer tail.
  if (recede) play(recede, [{transform: 'none', clipPath:'inset(0px round 0px)', opacity: 1}], {ms: 220, curve: 'E', channel: 'recede'}).then(ok => { if (ok) stop(recede, 'recede'); });
  let done;
  if (menuInstant) {
   // finish() below removes the native surface synchronously, without a fake job.
  } else if (morph) {
   el.classList.add('st-morphing');
   // Same channel as the opening reveal, so reopening mid-close retargets these fades instead of leaving items hidden.
   [...s.body.children].filter(c => c !== s.label).forEach(c => { stop(c, 't'); play(c, [{opacity: 0}], {ms: 'feedback', curve: 'F', channel: 'o', fill: 'forwards', fade: true}); });
   play(s.label, [{opacity: 1}], {ms: 'quick', curve: 'F', delay: 70, fill: 'forwards', fade: true});
   done = play(s.body, [{clipPath: triggerInset(el, s.trigger)}], {spring: 'snappy', channel: 'clip', fill: 'forwards'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}], {ms: 'control', curve: 'F', pseudo: '::backdrop', fill: 'forwards', fade: true});
  } else if (kind === 'tooltip') {
   done = o.instant ? Promise.resolve(true) : play(el, [{opacity: 0}], {ms: 'feedback', curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else if (kind === 'popover-panel') {
   [...el.children].forEach(c => play(c, [{opacity: 0}], {ms: 'feedback', channel: 'content', fill: 'forwards', fade: true}));
   done = play(el, [{clipPath: 'inset(0 0 100% 0 round 14px)'}], {ms: 'quick', curve: 'X', channel: 'clip', fill: 'forwards'});
   play(el, [{opacity: 0}], {ms: 'quick', curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else if (POP.includes(kind)) {
   const dy = el.dataset.stSide === 'top' ? 2 : -2;
   play(el, [{transform: `translateY(${dy}px) scale(.97)`}], {ms: 150, curve: 'X', channel: 't', fill: 'forwards'});
   done = play(el, [{opacity: 0}], {ms: 150, curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else if (kind === 'sheet' || kind === 'drawer') {
   const to = kind === 'sheet' ? 'translateY(100%)' : `translateX(${el.dataset.stSide === 'left' ? -100 : 100}%)`;
   done = play(el, [{transform: to}], {ms: o.velocity ? 180 : 220, curve: o.velocity ? 'cubic-bezier(.2,.6,.4,1)' : CURVES.X, channel: 't', fill: 'forwards'});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}], {ms: 'quick', curve: 'F', pseudo: '::backdrop', fill: 'forwards', fade: true});
   if (reduced()) done = play(el, [{opacity: 1}, {opacity: 0}], {ms: 'quick', curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else if(kind==='palette' && el.hasAttribute('data-st-persistent')){
   const height=q(el,'.st-palette-search')?.offsetHeight||46;done=play(el,[{clipPath:`inset(0px 0px calc(100% - ${height}px) 0px round 12px)`}],{ms:200,curve:'O',channel:'clip',fill:'forwards'});const results=q(el,'[role=listbox]');if(results)play(results,[{opacity:0}],{ms:65,channel:'o',fill:'forwards',fade:true});
  } else if (kind === 'modal') {
   // Keep an opaque decision shell until the native scope retires: fading the
   // shell mixes its copy with the page beneath. Keyboard/reduced paths are instant.
   if (!o.keyboard && !keyboardInput && !reduced()) {
    const jobs = [play(el, [{transform: 'scale(.97)'}], {ms: 120, curve: 'X', channel: 't', fill: 'forwards'})];
    if (el.tagName === 'DIALOG') jobs.push(play(el, [{opacity: 0}], {ms: 140, curve: 'F', pseudo: '::backdrop', fill: 'forwards', fade: true}));
    done = Promise.all(jobs);
   }
  } else if (kind === 'panel') {
   play(el, [{transform: 'translateY(-4px) scale(.98)'}], {ms: 'quick', curve: 'X', channel: 't', fill: 'forwards'});
   done = play(el, [{opacity: 0}], {ms: 'quick', curve: 'F', channel: 'o', fill: 'forwards', fade: true});
  } else {
   if (!el.hasAttribute('data-st-persistent')) play(el, [{transform: kind === 'palette' ? 'translateY(-4px) scale(.98)' : 'scale(.97)'}], {ms: 120, curve: 'X', channel: 't', fill: 'forwards'});
   done = play(el, [{opacity: 0}], {ms: 100, curve: 'F', channel: 'o', fill: 'forwards', fade: true});
   if (el.tagName === 'DIALOG') play(el, [{opacity: 0}], {ms: 140, curve: 'F', pseudo: '::backdrop', fill: 'forwards', fade: true});
  }
  const finish = () => {
   if (s.version !== v || s.open) return;
   s.closing = false;
   if (s.trigger && !menu) s.trigger.style.visibility = '';
   const clean = () => {
    el.dataset.stOpen = 'false'; active.delete(el);
    if (menu) stopMenu(el);
    else { stopAll(el); if (s.label) stopAll(s.label); if (s.body) { stopAll(s.body); [...s.body.children].forEach(stopAll); } [...el.children].forEach(stopAll); el.classList.remove('st-morphing'); }
   };
   // Native close may restore focus synchronously. Retire this surface's old
   // presentation first, so a host reopen cannot be erased by the old finish.
   if (kind === 'modal' || menu) clean();
   if (el.tagName === 'DIALOG' && el.open) el.close();
   else if (el.hasAttribute('popover') && el.matches(':popover-open')) el.hidePopover();
   if ((kind === 'modal' || menu) && (s.version !== v || s.open)) return;
   if (kind !== 'modal' && !menu) clean();
   if (morph || el.tagName === 'DIALOG') refocus?.();
   if ((kind === 'modal' || menu) && (s.version !== v || s.open)) return;
   el.dispatchEvent(new CustomEvent('st:close', {bubbles: true}));
  };
  if (menuInstant || (kind === 'modal' && (o.keyboard || keyboardInput || reduced()))) { finish(); return; }
  (done || Promise.resolve(true)).then(finish);
  if (reduced() && !done) finish();
 }
 const toggle = (el, trigger, o) => (isOpen(el) && !layerState(el).closing ? close(el, o) : open(el, trigger, o));

 /* ---------- Sheet drag: follows the finger, dismisses on distance or velocity, springs back otherwise. ---------- */
 const sheetDrags = new WeakSet();
 function sheetDrag(el) {
  if (sheetDrags.has(el)) return; sheetDrags.add(el);
  let d = null;
  el.addEventListener('pointerdown', e => {
   if (el.dataset.st !== 'sheet' || !e.isPrimary || e.button > 0 || e.target.closest('button,a,input,textarea,select,[data-st-no-drag]')) return;
   // Nested surfaces own their gestures; the gallery detail can opt into handle-only drag.
   if (e.target.closest('[data-st="sheet"]') !== el) return;
   if (el.hasAttribute('data-st-drag-handle-only') && !e.target.closest('[data-st-drag-handle]')) return;
   d = {id: e.pointerId, y0: e.clientY, y: 0, h: el.offsetHeight, claimed: false, samples: [[e.timeStamp, 0]]};
  });
  el.addEventListener('pointermove', e => {
   if (!d || d.id !== e.pointerId) return;
   if (el.dataset.st !== 'sheet') { d = null; el.style.transform = ''; return; }
   let dy = e.clientY - d.y0;
   if (!d.claimed) { if (Math.abs(dy) < 4) return; d.claimed = true; el.setPointerCapture(e.pointerId); const m = new DOMMatrixReadOnly(getComputedStyle(el).transform); d.base = m.m42; d.y0 = e.clientY - d.base; dy = d.base; stop(el, 't'); }
   d.y = dy < 0 ? dy * .2 : dy;
   el.style.transform = reduced() ? 'none' : `translateY(${d.y}px)`;
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
  parts.ink.replaceChildren(...parts.tabs.map(t => { const r = t.getBoundingClientRect(), s = doc.createElement('span'); s.textContent = t.textContent.trim(); const f = getComputedStyle(t); Object.assign(s.style, {position: 'absolute', left: r.left - ir.left + 'px', top: r.top - ir.top + 'px', width: r.width + 'px', height: r.height + 'px', font: f.font, letterSpacing: f.letterSpacing, wordSpacing: f.wordSpacing}); return s; }));
  void lr;
 }
 function revealTab(list, tab) {
  // Scroll only the tab strip: selecting a hidden option must not move the page.
  const lr = list.getBoundingClientRect(), tr = tab.getBoundingClientRect();
  const left = lr.left + list.clientLeft, right = left + list.clientWidth;
  const delta = tr.left < left || tr.width > list.clientWidth ? tr.left - left : tr.right > right ? tr.right - right : 0;
  if (Math.abs(delta) > .5) list.scrollTo({left: list.scrollLeft + delta, behavior: 'instant'});
 }
 function indicate(root, tab, animate, keyboard) {
  const parts = tabParts(root), {list, ind, ink} = parts;
  // A scrolling strip's indicator owns the content width, not just its viewport.
  // Derive it from actual tabs so a previous wider indicator cannot preserve overflow.
  const scrolling = root.dataset.st === 'tabs';
  const W = scrolling ? Math.max(list.clientWidth, ...parts.tabs.map(t => t.offsetLeft + t.offsetWidth)) : list.clientWidth;
  if (scrolling) { ind.style.width = W + 'px'; ind.style.right = 'auto'; }
  const L = tab.offsetLeft, R = W - (tab.offsetLeft + tab.offsetWidth);
  const rad = root.dataset.st === 'segmented' ? 8 : 2;
  const target = `inset(0px ${R}px 0px ${L}px round ${rad}px)`;
  const inkTarget = ink ? (() => { const off = ink.offsetLeft; return `inset(0px ${R - (W - off - ink.clientWidth)}px 0px ${L - off}px round ${rad}px)`; })() : null;
  const cur = parseInset(getComputedStyle(ind).clipPath);
  ind.style.clipPath = target; if (ink) ink.style.clipPath = inkTarget;
  if (!animate || !cur || reduced()) { stop(ind, 'clip'); if (ink) stop(ink, 'clip'); return; }
  const [, cr, , cl] = cur; if (Math.abs(cl - L) < .5 && Math.abs(cr - R) < .5) return;
  const stretch = false;
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
  const {list, tabs} = tabParts(root);
  if (!tab) return;
  const prev = tabs.find(t => t.getAttribute('aria-selected') === 'true');
  const dir = prev ? Math.sign(tabs.indexOf(tab) - tabs.indexOf(prev)) : 0;
  // A change hard on the heels of another is a reversal: the new panel answers at once instead of waiting.
  const rapid = tabs.some(t => { const p = doc.getElementById(t.getAttribute('aria-controls')); return p && p.getAnimations().some(a => a.playState === 'running'); });
  tabs.forEach(t => {
   const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
   const panel = doc.getElementById(t.getAttribute('aria-controls'));
   if (!panel) return;
   const was = panel.dataset.stActive === 'true';
   const alpha = getComputedStyle(panel).opacity, transform = getComputedStyle(panel).transform;
   panel.hidden = false; panel.inert = !on; panel.setAttribute('aria-hidden', String(!on)); panel.dataset.stActive = String(on);
   if (on === was || !prev || prev === tab || keyboard || reduced()) { stopAll(panel); return; }
   if (on) {
    // A panel that was just leaving comes straight back from where its fade got to; a fresh one waits for the old to clear.
    // The old panel has cleared before this one is readable, so the two never print over each other.
    const back = was || +alpha > .05;
    // Panels slide toward the tab you chose: sharp text, no focus pull, starting as the outgoing panel is nearly gone.
    play(panel, [{transform: back ? transform : `translateX(${dir * 8}px)`}, {transform:'none'}], {ms:220,curve:'O',delay:back ? 0 : 60,channel:'t'});
    play(panel, [{opacity: back ? alpha : 0},{opacity:1}], {ms:160,curve:'O',delay:back ? 0 : 60,channel:'o',fade:true,blur:false});
   } else if (was) {
    play(panel, [{transform},{transform:`translateX(${-dir * 6}px)`}], {ms:rapid ? 40 : 90,curve:'X',channel:'t'});
    play(panel, [{opacity:alpha},{opacity:0}], {ms:rapid ? 40 : 90,curve:'X',channel:'o',fade:true,blur:false});
   }
  });
  if (root.dataset.st === 'tabs') revealTab(list, tab);
  indicate(root, tab, !!prev && prev !== tab, keyboard);
  if (prev !== tab) root.dispatchEvent(new CustomEvent('st:tab-change', {bubbles: true, detail: {tab}}));
 }

 /* ---------- Accordion: content is revealed by a clip that tracks the rows sliding below it. ---------- */
 function accordion(d, want) {
  const current = d.dataset.stExpanded ? d.dataset.stExpanded === 'true' : d.open;
  const opening = want ?? !current;
  if (opening === current && !d._stGhost) return;
  d.dataset.stExpanded = String(opening);
  const body = q(d, '.st-details-body') || d.lastElementChild, host = d.parentElement;
  const g0 = d._stGhost; let startClip = null;
  if (g0) { startClip = getComputedStyle(g0).clipPath; stopAll(g0); g0.remove(); d._stGhost = null; }
  const after = [...host.children].filter(n=>!n.hasAttribute("data-st-ghost"));
  if (reduced()) { d.open = opening; if (body) body.inert = !opening; return; }
  // An item that is its own surface (a card with a background) grows as one shell on a spring, with the content
  // and the items below following it, instead of snapping to its new height.
  const bg = getComputedStyle(d).backgroundColor;
  if (!g0 && bg && bg !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(bg)) {
   // A closed <details> stops rendering everything but its summary, shell included, so it stays open while the
   // body collapses and closes for real once the shell has landed.
   if (opening) { d._stAcc = (d._stAcc || 0) + 1; resize(d, () => { if (body) body.style.display = ''; d.open = true; if (body) body.inert = false; }); }
   else { const v = d._stAcc = (d._stAcc || 0) + 1; if (body) body.inert = true;
    Promise.resolve(resize(d, () => { if (body) body.style.display = 'none'; })).then(() => { if (d._stAcc === v) { d.open = false; if (body) body.style.display = ''; } }); }
   d.dispatchEvent(new CustomEvent('st:accordion', {bubbles: true, detail: {open: opening}}));
   return;
  }
  if (opening) {
   if (startClip) after.forEach(f => stop(f, 'flip'));
   flip(after, () => { d.open = true; }, {ms:300,curve:'O'});
   if (body) {
    body.inert = false;
    play(body, [{clipPath: startClip && startClip !== 'none' ? startClip : 'inset(0px 0px 100% 0px)'}, {clipPath: 'inset(0px 0px 0% 0px)'}], {ms:300,curve:'O',channel:'clip'});
    play(body, [{transform: 'translateY(-4px)'}, {transform: 'none'}], {ms:300,curve:'O',channel:'t'});
    play(body, [{opacity: startClip ? +getComputedStyle(body).opacity : 0}, {opacity: 1}], {ms:200,curve:'O',channel:'o',fade:true});
   }
  } else {
   let g = null;
   if (body && host) { const cur = getComputedStyle(body).clipPath; g = ghost(body, host); d._stGhost = g; g.style.clipPath = cur === 'none' ? 'inset(0px 0px 0% 0px)' : cur; g.style.opacity = getComputedStyle(body).opacity; }
   flip(after, () => { d.open = false; if (body) { stopAll(body); body.inert = true; } }, {ms:300,curve:'O'});
   if (g) {
    play(g, [{clipPath: 'inset(0px 0px 100% 0px)'}], {ms:260,curve:'O',fill:'forwards'}).then(ok => { if (ok && d._stGhost === g) { g.remove(); d._stGhost = null; } });
    play(g, [{opacity: 0}], {ms:120,curve:'F',channel:'o',fill:'forwards'});
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
  const x0 = content?.getBoundingClientRect().left; if(content)stop(content,'flip');
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
  if (next === 'success' && prev !== 'success') tickIn(q(el, '.st-state-check'));
  if (next === 'success' || next === 'error') announce(label || text?.dataset.stLabel || next);
  el.dispatchEvent(new CustomEvent('st:state', {bubbles: true, detail: {state: next}}));
 }
 function success(el) {
  if (!el) return Promise.resolve();
  if (el.dataset.st === 'button') { state(el, 'success'); return Promise.resolve(); }
  el.dataset.stDone = 'true'; const label = q(el, '[data-st-success-text]'); if (label) swapText(label, el.dataset.stSuccessLabel || 'Completed');
  const svg = q(el, 'svg') || el;
  el.setAttribute('role', 'status'); el.setAttribute('aria-label', el.dataset.stSuccessLabel || 'Completed');
  const tick = q(el, '.st-success-tick'), disc = q(el, '.st-success-disc');
  if (!tick) return play(svg, [{transform: 'scale(.98)'}, {transform: 'none'}], {ms: 'control', delay: 160, curve: 'E'});
  if (reduced()) return play(tick, [{opacity: 0}, {opacity: 1}], {ms: 'quick', fade: true});
  // After Jakub Antalik's checkmark study: the tick arrives rotated and blurred, dips 4px and settles while it draws.
  // Re-confirmed while the mark is still partly drawn: carry on from what is on screen, never blank it and start over.
  if (+getComputedStyle(tick).opacity > .05) return play(tick, [{opacity: 1, filter: 'blur(0px)', transform: 'none'}], {ms: 100, curve: 'O', channel: 'o', blur: false});
  if (disc) play(disc, [{transform: 'scale(.86)'}, {transform: 'none'}], {spring: 'bouncy', channel: 'pop', current: false});
  return Promise.all([
   play(tick, [{opacity: 0, filter: 'blur(6px)'}, {opacity: 1, filter: 'blur(0px)'}], {ms: 450, curve: 'O', channel: 'o', current: false, blur: false}),
   play(tick, [{transform: 'rotate(-20deg) translateY(0px)'}, {transform: 'rotate(-11deg) translateY(4px)', offset: .44}, {transform: 'rotate(0deg) translateY(0px)'}], {ms: 450, curve: 'cubic-bezier(.2,0,0,1)', channel: 't', current: false})]);
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
  // A validation shake is a nudge, not a performance: 160ms, at most 2px.
  return play(frame, [{transform: 'none'}, {transform: 'translateX(-2px)'}, {transform: 'translateX(2px)'}, {transform: 'translateX(-1px)'}, {transform: 'none'}], {ms: 160, curve: 'linear', channel: 'shake', current: false});
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
  } else play(svg, [{transform: 'none'}], {ms:120,curve:'X'});
  el.dispatchEvent(new CustomEvent('st:like-change', {bubbles: true, detail: {liked: on, value: n ? states.get(n)?.value : undefined}}));
 }

 /* ---------- Copy: the glyph swaps in place and the label confirms; it reverts on its own. ---------- */
 async function copy(el, text) {
  const value = text ?? el.dataset.stCopy ?? (el.dataset.stCopyFrom ? doc.querySelector(el.dataset.stCopyFrom)?.textContent : '');
  const version = el._stCopyVersion = (el._stCopyVersion || 0) + 1;
  clearTimeout(el._stCopy);
  const fallback = () => {
   if (el._stCopyVersion !== version) return false;
   const focused = doc.activeElement, field = doc.createElement('textarea'); field.value = value;
   Object.assign(field.style, {position:'fixed',opacity:'0',left:'0',top:'0'}); field.setAttribute('aria-hidden','true'); doc.body.append(field);
   try { field.select(); return doc.execCommand('copy') === true; }
   catch { return false; }
   finally { field.remove(); focused?.focus({preventScroll:true,focusVisible:keyboardInput}); }
  };
  let copied = false;
  try { if (navigator.clipboard) { await navigator.clipboard.writeText(value); copied = true; } else copied = fallback(); }
  catch { copied = fallback(); }
  if (el._stCopyVersion !== version) return copied;
  icon(el, copied); el.dataset.stCopyStatus = copied ? 'success' : 'error';
  const label = q(el, '[data-st="text"]');
  if (label) { if (!el.dataset.stIdle) el.dataset.stIdle = label.dataset.stLabel || label.textContent.trim(); swapText(label, copied ? el.dataset.stCopied || 'Copied' : 'Copy failed', {fit: el}); }
  announce(copied ? el.dataset.stCopied || 'Copied' : 'Copy failed. Please select and copy the text.');
  el._stCopy = setTimeout(() => { if (el._stCopyVersion !== version) return; icon(el, false); delete el.dataset.stCopyStatus; if (label) swapText(label, el.dataset.stIdle, {fit: el}); }, 1600);
  return copied;
 }
 // Icon morph: the path's outline changes shape; matching point counts let the browser interpolate it.
 function morphIcon(el, on) { const path = q(el, 'path[data-st-on]'); if (!path) return; path.style.d = `path("${on ? path.dataset.stOn : path.dataset.stOff}")`; const label = on ? el.dataset.stLabelOn : el.dataset.stLabelOff; if (label) el.setAttribute('aria-label', label); }
 function icon(el, on) { el.dataset.stOn = String(on); if (el.dataset.st === 'icon-morph') { el.setAttribute('aria-pressed', String(on)); morphIcon(el, on); return; } const swap = el.matches('[data-st="icon"],[data-st="icon-swap"],.st-swap') ? el : q(el, '.st-swap,[data-st="icon"]'); if (swap && swap !== el) swap.dataset.stOn = String(on); }

 /* ---------- Lists: add, remove and reorder with FLIP; a removed row fades before its neighbours close the gap. ---------- */
 const rows = container => [...container.children].filter(c => !c.hasAttribute("data-st-ghost") && !c.hidden);
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
   // Rows stay in their lane: vertical FLIP only, every row retargeting from where it is rendered now. The row that
   // travels furthest lifts above the others, so crossing rows read as one passing over the other.
   // Layout positions, not rects: once FLIP inverts the rows, every rect reads as unmoved.
   const before = new Map(kids.map(n => [n, n.offsetTop]));
   kids.forEach(n => { delete n.dataset.stMoving; });
   const done = flip(kids, () => sorted.forEach(n => container.append(n)), {spring: 'smooth', axis: 'y'});
   const far = kids.reduce((m, n) => Math.abs(before.get(n) - n.offsetTop) > Math.abs(before.get(m) - m.offsetTop) ? n : m, kids[0]);
   const token = (container.__stSort = (container.__stSort || 0) + 1);
   if (far && !reduced()) {
    // Rows are painted with the surface behind them while they cross, so text never shows through text.
    const paint = backdrop(container);
    kids.forEach(n => { if (!('stPaint' in n.dataset)) { n.dataset.stPaint = n.style.backgroundColor; n.style.backgroundColor = paint; } });
    far.dataset.stMoving = 'true';
   }
   return done.then(r => { if (container.__stSort === token) kids.forEach(n => { delete n.dataset.stMoving; if ('stPaint' in n.dataset) { n.style.backgroundColor = n.dataset.stPaint; delete n.dataset.stPaint; } }); return r; });
  }
 };

 /* ---------- Skeleton, reveal, shimmer ---------- */
 function skeleton(el, ready, o = {}) { if (o.instant) { el.classList.add('st-instant'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('st-instant'))); } el.setAttribute('aria-busy', String(!ready)); const real = q(el, '.st-real'); if (real) real.inert = !ready; }
 // Lines rise into a line-height clip (no sideways wipe that cuts words), the second 40ms after the first.
 function reveal(el) { if ([...el.children].some(x => x.getAnimations().some(a => a.playState === 'running'))) return Promise.resolve(); return Promise.all([...el.children].map((x, i) => Promise.all([play(x, [{clipPath: 'inset(0 -4px 100% -4px)', transform: 'translateY(5px)'}, {clipPath: 'inset(-4px -4px -4px -4px)', transform: 'none'}], {ms: 180, curve: 'cubic-bezier(.16,1,.3,1)', delay: i * 40, current: false, channel: 'clip'}), play(x, [{opacity: 0}, {opacity: 1}], {ms: 100, curve: 'F', delay: i * 40, current: false, channel: 'o', fade: true})]))); }
 function shimmer(el) {
  if (!el) return Promise.resolve(true);
  let shine = q(el, '.st-shine');
  if (!shine) { shine = doc.createElement('span'); shine.className = 'st-shine'; shine.setAttribute('aria-hidden', 'true'); shine.textContent = el.textContent; el.append(shine); }
  // A requested preview is one finite sweep. Apps can separately opt into the
  // CSS working-state loop while real work is pending by setting data-st-working.
  return play(shine, [
   {opacity:0,maskPosition:'-60% 0',webkitMaskPosition:'-60% 0'},
   {opacity:1,maskPosition:'-60% 0',webkitMaskPosition:'-60% 0',offset:.1},
   {opacity:1,maskPosition:'160% 0',webkitMaskPosition:'160% 0',offset:.85},
   {opacity:0,maskPosition:'160% 0',webkitMaskPosition:'160% 0'}
  ], {ms:2400,curve:'M',current:false,channel:'shimmer'});
 }


 /* ---------- Streaming text: letters flow in at an even pace, so the leading edge is a soft gradient rather than
    chunks popping in; words never break mid-line. A [n] token becomes a citation that appears as the text reaches it
    and announces itself (st:cite) so its source can answer. ---------- */
 const streams = new WeakMap();
 function stream(el, chunk, {reset = false, done = false, stop = false} = {}) {
  let s = streams.get(el); if (!s) streams.set(el, s = {buffer: '', frame: 0, t: 0, stopped: false});
  // Stop keeps exactly what is on screen: letters already arriving finish at once, queued ones are dropped.
  if (stop) {
   cancelAnimationFrame(s.frame); s.frame = 0; s.buffer = ''; s.t = 0; s.stopped = true; el.setAttribute('aria-busy', 'false');
   for (const c of qa(el, '.st-word > span, .st-cite')) { const a = c.getAnimations(); if (a.some(x => (x.currentTime ?? 0) < (x.effect?.getTiming().delay || 0))) c.remove(); else a.forEach(x => x.finish()); }
   // Reduced motion renders text directly, without per-letter child elements.
   qa(el, '.st-word').forEach(w => { if (!w.textContent) w.remove(); });
   return;
  }
  if (reset) { cancelAnimationFrame(s.frame); s.frame = 0; s.buffer = ''; s.t = 0; s.stopped = false; el.replaceChildren(); }
  // Late producer chunks cannot restart a stopped answer; a new answer explicitly resets.
  if (s.stopped) return;
  s.buffer += chunk || '';
  el.setAttribute('aria-busy', String(!done));
  // Letters are revealed faster than text arrives: a crisp typing edge a few letters long that never backs up.
  const at = () => { const now = performance.now(); s.t = Math.max(s.t, now) + 3; return s.t - now; };
  const flush = () => {
   s.frame = 0; if (!el.isConnected || !s.buffer) { s.buffer = ''; return; }
   // Keep an unfinished citation across frame/chunk boundaries. At end-of-stream,
   // an incomplete token is literal text. The fallback '[' alternative never drops ink.
   let ready = s.buffer; s.buffer = '';
   const partial = !done && /\[\d*$/.exec(ready);
   if (partial) { s.buffer = partial[0]; ready = ready.slice(0, partial.index); }
   const words = ready.match(/\[\d+\]|[^\s[]+\s*|\s+|\[/g) || [];
   for (const w of words) {
    const cite = /^\[(\d+)\]$/.exec(w);
    if (cite) {
     const sup = doc.createElement('sup'); sup.className = 'st-cite'; sup.textContent = cite[1]; el.append(sup);
     const delay = reduced() ? 0 : at();
     // A citation is a reference, not an event: it simply fades in once its words are readable.
     if (!reduced()) play(sup, [{opacity: 0}, {opacity: 1}], {ms: 80, curve: 'F', delay: delay + 40, fade: true, current: false});
     el.dispatchEvent(new CustomEvent('st:cite', {bubbles: true, detail: {n: +cite[1], delay}}));
     continue;
    }
    const span = doc.createElement('span'); span.className = 'st-word'; el.append(span);
    if (reduced()) { span.textContent = w; continue; }
    for (const ch of w) { const c = doc.createElement('span'); c.textContent = ch; span.append(c); play(c, [{opacity: 0}, {opacity: 1}], {ms: 12, curve: 'linear', delay: at(), fade: true, current: false}); }
   }
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

 /* ---------- Expand: a card opens into its detail. The surface unclips from the card; the cover travels and scales; the
    title follows the cover and steps around it (the axis that clears the cover leads), so it never crosses the artwork;
    details arrive after the title lands. Every phase is sampled from one clock and restarts from rendered geometry. ---------- */
 function sharedPairs(source, detail) {
  // Travelers retain the markup they clone. Re-discover only authored destinations, otherwise a
  // reversal treats the previous title ghost (or its children) as another shared part and clones it again.
  return qa(detail, '[data-st-shared]').filter(d => !d.closest('[data-st-ghost]')).map(d => [q(source, `[data-st-shared="${d.dataset.stShared}"]`), d]).filter(([s]) => s);
 }
 const box = r => ({x: r.left, y: r.top, w: r.width, h: r.height});
 // A line box can be narrower than its text (spacing overrides, nested inline runs, or glyph overhang).
 // Route the complete measured text envelope; never assume a fixed element width contains every letter.
 function titleBox(el) {
  const r = el.getBoundingClientRect(), range = el.ownerDocument?.createRange?.();
  if (!range) return box(r);
  range.selectNodeContents(el);
  let left = r.left, top = r.top, right = r.right, bottom = r.bottom;
  for (const t of range.getClientRects()) if (t.width && t.height) { left = Math.min(left, t.left); top = Math.min(top, t.top); right = Math.max(right, t.right); bottom = Math.max(bottom, t.bottom); }
  return {x: left, y: top, w: right - left, h: bottom - top};
 }
 // A label changes sides through the free corner of the moving cover. The corner must fit in the
 // painted shell at that same progress; all three edges then share a clock instead of racing each other.
 function titleRoute(f, t, af, at, sf, st, size, continuing = false) {
  // A corner cannot rescue an impossible endpoint. A destination-sized title may be wider
  // than the source card, even when the smaller source label itself fits. Allow only rounding noise.
  const fits = (r, s) => r.x >= s.x - .05 && r.y >= s.y - .05 && r.x + size.w <= s.x + s.w + .05 && r.y + size.h <= s.y + s.h + .05;
  if ((!continuing && !fits(f, sf)) || !fits(t, st)) return {kind: 'fade'};
  const mix = (a, b, p) => a + (b - a) * p;
  const sides = (r, a) => ({left: a.x - r.x - size.w, right: r.x - a.x - a.w, above: a.y - r.y - size.h, below: r.y - a.y - a.h});
  const first = sides(f, af), last = sides(t, at), names = Object.keys(first);
  // A common separating edge also separates every point of a straight interpolation, including reversals.
  if (names.some(k => first[k] >= 0 && last[k] >= 0)) return {kind: 'direct'};
  const fs = names.find(k => first[k] >= 0), ts = names.find(k => last[k] >= 0);
  if (!fs || !ts || ['left', 'right'].includes(fs) === ['left', 'right'].includes(ts)) return {kind: 'fade'};
  let gap = Math.min(8, Math.max(0, first[fs]), Math.max(0, last[ts]));
  const horizontal = ['left', 'right'].includes(fs) ? fs : ts, vertical = ['above', 'below'].includes(fs) ? fs : ts;
  const corner = a => ({x: horizontal === 'right' ? a.x + a.w + gap : a.x - size.w - gap, y: vertical === 'below' ? a.y + a.h + gap : a.y - size.h - gap});
  const room = (c, s) => [c.x - s.x, c.y - s.y, s.x + s.w - c.x - size.w, s.y + s.h - c.y - size.h];
  let cf, ct, lo, hi;
  for (;;) {
   cf = corner(af); ct = corner(at); const rf = room(cf, sf), rt = room(ct, st); lo = 0; hi = 1;
   for (let i = 0; i < 4; i++) {
    const d = rt[i] - rf[i];
    if (Math.abs(d) < .0000001) { if (rf[i] < 0) { lo = 1; hi = 0; break; } }
    else if (d > 0) lo = Math.max(lo, -rf[i] / d);
    else hi = Math.min(hi, -rf[i] / d);
   }
   if (lo <= hi && hi > 0 && lo < 1) break;
   if (!gap) return {kind: 'fade'};
   // Clearance is a preference, not a reason to reject an otherwise safe tight corner.
   gap = gap > .25 ? gap / 2 : 0;
  }
  // Do not round/clamp to .001/.999: a narrow valid interval can lie beyond those values.
  const pivot = clamp(.5, lo, hi);
  const c = {x: mix(cf.x, ct.x, pivot), y: mix(cf.y, ct.y, pivot)};
  const line = p => { const before = p <= pivot, a = before ? f : c, b = before ? c : t, k = before ? p / pivot : (p - pivot) / (1 - pivot); return {x: mix(a.x, b.x, k), y: mix(a.y, b.y, k)}; };
  // Round only within the free corner. Its control points also fit the shell, so the quadratic
  // stays inside the same linearly changing bounds; its tangents join the two straight segments.
  const clearCorner = p => { const a = {x: mix(af.x, at.x, p), y: mix(af.y, at.y, p), w: mix(af.w, at.w, p), h: mix(af.h, at.h, p)}, edge = sides(line(p), a); return edge[fs] >= 0 && edge[ts] >= 0; };
  let bend = Math.min(.08, pivot / 2, (1 - pivot) / 2);
  while (bend > .0001 && (!clearCorner(pivot - bend) || !clearCorner(pivot + bend))) bend /= 2;
  if (bend <= .0001) bend = 0;
  const b0 = line(pivot - bend), b1 = line(pivot + bend);
  return {kind: 'corner', pivot, bend, gap, point(p) {
   if (!bend || p <= pivot - bend || p >= pivot + bend) return line(p);
   const u = (p - pivot + bend) / (2 * bend), v = 1 - u;
   return {x: v * v * b0.x + 2 * v * u * c.x + u * u * b1.x, y: v * v * b0.y + 2 * v * u * c.y + u * u * b1.y};
  }};
 }
 function travel(s, detail, pairs, toSource, v) {
  const anchorPair = pairs.find(([, d]) => !d.hasAttribute('data-st-shared-text')), jobs = [];
  if (!s.travelers) s.travelers = new Map();
  // Rendered start: the travelling layers if a transition is in flight, otherwise whichever side is at rest.
  const from = new Map(), to = new Map();
  for (const [a, d] of pairs) {
   const g = s.travelers.get(d), moving = g && g.isConnected ? g : d;
   from.set(d, box((toSource || s.moved ? moving : a).getBoundingClientRect()));
   stop(d, 'shared'); if (g) stopAll(g);
  }
  for (const [a, d] of pairs) to.set(d, box((toSource ? a : d).getBoundingClientRect()));
  const springName = toSource ? 'snappy' : 'expand', n = 32;
  const A = anchorPair && anchorPair[1], aFrom = A && from.get(A), aTo = A && to.get(A);
  const surface = q(detail, '.st-expand-surface,.expand-surface') || detail, shell = box(surface.getBoundingClientRect());
  const inset = parseInset(getComputedStyle(s.paint || surface).clipPath), sourceBox = box(s.source.getBoundingClientRect());
  const shellFrom = inset ? {x: shell.x + inset[3], y: shell.y + inset[0], w: shell.w - inset[1] - inset[3], h: shell.h - inset[0] - inset[2]} : toSource || s.moved ? shell : sourceBox;
  const shellTo = toSource ? sourceBox : shell;
  for (const [, d] of pairs) {
   const isText = d.hasAttribute('data-st-shared-text'); let f = from.get(d), t = to.get(d), home = box(d.getBoundingClientRect());
   let layer = d;
   if (isText) {
    layer = s.travelers.get(d);
    if (!layer || !layer.isConnected) {
     // One unscaled title follows a clear route around the artwork, rather than losing letters behind it.
     const host = (A && A.parentElement && A.parentElement.contains(d) ? A.parentElement : null) || q(detail, '.st-expand-surface,.expand-surface') || detail;
     layer = ghost(d, host); const cs = getComputedStyle(d);
     Object.assign(layer.style, {visibility: 'visible', zIndex: '1', font: cs.font, letterSpacing: cs.letterSpacing, color: cs.color, whiteSpace: cs.whiteSpace || 'nowrap', wordSpacing: cs.wordSpacing || 'normal', overflowWrap: cs.overflowWrap || 'normal', maxWidth: 'none', overflow: 'visible', transformOrigin: '0 0'});
     s.travelers.set(d, layer);
    }
    // A reused ghost may have a different containing block after layout changes. Its own resting rect is
    // the transform origin; the rendered start above was captured before cancelling the previous flight.
    home = box(layer.getBoundingClientRect());
    const ink = titleBox(layer), dx = ink.x - home.x, dy = ink.y - home.y;
    f = {...f, x: f.x + dx, y: f.y + dy}; t = {...t, x: t.x + dx, y: t.y + dy}; home = ink;
    d.style.visibility = 'hidden';
   } else Object.assign(d.style, {transformOrigin: '0 0', position: getComputedStyle(d).position === 'static' ? 'relative' : d.style.position, zIndex: '2'});
   const route = A && isText ? titleRoute(f, t, aFrom, aTo, shellFrom, shellTo, home, s.moved) : null;
   if (isText && (route?.kind === 'fade' || s.titleFades?.has(d))) {
    // Some custom layouts have no safe one-corner route. Keep the whole title out of the
    // moving artwork, including during reversals; fade it in only after the surface lands.
    if (!s.titleFades) s.titleFades = new Set(); s.titleFades.add(d); layer.style.visibility = 'hidden'; continue;
   }
   // Include the bend boundaries: interpolating across them could cut the corner through the cover.
   const offsets = Array.from({length: n + 1}, (_, i) => i / n);
   if (route?.kind === 'corner') for (const p of [route.pivot - route.bend, route.pivot - route.bend / 2, route.pivot, route.pivot + route.bend / 2, route.pivot + route.bend]) if (!offsets.includes(p)) offsets.push(p);
   offsets.sort((a, b) => a - b);
   const frames = [];
   for (const p of offsets) {
    const lerp = (u, w, k) => u + (w - u) * k;
    let x, y, w, h;
    if (route?.kind === 'corner') {
     ({x, y} = route.point(p)); w = home.w; h = home.h;
    } else { x = lerp(f.x, t.x, p); y = lerp(f.y, t.y, p); w = lerp(f.w, t.w, p); h = lerp(f.h, t.h, p); }
    const sx = isText ? 1 : w / home.w, sy = isText ? 1 : h / home.h;
    frames.push({offset: p, transform: `translate(${x - home.x}px, ${y - home.y}px) scale(${sx}, ${sy})`});
   }
   jobs.push(play(layer, frames, {spring: springName, channel: 'shared', current: false, fill: toSource ? 'forwards' : 'backwards'}));
  }
  s.moved = true;
  return Promise.all(jobs).then(r => r.every(Boolean) && s.version === v);
 }
 function retireExpandReveals(pairs) {
  for (const [a, d] of pairs) { stop(a, 'expand-reveal'); stop(d, 'expand-reveal'); }
 }
 const expandPaintProperties = ['background-color','background-image','background-position-x','background-position-y','background-size','box-shadow','border-top-color','border-right-color','border-bottom-color','border-left-color'];
 const expandStyle = (el, keys) => Object.fromEntries(keys.map(key => [key, {value: el.style.getPropertyValue(key), priority: el.style.getPropertyPriority(key)}]));
 const restoreExpandStyle = (el, saved) => { for (const [key, entry] of Object.entries(saved)) el.style.setProperty(key, entry.value, entry.priority); };
 function transferExpandPaint(surface, update) {
  const saved = expandStyle(surface, ['transition-property','transition-duration','transition-delay']);
  const cs = getComputedStyle(surface), properties = (cs.transitionProperty || 'all').split(',').map(x => x.trim());
  const durations = (cs.transitionDuration || '0s').split(','), delays = (cs.transitionDelay || '0s').split(',');
  // Later matching entries win, including when the authored list uses "all".
  // Only transferred paint properties get zero time; unrelated color/geometry clocks survive.
  surface.style.setProperty('transition-property', [...properties, ...expandPaintProperties].join(', '), 'important');
  surface.style.setProperty('transition-duration', [...properties.map((_, i) => durations[i % durations.length]), ...expandPaintProperties.map(() => '0s')].join(', '), 'important');
  surface.style.setProperty('transition-delay', [...properties.map((_, i) => delays[i % delays.length]), ...expandPaintProperties.map(() => '0s')].join(', '), 'important');
  try {
   for (const animation of surface.getAnimations?.() || []) if (animation.effect?.target === surface && !animation.effect.pseudoElement && expandPaintProperties.includes(animation.transitionProperty)) animation.cancel();
   const result = update();
   // Commit the transferred endpoint before restoring transition declarations. Otherwise
   // an immediate reopen can sample a half-restored background as its permanent backing.
   getComputedStyle(surface).backgroundColor;
   return result;
  } finally { restoreExpandStyle(surface, saved); }
 }
 function expandPaint(surface, state) {
  if (state.paint?.isConnected) return state.paint;
  return transferExpandPaint(surface, () => {
   const cs = getComputedStyle(surface), paint = doc.createElement('span'); paint.setAttribute('aria-hidden', 'true'); paint.className = 'st-expand-paint';
   Object.assign(paint.style, {position: 'absolute', inset: '0', background: cs.background, boxShadow: cs.boxShadow, border: cs.border, borderRadius: cs.borderRadius, pointerEvents: 'none', zIndex: '-1'});
   state.paintSaved = expandStyle(surface, ['background','background-color','background-image','background-position-x','background-position-y','background-size','background-repeat','background-attachment','background-origin','background-clip','box-shadow','border-color','border-top-color','border-right-color','border-bottom-color','border-left-color','overflow','overflow-x','overflow-y','isolation']);
   for (const [key, value] of Object.entries({background: 'transparent', 'box-shadow': 'none', 'border-color': 'transparent', overflow: 'visible', isolation: 'isolate'})) surface.style.setProperty(key, value, state.paintSaved[key].priority);
   surface.prepend(paint); state.paint = paint; return paint;
  });
 }
 function restoreExpandPaint(surface, state) {
  if (!state.paint) return;
  transferExpandPaint(surface, () => {
   stopAll(state.paint); state.paint.remove(); state.paint = null;
   restoreExpandStyle(surface, state.paintSaved);
  });
 }
 // A dismissal must be usable from its first accepted frame. Card entry forces this
 // handoff for pointer input too; later native focus can reuse it without touching siblings.
 const expandCloseFocus = new WeakMap();
 function revealFocusedExpandClose(control, force = false) {
  const owner = expandCloseFocus.get(control);
  if (!owner?.state.open || !owner.surface.contains(control) || (!force && !control.matches(':focus-visible'))) return;
  stop(control, 'o');
  // A custom Close may sit inside an animated details wrapper. Reveal only its ancestor
  // path; sibling details retain their entrance choreography and authored styles.
  for (let n = control.parentElement; n && n !== owner.surface; n = n.parentElement) { stop(n, 'o'); stop(n, 'clip'); stop(n, 't'); }
  stop(owner.surface, 'o');
 }
 function watchExpandCloseFocus(control, state, surface) {
  if (!expandCloseFocus.has(control)) {
   control.addEventListener('focus', () => revealFocusedExpandClose(control));
   control.addEventListener('keydown', () => revealFocusedExpandClose(control));
  }
  expandCloseFocus.set(control, {state, surface});
 }
 // Close belongs to the currently painted card, not the final layout box behind it.
 // Individual translate preserves the control's authored press transform and unchanged hit target.
 function attachExpandClose(control, surface, from, to, springName, continuing, renderedStart) {
  if (!control) return;
  const rendered = renderedStart || box(control.getBoundingClientRect()); stop(control, 'expand-close-position');
  const rest = box(control.getBoundingClientRect()), savedTranslate = control.style.translate;
  control.style.translate = 'none'; const home = box(control.getBoundingClientRect()); control.style.translate = savedTranslate;
  const shell = box(surface.getBoundingClientRect());
  const right = Math.max(0, shell.x + shell.w - rest.x - rest.w), top = Math.max(0, rest.y - shell.y);
  const attached = r => ({x: r.x + Math.max(0, r.w - home.w - right), y: r.y + Math.min(top, Math.max(0, r.h - home.h))});
  const start = continuing ? rendered : attached(from), end = attached(to);
  return play(control, [{translate: `${start.x - home.x}px ${start.y - home.y}px`}, {translate: `${end.x - home.x}px ${end.y - home.y}px`}], {spring: springName, channel: 'expand-close-position', current: false, fill: 'forwards'});
 }
 // Opt-in source action lane: CSS keeps the relationship through resize/reflow.
 // Unsupported or invalid anchors retain generic shell attachment, never a stale pixel pin.
 let expandAnchorId = 0;
 function restoreExpandClosePin(s) {
  const pin = s.closePin; if (!pin) return;
  for (const [key, saved] of Object.entries(pin.style)) pin.control.style.setProperty(key, saved.value, saved.priority);
  pin.anchor.style.setProperty('anchor-name', pin.anchorName.value, pin.anchorName.priority);
  if (pin.marker === undefined) delete pin.control.dataset.stClosePinned; else pin.control.dataset.stClosePinned = pin.marker;
  s.closePin = null;
 }
 function pinExpandClose(control, surface, source, s) {
  const anchor = q(source, '[data-st-close-anchor]');
  if (!control || !anchor) { restoreExpandClosePin(s); return false; }
  const supported = typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--st-close-test') && CSS.supports('top', 'anchor(top)') && CSS.supports('position-visibility', 'always');
  if (!supported) { restoreExpandClosePin(s); return false; }
  const target = anchor.getBoundingClientRect(), shell = surface.getBoundingClientRect(), origin = source.getBoundingClientRect();
  const fits = r => target.left >= r.left - .05 && target.top >= r.top - .05 && target.right <= r.right + .05 && target.bottom <= r.bottom + .05;
  if (!target.width || !target.height || !fits(shell) || !fits(origin)) { restoreExpandClosePin(s); return false; }
  stop(control, 'expand-close-position');
  if (s.closePin && (s.closePin.control !== control || s.closePin.anchor !== anchor)) restoreExpandClosePin(s);
  if (!s.closePin) {
   const style = {}; for (const key of ['position','translate','position-anchor','position-visibility','top','right','bottom','left']) style[key] = {value: control.style.getPropertyValue(key), priority: control.style.getPropertyPriority(key)};
   s.closePin = {control, anchor, style, anchorName: {value: anchor.style.getPropertyValue('anchor-name'), priority: anchor.style.getPropertyPriority('anchor-name')}, marker: control.dataset.stClosePinned, name: `--st-expand-close-${++expandAnchorId}`};
   const authored = getComputedStyle(anchor).anchorName;
   anchor.style.setProperty('anchor-name', authored && authored !== 'none' ? `${authored}, ${s.closePin.name}` : s.closePin.name, s.closePin.anchorName.priority);
  }
  for (const [key, value] of Object.entries({position: 'fixed', translate: 'none', 'position-anchor': s.closePin.name, 'position-visibility': 'always', top: 'anchor(top)', left: 'anchor(left)', right: 'auto', bottom: 'auto'})) control.style.setProperty(key, value, s.closePin.style[key].priority);
  const placed = control.getBoundingClientRect();
  const footprint = {width: control.offsetWidth, height: control.offsetHeight};
  // Press feedback can scale the real control around its center. Validate the layout
  // footprint and anchor center, while keeping the rendered button inside that footprint.
  if (getComputedStyle(control).positionVisibility !== 'always' || Math.abs((placed.left + placed.right) - (target.left + target.right)) > 1 || Math.abs((placed.top + placed.bottom) - (target.top + target.bottom)) > 1 || Math.abs(footprint.width - target.width) > .5 || Math.abs(footprint.height - target.height) > .5 || placed.left < target.left - .5 || placed.top < target.top - .5 || placed.right > target.right + .5 || placed.bottom > target.bottom + .5 || !placed.width || !placed.height) { restoreExpandClosePin(s); return false; }
  control.dataset.stClosePinned = 'css'; return true;
 }
 // Details hang from the shared artwork: below it they follow its bottom edge, beside it its top edge.
 function hang(c, pairs, cr = c.getBoundingClientRect()) {
  const p = pairs.find(([, d]) => !d.hasAttribute('data-st-shared-text')); if (!p) return 0;
  const a = p[0].getBoundingClientRect(), d = p[1].getBoundingClientRect();
  return Math.max(-80, Math.min(80, cr.top >= d.bottom - 1 ? a.bottom - d.bottom : a.top - d.top));
 }
 const cardClip = (sr, dr, rad) => `inset(${sr.top - dr.top}px ${dr.right - sr.right}px ${dr.bottom - sr.bottom}px ${sr.left - dr.left}px round ${rad}px)`;
 const expandSourceOwners = new WeakMap();
 function releaseExpandSources(s) {
  const group = s?.sourceGroup?.element; if (!group) return;
  s.sourceGroup = null;
  const held = expandSourceOwners.get(group); if (!held) return;
  held.owners.delete(s);
  if (!held.owners.size) { group.inert = held.inert; expandSourceOwners.delete(group); }
 }
 function holdExpandSources(source, detail, s) {
  const group = source.closest?.('[data-st-expand-sources]');
  if (!group || group.contains(detail)) { releaseExpandSources(s); return; }
  if (s.sourceGroup?.element !== group) {
   releaseExpandSources(s);
   let held = expandSourceOwners.get(group);
   if (!held) { held = {inert: group.inert, owners: new Set()}; expandSourceOwners.set(group, held); }
   held.owners.add(s); s.sourceGroup = {element: group};
  }
  group.inert = true;
 }
 // The Card owns inherited visibility when it exposes or finally hides its detail.
 // A host's transition:all must not leave that semantic endpoint waiting on a clock.
 function transferExpandVisibility(detail, update) {
  const held = [];
  for (const el of [detail, ...qa(detail, '*')]) {
   const cs = getComputedStyle(el), properties = (cs.transitionProperty || '').split(',').map(x => x.trim());
   if (!properties.some(p => p === 'all' || p === 'visibility')) continue;
   const saved = expandStyle(el, ['transition-property','transition-duration','transition-delay']);
   const durations = (cs.transitionDuration || '0s').split(','), delays = (cs.transitionDelay || '0s').split(',');
   const owned = {'transition-property': [...properties, 'visibility'].join(', '), 'transition-duration': [...properties.map((_, i) => durations[i % durations.length]), '0s'].join(', '), 'transition-delay': [...properties.map((_, i) => delays[i % delays.length]), '0s'].join(', ')};
   for (const [key, value] of Object.entries(owned)) el.style.setProperty(key, value, 'important');
   held.push({el, saved, owned: expandStyle(el, Object.keys(owned))});
  }
  try {
   for (const {el} of held) for (const animation of el.getAnimations?.() || []) if (animation.effect?.target === el && !animation.effect.pseudoElement && animation.transitionProperty === 'visibility') animation.cancel();
   return update();
  } finally {
   // Commit the current owner's state, including a synchronous native-focus reopen.
   for (const {el} of held) getComputedStyle(el).visibility;
   for (const {el, saved, owned} of held) for (const [key, value] of Object.entries(owned)) {
    // A host focus handler may intentionally replace a declaration during showModal.
    if (el.style.getPropertyValue(key) === value.value && el.style.getPropertyPriority(key) === value.priority) el.style.setProperty(key, saved[key].value, saved[key].priority);
   }
  }
 }
 function expand(source, detail, o = {}) {
  if (!source || !detail) return;
  let instant = o.keyboard ?? keyboardInput;
  if (instant) detail.dataset.stInstant = ''; else delete detail.dataset.stInstant;
  const s = layerState(detail), wasClosing = s.closing; s.source = source; s.open = true; s.closing = false; const v = ++s.version;
  if (!wasClosing) s.moved = false;
  const nativeFocus = detail.tagName === 'DIALOG' && !detail.open;
  transferExpandVisibility(detail, () => {
   detail.dataset.stOpen = 'true'; delete detail.dataset.stClosing; detail.hidden = false; detail.inert = false; active.add(detail);
   if (nativeFocus) detail.showModal();
  });
  if (nativeFocus && (s.version !== v || !s.open)) return;
  holdExpandSources(source, detail, s);
  s.trigger = source; source.setAttribute('aria-expanded', 'true');
  const surface = q(detail, '.st-expand-surface,.expand-surface') || detail, scrim = q(detail, '[data-st-scrim]');
  // A closing surface may own a reduced-motion fade even after the preference changes.
  if (wasClosing) stop(surface, 'o');
  const pairs = sharedPairs(source, detail), rad = parseFloat(getComputedStyle(source).borderRadius) || 12;
  const sr = source.getBoundingClientRect(), dr = surface.getBoundingClientRect(), paint = expandPaint(surface, s);
  const endR = parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 16;
  source.style.visibility = 'hidden';
  const content = qa(surface, '[data-st-expand-content]'), closeControl = q(surface, '[data-st-close]');
  // Preserve the painted start before native-visible focus retires a nested wrapper's motion.
  const closeStart = wasClosing && closeControl ? box(closeControl.getBoundingClientRect()) : null;
  if (closeControl) { watchExpandCloseFocus(closeControl, s, surface); if (!nativeFocus) closeControl.focus?.({preventScroll: true}); if (s.version !== v || !s.open) return; revealFocusedExpandClose(closeControl, true); }
  // Measured before the shared parts move: afterwards the artwork already sits on the card it came from.
  const closePinned = pinExpandClose(closeControl, surface, source, s);
  s.closePinFallback = !!q(source, '[data-st-close-anchor]') && !closePinned;
  if (s.closePinFallback) { instant = true; detail.dataset.stInstant = ''; }
  const hangs = new Map(content.map(c => [c, hang(c, pairs)]));
  // The rest of the page dims quickly, so it never competes with the opening card.
  if (scrim) { scrim.dataset.stOpen = 'true'; if (instant) stop(scrim); else play(scrim, [{opacity: 0}, {opacity: 1}], {ms: 140, curve: 'F', fade: true, current: wasClosing}); }
  if (instant || reduced()) {
   // Release every owned visual channel, including geometry held by a normal-motion exit.
   // The replacement view is opaque immediately; fading it would expose the source cards.
   content.forEach(c => { stop(c, 'o'); stop(c, 'clip'); stop(c, 't'); });
   if (closeControl) { stop(closeControl, 'o'); stop(closeControl, 'expand-close-position'); }
   stop(surface, 'o'); stop(paint, 'clip');
   retireExpandReveals(pairs);
   pairs.forEach(([, d]) => { stop(d, 'shared'); d.style.visibility = ''; });
   if (s.travelers) { for (const g of s.travelers.values()) { stopAll(g); g.remove(); } s.travelers.clear(); } s.titleFades?.clear(); s.moved = false;
  }
  else {
   // The shell's clip is sampled from the same spring track as the shared parts, so all three move as one.
   { const cur = wasClosing ? parseInset(getComputedStyle(paint).clipPath) : null, a0 = cur || [sr.top - dr.top, dr.right - sr.right, dr.bottom - sr.bottom, sr.left - dr.left], r0 = wasClosing ? endR : rad;
     play(paint, [{clipPath: `inset(${a0[0]}px ${a0[1]}px ${a0[2]}px ${a0[3]}px round ${r0}px)`}, {clipPath: `inset(0px 0px 0px 0px round ${endR}px)`}], {spring: 'expand', channel: 'clip', current: false});
     if (closeControl && !closePinned) attachExpandClose(closeControl, surface, {x: dr.left + a0[3], y: dr.top + a0[0], w: dr.width - a0[1] - a0[3], h: dr.height - a0[0] - a0[2]}, box(dr), 'expand', wasClosing, closeStart); }
   travel(s, detail, pairs, false, v).then(ok => { if (!ok || !s.open) return; for (const [d, g] of s.travelers) { d.style.visibility = ''; stopAll(g); g.remove(); if (s.titleFades?.has(d)) fadeIn(d, {ms: 80, blur: false, channel: 'expand-reveal'}); } s.travelers.clear(); s.titleFades?.clear(); s.moved = false; });
   // Details ride the shell: clipped by the same spring that grows it and drawn a little toward the card they
   // came from, so the surface is never an empty frame. Layouts keep details out of the title's path.
   content.forEach(c => {
    const cr = c.getBoundingClientRect(), cur = wasClosing ? parseInset(getComputedStyle(c).clipPath) : null;
    // The clip lives in the content's own (translated) space, so offset it by the same pull.
    const pull = hangs.get(c), c0 = cur || [sr.top - cr.top - pull, cr.right - sr.right, cr.bottom + pull - sr.bottom, sr.left - cr.left];
    // Ends on the surface's own edges: start, end and translation together track the shell's clip exactly.
    play(c, [{clipPath: `inset(${c0[0]}px ${c0[1]}px ${c0[2]}px ${c0[3]}px round ${rad}px)`}, {clipPath: `inset(${dr.top - cr.top}px ${cr.right - dr.right}px ${cr.bottom - dr.bottom}px ${dr.left - cr.left}px round ${endR}px)`}], {spring: 'expand', channel: 'clip', current: false});
    play(c, [{transform: `translateY(${pull}px)`}, {transform: 'none'}], {spring: 'expand', channel: 't', current: wasClosing});
    play(c, [{opacity: 0}, {opacity: 1}], {ms: 110, curve: 'F', delay: 70, channel: 'o', current: wasClosing, fade: true});
   });
   // The original dismissal is usable from the first accepted frame, even for pointer input.
   if (closeControl) revealFocusedExpandClose(closeControl, true);
  }
  if (!closeControl) focusFirst(detail);
  if (closeControl) revealFocusedExpandClose(closeControl, true);
 }
 function collapse(detail, o = {}) {
  let instant = o.keyboard ?? keyboardInput;
  if (instant) detail.dataset.stInstant = '';
  const s = layerState(detail); if (!s.open || !s.source) return;
  s.open = false; s.closing = true; const v = ++s.version, source = s.source;
  // Publish logical state now so Replay/direct toggles can reverse this exit.
  detail.dataset.stOpen = 'false';
  detail.dataset.stClosing = 'true';
  source.setAttribute('aria-expanded', 'false');
  const surface = q(detail, '.st-expand-surface,.expand-surface') || detail, scrim = q(detail, '[data-st-scrim]');
  const refocus = detail.contains(doc.activeElement) ? focusReturn(source) : null;
  detail.inert = true;
  const sr = source.getBoundingClientRect(), dr = surface.getBoundingClientRect(), rad = parseFloat(getComputedStyle(source).borderRadius) || 12;
  const finish = () => {
   if (s.version !== v || s.open) return; s.closing = false; s.moved = false;
   if (s.travelers) { for (const [d, g] of s.travelers) { stopAll(g); g.remove(); d.style.visibility = ''; } s.travelers.clear(); }
   restoreExpandPaint(surface, s);
   restoreExpandClosePin(s);
   releaseExpandSources(s);
   source.style.visibility = '';
   transferExpandVisibility(detail, () => { detail.dataset.stOpen = 'false'; delete detail.dataset.stClosing; active.delete(detail); });
   const titleFades = new Set(s.titleFades); s.titleFades?.clear();
   stopAll(surface); qa(detail, '*').forEach(stopAll); if (scrim) stopAll(scrim);
   if (detail.tagName === 'DIALOG' && detail.open) detail.close();
   if (s.version !== v || s.open) return;
   if (titleFades.size && !instant) { for (const [a, d] of sharedPairs(source, detail)) if (titleFades.has(d)) fadeIn(a, {ms: 80, blur: false, channel: 'expand-reveal'}); }
   refocus?.();
  };
  const closeControl = q(surface, '[data-st-close]');
  const closePinned = !instant && pinExpandClose(closeControl, surface, source, s);
  if (s.closePinFallback || (q(source, '[data-st-close-anchor]') && !closePinned)) { instant = true; detail.dataset.stInstant = ''; }
  if (instant) { if (scrim) scrim.dataset.stOpen = 'false'; retireExpandReveals(sharedPairs(source, detail)); finish(); return; }
  if (scrim) { scrim.dataset.stOpen = 'false'; play(scrim, [{opacity: 0}], {ms: 'control', curve: 'F', fade: true, fill: 'forwards'}); }
  if (closeControl) play(closeControl, [{opacity: 0}], {ms: 60, curve: 'X', channel: 'o', fill: 'forwards', fade: true});
  // Details shrink back with the shell rather than leaving it empty, and are gone before it lands.
  const backPairs = sharedPairs(source, detail), ap = parseInset(getComputedStyle(s.paint || surface).clipPath) || [0, 0, 0, 0];
  const shellNow = {top: dr.top + ap[0], right: dr.right - ap[1], bottom: dr.bottom - ap[2], left: dr.left + ap[3]}, shellR = parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 16;
  qa(surface, '[data-st-expand-content]').forEach(c => {
   play(c, [{opacity: 0}], {ms: 90, curve: 'X', channel: 'o', fill: 'forwards', fade: true});
   if (reduced()) return;
   const ty = new DOMMatrix(getComputedStyle(c).transform).m42, r = c.getBoundingClientRect(), cr = {top: r.top - ty, bottom: r.bottom - ty, left: r.left, right: r.right};
   const pull = hang(c, backPairs, cr), sh = shellNow;
   play(c, [{clipPath: `inset(${sh.top - cr.top - ty}px ${cr.right - sh.right}px ${cr.bottom + ty - sh.bottom}px ${sh.left - cr.left}px round ${shellR}px)`}, {clipPath: `inset(${sr.top - cr.top - pull}px ${cr.right - sr.right}px ${cr.bottom + pull - sr.bottom}px ${sr.left - cr.left}px round ${rad}px)`}], {spring: 'snappy', channel: 'clip', fill: 'forwards', current: false});
   play(c, [{transform: `translateY(${pull}px)`}], {spring: 'snappy', channel: 't', fill: 'forwards'});
  });
  if (reduced()) { if (closeControl) stop(closeControl, 'expand-close-position'); play(surface, [{opacity: 0}], {ms: 'quick', fade: true, channel: 'o', fill: 'forwards'}).then(finish); return; }
  { const a0 = parseInset(getComputedStyle(s.paint || surface).clipPath) || [0, 0, 0, 0], r0 = parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 16;
    play(s.paint || surface, [{clipPath: `inset(${a0[0]}px ${a0[1]}px ${a0[2]}px ${a0[3]}px round ${r0}px)`}, {clipPath: cardClip(sr, dr, rad)}], {spring: 'snappy', channel: 'clip', fill: 'forwards', current: false});
    if (closeControl && !closePinned) attachExpandClose(closeControl, surface, {x: dr.left + a0[3], y: dr.top + a0[0], w: dr.width - a0[1] - a0[3], h: dr.height - a0[0] - a0[2]}, box(sr), 'snappy', true); }
  travel(s, detail, sharedPairs(source, detail), true, v).then(ok => { if (ok) finish(); });
 }

 /* ---------- Page: the old view clears in 60ms toward where it came from, shared parts travel to their new places,
    and the rest of the new view slides in from the direction of navigation a beat later. Nothing is drawn twice. ---------- */
 let pageVersion = 0, pageCleanup = null;
 async function page(direction, update, el = doc.documentElement, o = {}) {
  const scope = el === doc.documentElement ? doc.body : el, v = ++pageVersion, dir = direction === 'back' ? -1 : 1;
  const keys = new Set(o.shared || []), isShared = n => n.dataset && keys.has(n.dataset.stShared), before = new Map();
  qa(scope, '[data-st-shared]').filter(isShared).forEach(n => before.set(n.dataset.stShared, n.getBoundingClientRect()));
  const interrupted = !!pageCleanup; pageCleanup?.();
  if (reduced()) { await update(); return; }
  const outgoing = interrupted ? doc.createElement('span') : ghost(scope, scope.parentElement);
  qa(outgoing, '[data-st-shared]').filter(n => keys.has(n.dataset.stShared) || keys.has(n.dataset.stGhostOf)).forEach(n => n.style.visibility = 'hidden');
  const clean = () => { stopAll(outgoing); outgoing.remove(); };
  pageCleanup = clean;
  await update();
  if (v !== pageVersion) { clean(); return; }
  const jobs = [play(outgoing, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: `translateX(${-12 * dir}px)`}], {ms: interrupted ? 40 : 60, curve: 'X', fill: 'forwards'}).then(clean)];
  // Shared parts: one copy each, travelling from where it was drawn.
  qa(scope, '[data-st-shared]').filter(n => isShared(n) && before.has(n.dataset.stShared)).forEach(n => {
   if (getComputedStyle(n).display === 'inline') n.style.display = 'inline-block';
   // While it travels, a shared part rides above the content arriving around it.
   const saved = {position: n.style.position, zIndex: n.style.zIndex};
   if (getComputedStyle(n).position === 'static') n.style.position = 'relative'; n.style.zIndex = '3';
   const a = before.get(n.dataset.stShared), b = n.getBoundingClientRect();
   jobs.push(play(n, [{transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)`}, {transform: 'none'}], {spring: 'snappy', channel: 'shared', current: false}).then(r => { Object.assign(n.style, saved); return r; }));
  });
  // Everything else in the new view: the largest blocks that hold no shared part.
  const loose = root => [...root.children].flatMap(c => isShared(c) ? [] : qa(c, '[data-st-shared]').some(isShared) ? loose(c) : [c]);
  for (const n of loose(scope)) {
   // A beat after the shared parts have nearly landed, so nothing arrives underneath them.
   const wait = before.size ? (n === loose(scope)[0] ? 140 : 170) : 60;
   jobs.push(play(n, [{opacity: 0}, {opacity: 1}], {ms: 220, curve: 'O', delay: wait, channel: 'o', current: false, fade: true}));
   jobs.push(play(n, [{transform: `translateX(${16 * dir}px)`}, {transform: 'none'}], {ms: 260, curve: 'O', delay: wait, channel: 't', current: false}));
  }
  await Promise.all(jobs); if (v === pageVersion) pageCleanup = null;
 }

 /* ---------- Command palette: filter with FLIP, one highlight travels between results. ---------- */
 function palette(el) {
  const input = q(el, '[data-st-palette-input]') || q(el, 'input'), box = q(el, '[role="listbox"]'); if (!input || !box) return;
  positioned(box);
  const persistent = persistentPalette(el); let editing = false;
  paletteExpanded(el, isOpen(el));
  let hl = q(box, '.st-palette-highlight'); if (!hl) { hl = doc.createElement('span'); hl.className = 'st-palette-highlight'; hl.setAttribute('aria-hidden', 'true'); box.prepend(hl); }
  // Leaving FLIP copies keep their role for paint, but never become selectable results.
  const allOptions = () => qa(box, '[role="option"]').filter(o => !o.closest('[data-st-ghost]'));
  const opts = () => allOptions().filter(o => !o.hidden);
  let activeOpt = null;
  const setActive = (opt, instant) => {
   if (!isOpen(el) || (opt && !opts().includes(opt))) opt = null;
   activeOpt = opt; allOptions().forEach(o => o.setAttribute('aria-selected', String(o === opt)));
   if (!opt) { hl.style.opacity = '0'; input.removeAttribute('aria-activedescendant'); return; }
   if (!opt.id) opt.id = 'st-opt-' + Math.random().toString(36).slice(2, 8);
   input.setAttribute('aria-activedescendant', opt.id);
   const y = opt.offsetTop, h = opt.offsetHeight;
   hl.style.height = h + 'px'; hl.style.transition = instant || hl.style.opacity === '0' ? 'none' : ''; hl.style.transform = `translateY(${y}px)`; hl.style.opacity = '1';
   void hl.offsetHeight; hl.style.transition = '';
   // Keep the highlighted result in view by scrolling the list itself, never the page around it.
   const lb = opt.closest('[role="listbox"]'); if (lb) { const top = opt.offsetTop - lb.offsetTop * (opt.offsetParent === lb ? 0 : 1); if (top < lb.scrollTop) lb.scrollTop = top; else if (top + h > lb.scrollTop + lb.clientHeight) lb.scrollTop = top + h - lb.clientHeight; }
  };
  input.addEventListener('input', () => {
   // Typing or pasting after Escape reopens without throwing away the new query.
   if (persistent && !isOpen(el)) { editing = true; open(el, input, {keyboard: keyboardInput}); editing = false; }
   const term = input.value.trim().toLowerCase(), all = allOptions();
   const visible = all.filter(o => !o.hidden), leaving = visible.filter(o => !o.textContent.toLowerCase().includes(term));
   const ghosts = reduced() ? [] : leaving.map(o => ghost(o, box));
   flip(visible.filter(o => !leaving.includes(o)), () => { all.forEach(o => { const was = o.hidden; o.hidden = !o.textContent.toLowerCase().includes(term); if (was && !o.hidden) fadeIn(o, {ms: 'control'}); }); }, {spring: 'snappy'});
   ghosts.forEach(g => play(g, [{opacity: 1}, {opacity: 0}], {ms: 'feedback', curve: 'F', fill: 'forwards'}).then(() => g.remove()));
   const empty = q(el, '[data-st-palette-empty]'); if (empty) empty.hidden = opts().length > 0;
   setActive(opts()[0] || null);
  });
  input.addEventListener('keydown', e => {
   if (persistent && !isOpen(el) && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) { e.preventDefault(); open(el, input, {keyboard: true}); return; }
   const list = opts(); let i = list.indexOf(activeOpt);
   if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length; setActive(list[i]); }
   else if (e.key === 'Enter' && activeOpt) { e.preventDefault(); activeOpt.click(); }
  });
  box.addEventListener('pointermove', e => { const o = e.target.closest('[role="option"]'); if (o && o !== activeOpt) setActive(o); });
  box.addEventListener('click', e => { const o = e.target.closest('[role="option"]'); if (!isOpen(el) || !opts().includes(o)) return; el.dispatchEvent(new CustomEvent('st:palette-select', {bubbles: true, detail: {option: o, value: o.dataset.value || o.textContent.trim()}})); close(el); });
  el.addEventListener('st:open', () => {
   if (input.value && !editing) { input.value = ''; input.dispatchEvent(new Event('input')); } setActive(opts()[0] || null, true);
   // A delayed open must not reclaim focus after another intent or a later opening.
   const version = layerState(el).version, focus = focusVersion, owner = doc.activeElement;
   requestAnimationFrame(() => { if (isOpen(el) && layerState(el).version === version && focusVersion === focus && doc.activeElement === owner) input.focus({preventScroll:true,focusVisible:keyboardInput}); });
  });
  setActive(isOpen(el) ? opts()[0] || null : null, true);
  if (persistent) {
   // Focus opens for either input mode. Close-time focus restoration must not reopen it.
   input.addEventListener('focus', () => { if (!isOpen(el) && !layerState(el).closing) open(el, input, {keyboard: keyboardInput}); });
   // A second click still opens when Escape left focus in the visible search field.
   input.addEventListener('click', () => { if (!isOpen(el)) open(el, input, {keyboard: keyboardInput}); });
  }
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

 /* ---------- v3: local feedback, shared images and direct manipulation ---------- */
 function badge(el, value, fromMutation = false) {
  el.dataset.stFrequent = '';
  const visible = Number(value) > 0, was = el.dataset.stVisible === 'true';
  el.dataset.stVisible = String(visible); el.setAttribute('aria-label', visible ? `${value} unread notifications` : 'No unread notifications');
  // A count this small changes as one unit: the old number lifts out, the new one rises in, no per-digit overlap.
  // The count changes by place value, each digit rolling in its own clipped track, like any other number.
  // stLabel mirrors the shown value so the attribute observer does not re-enter.
  if (!fromMutation) { el.dataset.stLabel = String(value); number(el, value); el.dataset.value = String(value); }
  if (visible && !was) play(el, [{transform: 'scale(.5)', opacity: 0}, {transform: 'none', opacity: 1}], {spring: 'bouncy', channel: 'badge', fade: true});
  else if (!visible) play(el, [{transform: 'scale(.5)', opacity: 0}], {ms: 'quick', curve: 'X', channel: 'badge', fill: 'forwards', fade: true});
 }
 // A status mark: one disc that is idle, loading (an arc runs round its edge), done (the arc closes, the tick arrives
 // rotated and blurred and dips into place) or failed (the cross draws and the disc gives a small shake).
 function tickIn(tick) {
  if (!tick) return Promise.resolve();
  if (reduced()) return play(tick, [{opacity: 0}, {opacity: 1}], {ms: 'quick', fade: true});
  return Promise.all([
   play(tick, [{opacity: 0, filter: 'blur(6px)'}, {opacity: 1, filter: 'blur(0px)'}], {ms: 450, curve: 'O', channel: 'o', current: false, blur: false}),
   play(tick, [{transform: 'rotate(-20deg) translateY(0px)'}, {transform: 'rotate(-11deg) translateY(4px)', offset: .44}, {transform: 'rotate(0deg) translateY(0px)'}], {ms: 450, curve: 'cubic-bezier(.2,0,0,1)', channel: 't', current: false})]);
 }
 const STATUS_MARK = '<span class="st-status-mark" aria-hidden="true"><svg class="st-status-disc" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20"/></svg>' +
  '<svg class="st-status-ring" viewBox="0 0 40 40"><circle class="st-status-arc" cx="20" cy="20" r="18.5" pathLength="100"/></svg>' +
  '<svg class="st-status-idle" viewBox="0 0 40 40"><path pathLength="100" d="M14 18.5a6.5 6.5 0 0 1 11.6-3.4M26 21.5a6.5 6.5 0 0 1-11.6 3.4M25.8 11.8v3.6h-3.6M14.2 28.2v-3.6h3.6"/></svg>' +
  '<svg class="st-success-tick" viewBox="0 0 40 40"><path d="m12.5 20.5 5 5 10-11" pathLength="100"/></svg>' +
  '<svg class="st-status-cross" viewBox="0 0 40 40"><path d="m15 15 10 10M25 15 15 25" pathLength="100"/></svg></span>';
 function progress(el, next) {
  if (!el || !['idle', 'loading', 'success', 'error'].includes(next)) return;
  if (!q(el, '.st-status-mark')) el.innerHTML = STATUS_MARK;
  const prev = el.dataset.stProgress;
  el.dataset.stProgress = next; el.setAttribute('role', 'status'); el.setAttribute('aria-label', {idle: 'Ready', loading: 'Loading', success: 'Completed', error: 'Failed'}[next]); el.setAttribute('aria-busy', String(next === 'loading'));
  if (next === 'success' && prev !== 'success') tickIn(q(el, '.st-success-tick'));
  if (next === 'error' && prev !== 'error' && !reduced()) play(q(el, '.st-status-mark'), SHAKE.map(f => ({transform: f.transform.replace(/(-?[\d.]+)px/, (m, v) => (v * .6).toFixed(2) + 'px')})), {ms: 360, curve: 'linear', channel: 'shake', current: false});
  if (next === 'success' || next === 'error') announce(next === 'success' ? 'Completed' : 'Failed');
 }
 function tilt(el, x = 0, y = 0) {
  if (reduced() || !finePointer.matches) { el.style.transform = ''; return; }
  // Engaged, the card lifts and leans toward the pointer; the photo inside shifts the other way for depth, and a soft
  // light follows the pointer. Released, everything settles back on the same spring.
  const on = !!(x || y), rx = clamp(-y * 3, -3, 3), ry = clamp(x * 3, -3, 3);
  el.dataset.stEngaged = String(on);
  el.style.transform = on ? `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)` : '';
  const media = q(el, 'img,.st-media'); if (media) media.style.transform = on ? `translate(${-x * 4}px, ${-y * 3}px) scale(1.06)` : '';
  const shine = q(el, '.st-tilt-light'); if (shine) { shine.style.transform = `translate(${x * 60}px,${y * 40}px)`; shine.style.opacity = on ? '.32' : '0'; }
 }
 function bindTilt(el) {
  let raf = 0, point;
  el.addEventListener('pointermove', e => { if (!finePointer.matches || reduced()) return; point = e; if (!raf) raf = requestAnimationFrame(() => { raf = 0; const r = el.getBoundingClientRect(); tilt(el, (point.clientX - r.left) / r.width * 2 - 1, (point.clientY - r.top) / r.height * 2 - 1); }); });
  el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); raf = 0; tilt(el); });
 }
 const images = new WeakMap(); let currentImage;
 function image(source) {
  let s = images.get(source);
  if (!s) {
   const img = source.matches('img') ? source : q(source, 'img'); if (!img) return;
   const dialog = doc.createElement('dialog'); dialog.className = 'st-lightbox'; dialog.setAttribute('aria-label', img.alt || 'Image preview');
   const full = img.cloneNode(); full.removeAttribute('id'); const closeButton = doc.createElement('button'); closeButton.className = 'st-button st-lightbox-close'; closeButton.textContent = 'Close'; const backdrop=doc.createElement('span');backdrop.className='st-lightbox-scrim';backdrop.setAttribute('aria-hidden','true');dialog.append(backdrop,full,closeButton); (source.closest('[data-st-preview]') || doc.body).append(dialog);
   s = {dialog, full, img, source, version: 0, open: false}; images.set(source, s);
   closeButton.onclick = () => closeImage(source); dialog.addEventListener('cancel', e => { e.preventDefault(); closeImage(source); });
   // show() previews are non-modal, so the browser does not send their native cancel event.
   dialog.addEventListener('keydown', e => { if (e.key === 'Escape' && !e.defaultPrevented && source.closest('[data-st-preview]')) { e.preventDefault(); e.stopPropagation(); closeImage(source); } });
   dialog.addEventListener('click', e => { if (e.target === dialog || e.target.classList.contains('st-lightbox-scrim')) closeImage(source); });
   let drag;
   full.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch' || !s.open) return; const r = full.getBoundingClientRect(); stop(full, 'image'); const final = full.getBoundingClientRect(); full.style.transform = `translate(${r.left-final.left}px,${r.top-final.top}px) scale(${r.width/final.width})`; drag = {id: e.pointerId, y: e.clientY, last: e.clientY, time: performance.now(), velocity: 0}; full.setPointerCapture(e.pointerId); });
   full.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; const now = performance.now(); drag.velocity = (e.clientY - drag.last) / Math.max(1, now-drag.time); drag.last=e.clientY; drag.time=now; full.style.transform = reduced() ? 'none' : `translateY(${Math.max(0,e.clientY-drag.y)}px)`; });
   const end = e => { if (!drag || e.pointerId !== drag.id) return; const dismiss = e.type !== 'pointercancel' && (e.clientY-drag.y > 100 || drag.velocity > .5); drag=null; if (dismiss) closeImage(source); else { play(full,[{transform:'none'}],{spring:'smooth',channel:'image'}); full.style.transform='none'; } };
   full.addEventListener('pointerup',end); full.addEventListener('pointercancel',end);
  }
  if (s.open && !s.closing) return closeImage(source);
  if (currentImage && currentImage !== source) closeImage(currentImage);
  const wasClosing = s.closing; s.open = true; s.closing = false; currentImage = source; const v = ++s.version;
  // Start from what is on screen: the travelling photo mid-close, or the thumbnail.
  const from = wasClosing ? s.full.getBoundingClientRect() : s.img.getBoundingClientRect();
  const fromR = wasClosing ? s.radius ?? thumbRadius(s) : thumbRadius(s);
  if (!s.dialog.open) (source.closest('[data-st-preview]') ? s.dialog.show() : s.dialog.showModal());
  stop(s.full, 'image');
  const host = source.closest('[data-st-preview]'), slot = s.img.getBoundingClientRect(), ratio = slot.width / slot.height;
  const width = host ? Math.min(host.clientWidth - 40, (host.clientHeight - 88) * ratio) : Math.min(900, innerWidth - 48, (innerHeight - 144) * ratio);
  Object.assign(s.full.style, {width: width + 'px', height: width / ratio + 'px', maxWidth: 'none', maxHeight: 'none', objectFit: 'cover', transform: 'none', transformOrigin: '0 0', borderRadius: '12px'});
  const to = s.full.getBoundingClientRect();
  s.img.style.visibility = 'hidden';
  play(s.full, photoFrames(s, from, to, to, fromR, 12), {ms: track('snappy').length - 1, curve: 'linear', channel: 'image', current: false});
  play(q(s.dialog, '.st-lightbox-scrim'), [{opacity: 0}, {opacity: 1}], {ms: 160, curve: 'F', fade: true, current: wasClosing});
  play(q(s.dialog, '.st-lightbox-close'), [{opacity: 0}, {opacity: 1}], {ms: 100, curve: 'F', delay: wasClosing ? 0 : 140, fade: true, channel: 'o', current: wasClosing});
  void v;
 }
 const thumbRadius = s => parseFloat(getComputedStyle(s.source).borderTopLeftRadius) || parseFloat(getComputedStyle(s.img).borderTopLeftRadius) || 0;
 // One sampled spring: position, uniform scale and a radius that looks the same on screen at every scale.
 function photoFrames(s, from, to, base, r0, r1) {
  const T = track('snappy'), n = 40, frames = [];
  for (let i = 0; i <= n; i++) {
   const p = at(T, (T.length - 1) * i / n), w = from.width + (to.width - from.width) * p;
   const x = from.left + (to.left - from.left) * p, y = from.top + (to.top - from.top) * p, k = w / base.width, r = r0 + (r1 - r0) * p;
   frames.push({transform: `translate(${x - base.left}px, ${y - base.top}px) scale(${k})`, borderRadius: `${r / k}px`});
  }
  s.radius = r1;
  return frames;
 }
 function closeImage(source = currentImage) {
  const s = images.get(source); if (!s || !s.dialog.open || s.closing) return;
  const refocus = s.dialog.contains(doc.activeElement) ? focusReturn(source) : null;
  s.open = false; s.closing = true; const v = ++s.version;
  const rendered = s.full.getBoundingClientRect(); stop(s.full, 'image'); s.full.style.transform = 'none';
  const base = s.full.getBoundingClientRect(), target = s.img.getBoundingClientRect();
  play(q(s.dialog, '.st-lightbox-scrim'), [{opacity: 0}], {ms: 140, curve: 'F', fill: 'forwards', fade: true});
  play(q(s.dialog, '.st-lightbox-close'), [{opacity: 0}], {ms: 60, curve: 'X', fill: 'forwards', fade: true, channel: 'o'});
  return play(s.full, photoFrames(s, rendered, target, base, 12, thumbRadius(s)), {ms: track('snappy').length - 1, curve: 'linear', channel: 'image', current: false, fill: 'forwards'}).then(ok => {
   if (!ok || v !== s.version) return;
   s.img.style.visibility = ''; s.dialog.close(); stop(s.full, 'image'); stopAll(s.dialog); qa(s.dialog, '*').forEach(stopAll);
   s.closing = false; refocus?.(); if (currentImage === source) currentImage = null;
  });
 }
 function bindReorder(root) {
  let held=null, original=[], pointer=null;
  const label = row => row.dataset.stName || row.textContent.trim();
  const pick = row => { held=row; original=rows(root); row.dataset.stHeld='true'; announce(`Picked up ${label(row)}. Use arrow keys to move, Space to drop, Escape to cancel.`); };
  const move = i => { const all=rows(root), old=all.indexOf(held); i=clamp(i,0,all.length-1); if(i===old)return; all.splice(old,1);all.splice(i,0,held); list.reorder(root,all); held.querySelector('[data-st-handle]')?.focus({preventScroll:true}); announce(`${label(held)}, position ${i+1} of ${all.length}`); };
  const drop = cancel => { if(!held)return; const row=held; if(cancel)list.reorder(root,original); delete row.dataset.stHeld; row.style.translate=''; held=null; pointer=null; announce(`${label(row)} ${cancel?'cancelled':'dropped'}, position ${rows(root).indexOf(row)+1} of ${rows(root).length}`); };
  root.addEventListener('keydown',e=>{ const row=e.target.closest('[data-st-row]');if(!row)return; if(e.code==='Space'){e.preventDefault();held?drop(false):pick(row);}else if(held && ['ArrowUp','ArrowDown','Home','End','Escape'].includes(e.key)){e.preventDefault();if(e.key==='Escape')drop(true);else move(e.key==='Home'?0:e.key==='End'?rows(root).length-1:rows(root).indexOf(held)+(e.key==='ArrowUp'?-1:1));} });
  root.addEventListener('pointerdown',e=>{ const h=e.target.closest('[data-st-handle]'),row=h?.closest('[data-st-row]');if(!row || e.button!==0 || held)return; pick(row);const r=row.getBoundingClientRect();pointer={id:e.pointerId,y:e.clientY,offset:e.clientY-r.top};h.setPointerCapture(e.pointerId); });
  root.addEventListener('pointermove',e=>{if(!pointer || e.pointerId!==pointer.id || !held)return; const all=rows(root), r=root.getBoundingClientRect(), desired=clamp(e.clientY-pointer.offset,r.top,r.bottom-held.offsetHeight);const candidate=all.findIndex(n=>{const b=n.getBoundingClientRect();return e.clientY<b.top+b.height/2;});move(candidate<0?all.length-1:candidate);stop(held,'flip');held.style.translate='';const base=held.getBoundingClientRect();held.style.translate=reduced()?'':`0 ${desired-base.top}px`; });
  root.addEventListener('pointerup',e=>{if(pointer?.id===e.pointerId)drop(false);});root.addEventListener('pointercancel',()=>drop(true));
 }

 /* ---------- Init ---------- */
 const initialized = new WeakSet();
 const tabSyncs = new WeakMap();
 function init(root = doc) {
  const nodes = [...(root.matches?.('[data-st]') ? [root] : []), ...qa(root, '[data-st]')].filter(el => !el.closest('[data-st-ghost]'));
  for (const el of nodes) {
   // A responsive surface may become a sheet after its first initialization.
   if (el.dataset.st === 'sheet') sheetDrag(el);
   if (initialized.has(el)) continue; initialized.add(el);
   const kind = el.dataset.st;
   if (el.hasAttribute('popover') && POP.includes(kind)) el.popover = 'manual';
   if (el.tagName === 'DIALOG') {
    el.addEventListener('cancel', e => { e.preventDefault(); close(el); });
    el.addEventListener('click', e => { if (e.target !== el || el.hasAttribute('data-st-static')) return; const r = el.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(el); });
   }
   if (kind === 'number' || kind === 'badge') number(el, el.dataset.value ?? el.textContent.trim().replace(/[^\d.-]/g, ''));
   if (kind === 'panel' || kind === 'sheet' || kind === 'drawer') { if (el.tagName !== 'DIALOG' && el.dataset.stOpen !== 'true') el.inert = true; }
   if (kind === 'badge') el.dataset.stVisible = String(Number(el.dataset.value || el.textContent) > 0);
   if (kind === 'icon-swap') { el.addEventListener('click', () => { const on = el.dataset.stOn !== 'true'; icon(el, on); el.setAttribute('aria-pressed', String(on)); }); }
   if (kind === 'reorder') bindReorder(el);
   if (kind === 'tilt') bindTilt(el);
   if (kind === 'image-open') el.addEventListener('click', () => image(el));
   if (kind === 'skeleton') skeleton(el, el.getAttribute('aria-busy') === 'false');
   if (kind === 'button') buildButton(el);
   if (kind === 'like') { buildLike(el); el.addEventListener('click', () => like(el)); }
   if (kind === 'copy') el.addEventListener('click', () => copy(el));
   if (kind === 'palette') palette(el);
   if(['reveal','shimmer','progress','button'].includes(kind) && !el.closest('[data-st-preview]')) observer.observe(el);
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
    el.addEventListener('click', e => { if (e.target.closest('[role="menuitem"]') && !e.target.closest('[data-st-keep-open]')) close(el, plainMenu(el) ? {keyboard: e.isTrusted ? e.detail === 0 : keyboardInput} : undefined); });
   }
   if (kind === 'tabs' || kind === 'segmented') {
    const parts = tabParts(el);
    const panels = parts.tabs.map(t => doc.getElementById(t.getAttribute('aria-controls'))).filter(Boolean);
    if (panels.length && !panels[0].parentElement.classList.contains('st-tab-panels')) {
     const stack = doc.createElement('div'); stack.className = 'st-tab-panels'; panels[0].before(stack);
     panels.forEach(p => { p.dataset.stActive = String(!p.hidden); p.hidden = false; stack.append(p); });
    }
    parts.tabs.forEach(t => {
     t.addEventListener('click', () => tabSelect(el, t));
     t.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const i = parts.tabs.indexOf(t), n = parts.tabs[e.key === 'Home' ? 0 : e.key === 'End' ? parts.tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + parts.tabs.length) % parts.tabs.length];
      tabSelect(el, n, true); n.focus();
     });
    });
    const sync = () => { if (!el.isConnected) return ro.disconnect(); layoutInk(parts); const sel = parts.tabs.find(t => t.getAttribute('aria-selected') === 'true') || parts.tabs[0]; if (sel) { if (el.dataset.st === 'tabs') revealTab(parts.list, sel); indicate(el, sel, false); } };
    const ro = new ResizeObserver(sync); ro.observe(parts.list); parts.tabs.forEach(t => ro.observe(t));
    tabSelect(el, parts.tabs.find(t => t.getAttribute('aria-selected') === 'true') || parts.tabs[0], true); layoutInk(parts);
    doc.fonts?.ready.then(sync);
    tabSyncs.set(el, sync);
   }
   if (kind === 'avatars') {
    // Hover opens the whole group on one spring (everyone moves together, nothing jumps to the pointer), and one name
    // label glides above whoever is under the pointer. Leaving closes the group again.
    let name = q(el, ':scope > .st-avatar-name');
    if (!name) { name = doc.createElement('span'); name.className = 'st-avatar-name'; name.setAttribute('aria-hidden', 'true'); el.append(name); }
    const people = () => [...el.children].filter(c => !c.hidden && !c.classList.contains('st-avatar-name') && !c.hasAttribute('data-st-ghost'));
    const GAP = 10;
    const lift = index => {
     const list = people(), on = index >= 0, mid = (list.length - 1) / 2;
     el.dataset.stSpread = String(on);
     list.forEach((x, i) => { x.style.setProperty('--st-shift', on ? ((i - mid) * GAP).toFixed(1) + 'px' : '0px'); x.style.setProperty('--st-z', String(list.length - i)); });
     const t = list[index], label = t && !t.hasAttribute('data-st-avatar-more') ? t.getAttribute('aria-label') : '';
     if (!label) { name.dataset.stShow = 'false'; return; }
     // Where the person will be once the group has opened (layout position plus their share of the spread).
     const first = name.dataset.stShow !== 'true';
     name.textContent = label; name.style.setProperty('--x', (t.offsetLeft + t.offsetWidth / 2 + (index - mid) * GAP) + 'px');
     if (first) { name.style.transition = 'none'; void name.offsetWidth; name.style.transition = ''; }
     name.dataset.stShow = 'true';
    };
    people().forEach((x, i, list) => x.style.setProperty('--st-z', String(list.length - i)));
    el.__stLift = lift;
    // While the group is opening or closing, faces slide under a still pointer; that is not the user choosing a person.
    el.addEventListener('pointerover', e => { if (performance.now() < (el.__stMovingUntil || 0)) return; const i = people().indexOf(e.target.closest('[data-st="avatars"] > *')); if (finePointer.matches && i >= 0) lift(i); });
    el.addEventListener('focusin', e => { const i = people().indexOf(e.target); if (i >= 0) lift(i); });
    // "+3" opens the rest of the group: the hidden people slide out from under the chip while the stack makes room,
    // and tuck back under it on close. The chip label changes in place.
    const more = q(el, '[data-st-avatar-more]');
    if (more) {
     if (!more.dataset.stLabel) more.dataset.stLabel = more.textContent.trim();
     const collapsedLabel = more.dataset.stLabel;
     more.addEventListener('click', () => {
      const on = more.getAttribute('aria-expanded') !== 'true'; more.setAttribute('aria-expanded', String(on));
      const extras = qa(el, '[data-st-avatar-extra]'), visible = () => [...el.children].filter(c => !c.hidden && !c.hasAttribute('data-st-ghost') && !c.classList.contains('st-avatar-name'));
      // Interrupted mid-collapse: each person restarts from where its leaving copy is now, not from the chip.
      const was = new Map(); for (const [x, g] of el.__stLeaving || []) if (g.isConnected) was.set(x, g.getBoundingClientRect());
      qa(el, '[data-st-ghost]').forEach(g => { stopAll(g); g.remove(); }); el.__stLeaving = null;
      if (on) {
       el.__stMovingUntil = performance.now() + 450; name.dataset.stShow = 'false';
       // The open group takes its own, looser spacing inside the same FLIP, so it settles uncrowded.
       flip(visible(), () => { extras.forEach(x => { x.hidden = false; }); el.dataset.stExpanded = 'true'; }, {spring: 'smooth'});
       const m = more.getBoundingClientRect();
       extras.forEach((x, i) => { const r = x.getBoundingClientRect(), w = was.get(x); stop(x, 'flip'); play(x, [{transform: w ? `translateX(${w.left - r.left}px)` : `translateX(${m.left - r.left}px) scale(.7)`}, {transform: 'none'}], {spring: 'smooth', channel: 'flip', current: false, delay: w ? 0 : i * 18}); if (!w) play(x, [{opacity: 0}, {opacity: 1}], {ms: 70, curve: 'F', channel: 'o', current: false, delay: i * 18, fade: true}); });
      } else {
       const going = extras.filter(x => !x.hidden), leaving = going.map(x => ghost(x, el)), e0 = el.getBoundingClientRect(); let m;
       el.__stLeaving = going.map((x, i) => [x, leaving[i]]);
       // They tuck under the chip where it is going, not where it was.
       el.__stMovingUntil = performance.now() + 350; name.dataset.stShow = 'false';
       flip(visible().filter(c => !extras.includes(c)), () => { extras.forEach(x => { x.hidden = true; }); el.dataset.stExpanded = 'false'; m = more.getBoundingClientRect(); }, {spring: 'smooth'});
       // A centred group re-centres when it shrinks; keep the leaving copies where they were drawn.
       const e1 = el.getBoundingClientRect(); leaving.forEach(g => { g.style.left = parseFloat(g.style.left) + e0.left - e1.left + 'px'; g.style.top = parseFloat(g.style.top) + e0.top - e1.top + 'px'; });
       leaving.forEach(g => { const r = g.getBoundingClientRect(); play(g, [{transform: `translateX(${m.left - r.left}px) scale(.7)`, opacity: 0}], {ms: 180, curve: 'X', fill: 'forwards'}).then(() => g.remove()); });
      }
      people().forEach((x, i, list) => x.style.setProperty('--st-z', String(list.length - i)));
      swapText(more, on ? 'Less' : collapsedLabel);
      announce(on ? `Showing all ${visible().length - 1} people` : 'Showing fewer people');
     });
    }
    el.addEventListener('pointerleave', () => lift(-1)); el.addEventListener('focusout', e => { if (!el.contains(e.relatedTarget)) lift(-1); });
   }
   if (kind === 'icon-morph') {
    const path = q(el, 'path[data-st-on]');
    el.addEventListener('click', () => { const on = el.getAttribute('aria-pressed') !== 'true'; el.setAttribute('aria-pressed', String(on)); morphIcon(el, on); });
    void path;
   }
   if (kind === 'clear') {
    const input = q(el, 'input'), button = q(el, 'button'); let version = 0, leaving = null, clearing = false;
    if (!input || !button) continue;
    const removeLeaving = () => { if (leaving) { stopAll(leaving); leaving.remove(); leaving = null; } };
    const sync = () => {
     button.disabled = !input.value;
     if (input.value) { ++version; clearing = false; removeLeaving(); delete el.dataset.stClearing; el.dataset.stHasText = 'true'; }
     else if (!clearing) el.dataset.stHasText = 'false';
    };
    sync(); input.addEventListener('input', sync);
    button.addEventListener('click', () => {
     if (!input.value) return;
     const current = ++version, text = input.value;
     removeLeaving(); clearing = true; el.dataset.stClearing = 'true';
     const rect = input.getBoundingClientRect(), host = el.getBoundingClientRect(), cs = getComputedStyle(input);
     const ink = doc.createElement('span'); ink.className = 'st-clear-exit'; ink.textContent = input.type === 'password' ? '•'.repeat([...text].length) : text; ink.setAttribute('aria-hidden', 'true');
     Object.assign(ink.style, {position:'absolute',left:rect.left-host.left-el.clientLeft+el.scrollLeft+'px',top:rect.top-host.top-el.clientTop+el.scrollTop+'px',width:rect.width+'px',height:rect.height+'px',boxSizing:'border-box',display:'flex',alignItems:'center',padding:cs.padding,borderStyle:'solid',borderColor:'transparent',borderWidth:cs.borderWidth,font:cs.font,letterSpacing:cs.letterSpacing,color:cs.color,whiteSpace:'pre',overflow:'hidden',pointerEvents:'none'});
     el.append(ink); leaving = ink;
     input.value = ''; input.dispatchEvent(new Event('input', {bubbles:true})); input.focus({preventScroll:true});
     // The placeholder starts arriving halfway through the exit, so the field is never blank between the two.
     setTimeout(() => { if (current === version && !input.value) el.dataset.stHasText = 'false'; }, reduced() ? 0 : 40);
     play(ink, [{opacity:1,transform:'none'},{opacity:0,transform:'translateX(-3px)'}], {ms:80,curve:'X',fade:true}).then(() => {
      ink.remove(); if (current !== version) return;
      leaving = null; clearing = false; delete el.dataset.stClearing; el.dataset.stHasText = String(!!input.value);
     });
    });
   }
  }
  qa(root, '[data-st-tip]').forEach(t => { if (!initialized.has(t)) { initialized.add(t); bindTip(t); } });
 }
 const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
  target.dataset.stPaused=String(!isIntersecting);
  if(!isIntersecting)return;
  if(target.dataset.st==='reveal'){reveal(target);observer.unobserve(target);}
  if(target.dataset.st==='shimmer'&&!target.dataset.stPlayed){target.dataset.stPlayed='true';shimmer(target);}
 }));

 // Delegated triggers, outside press and Escape for managed layers.
 doc.addEventListener('click', e => {
  const trigger = e.target.closest('[data-st-target],[popovertarget]');
  if (trigger && !trigger.disabled) {
   const el = doc.getElementById(trigger.dataset.stTarget || trigger.getAttribute('popovertarget'));
   if (el && el.dataset.st) { e.preventDefault(); if (el.dataset.st === 'expand') { isOpen(el) && !layerState(el).closing ? collapse(el, {keyboard: e.isTrusted ? e.detail === 0 : keyboardInput}) : expand(trigger, el, {keyboard: e.isTrusted ? e.detail === 0 : keyboardInput}); } else toggle(el, trigger, {keyboard: plainMenu(el) && !e.isTrusted ? keyboardInput : e.detail === 0}); return; }
  }
  const dismiss = e.target.closest('[data-st-close]');
  if (dismiss) { const layer = dismiss.closest('[data-st="expand"]'); if (layer) collapse(layer, {keyboard: e.isTrusted ? e.detail === 0 : keyboardInput}); else close(dismiss.closest('dialog,[popover],[data-st="menu"],[data-st="plus-menu"],[data-st="popover-panel"],[data-st="palette"],[data-st="panel"],[data-st="sheet"],[data-st="drawer"],[data-st="modal"]')); return; }
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
  if (e.defaultPrevented) return;
  // Respect the actual top layer, including its outgoing interval. Native modal
  // cancellation owns Escape; a later manual child menu still gets the first Escape.
  const top = [...active].reverse().find(el => el.dataset.st !== 'tooltip' && (el.tagName !== 'DIALOG' || el.open) && (isOpen(el) || layerState(el).closing));
  if (top?.tagName === 'DIALOG' && !top.hasAttribute('data-st-contained')) return;
  if (top) { e.preventDefault(); if (!layerState(top).closing || plainMenu(top)) top.dataset.st === 'expand' ? collapse(top, {keyboard: true}) : close(top); }
 });
 let frame = 0;
 const reposition = () => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; for (const el of active) { const s = layers.get(el); if (POP.includes(el.dataset.st) && s?.trigger && el.matches(':popover-open')) place(el, s.trigger); } }); };
 addEventListener('resize', reposition); addEventListener('scroll', reposition, {capture: true, passive: true});
 // A wide/narrow viewport round trip can end at the last ResizeObserver size while
 // native overflow clamping has already reset scrollLeft. Recheck after layout even
 // if no observed box-size change survives. Do not react to ordinary strip scrolling.
 let tabResizeFrame = 0;
 addEventListener('resize', () => {
  if (tabResizeFrame) return;
  tabResizeFrame = requestAnimationFrame(() => {
   tabResizeFrame = 0;
   // Query connected roots at execution time; the WeakMap does not retain removed UI.
   for (const el of qa(doc, '[data-st="tabs"], [data-st="segmented"]')) tabSyncs.get(el)?.();
  });
 });
 mq.addEventListener('change', () => { if (mq.matches) doc.getAnimations().forEach(a => { try { a.finish(); } catch { a.cancel(); } }); });

 const mutation = new MutationObserver(records => {
  for (const r of records) {
   if (r.type === 'attributes' && r.target.dataset.st === 'number') number(r.target, r.target.dataset.value);
   // A badge changed from outside rolls like one changed through the API; its own updates are already drawn.
   if (r.type === 'attributes' && r.target.dataset.st === 'badge' && r.target.dataset.stLabel !== r.target.dataset.value) badge(r.target, r.target.dataset.value);
   for (const n of r.addedNodes) if (n.nodeType === 1 && !n.hasAttribute("data-st-ghost")) init(n);
   for (const n of r.removedNodes) if (n.nodeType === 1 && !n.isConnected) { for (const l of [...active]) if (n === l || n.contains(l)) { releaseExpandSources(layers.get(l)); active.delete(l); } }
  }
 });
 const start = () => { init(); mutation.observe(doc.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-value']}); };
 if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, {once: true}); else start();

 window.SeenryTransitions = {
  // v1 API (unchanged names)
  number, swapText,
  blur(on = true, root = doc.documentElement, px) { if (on) root.dataset.stBlur = px ? String(px) : ''; else delete root.dataset.stBlur; }, shake, success, page, resize, pop, open, close, icon, skeleton, reveal, shimmer, stream, toast, init, tab: tabSelect,
  // v2 additions
  toggle, state, clearError, copy, like, list, expand, collapse, accordion, flip, play, spring, progress, badge, image, closeImage, tilt, tooltip: {show: t => showTip(t, true), hide: () => hideTip()}
 };
})();
