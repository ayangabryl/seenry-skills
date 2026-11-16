// The approved example must pass the gate it teaches, and every rule narrowed to let it pass must still block the
// slop it was written for. Skips when Playwright is not installed; CI passes it with SEENRY_PLAYWRIGHT.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';

const board = resolve('skills/seenry/scripts/review_board.mjs');
const example = resolve('skills/seenry/assets/examples/waterline');
let playwright = process.env.SEENRY_PLAYWRIGHT;
if (!playwright) { try { playwright = createRequire(join(process.cwd(), 'x.js')).resolve('playwright'); } catch {} }
if (!playwright) { try { playwright = createRequire(import.meta.url).resolve('playwright'); } catch {} }
const skip = playwright ? false : 'Playwright is not installed';

// The flags check.mjs passes for a software landing page.
function run(page) {
  const out = mkdtempSync(join(tmpdir(), 'seenry-example-'));
  const r = spawnSync(process.execPath, [board, page, '--out', out, '--studio', '--software', '--playwright', playwright], {encoding: 'utf8', timeout: 180000});
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return {report: JSON.parse(readFileSync(join(out, 'board.json'), 'utf8')), log: r.stdout};
}

test('the bundled Waterline example passes the board with zero blockers', {skip}, () => {
  const {report, log} = run(join(example, 'screen.html'));
  assert.equal(report.blockers, 0, log);
  // The image returns eight times and the product view sets 12px labels: both are the example's point.
  const html = readFileSync(join(example, 'screen.html'), 'utf8');
  assert.equal(html.match(/src="sea\.jpg"/g).length, 8);
  assert.match(html, /@media \(max-width: 760px\)/);
});

test('every rule narrowed for the example still blocks the slop it was written for', {skip}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'seenry-slop-'));
  const sea = pathToFileURL(join(example, 'sea.jpg')).href, shot = pathToFileURL(join(example, 'waterline-example.jpg')).href;
  const white = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="#fff"/></svg>');
  const tile = `<div style="position:relative;height:320px;overflow:hidden"><img src="${shot}" alt="" style="position:absolute;left:0;bottom:0;width:100%;height:60%;object-fit:cover;object-position:center 100%;mask-image:linear-gradient(to bottom,transparent,black 40%)"><p style="font-size:16px">Text</p></div>`;
  const line = 'M40 36 Q92 60 143 98 L143 40 Q255 95 365 168 L365 80 Q395 95 423 114 L423 40 Q530 92 630 158';
  writeFileSync(join(dir, 'index.html'), `<!doctype html><html lang="en"><body style="margin:0;font:400 16px/1.5 Arial;color:#111;background:#fff">
<header style="padding:24px 48px;display:flex;gap:16px"><a href="#" style="background:#2866ee;color:#fff;padding:14px 20px">Start</a><a href="#" style="background:#2866ee;color:#fff;padding:14px 20px">Book</a><a href="#" style="color:#2866ee">Sign in</a><button style="background:#2866ee;color:#fff;border:0;padding:14px 20px;font-size:16px">Try it</button></header>
<main style="padding:0 48px">
<img src="${sea}" alt="" style="display:block;width:100%;height:560px;object-fit:cover">
<section style="padding:96px 0"><p style="font-size:14px;margin:0">Scheduling for clinics</p><h2 style="font-size:48px;font-weight:300;margin:8px 0 0">A plain line above a title</h2>
  <p style="font-size:12px">A paragraph of marketing copy set at twelve pixels outside any product view.</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"><div><img src="${sea}" alt="" style="display:block;width:100%;height:300px;object-fit:cover"><p style="font-weight:500">Card one</p></div><div><p style="font-weight:600">Card two</p></div><div><p>Card three</p></div></div></section>
<section style="padding:96px 0"><span style="display:inline-flex;align-items:center;gap:8px;padding:4px 12px;border-radius:999px;background:#eef;font-size:12px;letter-spacing:.12em;text-transform:uppercase"><svg width="12" height="12"><circle cx="6" cy="6" r="5"/></svg>Features</span><h2 style="font-size:48px;font-weight:300;margin:8px 0 24px">An uppercase chip above a title</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${tile.repeat(3)}</div>
  <p style="font-size:16px"><i style="display:inline-block;width:24px;height:2px;background:#111;vertical-align:middle"></i> A notebook that thinks with you</p></section>
<section style="padding:96px 0"><div data-seenry-product style="width:900px;height:400px;border:1px solid #ccc"><span style="font-size:11px">Tiny label in the app</span> <span style="font-size:12px">Fine label in the app</span></div>
  <div style="position:relative;width:600px;height:300px;margin-top:48px"><img src="${white}" alt="" style="display:block;width:600px;height:300px"><p style="position:absolute;left:40px;top:120px;margin:0;font-size:18px;color:oklch(1 0 0)">White words on a white picture</p></div>
  <div style="position:relative;width:640px;margin-top:48px"><svg width="640" height="230" viewBox="0 0 640 230" fill="none" style="display:block"><path d="${line}" stroke="#111" stroke-width="2"/></svg>
    <span style="position:absolute;left:70px;top:45px;font-size:14px">Bare label</span><span style="position:absolute;left:225px;top:88px;font-size:14px;background:#fff;padding:2px 6px">Carded</span>
    <div style="position:absolute;left:0;top:0;font-size:14px;text-align:right;width:32px"><div>90%</div><div style="margin-top:60px">50%</div><div style="margin-top:60px">10%</div></div></div></section>
</main></body></html>`);
  const {report, log} = run(join(dir, 'index.html'));
  const d = report.widths[1440], f = d.findings, has = (list, re) => list.some(x => re.test(x));
  assert.ok(report.blockers > 0, log);
  assert.equal(d.weights.length, 4, 'four text weights still count');
  assert.ok(has(f.repeatedPhoto, /img .* repeats img/) && f.repeatedPhoto.length >= 3, JSON.stringify(f.repeatedPhoto));
  assert.ok(has(f.repeatedPhoto, /same crop in a sibling tile/), JSON.stringify(f.repeatedPhoto));
  assert.ok(has(f.eyebrow, /Scheduling for clinics/) && has(f.eyebrow, /Features/), JSON.stringify(f.eyebrow));
  assert.ok(has(f.defaultColor, /blue-600/), JSON.stringify(f.defaultColor));
  assert.ok(has(f.small, /12px p/) && has(f.small, /11px span "Tiny label/) && !has(f.small, /Fine label/), JSON.stringify(f.small));
  assert.ok(has(f.dashLabel, /A notebook/), JSON.stringify(f.dashLabel));
  assert.ok(has(f.textOverImage, /White words/), JSON.stringify(f.textOverImage));
  assert.ok(has(f.chartCollision, /"Bare label"/) && !has(f.chartCollision, /Carded/), JSON.stringify(f.chartCollision));
  assert.deepEqual(f.bareChart, [], 'a right-aligned value axis is one line');
});
