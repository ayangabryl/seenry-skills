/** Chart floor: a chart drawn as a bare line with no value axis reads as decoration, and labels sitting on the line read
 *  as junior work. review_board.mjs runs collectChartGeometry in the page and judgeCharts on the result.
 *
 *  A chart is an SVG at least 200x100 that draws a data series: a path whose samples are mostly diagonal steps
 *  (a curve or sawtooth, never the orthogonal lines of a decorative trace) spanning 40% of its width, or three or more
 *  bars on one baseline. Canvas charts are counted when marked as a chart (role=img with a chart label, a chart class
 *  or data-seenry-chart). */

// Runs inside the page; must stay self-contained.
export function collectChartGeometry() {
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const box = r => ({x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height)});
  const name = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : el.className?.baseVal ? '.' + el.className.baseVal.split(/\s+/)[0] : '');
  const textNodes = root => {
    const out = [];
    for (const t of root.querySelectorAll('text, tspan')) {
      if (t.tagName.toLowerCase() === 'text' && t.querySelector('tspan')) continue;
      const s = (t.textContent || '').trim(); if (!s || !visible(t)) continue;
      out.push({text: s.slice(0, 40), ...box(t.getBoundingClientRect())});
    }
    return out;
  };
  // HTML labels just outside the plot (an axis built in a div under or beside the SVG).
  const nearHtml = (rect, chart) => {
    const out = [], pad = 56;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const s = n.textContent.trim(); if (!s || s.length > 40) continue;
      const el = n.parentElement; if (!el || el.closest('svg') || !visible(el)) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      // A label on its own opaque card (a tooltip over the plot) is read on the card, not on the line behind it.
      let carded = false;
      for (let a = el; a && a !== document.body && !a.contains(chart); a = a.parentElement) { const c = getComputedStyle(a).backgroundColor.match(/[\d.]+/g) || []; if (getComputedStyle(a).backgroundColor !== 'transparent' && !/^rgba\(.*,\s*0(\.0+)?\)$/.test(getComputedStyle(a).backgroundColor) && (c.length < 4 || +c[3] > 0.9)) { carded = true; break; } }
      // A wrapped text node has one box per line; its bounding box would cover the words beside it on the next line.
      for (const r of range.getClientRects()) {
        if (!r.width) continue;
        if (r.right < rect.left - pad || r.left > rect.right + pad || r.bottom < rect.top - pad || r.top > rect.bottom + pad) continue;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        out.push({text: s, html: true, carded, inside: cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom, ...box(r)});
      }
    }
    return out;
  };
  const charts = [];
  for (const svg of document.querySelectorAll('svg')) {
    if (!visible(svg)) continue;
    const rect = svg.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 100) continue;
    const series = [];
    for (const p of svg.querySelectorAll('path, polyline, line')) {
      if (!visible(p) || typeof p.getTotalLength !== 'function') continue;
      let len; try { len = p.getTotalLength(); } catch { continue; }
      if (!len) continue;
      const ctm = p.getScreenCTM(); if (!ctm) continue;
      const n = Math.min(400, Math.max(40, Math.ceil(len / 3))), pts = [];
      for (let i = 0; i <= n; i++) { const q = p.getPointAtLength(len * i / n); pts.push([Math.round((ctm.a * q.x + ctm.c * q.y + ctm.e) * 10) / 10, Math.round((ctm.b * q.x + ctm.d * q.y + ctm.f + scrollY) * 10) / 10]); }
      const s = getComputedStyle(p);
      series.push({points: pts, stroked: s.stroke !== 'none' && parseFloat(s.strokeWidth) > 0, dashed: s.strokeDasharray !== 'none', el: name(p)});
    }
    const bars = [...svg.querySelectorAll('rect')].filter(visible).map(r => box(r.getBoundingClientRect()));
    charts.push({el: name(svg), kind: 'svg', ...box(rect), series, bars, texts: [...textNodes(svg), ...nearHtml(rect, svg)]});
  }
  for (const c of document.querySelectorAll('canvas')) {
    if (!visible(c)) continue;
    const label = `${c.getAttribute('aria-label') || ''} ${c.className || ''}`;
    if (!c.hasAttribute('data-seenry-chart') && !/chart|graph|plot/i.test(label)) continue;
    const rect = c.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 100) continue;
    charts.push({el: name(c), kind: 'canvas', ...box(rect), series: [], bars: [], marked: true, texts: nearHtml(rect, c)});
  }
  return charts;
}

