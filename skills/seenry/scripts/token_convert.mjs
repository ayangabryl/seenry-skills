#!/usr/bin/env node
/** Token converter: turns a stylesheet of typed values into one token system in a single mechanical pass, so the
 *  design work goes to design. In testing, agents hand-converting a legacy plain-CSS app spent the session on it and
 *  the screen scored half a point lower; this does the conversion in under a second.
 *
 *  node token_convert.mjs <dir | file> [--changed] [--apply] [--tokens path/tokens.css]
 *  1. Reads every typed font-size, padding, margin, gap, radius and duration the token lint would flag.
 *  2. Builds the scale from the values the project already uses: type sizes within 8% merge into the more frequent
 *     one (at most nine steps); spacing snaps to the 4px scale; radii merge into at most three; durations snap to
 *     120/180/240ms (interface) or 600/900/1200ms (page). Existing custom properties with the same value are reused.
 *  3. Prints the mapping (15px → 16px …). With --apply, writes the token block (to --tokens, or the top of the main
 *     stylesheet) and rewrites the declarations to var(--…). Review the mapping before applying. */
import {readFileSync, writeFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join, extname, relative, resolve, dirname} from 'node:path';
import {execSync} from 'node:child_process';

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--tokens'));
if (!target || !existsSync(target)) { console.error('Usage: node token_convert.mjs <dir | file> [--changed] [--apply] [--tokens tokens.css]'); process.exit(2); }
const EXT = new Set(['.css', '.scss', '.html', '.htm', '.vue', '.svelte', '.astro']);
const SKIP = /^(node_modules|dist|build|out|\.next|\.git|\.seenry|coverage|vendor)$/;
const root = statSync(target).isDirectory() ? resolve(target) : dirname(resolve(target));
let files = [];
const walk = p => { const st = statSync(p); if (st.isDirectory()) { for (const f of readdirSync(p)) if (!SKIP.test(f)) walk(join(p, f)); } else if (EXT.has(extname(p).toLowerCase()) && !/\.min\.|scene\.css$/.test(p)) files.push(p); };
walk(target);
if (args.includes('--changed')) {
  const top = execSync('git rev-parse --show-toplevel', {cwd: root, encoding: 'utf8'}).trim();
  const changed = new Set(execSync('git diff --name-only HEAD; git ls-files --others --exclude-standard', {cwd: top, encoding: 'utf8', shell: '/bin/sh'}).split('\n').filter(Boolean).map(f => resolve(top, f)));
  files = files.filter(f => changed.has(resolve(f)));
}

