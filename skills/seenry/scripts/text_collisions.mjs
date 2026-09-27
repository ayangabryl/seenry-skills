/** Find rendered text boxes that occupy the same pixels. Candidates need visual review. */
export function collectTextCollisions() {
  const round = value => Math.round(value * 10) / 10;
  const label = element => {
    if (element.id) return `#${element.id}`;
    const classes = [...element.classList].slice(0, 2).join('.');
    return element.tagName.toLowerCase() + (classes ? `.${classes}` : '');
  };
  const boxes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  let truncated = false;
  while ((node = walker.nextNode())) {
    const value = node.textContent.replace(/\s+/g, ' ').trim();
    if (!value) continue;
    const element = node.parentElement;
    if (!element || element.closest('[hidden],script,style,noscript,template,svg')) continue;
    let visible = true;
    for (let parent = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) { visible = false; break; }
    }
    if (!visible) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (rect.width < 2 || rect.height < 2) continue;
      if (boxes.length >= 500) { truncated = true; break; }
      boxes.push({element:label(element), text:value.slice(0, 80), owner:element,
        box:{x:round(rect.x + scrollX), y:round(rect.y + scrollY), width:round(rect.width), height:round(rect.height)}});
    }
    range.detach();
    if (truncated) break;
  }
  boxes.sort((a, b) => a.box.y - b.box.y);
  const collisions = [];
  for (let i = 0; i < boxes.length && collisions.length < 30; i++) {
    const first = boxes[i], a = first.box;
    for (let j = i + 1; j < boxes.length; j++) {
      const second = boxes[j], b = second.box;
      if (b.y >= a.y + a.height) break;
      if (first.element === second.element && first.text === second.text) continue;
      const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (width < 3 || height < 3) continue;
      const overlap = width * height / Math.min(a.width * a.height, b.width * b.height);
      if (overlap < 0.08) continue;
      collisions.push({first:{element:first.element,text:first.text,box:first.box},
        second:{element:second.element,text:second.text,box:second.box}, overlap:round(overlap)});
      if (collisions.length >= 30) break;
    }
  }
  const allPaint = [...document.querySelectorAll('body *')].filter(element => {
    if (element.textContent.trim() || element.closest('[hidden]')) return false;
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    if (rect.width < 5 || rect.height < 5 || rect.width * rect.height > innerWidth * innerHeight * 0.25) return false;
    const color = style.backgroundColor;
    const visibleColor = color !== 'transparent' && !/rgba\([^)]*,\s*0(?:\.0+)?\)$/.test(color);
    return style.backgroundImage !== 'none' || visibleColor ||
      ['Top','Right','Bottom','Left'].some(side => Number.parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none');
  });
  const paint = allPaint.slice(0, 250).map(element => {
    const rect = element.getBoundingClientRect();
    return {element, label:label(element), box:{x:rect.x + scrollX,y:rect.y + scrollY,width:rect.width,height:rect.height}};
  });
  const textAgainstPaint = [];
  for (const text of boxes) {
    const a = text.box;
    for (const item of paint) {
      if (item.element.contains(text.owner) || text.owner.contains(item.element)) continue;
      const b = item.box;
      const width = Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x);
      const height = Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
      if (width < 3 || height < 3) continue;
      const overlap = width * height / (a.width * a.height);
      if (overlap < 0.08) continue;
      textAgainstPaint.push({text:{element:text.element,text:text.text,box:text.box},
        paint:{element:item.label,box:{x:round(b.x),y:round(b.y),width:round(b.width),height:round(b.height)}},
        overlap:round(overlap)});
      if (textAgainstPaint.length >= 30) break;
    }
    if (textAgainstPaint.length >= 30) break;
  }
  return {candidates:collisions, textAgainstPaint, textBoxes:boxes.length,
    truncated:truncated || allPaint.length > 250, scannedPaint:paint.length,
    limit:'Geometric intersections are review candidates, not visual-quality verdicts. Intentional layering, transforms and pseudo-element text need separate inspection.'};
}
