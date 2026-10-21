#!/usr/bin/env node
/** The gate for a change inside an existing app: the review board's blockers, typed values in the files you changed,
 *  the motion scan, and a product-design review of the changed screen at 100% and on phone. No identity, research or
 *  exploration steps. Apply the fixes once, then stop.
 *
 *  node existing_check.mjs <url of the changed screen> [--project .] [--playwright path]
 *  Exit 0 when no blockers remain (the review's fixes are still to apply), 1 with blockers. */
import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
if (!target) { console.error('usage: existing_check.mjs <url> [--project .]'); process.exit(2); }
const here = new URL('.', import.meta.url).pathname, project = resolve(flag('project', '.')), pw = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
const out = mkdtempSync(join(tmpdir(), 'seenry-existing-'));
const run = (script, extra) => spawnSync('node', [join(here, script), ...extra, ...(pw ? ['--playwright', pw] : [])], {encoding: 'utf8'});
let blockers = 0;
const critic = new Promise(done => {
  const child = spawn('node', [join(here, 'detail_critic.mjs'), target, '--app', '--out', join(out, 'detail.json'), ...(pw ? ['--playwright', pw] : [])]);
  let stdout = '', stderr = ''; child.stdout.on('data', d => stdout += d); child.stderr.on('data', d => stderr += d);
  child.on('close', status => done({status, stdout, stderr}));
});
const board = run('review_board.mjs', [target, '--out', out]);
if (board.status === 2) { process.stderr.write(board.stderr); process.exit(2); }
process.stdout.write(board.stdout);
if (existsSync(join(out, 'board.json'))) blockers += JSON.parse(readFileSync(join(out, 'board.json'), 'utf8')).blockers;
const lint = spawnSync('node', [join(here, 'token_lint.mjs'), project, '--changed'], {encoding: 'utf8'});
process.stdout.write('\n' + lint.stdout); if (lint.status === 1) { blockers++; console.log(`Convert in one pass: node ${join(here, 'token_convert.mjs')} <folder of the changed stylesheets> (dry run shows the scale), then --apply.`); }
const scan = spawnSync('node', [join(here, 'motion_scan.mjs'), project], {encoding: 'utf8'});
process.stdout.write('\n' + scan.stdout.split('\n').slice(0, 8).join('\n') + '\n'); if (scan.status === 1) blockers++;
const c = await critic;
process.stdout.write('\n' + (c.status === 0 ? c.stdout : `Product review did not run: ${c.stderr.slice(0, 300)}\n`));
console.log(blockers
  ? `\nFAIL: ${blockers} blocker group(s) above. Fix them (only what your change touched or introduced, plus typed values in changed files), then apply the review's fixes once and run this again.`
  : '\nNo blockers. Apply the review\'s fixes once, most visible first, check the phone, then stop.');
process.exit(blockers ? 1 : 0);
