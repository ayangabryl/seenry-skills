#!/usr/bin/env node
/** Motion score: reads a built page or a source tree and scores its motion against rules a script can decide.
 *  Every finding prints the measured value and the allowed value. No browser and no model for the default run.
 *
 *  node motion_score.mjs <file | dir> [--json out.json] [--min 80] [--doc MOTION.md]
 *                        [--browser --playwright /abs/path/to/playwright/index.mjs]
 *
 *  Rules (error costs 12, warning costs 5, the score starts at 100):
 *    ease-in          error    an accelerating curve on anything except an exit state
 *    duration         error    longer than the limit for the element type (the limits are in LIMITS below);
 *                              a `linear` transition is progress and has no limit
 *    transition-all   error    `transition: all`, or a transition that names no property
 *    scale-zero       error    an entrance from scale(0)
 *    reduced-motion   error    the page moves and never reads prefers-reduced-motion
 *    motion-doc       error    MOTION.md fails ../../seenry/scripts/motion_doc.mjs (only when that script is installed)
 *    layout-property  warning  animating width, height, top, left, margin, padding and the like
 *    hover-ungated    warning  :hover moves or scales something outside @media (hover: hover)
 *    infinite-loops   warning  more than one infinite animation
 *    keyboard         warning  --browser only: a key press started a movement of 100ms or more
 *
 *  Exit 0: no errors and the score is at or above --min. Exit 1: otherwise. Exit 2: bad arguments.
 *  It complements ../../seenry/scripts/motion_scan.mjs, which lints values against the starter tokens;
 *  this script decides by element type and needs no token file.
 */
