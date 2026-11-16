// The agent's eyes on the canvas: render, tree, verify, diff and compare in a real browser.
// Skips when Playwright is not installed; CI passes it with SEENRY_PLAYWRIGHT.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync} from 'node:fs';
import {deflateSync, crc32} from 'node:zlib';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn, spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';

const script = resolve('skills/seenry-canvas/scripts/canvas.mjs');
process.env.SEENRY_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'seenry-no-link-'));
let playwright = process.env.SEENRY_PLAYWRIGHT;
if (!playwright) { try { playwright = createRequire(join(process.cwd(), 'x.js')).resolve('playwright'); } catch {} }
const skip = playwright ? false : 'Playwright is not installed';
// The pair judge is a model call; tests switch it off or answer for it with SEENRY_PAIR_STUB.
const runWith = (env, ...args) => spawnSync(process.execPath, [script, ...args, ...(process.env.SEENRY_PLAYWRIGHT ? ['--playwright', process.env.SEENRY_PLAYWRIGHT] : [])], {encoding: 'utf8', timeout: 120000, env: {...process.env, SEENRY_PAIR_JUDGE: 'off', ...env}});
const run = (...args) => runWith({}, ...args);

/** Resolves when the canvas server is listening; fails with its output when it exits first. */
function started(server) {
  return new Promise((done, fail) => {
    let err = '';
    server.stderr?.on('data', d => { err += d; });
    server.stdout.on('data', d => { if (String(d).includes('Seenry canvas')) done(); });
    server.on('exit', code => fail(new Error(`The canvas server exited (${code}) before listening: ${err.trim()}`)));
  });
}

function project() {
  const root = mkdtempSync(join(tmpdir(), 'seenry-agent-')), dir = join(root, '.seenry', 'canvas');
  assert.equal(run('init', dir).status, 0);
  mkdirSync(join(dir, '01-flow'));
  const head = '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../tokens.css"><style>body{margin:0;background:var(--color-bg);color:var(--color-text);font-family:var(--font-body)}main{padding:var(--space-8)}</style>';
  writeFileSync(join(dir, '01-flow', '01-good.phone.html'), head + '<title>Good</title><main><label>Your name<input id="name"></label><h1 class="text-title" id="t">Count weeks</h1><a href="#" style="display:inline-flex;min-height:44px;min-width:44px;color:inherit">Start</a><a id="go" href="02-bad.phone.html" data-spec="Tap: next" style="display:inline-block;padding:var(--space-3) var(--space-5);background:var(--color-accent);color:var(--color-on-accent)">Start</a></main>');
  writeFileSync(join(dir, '01-flow', '02-bad.phone.html'), head + '<title>Bad</title><main><p id="faint" style="color:#ddd">Faint text</p><a id="dead" href="03-missing.phone.html">Next</a><div style="width:600px">wide</div></main>');
  return {root, dir};
}

test('render writes a PNG per screen, device and mode', {skip}, () => {
  const {dir} = project();
  const out = run('render', '01-flow/01-good', '--mode', 'both', '--json', '--dir', dir);
  assert.equal(out.status, 0, out.stderr);
  const shots = JSON.parse(out.stdout);
  assert.deepEqual(shots.map(s => s.mode), ['light', 'dark']);
  for (const s of shots) assert.ok(readFileSync(s.file).subarray(1, 4).toString() === 'PNG');
});

test('tree names the variable behind each style and flags typed values', {skip}, () => {
  const {dir} = project();
  const [good, bad] = JSON.parse(run('tree', '01-flow', '--json', '--dir', dir).stdout);
  const start = good.nodes.find(n => n.id === 'go');
  assert.equal(start.styles.background.token, '--color-accent');
  assert.equal(start.spec, 'Tap: next');
  assert.match(bad.nodes.find(n => n.id === 'faint').styles.color.token, /^!rgb\(221, 221, 221\)$/);
});

test('verify fails on contrast, overflow and broken links', {skip}, () => {
  const {dir} = project();
  const out = run('verify', '--json', '--dir', dir);
  assert.equal(out.status, 1);
  const kinds = JSON.parse(out.stdout).issues.filter(i => i.frame === '01-flow/02-bad').map(i => i.kind);
  for (const k of ['contrast', 'overflow', 'link']) assert.ok(kinds.includes(k), `expected a ${k} issue in ${kinds}`);
  assert.ok(!JSON.parse(out.stdout).issues.some(i => i.frame === '01-flow/01-good' && i.severity === 'error'));
});

test('diff reports what changed since the last render', {skip}, () => {
  const {dir} = project();
  assert.match(run('diff', '01-flow/01-good', '--dir', dir).stdout, /baseline/);
  const file = join(dir, '01-flow', '01-good.phone.html');
  writeFileSync(file, readFileSync(file, 'utf8').replace('Count weeks', 'Count every single week'));
  const [r] = JSON.parse(run('diff', '01-flow/01-good', '--json', '--dir', dir).stdout);
  assert.ok(r.changed > 0 && existsSync(r.file));
});

