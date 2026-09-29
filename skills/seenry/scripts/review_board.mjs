#!/usr/bin/env node
/** Director's review board: see the page the way a reviewer does, next to the references it must beat.
 *
 *  node review_board.mjs <url | file.html> [--refs a.png,b.png] [--out .seenry/review] [--playwright path] [--strict]
 *
 *  Writes board.png (desktop full page at half scale beside the phone page, as reviewers and clients see it),
 *  first.png (the 1440 first screen beside each reference's first screen at the same scale) and board.json, and
 *  prints craft findings that a pixel-grid audit cannot see: text that is too small at review scale, eyebrows above
 *  titles, numbered labels, heavy or too many weights, italic accent words, numbers rendered in a fallback font,
 *  clipped phone rows, fixed bars that cover content, and missing interaction motion. --strict exits 1 on blockers. */
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {resolve, join, extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--strict'));
if (!target) { console.error('Usage: node review_board.mjs <url | file.html> [--refs a.png,b.png] [--out dir]'); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
const out = resolve(flag('out', '.seenry/review'));
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);
mkdirSync(out, {recursive: true});

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

function inspect({phone}) {
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && +s.opacity > 0 && !el.closest('[aria-hidden="true"],svg'); };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const label = el => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''} "${(el.textContent || '').trim().slice(0, 40)}"`;
  const els = [...document.body.querySelectorAll('*')].filter(el => ownText(el) && vis(el));
  const f = {small: [], caps: [], eyebrow: [], numbered: [], heavy: [], italicAccent: [], fallback: [], tabularPunct: [], clipped: [], fixed: []};
  const weights = new Set(), headings = [...document.querySelectorAll('h1,h2,h3,[role=heading]')].filter(vis);
  const canvas = document.createElement('canvas').getContext('2d');
  const numbered = /^\s*(\(?0\d{1,2}\)?\s*[\/.\-–—)]|\(\d{2,3}\)|№\s?\d|No\.\s?\d|§\s?\d|\d{2}\s*\/\s*\d{2}\s*$)/;
  for (const el of els) {
    const s = getComputedStyle(el), size = parseFloat(s.fontSize), text = ownText(el), weight = +s.fontWeight;
    weights.add(weight);
    const letters = text.replace(/[^A-Za-z]/g, '');
    const upper = s.textTransform === 'uppercase' || (letters.length > 3 && letters === letters.toUpperCase());
    const tracked = parseFloat(s.letterSpacing) / size > 0.03;
    if (size < (phone ? 13 : 13) && text.length > 2 && !/^[\d:.,\s]+$/.test(text)) f.small.push(`${size}px ${label(el)}`);
    if (upper && tracked && size <= 14) {
      const r = el.getBoundingClientRect();
      const below = headings.find(h => { const hr = h.getBoundingClientRect(); return !h.contains(el) && hr.top >= r.bottom - 2 && hr.top - r.bottom < 80 && hr.left < r.right && hr.right > r.left; });
      if (below) f.eyebrow.push(`${label(el)} above ${label(below)}`);
    }
    if (upper && tracked && size <= 14 && letters.length > 3) f.caps.push(label(el));
    if (size <= 16 && numbered.test(text)) f.numbered.push(label(el));
    if (weight >= 700 && !el.closest('header a[href="/"], [data-wordmark], .logo, .wordmark')) f.heavy.push(`${weight} ${label(el)}`);
    if (/^h[12]$/i.test(el.tagName) || el.closest('h1,h2')) {
      const h = el.closest('h1,h2');
      for (const it of h ? h.querySelectorAll('em,i,[style*="italic"],span') : []) {
        const is = getComputedStyle(it);
        if (is.fontStyle === 'italic' && is.fontFamily !== getComputedStyle(h).fontFamily) { f.italicAccent.push(label(h)); break; }
      }
    }
    if (/\d/.test(text) && /[,.:€$£%−-]/.test(text)) {
      const first = s.fontFamily.split(',')[0].trim();
      if (!/^(system-ui|-apple-system|sans-serif|serif|monospace|ui-)/.test(first)) {
        const w = fam => { canvas.font = `${s.fontStyle} ${s.fontWeight} ${size}px ${first}, ${fam}`; return canvas.measureText(text).width; };
        if (Math.abs(w('serif') - w('monospace')) > 0.5) f.fallback.push(`${first} ${label(el)}`);
      }
      if (s.fontVariantNumeric.includes('tabular')) {
        const probe = document.createElement('span');
        probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${s.fontStyle} ${s.fontWeight} ${size}px ${s.fontFamily};font-variant-numeric:tabular-nums;letter-spacing:0`;
        document.body.append(probe);
        const width = t => { probe.textContent = t; return probe.getBoundingClientRect().width; };
        const digit = width('0000000000') / 10, comma = width(',,,,,,,,,,') / 10;
        probe.remove();
        if (comma > digit * 0.6) f.tabularPunct.push(label(el));
      }
    }
  }
  for (const el of document.body.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (!vis(el)) continue;
    if (phone && /(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 4 && el.getBoundingClientRect().width > 200) f.clipped.push(label(el));
    if (s.position === 'fixed' && el.getBoundingClientRect().top > innerHeight * 0.5) f.fixed.push(label(el));
  }
  let reduced = false, active = false, keyframes = 0;
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = list => { for (const r of list) { const t = r.cssText || ''; if (t.includes('prefers-reduced-motion')) reduced = true; if (/:active/.test(r.selectorText || '')) active = true; if (r.type === 7) keyframes++; if (r.cssRules) walk(r.cssRules); } };
    walk(rules);
  }
  const interactive = [...document.querySelectorAll('a[href],button,[role=tab],input,select,summary')].filter(vis);
  const animated = interactive.filter(el => getComputedStyle(el).transitionDuration.split(',').some(d => parseFloat(d) > 0));
  const motion = {interactive: interactive.length, withTransition: animated.length, pressState: active, reducedMotion: reduced, keyframes, viewTransitions: 'startViewTransition' in document && /startViewTransition/.test([...document.scripts].map(x => x.textContent).join(''))};
  return {findings: f, weights: [...weights].sort(), motion};
}

