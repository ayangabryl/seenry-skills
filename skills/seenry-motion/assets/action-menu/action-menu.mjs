// Seenry, MIT. An action menu with one state owner and interruptible presentation.
let nextId = 0;

export function createActionMenu(trigger, panel, { onSelect = () => {} } = {}) {
  if (!(trigger instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
    throw new TypeError('Pass a trigger and menu element');
  }
  if (typeof onSelect !== 'function') throw new TypeError('onSelect must be a function');

  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const original = {
    id: panel.getAttribute('id'), role: panel.getAttribute('role'),
    state: panel.getAttribute('data-state'), hidden: panel.hidden, inert: panel.inert,
    haspopup: trigger.getAttribute('aria-haspopup'),
    controls: trigger.getAttribute('aria-controls'),
    expanded: trigger.getAttribute('aria-expanded'),
  };
  const restore = (element, name, value) => {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  };
  const items = () => [...panel.querySelectorAll('[role="menuitem"]')]
    .filter(item => !item.disabled && item.getAttribute('aria-disabled') !== 'true');
  const ownsFocus = () => panel.contains(document.activeElement);
  const focusItem = index => {
    const all = items();
    if (all.length) all[(index + all.length) % all.length].focus();
  };
  let open = false;
  let disposed = false;
  let hideTimer = 0;
  if (!original.id) panel.id = `seenry-action-menu-${++nextId}`;
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-controls', panel.id);
  trigger.setAttribute('aria-expanded', 'false');
  panel.setAttribute('role', 'menu');
  panel.hidden = true;
  panel.inert = true;
  panel.dataset.state = 'closed';

  function setOpen(next, { focus = 'first', returnFocus = false } = {}) {
    if (disposed || next === open) return;
    clearTimeout(hideTimer);
    open = next;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      panel.hidden = false;
      panel.inert = false;
      // Flush the closed frame; a quick reversal resumes from the current CSS value.
      panel.getBoundingClientRect();
      panel.dataset.state = 'open';
      if (focus === 'first') focusItem(0);
      if (focus === 'last') focusItem(items().length - 1);
    } else {
      if (returnFocus || ownsFocus()) trigger.focus();
      panel.inert = true;
      panel.dataset.state = 'closed';
      if (media.matches) {
        panel.hidden = true;
      } else {
        // Transitionend can be skipped by a hidden tab or a zero-duration host style.
        hideTimer = setTimeout(() => { if (!open) panel.hidden = true; }, 260);
      }
    }
  }

  const onTriggerClick = () => setOpen(!open);
  const onTriggerKey = event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (open) focusItem(event.key === 'ArrowDown' ? 0 : items().length - 1);
    else setOpen(true, { focus: event.key === 'ArrowDown' ? 'first' : 'last' });
  };
  const onMenuKey = event => {
    const all = items();
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false, { returnFocus: true }); return; }
    if (event.key === 'Tab') { setTimeout(() => { if (open) setOpen(false); }, 0); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = all.indexOf(document.activeElement);
    if (event.key === 'Home') focusItem(0);
    if (event.key === 'End') focusItem(all.length - 1);
    if (event.key === 'ArrowDown') focusItem(current + 1);
    if (event.key === 'ArrowUp') focusItem(current - 1);
  };
  const onPanelClick = event => {
    const item = event.target instanceof Element ? event.target.closest('[role="menuitem"]') : null;
    if (!item || !panel.contains(item) || !items().includes(item)) return;
    setOpen(false, { returnFocus: true });
    onSelect(item);
  };
  const onOutsidePointer = event => {
    if (open && !trigger.contains(event.target) && !panel.contains(event.target)) {
      // Let the pointer's target receive focus before making menu descendants inert.
      setTimeout(() => { if (open) setOpen(false); }, 0);
    }
  };
  const onFocusOut = () => setTimeout(() => {
    if (open && !ownsFocus()) setOpen(false);
  }, 0);
  const onPreference = () => {
    if (media.matches && !open) { clearTimeout(hideTimer); panel.hidden = true; }
  };

  trigger.addEventListener('click', onTriggerClick);
  trigger.addEventListener('keydown', onTriggerKey);
  panel.addEventListener('keydown', onMenuKey);
  panel.addEventListener('click', onPanelClick);
  panel.addEventListener('focusout', onFocusOut);
  document.addEventListener('pointerdown', onOutsidePointer);
  media.addEventListener('change', onPreference);

  return {
    setOpen,
    get open() { return open; },
    destroy() {
      if (disposed) return;
      disposed = true;
      clearTimeout(hideTimer);
      trigger.removeEventListener('click', onTriggerClick);
      trigger.removeEventListener('keydown', onTriggerKey);
      panel.removeEventListener('keydown', onMenuKey);
      panel.removeEventListener('click', onPanelClick);
      panel.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('pointerdown', onOutsidePointer);
      media.removeEventListener('change', onPreference);
      if (ownsFocus()) trigger.focus();
      panel.hidden = original.hidden;
      panel.inert = original.inert;
      restore(panel, 'data-state', original.state);
      restore(panel, 'role', original.role);
      restore(panel, 'id', original.id);
      restore(trigger, 'aria-haspopup', original.haspopup);
      restore(trigger, 'aria-controls', original.controls);
      restore(trigger, 'aria-expanded', original.expanded);
    },
  };
}
