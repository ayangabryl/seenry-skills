#!/usr/bin/env node
/** The bar without Seenry MCP: capture the first screens of design leaders' live sites, so the critic and pick.mjs
 *  still score against real big-company work.
 *
 *  node bar.mjs --type landing|product|dashboard|studio|pricing|app [--sites stripe.com,linear.app] [--out .seenry/research]
 *
 *  Writes <out>/bar/<site>.png (desktop 1440x900; phone 390x844 for --type app) and, when there is no pack yet,
 *  <out>/pack.md listing what was captured, for you to extend with your own research. Sites that answer with a bot
 *  check or an error are skipped, never bypassed. research.mjs runs this automatically when SEENRY_PRO_KEY is unset. */
import {mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const type = flag('type', 'landing');
const out = resolve(flag('out', '.seenry/research')), barDir = join(out, 'bar');
mkdirSync(barDir, {recursive: true});
const LEADERS = {
  landing: ['stripe.com', 'linear.app', 'vercel.com', 'apple.com', 'raycast.com', 'mercury.com', 'framer.com', 'arc.net'],
  studio: ['kargul.studio', 'pentagram.com', 'linear.app', 'apple.com', 'stripe.com', 'framer.com'],
  pricing: ['linear.app/pricing', 'vercel.com/pricing', 'stripe.com/pricing', 'raycast.com/pricing', 'mercury.com/pricing'],
  product: ['apple.com/airpods-pro', 'arket.com', 'aesop.com', 'apple.com/iphone', 'teenage.engineering', 'rapha.cc'],
  dashboard: ['linear.app', 'stripe.com/billing', 'attio.com', 'mercury.com', 'vercel.com', 'raycast.com'],
  app: ['linear.app', 'arc.net', 'apple.com', 'mercury.com', 'raycast.com', 'stripe.com'],
}[type] || ['stripe.com', 'linear.app', 'vercel.com', 'apple.com', 'raycast.com', 'mercury.com'];
const sites = [...(flag('sites', '') || '').split(',').map(s => s.trim()).filter(Boolean), ...LEADERS];

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright, or pass --playwright). Without it, save 3 first-screen screenshots of leaders in this category to ' + barDir + ' by hand.');
  process.exit(2);
}
const {chromium} = await loadPlaywright();
const browser = await chromium.launch();
const phone = type === 'app';
const got = [];
for (const site of [...new Set(sites)]) {
  if (got.length >= 4) break;
  const page = await browser.newPage(phone ? {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true} : {viewport: {width: 1440, height: 900}});
  try {
    const res = await page.goto(`https://${site}`, {waitUntil: 'domcontentloaded', timeout: 30000});
    // Wait for the hero's media and entrance animations to settle, so the bar is the finished first screen.
    await page.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
    await page.evaluate(() => Promise.race([Promise.all([...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 8000))])).catch(() => {});
    await page.waitForTimeout(4000);
    const title = (await page.title()).toLowerCase();
    const words = await page.evaluate(() => document.body.innerText.trim().split(/\s+/).length);
    if (!res || res.status() >= 400 || /just a moment|attention required|access denied|verify you are human|captcha/.test(title) || words < 20) { console.log(`skip ${site} (blocked or empty)`); continue; }
    // Dismiss nothing and click nothing: the bar is the first screen exactly as a visitor sees it.
    const name = site.replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '');
    await page.screenshot({path: join(barDir, `${name}.png`)});
    got.push({site, file: `bar/${name}.png`});
    console.log(`✓ ${site}`);
  } catch (e) { console.log(`skip ${site} (${e.message.split('\n')[0].slice(0, 80)})`); }
  finally { await page.close(); }
}
await browser.close();
if (!existsSync(join(out, 'pack.md'))) {
  writeFileSync(join(out, 'pack.md'), [`# Research pack · ${type} (offline, without Seenry MCP)`, '',
    'The bar: first screens of design leaders, captured live. The critic and pick.mjs score against these.', '',
    ...got.map(g => `- ${g.site}: ${g.file}`), '',
    '## Your research',
    'Add below: 6-10 sites or apps in this category you studied (live sites, App Store screenshots, your own knowledge), what each does well and why it looks premium, and 2 motion references you watched (what moves, duration, easing). Copy the 3 closest first screens into .seenry/refs/.', ''].join('\n'));
}
console.log(`${got.length} first screen(s) in ${barDir}.${got.length < 2 ? ' Fewer than 2: add screenshots of category leaders there by hand.' : ''}`);
process.exit(got.length ? 0 : 1);
