#!/usr/bin/env node
/** Blind film critic: a fresh model that never saw your reasoning watches the film as a sequence and scores it against
 *  reference films prepared the same way. Page critics misread films (they score phone layouts, read stills out of
 *  order and reverse their own advice), so this one is built for film:
 *
 *  - a storyboard of frames on the beat grid, in order, each with its timestamp and the voice line being spoken;
 *  - a phone-feed board, the same frames at the size a 16:9 film plays in a phone feed, to judge legibility;
 *  - full-size frames from the middle of each shot, to judge type and craft;
 *  - measured facts: cut times and their distance from the beat, loudness, the script and the claims ledger;
 *  - motion: measured frame-to-frame change at 15fps and strips of consecutive frames at the six busiest moments,
 *    so camera moves, transformations and blur are judged, not just compositions;
 *  - the reference films storyboarded and measured the same way, which anchor the scale at 8–9;
 *
 *  Scoring is blind: every run sees only the film, the references and the facts, never earlier rounds, so the score
 *  cannot drift upward because the critic was told its advice was taken. An editor pass then writes this round's fixes
 *  from the blind verdict and the full history of earlier rounds (film-critic-history.json beside --out): it may not
 *  repeat an applied fix or reverse an earlier request unless the result visibly failed, and it says which it is.
 *
 *  Each run also scores the reference films on the same scale in the same call, as published films without paperwork,
 *  so the report states the gap to the best reference rather than an unanchored number.
 *
 *  node film_critic.mjs --dir film/ [--film film/film.mp4] [--refs a.mp4,b.mp4] [--runs 3] [--cli codex|claude]
 *                       [--out film/.review/film-critic.json] [--min 8] [--dry-run]
 *
 *  Reads cues.json (duration, bpm, voice), brief.md, script.md, sound.json (voice line text) and claims.json from --dir.
 *  --dry-run writes the boards and prompt without calling a model. --min exits 1 when the median overall is lower.
 *  Needs ffmpeg, Playwright, and the Codex or Claude CLI (shared with the seenry critic). */
import {existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {resolve, join, dirname, basename, extname} from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const has = name => args.includes(`--${name}`);
const dir = resolve(flag('dir', '.'));
const read = (f, fallback = '') => existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : fallback;
const cues = JSON.parse(read('cues.json', '{}'));
const film = resolve(flag('film', join(dir, cues.out || 'film.mp4')));
const out = resolve(flag('out', join(dir, '.review/film-critic.json')));
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);
const runs = Number(flag('runs', '3')), min = flag('min') ? Number(flag('min')) : null;
if (!existsSync(film)) { console.error(`Missing ${film}: render and mix the film first.`); process.exit(2); }
if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg not found on PATH.'); process.exit(2); }

// One process per run when asked for several; the parent takes the median, like the seenry critic.
if (runs > 1 && !has('dry-run')) {
  const work = mkdtempSync(join(tmpdir(), 'seenry-film-critic-'));
  const pass = args.filter((a, i) => !['--out', '--runs', '--min'].includes(a) && !['--out', '--runs', '--min'].includes(args[i - 1]));
  const results = (await Promise.all(Array.from({length: runs}, (_, k) => new Promise(done => {
    const file = join(work, `run-${k}.json`);
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...pass, '--score-only', '--runs', '1', '--out', file], {stdio: ['ignore', 'ignore', 'pipe']});
    let err = ''; child.stderr.on('data', d => err += d);
    child.on('close', code => { try { done(JSON.parse(readFileSync(file, 'utf8'))); } catch { if (code) process.stderr.write(err.slice(-800)); done(null); } });
  })))).filter(Boolean);
  if (!results.length) { console.error('film critic failed on every run.'); process.exit(1); }
  const median = xs => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)];
  const keys = Object.keys(results[0].scores);
  const scores = Object.fromEntries(keys.map(k => [k, median(results.map(r => r.scores[k]))]));
  const chosen = results.find(r => r.scores.overall === scores.overall) || results[0];
  const refNames = [...new Set(results.flatMap(r => (r.refs || []).map(x => x.name)))];
  const refs = refNames.map(name => ({name, overall: median(results.map(r => r.refs?.find(x => x.name === name)?.overall).filter(Boolean)), why: chosen.refs?.find(x => x.name === name)?.why || ''}));
  const merged = {...chosen, scores, refs, runs: results.map(r => r.scores.overall)};
  const blind = join(work, 'blind.json'); writeFileSync(blind, JSON.stringify(merged));
  // the editor pass reads the full history; the scores stay the blind median
  const ed = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...pass, '--edit', blind, '--runs', '1', '--out', out], {stdio: ['ignore', 'inherit', 'inherit']});
  if (ed.status === 2 || !existsSync(out)) { mkdirSync(dirname(out), {recursive: true}); writeFileSync(out, JSON.stringify(merged, null, 2)); report(merged, `median of ${results.length} runs: ${merged.runs.join('/')}, editor pass unavailable`); }
  process.exit(min !== null && scores.overall < min ? 1 : 0);
}

