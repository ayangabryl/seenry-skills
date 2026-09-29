#!/usr/bin/env node
/** Blind critic: a fresh model process that has never seen your reasoning scores the rendered page against the
 *  references, the way a design director or client would. Self-review grades its own work 9/10; a blind critic does not.
 *
 *  node critic.mjs --board .seenry/review/board.png --first .seenry/review/first.png --brief BRIEF.md
 *                  [--refs a.png,b.png] [--out .seenry/review/critic.json] [--cli codex|claude]
 *
 *  Uses the Codex CLI (`codex exec`) or Claude Code (`claude -p`), whichever is installed (override with --cli or
 *  SEENRY_CRITIC). Prints scores and the fixes ranked by visible impact, and writes them to --out. */
import {existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {tmpdir, homedir, userInfo} from 'node:os';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const board = resolve(flag('board', '.seenry/review/board.png'));
const first = resolve(flag('first', '.seenry/review/first.png'));
const out = resolve(flag('out', '.seenry/review/critic.json'));
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);
const briefPath = flag('brief');
const brief = briefPath && existsSync(briefPath) ? readFileSync(briefPath, 'utf8') : (flag('job') || 'A web page.');
for (const f of [board, first]) if (!existsSync(f)) { console.error(`Missing ${f}. Run review_board.mjs first.`); process.exit(2); }

// A PATH can hold several installs of a CLI, some broken (a global npm shim whose binary is missing), so try each
// candidate and keep the first that actually runs.
const runnable = name => {
  const found = spawnSync('sh', ['-c', `which -a ${name} 2>/dev/null`], {encoding: 'utf8'}).stdout.split('\n').filter(Boolean);
  const extra = name === 'codex' ? [process.env.SEENRY_CODEX_BIN, join(homedir(), '.local/bin/codex'), join(homedir(), '.codex/packages/standalone/current/bin/codex'), join(userInfo().homedir, '.local/bin/codex')] : [process.env.SEENRY_CLAUDE_BIN, join(homedir(), '.local/bin/claude'), join(userInfo().homedir, '.local/bin/claude')];
  for (const bin of [...new Set([...extra.filter(Boolean), ...found])]) {
    if (!existsSync(bin)) continue;
    if (spawnSync(bin, ['--version'], {stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000}).status === 0) return bin;
  }
  return null;
};
const cli = flag('cli', process.env.SEENRY_CRITIC) || (runnable('codex') ? 'codex' : runnable('claude') ? 'claude' : null);
const bin = cli && runnable(cli);
if (!cli || !bin) { console.error('No working critic CLI found (codex or claude). Ask an independent reviewer to score board.png and first.png instead.'); process.exit(2); }

const images = [board, first, ...refs];
const listing = [`image 1 = the candidate: full desktop page at half scale (left) and phone page (right)`,
  `image 2 = the candidate's desktop first screen beside the reference screens`,
  ...refs.map((r, i) => `image ${i + 3} = reference ${r.split('/').pop()}`)].join('\n');
const KEYS = ['premium', 'clean', 'no_slop', 'typography', 'layout', 'craft', 'mobile', 'overall'];
const schema = {type: 'object', additionalProperties: false, required: ['scores', 'slop', 'verdict', 'fixes'], properties: {
  scores: {type: 'object', additionalProperties: false, required: KEYS, properties: Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}]))},
  slop: {type: 'array', items: {type: 'string'}},
  verdict: {type: 'string'},
  fixes: {type: 'array', minItems: 3, maxItems: 8, items: {type: 'object', additionalProperties: false, required: ['where', 'problem', 'fix'],
    properties: {where: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}}};
const prompt = `You are a design director who has shipped work at companies like Stripe, Linear and Apple, reviewing one candidate before it goes to the client. You did not make it and owe it nothing. The client's standard: clean, premium, no AI slop, at the same level as the best big-company product design.

${listing}

The reference images are real screens from top companies. They are the bar.

The brief:
${brief}

Score 1-10, calibrated so that the reference screens score about 8-9 and a competent template scores 5:
- premium: would this sit beside the references as the same level of craft?
- clean: calm, uncluttered, clear hierarchy, nothing decorative that does not help the job.
- no_slop: 10 = none of the AI-generated tells; subtract for each: uppercase letter-spaced labels or eyebrows, numbered labels like "01 /", italic serif accent words, trendy default fonts, default AI palettes (cream+terracotta, plum+peach, navy+lime), clip-art imagery (sunset circles, vinyl records, flat product stand-ins), colored KPI hero cards with decoration, pill badges everywhere, tilted floating cards with stickers, heavy 700+ weights, gradient blobs, generic slogans, tiny or faint text.
- typography, layout, craft, mobile.
- overall: against the client's standard. Decoration never earns points; distinctiveness counts only when achieved cleanly.
List every slop tell you see. Then the fixes that would raise overall most, most visible first: where on the page, the problem, and a concrete change (sizes, weights, colors, what to remove or replace). Prefer removing over adding. Say what the references do that the candidate does not.
Do not open any files other than the attached images.`;

mkdirSync(dirname(out), {recursive: true});
const work = mkdtempSync(join(tmpdir(), 'seenry-critic-'));
let raw = '';
if (cli === 'codex') {
  const schemaFile = join(work, 'schema.json'), result = join(work, 'out.json');
  writeFileSync(schemaFile, JSON.stringify(schema));
  const cmd = ['exec', '--skip-git-repo-check', '-s', 'read-only', '--output-schema', schemaFile, '-o', result];
  for (const img of images) cmd.push('-i', img);
  cmd.push('--', prompt);
  const r = spawnSync(bin, cmd, {cwd: work, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 900000});
  raw = existsSync(result) ? readFileSync(result, 'utf8') : '';
  if (!raw) { console.error(`codex critic failed (status ${r.status}${r.error ? ', ' + r.error.code : ''}):`, (r.stderr || r.stdout || '').slice(0, 1500)); process.exit(1); }
} else {
  const p = `${prompt}\n\nThe images are these files; read each one: ${images.join(', ')}\nAnswer with only a JSON object matching this schema: ${JSON.stringify(schema)}`;
  const r = spawnSync(bin, ['-p', p, '--allowedTools', 'Read', '--output-format', 'text'], {cwd: work, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 900000});
  raw = (r.stdout || '').slice((r.stdout || '').indexOf('{'), (r.stdout || '').lastIndexOf('}') + 1);
  if (!raw) { console.error((r.stderr || r.stdout || '').slice(-2000)); process.exit(1); }
}
const verdict = JSON.parse(raw);
writeFileSync(out, JSON.stringify({cli, images, ...verdict}, null, 2));
const s = verdict.scores;
console.log(`Blind critic (${cli}): overall ${s.overall}/10 · premium ${s.premium} · clean ${s.clean} · no-slop ${s.no_slop} · type ${s.typography} · layout ${s.layout} · craft ${s.craft} · mobile ${s.mobile}`);
if (verdict.slop.length) console.log('Slop seen: ' + verdict.slop.join('; '));
console.log(verdict.verdict);
verdict.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.where}] ${f.problem} → ${f.fix}`));
console.log(`\nWritten to ${out}`);
