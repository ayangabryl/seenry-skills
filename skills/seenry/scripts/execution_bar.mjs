#!/usr/bin/env node
/** Execution bar: what good references could not fix. A page composed from memory came back with one bar chart in a
 *  box, three status colours on a one-hue page and a three-line headline, while its references showed a whole app, charts
 *  in the brand's own form and one hue. review_board.mjs runs collectExecution in the page and judgeExecution on the
 *  result; check.mjs and canvas.mjs use teardownProblems before any option is shown.
 *
 *  node execution_bar.mjs <url | file.html> [--teardown .seenry/teardown.md] [--allow multiHue,bigHead] [--json] [--playwright path]
 *
 *  Product inventory: inside the largest element marked data-seenry-product, the distinct kinds of UI present, from a
 *  fixed catalogue (KINDS). Under 12 kinds, or under 2 kinds of visualisation, is a thin product view.
 *  Hues: saturated colours of everything that is not an image, weighted by area and grouped into hue families.
 *  Headline: the first h1 at 1200px or wider: more than two lines, or over 80px.
 *  Whole page: one image crop repeated in three sibling tiles, sections of only equal cards, and one grid: a block
 *  wider than the edges most blocks share needs data-seenry-inset="<reason>" (three sections once sat 96px wide
 *  because a section's padding shorthand overrode the frame's side padding). */
