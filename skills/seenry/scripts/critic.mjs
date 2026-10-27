#!/usr/bin/env node
/** Blind critic: a fresh model process that has never seen your reasoning scores the rendered page against the
 *  references, the way a design director or client would. Self-review grades its own work 9/10; a blind critic does not.
 *
 *  node critic.mjs --board .seenry/review/board.png --first .seenry/review/first.png --brief BRIEF.md
 *                  [--refs a.png,b.png] [--kept .seenry/refs/kept.md] [--out .seenry/review/critic.json] [--cli codex|claude]
 *
 *  Uses the Codex CLI (`codex exec`) or Claude Code (`claude -p`), whichever is installed (override with --cli or
 *  SEENRY_CRITIC). Prints scores and the fixes ranked by visible impact, and writes them to --out. */
import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {mkdtempSync} from 'node:fs';
import {findCli, askModel} from './model_cli.mjs';
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const board = resolve(flag('board', '.seenry/review/board.png'));
const first = resolve(flag('first', '.seenry/review/first.png'));
const out = resolve(flag('out', '.seenry/review/critic.json'));
markWorkDir(out);
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);
// The page while scrolling: frames down the page, paired with the named site when there is one.
const scrollStrips = [flag('scroll'), flag('scroll-phone')].filter(Boolean).map(p => resolve(p)).filter(existsSync);
const scrollPaired = args.includes('--scroll-paired');
const identityBoard = flag('identity') && existsSync(resolve(flag('identity'))) ? resolve(flag('identity')) : '';
const keptPath = flag('kept');
const kept = keptPath && existsSync(keptPath) ? readFileSync(keptPath, 'utf8').trim().slice(0, 2400) : '';
// A pattern map means the person named a site to be inspired by: its patterns are the brief, not copying.
const patternsPath = flag('patterns');
const patterns = patternsPath && existsSync(patternsPath) ? readFileSync(patternsPath, 'utf8').trim().slice(0, 2400) : '';
const briefPath = flag('brief');
const brief = briefPath && existsSync(briefPath) ? readFileSync(briefPath, 'utf8') : (flag('job') || 'A web page.');
for (const f of [board, first]) if (!existsSync(f)) { console.error(`Missing ${f}. Run review_board.mjs first.`); process.exit(2); }

