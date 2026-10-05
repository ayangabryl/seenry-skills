#!/usr/bin/env node
// Conventional Commits check, no dependencies. See CONTRIBUTING.md.
//   node scripts/check-commit-messages.mjs --file .git/COMMIT_EDITMSG   (commit-msg hook)
//   node scripts/check-commit-messages.mjs --range <from>..<to>          (CI)
//   node scripts/check-commit-messages.mjs --last 1
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
const HEADER = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9][a-z0-9./-]*\\))?(!)?: (.+)$`);
const SUBJECT_MAX = 72, BODY_MAX = 100;
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });

function check(message) {
  const lines = message.replace(/\r/g, '').split('\n').filter(l => !l.startsWith('#'));
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const [header = '', blank, ...body] = lines;
  if (/^(Merge|Revert ")/.test(header)) return [];
  const errors = [], m = header.match(HEADER);
  if (!m) errors.push(`header must be "type(scope): subject" with type one of ${TYPES.join(', ')}`);
  else {
    if (/\.$/.test(m[4])) errors.push('subject has no trailing period');
  }
  if (header.length > SUBJECT_MAX) errors.push(`header is ${header.length} characters; keep it to ${SUBJECT_MAX}`);
  if (blank !== undefined && blank.trim()) errors.push('leave one blank line between the header and the body');
  body.forEach((l, i) => { if (l.length > BODY_MAX && !/https?:\/\/|^[\w-]+: /.test(l)) errors.push(`body line ${i + 3} is ${l.length} characters; wrap at ${BODY_MAX}`); });
  return errors;
}

const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; };
let commits;
if (opt('--file')) commits = [['message', readFileSync(opt('--file'), 'utf8')]];
else {
  const range = opt('--range') || `HEAD~${opt('--last') || 1}..HEAD`;
  const shas = git('rev-list', '--no-merges', range).split('\n').filter(Boolean);
  commits = shas.map(s => [s.slice(0, 7), git('log', '-1', '--format=%B', s)]);
}
let failed = 0;
for (const [id, msg] of commits) {
  const errors = check(msg);
  if (errors.length) { failed++; console.error(`✗ ${id} ${msg.split('\n')[0]}\n${errors.map(e => '  - ' + e).join('\n')}`); }
}
if (failed) { console.error(`\n${failed} commit message(s) do not follow Conventional Commits. See CONTRIBUTING.md.`); process.exit(1); }
console.log(`✓ ${commits.length} commit message(s) follow Conventional Commits.`);
