(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tick = el => {
    if (!el || reduceMotion) return;
    el.classList.remove('tick');
    void el.offsetWidth;
    el.classList.add('tick');
  };

  const TODAY = 3;
  const LEFT_AFTER_TODAY = 3;
  const LABELS = { track: 'On track', kept: 'Week kept', risk: 'At risk', missed: 'Not this week' };

  document.querySelectorAll('[data-habit]').forEach(card => {
    const target = Number(card.dataset.target);
    const baseWeeks = Number(card.dataset.weeks);
    const days = [...card.querySelectorAll('.day')];
    const doneOut = card.querySelector('[data-done]');
    const weeksOut = card.querySelector('[data-weeks-out]');
    const pill = card.querySelector('[data-pill]');
    const names = days.map(d => d.getAttribute('aria-label').split(',')[0]);
    let last = { done: null, state: null };

    const render = () => {
      const isDone = days.map(d => d.getAttribute('aria-pressed') === 'true');
      const done = isDone.filter(Boolean).length;
      const needed = target - done;
      const left = LEFT_AFTER_TODAY + (isDone[TODAY] ? 0 : 1);
      const state = needed <= 0 ? 'kept' : needed > left ? 'missed' : needed === left ? 'risk' : 'track';

      days.forEach((d, i) => {
        if (d.disabled) return;
        const today = i === TODAY ? ', today' : '';
        d.setAttribute('aria-label', `${names[i]}${today}, ${isDone[i] ? 'done' : 'not done'}`);
      });

      if (done !== last.done) {
        doneOut.textContent = done;
        const weeks = state === 'kept' ? baseWeeks + 1 : baseWeeks;
        if (Number(weeksOut.textContent) !== weeks) { weeksOut.textContent = weeks; tick(weeksOut); }
        if (last.done !== null) tick(doneOut);
      }
      if (state !== last.state) {
        card.dataset.state = state;
        pill.textContent = LABELS[state];
        if (last.state !== null) tick(pill);
      }
      last = { done, state };
    };

    days.forEach(d => d.addEventListener('click', () => {
      if (d.disabled) return;
      d.setAttribute('aria-pressed', d.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      render();
    }));
    render();
  });

  const pause = document.querySelector('[data-pause]');
  if (pause) {
    const sw = pause.querySelector('.switch');
    const title = pause.querySelector('[data-pause-title]');
    const sub = pause.querySelector('[data-pause-sub]');
    sw.addEventListener('click', () => {
      const on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', on);
      title.textContent = on ? 'Paused' : 'Not paused';
      sub.textContent = on ? 'Mon 12 to Sun 18 October' : 'Targets apply as usual';
      tick(title); tick(sub);
    });
  }

  const billing = document.querySelector('[data-billing]');
  if (billing) {
    const buttons = [...billing.querySelectorAll('button')];
    const price = document.querySelector('[data-price]');
    const unit = document.querySelector('[data-unit]');
    const alt = document.querySelector('[data-alt]');
    const PLANS = {
      yearly: { price: '$29', unit: 'a year', alt: 'or $3.99 a month' },
      monthly: { price: '$3.99', unit: 'a month', alt: 'or $29 a year, save 39%' }
    };
    const select = value => {
      buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.value === value));
      const p = PLANS[value];
      if (price.textContent === p.price) return;
      price.textContent = p.price; unit.textContent = p.unit; alt.textContent = p.alt;
      tick(price); tick(alt);
    };
    buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.value)));
    billing.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const i = buttons.findIndex(b => b.getAttribute('aria-pressed') === 'true');
      const next = buttons[(i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
      select(next.dataset.value); next.focus();
    });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-drawing');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('[data-draw]').forEach(el => io.observe(el));
  }
})();
