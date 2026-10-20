#!/usr/bin/env node
/** Detail critic: a fresh model judges craft only, section by section at full 1440 size, the way a studio art director
 *  reviews at 100%. The main critic sees the page at half scale and judges concept; this one catches what only shows
 *  up close: optical alignment, spacing steps, rag and line breaks, crops, control consistency, type detail.
 *
 *  node detail_critic.mjs <url | file.html> [--out .seenry/review/detail.json] [--max 6] [--playwright path] [--cli codex|claude]
 *
 *  Prints a craft score and fixes tied to a section and an element, and writes them to --out. */
import {existsSync, mkdirSync, writeFileSync, mkdtempSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {findCli, askModel} from './model_cli.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
if (!target) { console.error('usage: detail_critic.mjs <url | file.html> [--out file] [--max 6]'); process.exit(2); }
const out = resolve(flag('out', '.seenry/review/detail.json'));
const max = Math.max(2, Math.min(8, Number(flag('max', 6))));

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2);
}

const found = findCli(flag('cli', process.env.SEENRY_CRITIC));
if (!found) { console.error('No working critic CLI found (codex or claude).'); process.exit(2); }

const {chromium} = await loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1440, height: 900}, deviceScaleFactor: 1});
await page.goto(/^https?:/.test(target) ? target : pathToFileURL(resolve(target)).href, {waitUntil: 'networkidle'}).catch(() => {});
await page.waitForTimeout(1000);
// Scroll like a visitor so reveals and lazy images settle, then measure the page's own sections.
await page.evaluate(async () => { const step = innerHeight * 0.6; for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo({top: y, behavior: 'instant'}); await new Promise(r => setTimeout(r, 160)); } scrollTo({top: 0, behavior: 'instant'}); await new Promise(r => setTimeout(r, 600)); });
const boxes = await page.evaluate(() => {
  const els = [...document.querySelectorAll('body > header, main > *, body > section, section, footer')].filter(el => !el.parentElement.closest('section'));
  const seen = new Set();
  return els.map(el => { const r = el.getBoundingClientRect(); return {y: Math.round(r.top + scrollY), h: Math.round(r.height), name: (el.getAttribute('aria-label') || el.querySelector('h1,h2,h3')?.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 60)}; })
    .filter(b => b.h >= 160 && !seen.has(b.y) && seen.add(b.y));
});
const total = await page.evaluate(() => document.documentElement.scrollHeight);
// Fall back to screen-high slices when the page has no section elements.
const slices = (boxes.length >= 2 ? boxes : Array.from({length: Math.ceil(total / 900)}, (_, i) => ({y: i * 900, h: 900, name: `slice ${i + 1}`})))
  .slice(0, max).map(b => ({...b, h: Math.min(b.h, 1400)}));
const work = mkdtempSync(join(tmpdir(), 'seenry-detail-'));
const images = [];
for (const [i, s] of slices.entries()) {
  const file = join(work, `section-${i + 1}.png`);
  await page.screenshot({path: file, fullPage: true, clip: {x: 0, y: s.y, width: 1440, height: Math.min(s.h, total - s.y)}});
  images.push(file);
}
await browser.close();

const schema = {type: 'object', additionalProperties: false, required: ['craft', 'sections', 'fixes'], properties: {
  craft: {type: 'integer', minimum: 1, maximum: 10},
  sections: {type: 'array', items: {type: 'object', additionalProperties: false, required: ['section', 'score', 'note'], properties: {section: {type: 'string'}, score: {type: 'integer', minimum: 1, maximum: 10}, note: {type: 'string'}}}},
  fixes: {type: 'array', items: {type: 'object', additionalProperties: false, required: ['section', 'element', 'problem', 'fix'], properties: {section: {type: 'string'}, element: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}}};
const listing = slices.map((s, i) => `image ${i + 1} = section "${s.name}" at full 1440 size`).join('\n');
const prompt = `You are a senior art director at a design studio doing the final 100% review before a site goes to the client. You are not judging the concept, the idea or the colors: only craft, the hundreds of small decisions that separate studio work from a competent template. Each image is one section of the page at its real size:
${listing}

Look closely at each section for:
- optical alignment: text, images, rules and controls sharing edges and baselines; elements that are 2–8px off a shared edge
- spacing: whether gaps follow a consistent scale, whether space between groups is clearly larger than space inside them, cramped or loose spots
- type detail: line breaks that leave an orphan or split a phrase badly, ragged or uneven line lengths, tracking and leading at display sizes, hierarchy steps that are too close
- images: crops that cut the subject awkwardly, mismatched treatments, images that sit loose in their frame
- controls and small parts: buttons, inputs, chips and icons that do not share one height, radius or stroke; icons misaligned with their labels
- finish: anything that looks unconsidered at 100%

Score craft 1-10 for the whole page (10 = studio-grade finish everywhere; 8 = a few visible slips; 6 = competent but loose; 4 = careless) and each section. Then list the fixes that matter most, most visible first, at most 10: the section, the exact element, the problem and a concrete change in px, weight or alignment. Never suggest text smaller than 16px for paragraphs or 14px for labels. Do not open any files other than the attached images.`;
let verdict;
try { verdict = askModel(found, {images, prompt, schema}); } catch (e) { console.error(`detail critic failed: ${e.message}`); process.exit(1); }
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, JSON.stringify({images, slices, ...verdict}, null, 2));
console.log(`Detail critic (${found.cli}, ${slices.length} sections at full size): craft ${verdict.craft}/10 · ${verdict.sections.map(s => `${s.section.slice(0, 24)} ${s.score}`).join(' · ')}`);
for (const [i, f] of verdict.fixes.entries()) console.log(`${i + 1}. [${f.section} › ${f.element}] ${f.problem} → ${f.fix}`);
console.log(`\nWritten to ${out}`);