/* ---------- measure the film ---------- */
const probe = p => JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', p], {encoding: 'utf8'}).stdout);
const duration = p => Number(probe(p).format.duration);
const cuts = p => [...spawnSync('ffmpeg', ['-i', p, '-vf', "select='gt(scene,0.3)',showinfo", '-f', 'null', '-'], {encoding: 'utf8'}).stderr
  .matchAll(/pts_time:([\d.]+)/g)].map(m => +(+m[1]).toFixed(2));
const D = duration(film), bpm = cues.bpm || null, beat = bpm ? 60 / bpm : null;
const filmCuts = cuts(film);
const offBeat = beat ? filmCuts.map(t => Math.min(t % beat, beat - (t % beat))) : [];
const onBeat = offBeat.filter(o => o <= .08).length;
const loud = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', film, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const lufs = loud.slice(loud.lastIndexOf('Summary:')).match(/I:\s+(-?[\d.]+) LUFS/)?.[1];

// voice lines with their text, from sound.json, or start times only from the voice folder
let voice = [];
try { const v = JSON.parse(read('sound.json', '{}')).voice || {};
  voice = (v.lines || []).map(l => { const f = join(dir, v.dir || 'media/vo', `${Number(l.at).toFixed(2).padStart(6, '0')}.mp3`);
    return {at: l.at, text: l.text, len: existsSync(f) ? duration(f) : 4}; }); } catch {}
const spoken = t => voice.find(l => t >= l.at && t <= l.at + l.len + .3);

