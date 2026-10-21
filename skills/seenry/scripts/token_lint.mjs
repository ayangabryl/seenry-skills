#!/usr/bin/env node
/** Token lint: every type size, space, radius and duration comes from the project's tokens, never a typed value.
 *  Blind judges and the rendered audit found Seenry pages using 15–26 font sizes and ten off-grid spacing values where
 *  studio sites use 5–11: values typed one at a time (15px here, 9px there) instead of picked from a scale.
 *
 *  node token_lint.mjs <file | dir> [--changed] [--json out.json]
 *    --changed  only files changed in git (working tree and untracked): for edits inside an existing project
 *  Flags, outside custom-property definitions: raw px/rem in font-size, padding, margin, gap and border-radius (em
 *  stays relative, pill radii of 100px+ are fine); raw ms/s in transition and animation; Tailwind arbitrary values such as text-[15px], p-[9px],
 *  rounded-[7px], duration-[350ms]. Exit 1 with findings in a project that has a scale (or with --strict); advisory otherwise. */
import {readFileSync, readdirSync, statSync, writeFileSync, existsSync} from 'node:fs';
import {join, extname, relative, resolve, dirname} from 'node:path';
import {execSync} from 'node:child_process';

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && ['--json'].includes(args[i - 1])));
if (!target || !existsSync(target)) { console.error('Usage: node token_lint.mjs <file | dir> [--changed] [--json out.json]'); process.exit(2); }
const EXT = new Set(['.css', '.scss', '.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.js', '.ts']);
const SKIP = /^(node_modules|dist|build|out|\.next|\.git|\.seenry|coverage|vendor|public)$/;
const root = statSync(target).isDirectory() ? resolve(target) : dirname(resolve(target));
let files = [];
const walk = p => { const st = statSync(p); if (st.isDirectory()) { for (const f of readdirSync(p)) if (!SKIP.test(f)) walk(join(p, f)); } else if (EXT.has(extname(p).toLowerCase()) && st.size < 1.5e6 && !/\.min\.|tokens?\.(css|scss)$|scene\.css$/.test(p)) files.push(p); };
walk(target);
if (args.includes('--changed')) {
  try {
    const top = execSync('git rev-parse --show-toplevel', {cwd: root, encoding: 'utf8'}).trim();
    const changed = new Set(execSync('git diff --name-only HEAD; git ls-files --others --exclude-standard', {cwd: top, encoding: 'utf8', shell: '/bin/sh'}).split('\n').filter(Boolean).map(f => resolve(top, f)));
    files = files.filter(f => changed.has(resolve(f)));
  } catch { console.error('--changed needs a git repository'); process.exit(2); }
}

const PROPS = /^(font-size|padding(-(top|right|bottom|left|inline|block)(-(start|end))?)?|margin(-(top|right|bottom|left|inline|block)(-(start|end))?)?|gap|row-gap|column-gap|border(-(top|bottom)-(left|right))?-radius|transition(-duration|-delay)?|animation(-duration|-delay)?)$/;
const TW = /(?<![\w-])((?:text|leading|tracking|p[trblxyse]?|m[trblxyse]?|gap(?:-[xy])?|space-[xy]|rounded(?:-[trblse]{1,2})?|duration|delay)-\[[^\]\s]*?\d(?:px|rem|em|ms|s)[^\]\s]*\])/g;
// Strip var(...) and calc(var(...) * n) so only typed numbers remain; keep 0 and 1px hairlines.
const raw = (prop, value) => {
  let v = value.replace(/!important/, '');
  for (let i = 0; i < 4; i++) v = v.replace(/var\([^()]*\)/g, ' ');
  v = v.replace(/calc\(\s*[\s*/+\-\d.()]*\)/g, ' ');
  const timing = /^(transition|animation)/.test(prop);
  const hits = [...v.matchAll(timing ? /(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g : /(?<![\w.-])(\d*\.?\d+)(px|rem)\b/g)].map(m => m[0]).filter(h => parseFloat(h) !== 0 && h !== '1px' && !(/radius/.test(prop) && parseFloat(h) >= 100));
  if (timing) return /\binfinite\b/.test(value) ? [] : hits;
  return hits;
};
const findings = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8'), ext = extname(file).toLowerCase();
  const lines = text.split('\n');
  const css = ['.css', '.scss'].includes(ext);
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    if (css || /<style|style=|styled\.|css`|\{[^}]*:/.test(line) || ['.html', '.htm', '.vue', '.svelte', '.astro'].includes(ext)) {
      for (const m of line.matchAll(/(?:^|[\s;{"'`])([a-z-]+)\s*:\s*([^;}"'`]+)/g)) {
        const [, prop, value] = m;
        if (prop.startsWith('--') || !PROPS.test(prop)) continue;
        if (/^(margin|padding)/.test(prop) && /\bauto\b/.test(value) && !/\d(px|rem)/.test(value)) continue;
        const hits = raw(prop, value);
        if (hits.length) findings.push({file: relative(root, file), line: i + 1, rule: prop, detail: `${prop}: ${value.trim().slice(0, 60)} (typed ${hits.join(', ')}; use a token)`});
      }
    }
    for (const m of line.matchAll(TW)) findings.push({file: relative(root, file), line: i + 1, rule: 'tailwind-arbitrary', detail: `${m[1]} (use the scale class or a theme token)`});
  });
}
// Blocking only where the project already has a scale (Tailwind, or size/space/radius/duration custom properties):
// in testing, forcing a legacy stylesheet onto tokens mid-task cost design quality. Elsewhere the lint advises.
const scaleFiles = files.length ? files : [];
const hasScale = args.includes('--strict') || existsSync(join(root, 'tailwind.config.js')) || existsSync(join(root, 'tailwind.config.ts')) || existsSync(join(root, 'tailwind.config.mjs'))
  || (existsSync(join(root, 'package.json')) && /tailwindcss/.test(readFileSync(join(root, 'package.json'), 'utf8')))
  || (() => { let n = 0; const walkAll = p => { for (const f of readdirSync(p)) { if (SKIP.test(f)) continue; const q = join(p, f), st = statSync(q); if (st.isDirectory()) walkAll(q); else if (/\.(css|scss)$/.test(f) && st.size < 1.5e6) n += (readFileSync(q, 'utf8').match(/--[\w-]*(space|size|text|font|radius|dur|gap|spacing)[\w-]*\s*:\s*[\d.]+(px|rem|ms|s)\b/g) || []).length; } }; walkAll(root); return n >= 4; })();
const byRule = findings.reduce((a, f) => (a[f.rule] = (a[f.rule] || 0) + 1, a), {});
if (flag('json')) writeFileSync(flag('json'), JSON.stringify({findings: findings.length, byRule, items: findings}, null, 2));
console.log(`token lint  ${files.length} file(s), ${findings.length} typed value(s)${findings.length ? '  ' + Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(' · ') : ''}`);
for (const f of findings.slice(0, 25)) console.log(`  ${f.file}:${f.line}  ${f.detail}`);
if (findings.length > 25) console.log(`  … ${findings.length - 25} more`);
if (findings.length) console.log('Define each value once in the token file (type scale, 4px space scale, radii, motion durations) and reference it with var(--…) or the framework\'s scale classes. Map near values to the nearest step (15→16, 9→8, 350ms→240ms) rather than adding steps. For plain CSS, `node token_convert.mjs <dir> --apply` does it in one pass.');
if (findings.length && !hasScale) console.log('Advisory: this project has no size or spacing tokens yet, so the lint does not block. Use token_convert.mjs when the owner wants the cleanup.');
process.exit(findings.length && hasScale ? 1 : 0);
