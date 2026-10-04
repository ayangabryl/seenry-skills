// Diagnostic only. Calls native Close.focus before reading computed styles or
// animations. These instrumented observations never replace the native gate or
// its preserved, uninstrumented unsupported-320-1 failure artifact.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, readdirSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const arg = (name, fallback) => {
 const index = process.argv.indexOf(name);
 if (index < 0) return fallback;
 assert(process.argv[index + 1] && !process.argv[index + 1].startsWith('--'), `Missing value for ${name}`);
 return process.argv[index + 1];
};
assert(arg('--playwright'), 'Pass the existing Playwright module with --playwright');
assert(arg('--gallery'), 'Pass the exact frozen gallery with --gallery');
const gallery = resolve(arg('--gallery'));
const out = resolve(arg('--out', 'card-focus-transfer-diagnostic-results'));
const harness = fileURLToPath(new URL('./transitions-library-card-anchor-fallback.browser.mjs', import.meta.url));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const sourceNames = ['gallery.html', 'gallery.js', 'seenry-transitions.js', 'seenry-transitions.css'];
const sourceHashes = () => Object.fromEntries(sourceNames.map(name => [name, sha(join(dirname(gallery), name))]));
const source = sourceHashes();
assert.equal(source['seenry-transitions.js'], '4105cbddf552c049e13493cd1f9fc5551778ec4a9242d5f50c96f20faf356f09', 'Diagnostic requires the frozen 4105cbdd runtime');

// Reuse the real fallback gate's full paint/focus capture without importing its
// top-level browser runner. Fail closed if either extraction anchor changes.
const harnessCode = readFileSync(harness, 'utf8');
const captureStart = '\nfunction capture(){\n';
const captureEnd = '\nconst inside=(a,b)=>';
for (const anchor of [captureStart, captureEnd]) {
 assert.equal(harnessCode.split(anchor).length, 2, `Expected one capture anchor: ${JSON.stringify(anchor)}`);
}
const captureOffset = harnessCode.indexOf(captureStart) + 1;
const captureLimit = harnessCode.indexOf(captureEnd);
assert(captureLimit > captureOffset, 'Fallback capture anchors are out of order');
const captureSource = harnessCode.slice(captureOffset, captureLimit);
assert(captureSource.startsWith('function capture(){\n') && captureSource.endsWith('\n}'), 'Unexpected fallback capture boundary');

const profiles = [
 {id: 'authored-all-color', property: 'all, color', duration: '100ms, 240ms', delay: '0ms, 25ms'},
 {id: 'visibility-zero-clock', property: 'all, color, visibility', duration: '100ms, 240ms, 0ms', delay: '0ms, 25ms, 0ms'},
 {id: 'named-paint-color', property: 'background-color, box-shadow, border-color, color', duration: '100ms, 100ms, 100ms, 240ms', delay: '0ms, 0ms, 0ms, 25ms'},
];

