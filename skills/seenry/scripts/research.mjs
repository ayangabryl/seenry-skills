#!/usr/bin/env node
/** Research pack: pull a broad, varied set of references from Seenry MCP for one brief, so every build starts from
 *  real evidence instead of the few famous names an agent would search for.
 *
 *  node research.mjs --type landing|product|dashboard|studio|pricing|app --terms "music,listening" [--out .seenry/research]
 *                    [--sites linear.app,stripe.com] [--playwright path]
 *
 *  Needs SEENRY_PRO_KEY. Writes <out>/pack.md (every reference with source, rating, what it is, measured design and
 *  motion evidence), <out>/pack.json, downloaded posters in <out>/img/, and <out>/contact.png, a numbered contact
 *  sheet to look at, plus <out>/bar/: home-page first screens of design leaders, the fixed bar check.mjs scores against. The library search is lexical and alphabetical, so the pack mixes four sources on purpose:
 *  human-rated picks, the brief's category terms, named leaders, and random samples across the whole library. */
import {mkdirSync, writeFileSync, existsSync, copyFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const KEY = process.env.SEENRY_PRO_KEY;
if (!KEY) {
  // Without Seenry MCP: capture the leaders' live first screens as the bar, then research by hand (references/research.md).
  console.log('SEENRY_PRO_KEY is not set: building the bar from live sites with bar.mjs. If the Seenry MCP tools are connected, also research with them by hand (references/research.md).');
  const {spawnSync} = await import('node:child_process');
  const r = spawnSync(process.execPath, [new URL('./bar.mjs', import.meta.url).pathname, ...process.argv.slice(2)], {stdio: 'inherit'});
  process.exit(r.status ?? 1);
}
const type = flag('type', 'landing'), terms = (flag('terms', '') || '').split(',').map(t => t.trim()).filter(Boolean);
const sites = (flag('sites', '') || '').split(',').map(t => t.trim()).filter(Boolean);
const out = resolve(flag('out', '.seenry/research')), imgDir = join(out, 'img');
mkdirSync(imgDir, {recursive: true});

let rpcId = 0, calls = 0;
async function call(name, a) {
  calls++;
  const r = await fetch('https://mcp.seenry.design', {method: 'POST', headers: {Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream'},
    body: JSON.stringify({jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: {name, arguments: a}})});
  const t = await r.text();
  const body = t.includes('data:') ? t.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5)).pop() : t;
  const j = JSON.parse(body);
  const txt = j.result?.content?.find(c => c.type === 'text')?.text;
  try { return JSON.parse(txt); } catch { return {items: [], error: txt || j.error?.message}; }
}
// Sample a query at several positions across its whole result set, not only the alphabetical top.
async function spread(name, a, want) {
  const head = await call(name, {...a, limit: 2});
  const total = head.total || 0, items = total <= want ? [...(head.items || [])] : [];
  for (let k = 0; items.length < want && total > items.length && k < 4; k++) {
    const offset = Math.floor(Math.random() * Math.max(1, total - 4));
    items.push(...((await call(name, {...a, limit: 3, offset, ...(head.snapshot ? {snapshot: head.snapshot} : {})})).items || []));
  }
  return items;
}

const plan = {
  landing: {pages: ['home page', 'product & landing'], sections: ['hero', 'pricing', 'cards & tiles', 'footer'], motion: ['scroll', 'hover', 'hero'], apps: []},
  studio: {pages: ['home page', 'about'], sections: ['hero', 'cards & tiles', 'footer'], motion: ['scroll', 'hover', 'illustration'], apps: []},
  pricing: {pages: ['pricing'], sections: ['pricing', 'accordion & collapse'], motion: ['toggle', 'number'], apps: []},
  product: {pages: ['product & landing', 'home page'], sections: ['image', 'hero'], motion: ['add to cart', 'gallery', 'hover'], apps: ['product', 'checkout']},
  dashboard: {pages: [], sections: [], motion: ['table', 'filter', 'number'], apps: ['dashboard', 'table', 'invoice', 'billing', 'list', 'filter'], designs: ['dashboard', 'table', 'admin']},
  app: {pages: ['home page'], sections: ['hero'], motion: ['onboarding', 'sheet', 'tab'], apps: ['onboarding', 'settings', 'home']},
}[type] || {pages: ['home page'], sections: ['hero'], motion: ['hover'], apps: []};

