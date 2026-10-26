#!/usr/bin/env node
/** Generate photographs through the Codex CLI's built-in image model, from any host (Claude Code, Cursor, Codex).
 *
 *  node image.mjs --prompt "<art-directed prompt>" --out assets/hero.png
 *  node image.mjs --batch images.json           # [{"prompt": "...", "out": "assets/hero.png", "use": "hero, 16:9"}, ...]
 *  --variants 3 --brand "<brand>" [--refs a.png,b.png]   generate 3 candidates per shot and keep the one photo_check.mjs
 *                                                         scores highest (the others stay beside it as -v2, -v3)
 *
 *  Write prompts like a photographer (see SKILL.md Imagery and seenry-assets/references/generation.md): subject, set
 *  and surface, one light, lens and distance, composition for the slot and ratio, color grade, exclusions, and
 *  "no text" on labels. Then run photo_check.mjs on the results. Needs a working, signed-in `codex` CLI. */
import {existsSync, readFileSync, copyFileSync, mkdirSync, mkdtempSync, readdirSync, statSync, rmSync} from 'node:fs';
import {resolve, dirname, join, extname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {findCli, codexModels} from './model_cli.mjs';
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
// --background: start the same job detached and return at once, so the page is built while images generate. A pending
// marker (.seenry/images.pending) stays until the job ends; check.mjs and `image.mjs --wait` wait for it.
const pendingFile = resolve(process.env.SEENRY_DIR || '.seenry', 'images.pending');
markWorkDir(pendingFile);
if (args.includes('--wait')) {
  const start = Date.now();
  while (existsSync(pendingFile) && Date.now() - start < 30 * 60 * 1000) await new Promise(r => setTimeout(r, 3000));
  console.log(existsSync(pendingFile) ? 'Images still generating after 30 minutes; check .seenry/images.log.' : 'Images ready.');
  process.exit(0);
}
if (args.includes('--background')) {
  const {openSync, writeFileSync: write} = await import('node:fs');
  mkdirSync(dirname(pendingFile), {recursive: true});
  const log = openSync(resolve(dirname(pendingFile), 'images.log'), 'a');
  const child = spawn(process.execPath, [new URL(import.meta.url).pathname, ...args.filter(a => a !== '--background'), '--pending'], {detached: true, stdio: ['ignore', log, log]});
  write(pendingFile, String(child.pid));
  child.unref();
  console.log(`Generating in the background (pid ${child.pid}, log .seenry/images.log). Build the page with the final file names now; check.mjs waits for the images before it reviews.`);
  process.exit(0);
}
if (args.includes('--pending')) process.on('exit', () => { try { rmSync(pendingFile); } catch {} });
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const variants = Math.max(1, Math.min(4, Number(flag('variants', '1'))));
const base = flag('batch') ? JSON.parse(readFileSync(resolve(flag('batch')), 'utf8')) : [{prompt: flag('prompt'), out: flag('out'), use: flag('use')}];
// With --variants, every shot is generated several times and the best one (by photo_check) keeps the requested name.
const jobs = base.flatMap(j => variants === 1 ? [j] : Array.from({length: variants}, (_, v) => ({...j, shot: j.out, out: j.out.replace(/(\.[a-z]+)?$/i, m => `-v${v + 1}` + (m || '.png'))})));
if (!jobs.length || jobs.some(j => !j.prompt || !j.out)) { console.error('Usage: node image.mjs --prompt "<prompt>" --out <file.png> | --batch <jobs.json>'); process.exit(2); }
const found = findCli('codex');
if (!found) { console.error('No working Codex CLI found, so no image model is available. Use the host image tool, seenry-assets (OPENAI_API_KEY or GEMINI_API_KEY), license-clear photos, or the no-photo fallback in SKILL.md.'); process.exit(2); }

// The image tool runs inside a Codex session; use the first model this account offers.
let model = process.env.SEENRY_CODEX_MODEL || null;
if (!model) {
  const {spawnSync} = await import('node:child_process');
  for (const m of codexModels()) {
    const t = spawnSync(found.bin, ['exec', '--skip-git-repo-check', '-s', 'read-only', '-m', m, 'Reply only: ok'], {encoding: 'utf8', timeout: 120000});
    if (t.status === 0 && !/not supported/i.test(t.stdout + t.stderr)) { model = m; break; }
  }
}
// The image tool is missing for the whole account when one job reports it; stop instead of retrying every job.
let toolMissing = false;
function generate({prompt, out}) {
  return new Promise(done => {
    const work = mkdtempSync(join(tmpdir(), 'seenry-image-'));
    const ask = `Generate exactly one image with your image generation tool from the description below, then copy the generated file into the current working directory as image.png. Do not generate more than one image and do not edit it. Reply only with "saved".\n\nDescription: ${prompt}`;
    // Each generation gets its own Codex home (login copied in), so parallel runs never share generated_images.
    const home = join(work, '.codex-home'); mkdirSync(home, {recursive: true});
    const realHome = process.env.CODEX_HOME || join(process.env.HOME || '', '.codex');
    for (const f of ['auth.json', 'config.toml']) if (existsSync(join(realHome, f))) copyFileSync(join(realHome, f), join(home, f));
    const child = spawn(found.bin, ['exec', '--skip-git-repo-check', '-s', 'workspace-write', ...(model ? ['-m', model] : []), ask], {cwd: work, stdio: ['ignore', 'pipe', 'pipe'], env: {...process.env, CODEX_HOME: home}});
    let log = '';
    child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; });
    const timer = setTimeout(() => child.kill('SIGTERM'), 600000);
    child.on('close', () => {
      clearTimeout(timer);
      const made = readdirSync(work).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).map(f => join(work, f)).sort((a, b) => statSync(b).size - statSync(a).size)[0];
      if (!made && /\b429\b|too many requests/i.test(log)) { console.error(`… ${out}: rate limited, retrying with one worker.`); return done('limited'); }
      if (!made) { if (/tool (is |isn.t |is not )?(un)?available|no image generation tool|unavailable in this session/i.test(log)) toolMissing = true; console.error(`✗ ${out}: no image was produced. ${log.slice(-600)}`); return done(false); }
      const dest = resolve(out);
      mkdirSync(dirname(dest), {recursive: true});
      copyFileSync(made, extname(dest) ? dest : dest + extname(made));
      console.log(`✓ ${out}`);
      done(true);
    });
  });
}

