#!/usr/bin/env node
/** Screenshots, checks and blind judging for the baseline eval (run.mjs builds the pages).
 *
 *  node evals/baseline/judge.mjs [--runs <dir>] [--out evals/baseline/results] [--steps shoot,absolute,pairwise] [--judge auto|swap|codex|claude]
 *
 *  shoot     Builds again where there is a build script (records whether it compiles), serves the page over HTTP,
 *            records console errors and failed requests, and takes full-page screenshots at 1440 and 390 wide with
 *            reduced motion. The judge gets the desktop page in 2000px slices and the phone page as one contact sheet.
 *  absolute  One blind score per page from a model of the other family (Sonnet's pages go to Codex, Codex's to Claude
 *            Opus), so no model grades its own family. It sees only the brief and the screenshots, never the condition,
 *            the transcript or the folder name. Evidence comes first and every point above 5 must cite something visible.
 *  pairwise  For each brief and model, A and B side by side in random order, asked twice with the order swapped. Only a
 *            verdict that names the same page both times counts; otherwise it is "split".
 *  Results: <out>/results.json and <out>/shots/. */
import {existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, mkdtempSync, rmSync, copyFileSync, symlinkSync} from 'node:fs';
import {resolve, join, dirname, extname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {homedir, tmpdir} from 'node:os';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..', '..');
const args = process.argv.slice(2), flag = (n, f) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : f; };
const RUNS = resolve(flag('runs', '/tmp/seenry-baseline-runs')), OUT = resolve(flag('out', join(here, 'results')));
const steps = flag('steps', 'shoot,absolute,pairwise').split(','), judgeChoice = flag('judge', 'auto');
const PLAYWRIGHT = join(RUNS, 'pw', 'node_modules', 'playwright', 'index.mjs');
const briefs = Object.fromEntries(JSON.parse(readFileSync(join(root, 'evals', 'level', 'briefs.json'), 'utf8')).map(b => [b.id, b.brief]));
const SHOTS = join(OUT, 'shots');
mkdirSync(SHOTS, {recursive: true});
const resultsFile = join(OUT, 'results.json');
const results = existsSync(resultsFile) ? JSON.parse(readFileSync(resultsFile, 'utf8')) : {runs: {}, pairs: {}};
const save = () => writeFileSync(resultsFile, JSON.stringify(results, null, 2));

const runs = [];
for (const m of readdirSync(RUNS)) if (!['pw', 'probe'].includes(m) && statSync(join(RUNS, m)).isDirectory())
  for (const b of readdirSync(join(RUNS, m))) for (const c of ['A', 'B']) {
    const meta = join(RUNS, m, b, c, 'meta.json');
    if (existsSync(meta)) { const j = JSON.parse(readFileSync(meta, 'utf8')); if (j.finished) runs.push({id: `${m}/${b}/${c}`, dir: join(RUNS, m, b, c), meta: j}); }
  }

const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ttf': 'font/ttf', '.otf': 'font/otf', '.gif': 'image/gif'};
function serve(dir) {
  return new Promise(res => {
    const s = createServer((req, r) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let f = join(dir, p);
      if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
      if (!f.startsWith(dir) || !existsSync(f)) { r.writeHead(404); return r.end(); }
      r.writeHead(200, {'Content-Type': MIME[extname(f).toLowerCase()] || 'application/octet-stream'}); r.end(readFileSync(f));
    }).listen(0, '127.0.0.1', () => res(s));
  });
}

function findPage(work) {
  for (const f of ['dist/index.html', 'out/index.html', 'build/index.html', 'index.html', 'public/index.html']) if (existsSync(join(work, f))) return join(work, f);
  return null;
}

