#!/usr/bin/env node
/** Photo check: a blind art director scores each image for the slot it will fill, against the reference screens.
 *  Weak imagery is the most-cited gap between generated pages and big-company pages; this rejects it before layout.
 *
 *  node photo_check.mjs <image> [<image> ...] --use "product hero, 3:4, right column" [--refs a.png,b.png]
 *                       [--brand "Ferro, specialty coffee roaster, Lisbon"] [--min 8] [--out .seenry/review/photos.json]
 *                       [--page index.html]   judge each image as it sits on the rendered page, not as a loose file
 *                       [--hero hero.png] [--hero-min 8]   the first-screen image is held to --hero-min; with --page it is
 *                       found on the page (any image whose top sits in the first 900px)
 *                       [--palette "#2b1314,#e6e0d5,#6b1f24"]   the page palette (shadows, highlights, accent) its grade must belong to
 *
 *  Prints KEEP or REGENERATE per image with the problems and a better prompt. Exits 1 if any image is below its floor. */
import {existsSync, writeFileSync, mkdirSync, mkdtempSync} from 'node:fs';
import {resolve, dirname, basename, join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {findCli, askModel} from './model_cli.mjs';
import {namedIntent} from './named.mjs';
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const images = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))).map(p => resolve(p));
if (!images.length || images.some(p => !existsSync(p))) { console.error('Usage: node photo_check.mjs <image> [...] --use "<slot>" [--refs a.png,b.png] [--brand "<brand>"] [--medium "<oil painting>"]'); process.exit(2); }
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);
const min = Number(flag('min', '8')), out = resolve(flag('out', '.seenry/review/photos.json'));
// The first screen carries the page: a 6 elsewhere is usable, a 6 in the hero makes the page forgettable.
const heroMin = Math.max(min, Number(flag('hero-min', '8')));
const named = new Set((flag('hero', '') || '').split(',').filter(Boolean).map(n => basename(n)));
const hero = images.map(p => named.has(basename(p)));
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
    (chromium = ((m) => m.chromium || m.default?.chromium)(await load()));
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
      if (await el.evaluate(e => e.getBoundingClientRect().top + scrollY < innerHeight).catch(() => false)) hero[i] = true;
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
// The named site's pattern map, given or found beside the page, tells the art director which medium is intended.
const patternsPath = flag('patterns') || [pageTarget && !/^https?:/.test(pageTarget) ? join(dirname(resolve(pageTarget)), '.seenry', 'refs', 'patterns.md') : '', resolve('.seenry/refs/patterns.md')].find(p => p && existsSync(p));
// The rewrite comes back as the fields image.mjs takes, so regenerating never falls back to a free-text prompt.
const JOB_KEYS = ['subject', 'concept', 'shadows', 'highlights', 'accent', 'grade', 'light', 'light_reason', 'texture', 'texture_reason', 'slot', 'field', 'mode', 'prop', 'exclude'];
const KEYS = ['realism', 'light', 'composition', 'premium', 'fit', 'concept', 'palette_fit', 'integration', 'overall'];
const palette = (flag('palette', '') || '').split(',').map(s => s.trim()).filter(Boolean);
const schema = {type: 'object', additionalProperties: false, required: ['images'], properties: {images: {type: 'array', items: {
  type: 'object', additionalProperties: false, required: ['image', ...KEYS, 'problems', 'better_job'], properties: {
    image: {type: 'string'}, ...Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}])),
    problems: {type: 'array', items: {type: 'string'}}, better_job: {type: 'object', additionalProperties: false, required: JOB_KEYS, properties: Object.fromEntries(JOB_KEYS.map(k => [k, {type: 'string'}]))}}}}}};
const listing = [...images.map((p, i) => `image ${i + 1} = candidate ${basename(p)}${shown[i] !== p ? ' shown in place on the page' : ''}${hero[i] ? ' (the first-screen image: it carries the page)' : ''}`), ...refs.map((p, i) => `image ${images.length + i + 1} = reference screen ${basename(p)}`)].join('\n');
const prompt = `You are the art director for ${flag('brand', 'a premium brand')}. You approve or reject imagery before it goes on the site. The standard is the photography of Apple, Aesop, ARKET and Stripe: real, calm, precisely lit, art-directed, never stock-like or AI-looking.

${listing}
${refs.length ? 'The reference screens show the level of imagery the site must match.\n' : ''}${flag('medium') ? `The intended medium is: ${flag('medium')}. It is a deliberate choice, not a flaw. Judge realism as how convincing the image is in that medium (a believable oil painting, a crafted illustration), never as how photographic it is, and keep that medium in the better prompt.\n` : ''}
${namedIntent(patternsPath, 'photo')}Each candidate will be used as: ${flag('use', 'a hero image')}.${inPlace ? `\nCandidates marked "shown in place" are crops of the rendered page with the image and its surroundings. Judge the image as it sits there: its crop, its edges (a transparent cut-out should melt into the page, never show a hard or haloed edge), how its tone meets the ground and the type around it, and whether it reads at that size. Use the surrounding page only as context; do not score the page's own text or UI.` : ''}

