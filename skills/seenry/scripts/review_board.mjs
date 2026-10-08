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
  const f = {dotText: [], defaultColor: [], radiusAwkward: [], radiusMixed: [], small: [], desktopSmall: [], faint: [], caps: [], eyebrow: [], numbered: [], heavy: [], italicAccent: [], fallback: [], tabularPunct: [], clipped: [], fixed: [], tokenCloud: [], processNote: [], dividers: [], curvedUnderline: [], dashLabel: [], glyphIcon: [], repeatedPhoto: [], textWall: [], washed: []};
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
    if (upper && tracked && size <= 14) {
      const r = el.getBoundingClientRect();
      const below = headings.find(h => { const hr = h.getBoundingClientRect(); return !h.contains(el) && hr.top >= r.bottom - 2 && hr.top - r.bottom < 80 && hr.left < r.right && hr.right > r.left; });
      if (below) f.eyebrow.push(`${label(el)} above ${label(below)}`);
    }
    // Sentence-case eyebrows count too: a short small line sitting right on top of a display heading, aligned with it.
    else if (size <= 15 && text.length >= 3 && text.length <= 60 && ![...el.querySelectorAll('*')].some(c => !(c.closest('svg') || (['SPAN', 'I'].includes(c.tagName) && !c.textContent.trim()))) && !el.closest('a,button,nav,label,li,figcaption,[role=tab],[role=status]')) {
      const r = el.getBoundingClientRect(), mid = (r.left + r.right) / 2;
      const below = headings.find(h => { const hr = h.getBoundingClientRect(); return parseFloat(getComputedStyle(h).fontSize) >= 32 && !h.contains(el) && hr.top >= r.bottom - 2 && hr.top - r.bottom < 32 && (Math.abs(hr.left - r.left) <= 4 || Math.abs((hr.left + hr.right) / 2 - mid) <= 4); });
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
  for (const [name, n] of hits) if (n >= 3) f.defaultColor.push(`Tailwind ${name} used on ${n} elements; derive the accent from the brand and correct it in OKLCH`);
  // Colored dots in front of text ("● Active") read as generated UI; a dot is allowed only when it is the whole
  // message and marked so: data-seenry-dot="live|presence|unread".
  const dotLike = (st, w, h) => w > 0 && w <= 12 && h > 0 && h <= 12 && (parseFloat(st.borderTopLeftRadius) >= Math.min(w, h) / 2 - 0.5 || st.borderTopLeftRadius.includes('%'))
    && toRGBA(st.backgroundColor)[3] > 0.5;
  for (const el of document.body.querySelectorAll('*')) {
    if (!vis(el) || el.closest('[data-seenry-dot]')) continue;
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
  }
  return {findings: f, weights: [...weights].sort(), motion};
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
  await page.screenshot({path: join(out, `full-${w}.png`), fullPage: true});
  report.widths[w] = await page.evaluate(inspect, {phone: w < 768});
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

const names = {washed: 'washed palette: pale tinted panels in several hues (use neutral surfaces and one committed brand color at full strength)', textWall: 'too much text (cut paragraphs to two sentences and the first screen to a headline, one line of support and an action)', repeatedPhoto: 'the same photograph used twice on one screen (give every card and the hero its own image)', dividers: 'divider lines everywhere (separate with space and surface tone; tint the selected row; nest panels one surface step apart)', dotText: 'colored dot in front of text (use the word alone; mark a real live, presence or unread dot with data-seenry-dot)', defaultColor: 'framework default color as the accent', radiusAwkward: 'control radius between 26% and 49% of its height (use at most 25% or a full pill)', radiusMixed: 'mixed control radii', small: 'text under 13px, or readable text under 14px on phone', desktopSmall: 'desktop text under 15px (short labels 14px), or paragraph under 16px (reads as faint at review scale)', faint: 'text contrast under 4.5:1', caps: 'uppercase letter-spaced label (sentence case instead)', eyebrow: 'eyebrow label above a title (drop it and let the heading carry the section)', numbered: 'numbered label', heavy: 'weight 700+', italicAccent: 'italic accent word in a headline', fallback: 'font not loaded or glyphs missing (renders in a fallback)', tabularPunct: 'tabular figures space out , and . (use proportional figures for single values, tabular only in columns, or a font with proportional punctuation)', clipped: 'clipped horizontal row on phone', pageOverflow: 'page wider than the screen, so it scrolls sideways (put wide tables and rows in their own overflow-x:auto container, or recompose them as stacked rows on phone)', fixed: 'fixed bar over content', tokenCloud: 'a claim of "many" drawn as a cloud of tiny chips (show three to five readable instances and the one result)', processNote: 'production note on the page (illustrative, placeholder, invented, demo data)', curvedUnderline: 'one-sided border on a rounded element: an accent rail down a card or a tab underline that bends at its ends (separate cards by tone and space; draw indicators as a straight ::after bar)', dashLabel: 'short rule or dash in front of a label (let the label stand alone, or cut it)', glyphIcon: 'typed symbol used as an icon or logo (arrows, stars, sparkles, check marks or emoji as text; use a wordmark or SVG mark and icons from one real icon set)'};
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
