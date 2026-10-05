import { createDisclosure } from '../geometry-transition.mjs';

/** A single, in-flow card disclosure. The application still owns the revealed content. */
export function createExpandingCard(trigger, panel, options = {}) {
  if (!(trigger instanceof HTMLButtonElement)) throw new TypeError('The trigger must be a button');
  if (!(panel instanceof HTMLElement) || !panel.firstElementChild) {
    throw new TypeError('The panel needs an intrinsic content wrapper');
  }
  if (options.initialOpen !== undefined && typeof options.initialOpen !== 'boolean') {
    throw new TypeError('initialOpen must be boolean');
  }
  const original = {
    id: panel.id,
    controls: trigger.getAttribute('aria-controls'),
    expanded: trigger.getAttribute('aria-expanded'),
  };
  if (!panel.id) panel.id = `seenry-card-${crypto.randomUUID()}`;
  trigger.setAttribute('aria-controls', panel.id);
  const disclosure = createDisclosure(panel, options);
  let destroyed = false;

  function setOpen(next) {
    if (destroyed) return;
    if (typeof next !== 'boolean') throw new TypeError('Open state must be boolean');
    if (!next && panel.contains(document.activeElement)) trigger.focus();
    trigger.setAttribute('aria-expanded', String(next));
    disclosure.setOpen(next);
  }
  const onClick = () => setOpen(!disclosure.open);
  const onKeyDown = event => {
    if (event.key === 'Escape' && disclosure.open && panel.contains(event.target)) {
      event.preventDefault();
      setOpen(false);
    }
  };
  trigger.addEventListener('click', onClick);
  panel.addEventListener('keydown', onKeyDown);
  setOpen(options.initialOpen ?? original.expanded === 'true');

  return {
    setOpen,
    get open() { return disclosure.open; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      trigger.removeEventListener('click', onClick);
      panel.removeEventListener('keydown', onKeyDown);
      disclosure.destroy();
      if (original.id) panel.id = original.id;
      else panel.removeAttribute('id');
      for (const [name, value] of [['aria-controls', original.controls], ['aria-expanded', original.expanded]]) {
        if (value === null) trigger.removeAttribute(name);
        else trigger.setAttribute(name, value);
      }
    },
  };
}