async function shoot(run) {
  const work = join(run.dir, 'work'), info = {};
  const pkg = join(work, 'package.json');
  if (existsSync(pkg)) {
    const scripts = (() => { try { return JSON.parse(readFileSync(pkg, 'utf8')).scripts || {}; } catch { return {}; } })();
    if (scripts.build) {
      const env = {...process.env, HOME: join(run.dir, 'home')};
      const r = spawnSync('npm', ['run', 'build'], {cwd: work, encoding: 'utf8', timeout: 600000, env});
      info.build = {ran: true, ok: r.status === 0, tail: (r.stdout + r.stderr).slice(-600)};
    }
  }
  if (!info.build) info.build = {ran: false, ok: null};
  const page = findPage(work);
  info.page = page ? page.slice(work.length + 1) : null;
  if (!page) return info;
  const {chromium} = await import(pathToFileURL(PLAYWRIGHT).href);
  const server = await serve(dirname(page)), url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const id = run.id.replace(/\//g, '__');
  try {
    for (const [name, vp, dsf] of [['desktop', {width: 1440, height: 900}, 1], ['mobile', {width: 390, height: 844}, 2]]) {
      const ctx = await browser.newContext({viewport: vp, deviceScaleFactor: dsf, reducedMotion: 'reduce', isMobile: name === 'mobile', hasTouch: name === 'mobile'});
      const p = await ctx.newPage(), errors = [], failed = [];
      p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
      p.on('pageerror', e => errors.push(`pageerror: ${String(e.message).slice(0, 200)}`));
      p.on('requestfailed', r => failed.push(r.url().replace(url, '/')));
      p.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(url, '/')}`); });
      await p.goto(url, {waitUntil: 'networkidle', timeout: 45000}).catch(e => errors.push(`goto: ${e.message.slice(0, 120)}`));
      await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
      await p.waitForTimeout(1500);
      const height = await p.evaluate(() => document.documentElement.scrollHeight);
      const hscroll = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      const capH = Math.min(height, 20000);
      const full = join(SHOTS, `${id}__${name}.jpg`);
      await p.screenshot({path: full, fullPage: true, type: 'jpeg', quality: 72, clip: {x: 0, y: 0, width: vp.width, height: capH}});
      info[name] = {height, truncated: height > capH, horizontalScroll: hscroll, consoleErrors: [...new Set(errors)].slice(0, 20), failedRequests: [...new Set(failed)].slice(0, 20), shot: full.slice(OUT.length + 1)};
      if (name === 'desktop') {
        const slices = [];
        for (let y = 0, i = 0; y < capH && i < 8; y += 2000, i++) { const f = join(SHOTS, `${id}__d${i}.jpg`); await p.screenshot({path: f, fullPage: true, type: 'jpeg', quality: 80, clip: {x: 0, y, width: 1440, height: Math.min(2000, capH - y)}}); slices.push(f.slice(OUT.length + 1)); }
        info.desktop.slices = slices;
        info.desktop.slicedTo = Math.min(capH, 16000);
      }
      await ctx.close();
    }
    // Phone page as one contact sheet: the full-page still cut into columns of 1700 CSS px.
    const ctx = await browser.newContext({viewport: {width: 1600, height: 1000}});
    const p = await ctx.newPage();
    const mobileFull = join(SHOTS, `${id}__mobile.jpg`), colH = 1700 * 2, h = Math.min(info.mobile.height, 20000) * 2, cols = Math.ceil(h / colH);
    const src = `data:image/jpeg;base64,${readFileSync(mobileFull).toString('base64')}`;
    const colsUsed = Math.min(cols, 8), w = 780 * colsUsed / 2 + 12 * (colsUsed + 1);
    await p.setViewportSize({width: Math.ceil(w), height: 1700 + 24});
    await p.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px;padding:12px">${Array.from({length: colsUsed}, (_, i) => `<div style="width:390px;height:1700px;overflow:hidden;background:#fff;flex:none"><img src="${src}" style="width:390px;display:block;margin-top:-${i * 1700}px"></div>`).join('')}</body>`);
    await p.waitForTimeout(300);
    const sheet = join(SHOTS, `${id}__msheet.jpg`);
    await p.screenshot({path: sheet, type: 'jpeg', quality: 80});
    info.mobile.sheet = sheet.slice(OUT.length + 1);
    info.mobile.sheetTruncated = cols > 8;
    await ctx.close();
  } finally { await browser.close(); server.close(); }
  return info;
}

