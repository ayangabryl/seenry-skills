#!/usr/bin/env node
/** Pairs this round's pages against fixed comparators, each pair asked twice with the order swapped.
 *
 *  node evals/baseline/judge-cross.mjs --new <results dir> --old <last round's results dir> [--base <results dir with the no-skill runs>] [--briefs a,b] [--skip waterline] [--model claude-sonnet] [--judge codex]
 *
 *  For every brief this round's run (cond B) is put beside: last round's B for the same brief and model, last round's A
 *  (no skill), and the skill's Waterline example screenshot. Waterline has no phone capture, so that pair is desktop only,
 *  and when the briefs differ the judge is told so and asked which is the better design work for its own brief.
 *  Only a verdict that names the same page both times counts; otherwise it is "split". Writes <new>/cross.json. */
import {existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync, copyFileSync, symlinkSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {homedir, tmpdir} from 'node:os';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..', '..');
const args = process.argv.slice(2), flag = (n, f) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : f; };
const NEW = resolve(flag('new')), OLD = resolve(flag('old')), model = flag('model', 'claude-sonnet'), judge = flag('judge', 'codex');
const runs = flag('runs', '');
const briefs = Object.fromEntries(JSON.parse(readFileSync(join(root, 'evals', 'level', 'briefs.json'), 'utf8')).map(b => [b.id, b.brief]));
const newRes = JSON.parse(readFileSync(join(NEW, 'results.json'), 'utf8')), oldRes = JSON.parse(readFileSync(join(OLD, 'results.json'), 'utf8'));
// The no-skill pages may sit in another round's results (a round that ran only the skill has none of its own).
const BASE = resolve(flag('base', OLD)), baseRes = JSON.parse(readFileSync(join(BASE, 'results.json'), 'utf8'));
const wantedBriefs = flag('briefs', 'cash-forecast,clinic-scheduling,studio-portfolio').split(','), skip = flag('skip', '').split(',');
const outFile = join(NEW, 'cross.json'), cross = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
const save = () => writeFileSync(outFile, JSON.stringify(cross, null, 2));
const WATERLINE = join(root, 'skills', 'seenry', 'assets', 'examples', 'waterline', 'waterline-example.jpg');
const WATERLINE_BRIEF = briefs['cash-forecast'];

const realHome = homedir();
function judgeHome() {
  const h = join(tmpdir(), 'seenry-judge-home'), c = join(h, '.codex');
  mkdirSync(join(h, 'Library'), {recursive: true}); mkdirSync(c, {recursive: true});
  try { symlinkSync(join(realHome, 'Library', 'Keychains'), join(h, 'Library', 'Keychains')); } catch {}
  try { symlinkSync(join(realHome, '.codex', 'auth.json'), join(c, 'auth.json')); } catch {}
  try { copyFileSync(join(realHome, '.codex', 'models_cache.json'), join(c, 'models_cache.json')); } catch {}
  const m = (readFileSync(join(realHome, '.codex', 'config.toml'), 'utf8').match(/^model\s*=\s*"([^"]+)"/m) || [])[1];
  writeFileSync(join(c, 'config.toml'), `${m ? `model = "${m}"\n` : ''}model_reasoning_effort = "high"\n`);
  return {HOME: h, CODEX_HOME: c};
}
const JH = judgeHome();
function judgeEnv() { const env = {}; for (const [k, v] of Object.entries(process.env)) if (!/^(CLAUDE|CLAUDECODE|CODEX_|SEENRY_)/.test(k)) env[k] = v; return {...env, ...JH, PATH: `${join(realHome, '.local', 'bin')}:${process.env.PATH}`}; }

