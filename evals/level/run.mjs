#!/usr/bin/env node
/** Does the skill, alone, produce a page at the level bar? One fresh agent per brief and model, then a blind judge.
 *
 *  node evals/level/run.mjs [--models claude:sonnet,codex] [--briefs cash-forecast,…] [--out evals/level/results] [--level <dir of level images>] [--dry]
 *
 *  Each run gets an empty folder, the brief, and one instruction: follow skills/seenry/SKILL.md with nobody to review.
 *  Briefs marked "level" also get the images in --level as the person's level reference. The judge sees only the
 *  finished page (and the level images) and scores execution, impact and looks-AI from 1 to 10.
 *  A model passes when 4 of 5 briefs reach execution 8 and impact 8 with the page not below the reference and a
 *  `Stack:` line in DESIGN.md (the framework each run picked is recorded).
 *  Default models are the ones the skill must work for: a Sonnet-class Claude and Codex, not only the strongest.
 *  --dry prints the commands and writes nothing but the folders. --rejudge keeps the pages already built in --out and
 *  only screenshots and scores them again. Results: <out>/results.json. The page is screenshotted with reduced motion:
 *  a full-page still of a page that reveals on scroll otherwise shows empty bands, and the judge marked them as gaps.
 *
 *  A run only counts when the skill's gate ran: the gate needs a browser, image generation and the Seenry MCP need
 *  the network, and Codex's workspace-write sandbox allows neither (a first run built a page with no image and no
 *  gate). So Codex runs with its sandbox off, in a folder made for the run; do not point --out at anything you keep.
 *  The gate's own record (.seenry/review) is read for the score line; a run whose gate never ran is "invalid", not a fail. */
import {existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync, statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..', '..'), skill = join(root, 'skills', 'seenry');
const args = process.argv.slice(2), flag = (n, f) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : f; };
const dry = args.includes('--dry'), rejudge = args.includes('--rejudge');
export const DEFAULT_MODELS = ['claude:sonnet', 'codex'];
export const PASS = {execution: 8, impact: 8, briefs: 4};
const models = String(flag('models', DEFAULT_MODELS.join(','))).split(',').map(s => s.trim()).filter(Boolean);
const wanted = flag('briefs') ? new Set(flag('briefs').split(',')) : null;
const briefs = JSON.parse(readFileSync(join(here, 'briefs.json'), 'utf8')).filter(b => !wanted || wanted.has(b.id));
const out = resolve(flag('out', join(here, 'results'))), levelDir = flag('level') ? resolve(flag('level')) : null;
const images = d => d && existsSync(d) ? readdirSync(d).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).map(f => join(d, f)) : [];

const task = b => `Read ${join(skill, 'SKILL.md')} and follow it exactly, step by step, in this folder. Nobody can review: this is an unattended run. The brief is in .seenry/brief.md${b.level && levelDir ? ', and the person showed the work in .seenry/level/ for the level they want' : ''}. Build the page in this folder in the stack the skill has you pick; when it has a build step, run it so the built page exists as dist/index.html. Finish by running the gate (check.mjs), applying what it says and running it again until it prints a final line (QUICK final, PASS or STOP). Do not ask questions.`;
export function command(model, work, prompt) {
  const [cli, name] = model.split(':');
  if (cli === 'codex') return ['codex', ['exec', '--skip-git-repo-check', '--dangerously-bypass-approvals-and-sandbox', ...(name ? ['-m', name] : []), '-C', work, prompt]];
  return ['claude', ['-p', prompt, ...(name ? ['--model', name] : []), '--permission-mode', 'bypassPermissions', '--add-dir', root]];
}
const SCHEMA = {type: 'object', additionalProperties: false, required: ['execution', 'impact', 'looks_ai', 'below_reference', 'gaps'], properties: {execution: {type: 'integer'}, impact: {type: 'integer'}, looks_ai: {type: 'integer'}, below_reference: {type: 'boolean'}, gaps: {type: 'array', items: {type: 'string'}}}};
const judgePrompt = refs => `You are a design director. Image 1 is a finished landing page. ${refs ? `Images 2 to ${refs + 1} are the level it had to reach.` : 'There is no reference; hold it to the best current product landing pages.'} Score 1 to 10. execution: real material at real size (for a software product, a whole app with many kinds of interface and several kinds of visualisation, charts as designed objects in one hue; for a studio, shop or portfolio, the work itself shown large and art-directed), image and layout meeting in depth rather than a picture in a box, one grid and one colour system, every section below the hero holding a moment of its own (the hero image in a new crop or role, a product moment, one measured number) rather than default cards, finished logos and controls. impact: would a design-literate person stop scrolling. looks_ai: 10 = nothing reads as generated. below_reference: true when a viewer would see at once that the page is a lower class of work${refs ? ' than the references' : ' than a leading product site'}. gaps: the three most visible, each as "part: what is missing".`;

