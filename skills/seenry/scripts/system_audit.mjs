/** Count the design system a rendered page actually uses and flag drift. Browser-side; no mutations.
 *  Run with Playwright: `await page.evaluate(collectSystemAudit, {base: 4})`, or paste into DevTools.
 *  Also lists controls whose label wraps onto several lines (a common phone header failure), and for every
 *  component root measures alignment at ink level: text cap tops and baselines, drawn SVG glyph bounds and media
 *  boxes, reporting near-miss edges (1–6px apart), how text beside or below media sits against its edges, and the optical inset on each side.
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

  /** Painted edges inside one component: text measured to ink (cap top, baseline), SVG glyphs to their drawn shapes,
   *  media and filled shapes to their boxes. Reports near-miss edges (off by more than `tolerance`, at most `nearMiss` px)
   *  and the optical inset from the component edge to its nearest ink on each side. */
  function collectAlignment(host, options = {}) {
    const {tolerance = 1, nearMiss = 6, limit = 30} = options;
    const hostBox = host.getBoundingClientRect();
    const round = v => Math.round(v * 10) / 10;
    const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0; };
    const name = el => el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 24) || (el.className && String(el.className).split(' ')[0]) || el.tagName.toLowerCase();
    const ctx = document.createElement('canvas').getContext('2d');
    const items = [];
    const texts = [...host.querySelectorAll('*')].filter(el => !el.closest('svg') && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && visible(el));
    for (const el of texts) {
      const s = getComputedStyle(el);
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      const m = ctx.measureText(text), cap = ctx.measureText('H').actualBoundingBoxAscent;
      const range = document.createRange(); range.selectNodeContents(el);
      const lines = [...range.getClientRects()].filter(r => r.width > 0);
      if (!lines.length) continue;
      const first = lines[0], last = lines[lines.length - 1];
      const lh = parseFloat(s.lineHeight) || first.height;
      const half = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const lineTop = r => r.top - (lh - r.height) / 2;
      const base1 = lineTop(first) + half + m.fontBoundingBoxAscent, baseN = lineTop(last) + half + m.fontBoundingBoxAscent;
      const left = Math.min(...lines.map(r => r.left)) + Math.max(0, -m.actualBoundingBoxLeft);
      const right = Math.max(...lines.map(r => r.right));
      const align = /right|end/.test(s.textAlign) ? 'right' : s.textAlign === 'center' ? 'center' : 'left';
      items.push({kind: 'text', align, label: name(el), left, right, top: base1 - cap, bottom: baseN, edges: {top: 'cap top', bottom: 'baseline'}});
    }
    for (const svg of host.querySelectorAll('svg')) {
      if (!visible(svg)) continue;
      const shapes = [...svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon')].map(e => e.getBoundingClientRect()).filter(r => r.width || r.height);
      if (!shapes.length) continue;
      items.push({kind: 'glyph', label: name(svg.closest('button,a,[role]') || svg), left: Math.min(...shapes.map(r => r.left)), right: Math.max(...shapes.map(r => r.right)), top: Math.min(...shapes.map(r => r.top)), bottom: Math.max(...shapes.map(r => r.bottom))});
    }
    for (const el of host.querySelectorAll('*')) {
      if (el.closest('svg') || !visible(el)) continue;
      const s = getComputedStyle(el);
      const media = ['IMG', 'VIDEO', 'CANVAS', 'PICTURE'].includes(el.tagName) || s.backgroundImage !== 'none';
      const filled = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent';
      if (!media && !filled && parseFloat(s.borderTopWidth) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width >= hostBox.width - 1 && r.height >= hostBox.height - 1) continue;
      items.push({kind: media ? 'media' : 'shape', label: name(el), left: r.left, right: r.right, top: r.top, bottom: r.bottom});
    }
    const misses = [];
    const compare = (side, edgeName) => {
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j], d = Math.abs(a[side] - b[side]);
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) continue;
      if ((side === 'left' || side === 'right') && [a, b].some(x => x.align && x.align !== side)) continue;
        if (d > tolerance && d <= nearMiss && misses.length < limit) misses.push({side, a: `${a.kind} "${a.label}" ${edgeName(a)}`, b: `${b.kind} "${b.label}" ${edgeName(b)}`, off: round(d)});
      }
    };
    compare('left', () => 'left'); compare('right', () => 'right');
    compare('top', x => x.edges ? x.edges.top : 'top'); compare('bottom', x => x.edges ? x.edges.bottom : 'bottom');
    const inset = side => round(side === 'left' ? Math.min(...items.map(i => i.left)) - hostBox.left : side === 'right' ? hostBox.right - Math.max(...items.map(i => i.right)) : side === 'top' ? Math.min(...items.map(i => i.top)) - hostBox.top : hostBox.bottom - Math.max(...items.map(i => i.bottom)));
    const anchors = [];
    for (const m of items.filter(i => i.kind === 'media')) {
      const beside = items.filter(i => i !== m && i.left >= m.right - 1 && i.top < m.bottom && i.bottom > m.top);
      const below = items.filter(i => i !== m && i.top >= m.bottom - 1 && i.left < m.right && i.right > m.left);
      if (beside.length) {
        const first = beside.reduce((a, b) => (a.top <= b.top ? a : b)), last = beside.reduce((a, b) => (a.bottom >= b.bottom ? a : b));
        anchors.push({media: m.label, relation: 'beside', topItem: `${first.kind} "${first.label}" ${first.edges ? first.edges.top : 'top'}`, topOffset: round(first.top - m.top),
          bottomItem: `${last.kind} "${last.label}" ${last.edges ? last.edges.bottom : 'bottom'}`, bottomOffset: round(m.bottom - last.bottom)});
      }
      if (below.length) {
        const lead = below.reduce((a, b) => (a.left <= b.left ? a : b));
        anchors.push({media: m.label, relation: 'below', leftItem: `${lead.kind} "${lead.label}"`, leftOffset: round(lead.left - m.left)});
      }
    }
    return {anchors, insets: items.length ? {top: inset('top'), right: inset('right'), bottom: inset('bottom'), left: inset('left')} : null, nearMisses: misses,
      items: items.map(i => ({kind: i.kind, label: i.label, left: round(i.left - hostBox.left), right: round(hostBox.right - i.right), top: round(i.top - hostBox.top), bottom: round(hostBox.bottom - i.bottom)}))};
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
    const alignment = collectAlignment(host, options.alignment || {});
    perComponent.push({component: name, alignment, sizes: [...s].sort((a, b) => a - b), weights: [...w].sort(), families: [...f], overLimit: s.size > maxPerComponent || w.size > maxPerComponent || f.size > 2});
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
