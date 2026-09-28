const slots = {
  tuesday: { day: 'Tuesday', time: '16:00 UTC', count: 2, unavailable: 'Priya and Kenji' },
  wednesday: { day: 'Wednesday', time: '08:00 UTC', count: 2, unavailable: 'Ada and Mae' },
  thursday: { day: 'Thursday', time: '15:00 UTC', count: 4, unavailable: '' }
};
const choices = [...document.querySelectorAll('.choose')];
const result = document.getElementById('result');
const resultTitle = document.getElementById('result-title');
const resultCopy = document.getElementById('result-copy');
const confirmButton = document.getElementById('confirm');
let selected = null;
choices.forEach(button => button.addEventListener('click', event => {
  selected = button.dataset.slot;
  const slot = slots[selected];
  choices.forEach(item => {
    const active = item === button;
    item.setAttribute('aria-pressed', String(active));
    item.innerHTML = active ? `${slot.day} selected <span aria-hidden="true">✓</span>` : `Select ${slots[item.dataset.slot].day} <span aria-hidden="true">→</span>`;
    item.closest('.candidate').classList.toggle('selected', active);
  });
  resultTitle.textContent = `${slot.day} · ${slot.time}`;
  resultCopy.textContent = slot.count === 4
    ? 'All four teammates are available for the 30-minute review.'
    : `${slot.unavailable} are unavailable. Choose the shared time to include everyone.`;
  confirmButton.disabled = slot.count !== 4;
  confirmButton.innerHTML = 'Use this time <span aria-hidden="true">→</span>';
  if (event.detail > 0 && matchMedia('(max-width: 850px)').matches) result.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
}));
confirmButton.addEventListener('click', () => {
  if (selected !== 'thursday') return;
  resultTitle.textContent = 'Thursday · 15:00 UTC chosen here';
  resultCopy.textContent = 'This demo has recorded your choice on this page only. No invitations were sent.';
  confirmButton.textContent = 'Chosen here ✓';
  confirmButton.disabled = true;
});