/* ---------- boards ---------- */
async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [dir, process.cwd(), resolve(process.cwd(), '..')])
    for (const name of ['playwright', 'playwright-core'])
      try { return await import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve(name)).href); } catch {}
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright && npx playwright install chromium, or pass --playwright).'); process.exit(2);
}
const work = mkdtempSync(join(tmpdir(), 'seenry-film-board-'));
const grab = (src, t, w, name) => { const f = join(work, name); spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', src, '-frames:v', '1', '-vf', `scale=${w}:-2`, '-q:v', '3', f]); return f; };
const uri = f => `data:image/jpeg;base64,${readFileSync(f).toString('base64')}`;
const fmt = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// sample on the beat grid: every half bar, or wider so a board holds at most 36 frames
function samples(len, grid) {
  const step = Math.max(grid || len / 30, len / 36);
  return Array.from({length: Math.floor(len / step)}, (_, i) => +(i * step + step / 2).toFixed(2));
}
const playwright = await loadPlaywright();
const chromium = playwright.chromium || playwright.default?.chromium;
const browser = await chromium.launch();
async function board(html, file, width) {
  const page = await browser.newPage({viewport: {width, height: 800}, deviceScaleFactor: 1});
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}body{background:#fff;font:15px/1.35 -apple-system,system-ui,sans-serif;color:#222;padding:24px}
    h1{font-size:20px;margin-bottom:16px}.g{display:grid;gap:14px}.c img{display:block;width:100%;border:1px solid #ddd}.t{font:600 14px ui-monospace,monospace;margin-top:5px}.v{color:#555;font-size:14px;margin-top:2px}</style>${html}`);
  await page.screenshot({path: file, fullPage: true}); await page.close(); return file;
}
mkdirSync(dirname(out), {recursive: true});
const boardDir = join(dirname(out), 'boards'); mkdirSync(boardDir, {recursive: true});

const half = beat ? beat * 2 : null;   // half a 4/4 bar
const times = samples(D, half);
const story = times.map(t => ({t, f: grab(film, t, 480, `s-${t}.jpg`)}));
const storyboard = await board(`<h1>Candidate storyboard, in order: one frame every ${(times[1] - times[0]).toFixed(2)}s, with the voice line being spoken</h1>
  <div class="g" style="grid-template-columns:repeat(6,1fr)">${story.map(({t, f}) => { const l = spoken(t);
    return `<div class="c"><img src="${uri(f)}"><div class="t">${fmt(t)}</div><div class="v">${l ? '“' + esc(l.text) + '”' : ''}</div></div>`; }).join('')}</div>`, join(boardDir, 'storyboard.png'), 2000);
const phone = await board(`<h1>The same film as it plays in a phone feed (16:9 at 390pt wide). Judge legibility here.</h1>
  <div class="g" style="grid-template-columns:repeat(4,390px)">${story.filter((_, i) => i % Math.ceil(story.length / 12) === 0).map(({t, f}) =>
    `<div class="c"><img src="${uri(f)}" style="width:390px"><div class="t">${fmt(t)}</div></div>`).join('')}</div>`, join(boardDir, 'phone.png'), 1700);
const shotStarts = [0, ...filmCuts.filter(c => c > .3 && c < D - .3)];
const mids = shotStarts.map((s, i) => (s + (shotStarts[i + 1] ?? D)) / 2).filter((_, i, a) => a.length <= 8 || i % Math.ceil(a.length / 8) === 0).slice(0, 8);
const keyframes = await board(`<h1>Full-size frames from the middle of each shot. Judge type and craft here.</h1>
  <div class="g" style="grid-template-columns:repeat(2,1fr)">${mids.map(t => `<div class="c"><img src="${uri(grab(film, t, 1920, `k-${t.toFixed(2)}.jpg`))}"><div class="t">${fmt(t)}</div></div>`).join('')}</div>`, join(boardDir, 'keyframes.png'), 2000);
/* ---------- motion: measured frame-to-frame change, and strips of consecutive frames at the busiest moments ---------- */
function motion(src) {
  const out = spawnSync('ffmpeg', ['-v', 'error', '-i', src, '-vf', 'fps=15,scale=320:-2,signalstats,metadata=print:key=lavfi.signalstats.YDIF:file=-', '-f', 'null', '-'], {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024}).stdout;
  const ydif = [...out.matchAll(/YDIF=([\d.]+)/g)].map(m => +m[1]);
  const moving = ydif.map(v => v > 1.2), n = ydif.length || 1;
  let longest = 0, run = 0; for (const m of moving) { run = m ? 0 : run + 1; longest = Math.max(longest, run); }
  // the six busiest moments, at least 1.5s apart, from a lightly smoothed curve
  const sm = ydif.map((_, i) => ydif.slice(Math.max(0, i - 3), i + 4).reduce((a, b) => a + b, 0) / 7);
  const peaks = []; for (const i of sm.map((_, i) => i).sort((a, b) => sm[b] - sm[a])) { if (peaks.length >= 6) break; if (sm[i] > 0.8 && peaks.every(p => Math.abs(p - i) > 22)) peaks.push(i); }
  return {coverage: Math.round(moving.filter(Boolean).length / n * 100), longestStill: +(longest / 15).toFixed(1), mean: +(ydif.reduce((a, b) => a + b, 0) / n).toFixed(2), peaks: peaks.map(i => +(i / 15).toFixed(2)).sort((a, b) => a - b)};
}
async function strips(src, m, name, rows) {
  const html = m.peaks.slice(0, rows).map((c, r) => {
    const dir = join(work, `${name}-strip-${r}`); mkdirSync(dir, {recursive: true});
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(Math.max(0, c - .33)), '-t', '0.67', '-i', src, '-vf', 'fps=15,scale=192:-2', '-q:v', '4', join(dir, '%02d.jpg')]);
    const fs = Array.from({length: 10}, (_, k) => join(dir, String(k + 1).padStart(2, '0') + '.jpg')).filter(existsSync);
    return `<div class="t" style="margin:10px 0 4px">${fmt(Math.max(0, c - .33))} → ${fmt(c + .33)}, consecutive frames at 15fps</div><div class="g" style="grid-template-columns:repeat(10,1fr);gap:4px">${fs.map(f => `<div class="c"><img src="${uri(f)}"></div>`).join('')}</div>`; }).join('');
  return board(`<h1>${name}: the busiest moments, frame by frame. Judge camera moves, transformations, easing and blur here.</h1>${html}`, join(boardDir, `motion-${name}.png`), 2000);
}
const filmMotion = motion(film);
const motionBoard = await strips(film, filmMotion, 'candidate', 6);
const refMotion = {};
const refBoards = [];
for (const r of refs) {
  if (/\.(png|jpe?g|webp)$/i.test(r)) { refBoards.push(r); continue; }
  const rd = duration(r), rt = samples(rd, null);
  refBoards.push(await board(`<h1>Reference film: ${esc(basename(r))} (${rd.toFixed(1)}s), one frame every ${(rt[1] - rt[0]).toFixed(2)}s</h1>
    <div class="g" style="grid-template-columns:repeat(6,1fr)">${rt.map(t => `<div class="c"><img src="${uri(grab(r, t, 480, `r-${basename(r)}-${t}.jpg`))}"><div class="t">${fmt(t)}</div></div>`).join('')}</div>`,
    join(boardDir, `ref-${basename(r, extname(r))}.png`), 2000));
  refMotion[basename(r)] = motion(r);
  refBoards.push(await strips(r, refMotion[basename(r)], basename(r, extname(r)), 4));
}
await browser.close(); rmSync(work, {recursive: true, force: true});