const kindOf = prop => /^font-size$/.test(prop) ? 'type' : /radius$/.test(prop) ? 'radius' : /^(transition|animation)/.test(prop) ? 'time' : /^(padding|margin|gap|row-gap|column-gap)/.test(prop) ? 'space' : null;
const PROPS = /^(font-size|padding(-(top|right|bottom|left|inline|block)(-(start|end))?)?|margin(-(top|right|bottom|left|inline|block)(-(start|end))?)?|gap|row-gap|column-gap|border(-(top|bottom)-(left|right))?-radius|transition(-duration|-delay)?|animation(-duration|-delay)?)$/;
const DECL = /(^|[\s;{"'`])([a-z-]+)(\s*:\s*)([^;}"'`]+)/g;
const NUM = {len: /(-?)(\d*\.?\d+)(px|rem|em)\b/g, time: /(\d*\.?\d+)(ms|s)\b/g};
const toPx = (n, u) => u === 'px' ? +n : +n * 16;
const toMs = (n, u) => u === 's' ? Math.round(+n * 1000) : Math.round(+n);
// Mask var(...) so values already on tokens are left alone.
const masked = v => { let m = v; for (let i = 0; i < 4; i++) m = m.replace(/var\([^()]*\)/g, s => ' '.repeat(s.length)); return m; };

// Pass 1: collect values, and the project's existing custom properties.
const counts = {type: new Map(), space: new Map(), radius: new Map(), time: new Map()};
const existing = new Map();
const sources = files.map(f => ({f, text: readFileSync(f, 'utf8')}));
for (const {text} of sources) {
  for (const m of text.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) existing.set(m[2].trim(), m[1]);
  for (const m of text.matchAll(DECL)) {
    const [, , prop, , value] = m; if (!PROPS.test(prop)) continue;
    const k = kindOf(prop), v = masked(value);
    if (k === 'time') { if (/infinite/.test(value)) continue; for (const t of v.matchAll(NUM.time)) { const ms = toMs(t[1], t[2]); if (ms) counts.time.set(ms, (counts.time.get(ms) || 0) + 1); } }
    else for (const t of v.matchAll(NUM.len)) { if (/em$/.test(t[0]) && !/rem$/.test(t[0])) continue; const px = Math.round(toPx(t[2], t[3]) * 2) / 2; if (px && !(px === 1 && k !== 'type')) counts[k].set(px, (counts[k].get(px) || 0) + 1); }
  }
}

// Scales.
const SPACE = [2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128, 160, 192, 256];
const nearest = (v, set) => set.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
const merge = (map, ratio, max) => {
  // Most frequent values win; a value within `ratio` of a kept one joins it.
  const kept = [];
  for (const [v] of [...map].sort((a, b) => b[1] - a[1] || a[0] - b[0])) if (!kept.some(k => Math.max(k, v) / Math.min(k, v) <= ratio)) kept.push(v);
  let steps = kept.slice(0, max).sort((a, b) => a - b);
  return {steps, map: new Map([...map.keys()].map(v => [v, nearest(v, steps)]))};
};
const type = merge(counts.type, 1.08, 9);
type.steps = type.steps.map(v => Math.round(v)); type.map = new Map([...type.map].map(([k, v]) => [k, Math.round(v)]));
const radius = merge(new Map([...counts.radius].filter(([v]) => v < 100)), 1.4, 3);
const spaceMap = new Map([...counts.space.keys()].map(v => [v, nearest(Math.abs(v), SPACE)]));
const timeMap = new Map([...counts.time.keys()].map(v => [v, v <= 300 ? nearest(v, [120, 180, 240]) : nearest(v, [600, 900, 1200])]));
const fmt = n => String(n).replace('.', '-');
const name = {
  type: v => existing.get(`${v}px`) || `--text-${fmt(v)}`,
  space: v => existing.get(`${v}px`) || `--space-${fmt(v / 4)}`,
  radius: v => existing.get(`${v}px`) || `--radius-${['sm', 'md', 'lg'][radius.steps.indexOf(v)] || fmt(v)}`,
  time: v => ({120: '--dur-1', 180: '--dur-2', 240: '--dur-3', 600: '--dur-scene-1', 900: '--dur-scene-2', 1200: '--dur-scene-3'})[v],
};
const used = new Map();
const tok = (k, v) => { const n = name[k](v); if (!existing.has(`${v}${k === 'time' ? 'ms' : 'px'}`)) used.set(n, `${v}${k === 'time' ? 'ms' : 'px'}`); return `var(${n})`; };

// Pass 2: rewrite.
let changes = 0;
for (const s of sources) {
  s.out = s.text.replace(DECL, (all, pre, prop, colon, value) => {
    if (prop.startsWith('--') || !PROPS.test(prop)) return all;
    const k = kindOf(prop), mask = masked(value);
    let out = '', last = 0;
    const re = k === 'time' ? new RegExp(NUM.time.source, 'g') : new RegExp(NUM.len.source, 'g');
    if (k === 'time' && /infinite/.test(value)) return all;
    for (const t of mask.matchAll(re)) {
      let rep;
      if (k === 'time') { const ms = toMs(t[1], t[2]); if (!ms) continue; rep = tok('time', timeMap.get(ms)); }
      else {
        if (/em$/.test(t[0]) && !/rem$/.test(t[0])) continue;
        const px = Math.round(toPx(t[2], t[3]) * 2) / 2; if (!px || (px === 1 && k !== 'type')) continue;
        const v = k === 'type' ? type.map.get(px) : k === 'radius' ? (px >= 100 ? null : radius.map.get(px)) : spaceMap.get(px);
        if (v == null) continue;
        rep = tok(k, v); if (t[1] === '-') rep = `calc(${rep} * -1)`;
      }
      out += value.slice(last, t.index) + rep; last = t.index + t[0].length; changes++;
    }
    return last ? pre + prop + colon + out + value.slice(last) : all;
  });
}

const report = (label, map, unit) => { const moved = [...map].filter(([a, b]) => a !== b).sort((a, b) => a[0] - b[0]); return `${label}: ${[...new Set(map.values())].sort((a, b) => a - b).join(' ')}${unit}${moved.length ? `  (snapped ${moved.map(([a, b]) => `${a}→${b}`).join(', ')})` : ''}`; };
console.log(`token convert  ${files.length} file(s), ${changes} value(s) to tokens`);
console.log('  ' + report('type', type.map, 'px'));
console.log('  ' + report('space', spaceMap, 'px'));
console.log('  ' + report('radius', radius.map, 'px'));
console.log('  ' + report('motion', timeMap, 'ms'));
const order = n => { const v = parseFloat(used.get(n)); return (n.startsWith('--text') ? 0 : n.startsWith('--space') ? 1e4 : n.startsWith('--radius') ? 2e4 : 3e4) + v; };
const block = `:root {\n${[...used].sort((a, b) => order(a[0]) - order(b[0])).map(([n, v]) => `  ${n}: ${v};`).join('\n')}\n}\n`;
if (!args.includes('--apply')) { console.log('\nDry run. Token block that --apply writes:\n' + block); process.exit(0); }
for (const s of sources) if (s.out !== s.text) writeFileSync(s.f, s.out);
const tokensPath = flag('tokens');
if (tokensPath) {
  writeFileSync(resolve(tokensPath), (existsSync(resolve(tokensPath)) ? readFileSync(resolve(tokensPath), 'utf8') + '\n' : '') + block);
  console.log(`\nWrote ${used.size} tokens to ${tokensPath}; link it before the other stylesheets.`);
} else {
  const main = sources.filter(s => /\.(css|scss)$/.test(s.f)).sort((a, b) => b.text.length - a.text.length)[0];
  if (main) { writeFileSync(main.f, block + '\n' + readFileSync(main.f, 'utf8')); console.log(`\nWrote ${used.size} tokens to the top of ${relative(root, main.f)}.`); }
  else console.log(`\nNo stylesheet to hold the tokens; pass --tokens <file> and link it:\n${block}`);
}