// --- judges ---------------------------------------------------------------------------------------------------
const realHome = homedir();
function judgeHome() {
  const h = join(tmpdir(), 'seenry-judge-home'), c = join(h, '.codex');
  mkdirSync(join(h, 'Library'), {recursive: true}); mkdirSync(c, {recursive: true});
  try { symlinkSync(join(realHome, 'Library', 'Keychains'), join(h, 'Library', 'Keychains')); } catch {}
  try { symlinkSync(join(realHome, '.codex', 'auth.json'), join(c, 'auth.json')); } catch {}
  try { copyFileSync(join(realHome, '.codex', 'models_cache.json'), join(c, 'models_cache.json')); } catch {}
  const model = (readFileSync(join(realHome, '.codex', 'config.toml'), 'utf8').match(/^model\s*=\s*"([^"]+)"/m) || [])[1];
  writeFileSync(join(c, 'config.toml'), `${model ? `model = "${model}"\n` : ''}model_reasoning_effort = "high"\n`);
  return {HOME: h, CODEX_HOME: c};
}
const JH = judgeHome();
function judgeEnv() { const env = {}; for (const [k, v] of Object.entries(process.env)) if (!/^(CLAUDE|CLAUDECODE|CODEX_|SEENRY_)/.test(k)) env[k] = v; return {...env, ...JH, PATH: `${join(realHome, '.local', 'bin')}:${process.env.PATH}`}; }
// auto: the other family judges. swap: the same family judges, as a check on the first.
export const judgeFor = model => { if (!['auto', 'swap'].includes(judgeChoice)) return judgeChoice; const other = model.startsWith('codex') ? 'claude' : 'codex'; return judgeChoice === 'auto' ? other : other === 'codex' ? 'claude' : 'codex'; };