import {existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync} from 'node:fs';
import {dirname, extname, join, relative, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

/** Longest enter duration by element type, in ms. Outer bounds: the build values in SKILL.md sit inside them. */
export const LIMITS = {
  press: 200, tooltip: 200, menu: 250, dialog: 300, sheet: 500, toast: 400, tabs: 300, accordion: 300,
  toggle: 250, icon: 250, number: 600, reveal: 1200, ui: 300, scene: 1200,
};
const TYPES = [
  ['tooltip', /tooltip|\btip\b/i],
  ['toast', /toast|snackbar|sonner|notif/i],
  ['sheet', /sheet|drawer|offcanvas/i],
  ['dialog', /dialog|modal|backdrop|scrim|overlay|lightbox/i],
  ['menu', /menu|dropdown|popover|listbox|combobox|popup|select/i],
  ['tabs', /\btab|indicator|segment|\bpill\b/i],
  ['accordion', /accordion|collaps|details|disclosure|expand/i],
  ['toggle', /toggle|switch|checkbox|\bcheck\b|radio|thumb|knob/i],
  ['number', /price|amount|digit|odometer|counter|\bcount\b|numeral/i],
  ['icon', /icon|chevron|caret|arrow/i],
  ['reveal', /reveal|hero|stagger|fade-?(in|up)|rise|intro|entrance|appear/i],
  ['press', /:active|pressed/i],
];
const EXIT = /clos(e|ed|ing)\b|leav(e|ing)|exit|dismiss|hid(e|ing|den)|ending|\bout\b|:not\(\s*\[open\]|:not\(\s*:popover-open|data-state=["']?closed/i;
const LAYOUT = /^(width|height|min-width|min-height|max-width|max-height|block-size|inline-size|top|left|right|bottom|inset(-[\w-]+)?|margin(-[\w-]+)?|padding(-[\w-]+)?|gap|flex-basis|font-size|line-height|border-width)$/;
const ACCORDION_OK = /^(height|block-size|max-height|grid-template-rows)$/;
const MOVES = /^(transform|translate|scale|rotate|opacity|clip-path|filter|width|height|block-size|inline-size|max-height|top|left|right|bottom|grid-template-rows|margin(-[\w-]+)?|inset(-[\w-]+)?)$/;
const EXT = new Set(['.css', '.scss', '.html', '.htm', '.js', '.mjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro']);
const SKIP = /^(node_modules|dist|build|out|\.next|\.git|\.seenry|coverage|vendor|guidance)$/;
const COST = {error: 12, warning: 5};

export const elementType = (text) => { for (const [type, re] of TYPES) if (re.test(text)) return type; return 'ui'; };
const toMs = (n, unit) => Math.round(parseFloat(n) * (unit === 's' ? 1000 : 1));
const TIME = /^([+-]?\d*\.?\d+)(ms|s)$/;
const blank = (s) => s.replace(/[^\n]/g, ' ');
const lineAt = (text, index) => { let n = 1; for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++; return n; };

/** An accelerating curve: the keyword, or a cubic-bezier that leaves slowly and arrives fast. */
export function isEaseIn(value) {
  if (/(^|[\s,])ease-in(?!-)/.test(value)) return 'ease-in';
  for (const m of value.matchAll(/cubic-bezier\(([^)]+)\)/g)) {
    const [x1, y1, x2, y2] = m[1].split(',').map(Number);
    if ([x1, y1, x2, y2].every(Number.isFinite) && x1 >= 0.3 && y1 <= 0.1 && x2 >= 0.9 && y2 >= 0.9) return m[0].replace(/\s+/g, '');
  }
  return null;
}

const splitTop = (value, sep) => {
  const out = []; let depth = 0, cur = '';
  for (const ch of value) {
    if (ch === '(') depth++; else if (ch === ')') depth--;
    if (depth === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};
const EASING = /^(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|(cubic-bezier|linear|steps)\(.*\))$/;
const ANIM_WORDS = /^(none|infinite|normal|reverse|alternate|alternate-reverse|forwards|backwards|both|running|paused|allow-discrete|\d+)$/;

/** `transition` shorthand → [{property, duration, delay, easing}], one per comma-separated item. */
export function parseTransition(value) {
  return splitTop(value, ',').map((seg) => {
    const item = {property: null, duration: null, delay: null, easing: null};
    for (const token of splitTop(seg, ' ')) {
      const t = token.match(TIME);
      if (t) { if (item.duration == null) item.duration = toMs(t[1], t[2]); else item.delay = toMs(t[1], t[2]); }
      else if (EASING.test(token)) item.easing = token;
      else if (token === 'allow-discrete' || token === 'normal') continue;
      else if (item.property == null && /^[a-z-]+$/i.test(token)) item.property = token.toLowerCase();
    }
    if (item.property == null) item.property = 'all';
    return item;
  }).filter((i) => i.property !== 'none');
}

/** `animation` shorthand → [{name, duration, delay, easing, infinite}]. */
export function parseAnimation(value) {
  return splitTop(value, ',').map((seg) => {
    const item = {name: null, duration: null, delay: null, easing: null, infinite: false};
    for (const token of splitTop(seg, ' ')) {
      const t = token.match(TIME);
      if (t) { if (item.duration == null) item.duration = toMs(t[1], t[2]); else item.delay = toMs(t[1], t[2]); }
      else if (EASING.test(token)) item.easing = token;
      else if (token === 'infinite') item.infinite = true;
      else if (!ANIM_WORDS.test(token) && item.name == null && /^[\w-]+$/.test(token)) item.name = token;
    }
    return item;
  });
}

/** A small CSS reader: style rules with their at-rule ancestry, keyframes and custom properties. Handles nesting. */
export function parseCss(source, lineOffset = 0) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, blank);
  const rules = [], keyframes = {}, vars = {}, stack = [];
  let buf = '', bufStart = -1, quote = null;
  const top = () => stack[stack.length - 1];
  const flushDecl = (index) => {
    const text = buf.trim(); const start = bufStart; buf = ''; bufStart = -1;
    if (!text || !top() || text.startsWith('@')) return;
    const colon = text.indexOf(':'); if (colon < 1) return;
    const prop = text.slice(0, colon).trim().toLowerCase(), value = text.slice(colon + 1).trim().replace(/\s*!important$/i, '');
    const decl = {prop, value, line: lineOffset + lineAt(css, start < 0 ? index : start)};
    if (prop.startsWith('--')) vars[text.slice(0, colon).trim()] = value;
    top().decls.push(decl);
  };
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (quote) { buf += ch; if (ch === '\\') { buf += css[++i] ?? ''; } else if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; if (bufStart < 0) bufStart = i; buf += ch; continue; }
    if (ch === '{') {
      const prelude = buf.trim().replace(/\s+/g, ' '); const line = lineOffset + lineAt(css, bufStart < 0 ? i : bufStart); buf = ''; bufStart = -1;
      const parent = top();
      const node = {prelude, line, decls: [], at: parent ? [...parent.at] : [], selector: parent?.selector ?? '', kind: 'rule', frames: null};
      if (/^@(-webkit-)?keyframes\b/i.test(prelude)) { node.kind = 'keyframes'; node.name = prelude.split(/\s+/)[1]; keyframes[node.name] = {line, frames: []}; }
      else if (parent?.kind === 'keyframes') { node.kind = 'frame'; node.name = parent.name; }
      else if (prelude.startsWith('@')) { node.kind = parent?.kind === 'rule' && parent.selector ? 'rule' : 'at'; node.at.push(prelude); }
      else { node.selector = parent?.selector ? (prelude.includes('&') ? prelude.replace(/&/g, parent.selector) : `${parent.selector} ${prelude}`) : prelude; }
      stack.push(node);
    } else if (ch === '}') {
      flushDecl(i);
      const node = stack.pop(); if (!node) continue;
      if (node.kind === 'frame') keyframes[node.name]?.frames.push({key: node.prelude, decls: node.decls, line: node.line});
      else if (node.kind === 'rule' && node.selector && node.decls.length) rules.push({selector: node.selector, at: node.at, decls: node.decls, line: node.line});
      else if (node.kind === 'at' && node.decls.length) rules.push({selector: ':root', at: node.at, decls: node.decls, line: node.line});
    } else if (ch === ';') flushDecl(i);
    else { if (bufStart < 0 && !/\s/.test(ch)) bufStart = i; buf += ch; }
  }
  return {rules, keyframes, vars};
}

const resolveVars = (value, vars) => {
  let out = value;
  for (let depth = 0; depth < 6 && out.includes('var('); depth++) {
    out = out.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g, (_, name, fallback) => vars[name] ?? fallback ?? '');
  }
  return out;
};

/** Split a file into CSS chunks, script chunks and markup, each with the line it starts on. */
function chunks(file, text) {
  const ext = extname(file).toLowerCase(), out = {css: [], js: [], markup: ''};
  if (ext === '.css' || ext === '.scss') { out.css.push({text, line: 0}); return out; }
  if (['.html', '.htm', '.vue', '.svelte', '.astro'].includes(ext)) {
    for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) out.css.push({text: m[1], line: lineAt(text, m.index + m[0].indexOf(m[1])) - 1});
    for (const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) out.js.push({text: m[1], line: lineAt(text, m.index + m[0].indexOf(m[1])) - 1});
    for (const m of text.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)) out.css.push({text: `[style] {${m[1]}}`, line: lineAt(text, m.index) - 1});
    out.markup = text.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, blank);
    return out;
  }
  out.js.push({text, line: 0}); out.markup = text;
  for (const m of text.matchAll(/(?:css|styled(?:\.\w+|\([^)]*\))|createGlobalStyle|keyframes)`([\s\S]*?)`/g)) out.css.push({text: `.styled {${m[1]}}`, line: lineAt(text, m.index) - 1});
  return out;
}

