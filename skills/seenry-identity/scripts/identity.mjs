#!/usr/bin/env node
// Seenry identity: fetch real typefaces with their licenses, set specimen boards and color studies on the canvas.
// No packages. Node 18+.
//
//   node identity.mjs fetch "Geist" "Instrument Serif" --weights 400,600 --italic [--source auto|fontsource|fontshare] [--out .seenry/canvas/fonts]
//   node identity.mjs fetch "Karrik" --url https://<foundry>/karrik.zip [--license OFL-1.1]   (a font file or zip from the foundry or GitHub)
//   node identity.mjs ramp --name green --color "#2f5a4c"   (a 12-step OKLCH scale with a job per step, light and dark)
//   node identity.mjs info "Open Runde"
//   node identity.mjs specimen --fonts "Geist,Satoshi,Newsreader" --lines "Headline|Second line|€38,000" [--dir .seenry/canvas] [--ground #f4f1ea --ink #141210]
//   node identity.mjs study --name "Limestone" --source "where the colors come from" --ground #e9e4da --ink #10213a --dominant #2f5d50 --accent #e2452a
//        --display "Familjen Grotesk" --body "Geist" --photo refs/street.jpg --lines "Headline|Body sentence|€38,000" [--dark-ground … --dark-ink … --dark-dominant … --dark-accent …]
//
// Fontsource covers Google Fonts and other open fonts (Inter, Geist, Open Runde, Nunito…), with SPDX licenses.
// Fontshare covers the Indian Type Foundry free catalog (Satoshi, General Sans, Switzer…), under ITF's Free Font License.
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {join, resolve, relative, basename, extname} from 'node:path';
import {inflateRawSync} from 'node:zlib';

const args = process.argv.slice(2), command = args[0];
const flags = {}, positional = [];
for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith('--')) { const k = args[i].slice(2); const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true; flags[k] = v; }
  else positional.push(args[i]);
}
const slug = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fileName = s => s.replace(/[^A-Za-z0-9]+/g, '');
const fail = (msg, code = 1) => { console.error(msg); process.exit(code); };

