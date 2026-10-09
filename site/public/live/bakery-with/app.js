(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const OPEN = 390;
  const CLOSE = 900;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const BAKES = [
    { id: 'sourdough', name: 'Country sourdough', note: 'White and whole wheat, 900 g', out: 390, gone: 700, qty: 40, price: 9, ledger: '11:42 am' },
    { id: 'croissant', name: 'Butter croissant', note: 'Cultured butter, 27 layers', out: 420, gone: 620, qty: 96, price: 4.25, ledger: '10:18 am' },
    { id: 'bun', name: 'Cardamom morning bun', note: 'Orange zest and cardamom sugar', out: 450, gone: 595, qty: 48, price: 4.75, ledger: '9:52 am' },
    { id: 'rye', name: 'Seeded rye', note: 'Sunflower, flax and caraway', out: 510, gone: 715, qty: 24, price: 9.5, ledger: '11:58 am' },
    { id: 'focaccia', name: 'Rosemary focaccia', note: 'Olive oil and flaky salt', out: 570, gone: 760, qty: 36, price: 6, ledger: '12:35 pm' },
    { id: 'baguette', name: 'Baguette', note: 'Long cold ferment', out: 630, gone: 795, qty: 60, price: 4, ledger: '1:20 pm' },
    { id: 'cookie', name: 'Chocolate rye cookie', note: 'Dark chocolate and sea salt', out: 720, gone: 870, qty: 72, price: 3.5, ledger: '2:25 pm' },
  ];
  const MAX_HOLD = 4;

  const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
  const parts = m => {
    const h = Math.floor(m / 60), mm = m % 60;
    return { t: `${h % 12 || 12}:${String(mm).padStart(2, '0')}`, ap: h < 12 ? 'am' : 'pm' };
  };
  const label = m => { const p = parts(m); return `${p.t} ${p.ap}`; };

  const nowDate = new Date();
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  const today = nowDate.getDay();
  const isOpenDay = d => d !== 1;
  const live = isOpenDay(today) && nowMin >= OPEN && nowMin < CLOSE;

  function nextOpening() {
    if (isOpenDay(today) && nowMin < OPEN) return { day: 'today', sameDay: true, offset: 0 };
    for (let i = 1; i <= 7; i++) {
      const d = (today + i) % 7;
      if (isOpenDay(d)) return { day: i === 1 ? 'tomorrow' : DAYS[d], dayName: DAYS[d], sameDay: false, offset: i };
    }
  }

  function stateAt(b, t) {
    if (t < b.out - 20) return { s: 'soon', left: b.qty, p: 0, status: `Out at ${label(b.out)}`, cls: 's-soon', countText: `${b.qty} coming` };
    if (t < b.out) return { s: 'soon', left: b.qty, p: 0, status: 'In the oven', cls: 's-soon', countText: `${b.qty} coming` };
    if (t >= b.gone) return { s: 'sold', left: 0, p: 0, status: 'Sold out', cls: 's-sold', countText: 'None left' };
    const prog = (t - b.out) / (b.gone - b.out);
    const left = Math.max(1, Math.ceil(b.qty * Math.pow(1 - prog, 1.35)));
    const ratio = left / b.qty;
    if (t < b.out + 20) return { s: 'fresh', left, p: ratio, status: 'Just out', cls: 's-fresh', countText: `<b>${left}</b> left` };
    if (ratio <= 0.22) return { s: 'fast', left, p: ratio, status: 'Selling fast', cls: 's-fast', countText: `<b>${left}</b> left` };
    return { s: 'avail', left, p: ratio, status: 'On the shelf', cls: 's-avail', countText: `<b>${left}</b> left` };
  }

  const cart = new Map();
  let clockT = live ? Math.round(nowMin / 5) * 5 : 605;
  clockT = Math.min(900, Math.max(360, clockT));

  const rowsEl = $('[data-rows]');
  const slider = $('#clock');
  const nowBtn = $('[data-now]');
  const nowLine = document.createElement('div');
  nowLine.className = 'now';
  nowLine.setAttribute('aria-hidden', 'true');
  nowLine.innerHTML = '<span></span>';

  rowsEl.innerHTML = BAKES.map(b => {
    const p = parts(b.out);
    return `<article class="row" data-id="${b.id}">
      <div class="t num">${p.t}<small>${p.ap}</small></div>
      <div class="who"><div class="name">${b.name}</div><p class="note">${b.note}</p></div>
      <div class="left-col"><div class="left-count" data-count></div><div class="bar"><i data-bar></i></div><p class="ledger">Yesterday: gone by ${b.ledger}</p></div>
      <div class="price num">${money(b.price)}</div>
      <span class="status" data-status></span>
      <div class="hold" data-hold></div>
    </article>`;
  }).join('');

  function renderHold(row, b, st) {
    const el = $('[data-hold]', row);
    const qty = cart.get(b.id) || 0;
    const sig = `${st.s}|${qty}`;
    if (el.dataset.sig === sig) return;
    el.dataset.sig = sig;
    if (st.s === 'sold') {
      el.innerHTML = '<button class="btn btn-line-light" type="button" disabled>Hold one</button>';
    } else if (qty === 0) {
      el.innerHTML = `<button class="btn btn-butter" type="button" data-add="${b.id}">Hold one</button>`;
    } else {
      el.innerHTML = `<div class="step" role="group" aria-label="Held ${b.name}"><button type="button" data-dec="${b.id}" aria-label="Remove one ${b.name}"><svg class="i"><use href="#i-minus"/></svg></button><output aria-live="polite">${qty}</output><button type="button" data-inc="${b.id}" aria-label="Add one ${b.name}"><svg class="i"><use href="#i-plus"/></svg></button></div>`;
    }
  }

  function render(t) {
    clockT = t;
    let firstAfter = null;
    BAKES.forEach(b => {
      const row = $(`.row[data-id="${b.id}"]`, rowsEl);
      const st = stateAt(b, t);
      row.dataset.state = st.s === 'sold' ? 'sold' : st.s === 'soon' ? 'soon' : 'live';
      $('[data-count]', row).innerHTML = st.countText;
      $('[data-bar]', row).style.setProperty('--p', st.p.toFixed(3));
      const status = $('[data-status]', row);
      status.className = 'status ' + st.cls;
      status.textContent = st.status;
      renderHold(row, b, st);
      if (!firstAfter && b.out > t) firstAfter = row;
    });
    nowLine.firstChild.textContent = live && t === Math.round(nowMin / 5) * 5 ? `Now, ${label(t)}` : label(t);
    rowsEl.insertBefore(nowLine, firstAfter);

    const p = parts(t);
    $('[data-clock]').innerHTML = `${p.t}<small>${p.ap}</small>`;
    const atNow = live && t === Math.min(900, Math.max(360, Math.round(nowMin / 5) * 5));
    $('[data-clock-sub]').textContent = atNow ? 'Live from the counter' : live ? 'Drag back to now' : 'A typical morning';
    nowBtn.hidden = !live || atNow;
    slider.value = t;
    slider.setAttribute('aria-valuetext', label(t));
    const pct = ((t - 360) / 540) * 100;
    slider.style.setProperty('--fill', pct + '%');
    renderShelf(t);
  }

  const shelfRows = $('[data-shelf-rows]');
  const SHELF = BAKES.slice(0, 5);
  shelfRows.innerHTML = SHELF.map(b => {
    const p = parts(b.out);
    return `<li class="srow" data-id="${b.id}"><div class="t num">${p.t}<small>${p.ap}</small></div><div><div class="nm">${b.name}</div><div class="sub" data-s-sub></div></div><span class="status" data-s-status></span></li>`;
  }).join('');

  function renderShelf(t) {
    SHELF.forEach(b => {
      const row = $(`.srow[data-id="${b.id}"]`, shelfRows);
      const st = stateAt(b, t);
      row.dataset.state = st.s;
      $('[data-s-sub]', row).textContent = st.s === 'soon' ? `${b.qty} coming` : st.s === 'sold' ? 'None left' : `${st.left} left`;
      const s = $('[data-s-status]', row);
      s.className = 'status ' + st.cls;
      s.textContent = st.status;
    });
    $('[data-shelf-time]').textContent = live && t === Math.min(900, Math.max(360, Math.round(nowMin / 5) * 5)) ? `Right now, ${label(t)}` : `A typical ${label(t)}`;
  }

  slider.addEventListener('input', () => render(Number(slider.value)));
  nowBtn.addEventListener('click', () => render(Math.min(900, Math.max(360, Math.round(nowMin / 5) * 5))));

  rowsEl.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.add || btn.dataset.inc || btn.dataset.dec;
    if (!id) return;
    const cur = cart.get(id) || 0;
    const b = BAKES.find(x => x.id === id);
    const left = stateAt(b, clockT).left || MAX_HOLD;
    if (btn.dataset.add) cart.set(id, 1);
    if (btn.dataset.inc) cart.set(id, Math.min(cur + 1, MAX_HOLD, left));
    if (btn.dataset.dec) { cur <= 1 ? cart.delete(id) : cart.set(id, cur - 1); }
    afterCartChange();
    const next = $(`[data-inc="${id}"]`, rowsEl) || $(`[data-add="${id}"]`, rowsEl);
    if (next) next.focus();
  });

  const tray = $('[data-tray]');
  function totals() {
    let n = 0, sum = 0;
    cart.forEach((q, id) => { n += q; sum += q * BAKES.find(b => b.id === id).price; });
    return { n, sum };
  }
  function afterCartChange() {
    const { n, sum } = totals();
    $('[data-tray-count]').textContent = `${n} ${n === 1 ? 'item' : 'items'} held`;
    $('[data-tray-total]').textContent = `${money(Number(sum.toFixed(2)))}, pay at the counter`;
    n > 0 ? tray.setAttribute('data-on', '') : tray.removeAttribute('data-on');
    render(clockT);
  }

  const dlg = $('#reserveDlg');
  const form = $('[data-form]', dlg);
  const done = $('[data-done]', dlg);

  function pickupSlots() {
    const slots = [];
    const next = nextOpening();
    let dayLabel, from;
    if (live && nowMin + 30 <= 870) {
      dayLabel = 'Today';
      from = Math.max(OPEN, Math.ceil((nowMin + 30) / 30) * 30);
    } else if (isOpenDay(today) && nowMin < OPEN) {
      dayLabel = 'Today';
      from = OPEN;
    } else {
      dayLabel = next.day === 'tomorrow' ? 'Tomorrow' : next.dayName;
      from = OPEN;
    }
    for (let m = from; m <= 870; m += 30) slots.push({ value: `${dayLabel} ${label(m)}`, text: `${dayLabel}, ${label(m)}` });
    return slots;
  }

  function openDialog() {
    if (cart.size === 0) {
      const pick = BAKES.find(b => stateAt(b, clockT).s !== 'sold') || BAKES[0];
      cart.set(pick.id, 1);
      afterCartChange();
    }
    const lines = [...cart].map(([id, q]) => {
      const b = BAKES.find(x => x.id === id);
      return `<div class="line"><span>${q} × ${b.name}</span><span class="num">${money(Number((q * b.price).toFixed(2)))}</span></div>`;
    }).join('');
    const { sum } = totals();
    $('[data-lines]', dlg).innerHTML = lines + `<div class="line total"><span>Total, paid at pickup</span><span class="num">${money(Number(sum.toFixed(2)))}</span></div>`;
    $('#f-time').innerHTML = pickupSlots().map(s => `<option value="${s.value}">${s.text}</option>`).join('');
    $('[data-error]', dlg).hidden = true;
    form.hidden = false;
    done.hidden = true;
    dlg.showModal();
  }

  $$('[data-reserve]').forEach(b => b.addEventListener('click', openDialog));
  $('[data-open-dialog]').addEventListener('click', openDialog);
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  dlg.addEventListener('close', () => { if (!done.hidden) { cart.clear(); afterCartChange(); } });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#f-name').value.trim();
    const phone = $('#f-phone').value.trim();
    const err = $('[data-error]', dlg);
    if (!name || phone.replace(/\D/g, '').length < 7) {
      err.textContent = !name ? 'Add a name so we know whose bag it is.' : 'Add a phone number we can reach you on.';
      err.hidden = false;
      (!name ? $('#f-name') : $('#f-phone')).focus();
      return;
    }
    const time = $('#f-time').value;
    const items = [...cart].map(([id, q]) => ({ id, name: BAKES.find(b => b.id === id).name, qty: q }));
    document.dispatchEvent(new CustomEvent('alder:reserve', { detail: { name, phone, pickup: time, items, total: totals().sum } }));
    $('[data-done-title]').textContent = `You're all set, ${name}.`;
    $('[data-done-text]').textContent = `Your order will be at the counter for ${time.toLowerCase()}. Pay when you collect.`;
    form.hidden = true;
    done.hidden = false;
    $('button', done).focus();
  });

  const sheet = $('#navSheet');
  $$('[data-open-nav]').forEach(b => b.addEventListener('click', () => sheet.showModal()));
  $$('[data-close-nav]').forEach(b => b.addEventListener('click', () => sheet.close()));

  const tabs = $$('[role=tab]');
  const bar = $('[data-tabbar]');
  function moveBar(animate) {
    const t = tabs.find(x => x.getAttribute('aria-selected') === 'true');
    if (!t) return;
    bar.style.transition = animate ? '' : 'none';
    bar.style.transform = `translateX(${t.offsetLeft}px) scaleX(${t.offsetWidth / 100})`;
  }
  function selectTab(t, focus) {
    tabs.forEach(x => {
      const on = x === t;
      x.setAttribute('aria-selected', on);
      x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
    moveBar(true);
    if (focus) t.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });
  moveBar(false);
  window.addEventListener('resize', () => moveBar(false));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveBar(false));

  const loaf = BAKES[0];
  const loafNow = stateAt(loaf, nowMin);
  const next = nextOpening();
  const heroLive = $('[data-hero-live]');
  if (live) {
    const left = loafNow.left;
    heroLive.innerHTML = loafNow.s === 'sold'
      ? `Open until 3 pm<span>The country sourdough is gone for today. More pastry and focaccia on the shelf.</span>`
      : `Open until 3 pm<span>${left} country ${left === 1 ? 'loaf' : 'loaves'} left right now.</span>`;
  } else {
    const when = next.sameDay ? 'today at 6:30 am' : `${next.day} at 6:30 am`;
    heroLive.innerHTML = `Opens ${when}<span>The first country loaves come out at 6:30.</span>`;
  }
  const openShort = live ? 'Open until 3 pm' : `Opens ${next.sameDay ? 'today' : next.day} 6:30 am`;
  $$('[data-open-line]').forEach(el => { el.textContent = openShort; });
  const big = $('[data-open-line-big]');
  if (big) big.textContent = live ? 'Open now, until 3 pm.' : `Closed right now. We open ${next.sameDay ? 'today' : next.day} at 6:30 am.`;
  const li = $(`.hours li[data-day="${today}"]`);
  if (li) li.setAttribute('data-today', '');

  render(clockT);
})();
