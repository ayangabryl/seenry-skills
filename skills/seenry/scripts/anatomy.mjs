#!/usr/bin/env node
/** Capture a component's anatomy: a clean shot and an annotated one showing the 8px grid, safe area (padding),
 *  text measured from cap height to baseline with its size/weight, media and control boxes, and the keylines
 *  that two or more elements share. Works on any page (URL or HTML file). Needs Playwright.
 *
 *  node anatomy.mjs <url | file.html> --selector ".card" [--out shots/card] [--width 1440] [--scheme light]
 *                   [--playwright /path/to/playwright/index.mjs]
 *  Writes <out>.png (clean) and <out>-anatomy.png (annotated) at 2x. */
import {resolve, join, dirname} from 'node:path';
import {mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const selector = flag('selector');
if (!target || !selector) { console.error('Usage: node anatomy.mjs <url | file.html> --selector ".card" [--out shots/card]'); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
const out = resolve(flag('out', 'anatomy'));
mkdirSync(dirname(out), {recursive: true});

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found. Install it (npm i -D playwright && npx playwright install chromium) or pass --playwright.');
  process.exit(2);
}

function annotate(sel) {
  const host = document.querySelector(sel);
  if (!host) throw new Error(`No element matches ${sel}`);
  host.scrollIntoView({block: 'center'});
  const hb = host.getBoundingClientRect(), hs = getComputedStyle(host);
  const px = v => parseFloat(v) || 0, round = v => Math.round(v * 10) / 10;
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0 && !el.closest('[aria-hidden="true"]:not(svg)'); };
  const layer = document.createElement('div');
  layer.setAttribute('data-seenry-anatomy', '');
  Object.assign(layer.style, {position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 2147483647, font: '500 10px/12px ui-monospace,SFMono-Regular,Menlo,monospace'});
  document.body.append(layer);
  const box = (x, y, w, h, style) => { const d = document.createElement('div'); Object.assign(d.style, {position: 'fixed', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', ...style}); layer.append(d); return d; };
  const tag = (x, y, text, color) => { const d = box(x, y, 0, 0, {width: 'auto', height: 'auto', padding: '1px 4px', borderRadius: '4px', background: color, color: '#fff', whiteSpace: 'nowrap'}); d.textContent = text; return d; };

  // 0. Veil everything outside the component so the annotated piece stands alone
  const veil = {background: 'rgb(250 250 250 / .92)'};
  box(0, 0, innerWidth, hb.top, veil); box(0, hb.bottom, innerWidth, innerHeight - hb.bottom, veil);
  box(0, hb.top, hb.left, hb.height, veil); box(hb.right, hb.top, innerWidth - hb.right, hb.height, veil);
  // 1. 8px grid over the component
  box(hb.left, hb.top, hb.width, hb.height, {backgroundImage: 'linear-gradient(to right, rgb(0 120 255 / .12) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 120 255 / .12) 1px, transparent 1px)', backgroundSize: '8px 8px', borderRadius: hs.borderRadius});
  // 2. Safe area
  const pad = {t: px(hs.paddingTop) + px(hs.borderTopWidth), r: px(hs.paddingRight) + px(hs.borderRightWidth), b: px(hs.paddingBottom) + px(hs.borderBottomWidth), l: px(hs.paddingLeft) + px(hs.borderLeftWidth)};
  if (pad.t || pad.r || pad.b || pad.l) {
    box(hb.left + pad.l, hb.top + pad.t, hb.width - pad.l - pad.r, hb.height - pad.t - pad.b, {outline: '1px dashed rgb(255 0 128 / .85)', outlineOffset: '-1px', background: 'rgb(255 0 128 / .04)'});
    if (pad.l) tag(hb.left + 2, hb.top + hb.height / 2 - 6, round(pad.l), 'rgb(255 0 128)');
    if (pad.t) tag(hb.left + hb.width / 2 - 8, hb.top + 2, round(pad.t), 'rgb(255 0 128)');
  }
  tag(hb.left, hb.top - 16, `${px(hs.borderTopLeftRadius) >= 999 ? 'pill' : 'r' + round(px(hs.borderTopLeftRadius))} · ${Math.round(hb.width)}×${Math.round(hb.height)}`, '#272727');

  // 3. Items
  const ctx = document.createElement('canvas').getContext('2d');
  const items = [];
  for (const el of [host, ...host.querySelectorAll('*')]) {
    if (el.closest('svg') || !visible(el)) continue;
    const s = getComputedStyle(el);
    const text = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (text.length) {
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const m = ctx.measureText(text.map(n => n.textContent).join('').trim()), cap = ctx.measureText('H').actualBoundingBoxAscent;
      const range = document.createRange(); range.setStart(text[0], 0); range.setEnd(text[text.length - 1], text[text.length - 1].textContent.length);
      const lines = [...range.getClientRects()].filter(r => r.width > 0);
      if (lines.length) {
        const lh = px(s.lineHeight) || lines[0].height;
        const base = r => r.top - (lh - r.height) / 2 + (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
        const top = base(lines[0]) - cap, bottom = base(lines[lines.length - 1]);
        const left = Math.min(...lines.map(r => r.left)), right = Math.max(...lines.map(r => r.right));
        items.push({kind: 'text', left, right, top, bottom, label: `${round(px(s.fontSize))}/${s.fontWeight}`});
      }
    }
    if (el === host) continue;
    const media = ['IMG', 'VIDEO', 'CANVAS', 'PICTURE'].includes(el.tagName) || s.backgroundImage !== 'none';
    const control = el.matches('button,a[href],input,select,textarea,[role="button"],[role="switch"],[role="tab"]');
    const painted = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || px(s.borderTopWidth) > 0 || (s.boxShadow && s.boxShadow !== 'none');
    if (media || control || (painted && el.parentElement === host)) {
      const r = el.getBoundingClientRect();
      items.push({kind: media ? 'media' : control ? 'control' : 'shape', left: r.left, right: r.right, top: r.top, bottom: r.bottom, label: px(s.borderTopLeftRadius) >= 999 ? 'pill' : px(s.borderTopLeftRadius) ? `r${round(px(s.borderTopLeftRadius))}` : ''});
    }
  }
  for (const svg of host.querySelectorAll('svg')) {
    if (!visible(svg)) continue;
    const shapes = [...svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon')].map(e => e.getBoundingClientRect()).filter(r => r.width || r.height);
    if (shapes.length) items.push({kind: 'glyph', left: Math.min(...shapes.map(r => r.left)), right: Math.max(...shapes.map(r => r.right)), top: Math.min(...shapes.map(r => r.top)), bottom: Math.max(...shapes.map(r => r.bottom)), label: ''});
  }
  const colors = {text: 'rgb(0 160 90', media: 'rgb(0 110 255', control: 'rgb(255 140 0', shape: 'rgb(140 90 255', glyph: 'rgb(255 140 0'};
  const labelled = new Set();
  for (const it of items) {
    const c = colors[it.kind];
    box(it.left, it.top, it.right - it.left, it.bottom - it.top, {background: `${c} / .10)`, outline: `1px solid ${c} / .7)`, outlineOffset: '-1px'});
    // One label per distinct style, so the annotation reads as a spec rather than covering the design.
    const key = it.kind + it.label;
    if (it.label && it.kind !== 'glyph' && !labelled.has(key)) {
      labelled.add(key);
      const t = tag(0, 0, it.label, `${c})`);
      const w = t.getBoundingClientRect().width;
      const x = it.right + 4 + w <= hb.right - 2 ? it.right + 4 : Math.max(hb.left + 2, it.left);
      const y = it.right + 4 + w <= hb.right - 2 ? it.top + (it.bottom - it.top) / 2 - 7 : it.top - 16;
      Object.assign(t.style, {left: x + 'px', top: y + 'px'});
    }
  }

  // 4. Keylines: edges shared by two or more items
  // A keyline is an edge where different kinds of element meet (text on an image edge, an icon on a text edge).
  const shared = (key) => {
    const lines = [];
    for (const it of items) {
      const group = items.filter(o => Math.abs(o[key] - it[key]) <= 0.75);
      if (new Set(group.map(g => g.kind === 'glyph' ? 'control' : g.kind)).size >= 2 && !lines.some(l => Math.abs(l - it[key]) <= 0.75)) lines.push(it[key]);
    }
    return lines;
  };
  for (const x of [...shared('left'), ...shared('right')]) box(x, hb.top - 8, 1, hb.height + 16, {background: 'rgb(230 30 60 / .75)'});
  for (const y of [...shared('top'), ...shared('bottom')]) box(hb.left - 8, y, hb.width + 16, 1, {background: 'rgb(230 30 60 / .75)'});

  // 5. Legend
  const legend = box(hb.left, hb.bottom + 14, hb.width, 18, {display: 'flex', flexWrap: 'wrap', gap: '4px 14px', color: '#555', whiteSpace: 'nowrap', font: '500 11px/18px ui-sans-serif,system-ui,sans-serif'});
  legend.innerHTML = [['rgb(0 120 255 / .5)', '8px grid'], ['rgb(255 0 128)', 'safe area'], ['rgb(0 160 90)', 'text: cap height to baseline'], ['rgb(0 110 255)', 'media'], ['rgb(255 140 0)', 'controls and icons'], ['rgb(230 30 60)', 'keylines']]
    .map(([c, t]) => `<span style="display:inline-flex;align-items:center;gap:4px"><i style="width:8px;height:8px;border-radius:2px;background:${c}"></i>${t}</span>`).join('');
  const b = host.getBoundingClientRect();
  return {x: b.left, y: b.top, width: b.width, height: b.height, items: items.length};
}

const {chromium} = await loadPlaywright();
const browser = await chromium.launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
try {
  const width = Number(flag('width', 1440));
  const page = await browser.newPage({viewport: {width, height: 1000}, deviceScaleFactor: 2, colorScheme: flag('scheme', 'light')});
  await page.goto(url, {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const clip = await el.boundingBox();
  const margin = 32;
  const region = b => ({x: Math.max(0, b.x - margin), y: Math.max(0, b.y - margin), width: b.width + margin * 2, height: b.height + margin * 2 + 44});
  await page.screenshot({path: `${out}.png`, clip: region(clip)});
  const info = await page.evaluate(annotate, selector);
  await page.screenshot({path: `${out}-anatomy.png`, clip: region(info)});
  console.log(`${out}.png\n${out}-anatomy.png\n${info.items} elements measured`);
} finally { await browser.close(); }
