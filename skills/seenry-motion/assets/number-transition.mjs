// Optional browser presentation adapter. NumberFlow owns the digit animation;
// the application still owns the real value, control semantics and announcements.
import NumberFlow, {canAnimate} from './number-flow/index.mjs';

export function createNumberTransition({slot, value, locales='en', format={}, duration=360, reserveValues=[]}) {
  if (!(slot instanceof HTMLElement) || slot.children.length || !Number.isFinite(value)) {
    throw new TypeError('Supply a text-only element and a finite initial value');
  }
  if (!Number.isFinite(duration) || duration<0 || duration>5000 || !Array.isArray(reserveValues) || reserveValues.some(v=>!Number.isFinite(v))) {
    throw new TypeError('Use a 0–5000ms duration and finite reserve values');
  }
  const formatter=new Intl.NumberFormat(locales, format), resolved=formatter.resolvedOptions();
  const direction=getComputedStyle(slot).direction;
  // NumberFlow 0.6.2 does not support non-Latin numerals, RTL or exponential notation.
  const supported=resolved.numberingSystem==='latn' && direction!=='rtl' && !['scientific','engineering'].includes(resolved.notation);
  const text=document.createElement('span'), visual=supported ? new NumberFlow() : document.createElement('span');
  text.dataset.numberText=''; visual.dataset.numberVisual=''; visual.setAttribute('aria-hidden','true');
  Object.assign(text.style,{position:'absolute',width:'1px',height:'1px',padding:'0',margin:'-1px',overflow:'hidden',clipPath:'inset(50%)',whiteSpace:'nowrap',border:'0'});
  Object.assign(visual.style,{display:'inline-block',textAlign:'end',fontVariantNumeric:'tabular-nums'});
  if (supported) {
    visual.locales=locales;visual.format=Object.freeze({...format});
    visual.transformTiming={duration,easing:'cubic-bezier(.2,.7,.2,1)'};
    visual.opacityTiming={duration:Math.min(duration,160),easing:'ease-out'};
    visual.respectMotionPreference=true;
  }
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let current=value, disposed=false;
  const settlePreference=()=>{if(supported)visual.animated=!media.matches && duration>0;};
  const write=(next,instant=false)=>{
    if(disposed)return;
    if(!Number.isFinite(next))throw new TypeError('Number transitions require a finite value');
    current=next;text.textContent=formatter.format(next);
    if(supported){visual.animated=!instant&&!media.matches&&duration>0;visual.update(next);}
    else visual.textContent=formatter.format(next);
  };
  const measure=()=>{
    if(disposed||!reserveValues.length)return;
    const probe=document.createElement('span');
    Object.assign(probe.style,{position:'absolute',visibility:'hidden',whiteSpace:'pre',fontVariantNumeric:'tabular-nums'});
    slot.append(probe);let width=0;
    for(const n of [...reserveValues,current]){probe.textContent=formatter.format(n);width=Math.max(width,probe.getBoundingClientRect().width);}
    probe.remove();visual.style.minInlineSize=`${Math.ceil(width)}px`;
  };
  slot.replaceChildren(text,visual);write(value,true);measure();
  media.addEventListener('change',settlePreference);
  // Remeasure only on actual container/font changes, never per animation frame.
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);observer?.observe(slot.parentElement||slot);
  document.fonts?.addEventListener('loadingdone',measure);document.fonts?.ready.then(measure);
  return {
    get value(){return current;},
    get animationSupported(){return supported&&canAnimate;},
    update(next){write(next);},
    set(next){write(next,true);},
    refresh:measure,
    destroy(){if(disposed)return;disposed=true;media.removeEventListener('change',settlePreference);observer?.disconnect();document.fonts?.removeEventListener('loadingdone',measure);if(supported)visual.animated=false;slot.replaceChildren(document.createTextNode(formatter.format(current)));}
  };
}
