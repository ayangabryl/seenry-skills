#!/usr/bin/env node
/** Explore, then pick blind: render several first-screen compositions side by side and let a fresh model choose.
 *
 *  node pick.mjs hero-a.html hero-b.html hero-c.html --brief BRIEF.md [--refs a.png,b.png] [--out .seenry/explore]
 *
 *  Each file is a complete first screen (same content, different composition). The tool renders every file at 1440x900
 *  and 390x844, builds one labelled board, and asks a fresh Codex or Claude process to rank them against the brief and
 *  the reference screens: which is most premium, clearest and most distinctive, and what to take from the others.
 *  Writes board.png and pick.json to --out and prints the ranking. */
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {resolve, join, basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {findCli, askModel} from './model_cli.mjs';
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const files = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))).map(f => resolve(f));
if (files.length < 2 || files.some(f => !existsSync(f))) { console.error('Usage: node pick.mjs a.html b.html [c.html] --brief BRIEF.md [--refs a.png,b.png]'); process.exit(2); }
const out = resolve(flag('out', '.seenry/explore')); mkdirSync(out, {recursive: true});
markWorkDir(out);
const refs = (flag('refs', '') || '').split(',').filter(Boolean).map(p => resolve(p)).filter(existsSync);

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2);
}
const {chromium} = await loadPlaywright();
const browser = await chromium.launch();
const labels = 'ABCDE'.split('');
const shots = [];
for (const [i, f] of files.entries()) {
  const row = {label: labels[i], file: basename(f)};
  for (const [w, h, key] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
    const page = await browser.newPage({viewport: {width: w, height: h}});
    await page.goto(pathToFileURL(f).href, {waitUntil: 'networkidle'});
    await page.waitForTimeout(1200);
    row[key] = (await page.screenshot()).toString('base64');
    await page.close();
  }
  shots.push(row);
}
const board = await browser.newPage({viewport: {width: 1500, height: 400}});
await board.setContent(`<style>body{margin:0;padding:16px;background:#d6d6d6;font:600 18px system-ui}.row{display:flex;gap:16px;align-items:flex-start;margin-bottom:20px}.l{width:40px}img{display:block;border:1px solid #aaa;background:#fff}.d{width:1000px}.p{width:260px}</style>${shots.map(s => `<div class="row"><div class="l">${s.label}</div><img class="d" src="data:image/png;base64,${s.desktop}"><img class="p" src="data:image/png;base64,${s.phone}"></div>`).join('')}`);
await board.screenshot({path: join(out, 'board.png'), fullPage: true});
await browser.close();

const found = findCli(process.env.SEENRY_CRITIC);
if (!found) { console.log(`Board written to ${join(out, 'board.png')}; no Codex or Claude CLI for a blind pick, so compare it yourself.`); process.exit(0); }
const brief = flag('brief') && existsSync(flag('brief')) ? readFileSync(flag('brief'), 'utf8') : '';
const schema = {type: 'object', additionalProperties: false, required: ['ranking', 'scores', 'winner_why', 'take_from_others'], properties: {
  ranking: {type: 'array', items: {type: 'string'}},
  scores: {type: 'array', items: {type: 'object', additionalProperties: false, required: ['label', 'premium', 'clarity', 'distinctiveness', 'idea', 'identity', 'category_fit', 'phone', 'overall'], properties: {label: {type: 'string'}, ...Object.fromEntries(['premium', 'clarity', 'distinctiveness', 'idea', 'identity', 'category_fit', 'phone', 'overall'].map(k => [k, {type: 'integer', minimum: 1, maximum: 10}]))}}},
  winner_why: {type: 'string'}, take_from_others: {type: 'array', items: {type: 'string'}}}};
const prompt = `You are a design director choosing one identity to develop, the way a studio picks after an exploration round. Image 1 is a board: each row is one candidate identity board (label on the left), desktop 1440 and phone 390: its wordmark, type, color, device, image treatment and two posters (the hero and an ordinary section such as pricing or FAQ). Judge both posters; an identity that only works in its hero is weaker than one that carries into the ordinary section.${refs.length ? ` The following ${refs.length} image(s) are reference screens from top companies: the bar.` : ''}

The brief:
${brief}

Standard: clean, premium, no AI slop, at big-company level, with one clear idea that belongs to this product. Score each candidate 1-10 on premium, clarity (is the promise and the first action obvious in two seconds), distinctiveness (would it look wrong on a competitor's page), idea (does the composition itself express the product's idea), identity (a studio-grade identity: one type voice with character, one full color field, one graphic device from the brand's truth; with the logo covered, is it still this brand? a clean template with a palette applied is 6 or lower), category_fit (name the category and two or three of its best brands: would they ship this composition? a software split with a boxed product card for a physical or luxury product scores 5 or lower), phone, and overall. overall is never more than one point above the lowest of idea, identity and category_fit. A text column left with a photo filling the right half, a giant standalone numeral as the hero device, or a centered headline over a boxed product card is a generated template, 6 at most. If every candidate is a competent template (6 or lower overall), say so plainly and describe the composition class the category's best brands use, so the designer builds a new direction instead of polishing one of these. Rank them, say in two sentences why the winner wins, and list what to take from the others into the winner. Do not open any files other than the attached images.`;
let verdict;
try { verdict = askModel(found, {images: [join(out, 'board.png'), ...refs], prompt, schema}); } catch (e) { console.error(`pick failed: ${e.message}`); process.exit(1); }
writeFileSync(join(out, 'pick.json'), JSON.stringify({files: shots.map(s => ({label: s.label, file: s.file})), ...verdict}, null, 2));
for (const s of verdict.scores) console.log(`${s.label} ${shots.find(x => x.label === s.label)?.file}: overall ${s.overall} · premium ${s.premium} · clarity ${s.clarity} · distinct ${s.distinctiveness} · idea ${s.idea} · identity ${s.identity} · category ${s.category_fit} · phone ${s.phone}`);
console.log(`\nWinner: ${verdict.ranking[0]} (${shots.find(x => x.label === verdict.ranking[0])?.file}). ${verdict.winner_why}`);
for (const t of verdict.take_from_others) console.log(`  + ${t}`);
console.log(`\nWritten to ${join(out, 'pick.json')} and board.png`);
