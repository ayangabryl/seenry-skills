/** Development-only layout guides for plain HTML, Vue, Svelte, and other DOM hosts. */
export function mountDevLayoutGrid({selectors='[data-layout-region]'}={}) {
  if (typeof document === 'undefined' || !document.body) throw new Error('Mount after document.body exists');
  if (typeof selectors !== 'string' || !selectors.trim()) throw new TypeError('Provide region selectors');

  let enabled = true, checks = false, frame = 0, hovered = null, disposed = false;
  const observedRegions = new Set();
  const gridButton = document.createElement('button');
  const checksButton = document.createElement('button');
  const overlay = document.createElement('div');
  const checksLayer = document.createElement('div');
  const columns = document.createElement('div');
  const ruler = document.createElement('div');
  const boxes = document.createElement('div');
  const hover = document.createElement('div');
  for (const button of [gridButton, checksButton]) {
    button.type = 'button';
    button.dataset.layoutTools = '';
  }
  gridButton.className = 'layout-grid-toggle';
  checksButton.className = 'layout-check-toggle';
  overlay.className = 'layout-grid-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  checksLayer.className = 'layout-grid-checks';
  checksLayer.hidden = true;
  columns.className = 'layout-grid-columns';
  ruler.className = 'layout-grid-ruler';
  hover.className = 'layout-grid-hover';
  hover.hidden = true;
  for (let index = 0; index < 12; index++) columns.append(document.createElement('i'));
  overlay.append(checksLayer, columns, ruler, boxes, hover);
  document.body.append(overlay, checksButton, gridButton);

  const numeric = value => Number.parseFloat(value) || 0;
  const title = element => element.dataset.layoutName || element.id || element.classList[0] || element.tagName.toLowerCase();
  const updateButtons = () => {
    gridButton.setAttribute('aria-pressed', String(enabled));
    gridButton.textContent = `Grid ${enabled ? 'on' : 'off'} · Alt G`;
    checksButton.setAttribute('aria-pressed', String(checks));
    checksButton.textContent = `8px checks ${checks ? 'on' : 'off'} · Alt C`;
    checksLayer.hidden = !checks;
    overlay.hidden = !enabled;
  };
  const read = () => {
    if (!enabled) return;
    boxes.replaceChildren();
    const regions = [...document.querySelectorAll(selectors)];
    for (const element of observedRegions) if (!regions.includes(element)) {
      resizeObserver.unobserve(element); observedRegions.delete(element);
    }
    for (const element of regions) {
      if (!observedRegions.has(element)) {resizeObserver.observe(element);observedRegions.add(element);}
      if (element.closest('[data-layout-tools],.layout-grid-overlay')) continue;
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      if (!rect.width || !rect.height || style.visibility === 'hidden') continue;
      const left = numeric(style.paddingLeft), right = numeric(style.paddingRight);
      const box = document.createElement('div'), label = document.createElement('span');
      box.className = 'layout-grid-box';
      Object.assign(box.style, {left:`${rect.left + left}px`,top:`${rect.top}px`,width:`${Math.max(0,rect.width-left-right)}px`,height:`${rect.height}px`});
      label.textContent = `${title(element)} · ${Math.round(rect.width-left-right)}px`;
      box.append(label); boxes.append(box);
    }
    if (hovered?.isConnected) showHover(hovered);
  };
  const schedule = () => {if (disposed) return;cancelAnimationFrame(frame);frame = requestAnimationFrame(read);};
  const showHover = element => {
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    if (!rect.width || !rect.height) {hover.hidden = true;return;}
    hovered = element;
    hover.hidden = false;
    Object.assign(hover.style, {left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
    hover.replaceChildren();
    const label = document.createElement('span'), inner = document.createElement('i');
    label.textContent = `${element.tagName.toLowerCase()} · ${Math.round(rect.width)} × ${Math.round(rect.height)} · r ${style.borderRadius} · padding ${style.padding} · gap ${style.gap}`;
    inner.className = 'layout-content-edge';
    inner.style.inset = `${numeric(style.paddingTop)}px ${numeric(style.paddingRight)}px ${numeric(style.paddingBottom)}px ${numeric(style.paddingLeft)}px`;
    hover.append(label, inner);
  };
  const pointerMove = event => {
    if (!enabled || event.target.closest?.('[data-layout-tools],.layout-grid-overlay')) return;
    const element = event.target.closest?.('button,a,img,section,input,[role="tablist"],[data-layout-region]');
    if (element) showHover(element); else {hovered = null;hover.hidden = true;}
  };
  const keyDown = event => {
    if (!event.altKey || event.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (key === 'g' || key === 'c') {
      event.preventDefault();
      if (key === 'g') enabled = !enabled; else checks = !checks;
      updateButtons();schedule();
    }
  };
  gridButton.addEventListener('click', () => {enabled = !enabled;updateButtons();schedule();});
  checksButton.addEventListener('click', () => {checks = !checks;updateButtons();});
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(document.body);
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('pointermove', pointerMove);
  window.addEventListener('keydown', keyDown);
  document.addEventListener('click', schedule);
  updateButtons(); schedule();
  const unmount = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('keydown', keyDown);
    document.removeEventListener('click', schedule);
    overlay.remove(); checksButton.remove(); gridButton.remove();
  };
  unmount.refresh = schedule;
  return unmount;
}
