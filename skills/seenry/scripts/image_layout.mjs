/** Image integration: a premium page composes its images into the layout (type or UI over them, a cut-out in front of
 *  the headline, an edge that melts into the ground, one image owning its section). A stock-like page drops a boxed
 *  photo into an empty band. review_board.mjs runs collectImageLayout in the page and judgeImageLayout on the result.
 *
 *  An image counts when it is an <img>, <picture>, <video>, <canvas> or an element with a CSS background image, at least
 *  160x120 and wider than 12% of the viewport. Its section is the nearest section, article, header, footer or main, or
 *  the nearest ancestor at least 90% of the viewport wide. */

// Runs inside the page; must stay self-contained.
export function collectImageLayout() {
  const vw = innerWidth;
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const box = r => ({x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height)});
  const name = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const isImage = el => /^(IMG|VIDEO|CANVAS|PICTURE)$/.test(el.tagName) || (el.tagName !== 'BODY' && el.tagName !== 'HTML' && /url\(/.test(getComputedStyle(el).backgroundImage));
  const sectionOf = el => {
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      if (/^(SECTION|ARTICLE|HEADER|FOOTER|MAIN)$/.test(e.tagName) && e.getBoundingClientRect().width >= vw * 0.6) return e;
      if (e.getBoundingClientRect().width >= vw * 0.9 && e.getBoundingClientRect().height >= 200) return e;
    }
    return document.body;
  };
  const treated = el => {
    for (let e = el, k = 0; e && k < 3; e = e.parentElement, k++) {
      const s = getComputedStyle(e);
      if (s.mixBlendMode !== 'normal' || (s.maskImage && s.maskImage !== 'none') || (s.webkitMaskImage && s.webkitMaskImage !== 'none') || s.clipPath !== 'none' || /drop-shadow|grayscale|sepia|saturate|contrast|brightness/.test(s.filter)) return true;
      if (e !== el && /gradient/.test(s.backgroundImage)) return true;
    }
    return false;
  };
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('*')) {
    if (seen.has(el) || !isImage(el) || !visible(el)) continue;
    if (el.tagName === 'IMG' && el.parentElement?.tagName === 'PICTURE') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 160 || r.height < 120 || r.width < vw * 0.12) continue;
    seen.add(el);
    const sec = sectionOf(el), sr = sec.getBoundingClientRect();
    const others = [];
    for (const o of sec.querySelectorAll('*')) {
      if (o === el || el.contains(o) || o.contains(el) || !visible(o)) continue;
      const own = [...o.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      const card = (() => { const s = getComputedStyle(o); return !/rgba\(\s*0,\s*0,\s*0,\s*0\)|transparent/.test(s.backgroundColor) || s.boxShadow !== 'none'; })();
      if (!own && !card && !/^(IMG|VIDEO|CANVAS|SVG|BUTTON|INPUT)$/i.test(o.tagName)) continue;
      const q = o.getBoundingClientRect();
      if (q.width < 8 || q.height < 8) continue;
      if (q.width >= sr.width * 0.9 && q.height >= sr.height * 0.9) continue;
      others.push(box(q));
    }
    const cs = getComputedStyle(el);
    out.push({el: name(el), section: name(sec), ...box(r), sec: box(sr), others: others.slice(0, 400),
      positioned: /absolute|fixed|sticky/.test(cs.position), treated: treated(el), radius: parseFloat(cs.borderTopLeftRadius) || 0,
      cutout: el.hasAttribute('data-seenry-cutout')});
  }
  return out;
}

const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** floatingImage (blocker): a boxed image alone in its band, under a fifth of the section, with wide empty margins.
 *  premium (note, not a blocker): the same pattern at under 45% of the section, plus mixed corner radii. */
export function judgeImageLayout(images = []) {
  const floatingImage = [], premium = [];
  for (const im of images) {
    const sec = im.sec, secArea = sec.w * sec.h; if (!secArea) continue;
    const share = (im.w * im.h) / secArea;
    if (share >= 0.45 || im.treated || im.cutout) continue;
    const covered = im.others.some(o => overlap(o, im) > Math.min(o.w * o.h, im.w * im.h) * 0.08);
    if (covered) continue;
    const band = {x: sec.x, y: im.y, w: sec.w, h: im.h};
    const beside = im.others.filter(o => overlap(o, band) > 0 && overlap(o, im) === 0);
    const left = im.x - sec.x, right = sec.x + sec.w - (im.x + im.w);
    const besideLeft = beside.some(o => o.x + o.w <= im.x), besideRight = beside.some(o => o.x >= im.x + im.w);
    const emptyLeft = !besideLeft && left > sec.w * 0.18, emptyRight = !besideRight && right > sec.w * 0.18;
    const alone = !beside.length;
    if (!(alone && (emptyLeft || emptyRight)) && !(emptyLeft && emptyRight)) continue;
    const msg = `${im.el} in ${im.section}: a boxed image at ${Math.round(share * 100)}% of its section with empty space ${emptyLeft && emptyRight ? 'on both sides' : emptyLeft ? 'to its left' : 'to its right'} and nothing over or against it (let one image own the section, lay type or product UI over a calm field, cut the subject out in front of the type, or blend its edge into the ground; see image-composition.md)`;
    if (share < 0.2 && alone) floatingImage.push(msg); else premium.push(msg);
  }
  const radii = [...new Set(images.filter(i => !i.cutout && i.w < (i.sec.w || 1) * 0.95).map(i => Math.round(i.radius)))];
  if (radii.length > 2) premium.push(`images use ${radii.length} corner radii (${radii.join(', ')}px): give every framed image one radius from the token scale`);
  return {floatingImage, premium};
}
