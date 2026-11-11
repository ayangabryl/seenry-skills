#!/usr/bin/env node
// Seenry identity: fetch real typefaces with their licenses, set specimen boards and color studies on the canvas.
// No packages. Node 18+.
//
//   node identity.mjs fetch "Geist" "Instrument Serif" --weights 400,600 --italic [--source auto|fontsource|fontshare] [--out .seenry/canvas/fonts]
//   node identity.mjs info "Open Runde"
//   node identity.mjs specimen --fonts "Geist,Satoshi,Newsreader" --lines "Headline|Second line|€38,000" [--dir .seenry/canvas] [--ground #f4f1ea --ink #141210]
//   node identity.mjs study --name "Limestone" --source "where the colors come from" --ground #e9e4da --ink #10213a --dominant #2f5d50 --accent #e2452a
//        --display "Familjen Grotesk" --body "Geist" --photo refs/street.jpg --lines "Headline|Body sentence|€38,000" [--dark-ground … --dark-ink … --dark-dominant … --dark-accent …]
//
// Fontsource covers Google Fonts and other open fonts (Inter, Geist, Open Runde, Nunito…), with SPDX licenses.
// Fontshare covers the Indian Type Foundry free catalog (Satoshi, General Sans, Switzer…), under ITF's Free Font License.
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {join, resolve, relative} from 'node:path';

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
    const f = await find(name);
    if (!f) { console.error(`Not found on Fontsource or Fontshare: "${name}". Premium faces come from their foundry; see references/type.md.`); process.exitCode = 1; continue; }
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
  const css = manifest.flatMap(m => m.files.map(x => `@font-face { font-family: "${m.family}"; src: url("${x.file}") format("woff2"); font-weight: ${x.weight}; font-style: ${x.style}; font-display: swap; }`)).join('\n');
  writeFileSync(join(out, 'fonts.css'), `/* Generated by identity.mjs. Licenses and sources are in fonts.json. */\n${css}\n`);
  console.log(`Wrote ${relative(process.cwd(), join(out, 'fonts.css'))} and fonts.json. ITF-FFL fonts are free for commercial use but not open source: never redistribute the files outside the product.`);
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
</style></head><body><main>
<div class="meta"><span>${esc(family)}</span><span>${i + 1} of ${fonts.length}</span></div>
<p class="d">${esc(head)}</p>
<p class="d2">${esc(head)}</p>
<p class="h">${esc(rest[0] || head)}</p>
<div class="row"><p class="b">${esc(rest.slice(1).join(' ') || rest[0] || head)}</p><p class="b${italic ? ' it' : ''}">${italic ? esc(rest[0] || head) : 'No italic in this family: pair it with one that has one, or avoid italics.'}</p><p class="s">${esc(rest.join(' · ') || head)}</p></div>
<div class="num">0123456789 €38,000 · 12:45 · 1/4</div>
<div class="w">${[[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold']].filter(([w]) => has(w)).map(([w, n]) => `<span style="font-weight:${w}">Aa ${n}</span>`).join('')}${italic ? '<span class="it">Aa Italic</span>' : ''}</div>
<p class="s">Hamburgefonstiv · ÀÉÎÕÜ çãõ ß · “Quotes” — dashes – (parens) &amp; @ # % → 01 Il1 O0</p>
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

if (command === 'fetch') await fetchFonts();
else if (command === 'info') await info();
else if (command === 'specimen') specimen();
else if (command === 'study') study();
else fail('Usage: node identity.mjs fetch|info|specimen|study  (see the header of this file)', 2);