function ask(images, prompt, schema) {
  const work = mkdtempSync(join(tmpdir(), 'seenry-judge-'));
  try {
    if (judge === 'codex') {
      const sf = join(work, 'schema.json'), of = join(work, 'out.json');
      writeFileSync(sf, JSON.stringify(schema));
      const cmd = ['exec', '--skip-git-repo-check', '-s', 'read-only', '--output-schema', sf, '-o', of];
      for (const i of images) cmd.push('-i', i);
      cmd.push('--', prompt);
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = spawnSync('codex', cmd, {cwd: work, encoding: 'utf8', timeout: 1200000, env: judgeEnv(), maxBuffer: 1 << 26});
        if (existsSync(of)) return {...JSON.parse(readFileSync(of, 'utf8')), _judge: 'codex'};
        if (attempt) throw new Error(`codex judge failed: ${(r.stderr || r.stdout || '').slice(-800)}`);
      }
    }
    for (const [i, f] of images.entries()) copyFileSync(f, join(work, `image-${String(i + 1).padStart(2, '0')}.jpg`));
    const list = images.map((_, i) => `image-${String(i + 1).padStart(2, '0')}.jpg`).join(', ');
    const p = `${prompt}\n\nThe images are these files in the current folder, in this order: ${list}. Read every one before answering.\nAnswer with only a JSON object matching this schema, nothing else: ${JSON.stringify(schema)}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = spawnSync('claude', ['-p', p, '--model', 'opus', '--allowedTools', 'Read', '--strict-mcp-config', '--disable-slash-commands', '--output-format', 'text'], {cwd: work, encoding: 'utf8', timeout: 1200000, env: judgeEnv(), maxBuffer: 1 << 26});
      const out = r.stdout || '', raw = out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1);
      try { return {...JSON.parse(raw), _judge: 'claude-opus'}; } catch { if (attempt) throw new Error(`claude judge failed: ${(r.stderr || out).slice(-800)}`); }
    }
  } finally { rmSync(work, {recursive: true, force: true}); }
}

const PAIR_SCHEMA = {type: 'object', additionalProperties: false, required: ['first_strengths', 'first_weaknesses', 'second_strengths', 'second_weaknesses', 'better', 'margin', 'why'], properties: {
  first_strengths: {type: 'array', items: {type: 'string'}}, first_weaknesses: {type: 'array', items: {type: 'string'}}, second_strengths: {type: 'array', items: {type: 'string'}}, second_weaknesses: {type: 'array', items: {type: 'string'}},
  better: {type: 'string', enum: ['first', 'second', 'tie']}, margin: {type: 'string', enum: ['slight', 'clear', 'large']}, why: {type: 'string'}}};

const describe = (s, label) => s.mobile ? `images ${s.from} to ${s.from + s.desktop - 1} are the ${label} page at 1440 px wide in consecutive slices; image ${s.from + s.desktop} is the ${label} page at 390 px wide as columns` : `images ${s.from} to ${s.from + s.desktop - 1} are the ${label} page on desktop in consecutive slices (no phone capture)`;
function pairPrompt(b1, b2, s1, s2) {
  const same = b1 === b2;
  return `You are a senior design director comparing two landing pages${same ? ` built for the same brief:\n"${b1}"` : `. They answer different briefs.\nFIRST page's brief: "${b1}"\nSECOND page's brief: "${b2}"\nJudge each against its own brief.`}\n\nIn the attached images, ${describe(s1, 'FIRST')}. Then ${describe(s2, 'SECOND')}. Motion is reduced.\n\nWhich page is better design work${same ? ' for this brief' : ''}, judged as a design director would: craft, specificity to its business, real material at real size, a clear idea held to the footer, nothing that reads as generated filler?${s1.mobile && s2.mobile ? ' A phone layout that holds up counts.' : ' Judge the desktop pages only.'} Length and number of sections are not merits in themselves. List strengths and weaknesses of each before deciding. Answer "tie" only if you truly cannot choose.`;
}

/** Waterline as 2000-px-at-1440 slices (the jpg is 1000 wide). */
async function waterlineSlices() {
  const dir = join(NEW, 'shots'), out = [];
  const files = [0, 1, 2].map(i => join(dir, `waterline__d${i}.jpg`));
  if (files.every(existsSync)) return files;
  const pw = await import(pathToFileURL(join(runs, 'pw', 'node_modules', 'playwright', 'index.mjs')).href);
  const browser = await pw.chromium.launch();
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    await page.setContent(`<body style="margin:0"><img id="w" src="data:image/jpeg;base64,${readFileSync(WATERLINE).toString('base64')}" style="display:block;width:1440px">`);
    const h = await page.evaluate(async () => { const i = document.getElementById('w'); await i.decode(); return i.getBoundingClientRect().height; });
    for (let y = 0, i = 0; y < h; y += 2000, i++) { const f = join(dir, `waterline__d${i}.jpg`); await page.screenshot({path: f, type: 'jpeg', quality: 80, fullPage: true, clip: {x: 0, y, width: 1440, height: Math.min(2000, h - y)}}); out.push(f); }
  } finally { await browser.close(); }
  return out;
}

function imagesOf(res, dir, id, {mobile = true} = {}) {
  const s = res.runs[id]?.shot;
  if (!s?.desktop) return null;
  return {desktop: s.desktop.slices.map(f => join(dir, f)), mobile: mobile ? join(dir, s.mobile.sheet) : null};
}

const wl = await waterlineSlices();
for (const brief of wantedBriefs) {
  const mine = imagesOf(newRes, NEW, `${model}/${brief}/B`);
  if (!mine) { console.log('no new page for', brief); continue; }
  const comparators = {
    lastB: {images: imagesOf(oldRes, OLD, `${model}/${brief}/B`), brief: briefs[brief]},
    noSkill: {images: imagesOf(baseRes, BASE, `${model}/${brief}/A`), brief: briefs[brief]},
    waterline: {images: {desktop: wl, mobile: null}, brief: WATERLINE_BRIEF},
  };
  for (const [name, c] of Object.entries(comparators)) {
    if (skip.includes(name)) continue;
    const key = `${brief}/${name}`;
    if (cross[key]?.verdict && cross[key].verdict !== 'error') continue;
    if (!c.images) { cross[key] = {verdict: 'missing'}; save(); continue; }
    const withMobile = name !== 'waterline', me = {desktop: mine.desktop, mobile: withMobile ? mine.mobile : null};
    const sides = {new: {imgs: me, brief: briefs[brief]}, other: {imgs: c.images, brief: c.brief}};
    const first = Math.random() < 0.5 ? ['new', 'other'] : ['other', 'new'], rounds = [];
    for (const order of [first, [...first].reverse()]) {
      const [x, y] = order.map(k => sides[k]);
      const list = i => [...i.desktop, ...(i.mobile ? [i.mobile] : [])];
      const s1 = {from: 1, desktop: x.imgs.desktop.length, mobile: !!x.imgs.mobile}, s2 = {from: 1 + list(x.imgs).length, desktop: y.imgs.desktop.length, mobile: !!y.imgs.mobile};
      console.log('cross', key, order.join(' then '));
      try { const v = ask([...list(x.imgs), ...list(y.imgs)], pairPrompt(x.brief, y.brief, s1, s2), PAIR_SCHEMA); rounds.push({order, ...v, winner: v.better === 'tie' ? 'tie' : v.better === 'first' ? order[0] : order[1]}); }
      catch (e) { rounds.push({order, error: String(e.message || e).slice(0, 300)}); }
    }
    const w = rounds.map(r => r.winner);
    cross[key] = {judge, rounds, verdict: rounds.some(r => r.error) ? 'error' : w[0] === w[1] ? w[0] : 'split'};
    save();
  }
}
console.log('done');
