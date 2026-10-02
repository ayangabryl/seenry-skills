#!/usr/bin/env node
/** The finishing gate. One command per round:
 *
 *  node check.mjs <url | file.html> --brief BRIEF.md [--refs a.png,b.png] [--dir .seenry] [--target 9] [--playwright path]
 *  node check.mjs --screens home.png,detail.png,sheet.png --video rec.mov --brief BRIEF.md   (native apps: SwiftUI,
 *    UIKit, React Native, Flutter; simulator screenshots in flow order and a screen recording of the interactions)
 *
 *  1. Renders the page with review_board.mjs. Any slop or craft blocker fails the round before a critic is asked.
 *  2. With zero blockers, runs critic.mjs: a fresh model scores the page against the reference screens.
 *  3. Prints PASS when the critic's overall reaches --target (default 9: Stripe's own home page scores 7-8 on this critic, so 9 means beating the big-company bar), else FAIL with the fixes to apply.
 *  Rounds are numbered; every critic result is kept as <dir>/review/critic-N.json and summarized in check.json. */
import {existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, statSync, lstatSync, copyFileSync} from 'node:fs';
import {resolve, join, dirname, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const native = flag('screens'), video = flag('video');
const target = native ? null : args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!target && !native) { console.error('Usage: node check.mjs <url | file.html> --brief BRIEF.md [--refs a.png,b.png]'); process.exit(2); }
const dir = resolve(flag('dir', '.seenry')), review = join(dir, 'review');
const goal = Number(flag('target', '9'));
mkdirSync(review, {recursive: true});
let refs = flag('refs');
// The critic's bar is the leaders' home-page first screens from research.mjs, never the builder's own picks: section
// crops and motion frames made a weak, noisy bar that scored America.gov itself 5/10.
const pickFrom = d => existsSync(d) ? readdirSync(d).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).slice(0, 3).map(f => join(d, f)).join(',') : '';
if (!refs) refs = pickFrom(join(dir, 'research', 'bar')) || pickFrom(join(dir, 'refs'));
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
  for (const p of [flag('brief'), join(root, 'DESIGN.md'), join(dir, 'idea.md'), join(dir, 'motion.md'),
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
const checkedVersions = new Set(completedReviews().map(h => h.hash).filter(Boolean));
// Only critic rounds count toward the budget: board fixes are cheap and must never eat the rounds of design feedback.
const criticRounds = history.filter(h => h.critic).length;
if ((criticRounds >= 8 || round > 20) && !history.some(h => h.stop)) {
  history[history.length - 1].stop = criticRounds >= 8 ? 'eight critic rounds' : 'twenty rounds';
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
}
const stoppedAt = history.find(h => h.stop);
if (stoppedAt && (!fingerprint || !checkedVersions.has(fingerprint))) {
  console.log(`The current version changed or cannot be matched to the last checked round (${stoppedAt.round}). Running one verification round before you report.`);
} else if (stoppedAt) {
  const best = completedReviews().sort((a, b) => b.critic.overall - a.critic.overall)[0];
  console.log(`STOPPED at round ${stoppedAt.round}: ${stoppedAt.stop}. No new PASS is recorded. Best fully reviewed candidate: ${best ? `round ${best.round}, critic ${best.critic.overall}, motion ${best.motion}` : 'none'}. Report remaining quality gaps; a stopping budget is not acceptance.`);
  process.exit(3);
}

const pw = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
const boardArgs = [join(here, 'review_board.mjs'), target, '--out', review, ...(refs ? ['--refs', refs] : []), ...(pw ? ['--playwright', pw] : [])];
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
const missing = [
  !existsSync(join(dir, 'research', 'pack.md')) && `research pack: run node ${join(here, 'research.mjs')} --type <type> --terms "<words>" (or research by hand with the Seenry MCP tools and write ${join(dir, 'research', 'pack.md')})`,
  refCount < 2 && `references: copy at least 2 (ideally 3) first screens from the pack into ${join(dir, 'refs')}/`,
  (!existsSync(motionSpec) || readFileSync(motionSpec, 'utf8').length < 400) && `motion spec: write ${motionSpec} from the 2 studied motion references (trigger, property, duration, easing, stagger, interruption, reduced motion, source)`,
  (!existsSync(design) || !/brand guidelines/i.test(readFileSync(design, 'utf8'))) && `design record: ${design} with a "Brand guidelines" section and why each reference was chosen`,
  !native && !existsSync(join(dir, 'explore', 'pick.json')) && `exploration: build three first-screen compositions in ${join(dir, 'explore')}/ and run node ${join(here, 'pick.mjs')} on them`,
  (!existsSync(join(dir, 'idea.md')) || readFileSync(join(dir, 'idea.md'), 'utf8').length < 600) && `idea: write ${join(dir, 'idea.md')} following references/design-thinking.md (claim, proof, moment, material, five candidate ideas with scores, the chosen idea and where it shows)`,
  native && !video && 'motion recording: record the interactions (xcrun simctl io booted recordVideo rec.mov, or adb shell screenrecord) and pass --video rec.mov',
  !native && !/^https?:/.test(target) && existsSync(target) && !/data-seenry-signature/.test(readFileSync(target, 'utf8')) && 'signature moment: add one crafted signature component (see SKILL.md) and mark its root element with data-seenry-signature="<name>"',
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
  const passed = data && data.images.every(i => i.overall >= 8);
  if (data && history.length && !history[history.length - 1].photoChecked) history[history.length - 1].photoChecked = true;
  if (photos.length && data && !passed && checks >= 3) {
    console.log(`\n■ photographs  best effort after three photo checks (${data.images.map(i => i.overall).join('/')}); not blocking. Keep the strongest versions and move on.`);
  } else if (photos.length && !passed) {
    blockers++;
    console.log(`\n■ photographs  ${photos.length} local image(s) not yet passed by the photo check: ${photos.slice(0, 4).join(', ')}`);
    console.log(`  Run: node ${join(here, 'photo_check.mjs')} ${photos.slice(0, 6).join(' ')} --use "<slot, ratio, position>" --brand "<brand>"${refs ? ' --refs ' + refs : ''} --out ${report}`);
    console.log('  Regenerate anything under 8 with the prompt it writes (at most three attempts per image), then run check.mjs again.');
  }
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

const out = join(review, `critic-${round}.json`);
const critic = spawnSync('node', [join(here, 'critic.mjs'), '--board', join(review, 'board.png'), '--first', join(review, 'first.png'),
  '--out', out, ...(flag('brief') ? ['--brief', flag('brief')] : []), ...(refs ? ['--refs', refs] : [])], {encoding: 'utf8'});
process.stdout.write(critic.stdout);
if (critic.status !== 0) { process.stderr.write(critic.stderr); console.log('\nThe critic did not run. Fix the cause above and rerun; do not substitute your own review.'); process.exit(critic.status === 2 ? 2 : 1); }
const verdict = JSON.parse(readFileSync(out, 'utf8'));
// Motion and interaction: play the page's controls and judge the filmstrips; screenshots cannot show motion.
// Every attempt owns fresh evidence; a prior result must never satisfy a new run.
const motionDir = mkdtempSync(join(review, `motion-${round}-`));
const lastMotion = completedReviews().filter(h => h.motionEvidence).map(h => join(dir, h.motionEvidence, 'motion.json')).filter(existsSync).pop();
const mj = native
  ? spawnSync('node', [join(here, 'motion_video.mjs'), '--video', video, '--out', motionDir, ...(flag('brief') ? ['--brief', flag('brief')] : []), ...(pw ? ['--playwright', pw] : [])], {encoding: 'utf8'})
  : spawnSync('node', [join(here, 'motion_judge.mjs'), target, '--out', motionDir, ...(lastMotion ? ['--prev', lastMotion] : []), ...(flag('brief') ? ['--brief', flag('brief')] : []), ...(pw ? ['--playwright', pw] : [])], {encoding: 'utf8'});
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
if (mj.status !== 0) motionError = `motion process exited ${mj.status ?? mj.signal ?? 'without status'}`;
if (identity.digest !== projectFingerprint().digest) motionError = 'local source changed during review';
const motionBlocks = Array.isArray(motion?.violations) ? motion.violations.length : 0;
if (motionError) {
  history.push({round, blockers: 0, critic: verdict.scores, motion: motionScore, motionViolations: motionBlocks,
    motionError, motionEvidence: relative(dir, motionDir), hash: fingerprint});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  if (mj.stderr) process.stderr.write(mj.stderr);
  console.log(`\nUNVERIFIED round ${round}: ${motionError}. A successful, complete motion judgment is required for PASS. Fix the cause and rerun; no quality pass is recorded.`);
  process.exit(2);
}
history.push({round, blockers: 0, critic: verdict.scores, motion: motionScore, motionViolations: motionBlocks,
  motionEvidence: relative(dir, motionDir), hash: fingerprint});
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
if (verdict.scores.overall >= goal && !motionBlocks && motionScore >= 9) { console.log(`\nPASS round ${round}: critic ${verdict.scores.overall}/10 (target ${goal}), motion ${motionScore}/10. Critic trail: ${trail}.`); process.exit(0); }
const scored = completedReviews().map(h => h.critic.overall), best = Math.max(...scored);
const stalled = scored.length >= 3 && Math.max(...scored.slice(-2)) <= Math.max(...scored.slice(0, -2));
console.log(`\nFAIL round ${round}: critic ${verdict.scores.overall}/10 (target ${goal}), motion ${motionScore ?? 'not judged'}/10 (target 9)${motionBlocks ? `, ${motionBlocks} motion violation(s)` : ''}. Critic trail: ${trail}. Apply every design and motion fix listed above, most visible first, then run check.mjs again.`);
if (stalled && !history.some(h => h.rootChange)) {
  history[history.length - 1].rootChange = true;
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  console.log(`LAST ROUND: the critic has not improved for two rounds (best ${best}). Make one root-level change to the weakest dimension (type scale and weights, palette, or imagery), then run check.mjs one final time.`);
  process.exit(1);
}
if (stalled || scored.length >= 6) {
  history[history.length - 1].stop = stalled ? 'no improvement after a root-level change' : 'six critic rounds';
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  const bestRound = completedReviews().filter(h => h.critic.overall === best).pop();
  console.log(`STOP: ${history[history.length - 1].stop}. The quality target was not reached. Best fully reviewed candidate: critic ${best}, motion ${bestRound.motion}, round ${bestRound.round}. Its code is in ${join(review, `round-${bestRound.round}`)} (HTML, CSS and JS, not images). Report unresolved gaps; do not call this a pass or publish it as accepted.`);
  process.exit(3);
}
process.exit(1);
