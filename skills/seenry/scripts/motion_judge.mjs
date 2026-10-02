#!/usr/bin/env node
/** Motion and interaction judge: screenshots cannot show motion, so this plays the page's interactions and judges them.
 *
 *  node motion_judge.mjs <url | file.html> [--out .seenry/review/motion] [--max 8] [--selector "[data-replay]"] [--brief BRIEF.md] [--no-critic]
 *                        [--playwright path] [--runs 3] [--slow 4] [--labels "Menu,Tabs"] [--prev last/motion.json]
 *
 *  1. Plays up to --max interactive controls (every distinct --selector match when a selector is given, up to 40) in
 *     slow motion (--slow 4: the page's animation timeline, timers and requestAnimationFrame clock run 4x slower, so a
 *     frame lands within about 15ms of its label). For each control it films a state strip (hover, keyboard focus,
 *     rest, and hover on the first control the change revealed), an entrance strip (30, 60, 100, 150, 220, 320ms and
 *     settled) and an interruption strip (a second input 70ms into the next change, then +40, +100, +200ms and settled).
 *     Each strip is cropped to the demo region plus any layer the change opened, so overlays are never cut off.
 *  2. Measures every running animation on entrance and on the interrupting input (duration, delay, easing, animated
 *     properties, start and end keyframes), layout shift and long animation frames, then repeats with reduced motion.
 *  3. Blocks hard violations (layout properties animated, UI transitions over 600ms, motion that ignores reduced
 *     motion, layout shift) and asks three independent model runs to score the filmstrips against a calibrated rubric.
 *     The score is the median of the runs; the fixes come from the run that scored the median.
 *  4. With --prev (the previous round's motion.json), lists what is still open: every criterion under 9 that did not
 *     rise and every interaction the judge asked to fix again. Those are the ceiling; rounds stall when they are skipped.
 *  Writes motion-board.png (every row), motion-board-N.png (the pages the model reads) and motion.json to --out;
 *  exits 1 on hard violations or an overall under 9.
 *
 *  Scale: 9-10 is indistinguishable from Apple, Linear or Family at their best; 8 is clearly premium; 6-7 is correct
 *  but generic (right tokens, fades and small translates, nothing a top team would call crafted). */
import {mkdirSync, writeFileSync, readFileSync, existsSync, mkdtempSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {findCli, askModel} from './model_cli.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };

// Internal: one blind model run, spawned three times by the parent so the runs are independent and parallel.
if (flag('ask')) {
  const job = JSON.parse(readFileSync(flag('ask'), 'utf8'));
  const found = findCli(process.env.SEENRY_CRITIC);
  if (!found) process.exit(2);
  try { writeFileSync(job.result, JSON.stringify({...askModel(found, job), cli: found.cli})); process.exit(0); }
  catch (e) { process.stderr.write(e.message); process.exit(1); }
}

const bare = ['--no-critic'];
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && !bare.includes(args[i - 1])));
if (!target) { console.error('Usage: node motion_judge.mjs <url | file.html> [--out dir] [--max 8] [--selector css] [--runs 3] [--slow 4]'); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
const out = resolve(flag('out', '.seenry/review/motion')); mkdirSync(out, {recursive: true});
const only = flag('selector'); // e.g. "[data-replay]" to judge specific controls such as a gallery's replay buttons
const max = Number(flag('max', only ? '40' : '8'));
const runs = Math.max(1, Number(flag('runs', '3')));
const SLOW = Math.max(1, Number(flag('slow', '4')));
const VW = 1440, VH = 900;

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2);
}

