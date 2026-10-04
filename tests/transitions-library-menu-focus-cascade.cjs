// Bounded CSS cascade/interpolation regression against actual PR65 observations.
// This models the audited Menu row transition rules, not native CSS/layout/paint.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const observed = require('./fixtures/transitions/native-menu-reduced-focus-observed.json');
const focusSelector = '[data-st="menu"]:not([data-st-morph]) [role="menuitem"]:focus-visible';
const rowSelector = '[data-st="menu"]:not([data-st-morph]) [role="menuitem"]';
const guard = `${rowSelector} { transition: none !important; }`;

// Read authored rules with their enclosing media conditions and source order.
// Commas inside :is(), var() and timing functions are not selector/value splits.
function split(text, delimiter = ',') {
 let depth = 0, start = 0; const parts = [];
 for (let i = 0; i < text.length; i++) {
  if ('(['.includes(text[i])) depth++;
  if (')]'.includes(text[i])) depth--;
  if (text[i] === delimiter && !depth) { parts.push(text.slice(start, i).trim()); start = i + 1; }
 }
 parts.push(text.slice(start).trim()); return parts;
}
function rules(text, media = []) {
 text = text.replace(/\/\*[\s\S]*?\*\//g, ''); const result = []; let start = 0;
 while (start < text.length) {
  const open = text.indexOf('{', start); if (open < 0) break;
  let depth = 1, end = open + 1;
  for (; depth && end < text.length; end++) { if (text[end] === '{') depth++; if (text[end] === '}') depth--; }
  assert.equal(depth, 0, 'Unbalanced CSS');
  const selector = text.slice(start, open).trim(), body = text.slice(open + 1, end - 1);
  if (selector.startsWith('@media')) result.push(...rules(body, [...media, selector]));
  else if (!selector.startsWith('@')) result.push({selectors: split(selector), body, media});
  start = end;
 }
 return result;
}
function declarations(body) {
 return split(body, ';').filter(Boolean).map(text => {
  const colon = text.indexOf(':'); assert(colon > 0);
  return {property: text.slice(0, colon).trim(), value: text.slice(colon + 1).replace(/\s*!important\s*$/, '').trim(), important: /!important\s*$/.test(text)};
 });
}
const initial = {'transition-property': 'all', 'transition-duration': '0s', 'transition-delay': '0s', 'transition-timing-function': 'ease'};
function expand(d) {
 if (d.property !== 'transition') return [d];
 if (d.value === 'none') return Object.entries({...initial, 'transition-property': 'none'}).map(([property, value]) => ({...d, property, value}));
 // The gallery's generic button shorthand is lower specificity than Menu's
 // transition:none; retain its actual property and duration lists in the model.
 const values = split(d.value).map(value => value.split(/\s+/));
 return Object.entries({'transition-property': values.map(v => v[0]).join(','), 'transition-duration': values.map(v => v[1]).join(','), 'transition-delay': '0s', 'transition-timing-function': values.map(v => v.slice(2).join(' ')).join(',')}).map(([property, value]) => ({...d, property, value}));
}
function cascade(css, html, {reduce = true, focused = true, kind = 'menu', morph = false, gallery = true} = {}) {
 const ordinary = kind === 'menu' && !morph;
 // Exact applicable transition branches for the sampled bare <button
 // role=menuitem> under .stage > .menu-demo > [data-st=menu]. In detail the
 // same stage is moved under the native parent dialog; these branches persist.
 const matches = new Map([
  ['button', [0, 0, 1]], ['[data-st] *', [0, 1, 0]],
  [`[data-st="${kind}"] [role="menuitem"]`, [0, 2, 0]],
  ['.stage :is(button,a,[role=tab],[role=menuitem],[role=option],summary,.opt,.task,.msg,.cover-card)', [0, 2, 0]],
  ...(ordinary && focused ? [[focusSelector, [0, 4, 0]]] : []),
  ...(ordinary ? [[rowSelector, [0, 3, 0]]] : []),
 ]);
 const styles = [...rules(css), ...(gallery ? rules(html.match(/<style>([\s\S]*?)<\/style>/)[1]) : [])];
 const winners = {}; const applicable = [];
 styles.forEach((rule, order) => {
  if (rule.media.length && !rule.media.every(m => /prefers-reduced-motion\s*:\s*reduce/.test(m) && reduce)) return;
  const specificity = rule.selectors.filter(s => matches.has(s)).map(s => matches.get(s)).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0];
  if (!specificity) return;
  const ds = declarations(rule.body).flatMap(expand).filter(d => d.property.startsWith('transition-'));
  if (ds.length) applicable.push({selectors: rule.selectors, media: rule.media, declarations: ds});
  ds.forEach((d, declarationOrder) => {
   const rank = [Number(d.important), ...specificity, order, declarationOrder], previous = winners[d.property];
   const stronger = !previous || rank.some((n, i) => n > previous.rank[i] && rank.slice(0, i).every((v, j) => v === previous.rank[j]));
   if (stronger) winners[d.property] = {...d, rank};
  });
 });
 return {values: {...initial, ...Object.fromEntries(Object.entries(winners).map(([p, d]) => [p, d.value]))}, applicable};
}
function clock(style, property) {
 const properties = split(style.values['transition-property']);
 let index = properties.lastIndexOf(property); if (index < 0) index = properties.lastIndexOf('all');
 if (index < 0) return 0;
 const durations = split(style.values['transition-duration']);
 const value = durations[index % durations.length];
 assert.match(value, /^\d*\.?\d+(?:ms|s)$/, 'This regression requires a resolved clock');
 return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
}
function shadow(value) {
 const match = value.match(/rgba?\(([^)]+)\)/); assert(match, value);
 const color = match[1].split(',').map(Number);
 return {alpha: color.length === 4 ? color[3] : 1, spread: Number.parseFloat(value.replace(match[0], '').replace('inset', '').trim().split(/\s+/)[3])};
}
function verify(css, html) {
 assert.equal(css.split(guard).length, 2, 'Exactly one narrowly scoped guard');
 const old = css.replace(guard, ''), oldStyle = cascade(old, html), fixedStyle = cascade(css, html);
 assert.equal(clock(oldStyle, 'box-shadow'), 100);
 assert.equal(clock(oldStyle, 'background-color'), 100);
 assert.equal(oldStyle.values['transition-timing-function'], 'linear');
 assert.equal(clock(fixedStyle, 'box-shadow'), 0);
 assert.equal(clock(fixedStyle, 'background-color'), 0);
 assert.equal(fixedStyle.values['transition-property'], 'none');
 // Removing only importance must also fail: ordinary specificity cannot beat
 // the reduced-motion !important longhands, even when declared later.
 const weak = cascade(css.replace(guard, guard.replace(' !important', '')), html);
 assert.equal(clock(weak, 'box-shadow'), 100);
 const ringRule = rules(css).find(r => !r.media.length && r.selectors.includes(focusSelector));
 assert(ringRule); assert.match(ringRule.body, /box-shadow:\s*inset 0 0 0 2px var\(--focus-ring\)/);
 let sampledBoundaries = 0;
 for (const row of observed.cases) {
  assert.equal(row.runIdentity.checkoutHead, '10997a545cc5a5373b743cec02d7f1dcbe54e7aa');
  assert.equal(row.profile.motion, 'reduce');
  const target = shadow(row.samples.at(-1).cue.boxShadow); assert.equal(target.alpha, 1); assert.equal(target.spread, 2);
  for (const sample of row.samples.slice(0, -1)) {
   sampledBoundaries++;
   assert(sample.focused && sample.focusVisible && sample.menu.open && sample.menu.nativeOpen && !sample.menu.inert);
   assert.equal(sample.menu.opacity, '1'); assert.equal(sample.menu.filter, 'none'); assert.equal(sample.menu.transform, 'none');
   const animation = sample.animations.find(a => a.kind === 'CSSTransition' && a.properties.includes('boxShadow'));
   assert(animation); assert.equal(animation.duration, clock(oldStyle, 'box-shadow'));
   const progress = Math.min(1, animation.currentTime / clock(oldStyle, 'box-shadow')), actual = shadow(sample.cue.boxShadow);
   assert(Math.abs(actual.alpha - target.alpha * progress) < .006, 'Negative control reproduces sampled shadow alpha');
   assert(Math.abs(actual.spread - target.spread * progress) < .0001, 'Negative control reproduces sampled shadow spread');
   if (['accepted', 'first-raf'].includes(sample.boundary)) {
    assert.equal(progress, 0); assert.equal(actual.alpha, 0); assert.equal(actual.spread, 0);
    // With no applicable transition the target value applies at acceptance.
    const fixedProgress = clock(fixedStyle, 'box-shadow') === 0 ? 1 : progress;
    assert.equal(target.alpha * fixedProgress, 1); assert.equal(target.spread * fixedProgress, 2);
   }
  }
 }
 // Compare complete modeled transition longhands, preserving other paths.
 for (const settings of [{kind: 'plus-menu'}, {morph: true}, {kind: 'popover'}, {reduce: false}]) {
  assert.deepEqual(cascade(css, html, settings).values, cascade(old, html, settings).values, JSON.stringify(settings));
 }
 // Transitions use the after-change style. A focus-visible-only reset fixes
 // B's acquisition but lets the departing A regain the global 100ms clock.
 // This is a source-derived regression control, not a newly observed native bug.
 const focusOnly = css.replace(guard, `${focusSelector} { transition: none !important; }`);
 assert.equal(clock(cascade(focusOnly, html), 'box-shadow'), 0);
 assert.equal(clock(cascade(focusOnly, html, {focused: false}), 'box-shadow'), 100);
 const releaseDuration = clock(cascade(focusOnly, html, {focused: false}), 'box-shadow');
 const outgoingAt25ms = 2 * (1 - 25 / releaseDuration), incomingAt25ms = 2;
 assert.equal(outgoingAt25ms, 1.5); assert.equal(incomingAt25ms, 2, 'Focus-only control permits simultaneous old/new rings');
 for (const property of ['box-shadow', 'background-color']) {
  assert.equal(clock(cascade(css, html, {focused: false}), property), 0, 'Ordinary reduced Menu release and pointer tint obey row transition:none');
  assert.equal(clock(cascade(old, html, {focused: false}), property), 100, 'Removed reset restores the unintended global row fade');
 }
 const releaseInstant = clock(cascade(css, html, {focused: false}), 'box-shadow') === 0;
 assert.equal(releaseInstant ? 0 : outgoingAt25ms, 0, 'Only the newly focused row retains a ring');
 assert.equal(clock(cascade(css, html, {gallery: false}), 'box-shadow'), 0, 'Standalone Menu receives the same focused override');
 assert.equal(clock(cascade(old, html, {gallery: false}), 'box-shadow'), 100, 'Standalone negative reproduces the same cascade defect');
 return {sampledBoundaries, cases: observed.cases.length, negativeControl: 'removed guard and removed importance restore the 100ms focus transition; focus-visible-only guard restores outgoing ring delay', scope: 'CSS cascade/interpolation model; fresh native rendering is unverified'};
}
module.exports = {verify};
if (require.main === module) {
 const directory = path.resolve(process.argv[2] || path.join(__dirname, '../skills/seenry/assets/components/transitions'));
 console.log(JSON.stringify(verify(fs.readFileSync(path.join(directory, 'seenry-transitions.css'), 'utf8'), fs.readFileSync(path.join(directory, 'gallery.html'), 'utf8')), null, 2));
}