import {existsSync, readFileSync, realpathSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

export const KINDS = ['side navigation', 'tabs or segmented control', 'search', 'breadcrumb or top bar', 'avatars', 'status or sync line', 'primary action', 'secondary action', 'count badge', 'keyboard hint', 'metric cards', 'chart', 'mini visual', 'legend', 'value axis', 'tooltip or selected state', 'toggle', 'list or table rows', 'date or filter control', 'icons'];
export const INVENTORY_FLOOR = 12, VIS_FLOOR = 2, HEAD_LINES = 2, HEAD_SIZE = 80;

// Runs inside the page; must stay self-contained.
export function collectExecution() {
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const cls = el => (typeof el.className === 'string' ? el.className : el.className?.baseVal || '').toLowerCase();
  const label = el => `${cls(el)} ${el.getAttribute('role') || ''} ${el.getAttribute('aria-label') || ''} ${el.id || ''}`.toLowerCase();
  const stages = [...document.querySelectorAll('[data-seenry-product]')].filter(visible).sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height);
  let product = null;
  if (stages.length) {
    const root = stages[0], all = [...root.querySelectorAll('*')].filter(visible), kinds = new Set(), vis = new Set();
    const has = (sel, test) => { let list = []; try { list = [...root.querySelectorAll(sel)].filter(visible); } catch {} return test ? list.some(test) : list.length > 0; };
    const named = re => all.some(el => re.test(label(el)));
    const text = el => (el.textContent || '').trim();
    const controls = all.filter(el => el.matches('button, a, [role=button], input[type=button], input[type=submit]') || /\b(btn|button|chip|cta)\b/.test(cls(el)));
    const filled = el => { const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || []; return m.length < 4 || Number(m[3]) > 0.5; };
    if (has('aside, nav, [role=navigation]', el => el.querySelectorAll('a, button, li, [role=link]').length >= 3)) kinds.add('side navigation');
    if (has('[role=tablist], [role=tab], [role=radiogroup]') || named(/\b(tabs?|seg|segmented|switcher)\b/)) kinds.add('tabs or segmented control');
    if (has('input[type=search], [role=search], [role=searchbox]') || named(/search/)) kinds.add('search');
    if (has('[aria-label*=readcrumb i]') || named(/crumb|topbar|toolbar|\bbar\b|header/) || has('header')) kinds.add('breadcrumb or top bar');
    const round = all.filter(el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width >= 16 && r.width <= 44 && Math.abs(r.width - r.height) < 2 && parseFloat(s.borderTopLeftRadius) >= r.width / 2 - 1 && (el.tagName === 'IMG' || s.backgroundImage !== 'none' || filled(el)) && !text(el); });
    if (named(/avatar|\bavs?\b|people|member/) || round.length >= 2) kinds.add('avatars');
    if (named(/status|sync|saved|live|updated|state\b/) || all.some(el => /^(synced|saved|updated|live|refreshed)\b/i.test(text(el)) && text(el).length < 40)) kinds.add('status or sync line');
    const solid = controls.filter(filled), quietControls = controls.filter(el => !filled(el) || getComputedStyle(el).boxShadow !== 'none' || parseFloat(getComputedStyle(el).borderTopWidth) > 0);
    const fills = new Set(solid.map(el => getComputedStyle(el).backgroundColor));
    if (solid.length) kinds.add('primary action');
    if (quietControls.length || fills.size > 1) kinds.add('secondary action');
    if (named(/badge|count|pill\b/) || all.some(el => /^\d{1,3}$/.test(text(el)) && !el.children.length && parseFloat(getComputedStyle(el).borderTopLeftRadius) >= 6 && filled(el) && el.getBoundingClientRect().width <= 32)) kinds.add('count badge');
    if (has('kbd')) kinds.add('keyboard hint');
    const figure = el => /^[−+\-–]?[$€£]?\d[\d.,]*\s?(%|[kmb]|bn|wk|weeks?|days?|hrs?|min)?$/i.test(text(el).split(/\s{2,}|\n/)[0]) && parseFloat(getComputedStyle(el).fontSize) >= 18;
    const groups = new Map();
    for (const el of all.filter(figure)) { let p = el.parentElement; while (p && p !== root && p.parentElement && p.parentElement.children.length < 3) p = p.parentElement; const g = p && p.parentElement; if (g) groups.set(g, (groups.get(g) || 0) + 1); }
    if ([...groups.values()].some(n => n >= 3)) kinds.add('metric cards');
    for (const svg of root.querySelectorAll('svg, canvas')) {
      if (!visible(svg)) continue;
      const r = svg.getBoundingClientRect(); if (r.width < 28 || r.height < 14) continue;
      const big = r.width >= 200 && r.height >= 80;
      if (svg.tagName.toLowerCase() === 'canvas') { vis.add(big ? 'canvas chart' : 'canvas mini'); continue; }
      const paths = [...svg.querySelectorAll('path, polyline')], d = paths.map(p => p.getAttribute('d') || p.getAttribute('points') || '').join(' ');
      const rects = svg.querySelectorAll('rect').length, arcs = /[Aa]\s*[\d.]/.test(d) || [...svg.querySelectorAll('circle')].some(c => c.getAttribute('stroke-dasharray'));
      if (!paths.length && rects < 3 && !arcs) continue;
      const form = arcs ? 'gauge' : rects >= 3 ? 'bars' : /[CcSsQqTt]/.test(d) || paths.some(p => p.tagName.toLowerCase() === 'polyline') ? 'curve' : 'line';
      if (form === 'line' && !big) continue;
      vis.add(`${big ? 'chart' : 'mini'}: ${form}`);
    }
    // Charts built from HTML: a row of four or more small childless marks (sticks, ticks, blocks, bars).
    for (const el of all) {
      const marks = [...el.children].filter(c => !c.children.length && !text(c) && visible(c) && filled(c));
      if (marks.length < 4 || marks.length < el.children.length * 0.6) continue;
      const w = marks.map(c => c.getBoundingClientRect().width), h = marks.map(c => c.getBoundingClientRect().height);
      if (Math.max(...w) > 48) continue;
      const varied = Math.max(...h) - Math.min(...h) > 2, wide = el.getBoundingClientRect().width >= 200;
      vis.add(`${wide ? 'chart' : 'mini'}: ${Math.max(...w) <= 3 ? 'ticks' : varied ? (Math.max(...w) <= 6 ? 'sticks' : 'bars') : 'blocks'}`);
    }
    if ([...vis].some(v => v.startsWith('chart') || v.startsWith('canvas chart'))) kinds.add('chart');
    if ([...vis].some(v => v.startsWith('mini') || v.startsWith('canvas mini'))) kinds.add('mini visual');
    if (named(/legend|\bleg\b|\bkey\b/)) kinds.add('legend');
    if (named(/axis|\byax\b|\bxax\b|ticks?\b|weeks\b/) || has('svg text', el => /^[$€£]?\d/.test(text(el)))) kinds.add('value axis');
    if (has('[role=tooltip], [aria-selected=true], [aria-current], [aria-pressed=true]') || named(/tooltip|\btip\b|popover|selected|\bactive\b|\bon\b|current/)) kinds.add('tooltip or selected state');
    if (has('[role=switch], input[type=checkbox], input[type=radio]') || named(/toggle|switch|\btg\b/)) kinds.add('toggle');
    const rows = new Map();
    for (const el of all) { if (!el.children.length || !text(el)) continue; const p = el.parentElement; if (!p) continue; const r = el.getBoundingClientRect(); const k = `${Math.round(r.width / 8)}`; const m = rows.get(p) || {}; m[k] = (m[k] || 0) + 1; rows.set(p, m); }
    if (has('table, [role=row], [role=listitem], li') || [...rows.values()].some(m => Object.values(m).some(n => n >= 3))) kinds.add('list or table rows');
    if (has('select, input[type=date], [role=combobox]') || named(/date|range|filter|picker|select|dropdown/) || all.some(el => /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b.{0,12}[–-]/i.test(text(el)) && text(el).length < 30)) kinds.add('date or filter control');
    if ([...root.querySelectorAll('svg')].filter(s => visible(s) && s.getBoundingClientRect().width <= 24).length >= 3) kinds.add('icons');
    const r = root.getBoundingClientRect();
    product = {el: root.tagName.toLowerCase() + (cls(root) ? '.' + cls(root).split(/\s+/)[0] : ''), w: Math.round(r.width), h: Math.round(r.height), kinds: [...kinds], vis: [...vis]};
  }
  // Hues: every painted colour that is not an image, weighted by the area it covers.
  const hues = [], productHues = [], stage = stages[0] || null;
  let bucket = hues;
  // Computed colours come back as rgb(), oklch() or color(); a 1px canvas turns any of them into sRGB bytes.
  const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently: true}), seen = new Map();
  const bytes = color => { if (!seen.has(color)) { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); seen.set(color, [...ctx.getImageData(0, 0, 1, 1).data]); } return seen.get(color); };
  const add = (color, weight) => {
    if (!color || color === 'none' || color === 'transparent') return;
    const px = bytes(String(color)); if (px[3] / 255 < 0.5) return;
    const [r, g, b] = px.slice(0, 3).map(v => v / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (d < 0.16) return;
    const s = d / (1 - Math.abs(2 * l - 1) || 1); if (s < 0.35 || l < 0.12 || l > 0.92) return;
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h = Math.round(((h * 60) + 360) % 360);
    bucket.push([h, Math.round(weight)]);
    if (bucket !== hues) hues.push([h, Math.round(weight)]);
  };
  const nodes = [...document.body.querySelectorAll('*')].slice(0, 6000);
  for (const el of nodes) {
    const tag = el.tagName.toLowerCase();
    if (['img', 'video', 'canvas', 'picture', 'script', 'style', 'iframe'].includes(tag) || !visible(el)) continue;
    const s = getComputedStyle(el), r = el.getBoundingClientRect(), area = Math.min(r.width * r.height, 1440 * 900);
    bucket = stage && stage.contains(el) ? productHues : hues;
    if (/url\(/.test(s.backgroundImage)) continue;
    if (el.closest('svg')) { if (tag !== 'svg') { if (s.fill !== 'none') add(s.fill, Math.max(area, 60)); if (s.stroke !== 'none') add(s.stroke, Math.max((r.width + r.height) * 3, 60)); } continue; }
    add(s.backgroundColor, area);
    const grad = s.backgroundImage.match(/(?:rgba?|oklch|oklab|lab|lch|hsla?|color)\((?:[^()]|\([^()]*\))*\)/g); if (grad) add(grad[0], area);
    if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) add(s.color, area * 0.12);
  }
  const h1 = [...document.querySelectorAll('h1')].find(visible);
  let head = null;
  if (h1) { const s = getComputedStyle(h1), size = parseFloat(s.fontSize), lh = parseFloat(s.lineHeight) || size * 1.1; head = {size: Math.round(size), weight: Number(s.fontWeight) || 400, lines: Math.max(1, Math.round(h1.getBoundingClientRect().height / lh)), text: (h1.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)}; }
  const chart = [...document.querySelectorAll('svg, canvas')].some(el => { const r = el.getBoundingClientRect(); return visible(el) && r.width >= 200 && r.height >= 80 && (el.tagName.toLowerCase() === 'canvas' || el.querySelector('path, polyline, rect')); });
  // Whole page: the same image at the same crop in three sibling tiles, and sections below the first screen that are
  // only a heading, a paragraph and equal cards. Both read as a template however good the hero is.
  const big = el => { const r = el.getBoundingClientRect(); return r.width >= 120 && r.height >= 80; };
  const crops = new Map();
  for (const img of [...document.body.querySelectorAll('*')].slice(0, 6000)) {
    if (!visible(img) || !big(img)) continue;
    const s = getComputedStyle(img), r = img.getBoundingClientRect(), painted = (s.backgroundImage.match(/url\(["']?([^"')]+)/) || [])[1];
    const src = img.tagName === 'IMG' ? img.currentSrc || img.src : painted; if (!src) continue;
    const crop = img.tagName === 'IMG' ? s.objectPosition : `${s.backgroundPosition} ${s.backgroundSize}`;
    const key = `${src}|${crop}|${Math.round(Math.log(r.width / r.height) / Math.log(1.15))}`;
    (crops.get(key) || crops.set(key, []).get(key)).push(img);
  }
  const sameCrop = [];
  for (const [key, imgs] of crops) {
    if (imgs.length < 3) continue;
    const under = new Map();
    for (const img of imgs) for (let a = img; a.parentElement && a.parentElement !== document.documentElement; a = a.parentElement) { const set = under.get(a.parentElement) || under.set(a.parentElement, new Set()).get(a.parentElement); set.add(a); }
    const hit = [...under].filter(([, kids]) => kids.size >= 3).map(([p, kids]) => ({p, kids: [...kids]})).filter(({kids}) => { const tops = kids.map(k => Math.round(k.getBoundingClientRect().top)); return tops.some((t, i) => tops.some((u, j) => i !== j && Math.abs(t - u) < 24)); }).sort((a, b) => a.kids.length - b.kids.length)[0];
    if (hit) sameCrop.push({image: key.split('|')[0].split('/').pop().split('?')[0].slice(0, 40), tiles: hit.kids.length, where: hit.p.tagName.toLowerCase() + (cls(hit.p) ? '.' + cls(hit.p).split(/\s+/)[0] : '')});
  }
  const fold = innerHeight, plain = [];
  const blocks = [...document.querySelectorAll('section')].filter(visible);
  for (const sec of (blocks.length >= 2 ? blocks : [...(document.querySelector('main') || document.body).children].filter(visible))) {
    const r = sec.getBoundingClientRect(); if (r.top + scrollY < fold * 0.9 || r.height < 240 || sec.matches('footer') || sec.querySelector('[data-seenry-product]')) continue;
    const all = [...sec.querySelectorAll('*')].filter(visible);
    const material = all.some(el => { const tag = el.tagName.toLowerCase(), b = el.getBoundingClientRect(), s = getComputedStyle(el); return ((tag === 'img' || tag === 'video' || tag === 'canvas' || tag === 'svg' || tag === 'table') && b.width >= 96 && b.height >= 48) || (/url\(/.test(s.backgroundImage) && b.width >= 120) || (parseFloat(s.fontSize) >= 32 && !el.children.length && /^[−+\-–±]?[$€£]?\d/.test((el.textContent || '').trim()) && !el.closest('h1, h2, h3')); });
    if (material) continue;
    const cards = new Map();
    for (const el of all) { const b = el.getBoundingClientRect(), s = getComputedStyle(el); if (b.height < 120 || b.width < 160 || b.width > r.width * 0.6) continue; const boxed = s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0 || (bytes(s.backgroundColor)[3] > 127 && s.backgroundColor !== getComputedStyle(sec).backgroundColor); if (!boxed || !el.parentElement) continue; cards.set(el.parentElement, (cards.get(el.parentElement) || 0) + 1); }
    if ([...cards.values()].some(n => n >= 3)) plain.push(((sec.querySelector('h2, h3') || {}).textContent || sec.id || cls(sec).split(/\s+/)[0] || 'a section').trim().replace(/\s+/g, ' ').slice(0, 50));
  }
  // One grid: the left and right edge of what each top-level block paints, clipped by overflow, ignoring full-width layers.
  const vw = document.documentElement.clientWidth;
  const paints = el => { const tag = el.tagName.toLowerCase(), s = getComputedStyle(el); if (['img', 'video', 'canvas', 'svg', 'input', 'button', 'select', 'textarea'].includes(tag)) return true; if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return true; const a = (s.backgroundColor.match(/[\d.]+/g) || []); return (a.length < 4 ? s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent' : Number(a[3]) > 0.05) || s.backgroundImage !== 'none' || s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0; };
  // The painted extent of a block: the left-most and right-most edge of anything visible in it, clipped by any
  // ancestor that hides overflow, ignoring layers that run the full width of the viewport.
  const extent = root => {
    let left = Infinity, right = -Infinity, n = 0;
    for (const el of [root, ...root.querySelectorAll('*')].slice(0, 2500)) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      if (!visible(el) || !paints(el)) continue;
      let {left: l, right: r} = el.getBoundingClientRect();
      for (let a = el.parentElement; a && a !== root.parentElement; a = a.parentElement) { const s = getComputedStyle(a); if (s.overflowX !== 'visible' || s.overflow !== 'visible') { const b = a.getBoundingClientRect(); l = Math.max(l, b.left); r = Math.min(r, b.right); } }
      if (r - l < 4 || (l <= 1 && r >= vw - 1)) continue;
      if (l <= 1 || r >= vw - 1) { if (getComputedStyle(el).position === 'absolute' || getComputedStyle(el).position === 'fixed') continue; }
      left = Math.min(left, l); right = Math.max(right, r); n++;
    }
    return n ? {left: Math.round(left), right: Math.round(right)} : null;
  };
  const topLevel = el => el.parentElement === document.body || (el.parentElement && el.parentElement.tagName === 'MAIN' && el.parentElement.parentElement === document.body);
  const gridBlocks = [...document.querySelectorAll('header, section, footer, main > div, body > div, article')].filter(el => topLevel(el) && visible(el) && el.getBoundingClientRect().height >= 80);
  const blockName = el => ((el.querySelector('h1, h2, h3') || {}).innerText || el.id || (typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '') || el.tagName.toLowerCase()).trim().replace(/\s+/g, ' ').slice(0, 40);
  const grid = gridBlocks.map(el => ({name: blockName(el), reason: el.getAttribute('data-seenry-inset') || (el.querySelector('[data-seenry-inset]') || {getAttribute: () => ''}).getAttribute('data-seenry-inset') || '', edges: extent(el)}));
  return {width: innerWidth, product, chart, hues, productHues, head, page: {sameCrop, plain, grid, vw}};
}

const FAMILY = h => h < 15 || h >= 345 ? 'red' : h < 45 ? 'orange' : h < 70 ? 'yellow' : h < 165 ? 'green' : h < 200 ? 'teal' : h < 265 ? 'blue' : h < 300 ? 'violet' : 'pink';

/** Groups weighted hues into families (neighbours within 40 degrees merge) and keeps those covering 6% or more of the saturated area. */
export function hueFamilies(hues, floor = 0.06) {
  const total = hues.reduce((n, [, w]) => n + w, 0); if (!total) return [];
  const sorted = [...hues].sort((a, b) => a[0] - b[0]), groups = [];
  for (const [h, w] of sorted) { const g = groups[groups.length - 1]; if (g && h - g.last <= 40) { g.sum += h * w; g.weight += w; g.last = h; } else groups.push({sum: h * w, weight: w, first: h, last: h}); }
  if (groups.length > 1 && groups[0].first + 360 - groups[groups.length - 1].last <= 40) { const tail = groups.pop(); groups[0].weight += tail.weight; groups[0].sum += (tail.sum - 360 * tail.weight); }
  return groups.map(g => ({hue: Math.round(((g.sum / g.weight) + 360) % 360), share: g.weight / total})).filter(g => g.share >= floor).map(g => ({...g, name: FAMILY(g.hue)})).sort((a, b) => b.share - a.share);
}

/** thinProduct blocks; hues and headline are notes unless the level reference allows them (multiHue, bigHead). */
export function judgeExecution(data, {allow = []} = {}) {
  const allowed = new Set(allow), thinProduct = [], notes = [];
  const p = data.product;
  if (p) {
    const missing = KINDS.filter(k => !p.kinds.includes(k));
    if (p.kinds.length < INVENTORY_FLOOR) thinProduct.push(`${p.el} shows ${p.kinds.length} kinds of UI, needs ${INVENTORY_FLOOR} (has: ${p.kinds.join(', ') || 'none'}; add from: ${missing.slice(0, 8).join(', ')})`);
    if (p.vis.length < VIS_FLOOR) thinProduct.push(`${p.el} has ${p.vis.length} kind${p.vis.length === 1 ? '' : 's'} of visualisation (${p.vis.join(', ') || 'none'}), needs ${VIS_FLOOR}: give each metric card its own mini visual and the main chart a second form beside it`);
  }
  // Inside the product view a second hue shows at a far smaller share (a red line, green deltas), so its floor is 2%.
  const page = hueFamilies(data.hues || []), inProduct = hueFamilies(data.productHues || [], 0.02);
  if (!p && data.chart) notes.push('a chart is drawn but no product view is marked data-seenry-product, so its inventory was not counted: mark the element that holds the product UI');
  const families = [...page, ...inProduct.filter(f => !page.some(q => q.name === f.name)).map(f => ({...f, product: true}))];
  if (families.length > 1 && !allowed.has('multiHue')) notes.push(`${families.length} saturated hue families outside the images (${families.map(f => `${f.name} ${Math.round(f.share * 100)}%${f.product ? ' of the product view' : ''}`).join(', ')}): a one-hue page marks a state with weight, fill or the one highlight, never a second hue (needs 1) [multiHue]`);
  const h = data.head;
  if (h && data.width >= 1200 && !allowed.has('bigHead')) {
    if (h.lines > HEAD_LINES) notes.push(`the headline "${h.text}" runs ${h.lines} lines (needs ${HEAD_LINES} or fewer): shorten it or widen its column [bigHead]`);
    if (h.size > HEAD_SIZE) notes.push(`the headline is ${h.size}px (needs ${HEAD_SIZE}px or less; the references sit at 60 to 76px in a light or regular weight) [bigHead]`);
  }
  // Below the hero. The same crop in three sibling tiles blocks; a section of only equal cards is a note.
  const template = (data.page?.sameCrop || []).map(c => `${c.where} shows ${c.image} at the same crop in ${c.tiles} tiles (needs 1): give each tile its own crop (object-position and scale), or its own image, with a different mini UI in each`);
  for (const title of data.page?.plain || []) notes.push(`"${title}" is a heading, a paragraph and equal cards, with 0 moments (needs 1): bring the hero image back in a new crop, show a product moment, or lead with one measured number`);
  // One grid: every block shares the edges most blocks share, sits centred inside them, bleeds, or states its reason.
  const offGrid = [];
  const blocks = (data.page?.vw || 0) < 1200 ? [] : (data.page?.grid || []).filter(b => b.edges);
  // The grid is the pair of edges most blocks share; on a tie, the earliest block (the one holding the navigation) wins.
  const count = new Map();
  for (const b of blocks) { const k = `${b.edges.left},${b.edges.right}`; count.set(k, (count.get(k) || 0) + 1); }
  const best = [...count].sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] >= 2) {
  const [gl, gr] = best[0].split(',').map(Number), grid = {left: gl, right: gr};
  for (const b of blocks) {
    if (b.reason.trim().length >= 3) continue;
    const dl = b.edges.left - grid.left, dr = grid.right - b.edges.right;
    // Inside the grid is fine when it shares an edge (a left-aligned column) or is centred; outside it never is.
    if (dl >= -2 && dr >= -2 && (dl <= 2 || dr <= 2 || Math.abs(dl - dr) <= 4)) continue;
    offGrid.push(`Section "${b.name}" is ${b.edges.right - b.edges.left} wide (${b.edges.left} to ${b.edges.right}); the grid is ${grid.right - grid.left} (${grid.left} to ${grid.right}). Align it or add data-seenry-inset with the reason.`);
  }
  }
  return {thinProduct, template, offGrid, notes, families};
}

/** The hero image and where it returns. Runs inside the page; must stay self-contained. An image counts as the hero
 *  when it paints a tenth or more of the first screen. `flat` is true for a block of colour or a plain gradient,
 *  measured on a 48px copy. */
export async function collectHero() {
  const vw = innerWidth, vh = innerHeight;
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const painted = [];
  for (const el of [...document.body.querySelectorAll('*')].slice(0, 6000)) {
    if (!visible(el)) continue;
    const tag = el.tagName.toLowerCase(), s = getComputedStyle(el), r = el.getBoundingClientRect();
    if (r.width < 80 || r.height < 60) continue;
    const urls = tag === 'img' ? [el.currentSrc || el.src] : tag === 'image' ? [new URL(el.getAttribute('href') || el.getAttribute('xlink:href') || '', document.baseURI).href] : [...s.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => new URL(m[1], document.baseURI).href);
    const top = r.top + scrollY, shown = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(top + r.height, vh) - Math.max(top, 0));
    for (const url of urls) if (url && !/^data:/.test(url)) painted.push({url, top: Math.round(top), w: Math.round(r.width), h: Math.round(r.height), share: shown / (vw * vh), motif: !!el.closest('[data-seenry-motif]')});
  }
  const stats = new Map();
  const measure = url => new Promise(done => {
    const img = new Image();
    img.onload = () => { try {
      const c = document.createElement('canvas'), n = 48; c.width = c.height = n;
      const ctx = c.getContext('2d', {willReadFrequently: true}); ctx.drawImage(img, 0, 0, n, n);
      const d = ctx.getImageData(0, 0, n, n).data, lum = [], colours = new Set();
      for (let i = 0; i < d.length; i += 4) { lum.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]); colours.add((d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | d[i + 2] >> 4); }
      // Texture: the share of pixels where brightness bends (a second difference over 3). A block of colour, bands
      // and any smooth gradient bend almost nowhere; a photograph or a painting bends across much of the frame.
      let bent = 0;
      for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) { const i = y * n + x; if (Math.max(Math.abs(lum[i - 1] - 2 * lum[i] + lum[i + 1]), Math.abs(lum[i - n] - 2 * lum[i] + lum[i + n])) > 3) bent++; }
      const texture = Math.round(bent / ((n - 2) * (n - 2)) * 1000) / 1000;
      done({colours: colours.size, texture, flat: colours.size < 6 || texture < 0.03, width: img.naturalWidth});
    } catch { done({unread: true}); } };
    img.onerror = () => done({missing: true});
    img.src = url;
  });
  const first = painted.filter(p => p.top < vh * 0.9 && p.share >= 0.1).sort((a, b) => b.share - a.share);
  for (const p of first.slice(0, 6)) if (!stats.has(p.url)) stats.set(p.url, await measure(p.url));
  const candidates = first.slice(0, 6).map(p => ({...p, ...stats.get(p.url), returns: painted.filter(q => q.top >= vh && q.url === p.url && q.w >= 120).length}));
  const motifs = [...document.querySelectorAll('[data-seenry-motif]')].filter(el => { if (!visible(el)) return false; const r = el.getBoundingClientRect(); return r.top + scrollY >= vh && r.width >= 120 && r.height >= 60 && (el.matches('img, svg, canvas, video') || el.querySelector('img, svg, canvas, video') || /url\(/.test(getComputedStyle(el).backgroundImage)); }).length;
  const gradient = [...document.body.querySelectorAll('*')].slice(0, 3000).some(el => { const r = el.getBoundingClientRect(); return r.top < vh && r.width * r.height >= vw * vh * 0.1 && /gradient\(/.test(getComputedStyle(el).backgroundImage); });
  return {vw, vh, height: document.documentElement.scrollHeight, candidates, motifs, gradient};
}

const RASTER = /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/i;
/** What blocks, in one line each. `own(url)` says whether the file is the project's own (on the canvas: a file that
 *  exists in the canvas folder). sketch: the hero must hold a real image. full: it must come back below the hero. */
export function judgeHero(data, {sketch = false, full = false, own = () => true} = {}) {
  const out = {noImage: [], noReturn: [], notes: []};
  const real = c => RASTER.test(c.url) && !c.flat && !c.missing && own(c.url);
  const hero = (data.candidates || []).find(real) || null, name = u => decodeURIComponent(String(u).split('/').pop().split(/[?#]/)[0]);
  if ((sketch || full) && !hero) {
    const c = (data.candidates || [])[0];
    out.noImage.push(!c ? `the first screen holds 0 images covering a tenth of it or more (needs 1)${data.gradient ? '; a CSS gradient is not an image' : ''}`
      : c.missing || !own(c.url) ? `${name(c.url)} is not a file in the project (needs 1 image that exists)`
      : c.flat ? `${name(c.url)} is a flat block or a plain gradient (${c.colours} colours, ${Math.round((c.texture || 0) * 100)}% textured), a placeholder (needs 1 generated or own image)`
      : `${name(c.url)} is not a photograph or generated image file (needs png, jpg, webp or avif)`);
  }
  if (full && hero && data.height >= data.vh * 2.5) {
    const n = (hero.returns || 0) + (data.motifs || 0);
    if (!n) out.noReturn.push(`the hero image ${name(hero.url)} returns 0 times below the first screen (needs 1 or more): bring it back in a new crop behind a lower section and in the closing, or mark the element that carries its motif data-seenry-motif`);
    else if (n === 1) out.notes.push(`the hero image or its motif returns once below the first screen; pages that hold one idea to the footer bring it back in three places`);
  }
  return {...out, hero: hero ? name(hero.url) : null};
}

const TOPICS = [['UI element count', /\b\d+\s+(distinct\s+)?(ui\s+)?(elements?|controls?|kinds)\b|ui elements?\s*[:|]\s*\d/i], ['visualisation types', /visuali[sz]ation|chart (form|type)s?|mini[- ]visual/i], ['headline size, weight and lines', /headline[^\n]*\d+\s*px|\d+\s*px[^\n]*headline/i], ['hues', /\bhues?\b/i], ['image and UI interlock', /interlock|in front of|overlap|melts?|sinks?|layered/i], ['repeating motif', /motif|repeats?|continues/i], ['logo treatment', /logos?/i], ['button and pill details', /button|pill|tab/i]];

/** What a real teardown holds: a section per reference, each with numbers, covering the measured topics. */
export function teardownProblems(text, {minReferences = 2} = {}) {
  if (!text || !text.trim()) return ['it does not exist'];
  const problems = [];
  // An unfilled template says one thing: fill it. The finer checks only help once the blanks are gone.
  const blanks = (text.match(/__/g) || []).length;
  if (blanks) return [`${blanks} blank${blanks === 1 ? '' : 's'} (__) still to replace with a count or a measurement read from the crops (needs 0)`];
  const sections = text.split(/^#{2,3}\s+/m).slice(1).filter(s => s.trim().length > 120);
  if (sections.length < minReferences) problems.push(`${sections.length} reference section${sections.length === 1 ? '' : 's'} with measurements; write one per studied reference (at least ${minReferences})`);
  const thin = sections.filter(s => (s.match(/\b\d+(\.\d+)?\s?(px|%|lines?|elements?|kinds?|types?|hues?|x|×)?\b/g) || []).length < 5).length;
  if (thin) problems.push(`${thin} reference section${thin === 1 ? ' has' : 's have'} fewer than five numbers: count and measure, do not describe`);
  const missing = TOPICS.filter(([, re]) => !re.test(text)).map(([name]) => name);
  if (missing.length > 1) problems.push(`not measured: ${missing.join(', ')}`);
  return problems;
}

const real = p => { try { return realpathSync(p); } catch { return resolve(p); } };
const isMain = process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2), flag = (n, f) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : f; };
  const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  const teardown = flag('teardown');
  const out = {};
  if (teardown) out.teardown = teardownProblems(existsSync(teardown) ? readFileSync(teardown, 'utf8') : '');
  if (target) {
    const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
    let mod = null;
    for (const load of [() => explicit && import(pathToFileURL(resolve(explicit)).href), () => import(pathToFileURL(createRequire(join(process.cwd(), 'noop.js')).resolve('playwright')).href), () => import('playwright')]) { try { mod = await load(); if (mod) break; } catch {} }
    if (!mod) { console.error('Playwright not found. Install it (npm i -D playwright && npx playwright install chromium) or pass --playwright.'); process.exit(2); }
    const chromium = mod.chromium || mod.default?.chromium;
    const browser = await chromium.launch({headless: true, args: ['--allow-file-access-from-files'], ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    await page.goto(/^https?:/.test(target) ? target : pathToFileURL(resolve(target)).href, {waitUntil: 'networkidle'});
    const data = await page.evaluate(collectExecution);
    await browser.close();
    Object.assign(out, {product: data.product, head: data.head, ...judgeExecution(data, {allow: String(flag('allow', '')).split(',').map(s => s.trim()).filter(Boolean)})});
  }
  if (args.includes('--json')) console.log(JSON.stringify(out, null, 2));
  else {
    if (out.teardown) console.log(out.teardown.length ? `Teardown ${teardown}: ${out.teardown.join('; ')}` : `Teardown ${teardown}: holds measurements per reference.`);
    if (out.product) console.log(`Product view ${out.product.el}: ${out.product.kinds.length} kinds of UI, ${out.product.vis.length} kinds of visualisation (${out.product.vis.join(', ') || 'none'}).`);
    else if (target) console.log('No element is marked data-seenry-product.');
    for (const t of [...(out.thinProduct || []), ...(out.template || []), ...(out.offGrid || [])]) console.log(`BLOCK  ${t}`);
    for (const n of out.notes || []) console.log(`note   ${n}`);
  }
  process.exit((out.teardown?.length || out.thinProduct?.length || out.template?.length || out.offGrid?.length) ? 1 : 0);
}