const pack = [];
const seen = new Set(), perBrand = new Map();
const brandOf = item => ((item.site || '').replace(/^www\./, '') || (item.brand || item.author || item.title || '').split(/[\s·—-]/)[0] || item.id).toLowerCase();
const add = (group, item, extra = {}) => {
  if (!item) return;
  // Error and placeholder pages are never references.
  const kinds = [...(item.metadata?.pageTypes || []), item.title || '', item.label || ''].join(' ').toLowerCase();
  if (/\b404\b|not found|page not found|error page/.test(kinds)) return;
  const brand = brandOf(item), key = `${group}:${brand}`;
  // At most one entry per brand in a group and two across the pack, so no single brand floods the context.
  if (seen.has(key) || (perBrand.get(brand) || 0) >= 2 || seen.has(`id:${item.id}`)) return;
  seen.add(key); seen.add(`id:${item.id}`); perBrand.set(brand, (perBrand.get(brand) || 0) + 1);
  pack.push({group, id: item.id, title: item.title || item.label || item.category || '', brand: item.brand || item.author || item.site || '',
    source: item.source || item.site || '', url: item.referenceUrl || '', section: item.section || '', rating: item.editorialReview?.rating ?? item.rating ?? null,
    poster: item.posterUrl || item.poster || item.captures?.desktop?.thumbnailUrl || item.thumbnailUrl || null,
    tags: item.tags || item.metadata?.patterns || [], ...extra});
};

