#!/usr/bin/env node
/** The finishing gate. One command per round:
 *
 *  node check.mjs <url | file.html> --brief BRIEF.md [--refs a.png,b.png] [--dir .seenry] [--target 9] [--mode quick|polish|showcase] [--critic-rounds n] [--fast] [--all] [--playwright path]
 *  node check.mjs --screens home.png,detail.png,sheet.png --video rec.mov --brief BRIEF.md   (native apps: SwiftUI,
 *    UIKit, React Native, Flutter; simulator screenshots in flow order and a screen recording of the interactions)
 *
 *  1. Renders the page with review_board.mjs. Any slop or craft blocker fails the round. It prints the five blockers that
 *     matter most, ranked (blockers.mjs); --all prints every check in full. The full list is kept in review/blockers.txt.
 *  2. With zero blockers the default run ends: CHECKS PASS, no model score, the person is the judge. With --studio, or
 *     when the canvas records an unattended run, critic.mjs runs: a fresh model scores the page against the references.
 *  3. Prints PASS when the critic's overall reaches --target (default 9: a local heuristic, not evidence of outperforming another product)
 *     and impact and execution are 8 or more, else FAIL with the fixes to apply.
 *  Rounds are numbered; every critic result is kept as <dir>/review/critic-N.json and summarized in check.json. */