// Three at a time: each run has its own Codex home, so variants can no longer collide in a shared generated_images.
// A 429 means the account's image rate is saturated: drop to one worker and retry that shot after a pause rather than
// failing it, so the batch never has to be restarted by hand.
let ok = 0, slots = Math.max(1, Math.min(4, Number(flag('parallel', '3'))));
const queue = [...jobs], tries = new Map();
await Promise.all(Array.from({length: Math.min(slots, jobs.length)}, async (_, id) => {
  while (queue.length && !toolMissing && id < slots) {
    const job = queue.shift(), result = await generate(job);
    if (result === true) { ok++; continue; }
    const n = (tries.get(job) || 0) + 1;
    if (result === 'limited' && n <= 3) { tries.set(job, n); slots = 1; queue.push(job); await new Promise(r => setTimeout(r, 20000 * n)); }
    else if (result === 'limited') console.error(`✗ ${job.out}: still rate limited after 3 retries.`);
  }
}));
if (variants > 1) {
  const {createHash} = await import('node:crypto');
  const sums = jobs.map(j => resolve(j.out)).filter(existsSync).map(f => createHash('sha1').update(readFileSync(f)).digest('hex'));
  if (new Set(sums).size < sums.length) console.error('Warning: some variants are identical files; regenerate them before trusting the photo check.');
}
const here = dirname(new URL(import.meta.url).pathname);
if (variants > 1) {
  const {spawnSync} = await import('node:child_process');
  for (const shot of base) {
    const cands = jobs.filter(j => j.shot === shot.out).map(j => resolve(j.out)).filter(existsSync);
    if (!cands.length) continue;
    const report = resolve(dirname(shot.out), `.photo-${Date.now()}.json`);
    spawnSync('node', [join(here, 'photo_check.mjs'), ...cands, '--use', shot.use || 'photograph on a web page', '--brand', flag('brand', 'the brand'), '--out', report, ...(flag('refs') ? ['--refs', flag('refs')] : [])], {stdio: 'inherit'});
    let best = cands[0];
    try { const imgs = JSON.parse(readFileSync(report, 'utf8')).images; const i = imgs.reduce((b, x, k) => (x.overall > imgs[b].overall || (x.overall === imgs[b].overall && (x.concept || 0) > (imgs[b].concept || 0))) ? k : b, 0); best = cands[i] || best; console.log(`best for ${shot.out}: ${best.split('/').pop()} (${imgs[i].overall}/10)`); } catch {}
    copyFileSync(best, resolve(shot.out));
  }
}
if (!ok) console.log(`No image was generated (the account's image tool may be unavailable: a 403 means it is blocked, not out of credits). Do not ship a type-only page and do not swap in unrelated art. Produce the same subject another way: build objects in code (SceneKit or RealityKit with PBR materials for 3D objects, SVG or SwiftUI shapes for stickers), source license-clear photos of that exact subject (python3 ${join(here, '..', '..', 'seenry-assets', 'scripts', 'assets.py')} images --q "<subject>"), and say so in the report.`);
console.log(`${ok}/${jobs.length} image(s) generated.${variants > 1 ? ' The best variant of each shot now has the requested name.' : ` Next: node ${join(here, 'photo_check.mjs')} <images> --use "<slot>" --brand "<brand>"`}`);
process.exit(ok === jobs.length ? 0 : 1);
