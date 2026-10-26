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
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--strict'));
if (!target) { console.error('Usage: node review_board.mjs <url | file.html> [--refs a.png,b.png] [--out dir]'); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
const out = resolve(flag('out', '.seenry/review'));
markWorkDir(out);
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

function inspect({phone, studio, quiet, software}) {
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && +s.opacity > 0 && !el.closest('[aria-hidden="true"],svg'); };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const label = el => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''} "${(el.textContent || '').trim().slice(0, 40)}"`;
  const els = [...document.body.querySelectorAll('*')].filter(el => ownText(el) && vis(el));
  const f = {dotText: [], defaultColor: [], radiusAwkward: [], radiusMixed: [], small: [], desktopSmall: [], faint: [], caps: [], eyebrow: [], numbered: [], heavy: [], italicAccent: [], fallback: [], tabularPunct: [], clipped: [], fixed: [], tokenCloud: [], processNote: [], dividers: [], deviceOnce: [], phoneHero: [], tokenDrift: [], clichePalette: [], repeatedVisual: [], heroNoImage: [], fewImages: [], brandBand: [], noMaterial: [], repeatedMotif: [], twoToneHead: [], monoGarnish: [], splitHeader: [], initialsAvatar: [], typeFlat: [], denseHero: [], tooMuchCopy: [], heavyCaption: [], curvedUnderline: [], dashLabel: [], glyphIcon: [], repeatedPhoto: [], textWall: [], washed: []};
  const weights = new Set(), headings = [...document.querySelectorAll('h1,h2,h3,[role=heading]')].filter(vis);
  const canvas = document.createElement('canvas').getContext('2d');
  const paint = document.createElement('canvas'); paint.width = paint.height = 1;
  const pctx = paint.getContext('2d', {willReadFrequently: true});
  // Computed colors can be oklch(), lab() or color(); paint them to read sRGB instead of parsing text.
  const toRGBA = c => { pctx.clearRect(0, 0, 1, 1); pctx.fillStyle = '#000'; pctx.fillStyle = c; pctx.fillRect(0, 0, 1, 1); const d = pctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const numbered = /^\s*(\(?0\d{1,2}\)?\s*[\/.\-–—)]|\(\d{2,3}\)|№\s?\d|No\.\s?\d|§\s?\d|\d{2}\s*\/\s*\d{2}\s*$)/;
  for (const el of els) {
    const s = getComputedStyle(el), size = parseFloat(s.fontSize), text = ownText(el), weight = +s.fontWeight;
    weights.add(weight);
    const letters = text.replace(/[^A-Za-z]/g, '');
    const upper = s.textTransform === 'uppercase' || (letters.length > 3 && letters === letters.toUpperCase());
    const tracked = parseFloat(s.letterSpacing) / size > 0.03;
    if ((size < 13 || (phone && size < 14 && text.length > 24)) && text.length > 2 && !/^[\d:.,\s]+$/.test(text)) f.small.push(`${size}px ${label(el)}`);
    else if (!phone && text.length > 2 && !/^[\d:.,\s]+$/.test(text) && ((size < 15 && !(size >= 14 && text.length <= 24)) || (el.tagName === 'P' && text.length > 60 && size < 16))) f.desktopSmall.push(`${size}px ${label(el)}`);
    if (text.length > 2 && size < 24) {
      const rgb = c => (c === 'transparent' || /rgba?\([^)]*,\s*0\)$/.test(c)) ? [0, 0, 0, 0] : toRGBA(c);
      let bg = null;
      for (let n = el; n && !bg; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] > 0.9)) bg = c; if (getComputedStyle(n).backgroundImage !== 'none') break; }
      const fg = rgb(s.color);
      if (bg && fg.length >= 3 && (fg[3] === undefined || fg[3] > 0.9)) {
        const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x), ratio = (a + 0.05) / (b + 0.05);
        if (ratio < 4.5 && !el.closest('button:disabled,[aria-disabled="true"],del,s')) f.faint.push(`${ratio.toFixed(1)}:1 ${label(el)}`);
      }
    }
    const device = el.closest('[data-seenry-device]');
    if (upper && tracked && size <= 14 && !device) {
      const r = el.getBoundingClientRect();
      const below = headings.find(h => { const hr = h.getBoundingClientRect(); return !h.contains(el) && hr.top >= r.bottom - 2 && hr.top - r.bottom < 80 && hr.left < r.right && hr.right > r.left; });
      if (below) f.eyebrow.push(`${label(el)} above ${label(below)}`);
    }
    // Sentence-case eyebrows count too: a short small line sitting right on top of a display heading, aligned with it.
    else if (!device && size <= 15 && text.length >= 3 && text.length <= 60 && ![...el.querySelectorAll('*')].some(c => !(c.closest('svg') || (['SPAN', 'I'].includes(c.tagName) && !c.textContent.trim()))) && !el.closest('a,button,nav,label,li,figcaption,[role=tab],[role=status]')) {
      const r = el.getBoundingClientRect(), mid = (r.left + r.right) / 2;
      const below = headings.find(h => { const hr = h.getBoundingClientRect(); return parseFloat(getComputedStyle(h).fontSize) >= 32 && !h.contains(el) && hr.top >= r.bottom - 2 && hr.top - r.bottom < 32 && (Math.abs(hr.left - r.left) <= 4 || Math.abs((hr.left + hr.right) / 2 - mid) <= 4); });
      if (below) f.eyebrow.push(`${label(el)} above ${label(below)}`);
    }
    if (upper && tracked && size <= 14 && letters.length > 3) f.caps.push(label(el));
    if (size <= 16 && numbered.test(text) && !device) f.numbered.push(label(el));
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
  const defaults = {'rgb(37, 99, 235)': 'blue-600', 'rgb(59, 130, 246)': 'blue-500', 'rgb(29, 78, 216)': 'blue-700', 'rgb(79, 70, 229)': 'indigo-600', 'rgb(99, 102, 241)': 'indigo-500', 'rgb(124, 58, 237)': 'violet-600', 'rgb(139, 92, 246)': 'violet-500', 'rgb(16, 185, 129)': 'emerald-500', 'rgb(249, 115, 22)': 'orange-500', 'rgb(234, 88, 12)': 'orange-600'};
  const hits = new Map();
  for (const el of document.body.querySelectorAll('*')) {
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    for (const c of [cs.backgroundColor, cs.color, cs.borderTopColor]) {
      const v = toRGBA(c);
      if (v.length < 3 || (v[3] !== undefined && v[3] < 0.9)) continue;
      for (const [k, name] of Object.entries(defaults)) {
        const d = k.match(/\d+/g).map(Number);
        if (Math.hypot(v[0] - d[0], v[1] - d[1], v[2] - d[2]) < 30) { hits.set(name, (hits.get(name) || 0) + 1); break; }
      }
    }
  }
  // On phone the first screen must show the hero visual, not only words and buttons: a product, photograph, render or
  // the display type marked as the visual (data-seenry-hero-visual), with at least 120px of it above the fold.
  if (phone && scrollY < 10) {
    const fold = innerHeight, media = [...document.querySelectorAll('img, picture, video, canvas, svg, [data-seenry-hero-visual], [role=img]')]
      .concat([...document.querySelectorAll('section, header, div, figure')].filter(el => /url\(/.test(getComputedStyle(el).backgroundImage)));
    const shown = media.some(el => { if (!vis(el)) return false; const r = el.getBoundingClientRect(); const big = el.hasAttribute('data-seenry-hero-visual') || (r.width >= 160 && r.height >= 120); return big && r.top < fold - 120 && r.bottom > 0 && !el.closest('nav, header nav, [aria-label*=logo i], .logo, [data-wordmark]'); });
    if (!shown) f.phoneHero.push('no product, image or marked hero visual in the first 844px');
  }
  // Visuals: a page that shows the same chart or image twice reads as padding; a quiet page is led by imagery.
  if (!phone && studio) {
    const big = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width >= 200 && r.height >= 120 && cs.visibility !== 'hidden' && +cs.opacity > 0 && cs.display !== 'none'; };
    const inDevice = el => !!el.closest('.device-screen, .laptop-screen, [data-seenry-screen]');
    const seen = new Map(), dup = [];
    for (const el of document.querySelectorAll('svg, img, canvas, picture')) {
      if (!big(el) || el.closest('nav, header nav, footer') || (el.tagName === 'IMG' && el.closest('picture'))) continue;
      let key = '';
      if (el.tagName === 'svg') { const ps = [...el.querySelectorAll('path, rect, circle, line, polyline, polygon')]; if (ps.length < 3) continue; key = 'svg:' + (el.parentElement?.className || el.getAttribute('class') || '') + ':' + ps.length + ':' + ps.map(x => x.tagName).join(''); if (!String(el.parentElement?.className || el.getAttribute('class') || '').trim()) key += ':' + ps.slice(0, 4).map(x => (x.getAttribute('d') || '').slice(0, 12)).join('|'); }
      else if (el.tagName === 'IMG') key = 'img:' + (el.currentSrc || el.src).split('?')[0];
      else continue;
      const y = Math.round(el.getBoundingClientRect().top + scrollY);
      if (seen.has(key) && Math.abs(seen.get(key) - y) > innerHeight * 0.6) dup.push(el.tagName.toLowerCase() + (el.getAttribute('aria-label') ? ` "${el.getAttribute('aria-label').slice(0, 30)}"` : '')); else if (!seen.has(key)) seen.set(key, y);
    }
    // A section that repeats a whole composition (same structure of a chart block) counts too.
    const blocks = new Map();
    for (const el of document.querySelectorAll('figure, [class*=chart], [class*=diagram], [class*=split], [class*=sankey], [class*=flow]')) {
      if (!big(el) || el.parentElement?.closest('figure, [class*=chart], [class*=diagram]')) continue;
      const sig = el.className + ':' + el.querySelectorAll('*').length + ':' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (blocks.has(sig)) dup.push(`block .${String(el.className).split(' ')[0]}`); else blocks.set(sig, 1);
    }
    if (dup.length) f.repeatedVisual.push(dup.slice(0, 4).join(', '));
    // Real material: a page built only from type, rules and circles reads as a sketch. It needs photographs, video or
    // the product's own interface (an HTML product stage marked data-seenry-product) at real size, at least twice.
    const realSize = (el, w, h) => { const r = el.getBoundingClientRect(); return r.width >= w && r.height >= h && getComputedStyle(el).visibility !== 'hidden'; };
    const material = [...document.querySelectorAll('img, picture, video')].filter(el => realSize(el, 480, 300) && !(el.tagName === 'IMG' && el.closest('picture')) && !el.closest('nav, footer'))
      .concat([...document.querySelectorAll('section, div, figure')].filter(el => realSize(el, 480, 300) && /url\(/.test(getComputedStyle(el).backgroundImage)))
      .concat([...document.querySelectorAll('[data-seenry-product]')].filter(el => realSize(el, 560, 340)));
    const momentsOf = new Set(material.map(el => Math.round((el.getBoundingClientRect().top + scrollY) / (innerHeight * 0.8))));
    const stages = [...document.querySelectorAll('[data-seenry-product]')].filter(el => realSize(el, 560, 340)).length;
    if (software && !stages) f.noMaterial.push('software page with no product interface at real size: borrowed art, prints or stock photos never stand in for the product (build its real UI on a stage and mark it data-seenry-product)');
    if (momentsOf.size < 2) f.noMaterial.push(`${momentsOf.size} moment(s) of photography, video or product interface at real size (480×300 or larger; mark an HTML product stage with data-seenry-product)`);
    // One visual idea used three or more times (the same step circles, chips or mini-diagram in hero, band and footer).
    const secOf = el => el.closest('section, header, footer, main > *');
    const motif = new Map();
    for (const el of document.querySelectorAll('body [class], [data-seenry-device]')) {
      if (el.closest('nav, button, a, label, form, table, [role=tablist]') || el.matches('button, a, input, li, h1, h2, h3, h4, p')) continue;
      const r = el.getBoundingClientRect(), dev = !!el.dataset.seenryDevice; if (r.height < 32 || r.width < 120 || (!dev && el.children.length < 3)) continue;
      if (!dev && (el.querySelector('h1, h2, h3, p, button, a') || (el.textContent || '').trim().split(/\s+/).length > 14)) continue;
      const cls = el.dataset.seenryDevice ? 'device ' + el.dataset.seenryDevice : String(el.className.baseVal ?? el.className).split(/\s+/)[0]; const sec = secOf(el); if (!cls || !sec) continue;
      if (!motif.has(cls)) motif.set(cls, new Set()); motif.get(cls).add(sec);
    }
    for (const [cls, secs] of motif) if (secs.size >= 3) f.repeatedMotif.push(`.${cls} in ${secs.size} sections`);
    if (quiet) {
      const imagery = [...document.querySelectorAll('img, picture, video, canvas')].filter(el => big(el) && !inDevice(el) && !el.closest('nav, footer, [data-wordmark]'))
        .concat([...document.querySelectorAll('section, div, figure')].filter(el => big(el) && /url\(/.test(getComputedStyle(el).backgroundImage) && !inDevice(el)));
      const area = el => { const r = el.getBoundingClientRect(); const top = Math.max(0, r.top + scrollY), bottom = Math.min(innerHeight, r.bottom + scrollY); return Math.max(0, bottom - top) * r.width; };
      const heroArea = imagery.reduce((a, el) => a + area(el), 0);
      if (heroArea < innerWidth * innerHeight * 0.22) f.heroNoImage.push(`${Math.round(heroArea / (innerWidth * innerHeight) * 100)}% of the first screen is photograph, painting or a rendered scene (a quiet page leads with imagery: about a quarter or more; a phone screenshot does not count)`);
      const moments = new Set(imagery.map(el => Math.round((el.getBoundingClientRect().top + scrollY) / (innerHeight * 0.8))));
      if (moments.size < 3) f.fewImages.push(`${moments.size} image moment(s) down the page (a quiet page needs the hero and at least two more)`);
      const bands = [...document.querySelectorAll('section, header, footer, main > *, div')].filter(el => { const r = el.getBoundingClientRect(); if (r.width < innerWidth * 0.6 || r.height < 280) return false; const c = toRGBA(getComputedStyle(el).backgroundColor); if (c[3] < 0.9) return false; const mx = Math.max(...c.slice(0, 3)) / 255, mn = Math.min(...c.slice(0, 3)) / 255, l = (mx + mn) / 2, d = mx - mn; const sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0; return sat > 0.35 && l > 0.12 && l < 0.85; });
      if (bands.length) f.brandBand.push(`${bands.length} full-width band(s) of saturated brand color`);
    }
  }
  // Cliché palettes the skill lists as generated (anti-slop): judged from the large painted surfaces.
  if (!phone && studio) {
    const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l]; };
    const kinds = new Set();
    for (const el of document.querySelectorAll('body, section, header, footer, main > *, div')) {
      const r = el.getBoundingClientRect(); if (r.width < innerWidth * 0.5 || r.height < 160) continue;
      const c = toRGBA(getComputedStyle(el).backgroundColor); if (c[3] < 0.9) continue;
      const [h, sat, l] = hsl(c);
      if (l > 0.88 && sat > 0.25 && h >= 30 && h <= 55) kinds.add('cream');
      if (l < 0.32 && sat > 0.2 && h >= 120 && h <= 200) kinds.add('forest');
      if (l > 0.35 && l < 0.6 && sat > 0.45 && h >= 8 && h <= 28) kinds.add('terracotta');
      if (l < 0.3 && sat > 0.2 && h >= 280 && h <= 335) kinds.add('plum');
      if (l > 0.75 && sat > 0.5 && h >= 15 && h <= 35) kinds.add('peach');
    }
    const accents = [...document.querySelectorAll('a, button, h1, h2, em, strong, span')].slice(0, 400).map(el => hsl(toRGBA(getComputedStyle(el).color))).filter(([h, sat, l]) => sat > 0.45 && l > 0.3 && l < 0.6);
    if (accents.some(([h]) => h >= 8 && h <= 28)) kinds.add('terracotta-accent');
    const fills = [...document.querySelectorAll('a, button, [class*=btn], mark, [class*=chip]')].slice(0, 200).map(el => hsl(toRGBA(getComputedStyle(el).backgroundColor))).filter(([h, sat, l]) => sat > 0.5 && l > 0.4 && l < 0.7);
    if ([...accents, ...fills].some(([h]) => h >= 38 && h <= 52)) kinds.add('mustard');
    const combos = [['cream', 'terracotta'], ['cream', 'terracotta-accent'], ['forest', 'cream'], ['forest', 'mustard'], ['plum', 'peach']].filter(c => c.every(k => kinds.has(k)));
    if (combos.length) f.clichePalette.push(combos.map(c => c.join(' + ')).join(', '));
  }
  // Token drift: a system shows as few distinct values. Count what the page renders, not what the source says.
  if (!phone && studio) {
    const sizes = new Set(), off = new Set(), durs = new Set(), radii = new Set();
    const SCALE = new Set([4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 96, 112, 128, 144, 160]);
    for (const el of document.querySelectorAll('body *')) {
      if (!vis(el)) continue;
      const c = getComputedStyle(el);
      if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) sizes.add(Math.round(parseFloat(c.fontSize)));
      for (const k of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap']) { const v = Math.round(parseFloat(c[k]) || 0); if (v >= 4 && v <= 160 && !SCALE.has(v)) off.add(v); }
      const r = Math.round(parseFloat(c.borderTopLeftRadius) || 0); if (r > 0 && r < 500) radii.add(r);
      for (const d of `${c.transitionDuration},${c.animationDuration}`.split(',')) { const ms = Math.round(parseFloat(d) * (/ms/.test(d) ? 1 : 1000)); if (ms > 0) durs.add(ms); }
    }
    const notes = [];
    if (sizes.size > 9) notes.push(`${sizes.size} font sizes (${[...sizes].sort((a, b) => a - b).join(' ')}; a scale has 6 to 9)`);
    if (off.size > 2) notes.push(`${off.size} padding or gap values off the 4px scale (${[...off].sort((a, b) => a - b).slice(0, 10).join(' ')})`);
    if (durs.size > 7) notes.push(`${durs.size} motion durations (${[...durs].sort((a, b) => a - b).join(' ')}ms; use the six motion tokens)`);
    if (radii.size > 4) notes.push(`${radii.size} corner radii (${[...radii].sort((a, b) => a - b).join(' ')})`);
    if (notes.length) f.tokenDrift.push(notes.join('; '));
  }
  // Studio pages: editing limits and typographic range. Scroll scenes and drawn layers are no longer required;
  // forcing them produced pinned empty bands and crude diagrams on every page.
  if (studio && !phone) {
    const timelines = document.getAnimations().filter(a => a.timeline && !(a.timeline instanceof DocumentTimeline)).length;
    const triggers = window.ScrollTrigger?.getAll?.().length || 0;
    const pinned = [...document.querySelectorAll('*')].filter(el => getComputedStyle(el).position === 'sticky' && el.parentElement && el.parentElement.getBoundingClientRect().height > innerHeight * 1.5 && el.getBoundingClientRect().height > innerHeight * 0.5).length;
    // A scene is a section where something large transforms with scroll (framing, mask, drawing) or a held stage;
    // filter and opacity shifts alone do not count.
    const scenes = new Set();
    const host = el => el && (el.closest('section, header, footer, main > *') || el);
    for (const a of document.getAnimations()) {
      if (!a.timeline || a.timeline instanceof DocumentTimeline || !a.effect?.target) continue;
      const kf = a.effect.getKeyframes?.() || [], r = a.effect.target.getBoundingClientRect?.();
      const strong = kf.some(k => k.transform || k.clipPath || k['clip-path'] || k.strokeDashoffset || k.maskPosition || k.maskSize || k.translate || k.scale);
      if (strong && (r && r.width * r.height >= innerWidth * innerHeight * 0.12 || a.effect.target instanceof SVGElement)) scenes.add(host(a.effect.target));
    }
    for (const t of window.ScrollTrigger?.getAll?.() || []) if (t.pin || t.vars?.scrub) scenes.add(host(t.trigger || t.pin));
    for (const el of document.querySelectorAll('*')) if (getComputedStyle(el).position === 'sticky' && el.parentElement && el.parentElement.getBoundingClientRect().height > innerHeight * 1.5 && el.getBoundingClientRect().height > innerHeight * 0.5) scenes.add(host(el));
    const drawn = [...document.querySelectorAll('svg')].filter(sv => { const r = sv.getBoundingClientRect(); return r.width >= 120 && r.height >= 80 && sv.querySelector('path,line,polyline,circle,rect') && !sv.closest('nav,button,a,[data-wordmark]'); }).length;
    // Studio editing: one message on the first screen, a page that says it once, captions of one short line.
    const wordsIn = t => t.trim().split(/\s+/).filter(Boolean).length;
    const copy = [...document.querySelectorAll('body *')].filter(el => vis(el) && !el.closest('nav,footer,script,style,[aria-hidden=true]')).map(el => ({el, t: ownText(el)})).filter(x => x.t);
    const heroWords = copy.filter(x => { const r = x.el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && !x.el.closest('header'); }).reduce((a, x) => a + wordsIn(x.t), 0);
    const pageWords = copy.reduce((a, x) => a + wordsIn(x.t), 0);
    if (heroWords > 45) f.denseHero.push(`${heroWords} words in the first screen (studio limit about 45: headline, one line, one action)`);
    if (pageWords > 700) f.tooMuchCopy.push(`${pageWords} words on the page (studio limit about 700; cut each section to one message)`);
    for (const c of document.querySelectorAll('figcaption, [class*=caption i]')) if (vis(c) && wordsIn(c.textContent) > 18) f.heavyCaption.push(`${wordsIn(c.textContent)} words: ${c.textContent.trim().slice(0, 50)}`);
    // Typographic range below the first screen: distinct text sizes in use, and sections that use more than one level.
    const below = els.filter(el => el.getBoundingClientRect().top + scrollY > innerHeight && parseFloat(getComputedStyle(el).fontSize) >= 14 && !el.closest('nav,footer,button,a,label,table,[role=tablist]'));
    const sizes = new Set(below.map(el => Math.round(parseFloat(getComputedStyle(el).fontSize) / 2) * 2));
    const sectionsBelow = [...document.querySelectorAll('section, main > *')].filter(sc => sc.getBoundingClientRect().top + scrollY > innerHeight && sc.getBoundingClientRect().height > 300);
    const flatSections = sectionsBelow.filter(sc => { const own = below.filter(el => sc.contains(el)); const lv = new Set(own.map(el => Math.round(parseFloat(getComputedStyle(el).fontSize) / 4) * 4)); return own.length >= 3 && lv.size < 3; }).length;
    if (sizes.size < 5 || (sectionsBelow.length >= 3 && flatSections / sectionsBelow.length > 0.5)) f.typeFlat.push(`${sizes.size} text sizes below the first screen; ${flatSections} of ${sectionsBelow.length} sections use fewer than three levels`);
  }
  // Second-generation tells: the house look generated pages converge on once the classic tells are banned.
  {
    const lumOf = c => { const [r, g, b] = toRGBA(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    let twoTone = 0;
    for (const h of headings) {
      if (parseFloat(getComputedStyle(h).fontSize) < 24) continue;
      const base = lumOf(getComputedStyle(h).color);
      const muted = [...h.querySelectorAll('span,em,small')].some(sp => sp.textContent.trim().split(/\s+/).length >= 2 && Math.abs(lumOf(getComputedStyle(sp).color) - base) > 40);
      if (muted) { twoTone++; if (twoTone > 1) f.twoToneHead.push(label(h)); }
    }
    const mono = els.filter(el => /mono|courier|consolas|menlo/i.test(getComputedStyle(el).fontFamily) && !el.closest('pre,code,kbd,samp,table,[role=table],[data-seenry-device]') && ownText(el).length > 2);
    if (mono.length > 6) f.monoGarnish.push(`${mono.length} monospace text elements outside code and tables (${mono.slice(0, 3).map(label).join(', ')})`);
    if (!phone) {
      let split = 0;
      for (const h of document.querySelectorAll('section h2, main > * h2')) {
        if (!vis(h)) continue;
        const hr = h.getBoundingClientRect(), sec = h.closest('section, main > *');
        const note = [...sec.querySelectorAll('p')].find(p => { if (!vis(p) || p.contains(h)) return false; const r = p.getBoundingClientRect(); return r.left > hr.right + 24 && Math.abs(r.top - hr.top) < Math.max(80, hr.height) && parseFloat(getComputedStyle(p).fontSize) < parseFloat(getComputedStyle(h).fontSize) / 1.6; });
        if (note) split++;
      }
      if (split >= 3) f.splitHeader.push(`${split} sections open with the same header (title left, small note right)`);
    }
    for (const el of document.querySelectorAll('span,div,figure,i,li')) {
      const bx = el.getBoundingClientRect(); if (!bx.width || getComputedStyle(el).visibility === 'hidden' || el.closest('svg')) continue;
      const t = el.textContent.trim(), r = el.getBoundingClientRect(), st = getComputedStyle(el);
      if (/^[A-Z]{1,2}$/.test(t) && r.width >= 16 && r.width <= 64 && Math.abs(r.width - r.height) < 4 && (parseFloat(st.borderTopLeftRadius) >= r.width / 2 - 1 || st.borderTopLeftRadius.includes('%'))) f.initialsAvatar.push(label(el));
    }
  }
  const devices = {};
  for (const el of document.querySelectorAll('[data-seenry-device]')) if (vis(el) && el.getBoundingClientRect().height < 40) devices[el.dataset.seenryDevice] = (devices[el.dataset.seenryDevice] || 0) + 1;
  for (const [name, n] of Object.entries(devices)) if (n < 3) f.deviceOnce.push(`${name} used ${n}×`);
  for (const [name, n] of hits) if (n >= 3) f.defaultColor.push(`Tailwind ${name} used on ${n} elements; derive the accent from the brand and correct it in OKLCH`);
  // Colored dots in front of text ("● Active") read as generated UI; a dot is allowed only when it is the whole
  // message and marked so: data-seenry-dot="live|presence|unread".
  const dotLike = (st, w, h) => w > 0 && w <= 12 && h > 0 && h <= 12 && (parseFloat(st.borderTopLeftRadius) >= Math.min(w, h) / 2 - 0.5 || st.borderTopLeftRadius.includes('%'))
    && toRGBA(st.backgroundColor)[3] > 0.5;
  for (const el of document.body.querySelectorAll('*')) {
    if (!vis(el) || el.closest('[data-seenry-dot],[data-seenry-device]')) continue;
    const text = (el.textContent || '').trim();
    if (text.length < 2) continue;
    const b = getComputedStyle(el, '::before');
    if (b.content && b.content !== 'none' && dotLike(b, parseFloat(b.width), parseFloat(b.height))) { f.dotText.push(label(el)); continue; }
    const c = el.firstElementChild;
    if (c && !(c.textContent || '').trim() && !c.querySelector('img,svg') && c.tagName !== 'IMG' && c.tagName !== 'svg') {
      const r = c.getBoundingClientRect();
      if (dotLike(getComputedStyle(c), r.width, r.height)) f.dotText.push(label(el));
    }
  }
  // "Many" drawn as a cloud of tiny chips or domains, and production notes left on the page.
  for (const el of document.body.querySelectorAll('*')) {
    if (!vis(el) || el.closest('nav,footer,table,form,select,[role=listbox],[role=menu],[role=tablist]')) continue;
    const kids = [...el.children].filter(k => vis(k) && (k.textContent || '').trim().length > 0 && (k.textContent || '').trim().length < 32);
    const chips = kids.filter(k => { const r = k.getBoundingClientRect(), st = getComputedStyle(k);
      return r.height <= 40 && r.width <= 260 && (parseFloat(st.borderTopWidth) > 0 || toRGBA(st.backgroundColor)[3] > 0.05); });
    if (chips.length >= 12) f.tokenCloud.push(`${chips.length} small chips in ${label(el)}`);
  }
  // Separation by lines instead of space and tone: rules under headers, between rows, around every card. Data tables
  // are exempt (their row rules carry meaning).
  { let rules = 0; const lim = innerHeight * 2;
    const line = (st, side) => parseFloat(st[`border${side}Width`]) >= 0.5 && st[`border${side}Style`] !== 'none' && toRGBA(st[`border${side}Color`])[3] > 0.04;
    for (const el of document.body.querySelectorAll('*')) {
      if (!vis(el) || el.closest('table,[role=grid],[role=table],input,textarea,select,button')) continue;
      const r = el.getBoundingClientRect(); if (r.top > lim || r.width < 120) continue;
      const st = getComputedStyle(el);
      if (el.tagName === 'HR' || line(st, 'Top') || line(st, 'Bottom') || /inset[^,]*0px -?1px 0px|0px -?1px 0px [^,]*inset/.test(st.boxShadow)) rules++;
    }
    if (rules > 10) f.dividers.push(`${rules} divider lines in the first two screens`); }
  // Typed symbols standing in for icons or a logo: arrows, stars, sparkles, check marks or emoji as text.
  { const GLYPH = /[\u2190-\u21FF\u2794\u2799-\u27BF\u2713-\u2717\u2605\u2606\u2726-\u274B\u2B50\u2728]|\p{Extended_Pictographic}/u;
    const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
    for (const el of document.body.querySelectorAll('a,button,[role=button],[role=link]')) {
      if (!vis(el)) continue;
      const t = ownText(el) + [...el.querySelectorAll(':scope > span, :scope > i')].filter(c => !c.querySelector('svg,img')).map(c => c.textContent).join('');
      if (GLYPH.test(t)) f.glyphIcon.push(`"${el.textContent.trim().slice(0, 40)}"`);
    }
    // Asterisks, sparkles, stars and bursts are the default AI brand mark, typed or drawn: anywhere in a logo, as
    // an SVG named like one, or scattered as standalone decoration.
    const STAR = /[*\u2726-\u274B\u2605\u2606\u2728\u2731\u2042\u204E\u2051\u2055]/u, STAR_NAME = /star|spark|asterisk|burst|twinkle/i;
    const logos = [...document.querySelectorAll('header a, header [class*=logo i], nav a:first-child, [class*=logo i], [class*=brand i], [class*=wordmark i], footer [class*=logo i], footer [class*=brand i]')].filter(vis);
    for (const logo of new Set(logos)) {
      if (logo.textContent.trim().length > 40) continue;
      const svgStar = [...logo.querySelectorAll('svg, svg *, img')].some(n => STAR_NAME.test([n.getAttribute('class'), n.id, n.getAttribute('aria-label'), n.getAttribute('alt'), n.getAttribute('src'), n.querySelector?.('title')?.textContent].join(' ')));
      if (STAR.test(logo.textContent) || GLYPH.test(logo.textContent) || svgStar) { f.glyphIcon.push(`logo "${logo.textContent.trim().slice(0, 30)}" uses an asterisk, sparkle or star as its mark`); break; }
    }
    for (const el of document.body.querySelectorAll('span,div,i,b,em,p')) {
      if (!vis(el) || el.children.length || el.closest('a,button,code,pre,label,sup,[aria-hidden=false]')) continue;
      const t = el.textContent.trim();
      if (t.length && t.length <= 2 && (/^[\u2726-\u274B\u2605\u2606\u2728\u2731\u2042\u204E]+$/u.test(t) || /^\*$/.test(t) && !el.closest('form,fieldset,[class*=required i]'))) { f.glyphIcon.push(`decorative "${t}" in ${label(el.parentElement || el)}`); }
    } }
  // A short decorative rule or a literal dash leading a label ("— A notebook that thinks with you").
  for (const el of document.body.querySelectorAll('*')) {
    if (!vis(el) || el.children.length) continue;
    const r = el.getBoundingClientRect(), st = getComputedStyle(el);
    const bar = r.width >= 8 && r.width <= 48 && r.height > 0 && r.height <= 3 && !el.textContent.trim() && (toRGBA(st.backgroundColor)[3] > 0.1 || parseFloat(st.borderTopWidth) > 0);
    // Chart legends draw a line swatch before each series name; that is information, not decoration.
    const legend = el.closest('[class*=legend i],[aria-label*=legend i],[role=img],figure,svg') || /legend/i.test(el.parentElement?.className || '');
    if (bar && !legend) { const next = el.nextSibling && (el.nextSibling.textContent || '').trim(); if (next) f.dashLabel.push(`rule before "${next.slice(0, 40)}"`); }
    else if (/^\s*[—–]\s+\S/.test(el.textContent) && el.textContent.trim().length < 70) f.dashLabel.push(`"${el.textContent.trim().slice(0, 40)}"`);
  }
  for (const el of document.body.querySelectorAll('p,span,div,small,a,li,h1,h2,h3,h4,h5,h6')) {
    if (!vis(el) || !el.textContent.trim() || el.textContent.trim().length > 70) continue;
    const b = getComputedStyle(el, '::before');
    if (b.content && b.content !== 'none' && /^["']?["']?$/.test(b.content.replace(/\s/g, '')) && parseFloat(b.width) >= 8 && parseFloat(b.width) <= 48 && parseFloat(b.height) <= 3 && toRGBA(b.backgroundColor)[3] > 0.1) f.dashLabel.push(`::before rule on "${el.textContent.trim().slice(0, 40)}"`);
  }
  // A one-sided border on a rounded box bends up at the corners (the "smile" under a selected tab or link). Draw
  // indicators as their own straight element instead.
  { const sides = ['Top', 'Right', 'Bottom', 'Left'], corners = {Top: ['TopLeft', 'TopRight'], Bottom: ['BottomLeft', 'BottomRight'], Left: ['TopLeft', 'BottomLeft'], Right: ['TopRight', 'BottomRight']};
    for (const el of document.body.querySelectorAll('*')) {
      if (!vis(el)) continue;
      const st = getComputedStyle(el);
      const width = k => st[`border${k}Style`] !== 'none' && toRGBA(st[`border${k}Color`])[3] > 0.04 ? parseFloat(st[`border${k}Width`]) : 0;
      const w = Object.fromEntries(sides.map(k => [k, width(k)]));
      const drawn = sides.filter(k => w[k] >= 1);
      // One side drawn alone, or one side clearly heavier than a hairline frame (a 3px left edge on a 1px card).
      const side = drawn.length === 1 ? drawn[0] : sides.find(k => w[k] >= 2 && sides.every(o => o === k || w[k] >= 2 * w[o]));
      // The same edge drawn as a hard inset shadow (inset 0 3px 0 accent) is the same tell.
      const insetEdge = (st.boxShadow || '').split(/,(?![^(]*\))/).some(sh => {
        if (!/inset/.test(sh) || /rgba?\([^)]*,\s*0\)/.test(sh)) return false;
        const [x = 0, y = 0, blur = 0] = (sh.replace(/rgba?\([^)]*\)|#[0-9a-f]+/gi, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
        return blur === 0 && ((x === 0 && Math.abs(y) >= 2) || (y === 0 && Math.abs(x) >= 2));
      });
      if (insetEdge) { f.curvedUnderline.push(label(el)); continue; }
      if (!side) continue;
      const rail = (side === 'Left' || side === 'Right') && w[side] >= 2 && parseFloat(st[`padding${side}`]) >= 8;
      if (rail || corners[side].some(c => parseFloat(st[`border${c}Radius`]) >= 1)) f.curvedUnderline.push(label(el));
    } }
  // Washed palettes: large panels filled with pale tints in a hue (mint, lavender, peach) instead of neutral surfaces
  // and one committed brand color.
  { const oklch = c => { const [r, g, b] = toRGBA(c).slice(0, 3).map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
      return {L, C: Math.hypot(A, B), H: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360}; };
    const panels = [];
    for (const el of document.body.querySelectorAll('section,div,article,aside,li')) {
      if (!vis(el)) continue; const r = el.getBoundingClientRect(); if (r.width < innerWidth * 0.25 || r.height < 160) continue;
      const bg = getComputedStyle(el).backgroundColor, a = toRGBA(bg)[3]; if (!(a === undefined || a > 0.9)) continue;
      const c = oklch(bg); if (c.L > 0.88 && c.C > 0.018 && c.C < 0.11) panels.push({el, h: Math.round(c.H / 30)});
    }
    const outer = panels.filter(p => !panels.some(q => q !== p && q.el.contains(p.el)));
    const hues = new Set(outer.map(p => p.h));
    if (outer.length >= 3 && hues.size >= 2) f.washed.push(`${outer.length} pale tinted panels in ${hues.size} hues, for example ${label(outer[0].el)}`); }
  // Too much text: marketing and app screens are scanned, not read. Long paragraphs outside an article and a first
  // screen crowded with words both read as unfinished copy.
  { const words = t => (t.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
    for (const p of document.body.querySelectorAll('p,li')) {
      if (!vis(p) || p.closest('article,[class*=prose i],[class*=legal i],[class*=terms i],[class*=privacy i],footer,details,dialog')) continue;
      const n = words(p.innerText || ''); if (n > 70) f.textWall.push(`${n} words in ${label(p)}`);
    }
    if (!phone) { let n = 0; for (const el of document.body.querySelectorAll('h1,h2,h3,p,li,a,button,span,label')) { if (!vis(el) || el.children.length) continue; const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) n += words(el.innerText || ''); }
      if (n > 110) f.textWall.push(`${n} words on the first screen`); } }
  // The same photograph shown twice on one screen (a hero image reused in the grid below it).
  { const seen = new Map();
    for (const img of document.body.querySelectorAll('img')) {
      const r = img.getBoundingClientRect(); if (!vis(img) || r.width < 120 || r.height < 90) continue;
      const src = (img.currentSrc || img.src || '').split('?')[0]; if (!src || /\.svg$|^data:image\/svg/i.test(src)) continue;
      if (seen.has(src)) f.repeatedPhoto.push(`${label(img)} repeats ${label(seen.get(src))}`); else seen.set(src, img);
    } }
  for (const el of document.body.querySelectorAll('p,span,small,figcaption,li,div')) {
    if (!vis(el) || el.children.length > 2 || el.closest('footer')) continue;
    const t = (el.textContent || '').trim();
    if (t.length < 200 && /\b(illustrative|placeholder|demo (data|content)|sample (data|content|details|copy|text)|dummy (data|content|text)|example (data|content)|for demonstration|invented|fictional|not real|lorem ipsum|replace (this|with your))\b|\b(are|is) (sample|placeholder|example)\b/i.test(t)) f.processNote.push(`"${t.slice(0, 60)}"`);
  }
  const controls = [...document.querySelectorAll('button,input:not([type=checkbox]):not([type=radio]):not([type=hidden]),select,a[class*=btn],a[class*=button],[role=button]')].filter(vis);
  const radii = [];
  for (const el of controls) {
    const r = el.getBoundingClientRect(), rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    if (r.height < 24 || r.height > 72) continue;
    const ratio = Math.min(rad, r.height / 2) / r.height;
    if (ratio > 0.26 && ratio < 0.49) f.radiusAwkward.push(`${Math.round(rad)}px on ${Math.round(r.height)}px ${label(el)}`);
    if (ratio < 0.49 && r.height >= 34) radii.push(Math.round(rad));
  }
  const controlRadii = [...new Set(radii)].sort((a, b) => a - b);
  if (controlRadii.length > 2) f.radiusMixed.push(`controls 34–72px tall use ${controlRadii.join('/')}px; give neighbouring controls one radius`);
  const interactive = [...document.querySelectorAll('a[href],button,[role=tab],input,select,summary')].filter(vis);
  const animated = interactive.filter(el => getComputedStyle(el).transitionDuration.split(',').some(d => parseFloat(d) > 0));
  const motion = {interactive: interactive.length, withTransition: animated.length, pressState: active, reducedMotion: reduced, keyframes, viewTransitions: 'startViewTransition' in document && /startViewTransition/.test([...document.scripts].map(x => x.textContent).join(''))};
  // The page itself wider than the screen: on a phone it scrolls sideways and screenshots shrink it to half width.
  f.pageOverflow = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) {
    const wide = [...document.body.querySelectorAll('*')].filter(el => { const r = el.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !el.closest('[aria-hidden="true"]') && getComputedStyle(el).position !== 'fixed'; });
    const outer = wide.filter(el => !wide.includes(el.parentElement));
    f.pageOverflow.push(...(outer.length ? outer : wide).slice(0, 4).map(el => `${label(el)} reaches ${Math.round(el.getBoundingClientRect().right)}px of ${innerWidth}px`));
    if (!f.pageOverflow.length) f.pageOverflow.push(`page is ${document.documentElement.scrollWidth}px wide at ${innerWidth}px`);
  } else {
    // The page hides horizontal scroll, but content still runs past the screen edge and is cut off. An element clipped
    // by its own scroller or carousel is intentional; only report what nothing but the page itself would clip.
    const cut = [...document.body.querySelectorAll('*')].filter(el => {
      const r = el.getBoundingClientRect(); if (!r.width || r.right <= innerWidth + 2 || r.left >= innerWidth || !vis(el)) return false;
      if (getComputedStyle(el).position === 'fixed') return false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const st = getComputedStyle(a); if (st.overflowX !== 'visible' && a.getBoundingClientRect().right <= innerWidth + 2) return false; }
      return true;
    });
    const outer = cut.filter(el => !cut.includes(el.parentElement));
    f.pageOverflow.push(...outer.slice(0, 4).map(el => `${label(el)} runs to ${Math.round(el.getBoundingClientRect().right)}px of ${innerWidth}px and is cut off`));
  }
  // Hero craft a studio checks first: no word stranded on a headline's last line, one action that reads as the action,
  // and a headline composed below the navigation instead of jammed under it.
  f.orphan = []; f.weakAction = []; f.headlineCrowd = [];
  const firstScreen = el => { const r = el.getBoundingClientRect(); return r.width && r.top < innerHeight && r.bottom > 0 && vis(el); };
  for (const h of [...document.querySelectorAll('h1,h2')].filter(firstScreen).slice(0, 3)) {
    const words = [], walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) for (const m of n.textContent.matchAll(/\S+/g)) {
      const range = document.createRange(); range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
      const r = range.getBoundingClientRect(); if (r.width) words.push({text: m[0], top: Math.round(r.top)});
    }
    const lines = [...new Set(words.map(w => w.top))].sort((a, b) => a - b);
    if (lines.length > 1 && words.filter(w => Math.abs(w.top - lines.at(-1)) < 4).length === 1) f.orphan.push(`${label(h)}: "${words.at(-1).text}" alone on the last line (rebalance with text-wrap: balance or a deliberate break)`);
  }
  const pageBg = getComputedStyle(document.body).backgroundColor;
  const actions = [...document.querySelectorAll('a[href],button')].filter(el => firstScreen(el) && !el.closest('nav,header') && (el.textContent || '').trim().length > 1);
  if (actions.length) {
    const filled = actions.filter(el => { const bg = getComputedStyle(el).backgroundColor; return !/rgba\(\s*0,\s*0,\s*0,\s*0\)|transparent/.test(bg) && bg !== pageBg; });
    const minH = phone ? 48 : 44, strong = filled.filter(el => el.getBoundingClientRect().height >= minH && parseFloat(getComputedStyle(el).fontSize) >= 15);
    if (!strong.length) f.weakAction.push(filled.length ? `largest filled action is ${Math.round(Math.max(...filled.map(el => el.getBoundingClientRect().height)))}px tall (make the primary action at least ${minH}px with a 15px+ label)` : `no filled primary action on the first screen (${actions.slice(0, 3).map(label).join(', ')} are outlines or links)`);
  }
  const h1 = [...document.querySelectorAll('h1')].find(firstScreen), bar = [...document.querySelectorAll('header,nav')].filter(firstScreen).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
  if (!phone && h1 && bar && !bar.contains(h1)) { const gap = h1.getBoundingClientRect().top - bar.getBoundingClientRect().bottom; if (gap >= 0 && gap < 64) f.headlineCrowd.push(`${label(h1)} starts ${Math.round(gap)}px below the navigation (give it at least 64px, usually 96px+ at 1440)`); }
  return {findings: f, weights: [...weights].sort(), motion};
}

// Letters cut by their own box: a line-reveal mask (overflow hidden) on a headline set tighter than its glyphs slices
// descenders and accents (the tail of a g, the top of an É). Compares each text run's glyph box with the clipping box.
async function clippedText(page) {
  return page.evaluate(() => {
    const clipper = el => { for (let e = el, k = 0; e && k < 4; e = e.parentElement, k++) { const c = getComputedStyle(e); if (/hidden|clip/.test(c.overflowX + c.overflowY) || c.clipPath !== 'none') return e; } return null; };
    const found = [];
    for (const t of document.querySelectorAll('h1,h2,h3,h4,p,a,span,strong,em,li,button,label')) {
      if (![...t.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(t);
      if (s.webkitLineClamp !== 'none' && s.webkitLineClamp || s.textOverflow === 'ellipsis' || s.visibility === 'hidden') continue;
      const c = clipper(t); if (!c) continue;
      const r = document.createRange(); r.selectNodeContents(t);
      const ink = r.getBoundingClientRect(), box = c.getBoundingClientRect();
      if (!ink.width || !box.width || ink.bottom < 0 || ink.top > document.documentElement.scrollHeight) continue;
      const over = Math.max(box.top - ink.top, ink.bottom - box.bottom);
      if (over > 2 && over < ink.height * 0.6) found.push(`"${t.textContent.trim().slice(0, 30)}" loses ${Math.round(over)}px of its letters to ${c.tagName.toLowerCase()}${c.className ? '.' + String(c.className).split(' ')[0] : ''} (overflow ${getComputedStyle(c).overflowY}): give the mask room for descenders and accents (padding-block 0.15em with a matching negative margin, or line-height of at least 1.1), or drop the mask once the line has entered`);
    }
    return found.slice(0, 6);
  });
}

// Type set on a photograph or painting: hide the glyphs, sample the pixels behind each first-screen text block and
// compare the text color with the busiest tenth of them. Scrims, shades and text shadows stay in the sample.
async function textOverImage(page) {
  const blocks = await page.evaluate(() => {
    const imageLike = el => /^(IMG|VIDEO|CANVAS|PICTURE|svg)$/.test(el.tagName) || /url\(/.test(getComputedStyle(el).backgroundImage);
    const out = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,span,small,time,strong')) {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      if (!r.width || !r.height || r.top >= innerHeight || r.bottom <= 0 || s.visibility === 'hidden' || +s.opacity === 0) continue;
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      if (/rgba?\(\d+, \d+, \d+, 0\)/.test(s.backgroundColor) === false && s.backgroundColor !== 'transparent') continue;
      const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const i = stack.indexOf(el);
      if (i < 0 || !stack.slice(i + 1).some(imageLike)) continue;
      const size = parseFloat(s.fontSize), bold = parseInt(s.fontWeight) >= 700;
      const m = s.color.match(/[\d.]+/g).map(Number);
      out.push({label: (el.textContent || '').trim().slice(0, 40), rect: {x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, innerWidth - Math.max(0, r.left)), height: Math.min(r.height, innerHeight - Math.max(0, r.top))}, color: m.slice(0, 3), large: size >= 24 || (bold && size >= 18.66), size, weight: s.fontWeight});
      el.setAttribute('data-seenry-glyph', '');
    }
    const style = document.createElement('style'); style.id = 'seenry-glyph-hide';
    style.textContent = '[data-seenry-glyph]{color:transparent!important;-webkit-text-fill-color:transparent!important}';
    document.head.append(style);
    return out.slice(0, 24);
  });
  const found = [];
  for (const b of blocks) {
    if (b.rect.width < 4 || b.rect.height < 4) continue;
    const png = (await page.screenshot({clip: b.rect})).toString('base64');
    const worst = await page.evaluate(async ({png, color}) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lum = ([r, gr, bl]) => [r, gr, bl].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, k) => s + v * [0.2126, 0.7152, 0.0722][k], 0);
      const lt = lum(color), ratios = [];
      for (let k = 0; k < d.length; k += 16) { const lb = lum([d[k], d[k + 1], d[k + 2]]); ratios.push((Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05)); }
      ratios.sort((a, b) => a - b);
      return ratios[Math.floor(ratios.length * 0.1)] || 21;
    }, {png, color: b.color});
    const need = b.large ? 3 : 4.5;
    if (worst < need) found.push(`"${b.label}" (${Math.round(b.size)}px/${b.weight}) reaches only ${worst.toFixed(1)}:1 over the busiest tenth of the image behind it (needs ${need}:1): move it onto a calm part of the image, add a scrim or shade under it, or use a heavier weight with a shadow`);
  }
  await page.evaluate(() => { document.getElementById('seenry-glyph-hide')?.remove(); document.querySelectorAll('[data-seenry-glyph]').forEach(e => e.removeAttribute('data-seenry-glyph')); });
  return found;
}

const {chromium} = await loadPlaywright();
const browser = await chromium.launch({headless: true, args: ['--allow-file-access-from-files'], ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
const report = {url, widths: {}};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({viewport: {width: w, height: h}});
  await page.goto(url, {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(800);
  if (w === 1440) await page.screenshot({path: join(out, 'first-1440.png')});
  report.widths[w] = await page.evaluate(inspect, {phone: w < 768, studio: args.includes('--studio'), quiet: args.includes('--quiet'), software: args.includes('--software')});
  report.widths[w].findings.textOverImage = await textOverImage(page);
  report.widths[w].findings.clippedText = await clippedText(page);
  // The full-page still shows the composition, not the motion: pinned scenes leave a screen of blank travel and
  // scroll-drawn layers render empty, so it is taken in the reduced-motion version (every scene in its final state).
  {
    const still = await browser.newPage({viewport: {width: w, height: h}, reducedMotion: 'reduce'});
    await still.goto(url, {waitUntil: 'networkidle'});
    await still.evaluate(async () => { await document.fonts?.ready; const s = innerHeight * 0.7; for (let y = 0; y < document.documentElement.scrollHeight; y += s) { scrollTo({top: y, behavior: 'instant'}); await new Promise(r => setTimeout(r, 120)); } scrollTo({top: 0, behavior: 'instant'}); await new Promise(r => setTimeout(r, 400)); });
    await still.screenshot({path: join(out, `full-${w}.png`), fullPage: true});
    await still.close();
  }
  if (w === 1440) report.interactions = await page.evaluate(async () => {
    const controls = [...document.querySelectorAll('input[type=radio],[role=tab],[role=radio],[aria-pressed],button:not([type=submit])')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width && r.height && !el.closest('a[href],form[action],nav,header,footer') && !el.disabled; }).slice(0, 10);
    const out = [];
    for (const el of controls) {
      const before = document.body.innerText;
      const target = el.tagName === 'INPUT' ? (el.labels && el.labels[0]) || el : el;
      target.click();
      await new Promise(r => setTimeout(r, 60));
      const animated = document.getAnimations().some(a => a.playState === 'running');
      await new Promise(r => setTimeout(r, 400));
      const changed = document.body.innerText !== before;
      out.push({control: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 30), changed, animated});
      if (document.querySelector('dialog[open],[aria-modal=true]')) document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    }
    return out;
  });
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
// The whole page, never clipped: a long page is cut into side-by-side columns so the critic sees every section down to
// the footer (clipping at 5200px made critics report missing footers and sections).
const pngHeight = p => readFileSync(p).readUInt32BE(20), pngWidth = p => readFileSync(p).readUInt32BE(16);
const columns = (p, w, maxH) => {
  const h = Math.ceil(pngHeight(p) * w / pngWidth(p)), src = uri(p);
  return Array.from({length: Math.max(1, Math.ceil(h / maxH))}, (_, k) =>
    `<div style="width:${w}px;height:${Math.min(maxH, h - k * maxH)}px;overflow:hidden;background:#fff"><img src="${src}" style="width:${w}px;display:block;margin-top:${-k * maxH}px"></div>`);
};
const cols = [...columns(join(out, 'full-1440.png'), 720, 2600), ...columns(join(out, 'full-390.png'), 280, 2600)];
await shot(`<div style="display:flex;gap:16px;padding:16px;align-items:flex-start">${cols.join('')}</div>`, 'board.png', 16 + cols.reduce((n, c) => n + (c.includes('width:720px') ? 736 : 296), 0));
const cells = [['This page', join(out, 'first-1440.png')], ...refs.map(r => [r.split('/').pop(), r])];
await shot(`<div style="display:flex;flex-wrap:wrap;gap:16px;padding:16px">${cells.map(([n, p]) => `<figure style="margin:0"><figcaption style="padding:0 0 6px">${n}</figcaption>${clip(uri(p), 720, 450)}</figure>`).join('')}</div>`, 'first.png', 16 + cells.length * 736 > 1488 ? 1488 : 16 + cells.length * 736);
await browser.close();

// --allow numbered,italicAccent: tells the named reference itself uses, listed in .seenry/refs/patterns.md. Craft checks
// (contrast, clipping, small text) can never be allowed.
const craftKeys = new Set(['clippedText', 'textOverImage', 'small', 'desktopSmall', 'faint', 'fallback', 'fixed', 'phoneHero']);
const allow = new Set(String((args.includes('--allow') ? args[args.indexOf('--allow') + 1] : '') || '').split(',').map(s => s.trim()).filter(k => k && !craftKeys.has(k)));
const names = {clippedText: 'letters cut off by their own box (descenders or accents sliced by an overflow mask)', textOverImage: 'text set on a photograph or painting without enough contrast against the image behind it', repeatedVisual: 'the same chart, diagram or image shown twice on the page (each visual appears once; show something different in the second place)', heroNoImage: 'quiet page whose first screen is not led by imagery (put a photograph or painting at large size in the hero, with the product on or beside it)', fewImages: 'too few image moments for the quiet register (the hero and at least two more sections carry a photograph or painting)', brandBand: 'a full-width band of saturated brand color in the quiet register (keep surfaces off-white and ink; let imagery carry color)', clichePalette: 'a palette the skill lists as generated (cream with terracotta, forest green with cream or mustard, plum with peach): use warm off-white or white with ink and let imagery carry color, or a brand color that is not on that list', tokenDrift: 'token drift: values typed one at a time instead of picked from the token scale (define the type scale, 4px space scale, radii and motion durations once and use only those; snap near values to the nearest step)', denseHero: 'crowded first screen (one message: headline, one supporting line and one action; move facts, captions and secondary links below)', tooMuchCopy: 'too much copy (cut every section to one message and the page by about a third; studios say it once)', heavyCaption: 'caption longer than one short line (keep captions to one line of 18 words or fewer, or cut them)', typeFlat: 'flat typography in the middle (use the identity\'s type scale: two or more levels per section and a different lead move in neighbouring sections, such as a large pull quote in the text face, a captioned grid, a measured number with its annotation or a margin note)', noMaterial: 'no real material (a page made only of type, rules and drawn shapes reads as a sketch: show the product\'s own interface on a stage, art-directed photography or video at real size, at least twice)', repeatedMotif: 'one visual motif repeated in three or more sections (a device used everywhere becomes a tic; use it once where it explains most)', twoToneHead: 'two-tone headline used more than once (a grey second sentence in a headline is a generated tell; one color per headline, and say it in one sentence)', monoGarnish: 'monospace used as texture (captions, timestamps and meta lines in mono read as generated; keep mono for code and aligned table figures)', splitHeader: 'the same section header on three or more sections (title left, small note right): open each section the way its content needs', initialsAvatar: 'initials in a circle standing in for a person (use a real photo, or the name alone)', phoneHero: 'phone first screen shows no hero visual (bring the product, photograph or display type into the first 844px: shorten the copy, drop the announcement bar and secondary button above it, or mark type-as-image with data-seenry-hero-visual)', deviceOnce: 'a declared identity device used fewer than three times (a device is a system across sections; otherwise it is decoration: use it consistently or remove it)', washed: 'washed palette: pale tinted panels in several hues (use neutral surfaces and one committed brand color at full strength)', textWall: 'too much text (cut paragraphs to two sentences and the first screen to a headline, one line of support and an action)', repeatedPhoto: 'the same photograph used twice on one screen (give every card and the hero its own image)', dividers: 'divider lines everywhere (separate with space and surface tone; tint the selected row; nest panels one surface step apart)', dotText: 'colored dot in front of text (use the word alone; mark a real live, presence or unread dot with data-seenry-dot)', defaultColor: 'framework default color as the accent', radiusAwkward: 'control radius between 26% and 49% of its height (use at most 25% or a full pill)', radiusMixed: 'mixed control radii', small: 'text under 13px, or readable text under 14px on phone', desktopSmall: 'desktop text under 15px (short labels 14px), or paragraph under 16px (reads as faint at review scale)', faint: 'text contrast under 4.5:1', caps: 'uppercase letter-spaced label (sentence case instead)', eyebrow: 'eyebrow label above a title (drop it and let the heading carry the section)', numbered: 'numbered label', heavy: 'weight 700+', italicAccent: 'italic accent word in a headline', fallback: 'font not loaded or glyphs missing (renders in a fallback)', tabularPunct: 'tabular figures space out , and . (use proportional figures for single values, tabular only in columns, or a font with proportional punctuation)', clipped: 'clipped horizontal row on phone', pageOverflow: 'content wider than the screen: the page scrolls sideways or cuts it off (put wide tables and rows in their own overflow-x:auto container, or recompose them as stacked rows on phone)', fixed: 'fixed bar over content', tokenCloud: 'a claim of "many" drawn as a cloud of tiny chips (show three to five readable instances and the one result)', processNote: 'production note on the page (illustrative, placeholder, invented, demo data)', curvedUnderline: 'one-sided border on a rounded element: an accent rail down a card or a tab underline that bends at its ends (separate cards by tone and space; draw indicators as a straight ::after bar)', dashLabel: 'short rule or dash in front of a label (let the label stand alone, or cut it)', orphan: 'a word stranded alone on a headline\'s last line', weakAction: 'no primary action that reads as the action (filled, 44px+ tall on desktop, 48px+ on phone, 15px+ label)', headlineCrowd: 'headline jammed under the navigation', glyphIcon: 'typed symbol used as an icon or logo (arrows, stars, sparkles, check marks or emoji as text; use a wordmark or SVG mark and icons from one real icon set)'};
let blockers = 0;
for (const [w, r] of Object.entries(report.widths)) {
  console.log(`\n■ ${w}px  weights ${r.weights.join('/')}${r.weights.length > 3 ? '  (more than 3)' : ''}`);
  if (r.weights.length > 3) blockers++;
  for (const [k, list] of Object.entries(r.findings)) {
    if (!list.length) continue;
    if (allow.has(k)) { console.log(`  allowed by the pattern map: ${names[k]} ×${list.length}`); continue; }
    blockers++;
    console.log(`  ${names[k]} ×${list.length}`);
    for (const x of [...new Set(list)].slice(0, 4)) console.log(`    ${x}`);
  }
}
const m = report.widths[1440].motion;
const motionGaps = [];
const still = (report.interactions || []).filter(x => x.changed && !x.animated);
if (still.length) motionGaps.push(`state changes with no motion after clicking: ${still.map(x => '"' + x.control + '"').slice(0, 5).join(', ')} (animate changed values with SeenryMotion.number, list changes with SeenryMotion.swap, feedback with pop/toast)`);
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