const {chromium} = await loadPlaywright();
const browser = await chromium.launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
const report = {url, widths: {}};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({viewport: {width: w, height: h}});
  await page.goto(url, {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(800);
  if (w === 1440) await page.screenshot({path: join(out, 'first-1440.png')});
  await page.screenshot({path: join(out, `full-${w}.png`), fullPage: true});
  report.widths[w] = await page.evaluate(inspect, {phone: w < 768});
  await page.close();
}

const uri = p => `data:image/${extname(p) === '.png' ? 'png' : 'jpeg'};base64,${readFileSync(p).toString('base64')}`;
const shot = async (html, file, width) => {
  const page = await browser.newPage({viewport: {width, height: 400}});
  await page.setContent(`<body style="margin:0;background:#c8c8c8;font:13px system-ui">${html}</body>`, {waitUntil: 'load'});
  await page.screenshot({path: join(out, file), fullPage: true});
  await page.close();
};
const clip = (src, w, maxH) => `<div style="width:${w}px;max-height:${maxH}px;overflow:hidden;background:#fff"><img src="${src}" style="width:${w}px;display:block"></div>`;
await shot(`<div style="display:flex;gap:16px;padding:16px;align-items:flex-start">${clip(uri(join(out, 'full-1440.png')), 720, 2600)}${clip(uri(join(out, 'full-390.png')), 280, 2600)}</div>`, 'board.png', 1048);
const cells = [['This page', join(out, 'first-1440.png')], ...refs.map(r => [r.split('/').pop(), r])];
await shot(`<div style="display:flex;flex-wrap:wrap;gap:16px;padding:16px">${cells.map(([n, p]) => `<figure style="margin:0"><figcaption style="padding:0 0 6px">${n}</figcaption>${clip(uri(p), 720, 450)}</figure>`).join('')}</div>`, 'first.png', 16 + cells.length * 736 > 1488 ? 1488 : 16 + cells.length * 736);
await browser.close();

const names = {small: 'text under 13px (unreadable at review scale)', caps: 'uppercase letter-spaced label (sentence case instead)', eyebrow: 'uppercase eyebrow above a title', numbered: 'numbered label', heavy: 'weight 700+', italicAccent: 'italic accent word in a headline', fallback: 'font not loaded or glyphs missing (renders in a fallback)', tabularPunct: 'tabular figures space out , and . (use proportional figures for single values, tabular only in columns, or a font with proportional punctuation)', clipped: 'clipped horizontal row on phone', fixed: 'fixed bar over content'};
let blockers = 0;
for (const [w, r] of Object.entries(report.widths)) {
  console.log(`\n■ ${w}px  weights ${r.weights.join('/')}${r.weights.length > 3 ? '  (more than 3)' : ''}`);
  if (r.weights.length > 3) blockers++;
  for (const [k, list] of Object.entries(r.findings)) {
    if (!list.length) continue;
    blockers++;
    console.log(`  ${names[k]} ×${list.length}`);
    for (const x of [...new Set(list)].slice(0, 4)) console.log(`    ${x}`);
  }
}
const m = report.widths[1440].motion;
const motionGaps = [];
if (m.interactive && m.withTransition / m.interactive < 0.6) motionGaps.push(`only ${m.withTransition}/${m.interactive} interactive elements have a transition`);
if (!m.pressState) motionGaps.push('no :active press state');
if (!m.reducedMotion) motionGaps.push('no prefers-reduced-motion handling');
console.log(`\n■ motion  transitions ${m.withTransition}/${m.interactive} · press ${m.pressState ? 'yes' : 'no'} · reduced-motion ${m.reducedMotion ? 'yes' : 'no'} · keyframes ${m.keyframes}`);
for (const g of motionGaps) console.log(`  ${g}`);
blockers += motionGaps.length;
report.blockers = blockers;
writeFileSync(join(out, 'board.json'), JSON.stringify(report, null, 2));
console.log(`\n${blockers} blocker(s). Look at ${join(out, 'board.png')} and ${join(out, 'first.png')} before scoring.`);
if (args.includes('--strict') && blockers) process.exit(1);
