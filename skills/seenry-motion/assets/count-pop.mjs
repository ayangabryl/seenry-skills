// A small integer counter. The host keeps the readable value in its own DOM.
const integerText = /^\d+$/;

export function createCountPop(element, { value, reserveDigits = 2, stagger = 45 } = {}) {
  if (!(element instanceof Element)) throw new TypeError('count-pop needs an element');
  if (!Number.isInteger(reserveDigits) || reserveDigits < 1) throw new RangeError('reserveDigits must be positive');
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let current = String(value ?? element.textContent.trim());
  let destroyed = false;
  element.classList.add('seenry-count-pop');
  element.style.setProperty('--seenry-count-reserve', `${reserveDigits}ch`);

  function render(next, animate) {
    if (destroyed) return;
    const text = String(next);
    if (text === current && element.querySelector('.seenry-count-digit')) return;
    const previous = current;
    current = text;
    if (!integerText.test(text)) {
      element.textContent = text;
      return;
    }
    const fragment = document.createDocumentFragment();
    const changed = [...text].map((digit, index) => digit !== previous[previous.length - text.length + index]);
    let sequence = 0;
    for (let index = 0; index < text.length; index++) {
      const digit = document.createElement('span');
      digit.className = 'seenry-count-digit';
      digit.textContent = text[index];
      if (animate && !motion.matches && changed[index]) {
        digit.classList.add('is-entering');
        digit.style.setProperty('--seenry-count-delay', `${sequence++ * stagger}ms`);
      }
      fragment.append(digit);
    }
    element.replaceChildren(fragment);
  }

  const initial = current;
  current = '';
  render(initial, false);
  return {
    get value() { return current; },
    update(next) { render(next, true); },
    set(next) { render(next, false); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      element.textContent = current;
      element.classList.remove('seenry-count-pop');
      element.style.removeProperty('--seenry-count-reserve');
    },
  };
}
