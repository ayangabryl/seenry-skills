// Design Motion adapter around the pinned, unmodified Morphicons DOM engine.
// Icons are real library data, not hand-authored approximations. No app state here.
import { createMorph } from './morphicons/dom.js';

export function createMorphIcon({slot, initial, size=18, strokeWidth=1.8, spring='snappy'}) {
  if (!slot || !initial || !Number.isFinite(size) || size<=0) throw new TypeError('Supply an empty icon slot, library icon data and positive size');
  if (slot.childNodes.length) throw new TypeError('Icon slot must be empty');
  const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg'), path=document.createElementNS(ns,'path');
  for (const [key,value] of Object.entries({viewBox:'0 0 24 24',width:size,height:size,fill:'none',stroke:'currentColor','stroke-width':strokeWidth,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'})) svg.setAttribute(key,String(value));
  svg.style.display='block';svg.append(path);slot.append(svg);
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let current=initial,disposed=false,morph;
  try { morph=createMorph(path,initial,{reducedMotion:'user'}); }
  catch(error) {svg.remove();throw error;}
  const preference=()=>{if(media.matches)morph.set(current);};
  media.addEventListener('change',preference);
  return {
    to(icon){if(disposed)return;current=icon;morph.morphTo(icon,spring);},
    set(icon){if(disposed)return;current=icon;morph.set(icon);},
    destroy(){if(disposed)return;disposed=true;media.removeEventListener('change',preference);morph.destroy();svg.remove();}
  };
}
