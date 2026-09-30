#!/usr/bin/env node
/** Motion and interaction judge: screenshots cannot show motion, so this plays the page's interactions and judges them.
 *
 *  node motion_judge.mjs <url | file.html> [--out .seenry/review/motion] [--max 8] [--brief BRIEF.md] [--no-critic]
 *                        [--playwright path]
 *
 *  1. Clicks up to --max interactive controls and captures a filmstrip around each (before, then about 40, 120, 220,
 *     360 and 700ms after), plus a rapid second click to test interruption.
 *  2. Measures every running animation (duration, delay, easing, animated properties, iterations), layout shift and
 *     long animation frames, then repeats with reduced motion.
 *  3. Blocks hard violations (layout properties animated, UI transitions over 600ms, linear easing on UI, motion that
 *     ignores reduced motion, layout shift, controls that change state with no motion) and asks a fresh model to score
 *     the filmstrips: purpose, timing and easing, spatial logic, smoothness, consistency, reduced motion, overall.
 *  Writes motion-board.png and motion.json to --out; exits 1 on hard violations or an overall under 8. */
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {findCli, askModel} from './model_cli.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && !['--no-critic'].includes(args[i - 1])));
if (!target) { console.error('Usage: node motion_judge.mjs <url | file.html> [--out dir] [--max 8]'); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
const out = resolve(flag('out', '.seenry/review/motion')); mkdirSync(out, {recursive: true});
const max = Number(flag('max', '8'));

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2);
}

const observe = () => {
  window.__seenryShift = 0; window.__seenryLong = 0;
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__seenryShift += e.value; }).observe({type: 'layout-shift', buffered: true}); } catch {}
  try { new PerformanceObserver(l => { window.__seenryLong += l.getEntries().length; }).observe({type: 'long-animation-frame', buffered: false}); } catch {}
};
const pickTargets = max => {
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 8 && r.height > 8 && s.visibility !== 'hidden' && +s.opacity > 0; };
  const sel = 'button:not([disabled]),[role=tab],[role=switch],[aria-expanded],summary,label:has(input[type=radio]),label:has(input[type=checkbox]),[data-st],input[type=checkbox],input[type=radio],a[href^="#"]:not([href="#"])';
  const seen = new Set(), picked = [];
  for (const el of document.querySelectorAll(sel)) {
    if (!vis(el) || el.closest('nav,header,footer') && el.tagName === 'A') continue;
    const key = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30) + el.tagName;
    if (seen.has(key)) continue; seen.add(key);
    el.setAttribute('data-seenry-probe', String(picked.length));
    picked.push({i: picked.length, label: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('data-st') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40)});
    if (picked.length >= max) break;
  }
  return picked;
};
const snapAnimations = () => document.getAnimations().filter(a => a.playState === 'running' || a.playState === 'pending').map(a => {
  const t = a.effect?.getTiming?.() || {}, kf = a.effect?.getKeyframes?.() || [];
  const props = a.transitionProperty ? [a.transitionProperty] : [...new Set(kf.flatMap(k => Object.keys(k).filter(p => !['offset', 'easing', 'composite', 'computedOffset'].includes(p))))];
  const el = a.effect?.target; const r = el?.getBoundingClientRect?.();
  return {kind: a.constructor.name, props, duration: typeof t.duration === 'number' ? t.duration : 0, delay: t.delay || 0, easing: t.easing || kf[0]?.easing || 'linear',
    iterations: t.iterations, target: el ? `${el.tagName?.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}` : '?', area: r ? Math.round(r.width * r.height) : 0};
});

