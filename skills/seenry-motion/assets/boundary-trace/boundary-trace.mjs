const namespace = 'http://www.w3.org/2000/svg';

function radiusInPixels(value, dimension) {
  const first = String(value).split(/\s+/)[0];
  const amount = Number.parseFloat(first);
  if (!Number.isFinite(amount)) return 0;
  return first.endsWith('%') ? amount * dimension / 100 : amount;
}

/** Add an original decorative travelling rim to an existing surface. */
export function createBoundaryTrace(surface, { active = false, color, cycle = 2800, segment = 16, stroke = 2 } = {}) {
  if (!(surface instanceof HTMLElement)) throw new TypeError('Expected a host HTML element');
  if (!Number.isFinite(cycle) || cycle < 1000) throw new RangeError('cycle must be at least 1000ms');
  if (!Number.isFinite(segment) || segment < 4 || segment > 30) throw new RangeError('segment must be 4–30 percent of the path');
  if (!Number.isFinite(stroke) || stroke < 1 || stroke > 6) throw new RangeError('stroke must be 1–6 pixels');

  const svg = document.createElementNS(namespace, 'svg');
  svg.classList.add('seenry-boundary-trace');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('data-mode', 'idle');
  const glow = document.createElementNS(namespace, 'rect');
  const line = document.createElementNS(namespace, 'rect');
  glow.classList.add('seenry-boundary-trace__glow');
  line.classList.add('seenry-boundary-trace__line');
  const gap = 100 - segment;
  for (const rect of [glow, line]) {
    rect.setAttribute('pathLength', '100');
    rect.setAttribute('stroke-dasharray', `${segment} ${gap}`);
  }
  glow.setAttribute('stroke-width', String(stroke * 3));
  line.setAttribute('stroke-width', String(stroke));
  svg.append(glow, line);
  svg.style.setProperty('--seenry-trace-cycle', `${cycle}ms`);
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
    if (svg.dataset.mode === 'static') {
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