/* ---------- the prompt ---------- */
let claims = [];
try { claims = JSON.parse(read('claims.json', '[]')); } catch {}
const kinds = claims.reduce((m, c) => (m[c.kind || 'unspecified'] = (m[c.kind || 'unspecified'] || 0) + 1, m), {});
const images = [storyboard, phone, keyframes, motionBoard, ...refBoards];
const listing = [`image 1 = the candidate film's storyboard, in playback order, with timestamps and the voice line being spoken`,
  `image 2 = the candidate as it plays in a phone feed (legibility)`,
  `image 3 = full-size frames from the middle of each shot (type and craft)`,
  `image 4 = the candidate's six busiest moments, as consecutive frames at 15fps (motion)`,
  ...refBoards.map((r, i) => `image ${i + 5} = reference ${basename(r).startsWith('motion-') ? 'film motion strips' : 'film storyboard'}: ${basename(r)}`)].join('\n');
const KEYS = ['claim', 'proof', 'story', 'pacing', 'picture', 'motion', 'legibility', 'sound_picture', 'truth', 'overall'];
const schema = {type: 'object', additionalProperties: false, required: ['scores', 'refs', 'slop', 'verdict', 'keep', 'fixes'], properties: {
  refs: {type: 'array', items: {type: 'object', additionalProperties: false, required: ['name', 'overall', 'why'], properties: {name: {type: 'string'}, overall: {type: 'integer', minimum: 1, maximum: 10}, why: {type: 'string'}}}},
  scores: {type: 'object', additionalProperties: false, required: KEYS, properties: Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}]))},
  slop: {type: 'array', items: {type: 'string'}},
  verdict: {type: 'string'},
  keep: {type: 'array', items: {type: 'string'}},
  fixes: {type: 'array', minItems: 3, maxItems: 7, items: {type: 'object', additionalProperties: false, required: ['at', 'problem', 'fix'],
    properties: {at: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}}};
