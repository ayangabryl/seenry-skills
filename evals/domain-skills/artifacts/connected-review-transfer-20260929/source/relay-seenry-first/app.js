const slots = {
  tuesday: { day: 'Tuesday', time: '16:00 UTC', count: 2, unavailable: 'Priya and Kenji' },
  wednesday: { day: 'Wednesday', time: '08:00 UTC', count: 2, unavailable: 'Ada and Mae' },
  thursday: { day: 'Thursday', time: '15:00 UTC', count: 4, unavailable: '' }
};
const buttons = [...document.querySelectorAll('.slot')];
const copy = document.getElementById('decision-copy');
const confirmButton = document.getElementById('confirm');
let selected = null;
buttons.forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.slot;
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const slot = slots[selected];
  copy.textContent = slot.count === 4
    ? `${slot.day} at ${slot.time} works for all four teammates.`
    : `${slot.day} at ${slot.time}: ${slot.unavailable} are unavailable.`;
  confirmButton.disabled = slot.count !== 4;
  confirmButton.textContent = 'Use this time →';
}));
confirmButton.addEventListener('click', () => {
  if (selected !== 'thursday') return;
  copy.textContent = 'Thursday at 15:00 UTC chosen for this demo. No invitations were sent.';
  confirmButton.textContent = 'Chosen here ✓';
  confirmButton.disabled = true;
});
