#!/usr/bin/env node
/** The finishing gate. One command per round:
 *
 *  node check.mjs <url | file.html> --brief BRIEF.md [--refs a.png,b.png] [--dir .seenry] [--target 9] [--playwright path]
 *
 *  1. Renders the page with review_board.mjs. Any slop or craft blocker fails the round before a critic is asked.
 *  2. With zero blockers, runs critic.mjs: a fresh model scores the page against the reference screens.
 *  3. Prints PASS when the critic's overall reaches --target (default 9), else FAIL with the fixes to apply.
 *  Rounds are numbered; every critic result is kept as <dir>/review/critic-N.json and summarized in check.json. */
import {existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!target) { console.error('Usage: node check.mjs <url | file.html> --brief BRIEF.md [--refs a.png,b.png]'); process.exit(2); }
const dir = resolve(flag('dir', '.seenry')), review = join(dir, 'review');
const goal = Number(flag('target', '9'));
mkdirSync(review, {recursive: true});
let refs = flag('refs');
if (!refs && existsSync(join(dir, 'refs'))) refs = readdirSync(join(dir, 'refs')).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).slice(0, 3).map(f => join(dir, 'refs', f)).join(',');
const history = existsSync(join(review, 'check.json')) ? JSON.parse(readFileSync(join(review, 'check.json'), 'utf8')) : [];
const round = history.length + 1;

const pw = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
const boardArgs = [join(here, 'review_board.mjs'), target, '--out', review, ...(refs ? ['--refs', refs] : []), ...(pw ? ['--playwright', pw] : [])];
const board = spawnSync('node', boardArgs, {encoding: 'utf8'});
process.stdout.write(board.stdout);
if (board.status === 2) { process.stderr.write(board.stderr); process.exit(2); }
const blockers = JSON.parse(readFileSync(join(review, 'board.json'), 'utf8')).blockers;
if (blockers) {
  history.push({round, blockers, critic: null});
  writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
  console.log(`\nFAIL round ${round}: ${blockers} blocker(s). Fix every one above, then run check.mjs again. The critic runs once the board is clean.`);
  process.exit(1);
}

const out = join(review, `critic-${round}.json`);
const critic = spawnSync('node', [join(here, 'critic.mjs'), '--board', join(review, 'board.png'), '--first', join(review, 'first.png'),
  '--out', out, ...(flag('brief') ? ['--brief', flag('brief')] : []), ...(refs ? ['--refs', refs] : [])], {encoding: 'utf8'});
process.stdout.write(critic.stdout);
if (critic.status !== 0) { process.stderr.write(critic.stderr); console.log('\nThe critic did not run. Fix the cause above and rerun; do not substitute your own review.'); process.exit(critic.status === 2 ? 2 : 1); }
const verdict = JSON.parse(readFileSync(out, 'utf8'));
history.push({round, blockers: 0, critic: verdict.scores});
writeFileSync(join(review, 'check.json'), JSON.stringify(history, null, 2));
const trail = history.filter(h => h.critic).map(h => h.critic.overall).join(' → ');
if (verdict.scores.overall >= goal) { console.log(`\nPASS round ${round}: critic ${verdict.scores.overall}/10 (target ${goal}). Critic trail: ${trail}.`); process.exit(0); }
const best = Math.max(...history.filter(h => h.critic).map(h => h.critic.overall));
console.log(`\nFAIL round ${round}: critic ${verdict.scores.overall}/10, target ${goal}. Critic trail: ${trail}. Apply every fix listed above, most visible first, then run check.mjs again.`
  + (history.filter(h => h.critic).length >= 2 && verdict.scores.overall <= best && best === history.filter(h => h.critic).slice(-2)[0].critic.overall
    ? ' The score has stalled: change the weakest dimension at its root (type family and weights, palette, or imagery), not details.' : '')
  + (round >= 6 ? ' Six rounds have run: ship the best-scoring round and report the trail.' : ''));
process.exit(1);
