/** Optical alignment checks for any rendered page. Browser-side, async, no mutations, no project markup needed.
 *  Run with Playwright: `await page.evaluate(collectOpticalAudit, {root: 'body'})`, or through audit_page.mjs.
 *
 *  Glyphs are rasterized so their ink (not their SVG box) is measured. Reports:
 *  - iconOnly:   icon-only controls whose ink is not optically centered. Asymmetric shapes (play triangles, arrows,
 *                chevrons) are centered on the midpoint between their ink box and their ink centroid.
 *  - iconText:   an icon beside a text label whose ink center misses the label's cap-height center.
 *  - controlText: text controls whose label (cap top to baseline) is not vertically centered in the control,
 *                 or whose horizontal ink insets are unbalanced.
 *  - sideBearing: large text whose first glyph's ink starts visibly right of the text below it.
 *  Every finding carries a suggested CSS nudge in px. Findings are candidates; confirm at 2x before changing. */
export async function collectOpticalAudit(options = {}) {
  const {root = 'body', tolerance = 0.75, limit = 60, scale = 4} = options;
  const scope = document.querySelector(root);
  if (!scope) throw new Error(`No element matches ${root}`);
  const round = v => Math.round(v * 10) / 10;
  const visible = el => {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false;
    const own = getComputedStyle(el);
    if (/inset\(50%\)|rect\(0/.test(own.clipPath + ' ' + own.clip)) return false;
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    }
    return true;
  };
  const label = el => el.getAttribute('aria-label') || (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32) || el.tagName.toLowerCase();
  const where = el => el.id ? `#${el.id}` : el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => `.${c}`).join('');
  const ctx = document.createElement('canvas').getContext('2d');

  async function glyphInk(svg) {
    const box = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true);
    const source = [svg, ...svg.querySelectorAll('*')], copies = [clone, ...clone.querySelectorAll('*')];
    source.forEach((el, i) => {
      const s = getComputedStyle(el), c = copies[i];
      for (const prop of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'display', 'visibility', 'transform']) {
        const v = s.getPropertyValue(prop);
        if (v) c.style.setProperty(prop, v.replace(/currentcolor/gi, '#000'));
      }
      if (c.getAttribute && c.getAttribute('fill') === 'currentColor') c.setAttribute('fill', '#000');
      if (c.getAttribute && c.getAttribute('stroke') === 'currentColor') c.setAttribute('stroke', '#000');
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', box.width); clone.setAttribute('height', box.height);
    clone.style.color = '#000';
    const w = Math.ceil(box.width * scale), h = Math.ceil(box.height * scale);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], {type: 'image/svg+xml'}));
    try {
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const c = canvas.getContext('2d'); c.drawImage(img, 0, 0, w, h);
      const data = c.getImageData(0, 0, w, h).data;
      let sum = 0, sx = 0, sy = 0, minX = w, minY = h, maxX = -1, maxY = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const a = data[(y * w + x) * 4 + 3];
        if (a < 16) continue;
        sum += a; sx += a * (x + 0.5); sy += a * (y + 0.5);
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      if (!sum) return null;
      return {left: box.left + minX / scale, right: box.left + (maxX + 1) / scale, top: box.top + minY / scale, bottom: box.top + (maxY + 1) / scale,
        cx: box.left + sx / sum / scale, cy: box.top + sy / sum / scale};
    } catch { return null; } finally { URL.revokeObjectURL(url); }
  }

  function textInk(el) {
    const s = getComputedStyle(el);
    const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!text) return null;
    ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const m = ctx.measureText(text), cap = ctx.measureText('H').actualBoundingBoxAscent;
    const range = document.createRange();
    const nodes = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    range.setStart(nodes[0], 0); range.setEnd(nodes[nodes.length - 1], nodes[nodes.length - 1].textContent.length);
    const lines = [...range.getClientRects()].filter(r => r.width > 0);
    if (!lines.length) return null;
    const first = lines[0], last = lines[lines.length - 1];
    const lh = parseFloat(s.lineHeight) || first.height;
    const baseOf = r => r.top - (lh - r.height) / 2 + (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    const capTop = baseOf(first) - cap, baseline = baseOf(last);
    const inkLeft = first.left - m.actualBoundingBoxLeft;
    return {capTop, baseline, capMid: (capTop + baseline) / 2, left: inkLeft, right: Math.max(...lines.map(r => r.right)), size: parseFloat(s.fontSize), lines: lines.length, boxLeft: first.left};
  }

  const findings = {iconOnly: [], iconText: [], controlText: [], sideBearing: []};
  const push = (list, item) => { if (list.length < limit) list.push(item); };
  const controls = [...scope.querySelectorAll('button,a[href],[role="button"],[role="tab"],summary,label')].filter(visible);

  for (const el of controls) {
    const box = el.getBoundingClientRect();
    const svgs = [...el.querySelectorAll('svg')].filter(visible);
    const textEls = [el, ...el.querySelectorAll('*')].filter(n => !n.closest('svg') && visible(n) && [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()));
    const s = getComputedStyle(el);
    const isInlineLink = el.tagName === 'A' && s.display === 'inline';
    const compact = box.height <= 72 && !el.querySelector('h1,h2,h3,h4,h5,h6,p,li,img,picture,video,textarea');
    const squareish = box.width <= 72 && box.height <= 72 && box.width / box.height > 0.7 && box.width / box.height < 1.45;
    if (svgs.length === 1 && !textEls.length && squareish) {
      const ink = await glyphInk(svgs[0]);
      if (!ink) continue;
      const boxCx = box.left + box.width / 2, boxCy = box.top + box.height / 2;
      const inkCx = (ink.left + ink.right) / 2, inkCy = (ink.top + ink.bottom) / 2;
      const opticalX = (inkCx + ink.cx) / 2, opticalY = (inkCy + ink.cy) / 2;
      const dx = boxCx - opticalX, dy = boxCy - opticalY;
      const asymmetric = Math.abs(ink.cx - inkCx) > 0.5 || Math.abs(ink.cy - inkCy) > 0.5;
      if (Math.abs(dx) > Math.max(tolerance, 1) || Math.abs(dy) > Math.max(tolerance, 1)) push(findings.iconOnly, {
        control: label(el), element: where(el), shape: asymmetric ? 'asymmetric (triangle, arrow, chevron)' : 'symmetric',
        nudge: {x: round(dx), y: round(dy)},
        fix: `translate the icon by ${round(dx)}px ${round(dy)}px (e.g. svg { translate: ${round(dx)}px ${round(dy)}px })`});
    }
    if (textEls.length && !isInlineLink && compact) {
      const inks = textEls.map(textInk).filter(Boolean);
      if (!inks.length) continue;
      const single = inks.length === 1 && inks[0].lines === 1;
      const capTop = Math.min(...inks.map(i => i.capTop)), baseline = Math.max(...inks.map(i => i.baseline));
      const bw = parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth);
      const filled = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || bw > 0 || s.boxShadow !== 'none';
      if (single && filled) {
        const dy = (box.top + box.height / 2) - (capTop + baseline) / 2;
        if (Math.abs(dy) > tolerance && Math.abs(dy) < box.height / 3) push(findings.controlText, {control: label(el), element: where(el), issue: 'label not centered on cap height',
          nudge: {y: round(dy)}, fix: `move the label ${round(dy)}px vertically (text-box: trim-both cap alphabetic on the label, or adjust padding-block)`});
        const inkLeft = Math.min(...inks.map(i => i.left), ...svgs.map(v => v.getBoundingClientRect().left));
        const inkRight = Math.max(...inks.map(i => i.right), ...svgs.map(v => v.getBoundingClientRect().right));
        const l = inkLeft - box.left, r = box.right - inkRight;
        const leadingIcon = svgs.length && svgs[0].getBoundingClientRect().left < inks[0].left;
        const trailingIcon = svgs.length && svgs[svgs.length - 1].getBoundingClientRect().right > inks[inks.length - 1].right;
        const expected = leadingIcon && !trailingIcon ? 'left 2–4px smaller than right' : trailingIcon && !leadingIcon ? 'right 2–4px smaller than left' : 'equal';
        const off = expected === 'equal' ? Math.abs(l - r) > 2 : expected.startsWith('left') ? l > r : r > l;
        const centered = s.textAlign === 'center' || s.justifyContent === 'center' || (el.tagName === 'BUTTON' && !/start|left|space-between/.test(s.justifyContent));
        if (off && centered) push(findings.controlText, {control: label(el), element: where(el),
          issue: 'unbalanced horizontal ink insets', insets: {left: round(l), right: round(r)}, expected});
      }
      for (const svg of svgs) {
        const ink = await glyphInk(svg);
        const text = inks[0];
        if (!ink || !text || text.lines > 1) continue;
        const gap = Math.min(Math.abs(text.left - ink.right), Math.abs(ink.left - text.right));
        const dy = text.capMid - (ink.top + ink.bottom) / 2;
        if (gap > text.size * 2 || Math.abs(dy) > text.size) continue;
        if (Math.abs(dy) > tolerance) push(findings.iconText, {control: label(el), element: where(el), nudge: {y: round(dy)},
          fix: `move the icon ${round(dy)}px so its ink center meets the label's cap-height center`});
      }
    }
  }

  for (const svg of [...scope.querySelectorAll('svg')].filter(v => visible(v) && !v.closest('button,a[href],[role="button"],[role="tab"],summary,label'))) {
    const row = svg.parentElement;
    const textEl = [...row.querySelectorAll('*'), row].find(n => n !== svg && !n.closest('svg') && [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()));
    if (!textEl || !visible(textEl)) continue;
    const text = textInk(textEl), ink = await glyphInk(svg);
    if (!text || !ink || text.lines > 1) continue;
    const gap = Math.min(Math.abs(text.left - ink.right), Math.abs(ink.left - text.right));
    const dy = text.capMid - (ink.top + ink.bottom) / 2;
    if (gap > text.size * 2 || Math.abs(dy) > text.size || ink.bottom - ink.top > text.size * 2.5) continue;
    if (Math.abs(dy) > tolerance) push(findings.iconText, {control: label(textEl), element: where(row), nudge: {y: round(dy)},
      fix: `move the icon ${round(dy)}px so its ink center meets the text's cap-height center`});
  }

  const texts = [...scope.querySelectorAll('h1,h2,h3,h4,p,div,span,a,li')].filter(el => visible(el) && [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()));
  for (const el of texts) {
    const big = textInk(el);
    if (!big || big.size < 32) continue;
    const below = texts.map(t => [t, t.getBoundingClientRect()]).filter(([t, r]) => t !== el && Math.abs(r.left - big.boxLeft) < 2 && r.top > big.baseline && r.top - big.baseline < 160)
      .map(([t]) => textInk(t)).filter(t => t && t.size < big.size * 0.6);
    if (!below.length) continue;
    const d = big.left - below[0].left;
    if (d > 1) push(findings.sideBearing, {text: label(el), element: where(el), inkOffset: round(d),
      fix: `margin-inline-start: -${round(d / big.size * 100) / 100}em so the headline ink aligns with the text below`});
  }

  return {tolerance, counts: Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, v.length])), ...findings};
}