function ask(judge, images, prompt, schema) {
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

const RUBRIC = `How to score (1 to 10, integers). Start every score at 5 and move it only for things you can point to in the screenshots.
Anchors:
- 2-3: broken. Overlapping or cut-off text, empty bands, missing images, layout that falls apart on the phone, placeholder copy.
- 4: works, but plainly a template: centred hero with a gradient or blob, a row of three icon cards, a generic CTA band. Nothing specific to this business.
- 5: competent and tidy, the median of landing pages generated in an afternoon. Consistent spacing and type, sensible sections, but the sections are default patterns (feature grids, card rows, logo strip, testimonial cards) and you would not remember it tomorrow.
- 6: competent plus one or two specific ideas that belong to this business (a real product view with believable data, a distinctive typographic or photographic choice), while most sections remain default patterns.
- 7: art-directed throughout: one clear visual idea carried from hero to footer, real material at real size (product UI with real data, or the work shown large), several sections with a moment of their own. A designer would still spot a few default patterns or rough details.
- 8: could ship tomorrow as the site of a well-funded company or a respected studio. Every section is intentional, details are finished at both widths, nothing reads as filler. Rare.
- 9-10: among the best sites of its category on the web this year. Do not use unless you can name why it beats sites like Linear, Stripe or a top studio portfolio.
Rules: execution caps at 5 if the phone layout breaks (overflow, overlapping or clipped text, unreadable sizes) or if any image is missing or broken. If you hesitate between two numbers, give the lower. A polished surface with generic structure is a 5, not a 7.
- execution: craft and completeness. Grid, type scale, spacing, colour system, imagery quality and how it is integrated, product or work material shown at real size, finished details, phone layout.
- impact: would a design-literate visitor stop and look, and remember it? Is there a specific idea, or could the logo be swapped for any competitor's?
- looks_ai: 10 = nothing reads as machine-made; 1 = obviously generated (purple-blue gradients, glassy cards, emoji or generic line icons in rows, filler copy like "Seamless. Powerful. Effortless.", fake dashboards of random bars, AI-image tells such as melted hands or nonsense text).`;

const ABS_SCHEMA = {type: 'object', additionalProperties: false, required: ['observations', 'defects', 'phone_layout_ok', 'execution', 'impact', 'looks_ai', 'one_line'], properties: {
  observations: {type: 'array', items: {type: 'string'}}, defects: {type: 'array', items: {type: 'string'}}, phone_layout_ok: {type: 'boolean'},
  execution: {type: 'integer'}, impact: {type: 'integer'}, looks_ai: {type: 'integer'}, one_line: {type: 'string'}}};
const absPrompt = (brief, nd) => `You are a senior design director scoring one landing page from screenshots only. The page answers this brief:\n"${brief}"\n\nImages 1 to ${nd} are the desktop page at 1440 px wide, top to bottom, in consecutive 2000 px slices. Image ${nd + 1} is the same page at 390 px wide (a phone), cut into columns read left to right. Motion is reduced, so content that animates in is shown in its final state.\n\n${RUBRIC}\n\nFirst write observations: 6 to 10 concrete things you see, good and bad, each naming the section. Then defects: the most visible problems, worst first. Then the scores. one_line: one sentence a colleague would say about this page.`;

const PAIR_SCHEMA = {type: 'object', additionalProperties: false, required: ['first_strengths', 'first_weaknesses', 'second_strengths', 'second_weaknesses', 'better', 'margin', 'why'], properties: {
  first_strengths: {type: 'array', items: {type: 'string'}}, first_weaknesses: {type: 'array', items: {type: 'string'}}, second_strengths: {type: 'array', items: {type: 'string'}}, second_weaknesses: {type: 'array', items: {type: 'string'}},
  better: {type: 'string', enum: ['first', 'second', 'tie']}, margin: {type: 'string', enum: ['slight', 'clear', 'large']}, why: {type: 'string'}}};
const pairPrompt = (brief, n1, n2) => `You are a senior design director comparing two landing pages built for the same brief:\n"${brief}"\n\nImages 1 to ${n1} are the FIRST page at 1440 px wide in consecutive 2000 px slices; image ${n1 + 1} is the FIRST page at 390 px wide as columns. Images ${n1 + 2} to ${n1 + 1 + n2} are the SECOND page at 1440 px; image ${n1 + n2 + 2} is the SECOND page at 390 px. Motion is reduced.\n\nWhich page is better design work for this brief, judged as a design director would: craft, specificity to this business, real material at real size, a clear idea held to the footer, a phone layout that holds up, nothing that reads as generated filler? Length and number of sections are not merits in themselves. List strengths and weaknesses of each before deciding. Answer "tie" only if you truly cannot choose.`;

function imagesOf(r) { const s = results.runs[r.id]?.shot; return s?.desktop ? [...s.desktop.slices.map(f => join(OUT, f)), join(OUT, s.mobile.sheet)] : null; }

if (steps.includes('shoot')) for (const r of runs) {
  if (results.runs[r.id]?.shot) continue;
  console.log('shoot', r.id);
  try { results.runs[r.id] = {...(results.runs[r.id] || {}), meta: r.meta, shot: await shoot(r)}; } catch (e) { results.runs[r.id] = {meta: r.meta, shot: {error: String(e.message || e).slice(0, 300)}}; }
  save();
}
if (steps.includes('absolute')) for (const r of runs) {
  const row = results.runs[r.id];
  if (!row || row.absolute || !imagesOf(r)) continue;
  const judge = judgeFor(r.meta.model), imgs = imagesOf(r);
  console.log('absolute', r.id, 'by', judge);
  try { row.absolute = ask(judge, imgs, absPrompt(briefs[r.meta.brief], imgs.length - 1), ABS_SCHEMA); } catch (e) { row.absoluteError = String(e.message || e).slice(0, 400); }
  save();
}
if (steps.includes('pairwise')) {
  const keys = [...new Set(runs.map(r => r.id.replace(/\/[AB]$/, '')))];
  for (const k of keys) {
    const a = runs.find(r => r.id === `${k}/A`), b = runs.find(r => r.id === `${k}/B`);
    if (!a || !b || !imagesOf(a) || !imagesOf(b) || results.pairs[k]?.verdict) continue;
    const judge = judgeFor(a.meta.model), brief = briefs[a.meta.brief];
    const order1 = Math.random() < 0.5 ? ['A', 'B'] : ['B', 'A'], orders = [order1, [...order1].reverse()], rounds = [];
    for (const order of orders) {
      const [x, y] = order.map(c => (c === 'A' ? a : b)), ix = imagesOf(x), iy = imagesOf(y);
      console.log('pairwise', k, order.join(' then '), 'by', judge);
      try { const v = ask(judge, [...ix, ...iy], pairPrompt(brief, ix.length - 1, iy.length - 1), PAIR_SCHEMA); rounds.push({order, ...v, winner: v.better === 'tie' ? 'tie' : v.better === 'first' ? order[0] : order[1]}); }
      catch (e) { rounds.push({order, error: String(e.message || e).slice(0, 300)}); }
    }
    const w = rounds.map(r => r.winner);
    const verdict = rounds.some(r => r.error) ? 'error' : w[0] === w[1] ? w[0] : 'split';
    results.pairs[k] = {judge, rounds, verdict};
    save();
  }
}
console.log('done');
