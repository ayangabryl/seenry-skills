#!/usr/bin/env node
// Mechanical slop count for app UI source (web prototypes, React Native, CSS, SwiftUI, Compose, Flutter). Counts, not taste.
// node app_preflight.mjs <file or dir>... [--json]   exits 1 when any check fails
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, extname} from 'node:path';

const args = process.argv.slice(2), json = args.includes('--json'), roots = args.filter(a => a !== '--json');
if (!roots.length) { console.error('usage: app_preflight.mjs <file or dir>... [--json]'); process.exit(2); }
const EXT = new Set(['.html', '.htm', '.css', '.scss', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue', '.svelte', '.swift', '.kt', '.dart']);
const SKIP = /node_modules|\.git|dist|build|\.next|\.expo|research|\.seenry/;
const files = [];
const walk = p => { const s = statSync(p); if (s.isDirectory()) { if (!SKIP.test(p)) for (const f of readdirSync(p)) walk(join(p, f)); } else if (EXT.has(extname(p))) files.push(p); };
roots.forEach(walk);
const src = files.map(f => [f, readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')]);
const all = src.map(([, s]) => s).join('\n');

const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, s, l]; };
const colors = [];
for (const m of all.matchAll(/#([0-9a-f]{3}|[0-9a-f]{6})\b/gi)) { let h = m[1]; if (h.length === 3) h = [...h].map(c => c + c).join(''); colors.push(hsl(...[0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)))); }
for (const m of all.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/gi)) colors.push(hsl(+m[1], +m[2], +m[3]));
const status = h => h < 15 || h >= 345 || (h >= 90 && h < 165) || (h >= 30 && h < 55);
const fam = h => Math.round(h / 30) % 12;
const chroma = colors.filter(([, s, l]) => s > .35 && l > .18 && l < .85);
const byFam = {}; for (const [h] of chroma.filter(([h]) => !status(h))) byFam[fam(h)] = (byFam[fam(h)] || 0) + 1;
const names = ['red', 'orange', 'amber', 'yellow-green', 'green', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'pink'];
const accentFams = Object.entries(byFam).filter(([, n]) => n >= 2).map(([f, n]) => `${names[f]} ×${n}`);
const greys = colors.filter(([, s, l]) => s > .04 && s <= .2 && l > .04 && l < .96);
const warm = greys.filter(([h]) => h >= 15 && h < 75).length, cool = greys.filter(([h]) => h >= 180 && h < 270).length;

const radii = new Set();
for (const m of all.matchAll(/border(?:-[a-z-]+)?-radius\s*:\s*([^;}"']+)/gi)) for (const v of m[1].match(/[\d.]+px/g) || []) radii.add(parseFloat(v));
for (const m of all.matchAll(/borderRadius\s*:\s*([\d.]+)/g)) radii.add(+m[1]);
const scale = [...radii].filter(r => r > 4 && r < 40).sort((a, b) => a - b);

const visible = src.filter(([f]) => /\.(html?|jsx|tsx|vue|svelte)$/.test(f)).map(([, s]) => s.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, m => m.replace(/\/\/[^\n]*/g, ''))).join('\n');
const emoji = [...visible.matchAll(/\p{Extended_Pictographic}/gu)].map(m => m[0]).filter(e => !/[©®™↩↪⏱⌚]/.test(e));
const gradients = (all.match(/(linear|radial|conic)-gradient\(/g) || []).length + (all.match(/<LinearGradient\b/g) || []).length;
const mojibake = (all.match(/Ã.|â€|Â[·°©®\s]/g) || []).length;
const fonts = new Set([...all.matchAll(/(?:font-family|--[\w-]*(?:font|-f-)[\w-]*)\s*:\s*['"]?([A-Za-z][^,;'"}]*)/gi), ...all.matchAll(/fontFamily\s*:\s*['"]([^'"]+)/g)].map(m => m[1].trim().toLowerCase()).filter(f => f && !/^(inherit|initial|var\(|system-ui|-apple-system|blinkmacsystemfont|monospace|sans-serif|serif|ui-[a-z-]+|\d)/.test(f)));
const starts = new Set([...visible.matchAll(/>\s*(get started|start now|let'?s go|begin|start)\s*</gi)].map(m => m[1].toLowerCase()));
const html = src.filter(([f]) => /\.html?$/.test(f));
const head = html.flatMap(([f, s]) => [!/<!doctype html>/i.test(s) && `${f}: no <!doctype html>`, !/<meta[^>]+charset/i.test(s) && `${f}: no <meta charset="utf-8">`, !/<meta[^>]+name=["']?viewport/i.test(s) && `${f}: no viewport meta`].filter(Boolean));

// Generated tells that screenshot critics miss: tracked uppercase labels, numbered labels, italic accent words,
// monospace used as texture and dots in front of text.
const native = src.filter(([f]) => /\.(swift|kt|dart|jsx|tsx)$/.test(f)).map(([, s]) => s).join('\n');
const capsTracked = (native.match(/(\.textCase\(\.uppercase\)|\.uppercased\(\)|textTransform:\s*['"]uppercase)[\s\S]{0,160}?(\.tracking\(|\.kerning\(|letterSpacing)/g) || []).length
  + (native.match(/(\.tracking\(|\.kerning\(|letterSpacing)[^)\n]*\)[\s\S]{0,160}?(\.textCase\(\.uppercase\)|\.uppercased\(\))/g) || []).length
  + (native.match(/Text\(\s*"[A-Z][A-Z0-9 ·.,&'-]{2,}"\s*\)[\s\S]{0,200}?\.(tracking|kerning)\(/g) || []).length
  + (all.match(/text-transform\s*:\s*uppercase[^}]*letter-spacing|letter-spacing[^}]*text-transform\s*:\s*uppercase/gi) || []).length;
const numbered = (all.match(/["'>·]\s*[^"'<\n]{0,40}?\b(No\.\s?\d|№\s?\d|Step 0\d)|["'>]\s*(0\d\s*[\/.–—]|\(0\d{1,2}\))/gi) || []).length;
const italicAccent = (native.match(/Text\([^)]*\)[^\n]{0,80}\.italic\(\)[^\n]{0,40}\+|\+\s*Text\([^)]*\)[^\n]{0,80}\.italic\(\)/g) || []).length
  + (native.match(/\*[A-Za-z]+\*/g) && /Text\(\s*"[^"]*\*[A-Za-z]+\*[^"]*"/.test(native) ? 1 : 0)
  + (all.match(/<(em|i)>[^<]{1,24}<\/\1>[^<]{0,40}<\/h[1-3]/gi) || []).length;
const mono = (native.match(/design:\s*\.monospaced|\.monospaced\(\)|FontFamily\.Monospace|['"](Menlo|Courier|SF Mono|JetBrains Mono|IBM Plex Mono|Space Mono)/g) || []).length
  + (all.match(/font-family\s*:[^;]*mono/gi) || []).length;
const dots = (native.match(/Circle\(\)[^\n]{0,80}\.frame\(width:\s*[2-9](\.\d+)?\s*,\s*height:\s*[2-9]/g) || []).length;
const checks = [
  ['one accent', accentFams.length <= 1, accentFams.length ? `non-status hue families: ${accentFams.join(', ')}` : 'neutrals and status colors only'],
  ['one grey family', !(warm >= 3 && cool >= 3), `warm greys ${warm}, cool greys ${cool}`],
  ['radius scale', scale.length <= 6, `${scale.length} radii between 5 and 39: ${scale.join(', ') || 'none'} (state the scale as a rule)`],
  ['no emoji in UI', emoji.length === 0, emoji.length ? `${emoji.length}: ${[...new Set(emoji)].join(' ')}` : 'none'],
  ['gradients', gradients <= 2 || 'warn', `${gradients} (each needs a reason from the reference look)`],
  ['type families', fonts.size <= 2, [...fonts].join(', ') || 'system'],
  ['one label per intent', starts.size <= 1, [...starts].join(' / ') || 'n/a'],
  ['no tracked caps labels', capsTracked === 0, capsTracked ? `${capsTracked} uppercase labels with tracking (sentence case, no tracking)` : 'none'],
  ['no numbered labels', numbered === 0, numbered ? `${numbered} ("No. 001", "01 /", "Step 01")` : 'none'],
  ['no italic accent word', italicAccent === 0, italicAccent ? `${italicAccent} italic word set inside a headline` : 'none'],
  ['mono only for figures', mono <= 1, `${mono} monospaced uses (texture of timestamps and mono notes reads as generated)`],
  ['no dots before text', dots <= 1 || 'warn', `${dots} small circles (a dot is only for live, presence or unread)`],
  ['encoding', mojibake === 0, mojibake ? `${mojibake} mojibake sequences (missing charset?)` : 'clean'],
  ['document head', head.length === 0, head.join('; ') || (html.length ? 'doctype, charset, viewport' : 'n/a')],
];
const failed = checks.filter(c => c[1] === false);
if (json) console.log(JSON.stringify({files: files.length, pass: !failed.length, checks: checks.map(([name, ok, detail]) => ({name, ok: ok === true, warn: ok === 'warn', detail}))}, null, 1));
else { for (const [n, ok, d] of checks) console.log(`${ok === 'warn' ? 'WARN' : ok ? 'PASS' : 'FAIL'}  ${n.padEnd(22)} ${d}`); console.log(`${failed.length ? 'FAIL' : 'PASS'}: ${files.length} files, ${failed.length} failed`); }
process.exit(failed.length ? 1 : 0);
