const MIN = 16;
const MAX = 28;
const CONFIRMED = 16;
const WAITLIST = 8;

const range = document.querySelector('#capacity-range');
const capacityValue = document.querySelector('#capacity-value');
const openValue = document.querySelector('#open-value');
const waitlistValue = document.querySelector('#waitlist-value');
const additionalLabel = document.querySelector('#additional-label');
const confirmedMarks = document.querySelector('#confirmed-marks');
const additionalMarks = document.querySelector('#additional-marks');
const reset = document.querySelector('#reset');

for (let seat = 0; seat < CONFIRMED; seat += 1) {
  const mark = document.createElement('span');
  mark.className = 'seat-mark confirmed';
  confirmedMarks.append(mark);
}

const additional = Array.from({ length: MAX - CONFIRMED }, () => {
  const mark = document.createElement('span');
  mark.className = 'seat-mark';
  additionalMarks.append(mark);
  return mark;
});

function render() {
  const capacity = Math.min(MAX, Math.max(MIN, Number(range.value)));
  const open = capacity - CONFIRMED;
  const couldFit = Math.min(open, WAITLIST);

  range.value = String(capacity);
  range.style.setProperty('--fill', `${((capacity - MIN) / (MAX - MIN)) * 100}%`);
  range.setAttribute('aria-valuetext', `${capacity} seats; ${open} open after confirmed guests; ${couldFit} of ${WAITLIST} waitlisted people could fit`);
  capacityValue.value = String(capacity);
  openValue.value = String(open);
  waitlistValue.value = String(couldFit);
  additionalLabel.textContent = `${open} of ${MAX - CONFIRMED}`;
  reset.disabled = capacity === MIN;

  additional.forEach((mark, index) => {
    mark.className = `seat-mark${index < open ? index < WAITLIST ? ' potential' : ' extra' : ''}`;
  });
}

range.addEventListener('input', render);
range.addEventListener('change', render);
reset.addEventListener('click', () => {
  range.value = String(MIN);
  render();
  range.focus();
});

render();
