// Original Design Motion presentation primitive. Use real library icons inside
// two wrapper spans; the owning button controls its label and application state.
export function createIconSwap({slot,icons,initial=0,duration=180}) {
  if(!slot||icons?.length!==2||icons.some(icon=>!slot.contains(icon)))throw new TypeError('Supply a slot with two icon wrappers');
  if(![0,1].includes(initial)||!Number.isFinite(duration)||duration<0)throw new TypeError('Invalid state or duration');
  const elements=[slot,...icons],saved=elements.map(el=>el.getAttribute('style')),aria=slot.getAttribute('aria-hidden');
  const media=matchMedia('(prefers-reduced-motion: reduce)');let current=initial,disposed=false;
  const animations=[null,null];
  slot.style.display='inline-grid';slot.setAttribute('aria-hidden','true');
  icons.forEach(icon=>{icon.style.gridArea='1 / 1';icon.style.pointerEvents='none';});
  const paint=(animate)=>icons.forEach((icon,i)=>{
    const from=getComputedStyle(icon),start={opacity:from.opacity,transform:from.transform};
    animations[i]?.cancel();animations[i]=null;
    const end={opacity:i===current?'1':'0',transform:i===current?'scale(1)':'scale(.84)'};
    Object.assign(icon.style,end);
    if(animate&&!media.matches&&duration>0&&icon.animate){
      const animation=icon.animate([start,end],{duration,easing:'cubic-bezier(.2,0,0,1)'});
      animations[i]=animation;
      animation.finished.then(()=>{if(animations[i]===animation)animations[i]=null;}).catch(()=>{});
    }
  });
  const preference=()=>paint(false);media.addEventListener('change',preference);paint(false);
  return {
    set(value){if(disposed)return;if(![0,1].includes(value))throw new TypeError('State must be 0 or 1');if(value===current)return;current=value;paint(true);},
    get state(){return current;},
    destroy(){if(disposed)return;disposed=true;media.removeEventListener('change',preference);animations.forEach(a=>a?.cancel());elements.forEach((el,i)=>saved[i]===null?el.removeAttribute('style'):el.setAttribute('style',saved[i]));aria===null?slot.removeAttribute('aria-hidden'):slot.setAttribute('aria-hidden',aria);}
  };
}