async function get(url, as = 'json') {
  let res;
  try { res = await fetch(url, {headers: {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'}}); }
  catch (e) { fail(`Could not reach ${new URL(url).host} (${e.cause?.code || e.message}). Behind a proxy, run with NODE_USE_ENV_PROXY=1.`); }
  if (!res.ok) return null;
  return as === 'json' ? res.json() : as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
}

async function fromFontsource(name) {
  const data = await get(`https://api.fontsource.org/v1/fonts/${slug(name)}`);
  if (!data || !data.variants) return null;
  return {
    family: data.family, source: 'fontsource', license: data.license || 'unknown', origin: data.source || `https://fontsource.org/fonts/${data.id}`,
    weights: data.weights, styles: data.styles, variable: !!data.variable, category: data.category,
    url: (w, style) => data.variants[w]?.[style]?.latin?.url?.woff2 || data.variants[w]?.[style]?.[data.defSubset]?.url?.woff2,
  };
}

async function fromFontshare(name) {
  const meta = await get(`https://api.fontshare.com/v2/fonts?q=${encodeURIComponent(name)}`);
  const font = meta?.fonts?.find(f => f.slug === slug(name) || f.name.toLowerCase() === name.toLowerCase().trim());
  if (!font) return null;
  const styles = (font.styles || []).filter(s => !s.is_variable);
  const weights = [...new Set(styles.map(s => s.weight?.weight).filter(Boolean))].sort((a, b) => a - b);
  const numbers = styles.map(s => s.weight?.number).filter(Boolean);
  const css = await get(`https://api.fontshare.com/v2/css?f[]=${font.slug}@${numbers.join(',')}&display=swap`, 'text') || '';
  const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(m => m[1]).map(b => ({
    weight: Number(b.match(/font-weight:\s*(\d+)/)?.[1]), style: b.match(/font-style:\s*(\w+)/)?.[1] || 'normal', url: b.match(/url\('([^']+\.woff2)'\)/)?.[1],
  })).filter(f => f.url);
  return {
    family: font.name, source: 'fontshare', license: /ofl/i.test(font.license_type || '') ? 'OFL-1.1' : 'ITF-FFL', origin: `https://www.fontshare.com/fonts/${font.slug}`,
    weights, styles: [...new Set(faces.map(f => f.style))], variable: styles.some(s => s.is_variable), category: font.category,
    url: (w, style) => { const f = faces.find(x => x.weight === w && x.style === style); return f && (f.url.startsWith('//') ? 'https:' + f.url : f.url); },
  };
}


// A zip from a foundry or GitHub: read its central directory and inflate the entries we need. No packages.
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10), out = [];
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count && buf.readUInt32LE(p) === 0x02014b50; n++) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nameLen = buf.readUInt16LE(p + 28), extra = buf.readUInt16LE(p + 30), comment = buf.readUInt16LE(p + 32), local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    p += 46 + nameLen + extra + comment;
    out.push({name, read: () => { const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28), data = buf.subarray(start, start + size); return method === 8 ? inflateRawSync(data) : data; }});
  }
  return out;
}
const WEIGHT_WORDS = [['hairline', 100], ['thin', 100], ['extralight', 200], ['ultralight', 200], ['semilight', 350], ['light', 300], ['book', 400], ['regular', 400], ['normal', 400], ['medium', 500], ['semibold', 600], ['demibold', 600], ['demi', 600], ['extrabold', 800], ['ultrabold', 800], ['heavy', 800], ['bold', 700], ['black', 900], ['ultra', 900], ['fat', 900]];
function styleOf(name) {
  const n = basename(name).toLowerCase().replace(/[\s_-]/g, '');
  const italic = /italic|oblique|ital\b/.test(n);
  const num = n.match(/(?:^|[^0-9])([1-9]00)(?:[^0-9]|$)/);
  const word = WEIGHT_WORDS.find(([w]) => n.includes(w));
  return {weight: num ? Number(num[1]) : word ? word[1] : 400, style: italic ? 'italic' : 'normal', variable: /variable|\[wght|vf\b/.test(n)};
}
const FORMAT = {'.woff2': 'woff2', '.woff': 'woff', '.otf': 'opentype', '.ttf': 'truetype'};
async function fromUrl(name, url) {
  const data = await get(url, 'buffer');
  if (!data) fail(`Could not download ${url}`);
  const entries = extname(new URL(url).pathname).toLowerCase() === '.zip' || data.readUInt32LE(0) === 0x04034b50 ? unzip(data) : [{name: basename(new URL(url).pathname), read: () => data}];
  if (!entries) fail(`${url} is neither a font file nor a readable zip.`);
  const fonts = entries.filter(e => FORMAT[extname(e.name).toLowerCase()] && !/__MACOSX|\/\./.test(e.name));
  const rank = e => ['.woff2', '.woff', '.otf', '.ttf'].indexOf(extname(e.name).toLowerCase());
  const best = new Map();
  for (const e of fonts.sort((a, b) => rank(a) - rank(b))) { const st = styleOf(e.name), key = st.weight + st.style; if (!best.has(key) && !st.variable) best.set(key, {e, ...st}); }
  if (!best.size) for (const e of fonts) { const st = styleOf(e.name); const key = 'v' + st.style; if (!best.has(key)) best.set(key, {e, ...st, weight: '100 900'}); }
  const licenseEntry = entries.find(e => /(^|\/)(ofl|license|licence)[^/]*\.(txt|md)$|(^|\/)(OFL|LICENSE)$/i.test(e.name));
  const licenseText = licenseEntry ? licenseEntry.read().toString('utf8') : '';
  const license = flags.license && flags.license !== true ? flags.license : /SIL Open Font License/i.test(licenseText) ? 'OFL-1.1' : /Apache License/i.test(licenseText) ? 'Apache-2.0' : licenseText ? 'see LICENSE' : 'unknown: check the foundry page';
  return {family: name, source: 'url', license, origin: url, licenseText, items: [...best.values()]};
}

async function find(name) {
  const source = flags.source || 'auto';
  if (source !== 'fontshare') { const f = await fromFontsource(name); if (f) return f; }
  if (source !== 'fontsource') { const f = await fromFontshare(name); if (f) return f; }
  return null;
}

async function fetchFonts() {
  if (!positional.length) fail('Usage: identity.mjs fetch "<family>" ["<family>" …] [--weights 400,600] [--italic] [--source auto|fontsource|fontshare] [--out dir]', 2);
  const out = resolve(flags.out || (existsSync('.seenry/canvas') ? '.seenry/canvas/fonts' : 'fonts'));
  mkdirSync(out, {recursive: true});
  const manifestPath = join(out, 'fonts.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : [];
  const wanted = flags.weights ? String(flags.weights).split(',').map(Number) : null;
  for (const name of positional) {
    if (flags.url && flags.url !== true) {
      const u = await fromUrl(name, flags.url), files = [];
      for (const it of u.items) {
        const ext = extname(it.e.name).toLowerCase(), file = `${fileName(name)}-${String(it.weight).replace(' ', '-')}${it.style === 'italic' ? 'i' : ''}${ext}`;
        writeFileSync(join(out, file), it.e.read()); files.push({file, weight: it.weight, style: it.style, format: FORMAT[ext]});
      }
      if (u.licenseText) writeFileSync(join(out, `${fileName(name)}-LICENSE.txt`), u.licenseText);
      const entry = {family: name, source: 'url', license: u.license, origin: u.origin, files, retrieved: new Date().toISOString()};
      const i = manifest.findIndex(m => m.family === name);
      if (i >= 0) manifest[i] = entry; else manifest.push(entry);
      console.log(`${name}  ${u.license}  ${files.map(x => x.weight + (x.style === 'italic' ? 'i' : '')).join(' ') || 'no font files found'}  ← ${u.origin}`);
      if (!files.length) process.exitCode = 1;
      continue;
    }
    const f = await find(name);
    if (!f) { console.error(`Not found on Fontsource or Fontshare: "${name}". Download it from the foundry with --url <font file or zip>; premium faces need the foundry's license (references/type.md).`); process.exitCode = 1; continue; }
    const weights = (wanted || [400, 500, 600, 700]).map(w => f.weights.includes(w) ? w : f.weights.reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a)).filter((w, i, a) => a.indexOf(w) === i);
    const styles = flags.italic ? ['normal', 'italic'].filter(s => f.styles.includes(s)) : ['normal'];
    const files = [];
    for (const w of weights) for (const style of styles) {
      const url = f.url(w, style); if (!url) continue;
      const data = await get(url, 'buffer'); if (!data) continue;
      const file = `${fileName(f.family)}-${w}${style === 'italic' ? 'i' : ''}.woff2`;
      writeFileSync(join(out, file), data);
      files.push({file, weight: w, style});
    }
    if (flags.italic && !f.styles.includes('italic')) console.log(`${f.family} has no italic.`);
    const entry = {family: f.family, source: f.source, license: f.license, origin: f.origin, category: f.category, files, retrieved: new Date().toISOString()};
    const i = manifest.findIndex(m => m.family === f.family);
    if (i >= 0) manifest[i] = entry; else manifest.push(entry);
    console.log(`${f.family}  ${f.license}  ${files.map(x => x.weight + (x.style === 'italic' ? 'i' : '')).join(' ')}  ← ${f.origin}`);
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const css = manifest.flatMap(m => m.files.map(x => `@font-face { font-family: "${m.family}"; src: url("${x.file}") format("${x.format || 'woff2'}"); font-weight: ${x.weight}; font-style: ${x.style}; font-display: swap; }`)).join('\n');
  writeFileSync(join(out, 'fonts.css'), `/* Generated by identity.mjs. Licenses and sources are in fonts.json. */\n${css}\n`);
  console.log(`Wrote ${relative(process.cwd(), join(out, 'fonts.css'))} and fonts.json.`);
  if (manifest.some(m => m.license === 'ITF-FFL')) console.log('ITF-FFL fonts are free for commercial use but not open source: never redistribute the files outside the product.');
  if (manifest.some(m => /unknown|see LICENSE/.test(m.license))) console.log('Some licenses are not recognized: read the LICENSE file or the foundry page before shipping.');
}

async function info() {
  for (const name of positional) {
    const f = await find(name);
    if (!f) { console.log(`${name}: not on Fontsource or Fontshare`); continue; }
    console.log(`${f.family}  ${f.license}  ${f.category || ''}  weights ${f.weights.join(',')}  ${f.styles.includes('italic') ? 'italic' : 'no italic'}${f.variable ? '  variable' : ''}  ← ${f.origin}`);
  }
}

function specimen() {
  const dir = resolve(flags.dir || '.seenry/canvas');
  const fonts = String(flags.fonts || '').split(',').map(s => s.trim()).filter(Boolean);
  const lines = String(flags.lines || '').split('|').map(s => s.trim()).filter(Boolean);
  if (!fonts.length || !lines.length) fail('Usage: identity.mjs specimen --fonts "Family A,Family B" --lines "Real headline|Real line|€38,000" [--dir .seenry/canvas] [--ground #f4f1ea] [--ink #141210]', 2);
  const section = join(dir, '00-identity');
  mkdirSync(section, {recursive: true});
  const ground = flags.ground || '#f4f2ee', ink = flags.ink || '#151413';
  const esc = s => s.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  const [head, ...rest] = lines;
  let known = [];
  try { known = JSON.parse(readFileSync(join(dir, 'fonts', 'fonts.json'), 'utf8')); } catch {}
  fonts.forEach((family, i) => {
    const entry = known.find(m => m.family === family);
    const italic = !entry || entry.files.some(f => f.style === 'italic');
    const weights = entry ? new Set(entry.files.map(f => f.weight)) : null;
    const has = w => !weights || weights.has(w);
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Type · ${esc(family)}</title>
<meta name="seenry-note" content="Specimen: ${esc(family)} set with the product's real lines at display, heading, body and caption sizes.">
<meta name="seenry-ask" content="Does ${esc(family)} sound like this product?|Do the numbers and the italic hold up?">
<link rel="stylesheet" href="../fonts/fonts.css">
<style>
:root{--ground:${ground};--ink:${ink}}
body{margin:0;background:var(--ground);color:var(--ink);font-family:"${family}",system-ui,sans-serif;font-optical-sizing:auto;font-synthesis:none}
main{padding:64px;display:grid;gap:48px}
.meta{display:flex;justify-content:space-between;font:500 13px/1.4 ui-monospace,monospace;opacity:.6;letter-spacing:.02em}
.d{font-size:160px;line-height:.9;letter-spacing:-.04em;font-weight:700;margin:0;overflow-wrap:anywhere}
.d2{font-size:160px;line-height:.9;letter-spacing:-.04em;font-weight:400;margin:0}
.h{font-size:56px;line-height:1.02;letter-spacing:-.025em;font-weight:600;margin:0;max-width:18ch}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.b{font-size:18px;line-height:1.55;margin:0;max-width:60ch}
.s{font-size:13px;line-height:1.45;margin:0}
.it{font-style:italic}
.num{font-size:72px;font-weight:500;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}
.w{display:flex;gap:28px;flex-wrap:wrap;font-size:40px;line-height:1}
.q{display:grid;gap:14px;border-top:1px solid color-mix(in oklch,var(--ink) 20%,transparent);padding-top:28px}
.q div{display:grid;grid-template-columns:170px 1fr;align-items:baseline;gap:16px}
.k{font:500 12px/1.4 ui-monospace,monospace;opacity:.6}
.v{line-height:1.1}.tn{font-variant-numeric:tabular-nums;line-height:1.3}
</style></head><body><main>
<div class="meta"><span>${esc(family)}</span><span>${i + 1} of ${fonts.length}</span></div>
<p class="d">${esc(head)}</p>
<p class="d2">${esc(head)}</p>
<p class="h">${esc(rest[0] || head)}</p>
<div class="row"><p class="b">${esc(rest.slice(1).join(' ') || rest[0] || head)}</p><p class="b${italic ? ' it' : ''}">${italic ? esc(rest[0] || head) : 'No italic in this family: pair it with one that has one, or avoid italics.'}</p><p class="s">${esc(rest.join(' · ') || head)}</p></div>
<div class="num">0123456789 €38,000 · 12:45 · 1/4</div>
<div class="w">${[[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold']].filter(([w]) => has(w)).map(([w, n]) => `<span style="font-weight:${w}">Aa ${n}</span>`).join('')}${italic ? '<span class="it">Aa Italic</span>' : ''}</div>
<section class="q" aria-label="Quality checks">
<div><span class="k">Confusables</span><span class="v" style="font-size:40px">Il1 O0 rn m cl d 5S 8B</span></div>
<div><span class="k">Kerning pairs</span><span class="v" style="font-size:56px">AV To Ty We LT r. f) “A</span></div>
<div><span class="k">Even rhythm</span><span class="v" style="font-size:40px">minimum Hamburgefonstiv</span></div>
<div><span class="k">14px</span><span class="v" style="font-size:14px;line-height:1.45">${esc(rest.slice(1).join(' ') || head)} Invoice INV-2026-0418 · l1I0O · jo@example.com</span></div>
<div><span class="k">12px</span><span class="v" style="font-size:12px;line-height:1.45">${esc(rest.slice(1).join(' ') || head)} Invoice INV-2026-0418 · l1I0O · jo@example.com</span></div>
<div><span class="k">Tabular figures</span><span class="v tn" style="font-size:20px">1,284.00<br>11,111.11<br>90,807.65</span></div>
<div><span class="k">Diacritics, symbols</span><span class="v" style="font-size:24px">ÀÉÎÕÜ çãõ ß ñ ž ł € £ @ &amp; % → “Quotes” — (parens)</span></div>
</section>
</main></body></html>
`;
    writeFileSync(join(section, `${String(i + 1).padStart(2, '0')}-${slug(family)}.html`), html);
  });
  console.log(`Wrote ${fonts.length} specimen screens to ${relative(process.cwd(), section)}/. Render them with canvas.mjs render 00-identity and look at all of them side by side.`);
}


function study() {
  const dir = resolve(flags.dir || '.seenry/canvas');
  const need = ['name', 'ground', 'ink', 'dominant', 'accent', 'display', 'lines'];
  const missing = need.filter(k => !flags[k] || flags[k] === true);
  if (missing.length) fail(`Usage: identity.mjs study --name "…" --source "…" --ground … --ink … --dominant … --accent … --display "Family" [--body "Family"] [--photo refs/x.jpg] --lines "Headline|Sentence|Number". Missing: ${missing.join(', ')}`, 2);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  const [head, sentence = head, number = '€38,000'] = String(flags.lines).split('|').map(s => s.trim());
  const body = flags.body || flags.display, photo = flags.photo && flags.photo !== true ? flags.photo.replace(/^\.?\/?/, '../') : null;
  const dark = k => flags['dark-' + k] || null;
  // Text on a filled color takes whichever of ink and ground reads better, unless set.
  const lum = hex => { const m = String(hex).replace('#', '').match(/^([0-9a-f]{6})$/i); if (!m) return null; const c = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return x == null || y == null ? 0 : (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const on = (fill, a, b) => ratio(fill, a) >= ratio(fill, b) ? a : b;
  const darkInk = dark('ink') || flags.ground, darkGround = dark('ground');
  const onDominant = flags['on-dominant'] || on(flags.dominant, flags.ink, flags.ground), onAccent = flags['on-accent'] || on(flags.accent, flags.ink, flags.ground);
  const darkOnDominant = dark('on-dominant') || (darkGround && on(dark('dominant') || flags.dominant, darkInk, darkGround));
  const darkOnAccent = dark('on-accent') || (darkGround && on(dark('accent') || flags.accent, darkInk, darkGround));
  const lowAccent = Math.max(ratio(flags.accent, flags.ink), ratio(flags.accent, flags.ground)) < 4.5;
  const section = join(dir, '00-identity');
  mkdirSync(section, {recursive: true});
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Color · ${esc(flags.name)}</title>
<meta name="seenry-note" content="Color study: ${esc(flags.name)}. ${esc(flags.source || '')}">
<meta name="seenry-ask" content="Does this color world fit the idea?|Is the accent doing one job only?">
<link rel="stylesheet" href="../fonts/fonts.css">
<style>
:root{--ground:${flags.ground};--ink:${flags.ink};--dominant:${flags.dominant};--accent:${flags.accent};--on-dominant:${onDominant};--on-accent:${onAccent}}
${darkGround ? `:root[data-theme="dark"]{--ground:${darkGround};--ink:${darkInk};--dominant:${dark('dominant') || flags.dominant};--accent:${dark('accent') || flags.accent};--on-dominant:${darkOnDominant};--on-accent:${darkOnAccent}}` : ''}
body{margin:0;background:var(--ground);color:var(--ink);font:400 17px/1.5 "${body}",system-ui,sans-serif}
.top{display:grid;grid-template-columns:1.25fr 1fr;min-height:620px}
.field{background:var(--dominant);color:var(--on-dominant);padding:56px;display:flex;flex-direction:column;justify-content:space-between}
.name{font:700 13px/1.4 ui-monospace,monospace;letter-spacing:.04em;text-transform:uppercase;opacity:.75}
h1{font-family:"${flags.display}";font-weight:700;font-size:112px;line-height:.92;letter-spacing:-.035em;margin:0;max-width:9ch}
.photo{background:${photo ? `url("${photo}") center/cover` : 'var(--ink)'};min-height:620px}
.ui{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:56px;padding:56px}
.ui h2{font-family:"${flags.display}";font-weight:600;font-size:40px;line-height:1;letter-spacing:-.02em;margin:0 0 16px}
.ui p{margin:0 0 20px;max-width:46ch}
.row{display:flex;justify-content:space-between;border-top:1px solid color-mix(in oklch,var(--ink) 22%,transparent);padding:12px 0;font-variant-numeric:tabular-nums}
.muted{color:color-mix(in oklch,var(--ink) 62%,var(--ground))}
.btn{display:inline-block;background:var(--accent);color:var(--on-accent);font-weight:600;padding:14px 22px;border-radius:2px;text-decoration:none}
.num{font-family:"${flags.display}";font-size:72px;font-weight:600;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.sw{display:grid;grid-template-columns:8fr 1fr 2fr .35fr;height:84px}
.sw div{display:flex;align-items:end;padding:10px 12px;font:500 12px/1.2 ui-monospace,monospace}
</style></head><body>
<div class="top"><div class="field"><span class="name">${esc(flags.name)}${flags.source ? ' · ' + esc(flags.source) : ''}</span><h1>${esc(head)}</h1></div><div class="photo" role="img" aria-label="Reference photograph"></div></div>
<div class="ui">
  <div><h2>${esc(head)}</h2><p>${esc(sentence)}</p><a class="btn" href="#">Start a project</a></div>
  <div><div class="row"><span>Identity, 6 weeks</span><span>€38,000</span></div><div class="row"><span>Website, 8 weeks</span><span>€46,000</span></div><div class="row muted"><span>Next start</span><span>12 Jan 2027</span></div></div>
  <div><div class="num">${esc(number)}</div><p class="muted" style="margin-top:12px">Secondary text on the ground, for contrast.</p></div>
</div>
<div class="sw"><div style="background:var(--ground);color:var(--ink);outline:1px solid color-mix(in oklch,var(--ink) 15%,transparent)">ground ${esc(flags.ground)}</div><div style="background:var(--ink);color:var(--ground)">ink</div><div style="background:var(--dominant);color:var(--on-dominant)">dominant ${esc(flags.dominant)}</div><div style="background:var(--accent);color:var(--on-accent)">accent</div></div>
</body></html>
`;
  const file = join(section, `c-${slug(flags.name)}.html`);
  writeFileSync(file, html);
  if (lowAccent) console.log(`The accent ${flags.accent} reaches 4.5:1 with neither ink nor ground: use it for large shapes and 3:1 marks only, never behind body-size text, or darken it.`);
  console.log(`Wrote ${relative(process.cwd(), file)}. Swatch widths show the proportions: ground, ink, dominant, accent. Run canvas.mjs verify 00-identity for contrast in both modes.`);
}

// OKLCH ramps: one color in, twelve steps out, each with a job (backgrounds, borders, solid fills, text), light and dark.
const toLin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4, toGam = c => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
function hexToOklch(hex) {
  const m = String(hex).replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(m)) fail(`Not a #rrggbb color: ${hex}`, 2);
  const [r, g, b] = [0, 2, 4].map(i => toLin(parseInt(m.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s2 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s2, A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s2, B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s2;
  return {L, C: Math.hypot(A, B), H: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360};
}
function oklchToRgb(L, C, H) {
  const a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s3 = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s3, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s3, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s3];
}
const inGamut = rgb => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4);
const fitChroma = (L, C, H) => { let c = C; while (c > 0 && !inGamut(oklchToRgb(L, c, H))) c -= 0.002; return Math.max(0, c); };
const hexOf = (L, C, H) => '#' + oklchToRgb(L, C, H).map(v => Math.round(Math.min(1, Math.max(0, toGam(Math.min(1, Math.max(0, v))))) * 255).toString(16).padStart(2, '0')).join('');
const relLum = hex => { const m = hex.slice(1); const [r, g, b] = [0, 2, 4].map(i => toLin(parseInt(m.slice(i, i + 2), 16) / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (x, y) => { const a = relLum(x), b = relLum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
const JOBS = ['app background', 'subtle background', 'component background', 'component hover', 'component pressed or selected', 'subtle border, separator', 'component border', 'strong border, focus ring', 'solid fill: the brand color', 'solid fill hover', 'low-contrast text', 'high-contrast text'];
function ramp() {
  const name = flags.name && flags.name !== true ? slug(flags.name) : 'brand';
  if (!flags.color || flags.color === true) fail('Usage: identity.mjs ramp --name green --color "#2f5a4c" [--neutral]', 2);
  const base = hexToOklch(flags.color), chromaCap = flags.neutral ? Math.min(base.C, 0.02) : base.C;
  const lightL = [0.993, 0.982, 0.958, 0.932, 0.903, 0.868, 0.818, 0.745, null, null, 0.47, 0.26];
  const darkL = [0.165, 0.195, 0.235, 0.27, 0.305, 0.345, 0.405, 0.49, null, null, 0.8, 0.94];
  const shape = [0.06, 0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.8, 1, 1, 0.92, 0.5];
  const solid = Math.min(Math.max(base.L, 0.35), 0.82);
  const build = (Ls, dark) => Ls.map((L, i) => {
    const l = L ?? (i === 8 ? solid : dark ? Math.min(solid + 0.05, 0.9) : Math.max(solid - 0.05, 0.3));
    // Keep chroma at the ends low and nudge very light steps a little toward warmer hues, so tints stay clean, not grey.
    const c = fitChroma(l, chromaCap * shape[i] * (i === 8 || i === 9 ? 1 : 1.05), base.H);
    return {step: i + 1, L: +l.toFixed(3), C: +c.toFixed(3), H: +base.H.toFixed(1), hex: hexOf(l, c, base.H)};
  });
  const light = build(lightL, false), dark = build(darkL, true);
  const css = s => s.map(x => `  --${name}-${x.step}: oklch(${x.L} ${x.C} ${x.H}); /* ${x.hex} ${JOBS[x.step - 1]} */`).join('\n');
  const onSolid = h => contrast(h, '#ffffff') >= contrast(h, '#000000') ? 'white' : 'black';
  console.log(`/* ${name} from ${flags.color}: oklch(${base.L.toFixed(3)} ${base.C.toFixed(3)} ${base.H.toFixed(1)}). Steps 1–2 backgrounds, 3–5 component fills, 6–8 borders, 9–10 solid fills, 11–12 text. */`);
  console.log(`:root {\n${css(light)}\n}\n:root[data-theme="dark"] {\n${css(dark)}\n}`);
  const t11 = contrast(light[10].hex, light[0].hex), t12 = contrast(light[11].hex, light[0].hex), d11 = contrast(dark[10].hex, dark[0].hex), d12 = contrast(dark[11].hex, dark[0].hex);
  console.log(`/* Contrast on step 1: step 11 ${t11.toFixed(1)}:1, step 12 ${t12.toFixed(1)}:1 (dark ${d11.toFixed(1)}:1, ${d12.toFixed(1)}:1). Text on step 9 reads best in ${onSolid(light[8].hex)} (${Math.max(contrast(light[8].hex, '#ffffff'), contrast(light[8].hex, '#000000')).toFixed(1)}:1). */`);
  if (Math.abs(light[8].L - base.L) > 0.02) console.log(`/* Step 9 moved from L ${base.L.toFixed(3)} to ${light[8].L} so it works as a fill; keep the exact source color as --${name}-brand if the logo needs it. */`);
}

if (command === 'fetch') await fetchFonts();
else if (command === 'info') await info();
else if (command === 'specimen') specimen();
else if (command === 'study') study();
else if (command === 'ramp') ramp();
else fail('Usage: node identity.mjs fetch|info|specimen|study|ramp  (see the header of this file)', 2);