// One critic run swings about a point either way and changes its mind between rounds, so the score is the median of
// three independent runs and the fixes come from the run that scored the median.
const runs = Number(flag('runs', '3'));
if (runs > 1) {
  const work = mkdtempSync(join(tmpdir(), 'seenry-critic-'));
  const pass = args.filter((a, i) => a !== '--out' && args[i - 1] !== '--out' && a !== '--runs' && args[i - 1] !== '--runs');
  const results = (await Promise.all(Array.from({length: runs}, (_, k) => new Promise(done => {
    const file = join(work, `run-${k}.json`);
    const child = spawn(process.execPath, [new URL(import.meta.url).pathname, ...pass, '--runs', '1', '--out', file], {stdio: ['ignore', 'ignore', 'pipe']});
    let err = ''; child.stderr.on('data', d => err += d);
    child.on('close', code => { try { done(JSON.parse(readFileSync(file, 'utf8'))); } catch { if (code) process.stderr.write(err.slice(0, 600)); done(null); } });
  })))).filter(Boolean);
  if (!results.length) { console.error('critic failed on every run.'); process.exit(1); }
  const median = xs => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)];
  const keys = Object.keys(results[0].scores);
  const scores = Object.fromEntries(keys.map(k => [k, median(results.map(r => r.scores[k]))]));
  const chosen = results.find(r => r.scores.overall === scores.overall) || results[0];
  const merged = {...chosen, scores, runs: results.map(r => r.scores.overall)};
  mkdirSync(dirname(out), {recursive: true});
  writeFileSync(out, JSON.stringify(merged, null, 2));
  console.log(`Blind critic (${chosen.cli}, median of ${results.length} runs: ${merged.runs.join('/')}): overall ${scores.overall}/10 · premium ${scores.premium} · clean ${scores.clean} · no-slop ${scores.no_slop} · idea ${scores.idea} · identity ${scores.identity} · category ${scores.category_fit} · imagery ${scores.imagery} · type ${scores.typography} · layout ${scores.layout} · craft ${scores.craft} · mobile ${scores.mobile}${scores.reference_fit ? ` · reference fit ${scores.reference_fit}` : ''}`);
  if (chosen.slop.length) console.log('Slop seen: ' + chosen.slop.join('; '));
  if (chosen.missing_signatures?.length) console.log('Missing from the named site: ' + chosen.missing_signatures.join('; '));
  console.log(chosen.verdict);
  chosen.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.where}] ${f.problem} → ${f.fix}`));
  console.log(`\nWritten to ${out}`);
  process.exit(0);
}
const found = findCli(flag('cli', process.env.SEENRY_CRITIC));
if (!found) { console.error('No working critic CLI found (codex or claude). Ask an independent reviewer to score board.png and first.png instead.'); process.exit(2); }
const {cli} = found;

const screen = resolve(dirname(first), 'first-1440.png');
const images = [board, first, ...refs, ...(existsSync(screen) ? [screen] : []), ...(identityBoard ? [identityBoard] : []), ...scrollStrips];
const listing = [`image 1 = the candidate: full desktop page at half scale (left) and phone page (right)`,
  `image 2 = the candidate's desktop first screen beside the reference screens`,
  ...refs.map((r, i) => `image ${i + 3} = reference ${r.split('/').pop()}`),
  ...(existsSync(screen) ? [`image ${refs.length + 3} = the candidate's desktop first screen at full 1440 size: judge text size and weight here`] : []),
  ...(identityBoard ? [`image ${images.length - scrollStrips.length} = the designer's own identity board (wordmark, type, color, device, a poster): what the page promised to be`] : []),
  ...scrollStrips.map((p, i) => `image ${images.length - scrollStrips.length + i + 1} = the candidate while scrolling, ${i ? 'on a phone' : 'at 1440'}: frames at even points down the page${scrollPaired ? ', each row the named reference site (left) beside the candidate (right) at the same point of their pages' : ''}`)].join('\n');
const KEYS = ['premium', 'clean', 'no_slop', 'idea', 'identity', 'category_fit', 'imagery', 'typography', 'layout', 'craft', 'mobile', ...(refs.length ? ['reference_fit'] : []), 'overall'];
const schema = {type: 'object', additionalProperties: false, required: ['scores', 'slop', 'verdict', 'fixes', ...(refs.length ? ['copies_reference'] : []), ...(patterns ? ['missing_signatures'] : [])], properties: {
  ...(patterns ? {missing_signatures: {type: 'array', items: {type: 'string'}}} : {}),
  scores: {type: 'object', additionalProperties: false, required: KEYS, properties: Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}]))},
  slop: {type: 'array', items: {type: 'string'}},
  ...(refs.length ? {copies_reference: {type: 'string'}} : {}),
  verdict: {type: 'string'},
  fixes: {type: 'array', minItems: 3, maxItems: 8, items: {type: 'object', additionalProperties: false, required: ['where', 'problem', 'fix'],
    properties: {where: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}}};
const prompt = `You are a senior design director at a studio known for brand and product work, who has also shipped product design at companies like Stripe, Linear and Apple. You are reviewing one candidate before it goes to the client. You did not make it and owe it nothing. The client's standard: clean, premium, no AI slop, at the level of the best brands in this product's own category and of the best independent studios. Clean and correct is not the bar: a page with no slop and a tidy conventional layout is a 6. Most AI-built pages are competent templates; your job is to say so when this is one.

${listing}

The reference images are real screens from top companies. They are the bar.${kept ? `

The designer studied these references and kept them for specific reasons. In their words:
${kept}

Check the craft claims on the pixels (spacing, type detail, density, finish) and that the listed conventions are met and listed clichés avoided. Matching a reference's composition, hue or display type earns nothing; copying a reference's layout, copy or signature wholesale is a failure.` : ''}${patterns ? `