// The agent's shell must find the same Playwright the runner uses, or the gate cannot start a browser.
function playwrightPath() {
  if (process.env.SEENRY_PLAYWRIGHT) return process.env.SEENRY_PLAYWRIGHT;
  for (const base of [process.cwd(), root, ...String(process.env.NODE_PATH || '').split(':').filter(Boolean).map(d => join(d, '..'))]) {
    try { const main = createRequire(join(base, 'noop.js')).resolve('playwright'); const mjs = join(dirname(main), 'index.mjs'); return existsSync(mjs) ? mjs : main; } catch {}
  }
  return null;
}
const pw = playwrightPath(), env = {...process.env, ...(pw ? {SEENRY_PLAYWRIGHT: pw} : {})};
/** What the gate itself recorded, so the result does not depend on how the agent worded its last message. */
export function gateRecord(work) {
  const review = join(work, '.seenry', 'review'), read = f => { try { return JSON.parse(readFileSync(join(review, f), 'utf8')); } catch { return null; } };
  const history = read('check.json') || [], scored = [...history].reverse().find(h => h && h.critic), log = String(read('last-run.json')?.log || '');
  const line = (log.match(/^(PASS|FAIL|QUICK|STOP|LAST ROUND|GATE DID NOT RUN)[^\n]*/gm) || []).pop() || null;
  return {ran: !!scored, rounds: history.length, line, critic: scored ? {overall: scored.critic.overall, impact: scored.critic.impact, execution: scored.critic.execution} : null};
}
/** Image files the run left beside its page, outside the references and the gate's own renders. */
export function imagesMade(work) {
  const skip = /(^|\/)(node_modules|\.renders|refs|level|review|research)(\/|$)/, found = [];
  const walk = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (skip.test(p.slice(work.length))) continue; const s = statSync(p); if (s.isDirectory()) walk(p); else if (/\.(png|jpe?g|webp|avif)$/i.test(n) && n !== 'page.png' && s.size > 20000) found.push(p.slice(work.length + 1)); } };
  try { walk(work); } catch {}
  return found;
}
/** The Stack line the build wrote in DESIGN.md, and the framework it names. */
export function stackOf(work) {
  const file = [join(work, 'DESIGN.md'), join(work, '.seenry', 'DESIGN.md')].find(existsSync);
  const line = file ? ((readFileSync(file, 'utf8').match(/^[ \t>*_-]*Stack:[ \t*_]*(.+)$/mi) || [])[1] || '').trim() : '';
  const what = line.split(/,?\s*\bbecause\b/i)[0];
  const framework = (what.match(/astro|next\.?js|vite|remix|nuxt|sveltekit|svelte|vue|angular|hydrogen|expo|react/i) || [])[0] || (/\bhtml\b/i.test(what) ? 'plain HTML' : line ? 'other' : null);
  return {line: line || null, framework};
}
const results = [];
for (const model of models) for (const b of briefs) {
  const work = join(out, model.replace(/[^\w.-]+/g, '-'), b.id);
  mkdirSync(join(work, '.seenry'), {recursive: true});
  if (!rejudge) writeFileSync(join(work, '.seenry', 'brief.md'), `# Brief\n\n${b.brief}\n`);
  if (b.level && levelDir) { mkdirSync(join(work, '.seenry', 'level'), {recursive: true}); for (const f of images(levelDir)) copyFileSync(f, join(work, '.seenry', 'level', f.split('/').pop())); }
  const [bin, argv] = command(model, work, task(b));
  if (dry) { console.log(`${model}  ${b.id}\n  cd ${work} && ${bin} ${argv.map(a => /\s/.test(a) ? JSON.stringify(a.slice(0, 80) + (a.length > 80 ? '…' : '')) : a).join(' ')}`); continue; }
  const started = Date.now();
  if (!rejudge) { const run = spawnSync(bin, argv, {cwd: work, env, encoding: 'utf8', timeout: 3 * 60 * 60 * 1000, maxBuffer: 1 << 28}); writeFileSync(join(work, 'transcript.txt'), (run.stdout || '') + (run.stderr || '')); }
  const page = ['index.html', 'dist/index.html', 'out/index.html', 'build/index.html', '.next/server/app/index.html'].map(f => join(work, f)).find(existsSync) || join(work, 'index.html'), row = {model, brief: b.id, page: existsSync(page) ? page : null, seconds: Math.round((Date.now() - started) / 1000)};
  const gate = gateRecord(work), made = imagesMade(work);
  Object.assign(row, {gate: gate.line, gateRan: gate.ran, gateRounds: gate.rounds, gateCritic: gate.critic, images: made.length, imageFiles: made.slice(0, 12)});
  if (row.page) {
    const shot = join(work, 'page.png');
    spawnSync(process.execPath, [join(skill, 'scripts', 'render_page.mjs'), page, shot, '--full', '--reduced', ...(pw ? ['--playwright', pw] : [])], {stdio: 'ignore', env});
    if (existsSync(shot)) {
      const {findCli, askModel} = await import(join(skill, 'scripts', 'model_cli.mjs'));
      const refs = b.level ? images(levelDir).slice(0, 3) : [];
      try { row.scores = askModel(findCli(process.env.SEENRY_CRITIC), {images: [shot, ...refs], prompt: judgePrompt(refs.length), schema: SCHEMA}); } catch (e) { row.judgeError = String(e.message || e).slice(0, 200); }
    }
  }
  const stack = stackOf(work);
  Object.assign(row, {stack: stack.line, framework: stack.framework});
  row.invalid = !row.gateRan;
  row.pass = !row.invalid && !!row.stack && !!row.scores && row.scores.execution >= PASS.execution && row.scores.impact >= PASS.impact && !row.scores.below_reference;
  results.push(row);
  console.log(`${model}  ${b.id}  ${row.invalid ? 'INVALID (the gate did not run)' : row.pass ? 'pass' : 'below the bar'}  gate ${row.gateRan ? `ran ${row.gateRounds}×` : 'did not run'}, ${row.images} image${row.images === 1 ? '' : 's'}, stack ${row.framework || 'not stated'}${row.scores ? `  execution ${row.scores.execution} impact ${row.scores.impact} looks-AI ${row.scores.looks_ai}` : row.page ? '  not judged' : '  no page built'}  ${row.seconds}s`);
}
if (!dry) {
  const summary = models.map(m => { const all = results.filter(r => r.model === m), rows = all.filter(r => !r.invalid), passed = rows.filter(r => r.pass).length; return {model: m, passed, of: rows.length, invalid: all.length - rows.length, pass: rows.length > 0 && passed >= Math.min(PASS.briefs, rows.length)}; });
  mkdirSync(out, {recursive: true});
  writeFileSync(join(out, 'results.json'), JSON.stringify({at: new Date().toISOString(), threshold: PASS, summary, results}, null, 2));
  for (const s of summary) console.log(`${s.model}: ${s.passed}/${s.of} briefs at the bar${s.invalid ? `, ${s.invalid} invalid` : ''}, ${s.pass ? 'PASS' : s.of ? 'FAIL' : 'NO VALID RUN'} (needs ${PASS.briefs})`);
  process.exit(summary.every(s => s.pass) ? 0 : 1);
}