function collect(target) {
  const files = [];
  const walk = (p) => {
    const st = statSync(p);
    if (st.isDirectory()) { for (const f of readdirSync(p)) if (!SKIP.test(f)) walk(join(p, f)); }
    else if (EXT.has(extname(p).toLowerCase()) && st.size < 1.5e6 && !/\.min\.(js|css)$/.test(p)) files.push(p);
  };
  walk(target);
  return files;
}

/** Score a file or a directory. Returns {score, errors, warnings, motion, findings, files}. */
export function scoreMotion(target) {
  const files = collect(target), root = statSync(target).isDirectory() ? resolve(target) : dirname(resolve(target));
  const findings = [], parsed = [], vars = {}, keyframes = {};
  let motion = false, reduced = false;
  const seen = new Set();
  const add = (level, rule, file, line, selector, measured, allowed, why) => {
    const key = [rule, file, line, selector, measured].join('|');
    if (seen.has(key)) return;
    seen.add(key); findings.push({rule, level, file: relative(root, file) || file, line, selector, measured, allowed, why});
  };

  for (const file of files) {
    const text = readFileSync(file, 'utf8'), parts = chunks(file, text);
    if (/prefers-reduced-motion|useReducedMotion|reducedMotion|motion-reduce:|motion-safe:/.test(text)) reduced = true;
    const sheets = parts.css.map((c) => parseCss(c.text, c.line));
    for (const s of sheets) { Object.assign(vars, s.vars); for (const [k, v] of Object.entries(s.keyframes)) keyframes[k] = {...v, file}; }
    parsed.push({file, text, parts, sheets});
  }

  const loops = new Map();
  for (const {file, parts, sheets} of parsed) {
    for (const sheet of sheets) for (const rule of sheet.rules) {
      const sel = rule.selector, type = elementType(sel), exit = EXIT.test(sel), reducedBlock = rule.at.some((a) => /prefers-reduced-motion:\s*reduce/.test(a));
      const hoverGated = rule.at.some((a) => /hover:\s*hover/.test(a));
      const get = (prop) => rule.decls.filter((d) => d.prop === prop).map((d) => ({...d, value: resolveVars(d.value, vars)}));
      const longDur = get('transition-duration')[0], longEase = get('transition-timing-function')[0], longProp = get('transition-property')[0];
      const items = [];
      for (const d of get('transition')) for (const item of parseTransition(d.value)) items.push({...item, line: d.line, kind: 'transition'});
      if (longProp && !items.length) for (const p of splitTop(longProp.value, ',')) items.push({property: p.toLowerCase(), duration: null, delay: null, easing: null, line: longProp.line, kind: 'transition'});
      if (longDur) { const times = splitTop(longDur.value, ',').map((t) => t.match(TIME)).filter(Boolean).map((t) => toMs(t[1], t[2])); if (!items.length && times.length) items.push({property: longProp ? null : 'unknown', duration: null, delay: null, easing: null, line: longDur.line, kind: 'transition'}); items.forEach((it, i) => { if (it.kind === 'transition' && times.length) it.duration = times[i % times.length]; }); }
      if (longEase) items.forEach((it) => { if (it.kind === 'transition') it.easing = longEase.value; });
      const anims = [];
      for (const d of get('animation')) for (const a of parseAnimation(d.value)) anims.push({...a, line: d.line});
      const aDur = get('animation-duration')[0], aEase = get('animation-timing-function')[0], aCount = get('animation-iteration-count')[0], aName = get('animation-name')[0];
      if (!anims.length && (aName || aDur)) anims.push({name: aName?.value ?? null, duration: null, delay: null, easing: null, infinite: false, line: (aName ?? aDur).line});
      if (aDur) { const t = aDur.value.match(TIME); if (t) anims.forEach((a) => { a.duration = toMs(t[1], t[2]); }); }
      if (aEase) anims.forEach((a) => { a.easing = aEase.value; });
      if (aCount && /infinite/.test(aCount.value)) anims.forEach((a) => { a.infinite = true; });
      const scrollDriven = rule.decls.some((d) => d.prop === 'animation-timeline');

      for (const it of items) {
        if (reducedBlock) continue;
        if (it.duration != null && it.duration > 20) motion = true;
        if (it.property === 'all') add('error', 'transition-all', file, it.line, sel, 'all', 'named properties (transform, opacity)', 'every changed property animates, layout included');
        else if (it.property && LAYOUT.test(it.property) && !(type === 'accordion' && ACCORDION_OK.test(it.property)) && it.duration !== 0) add('warning', 'layout-property', file, it.line, sel, it.property, 'transform, opacity, clip-path or filter', 'layout runs on every frame');
        if (it.duration != null && it.duration > LIMITS[type] && it.property !== 'display' && it.property !== 'overlay' && it.easing !== 'linear') add('error', 'duration', file, it.line, sel, `${it.duration}ms`, `at most ${LIMITS[type]}ms (${type})`, 'longer reads as slow');
        const slow = it.easing && isEaseIn(it.easing);
        if (slow && !exit) add('error', 'ease-in', file, it.line, sel, slow, 'cubic-bezier(0.16, 1, 0.3, 1)', 'it starts slowly, at the moment the person is watching');
      }
      for (const a of anims) {
        if (reducedBlock || !a.name && a.duration == null) continue;
        if (a.name === 'none') continue;
        motion = true;
        if (a.infinite) { if (!loops.has(a.name ?? sel)) loops.set(a.name ?? sel, {file, line: a.line, sel}); }
        else if (!scrollDriven && a.duration != null) { const limit = type === 'ui' ? LIMITS.scene : LIMITS[type]; if (a.duration > limit) add('error', 'duration', file, a.line, sel, `${a.duration}ms`, `at most ${limit}ms (${type === 'ui' ? 'scene' : type})`, 'longer reads as slow'); }
        const slow = a.easing && isEaseIn(a.easing);
        if (slow && !exit && !a.infinite) add('error', 'ease-in', file, a.line, sel, slow, 'cubic-bezier(0.16, 1, 0.3, 1)', 'it starts slowly, at the moment the person is watching');
      }
      for (const d of rule.decls) {
        const value = resolveVars(d.value, vars);
        if (reducedBlock) continue;
        if ((d.prop === 'transform' && /scale(3d)?\(\s*0(\.0+)?\s*([,)])/.test(value)) || (d.prop === 'scale' && /^0(\.0+)?(\s+0(\.0+)?)*$/.test(value.trim()))) add('error', 'scale-zero', file, d.line, sel, d.prop === 'scale' ? `scale: ${value}` : 'scale(0)', 'scale 0.96 with opacity 0', 'nothing appears from nothing');
      }
      if (/:hover/.test(sel) && !hoverGated && !reducedBlock) {
        const mover = rule.decls.find((d) => (d.prop === 'transform' && /(translate|scale|rotate)/.test(d.value) && !/^none$/.test(d.value)) || (['translate', 'scale', 'rotate'].includes(d.prop) && !/^(none|0|1)$/.test(d.value.trim())));
        if (mover) add('warning', 'hover-ungated', file, mover.line, sel, `${mover.prop}: ${mover.value}`, 'inside @media (hover: hover) and (pointer: fine)', 'touch fires hover on tap and the element stays moved');
      }
    }
    for (const sheet of sheets) for (const [name, kf] of Object.entries(sheet.keyframes)) for (const frame of kf.frames) for (const d of frame.decls) {
      if (LAYOUT.test(d.prop)) add('warning', 'layout-property', file, d.line, `@keyframes ${name}`, d.prop, 'transform, opacity, clip-path or filter', 'layout runs on every frame');
      if (/^(from|0%)/.test(frame.key) && ((d.prop === 'transform' && /scale(3d)?\(\s*0(\.0+)?\s*([,)])/.test(d.value)) || (d.prop === 'scale' && /^0(\.0+)?$/.test(d.value.trim())))) add('error', 'scale-zero', file, d.line, `@keyframes ${name}`, 'scale(0)', 'scale 0.96 with opacity 0', 'nothing appears from nothing');
    }

    // Markup classes (Tailwind) and script motion (Web Animations, Motion props, inline transition strings).
    const markup = parts.markup;
    for (const m of markup.matchAll(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
      const cls = m[1] ?? m[2] ?? m[3] ?? '', line = lineAt(markup, m.index), type = elementType(cls + ' ' + markup.slice(Math.max(0, m.index - 80), m.index));
      if (/(^|\s)transition-all(\s|$)/.test(cls)) { motion = true; add('error', 'transition-all', file, line, '(class)', 'transition-all', 'transition-transform, transition-opacity or transition-colors', 'every changed property animates, layout included'); }
      if (/(^|\s)ease-in(\s|$)/.test(cls) && !EXIT.test(cls)) add('error', 'ease-in', file, line, '(class)', 'ease-in', 'ease-out or a custom curve', 'it starts slowly, at the moment the person is watching');
      for (const d of cls.matchAll(/(?:^|\s)duration-(?:\[(\d*\.?\d+)(ms|s)\]|(\d+))(?=\s|$)/g)) { motion = true; const v = d[1] ? toMs(d[1], d[2]) : Number(d[3]); if (v > LIMITS[type]) add('error', 'duration', file, line, '(class)', `${v}ms`, `at most ${LIMITS[type]}ms (${type})`, 'longer reads as slow'); }
      if (/(^|\s)(transition|animate-)/.test(cls)) motion = true;
    }
    for (const chunk of parts.js) {
      const js = chunk.text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (s, p) => p + blank(s.slice(p.length)));
      const at = (i) => chunk.line + lineAt(js, i), near = (i) => js.slice(Math.max(0, i - 160), i + 160);
      for (const m of js.matchAll(/\.animate\s*\(/g)) {
        motion = true;
        const args = js.slice(m.index, m.index + 600), type = elementType(near(m.index));
        const dur = args.match(/duration\s*:\s*(\d*\.?\d+)/), ease = args.match(/easing\s*:\s*['"`]([^'"`]+)['"`]/), forever = /iterations\s*:\s*Infinity/.test(args);
        if (dur && !forever) { const limit = type === 'ui' ? LIMITS.scene : LIMITS[type]; if (Number(dur[1]) > limit) add('error', 'duration', file, at(m.index), '.animate()', `${Number(dur[1])}ms`, `at most ${limit}ms (${type === 'ui' ? 'scene' : type})`, 'longer reads as slow'); }
        if (ease && isEaseIn(ease[1]) && !EXIT.test(near(m.index))) add('error', 'ease-in', file, at(m.index), '.animate()', isEaseIn(ease[1]), 'cubic-bezier(0.16, 1, 0.3, 1)', 'it starts slowly, at the moment the person is watching');
        if (/scale\(\s*0\s*\)|scale\s*:\s*\[?\s*['"`]?0['"`]?\s*[,\]]/.test(args)) add('error', 'scale-zero', file, at(m.index), '.animate()', 'scale(0)', 'scale 0.96 with opacity 0', 'nothing appears from nothing');
        if (forever) { const key = `animate@${file}:${at(m.index)}`; loops.set(key, {file, line: at(m.index), sel: '.animate()'}); }
      }
      for (const m of js.matchAll(/\btransition\s*[:=]\s*(['"`])((?:(?!\1)[^\n])*\d(?:ms|s)\b(?:(?!\1)[^\n])*)\1/g)) {
        motion = true;
        const type = elementType(near(m.index));
        for (const it of parseTransition(resolveVars(m[2].replace(/\$\{[^}]*\}/g, '0ms'), vars))) {
          if (it.property === 'all') add('error', 'transition-all', file, at(m.index), '(script)', 'all', 'named properties (transform, opacity)', 'every changed property animates, layout included');
          else if (LAYOUT.test(it.property) && !(type === 'accordion' && ACCORDION_OK.test(it.property))) add('warning', 'layout-property', file, at(m.index), '(script)', it.property, 'transform, opacity, clip-path or filter', 'layout runs on every frame');
          if (it.duration != null && it.duration > LIMITS[type]) add('error', 'duration', file, at(m.index), '(script)', `${it.duration}ms`, `at most ${LIMITS[type]}ms (${type})`, 'longer reads as slow');
          if (it.easing && isEaseIn(it.easing) && !EXIT.test(near(m.index))) add('error', 'ease-in', file, at(m.index), '(script)', isEaseIn(it.easing), 'cubic-bezier(0.16, 1, 0.3, 1)', 'it starts slowly, at the moment the person is watching');
        }
      }
      for (const m of js.matchAll(/\bease\s*:\s*['"`](easeIn|circIn|backIn|anticipate)['"`]/g)) if (!EXIT.test(near(m.index))) add('error', 'ease-in', file, at(m.index), '(motion prop)', m[1], '[0.16, 1, 0.3, 1]', 'it starts slowly, at the moment the person is watching');
      for (const m of js.matchAll(/\binitial\s*=\s*\{\{([^}]*)\}\}/g)) { motion = true; if (/\bscale\s*:\s*0(?![.\d])/.test(m[1])) add('error', 'scale-zero', file, at(m.index), '(motion prop)', 'scale: 0', 'scale: 0.96 with opacity: 0', 'nothing appears from nothing'); }
      for (const m of js.matchAll(/\btransition\s*=\s*\{\{([^}]*)\}\}/g)) {
        motion = true;
        const dur = m[1].match(/\bduration\s*:\s*(\d*\.?\d+)/), type = elementType(near(m.index));
        if (dur && !/spring|repeat\s*:\s*Infinity/.test(m[1])) { const v = Math.round(Number(dur[1]) * 1000); if (v > LIMITS[type]) add('error', 'duration', file, at(m.index), '(motion prop)', `${v}ms`, `at most ${LIMITS[type]}ms (${type})`, 'longer reads as slow'); }
      }
    }
  }
  if (loops.size > 1) { const [first] = loops.values(); add('warning', 'infinite-loops', first.file, first.line, [...loops.keys()].slice(0, 4).join(', '), `${loops.size} infinite animations`, '1 at most', 'several things moving for ever compete for attention'); }
  if (motion && !reduced) add('error', 'reduced-motion', files[0] ?? target, 0, '(page)', '0 prefers-reduced-motion checks', '1 or more', 'people who ask for less motion get all of it');
  return finish(findings, {files: files.length, motion});
}

function finish(findings, extra) {
  const errors = findings.filter((f) => f.level === 'error').length, warnings = findings.filter((f) => f.level === 'warning').length;
  return {score: Math.max(0, 100 - errors * COST.error - warnings * COST.warning), errors, warnings, ...extra, findings};
}

/** Press a key on each keyboard-operable control of a built page and report movement of 100ms or more that it starts. */
export async function keyboardFindings(page, file) {
  const playwright = await import(pathToFileURL(resolve(playwrightPath())).href);
  const browser = await (playwright.chromium ?? playwright.default.chromium).launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
  const findings = [];
  try {
    const tab = await browser.newPage({viewport: {width: 1280, height: 800}});
    await tab.goto(/^https?:/.test(page) ? page : pathToFileURL(resolve(page)).href);
    await tab.waitForTimeout(1300);
    const count = await tab.evaluate(() => {
      const list = [...document.querySelectorAll('button, [role=tab], [role=switch], [role=menuitem], summary, input[type=checkbox], input[type=radio], [aria-haspopup]')].filter((el) => el.getClientRects().length && !el.disabled);
      list.slice(0, 10).forEach((el, i) => el.setAttribute('data-motion-probe', String(i)));
      return Math.min(list.length, 10);
    });
    for (let i = 0; i < count && findings.length < 3; i++) {
      const el = tab.locator(`[data-motion-probe="${i}"]`);
      if (!(await el.count()) || !(await el.isVisible().catch(() => false))) continue;
      const info = await el.evaluate((node) => ({role: node.getAttribute('role'), type: node.getAttribute('type'), label: (node.id ? '#' + node.id : node.tagName.toLowerCase() + (node.className && typeof node.className === 'string' ? '.' + node.className.trim().split(/\s+/)[0] : ''))}));
      await el.focus().catch(() => {});
      await tab.evaluate(() => { window.__before = new Set(document.getAnimations()); });
      const key = info.role === 'tab' ? 'ArrowRight' : info.type === 'checkbox' || info.type === 'radio' || info.role === 'switch' ? 'Space' : 'Enter';
      await tab.keyboard.press(key);
      await tab.waitForTimeout(40);
      const started = await tab.evaluate((moves) => {
        const re = new RegExp(moves);
        return document.getAnimations().filter((a) => !window.__before.has(a) && a.playState === 'running').map((a) => {
          const t = a.effect?.getComputedTiming?.() ?? {}, target = a.effect?.target;
          const props = a.transitionProperty ? [a.transitionProperty] : [...new Set((a.effect?.getKeyframes?.() ?? []).flatMap((k) => Object.keys(k)))].filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)).map((k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()));
          const name = target ? (target.id ? '#' + target.id : target.tagName.toLowerCase() + (typeof target.className === 'string' && target.className.trim() ? '.' + target.className.trim().split(/\s+/)[0] : '')) : '?';
          return {duration: Number(t.duration) || 0, infinite: t.iterations === Infinity, props, name};
        }).filter((a) => a.duration >= 100 && !a.infinite && a.props.some((p) => re.test(p)));
      }, MOVES.source);
      if (started.length) { const worst = started.sort((a, b) => b.duration - a.duration)[0]; findings.push({rule: 'keyboard', level: 'warning', file, line: 0, selector: `${key} on ${info.label} → ${worst.name}`, measured: `${Math.round(worst.duration)}ms (${worst.props.join(', ')})`, allowed: '0ms after a key press', why: 'keyboard actions are frequent and precise; a transition makes each one wait'}); }
      await tab.keyboard.press('Escape'); await tab.waitForTimeout(450);
    }
  } finally { await browser.close(); }
  return findings;
}

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : null; };
function playwrightPath() {
  const given = flag('playwright') || process.env.SEENRY_PLAYWRIGHT;
  if (!given) throw new Error('--browser needs --playwright /absolute/path/to/playwright/index.mjs (or SEENRY_PLAYWRIGHT)');
  return given;
}

const real = (p) => { try { return realpathSync(p); } catch { return resolve(p); } };
if (process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1])) {
  const VALUE_FLAGS = new Set(['--json', '--min', '--doc', '--playwright']);
  const target = argv.find((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(argv[i - 1]));
  if (!target || !existsSync(target)) { console.error('Usage: node motion_score.mjs <file | dir> [--json out.json] [--min 80] [--doc MOTION.md] [--browser --playwright <path>]'); process.exit(2); }
  const result = scoreMotion(target), min = Number(flag('min') ?? 80), notes = [];
  const isDir = statSync(target).isDirectory(), base = isDir ? resolve(target) : dirname(resolve(target));
  if (argv.includes('--browser')) {
    const page = isDir ? ['index.html', 'dist/index.html'].map((f) => join(base, f)).find(existsSync) : target;
    if (!page || !/\.html?$|^https?:/.test(page)) notes.push('keyboard probe skipped: pass a built .html page');
    else result.findings.push(...await keyboardFindings(page, relative(base, resolve(page)) || page));
  }
  const doc = flag('doc') || [join(base, 'MOTION.md')].find(existsSync);
  if (doc) {
    const gate = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'seenry', 'scripts', 'motion_doc.mjs');
    if (!existsSync(gate)) notes.push(`${relative(base, resolve(doc)) || doc} found but not validated: the seenry skill's motion_doc.mjs is not installed`);
    else { const {motionDocProblems} = await import(pathToFileURL(gate).href); for (const p of motionDocProblems(existsSync(doc) ? readFileSync(doc, 'utf8') : '')) result.findings.push({rule: 'motion-doc', level: 'error', file: relative(base, resolve(doc)) || doc, line: 0, selector: 'MOTION.md', measured: p, allowed: 'a reason and a reduced-motion state per row, one signature moment', why: 'a movement nobody can explain should not ship'}); }
  }
  const final = {...finish(result.findings, {files: result.files, motion: result.motion}), min, notes};
  if (flag('json')) writeFileSync(flag('json'), JSON.stringify(final, null, 2));
  console.log(`motion score ${final.score}/100  ${target}  (${final.errors} error(s), ${final.warnings} warning(s), ${final.files} file(s)${final.motion ? '' : ', no motion found'})`);
  for (const f of final.findings) console.log(`  ${f.file}${f.line ? ':' + f.line : ''}  ${f.rule}  ${f.selector}  ${f.measured} → ${f.allowed}`);
  for (const n of notes) console.log(`  note: ${n}`);
  process.exit(final.errors || final.score < min ? 1 : 0);
}
