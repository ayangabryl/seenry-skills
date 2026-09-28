// Original Seenry voice aperture. MIT; see the repository LICENSE.
const STATES = new Set(['idle', 'listening', 'speaking', 'error']);
const NS = 'http://www.w3.org/2000/svg';
const levelOf = value => typeof value === 'number' && Number.isFinite(value)
  ? Math.min(1, Math.max(0, value)) : 0;

/** Decorative only. The caller owns audio, state, controls and announcements. */
export function createVoicePresence(host, { state = 'idle', level = 0, static: fixed = false } = {}) {
  if (!host || host.nodeType !== 1) throw new TypeError('Voice presence needs a host element');
  if (!STATES.has(state)) throw new RangeError(`Unknown voice state: ${state}`);
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('voice-presence');
  const shells = [];
  const ribs = [];
  for (const side of [-1, 1]) {
    const group = doc.createElementNS(NS, 'g');
    group.setAttribute('class', side < 0 ? 'vp-left' : 'vp-right');
    const shell = doc.createElementNS(NS, 'path');
    shell.setAttribute('class', 'vp-shell');
    group.append(shell);
    shells.push({ side, node: shell });
    for (let i = 0; i < 4; i++) {
      const rib = doc.createElementNS(NS, 'path');
      rib.setAttribute('class', 'vp-rib');
      rib.setAttribute('opacity', String(.35 + i * .18));
      group.append(rib);
      ribs.push({ side, i, node: rib });
    }
    svg.append(group);
  }
  const seam = doc.createElementNS(NS, 'path');
  seam.setAttribute('class', 'vp-seam');
  svg.append(seam);
  host.append(svg);

  let target = state === 'listening' || state === 'speaking' ? levelOf(level) : 0;
  let shown = target;
  let frame = 0, last = 0, destroyed = false, visible = true;
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const active = () => state === 'listening' || state === 'speaking';
  const quiet = () => fixed || motion.matches;
  const effective = () => active() ? target : 0;
  const stop = () => { win.cancelAnimationFrame(frame); frame = 0; last = 0; };

  function draw() {
    svg.dataset.state = state;
    svg.dataset.presentation = quiet() ? 'static' : 'responsive';
    // Reduced motion fixes the folds; only their ink responds to actual level.
    const amount = quiet() ? (active() ? .42 : 0) : shown;
    const gap = 1 + amount * 3;
    const spread = 3 + Math.sqrt(amount) * 17;
    for (const { side, node } of shells) {
      const x = 24 + side * gap;
      const outer = 24 + side * spread;
      node.setAttribute('d', `M ${x} 7 C ${outer} 12 ${outer} 36 ${x} 41 C ${x + side * 2} 30 ${x + side * 2} 18 ${x} 7 Z`);
    }
    for (const { side, i, node } of ribs) {
      const x = 24 + side * (gap + i * .24);
      const reach = 24 + side * (gap + (spread - gap) * (i + 1) / 4);
      node.setAttribute('d', `M ${x} ${8 + i * .6} C ${reach} 16 ${reach} 32 ${x} ${40 - i * .6}`);
    }
    seam.setAttribute('d', state === 'error' ? 'M22 21 L26 25 M26 21 L22 25' : 'M24 21 L24 27');
    svg.style.setProperty('--vp-energy', String(active() ? .45 + shown * .55 : .38));
  }

  function tick(time) {
    frame = 0;
    if (destroyed) return;
    if (doc.hidden || !visible || quiet()) { sync(true); return; }
    const delta = last ? Math.min(time - last, 48) : 16;
    last = time;
    const goal = effective();
    // Short attack, softer release; no oscillator, idle pulse or invented signal.
    shown += (goal - shown) * (1 - Math.exp(-delta / (goal > shown ? 38 : 90)));
    if (Math.abs(goal - shown) < .001) shown = goal;
    draw();
    if (shown !== goal) frame = win.requestAnimationFrame(tick);
    else last = 0;
  }

  function sync(immediate = false) {
    if (destroyed) return;
    if (immediate || quiet() || !active() || !visible || doc.hidden) {
      stop();
      shown = effective();
    }
    draw();
    if (shown !== effective() && !frame) frame = win.requestAnimationFrame(tick);
  }
  const onEnvironment = () => sync(true);
  const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync(true);
  }) : null;
  observer?.observe(host);
  motion.addEventListener('change', onEnvironment);
  doc.addEventListener('visibilitychange', onEnvironment);
  sync(true);

  return {
    /** Partial updates retain omitted values. Idle/error discard any audio level. */
    update(next = {}) {
      if (destroyed) return;
      const nextState = next.state ?? state;
      if (!STATES.has(nextState)) throw new RangeError(`Unknown voice state: ${nextState}`);
      state = nextState;
      if ('level' in next) target = levelOf(next.level);
      if (!active()) target = 0;
      if ('static' in next) fixed = Boolean(next.static);
      sync();
    },
    get state() { return state; },
    get isAnimating() { return Boolean(frame); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      observer?.disconnect();
      motion.removeEventListener('change', onEnvironment);
      doc.removeEventListener('visibilitychange', onEnvironment);
      svg.remove();
    },
  };
}