const prompt = `You are a film director and editor who has cut launch films for companies like Apple, Stripe and Linear. You are reviewing a ${D.toFixed(1)}-second product film before it is published. You did not make it and owe it nothing.

This is a film, not a web page. Judge it as a sequence in playback order. There is no responsive layout to score; phone viewing means the 16:9 film playing in a feed, shown in image 2.

${listing}
${refBoards.length ? 'The reference films are published launch films. They are the bar: they score about 8-9 on this rubric. A competent template film scores 5.' : 'No reference films were supplied; calibrate so that a published launch film from a top company scores 8-9 and a competent template film 5.'}

The brief (its fixed items and truth limits are requirements, not suggestions):
${read('brief.md', '(no brief.md)')}

The script and shot list:
${read('script.md', '(no script.md)')}

Measured facts (trust these over your reading of stills):
- Duration ${D.toFixed(2)}s${bpm ? `, ${bpm} BPM, one beat ${beat.toFixed(2)}s, one bar ${(beat * 4).toFixed(2)}s` : ''}.
- Hard cuts at: ${filmCuts.join(', ') || 'none detected (continuous motion)'}${beat ? `; ${onBeat} of ${filmCuts.length} land within 80ms of a beat` : ''}.
- Voice lines: ${voice.length ? voice.map(l => `${l.at}s “${l.text}”`).join('; ') : 'none recorded'}.
- Integrated loudness ${lufs ?? 'unknown'} LUFS.
- Motion, measured as frame-to-frame change at 15fps: visible motion in ${filmMotion.coverage}% of the film, longest still hold ${filmMotion.longestStill}s, mean change ${filmMotion.mean}.${Object.entries(refMotion).map(([n, m]) => ` Reference ${n}: motion in ${m.coverage}%, longest still ${m.longestStill}s, mean change ${m.mean}.`).join('')}
- Claims ledger: ${claims.length} claims (${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(', ') || 'none'}). Dramatised moments, which must read as illustration: ${claims.filter(c => c.kind === 'dramatised').map(c => c.text).join(' | ') || 'none'}.


Score 1-10:
- claim: is there one sentence a viewer would repeat afterwards, stated and made clear by the end?
- proof: is that claim proven by real evidence on screen, at a scale where the evidence carries the argument rather than decorating it?
- story: does the order build (hook in the first two seconds, escalation, a turn, a resolved ending), with each scene earning its place?
- pacing: do holds give time to read (about 0.3s per word plus 1s), and do cuts and moves follow the music without rushing or dragging?
- picture: composition, hierarchy, scale variety between scenes, type and craft at the level of the references.
- legibility: can the important text be read in the phone feed and while it is on screen?
- sound_picture: do voice and picture complement each other rather than repeat, and do events land on beats?
- motion: is it directed motion design (a camera that moves through one world, elements that transform into the next idea instead of being replaced, depth, motion blur, kinetic type, holds that still breathe), or slides that cut and fade? Judge from the 15fps strips and the measured motion, against the references' strips and numbers.
- truth: does anything look like captured product output that the ledger marks as illustration, or show a number with no source?
- overall: against the references. Decoration never earns points.

Also score each reference film's overall on the same 1-10 scale, as a published film: it has no brief, script or ledger, so judge its claim, proof, story, pacing, picture, legibility, sound and credibility from what is on screen, and never penalize it for missing paperwork. Score the candidate and the references in one consistent frame: if the candidate is weaker than a reference, its overall must be lower than that reference's. In refs, give each reference's file name, overall and one sentence on what it does better or worse than the candidate.

List every AI-film tell you see (stock AI visuals, generic slogans, a whoosh on every cut, text too fast to read, fake UI that looks real, a slow logo intro). Name what to keep, so it survives the next round. Then give the fixes that would raise overall most, most visible first. Each fix names its timestamp, the problem and a concrete change: which shot, what scale, what hold, what to cut. Keep fixes within the brief's fixed items and truth limits; never recommend a claim the ledger cannot source. Do not open any files other than the attached images.`;
writeFileSync(join(boardDir, 'prompt.txt'), prompt);
if (has('dry-run')) { console.log(`Boards and prompt written to ${boardDir} (dry run, no model called).`); process.exit(0); }

/* ---------- ask ---------- */
const {findCli, askModel} = await import(pathToFileURL(join(here, '../../seenry/scripts/model_cli.mjs')).href);
const found = findCli(flag('cli', process.env.SEENRY_CRITIC));
if (!found) { console.error('No working critic CLI found (codex or claude). Ask an independent reviewer to watch the film instead.'); process.exit(2); }
let verdict;
if (has('edit')) verdict = JSON.parse(readFileSync(resolve(flag('edit')), 'utf8'));
else try { verdict = askModel(found, {images, prompt, schema}); } catch (e) { console.error(`film critic failed: ${e.message}`); process.exit(1); }
if (has('score-only')) { writeFileSync(out, JSON.stringify(verdict, null, 2)); process.exit(0); }

