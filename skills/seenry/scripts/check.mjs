#!/usr/bin/env node
/** The finishing gate. One command per round:
 *
 *  node check.mjs <url | file.html> --brief BRIEF.md [--refs a.png,b.png] [--dir .seenry] [--target 9] [--mode quick|polish|showcase] [--critic-rounds n] [--fast] [--playwright path]
 *  node check.mjs --screens home.png,detail.png,sheet.png --video rec.mov --brief BRIEF.md   (native apps: SwiftUI,
 *    UIKit, React Native, Flutter; simulator screenshots in flow order and a screen recording of the interactions)
 *
 *  1. Renders the page with review_board.mjs. Any slop or craft blocker fails the round before a critic is asked.
 *  2. With zero blockers, runs critic.mjs: a fresh model scores the page against the reference screens.
 *  3. Prints PASS when the critic's overall reaches --target (default 9: a local heuristic, not evidence of outperforming another product), else FAIL with the fixes to apply.
 *  Rounds are numbered; every critic result is kept as <dir>/review/critic-N.json and summarized in check.json. */
import {existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, statSync, lstatSync, copyFileSync, rmSync, renameSync} from 'node:fs';
import {resolve, join, dirname, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {recordIdentity} from './history.mjs';
import {validMotionVerdict, motionAcceptance, MOTION_ACCEPTANCE_POLICY} from './motion_contract.mjs';
import {markWorkDir} from './workdir.mjs';

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
let refs = flag('refs');
// The critic's bar is the leaders' home-page first screens from research.mjs, never the builder's own picks: section
// crops and motion frames made a weak, noisy bar that scored America.gov itself 5/10.
const pickFrom = d => existsSync(d) ? readdirSync(d).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).slice(0, 3).map(f => join(d, f)).join(',') : '';
if (!refs) refs = pickFrom(join(dir, 'research', 'bar')) || pickFrom(join(dir, 'refs'));
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
    join(dir, 'research', 'pack.md'), join(dir, 'explore', 'pick.json'), ...(refs || '').split(',')].filter(Boolean)) {
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
// --mode quick (the skill's default): one critic round, static motion scan, deliver with the score. polish: up to four
// critic rounds, stopping at leader level. showcase: the full gate with a second direction. The target is 9 in all modes.
const mode = flag('mode', args.includes('--fast') ? 'fast' : 'showcase');
const quick = mode === 'quick', polish = mode === 'polish';
const fast = mode === 'fast' || quick || polish;
const leader = 8, level = n => n >= goal ? 'pass' : n >= leader ? 'leader level' : 'below leader level';
const criticCap = Number(flag('critic-rounds', 0)) || (quick ? 1 : polish ? 4 : mode === 'fast' ? 3 : null);
if ((criticRounds >= (criticCap ?? 8) || round > 20) && !history.some(h => h.stop)) {
  history[history.length - 1].stop = criticRounds >= (criticCap ?? 8) ? `${criticCap ?? 'eight'} critic rounds` : 'twenty rounds';
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
}
if (quick && history.filter(h => h.critic && !h.reusedCritic).length >= 2) {
  const n = history.filter(h => h.critic).pop().critic.overall;
  console.log(`QUICK done: the critic has seen this page twice (last ${n}/10, ${level(n)}). Deliver now and report the score and level; run --mode polish if the person wants more.`);
  process.exit(n >= leader ? 0 : 3);
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
const quietRegister = existsSync(join(dir, 'identity.md')) && /register[^\n]{0,40}quiet|quiet premium/i.test(readFileSync(join(dir, 'identity.md'), 'utf8'));
const briefText = flag('brief') && existsSync(flag('brief')) ? readFileSync(flag('brief'), 'utf8') : '';
const software = /\b(saas|software|app|apps|platform|tool|dashboard|api|sdk|plugin|extension|workspace|subscription)\b/i.test(briefText);
// A named reference's own patterns (chapter numbers, a serif accent, pill tags) are allowed when the pattern map lists them.
const patternFile = join(dir, 'refs', 'patterns.md');
const allowed = existsSync(patternFile) ? ((readFileSync(patternFile, 'utf8').match(/^Allow:\s*(.+)$/mi) || [])[1] || '').trim() : '';
const boardArgs = [join(here, 'review_board.mjs'), target, '--out', review, '--studio', ...(allowed ? ['--allow', allowed] : []), ...(quietRegister ? ['--quiet'] : []), ...(software ? ['--software'] : []), ...(refs ? ['--refs', refs] : []), ...(pw ? ['--playwright', pw] : [])];
// Native apps have no DOM to inspect: their screenshots are laid out as the board and the critic and motion judge do the review.
const board = native
  ? spawnSync('node', [join(here, 'screens.mjs'), '--screens', native, '--out', review, ...(refs ? ['--refs', refs] : []), ...(pw ? ['--playwright', pw] : [])], {encoding: 'utf8'})
  : spawnSync('node', boardArgs, {encoding: 'utf8'});
process.stdout.write(board.stdout);
if (board.status === 2) { process.stderr.write(board.stderr); process.exit(2); }
let blockers = native ? 0 : JSON.parse(readFileSync(join(review, 'board.json'), 'utf8')).blockers;
// The studio steps must have happened: research, references, a motion spec and the design record.
const project = !/^https?:/.test(target) && existsSync(target) ? dirname(resolve(target)) : process.cwd();
const refCount = existsSync(join(dir, 'refs')) ? readdirSync(join(dir, 'refs')).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).length : 0;
const motionSpec = join(dir, 'motion.md'), design = join(project, 'DESIGN.md');
// Remember this project's identity so the next one can differ from it (the skill reads the last ten).
try { recordIdentity(dir, project); } catch {}
// A named site is the identity (references/named-site.md): its pattern map replaces the three boards.
const named = existsSync(join(dir, 'refs', 'patterns.md'));
const missing = [
  !existsSync(join(dir, 'research', 'pack.md')) && `research pack: run node ${join(here, 'research.mjs')} --type <type> --terms "<words>" (or research by hand with the Seenry MCP tools and write ${join(dir, 'research', 'pack.md')})`,
  refCount < 2 && `references: copy at least 2 (ideally 3) first screens from the pack into ${join(dir, 'refs')}/`,
  refCount >= 2 && !existsSync(join(dir, 'refs', 'kept.md')) && `references: write ${join(dir, 'refs', 'kept.md')} with one decision card per kept reference: its file, the job and decision it makes, its measured numbers, what you take and how you transform it`,
  (!existsSync(motionSpec) || readFileSync(motionSpec, 'utf8').length < 400) && `motion spec: write ${motionSpec} from the 2 studied motion references (trigger, property, duration, easing, stagger, interruption, reduced motion, source)`,
  (!existsSync(design) || !/brand guidelines/i.test(readFileSync(design, 'utf8'))) && `design record: ${design} with a "Brand guidelines" section and why each reference was chosen`,
  !native && !named && !existsSync(join(dir, 'explore', 'pick.json')) && `exploration: build three identity boards in ${join(dir, 'explore')}/ (a.html, b.html, c.html) and run node ${join(here, 'pick.mjs')} on them`,
  !native && (!existsSync(join(dir, 'identity.md')) || readFileSync(join(dir, 'identity.md'), 'utf8').length < 500 || (!named && !existsSync(join(dir, 'identity.html')))) && `identity: write ${join(dir, 'identity.md')} (truth, visual idea, type voice, color world, graphic device, image treatment, voice line, motion behavior) and render it as ${join(dir, 'identity.html')}, following references/identity.md`,
  (!existsSync(join(dir, 'idea.md')) || readFileSync(join(dir, 'idea.md'), 'utf8').length < 600) && `idea: write ${join(dir, 'idea.md')} following references/design-thinking.md (claim, proof, moment, material, five candidate ideas with scores, the chosen idea and where it shows)`,
  native && !video && 'motion recording: record the interactions (xcrun simctl io booted recordVideo rec.mov, or adb shell screenrecord) and pass --video rec.mov',
  !native && !/^https?:/.test(target) && existsSync(target) && !/data-seenry-signature/.test(readFileSync(target, 'utf8')) && 'signature moment: add one crafted signature component (see references/building.md) and mark its root element with data-seenry-signature="<name>"',
].filter(Boolean);
if (missing.length) {
  blockers += missing.length;
  console.log(`\n■ studio steps missing ×${missing.length}`);
  for (const m of missing) console.log(`  ${m}`);
}
// Photographs must pass photo_check.mjs before the critic is asked; weak imagery is the most-cited gap.
if (!/^https?:/.test(target) && existsSync(target)) {
  const html = readFileSync(target, 'utf8');
  const photos = [...new Set([...html.matchAll(/(?:src|href|url\()\s*=?\s*["']?([^"')\s>]+\.(?:png|jpe?g|webp|avif))/gi)].map(m => m[1]).filter(u => !/^(https?:|data:)/.test(u)))];
  const report = join(review, 'photos.json');
  const checks = history.filter(h => h.photoChecked).length;
  const data = existsSync(report) ? JSON.parse(readFileSync(report, 'utf8')) : null;
  // Quick mode keeps any usable image (6+); regenerating 7s doubled run time for no visible gain. Polish and showcase hold 8.
  const photoFloor = quick ? 6 : 8;
  const passed = data && data.images.every(i => i.overall >= photoFloor);
  if (data && history.length && !history[history.length - 1].photoChecked) history[history.length - 1].photoChecked = true;
  if (photos.length && data && !passed && checks >= (quick || polish ? 1 : 3)) {
    console.log(`\n■ photographs  best effort after ${quick || polish ? 'one photo check' : 'three photo checks'} (${data.images.map(i => i.overall).join('/')}); not blocking. Keep the strongest versions and move on.`);
  } else if (photos.length && !passed) {
    blockers++;
    console.log(`\n■ photographs  ${photos.length} local image(s) not yet passed by the photo check: ${photos.slice(0, 4).join(', ')}`);
    console.log(`  Run: node ${join(here, 'photo_check.mjs')} ${photos.slice(0, 6).join(' ')} --use "<slot, ratio, position>" --brand "<brand>" [--medium "<image medium from identity.md, e.g. oil painting>"]${refs ? ' --refs ' + refs : ''} --out ${report}`);
    console.log(quick ? '  Regenerate only images under 6 (wrong subject, text, broken anatomy), once, with the prompt it writes; keep everything at 6 or above.' : '  Regenerate anything under 8 with the prompt it writes (at most three attempts per image), then run check.mjs again.');
  }
}
// Static motion scan: token, easing, transition-all and reduced-motion checks from source, in well under a second.
const scanReport = join(review, 'motion-scan.json');
if (!native && existsSync(join(here, 'motion_scan.mjs'))) {
  rmSync(scanReport, {force: true});
  const scan = spawnSync('node', [join(here, 'motion_scan.mjs'), project, '--json', scanReport], {encoding: 'utf8'});
  if (scan.status === 1 && existsSync(scanReport)) {
    const n = JSON.parse(readFileSync(scanReport, 'utf8')).violations;
    blockers += n;
    console.log('\n■ ' + scan.stdout.trim().split('\n').join('\n  '));
  } else if (scan.stdout) console.log('\n' + scan.stdout.trim().split('\n').slice(0, 6).join('\n  '));
}
// Token lint: every size, space, radius and duration from the token file, never typed one at a time.
if (!native && existsSync(join(here, 'token_lint.mjs'))) {
  const lint = spawnSync('node', [join(here, 'token_lint.mjs'), project, ...(args.includes('--changed') ? ['--changed'] : [])], {encoding: 'utf8'});
  if (lint.status === 1) { blockers++; console.log('\n■ ' + lint.stdout.trim().split('\n').join('\n  ')); }
}
if (blockers) {
  const last = history[history.length - 1];
  if (last && !last.critic && fingerprint && last.hash === fingerprint) {
    console.log(`\nFAIL: ${blockers} blocker(s), and the page has not changed since round ${last.round}. Fix the blockers above before running check.mjs again; this run was not counted.`);
    process.exit(1);
  }
  history.push({round, blockers, critic: null, hash: fingerprint});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  console.log(`\nFAIL round ${round}: ${blockers} blocker(s). Fix every one above, then run check.mjs again. The critic runs once the board is clean; board rounds do not use up critic rounds.`);
  process.exit(1);
}

// Quick mode's one critic round is spent: after the fixes are applied, re-check the board only and report the last
// critic score, rather than paying for a second critic call that quick mode would not act on anyway.
if (quick && stoppedAt) {
  const n = history.filter(h => h.critic).pop()?.critic?.overall;
  history.push({round, blockers: 0, critic: null, hash: fingerprint, stop: 'quick mode: verified board after fixes'});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  console.log(`\nQUICK verified: 0 blockers after the fixes. Deliver now and report the critic's ${n}/10 (${level(n)}) from round ${stoppedAt.round}; run --mode polish for another critic round.`);
  process.exit(n >= leader ? 0 : 3);
}

const out = join(review, `critic-${round}.json`);
// The critic and the motion judge are independent, so when this round will judge motion anyway they run together.
const runAsync = (args) => new Promise((resolveRun) => {
  const child = spawn('node', args, {stdio: ['ignore', 'pipe', 'pipe']});
  let stdout = '', stderr = '';
  child.stdout.on('data', d => { stdout += d; }); child.stderr.on('data', d => { stderr += d; });
  child.on('close', (status, signal) => resolveRun({status, signal, stdout, stderr}));
  runAsync.children.push(child);
});
runAsync.children = [];
const priorCritic = history.filter(h => h.critic && !h.reusedCritic).length;
const motionPlanned = !quick && (native || !fast || priorCritic + 1 >= criticCap);
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
let motionRun = motionPlanned ? startMotion() : null;
// Craft at 100%: the detail critic reviews each section at full size while the main critic judges the board.
const detailOut = join(review, 'detail.json');
const detailRun = native ? null : runAsync([join(here, 'detail_critic.mjs'), target, '--out', detailOut, ...(pw ? ['--playwright', pw] : [])]);
// Page choreography: the board is a still, so a third critic films the entrance and a scroll and judges how the page moves.
const choreoOut = join(review, 'choreography.json');
const choreoRun = native ? null : runAsync([join(here, 'choreography.mjs'), target, '--out', choreoOut, ...(existsSync(join(dir, 'identity.md')) ? ['--identity', join(dir, 'identity.md')] : []), ...(pw ? ['--playwright', pw] : [])]);
const critic = sameBoard
  ? (copyFileSync(join(dir, sameBoard.criticFile), out), {status: 0, stdout: `Board unchanged since round ${sameBoard.round}: reusing its critic verdict (${sameBoard.critic.overall}/10). Change what the page shows before the next round.\n`, stderr: ''})
  : (existsSync(join(dir, 'identity.html')) && spawnSync(process.execPath, [join(here, 'render_page.mjs'), join(dir, 'identity.html'), join(review, 'identity.png'), ...(pw ? ['--playwright', pw] : [])], {stdio: 'ignore'}),
    await runAsync([join(here, 'critic.mjs'), '--board', join(review, 'board.png'), '--first', join(review, 'first.png'), ...(existsSync(join(review, 'identity.png')) ? ['--identity', join(review, 'identity.png')] : []),
  '--out', out, ...(flag('brief') ? ['--brief', flag('brief')] : []), ...(refs ? ['--refs', refs] : []), ...(existsSync(join(dir, 'refs', 'kept.md')) ? ['--kept', join(dir, 'refs', 'kept.md')] : []), ...(existsSync(join(dir, 'refs', 'patterns.md')) ? ['--patterns', join(dir, 'refs', 'patterns.md')] : [])]));
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
const referenceFit = verdict.scores.reference_fit ?? null, copied = String(verdict.copies_reference || '').trim(), designMet = verdict.scores.overall >= goal && (referenceFit === null || referenceFit >= 7) && !copied && (quick || craft === null || craft >= 8) && (quick || choreo === null || choreo >= 8.5);
if (craft !== null && craft < 8) console.log(quick ? `\nCraft ${craft}/10 at full size (advice in quick mode): apply the detail fixes that do not flatten the identity; never trade the identity's scale or device for tidiness.` : `\nCraft ${craft}/10 at full size: apply the detail fixes above too; a page does not pass below 8 on craft.`);
if (choreo !== null && choreo < 8.5) console.log(`\nChoreography ${choreo}/10: apply the choreography fixes above${quick ? ' in this round, the scenes first' : '; a page does not pass below 8.5 on choreography'}. Build the held scenes and the entrance sequence; a uniform fade-up on every block is not choreography.${quick ? ` Then confirm with \`node ${join(here, 'choreography.mjs')} <url> --identity ${join(dir, 'identity.md')}\` (about a minute) and fix again once if scenes still score under 8.` : ''}`);
if (copied) console.log(`\nCopied reference: the critic found a section that reproduces ${copied} nearly unchanged. Rework it: combine the lesson with another reference or the brand idea so the page is your own.`);
if (referenceFit !== null && referenceFit < 7) console.log(`\nReference fit ${referenceFit}/10: the page does not yet carry what it kept from its references. Apply the reference fixes above.`);
const roundExtras = {boardHash, criticFile: relative(dir, out), craft, choreography: choreo, ...(sameBoard ? {reusedCritic: true} : {})};
// Fast mode: the browser motion judge is the slowest step, so it runs once the critic passes or on the last allowed
// critic round; earlier rounds rely on the static motion scan above. PASS still requires the full motion judgment.
if (quick && !native) {
  history.push({round, blockers: 0, critic: verdict.scores, motion: null, motionSkipped: true, hash: fingerprint, ...roundExtras, stop: 'quick mode: one critic round'});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  const n = verdict.scores.overall;
  console.log(`\nQUICK round ${round}: critic ${n}/10, ${level(n)} (leader level is ${leader}, pass is ${goal}; motion checked statically, not judged in the browser). Apply the fixes above once, most visible first, then deliver and report this score and level. For more, run check.mjs --mode polish.`);
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
const mj = await motionRun;
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
const stalled = scored.length >= 3 && Math.max(...scored.slice(-2)) <= Math.max(...scored.slice(0, -2));
if (motionFloorFailures.length) console.log('Below the required floor: ' + motionFloorFailures.join(' · '));
console.log(`\nFAIL round ${round}: critic ${verdict.scores.overall}/10 (target ${goal}), motion ${motionScore ?? 'not judged'}/10 (target 9)${motionBlocks ? `, ${motionBlocks} motion violation(s)` : ''}. Critic trail: ${trail}. Apply every design and motion fix listed above, most visible first, then run check.mjs again.`);
if (stalled && !history.some(h => h.rootChange) && !(polish && best >= leader)) {
  history[history.length - 1].rootChange = true;
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  console.log(`LAST ROUND: the critic has not improved for two rounds (best ${best}). Make one root-level change to the weakest dimension (type scale and weights, palette, or imagery), then run check.mjs one final time.`);
  process.exit(1);
}
const leaderStall = polish && scored.length >= 2 && best >= leader && verdict.scores.overall <= Math.max(...scored.slice(0, -1));
if (leaderStall || stalled || scored.length >= (criticCap ?? 6)) {
  history[history.length - 1].stop = leaderStall ? 'leader level reached and no longer improving' : stalled ? 'no improvement after a root-level change' : `${criticCap ?? 'six'} critic rounds`;
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  const bestRound = completedReviews().filter(h => h.critic.overall === best).pop() || completedReviews().sort((a, b) => b.critic.overall - a.critic.overall)[0] || history.filter(h => h.critic).pop();
  console.log(`STOP: ${history[history.length - 1].stop}. The quality target was not reached. Best fully reviewed candidate: critic ${best} (${level(best)}), motion ${bestRound.motion}, round ${bestRound.round}. Its code is in ${join(review, `round-${bestRound.round}`)} (HTML, CSS and JS, not images). Report unresolved gaps; do not call this a pass or publish it as accepted.${quick || polish || existsSync(firstDirection) ? '' : ' No new direction used yet: go back to the exploration step, build the page on a different idea from idea.md, and run check.mjs with --new-direction before reporting.'}`);
  process.exit(3);
}
process.exit(1);
