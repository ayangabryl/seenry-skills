#!/usr/bin/env node
/** Static motion scan: reads a project's source (CSS, HTML, JS/TS, JSX/TSX, Vue, Svelte, Tailwind classes) and checks
 *  every duration, delay, easing and animated property against the Seenry motion tokens, without a browser or a model.
 *  It runs in well under a second, so it can run on every round; the browser motion judge still certifies the result.
 *
 *  node motion_scan.mjs <file | dir> [--json out.json]
 *  Exit 0: no violations (warnings may remain). Exit 1: violations to fix.
 */
import {readFileSync, readdirSync, statSync, writeFileSync, existsSync} from 'node:fs';
import {join, extname, relative, dirname, resolve} from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!target || !existsSync(target)) { console.error('Usage: node motion_scan.mjs <file | dir> [--json out.json]'); process.exit(2); }

const DURATIONS = [0, 80, 120, 140, 160, 180, 240, 280];
const DELAYS = [0, 40, 60, 80];
const CURVES = {E: [.16, 1, .3, 1], M: [.4, 0, .2, 1], F: [.2, 0, .2, 1], X: [.4, 0, 1, 1]};
const LAYOUT = /^(width|height|top|left|right|bottom|margin(-\w+)?|padding(-\w+)?|inset|max-height|min-height)$/;
const EXT = new Set(['.css', '.scss', '.html', '.htm', '.js', '.mjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro']);
const SKIP = /^(node_modules|dist|build|out|\.next|\.git|\.seenry|coverage|vendor)$/;

const files = [];
const walk = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) { for (const f of readdirSync(p)) if (!SKIP.test(f)) walk(join(p, f)); }
  else if (EXT.has(extname(p).toLowerCase()) && st.size < 1.5e6 && !/\.min\.(js|css)$/.test(p)) files.push(p);
};
walk(target);
const root = statSync(target).isDirectory() ? resolve(target) : dirname(resolve(target));

const findings = [];
const add = (level, file, line, rule, detail) => findings.push({level, file: relative(root, file), line, rule, detail});
const ms = (v, unit) => unit === 's' ? Math.round(parseFloat(v) * 1000) : Math.round(parseFloat(v));
const nearest = (v, set) => set.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
const curveName = (pts) => {
  let best = null, dist = Infinity;
  for (const [k, c] of Object.entries(CURVES)) { const d = c.reduce((s, x, i) => s + Math.abs(x - pts[i]), 0); if (d < dist) { dist = d; best = k; } }
  return {best, dist};
};

