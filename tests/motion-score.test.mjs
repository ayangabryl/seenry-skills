import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {scoreMotion, parseCss, parseTransition, parseAnimation, isEaseIn, elementType, LIMITS} from '../skills/seenry-motion/scripts/motion_score.mjs';

const script = resolve('skills/seenry-motion/scripts/motion_score.mjs');
const fixture = (name) => resolve('tests/fixtures/motion-score', name);
const rules = (result, level) => [...new Set(result.findings.filter((f) => !level || f.level === level).map((f) => f.rule))].sort();
const scoreCss = (css, name = 'a.css') => { const dir = mkdtempSync(join(tmpdir(), 'motion-score-')); writeFileSync(join(dir, name), css); return scoreMotion(dir); };

test('the bad fixture trips every static rule, each with a measured and an allowed value', () => {
  const result = scoreMotion(fixture('bad.html'));
  assert.deepEqual(rules(result, 'error'), ['duration', 'ease-in', 'reduced-motion', 'scale-zero', 'transition-all']);
  assert.deepEqual(rules(result, 'warning'), ['hover-ungated', 'infinite-loops', 'layout-property']);
  assert.equal(result.score, 0);
  for (const f of result.findings) assert.ok(f.measured && f.allowed, `${f.rule} needs both values`);
  const menu = result.findings.find((f) => f.rule === 'duration' && f.selector === '.dropdown');
  assert.equal(menu.measured, '600ms');
  assert.equal(menu.allowed, `at most ${LIMITS.menu}ms (menu)`);
  assert.equal(result.findings.find((f) => f.rule === 'infinite-loops').measured, '2 infinite animations');
});

test('the good fixture, built from the recipes, has no findings', () => {
  const result = scoreMotion(fixture('good.html'));
  assert.deepEqual(result.findings, []);
  assert.equal(result.score, 100);
  assert.equal(result.motion, true);
});

test('the command line prints measured → allowed and exits 1 on errors, 0 when clean', () => {
  const bad = spawnSync('node', [script, fixture('bad.html')], {encoding: 'utf8'});
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /motion score 0\/100/);
  assert.match(bad.stdout, /bad\.html:9 {2}duration {2}\.dropdown {2}600ms → at most 250ms \(menu\)/);
  const good = spawnSync('node', [script, fixture('good.html')], {encoding: 'utf8'});
  assert.equal(good.status, 0);
  assert.match(good.stdout, /motion score 100\/100/);
  assert.equal(spawnSync('node', [script], {encoding: 'utf8'}).status, 2);
});

