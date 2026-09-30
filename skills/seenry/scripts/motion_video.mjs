#!/usr/bin/env node
/** Motion judge for anything filmed rather than clicked: a native app's screen recording (Simulator: File > Record
 *  Screen, or `xcrun simctl io booted recordVideo rec.mov`; Android: `adb shell screenrecord`), a prototype, a video.
 *
 *  node motion_video.mjs --video rec.mov [--brief BRIEF.md] --out .seenry/review/motion-N
 *
 *  Pulls the frames where the picture changes (ffmpeg scene detection) with their timestamps, lays them out as a
 *  filmstrip, and has a fresh model score purpose, timing, spatial logic, smoothness, consistency and reduced motion
 *  the same way motion_judge.mjs does for web pages. Writes motion-board.png and motion.json. Needs ffmpeg. */
import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {findCli, askModel} from './model_cli.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const video = flag('video') && resolve(flag('video'));
const out = resolve(flag('out', '.seenry/review/motion'));
if (!video || !existsSync(video)) { console.error('Usage: node motion_video.mjs --video rec.mov --out <dir> [--brief BRIEF.md]'); process.exit(2); }
if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg is required (brew install ffmpeg).'); process.exit(2); }
const frames = join(out, 'frames');
rmSync(frames, {recursive: true, force: true}); mkdirSync(frames, {recursive: true});

// Frames where the picture changes, with their times; a still recording yields almost none, which is itself a finding.
const r = spawnSync('ffmpeg', ['-hide_banner', '-i', video, '-vf', "select='gt(scene,0.004)',showinfo,scale=240:-2", '-vsync', 'vfr', join(frames, 'f%04d.png')], {encoding: 'utf8', maxBuffer: 64e6});
const times = [...(r.stderr || '').matchAll(/pts_time:([\d.]+)/g)].map(m => Number(m[1]));
let files = readdirSync(frames).filter(f => f.endsWith('.png')).sort();
const all = files.map((f, i) => ({f, t: times[i] ?? i}));
const keep = all.length <= 60 ? all : Array.from({length: 60}, (_, k) => all[Math.round(k * (all.length - 1) / 59)]);
if (!keep.length) { console.error('No changing frames found: the recording shows no motion. Record the interactions (open, close, navigate, submit, change a value).'); process.exit(1); }
// Gaps between consecutive changing frames reveal the durations: a burst of frames is one transition.
const bursts = []; let cur = null;
for (const {t} of all) { if (!cur || t - cur.end > 0.12) { cur = {start: t, end: t, n: 0}; bursts.push(cur); } cur.end = t; cur.n++; }
const summary = bursts.filter(b => b.n > 1).map(b => `${b.start.toFixed(2)}s for ${Math.round((b.end - b.start) * 1000)}ms (${b.n} frames)`);

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
const page = await browser.newPage({viewport: {width: 1560, height: 400}});
await page.setContent(`<body style="margin:0;background:#c8c8c8;font:12px system-ui"><div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px">${keep.map(({f, t}) =>
  `<figure style="margin:0;width:180px"><figcaption>${t.toFixed(2)}s</figcaption><img src="data:image/png;base64,${readFileSync(join(frames, f)).toString('base64')}" style="width:180px;display:block"></figure>`).join('')}</div></body>`, {waitUntil: 'load'});
await page.screenshot({path: join(out, 'motion-board.png'), fullPage: true});
await browser.close();

const report = {video, changingFrames: all.length, transitions: summary, violations: []};
const found = findCli(process.env.SEENRY_CRITIC);
let verdict = null;
if (found) {
  const brief = flag('brief') && existsSync(flag('brief')) ? readFileSync(flag('brief'), 'utf8') : '';
  const KEYS = ['purpose', 'timing', 'spatial', 'smoothness', 'consistency', 'reduced_motion', 'overall'];
  const schema = {type: 'object', additionalProperties: false, required: ['scores', 'verdict', 'fixes'], properties: {
    scores: {type: 'object', additionalProperties: false, required: KEYS, properties: Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}]))},
    verdict: {type: 'string'}, fixes: {type: 'array', minItems: 1, maxItems: 8, items: {type: 'object', additionalProperties: false, required: ['interaction', 'problem', 'fix'], properties: {interaction: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}}};
  const prompt = `You are a motion and interaction design lead at the level of Apple, Linear and Family. The attached image is a filmstrip of an app's screen recording: only the frames where the picture changed, each labelled with its time. Bursts of frames close together are transitions.

${brief ? 'The brief:\n' + brief + '\n' : ''}Measured transitions (start time, duration, frames): ${summary.join('; ') || 'none'}.

Score 1-10, where 9-10 is indistinguishable from Apple, Linear or Family at their best, 8 is clearly premium and 6-7 is correct but generic: purpose (every motion explains a change, nothing decorative, nothing missing), timing (durations fit frequency and distance, exits faster than entrances, no sluggish or abrupt changes), spatial (things grow from their trigger, sheets and pushes follow platform conventions, shared elements stay continuous), smoothness (no dropped frames or jumps visible, interruptions reverse rather than restart), consistency (one family of durations and springs), reduced_motion (score 5 if it cannot be judged from the recording), overall. Then concrete fixes: which interaction, the problem and the exact change (curve or spring, duration, origin). Do not open any files other than the attached image.`;
  try {
    verdict = askModel(found, {images: [join(out, 'motion-board.png')], prompt, schema});
    const s = verdict.scores;
    console.log(`Motion judge (${found.cli}, video): overall ${s.overall}/10 · purpose ${s.purpose} · timing ${s.timing} · spatial ${s.spatial} · smooth ${s.smoothness} · consistent ${s.consistency} · reduced ${s.reduced_motion}`);
    console.log(verdict.verdict);
    verdict.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.interaction}] ${f.problem} → ${f.fix}`));
  } catch (e) { console.error(`motion judge model failed: ${e.message}`); }
} else console.log(`Filmstrip written to ${join(out, 'motion-board.png')}; no Codex or Claude CLI to judge it, so review it yourself.`);
writeFileSync(join(out, 'motion.json'), JSON.stringify({...report, verdict}, null, 2));
