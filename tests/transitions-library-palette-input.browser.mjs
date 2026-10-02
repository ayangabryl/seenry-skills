// Trusted input acceptance for the real gallery and a separate native-modal fixture.
// No force clicks, API opening/closing or application-state mutation in the input paths.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const argument = (name, fallback) => { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; };
const playwright = argument('--playwright');
if (!playwright) throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium} = await import(pathToFileURL(resolve(playwright)).href);
const gallery = resolve(argument('--gallery', fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html', import.meta.url))));
const out = resolve(argument('--out', 'palette-input-browser-results')); mkdirSync(out, {recursive: true});
const runtime = join(dirname(gallery), 'seenry-transitions.js'), css = join(dirname(gallery), 'seenry-transitions.css');
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
// Authoring an independent static production fixture is test setup, never an open/close bypass.
const modalFile = join(out, 'native-palette-fixture.html');
writeFileSync(modalFile, `<!doctype html><html lang="en"><meta charset="utf-8"><title>Native command palette regression</title>
<link rel="stylesheet" href="${pathToFileURL(css).href}"><body><button id="modal-trigger" data-st-target="modal-palette">Open commands</button>
<dialog id="modal-palette" data-st="palette" aria-label="Commands"><div class="st-palette-search"><input id="modal-input" data-st-palette-input role="combobox" aria-label="Search commands" aria-controls="modal-options" aria-expanded="false"></div><ul id="modal-options" role="listbox"><li role="option" data-value="one">First command</li><li role="option" data-value="two">Second command</li></ul></dialog>
<script src="${pathToFileURL(runtime).href}"></script></body></html>`);
const browser = await chromium.launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
const results = {runtimeSHA256: sha256(runtime), gallerySHA256: sha256(gallery), browser: browser.version(), runs: []};
const state = page => page.evaluate(() => {
 const root = document.querySelector('#palette-1'), input = document.querySelector('#palette-trigger'), box = document.querySelector('#palette-list');
 const active = input.getAttribute('aria-activedescendant'), option = active && document.getElementById(active);
 return {open: root.dataset.stOpen === 'true', inert: root.inert, resultsInert: box.inert, expanded: input.getAttribute('aria-expanded'),
  focused: document.activeElement === input, activeValue: option?.dataset.value || null, value: input.value, scrollY,
  visibleOptions: [...box.querySelectorAll('[role=option]')].filter(e => !e.hidden && !e.closest('[data-st-ghost]')).map(e => e.dataset.value),
  events: window.paletteEvents, selections: window.paletteSelections};
});
// Native Chromium AX is authoritative for inert subtrees. Playwright1.63's
// DOM-derived ariaSnapshot omits inert from its hidden checks, so retain it only
// as diagnostic context rather than changing product semantics to match it.
async function paletteAX(page) {
 const cdp = await page.context().newCDPSession(page);
 try {
  await cdp.send('DOM.enable'); await cdp.send('Accessibility.enable');
  const {root} = await cdp.send('DOM.getDocument', {depth: 0});
  const {nodeId} = await cdp.send('DOM.querySelector', {nodeId: root.nodeId, selector: '#palette-1'});
  assert(nodeId, 'Native AX scope must resolve to the actual palette');
  const {node} = await cdp.send('DOM.describeNode', {nodeId, depth: -1, pierce: true});
  const ids = new Set(); const walk = n => { if (n.backendNodeId) ids.add(n.backendNodeId); for (const child of n.children || []) walk(child); }; walk(node);
  const {nodeId: listId} = await cdp.send('DOM.querySelector', {nodeId, selector: '#palette-list'});
  assert(listId, 'Native AX scope must contain the actual result list');
  const {node: listNode} = await cdp.send('DOM.describeNode', {nodeId: listId, depth: -1, pierce: true});
  const resultIds = new Set(); const walkResults = n => { if (n.backendNodeId) resultIds.add(n.backendNodeId); for (const child of n.children || []) walkResults(child); }; walkResults(listNode);
  const {nodeIds: optionIds} = await cdp.send('DOM.querySelectorAll', {nodeId: listId, selector: ':scope > [role=option]:not([data-st-ghost])'});
  assert.equal(optionIds.length, 3, 'Native AX result scope must contain all three authored options');
  const authoredOptionBackendIds = [];
  for (const id of optionIds) { const {node: option} = await cdp.send('DOM.describeNode', {nodeId: id}); assert(resultIds.has(option.backendNodeId)); authoredOptionBackendIds.push(option.backendNodeId); }
  const {nodes} = await cdp.send('Accessibility.getFullAXTree');
  return {playwrightSnapshot: await page.locator('#palette-1').ariaSnapshot(), native: nodes.filter(n => ids.has(n.backendDOMNodeId)), resultBackendIds: [...resultIds], authoredOptionBackendIds};
 } finally { await cdp.detach(); }
}
function assertPaletteAX(observed, expanded) {
 const exposed = observed.native.filter(n => !n.ignored);
 const inputs = exposed.filter(n => n.role?.value === 'combobox');
 assert.equal(inputs.length, 1, 'Native tree must expose the persistent search input');
 assert.equal(inputs[0].name?.value, 'Search commands');
 assert.equal(inputs[0].properties?.find(p => p.name === 'expanded')?.value?.value, expanded, 'Native combobox expanded state must match logical state');
 assert.equal(exposed.filter(n => n.role?.value === 'listbox').length, expanded ? 1 : 0, 'Native listbox exposure must follow expanded state');
 assert.equal(exposed.filter(n => n.role?.value === 'option').length, expanded ? 3 : 0, 'Native result exposure must follow expanded state');
 if (!expanded) assert.equal(exposed.filter(n => observed.resultBackendIds.includes(n.backendDOMNodeId)).length, 0, 'Closed result subtree must expose no native AX nodes, including result text');
}
const open = page => page.waitForFunction(() => document.querySelector('#palette-1').dataset.stOpen === 'true');
const closed = page => page.waitForFunction(() => document.querySelector('#palette-1').dataset.stOpen === 'false');
const settle = page => page.evaluate(async () => {
 const root = document.querySelector('#palette-1');
 await Promise.all(root.getAnimations({subtree: true}).filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
 await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
});
try {
 for (const width of [320, 720, 1440]) for (const theme of ['light', 'dark']) for (const motion of ['reduce', 'no-preference']) {
  const context = await browser.newContext({viewport: {width, height: 1000}, colorScheme: theme, reducedMotion: motion});
  const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  page.setDefaultTimeout(5000); await page.route(/^https?:/, route => route.abort());
  await page.addInitScript(() => {
   window.paletteEvents = []; window.paletteSelections = [];
   for (const type of ['pointerdown', 'click', 'keydown', 'input']) document.addEventListener(type, e => {
    if (e.target.id === 'palette-trigger' || e.target.closest?.('#palette-list')) window.paletteEvents.push({type, trusted: e.isTrusted, target: e.target.id, key: e.key});
   }, true);
   document.addEventListener('st:palette-select', e => window.paletteSelections.push(e.detail.value));
  });
  const run = {width, theme, motion, checks: [], status: 'running'}; results.runs.push(run);
  try {
   await page.goto(pathToFileURL(gallery).href); await page.evaluate(async () => {await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));});
   let s = await state(page); assert.equal(s.scrollY, 0, 'initialization must not scroll the page');
   assert.equal(s.open, false); assert.equal(s.expanded, 'false'); assert.equal(s.inert, false); assert.equal(s.resultsInert, true); assert.equal(s.focused, false);
   run.checks.push('initial collapsed ARIA/results state and scrollY=0');
   const input = page.locator('#palette-trigger');
   await input.click(); await open(page); await settle(page); s = await state(page);
   assert.equal(s.focused, true); assert.equal(s.expanded, 'true'); assert.equal(s.resultsInert, false); assert.equal(s.activeValue, 'project');
   assert(s.events.some(e => e.type === 'click' && e.trusted), 'opening must receive a trusted pointer click');
   run.openAX = await paletteAX(page); assertPaletteAX(run.openAX, true);
   run.checks.push('direct trusted pointer click opens');
   await page.keyboard.press('Escape'); await closed(page); await settle(page); s = await state(page);
   assert.equal(s.inert, false); assert.equal(s.resultsInert, true); assert.equal(s.focused, true); assert.equal(s.expanded, 'false'); assert.equal(s.activeValue, null);
   run.closedAX = await paletteAX(page); assertPaletteAX(run.closedAX, false);
   await page.screenshot({path: join(out, `${width}-${theme}-${motion}-closed.png`)});
   await input.click(); await open(page); await settle(page); assert.equal((await state(page)).resultsInert, false);
   run.checks.push('Escape keeps usable focused search; trusted pointer reopens');
   await page.keyboard.press('Escape'); await closed(page); await page.keyboard.press('ArrowDown'); await open(page); await settle(page);
   assert.equal((await state(page)).activeValue, 'project'); await page.keyboard.press('ArrowDown'); assert.equal((await state(page)).activeValue, 'invite');
   await page.keyboard.press('Enter'); await closed(page); s = await state(page); assert.deepEqual(s.selections, ['invite']); assert.equal(s.focused, true);
   run.checks.push('ArrowDown reopens focused search; arrows/Enter select and restore');
   await input.click(); await open(page); await settle(page); await page.locator('#palette-list [data-value=settings]').click(); await closed(page);
   s = await state(page); assert.deepEqual(s.selections, ['invite', 'settings']); assert.equal(s.focused, true);
   await input.click(); await open(page); await page.keyboard.press('Escape'); await closed(page);
   await page.keyboard.type('settings'); await open(page); await settle(page); s = await state(page);
   assert.equal(s.value, 'settings'); assert.equal(s.activeValue, 'settings'); assert.deepEqual(s.visibleOptions, ['settings']);
   assert(s.events.some(e => e.type === 'input' && e.trusted), 'filter must receive trusted editing input');
   run.checks.push('pointer selection recovery and type-to-reopen keep query');
   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A'); await page.keyboard.type('zzzz-no-match');
   s = await state(page); assert.equal(s.activeValue, null); assert.deepEqual(s.visibleOptions, []);
   assert.equal(await input.getAttribute('aria-activedescendant'), null); assert.equal(await page.locator('[data-st-palette-empty]').evaluate(e => e.hidden), false);
   await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await settle(page); s = await state(page);
   assert.equal(s.open, true); assert.deepEqual(s.selections, ['invite', 'settings']); assert.equal(await input.getAttribute('aria-activedescendant'), null);
   assert.equal(await page.locator('#palette-list [data-st-ghost]').count(), 0);
   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A'); await page.keyboard.press('Backspace'); await settle(page); s = await state(page);
   assert.deepEqual(s.visibleOptions, ['project', 'invite', 'settings']); assert.equal(s.activeValue, 'project');
   run.checks.push('normal/reduced no-match filtering ignores paint ghosts, empty Enter does not select, clear restores options');
   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A'); await page.keyboard.insertText('zzzz-no-match');
   await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A'); await page.keyboard.insertText('settings');
   const inventory = await page.locator('#palette-list').evaluate(box => {
    const options = [...box.querySelectorAll('[role=option]')];
    return {authored: options.filter(o => !o.closest('[data-st-ghost]')).length, ghosts: options.filter(o => o.closest('[data-st-ghost]')).length};
   });
   assert.equal(inventory.authored, 3); assert(inventory.ghosts <= 3, 'rapid query change must not recursively clone generated options');
   await settle(page); s = await state(page); assert.equal(s.activeValue, 'settings'); assert.deepEqual(s.visibleOptions, ['settings']);
   run.checks.push('trusted rapid no-match/query replacement keeps authored option inventory');
   await page.keyboard.press('Escape'); await closed(page); await input.click(); await open(page);
   // Issue the real pointer input immediately after Escape; an in-flight exit may still exist.
   await page.keyboard.press('Escape'); await input.click(); await open(page); await settle(page); s = await state(page);
   assert.equal(s.inert, false); assert.equal(s.resultsInert, false); assert.equal(s.expanded, 'true');
   run.checks.push('rapid Escape/pointer reopen stays open after old exit');
   // Focus is setup on the enclosing article, not on the input; the actual opener is trusted Tab.
   await page.goto(pathToFileURL(gallery).href); await page.locator('[data-key=palette]').focus(); await page.keyboard.press('Tab'); await open(page); await settle(page);
   s = await state(page); assert.equal(s.focused, true); assert.equal(s.expanded, 'true');
   assert.equal(await page.evaluate(() => document.documentElement.dataset.stInputMode), 'keyboard');
   await page.keyboard.press('Escape'); await closed(page); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await open(page);
   assert.equal((await state(page)).focused, true); run.checks.push('real Tab entry and Tab-away/Shift+Tab recovery');
   await page.screenshot({path: join(out, `${width}-${theme}-${motion}-keyboard-open.png`)});
   await page.goto(pathToFileURL(modalFile).href); await page.locator('#modal-trigger').click();
   await page.waitForFunction(() => document.querySelector('#modal-palette').matches(':modal'));
   assert.equal(await page.evaluate(() => document.activeElement.id), 'modal-input');
   await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('#modal-palette').open);
   assert.equal(await page.evaluate(() => document.activeElement.id), 'modal-trigger');
   await page.locator('#modal-trigger').click(); await page.waitForFunction(() => document.querySelector('#modal-palette').matches(':modal'));
   assert.equal(await page.locator('#modal-input').getAttribute('aria-expanded'), 'true');
   run.checks.push('production native showModal/Escape/focus/reopen');
   assert.deepEqual(errors, []); run.status = 'passed';
  } catch (error) { run.status = 'failed'; run.error = error.message; run.state = await state(page).catch(() => null); await page.screenshot({path: join(out, `${width}-${theme}-${motion}-FAILED.png`)}).catch(() => {}); }
  finally {run.pageErrors = errors; await context.close(); writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 2));}
 }
} finally {await browser.close();}
console.log(JSON.stringify({source: results.runtimeSHA256, passed: results.runs.filter(r => r.status === 'passed').length, failed: results.runs.filter(r => r.status === 'failed').length, output: out}, null, 2));
if (results.runs.some(r => r.status !== 'passed')) process.exitCode = 1;
