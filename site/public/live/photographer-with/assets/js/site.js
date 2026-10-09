(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* nav colour follows whatever is behind it */
  const nav = $('[data-nav]');
  const darkBlocks = $$('[data-dark]');
  let menuOpen = false;
  let tick = false;
  const paintNav = () => {
    tick = false;
    const y = nav.offsetHeight / 2;
    const block = darkBlocks.find(el => {
      const r = el.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    });
    const over = menuOpen || !!block;
    if (menuOpen) nav.style.setProperty('--nav-bg', getComputedStyle(menu).backgroundColor);
    else if (block) nav.style.setProperty('--nav-bg', getComputedStyle(block).backgroundColor);
    nav.classList.toggle('on-dark', over);
  };
  const queuePaint = () => { if (!tick) { tick = true; requestAnimationFrame(paintNav); } };
  addEventListener('scroll', queuePaint, { passive: true });
  addEventListener('resize', queuePaint);
  paintNav();

  /* phone menu */
  const menu = $('#menu');
  const menuBtn = $('.menu-btn');
  const setMenu = open => {
    menuOpen = open;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    paintNav();
  };
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches && menuOpen) setMenu(false); });

  /* the day, in order: the clock rests on each photograph's time and runs in the gaps between them */
  const story = $('#day');
  const steps = $$('.step', story);
  const clockEl = $('[data-clock]', story);
  const ampmEl = $('[data-ampm]', story);
  const timesEl = $('.times', story);
  const mins = steps.map(s => +s.dataset.min);
  const n = steps.length;

  timesEl.innerHTML = steps.map((s, i) => {
    const t = $('time', s).textContent;
    return `<li><button type="button" data-i="${i}"><span class="tm">${t}</span><span>${s.dataset.label}</span></button></li>`;
  }).join('');
  const timeButtons = $$('button', timesEl);
  const mark = document.createElement('li');
  mark.className = 'times-mark';
  mark.setAttribute('aria-hidden', 'true');
  timesEl.prepend(mark);

  const fmt = m => {
    m = Math.round(m);
    const h24 = Math.floor(m / 60) % 24;
    const h = h24 % 12 || 12;
    return { text: `${h}:${String(m % 60).padStart(2, '0')}`, pm: h24 >= 12 };
  };
  let shown = '';
  const paintClock = m => {
    const { text, pm } = fmt(m);
    if (text === shown) return;
    shown = text;
    clockEl.innerHTML = [...text].map(c => c === ':' ? '<span class="c">:</span>' : `<span class="d">${c}</span>`).join('');
    ampmEl.textContent = pm ? 'p.m.' : 'a.m.';
  };

  let active = -1;
  const setActive = i => {
    if (i === active) return;
    active = i;
    timeButtons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    mark.style.transform = `translateY(${Math.max(0, i) * 28}px)`;
  };
  const ease = t => t * t * (3 - 2 * t);
  const clamp01 = t => Math.min(1, Math.max(0, t));
  const railOn = matchMedia('(min-width: 901px)');

  const tickClock = () => {
    if (!railOn.matches) return;
    const c = innerHeight * 0.5;
    const rects = steps.map(s => s.getBoundingClientRect());
    let i = 0;
    for (let k = 0; k < n; k++) if (rects[k].top <= c) i = k;
    let m = mins[i];
    let act = i;
    if (i < n - 1) {
      const a = rects[i].bottom;
      const b = rects[i + 1].top;
      if (c > a) {
        const u = clamp01((c - a) / (b - a));
        m = mins[i] + (mins[i + 1] - mins[i]) * (reduced.matches ? Math.round(u) : ease(u));
        if (u > 0.5) act = i + 1;
      }
    }
    setActive(act);
    paintClock(m);
  };
  let clockTick = false;
  const queueClock = () => { if (!clockTick) { clockTick = true; requestAnimationFrame(() => { clockTick = false; tickClock(); }); } };
  addEventListener('scroll', queueClock, { passive: true });
  addEventListener('resize', queueClock);
  railOn.addEventListener('change', queueClock);
  tickClock();

  timeButtons.forEach((b, k) => b.addEventListener('click', () => {
    const r = steps[k].getBoundingClientRect();
    scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2 + 40, behavior: 'instant' });
  }));

  /* far anchors jump, near ones glide */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const t = id.length > 1 && $(id);
    if (!t) return;
    const top = scrollY + t.getBoundingClientRect().top - nav.offsetHeight;
    const far = Math.abs(top - scrollY) > innerHeight * 1.5;
    e.preventDefault();
    scrollTo({ top, behavior: far || reduced.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', id);
  }));

  /* prefill the inquiry from a package or a gallery request */
  const form = $('#inquiry');
  const pack = $('#f-pack');
  const msg = $('#f-msg');
  $$('[data-package]').forEach(a => a.addEventListener('click', () => { pack.value = a.dataset.package; }));
  $$('[data-prefill]').forEach(a => a.addEventListener('click', () => {
    if (!msg.value.trim()) msg.value = `I would love to see ${a.dataset.prefill}.`;
  }));

  /* inquiry form: idle, invalid, sending, sent */
  const status = $('[data-status]', form);
  const submit = $('.btn-submit', form);
  const label = $('[data-label]', submit);
  const ENDPOINT = form.dataset.endpoint || '';
  const rules = {
    names: v => v.trim() ? '' : 'Please tell me your names.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter an email I can reply to.',
    date: v => {
      if (!v) return 'Please choose your wedding date.';
      return new Date(v) < new Date(new Date().toDateString()) ? 'That date has already passed.' : '';
    }
  };
  const check = (name, shake) => {
    const input = form.elements[name];
    const err = $(`#e-${name}`);
    const text = rules[name](input.value);
    err.textContent = text;
    if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    if (text) input.setAttribute('aria-describedby', `e-${name}`); else input.removeAttribute('aria-describedby');
    if (text && shake) {
      const f = input.closest('.field');
      f.classList.remove('shake');
      void f.offsetWidth;
      f.classList.add('shake');
    }
    return !text;
  };
  Object.keys(rules).forEach(name => {
    form.elements[name].addEventListener('blur', () => { if (form.elements[name].value) check(name, false); });
    form.elements[name].addEventListener('input', () => { if (form.elements[name].hasAttribute('aria-invalid')) check(name, false); });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submit.getAttribute('aria-busy') === 'true') return;
    const results = Object.keys(rules).map(name => check(name, true));
    if (results.includes(false)) {
      form.elements[Object.keys(rules)[results.indexOf(false)]].focus();
      status.textContent = '';
      return;
    }
    submit.setAttribute('aria-busy', 'true');
    $('svg', submit)?.remove();
    label.textContent = 'Sending';
    const data = Object.fromEntries(new FormData(form));
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('bad response');
      } else {
        const body = `Names: ${data.names}\nWedding date: ${data.date}\nVenue or city: ${data.place || ''}\nPackage: ${data.package}\n\n${data.message || ''}`;
        location.href = `mailto:hello@islanavarro.com?subject=${encodeURIComponent('Wedding inquiry: ' + data.names)}&body=${encodeURIComponent(body)}`;
        await new Promise(r => setTimeout(r, 500));
      }
      submit.removeAttribute('aria-busy');
      label.textContent = 'Sent';
      submit.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>');
      status.textContent = `Thank you, ${data.names.trim()}. I will reply within 48 hours.`;
    } catch {
      submit.removeAttribute('aria-busy');
      label.textContent = 'Send my inquiry';
      status.textContent = 'That did not go through. Please try again, or email hello@islanavarro.com.';
    }
  });
})();
