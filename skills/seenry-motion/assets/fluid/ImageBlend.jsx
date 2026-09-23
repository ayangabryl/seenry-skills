import React from 'react';

// Original Seenry renderer: contact-local mixing with unfiltered outer faces.
// Research and limitations are recorded in references/surface-effects.md.
export default function ImageBlend({images,id}) {
 const pair=images.slice(0,2),[a,b]=pair;
 if(!a)return null;
 const cx=s=>s.x+s.w/2,cy=s=>s.y+s.h/2;
 const gap=b?Math.hypot(Math.max(0,Math.abs(cx(b)-cx(a))-(a.w+b.w)/2),Math.max(0,Math.abs(cy(b)-cy(a))-(a.h+b.h)/2)):100;
 const near=Math.max(0,1-gap/22),contact=near*near*(3-2*near);
 const x=b?(cx(a)+cx(b))/2:cx(a),y=b?(cy(a)+cy(b))/2:cy(a);
 const angle=b?Math.atan2(cy(b)-cy(a),cx(b)-cx(a))*180/Math.PI:0;
 const overlap=b?Math.max(0,(a.w+b.w)/2-Math.hypot(cx(b)-cx(a),cy(b)-cy(a))):0;
 const breadth=(18+overlap*.55)*contact;
 const extent=Math.min(a.h,b?.h||a.h)*.64;
 const bounds={x:Math.min(...pair.map(s=>s.x))-70,y:Math.min(...pair.map(s=>s.y))-70,width:Math.max(...pair.map(s=>s.x+s.w))-Math.min(...pair.map(s=>s.x))+140,height:Math.max(...pair.map(s=>s.y+s.h))-Math.min(...pair.map(s=>s.y))+140};
 const faces=()=>pair.map(s=><image key={s.key} href={s.src} x={s.x} y={s.y} width={s.w} height={s.h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-clip-${s.key})`}/>);
 return <g data-seenry-blend="contact">
  <defs>
   {pair.map(s=><clipPath key={s.key} id={`${id}-clip-${s.key}`}><rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.radius}/></clipPath>)}
   <filter id={id+'-body'} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={1+contact*6} result="soft"/><feColorMatrix in="soft" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 26 -11" result="shape"/><feGaussianBlur in="SourceGraphic" stdDeviation={1+contact*13} result="color"/><feComposite in="color" in2="shape" operator="in"/></filter>
   <filter id={id+'-fold'} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="5" result="palette"/><feTurbulence type="fractalNoise" baseFrequency=".017 .032" numOctaves="2" seed="8" result="field"/><feDisplacementMap in="palette" in2="field" scale={contact*46} xChannelSelector="R" yChannelSelector="G"/></filter>
   <filter id={id+'-fade'} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>
   <mask id={id+'-contact'} maskUnits="userSpaceOnUse" {...bounds}><ellipse cx={x} cy={y} rx={breadth} ry={extent} transform={`rotate(${angle},${x},${y})`} fill="white" filter={`url(#${id}-fade)`}/></mask>
   <mask id={id+'-sharp'} maskUnits="userSpaceOnUse" {...bounds}><rect {...bounds} fill="white"/><ellipse cx={x} cy={y} rx={breadth} ry={extent} transform={`rotate(${angle},${x},${y})`} fill="black" filter={`url(#${id}-fade)`}/></mask>
   <mask id={id+'-outline'} maskUnits="userSpaceOnUse" {...bounds}><g filter={`url(#${id}-body)`}>{pair.map(s=><rect key={s.key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.radius} fill="white"/>)}</g></mask>
  </defs>
  {contact>0&&<><g filter={`url(#${id}-body)`}>{faces()}</g><g mask={`url(#${id}-outline)`}><g mask={`url(#${id}-contact)`}><g filter={`url(#${id}-fold)`}>{faces()}</g></g></g></>}
  <g mask={contact>0?`url(#${id}-sharp)`:undefined}>{faces()}</g>
 </g>;
}
