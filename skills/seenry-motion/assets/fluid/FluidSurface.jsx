import React, { createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useCallback, useRef, useState } from 'react';

// Seenry surface renderer. Original implementation using browser SVG primitives.
// No external fluid runtime. Rendering only; the application owns semantics.
export function useFluidReducedMotion() {
 const [reduced,S]=useState(()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>S(m.matches);update();m.addEventListener('change',update);return()=>m.removeEventListener('change',update)},[]);return reduced;
}
const Context=createContext(null);
export function FluidSurface({children,fill='#202020',blur=6,contrast=18,shadow,filterPadding=32,...props}) {
 const host=useRef(),items=useRef(new Map()),memory=useRef(new Map()),wake=useRef(()=>{});const [shapes,S]=useState([]);const reduced=useFluidReducedMotion();const id='seenry-'+useId().replace(/:/g,'');
 const context=useMemo(()=>({reduced,register(key,node,effect){items.current.set(key,{node,effect});wake.current();return()=>{items.current.delete(key);wake.current()}},wake:()=>wake.current()}),[reduced]);
 useLayoutEffect(()=>{
  if(reduced){memory.current.clear();S([]);return}
  let frame=0,until=0,previous=0;const positions=memory.current;
  const tick=time=>{
   frame=0;if(!host.current)return;const base=host.current.getBoundingClientRect();const dt=Math.min((time-previous)/1000||.016,.032);previous=time;const result=[];let moving=false;
   for(const [key,{node,effect}] of items.current){
    if(!node.isConnected)continue;const box=node.getBoundingClientRect(),style=getComputedStyle(node);
    const target={x:box.left-base.left,y:box.top-base.top,w:box.width,h:box.height};
    let last=positions.get(key);if(!last)last={...target,vx:0,vy:0,tx:target.x,ty:target.y,bx:0,by:0};
    const dx=target.x-last.x,dy=target.y-last.y;
    const smoothing=effect==='morph'?1-Math.exp(-dt*32):1;
    const tailRate=1-Math.exp(-dt*18);
    const tailX=effect==='move'?last.x+dx*tailRate:target.x;
    const tailY=effect==='move'?last.y+dy*tailRate:target.y;
    const velocityX=(target.x-last.tx)/Math.max(dt,.008),velocityY=(target.y-last.ty)/Math.max(dt,.008);
    const decay=1-Math.exp(-dt*14);
    const bx=last.bx+(Math.max(-18,Math.min(18,-velocityX*.025))-last.bx)*decay;
    const by=last.by+(Math.max(-18,Math.min(18,-velocityY*.025))-last.by)*decay;
    const current={x:effect==='move'?tailX:last.x+dx*smoothing,y:effect==='move'?tailY:last.y+dy*smoothing,w:last.w+(target.w-last.w)*smoothing,h:last.h+(target.h-last.h)*smoothing,vx:target.x-tailX,vy:target.y-tailY,tx:target.x,ty:target.y,bx,by};
    moving ||= Math.abs(dx)+Math.abs(dy)+Math.abs(target.w-current.w)+Math.abs(target.h-current.h)+Math.abs(bx)+Math.abs(by)>.12;
    positions.set(key,current);
    const painted=effect==='move'?{...current,x:target.x,y:target.y}:current;
    const parsed=parseFloat(style.borderRadius)||0;const radius=style.borderRadius.includes('%')?Math.min(current.w,current.h)/2:Math.min(parsed,current.w/2,current.h/2);
    const img=node.querySelector('img');result.push({...painted,key,effect,radius,src:img?.currentSrc||img?.src,opacity:parseFloat(style.opacity)||0});
   }
   S(result);if(time<until||moving)frame=requestAnimationFrame(tick);
  };
  const run=()=>{until=performance.now()+1000;if(!frame)frame=requestAnimationFrame(tick)};wake.current=run;
  const resize=new ResizeObserver(run);resize.observe(host.current);
  // Only watch the content branch, never our SVG frame updates.
  const observers=[];for(const {node} of items.current.values()){resize.observe(node);const o=new MutationObserver(run);o.observe(node,{attributes:true,childList:true,subtree:true,attributeFilter:['style','class']});observers.push(o)}
  host.current.addEventListener('transitionrun',run);host.current.addEventListener('pointerdown',run);run();
  return()=>{cancelAnimationFrame(frame);resize.disconnect();observers.forEach(o=>o.disconnect());host.current?.removeEventListener('transitionrun',run);host.current?.removeEventListener('pointerdown',run);wake.current=()=>{}};
 },[reduced,children]);
 const solid=shapes.filter(s=>s.effect!=='melt');const images=shapes.filter(s=>s.effect==='melt');
 return <Context.Provider value={context}><div {...props} ref={host} style={{position:'relative',isolation:'isolate',...props.style,'--fluid-fill':fill}}>
 {!reduced&&<svg aria-hidden="true" width="100%" height="100%" style={{position:'absolute',inset:0,overflow:'visible',pointerEvents:'none',zIndex:0}}>
 <defs><filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={blur}/><feColorMatrix type="matrix" values={`1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${contrast} ${-(contrast-1)/2}`}/></filter><filter id={id+'-seam'} x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".025" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
 <g filter={`url(#${id})`} fill={fill}>{solid.map(s=>{
 const bend=s.effect==='bend'?s.by:0;
 const stretchX=s.effect==='move'?Math.max(-s.w*.7,Math.min(s.w*.7,s.vx)) : 0;
 const stretchY=s.effect==='move'?Math.max(-s.h*.6,Math.min(s.h*.6,s.vy)) : 0;
 const x=s.x-Math.max(0,stretchX),y=s.y-Math.max(0,stretchY),w=s.w+Math.abs(stretchX),h=s.h+Math.abs(stretchY);
 const r=s.radius,side=s.effect==='bend'?s.bx:0;
 return <g key={s.key}>{s.effect==='bend'?<path d={`M${s.x+r},${s.y} Q${s.x+s.w/2},${s.y+bend} ${s.x+s.w-r},${s.y} Q${s.x+s.w},${s.y} ${s.x+s.w},${s.y+r} Q${s.x+s.w+side},${s.y+s.h/2} ${s.x+s.w},${s.y+s.h-r} Q${s.x+s.w},${s.y+s.h} ${s.x+s.w-r},${s.y+s.h} Q${s.x+s.w/2},${s.y+s.h+bend} ${s.x+r},${s.y+s.h} Q${s.x},${s.y+s.h} ${s.x},${s.y+s.h-r} Q${s.x+side},${s.y+s.h/2} ${s.x},${s.y+r} Q${s.x},${s.y} ${s.x+r},${s.y} Z`}/>:<rect x={x} y={y} width={w} height={h} rx={r}/>}</g>
 })}</g>
 {images.map(s=><g key={s.key}><defs><clipPath id={id+s.key}><rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.radius}/></clipPath></defs><image href={s.src} x={s.x} y={s.y} width={s.w} height={s.h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id+s.key})`}/></g>)}
 {images.length===2&&(()=>{const [a,b]=images;const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),w=Math.min(a.x+a.w,b.x+b.w)-x,h=Math.min(a.y+a.h,b.y+b.h)-y;if(w<=0||h<=0)return null;return <g><defs><clipPath id={id+'-contact'}><rect x={x} y={y} width={w} height={h} rx={Math.min(a.radius,b.radius)}/></clipPath><linearGradient id={id+'-fade'}><stop stopColor="white" stopOpacity="0"/><stop offset=".5" stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient><mask id={id+'-mask'}><rect x={x} y={y} width={w} height={h} fill={`url(#${id}-fade)`}/></mask></defs><g clipPath={`url(#${id}-contact)`} mask={`url(#${id}-mask)`} filter={`url(#${id}-seam)`}>{images.map(s=><image key={s.key} href={s.src} x={s.x} y={s.y} width={s.w} height={s.h} opacity=".6" preserveAspectRatio="xMidYMid slice"/>)}</g></g>})()}
 </svg>}{children}</div></Context.Provider>
}
export function FluidItem({children,x=0,y=0,scale=1,effect='merge',transition,delay=0,morph}) {
 const ctx=useContext(Context);const ref=useRef();const key=useId().replace(/:/g,'');const animated=transition!==undefined||x!==0||y!==0;
 useLayoutEffect(()=>{const node=ref.current;if(!node||!ctx)return;const original={background:node.style.background,opacity:node.style.opacity,position:node.style.position,zIndex:node.style.zIndex};if(getComputedStyle(node).position==='static')node.style.position='relative';node.style.zIndex='1';if(!ctx.reduced){if(effect==='melt')node.style.opacity='0';else node.style.background='transparent'}const unregister=ctx.register(key,node,effect);return()=>{unregister();node.style.background=original.background;node.style.opacity=original.opacity;node.style.position=original.position;node.style.zIndex=original.zIndex}},[ctx,key,effect]);
 useLayoutEffect(()=>{ctx?.wake()},[x,y,scale,children]);
 const element=React.Children.only(children);const originalRef=element.props.ref;const assign=useCallback(node=>{ref.current=node;if(typeof originalRef==='function')originalRef(node);else if(originalRef)originalRef.current=node},[originalRef]);
 const child=React.cloneElement(element,{ref:assign});
 const duration=ctx?.reduced?0:typeof transition==='object'?(transition.duration||420):420;
 return animated?<div style={{position:'relative',zIndex:1,transform:`translate(${x}px,${y}px) scale(${scale})`,transition:`transform ${duration}ms ${transition?.ease||'cubic-bezier(.22,1,.36,1)'} ${ctx?.reduced?0:delay}ms`}}>{child}</div>:<div style={{display:'contents'}}>{child}</div>
}
