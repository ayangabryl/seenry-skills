#!/usr/bin/env node
/** Check one app design system against assets/systems/CONTRACT.md.
 *  node system_check.mjs assets/systems/<name> [--critic] [--playwright path] [--out dir]
 *  Static: required files and blocks, every contract class styled, no typed colors or sizes outside tokens.css,
 *  one icon set. Rendered (every block and the gallery, 1440 and 390, light and dark): no sideways scroll, no
 *  console errors or failed requests, text contrast, one filled primary per view, no emoji, phone touch targets.
 *  --critic also asks the blind critic to score the dashboard as product UI; it must reach 8. Exits 1 on any failure. */
import {existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, join, basename, dirname} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(['--playwright', '--out']);
const dir = resolve(args.find((a, i) => !a.startsWith('--') && !valued.has(args[i - 1])) || '');
if (!existsSync(join(dir, 'tokens.css'))) { console.error('Usage: node system_check.mjs assets/systems/<name> [--critic]'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const name = basename(dir);
const out = resolve(flag('out', join(process.env.TMPDIR || '/tmp', `seenry-system-${name}`)));
mkdirSync(out, {recursive: true});
const fail = [], warn = [];

const BLOCKS = ['dashboard', 'list-detail', 'detail', 'settings', 'billing', 'onboarding', 'sign-in'];
for (const f of ['SYSTEM.md', 'tokens.css', 'system.css', 'gallery.html', 'preview.png', 'theme.tailwind.css', ...BLOCKS.map(b => `blocks/${b}.html`)])
  if (!existsSync(join(dir, f))) fail.push(`missing ${f}`);

const css = existsSync(join(dir, 'system.css')) ? readFileSync(join(dir, 'system.css'), 'utf8') : '';
const contract = readFileSync(join(here, '../assets/systems/CONTRACT.md'), 'utf8');
const classes = [...new Set([...contract.matchAll(/`(ui-[a-z-]+)/g)].map(m => m[1]))];
const missing = classes.filter(c => !new RegExp(`\\.${c}(?![a-z-])`).test(css));
if (missing.length) fail.push(`contract classes not styled in system.css: ${missing.join(', ')}`);

// Typed values: colors anywhere outside tokens.css, and lengths or durations other than 0 and 1px hairlines.
const typed = (text, where) => {
  const body = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '').replace(/url\([^)]*\)/g, '');
  const colors = body.match(/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(/gi) || [];
  const lengths = (body.match(/(?<![\w-])\d*\.?\d+(?:px|ms|s)\b/g) || []).filter(v => !/^(0|1px|0px|0s|0ms)$/.test(v));
  if (colors.length) fail.push(`${where}: ${colors.length} typed color(s) (${[...new Set(colors)].slice(0, 4).join(' ')}); use tokens`);
  if (lengths.length) fail.push(`${where}: ${lengths.length} typed size or duration value(s) (${[...new Set(lengths)].slice(0, 6).join(' ')}); use tokens`);
};
typed(css, 'system.css');
const pages = ['gallery.html', ...BLOCKS.map(b => `blocks/${b}.html`)].filter(f => existsSync(join(dir, f)));
const ICONS = {lucide: /lucide/, tabler: /tabler-icons|class="ti /, phosphor: /phosphor-icons|class="ph[ -]/, remix: /remixicon|class="ri-/, heroicons: /heroicons/, iconoir: /iconoir/, material: /material-symbols/};
const iconSets = new Set();
for (const f of pages) {
  const html = readFileSync(join(dir, f), 'utf8');
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n') + '\n' + [...html.matchAll(/style="([^"]*)"/g)].map(m => m[1].replace(/--[\w-]+:\s*[^;]+;?/g, '')).join(';');
  typed(styles, f);
  for (const [set, re] of Object.entries(ICONS)) if (re.test(html)) iconSets.add(set);
  if (/<script>(?![\s\S]*?(lucide\.createIcons|SeenryUI))[\s\S]*?data-nav/.test(html)) warn.push(`${f}: inline phone-nav script; seenry-ui.js handles [data-nav-toggle]`);
}
if (iconSets.size > 1) fail.push(`more than one icon set across the system: ${[...iconSets].join(', ')}`);

// Craft (CRAFT.md): motion tokens with a reduced-motion branch, layered buttons, real press and overlay motion.
const tokensCss = readFileSync(join(dir, 'tokens.css'), 'utf8');
const missingTokens = ['--dur-press', '--dur-release', '--dur-state', '--dur-overlay', '--dur-slide', '--dur-enter', '--scale-press'].filter(t => !new RegExp(`${t}\\s*:`).test(tokensCss));
if (missingTokens.length) fail.push(`craft: motion tokens missing from tokens.css: ${missingTokens.join(', ')}`);
if (!/prefers-reduced-motion\s*:\s*reduce[\s\S]{0,400}--dur-press\s*:\s*0/.test(tokensCss + css)) fail.push('craft: no reduced-motion branch that sets the durations to 0');
const craft = [
  [/\.ui-button[^{]*data-variant=["']?primary["']?[^{]*::before/, 'the primary button has no ::before hover layer'],
  [/\.ui-button[^{]*data-variant=["']?primary["']?[^{]*::after/, 'the primary button has no ::after sheen layer'],
  [/:active[^{]*\{[^}]*scale\s*:\s*var\(--scale-press\)/, 'no press that scales with --scale-press'],
  [/var\(--dur-press\)/, 'nothing uses --dur-press'],
  [/var\(--dur-release\)/, 'nothing uses --dur-release'],
  [/@starting-style/, 'no @starting-style entrance for dialogs, menus or popovers'],
  [/grid-template-rows/, 'no grid-template-rows height transition for accordions'],
  [/transform-origin/, 'overlays do not grow from their trigger (no transform-origin)'],
];
for (const [re, msg] of craft) if (!re.test(css)) fail.push(`craft: ${msg}`);

// Rendered checks.
async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found. Install it or pass --playwright.'); process.exit(2);
}
const {chromium} = await loadPlaywright();
const browser = await chromium.launch();
function inspect() {
  const lum = c => { if (!/^rgba?\(/.test(c)) return null; const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const alpha = c => { const m = c.match(/[\d.]+/g); return m && m.length > 3 ? Number(m[3]) : 1; };
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && Number(s.opacity) > 0.05 && !el.closest('[hidden],[inert],dialog:not([open]),[popover]:not(:popover-open),[aria-hidden=true]'); };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none') return null; if (alpha(s.backgroundColor) > 0.9) return s.backgroundColor; } return getComputedStyle(document.documentElement).backgroundColor; };
  const faint = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = walker.nextNode());) {
    const el = n.parentElement; if (!n.textContent.trim() || seen.has(el) || !visible(el)) continue; seen.add(el);
    const s = getComputedStyle(el); if (s.color.includes('0, 0, 0, 0') || el.closest('[disabled],[aria-disabled=true],.ui-skeleton,svg')) continue;
    const bg = bgOf(el); if (!bg) continue;
    const a = lum(s.color), b = lum(bg); if (a == null || b == null) continue;
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const large = parseFloat(s.fontSize) >= 18 || (parseFloat(s.fontSize) >= 14 && Number(s.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) faint.push(`${ratio.toFixed(2)}:1 "${n.textContent.trim().slice(0, 30)}"`);
  }
  const primaries = [...document.querySelectorAll('.ui-button[data-variant=primary]')].filter(visible).length;
  const emoji = (document.body.innerText.match(/\p{Extended_Pictographic}/gu) || []).filter(e => !/[©®™↗↘]/.test(e));
  const small = innerWidth < 500 ? [...document.querySelectorAll('button,a[href],input:not([type=hidden]),select,[role=tab],[role=menuitem]')].filter(visible).filter(el => { const r = el.getBoundingClientRect(); const l = el.closest('label'); const lr = l?.getBoundingClientRect(); return Math.min(r.width, r.height) < 24 && !(lr && lr.height >= 44) && !el.closest('p,li>p,td'); }).map(el => (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 24)) : [];
  const primary = [...document.querySelectorAll('.ui-button[data-variant=primary]')].find(visible);
  const ps = primary ? getComputedStyle(primary) : null;
  const flatPrimary = ps ? (ps.backgroundImage === 'none' && ps.boxShadow === 'none') : false;
  const stillPrimary = ps ? ps.transitionDuration.split(',').every(d => parseFloat(d) === 0) : false;
  // Foundations: concentric radii, connected dividers, depth budget (foundations/*.md).
  const px = v => parseFloat(v) || 0;
  const label = el => (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : el.tagName.toLowerCase());
  const radiusIssues = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const r = px(getComputedStyle(el).borderTopLeftRadius); if (r < 2 || r > 200) continue;
    let p = el.parentElement, pr = 0;
    while (p && p !== document.body) { pr = px(getComputedStyle(p).borderTopLeftRadius); if (pr >= 2 && pr <= 200) break; p = p.parentElement; }
    if (!p || p === document.body) continue;
    const a = el.getBoundingClientRect(), b = p.getBoundingClientRect(), bs = getComputedStyle(p);
    const inset = Math.min(a.left - b.left - px(bs.borderLeftWidth), a.top - b.top - px(bs.borderTopWidth));
    if (inset < 0 || inset > 12) continue;
    const ecs = getComputedStyle(el); if (a.width < b.width * 0.4 || (ecs.backgroundColor === 'rgba(0, 0, 0, 0)' && px(ecs.borderTopWidth) === 0 && ecs.backgroundImage === 'none' && !/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(el.tagName))) continue;
    if (Math.abs(a.left - b.left - px(bs.borderLeftWidth) - (a.top - b.top - px(bs.borderTopWidth))) > 3) continue;
    const want = Math.max(0, pr - inset);
    if (Math.abs(r - want) > 2) radiusIssues.push(`${label(el)} ${Math.round(r)}px in ${label(p)} ${Math.round(pr)}px at ${Math.round(inset)}px inset (want ${Math.round(want)}px)`);
  }
  const dividerIssues = [];
  const lined = [...document.querySelectorAll('body *')].filter(el => visible(el) && el.offsetHeight > 0 && (el.tagName === 'HR' || (() => { const cs = getComputedStyle(el); return px(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && px(cs.borderLeftWidth) === 0 && px(cs.borderRightWidth) === 0; })()));
  for (const el of lined) {
    let c = el.parentElement;
    while (c && c !== document.body) { const cs = getComputedStyle(c); if (px(cs.borderLeftWidth) > 0 || px(cs.borderTopLeftRadius) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent')) break; c = c.parentElement; }
    if (!c || c === document.body) continue;
    const cs = getComputedStyle(c), a = el.getBoundingClientRect(), b = c.getBoundingClientRect();
    if (a.width < b.width * 0.5) continue;
    if (c.matches('.ui-shell, main, body > *') || b.width > innerWidth * 0.85) continue;
    const gl = a.left - b.left - px(cs.borderLeftWidth), gr = b.right - px(cs.borderRightWidth) - a.right;
    const pl = px(cs.paddingLeft), pr2 = px(cs.paddingRight);
    const ok = g => Math.abs(g) <= 2;
    const side = (g, pad) => ok(g) || Math.abs(g - pad) <= 2;
    if (!(side(gl, pl) && side(gr, pr2))) dividerIssues.push(`${label(el)} in ${label(c)}: ends ${Math.round(gl)}px / ${Math.round(gr)}px from the edges (padding ${Math.round(pl)}px)`);
  }
  const raised = [...document.querySelectorAll('button, a.ui-button, .ui-button, [role=button]')].filter(visible).filter(el => !el.closest('[popover], dialog, .ui-toast')).filter(el => { const cs = getComputedStyle(el); const blur = (cs.boxShadow.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px/g) || []).some(m => { const n = m.match(/[\d.]+/g).map(Number); return n[2] > 2 && !/inset/.test(cs.boxShadow.split(m)[0].split(',').pop()); }); return blur || /gradient/.test(cs.backgroundImage) && !/gradient\([^)]*transparent[^)]*\)$/.test(cs.backgroundImage); });
  return {radiusIssues: radiusIssues.slice(0, 6), radiusCount: radiusIssues.length, dividerIssues: dividerIssues.slice(0, 6), dividerCount: dividerIssues.length, raisedCount: raised.length, raised: raised.slice(0, 4).map(label), flatPrimary, stillPrimary, overflow: document.documentElement.scrollWidth > innerWidth + 1, faint: faint.slice(0, 6), faintCount: faint.length, primaries, emoji, small: small.slice(0, 6)};
}
for (const f of pages) for (const [w, h] of [[1440, 900], [390, 844]]) for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({viewport: {width: w, height: h}});
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  page.on('requestfailed', r => errors.push(`request failed ${r.url().slice(0, 100)}`));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().slice(0, 100)}`); });
  await page.goto(pathToFileURL(join(dir, f)).href, {waitUntil: 'networkidle'}).catch(e => errors.push(String(e).slice(0, 120)));
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  await page.waitForTimeout(300);
  const r = await page.evaluate(inspect);
  const at = `${f} ${w} ${theme}`;
  if (r.overflow) fail.push(`${at}: page scrolls sideways`);
  if (errors.length) fail.push(`${at}: ${errors.slice(0, 3).join(' | ')}`);
  if (r.faintCount) fail.push(`${at}: ${r.faintCount} text(s) under contrast (${r.faint.join('; ')})`);
  if (f !== 'gallery.html' && r.primaries > 1) fail.push(`${at}: ${r.primaries} filled primary buttons visible`);
  if (r.emoji.length) fail.push(`${at}: emoji in text (${r.emoji.slice(0, 4).join(' ')})`);
  if (r.flatPrimary && theme === 'light' && w === 1440) fail.push(`${at}: craft: the primary button is a flat fill (no gradient or edge)`);
  if (r.stillPrimary && theme === 'light' && w === 1440) fail.push(`${at}: craft: the primary button has no transition`);
  if (theme === 'light' && r.radiusCount) fail.push(`${at}: foundations/radius: ${r.radiusCount} nested radii not concentric (${r.radiusIssues.join('; ')})`);
  if (theme === 'light' && r.dividerCount) fail.push(`${at}: foundations/dividers: ${r.dividerCount} rules neither full bleed nor at the content inset (${r.dividerIssues.join('; ')})`);
  if (theme === 'light' && w === 1440 && f !== 'gallery.html' && r.raisedCount > 1) fail.push(`${at}: foundations/depth: ${r.raisedCount} raised controls in one view (${r.raised.join(', ')}); only the primary is raised`);
  if (r.small.length) fail.push(`${at}: touch targets under 24px (${r.small.join(', ')})`);
  if (w === 1440) {
    const focusIssues = [];
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(320);
      const res = await page.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body) return null;
        const lum = c => { const m = c.match(/[\d.]+/g); if (!m || !/^rgba?\(/.test(c)) return null; const [r, g, b] = m.slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const cs = getComputedStyle(e), ow = parseFloat(cs.outlineWidth) || 0, ring = /0px 0px 0px (\d+(?:\.\d+)?)px/.exec(cs.boxShadow);
        const width = cs.outlineStyle !== 'none' ? ow : ring ? parseFloat(ring[1]) : 0;
        const name = `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 20)}"`;
        if (width < 2) return `${name} ring ${width}px`;
        const color = cs.outlineStyle !== 'none' ? cs.outlineColor : (cs.boxShadow.match(/rgba?\([^)]*\)/) || [''])[0];
        let bgEl = e.parentElement, bg = 'rgb(255, 255, 255)'; while (bgEl) { const b = getComputedStyle(bgEl).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) { bg = b; break; } bgEl = bgEl.parentElement; }
        const a = lum(color), b = lum(bg); if (a != null && b != null && (Math.max(a, b) + .05) / (Math.min(a, b) + .05) < 3) return `${name} ring contrast under 3:1`;
        return '';
      });
      if (res) focusIssues.push(res);
    }
    if (focusIssues.length) fail.push(`${at}: foundations/focus: ${focusIssues.slice(0, 4).join('; ')}`);
  }
  if (f === 'blocks/dashboard.html' && w === 1440 && theme === 'light') await page.screenshot({path: join(out, 'dashboard-1440.png')});
  await page.close();
}
await browser.close();