// Runs in the page before any script. Timers, performance.now and requestAnimationFrame follow a virtual clock, so a
// scripted sequence stays in step with the slowed animation timeline instead of racing ahead of it.
const observe = () => {
  window.__seenryShift = 0; window.__seenryLong = 0;
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__seenryShift += e.value; }).observe({type: 'layout-shift', buffered: true}); } catch {}
  try { new PerformanceObserver(l => { window.__seenryLong += l.getEntries().length; }).observe({type: 'long-animation-frame', buffered: false}); } catch {}
  const realNow = performance.now.bind(performance), st = setTimeout, si = setInterval, raf = requestAnimationFrame;
  let scale = 1, realAnchor = realNow(), virtAnchor = realAnchor;
  const now = () => virtAnchor + (realNow() - realAnchor) / scale;
  Object.defineProperty(window, '__seenryTimeScale', {get: () => scale, set: v => { virtAnchor = now(); realAnchor = realNow(); scale = v; }});
  performance.now = now;
  window.setTimeout = (fn, ms, ...a) => st(fn, (Number(ms) || 0) * scale, ...a);
  window.setInterval = (fn, ms, ...a) => si(fn, (Number(ms) || 0) * scale, ...a);
  window.requestAnimationFrame = cb => raf(() => cb(now()));
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
const pickSelected = ({max, only}) => {
  const seen = new Set(), picked = [];
  for (const el of document.querySelectorAll(only)) {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const card = el.closest('article,section,li,figure,[class*=card]'); const h = card && card.querySelector('h2,h3,h4');
    const named = el.closest('[data-motion-label]')?.getAttribute('data-motion-label');
    const label = (named || (h && h.textContent) || el.getAttribute('aria-label') || el.textContent || 'control').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (seen.has(label)) continue; seen.add(label);
    el.setAttribute('data-seenry-probe', String(picked.length)); picked.push({i: picked.length, label});
    if (picked.length >= max) break;
  }
  return picked;
};
// The region a filmstrip shows: an explicit [data-motion-region], else the nearest card-sized ancestor.
const regionOf = i => {
  const el = document.querySelector(`[data-seenry-probe="${i}"]`); if (!el) return null;
  let region = el.closest('[data-motion-region]');
  if (!region) for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    const r = n.getBoundingClientRect(); if (r.width > 1000 || r.height > 640) break;
    if (n.matches('article,section,li,figure,[class*=card],[class*=demo],[class*=preview]')) region = n;
  }
  document.querySelectorAll('[data-seenry-region]').forEach(n => n.removeAttribute('data-seenry-region'));
  (region || el.parentElement).setAttribute('data-seenry-region', '');
  const r = (region || el).getBoundingClientRect(), pad = region ? 0 : 160;
  return {x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2};
};
const layerRects = () => [...document.querySelectorAll('dialog[open],[popover]:popover-open,[aria-modal=true],[role=dialog]:not([hidden]),[role=menu]:not([hidden]),[role=listbox]:not([hidden]),[role=tooltip]:not([hidden])')]
  .filter(el => { const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && !el.closest('[inert]:not(dialog)'); })
  .map(el => el.getBoundingClientRect()).filter(r => r.width > 4 && r.height > 4 && r.width < innerWidth * 0.95 && r.bottom > 0 && r.top < innerHeight).map(r => ({x: r.left, y: r.top, w: r.width, h: r.height}));
const snapAnimations = () => document.getAnimations().filter(a => a.playState === 'running' || a.playState === 'pending' || a.playState === 'paused').map(a => {
  const t = a.effect?.getTiming?.() || {}, kf = a.effect?.getKeyframes?.() || [];
  const props = a.transitionProperty ? [a.transitionProperty] : [...new Set(kf.flatMap(k => Object.keys(k).filter(p => !['offset', 'easing', 'composite', 'computedOffset'].includes(p))))];
  const el = a.effect?.target; const r = el?.getBoundingClientRect?.();
  const brief = k => k ? Object.fromEntries(Object.entries(k).filter(([p]) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)).map(([p, v]) => [p, String(v).slice(0, 80)])) : {};
  const easing = t.easing && t.easing !== 'linear' ? t.easing : (kf[0]?.easing || t.easing || 'linear');
  // For a baked spring (linear() easing) report when 95% of the travel is done; the rest is an invisible settle tail.
  let ms95 = null; const lin = /^linear\((.*)\)$/.exec(t.easing || '');
  if (lin && typeof t.duration === 'number') { const v = lin[1].split(',').map(x => parseFloat(x)); const i = v.findIndex(x => x >= 0.95); if (i >= 0) ms95 = Math.round(t.duration * i / (v.length - 1)); }
  return {kind: a.constructor.name, props, ms95, duration: typeof t.duration === 'number' ? t.duration : 0, delay: t.delay || 0, easing: easing.length > 60 ? easing.slice(0, 40) + '…(spring)' : easing,
    iterations: t.iterations, keyframes: kf.length, from: brief(kf[0]), to: brief(kf[kf.length - 1]),
    target: el ? `${el.tagName?.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}` : (a.effect?.pseudoElement || '?'), area: r ? Math.round(r.width * r.height) : 0};
});
const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y}; };
const clampBox = r => { const x = Math.max(0, Math.floor(r.x)), y = Math.max(0, Math.floor(r.y)); return {x, y, w: Math.min(VW - x, Math.ceil(r.w + r.x - x)), h: Math.min(VH - y, Math.ceil(r.h + r.y - y))}; };

