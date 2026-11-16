#!/usr/bin/env node
/** MOTION.md: every moving thing on a built page, with the change it explains. A page whose blocks all fade up says
 *  nothing; a page with one signature moment and a reason per movement reads as designed. check.mjs calls
 *  motionDocProblems when the page has transitions or animations.
 *
 *  node motion_doc.mjs <MOTION.md>
 *
 *  The file holds one table: a row per moving thing with its trigger, what moves, duration, easing, the change it
 *  explains and its reduced-motion state, and one line naming the signature moment. The how is in seenry-motion. */
import {existsSync, readFileSync, realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const EMPTY = /^(|_+|-+|–|—|n\/?a|none|tbd|\?+|\.\.\.|…)$/i;

/** Rows of the first markdown table that has a "why" column (explains, why, reason or change). */
export function motionRows(text) {
  const lines = String(text || '').split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
  const cells = l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const head = lines.findIndex(l => /\b(explains?|why|reason|change)\b/i.test(l) && !/^\|[\s:|-]+\|?$/.test(l));
  if (head < 0) return {why: -1, reduced: -1, rows: []};
  const names = cells(lines[head]).map(c => c.toLowerCase());
  const why = names.findIndex(c => /\b(explains?|why|reason|change)\b/.test(c)), reduced = names.findIndex(c => /reduced/.test(c));
  const rows = lines.slice(head + 1).filter(l => !/^\|[\s:|-]+\|?$/.test(l)).map(cells).filter(r => r.some(c => c));
  return {why, reduced, rows};
}

export function motionDocProblems(text) {
  if (!text || !text.trim()) return ['it does not exist (needs 1 row per moving thing)'];
  const {why, reduced, rows} = motionRows(text), problems = [];
  if (why < 0) return ['it has no table with an "Explains" column: one row per moving thing, with the change it explains'];
  if (!rows.length) problems.push('its table has 0 rows (needs 1 per moving thing)');
  const noWhy = rows.filter(r => EMPTY.test(r[why] || '')).length;
  if (noWhy) problems.push(`${noWhy} of ${rows.length} rows give no change the movement explains (needs 0): say what the visitor learns from it, or remove the movement`);
  const noReduced = reduced >= 0 ? rows.filter(r => EMPTY.test(r[reduced] || '')).length : rows.length;
  if (noReduced) problems.push(`${noReduced} of ${rows.length} rows give no reduced-motion state (needs 0)`);
  if (!/signature/i.test(text)) problems.push('it names no signature moment (needs 1: the one movement that carries the page\'s idea)');
  const loops = rows.filter(r => r.some(c => /\b(loop|infinite|idle)\b/i.test(c))).length;
  if (loops > 1) problems.push(`${loops} idle loops (needs 1 at most, and only when it is the product's own behaviour)`);
  return problems;
}

const real = p => { try { return realpathSync(p); } catch { return resolve(p); } };
if (process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1])) {
  const file = process.argv[2];
  if (!file) { console.error('Usage: node motion_doc.mjs <MOTION.md>'); process.exit(2); }
  const problems = motionDocProblems(existsSync(file) ? readFileSync(file, 'utf8') : '');
  console.log(problems.length ? `${file}: ${problems.join('; ')}` : `${file}: every movement has a reason.`);
  process.exit(problems.length ? 1 : 0);
}