/* ---------- editor pass: this round's fixes, written against every earlier round ---------- */
const historyFile = join(dirname(out), 'film-critic-history.json');
let history = [];
try { history = JSON.parse(readFileSync(historyFile, 'utf8')); } catch {}
let final = verdict;
if (history.length) {
  const editSchema = {type: 'object', additionalProperties: false, required: ['keep', 'fixes'], properties: {
    keep: {type: 'array', items: {type: 'string'}},
    fixes: {type: 'array', minItems: 1, maxItems: 6, items: {type: 'object', additionalProperties: false, required: ['at', 'problem', 'fix', 'history'],
      properties: {at: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}, history: {type: 'string'}}}}}};
  const editPrompt = `You are the supervising editor on a ${D.toFixed(1)}-second product film. A blind reviewer has just scored the current cut without knowing its history. Your job is to turn that review into this round's instructions without sending the director in circles.

${listing}

Earlier rounds, oldest first (scores were blind; fixes are what the director was asked to do, and has since acted on):
${history.map(h => `Round ${h.round} (overall ${h.scores.overall}): ${h.fixes.map(f => `[${f.at}] ${f.fix}`).join(' | ')}`).join('\n')}

This round's blind review (overall ${verdict.scores.overall}):
Keep: ${verdict.keep.join(' | ')}
Fixes: ${verdict.fixes.map(f => `[${f.at}] ${f.problem} → ${f.fix}`).join(' | ')}

Write the final keep list and at most six fixes, most visible first. Rules:
- Do not repeat a fix an earlier round asked for when the images show it was applied.
- Do not ask for the reverse of an earlier round's request unless the images show that the applied result visibly failed. If you do, say which round and what failed.
- When earlier rounds conflict, choose one direction, say why in one sentence, and keep to it.
- Anything in an earlier keep list stays kept unless the images show it failing.
- Keep the brief's fixed items and truth limits; never propose a claim the ledger cannot source.
- For each fix set history to "new", or to "revisits round N: <what visibly failed>".
- Do not change or restate the scores. Do not open any files other than the attached images.`;
  try { final = {...verdict, ...askModel(found, {images, prompt: editPrompt, schema: editSchema})}; }
  catch (e) { console.error(`editor pass failed, keeping the blind fixes: ${e.message}`); }
}
const result = {cli: found.cli, film, images, measured: {duration: D, cuts: filmCuts, onBeat, lufs}, ...final, blindFixes: verdict.fixes};
writeFileSync(out, JSON.stringify(result, null, 2));
history.push({round: history.length + 1, date: new Date().toISOString(), scores: final.scores, refs: final.refs || [], runs: final.runs || null, fixes: final.fixes.map(({at, fix}) => ({at, fix})), keep: final.keep});
writeFileSync(historyFile, JSON.stringify(history, null, 2));
report(result, final.runs ? `blind median of ${final.runs.length} runs: ${final.runs.join('/')}; round ${history.length}` : `${found.cli}, round ${history.length}`);
process.exit(min !== null && final.scores.overall < min ? 1 : 0);

function report(r, how) {
  const s = r.scores, best = Math.max(0, ...(r.refs || []).map(x => x.overall));
  if (r.refs?.length) console.log('References on the same scale: ' + r.refs.map(x => `${x.name} ${x.overall}/10`).join(' · ') + ` → gap to the best: ${s.overall - best >= 0 ? '+' : ''}${s.overall - best}`);
  console.log(`Film critic (${how}): overall ${s.overall}/10 · claim ${s.claim} · proof ${s.proof} · story ${s.story} · pacing ${s.pacing} · picture ${s.picture} · motion ${s.motion} · legibility ${s.legibility} · sound/picture ${s.sound_picture} · truth ${s.truth}`);
  if (r.slop.length) console.log('Film tells: ' + r.slop.join('; '));
  if (r.keep?.length) console.log('Keep: ' + r.keep.join('; '));
  console.log(r.verdict);
  r.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.at}] ${f.problem} → ${f.fix}${f.history && f.history !== 'new' ? ` (${f.history})` : ''}`));
  console.log(`\nWritten to ${out}`);
}
