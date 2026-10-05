#!/usr/bin/env node
/** Photo check: a blind art director scores each image for the slot it will fill, against the reference screens.
 *  Weak imagery is the most-cited gap between generated pages and big-company pages; this rejects it before layout.
 *
 *  node photo_check.mjs <image> [<image> ...] --use "product hero, 3:4, right column" [--refs a.png,b.png]
 *                       [--brand "Ferro, specialty coffee roaster, Lisbon"] [--min 8] [--out .seenry/review/photos.json]
 *
 *  Prints KEEP or REGENERATE per image with the problems and a better prompt. Exits 1 if any image is below --min. */
import {existsSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname, basename} from 'node:path';
import {findCli, askModel} from './model_cli.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const images = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))).map(p => resolve(p));
if (!images.length || images.some(p => !existsSync(p))) { console.error('Usage: node photo_check.mjs <image> [...] --use "<slot>" [--refs a.png,b.png] [--brand "<brand>"]'); process.exit(2); }
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);
const min = Number(flag('min', '8')), out = resolve(flag('out', '.seenry/review/photos.json'));
const found = findCli(process.env.SEENRY_CRITIC);
if (!found) { console.error('No working Codex or Claude CLI found; review the images yourself against the rules in SKILL.md.'); process.exit(2); }

const KEYS = ['realism', 'light', 'composition', 'premium', 'fit', 'overall'];
const schema = {type: 'object', additionalProperties: false, required: ['images'], properties: {images: {type: 'array', items: {
  type: 'object', additionalProperties: false, required: ['image', ...KEYS, 'problems', 'better_prompt'], properties: {
    image: {type: 'string'}, ...Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}])),
    problems: {type: 'array', items: {type: 'string'}}, better_prompt: {type: 'string'}}}}}};
const listing = [...images.map((p, i) => `image ${i + 1} = candidate ${basename(p)}`), ...refs.map((p, i) => `image ${images.length + i + 1} = reference screen ${basename(p)}`)].join('\n');
const prompt = `You are the art director for ${flag('brand', 'a premium brand')}. You approve or reject imagery before it goes on the site. The standard is the photography of Apple, Aesop, ARKET and Stripe: real, calm, precisely lit, art-directed, never stock-like or AI-looking.

${listing}
${refs.length ? 'The reference screens show the level of imagery the site must match.\n' : ''}
Each candidate will be used as: ${flag('use', 'a hero image')}.

Score each candidate 1-10 (8 = a professional shoot for a premium brand; 5 = acceptable stock; 3 = obviously generated):
- realism: would a viewer believe this is a photograph (or a deliberate high-end render)? Subtract for AI tells: garbled or fake text on labels, warped geometry, melted edges, impossible reflections, plastic skin, extra fingers, over-smooth surfaces, HDR glow.
- light: one clear, soft, motivated light source; controlled shadows; no flat or muddy light.
- composition: subject placement, crop and negative space suited to the slot; product fills the frame enough to read at phone size.
- premium: styling, props, surface and color grade at the level of the references; no clichés (sunset circles, floating objects, gradient blobs, coffee beans scattered everywhere, steam wisps, bokeh fairy lights).
- fit: matches the brand and the slot.
- overall.
List the concrete problems, then write a better generation prompt that fixes them (subject, set and surface, light, lens and distance, composition for the slot, color grade, what to exclude, including "no text on labels" when a label would garble).
Do not open any files other than the attached images.`;

let verdict;
try { verdict = askModel(found, {images: [...images, ...refs], prompt, schema}); } catch (e) { console.error(`photo check failed: ${e.message}`); process.exit(1); }
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
