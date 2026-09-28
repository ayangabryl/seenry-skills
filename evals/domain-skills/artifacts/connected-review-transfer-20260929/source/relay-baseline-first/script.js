const slots = [
  { id: 'tue', day: 'TUE', date: '29', month: 'SEP', label: 'Tuesday, 29 September', utc: '16:00 UTC', available: 2, local: [ ['09:00', true], ['17:00', false], ['01:00 Wed', false], ['12:00', true] ] },
  { id: 'wed', day: 'WED', date: '30', month: 'SEP', label: 'Wednesday, 30 September', utc: '08:00 UTC', available: 2, local: [ ['01:00', false], ['09:00', true], ['17:00', true], ['04:00', false] ] },
  { id: 'thu', day: 'THU', date: '01', month: 'OCT', label: 'Thursday, 1 October', utc: '15:00 UTC', available: 4, local: [ ['08:00', true], ['16:00', true], ['00:00 Fri', true], ['11:00', true] ] }
];
const names = ['Ada', 'Priya', 'Kenji', 'Mae'];
const slotList = document.querySelector('#slot-list');
const summary = document.querySelector('#selection-summary');
const previewButton = document.querySelector('#preview-button');
const result = document.querySelector('#result');
const resetButton = document.querySelector('#reset-button');
let selected = null;

function render() {
  slotList.innerHTML = slots.map(slot => `<button class="slot ${selected === slot.id ? 'selected' : ''}" type="button" role="radio" aria-checked="${selected === slot.id}" aria-label="${slot.label}, ${slot.utc}, ${slot.available} of 4 available" data-slot="${slot.id}"><span class="date-tile"><small>${slot.day}</small><strong>${slot.date}</strong><small>${slot.month}</small></span><span class="slot-content"><span class="slot-title"><strong>${slot.utc}</strong><span class="availability-count ${slot.available === 4 ? 'all' : ''}">${slot.available === 4 ? 'Everyone is free' : `${slot.available} of 4 available`}</span></span><span class="local-grid">${slot.local.map(([time, available], i) => `<span class="local-person ${available ? 'is-free' : 'is-busy'}"><span class="local-name">${names[i]}</span><span class="local-time"><span class="status-dot" aria-hidden="true"></span>${time}</span><span class="sr-only">${available ? 'available' : 'unavailable'}</span></span>`).join('')}</span></span><span class="select-indicator" aria-hidden="true">${selected === slot.id ? '✓' : ''}</span></button>`).join('');
  const active = slots.find(slot => slot.id === selected);
  summary.textContent = active ? `${active.label} at ${active.utc} · ${active.available} of 4 available` : 'Choose a time to preview the meeting.';
  previewButton.disabled = !active;
  previewButton.textContent = active ? (active.available === 4 ? 'Preview this time ↗' : 'Preview availability ↗') : 'Preview this time ↗';
}

slotList.addEventListener('click', event => {
  const button = event.target.closest('[data-slot]');
  if (!button) return;
  selected = button.dataset.slot;
  result.hidden = true;
  render();
});
slotList.addEventListener('keydown', event => {
  const buttons = [...slotList.querySelectorAll('[data-slot]')];
  const index = buttons.indexOf(document.activeElement);
  if (index < 0 || !['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
  event.preventDefault();
  const direction = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1;
  const next = buttons[(index + direction + buttons.length) % buttons.length];
  next.click(); next.focus();
});
previewButton.addEventListener('click', () => {
  const slot = slots.find(item => item.id === selected);
  if (!slot) return;
  const title = result.querySelector('h3');
  const body = result.querySelector('div:nth-child(2) > p:last-child');
  if (slot.available === 4) {
    title.textContent = 'Thursday works for all four.';
    body.innerHTML = 'Your 30-minute team review is previewed for <strong>Thursday, 1 October at 15:00 UTC</strong>. Ada, Priya, Kenji, and Mae are all marked available in this sample schedule.';
  } else {
    title.textContent = 'This time leaves two people out.';
    const free = names.filter((_, i) => slot.local[i][1]).join(' and ');
    const busy = names.filter((_, i) => !slot.local[i][1]).join(' and ');
    body.innerHTML = `<strong>${slot.label} at ${slot.utc}</strong> works for ${free}, while ${busy} are marked unavailable in this sample schedule. Try Thursday for a time everyone can make.`;
  }
  result.hidden = false;
  result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
});
resetButton.addEventListener('click', () => { result.hidden = true; slotList.querySelector(`[data-slot="${selected}"]`)?.focus(); });
render();
