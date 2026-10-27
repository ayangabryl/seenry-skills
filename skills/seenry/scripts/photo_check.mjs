#!/usr/bin/env node
/** Photo check: a blind art director scores each image for the slot it will fill, against the reference screens.
 *  Weak imagery is the most-cited gap between generated pages and big-company pages; this rejects it before layout.
 *
 *  node photo_check.mjs <image> [<image> ...] --use "product hero, 3:4, right column" [--refs a.png,b.png]
 *                       [--brand "Ferro, specialty coffee roaster, Lisbon"] [--min 8] [--out .seenry/review/photos.json]
 *                       [--page index.html]   judge each image as it sits on the rendered page, not as a loose file
 *
 *  Prints KEEP or REGENERATE per image with the problems and a better prompt. Exits 1 if any image is below --min. */
import {existsSync, writeFileSync, mkdirSync, mkdtempSync} from 'node:fs';
import {resolve, dirname, basename, join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {findCli, askModel} from './model_cli.mjs';
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const images = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))).map(p => resolve(p));
if (!images.length || images.some(p => !existsSync(p))) { console.error('Usage: node photo_check.mjs <image> [...] --use "<slot>" [--refs a.png,b.png] [--brand "<brand>"] [--medium "<oil painting>"]'); process.exit(2); }
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);
const min = Number(flag('min', '8')), out = resolve(flag('out', '.seenry/review/photos.json'));
markWorkDir(out);
const found = findCli(process.env.SEENRY_CRITIC);
if (!found) { console.error('No working Codex or Claude CLI found; review the images yourself against the imagery rules in references/standard.md.'); process.exit(2); }

// In place: an image that scores well alone can still sit badly (a cut-out edge, a crop that loses the subject, a
// tone that fights the ground), and one that scores low alone can work on the page. Judge what the visitor sees.
const pageTarget = flag('page');
let shown = images, inPlace = 0;
if (pageTarget) {
  let chromium;
  try {
    const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
    const load = async () => {
      if (explicit) return import(pathToFileURL(resolve(explicit)).href);
      for (const base of [process.cwd(), resolve(dirname(resolve(pageTarget)))]) { try { return await import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {} }
      return import('playwright');
    };
    ({chromium} = await load());
  } catch { console.error('Playwright not found; judging the image files alone.'); }
  if (chromium) {
    const browser = await chromium.launch(), page = await browser.newPage({viewport: {width: 1440, height: 900}});
    await page.goto(/^https?:/.test(pageTarget) ? pageTarget : pathToFileURL(resolve(pageTarget)).href, {waitUntil: 'networkidle'}).catch(() => {});
    await page.waitForTimeout(1500);
    const work = mkdtempSync(join(tmpdir(), 'seenry-inplace-'));
    shown = [];
    for (const [i, img] of images.entries()) {
      const name = basename(img);
      const handle = await page.evaluateHandle(n => [...document.querySelectorAll('*')].find(el => {
        const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 40) return false;
        return (el.currentSrc || el.src || '').includes(n) || getComputedStyle(el).backgroundImage.includes(n) || (el.tagName === 'image' && (el.getAttribute('href') || '').includes(n));
      }) || null, name);
      const el = handle.asElement();
      if (!el) { shown.push(img); continue; }
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(700);
      const r = await el.boundingBox();
      if (!r) { shown.push(img); continue; }
      const pad = 120, x = Math.max(0, r.x - pad), y = Math.max(0, r.y - pad);
      const clip = {x, y, width: Math.min(1440 - x, r.width + pad * 2), height: Math.min(900 - y, r.height + pad * 2)};
      const file = join(work, `${i}-${name.replace(/\.[^.]+$/, '')}.png`);
      await page.screenshot({path: file, clip}).then(() => { shown.push(file); inPlace++; }, () => shown.push(img));
    }
    await browser.close();
  }
}
const KEYS = ['realism', 'light', 'composition', 'premium', 'fit', 'concept', 'overall'];
const schema = {type: 'object', additionalProperties: false, required: ['images'], properties: {images: {type: 'array', items: {
  type: 'object', additionalProperties: false, required: ['image', ...KEYS, 'problems', 'better_prompt'], properties: {
    image: {type: 'string'}, ...Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}])),
    problems: {type: 'array', items: {type: 'string'}}, better_prompt: {type: 'string'}}}}}};
