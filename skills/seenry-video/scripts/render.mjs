#!/usr/bin/env node
/** Render a seekable HTML film frame by frame into an H.264 MP4, or export stills.
 *
 *  node render.mjs --dir film/                        -> film/film.silent.mp4
 *  node render.mjs --dir film/ --stills 2,9.5,31      -> film/stills/*.png
 *  node render.mjs --dir film/ --contact 12           -> film/stills/contact.png (12 evenly spaced frames)
 *
 *  Options: --page index.html  --out film.silent.mp4  --fps 30  --crf 16  --playwright /path/to/playwright/index.mjs
 *  The page must define window.__film = {duration, width, height}, window.__seek(t) and window.__ready (a promise).
 *  Frames are rendered by seeking, never by real-time capture, so the output is deterministic and never drops frames.
 *  Needs ffmpeg on PATH and Playwright (npm i -D playwright && npx playwright install chromium). */
import {spawn, spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {extname, join, resolve, normalize, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const root = resolve(flag('dir', '.'));
const pageName = flag('page', 'index.html');
const fps = Number(flag('fps', '30')), crf = String(flag('crf', '16'));
const out = resolve(root, flag('out', 'film.silent.mp4'));
const stills = (flag('stills', '') || '').split(',').filter(Boolean).map(Number);
const contact = Number(flag('contact', '0'));
if (!existsSync(join(root, pageName))) { console.error(`Missing ${join(root, pageName)}.`); process.exit(2); }
if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg not found on PATH.'); process.exit(2); }

async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [root, process.cwd(), resolve(process.cwd(), '..')])
    for (const name of ['playwright', 'playwright-core'])
      try { return await import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve(name)).href); } catch {}
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright && npx playwright install chromium, or pass --playwright).'); process.exit(2);
}

const types = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav'};
const server = createServer(async (req, res) => {
  const path = normalize(join(root, decodeURIComponent(req.url.split('?')[0])));
  if (!path.startsWith(root + sep) && path !== root) { res.writeHead(403); return res.end(); }
  try { const body = await readFile(path); res.writeHead(200, {'content-type': types[extname(path).toLowerCase()] || 'application/octet-stream'}); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));

const playwright = await loadPlaywright();
const chromium = playwright.chromium || playwright.default?.chromium;   // CommonJS entries arrive under default
const browser = await chromium.launch({args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required']});
try {
  const probe = await browser.newPage();
  const errors = [];
  probe.on('pageerror', e => errors.push(e.message));
  await probe.goto(`http://127.0.0.1:${server.address().port}/${pageName}?render`);
  const film = await probe.evaluate(() => window.__film);
  if (!film?.duration || !film?.width || !film?.height) throw Error('The page must define window.__film = {duration, width, height}.');
  const page = await browser.newPage({viewport: {width: film.width, height: film.height}, deviceScaleFactor: 1});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/${pageName}?render`);
  await page.evaluate(() => window.__ready);
  await page.waitForTimeout(300);
  const at = async t => { await page.evaluate(t => window.__seek(t), t); };

  if (stills.length || contact) {
    const dir = join(root, 'stills'); await mkdir(dir, {recursive: true});
    const times = stills.length ? stills : Array.from({length: contact}, (_, i) => +(film.duration * (i + .5) / contact).toFixed(2));
    const files = [];
    for (const t of times) { await at(t); const f = join(dir, `${t.toFixed(2).padStart(6, '0')}.png`); await page.screenshot({path: f}); files.push(f); }
    if (contact) {
      const cols = Math.ceil(Math.sqrt(contact)), rows = Math.ceil(contact / cols);
      const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex',
        files.map((_, i) => `[${i}:v]scale=640:-2[v${i}]`).join(';') + ';' + files.map((_, i) => `[v${i}]`).join('') +
        `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) ? Array.from({length: i % cols}, () => 'w0').join('+') : '0'}_${Math.floor(i / cols) ? Array.from({length: Math.floor(i / cols)}, () => 'h0').join('+') : '0'}`).join('|')}:fill=black`,
        join(dir, 'contact.png')]);
      if (r.status) throw Error('contact sheet failed: ' + r.stderr);
      console.log(`contact sheet ${cols}×${rows} at ${times.join(', ')}s -> ${join(dir, 'contact.png')}`);
    } else console.log(`${files.length} stills -> ${dir}`);
  } else {
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-vf', 'scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-movflags', '+faststart', out], {stdio: ['pipe', 'inherit', 'inherit']});
    const total = Math.round(fps * film.duration);
    for (let f = 0; f < total; f++) {
      await at(f / fps);
      const buf = await page.screenshot({type: 'jpeg', quality: 95});
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % (fps * 5) === 0) console.log(`frame ${f}/${total}`);
    }
    ff.stdin.end();
    const code = await new Promise(r => ff.on('close', r));
    if (code) throw Error('ffmpeg exited with ' + code);
    console.log(`${total} frames, ${film.duration}s at ${fps}fps, ${film.width}×${film.height} -> ${out}`);
  }
  if (errors.length) { console.error('Page errors while rendering:\n' + [...new Set(errors)].join('\n')); process.exitCode = 1; }
} finally { await browser.close(); server.close(); }
