import { createVoicePresence } from './voice-presence.mjs';

const $ = selector => document.querySelector(selector);
const presence = createVoicePresence($('#presence'));
const settings = $('#settings');
const level = $('#level');
const toggle = $('#toggle');
let state = 'idle', timer = 0, step = 0, playing = false;
// A deliberately authored envelope, not recorded speech or a microphone signal.
const envelope = [0, 0, .12, .36, .72, .9, .56, .24, .08, 0, .18, .6, .84, .42, .16, 0, 0];
const labels = {
  idle: ['Demo idle', 'No microphone is connected'],
  listening: ['Demo listening', 'Generated input · no microphone'],
  speaking: ['Demo speaking', 'Generated output · no audio playback'],
  error: ['Demo input unavailable', 'Simulated error · start again to retry'],
};
function setLevel(value) {
  level.value = String(value);
  $('#value').value = Number(value).toFixed(2);
  presence.update({ level: value });
}
function stop() {
  playing = false;
  clearTimeout(timer);
  timer = 0;
  toggle.textContent = 'Start demo';
}
function setState(next) {
  state = next;
  presence.update({ state });
  $(`input[name="state"][value="${state}"]`).checked = true;
  $('#status').textContent = labels[state][0];
  $('#detail').textContent = labels[state][1];
  level.disabled = state === 'idle' || state === 'error';
  if (level.disabled) { stop(); setLevel(0); }
}
function tick() {
  if (!playing || document.hidden) return;
  setLevel(envelope[step++ % envelope.length]);
  timer = setTimeout(tick, 120);
}
function onToggle() {
  if (playing || state === 'listening' || state === 'speaking') {
    stop(); setState('idle'); return;
  }
  setState('listening');
  playing = true;
  step = 0;
  toggle.textContent = 'Stop demo';
  tick();
}
function onSettings(event) {
  if (event.target.name === 'state') {
    stop(); setLevel(0); setState(event.target.value);
    toggle.textContent = level.disabled ? 'Start demo' : 'Reset demo';
  }
  if (event.target === level) {
    stop(); setLevel(Number(level.value)); toggle.textContent = 'Reset demo';
  }
  if (event.target.id === 'static') presence.update({ static: event.target.checked });
}
function onVisibility() {
  clearTimeout(timer); timer = 0;
  if (document.hidden) setLevel(0);
  else if (playing) tick();
}
function destroy() {
  stop();
  presence.destroy();
  toggle.removeEventListener('click', onToggle);
  settings.removeEventListener('input', onSettings);
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('pagehide', onPageHide);
  settings.disabled = true;
  toggle.disabled = true;
  $('#status').textContent = 'Demo stopped';
  $('#detail').textContent = 'Reload this page to try again';
}
function onPageHide(event) { if (!event.persisted) destroy(); }
toggle.disabled = false;
settings.disabled = false;
toggle.addEventListener('click', onToggle);
settings.addEventListener('input', onSettings);
document.addEventListener('visibilitychange', onVisibility);
window.addEventListener('pagehide', onPageHide);
window.voicePresenceDemo = { presence, destroy };
