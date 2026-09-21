/** Interruptible disclosure geometry. Caller owns business state, aria-expanded and focus. */
export function createDisclosure(panel, {duration=240, easing='cubic-bezier(.2,.7,.2,1)', reduced}={}) {
  if (!panel?.firstElementChild) throw new TypeError('A panel with one intrinsic content wrapper is required');
  if (!Number.isFinite(duration) || duration < 0) throw new TypeError('Duration must be a finite nonnegative number');
  if (reduced !== undefined && typeof reduced !== 'function') throw new TypeError('reduced must be a function');
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced=reduced ?? (()=>media.matches);
  const original={height:panel.style.height,overflow:panel.style.overflow,inert:panel.inert};
  let animation=null, open=false, disposed=false;
  panel.style.overflow='hidden'; panel.style.height='0px'; panel.inert=true;
  const pixels=value=>Number.parseFloat(value)||0;
  function targetHeight(){
    const wrapper=panel.firstElementChild, inner=getComputedStyle(wrapper), outer=getComputedStyle(panel);
    const content=wrapper.getBoundingClientRect().height+pixels(inner.marginTop)+pixels(inner.marginBottom);
    return content+(outer.boxSizing==='border-box'?pixels(outer.paddingTop)+pixels(outer.paddingBottom)+pixels(outer.borderTopWidth)+pixels(outer.borderBottomWidth):0);
  }
  function setOpen(next){
    if(disposed) return;
    if(typeof next!=='boolean') throw new TypeError('Open state must be boolean');
    // CSS used height keeps content-box and border-box measurements in the same coordinate system.
    const from=pixels(getComputedStyle(panel).height);
    animation?.cancel(); animation=null; open=next; panel.inert=!open;
    const to=open?targetHeight():0;
    panel.style.height=to+'px';
    if(!isReduced()&&duration>0&&Math.abs(to-from)>.5&&panel.animate){
      const current=panel.animate([{height:from+'px'},{height:to+'px'}],{duration,easing}); animation=current;
      current.finished.then(()=>{if(animation===current){animation=null;panel.style.height=open?'auto':'0px'}},()=>{});
    }else panel.style.height=open?'auto':'0px';
  }
  // Reflow during an animation retargets from the current visual height rather than jumping at finish.
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>{if(open&&!disposed)setOpen(true)}):null;
  observer?.observe(panel.firstElementChild);
  const preference=()=>{if(isReduced())setOpen(open)};
  media.addEventListener('change',preference);
  return {
    setOpen, get open(){return open},
    destroy(){
      if(disposed)return;
      disposed=true; animation?.cancel(); observer?.disconnect(); media.removeEventListener('change',preference);
      panel.style.height=original.height; panel.style.overflow=original.overflow; panel.inert=original.inert;
    }
  };
}