test('compare lists what the build gets wrong against the design', {skip}, async t => {
  const {root, dir} = project();
  const build = join(root, 'build'); mkdirSync(build);
  writeFileSync(join(build, 'tokens.css'), readFileSync(join(dir, 'tokens.css')));
  writeFileSync(join(build, 'index.html'), readFileSync(join(dir, '01-flow', '01-good.phone.html'), 'utf8').replace('../tokens.css', 'tokens.css').replace('class="text-title"', 'class="text-title" style="font-size:20px"'));
  const server = createServer((req, res) => { const f = join(build, req.url === '/' ? 'index.html' : req.url.slice(1)); res.end(existsSync(f) ? readFileSync(f) : ''); }).listen(0, '127.0.0.1');
  t.after(() => server.close());
  await new Promise(r => server.on('listening', r));
  const out = spawn(process.execPath, [script, 'compare', '01-flow/01-good', `http://127.0.0.1:${server.address().port}/`, '--json', '--dir', dir, ...(process.env.SEENRY_PLAYWRIGHT ? ['--playwright', process.env.SEENRY_PLAYWRIGHT] : [])]);
  let text = ''; out.stdout.on('data', d => { text += d; });
  const code = await new Promise(r => out.on('exit', r));
  assert.equal(code, 1);
  const result = JSON.parse(text);
  assert.ok(result.different.some(d => /font-size: design 32px, build 20px/.test(d)), result.different.join('\n'));
  assert.ok(existsSync(result.files.diff));
});

test('pair puts a screen beside its reference at the same width', {skip}, () => {
  const {dir} = project();
  const shot = run('render', '01-flow/01-good', '--json', '--dir', dir);
  assert.equal(shot.status, 0, shot.stderr);
  writeFileSync(join(dir, 'refs', 'ref.png'), readFileSync(JSON.parse(shot.stdout)[0].file));
  const out = run('pair', '01-flow/01-good', 'ref.png', '--json', '--dir', dir);
  assert.equal(out.status, 0, out.stderr);
  const result = JSON.parse(out.stdout), png = readFileSync(result.file);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.ok(png.readUInt32BE(16) > 2 * 390, 'two screens side by side');
  assert.notEqual(run('pair', '01-flow/01-good', 'missing.png', '--dir', dir).status, 0);
});

test('verify warns about boxed columns, uneven steps and a rule that runs past its content', {skip}, () => {
  const {dir} = project();
  const head = '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../tokens.css"><title>Lines</title>';
  writeFileSync(join(dir, '01-flow', '01-good.phone.html'), head + '<style>body{margin:0;background:var(--color-bg);color:var(--color-text)}.h{margin:0 var(--space-4);padding:0 var(--space-4);border-bottom:1px solid var(--color-border)}.f{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid var(--color-border);margin:var(--space-4)}.f div{border-right:1px solid var(--color-border)}.f div+div{padding-left:var(--space-4)}.g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-4);margin:var(--space-4)}.g div{border-top:1px solid var(--color-border)}</style><div class="h">Head</div><div class="f"><div>One</div><div>Two</div><div>Three</div></div><div class="g"><div>One</div><div>Two</div><div>Three</div></div>');
  const out = run('verify', '01-flow/01-good', '--json', '--dir', dir);
  const lines = JSON.parse(out.stdout).issues.filter(i => i.kind === 'line');
  assert.equal(lines.length, 3, JSON.stringify(lines));
  assert.ok(lines.some(i => /past its content/.test(i.message) && /div\.h/.test(i.selector)));
  assert.ok(lines.some(i => /both directions/.test(i.message) && /div\.f/.test(i.selector)));
  assert.ok(lines.some(i => /uneven steps/.test(i.message)));
  assert.ok(!lines.some(i => /div\.g/.test(i.selector)), 'column rules with a gap are fine');
});

test('screens are judged settled: an entrance animation does not fail contrast', {skip}, () => {
  const {dir} = project();
  writeFileSync(join(dir, '01-flow', '01-good.phone.html'), '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../tokens.css"><title>Enter</title><style>body{background:var(--color-bg);color:var(--color-text)}p{animation:in 4s both}@keyframes in{from{opacity:0}}</style><p>Arriving text</p>');
  const out = run('verify', '01-flow/01-good', '--json', '--dir', dir);
  assert.ok(!JSON.parse(out.stdout).issues.some(i => i.kind === 'contrast'), out.stdout);
});

// Options are where a design is first shown. With --studio, verify checks the study behind them.
function optionsProject() {
  const {root, dir} = project();
  mkdirSync(join(dir, '02-home.options'));
  const head = '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../tokens.css"><style>body{margin:0;background:var(--color-bg);color:var(--color-text);font-family:var(--font-body)}h1{font-size:var(--size-56);line-height:1.05;max-width:20ch;margin:0}</style>';
  writeFileSync(join(dir, '02-home.options', 'a.html'), head + '<title>A</title><main><h1 class="text-display">One short line</h1><div data-seenry-product class="panel"><svg width="600" height="200" viewBox="0 0 600 200"><rect x="10" y="40" width="40" height="160"/><rect x="70" y="80" width="40" height="120"/><rect x="130" y="20" width="40" height="180"/></svg></div></main>');
  return {root, dir};
}
const teardown = `# Teardown
## Reference A
- 22 UI elements in the app window, 2 visualisation types. Headline 64px, weight 300, 2 lines. 1 hue.
- Interlock: grass in front of the app over its lower 40%. Motif repeats in 3 tiles. 6 logos as marks. Pill tabs, 4 of them.
## Reference B
- 18 UI elements, 3 visualisation types, 4 metric cards. Headline 68px, weight 300, 2 lines. 1 hue on black.
- Interlock: translucent at the top, melts into the page over 120px. Motif: the logo tile repeats. 6 logos. Button 40px with a 28px icon tile.`;

