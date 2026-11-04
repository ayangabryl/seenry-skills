#!/usr/bin/env node
/** Show sketches to the person in any agent host: lay two or three option files side by side, labelled A, B, C.
 *
 *  node sketch.mjs a.html b.html [c.html] --captions "Glazed key|Flat clay|Ink primary" [--recommend B]
 *                  [--size phone|desktop] [--out .seenry/sketch] [--open]
 *
 *  Writes board.html (live options in frames) and board.png (one image) to --out and prints both paths.
 *  --open opens board.html in the default browser. Hosts with an inline visual tool can show the sketch there instead;
 *  this is the path for terminals (Codex CLI, Claude Code CLI, Cursor) and for sending an image to a phone. */
import {mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {resolve, join, relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const files = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))).map(f => resolve(f));
if (files.length < 2 || files.length > 3 || files.some(f => !existsSync(f))) { console.error('Usage: node sketch.mjs a.html b.html [c.html] --captions "A|B|C" [--recommend B] [--size phone|desktop] [--open]'); process.exit(2); }
const labels = 'ABC'.split('').slice(0, files.length);
const captions = (flag('captions', '') || '').split('|');
const recommend = (flag('recommend', '') || '').toUpperCase();
const phone = flag('size', 'phone') !== 'desktop';
const [w, h] = phone ? [390, 844] : [1280, 800];
const out = resolve(flag('out', '.seenry/sketch')); mkdirSync(out, {recursive: true});
markWorkDir(out);

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const caption = (l, i) => `${l} · ${esc(captions[i] || `Option ${l}`)}${l === recommend ? ' (recommended)' : ''}`;
const scale = phone ? 0.75 : 0.42;
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sketch</title>
<style>body{margin:0;padding:24px;background:#f4f4f2;font:15px/1.4 system-ui,sans-serif;color:#1a1a1a}
.g{display:flex;gap:24px;flex-wrap:wrap;justify-content:center}figure{margin:0;display:grid;gap:12px;justify-items:center}
.f{width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px;overflow:hidden;border-radius:${phone ? 28 : 12}px;border:1px solid #d8d8d4;background:#fff}
.f iframe{width:${w}px;height:${h}px;border:0;transform:scale(${scale});transform-origin:0 0}
figcaption{font-weight:500}.r figcaption{color:#0b5cad}.r .f{outline:2px solid #0b5cad;outline-offset:3px}</style>
<div class="g">${files.map((f, i) => `<figure${labels[i] === recommend ? ' class="r"' : ''}><div class="f"><iframe src="${esc(relative(out, f))}" title="Option ${labels[i]}"></iframe></div><figcaption>${caption(labels[i], i)}</figcaption></figure>`).join('')}</div>`;
writeFileSync(join(out, 'board.html'), html);

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) { try { return await import(pathToFileURL(resolve(explicit)).href); } catch { return null; } }
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch { return null; }
}
const pw = await loadPlaywright();
if (pw) {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({viewport: {width: phone ? 1100 : 1700, height: 300}, deviceScaleFactor: 2});
  await page.goto(pathToFileURL(join(out, 'board.html')).href, {waitUntil: 'networkidle'});
  await page.waitForTimeout(800);
  await page.screenshot({path: join(out, 'board.png'), fullPage: true});
  await browser.close();
} else console.error('Playwright not found: wrote board.html only (npm i -D playwright, or pass --playwright).');

if (args.includes('--open')) spawn(process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open', [join(out, 'board.html')], {detached: true, stdio: 'ignore'}).unref();
console.log(`Sketch: ${join(out, 'board.html')}${pw ? `\nImage:  ${join(out, 'board.png')}` : ''}\n${labels.map((l, i) => caption(l, i)).join('\n')}`);