The person named a site to be inspired by. The designer's pattern map lists that site's recognizable patterns and how this brand carries each one:
${patterns}

For this site, matching its composition, type treatment, material and components is what was asked for. Check each listed pattern is visibly carried in this brand's own way; a pattern that was dropped or flattened into a generic version costs reference_fit. Never count a listed pattern as slop, decoration, a stand-in or a cliché: the person asked for it. Judge only whether it is carried at the reference's level and in this brand's own way.` : ''}

The brief:
${brief}

Reward design thinking in the small parts: when the product's idea shows up simply in ordinary components (progress in the product's own unit, selection that changes the object, buttons written as the user's reply, a payoff made from the user's answers) and stays instantly legible, that is the strongest sign of a designed product; credit it under idea and craft. A metaphor that needs learning, or one applied to everything, is a gimmick.

When the idea is physical objects (a brand printed on a thing, a collection, a table of items), they must read as real objects: material, construction details and depth with one consistent light. Flat colored rectangles with a label, arranged in a tidy grid, cost at least two points on craft and imagery.

When the brief names an existing app as the reference, judge against what it asked for. "Similar to", "like" or "replicate" asks for that app's look with new content: resemblance is the goal, so do not mark it down for looking like the reference; mark down only unchanged copy, assets or wordmark. "Inspired by" asks for the reference's recognizable design patterns in a new brand: someone who knows the reference should recognize the family at a glance (its layout moves, type treatment, material and mood, signature components, motion), while the name, copy, artwork and subject are this brand's own. Carrying the patterns is the goal and scores well on idea and identity; a page that keeps only an abstract concept and looks unrelated to the reference has missed the brief and scores low on reference_fit. Only reproducing its content, assets, wordmark text or exact artwork is copying. If research/core.md principles are quoted in the brief, check each one is visibly carried.

