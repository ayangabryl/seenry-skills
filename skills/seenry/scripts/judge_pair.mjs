#!/usr/bin/env node
/** A verdict for a pair render: your screen beside one reference, judged by a fresh model that has seen neither.
 *
 *  node judge_pair.mjs <pair.png> [--screen name] [--reference name] [--out verdict.json]
 *
 *  Two questions, each a yes or no:
 *   1. Is yours a reskin of this one reference (its layout, palette and image subject, with new words)?
 *   2. Is yours visibly less finished than the reference (product UI density, chart form, how image and UI meet, finish)?
 *  A yes to either blocks showing the screen: canvas.mjs pair runs this, canvas.mjs verify and check.mjs read the result.
 *  Looking at a pair image and moving on was how three weak options were shown; the verdict is not the builder's to give.
 *
 *  With example: true the one question is whether the screen is the skill's own worked example with a new skin
 *  (the same hero composition and section order); a blind run on a weaker model copied the example move for move.
 *
 *  SEENRY_PAIR_JUDGE=off skips the judge. SEENRY_PAIR_STUB='{"reskin":false,"less_finished":false}' answers without a
 *  model (tests). The model CLI is the critic's: SEENRY_CRITIC=codex|claude. */
import {existsSync, readFileSync, writeFileSync, realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {findCli, askModel} from './model_cli.mjs';

export const PAIR_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['reskin', 'reskin_why', 'less_finished', 'gaps', 'keep'],
  properties: {
    reskin: {type: 'boolean'},
    reskin_why: {type: 'string'},
    less_finished: {type: 'boolean'},
    gaps: {type: 'array', items: {type: 'string'}},
    keep: {type: 'string'},
  },
};

export function pairPrompt({screen = 'the screen on the left', reference = 'the reference on the right'} = {}) {
  return [
    'You are a design director reviewing one image: on the left a new screen ("Yours"), on the right a reference a designer studied ("Reference"). You have no stake in either. Answer two questions about the left screen only, each with yes or no.',
    `Left: ${screen}. Right: ${reference}.`,
    '1. reskin: is the left screen a reskin of the right one? Yes when its layout, its palette family and its image subject all follow the reference, with only words, logo or hue swapped. Sharing one of the three (the same kind of layout, or a similar hue) is not a reskin. In reskin_why name what matches and what does not, in one sentence.',
    '2. less_finished: would a design-literate viewer see at once that the left is a lower class of work than the right? When neither screen presents a software product (a studio, a portfolio, a shop, an editorial page), judge instead: material (the work or the goods at real size and art-directed, versus thumbnails in equal cards), composition (one strong moment per section on one grid), colour (one system held throughout) and finish; the product parts below do not apply and a missing product view is not a gap. Otherwise judge these four parts and list in gaps every one where the left is clearly behind, each as "part: what the reference has, what the left has": product UI (how many distinct kinds of interface the product view shows, whether each metric carries its own small visual, whether one state is selected); chart form (a designed object in the brand\'s own form, in one hue with one highlight, versus default bars or a clash of status colours); image and interface (the image in front of the interface or the interface melting into the page, versus a panel placed on a picture); finish (logos as marks, buttons and tabs as designed controls, a restrained two-line headline, one radius family). Answer yes when two or more parts are clearly behind, or one is missing altogether (no product view, or a bare chart). A different style at the same finish is not less finished.',
    'In keep, say in one sentence what the left already does as well as the right, so the fix does not undo it. Judge only what the pixels show; ignore content and wording quality.',
  ].join('\n');
}

/** The skill's own worked example is a path to copy, not a page. Asked of a screen beside the example's screenshot. */
export function examplePrompt({screen = 'the screen on the left'} = {}) {
  return [
    'You are a design director reviewing one image: on the left a new page ("Yours"), on the right a worked example the designer was told to learn from but not to copy ("Reference"). Answer about the left page only.',
    `Left: ${screen}.`,
    'reskin: is the left page the example with a new skin? Yes when BOTH hold: (a) the hero is composed the same way (a centred two-line headline over a flat field, then a wide app window whose lower part sinks behind a foreground band of the image), and (b) the sections below follow the same order and forms (image-bottomed tiles, a row of statistics, a row of input cards flowing to one coloured card, a quote panel with a before/after, one pricing table, the hero image returning as the closing). A different product, palette and image subject do not make it a different page. Sharing the principles only (the image meeting the interface in depth, a dense product view, the image returning below) with its own hero arrangement or its own sequence of sections is NOT a reskin. In reskin_why name what matches and what differs, in one sentence.',
    'Set less_finished to false and gaps to an empty list. In keep, say in one sentence what the left does that is its own.',
  ].join('\n');
}

