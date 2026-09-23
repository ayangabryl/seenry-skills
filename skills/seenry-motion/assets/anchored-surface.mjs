// Seenry, MIT. Proposed product motion, not a source-reference trajectory.
export function createAnchoredSurface(panel, trigger, { duration = 280 } = {}) {
  if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Duration must be positive');
  const svg=panel.querySelector('svg[data-surface]'),shell=svg.querySelector('[data-shell]'),bridge=svg.querySelector('[data-bridge]'),content=panel.querySelector('[data-content]'),media=matchMedia('(prefers-reduced-motion: reduce)');
  let rect,progress=0,open=false,frame=0,disposed=false;
  const geometry=()=>{const p=panel.getBoundingClientRect(),t=trigger.getBoundingClientRect();return{anchor:[t.left-p.left,t.top-p.top,t.width,t.height,t.height/2],end:[0,0,p.width,p.height,22]}};
  const draw=()=>{
    const {anchor:a}=geometry(),[x,y,w,h,r]=rect;
    for(const [key,value]of Object.entries({x,y,width:w,height:h,rx:r}))shell.setAttribute(key,value);
    const cx=a[0]+a[2]/2,ay=a[1]+a[3]/2,edge=y+h-3,gap=ay-edge,joined=progress>0&&progress<.72&&gap<75&&edge<ay;
    bridge.style.display=joined?'':'none';
    if(joined){const neck=Math.max(1,12*(1-progress/.72)),root=neck+8,mid=(ay+edge)/2;bridge.setAttribute('d',`M${cx-root} ${edge} C${cx-root} ${mid},${cx-neck} ${mid},${cx-neck} ${ay} Q${cx} ${ay+8},${cx+neck} ${ay} C${cx+neck} ${mid},${cx+root} ${mid},${cx+root} ${edge}Z`)}
    panel.style.visibility=progress>0?'visible':'hidden';content.style.opacity=String(Math.max(0,Math.min(1,(progress-.5)/.4)));panel.dataset.surfaceProgress=progress.toFixed(3);
  };
  const setOpen=next=>{
    if(disposed)return;if(typeof next!=='boolean')throw new TypeError('Open state must be boolean');cancelAnimationFrame(frame);open=next;
    const {anchor,end}=geometry(),to=open?end:anchor,from=rect||anchor,startProgress=progress,goal=open?1:0;
    if(media.matches){rect=to;progress=goal;draw();return}
    const start=performance.now(),ms=(open?duration:180)*Math.max(.3,Math.abs(goal-progress));
    const tick=now=>{const t=Math.max(0,Math.min(1,(now-start)/ms)),ease=1-Math.pow(1-t,3);rect=from.map((v,i)=>v+(to[i]-v)*ease);progress=startProgress+(goal-startProgress)*ease;draw();if(t<1)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);
  };
  const settle=()=>{cancelAnimationFrame(frame);const g=geometry();rect=open?g.end:g.anchor;progress=open?1:0;draw()};
  const resize=new ResizeObserver(settle);resize.observe(panel);resize.observe(trigger);
  const preference=()=>{if(media.matches)settle()};media.addEventListener('change',preference);settle();
  return{setOpen,destroy(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();media.removeEventListener('change',preference);panel.style.visibility='';content.style.opacity='';delete panel.dataset.surfaceProgress;}};
}