Score 1-10, calibrated so that the reference screens score about 8-9 and a competent template scores 5. Calibration anchors: the first screen most AI tools produce (headline and subhead left, two buttons, a card or illustration right, a pill badge, a row of stats) is a competent template, 6 at most, however cleanly built; a clean hero with the headline on the left and the product boxed in a rounded card on the right is a competent template, 6 at most, unless this category's leaders compose exactly that way; a page any category could have produced by swapping the copy is 6 at most; a text column on the left with a photograph filling the right half, a giant standalone numeral (a count, a time, a date) as the hero device, or a centered headline over a boxed product card is a generated template, 6 at most, however clean; 9 means a studio would put it in its portfolio. Do not reward effort, interactivity or polish on a composition that is wrong for the category:
- premium: would this sit beside the references as the same level of craft?
- clean: calm, uncluttered, clear hierarchy, nothing decorative that does not help the job.
- no_slop: 10 = none of the AI-generated tells; subtract for each: uppercase letter-spaced labels or eyebrows, numbered labels like "01 /", italic serif accent words, trendy default fonts, default AI palettes (cream+terracotta, plum+peach, navy+lime), clip-art imagery (sunset circles, vinyl records, flat product stand-ins), colored KPI hero cards with decoration, pill badges everywhere, tilted floating cards with stickers, floating toast or notification cards around a product mock, cards that lift with a growing drop shadow on hover, a row of three invented stats under the hero, a struck-through word in the headline, a hero that explains itself with labels, tooltips and instruction lines, the product inside an app-style card with tabs, heavy 700+ weights, gradient blobs, generic slogans, tiny or faint text.
- idea: is there one clear idea that comes from this product's own claim and proof, carried through the hero, imagery, copy and a signature detail? A page assembled from generic patterns, or one that borrows another brand's signature idea, scores low even when it is clean. ${patterns ? 'The named site\'s look is what was asked for: judge idea by whether this brand\'s own story shows through it (its name, copy, artwork and one signature detail).' : 'If putting a reference\'s or a category leader\'s logo on it would make it read as that brand\'s page, idea is 6 or lower.'}
- identity: is there a designed identity, the way a studio would deliver one: one typographic voice with character set with conviction, one color used as a full field, one graphic device that comes from the brand's truth and repeats across sections, and one consistent image treatment? ${patterns ? 'For a named site, resembling that site is the brief, never a fault: score identity on whether the name, copy, artwork and one signature detail are clearly this brand\'s own, and on how confidently the reference\'s identity is carried. A page that drifts away from the reference toward a generic look is 6 or lower.' : 'Cover the logo: if the page is still recognizable as this brand, 8+; if it reads as a well-made template with a palette applied, 6 or lower.'} Identity can be quiet: a calm, photography-led page with a precise type voice and one consistent image treatment (the way Aesop or Apple work) scores as high as a loud color field when it is just as recognizable; never reward loudness for its own sake, and mark down color fields and display type that crowd out a real subject.${identityBoard ? ' Compare the page with the designer\'s identity board (last image): a page that sets the board\'s type, color field, device and poster composition with less confidence than the board itself, or drops them into ordinary web sections, is identity 6 or lower, and say what from the board the page lost.' : ''}
- category_fit: name the category and two or three of its best brands, then ask whether they would ship this first screen. A composition imported from another category (a SaaS split with a boxed product card for a luxury object, dashboard cards on an editorial or hospitality page, an app-store hero for a physical product) is 5 or lower. Luxury and physical products let the object own the frame; boxed media, tabs, tooltips and instruction lines around the hero object are UI chrome that cheapens it.
- imagery: real photography or a faithful render of the actual subject earns points; generated imagery with implausible detail (mechanisms, hands, text, food, architecture or products that do not make physical sense, mismatched lighting) is a slop tell and scores 4 or lower however polished it looks, because the target customer notices. No imagery where the category expects it scores low; decorative stock scores low.
- typography, layout, craft, mobile. Layout includes vertical rhythm: a headline jammed under the nav, or a column stretched to match an image's height with dead gaps instead of being composed, costs at least two points.${refs.length ? `
- copies_reference: ${patterns ? 'for a named site, layout and composition are meant to follow it; name the reference only if the candidate reuses its actual content: its copy, logo or wordmark text, or its exact images. Otherwise the empty string.' : 'name the reference file if any section of the candidate reproduces that one reference\'s layout, composition or signature visual nearly unchanged (same arrangement, same imagery treatment, same distinctive device), otherwise the empty string. Learning a pattern is fine; copying one page is not.'}
- reference_fit: ${patterns ? 'recognition of the named site: would someone who knows it see its family at once (layout moves, type treatment, material, components, motion) while the brand, copy and artwork are clearly this product\'s own? 9-10 = recognized at a glance and its own; 6 = a few patterns survive; 4 = only an abstract concept survives and it looks unrelated. Then, separately, ' : ''}does the candidate reach the reference screens' class of craft and meet the usability conventions people expect, while looking like its own product? 9-10 = same craft class, clearly different identity; 6 = a lesser class of product; 3 = misses conventions people need. When this is below 8, at least two fixes must name the reference and the craft lesson to meet (spacing, type detail, finish), never its look.` : ''}
- overall: against the client's standard. Decoration never earns points; distinctiveness counts only when achieved cleanly. overall is never more than one point above the lowest of idea, identity, category_fit, imagery and no_slop: one failing dimension fails the page.
List every slop tell you see. Then the fixes that would raise overall most, most visible first: where on the page, the problem, and a concrete change (sizes, weights, colors, what to remove or replace). Remove decoration, but when you remove material (a photo, a diagram, a section's visual), say what stronger material replaces it, usually the product working at real scale; a page stripped to headings and small lists is worse, not cleaner. Judge editing the way a top studio's creative director would: name anything a studio would cut (a crowded first screen, captions that explain what the image already shows, a second supporting paragraph, a section that repeats an earlier point, secondary text squeezed into tight space), and treat over-density as a premium and layout problem even when every part is good. Judge typographic range below the first screen: when the middle repeats one heading-plus-paragraph treatment, or the display face is used the same way in every section, say so in typography and name the move each such section should use (a pull quote set large in the text face, a captioned grid, a measured number with its annotation, an editorial passage with a margin note, a sharp scale contrast inside the section). Judge the second half as hard as the hero: when the identity is strong in the first screen but pricing, FAQ, security, testimonials or the closing band fall back to stock patterns, say so, cap identity at 7, and say how each such section should carry the type voice, field color and device. Flag generated photography that uses the generator's default light (golden hour, moody mist) on a brand whose truth suggests another. Flag repeated section rhythm (the same heading, paragraph and bordered module down the page) and demos where several elements compete at equal weight, and say which different composition each such section should take. Flag sections that are small or sparse for a 1440 canvas (section headings under 40px, no visual anchor) the way the references would never ship them. Say what the references do that the candidate does not. Never recommend text smaller than 16px for paragraphs, 15px for other readable text or 14px for short labels at 1440; image 1 is shown at about half scale, so judge text size from the full-size first screen and relative to the references, never from the scaled board. check.mjs has already verified every text size and contrast minimum, so name text size as a problem only where it is visibly smaller than the equivalent text in the references.
${patterns ? `Missing signatures: look at the named site itself in the reference images${scrollPaired ? ' and the left side of each scroll pair' : ''}, not only at the designer\'s pattern map. List in missing_signatures every recognizable element of that site the candidate lacks or carries visibly worse (its hero object and how type and imagery layer, its color and light in the state shown, its header, its section moves, its signature components), each with where it shows. reference_fit is 8 or more only when none is missing, and each missing signature is a fix, ahead of other fixes.\n` : ''}${scrollStrips.length ? `Judge the scroll frames as hard as the stills: a person sees every one of them. Anything that only goes wrong while scrolling counts in craft, layout and mobile: a fixed or sticky header or control sitting over text with no backing, text or images cut at the fold, a section change caught half-finished or blank, content that jumps or overlaps between frames. Any one of these caps craft at 6 and must appear in the fixes with the frame it shows in.${scrollPaired ? ' For the named site, compare each pair: where the reference has a moment (a header state, a scene, a reveal, a change of ground) and the candidate does not, or carries it worse, say so under reference_fit and in the fixes.' : ''}\n` : ''}Do not open any files other than the attached images.`;

mkdirSync(dirname(out), {recursive: true});
let verdict;
try { verdict = askModel(found, {images, prompt, schema}); } catch (e) { console.error(`critic failed: ${e.message}`); process.exit(1); }

// A page made like a named site cannot score above how much it looks like that site.
if (patterns && Number.isFinite(verdict.scores.reference_fit) && verdict.scores.overall > verdict.scores.reference_fit) { verdict.capped = {from: verdict.scores.overall, to: verdict.scores.reference_fit, by: 'reference_fit'}; verdict.scores.overall = verdict.scores.reference_fit; }
const capFrom = ['idea', 'identity', 'category_fit', 'imagery', 'no_slop'].filter(k => Number.isFinite(verdict.scores[k]));
if (capFrom.length) { const cap = Math.min(...capFrom.map(k => verdict.scores[k])) + 1; if (verdict.scores.overall > cap) { verdict.capped = {from: verdict.scores.overall, to: cap}; verdict.scores.overall = cap; } }
writeFileSync(out, JSON.stringify({cli, images, ...verdict}, null, 2));
const s = verdict.scores;
console.log(`Blind critic (${cli}): overall ${s.overall}/10 · premium ${s.premium} · clean ${s.clean} · no-slop ${s.no_slop} · idea ${s.idea} · identity ${s.identity} · category ${s.category_fit} · imagery ${s.imagery} · type ${s.typography} · layout ${s.layout} · craft ${s.craft} · mobile ${s.mobile}${s.reference_fit ? ` · reference fit ${s.reference_fit}` : ''}`);
if (verdict.slop.length) console.log('Slop seen: ' + verdict.slop.join('; '));
if (verdict.missing_signatures?.length) console.log('Missing from the named site: ' + verdict.missing_signatures.join('; '));
console.log(verdict.verdict);
verdict.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.where}] ${f.problem} → ${f.fix}`));
console.log(`\nWritten to ${out}`);