test('verify --studio blocks options with no teardown and a thin product view', {skip}, () => {
  const {dir} = optionsProject();
  const out = run('verify', '02-home', '--studio', '--json', '--dir', dir);
  assert.equal(out.status, 1, out.stderr);
  const kinds = JSON.parse(out.stdout).issues.filter(i => i.severity === 'error').map(i => i.kind);
  assert.ok(kinds.includes('teardown'), `expected a teardown error in ${kinds}`);
  assert.ok(kinds.includes('product'), `expected a product error in ${kinds}`);
});

test('verify accepts a measured teardown and exempts the wireframe stage', {skip}, () => {
  const {root, dir} = optionsProject();
  writeFileSync(join(root, '.seenry', 'teardown.md'), teardown);
  let issues = JSON.parse(run('verify', '02-home', '--studio', '--json', '--dir', dir).stdout).issues;
  assert.ok(!issues.some(i => i.kind === 'teardown'), JSON.stringify(issues));
  writeFileSync(join(root, '.seenry', 'teardown.md'), '');
  writeFileSync(join(dir, 'canvas.json'), JSON.stringify({stage: 'wireframe'}));
  issues = JSON.parse(run('verify', '02-home', '--studio', '--json', '--dir', dir).stdout).issues;
  assert.ok(!issues.some(i => ['teardown', 'product', 'pair'].includes(i.kind)), JSON.stringify(issues));
});