const {chromium} = await loadPlaywright();
const browser = await chromium.launch({headless: true});
const results = [];
async function run(reduced) {
  const ctx = await browser.newContext({viewport: {width: 1440, height: 900}, reducedMotion: reduced ? 'reduce' : 'no-preference'});
  await ctx.addInitScript(observe);
  const page = await ctx.newPage();
  await page.goto(url, {waitUntil: 'networkidle'});
  await page.waitForTimeout(900);
  const targets = await page.evaluate(pickTargets, max);
  const rows = [];
  for (const t of targets) {
    const loc = page.locator(`[data-seenry-probe="${t.i}"]`);
    try { await loc.scrollIntoViewIfNeeded({timeout: 2000}); } catch { continue; }
    await page.waitForTimeout(250);
    const box = await loc.boundingBox(); if (!box) continue;
    const clip = {x: Math.max(0, box.x - 220), y: Math.max(0, box.y - 160), width: Math.min(1440, box.width + 440), height: Math.min(900, box.height + 320)};
    clip.width = Math.min(clip.width, 1440 - clip.x); clip.height = Math.min(clip.height, 900 - clip.y);
    const frames = [];
    const before = await page.evaluate(() => ({shift: window.__seenryShift, long: window.__seenryLong, text: document.body.innerText.length}));
    if (!reduced) frames.push({t: 'before', buf: await page.screenshot({clip})});
    const t0 = Date.now();
    await loc.click({timeout: 2000}).catch(() => {});
    await page.waitForTimeout(40);
    const anims = await page.evaluate(snapAnimations);
    if (!reduced) for (const ms of [40, 120, 220, 360, 700]) {
      const wait = ms - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait);
      frames.push({t: `${Date.now() - t0}ms`, buf: await page.screenshot({clip})});
    } else await page.waitForTimeout(700);
    let rapid = [];
    if (!reduced) {
      await loc.click({timeout: 1500}).catch(() => {}); await page.waitForTimeout(90); await loc.click({timeout: 1500}).catch(() => {});
      await page.waitForTimeout(150); rapid.push({t: 'rapid +150ms', buf: await page.screenshot({clip})});
      await page.waitForTimeout(450); rapid.push({t: 'rapid +600ms', buf: await page.screenshot({clip})});
    }
    const after = await page.evaluate(() => ({shift: window.__seenryShift, long: window.__seenryLong, text: document.body.innerText.length}));
    if (await page.evaluate(() => !!document.querySelector('dialog[open],[aria-modal=true],[popover]:popover-open'))) await page.keyboard.press('Escape');
    if (page.url() !== (await page.evaluate(() => location.href))) await page.goBack().catch(() => {});
    rows.push({label: t.label, anims, shift: +(after.shift - before.shift).toFixed(3), longFrames: after.long - before.long, frames: [...frames, ...rapid]});
  }
  await ctx.close();
  return rows;
}
const normal = await run(false);
const calm = await run(true);

const LAYOUT = /^(width|height|top|left|right|bottom|margin|padding|inset|min-|max-|border-width|font-size|line-height|gap|grid)/;
const violations = [], notes = [];
for (const r of normal) {
  const ui = r.anims.filter(a => a.iterations !== Infinity);
  const layout = ui.filter(a => a.props.some(p => LAYOUT.test(p.replace(/[A-Z]/g, m => '-' + m.toLowerCase()))));
  if (layout.length) violations.push(`"${r.label}": animates layout (${[...new Set(layout.flatMap(a => a.props))].join(', ')}); use transform, opacity or clip-path, or FLIP`);
  const slow = ui.filter(a => a.duration + a.delay > 600 && a.area < 400000);
  if (slow.length) violations.push(`"${r.label}": UI motion runs ${Math.round(Math.max(...slow.map(a => a.duration + a.delay)))}ms; keep UI transitions at or under 400ms (600 for page-level)`);
  const linear = ui.filter(a => /^linear$/.test(a.easing) && a.duration > 80 && !a.props.some(p => /stroke-dash|background-position/.test(p)));
  if (linear.length) notes.push(`"${r.label}": linear easing on ${linear.map(a => a.target).slice(0, 3).join(', ')} (fine only for progress or clocks)`);
  if (r.shift > 0.02) violations.push(`"${r.label}": layout shift ${r.shift} during the interaction`);
  const blur = ui.filter(a => a.props.some(p => /filter/.test(p)) && a.area > 40000);
  if (blur.length) notes.push(`"${r.label}": animates filter on a large element (${blur[0].area}px²); limit blur to small elements`);
  if (!r.anims.length) notes.push(`"${r.label}": no animation observed on interaction (fine if nothing changed; otherwise add a transition)`);
}
for (const r of calm) {
  const moving = r.anims.filter(a => a.duration > 60 && a.iterations !== Infinity && a.props.some(p => /transform|translate|scale|rotate|clip/.test(p)));
  if (moving.length) violations.push(`"${r.label}": still moves with reduced motion (${moving.map(a => a.target).slice(0, 2).join(', ')})`);
}
const durations = normal.flatMap(r => r.anims.filter(a => a.iterations !== Infinity).map(a => Math.round(a.duration)));
const easings = [...new Set(normal.flatMap(r => r.anims.map(a => a.easing)))];

const cells = normal.map(r => `<div class="row"><div class="lab">${r.label.replace(/</g, '')}<small>${r.anims.length} anim · ${[...new Set(r.anims.map(a => Math.round(a.duration) + 'ms'))].slice(0, 4).join(' ')}</small></div>${r.frames.map(f => `<figure><img src="data:image/png;base64,${f.buf.toString('base64')}"><figcaption>${f.t}</figcaption></figure>`).join('')}</div>`).join('');
const page = await browser.newPage({viewport: {width: 1800, height: 400}});
await page.setContent(`<style>body{margin:0;padding:12px;background:#ddd;font:12px system-ui}.row{display:flex;gap:6px;align-items:flex-start;margin-bottom:10px}.lab{width:150px;flex:none;font-weight:600}.lab small{display:block;font-weight:400;color:#555}figure{margin:0;width:200px}img{width:200px;display:block;border:1px solid #bbb;background:#fff}figcaption{color:#444}</style>${cells || '<p>No interactive controls found.</p>'}`);
await page.screenshot({path: join(out, 'motion-board.png'), fullPage: true});
await browser.close();

