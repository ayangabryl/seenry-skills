import React, { useLayoutEffect, useRef } from 'react';
import { useFluidReducedMotion } from '../../skills/seenry-motion/assets/fluid/FluidSurface';
function Digit({value,delay,direction,reduced}) {
 const incoming=useRef(),outgoing=useRef(),last=useRef(null);
 useLayoutEffect(()=>{
  const a=incoming.current,b=outgoing.current;
  if(last.current===null||reduced){for(const el of [a,b])el.getAnimations().forEach(x=>x.cancel());a.textContent=value;b.textContent='';a.style.opacity='1';b.style.opacity='0';last.current=value;return}
  // Reuse exactly two layers. Retarget from the visible incoming glyph, never queue.
  const current=getComputedStyle(a);const start={transform:current.transform,opacity:current.opacity,filter:current.filter};
  a.getAnimations().forEach(x=>x.cancel());b.getAnimations().forEach(x=>x.cancel());
  b.textContent=a.textContent;a.textContent=value;last.current=value;
  const options={duration:500,delay,easing:'cubic-bezier(0.34,1.45,0.64,1)',fill:'both'};
  b.animate([start,{transform:`translateY(${-direction*8}px)`,opacity:0,filter:'blur(2px)'}],options);
  a.animate([{transform:`translateY(${direction*8}px)`,opacity:0,filter:'blur(2px)'},{transform:'translateY(0)',opacity:1,filter:'blur(0)'}],options);
 },[value,delay,direction,reduced]);
 useLayoutEffect(()=>()=>{incoming.current?.getAnimations().forEach(a=>a.cancel());outgoing.current?.getAnimations().forEach(a=>a.cancel())},[]);
 return <span className="nb-column"><span ref={outgoing}/><span ref={incoming}/></span>
}
export default function NumberBlur({value,direction=1}){const reduced=useFluidReducedMotion();return <span className="nb-number" aria-hidden="true">{String(value).padStart(3,' ').split('').map((v,i)=><Digit key={i} value={v} delay={i*70} direction={direction} reduced={reduced}/>)}</span>}