const listing = [...images.map((p, i) => `image ${i + 1} = candidate ${basename(p)}${shown[i] !== p ? ' shown in place on the page' : ''}`), ...refs.map((p, i) => `image ${images.length + i + 1} = reference screen ${basename(p)}`)].join('\n');
const prompt = `You are the art director for ${flag('brand', 'a premium brand')}. You approve or reject imagery before it goes on the site. The standard is the photography of Apple, Aesop, ARKET and Stripe: real, calm, precisely lit, art-directed, never stock-like or AI-looking.

${listing}
${refs.length ? 'The reference screens show the level of imagery the site must match.\n' : ''}${flag('medium') ? `The intended medium is: ${flag('medium')}. It is a deliberate choice, not a flaw. Judge realism as how convincing the image is in that medium (a believable oil painting, a crafted illustration), never as how photographic it is, and keep that medium in the better prompt.\n` : ''}
Each candidate will be used as: ${flag('use', 'a hero image')}.${inPlace ? `\nCandidates marked "shown in place" are crops of the rendered page with the image and its surroundings. Judge the image as it sits there: its crop, its edges (a transparent cut-out should melt into the page, never show a hard or haloed edge), how its tone meets the ground and the type around it, and whether it reads at that size. Use the surrounding page only as context; do not score the page's own text or UI.` : ''}

Score each candidate 1-10 (8 = a professional shoot for a premium brand; 5 = acceptable stock; 3 = obviously generated):
- realism: would a viewer believe this is a photograph (or a deliberate high-end render)? Subtract for AI tells: garbled or fake text on labels, warped geometry, melted edges, impossible reflections, plastic skin, extra fingers, over-smooth surfaces, HDR glow. Mechanical, technical and anatomical subjects (watch movements, engines, circuit boards, instruments, hands, food, architecture) must make physical sense to an expert in that field: parts that connect and could work, the right count and placement of components, plausible finishing. A specialist customer spots a fake mechanism at once, so implausible mechanical detail caps realism at 4 however polished it looks; when a faithful subject cannot be generated, recommend a crop, angle or subject that does not expose the mechanism.
- light: one clear, soft, motivated light source; controlled shadows; no flat or muddy light.
- composition: subject placement, crop and negative space suited to the slot; product fills the frame enough to read at phone size.
- premium: styling, props, surface and color grade at the level of the references; no clichés (sunset circles, floating objects, gradient blobs, coffee beans scattered everywhere, steam wisps, bokeh fairy lights).
- fit: matches the brand and the slot.
- concept: is this a directed image with its own angle (an unexpected scale, crop, object or staging), or the first picture anyone would generate for this category? 9-10 directed, 5 the default category scene. It does not lower overall on its own; it breaks ties between variants.
- overall.
List the concrete problems, then write a better generation prompt that fixes them (subject, set and surface, light, lens and distance, composition for the slot, color grade, what to exclude, including "no text on labels" when a label would garble).
Do not open any files other than the attached images.`;

let verdict;
try { verdict = askModel(found, {images: [...shown, ...refs], prompt, schema}); } catch (e) { console.error(`photo check failed: ${e.message}`); process.exit(1); }
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, JSON.stringify({cli: found.cli, min, ...verdict}, null, 2));
let weak = 0;
verdict.images.forEach((v, i) => {
  const ok = v.overall >= min; if (!ok) weak++;
  console.log(`${ok ? 'KEEP' : 'REGENERATE'} ${basename(images[i] || v.image)}: overall ${v.overall} · realism ${v.realism} · light ${v.light} · composition ${v.composition} · premium ${v.premium} · fit ${v.fit}`);
  for (const p of v.problems) console.log(`  - ${p}`);
  if (!ok) console.log(`  Better prompt: ${v.better_prompt}`);
});
console.log(`\n${weak ? `${weak} image(s) below ${min}. Regenerate with the better prompt (at most three attempts per image), then check again.` : 'All images pass.'} Written to ${out}`);
process.exit(weak ? 1 : 0);