const {chromium} = await loadPlaywright();
const browser = await chromium.launch({headless: true});

async function run(reduced) {
  const ctx = await browser.newContext({viewport: {width: VW, height: VH}, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference'});
  await ctx.addInitScript(observe);
  const page = await ctx.newPage();
  await page.goto(url, {waitUntil: 'networkidle'});
  await page.waitForTimeout(900);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable');
  const slow = async on => {
    const k = reduced ? 1 : on ? SLOW : 1;
    await cdp.send('Animation.setPlaybackRate', {playbackRate: 1 / k});
    await page.evaluate(k => { window.__seenryTimeScale = k; }, k);
  };
  const wait = ms => page.waitForTimeout(ms * (reduced ? 1 : SLOW));
  let targets = only ? await page.evaluate(pickSelected, {max, only}) : await page.evaluate(pickTargets, max);
  const labels = flag('labels'); // e.g. --labels "Menu,Tabs" films only those rows, for quick iteration
  if (labels) { const want = labels.split(',').map(x => x.trim().toLowerCase()); targets = targets.filter(t => want.includes(t.label.toLowerCase())); }
  const rows = [];
  for (const t of targets) {
    const loc = page.locator(`[data-seenry-probe="${t.i}"]`);
    try { await loc.scrollIntoViewIfNeeded({timeout: 2000}); } catch { continue; }
    await page.evaluate(i => { const el = document.querySelector(`[data-seenry-probe="${i}"]`); const r = el.getBoundingClientRect(); if (r.top < 120 || r.bottom > innerHeight - 280) scrollBy(0, r.top - innerHeight * 0.45); }, t.i);
    await page.mouse.move(2, 2); await page.waitForTimeout(250);
    let box = await page.evaluate(regionOf, t.i); if (!box) continue;
    const shots = [];
    const shoot = async (group, label, t0) => {
      const a = Date.now(); const buf = await page.screenshot({type: 'jpeg', quality: 82});
      const ms = t0 ? Math.round(((a + Date.now()) / 2 - t0) / SLOW) : null;
      shots.push({group, label: ms === null ? label : `${label} ${ms}ms`, buf});
    };
    // A control covered by a modal layer cannot take a real pointer click; send the activation it would get from a
    // keyboard or script instead of clicking whatever covers it.
    const press = async () => {
      const covered = await loc.evaluate(el => { const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !hit || !(el === hit || el.contains(hit)); }).catch(() => true);
      if (covered) await loc.evaluate(el => el.click()).catch(() => {}); else await loc.click({timeout: 1500}).catch(() => {});
    };
    const before = await page.evaluate(() => ({shift: window.__seenryShift, long: window.__seenryLong, held: document.getAnimations().filter(a => a.constructor.name === 'Animation' && a.playState === 'finished' && /forwards|both/.test(a.effect?.getTiming().fill)).length}));
    let anims = [], reverseAnims = [], layers = [];
    await slow(true);
    if (!reduced) {
      await loc.hover({timeout: 1500}).catch(() => {}); await wait(260); await shoot('states', 'hover');
      await page.mouse.move(2, 2); await page.keyboard.press('Shift');
      // Keyboard focus on the region's own first control (in a gallery the probe is a replay button, not the component).
      const own = await page.evaluate(i => { const self = document.querySelector(`[data-seenry-probe="${i}"]`), scope = document.querySelector('[data-seenry-region]'); const el = scope && [...scope.querySelectorAll('button,a[href],input,summary,[role=tab],[tabindex="0"]')].find(n => n !== self && !self.contains(n) && n.getBoundingClientRect().width > 8 && getComputedStyle(n).visibility !== 'hidden'); if (!el) return false; el.setAttribute('data-seenry-focus', ''); return true; }, t.i);
      const focusLoc = own ? page.locator('[data-seenry-focus]').first() : loc;
      await focusLoc.focus().catch(() => {}); await wait(200); await shoot('states', 'keyboard focus');
      await page.evaluate(() => document.querySelectorAll('[data-seenry-focus]').forEach(n => n.removeAttribute('data-seenry-focus')));
      await page.evaluate(() => document.activeElement?.blur()); await wait(200);
      await shoot('states', 'rest');
    }
    const t0 = Date.now();
    await press();
    anims = await page.evaluate(snapAnimations);
    if (!reduced) {
      for (const ms of [30, 60, 100, 150, 220, 320]) { const w = ms * SLOW - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); await shoot('enter', 'enter', t0); }
      await wait(380); await shoot('enter', 'settled');
      layers = await page.evaluate(layerRects);
      const inside = await page.evaluate(({i}) => {
        const self = document.querySelector(`[data-seenry-probe="${i}"]`);
        const layer = document.querySelector('dialog[open],[popover]:popover-open');
        const scope = layer || document.querySelector('[data-seenry-region]') || self.parentElement;
        const el = [...(scope?.querySelectorAll('button,a[href],[role=menuitem],[role=tab],[role=option],input,summary') || [])].find(n => n !== self && !n.closest('[data-seenry-probe]') && n.getBoundingClientRect().width > 8 && getComputedStyle(n).visibility !== 'hidden');
        if (!el) return null; const r = el.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2};
      }, {i: t.i});
      if (inside) { await page.mouse.move(inside.x, inside.y); await wait(200); await shoot('states', 'hover inside'); await page.mouse.move(2, 2); await wait(120); }
      // Interruption: start the next change, then reverse it 70ms in.
      const t1 = Date.now();
      await press();
      reverseAnims = await page.evaluate(snapAnimations);
      const w1 = 70 * SLOW - (Date.now() - t1); if (w1 > 0) await page.waitForTimeout(w1);
      await shoot('interrupt', 'next change', t1);
      layers.push(...await page.evaluate(layerRects));
      const t2 = Date.now();
      await press();
      for (const ms of [40, 100, 200]) { const w = ms * SLOW - (Date.now() - t2); if (w > 0) await page.waitForTimeout(w); await shoot('interrupt', '2nd input +', t2); }
      await wait(420); await shoot('interrupt', 'settled');
    } else await page.waitForTimeout(700);
    await slow(false);
    for (const l of layers) box = union(box, l);
    const crop = clampBox({x: box.x - 12, y: box.y - 12, w: box.w + 24, h: box.h + 24});
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({shift: window.__seenryShift, long: window.__seenryLong,
      held: document.getAnimations().filter(a => a.constructor.name === 'Animation' && a.playState === 'finished' && /forwards|both/.test(a.effect?.getTiming().fill)).length}));
    // Leave the page as found: Escape dismisses whatever the interaction left open (dialogs, popovers, sheets).
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if (await page.evaluate(() => !!document.querySelector('dialog[open],[aria-modal=true],[popover]:popover-open'))) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
    rows.push({label: t.label, anims, reverseAnims, shift: +(after.shift - before.shift).toFixed(3), longFrames: after.long - before.long, held: Math.max(0, after.held - before.held), crop, shots});
  }
  await ctx.close();
  return rows;
}
const normal = await run(false);
const calm = await run(true);