let motionSeen = false, reducedMotion = false;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (/prefers-reduced-motion|motion-reduce:|motion-safe:|useReducedMotion|reducedMotion|matchMedia\(\s*['"]\(prefers-reduced-motion/.test(text)) reducedMotion = true;
  const lines = text.split('\n');
  lines.forEach((raw, idx) => {
    const line = idx + 1, l = raw.trim();
    if (!l || l.startsWith('//') || l.startsWith('*')) return;
    const infinite = /infinite|spin|loader|loading|shimmer|pulse|skeleton|marquee/i.test(l);
    // CSS transitions and animations, including longhands.
    for (const m of l.matchAll(/(?:^|[\s;{"'`])(transition|animation)(-duration|-delay|-timing-function|-property)?\s*:\s*([^;}"'`]+)/g)) {
      motionSeen = true;
      const [, kind, part = '', value] = m;
      if ((kind === 'transition' && !part && /(^|[\s,])all([\s,]|$)/.test(value)) || (part === '-property' && /\ball\b/.test(value))) add('violation', file, line, 'transition-all', `"${value.trim()}" animates every property; list the properties you mean (usually transform, opacity)`);
      if (kind === 'transition' && (part === '' || part === '-property')) {
        for (const prop of value.split(',').map(s => s.trim().split(/\s+/)[0])) if (LAYOUT.test(prop)) add('warn', file, line, 'layout-property', `transitions ${prop}; prefer transform/opacity, grid-template-rows or interpolate-size so layout does not reflow every frame`);
      }
      // Split a list of transitions at top-level commas so each one gets its own duration and delay.
      const segments = []; let depth = 0, cur = '';
      for (const ch of value) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { segments.push(cur); cur = ''; } else cur += ch; }
      segments.push(cur);
      for (const seg of part === '-property' ? [] : segments) {
        const times = [...seg.matchAll(/(-?\d*\.?\d+)(ms|s)\b/g)].map(t => ms(t[1], t[2]));
        if (!times.length) continue;
        const isDelay = part === '-delay';
        const [duration, delay] = isDelay ? [null, times[0]] : [times[0], times[1]];
        if (duration != null && !(kind === 'animation' && infinite)) {
          if (duration > 800) add('violation', file, line, 'too-long', `${duration}ms; interface motion stays at or under 280ms, a rare decorative moment under 800ms`);
          else if (duration > 280) add('warn', file, line, 'long', `${duration}ms is above the 280ms spatial token; keep it only if the distance or meaning needs it`);
          else if (!DURATIONS.some(t => Math.abs(t - duration) <= 5)) add('warn', file, line, 'off-token-duration', `${duration}ms; nearest token ${nearest(duration, DURATIONS)}ms`);
        }
        if (delay != null && delay > 0 && !DELAYS.some(t => Math.abs(t - delay) <= 5)) add('warn', file, line, 'off-token-delay', `delay ${delay}ms; delays are 0, 40, 60 or 80ms`);
      }
      if (!infinite && /(^|[\s,])linear([\s,]|$)/.test(value) && !/linear\(/.test(value)) add('warn', file, line, 'linear-easing', 'linear easing on interface motion reads mechanical; use E, M, F or X (or a linear() spring)');
      if (/(^|[\s,])(ease|ease-in-out|ease-in)([\s,;]|$)/.test(value)) add('warn', file, line, 'default-easing', `browser default easing in "${value.trim()}"; use a token curve (E enter, M move, F fade, X leave)`);
      for (const c of value.matchAll(/cubic-bezier\(([^)]+)\)/g)) {
        const pts = c[1].split(',').map(Number);
        if (pts.length === 4 && pts.every(Number.isFinite)) { const {best, dist} = curveName(pts); if (dist > .12) add('warn', file, line, 'off-token-curve', `cubic-bezier(${c[1]}) is not a token curve; closest is ${best} (${CURVES[best].join(', ')})`); }
      }
    }
    // Stagger built from an index variable.
    for (const m of l.matchAll(/calc\(\s*var\(--[\w-]+\)\s*\*\s*(\d*\.?\d+)(ms|s)\s*\)/g)) {
      const step = ms(m[1], m[2]);
      if (step > 20) add('warn', file, line, 'stagger', `stagger step ${step}ms; use about 20ms and cap the whole group at 60ms`);
    }
    // Tailwind classes.
    for (const m of l.matchAll(/\b(duration|delay)-(\[(\d*\.?\d+)(ms|s)\]|(\d+))(?![\w-])/g)) {
      if (/[{};:]/.test(l) && !/class(Name)?=|cn\(|clsx\(|tw`/.test(l)) continue;
      motionSeen = true;
      const v = m[3] ? ms(m[3], m[4]) : Number(m[5]);
      if (m[1] === 'duration') {
        if (v > 800) add('violation', file, line, 'too-long', `${m[0]}; keep interface motion at or under 280ms`);
        else if (v > 280) add('warn', file, line, 'long', `${m[0]} is above the 280ms spatial token`);
        else if (!DURATIONS.some(t => Math.abs(t - v) <= 5)) add('warn', file, line, 'off-token-duration', `${m[0]}; nearest token ${nearest(v, DURATIONS)}ms (duration-[${nearest(v, DURATIONS)}ms])`);
      } else if (v > 0 && !DELAYS.some(t => Math.abs(t - v) <= 5)) add('warn', file, line, 'off-token-delay', `${m[0]}; delays are 0, 40, 60 or 80ms`);
    }
    if (/\btransition-all\b/.test(l) && /class(Name)?=|cn\(|clsx\(/.test(l)) { motionSeen = true; add('violation', file, line, 'transition-all', 'Tailwind transition-all animates every property; use transition-transform, transition-opacity or transition-colors'); }
    // JS: Web Animations API and motion libraries (seconds in Framer/Motion).
    const scriptFile = /\.(m?js|jsx|tsx?|vue|svelte|astro)$/.test(file);
    for (const m of l.matchAll(/(?<![-\w])duration\s*:\s*(\d*\.?\d+)(?!\s*(ms|s)\b)/g)) {
      if (!scriptFile || !/animate\(|transition|motion|spring|gsap|anime/i.test(l)) continue;
      motionSeen = true;
      const n = parseFloat(m[1]), v = n < 10 ? Math.round(n * 1000) : Math.round(n);
      if (/repeat\s*:\s*Infinity|iterations\s*:\s*Infinity/.test(l)) continue;
      if (v > 800) add('violation', file, line, 'too-long', `duration ${v}ms in script`);
      else if (v > 280) add('warn', file, line, 'long', `duration ${v}ms in script is above the 280ms spatial token`);
      else if (!DURATIONS.some(t => Math.abs(t - v) <= 5)) add('warn', file, line, 'off-token-duration', `duration ${v}ms in script; nearest token ${nearest(v, DURATIONS)}ms`);
    }
    if (/\.animate\(|@keyframes|motion\.|useSpring|gsap\./.test(l)) motionSeen = true;
  });
}
if (motionSeen && !reducedMotion) add('violation', root, 0, 'reduced-motion', 'the project animates but never checks prefers-reduced-motion; add a reduced-motion branch that keeps state changes and drops travel');

const violations = findings.filter(f => f.level === 'violation'), warnings = findings.filter(f => f.level === 'warn');
const result = {files: files.length, motionSeen, reducedMotion, violations: violations.length, warnings: warnings.length, findings};
if (flag('json')) writeFileSync(flag('json'), JSON.stringify(result, null, 2));
const show = (f) => `  ${f.file || '(project)'}${f.line ? ':' + f.line : ''}  ${f.rule}  ${f.detail}`;
console.log(`motion scan  ${files.length} file(s), ${violations.length} violation(s), ${warnings.length} warning(s)${motionSeen ? '' : ', no motion found'}`);
for (const f of violations) console.log(show(f));
for (const f of warnings.slice(0, 25)) console.log(show(f));
if (warnings.length > 25) console.log(`  … ${warnings.length - 25} more warning(s) in the JSON report`);
process.exit(violations.length ? 1 : 0);