/** Returns {reskin, reskin_why, less_finished, gaps, keep} or {skipped: reason}. Never throws for a missing model. */
export function judgePair({image, screen, reference, example = false}) {
  if (example && process.env.SEENRY_EXAMPLE_STUB) { try { return {reskin: false, reskin_why: '', less_finished: false, gaps: [], keep: '', example: true, ...JSON.parse(process.env.SEENRY_EXAMPLE_STUB)}; } catch { return {skipped: 'SEENRY_EXAMPLE_STUB is not JSON'}; } }
  if (process.env.SEENRY_PAIR_STUB) { try { return {reskin: false, reskin_why: '', less_finished: false, gaps: [], keep: '', ...(example ? {example: true} : JSON.parse(process.env.SEENRY_PAIR_STUB))}; } catch { return {skipped: 'SEENRY_PAIR_STUB is not JSON'}; } }
  if (/^(off|0|no)$/i.test(process.env.SEENRY_PAIR_JUDGE || '')) return {skipped: 'SEENRY_PAIR_JUDGE=off'};
  if (!image || !existsSync(image)) return {skipped: 'no pair image'};
  const cli = findCli(process.env.SEENRY_CRITIC);
  if (!cli) return {skipped: 'no model CLI (codex or claude) to judge with'};
  try {
    const v = askModel(cli, {images: [resolve(image)], prompt: example ? examplePrompt({screen}) : pairPrompt({screen, reference}), schema: PAIR_SCHEMA});
    if (example) return {reskin: !!v.reskin, reskin_why: String(v.reskin_why || ''), less_finished: false, gaps: [], keep: String(v.keep || ''), example: true, by: cli.cli};
    return {reskin: !!v.reskin, reskin_why: String(v.reskin_why || ''), less_finished: !!v.less_finished, gaps: Array.isArray(v.gaps) ? v.gaps.map(String) : [], keep: String(v.keep || ''), by: cli.cli};
  } catch (e) { return {skipped: `the judge failed: ${String(e.message || e).slice(0, 200)}`}; }
}

export const blocked = v => !!v && !v.skipped && (v.reskin || v.less_finished);

/** One line per blocking verdict, for verify and the gate. entries: [{frame, reference, verdict}] */
export function pairBlocks(entries) {
  return (entries || []).filter(e => blocked(e.verdict)).map(e => {
    const v = e.verdict, parts = [];
    if (v.reskin && v.example) parts.push(`the skill's worked example with a new skin${v.reskin_why ? ` (${v.reskin_why})` : ''}: keep its principles, but give this page its own hero arrangement (another way for image and interface to meet) and its own sequence of sections`);
    else if (v.reskin) parts.push(`a reskin of ${e.reference}${v.reskin_why ? ` (${v.reskin_why})` : ''}: change two of layout, palette and image subject`);
    if (v.less_finished) parts.push(`visibly less finished than ${e.reference}${v.gaps?.length ? `: ${v.gaps.slice(0, 4).join('; ')}` : ''}`);
    return `${e.frame}: ${parts.join('; and ')}. Fix it, then run verify again.`;
  });
}

const real = p => { try { return realpathSync(p); } catch { return resolve(p); } };
if (process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1])) {
  const args = process.argv.slice(2), flag = (n, f) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : f; };
  const image = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  if (!image) { console.error('Usage: node judge_pair.mjs <pair.png> [--screen name] [--reference name] [--out verdict.json]'); process.exit(2); }
  const verdict = judgePair({image, screen: flag('screen'), reference: flag('reference')});
  if (flag('out')) writeFileSync(flag('out'), JSON.stringify(verdict, null, 2));
  if (verdict.skipped) { console.log(`Not judged: ${verdict.skipped}.`); process.exit(2); }
  console.log(`Reskin: ${verdict.reskin ? 'yes' : 'no'}${verdict.reskin_why ? ` (${verdict.reskin_why})` : ''}\nLess finished: ${verdict.less_finished ? 'yes' : 'no'}${verdict.gaps.length ? '\n  ' + verdict.gaps.join('\n  ') : ''}${verdict.keep ? `\nKeep: ${verdict.keep}` : ''}`);
  process.exit(blocked(verdict) ? 1 : 0);
}
