#!/usr/bin/env node
/** Audit any rendered page: system drift, ink-level alignment and optical alignment, at several widths.
 *
 *  node audit_page.mjs <url | file.html> [--widths 1440,390] [--root body] [--components "[data-component]"]
 *                      [--json report.json] [--shots dir] [--playwright /path/to/playwright/index.mjs] [--strict]
 *
 *  Works on any project: a dev server URL, a deployed page or a local HTML file. Needs Playwright; it is found in the
 *  current project, via --playwright, or via SEENRY_PLAYWRIGHT. Findings are candidates to confirm on a 2x screenshot.
 *  --strict exits 1 when any candidate remains, for CI in the user's project. */
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {collectSystemAudit} from './system_audit.mjs';
import {collectOpticalAudit} from './optical_audit.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--strict'));
if (!target) { console.error('Usage: node audit_page.mjs <url | file.html> [--widths 1440,390] [--json out.json] [--shots dir]'); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
const widths = flag('widths', '1440,390').split(',').map(Number).filter(Boolean);

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found. Install it in the project (npm i -D playwright && npx playwright install chromium) or pass --playwright.');
  process.exit(2);
}

const {chromium} = await loadPlaywright();
const browser = await chromium.launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
const shots = flag('shots');
if (shots) mkdirSync(shots, {recursive: true});
const report = {url, widths: {}};
let problems = 0;
try {
  for (const width of widths) {
    const page = await browser.newPage({viewport: {width, height: width < 768 ? 844 : 900}, deviceScaleFactor: 2});
    await page.goto(url, {waitUntil: 'networkidle'});
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const options = {root: flag('root', 'body'), components: flag('components', '[data-component]')};
    const system = await page.evaluate(collectSystemAudit, {...options, base: 4});
    const optical = await page.evaluate(collectOpticalAudit, {root: options.root});
    if (shots) await page.screenshot({path: join(shots, `page-${width}.png`), fullPage: true});
    report.widths[width] = {system, optical};
    await page.close();

    const t = system.totals, lines = [], seen = new Map();
    lines.push(`\n■ ${width}px  sizes ${t.fontSizes} · weights ${t.fontWeights} · families ${t.families} · radii ${t.radii} · shadows ${t.shadows} · colors ${t.colors}${system.horizontalOverflow ? ' · HORIZONTAL OVERFLOW' : ''}`);
    const issue = text => { if (seen.has(text)) { seen.set(text, seen.get(text) + 1); return; } seen.set(text, 1); problems++; lines.push('  ' + text); };
    for (const o of system.offGrid.slice(0, 12)) issue(`off-grid   ${o.element} ${o.property} ${o.value}`);
    for (const n of system.nestedRadius) issue(`radius     ${n.child} r${n.childRadius} inside ${n.parent} r${n.parentRadius} (inset ${n.inset}) → r${n.expected}`);
    for (const w of system.wrappedControls) issue(`wrap       "${w.text}" wraps onto ${w.lines} lines`);
    for (const c of system.perComponent) {
      if (c.overLimit) issue(`type       ${c.component}: sizes ${c.sizes.join('/')} weights ${c.weights.join('/')}`);
      const a = c.alignment; if (!a) continue;
      for (const an of a.anchors) {
        const centered = an.relation === 'beside' && Math.abs(an.centerOffset) <= 1;
        if (an.relation === 'beside' && !centered && Math.abs(an.topOffset) > 1) issue(`anchor     ${c.component}: ${an.topItem} is ${an.topOffset}px from the top of "${an.media}" (and ${an.centerOffset}px off its center)`);
        if (an.relation === 'beside' && !centered && Math.abs(an.bottomOffset) > 1 && Math.abs(an.bottomOffset) < 12) issue(`anchor     ${c.component}: ${an.bottomItem} is ${an.bottomOffset}px from the bottom of "${an.media}"`);
        if (an.relation === 'below' && Math.abs(an.leftOffset) > 1 && Math.abs(an.leftOffset) < 12) issue(`anchor     ${c.component}: ${an.leftItem} starts ${an.leftOffset}px from the left edge of "${an.media}"`);
      }
      for (const m of a.nearMisses.slice(0, 6)) issue(`near-miss  ${c.component}: ${m.a} vs ${m.b} (${m.side}, ${m.off}px)`);
      if (a.insets && a.anchors.length) { const v = Object.values(a.insets); if (Math.max(...v) - Math.min(...v) > 4) lines.push(`  inset      ${c.component}: ${JSON.stringify(a.insets)} (confirm the difference is deliberate)`); }
    }
    for (const f of optical.iconOnly) issue(`optical    ${f.control} (${f.shape}): ${f.fix}`);
    for (const f of optical.iconText) issue(`optical    icon beside "${f.control}": ${f.fix}`);
    for (const f of optical.controlText) issue(`optical    "${f.control}": ${f.issue}${f.fix ? ' → ' + f.fix : f.insets ? ` ${JSON.stringify(f.insets)}, expected ${f.expected}` : ''}`);
    for (const f of optical.sideBearing) issue(`optical    "${f.text}": ${f.fix}`);
    console.log(lines.map(l => { const n = seen.get(l.trim()); return n > 1 ? `${l} (×${n})` : l; }).join('\n'));
  }
} finally { await browser.close(); }
const out = flag('json');
if (out) writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(`\n${problems} candidate issue(s). Confirm each on a 2x screenshot before changing it.${out ? ` Full report: ${out}` : ''}`);
if (args.includes('--strict') && problems) process.exit(1);
