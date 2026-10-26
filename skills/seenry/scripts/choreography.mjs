#!/usr/bin/env node
/** Choreography critic: screenshots and the board show a page at rest, so nothing in the review sees how it moves as a
 *  page. This films the first-screen entrance from first paint and a slow scroll through the whole page (a frame while
 *  each step is still in motion and one after it settles), then a fresh model judges the page's motion the way a
 *  studio creative director would: the entrance sequence, the scroll scenes, how the device travels, how images
 *  arrive, and whether the motion carries the idea or is a uniform fade-up.
 *
 *  node choreography.mjs <url | file.html> [--out .seenry/review/choreography.json] [--identity .seenry/identity.md]
 *                        [--playwright path] [--cli codex|claude]
 *
 *  Prints a choreography score and fixes tied to a section, and writes them with the filmstrip boards to --out. */
import {existsSync, mkdirSync, writeFileSync, readFileSync, mkdtempSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {findCli, askModel} from './model_cli.mjs';
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
if (!target) { console.error('usage: choreography.mjs <url | file.html> [--out file] [--identity identity.md]'); process.exit(2); }
const out = resolve(flag('out', '.seenry/review/choreography.json'));
markWorkDir(out);
const identityPath = flag('identity');
const identity = identityPath && existsSync(identityPath) ? readFileSync(identityPath, 'utf8') : '';
const score = (identity.match(/^#+\s*motion[^\n]*\n([\s\S]*?)(?=\n#+\s|$)/im)?.[1] || '').trim().slice(0, 1600);

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
const frames = [];
const shot = async label => frames.push({label, img: (await page.screenshot({type: 'jpeg', quality: 55})).toString('base64')});
const t0 = Date.now();
await page.goto(/^https?:/.test(target) ? target : pathToFileURL(resolve(target)).href, {waitUntil: 'commit'}).catch(() => {});
await page.waitForLoadState('domcontentloaded').catch(() => {});
for (const t of [80, 300, 600, 1000, 1600, 2600]) { const w = t - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); await shot(`entrance ${((Date.now() - t0) / 1000).toFixed(1)}s`); }
await page.waitForLoadState('networkidle').catch(() => {});
const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const steps = Math.min(14, Math.max(6, Math.ceil(H / 700)));
for (let k = 1; k <= steps; k++) {
  const y = Math.round(H * k / steps);
  await page.evaluate(async y => { const from = scrollY, n = 16; for (let i = 1; i <= n; i++) { scrollTo(0, from + (y - from) * i / n); await new Promise(r => requestAnimationFrame(r)); } }, y);
  await page.waitForTimeout(140); await shot(`scroll ${k}/${steps}, in motion`);
  await page.waitForTimeout(900); await shot(`scroll ${k}/${steps}, settled`);
}
const measured = await page.evaluate(() => {
  const anims = document.getAnimations();
  const scrollLinked = anims.filter(a => a.timeline && !(a.timeline instanceof DocumentTimeline)).length;
  const triggers = window.ScrollTrigger?.getAll?.() || [];
  return {animations: anims.length, scrollLinked, scrollTriggers: triggers.length, pinned: triggers.filter(t => t.pin).length,
    sticky: [...document.querySelectorAll('*')].filter(el => getComputedStyle(el).position === 'sticky' && el.parentElement?.getBoundingClientRect().height > innerHeight * 1.5).length};
});
const work = mkdtempSync(join(tmpdir(), 'seenry-choreo-'));
const images = [];
const sheet = await browser.newPage({viewport: {width: 1460, height: 400}});
for (let i = 0; i < frames.length; i += 12) {
  const file = join(work, `film-${i / 12 + 1}.jpg`);
  await sheet.setContent(`<style>body{margin:0;background:#bbb;display:grid;grid-template-columns:repeat(4,356px);gap:8px;padding:8px;font:13px system-ui}figure{margin:0}img{width:356px;display:block}</style>${frames.slice(i, i + 12).map(f => `<figure><img src="data:image/jpeg;base64,${f.img}"><figcaption>${f.label}</figcaption></figure>`).join('')}`);
  await sheet.screenshot({path: file, type: 'jpeg', quality: 80, fullPage: true});
  images.push(file);
}
await browser.close();

const schema = {type: 'object', additionalProperties: false, required: ['choreography', 'entrance', 'scenes', 'device', 'restraint', 'missing', 'fixes'], properties: {
  choreography: {type: 'number', minimum: 1, maximum: 10}, entrance: {type: 'number'}, scenes: {type: 'number'}, device: {type: 'number'}, restraint: {type: 'number'},
  missing: {type: 'string'},
  fixes: {type: 'array', items: {type: 'object', additionalProperties: false, required: ['section', 'move', 'how'], properties: {section: {type: 'string'}, move: {type: 'string'}, how: {type: 'string'}}}}}};
const prompt = `You are the creative director of a top independent design studio (the kind whose sites win Site of the Day and whose brand films are studied) reviewing how a landing page moves before it goes to the client. The attached boards are a filmstrip of the real page at 1440px: first the entrance from first paint, then a slow scroll through the whole page, each step shown while still in motion and again once settled. Compare the pairs: what changes between "in motion" and "settled" is the page's scroll motion. Measured in the browser: ${JSON.stringify(measured)}.
${score ? `The designer's motion score for this page:\n${score}\n` : ''}
Judge only the motion and choreography, not the layout or the colors:
- entrance: does the first screen arrive as a sequence with a clear order (the subject first, then the headline, then the rest), with enough scale and time to register, or does it simply appear or fade in at once?
- scenes: if the page holds a scroll scene, does it earn the time by showing a transformation that proves the idea, or is it a pinned band that adds scroll without meaning (penalise that; a page with no scene and confident static composition is fine)
- device: does the identity's graphic device or drawing travel and link sections, drawn in as the page reaches it?
- restraint: one easing and timing family, text that is readable at every frame, nothing that moves only to move.
Calibrate: 3 = almost nothing moves; 5 = a uniform fade-up on every block; 6.5 = a nice entrance and some reveals; 8 = choreographed with one or two real scenes; 9 = a page that feels directed like a film, scenes that carry the idea; 10 = the best studio work you know. Score each part and the whole (decimals allowed). In "missing", say in one sentence what a top studio would have done that this page does not. Then list at most 6 fixes, most impactful first: the section, the move (what should happen as the visitor scrolls or arrives) and how to build it (CSS scroll-driven animation with animation-timeline: view() and an animation-range, a position: sticky stage inside a taller section, clip-path or mask reveals, GSAP ScrollTrigger with scrub and pin, staggered line reveals), with durations and distances. Keep text readable and keep a reduced-motion version. Do not open any files other than the attached images.`;
let verdict;
try { verdict = askModel(found, {images, prompt, schema}); } catch (e) { console.error(`choreography critic failed: ${e.message}`); process.exit(1); }
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, JSON.stringify({images, measured, ...verdict}, null, 2));
console.log(`Choreography critic (${found.cli}, ${frames.length} frames): choreography ${verdict.choreography}/10 · entrance ${verdict.entrance} · scenes ${verdict.scenes} · device ${verdict.device} · restraint ${verdict.restraint}`);
console.log(`Missing: ${verdict.missing}`);
for (const [i, f] of verdict.fixes.entries()) console.log(`${i + 1}. [${f.section}] ${f.move} → ${f.how}`);
console.log(`\nWritten to ${out}`);