console.log(`Research pack for ${type}${terms.length ? ' · ' + terms.join(', ') : ''}`);
// 1. Human-rated picks.
for (const family of ['sections', 'pages', 'motion', 'branding']) {
  const r = await call('search_curated_references', {family, min_rating: 4, limit: 12, ...(terms[0] && family === 'branding' ? {q: terms[0]} : {})});
  (r.items || []).sort(() => Math.random() - 0.5).slice(0, family === 'sections' ? 5 : 3).forEach(i => add(`Curated ${family}`, i));
}
// 2. The brief's own category terms, across families.
for (const t of terms.slice(0, 3)) {
  for (const i of (await call('search_references', {q: t, limit: 4})).items || []) add('Category websites', i);
  for (const i of (await call('search_sections', {q: t, limit: 4})).items || []) add('Category sections', i);
  for (const fam of ['motion', 'branding']) for (const i of ((await call('search_designs', {family: fam, q: t, limit: 3})).items || [])) add(`Category ${fam}`, i);
}
// 3. Named leaders.
for (const s of sites.slice(0, 4)) {
  const r = await call('search_references', {site: s, limit: 2});
  (r.items || []).forEach(i => add('Named leaders', i));
}
// 3b. The bar: home-page first screens of companies whose design is the standard, whatever the category. The critic
// scores against these, never against section crops or motion frames, which are inspiration, not a bar.
const LEADERS = ['stripe.com', 'linear.app', 'apple.com', 'vercel.com', 'arc.net', 'attio.com', 'figma.com', 'raycast.com', 'framer.com', 'ramp.com', 'notion.com', 'airbnb.com'];
const bar = [];
for (const s of [...sites, ...LEADERS.filter(l => !sites.includes(l)).sort(() => Math.random() - 0.5)]) {
  if (bar.length >= 4) break;
  const home = ((await call('search_references', {site: s, limit: 3})).items || []).find(i => /\/captures\//.test(i.captures?.desktop?.thumbnailUrl || ''));
  if (!home) continue;
  bar.push(home.id);
  // The bar bypasses the per-brand limits: a leader already in the pack must still be in the bar.
  pack.push({group: 'Bar · first screens', id: home.id, title: home.title || 'Home', brand: home.brand || s, source: home.source || s, url: home.referenceUrl || '',
    section: '', rating: null, poster: home.captures.desktop.thumbnailUrl, tags: home.metadata?.patterns || []});
}
// 4. The page type and its sections, sampled across the whole library.
for (const p of plan.pages) (await spread('search_references', {page_type: p}, 6)).forEach(i => add(`Pages · ${p}`, i));
for (const e of plan.sections) (await spread('search_sections', {element: e}, 5)).forEach(i => add(`Sections · ${e}`, i));
// 5. Motion: recorded websites with cadence, and motion design clips for the interactions this page needs.
const recorded = await spread('search_references', {motion: true, ...(plan.pages[0] ? {page_type: plan.pages[0]} : {})}, 6);
for (const i of recorded.slice(0, 6)) {
  const m = await call('get_page_motion', {id: i.id});
  const actions = (m?.actions || []).filter(a => a.type !== 'consent_check').map(a => `${a.type}@${a.time}${a.end ? '-' + a.end : ''}`).slice(0, 8);
  add('Motion · recorded sites', i, {motion: {video: m?.url || null, duration: m?.duration, highlight: m?.highlight ? `${m.highlight.start}-${m.highlight.end}s` : null,
    fps: m?.cadence?.framesPerSecondDuringScroll, canvases: m?.renderProfile?.canvases?.length || 0, pinned: m?.renderProfile?.pinned || 0,
    actions, scenes: (m?.scenes || []).slice(0, 4).map(x => x.path)}});
}
for (const q of plan.motion) for (const i of ((await call('search_designs', {family: 'motion', q, limit: 3})).items || [])) add(`Motion · ${q}`, i);
// 5b. Imported app and product-UI designs for app surfaces (Dribbble-grade dashboards, tables, admin screens).
for (const q of plan.designs || []) for (const fam of ['apps', 'sections']) for (const i of ((await call('search_designs', {family: fam, q, limit: 3})).items || [])) add(`Designs · ${q}`, i);
// 6. App screens and flows when the surface is an app.
for (const q of plan.apps) {
  const r = await call('search_app_screens', {q, limit: 4, inline: false});
  for (const i of (r.items || r.screens || [])) add(`App screens · ${q}`, {...i, id: i.id || `${i.app_id}:${i.index}`, brand: i.appName, title: `${i.title || ''}${i.flow ? ' · ' + i.flow : ''}`, posterUrl: i.url, site: i.appName});
}
// 7. Measured design evidence for the strongest few websites.
const measured = pack.filter(p => /Curated pages|Named leaders|Category websites|Pages/.test(p.group) && p.id).slice(0, 5);
for (const p of measured) {
  const d = await call('get_design', {id: p.id, length: 2500});
  p.design = typeof d === 'string' ? d.slice(0, 1600) : JSON.stringify(d).slice(0, 1600);
}

// Posters, downloaded now because their URLs expire.
let n = 0;
for (const p of pack) {
  p.n = ++n;
  if (!p.poster) continue;
  try {
    const r = await fetch(p.poster, {headers: {'User-Agent': 'Mozilla/5.0'}});
    if (!r.ok) continue;
    const ext = (r.headers.get('content-type') || '').includes('png') ? 'png' : (r.headers.get('content-type') || '').includes('jpeg') ? 'jpg' : 'webp';
    const file = join(imgDir, `${String(p.n).padStart(2, '0')}.${ext}`);
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    p.image = `img/${String(p.n).padStart(2, '0')}.${ext}`;
  } catch {}
}

const barDir = join(out, 'bar');
mkdirSync(barDir, {recursive: true});
for (const p of pack.filter(x => x.group.startsWith('Bar') && x.image)) copyFileSync(join(out, p.image), join(barDir, `${(p.brand || p.n).toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')}${p.image.slice(p.image.lastIndexOf('.'))}`));
const groups = [...new Set(pack.map(p => p.group))];
const md = [`# Research pack · ${type}${terms.length ? ' · ' + terms.join(', ') : ''}`, '',
  `${pack.length} references from Seenry MCP (${calls} calls). Look at contact.png, then open the images you shortlist at full size. The library is lexical and alphabetical; every group below mixes rated picks, category matches and random samples, so judge each image yourself. Media URLs expire; the images in img/ are private working copies, never shipped.`, ''];
for (const g of groups) {
  md.push(`## ${g}`, '');
  for (const p of pack.filter(x => x.group === g)) {
    md.push(`- **${p.n}. ${p.brand || p.title}**${p.title && p.brand && p.title !== p.brand ? ` — ${p.title}` : ''}${p.section ? ` · ${p.section}` : ''}${p.rating ? ` · rated ${p.rating}/5` : ''}${p.image ? ` · ${p.image}` : ''}`);
    if (p.url || p.source) md.push(`  ${[p.url, p.source].filter(Boolean).join(' · ')} · id ${p.id}`);
    if (p.tags?.length) md.push(`  tags: ${p.tags.slice(0, 8).join(', ')}`);
    if (p.motion) md.push(`  motion: ${p.motion.duration ? Math.round(p.motion.duration) + 's walkthrough' : 'recording'}; most movement at ${p.motion.highlight || '?'}; ${p.motion.fps ?? '?'} fps while scrolling; ${p.motion.canvases} canvas, ${p.motion.pinned} pinned; actions ${p.motion.actions.join(' ')}${p.motion.video ? `\n  video (expires): ${p.motion.video}` : ''}`);
    if (p.design) md.push(`  measured: ${p.design.replace(/\s+/g, ' ').slice(0, 900)}`);
  }
  md.push('');
}
md.push('## Use it', '', '1. Shortlist 3 references for the bar (copy their images into .seenry/refs/) and 2 for motion; say why for each in DESIGN.md.',
  '2. Motion: download the 2 motion videos now (they expire) and extract frames around the most-movement window with `python3 <skills>/seenry-motion/scripts/video_frames.py`; read the durations, easing, stagger and triggers off the frames into `.seenry/motion.md` (see seenry-motion references/video-study.md). Motion design clips are studied the same way.',
  '3. Record which references you rejected and why, and the brands you discovered.');
writeFileSync(join(out, 'pack.md'), md.join('\n'));
writeFileSync(join(out, 'pack.json'), JSON.stringify(pack, null, 2));

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch { return null; }
}
const pw = await loadPlaywright();
if (pw) {
  const cells = pack.filter(p => p.image).map(p => `<figure><img src="${p.image}"><figcaption>${p.n}. ${(p.brand || p.title).replace(/</g, '')} · ${p.group}</figcaption></figure>`).join('');
  const b = await pw.chromium.launch();
  const page = await b.newPage({viewport: {width: 1600, height: 900}});
  writeFileSync(join(out, 'contact.html'), `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#eee;font:12px system-ui;display:grid;grid-template-columns:repeat(5,1fr);gap:12px}figure{margin:0;background:#fff;border-radius:6px;overflow:hidden}img{width:100%;height:190px;object-fit:cover;object-position:top;display:block}figcaption{padding:6px 8px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>${cells}`);
  await page.goto(pathToFileURL(join(out, 'contact.html')).href, {waitUntil: 'load'});
  await page.screenshot({path: join(out, 'contact.png'), fullPage: true});
  await b.close();
}
console.log(`${pack.length} references in ${groups.length} groups, ${pack.filter(p => p.image).length} images, ${calls} MCP calls.`);
console.log(`Read ${join(out, 'pack.md')} and look at ${pw ? join(out, 'contact.png') : 'the images in ' + imgDir}.`);
