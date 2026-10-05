// Seenry, MIT. Directional movement between existing views; the app owns routing.
export function createDirectionalStage(root, { initial, focus = true } = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError('Pass a stage element');
  const views = [...root.children].filter(child => child instanceof HTMLElement && child.hasAttribute('data-view'));
  const ids = views.map(view => view.dataset.view);
  if (!views.length || ids.some(id => !id) || new Set(ids).size !== ids.length) {
    throw new TypeError('Give each direct view a unique data-view value');
  }
  const first = initial ?? ids[0];
  if (!ids.includes(first)) throw new RangeError(`Unknown view: ${first}`);

  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const original = {
    height: root.style.height,
    state: root.getAttribute('data-stage-state'),
    views: views.map(view => ({
      view,
      transform: view.style.transform,
      opacity: view.style.opacity,
      inert: view.inert,
      ariaHidden: view.getAttribute('aria-hidden'),
    })),
  };
  let active = ids.indexOf(first);
  let disposed = false;
  let settleTimer = 0;
  let focusFrame = 0;

  function size() {
    if (!disposed) root.style.height = `${Math.ceil(views[active].getBoundingClientRect().height)}px`;
  }
  function settle() {
    clearTimeout(settleTimer);
    root.dataset.stageState = 'settled';
  }
  function transitionMs() {
    const [duration] = getComputedStyle(views[active]).transitionDuration.split(',');
    const value = parseFloat(duration) || 0;
    return duration.trim().endsWith('ms') ? value : value * 1000;
  }
  function present({ moveFocus = false } = {}) {
    views.forEach((view, index) => {
      const current = index === active;
      view.inert = !current;
      if (current) view.removeAttribute('aria-hidden');
      else view.setAttribute('aria-hidden', 'true');
      view.style.transform = `translate3d(${Math.sign(index - active) * 100}%, 0, 0)`;
      view.style.opacity = current ? '1' : '0';
    });
    size();
    if (moveFocus && focus) {
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        const heading = views[active].querySelector('[data-view-focus]');
        if (heading instanceof HTMLElement) heading.focus({ preventScroll: true });
      });
    }
  }
  // Initial placement should never slide in from another view.
  root.dataset.stageState = 'initial';
  present();
  requestAnimationFrame(() => { if (!disposed && root.dataset.stageState === 'initial') settle(); });

  const resizeObserver = new ResizeObserver(size);
  views.forEach(view => resizeObserver.observe(view));
  const onPreference = () => {
    if (media.matches) settle();
  };
  const onTransitionEnd = event => {
    if (event.target === views[active] && event.propertyName === 'transform') settle();
  };
  media.addEventListener('change', onPreference);
  root.addEventListener('transitionend', onTransitionEnd);

  return {
    get current() { return ids[active]; },
    show(id, { moveFocus = true } = {}) {
      if (disposed) return false;
      const next = ids.indexOf(id);
      if (next < 0) throw new RangeError(`Unknown view: ${id}`);
      if (next === active) return false;
      clearTimeout(settleTimer);
      cancelAnimationFrame(focusFrame);
      active = next;
      root.dataset.stageState = media.matches ? 'settled' : 'moving';
      present({ moveFocus });
      if (!media.matches) settleTimer = setTimeout(settle, transitionMs() + 80);
      return true;
    },
    refresh: size,
    destroy() {
      if (disposed) return;
      disposed = true;
      clearTimeout(settleTimer);
      cancelAnimationFrame(focusFrame);
      resizeObserver.disconnect();
      media.removeEventListener('change', onPreference);
      root.removeEventListener('transitionend', onTransitionEnd);
      root.style.height = original.height;
      if (original.state === null) root.removeAttribute('data-stage-state');
      else root.setAttribute('data-stage-state', original.state);
      original.views.forEach(({ view, transform, opacity, inert, ariaHidden }) => {
        view.style.transform = transform;
        view.style.opacity = opacity;
        view.inert = inert;
        if (ariaHidden === null) view.removeAttribute('aria-hidden');
        else view.setAttribute('aria-hidden', ariaHidden);
      });
    },
  };
}
