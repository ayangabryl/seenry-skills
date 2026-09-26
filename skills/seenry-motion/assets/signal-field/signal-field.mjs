// Decorative process field. Product state and accessible text remain in the host DOM.
const TAU = Math.PI * 2;
const STATES = new Set(['idle', 'working', 'success', 'error']);

export function createSignalField(canvas, options = {}) {
  if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Expected a canvas element');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = options.state ?? 'idle';
  if (!STATES.has(state)) throw new RangeError(`Unknown signal state: ${state}`);
  let visible = true;
  let destroyed = false;
  let frame = 0;
  let start = performance.now();
  let width = 0;
  let height = 0;
  let ink = options.color ?? getComputedStyle(canvas).color;

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function resize() {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint(performance.now());
  }

  function strokeArc(radius, from, to, opacity, lineWidth = 1.5) {
    context.globalAlpha = opacity;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.arc(0, 0, radius, from, to);
    context.stroke();
  }

  function dot(angle, radius, size, opacity) {
    context.globalAlpha = opacity;
    context.beginPath();
    context.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, size, 0, TAU);
    context.fill();
  }

  function paint(now) {
    if (destroyed || !width || !height) return;
    context.clearRect(0, 0, width, height);
    const unit = Math.min(width, height) / 2;
    const t = (now - start) / 1000;
    const moving = state === 'working' && !motion.matches && visible && !document.hidden;
    const phase = moving ? t : 0;
    context.save();
    context.translate(width / 2, height / 2);
    context.strokeStyle = ink;
    context.fillStyle = ink;
    context.lineCap = 'round';

    // Broken tracks give working a moving route; terminal states have distinct silhouettes.
    for (let ring = 0; ring < 3; ring++) {
      const radius = unit * (0.31 + ring * 0.25);
      const offset = ring * 0.63;
      for (let segment = 0; segment < 4; segment++) {
        const from = segment * TAU / 4 + offset + 0.16;
        strokeArc(radius, from, from + 0.78, state === 'idle' ? 0.18 : state === 'error' ? 0.42 : 0.25, 1.15);
      }
      if (state === 'working') {
        const direction = ring === 1 ? -1 : 1;
        const angle = direction * phase * (0.58 + ring * 0.16) + ring * 1.9 - Math.PI / 2;
        strokeArc(radius, angle, angle + 0.49, moving ? 0.88 : 0.65, 2.7);
        dot(angle + 0.49, radius, 2.3, 0.95);
      }
    }

    // Fixed receivers make the moving emphasis read as a signal travelling through a field.
    for (let index = 0; index < 12; index++) {
      const angle = index * TAU / 12 - Math.PI / 2;
      const inner = unit * 0.47;
      const outer = unit * 0.64;
      const travel = (phase * 2.2) % 12;
      const distance = Math.min(Math.abs(index - travel), 12 - Math.abs(index - travel));
      const emphasis = moving ? Math.max(0, 1 - distance / 2.1) : 0;
      context.globalAlpha = 0.12 + emphasis * 0.35;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      context.stroke();
      dot(angle, outer, 1.25 + emphasis * 1.4, 0.36 + emphasis * 0.6);
    }

    // A central compass-like trace changes only when the application changes state.
    context.globalAlpha = 1;
    context.lineWidth = 2.8;
    if (state === 'success') {
      strokeArc(unit * 0.28, 0, TAU, 0.9, 2.6);
      strokeArc(unit * 0.82, -Math.PI * 0.85, Math.PI * 0.85, 0.64, 2.2);
      context.beginPath();
      context.moveTo(-unit * 0.16, 0);
      context.lineTo(-unit * 0.035, unit * 0.11);
      context.lineTo(unit * 0.19, -unit * 0.14);
      context.stroke();
    } else if (state === 'error') {
      strokeArc(unit * 0.29, -Math.PI * 0.88, Math.PI * 0.88, 0.96, 3);
      strokeArc(unit * 0.82, -Math.PI * 0.75, -Math.PI * 0.25, 0.76, 2.4);
      strokeArc(unit * 0.82, Math.PI * 0.25, Math.PI * 0.75, 0.76, 2.4);
      context.beginPath();
      context.moveTo(0, -unit * 0.16);
      context.lineTo(0, unit * 0.055);
      context.stroke();
      dot(Math.PI / 2, unit * 0.17, 1.8, 1);
    } else {
      const pulse = moving ? 0.76 + Math.sin(phase * 2.4) * 0.18 : 0.76;
      dot(0, 0, unit * 0.092, pulse);
      strokeArc(unit * 0.19, -Math.PI * 0.78, -Math.PI * 0.22, 0.55, 1.3);
      strokeArc(unit * 0.19, Math.PI * 0.22, Math.PI * 0.78, 0.55, 1.3);
    }
    context.restore();
    context.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    paint(now);
    if (shouldRun()) frame = requestAnimationFrame(tick);
  }

  function shouldRun() {
    return !destroyed && state === 'working' && !motion.matches && visible && !document.hidden;
  }

  function sync() {
    stop();
    paint(performance.now());
    if (shouldRun()) frame = requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    sync();
  });
  const resizer = new ResizeObserver(resize);
  const onVisibility = () => sync();
  const onMotion = () => sync();
  observer.observe(canvas);
  resizer.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  motion.addEventListener('change', onMotion);
  resize();
  sync();

  return {
    update(next, settings = {}) {
      if (destroyed) return;
      if (!STATES.has(next)) throw new RangeError(`Unknown signal state: ${next}`);
      state = next;
      if (settings.color) ink = settings.color;
      start = performance.now();
      sync();
    },
    getState() { return state; },
    isAnimating() { return !!frame; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      observer.disconnect();
      resizer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
    },
  };
}