const TICK = /^[-−+]?\$?\s*\d[\d.,:]*\s*(%|[kmb]|mi|km|h|hrs?|min|s|°|x|×)?$|^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|^(mon|tue|wed|thu|fri|sat|sun)\b|^q[1-4]\b|^\d{1,2}(am|pm)$/i;

function isSeries(s, chart) {
  const pts = s.points; if (pts.length < 8) return false;
  let diag = 0;
  for (let i = 1; i < pts.length; i++) { const dx = Math.abs(pts[i][0] - pts[i - 1][0]), dy = Math.abs(pts[i][1] - pts[i - 1][1]); if (dx > 0.4 && dy > 0.4) diag++; }
  const xs = pts.map(p => p[0]), span = Math.max(...xs) - Math.min(...xs);
  return diag / (pts.length - 1) >= 0.2 && span >= chart.w * 0.4;
}
function hasBars(chart) {
  const bars = chart.bars.filter(b => b.w >= 4 && b.w < chart.w * 0.25 && b.h > 4);
  const byBase = new Map();
  for (const b of bars) { const k = Math.round((b.y + b.h) / 3); byBase.set(k, (byBase.get(k) || 0) + 1); }
  return [...byBase.values()].some(n => n >= 3);
}
// Three or more tick-like labels on one vertical line (a value axis) or, for bars, on one horizontal line.
function aligned(texts, axis) {
  const ticks = texts.filter(t => TICK.test(t.text.trim()));
  // Edges within 3px are one line: buckets of rounded pixels split a right-aligned axis whose labels differ by 1px.
  const lines = axis === 'y' ? [t => t.x + t.w, t => t.x] : [t => t.y + t.h / 2];
  return lines.some(at => ticks.some(a => ticks.filter(b => Math.abs(at(a) - at(b)) <= 3).length >= 3));
}
const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/** {bareChart: [...], chartCollision: [...]}, each a list of human-readable findings. */
export function judgeCharts(charts = []) {
  const bareChart = [], chartCollision = [];
  for (const c of charts) {
    const series = c.series.filter(s => isSeries(s, c));
    const bars = hasBars(c);
    if (!series.length && !bars && !c.marked) continue;
    const valueAxis = series.length ? aligned(c.texts, 'y') : aligned(c.texts, 'y') || aligned(c.texts, 'x');
    if (!valueAxis) bareChart.push(`${c.el} ${c.w}x${c.h} at y ${c.y}: no labelled value axis (three or more tick labels with units on one axis)`);
    const lines = series.filter(s => s.stroked);
    for (const t of c.texts) {
      if (t.carded) continue;
      const hit = lines.find(s => s.points.some(([x, y]) => x >= t.x - 1 && x <= t.x + t.w + 1 && y >= t.y - 1 && y <= t.y + t.h + 1));
      if (hit) chartCollision.push(`"${t.text}" sits on the line ${hit.el} in ${c.el} (move the label clear of the series)`);
    }
    for (let i = 0; i < c.texts.length; i++) for (let j = i + 1; j < c.texts.length; j++) {
      // Labels collide inside the plot. Words in a table or caption next to the chart are ordinary page text.
      const a = c.texts[i], b = c.texts[j];
      if ((a.html && !a.inside) || (b.html && !b.inside) || (a.html && b.html && a.text === b.text)) continue;
      if (overlaps(a, b, -1)) chartCollision.push(`"${c.texts[i].text}" overlaps "${c.texts[j].text}" in ${c.el}`);
    }
  }
  return {bareChart, chartCollision: [...new Set(chartCollision)]};
}
