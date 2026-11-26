#!/usr/bin/env node
/** The first call of a design task: prints only what this task needs, short enough to read whole.
 *
 *  node start.mjs "<the brief, or a few keywords>"   the 2–3 style briefs that fit best, the bans, the fast-path steps
 *  node start.mjs .seenry/brief.md                    the same, matched against a brief file
 *  node start.mjs --style <slug>                      that style brief in full, then the bans and the steps
 *  node start.mjs                                     reads .seenry/brief.md when it exists
 *
 *  --no-steps leaves out the steps; --json prints {matches, bans, steps, taste} for another tool.
 * Matching is keyword overlap against references/styles/index.json: no model is asked.
 * When this computer is linked to the person's Seenry account (seenry-canvas link), their taste file is printed
 * too: what they chose, what they never want, the sites and images they love. --no-taste leaves it out. */
import {existsSync, readFileSync, realpathSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stylesDir = join(root, 'references', 'styles');

export const loadIndex = () => JSON.parse(readFileSync(join(stylesDir, 'index.json'), 'utf8'));

const words = text => String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || [];
const stem = w => w.length > 4 ? w.replace(/(ies|es|s|ing|ed)$/, '') : w;

/** Score each style by how many of its keywords the brief uses; a word of its name counts half. Ties keep shelf order.
 *  The best two that match at all are kept, and a third only when it scores at least a third of the best. */
export function matchStyles(brief, index = loadIndex(), limit = 3) {
  const said = new Set(), all = words(brief);
  for (const w of all) { said.add(w); said.add(stem(w)); for (const part of w.split('-')) { said.add(part); said.add(stem(part)); } }
  const hit = k => said.has(k) || said.has(stem(k)) || k.split('-').every(p => said.has(p) || said.has(stem(p)));
  return index
    .map((s, order) => {
      const keys = s.keywords.filter(hit), soft = [...new Set(words(s.name).filter(w => w.length > 2 && !keys.includes(w) && hit(w)))];
      return {...s, score: keys.length + soft.length / 2, matched: [...keys, ...soft], order};
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .filter((s, i, list) => i < 2 || s.score >= list[0].score / 3)
    .slice(0, limit)
    .map(({order, ...s}) => s);
}

/** The bans as one line each: the clause before the first full stop. */
export function bans() {
  const text = readFileSync(join(root, 'references', 'bans.md'), 'utf8');
  return text.split('\n').filter(l => /^- /.test(l)).map(l => l.slice(2).split(/(?<=\.)\s/)[0].replace(/\.$/, ''));
}

/** The fast path from SKILL.md's step table: number, name and the command to run. */
export function steps() {
  const text = readFileSync(join(root, 'SKILL.md'), 'utf8');
  return [...text.matchAll(/^\| (\d+) \| \*\*([^*]+?)\.?\*\*[^|]*\| ([^|]*) \|/gm)].map(([, n, name, run]) => `${n}. ${name}${/^\s*\(/.test(run) ? '' : `: ${run.trim()}`}`);
}

/** The person's taste file from their Seenry account, read with the link this computer already has. Empty when the
 *  computer is not linked, taste is switched off, or Seenry does not answer in time: a task never waits on it. */
export async function taste({timeout = 2500} = {}) {
  try {
    const folder = process.env.SEENRY_CONFIG_DIR || join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'seenry');
    const config = JSON.parse(readFileSync(join(folder, 'canvas-sync.json'), 'utf8'));
    if (!config?.token || !/^https?:\/\//.test(config.server || '')) return '';
    const response = await fetch(config.server.replace(/\/+$/, '') + '/api/account/taste.md', {headers: {authorization: `Bearer ${config.token}`}, signal: AbortSignal.timeout(timeout)});
    return response.status === 200 ? (await response.text()).trim() : '';
  } catch { return ''; }
}

async function main(args) {
  const flag = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
  const valued = new Set(['--style']);
  const free = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1])).join(' ').trim();
  const index = loadIndex(), slug = flag('style');
  let brief = free;
  if (free && !/\s/.test(free) && /\.(md|txt)$/i.test(free)) {
    if (!existsSync(resolve(free))) { console.error(`No brief at ${free}.`); return 2; }
    brief = readFileSync(resolve(free), 'utf8');
  } else if (!free && existsSync(resolve('.seenry/brief.md'))) brief = readFileSync(resolve('.seenry/brief.md'), 'utf8');

  if (slug && !index.some(s => s.slug === slug)) { console.error(`No style "${slug}". The shelf: ${index.map(s => s.slug).join(', ')}`); return 2; }
  const matches = slug ? index.filter(s => s.slug === slug) : matchStyles(brief, index);
  const mine = args.includes('--no-taste') ? '' : await taste();
  if (args.includes('--json')) { console.log(JSON.stringify({matches, bans: bans(), steps: steps(), taste: mine}, null, 2)); return 0; }

  const out = [];
  if (slug) {
    out.push(readFileSync(join(stylesDir, `${slug}.md`), 'utf8').trim(), '', `Its Imagery block is the two image jobs: fill every <…> with this product's own, save as .seenry/canvas/img/jobs.json, run image.mjs --batch on it.`);
  } else if (!brief.trim()) {
    out.push('No brief yet: write .seenry/brief.md (or pass a few words), then run this again to get the styles that fit.');
  } else if (!matches.length) {
    out.push(`No style on the shelf matches these words. Shelf: ${index.map(s => s.slug).join(', ')}.`, 'Pick one with --style <slug>, or work from the references alone.');
  } else {
    out.push('Styles that fit (read one whole with --style <slug>; each is an identity, never a page order):');
    for (const s of matches) out.push(`  ${s.slug.padEnd(20)} ${s.for}  [${s.matched.slice(0, 4).join(', ')}]`);
    out.push('One direction may take a style; the others answer the brief differently.');
  }
  out.push('', 'Never (references/bans.md):', ...bans().map(b => `  - ${b}`));
  if (mine) out.push('', 'Their taste, from their Seenry account. The project and the brief come first; use this where they leave a choice open:', ...mine.split('\n').filter(l => !/^# Taste\s*$/.test(l)).map(l => `  ${l}`.trimEnd()));
  if (!args.includes('--no-steps')) out.push('', 'Steps (SKILL.md):', ...steps().map(s => `  ${s}`));
  console.log(out.join('\n'));
  return 0;
}

const real = path => { try { return realpathSync(path); } catch { return resolve(path); } };
if (process.argv[1] && real(process.argv[1]) === real(fileURLToPath(import.meta.url))) process.exitCode = await main(process.argv.slice(2));
