// Original Seenry pointer response. The host owns interaction; only the visual plane moves.
export function createPointerTilt(host, { plane, maxDegrees = 8, glare = null } = {}) {
  if (!(host instanceof HTMLElement) || !(plane instanceof HTMLElement) || !host.contains(plane)) {
    throw new TypeError('Pass a host and its visual plane');
  }
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const limit = Math.max(0, Math.min(16, Number(maxDegrees) || 0));
  let frame = 0;
  let point = null;
  let active = false;
  let destroyed = false;

  function paint() {
    frame = 0;
    if (!active || !point || media.matches || !hover.matches) return;
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(-1, Math.min(1, ((point.x - rect.left) / rect.width) * 2 - 1));
    const y = Math.max(-1, Math.min(1, ((point.y - rect.top) / rect.height) * 2 - 1));
    plane.style.setProperty('--tilt-x', `${(-y * limit).toFixed(2)}deg`);
    plane.style.setProperty('--tilt-y', `${(x * limit).toFixed(2)}deg`);
    if (glare) {
      glare.style.setProperty('--glare-x', `${((x + 1) * 50).toFixed(1)}%`);
      glare.style.setProperty('--glare-y', `${((y + 1) * 50).toFixed(1)}%`);
      glare.style.opacity = String(Math.max(0.12, 0.32 + x * 0.1 - y * 0.06));
    }
  }
  function reset() {
    active = false;
    point = null;
    cancelAnimationFrame(frame);
    frame = 0;
    plane.style.setProperty('--tilt-x', '0deg');
    plane.style.setProperty('--tilt-y', '0deg');
    if (glare) glare.style.opacity = '0';
  }
  function move(event) {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    if (!hover.matches || media.matches) return;
    active = true;
    point = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(paint);
  }
  const changed = () => { if (media.matches || !hover.matches) reset(); };
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', reset);
  host.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);
  media.addEventListener('change', changed);
  hover.addEventListener('change', changed);
  return {
    reset,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      reset();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', reset);
      host.removeEventListener('pointercancel', reset);
      window.removeEventListener('blur', reset);
      media.removeEventListener('change', changed);
      hover.removeEventListener('change', changed);
    },
  };
}