let critic = null;
if (args.includes('--critic') && existsSync(join(dir, 'blocks/dashboard.html'))) {
  const review = join(out, 'review');
  const character = (readFileSync(join(dir, 'SYSTEM.md'), 'utf8').match(/## Character\s+([\s\S]*?)\n## /) || [, ''])[1].trim();
  writeFileSync(join(out, 'BRIEF.md'), `Surface: app\n\nThe ${name} design system's dashboard block, a reference screen agents build from.\n\n${character}\n`);
  const pw = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  const board = spawnSync('node', [join(here, 'review_board.mjs'), join(dir, 'blocks/dashboard.html'), '--out', review, '--app', ...(pw ? ['--playwright', pw] : [])], {encoding: 'utf8'});
  if (board.status === 2) fail.push('review board could not render the dashboard');
  else {
    const run = spawnSync('node', [join(here, 'critic.mjs'), '--board', join(review, 'board.png'), '--first', join(review, 'first.png'), '--brief', join(out, 'BRIEF.md'), '--out', join(review, 'critic.json')], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit']});
    process.stdout.write(run.stdout);
    try { critic = JSON.parse(readFileSync(join(review, 'critic.json'), 'utf8')); } catch {}
    if (!critic) fail.push('critic did not return a verdict');
    else if (critic.scores.overall < 8) fail.push(`critic ${critic.scores.overall}/10 on the dashboard; product UI must reach 8`);
  }
}

writeFileSync(join(out, 'system-check.json'), JSON.stringify({system: name, fail, warn, critic: critic?.scores || null}, null, 2));
for (const w of warn) console.log(`warn  ${w}`);
for (const f of fail) console.log(`FAIL  ${f}`);
console.log(fail.length ? `\n${name}: ${fail.length} failure(s). Report in ${out}/system-check.json` : `\n${name}: passes the system contract${critic ? ` (critic ${critic.scores.overall}/10)` : ''}.`);
process.exit(fail.length ? 1 : 0);