import {existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, statSync, lstatSync, copyFileSync, rmSync, renameSync} from 'node:fs';
import {resolve, join, dirname, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {recordIdentity} from './history.mjs';
import {validMotionVerdict, motionAcceptance, MOTION_ACCEPTANCE_POLICY} from './motion_contract.mjs';
import {markWorkDir} from './workdir.mjs';
import {teardownProblems} from './execution_bar.mjs';
import {pairBlocks} from './judge_pair.mjs';
import {motionDocProblems} from './motion_doc.mjs';
import {shortBlockers} from './blockers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const native = flag('screens'), video = flag('video');
const target = native ? null : args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!target && !native) { console.error('Usage: node check.mjs <url | file.html> --brief BRIEF.md [--refs a.png,b.png]'); process.exit(2); }
const dir = resolve(flag('dir', '.seenry')), review = join(dir, 'review');
markWorkDir(dir);
const goal = Number(flag('target', '9'));
mkdirSync(review, {recursive: true});
// A gate that runs in the background must never be abandoned: ending the turn while it runs ends the work in headless
// sessions. --await blocks until the running gate finishes, then prints its full output and exits with its code.
const running = join(review, 'check.running'), lastRun = join(review, 'last-run.json');
if (args.includes('--await')) {
  const alive = () => { if (!existsSync(running)) return false; try { process.kill(Number(readFileSync(running, 'utf8')), 0); return true; } catch { return false; } };
  const start = Date.now();
  while (alive() && Date.now() - start < 45 * 60000) await new Promise(r => setTimeout(r, 5000));
  if (!existsSync(lastRun)) { console.log('No finished gate run found. Run check.mjs in the foreground.'); process.exit(2); }
  const last = JSON.parse(readFileSync(lastRun, 'utf8'));
  process.stdout.write(last.log);
  process.exit(last.code);
}
writeFileSync(running, String(process.pid));
const captured = [];
const rawWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...rest) => { captured.push(String(chunk)); return rawWrite(chunk, ...rest); };
process.on('exit', code => { try { writeFileSync(lastRun, JSON.stringify({code, log: captured.join('')})); rmSync(running, {force: true}); } catch {} });
let refs = flag('refs');
// The critic's bar is the leaders' home-page first screens from research.mjs, never the builder's own picks: section
// crops and motion frames made a weak, noisy bar that scored America.gov itself 5/10.
// Among saved references, the ones compose.md or kept.md name come first: the critic must judge against what the page
// was composed from, not whichever file sorts first (a set-aside reference once became the bar that way).
const citedText = [join(dir, 'compose.md'), join(dir, 'refs', 'kept.md')].filter(existsSync).map(p => readFileSync(p, 'utf8').toLowerCase()).join('\n');
const word = s => new RegExp(`(^|[^a-z0-9-])${s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9-])`);
const cited = f => word(f).test(citedText) || (f.replace(/\.[a-z0-9]+$/i, '').length >= 4 && word(f.replace(/\.[a-z0-9]+$/i, '')).test(citedText));
const pickFrom = d => existsSync(d) ? readdirSync(d).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort((a, b) => (cited(b) ? 1 : 0) - (cited(a) ? 1 : 0) || a.localeCompare(b)).slice(0, 3).map(f => join(d, f)).join(',') : '';
if (!refs) refs = pickFrom(join(dir, 'research', 'bar')) || pickFrom(join(dir, 'refs')) || pickFrom(join(dir, 'canvas', 'refs'));
// A stalled concept gets one fresh budget on a different idea; the first direction's rounds stay on disk and in the report.
const firstDirection = join(review, 'direction-1');
if (args.includes('--new-direction')) {
  const prior = existsSync(join(review, 'check.json')) ? JSON.parse(readFileSync(join(review, 'check.json'), 'utf8')) : [];
  if (existsSync(firstDirection)) { console.log('A new direction was already used. Report the best result of both directions with its unresolved criteria.'); process.exit(1); }
  if (!prior.some(h => h.stop)) { console.log('--new-direction is for a review that stopped below the target. Keep applying fixes.'); process.exit(1); }
  mkdirSync(firstDirection, {recursive: true});
  for (const f of readdirSync(review)) if (f !== 'direction-1') renameSync(join(review, f), join(firstDirection, f));
  console.log(`Direction 1 archived in ${firstDirection} (best critic ${Math.max(...prior.filter(h => h.critic).map(h => h.critic.overall))}). Reviewing the new direction with a fresh budget.`);
}
const history = existsSync(join(review, 'check.json')) ? JSON.parse(readFileSync(join(review, 'check.json'), 'utf8')) : [];
const round = history.length + 1;
// Bind the review to local source AND material. HTML alone misses changes in linked CSS,
// scripts, images and fonts. Review outputs are excluded so producing evidence does not
// invalidate itself. Live URLs and symlinked inputs cannot prove immutable identity.
function projectFingerprint() {
  if (native) {
    const h = createHash('sha256');
    if (!video) return {digest: null, reusable: false};
    for (const path of [...native.split(','), video, flag('brief'), ...(refs || '').split(',')].filter(Boolean)) {
      if (!existsSync(path) || !lstatSync(path).isFile()) return {digest: null, reusable: false};
      h.update(JSON.stringify([resolve(path), statSync(path).size])); h.update(readFileSync(path));
    }
    return {digest: h.digest('hex'), reusable: true};
  }
  if (/^https?:/.test(target) || !existsSync(target)) return {digest: null, reusable: false};
  const root = dirname(resolve(target)), h = createHash('sha256');
  h.update('target:' + resolve(target));
  const extensions = /\.(html?|css|[cm]?js|jsx|tsx?|json|svg|png|jpe?g|webp|gif|avif|ico|woff2?|ttf|otf|eot|mp4|webm|mov|mp3|wav|ogg)$/i;
  let unverifiable = false;
  const excluded = new Set(['.git','.seenry','.cache','.next','.nuxt','.venv','node_modules']);
  const within = (path, directory) => path === directory || path.startsWith(directory + sep);
  const add = (path, label) => {
    const st = lstatSync(path);
    if (st.isSymbolicLink()) { unverifiable = true; return; }
    if (!st.isFile()) return;
    const bytes = readFileSync(path);
    h.update(JSON.stringify([label, st.size])); h.update(bytes);
    if (/\.(html?|css|[cm]?js|jsx|tsx?)$/i.test(path)) {
      const text = bytes.toString('utf8');
      // Do not assert immutable identity for resources outside the inspected source
      // root. This also covers parent-directory CSS/imports without reading them.
      const patterns = [/(?:src|href|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi,
        /url\(\s*["']?([^"')\s]+)["']?\s*\)/gi,
        /(?:from\s*|import\s*\(\s*|import\s*)["']([^"']+)["']/g];
      for (const pattern of patterns) for (const m of text.matchAll(pattern)) {
        const value = (m[1] ?? m[2] ?? m[3]).split(/[?#]/)[0];
        if (!value || /^(?:data:|blob:|node:)/i.test(value)) continue;
        if (/^(?:https?:|\/\/|\/)/i.test(value)) { unverifiable = true; continue; }
        const dependency = resolve(dirname(path), value);
        if (!within(dependency, root) || relative(root, dependency).split(sep).some(part => excluded.has(part))) unverifiable = true;
      }
    }
  };
  const walk = (path, prefix = '') => {
    for (const f of readdirSync(path).sort()) {
      const p = join(path, f), label = join(prefix, f), st = lstatSync(p);
      if ((within(p, review) && !within(root, review)) || excluded.has(f)) continue;
      if (st.isSymbolicLink()) { unverifiable = true; continue; }
      if (st.isDirectory()) walk(p, label);
      else if (extensions.test(f) || p === resolve(target)) add(p, 'source:' + label);
    }
  };
  walk(root);
  for (const p of [flag('brief'), join(root, 'DESIGN.md'), join(dir, 'idea.md'), join(dir, 'identity.md'), join(dir, 'motion.md'),
    join(dir, 'research', 'pack.md'), join(dir, 'explore', 'pick.json'), join(dir, 'level.md'), join(dir, 'compose.md'), join(dir, 'teardown.md'), ...(refs || '').split(',')].filter(Boolean)) {
    if (existsSync(p)) add(resolve(p), 'input:' + relative(root, resolve(p)));
  }
  return {digest: h.digest('hex'), reusable: !unverifiable};
}
const identity = projectFingerprint();
const fingerprint = identity.reusable ? identity.digest : null;
// A failed/unverified attempt does not certify a version; retry it after repairing
// the tool instead of stopping merely because its source hash appears in history.
const completedReviews = () => history.filter(h => h.critic && Number.isFinite(h.motion) && !h.motionError);
// An older scoring policy does not certify unchanged source under a stricter bar.
// Keep those complete rounds as useful previous findings, but verify once on upgrade.
const checkedVersions = new Set(completedReviews().filter(h => native || h.motionPolicy === MOTION_ACCEPTANCE_POLICY).map(h => h.hash).filter(Boolean));
// Only critic rounds count toward the budget: board fixes are cheap and must never eat the rounds of design feedback.
const criticRounds = history.filter(h => h.critic && !h.reusedCritic).length;
// --critic-rounds caps design-feedback rounds for time-boxed work; the target score is unchanged.
// --mode quick (the skill's default): one critic round, its fixes, then one more critic round so the reported score is
// the final page's; static motion scan. polish: up to four
// critic rounds, stopping at leader level. showcase: the full gate with a second direction. The target is 9 in all modes.
const mode = flag('mode', args.includes('--fast') ? 'fast' : 'showcase');
const quick = mode === 'quick', polish = mode === 'polish';
const fast = mode === 'fast' || quick || polish;
const leader = 8, level = n => n >= goal ? 'pass' : n >= leader ? 'leader level' : 'below leader level';
// Showcase rounds rarely gain after the fourth; the time is better spent on a second direction.
const criticCap = Number(flag('critic-rounds', 0)) || (quick ? 2 : polish ? 4 : mode === 'fast' ? 3 : 4);
if ((criticRounds >= (criticCap ?? 8) || round > 20) && !history.some(h => h.stop)) {
  history[history.length - 1].stop = criticRounds >= (criticCap ?? 8) ? `${criticCap ?? 'eight'} critic rounds` : 'twenty rounds';
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
}
const stoppedAt = history.find(h => h.stop);
if (stoppedAt && (!fingerprint || !checkedVersions.has(fingerprint))) {
  console.log(`The current version changed or cannot be matched to the last checked round (${stoppedAt.round}). Running one verification round before you report.`);
} else if (stoppedAt) {
  const best = completedReviews().sort((a, b) => b.critic.overall - a.critic.overall)[0];
  console.log(`STOPPED at round ${stoppedAt.round}: ${stoppedAt.stop}. No new PASS is recorded. Best fully reviewed candidate: ${best ? `round ${best.round}, critic ${best.critic.overall}, motion ${best.motion}` : 'none'}. Report remaining quality gaps; a stopping budget is not acceptance.${quick || polish || existsSync(firstDirection) ? '' : ' Below the target with no new direction used yet: go back to the exploration step, build a different idea, and run check.mjs with --new-direction once before reporting.'}`);
  process.exit(3);
}

const pw = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
// Images started with image.mjs --background: wait for them so the review sees the real photographs.
if (existsSync(join(dir, 'images.pending'))) {
  console.log('Waiting for background image generation to finish…');
  const waitStart = Date.now();
  while (existsSync(join(dir, 'images.pending')) && Date.now() - waitStart < 30 * 60 * 1000) await new Promise(r => setTimeout(r, 3000));
}
// A level reference (work the person showed for register and level) outranks the house register and lends its own
// measured exceptions to the board, the way a named site's pattern map does.
const levelFile = join(dir, 'level.md'), levelDir = join(dir, 'level');
const levelText = existsSync(levelFile) ? readFileSync(levelFile, 'utf8') : '';
const levelImages = existsSync(levelDir) ? readdirSync(levelDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).slice(0, 3).map(f => join(levelDir, f)) : [];
const levelRegister = ((levelText.match(/^Register:\s*(.+)$/mi) || [])[1] || '').trim();
const quietRegister = levelRegister ? /quiet/i.test(levelRegister) : existsSync(join(dir, 'identity.md')) && /register[^\n]{0,40}quiet|quiet premium/i.test(readFileSync(join(dir, 'identity.md'), 'utf8'));
const briefText = flag('brief') && existsSync(flag('brief')) ? readFileSync(flag('brief'), 'utf8') : '';
// An app screen (dashboard, settings, a tool) is judged as product UI, not as a landing page.
const appSurface = flag('surface') === 'app' || /^surface:\s*(app|dashboard|product)/mi.test(briefText);
const software = /\b(saas|software|app|apps|platform|tool|dashboard|api|sdk|plugin|extension|workspace|subscription)\b/i.test(briefText);
// A named reference's own patterns (chapter numbers, a serif accent, pill tags) are allowed when the pattern map lists them.
const patternFile = join(dir, 'refs', 'patterns.md');
const refUrl = existsSync(patternFile) ? (readFileSync(patternFile, 'utf8').match(/https?:\/\/[^\s)>\]]+/) || [])[0] || '' : '';
const allowFrom = text => ((text.match(/^Allow:\s*(.+)$/mi) || [])[1] || '').trim();
const allowed = [existsSync(patternFile) ? allowFrom(readFileSync(patternFile, 'utf8')) : '', allowFrom(levelText)].filter(Boolean).join(',');
const boardArgs = [join(here, 'review_board.mjs'), target, '--out', review, '--studio', ...(allowed ? ['--allow', allowed] : []), ...(existsSync(patternFile) ? ['--named'] : []), ...(appSurface ? ['--app'] : []), ...(quietRegister ? ['--quiet'] : []), ...(software ? ['--software'] : []), ...(refs ? ['--refs', refs] : []), ...(pw ? ['--playwright', pw] : [])];
// Native apps have no DOM to inspect: their screenshots are laid out as the board and the critic and motion judge do the review.
const board = native
  ? spawnSync('node', [join(here, 'screens.mjs'), '--screens', native, '--out', review, ...(refs ? ['--refs', refs] : []), ...(pw ? ['--playwright', pw] : [])], {encoding: 'utf8'})
  : spawnSync('node', boardArgs, {encoding: 'utf8'});
if (board.status === 2) { process.stdout.write(board.stdout); process.stderr.write(board.stderr); process.exit(2); }
if (!native && !existsSync(join(review, 'board.json'))) {
  // One line, not a stack trace: a sandbox that cannot launch a browser once left a run with no gate and no reason.
  const why = String(board.stderr || board.stdout || board.error || '').split('\n').map(s => s.trim()).filter(s => s && !/^at |^node:|^\^|^\s*$/.test(s))[0] || `the board exited ${board.status ?? board.signal}`;
  console.log(`GATE DID NOT RUN: the review board produced no result (${why.slice(0, 220)}). Nothing was checked, so there is no score to report. Fix the cause and run check.mjs again.`);
  process.exit(2);
}
const boardReport = native ? {} : JSON.parse(readFileSync(join(review, 'board.json'), 'utf8'));
let blockers = native ? 0 : boardReport.blockers;
// The final check prints the five blockers that matter most, ranked (blockers.mjs); --all prints every section in
// full as before. Either way the full list is written to review/blockers.txt.
const all = args.includes('--all'), items = [], fullLog = [];
const detail = text => { fullLog.push(text); if (all) console.log(text); };
items.push(...(boardReport.items || []));
if (blockers > (boardReport.items || []).length) items.push({rank: 3, text: `review board: ${blockers - (boardReport.items || []).length} more blocker(s) in ${join(review, 'blockers.txt')}`});
const project = !/^https?:/.test(target) && existsSync(target) ? dirname(resolve(target)) : process.cwd();
const refCount = existsSync(join(dir, 'refs')) ? readdirSync(join(dir, 'refs')).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).length : 0;
// Remember this project's identity so the next one can differ from it (the skill reads the last ten).
try { recordIdentity(dir, project); } catch {}
// A named site is the identity (references/named-site.md): its pattern map replaces the three boards.
const named = existsSync(join(dir, 'refs', 'patterns.md'));
// What SKILL.md asks for, in its own names: the brief, the studied references, the teardown, the composition, the
// tokens and screens a person approved on the canvas (or a recorded unattended run). The older studio files
// (idea.md, research/pack.md, refs/kept.md) still count where a project has them.
const canvasDir = join(dir, 'canvas');
const imagesIn = d => existsSync(d) ? readdirSync(d).filter(f => /\.(png|jpe?g|webp|avif)$/i.test(f)).length : 0;
const studied = imagesIn(join(canvasDir, 'refs')) + refCount;
const briefFile = [flag('brief'), join(dir, 'brief.md')].find(p => p && existsSync(p));
const longEnough = (p, n) => existsSync(p) && readFileSync(p, 'utf8').length >= n;
const composed = longEnough(join(dir, 'compose.md'), 300) || existsSync(join(dir, 'refs', 'kept.md'));
const teardownFile = join(dir, 'teardown.md');
const teardownGaps = native ? [] : teardownProblems(existsSync(teardownFile) ? readFileSync(teardownFile, 'utf8') : '');
// Tokens live on the canvas, beside the page, or in any folder between the page and where the gate was run.
const tokenRoots = (() => { const out = [resolve(project)], cwd = process.cwd(); while (out[out.length - 1] !== cwd && out[out.length - 1].startsWith(cwd + sep)) out.push(dirname(out[out.length - 1])); return out.includes(cwd) ? out : [...out, cwd]; })();
const tokensFound = existsSync(join(canvasDir, 'tokens.css')) || tokenRoots.some(root => ['', 'src', 'styles', 'css'].some(sub => existsSync(join(root, sub, 'tokens.css')))
  || (existsSync(root) && readdirSync(root).some(f => /\.css$/i.test(f) && lstatSync(join(root, f)).isFile() && /--[\w-]+\s*:/.test(readFileSync(join(root, f), 'utf8')))));
const canvasManifest = existsSync(join(canvasDir, 'canvas.json')) ? (() => { try { return JSON.parse(readFileSync(join(canvasDir, 'canvas.json'), 'utf8')); } catch { return {}; } })() : {};
const canvasReview = existsSync(join(canvasDir, 'review.json')) ? (() => { try { return JSON.parse(readFileSync(join(canvasDir, 'review.json'), 'utf8')); } catch { return {}; } })() : {};
const approvedScreens = Object.values(canvasReview.frames || {}).filter(f => f && f.status === 'approved').length;
const unattended = canvasManifest.unattended?.reason || '';
// The person is the judge. Model judges (the blind critic, the detail, choreography, motion and photo judges, the pair
// verdicts) and the written teardown run only with --studio, or when nobody can review: an unattended run recorded on
// the canvas. Native screens have no DOM for the board to check, so they are always judged.
const studio = !!native || args.includes('--studio') || !!unattended;
const picked = !!canvasManifest.picked;
const canvasScript = join(here, '..', '..', 'seenry-canvas', 'scripts', 'canvas.mjs');
// Verdicts canvas.mjs verify recorded when it put each option beside a reference; screens archived since are ignored.
const pairVerdicts = !studio ? [] : (() => { try { return pairBlocks(JSON.parse(readFileSync(join(canvasDir, '.renders', 'pair', 'pair.json'), 'utf8')).entries.filter(e => !e.src || existsSync(join(canvasDir, e.src)))); } catch { return []; } })();
// A page that moves says why: MOTION.md holds a row per moving thing with the change it explains, and the CSS a
// reduced-motion block. Uniform fade-ups with no reason were the motion every generated page shipped.
function motionGaps() {
  if (native) return [];
  let m = null; try { m = JSON.parse(readFileSync(join(review, 'board.json'), 'utf8')).widths?.['1440']?.motion; } catch {}
  if (!m || !(m.withTransition > 0 || m.keyframes > 0)) return [];
  const file = [join(project, 'MOTION.md'), join(dir, 'MOTION.md'), join(process.cwd(), 'MOTION.md')].find(existsSync), where = relative(process.cwd(), file || join(project, 'MOTION.md')) || 'MOTION.md';
  const gaps = motionDocProblems(file ? readFileSync(file, 'utf8') : '');
  return [
    gaps.length && `motion: the page moves (${m.withTransition} transitions, ${m.keyframes} keyframe animations) and ${where}: ${gaps.join('; ')}. Columns: Moves, Trigger, What moves, Duration, Easing, Explains, Reduced motion; one line names the signature moment. The how is in the seenry-motion skill`,
    !m.reducedMotion && 'motion: the CSS has 0 prefers-reduced-motion blocks (needs 1): give every movement its still state',
  ].filter(Boolean);
}
// The build names its stack: DESIGN.md holds `Stack: <framework> + <libraries>, because <reason>` (references/stack.md).
// Plain HTML in an empty project is a choice for four cases, never the default.
const HTML_CASES = /throwaway|one[- ]off|\bemail|\bembed|no build step|without a build|asked for (plain |static )?html/i;
function stackLine(text) { return ((String(text || '').match(/^[ \t>*_-]*Stack:[ \t*_]*(.+)$/mi) || [])[1] || '').trim(); }
function stackProblems(text, {emptyProject = false} = {}) {
  const line = stackLine(text);
  if (!line) return {block: 'it has no line `Stack: <framework> + <libraries>, because <reason from the brief>` (needs 1)', warn: ''};
  const [what, ...why] = line.split(/,?\s*\bbecause\b/i), reason = why.join(' ').trim();
  if (!reason) return {block: `its Stack line gives no reason (needs "because <reason from the brief>"): ${line.slice(0, 120)}`, warn: ''};
  const framework = /astro|next|vite|react|remix|nuxt|svelte|vue|angular|hydrogen|expo|solid|qwik|eleventy|11ty|rails|laravel|django|flutter|swift/i.test(what);
  const plain = !framework && /\bhtml\b/i.test(what);
  return {block: '', warn: plain && emptyProject && !HTML_CASES.test(reason) ? `the stack is plain HTML in an empty project and the reason ("${reason.slice(0, 100)}") is none of: a throwaway page, an email, an embed, the user asked for no build step. Pick the framework from references/stack.md, or give that reason` : ''};
}
const stackFile = native ? null : [join(project, 'DESIGN.md'), join(process.cwd(), 'DESIGN.md'), join(dir, 'DESIGN.md')].find(existsSync);
const stack = native ? {block: '', warn: ''} : stackProblems(stackFile ? readFileSync(stackFile, 'utf8') : '', {emptyProject: ![project, process.cwd()].some(d => existsSync(join(d, 'package.json')))});
const missing = [
  !briefFile && `brief: write ${join(dir, 'brief.md')} (who it is for, the one job of each screen, the content that exists, what is fixed) and pass it with --brief`,
  studied < 2 && `references: save the three reference screens the page is held to in ${join(canvasDir, 'refs')}/ (the gate needs at least 2)`,
  studio && teardownGaps.length && `teardown: ${teardownFile} ${teardownGaps.join('; ')}. Open every reference at full size, crop its product UI and its second section, and write the counts and measurements (references/execution-bar.md)`,
  studio && studied >= 2 && !composed && `composition: write ${join(dir, 'compose.md')} naming, for each option and section, two or three references, the principle and numbers taken from each, and the product's own idea`,
  !native && !tokensFound && `tokens: no tokens.css in ${canvasDir} or the project; set the type and color system (seenry-identity) before building`,
  !native && existsSync(canvasDir) && !approvedScreens && !picked && !unattended && `approval: no option is picked and no screen is approved on the canvas. Show the options to the person (canvas.mjs open, then wait), or for a run with nobody to review record it: node ${canvasScript} round "<what you chose and why>" --unattended "<why nobody can review>"`,
  native && !video && 'motion recording: record the interactions (xcrun simctl io booted recordVideo rec.mov, or adb shell screenrecord) and pass --video rec.mov',
  ...pairVerdicts.map(m => `pair: ${m}`),
  ...motionGaps(),
  stack.block && `stack: ${relative(process.cwd(), stackFile || join(project, 'DESIGN.md')) || 'DESIGN.md'}${stackFile ? '' : ' does not exist;'} ${stack.block}. Choose with references/stack.md before building`,
  levelImages.length && levelText.length < 400 && `level reference: write ${levelFile} from the work in ${levelDir} following references/level-reference.md (its positive moves measured as floors, its register, and an Allow: line for the bans it uses)`,
].filter(Boolean);
// The study comes before the tidy-ups: these print above the board, because a page composed without them stays weak
// however many small blockers are cleared.
if (missing.length) {
  blockers += missing.length;
  items.push(...missing.map(text => ({rank: 0, text})));
  detail(`\n■ do these first ×${missing.length}`);
  for (const m of missing) detail(`  ${m}`);
}
detail(board.stdout.replace(/\n$/, ''));
if (stack.warn) console.log(`\n■ stack (a warning, not a blocker)  ${stack.warn}.`);
// Photographs must pass photo_check.mjs before the critic is asked; weak imagery is the most-cited gap.
if (studio && !/^https?:/.test(target) && existsSync(target)) {
  const html = readFileSync(target, 'utf8');
  const photos = [...new Set([...html.matchAll(/(?:src|href|url\()\s*=?\s*["']?([^"')\s>]+\.(?:png|jpe?g|webp|avif))/gi)].map(m => m[1]).filter(u => !/^(https?:|data:)/.test(u)))];
  const report = join(review, 'photos.json');
  const checks = history.filter(h => h.photoChecked).length;
  const data = existsSync(report) ? JSON.parse(readFileSync(report, 'utf8')) : null;
  // Quick mode keeps any usable image (6+); regenerating 7s doubled run time for no visible gain. Polish and showcase hold 8.
  // The first-screen image holds 8 in every mode: it carries the page, and a 6 there made pages forgettable.
  const photoFloor = quick ? 6 : 8, heroFloor = 8;
  const floorFor = i => i.hero ? Math.max(heroFloor, photoFloor) : photoFloor;
  const passed = data && data.images.every(i => i.overall >= floorFor(i));
  const heroWeak = data && data.images.some(i => i.hero && i.overall < heroFloor);
  if (data && history.length && !history[history.length - 1].photoChecked) history[history.length - 1].photoChecked = true;
  if (photos.length && data && !passed && checks >= (heroWeak || !(quick || polish) ? 3 : 1)) {
    console.log(`\n■ photographs  best effort after ${checks >= 3 ? 'three photo checks' : 'one photo check'} (${data.images.map(i => i.overall).join('/')}); not blocking. Keep the strongest versions and move on.`);
  } else if (photos.length && !passed) {
    blockers++;
    const photoRun = `Run: node ${join(here, 'photo_check.mjs')} ${photos.slice(0, 6).join(' ')} --use "<slot, ratio, position>" --brand "<brand>" --page ${target}${existsSync(patternFile) ? ' --patterns ' + patternFile : ''}${refs ? ' --refs ' + refs : ''} --out ${report}`;
    items.push({rank: 2, text: `photographs: ${photos.length} local image(s) not yet passed by the photo check (${photos.slice(0, 4).join(', ')}). ${quick ? 'Regenerate the first-screen image until it scores 8' : 'Regenerate anything under 8'}`, fix: photoRun});
    detail(`\n■ photographs  ${photos.length} local image(s) not yet passed by the photo check: ${photos.slice(0, 4).join(', ')}`);
    detail(`  Run: node ${join(here, 'photo_check.mjs')} ${photos.slice(0, 6).join(' ')} --use "<slot, ratio, position>" --brand "<brand>" --page ${target}${existsSync(patternFile) ? ' --patterns ' + patternFile : ''} [--medium "<image medium from identity.md, e.g. oil painting>"]${refs ? ' --refs ' + refs : ''} --out ${report}`);
    detail(quick ? '  Regenerate the first-screen image until it scores 8 (at most three attempts, with the jobs it writes to regenerate.json (image.mjs --batch)); elsewhere regenerate only images under 6, once, and keep everything at 6 or above.' : '  Regenerate anything under 8 with the jobs it writes to regenerate.json (image.mjs --batch) (at most three attempts per image), then run check.mjs again.');
  }
}
// A named site lends its patterns, never its words.
if (!native && refUrl) {
  const overlap = spawnSync(process.execPath, [join(here, 'copy_overlap.mjs'), target, '--ref', refUrl, ...(pw ? ['--playwright', pw] : [])], {encoding: 'utf8', timeout: 180000});
  if (overlap.status === 1) { blockers++; items.push({rank: 1, text: overlap.stdout.trim()}); detail('\n■ ' + overlap.stdout.trim().split('\n').join('\n  ')); }
  else if (overlap.stdout) console.log('\n' + overlap.stdout.trim());
}
// Static motion scan: token, easing, transition-all and reduced-motion checks from source, in well under a second.
const scanReport = join(review, 'motion-scan.json');
if (!native && existsSync(join(here, 'motion_scan.mjs'))) {
  rmSync(scanReport, {force: true});
  const scan = spawnSync('node', [join(here, 'motion_scan.mjs'), project, '--json', scanReport], {encoding: 'utf8'});
  if (scan.status === 1 && existsSync(scanReport)) {
    const n = JSON.parse(readFileSync(scanReport, 'utf8')).violations;
    blockers += n;
    items.push(...scan.stdout.trim().split('\n').slice(1, 1 + n).map(l => ({rank: 4, text: `motion scan: ${l.trim()}`})));
    detail('\n■ ' + scan.stdout.trim().split('\n').join('\n  '));
  } else if (scan.stdout) console.log('\n' + scan.stdout.trim().split('\n').slice(0, 6).join('\n  '));
}
// Token lint: every size, space, radius and duration from the token file, never typed one at a time.
if (!native && existsSync(join(here, 'token_lint.mjs'))) {
  const lint = spawnSync('node', [join(here, 'token_lint.mjs'), project, ...(args.includes('--changed') ? ['--changed'] : [])], {encoding: 'utf8'});
  if (lint.status === 1) { blockers++; items.push({rank: 3, text: `tokens: ${lint.stdout.trim().split('\n')[0]}`}); detail('\n■ ' + lint.stdout.trim().split('\n').join('\n  ')); }
}
// The build is finished when its gate has run: the moment is kept on the canvas beside the first sketch and the pick,
// whether the gate passed or not, so a run that stops on blockers still has its time.
function stampBuilt() {
  if (!canvasManifest.started || !(picked || approvedScreens || unattended) || !existsSync(join(canvasDir, 'canvas.json'))) return '';
  canvasManifest.built = new Date().toISOString();
  const start = Date.parse(canvasManifest.started), secs = key => { const t = Date.parse(canvasManifest[key] || ''); return start && t && t >= start ? Math.round((t - start) / 1000) : null; };
  canvasManifest.timing = {firstSketchSeconds: secs('firstOption'), pickSeconds: secs('picked'), builtSeconds: secs('built')};
  try { writeFileSync(join(canvasDir, 'canvas.json'), JSON.stringify(canvasManifest, null, 2) + '\n'); } catch {}
  const min = n => n === null ? null : n < 90 ? `${n} s` : `${Math.round(n / 60)} min`, t = canvasManifest.timing;
  return ` Time since the canvas was started: ${[t.firstSketchSeconds !== null && `first sketch at ${min(t.firstSketchSeconds)}`, t.pickSeconds !== null && `pick at ${min(t.pickSeconds)}`, `build finished at ${min(t.builtSeconds)}`].filter(Boolean).join(', ')}.`;
}
try { writeFileSync(join(review, 'blockers.txt'), fullLog.join('\n') + '\n'); } catch {}
if (blockers && !all) for (const line of shortBlockers(items, {total: blockers, full: join(review, 'blockers.txt')})) console.log(line);
else if (!all) console.log(fullLog.join('\n'));
if (blockers) {
  const last = history[history.length - 1];
  if (last && !last.critic && fingerprint && last.hash === fingerprint) {
    console.log(`\nFAIL: ${blockers} blocker(s), and the page has not changed since round ${last.round}. Fix the blockers above before running check.mjs again; this run was not counted.`);
    process.exit(1);
  }
  history.push({round, blockers, critic: null, hash: fingerprint});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  console.log(`\nFAIL round ${round}: ${blockers} blocker(s). Fix every one, in the order above, then run check.mjs again${studio ? '. The critic runs once the board is clean; board rounds do not use up critic rounds' : ` once.${round >= 2 ? ' That was the second round: report what is left instead of a third.' : ''}${stampBuilt()}`}`);
  process.exit(1);
}

// The default path ends here: every mechanical check is clean and no model is asked for a score.
if (!studio) {
  history.push({round, blockers: 0, critic: null, hash: fingerprint, mechanical: true});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  const times = stampBuilt();
  console.log(`\nCHECKS PASS round ${round}: 0 blockers. No model scored this page: the person who picked the direction is the judge. Show it to them and report "checks pass, not scored".${times} For a blind critic's score, run check.mjs again with --studio.`);
  process.exit(0);
}

// Quick mode's critic rounds are spent: later edits get a board check only, and the report quotes the final critic round.
if (quick && stoppedAt) {
  const n = history.filter(h => h.critic).pop()?.critic?.overall;
  history.push({round, blockers: 0, critic: null, hash: fingerprint, stop: 'quick mode: verified board after fixes'});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  console.log(`\nQUICK verified: 0 blockers after the last edits. Deliver now and report the critic's ${n}/10 (${level(n)}) from round ${stoppedAt.round}, the final critic round; run --mode polish for more critic rounds.`);
  process.exit(n >= leader ? 0 : 3);
}

const out = join(review, `critic-${round}.json`);
const runAsync = (args) => new Promise((resolveRun) => {
  const child = spawn('node', args, {stdio: ['ignore', 'pipe', 'pipe']});
  let stdout = '', stderr = '';
  child.stdout.on('data', d => { stdout += d; }); child.stderr.on('data', d => { stderr += d; });
  child.on('close', (status, signal) => resolveRun({status, signal, stdout, stderr}));
  runAsync.children.push(child);
});
runAsync.children = [];
const priorCritic = history.filter(h => h.critic && !h.reusedCritic).length;
const motionDir = mkdtempSync(join(review, `motion-${round}-`));
const lastMotion = completedReviews().filter(h => h.motionEvidence).map(h => join(dir, h.motionEvidence, 'motion.json')).filter(existsSync).pop();
const motionArgs = native
  ? [join(here, 'motion_video.mjs'), '--video', video, '--out', motionDir, ...(flag('brief') ? ['--brief', flag('brief')] : []), ...(pw ? ['--playwright', pw] : [])]
  : [join(here, 'motion_judge.mjs'), target, '--out', motionDir, ...(lastMotion ? ['--prev', lastMotion] : []), ...(flag('brief') ? ['--brief', flag('brief')] : []), ...(pw ? ['--playwright', pw] : [])];
// Reuse: when the code changed but the rendered board and first screen are pixel-identical to a scored round, that
// round's verdict still describes exactly what the critic would see, so it is reused and does not use up a critic
// round. An unchanged project still gets fresh judging, and motion always gets fresh evidence.
const boardHash = existsSync(join(review, 'board.png')) && existsSync(join(review, 'first.png'))
  ? createHash('sha256').update(readFileSync(join(review, 'board.png'))).update(readFileSync(join(review, 'first.png'))).digest('hex') : null;
const sameBoard = boardHash && fingerprint && history.filter(h => h.critic && h.boardHash === boardHash && h.hash !== fingerprint && h.criticFile && existsSync(join(dir, h.criticFile))).pop();
const startMotion = () => runAsync(motionArgs);
// The motion judge makes its own model calls; run alongside the critics, all three hit rate limits and it failed every
// round, so it starts after them.
let motionRun = null;
// Craft at 100%: the detail critic reviews each section at full size while the main critic judges the board.
const detailOut = join(review, 'detail.json');
const detailRun = native ? null : runAsync([join(here, 'detail_critic.mjs'), target, '--out', detailOut, ...(existsSync(patternFile) ? ['--patterns', patternFile] : []), ...(pw ? ['--playwright', pw] : [])]);
// Page choreography: the board is a still, so a third critic films the entrance and a scroll and judges how the page moves.
const choreoOut = join(review, 'choreography.json');
// App screens have interface motion, not page entrances; the choreography critic is calibrated for pages.
const choreoRun = native || appSurface ? null : runAsync([join(here, 'choreography.mjs'), target, '--out', choreoOut, ...(existsSync(patternFile) ? ['--patterns', patternFile] : []), ...(existsSync(join(dir, 'identity.md')) ? ['--identity', join(dir, 'identity.md')] : []), ...(pw ? ['--playwright', pw] : [])]);
// The critic also sees the page while scrolling, paired with the named site when patterns.md gives its address.
const scrollOut = join(review, 'scroll.png');
let scrollArgs = [];
if (!native && !sameBoard) {
  const strip = spawnSync(process.execPath, [join(here, 'scroll_strip.mjs'), target, '--out', scrollOut, ...(refUrl ? ['--ref', refUrl] : []), ...(pw ? ['--playwright', pw] : [])], {encoding: 'utf8', timeout: 240000});
  if (strip.status === 0 && existsSync(scrollOut)) {
    scrollArgs = ['--scroll', scrollOut, ...(existsSync(scrollOut.replace(/\.png$/, '-phone.png')) ? ['--scroll-phone', scrollOut.replace(/\.png$/, '-phone.png')] : []), ...(/paired with/.test(strip.stdout) ? ['--scroll-paired'] : [])];
    process.stdout.write(strip.stdout);
  } else console.log('Scroll strip did not render; the critic judges stills only this round.');
}
const critic = sameBoard
  ? (copyFileSync(join(dir, sameBoard.criticFile), out), {status: 0, stdout: `Board unchanged since round ${sameBoard.round}: reusing its critic verdict (${sameBoard.critic.overall}/10). Change what the page shows before the next round.\n`, stderr: ''})
  : (existsSync(join(dir, 'identity.html')) && spawnSync(process.execPath, [join(here, 'render_page.mjs'), join(dir, 'identity.html'), join(review, 'identity.png'), ...(pw ? ['--playwright', pw] : [])], {stdio: 'ignore'}),
    await runAsync([join(here, 'critic.mjs'), '--board', join(review, 'board.png'), '--first', join(review, 'first.png'), ...(existsSync(join(review, 'identity.png')) ? ['--identity', join(review, 'identity.png')] : []),
  '--out', out, ...scrollArgs, ...(flag('brief') ? ['--brief', flag('brief')] : []), ...(levelText ? ['--level', levelFile] : []), ...(levelImages.length ? ['--level-refs', levelImages.join(',')] : []), ...(refs ? ['--refs', refs] : []), ...(existsSync(join(dir, 'refs', 'kept.md')) ? ['--kept', join(dir, 'refs', 'kept.md')] : []), ...(existsSync(join(dir, 'decisions.md')) ? ['--decisions', join(dir, 'decisions.md')] : []), ...(existsSync(join(dir, 'refs', 'patterns.md')) ? ['--patterns', join(dir, 'refs', 'patterns.md')] : [])]));
process.stdout.write(critic.stdout);
if (critic.status !== 0) { for (const c of runAsync.children) try { c.kill(); } catch {} process.stderr.write(critic.stderr); console.log('\nThe critic did not run. Fix the cause above and rerun; do not substitute your own review.'); process.exit(critic.status === 2 ? 2 : 1); }
const verdict = JSON.parse(readFileSync(out, 'utf8'));
let craft = null;
if (detailRun) {
  const d = await detailRun;
  if (d.status === 0 && existsSync(detailOut)) { process.stdout.write('\n' + d.stdout); craft = JSON.parse(readFileSync(detailOut, 'utf8')).craft; }
  else console.log('\nDetail critic did not run; craft at full size is unverified this round.');
}
let choreo = null;
if (choreoRun) {
  const c = await choreoRun;
  if (c.status === 0 && existsSync(choreoOut)) { process.stdout.write('\n' + c.stdout); choreo = JSON.parse(readFileSync(choreoOut, 'utf8')).choreography; }
  else console.log('\nChoreography critic did not run; page motion is unverified this round.');
}
// The page has to hold up beside the references it kept, not only score well in general.
const impact = Number.isFinite(verdict.scores.impact) ? verdict.scores.impact : null;
const execution = Number.isFinite(verdict.scores.execution) ? verdict.scores.execution : null;
const referenceFit = verdict.scores.reference_fit ?? null, copied = String(verdict.copies_reference || '').trim(), designMet = verdict.scores.overall >= goal && (impact === null || impact >= 8) && (execution === null || execution >= 8) && (referenceFit === null || referenceFit >= (named ? 8 : 7)) && !copied && (quick || craft === null || craft >= 8) && (quick || choreo === null || choreo >= 8.5);
if (craft !== null && craft < 8) console.log(quick ? `\nCraft ${craft}/10 at full size (advice in quick mode): apply the detail fixes that do not flatten the identity; never trade the identity's scale or device for tidiness.` : `\nCraft ${craft}/10 at full size: apply the detail fixes above too; a page does not pass below 8 on craft.`);
if (choreo !== null && choreo < 8.5) console.log(`\nChoreography ${choreo}/10: apply the choreography fixes above${quick ? ' in this round, the scenes first' : '; a page does not pass below 8.5 on choreography'}. Build the held scenes and the entrance sequence; a uniform fade-up on every block is not choreography.${quick ? ` Then confirm with \`node ${join(here, 'choreography.mjs')} <url> --identity ${join(dir, 'identity.md')}\` (about a minute) and fix again once if scenes still score under 8.` : ''}`);
if (impact !== null && impact < 8) console.log(`\nImpact ${impact}/10: the page is correct but would not stop a scroller${levelText || levelImages.length ? ' at the level reference\'s strength' : ''}. Apply the impact fixes first: a larger subject composed into the layout, the product at real scale beside it, a committed color field. A page does not pass below 8 on impact.`);
if (execution !== null && execution < 8) console.log(`\nExecution ${execution}/10: the idea is there and the finish is not. Build, in this order: the material at real size (for a product, the view as a whole app: chrome, metric cards that each carry their own mini visual, a second chart form in the one hue, a selected state; for any other page, the work, goods or place itself shown large and art-directed), image and layout meeting in depth, one moment in every section down to the footer on one grid, then logos as marks and a two-line headline. A page does not pass below 8 on execution.`);
if (unattended) console.log(`\nUnattended run (${unattended}): no person approved these screens. Report them as not approved.`);
const clarity = Number.isFinite(verdict.scores.clarity) ? verdict.scores.clarity : null;
if (clarity !== null && clarity < 8) console.log(`\nClarity ${clarity}/10: fix every chart and product view listed under "Unclear at a glance" before anything else: a value axis with tick labels and units, gridlines, a legend for more than one series, the state (now, past, planned), labels clear of the lines, and real app chrome with believable data around each product view.`);
if (copied) console.log(`\nCopied reference: the critic found a section that reproduces ${copied} nearly unchanged. Rework it: combine the lesson with another reference or the brand idea so the page is your own.`);
if (named && referenceFit !== null && referenceFit < 8) console.log(`\nReference fit ${referenceFit}/10: a page made like a named site passes at 8. The overall score is capped at it, so bring back the missing signatures listed above before anything else.`);
else if (referenceFit !== null && referenceFit < 7) console.log(`\nReference fit ${referenceFit}/10: the page does not yet carry what it kept from its references. Apply the reference fixes above.`);
const roundExtras = {boardHash, criticFile: relative(dir, out), craft, choreography: choreo, ...(sameBoard ? {reusedCritic: true} : {})};
// Fast mode: the browser motion judge is the slowest step, so it runs once the critic passes or on the last allowed
// critic round; earlier rounds rely on the static motion scan above. PASS still requires the full motion judgment.
// Quick mode re-scores once after the fixes: a score taken before them describes a page nobody will see.
if (quick && !native) {
  const final = designMet || priorCritic + 1 >= criticCap;
  history.push({round, blockers: 0, critic: verdict.scores, motion: null, motionSkipped: true, hash: fingerprint, ...roundExtras, ...(final ? {stop: 'quick mode: final critic round'} : {})});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  const n = verdict.scores.overall, trail = history.filter(h => h.critic).map(h => h.critic.overall).join(' → ');
  if (!final) {
    console.log(`\nQUICK round ${round}: critic ${n}/10, ${level(n)}${impact !== null ? `, impact ${impact}` : ''}${execution !== null ? `, execution ${execution}` : ''} (leader level is ${leader}, pass is ${goal}). Apply the fixes above once, most visible first, then run check.mjs again: quick mode re-scores the fixed page once so the reported score is the final page's.`);
    process.exit(1);
  }
  console.log(`\nQUICK final round ${round}: critic ${n}/10, ${level(n)}${impact !== null ? `, impact ${impact}` : ''}${execution !== null ? `, execution ${execution}` : ''} (critic trail ${trail}; leader level is ${leader}, pass is ${goal}; motion checked statically, not judged in the browser). Deliver now and report this score and level. For more, run check.mjs --mode polish.`);
  process.exit(n >= leader ? 0 : 3);
}
if (fast && !native && !designMet && priorCritic + 1 < criticCap) {
  history.push({round, blockers: 0, critic: verdict.scores, motion: null, motionSkipped: true, hash: fingerprint, ...roundExtras});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  console.log(`\nFAIL round ${round}: critic ${verdict.scores.overall}/10 (target ${goal}). Motion is judged in the browser once the critic passes or on round ${criticCap} of ${criticCap}. Apply the design fixes listed above, most visible first, then run check.mjs again.`);
  process.exit(1);
}
// Motion and interaction: play the page's controls and judge the filmstrips; screenshots cannot show motion.
// Every attempt owns fresh evidence; a prior result must never satisfy a new run.
if (!motionRun) motionRun = startMotion();
let mj = await motionRun;
if (mj.status !== 0) { console.log('\nMotion judge failed once; retrying.'); mj = await startMotion(); }
process.stdout.write('\n' + mj.stdout);
let motion = null, motionError = null;
const motionPath = join(motionDir, 'motion.json');
try {
  if (!existsSync(motionPath)) motionError = 'missing motion result';
  else motion = JSON.parse(readFileSync(motionPath, 'utf8'));
} catch { motionError = 'malformed motion result'; }
const motionScore = motion?.verdict?.scores?.overall ?? null;
if (!motionError && (!Number.isFinite(motionScore) || motionScore < 0 || motionScore > 10 || !Array.isArray(motion?.violations))) {
  motionError = 'incomplete motion judgment';
}
const motionBlocks = Array.isArray(motion?.violations) ? motion.violations.length : 0;
// The web judge distinguishes a completed quality failure (exit 1) from a tool failure
// (exit 2). Require its explicit, internally consistent outcome before accepting any
// nonzero exit as evidence. Native legacy zero-exit results keep their separate contract; unmarked web results require an upgrade.
if (!motionError && !native && !Object.hasOwn(motion, 'outcome')) motionError = 'legacy web motion result lacks the complete criterion/interaction contract (target 9 per criterion); upgrade the motion judge and rerun';
let evidenceExit = mj.status === 0;
let motionFloorFailures = [], motionCoverage = null;
if (!motionError && Object.hasOwn(motion, 'outcome')) {
  if (!validMotionVerdict(motion.verdict, {annotated: true}) || !motion.violations.every(v => typeof v === 'string')) {
    motionError = 'incomplete or malformed marked motion judgment';
  }
  const acceptance = motionAcceptance(motion.verdict, motion.interactions);
  motionFloorFailures = acceptance.failures; motionCoverage = acceptance.coverage;
  if (!acceptance.complete) motionError ||= 'incomplete captured interaction coverage';
  const expected = motionScore >= 9 && !motionBlocks && !motionFloorFailures.length ? 'pass' : 'quality-fail';
  if (motion.outcome !== expected) motionError = 'inconsistent motion outcome';
  evidenceExit = motion.outcome === 'pass' ? mj.status === 0 : motion.outcome === 'quality-fail' && mj.status === 1;
}
if (!evidenceExit) motionError = `motion process exited ${mj.status ?? mj.signal ?? 'without status'}`;
if (identity.digest !== projectFingerprint().digest) motionError = 'local source changed during review';
if (motionError) {
  history.push({round, blockers: 0, critic: verdict.scores, motion: motionScore, motionViolations: motionBlocks, ...roundExtras,
    motionError, motionEvidence: relative(dir, motionDir), motionPolicy: native ? 'native-video-legacy' : MOTION_ACCEPTANCE_POLICY, motionFloorFailures, motionCoverage, hash: fingerprint});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  if (mj.stderr) process.stderr.write(mj.stderr);
  console.log(`\nUNVERIFIED round ${round}: ${motionError}. A successful, complete motion judgment is required for PASS. Fix the cause and rerun; no quality pass is recorded.`);
  process.exit(2);
}
history.push({round, blockers: 0, critic: verdict.scores, motion: motionScore, motionViolations: motionBlocks, ...roundExtras,
  motionEvidence: relative(dir, motionDir), motionPolicy: native ? 'native-video-legacy' : MOTION_ACCEPTANCE_POLICY, motionFloorFailures, motionCoverage, hash: fingerprint});
// Keep the page's code as it was when scored, so the best round can be restored after a later round scores worse.
if (!/^https?:/.test(target) && existsSync(target)) {
  const snap = join(review, `round-${round}`), root = dirname(resolve(target));
  const copy = (d, rel = '') => { for (const f of readdirSync(join(root, rel))) {
    const r = join(rel, f), st = statSync(join(root, r));
    if (st.isDirectory()) { if (!/^(\.|skills$|node_modules$)/.test(f)) copy(d, r); }
    else if (/\.(html|css|js|mjs|svg|json)$/i.test(f) && st.size < 2e6) { mkdirSync(dirname(join(d, r)), {recursive: true}); copyFileSync(join(root, r), join(d, r)); }
  } };
  try { copy(snap); } catch {}
}
writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
const trail = history.filter(h => h.critic).map(h => h.critic.overall).join(' → ');
if (designMet && !motionBlocks && !motionFloorFailures.length && motionScore >= 9) { console.log(`\nPASS round ${round}: critic ${verdict.scores.overall}/10 (target ${goal}), motion ${motionScore}/10. Scope: ${motionCoverage ? "captured interaction labels only; other components unverified" : "legacy overall-only evidence; per-criterion coverage unverified"}. Critic trail: ${trail}.`); process.exit(0); }
const scored = history.filter(h => h.critic && !h.reusedCritic && (h.motionSkipped || (Number.isFinite(h.motion) && !h.motionError))).map(h => h.critic.overall), best = Math.max(...scored, ...history.filter(h => h.reusedCritic).map(h => h.critic.overall));
// Two critic rounds without a gain end the loop: past that, rounds trade one set of small notes for another.
const stalled = scored.length >= 3 && Math.max(...scored.slice(-2)) <= Math.max(...scored.slice(0, -2));
if (motionFloorFailures.length) console.log('Below the required floor: ' + motionFloorFailures.join(' · '));
console.log(`\nFAIL round ${round}: critic ${verdict.scores.overall}/10 (target ${goal}), motion ${motionScore ?? 'not judged'}/10 (target 9)${motionBlocks ? `, ${motionBlocks} motion violation(s)` : ''}. Critic trail: ${trail}. Apply every design and motion fix listed above, most visible first, then run check.mjs again.`);
const leaderStall = polish && scored.length >= 2 && best >= leader && verdict.scores.overall <= Math.max(...scored.slice(0, -1));
if (leaderStall || stalled || scored.length >= (criticCap ?? 6)) {
  history[history.length - 1].stop = leaderStall ? 'leader level reached and no longer improving' : stalled ? 'no gain in two critic rounds' : `${criticCap ?? 'six'} critic rounds`;
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  const bestRound = completedReviews().filter(h => h.critic.overall === best).pop() || completedReviews().sort((a, b) => b.critic.overall - a.critic.overall)[0] || history.filter(h => h.critic).pop();
  console.log(`STOP: ${history[history.length - 1].stop}. The quality target was not reached. Best fully reviewed candidate: critic ${best} (${level(best)}), motion ${bestRound.motion}, round ${bestRound.round}. Its code is in ${join(review, `round-${bestRound.round}`)} (HTML, CSS and JS, not images). Report unresolved gaps; do not call this a pass or publish it as accepted.${quick || polish || existsSync(firstDirection) ? '' : ' No new direction used yet: go back to the exploration step, build the page on a different idea from idea.md, and run check.mjs with --new-direction before reporting.'}`);
  process.exit(3);
}
process.exit(1);
