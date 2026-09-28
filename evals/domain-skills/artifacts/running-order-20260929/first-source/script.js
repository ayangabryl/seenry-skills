(() => {
  const items = {
    doors: { title: 'Doors and welcome', duration: 10 },
    notes: { title: 'Field notes', duration: 25 },
    questions: { title: 'Audience questions', duration: 15 }
  };
  const initialOrder = ['doors', 'notes', 'questions'];
  let order = [...initialOrder];
  let drag = null;
  const list = document.getElementById('agenda');
  const reset = document.getElementById('reset');
  const status = document.getElementById('status');
  const rows = Object.fromEntries([...list.querySelectorAll('.agenda-item')].map(row => [row.dataset.id, row]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const formatTime = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const startAt = ids => {
    let minute = 18 * 60;
    const starts = {};
    ids.forEach(id => { starts[id] = formatTime(minute); minute += items[id].duration; });
    return starts;
  };
  const display = ids => {
    const starts = startAt(ids);
    ids.forEach((id, index) => {
      const row = rows[id];
      row.querySelector('.row-index').textContent = String(index + 1).padStart(2, '0');
      const time = row.querySelector('.start-time');
      time.textContent = starts[id];
      time.dateTime = starts[id];
      row.querySelector('.grip').setAttribute('aria-label', `Move ${items[id].title}, position ${index + 1} of 3. Starts ${starts[id]}`);
    });
    return starts;
  };
  const say = (message, confirmed = false) => {
    status.querySelector('.status-text').textContent = message;
    status.classList.toggle('is-confirmed', confirmed);
  };
  const rects = () => Object.fromEntries([...list.querySelectorAll('.agenda-item')].map(row => [row.dataset.id, row.getBoundingClientRect()]));
  const animateLayout = before => {
    if (reduced.matches) return;
    for (const row of list.querySelectorAll('.agenda-item')) {
      const old = before[row.dataset.id];
      if (!old) continue;
      const now = row.getBoundingClientRect();
      const dy = old.top - now.top;
      if (Math.abs(dy) < 1) continue;
      row.getAnimations().forEach(animation => animation.cancel());
      row.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  };
  const placeRows = ids => ids.forEach(id => list.append(rows[id]));
  const commit = (ids, movedId) => {
    order = [...ids];
    const starts = display(order);
    say(`${items[movedId].title} moved to position ${order.indexOf(movedId) + 1} · starts at ${starts[movedId]}.`, true);
  };
  const moveByKeyboard = (id, target) => {
    const from = order.indexOf(id);
    target = Math.max(0, Math.min(order.length - 1, target));
    if (from === target) { say(`${items[id].title} is already at ${target === 0 ? 'the start' : 'the end'}.`); return; }
    const before = rects();
    const next = [...order]; next.splice(from, 1); next.splice(target, 0, id);
    placeRows(next); commit(next, id); animateLayout(before);
    rows[id].querySelector('.grip').focus({ preventScroll: true });
  };

  list.addEventListener('keydown', event => {
    const handle = event.target.closest('.grip');
    if (!handle || drag) return;
    const id = handle.closest('.agenda-item').dataset.id;
    const index = order.indexOf(id);
    const target = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: 2 }[event.key];
    if (target === undefined) return;
    event.preventDefault(); moveByKeyboard(id, target);
  });

  const unbind = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('blur', onCancel);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('keydown', onDragKey);
  };
  const restoreRowStyle = row => {
    row.classList.remove('is-dragging');
    row.style.removeProperty('position'); row.style.removeProperty('left'); row.style.removeProperty('top');
    row.style.removeProperty('width'); row.style.removeProperty('height'); row.style.removeProperty('z-index');
  };
  const cleanup = () => { document.body.classList.remove('drag-active'); unbind(); drag = null; };
  const proposedOrder = () => [...list.children].map(node => node === drag.placeholder ? drag.id : node.dataset.id);
  const beginLift = () => {
    const d = drag;
    const box = d.row.getBoundingClientRect();
    d.offsetX = d.lastX - box.left; d.offsetY = d.lastY - box.top;
    const slot = document.createElement('li'); slot.className = 'drag-slot'; slot.textContent = 'RELEASE HERE'; slot.setAttribute('aria-hidden', 'true');
    slot.style.height = `${box.height}px`; d.placeholder = slot;
    d.row.replaceWith(slot);
    document.body.append(d.row);
    Object.assign(d.row.style, { position: 'fixed', left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, zIndex: '100' });
    d.row.classList.add('is-dragging'); document.body.classList.add('drag-active'); d.active = true;
  };
  const insertSlotAt = y => {
    const d = drag;
    const other = [...list.querySelectorAll('.agenda-item')];
    const listTop = list.getBoundingClientRect().top;
    const next = other.find(row => y < listTop + row.offsetTop + row.offsetHeight / 2);
    const before = rects();
    if (next) list.insertBefore(d.placeholder, next); else list.append(d.placeholder);
    const ids = proposedOrder();
    if (ids.join() !== d.proposed.join()) { d.proposed = ids; display(ids); animateLayout(before); }
  };
  function onMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.lastX = event.clientX; drag.lastY = event.clientY;
    if (!drag.active) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
      beginLift();
    }
    drag.row.style.left = `${event.clientX - drag.offsetX}px`;
    drag.row.style.top = `${event.clientY - drag.offsetY}px`;
    insertSlotAt(event.clientY);
    event.preventDefault();
  }
  function onUp(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const d = drag;
    if (!d.active) { cleanup(); return; }
    const floating = d.row.getBoundingClientRect();
    const next = proposedOrder();
    d.placeholder.replaceWith(d.row);
    restoreRowStyle(d.row);
    const settled = d.row.getBoundingClientRect();
    if (next.join() !== order.join()) {
      commit(next, d.id);
    } else { display(order); say('Order unchanged.'); }
    if (!reduced.matches) {
      d.row.animate([{ transform: `translate(${floating.left - settled.left}px, ${floating.top - settled.top}px) rotate(-1.1deg)`, boxShadow: '0 22px 44px rgba(19,48,39,.2)' }, { transform: 'translate(0, 0) rotate(0)', boxShadow: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    cleanup();
  }
  function cancelDrag(message = 'Move cancelled. Order unchanged.') {
    if (!drag) return;
    if (drag.active) {
      drag.placeholder.remove(); restoreRowStyle(drag.row);
      placeRows(drag.origin); display(drag.origin);
    }
    say(message); cleanup();
  }
  function onCancel() { cancelDrag(); }
  function onResize() { cancelDrag('Move cancelled after resize. Order unchanged.'); }
  function onDragKey(event) { if (event.key === 'Escape') { event.preventDefault(); cancelDrag(); } }
  list.addEventListener('pointerdown', event => {
    const handle = event.target.closest('.grip');
    if (!handle || drag || event.button !== 0) return;
    const row = handle.closest('.agenda-item');
    drag = { id: row.dataset.id, row, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, origin: [...order], proposed: [...order], active: false };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('blur', onCancel);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onDragKey);
  });
  reset.addEventListener('click', () => {
    if (drag) cancelDrag();
    const before = rects();
    order = [...initialOrder]; placeRows(order); display(order); animateLayout(before);
    say('Running order reset · Doors and welcome starts at 18:00.', true);
  });
  display(order);
})();