Score each candidate 1-10 (8 = a professional shoot for a premium brand; 5 = acceptable stock; 3 = obviously generated):
- realism: would a viewer believe this is a photograph (or a deliberate high-end render)? Subtract for AI tells: garbled or fake text on labels, warped geometry, melted edges, impossible reflections, plastic skin, extra fingers, over-smooth surfaces, HDR glow. Mechanical, technical and anatomical subjects (watch movements, engines, circuit boards, instruments, hands, food, architecture) must make physical sense to an expert in that field: parts that connect and could work, the right count and placement of components, plausible finishing. A specialist customer spots a fake mechanism at once, so implausible mechanical detail caps realism at 4 however polished it looks; when a faithful subject cannot be generated, recommend a crop, angle or subject that does not expose the mechanism.
- light: one clear, soft, motivated light source; controlled shadows; no flat or muddy light.
- composition: subject placement, crop and negative space suited to the slot; product fills the frame enough to read at phone size.
- premium: styling, props, surface and color grade at the level of the references; no clichés (sunset circles, floating objects, gradient blobs, coffee beans scattered everywhere, steam wisps, bokeh fairy lights).
- fit: matches the brand and the slot.
- concept: is this a directed image with its own angle (an unexpected scale, crop, object or staging), or the first picture anyone would generate for this category? 9-10 directed, 5 the default category scene. It does not lower overall on its own; it breaks ties between variants.
- palette_fit: does the image's grade belong to the page palette${palette.length ? ` (${palette.join(', ')}: shadows, highlights, then the one accent)` : inPlace ? ' (read it from the page around the image)' : ' (read it from the brand and slot)'}? 10 = shadows, highlights and the single saturated colour all come from it, so the image looks shot for this brand; 7 = neutral and harmless; 5 or lower = its own colour world (stock blue sky, golden-hour orange, teal and orange) that fights the page. An image graded to the page reads as part of the brand; a natural-colour scene reads as stock. overall is never more than two points above palette_fit.
- integration: ${inPlace ? 'how well the image is composed into the layout where it sits' : 'how well it is built to be composed into its slot'}: one image owning its section at real scale, type or product UI set over a calm field it leaves, a cut-out subject layered in front of or behind the headline, an edge that blends into the page ground, a crop that runs off the frame on purpose. 10 = it could not be lifted out without breaking the design; 7 = a clean framed photo in a grid; 5 or lower = a boxed stock photo floating in an empty band, a cut-out with a halo or a hard edge, a scrim so heavy the image turns to mud, or effects stacked for their own sake (glow, blur, duotone and grain all at once). ${inPlace ? 'overall is never more than two points above integration.' : ''}
- overall.
List the concrete problems, then rewrite the image as an art-directed job in better_job, one short phrase per field: subject (what is in the frame, from which distance), concept (the idea it carries, not the scene, in a sentence), shadows, highlights and accent (each a #rrggbb hex from the page palette; accent is the one saturated colour), grade (monochrome, duotone, desaturated-one-accent or full-color), light and light_reason, texture (grain, halftone, torn paper, collage or none) and texture_reason, slot (where it sits on the page), field (the area left empty for type or UI), mode (cutout, tile or bleed), prop (the brand colour or mark inside the frame) and exclude (what must not appear, including "text on labels" when a label would garble).
Do not open any files other than the attached images.`;

let verdict;
try { verdict = askModel(found, {images: [...shown, ...refs], prompt, schema}); } catch (e) { console.error(`photo check failed: ${e.message}`); process.exit(1); }
mkdirSync(dirname(out), {recursive: true});
verdict.images.forEach((v, i) => { v.hero = Boolean(hero[i]); });
writeFileSync(out, JSON.stringify({cli: found.cli, min, heroMin, ...verdict}, null, 2));
let weak = 0;
verdict.images.forEach((v, i) => {
  const floor = v.hero ? heroMin : min, ok = v.overall >= floor; if (!ok) weak++;
  console.log(`${ok ? 'KEEP' : 'REGENERATE'} ${basename(images[i] || v.image)}${v.hero ? ` (first screen, floor ${heroMin})` : ''}: overall ${v.overall} · realism ${v.realism} · light ${v.light} · composition ${v.composition} · premium ${v.premium} · fit ${v.fit} · palette ${v.palette_fit} · integration ${v.integration}`);
  for (const p of v.problems) console.log(`  - ${p}`);
});
const jobs = verdict.images.map((v, i) => ({v, file: images[i]})).filter(({v}) => v.overall < (v.hero ? heroMin : min) && v.better_job).map(({v, file}) => {
  const b = v.better_job;
  return {out: file, subject: b.subject, concept: b.concept, palette: {shadows: b.shadows, highlights: b.highlights, accent: b.accent}, grade: b.grade, light: b.light, light_reason: b.light_reason, texture: b.texture, texture_reason: b.texture_reason, placement: {slot: b.slot, field: b.field, mode: b.mode}, prop: b.prop, exclude: b.exclude};
});
const redo = join(dirname(out), 'regenerate.json');
if (jobs.length) writeFileSync(redo, JSON.stringify(jobs, null, 2));
console.log(`\n${weak ? `${weak} image(s) below their floor (${min}, first screen ${heroMin}). Regenerate them with: node ${join(dirname(fileURLToPath(import.meta.url)), 'image.mjs')} --batch ${redo}  (at most three attempts per image), then check again.` : 'All images pass.'} Written to ${out}`);
process.exit(weak ? 1 : 0);
