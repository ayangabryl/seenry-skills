// Seenry, MIT. A native modal dialog with an interruptible presentation layer.
let nextId = 0;

export function createModalSurface(trigger, dialog, { onClose = () => {} } = {}) {
  if (!(trigger instanceof HTMLElement) || !(dialog instanceof HTMLDialogElement)) {
    throw new TypeError('Pass a trigger and a <dialog> element');
  }
  if (typeof onClose !== 'function') throw new TypeError('onClose must be a function');

  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const original = {
    id: dialog.getAttribute('id'), state: dialog.getAttribute('data-state'),
    haspopup: trigger.getAttribute('aria-haspopup'), controls: trigger.getAttribute('aria-controls'),
    expanded: trigger.getAttribute('aria-expanded'),
  };
  const restore = (element, name, value) => {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  };
  if (!dialog.id) dialog.id = `seenry-modal-surface-${++nextId}`;
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', dialog.id);
  trigger.setAttribute('aria-expanded', 'false');
  dialog.dataset.state = 'closed';

  let disposed = false;
  let desiredOpen = false;
  let closeTimer = 0;

  function finishClose({ returnFocus = true } = {}) {
    clearTimeout(closeTimer);
    if (dialog.open) dialog.close();
    dialog.dataset.state = 'closed';
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus && trigger.isConnected) trigger.focus();
  }

  function setOpen(next, { returnFocus = true } = {}) {
    if (disposed) return;
    next = Boolean(next);
    if (next === desiredOpen && dialog.dataset.state !== 'closing') return;
    desiredOpen = next;
    clearTimeout(closeTimer);
    trigger.setAttribute('aria-expanded', String(next));
    if (next) {
      if (!dialog.open) {
        dialog.dataset.state = 'closed';
        dialog.showModal();
      }
      // Keep the dialog in the top layer during a reversal; CSS starts from its
      // current interpolated values instead of replaying the entrance.
      dialog.getBoundingClientRect();
      dialog.dataset.state = 'open';
      return;
    }
    if (media.matches) {
      finishClose({ returnFocus });
      onClose();
      return;
    }
    dialog.dataset.state = 'closing';
    closeTimer = setTimeout(() => {
      if (!desiredOpen) {
        finishClose({ returnFocus });
        onClose();
      }
    }, 340);
  }

  const onTriggerClick = () => setOpen(true);
  const onCancel = event => { event.preventDefault(); setOpen(false); };
  const onDialogClick = event => {
    if (event.target === dialog) setOpen(false);
    else if (event.target instanceof Element && event.target.closest('[data-modal-close]')) setOpen(false);
  };
  const onNativeClose = () => {
    // A host may call dialog.close() directly. Reconcile without reopening it.
    // An earlier close event can arrive after a quick reopen; ignore that event.
    if (!desiredOpen || dialog.open) return;
    desiredOpen = false;
    clearTimeout(closeTimer);
    dialog.dataset.state = 'closed';
    trigger.setAttribute('aria-expanded', 'false');
    if (trigger.isConnected) trigger.focus();
    onClose();
  };
  const onPreference = () => {
    if (media.matches && dialog.dataset.state === 'closing') {
      finishClose();
      onClose();
    }
  };

  trigger.addEventListener('click', onTriggerClick);
  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('close', onNativeClose);
  media.addEventListener('change', onPreference);

  return {
    setOpen,
    get open() { return desiredOpen; },
    destroy() {
      if (disposed) return;
      disposed = true;
      desiredOpen = false;
      finishClose();
      trigger.removeEventListener('click', onTriggerClick);
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('click', onDialogClick);
      dialog.removeEventListener('close', onNativeClose);
      media.removeEventListener('change', onPreference);
      restore(dialog, 'id', original.id);
      restore(dialog, 'data-state', original.state);
      restore(trigger, 'aria-haspopup', original.haspopup);
      restore(trigger, 'aria-controls', original.controls);
      restore(trigger, 'aria-expanded', original.expanded);
    },
  };
}