test('verify puts each option beside a reference itself and blocks on the judge\'s verdict', {skip}, () => {
  const {root, dir} = optionsProject();
  writeFileSync(join(root, '.seenry', 'teardown.md'), teardown);
  writeFileSync(join(dir, 'refs', 'a.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
  const verdicts = env => JSON.parse(runWith(env, 'verify', '02-home', '--studio', '--json', '--dir', dir).stdout).issues.filter(i => i.kind === 'pair-verdict');
  let found = verdicts({SEENRY_PAIR_JUDGE: '', SEENRY_PAIR_STUB: JSON.stringify({less_finished: true, gaps: ['product UI: 14 kinds of interface, yours has 1']})});
  assert.ok(found.some(i => i.severity === 'error' && /less finished than a\.png: product UI: 14 kinds/.test(i.message)), JSON.stringify(found));
  assert.ok(existsSync(join(dir, '.renders', 'pair', 'pair.json')));
  // The verdict stands until the screen changes; then verify pairs it again.
  found = verdicts({SEENRY_PAIR_JUDGE: '', SEENRY_PAIR_STUB: JSON.stringify({})});
  assert.ok(found.some(i => i.severity === 'error'), 'an unchanged screen keeps its verdict');
  const screen = join(dir, '02-home.options', 'a.html');
  writeFileSync(screen, readFileSync(screen, 'utf8') + '<!-- fixed -->');
  found = verdicts({SEENRY_PAIR_JUDGE: '', SEENRY_PAIR_STUB: JSON.stringify({})});
  assert.ok(!found.some(i => i.severity === 'error'), JSON.stringify(found));
  // With no judge the pair is still rendered, and verify says it was not judged.
  writeFileSync(screen, readFileSync(screen, 'utf8') + '<!-- again -->');
  found = verdicts({});
  assert.ok(found.some(i => i.severity === 'warn' && /not judged/.test(i.message)), JSON.stringify(found));
});

test('with no teardown, verify writes the crops and the sections to fill in', {skip}, () => {
  const {root, dir} = optionsProject();
  const shot = run('render', '02-home/a', '--json', '--dir', dir);
  writeFileSync(join(dir, 'refs', 'ref-one.png'), readFileSync(JSON.parse(shot.stdout)[0].file));
  writeFileSync(join(dir, 'refs', 'ref-two.png'), readFileSync(JSON.parse(shot.stdout)[0].file));
  const issues = JSON.parse(run('verify', '02-home', '--studio', '--json', '--dir', dir).stdout).issues;
  const t = issues.find(i => i.kind === 'teardown');
  assert.match(t.message, /just written with 2 reference sections/);
  const text = readFileSync(join(root, '.seenry', 'teardown.md'), 'utf8');
  assert.match(text, /## ref-one\n[\s\S]*UI elements: __ kinds/);
  assert.ok(existsSync(join(dir, 'refs', 'crops', 'ref-one.product.png')));
  // Filling it in is the agent's work: a second run does not overwrite, it reports the blanks left.
  const again = JSON.parse(run('verify', '02-home', '--studio', '--json', '--dir', dir).stdout).issues.find(i => i.kind === 'teardown');
  assert.match(again.message, /\d+ blanks \(__\) still to replace/);
});

test('verify puts each option beside the worked example and blocks its reskin, except for the example\'s own product', {skip}, () => {
  const {root, dir} = optionsProject();
  writeFileSync(join(root, '.seenry', 'teardown.md'), teardown);
  const env = {SEENRY_PAIR_JUDGE: '', SEENRY_PAIR_STUB: JSON.stringify({}), SEENRY_EXAMPLE_STUB: JSON.stringify({reskin: true, reskin_why: 'the same hero and section order'})};
  let found = JSON.parse(runWith(env, 'verify', '02-home', '--studio', '--json', '--dir', dir).stdout).issues.filter(i => i.kind === 'pair-verdict');
  assert.ok(found.some(i => i.severity === 'error' && /worked example with a new skin/.test(i.message)), JSON.stringify(found));
  const {root: own, dir: ownDir} = optionsProject();
  writeFileSync(join(own, '.seenry', 'teardown.md'), teardown);
  writeFileSync(join(own, '.seenry', 'brief.md'), '# Brief\n\nLanding page for Ledgerline, a 13-week cash forecast.\n');
  found = JSON.parse(runWith(env, 'verify', '02-home', '--studio', '--json', '--dir', ownDir).stdout).issues.filter(i => i.kind === 'pair-verdict');
  assert.ok(!found.some(i => /worked example/.test(i.message)), JSON.stringify(found));
});

test('no model judges by default: verify pairs nothing and asks for no teardown, and --judge runs the judge alone', {skip}, () => {
  const {root, dir} = optionsProject();
  writeFileSync(join(dir, 'refs', 'ref.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
  // A stub that would block, were the judge asked.
  const env = {SEENRY_PAIR_JUDGE: '', SEENRY_PAIR_STUB: JSON.stringify({less_finished: true, gaps: ['product UI: 14 kinds, yours has 1']})};
  const out = runWith(env, 'verify', '02-home', '--json', '--dir', dir);
  const result = JSON.parse(out.stdout);
  assert.equal(result.judged, false);
  assert.ok(!result.issues.some(i => /^pair|teardown/.test(i.kind)), JSON.stringify(result.issues));
  assert.ok(!existsSync(join(dir, '.renders', 'pair')), 'nothing was paired');
  assert.ok(!existsSync(join(root, '.seenry', 'teardown.md')), 'no teardown was written');
  assert.ok(result.issues.some(i => i.kind === 'product'), 'the rule checks still run');
  assert.match(runWith(env, 'verify', '02-home', '--quick', '--dir', dir).stdout, /No model judged these options: the person does/);
  // Nobody to review: --judge asks the blind judge and still writes no teardown; a recorded unattended round does the same.
  const judged = JSON.parse(runWith(env, 'verify', '02-home', '--judge', '--json', '--dir', dir).stdout);
  assert.equal(judged.judged, true);
  assert.ok(judged.issues.some(i => i.kind === 'pair-verdict' && i.severity === 'error'), JSON.stringify(judged.issues));
  assert.ok(!judged.issues.some(i => i.kind === 'teardown'));
  const {dir: later} = optionsProject();
  writeFileSync(join(later, 'refs', 'ref.png'), readFileSync(join(dir, 'refs', 'ref.png')));
  writeFileSync(join(later, 'canvas.json'), JSON.stringify({unattended: {at: new Date().toISOString(), reason: 'a headless run'}}));
  assert.equal(JSON.parse(runWith(env, 'verify', '02-home', '--json', '--dir', later).stdout).judged, true);
});

// What a weaker model skips unless a script holds it: the idea in a line, a real image in the hero of each sketch,
// and the image coming back below the hero once the pick is a full page.
function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(pixel(x, y), y * (w * 3 + 1) + 1 + x * 3);
  const chunk = (type, data) => { const body = Buffer.concat([Buffer.from(type), data]), out = Buffer.alloc(8 + data.length + 4); out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE(crc32(body) >>> 0, 8 + data.length); return out; };
  const head = Buffer.alloc(13); head.writeUInt32BE(w, 0); head.writeUInt32BE(h, 4); head.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const IDEA = 'Cash under the waterline: the forecast sinks into a painted sea, drawn behind the app and in front of it';
const HEROES = {
  sea: '<img src="../img/sea.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">',
  flat: '<img src="../img/flat.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">',
  ramp: '<div style="position:absolute;inset:0;background:url(../img/ramp.png) center / cover"></div>',
  gradient: '<div style="position:absolute;inset:0;background:linear-gradient(#0e2a8a,#dce6ff)"></div>',
  missing: '<img src="../img/not-made-yet.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%">',
};
const sketchHead = (title, metas) => `<!doctype html><meta charset="utf-8"><title>${title}</title>${metas}<link rel="stylesheet" href="../tokens.css"><style>body{margin:0;background:var(--color-bg);color:var(--color-text);font-family:var(--font-body)}section{position:relative;height:900px;overflow:hidden}</style>`;
function sketchProject() {
  const {root, dir} = project();
  mkdirSync(join(dir, '02-home.options')); mkdirSync(join(dir, 'img'));
  copyFileSync(resolve('skills/seenry/assets/examples/waterline/sea.jpg'), join(dir, 'img', 'sea.jpg'));
  writeFileSync(join(dir, 'img', 'flat.png'), png(96, 64, () => [31, 79, 224]));
  writeFileSync(join(dir, 'img', 'ramp.png'), png(96, 64, (x, y) => [14 + y * 3, 42 + y * 3, 138 + y]));
  const sketch = (name, hero, idea = IDEA) => writeFileSync(join(dir, '02-home.options', `${name}.html`), sketchHead(name, `<meta name="seenry-fidelity" content="sketch">${idea ? `<meta name="seenry-idea" content="${idea}">` : ''}`) + `<section>${HEROES[hero]}</section>`);
  return {root, dir, sketch};
}
const sketchIssues = (dir, ...more) => JSON.parse(run('verify', '02-home', '--json', '--dir', dir, ...more).stdout).issues.filter(i => ['idea', 'hero-image', 'idea-return'].includes(i.kind));

test('verify blocks a sketch with no idea line, and one whose idea is a label', {skip}, () => {
  const {dir, sketch} = sketchProject();
  sketch('tide', 'sea', ''); sketch('dusk', 'sea', 'Bold and blue'); sketch('reef', 'sea');
  const found = sketchIssues(dir);
  const tide = found.find(i => i.frame === '02-home/tide'), dusk = found.find(i => i.frame === '02-home/dusk');
  assert.equal(tide.kind, 'idea'); assert.equal(tide.severity, 'error');
  assert.match(tide.message, /^No idea line \(needs 1\)\. Add to the <head> of 02-home\.options\/tide\.html: <meta name="seenry-idea" content="/);
  assert.match(dusk.message, /^Its idea line is 3 words \(needs 6 or more\)/);
  assert.ok(!found.some(i => i.frame === '02-home/reef'), JSON.stringify(found));
});

test('verify blocks a sketch whose hero holds a gradient, a flat block or a missing file, with the command to run', {skip}, () => {
  const {dir, sketch} = sketchProject();
  for (const hero of ['gradient', 'flat', 'ramp', 'missing', 'sea']) sketch(hero, hero);
  const found = sketchIssues(dir), of = name => found.filter(i => i.frame === `02-home/${name}`);
  assert.match(of('gradient')[0].message, /^No generated or own image in the hero: the first screen holds 0 images covering a tenth of it or more \(needs 1\); a CSS gradient is not an image\./);
  assert.match(of('flat')[0].message, /flat\.png is a flat block or a plain gradient \(1 colours, 0% textured\), a placeholder/);
  assert.match(of('ramp')[0].message, /ramp\.png is a flat block or a plain gradient/);
  assert.match(of('missing')[0].message, /not-made-yet\.jpg is not a file in the project/);
  for (const name of ['gradient', 'flat', 'ramp', 'missing']) {
    assert.equal(of(name)[0].kind, 'hero-image'); assert.equal(of(name)[0].severity, 'error');
    assert.match(of(name)[0].message, /node \S*image\.mjs --batch \S*img[\\/]jobs\.json --background/);
    assert.match(of(name)[0].message, /node \S*image\.mjs --template/);
  }
  assert.deepEqual(of('sea'), [], 'a generated image in the hero passes');
  // While a background batch is running the message says to wait for it, not to start another.
  writeFileSync(join(dir, '..', 'images.pending'), '1');
  assert.match(sketchIssues(dir).find(i => i.frame === '02-home/missing').message, /Images are still generating\. Run: node \S*image\.mjs --wait/);
  // A wireframe round has no look yet, so nothing here applies.
  writeFileSync(join(dir, 'canvas.json'), JSON.stringify({stage: 'wireframe'}));
  assert.deepEqual(sketchIssues(dir), []);
});

test('verify blocks a full page whose hero image never returns below the hero', {skip}, () => {
  const {dir} = sketchProject();
  mkdirSync(join(dir, '03-home'));
  const lower = '<section><h2>Moves</h2><p>Delay a purchase order.</p></section><section><h2>Pricing</h2><p>Three bands.</p></section>';
  const page = (name, extra, idea = IDEA) => writeFileSync(join(dir, '03-home', `${name}.html`), sketchHead(name, idea ? `<meta name="seenry-idea" content="${idea}">` : '') + `<section>${HEROES.sea}</section>${lower}${extra}`);
  page('stops', '');
  page('returns', '<section><img src="../img/sea.jpg" alt="" style="width:100%;height:400px;object-fit:cover;object-position:center bottom"></section>');
  page('motif', '<section><svg data-seenry-motif width="600" height="120" viewBox="0 0 600 120"><path d="M0 60 Q150 0 300 60 T600 60" fill="none" stroke="currentColor"/></svg></section>');
  page('plain', '', '');
  const found = JSON.parse(run('verify', '03-home', '--json', '--dir', dir).stdout).issues.filter(i => ['idea', 'hero-image', 'idea-return'].includes(i.kind));
  const stops = found.filter(i => i.frame === '03-home/stops');
  assert.equal(stops.length, 1); assert.equal(stops[0].severity, 'error'); assert.equal(stops[0].kind, 'idea-return');
  assert.match(stops[0].message, /^The idea stops at the hero: the hero image sea\.jpg returns 0 times below the first screen \(needs 1 or more\)/);
  assert.match(stops[0].message, /data-seenry-motif/);
  assert.match(stops[0].message, /Then run: node \S*canvas\.mjs verify 03-home\/stops$/);
  for (const name of ['returns', 'motif']) assert.ok(!found.some(i => i.frame === `03-home/${name}` && i.severity === 'error'), JSON.stringify(found));
  assert.ok(found.some(i => i.frame === '03-home/returns' && i.severity === 'warn' && /returns once/.test(i.message)));
  assert.ok(!found.some(i => i.frame === '03-home/plain'), 'a screen with no idea line is not a page from this path');
});

// The person's side: pick under the selected option, point at an element, send; and the side-pane layout.
test('the canvas UI picks an option, turns a click on an element into a chip, and sends both to wait', {skip}, async t => {
  const {dir} = project();
  mkdirSync(join(dir, '02-home.options'));
  const option = name => `<!doctype html><meta charset="utf-8"><title>Home · ${name}</title><meta name="seenry-axis" content="${name} axis"><h1 data-seenry-part="Hero">${name} headline</h1>`;
  writeFileSync(join(dir, '02-home.options', 'a-tide.html'), option('Tide'));
  writeFileSync(join(dir, '02-home.options', 'b-dusk.html'), option('Dusk'));
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(5900 + Math.floor(Math.random() * 90))], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const url = `http://127.0.0.1:${JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port}/`;
  const {chromium} = createRequire(import.meta.url)(playwright);
  let browser; try { browser = await chromium.launch(); } catch { browser = await chromium.launch({channel: 'chrome'}); }
  t.after(() => browser.close());
  const errors = [], page = await browser.newPage({viewport: {width: 1440, height: 900}});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.locator('.frame[data-id="02-home/a-tide"] .lab').click();
  await page.locator('#pick button', {hasText: 'Pick Tide'}).click();
  await page.frameLocator('.frame[data-id="02-home/a-tide"] iframe').locator('h1').click();
  assert.equal(await page.locator('#chips .chip').innerText(), 'Tide · h1');
  await page.fill('#general', 'Lighter headline');
  assert.match(await page.locator('#status').innerText(), /1 pick · 1 note/);
  await page.locator('#send').click();
  await page.waitForFunction(() => /Saved|Sent/.test(document.getElementById('status').textContent));
  const feedback = JSON.parse(readFileSync(join(dir, 'feedback.json'), 'utf8'));
  assert.equal(feedback.picks['02-home'], '02-home/a-tide');
  assert.deepEqual([feedback.notes[0].frame, feedback.notes[0].selector, feedback.notes[0].text], ['02-home/a-tide', 'h1', 'Lighter headline']);
  await page.setViewportSize({width: 640, height: 900});
  await page.waitForFunction(() => document.body.dataset.narrow === 'true');
  assert.equal(await page.locator('#side').isVisible(), false, 'no list of its own in a side pane');
  assert.deepEqual(await page.locator('#tabs [role="tab"]').allInnerTexts(), ['Tide', 'Dusk']);
  assert.equal(await page.locator('#stage iframe').count(), 1, 'one screen at a time');
  assert.deepEqual(errors, []);
});

test('the canvas tucks approved sections away, pins sent comments, captions short and explains Share', {skip}, async t => {
  const {dir} = project();
  mkdirSync(join(dir, '02-home.options'));
  const option = (name, axis) => `<!doctype html><meta charset="utf-8"><title>Home · ${name}</title><meta name="seenry-axis" content="${axis}"><style>body{margin:0}h1{margin:200px 0 0 300px}</style><h1>${name} headline</h1>`;
  writeFileSync(join(dir, '02-home.options', 'a-tide.html'), option('Tide', 'One cobalt field: a painted sea sets the floor'));
  writeFileSync(join(dir, '02-home.options', 'b-dusk.html'), option('Dusk', 'Black page, one band of dusk light'));
  const later = Date.now() + 60000;
  writeFileSync(join(dir, 'review.json'), JSON.stringify({frames: {'01-flow/01-good': {status: 'approved', at: later}, '01-flow/02-bad': {status: 'approved', at: later}}}));
  writeFileSync(join(dir, 'feedback.json'), JSON.stringify({stage: '', picks: {}, frames: [], riff: [], general: '', at: new Date(later).toISOString(),
    notes: [{frame: '02-home/b-dusk', target: '“Dusk headline”', selector: 'h1', text: 'Warmer'}]}));
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(5700 + Math.floor(Math.random() * 90))], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const url = `http://127.0.0.1:${JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port}/`;
  const {chromium} = createRequire(import.meta.url)(playwright);
  let browser; try { browser = await chromium.launch(); } catch { browser = await chromium.launch({channel: 'chrome'}); }
  t.after(() => browser.close());
  const errors = [], page = await browser.newPage({viewport: {width: 1440, height: 900}});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('.frame[data-id="02-home/b-dusk"] .pin');
  assert.equal(await page.locator('.frame[data-id="01-flow/01-good"]').isVisible(), false, 'an approved section takes no room under the decision');
  assert.equal(await page.locator('.frame[data-id="02-home/a-tide"] .cap').innerText(), 'One cobalt field');
  const pin = await page.locator('.frame[data-id="02-home/b-dusk"] .pin').evaluate(n => [n.textContent, parseFloat(n.style.left), parseFloat(n.style.top)]);
  assert.equal(pin[0], '1');
  assert.ok(pin[1] > 300 && pin[1] < 900 && pin[2] >= 180 && pin[2] < 260, `pinned at the headline: ${pin}`);
  assert.equal(await page.locator('#sync-text').innerText(), 'Synced with the folder');
  await page.locator('#list button[data-section="01-flow"]').click();
  await page.waitForFunction(() => !document.querySelector('.frame[data-id="01-flow/01-good"]').hidden);
  await page.locator('#share').click();
  await page.waitForSelector('#share-pop:not([hidden])');
  assert.match(await page.locator('#share-pop').innerText(), /only works on this computer[\s\S]*sync\.mjs link/);
  assert.deepEqual(errors, []);
});

// The live build: a skeleton in the planned proportions, each save patched in place, the cursor on the next block.
async function canvasPage(t, dir, {width = 1440, height = 900, reducedMotion = 'no-preference', colorScheme = 'light', query = ''} = {}) {
  const server = spawn(process.execPath, [script, 'serve', dir, '--port', String(5300 + Math.floor(Math.random() * 300))], {stdio: 'pipe'});
  t.after(() => server.kill());
  await started(server);
  const url = `http://127.0.0.1:${JSON.parse(readFileSync(join(dir, '.canvas.json'), 'utf8')).port}/${query}`;
  const {chromium} = createRequire(import.meta.url)(playwright);
  let browser; try { browser = await chromium.launch(); } catch { browser = await chromium.launch({channel: 'chrome'}); }
  t.after(() => browser.close());
  const errors = [], context = await browser.newContext({viewport: {width, height}, reducedMotion, colorScheme}), page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  return {page, errors};
}
const SHELL = '<!doctype html><html><head><meta charset="utf-8"><title>Pricing</title><link rel="stylesheet" href="../tokens.css"><style>body{margin:0;background:var(--color-bg);color:var(--color-text);font-family:var(--font-body)}nav{height:60px}.hero{height:400px}.plans{display:grid;grid-template-columns:repeat(3,320px);gap:24px}</style></head><body>\n<!-- next -->\n</body></html>';
const PARTS = {Nav: '<nav data-seenry-part="Nav">Tally</nav>', Hero: '<section class="hero" data-seenry-part="Hero"><h1>Pay for the habits you keep</h1></section>', Plans: '<section class="plans" data-seenry-part="Plans"><div>Solo</div><div>Pair</div><div>House</div></section>'};
const withParts = (...names) => SHELL.replace('<!-- next -->', names.map(n => PARTS[n]).join('\n') + '\n<!-- next -->');
const frameState = (page, id) => page.evaluate(id => {
  const fr = document.querySelector('.frame[data-id="' + id + '"] .body iframe:not([data-next])'), d = fr && fr.contentDocument;
  if (!d || !d.body) return {blank: !!document.querySelector('.frame[data-id="' + id + '"] .blank'), blocks: [...document.querySelectorAll('.frame[data-id="' + id + '"] .sk > div')].map(b => [b.textContent, b.offsetHeight])};
  fr.__probe = fr.__probe || Math.random();
  const cur = d.getElementById('seenry-cursor'), next = d.querySelector('#seenry-skel > div');
  return {probe: fr.__probe, frames: document.querySelectorAll('.frame[data-id="' + id + '"] iframe').length, parts: [...d.querySelectorAll('[data-seenry-part]')].map(n => n.dataset.seenryPart),
    blocks: [...d.querySelectorAll('#seenry-skel > div')].map(b => [b.dataset.name, b.offsetHeight]), scrollY: d.defaultView.scrollY,
    cursorOnNext: !!(cur && next && Math.abs(cur.getBoundingClientRect().top - next.getBoundingClientRect().top) < 80), animations: d.getAnimations().filter(a => a.playState === 'running' && !(a.animationName === 'seenry-shimmer')).length};
}, id);

test('a planned screen builds in place: skeleton in its proportions, each part patched in without a reload', {skip}, async t => {
  const {dir} = project();
  assert.equal(run('plan', '03-pricing/01-plans.html', '--parts', 'Nav:60,Hero:400,Plans:300', '--dir', dir).status, 0);
  const {page, errors} = await canvasPage(t, dir);
  const id = '03-pricing/01-plans';
  await page.waitForSelector(`.frame[data-id="${id}"] .sk > div`);
  assert.deepEqual((await frameState(page, id)).blocks, [['Nav', 60], ['Hero', 400], ['Plans', 300]], 'the placeholder shows the planned parts at their heights');
  mkdirSync(join(dir, '03-pricing'));
  const file = join(dir, '03-pricing', '01-plans.html');
  writeFileSync(file, SHELL);
  await page.waitForFunction(id => { const d = document.querySelector('.frame[data-id="' + id + '"] iframe')?.contentDocument; return d && d.querySelectorAll('#seenry-skel > div').length === 3 && !document.querySelector('.frame[data-id="' + id + '"] .blank'); }, id);
  const shell = await frameState(page, id);
  assert.deepEqual(shell.blocks, [['Nav', 60], ['Hero', 400], ['Plans', 300]], 'the shell carries the same skeleton');
  for (const [i, names] of [['Nav'], ['Nav', 'Hero']].entries()) {
    const at = Date.now();
    writeFileSync(file, withParts(...names));
    await page.waitForFunction(([id, n]) => document.querySelector('.frame[data-id="' + id + '"] iframe:not([data-next])').contentDocument.querySelectorAll('[data-seenry-part]').length === n, [id, names.length]);
    assert.ok(Date.now() - at < 1200, `part ${i + 1} showed after ${Date.now() - at} ms`);
    await page.waitForTimeout(450);
    const now = await frameState(page, id);
    assert.equal(now.probe, shell.probe, 'the same document: no reload, no white frame');
    assert.equal(now.frames, 1);
    assert.deepEqual(now.parts, names);
    assert.deepEqual(now.blocks.map(b => b[0]), ['Nav', 'Hero', 'Plans'].filter(n => !names.includes(n)), 'the landed part replaced its block');
    assert.ok(now.cursorOnNext, 'the cursor waits on the next block');
    assert.equal(now.scrollY, 0, 'no scroll jump');
  }
  // A change to the head cannot be patched: it reloads hidden and keeps the skeleton.
  writeFileSync(file, withParts('Nav', 'Hero').replace('</style>', 'h1{letter-spacing:-.02em}</style>'));
  await page.waitForFunction(([id, p]) => { const fr = document.querySelector('.frame[data-id="' + id + '"] iframe:not([data-next])'); return fr && fr.__probe !== p && fr.contentDocument.querySelector('#seenry-skel > div'); }, [id, shell.probe]);
  writeFileSync(file, withParts('Nav', 'Hero', 'Plans'));
  await page.waitForFunction(id => !document.querySelector('.frame[data-id="' + id + '"] iframe:not([data-next])').contentDocument.querySelector('#seenry-skel > div'), id);
  assert.deepEqual(errors, []);
});

test('with reduced motion the build lands with no movement', {skip}, async t => {
  const {dir} = project();
  run('plan', '03-pricing/01-plans.html', '--parts', 'Nav,Hero,Plans', '--dir', dir);
  const {page, errors} = await canvasPage(t, dir, {reducedMotion: 'reduce'});
  await page.waitForSelector('.frame[data-id="03-pricing/01-plans"] .sk > div');
  mkdirSync(join(dir, '03-pricing'));
  const file = join(dir, '03-pricing', '01-plans.html');
  writeFileSync(file, SHELL);
  const id = '03-pricing/01-plans';
  await page.waitForFunction(id => document.querySelector('.frame[data-id="' + id + '"] iframe')?.contentDocument?.querySelector('#seenry-skel > div'), id);
  writeFileSync(file, withParts('Nav'));
  await page.waitForFunction(id => document.querySelector('.frame[data-id="' + id + '"] iframe').contentDocument.querySelector('[data-seenry-part]'), id);
  const s = await frameState(page, id);
  assert.equal(s.animations, 0, 'nothing animates');
  assert.equal(await page.evaluate(id => getComputedStyle(document.querySelector('.frame[data-id="' + id + '"] iframe').contentDocument.querySelector('#seenry-skel > div'), '::after').animationName, id), 'none', 'the shimmer holds still');
  assert.deepEqual(errors, []);
});

test('each save is checked for layout problems at its width and at 390, on the frame and for the agent', {skip}, async t => {
  const {dir} = project();
  mkdirSync(join(dir, '03-pricing'));
  const file = join(dir, '03-pricing', '01-plans.html');
  writeFileSync(file, withParts('Nav', 'Hero', 'Plans'));
  // Headless, with no canvas open: three 320px columns run past a 390 screen.
  let out = run('problems', '03-pricing', '--dir', dir);
  assert.equal(out.status, 1, out.stderr);
  assert.match(out.stdout, /03-pricing\/01-plans  1 problem\n  390   Plans › section\.plans: Its content is wider than the screen: runs to \d+px of 390/);
  const {page, errors} = await canvasPage(t, dir);
  const id = '03-pricing/01-plans';
  await page.waitForSelector(`.frame[data-id="${id}"] .lab .pb`);
  assert.equal(await page.locator(`.frame[data-id="${id}"] .lab .pb`).innerText(), '1 layout problem');
  assert.match(await page.locator(`.frame[data-id="${id}"] .cap`).innerText(), /^390 · Plans › section\.plans: Its content is wider than the screen/);
  writeFileSync(file, withParts('Nav', 'Hero', 'Plans').replace('repeat(3,320px)', 'repeat(auto-fit,minmax(min(100%,240px),1fr))').replace('<h1>', '<h1 style="height:20px;overflow:hidden;font-size:40px;line-height:60px">'));
  await page.waitForFunction(id => /^1440 · Hero › h1: Text cut off/.test(document.querySelector('.frame[data-id="' + id + '"] .cap').textContent), id, {timeout: 15000});
  assert.equal(await page.evaluate(id => document.querySelector('.frame[data-id="' + id + '"] iframe').contentDocument.querySelector('h1').dataset.seenryProblem, id), 'clipped', 'the element is outlined on the screen');
  out = run('problems', id, '--json', '--dir', dir);
  const listed = JSON.parse(out.stdout);
  assert.equal(listed.screens[0].from, 'canvas', 'the open canvas already checked this save');
  assert.deepEqual(listed.screens[0].results.flatMap(r => r.problems.map(p => r.width + ' ' + p.kind)), ['1440 clipped', '390 clipped']);
  writeFileSync(file, withParts('Nav', 'Hero', 'Plans').replace('repeat(3,320px)', 'repeat(auto-fit,minmax(min(100%,240px),1fr))'));
  await page.waitForFunction(id => !document.querySelector('.frame[data-id="' + id + '"] .lab .pb'), id);
  assert.equal(run('problems', id, '--dir', dir).status, 0);
  assert.deepEqual(errors, []);
});

test('in an agent app\'s pane the canvas follows the host theme and drops its own title', {skip}, async t => {
  const {dir} = project();
  const {page, errors} = await canvasPage(t, dir, {width: 1200, colorScheme: 'dark', query: '?embed=1'});
  await page.waitForSelector('.frame iframe');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(12, 12, 12)', 'the canvas is dark with the host');
  assert.equal(await page.locator('#side .sb-head b').isVisible(), false, 'no second title bar');
  assert.equal(await page.locator('#side').isVisible(), false, 'the screen list starts closed in a pane');
  await page.waitForFunction(() => document.querySelector('.frame[data-id="01-flow/01-good"] iframe').contentDocument?.documentElement.dataset.theme === 'dark');
  await page.emulateMedia({colorScheme: 'light'});
  await page.waitForFunction(() => document.querySelector('.frame[data-id="01-flow/01-good"] iframe').contentDocument.documentElement.dataset.theme !== 'dark');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(239, 239, 237)');
  await page.setViewportSize({width: 900, height: 900});
  await page.waitForFunction(() => document.body.dataset.narrow === 'true', null, {timeout: 3000});
  // ?theme= wins over the host.
  await page.goto(page.url().replace('?embed=1', '?embed=1&theme=dark'));
  await page.waitForSelector('#stage iframe');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(12, 12, 12)');
  assert.deepEqual(errors, []);
});