const LAYOUT = /^(width|height|top|left|right|bottom|margin|padding|inset|min-|max-|border-width|font-size|line-height|gap|grid)/;
const violations = [], notes = [];
const scaleOf = v => { const m = /scale\(([\d.]+)/.exec(v || '') || /matrix\(([\d.]+)/.exec(v || ''); return m ? +m[1] : 1; };
for (const r of normal) {
  const ui = [...r.anims, ...r.reverseAnims].filter(a => a.iterations !== Infinity);
  const layout = ui.filter(a => a.props.some(p => LAYOUT.test(p.replace(/[A-Z]/g, m => '-' + m.toLowerCase()))));
  if (layout.length) violations.push(`"${r.label}": animates layout (${[...new Set(layout.flatMap(a => a.props))].join(', ')}); use transform, opacity or clip-path, or FLIP`);
  const slow = ui.filter(a => a.duration + a.delay > 600 && a.area < 400000);
  if (slow.length) violations.push(`"${r.label}": UI motion runs ${Math.round(Math.max(...slow.map(a => a.duration + a.delay)))}ms; keep UI transitions at or under 400ms (600 for page-level)`);
  // Eight or more keyframes under linear timing is a sampled physical curve (a spring or a decaying shake), not linear motion.
  const linear = ui.filter(a => /^linear$/.test(a.easing) && a.duration > 80 && (a.keyframes || 2) < 8 && !a.props.some(p => /stroke-dash|background-position/.test(p)));
  if (linear.length) notes.push(`"${r.label}": linear easing on ${linear.map(a => a.target).slice(0, 3).join(', ')} (fine only for progress or clocks)`);
  if (r.held > 0) violations.push(`"${r.label}": ${r.held} finished animation(s) still hold their end styles (fill: forwards); write the final state, then cancel() them, or later state changes are overridden`);
  if (r.shift > 0.02) violations.push(`"${r.label}": layout shift ${r.shift} during the interaction`);
  const blur = ui.filter(a => a.props.some(p => /filter/.test(p)) && a.area > 40000);
  if (blur.length) notes.push(`"${r.label}": animates filter on a large element (${blur[0].area}px²); limit blur to small elements`);
  const zero = r.anims.filter(a => a.area > 4000 && scaleOf(a.from.transform) < 0.5 && /scale|matrix/.test(a.from.transform || ''));
  if (zero.length) notes.push(`"${r.label}": a surface scales up from ${scaleOf(zero[0].from.transform)}; real surfaces start near their final size (0.9 or more)`);
  const inMax = Math.max(0, ...r.anims.filter(a => a.iterations !== Infinity).map(a => a.duration + a.delay));
  const outMax = Math.max(0, ...r.reverseAnims.filter(a => a.iterations !== Infinity && String(a.to.opacity) === '0').map(a => a.duration + a.delay));
  if (outMax > inMax * 1.1 && inMax > 0) notes.push(`"${r.label}": exit (${Math.round(outMax)}ms) is slower than entrance (${Math.round(inMax)}ms)`);
  if (!r.anims.length) notes.push(`"${r.label}": no animation observed on interaction (fine if nothing changed; otherwise add a transition)`);
}
for (const r of calm) {
  const moving = r.anims.filter(a => a.duration > 60 && a.iterations !== Infinity && a.props.some(p => /transform|translate|scale|rotate|clip/.test(p)));
  if (moving.length) violations.push(`"${r.label}": still moves with reduced motion (${moving.map(a => a.target).slice(0, 2).join(', ')})`);
}
const durations = normal.flatMap(r => r.anims.filter(a => a.iterations !== Infinity).map(a => Math.round(a.duration)));
const easings = [...new Set(normal.flatMap(r => r.anims.map(a => a.easing)))];

// Boards: one block per interaction with three labelled strips, cropped to the same region in every frame.
const THUMB = 232;
const block = r => {
  const scale = Math.min(THUMB / r.crop.w, 190 / r.crop.h), w = Math.round(r.crop.w * scale), h = Math.round(r.crop.h * scale);
  const frame = s => `<figure><div class="f" style="width:${w}px;height:${h}px"><img src="data:image/jpeg;base64,${s.buf.toString('base64')}" style="width:${VW * scale}px;left:${-r.crop.x * scale}px;top:${-r.crop.y * scale}px"></div><figcaption>${s.label}</figcaption></figure>`;
  const strip = (g, name) => { const s = r.shots.filter(x => x.group === g); return s.length ? `<div class="strip"><b>${name}</b>${s.map(frame).join('')}</div>` : ''; };
  const ms = [...new Set(r.anims.filter(a => a.iterations !== Infinity).map(a => Math.round(a.duration) + 'ms'))].slice(0, 5).join(' ');
  return `<section><h2>${r.label.replace(/</g, '')}<small>${r.anims.length} anim · ${ms}</small></h2>${strip('states', 'States')}${strip('enter', 'Change')}${strip('interrupt', 'Interrupt')}</section>`;
};
const css = `<style>body{margin:0;padding:14px;background:#d9d9d9;font:12px system-ui;color:#111;width:max-content}section{background:#efefef;padding:8px 10px;margin-bottom:10px;border-radius:6px}h2{margin:0 0 6px;font-size:15px}h2 small{font-weight:400;color:#555;margin-left:10px;font-size:12px}.strip{display:flex;gap:6px;align-items:flex-start;margin-bottom:6px}.strip b{width:70px;flex:none;padding-top:4px;color:#333}figure{margin:0}.f{position:relative;overflow:hidden;border:1px solid #aaa;background:#fff}.f img{position:absolute;max-width:none}figcaption{color:#333;margin-top:2px}</style>`;
const boardPage = await browser.newPage({viewport: {width: 2000, height: 400}});
const PER = 3, pages = [];
for (let i = 0; i < normal.length; i += PER) {
  await boardPage.setContent(css + normal.slice(i, i + PER).map(block).join(''));
  const file = join(out, `motion-board-${pages.length + 1}.png`); await boardPage.screenshot({path: file, fullPage: true}); pages.push(file);
}
await boardPage.setContent(css + (normal.map(block).join('') || '<p>No interactive controls found.</p>'));
await boardPage.screenshot({path: join(out, 'motion-board.png'), fullPage: true});
await browser.close();

const report = {url, slowMotion: SLOW, interactions: normal.map(r => ({label: r.label, anims: r.anims, reverseAnims: r.reverseAnims, shift: r.shift, longFrames: r.longFrames})), reduced: calm.map(r => ({label: r.label, anims: r.anims})),
  violations, notes, durations: [...new Set(durations)].sort((a, b) => a - b), easings};
console.log(`■ motion  ${normal.length} interactions · durations ${report.durations.join('/') || 'none'}ms · ${easings.length} easing curve(s)`);
for (const v of violations) console.log(`  BLOCK ${v}`);
for (const n of notes) console.log(`  note  ${n}`);

const RUBRIC = `Calibrated scale. Use the whole range and be strict; most competent work is a 6 or 7.
- 10: indistinguishable from Apple, Linear or Family at their best, in every row.
- 9: at that level; at most one or two small nits a motion lead would still mention.
- 8: clearly premium. A top product team would ship it; each row has a deliberate idea, not only correct tokens.
- 6-7: correct but generic. Right durations and curves, but motion is a fade plus a small translate or scale from a default origin; content fades rather than travels; nothing keeps identity; it could come from any component library.
- 4-5: visible problems: wrong or centered origins on anchored surfaces, text stretched by a scaling container, jumps or restarts on interruption, sluggish or over-long motion, bounce on exact values.
- 1-3: broken or distracting.
The overall is the level of the catalog as a whole, not its best row. If a third of the rows are generic, the overall is at most 7.

What separates premium from merely correct (score each criterion 1-10 on the same scale):
- origin: every surface grows from the exact point that caused it (a menu from its trigger's edge, with transform-origin at the trigger; a sheet from its screen edge; a toast from its stack edge; an expanded card from its thumbnail's rect). Centered scale on an anchored popover, or a surface appearing from nowhere, is generic.
- attachment: content rides its container. Text inside a moving or resizing surface moves with it and is never squashed, stretched or left behind; a container that scales must counter-scale or clip its content. Content that fades in place while its container flies is generic. A uniform entrance scale of 0.95 or more on a whole surface, as Apple and Linear use for menus and dialogs, is not squashing; non-uniform scale on text is.
- choreography: container and content are coordinated. The container establishes where, new content arrives while the container is still finishing (overlap of 40-80ms, never a serial wait), outgoing content clears before space collapses, and siblings make room smoothly. Everything starting and ending together is generic; serial waits are worse.
- character: the motion has physical character suited to its job. Springs or strongly front-loaded curves on things the hand moved or that retarget (indicators, sheets, toggles, dragged items), a small settle or overshoot only where the material earns it (a thumb, a like, a sheet release), and never on exact values, text or data. Uniform ease-out on everything is generic; bouncy data is wrong.
- exit: exits are quicker, travel less and accelerate out; they do not mirror the entrance. Spatial returns to a known place may keep their geometry. Mirrored or slower exits are generic.
- continuity: shared elements keep identity across states: one indicator travels between tabs, changed digits roll by place value while unchanged digits stay, a thumbnail becomes the detail view, a button keeps its footprint while its label morphs, a list item's neighbours slide into its slot. Crossfading two whole states when something persisted is generic.
- interruption: a second input 70ms into a change reverses from the currently rendered value, with no jump, flash, restart from an endpoint or stuck state. A toggle ending in the same state as after its first input is correct.
- states: hover, keyboard focus and press are present, precise and quick; focus rings are visible and not clipped; nothing essential is hover-only.
- reduced_motion: from the measured reduced-motion run: travel, scale, blur and loops are removed while the state change stays clear.`;

let verdict = null;
const found = !args.includes('--no-critic') && findCli(process.env.SEENRY_CRITIC);
if (found && normal.length) {
  const brief = flag('brief') && existsSync(flag('brief')) ? readFileSync(flag('brief'), 'utf8') : '';
  const KEYS = ['origin', 'attachment', 'choreography', 'character', 'exit', 'continuity', 'interruption', 'states', 'reduced_motion', 'overall'];
  const schema = {type: 'object', additionalProperties: false, required: ['scores', 'rows', 'verdict', 'fixes'], properties: {
    scores: {type: 'object', additionalProperties: false, required: KEYS, properties: Object.fromEntries(KEYS.map(k => [k, {type: 'integer', minimum: 1, maximum: 10}]))},
    rows: {type: 'array', items: {type: 'object', additionalProperties: false, required: ['interaction', 'score', 'note'], properties: {interaction: {type: 'string'}, score: {type: 'integer', minimum: 1, maximum: 10}, note: {type: 'string'}}}},
    verdict: {type: 'string'}, fixes: {type: 'array', minItems: 1, maxItems: 10, items: {type: 'object', additionalProperties: false, required: ['interaction', 'problem', 'fix'], properties: {interaction: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}}};
  const measured = report.interactions.map(i => ({interaction: i.label,
    enter: i.anims.filter(a => a.iterations !== Infinity).slice(0, 8).map(a => ({target: a.target, props: a.props, ms: Math.round(a.duration), ...(a.ms95 ? {visibleMs: a.ms95} : {}), delay: a.delay, easing: a.easing, from: a.from, to: a.to})),
    nextChange: i.reverseAnims.filter(a => a.iterations !== Infinity).slice(0, 6).map(a => ({target: a.target, props: a.props, ms: Math.round(a.duration), easing: a.easing, to: a.to})), layoutShift: i.shift}));
  const prompt = `You are the motion lead at a company whose product motion is at the level of Apple, Linear and Family. Judge whether this page's interactions are premium or merely correct.

The attached images are filmstrip boards (${pages.length} pages, ${normal.length} interactions). Each interaction has three strips, all cropped to the same region, filmed in slow motion so the labelled times are accurate to about 15ms:
- States: hover and keyboard focus on the control, the resting state, and hover on the first control the change revealed.
- Change: the control's input and frames at the labelled milliseconds until settled.
- Interrupt: the next input, filmed 70ms in, then a second input that reverses it, at +40, +100, +200ms and settled.
${brief ? '\nThe brief:\n' + brief + '\n' : ''}
${RUBRIC}

Measured animations per interaction (enter = running just after the first input, with first and last keyframes; nextChange = running just after the next input, usually the exit):
${JSON.stringify(measured).slice(0, 14000)}
Durations used across the page: ${report.durations.join(', ')}ms. Easing curves (a linear() list is a baked spring; for those, ms is the full settle and visibleMs is when 95% of the travel is done, so judge perceived speed by visibleMs): ${easings.join(' | ').slice(0, 1200)}.
Reduced-motion run: ${calm.map(r => `${r.label}: ${r.anims.filter(a => a.duration > 60 && a.iterations !== Infinity).map(a => a.props.join('+') + ' ' + Math.round(a.duration) + 'ms').join(', ') || 'no motion over 60ms'}`).join('; ').slice(0, 3000) || 'no interactions'}.
Automatic violations: ${violations.join('; ') || 'none'}. Notes: ${notes.join('; ').slice(0, 2000) || 'none'}.

Look at every frame. Score each rubric criterion and each interaction (rows: one entry per interaction, with the score and the single most important observation). Then give the overall on the calibrated scale and up to ten concrete fixes naming the interaction, the problem you saw in specific frames, and the exact change (property, origin, duration, curve or spring, order). Fixes may only animate transform, opacity, clip-path, small filters or SVG strokes; size changes are shown with FLIP or a clipped shell, never by animating width, height or other layout properties. Do not open any files other than the attached images.`;
  const work = mkdtempSync(join(tmpdir(), 'seenry-motion-'));
  const self = fileURLToPath(import.meta.url);
  const results = (await Promise.all(Array.from({length: runs}, (_, k) => new Promise(done => {
    const job = join(work, `job-${k}.json`), result = join(work, `run-${k}.json`);
    writeFileSync(job, JSON.stringify({images: pages, prompt, schema, result}));
    const child = spawn(process.execPath, [self, '--ask', job], {stdio: ['ignore', 'ignore', 'pipe'], env: process.env});
    let err = ''; child.stderr.on('data', d => err += d);
    child.on('close', code => { try { done(JSON.parse(readFileSync(result, 'utf8'))); } catch { process.stderr.write(`motion judge run ${k + 1} failed (${code}): ${err.slice(0, 600)}\n`); done(null); } });
  })))).filter(r => r && r.scores);
  if (results.length) {
    const median = xs => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)];
    const scores = Object.fromEntries(KEYS.map(k => [k, median(results.map(r => r.scores[k]))]));
    const chosen = results.find(r => r.scores.overall === scores.overall) || results[0];
    verdict = {...chosen, scores, runs: results.map(r => r.scores.overall)};
    const s = scores;
    console.log(`Motion judge (${chosen.cli}, median of ${results.length} runs: ${verdict.runs.join('/')}): overall ${s.overall}/10 · origin ${s.origin} · attachment ${s.attachment} · choreography ${s.choreography} · character ${s.character} · exit ${s.exit} · continuity ${s.continuity} · interruption ${s.interruption} · states ${s.states} · reduced ${s.reduced_motion}`);
    console.log(chosen.verdict);
    console.log('Rows: ' + chosen.rows.map(r => `${r.interaction} ${r.score}`).join(' · '));
    chosen.fixes.forEach((f, i) => console.log(`${i + 1}. [${f.interaction}] ${f.problem} → ${f.fix}`));
    const prevPath = flag('prev');
    const prev = prevPath && existsSync(prevPath) ? JSON.parse(readFileSync(prevPath, 'utf8')).verdict : null;
    if (prev?.scores) {
      const stuck = KEYS.filter(k => k !== 'overall' && s[k] < 9 && s[k] <= (prev.scores[k] ?? 0));
      const asked = new Set((prev.fixes || []).map(f => f.interaction));
      const again = [...new Set(chosen.fixes.map(f => f.interaction).filter(i => asked.has(i)))];
      verdict.stillOpen = {criteria: stuck, interactions: again};
      if (stuck.length || again.length) {
        console.log(`\nSTILL OPEN since the last round (the ceiling; fix all of it before the next run):`);
        if (stuck.length) console.log(`  criteria not rising: ${stuck.map(k => `${k} ${prev.scores[k]}→${s[k]}`).join(', ')}. Apply every fix that names them, including the small ones.`);
        if (again.length) console.log(`  asked to fix again: ${again.join(', ')}. If a fix was applied and the same problem returns, the structure is wrong (a path that crosses, a layout that differs between states); redesign that part instead of retuning timing.`);
      }
    }
  } else console.error('motion judge model failed on every run.');
}
writeFileSync(join(out, 'motion.json'), JSON.stringify({...report, verdict}, null, 2));
console.log(`\nWritten to ${join(out, 'motion.json')}, motion-board.png and ${pages.length} board page(s)`);
process.exit(violations.length || (verdict && verdict.scores.overall < 9) ? 1 : 0);
