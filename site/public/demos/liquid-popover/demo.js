import { createMenuHighlight } from './hover.mjs';
import{leftSamples,rightSamples,leftCloseSamples,sample,interpolate}from'./motion.mjs';
const stage=document.querySelector('#stage'),media=matchMedia('(prefers-reduced-motion:reduce)'),status=document.querySelector('#status');
let schedule=[],replay=false;
const controls=[{id:'left',trigger:document.querySelector('#actions'),menu:document.querySelector('#actions-menu'),samples:leftSamples,anchor:[407,347,74,74,37],final:[309,67,271,264,30]}, {id:'right',trigger:document.querySelector('#share'),menu:document.querySelector('#share-menu'),samples:rightSamples,anchor:[622,353,132,62,31],final:[623,430,267,190,30]}];
const clamp=v=>Math.max(0,Math.min(1,v));
function shifted(c,rect){const w=stage.clientWidth,h=stage.clientHeight,dx=(w-1154)/2,dy=(h-720)/2;if(w>=700)return rect.map((v,i)=>v+(i===0?dx:i===1?dy:0));
 const ax=c.id==='left'?Math.max(26,w*.26-37):Math.min(w-158,w*.69-66),ay=Math.min(h-280,345);const mx=c.id==='left'?Math.max(12,Math.min(w-283,ax+37-135.5)):Math.max(12,Math.min(w-279,ax));
 const targetY=c.id==='left'?ay-280:ay+78,ratio=clamp((rect[2]-c.anchor[2])/(c.final[2]-c.anchor[2]));return [ax+(mx-ax)*ratio,ay+(targetY-ay)*((rect[1]-c.anchor[1])/(c.final[1]-c.anchor[1])),...rect.slice(2)];}