test('the recipes this skill ships pass its own score', () => {
  for (const name of ['recipes.md', 'recipes-state.md']) {
    const md = readFileSync(resolve('skills/seenry-motion/references', name), 'utf8'), dir = mkdtempSync(join(tmpdir(), 'motion-recipes-'));
    writeFileSync(join(dir, 'recipes.css'), [...md.matchAll(/```css\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n'));
    writeFileSync(join(dir, 'recipes.js'), [...md.matchAll(/```js\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n'));
    const result = scoreMotion(dir);
    assert.equal(result.errors, 0, `${name}: ${JSON.stringify(result.findings.filter((f) => f.level === 'error'))}`);
    // Two recipes (skeleton, thinking) each own a loop; a page uses one of them.
    assert.deepEqual(rules(result, 'warning').filter((r) => r !== 'infinite-loops'), [], name);
  }
});

test('limits depend on the element type named by the selector', () => {
  assert.equal(elementType('.account-menu[popover]'), 'menu');
  assert.equal(elementType('dialog.sheet'), 'sheet');
  assert.equal(elementType('.tabs-indicator'), 'tabs');
  assert.equal(elementType('.card'), 'ui');
  const reduced = '@media (prefers-reduced-motion: reduce) { * { transition: none; } }';
  assert.deepEqual(rules(scoreCss(`.sheet { transition: translate 450ms cubic-bezier(0.32, 0.72, 0, 1); } ${reduced}`)), []);
  const menu = scoreCss(`.menu { transition: opacity 450ms ease-out; } ${reduced}`);
  assert.equal(menu.findings[0].measured, '450ms');
  assert.match(menu.findings[0].allowed, /250ms \(menu\)/);
  assert.deepEqual(rules(scoreCss(`.hero-title { animation: rise 900ms ease-out both; } ${reduced}`)), []);
  assert.deepEqual(rules(scoreCss(`.card { transition: opacity 320ms ease-out; } ${reduced}`)), ['duration']);
});

test('durations and curves behind custom properties are resolved', () => {
  const result = scoreCss(':root { --slow: 0.7s; --curve: cubic-bezier(0.4, 0, 1, 1); } .dropdown { transition: opacity var(--slow) var(--curve); } @media (prefers-reduced-motion: reduce) { .dropdown { transition: none; } }');
  assert.deepEqual(rules(result), ['duration', 'ease-in']);
  assert.equal(result.findings.find((f) => f.rule === 'duration').measured, '700ms');
});

test('an accelerating curve is tolerated on an exit state only, and linear progress has no limit', () => {
  assert.equal(isEaseIn('ease-in'), 'ease-in');
  assert.equal(isEaseIn('ease-in-out'), null);
  assert.equal(isEaseIn('cubic-bezier(0.16, 1, 0.3, 1)'), null);
  const reduced = '@media (prefers-reduced-motion: reduce) { * { transition: none; } }';
  assert.deepEqual(rules(scoreCss(`.menu.is-closing { transition: opacity 100ms cubic-bezier(0.4, 0, 1, 1); } ${reduced}`)), []);
  assert.deepEqual(rules(scoreCss(`.hold:active .fill { transition: clip-path 1500ms linear; } ${reduced}`)), []);
});

test('a transition that names no property counts as all; accordion height is allowed; scaleX(0) is not an entrance from nothing', () => {
  const reduced = '@media (prefers-reduced-motion: reduce) { * { transition: none; } }';
  assert.deepEqual(rules(scoreCss(`.card { transition: 200ms ease-out; } ${reduced}`)), ['transition-all']);
  assert.deepEqual(rules(scoreCss(`.accordion-panel { transition: height 240ms ease-out; } ${reduced}`)), []);
  assert.deepEqual(rules(scoreCss(`.card { transition: height 240ms ease-out; } ${reduced}`)), ['layout-property']);
  assert.deepEqual(rules(scoreCss(`.underline { transform: scaleX(0); transition: transform 180ms ease-out; } ${reduced}`)), []);
  assert.deepEqual(rules(scoreCss(`.pop { scale: 0; transition: scale 180ms ease-out; } ${reduced}`)), ['scale-zero']);
});

test('hover motion is fine inside (hover: hover) and a tint is fine anywhere', () => {
  const reduced = '@media (prefers-reduced-motion: reduce) { * { transition: none; } }';
  assert.deepEqual(rules(scoreCss(`.card:hover { background: #eee; } ${reduced}`)), []);
  assert.deepEqual(rules(scoreCss(`@media (hover: hover) and (pointer: fine) { .card:hover { translate: 0 -2px; } } ${reduced}`)), []);
  assert.deepEqual(rules(scoreCss(`.card { transition: translate 160ms ease-out; } .card:hover { translate: 0 -2px; } ${reduced}`)), ['hover-ungated']);
});

test('nested rules, starting-style and keyframes are read', () => {
  const sheet = parseCss('.toast { opacity: 1; @starting-style { opacity: 0; } &:hover { color: red; } }\n@keyframes spin { to { rotate: 1turn; } }');
  assert.deepEqual(sheet.rules.map((r) => r.selector).sort(), ['.toast', '.toast', '.toast:hover']);
  assert.ok(sheet.rules.some((r) => r.at.includes('@starting-style')));
  assert.equal(sheet.keyframes.spin.frames[0].decls[0].prop, 'rotate');
  assert.deepEqual(parseTransition('opacity 180ms cubic-bezier(0.16, 1, 0.3, 1) 40ms, display 180ms allow-discrete').map((t) => [t.property, t.duration, t.delay]), [['opacity', 180, 40], ['display', 180, null]]);
  assert.deepEqual(parseAnimation('pulse 1.2s linear infinite alternate')[0], {name: 'pulse', duration: 1200, delay: null, easing: 'linear', infinite: true});
});

test('Tailwind classes and Motion props are scored in component source', () => {
  const dir = mkdtempSync(join(tmpdir(), 'motion-jsx-'));
  writeFileSync(join(dir, 'Menu.jsx'), 'export const Menu = () => (\n  <motion.div className="dropdown transition-all duration-700 ease-in" initial={{ opacity: 0, scale: 0 }} transition={{ duration: 0.6, ease: "easeIn" }} />\n);\n');
  const result = scoreMotion(dir);
  assert.deepEqual(rules(result), ['duration', 'ease-in', 'reduced-motion', 'scale-zero', 'transition-all']);
  writeFileSync(join(dir, 'Menu.jsx'), 'export const Menu = () => {\n  const reduce = useReducedMotion();\n  return <motion.div className="dropdown" initial={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }} />;\n};\n');
  assert.deepEqual(scoreMotion(dir).findings, []);
});

test('a page with no motion scores 100 and says so', () => {
  const result = scoreCss('.card { color: red; }');
  assert.equal(result.score, 100);
  assert.equal(result.motion, false);
});
