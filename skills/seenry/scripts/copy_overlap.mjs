#!/usr/bin/env node
/** Copy overlap: a page made like a named site takes its patterns, never its words. Compares the visible text of the
 *  candidate and the reference and lists every run of five or more words they share.
 *
 *  node copy_overlap.mjs <file|url> --ref https://site.example [--words 5] [--playwright <path>]
 *  Exits 1 when any shared run is found, 0 when none, 2 when a page cannot be read. */
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
const ref = flag('ref');
const n = Number(flag('words', '5'));
if (!target || !ref) { console.error('usage: copy_overlap.mjs <file|url> --ref <url> [--words 5]'); process.exit(2); }

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2);
}
const {chromium} = await loadPlaywright();
const browser = await chromium.launch();
async function text(url) {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  try {
    await page.goto(url, {waitUntil: 'networkidle', timeout: 45000}).catch(() => page.goto(url, {waitUntil: 'load', timeout: 45000}));
    await page.waitForTimeout(1500);
    return await page.evaluate(() => document.body.innerText);
  } catch { return null; } finally { await page.close(); }
}
const words = t => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\s]+/g, ' ').split(/\s+/).filter(Boolean);
const mine = await text(/^https?:/.test(target) ? target : pathToFileURL(resolve(target)).href);
const theirs = await text(ref);
await browser.close();
if (mine == null || theirs == null) { console.log(`Copy overlap: could not read ${mine == null ? target : ref}; not checked.`); process.exit(2); }

const a = words(mine), b = words(theirs);
const grams = new Set();
for (let i = 0; i + n <= b.length; i++) grams.add(b.slice(i, i + n).join(' '));
// Merge consecutive shared windows into one run, so a copied sentence is reported once, whole.
const runs = [];
for (let i = 0; i + n <= a.length; i++) {
  if (!grams.has(a.slice(i, i + n).join(' '))) continue;
  let j = i + n;
  while (j < a.length && grams.has(a.slice(j - n + 1, j + 1).join(' '))) j++;
  runs.push(a.slice(i, j).join(' '));
  i = j - 1;
}
const unique = [...new Set(runs)];
if (!unique.length) { console.log(`Copy overlap: no run of ${n}+ words shared with ${ref}.`); process.exit(0); }
console.log(`Copy overlap: ${unique.length} run(s) of ${n}+ words copied from ${ref}. Write these in the brand's own words:`);
for (const r of unique.slice(0, 8)) console.log(`  "${r}"`);
process.exit(1);