function attrs(el,r){for(const[k,v]of Object.entries({x:r[0],y:r[1],width:r[2],height:r[3],rx:r[4]}))el.setAttribute(k,v)}
function draw(c){
 const anchor=shifted(c,c.anchor),end=shifted(c,c.final),r=shifted(c,c.rect),fill=document.querySelector('#'+c.id+'-fill'),body=fill.querySelector('.menu-fill'),bridge=fill.querySelector('.bridge');
 attrs(fill.querySelector('.trigger-fill'),anchor);attrs(body,r);body.style.opacity=c.phase===0?'0':'1';
 Object.assign(c.trigger.style,{left:anchor[0]+'px',top:anchor[1]+'px',width:anchor[2]+'px',height:anchor[3]+'px'});
 Object.assign(c.menu.style,{left:end[0]+'px',top:end[1]+'px',width:end[2]+'px',height:end[3]+'px'});
 const left=r[0]-end[0],top=r[1]-end[1],right=left+r[2],bottom=top+r[3];
 // Contents retain final coordinates while the observed shell clips past them.
 c.menu.style.clipPath=`inset(${Math.max(0,top)}px ${Math.max(0,end[2]-right)}px ${Math.max(0,end[3]-bottom)}px ${Math.max(0,left)}px round ${r[4]}px)`;
 const alpha=c.closing?Math.pow(clamp((c.phase-.45)/.4),2):clamp((c.phase-.15)/.45);c.menu.style.opacity=alpha;c.menu.style.filter=`blur(${c.closing?clamp((.9-c.phase)/.45)*6:(1-clamp((c.phase-.22)/.38))*3}px)`;
 const gap=c.id==='left'?anchor[1]-(r[1]+r[3]):r[1]-(anchor[1]+anchor[3]);const joined=c.phase>.015&&(c.phase<.55||gap<8);
 bridge.style.display=joined?'':'none';
 if(joined){
  const up=c.id==='left',cx=anchor[0]+anchor[2]/2,ey=up?r[1]+r[3]-10:r[1]+10,ay=up?anchor[1]+15:anchor[1]+anchor[3]-15;
  const neck=Math.min(25,Math.max(1,27*(1-c.phase/.55))),bw=Math.min(r[2]/2-4,neck+17),mid=(ey+ay)/2;
  bridge.setAttribute('d',`M${cx-bw} ${ey} C${cx-bw} ${mid},${cx-neck} ${mid},${cx-neck} ${ay} L${cx+neck} ${ay} C${cx+neck} ${mid},${cx+bw} ${mid},${cx+bw} ${ey}Z`);
 }
 fill.style.filter=joined?'url(#soft-join)':'';
 c.menu.dataset.phase=c.phase.toFixed(4);c.menu.dataset.bounds=JSON.stringify(r.map(v=>+v.toFixed(2)));
}
function stop(){schedule.forEach(clearTimeout);schedule=[];replay=false}
function set(c,open,{focus=false,instant=false,manual=true}={}){
 if(manual)stop();if(open===c.open&&!instant)return;
 if(!open&&c.menu.contains(document.activeElement))c.trigger.focus();
 const previousPhase=c.phase,previousRect=[...c.rect];cancelAnimationFrame(c.raf);c.open=open;c.closing=!open;c.menu.inert=!open;if(!open)c.highlight?.hide();c.menu.dataset.open=String(open);c.trigger.setAttribute('aria-expanded',String(open));
 if(open){for(const other of controls)if(other!==c&&other.open)set(other,false,{manual:false});}
 if(instant||media.matches){c.phase=open?1:0;c.rect=open?[...c.final]:[...c.anchor];draw(c);}
 else{
 const duration=open?340*(1-previousPhase):(c.id==='left'?300:200)*previousPhase,start=performance.now();
 const tick=now=>{
  const t=clamp((now-start)/Math.max(1,duration));
  c.phase=open?previousPhase+(1-previousPhase)*t:previousPhase*(1-t);
  if(open&&previousPhase<.001)c.rect=sample(c.samples,t);
  else if(!open&&previousPhase>.999&&c.id==='left'){c.rect=sample(leftCloseSamples,t);}
  else if(!open){const eased=t*t*(3-2*t);c.rect=interpolate(previousRect,c.anchor,eased);c.rect[4]=previousRect[4]+(c.anchor[4]-previousRect[4])*eased;}
  else c.rect=interpolate(previousRect,c.final,1-Math.pow(1-t,3));
  draw(c);if(t<1)c.raf=requestAnimationFrame(tick);else{c.phase=open?1:0;c.rect=open?[...c.final]:[...c.anchor];draw(c);}
 };c.raf=requestAnimationFrame(tick);
 }
 if(focus&&open)c.menu.querySelector('button').focus();
}
for(const c of controls){c.highlight=createMenuHighlight(c.menu,media);c.open=false;c.phase=0;c.rect=[...c.anchor];c.raf=0;draw(c);
 c.trigger.addEventListener('click',e=>set(c,!c.open,{focus:e.detail===0}));
 c.trigger.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();set(c,true,{focus:true});if(e.key==='ArrowUp')c.menu.querySelector('button:last-child').focus();}});
 c.menu.addEventListener('keydown',e=>{const items=[...c.menu.querySelectorAll('button')],i=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowUp'?-1:1)+items.length)%items.length].focus();}if(e.key==='Escape'){e.preventDefault();set(c,false);}});
 c.menu.addEventListener('click',async e=>{const item=e.target.closest('button');if(!item)return;const label=item.textContent.trim();set(c,false);if(label==='Copy link'){try{await navigator.clipboard.writeText(location.href);status.textContent='Link copied.'}catch{status.textContent='Copy unavailable. Use the page address.'}}else status.textContent=label+' selected. This is a local interaction study.';});
}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.trigger,.menu'))for(const c of controls)set(c,false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const c of controls)set(c,false)});
document.addEventListener('focusin',e=>{for(const c of controls)if(c.open&&e.target!==c.trigger&&!c.menu.contains(e.target))set(c,false)});
media.addEventListener('change',()=>{for(const c of controls)set(c,c.open,{instant:true,manual:false})});new ResizeObserver(()=>controls.forEach(draw)).observe(stage);
function replaySequence(){stop();status.textContent='';for(const c of controls)set(c,false,{instant:true,manual:false});replay=true;for(const [ms,id,open]of[[683,0,true],[3100,0,false],[3833,0,true],[4700,0,false],[5600,1,true],[7200,1,false],[8200,1,true],[9333,1,false]])schedule.push(setTimeout(()=>set(controls[id],open,{manual:false}),ms));for(const[ms,id,index]of[[1300,0,3],[1650,0,2],[1950,0,1],[2333,0,2],[2600,0,3],[4083,0,3],[6233,1,0],[6533,1,1],[6800,1,2],[8716,1,0],[8950,1,1],[9233,1,2]])schedule.push(setTimeout(()=>controls[id].highlight.show(controls[id].menu.querySelectorAll('button')[index]),ms));}
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;const m=e.data;if(m?.type==='replay')replaySequence();if(m?.type==='state'){stop();for(const c of controls)set(c,m.id===c.id,{instant:true,manual:false})}if(m?.type==='phase'){stop();const c=controls.find(x=>x.id===m.id);if(!c)return;for(const other of controls)set(other,false,{instant:true,manual:false});c.closing=!!m.close;c.phase=m.close?1-clamp(m.phase):clamp(m.phase);c.rect=sample(m.close?leftCloseSamples:c.samples,clamp(m.phase));c.open=c.phase>0;c.menu.inert=true;c.menu.dataset.open='false';draw(c);}});
