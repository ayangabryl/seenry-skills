// A finite, decorative confirmation effect. Application state is never owned here.
const defaultColors = ['#d96943', '#e9b95f', '#6c9b86', '#f3e7cb'];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
function random(seed) {
  let state = seed >>> 0 || 1;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
}

export function createConfirmationBurst(target, options = {}) {
  if (!(target instanceof Element)) throw new TypeError('Pass the element whose completed action owns the burst');
  const count = Number.isFinite(options.count) ? clamp(Math.round(options.count), 8, 48) : 28;
  const duration = Number.isFinite(options.duration) ? clamp(options.duration, 450, 1500) : 920;
  const colors = Array.isArray(options.colors) && options.colors.length && options.colors.every(color => typeof color === 'string') ? options.colors : defaultColors;
  const seed = Number.isFinite(options.seed) ? options.seed : 4123;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let canvas = null, context = null, raf = 0, started = 0, particles = [], generation = 0, destroyed = false;
  let bounds = null;

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    canvas?.remove();
    canvas = null;
    context = null;
    particles = [];
    bounds = null;
  }
  function end() { clear(); }
  function visible(rect) {
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
  }
  function frame(now) {
    if (!canvas || destroyed || reduced.matches || document.hidden) { end(); return; }
    const elapsed = now - started;
    const progress = clamp(elapsed / duration, 0, 1);
    const rect = target.getBoundingClientRect();
    if (!visible(rect)) { end(); return; }
    // Follow a moving control without moving particle trajectories in the local canvas.
    canvas.style.left = `${rect.left + rect.width / 2 - bounds.width / 2}px`;
    canvas.style.top = `${rect.top + rect.height / 2 - bounds.height / 2}px`;
    context.clearRect(0, 0, bounds.width, bounds.height);
    const t = elapsed / 1000;
    for (const particle of particles) {
      const x = bounds.width / 2 + particle.x + particle.vx * t + 0.5 * particle.wind * t * t;
      const y = bounds.height / 2 + particle.y + particle.vy * t + 0.5 * 560 * t * t;
      if (x < -20 || x > bounds.width + 20 || y > bounds.height + 20) continue;
      const fade = Math.min(1, (1 - progress) * 4);
      context.save();
      context.translate(x, y);
      context.rotate(particle.angle + particle.spin * t);
      context.globalAlpha = fade * particle.opacity;
      context.fillStyle = particle.color;
      if (particle.round) {
        context.beginPath();
        context.arc(0, 0, particle.size * 0.42, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-particle.size / 2, -particle.size * 0.22, particle.size, particle.size * 0.44);
      }
      context.restore();
    }
    if (progress < 1) raf = requestAnimationFrame(frame);
    else end();
  }
  function play() {
    if (destroyed) return false;
    clear();
    if (reduced.matches || document.hidden) return false;
    const rect = target.getBoundingClientRect();
    if (!visible(rect)) return false;
    bounds = { width: clamp(rect.width + 300, 320, 540), height: clamp(rect.height + 230, 250, 360) };
    const dpr = clamp(devicePixelRatio || 1, 1, 3);
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.dataset.confirmationBurst = '';
    canvas.width = Math.ceil(bounds.width * dpr);
    canvas.height = Math.ceil(bounds.height * dpr);
    Object.assign(canvas.style, {
      position: 'fixed', left: `${rect.left + rect.width / 2 - bounds.width / 2}px`,
      top: `${rect.top + rect.height / 2 - bounds.height / 2}px`, width: `${bounds.width}px`,
      height: `${bounds.height}px`, pointerEvents: 'none', zIndex: '1000'
    });
    document.body.append(canvas);
    context = canvas.getContext('2d');
    if (!context) { end(); return false; }
    context.scale(dpr, dpr);
    const next = random(seed + ++generation);
    particles = Array.from({ length: count }, (_, index) => {
      const side = index % 2 ? 1 : -1;
      const spread = 0.38 + next() * 0.62;
      return {
        x: side * (rect.width * (0.32 + next() * 0.16)),
        y: -rect.height * (0.12 + next() * 0.22),
        vx: side * (68 + next() * 125) * spread,
        vy: -(160 + next() * 145),
        wind: side * (next() - 0.5) * 80,
        angle: next() * Math.PI,
        spin: (next() - 0.5) * 12,
        size: 5 + next() * 5,
        opacity: 0.75 + next() * 0.25,
        round: index % 6 === 0,
        color: colors[index % colors.length]
      };
    });
    started = performance.now();
    raf = requestAnimationFrame(frame);
    return true;
  }
  const stopForPreference = () => { if (reduced.matches) end(); };
  const stopWhenHidden = () => { if (document.hidden) end(); };
  reduced.addEventListener('change', stopForPreference);
  document.addEventListener('visibilitychange', stopWhenHidden);
  return {
    play,
    get active() { return Boolean(canvas); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      end();
      reduced.removeEventListener('change', stopForPreference);
      document.removeEventListener('visibilitychange', stopWhenHidden);
    }
  };
}