const report = {url, interactions: normal.map(r => ({label: r.label, anims: r.anims, shift: r.shift, longFrames: r.longFrames})), reduced: calm.map(r => ({label: r.label, anims: r.anims})),
  violations, notes, durations: [...new Set(durations)].sort((a, b) => a - b), easings};
console.log(`■ motion  ${normal.length} interactions · durations ${report.durations.join('/') || 'none'}ms · ${easings.length} easing curve(s)`);
for (const v of violations) console.log(`  BLOCK ${v}`);
for (const n of notes) console.log(`  note  ${n}`);

let verdict = null;
const found = !args.includes('--no-critic') && findCli(process.env.SEENRY_CRITIC);
if (found && normal.length) {
  const brief = flag('brief') && existsSync(flag('brief')) ? readFileSync(flag('brief'), 'utf8') : '';
  const KEYS = ['purpose', 'timing', 'spatial', 'smoothness', 'consistency', 'reduced_motion', 'overall'];
  const schema = {type: 'object', additionalProperties: false, required: ['scores', 'verdict', 'fixes'], properties: {
    scores: {type: 'object', additionalProperties: false, required: KEYS, properties: Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}]))},
    verdict: {type: 'string'}, fixes: {type: 'array', minItems: 1, maxItems: 8, items: {type: 'object', additionalProperties: false, required: ['interaction', 'problem', 'fix'], properties: {interaction: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}}};
  const prompt = `You are a motion and interaction design lead at the level of Apple, Linear and Vercel. The attached image is a filmstrip board: each row is one interaction on a web page, showing the region before the click and at the measured times after it, then two frames after a rapid double click (interruption test). Measured data from the browser follows.

${brief ? 'The brief:\n' + brief + '\n' : ''}Measured per interaction (animations running 40ms after the click: properties, duration, delay, easing):
${JSON.stringify(report.interactions.map(i => ({interaction: i.label, anims: i.anims.map(a => ({props: a.props, ms: Math.round(a.duration), delay: a.delay, easing: a.easing, target: a.target})), layoutShift: i.shift})), null, 0).slice(0, 6000)}
Durations used across the page: ${report.durations.join(', ')}ms. Easing curves: ${easings.join(' | ')}.
Reduced-motion run (same clicks with prefers-reduced-motion: reduce): ${calm.map(r => `${r.label}: ${r.anims.filter(a => a.duration > 60 && a.iterations !== Infinity).map(a => a.props.join('+') + ' ' + Math.round(a.duration) + 'ms').join(', ') || 'no motion over 60ms'}`).join('; ') || 'no interactions'}.
Automatic violations: ${violations.join('; ') || 'none'}. Notes: ${notes.join('; ') || 'none'}.

Score 1-10 (8 = the level of Linear or Apple, 5 = generic): purpose (every motion explains a change; no decoration; nothing missing where state changes), timing (durations fit frequency and distance; exits faster than entrances; easing appropriate), spatial (things grow from their trigger, move in the direction of the change, keep geometry stable), smoothness (transform and opacity, no jank, no layout shift, interruptible rather than restarting), consistency (one family of durations and curves across the page), reduced_motion, overall. Then list concrete fixes: which interaction, the problem, and the exact change (property, duration, easing, origin). Do not open any files other than the attached image.`;
  try {
    verdict = askModel(found, {images: [join(out, 'motion-board.png')], prompt, schema});
    const s = verdict.scores;
    console.log(`Motion judge (${found.cli}): overall ${s.overall}/10 · purpose ${s.purpose} · timing ${s.timing} · spatial ${s.spatial} · smooth ${s.smoothness} · consistent ${s.consistency} · reduced ${s.reduced_motion}`);
    console.log(verdict.verdict);
    verdict.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.interaction}] ${f.problem} → ${f.fix}`));
  } catch (e) { console.error(`motion judge model failed: ${e.message}`); }
}
writeFileSync(join(out, 'motion.json'), JSON.stringify({...report, verdict}, null, 2));
console.log(`\nWritten to ${join(out, 'motion.json')} and motion-board.png`);
process.exit(violations.length || (verdict && verdict.scores.overall < 8) ? 1 : 0);
