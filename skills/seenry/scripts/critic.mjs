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

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const board = resolve(flag('board', '.seenry/review/board.png'));
const first = resolve(flag('first', '.seenry/review/first.png'));
const out = resolve(flag('out', '.seenry/review/critic.json'));
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);
const keptPath = flag('kept');
const kept = keptPath && existsSync(keptPath) ? readFileSync(keptPath, 'utf8').trim().slice(0, 2400) : '';
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
  console.log(`Blind critic (${chosen.cli}, median of ${results.length} runs: ${merged.runs.join('/')}): overall ${scores.overall}/10 · premium ${scores.premium} · clean ${scores.clean} · no-slop ${scores.no_slop} · idea ${scores.idea} · type ${scores.typography} · layout ${scores.layout} · craft ${scores.craft} · mobile ${scores.mobile}${scores.reference_fit ? ` · reference fit ${scores.reference_fit}` : ''}`);
  if (chosen.slop.length) console.log('Slop seen: ' + chosen.slop.join('; '));
  console.log(chosen.verdict);
  chosen.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.where}] ${f.problem} → ${f.fix}`));
  console.log(`\nWritten to ${out}`);
  process.exit(0);
}
const found = findCli(flag('cli', process.env.SEENRY_CRITIC));
if (!found) { console.error('No working critic CLI found (codex or claude). Ask an independent reviewer to score board.png and first.png instead.'); process.exit(2); }
const {cli} = found;

const screen = resolve(dirname(first), 'first-1440.png');
const images = [board, first, ...refs, ...(existsSync(screen) ? [screen] : [])];
const listing = [`image 1 = the candidate: full desktop page at half scale (left) and phone page (right)`,
  `image 2 = the candidate's desktop first screen beside the reference screens`,
  ...refs.map((r, i) => `image ${i + 3} = reference ${r.split('/').pop()}`),
  ...(existsSync(screen) ? [`image ${refs.length + 3} = the candidate's desktop first screen at full 1440 size: judge text size and weight here`] : [])].join('\n');
const KEYS = ['premium', 'clean', 'no_slop', 'idea', 'typography', 'layout', 'craft', 'mobile', ...(refs.length ? ['reference_fit'] : []), 'overall'];
const schema = {type: 'object', additionalProperties: false, required: ['scores', 'slop', 'verdict', 'fixes', ...(refs.length ? ['copies_reference'] : [])], properties: {
  scores: {type: 'object', additionalProperties: false, required: KEYS, properties: Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}]))},
  slop: {type: 'array', items: {type: 'string'}},
  ...(refs.length ? {copies_reference: {type: 'string'}} : {}),
  verdict: {type: 'string'},
  fixes: {type: 'array', minItems: 3, maxItems: 8, items: {type: 'object', additionalProperties: false, required: ['where', 'problem', 'fix'],
    properties: {where: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}}};
const prompt = `You are a design director who has shipped work at companies like Stripe, Linear and Apple, reviewing one candidate before it goes to the client. You did not make it and owe it nothing. The client's standard: clean, premium, no AI slop, at the same level as the best big-company product design.

${listing}

The reference images are real screens from top companies. They are the bar.${kept ? `

The designer studied these references and kept them for specific reasons. In their words:
${kept}

Check each claim on the pixels: did the candidate actually carry that pattern (layout, message order, proof, type scale, density) and reach that reference's level of craft, or only name it? A kept reference must change the page; copying a reference's layout, copy or signature wholesale is a failure too.` : ''}

The brief:
${brief}

Score 1-10, calibrated so that the reference screens score about 8-9 and a competent template scores 5:
- premium: would this sit beside the references as the same level of craft?
- clean: calm, uncluttered, clear hierarchy, nothing decorative that does not help the job.
- no_slop: 10 = none of the AI-generated tells; subtract for each: uppercase letter-spaced labels or eyebrows, numbered labels like "01 /", italic serif accent words, trendy default fonts, default AI palettes (cream+terracotta, plum+peach, navy+lime), clip-art imagery (sunset circles, vinyl records, flat product stand-ins), colored KPI hero cards with decoration, pill badges everywhere, tilted floating cards with stickers, heavy 700+ weights, gradient blobs, generic slogans, tiny or faint text.
- idea: is there one clear idea that comes from this product's own claim and proof, carried through the hero, imagery, copy and a signature detail? A page assembled from generic patterns, or one that borrows another brand's signature idea, scores low even when it is clean.
- typography, layout, craft, mobile.${refs.length ? `
- copies_reference: name the reference file if any section of the candidate reproduces that one reference's layout, composition or signature visual nearly unchanged (same arrangement, same imagery treatment, same distinctive device), otherwise the empty string. Learning a pattern is fine; copying one page is not.
- reference_fit: does the candidate hold up beside the reference screens and carry what was kept from them? 9-10 = it takes their lessons and matches their craft in its own way; 6 = it names references but looks like a different, lesser class of product; 3 = no visible relationship. When this is below 8, at least two fixes must say which reference to look at and what to take from it.` : ''}
- overall: against the client's standard. Decoration never earns points; distinctiveness counts only when achieved cleanly.
List every slop tell you see. Then the fixes that would raise overall most, most visible first: where on the page, the problem, and a concrete change (sizes, weights, colors, what to remove or replace). Remove decoration, but when you remove material (a photo, a diagram, a section's visual), say what stronger material replaces it, usually the product working at real scale; a page stripped to headings and small lists is worse, not cleaner. Flag repeated section rhythm (the same heading, paragraph and bordered module down the page) and demos where several elements compete at equal weight, and say which different composition each such section should take. Flag sections that are small or sparse for a 1440 canvas (section headings under 40px, no visual anchor) the way the references would never ship them. Say what the references do that the candidate does not. Never recommend text smaller than 16px for paragraphs, 15px for other readable text or 14px for short labels at 1440; image 1 is shown at about half scale, so judge text size from the full-size first screen and relative to the references, never from the scaled board. check.mjs has already verified every text size and contrast minimum, so name text size as a problem only where it is visibly smaller than the equivalent text in the references.
Do not open any files other than the attached images.`;

mkdirSync(dirname(out), {recursive: true});
let verdict;
try { verdict = askModel(found, {images, prompt, schema}); } catch (e) { console.error(`critic failed: ${e.message}`); process.exit(1); }

writeFileSync(out, JSON.stringify({cli, images, ...verdict}, null, 2));
const s = verdict.scores;
console.log(`Blind critic (${cli}): overall ${s.overall}/10 · premium ${s.premium} · clean ${s.clean} · no-slop ${s.no_slop} · idea ${s.idea} · type ${s.typography} · layout ${s.layout} · craft ${s.craft} · mobile ${s.mobile}${s.reference_fit ? ` · reference fit ${s.reference_fit}` : ''}`);
if (verdict.slop.length) console.log('Slop seen: ' + verdict.slop.join('; '));
console.log(verdict.verdict);
verdict.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.where}] ${f.problem} → ${f.fix}`));
console.log(`\nWritten to ${out}`);
