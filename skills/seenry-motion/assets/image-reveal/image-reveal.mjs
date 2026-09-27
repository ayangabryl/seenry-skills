/** Reveal a decoded image over the previous useful image. The application owns loading state. */
export function createImageReveal(initialImage, { duration = 640, onStateChange = () => {} } = {}) {
  if (!(initialImage instanceof HTMLImageElement) || !(initialImage.parentElement instanceof HTMLElement)) {
    throw new TypeError('Expected an image inside an HTML element');
  }
  if (!Number.isFinite(duration) || duration < 0) throw new RangeError('duration must be nonnegative');

  let image = initialImage;
  const host = image.parentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'seenry-image-reveal__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Canvas 2D is unavailable');
  host.append(canvas);

  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let generation = 0;
  let frame = 0;
  let incoming = null;
  let loadingResolve = null;
  let active = null;
  let destroyed = false;
  let state = 'idle';

  function setState(next) {
    if (state === next) return;
    state = next;
    host.dataset.imageRevealState = next;
    onStateChange(next);
  }

  function measure() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return false;
    const scale = Math.min(window.devicePixelRatio || 1, 2, 720 / Math.max(width, height));
    const pixelsWide = Math.max(1, Math.round(width * scale));
    const pixelsHigh = Math.max(1, Math.round(height * scale));
    if (canvas.width !== pixelsWide || canvas.height !== pixelsHigh) {
      canvas.width = pixelsWide;
      canvas.height = pixelsHigh;
    }
    return true;
  }

  function sourceRect(source) {
    const sourceRatio = source.naturalWidth / source.naturalHeight;
    const targetRatio = canvas.width / canvas.height;
    if (sourceRatio > targetRatio) {
      const width = source.naturalHeight * targetRatio;
      return [(source.naturalWidth - width) / 2, 0, width, source.naturalHeight];
    }
    const height = source.naturalWidth / targetRatio;
    return [0, (source.naturalHeight - height) / 2, source.naturalWidth, height];
  }

  function hash(x, y) {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function paint(source, progress) {
    if (!measure()) return;
    const width = canvas.width;
    const height = canvas.height;
    const [sx, sy, sw, sh] = sourceRect(source);
    const cell = Math.max(14, Math.round(Math.min(width, height) / 19));
    context.clearRect(0, 0, width, height);
    for (let y = 0, row = 0; y < height; y += cell, row++) {
      for (let x = 0, column = 0; x < width; x += cell, column++) {
        const threshold = hash(column, row) * 0.72;
        if (progress < threshold) continue;
        const w = Math.min(cell, width - x);
        const h = Math.min(cell, height - y);
        const cropX = sx + x / width * sw;
        const cropY = sy + y / height * sh;
        const cropW = w / width * sw;
        const cropH = h / height * sh;
        const clarity = Math.min(1, Math.max(0, (progress - threshold) / 0.28));
        context.drawImage(source, cropX + cropW / 2, cropY + cropH / 2, 1, 1, x, y, w, h);
        if (clarity > 0) {
          context.globalAlpha = clarity;
          context.drawImage(source, cropX, cropY, cropW, cropH, x, y, w, h);
          context.globalAlpha = 1;
        }
      }
    }
  }

  function cancelFrame() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function finish(source, alt, token) {
    if (destroyed || token !== generation) return 'superseded';
    source.onload = null;
    source.onerror = null;
    for (const { name, value } of image.attributes) {
      if (name !== 'src' && name !== 'alt') source.setAttribute(name, value);
    }
    source.alt = alt;
    image.replaceWith(source);
    image = source;
    canvas.hidden = true;
    context.clearRect(0, 0, canvas.width, canvas.height);
    active = null;
    setState('idle');
    return 'shown';
  }

  function stopLoading() {
    if (!incoming) return;
    incoming.onload = null;
    incoming.onerror = null;
    incoming.src = '';
    incoming = null;
    loadingResolve?.(false);
    loadingResolve = null;
  }

  async function show(src, alt = '') {
    if (destroyed) throw new Error('Image reveal has been destroyed');
    if (typeof src !== 'string' || !src) throw new TypeError('src must be a nonempty URL');
    const token = ++generation;
    cancelFrame();
    stopLoading();
    active?.resolve?.('superseded');
    active = null;
    canvas.hidden = true;
    setState('loading');

    const source = new Image();
    incoming = source;
    const loaded = await new Promise(resolve => {
      loadingResolve = resolve;
      source.onload = () => resolve(true);
      source.onerror = () => resolve(false);
      source.src = src;
    });
    if (destroyed || token !== generation) return 'superseded';
    incoming = null;
    loadingResolve = null;
    if (!loaded) { setState('error'); return 'error'; }
    try { await source.decode?.(); } catch { /* onload already confirmed usable pixels */ }
    if (destroyed || token !== generation) return 'superseded';
    if (motion?.matches || duration === 0) return finish(source, alt, token);
    canvas.hidden = false;
    if (!measure()) return finish(source, alt, token);
    active = { source, alt, token, progress: 0 };
    setState('revealing');
    const started = performance.now();
    return new Promise(resolve => {
      active.resolve = resolve;
      const tick = now => {
        if (destroyed || token !== generation) return;
        const progress = Math.min(1, (now - started) / duration);
        active.progress = progress;
        paint(source, progress);
        if (progress < 1) frame = requestAnimationFrame(tick);
        else { frame = 0; resolve(finish(source, alt, token)); }
      };
      frame = requestAnimationFrame(tick);
    });
  }

  function onMotionChange() {
    if (!motion?.matches || !active) return;
    const { source, alt, token, resolve } = active;
    cancelFrame();
    resolve(finish(source, alt, token));
  }

  function onResize() {
    if (active) paint(active.source, active.progress);
  }

  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
  resize?.observe(host);
  if (!resize) window.addEventListener('resize', onResize);
  motion?.addEventListener?.('change', onMotionChange);
  canvas.hidden = true;
  host.dataset.imageRevealState = state;

  return {
    show,
    get state() { return state; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      generation++;
      cancelFrame();
      stopLoading();
      active?.resolve?.('superseded');
      active = null;
      resize?.disconnect();
      if (!resize) window.removeEventListener('resize', onResize);
      motion?.removeEventListener?.('change', onMotionChange);
      canvas.remove();
      delete host.dataset.imageRevealState;
    },
  };
}
