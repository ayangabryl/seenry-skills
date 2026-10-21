#!/usr/bin/env node
/** Measure how leaders set type: family, headline size, weight, tracking and line height, body, and how many sizes
 *  the page renders. node type_probe.mjs <url> [url …] [--playwright path] */
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const pwFlag = process.argv.indexOf('--playwright');
const pwPath = pwFlag > 0 ? process.argv[pwFlag + 1] : process.env.SEENRY_PLAYWRIGHT;
const urls = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--playwright');
let chromium;
try { ({chromium} = pwPath ? await import(pathToFileURL(resolve(pwPath)).href) : await import(pathToFileURL(createRequire(join(process.cwd(), 'noop.js')).resolve('playwright')).href)); }
catch { try { ({chromium} = await import('playwright')); } catch { console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2); } }
const b = await chromium.launch(); const out = [];
await Promise.all(urls.map(async url => {
  const p = await b.newPage({viewport: {width: 1440, height: 900}});
  try {
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 30000}); await p.waitForTimeout(4000);
    const r = await p.evaluate(() => {
      const pick = sel => { const el = [...document.querySelectorAll(sel)].find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.textContent.trim().length > 2; }); if (!el) return null; const s = getComputedStyle(el); const fs = parseFloat(s.fontSize); return {f: s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), size: Math.round(fs), w: s.fontWeight, track: s.letterSpacing === 'normal' ? '0' : (parseFloat(s.letterSpacing) / fs * 100).toFixed(1) + '%', lh: s.lineHeight === 'normal' ? 'normal' : (parseFloat(s.lineHeight) / fs).toFixed(2)}; };
      const sizes = new Set(); for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.width && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) sizes.add(Math.round(parseFloat(getComputedStyle(el).fontSize))); }
      return {h1: pick('h1'), h2: pick('h2'), p: pick('main p, p'), nSizes: sizes.size};
    });
    out.push([url, r]);
  } catch (e) { out.push([url, {err: e.message.slice(0, 60)}]); }
  await p.close();
}));
await b.close();
for (const [u, r] of out.sort()) console.log(u.replace(/https?:\/\/(www\.)?/, '').padEnd(22), r.err || `h1 ${r.h1?.f} ${r.h1?.size}/${r.h1?.w} ${r.h1?.track} lh${r.h1?.lh} | h2 ${r.h2?.f} ${r.h2?.size}/${r.h2?.w} ${r.h2?.track} | p ${r.p?.f} ${r.p?.size}/${r.p?.w} lh${r.p?.lh} | sizes ${r.nSizes}`);