function installDiagnostic(captureText) {
 const source = window.__cardAnchorSource;
 const detail = document.querySelector('#expand-1');
 const surface = detail.querySelector('.expand-surface');
 const close = surface.querySelector('[data-st-close]');
 const group = source.closest('[data-st-expand-sources]');
 const capture = (0, eval)(`(${captureText})`);
 const identify = element => element ? {
  tag: element.tagName, id: element.id || null, classes: element.getAttribute('class'),
  isSource: element === source, isClose: element === close,
 } : null;
 const scalar = value => value == null || typeof value === 'number' || typeof value === 'string' ? value : String(value);
 const styleState = element => {
  const style = getComputedStyle(element);
  return {
   ...identify(element), connected: element.isConnected, hidden: element.hidden,
   inert: element.inert, disabled: element.disabled ?? null, tabIndex: element.tabIndex,
   inertAncestor: identify(element.closest('[inert]')),
   visibility: style.visibility, display: style.display, opacity: style.opacity,
   transitionProperty: style.transitionProperty, transitionDuration: style.transitionDuration,
   transitionDelay: style.transitionDelay, transitionTimingFunction: style.transitionTimingFunction,
   inline: element.getAttribute('style'),
  };
 };
 const transitions = () => [detail, surface, close].flatMap(element => element.getAnimations()
  .filter(animation => animation.effect?.target === element)
  .map(animation => ({
   target: identify(element), type: animation.constructor.name,
   property: animation.transitionProperty || null, pseudo: animation.effect.pseudoElement || null,
   playState: animation.playState, pending: animation.pending,
   currentTime: scalar(animation.currentTime), startTime: scalar(animation.startTime),
   timelineTime: scalar(animation.timeline?.currentTime),
   timing: animation.effect.getTiming(), computedTiming: animation.effect.getComputedTiming(),
   keyframes: animation.effect.getKeyframes(),
  })));
 const state = () => ({
  at: performance.now(), activeElement: identify(document.activeElement),
  instant: detail.hasAttribute('data-st-instant'), open: detail.dataset.stOpen,
  sourceGroupInert: group.inert, sourceHidden: getComputedStyle(source).visibility === 'hidden',
  detail: styleState(detail), surface: styleState(surface), close: styleState(close),
  animations: transitions(),
 });
 window.__focusTransferCalls = [];
 window.__focusTransferEvents = [];
 window.__focusTransferInstrumentationErrors = [];
 for (const type of ['focus', 'blur', 'focusin', 'focusout']) document.addEventListener(type, event => {
  if (event.target !== source && event.target !== close) return;
  window.__focusTransferEvents.push({type, at: performance.now(), target: identify(event.target), relatedTarget: identify(event.relatedTarget), activeElement: identify(document.activeElement)});
 }, true);
 const nativeFocus = close.focus;
 Object.defineProperty(close, 'focus', {configurable: true, writable: true, value: function (...args) {
  // This activeElement reference is the only observation before the original
  // call. No computed style, geometry, animation, or focus mutation precedes it.
  const before = document.activeElement;
  let result, thrown;
  try { result = Reflect.apply(nativeFocus, this, args); }
  catch (error) { thrown = error; }
  // Save the native outcome before diagnostic style/animation reads can flush.
  const after = document.activeElement;
  const row = {
   call: window.__focusTransferCalls.length + 1,
   activeElementBefore: identify(before), activeElementAfterNative: identify(after),
   focusedCloseAfterNative: after === close, sourceFocusedAfterNative: after === source,
   receiverIsClose: this === close, error: thrown ? String(thrown.stack || thrown) : null,
  };
  window.__focusTransferCalls.push(row);
  try { row.afterNative = state(); }
  catch (error) { window.__focusTransferInstrumentationErrors.push(String(error.stack || error)); }
  if (thrown) throw thrown;
  return result;
 }});
 window.__captureFocusTransfer = () => ({...capture(), focusDiagnostic: state()});
 document.addEventListener('click', event => {
  if (!source.contains(event.target)) return;
  window.__focusTransferAccepted = {
   observedAt: 'document-bubble', currentTargetIsDocument: event.currentTarget === document,
   trusted: event.isTrusted, detail: event.detail, ...window.__captureFocusTransfer(),
  };
  requestAnimationFrame(() => {
   window.__focusTransferFirstRAF = {observedAt: 'first-raf-after-document-bubble', ...window.__captureFocusTransfer()};
  });
 });
}

