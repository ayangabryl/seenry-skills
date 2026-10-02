import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const argument = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
function generatedDemoHasResponded(closed) {
  const svg=document.querySelector('#presence svg'),shell=document.querySelector('#presence .vp-shell');
  const sample={at:performance.now(),level:Number(document.querySelector('#level')?.value),path:shell?.getAttribute('d')??null,state:window.voicePresenceDemo?.presence.state,presentation:svg?.dataset.presentation,status:document.querySelector('#status')?.textContent,toggle:document.querySelector('#toggle')?.textContent,focus:document.activeElement?.id,visibility:document.visibilityState,animating:window.voicePresenceDemo?.presence.isAnimating};
  // Diagnostic state belongs to this test; do not alter the generated signal or animation.
  const trace=window.__voiceDemoResponseTrace??(window.__voiceDemoResponseTrace=[]);trace.push(sample);if(trace.length>60)trace.shift();
  const responded=sample.visibility==='visible'&&sample.state==='listening'&&sample.status==='Demo listening'&&sample.toggle==='Stop demo'&&sample.presentation==='responsive'&&sample.focus==='toggle'&&sample.level>0&&sample.level<=1&&typeof sample.path==='string'&&sample.path.length>0&&sample.path!==closed;
  return responded?sample:false;
}
const modulePath = argument('--playwright');
if (!modulePath) throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const { chromium } = await import(pathToFileURL(path.resolve(modulePath)).href);
const output = argument('--output');
const root = path.resolve('.');
const mime = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript' };
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try { response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.SEENRY_CHROME_PATH ? { executablePath: process.env.SEENRY_CHROME_PATH } : {}) });
  const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/voice-presence/demo.html`;
  const page = await browser.newPage({ viewport: { width: 1100, height: 960 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.microphoneRequests = 0;
    navigator.mediaDevices.getUserMedia = () => { window.microphoneRequests++; throw Error('Unexpected capture'); };
  });
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.voicePresenceDemo));
  const mark = page.locator('#presence');
  const geometry = () => mark.locator('.vp-shell').first().getAttribute('d');
  const update = options => page.evaluate(options => window.voicePresenceDemo.presence.update(options), options);
  const settled = () => page.waitForFunction(() => !window.voicePresenceDemo.presence.isAnimating);
  const level = async value => { await page.locator('#level').evaluate((node, value) => { node.value = String(value); node.dispatchEvent(new Event('input', { bubbles: true })); }, value); await settled(); };
  const choose = state => page.locator(`input[name="state"][value="${state}"]`).check();
  const capture = async name => { if (output) { await mkdir(output, { recursive: true }); await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true }); } };

  assert.equal(await mark.locator('svg').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('#status').getAttribute('role'), 'status');
  assert.equal(await page.evaluate(() => window.voicePresenceDemo.presence.isAnimating), false);
  const idleGeometry = await geometry();
  const idleEnergy = await mark.locator('svg').evaluate(node => node.style.getPropertyValue('--vp-energy'));
  await update({ level: 1 });
  assert.equal(await geometry(), idleGeometry, 'Idle must ignore supplied signal geometry');
  assert.equal(await mark.locator('svg').evaluate(node => node.style.getPropertyValue('--vp-energy')), idleEnergy, 'Idle must ignore supplied signal ink');
  await capture('desktop-idle');

  await choose('listening');
  await level(0);
  const zero = await mark.screenshot();
  const closed = await geometry();
  await level(.85);
  assert.notEqual(await geometry(), closed, 'Level changes the actual path');
  assert.notDeepEqual(await mark.screenshot(), zero, 'Level changes rendered pixels at 48 px');
  await capture('desktop-listening');
  await page.waitForTimeout(180);
  assert.equal(await page.evaluate(() => window.voicePresenceDemo.presence.isAnimating), false, 'No perpetual signal');
  await level(0);
  assert.equal(await geometry(), closed, 'Zero returns to the resting geometry');
  assert.equal(await page.evaluate(() => window.voicePresenceDemo.presence.isAnimating), false, 'Zero does not schedule a pulse');

  // A live preference change cancels in-flight movement, then keeps shape fixed.
  await update({ level: 1 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('#presence svg').dataset.presentation === 'static');
  await settled();
  assert.equal(await mark.locator('svg').getAttribute('data-presentation'), 'static');
  const still = await geometry();
  const bright = await mark.screenshot();
  await update({ level: 0 });
  assert.equal(await geometry(), still);
  assert.notDeepEqual(await mark.screenshot(), bright, 'Static ink still responds to level');
  await capture('desktop-reduced-motion');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.querySelector('#presence svg').dataset.presentation === 'responsive');
  await update({ level: .8 });
  await settled();
  assert.notEqual(await geometry(), still, 'Live preference switch restores response');
  await page.locator('#static').check();
  assert.equal(await mark.locator('svg').getAttribute('data-presentation'), 'static');
  await page.locator('#static').uncheck();

  // Invalid levels fail quiet; invalid states reject atomically.
  for (const value of [NaN, Infinity, 'loud', -2]) {
    await update({ level: value }); await settled(); assert.equal(await geometry(), closed);
  }
  await update({ level: 5 }); await settled(); const clamped = await geometry();
  await update({ level: 1 }); await settled(); assert.equal(await geometry(), clamped);
  assert.match(await page.evaluate(() => {
    try { window.voicePresenceDemo.presence.update({ state: 'recording', level: 0 }); }
    catch (error) { return error.message; }
  }), /Unknown voice state/);
  assert.equal(await geometry(), clamped);

  await choose('error');
  assert.match(await page.locator('#status').textContent(), /unavailable/);
  assert.match(await page.locator('#detail').textContent(), /Simulated error/);
  assert.equal(await page.locator('#level').isDisabled(), true);
  assert.equal(await page.evaluate(() => window.voicePresenceDemo.presence.isAnimating), false);
  await capture('desktop-error');
  await page.locator('#toggle').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#toggle').textContent(), 'Stop demo');
  // The demo begins with two zero samples on chained 120ms timers. Observe an actual
  // positive generated sample and its geometry response, not one assumed timer phase.
  let demoResponse;
  try {
    const response=await page.waitForFunction(generatedDemoHasResponded, closed, {timeout:5000,polling:'raf'});
    demoResponse=await response.jsonValue();await response.dispose();
  }
  catch(error){
    console.error('VOICE_DEMO_RESPONSE_FAILURE '+JSON.stringify(await page.evaluate(()=>({trace:window.__voiceDemoResponseTrace??[],visibility:document.visibilityState,focus:document.activeElement?.id}))));
    throw error;
  }
  // Assert the geometry sampled with the positive signal. A later valid zero sample
  // must not invalidate the response merely because transport to the test was delayed.
  assert.notEqual(demoResponse.path, closed);
  console.log('VOICE_DEMO_RESPONSE '+JSON.stringify(demoResponse));
  assert.equal(await page.evaluate(() => document.activeElement.id), 'toggle');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#status').textContent(), 'Demo idle');
  assert.equal(await page.evaluate(() => window.microphoneRequests), 0);
  await choose('listening');
  await page.locator('#level').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#value').textContent(), '0.01');

  await choose('speaking'); await level(.65);
  await capture('desktop-speaking');
  // Offscreen changes snap without scheduling work; returning uses latest input.
  await page.evaluate(() => { document.querySelector('.specimen').style.transform = 'translateY(2000px)'; });
  await page.evaluate(() => new Promise(resolve => {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) { observer.disconnect(); requestAnimationFrame(resolve); }
    });
    observer.observe(document.querySelector('#presence'));
  }));
  await update({ level: .25 });
  assert.equal(await page.evaluate(() => window.voicePresenceDemo.presence.isAnimating), false);
  await page.evaluate(() => { document.querySelector('.specimen').style.transform = ''; });
  await page.waitForTimeout(100);

  await page.setViewportSize({ width: 320, height: 860 });
  await choose('listening'); await level(.85);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const bounds = await mark.boundingBox();
  assert.equal(bounds.width, 48); assert.equal(bounds.height, 48);
  assert.ok((await page.locator('#toggle').boundingBox()).height >= 44);
  assert.ok(await page.locator('#toggle').evaluate(node => { const r = node.getBoundingClientRect(); return r.x >= 0 && r.right <= innerWidth; }));
  await capture('mobile-listening');
  await choose('error'); await capture('mobile-error');

  // Observe cancellation and listener/observer balance on a separate instance.
  const cleanup = await page.evaluate(async () => {
    const { createVoicePresence } = await import('./voice-presence.mjs');
    const host = document.createElement('span'); document.body.append(host);
    host.innerHTML = '<b>Preserved child</b>';
    const originalRAF = window.requestAnimationFrame, originalCancel = window.cancelAnimationFrame;
    const originalMatch = window.matchMedia, OriginalObserver = window.IntersectionObserver;
    const add = document.addEventListener, remove = document.removeEventListener;
    const pending = new Set();
    let mediaBalance = 0, documentBalance = 0, disconnects = 0;
    window.requestAnimationFrame = fn => { const id = originalRAF.call(window, time => { pending.delete(id); fn(time); }); pending.add(id); return id; };
    window.cancelAnimationFrame = id => { pending.delete(id); originalCancel.call(window, id); };
    window.matchMedia = query => {
      const media = originalMatch.call(window, query);
      const on = media.addEventListener.bind(media), off = media.removeEventListener.bind(media);
      media.addEventListener = (...args) => { mediaBalance++; on(...args); };
      media.removeEventListener = (...args) => { mediaBalance--; off(...args); };
      return media;
    };
    document.addEventListener = (...args) => { if (args[0] === 'visibilitychange') documentBalance++; add.apply(document, args); };
    document.removeEventListener = (...args) => { if (args[0] === 'visibilitychange') documentBalance--; remove.apply(document, args); };
    window.IntersectionObserver = class extends OriginalObserver { disconnect() { disconnects++; super.disconnect(); } };
    let result;
    try {
      const item = createVoicePresence(host, { state: 'listening' });
      item.update({ level: 1 });
      const scheduled = pending.size;
      item.destroy(); item.destroy(); item.update({ level: .2 });
      document.dispatchEvent(new Event('visibilitychange'));
      result = { scheduled, pending: pending.size, mediaBalance, documentBalance, disconnects, html: host.innerHTML };
    } finally {
      window.requestAnimationFrame = originalRAF; window.cancelAnimationFrame = originalCancel;
      window.matchMedia = originalMatch; window.IntersectionObserver = OriginalObserver;
      document.addEventListener = add; document.removeEventListener = remove; host.remove();
    }
    return result;
  });
  assert.deepEqual(cleanup, { scheduled: 1, pending: 0, mediaBalance: 0, documentBalance: 0, disconnects: 1, html: '<b>Preserved child</b>' });
  await page.locator('#toggle').click();
  await page.evaluate(() => window.voicePresenceDemo.destroy());
  await page.waitForTimeout(200);
  assert.equal(await mark.locator('svg').count(), 0);
  assert.equal(await page.locator('#toggle').isDisabled(), true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.evaluate(() => window.voicePresenceDemo.presence.isAnimating), false);

  const fallback = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 860 } });
  await fallback.goto(url);
  assert.equal(await fallback.locator('#status').textContent(), 'Demo idle');
  assert.equal(await fallback.locator('#toggle').isDisabled(), true);
  assert.equal(await fallback.locator('noscript').isVisible(), true);
  if (output) await fallback.screenshot({ path: path.join(output, 'mobile-no-script.png'), fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Voice presence: raster response, zero/idle, live reduced motion, keyboard, 320 px, errors, no capture, offscreen, cleanup and no-script fallback passed.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
