/** Count the design system a rendered page actually uses and flag drift. Browser-side; no mutations.
 *  Run with Playwright: `await page.evaluate(collectSystemAudit, {base: 4})`, or paste into DevTools.
 *  Also lists controls whose label wraps onto several lines (a common phone header failure).
 *  Options: base (grid unit, default 4), root (CSS selector, default 'body'),
 *  components (selector for component roots, default '[data-component]'), maxPerComponent (default 3), limit (default 40). */
export function collectSystemAudit(options = {}) {
  const {base = 4, root = 'body', components = '[data-component]', maxPerComponent = 3, limit = 40} = options;
  const scope = document.querySelector(root);
  if (!scope) throw new Error(`No element matches ${root}`);
  const px = value => parseFloat(value) || 0;
  const visible = el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0;
  };
  const label = el => el.id ? `#${el.id}` : el.tagName.toLowerCase() + ([...el.classList].slice(0, 2).map(c => `.${c}`).join(''));
  const hasText = el => [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  const skip = el => el.closest('svg,script,style,noscript,template,[data-audit-ignore]');
  const count = () => new Map();
  const add = (map, key, where) => { const e = map.get(key) || {count: 0, examples: []}; e.count++; if (e.examples.length < 3) e.examples.push(where); map.set(key, e); };
  const sorted = map => [...map.entries()].sort((a, b) => b[1].count - a[1].count).map(([value, e]) => ({value, ...e}));

  const sizes = count(), weights = count(), families = count(), radii = count(), shadows = count(), colors = count(), spacing = count();
  const offGrid = [];
  const onGrid = v => v <= 2 || Math.abs(v / base - Math.round(v / base)) < 0.01;
  const els = [scope, ...scope.querySelectorAll('*')].filter(el => !skip(el) && visible(el));

  for (const el of els) {
    const s = getComputedStyle(el), where = label(el);
    if (hasText(el)) {
      add(sizes, `${Math.round(px(s.fontSize) * 10) / 10}px`, where);
      add(weights, s.fontWeight, where);
      add(families, s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), where);
      add(colors, `text ${s.color}`, where);
    }
    const bg = s.backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(bg)) add(colors, `bg ${bg}`, where);
    const corners = [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].map(px);
    const r = Math.max(...corners);
    if (r > 0) add(radii, r >= 999 ? 'pill' : `${Math.round(r * 10) / 10}px`, where);
    if (s.boxShadow && s.boxShadow !== 'none') add(shadows, s.boxShadow, where);
    const box = {
      'padding-top': s.paddingTop, 'padding-right': s.paddingRight, 'padding-bottom': s.paddingBottom, 'padding-left': s.paddingLeft,
      'row-gap': s.display.includes('flex') || s.display.includes('grid') ? s.rowGap : 'normal',
      'column-gap': s.display.includes('flex') || s.display.includes('grid') ? s.columnGap : 'normal',
      'margin-top': s.marginTop, 'margin-bottom': s.marginBottom,
    };
    for (const [prop, raw] of Object.entries(box)) {
      if (raw === 'normal' || raw === 'auto') continue;
      const v = Math.abs(px(raw));
      if (v > 0) add(spacing, `${Math.round(v * 10) / 10}px`, where);
      if (v > 0 && !onGrid(v) && offGrid.length < limit) offGrid.push({element: where, property: prop, value: `${Math.round(v * 100) / 100}px`});
    }
  }

  const nested = [];
  for (const parent of els) {
    const ps = getComputedStyle(parent), R = px(ps.borderTopLeftRadius);
    if (R <= 0 || R >= 999 || ps.overflow === 'visible' && ps.backgroundColor === 'rgba(0, 0, 0, 0)' && ps.boxShadow === 'none' && px(ps.borderTopWidth) === 0) continue;
    const pr = parent.getBoundingClientRect();
    for (const child of parent.children) {
      if (skip(child) || !visible(child)) continue;
      const cs = getComputedStyle(child), r = px(cs.borderTopLeftRadius);
      if (r <= 0 || r >= 999) continue;
      const cr = child.getBoundingClientRect();
      const inset = Math.min(cr.left - pr.left, cr.top - pr.top);
      if (inset < 0 || inset >= R) continue;
      const expected = Math.max(R - inset, 0);
      if (Math.abs(r - expected) > 2 && nested.length < limit) nested.push({parent: label(parent), child: label(child), parentRadius: R, inset: Math.round(inset * 10) / 10, childRadius: r, expected: Math.round(expected)});
    }
  }

  const perComponent = [];
  for (const host of scope.querySelectorAll(components)) {
    if (!visible(host)) continue;
    const s = new Set(), w = new Set(), f = new Set();
    for (const el of [host, ...host.querySelectorAll('*')]) {
      if (skip(el) || !visible(el) || !hasText(el)) continue;
      const cs = getComputedStyle(el);
      s.add(Math.round(px(cs.fontSize) * 10) / 10); w.add(cs.fontWeight); f.add(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim());
    }
    const name = host.getAttribute('data-component') || label(host);
    perComponent.push({component: name, sizes: [...s].sort((a, b) => a - b), weights: [...w].sort(), families: [...f], overLimit: s.size > maxPerComponent || w.size > maxPerComponent || f.size > 2});
  }

  const wrappedControls = [];
  for (const el of scope.querySelectorAll('button,a[href],[role="button"],[role="tab"],label')) {
    if (skip(el) || !visible(el)) continue;
    const lines = new Set();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(walker.currentNode);
      for (const r of range.getClientRects()) if (r.width > 0) lines.add(Math.round(r.top));
    }
    const isInline = el.tagName === 'A' && !el.matches('[class*="btn"],[class*="button"],[role="button"]') && getComputedStyle(el).display === 'inline';
    if (lines.size > 1 && !isInline && wrappedControls.length < limit) wrappedControls.push({element: label(el), text: el.textContent.trim().slice(0, 60), lines: lines.size});
  }

  const docWidth = document.documentElement.scrollWidth;
  return {
    viewport: {width: innerWidth, height: innerHeight},
    horizontalOverflow: docWidth > innerWidth,
    totals: {fontSizes: sizes.size, fontWeights: weights.size, families: families.size, radii: radii.size, shadows: shadows.size, colors: colors.size, spacingValues: spacing.size},
    fontSizes: sorted(sizes), fontWeights: sorted(weights), families: sorted(families), radii: sorted(radii), shadows: sorted(shadows).slice(0, 12),
    offGrid, nestedRadius: nested, wrappedControls, perComponent,
    guide: {base, targets: 'page ≤6 font sizes, ≤3 weights, ≤2 families, ≤5 radii (incl. pill), ≤4 shadows; component ≤3 sizes and ≤3 weights'},
  };
}

if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  console.log('Import collectSystemAudit and run it in a page: await page.evaluate(collectSystemAudit, {base: 4}).');
}
