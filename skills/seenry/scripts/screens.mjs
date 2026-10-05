#!/usr/bin/env node
/** Review boards for native apps (SwiftUI, UIKit, React Native, Flutter) and anything else that is not an HTML page:
 *  lays out simulator or device screenshots the way review_board.mjs lays out a web page, so critic.mjs can score them.
 *
 *  node screens.mjs --screens home.png,detail.png,sheet.png [--refs a.png,b.png] --out .seenry/review
 *
 *  Writes board.png (every screen side by side at phone scale, in the order given: the flow) and first.png (the first
 *  screen beside the reference screens). */
import {readFileSync, existsSync, mkdirSync} from 'node:fs';
import {resolve, join, extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const list = v => (v || '').split(',').map(s => s.trim()).filter(Boolean).map(p => resolve(p));
const screens = list(flag('screens')), refs = list(flag('refs')).filter(existsSync);
const out = resolve(flag('out', '.seenry/review'));
if (!screens.length || screens.some(s => !existsSync(s))) { console.error('Usage: node screens.mjs --screens a.png,b.png [--refs x.png] --out .seenry/review (every screenshot must exist)'); process.exit(2); }
mkdirSync(out, {recursive: true});

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2);
}
const uri = p => `data:image/${extname(p).toLowerCase() === '.png' ? 'png' : extname(p).toLowerCase() === '.webp' ? 'webp' : 'jpeg'};base64,${readFileSync(p).toString('base64')}`;
const {chromium} = await loadPlaywright();
const browser = await chromium.launch();
const shot = async (html, file, width) => {
  const page = await browser.newPage({viewport: {width, height: 400}});
  await page.setContent(`<body style="margin:0;background:#c8c8c8;font:13px system-ui">${html}</body>`, {waitUntil: 'load'});
  await page.screenshot({path: join(out, file), fullPage: true});
  await page.close();
};
const cell = (src, w, label) => `<figure style="margin:0;width:${w}px"><figcaption style="padding:0 0 6px">${label}</figcaption><img src="${uri(src)}" style="width:${w}px;display:block;border-radius:6px;background:#fff"></figure>`;
const perRow = Math.min(6, screens.length);
await shot(`<div style="display:flex;flex-wrap:wrap;gap:16px;padding:16px">${screens.map((s, i) => cell(s, 300, `${i + 1}. ${s.split('/').pop()}`)).join('')}</div>`, 'board.png', 16 + perRow * 316);
const firsts = [[screens[0], 'This app'], ...refs.map(r => [r, r.split('/').pop()])];
await shot(`<div style="display:flex;flex-wrap:wrap;gap:16px;padding:16px;align-items:flex-start">${firsts.map(([p, n], i) => cell(p, i === 0 ? 390 : 390, n)).join('')}</div>`, 'first.png', 16 + Math.min(4, firsts.length) * 406);
await browser.close();
console.log(`Board of ${screens.length} screen(s) written to ${join(out, 'board.png')} and ${join(out, 'first.png')}.`);