mkdirSync(out, {recursive: true});
assert.equal(readdirSync(out).length, 0, 'Use an empty diagnostic output directory; never overwrite original evidence');
const {chromium} = await import(pathToFileURL(resolve(arg('--playwright'))).href);
const report = {
 scope: 'Three instrumented, forced-unsupported 320px Night Swim pointer cases. Native Close.focus runs before diagnostic computed reads. This is causal diagnostic evidence, never uninstrumented acceptance or an older-browser claim.',
 gallery, source, harness: {path: harness, sha256: sha(harness)},
 diagnostic: {path: fileURLToPath(import.meta.url), sha256: sha(fileURLToPath(import.meta.url))},
 captureSha256: createHash('sha256').update(captureSource).digest('hex'),
 uninstrumentedEvidence: 'Preserve the existing unsupported-320-1-case.json and unsupported-320-1-FAILED.png separately; this run does not rewrite or replace them.',
 runs: [], errors: [],
};
const persist = () => writeFileSync(join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({headless: true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
report.browser = browser.version();
try {
 for (const profile of profiles) {
  const run = {id: profile.id, width: 320, index: 1, mode: 'unsupported', status: 'running', errors: []};
  report.runs.push(run);
  let context, page;
  try {
   context = await browser.newContext({viewport: {width: 320, height: 1000}, colorScheme: 'light', reducedMotion: 'no-preference', serviceWorkers: 'block'});
   page = await context.newPage();
   page.setDefaultTimeout(5000);
   page.setDefaultNavigationTimeout(15000);
   page.on('pageerror', error => run.errors.push(String(error.stack || error)));
   await page.route(/^https?:/, route => route.abort());
   await page.addInitScript(() => {
    const original = CSS.supports.bind(CSS);
    window.__forcedAnchorSupport = [];
    CSS.supports = (...args) => {
     const forced = args[0] === 'position-anchor', native = original(...args), result = forced ? false : native;
     if (forced) window.__forcedAnchorSupport.push({args, native, result});
     return result;
    };
   });
   await page.goto(pathToFileURL(gallery).href);
   await page.evaluate(() => document.fonts.ready);
   if (!await page.locator('#blur-toggle').isChecked()) await page.locator('label.blur-switch').click();
   assert(await page.evaluate(() => document.documentElement.hasAttribute('data-st-blur')), 'Blur must be enabled');
   const host = page.locator('[data-key="expand"]');
   const source = host.locator('.cover-card').nth(1);
   await source.scrollIntoViewIfNeeded();
   await page.waitForTimeout(150);
   run.title = (await source.locator('[data-st-shared="title"]').textContent()).trim();
   assert.equal(run.title, 'Night Swim');
   run.authoredBefore = await host.locator('.expand-surface').evaluate((element, variant) => {
    const properties = {
     'background-color': 'rgb(255, 255, 255)', 'background-image': 'none',
     'overflow-x': 'visible', 'overflow-y': 'clip',
     'transition-property': variant.property, 'transition-duration': variant.duration, 'transition-delay': variant.delay,
    };
    for (const [key, value] of Object.entries(properties)) element.style.setProperty(key, value, ['background-color', 'overflow-x', 'transition-duration'].includes(key) ? 'important' : '');
    return Object.fromEntries(Object.keys(properties).map(key => [key, {value: element.style.getPropertyValue(key), priority: element.style.getPropertyPriority(key)}]));
   }, profile);
   await source.evaluate(element => { window.__cardAnchorSource = element; });
   await page.evaluate(installDiagnostic, captureSource);
   await source.locator('[data-st-close-anchor]').click();
   await page.waitForFunction(() => window.__focusTransferFirstRAF);
   const observations = await page.evaluate(() => ({
    focusCalls: window.__focusTransferCalls, focusEvents: window.__focusTransferEvents,
    initial: window.__focusTransferAccepted, firstRAF: window.__focusTransferFirstRAF,
    supportCalls: window.__forcedAnchorSupport, instrumentationErrors: window.__focusTransferInstrumentationErrors,
   }));
   Object.assign(run, observations);
   run.firstNativeFocus = run.focusCalls[0] || null;
   run.errors.push(...run.instrumentationErrors);
   assert(run.initial.trusted && run.initial.currentTargetIsDocument && run.initial.detail === 1, 'Expected trusted pointer activation observed at document bubble');
   assert(run.supportCalls.some(call => call.result === false), 'Expected forced unsupported anchor lookup');
   assert.equal(run.focusCalls.length, 1, 'Expected exactly one native Close.focus call');
   assert(run.firstNativeFocus.receiverIsClose, 'Focus wrapper receiver must be Close');
   run.status = run.errors.length ? 'failed' : 'diagnostic-collected';
  } catch (error) {
   run.status = 'failed';
   run.error = String(error.stack || error);
  } finally {
   if (page) {
    try {
     const partial = await page.evaluate(() => ({
      focusCalls: window.__focusTransferCalls || [], focusEvents: window.__focusTransferEvents || [], initial: window.__focusTransferAccepted || null,
      firstRAF: window.__focusTransferFirstRAF || null, supportCalls: window.__forcedAnchorSupport || [],
      instrumentationErrors: window.__focusTransferInstrumentationErrors || [],
     }));
     Object.assign(run, partial);
     run.firstNativeFocus = run.focusCalls[0] || null;
     for (const error of run.instrumentationErrors) if (!run.errors.includes(error)) run.errors.push(error);
    } catch (error) { run.errors.push(`Collect diagnostic state: ${String(error.stack || error)}`); }
    run.frame = `${profile.id}-320-night-swim.png`;
    try { await page.screenshot({path: join(out, run.frame), animations: 'allow', timeout: 5000}); }
    catch (error) { run.errors.push(`Capture screenshot: ${String(error.stack || error)}`); }
   }
   if (context) {
    try { await context.close(); }
    catch (error) { run.errors.push(`Close context: ${String(error.stack || error)}`); }
   }
   if (run.errors.length) run.status = 'failed';
   writeFileSync(join(out, `${profile.id}-320-night-swim-case.json`), JSON.stringify(run, null, 2) + '\n');
   persist();
  }
 }
} finally {
 try { await browser.close(); }
 catch (error) { report.errors.push(`Close browser: ${String(error.stack || error)}`); }
 report.sourceAfter = sourceHashes();
 report.sourceUnchanged = sourceNames.every(name => report.sourceAfter[name] === source[name]);
 if (!report.sourceUnchanged) report.errors.push('Product source hashes changed during the diagnostic');
 persist();
}
console.log(JSON.stringify(report.runs.map(run => ({
 id: run.id, status: run.status,
 focusedCloseAfterNative: run.firstNativeFocus?.focusedCloseAfterNative ?? null,
 visibilityAfterNative: run.firstNativeFocus?.afterNative?.close?.visibility ?? null,
 focusedCloseAtDocumentBubble: run.initial?.focusedClose ?? null,
 focusedCloseAtFirstRAF: run.firstRAF?.focusedClose ?? null,
})), null, 2));
if (report.errors.length || report.runs.some(run => run.status !== 'diagnostic-collected')) process.exitCode = 1;
