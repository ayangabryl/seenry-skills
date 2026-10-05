// Seenry, MIT. A truthful, interruptible text transition for short product statuses.
export function createStatusSwitch(root, {
  initial = root?.textContent?.trim(),
  reserve = [],
  duration = 240,
} = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError('Pass an HTML element');
  if (root.children.length) throw new TypeError('The status element must start with text only');
  if (typeof initial !== 'string' || !initial.trim()) throw new TypeError('Pass a nonempty initial status');
  if (!Array.isArray(reserve) || reserve.some(value => typeof value !== 'string' || !value.trim())) {
    throw new TypeError('reserve must contain nonempty status strings');
  }
  if (!Number.isFinite(duration) || duration < 0) throw new TypeError('duration must be nonnegative');

  const original = {
    role: root.getAttribute('role'), live: root.getAttribute('aria-live'),
    atomic: root.getAttribute('aria-atomic'), marker: root.getAttribute('data-status-switch'),
  };
  const restore = (name, value) => value === null ? root.removeAttribute(name) : root.setAttribute(name, value);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const measure = document.createElement('span');
  const stage = document.createElement('span');
  const accessible = document.createElement('span');
  measure.className = 'seenry-status-switch__measure';
  stage.className = 'seenry-status-switch__stage';
  stage.setAttribute('aria-hidden', 'true');
  accessible.className = 'seenry-status-switch__accessible';
  measure.setAttribute('aria-hidden', 'true');
  root.setAttribute('data-status-switch', '');
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-atomic', 'true');
  root.replaceChildren(measure, stage, accessible);

  const known = new Set(reserve);
  const sizing = value => {
    const span = document.createElement('span');
    span.textContent = value;
    return span;
  };
  const addMeasure = value => {
    if (!known.has(value)) { known.add(value); measure.append(sizing(value)); }
  };
  for (const value of known) measure.append(sizing(value));

  const visual = value => {
    const span = document.createElement('span');
    span.className = 'seenry-status-switch__text';
    span.textContent = value;
    return span;
  };
  let value = initial.trim();
  let active = visual(value);
  let outgoing = null;
  let disposed = false;
  addMeasure(value);
  stage.append(active);
  accessible.textContent = value;

  const settle = () => {
    for (const node of [active, outgoing]) {
      if (node) node.getAnimations().forEach(animation => animation.cancel());
    }
    outgoing?.remove();
    outgoing = null;
    active.style.opacity = '1';
    active.style.transform = 'none';
  };
  const onMotion = () => { if (motion.matches) settle(); };
  motion.addEventListener('change', onMotion);

  function update(next) {
    if (disposed) throw new Error('Status switch has been destroyed');
    if (typeof next !== 'string' || !next.trim()) throw new TypeError('Pass a nonempty status');
    next = next.trim();
    if (next === value) return value;
    value = next;
    addMeasure(next);
    accessible.textContent = next; // Product truth changes before presentation.
    outgoing?.getAnimations().forEach(animation => animation.cancel());
    outgoing?.remove();
    outgoing = active;
    active = visual(next);
    stage.append(active);
    if (motion.matches || duration === 0 || !active.animate) {
      settle();
      return value;
    }

    // Sample the interrupted entry so the previous text exits from its current frame.
    const oldOpacity = getComputedStyle(outgoing).opacity;
    const oldTransform = getComputedStyle(outgoing).transform;
    outgoing.getAnimations().forEach(animation => animation.cancel());
    const leaving = outgoing;
    const exit = leaving.animate([
      { opacity: oldOpacity, transform: oldTransform },
      { opacity: 0, transform: 'translateY(-1em)' },
    ], { duration: duration * .52, easing: 'ease-in', fill: 'forwards' });
    exit.finished.then(() => { if (outgoing === leaving) { leaving.remove(); outgoing = null; } }).catch(() => {});
    active.animate([
      { opacity: 0, transform: 'translateY(1em)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: duration * .72, delay: duration * .18, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    return value;
  }

  return {
    update,
    get value() { return value; },
    destroy() {
      if (disposed) return;
      disposed = true;
      motion.removeEventListener('change', onMotion);
      settle();
      root.textContent = value;
      restore('role', original.role);
      restore('aria-live', original.live);
      restore('aria-atomic', original.atomic);
      restore('data-status-switch', original.marker);
    },
  };
}
