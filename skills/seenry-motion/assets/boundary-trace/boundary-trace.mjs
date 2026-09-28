const namespace = 'http://www.w3.org/2000/svg';
let nextGradientId = 0;

function radiusInPixels(value, dimension) {
  const first = String(value).split(/\s+/)[0];
  const amount = Number.parseFloat(first);
  if (!Number.isFinite(amount)) return 0;
  return first.endsWith('%') ? amount * dimension / 100 : amount;
}

/** Add an original decorative travelling rim to an existing surface. */
export function createBoundaryTrace(surface, { active = false, color, colors, cycle = 2800, segment = 16, stroke = 2, glow: glowStrength = 0.3, staticAppearance = 'outline' } = {}) {
  if (!(surface instanceof HTMLElement)) throw new TypeError('Expected a host HTML element');
  if (!Number.isFinite(cycle) || cycle < 1000) throw new RangeError('cycle must be at least 1000ms');
  if (!Number.isFinite(segment) || segment < 4 || segment > 30) throw new RangeError('segment must be 4–30 percent of the path');
  if (!Number.isFinite(stroke) || stroke < 1 || stroke > 6) throw new RangeError('stroke must be 1–6 pixels');
  if (!Number.isFinite(glowStrength) || glowStrength < 0 || glowStrength > 1) throw new RangeError('glow must be between 0 and 1');
  if (!['outline', 'segment'].includes(staticAppearance)) throw new TypeError('staticAppearance must be outline or segment');
  if (colors !== undefined && (!Array.isArray(colors) || colors.length < 2 || colors.length > 4 || colors.some(value => typeof value !== 'string' || !value.trim()))) {
    throw new TypeError('colors must contain 2–4 CSS color strings');
  }

  const svg = document.createElementNS(namespace, 'svg');
  svg.classList.add('seenry-boundary-trace');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('data-mode', 'idle');
  let gradient;
  if (colors) {
    const defs = document.createElementNS(namespace, 'defs');
    gradient = document.createElementNS(namespace, 'linearGradient');
    const gradientId = `seenry-trace-gradient-${++nextGradientId}`;
    gradient.id = gradientId;
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    colors.forEach((value, index) => {
      const stop = document.createElementNS(namespace, 'stop');
      stop.setAttribute('offset', `${index * 100 / (colors.length - 1)}%`);
      stop.setAttribute('stop-color', value);
      gradient.append(stop);
    });
    defs.append(gradient);
    svg.append(defs);
    svg.style.setProperty('--seenry-trace-stroke', `url(#${gradientId})`);
  }
  const glow = document.createElementNS(namespace, 'rect');
  const line = document.createElementNS(namespace, 'rect');
  glow.classList.add('seenry-boundary-trace__glow');
  line.classList.add('seenry-boundary-trace__line');
  const gap = 100 - segment;
  for (const rect of [glow, line]) {
    rect.setAttribute('pathLength', '100');
    rect.setAttribute('stroke-dasharray', `${segment} ${gap}`);
  }
  glow.setAttribute('stroke-width', String(stroke * 5));
  line.setAttribute('stroke-width', String(stroke));
  svg.append(glow, line);
  svg.style.setProperty('--seenry-trace-cycle', `${cycle}ms`);
  svg.style.setProperty('--seenry-trace-glow-opacity', String(glowStrength));
  svg.style.setProperty('--seenry-trace-glow-blur', `${3 + glowStrength * 8}px`);
  if (color !== undefined) svg.style.setProperty('--seenry-trace-color', color);

  const originalPosition = surface.style.position;
  const ownsPosition = getComputedStyle(surface).position === 'static';
  if (ownsPosition) surface.style.position = 'relative';
  surface.append(svg);

  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let requested = Boolean(active);
  let visible = true;
  let destroyed = false;
  let resizeFrame = 0;

  function setMode() {
    if (destroyed) return;
    svg.dataset.mode = !requested ? 'idle' : motion?.matches ? 'static' : !visible || document.hidden ? 'paused' : 'running';
    if (svg.dataset.mode === 'static' && staticAppearance === 'outline') {
      glow.setAttribute('stroke-dasharray', '100 0');
      line.setAttribute('stroke-dasharray', '100 0');
    } else {
      glow.setAttribute('stroke-dasharray', `${segment} ${gap}`);
      line.setAttribute('stroke-dasharray', `${segment} ${gap}`);
    }
  }

  function measure() {
    resizeFrame = 0;
    if (destroyed) return;
    const width = surface.clientWidth;
    const height = surface.clientHeight;
    if (width <= 0 || height <= 0) return;
    const inset = stroke * 1.5 + 1;
    const style = getComputedStyle(surface);
    const radius = Math.min(radiusInPixels(style.borderTopLeftRadius, Math.min(width, height)), width / 2, height / 2);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    if (gradient) {
      gradient.setAttribute('x1', '0');
      gradient.setAttribute('y1', '0');
      gradient.setAttribute('x2', String(width));
      gradient.setAttribute('y2', String(height));
    }
    for (const rect of [glow, line]) {
      rect.setAttribute('x', String(inset));
      rect.setAttribute('y', String(inset));
      rect.setAttribute('width', String(Math.max(0, width - 2 * inset)));
      rect.setAttribute('height', String(Math.max(0, height - 2 * inset)));
      rect.setAttribute('rx', String(Math.max(0, radius - inset)));
    }
  }

  function scheduleMeasure() {
    if (!resizeFrame && !destroyed) resizeFrame = requestAnimationFrame(measure);
  }

  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasure);
  resize?.observe(surface);
  if (!resize) window.addEventListener('resize', scheduleMeasure);
  const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    setMode();
  });
  intersection?.observe(surface);
  document.addEventListener('visibilitychange', setMode);
  motion?.addEventListener?.('change', setMode);
  measure();
  setMode();

  return {
    setActive(value) { requested = Boolean(value); setMode(); },
    get mode() { return svg.dataset.mode; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resize?.disconnect();
      intersection?.disconnect();
      if (!resize) window.removeEventListener('resize', scheduleMeasure);
      document.removeEventListener('visibilitychange', setMode);
      motion?.removeEventListener?.('change', setMode);
      svg.remove();
      if (ownsPosition) surface.style.position = originalPosition;
    },
  };
}
