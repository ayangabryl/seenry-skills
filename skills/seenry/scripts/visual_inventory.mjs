/** Browser-side observations for a scoped visual review. No scoring or mutations. */
export function collectVisualInventory(root = document.body, limit = 250) {
  if (!(root instanceof Element)) throw new TypeError('A rendered root element is required');
  if (!Number.isInteger(limit) || limit < 1 || limit > 2000) throw new RangeError('limit must be 1–2000');
  const rect = el => {
    const r = el.getBoundingClientRect();
    return {x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2)};
  };
  const visible = el => {
    if (!el.getClientRects().length || el.closest('[hidden]')) return false;
    for (let p = el; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const nodes = [root, ...root.querySelectorAll('*')].filter(visible);
  const texts = [], controls = [], boundaries = [], images = [];
  const locator = el => ({tag: el.tagName.toLowerCase(), id: el.id || null, role: el.getAttribute('role')});
  for (const el of nodes) {
    if (['SCRIPT','STYLE','NOSCRIPT','OPTION'].includes(el.tagName)) continue;
    const style = getComputedStyle(el), box = rect(el);
    const direct = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
    if (direct) {
      const rendered = style.textTransform === 'uppercase' ? direct.toLocaleUpperCase() : style.textTransform === 'lowercase' ? direct.toLocaleLowerCase() : direct;
      texts.push({...locator(el), text: direct, rendered, box, font: style.fontFamily, size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, textTransform: style.textTransform, color: style.color});
    }
    if (el.matches('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=radio],[role=checkbox],[role=slider],[role=switch]')) {
      const controlText = (el.innerText || '').trim().slice(0,200);
      const symbolGlyphs = [...new Set(controlText.match(/[×▶▷◀◁⏵⏸⏹Ⅱ↑↓←→↗↘↙↖]/gu) || [])];
      controls.push({...locator(el), text: (el.getAttribute('aria-label') || controlText || el.getAttribute('title') || '').trim().slice(0,200), box, disabled: el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true', radius: style.borderRadius,
        iconObservation: {symbolGlyphs, svgCount:[...el.querySelectorAll('svg')].filter(visible).length, imageCount:[...el.querySelectorAll('img')].filter(visible).length}});
    }
    const borders = ['Top','Right','Bottom','Left'].map(side => ({side: side.toLowerCase(), width: style[`border${side}Width`], style: style[`border${side}Style`], color: style[`border${side}Color`]})).filter(b => parseFloat(b.width) > 0 && b.style !== 'none' && !/rgba\([^)]*,\s*0\s*\)$/.test(b.color));
    if (borders.length || style.boxShadow !== 'none') boundaries.push({...locator(el), box, borders, shadow: style.boxShadow, radius: style.borderRadius});
    if (el instanceof HTMLImageElement) images.push({...locator(el), box, alt: el.alt, naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight, loaded: el.complete && el.naturalWidth > 0, fit: style.objectFit, filter: style.filter});
  }
  const repeated = new Map();
  texts.slice(0,limit).forEach((t,i) => {const k=t.rendered.toLocaleLowerCase(); repeated.set(k,[...(repeated.get(k)||[]),i]);});
  const clips = list => ({items:list.slice(0,limit), total:list.length, truncated:list.length > limit});
  return {schema:1, kind:'rendered-observation; no quality verdict', viewport:{width:innerWidth,height:innerHeight,scrollX,scrollY}, root:rect(root), overflow:{scrollWidth:root.scrollWidth,clientWidth:root.clientWidth,scrollHeight:root.scrollHeight,clientHeight:root.clientHeight}, texts:clips(texts), controls:clips(controls), boundaries:clips(boundaries), images:clips(images), repeatedText:[...repeated].filter(([,indexes])=>indexes.length>1).slice(0,limit).map(([text,indexes])=>({text,indexes})), limits:['Repeated words, uppercase and boundaries may be useful; inspect their actual role.','Pseudo-elements, canvas contents, shadow roots and perceptual contrast are not enumerated.','Coordinates are viewport-relative; this is not a motion recording or accessibility audit.','Control values and remote asset URLs are not collected.']};
}
