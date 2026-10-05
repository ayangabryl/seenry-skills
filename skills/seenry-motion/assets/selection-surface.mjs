// Seenry, MIT. Decorative motion only; the host owns selection, focus and activation.
export function relativeBounds(root, target) {
  const a = root.getBoundingClientRect(), b = target.getBoundingClientRect();
  return { x: b.left - a.left + root.scrollLeft - root.clientLeft,
    y: b.top - a.top + root.scrollTop - root.clientTop, width: b.width, height: b.height };
}

export function createSelectionSurface(root, { selectedLayer, hoverLayer, selector = ':scope > button, :scope > a' }) {
  let disposed = false, frame = 0, hover = null, observed = new Set();
  const selected = '[aria-selected="true"],[aria-pressed="true"],[aria-current="page"]';
  const items = () => [...root.querySelectorAll(selector)];
  const itemFor = node => node instanceof Element ? items().find(item => item === node || item.contains(node)) : null;
  const place = (layer, item) => {
    if (!layer) return;
    if (!item || !item.getClientRects().length) { layer.dataset.visible = 'false'; return; }
    const b = relativeBounds(root, item);
    // CSS transitions retarget from the current presentation, preserving unequal label widths.
    if (layer.dataset.visible !== 'true') layer.dataset.moving = 'false';
    Object.assign(layer.style, { transform: `translate(${b.x}px, ${b.y}px)`, width: b.width + 'px', height: b.height + 'px' });
    layer.dataset.visible = 'true';
    if (layer.dataset.moving === 'false') { layer.getBoundingClientRect(); layer.dataset.moving = 'true'; }
  };
  const resize = new ResizeObserver(() => schedule());
  const refresh = () => {
    if (disposed) return;
    const all = items();
    for (const item of all) if (!observed.has(item)) { observed.add(item); resize.observe(item); }
    for (const item of observed) if (!all.includes(item)) { resize.unobserve(item); observed.delete(item); }
    const active = all.find(item => item.matches(selected));
    place(selectedLayer, active);
    if (!all.includes(hover)) hover = null;
    place(hoverLayer, hover === active ? null : hover);
    root.dataset.surfaceReady = 'true';
  };
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(refresh); };
  const over = event => { if (event.pointerType === 'touch') return; hover = itemFor(event.target); refresh(); };
  const leave = () => { hover = items().find(item => item.matches(':focus-visible')) || null; refresh(); };
  const focus = event => { hover = itemFor(event.target); refresh(); };
  const blur = event => { hover = itemFor(event.relatedTarget); refresh(); };
  const mutation = new MutationObserver(schedule);
  mutation.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected','aria-pressed','aria-current'] });
  root.addEventListener('pointerover', over); root.addEventListener('pointerleave', leave);
  root.addEventListener('focusin', focus); root.addEventListener('focusout', blur);
  resize.observe(root); refresh();
  document.fonts?.ready.then(() => { if (!disposed) refresh(); });
  return { refresh, destroy() {
    disposed = true; cancelAnimationFrame(frame); mutation.disconnect(); resize.disconnect();
    root.removeEventListener('pointerover', over); root.removeEventListener('pointerleave', leave);
    root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur);
    delete root.dataset.surfaceReady;
  } };
}
